import Link from "next/link";
import LocalTime from "@/components/LocalTime";
import { feedbackLabel, feedbackSteer, type Continuity } from "@/lib/continuity";

/**
 * One learner, and the thread to pick back up.
 *
 * This is the card that turns a plan generator into something that remembers.
 * Everything on it is read from the last stored plan — what it taught, what
 * it promised to do next, and how the adult said it went. Nothing is
 * predicted: when a field is missing the card says less rather than
 * inventing a recommendation about a real child.
 */
export default function ContinueCard({
  nickname,
  grade,
  kind,
  continuity,
}: {
  nickname: string;
  grade: string;
  kind: "student" | "class";
  continuity: Continuity;
}) {
  const { last, feedback, note, sessionCount } = continuity;
  const gradeName = grade === "K" ? "Kindergarten" : `Grade ${grade}`;
  const rating = feedbackLabel(feedback);
  const steer = feedbackSteer(feedback);

  return (
    <article className="flex flex-col rounded-2xl border-[3px] border-pop-night bg-white p-5 shadow-pop-sm">
      <header className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 className="font-display text-xl text-pop-night">{nickname}</h3>
        <p className="font-display text-[11px] uppercase tracking-widest text-pop-night/50">
          {gradeName}
          {kind === "class" ? " · Class" : ""}
        </p>
      </header>

      {last === null ? (
        <>
          <p className="mt-3 text-sm text-pop-night/75">
            No sessions yet. The first one sets the baseline.
          </p>
          <Link
            href={`/session/new?child=${continuity.childId}`}
            className="mt-4 inline-flex items-center justify-center rounded-full border-[3px] border-pop-night bg-pop-pink px-4 py-2.5 font-display text-xs uppercase tracking-wide text-pop-night shadow-pop-sm transition-all hover:bg-pop-yellow"
          >
            Start the first session
          </Link>
        </>
      ) : (
        <>
          <p className="mt-3 font-display text-[11px] uppercase tracking-widest text-pop-night/50">
            Last time · <LocalTime iso={last.createdAt} />
          </p>

          {last.taught.length > 0 && (
            <ul className="mt-1.5 space-y-1 text-sm text-pop-night">
              {last.taught.map((t, i) => (
                <li key={i} className="flex gap-2">
                  <span aria-hidden className="text-pop-magenta">
                    ·
                  </span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          )}

          {rating && (
            <p className="mt-3 rounded-xl bg-pop-cream px-3 py-2 text-xs text-pop-night">
              You said it was <b>{rating.toLowerCase()}</b>. {steer}
            </p>
          )}

          {note && (
            <p className="mt-2 text-xs italic text-pop-night/70">&ldquo;{note}&rdquo;</p>
          )}

          {last.nextStepPlan && (
            <div className="mt-3 rounded-xl border-[3px] border-pop-night bg-pop-cyan/30 px-3 py-2.5">
              <p className="font-display text-[10px] uppercase tracking-widest text-pop-magenta">
                Pocket Tutor recommends
              </p>
              <p className="mt-1 text-sm text-pop-night">{last.nextStepPlan}</p>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Link
              href={`/session/new?child=${continuity.childId}&subject=${encodeURIComponent(last.subject)}`}
              className="inline-flex items-center justify-center rounded-full border-[3px] border-pop-night bg-pop-pink px-4 py-2.5 font-display text-xs uppercase tracking-wide text-pop-night shadow-pop-sm transition-all hover:bg-pop-yellow"
            >
              Continue learning
            </Link>
            <Link
              href={`/results/${last.id}`}
              className="text-sm text-pop-magenta underline underline-offset-2"
            >
              Last plan
            </Link>
            <Link
              href={`/print/${last.id}`}
              className="text-sm text-pop-magenta underline underline-offset-2"
            >
              Print
            </Link>
            <Link
              href={`/plan/${continuity.childId}`}
              className="text-sm text-pop-magenta underline underline-offset-2"
            >
              4-week plan
            </Link>
            <Link
              href={`/progress/${continuity.childId}`}
              className="text-sm text-pop-magenta underline underline-offset-2"
            >
              Progress
            </Link>
          </div>

          <p className="mt-3 text-[11px] text-pop-night/50">
            {sessionCount === 1 ? "1 session so far" : `${sessionCount} sessions so far`}
          </p>
        </>
      )}
    </article>
  );
}
