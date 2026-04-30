import "server-only";

import { getServerSupabase } from "@/lib/supabaseServer";
import type { AIUsage } from "@/lib/aiService";

/**
 * Append-only log of every AI invocation: success, error, and quota
 * rejection. Used for "is the app healthy?" + "how much is this costing
 * per parent?" — not for any user-facing feature.
 *
 * Hard rules (per CLAUDE.md §3 — non-negotiable):
 * - No prompt text, no response text, no parent input.
 * - error_class is the SDK class name only (e.g. "RateLimitError").
 *   Never the message — error messages can echo input.
 *
 * This helper is best-effort. A failed insert MUST NOT crash the request
 * the parent is waiting on; we swallow + console.error so the failure is
 * visible to the operator without breaking the flow.
 */

export type AICallStatus = "ok" | "error" | "quota_exceeded";

export interface AICallLog {
  childId?: string | null;
  promptVersion: string;
  model: string;
  status: AICallStatus;
  errorClass?: string | null;
  latencyMs: number;
  usage?: AIUsage | null;
}

export async function logAICall(entry: AICallLog): Promise<void> {
  try {
    const supabase = getServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("ai_calls").insert({
      user_id: user.id,
      child_id: entry.childId ?? null,
      prompt_version: entry.promptVersion,
      model: entry.model,
      status: entry.status,
      error_class: entry.errorClass ?? null,
      latency_ms: Math.max(0, Math.round(entry.latencyMs)),
      input_tokens: entry.usage?.inputTokens ?? null,
      output_tokens: entry.usage?.outputTokens ?? null,
      cache_read_tokens: entry.usage?.cacheReadTokens ?? null,
      cache_creation_tokens: entry.usage?.cacheCreationTokens ?? null,
    });
    if (error) {
      console.error("[ai_calls] insert failed:", error.message);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    console.error("[ai_calls] logger crashed:", message);
  }
}

/** Pull an SDK / class name out of an unknown error for `error_class`. */
export function classifyError(err: unknown): string {
  if (err instanceof Error && err.name) return err.name;
  if (typeof err === "object" && err !== null && "name" in err) {
    const name = (err as { name?: unknown }).name;
    if (typeof name === "string" && name.length > 0) return name;
  }
  return "UnknownError";
}
