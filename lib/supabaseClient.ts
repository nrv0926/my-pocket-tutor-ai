import { createBrowserClient, createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Browser-side Supabase client.
 * Uses the public anon key only. RLS is the source of truth.
 */
export function getBrowserSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/**
 * Server-side Supabase client scoped to the LOGGED-IN USER.
 * Use this in server components, server actions, and API routes that act on
 * behalf of a real parent. RLS will enforce per-row access.
 *
 * NEVER use the service role key here — see lib/uploadService.ts for the
 * narrow paths where the admin client is justified.
 */
export function getServerSupabase() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set() {
          // Set in route handlers / server actions; no-op in RSC reads.
        },
        remove() {
          // Same.
        },
      },
    }
  );
}
