// scene.js — ภาพจำลองเหตุการณ์ 2 มิติประกอบเคส INTL (ข้อมูลอยู่ใน data/scenes.json)
// ภาพเป็นภาพประกอบ ไม่ตามมาตราส่วน ค่าที่รายงานไม่ระบุให้วาดเป็นเส้นประพร้อม "?" ห้ามแต่งตัวเลขเอง
// สเปกหนึ่งเคส: { panels?: [ฉาก…] | ฉากเดียว, steps: [{ n, ph, text }], note }
// ฉาก: { view: side|top|front, h?, night?, bg?, cap?, el: [{ t: ชนิด, … }] } — viewBox กว้าง 400 เสมอ
// ชนิดและฟิลด์ดู KINDS ด้านล่าง (tools/scenes/check.mjs ตรวจตามรายการนี้)

export const W = 400;
const PH = { normal: '#888780', warn: '#EF9F27', danger: '#E24B4A', info: '#185FA5' };
const VIEW_TH = { side: 'ภาพด้านข้าง', top: 'ภาพมุมบน', front: 'ภาพด้านหน้า' };
const PH_TH = { normal: 'ปกติ', warn: 'เริ่มผิดปกติ', danger: 'อันตราย', info: 'ข้อมูล' };

// ชนิดองค์ประกอบ → ฟิลด์ที่ต้องมี (ฟิลด์เสริมเขียนไว้ในวงเล็บเพื่อเป็นเอกสาร)
export const KINDS = {
  ground: ['kind', 'y'], // (x1 x2)
  hill: ['kind', 'pts'],
  area: ['kind', 'pts'],
  road: ['pts'], // (w)
  river: ['pts'], // (w)
  heli: ['x', 'y'], // (s rot type view state flip)
  plane: ['x', 'y'], // (s rot view state flip)
  tower: ['x', 'y', 'h'],
  pole: ['x', 'y', 'h'],
  wire: ['pts'], // (sag hit)
  tree: ['x', 'y'], // (h)
  trees: ['x1', 'x2', 'y'], // (h n)
  building: ['x', 'y', 'w', 'h'],
  ship: ['x', 'y', 'w'], // (deck)
  rig: ['x', 'y'], // (s)
  pad: ['x', 'y'], // (w)
  runway: ['x1', 'x2', 'y'], // side/front · มุมบนใช้ x y w h rot
  person: ['x', 'y'],
  vehicle: ['x', 'y'], // (flip)
  box: ['x', 'y', 'w', 'h'], // (text)
  cloud: ['x', 'y', 'w'], // (h)
  fog: ['y1', 'y2'], // (x1 x2)
  burst: ['x', 'y'], // (r)
  line: ['pts'], // (color dash w)
  path: ['pts'], // (ph dash arrow smooth)
  mark: ['n', 'x', 'y'], // (ph)
  label: ['x', 'y', 'text'], // (anchor tone size)
  dim: ['x1', 'y1', 'x2', 'y2', 'text'], // (unknown side)
  wind: ['x', 'y'], // (to text) to = มุมบนจอ 0=ขวา 90=ลง 180=ซ้าย 270=ขึ้น
  north: ['x', 'y'],
};

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const n1 = (v) => Math.round(v * 10) / 10;
const pt = (p) => `${n1(p[0])},${n1(p[1])}`;

function palette(night) {
  return night ? {
    sky1: '#1A2436', sky2: '#2C3B54', text: '#F1EFE8', muted: '#C9C7BF', halo: '#1A2436',
    grass: '#3B4A35', paddy: '#3D4C34', paddyLn: '#56684A', hill: '#5D7247', mount: '#4C5560', snow: '#8E99A8',
    sea: '#22394F', wave: '#3D5C7A', desert: '#5A5040', city: '#3E4248', runway: '#55575A', forest: '#2F4430',
    body: '#B8C4D4', win: '#55687F', wire: '#7FB3E8', obj: '#9097A0', objFill: '#3A4250', cloud: '#56627A',
  } : {
    sky1: '#E6EFF8', sky2: '#F7FAFD', text: '#2C2C2A', muted: '#5F5E5A', halo: '#FFFFFF',
    grass: '#E3EED3', paddy: '#EEF5E3', paddyLn: '#C9E0A8', hill: '#97C459', mount: '#B9BFB4', snow: '#F4F6F8',
    sea: '#CFE3F3', wave: '#9CC3E4', desert: '#EFE3C6', city: '#E2E2DE', runway: '#BDBDB8', forest: '#A9CB8A',
    body: '#3D4A5C', win: '#9FB4CC', wire: '#185FA5', obj: '#6E6D68', objFill: '#D9D8D2', cloud: '#FFFFFF',
  };
}

const fillOf = (P, kind) => ({
  grass: P.grass, paddy: P.paddy, field: P.paddy, hill: P.hill, mountain: P.mount, snow: P.snow,
  sea: P.sea, water: P.sea, lake: P.sea, desert: P.desert, sand: P.desert, city: P.city, runway: P.runway,
  forest: P.forest, rock: P.mount, concrete: P.runway,
}[kind] || P.grass);

/* ── อากาศยาน ─────────────────────────────────────────────── */
// วาดที่จุดกำเนิด หัวชี้ไปทางขวา (+x) จุด (0,0) = กลางลำตัว · s=1 ยาวราว 70 หน่วย (ขนาดกลาง)

function heliSide(type, P, st) {
  const b = st === 'crash' ? '#5A4A44' : P.body;
  if (type === 'light') {
    return `<path d="M-9,-8 C-3,-13 11,-12 16,-6 C19,-2 18,4 14,6 L-8,6 C-12,6 -13,1 -12,-3 Z" fill="${b}"/>
      <path d="M4,-10 C10,-10 14,-7 16,-3 L8,-3 Z" fill="${P.win}"/>
      <path d="M-11,-4 L-38,-3 L-38,0 L-10,2 Z" fill="${b}"/>
      <path d="M-38,-3 L-41,-12 L-37,-12 L-35,-2 Z" fill="${b}"/>
      <circle cx="-38" cy="-8" r="4.5" fill="none" stroke="${b}" stroke-width="1" opacity=".55"/>
      <path d="M-6,6 L-8,11 M10,6 L12,11 M-12,11 L18,11" stroke="${b}" stroke-width="1.6" fill="none" stroke-linecap="round"/>
      <path d="M2,-12 L2,-15" stroke="${b}" stroke-width="2"/>
      ${rotorSide(-24, 28, -15, b, st)}`;
  }
  if (type === 'tandem') {
    return `<path d="M-34,-8 L30,-8 C36,-8 40,-4 40,1 L38,7 L-34,7 C-38,7 -40,3 -40,-1 Z" fill="${b}"/>
      <path d="M30,-6 C34,-6 37,-3 38,0 L31,0 Z" fill="${P.win}"/>
      <path d="M-40,-8 L-36,-20 L-26,-20 L-24,-8 Z M26,-8 L28,-14 L34,-14 L34,-8 Z" fill="${b}"/>
      <circle cx="-24" cy="10" r="2.6" fill="${b}"/><circle cx="26" cy="10" r="2.6" fill="${b}"/>
      ${rotorSide(-60, 0, -21, b, st)}${rotorSide(4, 56, -15, b, st)}`;
  }
  return `<path d="M-14,-6 C-8,-11 10,-11 18,-7 C24,-5 27,-1 26,3 L22,7 L-12,7 C-16,7 -18,4 -18,1 Z" fill="${b}"/>
    <path d="M15,-7 C20,-6 23,-3 24,0 L16,0 Z" fill="${P.win}"/>
    <path d="M-2,-4 L8,-4 L8,1 L-2,1 Z" fill="${P.win}" opacity=".7"/>
    <path d="M-17,-3 L-46,-6 L-46,-2 L-17,3 Z" fill="${b}"/>
    <path d="M-46,-6 L-51,-18 L-45,-18 L-42,-5 Z" fill="${b}"/>
    <circle cx="-48" cy="-13" r="5.5" fill="none" stroke="${b}" stroke-width="1" opacity=".55"/>
    <circle cx="-8" cy="9.5" r="2.6" fill="${b}"/><circle cx="16" cy="9.5" r="2.6" fill="${b}"/>
    <path d="M2,-10 L2,-14" stroke="${b}" stroke-width="2.2"/>
    ${rotorSide(-30, 34, -14.5, b, st)}`;
}

function rotorSide(x1, x2, y, c, st) {
  if (st === 'crash') {
    const m = (x1 + x2) / 2;
    return `<path d="M${m},${y} L${x1 + 8},${y - 5} M${m},${y} L${x2 - 10},${y + 6}" stroke="${c}" stroke-width="1.6" stroke-linecap="round"/>`;
  }
  return `<path d="M${x1},${y} L${x2},${y}" stroke="${c}" stroke-width="1.6" stroke-linecap="round"/>
    <ellipse cx="${(x1 + x2) / 2}" cy="${y}" rx="${(x2 - x1) / 2}" ry="2.2" fill="${c}" opacity=".12"/>`;
}

function heliTop(type, P, st) {
  const b = st === 'crash' ? '#5A4A44' : P.body;
  const disk = (cx, r) => (st === 'crash'
    ? `<path d="M${cx - r * .7},${-r * .5} L${cx + r * .6},${r * .6} M${cx - r * .5},${r * .7} L${cx + r * .3},${-r * .4}" stroke="${b}" stroke-width="1.6" stroke-linecap="round"/>`
    : `<circle cx="${cx}" cy="0" r="${r}" fill="${b}" opacity=".1" stroke="${b}" stroke-opacity=".35" stroke-width="1"/>
       <path d="M${cx - r},0 L${cx + r},0 M${cx},${-r} L${cx},${r}" stroke="${b}" stroke-width="1.3" opacity=".7"/>`);
  if (type === 'tandem') {
    return `<rect x="-38" y="-6" width="76" height="12" rx="6" fill="${b}"/>${disk(-26, 26)}${disk(26, 26)}`;
  }
  const L = type === 'light' ? 0.8 : 1;
  return `<g transform="scale(${L})"><ellipse cx="6" cy="0" rx="20" ry="8" fill="${b}"/>
    <path d="M-12,-2.2 L-46,-1.2 L-46,1.2 L-12,2.2 Z" fill="${b}"/>
    <path d="M-44,-7 L-44,7" stroke="${b}" stroke-width="2" stroke-linecap="round"/>
    <path d="M18,-4 C22,-3 24,-1 25,0 C24,1 22,3 18,4 Z" fill="${P.win}"/>
    ${disk(2, 32)}</g>`;
}

function heliFront(type, P, st) {
  const b = st === 'crash' ? '#5A4A44' : P.body;
  const W2 = type === 'light' ? 9 : 12;
  const rot = st === 'crash'
    ? `<path d="M0,-16 L-22,-24 M0,-16 L20,-8" stroke="${b}" stroke-width="1.6" stroke-linecap="round"/>`
    : `<path d="M-38,-16 L38,-16" stroke="${b}" stroke-width="1.6" stroke-linecap="round"/><ellipse cx="0" cy="-16" rx="38" ry="2" fill="${b}" opacity=".12"/>`;
  const gear = type === 'light'
    ? `<path d="M-6,7 L-11,12 M6,7 L11,12 M-14,12 L-8,12 M8,12 L14,12" stroke="${b}" stroke-width="1.8" stroke-linecap="round"/>`
    : `<rect x="${-W2 - 3}" y="7" width="4" height="6" rx="2" fill="${b}"/><rect x="${W2 - 1}" y="7" width="4" height="6" rx="2" fill="${b}"/>`;
  return `<path d="M${-W2},-4 C${-W2},-11 ${W2},-11 ${W2},-4 L${W2 - 1},6 C${W2 / 2},9 ${-W2 / 2},9 ${-W2 + 1},6 Z" fill="${b}"/>
    <path d="M${-W2 + 3},-5 C${-W2 + 4},-9 ${W2 - 4},-9 ${W2 - 3},-5 L${W2 - 4},0 L${-W2 + 4},0 Z" fill="${P.win}"/>
    <path d="M0,-11 L0,-16" stroke="${b}" stroke-width="2.2"/>${gear}${rot}`;
}

function planeSide(P, st) {
  const b = st === 'crash' ? '#5A4A44' : P.body;
  return `<path d="M-34,-2 C-20,-6 18,-6 28,-3 C33,-1 33,2 28,3 L-30,3 Z" fill="${b}"/>
    <path d="M20,-4 C24,-4 27,-2 28,-1 L21,-1 Z" fill="${P.win}"/>
    <path d="M-30,-2 L-36,-14 L-31,-14 L-24,-3 Z" fill="${b}"/>
    <path d="M-4,1 L-12,5 L6,5 L8,1 Z" fill="${b}"/>`;
}

function planeTop(P, st) {
  const b = st === 'crash' ? '#5A4A44' : P.body;
  return `<path d="M30,0 C30,-3 26,-3.5 22,-3.5 L4,-3.5 L-4,-30 L-10,-30 L-6,-3.5 L-26,-3 L-31,-12 L-35,-12 L-33,0 L-35,12 L-31,12 L-26,3 L-6,3.5 L-10,30 L-4,30 L4,3.5 L22,3.5 C26,3.5 30,3 30,0 Z" fill="${b}"/>`;
}

function craft(e, view, P, plane) {
  const v = e.view || view;
  const st = e.state || 'normal';
  const inner = plane
    ? (v === 'top' ? planeTop(P, st) : planeSide(P, st))
    : (v === 'top' ? heliTop(e.type, P, st) : v === 'front' ? heliFront(e.type, P, st) : heliSide(e.type, P, st));
  const sx = (e.flip ? -1 : 1) * (e.s || 1);
  const tr = `translate(${n1(e.x)},${n1(e.y)}) rotate(${e.rot || 0}) scale(${sx},${e.s || 1})`;
  const ghost = st === 'ghost' ? ' opacity=".32"' : '';
  return `<g transform="${tr}"${ghost}>${inner}</g>`;
}

/* ── ภูมิประเทศและสิ่งกีดขวาง ───────────────────────────────── */

function ground(e, H, P) {
  const x1 = e.x1 ?? 0; const x2 = e.x2 ?? W; const y = e.y;
  const f = fillOf(P, e.kind);
  let tex = '';
  if (e.kind === 'paddy' || e.kind === 'field') {
    for (let yy = y + 6; yy < H; yy += 7) tex += `<path d="M${x1},${yy} L${x2},${yy}" stroke="${P.paddyLn}" stroke-width="1"/>`;
  } else if (e.kind === 'sea' || e.kind === 'water' || e.kind === 'lake') {
    for (let yy = y + 7, k = 0; yy < H; yy += 9, k++) {
      let d = `M${x1 + (k % 2) * 10},${yy}`;
      for (let xx = x1 + (k % 2) * 10; xx < x2; xx += 20) d += ` q5,-3 10,0 q5,3 10,0`;
      tex += `<path d="${d}" stroke="${P.wave}" stroke-width="1" fill="none"/>`;
    }
  } else if (e.kind === 'snow') {
    tex = `<path d="M${x1},${y} L${x2},${y}" stroke="${P.mount}" stroke-width="1.5"/>`;
  } else if (e.kind === 'runway' || e.kind === 'concrete') {
    tex = `<path d="M${x1},${y + 1.5} L${x2},${y + 1.5}" stroke="#FFFFFF" stroke-width="1.2" stroke-dasharray="10 8" opacity=".8"/>`;
  }
  return `<rect x="${x1}" y="${y}" width="${x2 - x1}" height="${H - y}" fill="${f}"/>${tex}`;
}

function hill(e, H, P) {
  const p = e.pts;
  const f = fillOf(P, e.kind === 'hill' ? 'hill' : e.kind);
  const op = e.kind === 'hill' || e.kind === 'forest' ? .45 : 1;
  const d = `M${p[0][0]},${H} L${p.map(pt).join(' L')} L${p[p.length - 1][0]},${H} Z`;
  const edge = e.kind === 'snow' ? ` stroke="${P.mount}" stroke-width="1.5"` : '';
  return `<path d="${d}" fill="${f}" opacity="${op}"${edge}/>`;
}

function area(e, P) {
  const f = fillOf(P, e.kind);
  return `<path d="M${e.pts.map(pt).join(' L')} Z" fill="${f}"${e.kind === 'forest' ? ' opacity=".8"' : ''}/>`;
}

function track(e, P, river) {
  const w = e.w || (river ? 8 : 6);
  const c = river ? P.sea : P.runway;
  return `<path d="M${e.pts.map(pt).join(' L')}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
    + (river ? '' : `<path d="M${e.pts.map(pt).join(' L')}" stroke="#FFFFFF" stroke-width="1" stroke-dasharray="6 6" fill="none" opacity=".7"/>`);
}

function tower(e, P) {
  const { x, y, h } = e; const bw = Math.max(6, h * .14); const tw = 3;
  let d = `M${x - bw},${y} L${x - tw},${y - h} L${x + tw},${y - h} L${x + bw},${y}`;
  for (let k = 1; k < 5; k++) {
    const yy = y - h * k / 5; const w1 = bw - (bw - tw) * (k - 1) / 5; const w2 = bw - (bw - tw) * k / 5;
    d += ` M${n1(x - w1)},${n1(y - h * (k - 1) / 5)} L${n1(x + w2)},${n1(yy)} M${n1(x + w1)},${n1(y - h * (k - 1) / 5)} L${n1(x - w2)},${n1(yy)}`;
  }
  const arm = `M${x - bw * 1.4},${y - h * .82} L${x + bw * 1.4},${y - h * .82}`;
  return `<path d="${d} ${arm}" stroke="${P.obj}" stroke-width="1.2" fill="none"/>`;
}

function pole(e, P) {
  const { x, y, h } = e;
  return `<path d="M${x},${y} L${x},${y - h} M${x - 6},${y - h + 3} L${x + 6},${y - h + 3}" stroke="${P.obj}" stroke-width="2" stroke-linecap="round"/>`;
}

function wire(e, P) {
  const sag = e.sag ?? 6; const p = e.pts;
  let d = `M${pt(p[0])}`;
  for (let k = 1; k < p.length; k++) {
    const mx = (p[k - 1][0] + p[k][0]) / 2; const my = (p[k - 1][1] + p[k][1]) / 2 + sag * 2;
    d += ` Q${n1(mx)},${n1(my)} ${pt(p[k])}`;
  }
  const c = e.hit ? PH.danger : P.wire;
  return `<path d="${d}" stroke="${c}" stroke-width="${e.hit ? 1.8 : 1.3}" fill="none"/>`;
}

function treeAt(x, y, h, P) {
  const r = h * .32;
  return `<path d="M${x},${y} L${x},${y - h * .45}" stroke="#7A6A55" stroke-width="1.6"/>
    <ellipse cx="${x}" cy="${n1(y - h + r)}" rx="${n1(r * .9)}" ry="${n1(r * 1.15)}" fill="${P.forest}" stroke="${P.hill}" stroke-width=".8"/>`;
}

function trees(e, P) {
  const n = e.n || Math.max(2, Math.round((e.x2 - e.x1) / 14)); const h = e.h || 22;
  let s = '';
  for (let k = 0; k < n; k++) {
    const x = e.x1 + (e.x2 - e.x1) * (n === 1 ? .5 : k / (n - 1));
    s += treeAt(n1(x), e.y, h * (0.85 + 0.3 * ((k * 37) % 7) / 7), P);
  }
  return s;
}

function building(e, P) {
  const { x, y, w, h } = e;
  let win = '';
  for (let yy = y - h + 5; yy < y - 6; yy += 9) for (let xx = x + 4; xx < x + w - 5; xx += 8) win += `<rect x="${xx}" y="${yy}" width="4" height="4" fill="${P.win}" opacity=".7"/>`;
  return `<rect x="${x}" y="${y - h}" width="${w}" height="${h}" fill="${P.objFill}" stroke="${P.obj}" stroke-width="1"/>${win}`;
}

function ship(e, P) {
  const { x, y, w } = e; const h = Math.max(10, w * .14);
  const deck = e.deck !== false
    ? `<rect x="${x + w * .62}" y="${y - h - 3}" width="${w * .36}" height="3" fill="${P.obj}"/>
       <rect x="${x + w * .3}" y="${y - h - 16}" width="${w * .22}" height="16" fill="${P.objFill}" stroke="${P.obj}"/>`
    : `<rect x="${x + w * .35}" y="${y - h - 14}" width="${w * .25}" height="14" fill="${P.objFill}" stroke="${P.obj}"/>`;
  return `${deck}<path d="M${x},${y - h} L${x + w},${y - h} L${x + w - h * .8},${y} L${x + h * .5},${y} Z" fill="${P.obj}"/>`;
}

function rig(e, P) {
  const s = e.s || 1; const { x, y } = e;
  return `<g transform="translate(${x},${y}) scale(${s})">
    <path d="M-30,0 L-26,-46 M30,0 L26,-46 M-10,0 L-10,-46 M10,0 L10,-46 M-28,-20 L28,-20" stroke="${P.obj}" stroke-width="2" fill="none"/>
    <rect x="-36" y="-56" width="72" height="10" fill="${P.objFill}" stroke="${P.obj}"/>
    <rect x="12" y="-60" width="24" height="4" fill="${P.obj}"/>
    <path d="M-28,-56 L-22,-84 L-16,-56" stroke="${P.obj}" stroke-width="1.4" fill="none"/></g>`;
}

function pad(e, view, P) {
  const w = e.w || 40;
  if (view === 'top') {
    return `<circle cx="${e.x}" cy="${e.y}" r="${w / 2}" fill="${P.runway}" stroke="#FFFFFF" stroke-width="1.5"/>
      <text x="${e.x}" y="${e.y + w * .16}" text-anchor="middle" font-size="${n1(w * .45)}" fill="#FFFFFF" class="mono">H</text>`;
  }
  return `<rect x="${e.x - w / 2}" y="${e.y}" width="${w}" height="3.5" fill="${P.obj}"/>`;
}

function runway(e, view, P) {
  if (view === 'top') {
    const { x, y, w, h } = e;
    return `<g transform="rotate(${e.rot || 0} ${x + w / 2} ${y + h / 2})"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${P.runway}"/>
      <path d="M${x + 8},${y + h / 2} L${x + w - 8},${y + h / 2}" stroke="#FFFFFF" stroke-width="1.2" stroke-dasharray="10 8"/></g>`;
  }
  return `<rect x="${e.x1}" y="${e.y}" width="${e.x2 - e.x1}" height="4" fill="${P.runway}"/>
    <path d="M${e.x1 + 4},${e.y + 2} L${e.x2 - 4},${e.y + 2}" stroke="#FFFFFF" stroke-width="1" stroke-dasharray="8 6"/>`;
}

function person(e, P) {
  const { x, y } = e;
  return `<g stroke="${P.text}" stroke-width="1.5" fill="none" stroke-linecap="round"><circle cx="${x}" cy="${y - 13}" r="2.6" fill="${P.text}"/>
    <path d="M${x},${y - 10} L${x},${y - 4} M${x - 3.5},${y - 8} L${x + 3.5},${y - 8} M${x},${y - 4} L${x - 3},${y} M${x},${y - 4} L${x + 3},${y}"/></g>`;
}

function vehicle(e, P) {
  const f = e.flip ? -1 : 1;
  return `<g transform="translate(${e.x},${e.y}) scale(${f},1)"><path d="M-12,-3 L-12,-8 L-4,-8 L-1,-13 L8,-13 L12,-8 L12,-3 Z" fill="${P.obj}"/>
    <circle cx="-7" cy="-2" r="2.5" fill="${P.text}"/><circle cx="7" cy="-2" r="2.5" fill="${P.text}"/></g>`;
}

function box(e, P) {
  const t = e.text ? textEl({ x: e.x + e.w / 2, y: e.y + e.h / 2 + 4.5, text: e.text, anchor: 'middle', size: 13 }, P) : '';
  return `<rect x="${e.x}" y="${e.y}" width="${e.w}" height="${e.h}" rx="3" fill="${P.objFill}" stroke="${P.obj}"/>${t}`;
}

function cloud(e, P) {
  const { x, y, w } = e; const h = e.h || w * .4;
  const d = `M${x},${y + h} C${x - h * .4},${y + h} ${x - h * .4},${y + h * .4} ${x + w * .1},${y + h * .45}
    C${x + w * .12},${y} ${x + w * .45},${y - h * .1} ${x + w * .5},${y + h * .25}
    C${x + w * .6},${y - h * .05} ${x + w * .92},${y + h * .1} ${x + w * .88},${y + h * .5}
    C${x + w + h * .3},${y + h * .5} ${x + w + h * .3},${y + h} ${x + w},${y + h} Z`;
  return `<path d="${d}" fill="${P.cloud}" stroke="${P.muted}" stroke-opacity=".35" stroke-width="1"/>`;
}

let FOG = 0;
function fog(e, P, defs) {
  const id = `fg${++FOG}`;
  defs.push(`<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.cloud}" stop-opacity="0"/>
    <stop offset=".35" stop-color="${P.cloud}" stop-opacity=".85"/><stop offset="1" stop-color="${P.cloud}" stop-opacity=".7"/></linearGradient>`);
  const x1 = e.x1 ?? 0; const x2 = e.x2 ?? W;
  return `<rect x="${x1}" y="${e.y1}" width="${x2 - x1}" height="${e.y2 - e.y1}" fill="url(#${id})"/>`;
}

function burst(e) {
  const r = e.r || 12; let d = '';
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * Math.PI * 2; const rr = k % 2 ? r * .45 : r;
    d += `${k ? 'L' : 'M'}${n1(e.x + Math.cos(a) * rr)},${n1(e.y + Math.sin(a) * rr)} `;
  }
  return `<path d="${d}Z" fill="${PH.warn}" stroke="${PH.danger}" stroke-width="1.4" stroke-linejoin="round"/>`;
}

// เส้นทางบินแบบ Catmull-Rom เพื่อให้โค้งนุ่ม
function smoothD(p) {
  if (p.length < 3) return `M${p.map(pt).join(' L')}`;
  let d = `M${pt(p[0])}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] || p[i]; const p1 = p[i]; const p2 = p[i + 1]; const p3 = p[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${pt(c1)} ${pt(c2)} ${pt(p2)}`;
  }
  return d;
}

function path(e, defs) {
  const c = PH[e.ph || 'normal'];
  let mk = '';
  if (e.arrow !== false) {
    const id = `ar-${e.ph || 'normal'}`;
    if (!defs.some((s) => s.includes(`id="${id}"`))) {
      defs.push(`<marker id="${id}" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,1 L9,5 L0,9 Z" fill="${c}"/></marker>`);
    }
    mk = ` marker-end="url(#${id})"`;
  }
  const d = e.smooth === false ? `M${e.pts.map(pt).join(' L')}` : smoothD(e.pts);
  return `<path d="${d}" stroke="${c}" stroke-width="2" fill="none" stroke-linecap="round"${e.dash ? ' stroke-dasharray="5 4"' : ''}${mk}/>`;
}

function line(e, P) {
  const c = e.color ? (e.color === 'muted' ? P.muted : PH[e.color] || e.color) : P.obj;
  return `<path d="M${e.pts.map(pt).join(' L')}" stroke="${c}" stroke-width="${e.w || 1.3}" fill="none"${e.dash ? ' stroke-dasharray="4 3"' : ''}/>`;
}

function mark(e, P) {
  const c = e.ph && e.ph !== 'normal' ? PH[e.ph] : '#444441';
  return `<circle cx="${e.x}" cy="${e.y}" r="9" fill="${c}" stroke="${P.halo}" stroke-width="2"/>
    <text x="${e.x}" y="${e.y + 4.2}" text-anchor="middle" font-size="12" fill="${e.ph === 'warn' ? '#2C2C2A' : '#FFFFFF'}" class="mono">${esc(e.n)}</text>`;
}

function textEl(e, P) {
  const size = e.size || 14;
  const tone = { muted: P.muted, warn: '#B4600A', bad: '#C42F2E', info: '#185FA5' }[e.tone] || P.text;
  const toneN = e.tone && P.halo !== '#FFFFFF' ? { warn: '#FFC266', bad: '#FF8A85', info: '#8DC2F5' }[e.tone] : null;
  const lines = String(e.text).split('\n');
  const tsp = lines.map((l, k) => `<tspan x="${e.x}" dy="${k ? n1(size * 1.4) : 0}">${esc(l)}</tspan>`).join('');
  return `<text x="${e.x}" y="${e.y}" font-size="${size}" text-anchor="${e.anchor || 'start'}" fill="${toneN || tone}" stroke="${P.halo}" class="hl">${tsp}</text>`;
}

function dim(e, P) {
  const { x1, y1, x2, y2 } = e;
  const c = e.unknown ? P.muted : P.text;
  const dx = x2 - x1; const dy = y2 - y1; const L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L * 4; const ny = dx / L * 4;
  const ticks = `M${n1(x1 - nx)},${n1(y1 - ny)} L${n1(x1 + nx)},${n1(y1 + ny)} M${n1(x2 - nx)},${n1(y2 - ny)} L${n1(x2 + nx)},${n1(y2 + ny)}`;
  const vert = Math.abs(dx) < Math.abs(dy);
  const side = e.side === 'left' ? -1 : 1;
  const tx = vert ? (x1 + x2) / 2 + side * 6 : (x1 + x2) / 2;
  const ty = vert ? (y1 + y2) / 2 + 4.5 : Math.min(y1, y2) - 5;
  const text = e.unknown ? `${e.text} ?` : e.text;
  return `<path d="M${x1},${y1} L${x2},${y2} ${ticks}" stroke="${c}" stroke-width="1"${e.unknown ? ' stroke-dasharray="3 3"' : ''} fill="none"/>`
    + textEl({ x: n1(tx), y: n1(ty), text, anchor: vert ? (side < 0 ? 'end' : 'start') : 'middle', size: 13, tone: e.unknown ? 'muted' : '' }, P);
}

function wind(e, P) {
  const a = e.to || 0;
  const t = e.text ? textEl({ x: e.x, y: e.y + 26, text: e.text, anchor: 'middle', size: 13, tone: 'info' }, P) : '';
  return `<g transform="translate(${e.x},${e.y}) rotate(${a})"><path d="M-16,0 L12,0 M5,-6 L13,0 L5,6 M-16,-5 L-8,-5" stroke="#185FA5" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>${t}`;
}

function north(e, P) {
  return `<g transform="translate(${e.x},${e.y})"><path d="M0,-12 L5,4 L0,1 L-5,4 Z" fill="${P.text}"/>
    <text x="0" y="17" text-anchor="middle" font-size="12" fill="${P.text}" class="mono">N</text></g>`;
}

/* ── ประกอบฉาก ─────────────────────────────────────────────── */

function panelSvg(sc, idx) {
  const H = sc.h || 220; const view = sc.view || 'side'; const P = palette(!!sc.night);
  const defs = []; const out = [];
  const bgKind = sc.bg || (view === 'top' ? 'grass' : null);
  if (bgKind) out.push(`<rect width="${W}" height="${H}" fill="${fillOf(P, bgKind)}"/>`);
  else {
    const id = `sk${idx}${sc.night ? 'n' : ''}`;
    defs.push(`<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.sky1}"/><stop offset="1" stop-color="${P.sky2}"/></linearGradient>`);
    out.push(`<rect width="${W}" height="${H}" fill="url(#${id})"/>`);
    if (sc.night) for (let k = 0; k < 18; k++) out.push(`<circle cx="${(k * 89) % W}" cy="${(k * 37) % (H * .45)}" r=".9" fill="#FFFFFF" opacity=".6"/>`);
  }
  for (const e of sc.el || []) {
    switch (e.t) {
      case 'ground': out.push(ground(e, H, P)); break;
      case 'hill': out.push(hill(e, H, P)); break;
      case 'area': out.push(area(e, P)); break;
      case 'road': out.push(track(e, P, false)); break;
      case 'river': out.push(track(e, P, true)); break;
      case 'heli': out.push(craft(e, view, P, false)); break;
      case 'plane': out.push(craft(e, view, P, true)); break;
      case 'tower': out.push(tower(e, P)); break;
      case 'pole': out.push(pole(e, P)); break;
      case 'wire': out.push(wire(e, P)); break;
      case 'tree': out.push(treeAt(e.x, e.y, e.h || 22, P)); break;
      case 'trees': out.push(trees(e, P)); break;
      case 'building': out.push(building(e, P)); break;
      case 'ship': out.push(ship(e, P)); break;
      case 'rig': out.push(rig(e, P)); break;
      case 'pad': out.push(pad(e, view, P)); break;
      case 'runway': out.push(runway(e, view, P)); break;
      case 'person': out.push(person(e, P)); break;
      case 'vehicle': out.push(vehicle(e, P)); break;
      case 'box': out.push(box(e, P)); break;
      case 'cloud': out.push(cloud(e, P)); break;
      case 'fog': out.push(fog(e, P, defs)); break;
      case 'burst': out.push(burst(e)); break;
      case 'line': out.push(line(e, P)); break;
      case 'path': out.push(path(e, defs)); break;
      case 'mark': out.push(mark(e, P)); break;
      case 'label': out.push(textEl(e, P)); break;
      case 'dim': out.push(dim(e, P)); break;
      case 'wind': out.push(wind(e, P)); break;
      case 'north': out.push(north(e, P)); break;
      default: break;
    }
  }
  const aria = esc(`${VIEW_TH[view]}${sc.cap ? ` ${sc.cap}` : ''}`);
  return `<svg class="scn-svg${sc.night ? ' night' : ''}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${aria}">
    <defs>${defs.join('')}</defs>${out.join('')}</svg>`;
}

export function sceneHtml(spec) {
  if (!spec) return '';
  const panels = Array.isArray(spec.panels) ? spec.panels : [spec];
  const body = panels.map((sc, i) => `<div class="scn-pn">
      <p class="scn-cap"><span class="vw">${VIEW_TH[sc.view || 'side']}</span>${sc.cap ? `<span>${esc(sc.cap)}</span>` : ''}</p>
      ${panelSvg(sc, i)}</div>`).join('');
  const steps = (spec.steps || []).length ? `<ol class="scn-steps">${spec.steps.map((s) => `<li>
      <span class="n ph-${esc(s.ph || 'normal')}" title="${PH_TH[s.ph || 'normal']}">${esc(s.n)}</span><span class="t">${esc(s.text)}</span></li>`).join('')}</ol>` : '';
  // กรอบภาพจำลองแยกจากเนื้อเรื่อง: หัวกรอบ + ป้าย "ไม่ตามมาตราส่วน" · หัวข้อย่อย "ลำดับเหตุการณ์" ก่อนรายการขั้น
  return `<figure class="scn"><div class="scn-hd"><span class="scn-t">ภาพจำลองเหตุการณ์</span><span class="scn-tag">ภาพประกอบ · ไม่ตามมาตราส่วน</span></div>
    ${body}${steps ? `<p class="scn-sh">ลำดับตามหมุดในภาพ</p>${steps}` : ''}
    ${spec.note ? `<figcaption>${esc(spec.note)}</figcaption>` : ''}</figure>`;
}
