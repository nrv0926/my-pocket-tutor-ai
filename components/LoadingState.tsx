export default function LoadingState({ label = "Working on it..." }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-3 rounded-xl border-[3px] border-pop-night bg-white p-4 text-sm text-pop-night/80 shadow-pop-sm"
    >
      <span className="inline-block h-3 w-3 animate-pulse rounded-full bg-pop-pink" />
      <span>{label}</span>
    </div>
  );
}
