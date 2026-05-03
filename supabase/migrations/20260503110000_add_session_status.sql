-- =====================================================================
-- 20260503110000_add_session_status.sql
-- Async generation. Sessions are now created in `pending`, transition
-- to `processing` while the AI call is in flight, and end at `done` or
-- `error`. The `analysis_result` column becomes nullable for pending
-- rows.
--
-- Existing rows are backfilled to `done` because they already have a
-- result by definition.
-- =====================================================================

alter table public.learning_sessions
  add column if not exists status text not null default 'done';

alter table public.learning_sessions
  add column if not exists error_message text;

alter table public.learning_sessions
  alter column analysis_result drop not null;

do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'learning_sessions_status_check'
  ) then
    alter table public.learning_sessions
      add constraint learning_sessions_status_check
      check (status in ('pending','processing','done','error'));
  end if;
end $$;

-- Common dashboard query: list a child's *completed* sessions, newest
-- first. Partial index keeps the size small + serves the query without
-- needing to scan failed/in-flight rows.
create index if not exists sessions_child_done_created_idx
  on public.learning_sessions(child_id, created_at desc)
  where status = 'done';
