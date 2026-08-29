import type { PlanWeek, WeeklyPlan } from "@/types/plan";

/**
 * Four weeks, five short sessions each, laid out so a month reads at a
 * glance and prints on paper.
 *
 * Stacked rather than tabbed for the same reason the worksheets are: this
 * gets printed and stuck on a fridge or a planner, and a tab strip prints
 * whichever tab happened to be open.
 */
export default function WeeklyPlanCard({ plan }: { plan: WeeklyPlan }) {
  return (
    <div className="space-y-6">
      {plan.weeks.map((w) => (
        <Week key={w.week} week={w} />
      ))}
    </div>
  );
}

function Week({ week }: { week: PlanWeek }) {
  const minutes = week.sessions.reduce((n, s) => n + s.minutes, 0);

  return (
    <section className="break-inside-avoid rounded-2xl border-[3px] border-pop-night bg-white p-5 shadow-pop-sm">
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b-[3px] border-pop-night pb-3">
        <h2 className="font-display text-xl text-pop-night">
          <span className="text-pop-magenta">Week {week.week}</span> · {week.focus}
        </h2>
        <p className="font-display text-[11px] uppercase tracking-widest text-pop-night/50">
          {week.sessions.length} sessions · {minutes} min
        </p>
      </header>

      <ol className="mt-3 space-y-3">
        {week.sessions.map((s, i) => (
          <li
            key={`${s.day}-${i}`}
            className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 border-b border-pop-night/10 pb-3 last:border-b-0 last:pb-0"
          >
            <span className="rounded-lg bg-pop-cream px-2 py-1 text-center font-display text-[11px] uppercase tracking-wide text-pop-night">
              {s.day}
              <span className="block text-[10px] font-normal text-pop-night/55">
                {s.minutes} min
              </span>
            </span>
            <div className="min-w-0">
              <p className="font-medium text-pop-night">{s.skill}</p>
              <p className="mt-0.5 text-sm text-pop-night/80">{s.activity}</p>
              {s.parentTip && (
                <p className="mt-1 text-xs text-pop-night/65">
                  <span className="font-display uppercase tracking-widest text-pop-magenta">
                    Tip
                  </span>{" "}
                  {s.parentTip}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
