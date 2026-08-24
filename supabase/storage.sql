-- =====================================================================
-- AI Pocket Tutor — storage bucket + object policies
-- Run AFTER schema.sql and policies.sql.
--
-- This replaces the manual dashboard steps described in the comment
-- block at the end of policies.sql, so the whole database can be
-- bootstrapped from the SQL editor in three pastes.
-- =====================================================================

-- Private bucket. `public = false` is the non-negotiable bit (CLAUDE.md
-- §3): objects are reachable only through short-lived signed URLs.
insert into storage.buckets (id, name, public)
values ('child-uploads', 'child-uploads', false)
on conflict (id) do update set public = false;

-- A signed-in user may only touch objects under their own auth.uid()
-- folder. lib/uploadService.ts writes to `{userId}/{childId}/{uuid}-{name}`,
-- so the first path segment is the owner check.
drop policy if exists "child uploads owner all" on storage.objects;

create policy "child uploads owner all"
  on storage.objects for all
  to authenticated
  using (
    bucket_id = 'child-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'child-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
