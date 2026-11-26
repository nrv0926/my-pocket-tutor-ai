-- ---------------------------------------------------------------------
-- 0008 · rubrics and open responses
--
-- Run once, after 0007. Idempotent. Additive: nothing is dropped.
--
-- Right-or-wrong carries a short written answer badly and a drawing not
-- at all. "Choose two places in your community and explain why each
-- matters" is not one mark; it is two places identified, a reason for
-- each, and whether it hangs together — and a child can earn the places
-- and miss the reasons.
--
-- Three columns, and the middle one is the point:
--
--   rubric_scores   {criterionId: points}, as the adult confirmed them
--   suggested_score what the app proposed before anyone looked
--   confirmed_at    when a person actually decided
--
-- Keeping the suggestion beside the confirmation is what makes the
-- scoring auditable later: if the two diverge often, the suggestion is
-- wrong and we can see it. A suggestion that silently became the record
-- would leave nothing to compare.
--
-- status = 'pending_review' is already legal (0006) and already carries
-- no score, so nothing changes about the existing constraints: an
-- unreviewed rubric item is simply not evidence yet.
-- ---------------------------------------------------------------------

alter table public.item_observations
  add column if not exists rubric_scores   jsonb,
  add column if not exists suggested_score int,
  add column if not exists confirmed_at    timestamptz;

comment on column public.item_observations.rubric_scores is
  'Per-criterion points as confirmed by an adult: {criterionId: points}. '
  'Null for a plain right/wrong item.';
comment on column public.item_observations.suggested_score is
  'What the app proposed before a person looked. Kept beside the '
  'confirmed score so the two can be compared.';
comment on column public.item_observations.confirmed_at is
  'When an adult confirmed an open response. Null while pending_review.';

-- A confirmed open response must have been confirmed by someone.
do $$
begin
  alter table public.item_observations
    add constraint item_obs_rubric_confirmed check (
      rubric_scores is null or status <> 'scored' or confirmed_at is not null
    );
exception
  when duplicate_object then null;
end $$;
