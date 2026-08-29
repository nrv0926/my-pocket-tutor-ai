import type { SetupCheck } from "@/lib/setupCheck";

/**
 * What the database is missing, in the order it will bite.
 *
 * Shown only when something is actually wrong — a permanent green checklist
 * is noise, and nobody reads it after the first week.
 */
export default function SetupStatus({ checks }: { checks: SetupCheck[] }) {
  const broken = checks.filter((c) => c.status === "missing");
  if (broken.length === 0) return null;

  return (
    <section className="rounded-2xl border-[3px] border-pop-night bg-pop-tangerine p-5 shadow-pop-sm">
      <p className="font-display text-[11px] uppercase tracking-widest text-pop-night/70">
        Setup
      </p>
      <h2 className="mt-1 font-display text-xl text-pop-night">
        {broken.length === 1
          ? "One thing is missing from the database."
          : `${broken.length} things are missing from the database.`}
      </h2>
      <p className="mt-1 text-sm text-pop-night/80">
        The code is deployed; the project has not been told about it yet.
      </p>

      <ul className="mt-4 space-y-3">
        {broken.map((c) => (
          <li key={c.id} className="rounded-xl border-[3px] border-pop-night bg-white p-3">
            <p className="font-display text-sm text-pop-night">{c.label}</p>
            <p className="mt-1 text-sm text-pop-night/80">{c.detail}</p>
            <p className="mt-1.5 font-display text-[10px] uppercase tracking-widest text-pop-magenta">
              Blocks: {c.blocks}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
