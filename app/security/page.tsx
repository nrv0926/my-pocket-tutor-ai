import type { Metadata } from "next";
import Link from "next/link";
import { DocList, DocPage, DocSection } from "@/components/DocPage";

export const metadata: Metadata = {
  title: "Security — AI Pocket Tutor",
  description:
    "How we keep one family's data out of another family's account, and child details out of our logs.",
};

export default function SecurityPage() {
  return (
    <DocPage
      eyebrow="Security"
      title={
        <>
          Built around the two ways this <em className="text-pop-magenta">could go wrong.</em>
        </>
      }
      lead="The most sensitive thing this app touches is information about a real child. Two failure modes matter most: one family's data becoming readable by another, and a child's details leaking into logs or third-party systems. Everything here is designed around those two."
    >
      <DocSection title="Signing in">
        <DocList
          items={[
            "Sign-in is a magic link emailed to you — there is no password for anyone to guess, reuse, or leak.",
            "Session cookies are HTTP-only, Secure, and SameSite=Lax, so scripts on the page can't read them.",
            "Every server-rendered page runs as the logged-in user, never with an admin key.",
          ]}
        />
      </DocSection>

      <DocSection title="One family can never see another">
        <p>
          Every table has Row-Level Security switched on in the database itself. Each
          row is stamped with the account that owns it, and the database refuses to
          return rows to anyone else — no matter what the application code asks for.
        </p>
        <p>
          This matters because it isn&apos;t a check we can forget to write. A bug in a
          page can&apos;t bypass it; the rule lives one layer below the app.
        </p>
        <p>
          When teacher accounts arrive, they&apos;ll get an explicit grant from the
          parent. We will not loosen these rules to make that easier.
        </p>
      </DocSection>

      <DocSection title="Uploaded files">
        <DocList
          items={[
            "The storage bucket is private. There is no public link to anything in it.",
            "Files upload straight from your browser to storage using a short-lived signed URL, so the bytes never pass through our servers.",
            "Each file's path contains a random ID — paths can't be guessed.",
            "Size and file type are enforced on the server, and filenames are stripped of anything that could escape the folder.",
            "Files are deleted once the analysis is done, unless you explicitly asked us to keep one.",
          ]}
        />
      </DocSection>

      <DocSection title="What never gets written down">
        <p>
          We log IDs and counts — never file contents, never names, never the text you
          paste in. If you searched our logs for a child&apos;s name, there would be
          nothing to find.
        </p>
        <p>
          The same goes for our AI cost records: they store how long a call took and
          how many tokens it used, never the prompt or the response.
        </p>
      </DocSection>

      <DocSection title="The AI boundary">
        <DocList
          items={[
            "The AI receives the minimum it needs and nothing about your account.",
            "Every prompt instructs the model to ignore and never repeat personal identifiers.",
            "We use Claude, made by Anthropic, which does not train on data sent through their API.",
            "There are no third-party trackers, analytics, or ad SDKs in this app.",
          ]}
        />
      </DocSection>

      <DocSection title="Found a problem?">
        <p>
          Email <span className="text-pop-night">security@aipockettutor.app</span>. Tell us
          what you found and how to reproduce it, and please give us a chance to fix it
          before sharing it publicly. We&apos;ll confirm we got it within a few days.
        </p>
        <p>
          The parent-facing version of all this is our{" "}
          <Link href="/privacy" className="text-pop-magenta underline">
            privacy promise
          </Link>
          .
        </p>
      </DocSection>
    </DocPage>
  );
}
