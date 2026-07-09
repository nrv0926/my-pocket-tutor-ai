import type { ParentResult } from "@/types/session";
import {
  AnswerKeyDisclosure,
  Callout,
  DiffBadge,
  GapChips,
  PriorityCards,
  ResultSection,
  Stepper,
  TipCards,
} from "./resultBits";

/**
 * Parent mode result. Design intent: a tired parent at 9pm should get
 * the point of each section at a glance — chips and cards over prose,
 * detail behind disclosure, one section = one idea.
 */
export default function ParentResultCard({ result }: { result: ParentResult }) {
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

      <ResultSection icon="🎯" title="What to teach next">
        <PriorityCards items={result.whatToTeachNext} />
      </ResultSection>

      <ResultSection icon="🧭" title="How to teach it — tonight's session">
        <Stepper steps={result.howToTeachIt} />
      </ResultSection>

      <ResultSection icon="✏️" title="Practice worksheet">
        <p className="mb-4 text-sm text-ink-muted">
          {result.practiceWorksheet.title} · {result.practiceWorksheet.questions.length}{" "}
          questions — the print-ready version is just below.
        </p>
        <ol className="space-y-2.5">
          {result.practiceWorksheet.questions.map((q, i) => (
            <li
              key={q.id}
              className="flex items-start justify-between gap-3 rounded-xl border border-cream-300 bg-cream-50 px-4 py-3"
            >
              <p className="text-sm leading-relaxed text-ink">
                <span className="mr-2 font-semibold text-forest-500">{i + 1}.</span>
                {q.prompt}
              </p>
              <DiffBadge level={q.difficulty} />
            </li>
          ))}
        </ol>
        <div className="mt-4">
          <AnswerKeyDisclosure answers={result.answerKey} />
        </div>
      </ResultSection>

      <ResultSection icon="💛" title="Parent tips">
        <TipCards tips={result.parentTips.slice(0, 3)} />
      </ResultSection>

      <ResultSection icon="🗓️" title="Next step plan">
        <Callout>{result.nextStepPlan}</Callout>
      </ResultSection>

      <div className="rounded-2xl border border-cream-300 bg-white p-5 text-center shadow-card">
        <p className="font-serif text-lg text-forest-600">{result.feedbackQuestion}</p>
        <p className="mt-1 text-xs text-ink-muted">
          Answer under the worksheet below — it tunes the next session&rsquo;s difficulty.
        </p>
      </div>
    </article>
  );
}
