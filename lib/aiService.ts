import Anthropic from "@anthropic-ai/sdk";
import type { AnalysisResult } from "@/types/session";

/**
 * The single Claude entry point for the whole app.
 *
 * - Page code never imports the Anthropic SDK directly. It calls
 *   `generate()` here with a `{ system, user, promptVersion }` already built
 *   by a prompt module from /prompts.
 * - Default model is Claude Opus 4.7 (latest at MVP launch). Override per
 *   environment via ANTHROPIC_MODEL.
 * - The shared SYSTEM_PROMPT (see /lib/prompts.ts) is marked for prompt
 *   caching so repeat calls only re-bill the smaller per-task suffix and
 *   the parent's input.
 * - When ANTHROPIC_API_KEY is unset the function returns a deterministic
 *   stub so the UI keeps working in local dev / Storybook without spending
 *   tokens.
 *
 * Per the Claude API guidance for Opus 4.7:
 * - No `temperature`, `top_p`, `top_k` (the API rejects them).
 * - No `budget_tokens` (removed; thinking is adaptive only and off by default).
 * - We default to thinking OFF for low latency on parent-facing analysis;
 *   route operators can flip it on per request via `enableThinking: true`.
 */

const DEFAULT_MODEL = "claude-opus-4-7";
const DEFAULT_MAX_TOKENS = 16_000;

let _client: Anthropic | null = null;
function client(): Anthropic {
  if (!_client) _client = new Anthropic();
  return _client;
}

function hasKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export interface AIRequest {
  /** The full system prompt (SYSTEM_PROMPT + task addendum). */
  system: string;
  /** The per-request user message (child profile + parent input). */
  user: string;
  /** Versioned ID of the prompt builder. Surfaces in errors + eval logs. */
  promptVersion: string;
  /** Opt in to adaptive thinking. Off by default for speed. */
  enableThinking?: boolean;
  /** Override the default 16k output cap. */
  maxTokens?: number;
}

export async function generate<T>(req: AIRequest): Promise<T> {
  if (!hasKey()) return stubResponse<T>(req);
  return callClaude<T>(req);
}

async function callClaude<T>(req: AIRequest): Promise<T> {
  const model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;

  try {
    const response = await client().messages.create({
      model,
      max_tokens: req.maxTokens ?? DEFAULT_MAX_TOKENS,
      // Prompt caching: the system block is large + stable across calls, so
      // we pin a cache breakpoint on it. Cache writes are ~1.25x; subsequent
      // reads are ~0.1x. Activates above the model's minimum prefix size
      // (4096 tokens on Opus 4.7) — falls back to no-op below that.
      system: [
        {
          type: "text",
          text: req.system,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: req.user }],
      ...(req.enableThinking
        ? { thinking: { type: "adaptive" as const } }
        : {}),
    });

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    return safeJsonParse<T>(text, req.promptVersion);
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) {
      throw new Error(`Claude rate-limited (prompt: ${req.promptVersion})`);
    }
    if (err instanceof Anthropic.APIError) {
      throw new Error(
        `Claude ${err.status} (prompt: ${req.promptVersion}): ${err.message}`
      );
    }
    throw err;
  }
}

function safeJsonParse<T>(text: string, version: string): T {
  // Some prompts still leak ```json fences despite the instruction; strip.
  const cleaned = text.replace(/^```(?:json)?|```$/gim, "").trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw new Error(
      `AI returned non-JSON (prompt: ${version}). First 200 chars: ${text.slice(0, 200)}`
    );
  }
}

/* -----------------------------------------------------------------------
 * Deterministic stub used when ANTHROPIC_API_KEY is unset.
 * Lets the UI be developed and demoed end-to-end without spending tokens.
 * --------------------------------------------------------------------- */
function stubResponse<T>(req: AIRequest): T {
  if (
    req.promptVersion.startsWith("analysis@") ||
    req.promptVersion.startsWith("report-card@")
  ) {
    const result: AnalysisResult = {
      whatINotice:
        "Your child is working on grade-level material but is missing some early decoding skills. With short, focused practice they should catch up quickly.",
      keySkillGaps: [
        "Reading words with consonant blends (e.g. 'frog', 'stop')",
        "Holding the short-vowel sound in CVC words",
      ],
      whatToTeachNext: [
        "Daily 5-minute blend drill (initial blends)",
        "Re-read CVC sentences for fluency, not speed",
        "One short sentence dictation per day",
      ],
      howToTeachIt: [
        "Lay out 6 blend cards face up. Say a sound, child picks the card.",
        "Read 5 short CVC sentences out loud together, then child reads alone.",
        "Dictate one sentence; child writes; you fix one thing only.",
      ],
      practiceWorksheet: {
        title: "Blends + CVC warm-up",
        difficulty: "easy",
        questions: [
          { id: "q1", prompt: "Read: frog", answer: "frog", difficulty: "easy" },
          { id: "q2", prompt: "Read: stop", answer: "stop", difficulty: "easy" },
          { id: "q3", prompt: "Fill in: ___ at  (cat/sat/mat)", answer: "any of cat/sat/mat", difficulty: "easy" },
          { id: "q4", prompt: "Write: 'The cat sat on the mat.'", answer: "The cat sat on the mat.", difficulty: "medium" },
          { id: "q5", prompt: "Read: trip", answer: "trip", difficulty: "medium" },
        ],
      },
      answerKey: [
        { questionId: "q1", answer: "frog" },
        { questionId: "q2", answer: "stop" },
        { questionId: "q3", answer: "cat / sat / mat" },
        { questionId: "q4", answer: "The cat sat on the mat." },
        { questionId: "q5", answer: "trip" },
      ],
      parentTips: [
        "Keep it under 10 minutes; stop while it's still going well.",
        "Praise effort, not speed.",
      ],
      nextStepPlan:
        "Tomorrow, repeat the blend drill but swap in 'sl', 'sn', 'sm'. Re-read today's sentences once for fluency.",
      feedbackQuestion: "Was this too easy, just right, or too hard?",
    };
    return result as unknown as T;
  }
  return {
    note: "AI provider not configured — returning stub response.",
    promptVersion: req.promptVersion,
  } as unknown as T;
}
