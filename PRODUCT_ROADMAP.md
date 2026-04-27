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

## Permanent non-goals

- A chatbot that replaces a teacher.
- A leaderboard, a streak war, a social feed.
- Anything that diagnoses a learning condition.
- Selling parent or child data.
