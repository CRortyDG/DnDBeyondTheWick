"use client";

// The intro's pictures: layered SVG, drawn in the style of the app's portraits
// (flat shapes, soft light). A grey winter day: pale sky, slate water, snow,
// with Winterfest bunting and warm windows for colour.
//
// Each scene is a 400×800 portrait stage that fills the screen (cropped, never
// stretched). Layers drift at different speeds for a gentle parallax; with
// "reduce motion" they stand still (see arrival.css).

import type { CSSProperties, ReactNode } from "react";
import { EXTRAS, type SceneId } from "./content";

const FAR = "#7d8e9e"; // distant shapes in the haze
const MID = "#4f5f6e";
const NEAR = "#2f3a45";
const WOOD = "#5b4532";
const WOOD_DK = "#3b2d21";
const SNOW = "#f1f4f7";
const WARM = "#ffc46b";
const BUNTING = ["#b8432f", "#e0a33a", "#3f7a5c", "#3d5f8a", "#e9e1cf"];

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
      <linearGradient id="sky-day" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#a9b8c6" />
        <stop offset="0.6" stopColor="#d3dbe2" />
        <stop offset="1" stopColor="#e6eaee" />
      </linearGradient>
      <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#7f95a6" />
        <stop offset="1" stopColor="#3e5263" />
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
        <stop offset="0" stopColor="#ffffff" stopOpacity="0.4" />
        <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="snowground" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#f4f7fa" />
        <stop offset="1" stopColor="#c9d3dc" />
      </linearGradient>
      <linearGradient id="warm-room" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#3a2112" />
        <stop offset="0.6" stopColor="#5a3218" />
        <stop offset="1" stopColor="#24130a" />
      </linearGradient>
    </defs>
  );
}

/** Soft winter haze drifting across. */
function Haze({ y = 520, opacity = 1 }: { y?: number; opacity?: number }) {
  return (
    <g className="fog" opacity={opacity}>
      <ellipse className="fog-a" cx="120" cy={y} rx="260" ry="50" fill="url(#mist)" />
      <ellipse className="fog-b" cx="320" cy={y + 60} rx="280" ry="60" fill="url(#mist)" />
    </g>
  );
}

function Waves({ y, color = "#e8eef3" }: { y: number; color?: string }) {
  const rows = [0, 26, 60, 104, 160];
  return (
    <g className="waves" stroke={color} strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.5">
      {rows.map((dy, i) => (
        <path key={i} className={i % 2 ? "wave-b" : "wave-a"} d={`M-40 ${y + dy} q 25 -5 50 0 t 50 0 t 50 0 t 50 0 t 50 0 t 50 0 t 50 0 t 50 0 t 50 0 t 50 0`} />
      ))}
    </g>
  );
}

function Gulls() {
  return (
    <g className="gulls" fill="none" stroke="#3c4a57" strokeWidth="2.2" strokeLinecap="round">
      <path className="gull-a" d="M80 180 q10 -10 20 0 q10 -10 20 0" />
      <path className="gull-b" d="M250 130 q8 -8 16 0 q8 -8 16 0" />
      <path className="gull-a" d="M300 230 q6 -6 12 0 q6 -6 12 0" />
    </g>
  );
}

/** A string of Winterfest flags between two points. */
function Bunting({ x1, y1, x2, y2, sag = 18, n = 9, size = 9 }: { x1: number; y1: number; x2: number; y2: number; sag?: number; n?: number; size?: number }) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2 + sag * 2;
  const pt = (t: number) => ({
    x: (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * mx + t * t * x2,
    y: (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * my + t * t * y2,
  });
  return (
    <g className="bunting">
      <path d={`M${x1} ${y1} Q${mx} ${my} ${x2} ${y2}`} stroke="#3b2d21" strokeWidth="1" fill="none" />
      {Array.from({ length: n }, (_, i) => {
        const p = pt((i + 0.5) / n);
        return <path key={i} d={`M${p.x - size / 2} ${p.y} h${size} l${-size / 2} ${size * 1.3} z`} fill={BUNTING[i % BUNTING.length]} />;
      })}
    </g>
  );
}

/** A figure in a hooded cloak, seen from behind or the side: no face, nothing decided about who they are. */
function Cloaked({ x, y, s = 1, color, flip = false }: { x: number; y: number; s?: number; color: string; flip?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      <path d="M-26 0 C-30 -50 -24 -90 -12 -108 C-6 -116 6 -116 12 -108 C24 -90 30 -50 26 0 Z" fill={color} />
      <path d="M-14 -104 C-16 -132 14 -132 14 -104 C10 -96 -10 -96 -14 -104 Z" fill={color} />
      <path d="M-14 -104 C-16 -132 14 -132 14 -104" fill="none" stroke="#000" strokeOpacity="0.18" strokeWidth="3" />
      <path d="M-11 -104 C-6 -98 6 -98 11 -104" fill="none" stroke="#000" strokeOpacity="0.22" strokeWidth="5" />
    </g>
  );
}

function Rail({ y }: { y: number }) {
  return (
    <g fill={WOOD_DK}>
      <path d={`M-20 ${y} L420 ${y - 28} L420 ${y - 14} L-20 ${y + 14} Z`} fill={WOOD} />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <rect key={i} x={-10 + i * 58} y={y - i * 3.6} width="6" height="40" />
      ))}
      <path d={`M-20 ${y + 40} L420 ${y + 10} L420 820 L-20 820 Z`} fill="#4a3826" />
    </g>
  );
}

// ---------------------------------------------------------------------------

function SSea() {
  return (
    <Stage>
      <Defs />
      <g className="cam">
        <rect width="400" height="800" fill="url(#sky-day)" />
        <g className="lay-far">
          <rect y="470" width="400" height="340" fill="url(#water)" />
          <Waves y={490} />
        </g>
        <Haze y={470} />
        <g className="lay-mid">
          <Gulls />
        </g>
        <g className="lay-near">
          {/* the bow, pushing through */}
          <path d="M90 820 L200 610 L310 820 Z" fill={WOOD} />
          <path d="M200 610 L200 820" stroke={WOOD_DK} strokeWidth="3" />
          <line x1="200" y1="610" x2="200" y2="540" stroke={WOOD_DK} strokeWidth="5" />
          <path d="M110 800 C150 760 170 720 200 640" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="3" fill="none" />
        </g>
      </g>
    </Stage>
  );
}

function SDeck() {
  return (
    <Stage>
      <Defs />
      <g className="cam">
        <rect width="400" height="800" fill="url(#sky-day)" />
        <g className="lay-far">
          <rect y="560" width="400" height="240" fill="url(#water)" />
          <Waves y={580} />
        </g>
        <g className="lay-mid">
          {/* mast, sail and rigging */}
          <line x1="250" y1="-20" x2="250" y2="640" stroke={WOOD_DK} strokeWidth="10" />
          <path className="sail" d="M150 120 L400 120 C410 260 400 360 388 430 L170 430 C182 340 176 220 150 120 Z" fill="#ece4d3" stroke="#c9bea8" strokeWidth="2" />
          <line x1="150" y1="120" x2="400" y2="120" stroke={WOOD_DK} strokeWidth="6" />
          <g stroke={MID} strokeWidth="1.4">
            <line x1="250" y1="40" x2="40" y2="640" className="creak" />
            <line x1="250" y1="40" x2="420" y2="560" className="creak" />
          </g>
        </g>
        <g className="lay-near">
          <Rail y={600} />
          {/* cargo */}
          <g>
            <rect x="250" y="560" width="70" height="56" fill="#8a6a46" stroke={WOOD_DK} strokeWidth="3" />
            <rect x="300" y="520" width="60" height="50" fill="#9a7850" stroke={WOOD_DK} strokeWidth="3" />
            <ellipse cx="350" cy="612" rx="22" ry="30" fill="#7a5a3a" stroke={WOOD_DK} strokeWidth="3" />
          </g>
          {/* the captain at the wheel: broad shoulders, coat, hat, looking ahead */}
          <g transform="translate(110 470)" fill="#26303a">
            <path d="M-46 170 C-50 110 -44 70 -30 52 C-18 40 18 40 30 52 C44 70 50 110 46 170 Z" />
            <path d="M-34 58 C-60 64 -66 90 -62 120 L-50 122 C-48 98 -42 82 -28 74 Z" />
            <path d="M34 58 C60 64 66 90 62 120 L50 122 C48 98 42 82 28 74 Z" />
            <ellipse cx="0" cy="26" rx="17" ry="20" />
            <path d="M-30 10 h60 l-6 -6 h-48 z" />
            <path d="M-16 6 C-16 -16 16 -16 16 6 Z" />
            <path d="M-20 44 C-10 54 10 54 20 44 L18 58 C8 64 -8 64 -18 58 Z" fill="#b8432f" />
          </g>
          <g transform="translate(170 548)" className="wheel" stroke={WOOD_DK} strokeWidth="5" fill="none">
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

/** The other passengers along the rail. Cloaks only: no faces, nothing that decides anyone's character. */
function SPassengers() {
  const cloaks: [number, number, number, string, boolean][] = [
    [70, 560, 1.25, "#7b4a3a", false],
    [168, 520, 1.0, "#4e6a55", true],
    [262, 536, 1.1, "#5a5470", false],
    [345, 566, 1.3, "#6d7a86", true],
  ];
  return (
    <Stage>
      <Defs />
      <g className="cam">
        <rect width="400" height="800" fill="url(#sky-day)" />
        <g className="lay-far">
          <rect y="500" width="400" height="300" fill="url(#water)" />
          <Waves y={520} />
          <path d="M-20 500 C80 488 180 492 260 498 L260 506 L-20 506 Z" fill={FAR} opacity="0.6" />
        </g>
        <Haze y={500} opacity={0.8} />
        <g className="lay-mid">
          <Gulls />
        </g>
        <g className="lay-near">
          <Rail y={580} />
          {cloaks.map(([x, y, s, c, f], i) => (
            <g key={i} className={`glance glance-${i}`}>
              <Cloaked x={x} y={y} s={s} color={c} flip={f} />
            </g>
          ))}
        </g>
      </g>
    </Stage>
  );
}

function Lighthouse({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-14 0 L-9 -110 L9 -110 L14 0 Z" fill="#e7e4dc" />
      <path d="M-12.5 -40 L12.5 -40 L13.2 -24 L-13.2 -24 Z" fill="#a14a36" />
      <path d="M-10.5 -86 L10.5 -86 L11 -72 L-11 -72 Z" fill="#a14a36" />
      <rect x="-12" y="-128" width="24" height="18" fill="#5d6a75" stroke="#3a4550" strokeWidth="3" />
      <path d="M-14 -128 L0 -144 L14 -128 Z" fill="#3a4550" />
    </g>
  );
}

function SRiverMouth() {
  return (
    <Stage>
      <Defs />
      <g className="cam">
        <rect width="400" height="800" fill="url(#sky-day)" />
        <g className="lay-far">
          <path d="M-20 470 C60 450 110 455 160 468 L160 480 L-20 480 Z" fill={FAR} />
          <path d="M260 466 C300 452 360 446 420 452 L420 482 L260 482 Z" fill={FAR} />
          <path d="M-20 470 C60 452 110 456 160 468" stroke={SNOW} strokeWidth="3" fill="none" />
          <path d="M260 466 C300 453 360 447 420 452" stroke={SNOW} strokeWidth="3" fill="none" />
          <Lighthouse x={330} y={452} s={0.9} />
          <rect y="478" width="400" height="330" fill="url(#water)" />
          <Waves y={500} />
        </g>
        <Haze y={460} opacity={0.7} />
        <g className="lay-mid">
          <Gulls />
        </g>
        <g className="lay-near">
          <path d="M120 820 L200 600 L280 820 Z" fill={WOOD} />
          <line x1="200" y1="600" x2="200" y2="520" stroke={WOOD_DK} strokeWidth="4" />
          <line x1="200" y1="520" x2="120" y2="820" stroke={WOOD_DK} strokeWidth="1.2" />
        </g>
      </g>
    </Stage>
  );
}

const ROOFS = ["#7a3d30", "#4c5f6f", "#6b5a3e", "#3f5a4b", "#8a4a36", "#5a5068"];

/** Candlefair on the north bank: snowy roofs, chimney smoke, garlands going up. */
function Town() {
  const houses: [number, number, number][] = [
    [10, 40, 50], [52, 34, 64], [90, 46, 56], [140, 30, 76], [174, 52, 60], [230, 38, 86], [272, 44, 70], [320, 36, 58], [360, 50, 66],
  ];
  const base = (x: number) => 540 - Math.sin((x / 400) * Math.PI) * 70;
  return (
    <g>
      <path d="M-20 520 C60 470 140 440 220 430 C300 420 360 440 420 470 L420 560 L-20 560 Z" fill={SNOW} />
      {houses.map(([x, w, h], i) => {
        const b = base(x);
        const top = b - h;
        return (
          <g key={i}>
            {/* chimney smoke */}
            {i % 2 === 0 ? <path className={`smoke smoke-${i % 3}`} d={`M${x + w * 0.7} ${top - w * 0.4} c-6 -14 8 -22 0 -36 c-6 -10 6 -18 2 -28`} stroke="#ffffff" strokeOpacity="0.7" strokeWidth="5" fill="none" strokeLinecap="round" /> : null}
            <rect x={x + w * 0.62} y={top - w * 0.45} width="7" height="16" fill={MID} />
            <rect x={x} y={top} width={w} height={h + 20} fill={i % 2 ? "#c9c0ad" : "#b7ad98"} />
            <path d={`M${x - 4} ${top} L${x + w / 2} ${top - w * 0.55} L${x + w + 4} ${top} Z`} fill={ROOFS[i % ROOFS.length]} />
            <path d={`M${x - 4} ${top} L${x + w / 2} ${top - w * 0.55} L${x + w + 4} ${top}`} stroke={SNOW} strokeWidth="4" fill="none" />
            <rect x={x + w / 2 - 4} y={top + 14} width="8" height="10" fill={WARM} opacity="0.85" />
          </g>
        );
      })}
      {/* the bell tower */}
      <rect x="200" y="380" width="22" height="80" fill="#a69c88" />
      <path d="M196 380 L211 350 L226 380 Z" fill="#4c5f6f" />
      {/* garlands strung between the houses */}
      <Bunting x1={52} y1={base(52) - 64} x2={140} y2={base(140) - 76} sag={8} n={8} size={6} />
      <Bunting x1={174} y1={base(174) - 60} x2={272} y2={base(272) - 70} sag={8} n={9} size={6} />
      <Bunting x1={272} y1={base(272) - 70} x2={360} y2={base(360) - 66} sag={8} n={8} size={6} />
      {/* someone up on a roof with a garland */}
      <g transform={`translate(${246} ${base(230) - 118})`} fill={NEAR}>
        <circle r="4" cy="-12" />
        <rect x="-3" y="-8" width="6" height="12" />
      </g>
    </g>
  );
}

function STown() {
  return (
    <Stage>
      <Defs />
      <g className="cam">
        <rect width="400" height="800" fill="url(#sky-day)" />
        <g className="lay-far">
          <Town />
          <rect y="548" width="400" height="260" fill="url(#water)" />
          <Waves y={572} />
        </g>
        <Haze y={560} opacity={0.6} />
        <g className="lay-near">
          <path d="M-20 800 L-20 700 C80 690 200 700 420 730 L420 800 Z" fill={WOOD} />
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
        <rect width="400" height="800" fill="url(#sky-day)" />
        <g className="lay-far" opacity="0.95">
          <Town />
        </g>
        <g className="lay-mid">
          <rect y="560" width="400" height="260" fill="url(#water)" />
          <Waves y={590} />
          {/* the dock */}
          <path d="M150 560 L420 540 L420 600 L150 610 Z" fill="#7a6048" />
          <path d="M150 560 L420 540" stroke={SNOW} strokeWidth="4" />
          {[170, 230, 290, 350, 400].map((x, i) => (
            <rect key={x} x={x} y={560 - i * 4} width="9" height={110} fill={WOOD_DK} />
          ))}
          <Bunting x1={170} y1={540} x2={400} y2={524} sag={10} n={10} size={8} />
        </g>
        <g className="lay-near">
          <path d="M-20 560 L120 580 L140 820 L-20 820 Z" fill={WOOD} />
          <g className="gangplank">
            <rect x="110" y="572" width="170" height="12" rx="2" fill="#8a6a46" />
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
        <rect width={W} height="800" fill="url(#sky-day)" />
        {/* rooftops climbing to the right */}
        {Array.from({ length: 16 }, (_, i) => (
          <g key={i}>
            <rect x={i * 80 - 10} y={380 - i * 8} width="80" height="200" fill={i % 2 ? "#c9c0ad" : "#b7ad98"} />
            <path d={`M${i * 80 - 14} ${380 - i * 8} l44 -38 l44 38 z`} fill={ROOFS[i % ROOFS.length]} />
            <path d={`M${i * 80 - 14} ${380 - i * 8} l44 -38 l44 38`} stroke={SNOW} strokeWidth="4" fill="none" />
            <rect x={i * 80 + 20} y={420 - i * 8} width="14" height="16" fill={WARM} opacity="0.8" />
          </g>
        ))}
        <Bunting x1={20} y1={360} x2={300} y2={330} sag={14} n={14} />
        <Bunting x1={420} y1={330} x2={700} y2={300} sag={14} n={14} />
        <Bunting x1={820} y1={300} x2={1180} y2={262} sag={14} n={16} />
        {/* the street, rising */}
        <path d={`M0 640 L${W} 560 L${W} 800 L0 800 Z`} fill="url(#snowground)" />
        {EXTRAS.uphillDetail ? (
          <g className="uphill-detail" stroke="#8e9aa6" strokeWidth="2" fill="none" opacity="0.4">
            <path d="M520 800 C560 720 640 690 760 660 S 980 600 1220 590" />
            <path d="M552 800 C590 726 668 700 784 672 S 1000 612 1220 604" />
          </g>
        ) : null}

        {/* 1: the fisherman and the rope */}
        <g transform="translate(200 640)" fill={NEAR}>
          <path d="M-30 0 C-34 -40 -28 -70 -14 -84 C-4 -92 10 -92 18 -82 C30 -66 34 -36 30 0 Z" transform="rotate(-8)" fill="#3d5f8a" />
          <circle cx="-4" cy="-104" r="14" fill="#d9b48f" />
          <path d="M-20 -112 h34 l-6 -10 h-22 z" fill="#b8432f" />
          <path d="M-60 -60 C-20 -100 30 -20 70 -70 C90 -96 40 -120 10 -80 C-20 -40 60 -20 90 -40" stroke="#a08458" strokeWidth="3" fill="none" />
          <path d="M60 0 C40 -14 90 -20 80 0 Z" fill="#a08458" />
          <ellipse cx="100" cy="-6" rx="24" ry="9" fill="#6d7a86" />
        </g>

        {/* 2: a ladder that's seen better days, and someone hanging bunting from it */}
        <g transform="translate(540 600)">
          <rect x="60" y="-260" width="140" height="270" fill="#b7ad98" />
          <path d="M54 -260 l76 -60 l76 60 z" fill="#7a3d30" />
          <g className="wobble">
            <g stroke={WOOD} strokeWidth="5" strokeLinecap="round">
              <line x1="-30" y1="10" x2="20" y2="-200" />
              <line x1="10" y1="10" x2="52" y2="-196" />
              {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                <line key={i} x1={-26 + i * 7} y1={-10 - i * 28} x2={12 + i * 6} y2={-10 - i * 27} strokeWidth="3" />
              ))}
            </g>
            <g transform="translate(34 -200)">
              <path d="M-12 0 C-14 -26 -8 -40 0 -44 C8 -40 14 -26 12 0 Z" fill="#4e6a55" />
              <circle cy="-52" r="8" fill="#d9b48f" />
              <path d="M-8 -56 h16 l-3 -7 h-10 z" fill="#3b2d21" />
              <line x1="8" y1="-30" x2="40" y2="-60" stroke="#4e6a55" strokeWidth="5" strokeLinecap="round" />
            </g>
          </g>
          <Bunting x1={74} y1={-262} x2={200} y2={-240} sag={10} n={7} size={9} />
        </g>

        {/* 3: the bakery vent */}
        <g transform="translate(1000 400)">
          <rect x="-90" y="0" width="200" height="200" fill="#c9c0ad" />
          <path d="M-100 0 L10 -70 L120 0 Z" fill="#8a4a36" />
          <path d="M-100 0 L10 -70 L120 0" stroke={SNOW} strokeWidth="5" fill="none" />
          <rect x="40" y="-60" width="22" height="40" fill={MID} />
          <g className="steam" fill="none" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" opacity="0.8">
            <path d="M51 -66 c-14 -20 14 -30 0 -52 c-12 -18 10 -30 2 -50" />
          </g>
          <rect x="-60" y="80" width="46" height="38" fill={WARM} opacity="0.85" />
          <path d="M-70 76 h66" stroke={WOOD_DK} strokeWidth="4" />
          <Bunting x1={-90} y1={20} x2={110} y2={20} sag={6} n={10} size={8} />
        </g>
      </g>
    </svg>
  );
}

/** The empty tavern: a fire, the tall candle, empty tables. */
function EmptyRoom() {
  return (
    <>
      <rect width="400" height="800" fill="url(#warm-room)" />
      {/* the hearth */}
      <g transform="translate(200 520)">
        <path d="M-150 120 L-150 -80 L150 -80 L150 120 Z" fill="#4a2c18" />
        <path d="M-110 120 L-110 -10 C-110 -60 110 -60 110 -10 L110 120 Z" fill="#160a04" />
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
        {/* garland on the mantel */}
        <path d="M-160 -78 C-100 -50 -40 -50 0 -70 C40 -50 100 -50 160 -78" stroke="#3f7a5c" strokeWidth="8" fill="none" strokeLinecap="round" />
      </g>
      {/* the tall candle in its brass holder, perfectly still */}
      <g transform="translate(200 250)">
        <circle cx="0" cy="-16" r="70" fill="url(#glow-soft)" />
        <path d="M0 -40 c7 12 7 20 0 26 c-7 -6 -7 -14 0 -26 z" fill={WARM} />
        <rect x="-9" y="-12" width="18" height="120" fill="#efe3c8" />
        <path d="M-28 108 h56 l-8 16 h-40 z" fill="#b8893a" />
        <ellipse cx="0" cy="128" rx="34" ry="6" fill="#8f6a2a" />
      </g>
      {/* empty tables and stools */}
      {[
        [60, 720],
        [340, 710],
      ].map(([x, y]) => (
        <g key={x} transform={`translate(${x} ${y})`}>
          <ellipse rx="48" ry="12" fill="#6b4426" />
          <rect x="-4" y="0" width="8" height="40" fill="#3b2414" />
          <rect x="-58" y="12" width="14" height="30" fill="#4a2c18" />
          <rect x="44" y="12" width="14" height="30" fill="#4a2c18" />
        </g>
      ))}
    </>
  );
}

function SDoor({ open }: { open: boolean }) {
  return (
    <div className={`door-scene${open ? " open" : ""}`}>
      <Stage className="door-room">
        <Defs />
        <EmptyRoom />
      </Stage>
      <div className="door-flood" />
      <Stage className="door-front">
        <Defs />
        <rect width="400" height="800" fill="#b7ad98" />
        <rect y="0" width="400" height="120" fill="#7a3d30" />
        <path d="M0 120 H400" stroke={SNOW} strokeWidth="8" />
        <Bunting x1={-10} y1={130} x2={410} y2={130} sag={10} n={14} size={14} />
        <g className="door-leaf">
          <rect x="70" y="160" width="260" height="540" fill="#6a4a30" stroke="#3b2414" strokeWidth="8" />
          {[0, 1, 2, 3].map((i) => (
            <line key={i} x1={70 + 52 * (i + 1)} y1="160" x2={70 + 52 * (i + 1)} y2="700" stroke="#4e341f" strokeWidth="3" />
          ))}
          <rect x="70" y="260" width="260" height="16" fill="#3b2414" />
          <rect x="70" y="560" width="260" height="16" fill="#3b2414" />
          <circle cx="292" cy="430" r="9" fill="#b8893a" />
          {/* a Winterfest wreath */}
          <circle cx="200" cy="360" r="40" fill="none" stroke="#3f7a5c" strokeWidth="16" />
          <path d="M188 398 l12 -12 l12 12 z" fill="#b8432f" />
        </g>
        {/* the sign */}
        <g transform="translate(200 150)">
          <rect x="-90" y="-26" width="180" height="40" rx="6" fill="#3b2414" />
          <path d="M-6 -6 c4 6 4 10 0 13 c-4 -3 -4 -7 0 -13 z" fill={WARM} />
        </g>
        {/* light under the door */}
        <rect x="76" y="696" width="248" height="6" fill={WARM} className="under-door" />
        <rect y="712" width="400" height="90" fill="url(#snowground)" />
      </Stage>
    </div>
  );
}

function SMags({ shot }: { shot: number }) {
  // The five strangers, each at their own table in an otherwise empty room.
  const seats: [number, number, string][] = [
    [70, 400, "#7b4a3a"],
    [200, 370, "#4e6a55"],
    [330, 400, "#5a5470"],
    [120, 520, "#6d7a86"],
    [280, 520, "#3d5f8a"],
  ];
  return (
    <div className={`mags-scene${shot >= 1 ? " wide" : ""}`}>
      <div className="mags-close">
        <Stage>
          <Defs />
          <rect width="400" height="800" fill="url(#warm-room)" />
          <circle cx="200" cy="330" r="240" fill="url(#glow-soft)" />
          <g fill="#3a2010">
            <rect x="0" y="150" width="400" height="10" />
            <rect x="0" y="230" width="400" height="10" />
            {Array.from({ length: 14 }, (_, i) => (
              <rect key={i} x={10 + i * 28} y={i % 3 ? 116 : 108} width="12" height={i % 3 ? 34 : 42} rx="4" fill="#4d2e18" />
            ))}
          </g>
        </Stage>
        <img className="mags-portrait" src="/art/mags-wick.svg" alt="Mags Wick behind the bar: gray hair in a bun, rosy cheeks and a wide smile" width={400} height={400} />
      </div>
      <Stage className="mags-room">
        <Defs />
        <rect width="400" height="800" fill="url(#warm-room)" />
        {/* the bar along the back, Mags small behind it */}
        <rect x="40" y="220" width="320" height="40" fill="#6b4426" />
        <rect x="40" y="216" width="320" height="8" fill="#8a5a32" />
        <g transform="translate(200 220)">
          <circle cy="-24" r="10" fill="#e8c9a8" />
          <circle cy="-36" r="6" fill="#b9b3ab" />
          <path d="M-14 0 C-14 -12 14 -12 14 0 Z" fill="#3d5f8a" />
        </g>
        <g transform="translate(200 120)">
          <circle r="40" fill="url(#glow-soft)" />
          <rect x="-3" y="-4" width="6" height="30" fill="#efe3c8" />
          <path d="M0 -14 c3 5 3 8 0 10 c-3 -2 -3 -5 0 -10 z" fill={WARM} />
        </g>
        {seats.map(([x, y, c], i) => (
          <g key={i} transform={`translate(${x} ${y})`}>
            <ellipse rx="44" ry="12" fill="#6b4426" />
            <rect x="-3" y="0" width="6" height="36" fill="#3b2414" />
            <g transform="translate(-8 -2) scale(0.62)">
              <Cloaked x={0} y={0} color={c} flip={i % 2 === 1} />
            </g>
          </g>
        ))}
      </Stage>
    </div>
  );
}

export function SceneArt({ scene, shot }: { scene: SceneId; shot: number }) {
  switch (scene) {
    case "sea":
      return <SSea />;
    case "deck":
      return <SDeck />;
    case "passengers":
      return <SPassengers />;
    case "rivermouth":
      return <SRiverMouth />;
    case "town":
      return <STown />;
    case "docking":
      return <SDocking />;
    case "uphill":
      return <SUphill shot={shot} />;
    case "door":
      return <SDoor open={shot >= 1} />;
    case "mags":
      return <SMags shot={shot} />;
  }
}
