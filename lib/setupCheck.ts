import "server-only";

import { getServerSupabase, isSupabaseConfigured } from "@/lib/supabaseServer";

/**
 * Does the database actually have what the deployed code expects?
 *
 * Schema files in the repo are not a schema in the project. Code shipped
 * ahead of a migration fails at the moment a person uses the feature, with a
 * message written for a developer — which is the worst possible time and the
 * worst possible audience. This asks the questions up front so the answer is
 * "run this file", not "why did the upload button explode".
 *
 * Every probe is read-only and cheap, and each one carries its own fix.
 */

export type CheckStatus = "ok" | "missing" | "unknown";

export interface SetupCheck {
  id: string;
  label: string;
  status: CheckStatus;
  /** What is wrong and what to do about it. Empty when nothing is. */
  detail: string;
  /** The feature that stops working while this is missing. */
  blocks: string;
}

const MIGRATION = "supabase/migrations/0001_plans_and_uploads.sql";
const STORAGE = "supabase/storage.sql";

/**
 * The same name and the same default the app itself uses, read from the same
 * variable. This probe used to look for a bucket called "uploads", which is
 * not what anything creates or writes to, so a correctly configured project
 * was told its bucket was missing — and pointed at the wrong file to fix it.
 * A setup check that cries wolf is worse than no setup check.
 */
const BUCKET = process.env.SUPABASE_UPLOADS_BUCKET || "child-uploads";

export async function runSetupChecks(): Promise<SetupCheck[]> {
  if (!isSupabaseConfigured()) {
    return [
      {
        id: "env",
        label: "Supabase connection",
        status: "missing",
        detail:
          "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are not set in this environment. Set them and redeploy — the build bakes them in.",
        blocks: "Everything that needs an account",
      },
    ];
  }

  const supabase = getServerSupabase();

  // A select against a table that does not exist fails with a distinct
  // code; anything else (including "no rows", which is the normal answer)
  // means the table is there.
  const table = async (name: string): Promise<CheckStatus> => {
    const { error } = await supabase.from(name).select("id").limit(1);
    if (!error) return "ok";
    if (/does not exist|schema cache|relation/i.test(error.message)) return "missing";
    // A permission error still proves the table exists.
    return "unknown";
  };

  const [plans, sessions, notes] = await Promise.all([
    table("learning_plans"),
    table("learning_sessions"),
    table("expectation_notes"),
  ]);

  // Listing an absent bucket errors; listing an empty one returns [].
  let bucket: CheckStatus = "unknown";
  let bucketDetail = "";
  const { error: bucketErr } = await supabase.storage.from(BUCKET).list("", { limit: 1 });
  if (!bucketErr) {
    bucket = "ok";
  } else if (/not found|does not exist|bucket/i.test(bucketErr.message)) {
    bucket = "missing";
    bucketDetail = bucketErr.message;
  }

  return [
    {
      id: "sessions",
      label: "Core tables",
      status: sessions,
      detail:
        sessions === "ok"
          ? ""
          : "The base schema has not been applied. Run supabase/schema.sql then supabase/policies.sql.",
      blocks: "Every plan",
    },
    {
      id: "plans",
      label: "learning_plans table",
      status: plans,
      detail: plans === "ok" ? "" : `Not created yet. Run ${MIGRATION}.`,
      blocks: "The four-week plan",
    },
    {
      id: "notes",
      label: "expectation_notes table",
      status: notes,
      detail:
        notes === "ok"
          ? ""
          : "Not created yet. Run supabase/schema.sql and supabase/policies.sql again — " +
            "this table was only in migration 0002 until 2026-11-26, so a project " +
            "bootstrapped before then does not have it.",
      blocks: "Plain-English explanations on /curriculum",
    },
    {
      id: "bucket",
      label: "Private uploads bucket",
      status: bucket,
      detail:
        bucket === "ok"
          ? ""
          : `No bucket named "${BUCKET}". Run ${STORAGE} — it creates it private, ` +
            `which is the non-negotiable bit, and adds the owner-scoped object policy.${
              bucketDetail ? ` (${bucketDetail})` : ""
            }`,
      blocks: "Report card and worksheet upload",
    },
  ];
}

/** True when something is definitely missing, rather than merely unproven. */
export function hasBlockers(checks: SetupCheck[]): boolean {
  return checks.some((c) => c.status === "missing");
}
