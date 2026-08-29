"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { generate, currentModel } from "@/lib/aiService";
import { classifyError, logAICall } from "@/lib/observability";
import { buildWeeklyPlanPrompt } from "@/lib/prompts";
import { QuotaExceededError, consumeAIQuota } from "@/lib/quota";
import { NoGapsError } from "@/lib/planErrors";
import { getServerSupabase } from "@/lib/supabaseServer";
import type { Grade, LearningNeed } from "@/types/child";
import type { WeeklyPlan } from "@/types/plan";

/**
 * Build a four-week plan for one child.
 *
 * The generator has existed since April with nothing calling it. It writes
 * five short sessions a week from the child's most recent skill gaps, keeps
 * Friday for review plus one small win, and never skips a phonics stage.
 *
 * It plans from real gaps or it does not plan. A child with no sessions has
 * nothing to build a month out of, and inventing the gaps would make every
 * one of the twenty sessions fiction — so that case is an error the page
 * explains, not a plan we make up (CLAUDE.md §6).
 */
const InputSchema = z.object({ childId: z.string().uuid() });

export async function createWeeklyPlan(input: { childId: string }) {
  const { childId } = InputSchema.parse(input);

  const supabase = getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  // RLS returns no row unless this child belongs to the signed-in user, so
  // the select is the ownership check.
  const { data: child, error: childErr } = await supabase
    .from("children")
    .select("grade, age, curriculum, learning_needs, strengths, weaknesses, parent_goal")
    .eq("id", childId)
    .single();
  if (childErr || !child) throw new Error("Child not found.");

  // The gaps come from the most recent session that actually found some.
  const { data: rows } = await supabase
    .from("learning_sessions")
    .select("top_skill_gaps, created_at")
    .eq("child_id", childId)
    .order("created_at", { ascending: false })
    .limit(5);

  const gaps = (rows ?? [])
    .map((r) => (r.top_skill_gaps ?? []) as string[])
    .find((g) => g.length > 0);

  if (!gaps) throw new NoGapsError();

  const prompt = buildWeeklyPlanPrompt({
    child: {
      grade: child.grade as Grade,
      age: child.age ?? null,
      curriculum: child.curriculum as "ontario" | "common-core" | "other",
      learningNeeds: (child.learning_needs ?? []) as LearningNeed[],
      strengths: child.strengths ?? null,
      weaknesses: child.weaknesses ?? null,
      parentGoal: child.parent_goal ?? null,
    },
    topSkillGaps: gaps,
  });

  try {
    await consumeAIQuota();
  } catch (err) {
    if (err instanceof QuotaExceededError) {
      await logAICall({
        childId,
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
    aiResponse = await generate<WeeklyPlan>({
      system: prompt.system,
      user: prompt.user,
      promptVersion: prompt.version,
    });
  } catch (err) {
    await logAICall({
      childId,
      promptVersion: prompt.version,
      model: currentModel(),
      status: "error",
      errorClass: classifyError(err),
      latencyMs: Date.now() - startedAt,
    });
    throw err;
  }

  await logAICall({
    childId,
    promptVersion: prompt.version,
    model: aiResponse.model,
    status: "ok",
    latencyMs: Date.now() - startedAt,
    usage: aiResponse.usage,
  });

  const { error: insertErr } = await supabase.from("learning_plans").insert({
    child_id: childId,
    source_gaps: gaps,
    plan: aiResponse.result,
  });

  if (insertErr) throw new Error(`Could not save plan: ${insertErr.message}`);

  revalidatePath(`/plan/${childId}`);
  revalidatePath("/dashboard");
  redirect(`/plan/${childId}`);
}
