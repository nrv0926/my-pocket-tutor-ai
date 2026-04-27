import Link from "next/link";

const PLANS = [
  {
    name: "Single Child",
    price: "$9.99",
    cadence: "/month",
    description: "Everything one parent needs for one child.",
    features: [
      "1 child profile",
      "Unlimited learning sessions",
      "Weekly plan + worksheets",
      "Progress tracking",
    ],
    cta: { label: "Start Single Child", href: "/children/new" },
    featured: false,
  },
  {
    name: "Family",
    price: "$19.99",
    cadence: "/month",
    description: "Up to 4 kids. The most popular choice for families.",
    features: [
      "Up to 4 child profiles",
      "Unlimited learning sessions",
      "Weekly plans across all kids",
      "Progress tracking + comparisons",
      "Priority support",
    ],
    cta: { label: "Start Family plan", href: "/children/new" },
    featured: true,
  },
];

export default function PricingCards() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {PLANS.map((p) => (
        <article
          key={p.name}
          className={[
            "relative flex flex-col rounded-2xl border p-6 shadow-card",
            p.featured
              ? "border-forest-500 bg-forest-500 text-cream-50"
              : "border-cream-300 bg-white text-ink",
          ].join(" ")}
        >
          {p.featured && (
            <span className="absolute -top-3 right-6 rounded-full bg-sand px-3 py-1 text-xs font-semibold uppercase tracking-widest text-ink">
              Most popular
            </span>
          )}
          <header>
            <h3 className="font-serif text-2xl">{p.name}</h3>
            <p className={p.featured ? "mt-1 text-sm text-cream-50/80" : "mt-1 text-sm text-ink-muted"}>
              {p.description}
            </p>
          </header>

          <p className="my-5 border-y border-cream-300/40 py-4">
            <span className="font-serif text-4xl">{p.price}</span>
            <span className={p.featured ? "text-cream-50/70" : "text-ink-muted"}>{p.cadence}</span>
          </p>

          <ul className="mb-6 space-y-2 text-sm">
            {p.features.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <span aria-hidden className="mt-1">✓</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>

          <Link
            href={p.cta.href}
            className={[
              "mt-auto inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold",
              p.featured
                ? "bg-white text-forest-600 hover:bg-cream-100"
                : "border border-forest-500 text-forest-600 hover:bg-forest-50",
            ].join(" ")}
          >
            {p.cta.label}
          </Link>
        </article>
      ))}
    </div>
  );
}
