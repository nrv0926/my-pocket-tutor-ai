"use client";

import { useState } from "react";
import LoadingState from "@/components/LoadingState";
import { createWeeklyPlan } from "@/lib/actions/plans";

/** Server actions throw this internal signal when they call redirect(). */
function isRedirectSignal(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "digest" in err &&
    typeof (err as { digest: unknown }).digest === "string" &&
    (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

export default function BuildPlanButton({
  childId,
  label,
}: {
  childId: string;
  label: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError(null);
          try {
            await createWeeklyPlan({ childId });
          } catch (err) {
            if (isRedirectSignal(err)) throw err;
            setError(err instanceof Error ? err.message : "Could not build the plan.");
          } finally {
            setBusy(false);
          }
        }}
        className="rounded-full border-[3px] border-pop-night bg-pop-pink px-4 py-2.5 font-display text-xs uppercase tracking-wide text-pop-night shadow-pop-sm transition-all hover:bg-pop-yellow disabled:opacity-60"
      >
        {busy ? "Building…" : label}
      </button>
      {busy && <LoadingState label="Writing four weeks…" />}
      {error && (
        <p className="w-full rounded-xl border-[3px] border-pop-night bg-pop-tangerine px-3 py-2 text-sm text-pop-night">
          {error}
        </p>
      )}
    </div>
  );
}
