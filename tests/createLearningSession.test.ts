import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Integration test for the one end-to-end MVP path:
 *
 *   paste text → generate() → save the session → redirect to /results/[id]
 *
 * The database is faked, but everything above it is the real code: Zod
 * validation, prompt selection, the AI stub, skill mapping, and the row
 * actually handed to Supabase. This exercises the server action, which
 * otherwise only runs against a live project.
 *
 * The recorded insert is asserted against supabase/schema.sql's NOT NULL
 * columns and check constraints, so a drifted column name fails here
 * rather than in front of a parent.
 */

const CHILD_ID = "11111111-1111-4111-8111-111111111111";
const SESSION_ID = "22222222-2222-4222-8222-222222222222";

const calls: { table: string; op: string; payload?: unknown }[] = [];

const CHILD_ROW = {
  grade: "3",
  age: 8,
  curriculum: "ontario",
  learning_needs: ["dyslexia"],
  strengths: "Loves being read to.",
  weaknesses: "Sounding out new words.",
  parent_goal: "Read a chapter book by summer.",
};

function fakeSupabase() {
  return {
    auth: {
      getUser: async () => ({ data: { user: { id: "user-1", email: "p@example.com" } } }),
    },
    rpc: async (name: string) => {
      calls.push({ table: `rpc:${name}`, op: "rpc" });
      return { data: [{ allowed: true, used: 1 }], error: null };
    },
    from(table: string) {
      const chain: Record<string, unknown> = {
        select: () => chain,
        eq: () => chain,
        order: () => chain,
        limit: async () => ({ data: [], error: null }),
        single: async () => {
          if (table === "children") return { data: CHILD_ROW, error: null };
          if (table === "learning_sessions") return { data: { id: SESSION_ID }, error: null };
          return { data: null, error: null };
        },
        insert: (payload: unknown) => {
          calls.push({ table, op: "insert", payload });
          return chain;
        },
      };
      return chain;
    },
  };
}

vi.mock("@/lib/supabaseServer", () => ({
  getServerSupabase: () => fakeSupabase(),
  getCurrentUser: async () => ({ id: "user-1" }),
  ensureUserRow: async () => {},
}));

vi.mock("next/headers", () => ({
  cookies: () => ({ get: () => ({ value: "parent" }), set: () => {}, delete: () => {} }),
}));

vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    const err = new Error(`NEXT_REDIRECT;${url}`);
    (err as Error & { digest: string }).digest = `NEXT_REDIRECT;replace;${url};307;`;
    throw err;
  },
}));

import { createLearningSession } from "@/lib/actions/sessions";

async function runPaste() {
  return createLearningSession({
    childId: CHILD_ID,
    inputType: "paste",
    subject: "reading",
    text: "Reads grade-level text but hesitates on words with blends.",
  }).catch((e: Error) => e);
}

describe("createLearningSession", () => {
  beforeEach(() => {
    calls.length = 0;
  });

  it("redirects to the saved session's results page", async () => {
    const err = (await runPaste()) as Error;
    expect(err.message).toContain("NEXT_REDIRECT");
    expect(err.message).toContain(`/results/${SESSION_ID}`);
  });

  it("consumes quota before calling the model", async () => {
    await runPaste();
    expect(calls.some((c) => c.table === "rpc:consume_ai_quota")).toBe(true);
  });

  it("writes a learning_sessions row that satisfies the schema", async () => {
    await runPaste();
    const insert = calls.find((c) => c.table === "learning_sessions");
    expect(insert, "no learning_sessions insert happened").toBeDefined();

    const row = insert!.payload as Record<string, unknown>;

    // NOT NULL, no default — schema.sql
    for (const col of ["child_id", "input_type", "subject", "analysis_result"]) {
      expect(row[col], `${col} must not be null`).toBeTruthy();
    }

    // check (difficulty in ('easy','medium','hard'))
    expect(["easy", "medium", "hard"]).toContain(row.difficulty);

    // text[] not null default '{}'
    expect(Array.isArray(row.top_skill_gaps)).toBe(true);
    expect((row.top_skill_gaps as string[]).length).toBeGreaterThan(0);

    expect(row.child_id).toBe(CHILD_ID);
    expect(row.input_type).toBe("paste");
    expect(row.subject).toBe("reading");
  });

  it("stores a complete nine-section analysis", async () => {
    await runPaste();
    const row = calls.find((c) => c.table === "learning_sessions")!.payload as Record<
      string,
      unknown
    >;
    const analysis = row.analysis_result as Record<string, unknown>;

    for (const section of [
      "whatINotice",
      "keySkillGaps",
      "whatToTeachNext",
      "howToTeachIt",
      "practiceWorksheet",
      "answerKey",
      "parentTips",
      "nextStepPlan",
      "feedbackQuestion",
    ]) {
      expect(analysis[section], `missing section: ${section}`).toBeTruthy();
    }

    expect(analysis.feedbackQuestion).toBe("Was this too easy, just right, or too hard?");
    expect((analysis.whatToTeachNext as string[]).length).toBe(3);
  });

  it("logs the call without recording any prompt or response text", async () => {
    await runPaste();
    const log = calls.find((c) => c.table === "ai_calls");
    expect(log, "no ai_calls row written").toBeDefined();

    const serialized = JSON.stringify(log!.payload);
    expect(serialized).not.toContain("hesitates");
    expect(serialized).not.toContain("blends");
  });

  it("rejects input that fails validation before touching the model", async () => {
    const err = (await createLearningSession({
      childId: "not-a-uuid",
      inputType: "paste",
      subject: "reading",
      text: "hello there",
    }).catch((e: Error) => e)) as Error;

    expect(err.message).not.toContain("NEXT_REDIRECT");
    expect(calls.some((c) => c.table === "learning_sessions")).toBe(false);
  });
});
