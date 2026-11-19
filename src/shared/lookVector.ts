// Draws a Look (look.ts) as a vector picture (SVG), in one of the drawn styles:
// Storybook (inked lines over a watercolour wash), Painted (soft light, no
// outlines) or Cartoon (thick outline, big head, cel shadow, sticker edge).
// The same recipe as the pixel art, so any character swaps style freely. All
// the art is drawn here in code; it needs no image files.

import { type Look, type LookColorKey, type LookPartKey, LOOK_DEFAULTS, SWATCHES } from "./look";

export type VectorStyle = "ink" | "paint" | "cel";

/** The picture's size: the same 6:7 shape as the pixel art (48×56). */
export const VEC_W = 200;
export const VEC_H = (VEC_W * 7) / 6;

const PAPER = "#f4ead6";

// ---- colour ------------------------------------------------------------------

const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
function rgb(h: string): [number, number, number] {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const hex = (r: number, g: number, b: number) => "#" + [r, g, b].map((v) => clamp(v).toString(16).padStart(2, "0")).join("");
export function mixHex(a: string, b: string, t: number): string {
  const A = rgb(a);
  const B = rgb(b);
  return hex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t);
}
const lt = (c: string, t: number) => mixHex(c, "#fff4e0", t);
const dk = (c: string, t: number) => mixHex(c, "#1a0f24", t);

interface StyleDef {
  headS: number;
  sy: number;
  /** Outline width; 0 = no ink line. */
  ow: number;
  line: string;
  flat: boolean;
}

const STYLES: Record<VectorStyle, StyleDef> = {
  ink: { headS: 1.0, sy: 1.0, ow: 2.1, line: "#2e1f1a", flat: true },
  paint: { headS: 0.95, sy: 1.02, ow: 0, line: "", flat: false },
  cel: { headS: 1.5, sy: 0.74, ow: 3.2, line: "#1d1426", flat: true },
};

const WOOD = "#7a4b2b";
const GOLD = "#e0b23f";
const BONE = "#d9cdb4";
const f1 = (n: number) => (Math.round(n * 100) / 100).toString();

/** The whole picture as an SVG document. face: a square of the head and shoulders. */
export function lookSvg(look: Look, style: VectorStyle, face = false): string {
  const st = STYLES[style];
  const v = (k: LookPartKey | LookColorKey) => look[k] ?? LOOK_DEFAULTS[k];
  const col = (k: LookColorKey) => (SWATCHES[k][v(k)] ?? SWATCHES[k][0]).hex;
  const skin = col("skin");
  const hairC = col("hairColor");
  const main = col("main");
  const trim = col("trim");
  const cloakC = col("cloakColor");
  const hatC = col("hatColor");
  const metal = col("metal");
  const eyeC = col("eye");
  const sky = col("sky");
  const petC = col("petColor");
  const cel = style === "cel";
  const ink = style === "ink";
  const paint = style === "paint";

  const grads = new Map<string, string>();
  const fill = (c: string) => {
    if (st.flat) return c;
    const id = "g" + c.slice(1);
    grads.set(id, c);
    return `url(#${id})`;
  };
  /** A filled shape, outlined the style's way. w scales the outline. */
  const S = (d: string, c: string, extra = "", w = 1) => {
    const stroke = st.ow ? `stroke="${st.line}" stroke-width="${f1(st.ow * w)}"` : `stroke="${dk(c, 0.35)}" stroke-width="0.6" stroke-opacity="0.6"`;
    return `<path d="${d}" fill="${fill(c)}" ${stroke} stroke-linejoin="round" vector-effect="non-scaling-stroke" ${extra}/>`;
  };
  const ell = (cx: number, cy: number, rx: number, ry: number) => `M ${f1(cx - rx)} ${f1(cy)} a ${f1(rx)} ${f1(ry)} 0 1 0 ${f1(2 * rx)} 0 a ${f1(rx)} ${f1(ry)} 0 1 0 ${f1(-2 * rx)} 0 Z`;
  const E = (cx: number, cy: number, rx: number, ry: number, c: string, extra = "", w = 1) => S(ell(cx, cy, rx, ry), c, extra, w);
  /** A stroked tube (arms, handles, tails) with its own outline. */
  const T = (d: string, w: number, c: string) => {
    let s = "";
    if (st.ow) s += `<path d="${d}" fill="none" stroke="${st.line}" stroke-width="${f1(w + st.ow * 2)}" stroke-linecap="round" stroke-linejoin="round"/>`;
    s += `<path d="${d}" fill="none" stroke="${c}" stroke-width="${f1(w)}" stroke-linecap="round" stroke-linejoin="round"/>`;
    if (paint) s += `<path d="${d}" fill="none" stroke="${lt(c, 0.35)}" stroke-opacity="0.45" stroke-width="${f1(w * 0.28)}" stroke-linecap="round" transform="translate(${f1(-w * 0.22)} ${f1(-w * 0.1)})"/>`;
    return s;
  };
  /** A plain line (no outline): faces, details. */
  const L = (d: string, c: string, w: number, extra = "") => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${f1(w)}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
  /** A soft glow (light sources). */
  const glow = (cx: number, cy: number, r: number, c: string, o = 0.45) => `<circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(r)}" fill="${c}" opacity="${o}" filter="url(#glow)"/>`;
  /** A highlight only the painted style shows. */
  const shine = (d: string, o = 0.35) => (paint ? `<path d="${d}" fill="#fff" opacity="${o}"/>` : cel ? `<path d="${d}" fill="#fff" opacity="${o * 0.8}"/>` : "");
  const lineC = st.ow ? st.line : "#2a1c24";

  // ---- proportions ----
  const build = v("body");
  const SWb = [22, 27, 21, 19, 27][build] ?? 22;
  const WW = [16, 19, 15, 14, 23][build] ?? 16;
  const sy = st.sy * ([1, 1, 1.06, 0.88, 0.86][build] ?? 1);
  const headS = st.headS * ([1, 1, 0.94, 1.02, 1.04][build] ?? 1);
  const feet = 204;
  const neckY = feet - 124 * sy;
  const headY = neckY - 21 * headS;
  const sx = sy > 0.9 ? 1 : 0.92 + (sy - 0.74) * 0.3;
  const bodyT = `translate(100 ${f1(neckY)}) scale(${f1(sx)} ${f1(sy)})`;
  const headT = `translate(100 ${f1(headY)}) scale(${f1(headS)})`;
  const RH: [number, number] = [-SWb - 5, 64];
  const LH: [number, number] = [SWb + 5, 64];

  const bg = backdrop();
  const plat = platform();
  const shadow = `<ellipse cx="100" cy="205" rx="34" ry="6" fill="#1a0f24" opacity="${st.flat ? 0.28 : 0.4}" ${st.flat ? "" : `filter="url(#blur)"`}/>`;

  // ---- back layer ----
  let backB = wings() + cloakBack() + tail();
  let backH = hairBack() + hoodBack();

  // ---- body ----
  const out = v("outfit");
  let body = legs(out);
  body += S(`M -5 -8 L 5 -8 L 6 8 L -6 8 Z`, dk(skin, 0.12));
  body += outfit(out);
  body += cloakFront();

  // ---- head ----
  let head = earsBehind();
  const faceD = cel ? `M -19 -2 Q -19 -22 0 -22 Q 19 -22 19 -2 Q 19 18 0 20 Q -19 18 -19 -2 Z` : `M -17 -4 Q -17 -22 0 -22 Q 17 -22 17 -4 Q 17 10 9 17 Q 4 21 0 21 Q -4 21 -9 17 Q -17 10 -17 -4 Z`;
  head += S(faceD, skin);
  if (paint) head += `<ellipse cx="0" cy="14" rx="9" ry="5" fill="${dk(skin, 0.3)}" opacity="0.18"/>`;
  const my = cel ? 12 : 14;
  head += marksUnder();
  head += eyes();
  head += nose();
  head += mouth(my);
  head += marksOver(my);
  head += beard(my);
  head += hairFront();
  head += earsTop();
  head += horns();
  head += hat();

  // ---- hands and gear ----
  const front = handItem() + E(RH[0], RH[1], 5.5, 5.5, skin) + offhand();

  const petG = pet();

  // ---- defs ----
  let defs = "";
  for (const [id, c] of grads) defs += `<linearGradient id="${id}" x1="0" y1="0" x2="0.8" y2="1"><stop offset="0" stop-color="${lt(c, 0.28)}"/><stop offset="0.45" stop-color="${c}"/><stop offset="1" stop-color="${dk(c, 0.45)}"/></linearGradient>`;
  defs += `<filter id="white"><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1 0"/></filter>`;
  defs += `<filter id="glow" x="-1" y="-1" width="3" height="3"><feGaussianBlur stdDeviation="2.2"/></filter>`;
  defs += `<filter id="blur" x="-0.5" y="-0.5" width="2" height="2"><feGaussianBlur stdDeviation="3"/></filter>`;
  defs += `<filter id="soft"><feGaussianBlur stdDeviation="0.8"/></filter>`;
  defs += `<filter id="paper"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="4"/><feColorMatrix type="saturate" values="0"/></filter>`;
  defs += `<filter id="bleed"><feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="3" seed="7"/><feDisplacementMap in="SourceGraphic" scale="16"/><feGaussianBlur stdDeviation="1.2"/></filter>`;
  defs += `<filter id="wash" x="-0.1" y="-0.1" width="1.2" height="1.2"><feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="2" seed="3"/><feDisplacementMap in="SourceGraphic" scale="1.8"/></filter>`;
  defs += `<filter id="bgwash"><feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="5"/><feDisplacementMap in="SourceGraphic" scale="4"/></filter>`;
  defs += `<filter id="canvas"><feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="2" seed="9" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0.1  0 0 0 0 0.05  0 0 0 0 0.15  0 0 0 0.10 0" result="a"/><feComposite in="a" in2="SourceAlpha" operator="in" result="t"/><feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="t"/></feMerge></filter>`;
  defs += `<filter id="stk" x="-0.2" y="-0.2" width="1.4" height="1.4"><feMorphology in="SourceAlpha" operator="dilate" radius="4.5" result="d"/><feFlood flood-color="#fffaf0"/><feComposite in2="d" operator="in"/></filter>`;
  defs += `<radialGradient id="sky" cx="0.4" cy="0.35" r="0.8"><stop offset="0" stop-color="${lt(sky, 0.35)}"/><stop offset="0.55" stop-color="${sky}"/><stop offset="1" stop-color="${dk(sky, 0.55)}"/></radialGradient>`;
  defs += `<radialGradient id="vig" cx="0.5" cy="0.45" r="0.7"><stop offset="0.6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.45"/></radialGradient>`;
  if (cel) defs += `<linearGradient id="light" x1="0" y1="0" x2="1" y2="0.35"><stop offset="0.6" stop-color="#2a1640" stop-opacity="0"/><stop offset="0.6" stop-color="#2a1640" stop-opacity="0.26"/></linearGradient>`;
  else if (ink) defs += `<linearGradient id="light" x1="0" y1="0" x2="1" y2="0.4"><stop offset="0.3" stop-color="#5a2d50" stop-opacity="0"/><stop offset="1" stop-color="#5a2d50" stop-opacity="0.3"/></linearGradient>`;
  else defs += `<linearGradient id="light" x1="0" y1="0" x2="1" y2="0.6"><stop offset="0" stop-color="#ffe2a8" stop-opacity="0.16"/><stop offset="0.4" stop-color="#ffe2a8" stop-opacity="0"/><stop offset="1" stop-color="#120826" stop-opacity="0.55"/></linearGradient>`;
  defs += gradDefs();

  const fig = `<g id="fig"><g transform="${bodyT}">${backB}</g><g transform="${headT}">${backH}</g><g transform="${bodyT}">${body}</g><g transform="${headT}">${head}</g><g transform="${bodyT}">${front}</g>${petG}</g>`;
  defs += fig;
  defs += `<mask id="m" maskUnits="userSpaceOnUse" x="0" y="0" width="${VEC_W}" height="${f1(VEC_H)}"><use href="#fig" filter="url(#white)"/></mask>`;

  let figure = "";
  if (cel) figure += `<use href="#fig" filter="url(#stk)"/>`;
  const figFilter = ink ? `filter="url(#wash)"` : paint ? `filter="url(#canvas)"` : "";
  figure += `<g ${figFilter}><use href="#fig"/><rect width="${VEC_W}" height="${f1(VEC_H)}" fill="url(#light)" mask="url(#m)"/></g>`;

  let vb = `0 0 ${VEC_W} ${f1(VEC_H)}`;
  if (face) {
    const r = 30 * headS + (cel ? 3 : 7);
    const cy = headY + 6 * headS;
    vb = `${f1(100 - r)} ${f1(cy - r)} ${f1(2 * r)} ${f1(2 * r)}`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="${face ? 256 : VEC_W * 2}" height="${face ? 256 : f1(VEC_H * 2)}"><defs>${defs}</defs>${bg}${plat}${shadow}${figure}</svg>`;

  // ============================================================================
  // parts
  // ============================================================================

  function gradDefs(): string {
    return (
      `<linearGradient id="skyFade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>` +
      `<radialGradient id="warm" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#ffd27a" stop-opacity="0.9"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient>`
    );
  }

  /** A sky band from top colour to bottom colour, the style's way. */
  function skyBand(top: string, bottom: string, y0 = 0, y1 = VEC_H): string {
    const id = "sb" + top.slice(1) + bottom.slice(1);
    if (cel) {
      const h = y1 - y0;
      return `<rect x="0" y="${f1(y0)}" width="${VEC_W}" height="${f1(h)}" fill="${bottom}"/><rect x="0" y="${f1(y0)}" width="${VEC_W}" height="${f1(h * 0.55)}" fill="${mixHex(top, bottom, 0.4)}"/><rect x="0" y="${f1(y0)}" width="${VEC_W}" height="${f1(h * 0.28)}" fill="${top}"/>`;
    }
    return `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient><rect x="0" y="${f1(y0)}" width="${VEC_W}" height="${f1(y1 - y0)}" fill="url(#${id})"/>`;
  }

  function backdrop(): string {
    const b = v("background");
    if (!b) return "";
    if (b === 1) {
      if (ink) return `<rect width="${VEC_W}" height="${f1(VEC_H)}" fill="${PAPER}"/><rect width="${VEC_W}" height="${f1(VEC_H)}" fill="#000" filter="url(#paper)" opacity="0.10"/><g filter="url(#bleed)"><circle cx="100" cy="118" r="86" fill="${mixHex(sky, PAPER, 0.45)}"/><circle cx="92" cy="104" r="58" fill="${mixHex(sky, PAPER, 0.25)}" opacity="0.7"/></g>`;
      if (paint) return `<rect width="${VEC_W}" height="${f1(VEC_H)}" fill="url(#sky)"/><rect width="${VEC_W}" height="${f1(VEC_H)}" fill="url(#vig)"/><rect width="${VEC_W}" height="${f1(VEC_H)}" fill="#fff" filter="url(#paper)" opacity="0.07"/>`;
      let s = `<rect width="${VEC_W}" height="${f1(VEC_H)}" fill="${dk(sky, 0.25)}"/><circle cx="100" cy="116" r="88" fill="${sky}" stroke="${st.line}" stroke-width="3"/><circle cx="100" cy="116" r="74" fill="${lt(sky, 0.12)}"/>`;
      for (const [x, y, r] of [
        [38, 52, 4],
        [160, 70, 3],
        [150, 40, 5],
        [44, 150, 3],
        [168, 150, 4],
      ])
        s += sparkle(x, y, r, "#fff6d8");
      return s;
    }
    const scene = scenes()[b]?.() ?? "";
    if (ink) return `<rect width="${VEC_W}" height="${f1(VEC_H)}" fill="${PAPER}"/><g filter="url(#bgwash)" opacity="0.62">${scene}</g><rect width="${VEC_W}" height="${f1(VEC_H)}" fill="#000" filter="url(#paper)" opacity="0.10"/>`;
    if (paint) return `<g filter="url(#soft)">${scene}</g><rect width="${VEC_W}" height="${f1(VEC_H)}" fill="url(#vig)"/><rect width="${VEC_W}" height="${f1(VEC_H)}" fill="#fff" filter="url(#paper)" opacity="0.06"/>`;
    return scene;
  }

  function sparkle(x: number, y: number, r: number, c: string): string {
    return `<path d="M ${x} ${y - r * 2} Q ${x} ${y} ${x + r * 2} ${y} Q ${x} ${y} ${x} ${y + r * 2} Q ${x} ${y} ${x - r * 2} ${y} Q ${x} ${y} ${x} ${y - r * 2} Z" fill="${c}"/>`;
  }

  /** Background scene shapes take a thin outline in the cartoon style. */
  function B(d: string, c: string, extra = "") {
    if (cel) return `<path d="${d}" fill="${c}" stroke="${st.line}" stroke-width="1.6" stroke-linejoin="round" ${extra}/>`;
    return `<path d="${d}" fill="${c}" ${extra}/>`;
  }

  function hills(y: number, amp: number, c: string, seed = 0): string {
    let d = `M 0 ${y}`;
    for (let x = 0; x <= VEC_W; x += 25) d += ` Q ${x + 12.5} ${y - amp * (((x / 25 + seed) % 3) - 0.6)} ${x + 25} ${y}`;
    return B(`${d} L ${VEC_W} ${f1(VEC_H)} L 0 ${f1(VEC_H)} Z`, c);
  }

  function pine(x: number, y: number, h: number, c: string): string {
    const w = h * 0.42;
    return B(`M ${x} ${y - h} L ${x + w * 0.6} ${y - h * 0.55} L ${x + w * 0.35} ${y - h * 0.55} L ${x + w} ${y} L ${x - w} ${y} L ${x - w * 0.35} ${y - h * 0.55} L ${x - w * 0.6} ${y - h * 0.55} Z`, c);
  }

  // ---- background scenes, by Backdrop option ----
  function scenes(): Record<number, () => string> {
    return {
    // Forest
    2: () =>
      skyBand("#cfe6c4", "#8fbf86") +
      [20, 58, 96, 140, 178].map((x, i) => pine(x, 150, 70 + (i % 2) * 22, "#4f7f52")).join("") +
      [0, 40, 84, 126, 168, 205].map((x, i) => pine(x, 168, 90 + (i % 3) * 14, "#2f5a3a")).join("") +
      hills(178, 6, "#5f9a4a", 1),
    // Tavern
    3: () =>
      `<rect width="${VEC_W}" height="${f1(VEC_H)}" fill="#7a4e30"/>` +
      [0, 1, 2, 3, 4, 5, 6, 7].map((i) => L(`M 0 ${i * 22 + 8} L ${VEC_W} ${i * 22 + 8}`, "#5a3520", 1.4)).join("") +
      B(`M 132 36 L 182 36 L 182 96 L 132 96 Z`, "#3a2416") +
      `<rect x="136" y="40" width="42" height="52" fill="#ffd27a"/>` +
      L(`M 157 40 L 157 92 M 136 66 L 178 66`, "#3a2416", 3) +
      `<circle cx="157" cy="66" r="46" fill="url(#warm)" opacity="0.45"/>` +
      B(`M 12 70 L 82 70 L 82 76 L 12 76 Z`, "#4a2c18") +
      [18, 30, 42, 56, 70].map((x, i) => B(`M ${x} 70 L ${x} 56 Q ${x + 4} ${50 - (i % 2) * 4} ${x + 8} 56 L ${x + 8} 70 Z`, ["#3f8f4a", "#b8343b", "#d4a83a", "#3a56b0", "#6c3fa0"][i])).join("") +
      B(`M 0 178 L ${VEC_W} 178 L ${VEC_W} ${f1(VEC_H)} L 0 ${f1(VEC_H)} Z`, "#5a3520"),
    // Dungeon
    4: () => {
      let s = `<rect width="${VEC_W}" height="${f1(VEC_H)}" fill="#4a4652"/>`;
      for (let r = 0; r < 9; r++) for (let c = -1; c < 6; c++) s += B(`M ${c * 40 + (r % 2) * 20 + 2} ${r * 22 + 2} h 36 v 18 h -36 Z`, ["#5a5662", "#55515d", "#615c69"][(r + c + 9) % 3]);
      s += B(`M 0 182 L ${VEC_W} 182 L ${VEC_W} ${f1(VEC_H)} L 0 ${f1(VEC_H)} Z`, "#36333c");
      for (const x of [30, 170]) s += glow(x, 70, 26, "#ffb24a", 0.5) + B(`M ${x - 3} 76 L ${x + 3} 76 L ${x + 2} 92 L ${x - 2} 92 Z`, WOOD) + B(`M ${x} 58 Q ${x + 7} 68 ${x + 4} 74 Q ${x} 78 ${x - 4} 74 Q ${x - 7} 68 ${x} 58 Z`, "#ffb24a");
      return s;
    },
    // Night sky
    5: () => {
      let s = skyBand("#141a3a", "#3a3f78");
      for (let i = 0; i < 24; i++) {
        const x = (i * 53) % 197;
        const y = (i * 37) % 140;
        s += `<circle cx="${x}" cy="${y + 4}" r="${i % 4 ? 0.9 : 1.6}" fill="#fff6d8" opacity="${0.6 + (i % 3) * 0.15}"/>`;
      }
      s += `<circle cx="150" cy="44" r="16" fill="#fff2c4"/><circle cx="158" cy="38" r="14" fill="#141a3a"/>`;
      return s + hills(176, 10, "#1e2348", 2);
    },
    // Sunset
    6: () => skyBand("#6a3f8a", "#f29a5a", 0, 170) + `<circle cx="100" cy="168" r="34" fill="#ffd27a"/>` + hills(170, 8, "#5a2f4a", 0) + hills(190, 6, "#3a1f36", 1),
    // Castle
    7: () =>
      skyBand("#8fc4ec", "#d8ecf6") +
      B(`M 40 160 L 40 92 L 52 92 L 52 82 L 60 82 L 60 92 L 74 92 L 74 70 L 86 70 L 86 60 L 114 60 L 114 70 L 126 70 L 126 92 L 140 92 L 140 82 L 148 82 L 148 92 L 160 92 L 160 160 Z`, "#9a9aa8") +
      B(`M 92 160 L 92 120 Q 100 110 108 120 L 108 160 Z`, "#4a3a3a") +
      B(`M 100 60 L 100 40 L 116 46 L 100 52`, "#c8343b") +
      hills(162, 4, "#6aa244", 0),
    // Seaside
    8: () =>
      skyBand("#9fd0ee", "#e6f2f6", 0, 130) +
      B(`M 0 128 L ${VEC_W} 128 L ${VEC_W} 172 L 0 172 Z`, "#3f86b8") +
      [140, 152, 164].map((y) => L(`M 10 ${y} q 10 -4 20 0 t 20 0 M 110 ${y + 4} q 10 -4 20 0 t 20 0`, "#cfe8f4", 1.4)).join("") +
      B(`M 0 170 Q 100 160 ${VEC_W} 172 L ${VEC_W} ${f1(VEC_H)} L 0 ${f1(VEC_H)} Z`, "#e8d29a") +
      `<circle cx="40" cy="36" r="14" fill="#fff2c4"/>`,
    // Snowfield
    9: () => {
      let s = skyBand("#c8d8e8", "#eef4f8") + [24, 70, 150, 184].map((x, i) => pine(x, 150, 60 + (i % 2) * 18, "#3f6a5a")).join("") + hills(160, 8, "#f6f8fb", 0) + hills(184, 6, "#e4ecf4", 2);
      for (let i = 0; i < 26; i++) s += `<circle cx="${(i * 47) % 199}" cy="${(i * 29) % 200}" r="1.4" fill="#fff"/>`;
      return s;
    },
    // Desert
    10: () =>
      skyBand("#f6c47a", "#fbe6b8", 0, 160) +
      `<circle cx="150" cy="50" r="18" fill="#fff2c4"/>` +
      hills(160, 10, "#e0b46a", 0) +
      hills(184, 8, "#d09a52", 1) +
      B(`M 40 182 L 40 140 Q 40 134 46 134 Q 52 134 52 140 L 52 182 Z M 40 160 L 30 160 L 30 148 Q 30 144 34 144 Q 36 144 36 148 L 36 154 L 40 154 Z`, "#5f8a4a"),
    // Crystal cave
    11: () => {
      let s = skyBand("#2a1a44", "#4a2f6a");
      const crys = (x: number, y: number, h: number, c: string) => glow(x, y - h / 2, h * 0.5, c, 0.3) + B(`M ${x} ${y - h} L ${x + h * 0.22} ${y - h * 0.7} L ${x + h * 0.18} ${y} L ${x - h * 0.18} ${y} L ${x - h * 0.22} ${y - h * 0.7} Z`, c);
      s += crys(24, 180, 70, "#8fe0f0") + crys(48, 184, 40, "#e283b3") + crys(176, 182, 76, "#b48af0") + crys(150, 186, 36, "#8fe0f0");
      s += B(`M 0 0 L 30 0 L 22 28 L 14 6 L 8 36 Z M 200 0 L 164 0 L 176 22 L 184 4 L 192 30 Z`, "#1e1230");
      return s + B(`M 0 184 L ${VEC_W} 184 L ${VEC_W} ${f1(VEC_H)} L 0 ${f1(VEC_H)} Z`, "#24163a");
    },
    // Library
    12: () => {
      let s = `<rect width="${VEC_W}" height="${f1(VEC_H)}" fill="#5a3a26"/>`;
      const bk = ["#b8343b", "#3a56b0", "#3f6d3a", "#d4a83a", "#6c3fa0", "#7a4b2b", "#2f8a86"];
      for (let r = 0; r < 4; r++) {
        const y = 18 + r * 42;
        s += B(`M 0 ${y + 34} L ${VEC_W} ${y + 34} L ${VEC_W} ${y + 40} L 0 ${y + 40} Z`, "#3a2416");
        for (let x = 4, i = r * 3; x < 196; i++) {
          const w = 6 + (i % 3) * 2;
          const h = 22 + ((i * 7) % 10);
          s += B(`M ${x} ${y + 34} L ${x} ${y + 34 - h} L ${x + w} ${y + 34 - h} L ${x + w} ${y + 34} Z`, bk[i % bk.length]);
          x += w + 1;
        }
      }
      return s + `<circle cx="100" cy="90" r="80" fill="url(#warm)" opacity="0.25"/>`;
    },
    };
  }

  function platform(): string {
    const pv = v("platform");
    let s = "";
    if (pv === 1) {
      s += S("M 54 206 Q 54 218 100 220 Q 146 218 146 206 Z", "#6b4a2f");
      s += E(100, 206, 46, 9, "#5f9a45");
      for (const x of [62, 76, 124, 138]) s += S(`M ${x - 4} 206 L ${x - 2} 197 L ${x} 205 L ${x + 2} 196 L ${x + 4} 206 Z`, "#79b356", "", 0.7);
    } else if (pv === 2) {
      s += S("M 52 206 Q 52 220 100 222 Q 148 220 148 206 Z", "#6f6a72");
      s += E(100, 206, 48, 10, "#9b96a0");
      if (paint) s += `<ellipse cx="92" cy="203" rx="30" ry="4" fill="#fff" opacity="0.18"/>`;
      s += L("M 70 207 L 84 209 M 112 204 L 126 206", dk("#9b96a0", 0.3), 1.2);
    } else if (pv === 3) {
      s += S("M 52 206 Q 52 218 100 220 Q 148 218 148 206 Z", "#6a4128");
      s += E(100, 206, 48, 10, "#a8703f");
      s += L("M 66 200 Q 100 204 134 200 M 60 208 Q 100 212 140 208", "#6a4128", 1.1);
    } else if (pv === 4) {
      for (const [x, y, r] of [
        [70, 210, 14],
        [130, 210, 14],
        [86, 204, 16],
        [114, 204, 16],
        [100, 210, 18],
      ])
        s += E(x, y, r, r * 0.7, "#f4f6fb");
      s += `<ellipse cx="100" cy="216" rx="40" ry="5" fill="#b8c8e0" opacity="0.5"/>`;
    } else if (pv === 5) {
      s += glow(100, 206, 40, "#b48af0", 0.35);
      s += `<ellipse cx="100" cy="206" rx="50" ry="11" fill="none" stroke="#c9a8ff" stroke-width="2.4"/><ellipse cx="100" cy="206" rx="40" ry="8" fill="none" stroke="#c9a8ff" stroke-width="1.2"/>`;
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        const x = 100 + Math.cos(a) * 45;
        const y = 206 + Math.sin(a) * 9.5;
        s += L(`M ${f1(x - 1.5)} ${f1(y - 1.5)} L ${f1(x + 1.5)} ${f1(y + 1.5)} M ${f1(x + 1.5)} ${f1(y - 1.5)} L ${f1(x)} ${f1(y)}`, "#f0e0ff", 1);
      }
    } else if (pv === 6) {
      s += S("M 50 210 Q 60 194 100 196 Q 140 194 150 210 Q 100 222 50 210 Z", "#f4f6fb");
      s += `<path d="M 60 210 Q 100 218 140 210" stroke="#b8c8e0" stroke-width="2" fill="none" opacity="0.7"/>`;
    } else if (pv === 7) {
      s += S("M 64 204 L 136 204 L 136 230 L 64 230 Z", "#a8703f");
      s += S("M 64 204 L 136 204 L 136 209 L 64 209 Z", "#c0884f");
      s += L("M 64 204 L 136 230 M 136 204 L 64 230", "#6a4128", 2.2);
    }
    return s;
  }

  // ---- back pieces ----
  function wings(): string {
    const w = v("wings");
    let s = "";
    for (const k of [-1, 1]) {
      if (w === 1) {
        const c = "#f2ece2";
        s += S(`M ${k * 6} 14 Q ${k * 40} -40 ${k * 70} -26 Q ${k * 66} 0 ${k * 58} 10 Q ${k * 60} 24 ${k * 48} 30 Q ${k * 50} 44 ${k * 36} 46 Q ${k * 30} 56 ${k * 14} 40 Z`, c);
        s += L(`M ${k * 30} -10 Q ${k * 44} 6 ${k * 46} 26 M ${k * 22} 4 Q ${k * 30} 22 ${k * 30} 40`, dk(c, 0.3), 1);
      } else if (w === 2) {
        const c = "#5a3a5a";
        s += S(`M ${k * 6} 12 L ${k * 60} -30 L ${k * 64} 14 Q ${k * 54} 6 ${k * 48} 26 Q ${k * 40} 16 ${k * 32} 34 Q ${k * 24} 24 ${k * 12} 40 Z`, c);
        s += L(`M ${k * 60} -30 L ${k * 48} 26 M ${k * 60} -30 L ${k * 32} 34`, dk(c, 0.3), 1.2);
      } else if (w === 3) {
        s += `<g opacity="0.7">${S(ell(k * 30, -4, 28, 16), "#bfe8f4", `transform="rotate(${k * -24} ${k * 30} -4)"`, 0.6)}${S(ell(k * 24, 30, 18, 11), "#e6c4f4", `transform="rotate(${k * 20} ${k * 24} 30)"`, 0.6)}</g>`;
      }
    }
    return s;
  }

  function cloakBack(): string {
    const ck = v("cloak");
    if (ck === 1) return S(`M ${-SWb + 3} 6 L ${SWb - 3} 6 L ${SWb + 16} 118 Q 0 126 ${-SWb - 16} 118 Z`, cloakC);
    if (ck === 2 || ck === 5) return S(`M ${-SWb + 2} 4 L ${SWb - 2} 4 L ${SWb + 22} 124 Q 0 130 ${-SWb - 22} 124 Z`, cloakC);
    if (ck === 4) return S(`M ${-SWb + 2} 6 L ${SWb - 2} 6 L ${SWb + 10} 80 Q 0 86 ${-SWb - 10} 80 Z`, dk(cloakC, 0.1));
    if (ck === 3) return S(`M 6 4 L 14 6 L 20 52 L 10 54 Z`, cloakC);
    return "";
  }

  function cloakFront(): string {
    const ck = v("cloak");
    if (ck === 1 || ck === 2 || ck === 5) return S(`M ${-SWb + 2} 3 Q 0 14 ${SWb - 2} 3 L ${SWb - 6} -1 Q 0 6 ${-SWb + 6} -1 Z`, dk(cloakC, 0.1)) + (ck === 2 || ck === 5 ? E(0, 6, 3.5, 3.5, GOLD) : "");
    if (ck === 3) return S(`M -14 -4 Q 0 6 14 -4 L 15 4 Q 0 14 -15 4 Z`, cloakC) + S(`M 6 4 L 13 4 L 16 30 L 8 32 Z`, cloakC);
    if (ck === 4) {
      let d = `M ${-SWb - 4} 12`;
      for (let i = 0; i <= 8; i++) {
        const x = -SWb - 4 + ((2 * SWb + 8) * i) / 8;
        d += ` Q ${f1(x - 2)} ${i % 2 ? 22 : 18} ${f1(x + 3)} 14`;
      }
      return S(`${d} L ${SWb + 2} 0 Q 0 -6 ${-SWb - 2} 0 Z`, "#d8c8a8");
    }
    return "";
  }

  function tail(): string {
    const t = v("tail");
    if (t === 1) return T(`M 6 70 C 30 80 44 96 40 112 C 37 122 48 124 52 116`, 4.5, skin) + S(`M 52 116 L 60 104 L 49 108 L 44 98 L 46 112 Z`, dk(skin, 0.1));
    if (t === 2) return T(`M 6 70 C 34 76 40 100 34 112 C 30 120 40 124 46 118`, 5, hairC);
    if (t === 3) return S(`M 0 62 Q 34 74 46 110 Q 48 120 60 122 Q 40 126 34 112 Q 24 86 0 78 Z`, dk(skin, 0.1));
    if (t === 4) return S(`M 4 66 Q 40 60 50 88 Q 56 108 44 118 Q 30 112 30 96 Q 26 80 4 78 Z`, hairC) + S(`M 44 118 Q 56 108 50 96 Q 44 104 36 108 Q 38 116 44 118 Z`, "#f4f1ea");
    return "";
  }

  function hairBack(): string {
    const h = v("hair");
    const c = dk(hairC, 0.12);
    if (h === 4) return S(`M -20 -4 Q -26 30 -22 52 Q 0 60 22 52 Q 26 30 20 -4 Z`, c);
    if (h === 5) return S(`M 10 -16 Q 30 -10 28 16 Q 26 36 32 50 Q 18 46 20 20 Q 20 0 10 -6 Z`, c);
    if (h === 11) return S(`M -26 6 L -30 -10 L -24 -24 L -12 -32 L 0 -30 L 14 -34 L 26 -24 L 30 -8 L 26 10 L 30 24 L 18 22 L 0 26 L -18 22 L -30 24 Z`, c);
    if (h === 10) return S(`M -21 -4 Q -23 14 -18 20 L 18 20 Q 23 14 21 -4 Z`, c);
    return "";
  }

  function hoodBack(): string {
    if (v("cloak") === 5 || v("hat") === 2) return S(`M -25 10 Q -28 -30 0 -32 Q 28 -30 25 10 Q 20 22 0 24 Q -20 22 -25 10 Z`, v("hat") === 2 ? hatC : cloakC);
    return "";
  }

  // ---- body ----
  function legs(o: number): string {
    let s = "";
    const long = o === 1 || o === 8;
    const pants = o === 2 ? metal : o === 7 ? main : dk(o === 3 || o === 9 ? main : trim, 0.25);
    const boots = o === 2 ? dk(metal, 0.2) : o === 7 ? "#6a4128" : "#4a2f22";
    if (!long) {
      s += S(`M ${-WW + 1} 68 L -1 68 L -2 112 L ${-WW + 3} 112 Z`, pants);
      s += S(`M 1 68 L ${WW - 1} 68 L ${WW - 3} 112 L 2 112 Z`, pants);
      s += S(`M ${-WW + 1} 104 L -2 104 L -1 124 L ${-WW - 5} 124 Q ${-WW - 6} 116 ${-WW + 1} 114 Z`, boots);
      s += S(`M 2 104 L ${WW - 1} 104 L ${WW - 1} 114 Q ${WW + 6} 116 ${WW + 5} 124 L 1 124 Z`, boots);
      if (o === 10) {
        s += S(`M ${-WW} 96 L -1 96 L -1 106 L ${-WW} 106 Z`, dk(boots, 0.2));
        s += S(`M 1 96 L ${WW} 96 L ${WW} 106 L 1 106 Z`, dk(boots, 0.2));
      }
    } else {
      s += S(`M -12 116 L -2 116 L -2 124 L -14 124 Z`, boots);
      s += S(`M 2 116 L 12 116 L 14 124 L 2 124 Z`, boots);
    }
    return s;
  }

  function outfit(o: number): string {
    const torso = `M ${-SWb} 14 Q ${-SWb} 4 ${-SWb + 8} 3 L ${SWb - 8} 3 Q ${SWb} 4 ${SWb} 14 L ${WW} 72 L ${-WW} 72 Z`;
    const belt = (y: number, c: string) => S(`M ${-WW - 1} ${y} L ${WW + 1} ${y} L ${WW + 1} ${y + 6} L ${-WW - 1} ${y + 6} Z`, c);
    const skirt = (y1: number, c: string) => S(`M ${-WW} 66 L ${WW} 66 L ${WW + 5} ${y1} L ${-WW - 5} ${y1} Z`, c);
    const arm = (k: number, c: string, w = 10) => T(`M ${k * (SWb - 5)} 10 Q ${k * (SWb + 4)} 34 ${k * (SWb + 5)} 58`, w, c);
    const arms = (c: string, w = 10) => arm(-1, c, w) + arm(1, c, w);
    const bareArms = (c: string) => T(`M ${-(SWb - 5)} 10 Q ${-(SWb + 3)} 22 ${-(SWb + 4)} 30`, 10, c) + T(`M ${SWb - 5} 10 Q ${SWb + 3} 22 ${SWb + 4} 30`, 10, c) + T(`M ${-(SWb + 4)} 32 L ${-(SWb + 5)} 58`, 8, skin) + T(`M ${SWb + 4} 32 L ${SWb + 5} 58`, 8, skin);
    let s = "";
    switch (o) {
      case 1: // Robe
      case 8: {
        // Vestments
        s += S(`M ${-SWb} 14 Q ${-SWb} 4 ${-SWb + 8} 3 L ${SWb - 8} 3 Q ${SWb} 4 ${SWb} 14 L ${SWb + 9} 120 Q 0 126 ${-SWb - 9} 120 Z`, main);
        if (o === 1) {
          s += S(`M -4 4 L 4 4 L 6 122 L -6 122 Z`, trim);
          s += S(`M -9 2 L 0 22 L 9 2 Z`, dk(main, 0.25));
          s += belt(52, trim);
          s += S(`M -3 56 L -6 76 L -1 76 Z`, trim);
        } else {
          s += S(`M -12 2 L -6 2 L -4 110 L -12 110 Z`, trim) + S(`M 6 2 L 12 2 L 12 110 L 4 110 Z`, trim);
          s += L(`M -8 96 L -8 104 M 8 96 L 8 104 M -11 100 L -5 100 M 5 100 L 11 100`, GOLD, 1.6);
          s += E(0, 26, 6, 6, GOLD) + L(`M 0 21 L 0 31 M -5 26 L 5 26`, dk(GOLD, 0.4), 1.4);
        }
        s += arms(main, 12);
        s += S(`M ${-SWb - 11} 50 L ${-SWb + 1} 50 L ${-SWb + 3} 62 L ${-SWb - 13} 62 Z`, o === 8 ? trim : main);
        s += S(`M ${SWb - 1} 50 L ${SWb + 11} 50 L ${SWb + 13} 62 L ${SWb - 3} 62 Z`, o === 8 ? trim : main);
        return s;
      }
      case 2: // Plate
        s += S(torso, metal);
        s += S(`M -10 16 L 10 16 L 9 96 L 0 102 L -9 96 Z`, main);
        s += L(`M -6 20 L 6 20`, lt(main, 0.3), 1.2);
        s += belt(64, trim) + S(`M -4 63 L 4 63 L 4 72 L -4 72 Z`, GOLD);
        s += arms(metal);
        s += E(-SWb + 1, 10, 10, 8, lt(metal, 0.1)) + E(SWb - 1, 10, 10, 8, lt(metal, 0.1));
        return s;
      case 3: // Leather
        s += S(torso, main);
        s += S(`M ${-SWb + 6} 4 L ${-SWb + 13} 4 L ${WW} 62 L ${WW - 7} 66 Z`, trim);
        s += belt(62, trim) + S(`M 4 61 L 11 61 L 11 70 L 4 70 Z`, metal);
        s += S(`M ${-WW} 70 L ${-WW - 3} 88 L -4 82 L 0 72 Z`, dk(main, 0.1));
        s += S(`M -6 2 L 0 14 L 6 2 Z`, dk(main, 0.35));
        return s + arms(main);
      case 4: {
        // Chainmail
        s += skirt(90, main);
        s += S(torso, metal);
        let rings = "";
        for (let y = 14; y < 64; y += 6) rings += `M ${-WW - 2} ${y} q 3 3 6 0 t 6 0 t 6 0 t 6 0 t 6 0 t 6 0 t 6 0 `;
        s += L(rings, dk(metal, 0.35), 0.9, `opacity="0.7"`);
        s += belt(62, trim);
        return s + arms(metal);
      }
      case 5: // Noble coat
        s += S(`M ${-SWb} 14 Q ${-SWb} 4 ${-SWb + 8} 3 L ${SWb - 8} 3 Q ${SWb} 4 ${SWb} 14 L ${WW + 8} 100 L 2 100 L 0 40 L -2 100 L ${-WW - 8} 100 Z`, main);
        s += S(`M -8 3 L 0 30 L 8 3 L 4 3 L 0 14 L -4 3 Z`, "#f4f1ea");
        s += S(`M -10 3 L -2 34 L -6 36 L -14 6 Z M 10 3 L 2 34 L 6 36 L 14 6 Z`, trim);
        for (const y of [40, 50, 60]) s += E(-4, y, 1.8, 1.8, GOLD, "", 0.5) + E(4, y, 1.8, 1.8, GOLD, "", 0.5);
        s += arms(main) + S(`M ${-SWb - 10} 52 L ${-SWb} 52 L ${-SWb} 58 L ${-SWb - 10} 58 Z M ${SWb} 52 L ${SWb + 10} 52 L ${SWb + 10} 58 L ${SWb} 58 Z`, trim);
        return s;
      case 6: // Peasant
        s += S(torso, lt(main, 0.25));
        s += S(`M ${-WW + 2} 30 L ${WW - 2} 30 L ${WW + 2} 98 L ${-WW - 2} 98 Z`, trim);
        s += L(`M ${-WW + 4} 30 L ${-SWb + 10} 4 M ${WW - 4} 30 L ${SWb - 10} 4`, trim, 2);
        return s + bareArms(lt(main, 0.25));
      case 7: // Monk
        s += S(torso, main);
        s += S(`M ${-SWb + 4} 4 L ${-SWb + 12} 4 L ${WW} 60 L ${WW - 8} 62 Z`, dk(main, 0.2));
        s += belt(58, trim) + S(`M 8 64 L 14 64 L 16 84 L 10 84 Z`, trim);
        return s + bareArms(main);
      case 9: // Hunter
        s += S(torso, main);
        s += skirt(88, main);
        s += S(`M ${-SWb + 4} -2 Q 0 10 ${SWb - 4} -2 L ${SWb} 10 Q 0 22 ${-SWb} 10 Z`, dk(main, 0.2));
        s += S(`M ${SWb - 8} 4 L ${SWb - 2} 4 L ${-WW + 2} 64 L ${-WW - 4} 62 Z`, WOOD);
        s += belt(62, trim);
        return s + arms(main);
      case 10: // Swashbuckler
        s += S(torso, "#f4f1ea");
        s += S(`M ${-SWb} 14 Q ${-SWb} 4 ${-SWb + 8} 3 L -4 3 L -6 72 L ${-WW} 72 Z M ${SWb} 14 Q ${SWb} 4 ${SWb - 8} 3 L 4 3 L 6 72 L ${WW} 72 Z`, main);
        s += S(`M ${-WW - 1} 60 L ${WW + 1} 60 L ${WW + 1} 68 L ${-WW - 1} 68 Z`, trim) + S(`M 8 66 L 14 66 L 18 90 L 10 88 Z`, trim);
        return s + arms("#f4f1ea", 11);
      case 11: {
        // Samurai armour: laced plates, square shoulder guards, plated skirt
        s += S(`M ${-WW - 2} 64 L ${WW + 2} 64 L ${WW + 8} 96 L ${-WW - 8} 96 Z`, dk(main, 0.1));
        s += L(`M ${-WW - 4} 74 L ${WW + 4} 74 M ${-WW - 6} 85 L ${WW + 6} 85 M 0 64 L 0 96`, trim, 1.4);
        s += S(torso, main);
        s += L(`M ${-SWb + 3} 22 L ${SWb - 3} 22 M ${-SWb + 6} 34 L ${SWb - 6} 34 M ${-WW - 2} 46 L ${WW + 2} 46`, trim, 1.6);
        s += belt(56, trim);
        s += arms(dk(main, 0.15));
        for (const k of [-1, 1]) s += S(`M ${k * (SWb - 6)} 4 L ${k * (SWb + 9)} 8 L ${k * (SWb + 11)} 30 L ${k * (SWb - 2)} 28 Z`, main) + L(`M ${k * (SWb - 4)} 14 L ${k * (SWb + 10)} 17 M ${k * (SWb - 3)} 21 L ${k * (SWb + 10)} 24`, trim, 1.2);
        return s;
      }
      default: // Tunic
        s += S(torso, main);
        s += skirt(88, main);
        s += belt(62, trim);
        s += S(`M -6 2 L 0 12 L 6 2 Z`, dk(main, 0.3));
        return s + arms(main);
    }
  }

  // ---- head ----
  function earsBehind(): string {
    const e = v("ears");
    let s = "";
    for (const k of [-1, 1]) {
      if (e === 2) s += S(`M ${k * 15} -4 L ${k * 34} -16 L ${k * 17} 8 Z`, skin);
      else if (e === 1) s += S(`M ${k * 15} -3 L ${k * 26} -10 L ${k * 17} 8 Z`, skin);
      else if (e === 3) s += S(`M ${k * 16} -6 L ${k * 30} -12 L ${k * 26} -2 L ${k * 31} 4 L ${k * 24} 8 L ${k * 26} 14 L ${k * 16} 10 Z`, mixHex(skin, "#5f9ac2", 0.4));
      else if (e === 6) s += S(`M ${k * 15} 0 Q ${k * 26} 6 ${k * 24} 26 Q ${k * 18} 30 ${k * 16} 12 Z`, dk(hairC, 0.05));
      else if (e === 0) s += E(k * 18, 3, 4, 6, skin);
    }
    return s;
  }

  function earsTop(): string {
    const e = v("ears");
    if (e !== 4 && e !== 5) return "";
    let s = "";
    for (const k of [-1, 1]) {
      if (e === 4) s += S(`M ${k * 6} -20 L ${k * 16} -34 L ${k * 18} -14 Z`, hairC) + `<path d="M ${k * 9} -20 L ${k * 15} -29 L ${k * 16} -18 Z" fill="#e8a0a8"/>`;
      else s += S(ell(k * 9, -38, 5, 15), lt(hairC, 0.1), `transform="rotate(${k * 10} ${k * 9} -38)"`) + `<path d="${ell(k * 9, -38, 2.2, 10)}" fill="#e8a0a8" transform="rotate(${k * 10} ${k * 9} -38)"/>`;
    }
    return s;
  }

  function eyes(): string {
    const ev = v("eyes");
    const ex = cel ? 8 : 7;
    const ey = cel ? 2 : 1;
    const brow = dk(hairC, 0.2);
    let s = "";
    for (const k of [-1, 1]) {
      const x = k * ex;
      if (ev === 7 && k === 1) {
        s += S(ell(x, ey, cel ? 5 : 4.2, cel ? 4.6 : 3.8), "#25212b", "", 0.6);
        s += L(`M -17 -8 L ${x - 3} ${ey - 2} M ${x + 3} ${ey - 3} L 18 -2`, "#25212b", 1.2);
        continue;
      }
      if (ev === 1 || ev === 6) {
        // happy / closed: arcs
        s += L(ev === 1 ? `M ${x - 3.6} ${ey + 1} Q ${x} ${ey - 3.4} ${x + 3.6} ${ey + 1}` : `M ${x - 3.6} ${ey} Q ${x} ${ey + 3} ${x + 3.6} ${ey}`, lineC, cel ? 2 : 1.4);
      } else if (ev === 5) {
        s += `<ellipse cx="${x}" cy="${ey}" rx="${cel ? 4 : 3}" ry="${cel ? 3.4 : 2}" fill="${eyeC}" filter="url(#glow)"/>`;
        s += `<ellipse cx="${x}" cy="${ey}" rx="${cel ? 3 : 2}" ry="${cel ? 2.2 : 1.2}" fill="#fffbe0"/>`;
      } else {
        const wide = ev === 2 ? 1.25 : 1;
        if (cel) s += `<ellipse cx="${x}" cy="${ey}" rx="${f1(3.8 * wide)}" ry="${f1(4.8 * wide)}" fill="${st.line}"/><ellipse cx="${x}" cy="${ey + 0.8}" rx="${f1(2.8 * wide)}" ry="${f1(3.4 * wide)}" fill="${eyeC}"/><circle cx="${x - 1.2}" cy="${ey - 1.6}" r="1.4" fill="#fff"/>`;
        else if (ink) s += (ev === 2 ? `<circle cx="${x}" cy="${ey}" r="3.6" fill="#fff" stroke="${st.line}" stroke-width="0.8"/>` : "") + `<ellipse cx="${x}" cy="${ey}" rx="2.2" ry="2.7" fill="${st.line}"/><circle cx="${x - 0.7}" cy="${ey - 0.9}" r="0.7" fill="#fff"/>`;
        else {
          const w = 4 * wide;
          s += `<path d="M ${x - w} ${ey} Q ${x} ${f1(ey - 3.4 * wide)} ${x + w} ${ey} Q ${x} ${f1(ey + 2.4 * wide)} ${x - w} ${ey} Z" fill="#f5efe6"/>`;
          s += `<circle cx="${x}" cy="${ey - 0.2}" r="2" fill="${eyeC}"/><circle cx="${x}" cy="${ey - 0.2}" r="0.9" fill="#120a14"/><circle cx="${x - 0.7}" cy="${ey - 0.9}" r="0.5" fill="#fff"/>`;
          s += L(`M ${x - w - 0.4} ${ey - 0.2} Q ${x} ${f1(ey - 3.8 * wide)} ${x + w + 0.4} ${ey - 0.4}`, dk(skin, 0.6), 0.9);
        }
        if (ev === 3) s += S(`M ${x - 4.6} ${ey - 0.4} Q ${x} ${ey - 5.4} ${x + 4.6} ${ey - 0.4} Z`, dk(skin, 0.08), "", 0.5);
      }
      const fierce = ev === 4 || ev === 5;
      const by = ey - (cel ? 7 : 5);
      s += L(fierce ? `M ${x - k * 4} ${by - 2} L ${x + k * 4} ${by + 1}` : `M ${x - 3.5} ${by} Q ${x} ${by - 1.8} ${x + 3.5} ${by}`, brow, cel ? 2.2 : 1.4);
    }
    return s;
  }

  function nose(): string {
    if (paint) return L(`M 0 4 Q 1.6 8 0 10`, dk(skin, 0.35), 0.9, `opacity="0.7"`) + `<ellipse cx="-1.5" cy="6" rx="1" ry="2" fill="#fff" opacity="0.2"/>`;
    if (ink) return L(`M 0.5 5 Q 2 8.5 -0.5 9`, st.line, 1);
    return `<ellipse cx="0" cy="8" rx="1.3" ry="0.9" fill="${dk(skin, 0.3)}"/>`;
  }

  function mouth(y: number): string {
    const mv = v("mouth");
    const mc = paint ? dk(skin, 0.5) : st.line;
    switch (mv) {
      case 1:
        return L(`M -3.5 ${y} L 3.5 ${y}`, mc, 1.2);
      case 2:
        return L(`M -4 ${y + 1} Q 0 ${y - 2} 4 ${y + 1}`, mc, 1.3);
      case 3:
        return `<path d="M -5 ${y - 1} Q 0 ${y + 5} 5 ${y - 1} Z" fill="#f4f1ea" stroke="${mc}" stroke-width="1.1" stroke-linejoin="round"/>`;
      case 4:
        return `<ellipse cx="0" cy="${y}" rx="2.6" ry="3" fill="#6e2a2e" stroke="${mc}" stroke-width="0.9"/>`;
      case 5:
        return L(`M -4 ${y} Q 1 ${y + 1.5} 5 ${y - 2}`, mc, 1.3);
      case 6:
        return L(`M -4.5 ${y - 1} Q 0 ${y + 2.6} 4.5 ${y - 1}`, mc, 1.3) + `<path d="M -3 ${y} L -2.2 ${y + 2.6} L -1.4 ${y + 0.6} Z M 3 ${y} L 2.2 ${y + 2.6} L 1.4 ${y + 0.6} Z" fill="#fff"/>`;
      default:
        return L(`M -4.5 ${y - 1} Q 0 ${y + 2.6} 4.5 ${y - 1}`, mc, 1.3);
    }
  }

  function marksUnder(): string {
    const m = v("mark");
    let s = "";
    if (cel || m === 2) s += `<ellipse cx="-12" cy="9" rx="3.4" ry="2" fill="#ff7a8a" opacity="${m === 2 ? 0.6 : 0.4}"/><ellipse cx="12" cy="9" rx="3.4" ry="2" fill="#ff7a8a" opacity="${m === 2 ? 0.6 : 0.4}"/>`;
    else if (paint) s += `<ellipse cx="-10" cy="9" rx="4" ry="2.4" fill="#e0606a" opacity="0.16"/><ellipse cx="10" cy="9" rx="4" ry="2.4" fill="#e0606a" opacity="0.16"/>`;
    if (m === 1) for (const [x, y] of [[-12, 7], [-9, 9], [-13, 10], [12, 7], [9, 9], [13, 10]]) s += `<circle cx="${x}" cy="${y}" r="0.8" fill="${dk(skin, 0.45)}"/>`;
    if (m === 4) s += L(`M -15 5 L -8 7 M -15 9 L -8 11 M 15 5 L 8 7 M 15 9 L 8 11`, "#3a56b0", 1.6);
    if (m === 5) for (const [x, y] of [[-13, 4], [-10, 6], [-14, 8], [13, 4], [10, 6], [14, 8], [-3, -16], [3, -16]]) s += `<path d="M ${x - 1.6} ${y} q 1.6 -1.8 3.2 0" fill="none" stroke="${dk(skin, 0.35)}" stroke-width="0.8"/>`;
    if (m === 8) s += L(`M -2 -16 L 0 -12 L 2 -16 M -4 -10 L 4 -10`, "#3a7ac8", 1.2) + L(`M -13 4 Q -11 8 -13 12`, "#3a7ac8", 1.1);
    return s;
  }

  function marksOver(y: number): string {
    const m = v("mark");
    if (m === 3) return L(`M -11 -5 L -4 8`, mixHex(skin, "#a03a3a", 0.5), 1.4) + L(`M -9 -2 L -6 -1 M -8 2 L -5 3`, mixHex(skin, "#a03a3a", 0.5), 0.8);
    if (m === 6) return L(`M -6 ${y - 2} L -18 ${y - 4} M -6 ${y} L -18 ${y + 1} M 6 ${y - 2} L 18 ${y - 4} M 6 ${y} L 18 ${y + 1}`, lineC, 0.8);
    if (m === 7) return S(`M -5 ${y + 1} L -6 ${y - 5} L -3 ${y} Z`, "#f4f1ea", "", 0.5) + S(`M 5 ${y + 1} L 6 ${y - 5} L 3 ${y} Z`, "#f4f1ea", "", 0.5);
    return "";
  }

  function beard(y: number): string {
    const bv = v("beard");
    if (!bv) return "";
    const c = hairC;
    if (bv === 1) return `<path d="M -16 4 Q -14 18 0 21 Q 14 18 16 4 Q 12 14 0 16 Q -12 14 -16 4 Z" fill="${c}" opacity="0.4"/>`;
    const stache = S(`M -8 ${y - 3} Q 0 ${y - 7} 8 ${y - 3} Q 10 ${y} 8 ${y + 1} Q 4 ${y - 2} 0 ${y - 2} Q -4 ${y - 2} -8 ${y + 1} Q -10 ${y} -8 ${y - 3} Z`, dk(c, 0.1));
    if (bv === 2) return stache;
    if (bv === 3) return S(`M -4 ${y + 2} Q 0 ${y + 1} 4 ${y + 2} L 2 ${y + 12} L -2 ${y + 12} Z`, c) + stache;
    if (bv === 4) return S(`M -17 2 Q -16 16 -8 22 Q 0 27 8 22 Q 16 16 17 2 Q 12 12 6 14 Q 0 10 -6 14 Q -12 12 -17 2 Z`, c) + stache + L(`M -4 ${y + 1} Q 0 ${y + 2} 4 ${y + 1}`, dk(c, 0.5), 1);
    const len = bv === 7 ? 66 : 46;
    let s = S(`M -17 2 Q -16 18 -10 28 Q -4 ${len - 4} 0 ${len} Q 4 ${len - 4} 10 28 Q 16 18 17 2 Q 12 12 6 14 Q 0 10 -6 14 Q -12 12 -17 2 Z`, c);
    s += stache;
    if (bv === 6) s += E(0, 47, 3, 3, GOLD) + S(`M -2 49 L 2 49 L 3 58 L 0 61 L -3 58 Z`, c);
    s += L(`M -5 ${y} Q 0 ${y + 1.6} 5 ${y}`, dk(c, 0.5), 1.1);
    return s;
  }

  function hairFront(): string {
    const hv = v("hair");
    const c = hairC;
    const cap = S(`M -18 0 Q -20 -24 0 -24 Q 20 -24 18 0 L 15 -9 Q 6 -16 -4 -12 Q -12 -14 -15 -8 Z`, c);
    switch (hv) {
      case 0:
        return shine(`M -8 -18 Q -2 -21 4 -19 Q -2 -17 -8 -18 Z`, 0.3);
      case 2:
        return S(`M -19 0 L -22 -12 L -15 -14 L -16 -26 L -7 -21 L -4 -32 L 3 -22 L 10 -30 L 11 -19 L 20 -22 L 17 -12 L 22 -6 L 18 -2 Q 12 -14 0 -14 Q -10 -14 -16 -6 Z`, c);
      case 3:
        return S(`M -18 2 Q -22 -26 4 -26 Q 24 -24 22 -6 L 18 -2 Q 14 -14 -2 -14 Q -12 -10 -18 2 Z`, c) + L(`M -6 -22 Q 4 -20 14 -12`, dk(c, 0.3), 1);
      case 4:
        return S(`M -20 6 Q -22 -24 0 -24 Q 22 -24 20 6 L 17 -6 Q 10 -16 2 -15 Q -8 -12 -16 -4 Z`, c) + S(`M -20 -2 Q -21 18 -17 34 L -13 32 Q -15 14 -15 -4 Z`, c) + S(`M 20 -2 Q 21 18 17 34 L 13 32 Q 15 14 15 -4 Z`, c);
      case 5:
        return cap + E(16, -12, 3.5, 3.5, trim, "", 0.6);
      case 6:
        return E(0, -27, 9, 8, c) + cap;
      case 7:
        return S(`M -5 -14 L -6 -38 L 0 -30 L 4 -40 L 6 -30 L 8 -36 L 6 -14 Z`, c) + `<path d="M -16 -6 Q -18 -16 -6 -18 L -6 -14 Q -12 -12 -16 -6 Z M 16 -6 Q 18 -16 6 -18 L 6 -14 Q 12 -12 16 -6 Z" fill="${c}" opacity="0.4"/>`;
      case 8: {
        let s = cap;
        for (const k of [-1, 1]) for (let i = 0; i < 5; i++) s += E(k * 17, 2 + i * 7, 3.6, 4, c, "", 0.7);
        return s;
      }
      case 9: {
        let s = "";
        for (const [x, y, r] of [[-16, -4, 6], [-14, -14, 7], [-6, -21, 7], [4, -22, 7], [13, -16, 7], [17, -6, 6], [-2, -13, 5], [8, -12, 5]]) s += E(x, y, r, r, c, "", 0.8);
        return s;
      }
      case 10:
        return S(`M -21 18 Q -23 -24 0 -24 Q 23 -24 21 18 L 15 18 L 16 -6 Q 8 -12 0 -12 Q -10 -10 -16 -6 L -15 18 Z`, c);
      case 11:
        return S(`M -22 2 L -20 -14 L -26 -18 L -14 -22 L -12 -32 L -2 -24 L 6 -34 L 10 -24 L 22 -28 L 18 -16 L 26 -10 L 18 -4 Q 10 -14 -2 -14 Q -14 -12 -22 2 Z`, c);
      case 12:
        return cap + E(0, -28, 6, 5, c) + S(`M -4 -24 L 4 -24 L 4 -21 L -4 -21 Z`, trim, "", 0.6);
      default:
        return cap;
    }
  }

  function horns(): string {
    const h = v("horns");
    if (!h) return "";
    let s = "";
    for (const k of [-1, 1]) {
      if (h === 1) s += S(`M ${k * 6} -19 Q ${k * 9} -30 ${k * 14} -32 Q ${k * 12} -24 ${k * 12} -18 Z`, BONE);
      if (h === 2) {
        s += T(`M ${k * 9} -18 C ${k * 18} -30 ${k * 32} -24 ${k * 30} -10 C ${k * 29} -1 ${k * 21} 0 ${k * 22} -8`, 6.5, BONE);
        s += L(`M ${k * 20} -25 L ${k * 22} -21 M ${k * 27} -21 L ${k * 25} -18 M ${k * 30} -13 L ${k * 27} -13`, dk(BONE, 0.4), 0.9);
      }
      if (h === 3) s += S(`M ${k * 8} -18 Q ${k * 22} -24 ${k * 36} -40 Q ${k * 28} -22 ${k * 14} -14 Z`, "#3a2a3a");
      if (h === 4) s += T(`M ${k * 8} -20 L ${k * 18} -40 M ${k * 14} -32 L ${k * 26} -36 M ${k * 16} -36 L ${k * 14} -48 M ${k * 22} -35 L ${k * 30} -44`, 3.2, "#8a5a33");
    }
    if (h === 5) s += S(`M -3 -20 L 0 -48 L 3 -20 Z`, "#f2e6c4") + L(`M -2 -26 L 2 -28 M -1.5 -33 L 1.5 -35 M -1 -40 L 1 -42`, dk(GOLD, 0.2), 0.8);
    return s;
  }

  function hat(): string {
    const h = v("hat");
    const c = hatC;
    switch (h) {
      case 1:
        return E(0, -17, 31, 6.5, dk(c, 0.1)) + S(`M -17 -18 Q -10 -40 2 -56 Q 8 -66 22 -64 Q 12 -58 10 -48 Q 13 -32 17 -18 Q 0 -13 -17 -18 Z`, c) + S(`M -16.5 -22 Q 0 -16 16.5 -22 L 17 -18 Q 0 -13 -17 -18 Z`, trim) + `<path d="M -2 -38 l 1.4 3 3 .4 -2.2 2.1 .6 3 -2.8 -1.5 -2.8 1.5 .6 -3 -2.2 -2.1 3 -.4 Z" fill="#f2d36a"/>`;
      case 2:
        return S(`M -22 6 Q -24 -28 0 -28 Q 24 -28 22 6 L 17 4 Q 18 -20 0 -20 Q -18 -20 -17 4 Z`, c);
      case 3:
      case 4: {
        let s = S(`M -20 0 Q -22 -27 0 -27 Q 22 -27 20 0 L 20 -2 Q 0 -8 -20 -2 Z`, metal);
        s += S(`M -21 -4 Q 0 -10 21 -4 L 21 1 Q 0 -5 -21 1 Z`, dk(metal, 0.2));
        s += S(`M -2.5 -6 L 2.5 -6 L 2 9 L -2 9 Z`, dk(metal, 0.1));
        if (paint) s += `<path d="M -12 -18 Q -6 -24 4 -24" stroke="#fff" stroke-opacity="0.5" stroke-width="2" fill="none" stroke-linecap="round"/>`;
        if (h === 4) for (const k of [-1, 1]) s += S(`M ${k * 18} -14 Q ${k * 34} -18 ${k * 36} -38 Q ${k * 26} -26 ${k * 17} -22 Z`, BONE);
        return s;
      }
      case 5:
        return S(`M -16 -16 L -18 -34 L -9 -24 L 0 -38 L 9 -24 L 18 -34 L 16 -16 Z`, GOLD) + E(0, -22, 2.4, 2.4, "#c8343b", "", 0.5) + E(-10, -20, 1.8, 1.8, "#3a56b0", "", 0.5) + E(10, -20, 1.8, 1.8, "#3f8f4a", "", 0.5);
      case 6:
        return S(`M -18 -12 Q 0 -20 18 -12 L 18 -9 Q 0 -17 -18 -9 Z`, GOLD) + S(`M 0 -21 L 3 -16 L 0 -12 L -3 -16 Z`, "#8fd0e0", "", 0.6);
      case 7:
        return S(`M -19 -8 Q -20 -26 0 -26 Q 20 -26 19 -8 Q 0 -16 -19 -8 Z`, c) + S(`M 17 -12 L 28 -6 L 24 2 L 18 -4 Z M 18 -10 L 30 -14 L 28 -4 Z`, c);
      case 8:
        return S(`M -20 -12 Q -18 -30 4 -30 Q 24 -28 22 -14 Q 0 -8 -20 -12 Z`, c) + T(`M 14 -24 Q 26 -40 38 -42`, 3, "#e6d3a0") + L(`M 18 -28 L 22 -32 M 24 -34 L 28 -37`, dk("#e6d3a0", 0.4), 0.8);
      case 9:
        return S(`M -30 -16 Q -20 -10 0 -12 Q 20 -10 30 -16 Q 24 -34 0 -32 Q -24 -34 -30 -16 Z`, c) + L(`M -28 -16 Q 0 -8 28 -16`, trim, 2);
      case 10: {
        let s = "";
        const fl = ["#e283b3", "#f2d36a", "#f4f1ea", "#b48af0", "#e283b3"];
        s += T(`M -18 -12 Q 0 -22 18 -12`, 2.4, "#5f9a45");
        for (let i = 0; i < 5; i++) {
          const x = -16 + i * 8;
          const y = -14 - (i === 2 ? 5 : i % 2 ? 4 : 1);
          s += E(x, y, 3.6, 3.6, fl[i], "", 0.6) + `<circle cx="${x}" cy="${y}" r="1.2" fill="${GOLD}"/>`;
        }
        return s;
      }
      case 11:
        return E(0, -17, 34, 6, dk(c, 0.1)) + S(`M -15 -18 L -2 -50 Q 4 -58 16 -56 Q 6 -50 6 -42 L 15 -18 Q 0 -14 -15 -18 Z`, c) + S(`M -14 -24 Q 0 -19 14 -24 L 15 -19 Q 0 -14 -15 -19 Z`, trim) + S(`M -3 -24 L 3 -24 L 3 -19 L -3 -19 Z`, GOLD, "", 0.5);
      case 12:
        return S(`M -18 -12 Q 0 -18 18 -12 L 18 -7 Q 0 -13 -18 -7 Z`, c);
      case 13: {
        // Kabuto: dome, flared neck guard, gold crescent crest
        let s = S(`M -20 -6 Q -30 4 -32 10 Q -22 6 -18 2 Z M 20 -6 Q 30 4 32 10 Q 22 6 18 2 Z`, dk(metal, 0.15));
        s += S(`M -20 -2 Q -22 -28 0 -28 Q 22 -28 20 -2 Q 0 -8 -20 -2 Z`, dk(metal, 0.25));
        s += L(`M -10 -25 L -12 -4 M 0 -28 L 0 -6 M 10 -25 L 12 -4`, lt(metal, 0.2), 1, `opacity="0.7"`);
        s += S(`M -22 -6 Q 0 -12 22 -6 L 22 -1 Q 0 -7 -22 -1 Z`, hatC);
        s += S(`M -3 -26 Q -16 -32 -18 -48 Q -8 -36 0 -34 Q 8 -36 18 -48 Q 16 -32 3 -26 Z`, GOLD);
        return s;
      }
      default:
        return "";
    }
  }

  // ---- gear ----
  function handItem(): string {
    const hand = v("hand");
    const [hx, hy] = RH;
    switch (hand) {
      case 1:
        return S(`M ${hx - 2.6} ${hy - 6} L ${hx - 2.6} ${hy - 52} L ${hx} ${hy - 58} L ${hx + 2.6} ${hy - 52} L ${hx + 2.6} ${hy - 6} Z`, metal) + shine(`M ${hx - 1.6} ${hy - 8} L ${hx - 1.6} ${hy - 50} L ${hx - 0.4} ${hy - 52} L ${hx - 0.4} ${hy - 8} Z`, 0.5) + T(`M ${hx - 9} ${hy - 6} L ${hx + 9} ${hy - 6}`, 3, GOLD) + T(`M ${hx} ${hy - 4} L ${hx} ${hy + 6}`, 3.4, WOOD) + E(hx, hy + 9, 2.6, 2.6, GOLD, "", 0.6);
      case 2:
        return T(`M ${hx} ${hy + 24} L ${hx} ${hy - 50}`, 4.5, WOOD) + S(`M ${hx - 2} ${hy - 48} Q ${hx - 26} ${hy - 58} ${hx - 22} ${hy - 30} Q ${hx - 18} ${hy - 40} ${hx - 2} ${hy - 34} Z`, metal) + (paint ? L(`M ${hx - 20} ${hy - 52} Q ${hx - 24} ${hy - 42} ${hx - 21} ${hy - 34}`, "#fff", 1.4, `opacity="0.6"`) : "");
      case 3:
        return T(`M ${hx} ${hy - 86} L ${hx} ${hy + 58}`, 4.5, metal) + T(`M ${hx} ${hy - 86} Q ${hx - 8} ${hy - 96} ${hx} ${hy - 100} Q ${hx + 7} ${hy - 96} ${hx + 2} ${hy - 90}`, 4, metal);
      case 4:
        return T(`M ${hx} ${hy} L ${hx - 10} ${hy - 26}`, 2.6, WOOD) + glow(hx - 11, hy - 29, 7, "#fff2a8", 0.6) + sparkle(hx - 11, hy - 29, 2.4, "#fffbe0");
      case 5:
        return T(`M ${hx - 4} ${hy - 50} Q ${hx - 22} ${hy} ${hx - 4} ${hy + 50}`, 3.4, WOOD) + L(`M ${hx - 4} ${hy - 50} L ${hx - 4} ${hy + 50}`, "#e9e4d8", 0.9);
      case 6:
        return S(`M ${hx - 2} ${hy - 4} L ${hx - 5} ${hy - 32} L ${hx - 1} ${hy - 38} L ${hx + 3} ${hy - 4} Z`, metal) + T(`M ${hx - 8} ${hy - 4} L ${hx + 8} ${hy - 5}`, 2.6, GOLD);
      case 7: {
        let s = T(`M ${hx} ${hy + 10} L ${hx} ${hy - 34}`, 3.6, WOOD);
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          s += S(`M ${f1(hx + Math.cos(a) * 6)} ${f1(hy - 42 + Math.sin(a) * 6)} L ${f1(hx + Math.cos(a) * 11)} ${f1(hy - 42 + Math.sin(a) * 11)} L ${f1(hx + Math.cos(a + 0.4) * 6)} ${f1(hy - 42 + Math.sin(a + 0.4) * 6)} Z`, dk(metal, 0.1), "", 0.6);
        }
        return s + E(hx, hy - 42, 7, 7, metal);
      }
      case 8:
        return T(`M ${hx} ${hy - 96} L ${hx} ${hy + 58}`, 3.4, WOOD) + S(`M ${hx} ${hy - 116} Q ${hx + 6} ${hy - 104} ${hx} ${hy - 94} Q ${hx - 6} ${hy - 104} ${hx} ${hy - 116} Z`, metal) + T(`M ${hx - 4} ${hy - 94} L ${hx + 4} ${hy - 94}`, 2, "#c8343b");
      case 9:
        return T(`M ${hx + 2} ${hy} L ${hx - 14} ${hy - 36}`, 3.6, dk(WOOD, 0.2)) + S(`M ${hx - 17} ${hy - 40} L ${hx - 11} ${hy - 42} L ${hx - 9} ${hy - 34} L ${hx - 15} ${hy - 32} Z`, dk(WOOD, 0.3), "", 0.6) + E(hx + 4, hy + 6, 11, 13, "#c0884f") + E(hx + 3, hy + 4, 3.4, 3.4, "#3a2416", "", 0.5) + L(`M ${hx + 3} ${hy + 14} L ${hx - 13} ${hy - 36}`, "#f4f1ea", 0.6);
      case 10:
        return T(`M ${hx} ${hy + 10} L ${hx} ${hy - 26}`, 4, WOOD) + glow(hx, hy - 36, 16, "#ffb24a", 0.55) + S(`M ${hx} ${hy - 50} Q ${hx + 10} ${hy - 36} ${hx + 5} ${hy - 28} Q ${hx} ${hy - 24} ${hx - 5} ${hy - 28} Q ${hx - 10} ${hy - 36} ${hx} ${hy - 50} Z`, "#ff9a3a", "", 0.7) + `<path d="M ${hx} ${hy - 42} Q ${hx + 4} ${hy - 34} ${hx} ${hy - 29} Q ${hx - 4} ${hy - 34} ${hx} ${hy - 42} Z" fill="#fff2a8"/>`;
      case 11:
        return T(`M ${hx} ${hy + 14} L ${hx} ${hy - 42}`, 4, WOOD) + S(`M ${hx - 12} ${hy - 52} L ${hx + 12} ${hy - 52} L ${hx + 12} ${hy - 38} L ${hx - 12} ${hy - 38} Z`, metal) + shine(`M ${hx - 11} ${hy - 51} L ${hx + 11} ${hy - 51} L ${hx + 11} ${hy - 49} L ${hx - 11} ${hy - 49} Z`, 0.5);
      case 12:
        return T(`M ${hx} ${hy - 92} L ${hx} ${hy + 58}`, 4.5, metal) + glow(hx, hy - 104, 14, "#9fe8ff", 0.35) + S(`M ${hx} ${hy - 118} L ${hx + 7} ${hy - 104} L ${hx} ${hy - 92} L ${hx - 7} ${hy - 104} Z`, "#8fe0f0") + `<path d="M ${hx} ${hy - 116} L ${hx - 4} ${hy - 104} L ${hx} ${hy - 104} Z" fill="#fff" opacity="0.7"/>` + T(`M ${hx - 6} ${hy - 92} Q ${hx} ${hy - 86} ${hx + 6} ${hy - 92}`, 2.4, dk(metal, 0.2));
      default:
        return "";
    }
  }

  function offhand(): string {
    const o = v("offhand");
    const [lx, ly] = LH;
    const hand = E(lx, ly, 5.5, 5.5, skin);
    switch (o) {
      case 1: {
        const [x, y] = [lx + 2, ly - 8];
        return hand + E(x, y, 21, 21, metal) + E(x, y, 17, 17, main) + S(`M ${x - 17} ${y - 3} L ${x + 17} ${y - 3} L ${x + 17} ${y + 3} L ${x - 17} ${y + 3} Z`, trim) + E(x, y, 6, 6, lt(metal, 0.15));
      }
      case 2: {
        const [x, y] = [lx + 2, ly - 14];
        return hand + S(`M ${x - 17} ${y - 14} L ${x + 17} ${y - 14} Q ${x + 18} ${y + 14} ${x} ${y + 34} Q ${x - 18} ${y + 14} ${x - 17} ${y - 14} Z`, main) + S(`M ${x - 3} ${y - 14} L ${x + 3} ${y - 14} L ${x + 3} ${y + 30} L ${x - 3} ${y + 30} Z M ${x - 17} ${y} L ${x + 17} ${y} L ${x + 16} ${y + 6} L ${x - 16} ${y + 6} Z`, trim, "", 0.7);
      }
      case 3:
        return S(`M ${lx - 6} ${ly - 18} L ${lx + 14} ${ly - 22} L ${lx + 16} ${ly + 4} L ${lx - 4} ${ly + 8} Z`, "#6a2f3f") + S(`M ${lx - 4} ${ly - 17} L ${lx + 12} ${ly - 20} L ${lx + 14} ${ly + 2} L ${lx - 2} ${ly + 6} Z`, "#f4ead6", "", 0.5) + L(`M ${lx + 1} ${ly - 12} L ${lx + 9} ${ly - 14} M ${lx + 1} ${ly - 7} L ${lx + 10} ${ly - 9}`, "#8a7a6a", 0.8) + hand;
      case 4:
        return hand + glow(lx, ly - 12, 14, "#b48af0", 0.5) + E(lx, ly - 12, 8, 8, "#b48af0") + shine(ell(lx - 2.5, ly - 15, 2.6, 2), 0.7);
      case 5:
        return hand + L(`M ${lx - 4} ${ly} Q ${lx} ${ly + 4} ${lx + 4} ${ly}`, dk(metal, 0.2), 1.2) + glow(lx, ly + 16, 14, "#ffd27a", 0.55) + S(`M ${lx - 6} ${ly + 6} L ${lx + 6} ${ly + 6} L ${lx + 7} ${ly + 26} L ${lx - 7} ${ly + 26} Z`, dk(metal, 0.2)) + `<rect x="${lx - 4.5}" y="${ly + 10}" width="9" height="12" fill="#ffd27a"/>`;
      case 6:
        return S(`M ${lx - 2} ${ly - 18} L ${lx + 2} ${ly - 18} L ${lx + 2} ${ly - 12} Q ${lx + 9} ${ly - 8} ${lx + 8} ${ly - 1} Q ${lx} ${ly + 4} ${lx - 8} ${ly - 1} Q ${lx - 9} ${ly - 8} ${lx - 2} ${ly - 12} Z`, "#d0e8f0") + `<path d="M ${lx - 7} ${ly - 5} Q ${lx} ${ly - 2} ${lx + 7} ${ly - 5} Q ${lx + 6} ${ly + 2} ${lx} ${ly + 2} Q ${lx - 6} ${ly + 2} ${lx - 7} ${ly - 5} Z" fill="#c8343b"/>` + E(lx, ly - 19, 2.6, 1.6, WOOD, "", 0.5) + hand;
      case 7:
        return hand + L(`M ${lx} ${ly} L ${lx} ${ly + 8}`, GOLD, 1) + glow(lx, ly + 14, 9, "#fff2a8", 0.4) + E(lx, ly + 14, 6, 6, GOLD) + L(`M ${lx} ${ly + 10} L ${lx} ${ly + 18} M ${lx - 4} ${ly + 14} L ${lx + 4} ${ly + 14}`, dk(GOLD, 0.4), 1.3);
      default:
        return hand;
    }
  }

  // ---- pets, at the character's feet ----
  function pet(): string {
    const p = v("pet");
    if (!p) return "";
    const c = petC;
    const x = 162;
    const y = 214;
    const eye = (ex: number, ey: number, r = 1.3) => `<circle cx="${f1(ex)}" cy="${f1(ey)}" r="${r}" fill="#1c1424"/>` + (cel ? `<circle cx="${f1(ex - 0.4)}" cy="${f1(ey - 0.5)}" r="${r * 0.4}" fill="#fff"/>` : "");
    let s = `<ellipse cx="${x}" cy="${y + 1}" rx="16" ry="3.5" fill="#1a0f24" opacity="0.25"/>`;
    switch (p) {
      case 1: // Cat
        s += T(`M ${x + 9} ${y - 4} Q ${x + 18} ${y - 8} ${x + 16} ${y - 20}`, 3, c) + E(x + 2, y - 7, 10, 7, c) + E(x - 7, y - 16, 7, 6.5, c) + S(`M ${x - 13} ${y - 19} L ${x - 12} ${y - 27} L ${x - 7} ${y - 22} Z M ${x - 5} ${y - 22} L ${x - 1} ${y - 27} L ${x - 1} ${y - 19} Z`, c, "", 0.7) + eye(x - 9.5, y - 16) + eye(x - 4.5, y - 16);
        break;
      case 2: // Dog
        s += T(`M ${x + 10} ${y - 10} Q ${x + 16} ${y - 16} ${x + 14} ${y - 22}`, 3, c) + E(x + 2, y - 8, 11, 7, c) + E(x - 8, y - 17, 7.5, 7, c) + E(x - 14, y - 14, 4, 3, lt(c, 0.25)) + S(ell(x - 3, y - 17, 3, 6), dk(c, 0.2), "", 0.7) + eye(x - 9, y - 19) + `<circle cx="${x - 17}" cy="${y - 15}" r="1.4" fill="#1c1424"/>`;
        break;
      case 3: // Owl
        s += E(x, y - 12, 10, 12, c) + E(x, y - 8, 6, 6, lt(c, 0.3), "", 0.5) + S(`M ${x - 9} ${y - 20} L ${x - 8} ${y - 28} L ${x - 3} ${y - 22} Z M ${x + 9} ${y - 20} L ${x + 8} ${y - 28} L ${x + 3} ${y - 22} Z`, c, "", 0.7) + E(x - 4, y - 17, 3.6, 3.6, "#f4f1ea", "", 0.5) + E(x + 4, y - 17, 3.6, 3.6, "#f4f1ea", "", 0.5) + eye(x - 4, y - 17, 1.6) + eye(x + 4, y - 17, 1.6) + `<path d="M ${x - 1.4} ${y - 14} L ${x + 1.4} ${y - 14} L ${x} ${y - 11} Z" fill="${GOLD}"/>`;
        break;
      case 4: // Raven
        s += S(`M ${x + 6} ${y - 8} L ${x + 18} ${y - 4} L ${x + 8} ${y - 2} Z`, dk(c, 0.2)) + E(x, y - 9, 9, 7, c) + E(x - 7, y - 17, 6, 5.5, c) + S(`M ${x - 12} ${y - 18} L ${x - 20} ${y - 16} L ${x - 12} ${y - 14} Z`, "#3a3640", "", 0.6) + eye(x - 8, y - 18);
        break;
      case 5: // Frog
        s += E(x, y - 6, 12, 7, c) + E(x - 6, y - 12, 4, 4, c) + E(x + 6, y - 12, 4, 4, c) + eye(x - 6, y - 12, 1.6) + eye(x + 6, y - 12, 1.6) + L(`M ${x - 5} ${y - 6} Q ${x} ${y - 3} ${x + 5} ${y - 6}`, "#1c1424", 0.9);
        break;
      case 6: // Dragonling
        s += S(`M ${x + 2} ${y - 14} L ${x + 12} ${y - 30} L ${x + 16} ${y - 14} Z`, dk(c, 0.15), "", 0.7) + T(`M ${x + 8} ${y - 4} Q ${x + 20} ${y - 2} ${x + 22} ${y - 12}`, 3, c) + E(x + 2, y - 8, 9, 7, c) + E(x - 7, y - 18, 7, 6, c) + S(`M ${x - 9} ${y - 23} L ${x - 11} ${y - 30} L ${x - 6} ${y - 24} Z M ${x - 4} ${y - 23} L ${x - 3} ${y - 30} L ${x - 1} ${y - 22} Z`, BONE, "", 0.6) + eye(x - 9, y - 18) + E(x + 1, y - 6, 5, 3.5, lt(c, 0.35), "", 0.4);
        break;
      case 7: // Slime
        s += `<path d="M ${x - 12} ${y} Q ${x - 13} ${y - 18} ${x} ${y - 20} Q ${x + 13} ${y - 18} ${x + 12} ${y} Z" fill="${c}" opacity="0.85" ${st.ow ? `stroke="${st.line}" stroke-width="${st.ow}"` : ""}/>` + `<ellipse cx="${x - 5}" cy="${y - 14}" rx="3" ry="2" fill="#fff" opacity="0.6"/>` + eye(x - 4, y - 8, 1.6) + eye(x + 4, y - 8, 1.6);
        break;
      case 8: // Rat
        s += T(`M ${x + 8} ${y - 3} Q ${x + 20} ${y} ${x + 22} ${y - 8}`, 1.6, "#e8a0a8") + E(x + 1, y - 6, 9, 6, c) + S(`M ${x - 6} ${y - 10} L ${x - 15} ${y - 6} L ${x - 6} ${y - 3} Z`, c, "", 0.7) + E(x - 4, y - 13, 3.6, 3.6, "#e8a0a8", "", 0.6) + eye(x - 9, y - 8, 1);
        break;
      case 9: // Fox
        s += S(`M ${x + 8} ${y - 6} Q ${x + 24} ${y - 8} ${x + 22} ${y - 22} Q ${x + 16} ${y - 12} ${x + 8} ${y - 12} Z`, c) + S(`M ${x + 22} ${y - 22} Q ${x + 23} ${y - 16} ${x + 20} ${y - 14} Q ${x + 18} ${y - 18} ${x + 22} ${y - 22} Z`, "#f4f1ea", "", 0.5) + E(x + 1, y - 7, 9, 6.5, c) + S(`M ${x - 14} ${y - 16} L ${x - 4} ${y - 22} L ${x - 2} ${y - 12} L ${x - 10} ${y - 10} Z`, c) + S(`M ${x - 10} ${y - 20} L ${x - 10} ${y - 28} L ${x - 5} ${y - 21} Z`, c, "", 0.6) + eye(x - 7, y - 16) + `<circle cx="${x - 14}" cy="${y - 15}" r="1.2" fill="#1c1424"/>`;
        break;
      case 10: // Bunny
        s += E(x + 1, y - 8, 10, 8, c) + E(x - 6, y - 16, 6.5, 6, c) + S(ell(x - 9, y - 27, 2.4, 7), c, "", 0.7) + S(ell(x - 3, y - 27, 2.4, 7), c, "", 0.7) + E(x + 11, y - 9, 3, 3, "#f4f1ea", "", 0.5) + eye(x - 7, y - 17);
        break;
    }
    return `<g transform="translate(${x} ${y}) scale(1.45) translate(${-x} ${-y})">${s}</g>`;
  }
}
