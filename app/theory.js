// แอปทฤษฎีนิรภัย — สไลด์บทเรียนแบบโต้ตอบ (DECISIONS.md หัวข้อ "ทฤษฎีนิรภัย")
// app.js เรียก render() ทุกครั้งที่ URL เปลี่ยน: #/theory = รายการบท · #/theory/<id>/<n> = สไลด์ที่ n (เริ่ม 1)
// ปุ่มในไฟล์นี้ใช้ data-l* ทั้งหมด ไม่ชนกับ data-go / data-act ของโหมดบรีฟใน app.js
import { LESSONS } from './lessons.js';
import { THEORY_DIAGRAMS } from './theory_diagrams.js';

let H = null;          // ตัวช่วยจาก app.js: esc icon keepAwake main tax
let L = null;          // บทที่เปิดอยู่
let idx = 0;           // สไลด์ปัจจุบัน (เริ่ม 0)
let from = null;       // หน้าที่เปิดบทเรียนเข้ามา — ออกด้วย history.back() ไม่ให้สไลด์ซ้อนในประวัติ
const ws = {};         // สถานะภาพโต้ตอบและคำตอบ ต่อบท·สไลด์ (จำเฉพาะรอบนี้ ไม่บันทึกลงเครื่อง)

let sel = 0;           // บทที่เลือกบนแผนที่เส้นทาง
let fresh = false;     // เพิ่งเรียนจบบทนี้รอบนี้ → หน้าจบบทเล่นภาพปิดรู

const deckOf = (l) => [...l.slides, { t: 'end' }];
const url = (id, n) => `#/theory/${id}/${n + 1}`;
const tile = (c) => `style="--c:var(--tile-${c})"`;
const two = (n) => String(n).padStart(2, '0');

// บทที่เรียนจบแล้ว (ถึงหน้าจบบท) เก็บในเครื่องนี้เท่านั้น — w2sb.theoryDone = [id, ...]
const doneSet = () => { const v = H.store?.get('theoryDone', []); return new Set(Array.isArray(v) ? v : []); };
function markDone(id) {
  const d = doneSet();
  if (d.has(id)) return false;
  H.store?.set('theoryDone', [...d, id]);
  return true;
}
// สถานะบอกด้วยคำและสัญลักษณ์เสมอ สีเป็นแค่ตัวเสริม
const ST_TXT = { done: '✓ เรียนแล้ว', next: '▶ ถัดไป', fut: '○ ยังไม่เรียน' };
function statusOf(done) {
  const next = LESSONS.findIndex((l) => !done.has(l.id));
  return { next, st: (i) => (done.has(LESSONS[i].id) ? 'done' : i === next ? 'next' : 'fut') };
}

export function render(h) {
  H = h;
  wire();
  if (!h.arg) { L = null; list(); return; }
  const l = LESSONS.find((x) => x.id === h.arg);
  if (!l) { document.body.classList.remove('lesson'); notFound(); return; }
  // เข้าจากหน้าอื่น (ไม่ใช่สไลด์ด้วยกัน) → จำไว้ว่าออกแล้วกลับไปไหน
  if (!h.prev || !h.prev.startsWith('/theory/')) from = h.prev;
  L = l;
  const N = deckOf(l).length;
  idx = Math.min(Math.max((parseInt(h.n, 10) || 1) - 1, 0), N - 1);
  draw();
  h.keepAwake();
}

/* ── หน้ารายการบท ─────────────────────────────────────────── */

// แผนที่เส้นทางบิน (DECISIONS.md "ทิศทางดีไซน์ของแอปทฤษฎี"): บทละหนึ่งจุด ไต่ขึ้นจากซ้ายไปขวา แบ่งเป็น 4 ช่วง
// พิกัดอยู่ในกรอบ MW×MH · จุดคี่ยกสูงกว่าจุดคู่ ป้ายชื่อจึงสลับบน/ล่างได้ไม่ชนกัน
// (จุดแรกป้ายอยู่บน ไม่ให้ทับเครื่องบินที่กำลังบินขาแรกจากทางวิ่ง)
const PHASES = [
  ['พื้นฐาน', 0, 3, 'Foundation'],
  ['ก่อนบิน', 3, 6, 'Pre-flight'],
  ['ในห้องนักบิน', 6, 9, 'In-flight CRM'],
  ['ร่างกาย', 9, 11, 'Physiology'],
];
const MW = 820;
const MH = 400;
const AX = (i) => 50 + i * 72;
const AY = (i) => 330 - i * 24 - (i % 2) * 40;
const DEP = [14, 386];
const phaseOf = (i) => PHASES.find(([, a, b]) => i >= a && i < b)?.[0] || '';
const AC = 'M0-12L3-3 12 2 12 5 3 2 2 9 5 12 5 13-0 11.5-5 13-5 12-2 9-3 2-12 5-12 2-3-3Z'; // เครื่องบิน หัวชี้ขึ้น

function list() {
  const { esc, icon, main } = H;
  const done = doneSet();
  const { next, st } = statusOf(done);
  const N = LESSONS.length;
  const nDone = LESSONS.filter((l) => done.has(l.id)).length;
  const left = LESSONS.filter((l) => !done.has(l.id)).reduce((a, l) => a + l.mins, 0);
  sel = next >= 0 ? next : 0;

  const legs = PHASES.map(([n, a, b], k) => `<section class="legs-ph"><h2 class="ph-h">ช่วง ${k + 1} · ${n}</h2><ol>${LESSONS.slice(a, b).map((l, j) => {
    const i = a + j;
    const s = st(i);
    return `<li class="${s}"><a class="leg-r" href="#/theory/${l.id}"><i class="dm" aria-hidden="true"></i>
      <span class="leg-t"><small>จุดที่ ${two(i + 1)}</small><b>${esc(l.title)}</b><em>${ST_TXT[s]} · ราว ${l.mins} นาที</em></span>${icon('next')}</a></li>`;
  }).join('')}</ol></section>`).join('');

  const heroHtml = `
    <section class="th-command-hero" aria-label="ศูนย์การเรียนรู้ทฤษฎีนิรภัยการบิน">
      <div class="th-hero-media">
        <img class="th-hero-img th-n" src="img/theory-night.webp" alt="ฮ. S-70i ฝูงบิน 201 กองบิน 2 ขณะบิน" width="1600" height="1067" />
        <img class="th-hero-img th-d" src="img/theory-day.webp" alt="" width="1600" height="1067" />
        <div class="th-hero-overlay"></div>
        <div class="th-hero-grid-pattern"></div>
      </div>
      <div class="th-hero-content">
        <div class="th-hero-badges">
          <span class="th-badge-sec"><span class="badge-dot pulse"></span> นิรภัยการบิน กองบิน 2</span>
          <span class="th-badge-gold">หลักสูตรมาตรฐาน (Standard syllabus)</span>
        </div>
        <h1 class="th-hero-title">
          ทฤษฎีนิรภัยการบิน<span class="th-hero-hl">ระดับผู้บังคับบัญชา</span>
        </h1>
        <p class="th-hero-desc">
          ประมวล 11 ทฤษฎีและโมเดลความปลอดภัยการบินสากล (FAA, NTSB, DoD, ICAO) 
          ถอดบทเรียนสู่การปฏิบัติการบินปีกหมุน กองบิน 2 เพื่อการตัดสินใจเชิงยุทธการและการบริหารความเสี่ยงแบบไร้รอยต่อ
        </p>
        <div class="th-hero-stats">
          <div class="th-stat-item">
            <span class="th-stat-val">${N}</span>
            <span class="th-stat-lbl">โมเดลสากล</span>
          </div>
          <div class="th-stat-item">
            <span class="th-stat-val">${nDone}/${N}</span>
            <span class="th-stat-lbl">ผ่านการศึกษา</span>
          </div>
          <div class="th-stat-item">
            <span class="th-stat-val">${left ? `${left} นาที` : 'ครบสมบูรณ์'}</span>
            <span class="th-stat-lbl">${left ? 'เวลาประเมินที่เหลือ' : 'สำเร็จทุกหลักสูตร'}</span>
          </div>
          <div class="th-stat-item th-stat-badge">
            <span class="th-stat-tag">บรรยายสรุป (Command brief)</span>
            <span class="th-stat-lbl">พร้อมนำเสนอ ผบ. / ผู้การ</span>
          </div>
        </div>
      </div>
    </section>`;

  main.innerHTML = `<div class="view theory">
    ${heroHtml}
    <div class="th-body-head">
      <div>
        <p class="eyebrow">ทฤษฎีนิรภัย · เส้นทาง ${N} จุด</p>
        <h2 class="page-h">แผนที่เส้นทาง<em>โมเดลความปลอดภัย</em></h2>
      </div>
      <p class="th-meta">เรียนแล้ว <b>${nDone}/${N}</b> บท · ${left ? `เหลือราว ${left} นาที` : 'ครบทุกบทแล้ว'}</p>
    </div>
    <div class="rt">
      ${routeMap(st, next)}
      <aside class="rpanel" aria-live="polite">${panel(sel, st)}</aside>
    </div>
    <div class="legs">${legs}</div>
  </div>`;
}

function routeMap(st, next) {
  const { esc, icon } = H;
  const N = LESSONS.length;
  const P = LESSONS.map((_, i) => [AX(i), AY(i)]);
  const pts = [DEP, ...P];
  const mid = (k) => (AX(k - 1) + AX(k)) / 2;
  const nextL = next >= 0 ? LESSONS[next] : null;
  const pc = (v, m) => `${((v / m) * 100).toFixed(2)}%`;

  const bandTags = [];
  const bands = PHASES.map(([n, a, b, en], k) => {
    const x0 = k === 0 ? 0 : mid(a);
    const x1 = k === PHASES.length - 1 ? MW : mid(b);
    bandTags.push(`<span class="band-tag" style="left:${pc(x0, MW)}"><b><span class="bt-k">ช่วง ${k + 1} · </span>${n}</b><small>${en}</small></span>`);
    return `<rect class="band${k % 2 ? '' : ' alt'}" x="${x0}" y="0" width="${x1 - x0}" height="${MH}"/>
      <line class="band-div" x1="${x1}" y1="0" x2="${x1}" y2="${MH}"/>`;
  }).join('');

  // เส้นระดับบิน FL020–FL080 ไม่ใส่ป้าย (ชนป้ายจุดแวะ) ช่วงระดับบอกไว้ในแถบ HUD แล้ว
  const flLines = [310, 230, 150, 70].map((y) => `<line class="fl-line" x1="0" y1="${y}" x2="${MW}" y2="${y}"/>`).join('');

  const legsGlow = P.map((p, i) => {
    const [x1, y1] = pts[i];
    return `<line class="leg-glow ${st(i)}" x1="${x1}" y1="${y1}" x2="${p[0]}" y2="${p[1]}"/>`;
  }).join('');

  const lines = P.map((p, i) => {
    const [x1, y1] = pts[i];
    return `<line class="leg ${st(i)}" x1="${x1}" y1="${y1}" x2="${p[0]}" y2="${p[1]}"/>`;
  }).join('');

  // เฮลิคอปเตอร์ ทอ. บน.2 อยู่กลางขาที่กำลังบินเข้าหาบทถัดไป · เรียนครบแล้วจอดหลังจุดสุดท้าย
  const [a, b] = next >= 0 ? [pts[next], pts[next + 1]] : [pts[N - 1], pts[N]];
  const ang = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI + 90;
  const [cx, cy] = next >= 0 ? [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] : [b[0] + 28, b[1] - 8];
  const heliSvg = `
    <g class="heli-node" transform="translate(${cx.toFixed(1)} ${cy.toFixed(1)}) rotate(${ang.toFixed(1)}) scale(1.15)">
      <circle class="heli-ping" cx="0" cy="-2" r="20"/>
      <line class="heli-beam" x1="0" y1="-8" x2="0" y2="-32"/>
      <circle cx="0" cy="-32" r="2.5" fill="var(--sky)"/>
      <circle class="heli-disc" cx="0" cy="-2" r="16"/>
      <line class="heli-rotor" x1="-15" y1="-2" x2="15" y2="-2"/>
      <line class="heli-rotor" x1="0" y1="-17" x2="0" y2="13"/>
      <circle cx="0" cy="-2" r="2.5" fill="var(--sky)"/>
      <path class="heli-body" d="M0-11 C3-11 4.5-7 4.5-2 C4.5 4 3.5 7 1.5 13 L1 17 L-1 17 L-1.5 13 C-3.5 7 -4.5 4 -4.5-2 C-4.5-7 -3-11 0-11 Z"/>
      <path class="heli-glass" d="M0-9.5 C2-9.5 3-7 3-4 L-3-4 C-3-7 -2-9.5 0-9.5 Z"/>
      <line class="heli-fin" x1="-5" y1="14" x2="5" y2="14"/>
      <line class="heli-tailrot" x1="2" y1="13" x2="2" y2="19"/>
    </g>`;

  return `<div class="rmap-hud-wrap">
    <div class="hud-strip">
      <div class="hud-tag"><i class="hud-dot pulse"></i><span>เส้นทางหลักสูตรนิรภัย บน.2 · ${N} จุด</span></div>
      <div class="hud-tag d-only-md"><span>ไต่ระดับ <span class="hud-code">FL020 → FL080</span></span></div>
      <div class="hud-tag">สถานะ: <b class="${next >= 0 ? 'hud-active' : ''}">${next >= 0 ? `กำลังบินสู่จุด ${two(next + 1)} ${esc(nextL.short)}` : 'ครบทุกบทแล้ว'}</b></div>
    </div>
    <div class="band-row" aria-hidden="true"><div class="band-in">${bandTags.join('')}</div></div>
    <div class="rmap">
      <div class="hud-bracket-bl" aria-hidden="true"></div>
      <div class="hud-bracket-br" aria-hidden="true"></div>
      <svg class="rsvg" viewBox="0 0 ${MW} ${MH}" aria-hidden="true">
        ${bands}
        ${flLines}
        <line class="rwy" x1="0" y1="${DEP[1]}" x2="${DEP[0] + 14}" y2="${DEP[1]}"/>
        ${legsGlow}
        ${lines}
        ${heliSvg}
      </svg>
      ${LESSONS.map((l, i) => `<button class="wp ${st(i)}${i === sel ? ' sel' : ''}" style="left:${pc(AX(i), MW)};top:${pc(AY(i), MH)}"
        data-lsel="${i}" aria-pressed="${i === sel}" aria-label="จุดที่ ${i + 1} ${esc(l.title)} — ${ST_TXT[st(i)]}">
        <span class="wp-target"><i class="wp-ring"></i><i class="dm"></i></span>
        <span class="wl ${i % 2 || i === 0 ? 'up' : 'dn'}">
          <span class="wl-num">${st(i) === 'done' ? '✓' : st(i) === 'next' ? '▶' : ''}${two(i + 1)}</span>
          <span class="wl-ic">${icon(l.icon)}</span>
          <span class="wl-name">${esc(l.short)}</span>
        </span></button>`).join('')}
    </div>
  </div>`;
}

function panel(i, st) {
  const { esc, icon } = H;
  const l = LESSONS[i];
  const s = st(i);
  const diag = THEORY_DIAGRAMS[l.id] || '';
  return `<p class="rp-leg">จุดที่ ${two(i + 1)}/${two(LESSONS.length)} · ช่วง${phaseOf(i)}</p>
    <div class="rp-h"><span class="app-ic" ${tile(l.color)}>${icon(l.icon)}</span>
      <div><h2>${esc(l.title)}</h2><p class="rp-st ${s}">${ST_TXT[s]}</p></div></div>
    <div class="rp-diag-card">
      <div class="rp-diag-bar">
        <span class="rp-diag-tag">แผนภาพโมเดล (Safety model)</span>
        <span class="rp-diag-code">${esc(l.id.toUpperCase())}</span>
      </div>
      <button class="rp-diag-body" data-ldiag="${i}" aria-label="ขยายแผนภาพ ${esc(l.title)}">${diag}
        <span class="rp-diag-open">${icon('search')}ขยายแผนภาพ</span></button>
    </div>
    <p class="rp-tip">${esc(l.tip)}</p>
    <p class="rp-meta">${deckOf(l).length} สไลด์ · ราว ${l.mins} นาที</p>
    <a class="btn btn-primary rp-go" href="#/theory/${l.id}">${s === 'done' ? 'ทบทวนบทนี้' : 'เริ่มบทนี้'} ${icon('next')}</a>
    <ul class="rp-key" aria-label="ความหมายของจุด"><li class="done"><i class="dm"></i>เรียนแล้ว</li><li class="next"><i class="dm"></i>ถัดไป</li><li class="fut"><i class="dm"></i>ยังไม่เรียน</li></ul>
    <p class="note th-src">ข้อความภาษาอังกฤษยกมาตรงตามต้นฉบับพร้อมเลขหน้า (เอกสารของรัฐบาลสหรัฐฯ เช่น FAA, NTSB, DoD)
      ส่วนแหล่งอื่นเล่าความเป็นภาษาไทย · ใช้ประกอบการบรีฟ ไม่แทนระเบียบหรือคำสั่งของหน่วย · ความคืบหน้าเก็บไว้ในเครื่องนี้เท่านั้น</p>`;
}

// เลือกจุดบนแผนที่ → เปลี่ยนแผงข้าง ไม่วาดทั้งหน้าใหม่ (โฟกัสคีย์บอร์ดอยู่ที่เดิม)
function pick(i, focus) {
  const { st } = statusOf(doneSet());
  sel = i;
  H.main.querySelectorAll('.wp').forEach((b, k) => { b.classList.toggle('sel', k === i); b.setAttribute('aria-pressed', k === i); });
  const p = H.main.querySelector('.rpanel');
  if (p) p.innerHTML = panel(i, st);
  if (focus) H.main.querySelector(`.wp[data-lsel="${i}"]`)?.focus();
}

// ภาพย่อในแผงข้างกว้างไม่ถึง 300px ตัวอักษรในแผนภาพจะเหลือ ~6px จึงซ่อนตัวอักษรในภาพย่อ
// แล้วเปิดแผนภาพเต็มใน dialog กว้างอย่างน้อย 640px ให้ตัวอักษรเล็กสุด (7 หน่วย) ได้ ≥12px (กฎตัวอักษร ข้อ 2)
function openDiag(i) {
  const { esc, icon } = H;
  const l = LESSONS[i];
  const dlg = document.createElement('dialog');
  dlg.className = 'diag-dlg';
  dlg.setAttribute('aria-label', `แผนภาพ ${l.title}`);
  dlg.innerHTML = `<div class="dd-bar"><h2>${esc(l.title)}</h2>
      <button class="btn btn-icon dd-x" aria-label="ปิด">${icon('x')}</button></div>
    <div class="dd-body">${THEORY_DIAGRAMS[l.id] || ''}</div>`;
  dlg.addEventListener('click', (e) => { if (e.target === dlg || e.target.closest('.dd-x')) dlg.close(); });
  dlg.addEventListener('close', () => dlg.remove());
  document.body.append(dlg);
  dlg.showModal();
  // จอแคบกว่า 640px: เปิดที่กึ่งกลางแผนภาพ ซึ่งเป็นแกนของทุกแผนภาพ
  const body = dlg.querySelector('.dd-body');
  body.scrollLeft = (body.scrollWidth - body.clientWidth) / 2;
}

function notFound() {
  const { icon, main } = H;
  main.innerHTML = `<div class="view"><div class="empty">${icon('book')}<h2>ไม่พบบทเรียนนี้</h2>
    <p>ลิงก์อาจมาจากเวอร์ชันเก่าที่เปลี่ยนชื่อบทไปแล้ว เลือกบทจากรายการได้เลย</p>
    <div class="acts"><a class="btn" href="#/theory">ดูบทเรียนทั้งหมด</a></div></div></div>`;
}

/* ── สไลด์ ────────────────────────────────────────────────── */

function draw() {
  const { esc, icon, main } = H;
  const deck = deckOf(L);
  const N = deck.length;
  const s = deck[idx];
  const last = idx === N - 1;
  const nextL = LESSONS[LESSONS.indexOf(L) + 1];
  // ถึงหน้าจบบทครั้งแรก = เรียนจบ → บันทึก และให้หน้าจบเล่นภาพปิดรู (ถ้าไม่ได้ขอลดการเคลื่อนไหว)
  fresh = last && markDone(L.id) && !H.reduced.matches;
  const next = !last
    ? `<button class="btn btn-primary" data-lgo="1">${idx === 0 ? 'เริ่ม' : 'ถัดไป'} ${icon('next')}</button>`
    : nextL
      ? `<button class="btn btn-primary" data-lnext="${nextL.id}">บทถัดไป: ${esc(nextL.short)} ${icon('next')}</button>`
      : '<button class="btn btn-primary" data-lx>จบบทเรียน</button>';

  main.innerHTML = `<div class="brief lsn" role="region" aria-label="บทเรียน ${esc(L.title)}" aria-roledescription="slide deck">
    <div class="brief-top">
      <p class="b-eyebrow"><span class="ls-ic" ${tile(L.color)}>${icon(L.icon)}</span>${esc(L.title)}</p>
      <div class="tools"><a class="btn btn-icon" href="#/theory" data-lx aria-label="ออกจากบทเรียน (Esc)" title="ออกจากบทเรียน (Esc)">${icon('x')}</a></div>
    </div>
    <div class="lmain" aria-live="polite"><div class="ls is-${s.t}">${slide(s)}</div></div>
    <div class="brief-foot">
      <button class="btn btn-icon" data-lgo="-1" aria-label="สไลด์ก่อนหน้า"${idx === 0 ? ' disabled' : ''}>${icon('back')}</button>
      ${climb(N)}
      <span class="pos">${idx + 1}/${N}</span>
      ${next}
    </div>
  </div>`;
  // รูหดจนปิดแล้ว → ถอด mask ทิ้ง (ขอบแผ่นคมเหมือนแผ่นที่ปิดแล้วทั่วไป)
  const cs = main.querySelector('.ce-slice.closing');
  cs?.addEventListener('animationend', () => cs.classList.replace('closing', 'closed'), { once: true });
}

// รูบนแผ่นชีสของบท i: ตำแหน่งสุ่มแบบคงที่ต่อบท (เหมือนกันทุกครั้งที่เปิด) · รัศมีคูณ --hr ซึ่ง CSS หดจาก 1 → 0
// รูอยู่ช่วงบน 14–62% ของแผ่น ป้ายชื่อด้านล่างจึงไม่โดนเจาะ
function holeMask(i) {
  const r = (a) => ((Math.sin((i + 1) * 12.9898 + a * 78.233) * 43758.5453) % 1 + 1) % 1;
  const g = [0, 1, 2, 3].map((k) => {
    const x = Math.round(18 + r(k) * 64);
    const y = Math.round(14 + r(k + 9) * 48);
    const R = (1.3 * (0.6 + r(k + 3) * 0.6)).toFixed(2);
    return `radial-gradient(circle at ${x}% ${y}%, transparent calc(var(--hr) * ${R}em), #000 calc(var(--hr) * ${R}em + 1px))`;
  }).join(',');
  return `-webkit-mask-image:${g};mask-image:${g}`;
}

// แถบไต่ระดับแทนขีดนับสไลด์: แต่ละสไลด์ไต่ครึ่งแรกแล้วบินระดับครึ่งหลัง · ผ่านแล้วเส้นทึบ ยังไม่ถึงเส้นประ
// SVG ยืดตามกล่อง (preserveAspectRatio none) เส้นจึงต้อง non-scaling-stroke · จุดและเครื่องบินเป็น HTML วางด้วย %
function climb(N) {
  const X = (k) => (N > 1 ? (k / (N - 1)) * 100 : 50);
  const Y = (k) => (N > 1 ? 92 - (k / (N - 1)) * 84 : 50);
  const seg = (a, b) => {
    const p = [[X(a), Y(a)]];
    for (let k = a; k < b; k++) p.push([(X(k) + X(k + 1)) / 2, Y(k + 1)], [X(k + 1), Y(k + 1)]);
    return p.map((q) => q.map((v) => v.toFixed(2)).join(',')).join(' ');
  };
  const pc = (v) => `${v.toFixed(2)}%`;
  return `<div class="lroute" aria-hidden="true">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none">
        ${idx > 0 ? `<polyline class="cl-done" points="${seg(0, idx)}" vector-effect="non-scaling-stroke"/>` : ''}
        ${idx < N - 1 ? `<polyline class="cl-fut" points="${seg(idx, N - 1)}" vector-effect="non-scaling-stroke"/>` : ''}
      </svg>
      ${Array.from({ length: N }, (_, k) => k === idx ? ''
        : `<i class="cl-pt${k < idx ? ' on' : ''}" style="left:${pc(X(k))};top:${pc(Y(k))}"></i>`).join('')}
      <svg class="cl-ac" viewBox="-14 -14 28 28" style="left:${pc(X(idx))};top:${pc(Y(idx))}"><path d="${AC}" transform="rotate(75)"/></svg>
    </div>`;
}

// วาดเฉพาะเนื้อสไลด์ใหม่หลังแตะภาพโต้ตอบ แล้วคืนโฟกัสให้ปุ่มเดิม (คนใช้คีย์บอร์ดไม่หลุดตำแหน่ง)
function redraw(sel) {
  const box = H.main.querySelector('.ls');
  if (!box) return;
  const s = deckOf(L)[idx];
  const sc = H.main.querySelector('.lmain').scrollTop;
  box.innerHTML = slide(s);
  H.main.querySelector('.lmain').scrollTop = sc;
  if (sel) H.main.querySelector(sel)?.focus();
}

const key = () => `${L.id}:${idx}`;

function slide(s) {
  const { esc, icon } = H;
  switch (s.t) {
    case 'title': {
      const diag = THEORY_DIAGRAMS[L.id] || '';
      return `<div class="ls-title-grid">
        <div class="ls-title-copy">
          <div class="ls-title-badge-row">
            <span class="th-badge-sec">RTAF SAFETY SYLLABUS</span>
            <span class="plab">บทเรียน · ราว ${L.mins} นาที</span>
          </div>
          <h1 class="ptitle">${esc(s.h)}</h1>
          <p class="ptext">${esc(s.sub)}</p>
          ${s.stat ? `<p class="ls-stat"><b>${esc(s.stat.n)}</b><span>${esc(s.stat.t)}</span></p>` : ''}
        </div>
        <div class="ls-title-vis">
          <div class="ls-vis-box">
            <div class="ls-vis-bar">
              <span class="ls-vis-tag">OFFICIAL MODEL ARCHITECTURE</span>
              <span class="ls-vis-ref">${esc(L.id.toUpperCase())}</span>
            </div>
            <div class="ls-vis-svg">${diag}</div>
            <div class="ls-vis-caption">แผนภาพเชิงโครงสร้างตามมาตรฐานการฝึกอบรมการบินนิรภัย</div>
          </div>
        </div>
      </div>`;
    }

    case 'points': return `<h2 class="ls-h">${esc(s.h)}</h2>
      <ol class="ls-pts">${s.items.map((it, k) => `<li><span class="n">${k + 1}</span><div><b>${esc(it.b)}</b><p>${esc(it.t)}</p></div></li>`).join('')}</ol>`;

    case 'compare': {
      const side = (x, c) => `<section class="ls-side ${c}"><h3>${esc(x.h)}</h3><ul>${x.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul></section>`;
      return `<h2 class="ls-h">${esc(s.h)}</h2><div class="ls-cmp">${side(s.a, 'a')}${side(s.b, 'b')}</div>`;
    }

    case 'cards': {
      const st = (ws[key()] ||= { open: [] });
      const n = s.items.length;
      const card = (it, k) => s.flip
        ? `<button class="ls-card flip${st.open.includes(k) ? ' on' : ''}" data-lflip="${k}" aria-pressed="${st.open.includes(k)}">
            <span class="fr"><b>${esc(it.b)}</b>${it.s ? `<small>${esc(it.s)}</small>` : ''}</span>
            <span class="bk"><small>${esc(it.s || it.b)}</small>${esc(it.t)}</span></button>`
        : `<div class="ls-card"><b>${esc(it.b)}</b>${it.s ? `<small>${esc(it.s)}</small>` : ''}<p>${esc(it.t)}</p></div>`;
      return `<div class="ls-hrow"><h2 class="ls-h">${esc(s.h)}</h2>
        ${s.flip ? `<button class="btn ls-all" data-lflip="all">${st.open.length === n ? 'พลิกกลับทั้งหมด' : 'เปิดทั้งหมด'}</button>` : ''}</div>
        ${s.cap ? `<p class="ls-cap">${esc(s.cap)}</p>` : ''}
        <div class="ls-cards${n > 6 ? ' many' : ''}${n === 8 ? ' c4' : ''}">${s.items.map(card).join('')}</div>`;
    }

    case 'widget': return `<h2 class="ls-h">${esc(s.h)}</h2>
      <div class="lw lw-${s.w} nosw">${WIDGETS[s.w]()}</div><p class="ls-cap">${esc(s.cap)}</p>`;

    case 'quiz': {
      const a = ws[key()]?.pick;
      const done = a != null;
      return `<p class="plab">คำถามทวน</p><h2 class="ls-q">${esc(s.q)}</h2>
        <div class="ls-opts" role="group" aria-label="ตัวเลือก">${s.opts.map((o, k) => {
          const cls = !done ? '' : k === s.a ? ' right' : k === a ? ' wrong' : ' dim';
          const mark = !done ? `<span class="k">${'กขคง'[k]}</span>` : k === s.a ? `<span class="k">${icon('check')}</span>` : k === a ? `<span class="k">${icon('x')}</span>` : `<span class="k">${'กขคง'[k]}</span>`;
          return `<button class="ls-opt${cls}" data-lq="${k}"${done ? ' aria-disabled="true"' : ''}>${mark}<span>${esc(o)}</span></button>`;
        }).join('')}</div>
        ${done ? `<div class="ls-why"><p class="r ${a === s.a ? 'ok' : 'no'}">${a === s.a ? 'ถูกต้อง' : `ยังไม่ใช่ — คำตอบคือข้อ ${'กขคง'[s.a]}`}</p><p>${esc(s.why)}</p></div>` : ''}`;
    }

    case 'brief': return `<p class="plab">นำไปใช้</p><h2 class="ls-h">${esc(s.h)}</h2>
      <ol class="pdo pdo-n">${s.items.map((t, k) => `<li><span class="n">${k + 1}</span><span>${esc(t)}</span></li>`).join('')}</ol>`;

    // ข้อความต้นฉบับ (ภาษาอังกฤษ ไม่แปล) + คำอธิบายไทยสั้น ๆ ถ้ามี · ทุกคำพูดต้องมีเลขหน้าที่พิมพ์บนเอกสาร
    case 'quote': return `${s.h ? `<p class="plab">${esc(s.h)}</p>` : ''}
      <div class="ls-qs${s.qs.length > 1 ? ' two' : ''}">${s.qs.map((q) => `<figure class="ls-quote">
        <blockquote lang="en"><p>${esc(q.q)}</p></blockquote>
        ${q.th ? `<p class="th">${esc(q.th)}</p>` : ''}
        <figcaption>${srcLink(q.src)}</figcaption></figure>`).join('')}</div>
      ${s.note ? `<p class="ls-cap">${esc(s.note)}</p>` : ''}`;

    case 'chart': return `<h2 class="ls-h">${esc(s.h)}</h2>${CHARTS[s.kind](s)}
      <p class="ls-cap">${s.cap ? `${esc(s.cap)} · ` : ''}ที่มา ${srcLink(s.src)}</p>`;

    // ตัวเลขใหญ่หลายตัว แต่ละตัวมีที่มาของตัวเอง
    case 'stats': return `<h2 class="ls-h">${esc(s.h)}</h2>
      <ul class="ls-stats">${s.items.map((x) => `<li><b>${esc(x.n)}</b><span>${esc(x.t)}</span>${x.q ? `<q lang="en">${esc(x.q)}</q>` : ''}<small>${srcLink(x.src)}</small></li>`).join('')}</ul>
      ${s.cap ? `<p class="ls-cap">${esc(s.cap)}</p>` : ''}`;

    default: { // หน้าจบบท
      const qs = L.slides.map((x, k) => [x, k]).filter(([x]) => x.t === 'quiz');
      const got = qs.filter(([x, k]) => ws[`${L.id}:${k}`]?.pick === x.a).length;
      const tried = qs.filter(([, k]) => ws[`${L.id}:${k}`]?.pick != null).length;
      // แต่ละบท = ชีสหนึ่งแผ่น เรียนจบ = ปิดรูแผ่นนั้น (ท่าปิดรูจากแนวทาง C) · ครั้งแรกที่จบเล่นภาพรูหด ครั้งต่อไปแสดงแผ่นเต็ม
      const i = LESSONS.indexOf(L);
      const done = doneSet();
      const nDone = LESSONS.filter((l) => done.has(l.id)).length;
      // หมายเหตุของแหล่งอ้างอิง (n เช่น "เล่าความ ไม่ยกคำพูด") → เครื่องหมาย † ‡ ต่อท้ายชื่อ + คำอธิบายเครื่องหมายต่อท้ายหัว "แหล่งอ้างอิง"
      const notes = [...new Set(L.refs.map((r) => r.n).filter(Boolean))];
      const mark = (n) => '†‡§'[notes.indexOf(n)];
      return `<div class="ce">
        <figure class="ce-fig">
          <div class="ce-slice ${fresh ? 'closing' : 'closed'}" style="${holeMask(i)}" aria-hidden="true"><small>ชั้น ${two(i + 1)}</small><b>${esc(L.short)}</b></div>
          <figcaption><b>✓ ปิดรูชั้นนี้แล้ว</b><span>ปิดแล้ว ${nDone}/${LESSONS.length} ชั้น</span></figcaption>
          <ol class="ce-row" aria-hidden="true">${LESSONS.map((l, k) => `<li class="${done.has(l.id) ? 'on' : ''}${k === i ? ' cur' : ''}"></li>`).join('')}</ol>
        </figure>
        <div class="ce-sum">
          <p class="plab">สรุป ${L.take.length} ข้อ</p><h2 class="ls-h">${esc(L.title)}</h2>
          <ol class="pdo pdo-n">${L.take.map((t, k) => `<li><span class="n">${k + 1}</span><span>${esc(t)}</span></li>`).join('')}</ol>
          <div class="ls-refs"><p class="k">แหล่งอ้างอิง${notes.map((n) => `<span class="nt">${mark(n)} ${esc(n)}</span>`).join('')}</p><ul${L.refs.length > 3 ? ' class="two"' : ''}>${L.refs.map((r) => `<li><a href="${esc(r.u)}" target="_blank" rel="noopener noreferrer"><span>${esc(r.t)}${r.n ? `<sup>${mark(r.n)}</sup>` : ''}</span>${icon('ext')}</a></li>`).join('')}</ul></div>
        </div>
        <div class="ce-act">
          ${tried ? `<p class="ls-score">ตอบคำถามทวนถูก ${got}/${qs.length} ข้อ</p>` : ''}
          <button class="btn ls-again" data-lgo="restart">เริ่มบทนี้ใหม่</button>
        </div>
      </div>`;
    }
  }
}

/* ── ที่มาและกราฟ ─────────────────────────────────────────── */

// src = { t: ชื่อเอกสารสั้น, p: เลขหน้าที่พิมพ์บนเอกสาร, u: ลิงก์ PDF พร้อม #page=<ลำดับหน้าใน PDF> }
function srcLink(src) {
  const { esc, icon } = H;
  return `<a class="src" href="${esc(src.u)}" target="_blank" rel="noopener noreferrer"><span>${esc(src.t)}${src.p ? `, p. ${esc(src.p)}` : ''}</span>${icon('ext')}</a>`;
}

// กราฟไม่ต้องแตะ · พิมพ์ตัวเลขทุกค่าบนกราฟ · ชุดที่สองใช้ลายเส้นทแยง (ไม่พึ่งสีอย่างเดียว) · มีตารางให้โปรแกรมอ่านหน้าจอ
const CHARTS = {
  // แท่งแนวนอน: rows = [{ g?, l, th?, v: ตัวเลข | [ชุด 1, ชุด 2] }] · แถวที่ g เหมือนกันและติดกันรวมเป็นกลุ่ม
  hbar(s) {
    const { esc } = H;
    const unit = s.unit ?? '%';
    const vs = (r) => [].concat(r.v);
    const max = s.max || Math.max(...s.rows.flatMap(vs));
    const groups = [];
    s.rows.forEach((r) => {
      const g = groups[groups.length - 1];
      if (g && g.g === r.g) g.rows.push(r); else groups.push({ g: r.g, rows: [r] });
    });
    const ser = s.series || [''];
    const bar = (v, k) => `<span class="hb-b s${k}"><i style="--w:${(v / max).toFixed(4)}"></i><b>${v}${esc(unit)}</b></span>`;
    const row = (r) => `<li class="hb-r"><span class="hb-l"><span lang="en">${esc(r.l)}</span>${r.th ? `<small>${esc(r.th)}</small>` : ''}</span>
      <span class="hb-bs">${vs(r).map(bar).join('')}</span></li>`;
    return `<figure class="hbc${ser.length > 1 ? ' multi' : ''}">
      ${s.series ? `<ul class="hb-key" aria-hidden="true">${s.series.map((n, k) => `<li><i class="s${k}"></i>${esc(n)}</li>`).join('')}</ul>` : ''}
      <div class="hb-gs" aria-hidden="true">${groups.map((g) => `<div class="hb-g${g.g ? '' : ' nog'}">
        ${g.g ? `<p class="hb-gl" lang="en">${esc(g.g)}</p>` : ''}<ul>${g.rows.map(row).join('')}</ul></div>`).join('')}</div>
      <table class="sr"><caption>${esc(s.h)}</caption>
        <thead><tr><th scope="col">หมวด</th>${ser.map((n) => `<th scope="col">${esc(n || 'ค่า')}</th>`).join('')}</tr></thead>
        <tbody>${s.rows.map((r) => `<tr><th scope="row">${r.g ? `${esc(r.g)} — ` : ''}${esc(r.l)}</th>${vs(r).map((v) => `<td>${v}${esc(unit)}</td>`).join('')}</tr>`).join('')}</tbody>
      </table></figure>`;
  },

  // แถบ 24 ชั่วโมง (แผนภาพ ไม่ใช่ข้อมูลวัด): rows = [{ l, z: [{ a, b, t, k: 'bad' | 'warn' }] }]
  // ช่วงบนแถบไม่มีตัวอักษร (แคบเกินบนมือถือ) ความหมายอยู่ในรายการใต้แถบ ซึ่งมีลายเดียวกับช่วงบนแถบ
  clock(s) {
    const { esc } = H;
    const pc = (h) => `${((h / 24) * 100).toFixed(3)}%`;
    const hh = (h) => `${String(h % 24).padStart(2, '0')}:00`;
    const ticks = [0, 3, 6, 9, 12, 15, 18, 21, 24];
    return `<figure class="ckc">
      <div class="ck-r ck-top" aria-hidden="true"><span></span><div class="ck-ax">${ticks.map((h) => `<span style="left:${pc(h)}">${two(h % 24)}</span>`).join('')}</div></div>
      ${s.rows.map((r) => `<div class="ck-r">
        <p class="ck-l">${esc(r.l)}</p>
        <div class="ck-band" aria-hidden="true">${ticks.slice(1, -1).map((h) => `<i class="ck-t" style="left:${pc(h)}"></i>`).join('')}
          ${r.z.map((z) => `<span class="ck-z ${z.k}" style="left:${pc(z.a)};width:${pc(z.b - z.a)}"></span>`).join('')}</div>
        <ul class="ck-d">${r.z.map((z) => `<li><i class="ck-sw ${z.k}" aria-hidden="true"></i><b>${hh(z.a)}–${hh(z.b)}</b> ${esc(z.t)}</li>`).join('')}</ul>
      </div>`).join('')}
    </figure>`;
  },
};

/* ── ภาพโต้ตอบ ────────────────────────────────────────────── */

// สวิสชีส: ซ้าย→ขวา องค์กร → การกำกับดูแล → สภาพก่อนเกิดเหตุ → การกระทำ (DECISIONS.md เรื่องลำดับแผ่นชีส)
const SLICES = ['องค์กร', 'การกำกับดูแล', 'สภาพก่อนเกิดเหตุ', 'การกระทำ'];
const HOLES = [[22, 74], [30, 80], [18, 70], [26, 82]]; // รูประดับ (% จากบน) — รูที่เส้นผ่านอยู่กลางแผ่นเสมอ

// HFACS: ชื่อภาษาไทยของระดับและหมวด (หมวดและรหัสมาจาก taxonomy ของแอป = DoD HFACS 8.0)
// [en, th, คำอธิบาย, คำถามที่ผู้สืบสวนถามในระดับนี้]
const TIERS = [
  ['Organizational Influences', 'อิทธิพลขององค์กร',
    'การตัดสินใจระดับบนที่ส่งผลถึงทุกคนในหน่วย ได้แก่ นโยบายและระเบียบ การจัดสรรงบประมาณ กำลังพลและอุปกรณ์ วัฒนธรรมองค์กร และหลักสูตรการฝึก มักเป็นรูแฝงที่อยู่มานานที่สุด',
    'นโยบาย ทรัพยากร หรือวัฒนธรรมของหน่วยเหนือ เปิดทางให้เหตุนี้หรือไม่'],
  ['Supervision/Leadership', 'การกำกับดูแล',
    'สิ่งที่ผู้บังคับบัญชาและผู้กำกับดูแลทำหรือไม่ได้ทำ ได้แก่ การวางแผนและประเมินความเสี่ยงก่อนมอบภารกิจ การจัดคนให้เหมาะกับงาน การติดตามแก้ไขสิ่งที่เป็นอันตราย และการบังคับใช้ระเบียบ',
    'ผู้กำกับดูแลรู้หรือควรรู้ถึงอันตรายนี้ และได้ลงมือแก้หรือไม่'],
  ['Preconditions', 'สภาพก่อนเกิดเหตุ',
    'สภาพที่ทำให้คนพลาดง่ายขึ้น ทั้งสภาพของตัวคน (ความตื่นตัว จิตใจ ร่างกาย) สภาพของทีม (การสื่อสาร การวางแผน และบรีฟ) สภาพแวดล้อม (อากาศ แสง เครื่องมือ) และความพร้อมจากการฝึก',
    'อะไรทำให้การกระทำนั้นเกิดขึ้นได้ง่าย'],
  ['Unsafe Acts', 'การกระทำที่ไม่ปลอดภัย',
    'สิ่งที่ผู้ปฏิบัติงานหน้างานทำหรือละเลย จนนำไปสู่เหตุโดยตรง แบ่งเป็นความผิดพลาดที่ไม่ได้ตั้งใจ (ทักษะ การตัดสินใจ) กับการฝ่าฝืนโดยรู้ตัว',
    'ใครทำอะไร หรือไม่ได้ทำอะไร ก่อนเกิดเหตุ'],
];
const TIER_META = [
  { tag: 'รูแฝงรากลึก (Latent)', type: 'latent', lvl: 4 },
  { tag: 'รูแฝงบังคับบัญชา (Latent)', type: 'latent', lvl: 3 },
  { tag: 'รูแฝงสภาพแวดล้อม (Latent)', type: 'latent', lvl: 2 },
  { tag: 'รูหน้างาน (Active)', type: 'active-fail', lvl: 1 },
];
const HF_TH = {
  AD000: 'ฝ่าฝืนโดยรู้ตัว', AE100: 'พลาดที่ทักษะการปฏิบัติ', AE200: 'พลาดที่การตัดสินใจ',
  PC100: 'การรับรู้และความตื่นตัว', PC200: 'สภาพจิตใจ', PC300: 'ร่างกายไม่พร้อม',
  PE100: 'สภาพแวดล้อมทางกายภาพ', PE200: 'สภาพแวดล้อมทางเทคโนโลยี', PP100: 'การประสานงานและสื่อสารในทีม', PT100: 'สภาพการฝึก',
  SC100: 'วัฒนธรรมความปลอดภัยของหน่วยไม่ได้ผล', SD000: 'ผู้กำกับดูแลฝ่าฝืนโดยรู้ตัว', SI000: 'การกำกับดูแลไม่ได้ผล', SP000: 'การวางแผนและประสานงานไม่ได้ผล',
  OC000: 'บรรยากาศและวัฒนธรรมองค์กร', OP000: 'นโยบาย ระเบียบ กระบวนการ', OR000: 'การสนับสนุนทรัพยากร', OT000: 'หลักสูตรการฝึก',
};
const TIER_OF = { A: 'Unsafe Acts', P: 'Preconditions', S: 'Supervision/Leadership', O: 'Organizational Influences' };
// คำอธิบายหมวด เรียบเรียงจากนิยามใน DoD HFACS 8.0
const CAT_D = {
  AD000: 'รู้ว่ามีระเบียบหรือขั้นตอนกำหนดไว้ แต่เลือกทำต่างออกไป ทั้งที่ทำครั้งคราวและที่ทำกันจนเป็นเรื่องปกติของหน่วย',
  AE100: 'ตั้งใจทำถูกแต่มือหรือความสนใจพลาดระหว่างทำงานที่คุ้นเคย เช่น กดสวิตช์ผิด ข้ามขั้นตอนในเช็กลิสต์ คุมเครื่องไม่แม่น สแกนเครื่องวัดไม่ครบ',
  AE200: 'ทำตามแผนที่คิดไว้ แต่แผนหรือการตัดสินใจนั้นไม่เหมาะกับสถานการณ์ เช่น ประเมินความเสี่ยงระหว่างบินไม่พอ จัดลำดับงานผิด ไม่สนใจคำเตือน',
  PC100: 'ความสนใจและการรับรู้สถานการณ์ลดลง เช่น ใจลอย จดจ่อสิ่งเดียว งานล้นมือ ถูกขัดจังหวะ หลงตำแหน่ง',
  PC200: 'สภาพจิตใจที่ทำให้ตัดสินใจหรือปฏิบัติได้แย่ลง เช่น ความเครียดจากชีวิตส่วนตัว ความมั่นใจเกินตัว ความรีบ และแรงกดดันให้ภารกิจสำเร็จ',
  PC300: 'ร่างกายไม่พร้อมปฏิบัติงาน เช่น ความล้า การเจ็บป่วย ผลของยาหรือแอลกอฮอล์ แรง G และการหลงสภาพการบิน',
  PE100: 'สภาพแวดล้อมภายนอกที่ทำให้ปฏิบัติงานยากขึ้น เช่น อากาศบดบังการมองเห็น ความสั่นสะเทือน อุณหภูมิ เสียง ภูมิประเทศ สัตว์หรือคนในพื้นที่',
  PE200: 'การออกแบบเครื่องมือและอุปกรณ์ที่ทำให้พลาดง่าย เช่น เครื่องวัดหรือระบบเตือนอ่านยาก สวิตช์วางไม่ดี ระบบอัตโนมัติสร้างอันตราย วิทยุใช้การไม่ได้',
  PP100: 'การทำงานเป็นทีมไม่ได้ผล เช่น CRM ไม่ประสานกัน วางแผนหรือบรีฟไม่พอ ปรับแผนกลางภารกิจโดยไม่ทบทวนร่วมกัน',
  PT100: 'ความพร้อมจากการฝึกไม่พอ เช่น ยังไม่ผ่านการฝึก ลืมสิ่งที่ฝึก ขาดความต่อเนื่องในการบิน (currency) ประสบการณ์น้อย',
  SC100: 'วัฒนธรรมความปลอดภัยของหน่วยไม่ได้ผล หรือจังหวะงานและภาระงานสูงจนความปลอดภัยถูกลดลำดับความสำคัญ',
  SD000: 'ผู้กำกับดูแลรู้ว่ามีระเบียบแต่ไม่บังคับใช้ ปล่อยวิธีที่ผิดจนกลายเป็นธรรมเนียม หรือสั่งให้ลูกน้องเลี่ยงระเบียบ',
  SI000: 'การกำกับดูแลไม่ได้ผล เช่น ไม่ติดตามงาน ไม่จัดการฝึกที่ได้ผล ไม่ตอบสนองต่อข้อมูลสำคัญ ไม่แก้สภาพอันตรายที่รู้อยู่ มอบงานให้คนที่ยังไม่พร้อม',
  SP000: 'การวางแผนก่อนมอบภารกิจไม่ได้ผล เช่น ประเมินความเสี่ยงไม่พอ อนุมัติความเสี่ยงที่ไม่จำเป็น ไม่จัดข้อมูล กำลังพล หรืออุปกรณ์ให้พอ',
  OC000: 'ทัศนคติและการกระทำขององค์กรเพิ่มความเสี่ยง เช่น โครงสร้างสายงานไม่ชัด เปลี่ยนภารกิจ เครื่อง หรืออุปกรณ์โดยไม่รองรับผลที่ตามมา',
  OP000: 'นโยบายและกระบวนการขององค์กรสร้างความเสี่ยง เช่น ภาระงานสูงเกิน โครงการไม่ได้ประเมินความเสี่ยง ระเบียบไม่ชัดหรือทำไม่ได้จริง หลักนิยมผิด',
  OR000: 'องค์กรไม่จัดทรัพยากรให้พอและเหมาะสม ได้แก่ งบประมาณ กำลังพล สิ่งอำนวยความสะดวก ข้อมูล และอุปกรณ์ที่เหมาะกับงานและไม่เสื่อมสภาพ',
  OT000: 'หลักสูตรการฝึกขององค์กรไม่ได้ผลหรือไม่มี ทั้งการเรียนในโรงเรียนและการเรียนทางไกล',
};
// ชื่อไทยของรหัสย่อย (nanocode) แปลจากชื่อภาษาอังกฤษใน DoD HFACS 8.0
const NANO_TH = {
  AD001: 'ฝ่าฝืนเพื่อเลี่ยงปัญหาเฉพาะหน้า (work-around)', AD002: 'ฝ่าฝืนเป็นประจำจนเป็นเรื่องปกติของหน่วย (normalization of deviance)', AD003: 'ขาดวินัยอย่างร้ายแรง',
  AE101: 'เปิดหรือปิดระบบโดยไม่ตั้งใจ', AE102: 'ทำตามขั้นตอนหรือเช็กลิสต์ไม่ถูกต้อง', AE104: 'คุมเครื่องมากหรือน้อยเกินไป', AE105: 'สแกนสายตาหรือตรวจไขว้เครื่องวัดขาดตอน', AE107: 'รีบหรือช้าในการกระทำที่จำเป็น', AE108: 'อ่านหรือแปลความเครื่องวัดผิด',
  AE201: 'ประเมินและจัดการความเสี่ยงระหว่างปฏิบัติไม่พอ', AE202: 'จัดลำดับความสำคัญของงานไม่ได้ผล', AE205: 'ไม่สนใจข้อควรระวังหรือคำเตือน', AE207: 'ประเมินสภาพแวดล้อมที่เปลี่ยนไปผิด',
  PC101: 'ขาดความใส่ใจ', PC102: 'จดจ่อสิ่งเดียวจนลืมสิ่งอื่น', PC103: 'งานล้นมือ', PC104: 'สับสน', PC105: 'นิสัยเดิมติดมาในงานใหม่', PC106: 'ถูกดึงความสนใจหรือถูกขัดจังหวะ', PC107: 'หลงตำแหน่ง', PC110: 'ไม่เห็นสิ่งที่เปลี่ยน หรือคาดการณ์ผิด',
  PC202: 'ความผิดปกติทางจิตใจ', PC203: 'ความเครียดในชีวิตหรือสภาพอารมณ์', PC205: 'ลักษณะบุคลิกภาพ', PC206: 'มั่นใจเกินตัว', PC209: 'เร่งรีบ หรือแรงจูงใจให้ทำให้สำเร็จ',
  PC301: 'ผลของแรง G (หมดสติจากแรง G)', PC302: 'ผลของสาร เช่น อาหารเสริม ยา แอลกอฮอล์', PC304: 'หมดสติ (เฉียบพลันหรือค่อยเป็นค่อยไป)', PC305: 'เจ็บป่วยหรือบาดเจ็บ', PC306: 'ออกแรงเกินกำลัง', PC307: 'ความล้า',
  PC310: 'ก๊าซในร่างกายขยายตัว', PC311: 'โรคจากการลดความกดอากาศ', PC312: 'เหตุทางสรีรวิทยาเกี่ยวกับการหายใจ', PC314: 'ตาปรับตัวในที่มืดไม่พอ', PC317: 'ข้อจำกัดด้านขนาดและการเคลื่อนไหวของร่างกาย', PC319: 'โภชนาการและอาหาร', PC320: 'ตกใจจนทำอะไรไม่ถูก (surprise/startle)', PC321: 'หลงสภาพการบิน (spatial disorientation)',
  PE101: 'สภาพแวดล้อมบดบังการมองเห็น', PE103: 'ความสั่นสะเทือน', PE106: 'อุณหภูมิ', PE108: 'แรงหรือวัตถุภายนอกขัดขวางการปฏิบัติ', PE109: 'แสงภายนอกของยานหรือวัตถุรบกวนการมองเห็น', PE110: 'เสียงรบกวน', PE112: 'ลักษณะภูมิประเทศ', PE113: 'สัตว์ หรือบุคคลภายนอก',
  PE201: 'ระบบยึดตัวหรือที่นั่งมีปัญหา', PE202: 'เครื่องวัดและระบบเตือนมีปัญหา', PE203: 'ทัศนวิสัยในพื้นที่ทำงานถูกจำกัด (ไม่ใช่จากอากาศ)', PE204: 'คันบังคับหรือสวิตช์', PE205: 'ระบบอัตโนมัติสร้างสภาพอันตราย', PE206: 'พื้นที่ทำงานจำกัด', PE207: 'อุปกรณ์ส่วนตัวเกะกะ', PE208: 'อุปกรณ์สื่อสารใช้การไม่ได้',
  PP101: 'การบริหารทรัพยากรในทีม (CRM) ไม่ได้ผล', PP109: 'วางแผนหรือบรีฟภารกิจไม่พอ', PP111: 'ปรับแผนระหว่างปฏิบัติภารกิจ',
  PT101: 'ยังไม่ผ่านการฝึก', PT102: 'จำสิ่งที่ฝึกไม่ได้', PT103: 'ขาดความต่อเนื่อง (currency)', PT104: 'ขาดความชำนาญหรือประสบการณ์', PT105: 'ขาดการฝึกด้านความปลอดภัยในงาน',
  SC101: 'วัฒนธรรมความปลอดภัยของหน่วย', SC102: 'จังหวะงานและภาระงาน',
  SD001: 'ไม่บังคับใช้ระเบียบที่ประกาศไว้', SD002: 'ปล่อยวิธีนอกระเบียบจนกลายเป็นธรรมเนียม', SD003: 'สั่งให้บุคคลเลี่ยงระเบียบหรือขั้นตอน',
  SI001: 'การกำกับดูแลหรือการบังคับบัญชาไม่ได้ผล', SI003: 'ไม่จัดการฝึกที่ได้ผล', SI004: 'ไม่ให้ขั้นตอนหรือแนวทางเป็นลายลักษณ์อักษรที่ชัดเจน', SI006: 'ไม่ตอบสนองต่อข้อมูลสำคัญ', SI007: 'ไม่ระบุหรือไม่แก้วิธีปฏิบัติหรือสภาพที่เป็นอันตราย', SI008: 'มอบงานให้คนที่ขาดประสบการณ์ ความต่อเนื่อง หรือความชำนาญ', SI009: 'ใช้ยศหรือตำแหน่งข่ม',
  SP006: 'ประเมินความเสี่ยงล่วงหน้าไม่ได้ผล', SP007: 'อนุมัติความเสี่ยงที่ไม่จำเป็น', SP008: 'วางแผนก่อนภารกิจไม่ได้ผล', SP009: 'หน่วยไม่จัดข้อมูลการปฏิบัติให้พอ', SP010: 'หน่วยไม่จัดกำลังพลให้พอ', SP011: 'หน่วยไม่จัดอุปกรณ์หรือสิ่งอุปกรณ์ให้พอ',
  OC001: 'วัฒนธรรมองค์กร (ทัศนคติ/การกระทำ) เพิ่มความเสี่ยง', OC003: 'มุมมองขององค์กรต่ออุปกรณ์', OC004: 'การเปลี่ยนภารกิจ เครื่อง อุปกรณ์ หรือการยุบหน่วย', OC005: 'โครงสร้างองค์กรไม่ชัดหรือไม่เพียงพอ',
  OP001: 'จังหวะงานและภาระงาน', OP002: 'โครงการหรือการปฏิบัติไม่ได้ประเมินความเสี่ยงอย่างเพียงพอ', OP003: 'นโยบาย ขั้นตอน หรือเอกสารไม่ชัด ทำไม่ได้จริง หรือไม่พอ', OP005: 'หลักนิยมหรือแนวคิดผิด', OP006: 'การบริหารโครงการไม่พอ',
  OR001: 'ทรัพยากรด้านการบังคับบัญชาและควบคุม (C2) ไม่พอ', OR003: 'โครงสร้างพื้นฐานไม่พอ', OR004: 'จัดหาอุปกรณ์ที่ออกแบบไม่ดีหรือไม่เหมาะกับงาน', OR005: 'ไม่ปลดอุปกรณ์ที่ไม่พอหรือเสื่อมสภาพออกทันเวลา', OR006: 'นโยบายหรือกระบวนการคัดเลือกบุคคล', OR007: 'ไม่จัดกำลังพลให้พอ', OR008: 'ไม่จัดข้อมูลให้พอ', OR009: 'ไม่จัดงบประมาณให้พอ',
  OT001: 'หลักสูตรในโรงเรียนไม่ได้ผลหรือไม่มี', OT002: 'การเรียนทางไกลไม่ได้ผลหรือไม่มี',
};

// SHELL: คำอธิบายรอยต่อเรียบเรียงจาก SKYbrary · ตัวอย่างเป็นสถานการณ์ทั่วไป ไม่ใช่เหตุการณ์จริง
const SHELL = [
  { k: 'H', n: 'L–H', th: 'คนกับเครื่อง (Hardware)',
    d: 'ห้องนักบิน ที่นั่ง จอ สวิตช์ และอุปกรณ์ ต้องเข้ากับร่างกายและการรับรู้ของคน',
    ex: 'สวิตช์สองตัวหน้าตาเหมือนกันอยู่ติดกันจนกดผิดได้ง่าย หรือแว่นมองกลางคืน (NVG) ที่บีบมุมมองและทำให้กะระยะยาก' },
  { k: 'S', n: 'L–S', th: 'คนกับระเบียบ (Software)',
    d: 'ระเบียบ เช็กลิสต์ คู่มือ แผนที่ สัญลักษณ์ และโปรแกรม ต้องอ่านง่ายและตรงกับงานจริง',
    ex: 'เช็กลิสต์ที่เรียงไม่ตรงลำดับการทำงานจริง หรือคำย่อที่ตีความได้สองแบบ' },
  { k: 'E', n: 'L–E', th: 'คนกับสภาพแวดล้อม (Environment)',
    d: 'ทั้งในห้องนักบิน (ความร้อน เสียง การสั่น) และภายนอก (อากาศ ภูมิประเทศ แสง) รวมถึงตารางเวลาและแรงกดดัน',
    ex: 'ฝุ่นจากแรงลมใบพัดตอนลงจอดจนมองไม่เห็นพื้น (brownout) หรือห้องนักบินร้อนจนล้าเร็ว' },
  { k: 'L', n: 'L–L', th: 'คนกับคน (Liveware)',
    d: 'ลูกเรือ ช่าง ผู้ควบคุมการบิน และผู้บังคับบัญชา — การสื่อสาร ภาวะผู้นำ และการทำงานเป็นทีม',
    ex: 'ระยะห่างของยศมากจนผู้ช่วยนักบินไม่กล้าทักเมื่อเห็นว่าผิด' },
];

// TEM: ตัวอย่างสมมุติเพื่ออธิบายลำดับ ไม่ใช่เหตุการณ์จริง
const TEM = [
  { h: 'ภัยคุกคาม', s: 'Threat', t: 'พายุก่อตัวใกล้สนาม และหอบังคับการบินเปลี่ยนทางวิ่งกะทันหัน', m: 'บรีฟแผนสำรองไว้ก่อน — ไม่เกิดความผิดพลาดตามมา' },
  { h: 'ความผิดพลาด', s: 'Error', t: 'รีบจนข้ามขั้นตอนในเช็กลิสต์ก่อนลง', m: 'อีกคนทักทัน แก้ก่อนเครื่องผิดไปจากที่ควร' },
  { h: 'สภาพเครื่องที่ไม่ต้องการ', s: 'Undesired aircraft state', t: 'เข้าหาทางวิ่งสูงและเร็วเกินไป', m: 'บินวนขึ้นใหม่ (go-around) กลับสู่สภาพปกติ' },
];

// FAA-H-8083-2A Figure 4-1: แถว = โอกาสเกิด, คอลัมน์ = ความรุนแรง
const LIKE = [['Probable', 'เกิดบ่อย'], ['Occasional', 'เกิดเป็นครั้งคราว'], ['Remote', 'ไม่น่าเกิด'], ['Improbable', 'แทบเป็นไปไม่ได้']];
const SEV = [['Catastrophic', 'หายนะ'], ['Critical', 'วิกฤต'], ['Marginal', 'จำกัด'], ['Negligible', 'เล็กน้อย']];
const MX = [['H', 'H', 'S', 'M'], ['H', 'S', 'M', 'L'], ['S', 'M', 'M', 'L'], ['M', 'M', 'M', 'L']];
const LV = {
  H: ['สูง', 'High', 'ไม่บิน จนกว่าจะลดความเสี่ยงลงเหลือปานกลางหรือต่ำ'],
  S: ['ร้ายแรง', 'Serious', 'ไม่บิน จนกว่าจะลดความเสี่ยงลงเหลือปานกลางหรือต่ำ'],
  M: ['ปานกลาง', 'Medium', 'บินได้ แต่ลดความเสี่ยงลงเท่าที่ทำได้'],
  L: ['ต่ำ', 'Low', 'บินได้ และยังเฝ้าดูอันตรายนั้นต่อ'],
};
const SCEN = [
  { t: 'อาจต้องอ้อมอากาศไกล เชื้อเพลิงหมดเหนือเขตภูเขา', r: 2, c: 0 },
  { t: 'เข้าเขตน้ำแข็งเกาะ ด้วยเครื่องที่ไม่ได้รับรองให้บินในสภาพนี้', r: 1, c: 0 },
];

const IMSAFE = [
  ['I', 'Illness', 'ไม่มีอาการเจ็บป่วยที่กระทบการบิน'],
  ['M', 'Medication', 'ไม่ได้ใช้ยาที่ทำให้ง่วง หรือยาที่แพทย์ยังไม่อนุญาตให้บิน'],
  ['S', 'Stress', 'ไม่มีเรื่องงาน เงิน หรือครอบครัว ที่ดึงสมาธิอยู่ตอนนี้'],
  ['A', 'Alcohol', 'เว้นการดื่มตามระเบียบของหน่วยแล้ว'],
  ['F', 'Fatigue', 'นอนพอ ไม่ได้ตื่นติดต่อกันนานเกินไป'],
  ['E', 'Emotion', 'อารมณ์นิ่ง ไม่โกรธหรือเสียใจจนกระทบการตัดสินใจ'],
];

// ระยะห่างของอำนาจ: ผลของแต่ละระดับเรียบเรียงจาก SKYbrary Authority Gradients · y = ตำแหน่งของผู้บังคับ/ผู้ช่วยในภาพ
const GRAD = [
  { n: 'แบนเกินไป', y: [70, 70], ok: false, d: 'ทุกความเห็นมีน้ำหนักเท่ากัน ไม่ชัดว่าใครเป็นผู้นำ',
    fx: ['ตัดสินใจช้า', 'อาจตัดสินใจผิด เพราะให้น้ำหนักทุกความเห็นเท่ากัน', 'ผู้นำถูกบั่นทอน และไม่ชัดว่าใครรับผิดชอบอะไร'] },
  { n: 'พอดีกับงาน', y: [44, 88], ok: true, d: 'มีผู้นำชัด และทุกคนกล้าเสนอข้อมูล',
    fx: ['ผู้นำตัดสินใจ แต่ฟังข้อมูลจากทีม', 'ช่วยกันตรวจซ้ำ (cross-check) ได้จริง', 'ปรับได้: ปัญหาไม่ชัด → แบนลง · วิกฤตต้องทำทันที → ชันขึ้น'] },
  { n: 'ชันเกินไป', y: [16, 116], ok: false, d: 'อำนาจรวมอยู่ที่คนเดียว คนอื่นไม่กล้าพูด',
    fx: ['คนอื่นไม่เสนอข้อมูล หรือไม่กล้าทัก', 'การตรวจซ้ำกันและการจัดการภัยคุกคาม (TEM) อ่อนลง', 'ความผิดพลาดของผู้นำ ไม่มีใครจับได้'] },
];

// SA 3 ขั้น (Endsley) — ตัวอย่างสมมุติ ไม่ใช่เหตุการณ์จริง
const SA3 = [
  { h: 'รับรู้', s: 'Perception', q: 'เห็นอะไร', t: 'ฐานเมฆข้างหน้าต่ำลงเรื่อย ๆ และได้ยินเครื่องอื่นรายงานฝนบนเส้นทาง' },
  { h: 'เข้าใจ', s: 'Comprehension', q: 'หมายความว่าอะไร', t: 'ถ้าบินต่อ ต้องลดความสูงเข้าใกล้ภูมิประเทศ หรือเข้าเมฆ ซึ่งเกินขีดที่วางแผนไว้' },
  { h: 'คาดการณ์', s: 'Projection', q: 'อีกไม่กี่นาทีจะเป็นอย่างไร', t: 'อีกราว 10 นาทีจะเลยจุดที่เลี้ยวกลับได้ปลอดภัย — ต้องตัดสินใจตอนนี้ ไม่ใช่ตอนเข้าเมฆแล้ว' },
];

// DECIDE (FAA PHAK บทที่ 2) — ตัวอย่างประตูเปิดดัดแปลงจากตัวอย่างใน PHAK
const DEC = [
  ['D', 'Detect', 'ตรวจพบ', 'รู้ว่ามีอะไรเปลี่ยน หรือสิ่งที่ควรเปลี่ยนกลับไม่เปลี่ยน', 'ไต่ผ่าน 1,500 ฟุต ประตูห้องโดยสารเปิดออก'],
  ['E', 'Estimate', 'ประเมิน', 'ต้องทำอะไรไหม และเร่งแค่ไหน', 'วันฟ้าโปร่ง ประตูเปิดเป็นเรื่องเล็ก — แต่ถ้าอยู่ในเมฆ อากาศแปรปรวน และเพิ่งได้รับคำอนุญาตใหม่ ความเสี่ยงสูงกว่ามาก'],
  ['C', 'Choose', 'เลือกผลที่ต้องการ', 'ตั้งเป้าว่าอยากให้เรื่องนี้จบอย่างไร', 'ลงจอดอย่างปลอดภัย แล้วปิดประตูให้เรียบร้อย'],
  ['I', 'Identify', 'หาทางแก้', 'หาทางที่ไปถึงผลนั้น อย่าติดอยู่กับขั้นตอนจนลืมเป้าหมาย', 'บินต่อทั้งที่ประตูเปิด หรือกลับลงสนามเดิมแล้วปิดประตูบนพื้น'],
  ['D', 'Do', 'ลงมือ', 'ทำตามทางที่เลือก', 'บินเครื่องให้ดีก่อน แล้วกลับลงสนามเดิม'],
  ['E', 'Evaluate', 'ประเมินผล', 'ได้ผลตามที่ต้องการไหม — ไม่ได้ผลให้วนกลับไปเริ่มใหม่', 'ลงจอดแล้ว ปิดประตู ตรวจเครื่องก่อนขึ้นบินใหม่'],
];

// ทัศนคติอันตราย 5 แบบ กับคำแก้ (FAA PHAK รูป 2-4) · ATT_R = ลำดับคำแก้ฝั่งขวา (สลับไว้ให้ต้องคิด)
const ATT = [
  ['ต่อต้านอำนาจ', 'Anti-authority', '"อย่ามาสั่งฉัน"', 'ทำตามกฎ กฎมักจะถูก'],
  ['หุนหัน', 'Impulsivity', '"ทำเร็ว ๆ"', 'ช้าก่อน คิดก่อน'],
  ['คิดว่าไม่เกิดกับตัวเอง', 'Invulnerability', '"ไม่เกิดกับฉันหรอก"', 'เกิดกับฉันได้'],
  ['อวดเก่ง', 'Macho', '"ฉันทำได้"', 'เสี่ยงโดยไม่จำเป็นเป็นเรื่องโง่'],
  ['ยอมแพ้', 'Resignation', '"ทำไปก็เท่านั้น"', 'ฉันไม่ได้หมดหนทาง ฉันทำให้ต่างได้'],
];
const ATT_R = [2, 4, 0, 3, 1];

// หูชั้นในกับการเลี้ยว (FAA PHAK รูป 17-4) · มุมเอียง: บวก = ขวา
const LEANS = [
  { h: 'ยังไม่เลี้ยว', real: 0, felt: 0, t: 'ของเหลวในท่อครึ่งวงกลมนิ่ง — ไม่รู้สึกว่าหมุน' },
  { h: 'เริ่มเลี้ยว', real: 20, felt: 20, t: 'ท่อหมุนไปก่อน ของเหลวตามไม่ทัน ขนรับรู้เอน — รู้สึกว่ากำลังเลี้ยว ตรงกับความจริง' },
  { h: 'เลี้ยวค้าง', real: 20, felt: 0, t: 'เลี้ยวด้วยอัตราคงที่นานพอ ของเหลวหมุนตามทัน ขนกลับตั้งตรง — รู้สึกว่าบินตรง ทั้งที่ยังเอียงอยู่' },
  { h: 'หยุดเลี้ยว', real: 0, felt: -20, t: 'ท่อหยุด แต่ของเหลวยังหมุนต่อ — รู้สึกว่าเลี้ยวไปอีกทาง ทั้งที่ปีกตรงแล้ว จึงอยากเอียงกลับ (the leans)' },
];

// ตื่นติดต่อกัน: ตัวเลขจาก Dawson & Reid 1997 และ Williamson & Feyer 2000 (เล่าความ ไม่ยกคำพูด)
// ช่วงตื่นตัวต่ำ (WOCL) ราว 03:00–05:00 และความเสี่ยงผิดพลาดเพิ่มมากช่วง 02:00–04:00 ตาม FAA AC 120-100 หน้า 2 และ 7
const AW_WAKE = 6;
const AW_MAX = 26;
const bank = (d) => (d === 0 ? 'ตรง' : `เอียง${d > 0 ? 'ขวา' : 'ซ้าย'} ${Math.abs(d)}°`);

const WIDGETS = {
  swiss() {
    const st = (ws[key()] ||= { plug: [] });
    const stop = SLICES.findIndex((_, k) => st.plug.includes(k));
    const safe = stop >= 0;
    // เส้นอันตรายวิ่งจากกลางช่อง "อันตราย" (6 ช่องกว้างเท่ากัน) ถ้าไม่มีแผ่นไหนอุดจะไปจ่อขอบซ้ายของช่องปลายทาง
    // แผ่นที่อุดแล้วอยู่ชั้นบนกว่าเส้น เส้นจึงดูเหมือนชนแผ่นนั้นแล้วหยุด
    const end = safe ? stop + 1 : 4.4;
    return `<div class="sw-stage">
        <div class="sw-src"><span>อันตราย</span></div>
        ${SLICES.map((n, k) => {
          const p = st.plug.includes(k);
          return `<button class="sw-sl${p ? ' plug' : ''}" style="grid-column:${k + 2}" data-lw="sw:${k}" aria-pressed="${p}" aria-label="ชั้น${n}: ${p ? 'อุดแล้ว แตะเพื่อเปิดรู' : 'แตะเพื่ออุดรู'}">
            <i class="h" style="top:${HOLES[k][0]}%"></i><i class="h sm" style="top:${HOLES[k][1]}%"></i><i class="h main"></i>
          </button>`;
        }).join('')}
        <div class="sw-out ${safe ? 'ok' : 'bad'}"><span>${safe ? 'ปลอดภัย' : 'อุบัติเหตุ'}</span></div>
        <div class="sw-ray${safe ? ' cut' : ''}" style="width:${(end * 100) / 6}%" aria-hidden="true"></div>
        ${SLICES.map((n, k) => `<span class="sw-l" style="grid-column:${k + 2}">${n}</span>`).join('')}
      </div>
      <div class="lw-bar"><p class="lw-st" aria-live="polite">${safe
        ? `อันตรายหยุดที่ชั้น<b>${SLICES[stop]}</b> ไม่ถึงเครื่องบิน`
        : 'รูทุกชั้นเรียงตรงกัน — อันตรายทะลุถึงเครื่องบิน'}</p>
        ${st.plug.length ? '<button class="btn" data-lw="sw:reset">เปิดรูทั้งหมด</button>' : ''}</div>`;
  },

  hfacs() {
    const st = (ws[key()] ||= { open: 3 });
    if (st.open < 0 || st.open > 3) st.open = 3;
    const rows = H.tax?.hfacs || [];
    const cats = rows.filter((r) => r.level === 'category');
    const of = (tier) => {
      const list = cats.filter((r) => r.tier === tier);
      return list.length ? list : Object.keys(HF_TH).filter((c) => TIER_OF[c[0]] === tier).map((code) => ({ code, label: '' }));
    };
    const cat = (r) => {
      const nano = rows.filter((x) => x.level === 'nanocode' && x.category === r.code);
      return `<li class="hf-cat-item">
        <div class="hf-cat-top">
          <code class="hf-cat-code">${H.esc(r.code)}</code>
          ${nano.length ? `<span class="hf-cat-nano-badge">${nano.length} รหัสย่อย (DoD 8.0)</span>` : ''}
        </div>
        <div class="hf-cat-name">${HF_TH[r.code] || H.esc(r.label)}${r.label ? ` <small class="hf-cat-en">(${H.esc(r.label)})</small>` : ''}</div>
        ${CAT_D[r.code] ? `<p class="hf-cat-desc">${CAT_D[r.code]}</p>` : ''}
        ${nano.length ? `<details class="hf-c">
          <summary><span>ดูรหัสย่อยทั้ง ${nano.length} รหัส</span></summary>
          <ul>${nano.map((x) => `<li><code>${H.esc(x.code)}</code><span>${NANO_TH[x.code] || H.esc(x.label)}<small>${H.esc(x.label)}</small></span></li>`).join('')}</ul>
        </details>` : ''}
      </li>`;
    };

    const curK = st.open;
    const [curEn, curTh, curD, curAsk] = TIERS[curK];
    const curList = of(curEn);
    const curMeta = TIER_META[curK];

    return `<div class="hf-wrap">
      <div class="hf-strip">
        <div class="hf-strip-tag"><i class="hf-dot"></i><span>HFACS 8.0 · ชั้นป้องกัน 4 ระดับ</span></div>
        <div class="hf-strip-tag">ระดับที่เลือก: <span class="hf-sub">ระดับ ${curMeta.lvl} · ${curTh}</span></div>
      </div>
      <div class="hf-grid">
        <div class="hf-pyr-col">
          <div class="pyr-legend">
            <span><span class="arr">▼</span> ห่วงโซ่สาเหตุ (Causal trajectory)</span>
            <span>4 ระดับ</span>
          </div>
          <div class="pyr-stack">
            <div class="causal-line" aria-hidden="true"></div>
            <div class="causal-arrow" aria-hidden="true"></div>
            ${TIERS.map(([en, th, d, ask], k) => {
              const active = st.open === k;
              const meta = TIER_META[k];
              const list = of(en);
              return `<button class="tier-card${active ? ' active' : ''}" data-t="${meta.lvl}" data-lw="hf:${k}" aria-pressed="${active}">
                <span class="tc-badge">${meta.lvl}</span>
                <div class="tc-info">
                  <div class="tc-title">
                    <span>${th}</span>
                    <span class="tc-type ${meta.type}">${meta.tag}</span>
                  </div>
                  <div class="tc-en">${en} · ${list.length} หมวด</div>
                </div>
                <span class="tc-arrow" aria-hidden="true">›</span>
              </button>`;
            }).join('')}
          </div>
          <div class="mishap-band">
            <svg class="mishap-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M12 3 2 21h20L12 3z"/><path d="M12 10v5M12 18v.01" stroke-linecap="round"/></svg>
            <span><b>ปลายทางห่วงโซ่สาเหตุ:</b> ทะลุชั้นป้องกันจนเกิดอุบัติเหตุ (Mishap)</span>
          </div>
        </div>
        <div class="hf-insp-col">
          <div class="dt-header">
            <div>
              <div class="dt-level-tag">ระดับ ${curMeta.lvl} · ${curK === 3 ? 'ด่านสุดท้ายก่อนเกิดเหตุ (Sharp end)' : 'ชั้นป้องกันแฝง (Latent barrier)'}</div>
              <h3 class="dt-title">${curTh} <span class="dt-en">(${curEn})</span></h3>
            </div>
            <span class="dt-cat-count">${curList.length} หมวดหลัก</span>
          </div>
          <p class="dt-desc">${curD}</p>
          <div class="dt-ask-box">
            <span class="dt-ask-lbl">ถามว่า</span>
            <span><b>"${curAsk}"</b></span>
          </div>
          <div class="dt-cats-title">หมวดหมู่ย่อยในระดับนี้ (Categories & Nanocodes)</div>
          <ul class="dt-cats-list">${curList.map(cat).join('')}</ul>
        </div>
      </div>
    </div>`;
  },

  shell() {
    const st = (ws[key()] ||= { k: 'H' });
    const cur = SHELL.find((x) => x.k === st.k);
    const blk = (b, area, lab) => `<span class="sh-b${b === 'L0' || b === st.k || (b === 'L' && st.k === 'L') ? ' hi' : ''}" style="grid-area:${area}"><b>${b === 'L0' ? 'L' : b}</b><small>${lab}</small></span>`;
    return `<div class="sh">
        <div class="sh-g">${blk('S', 's', 'ระเบียบ')}${blk('H', 'h', 'เครื่อง')}${blk('L0', 'c', 'คน')}${blk('E', 'e', 'สภาพแวดล้อม')}${blk('L', 'l', 'คนอื่น')}</div>
        <div class="sh-d">
          <div class="seg sh-seg" role="group" aria-label="รอยต่อ">${SHELL.map((x) => `<button data-lw="sh:${x.k}" aria-pressed="${x.k === st.k}">${x.n}</button>`).join('')}</div>
          <div class="sh-info" aria-live="polite"><h3>${cur.th}</h3><p>${cur.d}</p><p class="ex"><span>ตัวอย่าง</span>${cur.ex}</p></div>
        </div>
      </div>`;
  },

  tem() {
    const st = (ws[key()] ||= { m: [] });
    const cut = TEM.findIndex((_, k) => st.m.includes(k));
    const safe = cut >= 0;
    const node = (x, k) => {
      const live = !safe || k <= cut;
      const m = st.m.includes(k);
      return `<li class="tm-n${live ? '' : ' off'}${k === cut ? ' cut' : ''}">
        <p class="tm-h"><b>${x.h}</b><small>${x.s}</small></p>
        <p class="tm-t">${k === cut ? x.m : x.t}</p>
        <button class="tm-m" data-lw="tm:${k}" aria-pressed="${m}"${live ? '' : ' disabled'}>${m ? H.icon('check') : ''}จัดการได้</button>
      </li>`;
    };
    return `<ol class="tm">${TEM.map(node).join('')}
        <li class="tm-n tm-end ${safe ? 'ok' : 'bad'}"><p class="tm-h"><b>${safe ? 'จบอย่างปลอดภัย' : 'อุบัติการณ์ / อุบัติเหตุ'}</b><small>Outcome</small></p>
          <p class="tm-t">${safe ? 'วงจรถูกตัดก่อนถึงปลายทาง' : 'ไม่มีใครจัดการได้ทันสักขั้น — เครื่องวิ่งเลยทางวิ่ง'}</p></li></ol>
      ${safe ? `<div class="lw-bar"><p class="lw-st ok" aria-live="polite">ตัดวงจรได้ที่ขั้น<b>${TEM[cut].h}</b></p><button class="btn" data-lw="tm:reset">เริ่มใหม่</button></div>` : ''}`;
  },

  matrix() {
    const st = (ws[key()] ||= { r: null, c: null });
    const sel = st.r != null;
    const lv = sel ? LV[MX[st.r][st.c]] : null;
    return `<div class="mx-wrap"><table class="mx">
        <caption class="sr">ตารางความเสี่ยง: แถวคือโอกาสเกิด คอลัมน์คือความรุนแรง</caption>
        <thead><tr><th scope="col"><span class="mx-ax">โอกาส ↓ · รุนแรง →</span></th>${SEV.map(([en, th]) => `<th scope="col">${th}<small>${en}</small></th>`).join('')}</tr></thead>
        <tbody>${LIKE.map(([en, th], r) => `<tr><th scope="row">${th}<small>${en}</small></th>${MX[r].map((v, c) =>
          `<td><button class="mx-c lv-${v}${sel && r === st.r && c === st.c ? ' on' : ''}" data-lw="mx:${r}:${c}" aria-pressed="${sel && r === st.r && c === st.c}" aria-label="${th} × ${SEV[c][1]} = ${LV[v][0]}">${LV[v][0]}</button></td>`).join('')}</tr>`).join('')}</tbody>
      </table></div>
      <div class="mx-scen">${SCEN.map((x, k) => `<button class="btn" data-lw="mx:s:${k}" aria-pressed="${st.s === k}">${x.t}</button>`).join('')}</div>
      <div class="mx-out" aria-live="polite">${sel
        ? `<p class="mx-lv lv-${MX[st.r][st.c]}"><b>${lv[0]}</b> ${lv[1]}</p><p>${LIKE[st.r][1]} × ${SEV[st.c][1]} → ${lv[2]}</p>`
        : '<p>แตะช่องในตาราง หรือเลือกตัวอย่างด้านบน · ไม่แน่ใจระหว่างสองช่อง ให้เลือกช่องที่เสี่ยงกว่า</p>'}</div>`;
  },

  imsafe() {
    const st = (ws[key()] ||= { ok: [] });
    const n = st.ok.length;
    return `<ul class="ims">${IMSAFE.map(([k, en, t], i) => {
      const on = st.ok.includes(i);
      return `<li><button class="ims-r${on ? ' on' : ''}" data-lw="im:${i}" aria-pressed="${on}">
        <span class="l">${k}</span><span class="t"><b>${en}</b>${t}</span><span class="c">${on ? H.icon('check') : ''}</span></button></li>`;
    }).join('')}</ul>
      <div class="lw-bar"><p class="lw-st ${n === 6 ? 'ok' : ''}" aria-live="polite">ผ่าน <b>${n}/6</b> — ${n === 6
        ? 'พร้อมในส่วนของตัวเอง ยังต้องดู PAVE ข้ออื่นต่อ'
        : 'ข้อที่ยังไม่ผ่าน บอกหัวหน้าเที่ยวบินก่อนบิน'}</p></div>
      <p class="ims-n">บางตำราให้ E = Eating (กินอาหารและดื่มน้ำพอ) และรวมอารมณ์ไว้กับความเครียด</p>`;
  },

  gradient() {
    const st = (ws[key()] ||= { k: 1 });
    const g = GRAD[st.k];
    const [a, b] = g.y;
    return `<div class="gr">
        <svg class="gr-v" viewBox="0 0 320 140" role="img" aria-label="ระยะห่างของอำนาจแบบ${g.n}">
          <line class="gr-base" x1="20" y1="132" x2="300" y2="132"/>
          <line class="gr-ln${g.ok ? ' ok' : ''}" x1="88" y1="${a}" x2="232" y2="${b}"/>
          <g class="gr-p" style="transform:translateY(${a - 70}px)"><circle cx="88" cy="70" r="15"/><text x="88" y="75">ผบ.</text></g>
          <g class="gr-p fo" style="transform:translateY(${b - 70}px)"><circle cx="232" cy="70" r="15"/><text x="232" y="75">ผช.</text></g>
        </svg>
        <div class="gr-d">
          <div class="seg" role="group" aria-label="ระดับความชัน">${GRAD.map((x, k) => `<button data-lw="gr:${k}" aria-pressed="${k === st.k}">${x.n}</button>`).join('')}</div>
          <div class="gr-info" aria-live="polite">
            <p class="gr-tag ${g.ok ? 'ok' : 'bad'}">${H.icon(g.ok ? 'check' : 'warn')}${g.ok ? 'เหมาะกับงาน' : 'มีความเสี่ยง'}</p>
            <p>${g.d}</p>
            <ul>${g.fx.map((t) => `<li>${t}</li>`).join('')}</ul>
          </div>
        </div>
      </div>`;
  },

  sa3() {
    const st = (ws[key()] ||= { n: 0 });
    return `<ol class="sa">${SA3.map((x, k) => {
      const open = k < st.n;
      const next = k === st.n;
      return `<li class="sa-l${open ? ' open' : ''}">
        <button class="sa-b" data-lw="sa:${k}" aria-expanded="${open}"${open || next ? '' : ' disabled'}>
          <span class="n">${k + 1}</span><span class="t"><b>${x.h}</b><small>${x.s} · ${x.q}</small></span></button>
        <p class="sa-t">${open ? x.t : next ? 'แตะเพื่อดูขั้นนี้' : 'เปิดขั้นก่อนหน้าก่อน'}</p>
      </li>`;
    }).join('')}</ol>
      <div class="lw-bar"><p class="lw-st${st.n === 3 ? ' ok' : ''}" aria-live="polite">${st.n === 3
        ? 'ครบ <b>3 ขั้น</b> — เห็นอย่างเดียวไม่พอ ต้องรู้ว่ามันหมายถึงอะไร และจะไปทางไหน'
        : `เปิดแล้ว <b>${st.n}/3</b> ขั้น — ระดับที่สูงกว่าต้องอาศัยระดับที่ต่ำกว่า`}</p>
        ${st.n ? '<button class="btn" data-lw="sa:reset">เริ่มใหม่</button>' : ''}</div>`;
  },

  decide() {
    const st = (ws[key()] ||= { k: 0 });
    const [l, en, th, d, ex] = DEC[st.k];
    return `<div class="dc">
        <div class="dc-row" role="group" aria-label="ขั้นของ DECIDE">${DEC.map((x, k) => `<button class="dc-l" data-lw="dc:${k}" aria-pressed="${k === st.k}" aria-label="${x[1]} ${x[2]}"><b>${x[0]}</b><small>${x[1]}</small></button>`).join('')}</div>
        <div class="dc-p" aria-live="polite">
          <h3><span>${l}</span>${en} · ${th}</h3>
          <p>${d}</p>
          <p class="ex"><span>ตัวอย่าง: ประตูเปิดระหว่างไต่</span>${ex}</p>
        </div>
      </div>
      <div class="lw-bar"><p class="lw-st">ขั้น <b>${st.k + 1}/6</b>${st.k === 5 ? ' — ถ้ายังไม่ได้ผล วนกลับไปขั้น D อีกรอบ' : ''}</p>
        ${st.k < 5 ? `<button class="btn" data-lw="dc:${st.k + 1}">ขั้นถัดไป</button>` : '<button class="btn" data-lw="dc:0">กลับไปขั้นแรก</button>'}</div>`;
  },

  attitude() {
    const st = (ws[key()] ||= { l: null, m: [], bad: null });
    const done = st.m.length === ATT.length;
    return `<div class="at">
        <ul class="at-c" aria-label="ทัศนคติอันตราย">${ATT.map(([th, en, q], i) => {
          const m = st.m.includes(i);
          return `<li><button class="at-b${m ? ' ok' : ''}" data-lw="at:l:${i}" aria-pressed="${st.l === i}"${m ? ' disabled' : ''}>
            <b>${th}</b><small>${en}</small><q>${q.replace(/"/g, '')}</q>${m ? H.icon('check') : ''}</button></li>`;
        }).join('')}</ul>
        <ul class="at-c" aria-label="คำแก้">${ATT_R.map((i, j) => {
          const m = st.m.includes(i);
          return `<li><button class="at-b anti${m ? ' ok' : ''}${st.bad === j ? ' no' : ''}" data-lw="at:r:${j}"${m || st.l == null ? ' disabled' : ''}>
            <span>${ATT[i][3]}</span>${m ? `<small>แก้ ${ATT[i][0]}</small>${H.icon('check')}` : ''}</button></li>`;
        }).join('')}</ul>
      </div>
      <div class="lw-bar"><p class="lw-st${done ? ' ok' : ''}" aria-live="polite">${done
        ? 'จับคู่ครบ <b>5/5</b> — รู้ตัวว่าคิดแบบไหน แล้วพูดคำแก้กับตัวเอง'
        : st.bad != null ? 'ยังไม่ใช่ — ลองคำแก้อื่น'
        : st.l == null ? `แตะทัศนคติทางซ้ายก่อน แล้วแตะคำแก้ที่คู่กัน · <b>${st.m.length}/5</b>`
        : `เลือก <b>${ATT[st.l][0]}</b> แล้ว — แตะคำแก้ที่คู่กัน`}</p>
        ${st.m.length ? '<button class="btn" data-lw="at:reset">เริ่มใหม่</button>' : ''}</div>`;
  },

  leans() {
    const st = (ws[key()] ||= { k: 0 });
    const p = LEANS[st.k];
    const ai = (deg, id, lab) => `<figure class="ln-ai">
        <svg viewBox="0 0 140 140" role="img" aria-label="${lab}: ${bank(deg)}">
          <defs><clipPath id="${id}"><circle cx="70" cy="70" r="58"/></clipPath></defs>
          <g clip-path="url(#${id})"><g class="ln-h" style="transform:rotate(${-deg}deg)">
            <rect class="sky" x="-40" y="-40" width="220" height="110"/><rect class="gnd" x="-40" y="70" width="220" height="110"/>
            <line x1="-40" y1="70" x2="180" y2="70"/></g></g>
          <circle class="rim" cx="70" cy="70" r="58"/>
          <path class="ac" d="M30 70h26l6 8 8-8 8 8 6-8h26"/>
        </svg>
        <figcaption><b>${lab}</b>${bank(deg)}</figcaption></figure>`;
    const miss = p.real !== p.felt;
    return `<div class="ln">
        <div class="ln-v">${ai(p.real, 'ln-r', 'เครื่องบินจริง')}${ai(p.felt, 'ln-f', 'หูชั้นในรู้สึก')}</div>
        <div class="ln-d">
          <div class="seg ln-seg" role="group" aria-label="ช่วงของการเลี้ยว">${LEANS.map((x, k) => `<button data-lw="ln:${k}" aria-pressed="${k === st.k}">${x.h}</button>`).join('')}</div>
          <div class="ln-info" aria-live="polite">
            <p class="gr-tag ${miss ? 'bad' : 'ok'}">${H.icon(miss ? 'warn' : 'check')}${miss ? 'ความรู้สึกไม่ตรงกับความจริง — เชื่อเครื่องวัด' : 'ความรู้สึกตรงกับความจริง'}</p>
            <p>${p.t}</p>
          </div>
        </div>
      </div>`;
  },

  awake() {
    const st = (ws[key()] ||= { h: 8 });
    const pc = (h) => `${(h / AW_MAX) * 100}%`;
    return `<div class="aw">
        <div class="aw-track">
          <span class="aw-z wf" style="left:${pc(17)};width:${pc(2)}" title="Williamson &amp; Feyer 2000"></span>
          <span class="aw-z wocl" style="left:${pc(21)};width:${pc(2)}" title="WOCL 03:00–05:00"></span>
          <input type="range" min="0" max="${AW_MAX}" step="1" value="${st.h}" data-lwr="aw" aria-label="ชั่วโมงที่ตื่นติดต่อกัน" aria-valuetext="${awText(st.h)}">
        </div>
        <div class="aw-ax" aria-hidden="true"><span>ตื่น 06:00</span><span style="left:${pc(10)}">10 ชม.</span><span style="left:${pc(17)}">17</span><span style="left:${pc(21)}">03:00</span><span>26 ชม.</span></div>
        <div class="aw-live" aria-live="polite">${awLive(st.h)}</div>
      </div>`;
  },
};

const awClock = (h) => `${String((AW_WAKE + h) % 24).padStart(2, '0')}:00`;
const awText = (h) => `ตื่นมา ${h} ชั่วโมง เวลา ${awClock(h)}`;
function awLive(h) {
  const hr = (AW_WAKE + h) % 24;
  const fx = [];
  if (h > 10) fx.push(['warn', `ประสิทธิภาพลดลงราว <b>${((h - 10) * 0.74).toFixed(1)}%</b> จากค่าตั้งต้น <small>Dawson &amp; Reid 1997 วัดได้ราว 0.74% ต่อชั่วโมง ระหว่างชั่วโมงที่ 10–26</small>`]);
  if (h >= 17) fx.push(['bad', `ผลทดสอบบางอย่าง <b>เท่ากับหรือแย่กว่า</b> คนที่มีแอลกอฮอล์ในเลือด 0.05% <small>Williamson &amp; Feyer 2000 · ตื่น 17–19 ชั่วโมง</small>`]);
  if (hr >= 3 && hr < 5) fx.push(['bad', `อยู่ในช่วง <b>ตื่นตัวต่ำ (WOCL)</b> ราว 03:00–05:00 — ง่วงที่สุดของวัน แม้นอนพอ <small>FAA AC 120-100, p. 2</small>`]);
  if (hr >= 2 && hr < 4) fx.push(['bad', `ช่วง 02:00–04:00 <b>ความเสี่ยงผิดพลาดเพิ่มขึ้นมาก</b> กว่าช่วงบ่าย <small>FAA AC 120-100, p. 7</small>`]);
  return `<p class="aw-n"><b>${h}</b> ชม. <span>ตอนนี้ ${awClock(h)}</span></p>
    ${fx.length
      ? `<ul class="aw-fx">${fx.map(([c, t]) => `<li class="${c}">${H.icon('warn')}<span>${t}</span></li>`).join('')}</ul>`
      : `<p class="aw-ok">${h < 10 ? 'ยังไม่ถึงช่วงที่งานวิจัยวัดการลดลง (เริ่มนับที่ชั่วโมงที่ 10) — แต่ขึ้นกับการนอนคืนก่อนด้วย' : 'เริ่มเข้าช่วงที่ประสิทธิภาพลดลง'}</p>`}`;
}

/* ── การแตะ / คีย์บอร์ด / ปัด ─────────────────────────────── */

function go(dir) {
  const N = deckOf(L).length;
  const to = idx + dir;
  if (to < 0 || to >= N) return;
  idx = to; // ตั้งทันที กดรัวแล้วไม่ข้ามหน้า
  location.replace(url(L.id, to));
}

function exit() {
  if (from != null && !from.startsWith('/theory/')) { from = null; history.back(); }
  else location.replace('#/theory');
}

function onWidget(v) {
  const [w, a, b] = v.split(':');
  const st = ws[key()];
  if (w === 'sw') {
    if (a === 'reset') st.plug = [];
    else { const k = +a; st.plug = st.plug.includes(k) ? st.plug.filter((x) => x !== k) : [...st.plug, k]; }
  } else if (w === 'hf') st.open = +a;
  else if (w === 'sh') st.k = a;
  else if (w === 'tm') {
    if (a === 'reset') st.m = [];
    else { const k = +a; st.m = st.m.includes(k) ? st.m.filter((x) => x !== k) : [...st.m, k]; }
  } else if (w === 'mx') {
    if (a === 's') Object.assign(st, { r: SCEN[+b].r, c: SCEN[+b].c, s: +b });
    else Object.assign(st, { r: +a, c: +b, s: SCEN.findIndex((x) => x.r === +a && x.c === +b) });
  } else if (w === 'im') {
    const k = +a;
    st.ok = st.ok.includes(k) ? st.ok.filter((x) => x !== k) : [...st.ok, k];
  } else if (w === 'gr' || w === 'dc' || w === 'ln') st.k = +a;
  else if (w === 'sa') st.n = a === 'reset' ? 0 : Math.max(st.n, +a + 1);
  else if (w === 'at') {
    if (a === 'reset') Object.assign(st, { l: null, m: [], bad: null });
    else if (a === 'l') Object.assign(st, { l: +b, bad: null });
    else if (st.l != null) {
      if (ATT_R[+b] === st.l) { st.m.push(st.l); Object.assign(st, { l: null, bad: null }); }
      else st.bad = +b;
    }
  }
  const sel = a === 'reset' ? null : `[data-lw="${v}"]`;
  redraw(sel);
  navigator.vibrate?.(8);
}

let wired = false;
function wire() {
  if (wired) return;
  wired = true;
  const on = () => document.body.classList.contains('lesson') && L;

  H.main.addEventListener('click', (e) => {
    const t = e.target.closest('button, a');
    if (t?.dataset.lsel != null && !L) { pick(Number(t.dataset.lsel)); return; }
    if (t?.dataset.ldiag != null && !L) { openDiag(Number(t.dataset.ldiag)); return; }
    if (!t || !on()) return;
    const d = t.dataset;
    if (d.lgo) { if (d.lgo === 'restart') { idx = 0; location.replace(url(L.id, 0)); } else go(Number(d.lgo)); return; }
    if (t.hasAttribute('data-lx')) { e.preventDefault(); exit(); return; }
    if (d.lnext) { location.replace(url(d.lnext, 0)); return; }
    if (d.lw) { onWidget(d.lw); return; }
    if (d.lq) {
      const st = (ws[key()] ||= {});
      if (st.pick != null) return;
      st.pick = Number(d.lq);
      redraw('.ls-why');
      H.main.querySelector('.ls-why')?.scrollIntoView({ block: 'nearest', behavior: H.reduced.matches ? 'auto' : 'smooth' });
      navigator.vibrate?.(st.pick === deckOf(L)[idx].a ? 10 : [10, 60, 10]);
      return;
    }
    if (d.lflip) {
      const st = ws[key()];
      const n = deckOf(L)[idx].items.length;
      if (d.lflip === 'all') st.open = st.open.length === n ? [] : [...Array(n).keys()];
      else { const k = +d.lflip; st.open = st.open.includes(k) ? st.open.filter((x) => x !== k) : [...st.open, k]; }
      redraw(`[data-lflip="${d.lflip}"]`);
    }
  });

  // แถบเลื่อน (ตื่นติดต่อกัน) วาดใหม่เฉพาะผลลัพธ์ ไม่วาดทั้งสไลด์ ไม่อย่างนั้นลากไม่ต่อเนื่อง
  H.main.addEventListener('input', (e) => {
    const r = e.target.closest?.('[data-lwr="aw"]');
    if (!r || !on()) return;
    const h = Number(r.value);
    ws[key()].h = h;
    r.setAttribute('aria-valuetext', awText(h));
    const live = H.main.querySelector('.aw-live');
    if (live) live.innerHTML = awLive(h);
  });

  document.addEventListener('keydown', (e) => {
    // ลูกศรบนแผนที่เส้นทาง: เลื่อนไปจุดก่อน/ถัดไป
    const wp = e.target.closest?.('.wp');
    if (wp && !L && ['ArrowRight', 'ArrowLeft'].includes(e.key)) {
      e.preventDefault();
      const i = Number(wp.dataset.lsel) + (e.key === 'ArrowRight' ? 1 : -1);
      if (i >= 0 && i < LESSONS.length) pick(i, true);
      return;
    }
    if (!on() || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key !== 'Escape' && e.target.closest?.('input, textarea, select')) return; // ลูกศรบนแถบเลื่อนเป็นของแถบเลื่อน
    const onBtn = e.target.closest?.('button, a');
    // Space บนปุ่มให้กดปุ่มนั้น (เลือกคำตอบ พลิกการ์ด) ไม่ใช่เลื่อนสไลด์
    if (['ArrowRight', 'PageDown'].includes(e.key) || (e.key === ' ' && !onBtn)) { e.preventDefault(); go(1); }
    else if (['ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); go(-1); }
    else if (e.key === 'Escape') exit();
  });

  // ปัดซ้าย/ขวาเลื่อนสไลด์ · เริ่มปัดบนภาพโต้ตอบ (ตารางเลื่อนแนวนอนได้) ไม่นับ
  let x0 = null;
  let y0 = 0;
  document.addEventListener('touchstart', (e) => {
    x0 = on() && !e.target.closest('.nosw') ? e.touches[0].clientX : null;
    y0 = e.touches[0].clientY;
  }, { passive: true });
  document.addEventListener('touchend', (e) => {
    if (x0 == null) return;
    const dx = e.changedTouches[0].clientX - x0;
    const dy = e.changedTouches[0].clientY - y0;
    x0 = null;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1);
  }, { passive: true });
}
