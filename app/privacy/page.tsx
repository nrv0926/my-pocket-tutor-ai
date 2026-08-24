import type { Metadata } from "next";
import Link from "next/link";
import { DocList, DocPage, DocSection } from "@/components/DocPage";

export const metadata: Metadata = {
  title: "Privacy promise — AI Pocket Tutor",
  description:
    "What we ask for, what we never collect, and what happens to anything you upload.",
};

export default function PrivacyPage() {
  return (
    <DocPage
      eyebrow="Privacy promise"
      title={
        <>
          Your child&apos;s information <em className="text-forest-500">stays your child&apos;s.</em>
        </>
      }
      lead="We built this for our own kids first. We hold your child's information the way we'd want someone to hold ours: as little as possible, only as long as needed, never sold, never used to train a model."
    >
      <DocSection title="What we ask for">
        <p>To make a useful plan, we ask for:</p>
        <DocList
          items={[
            <>
              A <strong>nickname</strong> for your child — not their full name.
            </>,
            <>
              Their <strong>age</strong> and <strong>grade</strong>.
            </>,
            <>
              Your <strong>province or state</strong>, so we use the right curriculum.
            </>,
            <>
              What you&apos;d like us to focus on: the main worry, what they&apos;re good
              at, what&apos;s hard, and your goal.
            </>,
          ]}
        />
        <p>
          Then either paste in the text you want looked at — a report card sentence, a
          worksheet question — or upload a photo or PDF of the work.
        </p>
      </DocSection>

      <DocSection title="What we deliberately never collect">
        <DocList
          items={[
            "Your child's full name.",
            "Their school's name.",
            "Your address or phone number.",
            "A student number.",
            "Your child's birth date.",
          ]}
        />
        <p className="rounded-xl bg-cream-50 p-4 text-ink">
          There is nowhere in our database that could even hold these. The columns
          don&apos;t exist.
        </p>
      </DocSection>

      <DocSection title="What happens to a file you upload">
        <DocList
          items={[
            "It goes straight to private storage — it never sits on our servers.",
            "The AI reads it once to write your plan.",
            "It is deleted from storage as soon as the analysis finishes.",
            "We keep only the plan itself, saved to your child's profile so you can come back to it.",
          ]}
        />
        <p>
          You can choose to keep a file instead. Even then, only you can ever see it,
          and you can delete it any time from Settings.
        </p>
        <p>
          Before every single upload we remind you to cover up names, school names, and
          anything else identifying. That reminder is not something you can switch off.
        </p>
      </DocSection>

      <DocSection title="How we use AI">
        <DocList
          items={[
            "We send the AI the minimum it needs: age, grade, needs, goal, and the text or file you shared.",
            "We never send your email, your account ID, or any other family's information.",
            "We instruct the AI to ignore and never repeat any personal detail it might see anyway.",
            <>
              We use Claude, made by Anthropic. Anthropic does not train on customer
              data submitted through their API.
            </>,
          ]}
        />
      </DocSection>

      <DocSection title="Who can see your data">
        <DocList
          items={[
            <>
              <strong>You.</strong> Always.
            </>,
            <>
              <strong>Us</strong> — only if you ask for help or report a bug, and only
              with your explicit OK.
            </>,
            <>
              <strong>Nobody else.</strong> We don&apos;t sell data. We don&apos;t run
              ads. There are no third-party trackers in the app.
            </>,
          ]}
        />
      </DocSection>

      <DocSection title="Children don't use this app">
        <p>
          AI Pocket Tutor is for parents and teachers. Children don&apos;t get logins,
          and the AI never chats directly with a child. If that ever changes we&apos;ll
          be extremely loud about it first, and follow COPPA and PIPEDA rules for any
          feature involving under-13s.
        </p>
      </DocSection>

      <DocSection title="Your rights">
        <p>At any time, you can:</p>
        <DocList
          items={[
            "Edit or delete a child profile.",
            "Delete an uploaded file.",
            "Delete a saved plan.",
            "Delete your whole account — children, plans, files, and progress all go with it.",
            "Email us for a copy of your data.",
          ]}
        />
      </DocSection>

      <DocSection title="Where your data lives">
        <p>
          Our database and file storage are hosted on Supabase, currently in a US
          region. Moving to a Canadian region is on our roadmap. Everything is
          encrypted in transit and at rest.
        </p>
        <p>
          If we change anything on this page, we&apos;ll email every account holder
          before the change takes effect.
        </p>
      </DocSection>

      <DocSection title="Questions">
        <p>
          Email <span className="text-ink">privacy@aipockettutor.app</span>, or read the{" "}
          <Link href="/security" className="text-forest-500 underline">
            technical security details
          </Link>{" "}
          if you want to see how this is enforced in the code.
        </p>
      </DocSection>
    </DocPage>
  );
}
