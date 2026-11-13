"use client";

// The intro's pictures: layered SVG, drawn in the style of the app's portraits
// (flat shapes, soft light), in cold blues and greys. Candlelight is the only
// warm colour until the tavern.
//
// Each scene is a 400×800 portrait stage that fills the screen (cropped, never
// stretched). Layers drift at different speeds for a gentle parallax; with
// "reduce motion" they stand still (see arrival.css).

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { EXTRAS, type SceneId } from "./content";
import { ArtumNotice } from "../scenes/ArtumNotice";

const INK = "#04070c";
const INK2 = "#0a121c";
const WARM = "#ffc46b";

function Stage({ children, className = "", style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <svg className={`stage ${className}`} viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true" style={style}>
      {children}
    </svg>
  );
}

function Defs() {
  return (
    <defs>
      <linearGradient id="sky-dusk" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#0c1522" />
        <stop offset="0.55" stopColor="#24364a" />
        <stop offset="1" stopColor="#3a4d61" />
      </linearGradient>
      <linearGradient id="sky-night" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#070c14" />
        <stop offset="0.6" stopColor="#152233" />
        <stop offset="1" stopColor="#223246" />
      </linearGradient>
      <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#1b2a3a" />
        <stop offset="1" stopColor="#070d15" />
      </linearGradient>
      <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor={WARM} stopOpacity="0.9" />
        <stop offset="0.35" stopColor={WARM} stopOpacity="0.35" />
        <stop offset="1" stopColor={WARM} stopOpacity="0" />
      </radialGradient>
      <radialGradient id="glow-soft" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor={WARM} stopOpacity="0.45" />
        <stop offset="1" stopColor={WARM} stopOpacity="0" />
      </radialGradient>
      <radialGradient id="mist" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#b8c7d6" stopOpacity="0.22" />
        <stop offset="1" stopColor="#b8c7d6" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="snowground" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#6c7f92" />
        <stop offset="1" stopColor="#2c3a49" />
      </linearGradient>
      <linearGradient id="warm-room" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#2a160c" />
        <stop offset="0.6" stopColor="#4a2814" />
        <stop offset="1" stopColor="#1c0e07" />
      </linearGradient>
    </defs>
  );
}

/** Low banks of fog drifting across. */
function Fog({ y = 520, opacity = 1 }: { y?: number; opacity?: number }) {
  return (
    <g className="fog" opacity={opacity}>
      <ellipse className="fog-a" cx="120" cy={y} rx="260" ry="60" fill="url(#mist)" />
      <ellipse className="fog-b" cx="320" cy={y + 70} rx="280" ry="70" fill="url(#mist)" />
      <ellipse className="fog-a" cx="60" cy={y + 160} rx="240" ry="60" fill="url(#mist)" />
    </g>
  );
}

function Waves({ y, color = "#2a3b4d" }: { y: number; color?: string }) {
  const rows = [0, 26, 60, 104, 160];
  return (
    <g className="waves" stroke={color} strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.6">
      {rows.map((dy, i) => (
        <path key={i} className={i % 2 ? "wave-b" : "wave-a"} d={`M-40 ${y + dy} q 25 -5 50 0 t 50 0 t 50 0 t 50 0 t 50 0 t 50 0 t 50 0 t 50 0 t 50 0 t 50 0`} />
      ))}
    </g>
  );
}

/** A hanging lantern; the flame is the only colour. */
function Lantern({ x, y, scale = 1, still = false }: { x: number; y: number; scale?: number; still?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <g className={still ? "" : "sway"}>
        <line x1="0" y1="-400" x2="0" y2="0" stroke="#1b2633" strokeWidth="2" />
        <circle cx="0" cy="44" r="70" fill="url(#glow)" className="lantern-glow" />
        <path d="M-14 0 h28 l4 10 h-36 z" fill="#1a2430" />
        <rect x="-16" y="10" width="32" height="46" rx="3" fill="#ffd690" opacity="0.18" stroke="#1a2430" strokeWidth="3" />
        <line x1="0" y1="10" x2="0" y2="56" stroke="#1a2430" strokeWidth="2" />
        <path d="M0 26 c5 8 5 14 0 18 c-5 -4 -5 -10 0 -18 z" fill={WARM} className="flame" />
        <path d="M-18 56 h36 l-4 8 h-28 z" fill="#1a2430" />
      </g>
    </g>
  );
}

// ---------------------------------------------------------------------------

function SLantern() {
  return (
    <Stage className="s-lantern">
      <Defs />
      <rect width="400" height="800" fill="#020305" />
      <g className="fade-in-slow">
        <Lantern x={200} y={300} scale={1.6} />
      </g>
    </Stage>
  );
}

function SDeck() {
  return (
    <Stage>
      <Defs />
      <g className="cam">
        <rect width="400" height="800" fill="url(#sky-dusk)" />
        <g className="lay-far">
          <rect y="560" width="400" height="240" fill="url(#water)" />
          <Waves y={580} />
        </g>
        <Fog y={500} />
        <g className="lay-mid" stroke={INK} fill="none">
          {/* mast and rigging */}
          <line x1="250" y1="-20" x2="250" y2="640" strokeWidth="10" />
          <line x1="250" y1="40" x2="40" y2="640" strokeWidth="1.5" className="creak" />
          <line x1="250" y1="40" x2="420" y2="560" strokeWidth="1.5" className="creak" />
          <line x1="250" y1="160" x2="-10" y2="620" strokeWidth="1.2" />
          <line x1="150" y1="120" x2="400" y2="120" strokeWidth="6" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <line key={i} x1={60 + i * 12} y1={600 - i * 50} x2={330 - i * 4} y2={600 - i * 50} strokeWidth="1" opacity="0.7" />
          ))}
        </g>
        <Lantern x={268} y={330} scale={0.55} />
        <g className="lay-near" fill={INK}>
          {/* deck and rail */}
          <path d="M-20 640 L420 610 L420 820 L-20 820 Z" />
          <path d="M-20 600 L420 572 L420 586 L-20 614 Z" fill={INK2} />
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <rect key={i} x={-10 + i * 58} y={600 - i * 3.6} width="6" height="40" />
          ))}
          {/* the captain at the wheel: broad shoulders, coat, hat */}
          <g transform="translate(110 470)">
            <path d="M-46 170 C-50 110 -44 70 -30 52 C-18 40 18 40 30 52 C44 70 50 110 46 170 Z" />
            <path d="M-34 58 C-60 64 -66 90 -62 120 L-50 122 C-48 98 -42 82 -28 74 Z" />
            <path d="M34 58 C60 64 66 90 62 120 L50 122 C48 98 42 82 28 74 Z" />
            <ellipse cx="0" cy="26" rx="17" ry="20" />
            <path d="M-30 10 h60 l-6 -6 h-48 z" />
            <path d="M-16 6 C-16 -16 16 -16 16 6 Z" />
          </g>
          <g transform="translate(170 548)" className="wheel" stroke={INK} strokeWidth="5" fill="none">
            <circle r="34" />
            {[0, 45, 90, 135].map((a) => (
              <line key={a} x1="-44" y1="0" x2="44" y2="0" transform={`rotate(${a})`} strokeWidth="4" />
            ))}
          </g>
        </g>
      </g>
    </Stage>
  );
}

function Lighthouse({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill={INK2}>
      <path d="M-14 0 L-9 -110 L9 -110 L14 0 Z" />
      <rect x="-12" y="-128" width="24" height="18" fill="#101a26" stroke={INK2} strokeWidth="3" />
      <path d="M-14 -128 L0 -144 L14 -128 Z" />
    </g>
  );
}

function SRiverMouth() {
  return (
    <Stage>
      <Defs />
      <g className="cam">
        <rect width="400" height="800" fill="url(#sky-night)" />
        <g className="lay-far">
          {/* the far bank, opening up */}
          <path d="M-20 470 C60 450 110 455 160 468 L160 480 L-20 480 Z" fill="#101a26" />
          <path d="M260 466 C300 452 360 446 420 452 L420 482 L260 482 Z" fill="#101a26" />
          <Lighthouse x={330} y={452} s={0.9} />
          <rect y="478" width="400" height="330" fill="url(#water)" />
          <Waves y={500} />
        </g>
        <Fog y={460} opacity={0.8} />
        <g className="lay-near" fill={INK}>
          {/* the bow */}
          <path d="M120 820 L200 600 L280 820 Z" />
          <line x1="200" y1="600" x2="200" y2="520" stroke={INK} strokeWidth="4" />
          <line x1="200" y1="520" x2="120" y2="820" stroke={INK} strokeWidth="1.2" />
        </g>
      </g>
    </Stage>
  );
}

function Town({ windowLit = true }: { windowLit?: boolean }) {
  const houses: [number, number, number][] = [
    [10, 40, 50], [52, 34, 64], [90, 46, 56], [140, 30, 76], [174, 52, 60], [230, 38, 86], [272, 44, 70], [320, 36, 58], [360, 50, 66],
  ];
  return (
    <g>
      <path d="M-20 520 C60 470 140 440 220 430 C300 420 360 440 420 470 L420 560 L-20 560 Z" fill="#0d1520" />
      {houses.map(([x, w, h], i) => {
        const base = 540 - Math.sin((x / 400) * Math.PI) * 70;
        return (
          <g key={i} fill={INK2}>
            <rect x={x} y={base - h} width={w} height={h + 20} />
            <path d={`M${x - 4} ${base - h} L${x + w / 2} ${base - h - w * 0.55} L${x + w + 4} ${base - h} Z`} />
          </g>
        );
      })}
      {/* the bell tower */}
      <rect x="200" y="380" width="22" height="80" fill={INK2} />
      <path d="M196 380 L211 350 L226 380 Z" fill={INK2} />
      {/* the one window */}
      <g transform="translate(190 446)">
        <circle r="34" fill="url(#glow-soft)" className={windowLit ? "window-glow" : ""} opacity={windowLit ? undefined : 0} />
        <rect x="-5" y="-7" width="10" height="13" fill={WARM} className={windowLit ? "window-lit" : ""} opacity={windowLit ? undefined : 0} />
      </g>
    </g>
  );
}

function STown() {
  return (
    <Stage>
      <Defs />
      <g className="cam">
        <rect width="400" height="800" fill="url(#sky-night)" />
        <g className="lay-far">
          <Town />
          <rect y="548" width="400" height="260" fill="url(#water)" />
          {/* the window's reflection */}
          <rect x="187" y="570" width="6" height="90" fill={WARM} opacity="0.18" className="window-lit" />
          <Waves y={572} />
        </g>
        <Fog y={560} opacity={0.7} />
        <g className="lay-near" fill={INK}>
          <path d="M-20 800 L-20 700 C80 690 200 700 420 730 L420 800 Z" />
        </g>
      </g>
    </Stage>
  );
}

function SDocking() {
  return (
    <Stage>
      <Defs />
      <g className="cam">
        <rect width="400" height="800" fill="url(#sky-night)" />
        <g className="lay-far" opacity="0.9">
          <Town />
        </g>
        <g className="lay-mid">
          <rect y="560" width="400" height="260" fill="url(#water)" />
          <Waves y={590} />
          {/* the dock */}
          <path d="M150 560 L420 540 L420 600 L150 610 Z" fill="#111b27" />
          {[170, 230, 290, 350, 400].map((x, i) => (
            <rect key={x} x={x} y={560 - i * 4} width="9" height={110} fill={INK2} />
          ))}
          <Lantern x={360} y={420} scale={0.45} still />
        </g>
        <g className="lay-near" fill={INK}>
          {/* ship's side and the gangplank dropping */}
          <path d="M-20 560 L120 580 L140 820 L-20 820 Z" />
          <g className="gangplank">
            <rect x="110" y="572" width="170" height="12" rx="2" fill="#1a2431" />
          </g>
        </g>
      </g>
    </Stage>
  );
}

/** The walk uphill: one wide street, the camera stops at three things. */
function SUphill({ shot }: { shot: number }) {
  const W = 1200;
  return (
    <svg className="stage" viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <Defs />
      <g className="pan" style={{ transform: `translateX(${-shot * 400}px)` }}>
        <rect width={W} height="800" fill="url(#sky-night)" />
        {/* far rooftops climbing to the right */}
        <g fill="#0e1722">
          {Array.from({ length: 16 }, (_, i) => (
            <path key={i} d={`M${i * 80 - 10} ${380 - i * 8} l40 -36 l40 36 v200 h-80 z`} />
          ))}
        </g>
        {/* the street, rising */}
        <path d={`M0 640 L${W} 560 L${W} 800 L0 800 Z`} fill="url(#snowground)" />
        {EXTRAS.uphillDetail ? (
          <g className="uphill-detail" stroke="#1a2530" strokeWidth="2" fill="none" opacity="0.42">
            <path d="M520 800 C560 720 640 690 760 660 S 980 600 1220 590" />
            <path d="M552 800 C590 726 668 700 784 672 S 1000 612 1220 604" />
          </g>
        ) : null}

        {/* 1: the fisherman and the rope */}
        <g transform="translate(200 640)" fill={INK}>
          <path d="M-30 0 C-34 -40 -28 -70 -14 -84 C-4 -92 10 -92 18 -82 C30 -66 34 -36 30 0 Z" transform="rotate(-8)" />
          <circle cx="-4" cy="-104" r="14" />
          <path d="M-20 -112 h34 l-6 -10 h-22 z" />
          <path d="M-60 -60 C-20 -100 30 -20 70 -70 C90 -96 40 -120 10 -80 C-20 -40 60 -20 90 -40" stroke={INK} strokeWidth="3" fill="none" />
          <path d="M60 0 C40 -14 90 -20 80 0 Z" />
          <ellipse cx="100" cy="-6" rx="24" ry="9" />
        </g>

        {/* 2: the notice on its post */}
        <g transform="translate(600 620)">
          <rect x="-6" y="-200" width="12" height="220" fill={INK} />
        </g>

        {/* 3: the bakery vent */}
        <g transform="translate(1000 400)">
          <rect x="-90" y="0" width="200" height="200" fill="#0e1722" />
          <path d="M-100 0 L10 -70 L120 0 Z" fill="#0b131d" />
          <rect x="40" y="-60" width="22" height="40" fill={INK2} />
          <g className="steam" fill="none" stroke="#cfdbe6" strokeWidth="6" strokeLinecap="round" opacity="0.35">
            <path d="M51 -66 c-14 -20 14 -30 0 -52 c-12 -18 10 -30 2 -50" />
          </g>
          <rect x="-60" y="80" width="40" height="34" fill="#1a2533" />
        </g>
      </g>
      {/* the poster itself is real paper (the existing handbill), drawn on top of the pan */}
    </svg>
  );
}

function SDoor({ open }: { open: boolean }) {
  return (
    <div className={`door-scene${open ? " open" : ""}`}>
      <Stage className="door-room">
        <Defs />
        <rect width="400" height="800" fill="url(#warm-room)" />
        {/* the hearth */}
        <g transform="translate(200 560)">
          <path d="M-150 120 L-150 -80 L150 -80 L150 120 Z" fill="#3a2214" />
          <path d="M-110 120 L-110 -10 C-110 -60 110 -60 110 -10 L110 120 Z" fill="#120804" />
          <circle cx="0" cy="80" r="110" fill="url(#glow-soft)" />
          <g className="hearth-fire">
            <path d="M-70 112 C-66 70 -44 66 -40 30 C-26 60 -14 52 -8 10 C6 48 20 40 26 -6 C34 40 52 52 52 20 C66 56 72 80 70 112 Z" fill="#d9661f" opacity="0.9" />
            <path d="M-46 112 C-42 80 -26 76 -20 50 C-10 74 2 64 8 36 C18 66 32 70 34 52 C44 76 48 92 46 112 Z" fill="#ff9a3c" />
            <path d="M-20 112 C-18 92 -8 88 -2 70 C6 88 16 92 20 112 Z" fill="#ffd27a" />
          </g>
          <g fill="#1d0f07">
            <rect x="-84" y="108" width="168" height="14" rx="7" transform="rotate(-4)" />
            <rect x="-76" y="110" width="150" height="12" rx="6" transform="rotate(5)" />
          </g>
          <rect x="-170" y="-96" width="340" height="18" fill="#2a170d" />
        </g>
        {/* the tall candle in its brass holder, perfectly still */}
        <g transform="translate(200 300)">
          <circle cx="0" cy="-16" r="70" fill="url(#glow-soft)" />
          <path d="M0 -40 c7 12 7 20 0 26 c-7 -6 -7 -14 0 -26 z" fill={WARM} />
          <rect x="-9" y="-12" width="18" height="120" fill="#efe3c8" />
          <path d="M-28 108 h56 l-8 16 h-40 z" fill="#b8893a" />
          <ellipse cx="0" cy="128" rx="34" ry="6" fill="#8f6a2a" />
        </g>
      </Stage>
      <div className="door-flood" />
      <Stage className="door-front">
        <Defs />
        <rect width="400" height="800" fill="#0a111a" />
        <g className="door-leaf">
          <rect x="70" y="140" width="260" height="560" fill="#1a232e" stroke="#0a0f15" strokeWidth="8" />
          {[0, 1, 2, 3].map((i) => (
            <line key={i} x1={70 + 65 * (i + 1)} y1="140" x2={70 + 65 * (i + 1)} y2="700" stroke="#121a23" strokeWidth="3" />
          ))}
          <rect x="70" y="250" width="260" height="16" fill="#0f151c" />
          <rect x="70" y="560" width="260" height="16" fill="#0f151c" />
          <circle cx="292" cy="430" r="9" fill="#0f151c" />
        </g>
        {/* light under the door */}
        <rect x="76" y="696" width="248" height="6" fill={WARM} className="under-door" />
        <ellipse cx="200" cy="712" rx="170" ry="26" fill="url(#glow-soft)" className="under-door" />
        <rect y="712" width="400" height="90" fill="url(#snowground)" opacity="0.6" />
      </Stage>
    </div>
  );
}

function SMags() {
  return (
    <div className="mags-scene">
      <Stage>
        <Defs />
        <rect width="400" height="800" fill="url(#warm-room)" />
        <circle cx="200" cy="330" r="240" fill="url(#glow-soft)" />
        {/* shelves of bottles */}
        <g fill="#2e1a0e">
          <rect x="0" y="150" width="400" height="10" />
          <rect x="0" y="230" width="400" height="10" />
          {Array.from({ length: 14 }, (_, i) => (
            <rect key={i} x={10 + i * 28} y={i % 3 ? 116 : 108} width="12" height={i % 3 ? 34 : 42} rx="4" fill="#3d2414" />
          ))}
        </g>
      </Stage>
      <img className="mags-portrait" src="/art/mags-wick.svg" alt="Mags Wick behind the bar: gray hair in a bun, rosy cheeks and a wide smile" width={400} height={400} />
      <Stage className="mags-bar">
        <path d="M-20 600 L420 600 L420 820 L-20 820 Z" fill="#2a1609" />
        <rect x="-20" y="588" width="440" height="22" fill="#5a3418" />
        <rect x="-20" y="606" width="440" height="4" fill="#ffc46b" opacity="0.25" />
      </Stage>
    </div>
  );
}

/**
 * The real handbill, pinned to the post in the walk uphill. It's HTML, not SVG,
 * so it's placed with the same "cover" maths the 400×800 stage uses.
 */
function PosterOnPost({ shot }: { shot: number }) {
  const [box, setBox] = useState<{ k: number; ox: number; oy: number } | null>(null);
  useEffect(() => {
    const fit = () => {
      const W = window.innerWidth;
      const H = window.innerHeight;
      const k = Math.max(W / 400, H / 800);
      setBox({ k, ox: (W - 400 * k) / 2, oy: (H - 800 * k) / 2 });
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);
  if (!box) return null;
  const { k, ox, oy } = box;
  const w = 118; // stage units
  const scale = (w * k) / 816;
  // Centre of the poster on the stage: on the post at x=200 (after the pan), its foot just over the post's top.
  const x = ox + 200 * k - (816 * scale) / 2 + (1 - shot) * 400 * k;
  const y = oy + 432 * k - 1056 * scale;
  return (
    <div className={`poster-wrap${shot === 1 ? " here" : ""}`} style={{ transform: `translate(${x}px, ${y}px)` }}>
      <div className="poster" style={{ ["--s" as string]: scale } as CSSProperties}>
        <ArtumNotice />
      </div>
    </div>
  );
}

export function SceneArt({ scene, shot }: { scene: SceneId; shot: number }) {
  switch (scene) {
    case "lantern":
      return <SLantern />;
    case "deck":
      return <SDeck />;
    case "rivermouth":
      return <SRiverMouth />;
    case "town":
      return <STown />;
    case "docking":
      return <SDocking />;
    case "uphill":
      return (
        <>
          <SUphill shot={shot} />
          <PosterOnPost shot={shot} />
        </>
      );
    case "door":
      return <SDoor open={shot >= 1} />;
    case "mags":
      return <SMags />;
  }
}
