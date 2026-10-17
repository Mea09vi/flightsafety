// เข้ารหัสประวัติเหตุ บน.2 (ทะเบียนเหตุจากที่ประชุม + MOR/HR) → app/data/history.enc.json
//
// ใช้:
//   node tools/encrypt_history.mjs <history.json นอก repo>
// แล้วพิมพ์รหัสหน่วยตัวเดียวกับ unit.enc.json ในเทอร์มินัล 2 ครั้ง (หรือส่งทาง W2_PASSPHRASE)
//
// ต้องมี app/data/unit.enc.json อยู่ก่อน: ใช้ salt และรอบ PBKDF2 ของไฟล์นั้น เพื่อให้กุญแจที่แอปจำไว้
// ตอนปลดล็อกเคสหน่วยเปิดไฟล์นี้ได้ด้วย และสคริปต์จะลองเปิด unit.enc.json ด้วยรหัสที่พิมพ์ก่อน
// ถ้าเปิดไม่ได้ = รหัสไม่ตรงกับของหน่วย → ไม่เขียนไฟล์
//
// ข้อมูลภาษาไทยเยอะ (~5 MB) จึงบีบอัด gzip ก่อนเข้ารหัส (ช่อง z:'gzip') แอปคลายด้วย DecompressionStream
// ช่อง img (ชื่อไฟล์รูปจากเอกสารต้นฉบับ) ถูกตัดออกเสมอ
// --img <โฟลเดอร์นอก repo> = รูปที่คัดกรองแล้ว (เบลอ/ตัดทิ้งแล้ว ไฟล์ .webp ชื่อเดียวกับ img) → เข้ารหัสทีละไฟล์ด้วยกุญแจเดียวกัน
//   ที่ app/data/hie/<id>.bin (iv 12 ไบต์ + ciphertext) id = sha256(salt + ชื่อไฟล์) ไม่บอกชื่อเรื่อง · รายการได้ช่อง ie = [id]
//   รูปที่ไม่อยู่ในโฟลเดอร์ (ถูกตัดทิ้งตอนคัดกรอง) ไม่ขึ้น · ไฟล์ .bin เก่าในโฟลเดอร์ถูกลบก่อนเขียนใหม่
import { webcrypto as crypto } from 'node:crypto';
import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync, gzipSync } from 'node:zlib';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const OUT = resolve(ROOT, 'app/data/history.enc.json');
const UNIT = resolve(ROOT, 'app/data/unit.enc.json');
const HIE = resolve(ROOT, 'app/data/hie');

// อ่านรหัสจากแป้นพิมพ์โดยแสดงเป็น * แทนตัวอักษร (เหมือน encrypt_unit.mjs)
function ask(q) {
  const { stdin, stdout } = process;
  return new Promise((res) => {
    stdout.write(q);
    stdin.setRawMode(true); stdin.setEncoding('utf8'); stdin.resume();
    let s = '';
    const end = () => { stdin.off('data', on); stdin.setRawMode(false); stdin.pause(); stdout.write('\n'); };
    const on = (chunk) => {
      for (const ch of chunk) {
        if (ch === '\r' || ch === '\n') { end(); res(s); return; }
        if (ch === '\u0003') { end(); process.exit(130); }
        if (ch === '\u007f' || ch === '\b') { if (s) { s = [...s].slice(0, -1).join(''); stdout.write('\b \b'); } continue; }
        if (ch < ' ') continue;
        s += ch; stdout.write('*');
      }
    };
    stdin.on('data', on);
  });
}

const args = process.argv.slice(2);
const imgAt = args.indexOf('--img');
const imgDir = imgAt >= 0 ? resolve(args.splice(imgAt, 2)[1] || '') : null;
const input = args[0];
if (!input) {
  console.error('ใช้: node tools/encrypt_history.mjs <history.json นอก repo> [--img <โฟลเดอร์รูปที่คัดกรองแล้ว นอก repo>]');
  process.exit(1);
}
const inPath = resolve(input);
if (!relative(ROOT, inPath).startsWith('..')) {
  console.error('ไฟล์ input อยู่ใน repo — ย้ายออกไปไว้นอก repo ก่อน (ห้ามมีข้อมูลดิบของหน่วยใน repo)');
  process.exit(1);
}
let unit;
try { unit = JSON.parse(await readFile(UNIT, 'utf8')); }
catch { console.error('ไม่พบ app/data/unit.enc.json — เข้ารหัสเคสหน่วยก่อน (ประวัติเหตุใช้กุญแจเดียวกัน)'); process.exit(1); }

let pass = process.env.W2_PASSPHRASE;
if (!pass) {
  if (!process.stdin.isTTY) {
    console.error('เทอร์มินัลนี้ซ่อนตัวอักษรไม่ได้ — รันใน PowerShell หรือ Windows Terminal หรือส่งรหัสทาง W2_PASSPHRASE');
    process.exit(1);
  }
  pass = await ask('รหัสผ่านหน่วย: ');
  if (pass !== await ask('พิมพ์ซ้ำอีกครั้ง: ')) {
    console.error('รหัสสองครั้งไม่ตรงกัน ยังไม่ได้เขียนไฟล์');
    process.exit(1);
  }
}

const b64d = (s) => Buffer.from(s, 'base64');
const b64 = (u) => Buffer.from(u).toString('base64');
const salt = b64d(unit.salt);
const iter = unit.iter;
// derive แบบเดียวกับ deriveKey() ใน app/app.js
async function deriveKey(p, use) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(p.normalize('NFC')), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iter },
    base, { name: 'AES-GCM', length: 256 }, false, [use]);
}
let unitIds;
try {
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64d(unit.iv) }, await deriveKey(pass.trim(), 'decrypt'), b64d(unit.ct));
  unitIds = new Set(JSON.parse(Buffer.from(plain).toString('utf8')).cases.map((c) => c.id));
} catch {
  console.error('รหัสนี้เปิด unit.enc.json ไม่ได้ — ต้องใช้รหัสหน่วยตัวเดียวกัน ยังไม่ได้เขียนไฟล์');
  process.exit(1);
}

const data = JSON.parse(await readFile(inPath, 'utf8'));
if (!Array.isArray(data.items) || !data.items.length) { console.error('ไม่พบ items[] ในไฟล์ input'); process.exit(1); }
// ลิงก์ไปการ์ดที่ไม่อยู่ใน unit.enc แอปจะซ่อนเอง — แจ้งจำนวนให้รู้ว่าแผง D จะเห็นกี่ใบ
const linked = Object.keys(data.cardLinks || {}).filter((id) => !id.startsWith('INTL'));
const shown = linked.filter((id) => unitIds.has(id)).length;
console.log(`การ์ดหน่วยที่ประวัติลิงก์ถึง ${linked.length} ใบ · อยู่ใน unit.enc.json ${shown} ใบ (การ์ดหน่วยในไฟล์ ${unitIds.size} ใบ)`);
let imgFiles = null;
if (imgDir) {
  if (!relative(ROOT, imgDir).startsWith('..')) { console.error('โฟลเดอร์รูปอยู่ใน repo — ต้องอยู่นอก repo'); process.exit(1); }
  imgFiles = new Set((await readdir(imgDir)).filter((f) => f.endsWith('.webp')));
}
const imgId = (f) => createHash('sha256').update(unit.salt + '/' + f).digest('hex').slice(0, 24);
const toEnc = new Map();
const items = data.items.map(({ img, ...it }) => {
  const keep = imgFiles ? (img || []).filter((f) => imgFiles.has(f)) : [];
  if (keep.length) it.ie = keep.map((f) => { const id = imgId(f); toEnc.set(id, f); return id; });
  return it;
});
const payload = { ...data, items };
const raw = Buffer.from(JSON.stringify(payload));
const zipped = gzipSync(raw, { level: 9 });
const iv = crypto.getRandomValues(new Uint8Array(12));
const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await deriveKey(pass.trim(), 'encrypt'), zipped);
await writeFile(OUT, JSON.stringify({ v: 1, kdf: 'PBKDF2-SHA256', iter, salt: unit.salt, z: 'gzip', iv: b64(iv), ct: b64(ct) }) + '\n');

// อ่านไฟล์ที่เพิ่งเขียนกลับมาถอดรหัส + คลาย gzip แบบที่แอปทำ
const enc = JSON.parse(await readFile(OUT, 'utf8'));
const back = JSON.parse(gunzipSync(Buffer.from(await crypto.subtle.decrypt(
  { name: 'AES-GCM', iv: b64d(enc.iv) }, await deriveKey(pass.trim(), 'decrypt'), b64d(enc.ct)))).toString('utf8'));
if (back.items.length !== data.items.length) { console.error('ถอดรหัสกลับแล้วจำนวนรายการไม่ตรง'); process.exit(1); }
const kb = (n) => Math.round(n / 1024);
if (imgDir) {
  await mkdir(HIE, { recursive: true });
  for (const f of await readdir(HIE)) if (f.endsWith('.bin')) await rm(join(HIE, f));
  const key = await deriveKey(pass.trim(), 'encrypt');
  const dkey = await deriveKey(pass.trim(), 'decrypt');
  let bytes = 0;
  for (const [id, f] of toEnc) {
    const src = await readFile(join(imgDir, f));
    const v = crypto.getRandomValues(new Uint8Array(12));
    const c = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: v }, key, src));
    const out = Buffer.concat([Buffer.from(v), Buffer.from(c)]);
    await writeFile(join(HIE, id + '.bin'), out);
    const back = Buffer.from(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: out.subarray(0, 12) }, dkey, out.subarray(12)));
    if (!back.equals(src)) { console.error('ถอดรหัสรูปกลับไม่ตรง: ' + id); process.exit(1); }
    bytes += out.length;
  }
  console.log(`รูป ${toEnc.size} ไฟล์ (${kb(bytes)} KB) → ${relative(ROOT, HIE)}/ · ใน ${items.filter((x) => x.ie).length} รายการ · ทดลองถอดกลับตรงทุกไฟล์`);
}
console.log(`เข้ารหัส ${data.items.length} รายการ (${kb(raw.length)} KB → gzip ${kb(zipped.length)} KB) → ${relative(ROOT, OUT)} · ทดลองถอดรหัสกลับแล้วได้ครบ ${back.items.length} รายการ`);
