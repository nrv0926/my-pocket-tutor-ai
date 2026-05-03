-- =====================================================================
-- 20260503000001_add_sessions_created_index.sql
-- Composite index for the dashboard's "recent sessions" query, which
-- does ORDER BY created_at DESC LIMIT N per child. Without this, the
-- query scans + sorts; with it, Postgres serves it from the index.
-- =====================================================================

create index if not exists sessions_child_created_idx
  on public.learning_sessions(child_id, created_at desc);
