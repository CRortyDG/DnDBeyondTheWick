import "server-only";

/**
 * The Vercel Blob read-write token. Connecting a Blob store in Vercel sets
 * BLOB_READ_WRITE_TOKEN, unless a custom "environment variable prefix" was
 * chosen, in which case it's <PREFIX>_READ_WRITE_TOKEN. Accept either.
 */
export function blobToken(env: Record<string, string | undefined> = process.env): string | undefined {
  if (env.BLOB_READ_WRITE_TOKEN) return env.BLOB_READ_WRITE_TOKEN;
  for (const [name, value] of Object.entries(env)) {
    if (name.endsWith("_READ_WRITE_TOKEN") && value?.startsWith("vercel_blob_rw_")) return value;
  }
  return undefined;
}

/** Shown when uploads are tried on the hosted site with no Blob store connected. */
export const NO_BLOB_MESSAGE =
  "Image uploads aren't set up on this server yet. In Vercel: Storage → connect a Blob store (public access) to this project, then redeploy.";
