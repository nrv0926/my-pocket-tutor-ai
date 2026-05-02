import { SectionSub, SectionTag, SectionTitle } from "./SectionTag";

const STEPS = [
  {
    n: 1,
    title: "Choose your mode",
    body: "Select Parent, Homeschool, or Teacher. Pick your child's grade, subject, and tell us what they're finding tricky.",
  },
  {
    n: 2,
    title: "We analyse",
    body: "Pocket Tutor identifies exact skill gaps, matches them to the Ontario curriculum, and prioritises what to work on first.",
  },
  {
    n: 3,
    title: "You get your plan",
    body: "A clear, step-by-step plan, practice worksheet, and parent or teacher tips — tailored to your mode, ready to use.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className="bg-cream-50 px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <SectionTag>How it works</SectionTag>
        <SectionTitle>
          Share what&rsquo;s happening.
          <br />
          Get a plan you can use tonight.
        </SectionTitle>
        <SectionSub>
          Three simple steps &mdash; from concern to clear action in minutes.
        </SectionSub>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {STEPS.map((s) => (
            <div
              key={s.n}
              className="rounded-2xl border border-cream-300 bg-white p-7 transition hover:-translate-y-0.5 hover:shadow-lift"
            >
              <span className="mb-4 grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-forest-500 to-teal-400 text-[15px] font-medium text-white shadow-glow">
                {s.n}
              </span>
              <h3 className="font-serif text-lg font-semibold text-forest-600">
                {s.title}
              </h3>
              <p className="mt-2 text-[13px] font-light leading-relaxed text-ink-soft">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
