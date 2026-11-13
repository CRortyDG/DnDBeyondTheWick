// The whole campaign ("game") lives in one JSON document, plus an append-only ledger.
// Anything marked DM-ONLY must never reach the TV or a player: see projection.ts.

export type SceneKind = "notice" | "portrait" | "handout" | "image" | "black";

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
  /** DM-ONLY: the run-game run sheet for this session, if it was run from an episode. */
  run?: SessionRun;
  /** DM-ONLY: written at the end of the session. Reaches the TV only while shown as "Previously on…". */
  recap?: string;
}

// ---------- run-game (all DM-ONLY) ----------

export type BeatAction = { type: "scene"; sceneId: string } | { type: "black" } | { type: "bank" };

export interface BeatCheck {
  /** "Strength (Athletics)", "Dexterity saving throw", "... or ...". */
  skill: string;
  dc: number;
  /** Who/what the check is for. */
  what: string;
  fail?: string;
  success?: string;
}

export interface BeatBranch {
  when: string;
  then: string;
}

export interface Beat {
  id: string;
  title: string;
  /** Paragraphs to read aloud. */
  readAloud?: string[];
  /** Where the read-aloud box sits among the notes (0 = before the first note). */
  readAloudAt?: number;
  notes: string[];
  checks: BeatCheck[];
  branches: BeatBranch[];
  /** Fired on landing by Next or a jump, never by Back. */
  actions: BeatAction[];
}

export interface Episode {
  id: string;
  title: string;
  beats: Beat[];
}

export interface SessionRun {
  episodeId: string;
  /** "start": attendance and "Previously on…"; "beat": beats[beat]; "end": payday and recap. */
  stage: "start" | "beat" | "end";
  /** The current beat, or on the start screen, the beat Next goes to. */
  beat: number;
  /** Quick notes by beat id. */
  notes: Record<string, string>;
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
  /** The session whose recap is on the TV as "Previously on…". Cleared by any scene or shop change. */
  recapSessionId?: string;
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
  /** DM-ONLY: run sheets. Missing on games made before run-game mode; read with episodesOf(). */
  episodes?: Episode[];
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
