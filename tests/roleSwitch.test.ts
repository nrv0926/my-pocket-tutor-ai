import { describe, expect, it } from "vitest";
import { safeNext } from "@/lib/safeRedirect";
import { ROLES, isRole } from "@/types/child";
import { ROLE_COPY } from "@/lib/roleCopy";

/**
 * Switching role changes what the app asks and how every plan is written, so
 * it has to be reachable after signing in — someone who is both a parent and
 * a teacher was previously stuck with whichever door they came through.
 */
describe("role switching", () => {
  it("offers exactly the three kinds of work", () => {
    expect(ROLES).toEqual(["parent", "homeschooler", "teacher"]);
    for (const r of ROLES) {
      expect(isRole(r)).toBe(true);
      expect(ROLE_COPY[r].subhead.length).toBeGreaterThan(10);
    }
  });

  it("each role really does ask different questions", () => {
    const labels = ROLES.map((r) => ROLE_COPY[r].nicknameLabel);
    expect(new Set(labels).size).toBe(3);
    const goals = ROLES.map((r) => ROLE_COPY[r].goalLabel);
    expect(new Set(goals).size).toBe(3);
  });

  // selectRole redirected to a raw form value before this.
  it("cannot be used to bounce someone off-site", () => {
    for (const evil of [
      "https://evil.example.com",
      "//evil.example.com",
      "/\\evil.example.com",
      "mailto:a@b.c",
      "javascript:alert(1)",
    ]) {
      expect(safeNext(evil, "/children/new")).toBe("/children/new");
    }
  });

  it("still returns to a real page inside the app", () => {
    expect(safeNext("/settings", "/children/new")).toBe("/settings");
    expect(safeNext("/session/new", "/children/new")).toBe("/session/new");
    expect(safeNext(null, "/children/new")).toBe("/children/new");
  });
});
