"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { getBrowserSupabase } from "@/lib/supabaseBrowser";

export default function LoginPage() {
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-forest-600">
          Sign in
        </p>
        <h1 className="mt-1 font-serif text-3xl text-ink">Welcome back.</h1>
        <p className="mt-2 text-sm text-ink-soft">
          We'll email you a magic link — no password to remember.
        </p>
      </header>

      {status === "sent" ? (
        <div className="rounded-2xl border border-cream-300 bg-white p-6 shadow-card">
          <h2 className="font-serif text-lg text-ink">Check your inbox.</h2>
          <p className="mt-2 text-sm text-ink-soft">
            We sent a sign-in link to <strong>{email}</strong>. It's good for the
            next hour.
          </p>
        </div>
      ) : (
        <form
          className="space-y-4 rounded-2xl border border-cream-300 bg-white p-6 shadow-card"
          onSubmit={async (event) => {
            event.preventDefault();
            setStatus("sending");
            setError(null);
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
              const raw = err instanceof Error ? err.message : "";
              const lower = raw.toLowerCase();
              if (lower.includes("rate limit") || lower.includes("too many")) {
                setError(
                  "We've sent a lot of links to this address recently. Please wait a few minutes, then try again — and check your spam folder for the most recent one.",
                );
              } else if (lower.includes("invalid") && lower.includes("email")) {
                setError("That email address doesn't look right. Please check it and try again.");
              } else {
                setError("Something went wrong sending the link. Please try again in a moment.");
              }
            }
          }}
        >
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink-soft">Email</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@email.com"
              className="w-full rounded-xl border border-cream-300 bg-cream-50 px-3 py-2.5 outline-none focus:border-forest-500 focus:bg-white focus:ring-4 focus:ring-forest-500/15"
            />
          </label>

          <button
            type="submit"
            disabled={status === "sending"}
            className="w-full rounded-full bg-forest-500 px-5 py-3 font-semibold text-white shadow hover:bg-forest-600 disabled:opacity-60"
          >
            {status === "sending" ? "Sending link..." : "Send magic link"}
          </button>

          {error && <p className="text-sm text-amber-700">{error}</p>}

          <p className="text-xs text-ink-muted">
            By signing in you agree to the{" "}
            <a href="/PRIVACY.md" className="text-forest-500 underline">
              privacy promise
            </a>
            .
          </p>
        </form>
      )}
    </div>
  );
}
