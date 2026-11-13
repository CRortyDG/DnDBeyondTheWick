import { isDmKey } from "@/server/auth";
import { HttpError } from "@/server/game";
import { guard, json, params } from "@/server/http";
import { getStore } from "@/server/store";
import { freshStart, seedGame } from "@/shared/seed";

export const dynamic = "force-dynamic";

/**
 * DM only. mode "play": zero every purse, clear the ledger and sessions, keep
 * players, scenes, shops and items. mode "all": back to the original seed.
 */
export async function POST(req: Request) {
  return guard(async () => {
    const { game, key } = params(req);
    if (!isDmKey(key)) throw new HttpError(401, "That DM key isn't right.", "bad-key");
    const body = (await req.json().catch(() => ({}))) as { mode?: string };
    if (body.mode !== "play" && body.mode !== "all") throw new HttpError(400, "Choose what to reset.");
    const store = getStore();
    const { state } = await store.read(game);
    if (!state) throw new HttpError(404, "No game here yet.", "no-game");
    const next = body.mode === "all" ? seedGame(game, state.name) : freshStart(state);
    const v = await store.overwrite(game, next, []);
    await store.publish(game, v);
    return json({ ok: true, version: v });
  });
}
