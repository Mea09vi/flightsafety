// ตรวจภาพจำลองเหตุการณ์ (app/data/scenes.json หรือไฟล์ที่ระบุ) และถ่ายภาพไว้ดูด้วยตา
//   node tools/scenes/check.mjs [scenes.json] [--ids INTL-0001,INTL-0002] [--shot <out_dir>] [--port 9341]
// ตรวจ: ชนิด/ฟิลด์ตาม KINDS · พิกัดอยู่ในกรอบ · ตัวอักษรล้นกรอบหรือทับกัน (ประมาณ) · เลขหมุดตรงกับขั้น
//       · หน่วยเมตริกหลุด · id มีจริงใน intl.json · ภาพมีอากาศยานอย่างน้อยหนึ่งลำ
// --shot เรนเดอร์ด้วย Chrome headless แล้วบันทึก <out_dir>/<id>.png ทีละเคส + index.html
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const { sceneHtml, KINDS, W } = await import(pathToFileURL(join(ROOT, 'app/scene.js')).href);

const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args.splice(i, 2)[1] : null; };
const ids = opt('--ids')?.split(',');
const shotDir = opt('--shot');
const port = Number(opt('--port') || 9341);
const file = resolve(args[0] || join(ROOT, 'app/data/scenes.json'));

const all = JSON.parse(readFileSync(file, 'utf8'));
const intlRaw = JSON.parse(readFileSync(join(ROOT, 'app/data/intl.json'), 'utf8'));
const intl = new Map((Array.isArray(intlRaw) ? intlRaw : intlRaw.cases).map((c) => [c.id, c]));

const VIEWS = new Set(['side', 'top', 'front']);
const PHS = new Set(['normal', 'warn', 'danger', 'info']);
const COLORS = new Set(['normal', 'warn', 'danger', 'info', 'muted']);
const TONES = new Set(['muted', 'warn', 'bad', 'info', '']);
const GROUND = new Set(['grass', 'paddy', 'field', 'hill', 'mountain', 'snow', 'sea', 'water', 'lake', 'desert', 'sand', 'city', 'runway', 'forest', 'rock', 'concrete']);
// หน่วยที่ห้ามบนจอ (ใช้ ฟุต นอต ไมล์ ไมล์ทะเล) — มม. °C กก. ลิตร ใช้ได้
const METRIC = /(\d\s*(m|km|m\/s|km\/h|cm)\b)|(\d\s*(เมตร|กม\.|กิโลเมตร|ซม\.|เซนติเมตร|ม\.(?!ค|ย|ิ)))/;
const CJK = /[぀-ヿ一-鿿]/; // ป้ายความแน่นอนของ JTSB (推定 ฯลฯ) ห้ามขึ้นจอ ให้เขียนเป็นไทย
const COMB = /[\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]/g; // สระบน/ล่างและวรรณยุกต์ไทยไม่กินความกว้าง

const textW = (s, size) => [...String(s).replace(COMB, '')].length * size * 0.6;

function labelBoxes(e) {
  // คืนกรอบตัวอักษร [x1,y1,x2,y2] ของ label dim และข้อความลม (ประมาณ)
  let x; let y; let text; let size; let anchor;
  if (e.t === 'label') ({ x, y, text, size = 14, anchor = 'start' } = e);
  else if (e.t === 'dim') {
    const vert = Math.abs(e.x2 - e.x1) < Math.abs(e.y2 - e.y1); const side = e.side === 'left' ? -1 : 1;
    x = vert ? (e.x1 + e.x2) / 2 + side * 6 : (e.x1 + e.x2) / 2;
    y = vert ? (e.y1 + e.y2) / 2 + 4.5 : Math.min(e.y1, e.y2) - 5;
    text = e.unknown ? `${e.text} ?` : e.text; size = 13; anchor = vert ? (side < 0 ? 'end' : 'start') : 'middle';
    if (!text) return [];
  } else if (e.t === 'wind' && e.text) {
    x = e.x; y = e.y + 26; text = e.text; size = 13; anchor = 'middle';
  } else return [];
  return String(text).split('\n').map((ln, k) => {
    const w = textW(ln, size); const yy = y + k * size * 1.4;
    const x1 = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;
    return [x1, yy - size * 0.8, x1 + w, yy + size * 0.25];
  });
}

// กรอบของสิ่งที่ตัวอักษรไม่ควรทับ: อากาศยาน หมุด จุดชน (ตามขนาดที่วาดใน scene.js ไม่คิดการหมุน)
const CRAFT = {
  side: { light: [-41, -16, 28, 12], medium: [-51, -18, 34, 12], tandem: [-60, -22, 56, 13], plane: [-36, -14, 33, 5] },
  top: { light: [-37, -26, 27, 26], medium: [-46, -32, 34, 32], tandem: [-52, -26, 52, 26], plane: [-35, -30, 30, 30] },
  front: { light: [-38, -17, 38, 13], medium: [-38, -17, 38, 13], tandem: [-38, -17, 38, 13], plane: [-30, -14, 30, 6] },
};
function solidBox(e, view) {
  if (e.t === 'mark') return [e.x - 10, e.y - 10, e.x + 10, e.y + 10];
  if (e.t === 'burst') { const r = e.r || 10; return [e.x - r, e.y - r, e.x + r, e.y + r]; }
  if (e.t !== 'heli' && e.t !== 'plane') return null;
  if (e.state === 'ghost') return null;
  const v = CRAFT[e.view || view] || CRAFT.side; let b = v[e.t === 'plane' ? 'plane' : e.type || 'medium'];
  const s = e.s || 1; if (e.flip) b = [-b[2], b[1], -b[0], b[3]];
  return [e.x + b[0] * s, e.y + b[1] * s, e.x + b[2] * s, e.y + b[3] * s];
}

const overlap = (a, b) => Math.min(a[2], b[2]) - Math.max(a[0], b[0]) > 2 && Math.min(a[3], b[3]) - Math.max(a[1], b[1]) > 2;

function checkCase(id, spec) {
  const err = []; const warn = [];
  if (!intl.has(id)) err.push('ไม่มี id นี้ใน intl.json (published)');
  const panels = Array.isArray(spec.panels) ? spec.panels : [spec];
  if (!panels.length || panels.length > 3) err.push(`จำนวนภาพ ${panels.length} (1–3)`);
  const steps = spec.steps || [];
  if (steps.length < 2 || steps.length > 7) warn.push(`จำนวนขั้น ${steps.length} (แนะนำ 3–6)`);
  const stepN = new Set();
  for (const s of steps) {
    if (stepN.has(String(s.n))) err.push(`ขั้น ${s.n} ซ้ำ`);
    stepN.add(String(s.n));
    if (!PHS.has(s.ph || 'normal')) err.push(`ขั้น ${s.n} ph "${s.ph}"`);
    if (!s.text || s.text.length > 160) err.push(`ขั้น ${s.n} ข้อความว่างหรือยาวเกิน 160 ตัว`);
    if (METRIC.test(s.text)) err.push(`ขั้น ${s.n} มีหน่วยเมตริก: ${s.text}`);
    if (CJK.test(s.text)) err.push(`ขั้น ${s.n} มีอักษรญี่ปุ่น/จีน: ${s.text}`);
  }
  let craft = 0; const markN = new Set();
  panels.forEach((sc, pi) => {
    const P = `ภาพ ${pi + 1}`; const H = sc.h || 220;
    if (!VIEWS.has(sc.view || 'side')) err.push(`${P} view "${sc.view}"`);
    if (H < 120 || H > 300) err.push(`${P} h=${H} (120–300)`);
    if (sc.bg && !GROUND.has(sc.bg)) err.push(`${P} bg "${sc.bg}"`);
    if (sc.cap && sc.cap.length > 60) warn.push(`${P} cap ยาว ${sc.cap.length}`);
    const boxes = []; const solids = [];
    (sc.el || []).forEach((e, ei) => { const b = solidBox(e, sc.view || 'side'); if (b) solids.push({ b, at: `el[${ei}] ${e.t}${e.n ? ` ${e.n}` : ''}` }); });
    (sc.el || []).forEach((e, ei) => {
      const at = `${P} el[${ei}] ${e.t}`;
      const need = KINDS[e.t];
      if (!need) { err.push(`${at}: ไม่รู้จักชนิดนี้`); return; }
      const req = e.t === 'runway' && (sc.view || 'side') === 'top' ? ['x', 'y', 'w', 'h'] : need;
      for (const f of req) if (e[f] === undefined || e[f] === null) err.push(`${at}: ขาด ${f}`);
      if (e.t === 'label' && e.size !== undefined && e.size < 12) err.push(`${at}: size ${e.size} (ต่ำสุด 12)`);
      if (e.t === 'line' && e.color && !COLORS.has(e.color) && !/^#[0-9a-fA-F]{3,8}$/.test(e.color)) err.push(`${at}: color "${e.color}" (normal warn danger info muted หรือ hex)`);
      if (e.kind && !GROUND.has(e.kind)) err.push(`${at}: kind "${e.kind}"`);
      if (e.ph && !PHS.has(e.ph)) err.push(`${at}: ph "${e.ph}"`);
      if (e.tone !== undefined && !TONES.has(e.tone)) err.push(`${at}: tone "${e.tone}"`);
      if (e.t === 'heli' || e.t === 'plane') craft++;
      if (e.t === 'heli' && e.type && !['light', 'medium', 'tandem'].includes(e.type)) err.push(`${at}: type "${e.type}"`);
      if (e.t === 'mark') { markN.add(String(e.n)); if (!stepN.has(String(e.n))) err.push(`${at}: หมุด ${e.n} ไม่มีในขั้น`); }
      const pts = [];
      if (e.pts) { if (!Array.isArray(e.pts) || e.pts.length < 2) err.push(`${at}: pts ต้องมี ≥2 จุด`); else pts.push(...e.pts); }
      for (const [kx, ky] of [['x', 'y'], ['x1', 'y1'], ['x2', 'y2']]) if (typeof e[kx] === 'number' && typeof e[ky] === 'number') pts.push([e[kx], e[ky]]);
      for (const p of pts) {
        if (!Array.isArray(p) || p.some((v) => typeof v !== 'number' || Number.isNaN(v))) { err.push(`${at}: พิกัดไม่ใช่ตัวเลข`); break; }
        if (p[0] < -5 || p[0] > W + 5 || p[1] < -5 || p[1] > H + 5) { err.push(`${at}: พิกัด ${p} นอกกรอบ ${W}×${H}`); break; }
      }
      for (const k of ['text']) if (e[k] && METRIC.test(e[k])) err.push(`${at}: หน่วยเมตริก "${e[k]}"`);
      if ((e.text && CJK.test(e.text)) || (sc.cap && CJK.test(sc.cap))) err.push(`${at}: มีอักษรญี่ปุ่น/จีน`);
      for (const b of labelBoxes(e)) {
        if (b[0] < 2 || b[2] > W - 2 || b[1] < 0 || b[3] > H) warn.push(`${at}: ตัวอักษรอาจล้นกรอบ "${e.text}"`);
        for (const o of boxes) if (overlap(b, o.b)) warn.push(`${at}: ตัวอักษรอาจทับ ${o.at}`);
        for (const o of solids) if (overlap(b, o.b)) warn.push(`${at}: ตัวอักษร "${String(e.text).split('\n')[0]}" ทับ ${o.at}`);
        boxes.push({ b, at });
      }
    });
  });
  if (!craft) err.push('ไม่มีอากาศยานในภาพ');
  for (const n of stepN) if (!markN.has(n)) warn.push(`ขั้น ${n} ไม่มีหมุดในภาพ`);
  try { sceneHtml(spec); } catch (x) { err.push(`เรนเดอร์ไม่ได้: ${x.message}`); }
  return { err, warn };
}

const keys = (ids || Object.keys(all)).filter((k) => all[k]);
let nErr = 0; let nWarn = 0;
for (const id of keys) {
  const { err, warn } = checkCase(id, all[id]);
  nErr += err.length; nWarn += warn.length;
  if (err.length || warn.length) {
    console.log(`\n${id}`);
    for (const e of err) console.log(`  ✗ ${e}`);
    for (const w of warn) console.log(`  · ${w}`);
  }
}
console.log(`\n${keys.length} เคส · ผิด ${nErr} · ควรดู ${nWarn}`);

if (shotDir) {
  const out = resolve(shotDir); mkdirSync(out, { recursive: true });
  const css = pathToFileURL(join(ROOT, 'app/styles.css')).href;
  const cards = keys.map((id) => `<section class="sc" id="${id}"><h3>${id} · ${(intl.get(id)?.title || '').replace(/</g, '&lt;')}</h3>${sceneHtml(all[id])}</section>`).join('');
  const html = `<!doctype html><html lang="th" data-theme="day"><head><meta charset="utf-8"><link rel="stylesheet" href="${css}">
    <style>body{padding:16px;background:var(--bg)} .sc{width:520px;padding:12px 14px;margin-bottom:16px;background:var(--bg)} .sc h3{font:600 14px/1.5 var(--f-b);margin:0 0 8px;color:var(--text)}</style>
    </head><body>${cards}</body></html>`;
  writeFileSync(join(out, 'index.html'), html);
  const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
  const prof = join(tmpdir(), `scn-prof-${port}`); rmSync(prof, { recursive: true, force: true });
  const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, '--no-first-run', '--hide-scrollbars', '--allow-file-access-from-files', 'about:blank'], { stdio: 'ignore' });
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  let page;
  for (let i = 0; i < 120 && !page; i++) {
    try { page = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((t) => t.type === 'page'); } catch { await sleep(250); }
  }
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => { ws.onopen = r; });
  let seq = 0; const pending = new Map();
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); } };
  const send = (method, params = {}) => new Promise((res) => { const id = ++seq; pending.set(id, res); ws.send(JSON.stringify({ id, method, params })); });
  const js = async (x) => (await send('Runtime.evaluate', { expression: x, awaitPromise: true, returnByValue: true })).result.value;
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 580, height: 900, deviceScaleFactor: 1.5, mobile: false });
  await send('Page.navigate', { url: pathToFileURL(join(out, 'index.html')).href });
  await sleep(1000); await js('document.fonts.ready.then(() => true)'); await sleep(200);
  for (const id of keys) {
    const r = await js(`(() => { const b = document.getElementById(${JSON.stringify(id)}).getBoundingClientRect(); return { x: b.left + scrollX, y: b.top + scrollY, w: b.width, h: b.height }; })()`);
    const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: r.x, y: r.y, width: r.w, height: r.h, scale: 1 } });
    writeFileSync(join(out, `${id}.png`), Buffer.from(data, 'base64'));
  }
  ws.close(); proc.kill();
  console.log(`ภาพ ${keys.length} ไฟล์ → ${out}`);
}
process.exitCode = nErr ? 1 : 0;
