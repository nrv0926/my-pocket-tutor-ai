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
  if (!kindOf(file.type)) {
    return `We can read PNG, JPG, WEBP, PDF and TXT. ${file.name} is ${
      file.type || "an unknown type"
    }.`;
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    const mb = (file.size / 1024 / 1024).toFixed(1);
    return `That file is ${mb} MB and the limit is 10 MB. A photo of one page is usually under 5.`;
  }
  if (file.size === 0) return "That file is empty.";
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
