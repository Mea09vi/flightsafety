// Service worker — app shell แบบ cache-first, ข้อมูลแบบ stale-while-revalidate
// เปลี่ยน VERSION ทุกครั้งที่แก้ไฟล์ใน SHELL เพื่อให้เครื่องผู้ใช้โหลดของใหม่
const VERSION = 'w2sb-2026-10-16d';
// ฟอนต์ฝังใน app/fonts/ (ชื่อไฟล์ <ฟอนต์>-<น้ำหนัก>-<ช่วงอักษร>.woff2) ต้องตรงกับ @font-face ใน styles.css
const FONTS = ['baijamjuree-600', 'notoserifthai-600', 'plexsansthai-400', 'plexsansthai-500', 'plexsansthai-600']
  .flatMap((f) => ['thai', 'latin'].map((s) => `fonts/${f}-${s}.woff2`))
  .concat(['fonts/plexmono-500-latin.woff2', 'fonts/plexmono-600-latin.woff2']);
// ภาพปกหน้าหลัก ธีมกลางคืน/กระดาษ ขนาดเต็มและจอเล็ก (รวม ~60 KB) ให้ปกขึ้นได้ตอนออฟไลน์
const IMG = ['night', 'day'].flatMap((t) => [`img/hero-${t}.webp`, `img/hero-${t}-s.webp`]);
const SHELL = ['./', 'index.html', 'styles.css', 'app.js', 'login.js', 'theory.js', 'lessons.js', 'manifest.webmanifest', 'icon.svg', ...FONTS, ...IMG];
const DATA = ['data/taxonomy.json', 'data/intl.json'];
const UNIT = 'data/unit.enc.json';

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(VERSION);
    // cache: 'reload' ข้าม HTTP cache ของเบราว์เซอร์ (Pages ตั้ง max-age=600) ไม่งั้นอาจได้ไฟล์เก่าใส่แคชเวอร์ชันใหม่
    await c.addAll([...SHELL, ...DATA].map((u) => new Request(u, { cache: 'reload' })));
    // ไฟล์หน่วยอาจไม่มีในบางเวอร์ชัน — ไม่ให้ install ล้มเพราะ 404
    try {
      const r = await fetch(UNIT, { cache: 'no-store' });
      if (r.ok) await c.put(UNIT, r);
    } catch { /* offline ตอนติดตั้ง */ }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== VERSION) await caches.delete(k);
    await self.clients.claim();
  })());
});

async function staleWhileRevalidate(req, e) {
  const c = await caches.open(VERSION);
  const hit = await c.match(req);
  const fresh = fetch(req).then((r) => {
    if (r.ok || r.type === 'opaque') c.put(req, r.clone());
    return r;
  }).catch(() => null);
  if (hit) { e.waitUntil(fresh); return hit; }
  return (await fresh) || Response.error();
}

async function networkFirst(req) {
  const c = await caches.open(VERSION);
  try {
    const r = await fetch(req, { cache: 'no-store' });
    if (r.ok) await c.put(req, r.clone());
    else if (r.status === 404) await c.delete(req); // ไฟล์ถูกถอดออกจากเวอร์ชันนี้
    return r;
  } catch {
    return (await c.match(req)) || new Response('', { status: 404 });
  }
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.origin === location.origin) {
    // ไฟล์ dev (localhost เท่านั้น) ห้ามเข้าแคช — ข้อมูลไม่เข้ารหัส
    if (url.pathname.endsWith('/data/unit.dev.json')) return;
    if (url.pathname.endsWith('/' + UNIT)) { e.respondWith(networkFirst(req)); return; }
    if (url.pathname.includes('/data/')) { e.respondWith(staleWhileRevalidate(req, e)); return; }
    if (req.mode === 'navigate') {
      e.respondWith(caches.match('index.html', { ignoreSearch: true }).then((r) => r || fetch(req)));
      return;
    }
    e.respondWith(caches.match(req, { ignoreSearch: true }).then((r) => r || fetch(req)));
    return;
  }
});
