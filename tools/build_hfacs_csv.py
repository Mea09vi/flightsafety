"""Usage: pdftotext -layout guide.pdf guide.txt; python build_hfacs_csv.py guide.txt ../taxonomy/hfacs.csv
Build taxonomy/hfacs.csv from DoD HFACS 8.0 Guide text (pdftotext -layout).
Labels come from each code's definition heading ('CODE Label: is when ...');
category rows come from the 'NAME (XX000): ...' headings. Nothing is typed by hand
except the tier names, which are the guide's four section titles."""
import csv, re, sys
src, out = sys.argv[1], sys.argv[2]
text = open(src, encoding="utf-8", errors="replace").read().replace("\f", "\n")
body = text.split("ORGANIZATIONAL INFLUENCES 8.0")[0]          # drop summary charts at the end
L = body.split("\n")

cats = {}
for m in re.finditer(r"^([A-Z][A-Z /&,\-]+?) \(([A-Z]{2}[0-9]00)\)", body, re.M):
    cats[m.group(2)] = m.group(1).title().replace("And", "and").replace("Or ", "or ").replace("Of ", "of ")
defs = {}
for i, l in enumerate(L):
    m = re.match(r"^([A-Z]{2}\d{3}) (.*)", l)
    if not m or m.group(1) in cats: continue
    t, j = m.group(2), i
    while ":" not in t and j < i + 3:
        j += 1; t += " " + L[j].strip()
    defs[m.group(1)] = re.sub(r"\s+", " ", t.split(":")[0]).strip()

def cat_of(code):
    for c in (code[:3] + "00", code[:2] + "000"):
        if c in cats: return c
    raise SystemExit(f"no category for {code}")
TIER = {"A": "Unsafe Acts", "P": "Preconditions", "S": "Supervision/Leadership", "O": "Organizational Influences"}

rows = [dict(code=c, label=n, level="category", category=c, tier=TIER[c[0]]) for c, n in cats.items()]
rows += [dict(code=c, label=n, level="nanocode", category=cat_of(c), tier=TIER[c[0]]) for c, n in defs.items()]
order = "APSO"
rows.sort(key=lambda r: (order.index(r["code"][0]), r["category"], r["level"] != "category", r["code"]))
with open(out, "w", encoding="utf-8-sig", newline="") as f:
    w = csv.DictWriter(f, fieldnames=["code", "label", "level", "category", "tier"]); w.writeheader(); w.writerows(rows)
print(len(cats), "categories,", len(defs), "nanocodes ->", out)
for c, n in cats.items(): print(" ", c, n, sum(1 for r in rows if r["category"] == c) - 1)
