// W2 Safety Brief — vanilla JS, hash routing, ไม่มี build step
// เส้นทาง: #/  #/results  #/case/:id  #/brief (หน้าปก)  #/brief/:id[/ประเด็น]  #/brief/end  #/dashboard  #/areas  #/about

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
// อยู่แค่ในแท็บนี้ ปิดแท็บแล้วหาย: กุญแจตอนไม่ติ๊ก "จำไว้ในเครื่องนี้" และการเลือกดูเฉพาะเคสสากล
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

const EMPTY_SEL = { aircraft: null, mission: null, environment: [], phase: [], hfacs: [], area: null };
// ค่าเริ่มต้น 10 ปี: กราฟรายปีอ่านง่ายบนมือถือ และเป็นช่วงที่ยังเกี่ยวกับการบินปัจจุบัน
const DASH0 = { src: 'ALL', ac: 'ALL', span: '10Y' };
const state = {
  tax: null,
  intl: [],
  intlVersion: '',
  unit: [],
  unitVersion: '',
  unitStatus: 'missing', // missing | locked | unlocked
  sel: { ...EMPTY_SEL, ...LS.get('sel', {}) },
  showAll: false,
  nearOpen: false,
  dash: { ...DASH0, ...LS.get('dash', {}) },
  drill: null, // { k, v, l } แท่งที่กดในหน้าภาพรวม
  dashDeck: [],
  from: '', // results | dashboard — หน้าที่เปิดเคสมา ใช้กับปุ่มย้อนกลับและก่อนหน้า/ถัดไป
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
}

// หน้าเข้าสู่ระบบเต็มจอ (login.js โหลดเฉพาะตอนต้องใช้) — DECISIONS.md หัวข้อ "หน้าเข้าสู่ระบบ"
async function showGate() {
  document.body.classList.add('gated');
  $('meta[name="theme-color"]').content = '#060a13';
  try {
    const { openGate } = await import('./login.js');
    openGate({
      iter: unitEnc.iter,
      unlock: async (pass, remember) => { try { await unlock(pass, remember); return true; } catch { return false; } },
      onEnter: route,
      onSkip: () => SS.set('gateSkip', true),
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
const hfacsTier = (code) => state.tax.hfacs.find((h) => h.code === code)?.tier ?? '';
// แบบ ฮ. ที่ปลดประจำการแล้ว (active=0) ใช้ติดเคสย้อนหลัง แต่ไม่เป็นตัวเลือก
const inService = (x) => x.active !== '0';

/* ── การจับคู่ ───────────────────────────────────────────── */

const hit = (arr, v) => arr.includes('ALL') || arr.includes(v);
const anyHit = (arr, vs) => arr.includes('ALL') || vs.some((v) => arr.includes(v));
const overlap = (arr, vs) => vs.filter((v) => arr.includes(v)).length;
const ready = (s = state.sel) => !!(s.aircraft && s.mission && s.environment.length);

function match() {
  const s = state.sel;
  const strict = [], near = [];
  if (!ready(s)) return { strict, near };
  for (const c of allCases()) {
    const m = [hit(c.aircraft, s.aircraft), hit(c.mission, s.mission), anyHit(c.environment, s.environment)];
    const n = m.filter(Boolean).length;
    const opt = overlap(c.phase, s.phase)
      + overlap(c.hfacs.map(hfacsCat), s.hfacs)
      + (s.area && c.area_id === s.area ? 1 : 0);
    // ตรงจริง ไม่ใช่ผ่าน ALL: แบบ ฮ. > ภารกิจ > สภาพแวดล้อม — เคสเฉพาะแบบขึ้นก่อนเคสทุกแบบ
    const spec = (c.aircraft.includes(s.aircraft) ? 4 : 0) + (c.mission.includes(s.mission) ? 2 : 0)
      + (overlap(c.environment, s.environment) ? 1 : 0);
    const item = { c, m, opt, spec };
    if (n === 3) strict.push(item);
    else if (n === 2) near.push(item);
  }
  // เคสของหน่วย (W2) ขึ้นก่อนเสมอ แล้วจึงดูตัวกรองเสริม → ความเฉพาะเจาะจง → RTAF > INTL → ปีใหม่กว่า
  const unitFirst = (a, b) => (a.c.source !== 'W2') - (b.c.source !== 'W2');
  const order = (a, b) => unitFirst(a, b) || b.opt - a.opt || b.spec - a.spec
    || SRC_RANK[a.c.source] - SRC_RANK[b.c.source] || b.c.year - a.c.year;
  strict.sort(order);
  // เคสใกล้เคียง: W2 ก่อน แล้วแบบ ฮ. เดียวกันขึ้นก่อน
  near.sort((a, b) => unitFirst(a, b) || b.m[0] - a.m[0] || order(a, b));
  return { strict, near };
}

// ลำดับเคสสำหรับปุ่มก่อนหน้า/ถัดไป = เคสที่เห็นอยู่ในหน้ารายการ (โหมดบรีฟใช้ชุดที่เลือกเข้าบรีฟ ดู briefSet)
function deck() {
  const { shown, nearShown } = visible();
  return [...shown, ...nearShown].map((x) => x.c.id);
}
function deckFor(id) {
  if (state.from === 'dashboard') return state.dashDeck.includes(id) ? state.dashDeck : [id];
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
    + `<span class="tag src ${esc(c.source)}">${esc(c.source)}</span>`
    + (year ? `<span class="yr">${esc(c.year)}</span>` : '')
    + (c.status !== 'published' ? `<span class="tag draft" title="ยังไม่ผ่านการตรวจทาน">${dot('hollow')}ร่าง</span>` : '');
}

// ค่าที่เลือกไว้ แสดงเป็นคำไทย
const selText = {
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

const STEPS = [
  { k: 'aircraft', th: 'แบบ ฮ.', short: 'แบบ ฮ.' },
  { k: 'mission', th: 'ภารกิจ', short: 'ภารกิจ' },
  { k: 'environment', th: 'อากาศ / สภาพแวดล้อม', short: 'สภาพอากาศ' },
];

function viewFilter() {
  const t = state.tax;
  const squadrons = {};
  for (const a of t.aircraft.filter(inService)) (squadrons[a.squadron] ??= []).push(a);
  const ck = icon('check', 'ic ck');
  const chip = (k, x) => `<button class="chip" data-k="${k}" data-v="${esc(x.code)}" aria-pressed="false">${ck}${esc(x.label)}</button>`;
  const tiers = {};
  for (const h of t.hfacs) if (h.level === 'category') (tiers[h.tier] ??= []).push(h);
  const optCount = state.sel.phase.length + state.sel.hfacs.length + (state.sel.area ? 1 : 0);

  main.innerHTML = `<div class="lay"><div class="view filter">
    <p class="eyebrow">บรีฟก่อนบิน · บน.2 · ${esc(thDate())}</p>
    <h1 class="page-h">เที่ยวบิน<em>วันนี้</em></h1>
    ${steps()}

    <section class="step" id="st-aircraft">
      <div class="step-h"><span class="num">01</span><h2>แบบ ฮ.</h2><span class="hint"></span></div>
      ${Object.entries(squadrons).map(([q, list]) => `<div class="sqn" role="group" aria-label="ฝูง ${q}">
        <p class="sqn-l">ฝูง<b>${esc(q)}</b></p>
        <div class="tiles">${list.map((a) => `<button class="tile" data-k="aircraft" data-v="${esc(a.code)}" aria-pressed="false">
          <span class="code">${esc(a.code)}</span><span class="lab">${esc(a.label)}</span>${icon('check', 'ic ck')}</button>`).join('')}</div>
      </div>`).join('')}
    </section>

    <section class="step" id="st-mission">
      <div class="step-h"><span class="num">02</span><h2>ภารกิจ</h2><span class="hint"></span></div>
      <div class="chips">${t.mission.map((x) => chip('mission', x)).join('')}</div>
    </section>

    <section class="step" id="st-environment">
      <div class="step-h"><span class="num">03</span><h2>อากาศ / สภาพแวดล้อม</h2><span class="hint"></span></div>
      <div class="chips">${t.environment.map((x) => chip('environment', x)).join('')}</div>
    </section>

    <details class="opt step" id="st-opt"${optCount ? ' open' : ''}>
      <summary class="step-h"><span class="num">04</span><h2>เพิ่มเติม <span class="note">ไม่บังคับ</span></h2><span class="hint" id="opt-hint"></span>${icon('down')}</summary>
      <div class="body">
        <div><p class="sub-h">ขั้นตอนการบิน</p><div class="chips">${t.phase.map((x) => chip('phase', x)).join('')}</div></div>
        <div><p class="sub-h">หมวดสาเหตุ (HFACS)</p>
          ${Object.entries(tiers).map(([tier, list]) => `<p class="tier-h">${esc(tier)}</p>
            <div class="chips">${list.map((h) => `<button class="chip" data-k="hfacs" data-v="${esc(h.code)}" aria-pressed="false">${ck}${esc(h.label)}<small>${esc(h.code)}</small></button>`).join('')}</div>`).join('')}
        </div>
        <div><p class="sub-h">พื้นที่</p><p class="note">ยังเลือกไม่ได้ เพราะยังไม่มีรายการ hazard ประจำพื้นที่ — จะเพิ่มหลังได้ไฟล์จาก FSO คนเดิม ระหว่างนี้ดูเคสได้จาก 3 ขั้นด้านบน</p></div>
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
  let counts = '<p class="note">เลือกให้ครบ 3 ขั้นเพื่อดูบทเรียน</p>';
  if (ready(s)) {
    const { strict, near } = match();
    counts = `<p class="side-n"><b>${strict.length}</b> เคสตรงเที่ยวบินนี้${near.length ? `<span>+${near.length} ใกล้เคียง</span>` : ''}</p>`;
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
    $('.hint', el).textContent = done
      ? (st.k === 'environment' ? `เลือก ${s.environment.length} ข้อ` : 'เลือกแล้ว')
      : (st.k === 'environment' ? 'เลือกได้หลายข้อ' : 'เลือก 1 ข้อ');
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
    const { strict, near } = match();
    go.className = 'btn btn-primary';
    go.innerHTML = `ดูบทเรียน <span class="count">${strict.length}</span>`
      + (near.length ? ` <span class="near">+${near.length} ใกล้เคียง</span>` : '');
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
    s[k] = s[k] === v ? null : v;
  }
  LS.set('sel', s);
  state.showAll = false;
  state.nearOpen = false;
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
  const parts = [
    m[0] ? (c.aircraft.includes('ALL') ? 'ทุกแบบ' : esc(s.aircraft)) : miss('แบบ', c.aircraft.join('/')),
    m[1] ? (c.mission.includes('ALL') ? 'ทุกภารกิจ' : esc(label('mission', s.mission))) : miss('ภารกิจ', labs('mission', c.mission)),
    m[2] ? (c.environment.includes('ALL') ? 'ทุกสภาพอากาศ' : esc(labs('environment', s.environment.filter((e) => c.environment.includes(e)))))
      : miss('สภาพอากาศ', labs('environment', c.environment)),
  ];
  const opt = [...c.phase.filter((p) => s.phase.includes(p)), ...c.hfacs.filter((h) => s.hfacs.includes(hfacsCat(h)))];
  return parts.join(' · ') + (opt.length ? ` <span class="opt">+ ${esc(opt.join(' '))}</span>` : '');
}

// การ์ดเคส (ใช้ในรายการของหน้าภาพรวม)
function card(item) {
  const c = item.c;
  return `<a class="card" href="#/case/${encodeURIComponent(c.id)}">
    <div class="meta">${tags(c)}</div>
    <h3>${esc(c.title)}</h3>
    <p class="ml">${item.line ?? matchLine(item)}</p>
    ${icon('next', 'ic go')}
  </a>`;
}

/* เรื่องที่เลือกเข้าบรีฟ (ปุ่ม +/✓): จำต่อชุดตัวกรอง เปลี่ยนตัวกรองแล้วกลับไปใช้ 3 อันดับแรก */
function selKey(s = state.sel) {
  return JSON.stringify([s.aircraft, s.mission, [...s.environment].sort(), [...s.phase].sort(), [...s.hfacs].sort(), s.area]);
}
function picks({ strict, near } = match()) {
  const order = [...strict, ...near].map((x) => x.c.id);
  const saved = LS.get('picks', null);
  const ids = saved && saved.key === selKey() ? saved.ids
    : (strict.length ? strict : near).slice(0, SHOW_TOP).map((x) => x.c.id);
  return ids.filter((id) => order.includes(id)).sort((a, b) => order.indexOf(a) - order.indexOf(b));
}
function setPicks(ids) { LS.set('picks', { key: selKey(), ids }); }

// แถวที่เห็นในหน้ารายการ: 3 อันดับแรก + เรื่องที่เลือกไว้ (หรือทั้งหมดเมื่อกด "ดูเพิ่ม")
function visible() {
  const m = match();
  const pk = picks(m);
  const shown = m.strict.filter((x, i) => state.showAll || i < SHOW_TOP || pk.includes(x.c.id));
  const nearShown = m.near.filter((x) => state.nearOpen || !m.strict.length || pk.includes(x.c.id));
  return { ...m, pk, shown, nearShown };
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
  if (!ready()) { location.replace('#/'); return; }
  const { strict, near, pk, shown, nearShown } = visible();
  const s = state.sel;
  const row = (x) => `<li><span class="yr">${esc(x.c.year)}</span>
    <a class="rt" href="#/case/${encodeURIComponent(x.c.id)}"><b>${esc(x.c.title)}</b><span class="meta">${tags(x.c, { year: false })}</span><span class="ml">${matchLine(x)}</span></a>
    ${pickBtn(x.c, pk.includes(x.c.id))}</li>`;

  const filt = [s.aircraft, label('mission', s.mission), ...s.environment.map((e) => label('environment', e))];
  let html = `<div class="lay${strict.length || near.length ? '' : ' solo'}"><div class="view results">
    <p class="eyebrow">บรีฟก่อนบิน · ${esc(thDate())}</p>
    <div class="filt" aria-label="ตัวกรองที่ใช้">${filt.map((f) => `<span>${esc(f)}</span>`).join('')}<a class="edit" href="#/">แก้</a></div>`;

  if (strict.length) {
    const types = {};
    for (const x of strict) types[x.c.type] = (types[x.c.type] || 0) + 1;
    html += `<div class="hero"><span class="big">${strict.length}</span><div>
        <h1>บทเรียนตรงเที่ยวบินนี้</h1><p>ตรงครบ 3 เงื่อนไข · จากทั้งหมด ${allCases().length} เคส</p></div></div>
      <div class="mix">${Object.entries(types).sort((a, b) => b[1] - a[1]).map(([t, n]) => {
        const [th, cls] = typeOf({ type: t });
        return `<div class="${cls === 'bad' ? 'c-bad' : 'c-warn'}">${esc(th)}<b>${n}</b><i style="--w:${(n / strict.length) * 100}%"></i></div>`;
      }).join('')}</div>
      <div class="sec-row"><h2>เลือกเข้าบรีฟ</h2><span id="pick-n">เลือกแล้ว ${pk.length} เรื่อง</span></div>
      <p class="note">แตะ + เพื่อเลือกเรื่องเข้าบรีฟ · 3 อันดับแรกเลือกไว้ให้แล้ว</p>
      <ul class="rows">${shown.map(row).join('')}</ul>`;
    if (strict.length > SHOW_TOP) {
      html += `<button class="btn more" data-act="all">${state.showAll ? 'แสดงเฉพาะ 3 อันดับแรกและเรื่องที่เลือก' : `ดูเพิ่ม · อีก ${strict.length - shown.length} เคส`}</button>`;
    }
  } else {
    const locked = state.unitStatus === 'locked';
    html += `<div class="empty">${icon('brief')}
      <h2>ยังไม่มีบทเรียนที่ตรงครบ 3 เงื่อนไข</h2>
      <p>ฐานข้อมูลยังไม่มีเคสที่ตรงทั้งแบบ ฮ. ภารกิจ และสภาพอากาศที่เลือกพร้อมกัน</p>
      <p>${near.length ? 'ด้านล่างคือเคสที่ตรง 2 ใน 3 เงื่อนไข ใช้ประกอบการบรีฟได้ หรือแก้ตัวกรองให้กว้างขึ้น'
        : 'ลองเลือกสภาพอากาศเพิ่ม หรือเปลี่ยนภารกิจ'}${locked ? ' · ปลดล็อกข้อมูลหน่วยเพื่อดูเคสของ บน.2 ด้วย' : ''}</p>
      <div class="acts"><a class="btn" href="#/">แก้ตัวกรอง</a>${locked ? '<a class="btn" href="#/about">ปลดล็อกข้อมูลหน่วย</a>' : ''}</div></div>`;
  }

  if (near.length) {
    html += `<div class="group-h"><h2>ใกล้เคียง · ${near.length}</h2><p>ตรง 2 ใน 3 เงื่อนไข — ข้อความสีส้มบอกว่าต่างตรงไหน</p></div>`;
    if (!strict.length) html += `<div class="sec-row"><h2>เลือกเข้าบรีฟ</h2><span id="pick-n">เลือกแล้ว ${pk.length} เรื่อง</span></div>`;
    if (nearShown.length) html += `<ul class="rows">${nearShown.map(row).join('')}</ul>`;
    if (nearShown.length < near.length) {
      html += `<button class="btn more" data-act="near">แสดงเคสใกล้เคียง${nearShown.length ? 'อีก' : ''} ${near.length - nearShown.length} เคส</button>`;
    }
  }
  html += '</div>';
  if (strict.length || near.length) {
    html += `<aside class="side" aria-label="ชุดบรีฟวันนี้">
      <div class="side-sum" id="side-picks">${pickList(pk)}</div>
      <div class="actbar"><div class="actbar-in">
        <button class="btn btn-primary" id="present"${pk.length ? '' : ' disabled'}>${presentLabel(pk.length)}</button>
      </div></div></aside>`;
  }
  main.innerHTML = html + '</div>';
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

// ลำดับในหน้าเคส: สรุป → ปัจจัย (พับไว้) → ทำวันนี้ (เช็กลิสต์ 56px) → คำถามบรีฟ → HFACS → ต้นฉบับ
// จอคอมฯ: ทำวันนี้ + คำถามบรีฟ ย้ายไปแผงด้านขวา และกางปัจจัยไว้ (ลำดับ DOM คงเดิมสำหรับมือถือ)
function viewCase(id) {
  const c = byId(id);
  if (!c) { viewNotFound(); return; }
  const d = deckFor(id);
  const i = d.indexOf(id);
  const done = ticks().cases[id] || [];
  const ref = safeUrl(c.ref);
  const fromRes = state.from !== 'dashboard' && ready();
  const facOpen = wide.matches;
  const href = (dir) => `#/case/${encodeURIComponent(d[nextIdx(d.length, i, dir)])}`;
  const nav = d.length > 1 ? `<a class="btn" data-replace href="${href(-1)}" aria-label="เคสก่อนหน้า">${icon('back')}<span>ก่อนหน้า</span></a>
    <a class="btn" data-replace href="${href(1)}" aria-label="เคสถัดไป"><span>ถัดไป</span>${icon('next')}</a>` : '';

  main.innerHTML = `<article class="view case">
    <div class="case-head">
      <div class="case-top">
        <a class="back" href="${state.from === 'dashboard' ? '#/dashboard' : '#/results'}" aria-label="กลับไปรายการ">${icon('back')}</a>
        <div class="meta">${tags(c)}</div>
        <span class="pos">${d.length > 1 ? `${i + 1}/${d.length}` : ''}</span>
        ${fromRes ? pickBtn(c, picks().includes(id)) : ''}
      </div>
      <h1>${esc(c.title)}</h1>
      <p class="summary">${esc(c.summary)}</p>

      ${c.factors.length ? `<button class="fac-t" data-act="factors" aria-expanded="${facOpen}" aria-controls="fac">ปัจจัยที่เกี่ยวข้อง
        <span class="n">${c.factors.length} ข้อ ${icon('down')}</span></button>
      <ul class="factors" id="fac"${facOpen ? '' : ' hidden'}>${c.factors.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>` : ''}
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

      ${ref ? `<a class="btn ref" href="${esc(ref)}" target="_blank" rel="noopener noreferrer">
        <span>อ่านรายงานต้นฉบับ<small>${esc(c.ref_label)} · ${esc(c.id)}</small></span>${icon('ext')}</a>`
        : `<p class="ref-note"><span class="k">ที่มา</span>${esc(c.ref)} · ${esc(c.id)}</p>`}
    </div>
  </article>
  ${nav ? `<div class="actbar case-nav"><div class="actbar-in">${nav}</div></div>` : ''}`;
}

function toggleTick(id, k) {
  const t = ticks();
  const list = t.cases[id] || [];
  const i = list.indexOf(k);
  if (i < 0) list.push(k); else list.splice(i, 1);
  t.cases[id] = list;
  LS.set('ticks', t);
  const b = $(`[data-tick="${k}"]`, main);
  b.setAttribute('aria-pressed', String(i < 0));
  $('#prog').textContent = `${list.length}/${byId(id).actions_today.length}`;
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
  if (document.visibilityState === 'visible' && document.body.classList.contains('briefing')) keepAwake();
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

function pmain(c, key) {
  const pdo = `<ol class="pdo">${c.actions_today.map((a, k) => `<li><span>${k + 1}</span>${esc(a)}</li>`).join('')}</ol>`;
  switch (key) {
    case 'sum': return `<h1 class="ptitle">${esc(c.title)}</h1><p class="ptext">${esc(c.summary)}</p>`;
    case 'fac': return `<p class="plab">ปัจจัยที่เกี่ยวข้อง</p><ul class="pfac">${c.factors.slice(0, FAC_MAX).map((f) => `<li>${esc(f)}</li>`).join('')}</ul>`
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
          <span class="t">${esc(c.title)}</span><span class="m">${dot(cls)}${esc(th)} · ${esc(c.year)}</span></a></li>`;
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
        <div><h1>${esc(c.title)}</h1><p class="summary">${esc(c.summary)}</p></div>
        <div>
          <section class="ask"><p class="ask-l">คำถามบรีฟ</p><p class="q">${esc(c.brief_question)}</p></section>
          <h3>ทำวันนี้</h3>
          <ol class="pdo">${c.actions_today.map((a, k) => `<li><span>${k + 1}</span>${esc(a)}</li>`).join('')}</ol>
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

function toggleFull() {
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  else document.documentElement.requestFullscreen?.().catch(() => {});
}
document.addEventListener('fullscreenchange', () => {
  const b = $('#full');
  if (!b) return;
  b.innerHTML = icon(document.fullscreenElement ? 'shrink' : 'full');
  b.setAttribute('aria-label', fullLabel());
  b.title = fullLabel();
});

document.addEventListener('keydown', (e) => {
  if (!document.body.classList.contains('briefing') || e.ctrlKey || e.metaKey || e.altKey) return;
  // รีโมตพรีเซนเทชันส่ง PageUp/PageDown · ใช้ e.code กับ F เพื่อให้กดได้ตอนแป้นพิมพ์เป็นภาษาไทย
  if (['ArrowRight', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); briefGo(1); }
  else if (['ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); briefGo(-1); }
  else if (e.code === 'KeyF') { e.preventDefault(); toggleFull(); }
  else if (e.key === 'Escape') exitBrief();
});

let touchX = null;
document.addEventListener('touchstart', (e) => {
  touchX = document.body.classList.contains('briefing') ? e.touches[0].clientX : null;
}, { passive: true });
document.addEventListener('touchend', (e) => {
  if (touchX == null) return;
  const dx = e.changedTouches[0].clientX - touchX;
  touchX = null;
  if (Math.abs(dx) > 60) briefGo(dx < 0 ? 1 : -1);
}, { passive: true });

/* ── หน้าภาพรวม ───────────────────────────────────────────── */

// เรื่องที่เกิดซ้ำ: จับจากคำทั่วไปในชื่อ/สรุปเคส ไม่ผูกกับ id ของเคสหน่วย (โค้ดนี้อยู่ใน repo สาธารณะ)
const THEMES = [
  { k: 'bird', th: 'นก / ค้างคาวชน', rx: /นกชน|ชนนก|ค้างคาว|bird ?strike/i },
  { k: 'hyd', th: 'ระบบไฮดรอลิก', rx: /ไฮดรอลิก|\bHYD/i },
  { k: 'mgb', th: 'กระปุกเฟืองหลัก (MGB)', rx: /\bMGB|gearbox/i },
  { k: 'eng', th: 'เครื่องยนต์ / ไอเสีย', rx: /เครื่องยนต์(\s*\d)?\s*(ดับ|กำลังลด)|hot start|exhaust|ไอเสีย|borescope|คอมเพรสเซอร์|ไฟไหม้เครื่องยนต์/i },
  { k: 'fod', th: 'FOD / downwash', rx: /FOD|downwash|เศษหิน|เศษผิว/i },
  { k: 'tyre', th: 'ยาง / ล้อ', rx: /ล้อหลัก|ยางล้อ|\btyre|\btire/i },
  { k: 'wire', th: 'สายไฟ / สิ่งกีดขวาง', rx: /(เกี่ยว|ชน|พัน)สายไฟ|\bwires?\b|สิ่งกีดขวาง|obstacle/i },
  { k: 'wx', th: 'อากาศ / พายุ / เข้าเมฆ', rx: /\bIMC|เข้าเมฆ|ในเมฆ|พายุ|ฟ้าผ่า|ลมกระโชก/i },
];
const themeHit = (c, k) => THEMES.find((t) => t.k === k).rx.test(`${c.title} ${c.summary}`);

const typeKey = (t) => (t === 'accident' ? 'a' : t === 'incident' ? 'i' : 'h');
const DRILL = {
  year: (c, v) => c.year === Number(v),
  type: (c, v) => typeKey(c.type) === v,
  acft: (c, v) => c.aircraft.includes(v),
  phase: (c, v) => (v === '-' ? !c.phase.length : c.phase.includes(v)),
  tier: (c, v) => c.hfacs.some((h) => hfacsTier(h) === v),
  hfacs: (c, v) => (v === '-' ? !c.hfacs.length : c.hfacs.some((h) => hfacsCat(h) === v)),
  theme: (c, v) => themeHit(c, v),
};
// แท่งแต่ละชนิดแสดงรายการเคสใต้ section ไหน
const DRILL_SEC = { type: 'kpi', year: 'year', acft: 'acft', phase: 'phase', tier: 'hfacs', hfacs: 'hfacs', theme: 'theme' };

function dashCases() {
  const d = state.dash;
  const y0 = d.span === 'ALL' ? 0 : new Date().getFullYear() - (d.span === '5Y' ? 4 : 9);
  return allCases().filter((c) => (d.src === 'ALL' || c.source === d.src)
    && (d.ac === 'ALL' || hit(c.aircraft, d.ac)) && c.year >= y0);
}

function mix(list) {
  const m = { a: 0, i: 0, h: 0, n: list.length };
  for (const c of list) m[typeKey(c.type)]++;
  return m;
}

// แท่งแบ่งตามชนิดเหตุ: แดง = อุบัติเหตุ, ส้ม = อุบัติการณ์, ส้มลายเส้น = ความเสี่ยง
const segs = (m, max, dim) => ['a', 'i', 'h'].map((k) => (m[k]
  ? `<span class="sg ${k}" style="${dim}:${(m[k] / max) * 100}%"></span>` : '')).join('');

const isOn = (k, v) => String(state.drill?.k === k && state.drill.v === String(v));

function hbars(k, rows, max) {
  return `<div class="hbars">${rows.map((r) => `<button class="hb${r.cls ? ` ${r.cls}` : ''}" data-drill="${k}" data-dv="${esc(r.v)}" data-dl="${esc(r.l)}" aria-pressed="${isOn(k, r.v)}">
    <span class="bl">${esc(r.l)}${r.sub ? `<small>${r.sub}</small>` : ''}</span>
    <span class="tr" aria-hidden="true">${segs(r.m, max, 'width')}</span>
    <span class="bn">${r.m.n}</span></button>`).join('')}</div>`;
}

function drillHtml(sec, cs) {
  const dr = state.drill;
  if (!dr || DRILL_SEC[dr.k] !== sec) return '';
  const list = cs.filter((c) => DRILL[dr.k](c, dr.v))
    .sort((a, b) => b.year - a.year || SRC_RANK[a.source] - SRC_RANK[b.source]);
  state.dashDeck = list.map((c) => c.id);
  const meta = (c) => [c.aircraft.join('/'), c.phase.join('/'), c.hfacs.join(' ')].filter(Boolean).join(' · ');
  return `<div class="drill" id="drill">
    <div class="drill-h"><p class="eyebrow">เลือก · ${esc(dr.l)}</p><span class="n">${list.length} เคส</span>
      <button class="btn btn-icon" data-act="undrill" aria-label="ปิดรายการ">${icon('x')}</button></div>
    <div class="list">${list.map((c) => card({ c, line: `<span class="opt">${esc(meta(c))}</span>` })).join('')}</div>
  </div>`;
}

function viewDashboard() {
  const d = state.dash;
  const cs = dashCases();
  state.dashDeck = [];
  const segBtns = (k, opts) => `<div class="seg" role="group" style="grid-template-columns:repeat(${opts.length},1fr)">${opts.map(([v, t]) =>
    `<button data-dash="${k}" data-v="${v}" aria-pressed="${d[k] === v}">${t}</button>`).join('')}</div>`;
  const locked = state.unitStatus !== 'unlocked'
    ? `<p class="note dash-note">${icon('lock')}<span>ยังไม่ได้ปลดล็อกข้อมูลหน่วย ตอนนี้เห็นแค่เคสต่างประเทศ (INTL) · <a href="#/about">ปลดล็อก</a></span></p>` : '';
  const filters = `<section class="panel dash-f" aria-label="ตัวกรองภาพรวม">
    <p class="sub-h">แหล่งข้อมูล</p>${segBtns('src', [['ALL', 'ทั้งหมด'], ['W2', 'W2'], ['RTAF', 'RTAF'], ['INTL', 'INTL']])}
    <p class="sub-h">ช่วงปี</p>${segBtns('span', [['ALL', 'ทั้งหมด'], ['10Y', '10 ปี'], ['5Y', '5 ปี']])}
    <p class="sub-h">แบบ ฮ.</p><div class="chips">${[['ALL', 'ทุกแบบ'], ...state.tax.aircraft.filter(inService).map((a) => [a.code, a.code])].map(([v, t]) =>
      `<button class="chip" data-dash="ac" data-v="${esc(v)}" aria-pressed="${d.ac === v}">${esc(t)}</button>`).join('')}</div>
    ${d.ac !== 'ALL' ? '<p class="note" style="margin-top:8px">รวมเคสที่ระบุว่าใช้ได้ทุกแบบ</p>' : ''}
    ${locked}
  </section>`;

  let html = `<div class="view dash">
    <p class="eyebrow">แนวโน้มนิรภัย · บน.2</p>
    <h1 class="page-h">ภาพรวมเหตุการณ์</h1>
    ${filters}`;

  if (!cs.length) {
    main.innerHTML = `${html}<div class="empty">${icon('info')}<h2>ไม่มีเคสตามตัวกรองนี้</h2>
      <p>ช่วงปีหรือแหล่งข้อมูลที่เลือกยังไม่มีเคส ลองขยายช่วงปีเป็น "ทั้งหมด" หรือเลือกแหล่งข้อมูลอื่น</p><div class="acts"><button class="btn" data-act="dashreset">ล้างตัวกรอง</button></div></div></div>`;
    return;
  }

  const m = mix(cs);
  const ys = cs.map((c) => c.year);
  const y0 = Math.min(...ys), y1 = Math.max(...ys);
  const src = (s) => cs.filter((c) => c.source === s).length;
  const panel = (sec, title, hint, body) => `<section class="panel dsec" id="sec-${sec}">
    <h2>${title}${hint ? `<span class="hint">${hint}</span>` : ''}</h2>${body}${drillHtml(sec, cs)}</section>`;

  // KPI
  const kpi = (k, n, t) => `<button data-drill="type" data-dv="${k}" data-dl="${t}" aria-pressed="${isOn('type', k)}" class="k-${k}"${n ? '' : ' disabled'}><b>${n}</b><span>${t}</span></button>`;
  html += `<section class="dsec kpi" id="sec-kpi">
    <div class="stats kpis"><div><b>${m.n}</b><span>ทั้งหมด</span></div>${kpi('a', m.a, 'อุบัติเหตุ')}${kpi('i', m.i, 'อุบัติการณ์')}${kpi('h', m.h, 'ความเสี่ยง')}</div>
    <p class="kpi-sub">W2 ${src('W2')} · RTAF ${src('RTAF')} · INTL ${src('INTL')} · ${y0 === y1 ? y0 : `${y0}–${y1}`}</p>
    ${drillHtml('kpi', cs)}</section>`;

  // รายปี
  const yrs = [];
  for (let y = y0; y <= y1; y++) yrs.push([y, mix(cs.filter((c) => c.year === y))]);
  const maxY = Math.max(...yrs.map(([, x]) => x.n));
  const peaks = yrs.filter(([, x]) => x.n === maxY).map(([y]) => y);
  // หลายปีแท่งจะแคบ (51 ปีบนจอ 390px ≈ 6px/แท่ง): ซ่อนตัวเลขบนแท่ง และติดป้ายปีเฉพาะทุก 5/10 ปี
  const dense = yrs.length > 16;
  const step = yrs.length > 30 ? 10 : dense ? 5 : 1;
  const yLab = (y) => (y % step ? '' : `<span>${step > 1 ? y : String(y).slice(2)}</span>`);
  const legend = '<div class="legend" aria-hidden="true"><span><i class="sg a"></i>อุบัติเหตุ</span><span><i class="sg i"></i>อุบัติการณ์</span><span><i class="sg h"></i>ความเสี่ยง</span></div>';
  // ป้ายปีสูงสุดอยู่เหนือกราฟ ไม่ทับแท่ง
  html += panel('year', 'รายปี', '', `<p class="peak">สูงสุด ${peaks.join(' และ ')} · ${maxY} เคส</p><div class="tl${dense ? ' dense' : ''}">${yrs.map(([y, x]) =>
    `<button class="col${x.n === maxY ? ' pk' : ''}" data-drill="year" data-dv="${y}" data-dl="ปี ${y}" aria-pressed="${isOn('year', y)}" aria-label="ปี ${y}: ${x.n} เคส"${dense ? ` title="ปี ${y}: ${x.n} เคส"` : ''}${x.n ? '' : ' disabled'}>
      ${dense ? '' : `<span class="n">${x.n || ''}</span>`}<span class="stk">${segs(x, maxY, 'height')}</span><span class="y">${yLab(y)}</span></button>`).join('')}</div>${legend}`);

  // แบบ ฮ.
  const acRows = [...state.tax.aircraft.map((a) => ({ v: a.code, l: a.label })), { v: 'ALL', l: 'ทุกแบบ / แบบอื่น' }]
    .map((r) => ({ ...r, m: mix(cs.filter((c) => c.aircraft.includes(r.v))) })).filter((r) => r.m.n);
  html += panel('acft', 'แบบ ฮ.', 'เคสหนึ่งนับได้หลายแบบ', hbars('acft', acRows, Math.max(...acRows.map((r) => r.m.n))));

  // ขั้นตอนการบิน เรียงตามลำดับการบิน ไม่ใช่ตามจำนวน
  const phRows = [...state.tax.phase.map((p) => ({ v: p.code, l: p.label, sub: esc(p.code) })), { v: '-', l: 'ไม่ระบุ' }]
    .map((r) => ({ ...r, m: mix(cs.filter((c) => DRILL.phase(c, r.v))) })).filter((r) => r.m.n);
  html += panel('phase', 'ขั้นตอนการบิน', 'เรียงตามลำดับการบิน', hbars('phase', phRows, Math.max(...phRows.map((r) => r.m.n))));

  // HFACS: แถว tier ตามด้วยหมวดในนั้น
  const withH = cs.filter((c) => c.hfacs.length).length;
  let hf = '';
  if (withH) {
    const tiers = {};
    for (const h of state.tax.hfacs) if (h.level === 'category') (tiers[h.tier] ??= []).push(h);
    const rows = [];
    for (const [tier, list] of Object.entries(tiers)) {
      const tm = mix(cs.filter((c) => DRILL.tier(c, tier)));
      if (!tm.n) continue;
      rows.push({ k: 'tier', v: tier, l: tier, m: tm, cls: 'tier' });
      rows.push(...list.map((h) => ({ k: 'hfacs', v: h.code, l: h.label, sub: esc(h.code), cls: 'sub', m: mix(cs.filter((c) => DRILL.hfacs(c, h.code))) }))
        .filter((r) => r.m.n).sort((a, b) => b.m.n - a.m.n));
    }
    const max = Math.max(...rows.map((r) => r.m.n));
    hf = rows.map((r) => hbars(r.k, [r], max)).join('');
  }
  if (withH < cs.length) hf += hbars('hfacs', [{ v: '-', l: 'ยังไม่ได้ลง HFACS', m: mix(cs.filter((c) => !c.hfacs.length)), cls: 'none' }], cs.length);
  html += panel('hfacs', 'หมวดสาเหตุ (HFACS)', `${withH}/${cs.length} เคสลงรหัสแล้ว`, hf);

  // เรื่องที่เกิดซ้ำ
  const th = THEMES.map((t) => {
    const list = cs.filter((c) => themeHit(c, t.k));
    const unitYears = new Set(list.filter((c) => c.source !== 'INTL').map((c) => c.year));
    const years = [...new Set(list.map((c) => c.year))].sort();
    return { v: t.k, l: t.th, m: mix(list), sub: esc(years.join(' · ')) + (unitYears.size > 1 ? ' <span class="tag rep">ซ้ำในหน่วย</span>' : '') };
  }).filter((r) => r.m.n > 1).sort((a, b) => b.m.n - a.m.n);
  html += panel('theme', 'เรื่องที่เกิดซ้ำ', 'จับจากคำในชื่อ/สรุปเคส',
    th.length ? hbars('theme', th, Math.max(...th.map((r) => r.m.n))) : '<p class="note">ยังไม่พบเรื่องที่เกิดซ้ำตามตัวกรองนี้</p>');

  main.innerHTML = `${html}</div>`;
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
      <div class="acts"><a class="btn" href="#/">ไปเลือกเที่ยวบิน</a></div>
    </div>
  </div>`;
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
      เคสของหน่วย ${state.unit.length} เคส · ข้อมูล ${esc(fmtVer(state.unitVersion))}</div>
      ${state.unitDev ? `<p class="status-line"><span class="tag draft">${dot('hollow')}ทดสอบ</span>โหลดจาก dev server บนเครื่องนี้ (ไม่เข้ารหัส) — ใช้ทดสอบเท่านั้น</p>`
        : '<button class="btn" data-act="forget">ล้างกุญแจจากเครื่องนี้</button>'}`,
  }[st];

  main.innerHTML = `<div class="view">
    <p class="eyebrow">ระบบ</p>
    <h1 class="page-h">ข้อมูลและการตั้งค่า</h1>

    <section class="panel">
      <h2>${icon('lock')} ข้อมูลของหน่วย (W2 / RTAF)</h2>
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
        <div><b>${count('W2')}</b><span>W2</span></div>
        <div><b>${count('RTAF')}</b><span>RTAF</span></div>
        <div><b>${count('INTL')}</b><span>INTL</span></div>
      </div>
      <dl class="kv">
        <dt>เคสต่างประเทศ</dt><dd>${esc(fmtVer(state.intlVersion))}</dd>
        <dt>เคสของหน่วย</dt><dd>${st === 'unlocked' ? esc(fmtVer(state.unitVersion)) : '—'}</dd>
        <dt>ใช้แบบออฟไลน์</dt><dd>${navigator.serviceWorker?.controller ? 'พร้อม' : 'ยังไม่พร้อม — เปิดแอปตอนมีสัญญาณอีกครั้ง'}</dd>
      </dl>
    </section>

    <section class="panel">
      <h2>นโยบายข้อมูล</h2>
      <p style="margin:0">ทุกเคสไม่มีชื่อบุคคล หมายเลขเครื่อง หรือวันที่เต็ม (เก็บแค่ปี) · เคส INTL สรุปจากรายงานสอบสวนที่เผยแพร่สาธารณะ กดลิงก์ในแต่ละเคสเพื่ออ่านต้นฉบับ · เคสที่มีป้าย "ร่าง" ยังไม่ผ่านการตรวจทาน</p>
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
    msg.textContent = `ปลดล็อกแล้ว · ${state.unit.length} เคส`;
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
  $('meta[name="theme-color"]').content = t === 'day' ? '#f3f1ec' : '#060a13';
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

/* ── Router ───────────────────────────────────────────────── */

const scrollMemo = {};
let lastPath = null;

function route() {
  const path = location.hash.replace(/^#/, '') || '/';
  const parts = path.split('/').filter(Boolean);
  const page = parts[0] || '';
  const arg = parts[1] ? decodeURIComponent(parts[1]) : '';

  if (lastPath) scrollMemo[lastPath] = scrollY;
  const briefing = page === 'brief';
  document.body.classList.toggle('briefing', briefing);
  if (!briefing) {
    releaseAwake();
    briefFromList = false;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  }

  if (page === 'dashboard') state.from = 'dashboard';
  else if (page === '' || page === 'results') state.from = 'results';

  switch (page) {
    case '': viewFilter(); break;
    case 'results': viewResults(); break;
    case 'case': viewCase(arg); break;
    case 'brief': drawBrief(arg, parts[2]); break;
    case 'dashboard': viewDashboard(); break;
    case 'areas': viewAreas(); break;
    case 'about': viewAbout(); break;
    default: viewFilter();
  }

  const tab = ['case', 'brief'].includes(page) && state.from === 'dashboard' ? 'dashboard'
    : ['', 'results', 'case', 'brief'].includes(page) ? 'brief' : page;
  for (const a of $$('.tabbar a')) {
    if (a.dataset.tab === tab) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  }
  const keep = ['', 'results', 'dashboard'].includes(page) && scrollMemo[path] != null;
  scrollTo(0, keep ? scrollMemo[path] : 0);
  if (lastPath !== null && !briefing) main.focus({ preventScroll: true });
  lastPath = path;
}

main.addEventListener('click', (e) => {
  const t = e.target.closest('button, a');
  if (!t) return;
  if (t.dataset.step) { scrollToStep(t.dataset.step, false); return; }
  if (t.dataset.k) { toggleSel(t.dataset.k, t.dataset.v); return; }
  if (t.dataset.pick) { togglePick(t.dataset.pick); return; }
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
    for (const b of $$('[data-theme-set]')) b.setAttribute('aria-pressed', String(b === t));
    return;
  }
  if (t.dataset.dash) {
    state.dash[t.dataset.dash] = t.dataset.v;
    state.drill = null;
    LS.set('dash', state.dash);
    viewDashboard();
    return;
  }
  if (t.dataset.drill) {
    const { drill: k, dv: v, dl: l } = t.dataset;
    state.drill = state.drill?.k === k && state.drill.v === v ? null : { k, v, l };
    viewDashboard();
    $('#drill')?.scrollIntoView({ behavior: reduced.matches ? 'auto' : 'smooth', block: 'nearest' });
    return;
  }
  if (t.hasAttribute('data-replace')) { e.preventDefault(); location.replace(t.getAttribute('href')); return; }
  switch (t.dataset.act) {
    case 'all': state.showAll = !state.showAll; viewResults(); break;
    case 'near': state.nearOpen = true; viewResults(); break;
    case 'undrill': state.drill = null; viewDashboard(); break;
    case 'dashreset': state.dash = { ...DASH0 }; state.drill = null; LS.set('dash', state.dash); viewDashboard(); break;
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
    case 'forget':
      LS.del('key');
      SS.del('key');
      state.unit = [];
      state.unitStatus = unitEnc ? 'locked' : 'missing';
      viewAbout();
      break;
  }
});
main.addEventListener('submit', (e) => { if (e.target.id === 'unlock') onUnlock(e); });
addEventListener('hashchange', route);

/* ── Boot ─────────────────────────────────────────────────── */

async function boot() {
  applyTheme(LS.get('theme', 'night'));
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

  await loadUnit();
  updateNet();
  route();
  if (state.unitStatus === 'locked' && !SS.get('gateSkip', false)) await showGate();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch((err) => console.warn('SW', err));
    navigator.serviceWorker.addEventListener('controllerchange', updateNet);
  }
}

boot();
