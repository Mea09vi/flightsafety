// เข้ารหัสเคสของหน่วย (W2/RTAF) → app/data/unit.enc.json
//
// ใช้:
//   node tools/encrypt_unit.mjs <unit_cases.json นอก repo>
// แล้วพิมพ์รหัส (4 ตัวอักษร) ในเทอร์มินัล 2 ครั้ง (ไม่แสดงตัวอักษร ไม่ค้างในประวัติคำสั่ง)
// หรือส่งทาง env: W2_PASSPHRASE='...' node tools/encrypt_unit.mjs <ไฟล์> (รหัสจะค้างใน history ของ shell)
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

// อ่านรหัสจากแป้นพิมพ์โดยแสดงเป็น * แทนตัวอักษร
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
if (!input) {
  console.error('ใช้: node tools/encrypt_unit.mjs <cases.json นอก repo>');
  process.exit(1);
}
const inPath = resolve(input);
if (!relative(ROOT, inPath).startsWith('..')) {
  console.error('ไฟล์ input อยู่ใน repo — ย้ายออกไปไว้นอก repo ก่อน (ห้ามมีข้อมูลดิบของหน่วยใน repo)');
  process.exit(1);
}
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
// รหัสหน่วยยาว 4 ตัวอักษร ไม่มีช่องว่าง (DECISIONS.md ความเสี่ยงข้อ 4)
// ห้ามช่องว่างเพราะแอปตัดช่องว่างหัวท้ายทิ้งก่อนถอดรหัส · นับแบบเดียวกับ maxlength ของช่องรหัสในแอป
if (/\s/.test(pass) || pass.normalize('NFC').length !== 4) {
  console.error('รหัสหน่วยต้องยาว 4 ตัวอักษรพอดี และไม่มีช่องว่าง ยังไม่ได้เขียนไฟล์');
  process.exit(1);
}

const data = JSON.parse(await readFile(inPath, 'utf8'));
if (!Array.isArray(data.cases)) { console.error('ไม่พบ cases[] ในไฟล์ input'); process.exit(1); }
const bad = data.cases.filter((c) => !['W2', 'RTAF'].includes(c.source));
if (bad.length) { console.error('มีเคสที่ source ไม่ใช่ W2/RTAF:', bad.map((c) => c.id).join(', ')); process.exit(1); }

let salt;
try { salt = Buffer.from(JSON.parse(await readFile(OUT, 'utf8')).salt, 'base64'); }
catch { salt = Buffer.from(crypto.getRandomValues(new Uint8Array(16))); }

// derive แบบเดียวกับ deriveKey() ใน app/app.js
async function deriveKey(p, s, use) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(p.normalize('NFC')), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt: s, iterations: ITER },
    base, { name: 'AES-GCM', length: 256 }, false, [use]);
}
const iv = crypto.getRandomValues(new Uint8Array(12));
const payload = { version: data.version || new Date().toISOString().slice(0, 10), cases: data.cases };
const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await deriveKey(pass, salt, 'encrypt'), new TextEncoder().encode(JSON.stringify(payload)));

const b64 = (u) => Buffer.from(u).toString('base64');
await writeFile(OUT, JSON.stringify({ v: 1, kdf: 'PBKDF2-SHA256', iter: ITER, salt: b64(salt), iv: b64(iv), ct: b64(ct) }) + '\n');

// อ่านไฟล์ที่เพิ่งเขียนกลับมาถอดรหัสแบบที่แอปทำ ให้แน่ใจว่ารหัสนี้เปิดไฟล์นี้ได้จริง
const enc = JSON.parse(await readFile(OUT, 'utf8'));
const back = JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt(
  { name: 'AES-GCM', iv: Buffer.from(enc.iv, 'base64') },
  await deriveKey(pass.trim(), Buffer.from(enc.salt, 'base64'), 'decrypt'),
  Buffer.from(enc.ct, 'base64'))));
if (back.cases.length !== data.cases.length) { console.error('ถอดรหัสกลับแล้วจำนวนเคสไม่ตรง'); process.exit(1); }
console.log(`เข้ารหัส ${data.cases.length} เคส → ${relative(ROOT, OUT)} · ทดลองถอดรหัสกลับแล้วได้ครบ ${back.cases.length} เคส`);
