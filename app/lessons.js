// บทเรียนทฤษฎีนิรภัย — คำอธิบายภาษาไทยเรียบเรียงเอง · ข้อความต้นฉบับภาษาอังกฤษยกมาคำต่อคำพร้อมเลขหน้า
// เฉพาะจากเอกสารของรัฐบาลสหรัฐฯ (FAA NTSB DoD — เป็นสาธารณสมบัติ) ส่วนแหล่งอื่น (SKYbrary งานวิจัยในวารสาร) เล่าความเท่านั้น
// (DECISIONS.md หัวข้อ "ทฤษฎีนิรภัย": ใช้เฉพาะเอกสารเผยแพร่สาธารณะ ห้ามใช้เอกสารจำกัดการเผยแพร่ใน Resources/)
//
// ชนิดสไลด์ (theory.js วาด):
//   title   { h, sub, stat? }                       หน้าเปิดบท
//   points  { h, items: [{ b, t }] }                หัวข้อพร้อมคำอธิบาย
//   compare { h, a: { h, items }, b: { h, items } } สองฝั่งเทียบกัน
//   cards   { h, cap?, flip?, items: [{ b, s?, t }] } การ์ด (flip = แตะเพื่อพลิกดูด้านหลัง)
//   widget  { w, h, cap }                           ภาพโต้ตอบ: swiss hfacs shell tem matrix imsafe gradient sa3 decide attitude leans awake
//   quiz    { q, opts, a, why }                     คำถามหนึ่งข้อ แตะคำตอบแล้วเฉลย
//   brief   { h, items }                            นำไปใช้ในบรีฟ
//   quote   { h?, qs: [{ q, th?, src }], note? }    ข้อความต้นฉบับภาษาอังกฤษ ไม่แปล + เลขหน้า
//   chart   { kind: 'hbar'|'clock', h, cap?, src, series?, rows, unit?, max? }
//   stats   { h, items: [{ n, t, q?, src }], cap? }
// src = S(เอกสาร, เลขหน้าที่พิมพ์) · refs: { t, u, n? } (n = หมายเหตุ เช่น "เล่าความ ไม่ยกคำพูด")
// หน้าจบบท (สรุป take + refs + บทถัดไป) theory.js สร้างให้เอง

// เอกสารต้นฉบับ · at(เลขหน้าที่พิมพ์) = ลำดับหน้าใน PDF (ตรวจกับไฟล์จริงแล้ว) · ป้ายที่แสดงใช้เลขหน้าที่พิมพ์
const DOC = {
  phak:  { t: 'FAA PHAK (FAA-H-8083-25C)', u: 'https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/faa-h-8083-25c.pdf', at: (p) => { const [c, n] = p.split('-').map(Number); return ({ 2: 39, 17: 422 })[c] + n; } }, // บทที่ 2 และ 17
  amtg:  { t: 'FAA AMT Handbook–General (FAA-H-8083-30B)', u: 'https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/amtg_handbook.pdf', at: (p) => 623 + +p.split('-')[1] }, // บทที่ 14
  rmh:   { t: 'FAA Risk Management Handbook (FAA-H-8083-2A)', u: 'https://www.faa.gov/sites/faa.gov/files/2022-06/risk_management_handbook_2A.pdf', at: (p) => p === 'ii' ? 4 : ({ 1: 9, 2: 12, 3: 18, 4: 33, 5: 38, 6: 43, 7: 49, 8: 53 })[p.split('-')[0]] + +p.split('-')[1] },
  ac51e: { t: 'FAA AC 120-51E (2004)', u: 'https://www.faa.gov/documentLibrary/media/Advisory_Circular/AC120-51e.pdf', at: (p) => +p },
  ac51ea1:{ t: 'FAA AC 120-51E (2004) Appendix 1', u: 'https://www.faa.gov/documentLibrary/media/Advisory_Circular/AC120-51e.pdf', at: (p) => 16 + +p },
  ac90:  { t: 'FAA AC 120-90 (2006)', u: 'https://www.faa.gov/documentLibrary/media/Advisory_Circular/AC_120-90.pdf', at: (p) => +p },
  ac90a1:{ t: 'FAA AC 120-90 (2006) Appendix 1', u: 'https://www.faa.gov/documentLibrary/media/Advisory_Circular/AC_120-90.pdf', at: (p) => 16 + +p },
  am0007:{ t: 'Shappell & Wiegmann 2000, DOT/FAA/AM-00/7', u: 'https://www.faa.gov/sites/faa.gov/files/data_research/research/med_humanfacs/oamtechreports/00_07.pdf', at: (p) => +p + 4 },
  am0103:{ t: 'Wiegmann & Shappell 2001, DOT/FAA/AM-01/3', u: 'https://www.faa.gov/sites/faa.gov/files/data_research/research/med_humanfacs/oamtechreports/0103.pdf', at: (p) => +p + 6 },
  am0618:{ t: 'Shappell et al. 2006, DOT/FAA/AM-06/18', u: 'https://www.faa.gov/sites/faa.gov/files/data_research/research/med_humanfacs/oamtechreports/200618.pdf', at: (p) => +p + 4 },
  ac120: { t: 'FAA AC 120-100 (2010)', u: 'https://www.faa.gov/documentLibrary/media/Advisory_Circular/AC%20120-100.pdf', at: (p) => +p },
  ac604: { t: 'FAA AC 60-4A (1983)', u: 'https://www.faa.gov/sites/faa.gov/files/2022-11/AC60-4A.pdf', at: (p) => +p },
  sdbro: { t: 'FAA — Spatial Disorientation (GA Safety Enhancement Topic)', u: 'https://www.faa.gov/sites/faa.gov/files/2022-01/Spatial%20Disorientation.pdf', at: (p) => +p },
  ntsb94:{ t: 'NTSB Safety Rec. A-94-1 to -5', u: 'https://www.ntsb.gov/safety/safety-recs/recletters/A94_1_5.pdf', at: (p) => +p },
  dod8:  { t: 'DoD HFACS 8.0', u: 'https://www.safety.af.mil/Portals/71/documents/Human%20Factors/DoD%20HFACS%208.0%20Guide%20-%2020230927%20Corrected%20sm.pdf', at: (p) => +p + 1 },
};
const S = (d, p) => ({ t: DOC[d].t, p, u: `${DOC[d].u}#page=${DOC[d].at(p)}` });

export const LESSONS = [
  {
    id: 'swiss',
    short: 'สวิสชีส',
    title: 'แบบจำลองสวิสชีส',
    icon: 'cheese',
    color: 'gold',
    mins: 10,
    tip: 'อุบัติเหตุไม่ได้เกิดจากความผิดพลาดเดียว แต่เกิดเมื่อรูของหลายชั้นป้องกันเรียงตรงกันพอดี',
    take: [
      'อุบัติเหตุเกิดเมื่อชั้นป้องกันหลายชั้นมีรูตรงกันในเวลาเดียวกัน',
      'รูหน้างาน (active failure) เห็นง่าย ส่วนรูแฝง (latent condition) อยู่ได้นานเป็นปี',
      'อุดรูได้ชั้นเดียวก็ตัดเส้นทางของอันตรายได้ — หาคนผิดคนเดียวไม่ได้อุดรูแฝง',
    ],
    refs: [
      { t: 'FAA AMT Handbook–General (FAA-H-8083-30B) หน้า 14-12 Swiss cheese model', u: `${DOC.amtg.u}#page=635` },
      { t: 'FAA AC 120-51E (2004) หน้า 14 Monitoring and cross-checking', u: `${DOC.ac51e.u}#page=14` },
      { t: 'SKYbrary — James Reason HF Model', u: 'https://skybrary.aero/articles/james-reason-hf-model', n: 'เล่าความ ไม่ยกคำพูด' },
      { t: 'Reason, J. (1990) The contribution of latent human failures to the breakdown of complex systems', u: 'https://doi.org/10.1098/rstb.1990.0090', n: 'เล่าความ ไม่ยกคำพูด' },
    ],
    slides: [
      {
        t: 'title',
        h: 'อุบัติเหตุไม่ได้มีสาเหตุเดียว',
        sub: 'แบบจำลองนี้ (เสนอในปี 1990) มองระบบการบินเป็นชั้นป้องกันหลายชั้นซ้อนกัน แต่ละชั้นมีรูเหมือนแผ่นชีส อันตรายจะทะลุถึงเครื่องบินได้ก็ต่อเมื่อรูทุกชั้นเรียงตรงกัน',
      },
      {
        t: 'quote',
        h: 'FAA อธิบายแบบจำลองนี้',
        qs: [
          { q: '…is often referred to as the Swiss cheese model and shows how various “holes” in different systems must be aligned in order for an error to occur. Only when the holes are all aligned can the incident take place.', th: 'รูของหลายระบบต้องเรียงตรงกัน เหตุจึงเกิดได้', src: S('amtg', '14-12') },
          { q: 'An in-depth review of an aviation incident reveals time and again that a series of human errors (known also as a chain of events) was allowed to build until the accident occurred.', th: 'เหตุแต่ละครั้งคือความผิดพลาดหลายอย่างที่ปล่อยให้ต่อกันเป็นลูกโซ่', src: S('amtg', '14-29') },
        ],
      },
      {
        t: 'widget', w: 'swiss',
        h: 'ลองอุดรูดู',
        cap: 'แตะแผ่นชีสแผ่นใดก็ได้เพื่ออุดรู — อุดชั้นเดียว เส้นทางของอันตรายก็ถูกตัด',
      },
      {
        t: 'compare',
        h: 'รูมีสองชนิด',
        a: {
          h: 'รูหน้างาน (Active failure)',
          items: [
            'การกระทำที่ไม่ปลอดภัยของคนที่อยู่ใกล้เครื่องที่สุด เช่น นักบิน ช่าง ผู้ควบคุมการบิน',
            'ผลเกิดเกือบทันที จึงเห็นง่ายและมักถูกโทษก่อน',
          ],
        },
        b: {
          h: 'รูแฝง (Latent condition)',
          items: [
            'มาจากการตัดสินใจที่อยู่ไกลจากหน้างาน เช่น การออกแบบ ระเบียบ งบประมาณ ตารางงาน',
            'อยู่เงียบ ๆ ได้นานเป็นปี จนวันหนึ่งไปเจอรูหน้างานพอดี',
          ],
        },
      },
      {
        t: 'quote',
        h: 'ตัวอย่างจากงานซ่อม: แม่แรงตัวเดียวกัน สองชนิดรู',
        qs: [
          { q: 'An active failure is one in which the effects are immediate. … An example of this type would be an aircraft slipping off one of the lifting jacks due to improper placement by the technician.', th: 'รูหน้างาน: ผลเกิดทันที เช่น ช่างตั้งแม่แรงผิดตำแหน่ง เครื่องไถลตกจากแม่แรง', src: S('amtg', '14-12') },
          { q: 'A latent failure occurs as a result of a decision or action made long before the incident or accident actually occurs. The consequences of such a decision may remain dormant for a long time. … it could be an unapproved jack being used because funding had not been approved to purchase the correct ground support equipment (GSE).', th: 'รูแฝง: งบซื้อแม่แรงที่ถูกแบบไม่ผ่าน จึงต้องใช้แม่แรงที่ไม่ได้รับรอง', src: S('amtg', '14-12') },
        ],
      },
      {
        t: 'quote',
        h: 'เลี่ยงไม่ได้ แต่จัดการได้',
        qs: [
          { q: 'Training, risk assessments, safety inspections, etc., should not be restricted to an attempt to avoid errors but rather to make them visible and identify them before they produce damaging and regrettable consequences. Simply put, human error is not avoidable but it is manageable.', th: 'เป้าหมายคือทำให้ความผิดพลาดมองเห็นได้ก่อนเกิดผลเสีย', src: S('amtg', '14-13') },
          { q: 'If someone knowingly or intentionally chooses to do something wrong, it is a violation, which means that one has purposely deviated from safe practices, procedures, standards, or regulations.', th: 'รู้แล้วยังเลือกทำผิด คือการฝ่าฝืน (violation) ไม่ใช่ความผิดพลาด', src: S('amtg', '14-13') },
        ],
      },
      {
        t: 'stats',
        h: 'คนคือชั้นที่มีรูมากที่สุด',
        items: [
          { n: '75–80%', t: 'ของอุบัติเหตุการบินทั้งหมดเป็นผลจากความผิดพลาดของคน', q: 'A review of accident related data indicates that approximately 75–80 percent of all aviation accidents are the result of human error.', src: S('amtg', '14-1') },
          { n: '≈12%', t: 'ของอุบัติเหตุกลุ่มนั้นเกี่ยวกับงานซ่อมบำรุง', q: 'Of those accidents, about 12 percent are maintenance related.', src: S('amtg', '14-1') },
          { n: '80 : 20', t: 'ปัจจัยมนุษย์ต่อเครื่องจักรขัดข้อง — สัดส่วนสาเหตุอุบัติเหตุในอดีต', q: 'Historically, twenty percent of all accidents are caused by a machine failure, and eighty percent by human factors.', src: S('amtg', '14-29') },
          { n: 'รูแฝง', t: 'ความผิดพลาดงานซ่อมมักแฝงและเห็นยากกว่าของนักบิน แต่ร้ายแรงไม่แพ้กัน', q: 'Although pilot/co-pilot errors tend to have immediate and highly visible effects, maintenance errors tend to be more latent and less obvious. However, they can be just as lethal.', src: S('amtg', '14-1') },
        ],
        cap: 'ตัวเลขจากคู่มือ FAA ไม่ใช่สถิติของ ทอ.',
      },
      {
        t: 'points',
        h: 'รูไม่อยู่นิ่ง',
        items: [
          { b: 'เปิด ปิด ขยับตลอดเวลา', t: 'ชั้นที่ปลอดภัยเมื่อวานอาจมีรูวันนี้ เช่น คนป่วย อากาศเปลี่ยน อุปกรณ์ค้างซ่อม' },
          { b: 'ชั้นป้องกันมีหลายแบบ', t: 'ระบบเตือนภัยของเครื่อง คนที่ตรวจสอบกันเอง ระเบียบและเช็กลิสต์ การฝึก' },
          { b: 'ป้องกันเชิงลึก', t: 'ไม่ฝากความปลอดภัยไว้ที่ชั้นเดียว ยิ่งงานเสี่ยงยิ่งต้องมีหลายชั้น' },
          { b: 'โทษคนไม่ได้อุดรูแฝง', t: 'ถ้าลงโทษคนหน้างานแล้วจบ รูแฝงยังอยู่ รอคนต่อไป' },
        ],
      },
      {
        t: 'quote',
        h: 'ตัดลูกโซ่ที่ชั้นไหนก็ได้',
        qs: [
          { q: 'Effective monitoring and cross-checking can be the last line of defense that prevents an accident because detecting an error or unsafe situation may break the chain of events leading to an accident.', th: 'การเฝ้าดูและตรวจทานกันอาจเป็นชั้นป้องกันสุดท้าย', src: S('ac51e', 14) },
          { q: 'If the chain of events is broken at the maintenance level, the likelihood of the accident occurring can be drastically decreased.', th: 'ตัดลูกโซ่ได้ตั้งแต่งานซ่อม โอกาสเกิดเหตุก็ลดลงมาก', src: S('amtg', '14-29') },
        ],
      },
      {
        t: 'quiz',
        q: 'งบประมาณถูกตัด ชั่วโมงบินฝึกกรณีฉุกเฉินลดลงครึ่งหนึ่ง ข้อนี้เป็นรูแบบใด',
        opts: ['รูหน้างาน (Active failure)', 'รูแฝง (Latent condition)', 'ไม่ใช่รูของชั้นป้องกัน'],
        a: 1,
        why: 'เป็นการตัดสินใจระดับองค์กรที่ไม่ได้ทำให้เกิดเหตุทันที แต่ทำให้ชั้น "การฝึก" บางลง รอวันที่เจอเหตุฉุกเฉินจริง',
      },
      {
        t: 'quiz',
        q: 'ช่างอ่านค่าแรงบิดจากการ์ดงาน แล้วกลับเลข 26 เป็น 62 โดยไม่ได้ตั้งใจ ข้อนี้คืออะไร',
        opts: ['ความผิดพลาด (Error)', 'การฝ่าฝืน (Violation)', 'รูแฝง (Latent condition)'],
        a: 0,
        why: 'ไม่ได้ตั้งใจจึงเป็นความผิดพลาด ไม่ใช่การฝ่าฝืน (FAA ยกตัวอย่างนี้ในหน้า 14-13) — ป้องกันด้วยการทำให้เห็นก่อนเกิดผล เช่น อ่านทวนหรือให้อีกคนตรวจ',
      },
      {
        t: 'brief',
        h: 'ใช้ในบรีฟวันนี้',
        items: [
          'ถามทีม: วันนี้ชั้นไหนบางกว่าปกติ — คนไม่ครบ อากาศ รายการซ่อมค้าง ตารางแน่น',
          'ถ้าบางมากกว่าหนึ่งชั้น ให้เพิ่มชั้นป้องกันหรือปรับภารกิจ',
          'เห็นรูแล้วรายงาน (hazard report) ก่อนมันจะเรียงตรงกัน',
        ],
      },
    ],
  },

  {
    id: 'hfacs',
    short: 'HFACS',
    title: 'HFACS ปัจจัยมนุษย์ 4 ระดับ',
    icon: 'layers',
    color: 'violet',
    mins: 10,
    tip: 'สืบสวนเหตุให้ย้อนจากการกระทำหน้างานขึ้นไปจนถึงองค์กร — ทุกระดับมีส่วน',
    take: [
      'HFACS ตั้งชื่อรูของแต่ละชั้นในสวิสชีส ไล่ 4 ระดับ: การกระทำ → สภาพก่อนเกิด → การกำกับดูแล → องค์กร',
      'ในข้อมูลอุบัติเหตุ ระดับกำกับดูแลและองค์กรถูกระบุน้อย — อาจเพราะการสืบสวนไม่ได้ขุดไปถึง ไม่ใช่เพราะไม่มีส่วน',
      'เจอการฝ่าฝืนเป็นประจำ ให้ถามต่อว่าใครปล่อยให้เกิด — แก้ระดับบนแล้วกันเหตุได้หลายแบบพร้อมกัน',
    ],
    refs: [
      { t: 'Shappell & Wiegmann 2000 — HFACS (DOT/FAA/AM-00/7)', u: DOC.am0007.u },
      { t: 'Wiegmann & Shappell 2001 — Commercial Aviation Accidents (DOT/FAA/AM-01/3)', u: DOC.am0103.u },
      { t: 'Shappell et al. 2006 — Fine-Grained Analysis Using HFACS (DOT/FAA/AM-06/18)', u: DOC.am0618.u },
      { t: 'DoD HFACS 8.0 (2022, ฉบับแก้ไข 2023)', u: DOC.dod8.u },
      { t: 'SKYbrary — HFACS', u: 'https://skybrary.aero/articles/human-factors-analysis-and-classification-system-hfacs', n: 'เล่าความ ไม่ยกคำพูด' },
    ],
    slides: [
      {
        t: 'title',
        h: 'เปลี่ยนสวิสชีสให้เป็นรายการตรวจ',
        sub: 'Shappell และ Wiegmann พัฒนา HFACS จากอุบัติเหตุของการบินทหารเรือสหรัฐฯ กว่า 300 เหตุ ให้แต่ละชั้นของสวิสชีสมีชื่อหมวดชัดเจน ใช้จัดหมวดสาเหตุจากรายงานอุบัติเหตุ แล้วดูว่าหน่วยพลาดซ้ำที่ไหน',
        stat: { n: '70–80%', t: 'ของอุบัติเหตุการบินมีความผิดพลาดของมนุษย์เป็นส่วนหนึ่ง (AM-00/7 หน้า 1)' },
      },
      {
        t: 'quote',
        h: 'ตัวเลขตั้งต้น',
        qs: [
          { q: 'In fact, estimates in the literature indicate that between 70 and 80 percent of aviation accidents can be attributed, at least in part, to human error (Shappell & Wiegmann, 1996).', th: 'อุบัติเหตุการบิน 70–80% มีความผิดพลาดของมนุษย์เป็นส่วนหนึ่ง', src: S('am0007', 1) },
          { q: 'Human error remains the leading cause of DoD mishaps.', th: 'ในกระทรวงกลาโหมสหรัฐฯ ความผิดพลาดของมนุษย์ยังเป็นสาเหตุอันดับหนึ่ง', src: S('dod8', 1) },
        ],
      },
      {
        t: 'quote',
        h: 'รูมีสองชนิด',
        qs: [
          { q: 'Represented as “holes” in the cheese, these active failures are typically the last unsafe acts committed by aircrew.', th: 'รูหน้างาน — การกระทำสุดท้ายก่อนเกิดเหตุ', src: S('am0007', 2) },
          { q: 'As their name suggests, latent failures, unlike their active counterparts, may lie dormant or undetected for hours, days, weeks, or even longer, until one day they adversely affect the unsuspecting aircrew.', th: 'รูแฝง — ซ่อนอยู่นานจนวันหนึ่งไปเจอลูกเรือที่ไม่ทันระวัง', src: S('am0007', 2) },
        ],
      },
      {
        t: 'widget', w: 'hfacs',
        h: '4 ระดับ จากหน้างานถึงองค์กร',
        cap: 'แตะแต่ละระดับเพื่อดูหมวดย่อย — 4 ระดับตาม AM-00/7 หน้า 3 · หมวดในแอปนี้ใช้ DoD HFACS 8.0',
      },
      {
        t: 'quote',
        h: 'ความผิดพลาด (Error) 3 แบบ',
        qs: [
          { q: '…these skill-based actions are particularly vulnerable to failures of attention and/or memory.', th: 'ทักษะ — พลาดเพราะความสนใจหลุดหรือลืม', src: S('am0007', 3) },
          { q: '…intentional behavior that proceeds as intended, yet the plan proves inadequate or inappropriate for the situation.', th: 'ตัดสินใจ — ทำตามแผน แต่แผนไม่เหมาะกับสถานการณ์', src: S('am0007', 4) },
          { q: 'Typically, perceptual errors occur when sensory input is degraded or “unusual,” as is the case with visual illusions and spatial disorientation or when aircrew simply misjudge the aircraft’s altitude, attitude, or airspeed', th: 'การรับรู้ — ประสาทสัมผัสได้ข้อมูลผิด เช่น ภาพลวง หลงสภาพการบิน', src: S('am0007', 5) },
        ],
        note: 'DoD HFACS 8.0 ไม่มีหมวด Perceptual Error แยก — หลงสภาพการบินลงรหัส PC321 (สภาพก่อนเกิด) ส่วนกะระยะ/ความเร็วผิดอยู่ใต้ AE207',
      },
      {
        t: 'compare',
        h: 'การกระทำที่ไม่ปลอดภัยมีสองแบบ',
        a: {
          h: 'ความผิดพลาด (Error)',
          items: [
            'ไม่ได้ตั้งใจ ทำตามที่คิดว่าถูก แต่ผลไม่เป็นอย่างที่ต้องการ',
            'พลาดที่ทักษะ (ลืมขั้นตอน คุมเครื่องไม่แม่น) หรือพลาดที่การตัดสินใจ (เลือกวิธีไม่เหมาะ)',
          ],
        },
        b: {
          h: 'ฝ่าฝืนโดยรู้ตัว (Known deviation)',
          items: [
            'รู้ว่ามีระเบียบ แต่เลือกทำต่างออกไป',
            'อันตรายคือเมื่อทำบ่อยจนกลายเป็น "ที่นี่ทำกันแบบนี้" และไม่มีใครทัก',
          ],
        },
      },
      {
        t: 'quote',
        h: 'การฝ่าฝืน 2 แบบ',
        qs: [
          { q: 'The first, routine violations, tend to be habitual by nature and often tolerated by governing authority (Reason, 1990).', th: 'ฝ่าฝืนเป็นประจำ — ทำจนเป็นนิสัย และผู้มีอำนาจมักปล่อยไว้', src: S('am0007', 6) },
          { q: 'Therefore, by definition, if a routine violation is identified, one must look further up the supervisory chain to identify those individuals in authority who are not enforcing the rules.', th: 'เจอแบบนี้ให้ไล่ขึ้นไปหาว่าใครไม่บังคับใช้ระเบียบ', src: S('am0007', 6) },
          { q: '…exceptional violations appear as isolated departures from authority, not necessarily indicative of individual’s typical behavior pattern nor condoned by management (Reason, 1990).', th: 'ฝ่าฝืนครั้งคราว — ไม่ใช่นิสัยปกติของคนนั้น และผู้บังคับบัญชาไม่ได้ยอมรับ', src: S('am0007', 6) },
        ],
      },
      {
        t: 'chart', kind: 'hbar',
        h: 'อุบัติเหตุการบินพาณิชย์สหรัฐฯ 1,020 เหตุ (1990–2002)',
        series: ['Air carrier (n=181)', 'Commuter (n=839)'],
        rows: [
          { g: 'Unsafe Acts of the Operator', l: 'Skill-based Errors', th: 'ทักษะ', v: [42.5, 59.5] },
          { g: 'Unsafe Acts of the Operator', l: 'Decision Errors', th: 'ตัดสินใจ', v: [39.2, 36.1] },
          { g: 'Unsafe Acts of the Operator', l: 'Violations', th: 'ฝ่าฝืน', v: [17.1, 24.4] },
          { g: 'Unsafe Acts of the Operator', l: 'Perceptual Errors', th: 'การรับรู้', v: [5.5, 6.7] },
          { g: 'Preconditions of Unsafe Acts', l: 'Physical Environment', th: 'สิ่งแวดล้อม', v: [37.0, 62.6] },
          { g: 'Preconditions of Unsafe Acts', l: 'Crew Resource Management', th: 'การทำงานเป็นทีม', v: [18.8, 8.9] },
          { g: 'Preconditions of Unsafe Acts', l: 'Adverse Mental States', th: 'สภาพจิตใจ', v: [3.3, 7.2] },
          { g: 'Unsafe Supervision', l: 'Inadequate Supervision', th: 'กำกับดูแลไม่พอ', v: [8.3, 2.5] },
          { g: 'Organizational Influences', l: 'Operational Process', th: 'กระบวนการทำงาน', v: [11.6, 3.5] },
        ],
        cap: '% ของอุบัติเหตุที่พบหมวดนั้น (เหตุหนึ่งมีได้หลายหมวด รวมจึงไม่เท่ากับ 100) · 9 จาก 19 หมวด',
        src: S('am0618', 7),
      },
      {
        t: 'quote',
        h: 'ทำไมระดับบนดูน้อย',
        qs: [
          { q: 'What is apparent from the data is that the majority of human causal factors identified in the database involved aircrew and their environment (i.e., unsafe acts of operators and preconditions for unsafe acts) rather than supervisory or organizational factors.', th: 'สาเหตุที่ถูกระบุส่วนใหญ่อยู่ที่ลูกเรือและสภาพแวดล้อม ไม่ใช่การกำกับดูแลหรือองค์กร', src: S('am0618', 7) },
          { q: 'Another explanation, however, is that these factors do contribute to most accidents, yet they are rarely identified using existing accident investigation processes.', th: 'อีกคำอธิบาย: ระดับบนมีส่วนในเหตุส่วนใหญ่ แต่กระบวนการสืบสวนไม่ค่อยหาเจอ', src: S('am0103', 10) },
        ],
      },
      {
        t: 'stats',
        h: 'ตัวเลขจากรายงาน FAA',
        items: [
          { n: '68%', t: 'ของอุบัติเหตุการบินพาณิชย์ในการศึกษา มีความผิดพลาดของลูกเรือหรือผู้กำกับดูแล', q: 'Sixty-eight percent of all commercial aviation accidents included in this study involved some form of aircrew or supervisory error.', src: S('am0618', 6) },
          { n: '16%', t: 'ของอุบัติเหตุที่เกี่ยวกับลูกเรือ ระบุว่าการกำกับดูแลหรือองค์กรมีส่วน', q: 'Indeed, only 16% of all aircrew-related accidents involved some form of either supervisory or organizational involvement.', src: S('am0103', 10) },
          { n: '6% → 46%', t: 'สัดส่วนอุบัติเหตุที่มีการฝ่าฝืน จากปี 1990 ถึง 1996', q: '…the relative proportion of accidents associated with violations increased appreciably from a low of 6% in 1990 to a high of 46% in 1996.', src: S('am0103', 9) },
          { n: '>80%', t: 'ของความล้มเหลวด้านการทำงานเป็นทีม (CRM) ในสายการบินขนาดเล็ก เกิดตอนก่อนบิน เช่น วางแผนและบรีฟ', q: '…over 80% of the CRM failures observed during commuter operations involved “preflight” activities (such as planning and briefing).', src: S('am0618', 8) },
        ],
      },
      {
        t: 'quiz',
        q: 'นักบินบินต่อเข้าเมฆทั้งที่ไม่ได้วางแผนบินด้วยเครื่องวัด และพบว่าหน่วยอนุมัติภารกิจแบบนี้เป็นประจำโดยไม่ประเมินความเสี่ยง — แก้ที่ระดับไหนแล้วจะกันเหตุซ้ำได้กว้างที่สุด',
        opts: ['การกระทำที่ไม่ปลอดภัย', 'สภาพก่อนเกิดเหตุ', 'การกำกับดูแล'],
        a: 2,
        why: 'การกระทำของนักบินคือรูสุดท้าย แต่การอนุมัติภารกิจโดยไม่ประเมินเป็นรูระดับการกำกับดูแล แก้ตรงนั้นแล้วกันได้ทุกลูกเรือ ไม่ใช่แค่คนเดียว',
      },
      {
        t: 'brief',
        h: 'ใช้ในบรีฟวันนี้',
        items: [
          'เล่าเคสให้ถามครบ 4 ระดับ ไม่หยุดที่ "นักบินพลาด"',
          'สภาพก่อนเกิดที่ตรวจเองได้ก่อนบิน: ความล้า ความเครียด การวางแผนและบรีฟร่วมกันในลูกเรือ',
          'เคสในแอปนี้ติดรหัส HFACS ไว้ — ดูหน้าภาพรวมว่าหน่วยเราซ้ำที่ระดับไหน',
        ],
      },
    ],
  },

  {
    id: 'shell',
    short: 'SHELL',
    title: 'แบบจำลอง SHELL',
    icon: 'shell',
    color: 'teal',
    mins: 8,
    tip: 'ปัญหามักเกิดที่รอยต่อระหว่างคนกับสิ่งรอบตัว ไม่ใช่ที่คนหรือเครื่องอย่างเดียว',
    take: [
      'คน (L) อยู่ตรงกลาง ล้อมด้วยซอฟต์แวร์ ฮาร์ดแวร์ สภาพแวดล้อม และคนอื่น',
      'อุบัติเหตุมักเกิดที่รอยต่อที่ไม่พอดีกัน',
      'ปรับระบบให้เข้ากับคน ง่ายกว่าปรับคนให้เข้ากับระบบ',
    ],
    refs: [
      { t: 'FAA AMT Handbook–General (FAA-H-8083-30B) หน้า 14-11 SHEL model', u: `${DOC.amtg.u}#page=634` },
      { t: 'SKYbrary — ICAO SHELL Model', u: 'https://skybrary.aero/articles/icao-shell-model', n: 'เล่าความ ไม่ยกคำพูด' },
    ],
    slides: [
      {
        t: 'title',
        h: 'คนอยู่ตรงกลาง ปัญหาอยู่ที่รอยต่อ',
        sub: 'แนวคิดเสนอในปี 1972 และปรับเป็นภาพบล็อกในปี 1975 ขอบของแต่ละบล็อกไม่เรียบ ต้องจับคู่ให้พอดีกับคนที่อยู่ตรงกลาง ถ้าไม่พอดีคือจุดที่ความผิดพลาดเกิด',
      },
      {
        t: 'quote',
        h: 'ไม่ใช่แค่ "อะไร" แต่ "ตรงไหน และทำไม"',
        qs: [
          { q: 'The “SHEL” model is another concept for investigating and evaluating maintenance errors. … As with other human factors tools, its goal is to determine not only what the problem is, but where and why it exists.', th: 'SHEL ใช้วิเคราะห์ความผิดพลาด — หาว่าปัญหาคืออะไร อยู่ตรงไหน และเกิดเพราะอะไร', src: S('amtg', '14-11') },
          { q: 'The model examines interaction with each of the four SHEL components, and does not consider interactions not involving human factors.', th: 'ดูเฉพาะรอยต่อที่มีคนเกี่ยวข้อง', src: S('amtg', '14-12') },
        ],
        note: 'FAA เขียน SHEL ส่วน ICAO เขียน SHELL (L ตัวกลางคือตัวเรา L ตัวท้ายคือคนอื่น) — องค์ประกอบชุดเดียวกัน',
      },
      {
        t: 'widget', w: 'shell',
        h: 'แตะรอยต่อทั้ง 4',
        cap: 'L = คน (Liveware) · S = ซอฟต์แวร์ · H = ฮาร์ดแวร์ · E = สภาพแวดล้อม',
      },
      {
        t: 'quote',
        h: 'S และ H',
        qs: [
          { q: 'The term “software” is not referring to the common use of the term as applied to computer programs. Instead it includes a broader view of manual layout, checklist layout, symbology, language (both technical and nontechnical), and computer programs.', th: 'S ไม่ใช่แค่โปรแกรม — รวมการจัดหน้าคู่มือ เช็กลิสต์ สัญลักษณ์ และภาษา', src: S('amtg', '14-12') },
          { q: 'Hardware includes such things as the location of components, the accessibility of components and tooling.', th: 'H คือตำแหน่งอุปกรณ์ การเข้าถึง และเครื่องมือ', src: S('amtg', '14-12') },
        ],
      },
      {
        t: 'quote',
        h: 'E และ L',
        qs: [
          { q: 'Environment takes temperature, humidity, sound, light, and time of day factors into account.', th: 'E คืออุณหภูมิ ความชื้น เสียง แสง และช่วงเวลาของวัน', src: S('amtg', '14-12') },
          { q: 'Liveware relates technician interaction with other people, both on the job and off. These include managers, peers, family, friends, and self.', th: 'L คือคนรอบตัวทั้งในและนอกงาน — ผู้บังคับบัญชา เพื่อน ครอบครัว และตัวเราเอง', src: S('amtg', '14-12') },
        ],
      },
      {
        t: 'points',
        h: 'ใช้ SHELL ตอนไหน',
        items: [
          { b: 'วิเคราะห์เหตุ', t: 'ถามทีละรอยต่อว่าตรงไหนไม่พอดี จะเจอสาเหตุที่มองข้ามง่าย' },
          { b: 'รับของใหม่', t: 'เครื่องแบบใหม่ อุปกรณ์ใหม่ ระเบียบใหม่ — เช็กว่าเข้ากับคนที่ใช้จริงไหม' },
          { b: 'แก้ที่ระบบก่อน', t: 'คนเปลี่ยนได้ยากกว่าเครื่องหรือเอกสาร ปรับระบบให้เข้ากับคน' },
        ],
      },
      {
        t: 'quiz',
        q: 'ไฟเตือนระบบขัดข้องเป็นสีเดียวกับไฟแสดงสถานะปกติที่อยู่ข้างกัน ลูกเรือจึงมองข้าม — เป็นปัญหาที่รอยต่อไหน',
        opts: ['L–H คนกับเครื่อง', 'L–S คนกับระเบียบ', 'L–E คนกับสภาพแวดล้อม', 'L–L คนกับคน'],
        a: 0,
        why: 'ไฟเตือนคือฮาร์ดแวร์ที่ออกแบบไม่เข้ากับการมองเห็นของคน — แก้ได้ที่การออกแบบหรือการติดตั้ง ไม่ใช่สั่งให้คนระวังมากขึ้นอย่างเดียว',
      },
      {
        t: 'quiz',
        q: 'เช็กลิสต์ฉบับใหม่จัดหน้าแน่น ตัวเล็ก ขั้นตอนสำคัญไปอยู่ท้ายหน้า ลูกเรือข้ามไปหนึ่งข้อ — เป็นปัญหาที่รอยต่อไหน',
        opts: ['L–H คนกับเครื่อง', 'L–S คนกับระเบียบ', 'L–E คนกับสภาพแวดล้อม', 'L–L คนกับคน'],
        a: 1,
        why: 'เช็กลิสต์คือ "ซอฟต์แวร์" ใน SHELL — FAA นับรวมการจัดหน้าเช็กลิสต์และคู่มือด้วย (หน้า 14-12) แก้ที่การจัดหน้า ไม่ใช่สั่งให้อ่านละเอียดขึ้นอย่างเดียว',
      },
      {
        t: 'brief',
        h: 'ก่อนบิน เช็ก 4 รอยต่อ',
        items: [
          'H — ลำนี้ต่างจากลำที่คุ้นไหม อุปกรณ์อะไรค้างซ่อม',
          'S — ระเบียบ NOTAM แผนที่ เป็นฉบับล่าสุดหรือยัง',
          'E — อากาศ แสง ความร้อน ฝุ่น และชั่วโมงทำงานของวันนี้',
          'L — ใครทำหน้าที่อะไร และใครพูดเมื่อเห็นต่าง',
        ],
      },
    ],
  },

  {
    id: 'tem',
    short: 'TEM',
    title: 'การจัดการภัยคุกคามและความผิดพลาด',
    icon: 'warn',
    color: 'rose',
    mins: 11,
    tip: 'ภัยคุกคามมีทุกเที่ยวบิน — สิ่งที่ตัดสินผลคือทีมจับและจัดการได้ทันหรือไม่',
    take: [
      'ภัยคุกคามและความผิดพลาดเกิดได้ทุกเที่ยวบิน เป้าหมายคือจับให้ได้และจัดการให้ทัน',
      'เส้นทาง: ภัยคุกคาม → ความผิดพลาด → สภาพเครื่องที่ไม่ต้องการ → เหตุ',
      'เครื่องเข้าสภาพที่ไม่ต้องการแล้ว ให้กู้เครื่องก่อน ค่อยแก้ความผิดพลาด',
    ],
    refs: [
      { t: 'FAA AC 120-90 (2006) Line Operations Safety Audits', u: DOC.ac90.u },
      { t: 'FAA AC 120-90 (2006) Appendix 1 — Threat and Error Management', u: `${DOC.ac90.u}#page=17` },
      { t: 'Maurino, D. — Threat and Error Management (TEM), ICAO', u: 'https://www.skybrary.aero/sites/default/files/bookshelf/515.pdf', n: 'เล่าความ ไม่ยกคำพูด' },
      { t: 'SKYbrary — Threat and Error Management (TEM) in Flight Operations', u: 'https://skybrary.aero/articles/threat-and-error-management-tem-flight-operations', n: 'เล่าความ ไม่ยกคำพูด' },
    ],
    slides: [
      {
        t: 'title',
        h: 'ภัยมีทุกเที่ยวบิน จัดการให้ทันก่อนเป็นเหตุ',
        sub: 'TEM ไม่ได้ถามว่าใครผิด แต่ถามว่าทีมจับภัยคุกคามและความผิดพลาดได้ทันไหม แล้วจัดการอย่างไร',
      },
      {
        t: 'quote',
        h: 'TEM คืออะไร',
        qs: [
          { q: 'The Threat and Error Management (TEM) model is a conceptual framework for understanding operational performance in complex environments.', th: 'กรอบคิดสำหรับเข้าใจการปฏิบัติงานในสภาพแวดล้อมที่ซับซ้อน', src: S('ac90a1', 1) },
          { q: 'The added value that TEM brings to other performance models is that it focuses simultaneously on the operating environment and the humans working in that environment.', th: 'มองสภาพแวดล้อมกับคนที่ทำงานในนั้นไปพร้อมกัน', src: S('ac90a1', 1) },
        ],
      },
      {
        t: 'widget', w: 'tem',
        h: 'ตัดวงจรให้ทัน',
        cap: 'แตะ "จัดการได้" ที่ขั้นใดขั้นหนึ่ง แล้วดูผลที่ปลายทาง',
      },
      {
        t: 'quote',
        h: 'ภัยคุกคาม (Threat)',
        qs: [
          { q: 'A threat is defined as an event or error that occurs outside the influence of the flightcrew (i.e., it was not caused by the crew), increases the operational complexity of a flight, and requires crew attention and management if safety margins are to be maintained.', th: 'เกิดนอกการควบคุมของลูกเรือ ทำให้งานซับซ้อนขึ้น และต้องจัดการเพื่อรักษาระยะปลอดภัย', src: S('ac90a1', 1) },
          { q: 'There are threats from the environment—adverse weather, airport conditions, terrain, traffic, and air traffic control (ATC)—and threats emanating from within the airline—aircraft malfunctions and master equipment list (MEL) items, problems, interruptions, or errors from dispatch, cabin, ground, maintenance, and the ramp.', th: 'มาจากสภาพแวดล้อม (อากาศ สนามบิน ภูมิประเทศ จราจร ATC) และจากภายในองค์กร (เครื่องขัดข้อง รายการค้างซ่อม ฝ่ายสนับสนุน)', src: S('ac90a1', 1) },
        ],
      },
      {
        t: 'cards',
        h: 'ภัยคุกคาม 3 แบบ',
        cap: 'คาดได้ / ไม่คาดคิด ตาม FAA AC 120-90 ภาคผนวก 1 หน้า 1 · แบบแฝงตามเอกสาร TEM ของ ICAO',
        items: [
          { b: 'คาดได้', s: 'Anticipated', t: 'รู้ล่วงหน้า บรีฟได้ เช่น พายุที่พยากรณ์ไว้ สนามที่มีอันตรายประจำ' },
          { b: 'ไม่คาดคิด', s: 'Unexpected', t: 'เกิดขึ้นกะทันหัน เช่น ระบบขัดข้องกลางอากาศ คำสั่งเปลี่ยนนาทีสุดท้าย' },
          { b: 'แฝง', s: 'Latent', t: 'มองไม่เห็นจนกว่าจะมองหา เช่น การออกแบบอุปกรณ์ ภาพลวงตา ตารางที่บีบ' },
        ],
      },
      {
        t: 'quote',
        h: 'ความผิดพลาด (Error)',
        qs: [
          { q: 'Crew error is defined as action or inaction that leads to a deviation from crew or organizational intentions or expectations. Errors in the operational context tend to reduce the margin of safety and increase the probability of adverse events.', th: 'ทำหรือไม่ทำ จนเบี่ยงจากที่ตั้งใจ — ระยะปลอดภัยลดลง', src: S('ac90a1', 2) },
          { q: 'Broadly speaking, there are handling errors (flight controls, automation), procedural errors (checklists, briefings, callouts) and communication errors (with ATC, ground, or pilot-to-pilot).', th: 'บังคับเครื่อง · ขั้นตอน · การสื่อสาร', src: S('ac90a1', 2) },
          { q: 'Understanding how the error was managed is as important, if not more important, than understanding the prevalence of different types of error.', th: 'จัดการอย่างไร สำคัญเท่ากับหรือมากกว่าว่าผิดอะไร', src: S('ac90a1', 2) },
        ],
      },
      {
        t: 'quote',
        h: 'สภาพเครื่องที่ไม่ต้องการ (UAS)',
        qs: [
          { q: 'An UAS is defined as a position, condition, or attitude of an aircraft that clearly reduces safety margins and is a result of actions by the flightcrew. It is a safety-compromising state that results from ineffective error management.', th: 'สภาพของเครื่องที่ลดระยะปลอดภัยชัดเจน เกิดจากการจัดการความผิดพลาดไม่ได้ผล', src: S('ac90a1', 2) },
          { q: 'Examples include unstable approaches, lateral deviations, firm landings, and proceeding towards wrong taxiway/runway…', th: 'เข้าสนามไม่เสถียร ออกนอกแนว ลงหนัก มุ่งไปผิดทางขับ/ทางวิ่ง', src: S('ac90a1', 2) },
          { q: 'As with errors, UASs can be managed effectively, returning the aircraft to safe flight, or the crew action or inaction can induce an additional error, incident, or accident.', th: 'ยังกู้กลับได้ — หรือพาไปสู่ความผิดพลาดซ้ำ เหตุ หรืออุบัติเหตุ', src: S('ac90a1', 2) },
        ],
        note: 'ถ้าเครื่องเข้าสภาพเสี่ยงเพราะอุปกรณ์ขัดข้องหรือ ATC สั่งผิด FAA นับเป็นภัยคุกคาม ไม่ใช่ UAS (ภาคผนวก 1 หน้า 2)',
      },
      {
        t: 'quote',
        h: 'เครื่องมือรับมือ 3 กลุ่ม',
        qs: [
          { q: 'Planning countermeasures—planning, preparation, briefings, contingency management—are essential for managing anticipated and unexpected threats', th: 'วางแผน: เตรียมตัว บรีฟ แผนสำรอง — รับมือภัยที่คาดได้และไม่คาดคิด', src: S('ac90a1', 2) },
          { q: 'Execution countermeasures—monitor/cross-check, taxiway/runway management, workload, and automation management—are essential for error detection and error response', th: 'ระหว่างบิน: เฝ้าดูและตรวจทาน จัดภาระงาน จัดการระบบอัตโนมัติ — จับและแก้ความผิดพลาด', src: S('ac90a1', 2) },
          { q: 'Review/modify countermeasures—evaluation of plans, inquiry—are essential for managing the changing conditions of a flight', th: 'ทบทวน: ประเมินแผนใหม่ ถาม — รับมือสถานการณ์ที่เปลี่ยน', src: S('ac90a1', 2) },
        ],
        note: 'ระบบเตือนภัย เช่น GPWS และเช็กลิสต์กับระเบียบที่เขียนดี ก็นับเป็นเครื่องมือรับมือเช่นกัน (ภาคผนวก 1 หน้า 3)',
      },
      {
        t: 'quote',
        h: 'TEM กับ CRM',
        qs: [
          { q: 'TEM training emphasizes the value of threat anticipation and management, error avoidance, and error detection and recovery.', th: 'ฝึกให้คาดและจัดการภัย เลี่ยงความผิดพลาด จับได้และแก้ทัน', src: S('ac90a1', 3) },
          { q: 'It is important to clarify that TEM is not crew resource management (CRM) and should not be considered a replacement for it. TEM and CRM refer to overlapping but not equivalent activities.', th: 'TEM ไม่ใช่ CRM และใช้แทนกันไม่ได้ — ทับซ้อนกันแต่ไม่เหมือนกัน', src: S('ac90a1', 3) },
        ],
      },
      {
        t: 'stats',
        h: 'TEM มาจากการสังเกตเที่ยวบินจริง (LOSA)',
        items: [
          { n: 'สมัครใจ', t: 'LOSA เป็นโครงการด้านความปลอดภัยที่เข้าร่วมโดยสมัครใจ', q: 'A LOSA is a voluntary safety program.', src: S('ac90', 1) },
          { n: 'ไม่มีผลต่อตัว', t: 'เก็บข้อมูลเป็นความลับ และรับประกันว่าไม่มีผลเสียต่อนักบินที่ถูกสังเกต', q: 'Confidential data collection and non-jeopardy assurance for pilots are fundamental to the process.', src: S('ac90', 2) },
          { n: '6–12 เดือน', t: 'ระยะเวลาทำ LOSA หนึ่งรอบ และแนะนำให้ทำทุก 3 ปี', q: '…can take between 6 and 12 months. A LOSA is recommended every 3 years.', src: S('ac90', 2) },
          { n: '5% กับ 50%', t: 'พลาดจุดเดียวกัน 5% ชี้ที่ลูกเรือ · 50% ชี้ที่ขั้นตอน', q: 'If 5 percent of observed crews make a callout error … there may be a problem with those crews. However, if 50 percent of observed crews make the same error, then the evidence suggests a problem with the callout procedure.', src: S('ac90', 3) },
        ],
        cap: 'LOSA เป็นโครงการของสายการบิน ยกมาเพื่ออธิบายแนวคิด ไม่ใช่ระเบียบของ ทอ.',
      },
      {
        t: 'quiz',
        q: 'ตั้งโหมดระบบนำร่องผิด เครื่องเริ่มลดระดับต่ำกว่าที่กำหนด ควรทำอะไรก่อน',
        opts: ['ก้มหน้าแก้โหมดให้ถูกก่อน', 'บินเครื่องกลับสู่ระดับที่ถูก แล้วค่อยแก้โหมด', 'แจ้งหอบังคับการบินก่อน'],
        a: 1,
        why: 'เครื่องเข้าสู่สภาพที่ไม่ต้องการ (UAS) แล้ว ต้องเปลี่ยนจากแก้ความผิดพลาดมากู้เครื่องก่อน ลูกเรือที่มัวแก้ระบบจนลืมดูเครื่องคือกับดักที่ TEM เตือนไว้',
      },
      {
        t: 'quiz',
        q: 'ระหว่างบิน ระบบไฮดรอลิกขัดข้องเอง ลูกเรือไม่ได้ทำอะไรผิด ใน TEM นับเป็นอะไร',
        opts: ['ความผิดพลาด (Error)', 'ภัยคุกคาม (Threat)', 'สภาพเครื่องที่ไม่ต้องการ (UAS)'],
        a: 1,
        why: 'เกิดนอกการควบคุมของลูกเรือ จึงเป็นภัยคุกคามแบบไม่คาดคิด (AC 120-90 ภาคผนวก 1 หน้า 1–2) — สิ่งที่ต้องดูต่อคือลูกเรือรับมืออย่างไร เพราะความผิดพลาดมักเกิดตอนจัดการภัยนี้',
      },
      {
        t: 'brief',
        h: 'ใช้ในบรีฟวันนี้',
        items: [
          'บอกภัยที่คาดได้ของเที่ยวนี้ 2–3 ข้อ และวิธีรับมือแต่ละข้อ',
          'ตกลงกันว่าเห็นอะไรผิดแล้วใครพูด พูดอย่างไร',
          'ถ้าเครื่องผิดไปจากที่ควร: บินเครื่องก่อน ค่อยหาสาเหตุ',
        ],
      },
    ],
  },

  {
    id: 'risk',
    short: 'ประเมินความเสี่ยง',
    title: 'ประเมินความเสี่ยงก่อนบิน',
    icon: 'grid3',
    color: 'blue',
    mins: 12,
    tip: 'ความเสี่ยงคือโอกาสคูณความรุนแรง — ระดับสูงหรือร้ายแรงต้องลดลงก่อนบิน',
    take: [
      'ความเสี่ยง = โอกาสเกิด × ความรุนแรงของผล',
      'ระดับสูงและร้ายแรง: ไม่บินจนกว่าจะลดลงเหลือปานกลางหรือต่ำ',
      'ใช้ PAVE หาอันตราย IMSAFE เช็กตัวเอง และวน 3P ตลอดเที่ยวบิน',
    ],
    refs: [
      { t: 'FAA Risk Management Handbook (FAA-H-8083-2A)', u: DOC.rmh.u },
      { t: 'FAA Risk Management Handbook หน้า 4-1 ตารางความเสี่ยง', u: `${DOC.rmh.u}#page=34` },
    ],
    slides: [
      {
        t: 'title',
        h: 'ตัดสินใจบินหรือไม่บินด้วยตาราง ไม่ใช่ความรู้สึก',
        sub: 'จากคู่มือ Risk Management Handbook ของ FAA: หาอันตราย ประเมินความเสี่ยง ลดความเสี่ยง แล้วประเมินซ้ำตลอดเที่ยวบิน',
      },
      {
        t: 'stats',
        h: 'ทำไมต้องจัดการความเสี่ยง',
        items: [
          { n: 'ราว 85%', t: 'ของอุบัติเหตุการบินในรอบ 20 ปีตามสถิติ NTSB มีสาเหตุจาก "pilot error"', q: '…in the last 20 years, approximately 85 percent of aviation accidents have been caused by “pilot error.”', src: S('rmh', 'ii') },
          { n: 'เกือบ 80%', t: 'อัตราอุบัติเหตุของสายการบิน (Part 121) ลดลงเท่านี้ในสิบปีนับจากกลางทศวรรษ 1990', q: 'For example, the accident rate for air carriers operating under 14 CFR part 121 was reduced by nearly 80 percent in the ten-year period beginning in the mid-1990s.', src: S('rmh', '3-3') },
          { n: '1 : 100,000', t: 'การบินทั่วไป (Part 91) มีอุบัติเหตุถึงชีวิตราว 1 ครั้งต่อ 100,000 ชม.บิน ไม่ลดลงในช่วงเดียวกัน', q: 'In contrast, general aviation aircraft operating under 14 CFR part 91 maintained a static accident rate of about one fatal accident per 100,000 flight hours.', src: S('rmh', '3-3') },
          { n: 'ต้นเหตุร่วม', t: 'สาเหตุที่รายงานมักเป็นปลายลูกโซ่ วิเคราะห์ลึกแล้วมักพบการจัดการความเสี่ยงที่ไม่พอ', q: 'These causes often signify the final result of a chain of events. … an in-depth analysis of these accidents will often reveal inadequate risk management as a common thread.', src: S('rmh', '3-4') },
        ],
        cap: 'สถิติการบินพลเรือนของสหรัฐฯ ไม่ใช่สถิติของ ทอ.',
      },
      {
        t: 'quote',
        h: 'อันตราย ≠ ความเสี่ยง',
        qs: [
          { q: 'Simply put, a hazard is a condition that could cause an accident. The probability and predicted severity of the consequences that may result from any hazard is the risk. Identifying, analyzing, and responding appropriately to hazards decreases the risks and increases the margin of safety.', th: 'อันตราย (hazard) คือสภาพที่อาจทำให้เกิดอุบัติเหตุ · ความเสี่ยง (risk) คือโอกาสและความรุนแรงของผลจากอันตรายนั้น', src: S('rmh', '3-1') },
          { q: 'The traffic is always a hazard, but it does not usually create a significant risk for a pedestrian until the actual street crossing takes place.', th: 'รถบนถนนเป็นอันตรายตลอดเวลา แต่กลายเป็นความเสี่ยงจริงตอนเราข้ามถนน', src: S('rmh', '3-1') },
        ],
      },
      {
        t: 'cards',
        h: 'PAVE หาอันตราย 4 กลุ่ม',
        flip: true,
        cap: 'แตะการ์ดเพื่อดูคำถามที่ต้องถาม · PAVE ตามรูป 1-2 ใน FAA Risk Management Handbook',
        items: [
          { b: 'P', s: 'นักบิน (Pilot)', t: 'มีคุณสมบัติและความชำนาญกับภารกิจนี้ไหม บินแบบนี้ครั้งล่าสุดเมื่อไร ร่างกายพร้อมไหม (IMSAFE)' },
          { b: 'A', s: 'อากาศยาน (Aircraft)', t: 'เชื้อเพลิงและระยะบินพอไหม น้ำหนักและสมดุล สมรรถนะที่ความสูงและอุณหภูมิวันนี้ อุปกรณ์ที่ใช้การไม่ได้' },
          { b: 'V', s: 'สภาพแวดล้อม (enVironment)', t: 'อากาศ พายุ ทัศนวิสัย ภูมิประเทศ ความสูงความหนาแน่น สนามลง แสง กลางวันหรือกลางคืน' },
          { b: 'E', s: 'แรงกดดันภายนอก (External pressures)', t: 'ต้องถึงตรงเวลา มีคนรออยู่ ภารกิจสำคัญ — สิ่งเหล่านี้ทำให้รับความเสี่ยงมากกว่าที่ควร' },
        ],
      },
      {
        t: 'widget', w: 'imsafe',
        h: 'IMSAFE เช็กตัวเอง',
        cap: 'ตอบกับตัวเองทีละข้อ แตะข้อที่ผ่าน',
      },
      {
        t: 'quote',
        h: 'IMSAFE ในคู่มือ FAA',
        qs: [
          { q: 'The IMSAFE checklist, which is an acronym for Illness, Medication, Stress, Alcohol, Fatigue, and Emotion, can help a pilot identify these hazards.', th: 'เจ็บป่วย · ยา · ความเครียด · แอลกอฮอล์ · ความล้า · อารมณ์', src: S('rmh', '3-5') },
          { q: 'Note that some publications combine Emotion with Stress as the “S” in IMSAFE and leave the “E” to remind pilots about “Eating.”', th: 'บางเอกสารรวมอารมณ์ไว้กับความเครียด แล้วใช้ E แทน "การกิน"', src: S('rmh', '3-5') },
          { q: 'The CFRs include a time limit (no consumption within eight hours before a flight), a quantity limit (blood alcohol must be below 0.04 percent), and a performance limit (flight duty prohibited while under the influence of alcohol).', th: 'ข้อกำหนดของ FAA สำหรับนักบินพลเรือนสหรัฐฯ — ทอ. ใช้ระเบียบของหน่วย', src: S('rmh', '3-5') },
        ],
      },
      {
        t: 'compare',
        h: 'สองแกนของตาราง (หน้า 4-1)',
        a: {
          h: 'โอกาสเกิด (Likelihood)',
          items: [
            'Probable — เกิดได้หลายครั้ง',
            'Occasional — อาจเกิดในบางครั้ง',
            'Remote — ไม่น่าเกิด แต่เป็นไปได้',
            'Improbable — แทบไม่มีทางเกิด',
          ],
        },
        b: {
          h: 'ความรุนแรง (Severity)',
          items: [
            'Catastrophic — มีผู้เสียชีวิต และ/หรือ เครื่องเสียหายทั้งลำ',
            'Critical — บาดเจ็บสาหัส หรือเครื่อง/ทรัพย์สินเสียหายหนัก',
            'Marginal — บาดเจ็บเล็กน้อย หรือเสียหายเล็กน้อย',
            'Negligible — น้อยกว่าระดับเล็กน้อย',
          ],
        },
      },
      {
        t: 'widget', w: 'matrix',
        h: 'ตารางความเสี่ยง',
        cap: 'ตารางตามรูป 4-1 ใน FAA Risk Management Handbook (FAA-H-8083-2A) ตัวอย่างทั้งสองมาจากคู่มือเล่มเดียวกัน',
      },
      {
        t: 'quote',
        h: 'อ่านผลจากตาราง',
        qs: [
          { q: 'Risk is the composite of the likelihood (probability) and the severity (consequences) of a particular outcome.', th: 'ความเสี่ยง = โอกาสเกิด รวมกับ ความรุนแรงของผล', src: S('rmh', '4-1') },
          { q: 'The high (red) or serious (yellow) categories imply “no-go” unless the pilot finds a means to reduce the risk, such that the next iteration of risk assessment indicates a medium or low risk.', th: 'สูงหรือร้ายแรง = ไม่บิน จนกว่าจะลดลงเหลือปานกลางหรือต่ำ', src: S('rmh', '4-2') },
          { q: 'The medium (green) risk level implies a “go” decision for a planned or ongoing flight. However, in this case, risk should still be mitigated if possible.', th: 'ปานกลาง = บินได้ แต่ยังควรลดความเสี่ยงถ้าทำได้', src: S('rmh', '4-2') },
        ],
      },
      {
        t: 'quote',
        h: 'ไม่แน่ใจ ให้เลือกฝั่งที่ระวังกว่า',
        qs: [
          { q: 'While conducting a risk assessment, a pilot may be unsure of the likelihood or severity for a particular risk or find it difficult to choose between adjacent parameters. In such cases, pilots should apply the more conservative parameter(s), which place the risk at a higher level.', th: 'ลังเลระหว่างสองช่อง ให้เลือกช่องที่ทำให้ความเสี่ยงสูงกว่า', src: S('rmh', '4-2') },
          { q: 'Pilots sometimes use inputs that skew the risk toward a lower level due to the desire to complete a flight.', th: 'อยากได้บิน จึงเลือกค่าที่ทำให้ความเสี่ยงดูต่ำลง', src: S('rmh', '4-2') },
          { q: 'The matrix results lose relevance if the hazards change before a flight departs.', th: 'อันตรายเปลี่ยนก่อนออกบิน ผลจากตารางก็ใช้ไม่ได้แล้ว', src: S('rmh', '4-2') },
        ],
      },
      {
        t: 'quiz',
        q: 'ประเมินได้ระดับ "ร้ายแรง (Serious)" ตามตารางของ FAA ต้องทำอย่างไร',
        opts: ['บินได้ แต่ระวังเป็นพิเศษ', 'ไม่บิน จนกว่าจะลดความเสี่ยงลงเหลือปานกลางหรือต่ำ', 'ยกเลิกภารกิจถาวร'],
        a: 1,
        why: 'ตามคู่มือ FAA ระดับสูงและร้ายแรงคือไม่บินจนกว่าจะลดความเสี่ยงได้ ส่วนผู้มีอำนาจรับความเสี่ยงแต่ละระดับให้ยึดระเบียบของหน่วย',
      },
      {
        t: 'quiz',
        q: 'ไม่แน่ใจว่าโอกาสเกิดของอันตรายข้อหนึ่งเป็น Occasional หรือ Remote ควรเลือกอย่างไร',
        opts: ['Remote เพราะที่ผ่านมายังไม่เคยเกิด', 'Occasional ซึ่งทำให้ระดับความเสี่ยงสูงกว่า', 'ข้ามข้อนี้ไปก่อน'],
        a: 1,
        why: 'FAA ให้เลือกค่าที่ระวังกว่า ซึ่งทำให้ความเสี่ยงสูงขึ้น และถ้ายังไม่แน่ใจให้ถามนักบินที่มีประสบการณ์มากกว่าหรือครูการบิน (หน้า 4-2)',
      },
      {
        t: 'points',
        h: 'ระหว่างบิน วน 3P',
        items: [
          { b: 'Perceive — มองเห็น', t: 'สังเกตอันตรายที่เกิดใหม่ เช่น เมฆพายุก่อตัวข้างหน้า' },
          { b: 'Process — ประเมิน', t: 'ไล่ทางเลือก (เลี่ยง ย้อนกลับ ลงสนามสำรอง) แล้วชั่งข้อดีข้อเสีย — ตรงเวลาหรือถึงที่หมายเดิมสำคัญน้อยกว่าความปลอดภัย' },
          { b: 'Perform — ลงมือ', t: 'ทำตามทางที่เลือก แล้ววนกลับไปมองหาอันตรายใหม่' },
        ],
      },
      {
        t: 'quote',
        h: '3P เป็นวงปิด',
        qs: [
          { q: 'Effective risk management models utilize a closed-loop process. The closed-loop nature of the 3P model requires a periodic check to verify successful mitigation of the risk. If the pilot perceives insufficient mitigation of that risk or detects a new hazard, the process and analysis resumes.', th: 'ตรวจซ้ำเป็นระยะว่าลดความเสี่ยงได้จริง ถ้ายังไม่พอหรือเจออันตรายใหม่ ให้วนใหม่', src: S('rmh', '8-3') },
          { q: 'Analytical decision-making leads to an option likely to result in a safe outcome. Pilots should consider the following items less important than safety:', th: 'ถึงตรงเวลา · ความไม่สะดวกของผู้โดยสาร · คนที่รออยู่ปลายทาง · การไปให้ถึงจุดหมายเดิม', src: S('rmh', '8-2') },
        ],
      },
      {
        t: 'brief',
        h: 'ใช้ในบรีฟวันนี้',
        items: [
          'ไล่ PAVE ทีละตัว แล้วให้แต่ละคนตอบ IMSAFE กับตัวเอง',
          'อันตรายที่ได้ระดับสูงหรือร้ายแรง ต้องบอกวิธีลดก่อนบิน',
          'เงื่อนไขเปลี่ยนระหว่างบิน วน 3P ใหม่',
        ],
      },
    ],
  },

  {
    id: 'dozen',
    short: 'Dirty Dozen',
    title: '12 เงื่อนไขที่ทำให้คนพลาด',
    icon: 'shield',
    color: 'green',
    mins: 12,
    tip: '"แบบนี้ทำกันมาตลอด" เป็นหนึ่งใน 12 เงื่อนไขที่ทำให้คนพลาด เรียกว่าบรรทัดฐานที่ผิด (Norms)',
    take: [
      '12 เงื่อนไขนี้ทำให้คนที่เก่งและตั้งใจก็พลาดได้',
      'รู้ทันเงื่อนไขของตัวเองวันนี้ แล้วเตรียมวิธีกันไว้',
      'บรรทัดฐานที่ผิดอันตรายเพราะทุกคนทำจนไม่มีใครเห็นว่าผิด',
    ],
    refs: [
      { t: 'FAA AMT Handbook–General (FAA-H-8083-30B) หน้า 14-13 The Dirty Dozen', u: `${DOC.amtg.u}#page=636` },
      { t: 'SKYbrary — The Human Factors "Dirty Dozen"', u: 'https://skybrary.aero/articles/human-factors-dirty-dozen', n: 'เล่าความ ไม่ยกคำพูด' },
    ],
    slides: [
      {
        t: 'title',
        h: '12 เงื่อนไขที่ทำให้คนเก่งก็พลาดได้',
        sub: 'รวบรวมให้ Transport Canada ในปี 1993 จากงานซ่อมบำรุง แต่ใช้ได้กับทุกตำแหน่งในการบิน แต่ละข้อมีวิธีกันของมัน',
      },
      {
        t: 'quote',
        h: 'ที่มาของ 12 ข้อ',
        qs: [
          { q: 'Due to a large number of maintenance-related aviation accidents and incidents that occurred in the late 1980s and early 1990s, Transport Canada identified twelve human factors that degrade people’s ability to perform effectively and safely, which could lead to maintenance errors.', th: 'Transport Canada สรุป 12 ปัจจัยมนุษย์ที่ลดความสามารถในการทำงานอย่างปลอดภัย หลังอุบัติเหตุจากงานซ่อมจำนวนมาก', src: S('amtg', '14-13') },
          { q: '…human error, rather than mechanical failure, underlies most aviation accidents and incidents.', th: 'อุบัติเหตุส่วนใหญ่มีความผิดพลาดของคนอยู่เบื้องหลัง ไม่ใช่เครื่องเสีย', src: S('amtg', '14-2') },
        ],
      },
      {
        t: 'cards',
        h: 'Dirty Dozen',
        flip: true,
        cap: 'แตะการ์ดเพื่อดูวิธีกัน',
        items: [
          { b: 'ขาดการสื่อสาร', s: 'Lack of communication', t: 'ส่งต่องานเป็นลายลักษณ์อักษร และทวนกลับสิ่งที่ได้ยิน' },
          { b: 'ชะล่าใจ', s: 'Complacency', t: 'ตรวจเหมือนจะเจอปัญหาทุกครั้ง โดยเฉพาะงานที่ทำบ่อย' },
          { b: 'ขาดความรู้', s: 'Lack of knowledge', t: 'ไม่แน่ใจให้เปิดคู่มือหรือถามคนที่รู้ อย่าเดา' },
          { b: 'ถูกขัดจังหวะ', s: 'Distraction', t: 'กลับมาทำต่อโดยย้อนไป 3 ขั้นก่อนจุดที่หยุด' },
          { b: 'ขาดการทำงานเป็นทีม', s: 'Lack of teamwork', t: 'บรีฟเป้าหมายและบทบาทให้ทุกคนเข้าใจตรงกัน' },
          { b: 'ความล้า', s: 'Fatigue', t: 'รู้อาการล้าของตัวเอง ให้คนอื่นตรวจซ้ำงานสำคัญ' },
          { b: 'ขาดทรัพยากร', s: 'Lack of resources', t: 'ไม่ใช้ของทดแทนที่ไม่ผ่านการรับรอง และรายงานสิ่งที่ขาด' },
          { b: 'แรงกดดัน', s: 'Pressure', t: 'กล้าขอเวลาเพิ่มเมื่อความปลอดภัยยังไม่ครบ' },
          { b: 'ไม่กล้าทัก', s: 'Lack of assertiveness', t: 'พูดสิ่งที่เห็นตรง ๆ และสุภาพ ไม่ว่าอีกฝ่ายยศอะไร' },
          { b: 'ความเครียด', s: 'Stress', t: 'หยุดสั้น ๆ คิดก่อนทำ และคุยกับคนที่ไว้ใจ' },
          { b: 'ขาดการตระหนักรู้', s: 'Lack of awareness', t: 'ถามตัวเองว่าทำแบบนี้แล้วจะเกิดอะไรต่อ' },
          { b: 'บรรทัดฐานที่ผิด', s: 'Norms', t: 'ยึดระเบียบ ไม่ใช่ "ที่นี่ทำกันแบบนี้"' },
        ],
      },
      {
        t: 'stats',
        h: 'ตัวเลขจากคู่มือช่างของ FAA',
        items: [
          { n: '80%', t: 'ของความผิดพลาดในงานซ่อมเกี่ยวกับปัจจัยมนุษย์', q: 'It is universally agreed that 80 percent of maintenance errors involve human factors.', src: S('amtg', '14-1') },
          { n: '15%', t: 'ของความผิดพลาดในงานซ่อม ประเมินว่าเกิดจากการถูกขัดจังหวะ', q: 'It is estimated that 15 percent of maintenance related errors are caused by distractions.', src: S('amtg', '14-15') },
          { n: '8–9 ชม.', t: 'การนอนต่อวันที่แนะนำเพื่อเลี่ยงความล้า', q: 'Eight to nine hours of daily sleep are recommended to avoid fatigue.', src: S('amtg', '14-17') },
          { n: '24 ชม.', t: 'เวลาพักต่อสัปดาห์ที่กฎของสายการบินสหรัฐฯ กำหนดขั้นต่ำไว้เท่านั้น', q: 'Title 14 of the Code of Federal Regulations (14 CFR) part 121, section 377, only requires 24 hours time off during a week of work.', src: S('amtg', '14-18') },
        ],
        cap: 'ตัวเลขจากคู่มือ FAA ไม่ใช่สถิติของ ทอ.',
      },
      {
        t: 'quote',
        h: 'ส่งต่องาน และงานที่ทำซ้ำทุกวัน',
        qs: [
          { q: 'Continuing a job that has been started by someone else should only occur after a face-to-face meeting of technicians. … Absence of either a written or oral turnover serves as warning that an error could occur.', th: 'รับงานต่อจากคนอื่น ต้องคุยกันต่อหน้า — ไม่มีการส่งต่องานคือสัญญาณเตือน', src: S('amtg', '14-14') },
          { q: 'A repetitive task, especially an inspection item, may be overlooked or skipped because the technician has performed the task a number of times without ever finding a fault.', th: 'งานตรวจที่ทำซ้ำแล้วไม่เคยเจออะไร ถูกข้ามได้ง่าย', src: S('amtg', '14-14') },
          { q: 'To combat complacency, a technician must be trained to expect to find the fault that created the inspection item in the first place.', th: 'ตรวจโดยคาดว่าจะเจอข้อบกพร่องที่ทำให้มีรายการตรวจนี้', src: S('amtg', '14-14') },
        ],
        note: 'อย่าลงชื่อรับรองงานที่ยังไม่ได้ทำ (หน้า 14-14)',
      },
      {
        t: 'quote',
        h: 'ถูกขัดจังหวะ: ย้อนไป 3 ขั้น',
        qs: [
          { q: 'A distraction while performing maintenance on an aircraft may disrupt the procedure. … When work resumes, it is possible that the technician skips over a detail that needs attention.', th: 'กลับมาทำต่อหลังถูกขัดจังหวะ อาจข้ามรายละเอียดที่สำคัญไป', src: S('amtg', '14-15') },
          { q: 'A good practice is to go back three steps in the work procedure from when distraction occurred and resume the job from that point.', th: 'ย้อนไป 3 ขั้นจากจุดที่ถูกขัดจังหวะ แล้วทำต่อจากตรงนั้น', src: S('amtg', '14-16') },
        ],
      },
      {
        t: 'quiz',
        q: 'ช่างถูกเรียกไปรับโทรศัพท์ระหว่างขันน็อตชุดหนึ่ง กลับมาทำต่อจากจุดที่คิดว่าค้างไว้ — เงื่อนไขไหนเด่นที่สุด',
        opts: ['ชะล่าใจ (Complacency)', 'ถูกขัดจังหวะ (Distraction)', 'บรรทัดฐานที่ผิด (Norms)'],
        a: 1,
        why: 'การถูกขัดจังหวะทำให้จำจุดที่ทำค้างผิดได้ง่าย FAA แนะนำให้ย้อนไป 3 ขั้นจากจุดที่ถูกขัดจังหวะ แล้วทำต่อจากตรงนั้น (หน้า 14-16)',
      },
      {
        t: 'quote',
        h: 'ความล้า และแรงกดดันเรื่องเวลา',
        qs: [
          { q: 'Until it becomes extreme, a person may be unaware that they are fatigued. It is easier recognized by another person or in the results of tasks being performed.', th: 'คนล้ามักไม่รู้ตัว คนอื่นหรือผลงานจะเห็นก่อน', src: S('amtg', '14-16') },
          { q: 'Working alone when fatigued is particularly dangerous.', th: 'ล้าแล้วทำงานคนเดียว อันตรายเป็นพิเศษ', src: S('amtg', '14-16') },
          { q: 'Sacrificing quality and safety for the sake of time should not be tolerated or accepted.', th: 'ไม่ยอมแลกคุณภาพและความปลอดภัยกับเวลา', src: S('amtg', '14-22') },
        ],
      },
      {
        t: 'quote',
        h: 'กล้าทัก ไม่ใช่ก้าวร้าว',
        qs: [
          { q: 'Assertiveness is the ability to express your feelings, opinions, beliefs, and needs in a positive, productive manner and should not be confused with being aggressive.', th: 'กล้าพูดสิ่งที่คิดอย่างสร้างสรรค์ ไม่ใช่ก้าวร้าว', src: S('amtg', '14-22') },
          { q: 'Not being assertive could ultimately cost people their lives.', th: 'ไม่กล้าพูด อาจแลกด้วยชีวิต', src: S('amtg', '14-22') },
          { q: 'A lack of assertiveness in failing to speak up when things do not seem right has resulted in many fatal accidents.', th: 'ไม่พูดเมื่อเห็นว่าไม่ถูก นำไปสู่อุบัติเหตุถึงชีวิตหลายครั้ง', src: S('amtg', '14-23') },
        ],
        note: 'FAA เสนอ 4 ขั้น: บอกปัญหาตรง ๆ · บอกผลที่จะตามมา · เสนอทางแก้ · ขอความเห็นกลับ (หน้า 14-22–14-23)',
      },
      {
        t: 'quote',
        h: 'บรรทัดฐาน: "ที่นี่ทำกันแบบนี้"',
        qs: [
          { q: 'Norms is short for “normal,” or the way things are normally done. … They are unwritten rules that are followed or tolerated by most organizations. Negative norms can detract from the established safety standard and cause an accident to occur.', th: 'กฎที่ไม่ได้เขียนไว้ แต่คนส่วนใหญ่ทำหรือปล่อยให้ทำ — บรรทัดฐานที่ผิดกัดกร่อนมาตรฐานความปลอดภัย', src: S('amtg', '14-26') },
          { q: 'Very rarely do newcomers initiate change in a group with established norms.', th: 'คนใหม่แทบไม่เคยเป็นคนเริ่มเปลี่ยน', src: S('amtg', '14-26') },
          { q: 'Newcomers are better able to identify these unsafe norms than long-standing members of the group.', th: 'แต่คนใหม่มองเห็นบรรทัดฐานที่ผิดได้ดีกว่าคนเก่า', src: S('amtg', '14-27') },
        ],
      },
      {
        t: 'quiz',
        q: 'ทุกคนในหน่วยข้ามข้อหนึ่งในเช็กลิสต์ เพราะ "ไม่เคยมีปัญหา"',
        opts: ['บรรทัดฐานที่ผิด (Norms)', 'ขาดความรู้ (Lack of knowledge)', 'ความเครียด (Stress)'],
        a: 0,
        why: 'เมื่อการข้ามขั้นกลายเป็นเรื่องปกติของกลุ่ม คนใหม่ก็จะทำตาม และไม่มีใครเห็นว่าเป็นความเสี่ยง — FAA ระบุว่าคนใหม่มองเห็นบรรทัดฐานที่ผิดได้ดีกว่าคนเก่า (หน้า 14-27) จึงควรฟังเขา',
      },
      {
        t: 'cards',
        h: 'ข้อบกพร่องงานซ่อมที่พบบ่อย',
        cap: 'จากการศึกษาของ UK CAA ที่ FAA ยกไว้ในหน้า 14-28 — FAA สรุปว่าทุกข้อป้องกันได้ถ้าทำตามการ์ดงาน',
        items: [
          { b: 'ติดตั้งผิด', s: 'Incorrect installation of components', t: 'ผิดทิศ ผิดตำแหน่ง หรือไม่ครบ' },
          { b: 'ใส่ชิ้นส่วนผิด', s: 'Fitting of wrong parts', t: 'เทียบเลขชิ้นส่วนกับเอกสาร' },
          { b: 'เดินสายไฟผิด', s: 'Electrical wiring discrepancies', t: 'รวมถึงต่อสายไขว้กัน' },
          { b: 'ลืมเครื่องมือ/ชิ้นส่วน', s: 'Forgotten tools and parts', t: 'นับเครื่องมือก่อนและหลังงาน' },
          { b: 'ไม่หล่อลื่น', s: 'Failure to lubricate', t: 'ทำตามรายการหล่อลื่นให้ครบ' },
          { b: 'ไม่ยึดฝาครอบ', s: 'Failure to secure access panels, fairings, or cowlings', t: 'ตรวจทุกฝาก่อนปิดงาน' },
          { b: 'ไม่ปิดฝาน้ำมัน', s: 'Fuel or oil caps and fuel panels not secured', t: 'ฝาเชื้อเพลิง น้ำมันเครื่อง และแผงเติม' },
          { b: 'ไม่ถอดสลักล็อก', s: 'Failure to remove lock pins', t: 'นับสลักและธงแดงก่อนบิน' },
        ],
      },
      {
        t: 'quote',
        h: 'เมื่อเงื่อนไขซ้อนกัน',
        qs: [
          { q: 'Technicians familiar with Boeing 757 flap change procedures lacked the knowledge required to correctly lock out the spoilers on the Airbus during the flap change work that was done the day before the flight. Turnover to technicians on the next shift compounded the problem.', th: 'ช่างคุ้นกับแบบหนึ่ง ล็อกสปอยเลอร์ของอีกแบบผิด แล้วการส่งต่องานข้ามกะซ้ำเติม — ขาดความรู้ + ขาดการสื่อสาร', src: S('amtg', '14-32') },
          { q: 'The improper replacement of the forward elevator trim cable and subsequent inadequate functional check of the maintenance performed resulted in a reversal of the elevator trim system and a loss of control in flight.', th: 'เปลี่ยนสายทริมผิดและทดสอบไม่ครบ ทริมทำงานกลับทิศ เครื่องเสียการควบคุม', src: S('amtg', '14-32') },
        ],
      },
      {
        t: 'brief',
        h: 'ใช้ในบรีฟวันนี้',
        items: [
          'ให้แต่ละคนเลือก 1 ใน 12 ข้อที่ตัวเองเสี่ยงที่สุดวันนี้ แล้วบอกวิธีกัน',
          'ถูกขัดจังหวะ: ย้อนไป 3 ขั้นก่อนจุดที่หยุด แล้วทำต่อจากตรงนั้น',
          'ส่งต่องานข้ามกะ: คุยกันต่อหน้า และไม่ลงชื่องานที่ยังไม่ได้ทำ',
          'ตกลงคำที่ใช้ทักกันไว้ก่อน จะได้ไม่ลังเลตอนเห็นของจริง',
        ],
      },
    ],
  },

  {
    id: 'crm',
    short: 'CRM',
    title: 'CRM — ใช้ทุกทรัพยากรที่มี',
    icon: 'crew',
    color: 'orange',
    mins: 12,
    tip: 'อุบัติเหตุจำนวนมากไม่ได้มาจากเครื่องเสีย แต่มาจากลูกเรือรับมือกับสถานการณ์ไม่ได้',
    take: [
      'CRM คือการใช้ทุกทรัพยากรที่มี ทั้งอุปกรณ์ ขั้นตอน และคน ทั้งในและนอกเครื่อง',
      'ทักษะหลักมี 2 กลุ่ม: ด้านความคิด (SA แก้ปัญหา ตัดสินใจ) และด้านคน (สื่อสาร ทำงานเป็นทีม)',
      'ระยะห่างของอำนาจที่ชันหรือแบนเกินไป ทำให้ทีมพลาดได้ทั้งคู่ ปรับให้พอดีกับงาน',
    ],
    refs: [
      { t: 'FAA AC 120-51E (2004) Crew Resource Management Training', u: DOC.ac51e.u },
      { t: 'FAA PHAK (FAA-H-8083-25C) หน้า 2-23 Use of Resources', u: `${DOC.phak.u}#page=62` },
      { t: 'SKYbrary — Crew Resource Management (CRM)', u: 'https://skybrary.aero/articles/crew-resource-management-crm', n: 'เล่าความ ไม่ยกคำพูด' },
      { t: 'SKYbrary — Authority Gradients', u: 'https://skybrary.aero/articles/authority-gradients', n: 'เล่าความ ไม่ยกคำพูด' },
    ],
    slides: [
      {
        t: 'title',
        h: 'ลูกเรือที่เก่งทุกคน ยังพลาดได้ถ้าไม่ทำงานเป็นทีม',
        sub: 'CRM เกิดจากการวิเคราะห์เครื่องบันทึกข้อมูลการบินและเสียงในห้องนักบิน ซึ่งพบว่าอุบัติเหตุจำนวนมากไม่ได้มาจากเครื่องขัดข้อง แต่มาจากลูกเรือรับมือกับสถานการณ์ได้ไม่ดี',
        stat: { n: '60–80%', t: 'ของเหตุและอุบัติเหตุของสายการบิน มีความผิดพลาดของคนเป็นปัจจัยร่วม (FAA AC 120-51E หน้า 4)' },
      },
      {
        t: 'quote',
        h: 'CRM คืออะไร',
        qs: [
          { q: 'As used in this AC, CRM refers to the effective use of all available resources: human resources, hardware, and information.', th: 'ใช้ทุกทรัพยากรที่มีให้ได้ผล — คน อุปกรณ์ และข้อมูล', src: S('ac51e', 2) },
          { q: 'The application of team management concepts in the flight deck environment was initially known as cockpit resource management. As CRM training evolved to include flight attendants, maintenance personnel and others, the phrase “Crew Resource Management” was adopted.', th: 'เดิมเป็นเรื่องในห้องนักบิน ต่อมาขยายไปถึงลูกเรือในห้องโดยสารและช่าง จึงเปลี่ยนเป็น "Crew"', src: S('ac51e', 2) },
        ],
      },
      {
        t: 'quote',
        h: 'ปัญหาส่วนใหญ่ไม่ใช่ฝีมือบิน',
        qs: [
          { q: 'Many problems encountered by flightcrews have very little to do with the technical aspects of operating in a multi-person cockpit. Instead, problems are associated with poor group decisionmaking, ineffective communication, inadequate leadership, and poor task or resource management.', th: 'ปัญหามาจากการตัดสินใจเป็นกลุ่ม การสื่อสาร ภาวะผู้นำ และการจัดงาน — ไม่ใช่ทักษะบิน', src: S('ac51e', 4) },
          { q: 'Demonstrated mastery of CRM concepts cannot overcome a lack of proficiency. Similarly, high technical proficiency cannot guarantee safe operations in the absence of effective crew coordination.', th: 'CRM ดีแต่บินไม่เก่งก็ไม่รอด บินเก่งแต่ทีมไม่ประสานก็ไม่ปลอดภัย', src: S('ac51e', 5) },
        ],
      },
      {
        t: 'points',
        h: 'ทรัพยากรที่ CRM ให้ใช้',
        items: [
          { b: 'อุปกรณ์', t: 'เครื่องวัด ระบบเตือน ออโตไพลอต และระบบนำร่อง' },
          { b: 'ขั้นตอน', t: 'เช็กลิสต์ คู่มือ และระเบียบ ที่คนก่อนหน้าเขียนไว้จากบทเรียน' },
          { b: 'คนในเครื่อง', t: 'นักบินอีกคน ช่างอากาศ และลูกเรือทุกตำแหน่ง' },
          { b: 'คนนอกเครื่อง', t: 'หอบังคับการบิน ช่างภาคพื้น และฝ่ายอุตุนิยมวิทยา — บินคนเดียวก็ใช้ได้ เรียกว่า SRM' },
        ],
      },
      {
        t: 'compare',
        h: 'ทักษะ 2 กลุ่มของ CRM',
        a: { h: 'ด้านความคิด (Cognitive)', items: ['ตระหนักรู้สถานการณ์ (SA)', 'แก้ปัญหา', 'ตัดสินใจ'] },
        b: { h: 'ด้านคน (Interpersonal)', items: ['สื่อสาร: พูดให้ชัด ฟังให้ครบ ทวนกลับ', 'ทำงานเป็นทีม: รู้บทบาท แบ่งงาน ช่วยกันตรวจ'] },
      },
      {
        t: 'widget', w: 'gradient',
        h: 'ระยะห่างของอำนาจในห้องนักบิน',
        cap: 'แตะเลือกระดับ แล้วดูว่าทีมจะเป็นอย่างไร — SKYbrary ระบุว่าไม่มีระดับเดียวที่ถูกทุกสถานการณ์',
      },
      {
        t: 'quote',
        h: 'ถามได้ ทักได้ จนกว่าจะได้คำตอบ',
        qs: [
          { q: 'It should be made perfectly clear in pilots’ manuals, and in every phase of pilot training, that appropriate questioning is encouraged and that there will be no negative repercussions for appropriate questioning of one pilot’s decision or action by another pilot.', th: 'ต้องบอกให้ชัดว่าถามได้ และจะไม่มีผลเสียต่อคนที่ถาม', src: S('ac51e', 7) },
          { q: '(1) Crewmembers speak up and state their information with appropriate persistence until there is some clear resolution.', th: 'พูดออกมา และย้ำอย่างเหมาะสมจนกว่าจะได้ข้อยุติ', src: S('ac51ea1', 2) },
        ],
        note: 'อุปสรรคการสื่อสารที่ AC ยกไว้: ยศ อายุ เพศ และวัฒนธรรมองค์กร (หน้า 10)',
      },
      {
        t: 'quote',
        h: 'บรีฟที่ดีสร้างทีม',
        qs: [
          { q: 'An effective briefing is interesting and thorough. It addresses coordination, planning, and problems. Although briefings are primarily a captain’s responsibility, other crewmembers may add significantly to planning and should be encouraged to do so.', th: 'บรีฟเป็นหน้าที่หลักของผู้บังคับอากาศยาน แต่ควรชวนคนอื่นช่วยวางแผน', src: S('ac51ea1', 1) },
          { q: '(3) The briefing establishes a “team concept” (e.g., the captain uses “we” language, encourages all to participate and to help with the flight). … (8) The briefing sets expectations for handling deviations from SOPs.', th: 'ใช้ภาษา "เรา" ชวนทุกคนมีส่วนร่วม และตกลงไว้ก่อนว่าถ้าออกนอกระเบียบจะทำอย่างไร', src: S('ac51ea1', 1) },
        ],
      },
      {
        t: 'quote',
        h: 'เฝ้าดูและตรวจทานกัน',
        qs: [
          { q: 'Therefore, to ensure the highest levels of safety, each flight crewmember must carefully monitor the aircraft’s flight path and systems and actively cross-check the actions of other crewmembers. Effective monitoring and cross-checking can be the last line of defense that prevents an accident because detecting an error or unsafe situation may break the chain of events leading to an accident.', th: 'ทุกคนต้องเฝ้าดูเส้นทางบินและระบบ และตรวจทานงานของกันและกัน — อาจเป็นชั้นป้องกันสุดท้าย', src: S('ac51e', 14) },
          { q: 'This monitoring function is always essential, and particularly so during approach and landing when controlled flight into terrain (CFIT) accidents are most common.', th: 'สำคัญที่สุดช่วงเข้าใกล้และลงจอด ซึ่งเป็นช่วงที่บินชนพื้นทั้งที่ควบคุมได้ (CFIT) เกิดบ่อยที่สุด', src: S('ac51e', 14) },
        ],
      },
      {
        t: 'quote',
        h: 'ฝึกครั้งเดียวไม่พอ',
        qs: [
          { q: 'Research also shows that when there is no effective reinforcement of CRM concepts by way of recurrent training, improvements in attitudes observed after initial indoctrination tend to disappear, and individuals’ attitudes tend to revert to former levels.', th: 'ไม่ฝึกทบทวน ทัศนคติที่ดีขึ้นหลังฝึกครั้งแรกจะกลับไปเหมือนเดิม', src: S('ac51e', 5) },
          { q: 'It is now understood that pilot errors cannot be entirely eliminated. It is important, therefore, that pilots develop appropriate error management skills and procedures.', th: 'ความผิดพลาดกำจัดไม่ได้ทั้งหมด จึงต้องฝึกจับและแก้ความผิดพลาด', src: S('ac51e', 16) },
        ],
        note: 'AC ระบุด้วยว่าการสอนในห้องเรียนอย่างเดียวไม่เปลี่ยนทัศนคติในระยะยาว (หน้า 9)',
      },
      {
        t: 'quiz',
        q: 'ผู้ช่วยนักบินเห็นว่าความสูงที่ตั้งไว้ไม่ตรงกับที่หอบังคับการบินอนุญาต แต่ไม่พูด เพราะอีกฝ่ายอาวุโสกว่ามาก — ปัญหาคืออะไร',
        opts: ['ระยะห่างของอำนาจชันเกินไป', 'ระยะห่างของอำนาจแบนเกินไป', 'ขาดความรู้เรื่องวิทยุ'],
        a: 0,
        why: 'เมื่ออำนาจรวมอยู่ที่คนเดียวมากเกินไป คนอื่นจะไม่กล้าเสนอข้อมูล การตรวจซ้ำกันจึงหายไป — SKYbrary ยกสถานการณ์แบบนี้เป็นตัวอย่าง',
      },
      {
        t: 'quiz',
        q: 'เกิดเหตุวิกฤตที่ต้องทำทันที ระยะห่างของอำนาจแบบไหนเหมาะกว่า',
        opts: ['แบนมาก ทุกคนออกความเห็นเท่ากันก่อนทำ', 'ชันขึ้น ผู้นำสั่งการชัดเจน', 'ไม่ต้องมีผู้นำ ใครเห็นก่อนทำก่อน'],
        a: 1,
        why: 'SKYbrary ระบุว่าวิกฤตที่ต้องทำทันทีอาจต้องการระยะห่างที่ชันขึ้น ส่วนปัญหาที่ไม่ชัดและไม่มีวิธีแก้ประจำ เหมาะกับระยะห่างที่แบนลง',
      },
      {
        t: 'quiz',
        q: 'มีคนพูดว่า "CRM เป็นเรื่องของผู้บังคับอากาศยาน ตำแหน่งอื่นไม่ต้องสนใจ" — ข้อใดถูก',
        opts: ['ถูก เพราะผู้บังคับอากาศยานเป็นคนตัดสินใจ', 'ไม่ถูก เป้าหมายของ CRM คือป้องกันอุบัติเหตุที่เกิดจากทั้งทีม', 'ถูกเฉพาะเที่ยวบินฝึก'],
        a: 1,
        why: 'FAA AC 120-51E หน้า 10 ระบุว่าความคิดว่า CRM เป็นการฝึกของกัปตันเท่านั้น พลาดแก่นของ CRM ซึ่งคือการป้องกันอุบัติเหตุที่เกี่ยวกับลูกเรือ',
      },
      {
        t: 'brief',
        h: 'ใช้ในบรีฟวันนี้',
        items: [
          'หัวหน้าเที่ยวบินบอกในบรีฟว่า "เห็นอะไรผิด พูดได้ทันที"',
          'ใช้ภาษา "เรา" และชวนทุกคนช่วยวางแผน',
          'ตกลงกันว่าใครทำอะไร เมื่อเกิดเหตุผิดปกติ',
          'นึกถึงคนนอกเครื่องที่ช่วยได้ — หอบังคับการบิน ช่าง ฝ่ายอุตุฯ',
        ],
      },
    ],
  },

  {
    id: 'sa',
    short: 'SA',
    title: 'การตระหนักรู้สถานการณ์ (SA)',
    icon: 'eye',
    color: 'teal',
    mins: 10,
    tip: 'SA ไม่ใช่แค่รู้ว่าอยู่ตรงไหน แต่ต้องเข้าใจว่ากำลังเกิดอะไรขึ้น และจะเกิดอะไรต่อ',
    take: [
      'SA มี 3 ส่วน: รับรู้สิ่งรอบตัว เข้าใจความหมาย และคาดการณ์สิ่งที่จะเกิด',
      'ความล้า ความเครียด และงานล้นมือ ทำให้จดจ่ออยู่กับเรื่องเดียวจนพลาดภาพรวม',
      'รู้ตัวว่างานล้นมือ ให้หยุด คิด ช้าลง แล้วจัดลำดับ',
    ],
    refs: [
      { t: 'FAA PHAK (FAA-H-8083-25C) หน้า 2-24 Situational Awareness · Workload Management', u: `${DOC.phak.u}#page=63` },
      { t: 'FAA AC 120-51E (2004) หน้า 11 Workload Management and Situation Awareness', u: `${DOC.ac51e.u}#page=11` },
      { t: 'SKYbrary — Situational Awareness', u: 'https://skybrary.aero/articles/situational-awareness', n: 'เล่าความ ไม่ยกคำพูด' },
      { t: 'Endsley (1995) Toward a Theory of Situation Awareness, Human Factors 37(1)', u: 'https://doi.org/10.1518/001872095779049543', n: 'เล่าความ ไม่ยกคำพูด' },
    ],
    slides: [
      {
        t: 'title',
        h: 'รู้ว่าอยู่ไหน ยังไม่พอ',
        sub: 'FAA ให้ความหมาย SA ว่าการรับรู้และเข้าใจทุกปัจจัยที่กระทบความปลอดภัย ทั้งก่อน ระหว่าง และหลังบิน — ผู้บินควรรู้ด้วยว่าทำไมถูกสั่งให้เลี้ยว และคาดได้ว่าจะไปทางไหนต่อ',
      },
      {
        t: 'quote',
        h: 'SA ในคู่มือ FAA',
        qs: [
          { q: 'Situational awareness is the accurate perception and understanding of all the factors and conditions within the five fundamental risk elements (flight, pilot, aircraft, environment, and type of operation that comprise any given aviation situation) that affect safety before, during, and after the flight.', th: 'รับรู้และเข้าใจทุกปัจจัยที่กระทบความปลอดภัย ทั้งก่อน ระหว่าง และหลังบิน', src: S('phak', '2-24') },
          { q: 'A pilot who is simply making turns without understanding why has added an additional burden to his or her management in the event of an emergency.', th: 'เลี้ยวตามสั่งโดยไม่รู้ว่าทำไม จะเป็นภาระเพิ่มเมื่อเกิดเหตุฉุกเฉิน', src: S('phak', '2-24') },
        ],
      },
      {
        t: 'widget', w: 'sa3',
        h: 'SA 3 ขั้น',
        cap: 'แตะทีละขั้น ไล่จากสิ่งที่เห็นไปถึงสิ่งที่ต้องทำ — ตัวอย่างสมมุติ ไม่ใช่เหตุการณ์จริง',
      },
      {
        t: 'points',
        h: 'อะไรทำให้ SA หลุด',
        items: [
          { b: 'ความล้า ความเครียด งานล้นมือ', t: 'ทำให้จดจ่ออยู่กับเรื่องเดียวที่ดูสำคัญ แล้วพลาดภาพรวม' },
          { b: 'ถูกดึงความสนใจ', t: 'ปัญหาเล็ก ๆ เช่นเครื่องวัดอ่านค่าแปลก ดึงสายตาออกจากเครื่องวัดอื่นและการมองนอกเครื่อง' },
          { b: 'ไม่ฟังวิทยุ', t: 'วิทยุช่วยสร้างภาพในใจว่าเครื่องอื่นอยู่ไหน และกำลังจะทำอะไร' },
          { b: 'ติดอยู่กับสิ่งเดียว (Fixation)', t: 'มองแต่สิ่งที่คิดว่าเป็นปัญหา จนไม่เห็นสิ่งที่กำลังเกิดจริง' },
        ],
      },
      {
        t: 'quote',
        h: 'ปัญหาเล็กที่กลายเป็นอุบัติเหตุ',
        qs: [
          { q: 'Fatigue, stress, and work overload can cause a pilot to fixate on a single perceived important item and reduce an overall situational awareness of the flight.', th: 'ล้า เครียด งานล้น ทำให้จดจ่อเรื่องเดียว แล้ว SA โดยรวมลดลง', src: S('phak', '2-24') },
          { q: 'Many flight deck distractions begin as a minor problem, such as a gauge that is not reading correctly, but result in accidents as the pilot diverts attention to the perceived problem and neglects proper control of the aircraft.', th: 'เริ่มจากเครื่องวัดอ่านค่าผิด แล้วจบที่อุบัติเหตุ เพราะสนใจปัญหาจนลืมบังคับเครื่อง', src: S('phak', '2-24') },
        ],
      },
      {
        t: 'compare',
        h: 'งานล้นมือ — สัญญาณและทางออก',
        a: { h: 'สัญญาณ', items: ['ทำงานหนักขึ้น แต่ได้งานน้อยลง', 'เริ่มจดจ่ออยู่เรื่องเดียว', 'รับข้อมูลไม่ครบ แล้วตัดสินใจจากข้อมูลที่มี'] },
        b: { h: 'ทางออก (FAA)', items: ['หยุด คิด ช้าลง แล้วจัดลำดับ', 'ทำงานที่ทำล่วงหน้าได้ ก่อนเข้าช่วงงานหนัก', 'ฟังวิทยุเพื่อสร้างภาพในใจว่ารอบตัวกำลังเกิดอะไร'] },
      },
      {
        t: 'quote',
        h: 'งานล้นมือ ในคำของ FAA',
        qs: [
          { q: 'The first effect of high workload is that the pilot may be working harder but accomplishing less.', th: 'ผลแรก: ทำหนักขึ้น แต่ได้งานน้อยลง', src: S('phak', '2-24') },
          { q: 'When a pilot becomes task saturated, there is no awareness of input from various sources, so decisions may be made on incomplete information and the possibility of error increases.', th: 'งานล้นจนรับข้อมูลไม่ครบ ตัดสินใจจากข้อมูลไม่ครบ โอกาสพลาดก็สูงขึ้น', src: S('phak', '2-24') },
          { q: 'When a work overload situation exists, a pilot needs to stop, think, slow down, and prioritize.', th: 'หยุด คิด ช้าลง แล้วจัดลำดับ', src: S('phak', '2-24') },
        ],
      },
      {
        t: 'quote',
        h: 'เตรียมตอนงานเบา',
        qs: [
          { q: 'Effective workload management ensures essential operations are accomplished by planning, prioritizing, and sequencing tasks to avoid work overload. … As experience is gained, a pilot learns to recognize future workload requirements and can prepare for high workload periods during times of low workload.', th: 'วางแผน จัดลำดับ เรียงงาน — และเตรียมสำหรับช่วงงานหนักไว้ตั้งแต่ช่วงที่งานเบา', src: S('phak', '2-24') },
          { q: '(3) Workload Management and Situation Awareness. Stressing the importance of maintaining awareness of the operational environment and anticipating contingencies. Instruction may address practices (e.g., vigilance, planning and time management, prioritizing tasks, and avoiding distractions) that result in higher levels of situation awareness.', th: 'ฝึก CRM ต้องรวมการเฝ้าระวัง วางแผนเวลา จัดลำดับงาน และเลี่ยงสิ่งดึงความสนใจ', src: S('ac51e', 11) },
        ],
        note: 'AC 120-51E ให้แบ่งงานให้เหมาะกับคน ไม่ให้ใครงานล้น และไม่ให้เรื่องไม่จำเป็นดึงความสนใจจากระเบียบ (หน้า 11)',
      },
      {
        t: 'quiz',
        q: 'นักบินกำลังแก้ปัญหาไฟเตือนดวงหนึ่ง จนไม่ทันเห็นว่าความสูงลดลงเรื่อย ๆ — SA ขั้นไหนหายไปก่อน',
        opts: ['รับรู้ (Perception)', 'คาดการณ์ (Projection)', 'ไม่เกี่ยวกับ SA'],
        a: 0,
        why: 'ค่าความสูงอยู่ตรงหน้าแต่ไม่ถูกรับรู้ เพราะความสนใจอยู่ที่ไฟเตือน เมื่อขั้นแรกหาย ขั้นเข้าใจและคาดการณ์ก็เกิดไม่ได้',
      },
      {
        t: 'quiz',
        q: 'รู้ตัวว่างานล้นมือ ควรทำอะไรก่อน',
        opts: ['ทำทุกอย่างให้เร็วขึ้น', 'หยุด คิด ช้าลง แล้วจัดลำดับ', 'ปิดเสียงวิทยุเพื่อลดสิ่งรบกวน'],
        a: 1,
        why: 'FAA PHAK ระบุว่าเมื่องานล้นมือ ให้หยุด คิด ช้าลง แล้วจัดลำดับ ส่วนการเร่งทำทุกอย่างพร้อมกันยิ่งทำให้จดจ่ออยู่เรื่องเดียว',
      },
      {
        t: 'quiz',
        q: 'รู้ว่าช่วงเข้าใกล้สนามบินงานจะหนัก ควรเตรียมตอนไหน',
        opts: ['ตอนเข้าใกล้สนามบิน เมื่อเห็นงานจริง', 'ช่วงเดินทางที่งานเบา ก่อนถึงช่วงงานหนัก', 'ไม่ต้องเตรียม แก้ตามสถานการณ์'],
        a: 1,
        why: 'FAA PHAK หน้า 2-24 ระบุว่าเมื่อมีประสบการณ์ นักบินจะรู้ล่วงหน้าว่าช่วงไหนงานหนัก และเตรียมไว้ตั้งแต่ช่วงที่งานเบา',
      },
      {
        t: 'brief',
        h: 'ใช้ในบรีฟวันนี้',
        items: [
          'บรีฟช่วงที่งานจะหนัก และแบ่งว่าใครเฝ้าดูอะไร',
          'ทำงานที่ทำล่วงหน้าได้ ก่อนถึงช่วงนั้น',
          'ใครตามไม่ทัน พูดออกมาว่า "ตามไม่ทันแล้ว" ทีมจะได้ช่วย',
        ],
      },
    ],
  },

  {
    id: 'adm',
    short: 'DECIDE',
    title: 'ตัดสินใจด้วย DECIDE',
    icon: 'fork',
    color: 'rose',
    mins: 12,
    tip: '"ฉันทำได้" เป็นหนึ่งใน 5 ทัศนคติอันตรายที่ FAA ให้จำคำแก้ไว้',
    take: [
      'DECIDE: ตรวจพบ ประเมิน เลือกผลที่ต้องการ หาทางแก้ ลงมือ แล้วประเมินผล — ไม่ได้ผลให้วนใหม่',
      'เมื่อไม่มีเวลา ผู้มีประสบการณ์เลือกทางแรกที่ใช้ได้ ประสบการณ์และการฝึกซ้อมจึงสำคัญ',
      'จำคำแก้ของทัศนคติอันตรายทั้ง 5 แล้วพูดกับตัวเองเมื่อเริ่มรู้สึกแบบนั้น',
    ],
    refs: [
      { t: 'FAA PHAK (FAA-H-8083-25C) บทที่ 2 Aeronautical Decision-Making', u: `${DOC.phak.u}#page=41` },
      { t: 'FAA Risk Management Handbook (FAA-H-8083-2A) บทที่ 8', u: `${DOC.rmh.u}#page=54` },
    ],
    slides: [
      {
        t: 'title',
        h: 'การตัดสินใจที่ดี ฝึกได้',
        sub: 'การตัดสินใจในการบิน (ADM) เป็นวิธีคิดอย่างเป็นระบบเพื่อประเมินความเสี่ยงและหาทางที่ดีที่สุด FAA ใช้แบบจำลอง DECIDE เป็นวงจรที่ใช้ได้ทุกสถานการณ์',
        stat: { n: 'ราว 80%', t: 'ของอุบัติเหตุการบิน FAA ระบุว่าเกี่ยวกับปัจจัยมนุษย์ (FAA PHAK หน้า 2-2)' },
      },
      {
        t: 'stats',
        h: 'ฝึกตัดสินใจแล้วได้ผลจริง',
        items: [
          { n: '24.1%', t: 'ของอุบัติเหตุจากปัจจัยมนุษย์เกิดตอนลงจอด และ 23.4% ตอนวิ่งขึ้น', q: '…approximately 80 percent of all aviation accidents are related to human factors and the vast majority of these accidents occur during landing (24.1 percent) and takeoff (23.4 percent).', src: S('phak', '2-2') },
          { n: '10–50%', t: 'นักบินที่ฝึก ADM ตัดสินใจผิดน้อยกว่าผู้ไม่ได้ฝึกราว 10–50%', q: 'The differences were statistically significant and ranged from about 10 to 50 percent fewer judgment errors.', src: S('phak', '2-3') },
          { n: '54%', t: 'อัตราอุบัติเหตุลดลง หลังผู้ประกอบการที่บินปีละราว 400,000 ชม. ใช้ ADM ฝึกทบทวน', q: '…an operator flying about 400,000 hours annually demonstrated a 54 percent reduction in accident rate after using these materials for recurrency training.', src: S('phak', '2-3') },
          { n: 'สอนได้', t: 'การตัดสินใจที่ดีสอนได้ ไม่ใช่พรสวรรค์', q: 'Contrary to popular opinion, good judgment can be taught.', src: S('phak', '2-3') },
        ],
        cap: 'สถิติการบินพลเรือนของสหรัฐฯ ไม่ใช่สถิติของ ทอ.',
      },
      {
        t: 'quote',
        h: 'ADM คืออะไร',
        qs: [
          { q: 'ADM is a systematic approach to risk assessment and stress management.', th: 'วิธีคิดอย่างเป็นระบบเพื่อประเมินความเสี่ยงและจัดการความเครียด', src: S('phak', '2-2') },
          { q: 'ADM does not eliminate hazards, but helps the pilot address hazards and associated risks that threaten the safety of flight.', th: 'ไม่ได้ทำให้อันตรายหายไป แต่ช่วยรับมือกับอันตรายและความเสี่ยง', src: S('rmh', '8-1') },
          { q: 'Despite improvements in training and technology, human error remains an issue.', th: 'แม้การฝึกและเทคโนโลยีดีขึ้น ความผิดพลาดของคนก็ยังอยู่', src: S('rmh', '8-1') },
        ],
      },
      {
        t: 'cards',
        h: 'ADM ฝึกอะไรบ้าง',
        cap: '6 หัวข้อที่ FAA ใช้ฝึกการตัดสินใจ (FAA PHAK หน้า 2-3)',
        items: [
          { b: 'รู้ทัศนคติอันตรายของตัวเอง', s: 'Identifying personal attitudes hazardous to safe flight', t: 'รู้ว่าความคิดแบบไหนพาไปสู่การตัดสินใจที่เสี่ยง' },
          { b: 'ปรับพฤติกรรม', s: 'Learning behavior modification techniques', t: 'ฝึกเปลี่ยนนิสัยที่ไม่ปลอดภัย' },
          { b: 'รับมือความเครียด', s: 'Learning how to recognize and cope with stress', t: 'รู้อาการเครียดของตัวเองและวิธีจัดการ' },
          { b: 'ประเมินความเสี่ยง', s: 'Developing risk assessment skills', t: 'ชั่งอันตรายและความเสี่ยงก่อนตัดสินใจ' },
          { b: 'ใช้ทุกทรัพยากร', s: 'Using all resources', t: 'คนในเครื่อง หอบังคับการบิน อุปกรณ์ และข้อมูล' },
          { b: 'ประเมินตัวเอง', s: 'Evaluating the effectiveness of one’s ADM skills', t: 'ทบทวนหลังบินว่าตัดสินใจได้ดีแค่ไหน' },
        ],
      },
      {
        t: 'widget', w: 'decide',
        h: 'DECIDE ทีละขั้น',
        cap: 'แตะตัวอักษรเพื่อดูแต่ละขั้น — ตัวอย่างประตูเปิดระหว่างไต่ดัดแปลงจาก FAA PHAK',
      },
      {
        t: 'quote',
        h: 'DECIDE ในคู่มือ FAA',
        qs: [
          { q: 'Using the acronym “DECIDE,” the six-step process DECIDE Model is another continuous loop process that provides the pilot with a logical way of making decisions.', th: 'DECIDE เป็นวงจร 6 ขั้นที่ให้วิธีตัดสินใจอย่างมีเหตุผล', src: S('phak', '2-18') },
          { q: 'DECIDE means to Detect, Estimate, Choose a course of action, Identify solutions, Do the necessary actions, and Evaluate the effects of the actions.', th: 'ตรวจพบ · ประเมิน · เลือกผลที่ต้องการ · หาทางแก้ · ลงมือ · ประเมินผล', src: S('phak', '2-18') },
        ],
      },
      {
        t: 'compare',
        h: 'ตัดสินใจ 2 แบบ',
        a: { h: 'แบบวิเคราะห์', items: ['ใช้เมื่อมีเวลา', 'ไล่ DECIDE ทีละขั้น', 'รวบรวมข้อมูล ชั่งทางเลือก แล้วตรวจผล'] },
        b: { h: 'แบบอัตโนมัติ (Naturalistic)', items: ['ใช้เมื่อไม่มีเวลา เช่นเหตุฉุกเฉิน', 'ดูว่าคุ้นกับสถานการณ์ไหม แล้วนึกภาพว่าทางเลือกจะออกมาอย่างไร', 'เลือกทางแรกที่ใช้ได้ — ต้องอาศัยประสบการณ์และการฝึก'] },
      },
      {
        t: 'quote',
        h: 'เมื่อไม่มีเวลาวิเคราะห์',
        qs: [
          { q: 'Experienced pilots use naturalistic decision-making when the time available precludes a more formal analytical process.', th: 'ผู้มีประสบการณ์ตัดสินใจแบบอัตโนมัติ เมื่อเวลาไม่พอให้วิเคราะห์เต็มรูปแบบ', src: S('rmh', '8-3') },
          { q: '…naturalistic decision-making improves with training and experience, and it is not a replacement for memory items or a checklist procedure.', th: 'ดีขึ้นได้ด้วยการฝึกและประสบการณ์ แต่ไม่ได้แทนรายการที่ต้องจำหรือเช็กลิสต์', src: S('rmh', '8-3') },
        ],
      },
      {
        t: 'quote',
        h: '5 ทัศนคติอันตราย',
        qs: [
          { q: 'Studies have identified five hazardous attitudes that can interfere with the ability to make sound decisions and exercise authority properly: anti-authority, impulsivity, invulnerability, macho, and resignation.', th: 'ต่อต้านอำนาจ · หุนหัน · คิดว่าไม่เกิดกับตัวเอง · อวดเก่ง · ยอมแพ้', src: S('phak', '2-5') },
          { q: 'Recognition of hazardous thoughts is the first step toward neutralizing them. After recognizing a thought as hazardous, the pilot should label it as hazardous, then state the corresponding antidote. Antidotes should be memorized for each of the hazardous attitudes so they automatically come to mind when needed.', th: 'รู้ทันก่อน แล้วเรียกชื่อว่าอันตราย จากนั้นพูดคำแก้ — จำคำแก้ไว้ให้นึกออกเอง', src: S('phak', '2-5') },
        ],
      },
      {
        t: 'widget', w: 'attitude',
        h: '5 ทัศนคติอันตราย กับคำแก้',
        cap: 'แตะทัศนคติทางซ้าย แล้วแตะคำแก้ที่คู่กันทางขวา — FAA ให้จำคำแก้ไว้พูดกับตัวเอง',
      },
      {
        t: 'quiz',
        q: 'เพื่อนนักบินพูดว่า "อากาศแบบนี้บินมาหลายรอบแล้ว ไม่เคยเป็นอะไร" — ทัศนคติไหน',
        opts: ['ต่อต้านอำนาจ (Anti-authority)', 'คิดว่าไม่เกิดกับตัวเอง (Invulnerability)', 'ยอมแพ้ (Resignation)'],
        a: 1,
        why: 'ความเชื่อว่าอุบัติเหตุเกิดกับคนอื่น ไม่ใช่ตัวเอง คือ Invulnerability คำแก้คือ "เกิดกับฉันได้"',
      },
      {
        t: 'quiz',
        q: 'ขั้นสุดท้ายของ DECIDE คืออะไร',
        opts: ['Do — ลงมือทำ', 'Evaluate — ประเมินผลของสิ่งที่ทำ', 'Estimate — ประเมินว่าต้องทำไหม'],
        a: 1,
        why: 'หลังลงมือ ต้องประเมินว่าได้ผลไหม ถ้าไม่ได้ผลตามที่ต้องการ ให้วนกระบวนการใหม่ DECIDE จึงเป็นวงจร ไม่ใช่เส้นตรง',
      },
      {
        t: 'quote',
        h: 'ตั้งขีดไว้ก่อน แล้วเรียนจากความพลาด',
        qs: [
          { q: 'Pilots who practice effective risk management have predetermined personal minimums and have formed habit patterns and checklists to incorporate them.', th: 'ผู้จัดการความเสี่ยงได้ดีตั้งขีดจำกัดของตัวเองไว้ล่วงหน้า และทำจนเป็นนิสัย', src: S('rmh', 'ii') },
          { q: 'Mistakes and judgment errors are inevitable; the most important thing is for you to recognize, analyze, and learn from them before your next flight.', th: 'ความพลาดเลี่ยงไม่ได้ สิ่งสำคัญคือรู้ วิเคราะห์ และเรียนรู้ก่อนเที่ยวบินถัดไป', src: S('phak', '2-18') },
        ],
      },
      {
        t: 'brief',
        h: 'ใช้ในบรีฟวันนี้',
        items: [
          'ตั้งจุดตัดสินใจไว้ก่อนบิน เช่น ฐานเมฆต่ำกว่าเท่าไรให้กลับ',
          'ได้ยินคำพูดแบบทัศนคติอันตราย ทักด้วยคำแก้',
          'หลังบิน ทบทวนสั้น ๆ ว่าตัดสินใจตรงไหนดี ตรงไหนพลาด',
        ],
      },
    ],
  },

  {
    id: 'sd',
    short: 'หลงสภาพการบิน',
    title: 'หลงสภาพการบิน (Spatial Disorientation)',
    icon: 'horizon',
    color: 'violet',
    mins: 12,
    tip: 'หูชั้นในจับการหมุนที่ช้ากว่าราว 2 องศาต่อวินาทีไม่ได้ — เลี้ยวช้า ๆ จึงรู้สึกเหมือนบินตรง',
    take: [
      'ไม่เห็นขอบฟ้า ความรู้สึกเชื่อไม่ได้ — ฝึกบินด้วยเครื่องวัดให้คล่อง แล้วเชื่อเครื่องวัด สแกนโดยขยับศีรษะให้น้อย',
      'ป่วย ยา แอลกอฮอล์ ความล้า อดนอน และขาดออกซิเจนเล็กน้อย ทำให้หลงง่ายขึ้น',
      'ถ้าบินสองคน คนที่เริ่มหลงส่งการบังคับให้อีกคน — เพราะสองคนไม่ค่อยเจอภาพลวงพร้อมกัน',
    ],
    refs: [
      { t: 'FAA PHAK (FAA-H-8083-25C) บทที่ 17 Aeromedical Factors', u: `${DOC.phak.u}#page=423` },
      { t: 'FAA AC 60-4A (1983) Pilot’s Spatial Disorientation', u: DOC.ac604.u },
      { t: 'FAA — Spatial Disorientation (GA Safety Topic)', u: DOC.sdbro.u },
      { t: 'DoD HFACS 8.0 — PC321 Spatial Disorientation', u: `${DOC.dod8.u}#page=14` },
      { t: 'SKYbrary — Spatial Disorientation', u: 'https://skybrary.aero/articles/spatial-disorientation', n: 'เล่าความ ไม่ยกคำพูด' },
    ],
    slides: [
      {
        t: 'title',
        h: 'ร่างกายบอกว่าบินตรง เครื่องวัดบอกว่าเอียง',
        sub: 'สมองรวมข้อมูล 3 ทาง: ตา หูชั้นใน และความรู้สึกจากผิว กล้ามเนื้อ ข้อต่อ — ตอนเห็นขอบฟ้าตาชนะ แต่เมื่อเข้าเมฆหรือกลางคืน ความรู้สึกที่ผิดทำให้หลงได้',
      },
      {
        t: 'quote',
        h: 'นิยาม',
        qs: [
          { q: 'Spatial disorientation specifically refers to the lack of orientation with regard to the position, attitude, or movement of the airplane in space.', src: S('phak', '17-6') },
          { q: 'Spatial disorientation to a pilot means simply the inability to tell which way is “up.”', src: S('ac604', 1) },
        ],
      },
      {
        t: 'quote',
        h: 'ทำไมเมฆและกลางคืนอันตราย',
        qs: [
          { q: 'Under normal flight conditions, when there is a visual reference to the horizon and ground, the sensory system in the inner ear helps to identify the pitch, roll, and yaw movements of the aircraft. When visual contact with the horizon is lost, the vestibular system becomes unreliable. Without visual references outside the aircraft, there are many situations in which combinations of normal motions and forces create convincing illusions that are difficult to overcome.', th: 'เห็นขอบฟ้า หูชั้นในช่วยได้ — ไม่เห็นขอบฟ้า หูชั้นในเชื่อไม่ได้ และภาพลวงสมจริงจนแก้ยาก', src: S('phak', '17-6') },
          { q: 'However, the body cannot distinguish between acceleration forces due to gravity and those resulting from maneuvering the aircraft, which can lead to sensory illusions and false impressions of an aircraft’s orientation and movement.', th: 'ร่างกายแยกแรงโน้มถ่วงกับแรงจากการบังคับเครื่องไม่ออก', src: S('phak', '17-6') },
        ],
      },
      {
        t: 'cards',
        h: 'ระบบรับรู้ทิศทาง 3 ระบบ',
        items: [
          { b: 'ตา', s: 'Visual', t: 'ดูขอบฟ้าและพื้น เป็นแหล่งหลักเมื่อมองเห็น และมักชนะความรู้สึกที่ผิด' },
          { b: 'หูชั้นใน', s: 'Vestibular', t: 'ท่อครึ่งวงกลม 3 ท่อจับการหมุน (roll pitch yaw) ส่วน otolith จับแรงโน้มถ่วงและความเร่งเชิงเส้น' },
          { b: 'กาย', s: 'Somatosensory', t: '"Seat of the pants" จากผิว กล้ามเนื้อ ข้อต่อ แยกแรงโน้มถ่วงกับแรงจากการบังคับเครื่องไม่ออก' },
        ],
      },
      {
        t: 'widget',
        w: 'leans',
        h: 'หูชั้นในหลอกเราได้อย่างไร',
        cap: 'แตะทีละช่วง เทียบท่าจริงของเครื่องกับที่หูชั้นในรู้สึก — ตาม FAA PHAK รูป 17-4',
      },
      {
        t: 'quote',
        h: 'หูชั้นในมีจุดบอด',
        qs: [
          { q: 'The reason a pilot can be unaware of such a gradual turn is that human exposure to a rotational acceleration of 2 degrees per second or lower is below the detection threshold of the semicircular canals.', th: 'หมุนช้ากว่าราว 2 องศาต่อวินาที ท่อครึ่งวงกลมจับไม่ได้', src: S('phak', '17-7') },
          { q: 'Leveling the wings after such a turn may cause an illusion that the aircraft is banking in the opposite direction.', th: 'ปรับปีกตรงหลังเลี้ยวแบบนั้น จะรู้สึกว่าเอียงไปอีกด้าน (the leans)', src: S('phak', '17-7') },
        ],
      },
      {
        t: 'chart', kind: 'hbar',
        h: 'ภาพลวงที่นักบินรายงานว่าเคยเจอเอง',
        max: 100,
        rows: [
          { l: 'had a sensation that one wing was low although wings were level', th: 'รู้สึกว่าปีกข้างหนึ่งต่ำ ทั้งที่ปีกตรง', v: 60 },
          { l: 'on leveling after banking, tended to bank in opposite direction', th: 'ปรับปีกตรงหลังเอียง แล้วเผลอเอียงไปอีกด้าน', v: 45 },
          { l: 'felt as if straight and level when in a turn', th: 'กำลังเลี้ยว แต่รู้สึกว่าบินตรงระดับ', v: 39 },
          { l: 'had become confused in attempting to mix “contact” and instrument cues', th: 'สับสนเมื่อใช้ทั้งการมองข้างนอกและเครื่องวัดปนกัน', v: 34 },
          { l: 'on recovery from steep climbing turn, felt to be turning in opposite direction', th: 'ออกจากการไต่เลี้ยวชัน แล้วรู้สึกว่าเลี้ยวไปอีกทาง', v: 29 },
        ],
        cap: 'ร้อยละของนักบินที่ตอบว่าเคยเจอเอง — ตอบได้หลายข้อ ผลรวมจึงไม่เท่ากับ 100 · เอกสารปี 1983 ไม่ระบุจำนวนผู้ตอบ',
        src: S('ac604', 1),
      },
      {
        t: 'stats',
        h: 'ขนาดของปัญหา',
        items: [
          { n: 'เกือบ 500', t: 'อุบัติเหตุจากหลงสภาพการบินในสหรัฐฯ ช่วง 5 ปี', q: 'During a recent 5-year period, there were almost 500 spatial disorientation accidents in the United States.', src: S('ac604', 1) },
          { n: '>90%', t: 'ของเหตุเหล่านี้มีผู้เสียชีวิต', q: 'Tragically, such accidents resulted in fatalities over 90 percent of the time.', src: S('ac604', 1) },
          { n: '35 วินาที', t: 'เวลาที่นักบินซึ่งมีคุณวุฒิบินด้วยเครื่องวัดอาจต้องใช้ กว่าจะคุมเครื่องด้วยเครื่องวัดได้เต็มที่ หลังเสียการมองเห็นพื้น', q: 'Tests conducted with qualified instrument pilots indicate that it can take as much as 35 seconds to establish full control by instruments after the loss of visual reference with the surface.', src: S('ac604', 1) },
        ],
        cap: 'ตัวเลขจากเอกสารปี 1983 ใช้แสดงขนาดของปัญหา ไม่ใช่สถิติปัจจุบัน',
      },
      {
        t: 'quote',
        h: 'อะไรทำให้เสี่ยงขึ้น',
        qs: [
          { q: 'NTSB accident data suggests that spatial disorientation may be a precursor to many general aviation accidents — particularly in night or limited visibility weather conditions.', th: 'ข้อมูล NTSB ชี้ว่าหลงสภาพการบินอาจนำไปสู่อุบัติเหตุจำนวนมาก โดยเฉพาะกลางคืนหรือทัศนวิสัยจำกัด', src: S('sdbro', 1) },
          { q: 'Remember that illness, medication, alcohol, fatigue, sleep loss, and mild hypoxia are likely to increase susceptibility to spatial disorientation.', th: 'ป่วย ยา แอลกอฮอล์ ความล้า อดนอน ขาดออกซิเจนเล็กน้อย — หลงง่ายขึ้น', src: S('phak', '17-10') },
        ],
      },
      {
        t: 'cards',
        h: 'ภาพลวงที่พบบ่อย',
        flip: true,
        cap: 'แตะการ์ดเพื่อดูว่าเกิดอะไร และนักบินมักทำอะไรผิด',
        items: [
          { b: 'เอียงหลอก', s: 'The leans', t: 'ปรับปีกตรงหลังเลี้ยวช้า ๆ มานาน รู้สึกว่าเอียงไปอีกด้าน จึงเอนตัวหรือเลี้ยวกลับ — พบบ่อยที่สุด' },
          { b: 'เกลียวมรณะ', s: 'Graveyard spiral', t: 'เลี้ยวค้างจนรู้สึกว่าบินตรงแต่ความสูงลด ดึงคันบังคับจะยิ่งเลี้ยวแคบและเสียความสูง' },
          { b: 'โคริโอลิส', s: 'Coriolis illusion', t: 'เลี้ยวค้างแล้วขยับศีรษะต่างระนาบ เช่นก้มหยิบของ รู้สึกหมุนในแกนอื่น' },
          { b: 'เร่งแล้วรู้สึกเชิด', s: 'Somatogravic', t: 'เร่งเร็ว เช่นตอนวิ่งขึ้น รู้สึกว่าหัวเชิด อาจกดหัวลง — ลดความเร็วเร็วให้ผลตรงข้าม' },
          { b: 'ตีลังกาหลอก', s: 'Inversion illusion', t: 'เปลี่ยนจากไต่เป็นบินระดับทันที รู้สึกเหมือนตีลังกาไปข้างหลัง อาจกดหัวลงแรง' },
          { b: 'ลิฟต์หลอก', s: 'Elevator illusion', t: 'ถูกลมยกขึ้นกะทันหัน รู้สึกว่ากำลังไต่ อาจกดหัวลง — ลมกดลงให้ผลตรงข้าม' },
          { b: 'ขอบฟ้าลวง', s: 'False horizon', t: 'เมฆลาด ไฟบนพื้นปนกับดาว หรือแนวไฟบนพื้น ทำให้จัดเครื่องตามขอบฟ้าที่ผิด' },
          { b: 'ไฟเคลื่อนหลอก', s: 'Autokinesis', t: 'จ้องไฟดวงเดียวในที่มืดนาน ไฟดูเหมือนเคลื่อน นักบินอาจบินตามจนเสียการควบคุม' },
        ],
      },
      {
        t: 'quiz',
        q: 'เลี้ยวค้างในเมฆนาน เห็นความสูงลดทั้งที่รู้สึกว่าบินตรง จึงดึงคันบังคับเพื่อไต่ — จะเกิดอะไร',
        opts: ['เครื่องไต่กลับสู่ความสูงเดิม', 'วงเลี้ยวแคบลงและเสียความสูงมากขึ้น', 'ไม่มีผล เพราะเครื่องบินตรงอยู่แล้ว'],
        a: 1,
        why: 'ปีกยังเอียงอยู่ การดึงคันบังคับจึงทำให้วงเลี้ยวแคบลงและเสียความสูงเพิ่ม (graveyard spiral) ต้องเชื่อเครื่องวัด และปรับปีกให้ตรงก่อน',
      },
      {
        t: 'quiz',
        q: 'ทำไม FAA แนะนำให้สแกนเครื่องวัดโดยขยับศีรษะให้น้อย',
        opts: ['ลดความล้าของคอ', 'ลดโอกาสเกิดภาพลวงแบบโคริโอลิส', 'อ่านเครื่องวัดได้เร็วขึ้น'],
        a: 1,
        why: 'ระหว่างเลี้ยวค้าง การขยับศีรษะต่างระนาบทำให้หูชั้นในส่งสัญญาณผิด จนรู้สึกหมุนในแกนอื่น',
      },
      {
        t: 'quote',
        h: 'FAA ให้ทำอะไร',
        qs: [
          { q: 'Most importantly, become proficient in the use of flight instruments and rely upon them. Trust the instruments and disregard your sensory perceptions.', src: S('phak', '17-10') },
          { q: 'Accidents usually happen as a result of a pilot’s indecision to rely on the instruments.', src: S('sdbro', 2) },
          { q: 'If you are one of two pilots in an aircraft and you begin to experience a visual illusion, transfer control of the aircraft to the other pilot, since pilots seldom experience visual illusions at the same time.', src: S('sdbro', 2) },
        ],
      },
      {
        t: 'brief',
        h: 'ใช้ในบรีฟวันนี้',
        items: [
          'บรีฟช่วงที่อาจไม่เห็นขอบฟ้า: เมฆ กลางคืน ฝุ่น หรือบินเหนือน้ำ',
          'ตกลงคำทักเมื่อท่าเครื่องไม่ตรงกับที่ควร และใครจะรับบังคับ — FAA ชี้ว่านักบินสองคนไม่ค่อยเจอภาพลวงพร้อมกัน',
          'รู้สึกแปลกเมื่อไร กลับไปที่เครื่องวัด อย่าเชื่อร่างกาย',
        ],
      },
    ],
  },

  {
    id: 'fatigue',
    short: 'ความล้า',
    title: 'ความล้า (Fatigue)',
    icon: 'moon',
    color: 'grey',
    mins: 12,
    tip: 'ตื่นติดต่อกัน 17–19 ชั่วโมง ผลทดสอบบางอย่างแย่เท่าหรือแย่กว่าตอนมีแอลกอฮอล์ในเลือด 0.05%',
    take: [
      'ความล้าลดสมาธิ การประสานงาน และการสื่อสาร — การฝึกหรือประสบการณ์ชดเชยไม่ได้',
      'ช่วง 03:00–05:00 ร่างกายตื่นตัวต่ำที่สุด (WOCL) และราว 02:00–04:00 โอกาสผิดพลาดเพิ่มมากที่สุด (FAA AC 120-100)',
      'คนประเมินความง่วงของตัวเองต่ำกว่าจริง — วางแผนนอน งีบ พักเป็นช่วง และบอกทีมเมื่อรู้ตัวว่าล้า',
    ],
    refs: [
      { t: 'FAA AC 120-100 (2010) Basics of Aviation Fatigue', u: DOC.ac120.u },
      { t: 'FAA PHAK (FAA-H-8083-25C) หน้า 17-13 Fatigue', u: `${DOC.phak.u}#page=435` },
      { t: 'NTSB 1994 — Safety Rec. A-94-1 to -5', u: DOC.ntsb94.u },
      { t: 'DoD HFACS 8.0 — PC307 Fatigue', u: `${DOC.dod8.u}#page=13` },
      { t: 'Williamson & Feyer 2000 — Occup Environ Med', u: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC1739867/', n: 'เล่าความ ไม่ยกคำพูด' },
      { t: 'Dawson & Reid 1997 — Nature 388:235', u: 'https://doi.org/10.1038/40775', n: 'เล่าความ ไม่ยกคำพูด' },
      { t: 'SKYbrary — Fatigue', u: 'https://skybrary.aero/articles/fatigue', n: 'เล่าความ ไม่ยกคำพูด' },
    ],
    slides: [
      {
        t: 'title',
        h: 'ล้าแล้ว ฝึกมาแค่ไหนก็ชดเชยไม่ได้',
        sub: 'FAA ระบุว่าถ้าความล้าเกิดในห้องนักบิน การฝึกหรือประสบการณ์เท่าไรก็ชดเชยไม่ได้ วิธีป้องกันคือการพักผ่อนให้พอ',
        stat: { n: '17–19 ชม.', t: 'ตื่นติดต่อกันเท่านี้ ผลทดสอบบางอย่างเท่ากับหรือแย่กว่าแอลกอฮอล์ในเลือด 0.05% (Williamson & Feyer 2000)' },
      },
      {
        t: 'quote',
        h: 'นิยาม',
        qs: [
          { q: 'The traditional definition of fatigue is a physiological state in which there is a decreased capacity to perform cognitive tasks and an increased variability in performance.', th: 'ความล้า = สภาพที่ความสามารถทางความคิดลดลง และผลงานแกว่งมากขึ้น', src: S('ac120', 3) },
          { q: 'Fatigue is frequently associated with pilot error. Some of the effects of fatigue include degradation of attention and concentration, impaired coordination, and decreased ability to communicate.', th: 'ความล้าลดสมาธิ การประสานงาน และการสื่อสาร', src: S('phak', '17-13') },
        ],
      },
      {
        t: 'compare',
        h: 'ล้า 2 แบบ',
        a: { h: 'ล้าเฉียบพลัน (Acute)', items: ['ระยะสั้น จากออกแรงหนัก ตื่นเต้น หรืออดนอน', 'หายด้วยการพัก และนอนหลับสนิทราว 8 ชั่วโมง', 'ถ้ากำลังล้า อยู่บนพื้น อย่าขึ้นบิน'] },
        b: { h: 'ล้าเรื้อรัง (Chronic)', items: ['ต่อเนื่องนาน มักมาจากความเครียดสะสม', 'พักหรือนอนอย่างเดียวไม่หาย', 'ควรพบแพทย์'] },
      },
      {
        t: 'chart', kind: 'clock',
        h: 'นาฬิกาชีวภาพ: ช่วงที่ตื่นตัวต่ำ',
        rows: [
          { l: 'ช่วงตื่นตัวต่ำ (WOCL)', z: [{ a: 3, b: 5, t: 'ง่วงที่สุด สมรรถภาพต่ำสุด', k: 'bad' }, { a: 15, b: 17, t: 'ช่วงบ่าย', k: 'warn' }] },
          { l: 'ความเสี่ยงผิดพลาด', z: [{ a: 2, b: 4, t: 'เพิ่มขึ้นมากที่สุด', k: 'bad' }, { a: 14, b: 16, t: 'เพิ่มขึ้น', k: 'warn' }] },
        ],
        cap: 'แผนภาพประกอบ ไม่ใช่ข้อมูลวัด · แถวบนจากหน้า 2 แถวล่างจากหน้า 7 · สำหรับคนที่นอนกลางคืนตามปกติ',
        src: S('ac120', 2),
      },
      {
        t: 'quote',
        h: 'ช่วงเวลาที่ต้องระวัง',
        qs: [
          { q: 'One occurs at night, roughly from 3 a.m. to 5 a.m., a time when physiological sleepiness is greatest and performance capabilities are lowest. The other is in the afternoon, roughly from 3 p.m. to 5 p.m.', th: 'ช่วงตื่นตัวต่ำมี 2 ช่วง: ราว 03:00–05:00 (หนักที่สุด) และราว 15:00–17:00', src: S('ac120', 2) },
          { q: '…an increase in error rates and accident likelihood often occurs in the early afternoon, between 2 p.m. and 4 p.m. It is followed by a much larger increase in risk in the early morning hours between 2 a.m. and 4 a.m.', th: 'ความผิดพลาดและอุบัติเหตุเพิ่มช่วง 14:00–16:00 และเพิ่มมากกว่านั้นช่วง 02:00–04:00', src: S('ac120', 7) },
        ],
      },
      {
        t: 'widget',
        w: 'awake',
        h: 'ตื่นมานานแค่ไหนแล้ว',
        cap: 'เลื่อนแถบ (สมมุติตื่น 06:00) — ตัวเลขมาจากงานวิจัยในห้องทดลอง ไม่ใช่เกณฑ์ของหน่วย',
      },
      {
        t: 'stats',
        h: 'นอนน้อย ตื่นนาน ทำงานยาว',
        items: [
          { n: '18–20 ชม.', t: 'ตื่นต่อเนื่องเท่านี้ สมรรถภาพและความตื่นตัวเริ่มลดลง', q: 'Performance and alertness begin to deteriorate after 18-20 hours of continuous wakefulness', src: S('ac120', 13) },
          { n: '5 ชม. × 4 คืน', t: 'นอนคืนละ 5 ชั่วโมงแทน 8 ติดกัน 4 คืน ผลอาจแย่เท่ากับอดนอน 40 ชั่วโมง', q: 'For example, 4 days of sleep restriction from 8 hours to 5 hours sleep per night can lead to performance changes as severe as that produced by 40 hours of total sleep deprivation.', src: S('ac120', 7) },
          { n: '2 ชม.', t: 'นอนขาดวันละเท่านี้ก็ทำให้สมรรถภาพและความตื่นตัวลดลงได้', q: 'As little as 2 hours of sleep loss a day can result in impaired performance and alertness', src: S('ac120', 7) },
          { n: '8 ชม.', t: 'ทำงานต่อเนื่องเกินนี้ โอกาสผิดพลาดและอุบัติเหตุเพิ่มขึ้น', q: 'Studies show that after 8 hours of uninterrupted work, chances of error and accidents increase.', src: S('ac120', 8) },
        ],
      },
      {
        t: 'quote',
        h: 'อุบัติเหตุจริง: ลูกเรือที่ตื่นนานกว่าพลาดมากกว่า',
        qs: [
          { q: 'In the accidents examined in the Board\'s study, half the captains for whom data were available had been awake for more than 12 hours prior to their accidents. Half the first officers had been awake more than 11 hours.', th: 'ในอุบัติเหตุที่ NTSB ศึกษา ครึ่งหนึ่งของกัปตันตื่นมาเกิน 12 ชั่วโมง ครึ่งหนึ่งของนักบินผู้ช่วยเกิน 11 ชั่วโมง', src: S('ntsb94', 16) },
          { q: 'Crews comprising captains and first officers whose time since awakening was above the median for their crew position made more errors overall, and significantly more procedural and tactical decision errors.', th: 'ลูกเรือที่ตื่นนานกว่าค่ากลาง พลาดมากกว่า โดยเฉพาะด้านขั้นตอนและการตัดสินใจ', src: S('ntsb94', 16) },
        ],
      },
      {
        t: 'quote',
        h: 'รู้ตัวไม่ทัน',
        qs: [
          { q: 'People are not the best evaluators of their own alertness state. People can lose awareness of their own fatigue levels. They are often sleepier than they report.', th: 'คนมักง่วงกว่าที่ตัวเองบอก', src: S('ac120', 7) },
          { q: '…research has shown that these subjective estimates are unreliable', th: 'การประเมินความง่วงของตัวเองเชื่อถือไม่ได้', src: S('ac120', 7) },
        ],
      },
      {
        t: 'points',
        h: 'สัญญาณว่าเริ่มล้า',
        items: [
          { b: 'ตอบสนองช้าลง', t: 'สั่งการ ตอบวิทยุ หรือแก้เหตุผิดปกติช้ากว่าปกติ' },
          { b: 'พลาดสิ่งที่ปกติไม่พลาด', t: 'ไม่ได้ยินคำเรียกทางวิทยุ ข้ามขั้นตอน' },
          { b: 'ทักษะเพี้ยน', t: 'จังหวะการบังคับไม่ต่อเนื่อง และมองแคบลง ลืมมองรอบ ๆ' },
          { b: 'หลับในชั่วขณะ', t: 'หลับไปไม่กี่วินาที (micro-sleep) โดยไม่รู้ตัว' },
        ],
      },
      {
        t: 'quiz',
        q: 'ตื่นตั้งแต่ 06:00 แล้วมีภารกิจที่จะลงจอดราว 03:00 ของวันถัดไป — ข้อใดถูก',
        opts: ['ตอนลงจอดตื่นมาแล้ว 21 ชั่วโมง และอยู่ในช่วงที่ร่างกายตื่นตัวน้อยที่สุด', 'ไม่มีปัญหา ถ้าดื่มกาแฟก่อนลงจอด', 'เสี่ยงก็ต่อเมื่ออากาศไม่ดี'],
        a: 0,
        why: 'ตื่นนานเกิน 17–19 ชั่วโมงแล้ว และ 03:00 อยู่ในช่วง 03:00–05:00 ที่ร่างกายตื่นตัวต่ำที่สุด (WOCL) ควรวางแผนนอนก่อนภารกิจ หรือปรับตาราง',
      },
      {
        t: 'quiz',
        q: 'ข้อใดเป็นวิธีรับมือความล้าที่ SKYbrary แนะนำ',
        opts: ['เก็บไว้ไม่บอกใคร จะได้ไม่เสียภารกิจ', 'บอกเพื่อนร่วมทีมเมื่อรู้ตัวว่าง่วง', 'รับงานเพิ่มเพื่อให้ตัวเองตื่น'],
        a: 1,
        why: 'การบอกเพื่อนร่วมทีมว่าง่วง ทำให้ทีมช่วยเฝ้าระวังได้ — ใช้คู่กับการวางแผนนอน และการงีบเมื่อทำได้',
      },
      {
        t: 'quote',
        h: 'วิธีรับมือที่ FAA ระบุ',
        qs: [
          { q: 'Even short naps of 25-30 minutes can have beneficial effects.', th: 'งีบสั้น ๆ 25–30 นาทีก็ช่วยได้', src: S('ac120', 13) },
          { q: 'Providing short breaks from work can greatly attenuate this effect', th: 'พักสั้น ๆ เป็นช่วงช่วยลดผลของการทำงานต่อเนื่องได้มาก', src: S('ac120', 8) },
          { q: 'Getting adequate rest is the only way to prevent fatigue from occurring.', th: 'พักผ่อนให้พอเป็นทางเดียวที่ป้องกันความล้าได้', src: S('phak', '17-13') },
        ],
      },
      {
        t: 'brief',
        h: 'ใช้ในบรีฟวันนี้',
        items: [
          'ถามทุกคน: ตื่นมากี่ชั่วโมงแล้ว และจะลงจอดกี่โมง',
          'ภารกิจที่คร่อมช่วงราว 02:00–05:00 วางแผนนอนก่อน และตรวจซ้ำกันมากขึ้น',
          'ใครล้า พูดได้ในบรีฟ ไม่ถือว่าเสียหน้า',
        ],
      },
    ],
  },
];
