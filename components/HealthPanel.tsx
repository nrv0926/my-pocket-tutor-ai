import LocalTime from "@/components/LocalTime";
import type { Health } from "@/lib/health";

/**
 * Four questions worth asking before you show this to anyone.
 *
 * Shown even when everything is fine — unlike the setup panel, this one is
 * worth a glance precisely when nothing looks wrong, because "it worked
 * fourteen times and failed twice" is invisible from the outside.
 */
export default function HealthPanel({ health }: { health: Health | null }) {
  if (!health) return null;

  if (health.total === 0) {
    return (
      <section className="rounded-2xl border-[3px] border-pop-night bg-white p-5 shadow-pop-sm">
        <p className="font-display text-[11px] uppercase tracking-widest text-pop-night/50">
          Last {health.windowDays} days
        </p>
        <p className="mt-1 text-sm text-pop-night/75">
          No plans generated yet. Numbers appear here once there are some.
        </p>
      </section>
    );
  }

  const failing = health.failed > 0;

  return (
    <section className="rounded-2xl border-[3px] border-pop-night bg-white p-5 shadow-pop-sm">
      <p className="font-display text-[11px] uppercase tracking-widest text-pop-night/50">
        Last {health.windowDays} days
      </p>
      <h2 className="mt-1 font-display text-xl text-pop-night">
        {failing
          ? `${health.failed} of ${health.total} failed.`
          : `${health.ok} plans, none failed.`}
      </h2>

      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Generated" value={String(health.ok)} />
        <Stat label="Failed" value={String(health.failed)} tone={failing ? "bad" : undefined} />
        <Stat
          label="Typical wait"
          value={health.medianSeconds === null ? "—" : `${health.medianSeconds}s`}
          hint={health.slowestSeconds === null ? undefined : `slowest ${health.slowestSeconds}s`}
        />
        <Stat
          label="Est. spend"
          value={health.estimatedCost === null ? "—" : `$${health.estimatedCost.toFixed(2)}`}
          hint="list price, from logged tokens"
        />
      </dl>

      {health.quotaBlocked > 0 && (
        <p className="mt-3 rounded-xl bg-pop-cream px-3 py-2 text-xs text-pop-night">
          {health.quotaBlocked} were stopped by the daily cap. That is the cap
          doing its job, not a fault — raise <code>AI_DAILY_LIMIT</code> if it is
          getting in the way.
        </p>
      )}

      {health.lastError && (
        <p className="mt-3 rounded-xl border-[3px] border-pop-night bg-pop-tangerine px-3 py-2 text-xs text-pop-night">
          Most recent failure: <b>{health.lastError.errorClass}</b>,{" "}
          <LocalTime iso={health.lastError.at} />.
        </p>
      )}
    </section>
  );
}

function Stat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "bad";
}) {
  return (
    <div className="rounded-xl bg-pop-cream px-3 py-2.5">
      <dt className="font-display text-[10px] uppercase tracking-widest text-pop-night/55">
        {label}
      </dt>
      <dd
        className={`mt-0.5 font-display text-2xl tabular-nums ${
          tone === "bad" ? "text-pop-magenta" : "text-pop-night"
        }`}
      >
        {value}
      </dd>
      {hint && <p className="text-[10px] text-pop-night/50">{hint}</p>}
    </div>
  );
}
