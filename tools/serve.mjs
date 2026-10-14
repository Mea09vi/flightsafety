// dev server แบบไม่มี dependency สำหรับโฟลเดอร์ app/
// ใช้:  node tools/serve.mjs [port] [--unit <unit_cases.json นอก repo>]     (port ค่าเริ่มต้น 5173)
//
// --unit  เสิร์ฟไฟล์เคสหน่วยแบบยังไม่เข้ารหัสที่ /data/unit.dev.json สำหรับทดสอบบนเครื่องตัวเองเท่านั้น
//         ไฟล์ถูกอ่านจากที่เดิม (ไม่ก๊อปเข้า repo) และ server จะฟังเฉพาะ 127.0.0.1
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = resolve(fileURLToPath(new URL('..', import.meta.url)));
const ROOT = resolve(REPO, 'app');
const args = process.argv.slice(2);
const ui = args.indexOf('--unit');
const UNIT = ui >= 0 ? resolve(args.splice(ui, 2)[1] || '') : null;
const PORT = Number(args[0] || process.env.PORT || 5173);
const HOST = UNIT ? '127.0.0.1' : undefined;
const DEV_PATH = '/data/unit.dev.json';

if (UNIT) {
  if (!relative(REPO, UNIT).startsWith('..')) {
    console.error('--unit ต้องชี้ไปที่ไฟล์นอก repo (ห้ามมีข้อมูลดิบของหน่วยใน repo)');
    process.exit(1);
  }
  try { await stat(UNIT); } catch { console.error('ไม่พบไฟล์', UNIT); process.exit(1); }
}

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path.endsWith('/')) path += 'index.html';
  const file = path === DEV_PATH && UNIT ? UNIT : normalize(join(ROOT, path));
  if (file !== UNIT && file !== ROOT && !file.startsWith(ROOT + sep)) { res.writeHead(403).end(); return; }
  try {
    if (!(await stat(file)).isFile()) throw new Error('not a file');
    const body = await readFile(file);
    res.writeHead(200, {
      'Content-Type': TYPES[extname(file)] || 'application/octet-stream',
      'Cache-Control': file === UNIT ? 'no-store' : 'no-cache',
    });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('404');
  }
  console.log(res.statusCode, req.method, path);
}).listen(PORT, HOST, () => {
  console.log(`serving ${ROOT} → http://localhost:${PORT}/`);
  if (UNIT) console.log(`dev unit: ${UNIT} → ${DEV_PATH} (127.0.0.1 เท่านั้น)`);
});
