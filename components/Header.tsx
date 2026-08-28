import Link from "next/link";
import MobileMenu from "@/components/MobileMenu";
import { getCurrentUser } from "@/lib/supabaseServer";

export default async function Header() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-40 border-b-[3px] border-pop-night bg-pop-cream">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4 sm:gap-6 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-display text-base uppercase text-pop-night sm:text-lg">
          <span className="grid h-9 w-9 place-items-center rounded-lg border-[3px] border-pop-night bg-pop-pink text-pop-night">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6.5C3 5.12 4.12 4 5.5 4H11v16H5.5A2.5 2.5 0 0 1 3 17.5v-11Z" />
              <path d="M21 6.5C21 5.12 19.88 4 18.5 4H13v16h5.5a2.5 2.5 0 0 0 2.5-2.5v-11Z" />
            </svg>
          </span>
          <span className="hidden min-[360px]:inline">PocketTutor</span>
        </Link>

        {user ? (
          <nav className="hidden items-center gap-6 font-display text-xs uppercase tracking-wide text-pop-night md:flex">
            <Link href="/dashboard" className="hover:text-pop-magenta">Dashboard</Link>
            <Link href="/session/new" className="hover:text-pop-magenta">New session</Link>
            <Link href="/settings" className="hover:text-pop-magenta">Settings</Link>
          </nav>
        ) : (
          <nav className="hidden items-center gap-6 font-display text-xs uppercase tracking-wide text-pop-night md:flex">
            <Link href="/#who" className="hover:text-pop-magenta">Who it&apos;s for</Link>
            <Link href="/#how" className="hover:text-pop-magenta">How it works</Link>
            <Link href="/curriculum" className="hover:text-pop-magenta">Curriculum</Link>
            <Link href="/pricing" className="hover:text-pop-magenta">Pricing</Link>
          </nav>
        )}

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <MobileMenu isAuthed={!!user} userEmail={user?.email} />
          {user ? (
            <>
              <span className="hidden text-xs font-medium text-pop-night/60 sm:inline">{user.email}</span>
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="whitespace-nowrap rounded-full border-[3px] border-pop-night bg-white px-3 py-2 font-display text-xs uppercase tracking-wide text-pop-night shadow-pop-sm sm:px-4 transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden whitespace-nowrap rounded-full border-[3px] border-pop-night bg-white px-3 py-2 font-display text-xs uppercase tracking-wide text-pop-night shadow-pop-sm sm:px-4 transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none sm:inline-flex"
              >
                Sign in
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center whitespace-nowrap rounded-full border-[3px] border-pop-night bg-pop-yellow px-3 py-2 font-display text-xs uppercase tracking-wide text-pop-night shadow-pop-sm sm:px-4 transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
              >
                Start free
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
