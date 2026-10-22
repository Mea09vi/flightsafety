// Wing 2 Airmanship — นโยบายผู้บังคับการกองบิน 2 (โปสเตอร์ 20 ต.ค. 2569) + นโยบาย เสธ.ทอ. Knowledge · Standard · Discipline
// ข้อความในโปสเตอร์คัดมาตามต้นฉบับ ห้ามเรียบเรียงใหม่ · ลิงก์ "ในแอป" (go) เป็นของแอป ไม่ใช่ส่วนของนโยบาย
// DECISIONS.md หัวข้อ "Wing 2 Airmanship และนโยบาย เสธ.ทอ."

import { countUp } from './countup.js';

export const MOTTO = 'MISSION FIRST. SAFETY ALWAYS.';

// นโยบาย เสธ.ทอ. — แต่ละคำชี้ไปส่วนของแอปที่ใช้ทำตามนโยบายนั้น
export const KSD = [
  { en: 'KNOWLEDGE', th: 'ความรู้', ic: 'book', d: 'รู้จากเหตุจริงและหลักวิชา', go: [['#/theory', 'ทฤษฎีนิรภัย'], ['#/history', 'ประวัติเหตุ บน.2'], ['#/dashboard', 'คลังข้อมูลสากล']] },
  { en: 'STANDARD', th: 'มาตรฐาน', ic: 'doc', d: 'ยึดระเบียบ คู่มือ SOP และ Checklist เดียวกัน', go: [['#/regs', 'กฎระเบียบและคู่มือ']] },
  { en: 'DISCIPLINE', th: 'วินัย', ic: 'shield', d: 'บรีฟทุกเที่ยว ทำตามที่ตกลงทุกครั้ง', go: [['#/filter', 'บรีฟก่อนบิน · ทำวันนี้']] },
];

export const VALUES = ['วินัย', 'ความชำนาญ', 'ความรู้', 'การตัดสินใจอย่างปลอดภัย', 'ภารกิจสำเร็จ'];

export const FOUNDATIONS = [
  { en: 'PROFICIENCY', th: 'ความพร้อมและความชำนาญ', ic: 'compass' },
  { en: 'SKILL', th: 'ทักษะการบินและการปฏิบัติ', ic: 'helmet' },
  { en: 'DISCIPLINE', th: 'วินัยและการยึดถือ SOP', ic: 'shield' },
  { en: 'KNOWLEDGE', th: 'ความรู้ เครื่องบิน ภารกิจ และข้อจำกัด', ic: 'book' },
];

export const PILLARS = [
  { en: 'SELF', th: 'รู้ขีดจำกัดตนเอง', ic: 'person', go: ['#/theory/fatigue', 'บท ความล้า'] },
  { en: 'AIRCRAFT', th: 'รู้ข้อจำกัดอากาศยาน', ic: 'heli', go: ['#/regs', 'คู่มือ'] },
  { en: 'TEAM', th: 'สื่อสารและทำงานเป็นทีม', ic: 'crew', go: ['#/theory/crm', 'บท CRM'] },
  { en: 'ENVIRONMENT', th: 'ประเมินสภาพแวดล้อม', ic: 'mtn', go: ['#/areas', 'พื้นที่บิน'] },
  { en: 'RISK', th: 'ระบุและจัดการความเสี่ยง', ic: 'warn', go: ['#/theory/risk', 'บท ความเสี่ยง'] },
  { en: 'MISSION', th: 'ภารกิจและผลลัพธ์ที่คาดหวัง', ic: 'target', go: ['#/filter', 'บรีฟก่อนบิน'] },
];

export const CORE = [
  { en: 'SITUATION AWARENESS', th: 'รับรู้สถานการณ์', ic: 'eye', go: ['#/theory/sa', 'บท Situation Awareness'] },
  { en: 'JUDGMENT', th: 'ตัดสินใจอย่างรอบคอบ', ic: 'fork', go: ['#/theory/adm', 'บท การตัดสินใจ (ADM)'] },
];

// 5 ขั้นก่อนและระหว่างบิน — s = คำสั้นสำหรับท้ายโหมดบรีฟ
export const STEPS = [
  { t: 'Brief ให้ชัด เข้าใจภารกิจร่วมกัน', s: 'Brief ให้ชัด', ic: 'brief' },
  { t: 'ตรวจสอบเครื่องบินและอุปกรณ์ตาม Checklist', s: 'ตรวจตาม Checklist', ic: 'heli' },
  { t: 'ประเมินสภาพอากาศ ภูมิประเทศ และภัยคุกคาม', s: 'ประเมินอากาศ ภูมิประเทศ ภัยคุกคาม', ic: 'mtn' },
  { t: 'สื่อสารอย่างชัดเจน ยืนยันเมื่อไม่แน่ใจ', s: 'สื่อสารชัด ยืนยันเมื่อไม่แน่ใจ', ic: 'radio' },
  { t: 'เมื่อความเสี่ยงเกินควบคุม: ชะลอ ยกเลิก หรือ Go-Around ตามความเหมาะสมและ SOP', s: 'เสี่ยงเกินควบคุม: ชะลอ ยกเลิก Go-Around', ic: 'warn', hot: true },
];

// หัวข้อแต่ละส่วน: เลขบนโปสเตอร์คือจำนวนข้อ (ผู้ใช้ยืนยัน 22 ต.ค. 2569) · ส่วน "นำไปใช้" เป็น 1 แนวทาง 5 ขั้น
const UNIT = { 4: 'ข้อ', 6: 'ข้อ', 2: 'ข้อ', 1: 'แนวทาง' };

export function render(main, { esc, icon }) {
  const link = ([href, l]) => `<a class="air-go" href="${href}">${esc(l)}${icon('next')}</a>`;
  const sec = (n, h, id, body, cls = '') => `<section class="air-sec${cls}" aria-labelledby="${id}">
      <h2 class="air-h" id="${id}"><span class="air-n"><b data-count="${n}">${n}</b><small>${UNIT[n]}</small></span><span>${h}</span></h2>${body}</section>`;
  const card = (x, i, more = '') => `<li class="air-card" style="--i:${i}">
        <span class="air-ic">${icon(x.ic)}</span><b>${x.en}</b><span>${esc(x.th)}</span>${more}</li>`;
  // เสาหลัก 6 ข้อ: จอคอมฯ แบ่งซ้าย 3 ขวา 3 รอบวงกลางรูปทางแยก (การตัดสินใจ) ที่ใส่เพื่อความสวยงามเท่านั้น
  const hub = `<li class="air-hub" aria-hidden="true"><span>${icon('fork')}</span></li>`;

  main.innerHTML = `<div class="view air">
    <header class="air-hero">
      <div class="air-hero-in">
        <img class="air-emb" src="img/emblem.webp" width="54" height="57" alt="">
        <p class="air-eye">นโยบายผู้บังคับการกองบิน 2</p>
        <h1>WING 2 <em>AIRMANSHIP</em></h1>
        <p class="air-sub">การเป็นนักบินทหารอากาศที่ดี</p>
        <ul class="air-vals">${VALUES.map((v, i) => `<li style="--i:${i}">${esc(v)}</li>`).join('')}</ul>
      </div>
    </header>

    <section class="air-ksd" aria-labelledby="air-ksd-h">
      <h2 id="air-ksd-h">นโยบาย เสธ.ทอ.</h2>
      <ul>${KSD.map((k, i) => `<li style="--i:${i}" data-k="${k.en[0]}">
        <span class="air-ic">${icon(k.ic)}</span>
        <b>${k.en}</b><span class="th">${esc(k.th)}</span>
        <p>${esc(k.d)}</p>
        <div class="air-gos"><span class="air-in">ในแอป</span>${k.go.map(link).join('')}</div>
      </li>`).join('')}</ul>
    </section>

    ${sec(4, 'รากฐานของ <b>AIRMANSHIP</b>', 'air-4', `<ul class="air-grid g4">${FOUNDATIONS.map((f, i) => card(f, i)).join('')}</ul>`)}

    ${sec(6, 'เสาหลักในการตัดสินใจ', 'air-6', `<ul class="air-grid g6">${PILLARS.map((p, i) => card(p, i, link(p.go))).join('')}${hub}</ul>`)}

    ${sec(2, 'สมรรถนะสำคัญ', 'air-2', `<ul class="air-grid g2">${CORE.map((c, i) => `<li class="air-card wide" style="--i:${i}">
        <span class="air-ic big">${icon(c.ic)}</span><div><b>${c.en}</b><span>${esc(c.th)}</span>${link(c.go)}</div></li>`).join('')}</ul>`)}

    ${sec(1, 'นำไปใช้ก่อนและระหว่างบิน', 'air-1', `<ol class="air-steps">${STEPS.map((s, i) => `<li${s.hot ? ' class="hot"' : ''} style="--i:${i}">
        <span class="air-ic">${icon(s.ic)}</span><span class="n">${i + 1}</span><span class="t">${esc(s.t)}</span></li>`).join('')}</ol>`)}

    <section class="air-motto" aria-label="คติ">
      <p class="m"><span class="air-ic">${icon('target')}</span><b>MISSION</b><span>ภารกิจสำเร็จ เริ่มจากการตัดสินใจที่ปลอดภัย</span></p>
      <p class="big">${MOTTO}</p>
      <p class="foot"><span>กองบิน 2</span><span>AIRMANSHIP · CRM · RISK MANAGEMENT</span><span>ใช้ร่วมกับ SOP / Checklist / คำสั่งปฏิบัติการของหน่วย</span></p>
    </section>
    <p class="air-note">ข้อความคัดจากโปสเตอร์นโยบายผู้บังคับการกองบิน 2 และนโยบายเสนาธิการทหารอากาศ · ลิงก์ "ในแอป" เป็นทางลัดของแอปนี้ ไม่ใช่ส่วนของนโยบาย</p>
  </div>`;

  const root = main.querySelector('.air');
  countUp(root);
  // การ์ดค่อย ๆ ปรากฏเมื่อเลื่อนถึง · ปิดการเคลื่อนไหวหรือไม่มี IntersectionObserver → แสดงทันที (ไม่ใส่ .rv)
  if (!window.IntersectionObserver || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  root.classList.add('rv');
  const io = new IntersectionObserver((ents) => {
    for (const e of ents) if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }, { threshold: 0.12 });
  root.querySelectorAll('.air-ksd, .air-sec').forEach((el) => io.observe(el));
  // แสงตามเมาส์บนการ์ด: บอกตำแหน่งตัวชี้ให้ CSS (--mx/--my) เฉพาะอุปกรณ์ที่มีเมาส์
  if (!matchMedia('(hover: hover)').matches) return;
  root.addEventListener('pointermove', (e) => {
    const c = e.target.closest('.air-card, .air-ksd li');
    if (!c) return;
    const r = c.getBoundingClientRect();
    c.style.setProperty('--mx', `${e.clientX - r.left}px`);
    c.style.setProperty('--my', `${e.clientY - r.top}px`);
  });
}
