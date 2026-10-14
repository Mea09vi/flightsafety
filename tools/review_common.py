"""ส่วนที่ make_review.py และ apply_review.py ใช้ร่วมกัน

ไฟล์ตรวจเก็บ fingerprint ของค่าใน seed ณ ตอนสร้างไฟล์ไว้ในคอลัมน์ซ่อน `_base`
apply_review.py ใช้แยกว่าเซลล์ไหน FSO แก้จริง และเซลล์ไหน seed เปลี่ยนไปหลังสร้างไฟล์ (ชนกัน)
"""
import csv
import hashlib
import io
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SEED = ROOT / "data" / "intl_seed.csv"
REVIEW_DIR = ROOT / "review"   # อยู่ใน .gitignore — หมายเหตุของ FSO อาจอ้างถึงหน่วย

SHEET = "ตรวจ"
DECISIONS = ["ผ่าน", "รอแก้", "ตัด"]
STATUS_OF = {"ผ่าน": "published", "รอแก้": "draft", "ตัด": "cut"}

# ช่องใน seed ที่ FSO แก้ในไฟล์ตรวจได้ (ลำดับนี้ใช้ใน _base ห้ามสลับ)
EDITABLE = ["aircraft", "title", "summary", "factors", "actions_today",
            "brief_question", "hfacs"]

# หัวคอลัมน์ในแท็บ "ตรวจ": (key, หัวคอลัมน์, ความกว้าง, ชนิด)
#   input = FSO กรอก · edit = แก้ได้ (ค่าจาก seed) · ro = อ่านอย่างเดียว
COLUMNS = [
    ("order", "ลำดับ", 5, "ro"),
    ("id", "id", 11, "ro"),
    ("decision", "การตัดสิน", 10, "input"),
    ("note", "หมายเหตุ FSO", 28, "input"),
    ("group", "กลุ่มแบบ", 8, "ro"),
    ("aircraft", "แบบ ฮ. (aircraft)", 12, "edit"),
    ("issue", "⚑ ประเด็นที่ต้องตัดสิน", 42, "ro"),
    ("year", "ปี", 6, "ro"),
    ("title", "ชื่อเรื่อง", 30, "edit"),
    ("summary", "สรุปเหตุการณ์", 55, "edit"),
    ("factors", "ปัจจัยสาเหตุ", 60, "edit"),
    ("actions_today", "สิ่งที่ลูกเรือต้องทำวันนี้", 55, "edit"),
    ("brief_question", "คำถาม brief", 40, "edit"),
    ("hfacs", "hfacs", 16, "edit"),
    ("hfacs_names", "ชื่อรหัส HFACS (ตามร่างเดิม)", 38, "ro"),
    ("confidence", "มั่นใจ", 7, "ro"),
    ("alt", "รหัสทางเลือก", 14, "ro"),
    ("rationale", "เหตุผลการร่าง HFACS", 70, "ro"),
    ("ref", "รายงานต้นฉบับ", 16, "ro"),
    ("_base", "_base (ห้ามแก้)", 10, "ro"),
]


def norm(value):
    """ทำค่าให้เทียบกันได้หลังผ่าน Excel / Google Sheets"""
    if value is None:
        return ""
    text = str(value).replace("\r\n", "\n").replace("\r", "\n")
    text = text.replace(chr(92) + "n", "\n")   # \n แบบตัวอักษร (build_data.py รับทั้งสองแบบ)
    lines = [line.rstrip() for line in text.split("\n")]
    return "\n".join(lines).strip()


def fingerprint(value):
    return hashlib.sha1(norm(value).encode("utf-8")).hexdigest()[:10]


def base_of(row):
    return ",".join(fingerprint(row.get(k, "")) for k in EDITABLE)


def read_seed():
    raw = SEED.read_bytes()
    reader = csv.DictReader(io.StringIO(raw.decode("utf-8-sig"), newline=""))
    rows = list(reader)
    return reader.fieldnames, rows


def write_seed(fieldnames, rows):
    buf = io.StringIO(newline="")
    writer = csv.DictWriter(buf, fieldnames=fieldnames, lineterminator="\r\n")
    writer.writeheader()
    writer.writerows(rows)
    SEED.write_bytes(("﻿" + buf.getvalue()).encode("utf-8"))
