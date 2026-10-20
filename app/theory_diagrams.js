// theory_diagrams.js — แผนภาพและสื่อกราฟิกประกอบ 11 ทฤษฎีนิรภัยการบิน กองบิน 2
// สำหรับการนำเสนอต่อผู้บังคับบัญชา และบรีฟในห้องนักบิน (Resolution-Independent Vector SVG)

export const THEORY_DIAGRAMS = {
  // 1. แบบจำลองสวิสชีส (Swiss Cheese Model - James Reason)
  swiss: `<svg class="td-svg" viewBox="0 0 360 200" aria-label="แบบจำลองสวิสชีส 4 ชั้นป้องกัน">
    <defs>
      <linearGradient id="sw-ray" x1="0%" y1="50%" x2="100%" y2="50%">
        <stop offset="0%" stop-color="#ff7a85" stop-opacity=".9"/>
        <stop offset="70%" stop-color="#f4a259" stop-opacity=".85"/>
        <stop offset="100%" stop-color="#5fd39a" stop-opacity=".95"/>
      </linearGradient>
    </defs>
    <!-- Background Grid -->
    <path d="M20 170L340 170M60 185L300 185" stroke="var(--line)" stroke-width="1" stroke-dasharray="4 4"/>
    
    <!-- Trajectory of Hazard (ลำแสงอันตราย) -->
    <path d="M20 95L95 95L165 95L235 95L278 95" fill="none" stroke="url(#sw-ray)" stroke-width="3" stroke-dasharray="5 3"/>
    <circle cx="20" cy="95" r="4.5" fill="#ff7a85"/>
    <text x="20" y="80" fill="#ff7a85" font-size="10.5" font-weight="600" text-anchor="middle">อันตราย (Hazard)</text>

    <!-- Slice 1: อิทธิพลระดับองค์กร -->
    <g transform="translate(80, 30)">
      <polygon points="0,15 25,0 25,125 0,140" fill="hsl(var(--d-gold-600) / .16)" stroke="var(--gold)" stroke-width="1.6"/>
      <ellipse cx="14" cy="65" rx="7" ry="12" fill="#0b1120" stroke="var(--gold)" stroke-width="1.4"/>
      <ellipse cx="12" cy="110" rx="5" ry="8" fill="#0b1120" stroke="var(--gold)" stroke-width="1.2"/>
      <text x="12" y="152" fill="var(--gold)" font-size="9" font-weight="600" text-anchor="middle">1. องค์กร</text>
    </g>

    <!-- Slice 2: การกำกับดูแล -->
    <g transform="translate(150, 30)">
      <polygon points="0,15 25,0 25,125 0,140" fill="hsl(var(--d-glow) / .16)" stroke="var(--gold)" stroke-width="1.6"/>
      <ellipse cx="14" cy="65" rx="6" ry="11" fill="#0b1120" stroke="var(--gold)" stroke-width="1.4"/>
      <ellipse cx="15" cy="35" rx="5" ry="7" fill="#0b1120" stroke="var(--gold)" stroke-width="1.2"/>
      <text x="12" y="152" fill="var(--gold)" font-size="9" font-weight="600" text-anchor="middle">2. กำกับดูแล</text>
    </g>

    <!-- Slice 3: สภาพก่อนเกิดเหตุ -->
    <g transform="translate(220, 30)">
      <polygon points="0,15 25,0 25,125 0,140" fill="hsl(var(--d-accent-t) / .16)" stroke="var(--sky)" stroke-width="1.6"/>
      <ellipse cx="14" cy="65" rx="6" ry="10" fill="#0b1120" stroke="var(--sky)" stroke-width="1.4"/>
      <text x="12" y="152" fill="var(--sky)" font-size="9" font-weight="600" text-anchor="middle">3. สภาพแวดล้อม</text>
    </g>

    <!-- Slice 4: การกระทำหน้างาน (ชั้นที่หยุดอันตรายได้) -->
    <g transform="translate(290, 30)">
      <polygon points="0,15 25,0 25,125 0,140" fill="hsl(var(--d-green-400) / .22)" stroke="var(--ok)" stroke-width="2"/>
      <!-- รูไม่ตรงแนวลำแสง รูอยู่ข้างล่าง ลำแสงจึงชนเนื้อชีสหยุดลง -->
      <ellipse cx="13" cy="30" rx="5" ry="8" fill="#0b1120" stroke="var(--ok)" stroke-width="1.2"/>
      <ellipse cx="14" cy="115" rx="6" ry="9" fill="#0b1120" stroke="var(--ok)" stroke-width="1.2"/>
      <!-- จุดกระแทกหยุดยั้ง (Shield Impact) -->
      <circle cx="0" cy="65" r="9" fill="none" stroke="var(--ok)" stroke-width="2.5" opacity=".9"/>
      <circle cx="0" cy="65" r="4" fill="var(--ok)"/>
      <text x="12" y="152" fill="var(--ok)" font-size="9" font-weight="600" text-anchor="middle">4. การปฏิบัติ</text>
    </g>

    <rect x="238" y="14" width="112" height="22" rx="4" fill="hsl(var(--d-green-400) / .18)" stroke="var(--ok)" stroke-width="1"/>
    <text x="294" y="29" fill="var(--ok)" font-size="9.5" font-weight="600" text-anchor="middle">✓ ปิดรูสำเร็จ · ปลอดภัย</text>
  </svg>`,

  // 2. HFACS (Human Factors Analysis and Classification System)
  hfacs: `<svg class="td-svg" viewBox="0 0 360 200" aria-label="ลำดับขั้น HFACS 4 ระดับ">
    <g transform="translate(20, 16)">
      <!-- Tier 4: Organizational Influences -->
      <rect x="50" y="0" width="220" height="32" rx="6" fill="hsl(var(--d-violet-400) / .25)" stroke="hsl(var(--d-violet-400))" stroke-width="1.6"/>
      <text x="160" y="16" fill="#fff" font-size="11.5" font-weight="600" text-anchor="middle">ระดับ 4: อิทธิพลระดับองค์กร (Organizational)</text>
      <text x="160" y="27" fill="var(--text2)" font-size="8.5" text-anchor="middle">นโยบาย • ทรัพยากร • วัฒนธรรมความปลอดภัย</text>
      
      <!-- Tier 3: Unsafe Supervision -->
      <path d="M160 33L160 44" stroke="hsl(var(--d-violet-400))" stroke-width="2" marker-end="url(#arr)"/>
      <rect x="36" y="44" width="248" height="32" rx="6" fill="hsl(var(--d-violet-400) / .18)" stroke="hsl(var(--d-violet-400) / .8)" stroke-width="1.4"/>
      <text x="160" y="60" fill="var(--text)" font-size="11.5" font-weight="600" text-anchor="middle">ระดับ 3: การกำกับดูแลที่ไม่ปลอดภัย (Supervision)</text>
      <text x="160" y="71" fill="var(--text2)" font-size="8.5" text-anchor="middle">การฝึกอบรม • การวางแผนการบิน • การไม่กำกับแก้ไข</text>

      <!-- Tier 2: Preconditions for Unsafe Acts -->
      <path d="M160 77L160 88" stroke="hsl(var(--d-violet-400))" stroke-width="2"/>
      <rect x="22" y="88" width="276" height="32" rx="6" fill="hsl(var(--d-accent-t) / .16)" stroke="var(--sky)" stroke-width="1.4"/>
      <text x="160" y="104" fill="var(--sky)" font-size="11.5" font-weight="600" text-anchor="middle">ระดับ 2: สภาพก่อนเกิดเหตุ (Preconditions)</text>
      <text x="160" y="115" fill="var(--text2)" font-size="8.5" text-anchor="middle">ความพร้อมทางกาย/จิตใจ • CRM • สภาพแวดล้อมทางกายภาพ</text>

      <!-- Tier 1: Unsafe Acts -->
      <path d="M160 121L160 132" stroke="var(--sky)" stroke-width="2"/>
      <rect x="8" y="132" width="304" height="36" rx="6" fill="hsl(var(--d-glow) / .2)" stroke="var(--gold)" stroke-width="1.8"/>
      <text x="160" y="149" fill="var(--gold)" font-size="12" font-weight="700" text-anchor="middle">ระดับ 1: การกระทำที่ไม่ปลอดภัย (Unsafe Acts)</text>
      <text x="160" y="161" fill="var(--text2)" font-size="9" text-anchor="middle">ข้อผิดพลาด (Errors: ฝีมือ/การตัดสินใจ) • การฝ่าฝืนระเบียบ (Violations)</text>
    </g>
  </svg>`,

  // 3. SHELL Model
  shell: `<svg class="td-svg" viewBox="0 0 360 200" aria-label="แบบจำลอง SHELL">
    <!-- Center Liveware -->
    <g transform="translate(180, 100)">
      <rect x="-42" y="-36" width="84" height="72" rx="10" fill="hsl(175 75% 42% / .28)" stroke="#14b8a6" stroke-width="2.2"/>
      <text x="0" y="-8" fill="#14b8a6" font-size="18" font-weight="800" text-anchor="middle">L</text>
      <text x="0" y="10" fill="#fff" font-size="11" font-weight="600" text-anchor="middle">Liveware</text>
      <text x="0" y="24" fill="var(--text2)" font-size="8.5" text-anchor="middle">นักบิน (ใจกลาง)</text>
    </g>

    <!-- Top: Software (ระเบียบ/คู่มือ/SOP) -->
    <g transform="translate(180, 26)">
      <rect x="-65" y="-18" width="130" height="36" rx="6" fill="hsl(var(--d-accent-t) / .15)" stroke="var(--sky)" stroke-width="1.4"/>
      <line x1="0" y1="18" x2="0" y2="38" stroke="var(--sky)" stroke-width="1.5" stroke-dasharray="3 3"/>
      <text x="0" y="-1" fill="var(--sky)" font-size="11" font-weight="700" text-anchor="middle">S · Software</text>
      <text x="0" y="11" fill="var(--text2)" font-size="8.5" text-anchor="middle">SOP • คู่มือการบิน • เช็กลิสต์</text>
    </g>

    <!-- Left: Hardware (อากาศยาน/เครื่องวัด) -->
    <g transform="translate(56, 100)">
      <rect x="-46" y="-30" width="92" height="60" rx="6" fill="hsl(var(--d-glow) / .15)" stroke="var(--gold)" stroke-width="1.4"/>
      <line x1="46" y1="0" x2="82" y2="0" stroke="var(--gold)" stroke-width="1.5" stroke-dasharray="3 3"/>
      <text x="0" y="-8" fill="var(--gold)" font-size="11" font-weight="700" text-anchor="middle">H · Hardware</text>
      <text x="0" y="8" fill="var(--text2)" font-size="8.5" text-anchor="middle">ตัว ฮ. • เครื่องยนต์</text>
      <text x="0" y="20" fill="var(--text2)" font-size="8.5" text-anchor="middle">Avionics • เครื่องวัด</text>
    </g>

    <!-- Bottom: Environment (สภาพแวดล้อม/ภูมิประเทศ) -->
    <g transform="translate(180, 172)">
      <rect x="-65" y="-16" width="130" height="34" rx="6" fill="hsl(var(--d-green-400) / .15)" stroke="var(--ok)" stroke-width="1.4"/>
      <line x1="0" y1="-16" x2="0" y2="-36" stroke="var(--ok)" stroke-width="1.5" stroke-dasharray="3 3"/>
      <text x="0" y="0" fill="var(--ok)" font-size="11" font-weight="700" text-anchor="middle">E · Environment</text>
      <text x="0" y="12" fill="var(--text2)" font-size="8.5" text-anchor="middle">อากาศ • ป่าเขา • กลางคืน/หมอก</text>
    </g>

    <!-- Right: Liveware (คนรอบข้าง) -->
    <g transform="translate(304, 100)">
      <rect x="-46" y="-30" width="92" height="60" rx="6" fill="hsl(345 80% 55% / .15)" stroke="#f43f5e" stroke-width="1.4"/>
      <line x1="-46" y1="0" x2="-82" y2="0" stroke="#f43f5e" stroke-width="1.5" stroke-dasharray="3 3"/>
      <text x="0" y="-8" fill="#f43f5e" font-size="11" font-weight="700" text-anchor="middle">L · Liveware</text>
      <text x="0" y="8" fill="var(--text2)" font-size="8.5" text-anchor="middle">นักบินผู้ช่วย • ลูกเรือ</text>
      <text x="0" y="20" fill="var(--text2)" font-size="8.5" text-anchor="middle">ช่างเครื่อง • หอบังคับการ</text>
    </g>
  </svg>`,

  // 4. TEM (Threat and Error Management)
  tem: `<svg class="td-svg" viewBox="0 0 360 200" aria-label="กรอบแนวคิด TEM">
    <!-- Flow Pathway -->
    <path d="M30 100L330 100" stroke="var(--line2)" stroke-width="2"/>
    
    <!-- Stage 1: Threat -->
    <g transform="translate(60, 50)">
      <rect x="-46" y="0" width="92" height="70" rx="8" fill="hsl(345 80% 55% / .18)" stroke="#f43f5e" stroke-width="1.6"/>
      <text x="0" y="24" fill="#f43f5e" font-size="12" font-weight="700" text-anchor="middle">1. THREAT</text>
      <text x="0" y="40" fill="var(--text)" font-size="9.5" text-anchor="middle">ภัยคุกคามภายนอก</text>
      <text x="0" y="54" fill="var(--text2)" font-size="8" text-anchor="middle">สภาพอากาศ/ความกดดัน</text>
      <circle cx="0" cy="80" r="12" fill="hsl(345 80% 55% / .2)" stroke="#f43f5e" stroke-width="1.4"/>
      <text x="0" y="84" fill="#f43f5e" font-size="10" font-weight="700" text-anchor="middle">ดัก</text>
    </g>

    <!-- Stage 2: Error -->
    <g transform="translate(170, 50)">
      <rect x="-46" y="0" width="92" height="70" rx="8" fill="hsl(var(--d-glow) / .18)" stroke="var(--gold)" stroke-width="1.6"/>
      <text x="0" y="24" fill="var(--gold)" font-size="12" font-weight="700" text-anchor="middle">2. ERROR</text>
      <text x="0" y="40" fill="var(--text)" font-size="9.5" text-anchor="middle">ข้อผิดพลาดลูกเรือ</text>
      <text x="0" y="54" fill="var(--text2)" font-size="8" text-anchor="middle">สื่อสารพลาด/คีย์ผิด</text>
      <circle cx="0" cy="80" r="12" fill="hsl(var(--d-glow) / .2)" stroke="var(--gold)" stroke-width="1.4"/>
      <text x="0" y="84" fill="var(--gold)" font-size="10" font-weight="700" text-anchor="middle">แก้</text>
    </g>

    <!-- Stage 3: Undesired State -->
    <g transform="translate(280, 50)">
      <rect x="-46" y="0" width="92" height="70" rx="8" fill="hsl(var(--d-accent-t) / .18)" stroke="var(--sky)" stroke-width="1.6"/>
      <text x="0" y="24" fill="var(--sky)" font-size="12" font-weight="700" text-anchor="middle">3. UAS</text>
      <text x="0" y="40" fill="var(--text)" font-size="9.5" text-anchor="middle">ท่าทางบินไม่พึงประสงค์</text>
      <text x="0" y="54" fill="var(--text2)" font-size="8" text-anchor="middle">ระดับต่ำ/ความเร็วหลุด</text>
      <circle cx="0" cy="80" r="12" fill="hsl(var(--d-accent-t) / .2)" stroke="var(--sky)" stroke-width="1.4"/>
      <text x="0" y="84" fill="var(--sky)" font-size="10" font-weight="700" text-anchor="middle">ฟื้น</text>
    </g>

    <!-- Defense Outcome Banner -->
    <rect x="70" y="152" width="220" height="28" rx="6" fill="hsl(var(--d-green-400) / .18)" stroke="var(--ok)" stroke-width="1.4"/>
    <text x="180" y="170" fill="var(--ok)" font-size="10.5" font-weight="600" text-anchor="middle">✓ ปฏิบัติการบินปลอดภัย (Safe Flight Outcome)</text>
  </svg>`,

  // 5. Risk Assessment (5x5 Matrix & Risk Levels)
  risk: `<svg class="td-svg" viewBox="0 0 360 200" aria-label="เมทริกซ์ประเมินความเสี่ยง FAA 5x5">
    <g transform="translate(70, 25)">
      <!-- Matrix Grid 5x5 -->
      <!-- Row 1: Catastrophic -->
      <rect x="0" y="0" width="40" height="22" fill="#ef4444" opacity=".85"/><rect x="42" y="0" width="40" height="22" fill="#ef4444" opacity=".85"/>
      <rect x="84" y="0" width="40" height="22" fill="#ef4444" opacity=".85"/><rect x="126" y="0" width="40" height="22" fill="#f59e0b" opacity=".85"/>
      <rect x="168" y="0" width="40" height="22" fill="#f59e0b" opacity=".85"/>
      <!-- Row 2: Critical -->
      <rect x="0" y="24" width="40" height="22" fill="#ef4444" opacity=".85"/><rect x="42" y="24" width="40" height="22" fill="#ef4444" opacity=".85"/>
      <rect x="84" y="24" width="40" height="22" fill="#f59e0b" opacity=".85"/><rect x="126" y="24" width="40" height="22" fill="#f59e0b" opacity=".85"/>
      <rect x="168" y="24" width="40" height="22" fill="#10b981" opacity=".85"/>
      <!-- Row 3: Moderate -->
      <rect x="0" y="48" width="40" height="22" fill="#ef4444" opacity=".85"/><rect x="42" y="48" width="40" height="22" fill="#f59e0b" opacity=".85"/>
      <rect x="84" y="48" width="40" height="22" fill="#f59e0b" opacity=".85"/><rect x="126" y="48" width="40" height="22" fill="#10b981" opacity=".85"/>
      <rect x="168" y="48" width="40" height="22" fill="#10b981" opacity=".85"/>
      <!-- Row 4: Minor -->
      <rect x="0" y="72" width="40" height="22" fill="#f59e0b" opacity=".85"/><rect x="42" y="72" width="40" height="22" fill="#f59e0b" opacity=".85"/>
      <rect x="84" y="72" width="40" height="22" fill="#10b981" opacity=".85"/><rect x="126" y="72" width="40" height="22" fill="#10b981" opacity=".85"/>
      <rect x="168" y="72" width="40" height="22" fill="#10b981" opacity=".85"/>
      <!-- Row 5: Negligible -->
      <rect x="0" y="96" width="40" height="22" fill="#f59e0b" opacity=".85"/><rect x="42" y="96" width="40" height="22" fill="#10b981" opacity=".85"/>
      <rect x="84" y="96" width="40" height="22" fill="#10b981" opacity=".85"/><rect x="126" y="96" width="40" height="22" fill="#10b981" opacity=".85"/>
      <rect x="168" y="96" width="40" height="22" fill="#10b981" opacity=".85"/>

      <!-- Labels Axis -->
      <text x="-8" y="15" fill="var(--text2)" font-size="9" text-anchor="end">หายนะ (I)</text>
      <text x="-8" y="39" fill="var(--text2)" font-size="9" text-anchor="end">วิกฤต (II)</text>
      <text x="-8" y="63" fill="var(--text2)" font-size="9" text-anchor="end">ปานกลาง (III)</text>
      <text x="-8" y="87" fill="var(--text2)" font-size="9" text-anchor="end">เล็กน้อย (IV)</text>
      <text x="-8" y="111" fill="var(--text2)" font-size="9" text-anchor="end">เล็กมาก (V)</text>

      <text x="20" y="132" fill="var(--text2)" font-size="9" text-anchor="middle">บ่อย (A)</text>
      <text x="62" y="132" fill="var(--text2)" font-size="9" text-anchor="middle">อาจเกิด (B)</text>
      <text x="104" y="132" fill="var(--text2)" font-size="9" text-anchor="middle">บางครั้ง (C)</text>
      <text x="146" y="132" fill="var(--text2)" font-size="9" text-anchor="middle">ยาก (D)</text>
      <text x="188" y="132" fill="var(--text2)" font-size="9" text-anchor="middle">ยากยิ่ง (E)</text>
    </g>

    <!-- Legend -->
    <g transform="translate(40, 168)">
      <circle cx="10" cy="8" r="5" fill="#ef4444"/><text x="22" y="12" fill="var(--text)" font-size="9.5">ความเสี่ยงสูงมาก (High)</text>
      <circle cx="120" cy="8" r="5" fill="#f59e0b"/><text x="132" y="12" fill="var(--text)" font-size="9.5">ยอมรับได้จำกัด (Serious)</text>
      <circle cx="230" cy="8" r="5" fill="#10b981"/><text x="242" y="12" fill="var(--text)" font-size="9.5">ยอมรับได้ (Medium/Low)</text>
    </g>
  </svg>`,

  // 6. Dirty Dozen (12 Human Factor Traps)
  dozen: `<svg class="td-svg" viewBox="0 0 360 200" aria-label="Dirty Dozen 12 กับดักปัจจัยมนุษย์">
    <!-- Center Shield -->
    <g transform="translate(180, 100)">
      <circle cx="0" cy="0" r="68" fill="none" stroke="var(--line2)" stroke-width="1.5" stroke-dasharray="4 4"/>
      <circle cx="0" cy="0" r="34" fill="hsl(var(--d-green-400) / .2)" stroke="var(--ok)" stroke-width="2"/>
      <path d="M-10 -12L10 -12L12 2C12 10 -1 16 -10 12Z" fill="none" stroke="var(--ok)" stroke-width="1.6"/>
      <text x="0" y="2" fill="var(--ok)" font-size="10" font-weight="700" text-anchor="middle">DIRTY</text>
      <text x="0" y="14" fill="#fff" font-size="9" font-weight="700" text-anchor="middle">DOZEN</text>
    </g>

    <!-- 12 Nodes Radial -->
    <g transform="translate(180, 100)" font-size="8.5" fill="var(--text2)">
      <text x="0" y="-76" text-anchor="middle" fill="var(--gold)" font-weight="600">1. ขาดการสื่อสาร</text>
      <text x="52" y="-56" text-anchor="start">2. ประมาทชะล่าใจ</text>
      <text x="76" y="-14" text-anchor="start">3. ขาดความรู้</text>
      <text x="76" y="26" text-anchor="start" fill="#f43f5e" font-weight="600">4. สมาธิหลุด</text>
      <text x="50" y="66" text-anchor="start">5. ขาดทีมเวิร์ก</text>
      <text x="0" y="86" text-anchor="middle" fill="#f43f5e" font-weight="600">6. ความล้า (Fatigue)</text>
      <text x="-50" y="66" text-anchor="end">7. ขาดทรัพยากร</text>
      <text x="-76" y="26" text-anchor="end" fill="var(--gold)" font-weight="600">8. แรงกดดัน (Pressure)</text>
      <text x="-76" y="-14" text-anchor="end">9. ไม่กล้าทักท้วง</text>
      <text x="-52" y="-56" text-anchor="end">10. ความเครียด</text>
      <text x="-30" y="-76" text-anchor="middle">11. ขาด SA</text>
      <text x="32" y="-76" text-anchor="middle">12. ขนบผิด ๆ</text>
    </g>
  </svg>`,

  // 7. CRM (Crew Resource Management)
  crm: `<svg class="td-svg" viewBox="0 0 360 200" aria-label="CRM วงจรการสื่อสารในห้องนักบิน">
    <!-- Pilot Stations -->
    <g transform="translate(90, 85)">
      <rect x="-42" y="-36" width="84" height="72" rx="8" fill="hsl(25 90% 55% / .18)" stroke="#fb923c" stroke-width="1.8"/>
      <circle cx="0" cy="-12" r="10" fill="#fb923c" opacity=".8"/>
      <path d="M-14 14C-14 4 14 4 14 14Z" fill="#fb923c" opacity=".8"/>
      <text x="0" y="26" fill="#fff" font-size="10" font-weight="700" text-anchor="middle">PF (บินหลัก)</text>
    </g>

    <g transform="translate(270, 85)">
      <rect x="-42" y="-36" width="84" height="72" rx="8" fill="hsl(var(--d-accent-t) / .18)" stroke="var(--sky)" stroke-width="1.8"/>
      <circle cx="0" cy="-12" r="10" fill="var(--sky)" opacity=".8"/>
      <path d="M-14 14C-14 4 14 4 14 14Z" fill="var(--sky)" opacity=".8"/>
      <text x="0" y="26" fill="#fff" font-size="10" font-weight="700" text-anchor="middle">PM (ตรวจวัด)</text>
    </g>

    <!-- Communication Bridge -->
    <path d="M136 68 C 180 50, 180 50, 224 68" fill="none" stroke="#fb923c" stroke-width="2" marker-end="url(#arr)"/>
    <text x="180" y="52" fill="#fb923c" font-size="9" font-weight="600" text-anchor="middle">Callout / สื่อสารทักท้วง →</text>

    <path d="M224 102 C 180 120, 180 120, 136 102" fill="none" stroke="var(--sky)" stroke-width="2" marker-end="url(#arr)"/>
    <text x="180" y="126" fill="var(--sky)" font-size="9" font-weight="600" text-anchor="middle">← Acknowledge / ขานตอบยืนยัน</text>

    <!-- Bottom Closed Loop Badge -->
    <rect x="75" y="152" width="210" height="26" rx="6" fill="hsl(var(--d-card-bg-t) / .9)" stroke="var(--line2)" stroke-width="1"/>
    <text x="180" y="169" fill="var(--gold)" font-size="10" font-weight="600" text-anchor="middle">Two-Challenge Rule · ยืนยันเครื่องวัดตรงกัน</text>
  </svg>`,

  // 8. Situational Awareness (3 Levels)
  sa: `<svg class="td-svg" viewBox="0 0 360 200" aria-label="3 ระดับของ Situational Awareness">
    <g transform="translate(180, 180)">
      <!-- Radar Sweep Arcs -->
      <path d="M-50 0 A50 50 0 0 1 50 0" fill="hsl(175 75% 42% / .18)" stroke="#14b8a6" stroke-width="1.8"/>
      <path d="M-95 0 A95 95 0 0 1 95 0" fill="hsl(var(--d-accent-t) / .12)" stroke="var(--sky)" stroke-width="1.6"/>
      <path d="M-140 0 A140 140 0 0 1 140 0" fill="hsl(var(--d-glow) / .08)" stroke="var(--gold)" stroke-width="1.6" stroke-dasharray="4 3"/>

      <!-- Center Helicopter -->
      <polygon points="0,-14 6,-4 14,0 0,-2 -14,0 -6,-4" fill="#fff"/>
      <circle cx="0" cy="0" r="3" fill="#14b8a6"/>
    </g>

    <!-- Level Descriptions -->
    <g transform="translate(180, 0)">
      <rect x="-80" y="16" width="160" height="26" rx="5" fill="hsl(var(--d-glow) / .18)" stroke="var(--gold)" stroke-width="1.4"/>
      <text x="0" y="32" fill="var(--gold)" font-size="10.5" font-weight="700" text-anchor="middle">ระดับ 3: Projection (คาดการณ์ล่วงหน้า)</text>

      <rect x="-70" y="62" width="140" height="24" rx="5" fill="hsl(var(--d-accent-t) / .18)" stroke="var(--sky)" stroke-width="1.4"/>
      <text x="0" y="77" fill="var(--sky)" font-size="10" font-weight="600" text-anchor="middle">ระดับ 2: Comprehension (เข้าใจความหมาย)</text>

      <rect x="-60" y="106" width="120" height="24" rx="5" fill="hsl(175 75% 42% / .22)" stroke="#14b8a6" stroke-width="1.4"/>
      <text x="0" y="121" fill="#14b8a6" font-size="10" font-weight="600" text-anchor="middle">ระดับ 1: Perception (เห็น/ได้ยิน)</text>
    </g>
  </svg>`,

  // 9. ADM / DECIDE Model
  adm: `<svg class="td-svg" viewBox="0 0 360 200" aria-label="วงจรตัดสินใจ DECIDE Model">
    <!-- Hexagonal Decision Loop -->
    <g transform="translate(180, 100)">
      <!-- Central Badge -->
      <circle cx="0" cy="0" r="24" fill="hsl(345 80% 55% / .22)" stroke="#f43f5e" stroke-width="2"/>
      <text x="0" y="4" fill="#f43f5e" font-size="11" font-weight="800" text-anchor="middle">DECIDE</text>

      <!-- 6 Steps -->
      <!-- D: Detect -->
      <g transform="translate(0, -68)">
        <rect x="-35" y="-14" width="70" height="28" rx="6" fill="hsl(var(--d-sunk))" stroke="var(--gold)" stroke-width="1.4"/>
        <text x="0" y="-1" fill="var(--gold)" font-size="10" font-weight="700" text-anchor="middle">D · Detect</text>
        <text x="0" y="9" fill="var(--text2)" font-size="7.5" text-anchor="middle">ตรวจพบการเปลี่ยน</text>
      </g>

      <!-- E: Estimate -->
      <g transform="translate(68, -34)">
        <rect x="-35" y="-14" width="70" height="28" rx="6" fill="hsl(var(--d-sunk))" stroke="var(--sky)" stroke-width="1.4"/>
        <text x="0" y="-1" fill="var(--sky)" font-size="10" font-weight="700" text-anchor="middle">E · Estimate</text>
        <text x="0" y="9" fill="var(--text2)" font-size="7.5" text-anchor="middle">ประเมินผลกระทบ</text>
      </g>

      <!-- C: Choose -->
      <g transform="translate(68, 34)">
        <rect x="-35" y="-14" width="70" height="28" rx="6" fill="hsl(var(--d-sunk))" stroke="var(--sky)" stroke-width="1.4"/>
        <text x="0" y="-1" fill="var(--sky)" font-size="10" font-weight="700" text-anchor="middle">C · Choose</text>
        <text x="0" y="9" fill="var(--text2)" font-size="7.5" text-anchor="middle">เลือกผลลัพธ์</text>
      </g>

      <!-- I: Identify -->
      <g transform="translate(0, 68)">
        <rect x="-35" y="-14" width="70" height="28" rx="6" fill="hsl(var(--d-sunk))" stroke="var(--ok)" stroke-width="1.4"/>
        <text x="0" y="-1" fill="var(--ok)" font-size="10" font-weight="700" text-anchor="middle">I · Identify</text>
        <text x="0" y="9" fill="var(--text2)" font-size="7.5" text-anchor="middle">ระบุทางแก้</text>
      </g>

      <!-- D: Do -->
      <g transform="translate(-68, 34)">
        <rect x="-35" y="-14" width="70" height="28" rx="6" fill="hsl(var(--d-sunk))" stroke="var(--ok)" stroke-width="1.4"/>
        <text x="0" y="-1" fill="var(--ok)" font-size="10" font-weight="700" text-anchor="middle">D · Do</text>
        <text x="0" y="9" fill="var(--text2)" font-size="7.5" text-anchor="middle">ลงมือปฏิบัติ</text>
      </g>

      <!-- E: Evaluate -->
      <g transform="translate(-68, -34)">
        <rect x="-35" y="-14" width="70" height="28" rx="6" fill="hsl(var(--d-sunk))" stroke="var(--gold)" stroke-width="1.4"/>
        <text x="0" y="-1" fill="var(--gold)" font-size="10" font-weight="700" text-anchor="middle">E · Evaluate</text>
        <text x="0" y="9" fill="var(--text2)" font-size="7.5" text-anchor="middle">ประเมินซ้ำ</text>
      </g>
    </g>
  </svg>`,

  // 10. Spatial Disorientation (หลงสภาพการบิน & ขอบฟ้าจำลอง)
  sd: `<svg class="td-svg" viewBox="0 0 360 200" aria-label="เครื่องวัดท่าทางขอบฟ้าเทียม">
    <!-- Attitude Indicator Gauge Frame -->
    <g transform="translate(180, 95)">
      <!-- Outer Bezel -->
      <circle cx="0" cy="0" r="72" fill="#111a2c" stroke="var(--line2)" stroke-width="3"/>
      
      <!-- Sky & Earth Sphere (Banked 22 degrees) -->
      <g clip-path="url(#sd-clip)">
        <defs><clipPath id="sd-clip"><circle cx="0" cy="0" r="66"/></clipPath></defs>
        <g transform="rotate(-22)">
          <!-- Sky Blue -->
          <rect x="-100" y="-100" width="200" height="100" fill="#2f6fa8"/>
          <!-- Earth Brown -->
          <rect x="-100" y="0" width="200" height="100" fill="#7a4f2a"/>
          <!-- Horizon White Line -->
          <line x1="-100" y1="0" x2="100" y2="0" stroke="#fff" stroke-width="2.2"/>
          <!-- Pitch Ladder -->
          <line x1="-16" y1="-20" x2="16" y2="-20" stroke="#fff" stroke-width="1.6"/>
          <text x="20" y="-18" fill="#fff" font-size="8">10</text>
          <line x1="-24" y1="-40" x2="24" y2="-40" stroke="#fff" stroke-width="1.6"/>
          <text x="28" y="-38" fill="#fff" font-size="8">20</text>
          <line x1="-16" y1="20" x2="16" y2="20" stroke="#fff" stroke-width="1.6" stroke-dasharray="4 2"/>
          <text x="20" y="23" fill="#fff" font-size="8">-10</text>
        </g>
      </g>

      <!-- Aircraft Miniature Symbol (Yellow) -->
      <path d="M-36 0L-12 0L-8 8M36 0L12 0L8 8M-3 0L3 0M0 -3L0 3" stroke="#f2c66d" stroke-width="3.2" fill="none" stroke-linecap="round"/>
      <circle cx="0" cy="0" r="2.5" fill="#f2c66d"/>

      <!-- Bank Pointer -->
      <polygon points="0,-64 -5,-56 5,-56" fill="#f2c66d"/>
    </g>

    <!-- Side Warning Banner -->
    <text x="24" y="95" fill="var(--warn)" font-size="10.5" font-weight="700">หูชั้นในหลอกลวง</text>
    <text x="24" y="110" fill="var(--text2)" font-size="8.5">The Leans Illusion</text>

    <text x="336" y="95" fill="var(--sky)" font-size="10.5" font-weight="700" text-anchor="end">เชื่อเครื่องวัดเสมอ</text>
    <text x="336" y="110" fill="var(--text2)" font-size="8.5" text-anchor="end">Trust Flight Instruments</text>
  </svg>`,

  // 11. Pilot Fatigue & Circadian Rhythm
  fatigue: `<svg class="td-svg" viewBox="0 0 360 200" aria-label="กราฟรอบวันและความล้า Circadian Rhythm">
    <g transform="translate(40, 20)">
      <!-- Axes -->
      <line x1="0" y1="130" x2="280" y2="130" stroke="var(--line2)" stroke-width="1.5"/>
      <line x1="0" y1="10" x2="0" y2="130" stroke="var(--line2)" stroke-width="1.5"/>

      <!-- Window of Circadian Low (WOCL: 02:00 - 06:00) Danger Zone -->
      <rect x="23" y="10" width="46" height="120" fill="hsl(345 80% 55% / .18)" stroke="hsl(345 80% 55% / .5)" stroke-width="1" stroke-dasharray="3 3"/>
      <text x="46" y="25" fill="#f43f5e" font-size="8.5" font-weight="700" text-anchor="middle">WOCL</text>
      <text x="46" y="36" fill="#f43f5e" font-size="7" text-anchor="middle">จุดตื่นตัวต่ำสุด</text>

      <!-- Sine Curve (Alertness Rhythm) -->
      <!-- Peak around 14:00, Dip around 04:00 and 15:00 -->
      <path d="M0 80 C 20 115, 50 125, 93 90 C 130 55, 175 40, 210 65 C 245 90, 265 110, 280 95" fill="none" stroke="var(--sky)" stroke-width="2.5"/>

      <!-- Hour markers -->
      <text x="0" y="145" fill="var(--muted)" font-size="8" text-anchor="middle">00:00</text>
      <text x="46" y="145" fill="#f43f5e" font-size="8" font-weight="600" text-anchor="middle">04:00</text>
      <text x="93" y="145" fill="var(--muted)" font-size="8" text-anchor="middle">08:00</text>
      <text x="140" y="145" fill="var(--muted)" font-size="8" text-anchor="middle">12:00</text>
      <text x="186" y="145" fill="var(--muted)" font-size="8" text-anchor="middle">16:00</text>
      <text x="233" y="145" fill="var(--muted)" font-size="8" text-anchor="middle">20:00</text>
      <text x="280" y="145" fill="var(--muted)" font-size="8" text-anchor="middle">24:00</text>

      <!-- Sleep Debt Callout -->
      <rect x="130" y="75" width="140" height="24" rx="4" fill="hsl(var(--d-glow) / .15)" stroke="var(--gold)" stroke-width="1"/>
      <text x="200" y="90" fill="var(--gold)" font-size="8.5" font-weight="600" text-anchor="middle">หนี้การนอน > 2 ชม. กดทับปฏิกิริยาตอบสนอง</text>
    </g>

    <text x="180" y="185" fill="var(--text2)" font-size="9.5" text-anchor="middle">รอบชีวภาพควบคุมระดับความตื่นตัวของนักบินตลอด 24 ชั่วโมง</text>
  </svg>`,
};
