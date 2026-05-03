import Link from "next/link";
import { startCheckout } from "@/lib/actions/billing";

type PaidTier = "premium" | "family";

type Plan = {
  name: string;
  tier: "free" | PaidTier;
  price: string;
  cadence: string;
  description: string;
  features: { label: string; off?: boolean }[];
  ctaLabel: string;
  featured?: boolean;
};

const PLANS: Plan[] = [
  {
    name: "Free",
    tier: "free",
    price: "$0",
    cadence: "/month, forever",
    description: "Try one full plan, end to end.",
    features: [
      { label: "1 analysis per day" },
      { label: "Printable worksheet + answer key" },
      { label: "Step-by-step teaching guide" },
      { label: "Parent tips for every plan" },
      { label: "Interactive practice", off: true },
      { label: "Progress tracking", off: true },
    ],
    ctaLabel: "Get started free",
  },
  {
    name: "Premium",
    tier: "premium",
    price: "$17.99",
    cadence: "/month · 1 child",
    description: "Everything you need to make every session count.",
    features: [
      { label: "Unlimited analyses" },
      { label: "All three modes — Parent, Homeschool, Teacher" },
      { label: "Printable worksheet + answer key" },
      { label: "Interactive practice with instant feedback" },
      { label: "Automatic progress tracking" },
      { label: "Personalised learning plan" },
      { label: "Priority support" },
    ],
    ctaLabel: "Start free 7-day trial",
    featured: true,
  },
  {
    name: "Family",
    tier: "family",
    price: "$29.99",
    cadence: "/month · up to 4 children",
    description: "Built for homeschool families and households with siblings.",
    features: [
      { label: "Everything in Premium" },
      { label: "Up to 4 child profiles" },
      { label: "Individual progress tracking per child" },
      { label: "Perfect for homeschool families" },
      { label: "Extra parent resources" },
      { label: "Early access to new features" },
    ],
    ctaLabel: "Start free 7-day trial",
  },
];

export default function PricingCards() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {PLANS.map((p) => (
        <article
          key={p.name}
          className={[
            "relative flex flex-col rounded-2xl p-7 transition-transform hover:-translate-y-0.5",
            p.featured
              ? "bg-white text-ink shadow-lift"
              : "border border-white/10 bg-white/5 text-white/85",
          ].join(" ")}
        >
          {p.featured && (
            <span className="mb-3 inline-block w-fit rounded-full bg-forest-50 px-2.5 py-1 text-[10px] font-medium text-forest-600">
              ⭐ Most popular
            </span>
          )}
          <h3
            className={[
              "font-serif text-2xl font-semibold",
              p.featured ? "text-forest-600" : "text-white/90",
            ].join(" ")}
          >
            {p.name}
          </h3>
          <p className="mt-3">
            <span
              className={[
                "font-medium text-[34px] leading-none",
                p.featured ? "text-forest-500" : "text-forest-400",
              ].join(" ")}
            >
              {p.price}
            </span>
            <span
              className={[
                "ml-1 text-sm font-light",
                p.featured ? "text-ink-muted" : "text-white/45",
              ].join(" ")}
            >
              {p.cadence}
            </span>
          </p>
          <p
            className={[
              "mt-2 text-sm font-light",
              p.featured ? "text-ink-soft" : "text-white/55",
            ].join(" ")}
          >
            {p.description}
          </p>

          <div
            className={[
              "my-5 h-px",
              p.featured ? "bg-cream-300" : "bg-white/10",
            ].join(" ")}
          />

          <ul className="mb-6 flex flex-col gap-2.5 text-sm">
            {p.features.map((f) => (
              <li
                key={f.label}
                className={[
                  "flex items-start gap-2",
                  f.off ? "opacity-40" : "",
                  p.featured ? "text-ink-soft" : "text-white/72",
                ].join(" ")}
              >
                <span aria-hidden className={f.off ? "text-white/30" : "text-forest-400"}>
                  {f.off ? "—" : "✓"}
                </span>
                <span>{f.label}</span>
              </li>
            ))}
          </ul>

          {p.tier === "free" ? (
            <Link
              href={`/login?next=${encodeURIComponent("/session/new")}`}
              className={[
                "mt-auto inline-flex items-center justify-center rounded-lg px-4 py-3 text-sm font-medium transition",
                "border border-white/20 text-white/85 hover:bg-white/10",
              ].join(" ")}
            >
              {p.ctaLabel}
            </Link>
          ) : (
            <CheckoutButton tier={p.tier} featured={p.featured} label={p.ctaLabel} />
          )}
        </article>
      ))}
    </div>
  );
}

function CheckoutButton({
  tier,
  featured,
  label,
}: {
  tier: PaidTier;
  featured?: boolean;
  label: string;
}) {
  return (
    <form action={startCheckoutAction} className="mt-auto">
      <input type="hidden" name="tier" value={tier} />
      <button
        type="submit"
        className={[
          "inline-flex w-full items-center justify-center rounded-lg px-4 py-3 text-sm font-medium transition",
          featured
            ? "bg-gradient-to-br from-forest-500 to-teal-400 text-white shadow-glow hover:opacity-90"
            : "border border-white/20 text-white/85 hover:bg-white/10",
        ].join(" ")}
      >
        {label}
      </button>
    </form>
  );
}

async function startCheckoutAction(formData: FormData) {
  "use server";
  const tier = formData.get("tier");
  if (tier !== "premium" && tier !== "family") {
    throw new Error("Invalid tier.");
  }
  await startCheckout(tier);
}
