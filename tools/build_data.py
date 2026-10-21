"""สร้างไฟล์ข้อมูลของแอปจาก taxonomy และเคส INTL

ใช้:  python tools/build_data.py [--include-draft]

ผลลัพธ์:
  app/data/taxonomy.json  ค่าที่ใช้ในตัวกรอง
  app/data/intl.json      เคส INTL (ข้อมูลสาธารณะ ไม่เข้ารหัส)

ปกติรวมเฉพาะเคส status=published ใส่ --include-draft เพื่อดู draft ใน prototype
(การ์ดจะมีป้าย DRAFT) เคส status=cut ไม่รวมเลย เคส W2/RTAF ไม่ผ่านสคริปต์นี้ ให้ใช้ tools/encrypt_unit.mjs
"""
import csv
import json
import re
import sys
from datetime import date
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent.parent
TAX = ROOT / "taxonomy"
OUT = ROOT / "app" / "data"

REQUIRED = ["id", "source", "type", "year", "title", "aircraft", "mission",
            "environment", "summary", "factors", "actions_today",
            "brief_question", "ref", "status"]
TYPES = {"accident", "incident", "hazard", "area_hazard", "notice"}
SOURCES = {"W2", "RTAF", "INTL"}
STATUSES = {"draft", "published", "cut"}   # cut = FSO ตัดทิ้ง เก็บแถวไว้แต่ไม่ขึ้นแอป

# ชื่อหน่วยงานที่แสดงบนปุ่มรายงานต้นฉบับ
REF_HOSTS = {
    "aaiu.ie": "AAIU Ireland",
    "tsb-bst.gc.ca": "TSB Canada",
    "nsia.no": "NSIA Norway",
    "havarikommisjonen.no": "NSIA Norway",
    "gov.uk": "AAIB UK",
    "ntsb.gov": "NTSB USA",
    "mlit.go.jp": "JTSB Japan",
    "atsb.gov.au": "ATSB Australia",
    "bea.aero": "BEA France",
    "canada.ca": "RCAF Flight Safety",
    "mod.go.jp": "MOD Japan",
    "defense.gouv.fr": "BEA-É France",
    "mot.go.th": "AAIC Thailand",
    "aaib.gov.in": "AAIB India",
    "shk.se": "SHK Sweden",
}

# คำที่อาจระบุตัวตน — เตือนแต่ไม่บล็อก (ไม่ตรวจช่อง ref)
PII_PATTERNS = [
    (re.compile(r"(?<!\d)\d{5}(?!\d)"), "เลข 5 หลัก (หมายเลขเครื่อง?)"),
    (re.compile(r"\b\d{1,2}\s*[/.-]\s*\d{1,2}\s*[/.-]\s*\d{2,4}\b"), "วันที่เต็ม"),
    (re.compile(r"(ร\.ต\.|ร\.ท\.|ร\.อ\.|น\.ต\.|น\.ท\.|น\.อ\.|พ\.อ\.อ\.|จ\.อ\.|จ\.ท\.|จ\.ต\.)\s*[ก-๙]"),
     "ยศ + ชื่อ"),
]


# หัวข้อในเนื้อเรื่องเคส (docs/DECISIONS.md "เนื้อเรื่องเคส") ต้องตรงกับ STORY_H ใน app/app.js
STORY_LABELS = {"เหตุการณ์", "การรอดชีวิต", "ผลการสอบสวน", "นักบิน", "สาเหตุ", "หลังเหตุ"}
STORY_LINE = re.compile(r"^\[([^\]]+)\]\s*(.*)$")
# ระดับความแน่นอนของ JTSB เก็บเป็นภาษาญี่ปุ่นในวงเล็บ แอปแปลงเป็นป้ายภาษาไทยตอนแสดงผล (CONF ใน app/app.js)
CONF_TOKENS = ["可能性が高いと考えられる", "可能性は低い", "否定できない", "認められる", "推定",
               "考えられる", "思われる", "可能性"]
CONF_RX = re.compile(r"\(([^()]*?)(" + "|".join(CONF_TOKENS) + r")([^()]*)\)")
JAPANESE = re.compile(r"[\u3040-\u30ff\u3400-\u9fff]")


def read_csv(path):
    with open(path, encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def split_tags(value):
    return [v.strip() for v in value.split(";") if v.strip()]


def split_lines(value):
    value = value.replace("\\n", "\n")
    return [line.strip() for line in value.splitlines() if line.strip()]


def ref_label(url):
    u = urlparse(url)
    host = u.netloc.lower()
    # gov.uk มีทั้ง AAIB และ Service Inquiry ของกระทรวงกลาโหม
    if host.endswith("gov.uk") and "/service-inquiry" in u.path:
        return "UK MOD Service Inquiry"
    for key, label in REF_HOSTS.items():
        if host.endswith(key):
            return label
    return host or url


def main():
    include_draft = "--include-draft" in sys.argv
    errors, warnings = [], []

    taxonomy = {
        "aircraft": read_csv(TAX / "aircraft.csv"),
        "mission": read_csv(TAX / "mission.csv"),
        "environment": read_csv(TAX / "environment.csv"),
        "phase": read_csv(TAX / "phase.csv"),
        "hfacs": read_csv(TAX / "hfacs.csv"),
    }
    valid = {k: {r["code"] for r in v} for k, v in taxonomy.items()}
    # แบบ ฮ. ที่ปลดประจำการแล้ว (active=0) ใช้กับเคสหน่วยเท่านั้น (docs/DECISIONS.md)
    retired = {r["code"] for r in taxonomy["aircraft"] if r.get("active") == "0"}

    cases, seen = [], set()
    for row in read_csv(ROOT / "data" / "intl_seed.csv"):
        cid = row.get("id", "").strip() or "(ไม่มี id)"
        for col in REQUIRED:
            if not row.get(col, "").strip():
                errors.append(f"{cid}: ไม่มีค่าในช่อง {col}")
        if cid in seen:
            errors.append(f"{cid}: id ซ้ำ")
        seen.add(cid)
        if row["source"] not in SOURCES:
            errors.append(f"{cid}: source '{row['source']}' ไม่ถูกต้อง")
        if row["type"] not in TYPES:
            errors.append(f"{cid}: type '{row['type']}' ไม่ถูกต้อง")
        if row["status"] not in STATUSES:
            errors.append(f"{cid}: status '{row['status']}' ไม่ถูกต้อง")
        if not re.fullmatch(r"\d{4}", row["year"].strip()):
            errors.append(f"{cid}: year ต้องเป็นปี 4 หลัก")

        tags = {}
        for col in ["aircraft", "mission", "environment", "phase", "hfacs"]:
            tags[col] = split_tags(row.get(col, ""))
            for t in tags[col]:
                if t == "ALL" and col in ("aircraft", "mission", "environment"):
                    continue
                if t not in valid[col]:
                    errors.append(f"{cid}: {col} '{t}' ไม่อยู่ใน taxonomy")
                elif col == "aircraft" and t in retired:
                    errors.append(f"{cid}: aircraft '{t}' ปลดประจำการแล้ว เคส INTL ให้ติด ALL หรือแบบที่ใช้อยู่")

        summary = "\n".join(split_lines(row["summary"]))
        for line in summary.splitlines():
            m = STORY_LINE.match(line)
            if m and m.group(1) not in STORY_LABELS:
                errors.append(f"{cid}: หัวข้อ [{m.group(1)}] ใน summary ไม่อยู่ในรายการ {sorted(STORY_LABELS)}")
            elif m and not m.group(2):
                errors.append(f"{cid}: หัวข้อ [{m.group(1)}] ใน summary ไม่มีข้อความตามหลัง")

        for col, val in row.items():
            if col == "ref" or not val:
                continue
            if JAPANESE.search(CONF_RX.sub("", val)):
                warnings.append(f"{cid}.{col}: มีอักษรญี่ปุ่นนอกวงเล็บระดับความแน่นอน — ผู้อ่านอ่านไม่ออก")
            for pattern, what in PII_PATTERNS:
                if pattern.search(val):
                    warnings.append(f"{cid}.{col}: พบ{what} — ตรวจก่อนเผยแพร่")

        if row["status"] == "cut" or (row["status"] != "published" and not include_draft):
            continue
        cases.append({
            "id": cid,
            "source": row["source"],
            "type": row["type"],
            "year": int(row["year"]),
            "title": row["title"].strip(),
            **tags,
            "area_id": row.get("area_id", "").strip(),
            "severity": row.get("severity", "").strip(),
            "summary": summary,
            "factors": split_lines(row["factors"]),
            "actions_today": split_lines(row["actions_today"]),
            "brief_question": row["brief_question"].strip(),
            "ref": row["ref"].strip(),
            "ref_label": ref_label(row["ref"].strip()),
            "status": row["status"],
        })

    for w in warnings:
        print("เตือน:", w)
    if errors:
        for e in errors:
            print("ผิดพลาด:", e)
        sys.exit(1)

    OUT.mkdir(parents=True, exist_ok=True)
    version = date.today().isoformat()
    # ใน hfacs ส่งเฉพาะระดับหมวดไปที่ตัวกรอง ส่วน nanocode ใช้แสดงชื่อบนการ์ด
    (OUT / "taxonomy.json").write_text(
        json.dumps({"version": version, **taxonomy}, ensure_ascii=False, indent=1),
        encoding="utf-8")
    (OUT / "intl.json").write_text(
        json.dumps({"version": version, "cases": cases}, ensure_ascii=False, indent=1),
        encoding="utf-8")
    print(f"เขียน {len(cases)} เคส → app/data/intl.json (draft {'รวม' if include_draft else 'ไม่รวม'})")


if __name__ == "__main__":
    main()
