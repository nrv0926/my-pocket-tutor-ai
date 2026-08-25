import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refresh the Supabase auth cookie on every request and gate protected paths.
 * Anyone hitting a protected route without a session is bounced to /login,
 * preserving the original URL as `?next=`.
 */

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/children",
  "/session",
  "/upload",
  "/results",
  "/worksheet",
  "/progress",
  "/settings",
];

export async function middleware(request: NextRequest) {
  const rescued = rescueAuthLanding(request);
  if (rescued) return rescued;

  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  // Touching getUser refreshes the session if it's about to expire.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isProtected = PROTECTED_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  return response;
}

/**
 * Supabase falls back to the project's Site URL when the requested
 * `emailRedirectTo` isn't in the Redirect URLs allowlist. The magic link then
 * lands on `/?code=...` instead of `/auth/callback?code=...`, where nothing
 * exchanges the code and sign-in fails silently with no error shown.
 *
 * The allowlist is still the real fix (see SETUP.md step 4). This forwards the
 * code to the callback anyway so a misconfigured project doesn't look like a
 * broken product, and surfaces auth errors on /login instead of swallowing them.
 */
function rescueAuthLanding(request: NextRequest): NextResponse | null {
  const { pathname, searchParams } = request.nextUrl;
  if (pathname === "/auth/callback" || pathname === "/auth/confirm") return null;

  const error = searchParams.get("error_description") || searchParams.get("error");
  if (error) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("error", error);
    return NextResponse.redirect(url);
  }

  // ?code= belongs to the PKCE flow, ?token_hash= to the emailed-token flow.
  // Either can arrive on the wrong path when Supabase strips the requested
  // redirect down to the bare Site URL.
  const target = searchParams.get("code")
    ? "/auth/callback"
    : searchParams.get("token_hash")
      ? "/auth/confirm"
      : null;
  if (!target) return null;

  const url = request.nextUrl.clone();
  url.pathname = target;
  if (!url.searchParams.get("next") && pathname !== "/") {
    url.searchParams.set("next", pathname);
  }
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    // Run on every page request except Next internals and static assets.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)).*)",
  ],
};
