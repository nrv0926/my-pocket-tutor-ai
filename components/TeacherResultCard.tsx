import type { DiffLevel, TeacherResult } from "@/types/session";

const LEVEL_LABELS: Record<DiffLevel, string> = {
  easy: "Easy",
  justRight: "Just right",
  stretch: "Stretch",
};

export default function TeacherResultCard({ result }: { result: TeacherResult }) {
  return (
    <article className="space-y-6">
      <Section index={1} title="Student / group summary">
        <p className="text-ink-soft">{result.groupSummary}</p>
      </Section>

      <Section index={2} title="Key skill gaps">
        <ul className="ml-5 list-disc space-y-1 text-ink-soft">
          {result.keySkillGaps.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      </Section>

      <Section index={3} title="Intervention plan">
        <ol className="space-y-3">
          {result.interventionPlan.map((s) => (
            <li
              key={s.session}
              className="rounded-xl border border-cream-300 bg-white p-3"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-forest-500">
                Session {s.session}
              </p>
              <p className="mt-1 font-medium text-ink">{s.focus}</p>
              <ul className="ml-5 mt-2 list-disc space-y-1 text-sm text-ink-soft">
                {s.steps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </Section>

      <Section index={4} title="Differentiated practice">
        <div className="grid gap-3 sm:grid-cols-3">
          {(Object.keys(result.differentiatedPractice) as DiffLevel[]).map((lvl) => (
            <div key={lvl} className="rounded-xl border border-cream-300 bg-cream-50 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-forest-500">
                {LEVEL_LABELS[lvl]}
              </p>
              <ul className="ml-5 mt-2 list-disc space-y-1 text-sm text-ink-soft">
                {result.differentiatedPractice[lvl].map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
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

      <Section index={7} title="Assessment checkpoint">
        <p className="text-ink-soft">{result.assessmentCheckpoint}</p>
      </Section>

      <Section index={8} title="Teacher notes">
        <ul className="ml-5 list-disc space-y-1 text-ink-soft">
          {result.teacherNotes.map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>
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
