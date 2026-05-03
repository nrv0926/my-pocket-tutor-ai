/**
 * Pure tier helpers. Safe to import from anywhere — including client
 * components and tests. The server-only counterpart (database lookup)
 * lives in lib/subscriptions.ts.
 */

export type Tier = "free" | "premium" | "family";

export const TIERS: readonly Tier[] = ["free", "premium", "family"] as const;

/**
 * Daily AI quota per tier. Free is intentionally tight — the partner
 * model promises "1 analysis per month" on Free, but the underlying
 * counter is daily. Setting Free=1/day means a Free user gets one
 * analysis per *day*, which is more generous than the marketing copy
 * promises. Acceptable for MVP. TODO(billing): switch to a 30-day
 * window for Free if usage shows abuse.
 */
const DAILY_LIMIT_BY_TIER: Record<Tier, number> = {
  free: 1,
  premium: 50,
  family: 100,
};

export function dailyLimitForTier(tier: Tier): number {
  return DAILY_LIMIT_BY_TIER[tier];
}

export function isPremiumTier(tier: Tier): boolean {
  return tier !== "free";
}

export function isTier(value: unknown): value is Tier {
  return typeof value === "string" && (TIERS as readonly string[]).includes(value);
}
