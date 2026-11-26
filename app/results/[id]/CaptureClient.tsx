"use client";

import CaptureCard, { type Accommodation, type CaptureRow } from "@/components/CaptureCard";
import { saveCapture, setSessionExcluded } from "@/lib/actions/observations";
import type { Worksheet } from "@/types/session";

/**
 * Thin client wrapper: CaptureCard holds the taps, the server action does
 * the writing. Split only because a server action cannot be handed to a
 * component as a prop from a server component without one.
 */
export default function CaptureClient({
  sessionId,
  worksheet,
  answerKey,
  alreadyClosed,
  sessionExcluded,
  accommodations,
}: {
  sessionId: string;
  worksheet: Worksheet;
  answerKey: { questionId: string; answer: string }[];
  alreadyClosed: boolean;
  sessionExcluded: boolean;
  accommodations: Accommodation[];
}) {
  return (
    <CaptureCard
      worksheet={worksheet}
      answerKey={answerKey}
      alreadyClosed={alreadyClosed}
      sessionExcluded={sessionExcluded}
      accommodations={accommodations}
      onSave={async (rows: CaptureRow[], captureKey: string) => {
        await saveCapture({ sessionId, captureKey, items: rows });
      }}
      onExcludeSession={async (excluded: boolean, reason: string) => {
        await setSessionExcluded({ sessionId, excluded, reason });
      }}
    />
  );
}
