#!/usr/bin/env python3
"""
Transcribe the Ontario Language Foundations Continuum for Reading and Writing
(Kindergarten - Grade 4).

This is the science-of-reading spine CLAUDE.md §4 requires the plans to
follow: Phonemic Awareness, Phonics, Word-Level Reading and Spelling,
Vocabulary, Reading Fluency - each shown as a progression across
Kindergarten to Grade 4, and each mapped to the expectation codes it serves
in both the Kindergarten curriculum and Language, Grades 1-8.

Layout notes, all of which produced garbage before they were handled:

- The page is landscape with five grade columns and a sixth, narrower column
  of row labels to their left. Words are bucketed by x-position.
- Above the table sits a full-width intro paragraph. Bucketing it by column
  slices one sentence into five, so everything above the bold grade-header
  row is dropped.
- Sections run over several pages. Continuation pages repeat the grade
  header with no title, so the current section carries forward.

Usage:
    .venv/bin/python scripts/extract_ontario_continuum.py <pdf> <out.json>
"""
import json
import re
import sys
from pathlib import Path

import pdfplumber

GRADES = ["K", "1", "2", "3", "4"]
# Five grade columns; row labels live in the wide left margin beside them.
GRADE_COLS = [175, 382, 588, 794, 1000]
LABEL_MAX_X = 170
GRADE_HEADER = re.compile(r"^(Kindergarten|Grade\s+[1-4])$")
CODE_LINE = re.compile(r"^Kindergarten:\s*(.+)$")
BOLD = re.compile(r"bold|black|heavy", re.I)
FOOTER = re.compile(r"^\d+\s*\|")
TITLE_SIZE = 18       # section titles are set much larger than anything else
CODE_SIZE = (13, 17)  # the code line sits between title and body


def tidy(text: str) -> str:
    text = re.sub(r"(\w)-\s+(\w)", r"\1\2", text)
    text = " ".join(text.split())
    return text.strip(" .;")


def column_of(x: float) -> int | None:
    """Index into GRADE_COLS, or -1 for the row-label margin, or None."""
    if x < LABEL_MAX_X:
        return -1
    best, idx = None, None
    for i, s in enumerate(GRADE_COLS):
        d = x - s
        if d >= -8 and (best is None or d < best):
            best, idx = d, i
    return idx


def page_lines(page, tol=3.0):
    """[(top, column, text, is_bold)] for the whole page."""
    words = [
        w
        for w in page.extract_words(extra_attrs=["fontname", "size"])
        if 15 <= w["top"] <= page.height - 45
    ]
    rows: dict = {}
    for w in words:
        c = column_of(w["x0"])
        if c is None:
            continue
        rows.setdefault((round(w["top"] / tol), c), []).append(w)
    out = []
    for (tkey, c), ws in rows.items():
        ws.sort(key=lambda w: w["x0"])
        bold = sum(1 for w in ws if BOLD.search(w.get("fontname", ""))) > len(ws) / 2
        size = max(w.get("size", 0) for w in ws)
        out.append((tkey * tol, c, " ".join(w["text"] for w in ws), bold, size))
    out.sort(key=lambda r: (r[0], r[1]))
    return out


def header_lines(page, limit, tol=3.0):
    """
    Full-width lines above the table.

    The section title and the code line run the width of the page, so
    bucketing them by column chops each into five fragments. Above the table
    they are joined by row only.
    """
    rows: dict = {}
    for w in page.extract_words(extra_attrs=["fontname", "size"]):
        if w["top"] >= limit or w["top"] < 15:
            continue
        rows.setdefault(round(w["top"] / tol), []).append(w)
    out = []
    for tkey, ws in sorted(rows.items()):
        ws.sort(key=lambda w: w["x0"])
        out.append((tkey * tol, " ".join(w["text"] for w in ws),
                    max(w.get("size", 0) for w in ws)))
    return out


def table_top(lines) -> float | None:
    """Top of the bold grade-header row; the table starts under it."""
    for top, c, text, bold, _size in lines:
        if bold and c is not None and c >= 0 and GRADE_HEADER.match(text.strip()):
            return top
    return None


def parse(pdf_path: Path):
    sections: list = []
    current = None
    COVER = ("Language Foundations", "Kindergarten\u2013Grade")

    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            body_all = page_lines(page)
            head_all = header_lines(page, page.height)

            # A page can hold the tail of one section and the head of the
            # next, so titles segment the page rather than describing it.
            titles = []
            for top, text, size in head_all:
                if size < TITLE_SIZE or text.strip().startswith(COVER):
                    continue
                if titles and top - titles[-1][0] < 20:
                    titles[-1] = (titles[-1][0], titles[-1][1] + " " + text)
                else:
                    titles.append((top, text))

            segments = []
            if not titles:
                segments.append((0.0, float("inf"), None))
            else:
                if titles[0][0] > 20:
                    segments.append((0.0, titles[0][0], None))
                for i, (top, text) in enumerate(titles):
                    nxt = titles[i + 1][0] if i + 1 < len(titles) else float("inf")
                    segments.append((top, nxt, tidy(text)))

            for seg_start, seg_end, title in segments:
                if title:
                    current = {"name": title, "codes": "", "rows": []}
                    sections.append(current)
                if current is None:
                    continue

                if not current["codes"]:
                    for top, text, size in head_all:
                        if not (seg_start <= top < seg_end):
                            continue
                        if CODE_SIZE[0] <= size <= CODE_SIZE[1] and CODE_LINE.match(text.strip()):
                            current["codes"] = tidy(text)
                            break

                seg_lines = [r for r in body_all if seg_start <= r[0] < seg_end]
                start_top = table_top(seg_lines)
                if start_top is None:
                    continue
                body = [r for r in seg_lines if r[0] > start_top + 6]

                labels = []
                for top, c, text, _b, _s in body:
                    if c == -1 and text.strip() and not FOOTER.match(text.strip()):
                        if labels and top - labels[-1][0] < 14:
                            labels[-1] = (labels[-1][0], labels[-1][1] + " " + text)
                        else:
                            labels.append((top, text))
                prev_label = current["rows"][-1]["label"] if current["rows"] else "continued"
                if not labels:
                    labels = [(start_top, prev_label)]
                elif labels[0][0] > start_top + 20:
                    # A row can run over a page break. Whatever sits between
                    # the grade header and the first label on this page is the
                    # tail of the previous row, not a new one.
                    labels.insert(0, (start_top, prev_label))

                for i, (top, label) in enumerate(labels):
                    stop = labels[i + 1][0] if i + 1 < len(labels) else seg_end
                    cells: dict = {}
                    for rtop, c, text, _b, _sz in body:
                        if c is None or c < 0 or GRADE_HEADER.match(text.strip()):
                            continue
                        if not (top - 8 <= rtop < stop - 8):
                            continue
                        cells.setdefault(GRADES[c], []).append(text)
                    cells = {g: tidy(" ".join(v)) for g, v in cells.items()}
                    cells = {g: v for g, v in cells.items() if len(v) > 3}
                    if not cells:
                        continue
                    label = tidy(re.sub(r"^Knowledge and skills:\s*", "", label))
                    if not label:
                        # A row whose label sat on an earlier page. Fold it
                        # into the row it continues rather than leaving an
                        # anonymous block nothing can be looked up by.
                        label = current["rows"][-1]["label"] if current["rows"] else "continued"
                    same = next((r for r in current["rows"] if r["label"] == label), None)
                    if same:
                        for g, v in cells.items():
                            same["byGrade"][g] = tidy(same["byGrade"].get(g, "") + " " + v)
                    else:
                        current["rows"].append({"label": label, "byGrade": cells})
    return sections


def main(pdf_path: str, out_path: str) -> int:
    sections = parse(Path(pdf_path))
    total = 0
    for s in sections:
        n = sum(len(r["byGrade"]) for r in s["rows"])
        total += n
        print(f"  {s['name'][:52]:<52} rows={len(s['rows']):<3} cells={n}")
        if s["codes"]:
            print(f"      codes: {s['codes'][:88]}")

    payload = {
        "title": "Language Foundations Continuum for Reading and Writing",
        "region": "ON-CA",
        "grades": GRADES,
        "policyYear": 2026,
        "source": "https://www.dcp.edu.gov.on.ca/en/curriculum/elementary-language",
        "transcribedFrom": [Path(pdf_path).name],
        "note": (
            "Kindergarten to Grade 4 progression of the foundational reading "
            "and writing skills, in the science-of-reading order. Each section "
            "records the expectation codes it serves in the Kindergarten "
            "curriculum and in Language, Grades 1-8."
        ),
        "sections": sections,
    }
    dest = Path(out_path)
    dest.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"  -> {dest} ({dest.stat().st_size // 1024} KB)")
    print(f"\ntotal grade cells transcribed: {total}")
    return 0


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(__doc__)
        raise SystemExit(2)
    raise SystemExit(main(sys.argv[1], sys.argv[2]))
