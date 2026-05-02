import Link from "next/link";
import { SectionSub, SectionTag, SectionTitle } from "./SectionTag";

const MODES = [
  {
    icon: "👨‍👩‍👧",
    name: "Parent mode",
    href: "/login?mode=parent",
    cta: "I'm a parent",
    desc: "You care deeply about your child's learning. You just want to know exactly what to do at home — clearly, simply, tonight.",
    outputs: [
      "What I notice — in plain language",
      "Top 3 skill priorities",
      "Step-by-step teaching guide",
      "Printable or interactive worksheet",
      "Parent tips + next step plan",
    ],
  },
  {
    icon: "🏠",
    name: "Homeschool mode",
    href: "/login?mode=homeschool",
    cta: "I homeschool",
    desc: "You're leading your child's education at home. You need structured weekly plans, subject-by-subject guidance, and resources you can actually use.",
    outputs: [
      "Weekly learning plan — Mon to Fri",
      "Daily lesson breakdown per subject",
      "Skill gap analysis + progression",
      "Worksheets + answer keys",
      "Progress checklist + next week plan",
    ],
  },
  {
    icon: "🍎",
    name: "Teacher mode",
    href: "/login?mode=teacher",
    cta: "I'm a teacher",
    desc: "You're supporting students with specific skill gaps. You need targeted intervention plans and differentiated resources — without the hours of planning.",
    outputs: [
      "Student or group skill summary",
      "Intervention plan — 3 to 5 sessions",
      "Differentiated practice — 3 levels",
      "Worksheet set + answer keys",
      "Assessment checkpoint + teacher notes",
    ],
  },
];

export default function Modes() {
  return (
    <section id="who" className="bg-cream-50 px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <SectionTag>Who it&rsquo;s for</SectionTag>
        <SectionTitle>Three modes. One clear tool.</SectionTitle>
        <SectionSub>
          Choose the mode that fits your situation. Each one gives you exactly
          what you need &mdash; nothing more, nothing less.
        </SectionSub>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {MODES.map((m) => (
            <article
              key={m.name}
              className="group flex flex-col rounded-2xl border border-cream-300 bg-white p-7 transition hover:-translate-y-1 hover:border-teal-400 hover:shadow-lift"
            >
              <span className="grid h-12 w-12 place-items-center rounded-xl border border-forest-100 bg-forest-50 text-2xl">
                {m.icon}
              </span>
              <h3 className="mt-4 font-serif text-lg font-semibold text-forest-600">
                {m.name}
              </h3>
              <p className="mt-1.5 text-[13px] font-light leading-relaxed text-ink-soft">
                {m.desc}
              </p>
              <ul className="mt-4 flex flex-col gap-1.5 text-xs text-ink-muted">
                {m.outputs.map((o) => (
                  <li key={o} className="flex items-center gap-2">
                    <span aria-hidden className="text-[11px] text-forest-400">✓</span>
                    {o}
                  </li>
                ))}
              </ul>
              <Link
                href={m.href}
                className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-teal-400 hover:text-forest-600"
              >
                {m.cta} →
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
