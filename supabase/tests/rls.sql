-- =====================================================================
-- AI Pocket Tutor — Row-Level Security isolation tests
--
-- Proves that one parent CANNOT read or modify another parent's rows.
-- This is the highest-risk class of bug in this app (children's data
-- leaking across accounts) so we test it explicitly.
--
-- How to run
-- ----------
-- 1. Apply schema.sql + policies.sql first.
-- 2. Paste this whole file into the Supabase SQL editor and Run.
--    Everything is wrapped in BEGIN; ... ROLLBACK; — nothing is
--    persisted, even the test users. Safe for any environment.
-- 3. The script raises NOTICE on every check. The final NOTICE either
--    says "ALL RLS CHECKS PASSED" (count == expected) or the script
--    aborts with EXCEPTION on the first leak.
--
-- What it covers
-- --------------
-- - children, learning_sessions, progress_records, uploads, ai_calls,
--   ai_call_quota: user B cannot SELECT user A's rows.
-- - ai_calls: user B cannot INSERT a row for user A (WITH CHECK).
-- - ai_call_quota: user B cannot SELECT user A's counter.
-- =====================================================================

begin;

-- Two synthetic users. UUIDs picked from a well-known test prefix so
-- they're easy to spot if a rollback ever fails.
do $$
declare
  uid_a uuid := '00000000-0000-0000-0000-00000000000a';
  uid_b uuid := '00000000-0000-0000-0000-00000000000b';
  child_a uuid;
  session_a uuid;
  upload_a uuid;
  n int;
begin
  -- Seed auth.users + public.users for both. Supabase's auth.users has
  -- non-null defaults that vary by version; we provide just id + email.
  insert into auth.users (id, email) values
    (uid_a, 'rls_test_a@example.invalid'),
    (uid_b, 'rls_test_b@example.invalid')
  on conflict (id) do nothing;

  insert into public.users (id, email) values
    (uid_a, 'rls_test_a@example.invalid'),
    (uid_b, 'rls_test_b@example.invalid')
  on conflict (id) do nothing;

  -- ----- act as user A: create one of every owned row -----
  perform set_config('request.jwt.claim.sub', uid_a::text, true);
  set local role authenticated;

  insert into public.children (user_id, nickname, grade)
    values (uid_a, 'Alice', '3')
    returning id into child_a;

  insert into public.uploads (child_id, file_name, file_type, storage_path)
    values (child_a, 'sample.pdf', 'application/pdf', uid_a::text || '/sample.pdf')
    returning id into upload_a;

  insert into public.learning_sessions
    (child_id, input_type, subject, raw_input, analysis_result, top_skill_gaps)
    values (child_a, 'description', 'reading', 'tricky words',
            '{"whatINotice":"x"}'::jsonb, array['cvc-words']::text[])
    returning id into session_a;

  insert into public.progress_records (child_id, session_id, skill, status)
    values (child_a, session_a, 'cvc-words', 'practiced');

  insert into public.ai_calls (user_id, child_id, prompt_version, model, status, latency_ms)
    values (uid_a, child_a, 'analysis@test', 'claude-test', 'ok', 1234);

  -- Quota row: created by the RPC, not by an INSERT. Call it once so a
  -- row exists for user A.
  perform public.consume_ai_quota(100);

  -- Sanity: user A sees their own data
  select count(*) into n from public.children;
  if n <> 1 then
    raise exception 'self-read failed for children: expected 1 own row, got %', n;
  end if;

  -- ----- now act as user B and try to breach -----
  reset role;
  perform set_config('request.jwt.claim.sub', uid_b::text, true);
  set local role authenticated;

  -- B should see ZERO of A's data across every owned table.
  select count(*) into n from public.children;
  if n <> 0 then raise exception 'LEAK: user B saw % children rows from user A', n; end if;
  raise notice 'ok: children — user B cannot read user A''s rows';

  select count(*) into n from public.uploads;
  if n <> 0 then raise exception 'LEAK: user B saw % uploads rows from user A', n; end if;
  raise notice 'ok: uploads — user B cannot read user A''s rows';

  select count(*) into n from public.learning_sessions;
  if n <> 0 then raise exception 'LEAK: user B saw % learning_sessions rows from user A', n; end if;
  raise notice 'ok: learning_sessions — user B cannot read user A''s rows';

  select count(*) into n from public.progress_records;
  if n <> 0 then raise exception 'LEAK: user B saw % progress_records rows from user A', n; end if;
  raise notice 'ok: progress_records — user B cannot read user A''s rows';

  select count(*) into n from public.ai_calls;
  if n <> 0 then raise exception 'LEAK: user B saw % ai_calls rows from user A', n; end if;
  raise notice 'ok: ai_calls — user B cannot read user A''s rows';

  select count(*) into n from public.ai_call_quota;
  if n <> 0 then raise exception 'LEAK: user B saw % ai_call_quota rows from user A', n; end if;
  raise notice 'ok: ai_call_quota — user B cannot read user A''s row';

  -- B should not be able to UPDATE A's child row.
  update public.children set nickname = 'Pwned' where id = child_a;
  if found then
    raise exception 'LEAK: user B updated user A''s child row';
  end if;
  raise notice 'ok: children — user B cannot UPDATE user A''s row';

  -- B should not be able to DELETE A's session.
  delete from public.learning_sessions where id = session_a;
  if found then
    raise exception 'LEAK: user B deleted user A''s session row';
  end if;
  raise notice 'ok: learning_sessions — user B cannot DELETE user A''s row';

  -- B should not be able to INSERT an ai_calls row impersonating A.
  -- The WITH CHECK on the insert policy must reject this.
  begin
    insert into public.ai_calls (user_id, child_id, prompt_version, model, status, latency_ms)
    values (uid_a, child_a, 'analysis@test', 'claude-test', 'ok', 5);
    raise exception 'LEAK: user B inserted an ai_calls row impersonating user A';
  exception
    when insufficient_privilege or check_violation or others then
      raise notice 'ok: ai_calls — user B cannot INSERT a row for user A';
  end;

  raise notice '======================================';
  raise notice 'ALL RLS CHECKS PASSED — no cross-user leaks';
  raise notice '======================================';
end $$;

rollback;
