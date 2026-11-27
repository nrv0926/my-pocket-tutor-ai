# Paste this into a fresh Claude Code session

Open Claude Code in the `my-pocket-tutor-ai` repo and paste everything in
the block below. It is written to be acted on, not read.

---

```text
Get AI Pocket Tutor running against a real Supabase project and deployed to
Vercel, so I can test it end to end. I am Nicolas; I have a browser open and
can click through dashboards. You have the shell.

REPO STATE
- Work on branch `claude/affectionate-galileo-j60265`. Check it out and pull
  before anything else — it is 17 commits ahead of the default branch and
  contains all the setup fixes.
- `docs/SETUP_RUNBOOK.md` is the source of truth for this task. Read it
  first, and follow it. Everything below is about how you and I split it up.
- `CLAUDE.md` is binding. Read it before changing any code.

SECRETS — READ THIS BEFORE ASKING ME FOR ANYTHING
- Never ask me to paste a key, token, password or database connection string
  into the chat. Not once, not "just the first few characters".
- When you need one, tell me the exact variable name and which file or field
  to put it in, and I will do that myself. Then tell me how to confirm you
  can see it without printing it.
- Never echo, cat, log or grep a value out of `.env.local` into your output.
  Check for presence and length only, e.g. the key exists and is non-empty.
- If a secret ends up somewhere it should not be, say so immediately and
  tell me to revoke it at the source. Do not assess whether it was seen.

STEP 0 — PROVE THE CODE IS SOUND FIRST
Before touching Supabase, run these and show me the results:
  npm install
  npx tsc --noEmit
  npx next lint
  npx vitest run
  npm run build
  bash supabase/tests/run-local.sh
That last one stands up a throwaway Postgres and proves row-level security
works, with no Supabase project at all. If any of this fails, stop and fix it
— a broken build will otherwise look like a broken setup for an hour.

STEP 1 — SUPABASE PROJECT (I do this, you tell me exactly what to click)
Give me the steps in order, one screen at a time, and wait for me to confirm
each before moving on. Cover: creating the project and region, where the
database password goes, and when provisioning has to finish before we carry
on.

STEP 2 — SCHEMA (you do this if you can reach it; otherwise I paste)
Two routes. Try the first.

  (a) I add `SUPABASE_DB_URL` to `.env.local` with the project's pooled
      connection string. You then run, in this order, without printing the
      URL:
        psql "$SUPABASE_DB_URL" -f supabase/schema.sql
        psql "$SUPABASE_DB_URL" -f supabase/policies.sql
        psql "$SUPABASE_DB_URL" -f supabase/storage.sql
      Check first whether outbound Postgres is reachable from your
      environment; if the proxy blocks it, say so plainly and use (b).

  (b) You print each file and I paste it into the Supabase SQL Editor, in
      the same order, one at a time. Tell me what a successful run looks
      like for each.

This is a FRESH project, so do NOT run anything in `supabase/migrations/` —
`schema.sql` already contains all of it. The migrations are only for a
database that already holds data.

After the three files, verify the tables exist and report what you found.

STEP 3 — KEYS
Copy `.env.example` to `.env.local`. Then tell me, as a table, every variable
I need to fill in and exactly where in the Supabase dashboard each value
lives. Flag which one is server-only and must never reach the browser.

I will fill them in myself. Then verify presence without printing values, and
tell me which are still empty.

On `ANTHROPIC_MODEL`: `.env.example` still defaults to a Claude 4 model. Tell
me what the current model IDs are and what switching would change about cost,
then let me decide. Do not change it on your own.

STEP 4 — AUTH (I do this, you tell me what to enter)
Sign-in is a magic link. Give me the exact redirect URLs to add for
localhost, including both callback paths the app actually uses — read them
out of the code rather than guessing.

STEP 5 — RUN IT LOCALLY AND PROVE IT
  npm run dev
Then walk me through:
  - signing in with a magic link
  - `/settings`, which runs the real setup checks — every row must read OK
  - `/demo`, which must work with no sign-in at all
If a setup check fails, fix the cause, not the check.

STEP 6 — VERCEL
Tell me what to do in the browser to create and link the project. Then help
me get every environment variable in for BOTH Production and Preview, and
explain why the `NEXT_PUBLIC_*` ones need a redeploy rather than a restart.

After it deploys: give me the production redirect URLs to add back in
Supabase, then check `/settings` and `/demo` on the live site. A working
local setup proves nothing about production — say so and check anyway.

DEFINITION OF DONE
Do not tell me it is done until all five are true, and say which you actually
checked rather than assumed:
  1. `npm run build` passes and every test suite passes.
  2. `/settings` shows all checks OK on localhost.
  3. I can sign in with a magic link on localhost.
  4. The site is deployed and `/settings` shows all checks OK on production.
  5. `/demo` loads on production with no sign-in.

HOW I WANT YOU TO WORK
- One step at a time. Wait for me to confirm before moving on.
- When something fails, show me the actual error before proposing a fix.
- If you hit something that is my decision rather than yours, stop and ask.
- Do not loosen a test to make it pass. Several of them exist because the
  thing they check has already gone wrong once.
```

---

## If you want to keep going afterwards

Once it is running, §5 of `docs/SETUP_RUNBOOK.md` lists what to build next —
three things that need no decision from you, and five that do.
