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

  const [plans, sessions] = await Promise.all([
    table("learning_plans"),
    table("learning_sessions"),
  ]);

  // Listing an absent bucket errors; listing an empty one returns [].
  let bucket: CheckStatus = "unknown";
  let bucketDetail = "";
  const { error: bucketErr } = await supabase.storage.from("uploads").list("", { limit: 1 });
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
      id: "bucket",
      label: "Private uploads bucket",
      status: bucket,
      detail:
        bucket === "ok"
          ? ""
          : `No bucket named "uploads". Run ${MIGRATION} — it creates it private, with the same 10 MB limit and file types the app enforces.${
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
