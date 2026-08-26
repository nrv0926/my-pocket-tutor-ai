# Ontario curriculum data

`subjects.json` holds the **structure** of the Ontario elementary curriculum:
the eight subjects, their policy years, and the strands inside each supported
subject. Every `overall` array is empty on purpose.

## The rule

**Expectations are transcribed, never generated.**

An invented expectation is worse than a missing one. A teacher reads
`B1.3` and trusts it — if the code is wrong, or the wording is a plausible
paraphrase rather than the published text, we have handed her something
confidently false and she will find out in front of her class. An empty
strand is honest; a hallucinated one is not.

So: no expectation goes into this file unless it was copied from the
`source` URL recorded on its subject.

## Filling one in

1. Open the subject's `source` URL and find the grade and strand.
2. Add the overall expectation with Ontario's own code (`B1`) and text.
3. Add each specific expectation beneath it (`B1.1`, `B1.2`, …).
4. Leave `expectationsVerified` false until a subject is complete and
   someone has checked it against the source a second time.

```jsonc
{
  "code": "B1",
  "text": "<overall expectation, verbatim>",
  "specific": [
    { "code": "B1.1", "text": "<specific expectation, verbatim>" }
  ]
}
```

`tests/curriculum.test.ts` enforces the shape: an overall expectation must
match `^[A-Z]\d+$`, a specific one `^[A-Z]\d+\.\d+$`, and text cannot be
blank. It cannot tell whether the wording is real — that part is on the
person pasting it.

## Why the structure is here without the data

The app is built against the real taxonomy so that loading the expectations
later is data entry rather than a refactor. `lib/curriculum.ts` already
resolves subjects, filters strands by grade, and flattens expectations for a
picker; all of it returns empty today and starts working the moment this file
is populated.

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
