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
 * - Extended thinking is OFF by default for low latency on parent-facing
 *   analysis. Route operators can opt in per request with
 *   `enableThinking: true`, which sends `{ type: "enabled", budget_tokens }`
 *   per the installed SDK's ThinkingConfigParam shape.
 */

const DEFAULT_MODEL = "claude-opus-4-7";
const DEFAULT_MAX_TOKENS = 16_000;
const DEFAULT_THINKING_BUDGET_TOKENS = 4_096;

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
  /**
   * A file for the model to read itself.
   *
   * Claude reads PDFs and images natively, which is why there is no OCR step
   * anywhere in this app. A report card is usually a phone photo taken at an
   * angle or a scan, and an OCR pass over that loses the table structure —
   * which column a comment sits in is most of the meaning. Handing over the
   * document keeps it.
   */
  attachment?: Attachment;
}

export interface Attachment {
  kind: "image" | "pdf";
  /** e.g. "image/jpeg" or "application/pdf". */
  mediaType: string;
  /** Base64, no newlines, no data: prefix. */
  data: string;
}

export interface AIUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheCreationTokens: number;
}

export interface AIResponse<T> {
  result: T;
  usage: AIUsage | null;
  model: string;
}

/** Returns the model name a generate() call would currently target. */
export function currentModel(): string {
  return process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;
}

export async function generate<T>(req: AIRequest): Promise<AIResponse<T>> {
  const model = currentModel();
  if (!hasKey()) return { result: stubResponse<T>(req), usage: null, model };
  return callClaude<T>(req, model);
}

/**
 * The user turn, with the file first when there is one.
 *
 * Order matters: the API wants a document or image block before the text
 * that refers to it.
 */
function userContent(req: AIRequest): string | Anthropic.ContentBlockParam[] {
  const a = req.attachment;
  if (!a) return req.user;

  const source = { type: "base64" as const, data: a.data };
  const file: Anthropic.ContentBlockParam =
    a.kind === "pdf"
      ? { type: "document", source: { ...source, media_type: "application/pdf" } }
      : {
          type: "image",
          source: {
            ...source,
            media_type: a.mediaType as "image/png" | "image/jpeg" | "image/webp" | "image/gif",
          },
        };

  return [file, { type: "text", text: req.user }];
}

async function callClaude<T>(req: AIRequest, model: string): Promise<AIResponse<T>> {
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
      messages: [{ role: "user", content: userContent(req) }],
      ...(req.enableThinking
        ? {
            thinking: {
              type: "enabled" as const,
              budget_tokens: DEFAULT_THINKING_BUDGET_TOKENS,
            },
          }
        : {}),
    });

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    const result = safeJsonParse<T>(text, req.promptVersion);
    const usage: AIUsage = {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      cacheReadTokens: response.usage.cache_read_input_tokens ?? 0,
      cacheCreationTokens: response.usage.cache_creation_input_tokens ?? 0,
    };
    return { result, usage, model };
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
    // TODO (post-MVP): replace this manual parse with Zod schema validation
    // (or Anthropic's `output_config.format` + `client.messages.parse`) so
    // the response is guaranteed to match the prompt's contract — and
    // bad shapes fail loudly with field-level errors instead of silently
    // type-asserting downstream.
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
