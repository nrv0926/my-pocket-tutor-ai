"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { priceIdForTier, stripe } from "@/lib/stripeClient";
import { getAdminSupabase } from "@/lib/supabaseAdmin";
import { getServerSupabase } from "@/lib/supabaseServer";

/**
 * Server actions for the Stripe-hosted checkout + customer-portal flows.
 * Both throw NEXT_REDIRECT to bounce the user to a Stripe URL — callers
 * are expected to be form-action handlers, so the redirect is part of
 * the normal control flow.
 */

const TierSchema = z.enum(["premium", "family"]);

export async function startCheckout(tier: "premium" | "family") {
  const parsed = TierSchema.parse(tier);

  const supabase = getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    // Visitor isn't signed in — bounce them to login and bring them
    // back to /pricing afterwards. The redirect throws NEXT_REDIRECT.
    redirect(`/login?next=${encodeURIComponent("/pricing")}`);
  }

  const priceId = priceIdForTier(parsed);
  if (!priceId) {
    throw new Error(`Stripe price ID not configured for tier "${parsed}".`);
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const customerId = await ensureCustomerId(user.id, user.email ?? undefined);

  const session = await stripe().checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    // Pass the user id back so the webhook can resolve it without an
    // email lookup (emails can change).
    client_reference_id: user.id,
    subscription_data: {
      metadata: { user_id: user.id, tier: parsed },
    },
    success_url: `${baseUrl}/settings?checkout=success`,
    cancel_url: `${baseUrl}/pricing?checkout=canceled`,
    allow_promotion_codes: true,
  });

  if (!session.url) throw new Error("Stripe did not return a checkout URL.");
  redirect(session.url);
}

export async function openBillingPortal() {
  const supabase = getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent("/settings")}`);

  const customerId = await ensureCustomerId(user.id, user.email ?? undefined);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const portal = await stripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: `${baseUrl}/settings`,
  });
  redirect(portal.url);
}

/**
 * Look up (or create) a Stripe customer for this user. The customer ID
 * is stored on the subscriptions row so we don't rely on Stripe email
 * lookups (emails change; user IDs don't).
 */
async function ensureCustomerId(userId: string, email: string | undefined): Promise<string> {
  // RLS-scoped read first — the user is allowed to see their own row.
  const userClient = getServerSupabase();
  const { data: existing } = await userClient
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing?.stripe_customer_id) return existing.stripe_customer_id;

  const customer = await stripe().customers.create({
    email,
    metadata: { user_id: userId },
  });

  // Subscription rows are system-managed (RLS grants users read-only).
  // The upsert below uses the service role client deliberately.
  await getAdminSupabase()
    .from("subscriptions")
    .upsert(
      {
        user_id: userId,
        tier: "free",
        plan_name: "free",
        child_limit: 1,
        stripe_customer_id: customer.id,
        status: "inactive",
      },
      { onConflict: "user_id" },
    );

  return customer.id;
}
