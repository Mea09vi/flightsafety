"""สร้างไฟล์ตรวจเคส INTL ให้ FSO (เปิดได้ทั้ง Excel และ Google Sheets)

ใช้:  python tools/make_review.py [--all] [--out review/ชื่อไฟล์.xlsx]

ค่าเริ่มต้นเลือกเฉพาะเคสที่ติดแบบ ฮ. ของ บน.2 (aircraft ไม่ใช่ ALL)
เรียงตามกลุ่มแบบ ฮ. ใน GROUP_ORDER และในแต่ละกลุ่มให้เคส ⚑ ขึ้นก่อน
--all  รวมเคส aircraft=ALL ด้วย (ต่อท้ายเป็นกลุ่ม ALL)

ช่อง "การตัดสิน" เติมให้จาก status ปัจจุบัน (published → ผ่าน, cut → ตัด) จึงสร้างไฟล์ใหม่ทับได้
ผลออกที่ review/ ซึ่งอยู่ใน .gitignore นำผลกลับเข้า seed ด้วย tools/apply_review.py
"""
import re
import sys
from datetime import date

from openpyxl import Workbook
from openpyxl.formatting.rule import CellIsRule
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.workbook.properties import CalcProperties
from openpyxl.worksheet.datavalidation import DataValidation

from build_data import TAX, read_csv, ref_label, split_tags
from review_common import (COLUMNS, DECISIONS, REVIEW_DIR, ROOT, SHEET,
                           base_of, norm, read_seed)

GROUP_ORDER = ["H225M", "B412EP", "S-92", "H135", "S-70I"]
DRAFT_DOC = ROOT / "docs" / "hfacs-draft.md"
FONT = "Tahoma"   # มีอักษรไทยในตัว ทั้งบน Windows และ Google Sheets

# ประเด็นที่บันทึกไว้นอก hfacs-draft.md
EXTRA_ISSUES = {}

FILL = {
    "input_head": "BF9000", "input": "FFF8E1",
    "edit_head": "1F4E79", "edit": "FFFFFF",
    "ro_head": "7F7F7F", "ro": "F2F2F2",
}


def clean_md(text):
    return text.replace("`", "").replace("**", "")


def parse_draft():
    """อ่าน docs/hfacs-draft.md: ตารางสรุป, เหตุผลรายเคส และกลุ่มเคสที่หัวเอกสารบอกว่าต้องให้ FSO ตัดสิน"""
    table, blocks, groups = {}, {}, {}
    current, section, bullet = None, "", None
    row_re = re.compile(r"^\| (\d{4}) \| (.*?) \| (.*?) \| (.*?) \| (.*?) \|$")
    for line in DRAFT_DOC.read_text(encoding="utf-8").splitlines():
        if line.startswith("## "):
            section = line[3:].strip()
        if section == "วิธีร่าง":
            m = re.match(r"^- \*\*(.+?)\*\*", line)
            if m:
                label = m.group(1).replace("(ต้องให้ FSO ตัดสิน)", "").strip(" :")
                bullet = label if ("FSO ตัดสิน" in line or "ไม่ได้เป็นฝ่ายทำผิด" in line) else None
            elif not line.startswith("  "):
                bullet = None
            if bullet:
                for num in re.findall(r"(?<!\d)(\d{4})(?!\d)", line):
                    groups.setdefault(f"INTL-{num}", [])
                    if bullet not in groups[f"INTL-{num}"]:
                        groups[f"INTL-{num}"].append(bullet)
            continue
        m = row_re.match(line)
        if m:
            num, title, hfacs, conf, alt = (s.strip() for s in m.groups())
            table[f"INTL-{num}"] = {
                "flag": "⚑" in line,
                "hfacs": "" if hfacs == "(ว่าง)" else hfacs,
                "confidence": "" if conf == "—" else conf,
                "alt": "" if alt == "—" else alt.replace("⚑", "").strip(),
            }
            continue
        m = re.match(r"^\*\*(INTL-\d{4})\*\*\s*(.*)$", line)
        if m:
            current = m.group(1)
            blocks[current] = [m.group(2)]
            continue
        if line.startswith("#"):
            current = None
        elif current:
            blocks[current].append(line)
    return table, {k: "\n".join(v).strip() for k, v in blocks.items()}, groups


def issues_of(block, group_labels=()):
    """ประเด็นที่ FSO ต้องตัดสิน: กลุ่มจากหัวเอกสาร + บรรทัดที่มี ⚑ / ข้อเสนอ / คำถามสำหรับ FSO"""
    out = [f"⚑ กลุ่ม: {label}" for label in group_labels]
    lines = block.splitlines()
    if lines and "⚑" in lines[0]:
        out.append("ภาพรวม " + clean_md(lines[0]))
    bullets = []
    for line in lines[1:]:
        if line.startswith("- "):
            bullets.append(line[2:])
        elif bullets and line.startswith("  "):
            bullets[-1] += " " + line.strip()
    for body in bullets:
        if ("⚑" in body or body.startswith("**ข้อเสนอ")
                or body.startswith("**คำถามสำหรับ FSO") or "FSO ตัดสิน" in body):
            out.append(clean_md(body))
    return "\n".join(out)


def display_len(text):
    # สระบน-ล่างและวรรณยุกต์ไทยไม่กินความกว้าง
    return sum(1 for ch in text if not ("ั" <= ch <= "ฺ" or "็" <= ch <= "๎"))


def row_height(values, widths):
    lines = 1
    for value, width in zip(values, widths):
        if not isinstance(value, str) or not value:
            continue
        per = max(int(width * 1.05), 4)
        n = sum(max(1, -(-display_len(part) // per)) for part in value.split("\n"))
        lines = max(lines, n)
    return min(409, 14 * lines + 6)


def main():
    include_all = "--all" in sys.argv
    out = REVIEW_DIR / ("intl_review_all.xlsx" if include_all else "intl_review_wing2.xlsx")
    if "--out" in sys.argv:
        out = ROOT / sys.argv[sys.argv.index("--out") + 1]

    _, seed = read_seed()
    table, blocks, draft_groups = parse_draft()
    hfacs_label = {r["code"]: r["label"] for r in read_csv(TAX / "hfacs.csv")}
    groups = GROUP_ORDER + (["ALL"] if include_all else [])

    picked, problems = [], []
    for row in seed:
        tags = split_tags(row["aircraft"])
        group = next((g for g in GROUP_ORDER if g in tags), "ALL")
        if group == "ALL" and not include_all:
            continue
        info = table.get(row["id"], {"flag": False, "hfacs": "", "confidence": "", "alt": ""})
        if row["id"] in table and norm(info["hfacs"]) != norm(row["hfacs"]):
            problems.append(f"{row['id']}: hfacs ใน seed ({row['hfacs']}) ไม่ตรงกับตารางใน hfacs-draft.md ({info['hfacs']})")
        block = blocks.get(row["id"], "")
        issue = "\n".join(filter(None, [EXTRA_ISSUES.get(row["id"], ""),
                                        issues_of(block, draft_groups.get(row["id"], []))]))
        flagged = bool(issue) or info["flag"] or "⚑" in block
        if flagged and not issue:
            issue = "⚑ ดูเหตุผลการร่างทางขวา"
        picked.append((groups.index(group), not flagged, row["id"], group, row, info, block, issue))
    picked.sort(key=lambda p: p[:3])

    wb = Workbook()
    wb.calculation = CalcProperties(fullCalcOnLoad=True)
    guide = wb.active
    guide.title = "วิธีใช้"
    ws = wb.create_sheet(SHEET)

    thin = Side(style="thin", color="BFBFBF")
    thick = Side(style="medium", color="1F4E79")
    keys = [c[0] for c in COLUMNS]
    widths = [c[2] for c in COLUMNS]

    for col, (key, head, width, kind) in enumerate(COLUMNS, start=1):
        cell = ws.cell(row=1, column=col, value=head)
        cell.font = Font(name=FONT, bold=True, color="FFFFFF", size=10)
        cell.fill = PatternFill("solid", fgColor=FILL[f"{kind}_head"])
        cell.alignment = Alignment(wrap_text=True, vertical="center", horizontal="center")
        ws.column_dimensions[cell.column_letter].width = width
    ws.row_dimensions[1].height = 34

    prev_group = None
    for i, (_, _, cid, group, row, info, block, issue) in enumerate(picked, start=1):
        r = i + 1
        decision = {"published": "ผ่าน", "cut": "ตัด"}.get(row["status"], "")
        values = {
            "order": i, "id": cid, "decision": decision, "note": "", "group": group,
            "aircraft": row["aircraft"], "issue": issue, "year": int(row["year"]),
            "title": row["title"], "summary": norm(row["summary"]),
            "factors": norm(row["factors"]), "actions_today": norm(row["actions_today"]),
            "brief_question": norm(row["brief_question"]), "hfacs": row["hfacs"],
            "hfacs_names": "\n".join(f"{c} {hfacs_label.get(c, '(ไม่มีใน taxonomy)')}"
                                     for c in split_tags(row["hfacs"])),
            "confidence": info["confidence"], "alt": info["alt"],
            "rationale": clean_md(block), "ref": ref_label(row["ref"]),
            "_base": base_of(row),
        }
        for col, (key, _, _, kind) in enumerate(COLUMNS, start=1):
            cell = ws.cell(row=r, column=col, value=values[key])
            cell.font = Font(name=FONT, size=10, color="595959" if kind == "ro" else "000000")
            cell.fill = PatternFill("solid", fgColor=FILL[kind])
            cell.alignment = Alignment(wrap_text=True, vertical="top")
            top = thick if group != prev_group else thin
            cell.border = Border(top=top, bottom=thin, left=thin, right=thin)
            if key == "ref":
                cell.hyperlink = row["ref"]
                cell.font = Font(name=FONT, size=10, color="0563C1", underline="single")
            if key == "issue" and issue:
                cell.font = Font(name=FONT, size=10, color="9C0006")
        ws.row_dimensions[r].height = row_height([values[k] for k in keys], widths)
        prev_group = group

    last = len(picked) + 1
    col_of = {k: ws.cell(row=1, column=i).column_letter for i, k in enumerate(keys, start=1)}
    dv = DataValidation(type="list", formula1='"' + ",".join(DECISIONS) + '"', allow_blank=True,
                        showErrorMessage=True, errorTitle="การตัดสิน",
                        error="เลือก ผ่าน / รอแก้ / ตัด หรือเว้นว่าง")
    ws.add_data_validation(dv)
    dv.add(f"{col_of['decision']}2:{col_of['decision']}{last}")
    for text, color in [("ผ่าน", "C6EFCE"), ("รอแก้", "FFEB9C"), ("ตัด", "FFC7CE")]:
        ws.conditional_formatting.add(
            f"{col_of['decision']}2:{col_of['decision']}{last}",
            CellIsRule(operator="equal", formula=[f'"{text}"'], fill=PatternFill("solid", fgColor=color)))
    ws.freeze_panes = f"{col_of['group']}2"
    ws.auto_filter.ref = f"A1:{col_of['ref']}{last}"
    ws.column_dimensions[col_of["_base"]].hidden = True

    build_guide(guide, groups, col_of, last, len(picked))
    wb.active = 0

    REVIEW_DIR.mkdir(exist_ok=True)
    wb.save(out)
    flagged = sum(1 for p in picked if not p[1])
    print(f"เขียน {len(picked)} เคส (⚑ {flagged}) → {out.relative_to(ROOT)}")
    for g in groups:
        print(f"  {g}: {sum(1 for p in picked if p[3] == g)}")
    for p in problems:
        print("เตือน:", p)


def build_guide(ws, groups, col_of, last, total):
    ws.column_dimensions["A"].width = 16
    for c in "BCDE":
        ws.column_dimensions[c].width = 12
    ws.column_dimensions["F"].width = 60

    def put(row, col, value, bold=False, size=10, color="000000", fill=None, wrap=False):
        cell = ws.cell(row=row, column=col, value=value)
        cell.font = Font(name=FONT, bold=bold, size=size, color=color)
        if fill:
            cell.fill = PatternFill("solid", fgColor=fill)
        cell.alignment = Alignment(wrap_text=wrap, vertical="top")
        return cell

    put(1, 1, f"ไฟล์ตรวจเคส INTL — {total} เคสที่ติดแบบ ฮ. ของ บน.2", bold=True, size=14)
    put(2, 1, f"สร้างจาก data/intl_seed.csv เมื่อ {date.today().isoformat()} · ทุกเคสเป็นข้อมูลสาธารณะ แปล/สรุปจากรายงานต้นฉบับ", color="595959")

    steps = [
        "1. เปิดแท็บ \"ตรวจ\" อ่านทีละแถว เรียงตามกลุ่มแบบ ฮ. (H225M → B412EP → S-92 → H135 → S-70I) และในแต่ละกลุ่มเคส ⚑ ขึ้นก่อน",
        "2. เลือกช่อง \"การตัดสิน\": ผ่าน = เผยแพร่ในแอป · รอแก้ = ยังไม่เผยแพร่ เขียนสิ่งที่ต้องแก้ในหมายเหตุ · ตัด = ไม่ใช้เคสนี้ (แถวยังอยู่ใน seed แต่ไม่ขึ้นแอป)",
        "3. ถ้าจะแก้ข้อความ แก้ในช่องที่หัวคอลัมน์สีน้ำเงินได้เลย ขึ้นบรรทัดใหม่ในเซลล์: Excel กด Alt+Enter · Google Sheets กด Ctrl+Enter",
        "4. ช่องที่หัวคอลัมน์สีเทาอ่านอย่างเดียว แก้ไปก็ไม่มีผล · ลิงก์ในคอลัมน์ \"รายงานต้นฉบับ\" เปิดรายงานภาษาเดิม",
        "5. ไม่ต้องทำครบในครั้งเดียว แถวที่ช่อง \"การตัดสิน\" ว่างจะถูกข้าม (ถ้าแก้ข้อความไว้ด้วย สคริปต์จะเตือนแต่ไม่นำเข้า)",
        "6. ส่งกลับ: บันทึกเป็น .xlsx (Google Sheets: ไฟล์ → ดาวน์โหลด → Microsoft Excel) วางไว้ในโฟลเดอร์ review/ แล้วบอก Claude ให้นำเข้า",
        "    หรือรันเอง: python tools/apply_review.py review/ชื่อไฟล์.xlsx (ดูผลก่อน) แล้วรันซ้ำโดยเติม --write",
    ]
    put(4, 1, "วิธีใช้", bold=True, size=12)
    for i, s in enumerate(steps):
        put(5 + i, 1, s)

    put(13, 1, "กติกา", bold=True, size=12)
    rules = [
        "ห้ามใส่ชื่อบุคคล หมายเลขเครื่อง หรือวันที่เต็มในช่องที่ขึ้นการ์ด เพราะ repo เป็น public (ช่องหมายเหตุ FSO ไม่เข้า repo)",
        "hfacs คั่นด้วย ; เช่น AE105;PC102 · ใส่แค่ระดับหมวด เช่น AE100 ก่อนก็ได้",
        "แบบ ฮ. ใช้ S-70I, S-92, H135, B412EP, H225M หรือ ALL คั่นด้วย ; (แบบที่ไม่มีใน บน.2 ให้ใช้ ALL)",
        "สิ่งที่ลูกเรือต้องทำวันนี้ 2–3 ข้อ ข้อละบรรทัด · severity ยังไม่ต้องใส่ (รอแบบฟอร์ม ทอ.) · เคส INTL ไม่ต้องมี area_id",
        "ความมั่นใจของรหัสที่ร่าง: H = รายงานเขียนเป็นสาเหตุโดยตรง · M = ต้องเลือกรหัสเองบ้าง · L = อนุมานจากมาตรการหลังเหตุ",
        "ข้อความในวงเล็บ \"(ข้อสังเกตของผู้ร่าง ไม่ใช่ข้อสรุปของรายงาน)\" = ผู้ร่างเติมเอง ตัดออกได้ถ้าไม่เห็นด้วย",
    ]
    for i, s in enumerate(rules):
        put(14 + i, 1, "• " + s)

    put(21, 1, "สีหัวคอลัมน์", bold=True, size=12)
    legend = [("FSO กรอก", FILL["input_head"], "การตัดสิน, หมายเหตุ FSO"),
              ("แก้ได้", FILL["edit_head"], "แบบ ฮ., ชื่อเรื่อง, สรุป, ปัจจัย, สิ่งที่ต้องทำ, คำถาม brief, hfacs"),
              ("อ่านอย่างเดียว", FILL["ro_head"], "ลำดับ, id, กลุ่ม, ประเด็น ⚑, ปี, ชื่อรหัส, ความมั่นใจ, เหตุผล, ลิงก์")]
    for i, (label, color, cols) in enumerate(legend):
        put(22 + i, 1, label, bold=True, color="FFFFFF", fill=color)
        put(22 + i, 2, cols)

    put(26, 1, "ตัวอย่างการกรอก (ตัวอย่างเท่านั้น ไม่ถูกนำเข้า)", bold=True, size=12)
    example = [("id", "การตัดสิน", "หมายเหตุ FSO", "hfacs"),
               ("INTL-0000", "รอแก้", "ข้อ 2 ของสิ่งที่ต้องทำ ให้อ้าง SOP hoist ของฝูง 203", "AE105;PC102")]
    for i, line in enumerate(example):
        for j, v in enumerate(line):
            put(27 + i, 1 + j if j < 3 else 6, v, bold=(i == 0), fill="FFF8E1" if i else "D9D9D9", wrap=True)

    put(30, 1, "ความคืบหน้า (นับจากแท็บ ตรวจ)", bold=True, size=12)
    heads = ["กลุ่มแบบ", "ทั้งหมด", "ผ่าน", "รอแก้", "ตัด", "ยังไม่ตรวจ"]
    for j, h in enumerate(heads):
        put(31, 1 + j, h, bold=True, fill="D9D9D9")
    rng = lambda key: f"'{SHEET}'!${col_of[key]}$2:${col_of[key]}${last}"
    for i, g in enumerate(groups + ["รวม"]):
        r = 32 + i
        put(r, 1, g, bold=(g == "รวม"))
        if g == "รวม":
            for j in range(2, 7):
                letter = ws.cell(row=r, column=j).column_letter
                put(r, j, f"=SUM({letter}32:{letter}{r - 1})", bold=True)
            continue
        put(r, 2, f'=COUNTIF({rng("group")},$A{r})')
        for j, d in enumerate(DECISIONS, start=3):
            put(r, j, f'=COUNTIFS({rng("group")},$A{r},{rng("decision")},"{d}")')
        put(r, 6, f"=B{r}-C{r}-D{r}-E{r}")


if __name__ == "__main__":
    main()
