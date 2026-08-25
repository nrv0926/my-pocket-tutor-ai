import { describe, expect, it } from "vitest";
import { friendlyAuthError } from "@/lib/authErrors";

/**
 * Real strings Supabase returned during setup. Each has a concrete next step,
 * and the raw text says none of it.
 */
describe("friendlyAuthError", () => {
  it("says what to do about the send-rate limit", () => {
    const msg = friendlyAuthError("email rate limit exceeded")!;
    expect(msg).toMatch(/hour/i);
    expect(msg).not.toMatch(/rate limit exceeded/i);
  });

  it("explains an expired link", () => {
    for (const raw of ["otp_expired", "Email link is invalid or has expired"]) {
      expect(friendlyAuthError(raw)).toMatch(/expired|new one/i);
    }
  });

  it("explains the same-browser requirement", () => {
    const msg = friendlyAuthError(
      "PKCE code verifier not found in storage. This can happen if the auth flow was initiated in a different browser or device."
    )!;
    expect(msg).toMatch(/same browser/i);
    expect(msg).not.toMatch(/PKCE|verifier|storage/i);
  });

  it("handles the errors our own routes emit", () => {
    expect(friendlyAuthError("missing_token")).toMatch(/fresh|new/i);
    expect(friendlyAuthError("invalid_link_type")).toMatch(/fresh|new/i);
  });

  it("falls back to something actionable for anything unrecognised", () => {
    const msg = friendlyAuthError("some brand new error nobody has seen")!;
    expect(msg).toMatch(/fresh link|try again/i);
  });

  it("stays quiet when there is no error", () => {
    expect(friendlyAuthError(null)).toBeNull();
    expect(friendlyAuthError(undefined)).toBeNull();
    expect(friendlyAuthError("")).toBeNull();
    expect(friendlyAuthError("   ")).toBeNull();
  });

  it("never leaks developer jargon to a parent", () => {
    const jargon = /PKCE|verifier|token_hash|OTP|SMTP|4\d\d|null|undefined/i;
    for (const raw of [
      "email rate limit exceeded",
      "PKCE code verifier not found in storage",
      "otp_expired",
      "invalid_link_type",
      "AuthApiError: 429",
    ]) {
      expect(friendlyAuthError(raw), `leaked for: ${raw}`).not.toMatch(jargon);
    }
  });
});
