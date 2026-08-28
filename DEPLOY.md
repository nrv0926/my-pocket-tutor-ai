# Deploying AI Pocket Tutor to Vercel

`SETUP.md` gets the app running on your machine. This gets it running on a
URL you can send to someone.

Do it in this order. The reason is step 3: `NEXT_PUBLIC_*` variables are
baked into the JavaScript bundle **at build time**, not read at runtime.
Deploy first and add them after, and you get a build with the values
missing — you have to redeploy to fix it.

---

## Why deploy at all, rather than demoing on localhost

A magic link pointing at `localhost:3000` only works on the one machine
running `npm run dev`, at the moment you click it. Open the email on your
phone, or ten minutes after stopping the server, and you get
`ERR_CONNECTION_REFUSED` — `localhost` means *that device*.

A deployed URL is always up, works from any device, and needs no local
server. It is the difference between a demo you can hand someone and one
you have to stand next to.

---

## 1. Decide which branch is production

Vercel builds your repository's **default branch** unless told otherwise.
Check what that is before you import — this repo's default is not `main`.

Whatever you pick becomes the branch every future push must land on to go
live. Merge anything you want in the demo *before* you import, or merge it
after and let Vercel rebuild.

## 2. Import the project

1. Go to [vercel.com/new](https://vercel.com/new) and connect GitHub if you
   haven't.
2. Pick `my-pocket-tutor-ai`.
3. Leave every build setting alone. Vercel detects Next.js on its own, and
   this repo deliberately has no `vercel.json` — there is nothing to
   override.
4. **Do not click Deploy yet.** Open **Environment Variables** first.

## 3. Set the environment variables

Add these before the first build. In the Supabase dashboard they're under
**Project Settings → API**.

| Variable | Value | Environments |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://YOUR-REF.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your anon / publishable key | Production, Preview, Development |
| `NEXT_PUBLIC_APP_URL` | your Vercel URL, once you know it | Production |
| `NEXT_PUBLIC_DEFAULT_LOCATION` | `ON-CA` | all |

Both Supabase values are browser-public by design — that is what the anon
key is for. Row-Level Security is what protects the data, not secrecy of
that key.

Leave `SUPABASE_SERVICE_ROLE_KEY` unset. Nothing in the app reads it today,
and an unset secret cannot leak.

`ANTHROPIC_API_KEY` is optional — see step 7.

You won't know your Vercel URL until after the first deploy, so set
`NEXT_PUBLIC_APP_URL` then and redeploy. It only affects link and social-card
metadata, so it is safe to be briefly wrong.

## 4. Deploy, and write down the URL

Click **Deploy**. You'll get something like
`https://my-pocket-tutor-ai.vercel.app`. Everything below needs it.

The public pages should work immediately: `/`, `/try`, `/pricing`,
`/for/parent`. If those load, the build is good and only auth is left.

## 5. Create the database

If you have never pasted the SQL into this project, do it now — otherwise
sign-in will succeed and then every screen will fail on missing tables.

In the Supabase **SQL Editor**, run these in order:

1. `supabase/schema.sql`
2. `supabase/policies.sql`
3. `supabase/storage.sql`

All three are safe to re-run. They use `if not exists`, `on conflict do
update`, and `drop policy if exists`, so running them again on a database
that already has them changes nothing. If you are unsure whether they ever
ran, just run them.

These were executed against a clean PostgreSQL 16 database, twice, to
confirm that: they apply without error, they are idempotent, all eight
tables come up with row-level security enabled and at least one policy
each, and `child-uploads` is created private.

> The dashboard's **Last migration: No migrations** only tracks the Supabase
> CLI. Running the SQL by hand leaves it saying that forever. It is not
> evidence your tables are missing.

**Already have a database from before August 2026?** Re-run `schema.sql`. It
adds the `kind` column that lets a profile be a whole class rather than one
student, and existing rows become `student`. Verified against a database
created without the column.

## 6. Point Supabase at the deployed URL

**Authentication → URL Configuration:**

- **Site URL**: `https://your-app.vercel.app` — the deployed origin, *not*
  localhost. This is the value Supabase falls back to, so it is the one
  that has to be right.
- **Redirect URLs**: add all of these —
  - `https://your-app.vercel.app/auth/callback`
  - `https://your-app.vercel.app/**`
  - `http://localhost:3000/auth/callback`
  - `http://localhost:3000/**`

The localhost entries let you keep developing. The Site URL is what makes
emailed links work from a phone.

**Preview deployments** get their own URL per branch
(`my-pocket-tutor-ai-git-xyz.vercel.app`), which won't match the allowlist.
Sign-in works on production; on a preview it falls back to the Site URL and
lands you on production instead. That's fine — just don't demo from a
preview URL.

## 7. Fix the email templates

Do not skip this. Supabase's default template uses `{{ .ConfirmationURL }}`,
which drops the path and lands the link on `/` instead of `/auth/callback`.
Building the URL from `{{ .SiteURL }}` plus a literal path sidesteps it —
nothing has to survive an allowlist match for the path to be kept.

Go to **Authentication → Emails**. Replace the body of **both** templates.

**Magic link** (`type=magiclink`):

```html
<h2>Your sign-in link</h2>
<p>Follow this link to sign in:</p>
<p>
  <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=magiclink">
    Sign in
  </a>
</p>
<p>This link expires in an hour and works once.</p>
```

**Confirm signup** (`type=signup`) — a brand-new address gets this one, not
the magic-link template, so it needs the same treatment:

```html
<h2>Confirm your email</h2>
<p>Follow this link to finish signing up:</p>
<p>
  <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup">
    Confirm
  </a>
</p>
```

`app/auth/confirm/route.ts` verifies the token and starts the session. It
accepts `signup`, `invite`, `magiclink`, `recovery`, `email_change`, and
`email`, so the same URL shape works for the other templates if you enable
them later.

`middleware.ts` catches stray `?code=` and `?token_hash=` on the wrong path
and forwards them, so sign-in survives a wrong template. Fix the template
anyway; the rescue is a safety net, not the mechanism.

## 8. If anyone but you will sign in, set up SMTP

This is the one that ambushes people during a demo. Supabase's built-in
email sender:

- sends **2 emails per hour, project-wide** — not per user; and
- since September 2024, **only delivers to members of your Supabase
  organisation**.

So if you hand the laptop to someone and they sign in with their own
address, they will never receive anything, and no error is shown to
either of you. Testing a few times also exhausts the hourly cap, which
surfaces as `email rate limit exceeded`.

`SETUP.md` §4c walks through custom SMTP. Until it's done, only your own
Supabase org members can sign in.

**Showing it to someone this week?** The safest demo signs in as *you*, on
an account you tested that morning. `/try` needs no account at all.

## 9. Optional: turn on the real AI

Without `ANTHROPIC_API_KEY`, `lib/aiService.ts` returns a deterministic
sample plan and every screen still works — the plan is just always the same
one. That is a legitimate demo mode, and it costs nothing.

To analyze real input, add `ANTHROPIC_API_KEY` in Vercel (Production) and
redeploy. Real calls cost money per analysis; there's a per-user daily cap
(default 20, override with `AI_DAILY_LIMIT`).

---

## Check it worked

On the deployed URL, in order:

- [ ] `/` loads, and `/try` shows the full nine-section plan
- [ ] `/dashboard` bounces you to `/login`
- [ ] the magic link email arrives
- [ ] the link lands on `/auth/callback`, not `/`
- [ ] you come back signed in, with your email in the header
- [ ] adding a child saves and survives a refresh

If a step fails, the failure is almost always in the step above it.

## When it doesn't work

| What you see | Where to look |
| --- | --- |
| Every page 500s | `NEXT_PUBLIC_SUPABASE_*` missing at **build** time — set them, then redeploy |
| `ERR_CONNECTION_REFUSED` | The link points at localhost. Site URL is still localhost (step 6) |
| Link lands on `/` and you're signed out | Email template (step 7) |
| No email at all | SMTP — you're not in the Supabase org (step 8) |
| `email rate limit exceeded` | The 2/hour built-in cap (step 8) |
| Signed in, but every screen errors | Schema never ran (step 5) |

Vercel's **Deployments → your deployment → Runtime Logs** shows server
errors. The build log shows anything that failed at build time.
