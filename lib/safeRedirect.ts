/**
 * Validate a `next` / `returnTo` URL coming from a query string before
 * redirecting to it. Rejects:
 *   - absolute URLs (https://evil.com/...)
 *   - protocol-relative URLs (//evil.com/...)
 *   - backslash-prefixed paths (\\evil.com — IE / older parsers)
 *   - anything that isn't a non-empty string starting with a single "/"
 *
 * The returned value is always safe to pass to NextResponse.redirect() in
 * combination with `request.url` as the base.
 */
export function safeRelativePath(
  raw: string | null | undefined,
  fallback: string,
): string {
  if (typeof raw !== "string" || raw.length === 0) return fallback;
  if (raw[0] !== "/") return fallback;
  if (raw.startsWith("//") || raw.startsWith("/\\")) return fallback;
  return raw;
}
