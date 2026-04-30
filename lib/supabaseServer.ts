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
    }
  );
}

/** Returns the authenticated user or null. */
export async function getCurrentUser() {
  const supabase = getServerSupabase();
  const { data } = await supabase.auth.getUser();
  return data.user;
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
