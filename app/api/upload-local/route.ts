import fs from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { isDmKey } from "@/server/auth";
import { HttpError } from "@/server/game";
import { guard, json, params } from "@/server/http";

export const dynamic = "force-dynamic";

const EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "image/avif": "avif",
};

/** Local development only: store uploads in .data/uploads. */
export async function POST(req: Request) {
  return guard(async () => {
    if (process.env.VERCEL || process.env.BLOB_READ_WRITE_TOKEN) throw new HttpError(404, "Not here.");
    if (!isDmKey(params(req).key)) throw new HttpError(401, "Only the DM can upload.", "bad-key");
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new HttpError(400, "No file.");
    const ext = EXT[file.type];
    if (!ext) throw new HttpError(400, "That isn't an image.");
    if (file.size > 25 * 1024 * 1024) throw new HttpError(400, "That image is over 25 MB.");
    const name = `${randomBytes(12).toString("hex")}.${ext}`;
    const dir = path.join(process.cwd(), ".data", "uploads");
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
    return json({ url: `/api/files/${name}` });
  });
}
