import type { HomeschoolResult, WeekDay } from "@/types/session";
import {
  AnswerKeyDisclosure,
  Callout,
  DiffBadge,
  GapChips,
  ResultSection,
} from "./resultBits";

const DAYS: WeekDay[] = ["Mon", "Tue", "Wed", "Thu", "Fri"];

export default function HomeschoolResultCard({ result }: { result: HomeschoolResult }) {
  return (
    <article className="space-y-5">
      <div className="rounded-2xl bg-gradient-to-br from-forest-600 to-teal-700 p-6 text-white sm:p-7">
        <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-white/60">
          What I notice
        </p>
        <p className="mt-2 max-w-2xl font-serif text-lg leading-relaxed sm:text-xl">
          {result.whatINotice}
        </p>
      </div>

      <ResultSection icon="🔍" title="Key skill gaps">
        <GapChips gaps={result.keySkillGaps} />
      </ResultSection>

      <ResultSection icon="🗓️" title="This week at a glance">
        <div className="grid gap-2 sm:grid-cols-5">
          {DAYS.map((d) => {
            const row = result.weeklyPlan.find((w) => w.day === d);
            return (
              <div key={d} className="rounded-xl border border-cream-300 bg-cream-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-forest-500">
                  {d}
                </p>
                <p className="mt-1.5 text-[13px] leading-snug text-ink">
                  {row?.focus ?? "—"}
                </p>
              </div>
            );
          })}
        </div>
      </ResultSection>

      <ResultSection icon="📚" title="Daily lessons">
        <div className="space-y-2.5">
          {result.dailyLessons.map((l, i) => (
            <details
              key={i}
              className="group rounded-xl border border-cream-300 bg-white"
            >
              <summary className="flex cursor-pointer list-none items-center gap-3 p-4 [&::-webkit-details-marker]:hidden">
                <span className="grid h-9 w-12 shrink-0 place-items-center rounded-lg bg-forest-50 text-xs font-semibold uppercase text-forest-600">
                  {l.day}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{l.skill}</p>
                  <p className="text-xs capitalize text-ink-muted">
                    {l.subject} · {l.minutes} min
                  </p>
                </div>
                <span className="text-forest-400 transition-transform group-open:rotate-90">▸</span>
              </summary>
              <div className="space-y-2 border-t border-cream-200 px-4 py-3 text-sm text-ink-soft">
                <p>{l.activity}</p>
                <p className="text-xs text-ink-muted">💡 {l.parentTip}</p>
              </div>
            </details>
          ))}
        </div>
      </ResultSection>

      <ResultSection icon="✏️" title="Worksheets">
        <div className="space-y-4">
          {result.worksheetSet.map((ws, i) => {
            const key = result.answerKeys.find((k) => k.worksheetTitle === ws.title);
            return (
              <div key={i} className="rounded-xl border border-cream-300 bg-cream-50 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="font-medium text-ink">{ws.title}</p>
                  <DiffBadge level={ws.difficulty} />
                </div>
                <ol className="space-y-1.5 text-sm text-ink">
                  {ws.questions.map((q, qi) => (
                    <li key={q.id}>
                      <span className="mr-2 font-semibold text-forest-500">{qi + 1}.</span>
                      {q.prompt}
                    </li>
                  ))}
                </ol>
                {key && (
                  <div className="mt-3">
                    <AnswerKeyDisclosure answers={key.answers} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ResultSection>

      <ResultSection icon="✅" title="What success looks like this week">
        <ul className="space-y-2">
          {result.progressChecklist.map((c, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-ink-soft">
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-[1.5px] border-forest-400 bg-forest-50 text-[10px] text-forest-500">
                ✓
              </span>
              {c}
            </li>
          ))}
        </ul>
      </ResultSection>

      <ResultSection icon="⏭️" title="Next week">
        <Callout>{result.nextWeekPlan}</Callout>
      </ResultSection>

      <div className="rounded-2xl border border-cream-300 bg-white p-5 text-center shadow-card">
        <p className="font-serif text-lg text-forest-600">{result.feedbackQuestion}</p>
      </div>
    </article>
  );
}
