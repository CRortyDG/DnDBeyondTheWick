import fs from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";

const TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
  avif: "image/avif",
};

/** Local development only: serve files from .data/uploads. */
export async function GET(_req: Request, ctx: { params: Promise<{ name: string }> }) {
  const { name } = await ctx.params;
  const m = /^([0-9a-f]{24})\.(png|jpg|webp|gif|svg|avif)$/.exec(name);
  if (!m) return new Response("Not found", { status: 404 });
  try {
    const buf = await fs.readFile(path.join(process.cwd(), ".data", "uploads", name));
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": TYPES[m[2]],
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
