// dev server แบบไม่มี dependency สำหรับโฟลเดอร์ app/
// ใช้:  node tools/serve.mjs [port] [--unit <unit_cases.json>] [--history <history.json>] [--regs <rpp04.json>] [--himg <โฟลเดอร์รูป>]
//       (port ค่าเริ่มต้น 5173 · ทุกไฟล์ต้องอยู่นอก repo)
//
// --unit     เสิร์ฟไฟล์เคสหน่วยแบบยังไม่เข้ารหัสที่ /data/unit.dev.json สำหรับทดสอบบนเครื่องตัวเองเท่านั้น
// --history  เสิร์ฟประวัติเหตุ บน.2 แบบยังไม่เข้ารหัสที่ /data/history.dev.json
// --regs     เสิร์ฟรายชื่อ รปป.บน.2 หัวข้อ ๐๔ แบบยังไม่เข้ารหัสที่ /data/regs.dev.json
// --himg     เสิร์ฟรูปจากเอกสารต้นฉบับที่ /data/himg/<ชื่อไฟล์> (ยังไม่มีนโยบายเผยแพร่รูป จึงมีเฉพาะ dev)
//         ไฟล์ถูกอ่านจากที่เดิม (ไม่ก๊อปเข้า repo) และ server จะฟังเฉพาะ 127.0.0.1
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = resolve(fileURLToPath(new URL('..', import.meta.url)));
const ROOT = resolve(REPO, 'app');
const args = process.argv.slice(2);
function opt(name) {
  const i = args.indexOf(name);
  return i >= 0 ? resolve(args.splice(i, 2)[1] || '') : null;
}
const UNIT = opt('--unit');
const HIST = opt('--history');
const REGS = opt('--regs');
const HIMG = opt('--himg');
const PORT = Number(args[0] || process.env.PORT || 5173);
const HOST = UNIT || HIST || REGS || HIMG ? '127.0.0.1' : undefined;
const DEV_PATH = '/data/unit.dev.json';
const HIST_PATH = '/data/history.dev.json';
const REGS_PATH = '/data/regs.dev.json';
const HIMG_PATH = '/data/himg/';

for (const [name, f] of [['--unit', UNIT], ['--history', HIST], ['--regs', REGS], ['--himg', HIMG]]) {
  if (!f) continue;
  if (!relative(REPO, f).startsWith('..')) {
    console.error(name, 'ต้องชี้ไปที่ไฟล์นอก repo (ห้ามมีข้อมูลดิบของหน่วยใน repo)');
    process.exit(1);
  }
  try { await stat(f); } catch { console.error('ไม่พบ', f); process.exit(1); }
}

// ไฟล์ข้อมูลหน่วยที่อยู่นอก app/ (null = ไม่ใช่)
function devFile(path) {
  if (path === DEV_PATH && UNIT) return UNIT;
  if (path === HIST_PATH && HIST) return HIST;
  if (path === REGS_PATH && REGS) return REGS;
  if (HIMG && path.startsWith(HIMG_PATH)) {
    const f = normalize(join(HIMG, path.slice(HIMG_PATH.length)));
    return f.startsWith(HIMG + sep) ? f : undefined;
  }
  return null;
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
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path.endsWith('/')) path += 'index.html';
  const dev = devFile(path);
  if (dev === undefined) { res.writeHead(403).end(); return; }
  const file = dev || normalize(join(ROOT, path));
  if (!dev && file !== ROOT && !file.startsWith(ROOT + sep)) { res.writeHead(403).end(); return; }
  try {
    if (!(await stat(file)).isFile()) throw new Error('not a file');
    const body = await readFile(file);
    res.writeHead(200, {
      'Content-Type': TYPES[extname(file)] || 'application/octet-stream',
      'Cache-Control': dev ? 'no-store' : 'no-cache',
    });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('404');
  }
  console.log(res.statusCode, req.method, path);
}).listen(PORT, HOST, () => {
  console.log(`serving ${ROOT} → http://localhost:${PORT}/`);
  if (UNIT) console.log(`dev unit: ${UNIT} → ${DEV_PATH} (127.0.0.1 เท่านั้น)`);
  if (HIST) console.log(`dev history: ${HIST} → ${HIST_PATH}`);
  if (REGS) console.log(`dev regs: ${REGS} → ${REGS_PATH}`);
  if (HIMG) console.log(`dev images: ${HIMG} → ${HIMG_PATH}`);
});
