import { z } from "zod";
import { execute, HttpError } from "@/server/game";
import { guard, json, params } from "@/server/http";
import { getStore } from "@/server/store";
import { CHARACTER_MAX, isToken, playerByToken, projectArrival, WHY_MAX } from "@/shared/arrival";

export const dynamic = "force-dynamic";

function tokenOf(req: Request): string | null {
  const t = new URL(req.url).searchParams.get("t");
  return isToken(t) ? t : null;
}

/** The Arrival page's data: seats and this player's own progress. Nothing else in the game. */
export async function GET(req: Request) {
  return guard(async () => {
    const { game } = params(req);
    const { state, version } = await getStore().read(game);
    if (!state) return json({ version: 0, me: null, seats: [], locked: false });
    return json(projectArrival(state, version, tokenOf(req)));
  });
}

const body = z.discriminatedUnion("type", [
  z.object({ type: z.literal("open") }),
  z.object({ type: z.literal("finish") }),
  z.object({ type: z.literal("claim"), character: z.string().max(CHARACTER_MAX * 2), why: z.string().max(WHY_MAX * 2) }),
]);

/** Writes from a player's private link. Without a working link code nothing can be claimed. */
export async function POST(req: Request) {
  return guard(async () => {
    const { game } = params(req);
    const token = tokenOf(req);
    if (!token) throw new HttpError(403, "Use the link the DM sent you to claim a seat.", "no-link");
    const store = getStore();
    const { state } = await store.read(game);
    if (!state) throw new HttpError(404, "No game here yet.", "no-game");
    const p = playerByToken(state, token);
    if (!p) throw new HttpError(403, "That link doesn't work any more. Ask the DM for a new one.", "no-link");
    const r = body.safeParse(await req.json().catch(() => null));
    if (!r.success) throw new HttpError(400, "That request didn't make sense.");
    const b = r.data;
    const cmd =
      b.type === "claim"
        ? ({ type: "system.arrivalClaim", playerId: p.id, character: b.character, why: b.why } as const)
        : ({ type: "system.arrivalStep", playerId: p.id, step: b.type } as const);
    const out = await execute(store, game, { role: "system" }, cmd);
    return json(projectArrival(out.state, out.version, token));
  });
}
