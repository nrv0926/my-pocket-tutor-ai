import "server-only";

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server-side Supabase client scoped to the LOGGED-IN USER's session cookie.
 *
 * Works in:
 *  - React Server Components (set/remove silently no-op — middleware refreshes)
 *  - Server Actions and Route Handlers (set/remove succeed)
 *
 * Never imports the service role key. RLS enforces per-row access.
 *
 * `import "server-only"` at the top makes Next throw a build-time error if
 * any client component accidentally imports this file.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Supabase is not configured. Copy .env.example to .env.local and set " +
        "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  const cookieStore = cookies();
  return createServerClient(url, anonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // Called from a Server Component — middleware will refresh.
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: "", ...options });
        } catch {
          // Same as above.
        }
      },
    },
  });
}

/**
 * Returns the authenticated user, or null.
 *
 * <Header /> calls this from the root layout, so it runs on every page —
 * including the landing page and the sample plan, which need no account at
 * all. Throwing here would take the whole site down over an unset environment
 * variable, so an unconfigured or unreachable Supabase reads as "signed out".
 */
export async function getCurrentUser() {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = getServerSupabase();
    const { data } = await supabase.auth.getUser();
    return data.user;
  } catch {
    return null;
  }
}

/**
 * Ensures a row exists in public.users for the current auth user.
 * Called after sign-in (auth callback) so subsequent FK inserts don't fail.
 */
export async function ensureUserRow() {
  const supabase = getServerSupabase();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return;
  await supabase
    .from("users")
    .upsert({ id: user.id, email: user.email! }, { onConflict: "id" });
}
