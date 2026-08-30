"use client";

import { useState } from "react";
import { togglePlanSession } from "@/lib/actions/plans";
import { isDone, planProgress, sessionKey, weekProgress } from "@/lib/planWeek";
import type { PlanWeek, WeeklyPlan } from "@/types/plan";

/**
 * This week, with a box to tick.
 *
 * The month is the plan; the week is what an adult can hold on a Tuesday.
 * Ticking a session is the smallest useful thing this product asks anyone to
 * do, and it is what makes the next plan know where the last one got to.
 */
export default function ThisWeek({
  childId,
  plan,
  week,
  initialCompleted,
}: {
  childId: string;
  plan: WeeklyPlan;
  week: PlanWeek;
  initialCompleted: string[];
}) {
  const [completed, setCompleted] = useState<string[]>(initialCompleted);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const here = weekProgress(week, completed);
  const month = planProgress(plan, completed);

  return (
    <section className="rounded-2xl border-[3px] border-pop-night bg-white p-5 shadow-pop-sm print:hidden">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="font-display text-xl text-pop-night">
          <span className="text-pop-magenta">This week</span> · {week.focus}
        </h2>
        <p className="font-display text-[11px] uppercase tracking-widest text-pop-night/50">
          {here.done} of {here.total} done · {month.done}/{month.total} this month
        </p>
      </div>

      <ol className="mt-4 space-y-2">
        {week.sessions.map((s) => {
          const key = sessionKey(week.week, s.day);
          const done = isDone(completed, week.week, s.day);
          return (
            <li key={key}>
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-xl border-[3px] border-pop-night p-3 transition ${
                  done ? "bg-pop-cream" : "bg-white hover:bg-pop-cyan/25"
                }`}
              >
                <input
                  type="checkbox"
                  checked={done}
                  disabled={busy === key}
                  onChange={async () => {
                    setBusy(key);
                    setError(null);
                    // Tick immediately; the server is the slow part and the
                    // answer is never in doubt.
                    const optimistic = done
                      ? completed.filter((c) => c !== key)
                      : [...completed, key];
                    setCompleted(optimistic);
                    try {
                      setCompleted(await togglePlanSession({ childId, key }));
                    } catch (err) {
                      setCompleted(completed);
                      setError(err instanceof Error ? err.message : "Could not save that.");
                    } finally {
                      setBusy(null);
                    }
                  }}
                  className="mt-0.5 h-5 w-5 shrink-0 accent-pop-magenta"
                />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-baseline gap-x-2">
                    <span className="font-display text-[11px] uppercase tracking-widest text-pop-night/55">
                      {s.day} · {s.minutes} min
                    </span>
                  </span>
                  <span
                    className={`mt-0.5 block font-medium ${
                      done ? "text-pop-night/45 line-through" : "text-pop-night"
                    }`}
                  >
                    {s.skill}
                  </span>
                  {!done && (
                    <span className="mt-0.5 block text-sm text-pop-night/80">{s.activity}</span>
                  )}
                </span>
              </label>
            </li>
          );
        })}
      </ol>

      {error && (
        <p className="mt-3 rounded-xl border-[3px] border-pop-night bg-pop-tangerine px-3 py-2 text-sm text-pop-night">
          {error}
        </p>
      )}

      {here.complete && (
        <p className="mt-4 rounded-xl border-[3px] border-pop-night bg-pop-cyan/30 px-3 py-2.5 text-sm text-pop-night">
          {month.complete
            ? "That is the whole month done. Build a new plan from the latest session whenever you are ready."
            : `Week ${week.week} done. Week ${week.week + 1} is below.`}
        </p>
      )}
    </section>
  );
}
