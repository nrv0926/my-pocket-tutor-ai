import { SectionSub, SectionTag, SectionTitle } from "./SectionTag";

const FEATURES = [
  {
    icon: "🧠",
    title: "Smart analysis",
    body: "Pinpoints exactly where your child needs support and matches it to the Ontario K–3 curriculum — so you always know you're working on the right thing.",
  },
  {
    icon: "📚",
    title: "Science of Reading",
    body: "All reading plans follow the proven progression — phonemic awareness, phonics, fluency, vocabulary, then comprehension. No skipping ahead.",
  },
  {
    icon: "📄",
    title: "Printable worksheets",
    body: "Every plan includes a ready-to-print practice sheet with an answer key — great for kitchen table sessions together.",
  },
  {
    icon: "🎮",
    title: "Interactive practice",
    premium: true,
    body: "Your child works through questions on screen, gets instant feedback, and earns a score — so you can both see exactly how they're doing.",
  },
  {
    icon: "📈",
    title: "Progress tracking",
    premium: true,
    body: "Every interactive session is saved automatically — so you can see which skills are growing and what still needs a little more practice.",
  },
  {
    icon: "🔒",
    title: "Private by design",
    body: "Your child's data is analysed and deleted within 24 hours. We never store names, school names, or personal information.",
  },
];

export default function Features() {
  return (
    <section id="features" className="bg-cream-50 px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <SectionTag>Features</SectionTag>
        <SectionTitle>
          Everything you need,
          <br />
          right when you need it.
        </SectionTitle>
        <SectionSub>
          Pocket Tutor gives you a clear, confident path forward &mdash; so
          every session actually counts.
        </SectionSub>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {FEATURES.map((f) => (
            <article
              key={f.title}
              className={[
                "relative overflow-hidden rounded-2xl border bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-lift",
                f.premium ? "border-[#84A98C]" : "border-cream-300",
              ].join(" ")}
            >
              {f.premium && (
                <span className="absolute right-3.5 top-3.5 rounded-full bg-gradient-to-br from-forest-500 to-teal-400 px-2 py-0.5 text-[10px] font-medium text-white">
                  Premium
                </span>
              )}
              <span className="grid h-11 w-11 place-items-center rounded-xl border border-forest-100 bg-forest-50 text-xl">
                {f.icon}
              </span>
              <h3 className="mt-4 font-serif text-base font-semibold text-forest-600">
                {f.title}
              </h3>
              <p className="mt-2 text-[13px] font-light leading-relaxed text-ink-soft">
                {f.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
