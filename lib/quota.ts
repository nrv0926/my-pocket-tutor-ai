import "server-only";

import { getServerSupabase } from "@/lib/supabaseServer";

/**
 * Daily per-user cap on AI generations. Override via the AI_DAILY_LIMIT env
 * var. Picked deliberately low at MVP — protects you from a runaway client
 * loop or a single abusive user before plan-tier quotas arrive.
 */
const DEFAULT_DAILY_LIMIT = 20;

export class QuotaExceededError extends Error {
  readonly used: number;
  readonly limit: number;
  constructor(used: number, limit: number) {
    super(
      `You've used today's analyses (${used}/${limit}). Come back tomorrow — your child's plan will still be here.`,
    );
    this.name = "QuotaExceededError";
    this.used = used;
    this.limit = limit;
  }
}

function dailyLimit(): number {
  const raw = process.env.AI_DAILY_LIMIT;
  if (!raw) return DEFAULT_DAILY_LIMIT;
  const parsed = parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_DAILY_LIMIT;
}

/**
 * Atomically check + increment the signed-in user's daily AI counter.
 * Throws QuotaExceededError when the user is at or above the cap.
 *
 * Backed by the consume_ai_quota Postgres function (SECURITY DEFINER) so
 * the table cannot be mutated directly from request handlers — even if RLS
 * were misconfigured, the user has no INSERT / UPDATE grant.
 */
export async function consumeAIQuota(): Promise<{ used: number; limit: number }> {
  const supabase = getServerSupabase();
  const limit = dailyLimit();

  const { data, error } = await supabase.rpc("consume_ai_quota", {
    p_limit: limit,
  });
  if (error) throw new Error(`Quota check failed: ${error.message}`);

  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row.allowed !== "boolean" || typeof row.used !== "number") {
    throw new Error("Quota check returned an unexpected shape.");
  }

  if (!row.allowed) throw new QuotaExceededError(row.used, limit);
  return { used: row.used, limit };
}
