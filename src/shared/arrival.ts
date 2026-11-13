// The Arrival intro: the link texted to each player before session 0, the seat
// they claim at the end of it, and "The Table" on the TV.
//
// What a phone gets is built here from an allow-list, like projection.ts: only
// seat names and the player's own progress. Nothing else in the game is sent.

import type { GameState, Player } from "./types";

export const DEFAULT_TEMPLATE = "you’ve got a boat to catch \u{1F56F}️ {link}";
export const CHARACTER_MAX = 40;
export const WHY_MAX = 120;
/** The Table's scene id in new games. Older games get one from the Arrival tab. */
export const TABLE_SCENE_ID = "s-table";

/** Players who hold a seat: everyone who hasn't left the table, in the order they joined. */
export function seatedPlayers(g: Pick<GameState, "players">): Player[] {
  return g.players.filter((p) => !p.archived);
}

export function isClaimed(p: Player): boolean {
  return !!p.arrival?.claimedAt;
}

/** The name on a lit seat: the character, or the player's own name until they pick one. */
export function seatName(p: Player): string {
  return p.character?.trim() || p.name;
}

/** The path of a player's private link. */
export function arrivalPath(gameId: string, token: string): string {
  return `/arrive/${token}` + (gameId === "candlefair" ? "" : `?game=${encodeURIComponent(gameId)}`);
}

export function genericArrivalPath(gameId: string): string {
  return "/arrive" + (gameId === "candlefair" ? "" : `?game=${encodeURIComponent(gameId)}`);
}

/** The message the DM copies for one player. */
export function arrivalText(template: string | undefined, link: string, playerName: string): string {
  const t = template?.trim() ? template : DEFAULT_TEMPLATE;
  const out = t.replace(/\{link\}/g, link).replace(/\{name\}/g, playerName);
  return /\{link\}/.test(t) ? out : `${out} ${link}`;
}

/** Valid link codes: what makeToken produces. Anything else is treated as the generic link. */
export function isToken(s: string | null | undefined): s is string {
  return !!s && /^[A-Za-z0-9]{8,32}$/.test(s);
}

/** The player a link code belongs to (left-the-table players' links stop working). */
export function playerByToken(g: GameState, token: string): Player | null {
  if (!isToken(token)) return null;
  return g.players.find((p) => !p.archived && p.arrival?.token === token) ?? null;
}

export type ArrivalStatus = "new" | "copied" | "opened" | "finished" | "claimed";

/** The furthest step a player has reached, for the DM's Arrival tab. */
export function arrivalStatus(p: Player): ArrivalStatus {
  const a = p.arrival;
  if (!a) return "new";
  if (a.claimedAt) return "claimed";
  if (a.finishedAt) return "finished";
  if (a.openedAt) return "opened";
  if (a.copiedAt) return "copied";
  return "new";
}

// ---------------------------------------------------------------------------
// What the phone gets.

export interface ArrivalSeat {
  /** Shown only for claimed seats. */
  name: string | null;
  lit: boolean;
  me: boolean;
}

export interface ArrivalView {
  version: number;
  /** null on the generic link (or a link that no longer works). */
  me: {
    character: string;
    why: string;
    claimed: boolean;
    finished: boolean;
    /** Their usual player page ("Go to your table"). */
    tableHref: string;
  } | null;
  /** Every seat at the table. Only sent to someone with a working link. */
  seats: ArrivalSeat[];
  locked: boolean;
}

export function projectArrival(g: GameState, version: number, token: string | null): ArrivalView {
  const p = token ? playerByToken(g, token) : null;
  if (!p) return { version, me: null, seats: [], locked: !!g.arrival?.seatsLocked };
  const a = p.arrival!;
  const q = new URLSearchParams();
  if (g.id !== "candlefair") q.set("game", g.id);
  q.set("player", p.handle);
  return {
    version,
    me: {
      character: p.character ?? "",
      why: a.why ?? "",
      claimed: !!a.claimedAt,
      finished: !!a.finishedAt,
      tableHref: `/?${q}`,
    },
    seats: seatedPlayers(g).map((x) => ({ name: isClaimed(x) ? seatName(x) : null, lit: isClaimed(x), me: x.id === p.id })),
    locked: !!g.arrival?.seatsLocked,
  };
}

/**
 * Where the link opens: the seat page once the intro has been finished (on this
 * phone, or anywhere for this player), otherwise the intro. Replay is the only way back.
 */
export function opensOnSeat(me: ArrivalView["me"], finishedOnThisPhone: boolean): boolean {
  return finishedOnThisPhone || !!me?.finished;
}

// ---------------------------------------------------------------------------
// What the TV gets while The Table is live.

export interface TableView {
  seats: { name: string | null; lit: boolean }[];
  /** Unclaimed players' links for the corner QR code, with the name it's for. */
  qr: { name: string; path: string }[];
}

export function projectTable(g: GameState): TableView {
  const seated = seatedPlayers(g);
  return {
    seats: seated.map((p) => ({ name: isClaimed(p) ? seatName(p) : null, lit: isClaimed(p) })),
    qr: seated.filter((p) => !isClaimed(p) && p.arrival?.token).map((p) => ({ name: p.name, path: arrivalPath(g.id, p.arrival!.token) })),
  };
}
