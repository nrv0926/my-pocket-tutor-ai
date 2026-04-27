import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client (anon key only). RLS is the source of truth.
 * Use inside `"use client"` components.
 *
 * IMPORTANT: this file must NOT import `next/headers` or anything that
 * transitively does. Doing so breaks any client component that imports it,
 * because Next bundles the whole module into the browser.
 */
export function getBrowserSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
