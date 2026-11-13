// Spoiler safety lives here. Each role gets a view built field-by-field from
// an explicit allow-list, so a new DM-only field can't leak by accident.

import { heldCp, heldStock } from "./requests";
import type { Art, Banner, GameState, Item, LedgerEntry, LiveState, Player, RequestStatus, Scene, Shop } from "./types";

export const GATED_ART = new Set(["merchant-sigil"]);

export interface PublicScene {
  id: string;
  kind: Scene["kind"];
  art: Art;
  name?: string;
  title?: string;
  alt?: string;
}

export interface PublicPlayer {
  id: string;
  name: string;
  balanceCp: number;
  /** Heroic Inspiration. */
  inspired: boolean;
}

/** A shop as the party sees it. */
export interface PublicShop {
  id: string;
  name: string;
  subtitle: string;
  /** Visible but not selling yet: no goods are sent. */
  closed: boolean;
}

/**
 * An item as the party sees it. Rumored items arrive with name "???", no price
 * and no description. Hidden items, and every item in a shop the viewer can't
 * see, are never sent at all.
 */
export interface PublicItem {
  id: string;
  shopId: string;
  name: string;
  /** null = "???" (rumored, or locked with the price hidden). */
  priceCp: number | null;
  /** Shown instead of the price ("Free*"). */
  priceLabel?: string;
  description: string;
  tier: "sale" | "locked" | "rumored";
  /** Locked: why. */
  reason?: string;
  /** Rumored: the one-line hint. */
  hint?: string;
  /** null = no limit. */
  stock: number | null;
  restockNote?: string;
  finePrint?: string;
  /** Special order: arrives this many sessions after buying. */
  arrivesInSessions?: number;
  /** Units waiting on someone's pending request (only when stock is limited). */
  held?: number;
  /** Sold one at a time: no quantity picker. */
  oneAtATime?: boolean;
}

/** One of my phone requests, as I see it. */
export interface MyRequest {
  id: string;
  kind: "buy" | "give";
  at: number;
  status: RequestStatus;
  totalCp: number;
  note: string;
  itemName?: string;
  qty: number;
  toPlayerName?: string;
  decidedAt?: number;
  reason?: string;
  chargedCp?: number;
}

export interface MyOrder {
  id: string;
  itemName: string;
  arrivesAtSession: number;
  arrived: boolean;
}

export interface PublicSession {
  number: number;
  title: string;
}

interface Common {
  version: number;
  game: { id: string; name: string };
  purse: PublicPlayer[];
  shops: PublicShop[];
  items: PublicItem[];
  session: PublicSession | null;
  /** The latest "New at the Smithy" banner (only ever about things this viewer can see). */
  banner: Banner | null;
}

export interface TvView extends Common {
  role: "tv";
  live: LiveState;
  /** Every non-reveal scene (for instant switching), plus the live scene even if it's a reveal. */
  scenes: PublicScene[];
}

export interface MyLedgerLine {
  id: string;
  at: number;
  amountCp: number;
  note: string;
}

export interface PlayerView extends Common {
  role: "player";
  live: Pick<LiveState, "shopOpen" | "shopId" | "purseVisible">;
  me: {
    id: string;
    handle: string;
    name: string;
    balanceCp: number;
    dndbUrl?: string;
    locked: boolean;
    archived: boolean;
    /** Gold held by my pending requests. */
    heldCp: number;
  };
  myLedger: MyLedgerLine[];
  myOrders: MyOrder[];
  /** My purchase and gold requests, newest first. Never anyone else's. */
  myRequests: MyRequest[];
  /** Everyone I could send gold to (names only). */
  table: { id: string; name: string }[];
  /** The campaign's D&D Beyond game link, if the DM set one. */
  vttUrl?: string;
}

export type DmPlayer = Omit<Player, "keyHash"> & { hasKey: boolean };

export interface DmView {
  role: "dm";
  version: number;
  state: Omit<GameState, "players"> & { players: DmPlayer[] };
  ledger: LedgerEntry[];
}

export type View = TvView | PlayerView | DmView;

// ---------------------------------------------------------------------------

export function artForPublic(game: GameState, sc: Scene): Art {
  const builtin = sc.art?.builtin;
  if (builtin && GATED_ART.has(builtin)) {
    // Gated art is only described to the TV while live, via a route that re-checks.
    return { url: `/api/art/${builtin}?game=${encodeURIComponent(game.id)}` };
  }
  const art: Art = {};
  if (builtin) art.builtin = builtin;
  if (sc.art?.url) art.url = sc.art.url;
  return art;
}

function publicScene(game: GameState, sc: Scene): PublicScene {
  const out: PublicScene = { id: sc.id, kind: sc.kind, art: artForPublic(game, sc) };
  if (sc.name !== undefined) out.name = sc.name;
  if (sc.title !== undefined) out.title = sc.title;
  if (sc.alt !== undefined) out.alt = sc.alt;
  return out;
}

/** Who's looking: the TV (the whole room) or one player. */
type Viewer = { tv: true } | { tv: false; playerId: string };

/** Can this viewer see the shop at all? The TV only ever sees shops open to everyone. */
export function shopVisibleTo(shop: Shop, viewer: Viewer): boolean {
  if (shop.visibility === "all") return true;
  if (shop.visibility === "some" && !viewer.tv) return shop.playerIds.includes(viewer.playerId);
  return false;
}

function publicItem(game: GameState, it: Item): PublicItem | null {
  if (it.tier === "hidden") return null;
  if (it.tier === "rumored") {
    // Name, price and description stay on the server; only the hint goes out.
    return { id: it.id, shopId: it.shopId, name: "???", priceCp: null, description: "", tier: "rumored", hint: it.hint, stock: null };
  }
  const out: PublicItem = {
    id: it.id,
    shopId: it.shopId,
    name: it.name,
    priceCp: it.tier === "locked" && it.hidePrice ? null : it.priceCp,
    description: it.description,
    tier: it.tier,
    stock: it.stock,
  };
  if (it.tier === "locked") out.reason = it.reason;
  if (it.priceLabel) out.priceLabel = it.priceLabel;
  if (it.finePrint) out.finePrint = it.finePrint;
  if (it.arrivesInSessions) out.arrivesInSessions = it.arrivesInSessions;
  if (it.stock === 0 && it.restockNote) out.restockNote = it.restockNote;
  if (it.oneAtATime || it.arrivesInSessions) out.oneAtATime = true;
  if (it.stock !== null) {
    const held = Math.min(it.stock, heldStock(game, it.id));
    if (held > 0) out.held = held;
  }
  return out;
}

function common(game: GameState, version: number, viewer: Viewer): Common {
  const cur = game.sessions.find((x) => x.id === game.currentSessionId);
  const shops = game.shops.filter((sh) => shopVisibleTo(sh, viewer));
  const open = new Set(shops.filter((sh) => !sh.closed).map((sh) => sh.id));
  return {
    version,
    game: { id: game.id, name: game.name },
    purse: game.players.filter((p) => !p.archived && !p.away).map((p) => ({ id: p.id, name: p.name, balanceCp: p.balanceCp, inspired: !!p.inspired })),
    shops: shops.map((x) => ({ id: x.id, name: x.name, subtitle: x.subtitle, closed: !!x.closed })),
    items: game.items.filter((it) => open.has(it.shopId)).map((it) => publicItem(game, it)).filter((x): x is PublicItem => x !== null),
    session: cur ? { number: cur.number, title: cur.title } : null,
    banner: game.banner ? { ...game.banner } : null,
  };
}

/** The shop on the TV, but only if the viewer can see it (never leak a hidden shop's id). */
function liveShop(game: GameState, viewer: Viewer) {
  const sh = game.shops.find((x) => x.id === game.live.shopId);
  const ok = !!sh && shopVisibleTo(sh, { tv: true }) && shopVisibleTo(sh, viewer);
  return { shopOpen: ok && game.live.shopOpen, shopId: ok ? game.live.shopId : "" };
}

export function projectTv(game: GameState, version: number): TvView {
  return {
    ...common(game, version, { tv: true }),
    role: "tv",
    live: { sceneId: game.live.sceneId, ...liveShop(game, { tv: true }), purseVisible: game.live.purseVisible },
    scenes: game.scenes.filter((sc) => !sc.reveal || sc.id === game.live.sceneId).map((sc) => publicScene(game, sc)),
  };
}

export function projectPlayer(game: GameState, version: number, playerId: string, ledger: LedgerEntry[]): PlayerView {
  const p = game.players.find((x) => x.id === playerId);
  if (!p) throw new Error("No such player");
  return {
    ...common(game, version, { tv: false, playerId }),
    role: "player",
    ...(game.vttUrl ? { vttUrl: game.vttUrl } : {}),
    live: { ...liveShop(game, { tv: false, playerId }), purseVisible: game.live.purseVisible },
    myOrders: game.orders
      .filter((o) => o.playerId === p.id)
      .map((o) => ({ id: o.id, itemName: o.itemName, arrivesAtSession: o.arrivesAtSession, arrived: o.arrived })),
    me: {
      id: p.id,
      handle: p.handle,
      name: p.name,
      balanceCp: p.balanceCp,
      ...(p.dndbUrl ? { dndbUrl: p.dndbUrl } : {}),
      locked: !!p.keyHash,
      archived: p.archived,
      heldCp: heldCp(game, p.id),
    },
    myRequests: game.requests
      .filter((r) => r.playerId === p.id)
      .slice(-50)
      .reverse()
      .map((r) => {
        const out: MyRequest = { id: r.id, kind: r.kind, at: r.at, status: r.status, totalCp: r.totalCp, note: r.note, qty: r.qty };
        if (r.itemName !== undefined) out.itemName = r.itemName;
        if (r.toPlayerName !== undefined) out.toPlayerName = r.toPlayerName;
        if (r.decidedAt !== undefined) out.decidedAt = r.decidedAt;
        if (r.reason !== undefined) out.reason = r.reason;
        if (r.chargedCp !== undefined) out.chargedCp = r.chargedCp;
        return out;
      }),
    table: game.players.filter((x) => !x.archived && x.id !== p.id).map((x) => ({ id: x.id, name: x.name })),
    myLedger: ledger
      .filter((l) => l.playerId === p.id)
      .slice(-100)
      .reverse()
      .map((l) => ({ id: l.id, at: l.at, amountCp: l.amountCp, note: l.note })),
  };
}

export function projectDm(game: GameState, version: number, ledger: LedgerEntry[]): DmView {
  const { players, ...rest } = structuredClone(game);
  return {
    role: "dm",
    version,
    state: { ...rest, players: players.map(({ keyHash, ...p }) => ({ ...p, hasKey: !!keyHash })) },
    ledger: [...ledger].reverse(),
  };
}

/** Is a gated built-in allowed for a non-DM right now? */
export function gatedArtIsLive(game: GameState, builtin: string): boolean {
  const live = game.scenes.find((sc) => sc.id === game.live.sceneId);
  return !!live && live.art?.builtin === builtin;
}
