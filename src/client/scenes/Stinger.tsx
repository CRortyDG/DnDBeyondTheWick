"use client";

// Episode one's stinger, played once on the TV when the DM shows it (about 27 s),
// then held on its last frame. Drawn in SVG and moved with CSS (see the
// "stinger" section of globals.css), so there are no files and no sound.
//
//  0–6 s   the Flickering Candle's warm window pulls back to the inn at night
//  6–9 s   drift to the door, then dark
//  9–11 s  moonlight: the edge of town, the Trollbark, a lantern cart
// 11–16 s  the old woman hands the child something; the child jumps; she waves
// 16–23 s  she walks her cart toward the Trollbark
// 23–25 s  one more lantern flickers to life
// 25 s+    "End of episode one"

const STARS: [number, number, number][] = [
  [120, 90, 2], [260, 180, 1.5], [410, 70, 2.2], [560, 150, 1.4], [700, 60, 1.8], [860, 130, 1.3], [1010, 80, 2],
  [1160, 170, 1.5], [1290, 60, 1.8], [1650, 110, 1.6], [1780, 200, 2], [1860, 70, 1.4], [330, 300, 1.2], [980, 260, 1.4],
  [1200, 300, 1.2], [640, 280, 1.3], [80, 330, 1.5], [1720, 330, 1.2],
];

const LANTERNS = [0, 1, 2, 3, 4, 5, 6];

function Lantern({ x, y, lit, last }: { x: number; y: number; lit: boolean; last?: boolean }) {
  return (
    <g className={last ? "stg-last-lantern" : undefined}>
      <line x1={x} y1={y - 14} x2={x} y2={y - 4} stroke="#2b2118" strokeWidth={2} />
      {lit ? <circle className="stg-glow" cx={x} cy={y + 6} r={26} fill="url(#stg-lantern-glow)" style={{ animationDelay: `${(x % 7) * 0.13}s` }} /> : null}
      <rect x={x - 6} y={y - 4} width={12} height={18} rx={4} fill={lit ? "#ffd27a" : "#3a3326"} stroke="#2b2118" strokeWidth={2} />
      {last ? (
        <>
          <circle className="stg-last-glow" cx={x} cy={y + 6} r={34} fill="url(#stg-lantern-glow)" />
          <rect className="stg-last-flame" x={x - 6} y={y - 4} width={12} height={18} rx={4} fill="#ffd27a" stroke="#2b2118" strokeWidth={2} />
        </>
      ) : null}
    </g>
  );
}

function Stars({ prefix }: { prefix: string }) {
  return (
    <g>
      {STARS.map(([x, y, r], i) => (
        <circle key={prefix + i} className="stg-star" cx={x} cy={y} r={r} fill="#e9eefb" style={{ animationDelay: `${(i * 0.37) % 3}s` }} />
      ))}
    </g>
  );
}

/** The Flickering Candle on a snowy night. */
function Inn() {
  const win = (x: number, y: number, k: number) => (
    <g key={k}>
      <circle cx={x + 45} cy={y + 50} r={110} fill="url(#stg-window-glow)" className="stg-glow" style={{ animationDelay: `${k * 0.4}s` }} />
      <rect x={x} y={y} width={90} height={100} rx={8} fill="#ffc768" stroke="#2a1a10" strokeWidth={8} />
      {/* Guests inside: a few warm silhouettes. */}
      <circle cx={x + 28} cy={y + 64} r={13} fill="#c9762f" />
      <circle cx={x + 62} cy={y + 60} r={11} fill="#c9762f" />
      <rect x={x + 14} y={y + 76} width={62} height={24} rx={6} fill="#c9762f" />
      <line x1={x + 45} y1={y} x2={x + 45} y2={y + 100} stroke="#2a1a10" strokeWidth={6} />
      <line x1={x} y1={y + 46} x2={x + 90} y2={y + 46} stroke="#2a1a10" strokeWidth={6} />
    </g>
  );
  return (
    <g>
      <rect width={1920} height={1080} fill="url(#stg-night)" />
      <Stars prefix="inn" />
      <ellipse cx={960} cy={860} rx={1300} ry={200} fill="#2a3552" />
      {/* Neighbours */}
      <path d="M120 790 L120 600 L230 520 L340 600 L340 790 Z" fill="#1d2539" />
      <rect x={200} y={650} width={46} height={52} rx={4} fill="#d9a24f" opacity={0.7} />
      <path d="M1580 790 L1580 580 L1700 500 L1820 580 L1820 790 Z" fill="#1d2539" />
      {/* Chimney and smoke */}
      <rect x={1150} y={250} width={70} height={150} fill="#3a2a22" />
      <rect x={1140} y={238} width={90} height={22} rx={6} fill="#e7edf6" />
      <g className="stg-smoke" fill="#8d97ad">
        <circle cx={1185} cy={210} r={26} opacity={0.35} />
        <circle cx={1210} cy={160} r={34} opacity={0.25} />
        <circle cx={1245} cy={100} r={42} opacity={0.15} />
      </g>
      {/* Roof with snow */}
      <path d="M560 470 L960 250 L1360 470 Z" fill="#4a2f22" />
      <path d="M560 470 L960 250 L1360 470 L1320 470 L960 284 L600 470 Z" fill="#e7edf6" />
      <path d="M548 476 Q960 440 1372 476 L1372 494 Q960 462 548 494 Z" fill="#e7edf6" />
      {/* Walls */}
      <rect x={620} y={470} width={680} height={320} fill="#6b4329" />
      <rect x={620} y={470} width={680} height={320} fill="none" stroke="#3b2516" strokeWidth={10} />
      <line x1={620} y1={600} x2={1300} y2={600} stroke="#3b2516" strokeWidth={8} />
      {win(670, 500, 0)}
      {win(800, 500, 1)}
      {win(1030, 500, 2)}
      {win(1160, 500, 3)}
      {/* Door */}
      <circle cx={960} cy={720} r={150} fill="url(#stg-window-glow)" opacity={0.6} />
      <path d="M905 790 L905 660 Q960 610 1015 660 L1015 790 Z" fill="#3b2516" />
      <path d="M955 790 L955 640 L965 640 L965 790 Z" fill="#ffc768" opacity={0.8} />
      <circle cx={995} cy={725} r={6} fill="#d9a24f" />
      {/* Sign: a candle */}
      <line x1={1030} y1={630} x2={1110} y2={630} stroke="#2a1a10" strokeWidth={6} />
      <rect x={1062} y={636} width={60} height={60} rx={8} fill="#e8d3a6" stroke="#2a1a10" strokeWidth={4} />
      <rect x={1084} y={660} width={16} height={28} rx={3} fill="#f5efe3" stroke="#2a1a10" strokeWidth={2} />
      <path className="stg-flicker" d="M1092 644 Q1100 654 1092 660 Q1084 654 1092 644 Z" fill="#ff9a3c" />
      {/* Snow on the ground */}
      <path d="M0 790 Q480 760 960 790 T1920 790 L1920 1080 L0 1080 Z" fill="#c8d2e2" />
      <path d="M0 860 Q600 830 1200 870 T1920 860 L1920 1080 L0 1080 Z" fill="#b5c1d6" />
      <path d="M760 790 L900 1080 L1020 1080 L1060 790 Z" fill="#ffc768" opacity={0.08} />
    </g>
  );
}

/** Moonlight at the edge of town: the old woman, the child, and the lantern cart. */
function EdgeOfTown() {
  const arch = (i: number) => {
    const t = i / (LANTERNS.length - 1);
    return { x: 704 + t * 232, y: 562 + Math.sin(t * Math.PI) * 26 };
  };
  return (
    <g>
      <rect width={1920} height={1080} fill="url(#stg-moon-sky)" />
      <Stars prefix="moon" />
      <circle cx={1620} cy={210} r={190} fill="url(#stg-moon-glow)" />
      <circle cx={1620} cy={210} r={70} fill="#f3eedb" />
      <circle cx={1598} cy={196} r={12} fill="#e3dcc4" />
      <circle cx={1640} cy={232} r={8} fill="#e3dcc4" />
      {/* Far hills */}
      <path d="M0 700 Q300 600 640 660 T1300 640 T1920 620 L1920 1080 L0 1080 Z" fill="#1b2541" />
      {/* Last houses of town */}
      <g fill="#121a2e">
        <path d="M0 800 L0 560 L90 490 L180 560 L180 800 Z" />
        <path d="M170 800 L170 610 L260 545 L350 610 L350 800 Z" />
        <rect x={50} y={590} width={18} height={60} />
      </g>
      <rect x={236} y={650} width={34} height={38} rx={3} fill="#d9a24f" opacity={0.75} />
      {/* The Trollbark */}
      <g fill="#0a120f">
        {[1300, 1360, 1420, 1490, 1550, 1620, 1690, 1760, 1830, 1900].map((x, i) => {
          const h = 260 + ((i * 53) % 120);
          return <path key={x} d={`M${x - 70} 820 L${x} ${820 - h} L${x + 70} 820 Z`} />;
        })}
        <rect x={1260} y={760} width={700} height={80} />
      </g>
      {/* Snowy road into the trees */}
      <path d="M0 800 Q700 770 1300 800 T1920 810 L1920 1080 L0 1080 Z" fill="#7e8cab" />
      <path d="M0 880 Q800 850 1920 900 L1920 1080 L0 1080 Z" fill="#6b7898" />
      <path d="M380 1080 Q900 860 1330 805 L1400 808 Q1000 900 760 1080 Z" fill="#8f9cba" opacity={0.6} />

      {/* The figures, drawn at 1x and scaled up from the ground line so they read from the couch. */}
      <g transform="translate(-224 -305) scale(1.35)">
      {/* The child stays behind. */}
      <g className="stg-child">
       <g transform="translate(-70 0)">
        <ellipse cx={520} cy={872} rx={34} ry={7} fill="#000" opacity={0.25} />
        <rect x={504} y={830} width={12} height={40} rx={5} fill="#2b2b3a" />
        <rect x={522} y={830} width={12} height={40} rx={5} fill="#2b2b3a" />
        <path d="M494 840 L500 772 Q519 758 538 772 L544 840 Z" fill="#9c4a3a" />
        <rect x={496} y={772} width={46} height={12} rx={6} fill="#e3c35a" />
        <circle cx={519} cy={752} r={22} fill="#f0c6a0" />
        <path d="M497 750 Q519 718 541 750 Q530 738 519 740 Q508 738 497 750 Z" fill="#5a3a26" />
        <g className="stg-child-arm">
          <rect x={536} y={778} width={11} height={42} rx={5} fill="#9c4a3a" transform="rotate(-20 541 780)" />
        </g>
        {/* What she gave: a tiny glowing thing, held up. */}
        <g className="stg-gift-held">
          <circle cx={562} cy={772} r={22} fill="url(#stg-lantern-glow)" />
          <circle cx={562} cy={772} r={6} fill="#ffe3a0" />
        </g>
       </g>
      </g>

      {/* The old woman and her cart walk off together. */}
      <g className="stg-walker">
        <g className="stg-bob">
          {/* Cart */}
          <ellipse cx={820} cy={872} rx={170} ry={10} fill="#000" opacity={0.25} />
          <rect x={690} y={720} width={260} height={110} rx={10} fill="#6b4329" stroke="#2b2118" strokeWidth={6} />
          <line x1={690} y1={760} x2={950} y2={760} stroke="#2b2118" strokeWidth={4} />
          <line x1={690} y1={795} x2={950} y2={795} stroke="#2b2118" strokeWidth={4} />
          <path d="M680 722 Q820 660 960 722" fill="#4f6b5a" stroke="#2b2118" strokeWidth={6} />
          <line x1={702} y1={722} x2={702} y2={560} stroke="#2b2118" strokeWidth={7} />
          <line x1={938} y1={722} x2={938} y2={560} stroke="#2b2118" strokeWidth={7} />
          <path d="M702 556 Q820 600 938 556" fill="none" stroke="#2b2118" strokeWidth={3} />
          {LANTERNS.map((i) => {
            const p = arch(i);
            const last = i === 4;
            return <Lantern key={i} x={p.x} y={p.y} lit={!last} last={last} />;
          })}
          <line x1={690} y1={800} x2={640} y2={810} stroke="#2b2118" strokeWidth={8} strokeLinecap="round" />
          {[760, 880].map((cx) => (
            <g key={cx} className="stg-wheel" style={{ transformOrigin: `${cx}px 840px` }}>
              <circle cx={cx} cy={840} r={32} fill="#3b2516" stroke="#2b2118" strokeWidth={6} />
              <line x1={cx - 30} y1={840} x2={cx + 30} y2={840} stroke="#8a6a4a" strokeWidth={4} />
              <line x1={cx} y1={810} x2={cx} y2={870} stroke="#8a6a4a" strokeWidth={4} />
            </g>
          ))}
          {/* The old woman, hooded and stooped, at the cart's handle */}
          <ellipse cx={632} cy={874} rx={44} ry={8} fill="#000" opacity={0.25} />
          <path d="M590 872 Q596 780 612 740 Q632 700 664 712 Q684 760 680 872 Z" fill="#3d3a5c" />
          <path d="M604 760 Q610 700 650 692 Q678 700 676 740 Q666 726 646 726 Q620 728 604 760 Z" fill="#2c2944" />
          <circle cx={640} cy={728} r={17} fill="#e2b892" />
          <path d="M624 726 Q640 742 656 726" fill="none" stroke="#2c2944" strokeWidth={2} opacity={0.6} />
          <path d="M630 742 Q640 752 650 742" fill="#d8d3c8" />
          {/* Her arm: reaches out with the gift, then waves */}
          <g className="stg-woman-arm" style={{ transformOrigin: "612px 768px" }}>
            <rect x={566} y={762} width={52} height={13} rx={6} fill="#3d3a5c" />
            <circle cx={566} cy={768} r={8} fill="#e2b892" />
          </g>
        </g>
      </g>
      {/* The gift on its way from her hand to the child's */}
      <g className="stg-gift">
        <circle cx={566} cy={768} r={22} fill="url(#stg-lantern-glow)" />
        <circle cx={566} cy={768} r={6} fill="#ffe3a0" />
      </g>
      </g>
      {/* Falling snow */}
      <g className="stg-snow" fill="#e1e9f2">
        {Array.from({ length: 40 }, (_, i) => (
          <circle key={i} cx={(i * 197) % 1920} cy={(i * 131) % 1080} r={1.5 + (i % 3)} opacity={0.6} />
        ))}
      </g>
    </g>
  );
}

export function Stinger() {
  return (
    <div className="scene-fill stinger" role="img" aria-label="The stinger: the Flickering Candle at night, then moonlight at the edge of town, where an old woman gives a child something small and walks her lantern cart into the Trollbark as one more lantern lights. End of episode one.">
      <svg viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <linearGradient id="stg-night" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0b1228" />
            <stop offset="1" stopColor="#25304f" />
          </linearGradient>
          <linearGradient id="stg-moon-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#070b1c" />
            <stop offset="1" stopColor="#1e2a4c" />
          </linearGradient>
          <radialGradient id="stg-window-glow">
            <stop offset="0" stopColor="#ffbe5c" stopOpacity="0.55" />
            <stop offset="1" stopColor="#ffbe5c" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="stg-lantern-glow">
            <stop offset="0" stopColor="#ffd27a" stopOpacity="0.9" />
            <stop offset="1" stopColor="#ffd27a" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="stg-moon-glow">
            <stop offset="0" stopColor="#dfe6ff" stopOpacity="0.35" />
            <stop offset="1" stopColor="#dfe6ff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <g className="stg-inn">
          <Inn />
        </g>
        <g className="stg-town">
          <EdgeOfTown />
        </g>
      </svg>
      <div className="stg-end">
        <div className="stg-end-text">End of episode one</div>
      </div>
    </div>
  );
}
