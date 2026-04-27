import Link from "next/link";
import AnalysisResultCard from "@/components/AnalysisResultCard";
import { generate } from "@/lib/aiService";
import { ANALYSIS_PROMPT_VERSION } from "@/lib/prompts";
import type { AnalysisResult } from "@/types/session";

/**
 * Server component. Today it calls the AI service stub so the page renders
 * end-to-end. Phase 1.5: load the row from `learning_sessions` by id.
 */
export default async function ResultsPage({ params }: { params: { id: string } }) {
  const result = await generate<AnalysisResult>({
    system: "stubbed system prompt — see lib/prompts in real flow",
    user: "stubbed user prompt",
    expectJson: true,
    promptVersion: ANALYSIS_PROMPT_VERSION,
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-forest-600">
            Analysis · session {params.id}
          </p>
          <h1 className="mt-1 font-serif text-3xl text-ink">Here's the plan.</h1>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/worksheet/${params.id}`}
            className="rounded-full border border-forest-500 px-4 py-2 text-sm font-medium text-forest-600 hover:bg-forest-50"
          >
            Open worksheet
          </Link>
          <Link
            href="/dashboard"
            className="rounded-full bg-forest-500 px-4 py-2 text-sm font-semibold text-white hover:bg-forest-600"
          >
            Back to dashboard
          </Link>
        </div>
      </header>

      <AnalysisResultCard result={result} />
    </div>
  );
}
