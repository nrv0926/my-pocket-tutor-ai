"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * Drives a pending session to completion.
 *
 * One POST kicks the processing; an independent polling loop re-checks
 * every few seconds regardless of whether that first request is still
 * in flight. The endpoint is idempotent (conditional pending→processing
 * claim), so overlapping calls never double-run the AI — this makes the
 * UI immune to a dropped connection (e.g. a dev-server recompile
 * killing the long-lived first request).
 */

const POLL_MS = 4000;
const MAX_POLLS = 45; // ~3 minutes total.

type Stage = "working" | "failed";

export default function PendingSessionRunner({
  sessionId,
  initialStatus,
}: {
  sessionId: string;
  initialStatus: "pending" | "processing";
}) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("working");
  const [errorText, setErrorText] = useState<string | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    let cancelled = false;
    let finished = false;
    let inFlight = false;
    let polls = 0;

    async function check(): Promise<void> {
      if (cancelled || finished || inFlight) return;
      inFlight = true;
      try {
        const res = await fetch(`/api/sessions/${sessionId}/process`, {
          method: "POST",
        });
        if (cancelled) return;
        const body = (await res.json().catch(() => ({}))) as {
          status?: string;
          error?: string;
        };

        if (body.status === "done" || body.status === "already_done") {
          finished = true;
          router.refresh();
          return;
        }
        if (body.status === "error" || (!res.ok && res.status !== 429)) {
          finished = true;
          setStage("failed");
          setErrorText(body.error ?? "Generation failed — details below.");
          router.refresh();
          return;
        }
        // "in_flight": someone (possibly our own first call) is working.
      } catch {
        // Network hiccup — the next poll retries.
      } finally {
        inFlight = false;
      }
    }

    // Kick immediately, then poll on an interval as the safety net.
    check();
    const timer = setInterval(() => {
      if (cancelled || finished) return clearInterval(timer);
      polls += 1;
      if (polls > MAX_POLLS) {
        clearInterval(timer);
        setStage("failed");
        setErrorText("This is taking longer than expected. Refresh in a minute — your plan may already be ready.");
        return;
      }
      check();
    }, POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
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
            {initialStatus === "processing"
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
      className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-forest-100 border-t-forest-500"
    />
  );
}
