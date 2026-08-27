#!/usr/bin/env python3
"""
Transcribe the Ontario French as a Second Language curriculum (2013).

Unlike Language and Mathematics, FSL is not published as a continuum table.
It is running prose, one expectation per block:

    A2.1 Utilisation de strategies : <expectation> (p. ex., <examples>).
    Questions incitatives de l'enseignant : ...
    Conseils pedagogiques : ...

Only the first part is the expectation. Teacher prompts and instructional
tips are support material and are dropped, or every entry would be three
times its real length.

FSL also carries a dimension the other subjects do not: three programs
(Core, Extended, Immersion) each publish their own expectations for the same
strand and grade. They are segmented by where the grade sequence restarts,
which is more reliable than the section headings.

Usage:
    .venv/bin/python scripts/extract_ontario_fsl.py <book.pdf> <out.json>
"""
import json
import re
import sys
from pathlib import Path

import pdfplumber

FOOT = re.compile(r"Domaine ([A-D])\s*\|\s*([^|]+?)\s*\|\s*(\d+)(?:re|e|ère) ANN[ÉE]E", re.I)
SPECIFIC = re.compile(r"^([A-D]\d+\.\d+)\s+(.*)$")
OVERALL = re.compile(r"^([A-D]\d+)\.\s+(.+)$")
# Everything from here on is support material, not the expectation.
STOP = re.compile(r"^(Questions incitatives|Conseils p[ée]dagogiques|Pistes de r[ée]flexion)", re.I)
# The same markers can begin mid-line when the paragraph above wraps, so the
# assembled text is also cut on the phrase itself.
STOP_ANYWHERE = re.compile(r"(Questions incitatives de l|Conseils p[ée]dagogiques|Pistes de r[ée]flexion)", re.I)
# Words broken across a line end: "inter-\nactions".
DEHYPHEN = re.compile(r"(\w)[-\u00ad\u2010]\s+(\w)")
SOFT = dict.fromkeys(map(ord, "\u00ad\u200b"), None)

PROGRAMS = [
    ("core", "Français de base", "Core French"),
    ("extended", "Français intensif", "Extended French"),
    ("immersion", "Immersion française", "French Immersion"),
]

STRAND_NAMES = {
    "A": ("Écoute", "Listening"),
    "B": ("Expression orale", "Speaking"),
    "C": ("Lecture", "Reading"),
    "D": ("Écriture", "Writing"),
}


def tidy(text: str) -> str:
    # Order matters. Rejoin words split across a line end first, then treat any
    # soft hyphen still standing between two letters as the real hyphen it is
    # being used for — "ceux­ci" is "ceux-ci", not "ceuxci".
    cut = STOP_ANYWHERE.search(text)
    if cut:
        text = text[: cut.start()]
    text = DEHYPHEN.sub(r"\1\2", text)
    text = re.sub(r"(\w)[\u00ad\u2010\u2011](\w)", r"\1-\2", text)
    text = text.translate(SOFT)
    text = " ".join(text.split())
    return text.strip(" .;")


FOOTER_MARGIN = 58
HEADER_MARGIN = 40


def body_lines(page, tol=3.0):
    """Lines of the page with running header and footer excluded."""
    words = [
        w
        for w in page.extract_words()
        if HEADER_MARGIN <= w["top"] <= page.height - FOOTER_MARGIN
    ]
    words.sort(key=lambda w: (round(w["top"] / tol), w["x0"]))
    out, cur, cur_top = [], [], None
    for w in words:
        if cur_top is None or abs(w["top"] - cur_top) <= tol:
            cur.append(w)
            cur_top = w["top"] if cur_top is None else cur_top
        else:
            out.append(" ".join(x["text"] for x in cur))
            cur, cur_top = [w], w["top"]
    if cur:
        out.append(" ".join(x["text"] for x in cur))
    return out


def page_context(page):
    """(strand, grade) from the running footer, which carries both."""
    words = page.extract_words()
    foot = " ".join(w["text"] for w in words if w["top"] > page.height - 55)
    m = FOOT.search(foot)
    return (m.group(1).upper(), m.group(3)) if m else (None, None)


def find_program_bounds(pages_meta):
    """Split the book where the grade sequence restarts."""
    bounds, prev = [], None
    for pageno, _strand, grade in pages_meta:
        g = int(grade)
        if prev is not None and g < prev:
            bounds.append(pageno)
        prev = g
    return bounds


def program_of(pageno, bounds):
    idx = sum(1 for b in bounds if pageno >= b)
    return PROGRAMS[min(idx, len(PROGRAMS) - 1)][0]


def parse(pdf_path: Path):
    out: dict = {p[0]: {} for p in PROGRAMS}
    overalls: dict = {p[0]: {} for p in PROGRAMS}

    with pdfplumber.open(pdf_path) as pdf:
        meta = []
        for i, page in enumerate(pdf.pages):
            strand, grade = page_context(page)
            if strand:
                meta.append((i + 1, strand, grade))
        bounds = find_program_bounds(meta)
        by_page = {m[0]: (m[1], m[2]) for m in meta}

        for i, page in enumerate(pdf.pages):
            pageno = i + 1
            if pageno not in by_page:
                continue
            strand, grade = by_page[pageno]
            program = program_of(pageno, bounds)
            current = None
            for raw in body_lines(page):
                line = raw.strip()
                if not line:
                    continue
                if STOP.match(line):
                    current = None
                    continue

                m = SPECIFIC.match(line)
                if m and m.group(1)[0] == strand:
                    code, rest = m.group(1), m.group(2)
                    bucket = out[program].setdefault(grade, {})
                    current = {"code": code, "text": rest}
                    bucket[code] = current
                    continue

                mo = OVERALL.match(line)
                if mo and mo.group(1)[0] == strand and not SPECIFIC.match(line):
                    overalls[program].setdefault(strand, {})[mo.group(1)] = tidy(mo.group(2))
                    current = None
                    continue

                if current is not None:
                    current["text"] += " " + line

    for program in out:
        for grade, codes in out[program].items():
            for e in codes.values():
                # The title sits before the first colon; keep it, it is part
                # of how Ontario names the expectation.
                e["text"] = tidy(e["text"])
    return out, overalls


def main(pdf_path: str, out_path: str) -> int:
    data, overalls = parse(Path(pdf_path))

    programs = []
    total = 0
    for pid, fr_name, en_name in PROGRAMS:
        by_grade = data[pid]
        strands = {}
        for grade, codes in sorted(by_grade.items(), key=lambda kv: int(kv[0])):
            for code, e in codes.items():
                s = code[0]
                strands.setdefault(s, {"code": s, "specific": {}})
                strands[s]["specific"].setdefault(grade, []).append(e)
                total += 1
        strand_list = []
        for s in sorted(strands):
            fr, en = STRAND_NAMES.get(s, (s, s))
            spec = {
                g: sorted(v, key=lambda e: [int(n) for n in re.findall(r"\d+", e["code"])])
                for g, v in sorted(strands[s]["specific"].items(), key=lambda kv: int(kv[0]))
            }
            strand_list.append({
                "code": s,
                "name": fr,
                "nameEn": en,
                "grades": sorted(spec, key=int),
                "overall": [
                    {"code": c, "text": t}
                    for c, t in sorted(overalls[pid].get(s, {}).items())
                ],
                "specific": spec,
            })
        n = sum(len(v) for st in strand_list for v in st["specific"].values())
        print(f"  {pid:<10} {en_name:<18} strands={len(strand_list)} specific={n}")
        programs.append({
            "id": pid,
            "name": fr_name,
            "nameEn": en_name,
            "strands": strand_list,
        })

    payload = {
        "subject": "french",
        "policyYear": 2013,
        "language": "fr",
        "note": (
            "Transcribed from the FRENCH edition (Traduction de French as a "
            "Second Language). The English edition publishes the same codes "
            "with English wording; drop it in and re-run to get that instead."
        ),
        "source": "https://www.dcp.edu.gov.on.ca/en/curriculum/elementary-french-as-a-second-language",
        "transcribedFrom": [Path(pdf_path).name],
        "programs": programs,
    }
    dest = Path(out_path)
    dest.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"  -> {dest} ({dest.stat().st_size // 1024} KB)")
    print(f"\ntotal specific expectations transcribed: {total}")
    return 0


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(__doc__)
        raise SystemExit(2)
    raise SystemExit(main(sys.argv[1], sys.argv[2]))
