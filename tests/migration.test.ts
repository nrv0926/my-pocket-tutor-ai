import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { ACCEPTED, MAX_UPLOAD_BYTES } from "@/lib/uploadRules";

/**
 * The migration is the thing someone pastes into a production database at
 * 11pm. It has to be safe to run twice, and it has to agree with the code it
 * is unblocking — a bucket that allows different file types or a different
 * size than lib/uploadRules.ts enforces is a bug nobody finds until a real
 * upload is refused for no visible reason.
 */
const sql = readFileSync("supabase/migrations/0001_plans_and_uploads.sql", "utf8");

describe("the migration is safe to run twice", () => {
  it("creates the table only if it is not there", () => {
    expect(sql).toMatch(/create table if not exists public\.learning_plans/);
    expect(sql).toMatch(/create index if not exists plans_child_created_idx/);
  });

  it("drops each policy before creating it", () => {
    const created = [...sql.matchAll(/create policy "([^"]+)"/g)].map((m) => m[1]);
    expect(created.length).toBeGreaterThan(4);
    for (const name of created) {
      expect(sql, `"${name}" is created without a matching drop`).toContain(
        `drop policy if exists "${name}"`
      );
    }
  });

  it("does not destroy anything", () => {
    expect(sql).not.toMatch(/drop table/i);
    expect(sql).not.toMatch(/truncate/i);
    expect(sql).not.toMatch(/delete from/i);
  });

  it("handles a bucket that already exists", () => {
    expect(sql).toMatch(/on conflict \(id\) do update/);
  });
});

describe("the bucket agrees with the code", () => {
  it("is private, and repairs itself if someone made it public", () => {
    expect(sql).toMatch(/values \(\s*'uploads',\s*'uploads',\s*false/);
    expect(sql).toMatch(/set public\s*=\s*false/);
    // A public bucket makes every child's report card readable by URL.
    expect(sql).not.toMatch(/public\s*=\s*true/);
  });

  it("uses the same size limit the app enforces", () => {
    expect(sql).toContain(String(MAX_UPLOAD_BYTES));
  });

  it("allows exactly the types the app accepts", () => {
    const inSql = (sql.match(/allowed_mime_types\s*\)\s*\nvalues[\s\S]*?array\[([^\]]+)\]/)?.[1] ?? "")
      .split(",")
      .map((s) => s.trim().replace(/'/g, ""))
      .filter(Boolean);
    expect(inSql.sort()).toEqual(Object.keys(ACCEPTED).sort());
  });
});

describe("storage is owner-scoped", () => {
  it("gates every operation on the first path segment being the caller", () => {
    for (const op of ["select", "insert", "update", "delete"]) {
      expect(sql, `no ${op} policy`).toMatch(new RegExp(`for ${op}`));
    }
    const guards = [...sql.matchAll(/\(storage\.foldername\(name\)\)\[1\] = auth\.uid\(\)::text/g)];
    expect(guards.length).toBe(4);
  });

  it("keeps delete owner-scoped, because the privacy promise depends on it", () => {
    // The app removes the file after analysis. Without a delete policy that
    // silently fails and the file stays.
    expect(sql).toContain('create policy "uploads owner delete"');
  });

  it("proves plan ownership through the child row, like sessions do", () => {
    expect(sql).toMatch(/from public\.children c[\s\S]*?c\.user_id = auth\.uid\(\)/);
  });

  it("turns row-level security on for the new table", () => {
    expect(sql).toMatch(/alter table public\.learning_plans enable row level security/);
  });
});
