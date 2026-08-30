-- ---------------------------------------------------------------------
-- 0003 · plan progress
--
-- Run once, after 0002. Idempotent.
--
-- Which sessions of a four-week plan have actually been done. Kept on the
-- plan row rather than in a table of its own: it is a small set of keys
-- ("1:Mon"), it is only ever read with the plan, and the plan's existing
-- row-level security policy already proves who owns it — a second table
-- would mean a second ownership path for no gain.
-- ---------------------------------------------------------------------

alter table public.learning_plans
  add column if not exists completed text[] not null default '{}';
