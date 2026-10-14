// เข้ารหัสเคสของหน่วย (W2/RTAF) → app/data/unit.enc.json
//
// ใช้ (Git Bash):
//   W2_PASSPHRASE='...' node tools/encrypt_unit.mjs <unit_cases.json นอก repo>
//
// ไฟล์ input ต้องอยู่นอก repo และมีรูปแบบ {"cases":[...]} schema เดียวกับ intl.json
// ใช้ salt เดิมถ้ามีไฟล์อยู่แล้ว เพื่อให้กุญแจที่เครื่องผู้ใช้จำไว้ยังใช้ได้หลังอัปเดตข้อมูล
// (เปลี่ยนรหัสผ่าน = ลบ unit.enc.json ก่อนแล้วรันใหม่ ทุกเครื่องต้องปลดล็อกใหม่)
import { webcrypto as crypto } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const OUT = resolve(ROOT, 'app/data/unit.enc.json');
const ITER = 310000;

const input = process.argv[2];
const pass = process.env.W2_PASSPHRASE;
if (!input || !pass) {
  console.error('ใช้: W2_PASSPHRASE=... node tools/encrypt_unit.mjs <cases.json>');
  process.exit(1);
}
if (pass.length < 10) {
  console.error('รหัสผ่านควรยาวอย่างน้อย 10 ตัวอักษร');
  process.exit(1);
}
const inPath = resolve(input);
if (!relative(ROOT, inPath).startsWith('..')) {
  console.error('ไฟล์ input อยู่ใน repo — ย้ายออกไปไว้นอก repo ก่อน (ห้ามมีข้อมูลดิบของหน่วยใน repo)');
  process.exit(1);
}

const data = JSON.parse(await readFile(inPath, 'utf8'));
if (!Array.isArray(data.cases)) { console.error('ไม่พบ cases[] ในไฟล์ input'); process.exit(1); }
const bad = data.cases.filter((c) => !['W2', 'RTAF'].includes(c.source));
if (bad.length) { console.error('มีเคสที่ source ไม่ใช่ W2/RTAF:', bad.map((c) => c.id).join(', ')); process.exit(1); }

let salt;
try { salt = Buffer.from(JSON.parse(await readFile(OUT, 'utf8')).salt, 'base64'); }
catch { salt = Buffer.from(crypto.getRandomValues(new Uint8Array(16))); }

const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pass.normalize('NFC')), 'PBKDF2', false, ['deriveKey']);
const key = await crypto.subtle.deriveKey(
  { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: ITER },
  base, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
const iv = crypto.getRandomValues(new Uint8Array(12));
const payload = { version: data.version || new Date().toISOString().slice(0, 10), cases: data.cases };
const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify(payload)));

const b64 = (u) => Buffer.from(u).toString('base64');
await writeFile(OUT, JSON.stringify({ v: 1, kdf: 'PBKDF2-SHA256', iter: ITER, salt: b64(salt), iv: b64(iv), ct: b64(ct) }) + '\n');
console.log(`เข้ารหัส ${data.cases.length} เคส → ${relative(ROOT, OUT)}`);
