#!/usr/bin/env bash
# =====================================================================
# Run the SQL test suites against a throwaway local Postgres.
#
# These tests normally need a Supabase project. This script stands up a
# plain Postgres, adds a small shim for the parts of Supabase the SQL
# depends on (the auth schema, auth.uid(), the anon/authenticated roles,
# storage.objects + storage.foldername), then applies the real
# schema.sql / policies.sql / storage.sql unmodified and runs:
#
#   tests/rls.sql         one parent cannot reach another's rows
#   tests/app-writes.sql  the rows the app writes are actually accepted
#
# Requires: postgresql-16 (server + psql). Nothing is left running unless
# you pass --keep.
#
# Usage:  bash supabase/tests/run-local.sh [--keep]
# =====================================================================
set -euo pipefail

PORT="${PGTESTPORT:-55432}"
PGDIR="${PGTESTDIR:-/var/lib/postgresql/pockettutor-test}"
BIN="$(ls -d /usr/lib/postgresql/*/bin | sort -V | tail -1)"
SQL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
KEEP="${1:-}"

cleanup() {
  if [ "$KEEP" != "--keep" ]; then
    su postgres -c "$BIN/pg_ctl -D $PGDIR stop -m immediate" >/dev/null 2>&1 || true
    rm -rf "$PGDIR"
  fi
}
trap cleanup EXIT

echo "==> starting throwaway postgres on port $PORT"
rm -rf "$PGDIR"; mkdir -p "$PGDIR"; chown -R postgres:postgres "$PGDIR"
su postgres -c "$BIN/initdb -D $PGDIR -A trust -U postgres" >/dev/null
su postgres -c "$BIN/pg_ctl -D $PGDIR -o '-p $PORT -k /tmp' -l /tmp/pg-pockettutor.log start" >/dev/null
sleep 2

psql() { command psql -h /tmp -p "$PORT" -U postgres -q -v ON_ERROR_STOP=1 "$@"; }

echo "==> applying supabase shim"
psql <<'SHIM'
create extension if not exists "uuid-ossp";
create schema if not exists auth;
create schema if not exists storage;

create table if not exists auth.users (id uuid primary key, email text);

-- Supabase derives this from the request JWT; PostgREST sets the GUC.
create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;

do $$ begin create role anon nologin;
exception when duplicate_object then null; end $$;
do $$ begin create role authenticated nologin;
exception when duplicate_object then null; end $$;
do $$ begin create role service_role nologin bypassrls;
exception when duplicate_object then null; end $$;

grant usage on schema public, auth, storage to anon, authenticated, service_role;

create table if not exists storage.buckets (
  id text primary key, name text not null, public boolean not null default false);
create table if not exists storage.objects (
  id uuid primary key default uuid_generate_v4(),
  bucket_id text references storage.buckets(id), name text not null, owner uuid);
alter table storage.objects enable row level security;

create or replace function storage.foldername(name text) returns text[]
language sql immutable as $$ select string_to_array(name, '/') $$;
SHIM

echo "==> applying schema.sql, policies.sql, storage.sql"
psql -f "$SQL_DIR/schema.sql"
psql -f "$SQL_DIR/policies.sql"
psql -f "$SQL_DIR/storage.sql"

# Supabase grants these to anon/authenticated by default; RLS is what
# actually restricts rows, so reproduce the grants or every test fails on
# table privileges before a policy is ever consulted.
psql <<'GRANTS'
grant all on all tables    in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all functions in schema public to anon, authenticated, service_role;
grant all on storage.objects, storage.buckets to anon, authenticated, service_role;
grant usage on schema auth to anon, authenticated, service_role;
grant select on auth.users to anon, authenticated, service_role;
GRANTS

fail=0
for t in rls app-writes; do
  echo "==> tests/$t.sql"
  if command psql -h /tmp -p "$PORT" -U postgres -v ON_ERROR_STOP=1 \
       -f "$SQL_DIR/tests/$t.sql" 2>&1 | grep -E 'NOTICE|ERROR' | sed 's/^psql:[^ ]* //'; then :; fi
  if ! command psql -h /tmp -p "$PORT" -U postgres -v ON_ERROR_STOP=1 \
       -f "$SQL_DIR/tests/$t.sql" >/dev/null 2>&1; then
    echo "    FAILED"; fail=1
  fi
done

[ "$fail" -eq 0 ] && echo "==> all SQL suites passed" || { echo "==> SQL suites FAILED"; exit 1; }
