import type { ProgressSummary } from "@/types/progress";

export default function ProgressTracker({
  summary,
}: {
  summary: ProgressSummary;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Practiced"  value={summary.practicedCount}  tone="practiced" />
        <Stat label="Mastered"   value={summary.masteredCount}   tone="mastered" />
        <Stat label="Struggling" value={summary.strugglingCount} tone="struggling" />
      </div>

      <div className="rounded-2xl border-[3px] border-pop-night bg-white p-5 shadow-pop-sm">
        <h3 className="mb-3 font-display text-lg text-pop-night">Recent skills</h3>
        {summary.recentSkills.length === 0 ? (
          <p className="text-sm text-pop-night/60">
            No sessions yet. Once you create one, recent skills will appear here.
          </p>
        ) : (
          <ul className="divide-y-[2px] divide-pop-night/15">
            {summary.recentSkills.map((s) => (
              <li key={s.skill} className="flex items-center justify-between py-2 text-sm">
                <span className="text-pop-night">{s.skill}</span>
                <span className="rounded-full bg-pop-cream px-2 py-0.5 text-xs capitalize text-pop-night/80">
                  {s.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "practiced" | "mastered" | "struggling";
}) {
  // Ink on every fill: white on pop-pink is 3.34:1, under AA for this size.
  const cls = {
    practiced: "bg-pop-cyan",
    mastered: "bg-pop-lime",
    struggling: "bg-pop-tangerine",
  }[tone];

  return (
    <div
      className={`rounded-2xl border-[3px] border-pop-night p-4 text-pop-night shadow-pop-sm ${cls}`}
    >
      <p className="font-display text-[10px] uppercase tracking-[0.2em]">{label}</p>
      <p className="mt-1 font-display text-3xl">{value}</p>
    </div>
  );
}
