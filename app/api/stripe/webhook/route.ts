import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { stripe, tierForPriceId } from "@/lib/stripeClient";
import { getAdminSupabase } from "@/lib/supabaseAdmin";

/**
 * Stripe webhook handler. Stripe POSTs subscription lifecycle events
 * here; we update public.subscriptions accordingly.
 *
 * Security:
 * - Signature is verified before any side effects.
 * - Body is read raw (not JSON-parsed) so the HMAC stays intact.
 * - Writes use the service role client because subscriptions has
 *   read-only RLS for end users.
 *
 * This route MUST run on the Node runtime (not Edge) — Stripe's SDK uses
 * Node crypto for `constructEvent`. Body parsing is also disabled
 * implicitly by reading request.text() instead of request.json().
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[stripe-webhook] STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "not configured" }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "missing signature" }, { status: 400 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    console.warn("[stripe-webhook] signature verification failed:", message);
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  try {
    await handleEvent(event);
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    console.error(`[stripe-webhook] ${event.type} handler failed:`, message);
    // Return 500 so Stripe retries with backoff.
    return NextResponse.json({ error: "handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id;
      if (!userId) return;
      // The subscription object is created by Stripe inside the session;
      // we'll get the canonical state on the subscription.* events.
      // For now, just stamp the customer + status so the user sees
      // their account update before the subscription event arrives.
      await upsertSubscription({
        userId,
        customerId: typeof session.customer === "string" ? session.customer : null,
        subscriptionId:
          typeof session.subscription === "string" ? session.subscription : null,
        status: "active",
        tier: null, // backfilled by the subscription.* event
      });
      return;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const userId =
        (typeof sub.metadata?.user_id === "string" && sub.metadata.user_id) ||
        (await userIdForCustomer(typeof sub.customer === "string" ? sub.customer : null));
      if (!userId) return;

      const priceId = sub.items?.data?.[0]?.price?.id ?? null;
      const tier = priceId ? tierForPriceId(priceId) : null;

      await upsertSubscription({
        userId,
        customerId: typeof sub.customer === "string" ? sub.customer : null,
        subscriptionId: sub.id,
        status: mapStripeStatus(sub.status),
        tier,
      });
      return;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const userId =
        (typeof sub.metadata?.user_id === "string" && sub.metadata.user_id) ||
        (await userIdForCustomer(typeof sub.customer === "string" ? sub.customer : null));
      if (!userId) return;
      await upsertSubscription({
        userId,
        customerId: typeof sub.customer === "string" ? sub.customer : null,
        subscriptionId: sub.id,
        status: "canceled",
        tier: "free",
      });
      return;
    }
    default:
      // Unhandled event types (invoice.paid, payment_failed, etc.) are
      // intentionally ignored — they don't change tier.
      return;
  }
}

interface SubscriptionUpsert {
  userId: string;
  customerId: string | null;
  subscriptionId: string | null;
  status: "active" | "past_due" | "canceled" | "inactive";
  tier: "premium" | "family" | "free" | null;
}

async function upsertSubscription(input: SubscriptionUpsert): Promise<void> {
  const admin = getAdminSupabase();

  const update: Record<string, unknown> = {
    user_id: input.userId,
    status: input.status,
    stripe_customer_id: input.customerId,
    stripe_subscription_id: input.subscriptionId,
  };
  if (input.tier) {
    update.tier = input.tier;
    update.plan_name = input.tier;
    update.child_limit = input.tier === "family" ? 4 : 1;
  } else {
    // Required NOT NULL columns get safe defaults on first insert.
    update.tier = "free";
    update.plan_name = "free";
    update.child_limit = 1;
  }

  const { error } = await admin
    .from("subscriptions")
    .upsert(update, { onConflict: "user_id" });
  if (error) throw new Error(error.message);
}

async function userIdForCustomer(customerId: string | null): Promise<string | null> {
  if (!customerId) return null;
  const admin = getAdminSupabase();
  const { data } = await admin
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  return data?.user_id ?? null;
}

function mapStripeStatus(status: Stripe.Subscription.Status): "active" | "past_due" | "canceled" | "inactive" {
  switch (status) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
    case "incomplete_expired":
      return "canceled";
    default:
      return "inactive";
  }
}
