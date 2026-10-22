// Wing2 Safety — vanilla JS, hash routing, ไม่มี build step
// เส้นทาง: #/ (หน้าหลัก)  #/filter  #/results  #/case/:id  #/brief (หน้าปก)  #/brief/:id[/ประเด็น]  #/brief/end
//          #/dashboard[?ตัวกรอง]  #/areas  #/about  #/theory  #/theory/:บท[/สไลด์]  #/history  #/history/:id

import { mountOverview } from './overview.js';
import * as AIR from './airmanship.js';
import * as PAP from './pap.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const main = $('#main');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const icon = (id, cls = 'ic') => `<svg class="${cls}" aria-hidden="true"><use href="#i-${id}"/></svg>`;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');

const LS = {
  get(k, d) { try { const v = localStorage.getItem('w2sb.' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('w2sb.' + k, JSON.stringify(v)); } catch { /* private mode */ } },
  del(k) { try { localStorage.removeItem('w2sb.' + k); } catch { /* private mode */ } },
};
// อยู่แค่ในแท็บนี้ ปิดแท็บแล้วหาย: กุญแจตอนไม่ติ๊ก "จำไว้ในเครื่องนี้"
const SS = {
  get(k, d) { try { const v = sessionStorage.getItem('w2sb.' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { sessionStorage.setItem('w2sb.' + k, JSON.stringify(v)); } catch { /* private mode */ } },
  del(k) { try { sessionStorage.removeItem('w2sb.' + k); } catch { /* private mode */ } },
};

// ป้ายประเภท [คำ, สีจุด] — อุบัติเหตุ = แดง, อุบัติการณ์ = ส้ม (DECISIONS.md หัวข้อ "หน้าตาแอป")
const TYPE = {
  accident: ['อุบัติเหตุ', 'bad'],
  incident: ['อุบัติการณ์', 'warn'],
  hazard: ['ความเสี่ยง', 'ring'],
  area_hazard: ['อันตรายพื้นที่', 'ring'],
  notice: ['ประกาศนิรภัย', 'sky'],
};
const SRC_RANK = { W2: 0, RTAF: 1, INTL: 2 };
const SHOW_TOP = 3;
// ป้ายแหล่งข้อมูลภาษาไทย · เคส INTL ของ AAIC เป็นอากาศยานพลเรือนในไทย (DECISIONS.md หัวข้อ "แหล่ง")
const SRC_TH = { W2: 'บน.2', RTAF: 'ทอ.', INTL: 'ต่างประเทศ' };
const srcLabel = (c) => (c.source === 'INTL' && /AAIC/.test(c.ref_label || '') ? 'พลเรือนไทย' : SRC_TH[c.source] ?? c.source);
// ขั้น "ข้อมูลจาก" ในหน้าเลือกเที่ยวบิน
const SRC_SET = { TH: ['W2', 'RTAF'], INTL: ['INTL'], ALL: ['W2', 'RTAF', 'INTL'] };
const SRC_OPT = [
  { v: 'TH', th: 'กองทัพอากาศไทย', short: 'ทอ. ไทย', sub: 'บน.2 และหน่วยอื่นของ ทอ.' },
  { v: 'INTL', th: 'ต่างประเทศ', short: 'ต่างประเทศ', sub: 'รายงานสอบสวนสาธารณะ · รวมพลเรือนไทย (AAIC)' },
  { v: 'ALL', th: 'ทั้งหมด', short: 'ทั้งหมด', sub: 'ทั้งของ ทอ. และต่างประเทศ' },
];
const srcOpt = (v) => SRC_OPT.find((o) => o.v === v) ?? SRC_OPT[2];

const EMPTY_SEL = { src: 'ALL', aircraft: null, mission: null, environment: [], phase: [], hfacs: [], area: null };
const state = {
  tax: null,
  intl: [],
  intlVersion: '',
  unit: [],
  unitVersion: '',
  unitStatus: 'missing', // missing | locked | unlocked
  sel: { ...EMPTY_SEL, ...LS.get('sel', {}) },
  open: {}, // กลุ่มผลลัพธ์ที่กด "ดูอีก" ไว้ { a, b, c }
  rtab: 'cards', // แท็บหน้ารายการ: cards = บทเรียน · mor = การ์ดจากแบบฟอร์ม MOR/HR บน.2 (W2M-)
  from: '', // results — หน้าที่เปิดเคสมา ใช้กับปุ่มย้อนกลับและก่อนหน้า/ถัดไป
  pap: null, // แผน PAP โหลดตอนเปิดหน้าครั้งแรก { status, data }
  hist: null, // ประวัติเหตุ บน.2 โหลดตอนเปิดหน้าครั้งแรก { status, data }
  // หน้าประวัติเหตุ: ปีงบที่เลือก · แหล่งที่กรองในปีนั้น · ฝูงของตารางหัวข้อ · ช่องที่กด { tp, fy }
  // back = หน้าที่เปิดรายละเอียดมา · ret = หน้านอก #/history ที่เข้ามา (เช่น หน้าเคส)
  hv: { y: null, src: null, sq: 'ALL', cell: null, img: false, back: '', ret: '', q: '' },
  caseBack: '', // เปิดหน้าเคสจากประวัติเหตุ: ปุ่มย้อนกลับไปที่นั่น ไม่ใช่หน้ารายการ
};

/* ── ข้อมูล ───────────────────────────────────────────────── */

async function loadJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url} ${r.status}`);
  return r.json();
}

const b64 = {
  enc: (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))),
  dec: (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0)),
};

let unitEnc = null;
const IS_LOCAL = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);

// เฉพาะ localhost: `node tools/serve.mjs --unit <ไฟล์นอก repo>` เสิร์ฟเคสหน่วยแบบไม่เข้ารหัส
async function loadUnitDev() {
  if (!IS_LOCAL) return false;
  try {
    const r = await fetch('data/unit.dev.json', { cache: 'no-store' });
    if (!r.ok) return false;
    const data = await r.json();
    state.unit = data.cases || [];
    state.unitVersion = data.version || '';
    state.unitStatus = 'unlocked';
    state.unitDev = true;
    return true;
  } catch { return false; }
}

async function loadUnit() {
  if (await loadUnitDev()) return;
  try {
    const r = await fetch('data/unit.enc.json');
    if (!r.ok) { state.unitStatus = 'missing'; return; }
    unitEnc = await r.json();
  } catch { state.unitStatus = 'missing'; return; }
  const raw = LS.get('key', null) || SS.get('key', null);
  if (raw) {
    try {
      const key = await crypto.subtle.importKey('raw', b64.dec(raw), 'AES-GCM', false, ['decrypt']);
      await decryptUnit(key);
      return;
    } catch { LS.del('key'); SS.del('key'); }
  }
  state.unitStatus = 'locked';
}

async function deriveKey(pass) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pass.normalize('NFC')), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt: b64.dec(unitEnc.salt), iterations: unitEnc.iter },
    base, { name: 'AES-GCM', length: 256 }, true, ['decrypt']);
}

async function decryptUnit(key) {
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64.dec(unitEnc.iv) }, key, b64.dec(unitEnc.ct));
  const data = JSON.parse(new TextDecoder().decode(pt));
  state.unit = data.cases || [];
  state.unitVersion = data.version || '';
  state.unitStatus = 'unlocked';
}

// เก็บกุญแจที่ derive แล้ว ไม่เก็บรหัสผ่าน · remember = false เก็บไว้แค่ในแท็บนี้
async function unlock(pass, remember = true) {
  const key = await deriveKey(pass);
  await decryptUnit(key);
  const raw = b64.enc(await crypto.subtle.exportKey('raw', key));
  if (remember) { LS.set('key', raw); SS.del('key'); } else { SS.set('key', raw); LS.del('key'); }
  if (state.hist?.status === 'locked') state.hist = null;
  if (state.regs?.status === 'locked') state.regs = null;
  if (state.pap?.status === 'locked') state.pap = null;
  // ถอดรหัสประวัติเหตุต่อเลยโดยไม่รอ ให้ไฟล์เข้าแคชไว้เปิดตอนไม่มีสัญญาณ
  loadHistory().catch(() => {});
}

// ประวัติเหตุ บน.2 (#/history และแผง "เกิดใน บน.2 มาแล้ว" ในหน้าเคส) — โหลดตอนใช้ครั้งแรก ใช้กุญแจเดียวกับเคสหน่วย
// localhost: `node tools/serve.mjs --history <ไฟล์นอก repo>` เสิร์ฟแบบไม่เข้ารหัส (มีชื่อไฟล์รูปด้วย)
let histLoading = null;
function loadHistory() {
  if (state.hist) return Promise.resolve(state.hist);
  return (histLoading ??= readHistory().then((h) => { state.hist = h; histLoading = null; return h; }));
}
async function readHistory() {
  if (IS_LOCAL) {
    try {
      const r = await fetch('data/history.dev.json', { cache: 'no-store' });
      if (r.ok) return { status: 'ok', data: prepHistory(await r.json()), dev: true };
    } catch { /* ไม่ได้รันแบบ --history */ }
  }
  let enc;
  try {
    const r = await fetch('data/history.enc.json');
    if (!r.ok) return { status: 'missing' };
    enc = await r.json();
  } catch { return { status: 'missing' }; }
  const raw = LS.get('key', null) || SS.get('key', null);
  if (!raw) return { status: 'locked' };
  if (enc.z === 'gzip' && typeof DecompressionStream === 'undefined') return { status: 'unsupported' };
  try {
    const key = await crypto.subtle.importKey('raw', b64.dec(raw), 'AES-GCM', false, ['decrypt']);
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64.dec(enc.iv) }, key, b64.dec(enc.ct));
    const txt = enc.z === 'gzip'
      ? await new Response(new Blob([pt]).stream().pipeThrough(new DecompressionStream('gzip'))).text()
      : new TextDecoder().decode(pt);
    return { status: 'ok', data: prepHistory(JSON.parse(txt)) };
  } catch { return { status: 'locked' }; }
}
// แผน PAP (#/pap): คู่มือย่อจากระเบียบ บน.2 + ทะเบียนการซ้อม เข้ารหัสทั้งไฟล์ด้วยกุญแจหน่วย (data/pap.enc.json)
// localhost: `node tools/serve.mjs --pap <ไฟล์นอก repo>`
let papLoading = null;
function loadPap() {
  if (state.pap) return Promise.resolve(state.pap);
  return (papLoading ??= readPap().then((r) => { state.pap = r; papLoading = null; return r; }));
}
async function readPap() {
  if (IS_LOCAL) {
    try {
      const r = await fetch('data/pap.dev.json', { cache: 'no-store' });
      if (r.ok) return { status: 'ok', data: await r.json(), dev: true };
    } catch { /* ไม่ได้รันแบบ --pap */ }
  }
  let enc;
  try {
    const r = await fetch('data/pap.enc.json');
    if (!r.ok) return { status: 'missing' };
    enc = await r.json();
  } catch { return { status: 'missing' }; }
  const raw = LS.get('key', null) || SS.get('key', null);
  if (!raw) return { status: 'locked' };
  if (typeof DecompressionStream === 'undefined') return { status: 'unsupported' };
  try {
    const key = await crypto.subtle.importKey('raw', b64.dec(raw), 'AES-GCM', false, ['decrypt']);
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64.dec(enc.iv) }, key, b64.dec(enc.ct));
    const txt = await new Response(new Blob([pt]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
    return { status: 'ok', data: JSON.parse(txt) };
  } catch { return { status: 'locked' }; }
}
// กฎระเบียบและคู่มือ (#/regs): ระเบียบ ทอ./คู่มือจากเว็บ สนภ.ทอ. เป็นข้อมูลสาธารณะ (data/regs.json)
// รายชื่อ รปป.บน.2 หัวข้อ ๐๔ เข้ารหัสด้วยกุญแจหน่วย (data/regs.enc.json) · localhost: `node tools/serve.mjs --regs <ไฟล์นอก repo>`
let regsLoading = null;
function loadRegs() {
  if (state.regs) return Promise.resolve(state.regs);
  return (regsLoading ??= readRegs().then((r) => { state.regs = r; regsLoading = null; return r; }));
}
async function readRegs() {
  let pub = { groups: [], items: [] };
  try { const r = await fetch('data/regs.json'); if (r.ok) pub = await r.json(); } catch { /* ออฟไลน์และยังไม่มีแคช */ }
  const done = (status, rpp = []) => ({ status, groups: pub.groups, fetched: pub.fetched, items: [...rpp, ...pub.items] });
  if (IS_LOCAL) {
    try {
      const r = await fetch('data/regs.dev.json', { cache: 'no-store' });
      if (r.ok) return done('ok', (await r.json()).items);
    } catch { /* ไม่ได้รันแบบ --regs */ }
  }
  let enc;
  try {
    const r = await fetch('data/regs.enc.json');
    if (!r.ok) return done('missing');
    enc = await r.json();
  } catch { return done('missing'); }
  const raw = LS.get('key', null) || SS.get('key', null);
  if (!raw) return done('locked');
  if (typeof DecompressionStream === 'undefined') return done('unsupported');
  try {
    const key = await crypto.subtle.importKey('raw', b64.dec(raw), 'AES-GCM', false, ['decrypt']);
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64.dec(enc.iv) }, key, b64.dec(enc.ct));
    const txt = await new Response(new Blob([pt]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
    return done('ok', JSON.parse(txt).items);
  } catch { return done('locked'); }
}
// รูปจากเอกสาร: dev = ชื่อไฟล์ data/himg/ (ไม่เข้ารหัส) · เผยแพร่ = it.ie → data/hie/<id>.bin (iv 12 ไบต์ + AES-GCM กุญแจหน่วย)
const himgs = (it) => (state.hist?.dev ? it.img : it.ie) || [];
const himgSrc = (x) => (state.hist?.dev ? `src="data/himg/${encodeURIComponent(x)}"` : `data-ie="${esc(x)}"`);
const himgHref = (x) => (state.hist?.dev ? `href="data/himg/${encodeURIComponent(x)}"` : `data-ie="${esc(x)}"`);
const ieUrls = new Map();
let ieKey = null;
function ieUrl(id) {
  if (!ieUrls.has(id)) {
    ieUrls.set(id, (async () => {
      ieKey ??= crypto.subtle.importKey('raw', b64.dec(LS.get('key', null) || SS.get('key', null)), 'AES-GCM', false, ['decrypt']);
      const r = await fetch(id.includes('/') ? `data/${id}.bin` : `data/hie/${id}.bin`); // pie/<id> = รูปซ้อม PAP
      if (!r.ok) throw new Error(r.status);
      const b = new Uint8Array(await r.arrayBuffer());
      const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b.subarray(0, 12) }, await ieKey, b.subarray(12));
      return URL.createObjectURL(new Blob([pt], { type: 'image/webp' }));
    })().catch(() => { ieUrls.delete(id); ieKey = null; return null; }));
  }
  return ieUrls.get(id);
}
function hydrateImgs(root) {
  for (const el of $$('[data-ie]', root)) {
    ieUrl(el.dataset.ie).then((u) => {
      if (!u) return;
      if (el.tagName === 'IMG') el.src = u; else el.href = u;
      el.removeAttribute('data-ie');
    });
  }
}
function prepHistory(d) {
  d.byId = new Map(d.items.map((it) => [it.id, it]));
  return d;
}

// หน้าเข้าสู่ระบบเต็มจอ (login.js โหลดเฉพาะตอนต้องใช้) — DECISIONS.md หัวข้อ "หน้าเข้าสู่ระบบ"
async function showGate() {
  document.body.classList.add('gated');
  $('meta[name="theme-color"]').content = '#0d1528'; // ตรงกับแถบชั้นความลับของหน้าเข้าสู่ระบบ
  try {
    const { openGate } = await import('./login.js');
    openGate({
      iter: unitEnc.iter,
      unlock: async (pass, remember) => { try { await unlock(pass, remember); return true; } catch { return false; } },
      onEnter: route,
      onClose: () => { applyTheme(LS.get('theme', 'night')); main.focus({ preventScroll: true }); },
    });
  } catch (err) {
    // โหลดหน้าเข้าสู่ระบบไม่ได้ ยังปลดล็อกได้ที่หน้า ข้อมูล เหมือนเดิม
    console.warn('gate', err);
    document.body.classList.remove('gated');
    applyTheme(LS.get('theme', 'night'));
  }
}

const allCases = () => [...state.unit, ...state.intl];
const byId = (id) => allCases().find((c) => c.id === id);
const label = (kind, code) => state.tax[kind].find((x) => x.code === code)?.label ?? code;
const hfacsCat = (code) => state.tax.hfacs.find((h) => h.code === code)?.category ?? code;
// แบบ ฮ. ที่ปลดประจำการแล้ว (active=0) ใช้ติดเคสย้อนหลัง แต่ไม่เป็นตัวเลือก
const inService = (x) => x.active !== '0';

/* ── การจับคู่ ───────────────────────────────────────────── */

const hit = (arr, v) => arr.includes('ALL') || arr.includes(v);
const anyHit = (arr, vs) => arr.includes('ALL') || vs.some((v) => arr.includes(v));
const overlap = (arr, vs) => vs.filter((v) => arr.includes(v)).length;
const ready = (s = state.sel) => !!(s.aircraft && s.mission && s.environment.length);
const inSrc = (c, s = state.sel) => (SRC_SET[s.src] ?? SRC_SET.ALL).includes(c.source);

/* กลุ่มผลลัพธ์ (DECISIONS.md "การจัดกลุ่มผลลัพธ์")
   a = ติดแบบ ฮ. ที่เลือก + ตรงภารกิจและสภาพอากาศ
   b = ติดแบบ ฮ. ที่เลือก + ตรงภารกิจหรือสภาพอากาศอย่างใดอย่างหนึ่ง
   c = ติด ALL แต่ไม่ได้ติดแบบที่เลือก + ตรงภารกิจและสภาพอากาศ
   เคสที่ติดแต่แบบอื่นไม่ขึ้นเลย · ALL ในภารกิจ/สภาพอากาศยังนับว่าตรง */
const GROUPS = ['a', 'b', 'c'];
const isMor = (c) => c.id.startsWith('W2M-');

function match() {
  const s = state.sel;
  const g = { a: [], b: [], c: [] };
  if (!ready(s)) return { ...g, all: [] };
  for (const c of allCases()) {
    if (!inSrc(c, s)) continue;
    const own = c.aircraft.includes(s.aircraft);
    if (!own && !c.aircraft.includes('ALL')) continue;
    const m = [own, hit(c.mission, s.mission), anyHit(c.environment, s.environment)];
    const n = m[1] + m[2];
    const key = n === 2 ? (own ? 'a' : 'c') : n === 1 && own ? 'b' : null;
    if (!key) continue;
    const opt = overlap(c.phase, s.phase)
      + overlap(c.hfacs.map(hfacsCat), s.hfacs)
      + (s.area && c.area_id === s.area ? 1 : 0);
    // ตรงจริง ไม่ใช่ผ่าน ALL: ภารกิจ > สภาพแวดล้อม
    const spec = (c.mission.includes(s.mission) ? 2 : 0) + (overlap(c.environment, s.environment) ? 1 : 0);
    g[key].push({ c, m, opt, spec, g: key });
  }
  // ในแต่ละกลุ่ม: W2 ก่อน → ตัวกรองเสริม → ความเฉพาะเจาะจง → RTAF > INTL → ปีใหม่กว่า
  const order = (a, b) => (a.c.source !== 'W2') - (b.c.source !== 'W2') || b.opt - a.opt || b.spec - a.spec
    || SRC_RANK[a.c.source] - SRC_RANK[b.c.source] || b.c.year - a.c.year;
  for (const k of GROUPS) g[k].sort(order);
  return { ...g, all: [...g.a, ...g.b, ...g.c] };
}

// ลำดับเคสสำหรับปุ่มก่อนหน้า/ถัดไป = เคสที่เห็นอยู่ในหน้ารายการ (โหมดบรีฟใช้ชุดที่เลือกเข้าบรีฟ ดู briefSet)
function deck() {
  const { shown } = visible();
  return GROUPS.flatMap((k) => shown[k]).map((x) => x.c.id);
}
function deckFor(id) {
  if (state.caseBack) return [id];
  if (!ready()) return [id];
  const d = deck();
  return d.includes(id) ? d : [id];
}

/* ── ส่วนที่ใช้ซ้ำ ───────────────────────────────────────── */

const typeOf = (c) => TYPE[c.type] ?? [c.type, ''];
const dot = (cls) => `<i class="dot ${cls}" aria-hidden="true"></i>`;

function tags(c, { year = true } = {}) {
  const [th, cls] = typeOf(c);
  return `<span class="tag type">${dot(cls)}${esc(th)}</span>`
    + `<span class="tag src ${esc(c.source)}">${esc(srcLabel(c))}</span>`
    + (year ? `<span class="yr">${esc(c.year)}</span>` : '')
    + (c.status !== 'published' ? `<span class="tag draft" title="ยังไม่ผ่านการตรวจทาน">${dot('hollow')}ร่าง</span>` : '');
}

// ค่าที่เลือกไว้ แสดงเป็นคำไทย
const selText = {
  src: (s) => srcOpt(s.src).short,
  aircraft: (s) => s.aircraft || '',
  mission: (s) => (s.mission ? label('mission', s.mission) : ''),
  environment: (s) => s.environment.map((e) => label('environment', e)).join(' · '),
};

// แถบขั้นที่เลือก: แตะเพื่อเลื่อนกลับไปแก้ขั้นนั้น
function steps(s = state.sel) {
  const cur = STEPS.find((st) => !selText[st.k](s))?.k;
  return `<ol class="steps" id="steps" aria-label="ขั้นที่เลือก">${STEPS.map((st) => {
    const v = selText[st.k](s);
    return `<li class="${v ? 'done' : st.k === cur ? 'now' : ''}"><button data-step="${st.k}">
      <span>${esc(st.short)}</span><b${v ? '' : ' class="unset"'}>${v ? esc(v) : 'ยังไม่เลือก'}</b></button></li>`;
  }).join('')}</ol>`;
}

const thDate = (d = new Date()) => d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });

function nextIdx(len, i, d) { return (i + d + len) % len; }

// จอคอมฯ (≥1024px): หน้ามีแผงด้านขวา — ตรงกับ @media ใน styles.css
const wide = matchMedia('(min-width: 1024px)');

/* ── หน้าเลือกเที่ยวบิน ───────────────────────────────────── */

// ช่องที่จะเลือกให้หลังปลดล็อกสำเร็จ (กดช่อง "กองทัพอากาศไทย" ตอนยังล็อกอยู่)
let wantSrc = null;

const STEPS = [
  { k: 'src', th: 'ข้อมูลจาก', short: 'ข้อมูลจาก' },
  { k: 'aircraft', th: 'แบบ ฮ.', short: 'แบบ ฮ.' },
  { k: 'mission', th: 'ภารกิจ', short: 'ภารกิจ' },
  { k: 'environment', th: 'อากาศ / สภาพแวดล้อม', short: 'สภาพอากาศ' },
];

/* ภาพถ่ายอากาศยานจริงประจำแบบ ฮ. กองบิน 2 */
const AC_IMG = {
  H225M: 'img/ac-h225m.webp',
  B412EP: 'img/ac-b412ep.webp',
  'S-92': 'img/ac-s92.webp',
  H135: 'img/ac-h135.webp',
  'S-70I': 'img/ac-s70i.webp',
};

/* ภาพร่าง Blueprint SVG ประจำแบบ ฮ. กองบิน 2 สำหรับ Aircraft Selector */
const AC_SVG = {
  H225M: '<svg viewBox="0 0 120 36" class="ac-bp" aria-hidden="true"><path d="M12 20h66l18-6 10 3-8 6-14 4H34l-14-3-8-4z" fill-opacity=".22" stroke-width="1.4"/><path d="M22 10h74M59 10v10M98 11l8 8m0-8l-8 8M40 27h28" fill="none" stroke-width="1.5" stroke-linecap="round"/></svg>',
  B412EP: '<svg viewBox="0 0 120 36" class="ac-bp" aria-hidden="true"><path d="M16 21h58l22-5 8 2-6 5-18 4H32l-10-3-6-3z" fill-opacity=".22" stroke-width="1.4"/><path d="M24 11h68M58 11v10M96 12l6 7m0-7l-6 7M36 28h32M34 26v2M64 26v2" fill="none" stroke-width="1.5" stroke-linecap="round"/></svg>',
  'S-92': '<svg viewBox="0 0 120 36" class="ac-bp" aria-hidden="true"><path d="M10 19h68l20-7 10 2-7 8-15 5H28l-12-3-6-5z" fill-opacity=".22" stroke-width="1.4"/><path d="M20 9h78M59 9v10M100 10l7 7m0-7l-7 7M34 28h36" fill="none" stroke-width="1.5" stroke-linecap="round"/></svg>',
  H135: '<svg viewBox="0 0 120 36" class="ac-bp" aria-hidden="true"><path d="M22 20h50l22-3 8 2-6 4-18 3H36l-10-3-4-3z" fill-opacity=".22" stroke-width="1.4"/><path d="M28 11h60M58 11v9M96 16a3.5 3.5 0 100 .1M38 27h28M42 25v2M62 25v2" fill="none" stroke-width="1.5" stroke-linecap="round"/></svg>',
  'S-70I': '<svg viewBox="0 0 120 36" class="ac-bp" aria-hidden="true"><path d="M12 20h64l22-5 9 2-7 6-18 3H30l-12-3-6-3z" fill-opacity=".22" stroke-width="1.4"/><path d="M20 10h74M57 10v10M98 12l7 7m0-7l-7 7M34 27h30" fill="none" stroke-width="1.5" stroke-linecap="round"/></svg>',
};

function viewFilter() {
  const t = state.tax;
  const squadrons = {};
  for (const a of t.aircraft.filter(inService)) (squadrons[a.squadron] ??= []).push(a);
  const ck = icon('check', 'ic ck');
  const chip = (k, x) => `<button class="chip" data-k="${k}" data-v="${esc(x.code)}" aria-pressed="false">${ck}${esc(x.label)}</button>`;
  const tiers = {};
  for (const h of t.hfacs) if (h.level === 'category') (tiers[h.tier] ??= []).push(h);
  const optCount = state.sel.phase.length + state.sel.hfacs.length + (state.sel.area ? 1 : 0);
  // กดปลดล็อกจากช่อง "กองทัพอากาศไทย" แล้วปลดล็อกสำเร็จ → เลือกช่องนั้นให้เลย
  if (wantSrc && state.unitStatus === 'unlocked') { state.sel.src = wantSrc; LS.set('sel', state.sel); }
  wantSrc = null;

  const st = state.unitStatus;
  const srcN = (v) => allCases().filter((c) => SRC_SET[v].includes(c.source)).length;
  const srcTile = (o) => {
    const head = `<span class="code">${esc(o.th)}</span>`;
    if (o.v === 'TH' && st === 'locked') {
      return `<button class="tile src-t locked" data-act="unlock" data-v="TH">${head}
        <span class="lab">${icon('lock')}ล็อกอยู่ · แตะเพื่อใส่รหัสหน่วย</span></button>`;
    }
    if (o.v === 'TH' && st === 'missing') {
      return `<button class="tile src-t" disabled>${head}<span class="lab">ยังไม่มีข้อมูลหน่วยในเวอร์ชันนี้</span></button>`;
    }
    return `<button class="tile src-t" data-k="src" data-v="${o.v}" aria-pressed="false">${head}
      <span class="lab">${esc(o.sub)}</span><span class="n">${nTh(srcN(o.v))} เคส</span>${ck}</button>`;
  };

  main.innerHTML = `<div class="lay"><div class="view filter">
    <p class="eyebrow">บรีฟก่อนบิน · บน.2 · ${esc(thDate())}</p>
    <h1 class="page-h">เที่ยวบิน<em>วันนี้</em></h1>
    ${steps()}

    <section class="step" id="st-src">
      <div class="step-h"><span class="num">01</span><h2>ข้อมูลจาก</h2><span class="hint"></span></div>
      <div class="tiles src-tiles" role="group" aria-label="แหล่งข้อมูล">${SRC_OPT.map(srcTile).join('')}</div>
    </section>

    <section class="step" id="st-aircraft">
      <div class="step-h"><span class="num">02</span><h2>แบบ ฮ.</h2><span class="hint"></span></div>
      ${Object.entries(squadrons).map(([q, list]) => `<div class="sqn" role="group" aria-label="ฝูง ${q}">
        <div class="sqn-badge"><span class="sqn-sub">ฝูงบิน</span><b>${esc(q)}</b></div>
        <div class="tiles ac-tiles">${list.map((a) => {
          const img = AC_IMG[a.code] || '';
          const bp = AC_SVG[a.code] || '';
          return `<button class="tile tile-ac" data-k="aircraft" data-v="${esc(a.code)}" aria-pressed="false">
            <div class="ac-info">
              <span class="code">${esc(a.code)}</span>
              <span class="lab">${esc(a.label)}</span>
            </div>
            ${img ? `<div class="ac-photo"><img src="${img}" alt="${esc(a.code)}" loading="eager" decoding="async"/></div>` : (bp ? `<div class="ac-blueprint" aria-hidden="true">${bp}</div>` : '')}
            ${icon('check', 'ic ck')}
          </button>`;
        }).join('')}</div>
      </div>`).join('')}
    </section>

    <section class="step" id="st-mission">
      <div class="step-h"><span class="num">03</span><h2>ภารกิจ</h2><span class="hint"></span></div>
      <div class="chips">${t.mission.map((x) => chip('mission', x).replace('</button>', '<b class="cn"></b></button>')).join('')}</div>
    </section>

    <section class="step" id="st-environment">
      <div class="step-h"><span class="num">04</span><h2>อากาศ / สภาพแวดล้อม</h2><span class="hint"></span></div>
      <div class="chips">${t.environment.map((x) => chip('environment', x)).join('')}</div>
    </section>

    <details class="opt step" id="st-opt"${optCount ? ' open' : ''}>
      <summary class="step-h"><span class="num">05</span><h2>เพิ่มเติม <span class="note">ไม่บังคับ</span></h2><span class="hint" id="opt-hint"></span>${icon('down')}</summary>
      <div class="body">
        <div><p class="sub-h">ขั้นตอนการบิน</p><div class="chips">${t.phase.map((x) => chip('phase', x)).join('')}</div></div>
        <div><p class="sub-h">หมวดสาเหตุ (HFACS)</p>
          ${Object.entries(tiers).map(([tier, list]) => `<p class="tier-h">${esc(tier)}</p>
            <div class="chips">${list.map((h) => `<button class="chip" data-k="hfacs" data-v="${esc(h.code)}" aria-pressed="false">${ck}${esc(h.label)}<small>${esc(h.code)}</small></button>`).join('')}</div>`).join('')}
        </div>
        <div><p class="sub-h">พื้นที่</p><p class="note">ยังเลือกไม่ได้ เพราะยังไม่มีรายการ hazard ประจำพื้นที่ — จะเพิ่มหลังได้ไฟล์จาก FSO คนเดิม ระหว่างนี้ดูเคสได้จากขั้นด้านบน</p></div>
      </div>
    </details>
  </div>
  <aside class="side" aria-label="สรุปเที่ยวบิน">
    <div class="side-sum" id="side-sum"></div>
    <div class="actbar"><div class="actbar-in"><button class="btn btn-primary" id="go"></button></div></div>
  </aside></div>`;

  syncFilter();
}

// แผงด้านขวาบนจอคอมฯ: ค่าที่เลือก (แตะเพื่อกลับไปแก้) + จำนวนเคสที่ตรง
function sideSum(s) {
  const optN = s.phase.length + s.hfacs.length;
  let counts = '<p class="note">เลือกแบบ ฮ. ภารกิจ และสภาพอากาศให้ครบเพื่อดูบทเรียน</p>';
  if (ready(s)) {
    const { a, b, c } = match();
    counts = `<p class="side-n"><b>${a.length}</b> เคสตรงเที่ยวบินนี้</p>
      <ul class="side-g">
        <li><i class="g-b"></i>${esc(s.aircraft)} ต่าง 1 เงื่อนไข<b>${b.length}</b></li>
        <li><i class="g-c"></i>แบบอื่น · ใช้ได้ทุกแบบ<b>${c.length}</b></li>
      </ul>`;
  }
  return `<p class="side-h">เที่ยวบินนี้</p>
    <ul class="side-sel">${STEPS.map((st) => {
      const v = selText[st.k](s);
      return `<li><button data-step="${st.k}"><span>${esc(st.th)}</span><b${v ? '' : ' class="unset"'}>${v ? esc(v) : 'ยังไม่เลือก'}</b></button></li>`;
    }).join('')}
    ${optN ? `<li><button data-step="opt"><span>เพิ่มเติม</span><b>${optN} ข้อ</b></button></li>` : ''}</ul>
    ${counts}`;
}

function syncFilter() {
  const s = state.sel;
  for (const b of $$('[data-k]', main)) {
    const v = s[b.dataset.k];
    b.setAttribute('aria-pressed', String(Array.isArray(v) ? v.includes(b.dataset.v) : v === b.dataset.v));
  }
  $('#steps').outerHTML = steps(s);
  for (const st of STEPS) {
    const el = $(`#st-${st.k}`);
    const done = Array.isArray(s[st.k]) ? s[st.k].length > 0 : !!s[st.k];
    el.classList.toggle('done', done);
    el.classList.remove('need');
    $('.hint', el).textContent = st.k === 'src'
      ? `ค้นจาก ${nTh(allCases().filter((c) => inSrc(c, s)).length)} เคส`
      : done
        ? (st.k === 'environment' ? `เลือก ${s.environment.length} ข้อ` : 'เลือกแล้ว')
        : (st.k === 'environment' ? 'เลือกได้หลายข้อ' : 'เลือก 1 ข้อ');
  }
  // จำนวนเคสที่ระบุภารกิจนั้นตรง ๆ (ตามแหล่งและแบบ ฮ. ที่เลือก ไม่นับ "ทุกภารกิจ")
  const pool = allCases().filter((c) => inSrc(c, s) && (!s.aircraft || c.aircraft.includes(s.aircraft) || c.aircraft.includes('ALL')));
  for (const b of $$('#st-mission [data-v]', main)) {
    const n = pool.filter((c) => c.mission.includes(b.dataset.v)).length;
    $('.cn', b).textContent = nTh(n);
    b.classList.toggle('zero', !n);
  }
  const optN = s.phase.length + s.hfacs.length;
  $('#opt-hint').textContent = optN ? `เลือก ${optN} ข้อ` : '';
  $('#side-sum').innerHTML = sideSum(s);

  const go = $('#go');
  if (!ready(s)) {
    const miss = STEPS.find((st) => !(Array.isArray(s[st.k]) ? s[st.k].length : s[st.k]));
    go.className = 'btn btn-primary pending';
    go.innerHTML = `เลือก${miss.th}ต่อ ${icon('next')}`;
    go.dataset.miss = miss.k;
  } else {
    const { a, b, c } = match();
    const more = b.length + c.length;
    go.className = 'btn btn-primary';
    go.innerHTML = `ดูบทเรียน <span class="count">${a.length}</span>`
      + (more ? ` <span class="near">+${more} ใกล้เคียง</span>` : '');
    delete go.dataset.miss;
  }
}

function scrollToStep(k, flash) {
  const el = $(`#st-${k}`);
  if (!el) return;
  el.scrollIntoView({ behavior: reduced.matches ? 'auto' : 'smooth', block: 'start' });
  if (flash) {
    el.classList.add('need');
    el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash');
  }
}

function toggleSel(k, v) {
  const s = state.sel;
  const before = ready(s);
  if (Array.isArray(s[k])) {
    const i = s[k].indexOf(v);
    if (i < 0) s[k].push(v); else s[k].splice(i, 1);
  } else {
    s[k] = k === 'src' ? v : (s[k] === v ? null : v); // "ข้อมูลจาก" ต้องมีค่าเสมอ
  }
  LS.set('sel', s);
  state.open = {};
  syncFilter();
  // ช่วยให้ครบใน ~5 แตะ: เลือกขั้นบังคับแล้วเลื่อนไปขั้นถัดไปที่ยังไม่ได้เลือก
  if (!before && (k === 'aircraft' || k === 'mission') && s[k]) {
    const nextStep = STEPS.find((st) => !(Array.isArray(s[st.k]) ? s[st.k].length : s[st.k]));
    if (nextStep) {
      const r = $(`#st-${nextStep.k}`).getBoundingClientRect();
      if (r.top > innerHeight * 0.55) scrollToStep(nextStep.k, false);
    }
  }
}

/* ── หน้ารายการบทเรียน ────────────────────────────────────── */

// บอกว่าเคสตรงกับเที่ยวบินตรงไหน และต่างตรงไหน (สีส้ม)
function matchLine({ c, m }) {
  const s = state.sel;
  const labs = (kind, arr) => arr.map((v) => label(kind, v)).join('/');
  const miss = (k, txt) => `<span class="miss">ต่าง${k}: ${esc(txt)}</span>`;
  // กลุ่ม ค: บอกว่าเกิดกับแบบไหน เพื่อไม่ให้เข้าใจผิดว่าเป็นเคสของแบบที่เลือก
  const other = c.aircraft.filter((a) => a !== 'ALL');
  const parts = [
    m[0] ? esc(s.aircraft) : `<span class="oth">${other.length ? `เกิดกับ ${esc(other.join('/'))} · ` : ''}ใช้ได้ทุกแบบ</span>`,
    m[1] ? (c.mission.includes('ALL') ? 'ทุกภารกิจ' : esc(label('mission', s.mission))) : miss('ภารกิจ', labs('mission', c.mission)),
    m[2] ? (c.environment.includes('ALL') ? 'ทุกสภาพอากาศ' : esc(labs('environment', s.environment.filter((e) => c.environment.includes(e)))))
      : miss('สภาพอากาศ', labs('environment', c.environment)),
  ];
  const opt = [...c.phase.filter((p) => s.phase.includes(p)), ...c.hfacs.filter((h) => s.hfacs.includes(hfacsCat(h)))];
  return parts.join(' · ') + (opt.length ? ` <span class="opt">+ ${esc(opt.join(' '))}</span>` : '');
}

/* เรื่องที่เลือกเข้าบรีฟ (ปุ่ม +/✓): จำต่อชุดตัวกรอง เปลี่ยนตัวกรองแล้วกลับไปใช้ 3 อันดับแรก */
function selKey(s = state.sel) {
  return JSON.stringify([s.src, s.aircraft, s.mission, [...s.environment].sort(), [...s.phase].sort(), [...s.hfacs].sort(), s.area]);
}
// ค่าเริ่มต้น = 3 อันดับแรกเรียงกลุ่ม ก → ข → ค
function picks(m = match()) {
  const order = m.all.map((x) => x.c.id);
  const saved = LS.get('picks', null);
  const ids = saved && saved.key === selKey() ? saved.ids : order.filter((id) => !id.startsWith('W2M-')).slice(0, SHOW_TOP);
  return ids.filter((id) => order.includes(id)).sort((a, b) => order.indexOf(a) - order.indexOf(b));
}
function setPicks(ids) { LS.set('picks', { key: selKey(), ids }); }

// แถวที่เห็นในแต่ละกลุ่ม: 3 อันดับแรก + เรื่องที่เลือกไว้ (หรือทั้งกลุ่มเมื่อกด "ดูอีก")
// แท็บ MOR/HR แยกการ์ด W2M- ออกจากบทเรียนอื่น แต่เรื่องที่เลือกเข้าบรีฟใช้ร่วมกันทั้งสองแท็บ
function visible() {
  const full = match();
  const pk = picks(full);
  const nMor = full.all.filter((x) => isMor(x.c)).length;
  const nCards = full.all.length - nMor;
  const mor = nMor > 0 && (state.rtab === 'mor' || !nCards);
  const m = { nMor, nCards, mor };
  for (const k of GROUPS) m[k] = full[k].filter((x) => isMor(x.c) === mor);
  m.all = GROUPS.flatMap((k) => m[k]);
  const shown = {};
  for (const k of GROUPS) shown[k] = m[k].filter((x, i) => state.open[k] || i < SHOW_TOP || pk.includes(x.c.id));
  return { ...m, pk, shown };
}

const pickBtn = (c, on) => `<button class="pick" data-pick="${esc(c.id)}" aria-pressed="${on}" aria-label="เลือกเข้าบรีฟ: ${esc(c.title)}" title="เลือกเข้าบรีฟ">${icon('plus', 'ic off')}${icon('check', 'ic on')}</button>`;

function presentLabel(n) {
  return n ? `${icon('play')} เริ่มบรีฟ <span class="count">${n}</span> เรื่อง` : 'แตะ + เพื่อเลือกเรื่องเข้าบรีฟ';
}

// แผงด้านขวาบนจอคอมฯ: ชุดบรีฟวันนี้ ตามลำดับที่จะขึ้นจอ
function pickList(pk) {
  return `<p class="side-h" tabindex="-1">ชุดบรีฟวันนี้ <span>${pk.length} เรื่อง</span></p>
    ${pk.length ? `<ol class="side-picks">${pk.map((id, k) => {
      const c = byId(id);
      return `<li><span class="n">${k + 1}</span><a href="#/case/${encodeURIComponent(id)}"><span class="yr">${esc(c.year)}</span>${esc(c.title)}</a>
        <button class="pick unpick" data-pick="${esc(id)}" aria-label="เอาออกจากบรีฟ: ${esc(c.title)}" title="เอาออกจากบรีฟ">${icon('x')}</button></li>`;
    }).join('')}</ol>` : '<p class="note">ยังไม่ได้เลือก — แตะ + ที่เรื่องในรายการ</p>'}`;
}

function viewResults() {
  if (!ready()) { location.replace('#/filter'); return; }
  const m = visible();
  const { all, pk, shown } = m;
  const s = state.sel;
  const ac = esc(s.aircraft);
  const locked = state.unitStatus === 'locked';
  const pool = allCases().filter((c) => inSrc(c, s)).length;
  const row = (x) => `<li><span class="yr">${esc(x.c.year)}</span>
    <a class="rt" href="#/case/${encodeURIComponent(x.c.id)}"><b>${esc(x.c.title)}</b><span class="meta">${tags(x.c, { year: false })}</span><span class="ml">${matchLine(x)}</span></a>
    ${pickBtn(x.c, pk.includes(x.c.id))}</li>`;
  // หัวกลุ่ม: ตัวอักษร ก/ข/ค + คำอธิบายว่าทำไมเคสถึงอยู่ในกลุ่มนี้
  const GH = {
    a: ['ก', `${ac} · ตรงทั้งภารกิจและสภาพอากาศ`, 'ตรงเที่ยวบินนี้ที่สุด ใช้บรีฟได้ทันที'],
    b: ['ข', `${ac} · ต่างภารกิจหรือสภาพอากาศ`, 'แบบเดียวกัน แต่ต่างไป 1 เงื่อนไข — ข้อความสีส้มบอกว่าต่างตรงไหน'],
    c: ['ค', 'แบบอื่น · บทเรียนใช้ได้ทุกแบบ', `เกิดกับ ฮ. แบบอื่น แต่บทเรียนไม่ขึ้นกับแบบ · ตรงทั้งภารกิจและสภาพอากาศ`],
  };

  const filt = [`ข้อมูล${srcOpt(s.src).th}`, s.aircraft, label('mission', s.mission), ...s.environment.map((e) => label('environment', e))];
  let html = `<div class="lay${all.length ? '' : ' solo'}"><div class="view results">
    <p class="eyebrow">บรีฟก่อนบิน · ${esc(thDate())}</p>
    <div class="filt" aria-label="ตัวกรองที่ใช้">${filt.map((f) => `<span>${esc(f)}</span>`).join('')}<a class="edit" href="#/filter">แก้</a></div>`;
  if (m.nMor) {
    html += `<nav class="r-tabs" aria-label="ประเภทบทเรียน">
      <button data-rtab="cards" aria-pressed="${!m.mor}">${icon('card')}บทเรียน<span class="n">${m.nCards}</span></button>
      <button data-rtab="mor" aria-pressed="${m.mor}">${icon('doc')}MOR/HR บน.2<span class="n">${m.nMor}</span></button></nav>`;
  }
  const lockNote = locked && s.src !== 'INTL'
    ? `<p class="note dash-note">${icon('lock')}<span>ข้อมูลหน่วย (บน.2 / ทอ.) ยังล็อกอยู่ ผลนี้มีแต่เคสต่างประเทศ · <a href="#/results" data-act="unlock">ใส่รหัสหน่วย</a></span></p>` : '';

  if (all.length) {
    const from = `ค้นจาก ${nTh(pool)} เคส${s.src === 'ALL' ? '' : ` (${esc(srcOpt(s.src).th)})`}`;
    // ไม่มีกลุ่ม ก: ตัวเลขใหญ่เป็นจำนวนเคสใกล้เคียง (ข + ค) และบอกตรง ๆ ว่ายังไม่มีเคสที่ตรงทั้งหมด
    html += m.mor
      ? `<div class="hero"><span class="big">${all.length}</span><div>
        <h1>รายงาน MOR/HR ของ บน.2</h1><p>การ์ดจากแบบฟอร์ม MOR/HR ที่เข้ากับเที่ยวบินนี้ · เรียงตามความตรงเหมือนแท็บบทเรียน</p></div></div>
        <div id="morsum"></div>`
      : m.a.length
      ? `<div class="hero"><span class="big">${m.a.length}</span><div>
        <h1>บทเรียนตรงเที่ยวบินนี้</h1><p>${ac} · ตรงทั้งภารกิจและสภาพอากาศ · ${from}</p></div></div>`
      : `<div class="hero near"><span class="big">${all.length}</span><div>
        <h1>บทเรียนใกล้เคียงเที่ยวบินนี้</h1><p>ยังไม่มีเคส ${ac} ที่ตรงทั้งภารกิจและสภาพอากาศ · ${from}</p></div></div>`;
    html += `
      <ol class="gsum" aria-label="จำนวนเคสแต่ละกลุ่ม">${GROUPS.map((k) => `<li class="g-${k}${m[k].length ? '' : ' zero'}">
        <span class="gl">${GH[k][0]}</span><span class="gt">${k === 'a' ? '<span>ตรงเที่ยวบินนี้</span>' : k === 'b' ? `<span>${ac}</span> <span>ต่าง 1 เงื่อนไข</span>` : '<span>แบบอื่น</span> <span>ใช้ได้ทุกแบบ</span>'}</span><b>${m[k].length}</b></li>`).join('')}</ol>
      ${lockNote}
      <div class="sec-row"><h2>เลือกเข้าบรีฟ</h2><span id="pick-n">เลือกแล้ว ${pk.length} เรื่อง</span></div>
      <p class="note">แตะ + เพื่อเลือกเรื่องเข้าบรีฟ · 3 อันดับแรกเลือกไว้ให้แล้ว</p>`;
    for (const k of GROUPS) {
      const list = m[k];
      if (!list.length) continue; // กลุ่มว่างเห็นเป็น 0 ในแถบสรุปด้านบนแล้ว
      html += `<section class="grp g-${k}" aria-label="กลุ่ม ${GH[k][0]}">
        <div class="grp-h"><span class="gl">${GH[k][0]}</span><div><h2>${GH[k][1]} <span class="gn">${list.length}</span></h2><p>${GH[k][2]}</p></div></div>
        <ul class="rows">${shown[k].map(row).join('')}</ul>`;
      if (list.length > SHOW_TOP) {
        html += `<button class="btn more" data-act="grp" data-g="${k}">${state.open[k] ? 'แสดงเฉพาะ 3 อันดับแรกและเรื่องที่เลือก' : `ดูอีก ${list.length - shown[k].length} เคส`}</button>`;
      }
      html += '</section>';
    }
  } else {
    html += `<div class="empty">${icon('brief')}
      <h2>ยังไม่มีบทเรียนสำหรับเที่ยวบินนี้</h2>
      <p>ใน${s.src === 'ALL' ? 'ฐานข้อมูล' : `ข้อมูล${esc(srcOpt(s.src).th)}`}ยังไม่มีเคสของ ${ac} ที่ตรงภารกิจหรือสภาพอากาศที่เลือก และไม่มีเคสที่ใช้ได้ทุกแบบซึ่งตรงทั้งสองอย่าง</p>
      <p>ลองเลือกสภาพอากาศเพิ่ม เปลี่ยนภารกิจ${s.src === 'ALL' ? '' : ' หรือเปลี่ยน "ข้อมูลจาก" เป็นทั้งหมด'}${locked ? ' · ปลดล็อกข้อมูลหน่วยเพื่อดูเคสของ บน.2 ด้วย' : ''}</p>
      <div class="acts"><a class="btn" href="#/filter">แก้ตัวกรอง</a>${locked ? '<button class="btn" data-act="unlock">ใส่รหัสหน่วย</button>' : ''}</div></div>`;
  }
  html += '</div>';
  if (all.length) {
    html += `<aside class="side" aria-label="ชุดบรีฟวันนี้">
      <div class="side-sum" id="side-picks">${pickList(pk)}</div>
      <div class="actbar"><div class="actbar-in">
        <button class="btn btn-primary" id="present"${pk.length ? '' : ' disabled'}>${presentLabel(pk.length)}</button>
      </div></div></aside>`;
  }
  main.innerHTML = html + '</div>';
  if (m.mor) fillMorSum(s.aircraft);
}

// สรุป MOR/HR ของแบบ ฮ. ที่เลือก 3 ปีงบล่าสุด จากประวัติเหตุ (ไม่ขึ้นกับภารกิจ/สภาพอากาศ)
// acc 'B412' = ทะเบียนไม่ระบุรุ่นย่อย นับเข้ากับ Bell 412 ทุกรุ่น
const acHit = (acc, ac) => acc === ac || (acc === 'B412' && /^B412/.test(ac));
async function fillMorSum(ac) {
  const at = location.hash;
  const h = await loadHistory();
  const box = $('#morsum');
  if (location.hash !== at || !box || h.status !== 'ok') return;
  const d = h.data;
  const top = Math.max(...d.items.map((x) => x.fy));
  const fys = [top, top - 1, top - 2];
  const list = d.items.filter((x) => (x.src === 'm' || x.src === 'f') && fys.includes(x.fy) && acHit(x.acc, ac)).sort(byFyDesc);
  if (!list.length) {
    box.innerHTML = `<p class="note morsum-n">ปีงบ ${top - 2}–${top} ไม่มีรายงาน MOR/HR ของ ${esc(ac)} ในทะเบียน</p>`;
    return;
  }
  const tps = {};
  for (const x of list) for (const t of x.tp || []) tps[t] = (tps[t] || 0) + 1;
  const topT = Object.entries(tps).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const max = Math.max(...fys.map((fy) => list.filter((x) => x.fy === fy).length));
  box.innerHTML = `<section class="sec morsum" aria-labelledby="morsum-h">
    <h2 class="sec-h" id="morsum-h">${icon('hist')}${esc(ac)} ใน 3 ปีงบล่าสุด</h2>
    <p class="note">ปีงบ ${top - 2}–${top} · ${nTh(list.length)} รายงาน · นับทุกภารกิจและสภาพอากาศ</p>
    <ol class="ms-y">${fys.map((fy) => {
      const y = list.filter((x) => x.fy === fy);
      const by = ['accident', 'incident', 'hazard'].map((k) => [k, y.filter((x) => x.type === k).length]).filter(([, n]) => n);
      return `<li><span class="yr">ปีงบ ${fy}</span><span class="bar"><i style="width:${max ? (y.length / max) * 100 : 0}%"></i></span><b>${y.length}</b>
        <span class="by">${by.map(([k, n]) => `<span>${dot(TYPE[k][1])}${TYPE[k][0]} ${n}</span>`).join('')}</span></li>`;
    }).join('')}</ol>
    ${topT.length ? `<p class="ms-tp"><span class="k">พบบ่อย</span>${topT.map(([t, n]) => `<a data-hb href="#/history/topic/${t}">${esc(d.short[t])} <b>${n}</b></a>`).join('')}</p>` : ''}
    <ul class="evs">${list.slice(0, 4).map((x) => hRow(x, { fy: true })).join('')}</ul>
    <a class="btn more" href="#/history">เปิดประวัติเหตุ บน.2${icon('next')}</a>
  </section>`;
}

function togglePick(id) {
  const ids = picks();
  const i = ids.indexOf(id);
  if (i < 0) ids.push(id); else ids.splice(i, 1);
  setPicks(ids);
  for (const b of $$('.rows [data-pick], .case-top [data-pick]', main)) if (b.dataset.pick === id) b.setAttribute('aria-pressed', String(i < 0));
  const pk = picks();
  const n = $('#pick-n');
  if (n) n.textContent = `เลือกแล้ว ${pk.length} เรื่อง`;
  const go = $('#present');
  if (go) {
    go.innerHTML = presentLabel(pk.length);
    go.disabled = !pk.length;
  }
  const side = $('#side-picks');
  if (side) {
    // กด ✕ ในแผงขวาแล้วปุ่มหายไปกับรายการ — ย้ายโฟกัสไปเรื่องถัดไป (หรือปุ่มเริ่มบรีฟ) ไม่ให้หลุดไปต้นหน้า
    const inSide = side.contains(document.activeElement);
    side.innerHTML = pickList(pk);
    if (inSide) { const left = $$('.unpick', side); (left[Math.min(i, left.length - 1)] || (pk.length ? go : $('.side-h', side)))?.focus(); }
  }
  if (i < 0) navigator.vibrate?.(10);
}

/* ── หน้าเคส ──────────────────────────────────────────────── */

function localDate() { return new Date().toLocaleDateString('sv'); }

// เช็กลิสต์ "ทำวันนี้" รีเซ็ตทุกวัน
function ticks() {
  let t = LS.get('ticks', null);
  if (!t || t.date !== localDate()) t = { date: localDate(), cases: {} };
  return t;
}

function safeUrl(u) { return /^https?:\/\//i.test(u) ? u : ''; }

function hfacsHtml(c) {
  if (!c.hfacs.length) return '';
  return `<section class="sec hf"><h2 class="sec-h">หมวดสาเหตุ (HFACS)</h2><div class="hf-list">${c.hfacs.map((h) =>
    `<span><b>${esc(h)}</b>${esc(label('hfacs', h))}</span>`).join('')}</div></section>`;
}

/* ── เนื้อเรื่องเคส (DECISIONS.md "เนื้อเรื่องเคส") ─────────────────
   summary เก็บย่อหน้าละบรรทัด · บรรทัดที่ขึ้นต้นด้วย [หมวด] เริ่มหมวดใหม่ เรียงตามหัวข้อรายงาน ICAO Annex 13
   ระดับความแน่นอนของ JTSB อยู่ในวงเล็บเป็นคำญี่ปุ่นตามต้นฉบับ (กฎ ฎ) แปลงเป็นป้ายไทยตอนแสดงเท่านั้น */
const STORY_H = {
  เหตุการณ์: 'ลำดับเหตุการณ์', การรอดชีวิต: 'การรอดชีวิตและการช่วยเหลือ', ผลการสอบสวน: 'ผลการวิเคราะห์',
  นักบิน: 'ข้อมูลนักบิน', สาเหตุ: 'สาเหตุตามรายงาน', หลังเหตุ: 'การแก้ไขหลังเหตุ',
};
// [คำในรายงาน, ระดับ 0–4, ป้ายไทย, คำที่ JTSB ใช้ในฉบับอังกฤษ] — คำยาวต้องมาก่อน ไม่งั้น 可能性 จับก่อน
const CONF = [
  ['可能性が高いと考えられる', 2, 'มีโอกาสสูง', 'highly likely'],
  ['可能性は低い', 0, 'ไม่น่าใช่', 'unlikely'],
  ['否定できない', 1, 'ตัดออกไม่ได้', 'cannot be ruled out'],
  ['認められる', 4, 'ยืนยันได้', 'certain'],
  ['推定', 3, 'เกือบแน่', 'highly probable'],
  ['考えられる', 2, 'น่าจะ', 'likely'],
  ['思われる', 1, 'ดูเหมือน', 'it appears'],
  ['可能性', 1, 'เป็นไปได้', 'possible'],
];
const CONF_RX = new RegExp(`\\(([^()]*?)(${CONF.map((x) => x[0]).join('|')})([^()]*)\\)`, 'g');
const meter = (lv) => `<svg class="cf-m" viewBox="0 0 15 10" aria-hidden="true">${[0, 1, 2, 3].map((i) =>
  `<rect x="${i * 4}" y="${7.5 - i * 2.5}" width="3" height="${2.5 + i * 2.5}" rx=".6"${i < lv ? '' : ' class="off"'}/>`).join('')}</svg>`;
const chip = (lv, th, en) => `<span class="cf" title="ระดับความแน่นอนตามรายงาน: ${en}">${meter(lv)}${th}</span>`;
// รับข้อความที่ esc แล้ว · "(ทั้งสองข้อ 可能性)" → ป้าย "ทั้งสองข้อ เป็นไปได้" · ส่วนท้ายหลัง ; ยังเป็นวงเล็บธรรมดา
const conf = (h) => h.replace(CONF_RX, (_, pre, k, post) => {
  const [, lv, th, en] = CONF.find((x) => x[0] === k);
  const rest = post.replace(/^[\s;,]+/, '').trim();
  return chip(lv, `${pre.trim() ? `${pre.trim()} ` : ''}${th}`, en) + (rest ? ` (${rest})` : '');
});
// คำอธิบายใต้เรื่อง: 4 ระดับหลัก จากแน่นอนที่สุดลงไป
const CONF_KEY = `<p class="cf-key"><span class="k">ระดับความแน่นอนตามรายงาน</span>${['認められる', '推定', '考えられる', '可能性']
  .map((k) => CONF.find((x) => x[0] === k)).map(([, lv, th, en]) => chip(lv, th, en)).join('')}</p>`;

function storyParse(s) {
  const gs = [];
  for (const line of String(s ?? '').split('\n')) {
    const t = line.trim();
    if (!t) continue;
    const m = /^\[([^\]]+)\]\s*(.*)$/.exec(t);
    if (m || !gs.length) gs.push({ k: m ? m[1] : '', ps: [] });
    if (m ? m[2] : t) gs.at(-1).ps.push(m ? m[2] : t);
  }
  return gs;
}

// เต็ม: ย่อหน้าเปิด (lede) → หมวดตามลำดับ · สาเหตุเป็นกล่อง · brief: ย่อหน้าเปิด + สาเหตุ (สำหรับจอบรีฟ)
function storyHtml(c, { brief = false } = {}) {
  const gs = storyParse(c.summary);
  const p = (t) => `<p>${conf(esc(t))}</p>`;
  const out = gs.map((g, gi) => {
    if (!g.k) return g.ps.map((t, k) => (gi === 0 && k === 0 ? `<p class="lede">${conf(esc(t))}</p>` : brief ? '' : p(t))).join('');
    if (brief && g.k !== 'สาเหตุ') return '';
    const h = `<h2 class="st-h">${esc(STORY_H[g.k] ?? g.k)}</h2>`;
    return `<section class="${g.k === 'สาเหตุ' ? 'st-g st-cause' : 'st-g'}">${h}${g.ps.map(p).join('')}</section>`;
  }).join('');
  return `<div class="story">${out}${!brief && out.includes('class="cf"') ? CONF_KEY : ''}</div>`;
}

// ข้อมูลเบื้องต้นแบบหัวรายงาน — แสดงเฉพาะช่องที่มีค่า
// แถบข้อมูลย่อเป็นแท็กที่ใช้กรอง (ใช้กับแบบ ฮ. ไหนในฝูง) ไม่ใช่แบบของเครื่องที่เกิดเหตุ — แบบจริงอยู่ในหัวเรื่อง
const ALL_TH = { aircraft: 'ทุกแบบ', mission: 'ทุกภารกิจ', environment: 'ทุกสภาพ' };
function factsHtml(c) {
  const labs = (kind) => (c[kind] || []).map((v) => (v === 'ALL' ? ALL_TH[kind] : label(kind, v))).join(' · ');
  const rows = [['ใช้กับแบบ ฮ.', labs('aircraft')], ['ภารกิจ', labs('mission')],
    ['ช่วงการบิน', labs('phase')], ['สภาพแวดล้อม', labs('environment')]].filter(([, v]) => v);
  return rows.length ? `<dl class="facts">${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>` : '';
}

// ข้อเท็จจริงที่รวมมาจากรายงาน MOR/HR เรื่องอื่นที่เป็นเหตุเดียวกัน (more: [{h: id เรื่อง, x: [ข้อความ]}])
// หัวเรื่องเติมทีหลังใน fillHistPanel เมื่อโหลดประวัติเหตุแล้ว
function moreHtml(c) {
  const m = (c.more || []).filter((x) => x?.h && x.x?.length);
  if (!m.length) return '';
  return `<section class="sec cmore" aria-labelledby="cmore-h">
    <h2 class="sec-h" id="cmore-h">${icon('doc')}รายงาน MOR/HR ที่รวมไว้ <span class="n">${m.length} เรื่อง</span></h2>
    ${m.map((x) => `<div class="cm"><a class="cm-h" data-hmore="${esc(x.h)}" href="#/history/${encodeURIComponent(x.h)}">${esc(x.h)}</a>
      <ul>${x.x.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></div>`).join('')}
  </section>`;
}

// ลำดับในหน้าเคส: สรุป → ปัจจัย (พับไว้) → ทำวันนี้ (เช็กลิสต์ 56px) → คำถามบรีฟ → HFACS → ต้นฉบับ
// จอคอมฯ: ทำวันนี้ + คำถามบรีฟ ย้ายไปแผงด้านขวา และกางปัจจัยไว้ (ลำดับ DOM คงเดิมสำหรับมือถือ)
function viewCase(id) {
  const c = byId(id);
  if (!c) { viewNotFound(); return; }
  const d = deckFor(id);
  const i = d.indexOf(id);
  const done = ticks().cases[id] || [];
  const ref = safeUrl(c.ref);
  const fromRes = ready() && !state.caseBack;
  const facOpen = wide.matches;
  const href = (dir) => `#/case/${encodeURIComponent(d[nextIdx(d.length, i, dir)])}`;
  const nav = d.length > 1 ? `<a class="btn" data-replace href="${href(-1)}" aria-label="เคสก่อนหน้า">${icon('back')}<span>ก่อนหน้า</span></a>
    <a class="btn" data-replace href="${href(1)}" aria-label="เคสถัดไป"><span>ถัดไป</span>${icon('next')}</a>` : '';

  main.innerHTML = `<article class="view case">
    <div class="case-head">
      <div class="case-top">
        <a class="back" href="${state.caseBack || '#/results'}" aria-label="กลับไปรายการ">${icon('back')}</a>
        <div class="meta">${tags(c)}</div>
        <span class="pos">${d.length > 1 ? `${i + 1}/${d.length}` : ''}</span>
        ${fromRes ? pickBtn(c, picks().includes(id)) : ''}
      </div>
      <h1>${esc(c.title)}</h1>
      ${factsHtml(c)}
      ${storyHtml(c)}

      ${c.factors.length ? `<button class="fac-t" data-act="factors" aria-expanded="${facOpen}" aria-controls="fac">ปัจจัยที่เกี่ยวข้อง
        <span class="n">${c.factors.length} ข้อ ${icon('down')}</span></button>
      <ul class="factors" id="fac"${facOpen ? '' : ' hidden'}>${c.factors.map((f) => `<li>${conf(esc(f))}</li>`).join('')}</ul>` : ''}
      ${moreHtml(c)}
    </div>

    <div class="case-side">
      <section class="sec">
        <h2 class="sec-h">ทำวันนี้ <span class="prog" id="prog">${done.length}/${c.actions_today.length}</span></h2>
        <ol class="todo">${c.actions_today.map((a, k) => `<li><button data-tick="${k}" aria-pressed="${done.includes(k)}">
          <span class="n">${k + 1}</span><span class="t">${esc(a)}</span><span class="box">${icon('check')}</span></button></li>`).join('')}</ol>
      </section>

      <section class="ask">
        <p class="ask-l">คำถามบรีฟ</p>
        <p class="q">${esc(c.brief_question)}</p>
      </section>

      ${nav ? `<nav class="side-nav" aria-label="เลื่อนเคส">${nav}</nav>` : ''}
    </div>

    <div class="case-more">
      ${hfacsHtml(c)}
      <div id="histp"></div>

      ${ref ? `<a class="btn ref" href="${esc(ref)}" target="_blank" rel="noopener noreferrer">
        <span>อ่านรายงานต้นฉบับ<small>${esc(c.ref_label)} · ${esc(c.id)}</small></span>${icon('ext')}</a>`
        : `<p class="ref-note"><span class="k">ที่มา</span>${esc(c.ref)} · ${esc(c.id)}</p>`}
    </div>
  </article>
  ${nav ? `<div class="actbar case-nav"><div class="actbar-in">${nav}</div></div>` : ''}`;
  if (LS.get('histPanel', true) || c.more) fillHistPanel(c, LS.get('histPanel', true));
}

function toggleTick(id, k) {
  const t = ticks();
  const list = t.cases[id] || [];
  const i = list.indexOf(k);
  if (i < 0) list.push(k); else list.splice(i, 1);
  t.cases[id] = list;
  LS.set('ticks', t);
  $(`[data-tick="${k}"]`, main)?.setAttribute('aria-pressed', String(i < 0));
  const p = $('#prog'); // หน้าบรีฟไม่มีตัวนับ
  if (p) p.textContent = `${list.length}/${byId(id).actions_today.length}`;
  if (i < 0) navigator.vibrate?.(10);
}

/* ── โหมดบรีฟ ─────────────────────────────────────────────── */
// หน้าเปิด → เคสที่เลือกทีละเรื่อง → หน้าปิด (รวมคำถามบรีฟ) ไม่วนกลับ (DECISIONS.md "หน้าตาแอป" ข้อ 3)

let wake = null;
async function keepAwake() {
  try { wake = await navigator.wakeLock?.request('screen'); } catch { wake = null; }
}
function releaseAwake() { wake?.release().catch(() => {}); wake = null; }
document.addEventListener('visibilitychange', () => {
  const cl = document.body.classList;
  if (document.visibilityState === 'visible' && (cl.contains('briefing') || cl.contains('lesson'))) keepAwake();
});

let briefDeck = [];
let briefIdx = 0; // -1 = หน้าเปิด, briefDeck.length = หน้าปิด
let briefStep = 0;
let briefFromList = false; // เข้ามาจากปุ่มเริ่มบรีฟ → ออกด้วย history.back() ไม่ให้หน้ารายการซ้อนในประวัติ

/* สองแบบ (DECISIONS.md หัวข้อ "หน้าตาแอป"): ทั้งการ์ดในหน้าเดียว หรือทีละประเด็น สรุป → ปัจจัย → ทำวันนี้ → ถามลูกเรือ */
const PSTEP = { sum: 'สรุป', fac: 'ปัจจัย', do: 'ทำวันนี้', ask: 'ถามลูกเรือ' };
const pstepsOf = (c) => ['sum', ...(c.factors.length ? ['fac'] : []), 'do', 'ask'];
const projMode = () => (LS.get('projMode', 'card') === 'step' ? 'step' : 'card');
const briefUrl = (id, step) => `#/brief/${encodeURIComponent(id)}${step == null ? '' : `/${step}`}`;
const COVER = '#/brief';
const END = '#/brief/end';
const FAC_MAX = 3;

// ชุดบรีฟ = เรื่องที่เลือกไว้ในหน้ารายการ · เปิดลิงก์เคสที่ไม่อยู่ในชุด → บรีฟเคสนั้นเคสเดียว
function briefSet(id) {
  const pk = ready() ? picks() : [];
  if (!id || pk.includes(id)) return pk;
  return briefDeck.includes(id) ? briefDeck : [id];
}

// รายการ "ทำวันนี้" ของบรีฟ แตะติ๊กได้ ใช้ที่เก็บเดียวกับหน้าเคส
function pdoList(c) {
  const done = ticks().cases[c.id] || [];
  return `<ol class="pdo">${c.actions_today.map((a, k) => `<li><button data-tick="${k}" aria-pressed="${done.includes(k)}">`
    + `<span class="n">${k + 1}</span><span class="t">${esc(a)}</span><span class="box">${icon('check')}</span></button></li>`).join('')}</ol>`;
}

function pmain(c, key) {
  const pdo = pdoList(c);
  switch (key) {
    case 'sum': return `<h1 class="ptitle">${esc(c.title)}</h1><div class="ptext">${storyHtml(c, { brief: true })}</div>`;
    case 'fac': return `<p class="plab">ปัจจัยที่เกี่ยวข้อง</p><ul class="pfac">${c.factors.slice(0, FAC_MAX).map((f) => `<li>${conf(esc(f))}</li>`).join('')}</ul>`
      + (c.factors.length > FAC_MAX ? `<p class="ptext">และอีก ${c.factors.length - FAC_MAX} ข้อ ดูได้ในหน้าเคส</p>` : '');
    case 'do': return `<p class="plab">ทำวันนี้</p>${pdo}`;
    default: return `<p class="plab">คำถามบรีฟ — ถามลูกเรือ</p><p class="pq">${esc(c.brief_question)}</p>`;
  }
}

const fullLabel = () => `${document.fullscreenElement ? 'ออกจากเต็มจอ' : 'เต็มจอ'} (F)`;

function briefTools() {
  const mode = projMode();
  const other = document.documentElement.dataset.theme === 'day' ? 'กลางคืน' : 'กลางวัน';
  return `<div class="tools">
      <div class="seg mini" role="group" aria-label="รูปแบบการแสดง">
        <button data-mode="card" aria-pressed="${mode === 'card'}">ทั้งการ์ด</button>
        <button data-mode="step" aria-pressed="${mode === 'step'}">ทีละประเด็น</button>
      </div>
      <button class="btn" data-act="theme" aria-label="สลับเป็นธีม${other}" title="สลับธีมให้เหมาะกับจอโปรเจกเตอร์">${other}</button>
      ${document.fullscreenEnabled ? `<button class="btn btn-icon" id="full" data-act="full" aria-label="${fullLabel()}" title="${fullLabel()}">${icon(document.fullscreenElement ? 'shrink' : 'full')}</button>` : ''}
      <a class="btn btn-icon" href="#/results" data-act="exit" aria-label="ออกจากโหมดบรีฟ (Esc)" title="ออกจากโหมดบรีฟ (Esc)">${icon('x')}</a>
    </div>`;
}

const KEYS = '<p class="keys"><kbd>←</kbd> <kbd>→</kbd> หรือรีโมต · <kbd>F</kbd> เต็มจอ · <kbd>Esc</kbd> ออก</p>';

function briefFrame(body, edges) {
  main.innerHTML = `<div class="brief" role="region" aria-label="โหมดบรีฟ" aria-roledescription="slide deck">${body}</div>
  ${edges ? '<button class="edge l" data-go="-1" tabindex="-1" aria-hidden="true"></button><button class="edge r" data-go="1" tabindex="-1" aria-hidden="true"></button>' : ''}`;
  keepAwake();
}

// หน้าเปิด: วันที่ เงื่อนไขเที่ยวบิน และรายชื่อเรื่องที่จะคุย
function viewBriefCover() {
  briefDeck = briefSet();
  if (!briefDeck.length) { location.replace('#/results'); return; }
  briefIdx = -1;
  briefStep = 0;
  const s = state.sel;
  const cond = [s.aircraft, label('mission', s.mission), ...s.environment.map((e) => label('environment', e))];
  briefFrame(`<div class="brief-top"><p class="b-eyebrow">บรีฟก่อนบิน · บน.2 · ${esc(thDate())}</p>${briefTools()}</div>
    <div class="cover">
      <h1>บทเรียนนิรภัย <em>${briefDeck.length} เรื่อง</em></h1>
      <p class="cond" aria-label="เงื่อนไขเที่ยวบิน">${cond.map((f) => `<span>${esc(f)}</span>`).join('')}</p>
      <ol class="cover-list">${briefDeck.map((id, k) => {
        const c = byId(id);
        const [th, cls] = typeOf(c);
        return `<li><a href="${briefUrl(id)}" data-replace><span class="n">${k + 1}</span>
          <span class="t">${esc(c.title)}</span><span class="m">${dot(cls)}${esc(th)} · ${esc(srcLabel(c))} · ${esc(c.year)}</span></a></li>`;
      }).join('')}</ol>
    </div>
    <div class="brief-foot">${KEYS}
      <button class="btn btn-primary" data-go="1">เริ่มเรื่องแรก ${icon('next')}</button></div>`, false);
}

// หน้าปิด: คำถามบรีฟทุกเรื่องในหน้าเดียว ใช้ทวนก่อนจบ
function viewBriefEnd() {
  briefDeck = briefSet();
  if (!briefDeck.length) { location.replace('#/results'); return; }
  briefIdx = briefDeck.length;
  briefStep = 0;
  briefFrame(`<div class="brief-top"><p class="b-eyebrow">ทวนก่อนจบบรีฟ</p>${briefTools()}</div>
    <div class="endq">
      <h1>คำถามบรีฟ <em>${briefDeck.length} ข้อ</em></h1>
      <ol>${briefDeck.map((id, k) => {
        const c = byId(id);
        return `<li><span class="n">${k + 1}</span><div><p class="q">${esc(c.brief_question)}</p><p class="t">${esc(c.title)}</p></div></li>`;
      }).join('')}</ol>
      <div class="end-air" aria-label="Wing 2 Airmanship นำไปใช้ก่อนและระหว่างบิน">
        <p class="h"><b>WING 2 AIRMANSHIP</b><span>นำไปใช้ก่อนและระหว่างบิน</span></p>
        <ol>${AIR.STEPS.map((s, k) => `<li${s.hot ? ' class="hot"' : ''}><span class="n">${k + 1}</span>${esc(s.s)}</li>`).join('')}</ol>
        <p class="m">${AIR.MOTTO}</p>
      </div>
    </div>
    <div class="brief-foot">
      <button class="btn btn-icon" data-go="-1" aria-label="กลับไปเรื่องสุดท้าย">${icon('back')}</button>
      ${KEYS}
      <a class="btn btn-primary" href="#/results" data-act="exit">จบบรีฟ</a></div>`, false);
}

function viewBrief(id, step) {
  const c = byId(id);
  if (!c) { viewNotFound(); return; }
  briefDeck = briefSet(id);
  briefIdx = briefDeck.indexOf(id);
  const n = briefDeck.length;
  const mode = projMode();
  const ps = pstepsOf(c);
  briefStep = mode === 'step' ? Math.min(Math.max(Number(step) || 0, 0), ps.length - 1) : 0;
  const unit = mode === 'step' ? 'ประเด็น' : 'เคส';
  const [, cls] = typeOf(c);

  const prev = `<button class="btn btn-icon" data-go="-1" aria-label="${unit}ก่อนหน้า">${icon('back')}</button>`;
  const next = `<button class="btn btn-icon" data-go="1" aria-label="${unit}ถัดไป">${icon('next')}</button>`;
  const pos = `<span class="pos" aria-live="polite">${briefIdx + 1}/${n}</span>`;

  briefFrame(mode === 'step'
    ? `<div class="brief-top">
        <ol class="psteps" aria-label="ประเด็น">${ps.map((p, k) => `<li class="${k < briefStep ? 'done' : k === briefStep ? 'now' : ''}"${k === briefStep ? ' aria-current="step"' : ''}>${PSTEP[p]}</li>`).join('')}</ol>
        ${briefTools()}
      </div>
      <div class="pmain" aria-live="polite">${pmain(c, ps[briefStep])}</div>
      <div class="brief-foot">${prev}
        <div class="pft">${dot(cls)}<span class="y">${esc(c.year)}</span><span class="t">${esc(c.title)}</span></div>
        ${pos}${next}</div>`
    : `<div class="brief-top"><div class="meta">${tags(c)}</div>${briefTools()}</div>
      <div class="brief-body">
        <div><h1>${esc(c.title)}</h1><div class="summary">${storyHtml(c, { brief: true })}</div></div>
        <div>
          <section class="ask"><p class="ask-l">คำถามบรีฟ</p><p class="q">${esc(c.brief_question)}</p></section>
          <h3>ทำวันนี้</h3>
          ${pdoList(c)}
        </div>
      </div>
      <div class="brief-foot">${prev}
        <div class="bars" aria-hidden="true">${briefDeck.map((_, k) => `<i class="${k === briefIdx ? 'on' : ''}"></i>`).join('')}</div>
        ${pos}${next}</div>`, true);
}

function drawBrief(arg, step) {
  if (!arg) viewBriefCover();
  else if (arg === 'end') viewBriefEnd();
  else viewBrief(arg, step);
}
// วาดหน้าเดิมใหม่ (สลับธีม/แบบ) — URL เดิมไม่เกิด hashchange
function redrawBrief() {
  const p = location.hash.split('/');
  drawBrief(p[2] ? decodeURIComponent(p[2]) : '', p[3]);
}

// ทีละประเด็น: เดินในเคสก่อน สุดแล้วข้ามไปเคสถัดไป (ย้อนจากประเด็นแรก = ประเด็นสุดท้ายของเคสก่อน)
// หน้าเปิด ← เคสแรก … เคสสุดท้าย → หน้าปิด ไม่วนกลับ
function briefGo(dir) {
  const n = briefDeck.length;
  if (!n) return;
  const step = projMode() === 'step';
  if (step && briefIdx >= 0 && briefIdx < n) {
    const id = briefDeck[briefIdx];
    const s = briefStep + dir;
    if (s >= 0 && s < pstepsOf(byId(id)).length) { briefStep = s; location.replace(briefUrl(id, s)); return; }
  }
  const to = briefIdx + dir;
  if (to < -1 || to > n) return;
  // ตั้งตำแหน่งทันที ไม่รอ hashchange — รีโมตกดรัวแล้วครั้งที่สองจะคำนวณจากหน้าเดิมจนหายไป
  briefIdx = to;
  briefStep = step && dir < 0 && to >= 0 && to < n ? pstepsOf(byId(briefDeck[to])).length - 1 : 0;
  if (to === -1) location.replace(COVER);
  else if (to === n) location.replace(END);
  else location.replace(briefUrl(briefDeck[to], step ? briefStep : null));
}

function setProjMode(mode) {
  if (mode === projMode()) return;
  LS.set('projMode', mode);
  if (briefIdx < 0 || briefIdx >= briefDeck.length) { redrawBrief(); return; }
  const url = briefUrl(briefDeck[briefIdx], mode === 'step' ? 0 : null);
  if (location.hash === url) redrawBrief(); else location.replace(url);
}

function present() {
  // เต็มจอต้องเรียกจากการกดของผู้ใช้โดยตรง
  document.documentElement.requestFullscreen?.().catch(() => {});
  briefFromList = true;
  location.hash = COVER;
}

function exitBrief() {
  if (briefFromList) { briefFromList = false; history.back(); }
  else location.replace('#/results');
}

// เต็มจอที่เปิดจากแถบข้างจอคอมฯ คงอยู่ข้ามหน้า · ที่เปิดในโหมดบรีฟปิดเองเมื่อออกจากบรีฟ
let fullKeep = false;
function toggleFull() {
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  else {
    fullKeep = !document.body.classList.contains('briefing');
    document.documentElement.requestFullscreen?.().catch(() => {});
  }
}
document.addEventListener('fullscreenchange', () => {
  const on = !!document.fullscreenElement;
  if (!on) fullKeep = false;
  for (const b of $$('#full, #dFull')) {
    b.innerHTML = icon(on ? 'shrink' : 'full');
    b.setAttribute('aria-label', fullLabel());
    b.title = fullLabel();
    if (b.id === 'dFull') b.setAttribute('aria-pressed', String(on));
  }
});
if (!document.fullscreenEnabled) $('#dFull')?.remove();

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (!document.body.classList.contains('briefing')) {
    // จอคอมฯ: F สลับเต็มจอได้ทุกหน้า ยกเว้นตอนพิมพ์ในช่องค้นหา/ฟอร์ม
    if (e.code === 'KeyF' && wide.matches && $('#dFull') && !e.target.closest?.('input, textarea, select, [contenteditable]')) { e.preventDefault(); toggleFull(); }
    return;
  }
  // รีโมตพรีเซนเทชันส่ง PageUp/PageDown · ใช้ e.code กับ F เพื่อให้กดได้ตอนแป้นพิมพ์เป็นภาษาไทย
  if (['ArrowRight', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); briefGo(1); }
  else if (['ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); briefGo(-1); }
  else if (e.code === 'KeyF') { e.preventDefault(); toggleFull(); }
  else if (e.key === 'Escape') exitBrief();
});

// เปลี่ยนสไลด์เมื่อปัดแนวนอนชัด ๆ เท่านั้น — เลื่อนอ่านขึ้นลงแล้วนิ้วเอียงไม่นับ (DECISIONS.md "ข้อเสนอแนะนักบินรอบแรก")
let touchX = null, touchY = null;
document.addEventListener('touchstart', (e) => {
  const on = document.body.classList.contains('briefing');
  touchX = on ? e.touches[0].clientX : null;
  touchY = on ? e.touches[0].clientY : null;
}, { passive: true });
document.addEventListener('touchend', (e) => {
  if (touchX == null) return;
  const dx = e.changedTouches[0].clientX - touchX;
  const dy = e.changedTouches[0].clientY - touchY;
  touchX = touchY = null;
  if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) briefGo(dx < 0 ? 1 : -1);
}, { passive: true });

/* ── หน้าภาพรวม ─────────────────────────────────────────────── */
// แดชบอร์ดกรองไขว้ของเคสสากล อยู่ใน overview.js (shadow DOM + overview.css)
// ตัวกรองอยู่ใน # หลัง ? เช่น #/dashboard?ac=H225M&type=ACCIDENT — แอปส่งต่อให้ fromHash() โดยไม่วาดใหม่

let OV = null; // { host, inst, ready } ของหน้าภาพรวมที่กำลังแสดง

function viewOverview() {
  main.innerHTML = '<div class="view dash" aria-busy="true"></div>';
  const host = main.firstElementChild;
  const ov = { host, inst: null };
  OV = ov;
  ov.ready = mountOverview(host, { state }).then((inst) => {
    if (OV !== ov) { inst.destroy(); return; }
    ov.inst = inst;
    host.removeAttribute('aria-busy');
  }).catch((err) => {
    console.error(err);
    if (OV === ov) main.innerHTML = `<div class="empty">${icon('info')}<h2>เปิดหน้าภาพรวมไม่สำเร็จ</h2>
      <p>ลองโหลดหน้าใหม่อีกครั้ง</p><button class="btn" onclick="location.reload()"><span>ลองใหม่</span></button></div>`;
  });
}

/* ── หน้าหลัก ─────────────────────────────────────────────── */
// หน้าแรกหลังเข้าสู่ระบบ: ไอคอนแอปแบบหน้าจอโทรศัพท์ (DECISIONS.md หัวข้อ "หน้าหลัก")

const APPS = [
  { href: '#/filter', ic: 'brief', th: 'บรีฟก่อนบิน', c: 'gold' },
  { href: '#/dashboard', ic: 'chart', th: 'เคสสากล', c: 'blue' },
  { href: '#/history', ic: 'hist', th: 'ประวัติเหตุ', c: 'teal' },
  { href: '#/theory', ic: 'book', th: 'ทฤษฎีนิรภัย', c: 'violet' },
  { href: '#/regs', ic: 'doc', th: 'กฎระเบียบ', c: 'rose' },
  { href: '#/areas', ic: 'pin', th: 'พื้นที่บิน', c: 'green' },
  { href: '#/airmanship', ic: 'target', th: 'Airmanship', c: 'indigo' },
  { href: '#/pap', ic: 'warn', th: 'แผน PAP', c: 'orange' },
  { href: '#/about', ic: 'info', th: 'ข้อมูล', c: 'grey' },
];
const appTile = (a) => {
  const inner = `<span class="app-ic" style="--c:var(--tile-${a.c})">${icon(a.ic)}</span><span class="app-l">${esc(a.th)}</span>`;
  return a.act ? `<button class="app" data-act="${a.act}">${inner}</button>` : `<a class="app" href="${a.href}">${inner}</a>`;
};
// เลขวันตามเวลาเครื่อง ใช้หมุนทฤษฎีวันนี้ (ทุกเครื่องในวันเดียวกันได้บทเดียวกัน)
const dayNo = () => Math.floor((Date.now() - new Date().getTimezoneOffset() * 6e4) / 864e5);

// ปกหน้าหลัก: ภาพจริงของหน่วยจาก data/hero.json หมุนตามวันเหมือนทฤษฎีวันนี้
// ก่อนโหลดเสร็จ (หรือออฟไลน์ครั้งแรก) ใช้ --hero / --d-hero-img ใน CSS ไปก่อน
let heroPick = null;
function loadHero() {
  return loadJSON('data/hero.json').then((h) => {
    const it = h.items?.length ? h.items[dayNo() % h.items.length] : null;
    if (!it) return;
    heroPick = it;
    const vars = (v) => `--hero:url("${v.img}");--hero-s:url("${v.img_s}");--d-hero-img:url("${v.img}")`;
    const el = $('#hero-rot') || document.head.appendChild(Object.assign(document.createElement('style'), { id: 'hero-rot' }));
    el.textContent = `:root,:root[data-theme="night"]{${vars(it.night)}}:root[data-theme="day"]{${vars(it.day)}}`;
    heroVideo();
  });
}

// วิดีโอปกเฉพาะจอคอมฯ: วางทับภาพนิ่งใน .dh-hero .bg แล้วจางเข้าเมื่อเริ่มเล่น
// ไม่เล่นเมื่อจอแคบ ลดการเคลื่อนไหว หรือประหยัดข้อมูล · sw.js ไม่เก็บ .mp4 ในแคช
function heroVideo() {
  const bg = $('.dh-hero .bg');
  const old = bg?.querySelector('video');
  const v = heroPick?.[document.documentElement.dataset.theme === 'day' ? 'day' : 'night'];
  if (!bg || !v?.video || !wide.matches || reduced.matches || navigator.connection?.saveData) { old?.remove(); return; }
  if (old?.dataset.src === v.video) return;
  old?.remove();
  const el = Object.assign(document.createElement('video'), { muted: true, loop: true, playsInline: true, autoplay: true, preload: 'auto', poster: v.img });
  el.setAttribute('muted', ''); // บางเบราว์เซอร์ดูแอตทริบิวต์ ไม่ใช่ property ตอนตัดสินว่าเล่นอัตโนมัติได้
  el.setAttribute('aria-hidden', 'true');
  el.dataset.src = v.video;
  el.addEventListener('playing', () => el.classList.add('on'), { once: true });
  el.src = v.video;
  bg.append(el);
  el.play().catch(() => { /* เบราว์เซอร์ไม่ยอมเล่นอัตโนมัติ — ภาพนิ่งยังอยู่ */ });
}
reduced.addEventListener('change', heroVideo);

// นับเลขขึ้นจาก 0 สำหรับ [data-count] · ปิดการเคลื่อนไหวแล้วแสดงค่าสุดท้ายเลย
function countUp(root) {
  root.querySelectorAll('[data-count]').forEach((el, i) => {
    const to = +el.dataset.count, fmt = (n) => n.toLocaleString('en-US');
    if (reduced.matches) { el.textContent = fmt(to); return; }
    const t0 = performance.now() + 250 + i * 60;
    el.textContent = '0';
    const step = (t) => {
      const p = Math.min(1, Math.max(0, (t - t0) / 1100));
      el.textContent = fmt(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}

// หน้าหลักจอคอมฯ (≥1024px): ปก + ทฤษฎีวันนี้ + ตัวเลข 4 ช่อง + บทเรียน + หัวข้อที่พบบ่อย · ตัวเลขทุกตัวมาจากข้อมูลจริง
function viewHomeDesk() {
  const st = state.unitStatus;
  const kpi = (i, tone, ic, lab, v, d, extra = '', href = '', act = '') => {
    const tag = href ? 'a' : act ? 'button' : 'div';
    const actAttr = act ? ` data-act="${act}" type="button"` : '';
    const lockCls = act ? ` is-${act}` : '';
    return `<${tag} class="d-card dh-kpi d-rise${href || act ? ' d-lift' : ''}${tone ? ' t-' + tone : ''}${lockCls}" style="--i:${i}"${href ? ` href="${href}"` : ''}${actAttr}>
      <span class="lab"><span class="d-itile${tone ? ' t-' + tone : ''}">${icon(ic)}</span>${lab}</span>
      <span class="v"${typeof v === 'number' ? ` data-count="${v}"` : ''}>${typeof v === 'number' ? v.toLocaleString('en-US') : v}</span>
      <span class="d">${d}</span>${extra}</${tag}>`;
  };
  const locked = st === 'locked';
  main.innerHTML = `<div class="view dh">
    <div class="dh-row1">
      <section class="d-card dh-hero d-rise" style="--i:0" aria-label="เริ่มบรีฟ">
        <div class="bg" aria-hidden="true"></div>
        <p class="eyebrow">Preflight Brief · กองบิน 2 · ${esc(thDate())}</p>
        <h1>พร้อม<span class="d-grad">บรีฟ</span>ก่อนบิน</h1>
        <p class="sub">เลือกแบบ ฮ. ภารกิจ และสภาพอากาศของเที่ยวบินวันนี้ แล้วรับบทเรียนจากเหตุจริงทั้งในหน่วยและต่างประเทศ</p>
        <div class="acts">
          <a class="d-btn pri" href="#/filter">${icon('brief')}เริ่มบรีฟเที่ยวบินวันนี้</a>
          ${locked ? `<button class="d-btn" data-act="unlock">${icon('lock')}ปลดล็อกข้อมูลหน่วย</button>`
            : `<a class="d-btn" href="#/history">${icon('hist')}ดูประวัติเหตุ บน.2</a>`}
        </div>
      </section>
      <a class="d-card d-lift dh-tip d-rise" style="--i:1" id="dh-tip" href="#/theory">
        <p class="eyebrow">ทฤษฎีวันนี้</p><h2>ทฤษฎีนิรภัย</h2><p></p>
        <span class="go"><span id="dh-prog-l"></span><b>อ่านต่อ${icon('next')}</b></span>
      </a>
    </div>
    <div class="dh-kpis">
      ${kpi(2, '', 'chart', 'เคสต่างประเทศ', state.intl.length, 'รายงานสอบสวนสาธารณะ', '', '#/dashboard')}
      ${kpi(3, 'gold', 'card', 'การ์ดบทเรียนของหน่วย',
        locked ? `<span class="dh-lock-tag">${icon('lock')} RESTRICTED</span>` : (st === 'unlocked' ? state.unit.length : '—'),
        locked ? '<span class="dh-lock-d">บทเรียนเฉพาะ บน.2 · แตะเพื่อปลดล็อก</span>' : (st === 'missing' ? 'ยังไม่มีในเวอร์ชันนี้' : 'จากเหตุของ บน.2 และ ทอ.'),
        locked ? '<div class="dh-ghost-kpi-bar" aria-hidden="true"></div>' : '',
        '',
        locked ? 'unlock' : '')}
      <div id="dh-hist-kpi" style="display:contents">${kpi(4, 'green', 'hist', 'ประวัติเหตุ บน.2',
        locked ? `<span class="dh-lock-tag">${icon('lock')} CLASSIFIED</span>` : '—',
        locked ? '<span class="dh-lock-d">ประวัติเหตุการณ์ 3 ฝูง · แตะเพื่อปลดล็อก</span>' : (st === 'missing' ? 'ยังไม่มีในเวอร์ชันนี้' : 'กำลังโหลด…'),
        locked ? '<div class="dh-ghost-kpi-bar" aria-hidden="true"></div>' : '',
        '',
        locked ? 'unlock' : '')}</div>
      ${kpi(5, 'violet', 'book', 'ทฤษฎีนิรภัย', '—', '', '', '#/theory').replace('class="d"', 'class="d" id="dh-th-d"').replace('class="v"', 'class="v" id="dh-th-v"')}
    </div>
    <div class="dh-row3">
      <section class="d-card d-rise" style="--i:6" aria-labelledby="dh-les-h">
        <div class="dh-ch"><span class="d-itile t-violet">${icon('book')}</span><h2 id="dh-les-h">บทเรียนทฤษฎีนิรภัย</h2>
          <a class="more" href="#/theory">ดูทั้งหมด${icon('next')}</a></div>
        <div class="dh-les" id="dh-les"></div>
      </section>
      <section class="d-card d-rise" style="--i:7" aria-labelledby="dh-tp-h">
        <div class="dh-ch"><span class="d-itile t-gold">${icon('grid3')}</span><h2 id="dh-tp-h">หัวข้อที่พบบ่อยใน บน.2</h2>
          <a class="more" href="#/history/topics">ดูตาราง${icon('next')}</a></div>
        <div id="dh-tp">
          ${locked ? `
          <button type="button" class="dh-locked-dossier" data-act="unlock" title="แตะเพื่อปลดล็อกข้อมูลหน่วย">
            <div class="dh-ghost-stream" aria-hidden="true">
              <div class="dh-ghost-row"><span class="dh-ghost-label">การบินกลางคืน / NVG ภูเขา</span><span class="dh-ghost-bar" style="width:84%"></span><span class="dh-ghost-num">••</span></div>
              <div class="dh-ghost-row"><span class="dh-ghost-label">สภาพอากาศแปรปรวน / หมอกควัน</span><span class="dh-ghost-bar" style="width:66%"></span><span class="dh-ghost-num">••</span></div>
              <div class="dh-ghost-row"><span class="dh-ghost-label">บินเกาะหมู่ / Tactical Formation</span><span class="dh-ghost-bar" style="width:52%"></span><span class="dh-ghost-num">••</span></div>
              <div class="dh-ghost-row"><span class="dh-ghost-label">ส่งกลับสายแพทย์ / พื้นที่จำกัด</span><span class="dh-ghost-bar" style="width:38%"></span><span class="dh-ghost-num">••</span></div>
            </div>
            <div class="dh-locked-overlay">
              <div class="dh-locked-badge">
                <span class="dh-badge-ic">${icon('lock')}</span>
                <b>RESTRICTED · สถิติเฉพาะ บน.2 เข้ารหัส</b>
              </div>
              <p class="dh-locked-desc">สถิติข้อขัดข้องและบทเรียนการบิน 3 ฝูงบิน (201, 202, 203)</p>
              <span class="d-btn pri d-btn-sm">${icon('lock')} ปลดล็อกด้วยรหัสหน่วย</span>
            </div>
          </button>
          ` : '<p class="dh-empty">กำลังโหลด…</p>'}
        </div>
      </section>
    </div>
    <a class="d-card d-lift dh-air d-rise" style="--i:8" href="#/airmanship" aria-labelledby="dh-air-h">
      <div class="dh-air-l">
        <p class="eyebrow">นโยบายผู้บังคับการกองบิน 2</p>
        <h2 id="dh-air-h">WING 2 <em>AIRMANSHIP</em></h2>
        <p class="sub">6 เสาหลักในการตัดสินใจ · SA และ Judgment · 5 ขั้นก่อนและระหว่างบิน</p>
        <p class="motto">${AIR.MOTTO}</p>
      </div>
      <ul class="dh-air-p">${AIR.PILLARS.map((p) => `<li><span class="d-itile">${icon(p.ic)}</span><b>${p.en}</b><span>${esc(p.th)}</span></li>`).join('')}</ul>
      <span class="more">ดูนโยบาย${icon('next')}</span>
    </a>
  </div>`;
  countUp(main);
  heroVideo();

  import('./lessons.js').then(({ LESSONS }) => {
    if (!$('.dh')) return; // ผู้ใช้ไปหน้าอื่นแล้ว
    const done = new Set(LS.get('theoryDone', []));
    const nDone = LESSONS.filter((l) => done.has(l.id)).length;
    const next = LESSONS.find((l) => !done.has(l.id));
    const l = LESSONS[dayNo() % LESSONS.length];
    const tip = $('#dh-tip');
    tip.href = `#/theory/${l.id}`;
    tip.querySelector('h2').textContent = l.title;
    tip.querySelector('p:not(.eyebrow)').textContent = l.tip;
    tip.querySelector('.eyebrow').textContent = `ทฤษฎีวันนี้ · ${l.short} · ${l.mins} นาที`;
    $('#dh-prog-l').innerHTML = `เรียนแล้ว ${nDone}/${LESSONS.length} บท<span class="dh-prog"><i style="width:${Math.round(nDone / LESSONS.length * 100)}%"></i></span>`;
    const v = $('#dh-th-v');
    v.dataset.count = LESSONS.length;
    $('#dh-th-d').textContent = `บท · เรียนแล้ว ${nDone}`;
    countUp(v.parentNode);
    $('#dh-les').innerHTML = LESSONS.map((x, i) => {
      const cls = done.has(x.id) ? ' done' : x === next ? ' next' : '';
      const s = done.has(x.id) ? 'เรียนแล้ว' : x === next ? 'บทถัดไป' : `${x.mins} นาที`;
      const num = String(i + 1).padStart(2, '0');
      return `<a class="dh-le${cls} c-${x.color}" href="#/theory/${x.id}">
        <span class="dh-le-icbox">
          <span class="dh-le-ic">${icon(x.icon)}</span>
          <span class="dh-le-num">${done.has(x.id) ? '✓' : num}</span>
        </span>
        <span class="dh-le-meta">
          <b class="dh-le-title">${esc(x.short)}</b>
          <small class="dh-le-sub">${s}</small>
        </span>
      </a>`;
    }).join('');
  }).catch((err) => {
    const el = $('#dh-les');
    if (el) el.innerHTML = '<p class="dh-empty">โหลดบทเรียนไม่สำเร็จ ลองเปิดหน้านี้อีกครั้งตอนมีสัญญาณ</p>';
    console.warn('lessons', err);
  });

  if (locked) return;
  loadHistory().then((h) => {
    if (!$('.dh')) return;
    const box = $('#dh-hist-kpi'), tp = $('#dh-tp');
    if (h.status !== 'ok') {
      box.innerHTML = kpi(4, 'green', 'hist', 'ประวัติเหตุ บน.2', '—', 'ยังไม่มีในเวอร์ชันนี้');
      tp.innerHTML = '<p class="dh-empty">ยังไม่มีข้อมูลประวัติเหตุในเวอร์ชันนี้</p>';
      return;
    }
    const items = h.data.items;
    const fys = [...new Set(items.map((x) => x.fy))].sort((a, b) => a - b);
    const per = fys.map((y) => items.filter((x) => x.fy === y).length);
    const mx = Math.max(...per), bw = (100 - (per.length - 1) * 2) / per.length;
    const spark = `<svg class="spark" viewBox="0 0 100 44" width="100" height="44" aria-hidden="true">${per.map((n, i) => {
      const hh = Math.max(2, n / mx * 44);
      return `<rect x="${(i * (bw + 2)).toFixed(2)}" y="${(44 - hh).toFixed(2)}" width="${bw.toFixed(2)}" height="${hh.toFixed(2)}" rx="1.5"><title>ปีงบ ${fys[i]}: ${n}</title></rect>`;
    }).join('')}</svg>`;
    box.innerHTML = kpi(4, 'green', 'hist', 'ประวัติเหตุ บน.2', items.length, `เรื่อง · ปีงบ ${fySpan(items)}`, spark, '#/history');
    countUp(box);
    // นับเหมือนตารางหัวข้อ (ไม่รวมเหตุของหน่วยอื่น r)
    const { topics, short } = h.data;
    const tot = topics.map(() => 0);
    const pool = items.filter((x) => x.src !== 'r');
    for (const it of pool) for (const t of it.tp || []) if (t in tot) tot[t]++;
    const top = topics.map((_, t) => t).filter((t) => tot[t]).sort((a, b) => tot[b] - tot[a]).slice(0, 9);
    if (!top.length) { tp.innerHTML = '<p class="dh-empty">ยังไม่มีการจัดหัวข้อ</p>'; return; }
    const m = tot[top[0]];
    tp.innerHTML = `<div class="dh-topics">${top.map((t, i) => `<a class="dh-bar" href="#/history/topic/${t}" title="${esc(topics[t])}">`
      + `<span>${esc(short[t])}</span><span class="tk"><span class="tr d-grow" style="--i:${i};width:${(tot[t] / m * 100).toFixed(1)}%"></span></span>`
      + `<span class="num">${nTh(tot[t])}</span></a>`).join('')}</div>
      <p class="dh-note">นับจาก ${nTh(pool.length)} เรื่องของ บน.2 ปีงบ ${fySpan(pool)} · เรื่องเดียวอยู่ได้หลายหัวข้อ</p>`;
  }).catch((err) => console.warn('history', err));
}

function viewHome() {
  if (wide.matches) return viewHomeDesk();
  const st = state.unitStatus;
  const unitLine = {
    missing: `${dot('hollow')}ยังไม่มีข้อมูลของหน่วยในเวอร์ชันนี้`,
    locked: `${dot('warn')}ข้อมูลของหน่วยล็อกอยู่ · เห็นเฉพาะเคสต่างประเทศ`,
    unlocked: `${dot('ok')}ปลดล็อกข้อมูลของหน่วยแล้ว`,
  }[st];
  const apps = st === 'locked' ? [...APPS, { act: 'unlock', ic: 'lock', th: 'ปลดล็อก', c: 'orange' }] : APPS;

  main.innerHTML = `<div class="view home">
    <section class="widget" aria-label="สรุปวันนี้">
      <p class="w-eyebrow">บน.2 · ${esc(thDate())}</p>
      <h1 class="w-h">พร้อมบรีฟ<em>ก่อนบิน</em></h1>
      <div class="w-stats">
        <div><b>${state.intl.length}</b><span>เคสต่างประเทศ</span></div>
        <div><b>${st === 'unlocked' ? state.unit.length : '—'}</b><span>เคสของหน่วย</span></div>
      </div>
      <p class="w-unit">${unitLine}</p>
    </section>
    <nav class="apps" aria-label="แอป">${apps.map(appTile).join('')}</nav>
    <section class="home-sec" aria-labelledby="lsn-h">
      <h2 class="sec-h" id="lsn-h">ทฤษฎีนิรภัย <span id="lsn-m"></span></h2>
      <div class="apps" id="lsn-row"></div>
      <a class="tip" id="tip" href="#/theory" hidden></a>
    </section>
  </div>`;

  // บทเรียนอยู่ในไฟล์แยก โหลดทีหลัง — ไม่ทำให้หน้าหลักช้า
  import('./lessons.js').then(({ LESSONS }) => {
    const row = $('#lsn-row');
    if (!row) return; // ผู้ใช้ไปหน้าอื่นแล้ว
    row.innerHTML = LESSONS.map((l) => appTile({ href: `#/theory/${l.id}`, ic: l.icon, th: l.short, c: l.color })).join('');
    // อ่านเวลาจากบทเรียนจริง ไม่เขียนตายตัว (เดิมเขียน "บทละ 5 นาที" ค้างไว้หลังบทยาวขึ้น)
    const mins = LESSONS.map((x) => x.mins);
    $('#lsn-m').textContent = `บทละ ${Math.min(...mins)}–${Math.max(...mins)} นาที`;
    const l = LESSONS[dayNo() % LESSONS.length];
    const tip = $('#tip');
    tip.href = `#/theory/${l.id}`;
    tip.innerHTML = `<span class="tip-l">ทฤษฎีวันนี้ · ${esc(l.short)}</span><span class="tip-t">${esc(l.tip)}</span>${icon('next')}`;
    tip.hidden = false;
  }).catch((err) => {
    const row = $('#lsn-row');
    if (row) row.innerHTML = '<p class="sec-empty">โหลดบทเรียนไม่สำเร็จ ลองเปิดหน้านี้อีกครั้งตอนมีสัญญาณ</p>';
    console.warn('lessons', err);
  });
}

/* ── ทฤษฎีนิรภัย ──────────────────────────────────────────── */

// theory.js โหลดเฉพาะตอนเปิดแอปนี้ · arg = บท, n = เลขสไลด์
async function viewTheory(arg, n, prev) {
  const at = location.hash;
  try {
    const t = await import('./theory.js');
    if (location.hash !== at) return;
    t.render({ main, arg, n, prev, tax: state.tax, esc, icon, keepAwake, reduced, store: LS });
  } catch (err) {
    main.innerHTML = `<div class="view"><div class="empty">${icon('info')}<h2>เปิดบทเรียนไม่สำเร็จ</h2>
      <p>ไฟล์บทเรียนยังไม่อยู่ในเครื่อง เปิดแอปตอนมีสัญญาณหนึ่งครั้ง หลังจากนั้นใช้แบบออฟไลน์ได้</p>
      <div class="acts"><a class="btn" href="#/">กลับหน้าหลัก</a></div></div></div>`;
    console.warn('theory', err);
  }
}

/* ── ประวัติเหตุ บน.2 ─────────────────────────────────────── */
// #/history รายปี · #/history/topics ตามหัวข้อ · #/history/case/:การ์ด · #/history/topic/:หัวข้อ · #/history/:id
// ข้อมูลอยู่นอก repo เข้ารหัสด้วยกุญแจหน่วย · รูปมีเฉพาะ dev server บนเครื่องทดสอบ (DECISIONS.md หัวข้อ "ประวัติเหตุ บน.2")

// แหล่งของแต่ละเรื่อง [ป้าย, ไอคอน, คำอธิบายสั้น] · m = จับคู่แบบฟอร์มกับที่ประชุมได้ · e = มีแต่ในที่ประชุม
// r = เหตุของหน่วยอื่นใน ทอ. ที่ยกมาเล่า · f = มีแต่แบบฟอร์ม
const HSRC = {
  m: ['MOR/HR + ที่ประชุม', 'link', 'แบบฟอร์ม + ที่ประชุม'],
  e: ['นำมาจากไฟล์การประชุม', 'chat', 'จากการประชุมเท่านั้น'],
  r: ['ทอ. · จากไฟล์การประชุม', 'chat', 'เหตุ ทอ. ที่เล่าในที่ประชุม'],
  f: ['MOR/HR', 'doc', 'แบบฟอร์มเท่านั้น'],
};
const HSRC_KEYS = Object.keys(HSRC);
const HTYPE_ORDER = ['accident', 'incident', 'hazard'];
const HSQ = ['ALL', '201', '202', '203'];
const nTh = (n) => n.toLocaleString('th-TH');
let hCards = new Set(); // id การ์ดที่มีอยู่จริงในข้อมูลเวอร์ชันนี้
const hSrc = (it) => { const s = HSRC[it.src] ?? HSRC.f; return `<span class="h-src ${esc(it.src)}">${icon(s[1])}${s[0]}</span>`; };
// คำที่ปิดไว้ตอนทำความสะอาดข้อมูล เช่น [ชื่อ] แสดงเป็นป้ายจาง ๆ ให้รู้ว่าตัดออก ไม่ใช่พิมพ์ผิด
const hTxt = (s) => esc(s).replace(/\[[^\]\n]{1,16}\]/g, (m) => `<span class="h-ph">${m}</span>`);
const fySpan = (list) => {
  const ys = list.map((x) => x.fy);
  const a = Math.min(...ys), b = Math.max(...ys);
  return a === b ? `${a}` : `${a}–${b}`;
};
// [60, 61, 62, 65] → "60–62 และ 65"
const yrRuns = (ys) => {
  const out = [];
  for (const y of ys) { const r = out.at(-1); if (r && y === r[1] + 1) r[1] = y; else out.push([y, y]); }
  return out.map(([a, b]) => (a === b ? `${a}` : `${a}–${b}`)).join(' และ ');
};
const bySev = (a, b) => HTYPE_ORDER.indexOf(a.type) - HTYPE_ORDER.indexOf(b.type) || HSRC_KEYS.indexOf(a.src) - HSRC_KEYS.indexOf(b.src);
const byFyDesc = (a, b) => b.fy - a.fy || bySev(a, b);
const hItems = (ids) => (ids || []).map((id) => state.hist.data.byId.get(id)).filter(Boolean);
const hCardOf = (it) => it.cards?.find((id) => hCards.has(id));

// here = id การ์ดของหน้าที่เปิดอยู่ ไม่ต้องบอกว่ามีการ์ดซ้ำ
function hRow(it, { fy = false, here = null } = {}) {
  const [th, cls] = typeOf(it);
  const m = [`<span class="ty">${dot(cls)}${esc(th)}</span>`, hSrc(it)];
  if (fy) m.push(`<span class="yr">ปีงบ ${esc(it.fy)}</span>`);
  if (it.sq) m.push(`<span>ฝูง ${esc(it.sq)}</span>`);
  if (it.ac || it.acc) m.push(`<span>${esc(it.ac || it.acc)}</span>`);
  const cid = hCardOf(it);
  if (cid && cid !== here) m.push(`<span class="card-l">${icon('card')}มีการ์ดบทเรียน</span>`);
  if (himgs(it).length) m.push(`<span class="img-n">${icon('image')}${himgs(it).length} ภาพ</span>`);
  if (it.nt) m.push(`<span class="nt-n">${icon('moon')}${HNT[it.nt]}</span>`);
  return `<li><a class="ev" data-hb href="#/history/${encodeURIComponent(it.id)}"><span class="t">${hTxt(it.t)}</span>`
    + `<span class="m">${m.join('')}</span>${icon('next', 'ic go')}</a></li>`;
}

// แบ่งกลุ่มรายการ by = 'type' (ประเภท ร้ายแรงก่อน) | 'fy' (ปีงบ ใหม่ก่อน)
function hGroups(list, by, here = null) {
  const keys = by === 'type'
    ? [...new Set([...HTYPE_ORDER, ...list.map((x) => x.type)])].filter((k) => list.some((x) => x.type === k))
    : [...new Set(list.map((x) => x.fy))].sort((a, b) => b - a);
  return keys.map((k) => {
    const rows = list.filter((x) => (by === 'type' ? x.type : x.fy) === k);
    let head;
    if (by === 'type') { const [th, cls] = typeOf({ type: k }); head = `${dot(cls)}${esc(th)}<span class="n">${nTh(rows.length)}</span>`; }
    else head = `ปีงบ ${esc(k)}<span class="n">${nTh(rows.length)} เรื่อง</span>`;
    return `<section class="hg"><h3 class="yh">${head}</h3><ul class="evs">${rows.map((x) => hRow(x, { here })).join('')}</ul></section>`;
  }).join('');
}

// ค้นข้อความในประวัติเหตุ: ทุกคำ (เว้นวรรคคั่น) ต้องพบในหัวเรื่อง แบบ ฮ. หรือเนื้อเรื่องที่ใดที่หนึ่ง
const hHay = new WeakMap();
function hText(it) {
  let t = hHay.get(it);
  if (t == null) {
    const out = [];
    const walk = (v, k) => {
      if (k === 'img' || k === 'enc') return;
      if (typeof v === 'string') out.push(v);
      else if (Array.isArray(v)) v.forEach((x) => walk(x));
      else if (v && typeof v === 'object') for (const [kk, x] of Object.entries(v)) walk(x, kk);
    };
    walk(it);
    t = out.join(' ').toLowerCase();
    hHay.set(it, t);
  }
  return t;
}
const hQuery = (list, q) => {
  const ws = q.toLowerCase().split(/\s+/).filter(Boolean);
  return ws.length ? list.filter((x) => { const t = hText(x); return ws.every((w) => t.includes(w)); }) : list;
};

// ผลค้นหา: แทนมุมมองของแท็บ เรียงตามปีงบ ใหม่ก่อน
function hvSearch(h, q) {
  const list = hQuery(h.data.items, q).sort(byFyDesc);
  if (!list.length) return `<p class="note h-qn" role="status">ไม่พบเรื่องที่มีคำว่า “${esc(q)}” · ลองคำสั้นลงหรือสะกดแบบอื่น${state.hv.img || state.hv.nt ? ' หรือปิดตัวกรองกลางคืน/ภาพ' : ''}</p>`;
  return `<p class="note h-qn" role="status">พบ <b>${nTh(list.length)}</b> เรื่อง · เรียงตามปีงบ ใหม่ก่อน</p><section class="hv-s" id="hlist" aria-label="ผลค้นหา">${hGroups(list, 'fy')}</section>`;
}

// แถบผังพิจารณาประเภทรายงานและการสอบสวน คัดตามหน้า ๔ ข้อ ๕ ของคู่มือการสอบสวนอากาศยานอุบัติเหตุ
// (ประกอบระเบียบ ทอ.ว่าด้วยนิรภัยการบิน พ.ศ.๒๕๖๕ ฉบับปรับปรุง ๒๕๖๘) ห้ามแต่งเกณฑ์เพิ่ม · เปิด/ปิดจำใน localStorage `w2sb.histFlow`
const FLOW_SRC = 'https://safety.rtaf.mi.th/web/content/3687/a10_1.pdf';
const FLOW_OUT = {
  acc: 'อุบัติเหตุ', ser: 'อุบัติการณ์ร้ายแรง', inc: 'อุบัติการณ์', haz: 'รายงานอันตราย',
};
function hvFlow() {
  const out = (k) => `<span class="fl-out ${k}"><i></i>${FLOW_OUT[k]}</span>`;
  const node = (k) => `<span class="fl-node ${k}"><i></i>${FLOW_OUT[k]}</span>`;
  // เส้นต่อ: ค่าเริ่มเป็นแนวตั้งมีหัวลูกศร · .fl-x เปลี่ยนเป็นแนวนอนเมื่อแถบกว้างพอ (container query ใน styles.css)
  const wire = (lb, cls = '') => `<span class="fl-wire${cls}"${lb ? '' : ' aria-hidden="true"'}>${lb ? `<span class="fl-lb">${lb}</span>` : ''}</span>`;
  const step = (body, k, last, lb = 'ใช่') => `<li class="fl-step"><div class="fl-q">${body}</div>
    <div class="fl-yes">${wire(lb, ' fl-x')}${node(k)}</div>${last ? '' : `<div class="fl-no">${wire('ไม่ใช่')}</div>`}</li>`;
  const ul = (xs) => `<ul>${xs.map((x) => `<li>${x}</li>`).join('')}</ul>`;
  const hurt = [
    step('<b>บาดเจ็บ:</b> เสียชีวิต หรือบาดเจ็บสาหัส<br><b>ความชำรุดเสียหาย:</b> ขั้นจำหน่าย หรือเสียหายมาก', 'acc'),
    step('<b>บาดเจ็บ:</b> บาดเจ็บเล็กน้อย<br><b>ความชำรุดเสียหาย:</b> ขั้นเสียหายเล็กน้อย', 'ser'),
    step('<b>บาดเจ็บ:</b> ไม่ได้รับบาดเจ็บ<br><b>ความชำรุดเสียหาย:</b> ต่ำกว่าขั้นเสียหายเล็กน้อย', 'inc', true),
  ];
  const none = [
    step('เข้าข้อใดข้อหนึ่ง' + ul(['T/O or L/D on Closed RWY', 'Fire/Smoke in Cabin/Cargo', 'Pilot Incapacitation',
      'อาวุธหรือถังเชื้อเพลิงภายนอกตกนอกพื้นที่ที่กำหนด']), 'ser'),
    step('เข้าข้อใดข้อหนึ่ง' + ul(['เชื้อเพลิงรั่วปริมาณมาก', 'สูญเสียกำลังขับไม่สามารถบินระดับได้',
      'อ.ลงฉุกเฉินนอกสนามบิน ยกเว้น ฮ. ที่ลงฉุกเฉินแล้วตรวจสอบไม่พบความผิดปกติ', 'อ.ลงฉุกเฉินในและนอกสนามบินเนื่องจากปัญหา ย.',
      'ย.ดับ หรือดับ ย.ในอากาศ', 'ระบบ Pitot-Static ใช้งานไม่ได้', 'บุคคล (นอกจาก นบ.) Hypoxia, G-LOC, Decompression Sickness',
      'อาคาร ทรัพย์สินของราชการ เอกชน พลเรือน เสียหาย', 'Near CFIT', 'Severe abnormal performance', 'Declare Emergency Fuel',
      'ประตู หน้าต่าง หรือประทุนเปิดออกในอากาศโดยไม่ตั้งใจ', 'Controllability Problem']), 'inc'),
    step('รายงานที่เหลือ เช่น' + ul(['รายงาน บ.ชนนก', 'รายงาน อ.ใกล้จะชนกัน (Near-Miss)', 'รายงาน Runway Incursion / Excursion'])
      + '<span class="fl-fn">** การบันทึกสถิติให้บันทึกเป็นรายงานอันตราย</span>', 'haz', true, 'บันทึกเป็น'),
  ];
  const branch = (lb, lbl, steps) => `<section class="fl-col" aria-label="${lbl}">
    <div class="fl-br"><span class="fl-chip">${lb}</span>${wire('')}</div><ol>${steps.join('')}</ol></section>`;
  const inv = (ks, who) => `<div class="fl-iv"><div class="fl-ivn">${ks.map(node).join('')}</div>${wire('', ' fl-x')}
    <p class="fl-ivt">สอบสวนโดย คจท.สอบสวนด้านนิรภัยการบิน <b>${who}</b></p></div>`;
  return `<details class="h-flow" data-hflow${LS.get('histFlow', false) ? ' open' : ''}>
    <summary>${icon('grid3')}<span class="fl-sum"><b>ผังพิจารณาประเภทรายงานและการสอบสวน</b>
      <span class="fl-chips">${Object.keys(FLOW_OUT).map(out).join('')}</span></span>
      <span class="fl-hint"><span class="c">ดูผัง</span><span class="o">ย่อผัง</span>${icon('down', 'ic fl-cv')}</span></summary>
    <div class="fl-body">
      <div class="fl-top"><span class="fl-start">เกิดเหตุการณ์ด้านนิรภัยการบิน</span>${wire('')}
        <b class="fl-dec">มีผู้บาดเจ็บ และ/หรือ อ.ชำรุดเสียหายหรือไม่</b></div>
      <div class="fl-cols">
        ${branch('ใช่ · มีบาดเจ็บหรือเสียหาย', 'มีผู้บาดเจ็บหรือ อ.ชำรุดเสียหาย', hurt)}
        ${branch('ไม่ใช่ · ไม่มีบาดเจ็บหรือเสียหาย', 'ไม่มีผู้บาดเจ็บและ อ.ไม่ชำรุดเสียหาย', none)}
      </div>
      <div class="fl-inv"><h3 class="fl-invh">ผู้สอบสวน</h3>${inv(['acc', 'ser'], 'สนภ.ทอ.')}${inv(['inc', 'haz'], 'หน่วยบิน')}</div>
      <p class="note fl-ref">ที่มา: คู่มือการสอบสวนอากาศยานอุบัติเหตุ ประกอบระเบียบ ทอ.ว่าด้วยนิรภัยการบิน พ.ศ.๒๕๖๕ (ฉบับปรับปรุง พ.ศ.๒๕๖๘)
        หน้า ๔ ข้อ ๕ แผนผังกระบวนการรายงานและสอบสวน อ.อุบัติเหตุ ·
        <a href="${FLOW_SRC}" target="_blank" rel="noopener">เปิดคู่มือ (PDF)</a> · <a href="#/regs">กฎระเบียบและคู่มือทั้งหมด</a></p>
    </div></details>`;
}

// หัวหน้าประวัติเหตุ + แท็บ รายปี/ตามหัวข้อ · คืน <div> ที่ยังไม่ปิด ผู้เรียกปิดเอง
function hvHead(h, tab, still) {
  const items = h.data.items;
  const nImg = items.filter((x) => himgs(x).length).length;
  const nNt = { a: 0, f: 0, g: 0 };
  for (const x of items) if (x.nt) { nNt.a++; nNt[x.nt]++; }
  const nt = state.hv.nt;
  const ntSub = nt ? `<div class="chips h-ntsub" role="group" aria-label="ชนิดเหตุกลางคืน">${['a', 'f', 'g'].map((k) => `<button class="chip" data-hnt="${k}" aria-pressed="${nt === k}">${icon('check', 'ic ck')}${k === 'a' ? 'ทั้งหมด' : HNT[k]} <b>${nTh(nNt[k])}</b></button>`).join('')}</div>`
    + `<p class="note h-imgnote">ติดป้ายทีละเรื่องจากเวลาในบันทึกและเนื้อเรื่อง (หลังสิ้นแสงสนธยาถึงก่อนรุ่งสาง) · เรื่องที่บันทึกไม่ระบุเวลาอาจตกหล่น</p>` : '';
  return `<div class="view hv${still ? ' still' : ''}"><div class="hv-top">
    <p class="eyebrow">ประวัติเหตุ บน.2</p>
    <h1 class="page-h">เคยเกิดใน<em>บน.2</em></h1>
    <p class="lede">${nTh(items.length)} เรื่อง ปีงบ ${fySpan(items)} · จากแบบฟอร์ม MOR/HR และบันทึกการประชุมนิรภัย จับคู่กันเมื่อเป็นเรื่องเดียวกัน</p>
    ${h.dev ? `<p class="status-line"><span class="tag draft">${dot('hollow')}ทดสอบ</span>โหลดจาก dev server บนเครื่องนี้ (ไม่เข้ารหัส มีรูป)</p>` : ''}
    <nav class="h-tabs" aria-label="มุมมอง">
      <a data-replace href="#/history"${tab === 'y' ? ' aria-current="page"' : ''}>${icon('chart')}รายปี</a>
      <a data-replace href="#/history/topics"${tab === 't' ? ' aria-current="page"' : ''}>${icon('grid3')}ตามหัวข้อ</a>
      <a data-replace href="#/history/months"${tab === 'm' ? ' aria-current="page"' : ''}>${icon('cal')}รายเดือน</a>
        <a data-replace href="#/history/hours"${tab === 'h' ? ' aria-current="page"' : ''}>${icon('clock')}รายชั่วโมง</a>
      <span class="h-tgs">${nNt.a ? `<button class="h-imgtg" data-hnt="" aria-pressed="${!!nt}">${icon('check', 'ic ck')}${icon('moon')}กลางคืน <b>${nTh(nNt.a)}</b></button>` : ''}
      ${nImg ? `<button class="h-imgtg" data-himg aria-pressed="${state.hv.img}">${icon('check', 'ic ck')}${icon('image')}เฉพาะที่มีภาพ <b>${nTh(nImg)}</b></button>` : ''}</span>
    </nav>${ntSub}${state.hv.img ? `<p class="note h-imgnote">แสดงเฉพาะ ${nTh(nImg)} เรื่องที่มีภาพจากเอกสาร · แตะปุ่มอีกครั้งเพื่อดูทั้งหมด</p>` : ''}
    <form class="h-q" role="search" data-hqf><label>${icon('search')}<input type="search" id="hq" value="${esc(state.hv.q)}" placeholder="ค้นหา เช่น ระบบ อาการ สถานที่ นามเรียกขาน" aria-label="ค้นหาประวัติเหตุ" enterkeyhint="search" autocomplete="off" spellcheck="false"></label></form>${hvFlow()}</div>`;
}

// แบบ B: เส้นเวลารายปีงบ แท่งซ้อนตามแหล่ง · แตะปีเพื่อดูรายการของปีนั้น
function hvYears(h) {
  const hv = state.hv;
  const per = new Map();
  for (const it of h.data.items) {
    const c = per.get(it.fy) ?? per.set(it.fy, { m: 0, e: 0, r: 0, f: 0, n: 0 }).get(it.fy);
    c[HSRC[it.src] ? it.src : 'f']++;
    c.n++;
  }
  const years = [...per.keys()].sort((a, b) => b - a);
  if (!per.has(hv.y)) hv.y = years[0];
  const cur = per.get(hv.y);
  if (hv.src && !cur[hv.src]) hv.src = null;
  const max = Math.max(...years.map((y) => per.get(y).n));
  const legend = (k) => HSRC[k][2];

  const tl = years.map((y) => {
    const c = per.get(y);
    const segs = HSRC_KEYS.filter((k) => c[k]).map((k) => `<i class="seg-k ${k}" style="width:${(c[k] / max * 100).toFixed(2)}%"></i>`).join('');
    const al = `ปีงบ ${y}: ${c.n} เรื่อง — ${HSRC_KEYS.filter((k) => c[k]).map((k) => `${legend(k)} ${c[k]}`).join(' · ')}`;
    return `<li><button class="h-tl" data-hy="${y}" aria-pressed="${y === hv.y}" aria-label="${esc(al)}">`
      + `<span class="fy">${y}</span><span class="bar">${segs}</span><span class="n">${nTh(c.n)}</span></button></li>`;
  }).join('');
  const keys = HSRC_KEYS.map((k) => `<span><i class="seg-k ${k}"></i>${legend(k)}</span>`).join('');
  const gaps = years.filter((y) => !per.get(y).m && !per.get(y).e && !per.get(y).r).sort((a, b) => a - b);

  const stat = HSRC_KEYS.map((k) => `<button data-hsrc="${k}" aria-pressed="${hv.src === k}"${cur[k] ? '' : ' disabled'}>`
    + `${icon('check', 'ic ck')}<b>${nTh(cur[k])}</b><span><i class="seg-k ${k}"></i>${legend(k)}</span></button>`).join('');
  const list = h.data.items.filter((x) => x.fy === hv.y && (!hv.src || x.src === hv.src))
    .sort((a, b) => HSRC_KEYS.indexOf(a.src) - HSRC_KEYS.indexOf(b.src) || (a.id < b.id ? -1 : 1));

  return `<div class="hv-grid y">
    <section class="hv-l" aria-labelledby="h-tl-h">
      <h2 class="sec-h" id="h-tl-h">รายปีงบ <span>ใหม่ → เก่า</span></h2>
      <ol class="h-tls">${tl}</ol>
      <div class="h-keys">${keys}</div>
      ${gaps.length && !hv.img ? `<p class="note gap-note">ปีงบ ${yrRuns(gaps)} ยังไม่มีบันทึกประชุม จึงมีแต่แบบฟอร์ม ถ้าได้บันทึกประชุมของปีเหล่านี้มา จะจับคู่เพิ่มได้</p>` : ''}
    </section>
    <section class="hv-r" id="hlist" aria-labelledby="h-y-h">
      <h2 class="sec-h" id="h-y-h">ปีงบ ${esc(hv.y)} <span>${nTh(cur.n)} เรื่อง</span></h2>
      <div class="h-ystat" role="group" aria-label="กรองตามแหล่ง">${stat}</div>
      <p class="note">${hv.src ? `เฉพาะ “${esc(legend(hv.src))}” · ` : ''}แตะตัวเลขเพื่อกรอง แตะซ้ำเพื่อดูทั้งหมด</p>
      ${hGroups(list, 'type')}
    </section>
  </div>`;
}

// แบบ C: ตารางความถี่ หัวข้อ × ปีงบ · ไม่รวมเหตุของหน่วยอื่น (r)
function hvTopics(h) {
  const hv = state.hv;
  const { topics, short } = h.data;
  const pool = h.data.items.filter((x) => x.src !== 'r' && (hv.sq === 'ALL' || x.sq === hv.sq));
  const fys = [...new Set(h.data.items.map((x) => x.fy))].sort((a, b) => a - b);
  const grid = topics.map(() => new Map());
  const tot = topics.map(() => 0);
  let untagged = 0;
  for (const it of pool) {
    if (!it.tp?.length) { untagged++; continue; }
    for (const t of it.tp) {
      if (!grid[t]) continue;
      grid[t].set(it.fy, (grid[t].get(it.fy) || 0) + 1);
      tot[t]++;
    }
  }
  const rows = topics.map((_, t) => t).filter((t) => tot[t]).sort((a, b) => tot[b] - tot[a]);
  const max = Math.max(1, ...rows.flatMap((t) => [...grid[t].values()]));
  const lvl = (n) => { const r = n / max; return r <= 0.1 ? 1 : r <= 0.25 ? 2 : r <= 0.45 ? 3 : r <= 0.7 ? 4 : 5; };
  const c = hv.cell;
  if (c && !(c.tp === -1 ? untagged : tot[c.tp] && (c.fy == null || grid[c.tp].get(c.fy)))) hv.cell = null;
  const sel = hv.cell;
  const formOnly = fys.filter((y) => !h.data.items.some((x) => x.fy === y && x.src !== 'f'));

  const chips = HSQ.map((q) => `<button class="chip" data-hsq="${q}" aria-pressed="${hv.sq === q}">${icon('check', 'ic ck')}${q === 'ALL' ? 'ทุกฝูง' : `ฝูง ${q}`}</button>`).join('');
  const body = rows.map((t) => {
    const on = sel?.tp === t;
    const cells = fys.map((y) => {
      const n = grid[t].get(y);
      if (!n) return '<td><span class="z" aria-hidden="true">·</span></td>';
      return `<td><button class="l${lvl(n)}" data-htp="${t}" data-hfy="${y}" aria-pressed="${on && sel.fy === y}" aria-label="${esc(short[t])} ปีงบ ${y}: ${n} เรื่อง">${n}</button></td>`;
    }).join('');
    return `<tr><th class="tp" scope="row"><button data-htp="${t}" aria-pressed="${on && sel.fy == null}" title="${esc(topics[t])}">${esc(short[t])}</button></th>${cells}<td class="tot">${nTh(tot[t])}</td></tr>`;
  }).join('');

  let listHtml;
  if (sel) {
    const L = pool.filter((x) => (sel.tp === -1 ? !x.tp?.length : x.tp?.includes(sel.tp)) && (sel.fy == null || x.fy === sel.fy));
    const name = sel.tp === -1 ? 'ยังไม่เข้าหัวข้อใด' : topics[sel.tp];
    listHtml = `<h2 class="sec-h" id="h-l-h">${esc(name)} <span>${sel.fy == null ? 'ทุกปีงบ' : `ปีงบ ${sel.fy}`} · ${hv.sq === 'ALL' ? 'ทุกฝูง' : `ฝูง ${hv.sq}`} · ${nTh(L.length)} เรื่อง</span></h2>
      ${hGroups(L.sort(byFyDesc), 'fy')}`;
  } else {
    listHtml = `<h2 class="sec-h" id="h-l-h">รายการเรื่อง</h2>
      <p class="note">แตะชื่อหัวข้อเพื่อดูทุกปี หรือแตะตัวเลขเพื่อดูเฉพาะปีนั้น</p>`;
  }

  return `<div class="hv-grid t">
    <section class="hv-l" aria-labelledby="h-hm-h">
      <h2 class="sec-h" id="h-hm-h">หัวข้อ × ปีงบ <span>${nTh(pool.length)} เรื่อง</span></h2>
      <div class="chips h-sq" role="group" aria-label="ฝูงบิน">${chips}</div>
      <div class="hm-wrap" tabindex="0" role="region" aria-label="ตารางหัวข้อ × ปีงบ เลื่อนซ้ายขวาได้">
        <table class="hm">
          <thead><tr><th class="tp" scope="col">หัวข้อ</th>${fys.map((y) => `<th scope="col">${y}</th>`).join('')}<th class="tot" scope="col">รวม</th></tr></thead>
          <tbody>${body}</tbody>
        </table>
      </div>
      <p class="note">นับทั้งแบบฟอร์มและบันทึกประชุม ไม่รวมเหตุของ ทอ. · หัวข้อติดด้วยคำค้นอัตโนมัติ อาจติดผิดบ้าง · เรื่องหนึ่งอยู่ได้หลายหัวข้อ${formOnly.length ? ` · ปีงบ ${yrRuns(formOnly)} มีแต่แบบฟอร์ม` : ''}</p>
      ${untagged ? `<button class="btn more" data-htp="-1" aria-pressed="${sel?.tp === -1}">${nTh(untagged)} เรื่องยังไม่เข้าหัวข้อใด</button>` : ''}
    </section>
    <section class="hv-r" id="hlist" aria-labelledby="h-l-h">${listHtml}</section>
  </div>`;
}

// เดือนและฤดูจาก meta.date ("16 ธ.ค. 2558" หรือ "พ.ย. 2559") · ฤดูตามกรมอุตุนิยมวิทยา
// เรื่องที่รู้แค่เดือนและตกเดือนเปลี่ยนฤดู (ก.พ. พ.ค. ต.ค.) ไม่นับเข้าฤดูใด
const HMON = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const HMON_FULL = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
const HMON_FY = [10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const HSEA = { cool: ['ฤดูหนาว', '16 ต.ค.–15 ก.พ.', 123], hot: ['ฤดูร้อน', '16 ก.พ.–15 พ.ค.', 89], rain: ['ฤดูฝน', '16 พ.ค.–15 ต.ค.', 153] };
const HSEA_KEYS = Object.keys(HSEA);
const monSea = (m) => (m >= 11 || m === 1 ? 'cool' : m === 3 || m === 4 ? 'hot' : m >= 6 && m <= 9 ? 'rain' : 'x');
const hW = new WeakMap();
function hWhen(it) {
  if (hW.has(it)) return hW.get(it);
  const s = it.meta?.date || '';
  const i = HMON.findIndex((k) => s.includes(k));
  let w = null;
  if (i >= 0) {
    const m = i + 1, d = +(s.match(/^(\d{1,2})\s/)?.[1] || 0);
    let sea = null;
    if (d || ![2, 5, 10].includes(m)) { const v = m * 100 + (d || 1); sea = v >= 216 && v <= 515 ? 'hot' : v >= 516 && v <= 1015 ? 'rain' : 'cool'; }
    w = { m, s: sea };
  }
  hW.set(it, w);
  return w;
}

// ชั่วโมงจาก meta.time ("09.30 น." หรือ "2130") · บางเรื่องเป็นเวลาที่พบหรือรายงาน ไม่ใช่เวลาเกิด
const HNT = { f: 'บินกลางคืน', g: 'ภาคพื้นกลางคืน' };
const hHour = (it) => {
  const s = it.meta?.time || '';
  const m = s.match(/(\d{1,2})[.:]\d{2}/) || s.match(/^(\d{2})\d{2}$/);
  const v = m ? +m[1] : NaN;
  return v >= 0 && v <= 23 ? v : null;
};
// ช่วงมืดที่ลพบุรี: สิ้นแสงสนธยาราว 18.20–19.15 น. รุ่งสางราว 05.30–06.20 น. → 19–05 มืด, 18 และ 06 คาบเกี่ยว
const hDark = (r) => (r >= 19 || r <= 5 ? 'dk' : r === 18 || r === 6 ? 'tw' : '');

// แบ่งกลุ่มตามเดือน เรียงแบบปีงบ (ต.ค. → ก.ย.)
function hGroupsMon(list) {
  return HMON_FY.filter((m) => list.some((x) => hWhen(x)?.m === m)).map((m) => {
    const rows = list.filter((x) => hWhen(x)?.m === m).sort(byFyDesc);
    return `<section class="hg"><h3 class="yh">${HMON_FULL[m - 1]}<span class="n">${nTh(rows.length)} เรื่อง</span></h3><ul class="evs">${rows.map((x) => hRow(x, { fy: true })).join('')}</ul></section>`;
  }).join('');
}

// แบบ E: รายเดือนและฤดู (รวมทุกปีงบ) · ไม่รวมเหตุของหน่วยอื่น (r) · เปิดมาครั้งแรกเลือกเดือนปัจจุบันไว้
function hvMonths(h) {
  const hv = state.hv;
  const { topics, short } = h.data;
  const now = new Date().getMonth() + 1;
  if (hv.ms === undefined) hv.ms = `m.${now}`;
  const pool = h.data.items.filter((x) => x.src !== 'r' && (hv.sq === 'ALL' || x.sq === hv.sq));
  const dated = pool.filter((x) => hWhen(x));
  const z = () => ({ accident: 0, incident: 0, hazard: 0, n: 0 });
  const per = new Map(HMON_FY.map((m) => [m, z()]));
  const sea = Object.fromEntries(HSEA_KEYS.map((k) => [k, { ...z(), tp: new Map() }]));
  const tpSea = new Map();
  const grid = topics.map(() => new Map());
  const tot = topics.map(() => 0);
  let nSea = 0;
  for (const it of dated) {
    const w = hWhen(it), ty = HTYPE_ORDER.includes(it.type) ? it.type : 'hazard';
    const c = per.get(w.m); c[ty]++; c.n++;
    for (const t of it.tp || []) { if (grid[t]) { grid[t].set(w.m, (grid[t].get(w.m) || 0) + 1); tot[t]++; } }
    if (!w.s) continue;
    const s = sea[w.s]; s[ty]++; s.n++; nSea++;
    for (const t of it.tp || []) { s.tp.set(t, (s.tp.get(t) || 0) + 1); tpSea.set(t, (tpSea.get(t) || 0) + 1); }
  }
  const tyLine = (c) => HTYPE_ORDER.filter((k) => c[k]).map((k) => `${typeOf({ type: k })[0]} ${nTh(c[k])}`).join(' · ');

  // ฤดู: เทียบอัตราต่อวันกับค่าเฉลี่ยทั้งปี เพราะฤดูยาวไม่เท่ากัน · หัวข้อเด่น = สัดส่วนในฤดูสูงกว่าสัดส่วนวันของฤดู
  const avg = nSea / 365;
  const seaHtml = HSEA_KEYS.map((k) => {
    const s = sea[k], [nm, rg, days] = HSEA[k];
    const d = avg ? Math.round((s.n / days / avg - 1) * 100) : 0;
    const cmp = Math.abs(d) < 3 ? 'ใกล้ค่าเฉลี่ย' : `${d > 0 ? 'สูง' : 'ต่ำ'}กว่าค่าเฉลี่ย ${Math.abs(d)}%`;
    const lift = [...s.tp].filter(([t, n]) => grid[t] && n >= 5 && tpSea.get(t) >= 8)
      .map(([t, n]) => [t, n, n / tpSea.get(t) / (days / 365)]).filter((r) => r[2] >= 1.15)
      .sort((a, b) => b[2] - a[2]).slice(0, 3);
    const chips = lift.map(([t, n, x]) => `<button class="chip" data-hms="ts.${t}.${k}" aria-pressed="${hv.ms === `ts.${t}.${k}`}" aria-label="${esc(short[t])} ใน${nm} ${n} เรื่อง ${x.toFixed(1)} เท่าของที่คาด">${esc(short[t])} <b>×${x.toFixed(1)}</b></button>`).join('');
    return `<div class="h-sea ${k}">
      <button class="h-sea-b" data-hms="s.${k}" aria-pressed="${hv.ms === `s.${k}`}">
        <span class="nm">${nm}</span><span class="rg">${rg}</span>
        <span class="v"><b>${nTh(s.n)}</b> เรื่อง</span>
        <span class="cmp${d >= 3 ? ' up' : ''}">${s.n ? cmp : 'ไม่มีเรื่อง'}</span>
        <span class="ty">${tyLine(s)}</span>
      </button>
      ${chips ? `<p class="lb">พบบ่อยกว่าปกติในฤดูนี้</p><div class="chips">${chips}</div>` : ''}
    </div>`;
  }).join('');

  // แท่งรายเดือน ซ้อนตามประเภท · แถบฤดูด้านล่างแบ่งครึ่งเดือนตรงเดือนเปลี่ยนฤดู
  const max = Math.max(1, ...[...per.values()].map((c) => c.n));
  const bars = HMON_FY.map((m) => {
    const c = per.get(m);
    const segs = HTYPE_ORDER.filter((k) => c[k]).map((k) => `<i class="sg ${typeOf({ type: k })[1]}" style="height:${(c[k] / max * 100).toFixed(2)}%"></i>`).join('');
    const al = `${HMON_FULL[m - 1]}: ${c.n} เรื่อง${c.n ? ` — ${tyLine(c)}` : ''}${m === now ? ' (เดือนนี้)' : ''}`;
    return `<button class="h-mb s-${monSea(m)}${m === now ? ' now' : ''}" data-hms="m.${m}" aria-pressed="${hv.ms === `m.${m}`}" aria-label="${esc(al)}"${c.n ? '' : ' disabled'}>`
      + `<span class="n">${nTh(c.n)}</span><span class="col">${segs}</span><span class="mn">${HMON[m - 1]}</span></button>`;
  }).join('');
  const band = `<div class="h-band" aria-hidden="true"><i class="rain" style="grid-column:1/2"></i>`
    + `<i class="cool" style="grid-column:2/10">หนาว</i><i class="hot" style="grid-column:10/16">ร้อน</i><i class="rain" style="grid-column:16/25">ฝน</i></div>`;
  const keys = HTYPE_ORDER.map((k) => { const [th, cls] = typeOf({ type: k }); return `<span><i class="sg ${cls}"></i>${th}</span>`; }).join('');

  // ตารางหัวข้อ × เดือน
  const rows = topics.map((_, t) => t).filter((t) => tot[t]).sort((a, b) => tot[b] - tot[a]);
  const hmax = Math.max(1, ...rows.flatMap((t) => [...grid[t].values()]));
  const lvl = (n) => { const r = n / hmax; return r <= 0.1 ? 1 : r <= 0.25 ? 2 : r <= 0.45 ? 3 : r <= 0.7 ? 4 : 5; };
  const body = rows.map((t) => {
    const cells = HMON_FY.map((m) => {
      const n = grid[t].get(m);
      if (!n) return '<td><span class="z" aria-hidden="true">·</span></td>';
      return `<td><button class="l${lvl(n)}" data-hms="tm.${t}.${m}" aria-pressed="${hv.ms === `tm.${t}.${m}`}" aria-label="${esc(short[t])} ${HMON_FULL[m - 1]}: ${n} เรื่อง">${n}</button></td>`;
    }).join('');
    return `<tr><th class="tp" scope="row"><button data-hms="t.${t}" aria-pressed="${hv.ms === `t.${t}`}" title="${esc(topics[t])}">${esc(short[t])}</button></th>${cells}<td class="tot">${nTh(tot[t])}</td></tr>`;
  }).join('');

  // รายการตามที่เลือก
  const [k, a, b] = (hv.ms || '').split('.');
  const sqTxt = hv.sq === 'ALL' ? 'ทุกฝูง' : `ฝูง ${hv.sq}`;
  let L = null, name = '', sub = '', by = 'fy';
  if (k === 'm' && per.has(+a)) { L = dated.filter((x) => hWhen(x).m === +a); name = HMON_FULL[a - 1]; sub = 'ทุกปีงบ'; }
  else if (k === 's' && HSEA[a]) { L = dated.filter((x) => hWhen(x).s === a); name = HSEA[a][0]; sub = HSEA[a][1]; by = 'mon'; }
  else if ((k === 'ts' || k === 'tm' || k === 't') && grid[+a]) {
    const t = +a;
    L = dated.filter((x) => x.tp?.includes(t));
    name = topics[t];
    if (k === 'ts' && HSEA[b]) { L = L.filter((x) => hWhen(x).s === b); sub = `${HSEA[b][0]} ${HSEA[b][1]}`; }
    else if (k === 'tm' && per.has(+b)) { L = L.filter((x) => hWhen(x).m === +b); sub = HMON_FULL[b - 1]; }
    else { sub = 'ทุกเดือน'; by = 'mon'; }
  }
  const listHtml = L
    ? `<h2 class="sec-h" id="h-l-h">${esc(name)} <span>${esc(sub)} · ${sqTxt} · ${nTh(L.length)} เรื่อง</span></h2>
      ${k === 'm' && +a === now ? '<p class="note">เดือนนี้ในปีก่อน ๆ เคยเกิดเรื่องเหล่านี้ ใช้เตรียมบรีฟก่อนบินได้</p>' : ''}
      ${L.length ? (by === 'mon' ? hGroupsMon(L) : hGroups(L.sort(byFyDesc), 'fy')) : '<p class="note">ไม่มีเรื่องในฝูงที่เลือก</p>'}`
    : `<h2 class="sec-h" id="h-l-h">รายการเรื่อง</h2><p class="note">แตะฤดู เดือน หรือตัวเลขในตาราง เพื่อดูรายการ</p>`;

  const chipsSq = HSQ.map((q) => `<button class="chip" data-hsq="${q}" aria-pressed="${hv.sq === q}">${icon('check', 'ic ck')}${q === 'ALL' ? 'ทุกฝูง' : `ฝูง ${q}`}</button>`).join('');
  const noM = pool.length - dated.length, noS = dated.length - nSea;
  return `<div class="hv-grid t">
    <section class="hv-l" aria-labelledby="h-se-h">
      <h2 class="sec-h" id="h-se-h">ตามฤดู <span>${nTh(dated.length)} เรื่องที่ระบุเดือน · รวมทุกปีงบ</span></h2>
      <div class="chips h-sq" role="group" aria-label="ฝูงบิน">${chipsSq}</div>
      <div class="h-seas">${seaHtml}</div>
      <h2 class="sec-h">รายเดือน <span>ต.ค. → ก.ย. ตามปีงบ</span></h2>
      <div class="h-mos" role="group" aria-label="จำนวนเรื่องรายเดือน">${bars}</div>
      ${band}
      <div class="h-keys">${keys}</div>
      <h2 class="sec-h">หัวข้อ × เดือน</h2>
      <div class="hm-wrap" tabindex="0" role="region" aria-label="ตารางหัวข้อ × เดือน เลื่อนซ้ายขวาได้">
        <table class="hm mo">
          <thead><tr><th class="tp" scope="col">หัวข้อ</th>${HMON_FY.map((m) => `<th scope="col" class="s-${monSea(m)}">${HMON[m - 1].replace(/\.$/, '')}</th>`).join('')}<th class="tot" scope="col">รวม</th></tr></thead>
          <tbody>${body}</tbody>
        </table>
      </div>
      <p class="note">ฤดูตามกรมอุตุนิยมวิทยา · เทียบต่อวันเพราะฤดูยาวไม่เท่ากัน · “×1.5” = พบในฤดูนั้นมากกว่าที่คาดจากความยาวฤดู 1.5 เท่า (นับเฉพาะหัวข้อที่มีอย่างน้อย 8 เรื่อง) · จำนวนเรื่องขึ้นกับชั่วโมงบินและการรายงานของแต่ละช่วงด้วย ไม่ได้มาจากอากาศอย่างเดียว · หัวข้อติดด้วยคำค้นอัตโนมัติ${noM ? ` · ไม่มีวันที่ ${nTh(noM)} เรื่อง` : ''}${noS ? ` · รู้แค่เดือนที่เปลี่ยนฤดู ${nTh(noS)} เรื่อง (ไม่นับเข้าฤดู)` : ''} · ไม่รวมเหตุของ ทอ.</p>
    </section>
    <section class="hv-r" id="hlist" aria-labelledby="h-l-h">${listHtml}</section>
  </div>`;
}

// แบบ F: รายชั่วโมงของวัน (รวมทุกปีงบ) · เวลาจาก meta.time · ไม่รวมเหตุของหน่วยอื่น (r) · เปิดมาครั้งแรกเลือกช่วงมืด
const HPER = { d: ['กลางวัน', '07.00–17.59 น.', 11], tw: ['สนธยา', '06 และ 18 น.', 2], dk: ['ช่วงมืด', '19.00–05.59 น.', 11] };
const hPer = (r) => hDark(r) || 'd';
const HBLK = [0, 3, 6, 9, 12, 15, 18, 21];
function hvHours(h) {
  const hv = state.hv;
  const { topics, short } = h.data;
  if (hv.hs === undefined) hv.hs = 'p.dk';
  const pool = h.data.items.filter((x) => x.src !== 'r' && (hv.sq === 'ALL' || x.sq === hv.sq));
  const timed = pool.filter((x) => hHour(x) != null);
  const z = () => ({ accident: 0, incident: 0, hazard: 0, n: 0 });
  const perH = Array.from({ length: 24 }, z);
  const per = Object.fromEntries(Object.keys(HPER).map((k) => [k, { ...z(), tp: new Map() }]));
  const tpAll = new Map();
  const grid = topics.map(() => new Map());
  const tot = topics.map(() => 0);
  for (const it of timed) {
    const r = hHour(it), ty = HTYPE_ORDER.includes(it.type) ? it.type : 'hazard', p = per[hPer(r)], b = Math.floor(r / 3);
    perH[r][ty]++; perH[r].n++; p[ty]++; p.n++;
    for (const t of it.tp || []) {
      if (!grid[t]) continue;
      p.tp.set(t, (p.tp.get(t) || 0) + 1); tpAll.set(t, (tpAll.get(t) || 0) + 1);
      grid[t].set(b, (grid[t].get(b) || 0) + 1); tot[t]++;
    }
  }
  const tyLine = (c) => HTYPE_ORDER.filter((k) => c[k]).map((k) => `${typeOf({ type: k })[0]} ${nTh(c[k])}`).join(' · ');
  const hh = (r) => String(r).padStart(2, '0');

  // ช่วงเวลา: เทียบอัตราต่อชั่วโมงกับค่าเฉลี่ยทั้งวัน เพราะแต่ละช่วงยาวไม่เท่ากัน · หัวข้อเด่น = สัดส่วนในช่วงสูงกว่าสัดส่วนของช่วงนั้นโดยรวม
  const avg = timed.length / 24;
  const perHtml = Object.keys(HPER).map((k) => {
    const p = per[k], [nm, rg, hrs] = HPER[k];
    const d = avg ? Math.round((p.n / hrs / avg - 1) * 100) : 0;
    const cmp = Math.abs(d) < 3 ? 'ใกล้ค่าเฉลี่ย' : `${d > 0 ? 'สูง' : 'ต่ำ'}กว่าค่าเฉลี่ยรายชั่วโมง ${Math.abs(d)}%`;
    const lift = [...p.tp].filter(([t, n]) => n >= 5 && tpAll.get(t) >= 8)
      .map(([t, n]) => [t, n, n / tpAll.get(t) / (p.n / timed.length)]).filter((r) => r[2] >= 1.15)
      .sort((a, b) => b[2] - a[2]).slice(0, 3);
    const chips = lift.map(([t, n, x]) => `<button class="chip" data-hhs="tp.${t}.${k}" aria-pressed="${hv.hs === `tp.${t}.${k}`}" aria-label="${esc(short[t])} ใน${nm} ${n} เรื่อง ${x.toFixed(1)} เท่าของสัดส่วนปกติ">${esc(short[t])} <b>×${x.toFixed(1)}</b></button>`).join('');
    return `<div class="h-sea p-${k}">
      <button class="h-sea-b" data-hhs="p.${k}" aria-pressed="${hv.hs === `p.${k}`}">
        <span class="nm">${nm}</span><span class="rg">${rg}</span>
        <span class="v"><b>${nTh(p.n)}</b> เรื่อง</span>
        <span class="cmp${d >= 3 ? ' up' : ''}">${p.n ? cmp : 'ไม่มีเรื่อง'}</span>
        <span class="ty">${tyLine(p)}</span>
      </button>
      ${chips ? `<p class="lb">สัดส่วนสูงกว่าปกติในช่วงนี้</p><div class="chips">${chips}</div>` : ''}
    </div>`;
  }).join('');

  // แท่ง 00–23 ซ้อนตามประเภท · พื้นหลังเข้ม = ช่วงมืด
  const hmx = Math.max(1, ...perH.map((c) => c.n));
  const hbars = perH.map((c, r) => {
    const segs = HTYPE_ORDER.filter((k) => c[k]).map((k) => `<i class="sg ${typeOf({ type: k })[1]}" style="height:${(c[k] / hmx * 100).toFixed(2)}%"></i>`).join('');
    const al = `${hh(r)}.00–${hh(r)}.59 น.: ${c.n} เรื่อง${c.n ? ` — ${tyLine(c)}` : ''}${hDark(r) === 'dk' ? ' (ช่วงมืด)' : hDark(r) ? ' (ช่วงสนธยา)' : ''}`;
    return `<button class="h-hb ${hDark(r)}" data-hhs="h.${r}" aria-pressed="${hv.hs === `h.${r}`}" aria-label="${esc(al)}" title="${esc(al)}"${c.n ? '' : ' disabled'}>`
      + `<span class="n">${c.n || ''}</span><span class="col">${segs}</span><span class="mn">${r % 3 ? '' : hh(r)}</span></button>`;
  }).join('');
  const keys = HTYPE_ORDER.map((k) => { const [th, cls] = typeOf({ type: k }); return `<span><i class="sg ${cls}"></i>${th}</span>`; }).join('');

  // ตารางหัวข้อ × ช่วง 3 ชั่วโมง
  const rows = topics.map((_, t) => t).filter((t) => tot[t]).sort((a, b) => tot[b] - tot[a]);
  const bmax = Math.max(1, ...rows.flatMap((t) => [...grid[t].values()]));
  const lvl = (n) => { const r = n / bmax; return r <= 0.1 ? 1 : r <= 0.25 ? 2 : r <= 0.45 ? 3 : r <= 0.7 ? 4 : 5; };
  const blk = (b) => `${hh(HBLK[b])}–${hh(HBLK[b] + 2)}`;
  const body = rows.map((t) => {
    const cells = HBLK.map((_, b) => {
      const n = grid[t].get(b);
      if (!n) return '<td><span class="z" aria-hidden="true">·</span></td>';
      return `<td><button class="l${lvl(n)}" data-hhs="tb.${t}.${b}" aria-pressed="${hv.hs === `tb.${t}.${b}`}" aria-label="${esc(short[t])} เวลา ${blk(b)} น.: ${n} เรื่อง">${n}</button></td>`;
    }).join('');
    return `<tr><th class="tp" scope="row"><button data-hhs="t.${t}" aria-pressed="${hv.hs === `t.${t}`}" title="${esc(topics[t])}">${esc(short[t])}</button></th>${cells}<td class="tot">${nTh(tot[t])}</td></tr>`;
  }).join('');

  // รายการตามที่เลือก
  const [k, a, b] = (hv.hs || '').split('.');
  const sqTxt = hv.sq === 'ALL' ? 'ทุกฝูง' : `ฝูง ${hv.sq}`;
  let L = null, name = '', sub = 'ทุกปีงบ';
  if (k === 'h' && a !== '' && +a >= 0 && +a <= 23) { L = timed.filter((x) => hHour(x) === +a); name = `เวลา ${hh(+a)}.00–${hh(+a)}.59 น.`; if (hDark(+a) === 'dk') sub = 'ช่วงมืด · ทุกปีงบ'; }
  else if (k === 'p' && HPER[a]) { L = timed.filter((x) => hPer(hHour(x)) === a); name = HPER[a][0]; sub = `${HPER[a][1]} · ทุกปีงบ`; }
  else if ((k === 'tp' || k === 'tb' || k === 't') && grid[+a]) {
    const t = +a;
    L = timed.filter((x) => x.tp?.includes(t));
    name = topics[t];
    if (k === 'tp' && HPER[b]) { L = L.filter((x) => hPer(hHour(x)) === b); sub = `${HPER[b][0]} ${HPER[b][1]}`; }
    else if (k === 'tb' && HBLK[+b] != null) { L = L.filter((x) => Math.floor(hHour(x) / 3) === +b); sub = `เวลา ${blk(+b)} น.`; }
    else sub = 'ทุกช่วงเวลา';
  }
  const listHtml = L
    ? `<h2 class="sec-h" id="h-l-h">${esc(name)} <span>${esc(sub)} · ${sqTxt} · ${nTh(L.length)} เรื่อง</span></h2>
      ${L.length ? hGroups(L.sort(byFyDesc), 'fy') : '<p class="note">ไม่มีเรื่องในฝูงที่เลือก</p>'}`
    : `<h2 class="sec-h" id="h-l-h">รายการเรื่อง</h2><p class="note">แตะช่วงเวลา แท่งชั่วโมง หรือตัวเลขในตาราง เพื่อดูรายการ</p>`;

  const chipsSq = HSQ.map((q) => `<button class="chip" data-hsq="${q}" aria-pressed="${hv.sq === q}">${icon('check', 'ic ck')}${q === 'ALL' ? 'ทุกฝูง' : `ฝูง ${q}`}</button>`).join('');
  const noT = pool.length - timed.length;
  return `<div class="hv-grid t">
    <section class="hv-l" aria-labelledby="h-pr-h">
      <h2 class="sec-h" id="h-pr-h">ตามช่วงเวลา <span>${nTh(timed.length)} เรื่องที่ระบุเวลา · รวมทุกปีงบ</span></h2>
      <div class="chips h-sq" role="group" aria-label="ฝูงบิน">${chipsSq}</div>
      <div class="h-seas h-pers">${perHtml}</div>
      <h2 class="sec-h">รายชั่วโมง <span>00 → 23 น.</span></h2>
      <div class="h-hrs big" role="group" aria-label="จำนวนเรื่องตามชั่วโมงของวัน">${hbars}</div>
      <div class="h-keys">${keys}<span><i class="sw dk"></i>ช่วงมืด</span><span><i class="sw tw"></i>สนธยา</span></div>
      <h2 class="sec-h">หัวข้อ × ช่วงเวลา <span>ช่วงละ 3 ชั่วโมง</span></h2>
      <div class="hm-wrap" tabindex="0" role="region" aria-label="ตารางหัวข้อ × ช่วงเวลา เลื่อนซ้ายขวาได้">
        <table class="hm hr">
          <thead><tr><th class="tp" scope="col">หัวข้อ</th>${HBLK.map((r, b) => `<th scope="col"${r >= 18 || r < 6 ? ' class="p-dk"' : ''}>${blk(b)}</th>`).join('')}<th class="tot" scope="col">รวม</th></tr></thead>
          <tbody>${body}</tbody>
        </table>
      </div>
      <p class="note">เวลาตามที่บันทึกไว้ บางเรื่องเป็นเวลาที่พบหรือรายงาน ไม่ใช่เวลาเกิด · ช่วงมืดที่ลพบุรีราว 19.00–05.59 น. ชั่วโมง 06 และ 18 คาบเกี่ยวแสงสนธยา · เทียบต่อชั่วโมงเพราะแต่ละช่วงยาวไม่เท่ากัน · “×1.5” = หัวข้อนั้นอยู่ในช่วงนี้มากกว่าสัดส่วนปกติ 1.5 เท่า (นับเฉพาะหัวข้อที่มีอย่างน้อย 8 เรื่อง) · จำนวนเรื่องขึ้นกับว่าบินหรือทำงานช่วงไหนมาก ไม่ได้บอกว่าช่วงไหนอันตรายกว่า · ป้าย “กลางคืน” ด้านบนตรวจทีละเรื่องแล้ว แม่นกว่าเวลาในกราฟ${noT ? ` · ไม่ระบุเวลา ${nTh(noT)} เรื่อง` : ''} · ไม่รวมเหตุของ ทอ.</p>
    </section>
    <section class="hv-r" id="hlist" aria-labelledby="h-l-h">${listHtml}</section>
  </div>`;
}

// ทุกเรื่องที่เป็นเรื่องเดียวกับการ์ดบทเรียน (เปิดจากแผงในหน้าเคส)
function hvCard(h, cardId, s) {
  const ids = h.data.cardLinks?.[cardId];
  if (!ids) { viewNotFound(); return ''; }
  const list = hItems(ids).sort(byFyDesc);
  const nR = list.filter((x) => x.src === 'r').length;
  const nW = list.length - nR;
  const card = byId(cardId);
  const back = state.hv.ret.startsWith('#/case/') ? state.hv.ret : '#/history';
  return `<div class="view hv hs${s}">
    <div class="case-top"><a class="back" href="${esc(back)}" aria-label="ย้อนกลับ">${icon('back')}</a></div>
    <p class="eyebrow">ประวัติเหตุ บน.2</p>
    <h1 class="page-h">${nW ? `เกิดใน บน.2 มาแล้ว <em>${nTh(nW)} ครั้ง</em>` : `ยกมาเล่าในที่ประชุม บน.2 <em>${nTh(nR)} ครั้ง</em>`}</h1>
    <p class="lede">${card ? `เรื่องเดียวกับการ์ด “${esc(card.title)}”` : 'เรื่องเดียวกับการ์ดบทเรียนนี้'}${list.length ? ` · ปีงบ ${fySpan(list)}` : ''}${nR && nW ? ` · รวมเหตุ ทอ. ที่ยกมาเล่า ${nTh(nR)} ครั้ง` : ''}</p>
    ${hGroups(list, 'fy', cardId)}
  </div>`;
}

// ทุกปีของหัวข้อหนึ่ง ทุกฝูง (เปิดจากแผงในหน้าเคสที่ไม่มีเรื่องที่จับคู่ตรง ๆ)
function hvTopic(h, t, s) {
  const { topics } = h.data;
  if (!Number.isInteger(t) || t < -1 || t >= topics.length) { viewNotFound(); return ''; }
  const list = h.data.items.filter((x) => x.src !== 'r' && (t === -1 ? !x.tp?.length : x.tp?.includes(t))).sort(byFyDesc);
  const back = state.hv.ret.startsWith('#/case/') ? state.hv.ret : '#/history/topics';
  return `<div class="view hv hs${s}">
    <div class="case-top"><a class="back" href="${esc(back)}" aria-label="ย้อนกลับ">${icon('back')}</a></div>
    <p class="eyebrow">ประวัติเหตุ บน.2 · ตามหัวข้อ</p>
    <h1 class="page-h">${esc(t === -1 ? 'ยังไม่เข้าหัวข้อใด' : topics[t])}</h1>
    <p class="lede">${nTh(list.length)} เรื่อง${list.length ? ` ปีงบ ${fySpan(list)}` : ''} · ไม่รวมเหตุของ ทอ. · หัวข้อติดด้วยคำค้นอัตโนมัติ อาจติดผิดบ้าง</p>
    ${hGroups(list, 'fy')}
  </div>`;
}

// รายละเอียดหนึ่งเรื่อง · เรื่องที่จับคู่ได้ (m) สลับดู รวม / แบบฟอร์ม / ที่ประชุม ได้
function hvItem(h, id, s) {
  const it = h.data.byId.get(id);
  if (!it) { viewNotFound(); return ''; }
  // rw = มีข้อความเรียบเรียง (f/g) และต้นฉบับ (fo/go) · orig = กำลังดูต้นฉบับของเรื่องนี้
  const rw = !!(it.fo || it.go);
  const orig = rw && state.hv.orig === id;
  const f = (orig ? it.fo : it.f) || {}, g = (orig ? it.go : it.g) || {};
  const both = it.src === 'm' && (!rw || orig);
  let mode = both ? LS.get('histMode', 'all') : 'all';
  if (!['all', 'f', 'g'].includes(mode)) mode = 'all';
  const showF = mode !== 'g', showG = mode !== 'f';
  const tagged = both && mode === 'all';
  const para = (txt, tag) => String(txt).split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean).map((x, k) =>
    `<p class="para">${tagged && !k ? `<span class="ptag ${tag}">${tag === 'fm' ? 'แบบฟอร์ม' : 'ประชุม'}</span>` : ''}${hTxt(x).replace(/\n/g, '<br>')}</p>`).join('');
  const sec = (title, parts) => {
    const ps = parts.filter(([txt, tag, on]) => on && txt);
    // ข้อความเดียวกันทั้งสองแหล่ง แสดงครั้งเดียว
    const seen = new Set();
    const html = ps.filter(([txt]) => !seen.has(txt) && seen.add(txt)).map(([txt, tag]) => para(txt, tag)).join('');
    return html ? `<section class="sec"><h2 class="sec-h">${title}</h2>${html}</section>` : '';
  };
  const kvF = showF && (f.r || f.s)
    ? `<section class="sec"><h2 class="sec-h">ความเสี่ยงและสถานะ</h2><dl class="kv">${f.r ? `<dt>ระดับความเสี่ยง</dt><dd>${hTxt(f.r)}</dd>` : ''}${f.s ? `<dt>สถานะ</dt><dd>${hTxt(f.s)}</dd>` : ''}</dl></section>` : '';
  const body = [
    sec('เกิดอะไรขึ้น', [[f.h !== it.t ? f.h : '', 'fm', showF], [f.e, 'fm', showF], [g.n, 'mt', showG]]),
    sec('ผลการตรวจสอบ', [[f.i, 'fm', showF]]),
    sec('สาเหตุ', [[f.c, 'fm', showF], [g.c, 'mt', showG]]),
    sec('แก้ไขและข้อสั่งการ', [[f.a, 'fm', showF], [g.x, 'mt', showG]]),
    kvF,
    sec('ความเสียหายและการบาดเจ็บ', [[g.d, 'mt', showG], [g.j, 'mt', showG]]),
    sec('เคยเกิดมาก่อน', [[g.k, 'mt', showG]]),
  ].join('');
  const emptyNote = mode === 'f' ? 'แบบฟอร์มของเรื่องนี้มีแค่หัวเรื่อง ไม่มีรายละเอียดเพิ่ม'
    : mode === 'g' ? 'บันทึกประชุมของเรื่องนี้มีแค่หัวเรื่อง ไม่มีรายละเอียดเพิ่ม'
      : 'เอกสารต้นทางมีแค่หัวเรื่อง ไม่มีรายละเอียดเพิ่ม';

  const modeSw = both ? `<div class="seg h-mode" role="group" aria-label="แสดงข้อมูลจาก">${[['all', 'รวม'], ['f', 'แบบฟอร์ม'], ['g', 'ที่ประชุม']].map(([v, th]) =>
    `<button data-hmode="${v}" aria-pressed="${mode === v}">${icon('check', 'ic ck')}${th}</button>`).join('')}</div>` : '';
  const [th, cls] = typeOf(it);
  const banner = it.src === 'e'
    ? `<p class="banner">${icon('chat')}<span><b>นำมาจากไฟล์การประชุม</b> — ไม่พบแบบฟอร์ม MOR/HR ที่ตรงกัน อาจรายงานด้วยวาจา หรือไม่ได้เก็บแบบฟอร์มไว้</span></p>`
    : it.src === 'r' ? `<p class="banner">${icon('chat')}<span>เป็นเหตุของหน่วยอื่นใน ทอ. ที่ยกมาเล่าในที่ประชุมนิรภัย บน.2</span></p>` : '';

  const kv = [];
  const m = it.meta || {};
  if (m.date || m.time) kv.push(['วันเวลา', esc([m.date, m.time].filter(Boolean).join(' · '))]);
  if (m.unit) kv.push(['หน่วย', esc(m.unit)]);
  else if (it.sq) kv.push(['ฝูง', `ฝูง ${esc(it.sq)}`]);
  if (m.callsign) kv.push(['นามเรียกขาน', esc(m.callsign)]);
  if (m.tail) kv.push(['หมายเลขเครื่อง', esc(m.tail)]);
  if (m.place) kv.push(['สถานที่', esc(m.place)]);
  if (it.ac || it.acc) kv.push(['อากาศยาน', it.ac && it.acc && it.ac !== it.acc ? `${esc(it.ac)} (${esc(it.acc)})` : esc(it.ac || it.acc)]);
  if (it.mis) kv.push(['ภารกิจ', esc(it.mis)]);
  if (it.kind && it.kind !== 'None') kv.push(['แบบรายงาน', esc(it.kind)]);
  // ป้าย nt ตรวจทีละเรื่องแล้ว ใช้แทน tb ของแบบฟอร์ม (tb กลางคืน 6 เรื่องที่ตรวจแล้วไม่ใช่ ไม่แสดง)
  if (it.nt) kv.push(['ช่วงเวลา', `${icon('moon', 'ic nt-ic')}${HNT[it.nt]}`]);
  else if (it.tb === 'day') kv.push(['ช่วงเวลา', 'กลางวัน']);
  if (it.gnd) kv.push(['ที่เกิด', 'ภาคพื้น']);
  const prov = {
    m: `แบบฟอร์ม MOR/HR และบันทึกการประชุมนิรภัย<span class="auto">จับคู่อัตโนมัติ · ยังไม่ได้ตรวจด้วยคน</span>`,
    f: 'แบบฟอร์ม MOR/HR',
    e: 'บันทึกการประชุมนิรภัย',
    r: 'บันทึกการประชุมนิรภัย',
  }[it.src] ?? 'แบบฟอร์ม MOR/HR';
  const provX = [it.pf === 0 ? 'ข้อมูลจากทะเบียนสรุป ไม่พบตัวแบบฟอร์ม' : '', it.ns > 1 ? `รวมจาก ${it.ns} รายการในเอกสาร` : ''].filter(Boolean);
  const cards = (it.cards || []).map((cid) => byId(cid)).filter(Boolean);
  const cardHtml = cards.length
    ? cards.map((c) => `<a class="lnk" href="#/case/${encodeURIComponent(c.id)}">${icon('card')}<span>เปิดการ์ดบทเรียน<small>${esc(c.title)}</small></span>${icon('next', 'ic go')}</a>`).join('')
    : it.cards?.length ? '<p class="note">มีการ์ดบทเรียนของเรื่องนี้ แต่ยังไม่อยู่ในข้อมูลหน่วยเวอร์ชันนี้</p>' : '';
  const im = himgs(it);
  const imgs = im.length ? `<section class="sec"><h2 class="sec-h">${icon('image')}ภาพจากเอกสาร <span>${im.length}</span></h2>
      <div class="h-img">${im.map((x, k) => `<a ${himgHref(x)} target="_blank" rel="noopener"><img ${himgSrc(x)} loading="lazy" decoding="async" alt="ภาพจากเอกสารต้นฉบับ ${k + 1}"></a>`).join('')}</div>
      <p class="note">ภาพจากไฟล์ต้นฉบับที่คัดกรองแล้ว · เบลอหน้าคน ป้ายชื่อ และลายเซ็น ภาพที่เบลอแล้วไม่เหลือสาระถูกตัดออก</p></section>` : '';

  return `<article class="view hv hd${s}">
    <div class="case-top">
      <a class="back" href="${esc(state.hv.back || '#/history')}" aria-label="ย้อนกลับ">${icon('back')}</a>
      <div class="meta"><span class="tag type">${dot(cls)}${esc(th)}</span>${hSrc(it)}<span class="yr">ปีงบ ${esc(it.fy)}</span></div>
    </div>
    <h1 class="hd-h">${hTxt(it.t)}</h1>
    ${banner}
    <div class="hv-d">
      <div class="hd-main">
        ${modeSw}
        ${body || `<p class="note">${emptyNote}</p>`}
        ${imgs}
        ${rw ? `<div class="h-orig"><p class="note">${orig ? 'ข้อความถอดจากเอกสารต้นฉบับ อาจมีคำสะกดผิด · ข้อมูลที่ตัดออกอยู่ในวงเล็บเหลี่ยม'
    : 'เรียบเรียงใหม่จากเอกสารต้นฉบับ ไม่เติมข้อเท็จจริงที่เอกสารไม่มี'}</p>
          <button class="btn more" data-horig="${esc(id)}" aria-pressed="${orig}">${icon(orig ? 'back' : 'doc')}${orig ? 'กลับไปข้อความเรียบเรียง' : 'ดูข้อความต้นฉบับ'}</button></div>`
    : '<p class="note">ข้อความถอดจากเอกสาร อาจมีคำสะกดผิด</p>'}
      </div>
      <aside class="hd-side">
        ${kv.length ? `<dl class="kv">${kv.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>` : ''}
        <p class="prov"><span class="k">ที่มา</span>${prov}${provX.map((x) => `<span class="auto">${x}</span>`).join('')}</p>
        ${cardHtml}
      </aside>
    </div>
  </article>`;
}

function histEmpty(st) {
  let ic = 'info', h2, p, acts = '';
  if (st === 'locked') {
    ic = 'lock';
    if (state.unitStatus === 'locked') {
      h2 = 'ข้อมูลล็อกอยู่';
      p = 'ประวัติเหตุเข้ารหัสด้วยรหัสเดียวกับเคสของหน่วย ใส่รหัสหน่วยครั้งเดียวแล้วเปิดได้ทั้งสองอย่าง';
      acts = `<button class="btn btn-primary" data-act="unlock">${icon('lock')}ใส่รหัสหน่วย</button>`;
    } else if (state.unitStatus === 'unlocked') {
      h2 = 'เปิดข้อมูลไม่สำเร็จ';
      p = 'กุญแจที่จำไว้ในเครื่องนี้เปิดไฟล์ประวัติเหตุไม่ได้ อาจเป็นไฟล์คนละรุ่นกับเคสของหน่วย ล้างกุญแจที่หน้า ข้อมูล แล้วใส่รหัสหน่วยใหม่';
      acts = '<a class="btn" href="#/about">ไปหน้า ข้อมูล</a>';
    } else {
      h2 = 'ยังไม่มีข้อมูลหน่วยในเวอร์ชันนี้';
      p = 'ประวัติเหตุใช้รหัสเดียวกับเคสของหน่วย เมื่อมีข้อมูลหน่วยแล้วจะเปิดได้';
      acts = '<a class="btn" href="#/">กลับหน้าหลัก</a>';
    }
  } else if (st === 'unsupported') {
    h2 = 'เบราว์เซอร์นี้เปิดไฟล์ไม่ได้';
    p = 'ไฟล์ประวัติเหตุถูกบีบอัดไว้ เบราว์เซอร์รุ่นนี้คลายไฟล์ไม่ได้ ลองอัปเดตเบราว์เซอร์ หรือเปิดด้วย Chrome / Safari รุ่นใหม่';
    acts = '<a class="btn" href="#/">กลับหน้าหลัก</a>';
  } else {
    h2 = 'ยังไม่มีประวัติเหตุในเวอร์ชันนี้';
    p = 'ข้อมูลประวัติเหตุของกองบินยังไม่ได้ใส่ในแอปเวอร์ชันนี้ ระหว่างนี้ดูบทเรียนได้จากการเลือกเที่ยวบิน';
    acts = '<a class="btn" href="#/filter">ไปเลือกเที่ยวบิน</a>';
  }
  return `<div class="view hv"><p class="eyebrow">ประวัติเหตุ บน.2</p>
    <div class="empty">${icon(ic)}<h2>${h2}</h2><p>${p}</p><div class="acts">${acts}</div></div></div>`;
}

function renderHist(arg, sub, still = false) {
  const h = state.hist;
  if (h?.status !== 'ok') { main.innerHTML = histEmpty(h?.status); return; }
  hCards = new Set(allCases().map((c) => c.id));
  const s = still ? ' still' : '';
  let html;
  // ปุ่ม "กลางคืน" และ "เฉพาะที่มีภาพ" กรองทั้งเส้นเวลาและตารางหัวข้อ (หน้าเรื่อง/หัวข้อเดี่ยวไม่กรอง)
  if (state.hv.img && !h.data.items.some((x) => himgs(x).length)) state.hv.img = false;
  if (state.hv.nt && !h.data.items.some((x) => x.nt)) state.hv.nt = null;
  const nt = state.hv.nt, keep = (x) => (!state.hv.img || himgs(x).length) && (!nt || (nt === 'a' ? x.nt : x.nt === nt));
  const hf = state.hv.img || nt ? { ...h, data: { ...h.data, items: h.data.items.filter(keep) } } : h;
  const q = state.hv.q.trim();
  if (q && ['', 'topics', 'months', 'hours'].includes(arg)) html = hvHead(h, { '': 'y', topics: 't', months: 'm', hours: 'h' }[arg], still) + hvSearch(hf, q) + '</div>';
  else if (!arg) html = hvHead(h, 'y', still) + hvYears(hf) + '</div>';
  else if (arg === 'topics') html = hvHead(h, 't', still) + hvTopics(hf) + '</div>';
  else if (arg === 'months') html = hvHead(h, 'm', still) + hvMonths(hf) + '</div>';
  else if (arg === 'hours') html = hvHead(h, 'h', still) + hvHours(hf) + '</div>';
  else if (arg === 'case' && sub) html = hvCard(h, decodeURIComponent(sub), s);
  else if (arg === 'topic' && sub) html = hvTopic(h, +decodeURIComponent(sub), s);
  else html = hvItem(h, arg, s);
  if (html) { main.innerHTML = html; hydrateImgs(main); }
}

function viewHist(arg, sub, prev) {
  if (!prev?.startsWith('/history')) state.hv.ret = prev ? '#' + prev : '';
  if (state.hist) { renderHist(arg, sub); return; }
  main.innerHTML = `<div class="view hv"><p class="eyebrow">ประวัติเหตุ บน.2</p><p class="note" role="status">กำลังเปิดข้อมูล…</p></div>`;
  const at = location.hash;
  loadHistory().then(() => { if (location.hash === at) renderHist(arg, sub); });
}

// วาดหน้าเดิมใหม่หลังกดตัวกรอง โดยไม่เล่นแอนิเมชันและคงโฟกัสไว้ที่ปุ่มเดิม
function redrawHist() {
  if (!state.hist) return;
  const a = document.activeElement;
  if (a?.id === 'hq') {
    renderHistKeepQ();
    return;
  }
  let sel = null;
  if (a && main.contains(a)) {
    const k = ['hy', 'hsrc', 'hsq', 'htp', 'hfy', 'hmode', 'himg', 'hnt', 'hms', 'hhs'].filter((x) => a.dataset[x] != null);
    if (k.length) sel = k.map((x) => `[data-${x}="${CSS.escape(a.dataset[x])}"]`).join('');
  }
  const parts = location.hash.replace(/^#\/?/, '').split('/');
  renderHist(decodeURIComponent(parts[1] || ''), parts[2], true);
  if (sel) $(sel, main)?.focus({ preventScroll: true });
}

// พิมพ์ในช่องค้นหา: วาดใหม่แล้วคืนโฟกัส/เคอร์เซอร์ให้ช่องเดิม
function renderHistKeepQ() {
  const a = $('#hq');
  const pos = a?.selectionStart ?? state.hv.q.length;
  const parts = location.hash.replace(/^#\/?/, '').split('/');
  renderHist(decodeURIComponent(parts[1] || ''), parts[2], true);
  const b = $('#hq');
  if (b) { b.focus({ preventScroll: true }); b.setSelectionRange(pos, pos); }
}
let hqT = 0;
document.addEventListener('input', (e) => {
  if (e.target.id !== 'hq') return;
  state.hv.q = e.target.value;
  clearTimeout(hqT);
  hqT = setTimeout(renderHistKeepQ, 180);
});
document.addEventListener('submit', (e) => {
  if (!e.target.matches('[data-hqf]')) return;
  e.preventDefault();
  clearTimeout(hqT);
  state.hv.q = $('#hq').value;
  renderHistKeepQ();
  $('#hq')?.blur(); // ปิดแป้นพิมพ์บนมือถือ ให้เห็นผล
});

// แบบ D: แผง "เกิดใน บน.2 มาแล้ว" ท้ายหน้าเคส · ปิดได้ที่ปุ่มในแผง หรือหน้า ข้อมูล
async function fillHistPanel(c, panel = true) {
  const at = location.hash;
  const h = await loadHistory();
  const box = $('#histp');
  if (location.hash !== at || !box || h.status !== 'ok') return;
  hCards = new Set(allCases().map((x) => x.id));
  const d = h.data;
  for (const a of $$('[data-hmore]', main)) {
    const it = d.items.find((x) => x.id === a.dataset.hmore);
    if (it) a.innerHTML = `<span>${hTxt(it.t)}</span><small>${[it.meta?.date || `ปีงบ ${it.fy}`, it.kind !== 'None' && it.kind].filter(Boolean).map(esc).join(' · ')}</small>`;
  }
  if (!panel) return;
  let list, head, sub, more;
  if (d.cardLinks?.[c.id]) {
    list = hItems(d.cardLinks[c.id]).sort(byFyDesc);
    if (!list.length) return;
    const nR = list.filter((x) => x.src === 'r').length;
    const nW = list.length - nR;
    const nF = list.filter((x) => x.src === 'm' || x.src === 'f').length;
    const nE = list.filter((x) => x.src === 'e').length;
    head = nW ? `เกิดใน บน.2 มาแล้ว ${nTh(nW)} ครั้ง` : `ยกมาเล่าในที่ประชุม บน.2 ${nTh(nR)} ครั้ง`;
    sub = [`ปีงบ ${fySpan(list)}`, nF ? `มีแบบฟอร์ม ${nTh(nF)}` : '', nE ? `จากการประชุมเท่านั้น ${nTh(nE)}` : '', nR ? `เหตุ ทอ. ที่ยกมาเล่า ${nTh(nR)}` : ''].filter(Boolean).join(' · ');
    more = `#/history/case/${encodeURIComponent(c.id)}`;
  } else {
    const t = (d.cardTopics?.[c.id] || []).find((x) => Number.isInteger(x) && x >= 0 && x < d.topics.length);
    if (t == null) return;
    list = d.items.filter((x) => x.src !== 'r' && x.tp?.includes(t)).sort(byFyDesc);
    if (!list.length) return;
    head = 'หัวข้อคล้ายกันใน บน.2';
    sub = `${esc(d.short[t])} · ${nTh(list.length)} เรื่อง ปีงบ ${fySpan(list)}`;
    more = `#/history/topic/${t}`;
  }
  const thumbs = list.filter((x) => himgs(x).length).slice(0, 4);
  box.innerHTML = `<section class="sec histp" aria-labelledby="histp-h">
    <h2 class="sec-h" id="histp-h">${icon('hist')}${esc(head)}</h2>
    <p class="note">${d.cardLinks?.[c.id] ? esc(sub) : sub}</p>
    <ul class="evs">${list.slice(0, 3).map((x) => hRow(x, { fy: true, here: c.id })).join('')}</ul>
    ${thumbs.length ? `<div class="h-img mini">${thumbs.map((x) => `<a data-hb href="#/history/${encodeURIComponent(x.id)}"><img ${himgSrc(himgs(x)[0])} loading="lazy" decoding="async" alt="ภาพจากเอกสาร ปีงบ ${esc(x.fy)}"></a>`).join('')}</div>` : ''}
    <a class="btn more" href="${more}">${list.length > 3 ? `ดูทั้งหมด ${nTh(list.length)} เรื่อง${icon('next')}` : 'เปิดในประวัติเหตุ'}</a>
    <button class="h-hide" data-hist-set="0">ซ่อนแผงนี้</button>
  </section>`;  hydrateImgs(box);
}

/* ── พื้นที่ / ข้อมูล ─────────────────────────────────────── */

function viewAreas() {
  main.innerHTML = `<div class="view">
    <p class="eyebrow">พื้นที่บิน</p>
    <h1 class="page-h">อันตรายประจำพื้นที่</h1>
    <div class="empty">${icon('pin')}
      <h2>ยังไม่มีข้อมูลพื้นที่</h2>
      <p>ยังไม่มีรายชื่อพื้นที่ พิกัด และอันตรายที่ต้องรู้ เพราะรอไฟล์จาก FSO คนเดิม เมื่อได้แล้วจะเพิ่มเข้ามาแบบเข้ารหัสเหมือนเคสของหน่วย</p>
      <p>ระหว่างนี้หาบทเรียนได้จากการเลือกเที่ยวบิน</p>
      <div class="acts"><a class="btn" href="#/filter">ไปเลือกเที่ยวบิน</a></div>
    </div>
  </div>`;
}

/* ── กฎระเบียบและคู่มือ ─────────────────────────────────── */
// ลิงก์ออกไปเอกสารต้นฉบับเท่านั้น ไม่เก็บสำเนา PDF ในแอป (DECISIONS.md หัวข้อ "กฎระเบียบและคู่มือ")

const REG_OLD = 2559; // ออกก่อน พ.ศ. 2559 = เก่ากว่า 10 ปี — ติดป้ายให้ตรวจว่ายังใช้อยู่ไหม
const rv = { g: '', q: '' };
function viewRegs() {
  main.innerHTML = `<div class="view regs">
    <p class="eyebrow">ข้อมูลอ้างอิง</p>
    <h1 class="page-h">กฎระเบียบและคู่มือ</h1>
    <p class="rg-lede">รวมลิงก์เอกสารด้านนิรภัย กดแล้วเปิดเอกสารต้นฉบับในแท็บใหม่</p>
    <div id="rg-body"><p class="rg-lede">กำลังโหลด…</p></div>
  </div>`;
  loadRegs().then((R) => {
    const box = $('#rg-body');
    if (!box) return; // ผู้ใช้ไปหน้าอื่นแล้ว
    const groups = [{ key: 'rpp', th: 'รปป.บน.2' }, ...R.groups];
    const rppNote = {
      locked: 'รายชื่อ รปป.บน.2 ล็อกอยู่ — ปลดล็อกข้อมูลของหน่วยก่อน',
      missing: 'ยังไม่มีรายชื่อ รปป.บน.2 ในเวอร์ชันนี้',
      unsupported: 'เบราว์เซอร์นี้เปิดรายชื่อ รปป.บน.2 ไม่ได้ — ลองใช้ Chrome หรือ Safari รุ่นใหม่',
    }[R.status];
    box.innerHTML = `<form class="h-q" role="search" onsubmit="return false"><label>${icon('search')}<input type="search" id="rg-q" placeholder="ค้นชื่อเอกสาร เลขที่ ปี หรือหน่วย" value="${esc(rv.q)}" autocomplete="off" aria-label="ค้นหาเอกสาร"></label></form>
      <div id="rg-res"></div>`;
    const res = $('#rg-res');
    const draw = () => {
      const { g, q } = rv;
      const qs = q.trim().toLowerCase();
      const pool = R.items.filter((x) => !qs || `${x.g === 'rpp' ? 'บน.2-' : ''}${x.id} ${x.t} ${x.unit || ''} ${x.note || ''} ${x.y || ''}`.toLowerCase().includes(qs));
      const cnt = (k) => pool.filter((x) => x.g === k).length;
      const list = pool.filter((x) => !g || x.g === g);
      const secs = groups.filter((x) => list.some((i) => i.g === x.key));
      res.innerHTML = `<div class="chips rg-chips">
          <button class="chip" data-rg="" aria-pressed="${!g}">${icon('check', 'ic ck')}ทั้งหมด <b class="cn">${nTh(pool.length)}</b></button>
          ${groups.map((x) => `<button class="chip${cnt(x.key) ? '' : ' zero'}" data-rg="${x.key}" aria-pressed="${g === x.key}">${icon(x.key === 'rpp' && rppNote ? 'lock' : 'check', 'ic ck')}${esc(x.th)} <b class="cn">${nTh(cnt(x.key))}</b></button>`).join('')}
        </div>
        ${rppNote && (!g || g === 'rpp') ? `<p class="rg-note">${dot('warn')}${rppNote}</p>` : ''}
        ${secs.map((x) => `<section class="rg-sec">
          <h2 class="sec-h">${esc(x.th)} <span>${nTh(list.filter((i) => i.g === x.key).length)} ฉบับ</span></h2>
          <ul class="rg-list">${list.filter((i) => i.g === x.key).map(regCard).join('')}</ul>
        </section>`).join('') || (g === 'rpp' && rppNote ? '' : `<div class="empty">${icon('search')}<h2>ไม่พบเอกสาร</h2><p>ลองค้นด้วยคำอื่น หรือเลือก "ทั้งหมด"</p></div>`)}
        <p class="rg-src">ระเบียบ ทอ. และคู่มือ: <a href="https://safety.rtaf.mi.th/standards" target="_blank" rel="noopener">safety.rtaf.mi.th/standards</a>${R.fetched ? ` · ดึงรายชื่อเมื่อ ${esc(fmtVer(R.fetched))}` : ''}${R.status === 'ok' ? ' · รปป.บน.2 เฉพาะหัวข้อ ๐๔ นิรภัยการบินและภาคพื้น' : ''}</p>`;
    };
    draw();
    res.addEventListener('click', (e) => {
      const c = e.target.closest('[data-rg]');
      if (!c) return;
      rv.g = rv.g === c.dataset.rg ? '' : c.dataset.rg;
      draw();
    });
    $('#rg-q').addEventListener('input', (e) => { rv.q = e.target.value; draw(); });
  }).catch((err) => console.warn('regs', err));
}
function regCard(x) {
  const tags = [
    x.y ? `<span>พ.ศ. ${x.y}</span>` : '',
    x.unit ? `<span>${esc(x.unit)}</span>` : '',
    x.y && x.y < REG_OLD ? '<span class="rg-old">เก่ากว่า 10 ปี</span>' : '',
    x.f ? `<span class="rg-f">${esc(x.f.toUpperCase())}</span>` : '',
  ].join('');
  return `<li><a class="rg-card" href="${esc(x.u)}" target="_blank" rel="noopener">
    <span class="rg-ic">${icon('doc')}</span>
    <span class="rg-b">${x.g === 'rpp' ? `<small class="rg-n">บน.2-${esc(x.id)}</small>` : ''}<span class="rg-t">${esc(x.t)}</span>${tags ? `<span class="rg-m">${tags}</span>` : ''}${x.note ? `<span class="rg-x">${esc(x.note)}</span>` : ''}</span>
    <span class="rg-go" title="เปิดเอกสาร">${icon('ext')}</span>
  </a></li>`;
}

// 2026-10-12 → 12 ต.ค. 69
function fmtVer(v) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || '');
  if (!m) return v || '—';
  return thDate(new Date(+m[1], +m[2] - 1, +m[3]));
}

function viewAbout() {
  const count = (src) => allCases().filter((c) => c.source === src).length;
  const st = state.unitStatus;
  const theme = LS.get('theme', 'night');
  const unitPanel = {
    missing: `<div class="status-line"><span class="tag">${dot('hollow')}ไม่มีข้อมูล</span>ยังไม่มีไฟล์ข้อมูลของหน่วยในเวอร์ชันนี้</div>`,
    locked: `<div class="status-line" style="margin-bottom:14px"><span class="tag">${dot('warn')}ล็อกอยู่</span>มีข้อมูลหน่วย รอปลดล็อก</div>
      <form class="field" id="unlock" autocomplete="off">
        <label for="pass">รหัสผ่านหน่วย</label>
        <div class="row"><input id="pass" type="password" maxlength="4" placeholder="4 ตัวอักษร" autocomplete="current-password" autocapitalize="off" spellcheck="false" required>
        <button class="btn btn-primary" style="flex:none" id="unlock-btn">ปลดล็อก</button></div>
        <p class="msg" id="msg" role="status" aria-live="polite"></p>
      </form>`,
    unlocked: `<div class="status-line" style="margin-bottom:14px"><span class="tag">${dot('ok')}ปลดล็อกแล้ว</span>
      เคสของหน่วย ${nTh(state.unit.length)} เคส · ข้อมูล ${esc(fmtVer(state.unitVersion))}</div>
      ${state.unitDev ? `<p class="status-line"><span class="tag draft">${dot('hollow')}ทดสอบ</span>โหลดจาก dev server บนเครื่องนี้ (ไม่เข้ารหัส) — ใช้ทดสอบเท่านั้น</p>`
        : '<button class="btn" data-act="forget">ล้างกุญแจจากเครื่องนี้</button>'}`,
  }[st];

  main.innerHTML = `<div class="view">
    <p class="eyebrow">ระบบ</p>
    <h1 class="page-h">ข้อมูลและการตั้งค่า</h1>

    <figure class="team-photo">
      <img src="img/team.webp" srcset="img/team-s.webp 838w, img/team.webp 1674w" sizes="(min-width: 1024px) 900px, 100vw"
        width="1674" height="939" alt="ทีมงานนิรภัยการบิน กองบิน 2: นภบ.บน.2 นภบ.ฝูง.201 นภบ.ฝูง.202 และ นภบ.ฝูง.203" decoding="async">
      <figcaption>ทีมงานนิรภัยการบิน กองบิน 2 · Safety · Standard · Teamwork · Mission</figcaption>
    </figure>

    <section class="panel">
      <h2>${icon('lock')} ข้อมูลของหน่วย (บน.2 / ทอ.)</h2>
      <p>เคสของหน่วยถูกเข้ารหัสไว้ ใส่รหัสผ่านครั้งเดียว เครื่องนี้จะจำกุญแจไว้และใช้ได้แม้ไม่มีสัญญาณ</p>
      ${unitPanel}
    </section>

    <section class="panel">
      <h2>ธีม</h2>
      <p>กลางคืน ถนอมสายตาก่อนบินกลางคืน · กลางวัน อ่านง่ายกลางแดดและบนจอโปรเจกเตอร์ในห้องบรีฟ · ตามเครื่อง ใช้ตามการตั้งค่าของโทรศัพท์</p>
      <div class="seg" role="group" aria-label="ธีม">
        ${[['night', 'กลางคืน'], ['day', 'กลางวัน'], ['auto', 'ตามเครื่อง']].map(([t, th]) =>
          `<button data-theme-set="${t}" aria-pressed="${theme === t}">${icon('check', 'ic ck')}${th}</button>`).join('')}
      </div>
    </section>

    <section class="panel">
      <h2>ฐานข้อมูล</h2>
      <div class="stats" style="margin-top:12px">
        <div><b>${count('W2')}</b><span>บน.2</span></div>
        <div><b>${count('RTAF')}</b><span>ทอ.</span></div>
        <div><b>${count('INTL')}</b><span>ต่างประเทศ</span></div>
      </div>
      <dl class="kv">
        <dt>เคสต่างประเทศ</dt><dd>${esc(fmtVer(state.intlVersion))}</dd>
        <dt>เคสของหน่วย</dt><dd>${st === 'unlocked' ? esc(fmtVer(state.unitVersion)) : '—'}</dd>
        <dt>ใช้แบบออฟไลน์</dt><dd>${navigator.serviceWorker?.controller ? 'พร้อม' : 'ยังไม่พร้อม — เปิดแอปตอนมีสัญญาณอีกครั้ง'}</dd>
      </dl>
    </section>

    <section class="panel">
      <h2>${icon('hist')} ประวัติเหตุ บน.2</h2>
      <p>แผง "เกิดใน บน.2 มาแล้ว" ท้ายหน้าเคส บอกว่าเรื่องแบบเดียวกันเคยเกิดในกองบินกี่ครั้ง จากแบบฟอร์ม MOR/HR และบันทึกการประชุมนิรภัย · ดูทั้งหมดได้ที่ <a href="#/history">ประวัติเหตุ</a></p>
      <div class="seg mini" role="group" aria-label="แผงประวัติเหตุในหน้าเคส">
        ${[['1', 'แสดง'], ['0', 'ซ่อน']].map(([v, th]) =>
          `<button data-hist-set="${v}" aria-pressed="${LS.get('histPanel', true) === (v === '1')}">${icon('check', 'ic ck')}${th}</button>`).join('')}
      </div>
    </section>

    <section class="panel">
      <h2>นโยบายข้อมูล</h2>
      <p style="margin:0">ทุกเคสไม่มีชื่อบุคคล · เคสของ บน.2 มีวันเวลา นามเรียกขาน หมายเลขเครื่อง และสถานที่เท่าที่บันทึกต้นฉบับมี ส่วนเคสของหน่วยอื่นใน ทอ. เก็บแค่ปี · เคส INTL สรุปจากรายงานสอบสวนที่เผยแพร่สาธารณะ กดลิงก์ในแต่ละเคสเพื่ออ่านต้นฉบับ · เคสที่มีป้าย "ร่าง" ยังไม่ผ่านการตรวจทาน</p>
      <p style="margin:10px 0 0">ภาพ ฮ. S-70i หน้าเข้าสู่ระบบ หน้าหลัก และหน้าทฤษฎี: ฝูงบิน 201 · ภาพแบบ ฮ.: ฝูงบิน 201 และ 202 · ปรับแสงสนธยาและทำวิดีโอด้วย AI (Higgsfield) จากภาพจริง เบลอห้องนักบินทุกภาพ</p>
    </section>
  </div>`;
}

async function onUnlock(e) {
  e.preventDefault();
  const pass = $('#pass').value.trim();
  const msg = $('#msg');
  const btn = $('#unlock-btn');
  if (!pass) return;
  btn.disabled = true;
  msg.className = 'msg';
  msg.textContent = 'กำลังตรวจรหัส…';
  try {
    await unlock(pass);
    msg.className = 'msg ok';
    msg.textContent = `ปลดล็อกแล้ว · ${nTh(state.unit.length)} เคส`;
    setTimeout(viewAbout, 700);
  } catch {
    msg.className = 'msg err';
    msg.textContent = 'รหัสไม่ถูกต้อง ตรวจตัวพิมพ์และภาษาของแป้นพิมพ์แล้วลองใหม่';
    btn.disabled = false;
    $('#pass').select();
  }
}

function viewNotFound() {
  main.innerHTML = `<div class="view"><div class="empty">${icon('info')}
    <h2>ไม่พบเคสนี้</h2><p>เคสอาจอยู่ในข้อมูลของหน่วยที่ยังไม่ได้ปลดล็อก หรือถูกนำออกจากฐานข้อมูลแล้ว</p>
    <a class="btn" href="#/">กลับหน้าแรก</a></div></div>`;
}

/* ── ธีม ──────────────────────────────────────────────────── */

const lightMq = matchMedia('(prefers-color-scheme: light)');
function applyTheme(pref) {
  const t = pref === 'auto' ? (lightMq.matches ? 'day' : 'night') : pref;
  document.documentElement.dataset.theme = t;
  $('meta[name="theme-color"]').content = t === 'day' ? '#f4efe4' : '#0b1120';
  syncThemeBtns();
  heroVideo();
}
lightMq.addEventListener('change', () => { if (LS.get('theme', 'night') === 'auto') applyTheme('auto'); });

/* ── สถานะ offline ────────────────────────────────────────── */

function updateNet() {
  const el = $('#net');
  const online = navigator.onLine;
  const sw = !!navigator.serviceWorker?.controller;
  const [cls, txt] = !online ? ['warn', 'ออฟไลน์'] : sw ? ['ok', 'พร้อมใช้ออฟไลน์'] : ['sky', 'ออนไลน์'];
  el.innerHTML = `<span class="lamp">${dot(cls)}${txt}</span><span class="ver">ข้อมูล ${esc(fmtVer(state.intlVersion))}</span>`;
}
addEventListener('online', updateNet);
addEventListener('offline', updateNet);

/* ── แถบเมนูจอคอมฯ ────────────────────────────────────────── */

// ตัวเลขข้างเมนู (ซ่อนบนมือถือ) · ประวัติเหตุแสดงเมื่อปลดล็อกแล้วเท่านั้น
function setBadges() {
  if (!wide.matches) return;
  const put = (k, n) => { const b = $(`[data-badge="${k}"]`); if (b) b.textContent = n ? n.toLocaleString('en-US') : ''; };
  put('intl', state.intl.length);
  import('./lessons.js').then(({ LESSONS }) => put('theory', LESSONS.length)).catch(() => {});
  loadRegs().then((r) => put('regs', r.items.length)).catch(() => {});
  if (state.unitStatus !== 'unlocked') { put('history', 0); return; }
  loadHistory().then((h) => put('history', h.status === 'ok' ? h.data.items.length : 0)).catch(() => {});
}
function syncThemeBtns() {
  const cur = document.documentElement.dataset.theme;
  for (const b of $$('.annun [data-theme-set]')) b.setAttribute('aria-pressed', String(b.dataset.themeSet === cur));
}
$('.annun').addEventListener('click', (e) => {
  if (e.target.closest('#dFull')) { toggleFull(); return; }
  const t = e.target.closest('[data-theme-set]');
  if (!t) return;
  LS.set('theme', t.dataset.themeSet);
  applyTheme(t.dataset.themeSet);
  for (const b of $$('main [data-theme-set]')) b.setAttribute('aria-pressed', String(b.dataset.themeSet === t.dataset.themeSet));
});
// หมุนจอ/ปรับหน้าต่างข้าม 1024px ขณะอยู่หน้าหลัก → วาดใหม่ให้ตรงขนาด
wide.addEventListener('change', () => { if (!location.hash.replace(/^#\/?/, '')) route(); else setBadges(); });

/* ── Router ───────────────────────────────────────────────── */

const scrollMemo = {};
let lastPath = null;

const SUB_T = { areas: 'อันตรายประจำพื้นที่', airmanship: 'Wing 2 Airmanship', theory: 'ทฤษฎีนิรภัย', regs: 'กฎระเบียบและคู่มือ', pap: 'แผน PAP' };
let navCount = 0; // จำนวนหน้าที่เปิดในแอปรอบนี้ — ปุ่มย้อนกลับของ .m-sub ใช้ history.back() ได้เมื่อ > 1
// toggle ไม่ bubble ต้องจับแบบ capture · จำว่าเปิดแถบผังประเภทรายงานไว้หรือไม่
document.addEventListener('toggle', (e) => { if (e.target.matches?.('[data-hflow]')) LS.set('histFlow', e.target.open); }, true);
document.addEventListener('click', (e) => {
  if (!e.target.closest('[data-sub-back]')) return;
  if (navCount > 1) history.back(); else location.replace('#/');
});

function route() {
  const path = location.hash.replace(/^#/, '').split('?')[0] || '/';
  const parts = path.split('/').filter(Boolean);
  const page = parts[0] || '';
  const arg = parts[1] ? decodeURIComponent(parts[1]) : '';

  // อยู่หน้าภาพรวมแล้ว เปลี่ยนแค่ตัวกรองใน # (ย้อนกลับ/พิมพ์เอง) → ให้หน้านั้นอ่านค่าใหม่เอง
  if (page === 'dashboard' && lastPath === path && OV?.host.isConnected) { OV.inst?.fromHash(); return; }
  if (OV) { OV.inst?.destroy(); OV = null; }
  document.body.classList.toggle('ov', page === 'dashboard');

  if (lastPath) scrollMemo[lastPath] = scrollY;
  const briefing = page === 'brief';
  const lesson = page === 'theory' && !!arg; // สไลด์บทเรียนเต็มจอ ซ่อนหัวแอปและแถบแท็บเหมือนโหมดบรีฟ
  document.body.classList.toggle('briefing', briefing);
  document.body.classList.toggle('lesson', lesson);
  if (!briefing) {
    briefFromList = false;
    if (document.fullscreenElement && !fullKeep) document.exitFullscreen().catch(() => {});
  }
  if (!briefing && !lesson) releaseAwake();

  if (page === 'filter' || page === 'results') state.from = 'results';
  // เปิดการ์ดจากหน้าประวัติเหตุ → ปุ่มย้อนกลับของหน้าเคสกลับไปหน้านั้น
  // (ยกเว้นกำลังย้อนกลับไปเคสที่เปิดแผงประวัติมา — เก็บค่าเดิมของเคสนั้นไว้)
  if (page === 'case' && lastPath?.startsWith('/history') && '#' + path !== state.hv.ret) state.caseBack = '#' + lastPath;
  else if (!['case', 'brief', 'history'].includes(page)) state.caseBack = '';

  switch (page) {
    case 'filter': viewFilter(); break;
    case 'results': viewResults(); break;
    case 'case': viewCase(arg); break;
    case 'brief': drawBrief(arg, parts[2]); break;
    case 'dashboard': viewOverview(); break;
    case 'areas': viewAreas(); break;
    case 'about': viewAbout(); break;
    case 'regs': viewRegs(); break;
    case 'airmanship': AIR.render(main, { esc, icon }); break;
    case 'pap': PAP.render(main, { esc, icon, loadPap, hydrateImgs }, arg); break;
    case 'theory': viewTheory(arg, parts[2], lastPath); break;
    case 'history': viewHist(arg, parts[2], lastPath); break;
    default: viewHome();
  }

  const tab = page === 'case' && state.caseBack ? 'history'
    : ['filter', 'results', 'case', 'brief'].includes(page) ? 'brief' : page || 'home';
  for (const a of $$('.tabbar a')) {
    if (a.dataset.tab === tab) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  }
  // จอแคบ: หน้าที่ไม่มีในแถบล่าง ใช้หัวเรื่อง + ปุ่มย้อนกลับแทน (body.sub · desk.css ไม่ใช้)
  const subT = SUB_T[page] && !lesson ? SUB_T[page] : '';
  document.body.classList.toggle('sub', !!subT);
  $('.m-sub-t').textContent = subT;
  navCount++;
  setBadges();
  const keep = ['', 'filter', 'results', 'dashboard', 'theory', 'history', 'regs', 'airmanship', 'pap'].includes(page) && !lesson && scrollMemo[path] != null;
  scrollTo(0, keep ? scrollMemo[path] : 0);
  // หน้าภาพรวมวาดหลังโหลด CSS เสร็จ — คืนตำแหน่งเลื่อนอีกครั้งเมื่อเนื้อหามาแล้ว
  if (keep && page === 'dashboard') { const y = scrollMemo[path]; OV.ready.then(() => scrollTo(0, y)); }
  if (lastPath !== null && !briefing && !lesson) main.focus({ preventScroll: true });
  lastPath = path;
}

main.addEventListener('click', (e) => {
  const t = e.target.closest('button, a');
  if (!t) return;
  if (t.dataset.step) { scrollToStep(t.dataset.step, false); return; }
  if (t.dataset.k) { toggleSel(t.dataset.k, t.dataset.v); return; }
  if (t.dataset.pick) { togglePick(t.dataset.pick); return; }
  if (t.dataset.rtab) { state.rtab = t.dataset.rtab; state.open = {}; viewResults(); return; }
  if (t.dataset.mode) { setProjMode(t.dataset.mode); return; }
  if (t.id === 'go') {
    if (t.dataset.miss) scrollToStep(t.dataset.miss, true);
    else location.hash = '#/results';
    return;
  }
  if (t.dataset.tick != null) { toggleTick(decodeURIComponent(location.hash.split('/')[2]), Number(t.dataset.tick)); return; }
  if (t.id === 'present') { present(); return; }
  if (t.dataset.go) { briefGo(Number(t.dataset.go)); return; }
  if (t.dataset.themeSet) {
    LS.set('theme', t.dataset.themeSet);
    applyTheme(t.dataset.themeSet);
    for (const b of $$('main [data-theme-set]')) b.setAttribute('aria-pressed', String(b === t));
    return;
  }
  // ประวัติเหตุ: data-hb = ลิงก์ที่ต้องจำหน้าที่มา เพื่อให้ปุ่มย้อนกลับในหน้ารายละเอียดกลับมาถูกที่
  if (t.hasAttribute('data-hb')) state.hv.back = location.hash;
  if (t.dataset.hy) {
    state.hv.y = +t.dataset.hy; state.hv.src = null; redrawHist();
    if (!wide.matches) $('#hlist')?.scrollIntoView({ behavior: reduced.matches ? 'auto' : 'smooth', block: 'start' });
    return;
  }
  if (t.hasAttribute('data-himg')) { state.hv.img = !state.hv.img; redrawHist(); return; }
  if (t.dataset.hnt != null) { state.hv.nt = t.dataset.hnt ? t.dataset.hnt : state.hv.nt ? null : 'a'; redrawHist(); return; }
  if (t.dataset.hsrc) { state.hv.src = state.hv.src === t.dataset.hsrc ? null : t.dataset.hsrc; redrawHist(); return; }
  // เปลี่ยนฝูงแล้วคงช่องที่เลือกไว้ ถ้าฝูงใหม่ไม่มีเรื่องในช่องนั้น hvTopics ล้างให้เอง
  if (t.dataset.hsq) { state.hv.sq = t.dataset.hsq; redrawHist(); return; }
  if (t.dataset.htp != null) {
    const tp = +t.dataset.htp, fy = t.dataset.hfy ? +t.dataset.hfy : null;
    const c = state.hv.cell;
    state.hv.cell = c && c.tp === tp && c.fy === fy ? null : { tp, fy };
    redrawHist();
    if (state.hv.cell && !wide.matches) $('#hlist')?.scrollIntoView({ behavior: reduced.matches ? 'auto' : 'smooth', block: 'start' });
    return;
  }
  if (t.dataset.hms) {
    state.hv.ms = state.hv.ms === t.dataset.hms ? null : t.dataset.hms;
    redrawHist();
    if (state.hv.ms && !wide.matches) $('#hlist')?.scrollIntoView({ behavior: reduced.matches ? 'auto' : 'smooth', block: 'start' });
    return;
  }
  if (t.dataset.hhs) {
    state.hv.hs = state.hv.hs === t.dataset.hhs ? null : t.dataset.hhs;
    redrawHist();
    if (state.hv.hs && !wide.matches) $('#hlist')?.scrollIntoView({ behavior: reduced.matches ? 'auto' : 'smooth', block: 'start' });
    return;
  }
  if (t.dataset.hmode) { LS.set('histMode', t.dataset.hmode); redrawHist(); return; }
  if (t.dataset.horig) { state.hv.orig = state.hv.orig === t.dataset.horig ? null : t.dataset.horig; redrawHist(); return; }
  if (t.dataset.histSet) {
    LS.set('histPanel', t.dataset.histSet === '1');
    const p = t.closest('#histp');
    if (p) {
      // ย้ายโฟกัสมาที่ข้อความแทนปุ่มที่หายไป ผู้ใช้โปรแกรมอ่านจอจะได้ไม่หลุดไปต้นหน้า
      p.innerHTML = '<p class="note" tabindex="-1">ซ่อนแผงแล้ว · เปิดอีกครั้งได้ที่หน้า <a href="#/about">ข้อมูล</a></p>';
      p.firstChild.focus({ preventScroll: true });
      return;
    }
    for (const b of $$('[data-hist-set]')) b.setAttribute('aria-pressed', String(b.dataset.histSet === t.dataset.histSet));
    return;
  }
  if (t.hasAttribute('data-replace')) { e.preventDefault(); location.replace(t.getAttribute('href')); return; }
  switch (t.dataset.act) {
    case 'grp': state.open[t.dataset.g] = !state.open[t.dataset.g]; viewResults(); break;
    case 'factors': {
      const f = $('#fac');
      f.hidden = !f.hidden;
      t.setAttribute('aria-expanded', String(!f.hidden));
      break;
    }
    case 'theme': {
      const next = document.documentElement.dataset.theme === 'day' ? 'night' : 'day';
      LS.set('theme', next);
      applyTheme(next);
      redrawBrief();
      break;
    }
    case 'full': toggleFull(); break;
    case 'exit': e.preventDefault(); exitBrief(); break;
    case 'unlock':
      e.preventDefault();
      if (state.unitStatus !== 'locked') break;
      if (t.dataset.v) wantSrc = t.dataset.v;
      showGate();
      break;
    case 'forget':
      LS.del('key');
      SS.del('key');
      state.unit = [];
      state.hist = null;
      state.unitStatus = unitEnc ? 'locked' : 'missing';
      if (state.sel.src === 'TH') { state.sel.src = 'ALL'; LS.set('sel', state.sel); }
      // ล้างแล้วเหมือนเครื่องใหม่: กลับหน้าหลักแล้วถามรหัสทันที
      if (state.unitStatus === 'locked') { location.hash = '#/'; showGate(); } else viewAbout();
      break;
  }
});
main.addEventListener('submit', (e) => { if (e.target.id === 'unlock') onUnlock(e); });
addEventListener('hashchange', route);

/* ── Boot ─────────────────────────────────────────────────── */

async function boot() {
  applyTheme(LS.get('theme', 'night'));
  loadHero().catch((err) => console.warn('hero', err));
  try {
    const [tax, intl] = await Promise.all([loadJSON('data/taxonomy.json'), loadJSON('data/intl.json')]);
    state.tax = tax;
    state.intl = intl.cases;
    state.intlVersion = intl.version;
  } catch (err) {
    main.innerHTML = `<div class="empty">${icon('info')}<h2>โหลดข้อมูลไม่สำเร็จ</h2>
      <p>เปิดแอปครั้งแรกต้องมีสัญญาณอินเทอร์เน็ต หลังจากนั้นใช้แบบ offline ได้</p>
      <button class="btn" onclick="location.reload()">ลองใหม่</button></div>`;
    console.error(err);
    return;
  }
  // ตัดค่าที่ไม่อยู่ใน taxonomy แล้วออกจากค่าที่จำไว้
  const valid = (k) => new Set(state.tax[k].filter(inService).map((x) => x.code));
  for (const k of ['environment', 'phase', 'hfacs']) state.sel[k] = state.sel[k].filter((v) => valid(k).has(v));
  for (const k of ['aircraft', 'mission']) if (state.sel[k] && !valid(k).has(state.sel[k])) state.sel[k] = null;
  if (!SRC_SET[state.sel.src]) state.sel.src = 'ALL';

  await loadUnit();
  // ยังไม่ได้ปลดล็อก เลือก "กองทัพอากาศไทย" ไว้ไม่ได้ (จะไม่มีเคสเลย)
  if (state.sel.src === 'TH' && state.unitStatus !== 'unlocked') state.sel.src = 'ALL';
  updateNet();
  // ลงทะเบียน SW ก่อนหน้าใส่รหัส — ไม่งั้นเครื่องที่ค้างหน้าใส่รหัสจะไม่ตรวจเวอร์ชันใหม่และเห็นไฟล์เก่า (เช่นชื่อแอปเดิม)
  let stale = false;
  if ('serviceWorker' in navigator) {
    // เวอร์ชันใหม่เข้ามาแทนตัวเดิม (sw.js เรียก skipWaiting + claim) → โหลดหน้าใหม่ 1 ครั้งให้เห็นของใหม่เลย
    // ไม่งั้นหน้าที่เปิดอยู่ใช้ไฟล์เก่าต่อจนปิดแอป · เปิดครั้งแรก (ยังไม่มี SW) ไม่ต้องโหลดซ้ำ
    // กุญแจอยู่ใน localStorage/sessionStorage จึงไม่ต้องใส่รหัสใหม่หลังโหลด · ระหว่างใส่รหัสรอให้เสร็จก่อนค่อยโหลด
    const hadSW = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.register('sw.js').then((reg) => {
      // แท็บที่เปิดค้างไว้นาน: กลับมาที่แท็บเมื่อไรให้ตรวจเวอร์ชันใหม่
      document.addEventListener('visibilitychange', () => { if (!document.hidden) reg.update().catch(() => {}); });
    }).catch((err) => console.warn('SW', err));
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      updateNet();
      if (!hadSW) return;
      if (document.querySelector('.gate')) stale = true;
      else location.reload();
    });
  }
  // ยังล็อก: หลังใส่รหัสให้เข้าหน้าหลักเสมอ ไม่ว่าจะเปิดลิงก์หน้าไหนมา
  if (state.unitStatus === 'locked' && location.hash && location.hash !== '#/') history.replaceState(null, '', '#/');
  route();
  // เครื่องที่ยังไม่มีกุญแจต้องใส่รหัสก่อนเข้าหน้าหลัก ไม่มีทางข้าม · เครื่องที่จำกุญแจไว้เข้าได้เลย
  if (state.unitStatus === 'locked') await showGate();
  if (stale) location.reload();
}

boot();
