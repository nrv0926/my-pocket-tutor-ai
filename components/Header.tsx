import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-cream-300 bg-cream-100/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-serif text-lg text-ink">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-forest-500 text-white">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6.5C3 5.12 4.12 4 5.5 4H11v16H5.5A2.5 2.5 0 0 1 3 17.5v-11Z" />
              <path d="M21 6.5C21 5.12 19.88 4 18.5 4H13v16h5.5a2.5 2.5 0 0 0 2.5-2.5v-11Z" />
            </svg>
          </span>
          <span>
            Pocket<span className="text-forest-500">Tutor</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-ink-soft md:flex">
          <Link href="/dashboard" className="hover:text-forest-500">Dashboard</Link>
          <Link href="/pricing" className="hover:text-forest-500">Pricing</Link>
          <Link href="/settings" className="hover:text-forest-500">Settings</Link>
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <Link
            href="/dashboard"
            className="hidden rounded-full border border-cream-300 px-4 py-2 text-sm font-medium text-ink hover:bg-white sm:inline-flex"
          >
            Sign in
          </Link>
          <Link
            href="/children/new"
            className="inline-flex items-center rounded-full bg-forest-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-forest-600"
          >
            Start free
          </Link>
        </div>
      </div>
    </header>
  );
}
