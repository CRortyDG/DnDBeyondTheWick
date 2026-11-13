import { isDmKey } from "@/server/auth";
import { HttpError } from "@/server/game";
import { guard, json, params } from "@/server/http";
import { getStore } from "@/server/store";

export const dynamic = "force-dynamic";

/** DM only: the whole game and ledger as JSON, for safekeeping. */
export async function GET(req: Request) {
  return guard(async () => {
    const { game, key } = params(req);
    if (!isDmKey(key)) throw new HttpError(401, "That DM key isn't right.", "bad-key");
    const store = getStore();
    const { state, version } = await store.read(game);
    if (!state) throw new HttpError(404, "No game here yet.", "no-game");
    return json({ format: "candlefair-backup", exportedAt: Date.now(), version, state, ledger: await store.ledger(game) });
  });
}
