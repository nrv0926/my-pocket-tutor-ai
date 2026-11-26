import Link from "next/link";
import AnalysisResultCard from "@/components/AnalysisResultCard";
import LoopRunner from "@/components/LoopRunner";
import {
  SHOWCASE_CLASS_PLAN,
  SHOWCASE_INPUT,
  SHOWCASE_PLAN,
  SHOWCASE_SKILL_ID,
} from "./showcase/plan";

export const metadata = {
  title: "See the whole thing work · AI Pocket Tutor",
  description:
    "One learner, one week: what the adult typed, the plan it produced, and the next step decided from what actually happened. No sign-in, no database, nothing saved.",
};

const VERBS = [
  ["Input", "What the adult already knows"],
  ["Analyze", "What the data says, and only that"],
  ["Teach", "A script and the materials for it"],
  ["Worksheet", "Questions, and a key that is right"],
  ["Track", "The next step, from counted evidence"],
] as const;

function Step({
  n,
  verb,
  title,
  children,
}: {
  n: number;
  verb: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-14 scroll-mt-6" id={`step-${n}`}>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="inline-grid h-9 w-9 shrink-0 place-items-center rounded-full border-[3px] border-pop-night bg-pop-yellow font-display text-lg font-bold text-pop-night">
          {n}
        </span>
        <span className="font-display text-xs uppercase tracking-widest text-pop-magenta">
          {verb}
        </span>
        <h2 className="w-full font-display text-2xl text-pop-night sm:text-3xl">{title}</h2>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/**
 * The showcase: the five verbs, in order, on one page.
 *
 * Everything on it is the shipped code. The plan goes through the real
 * AnalysisResultCard, the capture screen is the real CaptureCard, and the
 * next step is the real recommend() against the real skill graph. Only two
 * things are not real: the plan was written by hand rather than generated,
 * because a showcase cannot depend on an API key, and nothing is saved.
 *
 * Public on purpose, which is why there is no real learner anywhere in it —
 * see tests/internalPages.test.ts, which fails the build if that slips.
 */
export default function DemoPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <header>
        <p className="font-display text-xs uppercase tracking-widest text-pop-magenta">
          Working demo · nothing is saved
        </p>
        <h1 className="mt-1 font-display text-3xl text-pop-night sm:text-4xl">
          One learner, one week.
        </h1>
        <p className="mt-3 max-w-prose text-pop-night/80">
          AI Pocket Tutor does five things: <strong>Input → Analyze → Teach →
          Worksheet → Track</strong>. This page does all five, in order, with
          no sign-in and no database. The last step is live — record a session
          and the suggestion underneath changes.
        </p>
        <ol className="mt-6 grid gap-2 sm:grid-cols-5">
          {VERBS.map(([verb, line], i) => (
            <li key={verb}>
              <a
                href={`#step-${i + 1}`}
                className="block h-full rounded-xl border-[3px] border-pop-night bg-white p-3 hover:bg-pop-cream"
              >
                <span className="font-display text-sm text-pop-night">
                  {i + 1}. {verb}
                </span>
                <span className="mt-0.5 block text-xs text-pop-night/70">{line}</span>
              </a>
            </li>
          ))}
        </ol>
      </header>

      <Step n={1} verb="Input" title="What the adult brings">
        <div className="rounded-2xl border-[3px] border-pop-night bg-white p-5 shadow-pop-sm">
          <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
            <div>
              <dt className="font-display text-xs uppercase tracking-wide text-pop-night/60">
                Profile
              </dt>
              <dd className="text-pop-night">{SHOWCASE_INPUT.profile}</dd>
            </div>
            <div>
              <dt className="font-display text-xs uppercase tracking-wide text-pop-night/60">
                Subject and strand
              </dt>
              <dd className="text-pop-night">
                {SHOWCASE_INPUT.subject} · {SHOWCASE_INPUT.strand}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="font-display text-xs uppercase tracking-wide text-pop-night/60">
                Ontario expectation {SHOWCASE_INPUT.expectation}
              </dt>
              <dd className="text-pop-night/85">
                &ldquo;{SHOWCASE_INPUT.expectationText}&rdquo;
                <span className="mt-1 block text-xs text-pop-night/60">
                  Transcribed from the Ministry curriculum, never written from memory. A test
                  asserts this wording matches the published text exactly.
                </span>
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="font-display text-xs uppercase tracking-wide text-pop-night/60">
                What she typed
              </dt>
              <dd className="mt-1 rounded-xl border-[3px] border-pop-night/20 bg-pop-cream p-3 text-pop-night/85">
                {SHOWCASE_INPUT.typed}
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-sm text-pop-night/70">
            Achievement level {SHOWCASE_INPUT.level} of Ontario&rsquo;s 1&ndash;4 chart, captured
            for this session. Level 3 is the provincial standard, not a middling result, and the
            level is never shown to a parent as a grade.
          </p>
        </div>
      </Step>

      <Step n={2} verb="Analyze · Teach · Worksheet" title="The plan it produces">
        <p className="mb-4 max-w-prose text-sm text-pop-night/70">
          Nine sections, always the same nine, in the same order. This is the real renderer —
          the component a signed-in adult sees — so what follows is the product, not a
          mock-up. Sections 3 and 4 are steps 2 and 3 of the five verbs; sections 5 and 6 are
          step 4.
        </p>
        <div className="rounded-2xl border-[3px] border-pop-night bg-white p-5 shadow-pop-sm sm:p-6">
          <AnalysisResultCard result={SHOWCASE_PLAN} />
        </div>
      </Step>

      <Step n={5} verb="Track" title="Record how it went — this part is live">
        <p className="mb-4 max-w-prose text-sm text-pop-night/70">
          The adult sits with the work and taps what happened. Every question starts at{" "}
          <strong>Right</strong> and <strong>On their own</strong>, so a session that went well
          is one tap. Mark some wrong, or needing a nudge, or <strong>Not sure</strong>, and
          watch the suggestion underneath change. Help that did not supply the skill being
          measured still counts as their own work; prompted and modelled answers never count.
        </p>
        <LoopRunner
          learnerId="showcase"
          worksheet={SHOWCASE_PLAN.practiceWorksheet}
          answerKey={SHOWCASE_PLAN.answerKey}
          skillId={SHOWCASE_SKILL_ID}
        />
      </Step>

      <Step n={6} verb="And for a class" title="The same lesson, twenty-four learners">
        <p className="mb-4 max-w-prose text-sm text-pop-night/70">
          Two sections grow when the profile is a class rather than one learner:{" "}
          <strong>one lesson in three tracks</strong>, and <strong>a worksheet per
          achievement level in the room</strong> — each carrying its own key, so the two can
          never drift apart. Both are left out of the plan above on purpose: a parent teaching
          one child has nobody to differentiate between, and one learner at one level needs
          exactly one worksheet.
        </p>
        <p className="mb-4 max-w-prose text-sm text-pop-night/70">
          A class has no capture screen. Evidence is per learner, and a class is not a learner —
          so the step above does not exist here, and the database refuses it too.
        </p>
        <div className="rounded-2xl border-[3px] border-pop-night bg-white p-5 shadow-pop-sm sm:p-6">
          <AnalysisResultCard result={SHOWCASE_CLASS_PLAN} />
        </div>
      </Step>

      <footer className="mt-16 rounded-2xl border-[3px] border-pop-night bg-pop-cream p-5">
        <h2 className="font-display text-xl text-pop-night">What is real here, and what is not</h2>
        <ul className="mt-3 space-y-2 text-sm text-pop-night/80">
          <li>
            <strong>Real:</strong> the nine-section renderer, the capture screen, the decision
            engine and its thresholds, the prerequisite graph, the Ontario expectation and its
            wording, and every answer key — which is recomputed by a test, not trusted.
          </li>
          <li>
            <strong>Not real:</strong> this plan was written by hand, not generated, so the page
            works with no API key. And nothing is saved — reload and the session is gone.
          </li>
        </ul>
        <p className="mt-4 text-sm text-pop-night/80">
          To compare three different cases against the same engine, try the{" "}
          <Link href="/demo/loop" className="font-semibold underline">
            loop sandbox
          </Link>
          .
        </p>
      </footer>
    </div>
  );
}
