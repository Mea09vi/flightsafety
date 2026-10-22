// หน้าเข้าสู่ระบบ (DECISIONS.md หัวข้อ "หน้าเข้าสู่ระบบ")
// app.js โหลดไฟล์นี้เฉพาะตอนมีไฟล์หน่วยแต่เครื่องยังไม่มีกุญแจ
// พื้นหลังเป็นวิดีโอ ฮ. S-70i ฝูงบิน 201 ช่วงกลางวัน ตัวเดียวกับปกหน้าหลัก (แก้ 22 ต.ค. 2569 แทนฉากสวิสชีสเดิม ดูได้ใน git ก่อน commit นี้)

const EYE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
const EYE_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3l18 18"/><path d="M10.6 5.1A10.9 10.9 0 0 1 12 5c6.4 0 10 7 10 7a17.6 17.6 0 0 1-3.2 4.1M6.6 6.6C3.7 8.5 2 12 2 12s3.6 7 10 7a10 10 0 0 0 5.4-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>';
// ภาพนิ่งอยู่ใน SHELL ของ sw.js จึงขึ้นทันทีแม้ออฟไลน์ · วิดีโอไม่แคชและเปิดเฉพาะจอคอมฯ ตามหัวข้อ "ภาพจริงของหน่วยบนเว็บ"
const STILL = 'img/hero-day.webp', VIDEO = 'img/hero/s70i-9133-day.mp4';
const OK_MS = 650, FLASH_MS = 950, OUT_MS = 450, MIN_BUSY_MS = 400;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// unlock(pass, remember) → Promise<boolean>
// onEnter() เรียกทันทีที่ถอดรหัสได้ ให้แอปวาดหน้าใหม่ไว้ข้างหลังระหว่างแอนิเมชัน
// onClose() เรียกหลังเอาหน้าเข้าสู่ระบบออกแล้ว · ไม่มีทางข้าม ต้องใส่รหัสถูกเท่านั้น (ผู้ใช้สั่ง 16 ต.ค. 2569)
export function openGate({ iter, unlock, onEnter, onClose }) {
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const iterTxt = Number(iter || 0).toLocaleString('en-US');
  const gate = document.createElement('div');
  gate.className = 'gate';
  gate.setAttribute('role', 'dialog');
  gate.setAttribute('aria-modal', 'true');
  gate.setAttribute('aria-labelledby', 'g-h');
  gate.innerHTML = `
    <div class="g-media" aria-hidden="true"><img src="${STILL}" alt="" decoding="async"></div>
    <div class="g-cls" role="note"><b>เปิดเผยได้ภายในหน่วย</b><span>· เคสของ บน.2 เข้ารหัสไว้ เปิดได้ด้วยรหัสผ่านหน่วยเท่านั้น</span></div>
    <div class="g-stage">
      <form class="g-box" novalidate autocomplete="off">
        <div class="g-cover">
          <img src="img/emblem.webp" alt="ตรากองบิน 2" width="54" height="57">
          <div class="g-who"><b>Wing2 Safety</b><small>กองบิน 2 · ฝ่ายนิรภัยการบิน</small></div>
        </div>
        <p class="g-kick">บทเรียนจากเคสจริง ก่อนขึ้นบินทุกเที่ยว</p>
        <h1 id="g-h">บทเรียนนิรภัย<span>ก่อนบิน</span></h1>
        <p class="g-sub">เลือกแบบ ภารกิจ และสภาพการบิน แอปจะดึงอุบัติเหตุ อุบัติการณ์ และ hazard ที่ตรงกับเที่ยวบินมาให้บรีฟ ใส่รหัสผ่านหน่วยเพื่อเปิดเคสของ บน.2</p>
        <label class="g-lbl" for="g-pw">รหัสผ่านหน่วย <small>ถามได้จาก FSO</small></label>
        <div class="g-pw">
          <input id="g-pw" type="password" maxlength="4" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="4 ตัวอักษร" aria-describedby="g-msg">
          <button type="button" class="g-eye" aria-label="แสดงรหัสผ่าน" aria-pressed="false">${EYE}</button>
        </div>
        <label class="g-rem"><input type="checkbox" id="g-rem" checked> จำไว้ในเครื่องนี้ <small>· เครื่องส่วนกลางให้เอาออก</small></label>
        <button class="g-go" type="submit"><span class="g-spin" aria-hidden="true"></span><span class="g-goT">ปลดล็อกและเข้าสู่บรีฟ</span></button>
        <p class="g-msg" id="g-msg" role="status" aria-live="polite"></p>
        <dl class="g-foot">
          <dt>การเข้ารหัส</dt><dd class="g-m">AES-256-GCM</dd>
          <dt>กุญแจ</dt><dd><span class="g-m">PBKDF2-SHA256 · ${iterTxt}</span> รอบ</dd>
          <dt>การถอดรหัส</dt><dd>ภายในเครื่องนี้เท่านั้น รหัสไม่ถูกส่งออกไปที่ใด</dd>
        </dl>
      </form>
    </div>
    <div class="g-edge"></div><div class="g-flash"></div>`;
  document.body.append(gate);

  const q = (s) => gate.querySelector(s);
  const box = q('.g-box'), pw = q('#g-pw'), rem = q('#g-rem'), go = q('.g-go'), goT = q('.g-goT'), msg = q('#g-msg'), eye = q('.g-eye');

  // วิดีโอเฉพาะจอคอมฯ ที่ไม่ได้ตั้งลดการเคลื่อนไหวหรือประหยัดข้อมูล เล่นไม่ได้ก็ยังเห็นภาพนิ่งตัวเดียวกันอยู่ข้างใต้
  let vid = null;
  if (!RM && matchMedia('(min-width: 1024px)').matches && !navigator.connection?.saveData) {
    vid = Object.assign(document.createElement('video'), { muted: true, loop: true, playsInline: true, autoplay: true, preload: 'auto', poster: STILL, src: VIDEO });
    vid.setAttribute('muted', '');
    vid.addEventListener('playing', () => vid.classList.add('on'), { once: true });
    q('.g-media').append(vid);
    vid.play().catch(() => {});
  }

  const close = () => {
    document.body.classList.remove('gated');
    gate.classList.add('out');
    setTimeout(() => {
      vid?.pause();
      gate.remove();
      onClose?.();
    }, RM ? 0 : OUT_MS);
  };

  // ---------- การ์ด ----------
  eye.addEventListener('click', () => {
    const show = pw.type === 'password';
    pw.type = show ? 'text' : 'password';
    eye.innerHTML = show ? EYE_OFF : EYE;
    eye.setAttribute('aria-pressed', String(show));
    eye.setAttribute('aria-label', show ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน');
    pw.focus();
  });
  pw.addEventListener('input', () => {
    if (msg.classList.contains('bad')) { msg.textContent = ''; msg.className = 'g-msg'; }
  });

  let busy = false, done = false;
  const setBusy = (on) => {
    busy = on;
    go.disabled = on; go.classList.toggle('busy', on);
    goT.textContent = on ? 'กำลังถอดรหัส…' : 'ปลดล็อกและเข้าสู่บรีฟ';
  };
  const fail = () => {
    gate.classList.add('err');
    box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake');
    setTimeout(() => gate.classList.remove('err'), 900);
    msg.className = 'g-msg bad';
    msg.textContent = 'รหัสไม่ถูกต้อง ตรวจตัวพิมพ์และภาษาของแป้นพิมพ์แล้วลองใหม่';
    pw.select();
  };
  // ปุ่มเป็นสีเขียว ภาพขยายเข้าหาเครื่องเล็กน้อย แล้วจางเป็นพื้นของแอป
  const pass = () => {
    done = true;
    go.disabled = true; pw.disabled = true;
    go.classList.add('ok');
    goT.textContent = 'ปลดล็อกแล้ว';
    msg.className = 'g-msg ok';
    msg.textContent = 'ถอดรหัสสำเร็จ กำลังเปิดเคสของ บน.2';
    onEnter?.();
    gate.classList.add('pass');
    setTimeout(() => {
      gate.classList.add('flash');
      setTimeout(close, RM ? 0 : FLASH_MS);
    }, RM ? 0 : OK_MS);
  };
  box.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (busy || done) return;
    const v = pw.value.trim();
    if (!v) { msg.className = 'g-msg bad'; msg.textContent = 'ใส่รหัสผ่านหน่วยก่อน'; pw.focus(); return; }
    setBusy(true);
    // PBKDF2 บนคอมพิวเตอร์เร็วมาก หน่วงไว้เล็กน้อยให้เห็นว่ากำลังถอดรหัส ไม่ใช่กดแล้วกระพริบ
    const [ok] = await Promise.all([unlock(v, rem.checked).catch(() => false), wait(MIN_BUSY_MS)]);
    setBusy(false);
    ok ? pass() : fail();
  });

  // เมาส์/คีย์บอร์ด: โฟกัสช่องรหัสเลย · จอสัมผัส: ไม่โฟกัส แป้นพิมพ์จะได้ไม่บังภาพตั้งแต่เปิด
  if (matchMedia('(pointer: fine)').matches) pw.focus({ preventScroll: true });
}
