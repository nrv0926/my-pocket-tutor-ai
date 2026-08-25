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
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("supabase_not_configured");
  }
  return createBrowserClient(url, anonKey);
}
