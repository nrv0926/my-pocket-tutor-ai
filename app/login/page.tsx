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
        <p className="font-display text-xs uppercase tracking-widest text-pop-magenta">
          Sign in
        </p>
        <h1 className="mt-2 font-display text-4xl uppercase leading-none text-pop-night">Welcome back</h1>
        <p className="mt-2 text-sm font-medium text-pop-night/80">
          We'll email you a magic link — no password to remember.
        </p>
      </header>

      {status === "sent" ? (
        <div className="rounded-2xl border-[3px] border-pop-night bg-pop-lime p-7 shadow-pop">
          <h2 className="font-display text-xl uppercase text-pop-night">Check your inbox</h2>
          <p className="mt-2 text-sm font-medium text-pop-night/80">
            We sent a sign-in link to <strong>{email}</strong>. It's good for the
            next hour.
          </p>
        </div>
      ) : (
        <form
          className="space-y-5 rounded-2xl border-[3px] border-pop-night bg-pop-cream p-7 shadow-pop"
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
              setError(err instanceof Error ? err.message : "Something went wrong.");
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
      )}
    </div>
  );
}
