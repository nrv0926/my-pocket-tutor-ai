import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * The transcribed curriculum must not reach the browser.
 *
 * lib/curriculum.ts imports ~250 KB of Ontario JSON at module scope, so a
 * single named import from a "use client" file ships the whole curriculum to
 * every visitor — it went 99 KB to 175 KB exactly once, from importing one
 * three-line helper. Server actions are the supported route in, and the type
 * imports are erased, so neither costs anything.
 */
const DATA_HEAVY = ["@/lib/curriculum", "@/lib/foundationsContinuum", "@/data/"];

function sources(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".next" || entry.startsWith(".")) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) sources(full, out);
    else if (/\.tsx?$/.test(entry)) out.push(full);
  }
  return out;
}

describe("client bundle", () => {
  it("keeps the curriculum data out of every client component", () => {
    const offenders: string[] = [];
    for (const file of sources(process.cwd())) {
      const src = readFileSync(file, "utf8");
      if (!/^\s*["']use client["']/m.test(src)) continue;
      for (const line of src.split("\n")) {
        const isImport = /^\s*import\s/.test(line);
        const isTypeOnly = /^\s*import\s+type\s/.test(line);
        if (!isImport || isTypeOnly) continue;
        if (DATA_HEAVY.some((m) => line.includes(m))) {
          offenders.push(`${file.replace(process.cwd() + "/", "")}: ${line.trim()}`);
        }
      }
    }
    expect(offenders, "import these through a server action instead").toEqual([]);
  });
});
