"use client";

import WorksheetCard from "@/components/WorksheetCard";
import type { Worksheet } from "@/types/session";

/**
 * Stub worksheet page. Phase 1.5 will load the worksheet + answer key from
 * the matching `learning_sessions` row.
 */
export default function WorksheetPage({ params }: { params: { id: string } }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-forest-600">
        Worksheet · session {params.id}
      </p>
      <WorksheetCard
        worksheet={MOCK_WORKSHEET}
        answerKey={MOCK_KEY}
        onFeedback={async (f) => {
          // TODO: write a progress_records row + recompute next difficulty.
          console.log("[worksheet] feedback:", f);
        }}
      />
    </div>
  );
}

const MOCK_WORKSHEET: Worksheet = {
  title: "Blends + CVC warm-up",
  difficulty: "easy",
  questions: [
    { id: "q1", prompt: "Read the word: frog",  answer: "frog",  difficulty: "easy" },
    { id: "q2", prompt: "Read the word: stop",  answer: "stop",  difficulty: "easy" },
    { id: "q3", prompt: "Fill in: ___ at  (cat / sat / mat)", answer: "any of cat/sat/mat", difficulty: "easy" },
    { id: "q4", prompt: "Write the sentence: The cat sat on the mat.", answer: "The cat sat on the mat.", difficulty: "medium" },
    { id: "q5", prompt: "Read the word: trip",  answer: "trip",  difficulty: "medium" },
  ],
};

const MOCK_KEY = [
  { questionId: "q1", answer: "frog" },
  { questionId: "q2", answer: "stop" },
  { questionId: "q3", answer: "cat / sat / mat" },
  { questionId: "q4", answer: "The cat sat on the mat." },
  { questionId: "q5", answer: "trip" },
];
