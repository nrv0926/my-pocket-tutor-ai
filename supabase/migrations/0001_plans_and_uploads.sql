-- ---------------------------------------------------------------------
-- 0001 · learning_plans + the uploads bucket
--
-- Run this once against an existing project, in the Supabase SQL editor.
-- It is idempotent: running it twice is safe and changes nothing the second
-- time. A brand-new project can run supabase/schema.sql + policies.sql
-- instead; this file exists for a database that already has data in it.
--
-- After it runs, two features that are already deployed start working:
--   /plan/[childId]  — the four-week plan
--   /upload          — report card and worksheet analysis
-- ---------------------------------------------------------------------

-- ---------- 1. learning_plans ----------
create table if not exists public.learning_plans (
  id                uuid primary key default uuid_generate_v4(),
  child_id          uuid not null references public.children(id) on delete cascade,
  source_gaps       text[] not null default '{}',
  plan              jsonb not null,
  created_at        timestamptz not null default now()
);

create index if not exists plans_child_created_idx
  on public.learning_plans(child_id, created_at desc);

alter table public.learning_plans enable row level security;

-- Ownership is proved through the child row, exactly as learning_sessions
-- does it. One path to owning anything keeps the policy auditable.
drop policy if exists "plans owner all" on public.learning_plans;

create policy "plans owner all"
  on public.learning_plans for all
  using (
    exists (select 1 from public.children c
            where c.id = learning_plans.child_id
              and c.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.children c
            where c.id = learning_plans.child_id
              and c.user_id = auth.uid())
  );

-- ---------- 2. the uploads bucket ----------
-- Private. Never flip `public` to true: these are children's report cards,
-- and a public bucket makes every object readable by anyone with the URL.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'uploads',
  'uploads',
  false,
  10485760,                                    -- 10 MB, matching lib/uploadRules.ts
  array['image/png','image/jpeg','image/webp','application/pdf','text/plain']
)
on conflict (id) do update
  set public             = false,              -- repair a bucket made public by hand
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ---------- 3. storage policies ----------
-- Every object is written to `<user-id>/<upload-id>-<name>`, so the first
-- path segment is the owner. The app writes with the user-scoped client, so
-- these policies are what actually enforce it — the service-role key is
-- never used on behalf of a signed-in user (CLAUDE.md §3).
drop policy if exists "uploads owner read"   on storage.objects;
drop policy if exists "uploads owner write"  on storage.objects;
drop policy if exists "uploads owner update" on storage.objects;
drop policy if exists "uploads owner delete" on storage.objects;

create policy "uploads owner read"
  on storage.objects for select
  using (
    bucket_id = 'uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "uploads owner write"
  on storage.objects for insert
  with check (
    bucket_id = 'uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "uploads owner update"
  on storage.objects for update
  using (
    bucket_id = 'uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Deletion matters as much as the rest: the app removes the file after
-- analysis, and without this policy the privacy promise silently fails.
create policy "uploads owner delete"
  on storage.objects for delete
  using (
    bucket_id = 'uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
