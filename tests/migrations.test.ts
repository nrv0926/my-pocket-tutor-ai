import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Static lint for supabase/migrations.
 *
 * The migration system is just "files in lexical order"; any sloppy
 * filename or non-idempotent statement is a foot-gun. These checks make
 * the foot-gun fail at CI time instead of mid-deploy.
 */

const MIGRATIONS_DIR = join(__dirname, "..", "supabase", "migrations");
const FILENAME = /^(\d{14})_[a-z0-9_]+\.sql$/;

function listFiles(): string[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();
}

describe("supabase migrations", () => {
  it("filenames follow <YYYYMMDDHHMMSS>_<snake_case>.sql", () => {
    for (const f of listFiles()) {
      expect(f, `${f} does not match the migration filename format`).toMatch(FILENAME);
    }
  });

  it("timestamps are unique and strictly increasing", () => {
    const stamps = listFiles().map((f) => f.match(FILENAME)?.[1] ?? "");
    const set = new Set(stamps);
    expect(set.size, "duplicate migration timestamp").toBe(stamps.length);
    const sorted = [...stamps].sort();
    expect(stamps, "files do not sort by timestamp").toEqual(sorted);
  });

  it("every migration is non-empty and uses idempotent guards", () => {
    for (const f of listFiles()) {
      const path = join(MIGRATIONS_DIR, f);
      expect(statSync(path).size, `${f} is empty`).toBeGreaterThan(0);

      const text = readFileSync(path, "utf8").toLowerCase();

      // Idempotency check: any CREATE / ALTER ADD / CREATE POLICY needs to
      // be guarded so reruns don't fail. We catch the common patterns.
      const lines = text.split("\n");
      for (const [i, raw] of lines.entries()) {
        const line = raw.trim();
        if (line.startsWith("--") || line.length === 0) continue;

        if (line.match(/^create\s+table\s+(?!if\s+not\s+exists)/)) {
          throw new Error(`${f}:${i + 1} create table missing IF NOT EXISTS`);
        }
        if (line.match(/^create\s+index\s+(?!if\s+not\s+exists|concurrently)/)) {
          throw new Error(`${f}:${i + 1} create index missing IF NOT EXISTS`);
        }
        if (line.match(/^alter\s+table\s+\S+\s+add\s+column\s+(?!if\s+not\s+exists)/)) {
          throw new Error(`${f}:${i + 1} add column missing IF NOT EXISTS`);
        }
      }
    }
  });

  it("no migration references the deleted legacy supabase/schema.sql / policies.sql paths", () => {
    // Match only the legacy path forms, not migration filenames like
    // "20260427000000_init_schema.sql" which legitimately end in _schema.sql.
    const legacy = /supabase\/(?:schema|policies)\.sql/;
    for (const f of listFiles()) {
      const text = readFileSync(join(MIGRATIONS_DIR, f), "utf8");
      expect(text, `${f} references legacy file`).not.toMatch(legacy);
    }
  });
});
