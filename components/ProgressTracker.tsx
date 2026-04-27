import type { ProgressSummary } from "@/types/progress";

export default function ProgressTracker({
  summary,
}: {
  summary: ProgressSummary;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Practiced"  value={summary.practicedCount}  tone="forest" />
        <Stat label="Mastered"   value={summary.masteredCount}   tone="forest-strong" />
        <Stat label="Struggling" value={summary.strugglingCount} tone="amber" />
      </div>

      <div className="rounded-2xl border border-cream-300 bg-white p-5 shadow-card">
        <h3 className="mb-3 font-serif text-lg text-ink">Recent skills</h3>
        {summary.recentSkills.length === 0 ? (
          <p className="text-sm text-ink-muted">
            No sessions yet. Once you create one, recent skills will appear here.
          </p>
        ) : (
          <ul className="divide-y divide-cream-200">
            {summary.recentSkills.map((s) => (
              <li key={s.skill} className="flex items-center justify-between py-2 text-sm">
                <span className="text-ink">{s.skill}</span>
                <span className="rounded-full bg-cream-100 px-2 py-0.5 text-xs capitalize text-ink-soft">
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
  tone: "forest" | "forest-strong" | "amber";
}) {
  const cls = {
    forest: "bg-forest-50 text-forest-600",
    "forest-strong": "bg-forest-500 text-white",
    amber: "bg-amber-50 text-amber-700",
  }[tone];

  return (
    <div className={`rounded-2xl p-4 shadow-card ${cls}`}>
      <p className="text-xs uppercase tracking-widest opacity-80">{label}</p>
      <p className="mt-1 font-serif text-3xl">{value}</p>
    </div>
  );
}
