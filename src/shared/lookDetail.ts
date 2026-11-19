// The pixel style at three detail levels, named after console generations.
// The recipe is the same at every level; only how finely it is drawn changes:
//   8-bit   48×56, flat colours snapped to a small console palette, black outline
//   16-bit  48×56, shaded
//   32-bit  96×112, the detailed look (the default)

import { type Look, lookDetailOf } from "./look";
import { drawLook, frameOf, LOOK_DEFAULTS_BODY, Pix } from "./lookArt";
import { drawLookHd } from "./lookArtHd";

/** How many times the base 48×56 grid each level is. */
export const DETAIL_SCALE = [1, 1, 2] as const;

/** The 8-bit console palette every colour is snapped to. */
const PALETTE_8 = (
  "7c7c7c 0000fc 0000bc 4428bc 940084 a80020 a81000 881400 503000 007800 006800 005800 004058 000000 " +
  "bcbcbc 0078f8 0058f8 6844fc d800cc e40058 f83800 e45c10 ac7c00 00b800 00a800 00a844 008888 " +
  "f8f8f8 3cbcfc 6888fc 9878f8 f878f8 f85898 f87858 fca044 f8b800 b8f818 58d854 58f898 00e8d8 787878 " +
  "fcfcfc a4e4fc b8b8f8 d8b8f8 f8b8f8 f8a4c0 f0d0b0 fce0a8 f8d878 d8f878 b8f8b8 b8f8d8 00fcfc f8d8f8"
)
  .split(" ")
  .map((h) => [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), "#" + h] as const);

const rgb = (h: string): [number, number, number] => {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const snapped = new Map<string, string>();
function snap(c: string): string {
  let out = snapped.get(c);
  if (out) return out;
  // Push the colour away from grey first, so soft colours land on a hue instead of on a grey.
  const [r0, g0, b0] = rgb(c);
  const mid = (r0 + g0 + b0) / 3;
  const [r, g, b] = [r0, g0, b0].map((v) => Math.max(0, Math.min(255, mid + (v - mid) * 1.35)));
  let best = Infinity;
  out = c;
  for (const [pr, pg, pb, ph] of PALETTE_8) {
    // Weighted so the eye's sharper sense of green and of brightness counts.
    const mean = (r + pr) / 2;
    const d = (2 + mean / 256) * (r - pr) ** 2 + 4 * (g - pg) ** 2 + (2 + (255 - mean) / 256) * (b - pb) ** 2;
    if (d < best) {
      best = d;
      out = ph;
    }
  }
  snapped.set(c, out);
  return out;
}

/** 8-bit: every colour becomes its nearest in the console palette. */
function to8bit(p: Pix): Pix {
  const o = new Pix(p.w, p.h);
  p.d.forEach((c, i) => {
    o.d[i] = c ? snap(c) : null;
  });
  return o;
}

/** The whole picture at the look's detail level (or the one given). */
export function drawLookDetail(look: Look, detail = lookDetailOf(look)): Pix {
  if (detail === 0) return to8bit(drawLook(look));
  if (detail === 1) return drawLook(look);
  return drawLookHd(look);
}

/** Head and shoulders, square: 22 pixels at the base size, scaled with the level. */
export function drawLookDetailFace(look: Look, detail = lookDetailOf(look)): Pix {
  const k = DETAIL_SCALE[detail] ?? 2;
  const full = drawLookDetail(look, detail);
  const f = frameOf(look.body ?? LOOK_DEFAULTS_BODY);
  const size = 22 * k;
  const x = Math.max(0, Math.min(full.w - size, f.cx * k - size / 2));
  const y = Math.max(0, Math.min(full.h - size, f.hy * k - 5 * k));
  return full.crop(x, y, size, size);
}
