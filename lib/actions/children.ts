"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ensureUserRow, getServerSupabase } from "@/lib/supabaseServer";
import type { ChildInput } from "@/types/child";

const ChildInputSchema = z.object({
  nickname: z.string().min(1).max(40),
  age: z.number().int().min(4).max(14).nullable(),
  kind: z.enum(["student", "class"]).default("student"),
  grade: z.enum(["K", "1", "2", "3", "4", "5", "6", "7", "8"]),
  location: z.string().min(2).default("ON-CA"),
  curriculum: z.enum(["ontario", "common-core", "other"]).default("ontario"),
  learningNeeds: z.array(z.enum(["adhd", "dyslexia", "anxiety", "esl", "other"])).default([]),
  mainConcern: z.string().nullable().optional(),
  strengths: z.string().nullable().optional(),
  weaknesses: z.string().nullable().optional(),
  parentGoal: z.string().nullable().optional(),
});

export async function createChild(input: ChildInput): Promise<{ id: string }> {
  const parsed = ChildInputSchema.parse(input);

  const supabase = getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  // First-action safety net — usually already done by /auth/callback.
  await ensureUserRow();

  const { data, error } = await supabase
    .from("children")
    .insert({
      user_id: user.id,
      nickname: parsed.nickname,
      age: parsed.age,
      kind: parsed.kind,
      grade: parsed.grade,
      location: parsed.location,
      curriculum: parsed.curriculum,
      learning_needs: parsed.learningNeeds,
      main_concern: parsed.mainConcern ?? null,
      strengths: parsed.strengths ?? null,
      weaknesses: parsed.weaknesses ?? null,
      parent_goal: parsed.parentGoal ?? null,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`Could not create child profile: ${error?.message ?? "unknown error"}`);
  }

  revalidatePath("/dashboard");
  return { id: data.id };
}
