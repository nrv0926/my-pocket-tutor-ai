#!/usr/bin/env python3
"""
Transcribe Ontario expectation continuum PDFs into data/ontario/*.json.

CLAUDE.md §6: expectations are transcribed, never generated. This script is
the transcription — it reads the Ministry's own PDFs and copies the codes and
wording out verbatim. Nothing here paraphrases, summarises, or invents.

The continuum PDFs lay Grades 1-8 out as eight columns on one landscape page,
so flat text extraction interleaves the grades into nonsense. Words are
assigned to a column by x-position instead, using the "Grade N" header row to
locate the column edges.

Usage:
    python3 -m venv .venv && .venv/bin/pip install pdfplumber
    .venv/bin/python scripts/extract_ontario.py <pdf-dir> <out-dir>
"""
import json
import re
import sys
from pathlib import Path

import pdfplumber

CODE = re.compile(r"^([A-F]\d+)\.(\d+)$")
OVERALL = re.compile(r"OVERALL EXPECTATION\s+([A-F]\d+)\.?\s*(.*?)(?=OVERALL EXPECTATION|SPECIFIC EXPECTATIONS|$)", re.I | re.S)
# Ontario renders the first letter of some overalls as its own text run
# ("d emonstrate"). Rejoin rather than shipping the artifact.
SPLIT_HEAD = re.compile(r"^([a-z]) ([a-z]{2,})")
# Some strands publish per grade ("Grade 1" ... "Grade 8"), others per band
# ("Grades 1-3", "Grades 4-6", "Grades 7-8"). Both layouts appear in the same
# subject, so the parser detects which one it is looking at.
BAND = re.compile(r"^(\d)[\u2013\u2014-](\d)$")
# Sub-headings inside a column ("Effective Listening Skills", "Whole Numbers")
# are set in a bold cut of the body face. They are navigation, not
# expectations, and appending them to the previous entry corrupts its text.
BOLD = re.compile(r"bold|black|heavy", re.I)
# Running header and footer ("| 2 Strand B. Foundations of Language") sit in
# the page margins and would otherwise be swept into the last expectation on
# the page.
FOOTER_MARGIN = 35
HEADER_MARGIN = 70
GRADE_HEADER = re.compile(r"^Grades?\s+\d", re.I)

# strand letter -> (name, source pdf) per subject.
SOURCES = {
    "language": {
        "policyYear": 2023,
        "source": "https://www.dcp.edu.gov.on.ca/en/curriculum/elementary-language",
        "strands": {
            "A": ("Literacy Connections and Applications", "Expectations_StrandA.pdf"),
            "B": ("Foundations of Language", "Expectations_StrandB.pdf"),
            "C": ("Comprehension: Understanding and Responding to Texts", "Expectations_StrandC.pdf"),
            "D": ("Composition: Expressing Ideas and Creating Texts", "Expectations_StrandD.pdf"),
        },
    },
    "mathematics": {
        "policyYear": 2020,
        "source": "https://www.dcp.edu.gov.on.ca/en/curriculum/elementary-mathematics",
        "strands": {
            "A": ("Social-Emotional Learning Skills and the Mathematical Processes", "SEL_AODA.pdf"),
            "B": ("Number", "Number_AODA.pdf"),
            "C": ("Algebra", "Algebra_AODA.pdf"),
            "D": ("Data", "Data_AODA.pdf"),
            "E": ("Spatial Sense", "Spatial_AODA.pdf"),
            "F": ("Financial Literacy", "Financial_AODA.pdf"),
        },
    },
}


def tidy(text: str) -> str:
    text = " ".join(text.split())
    text = SPLIT_HEAD.sub(r"\1\2", text)
    # Hyphen inserted by the line-wrap, e.g. "non- verbally".
    text = re.sub(r"(\w)- (\w)", r"\1\2", text)
    return text.strip()


def detect_layout(pdf):
    """
    Work out the column layout once for the whole document.

    Returns (starts, grades_per_column). A per-grade table gives one grade per
    column; a banded table gives several, and the band is expanded so callers
    never have to care which layout the source used.
    """
    for page in pdf.pages:
        words = page.extract_words()
        bands = []
        for i, w in enumerate(words):
            if w["text"] != "Grades" or i + 1 >= len(words):
                continue
            m = BAND.match(words[i + 1]["text"])
            if m:
                lo, hi = int(m.group(1)), int(m.group(2))
                bands.append((w["x0"], [str(g) for g in range(lo, hi + 1)]))
        if len(bands) >= 2:
            bands.sort(key=lambda b: b[0])
            lefts = [b[0] for b in bands]
            pitch = (lefts[-1] - lefts[0]) / (len(lefts) - 1)
            return [l - pitch * 0.08 for l in lefts], [b[1] for b in bands]

        hdr = sorted((w for w in words if w["text"] == "Grade"), key=lambda w: w["x0"])
        if len(hdr) >= 2:
            lefts = [w["x0"] for w in hdr]
            pitch = (lefts[-1] - lefts[0]) / (len(lefts) - 1)
            return [l - pitch * 0.22 for l in lefts], [[str(i + 1)] for i in range(len(lefts))]
    return None, None


def column_of(x: float, starts) -> int:
    best, index = None, 0
    for i, s in enumerate(starts):
        d = x - s
        if d >= -6 and (best is None or d < best):
            best, index = d, i
    return index


def _emit(cur):
    text = " ".join(x["text"] for x in cur)
    bold = sum(1 for x in cur if BOLD.search(x.get("fontname", "")))
    return text, bold > len(cur) / 2


def lines_in_column(words, starts, ci, tol=3.0):
    """-> [(text, is_bold_heading)] for one column, in reading order."""
    sel = [w for w in words if column_of(w["x0"], starts) == ci]
    sel.sort(key=lambda w: (round(w["top"] / tol), w["x0"]))
    out, cur, cur_top = [], [], None
    for w in sel:
        if cur_top is None or abs(w["top"] - cur_top) <= tol:
            cur.append(w)
            cur_top = w["top"] if cur_top is None else cur_top
        else:
            out.append(_emit(cur))
            cur, cur_top = [w], w["top"]
    if cur:
        out.append(_emit(cur))
    return out


def parse_strand(path: Path):
    """-> (overall[], {grade: specific[]})"""
    overall, seen = [], set()
    per_grade: dict[str, list] = {}

    with pdfplumber.open(path) as pdf:
        starts, grades_per_col = detect_layout(pdf)
        for page in pdf.pages:
            flat = (page.extract_text() or "").replace("\n", " ")
            for m in OVERALL.finditer(flat):
                code, text = m.group(1), tidy(m.group(2))
                if code in seen or not text:
                    continue
                seen.add(code)
                overall.append({"code": code, "text": text})

            if not starts:
                continue
            words = [
                w
                for w in page.extract_words(extra_attrs=["fontname"])
                if HEADER_MARGIN <= w["top"] <= page.height - FOOTER_MARGIN
            ]
            for ci in range(len(starts)):
                collected = []
                current = None
                for line, is_heading in lines_in_column(words, starts, ci):
                    head = line.split(" ", 1)[0]
                    if CODE.match(head):
                        rest = line.split(" ", 1)
                        current = {"code": head, "text": rest[1] if len(rest) > 1 else ""}
                        collected.append(current)
                    elif is_heading or GRADE_HEADER.match(line):
                        # A sub-heading or a repeated column header ends the
                        # entry above it.
                        current = None
                    elif current is not None:
                        current["text"] += " " + line
                # A banded column carries the same wording for every grade in
                # the band, so it is written out once per grade.
                for grade in grades_per_col[ci]:
                    buf = per_grade.setdefault(grade, [])
                    buf.extend({"code": e["code"], "text": e["text"]} for e in collected)

    for grade, items in per_grade.items():
        merged: dict[str, dict] = {}
        for e in items:
            e["text"] = tidy(e["text"])
            if e["code"] in merged:
                merged[e["code"]]["text"] = tidy(merged[e["code"]]["text"] + " " + e["text"])
            else:
                merged[e["code"]] = e
        per_grade[grade] = sorted(
            merged.values(),
            key=lambda e: [int(n) for n in re.findall(r"\d+", e["code"])],
        )

    overall.sort(key=lambda o: [int(n) for n in re.findall(r"\d+", o["code"])])
    return overall, per_grade


def main(pdf_dir: str, out_dir: str) -> int:
    src, out = Path(pdf_dir), Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    total = 0

    for subject_id, cfg in SOURCES.items():
        strands = []
        for code, (name, filename) in cfg["strands"].items():
            path = src / filename
            if not path.exists():
                print(f"  !! missing {filename}, skipping strand {code}")
                continue
            overall, per_grade = parse_strand(path)
            n = sum(len(v) for v in per_grade.values())
            total += n
            grades = sorted(per_grade, key=int)
            print(f"  {subject_id} {code} {name[:38]:<38} overall={len(overall)} specific={n}")
            strands.append({
                "code": code,
                "name": name,
                "grades": grades,
                "sourceFile": filename,
                "overall": overall,
                "specific": per_grade,
            })

        payload = {
            "subject": subject_id,
            "policyYear": cfg["policyYear"],
            "source": cfg["source"],
            "transcribedFrom": sorted(s["sourceFile"] for s in strands),
            "strands": strands,
        }
        dest = out / f"{subject_id}.json"
        dest.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print(f"  -> {dest} ({dest.stat().st_size // 1024} KB)")

    print(f"\ntotal specific expectations transcribed: {total}")
    return 0


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(__doc__)
        raise SystemExit(2)
    raise SystemExit(main(sys.argv[1], sys.argv[2]))
