import { SectionTag, SectionTitle } from "./SectionTag";

const ITEMS = [
  "What I notice — written in plain language",
  "Exact skill gaps identified",
  "Top 3 priorities — never more, never less",
  "Step-by-step teaching or lesson plan",
  "Practice worksheet — 5 to 8 questions",
  "Answer key included every time",
  "Parent or teacher tips",
  "Clear next step — so you always know what's next",
];

export default function Outputs() {
  return (
    <section className="bg-gradient-to-br from-forest-50 to-[#E8F4F8] px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <SectionTag>What you get every time</SectionTag>
        <SectionTitle>One upload. A full plan.</SectionTitle>

        <div className="mt-12 grid items-start gap-12 md:grid-cols-2">
          <ul className="flex flex-col gap-2.5">
            {ITEMS.map((i) => (
              <li
                key={i}
                className="flex items-center gap-3 rounded-xl border border-cream-300 bg-white p-4 text-sm text-ink transition hover:border-forest-400"
              >
                <span className="grid h-5 w-5 flex-shrink-0 place-items-center rounded-full border-[1.5px] border-forest-400 bg-forest-50 text-[10px] text-forest-500">
                  ✓
                </span>
                {i}
              </li>
            ))}
          </ul>

          <PreviewCard />
        </div>
      </div>
    </section>
  );
}

function PreviewCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-cream-300 bg-white shadow-lift">
      <div className="bg-gradient-to-br from-teal-700 to-forest-600 px-5 py-4 text-white">
        <p className="text-[10px] uppercase tracking-wider text-white/60">
          Alex · Grade 2 · Reading · Today
        </p>
        <h4 className="font-serif text-lg">Phonics analysis &mdash; Parent mode</h4>
      </div>
      <div className="p-5">
        <p className="text-[10px] font-medium uppercase tracking-[0.07em] text-teal-400">
          Key skill gaps
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {["Consonant blending", "CVC word reading", "Sentence fluency"].map((p) => (
            <span
              key={p}
              className="rounded-full border border-[#F5C6C6] bg-[#FFF0F0] px-2.5 py-1 text-[11px] font-medium text-[#8B3A3A]"
            >
              {p}
            </span>
          ))}
        </div>

        <p className="mt-4 text-[10px] font-medium uppercase tracking-[0.07em] text-teal-400">
          Top 3 priorities
        </p>
        <Priority n={1} title="CVC blending — cat, bat, map" sub="Foundation skill · 10–12 min/day · Start today" />
        <Priority n={2} title="CVC word accuracy — build 20 words" sub="8–10 min/day · Start week 2" />
        <Priority n={3} title="Simple sentence reading — fluency" sub="5–8 min/day · Start week 3" />
      </div>
    </div>
  );
}

function Priority({ n, title, sub }: { n: 1 | 2 | 3; title: string; sub: string }) {
  const numColor = n === 1 ? "bg-forest-600" : n === 2 ? "bg-forest-500" : "bg-forest-400";
  return (
    <div className="mt-2 flex items-start gap-3 rounded-lg border border-cream-300 bg-cream-50 p-3">
      <span className={["grid h-5 w-5 flex-shrink-0 place-items-center rounded-full text-[11px] font-medium text-white", numColor].join(" ")}>
        {n}
      </span>
      <div>
        <p className="text-xs font-medium text-ink">{title}</p>
        <p className="text-[11px] text-ink-muted">{sub}</p>
      </div>
    </div>
  );
}
