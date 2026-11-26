-- =====================================================================
-- AI Pocket Tutor — database schema
-- Run this in the Supabase SQL editor (or via supabase migration).
-- Then run policies.sql for Row-Level Security.
-- =====================================================================

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------
-- users  (mirrors auth.users; we only store the bare minimum)
-- ---------------------------------------------------------------------
create table if not exists public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null unique,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- children
-- NOTE: we deliberately store a nickname, never a legal full name.
-- No school_name, no student_number, no address, no phone.
-- ---------------------------------------------------------------------
create table if not exists public.children (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.users(id) on delete cascade,
  nickname        text not null check (char_length(nickname) between 1 and 40),
  age             smallint check (age between 4 and 14),
  grade           text not null,                 -- 'K' through '8'
  -- A row is either one learner or a whole class. Keeping both in this table
  -- means row-level security still proves ownership through user_id, with no
  -- second policy path to get wrong (CLAUDE.md §3). The table name is now a
  -- little wrong; rename it when there is another reason to touch the schema.
  kind            text not null default 'student'
                  check (kind in ('student', 'class')),
  location        text not null default 'ON-CA', -- e.g. 'ON-CA' (Ontario, Canada)
  curriculum      text not null default 'ontario',
  learning_needs  text[] not null default '{}',  -- e.g. {'adhd','dyslexia','anxiety'}
  -- Standing accommodations (0011). What the adult does every session to
  -- make the work fair, so she is not re-tapping it on every question for
  -- the rest of the year. Changes what capture DEFAULTS to and what the
  -- prompt is told; never a label for the child (CLAUDE.md §7).
  accommodations  text[] not null default '{}'
                  check (accommodations <@ array[
                    'read_aloud','timed_never_counts','plain_literal_wording'
                  ]::text[]),
  main_concern    text,
  strengths       text,
  weaknesses      text,
  parent_goal     text,
  created_at      timestamptz not null default now()
);
create index if not exists children_user_id_idx on public.children(user_id);

-- ---------------------------------------------------------------------
-- uploads  (declared before learning_sessions because sessions reference it)
-- ---------------------------------------------------------------------
-- Added 2026-08. Safe to re-run; existing rows become 'student'.
alter table public.children
  add column if not exists kind text not null default 'student';
do $$
begin
  alter table public.children
    add constraint children_kind_check check (kind in ('student', 'class'));
exception
  when duplicate_object then null;
end $$;

create table if not exists public.uploads (
  id                          uuid primary key default uuid_generate_v4(),
  child_id                    uuid not null references public.children(id) on delete cascade,
  file_name                   text not null,                          -- normalized filename, no path
  file_type                   text not null,                          -- mime type
  storage_path                text not null,                          -- bucket-relative path
  processing_status           text not null default 'pending'
                               check (processing_status in ('pending','processing','done','failed')),
  deleted_after_processing    boolean not null default true,
  created_at                  timestamptz not null default now()
);
create index if not exists uploads_child_id_idx on public.uploads(child_id);

-- ---------------------------------------------------------------------
-- learning_sessions
-- ---------------------------------------------------------------------
create table if not exists public.learning_sessions (
  id                uuid primary key default uuid_generate_v4(),
  child_id          uuid not null references public.children(id) on delete cascade,
  input_type        text not null,         -- 'paste' | 'upload' | 'description' | 'plan'
  subject           text not null,         -- see STORED_SUBJECTS in types/child.ts;
                                           -- 'reading'/'writing'/'math' are pre-2026-08 rows
  raw_input         text,                  -- the parent's text (no PII please)
  upload_id         uuid references public.uploads(id) on delete set null,
  analysis_result   jsonb not null,        -- the full 9-section structured output
  top_skill_gaps    text[] not null default '{}',
  worksheet         jsonb,                 -- { questions: [...], difficulty: 'easy'|'medium'|'hard' }
  answer_key        jsonb,
  difficulty        text check (difficulty in ('easy','medium','hard')),
  -- Set when the adult saves the capture screen. Only closed sessions feed
  -- adaptation: a plan generated and never taught is not evidence.
  closed_at         timestamptz,
  -- The adult judged the whole sitting unrepresentative (0010): a meltdown,
  -- illness, a fire alarm. Kept in history, left out of what to teach next.
  -- Separate from closed_at, because a session can be finished AND not fair.
  excluded_from_adaptation boolean not null default false,
  excluded_reason   text,
  -- Pre-0007 question ids, by position, for each of the four places a
  -- question id appears. Present only on rows 0007 rewrote.
  item_ids_before   jsonb,
  created_at        timestamptz not null default now(),

  constraint sessions_excluded_reason_length
    check (excluded_reason is null or char_length(excluded_reason) <= 300),
  -- A reason with no exclusion is a note nobody acts on. An exclusion with
  -- no reason is fine: at 9pm she may not want to type one.
  constraint sessions_excluded_reason_needs_exclusion
    check (excluded_reason is null or excluded_from_adaptation)
);
create index if not exists sessions_child_id_idx on public.learning_sessions(child_id);
create index if not exists sessions_child_counted
  on public.learning_sessions (child_id, closed_at)
  where excluded_from_adaptation = false;

-- Duplicates are deduped by zod on the way in rather than by a constraint
-- here: Postgres forbids a subquery in a CHECK, and the alternatives are a
-- trigger or one array_positions() clause per value -- a clause somebody
-- will forget to add the next time the vocabulary grows. The containment
-- check above is the one that matters, because an unknown value would mean
-- nothing to the capture screen. A repeated value means exactly what one
-- does.

-- Redundant against the primary key, and there for one reason:
-- item_observations points at both columns at once, so a row cannot pair
-- one person's child with another person's session.
do $$
begin
  alter table public.learning_sessions
    add constraint learning_sessions_id_child_key unique (id, child_id);
exception
  when duplicate_object then null;
  when duplicate_table  then null;
end $$;

-- ---------------------------------------------------------------------
-- learning_plans
--   A four-week plan built from a child's recent skill gaps. Separate from
--   learning_sessions because it is a different shape and a different
--   cadence: a session is one sitting, this is the shape of a month.
-- ---------------------------------------------------------------------
create table if not exists public.learning_plans (
  id                uuid primary key default uuid_generate_v4(),
  child_id          uuid not null references public.children(id) on delete cascade,
  source_gaps       text[] not null default '{}',   -- what it was built from
  plan              jsonb not null,                 -- { weeks: [...] }, 4 weeks of 5
  completed         text[] not null default '{}',   -- "1:Mon" keys, sessions done
  created_at        timestamptz not null default now()
);
create index if not exists plans_child_created_idx
  on public.learning_plans(child_id, created_at desc);

-- ---------------------------------------------------------------------
-- progress_records
-- ---------------------------------------------------------------------
create table if not exists public.progress_records (
  id                          uuid primary key default uuid_generate_v4(),
  child_id                    uuid not null references public.children(id) on delete cascade,
  session_id                  uuid references public.learning_sessions(id) on delete set null,
  skill                       text not null,
  status                      text not null check (status in ('practiced','mastered','struggling')),
  difficulty                  text check (difficulty in ('easy','medium','hard')),
  parent_feedback             text check (parent_feedback in ('too_easy','just_right','too_hard')),
  -- DEPRECATED, still dual-written. See mode_of_support below.
  completed_independently     boolean,
  -- How much help was given. 'accommodated' is help that did NOT supply the
  -- skill being measured (reading a maths story aloud), and so counts as
  -- independent for adaptation; reading aloud a word whose decoding is the
  -- thing being tested does supply it, and is 'prompted'.
  mode_of_support             text
    check (mode_of_support in ('independent','prompted','modelled','accommodated')),
  notes                       text,
  created_at                  timestamptz not null default now()
);
create index if not exists progress_child_id_idx on public.progress_records(child_id);
create index if not exists progress_skill_idx    on public.progress_records(skill);

-- ---------------------------------------------------------------------
-- item_observations
--   One row per question, per attempt. progress_records holds one row per
--   SKILL per session, all carrying the same verdict, so it can say "that
--   session went badly" but never "she can multiply by ten and cannot
--   break a number apart". Adaptation needs the second sentence.
--
--   Only attempt 1 is the official result. A row that is not 'scored'
--   carries no score at all, so a skipped question and a wrong answer stay
--   different kinds of evidence.
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
  -- Open responses (0008). A rubric item is not evidence until a person
  -- has confirmed it; the suggestion is kept beside the confirmation so
  -- the two can be compared later.
  rubric_scores            jsonb,
  suggested_score          int,
  confirmed_at             timestamptz,
  -- Which save wrote this row (0009). Rows sharing a key were one tap on
  -- Save, which is how a resubmit is told apart from a deliberate retry.
  capture_key              uuid,
  created_at               timestamptz not null default now(),

  constraint item_obs_rubric_confirmed check (
    rubric_scores is null or status <> 'scored' or confirmed_at is not null
  ),
  constraint item_obs_session_child_fk
    foreign key (session_id, child_id)
    references public.learning_sessions (id, child_id) on delete cascade,
  constraint item_obs_unique_attempt
    unique (session_id, item_id, attempt),
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
-- A replay of the same save cannot write a second row for the same item
-- (0009). Partial, so rows written before capture_key existed are unaffected.
create unique index if not exists item_obs_capture_key_item
  on public.item_observations (session_id, item_id, capture_key)
  where capture_key is not null;

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

-- ---------------------------------------------------------------------
-- save_capture_rows  (0009)
--
-- One capture, one transaction, saved once. Takes rows the application has
-- already validated and resolved, assigns each its attempt number, writes
-- them, closes the session and syncs the per-session summary -- all or
-- nothing. Idempotent per capture_key, so a resubmit is not a retry.
--
-- SECURITY INVOKER on purpose: it runs as the caller, so every statement
-- inside goes through the same row-level security as the direct writes it
-- replaces. A SECURITY DEFINER function here would be a second policy path.
-- ---------------------------------------------------------------------
create or replace function public.save_capture_rows(
  p_session_id  uuid,
  p_capture_key uuid,
  p_rows        jsonb,
  p_mode        text
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_child_id  uuid;
  v_closed_at timestamptz;
  v_existing  int;
  v_attempt   int;
  v_saved     int;
begin
  if p_capture_key is null then
    raise exception 'save_capture_rows needs a capture_key';
  end if;
  if p_rows is null or jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) = 0 then
    raise exception 'save_capture_rows needs at least one row';
  end if;

  -- RLS decides whether this session is the caller's to write to. No rows
  -- visible means not found, exactly as a direct select would behave.
  select child_id, closed_at into v_child_id, v_closed_at
  from public.learning_sessions
  where id = p_session_id;

  if v_child_id is null then
    raise exception 'Session not found' using errcode = 'no_data_found';
  end if;

  -- Already saved under this key: say what happened the first time and
  -- change nothing. This is the double-tap and the resubmit.
  select count(*), coalesce(max(attempt), 0)
    into v_existing, v_attempt
  from public.item_observations
  where session_id = p_session_id and capture_key = p_capture_key;

  if v_existing > 0 then
    return jsonb_build_object(
      'saved', v_existing, 'attempt', v_attempt, 'replayed', true
    );
  end if;

  with incoming as (
    select
      (r->>'item_id')::text                                as item_id,
      (r->>'status')::text                                 as status,
      nullif(r->>'score', '')::int                         as score,
      nullif(r->>'max_points', '')::int                    as max_points,
      (r->>'mode_of_support')::text                        as mode_of_support,
      coalesce((r->>'exclude_from_adaptation')::boolean, false) as excluded,
      nullif(r->>'answer', '')                             as answer,
      nullif(r->>'skill_id', '')                           as skill_id,
      nullif(r->>'topic_id', '')                           as topic_id
    from jsonb_array_elements(p_rows) as r
  )
  insert into public.item_observations (
    child_id, session_id, item_id, skill_id, topic_id, answer,
    mode_of_support, status, score, max_points,
    exclude_from_adaptation, attempt, capture_key
  )
  select
    v_child_id, p_session_id, i.item_id, i.skill_id, i.topic_id, i.answer,
    i.mode_of_support, i.status, i.score, i.max_points,
    i.excluded,
    coalesce(
      (select max(o.attempt)
         from public.item_observations o
        where o.session_id = p_session_id and o.item_id = i.item_id),
      0
    ) + 1,
    p_capture_key
  from incoming i;

  select count(*), coalesce(max(attempt), 0)
    into v_saved, v_attempt
  from public.item_observations
  where session_id = p_session_id and capture_key = p_capture_key;

  -- Saving is what closes a session. Only closed sessions are evidence.
  if v_closed_at is null then
    update public.learning_sessions
       set closed_at = now()
     where id = p_session_id;
  end if;

  -- Keep the per-session summary in step with the per-item truth.
  if p_mode is not null then
    update public.progress_records
       set mode_of_support = p_mode,
           completed_independently = (p_mode = 'independent')
     where session_id = p_session_id;
  end if;

  return jsonb_build_object('saved', v_saved, 'attempt', v_attempt, 'replayed', false);
end;
$$;

comment on function public.save_capture_rows(uuid, uuid, jsonb, text) is
  'Write one capture atomically. Idempotent per capture_key. SECURITY '
  'INVOKER so row-level security still applies to every statement inside.';

grant execute on function public.save_capture_rows(uuid, uuid, jsonb, text) to authenticated;

-- ---------------------------------------------------------------------
-- ai_call_quota  (daily per-user cap on AI generations)
-- One row per (user, day). Mutated only by the consume_ai_quota RPC below.
-- Direct writes are blocked by RLS; the RPC runs SECURITY DEFINER.
-- ---------------------------------------------------------------------
create table if not exists public.ai_call_quota (
  user_id     uuid not null references public.users(id) on delete cascade,
  day         date not null default current_date,
  count       int  not null default 0 check (count >= 0),
  primary key (user_id, day)
);

-- Atomically check + increment the signed-in user's quota for today.
-- Returns one row: (allowed, used). When `allowed = false`, the count
-- is left unchanged so the user is locked out cleanly until tomorrow.
create or replace function public.consume_ai_quota(p_limit int)
returns table (allowed boolean, used int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user  uuid := auth.uid();
  v_count int;
begin
  if v_user is null then
    raise exception 'not authenticated';
  end if;
  if p_limit <= 0 then
    raise exception 'limit must be positive';
  end if;

  insert into public.ai_call_quota (user_id, day, count)
  values (v_user, current_date, 0)
  on conflict (user_id, day) do nothing;

  select count into v_count
  from public.ai_call_quota
  where user_id = v_user and day = current_date
  for update;

  if v_count >= p_limit then
    allowed := false;
    used    := v_count;
    return next;
    return;
  end if;

  update public.ai_call_quota
     set count = count + 1
   where user_id = v_user and day = current_date
   returning true, count into allowed, used;
  return next;
end;
$$;

grant execute on function public.consume_ai_quota(int) to authenticated;

-- ---------------------------------------------------------------------
-- ai_calls  (one row per AI invocation — observability + cost analysis)
-- IMPORTANT: never store the prompt or the response here. Per CLAUDE.md
-- §3, log IDs and counts only. error_class is the SDK class name (e.g.
-- 'RateLimitError'), never the message — that could leak parent input.
-- ---------------------------------------------------------------------
create table if not exists public.ai_calls (
  id                       uuid primary key default uuid_generate_v4(),
  user_id                  uuid not null references public.users(id) on delete cascade,
  child_id                 uuid references public.children(id) on delete set null,
  prompt_version           text not null,
  model                    text not null,
  status                   text not null check (status in ('ok','error','quota_exceeded')),
  error_class              text,
  latency_ms               int  not null check (latency_ms >= 0),
  input_tokens             int,
  output_tokens            int,
  cache_read_tokens        int,
  cache_creation_tokens    int,
  created_at               timestamptz not null default now()
);
create index if not exists ai_calls_user_created_idx
  on public.ai_calls(user_id, created_at desc);

-- ---------------------------------------------------------------------
-- subscriptions  (Stripe placeholder for MVP)
-- ---------------------------------------------------------------------
create table if not exists public.subscriptions (
  id                       uuid primary key default uuid_generate_v4(),
  user_id                  uuid not null unique references public.users(id) on delete cascade,
  plan_name                text not null check (plan_name in ('single_child','family')),
  child_limit              smallint not null,
  stripe_customer_id       text,
  stripe_subscription_id   text,
  status                   text not null default 'inactive'
                            check (status in ('inactive','active','past_due','canceled')),
  created_at               timestamptz not null default now()
);
