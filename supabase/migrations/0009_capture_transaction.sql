-- =====================================================================
-- 0009  One capture, one transaction, saved once
--
-- Scenarios C-08 and C-09.
--
-- saveCapture() issued four separate writes: insert the observations,
-- close the session, update progress_records, and nothing tied them
-- together. A connection dropped halfway left some items saved and the
-- session open, which is evidence that says a session happened and never
-- finished. "All rows or none" is what a six-tap screen the adult walks
-- away from needs.
--
-- It was also not idempotent. A resubmit, a restored tab or an impatient
-- second tap wrote a whole second set of rows at attempt 2. Those rows do
-- not change any decision — only attempt 1 counts — but they are a lie in
-- the history: they say the adult reteached and recaptured when she did
-- not. A deliberate retry must still become attempt 2 (C-06), so the two
-- cases have to be told apart rather than merged. A capture_key, made once
-- by the client when the form is filled in, does exactly that: same key is
-- the same save, a new key is a new decision.
--
-- The function is SECURITY INVOKER on purpose. It runs as the caller, so
-- every statement inside it goes through the same row-level security as
-- the direct writes it replaces. A SECURITY DEFINER function here would be
-- a second policy path, which the blueprint rules out.
--
-- Additive. Nothing is dropped. The old write path still works; the column
-- is nullable and every existing row keeps a null key.
-- =====================================================================

alter table public.item_observations
  add column if not exists capture_key uuid;

comment on column public.item_observations.capture_key is
  'Which save wrote this row. Rows sharing a key were one tap on Save. '
  'Null for rows written before 0009.';

-- A replay of the same save cannot write a second row for the same item.
-- Partial, so the pre-0009 rows with a null key are unaffected.
create unique index if not exists item_obs_capture_key_item
  on public.item_observations (session_id, item_id, capture_key)
  where capture_key is not null;

-- ---------------------------------------------------------------------
-- save_capture_rows
--
-- Takes rows the application has already validated and resolved, assigns
-- each one its attempt number, writes them, closes the session and syncs
-- the per-session summary — all in one statement, so all of it happens or
-- none of it does.
--
-- Attempt numbering lives here rather than in the application because it
-- has to be atomic with the insert. Two saves racing would otherwise read
-- the same highest attempt and both claim it; here the worst case is that
-- one of them loses to the unique constraint on
-- (session_id, item_id, attempt) and can be retried.
--
-- p_rows is an array of objects carrying, per item:
--   item_id, status, score, max_points, mode_of_support,
--   exclude_from_adaptation, answer, skill_id, topic_id
-- ---------------------------------------------------------------------
create or replace function public.save_capture_rows(
  p_session_id  uuid,
  p_capture_key uuid,
  p_rows        jsonb,
  p_mode        text
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_child_id  uuid;
  v_closed_at timestamptz;
  v_existing  int;
  v_attempt   int;
  v_saved     int;
begin
  if p_capture_key is null then
    raise exception 'save_capture_rows needs a capture_key';
  end if;
  if p_rows is null or jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) = 0 then
    raise exception 'save_capture_rows needs at least one row';
  end if;

  -- RLS decides whether this session is the caller's to write to. No rows
  -- visible means not found, exactly as a direct select would behave.
  select child_id, closed_at into v_child_id, v_closed_at
  from public.learning_sessions
  where id = p_session_id;

  if v_child_id is null then
    raise exception 'Session not found' using errcode = 'no_data_found';
  end if;

  -- Already saved under this key: say what happened the first time and
  -- change nothing. This is the double-tap and the resubmit.
  select count(*), coalesce(max(attempt), 0)
    into v_existing, v_attempt
  from public.item_observations
  where session_id = p_session_id and capture_key = p_capture_key;

  if v_existing > 0 then
    return jsonb_build_object(
      'saved', v_existing, 'attempt', v_attempt, 'replayed', true
    );
  end if;

  with incoming as (
    select
      (r->>'item_id')::text                                as item_id,
      (r->>'status')::text                                 as status,
      nullif(r->>'score', '')::int                         as score,
      nullif(r->>'max_points', '')::int                    as max_points,
      (r->>'mode_of_support')::text                        as mode_of_support,
      coalesce((r->>'exclude_from_adaptation')::boolean, false) as excluded,
      nullif(r->>'answer', '')                             as answer,
      nullif(r->>'skill_id', '')                           as skill_id,
      nullif(r->>'topic_id', '')                           as topic_id
    from jsonb_array_elements(p_rows) as r
  )
  insert into public.item_observations (
    child_id, session_id, item_id, skill_id, topic_id, answer,
    mode_of_support, status, score, max_points,
    exclude_from_adaptation, attempt, capture_key
  )
  select
    v_child_id, p_session_id, i.item_id, i.skill_id, i.topic_id, i.answer,
    i.mode_of_support, i.status, i.score, i.max_points,
    i.excluded,
    coalesce(
      (select max(o.attempt)
         from public.item_observations o
        where o.session_id = p_session_id and o.item_id = i.item_id),
      0
    ) + 1,
    p_capture_key
  from incoming i;

  select count(*), coalesce(max(attempt), 0)
    into v_saved, v_attempt
  from public.item_observations
  where session_id = p_session_id and capture_key = p_capture_key;

  -- Saving is what closes a session. Only closed sessions are evidence.
  if v_closed_at is null then
    update public.learning_sessions
       set closed_at = now()
     where id = p_session_id;
  end if;

  -- Keep the per-session summary in step with the per-item truth.
  if p_mode is not null then
    update public.progress_records
       set mode_of_support = p_mode,
           completed_independently = (p_mode = 'independent')
     where session_id = p_session_id;
  end if;

  return jsonb_build_object('saved', v_saved, 'attempt', v_attempt, 'replayed', false);
end;
$$;

comment on function public.save_capture_rows(uuid, uuid, jsonb, text) is
  'Write one capture atomically. Idempotent per capture_key. SECURITY '
  'INVOKER so row-level security still applies to every statement inside.';

grant execute on function public.save_capture_rows(uuid, uuid, jsonb, text) to authenticated;
