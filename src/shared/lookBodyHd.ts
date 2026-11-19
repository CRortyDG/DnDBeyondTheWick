// The body and outfits drawn natively at double size for the detailed look:
// a rounded head, sloped shoulders and a waist, arms that taper to real
// hands, knees, and boots with soles. Coordinates come from the base frame
// (lookArt.ts) doubled, so hair, hats and gear drawn at the base size still line up.

import { type Ctx, type Frame, mix, OUT, type Pix, type Ramp, ramp, WHITE } from "./lookArt";

type Span = [y: number, x0: number, x1: number];

export interface HFrame {
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

export function hframe(f: Frame): HFrame {
  return {
    cx: f.cx * 2,
    hx: f.hx * 2,
    hy: f.hy * 2,
    tx: f.tx * 2,
    ty: f.ty * 2,
    tw: f.tw * 2,
    th: f.th * 2,
    lx: f.lx * 2,
    ly: f.ly * 2,
    lw: f.lw * 2,
    feet: f.feet * 2 + 1,
    lax: f.lax * 2,
    rax: f.rax * 2,
    ay: f.ay * 2,
    handY: f.handY * 2,
  };
}

function fill(p: Pix, spans: Span[], r: Ramp, mode: "cyl" | "shade" | "flat" = "cyl") {
  for (const [y, x0, x1] of spans)
    for (let x = x0; x <= x1; x++) {
      const w = x1 - x0 + 1;
      let c = r.base;
      if (mode === "shade") c = x >= x1 - 1 ? r.deep : r.lo;
      else if (mode === "cyl") {
        if (x === x0 && w >= 4) c = r.hi;
        else if (x === x1 && w >= 4) c = r.lo;
        else if (x === x1 - 1 && w >= 9) c = r.lo;
      }
      p.set(x, y, c);
    }
}

// ---- shapes -----------------------------------------------------------------

export const headSpans = (h: HFrame): Span[] => {
  const out: Span[] = [];
  for (let r = 0; r < 24; r++) {
    const d = Math.abs(r + 0.5 - 12) / 12;
    let w = 12 * Math.pow(1 - Math.pow(d, 3.4), 1 / 3.4);
    if (r > 15) w *= 1 - (r - 15) * 0.03;
    const hw = Math.max(2, Math.round(w));
    out.push([h.hy + r, h.hx + 12 - hw, h.hx + 11 + hw]);
  }
  return out;
};

const torsoSpans = (h: HFrame, from = 0, to = h.th): Span[] => {
  const out: Span[] = [];
  for (let i = from; i < to; i++) {
    let inset = i === 0 ? 3 : i === 1 ? 1 : 0;
    const f = i / h.th;
    if (h.th >= 18 && f >= 0.5 && f < 0.82) inset = 1;
    out.push([h.ty + i, h.tx + inset, h.tx + h.tw - 1 - inset]);
  }
  return out;
};

const armLen = (h: HFrame) => h.handY - h.ay;
/** One arm from (0 = shoulder) to (exclusive) rows; the forearm tapers on the outside. */
const armSpans = (h: HFrame, side: "l" | "r", from = 0, to = armLen(h)): Span[] => {
  const out: Span[] = [];
  const len = armLen(h);
  for (let i = from; i < to; i++) {
    const fore = i >= len * 0.5 ? 1 : 0;
    const top = i === 0 ? 1 : 0;
    if (side === "l") out.push([h.ay + i, h.lax + fore + top, h.lax + 5]);
    else out.push([h.ay + i, h.rax, h.rax + 5 - fore - top]);
  }
  return out;
};
const handSpans = (h: HFrame, side: "l" | "r"): Span[] => {
  const x = side === "l" ? h.lax + 1 : h.rax;
  const rows: [number, number][] = [
    [0, 4],
    [0, 5],
    [0, 5],
    [0, 4],
    [1, 3],
  ];
  return rows.map(([a, b], i) => [h.handY + i, x + a - (side === "l" ? 1 : 0), x + b - (side === "l" ? 1 : 0)] as Span);
};
const legSpans = (h: HFrame, side: "l" | "r", from = 0): Span[] => {
  const half = h.lw / 2;
  const out: Span[] = [];
  const len = h.feet - h.ly;
  for (let y = h.ly + from; y <= h.feet; y++) {
    const i = y - h.ly;
    const gap = i >= 4;
    const calf = i > len * 0.55 && i < len - 3 ? 1 : 0;
    if (side === "l") out.push([y, h.lx + calf, h.lx + half - (gap ? 2 : 1)]);
    else out.push([y, h.lx + half + (gap ? 1 : 0), h.lx + h.lw - 1 - calf]);
  }
  return out;
};

// ---- the skin body --------------------------------------------------------------

export function bodyHd(p: Pix, h: HFrame, skin: Ramp) {
  fill(p, legSpans(h, "l"), skin);
  fill(p, legSpans(h, "r"), skin, "shade");
  p.rect(h.cx - 4, h.ty - 3, 8, 4, skin.lo);
  p.hl(h.cx - 4, h.cx + 3, h.ty - 1, skin.deep);
  fill(p, torsoSpans(h), skin);
  fill(p, armSpans(h, "l"), skin);
  fill(p, armSpans(h, "r"), skin, "shade");
  handsHd(p, h, skin, "both");
  const hs = headSpans(h);
  for (const [y, x0, x1] of hs) {
    const r = y - h.hy;
    for (let x = x0; x <= x1; x++) {
      let c = skin.base;
      if (x >= x1 - 1 || r >= 22) c = skin.lo;
      else if (x <= x0 && r > 4 && r < 18) c = skin.hi;
      p.set(x, y, c);
    }
  }
  // Cheekbones catch the light.
  p.hl(h.hx + 4, h.hx + 6, h.hy + 15, skin.hi);
}

export function handsHd(p: Pix, h: HFrame, skin: Ramp, which: "l" | "r" | "both") {
  for (const side of ["l", "r"] as const) {
    if (which !== "both" && which !== side) continue;
    fill(p, handSpans(h, side), skin, side === "r" ? "shade" : "cyl");
    // Knuckles.
    const [y, x0, x1] = handSpans(h, side)[2];
    p.set(side === "l" ? x0 + 2 : x1 - 2, y, side === "l" ? skin.lo : skin.deep);
  }
}

// ---- garment helpers --------------------------------------------------------------

function legsWear(p: Pix, h: HFrame, r: Ramp, from = 0) {
  fill(p, legSpans(h, "l", from), r);
  fill(p, legSpans(h, "r", from), r, "shade");
  // A crease at each knee.
  const k = h.ly + Math.round((h.feet - h.ly) * 0.5);
  for (const side of ["l", "r"] as const) {
    const sp = legSpans(h, side).find(([y]) => y === k);
    if (sp) p.hl(sp[1] + 1, sp[2] - 1, sp[0], side === "l" ? r.lo : r.deep);
  }
}
function sleeves(p: Pix, h: HFrame, r: Ramp, to = armLen(h)) {
  fill(p, armSpans(h, "l", 0, to), r);
  fill(p, armSpans(h, "r", 0, to), r, "shade");
  // Elbow fold.
  const e = Math.round(armLen(h) * 0.5);
  if (to > e + 1) {
    p.hl(h.lax + 2, h.lax + 4, h.ay + e, r.lo);
    p.hl(h.rax + 1, h.rax + 3, h.ay + e, r.deep);
  }
}
function torso(p: Pix, h: HFrame, r: Ramp, from = 0, to = h.th) {
  fill(p, torsoSpans(h, from, to), r);
  // Chest shadow under the pecs and a fold or two.
  const y = h.ty + Math.round(h.th * 0.35);
  p.hl(h.cx - 6, h.cx - 2, y, r.lo);
  p.hl(h.cx + 1, h.cx + 5, y, r.lo);
}
function belt(p: Pix, h: HFrame, r: Ramp, buckle: Ramp | null) {
  const y = h.ty + h.th - 3;
  for (const [yy, x0, x1] of torsoSpans(h, h.th - 3, h.th - 1)) {
    p.hl(x0, x1, yy, yy === y ? r.base : r.lo);
    p.set(x1, yy, r.deep);
  }
  if (buckle) {
    p.rect(h.cx - 2, y - 1, 4, 4, buckle.base);
    p.rect(h.cx - 1, y, 2, 2, mix(r.lo, OUT, 0.3));
    p.set(h.cx - 2, y - 1, buckle.hi);
  }
}
function boots(p: Pix, h: HFrame, r: Ramp, rows = 6) {
  for (const side of ["l", "r"] as const) {
    const spans = legSpans(h, side).slice(-rows);
    spans.forEach(([y, x0, x1], i) => {
      const toe = i >= rows - 3 ? 2 : 0;
      const a = side === "l" ? x0 - toe : x0;
      const b = side === "r" ? x1 + toe : x1;
      for (let x = a; x <= b; x++) p.set(x, y, i === rows - 1 ? r.deep : i === 0 ? r.hi : side === "r" && x >= b - 1 ? r.lo : r.base);
    });
    // A cuff line.
    const [y0, x0, x1] = spans[0];
    p.hl(x0, x1, y0 + 1, r.lo);
  }
}
function skirt(p: Pix, h: HFrame, r: Ramp, to = h.feet - 2, flare = 7): Span[] {
  const out: Span[] = [];
  for (let y = h.ly, i = 0; y <= to; y++, i++) {
    const w = Math.floor(i / flare);
    out.push([y, h.lx - 2 - w, h.lx + h.lw + 1 + w]);
  }
  fill(p, out, r);
  // Folds: two long creases.
  for (const [y, x0, x1] of out.slice(4)) {
    const third = Math.round((x1 - x0) / 3);
    p.set(x0 + third, y, r.lo);
    p.set(x1 - third, y, r.lo);
  }
  return out;
}
function hem(p: Pix, h: HFrame, r: Ramp, rows = 4) {
  const out: Span[] = [];
  for (let i = 0; i < rows; i++) out.push([h.ly + i, h.lx - 2, h.lx + h.lw + 1]);
  fill(p, out, r);
  p.hl(h.lx - 2, h.lx + h.lw + 1, h.ly + rows - 1, r.lo);
}
function vNeck(p: Pix, h: HFrame, skin: Ramp, depth = 4) {
  for (let i = 0; i < depth; i++) p.hl(h.cx - depth + i, h.cx + depth - 1 - i, h.ty + i, i === 0 ? skin.lo : skin.base);
}
function forearmsSkin(p: Pix, h: HFrame, skin: Ramp, from: number) {
  fill(p, armSpans(h, "l", from), skin);
  fill(p, armSpans(h, "r", from), skin, "shade");
}

const LEATHER = ramp("#5a3a22");
const DARK_LEATHER = ramp("#4a2f1e");
const BOOT_BLACK = ramp("#2a2230");
const GOLD = ramp("#d9a63a");

// ---- outfits ---------------------------------------------------------------------

type Outfit = (p: Pix, h: HFrame, c: Ctx) => void;

export const OUTFITS_HD: Outfit[] = [
  // Tunic
  (p, h, { main, trim, metal, skin }) => {
    legsWear(p, h, trim);
    torso(p, h, main);
    sleeves(p, h, main);
    hem(p, h, main, 5);
    p.set(h.cx - 1, h.ly + 4, main.deep);
    p.set(h.cx, h.ly + 4, main.deep);
    vNeck(p, h, skin, 4);
    // Laces.
    for (let y = h.ty + 4; y < h.ty + 9; y += 2) {
      p.set(h.cx - 2, y, main.deep);
      p.set(h.cx + 1, y, main.deep);
    }
    belt(p, h, LEATHER, metal);
    boots(p, h, LEATHER, 6);
  },
  // Robe
  (p, h, { main, trim }) => {
    torso(p, h, main);
    const sk = skirt(p, h, main);
    // Bell sleeves.
    fill(p, armSpans(h, "l"), main);
    fill(p, armSpans(h, "r"), main, "shade");
    for (let i = 0; i < 4; i++) {
      const y = h.handY - 4 + i;
      p.hl(h.lax - 1 - (i >> 1), h.lax + 5, y, i === 3 ? trim.base : main.base);
      p.hl(h.rax, h.rax + 6 + (i >> 1), y, i === 3 ? trim.lo : main.lo);
    }
    // Trim down the front and round the hem.
    for (let y = h.ty; y <= sk[sk.length - 1][0]; y++) {
      p.hl(h.cx - 2, h.cx - 1, y, trim.base);
      p.hl(h.cx, h.cx + 1, y, trim.lo);
    }
    for (const [y, x0, x1] of sk.slice(-2)) p.hl(x0, x1, y, trim.lo);
    // Rope belt and tassel.
    const by = h.ty + h.th - 3;
    for (let x = h.tx; x < h.tx + h.tw; x++) {
      p.set(x, by, x % 2 ? GOLD.base : GOLD.hi);
      p.set(x, by + 1, GOLD.lo);
    }
    p.vl(h.cx + 4, by + 2, by + 8, GOLD.base);
    p.hl(h.cx + 3, h.cx + 5, by + 9, GOLD.lo);
    p.hl(h.cx - 6, h.cx - 3, h.feet, "#3a2a22");
    p.hl(h.cx + 2, h.cx + 5, h.feet, "#3a2a22");
  },
  // Plate armour
  (p, h, { main, trim, metal }) => {
    legsWear(p, h, metal);
    torso(p, h, metal);
    sleeves(p, h, metal);
    // Plate lines and a ridge.
    for (const [y, x0, x1] of torsoSpans(h, 3, h.th)) if ((y - h.ty) % 6 === 0) p.hl(x0 + 1, x1 - 1, y, metal.lo);
    p.vl(h.cx - 1, h.ty + 2, h.ty + h.th - 4, metal.hi);
    // Tabard with a trimmed edge.
    for (let y = h.ty + 4; y < h.ly + 6; y++) {
      const narrow = y >= h.ly + 3 ? 1 : 0;
      p.hl(h.cx - 4 + narrow, h.cx + 3 - narrow, y, main.base);
      p.set(h.cx - 4 + narrow, y, trim.base);
      p.set(h.cx + 3 - narrow, y, trim.lo);
      p.set(h.cx + 2 - narrow, y, main.lo);
    }
    // Pauldrons.
    for (const side of ["l", "r"] as const) {
      const x = side === "l" ? h.lax - 2 : h.rax - 1;
      p.ell(x + 4.5, h.ty + 3, 5, 4, (_x, y, dx, dy) => (dy < -0.4 ? metal.hi : side === "r" || dx > 0.5 ? metal.lo : metal.base));
      p.hl(x + 1, x + 8, h.ty + 5, metal.lo);
    }
    // Gauntlets and knee cops.
    fill(p, armSpans(h, "l", armLen(h) - 4), ramp(metal.lo));
    fill(p, armSpans(h, "r", armLen(h) - 4), ramp(metal.lo), "shade");
    const k = h.ly + Math.round((h.feet - h.ly) * 0.5);
    for (const side of ["l", "r"] as const) {
      const sp = legSpans(h, side).find(([y]) => y === k);
      if (sp) p.ell((sp[1] + sp[2]) / 2 + 0.5, k + 0.5, 3, 2, side === "l" ? metal.hi : metal.base);
    }
    belt(p, h, DARK_LEATHER, GOLD);
    boots(p, h, ramp(metal.lo), 4);
  },
  // Leather
  (p, h, { main, trim, metal, skin }) => {
    legsWear(p, h, trim);
    torso(p, h, main);
    sleeves(p, h, main, 6);
    forearmsSkin(p, h, skin, 6);
    // Bracers with laces.
    for (const side of ["l", "r"] as const) {
      const sp = armSpans(h, side, armLen(h) - 6);
      fill(p, sp, ramp(main.lo), side === "r" ? "shade" : "cyl");
      for (const [y, x0, x1] of sp) if ((y - h.ay) % 2 === 0) p.set((x0 + x1) >> 1, y, main.hi);
    }
    // Stitching round the edges.
    for (const [y, x0, x1] of torsoSpans(h, 1, h.th - 3)) if (y % 2 === 0) {
      p.set(x0 + 1, y, main.lo);
      p.set(x1 - 1, y, main.deep);
    }
    // A strap across the chest with a buckle.
    for (let i = 0; i < h.th - 2; i++) {
      const x = h.tx + 2 + Math.floor((i * (h.tw - 4)) / (h.th - 2));
      p.set(x, h.ty + i, trim.deep);
      p.set(x + 1, h.ty + i, trim.lo);
    }
    p.rect(h.cx - 1, h.ty + Math.round(h.th / 2) - 2, 3, 3, metal.hi);
    belt(p, h, ramp(trim.deep), metal);
    boots(p, h, DARK_LEATHER, 9);
  },
  // Chainmail
  (p, h, { main, trim, metal }) => {
    legsWear(p, h, trim);
    torso(p, h, metal);
    sleeves(p, h, metal, armLen(h) - 2);
    for (const [y, x0, x1] of [...torsoSpans(h), ...armSpans(h, "l", 0, armLen(h) - 2), ...armSpans(h, "r", 0, armLen(h) - 2)])
      for (let x = x0; x <= x1; x++) {
        const c = p.get(x, y);
        if (c === null) continue;
        if ((x + y) % 2 === 0) p.set(x, y, metal.lo);
        else if (y % 4 === 0) p.set(x, y, metal.hi);
      }
    // Tabard and a short skirt of mail.
    for (let y = h.ty + 2; y < h.ly + 6; y++) {
      p.hl(h.cx - 4, h.cx + 3, y, main.base);
      p.hl(h.cx + 2, h.cx + 3, y, main.lo);
    }
    for (let y = h.ly; y < h.ly + 4; y++) for (let x = h.lx - 1; x <= h.lx + h.lw; x++) if (x < h.cx - 4 || x > h.cx + 3) p.set(x, y, (x + y) % 2 ? metal.base : metal.lo);
    belt(p, h, DARK_LEATHER, metal);
    boots(p, h, DARK_LEATHER, 6);
  },
  // Noble coat
  (p, h, { main, trim, metal }) => {
    legsWear(p, h, ramp(trim.lo));
    torso(p, h, main);
    sleeves(p, h, main);
    // Cuffs with lace.
    for (const side of ["l", "r"] as const) {
      const [y, x0, x1] = armSpans(h, side)[armLen(h) - 1];
      p.hl(x0, x1, y, WHITE);
      p.hl(x0, x1, y - 1, side === "l" ? WHITE : mix(WHITE, OUT, 0.15));
    }
    // Coat tails to mid-thigh.
    for (let i = 0; i < 9; i++) {
      p.hl(h.lx - 2, h.lx + 3, h.ly + i, i === 8 ? main.lo : main.base);
      p.hl(h.lx + h.lw - 4, h.lx + h.lw + 1, h.ly + i, main.lo);
    }
    // Waistcoat, lapels and cravat.
    for (let y = h.ty + 2; y < h.ty + h.th; y++) p.hl(h.cx - 3, h.cx + 2, y, y % 3 ? trim.base : trim.lo);
    for (let i = 0; i < 7; i++) {
      p.set(h.cx - 4 - (i >> 2), h.ty + i, main.hi);
      p.set(h.cx + 3 + (i >> 2), h.ty + i, main.lo);
    }
    p.rect(h.cx - 2, h.ty, 4, 5, WHITE);
    p.hl(h.cx - 1, h.cx, h.ty + 5, mix(WHITE, OUT, 0.15));
    for (let y = h.ty + 7; y < h.ty + h.th - 1; y += 3) p.set(h.cx - 1, y, metal.hi);
    boots(p, h, BOOT_BLACK, 8);
  },
  // Peasant
  (p, h, { main, trim, skin }) => {
    legsWear(p, h, trim);
    for (const side of ["l", "r"] as const) fill(p, legSpans(h, side).slice(-6), skin, side === "r" ? "shade" : "cyl");
    for (const side of ["l", "r"] as const) {
      const [y, x0, x1] = legSpans(h, side).slice(-7)[0];
      p.hl(x0, x1, y, trim.lo);
    }
    torso(p, h, main);
    sleeves(p, h, main, Math.ceil(armLen(h) / 2));
    forearmsSkin(p, h, skin, Math.ceil(armLen(h) / 2));
    // Rolled cuffs, ragged hem, a patch with stitches, a rope belt.
    for (const side of ["l", "r"] as const) {
      const [y, x0, x1] = armSpans(h, side)[Math.ceil(armLen(h) / 2) - 1];
      p.hl(x0, x1, y, main.hi);
    }
    for (let x = h.lx - 2; x <= h.lx + h.lw + 1; x++) {
      p.set(x, h.ly, main.base);
      p.set(x, h.ly + 1, main.lo);
      if (x % 3 === 0) p.set(x, h.ly + 2, main.lo);
    }
    p.rect(h.tx + h.tw - 7, h.ty + 6, 4, 4, trim.hi);
    p.set(h.tx + h.tw - 8, h.ty + 7, main.deep);
    p.set(h.tx + h.tw - 3, h.ty + 8, main.deep);
    for (let x = h.tx; x < h.tx + h.tw; x++) p.set(x, h.ty + h.th - 3, x % 2 ? "#8a6a3f" : "#a8854f");
    vNeck(p, h, skin, 3);
  },
  // Monk
  (p, h, { main, trim, skin }) => {
    legsWear(p, h, main);
    torso(p, h, main);
    sleeves(p, h, main, Math.ceil(armLen(h) / 2) + 2);
    forearmsSkin(p, h, skin, Math.ceil(armLen(h) / 2) + 2);
    vNeck(p, h, skin, 7);
    // The wrap's fold.
    for (let i = 0; i < 12; i++) p.set(h.cx + 4 - i, h.ty + 6 + Math.floor(i * 0.6), main.lo);
    // Sash, knot and tails.
    for (const [y, x0, x1] of torsoSpans(h, h.th - 4, h.th)) p.hl(x0, x1, y, y < h.ty + h.th - 2 ? trim.base : trim.lo);
    p.rect(h.tx + 1, h.ty + h.th - 5, 4, 4, trim.hi);
    p.vl(h.tx + 2, h.ly, h.ly + 7, trim.base);
    p.vl(h.tx + 4, h.ly, h.ly + 5, trim.lo);
    // Tied at the ankles; sandals.
    for (const side of ["l", "r"] as const) {
      const sp = legSpans(h, side);
      const [y, x0, x1] = sp[sp.length - 5];
      p.hl(x0, x1, y, trim.lo);
      fill(p, sp.slice(-4), skin, side === "r" ? "shade" : "cyl");
      const [fy, fx0, fx1] = sp[sp.length - 1];
      p.hl(fx0 - (side === "l" ? 1 : 0), fx1 + (side === "r" ? 1 : 0), fy, "#6b4a2a");
      p.set((fx0 + fx1) >> 1, fy - 1, "#6b4a2a");
    }
  },
  // Vestments
  (p, h, { main, trim, metal }) => {
    const robe = ramp(WHITE);
    torso(p, h, robe);
    const sk = skirt(p, h, robe, h.feet - 2, 9);
    sleeves(p, h, robe);
    // A long stole with a holy mark.
    for (let y = h.ty; y <= sk[sk.length - 1][0]; y++) {
      p.hl(h.cx - 4, h.cx - 1, y, main.base);
      p.hl(h.cx, h.cx + 3, y, main.lo);
      p.set(h.cx - 4, y, trim.base);
      p.set(h.cx + 3, y, trim.lo);
    }
    p.vl(h.cx - 1, h.ty + 6, h.ty + 13, metal.hi);
    p.vl(h.cx, h.ty + 6, h.ty + 13, metal.base);
    p.hl(h.cx - 3, h.cx + 2, h.ty + 8, metal.hi);
    for (const [y, x0, x1] of sk.slice(-2)) p.hl(x0, x1, y, trim.base);
    p.hl(h.cx - 6, h.cx - 3, h.feet, "#3a2a22");
    p.hl(h.cx + 2, h.cx + 5, h.feet, "#3a2a22");
  },
  // Hunter
  (p, h, { main, trim, metal }) => {
    legsWear(p, h, trim);
    torso(p, h, main);
    sleeves(p, h, main);
    // Fur collar.
    const fur = ramp("#cbb38a");
    for (let x = h.tx - 2; x <= h.tx + h.tw + 1; x++)
      for (let y = h.ty - 1; y < h.ty + 4; y++) {
        const t = (x * 7 + y * 3) % 4;
        if (y === h.ty - 1 && (x < h.tx + 2 || x > h.tx + h.tw - 3)) continue;
        p.set(x, y, t === 0 ? fur.hi : t === 1 ? fur.lo : fur.base);
      }
    // Quiver strap, pouch.
    for (let i = 0; i < h.th; i++) {
      const x = h.tx + h.tw - 3 - Math.floor((i * (h.tw - 5)) / h.th);
      p.set(x, h.ty + i, "#4a2f1e");
      p.set(x - 1, h.ty + i, "#5e3c26");
    }
    belt(p, h, DARK_LEATHER, metal);
    p.rect(h.tx, h.ty + h.th - 2, 5, 5, "#6b4a2a");
    p.hl(h.tx, h.tx + 4, h.ty + h.th - 2, "#8a6a3f");
    boots(p, h, DARK_LEATHER, 10);
  },
  // Swashbuckler
  (p, h, { main, trim, skin }) => {
    legsWear(p, h, ramp("#2e2a36"));
    const shirt = ramp(WHITE);
    torso(p, h, shirt);
    // Puffy sleeves, gathered at the wrist.
    fill(p, armSpans(h, "l"), shirt);
    fill(p, armSpans(h, "r"), shirt, "shade");
    for (const side of ["l", "r"] as const) {
      const sp = armSpans(h, side);
      for (const [y, x0, x1] of sp.slice(2, -3)) {
        p.set(side === "l" ? x0 - 1 : x1 + 1, y, side === "l" ? shirt.hi : shirt.lo);
      }
      const [y, x0, x1] = sp[sp.length - 1];
      p.hl(x0, x1, y, shirt.lo);
    }
    vNeck(p, h, skin, 6);
    // Short vest.
    for (const [y, x0, x1] of torsoSpans(h, 0, h.th - 2)) {
      p.hl(x0, x0 + 4, y, main.base);
      p.set(x0, y, main.hi);
      p.hl(x1 - 4, x1, y, main.lo);
      p.set(x1, y, main.deep);
    }
    // Sash with a hanging end.
    for (const [y, x0, x1] of torsoSpans(h, h.th - 3, h.th)) p.hl(x0, x1, y, y === h.ty + h.th - 1 ? trim.lo : trim.base);
    p.rect(h.tx + h.tw - 4, h.ly, 3, 6, trim.lo);
    p.hl(h.tx + h.tw - 4, h.tx + h.tw - 2, h.ly + 6, trim.base);
    // Tall cuffed boots.
    boots(p, h, BOOT_BLACK, 11);
    for (const side of ["l", "r"] as const) {
      const [y, x0, x1] = legSpans(h, side).slice(-11)[0];
      p.hl(x0 - 1, x1 + 1, y, "#4a3f58");
      p.hl(x0 - 1, x1 + 1, y + 1, "#3a3048");
    }
  },
  // Samurai armour: laced plates in the main colour, cords in the second colour.
  (p, h, { main, trim, metal }) => {
    const cloth = ramp("#2c2a3c");
    const len = h.feet - h.ly;
    /** A row of lacing: cords alternating with the gaps between plates. */
    const lace = (x0: number, x1: number, y: number) => {
      for (let x = x0; x <= x1; x++) p.set(x, y, (x - x0) % 3 === 1 ? trim.base : main.deep);
    };
    // Wide trousers gathered into shin guards; split-toe socks and sandals.
    legsWear(p, h, cloth);
    const shin = Math.max(5, Math.round(len * 0.32));
    for (const side of ["l", "r"] as const) {
      const sp = legSpans(h, side);
      for (const [y, x0, x1] of sp.slice(3, -shin)) p.set(side === "l" ? x0 - 1 : x1 + 1, y, side === "l" ? cloth.base : cloth.deep);
      const guard = sp.slice(-shin, -2);
      fill(p, guard, metal, side === "r" ? "shade" : "cyl");
      guard.forEach(([y, x0, x1], i) => {
        p.set((x0 + x1) >> 1, y, side === "l" ? metal.hi : metal.base);
        if (i % 3 === 1) p.hl(x0, x1, y, side === "l" ? trim.base : trim.lo);
      });
      sp.slice(-2).forEach(([y, x0, x1], i) => {
        p.hl(side === "l" ? x0 - 2 : x0, side === "r" ? x1 + 2 : x1, y, i ? "#2a1f1a" : side === "l" ? WHITE : mix(WHITE, OUT, 0.18));
      });
    }
    // The cuirass: bands of plates with a row of lacing between them.
    fill(p, torsoSpans(h), main);
    for (const [y, x0, x1] of torsoSpans(h, 3, h.th - 4)) {
      const band = (y - h.ty - 3) % 4;
      if (band === 3) lace(x0 + 1, x1 - 1, y);
      else if (band === 0) p.hl(x0 + 1, x1 - 2, y, main.hi);
    }
    // Collar and a gold crest on the chest.
    p.hl(h.cx - 4, h.cx + 3, h.ty, trim.base);
    p.hl(h.cx - 3, h.cx + 2, h.ty + 1, trim.lo);
    p.hl(h.cx - 1, h.cx, h.ty + 2, trim.lo);
    p.rect(h.cx - 2, h.ty + 4, 4, 2, GOLD.base);
    p.hl(h.cx - 1, h.cx, h.ty + 3, GOLD.hi);
    p.hl(h.cx - 1, h.cx, h.ty + 6, GOLD.lo);
    // Cloth sleeves with splinted forearm guards.
    sleeves(p, h, cloth);
    for (const side of ["l", "r"] as const) {
      const sp = armSpans(h, side, armLen(h) - Math.min(7, armLen(h) - 6));
      fill(p, sp, metal, side === "r" ? "shade" : "cyl");
      for (const [y, x0, x1] of sp) p.set((x0 + x1 + 1) >> 1, y, side === "l" ? metal.hi : metal.lo);
      const [y, x0, x1] = sp[0];
      p.hl(x0, x1, y, side === "l" ? trim.base : trim.lo);
    }
    // Big square shoulder guards hanging over the upper arms.
    const sodeRows = Math.min(13, armLen(h) - 5);
    for (const side of ["l", "r"] as const) {
      const x0 = side === "l" ? h.lax - 2 : h.rax - 1;
      const x1 = x0 + 8;
      for (let i = 0; i < sodeRows; i++) {
        const y = h.ty - 1 + i;
        if (i === 0) p.hl(x0 + 1, x1 - 1, y, metal.hi);
        else if (i % 4 === 0) lace(x0, x1, y);
        else {
          p.hl(x0, x1, y, side === "l" ? main.base : main.lo);
          p.set(x0, y, side === "l" ? main.hi : main.base);
          p.set(x1, y, main.deep);
        }
      }
      p.hl(x0, x1, h.ty - 1 + sodeRows, main.deep);
    }
    // A skirt of four hanging plate panels.
    const drop = Math.max(6, Math.round(len * 0.42));
    const sx = h.lx - 3;
    const sw = h.lw + 6;
    for (let i = 0; i < drop; i++)
      for (let x = sx; x < sx + sw; x++) {
        const rel = x - sx;
        const gap = i > 0 && [1, 2, 3].some((k) => rel === Math.round((k * sw) / 4));
        const edge = [0, 1, 2, 3].some((k) => rel === Math.round((k * sw) / 4) + (k ? 1 : 0));
        let col = x < h.cx ? main.base : main.lo;
        if (gap) col = cloth.deep;
        else if (i === drop - 1) col = main.deep;
        else if (i % 4 === 2) col = rel % 3 === 1 ? trim.base : main.deep;
        else if (edge) col = x < h.cx ? main.hi : main.base;
        p.set(x, h.ly + i, col);
      }
    // Sash with a knot and two tails.
    for (const [y, x0, x1] of torsoSpans(h, h.th - 4, h.th)) p.hl(x0, x1, y, y >= h.ty + h.th - 2 ? trim.lo : trim.base);
    p.rect(h.cx - 2, h.ty + h.th - 5, 4, 5, trim.hi);
    p.hl(h.cx - 2, h.cx + 1, h.ty + h.th - 1, trim.base);
    p.vl(h.cx - 2, h.ty + h.th, h.ty + h.th + 3, trim.base);
    p.vl(h.cx + 1, h.ty + h.th, h.ty + h.th + 2, trim.lo);
  },
];


/** A thick spellbook held against the hip, drawn at full size. */
export function bookHd(p: Pix, h: HFrame, c: Ctx) {
  const W = 17;
  const H = 20;
  const x0 = h.lax - 1;
  const y0 = h.handY - 8;
  const cov = c.trim;
  const page = "#efe6cc";
  const pageLo = "#c4b48e";
  // Back cover peeking out under the pages.
  p.hl(x0, x0 + W, y0 + H, cov.deep);
  p.vl(x0 + W, y0 + 2, y0 + H, cov.deep);
  // Pages: the right side and the bottom, with leaf lines.
  for (let y = y0 + 1; y < y0 + H; y++) for (let x = x0 + W - 3; x < x0 + W; x++) p.set(x, y, x === x0 + W - 2 ? pageLo : page);
  for (let x = x0 + 2; x < x0 + W; x++) {
    p.set(x, y0 + H - 2, page);
    p.set(x, y0 + H - 1, pageLo);
  }
  // The front cover.
  for (let y = y0; y < y0 + H - 2; y++)
    for (let x = x0; x < x0 + W - 3; x++) p.set(x, y, y === y0 ? cov.hi : x === x0 + W - 4 || y === y0 + H - 3 ? cov.lo : cov.base);
  // Spine with raised gold bands.
  for (let y = y0; y <= y0 + H; y++) {
    p.set(x0, y, cov.deep);
    p.set(x0 + 1, y, cov.lo);
    p.set(x0 + 2, y, cov.deep);
  }
  for (const by of [y0 + 3, y0 + H - 5]) {
    p.hl(x0, x0 + 2, by, GOLD.hi);
    p.hl(x0, x0 + 2, by + 1, GOLD.lo);
  }
  // Gold corner caps.
  const ex = x0 + W - 4;
  for (const [cy, dy] of [[y0, 1], [y0 + H - 3, -1]] as const) for (let i = 0; i < 3; i++) p.hl(ex - 2 + i, ex, cy + i * dy, i === 0 ? GOLD.hi : GOLD.base);
  // A tooled frame and a glowing sigil.
  const fx0 = x0 + 4;
  const fx1 = x0 + W - 6;
  const fy0 = y0 + 3;
  const fy1 = y0 + H - 6;
  p.hl(fx0, fx1, fy0, GOLD.lo);
  p.hl(fx0, fx1, fy1, GOLD.lo);
  p.vl(fx0, fy0, fy1, GOLD.lo);
  p.vl(fx1, fy0, fy1, GOLD.lo);
  const mx = (fx0 + fx1) >> 1;
  const my = (fy0 + fy1) >> 1;
  for (let i = -3; i <= 3; i++) {
    const w = 3 - Math.abs(i);
    p.hl(mx - w, mx + w, my + i, i < 0 ? GOLD.hi : GOLD.base);
  }
  p.set(mx, my, "#bff4ff");
  p.set(mx, my - 1, "#7fe0ff");
  p.set(mx - 1, my, "#7fe0ff");
  p.set(mx + 1, my, "#4ab4e0");
  p.set(mx, my + 1, "#4ab4e0");
  // The clasp over the page edge.
  const cy = y0 + (H >> 1) - 2;
  p.rect(x0 + W - 5, cy, 6, 3, c.metal.base);
  p.hl(x0 + W - 5, x0 + W, cy, c.metal.hi);
  p.set(x0 + W - 4, cy + 1, c.metal.lo);
}
