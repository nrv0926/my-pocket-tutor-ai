import "server-only";

import { getCurrentTier } from "@/lib/subscriptions";
import { dailyLimitForTier, type Tier } from "@/lib/subscriptionTiers";
import { getServerSupabase } from "@/lib/supabaseServer";

/**
 * Daily per-user cap on AI generations. The base limit comes from the
 * user's subscription tier (lib/subscriptions.ts) but can be overridden
 * for testing / staging via AI_DAILY_LIMIT_OVERRIDE.
 */

export class QuotaExceededError extends Error {
  readonly used: number;
  readonly limit: number;
  readonly tier: Tier;
  constructor(used: number, limit: number, tier: Tier) {
    super(
      `You've used today's analyses (${used}/${limit}) on the ${tier} plan. ` +
        (tier === "free"
          ? "Upgrade to Premium for unlimited analyses, or try again tomorrow."
          : "Try again tomorrow — your child's plan will still be here."),
    );
    this.name = "QuotaExceededError";
    this.used = used;
    this.limit = limit;
    this.tier = tier;
  }
}

function envOverride(): number | null {
  const raw = process.env.AI_DAILY_LIMIT_OVERRIDE;
  if (!raw) return null;
  const parsed = parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

/**
 * Atomically check + increment the signed-in user's daily AI counter.
 * Throws QuotaExceededError when the user is at or above the cap.
 *
 * Backed by the consume_ai_quota Postgres function (SECURITY DEFINER) so
 * the table cannot be mutated directly from request handlers — even if
 * RLS were misconfigured, the user has no INSERT / UPDATE grant.
 */
export async function consumeAIQuota(): Promise<{ used: number; limit: number; tier: Tier }> {
  const tier = await getCurrentTier();
  const limit = envOverride() ?? dailyLimitForTier(tier);

  const supabase = getServerSupabase();
  const { data, error } = await supabase.rpc("consume_ai_quota", {
    p_limit: limit,
  });
  if (error) throw new Error(`Quota check failed: ${error.message}`);

  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row.allowed !== "boolean" || typeof row.used !== "number") {
    throw new Error("Quota check returned an unexpected shape.");
  }

  if (!row.allowed) throw new QuotaExceededError(row.used, limit, tier);
  return { used: row.used, limit, tier };
}
