# Database migrations

The source of truth for the database schema is the
[`migrations/`](./migrations) directory. Each file is a forward-only
migration named `<UTC timestamp>_<short_description>.sql`.

## Workflow

### Apply migrations to a Supabase project

Use the Supabase CLI (recommended):

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

This runs every file in `migrations/` in lexical order and tracks them
in `supabase_migrations.schema_migrations` so reruns are no-ops.

### Without the Supabase CLI

You can also run the migrations directly with `psql`:

```bash
for f in supabase/migrations/*.sql; do
  psql "$DATABASE_URL" -f "$f"
done
```

Every migration in this repo is **idempotent** — `create table if not
exists`, `add column if not exists`, `do $$ begin if not exists … end $$`
guards. Re-running them is safe.

## Adding a new migration

1. Create a new file:
   `supabase/migrations/<UTC-timestamp>_<short_description>.sql`.
   Format the timestamp as `YYYYMMDDHHMMSS`.
2. Make the migration **forward-only and idempotent**. We do not write
   `down` migrations — roll forward with a new file instead.
3. Never edit a migration that has already been deployed. Edit history is
   the migration list itself.
4. If the change touches RLS, write the policy in the same file as the
   table change so a fresh deploy stays consistent.
5. Update `SECURITY.md` if the change touches the threat model or PII
   storage.

## Storage buckets

The private `child-uploads` bucket is created in the Supabase dashboard,
not in a migration — bucket policies are managed there. See SECURITY.md.
