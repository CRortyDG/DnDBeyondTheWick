import { sha256 } from "./auth";
import { HttpError } from "./game";
import type { SnapshotData, Store } from "./store";
import type { GameState, LedgerEntry } from "@/shared/types";

/**
 * Moving a campaign to a new random code (DM only, Settings → Links).
 *
 * A code is the campaign's front door: anyone who has it can watch the TV and
 * knock. An old, short or leaked code can't be changed by editing it, so the
 * whole campaign moves to a new room under a new random code, and the old room
 * is emptied. What's left in the old room is only the new code and the hashes
 * of the keys that may learn it (the DM's and each signed-in player's), so a
 * screen that already plays here follows the move on its next load, and anyone
 * else sees no game at all.
 *
 * Images stay where they are in R2 (under the old code's folder): their links
 * are random and keep working. The new room records that folder as its own, so
 * when the campaign is eventually deleted those images go with it.
 */

export interface MovePack {
  state: GameState;
  ledger: LedgerEntry[];
  dmKeyHash: string;
  /** Safety snapshots, oldest first. */
  snapshots: { at: number; reason: string; data: SnapshotData }[];
  /** The campaign's counted image space (its upload quota). */
  uploads: { bytes: number; files: number };
  /** R2 folders holding this campaign's images: its own code, and any it moved from before. */
  prefixes: string[];
}

export interface MovedTo {
  to: string;
  /** sha256 of each key that may learn the new code. */
  hashes: string[];
}

/** A room that can be packed up, filled from a pack, or retired. */
export interface MovableStore extends Store {
  movePack(game: string): Promise<MovePack | null>;
  moveIn(game: string, pack: MovePack): Promise<void>;
  retire(game: string, to: string, hashes: string[]): Promise<void>;
}

/** The keys that follow the campaign: the DM's and every player who has signed in with one. */
export function followerHashes(pack: MovePack): string[] {
  return [...new Set([pack.dmKeyHash, ...pack.state.players.map((p) => p.keyHash).filter((h): h is string => !!h)])];
}

/** Move `from` to `to` (a fresh, empty code). The caller has checked the DM key. */
export async function moveCampaign(from: MovableStore, to: MovableStore, fromGame: string, toGame: string): Promise<void> {
  if ((await to.version(toGame)) !== 0) throw new HttpError(409, "That code is taken.");
  const pack = await from.movePack(fromGame);
  if (!pack) throw new HttpError(404, "No game here yet.", "no-game");
  await to.moveIn(toGame, { ...pack, state: { ...pack.state, id: toGame } });
  await from.retire(fromGame, toGame, followerHashes(pack));
}

const notHere = () =>
  // Not counted as a guess: screens left open on the old code keep reconnecting, and a whole table shares one address.
  new Response(JSON.stringify({ error: "No game here yet.", code: "no-game" }), { status: 404, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });

/**
 * What a retired room answers. Only a hello carrying a key that played here
 * learns where the campaign went; everything else looks like no game at all.
 */
export function movedAnswer(req: Request, moved: MovedTo, keyHeader: string): Response {
  const url = new URL(req.url);
  if (url.pathname === "/api/hello" && req.method === "POST") {
    const key = req.headers.get(keyHeader);
    const known = !!key && moved.hashes.includes(sha256(key));
    // The same answer a code that never existed gets, so the page shows "no game" rather than retrying.
    return new Response(JSON.stringify(known ? { status: "moved", game: moved.to } : { status: "no-game" }), {
      headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
    });
  }
  return notHere();
}
