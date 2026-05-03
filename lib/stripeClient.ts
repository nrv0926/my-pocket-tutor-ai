import "server-only";

import Stripe from "stripe";

/**
 * Lazy Stripe client. Server-only — never imported into a client
 * component. We don't pin a fixed apiVersion so the SDK uses the
 * account default; that keeps webhook payloads aligned with the
 * dashboard.
 */

let _client: Stripe | null = null;

export function stripe(): Stripe {
  if (_client) return _client;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set.");
  _client = new Stripe(key, {
    typescript: true,
    appInfo: { name: "Pocket Tutor", version: "0.1.0" },
  });
  return _client;
}

/** Maps a Stripe price ID env var name to a tier. */
/**
 * True iff Stripe is configured well enough to start a checkout. Used by
 * the UI to hide / disable upgrade buttons in dev environments where the
 * keys aren't set, instead of letting them throw at submit time.
 */
export function isStripeConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
      process.env.STRIPE_PRICE_PREMIUM &&
      process.env.STRIPE_PRICE_FAMILY,
  );
}

export function tierForPriceId(priceId: string): "premium" | "family" | null {
  if (priceId === process.env.STRIPE_PRICE_PREMIUM) return "premium";
  if (priceId === process.env.STRIPE_PRICE_FAMILY) return "family";
  return null;
}

export function priceIdForTier(tier: "premium" | "family"): string | null {
  if (tier === "premium") return process.env.STRIPE_PRICE_PREMIUM ?? null;
  if (tier === "family") return process.env.STRIPE_PRICE_FAMILY ?? null;
  return null;
}
