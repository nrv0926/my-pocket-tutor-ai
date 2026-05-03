import { describe, expect, it } from "vitest";

import { TIERS, dailyLimitForTier, isPremiumTier } from "@/lib/subscriptionTiers";

/**
 * Tier → quota mapping is the single source of truth that every paying
 * dollar depends on. If someone "fixes" the free tier to be unlimited
 * by accident, this test fails loudly.
 */

describe("subscription tier limits", () => {
  it("free tier is the most restrictive", () => {
    const free = dailyLimitForTier("free");
    const premium = dailyLimitForTier("premium");
    const family = dailyLimitForTier("family");
    expect(free).toBeLessThan(premium);
    expect(premium).toBeLessThanOrEqual(family);
  });

  it("free tier allows at most 1 generation per day", () => {
    expect(dailyLimitForTier("free")).toBeLessThanOrEqual(1);
  });

  it("paid tiers allow at least 10 generations per day", () => {
    expect(dailyLimitForTier("premium")).toBeGreaterThanOrEqual(10);
    expect(dailyLimitForTier("family")).toBeGreaterThanOrEqual(10);
  });

  it("isPremiumTier draws the line correctly", () => {
    expect(isPremiumTier("free")).toBe(false);
    expect(isPremiumTier("premium")).toBe(true);
    expect(isPremiumTier("family")).toBe(true);
  });

  it("the canonical TIERS list is exhaustive", () => {
    expect([...TIERS]).toEqual(["free", "premium", "family"]);
  });
});
