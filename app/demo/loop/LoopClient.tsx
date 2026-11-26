"use client";

import { useState } from "react";
import LoopRunner from "@/components/LoopRunner";
import { LEARNERS, type DemoLearner } from "./fixtures";

/**
 * The loop sandbox: pick a case, record sessions, watch the decision move.
 *
 * Everything that decides anything lives in LoopRunner, which the showcase
 * walkthrough at /demo uses too. This page is the learner picker around it,
 * because the interesting thing here is comparing the three bands — an
 * early reader, a regrouping case and a multiplying case — against the same
 * engine.
 */
export default function LoopClient() {
  const [learner, setLearner] = useState<DemoLearner>(LEARNERS[2]);

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
              onClick={() => setLearner(l)}
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
          Switching case clears the evidence, because it belongs to a person.
        </p>
      </section>

      {/* The key remounts the runner, which is what clears the evidence. */}
      <LoopRunner
        key={learner.id}
        learnerId={learner.id}
        worksheet={learner.worksheet}
        answerKey={learner.answerKey}
        skillId={learner.skillId}
      />
    </div>
  );
}
