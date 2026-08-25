import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { ensureUserRow, getServerSupabase } from "@/lib/supabaseServer";
import { safeNext } from "@/lib/safeRedirect";

/**
 * Token-hash landing route for emailed links.
 *
 * /auth/callback handles the PKCE `?code=` flow. This handles the other one:
 * a link the email template builds itself out of `{{ .SiteURL }}` and
 * `{{ .TokenHash }}`.
 *
 * Why both exist: Supabase's `{{ .ConfirmationURL }}` drops the path and query
 * from the requested redirect at email-send time and falls back to the bare
 * Site URL, even when the full URL is on the Redirect URLs allow-list
 * (supabase/auth#2722). A link assembled in the template from .SiteURL plus a
 * literal path can't be stripped that way, because nothing has to match an
 * allow-list entry for it to survive.
 *
 * Email template:
 *   <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=magiclink">
 */

const VALID_TYPES: EmailOtpType[] = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
];

function loginWithError(request: NextRequest, message: string) {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  url.searchParams.set("error", message);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const tokenHash = params.get("token_hash");
  const type = params.get("type") as EmailOtpType | null;

  if (!tokenHash) return loginWithError(request, "missing_token");
  if (!type || !VALID_TYPES.includes(type)) {
    return loginWithError(request, "invalid_link_type");
  }

  const supabase = getServerSupabase();
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
  if (error) return loginWithError(request, error.message);

  await ensureUserRow();

  return NextResponse.redirect(new URL(safeNext(params.get("next")), request.url));
}
