"""ดึงหัวข้อ ๐๔ (นิรภัยการบินและภาคพื้น) จาก export ของชีต "รปป.รวม" -> JSON นอก repo
ใช้: python tools/build_rpp.py ../w2-raw/regs/rpp.xlsx ../w2-raw/regs/rpp04.json
ผลลัพธ์เป็นข้อมูลหน่วย ห้ามวางใน repo — เข้ารหัสต่อด้วย tools/encrypt_regs.mjs"""
import json, re, sys
import openpyxl

src, out = sys.argv[1], sys.argv[2]
ws = openpyxl.load_workbook(src).worksheets[0]
items, on = [], False
for r in ws.iter_rows(min_col=1, max_col=4):
    a, b, c, d = r
    av = str(a.value or '').strip()
    if re.match(r'^[๐-๙]{2}\s', av) and not b.value:   # หัวกลุ่ม
        on = av.startswith('๐๔')
        continue
    if not on or not c.value:
        continue
    m = re.match(r'^บน\.2-(\d{2})-(\d{3})\s*(?:เรื่อง)?\s*(.+?)(?:\.pdf|\.p)?\s*$', str(c.value).strip())
    if not m:
        print('skip', repr(c.value), file=sys.stderr); continue
    yy = int(float(b.value)) if b.value else None
    items.append({
        'g': 'rpp', 'id': f'{m.group(1)}-{m.group(2)}',
        't': re.sub(r'\s+', ' ', m.group(3)).strip(),
        'y': 2500 + yy if yy is not None else None,
        'unit': av,
        'note': str(d.value or '').strip() or None,
        'u': c.hyperlink.target if c.hyperlink else None,
    })
json.dump({'source': 'รปป.บน.2 หัวข้อ ๐๔', 'items': items}, open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(len(items), 'items; no link:', sum(1 for x in items if not x['u']))
