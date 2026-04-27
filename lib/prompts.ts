/**
 * Single barrel export for prompt builders.
 * Page code imports from "@/lib/prompts" so we can swap or version prompts
 * in one place.
 */
export {
  buildAnalysisPrompt,
  ANALYSIS_PROMPT_VERSION,
} from "@/prompts/analysisPrompt";

export {
  buildReportCardPrompt,
  REPORT_CARD_PROMPT_VERSION,
} from "@/prompts/reportCardPrompt";

export {
  buildWorksheetPrompt,
  WORKSHEET_PROMPT_VERSION,
} from "@/prompts/worksheetPrompt";

export {
  buildWeeklyPlanPrompt,
  WEEKLY_PLAN_PROMPT_VERSION,
} from "@/prompts/weeklyPlanPrompt";
