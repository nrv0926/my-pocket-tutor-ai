import DifferentiationTracks from "@/components/DifferentiationTracks";
import TeachingMaterials from "@/components/TeachingMaterials";
import type { AnalysisResult, Worksheet } from "@/types/session";

/**
 * Renders the fixed nine-section AI output. The shape is binding — see
 * CLAUDE.md §5. If you change the order or section names, change the prompt
 * and bump its version too.
 */
export default function AnalysisResultCard({ result }: { result: AnalysisResult }) {
  // Stacked, not tabbed. She prints this and walks to class, and a tab strip
  // prints whichever one happened to be open (journey 10).
  const variants = result.worksheetVariants ?? [];

  return (
    <article className="space-y-8">
      <Section index={1} title="What I notice">
        <p className="text-pop-night/80">{result.whatINotice}</p>
      </Section>

      <Section index={2} title="Key skill gaps">
        <ul className="ml-5 list-disc space-y-1 text-pop-night/80">
          {result.keySkillGaps.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      </Section>

      <Section index={3} title="What to teach next (top 3)">
        <ol className="ml-5 list-decimal space-y-1 text-pop-night/80">
          {result.whatToTeachNext.slice(0, 3).map((s, i) => (
            <li key={i} className="font-medium text-pop-night">
              {s}
            </li>
          ))}
        </ol>
      </Section>

      <Section index={4} title="How to teach it">
        <ol className="ml-5 list-decimal space-y-1 text-pop-night/80">
          {result.howToTeachIt.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
        {result.differentiation && (
          <DifferentiationTracks tracks={result.differentiation} />
        )}
        {result.teachingMaterials && result.teachingMaterials.length > 0 && (
          <TeachingMaterials materials={result.teachingMaterials} />
        )}
      </Section>

      <Section index={5} title="Practice worksheet">
        <QuestionList
          worksheet={result.practiceWorksheet}
          heading={variants.length > 0 ? "Whole group" : null}
        />
        {variants.map((v) => (
          <QuestionList
            key={v.level}
            worksheet={v.worksheet}
            heading={`Level ${v.level}`}
          />
        ))}
      </Section>

      <Section index={6} title="Answer key">
        <AnswerList
          answers={result.answerKey}
          heading={variants.length > 0 ? "Whole group" : null}
        />
        {variants.map((v) => (
          <AnswerList key={v.level} answers={v.answerKey} heading={`Level ${v.level}`} />
        ))}
      </Section>

      <Section index={7} title="Parent / teacher tips">
        <ul className="ml-5 list-disc space-y-1 text-pop-night/80">
          {result.parentTips.slice(0, 3).map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
      </Section>

      <Section index={8} title="Next step plan">
        <p className="text-pop-night/80">{result.nextStepPlan}</p>
      </Section>

      <Section index={9} title="Feedback">
        <p className="text-pop-night/80">{result.feedbackQuestion}</p>
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
    <section className="rounded-2xl border-[3px] border-pop-night bg-white p-5 shadow-pop-sm">
      <header className="mb-3 flex items-center gap-3">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-pop-cyan text-xs font-semibold text-pop-magenta">
          {index}
        </span>
        <h2 className="font-display text-xl text-pop-night">{title}</h2>
      </header>
      {children}
    </section>
  );
}

/**
 * One worksheet. The heading only appears when there is more than one to
 * tell apart — a single set is just "the worksheet", and labelling it would
 * imply a level nobody chose.
 */
function QuestionList({
  worksheet,
  heading,
}: {
  worksheet: Worksheet;
  heading: string | null;
}) {
  return (
    <div className={heading ? "mt-5 break-inside-avoid first:mt-0" : ""}>
      {heading && (
        <p className="font-display text-sm uppercase tracking-widest text-pop-magenta">
          {heading}
        </p>
      )}
      <p className="mb-3 text-sm text-pop-night/60">
        {worksheet.questions.length} questions · difficulty:{" "}
        <strong className="capitalize">{worksheet.difficulty}</strong>
      </p>
      <ol className="ml-5 list-decimal space-y-2 text-pop-night">
        {worksheet.questions.map((q) => (
          <li key={q.id}>
            <span>{q.prompt}</span>{" "}
            <span className="ml-2 rounded bg-pop-night/15 px-1.5 py-0.5 align-middle text-[10px] uppercase tracking-widest text-pop-night/60">
              {q.difficulty}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function AnswerList({
  answers,
  heading,
}: {
  answers: { questionId: string; answer: string }[];
  heading: string | null;
}) {
  return (
    <div className={heading ? "mt-4 break-inside-avoid first:mt-0" : ""}>
      {heading && (
        <p className="mb-1 font-display text-sm uppercase tracking-widest text-pop-magenta">
          {heading}
        </p>
      )}
      <ul className="ml-5 list-disc space-y-1 text-pop-night/80">
        {answers.map((a) => (
          <li key={a.questionId}>
            <span className="font-mono text-xs text-pop-night/60">{a.questionId}</span> ·{" "}
            {a.answer}
          </li>
        ))}
      </ul>
    </div>
  );
}
