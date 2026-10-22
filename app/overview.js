/* หน้าภาพรวมสถิติ Antigravity Edition (Tableau Public "Viz of the Day" #VOTD Inspired)
   ต่อยอดจาก overview.js ของ Claude · ทุกกราฟเป็น SVG/HTML ที่คำนวณสดจาก data/intl.json (281 เคส)
   เพิ่ม:
   - Story Lenses (มุมมองวิเคราะห์สำเร็จรูป 1-Click แบบ Tableau Story Points)
   - Live Telemetry Executive Narrative (ประโยคสรุปอัจฉริยะพร้อม Inline BANs ที่เขียนใหม่ตามตัวกรอง)
   - ปุ่ม "สุ่มเคสบรีฟ 1 นาที" (Pre-flight Brief Roulette) + ช่องค้นหาคำสำคัญสด (Live Keyword Search)
   - ตัวกรอง "เฉพาะ 5 แบบ บน.2" (WING2 Fleet Filter)
   - กราฟ 01A: เส้นโปรไฟล์การบินตามความสูง (Flight Profile Elevation Curve & Low-Altitude Risk Envelope)
   - กราฟ 02B: แผนภาพแอลลูเวียลความเสี่ยง 4 มิติ (Multi-Stage Alluvial: สภาพแวดล้อม → ช่วงบิน → HFACS → ผลลัพธ์)
     แถบไหลระบายสีตามชั้น HFACS หลักของเคส (ไล่ระดับฟ้าทางเดียว A เด่นสุด) ช่วงสุดท้ายไล่สีเข้าแดง/ส้มของผลลัพธ์
   - กราฟ 04B: ลายเซ็นภัยคุกคามการบินซ้ำซาก 8 หมวด × 46 ปี (Operational Hazard DNA Barcode Matrix)
   - กราฟ 05: การ์ดอากาศยานพร้อมภาพร่าง Blueprint SVG + แถบ DNA ช่วงการบิน
   - รายการเคสแสดงตัวอย่าง "คำถามบรีฟ" ทันที + ปุ่มคัดลอกประเด็นบรีฟในลิ้นชักเคส */

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
const f = (n) => String(Math.round(n * 10) / 10);
const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const MON = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const ICONS = {
  back: '<path d="M15 18l-6-6 6-6"/>',
  next: '<path d="M9 18l6-6-6-6"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  x: '<path d="M18 6L6 18M6 6l12 12"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/>',
  play: '<path d="M8 5.5v13l10.5-6.5z"/>',
  pause: '<path d="M8.5 5.5v13M15.5 5.5v13"/>',
  down: '<path d="M6 9l6 6 6-6"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L20 20"/>',
  spark: '<path d="M12 3l2.2 5.8L20 11l-5.8 2.2L12 19l-2.2-5.8L4 11l5.8-2.2z"/>',
  dice: '<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="8.5" cy="8.5" r="1.2" fill="currentColor"/><circle cx="15.5" cy="8.5" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/><circle cx="8.5" cy="15.5" r="1.2" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.2" fill="currentColor"/>',
  copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4a1 1 0 01-1-1V4a1 1 0 011-1h10a1 1 0 011 1v1"/>',
};
const SPRITE = `<svg width="0" height="0" style="position:absolute" aria-hidden="true">${Object.entries(ICONS).map(([k, v]) => `<symbol id="i-${k}" viewBox="0 0 24 24">${v}</symbol>`).join('')}</svg>`;
const ic = (k, cls = '') => `<svg class="ic ${cls}" aria-hidden="true"><use href="#i-${k}"/></svg>`;
const PH_EN = { PREFLIGHT: 'Preflight', TAXI: 'Taxi', TAKEOFF: 'Takeoff', ENROUTE: 'En route', HOVER: 'Hover', AUTOROTATION: 'Autorotation', APPROACH: 'Approach', LANDING: 'Landing', SHUTDOWN: 'Shutdown', GROUND: 'Ground' };
const ENV_EN = { DAY_VMC: 'Day VMC', NIGHT: 'Night', NVG: 'NVG', RAIN_TS: 'Rain/TS', LOW_VIS: 'Low vis', HAZE: 'Haze', BROWNOUT: 'Brownout', WIND: 'Wind', HOT_HIGH: 'Hot & high', OVERWATER: 'Overwater', MOUNTAIN: 'Mountain' };
const en = (s) => (s ? ` <small class="en">${s}</small>` : '');
let SHEET = null;
const sheet = async () => {
  if (SHEET) return SHEET;
  const css = await fetch('overview.css').then((r) => r.text());
  SHEET = new CSSStyleSheet();
  SHEET.replaceSync(css);
  return SHEET;
};

/* ลายเซ็นภัยคุกคามการบิน 8 หมวดหลัก (คำนวณจากคำสำคัญในชื่อ สรุป ปัจจัย และแท็กสภาพแวดล้อม/ภารกิจ) */
const HAZARDS = [
  {
    k: 'pwr',
    th: 'เครื่องยนต์ / ระบบส่งกำลัง / ไฮดรอลิก',
    en: 'Powerplant, MGB & Systems',
    rx: /เครื่องยนต์|กระปุกเฟือง|เฟืองหลัก|ไฮดรอลิก|เพลาส่งกำลัง|เชื้อเพลิง|แรงดันน้ำมัน|ไฟเตือน|MGB|engine|gearbox|hydraulic|transmission|fuel|chip|governor|compressor|turbine/i,
  },
  {
    k: 'sling',
    th: 'ภารกิจสลิง / รอกกู้ภัย / สัมภาระภายนอก',
    en: 'Sling Load, Hoist & External Cargo',
    rx: /สลิง|รอกกู้ภัย|หิ้วของ|สัมภาระภายนอก|ตะขอ|sling|hoist|external ?load|cargo ?hook|winch/i,
    extra: (c) => (c.mission || []).includes('SLING'),
  },
  {
    k: 'wx',
    th: 'หลงสภาพอากาศ / เมฆ / หมอก / ลมกระโชก',
    en: 'IIMC, Low Vis & Weather',
    rx: /ทัศนวิสัย|เข้าเมฆ|ในเมฆ|หมอก|พายุ|ลมแรง|ลมกระโชก|หลงสภาพอากาศ|IMC|whiteout|downdraft|turbulence/i,
  },
  {
    k: 'wire',
    th: 'ชนสายไฟ / เสา / ต้นไม้ / สิ่งกีดขวาง',
    en: 'Wire Strike & Obstacle Collision',
    rx: /สายไฟ|สายเคเบิล|สายสื่อสาร|เสาไฟ|สิ่งกีดขวาง|ชนต้นไม้|เกี่ยวต้นไม้|wire|cable|power ?line|obstacle/i,
  },
  {
    k: 'yaw',
    th: 'ใบพัดหาง / สูญเสียการทรงตัว (LTE / Yaw)',
    en: 'Tail Rotor & Loss of Yaw Control',
    rx: /ใบพัดหาง|หมุนคว้าง|เสียการควบคุมทิศทาง|tail ?rotor|LTE|yaw|pedal|fenestron/i,
  },
  {
    k: 'hl',
    th: 'ลงกระแทก / พลิกตะแคง (Dynamic Rollover)',
    en: 'Hard Landing & Dynamic Rollover',
    rx: /ลงกระแทก|กระแทกพื้น|พลิกตะแคง|พลิกคว่ำ|ไถล|hard ?landing|rollover|dynamic ?rollover|heavy ?landing|ground ?resonance/i,
  },
  {
    k: 'spatial',
    th: 'หลงท่าทาง / กลางคืน / NVG / ฝุ่นตลบ',
    en: 'Spatial Disorientation, Night & Brownout',
    rx: /หลงท่าทาง|กล้องมองกลางคืน|ฝุ่นตลบ|ทรายตลบ|NVG|brownout|spatial|disorient|illusion/i,
    extra: (c) => c.environment.includes('NVG') || c.environment.includes('BROWNOUT') || c.environment.includes('NIGHT'),
  },
  {
    k: 'auto',
    th: 'ร่อนลงฉุกเฉิน (Autorotation)',
    en: 'Autorotation & Forced Landing',
    rx: /ร่อนลงฉุกเฉิน|autorotat/i,
    extra: (c) => c.phase.includes('AUTOROTATION'),
  },
];
const HZ_MAP = Object.fromEntries(HAZARDS.map((h) => [h.k, h]));

/* ภาพร่าง Blueprint SVG ประจำแบบ ฮ. กองบิน 2 */
const AC_SVG = {
  H225M: '<svg viewBox="0 0 120 36" aria-hidden="true"><path d="M12 20h66l18-6 10 3-8 6-14 4H34l-14-3-8-4z" fill-opacity=".22" stroke-width="1.4"/><path d="M22 10h74M59 10v10M98 11l8 8m0-8l-8 8M40 27h28" fill="none" stroke-width="1.5" stroke-linecap="round"/></svg>',
  B412EP: '<svg viewBox="0 0 120 36" aria-hidden="true"><path d="M16 21h58l22-5 8 2-6 5-18 4H32l-10-3-6-3z" fill-opacity=".22" stroke-width="1.4"/><path d="M24 11h68M58 11v10M96 12l6 7m0-7l-6 7M36 28h32M34 26v2M64 26v2" fill="none" stroke-width="1.5" stroke-linecap="round"/></svg>',
  'S-92': '<svg viewBox="0 0 120 36" aria-hidden="true"><path d="M10 19h68l20-7 10 2-7 8-15 5H28l-12-3-6-5z" fill-opacity=".22" stroke-width="1.4"/><path d="M20 9h78M59 9v10M100 10l7 7m0-7l-7 7M34 28h36" fill="none" stroke-width="1.5" stroke-linecap="round"/></svg>',
  H135: '<svg viewBox="0 0 120 36" aria-hidden="true"><path d="M22 20h50l22-3 8 2-6 4-18 3H36l-10-3-4-3z" fill-opacity=".22" stroke-width="1.4"/><path d="M28 11h60M58 11v9M96 16a3.5 3.5 0 100 .1M38 27h28M42 25v2M62 25v2" fill="none" stroke-width="1.5" stroke-linecap="round"/></svg>',
  'S-70I': '<svg viewBox="0 0 120 36" aria-hidden="true"><path d="M12 20h64l22-5 9 2-7 6-18 3H30l-12-3-6-3z" fill-opacity=".22" stroke-width="1.4"/><path d="M20 10h74M57 10v10M98 12l7 7m0-7l-7 7M34 27h30" fill="none" stroke-width="1.5" stroke-linecap="round"/></svg>',
};

export async function mountOverview(host, { state }) {
  const tax = state.tax;
  const hfCat = Object.fromEntries(tax.hfacs.map((h) => [h.code, h.category]));
  const hfLabel = Object.fromEntries(tax.hfacs.map((h) => [h.code, h.label]));
  const W = { version: state.intlVersion, tax: { hfCat, hfLabel } };
  const C = state.intl.map((c) => ({ ...c }));
  const years = C.map((c) => c.year);
  const TH_NW = /(ลูกเรือ|นักบิน|ใบพัด|เชื้อเพลิง|เฮลิคอปเตอร์|ภูเขา)/g;
  const AG = {
    'JTSB Japan': { code: 'JTSB', th: 'ญี่ปุ่น', name: 'Japan Transport Safety Board' },
    'BEA-É France': { code: 'BEA-É', th: 'ฝรั่งเศส', name: 'BEA-État (อากาศยานของรัฐ)' },
    'NTSB USA': { code: 'NTSB', th: 'สหรัฐฯ', name: 'National Transportation Safety Board' },
    'RCAF Flight Safety': { code: 'RCAF', th: 'แคนาดา', name: 'RCAF Directorate of Flight Safety' },
    'AAIB UK': { code: 'AAIB', th: 'สหราชอาณาจักร', name: 'Air Accidents Investigation Branch' },
    'AAIC Thailand': { code: 'AAIC', th: 'ไทย', name: 'Aircraft Accident Investigation Committee' },
    'AAIU Ireland': { code: 'AAIU', th: 'ไอร์แลนด์', name: 'Air Accident Investigation Unit' },
    'TSB Canada': { code: 'TSB', th: 'แคนาดา', name: 'Transportation Safety Board' },
    'NSIA Norway': { code: 'NSIA', th: 'นอร์เวย์', name: 'Norwegian Safety Investigation Authority' },
    'UK MOD Service Inquiry': { code: 'MOD-SI', th: 'สหราชอาณาจักร', name: 'UK MOD Service Inquiry' },
    'UK MOD Board of Inquiry': { code: 'MOD-SI', th: 'สหราชอาณาจักร', name: 'UK MOD Board of Inquiry' },
    'MOD Japan': { code: 'JMOD', th: 'ญี่ปุ่น', name: 'กระทรวงกลาโหมญี่ปุ่น' },
    'AAIB India': { code: 'AAIB-I', th: 'อินเดีย', name: 'Aircraft Accident Investigation Bureau' },
    'SHK Sweden': { code: 'SHK', th: 'สวีเดน', name: 'Swedish Accident Investigation Authority' },
  };
  const U = {
    PH: { PREFLIGHT: 'ตรวจก่อนบิน', TAXI: 'ขับเคลื่อน', TAKEOFF: 'วิ่งขึ้น', ENROUTE: 'บินเดินทาง', HOVER: 'ลอยตัว', AUTOROTATION: 'ร่อนลงฉุกเฉิน', APPROACH: 'เข้าสู่สนาม', LANDING: 'ลงสนาม', SHUTDOWN: 'หลังบิน', GROUND: 'ภาคพื้น' },
    ENV: { DAY_VMC: 'กลางวัน อากาศดี', NIGHT: 'กลางคืน', NVG: 'NVG', RAIN_TS: 'ฝน / พายุ', LOW_VIS: 'ทัศนวิสัยต่ำ', HAZE: 'หมอกควัน', BROWNOUT: 'Brownout', WIND: 'ลมแรง', HOT_HIGH: 'ร้อนจัด / high DA', OVERWATER: 'เหนือน้ำ', MOUNTAIN: 'ภูเขา', ALL: 'ทุกสภาพ' },
    HF_TH: { AD000: 'ฝ่าฝืนโดยรู้ตัว', AE100: 'พลาดที่ทักษะการปฏิบัติ', AE200: 'พลาดที่การตัดสินใจ', PC100: 'การรับรู้และความตื่นตัว', PC200: 'สภาพจิตใจ', PC300: 'ร่างกายไม่พร้อม', PE100: 'สภาพแวดล้อมทางกายภาพ', PE200: 'สภาพแวดล้อมทางเทคโนโลยี', PP100: 'การประสานงานและสื่อสารในทีม', PT100: 'สภาพการฝึก', SC100: 'วัฒนธรรมความปลอดภัยของหน่วยไม่ได้ผล', SD000: 'ผู้กำกับดูแลฝ่าฝืนโดยรู้ตัว', SI000: 'การกำกับดูแลไม่ได้ผล', SP000: 'การวางแผนและประสานงานไม่ได้ผล', OC000: 'บรรยากาศและวัฒนธรรมองค์กร', OP000: 'นโยบาย ระเบียบ กระบวนการ', OR000: 'การสนับสนุนทรัพยากร', OT000: 'หลักสูตรการฝึก' },
    TIERS: [
      { k: 'O', th: 'อิทธิพลขององค์กร', en: 'Organizational Influences', cats: ['OC000', 'OP000', 'OR000', 'OT000'] },
      { k: 'S', th: 'การกำกับดูแล', en: 'Supervision', cats: ['SC100', 'SD000', 'SI000', 'SP000'] },
      { k: 'P', th: 'สภาพก่อนเกิดเหตุ', en: 'Preconditions', cats: ['PC100', 'PC200', 'PC300', 'PE100', 'PE200', 'PP100', 'PT100'] },
      { k: 'A', th: 'การกระทำที่ไม่ปลอดภัย', en: 'Unsafe Acts', cats: ['AD000', 'AE100', 'AE200'] },
    ],
    WING: ['H225M', 'B412EP', 'S-92', 'H135', 'S-70I'],
    AC: { 'H225M': 'H225M', 'B412EP': 'Bell 412EP', 'S-92': 'S-92', 'H135': 'H135', 'S-70I': 'S-70i', WING2: 'เฉพาะ 5 แบบ บน.2', ALL: 'ทุกแบบ' },
    AC_L: Object.fromEntries(tax.aircraft.map((a) => [a.code, a.label])),
    AC_SQ: Object.fromEntries(tax.aircraft.map((a) => [a.code, a.squadron])),
    MIS: { ...Object.fromEntries(tax.mission.map((m) => [m.code, m.label])), ALL: 'ทุกภารกิจ' },
    TYPE: { accident: 'อุบัติเหตุ', incident: 'อุบัติการณ์' },
    hfCats: (c) => [...new Set(c.hfacs.map((h) => hfCat[h]).filter(Boolean))],
    ag: (c) => AG[c.ref_label] || { code: c.ref_label, th: '—', name: c.ref_label },
    count: (arr, fn) => { const m = new Map(); for (const x of arr) for (const k of [].concat(fn(x))) m.set(k, (m.get(k) || 0) + 1); return m; },
    Y0: Math.min(...years),
    Y1: Math.max(...years),
    fmt: (n) => Number(n).toLocaleString('en-US'),
    sp: (t) => (/^[A-Za-z0-9]/.test(t) ? ` ${t}` : t),
    reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
    isoTh: (s) => { const [y, m, d] = s.split('-').map(Number); return `${d} ${MON[m - 1]} ${String((y + 543) % 100).padStart(2, '0')}`; },
    tx: (s) => esc(s).replace(TH_NW, '<span class="nw">$1</span>'),
    rng: (seed) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; },
    hash: (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; },
  };

  /* shadow root ของหน้า (R) + host ของลิ้นชัก/คำอธิบายเมาส์ (D) */
  const css = await sheet();
  const R = host.shadowRoot || host.attachShadow({ mode: 'open' });
  R.adoptedStyleSheets = [css];
  const dhost = document.createElement('div');
  dhost.className = 'ov-layer';
  dhost.style.cssText = 'position:relative;z-index:90';
  const D = dhost.attachShadow({ mode: 'open' });
  D.adoptedStyleSheets = [css];
  D.innerHTML = `${SPRITE}<div class="scrim" id="scrim"></div><aside class="dr" id="dr" role="dialog" aria-modal="true" aria-labelledby="dr-t" inert>`
    + `<div class="dr-top"><button type="button" id="dr-x" aria-label="ปิดรายละเอียดเคส">${ic('x', '')}</button>`
    + `<button type="button" id="dr-copy" title="คัดลอกคำถามและประเด็นบรีฟไปใช้">${ic('copy', 'sm')}<span style="margin-left:6px;font-size:13px">คัดลอกบรีฟ</span></button>`
    + `<span class="dr-k" id="dr-k"></span>`
    + `<button type="button" id="dr-p" aria-label="เคสก่อนหน้า">${ic('back', '')}</button><button type="button" id="dr-n" aria-label="เคสถัดไป">${ic('next', '')}</button></div>`
    + '<div class="dr-b" id="dr-b"></div></aside><div class="tip" role="tooltip" hidden></div>';
  document.body.append(dhost);
  const $ = (s, r = R) => r.querySelector(s);
  const $$ = (s, r = R) => [...r.querySelectorAll(s)];

  const N = C.length;
  const PH = U.PH, ENV = U.ENV, HF = U.HF_TH;
  const ORDER = ['PREFLIGHT', 'TAXI', 'TAKEOFF', 'ENROUTE', 'HOVER', 'AUTOROTATION', 'APPROACH', 'LANDING', 'SHUTDOWN', 'GROUND'];
  const TK = ['O', 'S', 'P', 'A'];
  const TIER = Object.fromEntries(U.TIERS.map((t) => [t.k, t]));
  const TYPES = ['accident', 'incident'];
  const tcls = (t) => (t === 'accident' ? 'acc' : 'inc');
  /* 02B: ลำดับชั้น HFACS หลักของเคส (N = ไม่ได้ลงรหัส) และชื่อที่แสดง */
  const SK_T = ['A', 'P', 'S', 'O', 'N'];
  const skTier = (t) => (t === 'N' ? 'ไม่ระบุรหัส' : t === 'A' ? 'A · การกระทำไม่ปลอดภัย' : `${t} · ${TIER[t].th}`);
  const polar = (cx, cy, deg, r) => { const a = ((deg - 90) * Math.PI) / 180; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; };
  const wedgeD = (cx, cy, r0, r1, d0, d1) => {
    const lg = d1 - d0 > 180 ? 1 : 0;
    const [a, b] = polar(cx, cy, d0, r1);
    const [c, d] = polar(cx, cy, d1, r1);
    const [e, g] = polar(cx, cy, d1, r0);
    const [h, k] = polar(cx, cy, d0, r0);
    return `M${f(a)} ${f(b)}A${r1} ${r1} 0 ${lg} 1 ${f(c)} ${f(d)}L${f(e)} ${f(g)}A${r0} ${r0} 0 ${lg} 0 ${f(h)} ${f(k)}Z`;
  };
  const acName = (k) => (k === 'ALL' ? 'แบบอื่น' : k === 'WING2' ? 'เฉพาะ 5 แบบ บน.2' : U.AC[k]);
  const envName = (k) => (k === 'ALL' ? 'ทุกสภาพ (ไม่เจาะจง)' : ENV[k]);
  const hfName = (v) => (v.startsWith('tier:') ? `ชั้น ${v[5]} · ${TIER[v[5]].th}` : HF[v]);

  /* ── คำนวณค่าประจำเคสครั้งเดียว ── */
  for (const c of C) {
    c._ph = c.phase[0];
    c._ac = c.aircraft.find((a) => U.WING.includes(a)) || 'ALL';
    c._cats = c.hfacs ? U.hfCats(c) : [];
    c._tiers = TK.filter((t) => c._cats.some((k) => k[0] === t));
    c._ag = U.ag(c);
    c._jp = c._ag.th === 'ญี่ปุ่น';
    c._full = c._tiers.length === 4;
    const blob = `${c.title} ${c.summary} ${(c.factors || []).join(' ')} ${(c.actions_today || []).join(' ')} ${c.brief_question || ''}`;
    c._q = `${c.id} ${c.year} ${c.aircraft.join(' ')} ${blob}`.toLowerCase();
    c._hz = HAZARDS.filter((h) => h.rx.test(blob) || (h.extra && h.extra(c))).map((h) => h.k);
  }
  const BYID = new Map(C.map((c) => [c.id, c]));
  const byN = (m) => [...m].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])));
  const envLib = U.count(C, (c) => c.environment);
  const ENV_ROWS = byN(envLib).map(([k]) => k).filter((k) => k !== 'ALL').concat(envLib.has('ALL') ? ['ALL'] : []);
  const AGBY = new Map(C.map((c) => [c._ag.code, c._ag]));
  const AG_ROWS = byN(U.count(C, (c) => c._ag.code)).map(([k]) => k);
  const FULL = C.filter((c) => c._full).sort((a, b) => a.year - b.year || a.id.localeCompare(b.id));
  const YRS = [];
  for (let y = U.Y0; y <= U.Y1; y++) YRS.push(y);

  /* ── สถานะตัวกรอง: ทุกกราฟอ่านจาก S ชุดเดียว (เพิ่ม WING2, hz, q) ── */
  const HTML = [], UPD = [], BIND = [], REV = [];
  let RO = null, MQ = null, onMQ = null;
  const S = { ac: '', type: '', phase: '', env: '', hf: '', ag: '', hz: '', q: '' };
  const KEYS = Object.keys(S);
  let Y = 0, PLAY = false, SORT = 'new', SHOW = 20, OPEN = '';
  const VALID = {
    ac: (v) => U.WING.includes(v) || v === 'ALL' || v === 'WING2',
    type: (v) => TYPES.includes(v),
    phase: (v) => ORDER.includes(v),
    env: (v) => has(ENV, v),
    hf: (v) => /^tier:[OSPA]$/.test(v) || has(HF, v) || v === 'FULL4',
    ag: (v) => AGBY.has(v),
    hz: (v) => has(HZ_MAP, v),
    q: (v) => typeof v === 'string' && v.length <= 80,
  };
  const match = (c, ...skip) => {
    const k = (x) => !skip.includes(x);
    if (S.ac && k('ac')) {
      if (S.ac === 'WING2') { if (c._ac === 'ALL') return false; }
      else if (c._ac !== S.ac) return false;
    }
    if (S.type && k('type') && c.type !== S.type) return false;
    if (S.phase && k('phase') && c._ph !== S.phase) return false;
    if (S.env && k('env') && !c.environment.includes(S.env)) return false;
    if (S.hf && k('hf')) {
      if (S.hf === 'FULL4') { if (!c._full) return false; }
      else if (!(S.hf.startsWith('tier:') ? c._tiers.includes(S.hf[5]) : c._cats.includes(S.hf))) return false;
    }
    if (S.ag && k('ag') && c._ag.code !== S.ag) return false;
    if (S.hz && k('hz') && !c._hz.includes(S.hz)) return false;
    if (S.q && k('q') && !c._q.includes(S.q.trim().toLowerCase())) return false;
    if (Y && k('y') && c.year > Y) return false;
    return true;
  };
  const M = (...skip) => C.filter((c) => match(c, ...skip));
  const active = () => KEYS.some((k) => S[k]) || !!Y;

  const readHash = () => {
    for (const k of KEYS) S[k] = '';
    Y = 0;
    let cs = '';
    const h = location.hash.includes('?') ? location.hash.split('?')[1] : location.hash.slice(1);
    if (!h) return cs;
    for (const part of h.split('&')) {
      const i = part.indexOf('=');
      if (i < 1) continue;
      const k = part.slice(0, i);
      let v;
      try { v = decodeURIComponent(part.slice(i + 1)); } catch { continue; }
      if (has(VALID, k)) { if (VALID[k](v)) S[k] = v; }
      else if (k === 'y') { const n = Number(v); if (Number.isInteger(n) && n >= U.Y0 && n < U.Y1) Y = n; }
      else if (k === 'case' && BYID.has(v)) cs = v;
    }
    return cs;
  };
  const writeHash = () => {
    const p = KEYS.filter((k) => S[k]).map((k) => `${k}=${encodeURIComponent(S[k]).replace(/%3A/gi, ':')}`);
    if (Y) p.push(`y=${Y}`);
    if (OPEN) p.push(`case=${encodeURIComponent(OPEN)}`);
    const base = location.hash.startsWith('#/dashboard') ? '#/dashboard' : '';
    if (base) history.replaceState(null, '', `${base}${p.length ? `?${p.join('&')}` : ''}`);
    else history.replaceState(null, '', p.length ? `#${p.join('&')}` : location.pathname + location.search);
  };

  /* ── ตัวเลขที่นับขึ้นเมื่อเลื่อนถึง ── */
  const TOK = new WeakMap(), SHOWN = new WeakMap(), FMT = new WeakMap(), PEND = new Set();
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  const tween = (el, a, b, ms, fm) => {
    const tok = {};
    TOK.set(el, tok);
    if (U.reduced || !ms || a === b) { el.textContent = fm(b); SHOWN.set(el, b); return; }
    const t0 = performance.now();
    const step = (t) => {
      if (TOK.get(el) !== tok) return;
      const k = Math.min(1, (t - t0) / ms);
      const v = a + (b - a) * ease(k);
      el.textContent = fm(Math.round(v));
      SHOWN.set(el, v);
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const setNum = (el, v, fm = U.fmt) => {
    if (!el) return;
    FMT.set(el, fm);
    if (v == null || Number.isNaN(v)) { TOK.set(el, {}); SHOWN.delete(el); PEND.delete(el); el.textContent = '—'; return; }
    const rv = el.closest('.rv');
    if (rv && !rv.classList.contains('in')) { TOK.set(el, {}); el.textContent = fm(v); SHOWN.set(el, v); PEND.add(el); return; }
    tween(el, SHOWN.has(el) ? SHOWN.get(el) : v, v, PLAY ? 0 : 500, fm);
  };
  const onReveal = (root) => {
    for (const el of [...PEND]) {
      if (!root.contains(el)) continue;
      PEND.delete(el);
      tween(el, 0, SHOWN.get(el) || 0, 1100, FMT.get(el) || U.fmt);
    }
    REV.forEach((fn) => fn(root));
  };

  /* ── คำอธิบายเมื่อชี้เมาส์ (เพิ่มตัวอย่างคำถามบรีฟใน Tooltip) ── */
  const TIP = $('.tip', D);
  const tip = (html, ev) => {
    let x, y;
    if (ev instanceof Element) { const b = ev.getBoundingClientRect(); x = b.left + b.width / 2; y = b.bottom; }
    else { if (ev.pointerType && ev.pointerType !== 'mouse') return; x = ev.clientX; y = ev.clientY; }
    TIP.innerHTML = html;
    TIP.hidden = false;
    const r = TIP.getBoundingClientRect();
    let tx = x + 16, ty = y + 18;
    if (tx + r.width > innerWidth - 8) tx = x - r.width - 16;
    if (ty + r.height > innerHeight - 8) ty = y - r.height - 18;
    TIP.style.transform = `translate(${Math.round(Math.max(8, tx))}px, ${Math.round(Math.max(8, ty))}px)`;
  };
  const untip = () => { TIP.hidden = true; };
  const typeChip = (c) => `<span class="chip ${tcls(c.type)}"><i class="d"></i>${U.TYPE[c.type]}</span>`;
  const meta = (c) => `${acName(c._ac)} · ${PH[c._ph]} · ${c._ag.code} ${c._ag.th}`;
  const caseTip = (c) => `<div class="tp-h"><span class="mono">${c.year}</span>${typeChip(c)}</div>`
    + `<div class="tp-t">${esc(c.title)}</div><div class="tp-m">${esc(meta(c))}</div>`
    + (c.brief_question ? `<div class="tp-q">“${esc(c.brief_question)}”</div>` : '')
    + `<div class="tp-k">คลิกเพื่อเปิดลิ้นชักอ่านสรุปและคำถามบรีฟ</div>`;

  /* ── ส่วนประกอบร่วม ── */
  const head = (n, id, h, p, tools = '') => `<div class="sec-h rv"><div class="sec-n">${n} //</div><h2 id="h-${id}" tabindex="-1">${h}</h2>${tools ? `<div class="sec-tools">${tools}</div>` : ''}<p>${p}</p></div>`;
  const lbtn = (k, v, name, cls = '') => `<button type="button" class="lbtn ${cls}" data-k="${k}" data-v="${esc(v)}" data-fk="${k}-${esc(v)}" aria-pressed="false">`
    + `<span class="nm">${name}</span><span class="n">0</span>${ic('check', 'xs ck')}<span class="bar"><i></i></span></button>`;
  const setLbtns = (root, k, cnt) => {
    const max = Math.max(1, ...cnt.values());
    for (const b of $$(`.lbtn[data-k="${k}"]`, root)) {
      const n = cnt.get(b.dataset.v) || 0;
      b.querySelector('.n').textContent = U.fmt(n);
      b.querySelector('.bar i').style.width = `${(n / max) * 100}%`;
      b.classList.toggle('z', !n);
      b.setAttribute('aria-pressed', String(S[k] === b.dataset.v));
    }
  };
  const pctOf = (k, n) => (n ? pct(k, n) : 0);
  let update = () => {};
  const toggle = (k, v) => {
    S[k] = S[k] === v ? '' : v;
    SHOW = 20;
    update();
  };
  const setF = (patch) => { Object.assign(S, patch); SHOW = 20; update(); };

  /* ═════ ส่วนหัว: ภาพปก + พาดหัว + "สิ่งที่พบ" ═════ */
  const AG_N = AGBY.size;
  const CTY_N = new Set([...AGBY.values()].map((a) => a.th).filter((t) => t && t !== '—')).size;
  const phLib = byN(U.count(C, (c) => c._ph));
  const ycLib = U.count(C, (c) => c.year);
  const YMAX = Math.max(...ycLib.values());
  const [pkY, pkN] = byN(ycLib)[0];
  const WING_N = C.filter((c) => c._ac !== 'ALL').length;
  const AG1 = AGBY.get(AG_ROWS[0]);
  const AG1_N = C.filter((c) => c._ag.code === AG1.code).length;
  const FINDS = [
    ['s-radar', pct(phLib[0][1] + phLib[1][1], N), '%', `เกิดช่วง${U.sp(PH[phLib[0][0]])}หรือ${U.sp(PH[phLib[1][0]])}`],
    ['s-hfacs', FULL.length, '', 'เคสที่ลงรหัสครบทั้ง 4 ชั้นของ HFACS'],
    ['s-env', pct(envLib.get('DAY_VMC') || 0, N), '%', 'เกิดในวันที่อากาศดี (Day VMC Paradox)'],
    ['s-years', pkY, '', `ปีที่มีเคสมากที่สุด (${pkN} เคส)`, 1],
    ['s-types', WING_N, '', 'เคสเป็น ฮ. 5 แบบที่ บน.2 ใช้'],
    ['s-agency', AG1_N, '', `เคสจาก ${AG1.code} ${AG1.th}`],
  ];
  const find = ([href, v, unit, cap, isYear], i) => `<li><a href="#${href}"><span class="fd-i">${String(i + 1).padStart(2, '0')}</span>`
    + `<span class="fd-n"><span${isYear ? '' : ` data-n="${v}"`}>${isYear ? v : U.fmt(v)}</span>${unit ? `<small>${unit}</small>` : ''}</span>`
    + `<span class="fd-c">${esc(cap)}</span></a></li>`;

  HTML.push(`<section class="dh" aria-labelledby="dh-t">
  <div class="dh-media"></div><div class="dh-scrim"></div><div class="dh-grain"></div>
  <div class="wrap dh-in">
    <div>
      <p class="eyebrow"><span>คลังบทเรียนนิรภัยการบินสากล</span><span>·</span><span>ข้อมูล ${U.isoTh(W.version)}</span></p>
      <h1 id="dh-t"><span>${U.fmt(N)} เคส ใน ${U.Y1 - U.Y0} ปี</span><span class="g"><span class="nw">เกิดตอนไหน</span> <span class="nw">เพราะอะไร</span></span></h1>
      <p class="dek">สำรวจรายงานสอบสวนอุบัติเหตุและอุบัติการณ์เฮลิคอปเตอร์จาก ${AG_N} หน่วยงาน ใน ${CTY_N} ประเทศ — เลือกมุมมองลัดด้านล่าง หรือคลิกที่จุดใดก็ได้ในกราฟเพื่อกรองเชื่อมโยงทั้งหน้าแบบทันที</p>
      <div class="dh-actions">
        <button type="button" class="btn btn-gold" id="btn-roulette">${ic('dice', 'sm')}<span>สุ่มเคสบรีฟ 1 นาที</span></button>
        <a class="btn btn-line" href="#cases"><span>ข้ามไปรายการเคสทั้งหมด</span>${ic('down', 'sm')}</a>
      </div>
      <p class="dh-note">${ic('info', 'sm')}<span>ตัวเลขทั้งหมดคือจำนวนเคสในคลังที่รวบรวมได้ ไม่ใช่อัตราการเกิดเหตุต่อชั่วโมงบิน</span></p>
    </div>
    <aside class="fd glass" aria-labelledby="fd-t"><div class="fd-h"><h2 id="fd-t">6 จุดสังเกตหลัก</h2><span>คลิกเพื่อกระโดดไปดูกราฟ</span></div>
      <ul class="fd-g">${FINDS.map(find).join('')}</ul></aside>
  </div>
</section>`);

  /* ═════ STORY LENSES (มุมมองวิเคราะห์สำเร็จรูป 8 มุมมอง จัดเรียงเป็นระบบ 4×2) ═════ */
  const STORIES = [
    { id: 'all', label: '1. ทั้งหมดในคลังสากล', cnt: N, patch: { ac: '', type: '', phase: '', env: '', hf: '', ag: '', hz: '', q: '' } },
    { id: 'wing2', label: '2. เฉพาะ 5 แบบ ฮ. บน.2', cnt: WING_N, patch: { ac: 'WING2', type: '', phase: '', env: '', hf: '', ag: '', hz: '', q: '' } },
    { id: 'vmc_acc', label: '3. กับดักอากาศดี (VMC อุบัติเหตุ)', cnt: C.filter((c) => c.environment.includes('DAY_VMC') && c.type === 'accident').length, patch: { ac: '', type: 'accident', phase: '', env: 'DAY_VMC', hf: '', ag: '', hz: '', q: '' } },
    { id: 'hover_land', label: '4. วิกฤตขั้นตอนลอยตัว (Hover)', cnt: C.filter((c) => c._ph === 'HOVER').length, patch: { ac: '', type: '', phase: 'HOVER', env: '', hf: '', ag: '', hz: '', q: '' } },
    { id: 'wire', label: '5. ชนสายไฟ / เสา / สิ่งกีดขวาง', cnt: C.filter((c) => c._hz.includes('wire')).length, patch: { ac: '', type: '', phase: '', env: '', hf: '', ag: '', hz: 'wire', q: '' } },
    { id: 'pwr', label: '6. เครื่องยนต์ / ระบบส่งกำลัง', cnt: C.filter((c) => c._hz.includes('pwr')).length, patch: { ac: '', type: '', phase: '', env: '', hf: '', ag: '', hz: 'pwr', q: '' } },
    { id: 'mtn', label: '7. ปฏิบัติการบินภูเขา (Mountain)', cnt: C.filter((c) => c.environment.includes('MOUNTAIN')).length, patch: { ac: '', type: '', phase: '', env: 'MOUNTAIN', hf: '', ag: '', hz: '', q: '' } },
    { id: 'full4', label: '8. ทะลุชีสครบ 4 ชั้น HFACS', cnt: FULL.length, patch: { ac: '', type: '', phase: '', env: '', hf: 'FULL4', ag: '', hz: '', q: '' } },
  ];
  const isStoryActive = (st) => !Y && KEYS.every((k) => S[k] === (st.patch[k] || ''));

  /* ═════ แถบตัวกรองหลัก (Single-Line Sticky Command Bar) ═════ */
  const AC_SHORT = { B412EP: '412EP' };
  const segBtn = (k, v, label, title = '') => `<button type="button" data-k="${k}" data-v="${esc(v)}" aria-pressed="false"${title ? ` title="${esc(title)}"` : ''}>${label}${ic('check', 'xs ck')}</button>`;
  const acTitle = (k) => `${U.AC_L[k] || U.AC[k]}${U.AC_SQ[k] ? ` · ฝูง ${U.AC_SQ[k]}` : ''}`;
  HTML.push(`<div class="fb" id="fb"><div class="wrap fb-in">
  <div class="fb-bar">
    <div class="fb-sc">
      <div class="fb-g"><div class="seg" role="group" aria-label="แบบอากาศยาน">${segBtn('ac', '', 'ทุกแบบ')}${segBtn('ac', 'WING2', '5 แบบ บน.2', 'เฉพาะ 5 แบบที่ บน.2 ใช้ (H225M, Bell 412EP, S-92, H135, S-70i)')}${U.WING.map((k) => segBtn('ac', k, esc(AC_SHORT[k] || U.AC[k]), acTitle(k))).join('')}${segBtn('ac', 'ALL', 'อื่น ๆ', 'เฮลิคอปเตอร์แบบที่ บน.2 ไม่ได้ใช้')}</div></div>
      <div class="fb-g"><div class="seg" role="group" aria-label="ประเภทเหตุ">${segBtn('type', '', 'ทุกประเภท')}${TYPES.map((t) => segBtn('type', t, `<i class="d ${tcls(t)}"></i>${U.TYPE[t]}`)).join('')}</div></div>
      <div class="fb-search">
        ${ic('search', 'xs')}
        <input type="search" id="q-in" placeholder="ค้นหา wire, MGB, NVG..." aria-label="ค้นหาคำในเคส" autocomplete="off">
        <button type="button" class="q-x" id="q-clr" aria-label="ล้างคำค้นหา" hidden>${ic('x', 'xs')}</button>
      </div>
    </div>
    <div class="fb-r">
      <span class="sr" id="fb-n" aria-live="polite"><b>${U.fmt(N)}</b>/${U.fmt(N)} เคส</span>
      <button type="button" class="btn btn-line" id="fb-clr" data-clear="all" hidden><span>ล้างตัวกรอง</span></button>
      <a class="btn btn-gold fb-go" href="#cases"><span>ดู <span id="fb-go">${U.fmt(N)}</span> เคส</span></a>
    </div>
  </div>
  <div class="fb-chips" id="fb-chips"></div>
</div></div>`);

  /* ═════ แผงควบคุมการวิเคราะห์แบบรวมศูนย์ (Unified Console: Story Lenses 4×2 + Live Telemetry + 5 KPI) ═════ */
  const kSpark = YRS.map((y, i) => {
    const h = ((ycLib.get(y) || 0) / YMAX) * 30;
    return `<rect class="a" x="${i * 10}" y="${f(30 - h)}" width="8" height="${f(h)}"/><rect class="m" data-y="${y}" x="${i * 10}" y="0" width="8" height="30" style="transform:scaleY(0)"/>`;
  }).join('');
  const kTopV = '<div class="k-lg"></div><div class="k-stack"><i></i><i style="background:transparent"></i></div>';
  const kCell = (id, unit, label, v, c = '') => `<div id="${id}"><div class="k-n"><span>0</span><small>${unit}</small></div>`
    + `<div class="k-l">${label}</div><div class="k-v">${v}</div>${c !== null ? `<div class="k-c">${c}</div>` : ''}</div>`;

  HTML.push(`<section class="wrap console glass rv" id="kpi" aria-label="แผงควบคุมมุมมองวิเคราะห์และตัวชี้วัดหลัก">
  <div class="cn-lenses">
    <div class="cn-head">
      <span class="cn-title">${ic('spark', 'sm')}<span>มุมมองวิเคราะห์ลัด (Story Lenses)</span></span>
      <span class="cn-sub">เลือกชุดตัวกรองสำเร็จรูปเพื่อเจาะกลุ่มความเสี่ยงในคลิกเดียว</span>
    </div>
    <div class="story-grid" id="story-bar" role="group" aria-label="มุมมองวิเคราะห์ลัด">
      ${STORIES.map((st) => `<button type="button" class="story-btn" data-story="${st.id}" aria-pressed="false"><span class="lbl">${esc(st.label)}</span><span class="cnt">${U.fmt(st.cnt)}</span></button>`).join('')}
    </div>
  </div>
  <div class="cn-tele" id="votd-ban" aria-live="polite">
    <span class="cn-badge"><i class="dot"></i><span>LIVE INSIGHT</span></span>
    <p class="votd-ban-p" id="votd-ban-p"></p>
    <button type="button" class="btn-tele" id="ban-roulette">${ic('dice', 'xs')}<span>สุ่มเปิด 1 เคสจากกลุ่มนี้</span></button>
  </div>
  <div class="kpi">
    ${kCell('k1', 'เคส', 'เคสทั้งคลัง', `<svg class="k-years" viewBox="0 0 ${YRS.length * 10 - 2} 30" preserveAspectRatio="none" aria-hidden="true">${kSpark}</svg>`,
      `จำนวนเคสต่อปี <span class="mono">${U.Y0}</span>–<span class="mono">${U.Y1}</span> · <span class="nw">ไม่ใช่แนวโน้ม</span>`)}
    ${kCell('k2', '%', 'เป็นอุบัติเหตุ', '<div class="k-lg"></div><div class="k-split"><i style="background:var(--bad)"></i><i style="background:var(--warn)"></i></div>', null)}
    ${kCell('k3', '%', 'ช่วงของเที่ยวบินที่พบมากที่สุด', kTopV)}
    ${kCell('k4', '%', 'สภาพแวดล้อมที่พบมากที่สุด', kTopV)}
    ${kCell('k5', '%', 'ปัจจัย HFACS ที่พบมากที่สุด<span class="k-chip">ร่าง</span>', kTopV)}
  </div>
</section>`);

  const chipList = () => {
    const ch = [];
    if (S.phase) ch.push(['phase', `ช่วง${U.sp(PH[S.phase])}`]);
    if (S.env) ch.push(['env', `สภาพ${U.sp(envName(S.env))}`]);
    if (S.hf) ch.push(['hf', S.hf === 'FULL4' ? 'HFACS ครบ 4 ชั้น' : `HFACS ${hfName(S.hf)}`]);
    if (S.ag) ch.push(['ag', `${S.ag} · ${AGBY.get(S.ag).th}`]);
    if (S.hz) ch.push(['hz', `ภัยคุกคาม: ${HZ_MAP[S.hz].th}`]);
    if (S.q) ch.push(['q', `ค้นหา “${S.q}”`]);
    if (Y) ch.push(['y', `ถึงปี ${Y}`]);
    return ch;
  };
  const clearAll = () => {
    stopPlay();
    for (const k of KEYS) S[k] = '';
    Y = 0;
    SHOW = 20;
    const qin = $('#q-in');
    if (qin) qin.value = '';
    update();
  };

  const LOW_PHASES = new Set(['TAXI', 'TAKEOFF', 'HOVER', 'AUTOROTATION', 'APPROACH', 'LANDING']);

  UPD.push(() => {
    const m = M(), n = m.length, nb = $('#fb-n');
    nb.setAttribute('aria-live', PLAY ? 'off' : 'polite');
    nb.firstElementChild.textContent = U.fmt(n);
    $('#fb-go').textContent = U.fmt(n);
    $('#fb-clr').hidden = !active();
    const qin = $('#q-in'), qclr = $('#q-clr');
    if (qin && qin.value !== S.q && R.activeElement !== qin) qin.value = S.q;
    if (qclr) qclr.hidden = !S.q;
    for (const b of $$('#fb .seg button')) b.setAttribute('aria-pressed', String(S[b.dataset.k] === b.dataset.v));
    for (const b of $$('#story-bar .story-btn')) {
      const st = STORIES.find((x) => x.id === b.dataset.story);
      b.setAttribute('aria-pressed', String(!!st && isStoryActive(st)));
    }
    $('#fb-chips').innerHTML = chipList().map(([k, t]) => `<button type="button" class="fchip" data-fk="chip-${k}" data-clear="${k}" aria-label="ล้างตัวกรอง ${esc(t)}">`
      + `<span>${esc(t)}</span><span class="x">${ic('x', 'xs')}</span></button>`).join('');

    /* สร้างประโยค Live Telemetry Narrative พร้อม Inline BANs */
    const banP = $('#votd-ban-p');
    if (!n) {
      banP.innerHTML = 'ไม่พบเคสที่ตรงกับเงื่อนไขทั้งหมดพร้อมกัน — ลองคลิกปุ่ม <b>ล้างตัวกรอง</b> หรือเลือกมุมมองจาก <b>มุมมองวิเคราะห์ลัด</b> ด้านบน';
    } else {
      const acc = m.filter((c) => c.type === 'accident').length;
      const inc = n - acc;
      const topPh = byN(U.count(m, (c) => c._ph))[0];
      const lowN = m.filter((c) => LOW_PHASES.has(c._ph)).length;
      const topHz = byN(U.count(m, (c) => c._hz))[0];
      const scopeTxt = active() ? `พบ <span class="ban-pill">${U.fmt(n)} เคส</span>` : `ทั้งคลัง <span class="ban-pill">${U.fmt(n)} เคส</span>`;
      const sevTxt = `เป็นอุบัติเหตุ <span class="ban-pill acc">${U.fmt(acc)} (${pct(acc, n)}%)</span> อุบัติการณ์ <span class="ban-pill inc">${U.fmt(inc)}</span>`;
      const phTxt = topPh ? `· ช่วงบินสูงสุด <span class="ban-pill">${esc(PH[topPh[0]])} ${pct(topPh[1], n)}%</span> (ใกล้พื้น <span class="ban-pill">${pct(lowN, n)}%</span>)` : '';
      const hzTxt = topHz ? `· ภัยคุกคามหลัก: <b>${esc(HZ_MAP[topHz[0]].th)}</b> (<span class="mono">${U.fmt(topHz[1])}</span> เคส)` : '';
      banP.innerHTML = `${scopeTxt} ${sevTxt} ${phTxt} ${hzTxt}`;
    }
  });

  const kTop = (id, cnt, n, name) => {
    const box = $(`#${id}`), [t1, t2] = byN(cnt);
    setNum($('.k-n span', box), t1 && n ? pct(t1[1], n) : null);
    $('.k-lg', box).innerHTML = t1 ? `<span><i></i>${esc(name(t1[0]))} <span class="mono">${U.fmt(t1[1])}</span></span>` : '<span>ไม่มีเคสที่ตรงตัวกรอง</span>';
    const [a, b] = $$('.k-stack i', box);
    a.style.flexGrow = t1 ? t1[1] : 0;
    b.style.flexGrow = t1 ? Math.max(0, n - t1[1]) : 1;
    $('.k-c', box).innerHTML = t2 ? `รองลงมา ${esc(name(t2[0]))} <span class="mono">${pct(t2[1], n)}%</span>` : '';
  };
  UPD.push(() => {
    const m = M(), n = m.length;
    setNum($('#k1 .k-n span'), n);
    $('#k1 .k-l').textContent = active() ? `ตรงตัวกรอง จากทั้งหมด ${U.fmt(N)} เคส` : 'เคสทั้งคลัง';
    const ym = U.count(m, (c) => c.year);
    for (const r of $$('#k1 .m')) r.style.transform = `scaleY(${(ym.get(+r.dataset.y) || 0) / YMAX})`;
    const a = m.filter((c) => c.type === 'accident').length;
    setNum($('#k2 .k-n span'), n ? pct(a, n) : null);
    $('#k2 .k-lg').innerHTML = `<span><i style="background:var(--bad)"></i>อุบัติเหตุ <span class="mono">${U.fmt(a)}</span></span>`
      + `<span><i style="background:var(--warn)"></i>อุบัติการณ์ <span class="mono">${U.fmt(n - a)}</span></span>`;
    const [s1, s2] = $$('#k2 .k-split i');
    s1.style.flexGrow = a;
    s2.style.flexGrow = n - a;
    kTop('k3', U.count(m, (c) => c._ph), n, (k) => PH[k]);
    const ec = U.count(m, (c) => c.environment);
    ec.delete('ALL');
    kTop('k4', ec, n, envName);
    kTop('k5', U.count(m, (c) => c._cats), n, (k) => HF[k]);
  });

  BIND.push(() => {
    for (const el of $$('.fd-n [data-n]')) tween(el, 0, +el.dataset.n, 1400, U.fmt);
    const fb = $('#fb');
    const setH = () => host.style.setProperty('--fb-h', `${fb.offsetHeight}px`);
    setH();
    if (window.ResizeObserver) { RO = new ResizeObserver(setH); RO.observe(fb); }

    /* ค้นหาคำสำคัญสด */
    let qTimer = 0;
    const qin = $('#q-in'), qclr = $('#q-clr');
    qin.addEventListener('input', () => {
      clearTimeout(qTimer);
      qTimer = setTimeout(() => {
        S.q = qin.value.trim();
        SHOW = 20;
        update();
      }, 140);
    });
    qclr.addEventListener('click', () => {
      qin.value = '';
      S.q = '';
      SHOW = 20;
      update();
      qin.focus();
    });

    /* สุ่มเคสบรีฟ 1 นาที */
    const pickRandomCase = (btn) => {
      const pool = M();
      const list = pool.length ? pool : C;
      const pick = list[Math.floor(Math.random() * list.length)];
      if (pick) openCase(pick.id, btn);
    };
    $('#btn-roulette').addEventListener('click', (e) => pickRandomCase(e.currentTarget));
    $('#ban-roulette').addEventListener('click', (e) => pickRandomCase(e.currentTarget));
  });

  /* ═════ 01 โปรไฟล์การบินตามความสูง (Flight Profile Elevation Curve) + เรดาร์วงปี (Polar Radar) ═════ */
  // โหนดบนเส้นโปรไฟล์การบินตามลำดับขั้นตอนการบินจริง (x, y บน viewBox 1140 x 290)
  const FP_NODES = [
    { k: 'PREFLIGHT', x: 56, y: 224 },
    { k: 'TAXI', x: 162, y: 220 },
    { k: 'TAKEOFF', x: 282, y: 136 },
    { k: 'ENROUTE', x: 428, y: 54 },
    { k: 'HOVER', x: 576, y: 146 },
    { k: 'AUTOROTATION', x: 706, y: 170 },
    { k: 'APPROACH', x: 836, y: 124 },
    { k: 'LANDING', x: 960, y: 220 },
    { k: 'SHUTDOWN', x: 1052, y: 224 },
    { k: 'GROUND', x: 1108, y: 224 },
  ];
  const fpCurvePath = () => {
    const pts = FP_NODES.slice(0, 9);
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      const c1x = f(p1.x + (p2.x - p0.x) / 6), c1y = f(Math.min(224, p1.y + (p2.y - p0.y) / 6));
      const c2x = f(p2.x - (p3.x - p1.x) / 6), c2y = f(Math.min(224, p2.y - (p3.y - p1.y) / 6));
      d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  };
  const fpSvgInit = () => {
    const curve = fpCurvePath();
    const area = `${curve} L 1052 228 L 56 228 Z`;
    return `<defs>
      <linearGradient id="fp-grad" x1="0" y1="40" x2="0" y2="230" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="var(--sky)" stop-opacity=".45"/>
        <stop offset="100%" stop-color="var(--sky)" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <!-- เขตความเสี่ยงใกล้พื้น (Low-Altitude High-Workload Envelope) -->
    <rect class="fp-zone" x="120" y="106" width="880" height="122" rx="10"/>
    <line class="fp-zone-line" x1="120" y1="106" x2="1000" y2="106"/>
    <text class="fp-zone-lbl" id="fp-zone-lbl" x="124" y="96">เขตวิกฤตใกล้พื้น (ต่ำกว่าระดับบินเดินทาง)</text>
    <!-- เส้นระดับพื้นดิน -->
    <line class="fp-gnd" x1="20" y1="226" x2="1125" y2="226"/>
    <path class="fp-area" d="${area}"/>
    <path class="fp-curve-bg" d="${curve}"/>
    <path class="fp-curve" d="${curve}"/>
    <g id="fp-nodes">
      ${FP_NODES.map((nd) => `<g class="fp-nd" data-k="phase" data-v="${nd.k}" data-ph="${nd.k}" role="button" tabindex="0" aria-pressed="false" transform="translate(${nd.x},${nd.y})">
        <circle class="halo" r="28"/>
        <circle class="core" r="20"/>
        <circle class="arc-inc" r="20" transform="rotate(-90)" pathLength="100" stroke-dasharray="0 100"/>
        <circle class="arc-acc" r="20" transform="rotate(-90)" pathLength="100" stroke-dasharray="0 100"/>
        <text class="cnt">0</text>
        <text class="lbl" y="${nd.y < 90 ? -34 : 42}">${esc(PH[nd.k])}</text>
        <text class="en-lbl" y="${nd.y < 90 ? -20 : 56}">${esc(PH_EN[nd.k])}</text>
      </g>`).join('')}
    </g>`;
  };

  /* เรดาร์วงปีเดิมของ Claude */
  const RX = 580, RY = 450, R0 = 90, R1 = 350, GAP = 2, MIN = 16;
  const yrR = (y) => 98 + ((y - U.Y0) / (U.Y1 - U.Y0)) * 244;
  const SEC = {};
  {
    const phN = U.count(C, (c) => c._ph), fixed = new Set(), span = {};
    for (;;) {
      const free = ORDER.filter((k) => !fixed.has(k));
      const avail = 360 - ORDER.length * GAP - fixed.size * MIN;
      const tot = free.reduce((a, k) => a + (phN.get(k) || 0), 0) || 1;
      let ch = false;
      for (const k of free) { const s = (avail * (phN.get(k) || 0)) / tot; if (s < MIN) { fixed.add(k); ch = true; } else span[k] = s; }
      if (!ch) break;
    }
    for (const k of fixed) span[k] = MIN;
    let a = GAP / 2;
    for (const k of ORDER) { SEC[k] = [a, a + span[k]]; a += span[k] + GAP; }
  }
  const RINGS = [1980, 1990, 2000, 2010, 2020];
  const DOTS = [...C].sort((a, b) => a.id.localeCompare(b.id));
  {
    const rnd = U.rng(U.hash('radar-dash')), placed = [];
    const LAB = RINGS.map((yy) => RY - yrR(yy)), inLab = (x, y) => Math.abs(x - RX) < 27 && LAB.some((ly) => Math.abs(y - ly) < 12);
    for (const c of DOTS) {
      const [d0, d1] = SEC[c._ph];
      const r = yrR(c.year) + (rnd() * 3 - 1.5);
      const m = Math.min(((6 / r) * 180) / Math.PI, (d1 - d0) / 2);
      let best = null, bs = -1;
      for (let i = 0; i < 14; i++) {
        const deg = d0 + m + rnd() * (d1 - d0 - 2 * m);
        const [x, y] = polar(RX, RY, deg, r);
        let s = Infinity;
        for (const p of placed) { const dx = p.x - x, dy = p.y - y, q = dx * dx + dy * dy; if (q < s) s = q; }
        if (inLab(x, y)) s = -0.5;
        if (s > bs) { bs = s; best = { x, y, deg }; }
      }
      placed.push(best);
      c._rd = best;
      c._vis = true;
    }
  }
  const labPos = (k) => {
    const mid = (SEC[k][0] + SEC[k][1]) / 2, rad = (mid * Math.PI) / 180, s = Math.sin(rad), co = Math.cos(rad);
    const [x, y] = polar(RX, RY, mid, R1 + 26);
    return { x, y: y + (co < -0.25 ? 14 : co > 0.25 ? -6 : 4), a: s > 0.25 ? 'start' : s < -0.25 ? 'end' : 'middle' };
  };
  const rdSvg = () => {
    let s = RINGS.map((y) => `<circle class="rd-ring" cx="${RX}" cy="${RY}" r="${f(yrR(y))}"/>`).join('');
    s += `<circle class="rd-ring o" cx="${RX}" cy="${RY}" r="${R1}"/><circle class="rd-ring o" cx="${RX}" cy="${RY}" r="${R0}"/>`;
    for (const k of ORDER) {
      const [x0, y0] = polar(RX, RY, SEC[k][0] - GAP / 2, R0), [x1, y1] = polar(RX, RY, SEC[k][0] - GAP / 2, R1);
      s += `<line class="rd-sep" x1="${f(x0)}" y1="${f(y0)}" x2="${f(x1)}" y2="${f(y1)}"/>`;
    }
    s += ORDER.map((k) => `<path class="rd-hi" data-ph="${k}" d="${wedgeD(RX, RY, R0, R1, SEC[k][0], SEC[k][1])}"/>`).join('');
    s += `<g aria-hidden="true">${DOTS.map((c) => `<g class="rd-p" data-id="${c.id}"><circle class="rd-dot ${tcls(c.type)}" cx="${f(c._rd.x)}" cy="${f(c._rd.y)}" r="4" style="animation-delay:${f(c._rd.deg / 90 - 4)}s"/></g>`).join('')}</g>`;
    s += RINGS.map((y) => `<text class="rd-yl" x="${RX}" y="${f(RY - yrR(y) + 5)}">${y}</text>`).join('');
    s += ORDER.map((k) => { const p = labPos(k); return `<text class="rd-lab" data-ph="${k}" x="${f(p.x)}" y="${f(p.y)}" text-anchor="${p.a}" aria-hidden="true">${esc(PH_EN[k])} <tspan class="n">0</tspan></text>`; }).join('');
    s += ORDER.map((k) => `<path class="rd-hit" data-ph="${k}" role="button" tabindex="0" aria-pressed="false" d="${wedgeD(RX, RY, R0, R1 + 40, SEC[k][0] - 1, SEC[k][1] + 1)}"/>`).join('');
    return s;
  };

  HTML.push(`<section class="sec wrap" id="s-radar" aria-labelledby="h-radar">
  ${head('01', 'radar', '', 'สำรวจช่วงของเที่ยวบินที่เกิดเหตุผ่าน 2 มุมมอง: เส้นโปรไฟล์การบินตามความสูง (ด้านบน) และเรดาร์วงปี 1980–2025 (ด้านล่าง) แตะโหนดหรือกลีบเรดาร์เพื่อกรองทั้งหน้า')}
  <!-- 01A: เส้นโปรไฟล์การบินตามความสูง (Flight Profile Elevation Curve) -->
  <div class="fp-card glass rv" id="fp-card">
    <div class="fp-top">
      <h3><span class="chip votd">01A · FLIGHT PROFILE</span><span>เส้นโปรไฟล์การบินตามความสูง × สัดส่วนความรุนแรง</span></h3>
      <span class="ins" id="fp-ins" style="margin:0"></span>
    </div>
    <div class="fp-w">
      <svg class="fp-svg" id="fp-svg" viewBox="0 0 1140 288" role="group" aria-label="เส้นโปรไฟล์การบินตามความสูง แตะโหนดช่วงการบินเพื่อกรอง">${fpSvgInit()}</svg>
    </div>
  </div>
  <!-- 01B: เรดาร์วงปี (Polar Radar) -->
  <div class="rd glass rv">
    <div class="rd-fig"><div class="rd-box" id="rd-box"><div class="rd-sweep" aria-hidden="true"></div>
      <svg id="rd-svg" viewBox="0 0 1160 900" role="group" aria-label="เรดาร์ช่วงของเที่ยวบิน — เลือกช่วงเพื่อกรอง">${rdSvg()}</svg>
      <div class="rd-ctr" id="rd-ctr" aria-hidden="true"></div></div></div>
    <div class="rd-side">
      <h3 class="sd-h">Flight phase</h3>
      <div class="rd-list">${ORDER.map((k) => lbtn('phase', k, esc(PH_EN[k]) + en(PH[k]))).join('')}</div>
      <div class="yr">
        <div class="yr-h"><span id="yr-l">Year of occurrence</span><b id="yr-b"><small>All years</small></b></div>
        <input type="range" id="yr-in" min="${U.Y0}" max="${U.Y1}" step="1" value="${U.Y1}" aria-labelledby="yr-l" aria-valuetext="All years">
        <div class="yr-t"><span class="mono">${U.Y0}</span><span class="mono">${U.Y1}</span></div>
        <button type="button" class="btn btn-line yr-play" id="yr-play" aria-pressed="false"></button>
        <p class="yr-note" id="yr-note">Play to build up cases year by year from ${U.Y0} — other filters still apply</p>
      </div>
      <div class="rd-lg"><span><i class="d" style="background:var(--bad)"></i>Accident</span><span><i class="d" style="background:var(--warn)"></i>Incident</span><span>Inner ring = older · outer ring = newer</span></div>
    </div>
  </div>
</section>`);

  /* ── เล่นทีละปี ── */
  let TMR = 0;
  const stopPlay = () => { if (!PLAY) return; PLAY = false; clearInterval(TMR); };
  const startPlay = () => {
    if (U.reduced || PLAY) return;
    PLAY = true; SHOW = 20; Y = U.Y0; update();
    TMR = setInterval(() => { if (Y + 1 >= U.Y1) { Y = 0; stopPlay(); } else Y += 1; update(); }, 120);
  };

  let HOVPH = '', RDP = [];
  const setCtr = () => {
    const box = $('#rd-ctr');
    if (HOVPH) {
      const mp = M('phase'), n = mp.filter((c) => c._ph === HOVPH).length;
      box.innerHTML = `<span class="l">${esc(PH_EN[HOVPH])}</span><b>${U.fmt(n)}</b><span class="c">${pctOf(n, mp.length)}% of ${U.fmt(mp.length)} cases</span>`;
    } else {
      box.innerHTML = `<span class="l">${S.phase ? esc(PH_EN[S.phase]) : 'All phases'}</span><b>${U.fmt(M().length)}</b><span class="c">matching cases</span>`;
    }
  };
  const hoverPh = (k) => {
    if (HOVPH === k) return;
    HOVPH = k;
    for (const el of $$('#rd-svg .rd-hi, #rd-svg .rd-lab')) el.classList.toggle('on', el.dataset.ph === k);
    setCtr();
  };

  UPD.push(() => {
    const mp = M('phase'), base = mp.length, cnt = U.count(mp, (c) => c._ph);
    setLbtns($('#s-radar'), 'phase', cnt);
    const maxPh = Math.max(1, ...cnt.values());

    /* อัปเดต 01A Flight Profile Nodes */
    const lowN = mp.filter((c) => LOW_PHASES.has(c._ph)).length;
    $('#fp-zone-lbl').textContent = `เขตวิกฤตใกล้พื้น (ต่ำกว่าระดับบินเดินทาง): ${U.fmt(lowN)} จาก ${U.fmt(base)} เคส (${pctOf(lowN, base)}%)`;
    $('#fp-ins').innerHTML = `วงแหวนสีแดง = อุบัติเหตุ · สีส้ม = อุบัติการณ์ · แตะโหนดบนเส้นโปรไฟล์เพื่อกรอง`;
    for (const g of $$('#fp-nodes .fp-nd')) {
      const k = g.dataset.ph;
      const list = mp.filter((c) => c._ph === k);
      const n = list.length;
      const acc = list.filter((c) => c.type === 'accident').length;
      const rHalo = n ? 22 + 16 * Math.sqrt(n / maxPh) : 18;
      $('.halo', g).setAttribute('r', f(rHalo));
      $('.cnt', g).textContent = U.fmt(n);
      const pAcc = n ? (acc / n) * 100 : 0;
      $('.arc-inc', g).setAttribute('stroke-dasharray', n ? '100 100' : '0 100');
      $('.arc-acc', g).setAttribute('stroke-dasharray', `${f(pAcc)} 100`);
      g.classList.toggle('z', !n);
      g.classList.toggle('sel', S.phase === k);
      g.setAttribute('aria-pressed', String(S.phase === k));
      g.setAttribute('aria-label', `${PH[k]}: ${n} เคส (อุบัติเหตุ ${acc}, อุบัติการณ์ ${n - acc})`);
    }

    for (const [g, c] of RDP) {
      const fut = !!Y && c.year > Y, off = !match(c, 'y');
      g.classList.toggle('fut', fut);
      g.classList.toggle('off', off);
      c._vis = !fut && !off;
    }
    for (const el of $$('#rd-svg .rd-lab')) {
      const n = cnt.get(el.dataset.ph) || 0;
      el.lastElementChild.textContent = U.fmt(n);
      el.classList.toggle('z', !n);
    }
    for (const el of $$('#rd-svg .rd-hi')) el.classList.toggle('sel', S.phase === el.dataset.ph);
    for (const el of $$('#rd-svg .rd-hit')) {
      const k = el.dataset.ph;
      el.setAttribute('aria-pressed', String(S.phase === k));
      el.setAttribute('aria-label', `ช่วง${U.sp(PH[k])} ${U.fmt(cnt.get(k) || 0)} เคส`);
    }
    setCtr();
    const tp = byN(cnt);
    let h;
    if (!base) h = 'ไม่มีเคสที่ตรงตัวกรอง';
    else if (tp.length === 1) h = `ทั้ง ${U.fmt(base)} เคสเกิดช่วง${U.sp(PH[tp[0][0]])}`;
    else h = `ช่วง${U.sp(PH[tp[0][0]])}และ${U.sp(PH[tp[1][0]])} รวมกัน ${pct(tp[0][1] + tp[1][1], base)}% ของ ${U.fmt(base)} เคส`;
    $('#h-radar').innerHTML = U.tx(h);
    const yin = $('#yr-in'), yv = Y || U.Y1, yt = Y ? `Up to ${Y}` : 'All years';
    yin.value = yv;
    yin.style.setProperty('--p', `${((yv - U.Y0) / (U.Y1 - U.Y0)) * 100}%`);
    yin.setAttribute('aria-valuetext', yt);
    $('#yr-b').innerHTML = Y ? `<small>Up to</small> ${Y}` : '<small>All years</small>'; // คำใช้ --f-d เลขปีใช้ Mono
    const pb = $('#yr-play');
    if (pb.dataset.s !== String(PLAY)) {
      pb.dataset.s = String(PLAY);
      pb.setAttribute('aria-pressed', String(PLAY));
      pb.innerHTML = PLAY ? `${ic('pause', 'sm')}<span>Pause</span>` : `${ic('play', 'sm')}<span>Play ${U.Y1 - U.Y0} years</span>`;
    }
  });

  BIND.push(() => {
    /* Tooltip บนโหนด Flight Profile */
    for (const g of $$('#fp-nodes .fp-nd')) {
      g.addEventListener('pointermove', (e) => {
        if (e.pointerType !== 'mouse') return;
        const k = g.dataset.ph;
        const list = M('phase').filter((c) => c._ph === k);
        const acc = list.filter((c) => c.type === 'accident').length;
        hoverPh(k);
        tip(`<div class="tp-t">ช่วง${esc(U.sp(PH[k]))} (${esc(PH_EN[k])})</div>`
          + `<div class="tp-m">ทั้งหมด <span class="mono">${U.fmt(list.length)}</span> เคส · อุบัติเหตุ <span class="mono">${U.fmt(acc)}</span> · อุบัติการณ์ <span class="mono">${U.fmt(list.length - acc)}</span></div>`
          + `<div class="tp-k">คลิกเพื่อกรองเฉพาะช่วงนี้</div>`, e);
      });
      g.addEventListener('pointerleave', () => { untip(); hoverPh(''); });
    }

    const svg = $('#rd-svg'), box = $('#rd-box');
    RDP = $$('.rd-p', svg).map((g) => [g, BYID.get(g.dataset.id)]);
    const pt = svg.createSVGPoint();
    const at = (ev) => { const m = svg.getScreenCTM(); if (!m) return null; pt.x = ev.clientX; pt.y = ev.clientY; return pt.matrixTransform(m.inverse()); };
    const dotAt = (p) => {
      let best = null, bd = 196;
      for (const [g, c] of RDP) {
        if (!c._vis) continue;
        const dx = c._rd.x - p.x, dy = c._rd.y - p.y, q = dx * dx + dy * dy;
        if (q < bd) { bd = q; best = [g, c]; }
      }
      return best;
    };
    const phAt = (p) => {
      const dx = p.x - RX, dy = p.y - RY, r = Math.hypot(dx, dy);
      if (r < R0 || r > R1 + 40) return '';
      const deg = ((Math.atan2(dy, dx) * 180) / Math.PI + 90 + 360) % 360;
      return ORDER.find((k) => deg >= SEC[k][0] - 1 && deg <= SEC[k][1] + 1) || '';
    };
    let HOV = null, PT = 'mouse';
    const unhov = () => { if (HOV) { HOV[0].firstElementChild.classList.remove('hov'); HOV = null; } };
    svg.addEventListener('pointerdown', (e) => { PT = e.pointerType || 'mouse'; });
    svg.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const p = at(e);
      if (!p) return;
      const d = dotAt(p);
      if (d) {
        if (!HOV || HOV[0] !== d[0]) { unhov(); HOV = d; d[0].firstElementChild.classList.add('hov'); }
        hoverPh(d[1]._ph);
        tip(caseTip(d[1]), e);
      } else { unhov(); untip(); hoverPh(phAt(p)); }
    });
    svg.addEventListener('pointerleave', () => { unhov(); untip(); hoverPh(''); });
    svg.addEventListener('click', (e) => {
      const p = at(e);
      if (!p) return;
      const d = PT === 'mouse' ? dotAt(p) : null;
      if (d) { untip(); openCase(d[1].id, e.target.closest('.rd-hit') || svg); return; }
      const k = phAt(p);
      if (k) toggle('phase', k);
    });
    svg.addEventListener('keydown', (e) => {
      const h = e.target.closest('.rd-hit');
      if (h && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); toggle('phase', h.dataset.ph); }
    });
    svg.addEventListener('focusin', (e) => { const h = e.target.closest('.rd-hit'); if (h) hoverPh(h.dataset.ph); });
    svg.addEventListener('focusout', () => hoverPh(''));
    MQ = matchMedia('(max-width: 760px)');
    onMQ = () => { box.classList.toggle('tight', MQ.matches); svg.setAttribute('viewBox', MQ.matches ? '230 100 700 700' : '0 0 1160 900'); };
    onMQ();
    MQ.addEventListener('change', onMQ);
    const yin = $('#yr-in');
    yin.addEventListener('input', () => { stopPlay(); const v = +yin.value; Y = v >= U.Y1 ? 0 : v; SHOW = 20; update(); });
    $('#yr-play').addEventListener('click', () => { if (PLAY) { stopPlay(); update(); } else startPlay(); });
    if (U.reduced) {
      $('#yr-play').disabled = true;
      $('#yr-note').textContent = 'Autoplay is off (reduced motion) — drag the year slider instead';
    }
  });

  /* ═════ 02 HFACS แผ่นชีส 4 ชั้น + 02B Multi-Stage Alluvial / Sankey Risk Flow ═════ */
  const HX = { O: 300, S: 500, P: 700, A: 900 }, HSX = 70, HSY = 236, OX = 1060, OY = { accident: 216, incident: 346 };
  const hfLib = { coded: {}, unc: {} };
  {
    const rk = (a, b) => (a.type === b.type ? 0 : a.type === 'accident' ? -1 : 1) || a.year - b.year || a.id.localeCompare(b.id);
    const sorted = [...C].sort(rk);
    sorted.forEach((c, i) => { c._hr = i; c._hy = {}; });
    for (const t of TK) {
      const cd = sorted.filter((c) => c._tiers.includes(t)), un = sorted.filter((c) => !c._tiers.includes(t));
      hfLib.coded[t] = cd.length;
      hfLib.unc[t] = un.length;
      const ry = cd.length * 0.4;
      cd.forEach((c, i) => { c._hy[t] = HSY - ry + (i + 0.5) * 0.8; });
      un.forEach((c, i) => { c._hy[t] = 404 + (i + 0.5) * 0.8; });
    }
  }
  const hfRy = (t) => Math.max(4, hfLib.coded[t] * 0.4);
  const seg = (x0, y0, x1, y1) => { const m = f((x0 + x1) / 2); return `C${m} ${f(y0)},${m} ${f(y1)},${x1} ${f(y1)}`; };
  const strand = (ys, oy) => {
    let d = `M${HSX} ${HSY}`, x = HSX, y = HSY;
    for (const t of TK) { d += seg(x, y, HX[t], ys[t]); x = HX[t]; y = ys[t]; }
    return d + seg(x, y, OX, oy);
  };
  const hfSvg = () => {
    const gr = (id, col) => `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="870" y1="0" x2="${OX}" y2="0"><stop offset="0" style="stop-color:var(--ov-hf0)"/><stop offset="1" style="stop-color:${col}"/></linearGradient>`;
    let s = `<defs>${gr('g-acc', 'var(--ov-acc)')}${gr('g-inc', 'var(--ov-inc)')}</defs>`;
    for (const t of TK) {
      const x = HX[t], lh = hfLib.unc[t] * 0.8;
      s += `<text class="hf-tk" x="${x}" y="30">${t}</text><text class="hf-tn" x="${x}" y="54">${esc(TIER[t].th)}</text>`
        + `<text class="hf-tc" x="${x}" y="80">ลงรหัส <tspan data-hc="${t}">0</tspan></text>`
        + `<polygon class="hf-pl" points="${x - 20},112 ${x + 20},96 ${x + 20},360 ${x - 20},376"/>`
        + `<ellipse class="hf-hole" cx="${x}" cy="${HSY}" rx="12" ry="${f(hfRy(t))}" style="pointer-events:none"/>`
        + `<rect class="hf-lane" x="${x - 20}" y="404" width="40" height="${f(lh)}" rx="4"/>`
        + `<text class="hf-tc" x="${x}" y="${f(404 + lh + 26)}">ไม่ระบุ <tspan data-hu="${t}">0</tspan></text>`;
    }
    s += `<g>${C.map((c) => `<path class="hf-s ${tcls(c.type)}" data-id="${c.id}" pathLength="100" style="--d:${f((c._hr / N) * 0.8)}s" d="${strand(c._hy, OY[c.type])}"/>`).join('')}</g>`;
    s += `<circle class="hf-ping" cx="${HSX}" cy="${HSY}" r="9"/><circle class="hf-src" cx="${HSX}" cy="${HSY}" r="7"/>`
      + `<text class="hf-sl" x="${HSX}" y="166">เคสที่ตรงตัวกรอง</text><text class="hf-sn" id="hf-sn" x="${HSX}" y="206">0</text>`;
    for (const t of TYPES) {
      s += `<circle class="hf-out ${tcls(t)}" cx="${OX}" cy="${OY[t]}" r="9"/><text class="hf-ol" x="1078" y="${OY[t] + 6}">${U.TYPE[t]}</text>`
        + `<text class="hf-on" id="hf-on-${t}" x="1078" y="${OY[t] + 34}">0</text>`;
    }
    s += FULL.map((c, i) => {
      const y = HSY + (i - (FULL.length - 1) / 2) * 4, d = strand({ O: y, S: y, P: y, A: y }, OY[c.type]);
      return `<g class="hf-fc" data-open="${c.id}" role="button" tabindex="0" aria-label="${esc(`${c.year} ${c.title} — ลงรหัสครบ 4 ชั้น เปิดเคส`)}">`
        + `<path class="w" d="${d}"/><path class="l" d="${d}"/><path class="k" d="${d}"/></g>`;
    }).join('');
    s += TK.map((t) => `<ellipse class="hf-hole" cx="${HX[t]}" cy="${HSY}" rx="12" ry="${f(hfRy(t))}" style="fill:transparent" role="button" tabindex="0" data-k="hf" data-v="tier:${t}" aria-pressed="false" aria-label="กรองเฉพาะเคสที่ลงรหัสชั้น ${t} ${esc(TIER[t].th)}"/>`).join('');
    return s;
  };

  HTML.push(`<section class="sec wrap" id="s-hfacs" aria-labelledby="h-hfacs">
  ${head('02', 'hfacs', '', 'แต่ละเส้นคือหนึ่งเคส ลากผ่านแผ่นชีส 4 ชั้นของ HFACS — ผ่านรูเมื่อรายงานระบุปัจจัยในชั้นนั้น ผ่านช่องเส้นประเมื่อไม่ได้ระบุ แล้วไปจบที่อุบัติเหตุหรืออุบัติการณ์ แตะรูหรือชื่อปัจจัยเพื่อกรองทั้งหน้า')}
  <div class="hf-card glass rv">
    <p class="ins" id="hf-ins"></p>
    <div class="hf-fig"><svg class="hf" id="hf-svg" viewBox="0 0 1180 620" role="group" aria-label="แผ่นชีส HFACS 4 ชั้น — เลือกรูเพื่อกรองตามชั้น">${hfSvg()}</svg></div>
    <div class="hf-fcl"><span class="fb-l">เคสที่ลงรหัสครบ 4 ชั้น</span>${FULL.map((c) => `<button type="button" class="fcb" data-open="${c.id}" data-fk="fc-${c.id}" title="${esc(c.title)}"><span class="mono">${c.year}</span><span class="t">${esc(c.title)}</span></button>`).join('')}</div>
    <div class="cb">${TK.map((t) => `<div><button type="button" class="cb-t" data-k="hf" data-v="tier:${t}" data-fk="hf-tier:${t}" aria-pressed="false"><b>${t}</b><span>${esc(TIER[t].th)}</span><span class="n">0</span></button>`
      + TIER[t].cats.map((k) => lbtn('hf', k, esc(HF[k]))).join('') + '</div>').join('')}</div>
    <div class="cav"><span class="chip draft">รหัส HFACS ฉบับร่าง</span><span>${ic('info', 'sm')}<span>ชั้นที่ไม่ได้ลงรหัสหมายถึง<b>รายงานไม่ได้ระบุ</b> ไม่ได้แปลว่าไม่มีปัญหาในชั้นนั้น</span></span></div>
  </div>
  <!-- NEW 02B: Multi-Stage Alluvial / Sankey Risk Flow -->
  <div class="sk-card glass rv" id="sk-card">
    <div class="sk-top">
      <h3><span class="chip votd">02B · ALLUVIAL RISK FLOW</span><span>แผนภาพแอลลูเวียล 4 มิติ: สภาพแวดล้อม → ช่วงบิน → ชั้น HFACS → ผลลัพธ์</span></h3>
      <span class="ins" style="margin:0">ชี้ที่แถบไหลเพื่อไล่ดูทั้งชั้น · คลิกชื่อหรือแท่งใดก็ได้เพื่อกรองทั้งหน้า</span>
    </div>
    <div class="sk-lg" id="sk-lg"><span class="sk-lg-t">สีของแถบไหล = ชั้นปัจจัยมนุษย์หลักของเคส</span>${SK_T.map((t) => `<span class="sk-lg-i" data-t="${t}"><i style="background:var(--sk-${t})"></i>${esc(skTier(t))}</span>`).join('')}</div>
    <div class="sk-w">
      <svg class="sk-svg" id="sk-svg" viewBox="0 0 1140 440" role="group" aria-label="แผนภาพแอลลูเวียลความเสี่ยง 4 มิติ"></svg>
    </div>
  </div>
</section>`);

  /* 02B แผนภาพแอลลูเวียล: คำนวณสดจากเคส M() ทุกครั้งที่ตัวกรองเปลี่ยน
     แท่งโหนดบาง 12px · แถบไหลทึบกว้างตามจำนวนเคส · สีแถบไหล = ชั้น HFACS หลักของเคส (SK_T)
     ช่วงสุดท้ายไล่สีจากชั้นไปเป็นสีผลลัพธ์ · ป้ายชื่อมีขอบสีพื้นเพื่อให้อ่านได้เมื่อทับแถบไหล */
  const SK_X = [210, 485, 760, 1000], SK_BW = 12, SK_TOP = 58, SK_BOT = 428, SK_GAP = 8;
  const SK_TI = Object.fromEntries(SK_T.map((t, i) => [t, i]));
  const hfOfC = (c) => SK_T.find((t) => c._tiers.includes(t)) || 'N';
  const drawSankey = (m) => {
    const svg = $('#sk-svg');
    if (!svg) return;
    const fid = R.activeElement?.closest?.('.sk-node')?.dataset.nid;
    svg.classList.remove('dim');
    const tierN = U.count(m, hfOfC);
    for (const el of $$('#sk-lg .sk-lg-i')) el.classList.toggle('off', !tierN.get(el.dataset.t));
    const T = m.length;
    svg.dataset.n = T;
    if (!T) {
      svg.innerHTML = '<text class="sk-empty" x="570" y="230" text-anchor="middle">ไม่มีเคสที่ตรงตัวกรอง</text>';
      return;
    }
    // คอลัมน์ 1–2: 5 อันดับแรกตามจำนวนเคส ที่เหลือรวมเป็น "อื่น ๆ" ไว้ล่างสุด
    const topEnvs = byN(U.count(m, (c) => c.environment.filter((e) => e !== 'ALL'))).slice(0, 5).map(([k]) => k);
    const envOfC = (c) => c.environment.find((e) => topEnvs.includes(e)) || 'OTHER_ENV';
    const topPhs = byN(U.count(m, (c) => c._ph)).slice(0, 5).map(([k]) => k);
    const phOfC = (c) => (topPhs.includes(c._ph) ? c._ph : 'OTHER_PH');
    const cols = [
      { title: '1. สภาพแวดล้อม', sub: 'Environment', fk: 'env', fn: envOfC, label: (k) => (k === 'OTHER_ENV' ? 'สภาพอื่น / ไม่เจาะจง' : ENV[k] || k) },
      { title: '2. ช่วงของเที่ยวบิน', sub: 'Phase of Flight', fk: 'phase', fn: phOfC, label: (k) => (k === 'OTHER_PH' ? 'ช่วงอื่น ๆ' : PH[k] || k) },
      { title: '3. ชั้นปัจจัยมนุษย์หลัก', sub: 'Primary HFACS Tier', fk: 'hf', fn: hfOfC, label: skTier, fixed: SK_T },
      { title: '4. ผลลัพธ์', sub: 'Outcome', fk: 'type', fn: (c) => c.type, label: (k) => U.TYPE[k], fixed: TYPES },
    ];
    // โหนด: มาตราส่วนเดียวทุกคอลัมน์ (ทุกคอลัมน์รวมได้ T เคส) แถบไหลจึงกว้างเท่ากันทั้งสองปลาย
    const H = SK_BOT - SK_TOP;
    const keys = cols.map((col) => {
      const cnt = U.count(m, col.fn);
      const ks = col.fixed ? col.fixed.filter((k) => cnt.get(k)) : byN(cnt).map(([k]) => k).sort((a, b) => a.startsWith('OTHER_') - b.startsWith('OTHER_'));
      return { cnt, ks };
    });
    const sc = (H - SK_GAP * (Math.max(...keys.map((x) => x.ks.length)) - 1)) / T;
    const nodes = keys.map(({ cnt, ks }, ci) => {
      const gap = ks.length > 1 ? (H - T * sc) / (ks.length - 1) : 0;
      let y = ks.length > 1 ? SK_TOP : SK_TOP + (H - T * sc) / 2;
      return new Map(ks.map((key, i) => {
        const n = cnt.get(key), nd = { key, i, n, h: n * sc, y, ci, oy: y, iy: y };
        y += nd.h + gap;
        return [key, nd];
      }));
    });
    // แถบไหล: รวมตาม ต้นทาง|ปลายทาง|ชั้นหลัก แล้วเรียงซ้อนในโหนดตามลำดับโหนดฝั่งตรงข้าม → ชั้น
    const ribs = [];
    for (let ci = 0; ci < 3; ci++) {
      const agg = new Map();
      for (const c of m) {
        const key = `${cols[ci].fn(c)}|${cols[ci + 1].fn(c)}|${hfOfC(c)}`;
        agg.set(key, (agg.get(key) || 0) + 1);
      }
      const ls = [...agg].map(([key, n]) => {
        const [ka, kb, t] = key.split('|');
        return { ci, a: nodes[ci].get(ka), b: nodes[ci + 1].get(kb), t, n, w: n * sc };
      });
      ls.sort((p, q) => p.a.i - q.a.i || p.b.i - q.b.i || SK_TI[p.t] - SK_TI[q.t]);
      for (const l of ls) { l.y0 = l.a.oy; l.a.oy += l.w; }
      ls.sort((p, q) => p.b.i - q.b.i || p.a.i - q.a.i || SK_TI[p.t] - SK_TI[q.t]);
      for (const l of ls) { l.y1 = l.b.iy; l.b.iy += l.w; }
      ribs.push(...ls);
    }
    const ribD = (l) => {
      const x0 = SK_X[l.ci] + SK_BW, x1 = SK_X[l.ci + 1], xm = f((x0 + x1) / 2);
      const a0 = f(l.y0), a1 = f(l.y0 + l.w), b0 = f(l.y1), b1 = f(l.y1 + l.w);
      return `M${x0} ${a0}C${xm} ${a0} ${xm} ${b0} ${x1} ${b0}L${x1} ${b1}C${xm} ${b1} ${xm} ${a1} ${x0} ${a1}Z`;
    };
    const defs = '<defs>' + SK_T.flatMap((t) => TYPES.map((ty) => `<linearGradient id="skg-${t}-${tcls(ty)}"><stop offset=".3" style="stop-color:var(--sk-${t})"/><stop offset="1" style="stop-color:var(--ov-${tcls(ty)})"/></linearGradient>`)).join('') + '</defs>';
    const hd = cols.map((col, ci) => {
      const x = ci === 0 ? SK_X[0] + SK_BW : SK_X[ci], a = ci === 0 ? ' text-anchor="end"' : '';
      return `<text class="sk-col-h" x="${x}" y="22"${a}>${col.title}</text><text class="sk-col-sub" x="${x}" y="40"${a}>${col.sub}</text>`;
    }).join('');
    const rh = ribs.map((l) => `<path class="sk-rib" d="${ribD(l)}" data-t="${l.t}" data-na="${l.ci}:${esc(l.a.key)}" data-nb="${l.ci + 1}:${esc(l.b.key)}"`
      + ` data-a="${esc(cols[l.ci].label(l.a.key))}" data-b="${esc(cols[l.ci + 1].label(l.b.key))}" data-n="${l.n}"`
      + ` style="fill:${l.ci === 2 ? `url(#skg-${l.t}-${tcls(l.b.key)}) ` : ''}var(--sk-${l.t})"/>`).join('');
    // ป้ายชื่อ: คอลัมน์แรกอยู่ซ้ายแท่ง ที่เหลืออยู่ขวาแท่ง · 2 บรรทัดเมื่อโหนดสูงพอ · ดันป้ายที่ชนกันออกจากกัน
    const barC = (ci, k) => (ci === 2 ? `var(--sk-${k})` : ci === 3 ? `var(--ov-${tcls(k)})` : 'var(--ov-hf0)');
    let nh = '';
    nodes.forEach((map, ci) => {
      const col = cols[ci], x = SK_X[ci], left = ci === 0;
      const tx = left ? x - 9 : x + SK_BW + 9, anc = left ? 'end' : 'start';
      const items = [...map.values()].map((nd) => {
        const two = nd.h >= 40, lh = two ? 40 : 22;
        return { nd, two, lh, top: nd.y + nd.h / 2 - lh / 2 };
      });
      for (let i = 1; i < items.length; i++) items[i].top = Math.max(items[i].top, items[i - 1].top + items[i - 1].lh + 1);
      const last = items[items.length - 1];
      last.top = Math.min(last.top, SK_BOT + 8 - last.lh);
      for (let i = items.length - 2; i >= 0; i--) items[i].top = Math.min(items[i].top, items[i + 1].top - items[i].lh - 1);
      for (const { nd, two, top } of items) {
        const fv = col.fk === 'hf' ? `tier:${nd.key}` : nd.key;
        const can = !nd.key.startsWith('OTHER_') && nd.key !== 'N', on = can && S[col.fk] === fv;
        const nm = col.label(nd.key), bh = Math.max(3, nd.h), by = nd.y + nd.h / 2 - bh / 2;
        const tA = `x="${tx}" text-anchor="${anc}"`;
        nh += `<g class="sk-node${on ? ' sel' : ''}" data-nid="${ci}:${esc(nd.key)}"${ci === 2 ? ` data-t="${nd.key}"` : ''} data-l="${esc(nm)}" data-n="${nd.n}"`
          + (can ? ` data-k="${col.fk}" data-v="${esc(fv)}" role="button" tabindex="0" aria-pressed="${on}" aria-label="${esc(`${nm} ${U.fmt(nd.n)} เคส`)}"` : '')
          + ` style="--c:${barC(ci, nd.key)}"><rect class="hit"/><rect class="bar" x="${x}" y="${f(by)}" width="${SK_BW}" height="${f(bh)}"/>`
          + (two
            ? `<text class="nm" ${tA} y="${f(top + 15)}">${esc(nm)}</text><text class="cnt" ${tA} y="${f(top + 35)}">${U.fmt(nd.n)} เคส · ${pctOf(nd.n, T)}%</text>`
            : `<text class="nm" ${tA} y="${f(top + 16)}">${esc(nm)}<tspan class="cnt" dx="7">${U.fmt(nd.n)}</tspan></text>`)
          + '</g>';
      }
    });
    svg.innerHTML = defs + hd + `<g class="sk-ribs">${rh}</g>` + nh;
    // พื้นที่คลิกของโหนด = แท่ง + ป้ายชื่อ (วัดจากที่วาดจริง)
    for (const g of $$('.sk-node', svg)) {
      try {
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        for (const el of g.querySelectorAll('.bar, text')) {
          const b = el.getBBox();
          x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y); x1 = Math.max(x1, b.x + b.width); y1 = Math.max(y1, b.y + b.height);
        }
        const r = g.firstElementChild;
        r.setAttribute('x', f(x0 - 4)); r.setAttribute('y', f(y0 - 3));
        r.setAttribute('width', f(x1 - x0 + 8)); r.setAttribute('height', f(y1 - y0 + 6));
      } catch { /* ยังไม่แสดงผลบนจอ */ }
    }
    if (fid) $(`.sk-node[data-nid="${CSS.escape(fid)}"]`, svg)?.focus();
  };

  let HFS = [], HFC = [];
  UPD.push(() => {
    const m = M(), n = m.length, mh = M('hf'), svg = $('#hf-svg');
    for (const [p, c] of HFS) p.classList.toggle('off', !match(c));
    svg.style.setProperty('--sa', f(Math.min(0.5, Math.max(0.14, 0.14 * Math.sqrt(N / Math.max(1, n)))) * 100) / 100);
    const tc = U.count(m, (c) => c._tiers);
    for (const t of TK) {
      $(`[data-hc="${t}"]`, svg).textContent = U.fmt(tc.get(t) || 0);
      $(`[data-hu="${t}"]`, svg).textContent = U.fmt(n - (tc.get(t) || 0));
    }
    $('#hf-sn').textContent = U.fmt(n);
    for (const t of TYPES) $(`#hf-on-${t}`).textContent = U.fmt(m.filter((c) => c.type === t).length);
    for (const el of $$('.hf-hole[role]', svg)) {
      const on = S.hf === el.dataset.v;
      el.classList.toggle('on', on);
      el.setAttribute('aria-pressed', String(on));
    }
    for (const [g, c] of HFC) g.classList.toggle('off', !match(c));
    for (const b of $$('#s-hfacs .fcb')) b.classList.toggle('off', !match(BYID.get(b.dataset.open)));
    const mt = U.count(mh, (c) => c._tiers), mc = U.count(mh, (c) => c._cats);
    for (const b of $$('#s-hfacs .cb-t')) {
      b.querySelector('.n').textContent = U.fmt(mt.get(b.dataset.v[5]) || 0);
      b.setAttribute('aria-pressed', String(S.hf === b.dataset.v));
    }
    setLbtns($('#s-hfacs'), 'hf', mc);
    const k = m.filter((c) => c._full).length;
    let h;
    if (!n) h = 'ไม่มีเคสที่ตรงตัวกรอง';
    else if (!k) h = `ไม่มีเคสใดใน ${U.fmt(n)} เคสที่ลงรหัสครบทั้ง 4 ชั้น`;
    else if (k === n) h = `ทั้ง ${U.fmt(n)} เคสลงรหัสครบทั้ง 4 ชั้น`;
    else h = `มีเพียง ${U.fmt(k)} จาก ${U.fmt(n)} เคสที่ลงรหัสครบทั้ง 4 ชั้น`;
    $('#h-hfacs').innerHTML = U.tx(h);
    const [t1, t2] = byN(mc);
    $('#hf-ins').innerHTML = t1
      ? `ปัจจัยที่พบบ่อยที่สุดคือ <b>${esc(HF[t1[0]])}</b> <span class="mono">${U.fmt(t1[1])}</span> เคส (<span class="mono">${pctOf(t1[1], mh.length)}%</span>)`
        + (t2 ? ` · รองลงมา <b>${esc(HF[t2[0]])}</b> <span class="mono">${U.fmt(t2[1])}</span> เคส` : '')
      : 'ไม่มีเคสที่ลงรหัส HFACS ในตัวกรองนี้';

    drawSankey(m);
  });

  BIND.push(() => {
    const svg = $('#hf-svg');
    HFS = $$('.hf-s', svg).map((p) => [p, BYID.get(p.dataset.id)]);
    HFC = $$('.hf-fc', svg).map((g) => [g, BYID.get(g.dataset.open)]);
    const fcbs = $$('#s-hfacs .fcb');
    const hov = (id, on, anchor) => {
      svg.classList.toggle('dim', on);
      for (const [g] of HFC) g.classList.toggle('hov', on && g.dataset.open === id);
      for (const b of fcbs) b.classList.toggle('hov', on && b.dataset.open === id);
      if (on && anchor) tip(caseTip(BYID.get(id)), anchor); else untip();
    };
    for (const [g, c] of HFC) {
      g.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') hov(c.id, true, e); });
      g.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') tip(caseTip(c), e); });
      g.addEventListener('pointerleave', () => hov(c.id, false));
      g.addEventListener('focus', () => hov(c.id, true, g));
      g.addEventListener('blur', () => hov(c.id, false));
    }
    for (const b of fcbs) {
      b.addEventListener('pointerenter', () => hov(b.dataset.open, true));
      b.addEventListener('pointerleave', () => hov(b.dataset.open, false));
      b.addEventListener('focus', () => hov(b.dataset.open, true));
      b.addEventListener('blur', () => hov(b.dataset.open, false));
    }

    /* 02B: ชี้แถบไหลหรือชั้น HFACS = ไล่ทั้งชั้น · ชี้โหนดอื่น = แถบไหลที่เข้า–ออกโหนดนั้น */
    const skSvg = $('#sk-svg'), skLg = $('#sk-lg');
    const skOn = (t, nid, hot) => {
      const on = !!(t || nid);
      skSvg.classList.toggle('dim', on);
      skLg.classList.toggle('dim', !!t);
      for (const p of $$('.sk-rib', skSvg)) {
        p.classList.toggle('hi', on && (t ? p.dataset.t === t : p.dataset.na === nid || p.dataset.nb === nid));
        p.classList.toggle('hot', p === hot);
      }
      for (const el of $$('.sk-lg-i', skLg)) el.classList.toggle('hi', !!t && el.dataset.t === t);
      for (const g of $$('.sk-node', skSvg)) g.classList.toggle('hi', !!nid && g.dataset.nid === nid);
    };
    const skNode = (g) => skOn(g.dataset.t, g.dataset.t ? null : g.dataset.nid);
    const skNodeTip = (g) => `<div class="tp-t">${esc(g.dataset.l)}</div>`
      + `<div class="tp-m"><span class="mono">${U.fmt(+g.dataset.n)}</span> เคส · <span class="mono">${pctOf(+g.dataset.n, +skSvg.dataset.n)}%</span> ของเคสที่แสดง${g.dataset.k ? ' · คลิกเพื่อกรอง' : ''}</div>`;
    const skRibTip = (p) => `<div class="tp-t">${esc(p.dataset.a)} → ${esc(p.dataset.b)}</div>`
      + `<div class="tp-m"><span class="mono">${U.fmt(+p.dataset.n)}</span> เคส · ชั้นหลัก ${esc(skTier(p.dataset.t))}</div>`;
    let skCur = null;
    skSvg.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const g = e.target.closest('.sk-node'), p = !g && e.target.closest('.sk-rib');
      const cur = g || p || null;
      if (cur !== skCur) {
        skCur = cur;
        if (g) skNode(g); else if (p) skOn(p.dataset.t, null, p); else skOn();
      }
      if (g) tip(skNodeTip(g), e); else if (p) tip(skRibTip(p), e); else untip();
    });
    skSvg.addEventListener('pointerleave', () => { skCur = null; skOn(); untip(); });
    skSvg.addEventListener('focusin', (e) => { const g = e.target.closest('.sk-node'); if (g) { skNode(g); tip(skNodeTip(g), g); } });
    skSvg.addEventListener('focusout', () => { skOn(); untip(); });
    for (const el of $$('.sk-lg-i', skLg)) {
      el.addEventListener('pointerenter', () => skOn(el.dataset.t));
      el.addEventListener('pointerleave', () => skOn());
    }
  });

  /* ═════ 03 ตารางความร้อน: แถว = สภาพแวดล้อม · คอลัมน์ = ช่วงของเที่ยวบิน ═════ */
  const FAM = { H225M: 'รวม AS332 · EC225 · Cougar · Puma', B412EP: 'รวม Bell 412 · CH146 Griffon', 'S-92': 'รวม CH148 Cyclone', H135: 'รวม EC135', 'S-70I': 'รวม UH-60 · SH-60J' };
  const MTN = C.filter((c) => c.environment.includes('MOUNTAIN'));
  const MTN_JP = MTN.filter((c) => c._jp).length;
  const htPh = (k) => esc(PH[k]) + en(PH_EN[k]);
  const envIn = (k) => (k === 'DAY_VMC' ? 'ในวันที่อากาศดี' : k === 'ALL' ? 'ในเคสที่ไม่ระบุสภาพเจาะจง' : `ในสภาพ${U.sp(ENV[k])}`);
  HTML.push(`<section class="sec wrap" id="s-env" aria-labelledby="h-env">
  ${head('03', 'env', '', 'แถวคือสภาพแวดล้อม คอลัมน์คือช่วงของเที่ยวบิน — ยิ่งเข้มยิ่งมีเคสมาก แตะช่องเพื่อกรองทั้งสองอย่างพร้อมกัน หรือแตะหัวแถว/หัวคอลัมน์เพื่อกรองอย่างเดียว')}
  <div class="ht-card glass rv">
    <p class="ins" id="ht-ins"></p>
    <div class="ht-w"><table class="ht" id="ht"><caption class="sr">จำนวนเคสแยกตามสภาพแวดล้อมและช่วงของเที่ยวบิน</caption>
      <thead><tr><th scope="col"><span class="sr">สภาพแวดล้อม</span></th>${ORDER.map((k) => `<th scope="col"><button type="button" class="ht-h" data-k="phase" data-v="${k}" data-fk="htp-${k}" aria-pressed="false">${htPh(k)}</button></th>`).join('')}<th scope="col"><span class="ht-hx">รวม</span></th></tr></thead>
      <tbody>${ENV_ROWS.map((e) => `<tr><th scope="row"><button type="button" class="ht-h" data-k="env" data-v="${e}" data-fk="hte-${e}" aria-pressed="false">${esc(envName(e))}${en(ENV_EN[e])}</button></th>`
        + ORDER.map((k) => `<td><button type="button" class="ht-c" data-ph="${k}" data-env="${e}" data-fk="ht-${e}-${k}" aria-pressed="false">·</button></td>`).join('')
        + `<td class="ht-t" data-rt="${e}">0</td></tr>`).join('')}</tbody>
      <tfoot><tr><th scope="row">จำนวนเคส</th>${ORDER.map((k) => `<td class="ht-t" data-ct="${k}">0</td>`).join('')}<td class="ht-t" id="ht-tt">0</td></tr></tfoot>
    </table></div>
    <div class="ht-lg" aria-hidden="true"><span>น้อย</span><span class="ramp"></span><span>มาก</span></div>
    <div class="cav"><span>${ic('info', 'sm')}<span>นับจำนวนเคสในคลัง ไม่ใช่อัตราต่อชั่วโมงบิน · หนึ่งเคสอยู่ได้หลายแถวเพราะระบุได้หลายสภาพ</span></span>${MTN.length ? `<span>${ic('globe', 'sm')}<span>ภูเขา <b>${U.fmt(MTN_JP)}</b> จาก ${U.fmt(MTN.length)} เคสมาจากรายงานของญี่ปุ่น</span></span>` : ''}</div>
  </div>
</section>`);

  let HTC = [];
  UPD.push(() => {
    const m2 = M('phase', 'env'), cell = new Map(), rt = new Map(), ct = new Map();
    for (const c of m2) {
      ct.set(c._ph, (ct.get(c._ph) || 0) + 1);
      for (const e of new Set(c.environment)) {
        const key = `${e}|${c._ph}`;
        cell.set(key, (cell.get(key) || 0) + 1);
        rt.set(e, (rt.get(e) || 0) + 1);
      }
    }
    const max = Math.max(1, ...cell.values());
    $('#ht').classList.toggle('sel', !!(S.phase || S.env));
    for (const b of HTC) {
      const k = b.dataset.ph, e = b.dataset.env, n = cell.get(`${e}|${k}`) || 0;
      let a = 0.06 + 0.74 * Math.sqrt(n / max);
      if (a >= 0.52 && a < 0.64) a = 0.64;
      b.textContent = n ? U.fmt(n) : '·';
      b.disabled = !n;
      b.style.setProperty('--a', n ? a.toFixed(3) : '0.06');
      b.classList.toggle('dk', !!n && a >= 0.64);
      b.classList.toggle('hit', (!S.phase || k === S.phase) && (!S.env || e === S.env));
      b.setAttribute('aria-pressed', String(S.phase === k && S.env === e));
      b.setAttribute('aria-label', `${envName(e)} · ช่วง${U.sp(PH[k])} ${U.fmt(n)} เคส`);
      b.dataset.n = n;
      b.dataset.r = rt.get(e) || 0;
    }
    for (const b of $$('#ht .ht-h')) b.setAttribute('aria-pressed', String(S[b.dataset.k] === b.dataset.v));
    for (const td of $$('#ht [data-rt]')) td.textContent = U.fmt(rt.get(td.dataset.rt) || 0);
    for (const td of $$('#ht [data-ct]')) td.textContent = U.fmt(ct.get(td.dataset.ct) || 0);
    $('#ht-tt').textContent = U.fmt(m2.length);

    const me = M('env'), ne = me.length, ec = U.count(me, (c) => c.environment);
    ec.delete('ALL');
    const t1 = byN(ec)[0];
    let h;
    if (!ne) h = 'ไม่มีเคสที่ตรงตัวกรอง';
    else if (!t1) h = `ทั้ง ${U.fmt(ne)} เคสไม่ได้ระบุสภาพแวดล้อมที่เจาะจง`;
    else if (t1[1] === ne) h = ne === 1 ? `เคสที่ตรงตัวกรองเกิด${envIn(t1[0])}` : `ทั้ง ${U.fmt(ne)} เคสเกิด${envIn(t1[0])}`;
    else {
      const r = t1[1] / ne, p = pct(t1[1], ne);
      if (t1[0] === 'DAY_VMC' && r >= 0.4) h = `${r > 0.505 ? 'มากกว่าครึ่ง' : r >= 0.495 ? 'ครึ่งหนึ่ง' : 'เกือบครึ่ง'} (${p}%) ของ ${U.fmt(ne)} เคสเกิดในวันที่อากาศดี`;
      else h = `สภาพที่พบมากที่สุดคือ${U.sp(ENV[t1[0]])} — ${p}% ของ ${U.fmt(ne)} เคส`;
    }
    $('#h-env').innerHTML = U.tx(h);
    const e2 = U.count(m2, (c) => c.environment);
    e2.delete('ALL');
    const ie = S.env || (byN(e2)[0] || [''])[0], il = ie ? m2.filter((c) => c.environment.includes(ie)) : [];
    const ip = byN(U.count(il, (c) => c._ph))[0];
    $('#ht-ins').innerHTML = ip
      ? `${esc(envIn(ie))} ช่วงที่พบมากที่สุดคือ <b>${esc(PH[ip[0]])}</b> <span class="mono">${U.fmt(ip[1])}</span> จาก <span class="mono">${U.fmt(il.length)}</span> เคส`
      : 'ไม่มีเคสในตัวกรองนี้';
  });

  BIND.push(() => {
    const tb = $('#ht');
    HTC = $$('.ht-c', tb);
    tb.addEventListener('click', (e) => {
      const b = e.target.closest('.ht-c');
      if (!b || b.disabled) return;
      const { ph, env } = b.dataset;
      setF(S.phase === ph && S.env === env ? { phase: '', env: '' } : { phase: ph, env });
    });
    tb.addEventListener('pointermove', (e) => {
      const b = e.target.closest('.ht-c');
      if (!b || e.pointerType !== 'mouse') { untip(); return; }
      const n = +b.dataset.n;
      tip(`<div class="tp-t">${esc(envName(b.dataset.env))} × ${esc(PH[b.dataset.ph])}</div>`
        + `<div class="tp-m"><span class="mono">${U.fmt(n)}</span> เคส · <span class="mono">${pctOf(n, +b.dataset.r)}%</span> ของแถวนี้</div>`
        + `<div class="tp-k">${n ? 'คลิกเพื่อกรองทั้งสองอย่าง' : 'ไม่มีเคสในช่องนี้'}</div>`, e);
    });
    tb.addEventListener('pointerleave', untip);
  });

  /* ═════ 04 Waffle รายปี + 04B Operational Hazard DNA Barcode Matrix ═════ */
  let WMODE = 'type';
  const WQ = new Map(), WST = new Map(), WT = new Map();
  const WX = (y) => 40 + (y - U.Y0) * 21;
  const WBY = new Map(YRS.map((y) => [y, C.filter((c) => c.year === y)]));
  const WALL = new Set(C);
  const wfKey = (c) => (WMODE === 'type' ? (c.type === 'accident' ? 0 : 1) : c._jp ? 0 : 1);
  const wfSort = (list, on) => [...list].sort((a, b) => (on.has(b) - on.has(a)) || wfKey(a) - wfKey(b) || a.id.localeCompare(b.id));
  const OTH_Y0 = Math.min(...C.filter((c) => !c._jp).map((c) => c.year));
  const wfSvg = () => {
    let s = '<line class="wf-gr" x1="38" x2="1112" y1="362.5" y2="362.5"/>';
    for (let n = 5; n <= YMAX; n += 5) s += `<line class="wf-gr" x1="38" x2="1112" y1="${362 - 21 * n}" y2="${362 - 21 * n}"/><text class="wf-gl" x="34" y="${362 - 21 * n + 4.5}">${n}</text>`;
    s += YRS.filter((y) => y % 5 === 0).map((y) => `<text class="wf-yl" x="${WX(y) + 9.5}" y="384">${y}</text>`).join('');
    s += '<g>';
    for (const [y, list] of WBY) {
      wfSort(list, WALL).forEach((c, k) => {
        const t = `translate(${WX(y)}px,${342 - 21 * k}px)`;
        WT.set(c.id, t);
        s += `<rect class="wf-sq ${tcls(c.type)} ${c._jp ? 'jp' : 'oth'}" data-id="${c.id}" width="19" height="19" rx="3" style="transform:${t}"/>`;
      });
    }
    return `${s}</g><g class="wf-pk" id="wf-pk" style="display:none"><line/><text/></g>`;
  };
  const ck = ic('check', 'xs ck');
  HTML.push(`<section class="sec wrap" id="s-years" aria-labelledby="h-years">
  ${head('04', 'years', '', 'แต่ละช่องคือหนึ่งเคส วางเรียงตามปีที่เกิดเหตุ — เลือกให้สีบอกประเภทเหตุ หรือประเทศของหน่วยงานสอบสวน ชี้หรือแตะช่องเพื่ออ่านเคส')}
  <div class="wf-card glass rv">
    <div class="wf-top"><div class="wf-lg" id="wf-lg"></div>
      <div class="fb-g"><span class="fb-l" id="wf-ml">สีตาม</span><div class="seg sm" id="wf-mode" role="group" aria-labelledby="wf-ml"><button type="button" data-mode="type" aria-pressed="true">ประเภทเหตุ${ck}</button><button type="button" data-mode="cty" aria-pressed="false">ประเทศ${ck}</button></div></div></div>
    <div class="wf-w"><svg class="wf" id="wf-svg" data-mode="type" viewBox="0 0 1140 400" role="img" aria-label="หนึ่งช่องต่อหนึ่งเคส เรียงตามปี ${U.Y0}–${U.Y1} รายการเคสด้านล่างมีข้อมูลเดียวกัน">${wfSvg()}</svg></div>
    <div class="cav"><span>${ic('info', 'sm')}<span>จำนวนเคสต่อปีในคลัง ไม่ใช่แนวโน้มการเกิดเหตุ</span></span>${Number.isFinite(OTH_Y0) ? `<span>${ic('globe', 'sm')}<span>เคสจากประเทศอื่นนอกจากญี่ปุ่นเริ่มตั้งแต่ปี <span class="mono">${OTH_Y0}</span></span></span>` : ''}</div>
  </div>
  <!-- NEW 04B: Operational Hazard DNA Barcode Matrix -->
  <div class="hz-card glass rv" id="hz-card">
    <div class="hz-top">
      <h3><span class="chip votd">04B · HAZARD DNA MATRIX</span><span>ลายเซ็นภัยคุกคามการบินซ้ำซาก 8 หมวดหลัก × ${YRS.length} ปี (${U.Y0}–${U.Y1})</span></h3>
      <span class="ins" style="margin:0">แตะแถวภัยคุกคามเพื่อกรองทั้งหน้าและส่องไฟเคสในกราฟด้านบน</span>
    </div>
    <div class="hz-axis" aria-hidden="true">
      <span>หมวดภัยคุกคามปฏิบัติการ</span>
      <div class="hz-axis-yrs">${YRS.map((y) => `<span>${y % 5 === 0 ? String(y).slice(2) : ''}</span>`).join('')}</div>
      <span style="text-align:right">เคส · สัดส่วน</span>
    </div>
    <div class="hz-grid" id="hz-grid"></div>
  </div>
</section>`);

  UPD.push(() => {
    const on = new Set(M('y')), yc = new Map();
    for (const [y, list] of WBY) {
      const fut = !!Y && y > Y, s = wfSort(list, on);
      WST.set(y, s);
      yc.set(y, fut ? 0 : s.filter((c) => on.has(c)).length);
      s.forEach((c, k) => {
        const r = WQ.get(c.id), t = `translate(${WX(y)}px,${342 - 21 * k}px)`;
        if (!r) return;
        if (WT.get(c.id) !== t) { WT.set(c.id, t); r.style.transform = t; }
        r.classList.toggle('off', !on.has(c));
        r.classList.toggle('fut', fut);
      });
    }
    const m = M(), n = m.length, pk = byN(yc)[0], g = $('#wf-pk');
    const ties = pk && pk[1] ? [...yc].filter(([, v]) => v === pk[1]).map(([y]) => y) : [];
    if (ties.length === 1) {
      const cx = WX(pk[0]) + 9.5, ty = 363 - 21 * WST.get(pk[0]).length, [ln, tx] = g.children;
      g.style.display = '';
      ln.setAttribute('x1', cx); ln.setAttribute('x2', cx); ln.setAttribute('y1', ty - 4); ln.setAttribute('y2', ty - 14);
      tx.setAttribute('x', Math.min(1050, Math.max(90, cx))); tx.setAttribute('y', ty - 20);
      tx.textContent = `สูงสุด ${pk[0]} · ${pk[1]} เคส`;
    } else g.style.display = 'none';
    const a = m.filter((c) => c.type === 'accident').length, j = m.filter((c) => c._jp).length;
    const offN = C.filter((c) => !on.has(c) && !(Y && c.year > Y)).length;
    const sw = (col, t, v) => `<span><i style="background:${col}"></i>${t} <b>${U.fmt(v)}</b></span>`;
    $('#wf-lg').innerHTML = (WMODE === 'type' ? sw('var(--bad)', 'อุบัติเหตุ', a) + sw('var(--warn)', 'อุบัติการณ์', n - a) : sw('var(--ov-jp)', 'ญี่ปุ่น', j) + sw('var(--ov-oth)', 'ประเทศอื่น', n - j))
      + (offN ? sw('var(--ov-off)', 'ไม่ตรงตัวกรอง', offN) : '');
    const lbl = active() ? 'ที่ตรงตัวกรอง' : 'ในคลัง';
    let h;
    if (!n) h = 'ไม่มีเคสที่ตรงตัวกรอง';
    else if (ties.length === 1) h = `ปี ${pk[0]} มีเคส${lbl}มากที่สุด (${U.fmt(pk[1])} เคส)`;
    else if (ties.length === 2) h = `ปี ${ties[0]} และ ${ties[1]} มีเคส${lbl}มากที่สุด ปีละ ${U.fmt(pk[1])} เคส`;
    else h = `เคส${lbl}กระจายอยู่ใน ${[...yc.values()].filter(Boolean).length} ปี — มากที่สุดปีละ ${U.fmt(pk[1])} เคส`;
    $('#h-years').innerHTML = U.tx(h);

    /* อัปเดต 04B Operational Hazard DNA Matrix */
    const mhz = M('hz');
    const hzRows = HAZARDS.map((hz) => {
      const list = mhz.filter((c) => c._hz.includes(hz.k));
      const byY = new Map();
      let acc = 0;
      for (const c of list) {
        if (c.type === 'accident') acc++;
        const cur = byY.get(c.year) || { n: 0, acc: 0 };
        cur.n++;
        if (c.type === 'accident') cur.acc++;
        byY.set(c.year, cur);
      }
      return { ...hz, n: list.length, acc, inc: list.length - acc, ny: byY.size, byY };
    });
    const maxCell = Math.max(1, ...hzRows.flatMap((r) => [...r.byY.values()].map((v) => v.n)));
    $('#hz-grid').innerHTML = hzRows.map((r) => `<button type="button" class="hz-row${r.n ? '' : ' z'}" data-k="hz" data-v="${r.k}" data-fk="hz-${r.k}" aria-pressed="${S.hz === r.k}">
      <span class="hz-meta">
        <span class="th">${esc(r.th)}</span>
        <span class="sub">${esc(r.en)} · เกิดซ้ำ ${r.ny} ปี</span>
      </span>
      <span class="hz-cells" aria-hidden="true">${YRS.map((y) => {
        const v = r.byY.get(y);
        if (!v) return '<span></span>';
        const sz = Math.round(5 + 11 * Math.sqrt(v.n / maxCell));
        return `<span><i class="${v.acc ? 'acc' : 'inc'}" style="width:${sz}px;height:${sz}px" title="ปี ${y}: ${v.n} เคส"></i></span>`;
      }).join('')}</span>
      <span class="hz-stat">
        <span class="n">${U.fmt(r.n)}<small>เคส</small></span>
        <span class="bar" aria-hidden="true"><i class="a" style="flex:${r.acc}"></i><i class="i" style="flex:${r.inc}"></i></span>
      </span>
    </button>`).join('');
  });

  BIND.push(() => {
    const svg = $('#wf-svg'), pt = svg.createSVGPoint();
    for (const r of $$('.wf-sq', svg)) WQ.set(r.dataset.id, r);
    const at = (e) => {
      const mx = svg.getScreenCTM();
      if (!mx) return null;
      pt.x = e.clientX; pt.y = e.clientY;
      const p = pt.matrixTransform(mx.inverse()), col = Math.round((p.x - 49.5) / 21), k = Math.floor((361 - p.y) / 21), y = U.Y0 + col;
      if (col < 0 || y > U.Y1 || k < 0 || (Y && y > Y)) return null;
      return (WST.get(y) || [])[k] || null;
    };
    let HV = null;
    const unhv = () => { if (HV) { WQ.get(HV.id).classList.remove('hov'); HV = null; } };
    svg.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const c = at(e);
      if (c !== HV) { unhv(); if (c) { HV = c; WQ.get(c.id).classList.add('hov'); } }
      if (c) tip(caseTip(c), e); else untip();
    });
    svg.addEventListener('pointerleave', () => { unhv(); untip(); });
    svg.addEventListener('click', (e) => { const c = at(e); if (c) { untip(); openCase(c.id, svg); } });
    const mb = $$('#wf-mode button');
    for (const b of mb) {
      b.addEventListener('click', () => {
        if (WMODE === b.dataset.mode) return;
        WMODE = b.dataset.mode;
        svg.dataset.mode = WMODE;
        for (const x of mb) x.setAttribute('aria-pressed', String(x === b));
        update();
      });
    }
  });

  /* ═════ 05 แบบอากาศยาน: รูปถ่ายจริง + วงแหวน + แถบ DNA ช่วงการบิน ═════ */
  const AC_IMG = {
    H225M: 'img/ac-h225m.webp',
    B412EP: 'img/ac-b412ep.webp',
    'S-92': 'img/ac-s92.webp',
    H135: 'img/ac-h135.webp',
    'S-70I': 'img/ac-s70i.webp',
    ALL: 'img/ac-other.webp',
  };
  let GG_IN = U.reduced;
  const ggRing = (ar) => { const p = GG_IN ? +ar.dataset.p || 0 : 0; ar.setAttribute('stroke-dasharray', `${p} 100`); ar.style.opacity = p ? '1' : '0'; };
  const gCard = (k) => {
    const wing = k !== 'ALL';
    const imgSrc = AC_IMG[k] || '';
    const imgAlt = wing ? `${acName(k)} กองบิน 2` : 'เฮลิคอปเตอร์แบบอื่น';
    const photoHtml = imgSrc
      ? `<div class="gc-photo"><img src="${imgSrc}" alt="${esc(imgAlt)}" loading="eager" decoding="async"/><span class="gc-photo-shim" aria-hidden="true"></span></div>`
      : '<div class="gc-photo gc-photo-empty"></div>';

    return `<button type="button" class="gc" data-k="ac" data-v="${k}" data-fk="gc-${k}" aria-pressed="false"><span class="gc-ck">${ic('check', 'xs')}</span>`
      + photoHtml
      + (wing
        ? `<span class="gc-r"><svg viewBox="0 0 120 120" aria-hidden="true"><circle class="tr" cx="60" cy="60" r="50"/><circle class="ar" cx="60" cy="60" r="50" pathLength="100" stroke-dasharray="0 100" data-p="0" style="opacity:0"/></svg><span class="gc-v"><b>0</b><small>%</small></span></span>`
        : '<span class="gc-o"><b>0</b><small>เคส</small></span>')
      + `<span class="gc-n">${esc(acName(k))}</span>`
      + `<span class="gc-s ${wing ? 'sq' : 'oth'}">${wing ? `ฝูง ${esc(U.AC_SQ[k] || '—')}` : 'แบบที่ บน.2 ไม่ได้ใช้'}</span>`
      + `<span class="gc-m"></span>`
      + `<span class="gc-dna" aria-hidden="true"></span>`
      + `<span class="gc-p"></span>`
      + (wing && FAM[k] ? `<span class="gc-f">${esc(FAM[k])}</span>` : '')
      + `</button>`;
  };
  HTML.push(`<section class="sec wrap" id="s-types" aria-labelledby="h-types">
  ${head('05', 'types', '', 'วงแหวนคือสัดส่วนของแต่ละแบบในบรรดาเคสของเฮลิคอปเตอร์แบบที่ บน.2 ใช้ — แตะการ์ดเพื่อกรองทั้งหน้าตามแบบ หรือกดปุ่มขวาบนเพื่อดูรวมทั้ง 5 แบบของ บน.2',
    `<button type="button" class="btn btn-sky" data-k="ac" data-v="WING2" id="btn-wing2-sec" aria-pressed="false"><span>เฉพาะ 5 แบบ บน.2</span></button>`)}
  <div class="gg rv" id="gg">${U.WING.map(gCard).join('')}${gCard('ALL')}</div>
  <div class="gg-note rv" id="gg-note"></div>
</section>`);

  UPD.push(() => {
    const ma = M('ac'), cnt = U.count(ma, (c) => c._ac), wt = ma.length - (cnt.get('ALL') || 0);
    const w2btn = $('#btn-wing2-sec');
    if (w2btn) w2btn.setAttribute('aria-pressed', String(S.ac === 'WING2'));
    for (const b of $$('#gg .gc')) {
      const k = b.dataset.v, list = ma.filter((c) => c._ac === k), n = list.length, a = list.filter((c) => c.type === 'accident').length;
      const phs = byN(U.count(list, (c) => c._ph));
      const ph = phs[0];
      b.classList.toggle('z', !n);
      b.setAttribute('aria-pressed', String(S.ac === k));
      $('.gc-m', b).innerHTML = `<span class="gc-stat acc" title="อุบัติเหตุ ${U.fmt(a)} เคส"><i class="d"></i><b>${U.fmt(a)}</b></span>`
        + `<span class="gc-stat inc" title="อุบัติการณ์ ${U.fmt(n - a)} เคส"><i class="d"></i><b>${U.fmt(n - a)}</b></span>`;
      $('.gc-dna', b).innerHTML = phs.slice(0, 4).map(([, cN], idx) => `<i style="flex:${cN};opacity:${1 - idx * 0.2}"></i>`).join('');
      $('.gc-p', b).innerHTML = ph ? `ช่วงที่พบมาก: <b>${esc(PH[ph[0]])}</b> <span class="gc-cnt">(${U.fmt(ph[1])})</span>` : 'ไม่มีเคสในตัวกรองนี้';
      let lab;
      if (k === 'ALL') { setNum($('.gc-o b', b), n); lab = `${U.fmt(n)} เคส`; }
      else {
        const p = pctOf(n, wt), ar = $('.ar', b);
        setNum($('.gc-v b', b), p);
        ar.dataset.p = p;
        ggRing(ar);
        lab = `${p}% ของเคสแบบที่ บน.2 ใช้ (${U.fmt(n)} เคส)`;
      }
      b.setAttribute('aria-label', `${acName(k)} ${lab} · อุบัติเหตุ ${U.fmt(a)} · อุบัติการณ์ ${U.fmt(n - a)}`);
    }
    const wc = byN(new Map([...cnt].filter(([k]) => k !== 'ALL')))[0];
    let h;
    if (!wt) h = 'ไม่มีเคสของแบบที่ บน.2 ใช้ในตัวกรองนี้';
    else if (wt === 1) h = `มีเคสของแบบที่ บน.2 ใช้เพียง 1 เคส — ${acName(wc[0])}`;
    else if (wc[1] === wt) h = `ทั้ง ${U.fmt(wt)} เคสของแบบที่ บน.2 ใช้เป็น ${acName(wc[0])}`;
    else h = `${acName(wc[0])} มีเคสมากที่สุด ${U.fmt(wc[1])} จาก ${U.fmt(wt)} เคสของแบบที่ บน.2 ใช้`;
    $('#h-types').innerHTML = U.tx(h).replace('บน.2 ใช้', '<span class="nw">บน.2 ใช้</span>');
    $('#gg-note').innerHTML = `<span class="chip acc"><i class="d"></i>อุบัติเหตุ</span><span class="chip inc"><i class="d"></i>อุบัติการณ์</span>`
      + `<span>ร้อยละคือสัดส่วนในคลัง ไม่ใช่อัตราอุบัติเหตุของแบบนั้น · อีก <span class="mono">${U.fmt(cnt.get('ALL') || 0)}</span> เคสเป็นเฮลิคอปเตอร์แบบอื่น — บทเรียนหลายเรื่องใช้ได้ข้ามแบบ</span>`;
  });
  REV.push((root) => {
    if (GG_IN || root.id !== 'gg') return;
    GG_IN = true;
    for (const ar of $$('#gg .ar')) ggRing(ar);
  });

  /* ═════ 06 กระดานหน่วยงานสอบสวน (ป้ายพลิกแบบสนามบิน) ═════ */
  const BD_W = 6, FL_CH = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ-É0123456789', FLT = new WeakMap();
  let BD_IN = U.reduced;
  const fls = (k) => '<span class="fl"></span>'.repeat(k);
  const FLAG = {
    'ญี่ปุ่น': '<rect width="30" height="20" fill="#fff"/><circle cx="15" cy="10" r="6" fill="#BC002D"/>',
    'ฝรั่งเศส': '<rect width="10" height="20" fill="#002654"/><rect x="10" width="10" height="20" fill="#fff"/><rect x="20" width="10" height="20" fill="#CE1126"/>',
    'สหรัฐฯ': '<rect width="30" height="20" fill="#fff"/><path d="M0 0h30v1.54H0zM0 3.08h30v1.54H0zM0 6.15h30v1.54H0zM0 9.23h30v1.54H0zM0 12.31h30v1.54H0zM0 15.38h30v1.54H0zM0 18.46h30V20H0z" fill="#B22234"/><rect width="12" height="10.77" fill="#3C3B6E"/>',
    'แคนาดา': '<rect width="30" height="20" fill="#fff"/><rect width="7.5" height="20" fill="#D52B1E"/><rect x="22.5" width="7.5" height="20" fill="#D52B1E"/><path d="M15 4l1.2 2.4 1.4-.6-.5 2.8 2.3-1.2-.6 1.8 1.5.4-2.7 2.4.4 1.2-2.6-.4v2.8h-.8v-2.8l-2.6.4.4-1.2-2.7-2.4 1.5-.4-.6-1.8 2.3 1.2-.5-2.8 1.4.6z" fill="#D52B1E"/>',
    'สหราชอาณาจักร': '<rect width="30" height="20" fill="#012169"/><path d="M0 0l30 20M30 0L0 20" stroke="#fff" stroke-width="4"/><path d="M0 0l30 20M30 0L0 20" stroke="#C8102E" stroke-width="1.4"/><path d="M15 0v20M0 10h30" stroke="#fff" stroke-width="6"/><path d="M15 0v20M0 10h30" stroke="#C8102E" stroke-width="3.4"/>',
    'ไทย': '<rect width="30" height="20" fill="#A51931"/><rect y="3.33" width="30" height="13.34" fill="#F4F5F8"/><rect y="6.67" width="30" height="6.66" fill="#2D2A4A"/>',
    'ไอร์แลนด์': '<rect width="10" height="20" fill="#169B62"/><rect x="10" width="10" height="20" fill="#fff"/><rect x="20" width="10" height="20" fill="#FF883E"/>',
    'นอร์เวย์': '<rect width="30" height="20" fill="#BA0C2F"/><path d="M10.9 0v20M0 10h30" stroke="#fff" stroke-width="5"/><path d="M10.9 0v20M0 10h30" stroke="#00205B" stroke-width="2.6"/>',
    'อินเดีย': '<rect width="30" height="20" fill="#fff"/><rect width="30" height="6.67" fill="#FF9933"/><rect y="13.33" width="30" height="6.67" fill="#138808"/><circle cx="15" cy="10" r="2.6" fill="none" stroke="#000080" stroke-width=".7"/><circle cx="15" cy="10" r=".6" fill="#000080"/>',
    'สวีเดน': '<rect width="30" height="20" fill="#006AA7"/><path d="M11 0v20M0 10h30" stroke="#FECC00" stroke-width="3.6"/>',
  };
  const flag = (th) => (FLAG[th] ? `<svg class="flag" viewBox="0 0 30 20" aria-hidden="true" focusable="false">${FLAG[th]}</svg>` : '');
  const bdRow = (code) => {
    const a = AGBY.get(code);
    return `<button type="button" class="bd-r" data-k="ag" data-v="${esc(code)}" data-fk="ag-${esc(code)}" aria-pressed="false">`
      + `<span class="bd-c" aria-hidden="true" data-s="${esc(code.padEnd(BD_W).slice(0, BD_W))}">${fls(BD_W)}</span>`
      + `<span class="bd-t"><span class="th">${esc(a.th)}${flag(a.th)}</span><span class="en">${esc(a.name)}</span></span>`
      + `<span class="bd-n" aria-hidden="true" data-s="000">${fls(3)}</span><span class="bd-b"><i></i></span></button>`;
  };
  const flap = (box, str, dim) => {
    const cells = [...box.children], tok = {};
    FLT.set(box, tok);
    const lead = dim ? Math.min(str.length - 1, str.search(/[^0]|$/)) : 0;
    const want = (i) => (str[i] === ' ' ? '' : str[i] || '');
    const land = (el, i) => { el.textContent = want(i); el.classList.toggle('z', i < lead); };
    if (U.reduced || PLAY) { cells.forEach(land); return; }
    const left = cells.map((el, i) => (el.textContent === want(i) ? 0 : 3 + i * 2 + Math.floor(Math.random() * 3)));
    cells.forEach((el, i) => { if (!left[i]) land(el, i); });
    const tick = () => {
      if (FLT.get(box) !== tok) return;
      const hit = [];
      cells.forEach((el, i) => {
        if (!left[i]) return;
        if (--left[i]) { el.textContent = FL_CH[1 + Math.floor(Math.random() * (FL_CH.length - 1))]; el.classList.remove('z'); }
        else land(el, i);
        el.classList.remove('f');
        hit.push(el);
      });
      if (!hit.length) return;
      void box.offsetWidth;
      for (const el of hit) el.classList.add('f');
      if (left.some(Boolean)) setTimeout(tick, 60);
    };
    tick();
  };
  const bdPaint = () => {
    if (!BD_IN) return;
    for (const r of $$('#bd-l .bd-r')) {
      const cb = $('.bd-c', r), nb = $('.bd-n', r);
      flap(cb, cb.dataset.s, false);
      flap(nb, nb.dataset.s, true);
      $('.bd-b i', r).style.width = r.dataset.w || '0%';
    }
  };
  const bnRow = (label, list) => {
    if (!list.length) return '';
    const j = list.filter((c) => c._jp).length;
    return `<div class="bn-r"><span>${label}</span><span class="b" aria-hidden="true"><i style="width:${f((j / list.length) * 100)}%"></i></span>`
      + `<span class="n"><span aria-hidden="true">${U.fmt(j)}/${U.fmt(list.length)}</span><span class="sr">จากญี่ปุ่น ${U.fmt(j)} จาก ${U.fmt(list.length)} เคส</span></span></div>`;
  };
  const envOf = (k) => C.filter((c) => c.environment.includes(k));
  const JP_N = C.filter((c) => c._jp).length, PRE_N = C.filter((c) => c.year < OTH_Y0).length;
  HTML.push(`<section class="sec wrap" id="s-agency" aria-labelledby="h-agency">
  ${head('06', 'agency', '', 'แต่ละแถวคือหน่วยงานสอบสวนเจ้าของรายงาน — แตะแถวเพื่อกรองทั้งหน้าตามหน่วยงาน')}
  <div class="bd">
    <div class="bd-l glass rv" id="bd-l">${AG_ROWS.map(bdRow).join('')}</div>
    <aside class="bd-note glass rv" aria-labelledby="bn-t"><h3 id="bn-t">อ่านตัวเลขอย่างระวัง</h3>
      <p>เคส${JP_N * 2 > N ? 'ส่วนใหญ่' : 'จำนวนมาก'}ในคลังมาจากรายงานของญี่ปุ่น (<span class="mono">${U.fmt(JP_N)}</span> จาก <span class="mono">${U.fmt(N)}</span> เคส) จึงควรอ่านบางหมวดด้วยความระวัง:</p>
      <div class="bn-lg"><i></i>สัดส่วนเคสจากญี่ปุ่นในแต่ละหมวด</div>
      ${bnRow('ภูเขา', MTN)}${bnRow('สลิง', C.filter((c) => (c.mission || []).includes('SLING')))}${bnRow('ลมแรง', envOf('WIND'))}${bnRow('กลางคืน', envOf('NIGHT'))}${bnRow('NVG', envOf('NVG'))}${bnRow('แบบ บน.2', C.filter((c) => c._ac !== 'ALL'))}
      <p class="bn-f">${PRE_N ? `ก่อนปี <span class="mono">${OTH_Y0}</span> ทุกเคสในคลังมาจากญี่ปุ่น · ` : ''}สัดส่วนสูงสะท้อนจำนวนรายงานที่เผยแพร่ ไม่ได้แปลว่าเกิดเหตุมากกว่า</p>
    </aside>
  </div>
</section>`);

  UPD.push(() => {
    const ma = M('ag'), n = ma.length, cnt = U.count(ma, (c) => c._ag.code);
    for (const r of $$('#bd-l .bd-r')) {
      const code = r.dataset.v, a = AGBY.get(code), k = cnt.get(code) || 0;
      r.classList.toggle('z', !k);
      r.setAttribute('aria-pressed', String(S.ag === code));
      r.setAttribute('aria-label', `${code} ${a.th} · ${a.name} ${U.fmt(k)} เคส`);
      $('.bd-n', r).dataset.s = String(Math.min(999, k)).padStart(3, '0');
      r.dataset.w = `${n ? f((k / n) * 100) : 0}%`;
    }
    bdPaint();
    const ags = byN(cnt).filter(([, v]) => v), [k1, v1] = ags[0] || ['', 0], a1 = AGBY.get(k1);
    const cty = new Set(ags.map(([k]) => AGBY.get(k).th).filter((t) => t && t !== '—')).size;
    let h;
    if (!n) h = 'ไม่มีเคสที่ตรงตัวกรอง';
    else if (ags.length === 1) h = n === 1 ? `เคสที่ตรงตัวกรองมาจาก ${a1.code} ${a1.th}` : `ทั้ง ${U.fmt(n)} เคสมาจาก ${a1.code} ${a1.th}`;
    else if (ags[1][1] === v1) h = `${ags.length} หน่วยงาน ${cty} ประเทศ — ${ags.filter(([, v]) => v === v1).length > 2 ? 'หลายหน่วยงาน' : `${a1.code} และ ${ags[1][0]} `}มีเคสมากที่สุดเท่ากัน (${U.fmt(v1)} เคส)`;
    else h = `${ags.length} หน่วยงาน ${cty} ประเทศ — ${a1.code} ${a1.th}มากที่สุด ${U.fmt(v1)} เคส (${pct(v1, n)}%)`;
    $('#h-agency').innerHTML = U.tx(h);
  });
  REV.push((root) => {
    if (BD_IN || root.id !== 'bd-l') return;
    BD_IN = true;
    bdPaint();
  });

  /* ═════ 07 รายการเคส (พร้อมตัวอย่างคำถามบรีฟทันทีในแต่ละแถว) ═════ */
  const sortCases = (list) => [...list].sort((a, b) => (SORT === 'new' ? b.year - a.year : a.year - b.year) || a.id.localeCompare(b.id));
  const crRow = (c) => `<li><button type="button" class="cr" data-open="${esc(c.id)}" data-fk="case-${esc(c.id)}"><span class="cr-y">${c.year}</span><span class="cr-k">${typeChip(c)}</span>`
    + `<span class="cr-t">${esc(c.title)}</span><span class="cr-s">${esc(meta(c))}</span>`
    + (c.brief_question ? `<span class="cr-q">💬 คำถามบรีฟ: “${esc(c.brief_question)}”</span>` : '')
    + `${ic('next', 'sm')}</button></li>`;
  const clWhy = () => [S.ac ? `แบบ ${acName(S.ac)}` : '', S.type ? U.TYPE[S.type] : '', ...chipList().map(([, t]) => t)].filter(Boolean).join(' + ');
  HTML.push(`<section class="sec wrap" id="cases" aria-labelledby="h-cases">
  ${head('07', 'cases', '', 'ทุกเคสที่ตรงตัวกรองด้านบน พร้อมตัวอย่างคำถามบรีฟทันที — แตะเคสเพื่อเปิดลิ้นชักอ่านสรุป ปัจจัย ทำอะไรได้วันนี้ และลิงก์รายงานต้นฉบับ')}
  <div class="cl-card glass rv">
    <div class="cl-top"><span class="cl-n" id="cl-n"></span>
      <div class="fb-g"><span class="fb-l" id="cl-sl">เรียง</span><div class="seg sm" id="cl-sort" role="group" aria-labelledby="cl-sl"><button type="button" data-sort="new" aria-pressed="true">ใหม่ → เก่า${ck}</button><button type="button" data-sort="old" aria-pressed="false">เก่า → ใหม่${ck}</button></div></div></div>
    <ul class="cl" id="cl"></ul>
    <div id="cl-x"></div>
  </div>
</section>`);

  let CLK = '';
  UPD.push(() => {
    const m = M(), n = m.length;
    $('#h-cases').innerHTML = U.tx(!n ? 'ไม่มีเคสที่ตรงตัวกรอง' : active() ? `${U.fmt(n)} เคสที่ตรงตัวกรอง` : `ทั้งคลัง ${U.fmt(N)} เคส`);
    for (const b of $$('#cl-sort button')) b.setAttribute('aria-pressed', String(SORT === b.dataset.sort));
    if (PLAY) return;
    const vis = sortCases(m).slice(0, SHOW), why = n ? '' : clWhy(), key = `${vis.map((c) => c.id).join(',')}|${n}|${why}`;
    if (key === CLK) return;
    CLK = key;
    $('#cl-n').innerHTML = n ? `แสดง <span class="mono">${U.fmt(vis.length)}</span> จาก <span class="mono">${U.fmt(n)}</span> เคส` : '';
    $('#cl').innerHTML = vis.map(crRow).join('');
    $('#cl-x').innerHTML = !n
      ? `<div class="cl-empty"><b>ไม่มีเคสที่ตรงตัวกรองนี้</b><p>ไม่มีเคสที่ตรงทุกเงื่อนไขพร้อมกัน (${esc(why)}) — ลองเอาเงื่อนไขใดเงื่อนไขหนึ่งออก หรือล้างตัวกรองทั้งหมด</p>`
        + '<button type="button" class="btn btn-line" data-clear="all" data-fk="cl-clr"><span>ล้างตัวกรอง</span></button></div>'
      : n > vis.length ? `<button type="button" class="btn btn-line cl-more" id="cl-more" data-fk="cl-more">แสดงเพิ่มอีก ${U.fmt(Math.min(20, n - vis.length))} เคส</button>` : '';
  });

  /* ═════ ลิ้นชักรายละเอียดเคส (ชูคำถามบรีฟ + ทำอะไรได้วันนี้ขึ้นบนสุดสำหรับนักบิน) ═════ */
  const listOf = (x) => (Array.isArray(x) ? x : x ? String(x).split(/\n+/) : []).map((s) => String(s).replace(/^\s*[-•·]\s*/, '').trim()).filter(Boolean);
  const paras = (s) => String(s || '').split(/\n{2,}/).map((p) => p.trim()).filter(Boolean).map((p) => {
    const m = /^\[([^\]\n]{1,40})\]\s*/.exec(p);
    return `<p>${m ? `<span class="dr-lb">${esc(m[1])}</span>` : ''}${esc(m ? p.slice(m[0].length) : p).replace(/\n/g, '<br>')}</p>`;
  }).join('');
  const hfCell = (codes, T) => {
    const own = codes.filter((h) => T.cats.includes(W.tax.hfCat[h])), t = `<div class="t">${T.k} · ${esc(T.th)}</div>`;
    if (!own.length) return `<div class="none">${t}<div class="c">ไม่ได้ลงรหัส</div><div class="n">ร่างนี้ยังไม่ระบุปัจจัยในชั้นนี้</div></div>`;
    return `<div>${t}<div class="c">${[...new Set(own.map((h) => W.tax.hfCat[h]))].map((k) => esc(HF[k] || k)).join(' · ')}</div>`
      + own.map((h) => `<div class="n"><span class="mono">${esc(h)}</span>${esc(W.tax.hfLabel[h] || '')}</div>`).join('') + '</div>';
  };
  const drSec = (h, body) => (body ? `<section class="dr-s"><h3 class="dr-h">${h}</h3>${body}</section>` : '');
  const drUl = (x) => { const l = listOf(x); return l.length ? `<ul class="dr-ul">${l.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>` : ''; };
  const dchip = (t) => `<span class="chip">${t}</span>`;
  const drBody = (c) => {
    const hf = c.hfacs || [];
    return `<div class="dr-tags">${typeChip(c)}<span class="chip mono">${c.year}</span>${dchip(esc(c._ac === 'ALL' ? 'แบบอื่น' : U.AC_L[c._ac] || U.AC[c._ac]))}`
      + (c.mission || []).filter((k) => k !== 'ALL').slice(0, 2).map((k) => dchip(esc(U.MIS[k] || k))).join('')
      + `${dchip(`${ic('globe', 'xs')}${esc(c._ag.code)} · ${esc(c._ag.th)}`)}</div>`
      + `<h2 id="dr-t">${esc(c.title)}</h2>`
      + (c.brief_question ? `<div class="tq glass"><span class="qm" aria-hidden="true">“</span><span class="k">คำถามบรีฟก่อนบิน (PRE-FLIGHT BRIEF QUESTION)</span><blockquote>${esc(c.brief_question)}</blockquote></div>` : '')
      + drSec('ทำอะไรได้วันนี้ (Actionable Takeaways)', drUl(c.actions_today))
      + drSec('สรุปเหตุการณ์', paras(c.summary))
      + drSec('ปัจจัยที่เกี่ยวข้อง', drUl(c.factors))
      + drSec('ปัจจัยตาม HFACS <span class="chip draft">ฉบับร่าง</span>', hf.length ? `<div class="dr-hf">${TK.map((t) => hfCell(hf, TIER[t])).join('')}</div>` : '<p>เคสนี้ยังไม่ได้ลงรหัส HFACS</p>')
      + drSec('ช่วงของเที่ยวบิน · สภาพแวดล้อม', `<div class="dr-tags">${c.phase.map((k) => dchip(esc(PH[k] || k))).join('')}${c.environment.map((k) => dchip(esc(envName(k) || k))).join('')}</div>`)
      + (c.ref ? `<div class="dr-ref"><a class="btn btn-line" href="${esc(c.ref)}" target="_blank" rel="noopener"><span>อ่านรายงานต้นฉบับ</span>${ic('ext', 'xs')}</a><span>รายงานจาก ${esc(c._ag.name)}</span></div>` : '');
  };
  const seqOf = (id) => { const m = sortCases(M()); return m.some((c) => c.id === id) ? m : sortCases(C); };
  const drShow = (c) => {
    const seq = seqOf(c.id), i = seq.findIndex((x) => x.id === c.id), pb = $('#dr-p', D), nb = $('#dr-n', D), fa = D.activeElement;
    $('#dr-k', D).textContent = `${U.fmt(i + 1)} / ${U.fmt(seq.length)}`;
    pb.disabled = i <= 0;
    nb.disabled = i >= seq.length - 1;
    pb.dataset.id = i > 0 ? seq[i - 1].id : '';
    nb.dataset.id = i < seq.length - 1 ? seq[i + 1].id : '';
    $('#dr-b', D).innerHTML = drBody(c);
    $('#dr', D).scrollTop = 0;
    if ((fa === pb || fa === nb) && fa.disabled) { const alt = fa === pb ? nb : pb; (alt.disabled ? $('#dr-x', D) : alt).focus(); }
  };
  let OPENER = null;
  const openCase = (id, opener) => {
    const c = BYID.get(id);
    if (!c) return;
    const was = !!OPEN, dr = $('#dr', D);
    if (!was) OPENER = opener || R.activeElement || document.activeElement;
    OPEN = id;
    drShow(c);
    dr.inert = false;
    dr.classList.add('open');
    $('#scrim', D).classList.add('open');
    document.documentElement.classList.add('ov-lock');
    for (const el of document.body.children) if (el !== dhost) el.inert = true;
    untip();
    writeHash();
    if (!was) requestAnimationFrame(() => $('#dr-x', D).focus());
  };
  const closeCase = () => {
    if (!OPEN) return;
    const id = OPEN, dr = $('#dr', D), o = OPENER;
    OPEN = '';
    OPENER = null;
    dr.classList.remove('open');
    $('#scrim', D).classList.remove('open');
    dr.inert = true;
    document.documentElement.classList.remove('ov-lock');
    for (const el of document.body.children) el.inert = false;
    writeHash();
    if (o && o !== document.body && o.isConnected) { o.focus({ preventScroll: true }); if (R.activeElement === o || document.activeElement === o) return; }
    const r = $(`[data-fk="case-${CSS.escape(id)}"]`);
    if (r) r.focus({ preventScroll: true });
  };

  BIND.push(() => {
    $('#scrim', D).addEventListener('click', closeCase);
    $('#dr-x', D).addEventListener('click', closeCase);
    $('#dr-copy', D).addEventListener('click', () => {
      const c = BYID.get(OPEN);
      if (!c) return;
      const txt = `【${c.year} · ${U.TYPE[c.type]}】${c.title}\n• ช่วงบิน: ${PH[c._ph]} | แบบ: ${acName(c._ac)}\n• คำถามบรีฟ: "${c.brief_question || '—'}"\n• ทำอะไรได้วันนี้:\n${listOf(c.actions_today).map((x) => `  - ${x}`).join('\n')}`;
      navigator.clipboard?.writeText(txt).then(() => {
        const b = $('#dr-copy', D);
        const orig = b.innerHTML;
        b.innerHTML = `${ic('check', 'sm')}<span style="margin-left:6px;font-size:13px;color:var(--ok)">คัดลอกแล้ว!</span>`;
        setTimeout(() => { b.innerHTML = orig; }, 1600);
      }).catch(() => {});
    });
    for (const b of [$('#dr-p', D), $('#dr-n', D)]) b.addEventListener('click', () => { if (b.dataset.id) openCase(b.dataset.id); });
    for (const b of $$('#cl-sort button')) {
      b.addEventListener('click', () => { if (SORT === b.dataset.sort) return; SORT = b.dataset.sort; SHOW = 20; update(); });
    }
    $('#cl-x').addEventListener('click', (e) => {
      if (!e.target.closest('#cl-more')) return;
      const k = SHOW;
      SHOW += 20;
      update();
      const r = $$('#cl .cr')[k];
      if (r) r.focus();
    });
  });

  /* ═════ ตัวควบคุมหลัก ═════ */
  update = () => {
    const ae = R.activeElement, fk = ae && ae.dataset && ae.dataset.fk;
    UPD.forEach((fn) => fn());
    const lost = ae && (!ae.isConnected || !!ae.closest('[hidden]') || ae.disabled === true);
    if (lost) {
      const el = (fk && $(`[data-fk="${CSS.escape(fk)}"]`)) || $('#fb-clr:not([hidden])') || $('#fb .seg button[aria-pressed="true"]') || $('#fb .seg button');
      if (el) el.focus({ preventScroll: true });
    }
    if (!PLAY) writeHash();
  };
  const SEC_ID = /^(cases|s-[a-z]+)$/;
  const goTo = (id) => {
    const el = R.getElementById(id);
    if (!el) return;
    const h = R.getElementById(`h-${id.replace(/^s-/, '')}`), tgt = (h && h.closest('.sec-h')) || el;
    tgt.scrollIntoView({ behavior: U.reduced ? 'auto' : 'smooth', block: 'start' });
    if (h) h.focus({ preventScroll: true });
  };

  R.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0) return;
    const el = e.target.closest && e.target.closest('[data-story],[data-clear],[data-open],[data-k][data-v],a[href]');
    if (!el) return;
    if (el.dataset.story) {
      const st = STORIES.find((x) => x.id === el.dataset.story);
      if (st) {
        stopPlay();
        Y = 0;
        if (st.id !== 'all' && isStoryActive(st)) {
          for (const k of KEYS) S[k] = '';
        } else {
          Object.assign(S, st.patch);
        }
        SHOW = 20;
        update();
      }
      return;
    }
    if (el.dataset.clear) {
      const k = el.dataset.clear;
      if (k === 'all') clearAll();
      else if (k === 'y') { stopPlay(); Y = 0; SHOW = 20; update(); }
      else if (has(S, k)) {
        S[k] = '';
        if (k === 'q' && $('#q-in')) $('#q-in').value = '';
        SHOW = 20;
        update();
      }
      return;
    }
    if (el.dataset.open) { openCase(el.dataset.open, el); return; }
    if (el.dataset.k) {
      if (has(S, el.dataset.k)) { if (el.closest('.seg')) setF({ [el.dataset.k]: el.dataset.v }); else toggle(el.dataset.k, el.dataset.v); }
      return;
    }
    const m = SEC_ID.exec((el.getAttribute('href') || '').replace(/^#/, ''));
    if (!m || el.target || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    closeCase();
    goTo(m[1]);
  });

  R.addEventListener('keydown', (e) => {
    if (e.defaultPrevented || (e.key !== 'Enter' && e.key !== ' ')) return;
    const t = e.target.closest && e.target.closest('[role="button"]');
    if (!t) return;
    if (t.dataset.open) { e.preventDefault(); openCase(t.dataset.open, t); }
    else if (t.dataset.k && has(S, t.dataset.k)) { e.preventDefault(); toggle(t.dataset.k, t.dataset.v); }
  });
  const onKey = (e) => {
    if (!OPEN || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === 'Escape') { e.preventDefault(); closeCase(); return; }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      const b = $(e.key === 'ArrowLeft' ? '#dr-p' : '#dr-n', D);
      if (b && b.dataset.id) { e.preventDefault(); openCase(b.dataset.id); }
    }
  };
  document.addEventListener('keydown', onKey);

  const fromHash = () => {
    stopPlay();
    const cs = readHash();
    SHOW = 20;
    update();
    if (cs) openCase(cs); else closeCase();
  };

  /* ═════ อภิธานศัพท์ ═════ */
  const GL = [
    ['อุบัติเหตุ', 'Accident', 'เหตุที่มีผู้เสียชีวิตหรือบาดเจ็บสาหัส หรืออากาศยานเสียหายหนัก ตามเกณฑ์ของหน่วยงานที่สอบสวน'],
    ['อุบัติการณ์', 'Incident', 'เหตุที่กระทบความปลอดภัยแต่ไม่ถึงเกณฑ์อุบัติเหตุ'],
    ['HFACS', 'Human Factors Analysis and Classification System', 'กรอบจำแนกปัจจัยมนุษย์ 4 ชั้น ตาม DoD HFACS 8.0 — องค์กร · การกำกับดูแล · สภาพก่อนเกิดเหตุ · การกระทำ รหัสในคลังนี้เป็นฉบับร่างที่ยังไม่ผ่านการตรวจ'],
    ['NVG', 'Night Vision Goggles', 'กล้องมองกลางคืน — มุมมองแคบและการกะระยะต่างจากตาเปล่า'],
    ['ร่อนลงฉุกเฉิน', 'Autorotation', 'ร่อนลงโดยใช้ลมหมุนใบพัดเมื่อเครื่องยนต์ไม่ส่งกำลัง'],
    ['Brownout', 'Brownout', 'ฝุ่นหรือทรายที่ใบพัดตีขึ้นจนมองไม่เห็นพื้นขณะลงจอดหรือลอยตัว'],
    ['high DA', 'High density altitude', 'อากาศร้อนหรือที่สูงทำให้อากาศเบาบาง เครื่องยนต์และใบพัดให้แรงยกน้อยลง'],
    ['VMC', 'Visual Meteorological Conditions', 'สภาพอากาศที่บินด้วยการมองเห็นได้'],
    ['ลอยตัว', 'Hover', 'อยู่นิ่งกลางอากาศ — ต้องใช้กำลังมากและมีระยะแก้ไขน้อย'],
    ['เข้าสู่สนาม', 'Approach', 'ช่วงร่อนเข้าหาจุดลงจอด ก่อนแตะพื้น'],
  ];
  const GLOSS = `<section class="sec wrap gl" id="s-gloss" aria-labelledby="h-gloss">
  ${head('08', 'gloss', 'คำศัพท์ในหน้านี้', 'คำย่อและคำเฉพาะที่ใช้ในกราฟ')}
  <dl class="gl-l glass rv">${GL.map(([th, e, d]) => `<div><dt>${esc(th)}${e !== th ? en(esc(e)) : ''}</dt><dd>${esc(d)}</dd></div>`).join('')}</dl>
</section>`;

  /* ═════ เริ่มทำงาน ═════ */
  const cs0 = readHash();
  R.innerHTML = SPRITE + HTML.join('') + GLOSS
    + `<footer class="ov-foot wrap"><span>ข้อมูลเคสสากล <b>${U.isoTh(W.version)}</b> · ${U.fmt(N)} เคส จาก ${AG_N} หน่วยงานสอบสวน ${CTY_N} ประเทศ · <b>Antigravity Edition (#VOTD)</b></span>`
    + '<span>ตัวเลขคือจำนวนเคสในคลัง ไม่ใช่อัตราการเกิดเหตุ · ทุกเคสมีลิงก์รายงานต้นฉบับ</span></footer>';
  BIND.forEach((fn) => fn());
  update();
  const wfw = $('.wf-w');
  if (wfw && wfw.scrollWidth > wfw.clientWidth) wfw.scrollLeft = wfw.scrollWidth;

  R.addEventListener('reveal', (e) => onReveal(e.target), true);
  let IO = null;
  if (window.IntersectionObserver && !U.reduced) {
    IO = new IntersectionObserver((es) => {
      for (const x of es) if (x.isIntersecting) { x.target.classList.add('in'); x.target.dispatchEvent(new CustomEvent('reveal')); IO.unobserve(x.target); }
    }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });
    $$('.rv:not(.in)').forEach((el) => IO.observe(el));
  } else $$('.rv').forEach((el) => el.classList.add('in'));
  $$('.rv.in').forEach(onReveal);
  let dead = false;
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { if (cs0 && !dead) openCase(cs0); });

  const destroy = () => {
    dead = true;
    PLAY = false;
    clearInterval(TMR);
    if (RO) RO.disconnect();
    if (IO) IO.disconnect();
    if (MQ) MQ.removeEventListener('change', onMQ);
    document.removeEventListener('keydown', onKey);
    for (const el of document.body.children) el.inert = false;
    dhost.remove();
    host.style.removeProperty('--fb-h');
    document.documentElement.classList.remove('ov-lock');
  };
  return { fromHash, destroy };
}
