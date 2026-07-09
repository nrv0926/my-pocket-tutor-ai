import type { Difficulty } from "@/types/session";

/**
 * Small visual atoms shared by the three result renderers. Keeps the
 * cards scannable: chips instead of bullet walls, colour-coded
 * difficulty, consistent section shells with an icon.
 */

export function ResultSection({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-cream-300 bg-white p-5 shadow-card sm:p-6">
      <header className="mb-4 flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-xl border border-forest-100 bg-forest-50 text-lg">
          {icon}
        </span>
        <h2 className="font-serif text-lg font-semibold leading-tight text-forest-600">
          {title}
        </h2>
      </header>
      {children}
    </section>
  );
}

export function GapChips({ gaps }: { gaps: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {gaps.map((g) => (
        <span
          key={g}
          className="rounded-full border border-[#F5C6C6] bg-[#FFF0F0] px-3 py-1.5 text-[13px] font-medium leading-snug text-[#8B3A3A]"
        >
          {g}
        </span>
      ))}
    </div>
  );
}

const DIFF_STYLES: Record<Difficulty, string> = {
  easy: "bg-forest-50 text-forest-600 border-forest-100",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  hard: "bg-[#FFF0F0] text-[#8B3A3A] border-[#F5C6C6]",
};

export function DiffBadge({ level }: { level: Difficulty }) {
  return (
    <span
      className={[
        "rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
        DIFF_STYLES[level],
      ].join(" ")}
    >
      {level}
    </span>
  );
}

const PRIORITY_BG = ["bg-forest-600", "bg-forest-500", "bg-forest-400"];

export function PriorityCards({ items }: { items: string[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {items.slice(0, 3).map((p, i) => (
        <div
          key={i}
          className="flex flex-col gap-2.5 rounded-xl border border-cream-300 bg-cream-50 p-4"
        >
          <span
            className={[
              "grid h-8 w-8 place-items-center rounded-full text-sm font-semibold text-white",
              PRIORITY_BG[i] ?? "bg-forest-400",
            ].join(" ")}
          >
            {i + 1}
          </span>
          <p className="text-sm font-medium leading-snug text-ink">{p}</p>
        </div>
      ))}
    </div>
  );
}

export function Stepper({ steps }: { steps: string[] }) {
  return (
    <ol className="relative ml-4 space-y-4 border-l-2 border-forest-100 pl-6">
      {steps.map((s, i) => (
        <li key={i} className="relative">
          <span className="absolute -left-[31px] grid h-5 w-5 place-items-center rounded-full bg-forest-500 text-[10px] font-semibold text-white">
            {i + 1}
          </span>
          <p className="text-sm leading-relaxed text-ink-soft">{s}</p>
        </li>
      ))}
    </ol>
  );
}

export function AnswerKeyDisclosure({
  answers,
}: {
  answers: { questionId: string; answer: string }[];
}) {
  return (
    <details className="group">
      <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium text-forest-500 hover:text-forest-600 [&::-webkit-details-marker]:hidden">
        <span className="transition-transform group-open:rotate-90">▸</span>
        Show answer key ({answers.length} answers)
      </summary>
      <ul className="mt-3 space-y-1.5 rounded-xl bg-cream-50 p-4 text-sm text-ink-soft">
        {answers.map((a) => (
          <li key={a.questionId} className="flex gap-2">
            <span className="w-8 shrink-0 font-mono text-xs text-ink-muted">
              {a.questionId}
            </span>
            {a.answer}
          </li>
        ))}
      </ul>
    </details>
  );
}

export function TipCards({ tips, icon = "💡" }: { tips: string[]; icon?: string }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {tips.map((t, i) => (
        <div
          key={i}
          className="flex items-start gap-3 rounded-xl border border-forest-100 bg-forest-50 p-4"
        >
          <span aria-hidden className="text-lg">{icon}</span>
          <p className="text-sm leading-relaxed text-ink">{t}</p>
        </div>
      ))}
    </div>
  );
}

export function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border-l-4 border-forest-400 bg-cream-50 p-4 text-sm leading-relaxed text-ink">
      {children}
    </div>
  );
}
