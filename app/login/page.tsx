"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabaseBrowser";
import { friendlyAuthError } from "@/lib/authErrors";

/**
 * useSearchParams() forces a client-side bailout, which Next refuses to
 * prerender unless it sits inside a Suspense boundary. Only the form below
 * reads the query string, so the heading renders immediately either way.
 */
export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <header className="mb-6">
        <p className="font-display text-xs uppercase tracking-widest text-pop-magenta">
          Sign in
        </p>
        <h1 className="mt-2 font-display text-4xl uppercase leading-none text-pop-night">Welcome back</h1>
        <p className="mt-2 text-sm font-medium text-pop-night/80">
          We&apos;ll email you a magic link — no password to remember.
        </p>
      </header>

      <Suspense fallback={<FormSkeleton />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}

function FormSkeleton() {
  return (
    <div
      aria-hidden
      className="h-64 rounded-2xl border-[3px] border-pop-night bg-pop-cream shadow-pop"
    />
  );
}

function LoginForm() {
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [formError, setFormError] = useState<string | null>(null);

  // /auth/callback and /auth/confirm hand their failures back as ?error=.
  const error = formError ?? friendlyAuthError(params.get("error"));

  if (status === "sent") {
    return (
      <div className="rounded-2xl border-[3px] border-pop-night bg-pop-lime p-7 shadow-pop">
        <h2 className="font-display text-xl uppercase text-pop-night">Check your inbox</h2>
        <p className="mt-2 text-sm font-medium text-pop-night/80">
          We sent a sign-in link to <strong>{email}</strong>. It&apos;s good for the
          next hour, and it has to be opened in this browser.
        </p>
        <ReturnTarget />
      </div>
    );
  }

  return (
    <form
      className="space-y-5 rounded-2xl border-[3px] border-pop-night bg-pop-cream p-7 shadow-pop"
      onSubmit={async (event) => {
        event.preventDefault();
        setStatus("sending");
        setFormError(null);
        try {
          const supabase = getBrowserSupabase();
          const origin = window.location.origin;
          const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(next)}`;
          const { error } = await supabase.auth.signInWithOtp({
            email,
            options: { emailRedirectTo: redirectTo },
          });
          if (error) throw error;
          setStatus("sent");
        } catch (err) {
          setStatus("error");
          setFormError(friendlyAuthError(err instanceof Error ? err.message : null));
        }
      }}
    >
      <label className="block">
        <span className="mb-2 block font-display text-xs uppercase tracking-wide text-pop-night">Email</span>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="alex@email.com"
          className="w-full rounded-xl border-[3px] border-pop-night bg-white px-4 py-3 font-medium outline-none focus:ring-4 focus:ring-pop-pink/40"
        />
      </label>

      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full rounded-full border-[3px] border-pop-night bg-pop-pink px-5 py-3 font-display text-sm uppercase tracking-wide text-pop-night shadow-pop transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-pop-sm disabled:opacity-60"
      >
        {status === "sending" ? "Sending link..." : "Send magic link"}
      </button>

      {error && <p className="rounded-xl border-[3px] border-pop-night bg-pop-tangerine p-3 text-sm font-semibold text-pop-night">{error}</p>}

      <p className="text-xs font-medium text-pop-night/70">
        By signing in you agree to the{" "}
        <a href="/privacy" className="font-semibold underline decoration-[2px] underline-offset-2">
          privacy promise
        </a>
        .
      </p>
    </form>
  );
}

/**
 * Supabase silently falls back to the project's Site URL when the redirect it
 * was asked for isn't on the Redirect URLs allowlist, which is invisible until
 * a link lands somewhere with no handler. Showing the address we asked for
 * makes that mismatch obvious: if the emailed link doesn't match this, the
 * allowlist is the reason.
 *
 * Only shown for local development — on a deployed origin the link is normally
 * fine, and this is noise for a real parent.
 */
function ReturnTarget() {
  const [origin, setOrigin] = useState<string | null>(null);

  useEffect(() => {
    const o = window.location.origin;
    if (/^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(o)) setOrigin(o);
  }, []);

  if (!origin) return null;

  return (
    <div className="mt-4 rounded-xl border-[3px] border-pop-night bg-pop-tangerine p-3 text-xs font-medium text-pop-night">
      <p>
        Local development: the link should return to{" "}
        <code className="font-semibold">{origin}/auth/callback</code>.
      </p>
      <p className="mt-1">
        If the emailed link points somewhere else, add that address under
        Supabase → Authentication → URL Configuration → Redirect URLs. And keep
        this dev server running — the link needs something to open.
      </p>
    </div>
  );
}
