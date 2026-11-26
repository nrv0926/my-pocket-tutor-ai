import { skillName } from "@/lib/skills";
import type { Recommendation } from "@/lib/recommend";

/**
 * One suggested next step, and the counting behind it.
 *
 * The number shown is a count of questions, never a level. Ontario's 1-4
 * chart means something specific on a report card, and nothing here is
 * that: this says what to do next, not how a child measures up. So the
 * card says "5 of 9 on their own", shows which questions those were, and
 * stops.
 */

const HEADLINE: Record<Recommendation["decision"], (skill: string) => string> = {
  // A colon, because the skill is a label and not the object of the verb:
  // "Ready to stretch Add within 100" reads as a run-on.
  try_transfer: (s) => `Ready to stretch: ${s}`,
  practise_same_skill: (s) => `Practise ${s} again`,
  check_prerequisite: (s) => `Look underneath ${s}`,
  collect_more_evidence: () => "Not enough recorded yet",
};

const EXPLAIN: Record<Recommendation["decision"], string> = {
  try_transfer:
    "They are getting these on their own. Try the same skill somewhere less obvious, or move up one step.",
  practise_same_skill:
    "Keep going with the same skill, with fresh numbers or words. Roughly the same difficulty.",
  check_prerequisite:
    "Before repeating this, check the thing underneath it is solid — a gap there is usually the real cause.",
  collect_more_evidence:
    "Record how a couple of sessions went, question by question, and a suggestion will appear here.",
};

export default function NextStepCard({ rec }: { rec: Recommendation }) {
  const name = rec.skillKey ? skillName(rec.skillKey) : "";
  const { score, maxPoints, sessionIds, items } = rec.evidence;
  const sessions = sessionIds.length;

  return (
    <section className="rounded-2xl border-[3px] border-pop-night bg-white p-5 shadow-pop-sm">
      <p className="font-display text-xs uppercase tracking-widest text-pop-magenta">
        What to do next
      </p>
      <h2 className="mt-1 font-display text-2xl text-pop-night">
        {HEADLINE[rec.decision](name)}
      </h2>

      {rec.decision !== "collect_more_evidence" && maxPoints > 0 && (
        <p className="mt-1 text-pop-night/80">
          {score} of {maxPoints} right on their own, over {sessions} session
          {sessions === 1 ? "" : "s"}.
        </p>
      )}

      <p className="mt-3 max-w-prose text-sm text-pop-night/75">
        {EXPLAIN[rec.decision]}
      </p>

      {rec.reason && rec.decision !== "check_prerequisite" && (
        <p className="mt-2 max-w-prose text-sm text-pop-night/60">{rec.reason}</p>
      )}

      {rec.decision === "check_prerequisite" && rec.prerequisite && (
        <p className="mt-3 rounded-xl border-[3px] border-pop-night bg-pop-cyan px-3 py-2 text-pop-night">
          Start with <strong>{rec.prerequisiteLabel}</strong>.
        </p>
      )}

      {rec.decision === "check_prerequisite" && !rec.prerequisite && (
        <p className="mt-2 max-w-prose text-sm text-pop-night/60">
          Nothing is mapped underneath this one — it is already a starting
          point in its strand. Repeat it with smaller steps rather than
          looking for something before it.
        </p>
      )}

      {items.length > 0 && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-semibold text-pop-night">
            Show the {items.length} question{items.length === 1 ? "" : "s"} this
            is counted from
          </summary>
          <ul className="mt-2 space-y-1 text-sm text-pop-night/75">
            {items.map((i) => (
              <li key={`${i.sessionId}-${i.itemId}`} className="flex gap-2">
                <span
                  className={
                    (i.score ?? 0) === i.maxPoints ? "text-pop-night" : "text-pop-magenta"
                  }
                >
                  {(i.score ?? 0) === i.maxPoints ? "right" : "wrong"}
                </span>
                <span className="font-mono text-xs text-pop-night/50">{i.itemId}</span>
                {i.modeOfSupport === "accommodated" && (
                  <span className="text-xs text-pop-night/50">
                    (helped, but not with this skill)
                  </span>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-pop-night/55">
            Only first attempts they did on their own, from sessions you
            finished. Prompted and modelled work is kept, but not counted here.
          </p>
        </details>
      )}
    </section>
  );
}
