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
  return (
    <g>
      {scatter(n, seed, 1920, h).map(([x, y, k], i) => (
        <circle key={i} className={i % 3 ? undefined : "amb-twinkle"} cx={x} cy={y} r={1 + k * 1.6} fill="#eef0ff" opacity={0.5 + k * 0.5} style={delay(k * 4)} />
      ))}
    </g>
  );
}

/** Two layers of rain falling: each layer is drawn twice, one screen apart, and slides down one screen. */
function Rain({ n = 46, seed = 7, slant = -10 }: { n?: number; seed?: number; slant?: number }) {
  const drops = scatter(n, seed);
  const layer = (cls: string, part: [number, number, number][], len: number, op: number) => (
    <g className={cls}>
      {[0, -1080].map((dy) => (
        <g key={dy} transform={`translate(0 ${dy})`}>
          {part.map(([x, y], i) => (
            <line key={i} x1={x} y1={y} x2={x + slant} y2={y + len} stroke="#b9c8e6" strokeWidth={2} strokeLinecap="round" opacity={op} />
          ))}
        </g>
      ))}
    </g>
  );
  return (
    <g>
      {layer("amb-fall-slow", drops.slice(0, n / 2), 34, 0.35)}
      {layer("amb-fall-fast", drops.slice(n / 2), 56, 0.6)}
    </g>
  );
}

function Snow({ n = 60, seed = 11 }: { n?: number; seed?: number }) {
  const flakes = scatter(n, seed);
  const layer = (cls: string, part: [number, number, number][], r: number, op: number) => (
    <g className={cls}>
      {[0, -1080].map((dy) => (
        <g key={dy} transform={`translate(0 ${dy})`}>
          {part.map(([x, y, k], i) => (
            <circle key={i} cx={x} cy={y} r={r + k * 2} fill="#ffffff" opacity={op} />
          ))}
        </g>
      ))}
    </g>
  );
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
      <ellipse cx="963" cy="960" rx="220" ry="18" fill="#ffcf7a" opacity="0.18" className="amb-glimmer" />
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
