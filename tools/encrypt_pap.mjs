// เข้ารหัสข้อมูลแผน PAP (คู่มือย่อจากระเบียบ บน.2 + ทะเบียนการซ้อม) → app/data/pap.enc.json
//
// ใช้:  node tools/encrypt_pap.mjs <pap.json นอก repo> [--img <โฟลเดอร์รูปซ้อมที่คัดแล้ว นอก repo>]
// แล้วพิมพ์รหัสหน่วยตัวเดียวกับ unit.enc.json 2 ครั้ง (หรือส่งทาง W2_PASSPHRASE)
//
// ใช้ salt และรอบ PBKDF2 ของ unit.enc.json เหมือน encrypt_regs.mjs เพื่อให้กุญแจที่แอปจำไว้ตอนปลดล็อกเปิดได้ทันที
// --img = รูปซ้อม .webp ที่คัดแล้ว (ชื่อเดียวกับ drills[].img[].f) → เข้ารหัสทีละไฟล์ที่ app/data/pie/<id>.bin
//   (iv 12 ไบต์ + ciphertext แบบเดียวกับ hie/ ของประวัติเหตุ แต่แยกโฟลเดอร์เพราะ encrypt_history ล้าง hie/ ทุกครั้ง)
//   id = sha256(salt + '/pap/' + ชื่อไฟล์) · img ในไฟล์เข้ารหัสเป็น [{f: 'pie/<id>'}] · ไม่ใส่ --img = ตัดรูปออกทั้งหมด
// ไม่มีแผนที่ Crash Grid, ข่ายวิทยุ, เบอร์โทร และชื่อบุคคล (ผู้ใช้ตัดสิน 21 ต.ค. 2569 ดู DECISIONS)
import { createHash, webcrypto as crypto } from 'node:crypto';
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync, gzipSync } from 'node:zlib';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const OUT = resolve(ROOT, 'app/data/pap.enc.json');
const UNIT = resolve(ROOT, 'app/data/unit.enc.json');
const PIE = resolve(ROOT, 'app/data/pie');

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
if (!input) { console.error('ใช้: node tools/encrypt_pap.mjs <pap.json นอก repo> [--img <โฟลเดอร์รูป นอก repo>]'); process.exit(1); }
if (imgDir && !relative(ROOT, imgDir).startsWith('..')) { console.error('โฟลเดอร์รูปอยู่ใน repo — ต้องอยู่นอก repo'); process.exit(1); }
const inPath = resolve(input);
if (!relative(ROOT, inPath).startsWith('..')) {
  console.error('ไฟล์ input อยู่ใน repo — ย้ายออกไปไว้นอก repo ก่อน (ห้ามมีข้อมูลดิบของหน่วยใน repo)');
  process.exit(1);
}
let unit;
try { unit = JSON.parse(await readFile(UNIT, 'utf8')); }
catch { console.error('ไม่พบ app/data/unit.enc.json — ต้องมีก่อน (ใช้กุญแจเดียวกัน)'); process.exit(1); }

let pass = process.env.W2_PASSPHRASE;
if (!pass) {
  if (!process.stdin.isTTY) {
    console.error('เทอร์มินัลนี้ซ่อนตัวอักษรไม่ได้ — รันใน PowerShell หรือ Windows Terminal หรือส่งรหัสทาง W2_PASSPHRASE');
    process.exit(1);
  }
  pass = await ask('รหัสผ่านหน่วย: ');
  if (pass !== await ask('พิมพ์ซ้ำอีกครั้ง: ')) { console.error('รหัสสองครั้งไม่ตรงกัน ยังไม่ได้เขียนไฟล์'); process.exit(1); }
}

const b64d = (s) => Buffer.from(s, 'base64');
const b64 = (u) => Buffer.from(u).toString('base64');
const salt = b64d(unit.salt);
const iter = unit.iter;
async function deriveKey(p, use) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(p.normalize('NFC')), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iter },
    base, { name: 'AES-GCM', length: 256 }, false, [use]);
}
try {
  await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64d(unit.iv) }, await deriveKey(pass.trim(), 'decrypt'), b64d(unit.ct));
} catch {
  console.error('รหัสนี้เปิด unit.enc.json ไม่ได้ — ต้องใช้รหัสหน่วยตัวเดียวกัน ยังไม่ได้เขียนไฟล์');
  process.exit(1);
}

const data = JSON.parse(await readFile(inPath, 'utf8'));
if (!data.guide || !Array.isArray(data.drills)) { console.error('ไม่พบ guide และ drills[] ในไฟล์ input'); process.exit(1); }
const imgFiles = imgDir ? new Set((await readdir(imgDir)).filter((f) => f.endsWith('.webp'))) : new Set();
const imgId = (f) => 'pie/' + createHash('sha256').update(unit.salt + '/pap/' + f).digest('hex').slice(0, 24);
const toEnc = new Map();
for (const d of data.drills) {
  const keep = (d.img || []).map((x) => x.f).filter((f) => imgFiles.has(f));
  delete d.img;
  if (keep.length) d.img = keep.map((f) => { const id = imgId(f); toEnc.set(id, f); return { f: id }; });
}
const raw = Buffer.from(JSON.stringify(data));
const zipped = gzipSync(raw, { level: 9 });
const iv = crypto.getRandomValues(new Uint8Array(12));
const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await deriveKey(pass.trim(), 'encrypt'), zipped);
await writeFile(OUT, JSON.stringify({ v: 1, kdf: 'PBKDF2-SHA256', iter, salt: unit.salt, z: 'gzip', iv: b64(iv), ct: b64(ct) }) + '\n');

const enc = JSON.parse(await readFile(OUT, 'utf8'));
const back = JSON.parse(gunzipSync(Buffer.from(await crypto.subtle.decrypt(
  { name: 'AES-GCM', iv: b64d(enc.iv) }, await deriveKey(pass.trim(), 'decrypt'), b64d(enc.ct)))).toString('utf8'));
if (back.drills.length !== data.drills.length) { console.error('ถอดรหัสกลับแล้วจำนวนรายการไม่ตรง'); process.exit(1); }
if (imgDir) {
  await mkdir(PIE, { recursive: true });
  for (const f of await readdir(PIE)) if (f.endsWith('.bin')) await rm(join(PIE, f));
  const key = await deriveKey(pass.trim(), 'encrypt');
  const dkey = await deriveKey(pass.trim(), 'decrypt');
  let bytes = 0;
  for (const [id, f] of toEnc) {
    const src = await readFile(join(imgDir, f));
    const v = crypto.getRandomValues(new Uint8Array(12));
    const c = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: v }, key, src));
    const out = Buffer.concat([Buffer.from(v), Buffer.from(c)]);
    await writeFile(join(ROOT, 'app/data', id + '.bin'), out);
    const chk = Buffer.from(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: out.subarray(0, 12) }, dkey, out.subarray(12)));
    if (!chk.equals(src)) { console.error('ถอดรหัสรูปกลับไม่ตรง: ' + id); process.exit(1); }
    bytes += out.length;
  }
  console.log(`รูปซ้อม ${toEnc.size} ไฟล์ (${Math.round(bytes / 1024)} KB) → ${relative(ROOT, PIE)}/ · ใน ${data.drills.filter((d) => d.img).length} การซ้อม · ทดลองถอดกลับตรงทุกไฟล์`);
}
console.log(`เข้ารหัสคู่มือ + การซ้อม ${data.drills.length} ครั้ง → ${relative(ROOT, OUT)} · ทดลองถอดรหัสกลับแล้วได้ครบ ${back.drills.length} ครั้ง`);
