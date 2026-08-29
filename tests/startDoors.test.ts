import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { ROLE_COPY, roleCopy } from "@/lib/roleCopy";
import type { Role } from "@/types/child";

const start = readFileSync("app/start/page.tsx", "utf8");
const bridge = readFileSync("components/PlanBridge.tsx", "utf8");
const results = readFileSync("app/results/[id]/page.tsx", "utf8");

/**
 * Four doors instead of one text box. The single textarea assumed the adult
 * could already name what was wrong; often they cannot — they have a report
 * card they don't fully understand, or they know the topic and not the
 * problem, or they just want to carry on from last week.
 */
describe("the start screen", () => {
  it("offers every way in that the app actually supports", () => {
    expect(start).toContain("/session/new?child=");
    expect(start).toContain('"/upload"');
    expect(start).toContain("/curriculum?child=");
  });

  it("only offers to carry on when there is something to carry on from", () => {
    expect(start).toMatch(/\{thread\.last && \(/);
  });

  it("shows the previous plan's own next step, never a written one", () => {
    expect(start).toMatch(/thread\.last\.nextStepPlan && \(/);
  });

  it("asks the role question first rather than defaulting", () => {
    expect(start).toContain('redirect("/welcome?next=%2Fstart")');
  });

  it("sends someone with no profile to make one", () => {
    expect(start).toContain('redirect("/children/new")');
  });
});

describe("the describe-it door speaks to the reader", () => {
  it.each(["parent", "homeschooler", "teacher"] as Role[])(
    "%s gets their own wording",
    (role) => {
      expect(ROLE_COPY[role].startDescribe.length).toBeGreaterThan(20);
    }
  );

  it("gives each role a different line, not one line three times", () => {
    const lines = (["parent", "homeschooler", "teacher"] as Role[]).map(
      (r) => ROLE_COPY[r].startDescribe
    );
    expect(new Set(lines).size).toBe(3);
  });

  it("never says 'child' to a teacher", () => {
    // A teacher has students, and noticing the difference is the whole point
    // of the role switch.
    expect(ROLE_COPY.teacher.startDescribe).not.toMatch(/\bchild\b/i);
  });

  it("still has a line when nobody has picked a role", () => {
    expect(roleCopy(null).startDescribe.length).toBeGreaterThan(0);
  });
});

/**
 * A report card names the top three priorities and used to stop there,
 * leaving the adult to work out what a month of acting on it looks like —
 * exactly the work they came to avoid.
 */
describe("the bridge from a session to a month", () => {
  it("sits on the results page", () => {
    expect(results).toContain("<PlanBridge");
    expect(results).toContain("hasPlan={hasPlan}");
  });

  it("offers to build when there is no plan, and to open when there is", () => {
    expect(bridge).toContain("Build the 4-week plan");
    expect(bridge).toContain("Open the 4-week plan");
  });

  it("checks for an existing plan rather than always offering to build", () => {
    expect(results).toMatch(/from\("learning_plans"\)/);
  });

  it("stays off the printed page", () => {
    expect(bridge).toContain("print:hidden");
  });
});
