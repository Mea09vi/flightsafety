// เข้ารหัสรายชื่อ รปป.บน.2 หัวข้อ ๐๔ (นิรภัยการบินและภาคพื้น) → app/data/regs.enc.json
//
// ใช้:
//   python tools/build_rpp.py <rpp.xlsx นอก repo> <rpp04.json นอก repo>
//   node tools/encrypt_regs.mjs <rpp04.json นอก repo>
// แล้วพิมพ์รหัสหน่วยตัวเดียวกับ unit.enc.json 2 ครั้ง (หรือส่งทาง W2_PASSPHRASE)
//
// ใช้ salt และรอบ PBKDF2 ของ unit.enc.json เหมือน encrypt_history.mjs เพื่อให้กุญแจที่แอปจำไว้ตอนปลดล็อกเปิดได้ทันที
// ลองเปิด unit.enc.json ด้วยรหัสที่พิมพ์ก่อน ถ้าเปิดไม่ได้ = รหัสไม่ตรง → ไม่เขียนไฟล์
// เนื้อหาเป็นแค่ชื่อเรื่อง ปี หน่วยรับผิดชอบ และลิงก์ Google Drive (ไม่มีไฟล์ PDF)
import { webcrypto as crypto } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync, gzipSync } from 'node:zlib';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const OUT = resolve(ROOT, 'app/data/regs.enc.json');
const UNIT = resolve(ROOT, 'app/data/unit.enc.json');

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

const input = process.argv[2];
if (!input) { console.error('ใช้: node tools/encrypt_regs.mjs <rpp04.json นอก repo>'); process.exit(1); }
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
if (!Array.isArray(data.items) || !data.items.length) { console.error('ไม่พบ items[] ในไฟล์ input'); process.exit(1); }
const raw = Buffer.from(JSON.stringify(data));
const zipped = gzipSync(raw, { level: 9 });
const iv = crypto.getRandomValues(new Uint8Array(12));
const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await deriveKey(pass.trim(), 'encrypt'), zipped);
await writeFile(OUT, JSON.stringify({ v: 1, kdf: 'PBKDF2-SHA256', iter, salt: unit.salt, z: 'gzip', iv: b64(iv), ct: b64(ct) }) + '\n');

const enc = JSON.parse(await readFile(OUT, 'utf8'));
const back = JSON.parse(gunzipSync(Buffer.from(await crypto.subtle.decrypt(
  { name: 'AES-GCM', iv: b64d(enc.iv) }, await deriveKey(pass.trim(), 'decrypt'), b64d(enc.ct)))).toString('utf8'));
if (back.items.length !== data.items.length) { console.error('ถอดรหัสกลับแล้วจำนวนรายการไม่ตรง'); process.exit(1); }
console.log(`เข้ารหัส ${data.items.length} รายการ → ${relative(ROOT, OUT)} · ทดลองถอดรหัสกลับแล้วได้ครบ ${back.items.length} รายการ`);
