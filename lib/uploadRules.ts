/**
 * What we accept, and why each limit exists.
 *
 * Its own module with no server imports so both the browser and the server
 * action check the same rules — a limit enforced only in the browser is not
 * a limit.
 */

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export const ACCEPTED = {
  "image/png": "image",
  "image/jpeg": "image",
  "image/webp": "image",
  "application/pdf": "pdf",
  "text/plain": "text",
} as const;

export type AcceptedType = keyof typeof ACCEPTED;
export type UploadKind = (typeof ACCEPTED)[AcceptedType];

export function kindOf(mime: string): UploadKind | null {
  return (ACCEPTED as Record<string, UploadKind>)[mime] ?? null;
}

/**
 * The reason a file was refused, in words the person can act on. Returns null
 * when the file is fine.
 */
export function rejectReason(file: { type: string; size: number; name: string }): string | null {
  const size = sizeReason(file.size);
  if (size) return size;

  // Named before the generic refusal, because "unknown type" tells an iPhone
  // owner nothing they can act on.
  if (/^image\/hei[cf]$/i.test(file.type) || /\.hei[cf]$/i.test(file.name)) {
    return HEIC_ADVICE;
  }

  if (!kindOf(file.type)) {
    return `We can read PNG, JPG, WEBP, PDF and TXT. ${file.name} is ${
      file.type || "an unknown type"
    }.`;
  }
  return null;
}

/** Size alone, which is knowable before a single byte is read. */
export function sizeReason(bytes: number): string | null {
  if (bytes === 0) return "That file is empty.";
  if (bytes > MAX_UPLOAD_BYTES) {
    const mb = (bytes / 1024 / 1024).toFixed(1);
    return `That file is ${mb} MB and the limit is 10 MB. A photo of one page is usually under 5.`;
  }
  return null;
}

/**
 * A storage path that cannot escape the user's own folder.
 *
 * The filename comes from the person's device, so it is never trusted into a
 * path: everything but a conservative character set is replaced, and the
 * unique part of the name is ours, not theirs.
 */
export function storagePath(userId: string, uploadId: string, fileName: string): string {
  const safe = fileName
    // Anything outside a conservative set becomes an underscore, which kills
    // the separators first.
    .replace(/[^A-Za-z0-9._-]/g, "_")
    // Then collapse dot runs, so no ".." survives anywhere in the key even
    // though there is no separator left for it to traverse with.
    .replace(/\.{2,}/g, ".")
    .replace(/^[._-]+/, "")
    .slice(-64);
  return `${userId}/${uploadId}-${safe || "file"}`;
}

/**
 * What a file actually is, read from its first bytes.
 *
 * The browser's reported MIME type is a guess made from the extension, and
 * on a phone it is often wrong or empty — the same photo arrives as
 * image/jpeg, image/heic, or "" depending on the device and the browser.
 * Trusting it means either refusing a file we can read or accepting one we
 * cannot, and finding out only after the upload has travelled.
 *
 * Returns null when the bytes match nothing we know, which is itself the
 * answer: we do not guess.
 */
export type SniffedType = AcceptedType | "image/heic" | null;

export function sniffType(bytes: Uint8Array): SniffedType {
  const at = (i: number) => bytes[i];
  const ascii = (start: number, len: number) =>
    String.fromCharCode(...Array.from(bytes.slice(start, start + len)));

  if (bytes.length < 12) return null;

  // \x89PNG\r\n\x1a\n
  if (at(0) === 0x89 && ascii(1, 3) === "PNG") return "image/png";

  // JPEG always starts FF D8 FF.
  if (at(0) === 0xff && at(1) === 0xd8 && at(2) === 0xff) return "image/jpeg";

  // RIFF....WEBP
  if (ascii(0, 4) === "RIFF" && ascii(8, 4) === "WEBP") return "image/webp";

  if (ascii(0, 5) === "%PDF-") return "application/pdf";

  // ISO base media: a box length, then "ftyp", then the brand. HEIC and its
  // relatives all live here, and Apple writes several of these brands.
  if (ascii(4, 4) === "ftyp") {
    const brand = ascii(8, 4);
    if (["heic", "heix", "hevc", "hevx", "mif1", "msf1", "heim", "heis"].includes(brand)) {
      return "image/heic";
    }
  }

  return null;
}

/**
 * Why we cannot read a HEIC, and what to do about it, in the words of the
 * device that made it.
 *
 * iPhones save photos as HEIC by default. Sharing one through a web form
 * usually converts it to JPEG on the way out, but not always — an AirDropped
 * file or certain browsers hand over the original. Claude reads PNG, JPEG,
 * WEBP and GIF; HEIC is not among them, so the honest move is to say so and
 * name the two ways out rather than fail with "unknown type".
 */
export const HEIC_ADVICE =
  "That's an iPhone HEIC photo, which we can't read yet. Two ways round it: " +
  "open the photo, tap Share and send it to yourself — iOS converts it to " +
  "JPEG on the way — or switch Settings › Camera › Formats to Most Compatible " +
  "and retake it.";
