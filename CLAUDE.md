# CLAUDE.md — house rules for AI Pocket Tutor

This file is read by Claude Code (and any other AI contributor) before
suggesting changes to this repository. **Treat it as binding.**

---

## 1. Project purpose

AI Pocket Tutor is a quiet co-pilot for **parents and teachers** of K–6
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

## 6. Curriculum alignment

- **Default location**: Ontario, Canada.
- **Grades**: K, 1, 2, 3, 4, 5, 6.
- **Subjects**: Language, Reading, Writing, Math.
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
