# Security overview — AI Pocket Tutor

This document describes the security model for the MVP. It is paired with
`PRIVACY.md` (the parent-facing promise) and `CLAUDE.md` §3 (binding rules
for AI contributors).

---

## Threat model in one paragraph

The most sensitive thing this app touches is **information about a real
child**: a report card, a worksheet, a parent's worry. The two failure modes
we care about most are (1) a parent's data being readable by another user and
(2) child PII (full name, school name, student number) leaking into logs,
prompts, or third-party systems. Everything below is designed around those
two failure modes.

## Authentication

- Supabase Auth handles email/password sign-in and session cookies.
- Sessions are HTTP-only, `Secure`, `SameSite=Lax`.
- The app uses `@supabase/ssr` so the server-rendered Next.js routes run with
  the **logged-in user's** Supabase client — not the service role key.

## Authorization — Row-Level Security (RLS)

RLS is enabled on every table. The policies live in
`supabase/policies.sql`. Summary:

| Table              | Read policy                                  | Write policy                                  |
| ------------------ | -------------------------------------------- | --------------------------------------------- |
| `users`            | `auth.uid() = id`                            | `auth.uid() = id`                             |
| `children`         | `auth.uid() = user_id`                       | `auth.uid() = user_id`                        |
| `learning_sessions`| `child.user_id = auth.uid()` via join check  | same                                          |
| `progress_records` | same join check                              | same                                          |
| `uploads`          | same join check                              | same                                          |
| `subscriptions`    | `auth.uid() = user_id`                       | webhook only (service role)                   |

A parent can only ever see their **own** children. A teacher in Phase 4 will
get an explicit link/grant; we will not relax RLS to enable it.

## File uploads

- Bucket name: `${SUPABASE_UPLOADS_BUCKET}` (default `child-uploads`).
- The bucket is **private**. There is no public read path.
- Uploads use a server-issued, **short-lived signed upload URL** so file bytes
  never pass through our app server.
- Server enforces:
  - Max size: `MAX_UPLOAD_MB` (default 10 MB).
  - Allowed MIME types: `image/png`, `image/jpeg`, `image/webp`,
    `application/pdf`, `text/plain`.
  - Filename normalization (strip path traversal characters).
- After analysis, files are deleted from storage unless
  `DELETE_UPLOADS_AFTER_PROCESSING=false` **and** the parent has ticked the
  explicit "save this for me" checkbox at upload time.
- Storage paths include a random UUID — they are not guessable.

## Privacy warning before upload

Every upload page renders this message before any file picker:

> **Before uploading**, remove or cover personal information such as the
> child's full name, school name, address, student number, phone number, or
> any other identifying information. Is this safe to analyze?

The upload button is disabled until the parent confirms. This UX is
implemented in `components/PrivacyWarning.tsx` and is not bypassable via a
setting.

## What we do not store

- Student full name (we store a parent-chosen nickname only).
- School name.
- Student number.
- Home address.
- Phone number.
- Birth date (we store age band / grade only).
- Raw uploaded files past the processing window (unless explicit opt-in).

The `children` table schema does not have columns for the above. They cannot
be stored even by accident through our forms.

## AI provider boundary

- All model calls go through `lib/aiService.ts`. Page code never imports a
  provider SDK directly.
- Prompts include an explicit instruction to **ignore and never repeat**
  personal identifiers.
- We send the **provider** the minimum context needed: the child's
  age/grade/needs/goal, plus the document text or parent's description.
- We set provider flags that disable training on customer data
  (Anthropic + OpenAI both expose this; see `lib/aiService.ts`).
- We do not send the parent's email or auth token to the model.

## Logging

- We log **IDs and event types**, never file contents or prompt bodies.
- Errors are logged with stack traces but with input strings redacted.
- Production logs are short-lived (≤ 30 days).

## Secrets

- Secrets live only in `.env.local` (dev) or the hosting provider's secret
  store (prod). `.env.example` is the only env file in git.
- The Supabase service role key is **only** read inside server actions / API
  routes; it is never imported into client components.

## Dependencies

- `npm audit` is run before each release.
- No `postinstall` scripts from untrusted packages.
- Lockfile-only installs in CI.

## Reporting a vulnerability

Email **security@aipockettutor.app** (placeholder) with a short description
and reproduction steps. Please do not file public issues for security
problems.

## Out of scope for MVP (tracked in roadmap)

- SOC 2 / formal compliance audit.
- Bug bounty.
- WAF / managed rate limiting beyond the platform default.
- Field-level encryption at rest beyond Supabase defaults.
