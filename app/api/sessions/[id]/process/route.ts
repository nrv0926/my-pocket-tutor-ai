import { NextResponse, type NextRequest } from "next/server";
import { processLearningSession } from "@/lib/actions/sessions";
import { getCurrentUser } from "@/lib/supabaseServer";

/**
 * Background-style processing endpoint for a pending session.
 *
 * Called by the /results page client component once after redirect, so
 * the user sees a "thinking..." UI while the AI call is in flight
 * instead of a multi-second white screen on submit.
 *
 * Idempotent: re-calls on the same `id` don't re-run the AI. The
 * underlying server action races on a conditional UPDATE — only one
 * caller wins the pending → processing flip.
 *
 * Auth: required. We verify the session cookie at the top and let RLS
 * enforce row ownership inside the action.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  if (!UUID.test(params.id)) {
    return NextResponse.json({ error: "bad id" }, { status: 400 });
  }

  try {
    const status = await processLearningSession(params.id);
    return NextResponse.json({ status });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    console.error(`[sessions/process] ${params.id}:`, message);
    return NextResponse.json({ error: "processing failed" }, { status: 500 });
  }
}
