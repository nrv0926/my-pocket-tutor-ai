import PricingCards from "@/components/PricingCards";

export default function PricingPage() {
  return (
    <>
      <section className="bg-teal-700 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <header className="mb-10 max-w-2xl">
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-forest-400">
              Pricing
            </p>
            <h1 className="mt-3 font-serif text-3xl font-semibold text-white sm:text-4xl">
              Simple pricing. Big impact.
            </h1>
            <p className="mt-3 max-w-xl font-light text-white/60">
              Start free. Upgrade when you&rsquo;re ready. Cancel anytime &mdash;
              no questions asked.
            </p>
          </header>
          <PricingCards />
          <p className="mt-6 text-center text-sm text-white/40">
            Cancel anytime. No commitment. No credit card required to start free.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h2 className="font-serif text-2xl font-semibold text-forest-600">
          Frequently asked
        </h2>
        <dl className="mt-6 space-y-5 text-sm text-ink-soft">
          <div>
            <dt className="font-medium text-ink">Can I switch plans?</dt>
            <dd>Yes. Up- or down-grade at any time; we prorate the change.</dd>
          </div>
          <div>
            <dt className="font-medium text-ink">What about refunds?</dt>
            <dd>
              If the first month doesn&rsquo;t help, email us and we&rsquo;ll
              refund it. No drama.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-ink">
              Do you offer school / district pricing?
            </dt>
            <dd>Teacher mode is included in Premium. Reach out for district plans.</dd>
          </div>
        </dl>
      </section>
    </>
  );
}
