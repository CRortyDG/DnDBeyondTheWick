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

/**
 * Who can see a shop. "hidden" (the default) is never sent to the TV or any
 * phone. "some" is for secret offers: only the listed players see it, and it
 * never appears on the TV.
 */
export type ShopVisibility = "hidden" | "all" | "some";

export interface Shop {
  id: string;
  name: string;
  subtitle: string;
  visibility: ShopVisibility;
  /** For visibility "some". */
  playerIds: string[];
  /** A visible but closed shop: name and tagline only, no goods ("Comes once a year."). */
  closed?: boolean;
  /** Purchases here are secret (the Peddler): never on the TV or other players' screens. */
  secretSales?: boolean;
}

/**
 * - sale: buyable
 * - locked: visible with price (or ??? if hidePrice) and a reason
 * - rumored: name and price show as ???, with a one-line hint
 * - hidden: never sent to anyone but the DM
 */
export type ItemTier = "sale" | "locked" | "rumored" | "hidden";

export interface Item {
  id: string;
  shopId: string;
  name: string;
  priceCp: number;
  description: string;
  tier: ItemTier;
  /** Why it's locked ("The smith needs iron from Orlumbor"). */
  reason: string;
  /** The rumor ("They say you can still hear her singing."). */
  hint: string;
  /** Locked items only: show "??? gp". The real price is DM-ONLY. */
  hidePrice: boolean;
  /** null = no limit. Buying takes one; 0 = sold out. */
  stock: number | null;
  /** Shown when sold out ("Restocks next tenday"). */
  restockNote: string;
  /** Shown instead of the price, e.g. "Free*". */
  priceLabel?: string;
  /** Shown on the item, e.g. the Peddler's "*See fine print". */
  finePrint?: string;
  /** Pay now, arrives this many sessions later (special orders from Baldur's Gate). */
  arrivesInSessions?: number;
  /** Sold one at a time: a phone request can't ask for more than 1. */
  oneAtATime?: boolean;
  /** DM-ONLY */
  dmNote?: string;
}

export type RequestStatus = "pending" | "approved" | "declined" | "cancelled";

/**
 * A player's request from their phone: buy something, or send gold to another
 * player. While pending it holds the gold (and the stock), so nobody can
 * request more than they have or claim an item someone else is waiting on.
 */
export interface TradeRequest {
  id: string;
  kind: "buy" | "give";
  playerId: string;
  playerName: string;
  at: number;
  status: RequestStatus;
  /** What it holds while pending: price × quantity, or the gold being sent. */
  totalCp: number;
  /** The player's note to the DM ("for the bard"). */
  note: string;
  /** Bought from a secret shop (the Peddler): never shown on the TV or to other players. */
  secret: boolean;
  // buy
  itemId?: string;
  itemName?: string;
  shopId?: string;
  qty: number;
  unitCp: number;
  // give
  toPlayerId?: string;
  toPlayerName?: string;
  // decided
  decidedAt?: number;
  /** Decline reason the player sees. */
  reason?: string;
  /** What was actually charged (differs from totalCp after haggling). */
  chargedCp?: number;
}

/** A special order: paid for, on its way. */
export interface Order {
  id: string;
  playerId: string;
  itemId: string;
  itemName: string;
  priceCp: number;
  orderedAt: number;
  /** Arrives when a session with this number (or higher) starts. */
  arrivesAtSession: number;
  arrived: boolean;
}

/** A short TV banner: "New at the Smithy." */
export interface Banner {
  id: string;
  text: string;
  at: number;
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
}

export interface GameState {
  schema: 2;
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
  /** Special orders, newest last. */
  orders: Order[];
  /** The latest TV banner; the TV shows it briefly when it changes. */
  banner: Banner | null;
  /** Purchase and gold-transfer requests from phones, oldest first. */
  requests: TradeRequest[];
  /** "Mira bought a Shield." on the TV when a request is approved. undefined = on. */
  tvPurchases?: boolean;
  seq: number;
}

export type LedgerKind = "grant" | "charge" | "purchase" | "payAll" | "transfer";

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
  /** Approved at a different price: the price before haggling. */
  listCp?: number;
  /** The phone request this came from. */
  requestId?: string;
}

export type Role = "dm" | "tv" | "player";

export type Actor =
  | { role: "dm" }
  | { role: "tv" }
  | { role: "player"; playerId: string }
  /** The server itself (joins, hellos, knocks). Never derived from a request. */
  | { role: "system" };
