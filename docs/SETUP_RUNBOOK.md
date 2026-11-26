# Setup runbook — stand it up, then keep building

Written to be handed to an assistant working in a browser (Claude in Chrome,
or anything else that can click through the Supabase and Vercel dashboards).
Follow it in order. Every claim here was checked against the code on
2026-11-26; where it says "a test asserts this", that test exists.

---

## 0. Read these first. They are binding.

- **`CLAUDE.md`** — house rules. Not advice. The output contract, the
  security rules and the curriculum discipline are all in it, and a change
  that breaks one of them is wrong even if it works.
- **`SECURITY.md`** and **`PRODUCT_ROADMAP.md`**.
- **`docs/assessment/SCENARIO_COVERAGE.md`** — the 116 test scenarios and
  where each stands.

Three rules that get broken most often, so they are repeated here:

1. **Never write an Ontario expectation code or its wording from memory.**
   They are transcribed into `data/ontario/*.json`. An invented `B1.3` is
   worse than a missing one, because a teacher will trust it.
2. **Never use the service-role key in a request handler that runs for a
   signed-in user.** Use the user-scoped client. Row-level security proving
   ownership through `children.user_id = auth.uid()` is the one security
   property this product cannot get wrong.
3. **Nine sections means nine.** Anything new goes *inside* an existing
   section of the analysis output, never beside them.

---

## 1. Supabase, from nothing

### 1.1 Create the project

1. Go to <https://supabase.com/dashboard>, **New project**.
2. Region: somewhere Canadian or US-east. The learners are in Ontario.
3. Save the database password in a password manager. You will not need it
   for the app, but you will need it for `psql`.
4. Wait for provisioning to finish before the next step.

### 1.2 Create the schema — three pastes, in this order

Open **SQL Editor** in the project and run these files from the repo, whole,
one at a time, in order. Each is idempotent, so running one twice is safe.

| # | File | What it does |
|---|---|---|
| 1 | `supabase/schema.sql` | Every table, index, constraint, trigger and the `save_capture_rows` function |
| 2 | `supabase/policies.sql` | Row-level security on every table |
| 3 | `supabase/storage.sql` | The **private** `child-uploads` bucket and its owner-scoped object policy |

**Do not run the files in `supabase/migrations/` on a fresh project.**
`schema.sql` already contains everything they do. Migrations are for a
database that already holds data — see §1.3.

> One table, `expectation_notes`, lived only in migration 0002 until
> 2026-11-26, so a project bootstrapped before that date is missing it and
> `/curriculum` breaks the first time anyone asks for an explanation. If that
> is your project, re-run `schema.sql` and `policies.sql`; both are
> idempotent. `tests/freshProject.test.ts` now fails the build if any table
> the code reads is missing from `schema.sql`.

### 1.3 Only if the database already has data

Run the migrations that have not been applied yet, in numeric order:

```
0004_mode_of_support      0008_rubrics
0005_session_close        0009_capture_transaction
0006_item_observations    0010_session_exclusion
0007_worksheet_item_ids   0011_accommodations
```

`0007_down.sql` reverses 0007 and is the only reversal provided. Do not run
it unless you are undoing 0007 deliberately.

Before touching a database with real data in it, rehearse: the repo has a
harness that builds the pre-migration schema, seeds it, migrates, asserts
the backfill counts and then reverses 0007.

```bash
bash supabase/tests/run-migrations.sh
```

### 1.4 Auth

Sign-in is a **magic link** — no passwords anywhere.

1. **Authentication → Providers → Email**: enabled. Leave "Confirm email" on.
2. **Authentication → URL Configuration**:
   - Site URL: your deployed origin (e.g. `https://pockettutor.example.ca`),
     or `http://localhost:3000` while developing.
   - Redirect URLs: add **both** of these for every origin you use —
     `…/auth/callback` and `…/auth/confirm`. The app uses the PKCE `?code=`
     flow via `/auth/callback` and falls back to `/auth/confirm`; the login
     page prints the exact callback URL it will use, so read it there if in
     doubt.
3. Optional but worth it: **Authentication → Emails**, set the sender name
   to something a parent will recognise.

### 1.5 Check the bucket is private

**Storage → child-uploads → Configuration.** "Public bucket" must be **off**.
`storage.sql` sets it that way and resets it on re-run, but check anyway —
uploaded work is a child's schoolwork, reachable only through short-lived
signed URLs. A test asserts the SQL creates it private; nothing can assert
somebody did not flip it in the dashboard.

---

## 2. Keys, and where they go

> **Never paste a key into a chat window, a commit, an issue or a
> screenshot.** If one is ever pasted somewhere it should not be, revoke it
> at the source immediately and issue a new one — do not try to assess
> whether it was seen. Keys belong in `.env.local` (git-ignored) or in the
> host's environment-variable settings, typed or pasted directly into that
> field and nowhere else.

Copy `.env.example` to `.env.local` and fill it in. From **Project Settings
→ API**:

| Variable | Where it comes from | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL | Safe in the browser |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon` / publishable key | Safe in the browser |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` key | **Server only.** Bypasses RLS. Never in a `NEXT_PUBLIC_` variable, never in a client component |
| `SUPABASE_UPLOADS_BUCKET` | `child-uploads` | Must match the bucket |
| `NEXT_PUBLIC_APP_URL` | Your origin | Used for redirects |
| `ANTHROPIC_API_KEY` | <https://console.anthropic.com> | Without it, `lib/aiService.ts` returns a deterministic stub, so the UI still works end to end |
| `ANTHROPIC_MODEL` | see below | |

**On the model.** `.env.example` currently defaults to `claude-opus-4-7`.
The current family is Claude 5 — `claude-opus-5-5`, `claude-sonnet-5-5`,
`claude-haiku-5-5`. Moving to a Claude 5 model is a one-line change and
worth doing, but it changes cost per plan, so make it deliberately rather
than as a side effect of something else. If you change it, bump the prompt
version per CLAUDE.md §4 only if you also change a prompt — a model swap on
its own is not a prompt change.

---

## 3. Did it work?

Three checks, cheapest first.

1. **`npm run build`** — if it fails, nothing else matters. The build runs
   the test suite's guards: the client bundle check, the protected-routes
   check, the fresh-project check.
2. **Visit `/settings`** while signed in. It runs `lib/setupCheck.ts` and
   reports each piece of the database with the file that fixes it. Every row
   should read OK. A missing bucket row naming a bucket you do not recognise
   means `SUPABASE_UPLOADS_BUCKET` and the actual bucket disagree.
3. **Sign in.** `/login` → magic link → you should land back on the app
   signed in. If it bounces to `?error=`, the redirect URL in §1.4 is wrong.

To prove row-level security really is on, run the SQL suites against a
throwaway Postgres — it needs no Supabase project at all:

```bash
bash supabase/tests/run-local.sh
```

That applies the three SQL files unmodified and then checks that one parent
cannot read, update, delete or forge another parent's rows, that the capture
constraints hold, and that a logged-out visitor sees nothing.

---

## 4. Deploy

The app is Next.js App Router; Vercel is the path of least resistance.

1. Import the GitHub repo.
2. Add every variable from §2 to **Settings → Environment Variables**, for
   Production *and* Preview. `NEXT_PUBLIC_*` values are baked in at build
   time, so changing one needs a redeploy, not a restart.
3. Deploy, then go back to §1.4 and add the deployed origin's
   `/auth/callback` and `/auth/confirm` to Supabase's redirect URLs.
4. Visit `/settings` on the deployed site and confirm the checks pass there
   too. A working local setup proves nothing about production.

**Showcase while you work:** `/demo` runs the whole product — plan, capture
screen, next step — with no sign-in, no database and no API key. It is the
page to send someone. `/demo/loop` compares three cases against the same
engine.

---

## 5. What to build next

In order. The first two are small and unambiguous; after that it gets into
decisions that are Nicolas's, not yours.

### Ship-ready, no decision needed

1. **Wire `plain_literal_wording` into the prompt.** The accommodation is
   stored on the profile (migration 0011) and nothing reads it. Pass it to
   the model and bump the prompt version per CLAUDE.md §4.
2. **A `timed` flag on a worksheet question**, so the
   `timed_never_counts` accommodation has something to act on. Right now it
   is stored and inert, because nothing marks a question as timed.
3. **Large print** (`LC-09`). The print stylesheet is the only export at
   MVP, and a low-vision learner needs it to scale with diagrams intact.

### Needs a decision from Nicolas first — ask, do not pick

4. **`C-07`: correcting a mis-tap.** Every save takes the next attempt
   number and only attempt 1 counts, so a mis-tap is permanent and the
   correction is ignored by the engine. Should correcting edit attempt 1, or
   stay a new attempt? The UI currently says "The first save is the one that
   counts", which is right for reteaching and wrong for a mis-tap.
5. **`SU-06`: open written responses before Phase 4.** There is no
   consistent behaviour. The rubric work in migration 0008 is the real
   answer; until it reaches the capture screen, a candidate is to default
   such an item to `pending_review` and never let it self-score.
6. **`LC-13`: one planned grade per child, not per subject.** A Grade 2 can
   be ready for Grade 3 maths and need Grade 1 writing. This is a schema
   change.
7. **`LC-20`: letting the adult overrule the suggestion.** The hard half is
   that an override must be recorded and then stop mattering, or the card
   becomes a sticky note.
8. **Science and Technology.** Currently `supported: false` with its strands
   transcribed and no expectations. To enable it, transcribe the curriculum
   from the Ministry source into `data/ontario/science-technology.json`,
   then flip `supported` in `subjects.json` **and** add it back to
   `SUBJECTS` in `types/child.ts` — a test asserts those two lists agree,
   and another asserts nothing is offered without expectations behind it.

---

## 6. Guardrails

Things that look like progress and are not.

- **Do not loosen a test to make it pass.** Several tests in this repo exist
  because the thing they check has already gone wrong once. If a test is
  failing, the test is usually right.
- **Do not add a second RLS policy path.** Every table proves ownership by
  joining `children.user_id = auth.uid()`. A `SECURITY DEFINER` function
  that writes user data is a second path; `save_capture_rows` is
  `SECURITY INVOKER` for exactly this reason.
- **Do not put a real child's name, grade or difficulty anywhere public.**
  `/demo`, `/demo/loop` and `/curriculum` are public routes. A first name
  beside a grade and a named difficulty identifies a child.
  `tests/internalPages.test.ts` fails the build if a demo fixture carries a
  given name.
- **Do not import `lib/curriculum.ts` from a `"use client"` file.** It pulls
  ~250 KB of transcribed JSON at module scope. Reach it through a server
  action. `tests/clientBundle.test.ts` catches it.
- **Do not generate curriculum content.** Transcribe it, or leave the gap
  and say so.
- **Do not add analytics, trackers or ad SDKs** without explicit sign-off
  (CLAUDE.md §3).
- **Do not commit `.env.local`.** If a key reaches a commit, revoke it
  first, then rewrite history.

---

## 7. Useful commands

```bash
npm install
npm run dev                            # http://localhost:3000
npm run build                          # also runs the build-time guards
npx vitest run                         # the whole unit suite
npx vitest run tests/recommend.test.ts # one file
npx next lint
npx tsc --noEmit

bash supabase/tests/run-local.sh       # RLS + constraints, throwaway Postgres
bash supabase/tests/run-migrations.sh  # migrations against seeded data
```

Opt-in, and each needs a key in `.env.local`:

```bash
RUN_DECODABLE_EVAL=1 npx vitest run tests/decodableEval.test.ts
```
