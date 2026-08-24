import { describe, expect, it, vi } from "vitest";

/**
 * Supabase falls back to the project's Site URL when the requested
 * `emailRedirectTo` isn't on the Redirect URLs allowlist, so a magic link
 * arrives at `/?code=...` instead of `/auth/callback?code=...`. Nothing
 * exchanges the code there and sign-in fails silently.
 *
 * middleware.ts forwards those strays to the callback. This pins that
 * behaviour, and pins that it does NOT interfere with the callback route
 * itself or with ordinary page loads.
 */

vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({
    auth: { getUser: async () => ({ data: { user: null } }) },
  }),
}));

import { middleware } from "@/middleware";

function request(path: string) {
  const url = new URL(`http://localhost:3000${path}`);
  return {
    nextUrl: {
      pathname: url.pathname,
      searchParams: url.searchParams,
      clone: () => new URL(url.toString()),
    },
    headers: new Headers(),
    cookies: { get: () => undefined, set: () => {} },
    url: url.toString(),
  } as never;
}

async function locationOf(path: string): Promise<string | null> {
  const res = await middleware(request(path));
  return res?.headers.get("location") ?? null;
}

describe("magic-link landing rescue", () => {
  it("forwards a code that landed on the home page", async () => {
    const loc = await locationOf("/?code=c63f4432-5700-43dd-82dc-e93eb2eb2736");
    expect(loc).toContain("/auth/callback");
    expect(loc).toContain("code=c63f4432-5700-43dd-82dc-e93eb2eb2736");
  });

  it("keeps the intended destination when the code lands on a real page", async () => {
    const loc = await locationOf("/dashboard?code=abc123");
    expect(loc).toContain("/auth/callback");
    expect(loc).toContain("code=abc123");
    expect(new URL(loc!).searchParams.get("next")).toBe("/dashboard");
  });

  it("surfaces an auth error on /login instead of swallowing it", async () => {
    const loc = await locationOf(
      "/?error=access_denied&error_description=Email+link+is+invalid+or+has+expired"
    );
    expect(loc).toContain("/login");
    // Read it back the way the login page does — `+` is a valid encoded space
    // in a query string, which decodeURIComponent alone does not undo.
    expect(new URL(loc!).searchParams.get("error")).toBe(
      "Email link is invalid or has expired"
    );
    expect(loc).not.toContain("/auth/callback");
  });

  it("leaves the real callback route alone", async () => {
    const loc = await locationOf("/auth/callback?code=abc123");
    // Either it passes through, or the route handles it — middleware must not
    // bounce it back to itself.
    expect(loc == null || !loc.includes("/auth/callback?code")).toBe(true);
  });

  it("does not touch an ordinary public page", async () => {
    expect(await locationOf("/try")).toBeNull();
  });

  it("still gates a protected route for a signed-out visitor", async () => {
    const loc = await locationOf("/dashboard");
    expect(loc).toContain("/login");
    expect(new URL(loc!).searchParams.get("next")).toBe("/dashboard");
  });
});
