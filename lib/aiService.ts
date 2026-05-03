import Anthropic from "@anthropic-ai/sdk";
import type {
  HomeschoolResult,
  ParentResult,
  TeacherResult,
} from "@/types/session";

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
      messages: [{ role: "user", content: req.user }],
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
 * Each mode returns a shape that matches the corresponding renderer +
 * the schema in lib/prompts.ts.
 * --------------------------------------------------------------------- */
function stubResponse<T>(req: AIRequest): T {
  if (req.promptVersion.startsWith("homeschool@")) {
    return STUB_HOMESCHOOL as unknown as T;
  }
  if (req.promptVersion.startsWith("teacher@")) {
    return STUB_TEACHER as unknown as T;
  }
  if (
    req.promptVersion.startsWith("analysis@") ||
    req.promptVersion.startsWith("report-card@")
  ) {
    return STUB_PARENT as unknown as T;
  }
  return {
    note: "AI provider not configured — returning stub response.",
    promptVersion: req.promptVersion,
  } as unknown as T;
}

const STUB_PARENT: ParentResult = {
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

const STUB_HOMESCHOOL: HomeschoolResult = {
  whatINotice:
    "Decoding is solid on simple words but breaks down on multisyllabic ones. We'll spend the week rebuilding that bridge — short, daily, with one 'win' lesson per day.",
  keySkillGaps: [
    "Splitting 2-syllable words at the syllable boundary",
    "Reading words with vowel teams (ai, ee, oa)",
    "Reading short paragraphs with expression rather than word-by-word",
  ],
  weeklyPlan: [
    { day: "Mon", focus: "Syllable types: closed vs open" },
    { day: "Tue", focus: "Vowel teams ai + ee" },
    { day: "Wed", focus: "Vowel teams oa + ow" },
    { day: "Thu", focus: "Reading 2-syllable words in a sentence" },
    { day: "Fri", focus: "Short paragraph fluency + a celebration check" },
  ],
  dailyLessons: [
    { day: "Mon", subject: "reading", minutes: 20, skill: "Closed-syllable words", activity: "Sort 12 cards into 'closed' vs 'open' bins; read each one out loud.", parentTip: "Model the first 3, then let them try." },
    { day: "Tue", subject: "reading", minutes: 20, skill: "ai + ee words", activity: "Build words on a magnetic board: rain, train, brain; meet, sweet, street.", parentTip: "Say the team sound first, then blend." },
    { day: "Wed", subject: "reading", minutes: 20, skill: "oa + ow words", activity: "Read a 6-sentence story you write together using boat, road, snow, low.", parentTip: "Re-read the story twice — fluency comes from repetition." },
    { day: "Thu", subject: "reading", minutes: 30, skill: "2-syllable words in context", activity: "Read 8 short sentences with words like 'rabbit, sunset, picnic'.", parentTip: "If they stumble, cover one syllable, read the other, then put them together." },
    { day: "Fri", subject: "reading", minutes: 20, skill: "Paragraph fluency", activity: "Re-read Wednesday's story for time. Beat their Wednesday count, no matter by how little.", parentTip: "End with: 'Look how much smoother that was.'" },
  ],
  worksheetSet: [
    {
      title: "Vowel teams: ai + ee",
      difficulty: "easy",
      questions: [
        { id: "q1", prompt: "Read: rain", answer: "rain", difficulty: "easy" },
        { id: "q2", prompt: "Read: meet", answer: "meet", difficulty: "easy" },
        { id: "q3", prompt: "Read: train", answer: "train", difficulty: "easy" },
        { id: "q4", prompt: "Read: street", answer: "street", difficulty: "medium" },
        { id: "q5", prompt: "Fill in: The br___n got wet in the r___n.", answer: "brain / rain", difficulty: "medium" },
      ],
    },
    {
      title: "2-syllable words in sentences",
      difficulty: "medium",
      questions: [
        { id: "q1", prompt: "Read: The rabbit ran into the bushes.", answer: "(read aloud)", difficulty: "medium" },
        { id: "q2", prompt: "Read: We had a picnic at sunset.", answer: "(read aloud)", difficulty: "medium" },
        { id: "q3", prompt: "Read: The kitten landed on the basket.", answer: "(read aloud)", difficulty: "medium" },
        { id: "q4", prompt: "Read: Open the window for the puppy.", answer: "(read aloud)", difficulty: "medium" },
        { id: "q5", prompt: "Read: The robin builds a nest in spring.", answer: "(read aloud)", difficulty: "hard" },
      ],
    },
  ],
  answerKeys: [
    {
      worksheetTitle: "Vowel teams: ai + ee",
      answers: [
        { questionId: "q1", answer: "rain" },
        { questionId: "q2", answer: "meet" },
        { questionId: "q3", answer: "train" },
        { questionId: "q4", answer: "street" },
        { questionId: "q5", answer: "brain / rain" },
      ],
    },
    {
      worksheetTitle: "2-syllable words in sentences",
      answers: [
        { questionId: "q1", answer: "Reads each sentence with reasonable pace, no more than 1 stumble." },
        { questionId: "q2", answer: "Reads with reasonable pace." },
        { questionId: "q3", answer: "Reads with reasonable pace." },
        { questionId: "q4", answer: "Reads with reasonable pace." },
        { questionId: "q5", answer: "Reads with reasonable pace." },
      ],
    },
  ],
  progressChecklist: [
    "Can read 8 of 10 ai/ee words on a flashcard pile in under a minute.",
    "Reads Wednesday's story faster on Friday than on Wednesday.",
    "Splits at least 3 unfamiliar 2-syllable words at the right boundary without prompting.",
  ],
  nextWeekPlan:
    "If they hit the checklist, move to oa/ow + ou/ow next week. If not, repeat this week with smaller word sets and more re-reading.",
  feedbackQuestion: "Was this too easy, just right, or too hard?",
};

const STUB_TEACHER: TeacherResult = {
  groupSummary:
    "The student (or small group) is decoding short words confidently but stalling on multisyllabic words and losing meaning during paragraph reading. Three to five short sessions should rebuild the bridge.",
  keySkillGaps: [
    "Splitting 2-syllable words at the correct boundary",
    "Reading words with vowel teams without sounding letter-by-letter",
    "Re-reading for fluency rather than racing through once",
  ],
  interventionPlan: [
    {
      session: 1,
      focus: "Closed vs open syllables",
      steps: [
        "Warm-up: 6 blend cards, choral read.",
        "Sort 12 cards into closed / open bins, model 3, do 9 together.",
        "Read 5 short words in a sentence frame.",
      ],
    },
    {
      session: 2,
      focus: "Vowel teams ai + ee",
      steps: [
        "Sound drill: 'ai says /ay/, ee says /ee/'.",
        "Build 8 words on letter tiles: rain, train, meet, street, etc.",
        "Read each word in a short sentence.",
      ],
    },
    {
      session: 3,
      focus: "2-syllable words in context",
      steps: [
        "Quick review of last session.",
        "Read 8 sentences using 2-syllable words; cover/uncover syllables when needed.",
        "Dictation of 2 short sentences.",
      ],
    },
    {
      session: 4,
      focus: "Paragraph fluency",
      steps: [
        "Cold read of a 60-word paragraph.",
        "Echo read with the teacher.",
        "Hot read for time; record the gain.",
      ],
    },
  ],
  differentiatedPractice: {
    easy: [
      "Read CVC words (cat, mat, top) on flashcards for 60 seconds.",
      "Match a picture to a CVC word.",
      "Build CVC words on letter tiles.",
    ],
    justRight: [
      "Read ai/ee words in isolation, then in a short sentence.",
      "Blend 6 unfamiliar 2-syllable words split at the boundary.",
      "Re-read a 6-sentence paragraph twice for smoothness.",
    ],
    stretch: [
      "Read a 10-sentence paragraph with mixed vowel teams; underline any word they stumble on.",
      "Write a 2-sentence response to the paragraph using one vowel-team word.",
      "Self-correct: re-read any underlined word using the syllable strategy.",
    ],
  },
  worksheetSet: [
    {
      title: "Vowel teams ai + ee — practice",
      difficulty: "easy",
      questions: [
        { id: "q1", prompt: "Read: rain", answer: "rain", difficulty: "easy" },
        { id: "q2", prompt: "Read: meet", answer: "meet", difficulty: "easy" },
        { id: "q3", prompt: "Read: train", answer: "train", difficulty: "easy" },
        { id: "q4", prompt: "Read: street", answer: "street", difficulty: "medium" },
        { id: "q5", prompt: "Fill in: The br___n got wet in the r___n.", answer: "brain / rain", difficulty: "medium" },
      ],
    },
  ],
  answerKeys: [
    {
      worksheetTitle: "Vowel teams ai + ee — practice",
      answers: [
        { questionId: "q1", answer: "rain" },
        { questionId: "q2", answer: "meet" },
        { questionId: "q3", answer: "train" },
        { questionId: "q4", answer: "street" },
        { questionId: "q5", answer: "brain / rain" },
      ],
    },
  ],
  assessmentCheckpoint:
    "After Session 3: read 8 of 10 ai/ee words in 60 seconds with no more than 1 self-correction. After Session 4: hot-read paragraph is at least 15% faster than cold-read with no loss of accuracy.",
  teacherNotes: [
    "Keep each session to 15–20 minutes. Multiple short sessions beat one long one.",
    "If the group splits in confidence, run differentiated practice in parallel; rejoin for the dictation step.",
    "Recording cold/hot read times in a small notebook is the single best motivator at this age.",
  ],
  feedbackQuestion: "Was this too easy, just right, or too hard?",
};
