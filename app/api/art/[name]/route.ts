import { isDmKey } from "@/server/auth";
import { MERCHANT_SIGIL_SVG } from "@/server/art/merchant-sigil";
import { params } from "@/server/http";
import { getStore } from "@/server/store";
import { gatedArtIsLive } from "@/shared/projection";

export const dynamic = "force-dynamic";

const GATED: Record<string, string> = { "merchant-sigil": MERCHANT_SIGIL_SVG };

/** Reveal-only art: served to the DM any time, to everyone else only while its scene is live. */
export async function GET(req: Request, ctx: { params: Promise<{ name: string }> }) {
  const { name } = await ctx.params;
  const svg = GATED[name];
  if (!svg) return new Response("Not found", { status: 404 });
  const { game, key } = params(req);
  const { state } = await getStore().read(game);
  const ok = isDmKey(key) || (state !== null && gatedArtIsLive(state, name));
  if (!ok) return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
  return new Response(svg, { headers: { "Content-Type": "image/svg+xml", "Cache-Control": "private, no-store" } });
}
