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
  grade           text not null,                 -- 'K','1','2','3','4','5','6'
  location        text not null default 'ON-CA', -- e.g. 'ON-CA' (Ontario, Canada)
  curriculum      text not null default 'ontario',
  learning_needs  text[] not null default '{}',  -- e.g. {'adhd','dyslexia','anxiety'}
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
  mode              text not null default 'parent'
                     check (mode in ('parent','homeschool','teacher')),
  input_type        text not null,         -- 'paste' | 'upload' | 'description' | 'plan'
  subject           text not null,         -- 'language' | 'reading' | 'writing' | 'math'
  raw_input         text,                  -- adult's text input (no PII please)
  upload_id         uuid references public.uploads(id) on delete set null,
  analysis_result   jsonb not null,        -- shape varies by mode (see CLAUDE.md §7)
  top_skill_gaps    text[] not null default '{}',
  worksheet         jsonb,                 -- representative worksheet (parent: the worksheet; others: first of set)
  answer_key        jsonb,
  difficulty        text check (difficulty in ('easy','medium','hard')),
  created_at        timestamptz not null default now()
);
create index if not exists sessions_child_id_idx on public.learning_sessions(child_id);
-- Dashboard query: ORDER BY created_at DESC LIMIT 8 per child / overall.
-- The composite index lets Postgres serve this without a sort.
create index if not exists sessions_child_created_idx
  on public.learning_sessions(child_id, created_at desc);

-- Idempotent migration for an already-deployed table missing `mode`.
alter table public.learning_sessions
  add column if not exists mode text not null default 'parent';
do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'learning_sessions_mode_check'
  ) then
    alter table public.learning_sessions
      add constraint learning_sessions_mode_check
      check (mode in ('parent','homeschool','teacher'));
  end if;
end $$;

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
  completed_independently     boolean,
  notes                       text,
  created_at                  timestamptz not null default now()
);
create index if not exists progress_child_id_idx on public.progress_records(child_id);
create index if not exists progress_skill_idx    on public.progress_records(skill);

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
