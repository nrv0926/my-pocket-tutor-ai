import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { safeNext } from "@/lib/safeRedirect";
import { isRole } from "@/types/child";

/**
 * The role was only settable from the marketing pages, so anyone arriving by
 * magic link landed with no role — which is not a cosmetic default. Class
 * profiles and achievement levels are shown only to teachers and
 * homeschoolers, so a teacher who never passed /for/teacher never saw the
 * half of the product built for her.
 */
const welcome = readFileSync("app/welcome/page.tsx", "utf8");

describe("the first-run role question", () => {
  it("offers exactly the three roles the app supports", () => {
    for (const r of ["parent", "homeschooler", "teacher"]) {
      expect(isRole(r), `${r} is not a role`).toBe(true);
      expect(welcome).toContain(`role: "${r}"`);
    }
  });

  it("posts to the same action the marketing pages use", () => {
    // One code path for setting a role, so the open-redirect fix that
    // safeNext() gave selectRole cannot be bypassed by a second one.
    expect(welcome).toContain('action={selectRole}');
    expect(welcome).not.toMatch(/setRoleCookie/);
  });

  it("passes its destination through safeNext before rendering it", () => {
    expect(welcome).toMatch(/safeNext\(searchParams\.next/);
  });

  it("does not re-ask someone who has already answered", () => {
    expect(welcome).toMatch(/if \(getRole\(\)\) redirect/);
  });

  it("needs no client JavaScript", () => {
    expect(welcome).not.toContain('"use client"');
  });
});

describe("the entry points that must not default silently", () => {
  it.each([
    ["app/dashboard/page.tsx", "%2Fdashboard"],
    ["app/children/new/page.tsx", "%2Fchildren%2Fnew"],
  ])("%s sends a role-less visitor to the question", (file, encoded) => {
    const src = readFileSync(file, "utf8");
    expect(src).toContain(`redirect("/welcome?next=${encoded}")`);
  });
});

describe("where the question can send you", () => {
  it("keeps an ordinary destination", () => {
    expect(safeNext("/dashboard", "/x")).toBe("/dashboard");
    expect(safeNext("/children/new", "/x")).toBe("/children/new");
  });

  it("refuses to be pointed off the app", () => {
    for (const bad of ["https://evil.example", "//evil.example", "javascript:alert(1)"]) {
      expect(safeNext(bad, "/dashboard")).toBe("/dashboard");
    }
  });
});
