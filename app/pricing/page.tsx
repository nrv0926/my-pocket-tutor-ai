import PricingCards from "@/components/PricingCards";

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
      <header className="mx-auto mb-10 max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-forest-600">
          Pricing
        </p>
        <h1 className="mt-2 font-serif text-4xl text-ink">
          Simple pricing, <em className="text-forest-500">no surprises.</em>
        </h1>
        <p className="mt-3 text-ink-soft">
          Start free. Upgrade when you're ready. Cancel any time. Stripe billing
          wires up in Phase 1.5.
        </p>
      </header>

      <PricingCards />

      <section className="mt-12 rounded-2xl border border-cream-300 bg-white p-6 text-sm text-ink-soft shadow-card">
        <h2 className="font-serif text-lg text-ink">Frequently asked</h2>
        <dl className="mt-4 space-y-4">
          <div>
            <dt className="font-semibold text-ink">Can I switch plans?</dt>
            <dd>Yes. Up- or down-grade at any time; we prorate the change.</dd>
          </div>
          <div>
            <dt className="font-semibold text-ink">What about refunds?</dt>
            <dd>If the first month doesn't help, email us and we'll refund it. No drama.</dd>
          </div>
          <div>
            <dt className="font-semibold text-ink">Do you offer school / district pricing?</dt>
            <dd>Phase 4 (teacher accounts). Email us if you want early access.</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
