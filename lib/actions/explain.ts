"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { generate, currentModel } from "@/lib/aiService";
import { classifyError, logAICall } from "@/lib/observability";
import { buildExplainPrompt } from "@/lib/prompts";
import { QuotaExceededError, consumeAIQuota } from "@/lib/quota";
import { findExpectation } from "@/lib/curriculum";
import { getServerSupabase } from "@/lib/supabaseServer";
import type { GradeId, Program, SubjectId } from "@/types/curriculum";
import type { Explanation } from "@/types/explain";

const InputSchema = z.object({
  subject: z.string().min(1).max(40),
  grade: z.enum(["K", "1", "2", "3", "4", "5", "6", "7", "8"]),
  program: z.enum(["core", "extended", "immersion"]).nullable().optional(),
  code: z.string().min(2).max(12),
});

/**
 * Explain one expectation in plain English, once, and keep it.
 *
 * Only a signed-in person can trigger a generation. /curriculum is public,
 * and an explanation generated on view would let a crawler spend money —
 * so the public page reads the cache and only a human fills it.
 *
 * The wording handed to the model is looked up from the transcription, never
 * taken from the caller. A request naming a code that does not exist at that
 * grade is refused rather than explained, which is the same rule that stops
 * a plan quoting an expectation Ontario does not have (CLAUDE.md §6).
 */
export async function explainExpectation(input: {
  subject: string;
  grade: string;
  program?: "core" | "extended" | "immersion" | null;
  code: string;
}): Promise<Explanation> {
  const parsed = InputSchema.parse(input);

  const expectation = findExpectation(
    parsed.subject as SubjectId,
    parsed.grade as GradeId,
    parsed.code,
    (parsed.program ?? undefined) as Program["id"] | undefined
  );
  if (!expectation) {
    throw new Error(
      `${parsed.code} is not an expectation at that grade, so there is nothing to explain.`
    );
  }

  const supabase = getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in to add an explanation.");

  // Someone may have asked while this one was being written.
  const { data: existing } = await supabase
    .from("expectation_notes")
    .select("plain, example, try_at_home")
    .match({
      subject: parsed.subject,
      grade: parsed.grade,
      program: parsed.program ?? null,
      code: parsed.code,
    })
    .maybeSingle();

  if (existing) {
    return {
      plain: existing.plain as string,
      example: existing.example as string,
      tryAtHome: existing.try_at_home as string,
    };
  }

  const prompt = buildExplainPrompt({
    code: expectation.code,
    text: expectation.text,
    grade: parsed.grade,
    subject: parsed.subject,
    strandName: expectation.strandName,
  });

  try {
    await consumeAIQuota();
  } catch (err) {
    if (err instanceof QuotaExceededError) {
      await logAICall({
        promptVersion: prompt.version,
        model: currentModel(),
        status: "quota_exceeded",
        errorClass: "QuotaExceededError",
        latencyMs: 0,
      });
    }
    throw err;
  }

  const startedAt = Date.now();
  let aiResponse;
  try {
    // Short output, so a much smaller cap than a full plan needs.
    aiResponse = await generate<Explanation>({
      system: prompt.system,
      user: prompt.user,
      promptVersion: prompt.version,
      maxTokens: 1_000,
    });
  } catch (err) {
    await logAICall({
      promptVersion: prompt.version,
      model: currentModel(),
      status: "error",
      errorClass: classifyError(err),
      latencyMs: Date.now() - startedAt,
    });
    throw err;
  }

  await logAICall({
    promptVersion: prompt.version,
    model: aiResponse.model,
    status: "ok",
    latencyMs: Date.now() - startedAt,
    usage: aiResponse.usage,
  });

  const note = aiResponse.result;

  // Two people asking at once is a race the unique index settles; ignoring
  // the conflict is correct, because either answer is a valid explanation.
  await supabase.from("expectation_notes").insert({
    subject: parsed.subject,
    grade: parsed.grade,
    program: parsed.program ?? null,
    code: parsed.code,
    plain: note.plain,
    example: note.example,
    try_at_home: note.tryAtHome,
    created_by: user.id,
  });

  revalidatePath("/curriculum");
  return note;
}
