import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * A fresh Supabase project is built from the three SQL files, not from the
 * migrations. So anything the code reads has to be IN those files.
 *
 * This is not hypothetical. expectation_notes lived only in migration 0002
 * for months. A project bootstrapped from schema.sql + policies.sql +
 * storage.sql therefore had no expectation_notes, the setup page reported
 * everything fine, and /curriculum broke the first time anybody asked for
 * an explanation — with a developer's error message, in front of a parent.
 *
 * Migrations are for a database that already exists. This file is the rule
 * that the two cannot disagree.
 */

const schema = readFileSync("supabase/schema.sql", "utf8");
const policies = readFileSync("supabase/policies.sql", "utf8");
const storage = readFileSync("supabase/storage.sql", "utf8");

function sources(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".next" || entry.startsWith(".")) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) sources(full, out);
    else if (/\.tsx?$/.test(entry)) out.push(full);
  }
  return out;
}

const appFiles = [...sources("lib"), ...sources("app")];

/** Tables the code actually reads or writes, from .from("…") calls. */
const tablesUsed = (() => {
  const found = new Map<string, string>();
  for (const file of appFiles) {
    const src = readFileSync(file, "utf8");
    for (const m of src.matchAll(/\.from\(\s*["'`]([a-z_]+)["'`]\s*\)/g)) {
      // storage.from() takes a bucket, not a table.
      const before = src.slice(Math.max(0, m.index! - 40), m.index!);
      if (/storage\s*$/.test(before)) continue;
      if (!found.has(m[1])) found.set(m[1], file);
    }
  }
  return found;
})();

describe("a fresh project gets everything the code needs", () => {
  it("found the table references to check", () => {
    expect(tablesUsed.size).toBeGreaterThan(5);
  });

  it("every table the code reads is created in schema.sql", () => {
    const missing: string[] = [];
    for (const [table, file] of tablesUsed) {
      const created = new RegExp(
        `create table if not exists public\\.${table}\\b`,
      ).test(schema);
      if (!created) missing.push(`${table} (used in ${file})`);
    }
    expect(
      missing,
      `these tables are read by the app but not created in supabase/schema.sql, so a ` +
        `fresh project will not have them: ${missing.join(", ")}`,
    ).toEqual([]);
  });

  it("every table in schema.sql has row-level security turned on", () => {
    const tables = [...schema.matchAll(/create table if not exists public\.([a-z_]+)/g)].map(
      (m) => m[1],
    );
    const both = schema + policies;
    const unguarded = tables.filter(
      (t) => !new RegExp(`alter table public\\.${t}\\s+enable row level security`).test(both),
    );
    expect(
      unguarded,
      `RLS is the one security property this product cannot get wrong (CLAUDE.md §3): ${unguarded.join(", ")}`,
    ).toEqual([]);
  });

  it("the setup check looks for the bucket the app actually writes to", () => {
    // These disagreed: the probe hardcoded "uploads" while everything else
    // used child-uploads, so a correct install was told it was broken.
    const check = readFileSync("lib/setupCheck.ts", "utf8");
    const service = readFileSync("lib/uploadService.ts", "utf8");
    const nameOf = (s: string) =>
      s.match(/SUPABASE_UPLOADS_BUCKET\s*\|\|\s*["']([a-z-]+)["']/)?.[1];

    expect(nameOf(check), "setupCheck.ts does not read the bucket from the env var").toBeTruthy();
    expect(nameOf(check)).toBe(nameOf(service));
    // And that default is the bucket storage.sql creates.
    expect(storage).toContain(`'${nameOf(service)}'`);
  });

  it("the bucket is created private", () => {
    // Uploaded work is a child's. It is reachable only through short-lived
    // signed URLs, and `public = false` is what makes that true.
    expect(storage).toMatch(/values\s*\(\s*'[a-z-]+'\s*,\s*'[a-z-]+'\s*,\s*false\s*\)/);
    expect(storage).toMatch(/set public = false/);
  });
});
