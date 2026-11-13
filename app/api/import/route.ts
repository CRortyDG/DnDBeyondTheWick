import { isDmKey } from "@/server/auth";
import { HttpError } from "@/server/game";
import { guard, json, params } from "@/server/http";
import { getStore } from "@/server/store";
import { upgrade } from "@/shared/migrate";
import type { GameState, LedgerEntry } from "@/shared/types";

export const dynamic = "force-dynamic";

/** DM only: restore a backup made by /api/export. Replaces the game. */
export async function POST(req: Request) {
  return guard(async () => {
    const { game, key } = params(req);
    if (!isDmKey(key)) throw new HttpError(401, "That DM key isn't right.", "bad-key");
    const body = (await req.json().catch(() => null)) as { format?: string; state?: GameState; ledger?: LedgerEntry[] } | null;
    if (body?.format !== "candlefair-backup" || ![1, 2].includes(Number(body.state?.schema)) || !Array.isArray(body.ledger)) {
      throw new HttpError(400, "That doesn't look like a Candlefair backup.");
    }
    const state = { ...upgrade(body.state), id: game };
    const store = getStore();
    const v = await store.overwrite(game, state, body.ledger);
    await store.publish(game, v);
    return json({ ok: true, version: v });
  });
}
