-- ---------------------------------------------------------------------
-- 0007 · stable worksheet question ids  (REVERSIBLE — see foot of file)
--
-- Run once, after 0006. Idempotent. Additive: nothing is dropped.
--
-- item_observations.item_id points at a question inside a saved session.
-- Until now those ids came from the model: the prompt asks for "q1", "q2",
-- and nothing checked that it obliged. Unvalidated model output is a poor
-- thing for a unique constraint to rest on, so from here the server
-- assigns them by position after parsing (lib/worksheetIds.ts).
--
-- This backfills the same scheme into older rows. Note that a question id
-- appears in FOUR places per session, not one:
--
--   analysis_result -> practiceWorksheet -> questions[].id   (canonical)
--   analysis_result -> answerKey[].questionId                (canonical)
--   worksheet       -> questions[].id                        (copy)
--   answer_key[].questionId                                  (copy)
--
-- app/worksheet/[id]/page.tsx names analysis_result the canonical source
-- and the columns a denormalisation of it. The answer key JOINS on these
-- ids, so rewriting the questions without the keys would silently detach
-- every answer from its question. All four move together or none do.
--
-- worksheetVariants are deliberately untouched: their ids are "L1q1" and
-- friends, they belong to class profiles, and item_observations refuses
-- class profiles outright.
--
-- Only the ORIGINAL IDS are kept for reversal, not whole documents — a
-- copy of every analysis_result would double the table for a one-time fix.
--
-- TO REVERSE:  see supabase/migrations/0007_down.sql
-- ---------------------------------------------------------------------

alter table public.learning_sessions
  add column if not exists item_ids_before jsonb;

comment on column public.learning_sessions.item_ids_before is
  'Pre-0007 question ids, by position, for each of the four places they '
  'appear. Present only on rows 0007 rewrote. Read by nothing but 0007_down.';

do $$
declare
  r            record;
  qs           jsonb;
  ks           jsonb;
  new_qs       jsonb;
  new_ks       jsonb;
  m            jsonb;
  i            int;
  old_id       text;
  touched      int := 0;
  ambiguous    int := 0;
begin
  for r in
    select id, analysis_result, worksheet, answer_key
      from public.learning_sessions
     where item_ids_before is null
  loop
    -- Canonical questions, falling back to the denormalised column.
    qs := coalesce(
            r.analysis_result -> 'practiceWorksheet' -> 'questions',
            r.worksheet -> 'questions');
    if qs is null or jsonb_typeof(qs) <> 'array' or jsonb_array_length(qs) = 0 then
      continue;
    end if;

    -- old id -> new id, first occurrence wins (model ids can repeat)
    m := '{}'::jsonb;
    for i in 0 .. jsonb_array_length(qs) - 1 loop
      old_id := qs -> i ->> 'id';
      if old_id is not null and not (m ? old_id) then
        m := m || jsonb_build_object(old_id, 'q' || (i + 1)::text);
      end if;
    end loop;

    -- rewrite a questions array by position
    new_qs := (select jsonb_agg(jsonb_set(q.value, '{id}', to_jsonb('q' || q.ord::text)) order by q.ord)
                 from jsonb_array_elements(qs) with ordinality q(value, ord));

    -- rewrite an answer key: by old id where we know it, else by position
    ks := coalesce(r.analysis_result -> 'answerKey', to_jsonb(r.answer_key));
    if ks is not null and jsonb_typeof(ks) = 'array' and jsonb_array_length(ks) > 0 then
      new_ks := (
        select jsonb_agg(
                 jsonb_set(k.value, '{questionId}',
                   coalesce(
                     m -> (k.value ->> 'questionId'),
                     case when k.ord <= jsonb_array_length(qs)
                          then to_jsonb('q' || k.ord::text) end,
                     to_jsonb(k.value ->> 'questionId')))
                 order by k.ord)
          from jsonb_array_elements(ks) with ordinality k(value, ord));
      if not (ks @> '[]'::jsonb) then null; end if;
      if jsonb_array_length(ks) <> jsonb_array_length(qs) then
        ambiguous := ambiguous + 1;
      end if;
    else
      new_ks := null;
    end if;

    update public.learning_sessions s
       set item_ids_before = jsonb_build_object(
             'questions',  (select jsonb_agg(q.value ->> 'id' order by q.ord)
                              from jsonb_array_elements(qs) with ordinality q(value, ord)),
             'answerKey',  case when ks is null then null else
                           (select jsonb_agg(k.value ->> 'questionId' order by k.ord)
                              from jsonb_array_elements(ks) with ordinality k(value, ord)) end),
           analysis_result = case
             when s.analysis_result -> 'practiceWorksheet' -> 'questions' is not null
             then jsonb_set(
                    case when new_ks is null then s.analysis_result
                         else jsonb_set(s.analysis_result, '{answerKey}', new_ks) end,
                    '{practiceWorksheet,questions}', new_qs)
             else s.analysis_result end,
           worksheet = case
             when s.worksheet -> 'questions' is not null
             then jsonb_set(s.worksheet, '{questions}', new_qs)
             else s.worksheet end,
           answer_key = case
             when s.answer_key is not null and new_ks is not null
             then new_ks else s.answer_key end
     where s.id = r.id;

    touched := touched + 1;
  end loop;

  raise notice '0007: rewrote ids on % session(s); % had an answer key of a different length',
    touched, ambiguous;
end $$;
