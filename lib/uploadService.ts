import { createClient } from "@supabase/supabase-js";

/**
 * Server-only upload helpers. The browser never imports this file.
 *
 * Flow:
 *   1. Client asks for a signed upload URL (createSignedUploadUrl).
 *   2. Browser PUTs the file directly to Supabase Storage — bytes never touch
 *      our server.
 *   3. Server records the upload in `uploads`, then triggers analysis.
 *   4. After analysis completes, deleteUpload() is called unless the parent
 *      explicitly opted in to keep the file.
 */

const BUCKET = process.env.SUPABASE_UPLOADS_BUCKET || "child-uploads";
const MAX_BYTES =
  Number(process.env.MAX_UPLOAD_MB || "10") * 1024 * 1024;

const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
  "text/plain",
]);

/** Server-side admin client. ONLY used inside server actions / API routes. */
function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase service role env vars are not set.");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

export interface CreateUploadInput {
  userId: string;
  childId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

export async function createSignedUploadUrl(input: CreateUploadInput) {
  if (!ALLOWED_MIME.has(input.fileType)) {
    throw new Error(`File type not allowed: ${input.fileType}`);
  }
  if (input.fileSize > MAX_BYTES) {
    throw new Error(
      `File too large: ${(input.fileSize / 1024 / 1024).toFixed(1)} MB (max ${MAX_BYTES / 1024 / 1024} MB)`
    );
  }

  const safeName = normalizeFileName(input.fileName);
  // Path is scoped under the user's auth.uid() so the storage RLS policy
  // (see supabase/README.md) permits it.
  const path = `${input.userId}/${input.childId}/${crypto.randomUUID()}-${safeName}`;

  const { data, error } = await admin().storage
    .from(BUCKET)
    .createSignedUploadUrl(path);

  if (error || !data) throw error ?? new Error("Failed to sign upload URL");
  return { path, token: data.token, signedUrl: data.signedUrl };
}

export async function deleteUpload(path: string) {
  const { error } = await admin().storage.from(BUCKET).remove([path]);
  if (error) throw error;
}

/** Strip path traversal and weird characters; preserve extension. */
export function normalizeFileName(raw: string): string {
  const base = raw.split(/[\\/]/).pop() || "file";
  return base
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 80);
}
