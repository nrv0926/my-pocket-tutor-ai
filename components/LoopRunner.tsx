"use client";

import { useMemo, useState } from "react";
import CaptureCard, { type Accommodation, type CaptureRow } from "@/components/CaptureCard";
import NextStepCard from "@/components/NextStepCard";
import { recommend, type ObservationRow } from "@/lib/recommend";
import { ASSESSMENT_DEFAULTS } from "@/lib/config/assessment";
import { verdictToObservation } from "@/types/progress";
import type { Worksheet } from "@/types/session";

/**
 * Record sessions for one learner and watch the next step change.
 *
 * The real CaptureCard, the real recommend(), the real skill graph, against
 * React state. Everything that decides anything is the shipped code; the
 * only thing missing is persistence, so a reload clears it.
 *
 * Extracted from the /demo/loop page so the showcase walkthrough and the
 * loop sandbox share one copy. The capture-to-observation mapping had
 * already been written twice and the second copy scored an "unsure" answer
 * as zero, which is the whole reason verdictToObservation() exists.
 */
export default function LoopRunner({
  learnerId,
  worksheet,
  answerKey,
  skillId,
  accommodations = [],
  headings = true,
}: {
  /** Namespaces the session ids, and resets the card when it changes. */
  learnerId: string;
  worksheet: Worksheet;
  answerKey: { questionId: string; answer: string }[];
  skillId: string;
  accommodations?: Accommodation[];
  /** Off when the surrounding page already numbers its own steps. */
  headings?: boolean;
}) {
  const [observations, setObservations] = useState<ObservationRow[]>([]);
  const [sessionNo, setSessionNo] = useState(1);

  const rec = useMemo(() => recommend(observations), [observations]);
  const sessionsRecorded = new Set(observations.map((o) => o.sessionId)).size;

  const record = (rows: CaptureRow[]) => {
    const sessionId = `${learnerId}-s${sessionNo}`;
    const now = new Date().toISOString();
    setObservations((prev) => [
      ...prev,
      ...rows.map((r) => ({
        itemId: r.itemId,
        sessionId,
        sessionClosedAt: now,
        skillId,
        topicId: skillId,
        modeOfSupport: r.mode,
        ...verdictToObservation(r.verdict),
        attempt: 1,
        excludeFromAdaptation: r.excluded,
        createdAt: now,
      })),
    ]);
    setSessionNo((n) => n + 1);
  };

  const reset = () => {
    setObservations([]);
    setSessionNo(1);
  };

  return (
    <div className="space-y-8">
      <section>
        {headings && (
          <h3 className="mb-1 font-display text-xl text-pop-night">
            Record session {sessionNo}
          </h3>
        )}
        <p className="mb-3 text-sm text-pop-night/70">
          Mark a few wrong, or mark some as needing a nudge, and watch what the
          suggestion does. Saving counts as one finished session.
        </p>
        <CaptureCard
          key={`${learnerId}-${sessionNo}`}
          worksheet={worksheet}
          answerKey={answerKey}
          alreadyClosed={false}
          accommodations={accommodations}
          onSave={async (rows) => {
            record(rows);
          }}
        />
      </section>

      <section>
        {headings && (
          <h3 className="mb-1 font-display text-xl text-pop-night">
            What the engine decides
          </h3>
        )}
        <p className="mb-3 text-sm text-pop-night/70">
          {sessionsRecorded} finished session{sessionsRecorded === 1 ? "" : "s"} recorded.
          It needs {ASSESSMENT_DEFAULTS.minSessions}, each with at least{" "}
          {ASSESSMENT_DEFAULTS.minItemsPerSession} questions done unaided, before it will
          commit to anything.
        </p>
        <NextStepCard rec={rec} />
      </section>

      {observations.length > 0 && (
        <section className="rounded-2xl border-[3px] border-pop-night bg-pop-cream p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-display text-lg text-pop-night">Everything recorded</h3>
            <button
              type="button"
              onClick={reset}
              className="rounded-full border-[3px] border-pop-night bg-white px-4 py-1.5 text-sm font-semibold"
            >
              Start over
            </button>
          </div>
          <p className="mt-1 text-sm text-pop-night/70">
            {observations.length} questions across {sessionsRecorded} session
            {sessionsRecorded === 1 ? "" : "s"}. Prompted and modelled work is kept here
            but never counted above.
          </p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <thead className="text-pop-night/60">
                <tr>
                  <th className="pr-3 font-semibold">Session</th>
                  <th className="pr-3 font-semibold">Item</th>
                  <th className="pr-3 font-semibold">Result</th>
                  <th className="pr-3 font-semibold">Support</th>
                  <th className="font-semibold">Counted</th>
                </tr>
              </thead>
              <tbody>
                {observations.map((o, i) => {
                  const counted =
                    o.status === "scored" &&
                    !o.excludeFromAdaptation &&
                    (o.modeOfSupport === "independent" || o.modeOfSupport === "accommodated");
                  // pending_review used to render here as "wrong", which is
                  // the one thing an unsure answer must never be read as.
                  const result =
                    o.status === "skipped"
                      ? "skipped"
                      : o.status === "pending_review"
                        ? "not sure yet"
                        : o.score === 1
                          ? "right"
                          : "wrong";
                  return (
                    <tr
                      key={`${o.sessionId}-${o.itemId}-${i}`}
                      className="border-t border-pop-night/15"
                    >
                      <td className="py-1 pr-3 font-mono text-xs">{o.sessionId}</td>
                      <td className="py-1 pr-3 font-mono text-xs">{o.itemId}</td>
                      <td className="py-1 pr-3">{result}</td>
                      <td className="py-1 pr-3">{o.modeOfSupport}</td>
                      <td className="py-1">{counted ? "yes" : "no"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
