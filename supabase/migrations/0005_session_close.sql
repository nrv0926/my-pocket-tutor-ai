-- ---------------------------------------------------------------------
-- 0005 · closing a session
--
-- Run once, after 0004. Idempotent. Additive: nothing is dropped.
--
-- Adaptation reads closed sessions only. Until now a session had no such
-- state: a row appeared the moment a plan was generated and never changed
-- again, so "a session that has been run" and "a session that exists" were
-- the same thing. They are not. A plan generated and never taught is not
-- evidence of anything.
--
-- A session closes when the adult saves the capture screen.
--
-- The unique (id, child_id) is redundant against the primary key and exists
-- for one reason: item_observations points at BOTH columns at once, so that
-- a row cannot pair one person's child with another person's session. A
-- composite foreign key needs a unique constraint covering exactly those
-- two columns to point at.
-- ---------------------------------------------------------------------

alter table public.learning_sessions
  add column if not exists closed_at timestamptz;

comment on column public.learning_sessions.closed_at is
  'Set when the adult saves the capture screen. Only closed sessions feed '
  'adaptation. Null means generated but not yet taught.';

do $$
begin
  alter table public.learning_sessions
    add constraint learning_sessions_id_child_key unique (id, child_id);
exception
  when duplicate_object then null;
  when duplicate_table  then null;
end $$;
