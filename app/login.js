// หน้าเข้าสู่ระบบแบบ C "Swiss cheese" (DECISIONS.md หัวข้อ "หน้าเข้าสู่ระบบ")
// app.js โหลดไฟล์นี้เฉพาะตอนมีไฟล์หน่วยแต่เครื่องยังไม่มีกุญแจ ฉากนี้ยกเว้นกฎห้ามแสงเรืองของแอป
// ต้นแบบอยู่ที่ review/login_options/c-swiss.html (นอก git)

// ---------- ฉาก: แบบจำลองสวิสชีสของ Reason เรียงตามชั้นของ HFACS ----------
// อันตรายพุ่งผ่านแผ่นป้องกัน 4 ชั้น ชั้นที่ช่องโหว่ไม่ตรงทางจะหยุดไว้
// พิมพ์ = ชั้นหนึ่งแข็งแรงขึ้นชั่วครู่ · รหัสผิด = ช่องโหว่เรียงกันทุกชั้น อันตรายทะลุถึงอุบัติเหตุ · รหัสถูก = หยุดได้ตั้งแต่ชั้นแรก
// คืนค่า { resize(ctx, w, h, focus), frame(ctx, t, dt, RM), type(n), err(), ok(done), reset() }
function createScene() {
  const SKY = [108, 201, 255], BAD = [255, 122, 133], OK = [95, 211, 154], WARN = [244, 162, 89], LINE = [150, 180, 230], TX = [233, 238, 248], T2 = [181, 193, 214], MUT = [135, 148, 173];
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const rgba = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${clamp(a)})`;
  const mix = (a, b, k) => a.map((v, j) => v + (b[j] - v) * k);
  const ease = (k) => 1 - Math.pow(1 - clamp(k), 3);
  const now = () => performance.now() / 1000;
  const D2R = Math.PI / 180, TAU = Math.PI * 2;
  const MONO = '"IBM Plex Mono", ui-monospace, monospace', HEAD = '"Bai Jamjuree", "IBM Plex Sans Thai", sans-serif', BODY = '"IBM Plex Sans Thai", sans-serif';

  // ---- โลก 3 มิติ: แกน x = ทางของอันตราย, แผ่นตั้งฉากกับ x มีความหนา TH, พื้นอยู่ใต้แผ่น ----
  const GAP = .7, SW = 1, SH = 1.25, EXT = .75, TH = .045, FLOOR = -SH / 2 - .14;
  const XS = [-1.5, -.5, .5, 1.5].map((m) => m * GAP);
  const NAMES = ['อิทธิพลองค์กร', 'การกำกับดูแล', 'สภาพก่อนเกิดเหตุ', 'การกระทำ'];
  const SP = { x: XS[0] - EXT, y: .32, z: -.30 }, EP = { x: XS[3] + EXT, y: -.34, z: .26 };
  const along = (k) => ({ x: SP.x + (EP.x - SP.x) * k, y: SP.y + (EP.y - SP.y) * k, z: SP.z + (EP.z - SP.z) * k });
  const KS = XS.map((X) => (X - SP.x) / (EP.x - SP.x));
  const HIT = KS.map((k) => { const p = along(k); return { u: p.z, v: p.y }; });

  // ช่องโหว่: ชั้นละ 1 รูที่วนผ่านทางของอันตราย + รูอื่นอีก 2–3 รู (สุ่มแบบกำหนด seed ให้ภาพเหมือนเดิมทุกครั้ง)
  let seed = 11;
  const rnd = () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const HOLES = XS.map((X, i) => {
    const hit = HIT[i], last = i === 3;
    const r = .11 + rnd() * .03;
    // ชั้นสุดท้ายวนเป็นวงกลมที่ไม่เคยทับทาง เวลาปกติอันตรายจึงไม่ถึงอุบัติเหตุ
    const list = [{ key: true, rx: r * 1.12, ry: r, A: last ? r * 1.12 + .08 : .1 + rnd() * .06, ell: last ? 1 : .55 + rnd() * .45, w: (.32 + rnd() * .3) * (i % 2 ? 1 : -1), ph: rnd() * 6.283 }];
    for (let tries = 0; list.length < 4 && tries < 300; tries++) {
      const rx = .055 + rnd() * .07, ry = rx * (.7 + rnd() * .5);
      const u0 = (rnd() - .5) * (SW - 2 * rx - .14), v0 = (rnd() - .5) * (SH - 2 * ry - .14);
      if (Math.hypot(u0 - hit.u, v0 - hit.v) < (last ? .44 : .3)) continue;
      if (list.slice(1).some((h) => Math.hypot(h.u0 - u0, h.v0 - v0) < h.rx + rx + .1)) continue;
      list.push({ rx, ry, u0, v0, au: .025 + rnd() * .03, av: .025 + rnd() * .035, wu: .2 + rnd() * .3, wv: .2 + rnd() * .3, pu: rnd() * 6.283, pv: rnd() * 6.283 });
    }
    return list;
  });

  // ---- กล้อง: มองจากด้าน +x ค่อนมาทาง -z และกดลงเล็กน้อย จึงเห็นหน้า +x, สันบน และขอบด้าน -z ของแผ่น ----
  const DIST = 4.4, YAW0 = 42 * D2R, PIT = 16 * D2R;
  let yaw = YAW0, sc = 1, ox = 0, oy = 0;
  const P = (x, y, z) => {
    const cw = Math.cos(yaw), sw = Math.sin(yaw), cp = Math.cos(PIT), sp = Math.sin(PIT);
    const x1 = x * cw + z * sw, z1 = -x * sw + z * cw;
    const y2 = y * cp + z1 * sp, z2 = -y * sp + z1 * cp;
    const k = DIST / (DIST + z2);
    return [ox + x1 * k * sc, oy - y2 * k * sc, k];
  };
  const Pk = (k) => { const p = along(k); return P(p.x, p.y, p.z); };
  const poly = (ctx, pts) => { ctx.moveTo(pts[0][0], pts[0][1]); for (let j = 1; j < pts.length; j++) ctx.lineTo(pts[j][0], pts[j][1]); ctx.closePath(); };
  // วงรีบนระนาบ x = X (u = แกน z, v = แกน y)
  const ellipse = (ctx, X, u, v, rx, ry) => {
    for (let j = 0; j <= 32; j++) {
      const a = j / 32 * TAU, q = P(X, v + Math.sin(a) * ry, u + Math.cos(a) * rx);
      j ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]);
    }
    ctx.closePath();
  };

  let W, H, F, wide, cols = 4;
  let errAt = -9, okAt = -9, okDone = null, accAt = -9, nextEmit = 0, blocked = 0;
  let parts = [], rings = [];
  const pulse = [-9, -9, -9, -9], hitAt = [-9, -9, -9, -9];
  let holesNow = [];

  const inHole = (i, uv) => holesNow[i].some((h) => h.rx > .01 && ((uv.u - h.u) / h.rx) ** 2 + ((uv.v - h.v) / h.ry) ** 2 < .8);

  // ข้อความประกอบฉากบนจอกว้าง: [บรรทัดเด่น, บรรทัดรอง, สีบรรทัดเด่น]
  const CAP = {
    idle: ['อุบัติเหตุเกิดเมื่อช่องโหว่ทุกชั้นเรียงกัน', 'บรีฟก่อนบินช่วยปิดช่องโหว่ก่อนขึ้นบิน', TX],
    bad: ['ช่องโหว่เรียงกันครบทุกชั้น', 'อันตรายจึงทะลุถึงอุบัติเหตุ', BAD],
    ok: ['ปิดช่องโหว่ได้ทุกชั้น', 'อันตรายถูกหยุดไว้ตั้งแต่ชั้นแรก', OK],
  };
  const HEAD_H = 64, LEG_ROW = 40;
  const bottomH = () => 70 + (4 / cols) * LEG_ROW;

  const Scene = {
    resize(ctx, w, h, f) {
      W = w; H = h; F = f; wide = f.wide;
      cols = f.w >= 640 ? 4 : 2;
      yaw = YAW0; sc = 1; ox = 0; oy = 0;
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
      const add = (p) => { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); };
      for (const X of XS) for (const xx of [X - TH / 2, X + TH / 2]) for (const [u, v] of [[-1, 1], [1, 1], [1, -1], [-1, -1]]) add(P(xx, v * SH / 2, u * SW / 2));
      add(P(SP.x, SP.y, SP.z)); add(P(EP.x, EP.y, EP.z));
      // จอกว้าง: เผื่อหัวเรื่องด้านบน คำบรรยาย+ชื่อชั้นด้านล่าง และป้าย L1–L4 / อุบัติเหตุ รอบฉาก
      const ax = f.x, aw = f.w;
      const ay = f.y + (wide ? HEAD_H + 40 : 22);
      const ah = f.h - (wide ? HEAD_H + 40 + bottomH() + 28 : 30);
      sc = Math.min((aw - (wide ? 48 : 28)) / (x1 - x0), ah / (y1 - y0));
      ox = ax + aw / 2 - (x0 + x1) / 2 * sc;
      oy = ay + ah / 2 - (y0 + y1) / 2 * sc;
    },
    type(n) { pulse[(Math.max(1, n) - 1) % 4] = now(); },
    err() { errAt = now(); parts.push({ k: -.25, v: .9, force: true }); },
    ok(done) { okAt = now(); okDone = done; parts.push({ k: 0, v: 1.3, okp: true }); },
    reset() { errAt = okAt = accAt = -9; okDone = null; parts = []; rings = []; pulse.fill(-9); hitAt.fill(-9); },

    frame(ctx, t, dt, RM) {
      const T = now();
      const eT = T - errAt, okOn = okAt > 0, oT = T - okAt;
      const eOn = eT < 2.4;
      if (okOn && okDone && (RM || oT > 1.05)) { const d = okDone; okDone = null; d(); }
      // รหัสผิด: รูหลักทุกชั้นเลื่อนมาเรียงกันบนทาง ค้างไว้แล้วคลายกลับ (ลดการเคลื่อนไหว: เรียงทันที)
      const align = !eOn ? 0 : RM ? 1 : eT < 1.7 ? ease(eT / .6) : 1 - ease((eT - 1.7) / .7);
      // รหัสถูก: ปิดช่องโหว่ไล่จาก L1 ไป L4
      const closeOf = (i) => !okOn ? 0 : RM ? 1 : ease((oT - .09 * i) / .3);
      yaw = YAW0 + (RM ? 0 : 3 * D2R * Math.sin(.13 * t));

      holesNow = HOLES.map((list, i) => {
        const pk = RM ? 0 : clamp(1 - (T - pulse[i]) / .6);
        const shrink = (1 - .4 * pk) * (1 - closeOf(i));
        return list.map((h) => {
          let u, v, grow = 1;
          if (h.key) {
            u = HIT[i].u + h.A * Math.cos(h.w * t + h.ph);
            v = HIT[i].v + h.A * h.ell * Math.sin(h.w * t + h.ph);
            if (align > 0) { u += (HIT[i].u - u) * align; v += (HIT[i].v - v) * align; grow = 1 + .25 * align; }
          } else {
            u = h.u0 + h.au * Math.sin(h.wu * t + h.pu);
            v = h.v0 + h.av * Math.sin(h.wv * t + h.pv);
          }
          const rx = h.rx * shrink * grow, ry = h.ry * shrink * grow;
          u = clamp(u, -SW / 2 + rx + .04, SW / 2 - rx - .04);
          v = clamp(v, -SH / 2 + ry + .04, SH / 2 - ry - .04);
          return { u, v, rx, ry };
        });
      });

      // อันตรายลึกได้ถึงชั้นไหน (ชั้นแรกที่ช่องโหว่ไม่ตรงทาง)
      let block = 4;
      for (let i = 0; i < 4; i++) if (!inHole(i, HIT[i])) { block = i; break; }
      if (okOn) block = 0;
      const bad = eOn && align > .5;
      const hz = bad ? BAD : okOn ? OK : WARN;

      // ปล่อยอนุภาคอันตรายเป็นระยะ แล้วเดินหน้า
      if (!RM && !okOn && T > nextEmit) { parts.push({ k: 0, v: .38 }); nextEmit = T + .9; }
      for (const p of parts) {
        if (p.stop != null || p.gone) continue;
        const k0 = p.k; p.k += p.v * dt;
        for (let i = 0; i < 4; i++) {
          if (k0 < KS[i] && p.k >= KS[i]) {
            const pass = p.force || (!p.okp && !okOn && inHole(i, HIT[i]));
            if (!pass) { p.k = KS[i]; p.stop = i; p.stopT = T; rings.push({ i, T, col: okOn || p.okp ? OK : WARN }); hitAt[i] = T; blocked++; break; }
          }
        }
        if (p.stop == null && p.k >= 1) { p.gone = true; accAt = T; }
      }
      parts = parts.filter((p) => !p.gone && !(p.stop != null && T - p.stopT > .6));
      rings = rings.filter((r) => T - r.T < .9);

      const zoom = okOn && !RM ? 1 + 3 * Math.pow(clamp((oT - .6) / .8), 2) : 1;
      const fade = okOn && !RM ? 1 - clamp((oT - .9) / .5) : 1;

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#060a13'; ctx.fillRect(0, 0, W, H);
      const halo = (s, x, y) => { ctx.save(); ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(6,10,19,.9)'; ctx.strokeText(s, x, y); ctx.restore(); ctx.fillText(s, x, y); };

      // แสงรอบฉาก เปลี่ยนสีตามสถานะ
      {
        const c = P(0, 0, 0), R = sc * 1.9;
        const g = ctx.createRadialGradient(c[0], c[1], 0, c[0], c[1], R);
        g.addColorStop(0, rgba(bad ? mix(SKY, BAD, .7) : okOn ? mix(SKY, OK, closeOf(3)) : SKY, .075));
        g.addColorStop(1, rgba(SKY, 0));
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      }

      // ---- หัวเรื่อง ตัวนับ คำบรรยาย และชื่อชั้น (จอกว้าง) ----
      if (wide) {
        ctx.globalAlpha = fade;
        const x0 = F.x + 8, x1 = F.x + F.w - 8, y0 = F.y;
        ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
        ctx.font = `500 13px ${BODY}`; ctx.fillStyle = rgba(SKY, 1);
        ctx.fillText('แบบจำลองสวิสชีส · จัดชั้นตาม HFACS', x0, y0 + 18);
        const title = 'ชั้นป้องกัน 4 ชั้น ก่อนถึงอุบัติเหตุ';
        ctx.font = `600 22px ${HEAD}`; ctx.fillStyle = rgba(TX, 1);
        ctx.fillText(title, x0, y0 + 48);
        const tw = ctx.measureText(title).width;
        // ตัวนับอันตรายที่ถูกหยุด (ซ่อนถ้าที่ไม่พอ)
        ctx.textAlign = 'right';
        ctx.font = `400 13px ${BODY}`;
        const uw = ctx.measureText('ครั้ง').width;
        ctx.font = `500 26px ${MONO}`;
        const num = String(blocked).padStart(3, '0'), nw = ctx.measureText(num).width;
        if (tw + nw + uw + 48 < x1 - x0) {
          ctx.fillStyle = rgba(TX, 1); ctx.fillText(num, x1 - uw - 6, y0 + 48);
          ctx.font = `400 13px ${BODY}`; ctx.fillStyle = rgba(MUT, 1);
          ctx.fillText('ครั้ง', x1, y0 + 48);
          ctx.fillText('หยุดอันตรายไว้ได้', x1, y0 + 18);
        }
        ctx.fillStyle = rgba(LINE, .14); ctx.fillRect(x0, y0 + HEAD_H, x1 - x0, 1);

        // ชื่อชั้นตาม HFACS: ชั้นที่กำลังหยุดอันตรายไว้เป็นสีฟ้า
        const rows = 4 / cols, cw = (x1 - x0 + 20) / cols, ly = F.y + F.h - rows * LEG_ROW - 2;
        ctx.textAlign = 'left';
        for (let i = 0; i < 4; i++) {
          const lx = x0 + (i % cols) * cw, yy = ly + Math.floor(i / cols) * LEG_ROW, lw = cw - 20;
          const on = okOn || bad || i === block, col = okOn ? OK : bad ? BAD : SKY;
          ctx.fillStyle = on ? rgba(col, .85) : rgba(LINE, .2); ctx.fillRect(lx, yy, lw, on ? 2 : 1);
          ctx.font = `600 12px ${MONO}`; ctx.fillStyle = rgba(on ? col : MUT, 1);
          ctx.fillText(`L${i + 1}`, lx, yy + 25);
          const tagW = ctx.measureText(`L${i + 1}`).width;
          ctx.font = `400 14px ${BODY}`; ctx.fillStyle = rgba(on ? TX : T2, 1);
          ctx.fillText(NAMES[i], lx + tagW + 8, yy + 25);
        }
        const cap = bad ? CAP.bad : okOn ? CAP.ok : CAP.idle;
        ctx.font = `400 14.5px ${BODY}`; ctx.fillStyle = rgba(T2, 1);
        ctx.fillText(cap[1], x0, ly - 24);
        ctx.font = `600 18px ${HEAD}`; ctx.fillStyle = rgba(cap[2], 1);
        ctx.fillText(cap[0], x0, ly - 50);
        ctx.globalAlpha = 1;
      }

      ctx.save();
      const zp = Pk(KS[0]);
      ctx.translate(zp[0], zp[1]); ctx.scale(zoom, zoom); ctx.translate(-zp[0], -zp[1]);
      ctx.globalAlpha = fade;

      // สถานะของแต่ละแผ่น: สี ความสว่าง และความทึบตามระยะ
      const ST = [0, 1, 2, 3].map((i) => {
        const pk = RM ? 0 : clamp(1 - (T - pulse[i]) / .6);
        const hk = RM ? 0 : clamp(1 - (T - hitAt[i]) / .5);
        const ck = closeOf(i);
        return {
          tint: mix(SKY, OK, ck),
          lit: .55 * pk + .3 * hk + (!okOn && !bad && i === block ? .1 : 0) + .15 * ck,
          A: .8 + .2 * i / 3,
          rim: bad ? BAD : null,
        };
      });

      // ---- พื้นตาราง + รอยฐานของแต่ละแผ่น ----
      {
        const fx0 = SP.x - .3, fx1 = EP.x + .3, fz = .9, step = .2, cx = (fx0 + fx1) / 2, hx = (fx1 - fx0) / 2;
        const fa = (x, z) => clamp(1 - ((x - cx) / hx) ** 2 - (z / fz) ** 2);
        ctx.lineWidth = 1;
        const gl = (ax, az, bx, bz) => {
          for (let j = 0; j < 8; j++) {
            const xa = ax + (bx - ax) * j / 8, za = az + (bz - az) * j / 8, xb = ax + (bx - ax) * (j + 1) / 8, zb = az + (bz - az) * (j + 1) / 8;
            const a = .12 * fa((xa + xb) / 2, (za + zb) / 2);
            if (a < .004) continue;
            const p = P(xa, FLOOR, za), q = P(xb, FLOOR, zb);
            ctx.strokeStyle = rgba(LINE, a); ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke();
          }
        };
        for (let x = fx0; x <= fx1 + 1e-6; x += step) gl(x, -fz, x, fz);
        for (let z = -fz; z <= fz + 1e-6; z += step) gl(fx0, z, fx1, z);
        for (let i = 0; i < 4; i++) {
          const p = P(XS[i], FLOOR, -SW / 2), q = P(XS[i], FLOOR, SW / 2);
          const g = ctx.createLinearGradient(p[0], p[1], q[0], q[1]);
          g.addColorStop(0, rgba(ST[i].tint, .38)); g.addColorStop(1, rgba(ST[i].tint, .06));
          ctx.strokeStyle = g; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke();
        }
      }

      const seg = (ka, kb, solid) => {
        const p = Pk(ka), q = Pk(kb);
        const ln = () => { ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke(); };
        if (solid) {
          ctx.strokeStyle = rgba(hz, .13); ctx.lineWidth = 6; ln();
          ctx.strokeStyle = rgba(hz, .9); ctx.lineWidth = 1.6; ln();
        } else {
          ctx.setLineDash([3, 6]); ctx.strokeStyle = rgba(LINE, .3); ctx.lineWidth = 1.2; ln(); ctx.setLineDash([]);
        }
      };
      const glow = (p, col, a, r) => {
        if (a <= 0) return;
        const g = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], r * 4.5);
        g.addColorStop(0, rgba(col, .5 * a)); g.addColorStop(1, rgba(col, 0));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p[0], p[1], r * 4.5, 0, TAU); ctx.fill();
        ctx.fillStyle = rgba(mix(col, TX, .45), a); ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, TAU); ctx.fill();
      };
      // อนุภาคอันตรายเป็นดาวหาง หางเรียวไปทางต้นทาง
      const comet = (k, col) => {
        const p = Pk(k), q = Pk(Math.max(0, k - .06));
        const g = ctx.createLinearGradient(q[0], q[1], p[0], p[1]);
        g.addColorStop(0, rgba(col, 0)); g.addColorStop(1, rgba(col, .9));
        ctx.strokeStyle = g; ctx.lineWidth = 3; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(q[0], q[1]); ctx.lineTo(p[0], p[1]); ctx.stroke();
        ctx.lineCap = 'butt';
        glow(p, col, 1, 2.8);
      };
      const drawParts = (lo, hi) => {
        for (const p of parts) {
          if (p.stop != null || p.k <= lo || p.k > hi || p.k < 0) continue;
          comet(p.k, p.force ? BAD : p.okp ? OK : WARN);
        }
      };
      // แผ่นป้องกัน: สันบน + ขอบข้าง + หน้าแผ่นที่มีช่องโหว่ + ผนังในช่องโหว่ให้เห็นความหนา
      const slice = (i) => {
        const s = ST[i], X = XS[i], xf = X + TH / 2, xb = X - TH / 2, hu = SW / 2, hv = SH / 2, hs = holesNow[i];
        const A = s.A, L = s.lit, tc = s.tint;
        ctx.lineWidth = 1;
        ctx.beginPath(); poly(ctx, [P(xb, hv, -hu), P(xb, hv, hu), P(xf, hv, hu), P(xf, hv, -hu)]);
        ctx.fillStyle = rgba(mix(tc, TX, .25), (.3 + L * .4) * A); ctx.fill();
        ctx.beginPath(); poly(ctx, [P(xb, hv, -hu), P(xf, hv, -hu), P(xf, -hv, -hu), P(xb, -hv, -hu)]);
        ctx.fillStyle = rgba(tc, (.16 + L * .3) * A); ctx.fill();
        ctx.strokeStyle = rgba(LINE, .3 * A); ctx.stroke();

        const c = [P(xf, hv, -hu), P(xf, hv, hu), P(xf, -hv, hu), P(xf, -hv, -hu)];
        ctx.beginPath(); poly(ctx, c);
        for (const h of hs) if (h.rx > .006) ellipse(ctx, xf, h.u, h.v, h.rx, h.ry);
        let g = ctx.createLinearGradient(c[0][0], c[0][1], c[2][0], c[2][1]);
        g.addColorStop(0, rgba(tc, (.2 + L * .3) * A)); g.addColorStop(.6, rgba(tc, (.085 + L * .2) * A)); g.addColorStop(1, rgba(tc, (.04 + L * .12) * A));
        ctx.fillStyle = g; ctx.fill('evenodd');
        // แสงสะท้อนแนวทแยงบาง ๆ ให้ดูเป็นแผ่นใส
        g = ctx.createLinearGradient(c[3][0], c[3][1], c[1][0], c[1][1]);
        g.addColorStop(.5, 'rgba(255,255,255,0)'); g.addColorStop(.6, `rgba(255,255,255,${.05 * A})`); g.addColorStop(.72, 'rgba(255,255,255,0)');
        ctx.fillStyle = g; ctx.fill('evenodd');

        hs.forEach((h, j) => {
          if (h.rx < .006) return;
          ctx.save();
          ctx.beginPath(); ellipse(ctx, xf, h.u, h.v, h.rx, h.ry); ctx.clip();
          ctx.beginPath(); ellipse(ctx, xf, h.u, h.v, h.rx, h.ry); ellipse(ctx, xb, h.u, h.v, h.rx, h.ry);
          ctx.fillStyle = rgba(tc, (.32 + L * .3) * A); ctx.fill('evenodd');
          ctx.restore();
          ctx.beginPath(); ellipse(ctx, xf, h.u, h.v, h.rx, h.ry);
          const key = j === 0 && s.rim;
          ctx.strokeStyle = key ? rgba(s.rim, .95) : rgba(mix(tc, TX, .2), .4 * A); ctx.lineWidth = key ? 1.6 : 1; ctx.stroke();
        });

        ctx.beginPath(); poly(ctx, c);
        ctx.strokeStyle = rgba(LINE, (.42 + L * .3) * A); ctx.lineWidth = 1; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(c[0][0], c[0][1]); ctx.lineTo(c[1][0], c[1][1]);
        ctx.strokeStyle = rgba(mix(tc, TX, .35), (.78 + L * .22) * A); ctx.lineWidth = 1.25; ctx.stroke();
      };
      // จุดกระทบ: วงคลื่นบนระนาบของแผ่น
      const ringsAt = (i) => {
        for (const r of rings) {
          if (r.i !== i) continue;
          const k = (T - r.T) / .9, rr = .03 + .15 * ease(k);
          ctx.beginPath(); ellipse(ctx, XS[i] - TH / 2, HIT[i].u, HIT[i].v, rr, rr);
          ctx.strokeStyle = rgba(r.col, .85 * (1 - k)); ctx.lineWidth = 1.5; ctx.stroke();
        }
        for (const p of parts) if (p.stop === i) glow(Pk(KS[i]), p.okp || okOn ? OK : WARN, 1 - (T - p.stopT) / .6, 2.8);
      };

      // วาดจากหลังมาหน้า: เส้นทาง → อนุภาค → แผ่น → จุดกระทบ
      const ends = [0, ...KS, 1];
      for (let i = 0; i < 4; i++) {
        seg(ends[i], ends[i + 1], i <= block);
        drawParts(ends[i] - (i ? 0 : 1), ends[i + 1] - 1e-6);
        slice(i);
        ringsAt(i);
      }
      seg(KS[3], 1, block >= 4);
      drawParts(KS[3], 1.01);
      if (RM && !okOn && block < 4) glow(Pk(KS[block]), WARN, 1, 2.8);

      // ป้าย L1–L4 เหนือแผ่น (ชื่อเต็มอยู่ในรายการด้านล่างบนจอกว้าง)
      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      ctx.font = `600 ${wide ? 12.5 : 11}px ${MONO}`;
      for (let i = 0; i < 4; i++) {
        const p = P(XS[i], SH / 2, 0);
        ctx.fillStyle = rgba(okOn ? OK : bad ? BAD : i === block ? SKY : MUT, 1);
        halo(`L${i + 1}`, p[0], p[1] - 11);
      }

      // ต้นทางอันตราย / ปลายทางอุบัติเหตุ
      const s = Pk(0), e = Pk(1), lf = `600 ${wide ? 13.5 : 11.5}px ${HEAD}`;
      ctx.fillStyle = rgba(WARN, 1);
      ctx.beginPath(); poly(ctx, [[s[0], s[1] - 6], [s[0] + 6, s[1]], [s[0], s[1] + 6], [s[0] - 6, s[1]]]); ctx.fill();
      ctx.strokeStyle = rgba(WARN, .45); ctx.lineWidth = 1;
      ctx.beginPath(); poly(ctx, [[s[0], s[1] - 11], [s[0] + 11, s[1]], [s[0], s[1] + 11], [s[0] - 11, s[1]]]); ctx.stroke();
      ctx.font = lf; ctx.textAlign = 'center';
      halo('อันตราย', s[0], s[1] - 18);
      const acc = T - accAt < 1.2;
      const eCol = bad || acc ? BAD : MUT;
      ctx.strokeStyle = rgba(eCol, .95); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(e[0], e[1], 7, 0, TAU); ctx.stroke();
      ctx.fillStyle = rgba(eCol, .9); ctx.beginPath(); ctx.arc(e[0], e[1], 2.2, 0, TAU); ctx.fill();
      if (acc) {
        const k = (T - accAt) / 1.2;
        for (const [d, R] of [[0, 40], [.18, 24]]) {
          const kk = clamp((k - d) / (1 - d));
          ctx.strokeStyle = rgba(BAD, .85 * (1 - kk)); ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(e[0], e[1], 7 + R * ease(kk), 0, TAU); ctx.stroke();
        }
        glow(e, BAD, 1 - k, 4);
      }
      ctx.fillStyle = rgba(eCol, 1); ctx.font = lf; ctx.textBaseline = 'top';
      halo('อุบัติเหตุ', e[0], e[1] + 14);
      ctx.textBaseline = 'alphabetic';

      // จุดที่หยุดอันตรายได้ตอนปลดล็อก
      if (okOn) {
        const p = Pk(KS[0]), k = RM ? 1 : ease((oT - .1) / .3);
        ctx.strokeStyle = rgba(OK, .9 * k); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(p[0], p[1], 11, 0, TAU); ctx.stroke();
        ctx.fillStyle = rgba(OK, k); ctx.font = `600 ${wide ? 15 : 12}px ${HEAD}`; ctx.textAlign = 'center';
        halo('ป้องกันได้', p[0], p[1] - 20);
      }
      ctx.restore();
    },
  };
  return Scene;
}

// ---------- การ์ด ----------
const EYE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
const EYE_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3l18 18"/><path d="M10.6 5.1A10.9 10.9 0 0 1 12 5c6.4 0 10 7 10 7a17.6 17.6 0 0 1-3.2 4.1M6.6 6.6C3.7 8.5 2 12 2 12s3.6 7 10 7a10 10 0 0 0 5.4-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>';
const BAR_H = 32; // ความสูงแถบชั้นความลับ ต้องตรงกับ .g-cls ใน styles.css
const FLASH_MS = 950, OUT_MS = 450, MIN_BUSY_MS = 400;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// unlock(pass, remember) → Promise<boolean>
// onEnter() เรียกทันทีที่ถอดรหัสได้ ให้แอปวาดหน้าใหม่ไว้ข้างหลังระหว่างแอนิเมชัน
// onSkip() เรียกเมื่อเลือกดูเฉพาะเคสสากล · onClose() เรียกหลังเอาหน้าเข้าสู่ระบบออกแล้ว
export function openGate({ iter, unlock, onEnter, onSkip, onClose }) {
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const iterTxt = Number(iter || 0).toLocaleString('en-US');
  const gate = document.createElement('div');
  gate.className = 'gate';
  gate.setAttribute('role', 'dialog');
  gate.setAttribute('aria-modal', 'true');
  gate.setAttribute('aria-labelledby', 'g-h');
  gate.innerHTML = `
    <canvas class="g-scene" aria-hidden="true"></canvas>
    <div class="g-cls" role="note"><b>เปิดเผยได้ภายในหน่วย</b><span>· เคสของ บน.2 เข้ารหัสไว้ เปิดได้ด้วยรหัสผ่านหน่วยเท่านั้น</span></div>
    <div class="g-stage">
      <form class="g-box" novalidate autocomplete="off">
        <div class="g-cover">
          <img src="icon.svg" alt="" width="40" height="40">
          <div class="g-who"><b>W2 Safety Brief</b><small>กองบิน 2 · ฝ่ายนิรภัยการบิน</small></div>
        </div>
        <p class="g-kick">บทเรียนจากเคสจริง ก่อนขึ้นบินทุกเที่ยว</p>
        <h1 id="g-h">บทเรียนนิรภัย<span>ก่อนบิน</span></h1>
        <p class="g-sub">เลือกแบบ ภารกิจ และสภาพการบิน แอปจะดึงอุบัติเหตุ อุบัติการณ์ และ hazard ที่ตรงกับเที่ยวบินมาให้บรีฟ ใส่รหัสผ่านหน่วยเพื่อเปิดเคสของ บน.2</p>
        <label class="g-lbl" for="g-pw">รหัสผ่านหน่วย <small>ถามได้จาก FSO</small></label>
        <div class="g-pw">
          <input id="g-pw" type="password" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="อย่างน้อย 10 ตัวอักษร" aria-describedby="g-msg">
          <button type="button" class="g-eye" aria-label="แสดงรหัสผ่าน" aria-pressed="false">${EYE}</button>
        </div>
        <label class="g-rem"><input type="checkbox" id="g-rem" checked> จำไว้ในเครื่องนี้ <small>· เครื่องส่วนกลางให้เอาออก</small></label>
        <button class="g-go" type="submit"><span class="g-spin" aria-hidden="true"></span><span class="g-goT">ปลดล็อกและเข้าสู่บรีฟ</span></button>
        <p class="g-msg" id="g-msg" role="status" aria-live="polite"></p>
        <a class="g-skip" href="#/">ดูเฉพาะเคสสากล (ไม่ต้องใช้รหัส) →</a>
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
  const S = createScene();

  // น้ำหนักฟอนต์ที่ฉากใช้แต่ DOM อาจยังไม่ได้ขอ สั่งโหลดไว้ ฉากวาดใหม่ทุกเฟรมจึงเปลี่ยนเป็นฟอนต์จริงเอง
  for (const f of ['600 22px "Bai Jamjuree"', '500 26px "IBM Plex Mono"', '600 12px "IBM Plex Mono"', '400 14px "IBM Plex Sans Thai"', '500 13px "IBM Plex Sans Thai"']) {
    document.fonts?.load(f, 'ชั้นป้องกัน L1 0123').catch(() => {});
  }

  // ---------- วงรอบวาดฉาก ----------
  const cv = q('.g-scene');
  const ctx = cv.getContext('2d');
  const focusRect = () => {
    const b = box.getBoundingClientRect();
    if (innerWidth >= 900) return { x: b.right + 24, y: BAR_H + 16, w: Math.max(200, innerWidth - b.right - 48), h: innerHeight - BAR_H - 32, wide: true };
    return { x: 0, y: BAR_H + 8, w: innerWidth, h: Math.max(140, b.top - BAR_H - 16), wide: false };
  };
  const resize = () => {
    const dpr = Math.min(2, devicePixelRatio || 1);
    const W = innerWidth, H = innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    S.resize(ctx, W, H, focusRect());
  };
  addEventListener('resize', resize);
  // การ์ดเลื่อนขึ้นตอนเปิด และสูงขึ้นเมื่อมีข้อความแจ้ง/ฟอนต์โหลดเสร็จ ให้คำนวณพื้นที่ฉากใหม่
  box.addEventListener('animationend', (e) => { if (e.animationName === 'g-rise') resize(); });
  const ro = new ResizeObserver(resize);
  ro.observe(box);
  resize();

  let raf = 0, last = performance.now();
  const t0 = last;
  const loop = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    // ฉากพังต้องไม่ทำให้เข้าแอปไม่ได้: หยุดวาดเฉย ๆ แล้วให้ตัวจับเวลาใน pass() ปิดหน้านี้แทน
    try { S.frame(ctx, RM ? 0 : (now - t0) / 1000, RM ? 0 : dt, RM); } catch (err) { console.warn('gate scene', err); return; }
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);

  const close = () => {
    document.body.classList.remove('gated');
    gate.classList.add('out');
    setTimeout(() => {
      cancelAnimationFrame(raf);
      removeEventListener('resize', resize);
      ro.disconnect();
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
    S.type(pw.value.length);
    if (msg.classList.contains('bad')) { msg.textContent = ''; msg.className = 'g-msg'; }
  });

  let busy = false, done = false;
  const setBusy = (on) => {
    busy = on;
    go.disabled = on; go.classList.toggle('busy', on);
    goT.textContent = on ? 'กำลังถอดรหัส…' : 'ปลดล็อกและเข้าสู่บรีฟ';
  };
  const fail = () => {
    S.err();
    gate.classList.add('err');
    box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake');
    setTimeout(() => gate.classList.remove('err'), 900);
    msg.className = 'g-msg bad';
    msg.textContent = 'รหัสไม่ถูกต้อง ตรวจตัวพิมพ์และภาษาของแป้นพิมพ์แล้วลองใหม่';
    pw.select();
  };
  const pass = () => {
    done = true;
    go.disabled = true; pw.disabled = true;
    goT.textContent = 'ปลดล็อกแล้ว';
    msg.className = 'g-msg ok';
    msg.textContent = 'ถอดรหัสสำเร็จ กำลังเปิดเคสของ บน.2';
    onEnter?.();
    let flashed = false;
    const flash = () => {
      if (flashed) return;
      flashed = true;
      gate.classList.add('flash');
      setTimeout(close, RM ? 0 : FLASH_MS);
    };
    S.ok(flash);
    // ปกติฉากเรียก flash ราว 1 วินาทีหลังปลดล็อก ถ้าฉากหยุดวาด (canvas พัง, แท็บถูกซ่อน) ก็ยังเข้าแอปได้
    setTimeout(flash, 2500);
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
  q('.g-skip').addEventListener('click', (e) => {
    e.preventDefault();
    if (busy || done) return;
    done = true;
    onSkip?.();
    close();
  });

  // เมาส์/คีย์บอร์ด: โฟกัสช่องรหัสเลย · จอสัมผัส: ไม่โฟกัส แป้นพิมพ์จะได้ไม่บังฉากตั้งแต่เปิด
  if (matchMedia('(pointer: fine)').matches) pw.focus({ preventScroll: true });
}
