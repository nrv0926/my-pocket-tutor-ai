import "server-only";

import { getServerSupabase, isSupabaseConfigured } from "@/lib/supabaseServer";

/**
 * What the app has been doing, and whether it has been working.
 *
 * ai_calls has recorded every generation since the beginning — status,
 * latency, model, tokens — and nothing has ever read it. A log nobody reads
 * is a log that does not exist: the first you hear of a failure is an email
 * from the person it happened to.
 *
 * Deliberately small. Not a dashboard, not a chart: the four questions worth
 * asking before you demo the thing, answerable in one query.
 */

export interface Health {
  /** Calls in the window, whatever their outcome. */
  total: number;
  ok: number;
  failed: number;
  quotaBlocked: number;
  /** Median and worst wall-clock time for a successful call, in seconds. */
  medianSeconds: number | null;
  slowestSeconds: number | null;
  /** Estimated spend in the window, from logged token counts. */
  estimatedCost: number | null;
  /** The most recent failure class, so a repeat pattern is visible. */
  lastError: { at: string; errorClass: string } | null;
  windowDays: number;
}

/** Anthropic list price for the models this app runs, per million tokens. */
const PRICES: Record<string, { in: number; out: number }> = {
  "claude-opus-4-7": { in: 5, out: 25 },
  "claude-opus-5": { in: 5, out: 25 },
  "claude-sonnet-5": { in: 2, out: 10 },
  "claude-haiku-4-5": { in: 1, out: 5 },
};

function median(ns: number[]): number | null {
  if (ns.length === 0) return null;
  const s = [...ns].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export async function readHealth(windowDays = 7): Promise<Health | null> {
  if (!isSupabaseConfigured()) return null;

  const since = new Date(Date.now() - windowDays * 86_400_000).toISOString();
  const supabase = getServerSupabase();

  // RLS scopes ai_calls to the signed-in user, so this is "how has it been
  // going for me" rather than a fleet view. That is the right scope for a
  // one-person product and needs no service-role key (CLAUDE.md §3).
  const { data, error } = await supabase
    .from("ai_calls")
    .select("status, error_class, latency_ms, model, input_tokens, output_tokens, cache_read_tokens, created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error || !data) return null;

  const ok = data.filter((r) => r.status === "ok");
  const failed = data.filter((r) => r.status === "error");
  const blocked = data.filter((r) => r.status === "quota_exceeded");

  const latencies = ok
    .map((r) => Number(r.latency_ms))
    .filter((n) => Number.isFinite(n) && n > 0);

  // Cache reads bill at roughly a tenth of the input rate; anything whose
  // model we do not have a price for is skipped rather than guessed at.
  let cost = 0;
  let priced = 0;
  for (const r of ok) {
    const p = PRICES[String(r.model)];
    if (!p) continue;
    priced++;
    const fresh = Number(r.input_tokens ?? 0);
    const cached = Number(r.cache_read_tokens ?? 0);
    const out = Number(r.output_tokens ?? 0);
    cost += (fresh * p.in + cached * p.in * 0.1 + out * p.out) / 1_000_000;
  }

  const firstFail = failed[0];

  return {
    total: data.length,
    ok: ok.length,
    failed: failed.length,
    quotaBlocked: blocked.length,
    medianSeconds: latencies.length ? Number((median(latencies)! / 1000).toFixed(1)) : null,
    slowestSeconds: latencies.length ? Number((Math.max(...latencies) / 1000).toFixed(1)) : null,
    estimatedCost: priced > 0 ? Number(cost.toFixed(2)) : null,
    lastError: firstFail
      ? {
          at: String(firstFail.created_at),
          errorClass: String(firstFail.error_class ?? "unknown"),
        }
      : null,
    windowDays,
  };
}
