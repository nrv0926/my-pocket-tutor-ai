-- =====================================================================
-- 20260503100000_add_subscription_tiers.sql
-- Subscription tier model: free / premium / family.
-- Drives the daily AI quota and which features are unlocked.
--
-- - Adds a `tier` column (back-fills from the legacy plan_name).
-- - Adds a public.user_tier() helper that any RLS-aware caller can read.
--   Returns 'free' if the user has no row or their subscription isn't
--   active, so quota logic doesn't have to special-case nulls.
-- - Updates the plan_name check to include 'free' so we can record a
--   row for free-tier users (created on first checkout-portal visit or
--   on first webhook event).
-- =====================================================================

alter table public.subscriptions
  drop constraint if exists subscriptions_plan_name_check;

alter table public.subscriptions
  add column if not exists tier text;

update public.subscriptions
   set tier = case
     when plan_name = 'family'        then 'family'
     when plan_name = 'single_child'  then 'premium'
     else 'free'
   end
 where tier is null;

alter table public.subscriptions
  alter column tier set default 'free';

alter table public.subscriptions
  alter column tier set not null;

do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'subscriptions_tier_check'
  ) then
    alter table public.subscriptions
      add constraint subscriptions_tier_check
      check (tier in ('free','premium','family'));
  end if;
end $$;

-- The plan_name check now also allows 'free', so first-visit users can
-- have a row before they ever pick a paid plan.
do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'subscriptions_plan_name_check2'
  ) then
    alter table public.subscriptions
      add constraint subscriptions_plan_name_check2
      check (plan_name in ('free','single_child','premium','family'));
  end if;
end $$;

create index if not exists subscriptions_user_id_idx
  on public.subscriptions(user_id);

create or replace function public.user_tier()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select tier from public.subscriptions
      where user_id = auth.uid()
        and status = 'active'
      limit 1),
    'free'
  )
$$;

grant execute on function public.user_tier() to authenticated;
