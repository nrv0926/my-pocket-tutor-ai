import type { HomeschoolResult, WeekDay } from "@/types/session";

const DAYS: WeekDay[] = ["Mon", "Tue", "Wed", "Thu", "Fri"];

export default function HomeschoolResultCard({ result }: { result: HomeschoolResult }) {
  return (
    <article className="space-y-6">
      <Section index={1} title="What I notice">
        <p className="text-ink-soft">{result.whatINotice}</p>
      </Section>

      <Section index={2} title="Key skill gaps">
        <ul className="ml-5 list-disc space-y-1 text-ink-soft">
          {result.keySkillGaps.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      </Section>

      <Section index={3} title="Weekly plan (Mon–Fri)">
        <div className="grid gap-2 sm:grid-cols-5">
          {DAYS.map((d) => {
            const row = result.weeklyPlan.find((w) => w.day === d);
            return (
              <div
                key={d}
                className="rounded-xl border border-cream-300 bg-cream-50 p-3"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-forest-500">{d}</p>
                <p className="mt-1 text-sm text-ink">{row?.focus ?? "—"}</p>
              </div>
            );
          })}
        </div>
      </Section>

      <Section index={4} title="Daily lesson breakdown">
        <ul className="space-y-2">
          {result.dailyLessons.map((l, i) => (
            <li
              key={i}
              className="rounded-xl border border-cream-300 bg-white p-3 text-sm"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-forest-500">
                {l.day} · {l.subject} · {l.minutes} min
              </p>
              <p className="mt-1 font-medium text-ink">{l.skill}</p>
              <p className="mt-1 text-ink-soft">{l.activity}</p>
              <p className="mt-1 text-xs text-ink-muted">Tip: {l.parentTip}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section index={5} title="Worksheet set">
        <div className="space-y-4">
          {result.worksheetSet.map((ws, i) => (
            <div
              key={i}
              className="rounded-xl border border-cream-300 bg-white p-4"
            >
              <p className="font-medium text-ink">{ws.title}</p>
              <p className="text-xs text-ink-muted">
                {ws.questions.length} questions · difficulty:{" "}
                <span className="capitalize">{ws.difficulty}</span>
              </p>
              <ol className="ml-5 mt-2 list-decimal space-y-1 text-sm text-ink">
                {ws.questions.map((q) => (
                  <li key={q.id}>{q.prompt}</li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </Section>

      <Section index={6} title="Answer keys">
        <div className="space-y-3">
          {result.answerKeys.map((k, i) => (
            <div key={i}>
              <p className="text-sm font-medium text-ink">{k.worksheetTitle}</p>
              <ul className="ml-5 list-disc space-y-1 text-sm text-ink-soft">
                {k.answers.map((a) => (
                  <li key={a.questionId}>
                    <span className="font-mono text-xs text-ink-muted">
                      {a.questionId}
                    </span>{" "}
                    · {a.answer}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <Section index={7} title="Progress checklist">
        <ul className="ml-5 list-disc space-y-1 text-ink-soft">
          {result.progressChecklist.map((c, i) => (
            <li key={i}>{c}</li>
          ))}
        </ul>
      </Section>

      <Section index={8} title="Next week plan">
        <p className="text-ink-soft">{result.nextWeekPlan}</p>
      </Section>

      <Section index={9} title="Feedback">
        <p className="text-ink-soft">{result.feedbackQuestion}</p>
      </Section>
    </article>
  );
}

function Section({
  index,
  title,
  children,
}: {
  index: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-cream-300 bg-white p-5 shadow-card">
      <header className="mb-3 flex items-center gap-3">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-forest-50 text-xs font-semibold text-forest-600">
          {index}
        </span>
        <h2 className="font-serif text-xl font-semibold text-forest-600">{title}</h2>
      </header>
      {children}
    </section>
  );
}
