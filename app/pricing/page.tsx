import PricingCards from "@/components/PricingCards";
import { Sticker } from "@/components/pop/PopBits";

export default function PricingPage() {
  return (
    <>
      <header className="border-b-[3px] border-pop-night bg-pop-cyan">
        <div className="mx-auto max-w-3xl px-4 py-14 text-center sm:px-6">
          <Sticker tone="pink" rotate="-3deg">Pricing</Sticker>
          <h1 className="mt-6 font-display text-4xl uppercase leading-[0.95] text-pop-night sm:text-5xl">
            Simple pricing, no surprises
          </h1>
          <p className="mt-5 text-lg font-medium text-pop-night/80">
            Start free. Upgrade when you&apos;re ready. Cancel any time.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <PricingCards />

        <section className="mt-16">
          <h2 className="text-center font-display text-3xl uppercase text-pop-night">
            Frequently asked
          </h2>
          <dl className="mt-8 space-y-4">
            {[
              ["Can I switch plans?", "Yes. Up- or down-grade at any time; we prorate the change."],
              ["What about refunds?", "If the first month doesn't help, email us and we'll refund it. No drama."],
              ["Do you offer school pricing?", "Teacher accounts are coming. Email us if you want early access."],
            ].map(([q, a]) => (
              <div
                key={q}
                className="rounded-2xl border-[3px] border-pop-night bg-pop-cream p-5 shadow-pop-sm"
              >
                <dt className="font-display text-base uppercase leading-tight text-pop-night">{q}</dt>
                <dd className="mt-2 text-sm font-medium text-pop-night/80">{a}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </>
  );
}
