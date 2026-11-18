// Draws a Look (look.ts) as pixel art: a 48×56 grid of colours, built layer by
// layer. All the art is drawn here in code (shapes and small sprites), so it
// needs no image files and runs the same on the server, the TV and phones.

import { type Look, type LookColorKey, type LookPartKey, LOOK_DEFAULTS, SWATCHES } from "./look";

export const LOOK_W = 48;
export const LOOK_H = 56;

type C = string | null;

/** A grid of "#rrggbb" colours (null = clear). */
export class Pix {
  readonly d: C[];
  constructor(
    readonly w = LOOK_W,
    readonly h = LOOK_H,
  ) {
    this.d = new Array(w * h).fill(null);
  }
  set(x: number, y: number, c: C | undefined) {
    x = Math.floor(x);
    y = Math.floor(y);
    if (c === undefined || x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.d[y * this.w + x] = c;
  }
  get(x: number, y: number): C {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return null;
    return this.d[y * this.w + x];
  }
  rect(x: number, y: number, w: number, h: number, c: C) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c);
  }
  hl(x0: number, x1: number, y: number, c: C) {
    for (let x = x0; x <= x1; x++) this.set(x, y, c);
  }
  vl(x: number, y0: number, y1: number, c: C) {
    for (let y = y0; y <= y1; y++) this.set(x, y, c);
  }
  /** Filled ellipse; centres may be halves. */
  ell(cx: number, cy: number, rx: number, ry: number, c: C | ((x: number, y: number, dx: number, dy: number) => C | undefined)) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x + 0.5 - cx) / rx;
        const dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) this.set(x, y, typeof c === "function" ? c(x, y, dx, dy) : c);
      }
  }
  line(x0: number, y0: number, x1: number, y1: number, c: C) {
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.set(x0, y0, c);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x0 += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y0 += sy;
      }
    }
  }
  /** A small sprite: one string per row, letters looked up in map, "." skipped. flip mirrors it. */
  stamp(x: number, y: number, rows: readonly string[], map: Record<string, C>, flip = false) {
    const w = Math.max(...rows.map((r) => r.length));
    rows.forEach((row, j) => {
      for (let i = 0; i < row.length; i++) {
        const ch = row[i];
        if (ch === "." || ch === " " || !(ch in map)) continue;
        this.set(flip ? x + w - 1 - i : x + i, y + j, map[ch]);
      }
    });
  }
  /** Copy other's set pixels on top. */
  over(o: Pix, dx = 0, dy = 0) {
    for (let y = 0; y < o.h; y++)
      for (let x = 0; x < o.w; x++) {
        const c = o.d[y * o.w + x];
        if (c) this.set(x + dx, y + dy, c);
      }
  }
  /** A one-pixel outline around everything drawn. */
  outline(c: string) {
    const add: number[] = [];
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++) {
        if (this.get(x, y)) continue;
        if (this.get(x - 1, y) || this.get(x + 1, y) || this.get(x, y - 1) || this.get(x, y + 1)) add.push(y * this.w + x);
      }
    for (const i of add) this.d[i] = c;
  }
  crop(x: number, y: number, w: number, h: number): Pix {
    const o = new Pix(w, h);
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) o.d[j * w + i] = this.get(x + i, y + j);
    return o;
  }
}

// ---- colour ------------------------------------------------------------------

function rgb(h: string): [number, number, number] {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function hex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
}
function toHsl([r, g, b]: [number, number, number]): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  const l = (mx + mn) / 2;
  if (mx === mn) return [0, 0, l];
  const d = mx - mn;
  const s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  const h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}
function fromHsl(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return hex((r + m) * 255, (g + m) * 255, (b + m) * 255);
}
/** Lighter or darker, with the hue nudged warm in the light and cool in the shade (how pixel artists shade). */
export function tone(h: string, dl: number): string {
  const [hh, s, l] = toHsl(rgb(h));
  const target = dl > 0 ? 50 : 250;
  let diff = ((target - hh + 540) % 360) - 180;
  const shift = Math.min(Math.abs(diff), Math.abs(dl) * 60) * Math.sign(diff);
  diff = s < 0.08 ? 0 : shift;
  return fromHsl(hh + diff, Math.min(1, s * (dl < 0 ? 1.05 : 0.95)), Math.max(0, Math.min(1, l + dl)));
}
export function mix(a: string, b: string, t: number): string {
  const x = rgb(a);
  const y = rgb(b);
  return hex(x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t);
}

export interface Ramp {
  hi: string;
  base: string;
  lo: string;
  deep: string;
}
export function ramp(h: string): Ramp {
  return { hi: tone(h, 0.1), base: h, lo: tone(h, -0.12), deep: tone(h, -0.24) };
}
/** h/l/d/x letters for a ramp, with an optional prefix map. */
const rm = (r: Ramp, b = "h", l = "l", d = "d", x = "x"): Record<string, string> => ({ [b]: r.base, [l]: r.hi, [d]: r.lo, [x]: r.deep });

export const OUT = "#1c1424";
export const WHITE = "#f4f1ea";
export const MOUTH = "#6e2a2e";
const GOLD = ramp("#d9a63a");
const WOOD = ramp("#8a5a33");
const BONE = ramp("#e3d7bd");
const HORN = ramp("#4a3c48");
const FLAME = { a: "#fff1a8", b: "#ffc23d", c: "#f07a2a", d: "#c8432b" };

// ---- the body ------------------------------------------------------------------

export interface Frame {
  cx: number;
  hx: number;
  hy: number;
  tx: number;
  ty: number;
  tw: number;
  th: number;
  lx: number;
  ly: number;
  lw: number;
  feet: number;
  lax: number;
  rax: number;
  ay: number;
  handY: number;
}

/** Torso rows, leg rows, half the torso's width. */
const BUILDS: [number, number, number][] = [
  [12, 13, 6],
  [12, 13, 7],
  [13, 15, 5],
  [9, 8, 6],
  [9, 9, 7],
];

export function frameOf(b: number): Frame {
  const [th, lh, half] = BUILDS[b] ?? BUILDS[0];
  const cx = 24;
  const feet = 50;
  const ly = feet + 1 - lh;
  const ty = ly - th;
  const hy = ty - 1 - 12;
  const tw = half * 2;
  const tx = cx - half;
  const lw = Math.max(8, tw - 4);
  return { cx, hx: cx - 6, hy, tx, ty, tw, th, lx: cx - lw / 2, ly, lw, feet, lax: tx - 3, rax: tx + tw, ay: ty + 1, handY: ty + th - 2 };
}

type Span = [y: number, x0: number, x1: number];

function fill(p: Pix, spans: Span[], r: Ramp, mode: "cyl" | "left" | "right" | "flat" = "cyl") {
  for (const [y, x0, x1] of spans)
    for (let x = x0; x <= x1; x++) {
      const w = x1 - x0 + 1;
      let c = r.base;
      if (mode === "flat") c = r.base;
      else if (mode === "right") c = x === x1 ? r.deep : r.lo;
      else if (x === x0 && w >= 3) c = r.hi;
      else if (x === x1 && w >= 3) c = r.lo;
      else if (mode === "cyl" && x === x1 - 1 && w >= 7) c = r.lo;
      p.set(x, y, c);
    }
}

const HEAD_ROWS: [number, number][] = [[2, 9], [1, 10], [0, 11], [0, 11], [0, 11], [0, 11], [0, 11], [0, 11], [0, 11], [0, 11], [1, 10], [2, 9]];

const headSpans = (f: Frame): Span[] => HEAD_ROWS.map(([a, b], i) => [f.hy + i, f.hx + a, f.hx + b]);
const torsoSpans = (f: Frame, from = 0, to = f.th): Span[] => {
  const out: Span[] = [];
  for (let i = from; i < to; i++) out.push(i === 0 ? [f.ty, f.tx + 1, f.tx + f.tw - 2] : [f.ty + i, f.tx, f.tx + f.tw - 1]);
  return out;
};
/** One arm's rows, from (0 = shoulder) to (exclusive); the last two rows are the hand. */
const armSpans = (f: Frame, side: "l" | "r", from = 0, to = f.handY - f.ay): Span[] => {
  const x = side === "l" ? f.lax : f.rax;
  const out: Span[] = [];
  for (let i = from; i < to; i++) out.push([f.ay + i, x, x + 2]);
  return out;
};
const armLen = (f: Frame) => f.handY - f.ay;
const legSpans = (f: Frame, side: "l" | "r", from = 0): Span[] => {
  const half = f.lw / 2;
  const out: Span[] = [];
  for (let y = f.ly + from; y <= f.feet; y++) {
    const gap = y >= f.ly + 2;
    out.push(side === "l" ? [y, f.lx, f.lx + half - (gap ? 2 : 1)] : [y, f.lx + half + (gap ? 1 : 0), f.lx + f.lw - 1]);
  }
  return out;
};

function body(p: Pix, f: Frame, skin: Ramp) {
  fill(p, legSpans(f, "l"), skin);
  fill(p, legSpans(f, "r"), skin, "right");
  fill(p, torsoSpans(f), skin);
  fill(p, armSpans(f, "l", 0, armLen(f) + 2), skin);
  fill(p, armSpans(f, "r", 0, armLen(f) + 2), skin, "right");
  p.hl(f.cx - 2, f.cx + 1, f.ty - 1, skin.lo);
  for (const [y, x0, x1] of headSpans(f))
    for (let x = x0; x <= x1; x++) p.set(x, y, x === x1 || y === f.hy + 11 ? skin.lo : x === x0 && y > f.hy + 2 && y < f.hy + 9 ? skin.hi : skin.base);
  // A little nose shadow.
  p.set(f.hx + 6, f.hy + 8, skin.lo);
}

function hands(p: Pix, f: Frame, skin: Ramp, which: "l" | "r" | "both" = "both") {
  if (which !== "r") fill(p, armSpans(f, "l", armLen(f), armLen(f) + 2), skin);
  if (which !== "l") fill(p, armSpans(f, "r", armLen(f), armLen(f) + 2), skin, "right");
}

function boots(p: Pix, f: Frame, r: Ramp, rows = 3) {
  for (const side of ["l", "r"] as const) {
    const spans = legSpans(f, side).slice(-rows);
    fill(p, spans, r, side === "r" ? "right" : "cyl");
    // The toe pokes out one pixel.
    const [y, x0, x1] = spans[spans.length - 1];
    p.set(side === "l" ? x0 - 1 : x1 + 1, y, r.lo);
    p.hl(x0, x1, spans[0][0], r.hi);
  }
}

function legsWear(p: Pix, f: Frame, r: Ramp, from = 0) {
  fill(p, legSpans(f, "l", from), r);
  fill(p, legSpans(f, "r", from), r, "right");
}
function sleeves(p: Pix, f: Frame, r: Ramp, to = armLen(f)) {
  fill(p, armSpans(f, "l", 0, to), r);
  fill(p, armSpans(f, "r", 0, to), r, "right");
}
function belt(p: Pix, f: Frame, r: Ramp, buckle: string | null) {
  const y = f.ty + f.th - 1;
  p.hl(f.tx, f.tx + f.tw - 1, y, r.lo);
  p.set(f.tx + f.tw - 1, y, r.deep);
  if (buckle) {
    p.set(f.cx - 1, y, buckle);
    p.set(f.cx, y, buckle);
  }
}
/** A skirt or robe from the waist down, widening. */
function skirt(p: Pix, f: Frame, r: Ramp, to = f.feet - 1, flare = 4) {
  const out: Span[] = [];
  for (let y = f.ly, i = 0; y <= to; y++, i++) {
    const w = Math.floor(i / flare);
    out.push([y, f.lx - 1 - w, f.lx + f.lw + w]);
  }
  fill(p, out, r);
  return out;
}

// ---- outfits --------------------------------------------------------------------

export interface Ctx {
  p: Pix;
  f: Frame;
  skin: Ramp;
  hair: Ramp;
  eye: string;
  main: Ramp;
  trim: Ramp;
  cloak: Ramp;
  hat: Ramp;
  metal: Ramp;
  pet: Ramp;
  sky: string;
  v: (k: LookPartKey) => number;
}

const OUTFITS: ((c: Ctx) => void)[] = [
  // Tunic
  ({ p, f, main, trim, metal }) => {
    legsWear(p, f, trim);
    fill(p, torsoSpans(f), main);
    sleeves(p, f, main);
    // The tunic hangs over the hips.
    fill(p, [[f.ly, f.lx - 1, f.lx + f.lw], [f.ly + 1, f.lx - 1, f.lx + f.lw]], main);
    p.hl(f.lx - 1, f.lx + f.lw, f.ly + 1, main.lo);
    belt(p, f, ramp("#5a3a22"), metal.hi);
    p.set(f.cx - 1, f.ty, main.deep);
    p.set(f.cx, f.ty, main.deep);
    p.set(f.cx - 1, f.ty + 1, main.lo);
    boots(p, f, ramp("#5a3a22"));
  },
  // Robe
  ({ p, f, main, trim }) => {
    fill(p, torsoSpans(f), main);
    const sk = skirt(p, f, main);
    // Wide sleeves.
    fill(p, armSpans(f, "l"), main);
    fill(p, armSpans(f, "r"), main, "right");
    const last = f.ay + armLen(f) - 1;
    p.hl(f.lax - 1, f.lax + 2, last, trim.base);
    p.hl(f.rax, f.rax + 3, last, trim.lo);
    // Trim down the front and round the hem.
    p.vl(f.cx - 1, f.ty, f.feet - 1, trim.base);
    p.vl(f.cx, f.ty, f.feet - 1, trim.lo);
    const [hy, h0, h1] = sk[sk.length - 1];
    p.hl(h0, h1, hy, trim.lo);
    p.hl(f.cx - 3, f.cx - 2, f.feet, "#3a2a22");
    p.hl(f.cx + 1, f.cx + 2, f.feet, "#3a2a22");
    belt(p, f, trim, GOLD.base);
  },
  // Plate armour
  ({ p, f, main, metal }) => {
    legsWear(p, f, metal);
    for (const side of ["l", "r"] as const) {
      const [y, x0, x1] = legSpans(f, side)[Math.floor((f.feet - f.ly) / 2)];
      p.hl(x0, x1, y, metal.hi);
    }
    fill(p, torsoSpans(f), metal);
    sleeves(p, f, metal);
    // Tabard down the middle.
    fill(p, torsoSpans(f, 2, f.th).map(([y]) => [y, f.cx - 2, f.cx + 1] as Span), main);
    fill(p, [[f.ly, f.cx - 2, f.cx + 1], [f.ly + 1, f.cx - 2, f.cx + 1], [f.ly + 2, f.cx - 1, f.cx]], main, "flat");
    // Pauldrons.
    p.rect(f.lax - 1, f.ty, 4, 3, metal.base);
    p.hl(f.lax - 1, f.lax + 2, f.ty, metal.hi);
    p.rect(f.rax, f.ty, 4, 3, metal.lo);
    p.hl(f.rax, f.rax + 3, f.ty, metal.base);
    belt(p, f, ramp("#4a3a2c"), GOLD.hi);
    boots(p, f, ramp(metal.lo), 2);
  },
  // Leather
  ({ p, f, main, trim, metal, skin }) => {
    legsWear(p, f, trim);
    fill(p, torsoSpans(f), main);
    sleeves(p, f, main, 3);
    // Bracers.
    fill(p, armSpans(f, "l", armLen(f) - 2, armLen(f)), ramp(main.lo));
    fill(p, armSpans(f, "r", armLen(f) - 2, armLen(f)), ramp(main.lo), "right");
    void skin;
    // A strap across the chest.
    for (let i = 0; i < f.th - 1; i++) p.set(f.tx + 1 + Math.floor((i * (f.tw - 2)) / (f.th - 1)), f.ty + i, trim.deep);
    belt(p, f, ramp(trim.deep), metal.hi);
    p.set(f.tx + 2, f.ty + 4, main.hi);
    boots(p, f, ramp("#4a2f1e"), 4);
  },
  // Chainmail
  ({ p, f, main, trim, metal }) => {
    legsWear(p, f, trim);
    fill(p, torsoSpans(f), metal);
    sleeves(p, f, metal, armLen(f) - 1);
    // Rings: every other pixel darker.
    for (const [y, x0, x1] of [...torsoSpans(f), ...armSpans(f, "l", 0, armLen(f) - 1), ...armSpans(f, "r", 0, armLen(f) - 1)])
      for (let x = x0; x <= x1; x++) if ((x + y) % 2 === 0) p.set(x, y, metal.lo);
    fill(p, torsoSpans(f, 1, f.th).map(([y]) => [y, f.cx - 2, f.cx + 1] as Span), main);
    fill(p, [[f.ly, f.lx, f.lx + f.lw - 1], [f.ly + 1, f.lx, f.lx + f.lw - 1], [f.ly + 2, f.cx - 2, f.cx + 1]], main);
    belt(p, f, ramp("#4a3a2c"), metal.hi);
    boots(p, f, ramp("#4a2f1e"), 3);
  },
  // Noble coat
  ({ p, f, main, trim, metal }) => {
    legsWear(p, f, ramp(trim.lo));
    fill(p, torsoSpans(f), main);
    sleeves(p, f, main);
    // Cuffs.
    p.hl(f.lax, f.lax + 2, f.ay + armLen(f) - 1, WHITE);
    p.hl(f.rax, f.rax + 2, f.ay + armLen(f) - 1, tone(WHITE, -0.15));
    // Coat tails.
    for (let i = 0; i < 4; i++) {
      p.hl(f.lx - 1, f.lx + 1, f.ly + i, main.base);
      p.hl(f.lx + f.lw - 2, f.lx + f.lw, f.ly + i, main.lo);
    }
    // Lapels, cravat, buttons.
    p.vl(f.cx - 1, f.ty, f.ty + 3, WHITE);
    p.vl(f.cx, f.ty, f.ty + 3, tone(WHITE, -0.12));
    p.set(f.cx - 2, f.ty, trim.base);
    p.set(f.cx + 1, f.ty, trim.base);
    for (let y = f.ty + 5; y < f.ty + f.th - 1; y += 2) {
      p.set(f.cx - 2, y, metal.hi);
      p.set(f.cx + 1, y, metal.base);
    }
    boots(p, f, ramp("#2a2230"), 4);
  },
  // Peasant
  ({ p, f, main, trim, skin }) => {
    legsWear(p, f, trim, 0);
    // Rolled up trousers: bare shins and feet.
    for (const side of ["l", "r"] as const) fill(p, legSpans(f, side).slice(-3), skin, side === "r" ? "right" : "cyl");
    fill(p, torsoSpans(f), main);
    sleeves(p, f, main, Math.ceil(armLen(f) / 2));
    // Ragged hem and a patch.
    for (let x = f.lx - 1; x <= f.lx + f.lw; x++) p.set(x, f.ly + (x % 2 ? 1 : 0), main.lo);
    p.rect(f.tx + f.tw - 4, f.ty + 3, 2, 2, trim.hi);
    p.hl(f.tx, f.tx + f.tw - 1, f.ty + f.th - 2, ramp("#8a6a3f").base);
    p.set(f.cx - 1, f.ty, skin.lo);
    p.set(f.cx, f.ty, skin.lo);
    p.set(f.cx - 1, f.ty + 1, skin.lo);
  },
  // Monk
  ({ p, f, main, trim, skin }) => {
    legsWear(p, f, main);
    fill(p, torsoSpans(f), main);
    sleeves(p, f, main, Math.ceil(armLen(f) / 2) + 1);
    // Wrap: a V of skin and a fold.
    for (let i = 0; i < 4; i++) {
      p.hl(f.cx - 3 + i, f.cx + 2 - i, f.ty + i, skin.base);
    }
    for (let i = 0; i < 6; i++) p.set(f.cx + 2 - Math.floor(i / 2) - 1 + i, f.ty + 3 + i, main.lo);
    // Sash and its tail.
    p.hl(f.tx, f.tx + f.tw - 1, f.ty + f.th - 2, trim.base);
    p.hl(f.tx, f.tx + f.tw - 1, f.ty + f.th - 1, trim.lo);
    p.vl(f.tx + 1, f.ty + f.th, f.ty + f.th + 3, trim.base);
    // Sandals.
    for (const side of ["l", "r"] as const) {
      const [y, x0, x1] = legSpans(f, side)[f.feet - f.ly];
      p.hl(x0, x1, y, "#6b4a2a");
      p.hl(x0, x1, y - 1, skin.base);
    }
  },
  // Vestments
  ({ p, f, main, trim, metal }) => {
    fill(p, torsoSpans(f), ramp(WHITE));
    const sk = skirt(p, f, ramp(WHITE), f.feet - 1, 5);
    sleeves(p, f, ramp(WHITE));
    // A long stole in the main colour with a holy mark.
    for (let y = f.ty; y < f.feet; y++) {
      p.set(f.cx - 2, y, main.base);
      p.set(f.cx - 1, y, main.base);
      p.set(f.cx, y, main.lo);
      p.set(f.cx + 1, y, main.lo);
    }
    p.vl(f.cx - 1, f.ty + 3, f.ty + 6, metal.hi);
    p.hl(f.cx - 2, f.cx + 1, f.ty + 4, metal.hi);
    const [hy, h0, h1] = sk[sk.length - 1];
    p.hl(h0, h1, hy, trim.base);
    p.hl(f.cx - 3, f.cx - 2, f.feet, "#3a2a22");
    p.hl(f.cx + 1, f.cx + 2, f.feet, "#3a2a22");
  },
  // Hunter
  ({ p, f, main, trim, metal }) => {
    legsWear(p, f, trim);
    fill(p, torsoSpans(f), main);
    sleeves(p, f, main);
    // Fur collar.
    const fur = ramp("#cbb38a");
    for (let x = f.tx - 1; x <= f.tx + f.tw; x++) {
      p.set(x, f.ty, x % 2 ? fur.base : fur.hi);
      p.set(x, f.ty + 1, x % 2 ? fur.lo : fur.base);
    }
    // Quiver strap and a pouch.
    for (let i = 0; i < f.th; i++) p.set(f.tx + f.tw - 2 - Math.floor((i * (f.tw - 3)) / f.th), f.ty + i, "#4a2f1e");
    belt(p, f, ramp("#4a2f1e"), metal.base);
    p.rect(f.tx, f.ty + f.th - 1, 2, 2, "#6b4a2a");
    boots(p, f, ramp("#4a2f1e"), 5);
  },
  // Swashbuckler
  ({ p, f, main, trim, skin }) => {
    legsWear(p, f, ramp("#2e2a36"));
    // A loose white shirt open at the neck under a short vest.
    fill(p, torsoSpans(f), ramp(WHITE));
    sleeves(p, f, ramp(WHITE));
    p.set(f.cx - 1, f.ty, skin.base);
    p.set(f.cx, f.ty, skin.base);
    p.set(f.cx - 1, f.ty + 1, skin.lo);
    p.set(f.cx, f.ty + 1, skin.base);
    fill(p, torsoSpans(f).map(([y, x0]) => [y, x0, x0 + 2] as Span), main);
    fill(p, torsoSpans(f).map(([y, , x1]) => [y, x1 - 2, x1] as Span), main, "right");
    // Sash with a hanging end.
    p.hl(f.tx, f.tx + f.tw - 1, f.ty + f.th - 2, trim.base);
    p.hl(f.tx, f.tx + f.tw - 1, f.ty + f.th - 1, trim.lo);
    p.vl(f.tx + f.tw - 2, f.ty + f.th, f.ty + f.th + 2, trim.lo);
    boots(p, f, ramp("#2a2230"), 6);
    for (const side of ["l", "r"] as const) {
      const spans = legSpans(f, side);
      const [y, x0, x1] = spans[spans.length - 6];
      p.hl(x0 - (side === "l" ? 1 : 0), x1 + (side === "r" ? 1 : 0), y, "#3f3448");
    }
  },
];

// ---- head: ears, face, hair, beard, horns, hats ------------------------------------

/** Stamp a head sprite: col 0 is one pixel left of the head, row 0 is `top` rows above the head. */
const headStamp = (c: Ctx, rows: readonly string[], map: Record<string, C>, top: number, left = 1, flip = false) => c.p.stamp(c.f.hx - left, c.f.hy - top, rows, map, flip);

/** Two-sided sprites: drawn on the left side of the head and mirrored onto the right. */
function sides(c: Ctx, rows: readonly string[], map: Record<string, C>, top: number, leftOut: number) {
  const w = Math.max(...rows.map((r) => r.length));
  c.p.stamp(c.f.hx - leftOut, c.f.hy - top, rows, map);
  // Mirror: the right edge lands leftOut pixels past the head's right side.
  c.p.stamp(c.f.hx + 12 + leftOut - w, c.f.hy - top, rows, shadeRight(map), true);
}
/** On the shaded right side, swap light for base and base for shade. */
function shadeRight(map: Record<string, C>): Record<string, C> {
  const out = { ...map };
  if ("l" in map && "h" in map) out.l = map.h;
  if ("h" in map && "d" in map) out.h = map.d;
  return out;
}

const EARS: ((c: Ctx) => void)[] = [
  (c) => sides(c, ["h", "d"], { h: c.skin.base, d: c.skin.lo }, -6, 1),
  (c) => sides(c, ["h..", ".h.", ".hh", "..d"], { h: c.skin.base, d: c.skin.lo }, -4, 3),
  (c) => sides(c, ["h...", ".h..", ".hh.", "..hh", "...d"], { h: c.skin.base, d: c.skin.lo }, -3, 4),
  (c) => sides(c, ["d.d.", "hdhd", "hhhh", ".hhh", "..dh"], { h: c.skin.lo, d: c.skin.deep }, -4, 4),
  // Cat ears sit on top of the hair: drawn in earsTop.
  () => {},
  () => {},
  // Floppy ears hang at the sides.
  (c) => sides(c, [".hh", "hhh", "hhh", "hhd", "hhd", "hd.", "d.."], rm(c.hair), -4, 3),
];
function earsTop(c: Ctx) {
  const e = c.v("ears");
  const map = { ...rm(c.hair), p: "#e8a0a8" };
  if (e === 4) sides(c, ["h...", "hh..", "hph.", "hpph"], map, 3, 0);
  if (e === 5) sides(c, [".hh.", "hlph", "hlph", "hlph", "hlph", "hlph", ".hph", ".hhh", "..hh"], map, 9, -1);
}

const EYES: ((c: Ctx) => void)[] = [
  (c) => headStamp(c, ["kk..kk", "ke..ek"], { k: OUT, e: c.eye }, -6, -3),
  (c) => headStamp(c, [".k....k.", "k.k..k.k"], { k: OUT }, -6, -2),
  (c) => headStamp(c, ["ww..ww", "ke..ek", "kk..kk"], { k: OUT, e: c.eye, w: WHITE }, -5, -3),
  (c) => headStamp(c, ["kk..kk", "ee..ee"], { k: OUT, e: c.eye }, -7, -3),
  (c) => headStamp(c, ["k......k", ".k....k.", "..k..k..", "..e..e.."], { k: OUT, e: c.eye }, -4, -2),
  (c) => {
    const r = ramp(c.eye);
    headStamp(c, ["gw..wg", "gg..gg"], { g: tone(c.eye, 0.18), w: "#ffffff" }, -6, -3);
    headStamp(c, ["g......g"], { g: mix(r.hi, c.skin.base, 0.5) }, -6, -2);
  },
  (c) => headStamp(c, ["kk..kk"], { k: OUT }, -7, -3),
  // Eyepatch over the right eye, strap across.
  (c) => {
    headStamp(c, ["kk......", "ke......"], { k: OUT, e: c.eye }, -6, -3);
    headStamp(c, ["xxxxxxxxxxxx", "........xxx.", "........xxx."], { x: "#2a2228" }, -5, 0);
  },
];

const MOUTHS: ((c: Ctx) => void)[] = [
  (c) => headStamp(c, ["m..m", ".mm."], { m: MOUTH }, -9, -4),
  (c) => headStamp(c, [".mm."], { m: MOUTH }, -10, -4),
  (c) => headStamp(c, [".mm.", "m..m"], { m: MOUTH }, -9, -4),
  (c) => headStamp(c, ["mwwm", ".mm."], { m: MOUTH, w: WHITE }, -9, -4),
  (c) => headStamp(c, ["mm", "mm"], { m: MOUTH }, -9, -5),
  (c) => headStamp(c, ["...m", "mmm."], { m: MOUTH }, -9, -4),
  (c) => headStamp(c, ["mmmm", "w..w"], { m: MOUTH, w: WHITE }, -9, -4),
];

/** Marks under the beard (most), and tusks over it. */
const MARKS: ((c: Ctx) => void)[] = [
  () => {},
  (c) => headStamp(c, ["f.f....f.f", ".f......f."], { f: c.skin.deep }, -8, -1),
  (c) => headStamp(c, ["bb......bb"], { b: mix(c.skin.base, "#e0505a", 0.45) }, -8, -1),
  (c) => headStamp(c, ["......s.", ".......s", "........", "........", "......s.", ".....s.."], { s: mix(c.skin.base, "#c0504a", 0.55) }, -4, -2),
  (c) => headStamp(c, ["..p..p..", ".pp..pp.", ".p....p."], { p: c.trim.base }, -8, -2),
  (c) => {
    const s = c.skin.lo;
    headStamp(c, ["s..........s", ".s........s.", "s..........s", "............", "s.s......s.s"], { s }, -3, 0);
  },
  (c) => headStamp(c, ["ww..........ww", "..w........w..", "ww..........ww"], { w: tone(c.skin.base, -0.3) }, -8, 1),
  () => {},
  (c) => headStamp(c, ["t.t", ".t.", "t.t"], { t: "#3f6fa0" }, -7, -1),
];
function tusks(c: Ctx) {
  if (c.v("mark") === 7) headStamp(c, ["w....w", "w....w"], { w: BONE.hi }, -9, -3);
}

/** Hair drawn behind the head and body (long styles). */
function hairBack(c: Ctx) {
  const h = c.v("hair");
  const map = rm(c.hair);
  const { p, f } = c;
  const long = (to: number) => {
    for (let y = f.hy + 2; y <= f.hy + to; y++) {
      const inset = y >= f.hy + to - 1 ? 1 : 0;
      for (let x = f.hx - 1 + inset; x <= f.hx + 12 - inset; x++) p.set(x, y, x >= f.hx + 11 ? map.d : x <= f.hx ? map.l : map.h);
    }
  };
  if (h === 4) long(19);
  if (h === 10) long(12);
  if (h === 11) {
    long(17);
    headStamp(c, ["h............h", "hh..........hh", ".h..........h."], map, -16, 2);
  }
  if (h === 5) headStamp(c, ["..hh", ".hhd", "hhd.", "hhd.", "hhd.", "hd..", "hd..", ".d.."], map, -3, -12);
}

const HAIRS: ((c: Ctx, m: Record<string, C>) => void)[] = [
  // Bald: a shine.
  (c) => c.p.set(c.f.hx + 3, c.f.hy + 1, c.skin.hi),
  // Short
  (c, m) => headStamp(c, ["...hhhhhhhh...", "..hhllhhhhhh..", ".hhlhhhhhhhhd.", ".hhhhhhhhhhhd.", ".hhhh.hh.hhhd.", ".hh........hd.", ".h..........d."], m, 1),
  // Spiky
  (c, m) =>
    headStamp(c, ["...h..h..h....", "..hh.hh.hh.h..", "..hhhhhhhhhhh.", "..hhllhhhhhhd.", ".hhlhhhhhhhhd.", ".hhhhhhhhhhhd.", ".hh.hh.hh.hhd.", ".h..........d."], m, 3),
  // Swept
  (c, m) => headStamp(c, ["...hhhhhhhh...", "..hllhhhhhhhh.", ".hlhhhhhhhhhhd", ".hhhhhhhhhhhhd", ".hhhhhhhh..hhd", ".hhhhh.....hd.", ".h.........hd.", "...........d.."], m, 1),
  // Long (front)
  (c, m) =>
    headStamp(
      c,
      ["...hhhhhhhh...", "..hhllhhhhhh..", ".hhlhhhhhhhhd.", ".hhhhhhhhhhhd.", ".hhh......hhd.", ".hh........hd.", ".hh........hd.", ".hh........hd.", ".hh........hd.", ".hh........hd.", ".hh........hd.", ".h..........d."],
      m,
      1,
    ),
  // Ponytail (front like short, tail behind)
  (c, m) => headStamp(c, ["...hhhhhhhh...", "..hhllhhhhhh..", ".hhlhhhhhhhhd.", ".hhhhhhhhhhhd.", ".hhh......hhd.", ".hh........hd.", ".h..........d."], m, 1),
  // Bun
  (c, m) => {
    headStamp(c, [".....hhhh.....", "....hlhhhd....", "....hhhhhd....", ".....hddd.....", "...hhhhhhhh...", "..hhllhhhhhh..", ".hhlhhhhhhhhd.", ".hhhhhhhhhhhd.", ".hhh......hhd.", ".hh........hd."], m, 5);
  },
  // Mohawk
  (c, m) => {
    headStamp(c, [".....hh.....", ".....lh.....", "....hlhd....", "....hhhd....", "....hhhd....", "....hhhd...."], m, 4, 0);
    headStamp(c, ["d..........d", "d..........d"], { d: c.skin.lo }, -2, 0);
  },
  // Braids
  (c, m) => {
    headStamp(c, ["...hhhhhhhh...", "..hhlhhhhhhh..", ".hhlhhh.hhhhd.", ".hhhhh..hhhhd.", ".hhh......hhd.", ".hh........hd.", ".hh........hd."], m, 1);
    for (let i = 0; i < 9; i++) {
      const c1 = i % 2 ? m.d : m.h;
      c.p.set(c.f.hx - 1, c.f.hy + 6 + i, c1);
      c.p.set(c.f.hx, c.f.hy + 6 + i, i % 2 ? m.h : m.l);
      c.p.set(c.f.hx + 11, c.f.hy + 6 + i, c1);
      c.p.set(c.f.hx + 12, c.f.hy + 6 + i, m.d);
    }
    c.p.set(c.f.hx - 1, c.f.hy + 15, c.trim.base);
    c.p.set(c.f.hx + 12, c.f.hy + 15, c.trim.lo);
  },
  // Curly
  (c, m) =>
    headStamp(
      c,
      ["....h.hh.h......", "..hhhhhhhhhhh...", ".hhlhhlhhhhhhh..", "hhlhhhhhhhhhhhd.", "hhhhhhhhhhhhhhd.", ".hhhhhhhhhhhhdd.", "hhhh.h..h.hhhhd.", ".hh........hhd..", "hhh........hhhd.", ".h..........hd..", "hh..........hhd."],
      m,
      3,
      2,
    ),
  // Bob
  (c, m) =>
    headStamp(c, ["...hhhhhhhh...", "..hhllhhhhhh..", ".hhlhhhhhhhhd.", ".hhhhhhhhhhhd.", ".hhhhhhhhhhhd.", ".hh........hd.", ".hh........hd.", ".hh........hd.", ".hh........hd.", ".hhd......hdd."], m, 1),
  // Wild
  (c, m) =>
    headStamp(
      c,
      ["..h...h.h...h...", "...hh.hhhh.hh....", ".hhhhhhhhhhhhh..", "..hhlhhhhhhhhhh.", "hhhlhhhhhhhhhhhd", ".hhhhhhhhhhhhhd.", "hhhhh.hh.h.hhhhd", ".hh..........hd.", "hhh..........hhd", ".hh..........hd."],
      m,
      4,
      2,
    ),
  // Topknot
  (c, m) => {
    headStamp(c, ["....hh....", "...hlhd...", "....hd...."], m, 3, -1);
    headStamp(c, ["..hhhhhhhh..", ".hhhhhhhhhhd", "hd........dd"], m, 0, 0);
  },
];

const BEARDS: ((c: Ctx, m: Record<string, C>) => void)[] = [
  () => {},
  (c, m) => headStamp(c, ["d.d.d.d.d.d.", ".d.d.d.d.d..", "..d.d.d.d..."], { d: mix(c.skin.lo, m.d as string, 0.5) }, -8, 0),
  (c, m) => headStamp(c, ["...hhhhhh...", "..hd....dh..", "..d......d.."], m, -8, 0),
  (c, m) => headStamp(c, ["...hh..hh...", "....hhhh....", ".....hh.....", ".....hd....."], m, -9, 0),
  (c, m) => headStamp(c, ["h..........d", "h.hhhhhhhh.d", "hhhd....hhhd", "hhhhhhhhhhhd", ".hhhhhhhhhd.", "..hhhhhhdd..", "...hhhhd...."], m, -6, 0),
  (c, m) =>
    headStamp(c, ["h..........d", "h.hhhhhhhh.d", "hhhd....hhhd", "hhhhhhhhhhhd", ".hhhhhhhhhd.", "..hhhhhhhd..", "..hhhhhhhd..", "...hhhhhd...", "...hhhhd....", "....hhd.....", "....hd......"], m, -6, 0),
  (c, m) => {
    headStamp(c, ["h..........d", "h.hhhhhhhh.d", "hhhd....hhhd", "hhhhhhhhhhhd", ".hhhhhhhhhd.", "..hhhhhhdd.."], m, -6, 0);
    headStamp(c, ["hd..hd", "dh..dh", "hd..hd", "gg..gg"], { ...m, g: GOLD.base }, -12, -3);
  },
  (c, m) =>
    headStamp(
      c,
      ["h..........d", "h.hhhhhhhh.d", "hhhd....hhhd", "hhhhhhhhhhhd", "hhhhhhhhhhhd", ".hhhhhhhhhd.", ".hhhhhhhhhd.", "..hhhhhhhd..", "..hhhhhhhd..", "..hhhhhhd...", "...hhhhhd...", "...hhhhd....", "....hhhd....", "....hhd.....", ".....hd.....", ".....d......"],
      m,
      -6,
      0,
    ),
];

const HORNS: ((c: Ctx) => void)[] = [
  () => {},
  (c) => sides(c, ["l.", "hl", "hd"], rm(HORN), 2, -2),
  (c) => sides(c, ["..lhh", ".lhdhd", "lhd.hd", "hd..hd", "hd.hd.", ".hhd..", "..d..."], rm(ramp("#b89a6a")), 1, 3),
  (c) => sides(c, ["l...", "hl..", ".hl.", ".hhl", "..hd"], rm(HORN), 4, 1),
  (c) => sides(c, ["h.h..", "h.h.h", ".hhh.", "..hh.", "..h..", "...h.", "...hd"], rm(ramp("#8a6a48")), 6, 2),
  (c) => headStamp(c, ["l", "lh", "hl", "lh", "hd", "hl"], rm(ramp("#f2e2b8")), 6, -6),
];

const HATS: ((c: Ctx, m: Record<string, C>) => void)[] = [
  () => {},
  // Wizard hat
  (c, m) =>
    headStamp(
      c,
      ["...........hh...", "..........hhd...", ".........hhd....", "........hhhd....", ".......hlhhd....", ".......hlhhd....", "......hlhhhd....", "......hlhhs.d...", ".....hlhhhhhd...", ".....hlhhhhhd...", "....ggggggggggd.", ".hhhhhhhhhhhhhhd", "hhhhhhhhhhhhhhhhd", ".dddddddddddddd."],
      { ...m, g: c.trim.base, s: GOLD.hi },
      11,
      2,
    ),
  // Hood
  (c, m) =>
    headStamp(
      c,
      ["....hhhhhh....", "..hhllhhhhhh..", ".hlhhhhhhhhhd.", ".hlhhhhhhhhhd.", "hlhdddddddhhdd", "hlhd......dhdd", "hlhd......dhd.", "hlh........hd.", "hlh........hd.", "hlh........hd.", "hlh........hdd", "hlhh......hhdd", ".hhhh....hhhd."],
      m,
      1,
    ),
  // Helm
  (c) =>
    headStamp(
      c,
      ["....hhhhhh....", "..hllhhhhhhh..", ".hlhhhhhhhhhd.", ".hlhhhhhhhhhd.", "hlhhhhhhhhhhdd", "hhddddddddddd.", "hd..........d.", "hd..........d.", "h...........d."],
      rm(c.metal),
      1,
    ),
  // Horned helm
  (c) => {
    sides(c, ["l...", "hl..", "hh..", ".hh."], rm(BONE), 3, 3);
    headStamp(c, ["....hhhhhh....", "..hllhhhhhhh..", ".hlhhhhhhhhhd.", ".hlhhhhhhhhhd.", "hlhhhhhhhhhhdd", "hhddddddddddd."], rm(c.metal), 1);
  },
  // Crown
  (c) => headStamp(c, [".g...g..g...g.", ".gg.ggg.gg.gg.", ".gGgrgGgbgGgg.", ".dddddddddddd."], { g: GOLD.hi, G: GOLD.base, d: GOLD.lo, r: "#d23a4a", b: "#3a7ad2" }, 3),
  // Circlet
  (c) => headStamp(c, ["mmmmmgmmmmmd"], { m: c.metal.hi, d: c.metal.lo, g: "#4ad2c8" }, -3, 0),
  // Bandana
  (c, m) => headStamp(c, ["...hhhhhhhh....", "..hlhhhhhhhhh..", ".hlhhhhhhhhhhdd", ".hhhdhhdhhhhdhd", "............hd.", ".............dh"], m, 1),
  // Feathered cap
  (c, m) =>
    headStamp(c, ["..............w.", ".............ww.", "............wf..", "...hhhhhhh.wf...", "..hlhhhhhhwfh...", ".hlhhhhhhhhhhd..", ".hhhhhhhhhhhhd..", "dddddddddddddd.."], { ...m, w: WHITE, f: c.trim.base }, 6),
  // Tricorn
  (c, m) =>
    headStamp(c, [".....hhhhhh.....", "...hhhlhhhhhh...", "..hhlhhhhhhhhh..", "ghhhhhhhhhhhhhhg", ".gghhhhhhhhhhgg.", "...gggggggggg..."], { ...m, g: GOLD.base }, 4, 2),
  // Flower crown
  (c) => headStamp(c, [".p.w.y.p.w.y.", "gpgwgygpgwgyg"], { p: "#e86a9a", w: WHITE, y: "#f2c84a", g: "#4f9a45" }, 1, 0),
  // Witch hat
  (c, m) =>
    headStamp(
      c,
      ["........h.......", "........hd......", ".......hhd......", ".......hhd......", "......hlhd......", "......hlhhd.....", ".....hlhhhd.....", ".....hlhhhd.....", "....hlhhhhhd....", "....ggggggggd...", "hhhhhhhhhhhhhhhd", ".dddddddddddddd."],
      { ...m, g: c.trim.base },
      9,
      2,
    ),
  // Headband
  (c, m) => headStamp(c, ["lhhhhhhhhhhhd.", "............dh", "..............d"], m, -3, 1),
];

// ---- cloaks, wings, tails ------------------------------------------------------------

function cloakBack(c: Ctx) {
  const k = c.v("cloak");
  const { p, f, cloak } = c;
  if (k === 1 || k === 2 || k === 5) {
    const to = k === 1 ? f.ly + 4 : f.feet;
    for (let y = f.ty; y <= to; y++) {
      const i = y - f.ty;
      const w = k === 1 ? 1 : Math.floor(i / 6);
      for (let x = f.lax - 1 - w; x <= f.rax + 3 + w; x++) p.set(x, y, x <= f.lax - w ? cloak.base : x >= f.rax + 2 + w ? cloak.deep : cloak.lo);
    }
  }
  if (k === 5) {
    // The hood lies behind the head like a halo.
    for (const [y, x0, x1] of headSpans(f)) if (y >= f.hy + 3) for (let x = x0 - 1; x <= x1 + 1; x++) p.set(x, y + 1, cloak.lo);
  }
}
function cloakFront(c: Ctx) {
  const k = c.v("cloak");
  const { p, f, cloak, metal } = c;
  if (k === 1 || k === 2 || k === 5) {
    p.hl(f.tx - 1, f.tx + 1, f.ty, cloak.base);
    p.hl(f.tx + f.tw - 2, f.tx + f.tw, f.ty, cloak.lo);
    p.set(f.tx + 1, f.ty + 1, metal.hi);
    p.set(f.tx + f.tw - 2, f.ty + 1, metal.base);
  }
  if (k === 3) {
    p.hl(f.cx - 4, f.cx + 3, f.ty, cloak.base);
    p.hl(f.cx - 4, f.cx + 3, f.ty + 1, cloak.lo);
    p.set(f.cx - 4, f.ty, cloak.hi);
    for (let y = f.ty + 2; y < f.ty + 7; y++) {
      p.set(f.cx + 1, y, cloak.base);
      p.set(f.cx + 2, y, cloak.lo);
    }
    p.hl(f.cx + 1, f.cx + 2, f.ty + 7, cloak.hi);
  }
  if (k === 4) {
    const fur = ramp("#d8c9a8");
    for (let x = f.lax; x <= f.rax + 2; x++) {
      const t = (x * 7) % 3;
      p.set(x, f.ty - 1, x > f.tx && x < f.tx + f.tw - 1 ? (t ? fur.hi : fur.base) : undefined);
      p.set(x, f.ty, t ? fur.base : fur.hi);
      p.set(x, f.ty + 1, x > f.rax ? fur.lo : t ? fur.lo : fur.base);
      if (x <= f.lax || x >= f.rax + 2) p.set(x, f.ty + 2, fur.lo);
    }
  }
}

function wings(c: Ctx) {
  const k = c.v("wings");
  if (!k) return;
  const { p, f } = c;
  const top = f.ty - (k === 3 ? 7 : 9);
  const sprites: Record<number, [string[], Record<string, C>]> = {
    1: [
      ["hh..........", "hlhh........", "hlllhh......", ".hlllllhh...", ".hllllllllhh", "..hlldllllll", "..hldlldllll", "...hdlldllll", "...hd.hdlldl", "....h..hd.hd", ".........h.."],
      rm(ramp("#ece6da")),
    ],
    2: [
      ["h...........", "hh..........", "hxhh........", "hxxxhh......", "hxxxxxhh....", "hxxxxxxxhhhh", "hxxhxxxxxxxx", "hxh.hxxhxxxx", "hh...hh.hxxh", "h.......h..h"],
      { h: "#3a2a40", x: "#6b4a72" },
    ],
    3: [
      ["..hhhh......", ".hllllh.....", "hlleelh.....", "hleeelh.....", "hleellh.....", ".hlllhh.....", "..hhhhh.....", ".hlllh......", "hleelh......", "hlllh.......", ".hhh........"],
      { h: "#7fc4dc", l: "#c4eaf4", e: "#e8f8ff" },
    ],
  };
  const [rows, map] = sprites[k];
  p.stamp(f.tx - 11, top, rows, map);
  p.stamp(f.tx + f.tw - 1, top, rows, shadeRight(map), true);
}

function tail(c: Ctx) {
  const k = c.v("tail");
  if (!k) return;
  const { p, f } = c;
  const x = f.tx + f.tw - 1;
  const y = f.ly - 2;
  if (k === 1) p.stamp(x, y, ["h.......", ".h......", ".h....hh", "..h..hhh", "...hh.h."], { h: c.skin.lo });
  if (k === 2) p.stamp(x, y - 6, [".......hh", "......hlh", "......hh.", ".....hh..", ".....hd..", "....hhd..", "...hhd...", "..hhd....", "hhhd.....", "hhd......"], rm(c.hair));
  if (k === 3) p.stamp(x - 1, y + 3, ["hh.........", "hhhh.......", ".hhhhh.....", "..dhhhhh...", "....ddhhhh.", "......ddhhh"], rm(c.skin));
  if (k === 4) p.stamp(x, y - 4, [".....hhh..", "....hhlhw.", "...hhlhww.", "..hhlhhww.", ".hhhhhhw..", "hhhhhhd...", "hhhhdd....", ".hd......."], { ...rm(c.hair), w: WHITE });
}

// ---- things in hand ---------------------------------------------------------------------

/** Stamp a sprite so its "o" cell lands on (x, y). */
function grip(p: Pix, x: number, y: number, rows: string[], map: Record<string, C>) {
  let ox = 0;
  let oy = 0;
  rows.forEach((r, j) => {
    const i = r.indexOf("o");
    if (i >= 0) {
      ox = i;
      oy = j;
    }
  });
  p.stamp(x - ox, y - oy, rows, map);
}

function mainHand(c: Ctx) {
  const k = c.v("hand");
  if (!k) return;
  const { p, f, metal } = c;
  const x = f.rax + 1;
  const y = f.handY;
  const m = { M: metal.hi, m: metal.base, n: metal.lo, b: WOOD.base, B: WOOD.lo, o: WOOD.lo, g: GOLD.hi, G: GOLD.base, w: WHITE };
  const items: Record<number, string[]> = {
    1: ["..M..", ".Mmn.", ".Mmn.", ".Mmn.", ".Mmn.", ".Mmn.", ".Mmn.", ".Mmn.", ".Mmn.", ".Mmn.", "GgGgG", "..B..", "..o..", "..B..", "..g.."],
    2: ["..MMm..", ".MMmmb.", "MMmmnb.", "Mmmnnb.", "Mmmnnb.", ".Mnn.b.", ".....b.", ".....b.", ".....b.", ".....b.", ".....o.", ".....B.", ".....B."],
    3: ["..gg.", ".gbbg", "..bb.", "..bB.", "..bB.", "..bB.", "..bB.", "..bB.", "..bB.", "..oB.", "..bB.", "..bB.", "..bB.", "..bB.", "..bB."],
    4: ["....w", "...s.", "..b..", ".b...", "o...."],
    5: ["..bb", ".b.w", ".b.w", "b..w", "b..w", "b..w", "o..w", "b..w", "b..w", "b..w", ".b.w", ".b.w", "..bb"],
    6: [".M.", "Mmn", "Mmn", "Mmn", "GgG", ".o.", ".g."],
    7: ["M.M.M", ".MmM.", "MmmnM", ".Mnn.", "M.b.M", "..b..", "..b..", "..b..", "..o..", "..B..", "..g.."],
    8: ["..M..", ".Mmn.", ".Mmn.", "..n..", "..b..", "..b..", "..b..", "..b..", "..b..", "..b..", "..b..", "..b..", "..o..", "..B..", "..B..", "..B..", "..B..", "..B.."],
    9: ["..Bb..", "..bb..", "..bB..", "..bb..", "..bb..", "..ob..", ".bbbb.", "bbsbbb", "bsssbB", "bbsbbB", ".bbbB.", "..BB.."],
    10: [".a.", "aba", "bcb", "cdc", ".B.", ".b.", ".o.", ".B."],
    11: ["MMMMM", "Mmmmn", "nnnnn", "..b..", "..b..", "..b..", "..b..", "..b..", "..o..", "..B.."],
    12: [".cCc.", "cCwCc", ".cCc.", "..c..", "..b..", "..bB.", "..bB.", "..bB.", "..bB.", "..bB.", "..oB.", "..bB.", "..bB.", "..bB.", "..bB."],
  };
  const extra: Record<string, C> = { s: k === 9 ? "#3a2418" : "#f8e48a", a: FLAME.a, c: k === 12 ? "#5ad8e6" : FLAME.c, C: "#a8f0f8", d: FLAME.d };
  if (k === 10) {
    extra.b = FLAME.b;
  }
  const map: Record<string, C> = { ...m, ...extra };
  if (k === 10) map.B = WOOD.lo;
  grip(p, x, y, items[k], map);
  if (k === 10 || k === 12 || k === 4) {
    // A soft glow.
    const gy = y - (k === 4 ? 4 : items[k].findIndex((r) => r.includes("o")));
    void gy;
  }
}

function offHand(c: Ctx) {
  const k = c.v("offhand");
  if (!k) return;
  const { p, f, trim, metal } = c;
  const x = f.lax + 1;
  const y = f.handY;
  const items: Record<number, [string[], Record<string, C>]> = {
    1: [["..mmmm..", ".mhhhhm.", "mhhlhhdm", "mhlgGhdm", "mhhGGhdm", "mhhhhddm", ".mddddm.", "..mmmm.."], { m: metal.lo, h: trim.base, l: trim.hi, d: trim.lo, g: metal.hi, G: metal.base }],
    2: [["mmmmmm", "mhhhhm", "mhgghd", "mggggd", "mhgghd", "mhhhhd", ".mhhd.", ".mhd..", "..md.."], { m: metal.hi, h: trim.base, d: trim.lo, g: GOLD.hi }],
    3: [["hhhhh", "hwwwh", "hwgwh", "hwwwh", "hhhhd"], { h: trim.lo, w: "#efe6cc", g: GOLD.base, d: trim.deep }],
    4: [[".ll.", "lwpp", "pppd", ".dd.", "....", ".o.."], { l: "#d8b8f8", w: WHITE, p: "#9a6ad8", d: "#6a3aa8", o: null }],
    5: [[".m.", "m.m", "mmm", "yyy", "yYy", "yyy", "mmm"], { m: metal.lo, y: "#ffd25a", Y: "#fff6c0" }],
    6: [[".b.", ".w.", "rrr", "rRr", "rrr"], { b: WOOD.base, w: "#cfe6ec", r: "#d23a4a", R: "#ff8a8a" }],
    7: [[".m.", ".m.", "gGg", "GwG", "gGg"], { m: metal.lo, g: GOLD.base, G: GOLD.hi, w: "#fff6c0" }],
  };
  const [rows, map] = items[k];
  const w = rows[0].length;
  const at: Record<number, [number, number]> = { 1: [4, 4], 2: [3, 3], 3: [2, 2], 4: [1, 6], 5: [1, -1], 6: [1, 2], 7: [1, -1] };
  const [ax, ay] = at[k];
  void w;
  p.stamp(x - ax, y - ay, rows, map);
}

// ---- pets ---------------------------------------------------------------------------

const PETS: Record<number, string[]> = {
  1: [".h....h..", ".hh..hh..", ".hhhhhh..", ".hkhhkh..", ".hhpphh..", "..hhhh..h", ".hlhhhd.h", ".hlhhhdhd", ".hhdhdhd."],
  2: ["hh....hh.", "hdhhhhdh.", ".hhhhhh..", ".hkhhkh..", ".hhwwhh..", "..hkkh...", ".hlhhhh.h", ".hlhhhhhd", ".hhd.hhd."],
  3: [".h....h.", ".hhhhhh.", "hwwhhwwh", "hwkhhkwh", "hhhyyhhh", ".hlhhdh.", ".hlhhdh.", ".hhhhhh.", "..y..y.."],
  4: ["..hhh...", ".hhkhh..", ".hhhhyy.", "hhhhhh..", "hlhhhd..", "hlhhhd..", ".hhhd...", "..hd....", "..y.y..."],
  5: [".kh..hk.", "hhhhhhhh", "hlhhhhhd", "hhppppdd", ".hhhhhd.", "hh.hh.hh"],
  6: ["..s..s...", ".hhhhh...", ".hkhhk.ww", "hhhhhhwww", ".hhwwhww.", "..hhhhhh.", ".hlhhhhd.", ".hlhhhhhd", "..hh.hh.d"],
  7: ["....ll....", "..hlllhh..", ".hlhhhhhd.", "hlhkhhkhhd", "hhhhhhhhhd", "hhhhhhhhdd", ".ddddddd.."],
  8: [".hh......", "hkhh.....", "hhhhhh...", ".phhhhh..", "..hhhhhhd", "...h..hd.", "........d"],
  9: ["h.....h..", "hh...hh..", ".hhhhh...", ".hkhkh...", ".hwwwh..hh", "..hhh..hhh", ".hlhhhhhw.", ".hlhhhhd..", ".hh.hh...."],
  10: [".h..h..", ".h..h..", ".hp.hp.", ".hhhh..", "hkhhkh.", "hhpphh.", ".hhhh.w", "hlhhhhw", "hhhhhd."],
};

function pet(c: Ctx): Pix {
  const k = c.v("pet");
  const p = new Pix();
  if (!k) return p;
  const rows = PETS[k];
  const map: Record<string, C> = { ...rm(c.pet), k: OUT, p: "#e8a0a8", w: WHITE, y: "#f2b83a", s: "#c8a85a" };
  if (k === 8) map.p = "#e8a0a8";
  if (k === 7) {
    const slime = ramp(c.pet.base);
    Object.assign(map, { h: slime.base, l: tone(slime.base, 0.2), d: slime.lo });
  }
  p.stamp(4, c.f.feet - rows.length + 1, rows, map);
  // Wings on the dragonling.
  if (k === 6) p.stamp(5, c.f.feet - rows.length - 2, ["d.....", "dd.d..", ".ddd.."], { d: c.pet.lo });
  return p;
}

// ---- stands and backdrops ------------------------------------------------------------------

function platform(p: Pix, k: number) {
  const cx = 24;
  const top = 50;
  const disc = (r: Ramp, side: Ramp | null, rx = 15, ry = 3, thick = 2) => {
    if (side) {
      for (let t = thick; t >= 1; t--) p.ell(cx, top + 1.5 + t, rx, ry, t === thick ? side.deep : side.lo);
    }
    p.ell(cx, top + 1.5, rx, ry, (_x, y, dx, dy) => (dy < -0.4 ? r.hi : dx > 0.6 || dy > 0.5 ? r.lo : r.base));
  };
  if (k === 1) {
    disc(ramp("#5f9a45"), ramp("#6b4a2a"));
    const g = ramp("#5f9a45");
    for (const [x, h] of [
      [11, 2],
      [14, 1],
      [17, 2],
      [31, 2],
      [34, 1],
      [37, 2],
      [20, 1],
      [28, 1],
    ])
      p.vl(x, top - h, top, g.hi);
  }
  if (k === 2) {
    disc(ramp("#8f939e"), ramp("#6a6e7a"), 15, 3, 3);
    for (const x of [14, 22, 30, 36]) p.vl(x, top + 3, top + 5, tone("#6a6e7a", -0.3));
  }
  if (k === 3) {
    disc(ramp("#a8743f"), ramp("#7a4b2b"), 15, 3, 2);
    for (const y of [top, top + 2]) p.hl(13, 35, y, tone("#a8743f", -0.15));
  }
  if (k === 4) {
    const cl = ramp("#f2f4fa");
    for (const [x, y, r] of [
      [14, 51, 4],
      [20, 52, 5],
      [27, 52, 5],
      [34, 51, 4],
      [24, 50, 6],
    ])
      p.ell(x, y, r, r * 0.6, (_x, _y, _dx, dy) => (dy > 0.3 ? tone(cl.base, -0.12) : cl.base));
  }
  if (k === 5) {
    p.ell(cx, top + 1.5, 15, 3.5, "#2a2440");
    p.ell(cx, top + 1.5, 13, 2.5, (x, y, dx, dy) => (dx * dx + dy * dy > 0.55 ? ((x + y) % 2 ? "#6ae0f0" : "#3a9ab8") : "#2a2440"));
    p.ell(cx, top + 1.5, 6, 1.2, "#3a9ab8");
  }
  if (k === 6) {
    disc(ramp("#f2f6fa"), ramp("#c8d8ea"), 16, 3.5, 2);
  }
  if (k === 7) {
    const w = ramp("#a8743f");
    p.rect(14, top + 1, 20, 5, w.base);
    p.hl(14, 33, top + 1, w.hi);
    p.hl(14, 33, top + 5, w.lo);
    p.vl(14, top + 1, top + 5, w.lo);
    p.vl(33, top + 1, top + 5, w.deep);
    p.line(15, top + 2, 32, top + 4, w.lo);
    p.line(15, top + 4, 32, top + 2, w.lo);
    p.hl(13, 34, top, OUT);
    p.hl(13, 34, top + 6, OUT);
    p.vl(13, top, top + 6, OUT);
    p.vl(34, top, top + 6, OUT);
  }
}

/** A seeded number source, so the stars stay put. */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

/** Bands of colour, top to bottom, with dithered seams. */
function bands(p: Pix, stops: [number, string][]) {
  for (let y = 0; y < p.h; y++) {
    let i = stops.findIndex(([sy]) => sy > y);
    if (i === -1) i = stops.length;
    const c = stops[Math.max(0, i - 1)][1];
    const next = stops[i]?.[1];
    for (let x = 0; x < p.w; x++) p.set(x, y, next && stops[i][0] - y === 1 && (x + y) % 2 ? next : c);
  }
}

const BACKDROPS: ((p: Pix, c: Ctx) => void)[] = [
  () => {},
  // Plain, with a soft vignette.
  (p, c) => {
    const r = ramp(c.sky);
    for (let y = 0; y < p.h; y++)
      for (let x = 0; x < p.w; x++) {
        const d = Math.hypot((x - 24) / 26, (y - 30) / 30);
        p.set(x, y, d < 0.55 ? r.hi : d < 0.6 && (x + y) % 2 ? r.hi : d < 0.95 ? r.base : d < 1.0 && (x + y) % 2 ? r.base : r.lo);
      }
  },
  // Forest
  (p) => {
    bands(p, [
      [0, "#a8d4c8"],
      [14, "#bfe0cc"],
      [30, "#cfe8c8"],
    ]);
    const far = "#7fae8a";
    const near = "#4f7f5a";
    for (const [x, h, c] of [
      [3, 18, far],
      [12, 22, far],
      [21, 16, far],
      [30, 24, far],
      [41, 19, far],
      [-2, 26, near],
      [8, 30, near],
      [37, 28, near],
      [46, 32, near],
    ] as [number, number, string][])
      for (let i = 0; i < h; i++) p.hl(x - Math.floor(i / 2.4), x + Math.floor(i / 2.4), 44 - h + i, c);
    p.rect(0, 44, 48, 12, "#5f8f4a");
    for (let x = 0; x < 48; x += 3) p.set(x, 44, "#7fae5a");
    p.rect(0, 50, 48, 6, "#4f7f3f");
  },
  // Tavern
  (p) => {
    const plank = ["#7a4b2b", "#6b4126"];
    for (let x = 0; x < 48; x++) for (let y = 0; y < 44; y++) p.set(x, y, plank[Math.floor(x / 6) % 2]);
    for (let x = 5; x < 48; x += 6) p.vl(x, 0, 43, "#55331e");
    p.rect(0, 8, 48, 3, "#4a2c19");
    // Window
    p.rect(3, 15, 12, 12, "#3a3058");
    p.rect(4, 16, 10, 10, "#5a6aa8");
    p.vl(8, 16, 25, "#4a2c19");
    p.vl(9, 16, 25, "#4a2c19");
    p.hl(4, 13, 20, "#4a2c19");
    p.set(11, 18, "#f2e8b8");
    // Shelf with bottles
    p.rect(33, 22, 14, 1, "#4a2c19");
    for (const [x, c] of [
      [34, "#3f8f4a"],
      [37, "#b8343b"],
      [40, "#e0b23f"],
      [43, "#5a8ad0"],
    ] as [number, string][]) {
      p.rect(x, 18, 2, 4, c);
      p.set(x, 17, c);
      p.set(x, 18, tone(c, 0.2));
    }
    p.rect(0, 44, 48, 12, "#a8743f");
    for (let y = 46; y < 56; y += 3) p.hl(0, 47, y, "#8a5a33");
  },
  // Dungeon
  (p) => {
    p.rect(0, 0, 48, 44, "#4a4a5e");
    for (let y = 0; y < 44; y += 4) {
      p.hl(0, 47, y, "#3a3a4c");
      for (let x = (y / 4) % 2 ? 0 : 4; x < 48; x += 8) p.vl(x, y, y + 3, "#3a3a4c");
    }
    for (let y = 0; y < 44; y++) for (let x = 0; x < 48; x++) if (Math.hypot(x - 7, y - 16) < 9 && (x + y) % 2) p.set(x, y, "#6a5a5a");
    p.rect(6, 17, 2, 5, "#5a3a22");
    p.stamp(5, 12, [".a..", "abb.", "bcb.", ".c.."], { a: FLAME.a, b: FLAME.b, c: FLAME.c });
    p.rect(0, 44, 48, 12, "#2f2f3c");
    for (let x = 0; x < 48; x += 7) p.hl(x, x + 3, 47 + (x % 3), "#3a3a4a");
  },
  // Night sky
  (p) => {
    bands(p, [
      [0, "#141a38"],
      [12, "#1c2448"],
      [26, "#2a2c5a"],
      [36, "#3a3468"],
    ]);
    const r = seeded(7);
    for (let i = 0; i < 26; i++) p.set(Math.floor(r() * 48), Math.floor(r() * 34), r() > 0.7 ? "#ffffff" : "#a8b0e0");
    p.ell(37, 9, 4.5, 4.5, "#f2ecc8");
    p.ell(38.5, 8, 3.5, 3.5, "#1c2448");
    for (let x = 0; x < 48; x++) {
      const h = 38 + Math.round(3 * Math.sin(x / 6) + 2 * Math.sin(x / 2.7));
      p.vl(x, h, 55, "#1a1a30");
    }
  },
  // Sunset
  (p) => {
    bands(p, [
      [0, "#4a3a78"],
      [10, "#8a4a88"],
      [20, "#d8687a"],
      [28, "#f29a6a"],
      [34, "#f8c878"],
    ]);
    p.ell(24, 38, 8, 8, "#fff0b0");
    for (let x = 0; x < 48; x++) {
      const h = 32 + Math.abs(((x + 6) % 20) - 10);
      p.vl(x, h, 55, "#5a3a6a");
    }
    p.rect(0, 44, 48, 12, "#3a2848");
  },
  // Castle
  (p) => {
    bands(p, [
      [0, "#8fc0e8"],
      [20, "#b8d8f0"],
    ]);
    p.ell(10, 8, 5, 2, "#ffffff");
    p.ell(14, 7, 4, 2.5, "#ffffff");
    const k = "#8a92b0";
    p.rect(8, 24, 32, 20, k);
    for (const x of [6, 36]) {
      p.rect(x, 14, 7, 30, "#7a82a0");
      p.stamp(x - 1, 10, ["....h....", "...hhh...", "..hhhhh..", ".hhhhhhh."], { h: "#b8434a" });
    }
    for (let x = 8; x < 40; x += 3) p.rect(x, 22, 2, 2, k);
    p.rect(21, 34, 6, 10, "#4a4a62");
    p.rect(0, 42, 48, 14, "#6aa250");
    p.rect(0, 48, 48, 8, "#5a8f45");
  },
  // Seaside
  (p) => {
    bands(p, [
      [0, "#8fd0f0"],
      [18, "#bfe6f6"],
      [30, "#3a8ac8"],
      [36, "#2f7ab8"],
    ]);
    p.ell(38, 8, 4, 4, "#fff6c0");
    for (let y = 31; y < 42; y += 3) for (let x = (y * 3) % 7; x < 48; x += 7) p.hl(x, x + 2, y, "#8fd0f0");
    p.rect(0, 42, 48, 14, "#ead39a");
    p.hl(0, 47, 42, "#f6f0dc");
    for (let x = 2; x < 48; x += 9) p.set(x, 49 + (x % 4), "#c8a86a");
  },
  // Snowfield
  (p) => {
    bands(p, [
      [0, "#b8c8dc"],
      [20, "#d0dce8"],
    ]);
    for (const x of [4, 13, 33, 42])
      for (let i = 0; i < 16; i++) p.hl(x - Math.floor(i / 3), x + Math.floor(i / 3), 26 + i, i % 5 === 4 ? "#e8f0f8" : "#7f94ac");
    p.rect(0, 42, 48, 14, "#eef4fa");
    p.rect(0, 48, 48, 8, "#dde8f2");
    const r = seeded(3);
    for (let i = 0; i < 30; i++) p.set(Math.floor(r() * 48), Math.floor(r() * 46), "#ffffff");
  },
  // Desert
  (p) => {
    bands(p, [
      [0, "#f2c888"],
      [16, "#f8dca8"],
    ]);
    p.ell(36, 12, 5, 5, "#fff2c0");
    for (let x = 0; x < 48; x++) {
      p.vl(x, 34 + Math.round(3 * Math.sin(x / 7)), 55, "#e0a860");
      p.vl(x, 42 + Math.round(2 * Math.sin(x / 5 + 2)), 55, "#d8984f");
    }
    p.rect(6, 30, 2, 12, "#5a8a4a");
    p.rect(4, 33, 2, 4, "#5a8a4a");
    p.rect(8, 31, 2, 4, "#5a8a4a");
  },
  // Crystal cave
  (p) => {
    p.rect(0, 0, 48, 56, "#241c38");
    for (let y = 0; y < 56; y++) for (let x = 0; x < 48; x++) if (Math.hypot(x - 24, y - 30) < 22 && (x + y) % 2) p.set(x, y, "#30264a");
    const crystal = (x: number, y: number, h: number, c: string) => {
      for (let i = 0; i < h; i++) {
        const w = Math.max(0, Math.floor((i * 2) / h + 0.5));
        p.hl(x - w, x + w, y + i, i < 2 ? tone(c, 0.2) : c);
        p.set(x + w, y + i, tone(c, -0.2));
      }
    };
    crystal(5, 30, 14, "#5ad0e0");
    crystal(9, 36, 8, "#c86ae0");
    crystal(41, 28, 16, "#c86ae0");
    crystal(45, 36, 8, "#5ad0e0");
    crystal(38, 38, 6, "#5ad0e0");
    p.rect(0, 44, 48, 12, "#1a1428");
  },
  // Library
  (p) => {
    p.rect(0, 0, 48, 44, "#5a3a24");
    const spines = ["#b8343b", "#3a56b0", "#3f6d3a", "#d4a83a", "#6c3fa0", "#2f8a86", "#e9e4d8"];
    const r = seeded(11);
    for (let row = 0; row < 4; row++) {
      const y = 2 + row * 10;
      p.hl(0, 47, y + 8, "#3a2416");
      p.hl(0, 47, y + 9, "#4a2c19");
      for (let x = 1; x < 47; ) {
        const w = 1 + Math.floor(r() * 2);
        const h = 5 + Math.floor(r() * 3);
        const c = spines[Math.floor(r() * spines.length)];
        p.rect(x, y + 8 - h, w, h, c);
        x += w + (r() > 0.85 ? 2 : 0);
      }
    }
    p.rect(0, 44, 48, 12, "#7a4b2b");
    for (let y = 46; y < 56; y += 3) p.hl(0, 47, y, "#6b4126");
  },
];

// ---- putting it together ------------------------------------------------------------------

function pick(list: readonly { hex: string }[], i: number) {
  return (list[i] ?? list[0]).hex;
}

function ctxOf(look: Look, p: Pix): Ctx {
  const val = (k: LookPartKey | LookColorKey) => look[k] ?? LOOK_DEFAULTS[k];
  const col = (k: LookColorKey) => pick(SWATCHES[k], val(k));
  return {
    p,
    f: frameOf(val("body")),
    skin: ramp(col("skin")),
    hair: ramp(col("hairColor")),
    eye: col("eye"),
    main: ramp(col("main")),
    trim: ramp(col("trim")),
    cloak: ramp(col("cloakColor")),
    hat: ramp(col("hatColor")),
    metal: ramp(col("metal")),
    pet: ramp(col("petColor")),
    sky: col("sky"),
    v: (k) => val(k),
  };
}

const call = <T extends unknown[]>(list: ((...a: T) => void)[], i: number, ...a: T) => (list[i] ?? list[0])(...a);

/** The whole picture: backdrop, stand, character (outlined), pet. */
export function drawLook(look: Look): Pix {
  const { bg, ch, pet: pp } = layers(look, false);
  ch.outline(OUT);
  pp.outline(OUT);
  bg.over(ch);
  bg.over(pp);
  return bg;
}

/**
 * For the detailed version, which draws the body and outfit itself: what goes
 * behind the body (wings, tail, cloak, long hair) and what goes in front
 * (ears, marks, beard, hair, horns, hat, cloak clasp, things in hand), at the base size.
 */
export function splitLayers(look: Look): { bg: Pix; back: Pix; front: Pix; pet: Pix; c: Ctx } {
  const bg = new Pix();
  const back = new Pix();
  const front = new Pix();
  const c = ctxOf(look, back);
  call(BACKDROPS, c.v("background"), bg, c);
  platform(bg, c.v("platform"));
  wings(c);
  tail(c);
  cloakBack(c);
  hairBack(c);
  c.p = front;
  const hairMap = rm(c.hair);
  call(EARS, c.v("ears"), c);
  call(MARKS, c.v("mark"), c);
  call(BEARDS, c.v("beard"), c, hairMap);
  tusks(c);
  call(HAIRS, c.v("hair"), c, hairMap);
  earsTop(c);
  call(HORNS, c.v("horns"), c);
  call(HATS, c.v("hat"), c, rm(c.hat));
  cloakFront(c);
  offHand(c);
  mainHand(c);
  return { bg, back, front, pet: pet(c), c };
}

/** The three layers at the base size, before outlines. hdFace leaves the eyes and mouth out (drawn later at double size). */
export function layers(look: Look, hdFace: boolean): { bg: Pix; ch: Pix; pet: Pix; c: Ctx } {
  const bg = new Pix();
  const ch = new Pix();
  const c = ctxOf(look, ch);
  call(BACKDROPS, c.v("background"), bg, c);
  platform(bg, c.v("platform"));

  const hairMap = rm(c.hair);
  wings(c);
  tail(c);
  cloakBack(c);
  hairBack(c);
  body(ch, c.f, c.skin);
  call(OUTFITS, c.v("outfit"), c);
  call(EARS, c.v("ears"), c);
  if (!hdFace) call(EYES, c.v("eyes"), c);
  call(MARKS, c.v("mark"), c);
  call(BEARDS, c.v("beard"), c, hairMap);
  if (!hdFace) call(MOUTHS, c.v("mouth"), c);
  tusks(c);
  // A hood or helm hides most hair; draw the hair first so they cover it.
  call(HAIRS, c.v("hair"), c, hairMap);
  earsTop(c);
  call(HORNS, c.v("horns"), c);
  call(HATS, c.v("hat"), c, rm(c.hat));
  cloakFront(c);
  offHand(c);
  mainHand(c);
  // Hands close over the grips.
  if (c.v("hand")) hands(ch, c.f, c.skin, "r");
  if (c.v("offhand") && c.v("offhand") !== 1 && c.v("offhand") !== 2 && c.v("offhand") !== 4 && c.v("offhand") !== 5) hands(ch, c.f, c.skin, "l");
  return { bg, ch, pet: pet(c), c };
}

/** The head and shoulders, square, for tokens and lists. */
export function drawLookFace(look: Look, size = 22): Pix {
  const full = drawLook(look);
  const f = frameOf(look.body ?? LOOK_DEFAULTS.body);
  const x = Math.max(0, Math.min(LOOK_W - size, f.cx - size / 2));
  const y = Math.max(0, Math.min(LOOK_H - size, f.hy - 5));
  return full.crop(x, y, size, size);
}

/** RGBA bytes, for a canvas or a PNG. */
export function toRgba(p: Pix): Uint8ClampedArray {
  const out = new Uint8ClampedArray(p.w * p.h * 4);
  p.d.forEach((c, i) => {
    if (!c) return;
    const [r, g, b] = rgb(c);
    out[i * 4] = r;
    out[i * 4 + 1] = g;
    out[i * 4 + 2] = b;
    out[i * 4 + 3] = 255;
  });
  return out;
}
