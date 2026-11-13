import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { isDmKey } from "@/server/auth";
import { blobToken, NO_BLOB_MESSAGE } from "@/server/blob";
import { HttpError } from "@/server/game";
import { guard, json, params } from "@/server/http";

export const dynamic = "force-dynamic";

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml", "image/avif"];

/** Which upload path the DM view should use. "missing": hosted, but no Blob store is connected. */
export async function GET() {
  return json({ mode: blobToken() ? "blob" : process.env.VERCEL ? "missing" : "local" });
}

/**
 * Vercel Blob client uploads: the browser sends the file straight to Blob
 * (no 4.5 MB function limit). We only hand out upload tokens to the DM.
 */
export async function POST(req: Request) {
  return guard(async () => {
    const token = blobToken();
    if (!token) throw new HttpError(503, NO_BLOB_MESSAGE, "no-blob");
    const body = (await req.json()) as HandleUploadBody;
    if (body.type === "blob.generate-client-token" && !isDmKey(params(req).key)) {
      throw new HttpError(401, "Only the DM can upload.", "bad-key");
    }
    const result = await handleUpload({
      body,
      request: req,
      token,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: IMAGE_TYPES,
        maximumSizeInBytes: 25 * 1024 * 1024,
        addRandomSuffix: true,
      }),
    });
    return json(result);
  });
}
