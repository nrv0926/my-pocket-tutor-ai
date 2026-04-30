"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * Hamburger + drop-down nav for screens below the `md` breakpoint.
 * Renders nothing visible at `md` and above — the desktop nav in
 * Header.tsx covers that range.
 *
 * Server-fetched auth state is passed in from the parent so this stays
 * a small, focused client component (no Supabase calls).
 */
interface MobileMenuProps {
  isAuthed: boolean;
  userEmail?: string | null;
}

export default function MobileMenu({ isAuthed, userEmail }: MobileMenuProps) {
  const [open, setOpen] = useState(false);

  // Close the drawer if the viewport grows past the `md` breakpoint
  // while it's open (e.g. desktop user resizing).
  useEffect(() => {
    if (!open) return;
    const mql = window.matchMedia("(min-width: 768px)");
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) setOpen(false);
    };
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [open]);

  // Lock body scroll while the drawer is open so the page behind doesn't
  // scroll under the user's thumb.
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        onClick={() => setOpen((v) => !v)}
        className="grid h-10 w-10 place-items-center rounded-lg text-ink hover:bg-cream-200 focus:outline-none focus:ring-2 focus:ring-forest-500/40"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {open ? (
            <>
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </>
          ) : (
            <>
              <path d="M4 6h16" />
              <path d="M4 12h16" />
              <path d="M4 18h16" />
            </>
          )}
        </svg>
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            onClick={close}
            className="fixed inset-0 top-16 z-20 bg-ink/30"
          />
          <nav
            id="mobile-nav-panel"
            className="fixed inset-x-0 top-16 z-30 border-b border-cream-300 bg-cream-100 shadow-lift"
          >
            <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
              <ul className="space-y-1">
                {isAuthed ? (
                  <>
                    <MobileLink href="/dashboard" onClick={close}>Dashboard</MobileLink>
                    <MobileLink href="/session/new" onClick={close}>New session</MobileLink>
                    <MobileLink href="/settings" onClick={close}>Settings</MobileLink>
                  </>
                ) : (
                  <>
                    <MobileLink href="/try" onClick={close}>See a sample plan</MobileLink>
                    <MobileLink href="/#how" onClick={close}>How it works</MobileLink>
                    <MobileLink href="/pricing" onClick={close}>Pricing</MobileLink>
                    <MobileLink href="/login" onClick={close}>Sign in</MobileLink>
                  </>
                )}
              </ul>
              {isAuthed && userEmail && (
                <p className="mt-4 border-t border-cream-300 pt-4 text-xs text-ink-muted">
                  Signed in as {userEmail}
                </p>
              )}
            </div>
          </nav>
        </>
      )}
    </div>
  );
}

function MobileLink({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        onClick={onClick}
        className="block rounded-lg px-3 py-3 text-base font-medium text-ink hover:bg-cream-200"
      >
        {children}
      </Link>
    </li>
  );
}
