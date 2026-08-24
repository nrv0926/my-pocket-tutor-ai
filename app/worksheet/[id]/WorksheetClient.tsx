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
        <div className="rounded-xl border border-pop-night bg-pop-tangerine p-3 text-sm text-pop-night">
          {error}
        </div>
      )}

      {done && (
        <div className="rounded-xl border-[3px] border-pop-night bg-white p-4 text-sm text-pop-night/80 shadow-pop-sm">
          <p>Saved. Your progress is updated for this child.</p>
          <a
            href={`/progress/${childId}`}
            className="mt-2 inline-block text-pop-magenta underline"
          >
            View progress →
          </a>
        </div>
      )}
    </div>
  );
}
