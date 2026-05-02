import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-20 bg-navy text-white/70">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6 px-4 py-10 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-serif text-lg text-white">
          <span aria-hidden>🌱</span> Pocket Tutor
        </Link>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <Link href="/#how" className="hover:text-forest-400">How it works</Link>
          <Link href="/#features" className="hover:text-forest-400">Features</Link>
          <Link href="/#pricing" className="hover:text-forest-400">Pricing</Link>
          <Link href="/PRIVACY.md" className="hover:text-forest-400">Privacy policy</Link>
          <Link href="/#faq" className="hover:text-forest-400">FAQ</Link>
        </nav>
        <p className="text-xs text-white/40">
          &copy; {new Date().getFullYear()} Pocket Tutor &middot; Ontario, Canada &middot; PIPEDA compliant &middot; Data never stored
        </p>
      </div>
    </footer>
  );
}
