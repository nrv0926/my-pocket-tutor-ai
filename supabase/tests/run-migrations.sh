#!/usr/bin/env bash
# =====================================================================
# Apply migrations 0004-0007 to a database that already holds data, and
# check the backfills.
#
# run-local.sh proves schema.sql is right for a FRESH database. It says
# nothing about the path an existing project takes, which is the one that
# can lose data. So this stands up the schema as it was BEFORE these
# migrations (read straight out of git), seeds rows of every shape the
# backfills have to handle, applies 0004 through 0007, and asserts.
#
# Requires: postgresql-16, git. Usage: bash supabase/tests/run-migrations.sh
# =====================================================================
set -euo pipefail

PORT="${PGTESTPORT:-55433}"
PGDIR="${PGTESTDIR:-/var/lib/postgresql/pockettutor-mig}"
BIN="$(ls -d /usr/lib/postgresql/*/bin | sort -V | tail -1)"
SQL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO="$(cd "$SQL_DIR/.." && pwd)"
BASE_REF="${BASE_REF:-HEAD}"
TMP="$(mktemp -d)"

cleanup() {
  su postgres -c "$BIN/pg_ctl -D $PGDIR stop -m immediate" >/dev/null 2>&1 || true
  rm -rf "$PGDIR" "$TMP"
}
trap cleanup EXIT

echo "==> starting throwaway postgres on port $PORT"
rm -rf "$PGDIR"; mkdir -p "$PGDIR"; chown -R postgres:postgres "$PGDIR"
su postgres -c "$BIN/initdb -D $PGDIR -A trust -U postgres" >/dev/null
su postgres -c "$BIN/pg_ctl -D $PGDIR -o '-p $PORT -k /tmp' -l /tmp/pg-pockettutor-mig.log start" >/dev/null
sleep 2
psql() { command psql -h /tmp -p "$PORT" -U postgres -q -v ON_ERROR_STOP=1 "$@"; }

echo "==> supabase shim"
psql <<'SHIM'
create extension if not exists "uuid-ossp";
create schema if not exists auth;
create schema if not exists storage;
create table if not exists auth.users (id uuid primary key, email text);
create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
do $$ begin create role anon nologin; exception when duplicate_object then null; end $$;
do $$ begin create role authenticated nologin; exception when duplicate_object then null; end $$;
do $$ begin create role service_role nologin bypassrls; exception when duplicate_object then null; end $$;
grant usage on schema public, auth, storage to anon, authenticated, service_role;
create table if not exists storage.buckets (id text primary key, name text not null, public boolean not null default false);
create table if not exists storage.objects (id uuid primary key default uuid_generate_v4(),
  bucket_id text references storage.buckets(id), name text not null, owner uuid);
alter table storage.objects enable row level security;
create or replace function storage.foldername(name text) returns text[]
language sql immutable as $$ select string_to_array(name, '/') $$;
SHIM

echo "==> schema as of $BASE_REF (pre-migration)"
git -C "$REPO" show "$BASE_REF:supabase/schema.sql"   > "$TMP/schema.sql"
git -C "$REPO" show "$BASE_REF:supabase/policies.sql" > "$TMP/policies.sql"
psql -f "$TMP/schema.sql"
psql -f "$TMP/policies.sql"

echo "==> seeding rows of every shape the backfills must handle"
psql <<'SEED'
insert into auth.users (id, email) values ('00000000-0000-0000-0000-00000000000f','mig@example.invalid');
insert into public.users (id, email) values ('00000000-0000-0000-0000-00000000000f','mig@example.invalid');
insert into public.children (id, user_id, nickname, grade)
  values ('00000000-0000-0000-0000-0000000000c1','00000000-0000-0000-0000-00000000000f','Mig','3');

-- Three sessions: model ids wrong, model ids missing, no worksheet at all.
insert into public.learning_sessions (id, child_id, input_type, subject, analysis_result, worksheet, answer_key) values
 -- duplicate + stray model ids, answer key joins on them, all four places present
 ('00000000-0000-0000-0000-0000000000a1'::uuid,'00000000-0000-0000-0000-0000000000c1','plan','mathematics',
  '{"practiceWorksheet":{"title":"A","difficulty":"easy","questions":[{"id":"zzz","prompt":"one"},{"id":"zzz","prompt":"two"},{"id":"q9","prompt":"three"}]},
    "answerKey":[{"questionId":"zzz","answer":"A1"},{"questionId":"q9","answer":"A3"}]}'::jsonb,
  '{"title":"A","difficulty":"easy","questions":[{"id":"zzz","prompt":"one"},{"id":"zzz","prompt":"two"},{"id":"q9","prompt":"three"}]}'::jsonb,
  '[{"questionId":"zzz","answer":"A1"},{"questionId":"q9","answer":"A3"}]'::jsonb),
 -- a question with no id at all
 ('00000000-0000-0000-0000-0000000000a2'::uuid,'00000000-0000-0000-0000-0000000000c1','plan','language',
  '{"practiceWorksheet":{"title":"B","difficulty":"easy","questions":[{"prompt":"only"}]},"answerKey":[{"questionId":"q1","answer":"B1"}]}'::jsonb,
  '{"title":"B","difficulty":"easy","questions":[{"prompt":"only"}]}'::jsonb,
  null),
 -- no worksheet anywhere
 ('00000000-0000-0000-0000-0000000000a3'::uuid,'00000000-0000-0000-0000-0000000000c1','plan','language','{}'::jsonb,
  null, null);

-- progress_records covering true / false / null
insert into public.progress_records (child_id, skill, status, completed_independently) values
 ('00000000-0000-0000-0000-0000000000c1','a','practiced', true),
 ('00000000-0000-0000-0000-0000000000c1','b','practiced', true),
 ('00000000-0000-0000-0000-0000000000c1','c','practiced', false),
 ('00000000-0000-0000-0000-0000000000c1','d','practiced', null);
SEED

BEFORE_T=$(psql -tAc "select count(*) from public.progress_records where completed_independently is true")
BEFORE_F=$(psql -tAc "select count(*) from public.progress_records where completed_independently is false")
BEFORE_N=$(psql -tAc "select count(*) from public.progress_records where completed_independently is null")
echo "    before: true=$BEFORE_T false=$BEFORE_F null=$BEFORE_N"

echo "==> applying 0004 .. 0007"
for m in 0004_mode_of_support 0005_session_close 0006_item_observations 0007_worksheet_item_ids 0008_rubrics; do
  psql -f "$SQL_DIR/migrations/$m.sql"
  echo "    $m ok"
done

echo "==> applying them a second time (idempotence)"
for m in 0004_mode_of_support 0005_session_close 0006_item_observations 0007_worksheet_item_ids 0008_rubrics; do
  psql -f "$SQL_DIR/migrations/$m.sql"
done
echo "    re-run clean"

echo "==> assertions"
psql <<'CHECK'
do $$
declare n int; j jsonb;
begin
  select count(*) into n from public.progress_records
   where completed_independently is true and mode_of_support = 'independent';
  if n <> 2 then raise exception 'backfill: expected 2 independent, got %', n; end if;
  raise notice 'ok: true  -> independent (% rows)', n;

  select count(*) into n from public.progress_records
   where completed_independently is false and mode_of_support = 'prompted';
  if n <> 1 then raise exception 'backfill: expected 1 prompted, got %', n; end if;
  raise notice 'ok: false -> prompted (% rows)', n;

  select count(*) into n from public.progress_records
   where completed_independently is null and mode_of_support is null;
  if n <> 1 then raise exception 'backfill: expected 1 null, got %', n; end if;
  raise notice 'ok: null  stays null (% rows)', n;

  select count(*) into n from public.progress_records where mode_of_support is not null;
  if n <> 3 then raise exception 'backfill: wrote % rows, expected 3', n; end if;
  raise notice 'ok: no row gained a value it should not have';

  -- all four id locations rewritten by position
  select analysis_result -> 'practiceWorksheet' -> 'questions' into j
    from public.learning_sessions where id = '00000000-0000-0000-0000-0000000000a1';
  if (j -> 0 ->> 'id') <> 'q1' or (j -> 1 ->> 'id') <> 'q2' or (j -> 2 ->> 'id') <> 'q3' then
    raise exception 'canonical questions not rewritten: %', j; end if;
  raise notice 'ok: analysis_result.practiceWorksheet ids -> q1..q3';

  select worksheet -> 'questions' into j from public.learning_sessions
   where id = '00000000-0000-0000-0000-0000000000a1';
  if (j -> 0 ->> 'id') <> 'q1' or (j -> 2 ->> 'id') <> 'q3' then
    raise exception 'worksheet copy not rewritten: %', j; end if;
  raise notice 'ok: the worksheet column copy matches';

  -- the answer key must still JOIN: "zzz" was the id of question 1, "q9" of question 3
  select analysis_result -> 'answerKey' into j from public.learning_sessions
   where id = '00000000-0000-0000-0000-0000000000a1';
  if (j -> 0 ->> 'questionId') <> 'q1' or (j -> 1 ->> 'questionId') <> 'q3' then
    raise exception 'answer key detached from its questions: %', j; end if;
  if (j -> 0 ->> 'answer') <> 'A1' or (j -> 1 ->> 'answer') <> 'A3' then
    raise exception 'answer key content lost: %', j; end if;
  raise notice 'ok: the answer key still points at the right questions';

  select answer_key into j from public.learning_sessions
   where id = '00000000-0000-0000-0000-0000000000a1';
  if (j -> 1 ->> 'questionId') <> 'q3' then
    raise exception 'answer_key column copy not rewritten: %', j; end if;
  raise notice 'ok: the answer_key column copy matches';

  select analysis_result -> 'practiceWorksheet' -> 'questions' into j
    from public.learning_sessions where id = '00000000-0000-0000-0000-0000000000a2';
  if (j -> 0 ->> 'id') <> 'q1' then raise exception 'missing id not filled: %', j; end if;
  raise notice 'ok: a question with no id at all gets one';

  select count(*) into n from public.learning_sessions
   where id = '00000000-0000-0000-0000-0000000000a3' and worksheet is null and item_ids_before is null;
  if n <> 1 then raise exception 'a session with no worksheet should be left alone'; end if;
  raise notice 'ok: a session with no worksheet is untouched';

  select analysis_result -> 'practiceWorksheet' -> 'questions' into j
    from public.learning_sessions where id = '00000000-0000-0000-0000-0000000000a1';
  if (j -> 0 ->> 'prompt') <> 'one' or (j -> 2 ->> 'prompt') <> 'three' then
    raise exception 'the rewrite lost question content: %', j; end if;
  raise notice 'ok: question content survives the rewrite';

  -- 0008: a rubric item is not evidence until a person confirmed it
  begin
    insert into public.item_observations
      (child_id, session_id, item_id, mode_of_support, status, score, max_points,
       rubric_scores)
    values ('00000000-0000-0000-0000-0000000000c1','00000000-0000-0000-0000-0000000000a1',
            'r1','independent','scored',2,3,'{"answer":1,"prove":1,"explain":0}'::jsonb);
    raise exception 'a confirmed rubric score was accepted with no confirmed_at';
  exception when check_violation then
    raise notice 'ok: a scored rubric item must say who confirmed it';
  end;

  insert into public.item_observations
    (child_id, session_id, item_id, mode_of_support, status, rubric_scores)
  values ('00000000-0000-0000-0000-0000000000c1','00000000-0000-0000-0000-0000000000a1',
          'r2','independent','pending_review','{"answer":1}'::jsonb);
  raise notice 'ok: an unreviewed rubric item sits at pending_review with no score';

  insert into public.item_observations
    (child_id, session_id, item_id, mode_of_support, status, score, max_points,
     rubric_scores, suggested_score, confirmed_at)
  values ('00000000-0000-0000-0000-0000000000c1','00000000-0000-0000-0000-0000000000a1',
          'r3','independent','scored',2,3,'{"answer":1,"prove":1,"explain":0}'::jsonb,
          3, now());
  raise notice 'ok: a confirmed rubric item keeps the suggestion beside it';

  raise notice '=========================================';
  raise notice 'MIGRATION 0004-0008 CHECKS PASSED';
  raise notice '=========================================';
end $$;
CHECK
echo "==> reversing with 0007_down.sql"
psql -f "$SQL_DIR/migrations/0007_down.sql"
psql <<'REVCHECK'
do $$
declare j jsonb; n int;
begin
  select analysis_result -> 'practiceWorksheet' -> 'questions' into j
    from public.learning_sessions where id = '00000000-0000-0000-0000-0000000000a1';
  if (j -> 0 ->> 'id') <> 'zzz' or (j -> 1 ->> 'id') <> 'zzz' or (j -> 2 ->> 'id') <> 'q9' then
    raise exception 'down: questions not restored: %', j; end if;

  select analysis_result -> 'answerKey' into j from public.learning_sessions
   where id = '00000000-0000-0000-0000-0000000000a1';
  if (j -> 0 ->> 'questionId') <> 'zzz' or (j -> 1 ->> 'questionId') <> 'q9' then
    raise exception 'down: answer key not restored: %', j; end if;

  select worksheet -> 'questions' into j from public.learning_sessions
   where id = '00000000-0000-0000-0000-0000000000a1';
  if (j -> 0 ->> 'id') <> 'zzz' then raise exception 'down: worksheet copy not restored: %', j; end if;

  -- the question that never had an id must not have gained one
  select analysis_result -> 'practiceWorksheet' -> 'questions' into j
    from public.learning_sessions where id = '00000000-0000-0000-0000-0000000000a2';
  if j -> 0 ? 'id' then raise exception 'down: invented an id that never existed: %', j; end if;

  select count(*) into n from public.learning_sessions where item_ids_before is not null;
  if n <> 0 then raise exception 'down: % rows still flagged', n; end if;

  raise notice 'ok: 0007_down restores all four locations exactly';
  raise notice '=========================================';
  raise notice 'REVERSAL CHECKS PASSED';
  raise notice '=========================================';
end $$;
REVCHECK
echo "==> migration suite passed"
