# Ontario curriculum data

`subjects.json` is the taxonomy index: the eight elementary subjects, their
policy years, and the strands inside each supported subject.

The expectations themselves live beside it, one file per subject:

| File | Strands | Specific expectations | Source |
| --- | --- | --- | --- |
| `language.json` | A, B, C, D | 478 | Ontario Language, 2023 |
| `mathematics.json` | A, B, C, D, E, F | 369 | Ontario Mathematics, 2020 |
| `french.json` | A, B, C, D × 3 programs | 342 | Ontario FSL, 2013 |

1,189 in total, covering Grades 1-8 as published; the loader narrows to K-6.
Science and Technology and the four unsupported subjects have structure but
no expectations yet.

### The Language Foundations Continuum

`language-foundations-continuum.json` is a different kind of document: not
expectations, but the K-4 progression of the foundational reading and
writing skills, in the science-of-reading order CLAUDE.md §4 already
requires — Phonemic Awareness, Alphabetic Knowledge, Phonics, Word-Level
Reading and Spelling, Vocabulary, Reading Fluency. Each section records the
expectation codes it serves in both curricula.

It is also the only place Kindergarten codes appear in our data. The full
Kindergarten curriculum is a separate document we do not have; this covers
its literacy foundations, which is the part this product is about.

`scripts/extract_ontario_continuum.py` reads it. The layout is a landscape
table with five grade columns plus a label margin, and three traps that all
produced wrong data before they were handled: a full-width intro paragraph
above the table (bucketing it by column slices one sentence into five), a
running footer that reads as a row label, and pages that hold the tail of
one section and the head of the next. Roughly 96% of the words inside the
grade columns are captured; the rest is the cover text, the intro prose and
the code lines, which are kept as section metadata rather than as cells.

### FSL is shaped differently, twice over

**Three programs.** Core, Extended and Immersion each publish their own
expectations for the same strand and grade, so `french.json` nests strands
under `programs` and `subjects.json` leaves its `strands` empty. Core and
Extended begin at Grade 4; only Immersion runs from Grade 1, which is why
the picker defaults to Immersion — it is the one program covering the whole
K-6 range.

**It is the French edition.** Both FSL PDFs supplied were
`Traduction de French as a Second Language` — the same French translation,
despite one being named `FSL_...`. The English edition publishes the same
codes with English wording. Drop it in, point `SOURCES` at it, and re-run;
the `language` field on the file is what the UI reads to know which it has.

## The rule

**Expectations are transcribed, never generated.**

An invented expectation is worse than a missing one. A teacher reads
`B1.3` and trusts it — if the code is wrong, or the wording is a plausible
paraphrase rather than the published text, we have handed her something
confidently false and she will find out in front of her class. An empty
strand is honest; a hallucinated one is not.

So: no expectation goes into this file unless it was copied from the
`source` URL recorded on its subject.

## Adding a subject

`scripts/extract_ontario.py` does the transcription. Point it at a directory
of the Ministry's own PDFs:

```bash
python3 -m venv .venv && .venv/bin/pip install pdfplumber
.venv/bin/python scripts/extract_ontario.py ./ministry-pdfs data/ontario
```

Register the subject and its strand PDFs in that script's `SOURCES` table
first. FSL uses a second script, `scripts/extract_ontario_fsl.py`, because
it is running prose rather than a continuum table — each expectation is
followed by teacher prompts and instructional tips that are support
material, not the expectation, and are dropped. Two layouts exist and both are handled: per-grade tables with eight
columns (`Grade 1` … `Grade 8`) and banded tables with three
(`Grades 1-3`, `Grades 4-6`, `Grades 7-8`), which are expanded to individual
grades.

Three things the parser has to get right, and which the tests check:

- **Columns.** The PDFs put eight grades side by side on one landscape page,
  so flat text extraction interleaves them into nonsense. Words are assigned
  to a column by x-position.
- **Sub-headings.** "Effective Listening Skills" is navigation, not an
  expectation. They are set in a bold cut of the body face and end the entry
  above them.
- **Page furniture.** The running footer would otherwise be swallowed by the
  last expectation on each page.

Adding one by hand is fine too — same shape, same rule about wording.

```jsonc
{
  "code": "B",
  "name": "Foundations of Language",
  "grades": ["1", "2", "3", "4", "5", "6", "7", "8"],
  "overall": [{ "code": "B1", "text": "<verbatim>" }],
  // Specific expectations are keyed by grade: B1.1 in Grade 2 is a
  // different expectation from B1.1 in Grade 5.
  "specific": {
    "1": [{ "code": "B1.1", "text": "<verbatim>" }]
  }
}
```

`tests/curriculum.test.ts` enforces the shape: an overall expectation must
match `^[A-Z]\d+$`, a specific one `^[A-Z]\d+\.\d+$`, and text cannot be
blank. It cannot tell whether the wording is real — that part is on the
person pasting it.

## Source PDFs are not in the repo

They are ~28 MB of government publications, freely available from each
subject's `source` URL. `transcribedFrom` in each file records exactly which
filenames a transcription came from, so a re-run is reproducible without
carrying the binaries in git.

## Subjects we do not generate plans for

Four subjects are listed with `supported: false` — Social Studies, Health and
Physical Education, The Arts, and Native Languages. They are in the file so a
teacher asking "where's Music?" gets an honest "not yet" instead of a
taxonomy that pretends the subject does not exist. Do not add strands to them
until the product actually covers them.

## Kindergarten

Ontario publishes Kindergarten as its own program document rather than as a
grade inside each subject. `GradeId` includes `"K"`, but no strand currently
claims it. Handle it explicitly when it is added — do not fold it into
Grade 1.
