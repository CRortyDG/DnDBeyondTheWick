import { actorOf, identify, viewFor, HttpError } from "@/server/game";
import { guard, json, params } from "@/server/http";
import { getStore } from "@/server/store";

export const dynamic = "force-dynamic";

/** The caller's filtered view. Read-only. */
export async function GET(req: Request) {
  return guard(async () => {
    const { game, player, key } = params(req);
    const store = getStore();
    const { state } = await store.read(game);
    if (!state) throw new HttpError(404, "No game here yet.", "no-game");
    const who = identify(state, player, key);
    if (who.kind === "unknown") throw new HttpError(404, "You're not at this table.", "unknown");
    if (who.kind === "taken") throw new HttpError(403, "That name is taken.", "taken");
    return json(await viewFor(store, game, actorOf(who)));
  });
}
