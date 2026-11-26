-- =====================================================================
-- 0011  Accommodations that stand, instead of being re-tapped weekly
--
-- Scenarios LC-04, LC-08 and LC-10, and the note on LC-04 is the whole
-- argument: "Excluding by hand every week won't last."
--
-- A child who needs every maths question read aloud needs it read aloud
-- next week too. Today the adult taps "Help, but not this skill" on each
-- item, each session, forever, and the first week she forgets, the
-- evidence quietly changes meaning — the same child looks less
-- independent than she is, and the plan steps her down.
--
-- So the accommodation belongs on the profile, not on the tap. Three to
-- begin with, each matching a scenario:
--
--   read_aloud          questions are read to them. Help that does not
--                       supply the skill being measured, so capture
--                       defaults to 'accommodated' rather than 'prompted'
--                       — which is the distinction mode_of_support exists
--                       for, and the reason maths is not dragged down by
--                       a reading difficulty (LC-01).
--   timed_never_counts  a speed round is never evidence for this child.
--                       Capture defaults those items to excluded.
--   plain_literal_wording
--                       no idioms, no figurative framing. A generation
--                       hint, not a scoring rule.
--
-- A set, not a free-text field: each one has to mean something to the
-- capture screen or the prompt, and an unknown value would silently mean
-- nothing at all.
--
-- This is NOT a diagnosis and must never be rendered as one (CLAUDE.md
-- §7). It records what the adult does to make the work fair, which is a
-- fact about the sitting, not a label for the child.
--
-- Additive. Default empty, so nothing changes for an existing profile.
-- =====================================================================

alter table public.children
  add column if not exists accommodations text[] not null default '{}';

alter table public.children
  drop constraint if exists children_accommodations_known;
alter table public.children
  add constraint children_accommodations_known
  check (
    accommodations <@ array[
      'read_aloud',
      'timed_never_counts',
      'plain_literal_wording'
    ]::text[]
  );

-- Duplicates are deduped by zod on the way in, not constrained here:
-- Postgres forbids a subquery in a CHECK, and the alternatives are a trigger
-- or one array_positions() clause per value, which somebody will forget to
-- extend the next time the vocabulary grows. The containment check above is
-- the one that matters -- an unknown value would mean nothing to the capture
-- screen, whereas a repeated value means exactly what one does.

comment on column public.children.accommodations is
  'Standing accommodations the adult applies every session. Changes what '
  'capture defaults to and what the prompt is told, never what the child '
  'is called. Not a diagnosis.';
