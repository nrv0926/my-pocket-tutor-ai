-- =====================================================================
-- AI Pocket Tutor — item_observations constraints + isolation
--
-- Covers what the capture screen writes: that the table refuses rows
-- that would corrupt the evidence, and that one parent cannot reach or
-- forge another parent's observations.
--
-- How to run
-- ----------
-- Apply schema.sql + policies.sql first, then run this file. Everything
-- is wrapped in BEGIN; ... ROLLBACK; so nothing is persisted.
--
-- Note on style: a "must fail" check here sets a flag inside the inner
-- block and asserts it afterwards, rather than raising inside the block
-- it is testing. A handler written `when ... or others` would catch its
-- own failure notice and report a pass, which is a test that cannot fail.
-- =====================================================================

begin;

do $$
declare
  uid_a uuid := '00000000-0000-0000-0000-0000000000aa';
  uid_b uuid := '00000000-0000-0000-0000-0000000000bb';
  child_a   uuid;
  class_a   uuid;
  child_b   uuid;
  sess_a    uuid;
  child_c   uuid;
  sess_c    uuid;
  child_d   uuid;
  sess_d    uuid;
  key_1     uuid := gen_random_uuid();
  key_2     uuid := gen_random_uuid();
  res       jsonb;
  v_closed_check timestamptz;
  ok        boolean;
  n         int;
begin
  insert into auth.users (id, email) values
    (uid_a, 'obs_a@example.invalid'), (uid_b, 'obs_b@example.invalid')
  on conflict (id) do nothing;
  insert into public.users (id, email) values
    (uid_a, 'obs_a@example.invalid'), (uid_b, 'obs_b@example.invalid')
  on conflict (id) do nothing;

  -- ================= user A =================
  perform set_config('request.jwt.claim.sub', uid_a::text, true);
  set local role authenticated;

  insert into public.children (user_id, nickname, grade, kind)
    values (uid_a, 'Alice', '3', 'student') returning id into child_a;
  insert into public.children (user_id, nickname, grade, kind)
    values (uid_a, 'Room 12', '3', 'class') returning id into class_a;
  insert into public.learning_sessions (child_id, input_type, subject, analysis_result)
    values (child_a, 'plan', 'mathematics', '{}'::jsonb) returning id into sess_a;

  -- ---- happy path ----
  insert into public.item_observations
    (child_id, session_id, item_id, topic_id, mode_of_support, status, score, max_points)
  values (child_a, sess_a, 'q1', 'regrouping', 'independent', 'scored', 1, 1);
  raise notice 'ok: a scored independent observation is accepted';

  -- ---- a retry is attempt 2 and does not collide ----
  insert into public.item_observations
    (child_id, session_id, item_id, topic_id, mode_of_support, status, score, max_points, attempt)
  values (child_a, sess_a, 'q1', 'regrouping', 'prompted', 'scored', 1, 1, 2);
  raise notice 'ok: the same item can be retried as attempt 2';

  -- ---- duplicate (session, item, attempt) ----
  ok := false;
  begin
    insert into public.item_observations
      (child_id, session_id, item_id, mode_of_support, status, score, max_points)
    values (child_a, sess_a, 'q1', 'independent', 'scored', 1, 1);
  exception when unique_violation then ok := true;
  end;
  if not ok then raise exception 'FAILED: duplicate (session,item,attempt) was accepted'; end if;
  raise notice 'ok: duplicate (session, item, attempt) is rejected';

  -- ---- scored without a score ----
  ok := false;
  begin
    insert into public.item_observations
      (child_id, session_id, item_id, mode_of_support, status)
    values (child_a, sess_a, 'q2', 'independent', 'scored');
  exception when check_violation then ok := true;
  end;
  if not ok then raise exception 'FAILED: scored-without-score was accepted'; end if;
  raise notice 'ok: status=scored requires score and max_points';

  -- ---- skipped WITH a score ----
  ok := false;
  begin
    insert into public.item_observations
      (child_id, session_id, item_id, mode_of_support, status, score, max_points)
    values (child_a, sess_a, 'q3', 'independent', 'skipped', 0, 1);
  exception when check_violation then ok := true;
  end;
  if not ok then raise exception 'FAILED: skipped-with-score was accepted'; end if;
  raise notice 'ok: a skipped item carries no score';

  -- ---- score greater than max_points ----
  ok := false;
  begin
    insert into public.item_observations
      (child_id, session_id, item_id, mode_of_support, status, score, max_points)
    values (child_a, sess_a, 'q4', 'independent', 'scored', 3, 2);
  exception when check_violation then ok := true;
  end;
  if not ok then raise exception 'FAILED: score > max_points was accepted'; end if;
  raise notice 'ok: score cannot exceed max_points';

  -- ---- max_points of zero ----
  ok := false;
  begin
    insert into public.item_observations
      (child_id, session_id, item_id, mode_of_support, status, score, max_points)
    values (child_a, sess_a, 'q5', 'independent', 'scored', 0, 0);
  exception when check_violation then ok := true;
  end;
  if not ok then raise exception 'FAILED: max_points = 0 was accepted'; end if;
  raise notice 'ok: max_points must be positive';

  -- ---- attempt starts at 1 ----
  ok := false;
  begin
    insert into public.item_observations
      (child_id, session_id, item_id, mode_of_support, status, score, max_points, attempt)
    values (child_a, sess_a, 'q6', 'independent', 'scored', 1, 1, 0);
  exception when check_violation then ok := true;
  end;
  if not ok then raise exception 'FAILED: attempt 0 was accepted'; end if;
  raise notice 'ok: attempt must start at 1';

  -- ---- only the four modes of support ----
  -- 'helped' is the kind of value that reads fine and says nothing: it
  -- cannot answer whether the help supplied the skill being measured,
  -- which is the only thing the mode is for.
  ok := false;
  begin
    insert into public.item_observations
      (child_id, session_id, item_id, mode_of_support, status, score, max_points)
    values (child_a, sess_a, 'q8', 'helped', 'scored', 1, 1);
  exception when check_violation then ok := true;
  end;
  if not ok then raise exception 'FAILED: mode_of_support ''helped'' was accepted'; end if;
  raise notice 'ok: only the four modes of support are allowed';

  -- ---- a class profile has no individual items ----
  ok := false;
  begin
    insert into public.item_observations
      (child_id, session_id, item_id, mode_of_support, status, score, max_points)
    values (class_a, sess_a, 'q1', 'independent', 'scored', 1, 1);
  exception when raise_exception or foreign_key_violation then ok := true;
  end;
  if not ok then raise exception 'FAILED: a class profile accepted an item observation'; end if;
  raise notice 'ok: a class profile is refused';

  -- ================= user B =================
  reset role;
  perform set_config('request.jwt.claim.sub', uid_b::text, true);
  set local role authenticated;

  insert into public.children (user_id, nickname, grade, kind)
    values (uid_b, 'Bob', '5', 'student') returning id into child_b;

  select count(*) into n from public.item_observations where child_id = child_a;
  if n <> 0 then raise exception 'LEAK: user B read % of user A''s observations', n; end if;
  raise notice 'ok: user B cannot SELECT user A''s observations';

  -- B inserting against A's child: the WITH CHECK must refuse it.
  ok := false;
  begin
    insert into public.item_observations
      (child_id, session_id, item_id, mode_of_support, status, score, max_points)
    values (child_a, sess_a, 'q9', 'independent', 'scored', 1, 1);
  exception when insufficient_privilege or check_violation then ok := true;
  end;
  if not ok then raise exception 'LEAK: user B inserted an observation for user A''s child'; end if;
  raise notice 'ok: user B cannot INSERT against user A''s child';

  -- B pairing their OWN child with A's session. RLS allows it (B owns the
  -- child); the composite foreign key is what must stop it.
  --
  -- The item_id must be one user A has NOT used. (session_id, item_id,
  -- attempt) is unique across the whole table, so reusing 'q1' here raises
  -- unique_violation before the foreign key is ever consulted, and the
  -- test would pass for the wrong reason.
  ok := false;
  begin
    insert into public.item_observations
      (child_id, session_id, item_id, mode_of_support, status, score, max_points)
    values (child_b, sess_a, 'q7-unused-by-a', 'independent', 'scored', 1, 1);
  exception when foreign_key_violation then ok := true;
  end;
  if not ok then raise exception 'LEAK: user B attached their child to user A''s session'; end if;
  raise notice 'ok: the composite FK refuses B''s child paired with A''s session';

  update public.item_observations set score = 0 where child_id = child_a;
  if found then raise exception 'LEAK: user B updated user A''s observations'; end if;
  raise notice 'ok: user B cannot UPDATE user A''s observations';

  delete from public.item_observations where child_id = child_a;
  if found then raise exception 'LEAK: user B deleted user A''s observations'; end if;
  raise notice 'ok: user B cannot DELETE user A''s observations';

  -- ================= cascades, back as user A =================
  -- A throwaway child so these deletes cannot disturb the fixtures the
  -- checks above rely on.
  perform set_config('request.jwt.claim.sub', uid_a::text, true);

  insert into public.children (user_id, nickname, grade, kind)
    values (uid_a, 'Cascade case', '3', 'student') returning id into child_c;
  insert into public.learning_sessions (child_id, input_type, subject, analysis_result)
    values (child_c, 'plan', 'mathematics', '{}'::jsonb) returning id into sess_c;
  insert into public.item_observations
    (child_id, session_id, item_id, mode_of_support, status, score, max_points)
  values (child_c, sess_c, 'c1', 'independent', 'scored', 1, 1),
         (child_c, sess_c, 'c2', 'independent', 'scored', 1, 1),
         (child_c, sess_c, 'c3', 'independent', 'scored', 0, 1);

  select count(*) into n from public.item_observations where session_id = sess_c;
  if n <> 3 then raise exception 'SETUP: expected 3 observations to cascade, got %', n; end if;

  delete from public.learning_sessions where id = sess_c;
  select count(*) into n from public.item_observations where session_id = sess_c;
  if n <> 0 then raise exception 'FAILED: % observations outlived their session', n; end if;
  select count(*) into n from public.item_observations where session_id = sess_a;
  if n = 0 then raise exception 'FAILED: deleting one session emptied another'; end if;
  raise notice 'ok: deleting a session removes its observations and no others';

  insert into public.learning_sessions (child_id, input_type, subject, analysis_result)
    values (child_c, 'plan', 'mathematics', '{}'::jsonb) returning id into sess_c;
  insert into public.item_observations
    (child_id, session_id, item_id, mode_of_support, status, score, max_points)
  values (child_c, sess_c, 'c1', 'independent', 'scored', 1, 1);

  select count(*) into n from public.item_observations where child_id = child_c;
  if n <> 1 then raise exception 'SETUP: expected 1 observation under the child, got %', n; end if;

  delete from public.children where id = child_c;
  select count(*) into n from public.item_observations where child_id = child_c;
  if n <> 0 then raise exception 'FAILED: % observations outlived their child', n; end if;
  select count(*) into n from public.learning_sessions where child_id = child_c;
  if n <> 0 then raise exception 'FAILED: % sessions outlived their child', n; end if;
  raise notice 'ok: deleting a child removes its sessions and observations';

  -- ========== 0009: one capture, one transaction, saved once ==========
  -- Still user A here. A fresh child so the counts are unambiguous.
  insert into public.children (user_id, nickname, grade, kind)
    values (uid_a, 'Capture case', '3', 'student') returning id into child_d;
  insert into public.learning_sessions (child_id, input_type, subject, analysis_result)
    values (child_d, 'plan', 'mathematics', '{}'::jsonb) returning id into sess_d;

  res := public.save_capture_rows(
    sess_d, key_1,
    jsonb_build_array(
      jsonb_build_object('item_id','q1','status','scored','score',1,'max_points',1,
                         'mode_of_support','independent','topic_id','regrouping'),
      jsonb_build_object('item_id','q2','status','scored','score',0,'max_points',1,
                         'mode_of_support','independent','topic_id','regrouping'),
      jsonb_build_object('item_id','q3','status','skipped',
                         'mode_of_support','independent','topic_id','regrouping')
    ),
    'independent'
  );
  if (res->>'saved')::int <> 3 or (res->>'attempt')::int <> 1 then
    raise exception 'FAILED: first save reported %', res;
  end if;
  if (res->>'replayed')::boolean then raise exception 'FAILED: first save called itself a replay'; end if;
  raise notice 'ok: a capture writes every item at attempt 1';

  -- Saving is what closes a session.
  select closed_at into v_closed_check from public.learning_sessions where id = sess_d;
  if v_closed_check is null then raise exception 'FAILED: saving did not close the session'; end if;
  raise notice 'ok: saving closes the session';

  -- C-08: the same key again is the same save. No second set of rows.
  res := public.save_capture_rows(
    sess_d, key_1,
    jsonb_build_array(
      jsonb_build_object('item_id','q1','status','scored','score',1,'max_points',1,
                         'mode_of_support','independent')
    ),
    'independent'
  );
  if not (res->>'replayed')::boolean then
    raise exception 'FAILED: a replay was not recognised: %', res;
  end if;
  select count(*) into n from public.item_observations where session_id = sess_d;
  if n <> 3 then raise exception 'FAILED: a replay wrote rows; now % of them', n; end if;
  raise notice 'ok: the same capture_key twice writes nothing the second time';

  -- C-06 still holds: a DELIBERATE recapture is a new key, and attempt 2.
  res := public.save_capture_rows(
    sess_d, key_2,
    jsonb_build_array(
      jsonb_build_object('item_id','q2','status','scored','score',1,'max_points',1,
                         'mode_of_support','independent')
    ),
    'independent'
  );
  if (res->>'attempt')::int <> 2 then
    raise exception 'FAILED: a new capture_key should be attempt 2, got %', res;
  end if;
  select count(*) into n from public.item_observations
   where session_id = sess_d and item_id = 'q2';
  if n <> 2 then raise exception 'FAILED: expected q2 to have 2 attempts, got %', n; end if;
  raise notice 'ok: a new capture_key is a retry, at attempt 2';

  -- A capture with no key is refused: without one there is no way to tell
  -- a resubmit from a retry, which is the whole point.
  ok := false;
  begin
    res := public.save_capture_rows(sess_d, null, jsonb_build_array(
      jsonb_build_object('item_id','q9','status','scored','score',1,'max_points',1,
                         'mode_of_support','independent')), 'independent');
  exception when others then ok := true;
  end;
  if not ok then raise exception 'FAILED: a capture with no key was accepted'; end if;
  raise notice 'ok: a capture with no key is refused';

  -- ================= logged out =================
  -- auth.uid() is null for anon, so every policy's ownership test fails.
  -- Rows must still exist at this point, or a zero count would prove
  -- nothing: it has to be the policy hiding them, not an empty table.
  select count(*) into n from public.item_observations;
  if n = 0 then raise exception 'SETUP: nothing left for anon to be refused'; end if;

  perform set_config('request.jwt.claim.sub', '', true);
  set local role anon;

  -- Either mechanism is a pass: the policy returns no rows, or the role
  -- was never granted SELECT at all.
  ok := false;
  begin
    select count(*) into n from public.item_observations;
    ok := (n = 0);
  exception when insufficient_privilege then ok := true;
  end;
  if not ok then raise exception 'LEAK: a logged-out visitor read observation rows'; end if;
  raise notice 'ok: a logged-out visitor reads no observations';

  ok := false;
  begin
    insert into public.item_observations
      (child_id, session_id, item_id, mode_of_support, status, score, max_points)
    values (child_a, sess_a, 'anon-1', 'independent', 'scored', 1, 1);
  exception when insufficient_privilege or check_violation then ok := true;
  end;
  if not ok then raise exception 'LEAK: a logged-out visitor inserted an observation'; end if;
  raise notice 'ok: a logged-out visitor cannot insert an observation';

  raise notice '==========================================';
  raise notice 'ALL ITEM_OBSERVATIONS CHECKS PASSED';
  raise notice '==========================================';
end $$;

rollback;
