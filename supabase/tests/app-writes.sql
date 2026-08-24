-- =====================================================================
-- AI Pocket Tutor — application write-path tests
--
-- rls.sql proves one parent cannot reach another's rows. This file proves
-- the opposite direction: that the rows the *app actually writes* are
-- accepted by the real schema — every NOT NULL satisfied, every CHECK
-- constraint passed, every enum-ish text value legal — while running as a
-- normal `authenticated` user with RLS switched on.
--
-- The payloads below mirror, field for field:
--   lib/actions/children.ts   -> children insert
--   lib/actions/sessions.ts   -> learning_sessions insert
--   lib/actions/progress.ts   -> progress_records insert
--   lib/quota.ts              -> consume_ai_quota RPC
--   lib/observability.ts      -> ai_calls insert
--
-- How to run
-- ----------
-- Apply schema.sql + policies.sql first, then paste this in and Run.
-- Wrapped in BEGIN; ... ROLLBACK; — nothing is persisted.
-- =====================================================================

begin;

do $$
declare
  uid   uuid := '00000000-0000-0000-0000-0000000000c1';
  cid   uuid;
  sid   uuid;
  n     int;
  q     record;
  ok    int := 0;
begin
  insert into auth.users (id, email) values (uid, 'parent@example.com');
  insert into public.users (id, email) values (uid, 'parent@example.com');

  -- Become a signed-in parent: role + JWT subject, exactly as PostgREST does.
  perform set_config('request.jwt.claim.sub', uid::text, true);
  execute 'set local role authenticated';

  -- ---------------------------------------------------------------
  -- children  (lib/actions/children.ts)
  -- ---------------------------------------------------------------
  insert into public.children (
    user_id, nickname, age, grade, location, curriculum,
    learning_needs, main_concern, strengths, weaknesses, parent_goal
  ) values (
    uid, 'Bean', 8, '3', 'ON-CA', 'ontario',
    array['dyslexia']::text[], 'Reading aloud is slow.',
    'Loves stories.', 'Sounding out new words.', 'Read a chapter book by summer.'
  ) returning id into cid;
  ok := ok + 1;
  raise notice 'ok: children insert accepted';

  -- Every grade the profile form offers must satisfy the schema.
  foreach n in array array[1] loop null; end loop;
  begin
    insert into public.children (user_id, nickname, grade)
      select uid, 'G-' || g, g
      from unnest(array['K','1','2','3','4','5','6']) as g;
    ok := ok + 1;
    raise notice 'ok: all seven K-6 grade values accepted';
  exception when others then
    raise exception 'FAIL: a K-6 grade value was rejected: %', sqlerrm;
  end;

  -- age is CHECK (between 4 and 14) — the form allows 4..14
  begin
    insert into public.children (user_id, nickname, grade, age) values (uid, 'TooYoung', 'K', 3);
    raise exception 'FAIL: age 3 should violate the age check';
  exception
    when check_violation then
      ok := ok + 1;
      raise notice 'ok: age outside 4-14 is rejected by the schema';
  end;

  -- ---------------------------------------------------------------
  -- learning_sessions  (lib/actions/sessions.ts)
  -- Payload shape matches the aiService stub's AnalysisResult.
  -- ---------------------------------------------------------------
  insert into public.learning_sessions (
    child_id, input_type, subject, raw_input,
    analysis_result, top_skill_gaps, worksheet, answer_key, difficulty
  ) values (
    cid, 'paste', 'reading',
    'Reads grade-level text but hesitates on blends.',
    jsonb_build_object(
      'whatINotice', 'text', 'keySkillGaps', jsonb_build_array('a','b'),
      'whatToTeachNext', jsonb_build_array('a','b','c'),
      'howToTeachIt', jsonb_build_array('a'),
      'practiceWorksheet', jsonb_build_object('title','t','difficulty','easy','questions', jsonb_build_array()),
      'answerKey', jsonb_build_array(),
      'parentTips', jsonb_build_array('a','b'),
      'nextStepPlan', 'text',
      'feedbackQuestion', 'Was this too easy, just right, or too hard?'
    ),
    array['reading.blends']::text[],
    jsonb_build_object('difficulty','easy'),
    jsonb_build_array(),
    'easy'
  ) returning id into sid;
  ok := ok + 1;
  raise notice 'ok: learning_sessions insert accepted';

  -- All four input_type values the UI can send.
  begin
    insert into public.learning_sessions (child_id, input_type, subject, analysis_result)
      select cid, t, 'math', '{}'::jsonb
      from unnest(array['paste','upload','description','plan']) as t;
    ok := ok + 1;
    raise notice 'ok: all four input_type values accepted';
  exception when others then
    raise exception 'FAIL: an input_type the UI sends was rejected: %', sqlerrm;
  end;

  -- All four subjects.
  begin
    insert into public.learning_sessions (child_id, input_type, subject, analysis_result)
      select cid, 'paste', s, '{}'::jsonb
      from unnest(array['language','reading','writing','math']) as s;
    ok := ok + 1;
    raise notice 'ok: all four subject values accepted';
  exception when others then
    raise exception 'FAIL: a subject the UI sends was rejected: %', sqlerrm;
  end;

  -- difficulty is CHECK (easy|medium|hard)
  begin
    insert into public.learning_sessions (child_id, input_type, subject, analysis_result, difficulty)
    values (cid, 'paste', 'reading', '{}'::jsonb, 'impossible');
    raise exception 'FAIL: an unknown difficulty should be rejected';
  exception
    when check_violation then
      ok := ok + 1;
      raise notice 'ok: unknown difficulty rejected by the schema';
  end;

  -- ---------------------------------------------------------------
  -- progress_records  (lib/actions/progress.ts saveParentFeedback)
  -- ---------------------------------------------------------------
  insert into public.progress_records (
    child_id, session_id, skill, status, difficulty,
    parent_feedback, completed_independently, notes
  ) values
    (cid, sid, 'reading.blends', 'practiced',  'easy', 'just_right', true,  null),
    (cid, sid, 'reading.blends', 'mastered',   'easy', 'too_easy',   true,  null),
    (cid, sid, 'reading.blends', 'struggling', 'hard', 'too_hard',   false, null);
  ok := ok + 1;
  raise notice 'ok: all three feedback -> status mappings accepted';

  -- ---------------------------------------------------------------
  -- consume_ai_quota RPC  (lib/quota.ts)
  -- ---------------------------------------------------------------
  select * into q from public.consume_ai_quota(3);
  if not q.allowed or q.used <> 1 then
    raise exception 'FAIL: first quota call should be allowed with used=1, got allowed=% used=%', q.allowed, q.used;
  end if;
  ok := ok + 1;
  raise notice 'ok: consume_ai_quota allows the first call (used=1)';

  perform public.consume_ai_quota(3);
  select * into q from public.consume_ai_quota(3);
  if not q.allowed or q.used <> 3 then
    raise exception 'FAIL: third call should be allowed with used=3, got allowed=% used=%', q.allowed, q.used;
  end if;

  select * into q from public.consume_ai_quota(3);
  if q.allowed then
    raise exception 'FAIL: the fourth call must be refused when the limit is 3';
  end if;
  if q.used <> 3 then
    raise exception 'FAIL: a refused call must not increment the counter, got used=%', q.used;
  end if;
  ok := ok + 1;
  raise notice 'ok: consume_ai_quota refuses past the cap and does not over-count';

  -- ---------------------------------------------------------------
  -- ai_calls  (lib/observability.ts) — IDs and counts only, no prompt text
  -- ---------------------------------------------------------------
  insert into public.ai_calls (
    user_id, child_id, prompt_version, model, status, error_class, latency_ms,
    input_tokens, output_tokens, cache_read_tokens, cache_creation_tokens
  ) values (uid, cid, 'analysis@1', 'claude-opus-4-7', 'ok', null, 1234, 10, 20, 0, 0);
  ok := ok + 1;
  raise notice 'ok: ai_calls insert accepted';

  begin
    insert into public.ai_calls (user_id, prompt_version, model, status, latency_ms)
    values (uid, 'analysis@1', 'claude-opus-4-7', 'exploded', 1);
    raise exception 'FAIL: an unknown ai_calls status should be rejected';
  exception
    when check_violation then
      ok := ok + 1;
      raise notice 'ok: unknown ai_calls status rejected by the schema';
  end;

  begin
    insert into public.ai_calls (user_id, prompt_version, model, status, latency_ms)
    values (uid, 'analysis@1', 'claude-opus-4-7', 'ok', -5);
    raise exception 'FAIL: a negative latency should be rejected';
  exception
    when check_violation then
      ok := ok + 1;
      raise notice 'ok: negative latency_ms rejected by the schema';
  end;

  -- ---------------------------------------------------------------
  -- Read-back: the parent can see their own rows through RLS.
  -- ---------------------------------------------------------------
  select count(*) into n from public.children where id = cid;
  if n <> 1 then raise exception 'FAIL: parent cannot read back their own child row'; end if;

  select count(*) into n from public.learning_sessions where id = sid;
  if n <> 1 then raise exception 'FAIL: parent cannot read back their own session'; end if;

  select count(*) into n from public.progress_records where child_id = cid;
  if n <> 3 then raise exception 'FAIL: expected 3 progress rows, got %', n; end if;
  ok := ok + 1;
  raise notice 'ok: parent reads back their own children, sessions and progress';

  raise notice '======================================';
  raise notice 'ALL APP WRITE-PATH CHECKS PASSED (% groups)', ok;
  raise notice '======================================';
end $$;

rollback;
