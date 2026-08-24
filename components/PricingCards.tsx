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
    <div className="grid gap-8 md:grid-cols-2">
      {PLANS.map((p, i) => (
        <article
          key={p.name}
          style={{ transform: `rotate(${i === 0 ? "-1.5deg" : "1.5deg"})` }}
          className={[
            "relative flex flex-col rounded-2xl border-[3px] border-pop-night p-7 shadow-pop-lg",
            p.featured ? "bg-pop-pink text-pop-night" : "bg-pop-cream text-pop-night",
          ].join(" ")}
        >
          {p.featured && (
            <span className="absolute -top-4 right-6 rotate-3 rounded-full border-[3px] border-pop-night bg-pop-yellow px-3 py-1 font-display text-[10px] uppercase tracking-widest shadow-pop-sm">
              Most popular
            </span>
          )}
          <header>
            <h3 className="font-display text-2xl uppercase leading-none">{p.name}</h3>
            <p className="mt-2 text-sm font-medium text-pop-night/75">{p.description}</p>
          </header>

          <p className="my-6 border-y-[3px] border-pop-night py-4">
            <span className="font-display text-5xl">{p.price}</span>
            <span className="font-display text-sm uppercase tracking-wide text-pop-night/60">
              {p.cadence}
            </span>
          </p>

          <ul className="mb-7 space-y-2.5 text-sm font-semibold">
            {p.features.map((f) => (
              <li key={f} className="flex items-start gap-3">
                <span
                  aria-hidden
                  className="mt-[3px] grid h-5 w-5 shrink-0 place-items-center rounded-full border-[2px] border-pop-night bg-pop-cyan text-[11px]"
                >
                  ✓
                </span>
                <span>{f}</span>
              </li>
            ))}
          </ul>

          <Link
            href={p.cta.href}
            className="mt-auto inline-flex items-center justify-center rounded-full border-[3px] border-pop-night bg-pop-night px-5 py-3 font-display text-xs uppercase tracking-wide text-pop-cream shadow-pop-sm transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
          >
            {p.cta.label}
          </Link>
        </article>
      ))}
    </div>
  );
}
