# Pocket Tutor — product roadmap

A short, opinionated plan. Each phase ships only when the previous one is
**stable and useful** for real users.

---

## Phase 1 — MVP web app  *(current)*

The smallest version of the product that solves the problem end-to-end for a
K–3 child in Ontario, in any of the three modes.

**Scope**
- Account + child profile.
- Mode selection (Parent / Homeschool / Teacher) at session start.
- Manual input + secure upload (with privacy warning).
- AI analysis with the mode-specific output shape (see CLAUDE.md §7).
- Printable worksheet generator with answer key (all tiers).
- Pricing: Free (1 analysis/mo), Premium ($17.99/mo), Family ($29.99/mo).

**Done when**
- An adult can go from "I'm worried about reading" to a printed practice page
  in under 5 minutes.
- 10 testers (parents, homeschoolers, teachers) report a 4/5+ on
  "this was clearly useful."

---

## Phase 2 — Interactive practice  *(Premium feature)*

- On-screen worksheet runner with instant per-question feedback.
- Auto-save of score + per-skill correctness.
- Progress dashboard updates after each interactive session.
- Print stylesheet still works for the same worksheet.

---

## Phase 3 — Better curriculum mapping

- Expand `data/ontario-curriculum-k3.json` into a fully indexed skill graph.
- Tag every generated worksheet question with the curriculum expectation it
  practices.
- Show which expectations are mastered / in progress / new.
- Move Supabase to a Canadian region.

---

## Phase 4 — PDF worksheet export

- Server-side PDF rendering of the worksheet + answer key.
- Branded but minimal layout.
- Email-the-PDF flow for tutors / teachers.

---

## Phase 5 — Grades 4–6 expansion

- Extend curriculum data + prompt rules to Grades 4, 5, 6.
- Add Writing rubric scaffolding for upper-elementary samples.
- Adjust UI copy to drop the "K–3" positioning.

---

## Phase 6 — Multi-curriculum (Canada + USA)

- Add curricula: BC, AB, QC, plus Common Core (US).
- Profile picks the curriculum at child creation.
- Skill mapping engine generalised across curricula.

---

## Phase 7 — Native mobile app

- React Native (or Expo) wrapping the web flows.
- Camera-first upload (snap a worksheet → analyze).
- Push reminders for the 5-minute daily routine.

---

## Phase 8 — Full adaptive AI tutoring system

- A live, mid-session loop that adjusts difficulty after each question.
- Optional, supervised child-facing read-aloud + dictation (still under an
  adult account).
- Long-running learning plan that re-evaluates monthly with no adult input.

---

## Permanent non-goals

- A chatbot that replaces a teacher.
- A leaderboard, a streak war, a social feed.
- Anything that diagnoses a learning condition.
- Selling parent or child data.
- Child logins.
