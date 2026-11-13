import { sha256 } from "@/server/auth";
import { actorOf, execute, HttpError, identify, parseClientCommand } from "@/server/game";
import { guard, json, params } from "@/server/http";
import { getStore } from "@/server/store";

export const dynamic = "force-dynamic";

/** Every write from a browser. The DM key or player name is checked here, then again in the reducer. */
export async function POST(req: Request) {
  return guard(async () => {
    const { game, player, key } = params(req);
    const store = getStore();
    const { state } = await store.read(game);
    if (!state) throw new HttpError(404, "No game here yet.", "no-game");
    const who = identify(state, player, key);
    if (who.kind === "invalid") throw new HttpError(401, "That DM key isn't right.", "bad-key");
    if (who.kind === "taken") throw new HttpError(403, "That name is taken.", "taken");
    if (who.kind === "unknown") throw new HttpError(404, "You're not at this table.", "unknown");
    const actor = actorOf(who);
    const body = await req.json().catch(() => null);
    let cmd = parseClientCommand(actor, body);
    if (cmd.type === "me.lock") cmd = { type: "me.lockHashed", keyHash: sha256(cmd.key) };
    const r = await execute(store, game, actor, cmd);
    return json({ ok: true, version: r.version });
  });
}
