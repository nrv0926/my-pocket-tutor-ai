-- ---------------------------------------------------------------------
-- 0006 · item_observations
--
-- Run once, after 0005. Idempotent. Additive: nothing is dropped.
--
-- One row per question, per attempt. progress_records holds one row per
-- SKILL per session, all carrying the same verdict, so it can say "that
-- session went badly" but never "she can multiply by ten and cannot break
-- a number apart". Adaptation needs the second sentence.
--
-- child_id is carried even though session_id would find the owner, because
-- every table in this app proves ownership by joining through children to
-- auth.uid(), and a second policy path is not worth one saved column.
--
-- Two rules are in the schema rather than in a comment:
--   · only attempt 1 is the official result; retries are history
--   · a row that is not 'scored' carries no score at all, so a skipped
--     question and a wrong answer stay different kinds of evidence
-- ---------------------------------------------------------------------

create table if not exists public.item_observations (
  id                       uuid primary key default uuid_generate_v4(),
  child_id                 uuid not null references public.children(id) on delete cascade,
  session_id               uuid not null,
  item_id                  text not null,          -- server-assigned: q1..qN by position
  skill_id                 text,                   -- null until data/skills.json exists
  topic_id                 text,                   -- the fallback grouping key
  answer                   text,
  mode_of_support          text not null
    check (mode_of_support in ('independent','prompted','modelled','accommodated')),
  status                   text not null
    check (status in ('scored','skipped','pending_review')),
  score                    int,
  max_points               int,
  attempt                  smallint not null default 1 check (attempt >= 1),
  exclude_from_adaptation  boolean not null default false,
  created_at               timestamptz not null default now(),

  -- Both columns at once: a row cannot pair your child with someone
  -- else's session, whatever the application layer believes.
  constraint item_obs_session_child_fk
    foreign key (session_id, child_id)
    references public.learning_sessions (id, child_id) on delete cascade,

  constraint item_obs_unique_attempt
    unique (session_id, item_id, attempt),

  -- scored if and only if there are points to report
  constraint item_obs_scored_iff_points check (
    (status = 'scored') = (score is not null and max_points is not null)
  ),
  constraint item_obs_points_positive check (
    max_points is null or max_points > 0
  ),
  constraint item_obs_score_in_range check (
    score is null or (max_points is not null and score >= 0 and score <= max_points)
  )
);

create index if not exists item_obs_child_skill_idx
  on public.item_observations (child_id, skill_id, created_at desc);
create index if not exists item_obs_child_topic_idx
  on public.item_observations (child_id, topic_id, created_at desc);

-- A class profile has no individual items to observe. The server action
-- checks this too; the trigger is what makes it true regardless.
create or replace function public.item_observations_reject_class()
returns trigger language plpgsql as $$
begin
  if exists (
    select 1 from public.children c
     where c.id = new.child_id and c.kind = 'class'
  ) then
    raise exception
      'item_observations: child_id % is a class profile, which has no individual items to observe',
      new.child_id;
  end if;
  return new;
end $$;

drop trigger if exists item_observations_no_class on public.item_observations;
create trigger item_observations_no_class
  before insert or update on public.item_observations
  for each row execute function public.item_observations_reject_class();

alter table public.item_observations enable row level security;

drop policy if exists "item_obs owner all" on public.item_observations;

create policy "item_obs owner all"
  on public.item_observations for all
  using (
    exists (select 1 from public.children c
            where c.id = item_observations.child_id
              and c.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.children c
            where c.id = item_observations.child_id
              and c.user_id = auth.uid())
  );
