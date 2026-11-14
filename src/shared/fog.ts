// Fog of war. A map's fog is a grid of cells (lined up with the token grid when
// there is one), each covered or clear, kept as a bitset. While fog is on, the
// TV and phones get the map as tiles cut in the DM's browser, and only the
// tiles that touch a clear cell: a covered part of the map never leaves the
// server, not even as an image URL. Pins and non-party tokens under fog stay
// home too.

import type { MapData, MapFog, MapGrid } from "./types";

export const FOG_MAX_CELLS = 200;
export const FOG_DEFAULT_COLS = 48;
export const TILES_MAX = 100;
/** Uploaded map tiles: /api/files/<campaign>/<random>.<ext>. */
export const TILE_URL_RE = /^\/api\/files\/[a-z0-9-]{1,40}\/[0-9a-f]{24}\.(webp|jpg|png)$/;

export type FogLayout = Pick<MapFog, "x0" | "y0" | "cw" | "ch" | "cols" | "rows" | "aspect">;

const r6 = (v: number) => Math.round(v * 1e6) / 1e6;

/** Cells for a map: its grid's squares if it has one, else FOG_DEFAULT_COLS across. */
export function fogLayout(grid: MapGrid | undefined, aspect: number): FogLayout {
  const a = aspect > 0 ? aspect : 0.5625;
  let cw = grid ? grid.cell : 1 / FOG_DEFAULT_COLS;
  let ch = grid ? grid.cell / (grid.aspect || a) : cw / a;
  let x0 = grid ? grid.ox - cw * Math.ceil(grid.ox / cw - 1e-9) : 0;
  let y0 = grid ? grid.oy - ch * Math.ceil(grid.oy / ch - 1e-9) : 0;
  let cols = Math.ceil((1 - x0) / cw - 1e-9);
  let rows = Math.ceil((1 - y0) / ch - 1e-9);
  // A very fine grid: fall back to plain cells.
  if (cols > FOG_MAX_CELLS || rows > FOG_MAX_CELLS) {
    cw = 1 / FOG_DEFAULT_COLS;
    ch = cw / a;
    x0 = 0;
    y0 = 0;
    cols = FOG_DEFAULT_COLS;
    rows = Math.min(FOG_MAX_CELLS, Math.ceil(1 / ch - 1e-9));
  }
  return { x0: r6(x0), y0: r6(y0), cw: r6(cw), ch: r6(ch), cols, rows, aspect: r6(a) };
}

export function byteLength(cols: number, rows: number): number {
  return Math.ceil((cols * rows) / 8);
}

export function decodeBits(b64: string, cols: number, rows: number): Uint8Array {
  const out = new Uint8Array(byteLength(cols, rows));
  let bin = "";
  try {
    bin = atob(b64);
  } catch {
    return out;
  }
  for (let i = 0; i < Math.min(bin.length, out.length); i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function encodeBits(bits: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bits.length; i++) bin += String.fromCharCode(bits[i]);
  return btoa(bin);
}

export function emptyBits(cols: number, rows: number): string {
  return encodeBits(new Uint8Array(byteLength(cols, rows)));
}

export function fullBits(cols: number, rows: number): string {
  const b = new Uint8Array(byteLength(cols, rows)).fill(255);
  // Keep bits past the last cell at 0, so "all clear" encodes the same every time.
  const n = cols * rows;
  if (n % 8) b[b.length - 1] = (1 << (n % 8)) - 1;
  return encodeBits(b);
}

export const getBit = (bits: Uint8Array, i: number) => (bits[i >> 3] >> (i & 7)) & 1;
export function setBit(bits: Uint8Array, i: number, on: boolean) {
  if (on) bits[i >> 3] |= 1 << (i & 7);
  else bits[i >> 3] &= ~(1 << (i & 7));
}

/** The cell under a point (fractions of the image), or null off the grid. */
export function cellAt(f: FogLayout, x: number, y: number): { c: number; r: number } | null {
  const c = Math.floor((x - f.x0) / f.cw);
  const r = Math.floor((y - f.y0) / f.ch);
  if (c < 0 || r < 0 || c >= f.cols || r >= f.rows) return null;
  return { c, r };
}

/** Is fog on and covering this point? */
export function fogged(m: MapData, x: number, y: number, bits?: Uint8Array): boolean {
  const f = m.fog;
  if (!f || !f.on) return false;
  const cell = cellAt(f, x, y);
  if (!cell) return true;
  const b = bits ?? decodeBits(f.bits, f.cols, f.rows);
  return !getBit(b, cell.r * f.cols + cell.c);
}

/** Tiles that touch at least one clear cell. Everything else stays on the server. */
export function visibleTiles(f: MapFog, bits?: Uint8Array): { c: number; r: number; url: string }[] {
  const t = f.tiles;
  if (!t) return [];
  const b = bits ?? decodeBits(f.bits, f.cols, f.rows);
  const clear = new Set<number>();
  for (let r = 0; r < f.rows; r++) {
    for (let c = 0; c < f.cols; c++) {
      if (!getBit(b, r * f.cols + c)) continue;
      // The cell's span, a hair inside so cells that only touch a tile's edge don't send it.
      const x0 = Math.max(0, f.x0 + c * f.cw + 1e-6);
      const x1 = Math.min(1, f.x0 + (c + 1) * f.cw - 1e-6);
      const y0 = Math.max(0, f.y0 + r * f.ch + 1e-6);
      const y1 = Math.min(1, f.y0 + (r + 1) * f.ch - 1e-6);
      if (x1 <= x0 || y1 <= y0) continue;
      for (let tr = Math.floor(y0 * t.rows); tr <= Math.min(t.rows - 1, Math.floor(y1 * t.rows)); tr++) {
        for (let tc = Math.floor(x0 * t.cols); tc <= Math.min(t.cols - 1, Math.floor(x1 * t.cols)); tc++) clear.add(tr * t.cols + tc);
      }
    }
  }
  return [...clear].sort((a, b2) => a - b2).map((i) => ({ c: i % t.cols, r: Math.floor(i / t.cols), url: t.urls[i] })).filter((x) => !!x.url);
}

/** How to cut an image into tiles: about 8 across, square-ish, at most TILES_MAX. */
export function tileGrid(aspect: number): { cols: number; rows: number } {
  const cols = 8;
  const rows = Math.max(1, Math.min(Math.floor(TILES_MAX / cols), Math.round(cols * (aspect > 0 ? aspect : 0.5625))));
  return { cols, rows };
}

export interface PublicFog {
  x0: number;
  y0: number;
  cw: number;
  ch: number;
  cols: number;
  rows: number;
  aspect: number;
  bits: string;
  tiles: { cols: number; rows: number; shown: { c: number; r: number; url: string }[] };
}

/** artUrl: the map's image now. Tiles cut from an older image aren't sent. */
export function publicFog(f: MapFog, artUrl: string | undefined): PublicFog {
  return {
    x0: f.x0,
    y0: f.y0,
    cw: f.cw,
    ch: f.ch,
    cols: f.cols,
    rows: f.rows,
    aspect: f.aspect,
    bits: f.bits,
    tiles: { cols: f.tiles?.cols ?? 1, rows: f.tiles?.rows ?? 1, shown: f.tiles && f.tiles.src === artUrl ? visibleTiles(f) : [] },
  };
}
