-- =====================================================================
-- 20260503000000_add_session_mode.sql
-- Add the `mode` column to learning_sessions. Each session now belongs
-- to exactly one mode (parent / homeschool / teacher). The mode drives
-- the prompt and the renderer (see CLAUDE.md §7).
-- Existing rows default to 'parent' — that was the only mode before.
-- =====================================================================

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
