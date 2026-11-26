-- ---------------------------------------------------------------------
-- 0004 · mode_of_support
--
-- Run once, after 0003. Idempotent. Additive: nothing is dropped.
--
-- `completed_independently` is a boolean, and a boolean cannot say the one
-- thing that matters most about help: whether it supplied the skill being
-- measured. Reading a word aloud for a child whose decoding is being tested
-- hands them the answer. Reading a maths story aloud to the same child does
-- not — the sum is still theirs. Both are "not independent" to a boolean,
-- and only one of them should keep the result out of the evidence.
--
-- So four values. 'accommodated' is help that did not touch the skill, and
-- it counts as independent when choosing what to teach next.
--
-- `completed_independently` stays and is still written in lock step (see
-- lib/actions/progress.ts). It is deprecated, not gone: four read paths
-- still depend on it, and dropping a column that four pages read is a
-- separate change from adding one.
-- ---------------------------------------------------------------------

alter table public.progress_records
  add column if not exists mode_of_support text
  check (mode_of_support in ('independent','prompted','modelled','accommodated'));

comment on column public.progress_records.completed_independently is
  'DEPRECATED — superseded by mode_of_support. Still dual-written. '
  'independent/accommodated => true, prompted/modelled => false.';

comment on column public.progress_records.mode_of_support is
  'How much help was given. accommodated = help that did not supply the '
  'skill being measured, and so counts as independent for adaptation.';

-- Backfill. false maps to 'prompted' rather than 'modelled' deliberately:
-- we know help was given, not how much, and 'prompted' is the weaker claim.
update public.progress_records
   set mode_of_support = case completed_independently
         when true  then 'independent'
         when false then 'prompted'
       end
 where completed_independently is not null
   and mode_of_support is null;
