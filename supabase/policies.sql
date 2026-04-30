-- =====================================================================
-- AI Pocket Tutor — Row-Level Security policies
-- A parent can only ever read or write rows that belong to their auth.uid().
-- Run AFTER schema.sql.
-- =====================================================================

alter table public.users               enable row level security;
alter table public.children            enable row level security;
alter table public.learning_sessions   enable row level security;
alter table public.progress_records    enable row level security;
alter table public.uploads             enable row level security;
alter table public.subscriptions       enable row level security;
alter table public.ai_call_quota       enable row level security;
alter table public.ai_calls            enable row level security;

-- --------- users ---------
drop policy if exists "users self read"  on public.users;
drop policy if exists "users self write" on public.users;

create policy "users self read"
  on public.users for select using (auth.uid() = id);

create policy "users self write"
  on public.users for insert with check (auth.uid() = id);

create policy "users self update"
  on public.users for update using (auth.uid() = id) with check (auth.uid() = id);

-- --------- children ---------
drop policy if exists "children owner all" on public.children;

create policy "children owner all"
  on public.children for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- --------- learning_sessions ---------
-- Access is owner-checked via the parent child row.
drop policy if exists "sessions owner all" on public.learning_sessions;

create policy "sessions owner all"
  on public.learning_sessions for all
  using (
    exists (select 1 from public.children c
            where c.id = learning_sessions.child_id
              and c.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.children c
            where c.id = learning_sessions.child_id
              and c.user_id = auth.uid())
  );

-- --------- progress_records ---------
drop policy if exists "progress owner all" on public.progress_records;

create policy "progress owner all"
  on public.progress_records for all
  using (
    exists (select 1 from public.children c
            where c.id = progress_records.child_id
              and c.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.children c
            where c.id = progress_records.child_id
              and c.user_id = auth.uid())
  );

-- --------- uploads ---------
drop policy if exists "uploads owner all" on public.uploads;

create policy "uploads owner all"
  on public.uploads for all
  using (
    exists (select 1 from public.children c
            where c.id = uploads.child_id
              and c.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.children c
            where c.id = uploads.child_id
              and c.user_id = auth.uid())
  );

-- --------- ai_call_quota ---------
-- The user can read their own counter (e.g. for a "you've used X/Y today"
-- UI). All mutations go through the consume_ai_quota RPC, which runs
-- SECURITY DEFINER, so no INSERT / UPDATE / DELETE policies are granted.
drop policy if exists "ai_call_quota self read" on public.ai_call_quota;

create policy "ai_call_quota self read"
  on public.ai_call_quota for select using (auth.uid() = user_id);

-- --------- ai_calls ---------
-- Users can read + insert their own log rows (the WITH CHECK clamps
-- inserts to the signed-in user). No update / delete — the log is
-- append-only by design.
drop policy if exists "ai_calls self read"   on public.ai_calls;
drop policy if exists "ai_calls self insert" on public.ai_calls;

create policy "ai_calls self read"
  on public.ai_calls for select using (auth.uid() = user_id);

create policy "ai_calls self insert"
  on public.ai_calls for insert with check (auth.uid() = user_id);

-- --------- subscriptions ---------
-- Read is owner; writes happen via Stripe webhook (service role only).
drop policy if exists "subs owner read" on public.subscriptions;

create policy "subs owner read"
  on public.subscriptions for select using (auth.uid() = user_id);

-- =====================================================================
-- Storage bucket policy notes
-- ---------------------------------------------------------------------
-- Create the bucket as PRIVATE in the Supabase dashboard:
--   name: child-uploads
--   public: false
--
-- Then add a storage policy so a logged-in user can read/write objects
-- only inside a folder named after their auth.uid():
--
--   bucket_id = 'child-uploads'
--   AND (storage.foldername(name))[1] = auth.uid()::text
--
-- Server actions issue short-lived signed URLs; nothing in this bucket is
-- ever served publicly. See SECURITY.md.
-- =====================================================================
