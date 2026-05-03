"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * Drives a pending session to completion.
 *
 * On mount: POSTs once to /api/sessions/[id]/process, which runs the AI
 * and writes the result back. While that's in flight we show a friendly
 * "thinking" state. When the response comes back we router.refresh() so
 * the server-rendered /results/[id] re-reads the new analysis_result.
 *
 * If the user reloads the page mid-flight (or comes back later), we
 * fall back to polling — the API is idempotent and the underlying
 * action returns "in_flight" or "already_done" without re-billing the
 * AI call.
 */

const POLL_MS = 4000;
const MAX_POLLS = 30; // ~2 minutes total.

export default function PendingSessionRunner({
  sessionId,
  initialStatus,
}: {
  sessionId: string;
  initialStatus: "pending" | "processing";
}) {
  const router = useRouter();
  const [stage, setStage] = useState<"running" | "polling" | "failed">(
    initialStatus === "processing" ? "polling" : "running",
  );
  const [errorText, setErrorText] = useState<string | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    let cancelled = false;
    let polls = 0;

    async function kick() {
      try {
        const res = await fetch(`/api/sessions/${sessionId}/process`, {
          method: "POST",
          headers: { "content-type": "application/json" },
        });
        if (cancelled) return;
        const body = (await res.json().catch(() => ({}))) as {
          status?: string;
          error?: string;
        };
        if (!res.ok) {
          setStage("failed");
          setErrorText(body.error ?? "Processing failed.");
          return;
        }

        if (body.status === "done" || body.status === "already_done") {
          router.refresh();
          return;
        }

        if (body.status === "error") {
          setStage("failed");
          setErrorText("Generation failed. See details below.");
          router.refresh();
          return;
        }

        // status === "in_flight" — another tab is processing. Poll.
        setStage("polling");
        await pollUntilDone();
      } catch (err) {
        if (cancelled) return;
        setStage("failed");
        setErrorText(err instanceof Error ? err.message : "Network error.");
      }
    }

    async function pollUntilDone() {
      while (!cancelled && polls < MAX_POLLS) {
        polls += 1;
        await new Promise((r) => setTimeout(r, POLL_MS));
        if (cancelled) return;
        const res = await fetch(`/api/sessions/${sessionId}/process`, {
          method: "POST",
        });
        const body = (await res.json().catch(() => ({}))) as { status?: string };
        if (body.status === "done" || body.status === "already_done") {
          router.refresh();
          return;
        }
        if (body.status === "error") {
          setStage("failed");
          setErrorText("Generation failed. See details below.");
          router.refresh();
          return;
        }
      }
      if (!cancelled) {
        setStage("failed");
        setErrorText(
          "Still working… we'll keep trying. Refresh in a minute or two.",
        );
      }
    }

    kick();
    return () => {
      cancelled = true;
    };
  }, [router, sessionId]);

  if (stage === "failed") {
    return (
      <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-800">
        <p className="font-medium">Hmm — that didn&rsquo;t complete.</p>
        <p className="mt-1">{errorText}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-cream-300 bg-white p-6 shadow-card">
      <div className="flex items-center gap-3">
        <Spinner />
        <div>
          <p className="font-serif text-lg font-semibold text-forest-600">
            Pocket Tutor is thinking…
          </p>
          <p className="text-sm text-ink-soft">
            {stage === "polling"
              ? "Almost there — picking up where we left off."
              : "Reading your input and choosing what to focus on first."}
          </p>
        </div>
      </div>
      <ul className="mt-5 space-y-1.5 text-sm text-ink-muted">
        <li>· Identifying the specific skill gaps</li>
        <li>· Mapping them to the Ontario curriculum</li>
        <li>· Writing a worksheet that meets your child where they are</li>
      </ul>
    </div>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden
      className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-forest-200 border-t-forest-500"
    />
  );
}
