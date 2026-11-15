import { z } from "zod";
import { MERCHANT_SIGIL_SVG } from "./art/merchant-sigil";
import { ARTUM_SVG, CHEF_SVG, MAGS_WICK_SVG } from "./art/portraits";
import { isDmKey, KEY_HEADER, newDmKey, sha256 } from "./auth";
import { actorOf, createGame, execute, startingState, hello, HttpError, identify, MAX_STATE_CHARS, parseClientCommand, viewFor } from "./game";
import type { Store } from "./store";
import { CHARACTER_MAX, isToken, playerByToken, projectArrival, WHY_MAX } from "@/shared/arrival";
import { STARTER_IDS } from "@/shared/starters";
import { normaliseGameId } from "@/shared/handles";
import { upgrade } from "@/shared/migrate";
import { gatedArtIsLive } from "@/shared/projection";
import { originOf, presetSetup } from "@/shared/presets";
import { freshStart } from "@/shared/seed";
import { deletePreset, presetInfo, renamePreset, savePreset, type PresetStore } from "./presets";
import type { GameState, LedgerEntry } from "@/shared/types";
import { handleBuilder } from "./builder";
import { clearDrafts, handleBuilderAdmin } from "./builderAdmin";
import { carriesBuilderKey } from "./builderKeys";

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

/**
 * Set on an answer that tells a guesser something: no game with that code, a
 * wrong DM key or name lock, a dead Arrival link. The Worker counts these per
 * address and shuts out an address that keeps guessing, then strips the header.
 */
export const MISS_HEADER = "x-candlefair-miss";
const MISS_CODES = new Set(["no-game", "bad-key", "taken", "no-link", "no-preset"]);

export function miss(res: Response): Response {
  res.headers.set(MISS_HEADER, "1");
  return res;
}

/** A request body bigger than this is refused before it is parsed. A backup import may be bigger. */
const MAX_BODY = 64 * 1024;
const MAX_IMPORT = 4 * 1024 * 1024;

async function readJson(req: Request, max = MAX_BODY): Promise<unknown> {
  const len = Number(req.headers.get("Content-Length") ?? 0);
  if (len > max) throw new HttpError(413, "That request is too big.");
  const text = await req.text().catch(() => "");
  if (text.length > max) throw new HttpError(413, "That request is too big.");
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function guard(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof HttpError) {
      const res = json({ error: e.message, code: e.code }, e.status);
      return e.code && MISS_CODES.has(e.code) ? miss(res) : res;
    }
    console.error(e);
    return json({ error: "Something went wrong on the server." }, 500);
  }
}

/** Keep a copy of the whole game before something that replaces it. Never stops the action itself. */
async function snapshot(store: Store, game: string, reason: string) {
  if (!store.saveSnapshot) return;
  try {
    const { state } = await store.read(game);
    if (state) await store.saveSnapshot(game, reason, Date.now(), { state, ledger: await store.ledger(game) });
  } catch (e) {
    console.error("snapshot failed", e);
  }
}

async function requireDm(req: Request, store: Store, game: string) {
  if (!isDmKey(params(req).key, await store.dmKeyHash(game))) throw new HttpError(401, "That DM key isn't right.", "bad-key");
}

const arrivalBody = z.discriminatedUnion("type", [
  z.object({ type: z.literal("open") }),
  z.object({ type: z.literal("finish") }),
  z.object({ type: z.literal("claim"), character: z.string().max(CHARACTER_MAX * 2), why: z.string().max(WHY_MAX * 2), pick: z.enum(STARTER_IDS).nullable().optional() }),
]);

const createBody = z.object({
  dmKeyHash: z.string().regex(/^[0-9a-f]{64}$/),
  name: z.string().trim().max(80).optional(),
  from: z.union([z.enum(["blank", "candlefair"]), z.string().regex(/^preset:[a-z0-9]{10}$/)]).optional(),
});

const ledgerRemoveBody = z.object({
  ids: z.array(z.string().max(64)).min(1).max(500),
  undo: z.boolean().optional(),
});

const GATED: Record<string, string> = { "merchant-sigil": MERCHANT_SIGIL_SVG, artum: ARTUM_SVG, "mags-wick": MAGS_WICK_SVG, chef: CHEF_SVG };

export async function handleApi(req: Request, store: Store): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;
  const method = req.method;
  // The Worldbuilder has its own door, its own key and its own allowlist (builder.ts).
  if (path.startsWith("/api/builder/")) return handleBuilder(req, store);
  return guard(async () => {
    // A builder key opens nothing else: not the DM's routes, not a player's.
    if (carriesBuilderKey(req)) throw new HttpError(403, "A Worldbuilder key only works on the Worldbuilder API.", "wrong-door");

    const { game, player, key } = params(req);

    // First contact on page load: identifies the caller, creating ?player= names as needed.
    if (path === "/api/hello" && method === "POST") {
      const r = await hello(game, player, key, store);
      return r.status === "no-game" || r.status === "taken" || r.status === "invalid" ? miss(json(r)) : json(r);
    }

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
      let cmd = parseClientCommand(actor, await readJson(req));
      if (cmd.type === "me.lock") cmd = { type: "me.lockHashed", keyHash: sha256(cmd.key) };
      const r = await execute(store, game, actor, cmd);
      if (cmd.type === "session.end") {
        const ended = r.state.sessions.filter((x) => x.endedAt).sort((a, b) => (b.endedAt ?? 0) - (a.endedAt ?? 0))[0];
        await snapshot(store, game, `End of ${ended?.title ?? "a session"}`);
      }
      return json({ ok: true, version: r.version, ...(r.info ? { info: r.info } : {}) });
    }

    // Cheap safety-net poll: just the version number.
    if (path === "/api/version" && method === "GET") {
      const version = await store.version(game);
      return version === 0 ? miss(json({ version })) : json({ version });
    }

    // The Arrival page: seats and this player's own progress. Nothing else in the game.
    if (path === "/api/arrival") {
      const t = url.searchParams.get("t");
      const token = isToken(t) ? t : null;
      if (method === "GET") {
        let { state, version } = await store.read(game);
        if (!state) return miss(json({ version: 0, me: null, seats: [], locked: false }));
        // The first visit locks an unlocked name with this link, so nobody else can play as them.
        const p = token ? playerByToken(state, token) : null;
        if (p && !p.keyHash) ({ state, version } = await execute(store, game, { role: "system" }, { type: "system.arrivalKey", playerId: p.id, keyHash: sha256(token!) }));
        const view = projectArrival(state, version, token);
        return token && !view.me ? miss(json(view)) : json(view);
      }
      if (method === "POST") {
        if (!token) throw new HttpError(403, "Use the link the DM sent you to claim a seat.", "no-link");
        const { state } = await store.read(game);
        if (!state) throw new HttpError(404, "No game here yet.", "no-game");
        const p = playerByToken(state, token);
        if (!p) throw new HttpError(403, "That link doesn't work any more. Ask the DM for a new one.", "no-link");
        const r = arrivalBody.safeParse(await readJson(req));
        if (!r.success) throw new HttpError(400, "That request didn't make sense.");
        const b = r.data;
        const cmd =
          b.type === "claim"
            ? ({ type: "system.arrivalClaim", playerId: p.id, character: b.character, why: b.why, pick: b.pick } as const)
            : ({ type: "system.arrivalStep", playerId: p.id, step: b.type } as const);
        let out = await execute(store, game, { role: "system" }, cmd);
        if (!out.state.players.find((x) => x.id === p.id)?.keyHash) {
          out = await execute(store, game, { role: "system" }, { type: "system.arrivalKey", playerId: p.id, keyHash: sha256(token) });
        }
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
      const body = (await readJson(req, MAX_IMPORT)) as { format?: string; state?: GameState; ledger?: LedgerEntry[] } | null;
      if (body?.format !== "candlefair-backup" || ![1, 2].includes(Number(body.state?.schema)) || !Array.isArray(body.ledger)) {
        throw new HttpError(400, "That doesn't look like a Candlefair backup.");
      }
      const state = { ...upgrade(body.state), id: game };
      if (JSON.stringify(state).length > MAX_STATE_CHARS) throw new HttpError(413, "That backup is too big to restore.");
      await snapshot(store, game, "Before restoring a backup");
      const v = await store.overwrite(game, state, body.ledger);
      await store.publish(game, v);
      return json({ ok: true, version: v });
    }

    // DM only: take lines out of the ledger (say, test entries before session one).
    // undo: also move their gold back out of (or into) each purse.
    if (path === "/api/ledger/remove" && method === "POST") {
      await requireDm(req, store, game);
      const r = ledgerRemoveBody.safeParse(await readJson(req));
      if (!r.success) throw new HttpError(400, "Choose which ledger lines to remove.");
      const ids = new Set(r.data.ids);
      let snapped = false;
      for (let attempt = 0; attempt < 3; attempt++) {
        const { state, version } = await store.read(game);
        if (!state) throw new HttpError(404, "No game here yet.", "no-game");
        const all = await store.ledger(game);
        const gone = all.filter((l) => ids.has(l.id));
        if (gone.length === 0) throw new HttpError(404, "Those lines are already gone.");
        if (r.data.undo) {
          for (const l of gone) {
            const p = state.players.find((x) => x.id === l.playerId);
            if (p) p.balanceCp -= l.amountCp;
          }
        }
        // overwrite() doesn't check versions, so make sure nobody saved since we read.
        if ((await store.version(game)) !== version) continue;
        if (!snapped && (snapped = true)) await snapshot(store, game, `Before removing ${gone.length} ledger ${gone.length === 1 ? "line" : "lines"}`);
        const v = await store.overwrite(game, state, all.filter((l) => !ids.has(l.id)));
        await store.publish(game, v);
        return json({ ok: true, version: v, removed: gone.length });
      }
      throw new HttpError(409, "The game changed while removing those lines. Try again.");
    }

    // DM only. mode "play": zero every purse, clear the ledger and sessions, keep
    // players, scenes, shops and items. mode "all": back to where the campaign
    // started (blank, Candlefair, or the preset it was made from).
    if (path === "/api/reset" && method === "POST") {
      await requireDm(req, store, game);
      const body = ((await readJson(req)) ?? {}) as { mode?: string };
      if (body.mode !== "play" && body.mode !== "all") throw new HttpError(400, "Choose what to reset.");
      const { state } = await store.read(game);
      if (!state) throw new HttpError(404, "No game here yet.", "no-game");
      await snapshot(store, game, body.mode === "all" ? "Before resetting everything" : "Before clearing gold, ledger and sessions");
      let next: GameState;
      if (body.mode === "all") {
        const o = originOf(state);
        next = await startingState(store, game, state.name, o.kind === "preset" ? `preset:${o.code}` : o.kind);
      } else next = freshStart(state);
      if (body.mode === "all") await clearDrafts(store);
      const v = await store.overwrite(game, next, []);
      await store.publish(game, v);
      return json({ ok: true, version: v });
    }

    // DM only: Worldbuilder keys, the on/off switch, the review queue and Activity.
    if (path.startsWith("/api/builder-admin/")) {
      await requireDm(req, store, game);
      return handleBuilderAdmin(req, store, game);
    }

    // DM only: the safety snapshots, newest first.
    if (path === "/api/snapshots" && method === "GET") {
      await requireDm(req, store, game);
      return json({ snapshots: store.listSnapshots ? await store.listSnapshots(game) : [] });
    }

    // DM only: what this campaign has used of Cloudflare (the Hosting costs box). Null where it isn't counted.
    if (path === "/api/usage" && method === "GET") {
      await requireDm(req, store, game);
      return json({ usage: store.usage ? await store.usage(game) : null });
    }

    // DM only: put the game back to a snapshot (keeping a snapshot of now first).
    if (path === "/api/snapshots/restore" && method === "POST") {
      await requireDm(req, store, game);
      const id = Number(((await readJson(req)) as { id?: unknown } | null)?.id);
      const snap = Number.isInteger(id) && store.loadSnapshot ? await store.loadSnapshot(game, id) : null;
      if (!snap) throw new HttpError(404, "That snapshot is gone.");
      await snapshot(store, game, "Before going back to a snapshot");
      const v = await store.overwrite(game, { ...upgrade(snap.state), id: game }, snap.ledger);
      await store.publish(game, v);
      return json({ ok: true, version: v });
    }

    // DM only: save this campaign's setup as a preset (or, with its code and owner token, over one).
    if (path === "/api/preset/save" && method === "POST") {
      await requireDm(req, store, game);
      if (!store.presets) throw new HttpError(503, "Presets aren't available here.");
      const body = ((await readJson(req)) ?? {}) as { name?: unknown; code?: unknown; token?: unknown };
      const { state } = await store.read(game);
      if (!state) throw new HttpError(404, "No game here yet.", "no-game");
      return json({ ok: true, ...(await savePreset(store.presets, presetSetup(state), body)) });
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

    // Reveal-only art: served to the DM any time; to everyone else while its scene is live,
    // or (portraits) once the party has found whoever it shows.
    const art = /^\/api\/art\/([a-z0-9-]+)$/.exec(path);
    if (art && method === "GET") {
      const svg = GATED[art[1]];
      const notFound = () => new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
      if (!svg) return notFound();
      const { state } = await store.read(game);
      const ok = isDmKey(key, await store.dmKeyHash(game)) || (state !== null && gatedArtIsLive(state, art[1]));
      if (!ok) return notFound();
      // Kept a few minutes by the browser that was allowed to see it, so a portrait shown again
      // (switching tabs on a phone) doesn't ask the server, and the table's request allowance, every time.
      return new Response(svg, { headers: { "Content-Type": "image/svg+xml", "Cache-Control": "private, max-age=300" } });
    }

    // Internal (only the Worker can reach these paths): create the campaign, check a DM key.
    if (path === "/internal/create" && method === "POST") {
      const r = createBody.safeParse(await readJson(req));
      if (!r.success) throw new HttpError(400, "That request didn't make sense.");
      const v = await createGame(store, game, r.data.dmKeyHash, r.data.name || undefined, r.data.from);
      return json({ ok: true, game, version: v });
    }
    if (path === "/internal/dm-check" && method === "GET") {
      await requireDm(req, store, game);
      return json({ ok: true });
    }

    throw new HttpError(404, "Not found.");
  });
}

/**
 * Preset routes that belong to no campaign, so the Worker answers them itself:
 * look a code up (for the create screen), rename or delete one you saved.
 */
export function isPresetPath(path: string): boolean {
  return path === "/api/preset" || path === "/api/preset/rename" || path === "/api/preset/delete";
}

export async function handlePresetApi(req: Request, presets: PresetStore): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;
  return guard(async () => {
    if (path === "/api/preset" && req.method === "GET") return json(await presetInfo(presets, url.searchParams.get("code")));
    if (req.method !== "POST") throw new HttpError(404, "Not found.");
    const body = ((await readJson(req)) ?? {}) as { code?: unknown; token?: unknown; name?: unknown };
    if (path === "/api/preset/rename") return json({ ok: true, ...(await renamePreset(presets, body.code, body.token, body.name)) });
    if (path === "/api/preset/delete") return json(await deletePreset(presets, body.code, body.token));
    throw new HttpError(404, "Not found.");
  });
}
