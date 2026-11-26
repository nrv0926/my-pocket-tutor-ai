# AI Pocket Tutor — product roadmap

A short, opinionated plan. Each phase ships only when the previous one is
**stable and useful** for real parents.

---

## Phase 1 — MVP web app  *(current)*

The smallest version of the product that solves the problem end-to-end for a
parent of a single K–6 child in Ontario.

**Scope**
- Parent account + child profile.
- Manual input + secure upload (with privacy warning).
- AI analysis using the fixed 9-section output.
- Worksheet generator (5–8 questions, answer key, print stylesheet).
- Progress dashboard with adaptive difficulty.
- Stripe-ready subscription placeholder (Single Child / Family up to 4).

**Done when**
- A parent can go from "I'm worried about reading" to a printed practice page
  in under 5 minutes.
- 10 parent testers report a 4/5+ on "this was clearly useful."

---

## Phase 2 — Better curriculum mapping

- Expand `data/ontario-curriculum-k6.json` into a fully indexed skill graph.
- Tag every generated worksheet question with the curriculum expectation it
  practices.
- Show the parent which expectations are mastered / in progress / new.
- Move Supabase to a Canadian region.

---

## Phase 3 — PDF worksheet export

- Server-side PDF rendering of the worksheet + answer key.
- Branded but minimal layout.
- Email-the-PDF flow for tutors / teachers.

---

## Phase 4 — Teacher accounts

- Teacher role with a small group of student profiles (parent-granted).
- Group plan view: 4–6 kids, common gaps, shared worksheet.
- Read-only "share with parent" link.

---

## Phase 5 — Multi-curriculum (Canada + USA)

- Add curricula: BC, AB, QC, plus Common Core (US).
- Profile picks the curriculum at child creation.
- Skill mapping engine generalised across curricula.

---

## Phase 6 — Native mobile app

- React Native (or Expo) wrapping the web flows.
- Camera-first upload (snap a worksheet → analyze).
- Push reminders for the 5-minute daily routine.

---

## Phase 7 — Full adaptive AI tutoring system

- A live, mid-session loop that adjusts difficulty after each question.
- Optional, supervised child-facing read-aloud + dictation (still under a
  parent account).
- Long-running learning plan that re-evaluates monthly with no parent input.

---

## Teacher feedback — 2026-08-25

Raw notes from a classroom teacher who walked the prototype, and what has
happened to each since. Sorted by what they'd change, not the order said.

### Shipped

- **"How to teach does not produce the material."** The sharpest note of the
  session, and the first thing fixed. Section 4 now carries the cards, word
  lists, sentence strips and dictation words the lesson calls for, print-ready.
- **"Create subject and link it to the Ontario curriculum, specific
  expectations per subject as a dropdown."** 1,189 expectations transcribed
  from the Ministry PDFs — Language 2023 (478), Mathematics 2020 (369), FSL
  2013 across all three programs (342) — with a strand-grouped picker on the
  new-session page. This was almost certainly the "dropdown" written three
  times in the notes.
- **French, and French immersion.** All three FSL programs, immersion
  included. The subject taxonomy was wrong before this and is now Ontario's:
  Reading and Writing are strands of Language, not subjects.
- **"Wrong time."** A real bug. Three server components formatted timestamps
  in the server's zone — UTC on Vercel — so an evening session in Ontario
  read as the next morning.
- **Grade range.** She said "K–6 first" and then asked for high school. K–8
  settles it without either: it is the whole of Ontario elementary, and the
  expectation data already covered Grades 7 and 8.

### Still open, and inside the five verbs

1. ~~**Worksheet with no diagnostic input.**~~ **Done.** Grade → topic →
   item, and a plan comes out with nothing written in the box. "object"
   meant objective. The remaining shape question is whether she also wants
   this without a saved profile at all — every session still hangs off a
   child or class row, because that is what row-level security proves
   ownership through.
2. **Continuous sessions, sequenced by level.** Said twice, which usually
   means it matters. Session N+1 should start where session N landed.
   `recentFeedbackContext()` already feeds the last few results to the
   prompt, so the plumbing half-exists; the sequencing does not. The
   Foundations Continuum now gives us a published K–4 progression to sequence
   against rather than inventing one.
3. ~~**Bulk generation across levels.**~~ **Done.** A class whose level
   spread names two or more levels gets one lesson and a worksheet per level,
   inside sections 5 and 6 rather than beside them. What is still not built
   is the same idea for a single student across several sessions — that is
   item 2, sequencing, not this.
4. **Celebrate a win.** Needs a decision before any code. An easy
   consolidation session an adult chooses to run is inside the product; a
   streak or badge a child logs in to collect is a permanent non-goal. One
   design decision separates them.
5. **Science and Technology.** A real Ontario subject, still absent. Deferred
   deliberately, not forgotten.

6. **A whole lesson plan for the class, and one for the child who is
   struggling.** Her strongest framing of the "teacher units" note, and the
   two halves have very different costs.

   The *differentiated* half is generation, not accounts, and needs no schema
   change: one lesson, with an adapted track for the student who is behind
   and an extension for those who are ahead. It fits the nine sections
   (CLAUDE.md §5) if it lives inside HOW TO TEACH IT, the way teaching
   materials already do.

   The *class* half hits a real constraint. `learning_sessions.child_id` is
   NOT NULL, and the RLS policy proves ownership by joining through the
   child row — so a plan with no child has no way to prove who owns it. A
   true class entity therefore means a migration and a new RLS policy, and
   CLAUDE.md §3 calls RLS non-negotiable, so that is deliberate work rather
   than something to slip in. The cheap alternative is to let a teacher make
   a profile that represents the group rather than a person; it needs no
   schema change, at the cost of conflating a class with a child.

   Worth noting this shares its blocker with the no-input worksheet above:
   both want a generation path that does not start from one child's profile.

### Designed, awaiting a decision — browse / class / level

Her follow-up resolved "object": it means **objective**. She wants to browse the
curriculum by grade, subject and objective and pick one, rather than typing it;
to plan for a whole class or one student; and to say which achievement level
(1-4) the student or class is working at.

**Browsing.** Ontario's own hierarchy solves the reach problem. Language Grade 3
is 4 strands -> 12 overall expectations -> 60 specifics, so a drill-down never
puts more than about a dozen things on screen, where the current picker shows a
flat list of 60. An overall expectation is what a teacher calls an objective; a
specific is what she assesses against, and she should be able to plan from
either. A text search across all 1,189 is cheaper than the browse UI and
probably what she reaches for first.

**Class or student.** `learning_sessions.child_id` is NOT NULL and the RLS
policy proves ownership by joining through the child row, so a plan with no
child cannot prove who owns it. Two ways out: a real `classes` table with a
second policy path, or a `kind` column on `children` so a class is just another
row and the policy is untouched. The second is recommended — CLAUDE.md §3 calls
RLS non-negotiable, and it buys the same feature without rewriting a working
policy. Its honest cost is a table named `children` that also holds classes.

**Achievement levels.** Ontario's 1-4 scale is on every report card, so it needs
no explaining, and it maps onto the three differentiation tracks already
shipping: Levels 1-2 are the support track, Level 3 the whole group, Level 4 the
extension. Level belongs per subject rather than per child — a student can be
Level 4 in Mathematics and Level 2 in Language — so it should be captured per
session, defaulting to the last one used.

Build order: search, then level, then the browser, then the class model. The
first two need no migration and make the third worth having.

Open: which class model; level per session or stored per student per subject;
whether `/curriculum` is public; and whether she wants R below Level 1.

### Found while building search — worth knowing

Ontario words its expectations broadly, and the vocabulary a teacher would
search for is not in them. Across all of Language: "syllable" appears 0 times,
"decoding" 0, "vowel" once. The same words are all over the Foundations
Continuum — syllable 10, phoneme 46, grapheme 33, vowel 21.

So searching expectation text alone will disappoint on exactly the terms a
teacher reaches for. The fix is to search the continuum too and map a hit back
to the expectations that section serves — the continuum already records those
(`Kindergarten: A2.3; Grade 1: B2.1`). That is a design decision rather than a
tweak, because a continuum row is not itself selectable, so it needs to resolve
to something that is. Filed rather than guessed at.

For now the empty state says so plainly instead of implying the skill is
missing from the curriculum.

### Deferred to phases already planned

Full teacher units for a class or an individual, and a parent portal wired to
the teacher portal → **Phase 4**. Reading pronunciation with a mic, the child
reading aloud into it → **Phase 7**, which already scopes supervised
read-aloud.

### Not product

School board vendor lists are a procurement route, and belong in a
go-to-market note. Prodigy and IXL are the comparison she reached for
unprompted; both are child-facing practice engines, the opposite end of the
market from an adult planning tool. That the comparison came up at all is
worth understanding before positioning against it.

### Still needs her

Four notes remain too compressed to act on:

- **"prototype loop error"** — an error she hit during the walkthrough. Worth
  reproducing rather than guessing; the redirect paths were checked and
  nothing obviously loops.
- **"object"** in *grade, subject, idea, object* — this is the spec for the
  no-input worksheet above, so it blocks that item specifically.
- **"target group"** and **"contact"** — most likely positioning and a
  contact route, but that is inference.

---

## Reading.com-style co-play lessons — 2026-09-12

Asked whether we can offer homeschool parents and parents the kind of
activity Reading.com sells. Researched rather than guessed at, because the
answer splits four ways and only two of them are ours.

Reading.com is a co-play phonics program for ages 3–8: 99 scripted lessons a
grown-up and child work through together at 15–20 minutes each, 60 decodable
books, 42 letter-sound videos. The pitch is that the script means the adult
needs no teaching training.

### What it is, in four parts

1. **The scripted sit-down lesson** — the adult is told the exact words to
   say and what the child does back.
2. **Decodable text** — a passage using only the patterns already taught, so
   the child reads rather than guesses.
3. **Letter-sound videos.**
4. **A child-facing app** — the child taps the screen, plays the games,
   collects the progress.

Parts 3 and 4 are not ours and will not become ours. A video library is a
content business, not a planning tool. A child tapping a screen is the
permanent non-goal at the top of this file and the one CLAUDE.md §1 and §8
both name — it is Phase 7 at the earliest, and then only supervised.

Parts 1 and 2 are ours, and part 1 is mostly already built.

### Part 1 is nearly shipped, and nobody noticed

Every piece of the scripted lesson already exists:

- `MaterialKind` already includes `"script"`, and `TeachingMaterials.tsx`
  already renders it as quoted lines the adult reads aloud.
- SYSTEM_PROMPT already fixes the K–3 reading lesson to the UFLI shape —
  Sound Drill → Blend Practice → Word Reading → Sentence Reading → Dictation
  — which is the shape Reading.com's lessons take.
- SYSTEM_PROMPT rule 6 already sizes every plan at 10–15 minutes. Their
  lesson is 15–20.
- "PRODUCE THE MATERIALS, DO NOT DESCRIBE THEM" already forbids handing the
  adult a prep list.

What is missing is emphasis, not capability. `howToTeachIt` is written as
instructions *about* the lesson ("model the sound, then have them blend it"),
and the script is an optional material hanging off a step. For a parent who
has never taught reading, that is the wrong way round: the words to say are
the lesson, and the instruction is the annotation. Inverting it is a prompt
change plus a renderer change. **No schema change, no migration.**

The honest cost is output length — a scripted step is three or four times
the words of an instruction — and a tone risk: a script that is too rigid
reads as condescending to a confident homeschooler, who is exactly the
reader `app/for/homeschooler/page.tsx` currently promises "you are the
teacher" to. Likely answer is that the script is ticked, not assumed, the
way extras already are.

### Part 2 is the real gap

`decodable` appears nowhere in the codebase. It is the highest-value thing
on this page and it is genuinely inside the five verbs, under Teach.

A decodable passage is the retrieval practice that makes a phonics lesson
stick: text containing only the patterns the child has already been taught,
so they decode instead of guessing from the picture. We are unusually well
placed to generate one, because the constraint it needs is already binding
on every call — the phonics progression in SYSTEM_PROMPT is strict and
sequential, and `recentFeedbackContext()` already knows what stage the child
is at.

Two ways in, and the second is cheaper:

- A new `MaterialKind` — `"decodable"` — alongside cards, word lists,
  sentences and script. Always produced for a K–3 reading session.
- A new `ExtraKind`, ticked in `MaterialsPicker`. This is the established
  path: add the kind, add its paragraph to `extrasContext()`, add the
  choice. Three small edits, all of them the same shape as work already
  shipped, and it costs output only when asked for.

Either way it lives inside HOW TO TEACH IT or PRACTICE WORKSHEET. **Nine
means nine** (CLAUDE.md §5) — this is not a tenth section.

The thing to get right is the permitted-word rule. A decodable passage that
smuggles in one untaught pattern is worse than none, because the child
stalls and the adult concludes they have regressed. So the prompt must name
the stage explicitly, and name the irregular high-frequency words allowed
alongside it, rather than trusting the model to infer both.

### The reframe worth holding on to

Reading.com is a **curriculum**: 99 fixed lessons, same order, every child.
We are a **planner**: the right lesson for this child at this spot. Copying
the 99 lessons would replace the thing that makes us different with a worse
version of a product that already exists and is well funded.

What is worth borrowing is not the sequence. It is the script — the promise
that the adult needs no training — and the decodable text.

### What actually blocks the full experience

A parent who wants "the Reading.com thing" wants a *program*: open it
tonight, be told what to do, come back tomorrow and be told the next thing.
We generate an excellent single lesson and then forget it happened.

That is already filed — **item 2, "Continuous sessions, sequenced by
level"**, said twice in the teacher notes, which usually means it matters.
Sequencing is what turns our planner into their program, and it would serve
the homeschool parent and the classroom teacher with the same work. It is
the dependency, not the script and not the decodable text.

### The age gap, stated plainly

Reading.com starts at 3. We start at Kindergarten, and Ontario publishes
expectations for Grades 1–8 (CLAUDE.md §6). A three-year-old is off the
bottom of our curriculum spine entirely — there is nothing to resolve an
expectation against. Pre-reading for 3s and 4s would mean a body of
content we do not have and have not decided we want. Not a blocker for the
work above; a reason not to promise parents of preschoolers anything yet.

### Build order

1. ~~**Decodable passage as a ticked extra.**~~ **Done.** A fourth
   `ExtraKind`, ticked in the same picker as the other three, offered for
   Language only — the phonics progression it is built against is the
   English one in `SYSTEM_PROMPT`, and maths has nothing to decode. The
   prompt binds the passage to the stage taught and the stages below it,
   caps the words that cannot be decoded yet at five, and names them in
   `trickyWords` so the adult pre-teaches them rather than discovering them
   mid-sentence. It renders as connected text, not a numbered list, inside
   PRACTICE WORKSHEET. Nine stayed nine. No migration.
2. **Script-first HOW TO TEACH IT**, ticked rather than assumed.
3. **Sequencing** (item 2) — the real unlock, and the expensive one.

Open: whether the script is ticked or always-on for K–3 reading; whether a
confident homeschooler finds a full script useful or patronising, which is a
question for a homeschool parent rather than for us. Settled: decodable text
is an extra, not a material kind — it costs output, so it is asked for.

---

## Gaps the 116 test scenarios exposed — 2026-11-26

Running the uploaded scenario workbook found no engine bugs, but it named
eleven things that do not exist. They are recorded here rather than built,
per CLAUDE.md §9: none of them is a next step the engine gets wrong, and
several are decisions rather than work.

Grouped by what they cost.

### ~~The one that is a decision~~ — decided 2026-11-26

- ~~**Science and Technology is offered with nothing behind it**~~ (SU-08).
  **Done.** Nicolas chose the one-line route: `supported: false`, and out of
  the offered `SUBJECTS` list. Its strands stay transcribed and it stays in
  the `Subject` union, so a session already saved under it still resolves.
  The test now asserts the invariant rather than the exception — nothing is
  offered without expectations behind it — so re-offering Science without
  transcribing it fails two tests. Put both lists back in the same commit
  that adds `science-technology.json`.

  The original finding, for the record:
  `data/ontario/subjects.json` marks it `supported: true`, so
  `SUPPORTED_SUBJECTS` offers it and an adult can pick it. There is no
  `science.json`. `subjectsWithExpectations()` returns Language, Mathematics
  and French — three of the four. So a Science plan has no expectation to
  resolve against, while the prompt still tells the model to work from the
  Ontario curriculum. That is precisely the shape §6 calls out: an invented
  code is worse than a missing one, because a teacher will trust it.

  Two ways out, and both are yours:
  transcribe the Science and Technology curriculum, which is the same
  careful work the other three took; or set `supported: false` until it is
  done, which is one line and is what §6's own "not yet beats pretending"
  argues for. Either is fine. Offering it with nothing behind it is not.

  A test now pins the gap in both directions
  (`tests/scenariosCoverage.test.ts`, SU-08), so neither side can move by
  accident.

### ~~Two that are small and should go first~~ — both done 2026-11-26

**Done**, in migration 0009: `capture_key` plus a `save_capture_rows()`
function that does the whole write in one transaction and is idempotent per
key. The four unsynchronised writes are one call; a resubmit writes nothing
the second time; a deliberate recapture is still attempt 2. `SECURITY
INVOKER`, so row-level security still proves ownership on every statement
inside — no second policy path.

The original entries:

- **Capture has no server-side idempotency** (C-08). The rapid double-tap is
  guarded in the browser (`disabled={saving}`), so the realistic case is
  covered. A genuine resubmit, a restored tab or a flaky connection writes
  attempt 2 instead of being ignored. The attempt-2 row is harmless to the
  decision — only attempt 1 counts — but it is a lie in the history, and the
  adult did not retry anything.
- **`saveCapture()` is not one transaction** (C-09). It issues several
  statements, so a connection dropped midway can leave some items saved and
  the session unclosed. "All rows or none" is what the scenario asks for and
  is the right behaviour for a six-tap screen the adult will walk away from.

### A standing accommodation — built 2026-11-26, two thirds wired

**Done**, in migration 0011: `children.accommodations`, set once on the
profile. `read_aloud` now defaults every item at capture to `accommodated`,
so she is not re-tapping it every week, and that is the mode that keeps a
reading difficulty from dragging maths down. `pending_review` got its
button too — "Not sure" — which is all LC-07 needed, the database and the
engine having been ready already. Whole-session exclusion is in 0010.

Two remain, both stored but not yet acted on:

- **`timed_never_counts` has nothing to act on.** Nothing marks a question
  as timed, so there is no per-item signal. The flag survives on the
  profile; wiring it needs a `timed` flag on a worksheet question.
- **`plain_literal_wording` is not passed to the prompt.** A prompt-version
  bump, per CLAUDE.md §4.

The original entry:


- **No per-child accommodation that persists** (LC-04, LC-08, LC-10). A child
  who needs every maths question read aloud needs it read aloud every week.
  Today the adult taps "Help, but not this skill" on each item, every
  session, forever — and the scenario note is right that this will not last.
  The same shape covers a child whose timed items never count and one whose
  prompts must avoid figurative wording. This is a profile field plus a
  default at capture time, and it is worth doing properly rather than three
  times.
- **No "unsure" at capture** (LC-07). The database already has
  `pending_review` and the engine already excludes it until it is confirmed,
  so this is a button and a confirm step, not a model change. An adult who
  did not quite hear the answer currently has to guess right or wrong, and a
  guess is worse evidence than an admission.
- **Exclusion is per question only** (LC-15). A session that went badly for
  reasons that have nothing to do with the skill needs one action, not six.

### Three that need a decision before any code

- **Open written responses before Phase 4** (SU-06). Right-or-wrong carries a
  three-sentence answer badly. The rubric work in 0008 is the real answer;
  until it is wired to the capture screen, Phase 1 needs one consistent
  behaviour, and "whatever the adult taps" is not it. Candidate: such an item
  defaults to `pending_review` and never scores itself.
- **One `planGrade` per child, not per subject** (LC-13). A Grade 2 child can
  be ready for Grade 3 maths and need Grade 1 writing. Today the picker
  reaches down for the whole child. This is the twice-exceptional case and
  the scenario is right that it is important to know; it is also a schema
  change, so it is a decision first.
- **No way for the adult to overrule the suggestion** (LC-20). She knows
  things the evidence does not. An override has to be recorded and then
  stop mattering — the next suggestion still comes from the evidence, or the
  card becomes a sticky note.

### Two about generated items

- **No per-grade scope check on generated numbers** (GR-02, GR-03). Ontario
  2020 maths puts Grade 1 at 50, Grade 2 at 200, Grade 3 at 1,000 — the
  wording is in `data/ontario/mathematics.json` and the numbers are
  transcribed, so the ranges can be derived rather than typed. An item
  outside the range should be dropped before it is printed. `lib/answerCheck.ts`
  now gives the arithmetic half of this; the range half is not built.
- **Large print** (LC-09). The print stylesheet is the MVP's only export
  (CLAUDE.md §8). A low-vision learner needs it to scale, diagrams included,
  without anything cut off.

Not on this list, because it is already answered: the scenarios' worry that
maths would be stepped down because of reading, or one sibling's result move
another's plan. Skills are grouped separately and `recommendAll()` reports
them separately; LC-01, SU-10 and MC-02 are tests, and they pass.

---

## Permanent non-goals

- A chatbot that replaces a teacher.
- A leaderboard, a streak war, a social feed.
- Anything that diagnoses a learning condition.
- Selling parent or child data.
