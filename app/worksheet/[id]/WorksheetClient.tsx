"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import WorksheetCard from "@/components/WorksheetCard";
import { saveParentFeedback } from "@/lib/actions/progress";
import type { Worksheet } from "@/types/session";

export default function WorksheetClient({
  sessionId,
  childId,
  worksheet,
  answerKey,
}: {
  sessionId: string;
  childId: string;
  worksheet: Worksheet;
  answerKey: { questionId: string; answer: string }[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  return (
    <div className="space-y-4">
      <WorksheetCard
        worksheet={worksheet}
        answerKey={answerKey}
        onFeedback={async ({ feedback, completedIndependently }) => {
          setError(null);
          try {
            await saveParentFeedback({
              sessionId,
              feedback,
              completedIndependently,
            });
            setDone(true);
            router.refresh();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Could not save feedback.");
          }
        }}
      />

      {error && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-700">
          {error}
        </div>
      )}

      {done && (
        <div className="rounded-xl border border-cream-300 bg-white p-4 text-sm text-ink-soft shadow-card">
          <p>Saved. Your progress is updated for this child.</p>
          <a
            href={`/progress/${childId}`}
            className="mt-2 inline-block text-forest-500 underline"
          >
            View progress →
          </a>
        </div>
      )}
    </div>
  );
}
