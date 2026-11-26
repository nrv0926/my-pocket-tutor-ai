-- =====================================================================
-- 0010  Exclude a whole session from the decision
--
-- Scenario LC-15. A child had a meltdown mid-session, or was ill, or the
-- fire alarm went. The sitting says nothing about the skill. Today the
-- adult can only tick "doesn't measure this skill" on each question in
-- turn, six times, which is both tedious and the wrong shape: it was not
-- six bad questions, it was one bad day.
--
-- The session stays in history. It is still a thing that happened, and the
-- adult may want to see it later; it simply stops being counted.
--
-- Deliberately not a delete, and deliberately not reusing closed_at: a
-- session can be finished AND not fair, and those are different facts.
--
-- Additive. Default false, so every existing session keeps counting.
-- =====================================================================

alter table public.learning_sessions
  add column if not exists excluded_from_adaptation boolean not null default false;

alter table public.learning_sessions
  add column if not exists excluded_reason text;

alter table public.learning_sessions
  drop constraint if exists sessions_excluded_reason_length;
alter table public.learning_sessions
  add constraint sessions_excluded_reason_length
  check (excluded_reason is null or char_length(excluded_reason) <= 300);

-- A reason without the exclusion is a note nobody acts on; an exclusion is
-- allowed without a reason, because at 9pm she may not want to type one.
alter table public.learning_sessions
  drop constraint if exists sessions_excluded_reason_needs_exclusion;
alter table public.learning_sessions
  add constraint sessions_excluded_reason_needs_exclusion
  check (excluded_reason is null or excluded_from_adaptation);

comment on column public.learning_sessions.excluded_from_adaptation is
  'The adult judged this whole sitting unrepresentative. Kept in history, '
  'left out of what to teach next. Per-question exclusion is '
  'item_observations.exclude_from_adaptation; this is the whole session.';

create index if not exists sessions_child_counted
  on public.learning_sessions (child_id, closed_at)
  where excluded_from_adaptation = false;
