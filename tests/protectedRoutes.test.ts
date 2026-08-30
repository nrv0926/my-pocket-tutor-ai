import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Every page that reads the database must be behind the middleware.
 *
 * getServerSupabase() throws when the environment is not configured, so a
 * page that touches it unguarded returns a 500 instead of redirecting to
 * /login. That is the exact failure that once took every route on the site
 * down, and it came back the moment /plan was added without touching the
 * list — which is why this is a test and not a note.
 *
 * There are two valid ways to be safe, and a page must do one of them:
 *   - sit behind PROTECTED_PREFIXES, so middleware redirects first; or
 *   - call isSupabaseConfigured() before touching the client, which is how a
 *     deliberately public page (/curriculum) reads user data when there is
 *     any and renders fine when there is none.
 */
const middleware = readFileSync("middleware.ts", "utf8");

const prefixes: string[] = (
  middleware.match(/const PROTECTED_PREFIXES = \[([\s\S]*?)\]/)?.[1] ?? ""
)
  .split(",")
  .map((s) => s.trim().replace(/^"|"$/g, ""))
  .filter(Boolean);

/** Every app route that renders a page, as a URL path. */
function routes(dir = "app", base = ""): { route: string; file: string }[] {
  const out: { route: string; file: string }[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      // Route groups (parens) don't appear in the URL.
      const seg = entry.startsWith("(") ? "" : `/${entry}`;
      out.push(...routes(full, base + seg));
    } else if (entry === "page.tsx") {
      out.push({ route: base || "/", file: full });
    }
  }
  return out;
}

describe("protected routes", () => {
  it("has a non-empty list to check against", () => {
    expect(prefixes.length).toBeGreaterThan(5);
    expect(prefixes).toContain("/dashboard");
  });

  it.each(
    routes()
      .filter(({ file }) => readFileSync(file, "utf8").includes("getServerSupabase"))
      .map(({ route, file }) => [route, file] as const)
  )("%s reads the database, so it must be protected or guarded", (route, file) => {
    const behindAuth = prefixes.some((p) => route === p || route.startsWith(`${p}/`));
    const guards = readFileSync(file, "utf8").includes("isSupabaseConfigured()");
    expect(
      behindAuth || guards,
      `${route} touches the database unguarded: add it to PROTECTED_PREFIXES in middleware.ts, or check isSupabaseConfigured() first`
    ).toBe(true);
  });

  it("keeps the deliberately public pages public", () => {
    // /curriculum is the acquisition surface. If it ever lands behind auth,
    // that is a decision, not an accident — so it is asserted here.
    for (const route of ["/curriculum", "/", "/welcome", "/pricing", "/privacy"]) {
      const behindAuth = prefixes.some((p) => route === p || route.startsWith(`${p}/`));
      expect(behindAuth, `${route} should stay public`).toBe(false);
    }
  });
});
