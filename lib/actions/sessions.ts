"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { generate } from "@/lib/aiService";
import { buildAnalysisPrompt, buildReportCardPrompt } from "@/lib/prompts";
import { mapToSkillIds } from "@/lib/skillGapEngine";
import { getServerSupabase } from "@/lib/supabaseServer";
import type { Grade, LearningNeed, Subject } from "@/types/child";
import type { AnalysisResult, SessionInputType } from "@/types/session";

/**
 * Single end-to-end MVP path:
 *
 *   paste text  →  call generate()  →  save the session  →  /results/[id]
 *
 * Inputs validated. RLS scopes child reads to the parent. Uploaded files
 * are not handled here — the input is plain text only at MVP.
 *
 * TODO (post-MVP): replace the manual JSON.parse in aiService.generate()
 * with a Zod-validated structured output (output_config.format /
 * client.messages.parse). Also turn this AnalysisResultSchema into the
 * source of truth for the prompt's expected shape.
 */
const InputSchema = z.object({
  childId: z.string().uuid(),
  inputType: z.enum(["paste", "upload", "description", "plan"]),
  subject: z.enum(["language", "reading", "writing", "math"]),
  text: z.string().min(5).max(8000),
});

export async function createLearningSession(input: {
  childId: string;
  inputType: SessionInputType;
  subject: Subject;
  text: string;
}) {
  const parsed = InputSchema.parse(input);

  const supabase = getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  // RLS: this select returns no rows if the child isn't this parent's, so
  // we don't need a separate ownership check.
  const { data: child, error: childErr } = await supabase
    .from("children")
    .select("grade, age, curriculum, learning_needs, strengths, weaknesses, parent_goal")
    .eq("id", parsed.childId)
    .single();
  if (childErr || !child) throw new Error("Child not found.");

  const childForPrompt = {
    grade: child.grade as Grade,
    age: child.age ?? null,
    curriculum: child.curriculum as "ontario" | "common-core" | "other",
    learningNeeds: (child.learning_needs ?? []) as LearningNeed[],
    strengths: child.strengths ?? null,
    weaknesses: child.weaknesses ?? null,
    parentGoal: child.parent_goal ?? null,
  };

  const prompt =
    parsed.inputType === "paste"
      ? buildReportCardPrompt({ child: childForPrompt, reportText: parsed.text })
      : buildAnalysisPrompt({
          child: childForPrompt,
          subject: parsed.subject,
          parentInput: parsed.text,
        });

  // TODO (post-MVP): pass a Zod schema here so generate() returns a
  // type-safe AnalysisResult instead of the manual cast below.
  const result = await generate<AnalysisResult>({
    system: prompt.system,
    user: prompt.user,
    promptVersion: prompt.version,
  });

  const skillIds = mapToSkillIds(result);

  const { data: inserted, error: insertErr } = await supabase
    .from("learning_sessions")
    .insert({
      child_id: parsed.childId,
      input_type: parsed.inputType,
      subject: parsed.subject,
      raw_input: parsed.text,
      analysis_result: result,
      top_skill_gaps: skillIds.length > 0 ? skillIds : result.whatToTeachNext,
      worksheet: result.practiceWorksheet,
      answer_key: result.answerKey,
      difficulty: result.practiceWorksheet.difficulty,
    })
    .select("id")
    .single();

  if (insertErr || !inserted) {
    throw new Error(`Could not save session: ${insertErr?.message ?? "unknown error"}`);
  }

  revalidatePath("/dashboard");
  revalidatePath(`/progress/${parsed.childId}`);

  // redirect() throws an internal NEXT_REDIRECT signal — the calling
  // client component must rethrow it (see NewSessionForm catch block).
  redirect(`/results/${inserted.id}`);
}
