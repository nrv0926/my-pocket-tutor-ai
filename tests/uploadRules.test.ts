import { describe, expect, it } from "vitest";
import {
  HEIC_ADVICE,
  MAX_UPLOAD_BYTES,
  kindOf,
  rejectReason,
  sizeReason,
  sniffType,
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


/**
 * The browser's MIME type is a guess made from the extension, and on a phone
 * it is regularly wrong or empty. The bytes are the only thing that knows.
 */
const bytes = (...parts: (number | string)[]) => {
  const out: number[] = [];
  for (const p of parts) {
    if (typeof p === "number") out.push(p);
    else for (const ch of p) out.push(ch.charCodeAt(0));
  }
  while (out.length < 16) out.push(0);
  return new Uint8Array(out);
};

describe("sniffType", () => {
  it("knows a PNG by its signature", () => {
    expect(sniffType(bytes(0x89, "PNG", 0x0d, 0x0a, 0x1a, 0x0a))).toBe("image/png");
  });

  it("knows a JPEG", () => {
    expect(sniffType(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe("image/jpeg");
  });

  it("knows a WEBP, which needs both halves of the header", () => {
    expect(sniffType(bytes("RIFF", 0, 0, 0, 0, "WEBP"))).toBe("image/webp");
    // RIFF alone is a container — a WAV is also RIFF.
    expect(sniffType(bytes("RIFF", 0, 0, 0, 0, "WAVE"))).toBeNull();
  });

  it("knows a PDF", () => {
    expect(sniffType(bytes("%PDF-1.7"))).toBe("application/pdf");
  });

  it("recognises the HEIC family an iPhone actually writes", () => {
    for (const brand of ["heic", "heix", "mif1", "msf1", "hevc"]) {
      expect(sniffType(bytes(0, 0, 0, 0x20, "ftyp", brand)), brand).toBe("image/heic");
    }
  });

  it("does not mistake other ISO media for HEIC", () => {
    // An MP4 is the same box structure with a different brand.
    expect(sniffType(bytes(0, 0, 0, 0x20, "ftyp", "isom"))).toBeNull();
  });

  it("says nothing rather than guessing", () => {
    expect(sniffType(bytes("not a real file at all"))).toBeNull();
    expect(sniffType(new Uint8Array([1, 2, 3]))).toBeNull();
    expect(sniffType(new Uint8Array())).toBeNull();
  });

  it("is not fooled by a JPEG wearing a PDF name", () => {
    // The classic browser lie: extension says one thing, bytes say another.
    expect(sniffType(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe("image/jpeg");
  });
});

describe("telling an iPhone owner what to do", () => {
  it("names HEIC before falling back to 'unknown type'", () => {
    expect(rejectReason(file({ type: "image/heic", name: "IMG_4021.HEIC" }))).toBe(HEIC_ADVICE);
  });

  it("catches it by extension when the browser reports nothing", () => {
    expect(rejectReason(file({ type: "", name: "IMG_4021.heic" }))).toBe(HEIC_ADVICE);
    expect(rejectReason(file({ type: "", name: "IMG_4021.HEIF" }))).toBe(HEIC_ADVICE);
  });

  it("gives two ways out, not just a refusal", () => {
    expect(HEIC_ADVICE).toMatch(/Share/);
    expect(HEIC_ADVICE).toMatch(/Most Compatible/i);
  });

  it("still checks size before type, because size is cheaper to fix", () => {
    const r = rejectReason(file({ type: "image/heic", size: 30 * 1024 * 1024 }));
    expect(r).toContain("30.0 MB");
  });
});

describe("sizeReason", () => {
  it("is knowable before a byte is read", () => {
    expect(sizeReason(0)).toBe("That file is empty.");
    expect(sizeReason(MAX_UPLOAD_BYTES)).toBeNull();
    expect(sizeReason(MAX_UPLOAD_BYTES + 1)).toContain("10 MB");
  });
});
