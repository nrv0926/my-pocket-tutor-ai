import type { Child } from "@/types/child";

export const REPORT_CARD_PROMPT_VERSION = "report-card@2026-04-27.1";

/**
 * Specialized prompt for parsing a report card comment / teacher note into
 * actionable next steps. Returns the same nine-section JSON structure.
 */
export function buildReportCardPrompt(args: {
  child: Pick<Child, "grade" | "age" | "curriculum" | "learningNeeds" | "parentGoal">;
  reportText: string;
}): { system: string; user: string; version: string } {
  const { child, reportText } = args;

  const system = `
You are translating a school report card comment into a concrete, kind plan
that a parent can act on tonight.

Your job:
- Identify the SPECIFIC underlying skills the comment is hinting at (teachers
  often write softly — your job is to decode it without judgment of the
  teacher or the child).
- Map those skills to the Ontario curriculum for grade ${child.grade}.
- If the comment suggests the child is behind, step DOWN one grade on the
  affected strand and rebuild before pushing forward.
- Strip and ignore the school name, teacher name, and any student identifier
  in the report text. Never repeat them.

OUTPUT: same 9-section JSON object the analysis prompt uses.
`.trim();

  const user = `
CHILD PROFILE
- Grade: ${child.grade}
- Age: ${child.age ?? "not provided"}
- Curriculum: ${child.curriculum}
- Learning needs: ${child.learningNeeds.join(", ") || "none specified"}
- Parent goal: ${child.parentGoal ?? "not provided"}

REPORT CARD COMMENT:
"""
${reportText}
"""

Return the 9-section JSON object now.
`.trim();

  return { system, user, version: REPORT_CARD_PROMPT_VERSION };
}
