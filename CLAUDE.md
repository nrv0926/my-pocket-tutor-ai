# CLAUDE.md — house rules for AI Pocket Tutor

This file is read by Claude Code (and any other AI contributor) before
suggesting changes to this repository. **Treat it as binding.**

---

## 1. Project purpose

AI Pocket Tutor is a quiet co-pilot for **parents and teachers** of K–8
children. It analyzes a child's learning data and returns a clear, kind plan
of what to teach next.

It is **not**:
- A chatbot for children to use directly.
- A diagnostic tool. We never name conditions.
- A general-purpose AI app.

If a proposed feature drifts from "help an adult know what to teach next,"
push back before building it.

## 2. Coding standards

- **Next.js App Router** + **TypeScript strict** + **Tailwind**.
- Server actions / API routes for any DB or AI calls. No secrets in client code.
- Reusable components live in `/components`. Pages live in `/app`.
- Prefer **small, named** components over large `page.tsx` files.
- No inline `any`. If you truly need it, comment why.
- Keep files under ~250 lines where reasonable. Split when they grow.
- Components are **mobile-first**. Test layouts at 360px before 1280px.
- Plain English in UI. No edu-jargon. A tired parent at 9pm is the reader.
- Default to **no comments**. Add one only when the *why* is non-obvious.

## 3. Security rules (non-negotiable)

- All user data tables have **Row-Level Security** enforced by `auth.uid()`.
- Never read or write children/uploads tables with the service role key from a
  request handler that runs on behalf of a logged-in user. Use the user-scoped
  Supabase client.
- Uploaded files go to a **private** bucket, accessed only through short-lived
  signed URLs.
- The "remove personal info" privacy warning **must** appear before every
  upload — do not hide it behind a setting.
- Never log file contents, full names, or any PII. Log IDs and counts.
- Do not add 3rd-party trackers, analytics, or ad SDKs without explicit sign-off.

## 4. AI prompt rules

- All prompts live in `/prompts`. Do not inline prompts in pages or services.
- Every prompt is a versioned, exported constant — **change the version string
  when you change the prompt**.
- Prompts must instruct the model:
  - Do **not** use uploaded documents for training or memory.
  - Ignore and never echo personal identifiers (names, school names, student
    numbers, addresses).
  - Default to Ontario curriculum unless the profile says otherwise.
  - Step **down** one grade level if the child is behind. Never up.
  - For reading: follow the science-of-reading order
    (Phonemic Awareness → Phonics → Fluency → Vocabulary → Comprehension).
  - For K–3 reading: use UFLI-style structure
    (Sound Drill → Blend Practice → Word Reading → Sentence Reading → Dictation).
  - Phonics progression is sequential:
    CVC → digraphs → blends → silent e → vowel teams → r-controlled vowels
    → multisyllabic. **Do not skip steps.**

## 5. Output format rules

Every analysis response must use **exactly** these nine sections, in this
order, with these headings:

1. WHAT I NOTICE
2. KEY SKILL GAPS
3. WHAT TO TEACH NEXT *(top 3 priorities only)*
4. HOW TO TEACH IT
5. PRACTICE WORKSHEET *(5–8 questions, labelled Easy/Medium/Hard)*
6. ANSWER KEY
7. PARENT / TEACHER TIPS *(2–3 only)*
8. NEXT STEP PLAN
9. FEEDBACK QUESTION *(always: "Was this too easy, just right, or too hard?")*

The renderer in `components/AnalysisResultCard.tsx` depends on this shape.
If you change the structure, change both — and bump the prompt version.

**Nine means nine.** Anything new goes *inside* an existing section, never
beside them. Three things already do.

Inside HOW TO TEACH IT:

- `teachingMaterials` — the cards, word lists and sentence strips the lesson
  calls for. Produce them; never tell an adult to go and make something.
- `differentiation` — one lesson, three tracks (whole group, needs support,
  ready for more). The support track is a **smaller step of the same skill**,
  never a different lesson and never busywork. Omit the field for a parent
  teaching one child: there is nobody to differentiate between.

Inside PRACTICE WORKSHEET and ANSWER KEY:

- `worksheetVariants` — one lesson, a worksheet per achievement level in the
  room. Each variant carries its own key, so the two sections cannot drift
  apart. Same skill and same shape as the whole-group worksheet every time.
  Only for levels the room actually contains, and only when a class spread
  names two or more; one learner at one level needs one worksheet.

Render these **stacked, not tabbed**. She prints the plan and walks to class,
and a tab strip prints whichever tab happened to be open.

## 6. Curriculum alignment

- **Default location**: Ontario, Canada.
- **Grades**: K through 8 — the full Ontario elementary range. The
  curriculum documents are published for Grades 1-8, and elementary schools
  run to Grade 8.
- **Subjects**, named as Ontario names them: **Language**, **Mathematics**,
  **Science and Technology**, **French as a Second Language**.
  - Reading and Writing are **not** subjects — both are strands inside
    Language (C: Comprehension, D: Composition). A teacher notices the
    difference immediately. Sessions saved under the old names still resolve
    via `LEGACY_SUBJECTS` in `lib/curriculum.ts`.
  - The other four Ontario subjects (Social Studies, Health and Physical
    Education, The Arts, Native Languages) are listed in
    `data/ontario/subjects.json` with `supported: false`. Don't generate
    plans for them yet, and don't delete them — "not yet" beats pretending
    they don't exist.
- **Curriculum expectations are transcribed, never generated.** Never write an
  expectation code or its text from memory. An invented `B1.3` is worse than
  a missing one, because a teacher will trust it. See
  `data/ontario/README.md`.
- **Achievement levels are Ontario's 1–4 chart**, the scale on every report
  card. **Level 3 IS the provincial standard**, not a middling result — never
  write copy or a prompt that treats 4 as the goal and 3 as a shortfall.
  Level is per subject, not per child: a student can be Level 4 in Mathematics
  and Level 2 in Language. Captured per session; optional; never shown to
  parents. **The scale is 1–4 and nothing else** — no R, no half levels, no
  "3+". Asked and settled. A class gives a spread of counts instead, which sizes the three
  differentiation tracks to the room.
- **A profile is a student or a class** (`children.kind`). Both live in the
  same table so row-level security keeps proving ownership through `user_id` —
  do not add a second policy path. The table name is knowingly a little wrong;
  rename it when there is another reason to touch the schema.
- **A plan can target a grade other than the profile's.** The reading group
  that is two years behind is the whole reason a teacher reaches down, so the
  picker lets her, and the plan says which grade it is pitched at. Resolve
  the expectation against the **grade being planned**, never the profile's:
  B1.1 at Grade 1 is a different expectation from B1.1 at Grade 3, so the
  wrong lookup silently hands the model the wrong wording.
- **Topic names are transcribed too.** Ontario labels each Language overall
  expectation with a short name before a colon; Mathematics has none, so the
  published wording stands. Never write a topic name — an invented label is
  the same sin as an invented code, just quieter. Watch for grade bands:
  Financial Literacy really is written "Grades 1 and 2: …", and that is not
  a topic.
- **Search the continuum, not just the expectations.** Ontario words its
  expectations broadly: "syllable" appears nowhere in the Language curriculum
  and neither does "decoding". Both are in
  `data/ontario/language-foundations-continuum.json`, which records which
  expectations each foundational skill sits behind. Any search a teacher
  touches must span both, or her own vocabulary returns nothing.
- **Never import `lib/curriculum.ts` from a `"use client"` file.** It pulls
  ~250 KB of transcribed JSON in at module scope; one three-line helper once
  took first load from 99 KB to 175 KB. Reach it through a server action.
  `tests/clientBundle.test.ts` fails the build if you forget.
- Skill maps live in `/data`. Look there before inventing a skill name.
- If the curriculum data does not cover a skill yet, add it to the JSON file
  rather than hard-coding it in a prompt.

## 7. Adaptation rules

- ADHD mentioned → shorter tasks, chunked steps, movement breaks, simple
  instructions.
- Dyslexia mentioned → smaller word sets, more repetition, decoding focus,
  no comprehension-heavy work until decoding improves.
- Anxiety mentioned → start easier, build confidence, avoid overwhelming
  language, use quick wins.
- **Never diagnose.** We acknowledge what the parent shared and adapt the
  plan; we don't label the child.

## 8. What NOT to build yet

- No social features, leaderboards, or sharing.
- No child-facing chat or child login.
- No teacher dashboards (Phase 4).
- No PDF export (Phase 3) — print stylesheet only at MVP.
- No multi-curriculum switcher (Phase 5).
- No native mobile app (Phase 6).
- No live adaptive tutoring loop (Phase 7).

## 9. MVP-only focus

Five verbs: **Input → Analyze → Teach → Worksheet → Track**.

If a change doesn't make one of those five better, defer it. Add a note to
`PRODUCT_ROADMAP.md` instead of building it now.
