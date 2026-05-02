# CLAUDE.md — house rules for Pocket Tutor

This file is read by Claude Code (and any other AI contributor) before
suggesting changes to this repository. **Treat it as binding.**

---

## 1. Project purpose

Pocket Tutor is a quiet co-pilot for **parents, homeschoolers, and teachers**
of K–3 children. It analyzes a child's learning data and returns a clear,
kind plan of what to teach next — in the format that matches the adult's
situation.

It is **not**:
- A chatbot for children to use directly.
- A diagnostic tool. We never name conditions.
- A general-purpose AI app.

If a proposed feature drifts from "help an adult know what to teach next,"
push back before building it.

## 2. The three modes

Every analysis is generated in exactly one of three modes. The mode is chosen
by the adult before analysis runs and drives the prompt and output shape.

- **Parent mode** — a 10–15 minute daily plan for home. Today / tonight focus.
- **Homeschool mode** — a full Mon–Fri weekly plan with daily lesson
  breakdowns by subject, plus a progress checklist for next week.
- **Teacher mode** — a 3–5 session intervention plan for a student or small
  group, with three differentiation levels and an assessment checkpoint.

The core analysis (skill gaps, curriculum mapping, priorities) is the same
across modes. Only the output container differs.

## 3. Coding standards

- **Next.js App Router** + **TypeScript strict** + **Tailwind**.
- Server actions / API routes for any DB or AI calls. No secrets in client code.
- Reusable components live in `/components`. Pages live in `/app`.
- Landing-page sections live in `/components/landing`.
- Prefer **small, named** components over large `page.tsx` files.
- No inline `any`. If you truly need it, comment why.
- Keep files under ~250 lines where reasonable. Split when they grow.
- Components are **mobile-first**. Test layouts at 360px before 1280px.
- Plain English in UI. No edu-jargon. A tired parent at 9pm is the reader.
- Default to **no comments**. Add one only when the *why* is non-obvious.

## 4. Visual language

- Typography: **Playfair Display** (serif) for display + **DM Sans** for body.
- Palette tokens live in `tailwind.config.ts`:
  - `forest` (green) for primary, `teal` for accent, `cream` for surfaces,
    `navy` for the dark footer, `ink` for text.
- Buttons: rounded `rounded-xl`, primary uses `bg-forest-500` with
  `shadow-glow`, secondary is bordered.
- Sections alternate `bg-cream-50` (light) and `bg-teal-700` (dark).

## 5. Security rules (non-negotiable)

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

## 6. AI prompt rules

- All prompts live in `/prompts`. Do not inline prompts in pages or services.
- Every prompt is a versioned, exported constant — **change the version string
  when you change the prompt**.
- One prompt per mode (`parentPrompt`, `homeschoolPrompt`, `teacherPrompt`).
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

## 7. Output format rules

Every analysis response uses a fixed structure for its mode. If you change
the structure, change the matching renderer in `components/` — and bump the
prompt version.

### Parent mode (9 sections)

1. WHAT I NOTICE
2. KEY SKILL GAPS
3. WHAT TO TEACH NEXT *(top 3 priorities only)*
4. HOW TO TEACH IT
5. PRACTICE WORKSHEET *(5–8 questions, labelled Easy/Medium/Hard)*
6. ANSWER KEY
7. PARENT TIPS *(2–3 only)*
8. NEXT STEP PLAN
9. FEEDBACK QUESTION *(always: "Was this too easy, just right, or too hard?")*

### Homeschool mode

1. WHAT I NOTICE
2. KEY SKILL GAPS
3. WEEKLY PLAN *(Mon–Fri, by subject)*
4. DAILY LESSON BREAKDOWN
5. WORKSHEET SET *(one per priority skill)*
6. ANSWER KEYS
7. PROGRESS CHECKLIST
8. NEXT WEEK PLAN
9. FEEDBACK QUESTION

### Teacher mode

1. STUDENT / GROUP SUMMARY
2. KEY SKILL GAPS
3. INTERVENTION PLAN *(3–5 sessions)*
4. DIFFERENTIATED PRACTICE *(Easy / Just right / Stretch — three levels)*
5. WORKSHEET SET
6. ANSWER KEYS
7. ASSESSMENT CHECKPOINT
8. TEACHER NOTES
9. FEEDBACK QUESTION

## 8. Curriculum alignment

- **Default location**: Ontario, Canada.
- **Grades**: K, 1, 2, 3 *(MVP scope; K–6 is on the roadmap)*.
- **Subjects**: Language, Reading, Writing, Math.
- Skill maps live in `/data`. Look there before inventing a skill name.
- If the curriculum data does not cover a skill yet, add it to the JSON file
  rather than hard-coding it in a prompt.

## 9. Adaptation rules

- ADHD mentioned → shorter tasks, chunked steps, movement breaks, simple
  instructions.
- Dyslexia mentioned → smaller word sets, more repetition, decoding focus,
  no comprehension-heavy work until decoding improves.
- Anxiety mentioned → start easier, build confidence, avoid overwhelming
  language, use quick wins.
- **Never diagnose.** We acknowledge what the parent shared and adapt the
  plan; we don't label the child.

## 10. Practice surface

Two ways a child practises a generated worksheet:

- **Printable** — clean PDF / print stylesheet, included in every plan
  (Free + Premium + Family).
- **Interactive** — on-screen practice with instant feedback and a saved
  score (**Premium + Family only**). The child works through it under an
  adult account; we never create child logins.

## 11. What NOT to build yet

- No social features, leaderboards, or sharing.
- No child-facing chat or child login.
- No teacher *dashboard* with rosters / districts (that's a later phase —
  Teacher mode today is just an output format, not an admin surface).
- No multi-curriculum switcher (US / other provinces) yet.
- No native mobile app yet.
- No live adaptive tutoring loop yet.

## 12. MVP-only focus

Five verbs: **Input → Analyze → Teach → Worksheet → Track**.

If a change doesn't make one of those five better, defer it. Add a note to
`PRODUCT_ROADMAP.md` instead of building it now.
