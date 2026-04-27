export default function LoadingState({ label = "Working on it..." }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-3 rounded-xl border border-cream-300 bg-white p-4 text-sm text-ink-soft shadow-card"
    >
      <span className="inline-block h-3 w-3 animate-pulse rounded-full bg-forest-500" />
      <span>{label}</span>
    </div>
  );
}
