// ตัวเลขสถิตินับขึ้นจาก 0 ตอนเปิดหน้า สำหรับ [data-count] (แนวคิด Stride, 22 ต.ค. 2569)
// เฉพาะจอคอมฯ ≥1024px และเริ่มเมื่อตัวเลขเลื่อนเข้าจอ · จอเล็กหรือปิดการเคลื่อนไหว → ไม่แตะข้อความเลย
// ข้อความในหน้าคือค่าสุดท้าย (รูปแบบเดิม เช่น nTh) ระหว่างนับใช้คอมมาแบบ en-US แล้วคืนข้อความเดิมเมื่อจบ
const wide = matchMedia('(min-width: 1024px)');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const fmt = (n) => n.toLocaleString('en-US');

function run(el, delay) {
  const to = +el.dataset.count, end = el.dataset.end;
  const t0 = performance.now() + delay;
  const step = (t) => {
    if (!el.isConnected) return;
    const p = Math.min(1, Math.max(0, (t - t0) / 1100));
    if (p < 1) { el.textContent = fmt(Math.round(to * (1 - Math.pow(1 - p, 3)))); requestAnimationFrame(step); return; }
    el.textContent = end;
    delete el.dataset.end;
  };
  requestAnimationFrame(step);
}

export function countUp(root) {
  if (!wide.matches || reduced.matches) return;
  // ข้ามตัวที่กำลังนับอยู่ (มี data-end) เพื่อให้เรียกซ้ำกับกล่องเดิมได้
  const els = [...root.querySelectorAll('[data-count]')].filter((el) => +el.dataset.count > 0 && el.dataset.end == null);
  if (!els.length) return;
  // ขึ้น 0 ไว้ก่อน ไม่ให้ค่าสุดท้ายแวบขึ้นมา 1 เฟรมก่อนเริ่มนับ
  for (const el of els) { el.dataset.end = el.textContent; el.textContent = '0'; }
  if (!window.IntersectionObserver) { els.forEach((el, i) => run(el, 250 + i * 60)); return; }
  let k = 0;
  const io = new IntersectionObserver((ents) => {
    for (const e of ents) {
      if (!e.isIntersecting) continue;
      io.unobserve(e.target);
      run(e.target, 120 + (k++ % 6) * 60);
    }
  }, { threshold: .4 });
  els.forEach((el) => io.observe(el));
}
