// The Arrival intro: the link texted to each player before session 0, the seat
// they claim at the end of it, and "The Table" on the TV.
//
// What a phone gets is built here from an allow-list, like projection.ts: only
// seat names and the player's own progress. Nothing else in the game is sent.

import type { GameState, IntroClip, IntroSlide, Player } from "./types";

export const DEFAULT_TEMPLATE = "you’ve got a boat to catch \u{1F56F}️ {link}";
export const CHARACTER_MAX = 40;
export const WHY_MAX = 120;
export const WELCOME_MAX = 120;
export const SLIDES_MAX = 12;
export const SLIDE_TEXT_MAX = 240;
/** Every player downloads the intro on their phone, often on mobile data. */
export const CLIP_VIDEO_MAX = 20 * 1024 * 1024;
/** GIFs are 5 to 10 times bigger than a video of the same clip. */
export const CLIP_GIF_MAX = 10 * 1024 * 1024;
/** An uploaded intro clip in this site's file store. */
export const CLIP_URL_RE = /^\/api\/files\/(?:p\/[a-z0-9]{10}|[a-z0-9-]{1,40})\/[0-9a-f]{24}\.(?:mp4|webm|mov|gif)$/;
/** The Table's scene id in new games. Older games get one from the Arrival tab. */
export const TABLE_SCENE_ID = "s-table";
export const STINGER_SCENE_ID = "s-stinger";
/** The Arrival intro on the TV. Made the first time the DM plays it there. */
export const INTRO_SCENE_ID = "s-intro";
/** More steps than any intro has (the boat has 13, a custom one at most a clip and 12 slides). */
export const INTRO_STEPS_MAX = 60;

/** Players who hold a seat: everyone who hasn't left the table, in the order they joined. */
export function seatedPlayers(g: Pick<GameState, "players">): Player[] {
  return g.players.filter((p) => !p.archived);
}

/**
 * The seats at tonight's table. In a shared world that's whoever is here for the
 * seated party (its members plus any guests); a phone away from the table sees its
 * own party's seats instead. Otherwise it's every seat.
 */
export function tableSeats(g: Pick<GameState, "players" | "world" | "parties" | "partyId">, viewer?: Player): Player[] {
  const seated = seatedPlayers(g);
  if (!g.world || !g.partyId) return seated;
  if (!viewer || !viewer.away) return seated.filter((p) => !p.away);
  const party = (g.parties ?? []).find((x) => x.memberIds.includes(viewer.id));
  return party ? seated.filter((p) => party.memberIds.includes(p.id)) : [viewer];
}

export function isClaimed(p: Player): boolean {
  return !!p.arrival?.claimedAt;
}

/** The name on a lit seat: the character, or the player's own name until they pick one. */
export function seatName(p: Player): string {
  return p.character?.trim() || p.name;
}

/** For the DM, who knows both: "Thorn (Ana)", or just "Ana" before a character is picked. */
export function bothNames(p: Pick<Player, "name" | "character">): string {
  const c = p.character?.trim();
  return c && c.toLowerCase() !== p.name.trim().toLowerCase() ? `${c} (${p.name})` : p.name;
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

/** How this campaign's Arrival page reads. */
export interface ArrivalLook {
  title: string;
  captain: string;
  /** false: the link opens straight on the seat page. */
  intro: boolean;
  /** Which intro plays: the built-in boat, or the DM's own clip and slides. Missing on old servers: builtin. */
  kind?: "builtin" | "custom";
  clip?: IntroClip;
  slides?: IntroSlide[];
  welcome?: string;
}

export type IntroKind = "none" | "builtin" | "custom";

/** Which intro the DM chose. Before the choice existed there was only the boat, on or off. */
export function introKind(g: Pick<GameState, "arrival" | "town">): IntroKind {
  const a = g.arrival ?? {};
  if (a.introKind) return a.introKind;
  const candlefair = g.town === undefined || g.town.trim() === "Candlefair";
  return a.intro ?? candlefair ? "builtin" : "none";
}

/** The campaign's own words for the Arrival page and the TV Table, with Candlefair's as the default. */
export function arrivalLook(g: Pick<GameState, "arrival" | "town" | "name">): ArrivalLook {
  const a = g.arrival ?? {};
  const candlefair = g.town === undefined || g.town.trim() === "Candlefair";
  const kind = introKind(g);
  // A custom intro with nothing in it yet plays nothing.
  const slides = (a.slides ?? []).filter((s) => s.image || s.text.trim());
  const custom = kind === "custom" && (!!a.clip || slides.length > 0);
  return {
    title: a.title?.trim() || (candlefair ? "The Flickering Candle" : g.name.trim() || "The table"),
    captain: a.captain?.trim() || "Orsa Dell",
    intro: kind === "builtin" || custom,
    ...(custom ? { kind: "custom" as const, ...(a.clip ? { clip: a.clip } : {}), ...(slides.length ? { slides } : {}) } : kind === "builtin" ? { kind: "builtin" as const } : {}),
    ...(a.welcome?.trim() ? { welcome: a.welcome.trim() } : {}),
  };
}

export interface ArrivalView {
  version: number;
  look: ArrivalLook;
  /** null on the generic link (or a link that no longer works). */
  me: {
    character: string;
    why: string;
    /** The starting point they picked, or "". */
    pick: string;
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
  if (!p) return { version, look: arrivalLook(g), me: null, seats: [], locked: !!g.arrival?.seatsLocked };
  const a = p.arrival!;
  const q = new URLSearchParams();
  if (g.id !== "candlefair") q.set("game", g.id);
  q.set("player", p.handle);
  return {
    version,
    look: arrivalLook(g),
    me: {
      character: p.character ?? "",
      why: a.why ?? "",
      pick: a.pick ?? "",
      claimed: !!a.claimedAt,
      finished: !!a.finishedAt,
      // A name locked with this link: the link's code is the key, after the # so it never reaches a log.
      tableHref: `/?${q}` + (a.keyed && p.keyHash ? `#key=${encodeURIComponent(p.arrival!.token)}` : ""),
    },
    seats: tableSeats(g, p).map((x) => ({ name: isClaimed(x) ? seatName(x) : null, lit: isClaimed(x), me: x.id === p.id })),
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
  /** The finale line: "Tales from the Flickering Candle". */
  title: string;
  seats: { name: string | null; lit: boolean }[];
  /** Unclaimed players' links for the corner QR code, with the name it's for. */
  qr: { name: string; path: string }[];
}

export function projectTable(g: GameState): TableView {
  const seated = tableSeats(g);
  const t = arrivalLook(g).title;
  return {
    title: `Tales from ${t.replace(/^The /, "the ")}`,
    seats: seated.map((p) => ({ name: isClaimed(p) ? seatName(p) : null, lit: isClaimed(p) })),
    qr: seated.filter((p) => !isClaimed(p) && p.arrival?.token).map((p) => ({ name: p.name, path: arrivalPath(g.id, p.arrival!.token) })),
  };
}

// ---------------------------------------------------------------------------
// What the TV gets while the Arrival intro is live on it.

export interface TvIntroView {
  look: ArrivalLook;
  step: number;
  /** When this step started, by the server's clock. */
  at: number;
  paused: boolean;
  /** Changes on every Back / Next / Play, so the TV restarts the step. */
  n: number;
  /** The server's clock when this view was made, so the TV can allow for its own. */
  clock: number;
}

export function projectIntro(g: GameState, now: number): TvIntroView {
  const i = g.live.intro;
  return { look: arrivalLook(g), step: i?.step ?? 0, at: i?.at ?? now, paused: !!i?.paused, n: i?.n ?? 0, clock: now };
}
