import { SectionSub, SectionTag, SectionTitle } from "./SectionTag";

const POINTS = [
  { icon: "📋", text: "Report cards are full of language that's hard to translate into action at home" },
  { icon: "😤", text: "Homework time turns into a struggle — for everyone at the table" },
  { icon: "💭", text: "You can see your child is finding something hard, but you're not sure where to focus first" },
  { icon: "📅", text: "Planning takes hours — and you're still not confident it's the right thing to teach next" },
];

export default function Problem() {
  return (
    <section className="bg-teal-700 px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <SectionTag tone="dark">Sound familiar?</SectionTag>
        <SectionTitle tone="dark">
          You want to help &mdash;
          <br />
          you just need a clear place to start.
        </SectionTitle>
        <SectionSub tone="dark">
          Whether you&rsquo;re a parent at the kitchen table, a homeschooler
          planning next week, or a teacher preparing intervention &mdash; the
          hard part is knowing exactly where to focus.
        </SectionSub>

        <div className="mt-10 grid max-w-3xl gap-3 md:grid-cols-2">
          {POINTS.map((p) => (
            <div
              key={p.text}
              className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10"
            >
              <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg border border-forest-400/30 bg-forest-400/15 text-base">
                {p.icon}
              </span>
              <p className="text-sm leading-relaxed text-white/80">{p.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-9 inline-flex items-center gap-2.5 rounded-xl border border-forest-400/30 bg-forest-400/15 px-5 py-3 text-[15px] font-medium text-forest-400">
          💚 That&rsquo;s exactly what Pocket Tutor is here for.
        </div>
      </div>
    </section>
  );
}
