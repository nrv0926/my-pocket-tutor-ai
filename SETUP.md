# Running AI Pocket Tutor on your own machine

From nothing to a clickable prototype. Budget about 15 minutes, most of
it waiting for Supabase to finish creating the project.

You need **Node.js 20 or newer** (`node -v` to check) and a free Supabase
account. You do **not** need an Anthropic API key to click through the
whole thing — see [step 7](#7-optional-turn-on-the-real-ai).

---

## Just want to see it? (2 minutes, no Supabase account)

The public pages only need Supabase env vars to *exist* — `middleware.ts`
reads them on every request and crashes if they're missing, but it never
has to reach a real project unless you sign in.

```bash
git clone https://github.com/nrv0926/my-pocket-tutor-ai.git
cd my-pocket-tutor-ai
npm install

cat > .env.local <<'ENV'
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_DEFAULT_LOCATION=ON-CA
NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder-anon-key-for-local-dev
ENV

npm run dev
```

Open <http://localhost:3000>. The landing page, the three audience pages,
pricing, and **`/try`** — the complete nine-section sample plan — all
work. Signing in won't, because those credentials point nowhere.

When you want real login and saved children, do the full setup below.

---

## 1. Get the code running

```bash
git clone https://github.com/nrv0926/my-pocket-tutor-ai.git
cd my-pocket-tutor-ai
npm install
```

## 2. Create the Supabase project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and click
   **New project**.
2. Give it any name. Pick a region near you. Save the database password
   somewhere — you won't need it below, but you'll want it later.
3. Wait for provisioning to finish (a couple of minutes).

## 3. Create the database

Open **SQL Editor** in the left sidebar. Run these three files **in this
order** — paste the contents of each into a new query and hit Run:

| Order | File                    | What it creates                          |
| ----- | ----------------------- | ---------------------------------------- |
| 1     | `supabase/schema.sql`   | Tables, indexes, the daily-quota function |
| 2     | `supabase/policies.sql` | Row-Level Security on every table         |
| 3     | `supabase/storage.sql`  | The private `child-uploads` bucket        |

Each one should report success with no rows. Order matters — the policies
reference tables the schema creates.

## 4. Point Supabase somewhere the link can actually land

> **If you have deployed to Vercel, use that URL, not localhost.** A magic
> link pointing at `localhost:3000` only works on the one machine where
> `npm run dev` is running, at the moment you click it. Open that email on
> your phone, or after stopping the dev server, and you get
> `ERR_CONNECTION_REFUSED` — `localhost` means *that* device. Pointing
> Supabase at your deployed URL makes sign-in work from any device, any
> time, with no local server involved.
>
> Site URL: `https://your-app.vercel.app`
> Redirect URLs: `https://your-app.vercel.app/**` and
> `https://your-app.vercel.app/auth/callback`
>
> You can list the localhost entries below *as well* — the allowlist takes
> several. The Site URL is the one that has to be the deployed origin,
> because that is the fallback Supabase uses.

### For local development

Still in the dashboard, go to **Authentication → URL Configuration**:

- **Site URL**: `http://localhost:3000`
- **Redirect URLs**: add **both** of these —
  - `http://localhost:3000/auth/callback`
  - `http://localhost:3000/**`

Get this wrong and the failure is confusing rather than obvious. Supabase
does not reject a redirect that isn't on the allowlist — it silently
falls back to your **Site URL**. So the magic link arrives looking almost
right:

```
http://localhost:3000/?code=c63f4432-...     ← landed on the home page
http://localhost:3000/auth/callback?code=... ← where it should have gone
```

The code lands on a page with no handler, nothing exchanges it for a
session, and you end up back on the home page still signed out with no
error shown.

`middleware.ts` now catches this and forwards any stray `?code=` to
`/auth/callback`, so sign-in works even if the allowlist is wrong. Fix
the allowlist anyway — the rescue is a safety net, not the mechanism.

**Deploying too?** Add your production URLs to the same list, e.g.
`https://your-app.vercel.app/auth/callback` and
`https://your-app.vercel.app/**`. The allowlist is per project, not per
environment.

## 5. Fill in your local environment

```bash
cp .env.example .env.local
```

Now open `.env.local`. In the dashboard go to **Project Settings → API**
and copy two values across:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

That is genuinely all you need. Both are browser-public by design.

**Leave `SUPABASE_SERVICE_ROLE_KEY` blank.** Nothing in the app reads it
today (`lib/uploadService.ts` is the only file that would, and no page
imports it yet). An unset secret can't leak.

`.env.local` is gitignored. Keep it that way.

## 6. Run it

```bash
npm run dev
```

Open <http://localhost:3000>.

## 7. Optional: turn on the real AI

Out of the box, with no `ANTHROPIC_API_KEY` set, `lib/aiService.ts`
returns a deterministic sample plan. Every screen works end to end, the
data is just always the same reading plan. That's the right mode for
demos and for poking at the UI.

To make it actually analyze what you type, add a key from
[console.anthropic.com](https://console.anthropic.com) to `.env.local`:

```
ANTHROPIC_API_KEY=sk-ant-...
```

Restart `npm run dev`. Real calls cost money per analysis. There's a
per-user daily cap (default 20, override with `AI_DAILY_LIMIT`).

---

## The path through the app

1. **`/try`** — a fully rendered sample plan, no signup. Good sanity check
   that the front end is healthy.
2. **Start a child profile** → bounces you to **`/login`**.
3. Enter your email, click **Send magic link**, then click the link in
   your inbox. It lands on `/auth/callback` and drops you at the page you
   were originally headed for.
   - Nothing arrives? Check spam. Supabase's built-in email sender is
     rate-limited on the free tier (a few per hour) — fine for testing,
     not for real users.
4. **Create a child profile** — nickname, grade, and anything you want
   to mention about how they learn. Never a legal full name: the schema
   stores a nickname on purpose.
5. **New session** → paste a report-card sentence or describe what you're
   seeing → you get the nine-section plan at `/results/[id]`.
6. **`/progress/[childId]`** tracks it over time.

## What isn't wired yet

- **File upload.** `/upload` renders, but the button is a `TODO` — the
  MVP path is text only. Paste the report-card comment instead.
- **Stripe.** The pricing page is real; checkout is a placeholder.

## If something breaks

| Symptom | Cause |
| --- | --- |
| Every page 500s with *"Your project's URL and Key are required to create a Supabase client!"* | `NEXT_PUBLIC_SUPABASE_URL` or the anon key is missing or blank. `middleware.ts` runs on every request and needs both. |
| `ERR_CONNECTION_REFUSED` on the magic link | Nothing is serving port 3000 on the device you opened it from. Start `npm run dev`, and open the email on that same machine — or point Supabase at your deployed URL instead (step 4). |
| Magic link lands on `/?code=...` and you're still signed out | Step 4 — `/auth/callback` isn't allowlisted, so Supabase fell back to the Site URL. Middleware now rescues this, but fix the allowlist. |
| Magic link says "otp_expired" | The link was already used, or it's older than an hour. Request a new one. |
| `PKCE code verifier not found in storage` | The link was opened in a different browser than the one that requested it. Open it in the same browser. |
| Signed in, but "Child not found" | `supabase/policies.sql` didn't run, or ran before the schema. |
| Fonts look wrong | Google Fonts is blocked on your network. Cosmetic only; the fallback stack still reads fine. |

Only run one `npm run dev` at a time from this folder. Two instances
share the `.next` build cache and will start serving each other 404s.

Env changes only take effect on restart — Next.js reads `.env.local` at
boot.
