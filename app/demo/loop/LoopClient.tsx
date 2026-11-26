"use client";

import { useMemo, useState } from "react";
import CaptureCard, { type CaptureRow } from "@/components/CaptureCard";
import NextStepCard from "@/components/NextStepCard";
import { recommend, type ObservationRow } from "@/lib/recommend";
import { ASSESSMENT_DEFAULTS } from "@/lib/config/assessment";
import { verdictToObservation } from "@/types/progress";
import { LEARNERS, type DemoLearner } from "./fixtures";

/**
 * The whole loop, in the browser, with nothing behind it.
 *
 * Every other surface for this needs Supabase, auth and a child profile
 * before a single question can be recorded, which means the one thing
 * nobody has been able to do is watch the loop actually turn. This runs
 * the real CaptureCard, the real recommend() and the real skill graph
 * against React state, so the behaviour can be argued with before any of
 * it is wired to a database.
 *
 * What is real: the capture controls, the qualifying rules, the
 * thresholds, the prerequisite graph, the wording on both cards.
 * What is not: persistence. Reload and it is gone.
 */
export default function LoopClient() {
  const [learner, setLearner] = useState<DemoLearner>(LEARNERS[2]);
  const [observations, setObservations] = useState<ObservationRow[]>([]);
  const [sessionNo, setSessionNo] = useState(1);

  const rec = useMemo(() => recommend(observations), [observations]);

  const sessionsRecorded = new Set(observations.map((o) => o.sessionId)).size;

  const record = (rows: CaptureRow[]) => {
    const sessionId = `${learner.id}-s${sessionNo}`;
    const now = new Date().toISOString();
    setObservations((prev) => [
      ...prev,
      ...rows.map((r) => ({
        itemId: r.itemId,
        sessionId,
        sessionClosedAt: now,
        skillId: learner.skillId,
        topicId: learner.skillId,
        modeOfSupport: r.mode,
        // One shared mapping with the real capture action. This used to be
        // written out here and scored an "unsure" answer as zero, which is
        // the mistake scenario LC-07 exists to prevent.
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
      <section className="rounded-2xl border-[3px] border-pop-night bg-white p-5 shadow-pop-sm">
        <h2 className="font-display text-xl text-pop-night">1. Who are you sitting with?</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {LEARNERS.map((l) => (
            <button
              key={l.id}
              type="button"
              aria-pressed={l.id === learner.id}
              onClick={() => {
                setLearner(l);
                reset();
              }}
              className={`rounded-xl border-[3px] border-pop-night p-3 text-left ${
                l.id === learner.id ? "bg-pop-cyan" : "bg-white hover:bg-pop-cream"
              }`}
            >
              <span className="font-display text-lg text-pop-night">{l.name}</span>
              <span className="block text-xs text-pop-night/60">Grade {l.grade}</span>
              <span className="mt-1 block text-xs text-pop-night/75">{l.because}</span>
            </button>
          ))}
        </div>
        <p className="mt-3 text-sm text-pop-night/70">
          Switching learner clears the evidence, because it belongs to a person.
        </p>
      </section>

      <section>
        <h2 className="mb-1 font-display text-xl text-pop-night">
          2. Record session {sessionNo}
        </h2>
        <p className="mb-3 text-sm text-pop-night/70">
          Mark a few wrong, or mark some as needing a nudge, and watch what the
          suggestion does. Saving counts as one finished session.
        </p>
        <CaptureCard
          key={`${learner.id}-${sessionNo}`}
          worksheet={learner.worksheet}
          answerKey={learner.answerKey}
          alreadyClosed={false}
          onSave={async (rows) => {
            record(rows);
          }}
        />
      </section>

      <section>
        <h2 className="mb-1 font-display text-xl text-pop-night">3. What the engine decides</h2>
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
            <h2 className="font-display text-lg text-pop-night">Everything recorded</h2>
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
                  return (
                    <tr key={`${o.sessionId}-${o.itemId}-${i}`} className="border-t border-pop-night/15">
                      <td className="py-1 pr-3 font-mono text-xs">{o.sessionId}</td>
                      <td className="py-1 pr-3 font-mono text-xs">{o.itemId}</td>
                      <td className="py-1 pr-3">
                        {o.status === "skipped" ? "skipped" : o.score === 1 ? "right" : "wrong"}
                      </td>
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
