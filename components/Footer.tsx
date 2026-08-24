import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-16 bg-forest-600 text-cream-100">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div>
          <p className="font-serif text-lg">
            Pocket<span className="text-forest-50">Tutor</span>
          </p>
          <p className="mt-2 max-w-xs text-sm text-cream-50/70">
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
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-cream-50/60 sm:px-6">
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
      <h5 className="mb-3 text-xs font-semibold uppercase tracking-widest text-cream-50/70">
        {title}
      </h5>
      <div className="flex flex-col gap-2 text-sm [&>a:hover]:text-white">{children}</div>
    </div>
  );
}
