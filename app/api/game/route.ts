import { isDmKey } from "@/server/auth";
import { createGame, HttpError } from "@/server/game";
import { guard, json, params } from "@/server/http";
import { getStore } from "@/server/store";

export const dynamic = "force-dynamic";

/** DM only: create a game seeded with Candlefair's scenes, players, shops and items. */
export async function POST(req: Request) {
  return guard(async () => {
    const { game, key } = params(req);
    if (!isDmKey(key)) throw new HttpError(401, "That DM key isn't right.", "bad-key");
    return json({ ok: true, version: await createGame(getStore(), game) });
  });
}
