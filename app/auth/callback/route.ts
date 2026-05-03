import { NextResponse, type NextRequest } from "next/server";
import { safeRelativePath } from "@/lib/safeRedirect";
import { ensureUserRow, getServerSupabase } from "@/lib/supabaseServer";

/**
 * Magic-link landing route.
 * Supabase redirects users here with `?code=...&next=...` after they click
 * the email link. We exchange the code for a session, ensure their public
 * users row exists, then bounce them to the page they were trying to reach.
 *
 * `next` is treated as untrusted input — only same-origin relative paths
 * are accepted, otherwise we fall back to /dashboard. Rejecting absolute
 * URLs blocks the open-redirect → phishing pattern.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeRelativePath(url.searchParams.get("next"), "/dashboard");

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_code", request.url));
  }

  const supabase = getServerSupabase();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url)
    );
  }

  await ensureUserRow();

  return NextResponse.redirect(new URL(next, request.url));
}
