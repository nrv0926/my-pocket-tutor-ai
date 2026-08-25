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

Raw notes from a classroom teacher who walked the prototype. Sorted by what
they'd change, not by the order they were said. Nothing here is built yet.

### Confirms the plan we already have

Four asks land on phases already written below, which is a good signal:
full teacher units for a class or an individual, and a parent portal wired
to the teacher portal → **Phase 4**. Reading pronunciation with a mic, the
child reading aloud into it → **Phase 7**, which already scopes supervised
read-aloud. Subject linked to specific Ontario expectations → **Phase 2**.

She also said "K–6 first" unprompted, then asked for high-school science,
math and French. Those two are in tension; the first one is the one that
matches CLAUDE.md §6, and it should win until K–6 is genuinely good.

### New, and inside the five verbs

1. **"How to teach does not produce the material."** The sharpest note of
   the session. Section 4 tells you to write six vowel-team cards; it does
   not write them. The plan hands a teacher a prep list at the exact moment
   she has no prep time. Generating the artefacts the lesson calls for —
   the cards, the word lists, the sentence strips — is the single change
   that would most improve *Teach*, and it is squarely inside Phase 1's
   remit rather than a new phase.

2. **Worksheet with no diagnostic input.** Grade + subject + topic, and a
   worksheet comes out. Today the flow demands a concern to analyse, which
   is the wrong shape for a teacher who already knows what she wants and
   needs it before period three.

3. **Continuous sessions, sequenced by level.** Said twice, which usually
   means it matters. Session N+1 should start from where session N landed.
   `recentFeedbackContext()` feeds the last few results to the prompt, so
   the plumbing half-exists — the sequencing does not.

4. **Bulk generation across levels.** One topic, several difficulty levels,
   generated together, so a class of mixed readers gets one lesson and
   several worksheets. Related to Phase 4 but distinct from it: this is a
   generation feature, not an accounts feature, and it does not require
   student profiles to exist.

5. **French, and French immersion.** Ontario-specific and large. CLAUDE.md
   §6 lists Language, Reading, Writing, Math — French is not a subject yet,
   and immersion is not merely "the same worksheet in French": the phonics
   sequence itself differs. Science is likewise absent from §6.

6. **Celebrate a win.** Worth taking, but carefully. A deliberately easy
   consolidation session an adult chooses to run is inside the product. A
   streak, a badge, or anything the child logs in to collect is a permanent
   non-goal, and the distance between those two is one design decision.

### Not product

School board vendor lists are a procurement route, not a feature — but they
say something about how this gets bought, and that belongs in a go-to-market
note rather than here. Prodigy and IXL are the comparison she reached for
unprompted; both are child-facing practice engines, which is the opposite
end of the market from an adult planning tool. That the comparison came up
at all is worth understanding before positioning against it.

### Fixed

- **"Wrong time."** Real bug, now fixed. Three server components formatted
  timestamps with `toLocaleString()`, which renders in the server's zone —
  UTC on Vercel — so every session read four or five hours late in Ontario
  and an evening session appeared to happen the next morning.
  `components/LocalTime.tsx` now formats in the viewer's zone.

### Needs her, before anyone builds

Five notes are too compressed to act on: "prototype loop error" (an error
she hit, and we should reproduce it before guessing), "target group",
"contact", "object" in *grade, subject, idea, object*, and "dropdown",
written three times without saying which dropdown — most likely the
curriculum-expectation picker, but that is inference, not a requirement.

---

## Permanent non-goals

- A chatbot that replaces a teacher.
- A leaderboard, a streak war, a social feed.
- Anything that diagnoses a learning condition.
- Selling parent or child data.
