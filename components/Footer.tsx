import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t-[3px] border-pop-night bg-pop-night text-pop-cream">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div>
          <p className="font-display text-xl uppercase">
            Pocket<span className="text-pop-yellow">Tutor</span>
          </p>
          <p className="mt-3 max-w-xs text-sm font-medium text-pop-cream/70">
            Confidence at the kitchen table. Built with parents, teachers, and
            the science of reading.
          </p>
        </div>
        <FooterCol title="Product">
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/settings">Settings</Link>
        </FooterCol>
        <FooterCol title="Trust">
          <Link href="/privacy">Privacy promise</Link>
          <Link href="/security">Security</Link>
        </FooterCol>
        <FooterCol title="Company">
          <a href="mailto:hello@aipockettutor.app">Contact</a>
        </FooterCol>
      </div>
      <div className="border-t border-white/15">
        <p className="mx-auto max-w-6xl px-4 py-4 font-display text-[10px] uppercase tracking-widest text-pop-cream/50 sm:px-6">
          &copy; {new Date().getFullYear()} AI Pocket Tutor. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h5 className="mb-3 font-display text-[10px] uppercase tracking-[0.2em] text-pop-yellow">
        {title}
      </h5>
      <div className="flex flex-col gap-2 text-sm font-medium [&>a:hover]:text-pop-yellow">
        {children}
      </div>
    </div>
  );
}
