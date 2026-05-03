import Link from "next/link";
import { openBillingPortal, startCheckout } from "@/lib/actions/billing";
import { isStripeConfigured } from "@/lib/stripeClient";
import { getCurrentTier } from "@/lib/subscriptions";
import { getServerSupabase } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

const TIER_LABEL = { free: "Free", premium: "Premium", family: "Family" } as const;

export default async function SettingsPage() {
  const tier = await getCurrentTier();
  const stripeReady = isStripeConfigured();
  const supabase = getServerSupabase();
  const { data } = await supabase
    .from("subscriptions")
    .select("status, stripe_customer_id")
    .maybeSingle();
  const hasStripeCustomer = Boolean(data?.stripe_customer_id);
  const subscriptionStatus = (data?.status as string | undefined) ?? "inactive";

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <header className="mb-6">
        <p className="text-[11px] font-medium uppercase tracking-[0.07em] text-teal-400">
          Settings
        </p>
        <h1 className="mt-2 font-serif text-3xl font-semibold text-forest-600">
          Your account.
        </h1>
      </header>

      <section className="mb-6 rounded-2xl border border-cream-300 bg-white p-5 shadow-card">
        <h2 className="font-serif text-lg font-semibold text-forest-600">Privacy</h2>
        <p className="mt-2 text-sm text-ink-soft">
          We never use your data to train AI models. Uploaded files are deleted
          after analysis unless you opt in below.
        </p>
        <label className="mt-3 flex items-start gap-2 text-sm">
          <input type="checkbox" className="mt-0.5" />
          <span>Keep my uploads in private storage so I can re-open them later.</span>
        </label>
        <p className="mt-3 text-xs">
          <Link href="/PRIVACY.md" className="text-forest-500 underline">
            Read the privacy promise
          </Link>
          {" · "}
          <Link href="/SECURITY.md" className="text-forest-500 underline">
            Security details
          </Link>
        </p>
      </section>

      <section className="mb-6 rounded-2xl border border-cream-300 bg-white p-5 shadow-card">
        <h2 className="font-serif text-lg font-semibold text-forest-600">Children</h2>
        <p className="mt-2 text-sm text-ink-soft">Manage child profiles.</p>
        <Link
          href="/children/new"
          className="mt-3 inline-flex items-center rounded-xl border-[1.5px] border-forest-500 px-4 py-2 text-sm font-medium text-forest-600 hover:bg-forest-50"
        >
          Add a child
        </Link>
      </section>

      <section className="mb-6 rounded-2xl border border-cream-300 bg-white p-5 shadow-card">
        <h2 className="font-serif text-lg font-semibold text-forest-600">
          Subscription
        </h2>
        <p className="mt-2 text-sm text-ink-soft">
          You&rsquo;re on the <strong>{TIER_LABEL[tier]}</strong> plan
          {tier !== "free" ? ` · ${subscriptionStatus}` : ""}.
        </p>

        {!stripeReady ? (
          <p className="mt-3 rounded-xl border border-cream-300 bg-cream-50 p-3 text-xs text-ink-muted">
            Billing isn&rsquo;t configured in this environment. Set
            <code className="mx-1">STRIPE_SECRET_KEY</code> +
            <code className="mx-1">STRIPE_PRICE_PREMIUM</code> +
            <code className="mx-1">STRIPE_PRICE_FAMILY</code> to enable
            checkout.
          </p>
        ) : tier === "free" ? (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <form action={upgradeAction("premium")}>
              <button
                type="submit"
                className="rounded-xl bg-forest-500 px-4 py-2 text-sm font-medium text-white shadow-glow hover:bg-forest-600"
              >
                Upgrade to Premium
              </button>
            </form>
            <form action={upgradeAction("family")}>
              <button
                type="submit"
                className="rounded-xl border-[1.5px] border-forest-500 px-4 py-2 text-sm font-medium text-forest-600 hover:bg-forest-50"
              >
                Upgrade to Family
              </button>
            </form>
            <Link
              href="/pricing"
              className="rounded-xl px-3 py-2 text-sm font-medium text-ink-soft hover:text-forest-600"
            >
              Compare plans
            </Link>
          </div>
        ) : (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {hasStripeCustomer ? (
              <form action={openBillingPortal}>
                <button
                  type="submit"
                  className="rounded-xl bg-forest-500 px-4 py-2 text-sm font-medium text-white shadow-glow hover:bg-forest-600"
                >
                  Manage subscription
                </button>
              </form>
            ) : (
              <Link
                href="/pricing"
                className="rounded-xl bg-forest-500 px-4 py-2 text-sm font-medium text-white shadow-glow hover:bg-forest-600"
              >
                See plans
              </Link>
            )}
          </div>
        )}
      </section>

      <section className="mb-6 rounded-2xl border border-cream-300 bg-white p-5 shadow-card">
        <h2 className="font-serif text-lg font-semibold text-forest-600">Sign out</h2>
        <form action="/auth/signout" method="post" className="mt-3">
          <button
            type="submit"
            className="rounded-xl border border-cream-300 px-4 py-2 text-sm font-medium text-ink hover:bg-cream-50"
          >
            Sign out of this device
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-amber-300 bg-amber-50 p-5">
        <h2 className="font-serif text-lg font-semibold text-forest-600">Delete account</h2>
        <p className="mt-2 text-sm text-ink-soft">
          Removes your children, sessions, files, and progress records. This cannot be undone.
        </p>
        <button
          type="button"
          className="mt-3 rounded-xl border border-amber-400 bg-white px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100"
        >
          Delete my account
        </button>
      </section>
    </div>
  );
}

/**
 * Returns a Server Action bound to the chosen tier. Inline so the
 * `'use server'` directive only applies to this one call site — the
 * surrounding component is a Server Component but not itself an action.
 */
function upgradeAction(tier: "premium" | "family") {
  return async () => {
    "use server";
    await startCheckout(tier);
  };
}
