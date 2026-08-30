-- ---------------------------------------------------------------------
-- 0002 · expectation_notes
--
-- Run once, after 0001. Idempotent.
--
-- Plain-English explanations of individual curriculum expectations, so a
-- parent can read /curriculum without knowing what "phonological awareness"
-- means. Cached rather than generated on view: that page is public, and an
-- explanation that costs a model call every time a crawler walks past is a
-- bill rather than a feature.
--
-- Readable by anyone, because the page is public and the content is a gloss
-- on a public government document — no user data is involved. Writable only
-- by a signed-in user, which is what keeps the cost bounded.
-- ---------------------------------------------------------------------

create table if not exists public.expectation_notes (
  id           uuid primary key default uuid_generate_v4(),
  subject      text not null,
  grade        text not null,
  program      text,                       -- FSL only; null elsewhere
  code         text not null,              -- Ontario's own code, e.g. "B2.1"
  plain        text not null,
  example      text not null,
  try_at_home  text not null,
  created_by   uuid references public.users(id) on delete set null,
  created_at   timestamptz not null default now()
);

-- One note per expectation. B1.1 at Grade 1 is a different expectation from
-- B1.1 at Grade 3, so the grade is part of the identity — and so is the FSL
-- program, where the same code differs between Core and Immersion.
create unique index if not exists expectation_notes_key
  on public.expectation_notes (subject, grade, coalesce(program, ''), code);

alter table public.expectation_notes enable row level security;

drop policy if exists "notes public read"   on public.expectation_notes;
drop policy if exists "notes signed-in write" on public.expectation_notes;

create policy "notes public read"
  on public.expectation_notes for select
  using (true);

create policy "notes signed-in write"
  on public.expectation_notes for insert
  with check (auth.uid() is not null);
