# แหล่งที่มา — บทเรียนทฤษฎีนิรภัย (11 บท)

ไฟล์นี้สร้างจาก `app/lessons.js` — ถ้าแก้คำพูดหรือเลขหน้าใน lessons.js ให้สร้างไฟล์นี้ใหม่

## หลักการ
- **ยกข้อความต้นฉบับภาษาอังกฤษคำต่อคำ** เฉพาะเอกสารของหน่วยงานรัฐบาลกลางสหรัฐฯ (FAA, NTSB, DoD) ซึ่งเป็นสาธารณสมบัติตาม 17 U.S.C. §105 — ทุกคำพูดมีเลขหน้า
- **แหล่งอื่น** (SKYbrary, ICAO, บทความในวารสาร) **เล่าความเป็นภาษาไทยเท่านั้น ไม่ยกคำพูด** — ในหน้าจบบทมีเครื่องหมาย † กำกับ
- ลิงก์ใช้ `#page=` = ลำดับหน้าใน PDF · ป้ายที่ผู้เรียนเห็นใช้ **เลขหน้าที่พิมพ์** บนกระดาษ (สองค่านี้ต่างกันในบางเล่ม ดูคอลัมน์ "ออฟเซ็ต")
- `…` ในคำพูด = ตัดข้อความช่วงต้น กลาง หรือท้ายออก ไม่เปลี่ยนคำ
- ตัวเลขสถิติเป็นของการบินพลเรือนสหรัฐฯ หรือของ DoD ตามที่ระบุ ไม่ใช่สถิติของ ทอ.
- ตัวอย่างในภาพโต้ตอบและคำถามเป็นสถานการณ์สมมุติ ไม่ใช่เหตุการณ์จริงของหน่วย

## วิธีตรวจ
- `verq.py` เทียบทุกคำพูดกับข้อความที่สกัดจาก PDF ฉบับที่ลิงก์ชี้ ในหน้า `#page=N` (หรือหน้า N+1 เมื่อประโยคข้ามหน้า) โดยตัดเครื่องหมายและช่องว่างออกก่อนเทียบ และแยกตรวจทีละช่วงเมื่อมี `…`
- ชื่อการ์ดภาษาอังกฤษ (คอลัมน์ "ชื่อการ์ด") ตรวจว่าอยู่ในข้อความของเอกสารที่คำบรรยายสไลด์อ้าง
- แถวในกราฟจากตาราง (AM-06/18, AC 60-4A) ตรวจว่าชื่อหมวดและตัวเลขทุกตัวอยู่บนหน้านั้น
- ผล 16 ต.ค. 2026: **171/171 ผ่าน** (คำพูด 157 + แถวกราฟ 14) — 4 รายการ (AC 60-4A ×2, NTSB A-94-1…5 หน้า 16 ×2) PDF เป็นภาพสแกนที่ OCR อ่านเพี้ยน จึงตรวจจากภาพหน้ากระดาษแทน (ทำเครื่องหมาย 🔍 ในตาราง)

## บรรณานุกรม
| เอกสาร | การอ้างอิงฉบับเต็ม | การใช้ | ออฟเซ็ต (หน้า PDF) | URL |
|---|---|---|---|---|
| PHAK | Federal Aviation Administration. (2023). *Pilot's Handbook of Aeronautical Knowledge* (FAA-H-8083-25C), Chapter 2: Aeronautical Decision-Making และ Chapter 17: Aeromedical Factors. | ยกคำพูด | 2-N → PDF 39 + N · 17-N → PDF 422 + N | https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/faa-h-8083-25c.pdf |
| AMT Handbook | Federal Aviation Administration. (2023). *Aviation Maintenance Technician Handbook—General* (FAA-H-8083-30B), Chapter 14: Human Factors. | ยกคำพูด | 14-N → PDF 623 + N | https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/amtg_handbook.pdf |
| Risk Management Handbook | Federal Aviation Administration. (2022). *Risk Management Handbook* (FAA-H-8083-2A). | ยกคำพูด | บท c หน้า c-N → PDF (9, 12, 18, 33, 38, 43, 49, 53 สำหรับบท 1–8) + N · หน้า ii → PDF 4 | https://www.faa.gov/sites/faa.gov/files/2022-06/risk_management_handbook_2A.pdf |
| AC 120-51E | Federal Aviation Administration. (2004, 22 January). *Crew Resource Management Training* (Advisory Circular 120-51E). | ยกคำพูด | ตรงกัน · Appendix 1 หน้า N → PDF 16 + N | https://www.faa.gov/documentLibrary/media/Advisory_Circular/AC120-51e.pdf |
| AC 120-90 | Federal Aviation Administration. (2006, 27 April). *Line Operations Safety Audits* (Advisory Circular 120-90). | ยกคำพูด | ตรงกัน · Appendix 1 หน้า N → PDF 16 + N | https://www.faa.gov/documentLibrary/media/Advisory_Circular/AC_120-90.pdf |
| AM-00/7 | Shappell, S. A., & Wiegmann, D. A. (2000, February). *The Human Factors Analysis and Classification System—HFACS* (DOT/FAA/AM-00/7). FAA Office of Aviation Medicine. | ยกคำพูด | หน้าที่พิมพ์ + 4 | https://www.faa.gov/sites/faa.gov/files/data_research/research/med_humanfacs/oamtechreports/00_07.pdf |
| AM-01/3 | Wiegmann, D. A., & Shappell, S. A. (2001, February). *A Human Error Analysis of Commercial Aviation Accidents Using the Human Factors Analysis and Classification System (HFACS)* (DOT/FAA/AM-01/3). FAA Office of Aerospace Medicine. | ยกคำพูด | + 6 | https://www.faa.gov/sites/faa.gov/files/data_research/research/med_humanfacs/oamtechreports/0103.pdf |
| AM-06/18 | Shappell, S., Detwiler, C., Holcomb, K., Hackworth, C., Boquet, A., & Wiegmann, D. (2006, July). *Human Error and Commercial Aviation Accidents: A Comprehensive, Fine-Grained Analysis Using HFACS* (DOT/FAA/AM-06/18). FAA Office of Aerospace Medicine. | ยกคำพูด + กราฟ | + 4 | https://www.faa.gov/sites/faa.gov/files/data_research/research/med_humanfacs/oamtechreports/200618.pdf |
| DoD HFACS 8.0 | U.S. Department of Defense. (2022, 25 May; corrected 27 Sep 2023). *Human Factors Analysis and Classification System (DoD HFACS) version 8.0*. DoD Human Factors Working Group / Joint Service Safety Council. | ยกคำพูด | + 1 | https://www.safety.af.mil/Portals/71/documents/Human%20Factors/DoD%20HFACS%208.0%20Guide%20-%2020230927%20Corrected%20sm.pdf |
| AC 60-4A | Federal Aviation Administration. (1983, 9 February). *Pilot's Spatial Disorientation* (Advisory Circular 60-4A). | ยกคำพูด + กราฟ | ตรงกัน | https://www.faa.gov/sites/faa.gov/files/2022-11/AC60-4A.pdf |
| FAA SD topic | FAA Safety Briefing / General Aviation Joint Steering Committee. *Spatial Disorientation* (GA Safety Enhancement Topic). ไม่ระบุปีในเอกสาร (ไฟล์อยู่ในโฟลเดอร์ 2022-01 บนเว็บ FAA) | ยกคำพูด | ตรงกัน | https://www.faa.gov/sites/faa.gov/files/2022-01/Spatial%20Disorientation.pdf |
| AC 120-100 | Federal Aviation Administration. (2010, 7 June). *Basics of Aviation Fatigue* (Advisory Circular 120-100). | ยกคำพูด + กราฟ | ตรงกัน | https://www.faa.gov/documentLibrary/media/Advisory_Circular/AC%20120-100.pdf |
| NTSB A-94-1…5 | National Transportation Safety Board. (1994, 3 February). *Safety Recommendation A-94-1 through -5* (letter to the FAA Administrator). | ยกคำพูด | ตรงกัน | https://www.ntsb.gov/safety/safety-recs/recletters/A94_1_5.pdf |
| SKYbrary — James Reason HF Model | SKYbrary Aviation Safety. *James Reason HF Model*. | เล่าความ † | — | https://skybrary.aero/articles/james-reason-hf-model |
| Reason 1990 | Reason, J. (1990). The contribution of latent human failures to the breakdown of complex systems. *Philosophical Transactions of the Royal Society of London. B*, 327(1241), 475–484. | เล่าความ † | — | https://doi.org/10.1098/rstb.1990.0090 |
| SKYbrary — HFACS | SKYbrary Aviation Safety. *Human Factors Analysis and Classification System (HFACS)*. | เล่าความ † | — | https://skybrary.aero/articles/human-factors-analysis-and-classification-system-hfacs |
| SKYbrary — SHELL | SKYbrary Aviation Safety. *ICAO SHELL Model*. | เล่าความ † | — | https://skybrary.aero/articles/icao-shell-model |
| ICAO TEM 2005 | Maurino, D. (2005, April). *Threat and Error Management (TEM)*. ICAO Flight Safety and Human Factors Programme; Canadian Aviation Safety Seminar, Vancouver. | เล่าความ † | — | https://www.skybrary.aero/sites/default/files/bookshelf/515.pdf |
| SKYbrary — TEM | SKYbrary Aviation Safety. *Threat and Error Management (TEM) in Flight Operations*. | เล่าความ † | — | https://skybrary.aero/articles/threat-and-error-management-tem-flight-operations |
| SKYbrary — Dirty Dozen | SKYbrary Aviation Safety. *The Human Factors "Dirty Dozen"*. | เล่าความ † | — | https://skybrary.aero/articles/human-factors-dirty-dozen |
| SKYbrary — CRM | SKYbrary Aviation Safety. *Crew Resource Management (CRM)*. | เล่าความ † | — | https://skybrary.aero/articles/crew-resource-management-crm |
| SKYbrary — Authority Gradients | SKYbrary Aviation Safety. *Authority Gradients*. | เล่าความ † | — | https://skybrary.aero/articles/authority-gradients |
| SKYbrary — SA | SKYbrary Aviation Safety. *Situational Awareness*. | เล่าความ † | — | https://skybrary.aero/articles/situational-awareness |
| Endsley 1995 | Endsley, M. R. (1995). Toward a theory of situation awareness in dynamic systems. *Human Factors*, 37(1), 32–64. | เล่าความ † | — | https://doi.org/10.1518/001872095779049543 |
| SKYbrary — SD | SKYbrary Aviation Safety. *Spatial Disorientation*. | เล่าความ † | — | https://skybrary.aero/articles/spatial-disorientation |
| SKYbrary — Fatigue | SKYbrary Aviation Safety. *Fatigue*. | เล่าความ † | — | https://skybrary.aero/articles/fatigue |
| Williamson & Feyer 2000 | Williamson, A. M., & Feyer, A.-M. (2000). Moderate sleep deprivation produces impairments in cognitive and motor performance equivalent to legally prescribed levels of alcohol intoxication. *Occupational and Environmental Medicine*, 57(10), 649–655. | เล่าความ † | — | https://pmc.ncbi.nlm.nih.gov/articles/PMC1739867/ |
| Dawson & Reid 1997 | Dawson, D., & Reid, K. (1997). Fatigue, alcohol and performance impairment. *Nature*, 388, 235. | เล่าความ † | — | https://doi.org/10.1038/40775 |


## บท `swiss` — แบบจำลองสวิสชีส (10 นาที, 12 สไลด์ + หน้าจบบท)

**แหล่งอ้างอิงที่แสดงในหน้าจบบท**

- FAA AMT Handbook–General (FAA-H-8083-30B) หน้า 14-12 Swiss cheese model · https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/amtg_handbook.pdf#page=635
- FAA AC 120-51E (2004) หน้า 14 Monitoring and cross-checking · https://www.faa.gov/documentLibrary/media/Advisory_Circular/AC120-51e.pdf#page=14
- SKYbrary — James Reason HF Model — † เล่าความ ไม่ยกคำพูด · https://skybrary.aero/articles/james-reason-hf-model
- Reason, J. (1990) The contribution of latent human failures to the breakdown of complex systems — † เล่าความ ไม่ยกคำพูด · https://doi.org/10.1098/rstb.1990.0090

| สไลด์ | ชนิด | เอกสาร | หน้าที่พิมพ์ | หน้า PDF | ข้อความต้นฉบับ / ข้อมูล |
|---|---|---|---|---|---|
| 2 | คำพูด | FAA AMT Handbook–General (FAA-H-8083-30B) | 14-12 | 635 | …is often referred to as the Swiss cheese model and shows how various “holes” in different systems must be aligned in order for an error to occur. Only when the holes are all aligned can the incident take place. |
| 2 | คำพูด | FAA AMT Handbook–General (FAA-H-8083-30B) | 14-29 | 652 | An in-depth review of an aviation incident reveals time and again that a series of human errors (known also as a chain of events) was allowed to build until the accident occurred. |
| 5 | คำพูด | FAA AMT Handbook–General (FAA-H-8083-30B) | 14-12 | 635 | An active failure is one in which the effects are immediate. … An example of this type would be an aircraft slipping off one of the lifting jacks due to improper placement by the technician. |
| 5 | คำพูด | FAA AMT Handbook–General (FAA-H-8083-30B) | 14-12 | 635 | A latent failure occurs as a result of a decision or action made long before the incident or accident actually occurs. The consequences of such a decision may remain dormant for a long time. … it could be an unapproved jack being used because funding had not been approved to purchase the correct ground support equipment (GSE). |
| 6 | คำพูด | FAA AMT Handbook–General (FAA-H-8083-30B) | 14-13 | 636 | Training, risk assessments, safety inspections, etc., should not be restricted to an attempt to avoid errors but rather to make them visible and identify them before they produce damaging and regrettable consequences. Simply put, human error is not avoidable but it is manageable. |
| 6 | คำพูด | FAA AMT Handbook–General (FAA-H-8083-30B) | 14-13 | 636 | If someone knowingly or intentionally chooses to do something wrong, it is a violation, which means that one has purposely deviated from safe practices, procedures, standards, or regulations. |
| 7 | สถิติ | FAA AMT Handbook–General (FAA-H-8083-30B) | 14-1 | 624 | **75–80%** — A review of accident related data indicates that approximately 75–80 percent of all aviation accidents are the result of human error. |
| 7 | สถิติ | FAA AMT Handbook–General (FAA-H-8083-30B) | 14-1 | 624 | **≈12%** — Of those accidents, about 12 percent are maintenance related. |
| 7 | สถิติ | FAA AMT Handbook–General (FAA-H-8083-30B) | 14-29 | 652 | **80 : 20** — Historically, twenty percent of all accidents are caused by a machine failure, and eighty percent by human factors. |
| 7 | สถิติ | FAA AMT Handbook–General (FAA-H-8083-30B) | 14-1 | 624 | **รูแฝง** — Although pilot/co-pilot errors tend to have immediate and highly visible effects, maintenance errors tend to be more latent and less obvious. However, they can be just as lethal. |
| 9 | คำพูด | FAA AC 120-51E (2004) | 14 | 14 | Effective monitoring and cross-checking can be the last line of defense that prevents an accident because detecting an error or unsafe situation may break the chain of events leading to an accident. |
| 9 | คำพูด | FAA AMT Handbook–General (FAA-H-8083-30B) | 14-29 | 652 | If the chain of events is broken at the maintenance level, the likelihood of the accident occurring can be drastically decreased. |

## บท `hfacs` — HFACS ปัจจัยมนุษย์ 4 ระดับ (10 นาที, 13 สไลด์ + หน้าจบบท)

**แหล่งอ้างอิงที่แสดงในหน้าจบบท**

- Shappell & Wiegmann 2000 — HFACS (DOT/FAA/AM-00/7) · https://www.faa.gov/sites/faa.gov/files/data_research/research/med_humanfacs/oamtechreports/00_07.pdf
- Wiegmann & Shappell 2001 — Commercial Aviation Accidents (DOT/FAA/AM-01/3) · https://www.faa.gov/sites/faa.gov/files/data_research/research/med_humanfacs/oamtechreports/0103.pdf
- Shappell et al. 2006 — Fine-Grained Analysis Using HFACS (DOT/FAA/AM-06/18) · https://www.faa.gov/sites/faa.gov/files/data_research/research/med_humanfacs/oamtechreports/200618.pdf
- DoD HFACS 8.0 (2022, ฉบับแก้ไข 2023) · https://www.safety.af.mil/Portals/71/documents/Human%20Factors/DoD%20HFACS%208.0%20Guide%20-%2020230927%20Corrected%20sm.pdf
- SKYbrary — HFACS — † เล่าความ ไม่ยกคำพูด · https://skybrary.aero/articles/human-factors-analysis-and-classification-system-hfacs

| สไลด์ | ชนิด | เอกสาร | หน้าที่พิมพ์ | หน้า PDF | ข้อความต้นฉบับ / ข้อมูล |
|---|---|---|---|---|---|
| 1 | ตัวเลขหน้าเปิด | — | — |  | **70–80%** — ของอุบัติเหตุการบินมีความผิดพลาดของมนุษย์เป็นส่วนหนึ่ง (AM-00/7 หน้า 1) |
| 2 | ข้อสรุป | Shappell & Wiegmann 2000, DOT/FAA/AM-00/7 (ชื่อเอกสาร); DoD HFACS 8.0 | — |  | ชื่อเต็ม Human Factors Analysis and Classification System แปลเป็นไทย และอธิบายแต่ละคำ (เรียบเรียง ไม่ยกคำพูด) |
| 3 | คำพูด | Shappell & Wiegmann 2000, DOT/FAA/AM-00/7 | 1 | 5 | In fact, estimates in the literature indicate that between 70 and 80 percent of aviation accidents can be attributed, at least in part, to human error (Shappell & Wiegmann, 1996). |
| 3 | คำพูด | DoD HFACS 8.0 | 1 | 2 | Human error remains the leading cause of DoD mishaps. |
| 4 | คำพูด | Shappell & Wiegmann 2000, DOT/FAA/AM-00/7 | 2 | 6 | Represented as “holes” in the cheese, these active failures are typically the last unsafe acts committed by aircrew. |
| 4 | คำพูด | Shappell & Wiegmann 2000, DOT/FAA/AM-00/7 | 2 | 6 | As their name suggests, latent failures, unlike their active counterparts, may lie dormant or undetected for hours, days, weeks, or even longer, until one day they adversely affect the unsuspecting aircrew. |
| 5 | ภาพโต้ตอบ hfacs | AM-00/7 หน้า 3 (4 ระดับ); DoD HFACS 8.0 (หมวด 19 + รหัสย่อย) | — |  | ชื่อหมวด/รหัสภาษาอังกฤษจาก taxonomy.json (DoD HFACS 8.0); ชื่อไทยและคำอธิบายหมวดเรียบเรียงจากนิยามในคู่มือ ไม่ยกคำพูด |
| 6 | คำพูด | Shappell & Wiegmann 2000, DOT/FAA/AM-00/7 | 3 | 7 | …these skill-based actions are particularly vulnerable to failures of attention and/or memory. |
| 6 | คำพูด | Shappell & Wiegmann 2000, DOT/FAA/AM-00/7 | 4 | 8 | …intentional behavior that proceeds as intended, yet the plan proves inadequate or inappropriate for the situation. |
| 6 | คำพูด | Shappell & Wiegmann 2000, DOT/FAA/AM-00/7 | 5 | 9 | Typically, perceptual errors occur when sensory input is degraded or “unusual,” as is the case with visual illusions and spatial disorientation or when aircrew simply misjudge the aircraft’s altitude, attitude, or airspeed |
| 8 | คำพูด | Shappell & Wiegmann 2000, DOT/FAA/AM-00/7 | 6 | 10 | The first, routine violations, tend to be habitual by nature and often tolerated by governing authority (Reason, 1990). |
| 8 | คำพูด | Shappell & Wiegmann 2000, DOT/FAA/AM-00/7 | 6 | 10 | Therefore, by definition, if a routine violation is identified, one must look further up the supervisory chain to identify those individuals in authority who are not enforcing the rules. |
| 8 | คำพูด | Shappell & Wiegmann 2000, DOT/FAA/AM-00/7 | 6 | 10 | …exceptional violations appear as isolated departures from authority, not necessarily indicative of individual’s typical behavior pattern nor condoned by management (Reason, 1990). |
| 9 | กราฟ hbar | Shappell et al. 2006, DOT/FAA/AM-06/18 | 7 | 11 | อุบัติเหตุการบินพาณิชย์สหรัฐฯ 1,020 เหตุ (1990–2002) [ชุด: Air carrier (n=181) / Commuter (n=839)] — (ค่าเป็น %) Skill-based Errors: 42.5 / 59.5 · Decision Errors: 39.2 / 36.1 · Violations: 17.1 / 24.4 · Perceptual Errors: 5.5 / 6.7 · Physical Environment: 37.0 / 62.6 · Crew Resource Management: 18.8 / 8.9 · Adverse Mental States: 3.3 / 7.2 · Inadequate Supervision: 8.3 / 2.5 · Operational Process: 11.6 / 3.5 _(% ของอุบัติเหตุที่พบหมวดนั้น (เหตุหนึ่งมีได้หลายหมวด รวมจึงไม่เท่ากับ 100) · 9 จาก 19 หมวด)_ |
| 10 | คำพูด | Shappell et al. 2006, DOT/FAA/AM-06/18 | 7 | 11 | What is apparent from the data is that the majority of human causal factors identified in the database involved aircrew and their environment (i.e., unsafe acts of operators and preconditions for unsafe acts) rather than supervisory or organizational factors. |
| 10 | คำพูด | Wiegmann & Shappell 2001, DOT/FAA/AM-01/3 | 10 | 16 | Another explanation, however, is that these factors do contribute to most accidents, yet they are rarely identified using existing accident investigation processes. |
| 11 | สถิติ | Shappell et al. 2006, DOT/FAA/AM-06/18 | 6 | 10 | **68%** — Sixty-eight percent of all commercial aviation accidents included in this study involved some form of aircrew or supervisory error. |
| 11 | สถิติ | Wiegmann & Shappell 2001, DOT/FAA/AM-01/3 | 10 | 16 | **16%** — Indeed, only 16% of all aircrew-related accidents involved some form of either supervisory or organizational involvement. |
| 11 | สถิติ | Wiegmann & Shappell 2001, DOT/FAA/AM-01/3 | 9 | 15 | **6% → 46%** — …the relative proportion of accidents associated with violations increased appreciably from a low of 6% in 1990 to a high of 46% in 1996. |
| 11 | สถิติ | Shappell et al. 2006, DOT/FAA/AM-06/18 | 8 | 12 | **>80%** — …over 80% of the CRM failures observed during commuter operations involved “preflight” activities (such as planning and briefing). |

## บท `shell` — แบบจำลอง SHELL (8 นาที, 9 สไลด์ + หน้าจบบท)

**แหล่งอ้างอิงที่แสดงในหน้าจบบท**

- FAA AMT Handbook–General (FAA-H-8083-30B) หน้า 14-11 SHEL model · https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/amtg_handbook.pdf#page=634
- SKYbrary — ICAO SHELL Model — † เล่าความ ไม่ยกคำพูด · https://skybrary.aero/articles/icao-shell-model

| สไลด์ | ชนิด | เอกสาร | หน้าที่พิมพ์ | หน้า PDF | ข้อความต้นฉบับ / ข้อมูล |
|---|---|---|---|---|---|
| 2 | คำพูด | FAA AMT Handbook–General (FAA-H-8083-30B) | 14-11 | 634 | The “SHEL” model is another concept for investigating and evaluating maintenance errors. … As with other human factors tools, its goal is to determine not only what the problem is, but where and why it exists. |
| 2 | คำพูด | FAA AMT Handbook–General (FAA-H-8083-30B) | 14-12 | 635 | The model examines interaction with each of the four SHEL components, and does not consider interactions not involving human factors. |
| 4 | คำพูด | FAA AMT Handbook–General (FAA-H-8083-30B) | 14-12 | 635 | The term “software” is not referring to the common use of the term as applied to computer programs. Instead it includes a broader view of manual layout, checklist layout, symbology, language (both technical and nontechnical), and computer programs. |
| 4 | คำพูด | FAA AMT Handbook–General (FAA-H-8083-30B) | 14-12 | 635 | Hardware includes such things as the location of components, the accessibility of components and tooling. |
| 5 | คำพูด | FAA AMT Handbook–General (FAA-H-8083-30B) | 14-12 | 635 | Environment takes temperature, humidity, sound, light, and time of day factors into account. |
| 5 | คำพูด | FAA AMT Handbook–General (FAA-H-8083-30B) | 14-12 | 635 | Liveware relates technician interaction with other people, both on the job and off. These include managers, peers, family, friends, and self. |

## บท `tem` — การจัดการภัยคุกคามและความผิดพลาด (11 นาที, 13 สไลด์ + หน้าจบบท)

**แหล่งอ้างอิงที่แสดงในหน้าจบบท**

- FAA AC 120-90 (2006) Line Operations Safety Audits · https://www.faa.gov/documentLibrary/media/Advisory_Circular/AC_120-90.pdf
- FAA AC 120-90 (2006) Appendix 1 — Threat and Error Management · https://www.faa.gov/documentLibrary/media/Advisory_Circular/AC_120-90.pdf#page=17
- Maurino, D. — Threat and Error Management (TEM), ICAO — † เล่าความ ไม่ยกคำพูด · https://www.skybrary.aero/sites/default/files/bookshelf/515.pdf
- SKYbrary — Threat and Error Management (TEM) in Flight Operations — † เล่าความ ไม่ยกคำพูด · https://skybrary.aero/articles/threat-and-error-management-tem-flight-operations

| สไลด์ | ชนิด | เอกสาร | หน้าที่พิมพ์ | หน้า PDF | ข้อความต้นฉบับ / ข้อมูล |
|---|---|---|---|---|---|
| 2 | คำพูด | FAA AC 120-90 (2006) Appendix 1 | 1 | 17 | The Threat and Error Management (TEM) model is a conceptual framework for understanding operational performance in complex environments. |
| 2 | คำพูด | FAA AC 120-90 (2006) Appendix 1 | 1 | 17 | The added value that TEM brings to other performance models is that it focuses simultaneously on the operating environment and the humans working in that environment. |
| 4 | คำพูด | FAA AC 120-90 (2006) Appendix 1 | 1 | 17 | A threat is defined as an event or error that occurs outside the influence of the flightcrew (i.e., it was not caused by the crew), increases the operational complexity of a flight, and requires crew attention and management if safety margins are to be maintained. |
| 4 | คำพูด | FAA AC 120-90 (2006) Appendix 1 | 1 | 17 | There are threats from the environment—adverse weather, airport conditions, terrain, traffic, and air traffic control (ATC)—and threats emanating from within the airline—aircraft malfunctions and master equipment list (MEL) items, problems, interruptions, or errors from dispatch, cabin, ground, maintenance, and the ramp. |
| 5 | ชื่อการ์ด | — | — |  | Anticipated · Unexpected · Latent _(คาดได้ / ไม่คาดคิด ตาม FAA AC 120-90 ภาคผนวก 1 หน้า 1 · แบบแฝงตามเอกสาร TEM ของ ICAO)_ |
| 6 | คำพูด | FAA AC 120-90 (2006) Appendix 1 | 2 | 18 | Crew error is defined as action or inaction that leads to a deviation from crew or organizational intentions or expectations. Errors in the operational context tend to reduce the margin of safety and increase the probability of adverse events. |
| 6 | คำพูด | FAA AC 120-90 (2006) Appendix 1 | 2 | 18 | Broadly speaking, there are handling errors (flight controls, automation), procedural errors (checklists, briefings, callouts) and communication errors (with ATC, ground, or pilot-to-pilot). |
| 6 | คำพูด | FAA AC 120-90 (2006) Appendix 1 | 2 | 18 | Understanding how the error was managed is as important, if not more important, than understanding the prevalence of different types of error. |
| 7 | คำพูด | FAA AC 120-90 (2006) Appendix 1 | 2 | 18 | An UAS is defined as a position, condition, or attitude of an aircraft that clearly reduces safety margins and is a result of actions by the flightcrew. It is a safety-compromising state that results from ineffective error management. |
| 7 | คำพูด | FAA AC 120-90 (2006) Appendix 1 | 2 | 18 | Examples include unstable approaches, lateral deviations, firm landings, and proceeding towards wrong taxiway/runway… |
| 7 | คำพูด | FAA AC 120-90 (2006) Appendix 1 | 2 | 18 | As with errors, UASs can be managed effectively, returning the aircraft to safe flight, or the crew action or inaction can induce an additional error, incident, or accident. |
| 8 | คำพูด | FAA AC 120-90 (2006) Appendix 1 | 2 | 18 | Planning countermeasures—planning, preparation, briefings, contingency management—are essential for managing anticipated and unexpected threats |
| 8 | คำพูด | FAA AC 120-90 (2006) Appendix 1 | 2 | 18 | Execution countermeasures—monitor/cross-check, taxiway/runway management, workload, and automation management—are essential for error detection and error response |
| 8 | คำพูด | FAA AC 120-90 (2006) Appendix 1 | 2 | 18 | Review/modify countermeasures—evaluation of plans, inquiry—are essential for managing the changing conditions of a flight |
| 9 | คำพูด | FAA AC 120-90 (2006) Appendix 1 | 3 | 19 | TEM training emphasizes the value of threat anticipation and management, error avoidance, and error detection and recovery. |
| 9 | คำพูด | FAA AC 120-90 (2006) Appendix 1 | 3 | 19 | It is important to clarify that TEM is not crew resource management (CRM) and should not be considered a replacement for it. TEM and CRM refer to overlapping but not equivalent activities. |
| 10 | สถิติ | FAA AC 120-90 (2006) | 1 | 1 | **สมัครใจ** — A LOSA is a voluntary safety program. |
| 10 | สถิติ | FAA AC 120-90 (2006) | 2 | 2 | **ไม่มีผลต่อตัว** — Confidential data collection and non-jeopardy assurance for pilots are fundamental to the process. |
| 10 | สถิติ | FAA AC 120-90 (2006) | 2 | 2 | **6–12 เดือน** — …can take between 6 and 12 months. A LOSA is recommended every 3 years. |
| 10 | สถิติ | FAA AC 120-90 (2006) | 3 | 3 | **5% กับ 50%** — If 5 percent of observed crews make a callout error … there may be a problem with those crews. However, if 50 percent of observed crews make the same error, then the evidence suggests a problem with the callout procedure. |

## บท `risk` — ประเมินความเสี่ยงก่อนบิน (12 นาที, 15 สไลด์ + หน้าจบบท)

**แหล่งอ้างอิงที่แสดงในหน้าจบบท**

- FAA Risk Management Handbook (FAA-H-8083-2A) · https://www.faa.gov/sites/faa.gov/files/2022-06/risk_management_handbook_2A.pdf
- FAA Risk Management Handbook หน้า 4-1 ตารางความเสี่ยง · https://www.faa.gov/sites/faa.gov/files/2022-06/risk_management_handbook_2A.pdf#page=34

| สไลด์ | ชนิด | เอกสาร | หน้าที่พิมพ์ | หน้า PDF | ข้อความต้นฉบับ / ข้อมูล |
|---|---|---|---|---|---|
| 2 | สถิติ | FAA Risk Management Handbook (FAA-H-8083-2A) | ii | 4 | **ราว 85%** — …in the last 20 years, approximately 85 percent of aviation accidents have been caused by “pilot error.” |
| 2 | สถิติ | FAA Risk Management Handbook (FAA-H-8083-2A) | 3-3 | 21 | **เกือบ 80%** — For example, the accident rate for air carriers operating under 14 CFR part 121 was reduced by nearly 80 percent in the ten-year period beginning in the mid-1990s. |
| 2 | สถิติ | FAA Risk Management Handbook (FAA-H-8083-2A) | 3-3 | 21 | **1 : 100,000** — In contrast, general aviation aircraft operating under 14 CFR part 91 maintained a static accident rate of about one fatal accident per 100,000 flight hours. |
| 2 | สถิติ | FAA Risk Management Handbook (FAA-H-8083-2A) | 3-4 | 22 | **ต้นเหตุร่วม** — These causes often signify the final result of a chain of events. … an in-depth analysis of these accidents will often reveal inadequate risk management as a common thread. |
| 3 | คำพูด | FAA Risk Management Handbook (FAA-H-8083-2A) | 3-1 | 19 | Simply put, a hazard is a condition that could cause an accident. The probability and predicted severity of the consequences that may result from any hazard is the risk. Identifying, analyzing, and responding appropriately to hazards decreases the risks and increases the margin of safety. |
| 3 | คำพูด | FAA Risk Management Handbook (FAA-H-8083-2A) | 3-1 | 19 | The traffic is always a hazard, but it does not usually create a significant risk for a pedestrian until the actual street crossing takes place. |
| 4 | ชื่อการ์ด | — | — |  | นักบิน (Pilot) · อากาศยาน (Aircraft) · สภาพแวดล้อม (enVironment) · แรงกดดันภายนอก (External pressures) _(แตะการ์ดเพื่อดูคำถามที่ต้องถาม · PAVE ตามรูป 1-2 ใน FAA Risk Management Handbook)_ |
| 6 | คำพูด | FAA Risk Management Handbook (FAA-H-8083-2A) | 3-5 | 23 | The IMSAFE checklist, which is an acronym for Illness, Medication, Stress, Alcohol, Fatigue, and Emotion, can help a pilot identify these hazards. |
| 6 | คำพูด | FAA Risk Management Handbook (FAA-H-8083-2A) | 3-5 | 23 | Note that some publications combine Emotion with Stress as the “S” in IMSAFE and leave the “E” to remind pilots about “Eating.” |
| 6 | คำพูด | FAA Risk Management Handbook (FAA-H-8083-2A) | 3-5 | 23 | The CFRs include a time limit (no consumption within eight hours before a flight), a quantity limit (blood alcohol must be below 0.04 percent), and a performance limit (flight duty prohibited while under the influence of alcohol). |
| 9 | คำพูด | FAA Risk Management Handbook (FAA-H-8083-2A) | 4-1 | 34 | Risk is the composite of the likelihood (probability) and the severity (consequences) of a particular outcome. |
| 9 | คำพูด | FAA Risk Management Handbook (FAA-H-8083-2A) | 4-2 | 35 | The high (red) or serious (yellow) categories imply “no-go” unless the pilot finds a means to reduce the risk, such that the next iteration of risk assessment indicates a medium or low risk. |
| 9 | คำพูด | FAA Risk Management Handbook (FAA-H-8083-2A) | 4-2 | 35 | The medium (green) risk level implies a “go” decision for a planned or ongoing flight. However, in this case, risk should still be mitigated if possible. |
| 10 | คำพูด | FAA Risk Management Handbook (FAA-H-8083-2A) | 4-2 | 35 | While conducting a risk assessment, a pilot may be unsure of the likelihood or severity for a particular risk or find it difficult to choose between adjacent parameters. In such cases, pilots should apply the more conservative parameter(s), which place the risk at a higher level. |
| 10 | คำพูด | FAA Risk Management Handbook (FAA-H-8083-2A) | 4-2 | 35 | Pilots sometimes use inputs that skew the risk toward a lower level due to the desire to complete a flight. |
| 10 | คำพูด | FAA Risk Management Handbook (FAA-H-8083-2A) | 4-2 | 35 | The matrix results lose relevance if the hazards change before a flight departs. |
| 14 | คำพูด | FAA Risk Management Handbook (FAA-H-8083-2A) | 8-3 | 56 | Effective risk management models utilize a closed-loop process. The closed-loop nature of the 3P model requires a periodic check to verify successful mitigation of the risk. If the pilot perceives insufficient mitigation of that risk or detects a new hazard, the process and analysis resumes. |
| 14 | คำพูด | FAA Risk Management Handbook (FAA-H-8083-2A) | 8-2 | 55 | Analytical decision-making leads to an option likely to result in a safe outcome. Pilots should consider the following items less important than safety: |

## บท `dozen` — 12 เงื่อนไขที่ทำให้คนพลาด (12 นาที, 14 สไลด์ + หน้าจบบท)

**แหล่งอ้างอิงที่แสดงในหน้าจบบท**

- FAA AMT Handbook–General (FAA-H-8083-30B) หน้า 14-13 The Dirty Dozen · https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/amtg_handbook.pdf#page=636
- SKYbrary — The Human Factors "Dirty Dozen" — † เล่าความ ไม่ยกคำพูด · https://skybrary.aero/articles/human-factors-dirty-dozen

| สไลด์ | ชนิด | เอกสาร | หน้าที่พิมพ์ | หน้า PDF | ข้อความต้นฉบับ / ข้อมูล |
|---|---|---|---|---|---|
| 2 | คำพูด | FAA AMT Handbook–General (FAA-H-8083-30B) | 14-13 | 636 | Due to a large number of maintenance-related aviation accidents and incidents that occurred in the late 1980s and early 1990s, Transport Canada identified twelve human factors that degrade people’s ability to perform effectively and safely, which could lead to maintenance errors. |
| 2 | คำพูด | FAA AMT Handbook–General (FAA-H-8083-30B) | 14-2 | 625 | …human error, rather than mechanical failure, underlies most aviation accidents and incidents. |
| 3 | ชื่อการ์ด | — | — |  | Lack of communication · Complacency · Lack of knowledge · Distraction · Lack of teamwork · Fatigue · Lack of resources · Pressure · Lack of assertiveness · Stress · Lack of awareness · Norms _(แตะการ์ดเพื่อดูวิธีกัน)_ |
| 4 | สถิติ | FAA AMT Handbook–General (FAA-H-8083-30B) | 14-1 | 624 | **80%** — It is universally agreed that 80 percent of maintenance errors involve human factors. |
| 4 | สถิติ | FAA AMT Handbook–General (FAA-H-8083-30B) | 14-15 | 638 | **15%** — It is estimated that 15 percent of maintenance related errors are caused by distractions. |
| 4 | สถิติ | FAA AMT Handbook–General (FAA-H-8083-30B) | 14-17 | 640 | **8–9 ชม.** — Eight to nine hours of daily sleep are recommended to avoid fatigue. |
| 4 | สถิติ | FAA AMT Handbook–General (FAA-H-8083-30B) | 14-18 | 641 | **24 ชม.** — Title 14 of the Code of Federal Regulations (14 CFR) part 121, section 377, only requires 24 hours time off during a week of work. |
| 5 | คำพูด | FAA AMT Handbook–General (FAA-H-8083-30B) | 14-14 | 637 | Continuing a job that has been started by someone else should only occur after a face-to-face meeting of technicians. … Absence of either a written or oral turnover serves as warning that an error could occur. |
| 5 | คำพูด | FAA AMT Handbook–General (FAA-H-8083-30B) | 14-14 | 637 | A repetitive task, especially an inspection item, may be overlooked or skipped because the technician has performed the task a number of times without ever finding a fault. |
| 5 | คำพูด | FAA AMT Handbook–General (FAA-H-8083-30B) | 14-14 | 637 | To combat complacency, a technician must be trained to expect to find the fault that created the inspection item in the first place. |
| 6 | คำพูด | FAA AMT Handbook–General (FAA-H-8083-30B) | 14-15 | 638 | A distraction while performing maintenance on an aircraft may disrupt the procedure. … When work resumes, it is possible that the technician skips over a detail that needs attention. |
| 6 | คำพูด | FAA AMT Handbook–General (FAA-H-8083-30B) | 14-16 | 639 | A good practice is to go back three steps in the work procedure from when distraction occurred and resume the job from that point. |
| 8 | คำพูด | FAA AMT Handbook–General (FAA-H-8083-30B) | 14-16 | 639 | Until it becomes extreme, a person may be unaware that they are fatigued. It is easier recognized by another person or in the results of tasks being performed. |
| 8 | คำพูด | FAA AMT Handbook–General (FAA-H-8083-30B) | 14-16 | 639 | Working alone when fatigued is particularly dangerous. |
| 8 | คำพูด | FAA AMT Handbook–General (FAA-H-8083-30B) | 14-22 | 645 | Sacrificing quality and safety for the sake of time should not be tolerated or accepted. |
| 9 | คำพูด | FAA AMT Handbook–General (FAA-H-8083-30B) | 14-22 | 645 | Assertiveness is the ability to express your feelings, opinions, beliefs, and needs in a positive, productive manner and should not be confused with being aggressive. |
| 9 | คำพูด | FAA AMT Handbook–General (FAA-H-8083-30B) | 14-22 | 645 | Not being assertive could ultimately cost people their lives. |
| 9 | คำพูด | FAA AMT Handbook–General (FAA-H-8083-30B) | 14-23 | 646 | A lack of assertiveness in failing to speak up when things do not seem right has resulted in many fatal accidents. |
| 10 | คำพูด | FAA AMT Handbook–General (FAA-H-8083-30B) | 14-26 | 649 | Norms is short for “normal,” or the way things are normally done. … They are unwritten rules that are followed or tolerated by most organizations. Negative norms can detract from the established safety standard and cause an accident to occur. |
| 10 | คำพูด | FAA AMT Handbook–General (FAA-H-8083-30B) | 14-26 | 649 | Very rarely do newcomers initiate change in a group with established norms. |
| 10 | คำพูด | FAA AMT Handbook–General (FAA-H-8083-30B) | 14-27 | 650 | Newcomers are better able to identify these unsafe norms than long-standing members of the group. |
| 12 | ชื่อการ์ด | — | — |  | Incorrect installation of components · Fitting of wrong parts · Electrical wiring discrepancies · Forgotten tools and parts · Failure to lubricate · Failure to secure access panels, fairings, or cowlings · Fuel or oil caps and fuel panels not secured · Failure to remove lock pins _(จากการศึกษาของ UK CAA ที่ FAA ยกไว้ในหน้า 14-28 — FAA สรุปว่าทุกข้อป้องกันได้ถ้าทำตามการ์ดงาน)_ |
| 13 | คำพูด | FAA AMT Handbook–General (FAA-H-8083-30B) | 14-32 | 655 | Technicians familiar with Boeing 757 flap change procedures lacked the knowledge required to correctly lock out the spoilers on the Airbus during the flap change work that was done the day before the flight. Turnover to technicians on the next shift compounded the problem. |
| 13 | คำพูด | FAA AMT Handbook–General (FAA-H-8083-30B) | 14-32 | 655 | The improper replacement of the forward elevator trim cable and subsequent inadequate functional check of the maintenance performed resulted in a reversal of the elevator trim system and a loss of control in flight. |

## บท `crm` — CRM — ใช้ทุกทรัพยากรที่มี (12 นาที, 14 สไลด์ + หน้าจบบท)

**แหล่งอ้างอิงที่แสดงในหน้าจบบท**

- FAA AC 120-51E (2004) Crew Resource Management Training · https://www.faa.gov/documentLibrary/media/Advisory_Circular/AC120-51e.pdf
- FAA PHAK (FAA-H-8083-25C) หน้า 2-23 Use of Resources · https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/faa-h-8083-25c.pdf#page=62
- SKYbrary — Crew Resource Management (CRM) — † เล่าความ ไม่ยกคำพูด · https://skybrary.aero/articles/crew-resource-management-crm
- SKYbrary — Authority Gradients — † เล่าความ ไม่ยกคำพูด · https://skybrary.aero/articles/authority-gradients

| สไลด์ | ชนิด | เอกสาร | หน้าที่พิมพ์ | หน้า PDF | ข้อความต้นฉบับ / ข้อมูล |
|---|---|---|---|---|---|
| 1 | ตัวเลขหน้าเปิด | — | — |  | **60–80%** — ของเหตุและอุบัติเหตุของสายการบิน มีความผิดพลาดของคนเป็นปัจจัยร่วม (FAA AC 120-51E หน้า 4) |
| 2 | คำพูด | FAA AC 120-51E (2004) | 2 | 2 | As used in this AC, CRM refers to the effective use of all available resources: human resources, hardware, and information. |
| 2 | คำพูด | FAA AC 120-51E (2004) | 2 | 2 | The application of team management concepts in the flight deck environment was initially known as cockpit resource management. As CRM training evolved to include flight attendants, maintenance personnel and others, the phrase “Crew Resource Management” was adopted. |
| 3 | คำพูด | FAA AC 120-51E (2004) | 4 | 4 | Many problems encountered by flightcrews have very little to do with the technical aspects of operating in a multi-person cockpit. Instead, problems are associated with poor group decisionmaking, ineffective communication, inadequate leadership, and poor task or resource management. |
| 3 | คำพูด | FAA AC 120-51E (2004) | 5 | 5 | Demonstrated mastery of CRM concepts cannot overcome a lack of proficiency. Similarly, high technical proficiency cannot guarantee safe operations in the absence of effective crew coordination. |
| 7 | คำพูด | FAA AC 120-51E (2004) | 7 | 7 | It should be made perfectly clear in pilots’ manuals, and in every phase of pilot training, that appropriate questioning is encouraged and that there will be no negative repercussions for appropriate questioning of one pilot’s decision or action by another pilot. |
| 7 | คำพูด | FAA AC 120-51E (2004) Appendix 1 | 2 | 18 | (1) Crewmembers speak up and state their information with appropriate persistence until there is some clear resolution. |
| 8 | คำพูด | FAA AC 120-51E (2004) Appendix 1 | 1 | 17 | An effective briefing is interesting and thorough. It addresses coordination, planning, and problems. Although briefings are primarily a captain’s responsibility, other crewmembers may add significantly to planning and should be encouraged to do so. |
| 8 | คำพูด | FAA AC 120-51E (2004) Appendix 1 | 1 | 17 | (3) The briefing establishes a “team concept” (e.g., the captain uses “we” language, encourages all to participate and to help with the flight). … (8) The briefing sets expectations for handling deviations from SOPs. |
| 9 | คำพูด | FAA AC 120-51E (2004) | 14 | 14 | Therefore, to ensure the highest levels of safety, each flight crewmember must carefully monitor the aircraft’s flight path and systems and actively cross-check the actions of other crewmembers. Effective monitoring and cross-checking can be the last line of defense that prevents an accident because detecting an error or unsafe situation may break the chain of events leading to an accident. |
| 9 | คำพูด | FAA AC 120-51E (2004) | 14 | 14 | This monitoring function is always essential, and particularly so during approach and landing when controlled flight into terrain (CFIT) accidents are most common. |
| 10 | คำพูด | FAA AC 120-51E (2004) | 5 | 5 | Research also shows that when there is no effective reinforcement of CRM concepts by way of recurrent training, improvements in attitudes observed after initial indoctrination tend to disappear, and individuals’ attitudes tend to revert to former levels. |
| 10 | คำพูด | FAA AC 120-51E (2004) | 16 | 16 | It is now understood that pilot errors cannot be entirely eliminated. It is important, therefore, that pilots develop appropriate error management skills and procedures. |

## บท `sa` — การตระหนักรู้สถานการณ์ (SA) (10 นาที, 12 สไลด์ + หน้าจบบท)

**แหล่งอ้างอิงที่แสดงในหน้าจบบท**

- FAA PHAK (FAA-H-8083-25C) หน้า 2-24 Situational Awareness · Workload Management · https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/faa-h-8083-25c.pdf#page=63
- FAA AC 120-51E (2004) หน้า 11 Workload Management and Situation Awareness · https://www.faa.gov/documentLibrary/media/Advisory_Circular/AC120-51e.pdf#page=11
- SKYbrary — Situational Awareness — † เล่าความ ไม่ยกคำพูด · https://skybrary.aero/articles/situational-awareness
- Endsley (1995) Toward a Theory of Situation Awareness, Human Factors 37(1) — † เล่าความ ไม่ยกคำพูด · https://doi.org/10.1518/001872095779049543

| สไลด์ | ชนิด | เอกสาร | หน้าที่พิมพ์ | หน้า PDF | ข้อความต้นฉบับ / ข้อมูล |
|---|---|---|---|---|---|
| 2 | คำพูด | FAA PHAK (FAA-H-8083-25C) | 2-24 | 63 | Situational awareness is the accurate perception and understanding of all the factors and conditions within the five fundamental risk elements (flight, pilot, aircraft, environment, and type of operation that comprise any given aviation situation) that affect safety before, during, and after the flight. |
| 2 | คำพูด | FAA PHAK (FAA-H-8083-25C) | 2-24 | 63 | A pilot who is simply making turns without understanding why has added an additional burden to his or her management in the event of an emergency. |
| 5 | คำพูด | FAA PHAK (FAA-H-8083-25C) | 2-24 | 63 | Fatigue, stress, and work overload can cause a pilot to fixate on a single perceived important item and reduce an overall situational awareness of the flight. |
| 5 | คำพูด | FAA PHAK (FAA-H-8083-25C) | 2-24 | 63 | Many flight deck distractions begin as a minor problem, such as a gauge that is not reading correctly, but result in accidents as the pilot diverts attention to the perceived problem and neglects proper control of the aircraft. |
| 7 | คำพูด | FAA PHAK (FAA-H-8083-25C) | 2-24 | 63 | The first effect of high workload is that the pilot may be working harder but accomplishing less. |
| 7 | คำพูด | FAA PHAK (FAA-H-8083-25C) | 2-24 | 63 | When a pilot becomes task saturated, there is no awareness of input from various sources, so decisions may be made on incomplete information and the possibility of error increases. |
| 7 | คำพูด | FAA PHAK (FAA-H-8083-25C) | 2-24 | 63 | When a work overload situation exists, a pilot needs to stop, think, slow down, and prioritize. |
| 8 | คำพูด | FAA PHAK (FAA-H-8083-25C) | 2-24 | 63 | Effective workload management ensures essential operations are accomplished by planning, prioritizing, and sequencing tasks to avoid work overload. … As experience is gained, a pilot learns to recognize future workload requirements and can prepare for high workload periods during times of low workload. |
| 8 | คำพูด | FAA AC 120-51E (2004) | 11 | 11 | (3) Workload Management and Situation Awareness. Stressing the importance of maintaining awareness of the operational environment and anticipating contingencies. Instruction may address practices (e.g., vigilance, planning and time management, prioritizing tasks, and avoiding distractions) that result in higher levels of situation awareness. |

## บท `adm` — ตัดสินใจด้วย DECIDE (12 นาที, 14 สไลด์ + หน้าจบบท)

**แหล่งอ้างอิงที่แสดงในหน้าจบบท**

- FAA PHAK (FAA-H-8083-25C) บทที่ 2 Aeronautical Decision-Making · https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/faa-h-8083-25c.pdf#page=41
- FAA Risk Management Handbook (FAA-H-8083-2A) บทที่ 8 · https://www.faa.gov/sites/faa.gov/files/2022-06/risk_management_handbook_2A.pdf#page=54

| สไลด์ | ชนิด | เอกสาร | หน้าที่พิมพ์ | หน้า PDF | ข้อความต้นฉบับ / ข้อมูล |
|---|---|---|---|---|---|
| 1 | ตัวเลขหน้าเปิด | — | — |  | **ราว 80%** — ของอุบัติเหตุการบิน FAA ระบุว่าเกี่ยวกับปัจจัยมนุษย์ (FAA PHAK หน้า 2-2) |
| 2 | สถิติ | FAA PHAK (FAA-H-8083-25C) | 2-2 | 41 | **24.1%** — …approximately 80 percent of all aviation accidents are related to human factors and the vast majority of these accidents occur during landing (24.1 percent) and takeoff (23.4 percent). |
| 2 | สถิติ | FAA PHAK (FAA-H-8083-25C) | 2-3 | 42 | **10–50%** — The differences were statistically significant and ranged from about 10 to 50 percent fewer judgment errors. |
| 2 | สถิติ | FAA PHAK (FAA-H-8083-25C) | 2-3 | 42 | **54%** — …an operator flying about 400,000 hours annually demonstrated a 54 percent reduction in accident rate after using these materials for recurrency training. |
| 2 | สถิติ | FAA PHAK (FAA-H-8083-25C) | 2-3 | 42 | **สอนได้** — Contrary to popular opinion, good judgment can be taught. |
| 3 | คำพูด | FAA PHAK (FAA-H-8083-25C) | 2-2 | 41 | ADM is a systematic approach to risk assessment and stress management. |
| 3 | คำพูด | FAA Risk Management Handbook (FAA-H-8083-2A) | 8-1 | 54 | ADM does not eliminate hazards, but helps the pilot address hazards and associated risks that threaten the safety of flight. |
| 3 | คำพูด | FAA Risk Management Handbook (FAA-H-8083-2A) | 8-1 | 54 | Despite improvements in training and technology, human error remains an issue. |
| 4 | ชื่อการ์ด | — | — |  | Identifying personal attitudes hazardous to safe flight · Learning behavior modification techniques · Learning how to recognize and cope with stress · Developing risk assessment skills · Using all resources · Evaluating the effectiveness of one’s ADM skills _(6 หัวข้อที่ FAA ใช้ฝึกการตัดสินใจ (FAA PHAK หน้า 2-3))_ |
| 6 | คำพูด | FAA PHAK (FAA-H-8083-25C) | 2-18 | 57 | Using the acronym “DECIDE,” the six-step process DECIDE Model is another continuous loop process that provides the pilot with a logical way of making decisions. |
| 6 | คำพูด | FAA PHAK (FAA-H-8083-25C) | 2-18 | 57 | DECIDE means to Detect, Estimate, Choose a course of action, Identify solutions, Do the necessary actions, and Evaluate the effects of the actions. |
| 8 | คำพูด | FAA Risk Management Handbook (FAA-H-8083-2A) | 8-3 | 56 | Experienced pilots use naturalistic decision-making when the time available precludes a more formal analytical process. |
| 8 | คำพูด | FAA Risk Management Handbook (FAA-H-8083-2A) | 8-3 | 56 | …naturalistic decision-making improves with training and experience, and it is not a replacement for memory items or a checklist procedure. |
| 9 | คำพูด | FAA PHAK (FAA-H-8083-25C) | 2-5 | 44 | Studies have identified five hazardous attitudes that can interfere with the ability to make sound decisions and exercise authority properly: anti-authority, impulsivity, invulnerability, macho, and resignation. |
| 9 | คำพูด | FAA PHAK (FAA-H-8083-25C) | 2-5 | 44 | Recognition of hazardous thoughts is the first step toward neutralizing them. After recognizing a thought as hazardous, the pilot should label it as hazardous, then state the corresponding antidote. Antidotes should be memorized for each of the hazardous attitudes so they automatically come to mind when needed. |
| 13 | คำพูด | FAA Risk Management Handbook (FAA-H-8083-2A) | ii | 4 | Pilots who practice effective risk management have predetermined personal minimums and have formed habit patterns and checklists to incorporate them. |
| 13 | คำพูด | FAA PHAK (FAA-H-8083-25C) | 2-18 | 57 | Mistakes and judgment errors are inevitable; the most important thing is for you to recognize, analyze, and learn from them before your next flight. |

## บท `sd` — หลงสภาพการบิน (Spatial Disorientation) (12 นาที, 14 สไลด์ + หน้าจบบท)

**แหล่งอ้างอิงที่แสดงในหน้าจบบท**

- FAA PHAK (FAA-H-8083-25C) บทที่ 17 Aeromedical Factors · https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/faa-h-8083-25c.pdf#page=423
- FAA AC 60-4A (1983) Pilot’s Spatial Disorientation · https://www.faa.gov/sites/faa.gov/files/2022-11/AC60-4A.pdf
- FAA — Spatial Disorientation (GA Safety Topic) · https://www.faa.gov/sites/faa.gov/files/2022-01/Spatial%20Disorientation.pdf
- DoD HFACS 8.0 — PC321 Spatial Disorientation · https://www.safety.af.mil/Portals/71/documents/Human%20Factors/DoD%20HFACS%208.0%20Guide%20-%2020230927%20Corrected%20sm.pdf#page=14
- SKYbrary — Spatial Disorientation — † เล่าความ ไม่ยกคำพูด · https://skybrary.aero/articles/spatial-disorientation

| สไลด์ | ชนิด | เอกสาร | หน้าที่พิมพ์ | หน้า PDF | ข้อความต้นฉบับ / ข้อมูล |
|---|---|---|---|---|---|
| 2 | คำพูด | FAA PHAK (FAA-H-8083-25C) | 17-6 | 428 | Spatial disorientation specifically refers to the lack of orientation with regard to the position, attitude, or movement of the airplane in space. |
| 2 | คำพูด | FAA AC 60-4A (1983) | 1 | 1 | Spatial disorientation to a pilot means simply the inability to tell which way is “up.” 🔍 |
| 3 | คำพูด | FAA PHAK (FAA-H-8083-25C) | 17-6 | 428 | Under normal flight conditions, when there is a visual reference to the horizon and ground, the sensory system in the inner ear helps to identify the pitch, roll, and yaw movements of the aircraft. When visual contact with the horizon is lost, the vestibular system becomes unreliable. Without visual references outside the aircraft, there are many situations in which combinations of normal motions and forces create convincing illusions that are difficult to overcome. |
| 3 | คำพูด | FAA PHAK (FAA-H-8083-25C) | 17-6 | 428 | However, the body cannot distinguish between acceleration forces due to gravity and those resulting from maneuvering the aircraft, which can lead to sensory illusions and false impressions of an aircraft’s orientation and movement. |
| 4 | ชื่อการ์ด | — | — |  | Visual · Vestibular · Somatosensory |
| 6 | คำพูด | FAA PHAK (FAA-H-8083-25C) | 17-7 | 429 | The reason a pilot can be unaware of such a gradual turn is that human exposure to a rotational acceleration of 2 degrees per second or lower is below the detection threshold of the semicircular canals. |
| 6 | คำพูด | FAA PHAK (FAA-H-8083-25C) | 17-7 | 429 | Leveling the wings after such a turn may cause an illusion that the aircraft is banking in the opposite direction. |
| 7 | กราฟ hbar | FAA AC 60-4A (1983) | 1 | 1 | ภาพลวงที่นักบินรายงานว่าเคยเจอเอง — (ค่าเป็น %) had a sensation that one wing was low although wings were level: 60 · on leveling after banking, tended to bank in opposite direction: 45 · felt as if straight and level when in a turn: 39 · had become confused in attempting to mix “contact” and instrument cues: 34 · on recovery from steep climbing turn, felt to be turning in opposite direction: 29 _(ร้อยละของนักบินที่ตอบว่าเคยเจอเอง — ตอบได้หลายข้อ ผลรวมจึงไม่เท่ากับ 100 · เอกสารปี 1983 ไม่ระบุจำนวนผู้ตอบ)_ |
| 8 | สถิติ | FAA AC 60-4A (1983) | 1 | 1 | **เกือบ 500** — During a recent 5-year period, there were almost 500 spatial disorientation accidents in the United States. |
| 8 | สถิติ | FAA AC 60-4A (1983) | 1 | 1 | **>90%** — Tragically, such accidents resulted in fatalities over 90 percent of the time. |
| 8 | สถิติ | FAA AC 60-4A (1983) | 1 | 1 | **35 วินาที** — Tests conducted with qualified instrument pilots indicate that it can take as much as 35 seconds to establish full control by instruments after the loss of visual reference with the surface. |
| 9 | คำพูด | FAA — Spatial Disorientation (GA Safety Enhancement Topic) | 1 | 1 | NTSB accident data suggests that spatial disorientation may be a precursor to many general aviation accidents — particularly in night or limited visibility weather conditions. |
| 9 | คำพูด | FAA PHAK (FAA-H-8083-25C) | 17-10 | 432 | Remember that illness, medication, alcohol, fatigue, sleep loss, and mild hypoxia are likely to increase susceptibility to spatial disorientation. |
| 10 | ชื่อการ์ด | — | — |  | The leans · Graveyard spiral · Coriolis illusion · Somatogravic · Inversion illusion · Elevator illusion · False horizon · Autokinesis _(แตะการ์ดเพื่อดูว่าเกิดอะไร และนักบินมักทำอะไรผิด)_ |
| 13 | คำพูด | FAA PHAK (FAA-H-8083-25C) | 17-10 | 432 | Most importantly, become proficient in the use of flight instruments and rely upon them. Trust the instruments and disregard your sensory perceptions. |
| 13 | คำพูด | FAA — Spatial Disorientation (GA Safety Enhancement Topic) | 2 | 2 | Accidents usually happen as a result of a pilot’s indecision to rely on the instruments. |
| 13 | คำพูด | FAA — Spatial Disorientation (GA Safety Enhancement Topic) | 2 | 2 | If you are one of two pilots in an aircraft and you begin to experience a visual illusion, transfer control of the aircraft to the other pilot, since pilots seldom experience visual illusions at the same time. |

## บท `fatigue` — ความล้า (Fatigue) (12 นาที, 14 สไลด์ + หน้าจบบท)

**แหล่งอ้างอิงที่แสดงในหน้าจบบท**

- FAA AC 120-100 (2010) Basics of Aviation Fatigue · https://www.faa.gov/documentLibrary/media/Advisory_Circular/AC%20120-100.pdf
- FAA PHAK (FAA-H-8083-25C) หน้า 17-13 Fatigue · https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/faa-h-8083-25c.pdf#page=435
- NTSB 1994 — Safety Rec. A-94-1 to -5 · https://www.ntsb.gov/safety/safety-recs/recletters/A94_1_5.pdf
- DoD HFACS 8.0 — PC307 Fatigue · https://www.safety.af.mil/Portals/71/documents/Human%20Factors/DoD%20HFACS%208.0%20Guide%20-%2020230927%20Corrected%20sm.pdf#page=13
- Williamson & Feyer 2000 — Occup Environ Med — † เล่าความ ไม่ยกคำพูด · https://pmc.ncbi.nlm.nih.gov/articles/PMC1739867/
- Dawson & Reid 1997 — Nature 388:235 — † เล่าความ ไม่ยกคำพูด · https://doi.org/10.1038/40775
- SKYbrary — Fatigue — † เล่าความ ไม่ยกคำพูด · https://skybrary.aero/articles/fatigue

| สไลด์ | ชนิด | เอกสาร | หน้าที่พิมพ์ | หน้า PDF | ข้อความต้นฉบับ / ข้อมูล |
|---|---|---|---|---|---|
| 1 | ตัวเลขหน้าเปิด | — | — |  | **17–19 ชม.** — ตื่นติดต่อกันเท่านี้ ผลทดสอบบางอย่างเท่ากับหรือแย่กว่าแอลกอฮอล์ในเลือด 0.05% (Williamson & Feyer 2000) |
| 2 | คำพูด | FAA AC 120-100 (2010) | 3 | 3 | The traditional definition of fatigue is a physiological state in which there is a decreased capacity to perform cognitive tasks and an increased variability in performance. |
| 2 | คำพูด | FAA PHAK (FAA-H-8083-25C) | 17-13 | 435 | Fatigue is frequently associated with pilot error. Some of the effects of fatigue include degradation of attention and concentration, impaired coordination, and decreased ability to communicate. |
| 4 | กราฟ clock | FAA AC 120-100 (2010) | 2 | 2 | นาฬิกาชีวภาพ: ช่วงที่ตื่นตัวต่ำ — ช่วงตื่นตัวต่ำ (WOCL): 3:00–5:00 ง่วงที่สุด สมรรถภาพต่ำสุด, 15:00–17:00 ช่วงบ่าย · ความเสี่ยงผิดพลาด: 2:00–4:00 เพิ่มขึ้นมากที่สุด, 14:00–16:00 เพิ่มขึ้น _(แผนภาพประกอบ ไม่ใช่ข้อมูลวัด · แถวบนจากหน้า 2 แถวล่างจากหน้า 7 · สำหรับคนที่นอนกลางคืนตามปกติ)_ |
| 5 | คำพูด | FAA AC 120-100 (2010) | 2 | 2 | One occurs at night, roughly from 3 a.m. to 5 a.m., a time when physiological sleepiness is greatest and performance capabilities are lowest. The other is in the afternoon, roughly from 3 p.m. to 5 p.m. |
| 5 | คำพูด | FAA AC 120-100 (2010) | 7 | 7 | …an increase in error rates and accident likelihood often occurs in the early afternoon, between 2 p.m. and 4 p.m. It is followed by a much larger increase in risk in the early morning hours between 2 a.m. and 4 a.m. |
| 7 | สถิติ | FAA AC 120-100 (2010) | 13 | 13 | **18–20 ชม.** — Performance and alertness begin to deteriorate after 18-20 hours of continuous wakefulness |
| 7 | สถิติ | FAA AC 120-100 (2010) | 7 | 7 | **5 ชม. × 4 คืน** — For example, 4 days of sleep restriction from 8 hours to 5 hours sleep per night can lead to performance changes as severe as that produced by 40 hours of total sleep deprivation. |
| 7 | สถิติ | FAA AC 120-100 (2010) | 7 | 7 | **2 ชม.** — As little as 2 hours of sleep loss a day can result in impaired performance and alertness |
| 7 | สถิติ | FAA AC 120-100 (2010) | 8 | 8 | **8 ชม.** — Studies show that after 8 hours of uninterrupted work, chances of error and accidents increase. |
| 8 | คำพูด | NTSB Safety Rec. A-94-1 to -5 | 16 | 16 | In the accidents examined in the Board's study, half the captains for whom data were available had been awake for more than 12 hours prior to their accidents. Half the first officers had been awake more than 11 hours. 🔍 |
| 8 | คำพูด | NTSB Safety Rec. A-94-1 to -5 | 16 | 16 | Crews comprising captains and first officers whose time since awakening was above the median for their crew position made more errors overall, and significantly more procedural and tactical decision errors. 🔍 |
| 9 | คำพูด | FAA AC 120-100 (2010) | 7 | 7 | People are not the best evaluators of their own alertness state. People can lose awareness of their own fatigue levels. They are often sleepier than they report. |
| 9 | คำพูด | FAA AC 120-100 (2010) | 7 | 7 | …research has shown that these subjective estimates are unreliable |
| 13 | คำพูด | FAA AC 120-100 (2010) | 13 | 13 | Even short naps of 25-30 minutes can have beneficial effects. |
| 13 | คำพูด | FAA AC 120-100 (2010) | 8 | 8 | Providing short breaks from work can greatly attenuate this effect |
| 13 | คำพูด | FAA PHAK (FAA-H-8083-25C) | 17-13 | 435 | Getting adequate rest is the only way to prevent fatigue from occurring. |
