// Face hair and face marks drawn natively at double size for the detailed
// look, so they sit exactly on the detailed face: beards wrap the mouth
// (lookArtHd.ts draws it at rows 18 to 21 of the head, columns 8 to 15) and
// start under the eyes, and freckles, war paint and whiskers stay fine.

import { type Ctx, mix, OUT, type Pix, ramp, tone } from "./lookArt";
import { type HFrame, headSpans } from "./lookBodyHd";

const GOLD = ramp("#d9a63a");

function lum(c: string): number {
  const n = parseInt(c.slice(1), 16);
  return ((n >> 16) & 255) * 0.3 + ((n >> 8) & 255) * 0.59 + (n & 255) * 0.11;
}

/** The mouth's box on the head, in head pixels. */
const MOUTH_X0 = 8;
const MOUTH_X1 = 15;
const MOUTH_Y0 = 18;
const MOUTH_Y1 = 21;
const inMouth = (x: number, r: number) => x >= MOUTH_X0 && x <= MOUTH_X1 && r >= MOUTH_Y0 && r <= MOUTH_Y1;

/** How far the cheek hair reaches in from the side of the head on each row (sideburns widening to the jaw). */
const CHEEK: Record<number, number> = { 11: 2, 12: 2, 13: 2, 14: 2, 15: 3, 16: 4 };

/** Is this head pixel (x across, r down, both from the head's corner) under a full beard? */
function onJaw(x: number, r: number, x0: number, x1: number): boolean {
  if (r < 11 || x < x0 || x > x1) return false;
  if (r <= 16) {
    if (x - x0 < CHEEK[r] || x1 - x < CHEEK[r]) return true;
    // The moustache's wings either side of the nose.
    return r === 16 && ((x >= 7 && x <= 10) || (x >= 14 && x <= 17));
  }
  return !inMouth(x, r);
}

/** Half-widths of the beard below the cheeks, from head row 19 down. */
const SHAPES: Record<number, number[]> = {
  4: [11, 11, 11, 10, 10, 9, 8, 6, 4],
  5: [11, 11, 11, 10, 10, 10, 9, 9, 8, 8, 7, 6, 6, 5, 4, 3, 2],
  6: [11, 11, 11, 10, 10, 9, 8],
  7: [11, 11, 11, 10, 10, 10, 10, 9, 9, 9, 8, 8, 8, 7, 7, 6, 6, 6, 5, 5, 4, 4, 3, 3, 2, 2, 1],
};

/** One plait: a stack of chevrons (the strands crossing), a gold ring, a tuft. */
function plait(p: Pix, x: number, y: number, chevrons: number, c: Ctx) {
  // Dark hair gets lighter strands and pale hair a soft grey crease, so the plait shows in every colour.
  const dark = lum(c.hair.base) < 70;
  const r = dark ? ramp(tone(c.hair.base, 0.12)) : c.hair;
  const crease = dark ? mix(c.hair.deep, OUT, 0.5) : mix(r.deep, OUT, 0.12);
  const rows = chevrons * 3;
  for (let i = 0; i < rows; i++) {
    const v = i % 3;
    for (let dx = 0; dx < 6; dx++) {
      const dark = dx === v || dx === 5 - v;
      p.set(x + dx, y + i, dark ? crease : dx < 3 ? (dx === 0 || v === 2 ? r.hi : r.base) : dx === 5 ? r.lo : r.base);
    }
  }
  const end = y + rows;
  p.hl(x, x + 5, end, GOLD.hi);
  p.hl(x, x + 5, end + 1, GOLD.base);
  p.hl(x, x + 5, end + 2, GOLD.lo);
  p.set(x + 5, end, GOLD.base);
  p.hl(x + 1, x + 4, end + 3, r.base);
  p.set(x + 1, end + 3, r.hi);
  p.hl(x + 1, x + 4, end + 4, r.lo);
  p.hl(x + 2, x + 3, end + 5, r.deep);
}

/**
 * The beard (moustache, goatee, full, long, braided, wizard) on its own grid,
 * so the face can tell what it hides. Stubble is drawn by stubbleHd.
 */
export function beardHd(p: Pix, h: HFrame, c: Ctx) {
  const k = c.v("beard");
  if (k < 2) return;
  const X = h.hx;
  const Y = h.hy;
  const r = c.hair;
  const spans = headSpans(h);
  const cells: [number, number][] = [];
  const add = (x: number, row: number) => cells.push([x, row]);

  if (k === 2) {
    // Moustache: wings under the nose that droop past the corners of the mouth.
    for (let x = 7; x <= 10; x++) add(x, 16);
    for (let x = 14; x <= 17; x++) add(x, 16);
    for (let x = 5; x <= 18; x++) add(x, 17);
    for (const x of [4, 5, 6, 17, 18, 19]) add(x, 18);
    for (const x of [4, 19]) add(x, 19);
  } else if (k === 3) {
    // Goatee: a thin moustache joined round the mouth to a tuft on the chin.
    for (let x = 7; x <= 16; x++) add(x, 17);
    for (let row = 18; row <= 21; row++) for (const x of [6, 7, 16, 17]) add(x, row);
    const chin = [5, 5, 4, 3, 2, 1];
    chin.forEach((hw, i) => {
      for (let x = 12 - hw; x <= 11 + hw; x++) add(x, 22 + i);
    });
  } else {
    for (let row = 11; row < 19; row++) {
      const [, x0, x1] = spans[row];
      // A bushy beard stands a pixel proud of the jaw.
      const puff = row >= 17 ? 1 : 0;
      for (let x = x0 - X - puff; x <= x1 - X + puff; x++) if (onJaw(Math.max(x0 - X, Math.min(x1 - X, x)), row, x0 - X, x1 - X)) add(x, row);
    }
    SHAPES[k].forEach((hw, i) => {
      const row = 19 + i;
      for (let x = 12 - hw; x <= 11 + hw; x++) if (!inMouth(x, row)) add(x, row);
    });
  }

  const has = new Set(cells.map(([x, row]) => x + row * 100));
  const at = (x: number, row: number) => has.has(x + row * 100);
  for (const [x, row] of cells) {
    let col = r.base;
    if (row > 17 && (!at(x - 1, row) || !at(x, row - 1))) col = r.hi;
    if (!at(x + 1, row) || !at(x + 2, row) || !at(x, row + 1)) col = r.lo;
    // Strands: a few darker and lighter threads running down the beard.
    else if (k >= 4 && row >= 20 && at(x, row + 2)) {
      if ((x + 40) % 4 === 1 && row % 6 !== 0) col = r.lo;
      else if ((x + 40) % 4 === 3 && row % 5 === 2) col = r.hi;
    }
    p.set(X + x, Y + row, col);
  }
  if (k === 6) {
    plait(p, X + 5, Y + 25, 4, c);
    plait(p, X + 13, Y + 25, 4, c);
    // A bead where the beard parts.
    p.hl(X + 11, X + 12, Y + 25, r.deep);
  }
}

/** Stubble: a fine speckle over the jaw and upper lip, straight onto the skin. */
export function stubbleHd(p: Pix, h: HFrame, c: Ctx, hidden: (x: number, y: number) => boolean) {
  if (c.v("beard") !== 1) return;
  const col = mix(c.skin.lo, c.hair.lo, 0.5);
  headSpans(h).forEach(([y, x0, x1], row) => {
    for (let x = x0 + 1; x < x1; x++) {
      const hx = x - h.hx;
      const lip = row === 17 && hx >= 6 && hx <= 17;
      if ((x + y) % 2 === 0 && row >= 15 && row <= 22 && (lip || (onJaw(hx, row, x0 - h.hx, x1 - h.hx) && row !== 16)) && !hidden(x, y)) p.set(x, y, col);
    }
  });
}

/** Freckles and war paint, on the skin (so under beards and hats). */
export function marksHd(p: Pix, h: HFrame, c: Ctx, hidden: (x: number, y: number) => boolean) {
  const k = c.v("mark");
  const put = (x: number, row: number, col: string) => {
    for (const hx of [x, 23 - x]) if (!hidden(h.hx + hx, h.hy + row)) p.set(h.hx + hx, h.hy + row, col);
  };
  if (k === 1) {
    const col = mix(c.skin.lo, c.skin.deep, 0.6);
    for (const [x, row] of [
      [3, 16],
      [5, 15],
      [6, 17],
      [8, 16],
      [4, 18],
      [10, 15],
    ])
      put(x, row, col);
  }
  if (k === 4) {
    // Two stripes down each cheek and a mark on the brow.
    const a = c.trim.base;
    const b = c.trim.lo;
    for (let row = 15; row <= 19; row++) {
      put(3, row, a);
      put(4, row, b);
    }
    for (let row = 15; row <= 17; row++) {
      put(6, row, a);
      put(7, row, b);
    }
    for (let row = 5; row <= 8; row++) put(11, row, row === 5 ? b : a);
  }
}

/** Whiskers: thin lines from the cheeks out past the face, drawn last so they stay one pixel wide. */
export function whiskersHd(p: Pix, h: HFrame, c: Ctx, hidden: (x: number, y: number) => boolean) {
  if (c.v("mark") !== 6) return;
  const col = mix(c.skin.deep, OUT, 0.55);
  for (const [x0, r0, x1, r1] of [
    [5, 16, -3, 14],
    [5, 17, -4, 17],
    [5, 18, -3, 20],
  ]) {
    for (const flip of [false, true]) {
      const a = flip ? 23 - x0 : x0;
      const b = flip ? 23 - x1 : x1;
      const n = Math.abs(b - a);
      for (let i = 0; i <= n; i++) {
        const x = h.hx + a + Math.sign(b - a) * i;
        const y = h.hy + Math.round(r0 + ((r1 - r0) * i) / n);
        if (!hidden(x, y)) p.set(x, y, col);
      }
    }
  }
}
