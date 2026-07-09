import type { DiffLevel, TeacherResult } from "@/types/session";
import {
  AnswerKeyDisclosure,
  Callout,
  DiffBadge,
  GapChips,
  ResultSection,
  Stepper,
  TipCards,
} from "./resultBits";

const LEVELS: { key: DiffLevel; label: string; style: string }[] = [
  { key: "easy", label: "Easy", style: "border-forest-100 bg-forest-50" },
  { key: "justRight", label: "Just right", style: "border-cream-300 bg-cream-50" },
  { key: "stretch", label: "Stretch", style: "border-amber-200 bg-amber-50" },
];

export default function TeacherResultCard({ result }: { result: TeacherResult }) {
  return (
    <article className="space-y-5">
      <div className="rounded-2xl bg-gradient-to-br from-forest-600 to-teal-700 p-6 text-white sm:p-7">
        <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-white/60">
          Student / group summary
        </p>
        <p className="mt-2 max-w-2xl font-serif text-lg leading-relaxed sm:text-xl">
          {result.groupSummary}
        </p>
      </div>

      <ResultSection icon="🔍" title="Key skill gaps">
        <GapChips gaps={result.keySkillGaps} />
      </ResultSection>

      <ResultSection icon="🧭" title="Intervention plan">
        <div className="space-y-3">
          {result.interventionPlan.map((s) => (
            <div key={s.session} className="rounded-xl border border-cream-300 bg-cream-50 p-4">
              <div className="mb-3 flex items-center gap-3">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-forest-500 text-sm font-semibold text-white">
                  {s.session}
                </span>
                <p className="font-medium text-ink">{s.focus}</p>
              </div>
              <Stepper steps={s.steps} />
            </div>
          ))}
        </div>
      </ResultSection>

      <ResultSection icon="🎚️" title="Differentiated practice — three levels">
        <div className="grid gap-3 sm:grid-cols-3">
          {LEVELS.map((lvl) => (
            <div key={lvl.key} className={["rounded-xl border p-4", lvl.style].join(" ")}>
              <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-forest-600">
                {lvl.label}
              </p>
              <ul className="space-y-2 text-[13px] leading-relaxed text-ink-soft">
                {result.differentiatedPractice[lvl.key].map((a, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-forest-400">·</span>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
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

      <ResultSection icon="🎯" title="Assessment checkpoint">
        <Callout>{result.assessmentCheckpoint}</Callout>
      </ResultSection>

      <ResultSection icon="📋" title="Teacher notes">
        <TipCards tips={result.teacherNotes} icon="📌" />
      </ResultSection>

      <div className="rounded-2xl border border-cream-300 bg-white p-5 text-center shadow-card">
        <p className="font-serif text-lg text-forest-600">{result.feedbackQuestion}</p>
      </div>
    </article>
  );
}
