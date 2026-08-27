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

1. **Worksheet with no diagnostic input.** Grade + subject + topic, and a
   worksheet comes out. The flow still demands a concern to analyse, which is
   the wrong shape for a teacher who knows what she wants and needs it before
   period three. Blocked on what "object" meant in *grade, subject, idea,
   object*.
2. **Continuous sessions, sequenced by level.** Said twice, which usually
   means it matters. Session N+1 should start where session N landed.
   `recentFeedbackContext()` already feeds the last few results to the
   prompt, so the plumbing half-exists; the sequencing does not. The
   Foundations Continuum now gives us a published K–4 progression to sequence
   against rather than inventing one.
3. **Bulk generation across levels.** One topic, several difficulty levels at
   once, so a class of mixed readers gets one lesson and several worksheets.
   Related to Phase 4 but not gated on it: this is generation, not accounts.
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

## Permanent non-goals

- A chatbot that replaces a teacher.
- A leaderboard, a streak war, a social feed.
- Anything that diagnoses a learning condition.
- Selling parent or child data.
