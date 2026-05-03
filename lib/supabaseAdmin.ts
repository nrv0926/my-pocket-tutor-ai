import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client. BYPASSES Row-Level Security.
 *
 * Use ONLY for system operations that legitimately need to write rows on
 * behalf of a user without their permission grant — e.g. Stripe webhook
 * → subscriptions, signed upload URL creation, scheduled cleanup.
 *
 * NEVER use this from a request handler that's running on behalf of a
 * logged-in user when the operation is something the user themselves
 * could authorize via RLS. That would defeat the threat model.
 *
 * `import "server-only"` makes Next throw at build time if a client
 * component accidentally pulls this file in.
 */

let _client: SupabaseClient | null = null;

export function getAdminSupabase(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase service-role env vars are not set.");
  }
  _client = createClient(url, key, { auth: { persistSession: false } });
  return _client;
}
