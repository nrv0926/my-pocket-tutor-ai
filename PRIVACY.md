# Privacy — the parent-facing promise

This is the version we will paraphrase on the website. The technical controls
that back it up are in `SECURITY.md`.

---

## In one paragraph

We built AI Pocket Tutor for our own kids first. We hold your child's
information like we'd want someone to hold ours: as little as possible, only
as long as necessary, never sold, never used to train a model.

## What we ask for

To make a useful plan, we ask for:

- A **nickname** for your child (not their full name).
- Their **age** and **grade**.
- Your **location** (province / state) so we use the right curriculum.
- The **main concern**, **strengths**, **weaknesses**, **learning needs**, and
  **goal** you'd like us to focus on.

To analyze a piece of school work, we ask for either:

- A **paste-in** of the relevant text (the report card sentence, the
  worksheet question), or
- An **upload** of a worksheet, photo, or PDF.

Before any upload, we show this reminder:

> **Before uploading**, remove or cover personal information such as the
> child's full name, school name, address, student number, phone number, or
> any other identifying information. Is this safe to analyze?

## What we deliberately do not collect

- Your child's full name.
- The school's name.
- Your address or phone number.
- A student number.
- Your child's birth date.

There is nowhere in our database that could even hold these — the columns
don't exist.

## What happens to an uploaded file

1. The file is uploaded directly to a private storage bucket (it does not sit
   on our servers).
2. The AI service reads the file once to produce the analysis.
3. The file is **deleted from storage** when the analysis is finished.
4. The only thing we keep is the analysis itself, attached to your child's
   profile, so you can come back to it later.

You can choose to keep a file by ticking the "save this for me" box at upload
time. Even then, only **you** can ever see it (Row-Level Security enforces
this in the database) and you can delete it at any time from Settings.

## How we use AI

- We send the AI the minimum it needs: the child's age, grade, needs, goal,
  and the text or document you shared.
- We do **not** send your email, your account ID, or any other parents'
  data.
- We tell the AI to ignore and never repeat any personal identifier it might
  see anyway.
- We use providers (Anthropic / OpenAI) with a "do not train on customer
  data" setting turned on.

## Who can see your data

- **You.** Always.
- **Us**, only when you ask for support or report a bug, and only with your
  explicit OK.
- **Nobody else.** We do not sell data. We do not run ads. There are no
  third-party trackers in the app.

## Children using the app

The MVP is for **parents and teachers** only. Children do not have logins and
the AI does not chat directly with kids. If we ever change that, we will be
extremely loud about it first and follow COPPA / PIPEDA rules for any
under-13 features.

## Your rights

You can, at any time:

- Edit or delete a child profile.
- Delete an uploaded file.
- Delete a learning session.
- Delete your entire account (this removes children, sessions, files, and
  progress records — gone).
- Email us for a copy of your data.

## Where data lives

- Database and file storage are hosted on Supabase (currently `us-east` for
  the MVP — moving to a Canadian region is on the Phase 2 roadmap).
- Encrypted at rest and in transit by the hosting provider's defaults.

## Changes

If we change anything in this document we will email every account holder
before the change takes effect. The current version of the document lives at
this URL and the changelog at the bottom of the page.

## Contact

privacy@aipockettutor.app *(placeholder)*
