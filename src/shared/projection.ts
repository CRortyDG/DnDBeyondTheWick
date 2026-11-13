// Spoiler safety lives here. Each role gets a view built field-by-field from
// an explicit allow-list, so a new DM-only field can't leak by accident.

import type { Art, GameState, Item, LedgerEntry, LegendStyle, LiveState, Player, Scene, Shop } from "./types";

export const GATED_ART = new Set(["merchant-sigil"]);

export interface PublicScene {
  id: string;
  kind: Scene["kind"];
  art: Art;
  name?: string;
  title?: string;
  alt?: string;
  map?: PublicMap;
}

/** A discovered pin, as the TV sees it. Hidden pins, DM notes and links are never sent. */
export interface PublicPin {
  id: string;
  /** What's printed in the seal. */
  label: string;
  x: number;
  y: number;
  /** Only sent with the "numbers and names" legend, or while the DM is focusing this pin. */
  name?: string;
  type?: string;
  description?: string;
}

export interface PublicMap {
  pins: PublicPin[];
  legend: { on: boolean; style: LegendStyle };
  /** Only on the live map. */
  focus?: { pinId: string; n: number };
  banner?: { n: number; name: string };
}

export interface PublicPlayer {
  id: string;
  name: string;
  balanceCp: number;
  /** Heroic Inspiration. */
  inspired: boolean;
}

export interface PublicItem {
  id: string;
  shopId: string;
  name: string;
  /** null when the item is locked with a hidden price ("??? gp"). */
  priceCp: number | null;
  description: string;
  locked: boolean;
  lockReason: string;
}

export interface PublicSession {
  number: number;
  title: string;
}

interface Common {
  version: number;
  game: { id: string; name: string };
  purse: PublicPlayer[];
  shops: Shop[];
  items: PublicItem[];
  session: PublicSession | null;
}

export interface TvView extends Common {
  role: "tv";
  live: Pick<LiveState, "sceneId" | "shopOpen" | "shopId" | "purseVisible">;
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
  };
  myLedger: MyLedgerLine[];
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
  if (sc.kind === "map" && sc.map) out.map = publicMap(game, sc);
  return out;
}

/** Only discovered pins, field by field. With the "numbers only" legend, names stay on the server. */
export function publicMap(game: GameState, sc: Scene): PublicMap {
  const m = sc.map!;
  const isLive = game.live.sceneId === sc.id;
  const shown = m.pins.filter((p) => p.discovered);
  const focus = isLive && game.live.focus && shown.some((p) => p.id === game.live.focus!.pinId) ? game.live.focus : undefined;
  const out: PublicMap = {
    pins: shown.map((p) => {
      const pin: PublicPin = { id: p.id, label: sealText(p), x: p.x, y: p.y };
      if (m.legendStyle === "names" || focus?.pinId === p.id) {
        pin.name = p.name;
        pin.type = p.type;
        pin.description = p.description;
      }
      return pin;
    }),
    legend: { on: m.legendOn, style: m.legendStyle },
  };
  if (focus) out.focus = { pinId: focus.pinId, n: focus.n };
  const b = isLive ? game.live.banner : undefined;
  const bannerPin = b && shown.find((p) => p.id === b.pinId);
  if (b && bannerPin) out.banner = { n: b.n, name: bannerPin.name };
  return out;
}

/** What's printed in a pin's seal: its "shows as" text, or its number. */
export function sealText(p: { number: number; showsAs: string }): string {
  return p.showsAs.trim() || String(p.number);
}

function publicItem(it: Item): PublicItem {
  const locked = !!it.lockReason;
  return {
    id: it.id,
    shopId: it.shopId,
    name: it.name,
    priceCp: locked && it.hidePrice ? null : it.priceCp,
    description: it.description,
    locked,
    lockReason: it.lockReason,
  };
}

function common(game: GameState, version: number): Common {
  const cur = game.sessions.find((x) => x.id === game.currentSessionId);
  return {
    version,
    game: { id: game.id, name: game.name },
    purse: game.players.filter((p) => !p.archived && !p.away).map((p) => ({ id: p.id, name: p.name, balanceCp: p.balanceCp, inspired: !!p.inspired })),
    shops: game.shops.map((x) => ({ id: x.id, name: x.name, subtitle: x.subtitle })),
    items: game.items.map(publicItem),
    session: cur ? { number: cur.number, title: cur.title } : null,
  };
}

export function projectTv(game: GameState, version: number): TvView {
  return {
    ...common(game, version),
    role: "tv",
    live: { sceneId: game.live.sceneId, shopOpen: game.live.shopOpen, shopId: game.live.shopId, purseVisible: game.live.purseVisible },
    scenes: game.scenes.filter((sc) => !sc.reveal || sc.id === game.live.sceneId).map((sc) => publicScene(game, sc)),
  };
}

export function projectPlayer(game: GameState, version: number, playerId: string, ledger: LedgerEntry[]): PlayerView {
  const p = game.players.find((x) => x.id === playerId);
  if (!p) throw new Error("No such player");
  return {
    ...common(game, version),
    role: "player",
    ...(game.vttUrl ? { vttUrl: game.vttUrl } : {}),
    live: { shopOpen: game.live.shopOpen, shopId: game.live.shopId, purseVisible: game.live.purseVisible },
    me: {
      id: p.id,
      handle: p.handle,
      name: p.name,
      balanceCp: p.balanceCp,
      ...(p.dndbUrl ? { dndbUrl: p.dndbUrl } : {}),
      locked: !!p.keyHash,
      archived: p.archived,
    },
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
