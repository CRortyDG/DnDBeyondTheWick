// The whole campaign ("game") lives in one JSON document, plus an append-only ledger.
// Anything marked DM-ONLY must never reach the TV or a player: see projection.ts.

export type SceneKind = "notice" | "portrait" | "handout" | "image" | "black" | "map";

/** Built-in art. "merchant-sigil" is DM-only and served through a gated route. */
export type BuiltinArt = "candlefair-board" | "artum-notice" | "artum" | "mags-wick" | "chef" | "merchant-sigil";

export interface Art {
  builtin?: BuiltinArt;
  /** An uploaded image (Vercel Blob or the local dev upload store). */
  url?: string;
}

export interface Scene {
  id: string;
  label: string;
  kind: SceneKind;
  hotkey: number | null; // 0-9
  /** Reveal scenes are only sent to the TV while they are live. */
  reveal: boolean;
  art?: Art;
  /** Portrait caption. */
  name?: string;
  title?: string;
  alt?: string;
  /** DM-ONLY */
  dmNote?: string;
  /** Map scenes only: the numbered locations and the TV legend. */
  map?: MapData;
}

/** What a pin can open from the DM view: a shop on the TV, or another scene (a portrait or a map). DM-ONLY. */
export type PinLink = { kind: "shop"; shopId: string } | { kind: "scene"; sceneId: string };

/** A numbered location on a map. */
export interface Pin {
  id: string;
  /** Lowest free number on the map when it was placed. */
  number: number;
  /** Printed in the seal, up to 4 characters. Empty means the number. */
  showsAs: string;
  name: string;
  /** Short, e.g. tavern, temple, docks, danger. */
  type: string;
  /** One or two lines players can read. */
  description: string;
  /** DM-ONLY */
  dmNotes: string;
  /** Hidden pins are DM-ONLY: they never leave the server for the TV. */
  discovered: boolean;
  /** Position as fractions (0-1) of the image's width and height. */
  x: number;
  y: number;
  /** DM-ONLY */
  link?: PinLink;
}

export type LegendStyle = "numbers" | "names";

export interface MapData {
  pins: Pin[];
  legendOn: boolean;
  /** "numbers": seals only, players ask what's what (names aren't sent). "names": seal, name and type. */
  legendStyle: LegendStyle;
}

export interface Player {
  id: string;
  /** Normalised URL name: ?player=<handle>. */
  handle: string;
  name: string;
  /** DM-ONLY: sha-256 of the player's optional key. */
  keyHash?: string;
  dndbUrl?: string;
  /** Not at the table tonight: hidden from the TV purse and skipped by "pay everyone". */
  away: boolean;
  archived: boolean;
  dropIn: boolean;
  balanceCp: number;
  /** Has Heroic Inspiration right now (shown on the TV purse). */
  inspired?: boolean;
  createdAt: number;
  createdVia: "url" | "dm" | "seed";
  /** DM-ONLY */
  lastSeenAt?: number;
}

export interface Shop {
  id: string;
  name: string;
  subtitle: string;
}

export interface Item {
  id: string;
  shopId: string;
  name: string;
  priceCp: number;
  description: string;
  /** Empty string = for sale. Otherwise the reason it's locked ("Arrives at level 5"). */
  lockReason: string;
  /** When locked, show "??? gp" instead of the price. The real price is DM-ONLY. */
  hidePrice: boolean;
}

export interface Session {
  id: string;
  number: number;
  title: string;
  startedAt: number;
  endedAt: number | null;
  attendeeIds: string[];
  /** DM-ONLY (milestone 5) */
  dmNotes?: string;
}

export interface Knock {
  id: string;
  handle: string;
  at: number;
}

export interface LiveState {
  sceneId: string;
  shopOpen: boolean;
  shopId: string;
  purseVisible: boolean;
  /** The pin the TV is zoomed toward on the live map. n changes each time, so the TV restarts the pulse. */
  focus?: { pinId: string; n: number };
  /** The last "Discovered: …" banner on the live map. The TV shows it when n changes. */
  banner?: { pinId: string; n: number };
}

export interface GameState {
  schema: 1;
  id: string;
  name: string;
  createdAt: number;
  live: LiveState;
  /** When true, unknown ?player= names knock instead of being created. */
  doorClosed: boolean;
  /** The campaign's D&D Beyond game link (the "Launch VTT" button). */
  vttUrl?: string;
  /** Seats at the table. Once this many players (not counting those who left) exist, new names knock. Default 6. */
  maxPlayers?: number;
  players: Player[];
  scenes: Scene[];
  shops: Shop[];
  items: Item[];
  sessions: Session[];
  currentSessionId: string | null;
  knocks: Knock[];
  seq: number;
}

export type LedgerKind = "grant" | "charge" | "purchase" | "payAll";

export interface LedgerEntry {
  id: string;
  at: number;
  playerId: string;
  /** Player name at the time, so history reads well after renames. */
  playerName: string;
  amountCp: number; // signed
  note: string;
  kind: LedgerKind;
  sessionId: string | null;
  itemId?: string;
  batchId?: string;
}

export type Role = "dm" | "tv" | "player";

export type Actor =
  | { role: "dm" }
  | { role: "tv" }
  | { role: "player"; playerId: string }
  /** The server itself (joins, hellos, knocks). Never derived from a request. */
  | { role: "system" };
