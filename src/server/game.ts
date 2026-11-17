import { presetOff, type PresetId } from "@/shared/features";
import { dmCommand, playerCommand, type Command } from "@/shared/commands";
import { displayNameFrom, isReservedHandle, normaliseGameId, normaliseHandle } from "@/shared/handles";
import { projectDm, projectPlayer, projectTv, type View } from "@/shared/projection";
import { apply, CommandError } from "@/shared/reducer";
import { blankGame, candlefairGame, fromPreset } from "@/shared/presets";
import { marrowmereGame } from "./seed-marrowmere";
import { seatedCount, seatsOf } from "@/shared/seed";
import type { Actor, GameState, LedgerEntry } from "@/shared/types";
import { isDmKey, keyMatches, makeToken, sha256 } from "./auth";
import { loadPreset } from "./presets";
import type { Store } from "./store";

/** The biggest a saved game may grow. A Durable Object row tops out at 2 MB, so past this a game refuses new growth instead of breaking. */
export const MAX_STATE_CHARS = 1_500_000;

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message);
  }
}

/** Who is asking, from ?player= and the key header. Never writes. */
export type Who =
  | { kind: "dm" }
  | { kind: "tv" }
  | { kind: "player"; playerId: string }
  | { kind: "unknown"; handle: string; name: string }
  | { kind: "taken"; handle: string }
  | { kind: "invalid" };

/** dmKeyHash: the campaign's stored DM key hash (null = nobody can be the DM). */
export function identify(state: GameState | null, rawPlayer: string | null, key: string | null, dmKeyHash: string | null): Who {
  const raw = (rawPlayer ?? "").trim();
  const lower = raw.toLowerCase();
  if (lower === "dm") return isDmKey(key, dmKeyHash) ? { kind: "dm" } : { kind: "invalid" };
  if (lower === "tv") return { kind: "tv" };
  const handle = normaliseHandle(raw);
  if (!handle || isReservedHandle(handle)) return { kind: "invalid" };
  const p = state?.players.find((x) => x.handle === handle) ?? byName(state, handle);
  if (!p) return { kind: "unknown", handle, name: displayNameFrom(raw) };
  if (!keyMatches(key, p.keyHash)) return { kind: "taken", handle };
  return { kind: "player", playerId: p.id };
}

/**
 * A player the DM renamed keeps their old URL name (player1), so typing "Ana"
 * on the front page finds Ana by her name, or her character's, instead of
 * making a second Ana. Only when exactly one player at the table matches.
 */
function byName(state: GameState | null, handle: string) {
  const hits = (state?.players ?? []).filter((x) => !x.archived && (normaliseHandle(x.name) === handle || (!!x.character && normaliseHandle(x.character) === handle)));
  return hits.length === 1 ? hits[0] : undefined;
}

/**
 * Who is asking, in a practice room. Every screen there is the DM's own: the
 * DM key is required for all of them, and ?player= only says which screen to
 * show (the DM console, the TV, or a stand-in's phone). No name is ever created.
 */
export function identifyPractice(state: GameState | null, rawPlayer: string | null, key: string | null, dmKeyHash: string | null): Who {
  if (!isDmKey(key, dmKeyHash)) return { kind: "invalid" };
  const lower = (rawPlayer ?? "").trim().toLowerCase();
  if (lower === "dm") return { kind: "dm" };
  if (lower === "tv") return { kind: "tv" };
  const handle = normaliseHandle(rawPlayer ?? "");
  const p = handle ? state?.players.find((x) => x.handle === handle) : undefined;
  if (!p) return { kind: "unknown", handle, name: displayNameFrom(rawPlayer ?? "") };
  return { kind: "player", playerId: p.id };
}

export function actorOf(who: Who): Actor {
  if (who.kind === "dm") return { role: "dm" };
  if (who.kind === "tv") return { role: "tv" };
  if (who.kind === "player") return { role: "player", playerId: who.playerId };
  throw new HttpError(403, "Not allowed.");
}

/** Run a command with an atomic save, retrying if someone else saved first. */
export async function execute(store: Store, game: string, actor: Actor, cmd: Command, now = Date.now()) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const { state, version } = await store.read(game);
    if (!state) throw new HttpError(404, "No game here yet.", "no-game");
    let result;
    try {
      result = apply(state, cmd, { now, actor, token: makeToken });
    } catch (e) {
      if (e instanceof CommandError) throw new HttpError(400, e.message, e.code);
      throw e;
    }
    // Nothing changed (a repeat knock, a no-op toggle): don't save or wake every screen.
    const before = JSON.stringify(state);
    const after = JSON.stringify(result.state);
    if (result.ledger.length === 0 && after === before) {
      return { version, state: result.state, playerId: result.playerId, info: result.info };
    }
    // A game too big to save would stop working for everyone. Refuse growth past the cap; shrinking is always allowed.
    if (after.length > MAX_STATE_CHARS && after.length > before.length) {
      throw new HttpError(413, "This campaign is too full to save more. The DM can tidy up old notes, scenes or requests.", "too-big");
    }
    const v = await store.commit(game, version, result.state, result.ledger);
    if (v !== null) {
      await store.publish(game, v);
      return { version: v, state: result.state, playerId: result.playerId, info: result.info };
    }
    await new Promise((r) => setTimeout(r, 20 + Math.random() * 60 * (attempt + 1)));
  }
  throw new HttpError(409, "Too many changes at once. Try again.");
}

export async function viewFor(store: Store, game: string, actor: Actor): Promise<View> {
  const { state, version } = await store.read(game);
  if (!state) throw new HttpError(404, "No game here yet.", "no-game");
  return projectFor(state, version, actor, () => store.ledger(game));
}

/** One screen's filtered view. ledger is only loaded for the DM and players. */
export async function projectFor(state: GameState, version: number, actor: Actor, ledger: () => Promise<LedgerEntry[]> | LedgerEntry[]): Promise<View> {
  if (actor.role === "dm") return projectDm(state, version, await ledger());
  if (actor.role === "tv") return projectTv(state, version);
  if (actor.role === "player") {
    if (!state.players.some((p) => p.id === actor.playerId)) throw new HttpError(404, "You're not at this table.", "unknown");
    return projectPlayer(state, version, actor.playerId, await ledger());
  }
  throw new HttpError(403, "Not allowed.");
}

/** Parse and authorise a command coming from a browser. */
export function parseClientCommand(actor: Actor, body: unknown): Command | { type: "me.lock"; key: string } {
  if (actor.role === "dm") {
    const r = dmCommand.safeParse(body);
    if (!r.success) throw new HttpError(400, "That request didn't make sense.");
    return r.data;
  }
  if (actor.role === "player") {
    const r = playerCommand.safeParse(body);
    if (!r.success) throw new HttpError(403, "Only the DM can do that.");
    return r.data;
  }
  throw new HttpError(403, "The TV can't change anything.");
}

export type HelloResult =
  | { status: "ok"; view: View; handle?: string }
  | { status: "taken" | "knocking" | "full" | "invalid" | "no-game" };

/**
 * First contact when a page loads. Creates an unknown ?player= (unless the
 * door is closed), records a visit, and returns the caller's view.
 */
export async function hello(gameRaw: string | null, rawPlayer: string | null, key: string | null, store: Store): Promise<HelloResult> {
  const game = normaliseGameId(gameRaw);
  let { state } = await store.read(game);
  const dmHash = await store.dmKeyHash(game);
  const who = identify(state, rawPlayer, key, dmHash);
  if (who.kind === "invalid") return { status: "invalid" }; // includes ?player=DM with a wrong key
  if (!state) return { status: "no-game" }; // the DM view then offers "Create the game"
  if (who.kind === "taken") return { status: "taken" };
  if (who.kind === "dm" || who.kind === "tv") return { status: "ok", view: await viewFor(store, game, actorOf(who)) };

  const system: Actor = { role: "system" };
  if (who.kind === "unknown") {
    // A closed door, or a full table: knock and let the DM decide.
    // Once a session is running, a brand-new name knocks too, so nobody who only knows the code
    // can grab empty seats mid-game; the DM lets a late player in with one tap.
    const full = seatedCount(state) >= seatsOf(state);
    const running = !!state.currentSessionId;
    if (state.doorClosed || full || running) {
      await execute(store, game, system, { type: "system.knock", handle: who.handle });
      return { status: full && !state.doorClosed ? "full" : "knocking" };
    }
    try {
      const r = await execute(store, game, system, {
        type: "system.join",
        handle: who.handle,
        name: who.name,
        ...(key ? { keyHash: sha256(key) } : {}),
      });
      return { status: "ok", view: await viewFor(store, game, { role: "player", playerId: r.playerId! }), handle: who.handle };
    } catch (e) {
      // Someone else grabbed the name a moment ago: re-identify.
      ({ state } = await store.read(game));
      const again = identify(state, rawPlayer, key, dmHash);
      if (again.kind !== "player") return { status: again.kind === "taken" ? "taken" : "invalid" };
      return { status: "ok", view: await viewFor(store, game, actorOf(again)) };
    }
  }
  // A name nobody has locked yet, signing in with a key: tie the name to that key now, so
  // someone who only knows the code and the name can't act as this player. The key is the
  // player's personal sign-in link, so their other devices get in by opening that link.
  if (key && !state.players.find((x) => x.id === who.playerId)?.keyHash) {
    await execute(store, game, system, { type: "system.autoLock", playerId: who.playerId, keyHash: sha256(key) });
  }
  await execute(store, game, system, { type: "system.hello", playerId: who.playerId });
  return { status: "ok", view: await viewFor(store, game, actorOf(who)), handle: normaliseHandle(rawPlayer ?? "") };
}

/** Where a new campaign starts: "blank" (the default), "candlefair", "marrowmere", or "preset:<code>". */
export type StartFrom = string | undefined;

/** The starting state for a campaign, blank by default. A preset is loaded from the preset store. */
export async function startingState(store: Store, game: string, name: string | undefined, from: StartFrom): Promise<GameState> {
  if (!from || from === "blank") return blankGame(game, name);
  if (from === "candlefair") return candlefairGame(game, name);
  if (from === "marrowmere") return marrowmereGame(game, name);
  if (from.startsWith("preset:")) {
    if (!store.presets) throw new HttpError(503, "Presets aren't available here.");
    const p = await loadPreset(store.presets, from.slice(7));
    return fromPreset(p.setup, game, name, { code: p.code, name: p.name });
  }
  throw new HttpError(400, "Choose what to start from.");
}

/** A new campaign, owned by whoever holds the DM key: blank, Candlefair, or from a saved preset. */
export async function createGame(store: Store, gameRaw: string, dmKeyHash: string, name?: string, from?: StartFrom, features?: PresetId) {
  const game = normaliseGameId(gameRaw);
  const { state } = await store.read(game);
  if (state) throw new HttpError(409, "That campaign code is taken.", "taken");
  // Load the preset first: a bad code shouldn't leave a half-made campaign behind.
  const start = await startingState(store, game, name, from);
  // Which features it starts with (Minimal, Standard or Everything). A saved preset keeps its own unless one is picked.
  if (features) {
    const off = presetOff(features, start.featuresOff ?? []);
    if (off.length) start.featuresOff = off;
    else delete start.featuresOff;
  }
  await store.setDmKeyHash(game, dmKeyHash);
  return store.overwrite(game, start, []);
}

export { normaliseGameId };
