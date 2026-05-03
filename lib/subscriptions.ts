import "server-only";

import { isTier, type Tier } from "@/lib/subscriptionTiers";
import { getServerSupabase } from "@/lib/supabaseServer";

/**
 * Server-only tier lookups. Pure helpers (TIERS, dailyLimitForTier,
 * isPremiumTier) live in lib/subscriptionTiers.ts so they can be used
 * from client components + tests without dragging in the database.
 */

export type { Tier } from "@/lib/subscriptionTiers";
export {
  TIERS,
  dailyLimitForTier,
  isPremiumTier,
} from "@/lib/subscriptionTiers";

/**
 * Fetch the signed-in user's tier. Returns 'free' when there is no row,
 * the row's status isn't active, or the call fails — never throws.
 */
export async function getCurrentTier(): Promise<Tier> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase.rpc("user_tier");
  if (error) return "free";
  if (isTier(data)) return data;
  return "free";
}
