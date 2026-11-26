"use client";

import CaptureCard, { type CaptureRow } from "@/components/CaptureCard";
import { saveCapture } from "@/lib/actions/observations";
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
}: {
  sessionId: string;
  worksheet: Worksheet;
  answerKey: { questionId: string; answer: string }[];
  alreadyClosed: boolean;
}) {
  return (
    <CaptureCard
      worksheet={worksheet}
      answerKey={answerKey}
      alreadyClosed={alreadyClosed}
      onSave={async (rows: CaptureRow[]) => {
        await saveCapture({ sessionId, items: rows });
      }}
    />
  );
}
