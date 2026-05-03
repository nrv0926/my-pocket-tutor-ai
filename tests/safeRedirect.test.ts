import { describe, expect, it } from "vitest";

import { safeRelativePath } from "@/lib/safeRedirect";

/**
 * Open-redirect regression tests. The `next` query string is attacker-
 * controlled (it's in a magic-link email URL); this validator is the only
 * thing standing between a phishing page and our auth flow.
 */
describe("safeRelativePath", () => {
  const FALLBACK = "/dashboard";

  it("accepts a normal same-origin path", () => {
    expect(safeRelativePath("/session/new?mode=parent", FALLBACK)).toBe(
      "/session/new?mode=parent",
    );
  });

  it("falls back when the value is empty or missing", () => {
    expect(safeRelativePath(null, FALLBACK)).toBe(FALLBACK);
    expect(safeRelativePath(undefined, FALLBACK)).toBe(FALLBACK);
    expect(safeRelativePath("", FALLBACK)).toBe(FALLBACK);
  });

  it("rejects absolute URLs (the open-redirect classic)", () => {
    expect(safeRelativePath("https://evil.com/steal", FALLBACK)).toBe(FALLBACK);
    expect(safeRelativePath("http://evil.com", FALLBACK)).toBe(FALLBACK);
  });

  it("rejects protocol-relative URLs", () => {
    expect(safeRelativePath("//evil.com/path", FALLBACK)).toBe(FALLBACK);
  });

  it("rejects backslash-prefixed paths", () => {
    expect(safeRelativePath("/\\evil.com", FALLBACK)).toBe(FALLBACK);
  });

  it("rejects relative paths that don't start with /", () => {
    expect(safeRelativePath("dashboard", FALLBACK)).toBe(FALLBACK);
    expect(safeRelativePath("../../etc/passwd", FALLBACK)).toBe(FALLBACK);
  });

  it("rejects non-string input", () => {
    expect(safeRelativePath(undefined, FALLBACK)).toBe(FALLBACK);
  });
});
