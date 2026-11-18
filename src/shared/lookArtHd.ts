// The detailed ("16-bit") version of a look: the same parts as lookArt.ts,
// drawn at double size (96×112). Curves are smoothed with Scale2x, every part
// gets a light edge and a shaded edge, outlines take the colour of what they
// wrap, and the face (eyes, brows, mouth) is drawn fresh at the bigger size.

import type { Look } from "./look";
import { type Ctx, layers, LOOK_H, LOOK_W, mix, MOUTH, OUT, Pix, splitLayers, tone, WHITE } from "./lookArt";
import { bodyHd, bookHd, handsHd, hframe, OUTFITS_HD } from "./lookBodyHd";

export const HD_W = LOOK_W * 2;
export const HD_H = LOOK_H * 2;

/** Scale2x: doubles a grid, rounding diagonal steps instead of making blocks. */
export function scale2x(p: Pix): Pix {
  const o = new Pix(p.w * 2, p.h * 2);
  for (let y = 0; y < p.h; y++)
    for (let x = 0; x < p.w; x++) {
      // Off the edge counts as more of the same, so corners aren't nibbled.
      const P = p.get(x, y);
      const A = y > 0 ? p.get(x, y - 1) : P;
      const B = x < p.w - 1 ? p.get(x + 1, y) : P;
      const C = x > 0 ? p.get(x - 1, y) : P;
      const D = y < p.h - 1 ? p.get(x, y + 1) : P;
      let e0 = P;
      let e1 = P;
      let e2 = P;
      let e3 = P;
      if (C === A && C !== D && A !== B) e0 = A;
      if (A === B && A !== C && B !== D) e1 = B;
      if (D === C && D !== B && C !== A) e2 = C;
      if (B === D && B !== A && D !== C) e3 = D;
      o.set(2 * x, 2 * y, e0);
      o.set(2 * x + 1, 2 * y, e1);
      o.set(2 * x, 2 * y + 1, e2);
      o.set(2 * x + 1, 2 * y + 1, e3);
    }
  return o;
}

const memo = new Map<string, string>();
const t = (c: string, dl: number) => {
  const k = c + dl;
  let v = memo.get(k);
  if (!v) memo.set(k, (v = tone(c, dl)));
  return v;
};

/** Each patch of colour gets a lit top-left edge and a shaded bottom-right edge (only where it's big enough). */
function bevel(p: Pix) {
  const src = p.d.slice();
  const at = (x: number, y: number) => (x < 0 || y < 0 || x >= p.w || y >= p.h ? null : src[y * p.w + x]);
  for (let y = 0; y < p.h; y++)
    for (let x = 0; x < p.w; x++) {
      const c = at(x, y);
      if (!c) continue;
      const lit = (at(x, y - 1) !== c && at(x, y + 1) === c && at(x, y + 2) === c) || (at(x - 1, y) !== c && at(x + 1, y) === c && at(x + 2, y) === c);
      const shade = (at(x, y + 1) !== c && at(x, y - 1) === c && at(x, y - 2) === c) || (at(x + 1, y) !== c && at(x - 1, y) === c && at(x - 2, y) === c);
      if (shade) p.set(x, y, t(c, -0.07));
      else if (lit) p.set(x, y, t(c, 0.06));
    }
}

/** A thin outline that takes a dark version of what it wraps; darkest underneath. */
function softOutline(p: Pix) {
  const add: [number, string][] = [];
  for (let y = 0; y < p.h; y++)
    for (let x = 0; x < p.w; x++) {
      if (p.get(x, y)) continue;
      const above = p.get(x, y - 1);
      const n = above ?? p.get(x - 1, y) ?? p.get(x + 1, y) ?? p.get(x, y + 1);
      if (!n) continue;
      add.push([y * p.w + x, above ? OUT : mix(t(n, -0.38), OUT, 0.55)]);
    }
  for (const [i, c] of add) p.d[i] = c;
}

/** Dark lines between parts of the character, so a sleeve reads against a tunic. */
function seams(p: Pix) {
  const src = p.d.slice();
  const at = (x: number, y: number) => (x < 0 || y < 0 || x >= p.w || y >= p.h ? null : src[y * p.w + x]);
  const lum = (c: string) => {
    const n = parseInt(c.slice(1), 16);
    return ((n >> 16) & 255) * 0.3 + ((n >> 8) & 255) * 0.59 + (n & 255) * 0.11;
  };
  for (let y = 0; y < p.h; y++)
    for (let x = 0; x < p.w; x++) {
      const c = at(x, y);
      if (!c) continue;
      for (const n of [at(x, y - 1), at(x - 1, y)]) {
        // Only between clearly different colours, on the darker side.
        if (n && n !== c && Math.abs(lum(n) - lum(c)) > 38 && lum(c) < lum(n)) {
          p.set(x, y, mix(c, OUT, 0.35));
          break;
        }
      }
    }
}

/**
 * Light from the top left over each patch of colour: brighter toward its
 * top-left corner, darker toward the bottom right, in a few steps blended
 * with an ordered dither (the 16-bit way to get smooth shading).
 */
function shadeRegions(p: Pix, { strength = 0.12, minSize = 14, dirX = 0.55, dirY = 0.45, steps = 0.06 } = {}) {
  const seen = new Uint8Array(p.w * p.h);
  const stack: number[] = [];
  for (let start = 0; start < p.d.length; start++) {
    const c = p.d[start];
    if (!c || seen[start]) continue;
    // Flood one region of exactly this colour.
    const cells: number[] = [];
    let x0 = p.w;
    let y0 = p.h;
    let x1 = 0;
    let y1 = 0;
    stack.push(start);
    seen[start] = 1;
    while (stack.length) {
      const i = stack.pop()!;
      cells.push(i);
      const x = i % p.w;
      const y = (i - x) / p.w;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
      for (const j of [x > 0 ? i - 1 : -1, x < p.w - 1 ? i + 1 : -1, i - p.w, i + p.w])
        if (j >= 0 && j < p.d.length && !seen[j] && p.d[j] === c) {
          seen[j] = 1;
          stack.push(j);
        }
    }
    if (cells.length < minSize) continue;
    const w = Math.max(1, x1 - x0);
    const h = Math.max(1, y1 - y0);
    for (const i of cells) {
      const x = i % p.w;
      const y = (i - x) / p.w;
      // 0 at the lit corner, 1 at the far one.
      const d = (dirX * (x - x0)) / w + (dirY * (y - y0)) / h;
      const amount = (0.5 - d / (dirX + dirY)) * 2 * strength;
      // Quantise to steps and dither between them.
      const lo = Math.floor(amount / steps) * steps;
      const frac = (amount - lo) / steps;
      // Clean bands, with a checkerboard only along the seam between two.
      const q = Math.abs(frac - 0.5) < 0.12 ? ((x + y) % 2 ? lo + steps : lo) : frac > 0.5 ? lo + steps : lo;
      if (Math.abs(q) > 0.001) p.d[i] = t(c, Math.round(q * 100) / 100);
    }
  }
}

/** The backdrop sits back: a touch darker and softer toward the edges. */
function vignette(p: Pix) {
  for (let y = 0; y < p.h; y++)
    for (let x = 0; x < p.w; x++) {
      const c = p.get(x, y);
      if (!c) continue;
      const d = Math.hypot((x - p.w / 2) / (p.w * 0.62), (y - p.h * 0.55) / (p.h * 0.62));
      const k = Math.max(0, d - 0.6) * 0.35;
      const q = Math.round(k * 25) / 25;
      if (q) p.set(x, y, mix(c, "#140f1c", Math.min(0.25, q)));
    }
}

/** A thin light rim where the character meets the air on the lit side. */
function rim(p: Pix) {
  const src = p.d.slice();
  const at = (x: number, y: number) => (x < 0 || y < 0 || x >= p.w || y >= p.h ? null : src[y * p.w + x]);
  for (let y = 0; y < p.h; y++)
    for (let x = 0; x < p.w; x++) {
      const c = at(x, y);
      if (!c || c === OUT) continue;
      if (!at(x - 1, y) || !at(x, y - 1)) p.set(x, y, t(c, 0.09));
    }
}

type Rows = string[];
interface EyeStyle {
  rows: Rows;
  top: number;
  brow?: Rows;
  browTop?: number;
}
const EYES_HD: EyeStyle[] = [
  { rows: ["kkkk", "wspk", "wiik"], top: 12, brow: [".bbb"], browTop: 10 },
  { rows: [".kk.", "k..k"], top: 12, brow: [".bbb"], browTop: 9 },
  { rows: ["kkkk", "wspk", "wiik", "wwwk", ".kk."], top: 11, brow: [".bb.", "b..."], browTop: 8 },
  { rows: ["mmmm", "kkkk", "wiik"], top: 12, brow: ["bbb."], browTop: 10 },
  { rows: ["kkkk", "wspk"], top: 13, brow: ["bb..", ".bbb"], browTop: 10 },
  { rows: ["gggg", "gssg", "gggg"], top: 12, brow: [".bbb"], browTop: 10 },
  { rows: ["k..k", ".kk."], top: 13, brow: [".bbb"], browTop: 10 },
  { rows: ["kkkk", "wspk", "wiik"], top: 12, brow: [".bbb"], browTop: 10 },
];

const MOUTHS_HD: { rows: Rows; top: number }[] = [
  { rows: ["m......m", ".mmmmmm.", "..llll.."], top: 18 },
  { rows: ["..mmmm..", "...ll..."], top: 19 },
  { rows: ["..mmmm..", ".m....m.", "m......m"], top: 18 },
  { rows: ["mmmmmmmm", "mwwwwwwm", ".mmmmmm."], top: 18 },
  { rows: ["..mmmm..", ".mMMMMm.", ".mMttMm.", "..mmmm.."], top: 18 },
  { rows: [".......m", "..mmmmm.", "...ll..."], top: 18 },
  { rows: ["mmmmmmmm", "mwMMMMwm", ".w....w."], top: 18 },
];

function face(p: Pix, c: Ctx) {
  const X = c.f.hx * 2;
  const Y = c.f.hy * 2;
  const eyesK = c.v("eyes");
  const style = EYES_HD[eyesK] ?? EYES_HD[0];
  const iris = c.eye;
  const map: Record<string, string> = {
    k: OUT,
    w: WHITE,
    s: "#ffffff",
    p: mix(iris, OUT, 0.7),
    i: iris,
    m: t(c.skin.base, -0.12),
    b: mix(c.hair.deep, OUT, 0.35),
    g: t(iris, 0.18),
  };
  if (eyesK === 5) map.s = "#ffffff";
  // Left eye, then the right one (same way round: both look the same way).
  p.stamp(X + 6, Y + style.top, style.rows, map);
  if (eyesK === 7) {
    // Eyepatch over the right eye and its strap.
    p.rect(X + 13, Y + 11, 6, 5, "#2a2228");
    p.hl(X + 14, X + 17, Y + 11, "#3a3038");
    p.line(X, Y + 8, X + 13, Y + 12, "#2a2228");
    p.line(X + 18, Y + 12, X + 23, Y + 10, "#2a2228");
  } else p.stamp(X + 14, Y + style.top, style.rows, map);
  if (style.brow && style.browTop !== undefined && c.v("hat") !== 3 && c.v("hat") !== 4) {
    p.stamp(X + 6, Y + style.browTop, style.brow, map);
    p.stamp(X + 14, Y + style.browTop, style.brow, map, true);
  }
  if (eyesK === 5) {
    // A soft glow around glowing eyes.
    for (const ex of [X + 5, X + 13])
      for (let dx = 0; dx < 6; dx++) {
        p.set(ex + dx, Y + 11, mix(c.skin.base, iris, 0.35));
        p.set(ex + dx, Y + 15, mix(c.skin.base, iris, 0.35));
      }
  }
  // Nose: a soft shadow, and the cheeks.
  p.set(X + 13, Y + 16, t(c.skin.base, -0.1));
  p.set(X + 12, Y + 17, t(c.skin.base, -0.13));
  p.set(X + 13, Y + 17, t(c.skin.base, -0.13));
  const m = MOUTHS_HD[c.v("mouth")] ?? MOUTHS_HD[0];
  p.stamp(X + 8, Y + m.top, m.rows, { m: MOUTH, M: "#4a1820", w: WHITE, t: "#e07a8a", l: mix(c.skin.base, "#d05a5a", 0.3) });
}

/** The look at double size with the richer finish. */
export function drawLookHd(look: Look): Pix {
  const { bg, back, front, pet, c } = splitLayers(look);
  // Wings, tail and the back of a cloak or long hair are smoothed up from the
  // base size; the body and clothes are drawn natively at double size; hair,
  // hats and gear go over the top, then the hands close over any grips.
  const big = scale2x(back);
  const h = hframe(c.f);
  bodyHd(big, h, c.skin);
  (OUTFITS_HD[c.v("outfit")] ?? OUTFITS_HD[0])(big, h, c);
  big.over(scale2x(front));
  if (c.v("offhand") === 3) bookHd(big, h, c);
  const off = c.v("offhand");
  if (c.v("hand")) handsHd(big, h, c.skin, "r");
  if (off && off !== 1 && off !== 2 && off !== 4 && off !== 5) handsHd(big, h, c.skin, "l");
  seams(big);
  shadeRegions(big);
  bevel(big);
  rim(big);
  face(big, c);
  softOutline(big);
  const pp = scale2x(pet);
  shadeRegions(pp, { minSize: 8 });
  rim(pp);
  softOutline(pp);
  const out = scale2x(bg);

  out.over(big);
  out.over(pp);
  return out;
}

/** Head and shoulders, square, at double size. */
export function drawLookHdFace(look: Look, size = 44): Pix {
  const full = drawLookHd(look);
  const { c } = layers(look, true);
  const x = Math.max(0, Math.min(HD_W - size, c.f.cx * 2 - size / 2));
  const y = Math.max(0, Math.min(HD_H - size, c.f.hy * 2 - 10));
  return full.crop(x, y, size, size);
}
