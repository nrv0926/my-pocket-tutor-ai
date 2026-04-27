import "server-only";

import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase admin client backed by the service role key.
 *
 * NEVER import this from a client component or any module that is bundled
 * into the browser. RLS does not apply — this client bypasses row-level
 * security and must only run from server actions, route handlers, or other
 * trusted server code.
 *
 * `import "server-only"` at the top makes Next throw a build-time error if
 * any client component accidentally imports this file.
 */
export function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase service role env vars are not set.");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}
