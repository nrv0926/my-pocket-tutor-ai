import type { AnalysisResult } from "@/types/session";

/**
 * Provider-agnostic AI service.
 *
 * The rest of the app calls `analyze()` and `generate()` here — never an SDK
 * directly. Swap providers by changing AI_PROVIDER in .env.
 *
 * For MVP we ship the abstraction + a deterministic stub so the UI can be
 * built and demoed without a key. Plug a real provider in when ready.
 */

export type AIProvider = "anthropic" | "openai";

export interface AIRequest {
  system: string;
  user: string;
  /** Returned model output is parsed as JSON. */
  expectJson: true;
  promptVersion: string;
}

function provider(): AIProvider {
  const p = (process.env.AI_PROVIDER || "anthropic").toLowerCase();
  if (p !== "anthropic" && p !== "openai") {
    throw new Error(`AI_PROVIDER must be "anthropic" or "openai" (got: ${p})`);
  }
  return p;
}

function hasKey(): boolean {
  return provider() === "anthropic"
    ? Boolean(process.env.ANTHROPIC_API_KEY)
    : Boolean(process.env.OPENAI_API_KEY);
}

/**
 * Single entry point. In production this calls the configured provider; in
 * dev with no key it returns a deterministic stub so the UI keeps working.
 */
export async function generate<T>(req: AIRequest): Promise<T> {
  if (!hasKey()) {
    return stubResponse<T>(req);
  }
  return provider() === "anthropic"
    ? callAnthropic<T>(req)
    : callOpenAI<T>(req);
}

async function callAnthropic<T>(req: AIRequest): Promise<T> {
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
      // Provider-side: do not use customer data for training.
      "anthropic-beta": "no-training-2025-01-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 2000,
      system: req.system,
      messages: [{ role: "user", content: req.user }],
    }),
  });
  if (!res.ok) {
    throw new Error(`Anthropic call failed: ${res.status} ${await res.text()}`);
  }
  const json = await res.json();
  const text = json?.content?.[0]?.text ?? "";
  return safeJsonParse<T>(text, req.promptVersion);
}

async function callOpenAI<T>(req: AIRequest): Promise<T> {
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: req.system },
        { role: "user", content: req.user },
      ],
    }),
  });
  if (!res.ok) {
    throw new Error(`OpenAI call failed: ${res.status} ${await res.text()}`);
  }
  const json = await res.json();
  const text = json?.choices?.[0]?.message?.content ?? "";
  return safeJsonParse<T>(text, req.promptVersion);
}

function safeJsonParse<T>(text: string, version: string): T {
  try {
    // Some models emit a code fence anyway. Strip if present.
    const cleaned = text.replace(/^```(?:json)?|```$/gim, "").trim();
    return JSON.parse(cleaned) as T;
  } catch (err) {
    throw new Error(
      `AI returned non-JSON (prompt: ${version}). First 200 chars: ${text.slice(0, 200)}`
    );
  }
}

/** ------------------------------------------------------------------
 * Deterministic stub used when no API key is configured. Lets the UI be
 * developed/demoed end-to-end without spending tokens.
 * ------------------------------------------------------------------ */
function stubResponse<T>(req: AIRequest): T {
  // Best-effort: if the prompt looks like the analysis prompt, return a valid
  // AnalysisResult; otherwise return a generic placeholder object.
  if (req.promptVersion.startsWith("analysis@")) {
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
          { id: "q3", prompt: "Fill in: ___ at (cat/sat/mat)", answer: "any of cat/sat/mat", difficulty: "easy" },
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
