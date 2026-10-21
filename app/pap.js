// แผนปฏิบัติเมื่ออากาศยานเกิดเหตุ (PAP) — #/pap
// คู่มือย่อจากระเบียบ บน.2 ว่าด้วยการปฏิบัติเมื่ออากาศยานเกิดเหตุฉุกเฉินฯ + ทะเบียนการซ้อมย้อนหลัง + ตัวช่วยวางแผนซ้อม
// ข้อมูลทั้งหมดเข้ารหัสด้วยกุญแจหน่วย (data/pap.enc.json) · ไม่มีแผนที่ Crash Grid ข่ายวิทยุ เบอร์โทร และชื่อบุคคล
// DECISIONS.md หัวข้อ "แผน PAP"

const MONTHS = ['ต.ค.', 'พ.ย.', 'ธ.ค.', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.'];
const KIND = { drill: 'ซ้อมปฏิบัติ', tabletop: 'ซ้อมบนโต๊ะ', joint: 'ซ้อมร่วม', stby: 'เตรียมพร้อม', other: 'อื่น ๆ' };
const STATUS = { held: 'ซ้อมแล้ว', planned: 'ตามแผน', postponed: 'เลื่อน/งด' };
const LOC = { in: 'ในเขตสนามบิน', out: 'นอกเขตสนามบิน' };
const TABS = [['guide', 'คู่มือ', 'book'], ['drills', 'การซ้อม', 'cal'], ['plan', 'วางแผนซ้อม', 'target']];

// วันที่ พ.ศ. "2567-10-15" หรือ "2567-10" → ปีงบ (ต.ค.–ธ.ค. เป็นปีงบถัดไป) และลำดับเดือนในปีงบ 0 = ต.ค.
export function fyOf(date) {
  const m = /^(\d{4})-(\d{2})/.exec(date || '');
  if (!m) return null;
  const y = +m[1], mo = +m[2];
  return { fy: mo >= 10 ? y + 1 : y, mi: (mo + 2) % 12 };
}
const counts = (d) => d.status === 'held' && (d.kind === 'drill' || d.kind === 'joint');
const fmtDate = (s) => {
  const m = /^(\d{4})-(\d{2})(?:-(\d{2}))?/.exec(s || '');
  if (!m) return s || '';
  const mon = MONTHS[(+m[2] + 2) % 12];
  return `${m[3] ? +m[3] + ' ' : ''}${mon} ${m[1].slice(2)}`;
};

const st = { tab: 'guide', fy: '', q: '', open: null };

export function render(main, H, sub) {
  const { esc, icon } = H;
  if (TABS.some((t) => t[0] === sub)) st.tab = sub;
  main.innerHTML = `<div class="view pap">
    <p class="eyebrow">ระเบียบกองบิน ๒ · Pre-Accident Plan</p>
    <h1 class="page-h">แผนปฏิบัติเมื่อ<em>อากาศยานเกิดเหตุ</em></h1>
    <nav class="pap-tabs" aria-label="ส่วนของหน้า">${TABS.map(([k, th, ic]) =>
      `<a href="#/pap/${k}" aria-current="${st.tab === k ? 'page' : 'false'}">${icon(ic)}<span>${th}</span></a>`).join('')}</nav>
    <div id="pap-body"><p class="rg-lede">กำลังโหลด…</p></div>
  </div>`;
  H.loadPap().then((P) => {
    const box = main.querySelector('#pap-body');
    if (!box) return;
    if (P.status !== 'ok') {
      const msg = {
        locked: ['lock', 'ข้อมูล PAP ล็อกอยู่', 'ปลดล็อกข้อมูลของหน่วยก่อน แล้วกลับมาหน้านี้อีกครั้ง'],
        missing: ['info', 'ยังไม่มีข้อมูล PAP ในเวอร์ชันนี้', ''],
        unsupported: ['info', 'เบราว์เซอร์นี้เปิดข้อมูล PAP ไม่ได้', 'ลองใช้ Chrome หรือ Safari รุ่นใหม่'],
      }[P.status] || ['info', 'เปิดข้อมูลไม่สำเร็จ', ''];
      box.innerHTML = `<div class="empty">${icon(msg[0])}<h2>${msg[1]}</h2>${msg[2] ? `<p>${msg[2]}</p>` : ''}</div>`;
      return;
    }
    if (st.tab === 'drills') drills(box, P.data, H);
    else if (st.tab === 'plan') plan(box, P.data, H);
    else guide(box, P.data.guide, H);
  }).catch((err) => console.warn('pap', err));
}

/* ── คู่มือ ─────────────────────────────────────────────── */

function guide(box, G, { esc, icon }) {
  const pg = (p) => (p ? `<span class="pap-p">หน้า ${p}</span>` : '');
  const list = (a, f = (x) => esc(x.text)) => `<ul class="pap-ul">${a.map((x) => `<li>${f(x)}${pg(x.p)}</li>`).join('')}</ul>`;
  const flow = (a) => `<ol class="pap-flow">${a.map((x) => `<li><span class="pap-st">${x.step}</span><div><b>${esc(x.who)}</b>${x.time ? ` <span class="pap-t">${icon('clock')}${esc(x.time)}</span>` : ''}<p>${esc(x.do)}</p>${pg(x.p)}</div></li>`).join('')}</ol>`;
  const sec = (id, ic, h, body, n, open = false) => body ? `<details class="pap-sec" id="pg-${id}"${open ? ' open' : ''}>
      <summary><span class="pap-ic">${icon(ic)}</span><span class="pap-h">${h}</span>${n ? `<b class="cn">${n}</b>` : ''}${icon('down', 'ic pap-chev')}</summary>
      <div class="pap-in">${body}</div></details>` : '';
  const has = (a) => Array.isArray(a) && a.length;

  box.innerHTML = `
    ${G.purpose ? `<p class="rg-lede">${esc(G.purpose)}</p>` : ''}
    <div class="pap-jump">${[
      ['flow_in', 'ในเขตสนามบิน'], ['flow_out', 'นอกเขตสนามบิน'], ['roles', 'หน่วยและหน้าที่'], ['short_brief', 'บรีฟสั้น'],
      ['photos', 'ภาพหลักฐาน'], ['wreckage', 'รักษาซาก'], ['alarm_form', 'แบบรับแจ้งข่าว'],
    ].filter(([k]) => has(G[k])).map(([k, th]) => `<a href="#pg-${k}" data-jump="pg-${k}">${th}</a>`).join('')}</div>
    ${has(G.alert_levels) ? `<div class="pap-levels">${G.alert_levels.map((x) => `<div class="pap-lv"><b>${esc(x.name)}</b><p>${esc(x.when)}</p>${x.action ? `<p class="a">${esc(x.action)}</p>` : ''}</div>`).join('')}</div>` : ''}
    ${sec('flow_in', 'pin', 'เกิดเหตุในเขตสนามบิน', has(G.flow_in) && flow(G.flow_in), G.flow_in?.length, true)}
    ${sec('flow_out', 'mtn', 'เกิดเหตุนอกเขตสนามบิน', has(G.flow_out) && flow(G.flow_out), G.flow_out?.length)}
    ${sec('roles', 'crew', 'หน่วยและหน้าที่', has(G.roles) && `<div class="pap-roles">${G.roles.map((r) => `<div class="pap-role">
        <h3>${r.vest ? `<i class="pap-vest" style="--v:${vestColor(r.vest)}" title="${esc(r.vest)}"></i>` : ''}${esc(r.unit)}</h3>
        ${r.vest ? `<p class="pap-vt">เสื้อ/ปลอกแขน ${esc(r.vest)}</p>` : ''}
        <ul>${r.duties.map((d) => `<li>${esc(d)}</li>`).join('')}</ul>${pg(r.p)}</div>`).join('')}</div>`, G.roles?.length)}
    ${sec('short_brief', 'chat', 'บรีฟสั้นให้ชุดกู้ภัย', has(G.short_brief) && `<ol class="pap-num">${G.short_brief.map((x) => `<li>${esc(x.text)}${pg(x.p)}</li>`).join('')}</ol>`, G.short_brief?.length)}
    ${sec('photos', 'image', 'ภาพถ่ายหลักฐานมาตรฐาน', has(G.photos) && `<ol class="pap-num pap-photos">${G.photos.map((x) => `<li>${esc(x.text)}</li>`).join('')}</ol>${pg(G.photos[0].p)}`, G.photos?.length)}
    ${sec('wreckage', 'shield', 'การรักษาซากอากาศยาน', has(G.wreckage) && list(G.wreckage), G.wreckage?.length)}
    ${sec('triage', 'person', 'การคัดแยกผู้บาดเจ็บ', has(G.triage) && `<div class="pap-tri">${G.triage.map((x) => `<div><i style="--v:${vestColor(x.tag)}"></i><b>${esc(x.tag)}</b><span>${esc(x.meaning)}</span></div>`).join('')}</div>`, G.triage?.length)}
    ${sec('big_aircraft', 'warn', 'อากาศยานใหญ่ / ผู้ประสบภัยจำนวนมาก', has(G.big_aircraft) && list(G.big_aircraft))}
    ${sec('vip_standby', 'target', 'ภารกิจสำคัญ', has(G.vip_standby) && list(G.vip_standby))}
    ${sec('access_control', 'lock', 'การควบคุมพื้นที่และบัตรผ่าน', has(G.access_control) && list(G.access_control))}
    ${sec('kit', 'layers', 'ชุดปฏิบัติการและอุปกรณ์', has(G.kit) && G.kit.map((k) => `<h3 class="pap-sh">${esc(k.team)}</h3><ul class="pap-ul">${k.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`).join(''), G.kit?.length)}
    ${sec('time_standards', 'clock', 'เกณฑ์เวลา', has(G.time_standards) && `<table class="pap-tb"><tbody>${G.time_standards.map((x) => `<tr><th>${esc(x.what)}</th><td>${esc(x.target)}${pg(x.p)}</td></tr>`).join('')}</tbody></table>`)}
    ${sec('drill_rules', 'cal', 'การเตรียมการและการซ้อม', has(G.drill_rules) && list(G.drill_rules), G.drill_rules?.length)}
    ${sec('alarm_check', 'radio', 'การตรวจสอบระบบแจ้งข่าว', has(G.alarm_check) && list(G.alarm_check))}
    ${sec('alarm_form', 'doc', 'แบบรับ/แจ้งข่าว (กรอกแล้วคัดลอก)', has(G.alarm_form) && alarmForm(G.alarm_form, esc, icon))}
    ${sec('reports', 'doc', 'รายงานขั้นต้น', (has(G.initial_report_fields) || has(G.incident_report_fields)) && `
        ${has(G.initial_report_fields) ? `<h3 class="pap-sh">รายงานอุบัติเหตุขั้นต้น</h3><ol class="pap-num">${G.initial_report_fields.map((x) => `<li>${esc(x.label)}</li>`).join('')}</ol>` : ''}
        ${has(G.incident_report_fields) ? `<h3 class="pap-sh">รายงานอุบัติการณ์ขั้นต้น</h3><ol class="pap-num">${G.incident_report_fields.map((x) => `<li>${esc(x.label)}</li>`).join('')}</ol>` : ''}`)}
    ${sec('definitions', 'info', 'นิยามศัพท์', has(G.definitions) && `<dl class="pap-dl">${G.definitions.map((x) => `<dt>${esc(x.term)}</dt><dd>${esc(x.def)}${pg(x.p)}</dd>`).join('')}</dl>`, G.definitions?.length)}
    <p class="rg-src">${esc(G.title || '')}${G.issued ? ` · ${esc(G.issued)}` : ''} · คู่มือนี้ย่อจากระเบียบ ถ้าต่างกันให้ถือระเบียบฉบับจริง</p>`;

  box.addEventListener('click', (e) => {
    const j = e.target.closest('[data-jump]');
    if (j) {
      e.preventDefault();
      const d = document.getElementById(j.dataset.jump);
      d.open = true; d.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    if (e.target.closest('#af-copy')) copyForm(box, e.target.closest('#af-copy'));
    if (e.target.closest('#af-clear')) box.querySelectorAll('[data-af]').forEach((i) => { i.value = ''; });
  });
}

// สีเสื้อ/ป้ายจากข้อความไทย (ไม่รู้จัก = เทา)
function vestColor(s) {
  const t = String(s);
  const map = [['แดง', '#e5484d'], ['เหลือง', '#f5c400'], ['เขียว', '#30a46c'], ['ฟ้า', '#3fa9f5'], ['น้ำเงิน', '#2f5bd3'],
    ['ส้ม', '#f76b15'], ['ขาว', '#f2f2f2'], ['ดำ', '#222'], ['ม่วง', '#8e4ec6'], ['ชมพู', '#e93d82'], ['เทา', '#8b8d98']];
  return (map.find(([k]) => t.includes(k)) || [0, '#8b8d98'])[1];
}

function alarmForm(F, esc, icon) {
  const now = new Date();
  const inp = (f) => {
    const a = `data-af="${esc(f.key)}" id="af-${esc(f.key)}"`;
    if (f.type === 'textarea') return `<textarea ${a} rows="2"></textarea>`;
    if (f.type === 'choice' && f.options?.length) return `<select ${a}><option value=""></option>${f.options.map((o) => `<option>${esc(o)}</option>`).join('')}</select>`;
    const t = { time: 'time', date: 'date', number: 'number' }[f.type] || 'text';
    const v = t === 'time' ? now.toTimeString().slice(0, 5) : '';
    return `<input ${a} type="${t}"${v ? ` value="${v}"` : ''} autocomplete="off">`;
  };
  return `<form class="pap-form" onsubmit="return false">
      ${F.map((f) => `<label for="af-${esc(f.key)}"><span>${esc(f.label)}</span>${inp(f)}</label>`).join('')}
      <div class="pap-fb"><button class="btn" type="button" id="af-copy">${icon('doc')}<span>คัดลอกเป็นข้อความ</span></button>
        <button class="btn ghost" type="button" id="af-clear"><span>ล้าง</span></button></div>
      <p class="pap-note">ข้อความที่กรอกอยู่ในเครื่องนี้เท่านั้น ไม่ถูกส่งไปที่ใด</p></form>`;
}
function copyForm(box, btn) {
  const rows = [...box.querySelectorAll('.pap-form label')].map((l) => {
    const v = l.querySelector('[data-af]').value.trim();
    return v ? `${l.querySelector('span').textContent}: ${v}` : '';
  }).filter(Boolean);
  const txt = ['แจ้งข่าวอากาศยานเกิดเหตุ', ...rows].join('\n');
  const done = () => { const s = btn.querySelector('span'); const o = s.textContent; s.textContent = 'คัดลอกแล้ว'; setTimeout(() => { s.textContent = o; }, 1600); };
  navigator.clipboard?.writeText(txt).then(done, () => prompt('คัดลอกข้อความนี้', txt));
}

/* ── ทะเบียนการซ้อม ─────────────────────────────────────── */

function grid(D) {
  const fys = [...new Set(D.map((d) => fyOf(d.date)?.fy).filter(Boolean))].sort();
  const cell = {};
  for (const d of D) {
    const f = fyOf(d.date);
    if (!f) continue;
    const c = (cell[`${f.fy}-${f.mi}`] ??= { held: 0, out: 0, plan: 0, tt: 0 });
    if (counts(d)) { c.held++; if (d.loc === 'out') c.out++; }
    else if (d.kind === 'tabletop' && d.status === 'held') c.tt++;
    else if (d.status !== 'held') c.plan++;
  }
  return { fys, cell };
}

function drills(box, P, H) {
  const { esc, icon } = H;
  const D = P.drills;
  const { fys, cell } = grid(D);
  const today = fyOf(new Date(Date.now() + 25200000).toISOString().replace(/^(\d{4})/, (y) => +y + 543));
  const future = (fy, mi) => today && (fy > today.fy || (fy === today.fy && mi > today.mi));
  const rows = fys.slice().reverse().map((fy) => {
    let inOk = 0, out = 0, past = 0;
    const tds = MONTHS.map((m, mi) => {
      const c = cell[`${fy}-${mi}`];
      if (!future(fy, mi)) past++;
      if (c?.held) inOk++;
      out += c?.out || 0;
      const cls = c?.held ? 'ok' : c?.tt ? 'tt' : c?.plan ? 'pl' : future(fy, mi) ? 'fu' : 'no';
      const t = c ? [c.held && `ซ้อม ${c.held}`, c.out && `นอกเขต ${c.out}`, c.tt && `บนโต๊ะ ${c.tt}`, c.plan && `ตามแผน/เลื่อน ${c.plan}`].filter(Boolean).join(' · ') : 'ไม่พบบันทึก';
      return `<td class="${cls}"><button data-cell="${fy}-${mi}" title="${m} ${String(fy).slice(2)}: ${t}" aria-label="${m} ปีงบ ${String(fy).slice(2)}: ${t}">${c?.held || ''}${c?.out ? '<i></i>' : ''}</button></td>`;
    }).join('');
    return `<tr><th scope="row">${String(fy).slice(2)}</th>${tds}<td class="sum${inOk >= past ? ' good' : ''}">${inOk}/${past}</td><td class="sum${out ? ' good' : ''}">${out ? icon('check') : '–'}</td></tr>`;
  }).join('');

  box.innerHTML = `
    <p class="rg-lede">รวบรวมจากแฟ้มงานของ FSO รุ่นก่อน ปีงบ ${String(fys[0]).slice(2)}–${String(fys.at(-1)).slice(2)} รวม ${D.length} รายการ · ช่องว่าง = ไม่พบเอกสาร ไม่ได้แปลว่าไม่ได้ซ้อม</p>
    <section class="pap-grid-w" aria-labelledby="pap-g-h">
      <h2 class="sec-h" id="pap-g-h">ตารางการซ้อมรายเดือน <span>เกณฑ์ ซ้อมในเขตเดือนละครั้ง นอกเขตปีละครั้ง</span></h2>
      <div class="pap-gscroll"><table class="pap-grid">
        <thead><tr><th>ปีงบ</th>${MONTHS.map((m) => `<th>${m}</th>`).join('')}<th>ครบเดือน</th><th>นอกเขต</th></tr></thead>
        <tbody>${rows}</tbody></table></div>
      <p class="pap-leg"><span class="ok"></span>ซ้อมแล้ว (ตัวเลข = ครั้ง) <span class="o"></span>มีนอกเขต <span class="tt"></span>ซ้อมบนโต๊ะ <span class="pl"></span>มีแค่แผน/เลื่อน <span class="no"></span>ไม่พบบันทึก</p>
    </section>
    <form class="h-q" role="search" onsubmit="return false"><label>${icon('search')}<input type="search" id="pap-q" placeholder="ค้นเครื่อง ฝูง สถานการณ์ ข้อบกพร่อง" value="${esc(st.q)}" autocomplete="off" aria-label="ค้นการซ้อม"></label></form>
    <div class="chips pap-fy"><button class="chip" data-fy="" aria-pressed="${!st.fy}">ทุกปี</button>${fys.slice().reverse().map((fy) => `<button class="chip" data-fy="${fy}" aria-pressed="${st.fy === String(fy)}">ปีงบ ${String(fy).slice(2)}</button>`).join('')}</div>
    <div id="pap-list"></div>`;

  const listEl = box.querySelector('#pap-list');
  const draw = () => {
    const qs = st.q.trim().toLowerCase();
    const L = D.filter((d) => (!st.fy || String(fyOf(d.date)?.fy) === st.fy)
      && (!st.cell || `${fyOf(d.date)?.fy}-${fyOf(d.date)?.mi}` === st.cell)
      && (!qs || [d.ac, d.sqn, d.scenario, d.place, ...(d.units || []), ...(d.findings || []), d.note].join(' ').toLowerCase().includes(qs)))
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    listEl.innerHTML = `${st.cell ? `<p class="rg-note">${icon('cal')}เฉพาะ ${MONTHS[+st.cell.split('-')[1]]} ปีงบ ${st.cell.slice(2, 4)} <button class="btn ghost sm" data-cell="">ดูทั้งหมด</button></p>` : ''}
      <h2 class="sec-h">รายการ <span>${L.length} รายการ</span></h2>
      <ul class="pap-dl-list">${L.map((d) => drillCard(d, esc, icon)).join('') || `<li class="empty">${icon('search')}<h2>ไม่พบรายการ</h2></li>`}</ul>`;
  };
  draw();
  // รูปซ้อมที่เข้ารหัส: ถอดเมื่อเปิดการ์ดเท่านั้น ไม่โหลดทุกไฟล์ตอนวาดรายการ
  listEl.addEventListener('toggle', (e) => { if (e.target.open) H.hydrateImgs?.(e.target); }, true);
  box.addEventListener('click', (e) => {
    const f = e.target.closest('[data-fy]');
    if (f) { st.fy = f.dataset.fy; st.cell = ''; box.querySelectorAll('[data-fy]').forEach((b) => b.setAttribute('aria-pressed', String(b === f))); draw(); return; }
    const c = e.target.closest('[data-cell]');
    if (c) { st.cell = st.cell === c.dataset.cell ? '' : c.dataset.cell; if (st.cell) { st.fy = ''; box.querySelectorAll('[data-fy]').forEach((b) => b.setAttribute('aria-pressed', String(!b.dataset.fy))); } draw(); listEl.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });
  box.querySelector('#pap-q').addEventListener('input', (e) => { st.q = e.target.value; draw(); });
}

function drillCard(d, esc, icon) {
  const tags = [
    d.kind && `<span class="k-${d.kind}">${KIND[d.kind] || d.kind}</span>`,
    d.status && d.status !== 'held' && `<span class="s-${d.status}">${STATUS[d.status]}</span>`,
    d.loc && `<span class="l-${d.loc}">${LOC[d.loc]}</span>`,
    d.ac && `<span>${esc(d.ac)}</span>`, d.sqn && `<span>${esc(d.sqn)}</span>`,
    d.img?.length && `<span class="pap-ph">${icon('image')}ภาพ ${d.img.length}</span>`,
  ].filter(Boolean).join('');
  const more = (d.findings?.length || d.units?.length || d.casualties || d.note || d.img?.length);
  return `<li class="pap-dc"><details${more ? '' : ' class="flat"'}>
    <summary><span class="pap-dd"><b>${fmtDate(d.date)}</b>${d.time ? `<small>${esc(d.time)}</small>` : ''}</span>
      <span class="pap-db"><span class="pap-dt">${esc(d.scenario || 'ไม่ระบุสถานการณ์')}</span><span class="pap-tags">${tags}</span>
      ${d.place ? `<span class="pap-pl">${icon('pin')}${esc(d.place)}</span>` : ''}</span>
      ${more ? icon('down', 'ic pap-chev') : ''}</summary>
    ${more ? `<div class="pap-dx">
      ${d.casualties ? `<p><b>ผู้บาดเจ็บสมมติ</b> ${esc(d.casualties)}</p>` : ''}
      ${d.units?.length ? `<p><b>หน่วยที่ร่วม</b> ${d.units.map(esc).join(' · ')}</p>` : ''}
      ${d.findings?.length ? `<p><b>ข้อบกพร่อง/ข้อเสนอแนะ</b></p><ul>${d.findings.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
      ${d.note ? `<p class="pap-note">${esc(d.note)}</p>` : ''}
      ${d.img?.length ? `<div class="pap-imgs">${d.img.map((x) => {
        const at = x.dev ? `="data/papimg/${encodeURIComponent(x.f)}"` : '';
        return x.dev ? `<a href${at} target="_blank" rel="noopener"><img alt="ภาพการซ้อม" loading="lazy" src${at}></a>`
          : `<a data-ie="${esc(x.f)}" target="_blank" rel="noopener"><img alt="ภาพการซ้อม" data-ie="${esc(x.f)}"></a>`;
      }).join('')}</div>` : ''}
    </div>` : ''}</details></li>`;
}

/* ── วางแผนซ้อม ─────────────────────────────────────────── */

// สถานการณ์ซ้อม {name, kw[]} — จับคำค้นกับชื่อสถานการณ์และหมายเหตุในทะเบียนการซ้อม
function scenarioHits(scn, D) {
  return D.filter((d) => counts(d) && (scn.kw || []).some((w) => `${d.scenario} ${d.note || ''}`.includes(w)));
}

function plan(box, P, { esc, icon }) {
  const D = P.drills;
  const G = P.guide;
  const { fys, cell } = grid(D);
  const fy = fys.at(-1);
  const miss = MONTHS.filter((_, mi) => !cell[`${fy}-${mi}`]?.held);
  const outLast = D.filter((d) => counts(d) && d.loc === 'out').sort((a, b) => b.date.localeCompare(a.date))[0];
  const acs = {};
  for (const d of D.filter(counts)) for (const a of d.types || []) {
    if (!acs[a] || acs[a] < d.date) acs[a] = d.date;
  }
  const scn = (G.scenario_types || []).filter((s) => s.name).map((s) => { const h = scenarioHits(s, D); return { s: s.name, n: h.length, last: h.map((d) => d.date).sort().at(-1) }; })
    .sort((a, b) => a.n - b.n);
  const findings = D.flatMap((d) => (d.findings || []).map((f) => ({ f, date: d.date }))).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 12);

  box.innerHTML = `
    <p class="rg-lede">ช่วยเลือกสถานการณ์ซ้อมครั้งถัดไปจากสิ่งที่ยังซ้อมน้อย และเตรียมแบบบันทึกผลหลังซ้อม</p>
    <div class="pap-kpis">
      <div><small>ปีงบ ${String(fy).slice(2)} ยังไม่พบการซ้อม</small><b>${miss.length} เดือน</b><span>${miss.join(' ') || 'ครบ'}</span></div>
      <div><small>ซ้อมนอกเขตครั้งล่าสุด</small><b>${outLast ? fmtDate(outLast.date) : 'ไม่พบ'}</b><span>${outLast ? esc(outLast.place || outLast.scenario || '') : ''}</span></div>
    </div>
    ${scn.length ? `<section class="pap-sec2"><h2 class="sec-h">สถานการณ์ตามระเบียบ <span>เรียงจากซ้อมน้อยไปมาก</span></h2>
      <ul class="pap-scn">${scn.map((x) => `<li class="${x.n ? '' : 'zero'}"><span>${esc(x.s)}</span><b>${x.n ? `${x.n} ครั้ง` : 'ยังไม่พบ'}</b><small>${x.last ? `ล่าสุด ${fmtDate(x.last)}` : ''}</small></li>`).join('')}</ul>
      <p class="pap-note">นับจากคำในชื่อสถานการณ์ อาจคลาดเคลื่อน ใช้เป็นแนวทางเท่านั้น</p></section>` : ''}
    ${Object.keys(acs).length ? `<section class="pap-sec2"><h2 class="sec-h">แบบอากาศยานที่ใช้ซ้อม <span>ครั้งล่าสุด</span></h2>
      <ul class="pap-scn">${Object.entries(acs).sort((a, b) => a[1].localeCompare(b[1])).map(([a, d]) => `<li><span>${esc(a)}</span><b>${fmtDate(d)}</b></li>`).join('')}</ul></section>` : ''}
    ${findings.length ? `<section class="pap-sec2"><h2 class="sec-h">ข้อบกพร่องที่พบล่าสุด <span>ควรซ้อมซ้ำเพื่อตรวจว่าแก้แล้ว</span></h2>
      <ul class="pap-ul">${findings.map((x) => `<li>${esc(x.f)}<span class="pap-p">${fmtDate(x.date)}</span></li>`).join('')}</ul></section>` : ''}
    <section class="pap-sec2"><h2 class="sec-h">บันทึกผลหลังซ้อม (AAR)</h2>${alarmForm(AAR, esc, icon).replace('แจ้งข่าว', 'ผลการซ้อม')}</section>`;
  box.addEventListener('click', (e) => {
    const b = e.target.closest('#af-copy');
    if (b) copyForm(box, b);
    if (e.target.closest('#af-clear')) box.querySelectorAll('[data-af]').forEach((i) => { i.value = ''; });
  });
}

const AAR = [
  { key: 'date', label: 'วันที่ซ้อม', type: 'date' },
  { key: 'time', label: 'เวลาเริ่ม', type: 'time' },
  { key: 'loc', label: 'พื้นที่', type: 'choice', options: ['ในเขตสนามบิน', 'นอกเขตสนามบิน', 'ซ้อมบนโต๊ะ'] },
  { key: 'ac', label: 'อากาศยาน / ฝูง', type: 'text' },
  { key: 'scenario', label: 'สถานการณ์', type: 'textarea' },
  { key: 't_alarm', label: 'เวลาแจ้งข่าว', type: 'time' },
  { key: 't_crash', label: 'เวลา Crash Crew ถึงที่เกิดเหตุ', type: 'time' },
  { key: 't_med', label: 'เวลาชุดแพทย์ถึงที่เกิดเหตุ', type: 'time' },
  { key: 't_end', label: 'เวลาจบการซ้อม', type: 'time' },
  { key: 'units', label: 'หน่วยที่ร่วม', type: 'textarea' },
  { key: 'good', label: 'สิ่งที่ทำได้ดี', type: 'textarea' },
  { key: 'bad', label: 'ข้อบกพร่อง', type: 'textarea' },
  { key: 'fix', label: 'การแก้ไขและผู้รับผิดชอบ (ระบุตำแหน่ง ไม่ระบุชื่อ)', type: 'textarea' },
];
