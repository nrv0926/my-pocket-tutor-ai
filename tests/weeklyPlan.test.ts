import { describe, expect, it } from "vitest";
import { z } from "zod";
import { buildWeeklyPlanPrompt, WEEKLY_PLAN_PROMPT_VERSION } from "@/lib/prompts";
import { PLAN_DAYS } from "@/types/plan";

/**
 * The four-week plan generator was written in April and had nothing calling
 * it. These hold the contract now that a page depends on it, the same way
 * analysisShape.test.ts holds the nine sections.
 */
const PlanSession = z.object({
  day: z.enum(["Mon", "Tue", "Wed", "Thu", "Fri"]),
  minutes: z.union([z.literal(10), z.literal(15)]),
  skill: z.string().min(1),
  activity: z.string().min(1),
  parentTip: z.string().min(1),
});

const WeeklyPlanSchema = z.object({
  weeks: z
    .array(
      z.object({
        week: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
        focus: z.string().min(1),
        sessions: z.array(PlanSession).length(5),
      })
    )
    .length(4),
});

const child = {
  grade: "3" as const,
  age: 8,
  curriculum: "ontario" as const,
  learningNeeds: [],
  strengths: null,
  weaknesses: null,
  parentGoal: null,
};

const build = (gaps: string[]) =>
  buildWeeklyPlanPrompt({ child, topSkillGaps: gaps });

describe("the four-week plan prompt", () => {
  it("carries the gaps it was asked to plan from, in priority order", () => {
    const { user } = build(["Blending CVC words", "Vowel teams", "Retelling"]);
    expect(user).toContain("1. Blending CVC words");
    expect(user).toContain("2. Vowel teams");
    expect(user).toContain("3. Retelling");
  });

  it("asks for four weeks of five sessions, not a vague month", () => {
    const { system } = build(["x"]);
    expect(system).toMatch(/Each week has 5 sessions/i);
    expect(system).toMatch(/10.{0,3}15 minutes/i);
  });

  it("keeps Friday for review and one small win", () => {
    // Not a streak or a badge — an adult-run consolidation session is inside
    // the product; a thing a child logs in to collect is a permanent non-goal.
    expect(build(["x"]).system).toMatch(/celebration day/i);
  });

  it("refuses to skip a phonics stage or leave the reading order", () => {
    const { system } = build(["x"]);
    expect(system).toMatch(/never skip a stage/i);
    expect(system).toMatch(/PA .{0,3} Phonics .{0,3} Fluency/i);
  });

  it("starts at the easiest gap rather than the most dramatic one", () => {
    expect(build(["x"]).system).toMatch(/EASIEST gap/);
  });

  it("does not let the workload creep week over week", () => {
    expect(build(["x"]).system).toMatch(/NOT increase homework volume/i);
  });

  it("is versioned, so a change to it is deliberate", () => {
    expect(build(["x"]).version).toBe(WEEKLY_PLAN_PROMPT_VERSION);
    expect(WEEKLY_PLAN_PROMPT_VERSION).toMatch(/^weekly-plan@/);
  });
});

describe("the shape the renderer depends on", () => {
  const sample = {
    weeks: [1, 2, 3, 4].map((n) => ({
      week: n,
      focus: `Week ${n} focus`,
      sessions: PLAN_DAYS.map((day) => ({
        day,
        minutes: 10 as const,
        skill: "Blend CVC words",
        activity: "Read ten words, then build three with letter tiles.",
        parentTip: "If they guess, cover the word and say the sounds first.",
      })),
    })),
  };

  it("accepts a well-formed plan", () => {
    expect(WeeklyPlanSchema.safeParse(sample).success).toBe(true);
  });

  it("rejects a month that is not four weeks", () => {
    const short = { weeks: sample.weeks.slice(0, 3) };
    expect(WeeklyPlanSchema.safeParse(short).success).toBe(false);
  });

  it("rejects a week that is not five sessions", () => {
    const thin = {
      weeks: [{ ...sample.weeks[0], sessions: sample.weeks[0].sessions.slice(0, 4) }, ...sample.weeks.slice(1)],
    };
    expect(WeeklyPlanSchema.safeParse(thin).success).toBe(false);
  });

  it("rejects a session longer than the promise on the page", () => {
    const long = {
      weeks: [
        { ...sample.weeks[0], sessions: [{ ...sample.weeks[0].sessions[0], minutes: 45 }, ...sample.weeks[0].sessions.slice(1)] },
        ...sample.weeks.slice(1),
      ],
    };
    expect(WeeklyPlanSchema.safeParse(long).success).toBe(false);
  });

  it("gives every session something for the adult to do", () => {
    for (const w of sample.weeks) {
      for (const s of w.sessions) {
        expect(s.activity.length, `${w.week} ${s.day}`).toBeGreaterThan(0);
        expect(s.parentTip.length, `${w.week} ${s.day}`).toBeGreaterThan(0);
      }
    }
  });
});
