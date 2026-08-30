import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

/**
 * ai_calls has logged every generation since the beginning and nothing ever
 * read it. A log nobody reads is a log that does not exist — the first you
 * hear of a failure is an email from the person it happened to.
 */
const health = readFileSync("lib/health.ts", "utf8");
const panel = readFileSync("components/HealthPanel.tsx", "utf8");

describe("what the health read asks", () => {
  it("counts the three outcomes the app actually records", () => {
    // schema.sql: check (status in ('ok','error','quota_exceeded'))
    for (const status of ["ok", "error", "quota_exceeded"]) {
      expect(health, `${status} unhandled`).toContain(`"${status}"`);
    }
  });

  it("reports a typical wait, not just an average that one slow call ruins", () => {
    expect(health).toMatch(/function median/);
    expect(health).toMatch(/slowestSeconds/);
  });

  it("prices cache reads at a tenth, as they are billed", () => {
    expect(health).toMatch(/cached \* p\.in \* 0\.1/);
  });

  it("skips a model it has no price for rather than inventing one", () => {
    expect(health).toMatch(/if \(!p\) continue/);
    expect(health).toMatch(/priced > 0 \? .* : null/);
  });

  it("prices the models this app can actually run", () => {
    // lib/aiService.ts defaults to opus-4-7 and reads ANTHROPIC_MODEL.
    const service = readFileSync("lib/aiService.ts", "utf8");
    const dflt = service.match(/const DEFAULT_MODEL = "([^"]+)"/)?.[1];
    expect(dflt).toBeTruthy();
    expect(health, `${dflt} has no price`).toContain(`"${dflt}"`);
  });

  it("stays inside the signed-in user's own rows", () => {
    // RLS scopes ai_calls by user, and no service-role key appears here.
    expect(health).toContain("getServerSupabase");
    expect(health).not.toMatch(/SERVICE_ROLE/i);
  });

  it("returns null instead of throwing when there is no database", () => {
    expect(health).toMatch(/if \(!isSupabaseConfigured\(\)\) return null/);
    expect(health).toMatch(/if \(error \|\| !data\) return null/);
  });

  it("bounds what it reads", () => {
    expect(health).toMatch(/\.limit\(500\)/);
    expect(health).toMatch(/windowDays = 7/);
  });
});

describe("what the panel says", () => {
  it("has something to say before there is any data", () => {
    expect(panel).toMatch(/No plans generated yet/);
  });

  it("treats a quota block as the cap working, not a fault", () => {
    expect(panel).toMatch(/doing its job, not a fault/);
    expect(panel).toContain("AI_DAILY_LIMIT");
  });

  it("labels the spend as an estimate at list price", () => {
    // Real billing includes cache writes and any discount; this is a guide.
    expect(panel).toMatch(/list price/);
    expect(panel).toMatch(/Est\. spend/);
  });

  it("names the most recent failure class so a pattern is visible", () => {
    expect(panel).toMatch(/Most recent failure/);
  });
});
