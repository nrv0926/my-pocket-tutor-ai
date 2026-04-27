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
  input_type        text not null,         -- 'paste' | 'upload' | 'description' | 'plan'
  subject           text not null,         -- 'language' | 'reading' | 'writing' | 'math'
  raw_input         text,                  -- the parent's text (no PII please)
  upload_id         uuid references public.uploads(id) on delete set null,
  analysis_result   jsonb not null,        -- the full 9-section structured output
  top_skill_gaps    text[] not null default '{}',
  worksheet         jsonb,                 -- { questions: [...], difficulty: 'easy'|'medium'|'hard' }
  answer_key        jsonb,
  difficulty        text check (difficulty in ('easy','medium','hard')),
  created_at        timestamptz not null default now()
);
create index if not exists sessions_child_id_idx on public.learning_sessions(child_id);

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
