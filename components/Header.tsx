import Link from "next/link";
import { getCurrentUser } from "@/lib/supabaseServer";

export default async function Header() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-40 border-b border-cream-300 bg-cream-50/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 font-serif text-lg font-semibold text-forest-600">
          <span className="grid h-9 w-9 place-items-center rounded-[9px] bg-gradient-to-br from-forest-500 to-teal-400 text-white">
            <span aria-hidden className="text-base">🌱</span>
          </span>
          <span>Pocket Tutor</span>
        </Link>

        {user ? (
          <nav className="hidden items-center gap-7 text-sm text-ink-soft md:flex">
            <Link href="/dashboard" className="hover:text-forest-600">Dashboard</Link>
            <Link href="/session/new" className="hover:text-forest-600">New session</Link>
            <Link href="/settings" className="hover:text-forest-600">Settings</Link>
          </nav>
        ) : (
          <nav className="hidden items-center gap-7 text-sm text-ink-soft md:flex">
            <Link href="/#who" className="hover:text-forest-600">Who it&rsquo;s for</Link>
            <Link href="/#how" className="hover:text-forest-600">How it works</Link>
            <Link href="/#pricing" className="hover:text-forest-600">Pricing</Link>
            <Link href="/#faq" className="hover:text-forest-600">FAQ</Link>
          </nav>
        )}

        <div className="ml-auto flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden text-xs text-ink-muted sm:inline">{user.email}</span>
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="rounded-lg border border-cream-300 px-4 py-2 text-sm font-medium text-ink hover:bg-white"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden rounded-lg px-3 py-2 text-sm font-medium text-ink-soft hover:text-forest-600 sm:inline-flex"
              >
                Sign in
              </Link>
              <Link
                href={`/login?next=${encodeURIComponent("/session/new")}`}
                className="inline-flex items-center rounded-lg bg-forest-500 px-4 py-2 text-sm font-medium text-white shadow-glow hover:bg-forest-600"
              >
                Get started free
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
