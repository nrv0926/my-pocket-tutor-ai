import { describe, expect, it } from "vitest";
import {
  MAX_UPLOAD_BYTES,
  kindOf,
  rejectReason,
  storagePath,
} from "@/lib/uploadRules";

const file = (over: Partial<{ type: string; size: number; name: string }> = {}) => ({
  type: "image/jpeg",
  size: 2 * 1024 * 1024,
  name: "report.jpg",
  ...over,
});

/**
 * The rules live in one module so the browser and the server action check the
 * same thing. A limit enforced only in the browser is not a limit.
 */
describe("what we accept", () => {
  it("reads the formats a report card actually arrives in", () => {
    expect(kindOf("image/jpeg")).toBe("image");
    expect(kindOf("image/png")).toBe("image");
    expect(kindOf("image/webp")).toBe("image");
    expect(kindOf("application/pdf")).toBe("pdf");
    expect(kindOf("text/plain")).toBe("text");
  });

  it("refuses everything else by name, not by silence", () => {
    expect(kindOf("application/zip")).toBeNull();
    expect(kindOf("image/svg+xml")).toBeNull();
    expect(kindOf("")).toBeNull();
    expect(rejectReason(file({ type: "application/zip", name: "cards.zip" }))).toContain("cards.zip");
  });

  it("accepts an ordinary photo of a page", () => {
    expect(rejectReason(file())).toBeNull();
  });

  it("says how big the file was and what would fit", () => {
    const r = rejectReason(file({ size: 25 * 1024 * 1024 }));
    expect(r).toContain("25.0 MB");
    expect(r).toContain("10 MB");
  });

  it("takes the limit right up to the edge but not past it", () => {
    expect(rejectReason(file({ size: MAX_UPLOAD_BYTES }))).toBeNull();
    expect(rejectReason(file({ size: MAX_UPLOAD_BYTES + 1 }))).not.toBeNull();
  });

  it("catches an empty file before it wastes a generation", () => {
    expect(rejectReason(file({ size: 0 }))).toBe("That file is empty.");
  });
});

/**
 * The filename comes off someone's phone. It is never trusted into a path.
 */
describe("storagePath", () => {
  const USER = "11111111-1111-4111-8111-111111111111";
  const UP = "22222222-2222-4222-8222-222222222222";

  it("files everything under the owner's own folder", () => {
    expect(storagePath(USER, UP, "report.pdf").startsWith(`${USER}/`)).toBe(true);
  });

  it("cannot be walked out of that folder", () => {
    for (const evil of ["../../etc/passwd", "..%2f..%2froot", "/absolute/path.png", "....//x.pdf"]) {
      const p = storagePath(USER, UP, evil);
      expect(p.startsWith(`${USER}/${UP}-`), evil).toBe(true);
      expect(p.slice(`${USER}/`.length)).not.toContain("/");
      expect(p).not.toContain("..");
    }
  });

  it("strips characters that have no business in a key", () => {
    const p = storagePath(USER, UP, "Iliana's report (term 2).pdf");
    expect(p).not.toMatch(/[ '()]/);
    expect(p).toMatch(/\.pdf$/);
  });

  it("keeps the unique part ours, not theirs", () => {
    // Two files with the same name from the same user must not collide.
    expect(storagePath(USER, UP, "a.pdf")).not.toBe(storagePath(USER, "33333333", "a.pdf"));
  });

  it("survives a name that is nothing but junk", () => {
    expect(storagePath(USER, UP, "...")).toBe(`${USER}/${UP}-file`);
  });

  it("bounds a very long name", () => {
    const p = storagePath(USER, UP, "x".repeat(500) + ".pdf");
    expect(p.length).toBeLessThan(USER.length + UP.length + 80);
  });
});
