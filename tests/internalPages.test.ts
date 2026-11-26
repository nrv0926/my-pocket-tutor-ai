import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Internal pages are a deliberate decision, not an accident.
 *
 * protectedRoutes.test.ts guards pages that read the DATABASE. A demo or
 * preview page reads none, so it passes that test and ships to the open
 * internet — which is exactly how a fixture carrying three real children's
 * names, grades and named difficulties ended up on a public route.
 *
 * The repo already had the right answer in app/qa-preview/page.tsx: 404 in
 * production. This makes that convention checkable, so the next internal
 * page is either guarded or consciously listed below.
 *
 * Being on the allowlist is not permission to hold real data. No page here
 * may contain a real learner — see the fixture guard at the foot of this
 * file.
 */
const INTENTIONALLY_PUBLIC: Record<string, string> = {
  "/demo":
    "The showcase. The five verbs on one page, built so the product can be " +
    "shown to somebody with no sign-in, no database and no API key. Being " +
    "seen is the whole point of it. Carries a hand-written plan and " +
    "synthetic cases only — tests/showcase.test.ts asserts no real learner " +
    "appears in it.",
  "/demo/loop":
    "The only surface where the assess→teach→practise→recheck loop can be " +
    "driven without Supabase, a sign-in and a saved profile. Reads no " +
    "database and carries synthetic cases only.",
};

const INTERNAL_DIRS = ["app/demo", "app/qa-preview"];

function pagesUnder(dir: string, base: string): { route: string; file: string }[] {
  const out: { route: string; file: string }[] = [];
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      const seg = entry.startsWith("(") ? "" : `/${entry}`;
      out.push(...pagesUnder(full, base + seg));
    } else if (entry === "page.tsx") {
      out.push({ route: base || "/", file: full });
    }
  }
  return out;
}

/** Every .ts/.tsx file under dir, recursively. */
function sourceFilesUnder(dir: string): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return [];
  }
  return entries.flatMap((e) => {
    const full = join(dir, e);
    if (statSync(full).isDirectory()) return sourceFilesUnder(full);
    return /\.tsx?$/.test(e) ? [full] : [];
  });
}

const internalPages = INTERNAL_DIRS.flatMap((d) =>
  pagesUnder(d, `/${d.replace(/^app\//, "")}`),
);

describe("internal pages", () => {
  it("found the internal pages to check", () => {
    expect(internalPages.length).toBeGreaterThan(0);
  });

  it.each(internalPages)(
    "$route is 404'd in production or listed as intentionally public",
    ({ route, file }) => {
      const src = readFileSync(file, "utf8");
      const guarded =
        /process\.env\.NODE_ENV\s*===\s*"production"/.test(src) &&
        /notFound\(\)/.test(src);
      if (guarded) return;
      expect(
        INTENTIONALLY_PUBLIC[route],
        `${route} (${file}) is reachable in production and is not listed in ` +
          `INTENTIONALLY_PUBLIC. Either add the production guard that ` +
          `app/qa-preview/page.tsx uses, or list the route with the reason ` +
          `it must stay public. A page that holds learner data gets the guard.`,
      ).toBeTruthy();
    },
  );

  /**
   * On a PUBLICLY REACHABLE internal page, the fixtures describe cases,
   * never people. A first name beside a grade and a named difficulty
   * identifies a child, and CLAUDE.md 3 keeps names and PII out.
   *
   * Scoped to the unguarded pages on purpose. A page that 404s in
   * production may use a placeholder given name — seeing a name-shaped
   * value is half the point of visual QA — because nobody outside the repo
   * can load it. Strictness follows exposure.
   *
   * This cannot check for names it does not know, so it checks the shape
   * that makes a fixture personal: a `name` or `nickname` whose value is a
   * bare capitalised given name. A case is labelled by what it exercises
   * ("Grade 5 · multiplying"), which carries a digit or a separator.
   */
  const publicDirs = INTERNAL_DIRS.filter((d) =>
    pagesUnder(d, `/${d.replace(/^app\//, "")}`).some(({ file }) => {
      const src = readFileSync(file, "utf8");
      return !(
        /process\.env\.NODE_ENV\s*===\s*"production"/.test(src) &&
        /notFound\(\)/.test(src)
      );
    }),
  );

  const fixtureFiles = publicDirs.flatMap((d) => sourceFilesUnder(d));

  it("found the public internal pages' fixtures to check", () => {
    expect(fixtureFiles.length).toBeGreaterThan(0);
  });

  it.each(fixtureFiles)("%s labels cases, not children", (file) => {
    const src = readFileSync(file, "utf8");
    const personal = [...src.matchAll(/\b(?:name|nickname)\s*[:=]\s*"([^"]+)"/g)]
      .map((m) => m[1])
      .filter((v) => /^[A-Z][a-z]{2,}$/.test(v));
    expect(
      personal,
      `${file} labels a learner with what looks like a given name ` +
        `(${personal.join(", ")}). This page is reachable in production, so ` +
        `label the case by the skill and grade it exercises, not by a ` +
        `person.`,
    ).toEqual([]);
  });
});
