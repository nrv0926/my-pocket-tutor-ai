/**
 * Turn Supabase auth errors into something a tired parent at 9pm can act on.
 *
 * CLAUDE.md §2: plain English, no jargon. The raw strings are written for
 * developers — "email rate limit exceeded", "PKCE code verifier not found in
 * storage" — and every one of them has a concrete next step the person can
 * actually take. Say that instead.
 */

const RULES: { match: RegExp; message: string }[] = [
  {
    // Thrown by getBrowserSupabase() when the Supabase env vars are unset.
    // "Try a fresh link" is useless advice here — no link can be sent at all.
    match: /supabase_not_configured|project's URL and Key are required/i,
    message:
      "Sign-in isn't set up on this site yet. You can still see a full sample plan — no account needed.",
  },
  {
    match: /rate limit|too many requests|over_email_send_rate_limit/i,
    message:
      "We've sent too many sign-in emails in the last hour. Give it an hour and try again.",
  },
  {
    match: /otp_expired|invalid or has expired|token has expired|expired/i,
    message:
      "That link has expired — they only last an hour, and only work once. Send yourself a new one.",
  },
  {
    match: /code verifier|pkce/i,
    message:
      "Open the link in the same browser you asked for it from. If you requested it on your laptop, the link has to be opened there too.",
  },
  {
    match: /missing_token|invalid_link_type|missing_code/i,
    message:
      "That link is missing something it needs. Send yourself a fresh one and use the newest email.",
  },
  {
    match: /email not confirmed|email_not_confirmed/i,
    message: "Check your inbox for an earlier email confirming your address first.",
  },
  {
    match: /invalid.*email|email.*invalid|validation_failed/i,
    message: "That email address doesn't look right. Check it and try again.",
  },
  {
    match: /signups? not allowed|signup_disabled/i,
    message: "New sign-ups are turned off for this app right now.",
  },
  {
    match: /fetch failed|network|failed to fetch|ENOTFOUND/i,
    message: "We couldn't reach the sign-in service. Check your connection and try again.",
  },
];

export function friendlyAuthError(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const text = String(raw).trim();
  if (!text) return null;

  for (const { match, message } of RULES) {
    if (match.test(text)) return message;
  }

  return "We couldn't sign you in. Send yourself a fresh link and try again.";
}
