// พิมพ์เนื้อหาเคส INTL สำหรับวาดภาพจำลอง
// node tools/scenes/cases.mjs INTL-0001 INTL-0002 ...   หรือ   --file ids.txt (id ละบรรทัด)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const cases = JSON.parse(readFileSync(resolve(ROOT, 'app/data/intl.json'), 'utf8')).cases;
const byId = new Map(cases.map((c) => [c.id, c]));

let ids = process.argv.slice(2);
const fi = ids.indexOf('--file');
if (fi >= 0) ids = readFileSync(ids[fi + 1], 'utf8').split(/\s+/).filter(Boolean);

for (const id of ids) {
  const c = byId.get(id);
  if (!c) { console.log(`=== ${id}: ไม่พบ\n`); continue; }
  console.log(`=== ${c.id} · ${c.year} · ${c.type} · ${c.source}`);
  console.log(`หัวเรื่อง: ${c.title}`);
  console.log(`phase: ${c.phase.join(', ')} · env: ${c.environment.join(', ')} · mission: ${c.mission.join(', ')}`);
  console.log(c.summary);
  if (c.factors?.length) console.log(`ปัจจัย:\n- ${c.factors.join('\n- ')}`);
  console.log('');
}
