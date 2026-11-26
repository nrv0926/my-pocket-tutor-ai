-- ---------------------------------------------------------------------
-- 0007_down · reverse the stable-id backfill
--
-- Restores the original question ids, by position, in all four places
-- 0007 rewrote them. Run only if 0007 has to be undone; it is not part
-- of the forward sequence.
-- ---------------------------------------------------------------------

do $$
declare r record; qb jsonb; kb jsonb; new_qs jsonb; new_ks jsonb;
begin
  for r in
    select id, analysis_result, worksheet, answer_key, item_ids_before
      from public.learning_sessions
     where item_ids_before is not null
  loop
    qb := r.item_ids_before -> 'questions';
    kb := r.item_ids_before -> 'answerKey';

    new_qs := (
      select jsonb_agg(
               case when qb -> (q.ord - 1)::int is null or qb ->> (q.ord - 1)::int is null
                    then q.value - 'id'
                    else jsonb_set(q.value, '{id}', qb -> (q.ord - 1)::int) end
               order by q.ord)
        from jsonb_array_elements(
               coalesce(r.analysis_result -> 'practiceWorksheet' -> 'questions',
                        r.worksheet -> 'questions')) with ordinality q(value, ord));

    new_ks := case when kb is null then null else (
      select jsonb_agg(jsonb_set(k.value, '{questionId}', coalesce(kb -> (k.ord - 1)::int, k.value -> 'questionId')) order by k.ord)
        from jsonb_array_elements(
               coalesce(r.analysis_result -> 'answerKey', to_jsonb(r.answer_key))) with ordinality k(value, ord)) end;

    update public.learning_sessions s
       set analysis_result = case
             when s.analysis_result -> 'practiceWorksheet' -> 'questions' is not null
             then jsonb_set(
                    case when new_ks is null then s.analysis_result
                         else jsonb_set(s.analysis_result, '{answerKey}', new_ks) end,
                    '{practiceWorksheet,questions}', new_qs)
             else s.analysis_result end,
           worksheet = case when s.worksheet -> 'questions' is not null
                            then jsonb_set(s.worksheet, '{questions}', new_qs) else s.worksheet end,
           answer_key = case when s.answer_key is not null and new_ks is not null
                             then new_ks else s.answer_key end,
           item_ids_before = null
     where s.id = r.id;
  end loop;
end $$;
