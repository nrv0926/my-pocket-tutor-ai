import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const TITLE = "AI Pocket Tutor — calm, parent-friendly learning support";
const DESCRIPTION =
  "Turn school materials into a clear plan for what to teach next. Aligned to Ontario curriculum and the science of reading.";

// Vercel sets the two VERCEL_* vars on every deployment, so a deploy that
// forgot NEXT_PUBLIC_APP_URL still resolves share links to the real domain
// instead of localhost.
function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL;
  if (explicit) return explicit;
  const vercel =
    process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  metadataBase: new URL(siteUrl()),
  openGraph: {
    type: "website",
    siteName: "AI Pocket Tutor",
    title: TITLE,
    description: DESCRIPTION,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* next/font would self-host these, but it fetches at build time and
            some CI/sandbox networks block fonts.googleapis.com. The rule below
            targets the Pages Router's _document.js; a <link> in the App Router
            root layout is the supported equivalent. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,600&family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans">
        <a href="#main" className="sr-only focus:not-sr-only">
          Skip to content
        </a>
        <Header />
        <main id="main" className="min-h-[60vh]">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
