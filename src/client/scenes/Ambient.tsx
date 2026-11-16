"use client";

// Ambient scenes for when the party goes off-plan (see src/shared/ambient.ts).
// Each is one inline SVG at 1920x1080 with a little CSS motion: rain, snow,
// fog, fire, waves. Only transform and opacity move, on a few dozen groups, so
// the TV stays smooth; with reduce-motion on they hold still (globals.css,
// "ambient scenes"). No pictures, no files, nothing loaded.

import type { CSSProperties, ReactNode } from "react";
import type { AmbientId } from "@/shared/ambient";

/** A repeatable scatter, so the art is the same on every TV. */
function scatter(n: number, seed: number, w = 1920, h = 1080): [number, number, number][] {
  let x = seed;
  const r = () => ((x = (x * 9301 + 49297) % 233280) / 233280);
  return Array.from({ length: n }, () => [Math.round(r() * w), Math.round(r() * h), r()]);
}

const delay = (s: number): CSSProperties => ({ animationDelay: `${s.toFixed(2)}s` });

function Sky({ id, stops }: { id: string; stops: [number, string][] }) {
  return (
    <>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          {stops.map(([o, c]) => (
            <stop key={o} offset={o} stopColor={c} />
          ))}
        </linearGradient>
      </defs>
      <rect width="1920" height="1080" fill={`url(#${id})`} />
    </>
  );
}

function Glow({ id, color }: { id: string; color: string }) {
  return (
    <defs>
      <radialGradient id={id}>
        <stop offset="0" stopColor={color} stopOpacity="0.85" />
        <stop offset="1" stopColor={color} stopOpacity="0" />
      </radialGradient>
    </defs>
  );
}

function Stars({ n, seed, h = 520 }: { n: number; seed: number; h?: number }) {
  const all = scatter(n, seed, 1920, h);
  // Most stars are one still path; every fifth twinkles on its own.
  const still = all.filter((_, i) => i % 5).map(([x, y]) => `M${x} ${y}h0`).join("");
  return (
    <g>
      <path d={still} stroke="#eef0ff" strokeWidth={2.4} strokeLinecap="round" opacity={0.7} />
      {all
        .filter((_, i) => i % 5 === 0)
        .map(([x, y, k], i) => (
          <circle key={i} className="amb-twinkle" cx={x} cy={y} r={1.4 + k * 1.4} fill="#eef0ff" style={delay(k * 4)} />
        ))}
    </g>
  );
}

/** Two layers of rain falling: each layer is drawn twice, one screen apart, and slides down one screen. */
function Rain({ n = 46, seed = 7, slant = -10 }: { n?: number; seed?: number; slant?: number }) {
  const drops = scatter(n, seed);
  // One path per layer (each drop a short stroke), drawn twice: a screen apart.
  const layer = (cls: string, part: [number, number, number][], len: number, op: number) => {
    const d = [0, -1080].flatMap((dy) => part.map(([x, y]) => `M${x} ${y + dy}l${slant} ${len}`)).join("");
    return <path className={cls} d={d} stroke="#b9c8e6" strokeWidth={2} strokeLinecap="round" opacity={op} fill="none" />;
  };
  return (
    <g>
      {layer("amb-fall-slow", drops.slice(0, n / 2), 34, 0.35)}
      {layer("amb-fall-fast", drops.slice(n / 2), 56, 0.6)}
    </g>
  );
}

function Snow({ n = 60, seed = 11 }: { n?: number; seed?: number }) {
  const flakes = scatter(n, seed);
  // Each flake is a dot (a round cap on a zero-length stroke), one path per layer, drawn twice a screen apart.
  const layer = (cls: string, part: [number, number, number][], r: number, op: number) => {
    const d = [0, -1080].flatMap((dy) => part.map(([x, y]) => `M${x} ${y + dy}h0`)).join("");
    return <path className={cls} d={d} stroke="#ffffff" strokeWidth={r * 2} strokeLinecap="round" opacity={op} fill="none" />;
  };
  return (
    <g className="amb-sway">
      {layer("amb-snow-slow", flakes.slice(0, n / 2), 2.5, 0.55)}
      {layer("amb-snow-fast", flakes.slice(n / 2), 4, 0.85)}
    </g>
  );
}

/** Soft fog bands drifting sideways. */
function Fog({ y, color = "#d8dde6", op = 0.18 }: { y: number; color?: string; op?: number }) {
  return (
    <g>
      {[0, 1, 2].map((i) => (
        <g key={i} className={i % 2 ? "amb-drift-back" : "amb-drift"} style={delay(i * 3)}>
          <ellipse cx={500 + i * 520} cy={y + i * 40} rx={720} ry={70} fill={color} opacity={op} />
          <ellipse cx={500 + i * 520 + 1920} cy={y + i * 40} rx={720} ry={70} fill={color} opacity={op} />
        </g>
      ))}
    </g>
  );
}

function Pine({ x, y, s, fill }: { x: number; y: number; s: number; fill: string }) {
  return <path d={`M${x} ${y - 220 * s} L${x - 70 * s} ${y - 70 * s} L${x - 38 * s} ${y - 70 * s} L${x - 92 * s} ${y} L${x + 92 * s} ${y} L${x + 38 * s} ${y - 70 * s} L${x + 70 * s} ${y - 70 * s} Z`} fill={fill} />;
}

function Treeline({ y, s, fill, seed }: { y: number; s: number; fill: string; seed: number }) {
  return (
    <g>
      {scatter(16, seed, 1920, 30).map(([x, dy, k], i) => (
        <Pine key={i} x={(i * 1920) / 15 + (x % 60)} y={y + dy} s={s * (0.8 + k * 0.5)} fill={fill} />
      ))}
      <rect x="0" y={y} width="1920" height={1080 - y} fill={fill} />
    </g>
  );
}

/** A flame: three tongues that flicker out of step. */
function Flame({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <circle r={150} fill="url(#amb-fire-glow)" className="amb-pulse" />
      <path className="amb-flicker" d="M0 0 C-40 -30 -30 -90 0 -150 C30 -90 40 -30 0 0 Z" fill="#f08a2c" />
      <path className="amb-flicker" style={delay(0.3)} d="M-18 0 C-44 -24 -38 -64 -20 -100 C2 -64 8 -24 -18 0 Z" fill="#f6b04a" />
      <path className="amb-flicker" style={delay(0.6)} d="M14 0 C-6 -20 -2 -60 16 -88 C34 -56 36 -20 14 0 Z" fill="#ffd77a" />
    </g>
  );
}

function Torch({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x - 6} y={y} width={12} height={70} rx={4} fill="#3b2a1c" />
      <Flame x={x} y={y + 4} s={0.42} />
    </g>
  );
}

function Window({ x, y, w = 46, h = 60, i = 0 }: { x: number; y: number; w?: number; h?: number; i?: number }) {
  return (
    <g>
      <rect className={i % 3 === 0 ? "amb-glimmer" : undefined} style={delay(i * 0.7)} x={x} y={y} width={w} height={h} rx={4} fill="#ffc86b" />
      <line x1={x + w / 2} y1={y} x2={x + w / 2} y2={y + h} stroke="#2a1c12" strokeWidth={4} />
      <line x1={x} y1={y + h / 2} x2={x + w} y2={y + h / 2} stroke="#2a1c12" strokeWidth={4} />
    </g>
  );
}

function House({ x, base, w, h, roof, fill, snow, win = true }: { x: number; base: number; w: number; h: number; roof: number; fill: string; snow?: boolean; win?: boolean }) {
  const top = base - h;
  return (
    <g>
      <rect x={x} y={top} width={w} height={h} fill={fill} />
      <path d={`M${x - 16} ${top} L${x + w / 2} ${top - roof} L${x + w + 16} ${top} Z`} fill={fill} />
      {snow ? <path d={`M${x - 18} ${top + 2} L${x + w / 2} ${top - roof} L${x + w + 18} ${top + 2} L${x + w + 4} ${top + 14} L${x + w / 2} ${top - roof + 18} L${x - 4} ${top + 14} Z`} fill="#eef3fb" /> : null}
      {win ? (
        <>
          <Window x={x + w * 0.2} y={top + h * 0.25} i={x} />
          <Window x={x + w * 0.62} y={top + h * 0.25} i={x + 1} />
        </>
      ) : null}
    </g>
  );
}

function Person({ x, y, s = 1, fill, bob }: { x: number; y: number; s?: number; fill: string; bob?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {/* The bob moves an inner group: a CSS transform would replace the placement above. */}
      <g className={bob !== undefined ? "amb-bob" : undefined} style={bob !== undefined ? delay(bob) : undefined}>
        <circle cx={0} cy={-150} r={34} fill={fill} />
        <path d="M-58 0 C-58 -70 -40 -110 0 -110 C40 -110 58 -70 58 0 Z" fill={fill} />
      </g>
    </g>
  );
}

function Waves({ y, color, n = 3, op = 0.5 }: { y: number; color: string; n?: number; op?: number }) {
  const wave = (yy: number) => {
    let d = `M0 ${yy}`;
    for (let x = 0; x < 3840; x += 160) d += ` q40 -18 80 0 t80 0`;
    return d + ` V1080 H0 Z`;
  };
  return (
    <g>
      {Array.from({ length: n }, (_, i) => (
        <g key={i} className={i % 2 ? "amb-wave-back" : "amb-wave"} style={delay(i * 1.3)}>
          <path d={wave(y + i * 46)} fill={color} opacity={op - i * 0.08} transform={`translate(${-i * 60} 0)`} />
        </g>
      ))}
    </g>
  );
}

// --- Storyteller pieces --------------------------------------------------

/** A path template with whole numbers, to keep the markup small. */
const P = (strs: TemplateStringsArray, ...v: number[]) => v.reduce<string>((out, x, i) => out + Math.round(x) + strs[i + 1], strs[0]);
const R = Math.round;

/** Inline style for a spark or wisp: a delay plus how far it drifts. */
const drift = (s: number, dx: number, dy?: number, dur?: number): CSSProperties =>
  ({ animationDelay: `${s.toFixed(1)}s`, "--dx": `${R(dx)}px`, ...(dy !== undefined ? { "--dy": `${R(dy)}px` } : {}), ...(dur ? { animationDuration: `${dur}s` } : {}) }) as CSSProperties;

/** Sparks rising off a fire, each on its own drift. */
function Embers({ x, y, w, n, seed, color = "#ffcf6a", rise = -420, dur }: { x: number; y: number; w: number; n: number; seed: number; color?: string; rise?: number; dur?: number }) {
  return (
    <g fill={color}>
      {scatter(n, seed, w, 40).map(([dx, dy, k], i) => (
        <circle key={i} className="amb-ember" style={drift(k * 5, (k - 0.5) * 160, rise * (0.7 + k * 0.5), dur)} cx={R(x - w / 2 + dx)} cy={R(y + dy)} r={R(2 + k * 3)} />
      ))}
    </g>
  );
}

/** Thin smoke rising and spreading. */
function Smoke({ id, x, y, n = 4, color = "#9a96a8", op = 0.22, size = 60 }: { id: string; x: number; y: number; n?: number; color?: string; op?: number; size?: number }) {
  return (
    <g opacity={op}>
      <Glow id={id} color={color} />
      {Array.from({ length: n }, (_, i) => (
        <ellipse key={i} className="amb-smoke" style={drift(i * (7 / n), i % 2 ? 60 : -40)} cx={x} cy={y} rx={size} ry={size * 0.7} fill={`url(#${id})`} />
      ))}
    </g>
  );
}

/** A candle: wax, a few drips, a brass dish and a small flame with its own glow. */
function Candle({ x, base, h, w, wax = "url(#amb-wax)", glow = "amb-candle-glow" }: { x: number; base: number; h: number; w: number; wax?: string; glow?: string }) {
  const top = base - h;
  const l = x - w / 2;
  return (
    <g>
      <ellipse cx={x} cy={base + 6} rx={R(w * 1.25)} ry={R(w * 0.26)} fill="#7a5a2a" />
      <ellipse cx={x} cy={base} rx={R(w * 1.1)} ry={R(w * 0.2)} fill="#b8893e" />
      <rect x={l} y={top} width={w} height={h} fill={wax} />
      <ellipse cx={x} cy={top} rx={R(w / 2)} ry={R(w * 0.12)} fill="#f3e2c0" />
      <path d={P`M${l} ${top} q${w * 0.1} ${h * 0.25} ${w * 0.04} ${h * 0.32} q-${w * 0.1} ${h * 0.04} -${w * 0.08} -${h * 0.18} Z`} fill="#f0dcb4" />
      <path d={P`M${l + w * 0.62} ${top + 2} q${w * 0.06} ${h * 0.12} ${w * 0.02} ${h * 0.16} q-${w * 0.08} 0 -${w * 0.06} -${h * 0.14} Z`} fill="#f6e6c6" />
      <path d={P`M${l + w} ${top} q-${w * 0.02} ${h * 0.4} ${w * 0.05} ${h * 0.46} q${w * 0.06} -${h * 0.06} 0 -${h * 0.46} Z`} fill="#e2caa0" />
      <line x1={x} y1={top} x2={x + 2} y2={R(top - w * 0.22)} stroke="#2a1c12" strokeWidth={R(Math.max(3, w * 0.05))} strokeLinecap="round" />
      <g transform={`translate(${x} ${R(top - w * 0.12)}) scale(${(w / 240).toFixed(3)})`}>
        <circle r={300} fill={`url(#${glow})`} className="amb-pulse" />
        <path className="amb-flicker" d="M0 0 C-50 -40 -40 -130 0 -210 C40 -130 50 -40 0 0 Z" fill="#f6a640" />
        <path className="amb-flicker" style={delay(0.35)} d="M0 -6 C-30 -36 -24 -100 2 -160 C26 -100 30 -36 0 -6 Z" fill="#ffe08a" />
        <ellipse cx={0} cy={-20} rx={10} ry={22} fill="#7fa6ff" opacity={0.6} />
      </g>
    </g>
  );
}

/** A seated wizard in silhouette, facing right: pointed hat, beard, staff with a glowing stone. */
function Wizard({ x, y, s = 1, fill = "#0c0b12", beard = "#b9ab98", orb = "amb-orb" }: { x: number; y: number; s?: number; fill?: string; beard?: string; orb?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <line x1={-150} y1={10} x2={-104} y2={-430} stroke="#1a1208" strokeWidth={14} strokeLinecap="round" />
      <path d="M-104 -430 c-20 -10 -24 -36 -6 -50 c18 10 22 36 6 50 Z" fill="#1a1208" />
      <circle cx={-104} cy={-452} r={70} fill={`url(#${orb})`} className="amb-pulse" />
      <circle cx={-104} cy={-452} r={14} fill="#d9ecff" />
      <path d="M-100 10 C-104 -90 -80 -200 -20 -244 C40 -236 74 -178 84 -116 L168 -98 C188 -60 184 -20 172 10 Z" fill={fill} />
      <path d="M-40 -170 C-90 -170 -126 -180 -128 -206 C-110 -214 -70 -200 -30 -196 Z" fill={fill} />
      <circle cx={-122} cy={-204} r={16} fill={fill} />
      <circle cx={14} cy={-266} r={32} fill={fill} />
      <path d="M22 -258 C70 -242 66 -186 46 -150 C30 -184 14 -222 6 -248 Z" fill={beard} opacity={0.8} />
      <ellipse cx={8} cy={-292} rx={70} ry={13} fill={fill} />
      <path d="M-36 -294 C-22 -352 -2 -404 -52 -460 C8 -430 36 -366 50 -294 Z" fill={fill} />
      <path d="M-34 -306 L48 -306" stroke="#3b2f52" strokeWidth={8} />
      <path d="M-4 -340 l4 -10 l4 10 l10 2 l-8 6 l2 10 l-8 -5 l-8 5 l2 -10 l-8 -6 Z" fill="#e9d48a" opacity={0.85} />
    </g>
  );
}

function Log({ x, y, w, h = 46, fill = "#3a2618", end = "#6b4a2e", tilt = 0 }: { x: number; y: number; w: number; h?: number; fill?: string; end?: string; tilt?: number }) {
  return (
    <g transform={`rotate(${tilt} ${x} ${y})`}>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={h / 2} fill={fill} />
      <ellipse cx={x + w / 2 - h / 4} cy={y} rx={h / 4} ry={h / 2 - 2} fill={end} />
      <ellipse cx={x + w / 2 - h / 4} cy={y} rx={h / 9} ry={h / 5} fill={fill} opacity={0.6} />
    </g>
  );
}

/** A ring of stones around a fire; `front` draws only the stones nearer the viewer (so the fire sits inside the ring). */
function StoneRing({ cx, cy, rx, ry, front, lit = "#8a6a52", dark = "#3a302c" }: { cx: number; cy: number; rx: number; ry: number; front: boolean; lit?: string; dark?: string }) {
  // Each stone is two ellipses (body and lit top), drawn as arcs in two paths.
  const oval = (x: number, y: number, a: number, b: number) => P`M${x - a} ${y}a${a} ${b} 0 1 0 ${2 * a} 0a${a} ${b} 0 1 0 ${-2 * a} 0`;
  let body = "";
  let top = "";
  for (let i = 0; i < 16; i++) {
    const t = (i / 16) * Math.PI * 2;
    if (Math.sin(t) > 0 !== front) continue;
    const x = cx + Math.cos(t) * rx;
    const y = cy + Math.sin(t) * ry;
    const w = 40 + ((i * 7) % 3) * 8;
    body += oval(x, y, w, w * 0.6);
    top += front ? oval(x, y - w * 0.36, w * 0.66, w * 0.2) : oval(x, y - w * 0.18, w * 0.8, w * 0.36);
  }
  return (
    <g>
      <path d={body} fill={dark} />
      <path d={top} fill={lit} opacity={front ? 0.75 : 0.9} />
    </g>
  );
}

/** A line of pines as one path (smaller than Treeline, for scenes with a lot else going on). */
function Pines({ y, s, fill, seed }: { y: number; s: number; fill: string; seed: number }) {
  const d = scatter(16, seed, 1920, 30)
    .map(([x, dy, k], i) => {
      const px = (i * 1920) / 15 + (x % 60);
      const py = y + dy;
      const z = s * (0.8 + k * 0.5);
      return P`M${px} ${py - 220 * z}L${px - 70 * z} ${py - 70 * z}H${px - 38 * z}L${px - 92 * z} ${py}H${px + 92 * z}L${px + 38 * z} ${py - 70 * z}H${px + 70 * z}Z`;
    })
    .join("");
  return <path d={d + `M0 ${y}H1920V1080H0Z`} fill={fill} />;
}

function Moon({ id, x, y, r }: { id: string; x: number; y: number; r: number }) {
  return (
    <g>
      <defs>
        <mask id={id}>
          <circle cx={x} cy={y} r={r} fill="#fff" />
          <circle cx={x + r * 0.42} cy={y - r * 0.2} r={r * 0.9} fill="#000" />
        </mask>
      </defs>
      <circle cx={x} cy={y} r={r * 3} fill="url(#amb-moon-glow)" opacity={0.6} />
      <circle cx={x} cy={y} r={r} fill="#f4ecd2" mask={`url(#${id})`} />
    </g>
  );
}


/** A shelf of books with repeatable widths, heights and colours. */
function Shelf({ x, y, w, seed }: { x: number; y: number; w: number; seed: number }) {
  const colors = ["#6a2a2a", "#2f4a3a", "#3a3a66", "#7a5a2a", "#4a2a4a", "#2a4a5a", "#5a3a22"];
  // One path per colour (and one for the gilt bands) keeps a shelf of books small.
  const out: string[] = colors.map(() => "");
  let bands = "";
  let cx = x + 10;
  scatter(30, seed, 100, 100).forEach(([a, b, k], i) => {
    const bw = 30 + (a % 34);
    if (cx + bw > x + w - 10) return;
    if (i % 9 === 5) {
      cx += 24; // a gap
      return;
    }
    const bh = 100 + (b % 50);
    out[Math.floor(k * colors.length)] += `M${cx} ${y - bh}h${bw}v${bh}h${-bw}Z`;
    bands += `M${cx} ${R(y - bh * 0.84)}h${bw}`;
    cx += bw + 3;
  });
  return (
    <g>
      {out.map((d, i) => (d ? <path key={i} d={d} fill={colors[i]} /> : null))}
      <path d={bands} stroke="#d8b86a" strokeWidth={5} opacity={0.6} />
      <path d={`M${x - 6} ${y}h${w + 12}v18h${-w - 12}Z`} fill="#2a1a10" stroke="#5a3d24" strokeWidth={3} />
    </g>
  );
}

function Potion({ x, base, r, liquid, glow, i }: { x: number; base: number; r: number; liquid: string; glow: string; i: number }) {
  const cy = base - r;
  return (
    <g>
      <circle cx={x} cy={cy} r={R(r * 2.4)} fill={`url(#${glow})`} className="amb-pulse" style={delay(i * 0.9)} />
      <rect x={R(x - r * 0.3)} y={R(cy - r * 1.9)} width={R(r * 0.6)} height={R(r * 1.2)} fill="#9ab0b8" opacity={0.55} />
      <rect x={R(x - r * 0.38)} y={R(cy - r * 2.1)} width={R(r * 0.76)} height={R(r * 0.32)} rx={3} fill="#6a4a2a" />
      <circle cx={x} cy={cy} r={r} fill="#9ab0b8" opacity={0.35} />
      <path d={P`M${x - r * 0.96} ${cy + r * 0.1} A${r} ${r} 0 0 0 ${x + r * 0.96} ${cy + r * 0.1} Z`} fill={liquid} className="amb-glimmer" style={delay(i * 1.3)} />
    </g>
  );
}

function OpenBook({ cx, y, w, h, cover = "#5a1e22", page = "#efe2c4", turn }: { cx: number; y: number; w: number; h: number; cover?: string; page?: string; turn?: boolean }) {
  const half = w / 2;
  const left = `M${cx} ${y} C${cx - half * 0.3} ${y - h * 0.1} ${cx - half * 0.7} ${y - h * 0.08} ${cx - half} ${y + h * 0.06} L${cx - half * 1.02} ${y + h} C${cx - half * 0.7} ${y + h * 0.88} ${cx - half * 0.3} ${y + h * 0.9} ${cx} ${y + h * 1.02} Z`;
  const right = `M${cx} ${y} C${cx + half * 0.3} ${y - h * 0.1} ${cx + half * 0.7} ${y - h * 0.08} ${cx + half} ${y + h * 0.06} L${cx + half * 1.02} ${y + h} C${cx + half * 0.7} ${y + h * 0.88} ${cx + half * 0.3} ${y + h * 0.9} ${cx} ${y + h * 1.02} Z`;
  const lines = (side: -1 | 1) =>
    Array.from({ length: 9 }, (_, i) => {
      const yy = y + h * 0.16 + i * h * 0.085;
      const len = half * (i === 8 ? 0.4 : 0.66 - ((i * 13) % 5) * 0.02);
      const x0 = cx + side * half * 0.14;
      return P`M${x0} ${yy}h${side * len}`;
    }).join("");
  return (
    <g>
      <path d={P`M${cx - half * 1.08} ${y + h * 0.02} L${cx - half * 1.1} ${y + h * 1.08} Q${cx} ${y + h * 1.2} ${cx + half * 1.1} ${y + h * 1.08} L${cx + half * 1.08} ${y + h * 0.02} Q${cx} ${y + h * 0.1} ${cx - half * 1.08} ${y + h * 0.02} Z`} fill={cover} />
      <path d={left} fill={page} />
      <path d={right} fill={page} />
      <path d={left} fill="url(#amb-page-shade)" opacity={0.5} />
      <path d={lines(-1) + lines(1)} stroke="#8a765a" strokeWidth={R(Math.max(2, h * 0.022))} strokeLinecap="round" opacity={0.55} />
      <path d={P`M${cx} ${y}V${y + h * 1.02}`} stroke="#b9a37c" strokeWidth={3} />
      {turn ? (
        <g className="amb-page" style={{ transformOrigin: `${cx}px ${y}px` }}>
          <path d={right} fill="#f6ebd2" />
        </g>
      ) : null}
    </g>
  );
}

// ---------------------------------------------------------------------------

const SCENES: Record<AmbientId, () => ReactNode> = {
  "forest-road": () => (
    <>
      <Sky id="amb-sky-forest" stops={[[0, "#2d3a5a"], [0.55, "#a8705a"], [1, "#e8b07a"]]} />
      <Treeline y={640} s={1} fill="#3a4a46" seed={3} />
      <Fog y={640} op={0.1} />
      <Treeline y={760} s={1.6} fill="#23302d" seed={9} />
      <path d="M700 1080 L955 735 L985 735 L1240 1080 Z" fill="#6b4e36" />
      <path d="M820 1080 L962 740 L978 740 L1120 1080 Z" fill="#7d5c40" />
      <Fog y={880} color="#e6dccd" op={0.08} />
      {scatter(14, 21, 1920, 300).map(([x, y, k], i) => (
        <circle key={i} className="amb-firefly" style={delay(k * 6)} cx={x} cy={700 + y} r={4} fill="#ffe89a" />
      ))}
    </>
  ),
  "rainy-night": () => (
    <>
      <Sky id="amb-sky-rain" stops={[[0, "#0e1424"], [1, "#27324a"]]} />
      <Glow id="amb-lamp" color="#ffcf7a" />
      <House x={120} base={900} w={300} h={360} roof={130} fill="#151a26" />
      <House x={520} base={900} w={240} h={290} roof={110} fill="#1b2130" />
      <House x={1180} base={900} w={320} h={400} roof={140} fill="#151a26" />
      <House x={1580} base={900} w={240} h={300} roof={100} fill="#1b2130" />
      <rect x="0" y="900" width="1920" height="180" fill="#121722" />
      <rect x="958" y="560" width="10" height="340" fill="#0b0e15" />
      <circle cx="963" cy="560" r="160" fill="url(#amb-lamp)" className="amb-pulse" />
      <rect x="940" y="530" width="46" height="56" rx="8" fill="#ffd98a" />
      <g opacity="0.18">
        <ellipse cx="963" cy="960" rx="220" ry="18" fill="#ffcf7a" className="amb-glimmer" />
      </g>
      <Rain />
    </>
  ),
  "snowy-street": () => (
    <>
      <Sky id="amb-sky-snow" stops={[[0, "#1d2b4a"], [1, "#5b6f94"]]} />
      <Glow id="amb-lamp" color="#ffd690" />
      <Stars n={40} seed={5} h={360} />
      <House x={80} base={880} w={320} h={380} roof={150} fill="#2b2f3d" snow />
      <House x={470} base={880} w={260} h={300} roof={120} fill="#343847" snow />
      <House x={1160} base={880} w={300} h={360} roof={140} fill="#2b2f3d" snow />
      <House x={1540} base={880} w={300} h={320} roof={130} fill="#343847" snow />
      <rect x="0" y="870" width="1920" height="210" fill="#e3e9f3" />
      <path d="M0 900 C400 880 700 930 960 910 C1300 885 1600 930 1920 900 V1080 H0 Z" fill="#cfd8e6" />
      <rect x="896" y="560" width="10" height="320" fill="#1c1f29" />
      <circle cx="901" cy="560" r="150" fill="url(#amb-lamp)" className="amb-pulse" />
      <rect x="880" y="532" width="42" height="52" rx="8" fill="#ffe0a0" />
      <Snow />
    </>
  ),
  "tavern-crowd": () => (
    <>
      <Sky id="amb-sky-tavern" stops={[[0, "#3a2416"], [1, "#6e4428"]]} />
      <Glow id="amb-fire-glow" color="#ff9a3c" />
      <Glow id="amb-lamp" color="#ffc566" />
      {[180, 640, 1100, 1560].map((x) => (
        <rect key={x} x={x} y={0} width={46} height={1080} fill="#2a190e" />
      ))}
      <rect x="0" y="120" width="1920" height="40" fill="#2a190e" />
      <rect x="1380" y="560" width="400" height="300" rx="10" fill="#24150b" />
      <Flame x={1580} y={840} s={0.9} />
      {[420, 960, 1360].map((x, i) => (
        <g key={x} className="amb-swing" style={{ ...delay(i * 0.8), transformOrigin: `${x}px 160px` }}>
          <line x1={x} y1={160} x2={x} y2={300} stroke="#1c1108" strokeWidth={4} />
          <circle cx={x} cy={330} r={120} fill="url(#amb-lamp)" />
          <rect x={x - 18} y={300} width={36} height={50} rx={8} fill="#ffd37a" />
        </g>
      ))}
      {scatter(9, 31, 1600, 60).map(([x, y], i) => (
        <Person key={i} x={120 + (i * 1700) / 8 + (x % 40)} y={1000 + y} s={1.1 + (i % 3) * 0.15} fill={i % 2 ? "#1d110a" : "#26160d"} bob={i * 0.45} />
      ))}
      <rect x="0" y="1010" width="1920" height="70" fill="#1a0f08" />
    </>
  ),
  campfire: () => (
    <>
      <Sky id="amb-sky-camp" stops={[[0, "#0b1022"], [1, "#23233a"]]} />
      <Glow id="amb-fire-glow" color="#ff9a3c" />
      <Stars n={70} seed={13} />
      <Treeline y={720} s={1.3} fill="#0e1218" seed={17} />
      <ellipse cx="960" cy="930" rx="520" ry="90" fill="#3a2a1c" opacity="0.6" />
      <rect x="860" y="900" width="200" height="22" rx="10" fill="#4a3020" transform="rotate(-12 960 910)" />
      <rect x="860" y="900" width="200" height="22" rx="10" fill="#3d2718" transform="rotate(14 960 910)" />
      <Flame x={960} y={905} s={1.2} />
      {scatter(10, 41, 160, 40).map(([x, , k], i) => (
        <circle key={i} className="amb-spark" style={delay(k * 3)} cx={890 + x} cy={860} r={3} fill="#ffcf6a" />
      ))}
      <Person x={560} y={960} s={1.2} fill="#0d0f14" />
      <Person x={1380} y={960} s={1.1} fill="#0d0f14" />
    </>
  ),
  coastline: () => (
    <>
      <Sky id="amb-sky-coast" stops={[[0, "#7f9cc0"], [0.6, "#e4c9a4"], [1, "#f1dcb9"]]} />
      <circle cx="1460" cy="470" r="70" fill="#fff1cf" opacity="0.9" />
      <g className="amb-drift">
        {[220, 900, 1600, 2140, 2820, 3520].map((x, i) => (
          <ellipse key={i} cx={x} cy={180 + (i % 3) * 60} rx={160} ry={34} fill="#ffffff" opacity={0.55} />
        ))}
      </g>
      <rect x="0" y="560" width="1920" height="520" fill="#4c7192" />
      <Waves y={600} color="#5f87a8" n={4} op={0.7} />
      <path d="M0 520 L180 470 L320 520 L420 640 L520 760 L620 1080 L0 1080 Z" fill="#4a4036" />
      <path d="M0 640 L240 600 L380 720 L470 1080 L0 1080 Z" fill="#3a322a" />
      <path d="M1920 760 C1700 780 1500 860 1360 1080 H1920 Z" fill="#d9c49a" />
      {[0, 1, 2].map((i) => (
        <g key={i} className="amb-glide" style={delay(i * 2.5)}>
          <path d={`M${700 + i * 160} ${300 + i * 40} q14 -12 28 0 q14 -12 28 0`} stroke="#2e3640" strokeWidth={4} fill="none" />
        </g>
      ))}
    </>
  ),
  "river-dusk": () => (
    <>
      <Sky id="amb-sky-river" stops={[[0, "#3b2c56"], [0.5, "#c0657a"], [0.75, "#f0a160"], [1, "#f7c784"]]} />
      <circle cx="960" cy="600" r="110" fill="#ffd38a" />
      <path d="M0 620 L120 600 L160 560 L200 600 L360 590 L420 540 L470 590 L700 610 L1240 610 L1300 560 L1340 520 L1380 560 L1440 600 L1700 590 L1760 550 L1800 590 L1920 600 V680 H0 Z" fill="#3a2a40" />
      <rect x="0" y="660" width="1920" height="420" fill="#6a4a6a" />
      <rect x="0" y="660" width="1920" height="420" fill="#f0a160" opacity="0.18" />
      {Array.from({ length: 9 }, (_, i) => (
        <rect key={i} className="amb-shimmer" style={delay(i * 0.5)} x={880 - i * 14} y={690 + i * 34} width={160 + i * 28} height={6} rx={3} fill="#ffd38a" opacity={0.6} />
      ))}
      <Fog y={700} color="#f6d2c0" op={0.12} />
      {scatter(22, 51, 1920, 40).map(([x, , k], i) => (
        <g key={i} className="amb-reed" style={{ ...delay(k * 3), transformOrigin: `${x}px 1080px` }}>
          <path d={`M${x} 1080 Q${x + 10} ${960 - k * 60} ${x + 4} ${880 - k * 80}`} stroke="#2a1d26" strokeWidth={6} fill="none" />
        </g>
      ))}
    </>
  ),
  "cave-mouth": () => (
    <>
      <Sky id="amb-sky-cave" stops={[[0, "#6f7f8a"], [1, "#b7b39e"]]} />
      <path d="M400 860 C600 760 760 820 960 760 C1160 700 1360 780 1560 740 V1080 H400 Z" fill="#7d8a72" />
      <path d="M400 920 C700 860 1100 900 1560 860 V1080 H400 Z" fill="#5f6b55" />
      <path d="M0 0 H1920 V1080 H1500 C1480 760 1360 420 960 380 C560 420 440 760 420 1080 H0 Z" fill="#2c2722" />
      <path d="M0 0 H1920 V200 C1600 300 1300 240 960 300 C600 240 300 320 0 220 Z" fill="#3a332c" />
      <rect x="0" y="1000" width="1920" height="80" fill="#211d19" />
      <Fog y={930} color="#c9c6b8" op={0.22} />
      {[700, 960, 1180, 860].map((x, i) => (
        <circle key={i} className="amb-drip" style={delay(i * 1.4)} cx={x} cy={470 + (i % 2) * 30} r={6} fill="#9fb4c0" />
      ))}
    </>
  ),
  "dungeon-corridor": () => (
    <>
      <rect width="1920" height="1080" fill="#14110f" />
      <path d="M0 0 L760 360 L760 720 L0 1080 Z" fill="#2a241f" />
      <path d="M1920 0 L1160 360 L1160 720 L1920 1080 Z" fill="#2a241f" />
      <path d="M0 1080 L760 720 L1160 720 L1920 1080 Z" fill="#1f1a16" />
      <path d="M0 0 L760 360 L1160 360 L1920 0 Z" fill="#1a1613" />
      <rect x="760" y="360" width="400" height="360" fill="#050404" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <g key={i} stroke="#1a1613" strokeWidth={4}>
          <line x1={0} y1={120 + i * 150} x2={760} y2={400 + i * 50} />
          <line x1={1920} y1={120 + i * 150} x2={1160} y2={400 + i * 50} />
        </g>
      ))}
      <Glow id="amb-fire-glow" color="#ff9a3c" />
      <Torch x={300} y={420} />
      <Torch x={1620} y={420} />
      <Torch x={620} y={480} />
      <Torch x={1300} y={480} />
      {scatter(16, 61, 900, 600).map(([x, y, k], i) => (
        <circle key={i} className="amb-mote" style={delay(k * 8)} cx={510 + x} cy={240 + y} r={2} fill="#d8c3a0" opacity={0.5} />
      ))}
    </>
  ),
  "market-day": () => (
    <>
      <Sky id="amb-sky-market" stops={[[0, "#8fc0e6"], [1, "#e9f1f4"]]} />
      <g className="amb-drift">
        {[260, 1000, 1700, 2180, 2920, 3620].map((x, i) => (
          <ellipse key={i} cx={x} cy={150 + (i % 2) * 70} rx={170} ry={40} fill="#ffffff" opacity={0.85} />
        ))}
      </g>
      <House x={60} base={760} w={340} h={360} roof={130} fill="#c9a77c" win={false} />
      <House x={1500} base={760} w={360} h={380} roof={140} fill="#b8956c" win={false} />
      <rect x="0" y="740" width="1920" height="340" fill="#c7b08a" />
      {[
        [300, "#b0473a"],
        [760, "#4f7a9a"],
        [1220, "#c99a3a"],
      ].map(([x, c]) => (
        <g key={x as number}>
          <rect x={(x as number) + 20} y={640} width={12} height={240} fill="#5a3d24" />
          <rect x={(x as number) + 348} y={640} width={12} height={240} fill="#5a3d24" />
          <rect x={(x as number) + 20} y={780} width={340} height={100} fill="#7a5532" />
          {[0, 1, 2, 3, 4].map((k) => (
            <path key={k} d={`M${(x as number) + k * 76} 640 h76 v50 q-38 26 -76 0 Z`} fill={k % 2 ? "#f3ead8" : (c as string)} />
          ))}
        </g>
      ))}
      <g className="amb-flap" style={{ transformOrigin: "960px 470px" }}>
        <path d="M0 470 Q960 560 1920 470" stroke="#5a3d24" strokeWidth={4} fill="none" />
        {Array.from({ length: 16 }, (_, i) => (
          <path key={i} d={`M${60 + i * 116} ${480 + Math.sin((i / 15) * Math.PI) * 70} l26 46 l26 -46 Z`} fill={["#b0473a", "#c99a3a", "#4f7a9a", "#5d8a5a"][i % 4]} />
        ))}
      </g>
      {scatter(8, 71, 1700, 40).map(([x, y], i) => (
        <Person key={i} x={140 + (i * 1640) / 7 + (x % 50)} y={1040 + y} s={0.95 + (i % 3) * 0.12} fill={["#6a4a3a", "#4a3a4a", "#3a4a4a"][i % 3]} bob={i * 0.6} />
      ))}
    </>
  ),
  "ship-deck": () => (
    <>
      <Sky id="amb-sky-ship" stops={[[0, "#5c7ea6"], [1, "#d7e2e8"]]} />
      <g className="amb-roll" style={{ transformOrigin: "960px 1080px" }}>
        <rect x="-200" y="560" width="2320" height="520" fill="#3e6688" />
        <Waves y={590} color="#5a82a4" n={3} op={0.6} />
      </g>
      <path d="M0 1080 L260 780 L1660 780 L1920 1080 Z" fill="#8a6440" />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <line key={i} x1={360 + i * 200} y1={780} x2={i * 320} y2={1080} stroke="#6e4e30" strokeWidth={4} />
      ))}
      <rect x="0" y="760" width="1920" height="30" fill="#5a3d24" />
      <rect x="620" y="120" width="680" height="16" rx="8" fill="#5a3d24" />
      <rect x="660" y="600" width="600" height="14" rx="7" fill="#5a3d24" />
      <g className="amb-billow" style={{ transformOrigin: "960px 128px" }}>
        <path d="M640 136 L1280 136 Q1330 370 1250 600 L670 600 Q590 370 640 136 Z" fill="#efe4cc" />
        <path d="M630 290 Q960 320 1290 290 M620 450 Q960 480 1300 450" stroke="#d6c8aa" strokeWidth={4} fill="none" />
      </g>
      <rect x="940" y="0" width="40" height="790" fill="#5a3d24" />
      <line x1="960" y1="40" x2="140" y2="770" stroke="#3a2a1a" strokeWidth={3} />
      <line x1="960" y1="40" x2="1780" y2="770" stroke="#3a2a1a" strokeWidth={3} />
    </>
  ),
  // --- Storyteller scenes ---------------------------------------------------
  fireside: () => (
    <>
      <Sky id="amb-sky-fireside" stops={[[0, "#070b1c"], [0.6, "#1a1838"], [1, "#2c1e2a"]]} />
      <Glow id="amb-fire-glow" color="#ff9a3c" />
      <Glow id="amb-moon-glow" color="#c9d4ff" />
      <Glow id="amb-orb" color="#9cc8ff" />
      <defs>
        <radialGradient id="amb-fireside-ground" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#d9762c" stopOpacity="0.55" />
          <stop offset="0.5" stopColor="#7a3a1c" stopOpacity="0.3" />
          <stop offset="1" stopColor="#2a1a14" stopOpacity="0" />
        </radialGradient>
      </defs>
      <Stars n={30} seed={23} h={560} />
      <Moon id="amb-fireside-moon" x={1210} y={150} r={52} />
      <path d="M0 640 C220 590 420 610 640 580 C860 550 1080 600 1300 570 C1520 545 1720 590 1920 570 V760 H0 Z" fill="#141428" />
      <Pines y={700} s={1.1} fill="#0e0f1c" seed={29} />
      <rect x="0" y="760" width="1920" height="320" fill="#17110f" />
      <ellipse cx="960" cy="880" rx="900" ry="230" fill="url(#amb-fireside-ground)" className="amb-pulse" />
      <StoneRing cx={960} cy={880} rx={230} ry={56} front={false} />
      <Log x={960} y={880} w={300} h={40} tilt={-10} fill="#2e1d12" />
      <Log x={960} y={880} w={300} h={40} tilt={168} fill="#26180f" />
      <Smoke id="amb-fireside-smoke" x={960} y={600} n={3} op={0.35} size={80} />
      <Flame x={900} y={880} s={1.3} />
      <Flame x={1025} y={884} s={1.2} />
      <Flame x={960} y={878} s={2.1} />
      <Embers x={960} y={760} w={180} n={12} seed={37} rise={-440} />
      <StoneRing cx={960} cy={880} rx={230} ry={56} front />
      <Log x={430} y={1000} w={380} h={70} tilt={-4} fill="#24170e" end="#5a3d24" />
      <Wizard x={430} y={970} s={1.15} />
      <Log x={1480} y={1010} w={360} h={66} tilt={5} fill="#24170e" end="#5a3d24" />
      <Person x={1560} y={985} s={1.15} fill="#0c0b12" />
      <Log x={1130} y={1060} w={300} h={56} tilt={-2} fill="#20140c" end="#4e3520" />
    </>
  ),
  "flickering-candle": () => (
    <>
      <rect width="1920" height="1080" fill="#0c0806" />
      <Glow id="amb-candle-glow" color="#ffb352" />
      <defs>
        <linearGradient id="amb-wax" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#b89a6a" />
          <stop offset="0.35" stopColor="#f3e2c0" />
          <stop offset="0.7" stopColor="#e4cca0" />
          <stop offset="1" stopColor="#8a6e48" />
        </linearGradient>
        <radialGradient id="amb-candle-room" cx="0.5" cy="0.42" r="0.6">
          <stop offset="0" stopColor="#7a4a22" stopOpacity="0.9" />
          <stop offset="0.45" stopColor="#3a2414" stopOpacity="0.7" />
          <stop offset="1" stopColor="#0c0806" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="1920" height="1080" fill="url(#amb-candle-room)" className="amb-breathe" />
      <rect x="0" y="830" width="1920" height="250" fill="#2a170c" />
      <rect x="0" y="830" width="1920" height="8" fill="#5a3418" />
      {[880, 930, 990, 1050].map((yy, i) => (
        <path key={i} d={`M0 ${yy} C500 ${yy - 6} 1400 ${yy + 8} 1920 ${yy}`} stroke="#1e1008" strokeWidth={3} fill="none" opacity={0.7} />
      ))}
      <g opacity={0.16}>
        <ellipse cx="960" cy="860" rx="520" ry="50" fill="#ffb352" className="amb-breathe" />
      </g>
      <OpenBook cx={1520} y={808} w={380} h={56} cover="#3a1216" page="#d9c49c" />
      <Candle x={700} base={850} h={170} w={70} />
      <Candle x={1230} base={846} h={110} w={56} />
      <Candle x={960} base={856} h={360} w={120} />
      <Smoke id="amb-candle-smoke" x={1230} y={660} n={3} op={0.3} size={30} color="#c9bfae" />
      <path d="M520 810 l18 -40 l14 40 Z" fill="#1e1008" opacity={0.6} />
    </>
  ),
  "wizard-study": () => (
    <>
      <Sky id="amb-sky-study" stops={[[0, "#1d1320"], [1, "#3a2418"]]} />
      <Glow id="amb-candle-glow" color="#ffb352" />
      <Glow id="amb-moon-glow" color="#c9d4ff" />
      <Glow id="amb-sun" color="#ffd27a" />
      <Glow id="amb-potion-a" color="#5fe3c4" />
      <Glow id="amb-potion-b" color="#c48aff" />
      <Glow id="amb-potion-c" color="#ff7a6a" />
      <defs>
        <linearGradient id="amb-wax" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#b89a6a" />
          <stop offset="0.35" stopColor="#f3e2c0" />
          <stop offset="0.7" stopColor="#e4cca0" />
          <stop offset="1" stopColor="#8a6e48" />
        </linearGradient>
        <linearGradient id="amb-page-shade" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0" stopColor="#8a6a40" />
          <stop offset="0.3" stopColor="#8a6a40" stopOpacity="0" />
        </linearGradient>
        <clipPath id="amb-study-win">
          <path d="M1340 640 V300 C1340 170 1660 170 1660 300 V640 Z" />
        </clipPath>
        <radialGradient id="amb-study-warm" cx="0.62" cy="0.7" r="0.55">
          <stop offset="0" stopColor="#ffb352" stopOpacity="0.28" />
          <stop offset="1" stopColor="#ffb352" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Stone wall courses. */}
      <path d={Array.from({ length: 9 }, (_, i) => `M0 ${90 + i * 90}H1920`).join("")} stroke="#140c10" strokeWidth={3} opacity={0.5} />
      {/* The window, with the night outside. */}
      <path d="M1316 660 V300 C1316 140 1684 140 1684 300 V660 Z" fill="#4a3a34" />
      <g clipPath="url(#amb-study-win)">
        <rect x="1300" y="120" width="400" height="540" fill="#161e4c" />
        <path d="M1370 260h0M1420 210h0M1460 330h0M1630 250h0M1400 470h0M1610 520h0M1450 560h0M1560 440h0M1650 380h0" stroke="#eef0ff" strokeWidth={3} strokeLinecap="round" opacity={0.75} />
        <Moon id="amb-study-moon" x={1420} y={520} r={44} />
      </g>
      <path d="M1500 180 V640 M1340 410 H1660" stroke="#4a3a34" strokeWidth={12} />
      <rect x="1300" y="640" width="400" height="26" fill="#5a4840" />
      {/* Bookshelf. */}
      <rect x="70" y="80" width="640" height="740" fill="#24150c" />
      <rect x="90" y="100" width="600" height="720" fill="#170d08" />
      <Shelf x={96} y={270} w={588} seed={3} />
      <Shelf x={96} y={450} w={588} seed={8} />
      <Shelf x={96} y={630} w={588} seed={14} />
      {/* Orrery hanging from the ceiling: rings and planets turning on their own clocks. */}
      <line x1="1010" y1="0" x2="1010" y2="190" stroke="#6a5030" strokeWidth={4} />
      <circle cx="1010" cy="330" r={170} fill="url(#amb-sun)" className="amb-pulse" />
      <g stroke="#b8893e" strokeWidth={3} fill="none" opacity={0.7}>
        {[70, 110, 150].map((r) => (
          <circle key={r} cx={1010} cy={330} r={r} />
        ))}
      </g>
      <circle cx="1010" cy="330" r="26" fill="#ffd27a" />
      {[
        [70, "#9ad0ff", 14, 9],
        [110, "#e07a5a", 18, 16],
        [150, "#c9b0ff", 12, 26],
      ].map(([r, c, pr, dur]) => (
        <g key={r as number} className="amb-orbit" style={{ transformOrigin: "1010px 330px", animationDuration: `${dur}s` }}>
          <circle cx={1010 + (r as number)} cy={330} r={pr as number} fill={c as string} />
        </g>
      ))}
      <rect width="1920" height="1080" fill="url(#amb-study-warm)" className="amb-breathe" />
      {/* The desk and what's on it. */}
      <rect x="0" y="820" width="1920" height="260" fill="#3a2212" />
      <rect x="0" y="820" width="1920" height="16" fill="#6a4426" />
      <rect x="0" y="836" width="1920" height="12" fill="#2a170c" />
      <OpenBook cx={780} y={756} w={460} h={70} turn />
      <Embers x={780} y={760} w={300} n={6} seed={47} color="#d6b8ff" rise={-300} />
      <Candle x={1160} base={826} h={200} w={64} />
      <Potion x={1380} base={826} r={40} liquid="#3fc4a4" glow="amb-potion-a" i={0} />
      <Potion x={1490} base={826} r={30} liquid="#a46ae6" glow="amb-potion-b" i={1} />
      <Potion x={1580} base={826} r={36} liquid="#e05a4a" glow="amb-potion-c" i={2} />
      <path d="M380 826 h70 v-46 a35 18 0 0 0 -70 0 Z" fill="#1a1414" />
      <path d="M420 780 C460 700 520 640 560 610 C520 660 470 720 430 782 Z" fill="#e8e0d0" />
      <g fill="#ffe2a8" opacity={0.5}>
        {scatter(8, 53, 1200, 600).map(([x, y, k], i) => (
          <circle key={i} className="amb-mote" style={delay(k * 8)} cx={400 + x} cy={160 + y} r={2.4} />
        ))}
      </g>
    </>
  ),
  storybook: () => (
    <>
      <Sky id="amb-sky-story" stops={[[0, "#0b0a24"], [0.6, "#241a44"], [1, "#3a2234"]]} />
      <Glow id="amb-book-glow" color="#ffd88a" />
      <defs>
        <linearGradient id="amb-page-shade" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0" stopColor="#8a6a40" />
          <stop offset="0.3" stopColor="#8a6a40" stopOpacity="0" />
        </linearGradient>
      </defs>
      <Stars n={45} seed={59} h={700} />
      <g opacity={0.45}>
        <circle cx="960" cy="620" r="560" fill="url(#amb-book-glow)" className="amb-pulse" />
      </g>
      {/* The tale rising out of the pages: mountains, a castle, a dragon on the wing. */}
      <g className="amb-vision" fill="#ffe7b0">
        <path d="M420 640 L620 420 L720 520 L860 360 L1000 540 L1120 430 L1300 640 Z" opacity={0.5} />
        <path d="M780 640 V500 H800 V480 H820 V500 H840 V480 H860 V500 H880 V640 Z M1040 640 V500 H1060 V480 H1080 V500 H1100 V480 H1120 V500 H1140 V640 Z" />
        <path d="M770 500 L810 420 L850 500 Z M1110 500 L1150 420 L1190 500 Z" transform="translate(20 0)" />
        <path d="M790 420 V400 M1170 420 V400" />
        <path d="M880 640 V540 H1040 V640 Z M900 540 V400 H1020 V540 Z" />
        <path d="M890 400 L960 280 L1030 400 Z" />
        <path d="M960 280 V240 L992 252 L960 264" stroke="#ffe7b0" strokeWidth={4} />
        <path d="M940 640 V600 a20 20 0 0 1 40 0 V640 Z" fill="#241a44" />
      </g>
      <g className="amb-glide" style={delay(1)}>
        <path className="amb-vision" fill="#ffe7b0" d="M1300 200 c30 -10 50 -6 70 6 c20 -30 50 -44 80 -40 c-24 14 -40 32 -46 54 c24 0 44 8 60 22 c-30 -4 -56 0 -80 10 c-24 -6 -54 -26 -84 -52 Z" />
      </g>
      <rect x="0" y="880" width="1920" height="200" fill="#1a0f14" />
      <ellipse cx="960" cy="900" rx="640" ry="60" fill="#ffd88a" opacity={0.14} />
      <OpenBook cx={960} y={700} w={1040} h={190} cover="#4a1a26" page="#f1e4c6" turn />
      <Embers x={960} y={700} w={760} n={16} seed={61} color="#ffe39a" rise={-420} dur={7} />
    </>
  ),
  embers: () => (
    <>
      <Sky id="amb-sky-embers" stops={[[0, "#05060c"], [1, "#140a0a"]]} />
      <Glow id="amb-coal" color="#ff5a1e" />
      <Stars n={35} seed={67} h={480} />
      <rect x="0" y="760" width="1920" height="320" fill="#0d0807" />
      <g opacity={0.5}>
        <ellipse cx="960" cy="900" rx="560" ry="150" fill="url(#amb-coal)" className="amb-breathe" />
      </g>
      <StoneRing cx={960} cy={900} rx={260} ry={64} front={false} lit="#4a2a20" dark="#1e1614" />
      <Smoke id="amb-embers-smoke" x={960} y={760} n={5} op={0.45} size={80} color="#6a6470" />
      {scatter(26, 71, 360, 60).map(([x, y, k], i) => (
        <ellipse key={i} className={i % 2 ? undefined : "amb-coal"} style={i % 2 ? undefined : delay(k * 3)} cx={780 + x} cy={870 + y} rx={R(18 + k * 18)} ry={R(9 + k * 8)} fill={k > 0.6 ? "#ff7a2a" : k > 0.3 ? "#d4401a" : "#8a2410"} />
      ))}
      <g>
        <rect x="770" y="870" width="420" height="34" rx="17" fill="#1a1110" transform="rotate(-7 980 887)" />
        <path d="M820 880 l40 6 l30 -4 M960 878 l50 4 M1060 872 l40 -6" stroke="#ff6a24" strokeWidth={4} fill="none" className="amb-glimmer" transform="rotate(-7 980 887)" />
      </g>
      <Embers x={960} y={850} w={260} n={9} seed={73} color="#ff9a4a" rise={-300} dur={6.5} />
      <StoneRing cx={960} cy={900} rx={260} ry={64} front lit="#5a3424" dark="#1e1614" />
    </>
  ),
};

/** One ambient scene, filling its parent, with an optional caption. */
export function AmbientScene({ id, caption }: { id: AmbientId; caption?: string }) {
  const draw = SCENES[id];
  return (
    <div className={`scene-fill ambient ambient-${id}`}>
      <svg viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice" role="img" aria-label={caption || "An ambient scene"}>
        {draw ? draw() : null}
      </svg>
      {caption ? <div className="ambient-caption">{caption}</div> : null}
    </div>
  );
}
