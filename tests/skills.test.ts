import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  SKILL_NODES,
  prerequisiteChain,
  prerequisiteFor,
  prerequisitesFor,
  skillById,
  skillName,
} from "@/lib/skills";
import { expectationsForSkill } from "@/lib/skillExpectations";
import { recommend, type ObservationRow } from "@/lib/recommend";
import type { GradeId } from "@/types/curriculum";

const GRADES = ["K", "1", "2", "3", "4", "5", "6", "7", "8"];
const rank = (g: string) => GRADES.indexOf(g);

describe("the skill graph holds together", () => {
  it("every prerequisite names a skill that exists", () => {
    for (const s of SKILL_NODES) {
      for (const p of s.prerequisiteIds) {
        expect(skillById(p), `${s.id} -> ${p}`).toBeDefined();
      }
    }
  });

  it("nothing is its own prerequisite", () => {
    for (const s of SKILL_NODES) expect(s.prerequisiteIds).not.toContain(s.id);
  });

  it("has no cycles", () => {
    const colour = new Map<string, number>();
    const walk = (id: string): string[] | null => {
      colour.set(id, 1);
      for (const p of skillById(id)?.prerequisiteIds ?? []) {
        if (colour.get(p) === 1) return [id, p];
        if (!colour.has(p)) {
          const found = walk(p);
          if (found) return found;
        }
      }
      colour.set(id, 2);
      return null;
    };
    for (const s of SKILL_NODES) {
      if (!colour.has(s.id)) expect(walk(s.id)).toBeNull();
    }
  });

  it("never rests a skill on something taught later", () => {
    for (const s of SKILL_NODES) {
      for (const p of s.prerequisiteIds) {
        const under = skillById(p)!;
        expect(
          rank(under.minGrade),
          `${s.id} (grade ${s.minGrade}) rests on ${p} (grade ${under.minGrade})`,
        ).toBeLessThanOrEqual(rank(s.minGrade));
      }
    }
  });

  it("every chain terminates", () => {
    for (const s of SKILL_NODES) {
      expect(prerequisiteChain(s.id).length).toBeLessThan(SKILL_NODES.length);
    }
  });

  it("has a root in each subject, so nothing dangles", () => {
    const roots = SKILL_NODES.filter((s) => s.prerequisiteIds.length === 0);
    expect(roots.map((r) => r.subject).sort()).toEqual(
      expect.arrayContaining(["math", "reading", "writing"]),
    );
  });
});

describe("the phonics order is the one already in /data", () => {
  // literacy-progression.json: CVC -> digraphs -> blends -> silent e ->
  // vowel teams -> r-controlled -> multisyllabic. CLAUDE.md calls it
  // strict and sequential, so the graph must not reorder it.
  const chain = [
    "phonics.cvc",
    "phonics.digraphs",
    "phonics.blends",
    "phonics.silent_e",
    "phonics.vowel_teams",
    "phonics.r_controlled",
    "phonics.multisyllabic",
  ];

  it("each stage rests on the one before it", () => {
    for (let i = 1; i < chain.length; i += 1) {
      expect(prerequisiteFor(chain[i])?.id).toBe(chain[i - 1]);
    }
  });

  it("decoding comes before comprehension, never the other way", () => {
    const under = prerequisiteChain("comprehension.inference").map((s) => s.id);
    expect(under).toContain("phonics.cvc");
    expect(prerequisiteChain("phonics.cvc").map((s) => s.id)).not.toContain(
      "comprehension.inference",
    );
  });

  it("phonics rests on phonemic awareness", () => {
    expect(prerequisiteFor("phonics.cvc")?.id).toBe("phonemic_awareness.segmenting");
  });
});

describe("what to check first", () => {
  it("takes the most foundational where a skill rests on two", () => {
    expect(prerequisitesFor("math.subtraction_within_100").map((s) => s.id)).toEqual([
      "math.place_value_100",
      "math.subtraction_within_20",
    ]);
    expect(prerequisiteFor("math.subtraction_within_100")?.id).toBe("math.place_value_100");
  });

  it("returns null for a root rather than inventing a step", () => {
    expect(prerequisiteFor("math.place_value_100")).toBeNull();
  });

  it("falls back to the id rather than rendering blank", () => {
    expect(skillName("math.place_value_100")).toBe("Place value to 100");
    expect(skillName("nope.not.a.skill")).toBe("nope.not.a.skill");
  });
});

/**
 * The blueprint's acceptance test for this phase, in its own words:
 * "a below-50-percent result on regrouping proposes place value by name".
 */
describe("done when: regrouping proposes place value by name", () => {
  const session = (id: string, right: number, total: number): ObservationRow[] =>
    Array.from({ length: total }, (_, i) => ({
      itemId: `q${i + 1}`,
      sessionId: id,
      sessionClosedAt: new Date("2026-11-25T10:00:00Z").toISOString(),
      skillId: "math.subtraction_within_100",
      topicId: null,
      modeOfSupport: "independent" as const,
      status: "scored" as const,
      score: i < right ? 1 : 0,
      maxPoints: 1,
      attempt: 1,
      excludeFromAdaptation: false,
      createdAt: new Date("2026-11-25T10:00:00Z").toISOString(),
    }));

  const rec = recommend([...session("s1", 1, 3), ...session("s2", 1, 3)], {
    now: new Date("2026-11-26T10:00:00Z"),
  });

  it("steps down rather than repeating", () => {
    expect(rec.decision).toBe("check_prerequisite");
  });

  it("names the prerequisite, by id and in plain English", () => {
    expect(rec.prerequisite).toBe("math.place_value_100");
    expect(rec.prerequisiteLabel).toBe("Place value to 100");
  });

  it("says why in a sentence an adult can act on", () => {
    expect(rec.reason).toMatch(/Place value to 100/);
    expect(rec.reason).not.toBe("no prerequisite mapped");
  });

  it("still says so plainly when the graph has no edge", () => {
    const rootRec = recommend(
      [...session("s1", 1, 3), ...session("s2", 1, 3)].map((r) => ({
        ...r,
        skillId: "math.place_value_100",
      })),
      { now: new Date("2026-11-26T10:00:00Z") },
    );
    expect(rootRec.prerequisite).toBeNull();
    expect(rootRec.reason).toBe("no prerequisite mapped");
  });

  it("a caller can supply its own ordering", () => {
    const custom = recommend([...session("s1", 1, 3), ...session("s2", 1, 3)], {
      now: new Date("2026-11-26T10:00:00Z"),
      prerequisiteLookup: () => ({ id: "x.y", label: "Something else" }),
    });
    expect(custom.prerequisiteLabel).toBe("Something else");
  });
});

describe("expectations are derived, never stored", () => {
  it("the data file holds no expectation codes at all", () => {
    const raw = readFileSync("data/skill-map.json", "utf8");
    // An Ontario code looks like B2.3 / C1.6 / E2.11.
    const codes = raw.match(/"[A-E]\d\.\d{1,2}"/g);
    expect(codes, `skill-map.json must store no codes, found ${codes?.join(",")}`).toBeNull();
  });

  it("the file says which parts are ours", () => {
    const raw = JSON.parse(readFileSync("data/skill-map.json", "utf8"));
    expect(raw.note).toMatch(/OURS/);
    expect(raw.note).toMatch(/derive/i);
  });

  it("resolves a maths skill to real transcribed codes", () => {
    const hits = expectationsForSkill("math.place_value_100", "1" as GradeId);
    expect(hits.length).toBeGreaterThan(0);
    for (const h of hits) expect(h.code).toMatch(/^[A-F]\d/);
  });

  it("searches the continuum too, not only the expectations", () => {
    // "decoding" and "syllable" appear nowhere in the Language
    // expectations; both are all over the continuum (CLAUDE.md §6).
    const hits = expectationsForSkill("phonics.cvc", "1" as GradeId);
    expect(hits.some((h) => h.via === "continuum")).toBe(true);
  });

  it("matches at a word boundary, so rate does not match demonstrate", () => {
    const ratios = expectationsForSkill("math.ratios_percent", "6" as GradeId);
    for (const h of ratios) {
      expect(
        /\b(ratio|percent|rate|proportion)/i.test(h.text),
        `${h.code} matched without a real term: ${h.text.slice(0, 90)}`,
      ).toBe(true);
    }
  });

  it("an unknown skill derives nothing rather than throwing", () => {
    expect(expectationsForSkill("nope.not.a.skill", "3" as GradeId)).toEqual([]);
  });
});

/**
 * Two skills derive nothing, and that is the right answer.
 *
 * Ontario never writes "vowel team", "r-controlled" or "diphthong" —
 * not once across Language grades 1 to 6, and not once in the Foundations
 * Continuum. "vowel" appears in exactly one expectation (Grade 1 B2.3,
 * grapheme-phoneme correspondences of consonants AND vowels) and a few
 * continuum rows as "flexing vowel sounds".
 *
 * Those stage names come from the science-of-reading sequence in
 * literacy-progression.json, not from Ontario. Widening the terms to bare
 * "vowel" would make these two claim B2.3, which is phonics.cvc's
 * territory — a topic quietly claiming an expectation that is not about
 * it is the exact failure CLAUDE.md §6 forbids.
 *
 * So: empty, on purpose. Do not "fix" this by loosening the terms.
 */
describe("the two skills Ontario has no words for", () => {
  it("derive nothing at the grade they are taught", () => {
    expect(expectationsForSkill("phonics.vowel_teams", "2" as GradeId)).toEqual([]);
    expect(expectationsForSkill("phonics.r_controlled", "2" as GradeId)).toEqual([]);
  });

  it("keep their place in the graph regardless", () => {
    expect(prerequisiteFor("phonics.vowel_teams")?.id).toBe("phonics.silent_e");
    expect(prerequisiteFor("phonics.multisyllabic")?.id).toBe("phonics.r_controlled");
  });

  it("every other skill does derive something", () => {
    const silent = ["phonics.vowel_teams", "phonics.r_controlled"];
    const misses = SKILL_NODES.filter((s) => {
      if (silent.includes(s.id)) return false;
      const g = (s.minGrade === "K" ? "1" : s.minGrade) as GradeId;
      return expectationsForSkill(s.id, g).length === 0;
    }).map((s) => s.id);
    expect(misses, `these derive nothing and are not accounted for: ${misses.join(", ")}`)
      .toEqual([]);
  });
});
