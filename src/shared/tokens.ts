// Tokens on a map: the party, monsters from the running fight, anyone the DM
// adds. Positions are fractions of the map image (like pins), so a token lands
// on the same spot on the TV, the DM's screen and a phone.

import { penName } from "./chronicle";
import { tvName } from "./combat";
import type { Art, Combatant, GameState, MapData, MapGrid, MapToken, Scene, TokenColor } from "./types";

export const TOKEN_COLORS: TokenColor[] = ["blue", "green", "gold", "purple", "teal", "orange", "red", "grey"];
/** Party colours, in the order players get them. Red is kept for monsters, grey for NPCs. */
const PARTY_COLORS: TokenColor[] = ["blue", "green", "gold", "purple", "teal", "orange"];
/** A size-1 token's width with no grid, as a fraction of the image's width. */
export const TOKEN_BASE = 0.035;
export const TOKEN_SIZES = [0.5, 1, 2, 3, 4] as const;
export const TOKENS_MAX = 80;
export const GRID_CELL_MIN = 0.004;
export const GRID_CELL_MAX = 0.5;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const round4 = (v: number) => Math.round(v * 10000) / 10000;

export function tokensOf(m: MapData): MapToken[] {
  return (m.tokens ??= []);
}

/** A token's width as a fraction of the image's width. */
export function tokenWidth(grid: MapGrid | undefined, size: number): number {
  return size * (grid ? grid.cell : TOKEN_BASE);
}

/**
 * Snap a token's centre to the grid: odd sizes (and small ones) sit in a
 * square's middle, even sizes on a corner, the way minis sit on a battle mat.
 */
export function snapToGrid(grid: MapGrid | undefined, x: number, y: number, size = 1): { x: number; y: number } {
  if (!grid || !grid.snap || grid.cell <= 0) return { x: round4(clamp01(x)), y: round4(clamp01(y)) };
  const off = size >= 2 && size % 2 === 0 ? 0 : 0.5;
  const cw = grid.cell;
  const ch = grid.cell / (grid.aspect || 1);
  const sx = grid.ox + (Math.round((x - grid.ox) / cw - off) + off) * cw;
  const sy = grid.oy + (Math.round((y - grid.oy) / ch - off) + off) * ch;
  return { x: round4(clamp01(sx)), y: round4(clamp01(sy)) };
}

/** "Brin Ashcombe" -> "BA", "Goblin A" -> "GA", "Mags" -> "MA". */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

/** The combatant a token stands for, if any (a player's token stands for their combatant in the fight). */
export function combatantFor(game: GameState, t: MapToken): Combatant | undefined {
  const f = game.fight;
  if (!f) return undefined;
  if (t.combatantId) return f.order.find((c) => c.id === t.combatantId);
  if (t.playerId) return f.order.find((c) => c.kind === "player" && c.playerId === t.playerId);
  return undefined;
}

export interface TokenFace {
  label: string;
  name: string;
  /** Kept off the TV and phones: hidden by the DM, or a hidden or gone foe. */
  hidden: boolean;
  down: boolean;
  /** Their turn in the running fight. */
  current: boolean;
}

/** What a token shows, with its fight (names follow reveals, hidden foes stay hidden). */
export function tokenFace(game: GameState, t: MapToken): TokenFace {
  const c = combatantFor(game, t);
  const f = game.fight;
  let name = t.name;
  let gonePlayer = false;
  if (t.playerId) {
    const p = game.players.find((x) => x.id === t.playerId);
    if (p) name = penName(p);
    gonePlayer = !p || p.archived;
  } else if (c) name = tvName(c);
  let down = false;
  if (c?.kind === "monster") down = c.down;
  else if (t.playerId) {
    const hp = game.players.find((x) => x.id === t.playerId)?.hp;
    down = !!f && !!hp && hp.max > 0 && hp.cur <= 0;
  }
  const running = f && (f.status === "running" || f.status === "paused");
  return {
    label: t.label.trim() || initials(name),
    name,
    hidden: t.hidden || gonePlayer || (!!t.combatantId && (!c || c.hidden || !!c.gone)),
    down,
    current: !!running && !!c && f!.currentId === c.id && !c.hidden,
  };
}

export interface PublicToken {
  id: string;
  kind: MapToken["kind"];
  label: string;
  name: string;
  color: TokenColor;
  x: number;
  y: number;
  /** Width as a fraction of the image's width. */
  w: number;
  playerId?: string;
  art?: Art;
  down?: boolean;
  current?: boolean;
  locked?: boolean;
}

export interface PublicGrid {
  cell: number;
  ox: number;
  oy: number;
  aspect: number;
  snap: boolean;
  lines: boolean;
}

/** Tokens the room may see: never hidden ones, never a hidden or gone foe. */
export function publicTokens(game: GameState, m: MapData): PublicToken[] {
  const out: PublicToken[] = [];
  for (const t of m.tokens ?? []) {
    const face = tokenFace(game, t);
    if (face.hidden) continue;
    const pt: PublicToken = { id: t.id, kind: t.kind, label: face.label, name: face.name, color: t.color, x: t.x, y: t.y, w: round4(tokenWidth(m.grid, t.size)) };
    if (t.playerId) pt.playerId = t.playerId;
    if (t.art?.url) pt.art = { url: t.art.url };
    if (face.down) pt.down = true;
    if (face.current) pt.current = true;
    if (t.locked) pt.locked = true;
    out.push(pt);
  }
  return out;
}

export function publicGrid(m: MapData): PublicGrid | undefined {
  const g = m.grid;
  if (!g) return undefined;
  return { cell: g.cell, ox: g.ox, oy: g.oy, aspect: g.aspect, snap: g.snap, lines: g.lines };
}

/** The next party colour nobody on this map has yet. */
export function partyColor(m: MapData, game: GameState, playerId: string): TokenColor {
  const used = new Set((m.tokens ?? []).filter((t) => t.kind === "player").map((t) => t.color));
  const free = PARTY_COLORS.find((c) => !used.has(c));
  if (free) return free;
  const i = game.players.findIndex((p) => p.id === playerId);
  return PARTY_COLORS[Math.max(0, i) % PARTY_COLORS.length];
}

/** A free spot near (x, y) for a new token: along a row, alternating sides, one token apart. */
export function freeSpot(m: MapData, x: number, y: number, size = 1): { x: number; y: number } {
  const w = tokenWidth(m.grid, size);
  const taken = (p: { x: number; y: number }) => (m.tokens ?? []).some((t) => Math.abs(t.x - p.x) < w * 1.5 && Math.abs(t.y - p.y) < w * (m.grid?.aspect ? 1 / m.grid.aspect : 1.6));
  for (let i = 0; i < 40; i++) {
    const step = Math.ceil(i / 2) * (i % 2 ? 1 : -1);
    // Two squares apart, so names under the tokens don't run together.
    const p = snapToGrid(m.grid, x + step * w * 2, y, size);
    if (!taken(p)) return p;
  }
  return snapToGrid(m.grid, x, y, size);
}

export function newTokenId(nextId: (prefix: string) => string): string {
  return nextId("tk");
}

/**
 * Keep the live map's tokens in step with the fight: everyone fighting gets a
 * token (players reuse theirs), and monster tokens leave every map once their
 * fight (or the monster) is gone.
 */
export function syncFightTokens(s: GameState, nextId: (prefix: string) => string): void {
  const f = s.fight;
  const ids = new Set(f ? f.order.map((c) => c.id) : []);
  for (const sc of s.scenes) {
    if (sc.kind !== "map" || !sc.map?.tokens?.length) continue;
    sc.map.tokens = sc.map.tokens.filter((t) => !t.combatantId || ids.has(t.combatantId));
  }
  if (!f || f.status === "over") return;
  const live = s.scenes.find((x) => x.id === s.live.sceneId);
  if (!live || live.kind !== "map" || !live.map) return;
  const m = live.map;
  const tokens = tokensOf(m);
  for (const c of f.order) {
    if (c.gone || tokens.length >= TOKENS_MAX) continue;
    if (c.kind === "player" && c.playerId) {
      if (tokens.some((t) => t.playerId === c.playerId)) continue;
      if (!s.players.some((p) => p.id === c.playerId)) continue;
      tokens.push({ id: nextId("tk"), kind: "player", playerId: c.playerId, label: "", name: "", color: partyColor(m, s, c.playerId), ...freeSpot(m, 0.5, 0.62), size: 1, hidden: false, locked: false });
    } else if (c.kind === "monster") {
      if (tokens.some((t) => t.combatantId === c.id)) continue;
      tokens.push({ id: nextId("tk"), kind: "monster", combatantId: c.id, label: "", name: "", color: "red", ...freeSpot(m, 0.5, 0.38), size: 1, hidden: false, locked: true });
    }
  }
}

/** Add a token for every player at the table who doesn't have one on this map. Returns how many. */
export function addPartyTokens(s: GameState, sc: Scene, x: number, y: number, nextId: (prefix: string) => string): number {
  const m = sc.map!;
  const tokens = tokensOf(m);
  let n = 0;
  for (const p of s.players) {
    if (p.archived || p.away) continue;
    if (tokens.some((t) => t.playerId === p.id) || tokens.length >= TOKENS_MAX) continue;
    tokens.push({ id: nextId("tk"), kind: "player", playerId: p.id, label: "", name: "", color: partyColor(m, s, p.id), ...freeSpot(m, x, y), size: 1, hidden: false, locked: false });
    n++;
  }
  return n;
}
