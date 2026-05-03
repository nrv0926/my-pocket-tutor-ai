# AI Pocket Tutor

> A calm, parent-friendly web app that turns school materials into a clear plan
> for what to teach next — aligned to the Ontario curriculum and the science
> of reading.

---

## What it does

AI Pocket Tutor lets a **parent or teacher** create a private profile for a
child, share what's going on (a report card comment, a struggling worksheet,
a note from school, or a quick description), and get back:

1. A plain-English summary of what's happening
2. The top 3 skill gaps to focus on
3. Step-by-step teaching instructions
4. A short, age-appropriate practice worksheet
5. A clean answer key
6. A 4-week learning plan
7. Progress tracking with adaptive difficulty

It is **not a chatbot for kids**. It is a quiet co-pilot for the adult who is
already trying their best.

## Who it's for

- Parents of K–6 children in Ontario (default), expanding to other provinces
  and US states later.
- Teachers who want quick, structured small-group plans.
- Tutors who need ready-to-print worksheets aligned to a real curriculum.

## MVP features

- Landing page
- Parent account (Supabase Auth)
- Child profile creation
- Manual learning input form
- Secure file upload (with privacy warning)
- AI analysis result page (fixed 9-section output structure)
- Worksheet generator (printable, with answer key toggle)
- Progress tracking dashboard
- Parent feedback after each worksheet (too easy / just right / too hard)
- Stripe-ready subscription placeholder (Single Child / Family up to 4)

## Tech stack

- **Next.js 14** (App Router) + **React 18** + **TypeScript**
- **Tailwind CSS**
- **Supabase** — Postgres, Auth, Storage, Row-Level Security
- **Claude** (Anthropic) via the official `@anthropic-ai/sdk`. All model
  calls go through `lib/aiService.ts`; default model is `claude-opus-4-7`.
- **Stripe** — placeholder only at MVP

## Project structure

```
.
├── app/                    Next.js App Router pages
├── components/             Reusable UI components
├── lib/                    Services: AI, Supabase, uploads, engines
├── data/                   Curriculum + skill progressions (JSON)
├── prompts/                Versioned AI prompt templates
├── types/                  Shared TS types
├── supabase/               versioned migrations + RLS policies
├── README.md
├── CLAUDE.md               House rules for AI contributors
├── SECURITY.md             Threat model & security controls
├── PRIVACY.md              Data handling & parent-facing promise
├── PRODUCT_ROADMAP.md      Phased plan (Phase 1 → 7)
└── .env.example            Copy to .env.local and fill in
```

## Setup instructions

> Requires Node.js **20+**.

```bash
# 1. Install
npm install

# 2. Configure environment
cp .env.example .env.local
# Then fill in Supabase + AI provider keys.

# 3. Set up the database
# Apply the migrations to your Supabase project:
#   supabase link --project-ref <your-project-ref>
#   supabase db push
# Or run them with psql — see supabase/README.md.

# 4. Run locally
npm run dev
# Open http://localhost:3000
```

## Environment variables

See `.env.example` for the complete list. The minimum to run the UI is:

| Variable                          | Purpose                            |
| --------------------------------- | ---------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`        | Supabase project URL               |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`   | Browser-safe anon key              |
| `SUPABASE_SERVICE_ROLE_KEY`       | Server-only — never expose         |
| `ANTHROPIC_API_KEY`               | Claude API key (omit → stub mode)  |
| `ANTHROPIC_MODEL`                 | Defaults to `claude-opus-4-7`      |

## Database setup

The schema lives in versioned migrations under
`supabase/migrations/`. The init pair creates:

- `users` (mirrors `auth.users`)
- `children`
- `learning_sessions`
- `progress_records`
- `uploads`
- `subscriptions`
- `ai_call_quota` + the `consume_ai_quota` RPC
- `ai_calls` (observability log)

Row-Level Security is enabled in `20260427000001_init_policies.sql`.
**A user can only ever read or write rows that belong to their own
`auth.uid()`.** See `supabase/README.md` for the migration workflow.

## Security notes

- All uploads go to a **private** Supabase Storage bucket; URLs are signed and
  short-lived.
- By default, uploaded files are **deleted after analysis** unless the parent
  explicitly opts in to keep them.
- Personal identifiers (full names, school names, student numbers, addresses,
  phone numbers) are never stored. The privacy warning is shown before every
  upload.
- See `SECURITY.md` and `PRIVACY.md` for the full controls and parent promise.

## Roadmap

See `PRODUCT_ROADMAP.md`. Short version:

1. **Phase 1 — MVP web app** *(current)*
2. Phase 2 — Better curriculum mapping
3. Phase 3 — PDF worksheet export
4. Phase 4 — Teacher accounts
5. Phase 5 — Multi-curriculum (Canada + USA)
6. Phase 6 — Native mobile app
7. Phase 7 — Full adaptive AI tutoring system

## How to run locally

```bash
npm install
cp .env.example .env.local      # fill in keys
npm run dev                      # http://localhost:3000
npm run typecheck                # strict TS check
npm run lint                     # ESLint (next/core-web-vitals)
npm run build && npm start       # production build
```

## License

Proprietary — all rights reserved (until otherwise stated).
