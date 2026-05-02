import PricingCards from "@/components/PricingCards";
import { SectionSub, SectionTag, SectionTitle } from "./SectionTag";

export default function Pricing() {
  return (
    <section id="pricing" className="bg-teal-700 px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <SectionTag tone="dark">Pricing</SectionTag>
        <SectionTitle tone="dark">Simple pricing. Big impact.</SectionTitle>
        <SectionSub tone="dark">
          Start free. Upgrade when you&rsquo;re ready. Cancel anytime &mdash;
          no questions asked.
        </SectionSub>

        <div className="mt-9 grid max-w-3xl gap-3 md:grid-cols-2">
          <CompareBox
            label="Free includes"
            tone="muted"
            items={[
              "✓  AI analysis of report card or homework",
              "✓  Printable worksheet + answer key",
              "✓  Step-by-step teaching guide",
              "✓  Parent tips",
            ]}
          />
          <CompareBox
            label="Premium adds"
            tone="bright"
            items={[
              "✨  Interactive on-screen practice + feedback",
              "✨  Automatic progress tracking per session",
              "✨  Unlimited analyses",
              "✨  Personalised learning plan",
            ]}
          />
        </div>

        <div className="mt-6">
          <PricingCards />
        </div>

        <p className="mt-6 text-center text-sm text-white/40">
          Cancel anytime. No commitment. No credit card required to start free.
        </p>
      </div>
    </section>
  );
}

function CompareBox({
  label,
  tone,
  items,
}: {
  label: string;
  tone: "muted" | "bright";
  items: string[];
}) {
  return (
    <div
      className={[
        "rounded-xl p-5",
        tone === "bright"
          ? "border border-forest-400/25 bg-forest-400/10"
          : "border border-white/10 bg-white/5",
      ].join(" ")}
    >
      <p
        className={[
          "mb-2 text-[10px] font-medium uppercase tracking-[0.07em]",
          tone === "bright" ? "text-forest-400" : "text-white/45",
        ].join(" ")}
      >
        {label}
      </p>
      {items.map((i) => (
        <p key={i} className="mb-1 text-[13px] text-white/75">
          {i}
        </p>
      ))}
    </div>
  );
}
