import { z } from "zod";
import { MERCHANT_SIGIL_SVG } from "./art/merchant-sigil";
import { isDmKey, KEY_HEADER, newDmKey, sha256 } from "./auth";
import { actorOf, createGame, execute, hello, HttpError, identify, parseClientCommand, viewFor } from "./game";
import type { Store } from "./store";
import { CHARACTER_MAX, isToken, playerByToken, projectArrival, WHY_MAX } from "@/shared/arrival";
import { normaliseGameId } from "@/shared/handles";
import { upgrade } from "@/shared/migrate";
import { gatedArtIsLive } from "@/shared/projection";
import { freshStart, seedGame } from "@/shared/seed";
import type { GameState, LedgerEntry } from "@/shared/types";

/**
 * The game's HTTP API, as plain Request -> Response. In production it runs
 * inside the campaign's Durable Object (worker/room.ts), with the room as the
 * store; tests call it with the in-memory store.
 */

export function params(req: Request) {
  const url = new URL(req.url);
  return {
    game: normaliseGameId(url.searchParams.get("game")),
    player: url.searchParams.get("player"),
    key: req.headers.get(KEY_HEADER),
  };
}

export function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
}

async function guard(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof HttpError) return json({ error: e.message, code: e.code }, e.status);
    console.error(e);
    return json({ error: "Something went wrong on the server." }, 500);
  }
}

async function requireDm(req: Request, store: Store, game: string) {
  if (!isDmKey(params(req).key, await store.dmKeyHash(game))) throw new HttpError(401, "That DM key isn't right.", "bad-key");
}

const arrivalBody = z.discriminatedUnion("type", [
  z.object({ type: z.literal("open") }),
  z.object({ type: z.literal("finish") }),
  z.object({ type: z.literal("claim"), character: z.string().max(CHARACTER_MAX * 2), why: z.string().max(WHY_MAX * 2) }),
]);

const createBody = z.object({ dmKeyHash: z.string().regex(/^[0-9a-f]{64}$/), name: z.string().trim().max(80).optional() });

const GATED: Record<string, string> = { "merchant-sigil": MERCHANT_SIGIL_SVG };

export async function handleApi(req: Request, store: Store): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;
  const method = req.method;
  return guard(async () => {
    const { game, player, key } = params(req);

    // First contact on page load: identifies the caller, creating ?player= names as needed.
    if (path === "/api/hello" && method === "POST") return json(await hello(game, player, key, store));

    // The caller's filtered view. Read-only.
    if (path === "/api/view" && method === "GET") {
      const { state } = await store.read(game);
      if (!state) throw new HttpError(404, "No game here yet.", "no-game");
      const who = identify(state, player, key, await store.dmKeyHash(game));
      if (who.kind === "unknown") throw new HttpError(404, "You're not at this table.", "unknown");
      if (who.kind === "taken") throw new HttpError(403, "That name is taken.", "taken");
      return json(await viewFor(store, game, actorOf(who)));
    }

    // Every write from a browser. The DM key or player name is checked here, then again in the reducer.
    if (path === "/api/command" && method === "POST") {
      const { state } = await store.read(game);
      if (!state) throw new HttpError(404, "No game here yet.", "no-game");
      const who = identify(state, player, key, await store.dmKeyHash(game));
      if (who.kind === "invalid") throw new HttpError(401, "That DM key isn't right.", "bad-key");
      if (who.kind === "taken") throw new HttpError(403, "That name is taken.", "taken");
      if (who.kind === "unknown") throw new HttpError(404, "You're not at this table.", "unknown");
      const actor = actorOf(who);
      let cmd = parseClientCommand(actor, await req.json().catch(() => null));
      if (cmd.type === "me.lock") cmd = { type: "me.lockHashed", keyHash: sha256(cmd.key) };
      const r = await execute(store, game, actor, cmd);
      return json({ ok: true, version: r.version, ...(r.info ? { info: r.info } : {}) });
    }

    // Cheap safety-net poll: just the version number.
    if (path === "/api/version" && method === "GET") return json({ version: await store.version(game) });

    // The Arrival page: seats and this player's own progress. Nothing else in the game.
    if (path === "/api/arrival") {
      const t = url.searchParams.get("t");
      const token = isToken(t) ? t : null;
      if (method === "GET") {
        const { state, version } = await store.read(game);
        if (!state) return json({ version: 0, me: null, seats: [], locked: false });
        return json(projectArrival(state, version, token));
      }
      if (method === "POST") {
        if (!token) throw new HttpError(403, "Use the link the DM sent you to claim a seat.", "no-link");
        const { state } = await store.read(game);
        if (!state) throw new HttpError(404, "No game here yet.", "no-game");
        const p = playerByToken(state, token);
        if (!p) throw new HttpError(403, "That link doesn't work any more. Ask the DM for a new one.", "no-link");
        const r = arrivalBody.safeParse(await req.json().catch(() => null));
        if (!r.success) throw new HttpError(400, "That request didn't make sense.");
        const b = r.data;
        const cmd =
          b.type === "claim"
            ? ({ type: "system.arrivalClaim", playerId: p.id, character: b.character, why: b.why } as const)
            : ({ type: "system.arrivalStep", playerId: p.id, step: b.type } as const);
        const out = await execute(store, game, { role: "system" }, cmd);
        return json(projectArrival(out.state, out.version, token));
      }
    }

    // DM only: the whole game and ledger as JSON, for safekeeping.
    if (path === "/api/export" && method === "GET") {
      await requireDm(req, store, game);
      const { state, version } = await store.read(game);
      if (!state) throw new HttpError(404, "No game here yet.", "no-game");
      return json({ format: "candlefair-backup", exportedAt: Date.now(), version, state, ledger: await store.ledger(game) });
    }

    // DM only: restore a backup made by /api/export. Replaces the game.
    if (path === "/api/import" && method === "POST") {
      await requireDm(req, store, game);
      const body = (await req.json().catch(() => null)) as { format?: string; state?: GameState; ledger?: LedgerEntry[] } | null;
      if (body?.format !== "candlefair-backup" || ![1, 2].includes(Number(body.state?.schema)) || !Array.isArray(body.ledger)) {
        throw new HttpError(400, "That doesn't look like a Candlefair backup.");
      }
      const state = { ...upgrade(body.state), id: game };
      const v = await store.overwrite(game, state, body.ledger);
      await store.publish(game, v);
      return json({ ok: true, version: v });
    }

    // DM only. mode "play": zero every purse, clear the ledger and sessions, keep
    // players, scenes, shops and items. mode "all": back to the original seed.
    if (path === "/api/reset" && method === "POST") {
      await requireDm(req, store, game);
      const body = (await req.json().catch(() => ({}))) as { mode?: string };
      if (body.mode !== "play" && body.mode !== "all") throw new HttpError(400, "Choose what to reset.");
      const { state } = await store.read(game);
      if (!state) throw new HttpError(404, "No game here yet.", "no-game");
      const next = body.mode === "all" ? seedGame(game, state.name) : freshStart(state);
      const v = await store.overwrite(game, next, []);
      await store.publish(game, v);
      return json({ ok: true, version: v });
    }

    // DM only: replace the DM key. Every old DM link and saved key stops working.
    if (path === "/api/rekey" && method === "POST") {
      await requireDm(req, store, game);
      const fresh = newDmKey();
      await store.setDmKeyHash(game, sha256(fresh));
      // Screens still holding the old key hear about it now, not on the next change.
      await store.publish(game, await store.version(game));
      return json({ ok: true, key: fresh });
    }

    // Reveal-only art: served to the DM any time, to everyone else only while its scene is live.
    const art = /^\/api\/art\/([a-z0-9-]+)$/.exec(path);
    if (art && method === "GET") {
      const svg = GATED[art[1]];
      const notFound = () => new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
      if (!svg) return notFound();
      const { state } = await store.read(game);
      const ok = isDmKey(key, await store.dmKeyHash(game)) || (state !== null && gatedArtIsLive(state, art[1]));
      if (!ok) return notFound();
      return new Response(svg, { headers: { "Content-Type": "image/svg+xml", "Cache-Control": "private, no-store" } });
    }

    // Internal (only the Worker can reach these paths): create the campaign, check a DM key.
    if (path === "/internal/create" && method === "POST") {
      const r = createBody.safeParse(await req.json().catch(() => null));
      if (!r.success) throw new HttpError(400, "That request didn't make sense.");
      const v = await createGame(store, game, r.data.dmKeyHash, r.data.name || undefined);
      return json({ ok: true, game, version: v });
    }
    if (path === "/internal/dm-check" && method === "GET") {
      await requireDm(req, store, game);
      return json({ ok: true });
    }

    throw new HttpError(404, "Not found.");
  });
}
