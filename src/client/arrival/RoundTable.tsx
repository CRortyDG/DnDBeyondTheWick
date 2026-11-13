"use client";

// The round table at the Flickering Candle, seen from above: one candle per
// seat. Used small on the seat page and full-screen on the TV.

export interface TableSeat {
  name: string | null;
  lit: boolean;
  me?: boolean;
  /** Restart the flare animation by changing this. */
  flare?: number;
}

export function RoundTable({ seats, names = true, size = 320, wide = 280, className = "" }: { seats: TableSeat[]; names?: boolean; size?: number | string; wide?: number; className?: string }) {
  const n = Math.max(seats.length, 1);
  const R = 150; // table
  const rc = 118; // candles
  const rn = 205; // names
  return (
    <svg className={`round-table ${className}`} viewBox={`${-wide} -280 ${wide * 2} 560`} width={size} height={size} role="img" aria-label={`A round table with ${seats.length} candles, ${seats.filter((s) => s.lit).length} lit`}>
      <defs>
        <radialGradient id="rt-wood" cx="0.45" cy="0.4" r="0.7">
          <stop offset="0" stopColor="#5a3a22" />
          <stop offset="1" stopColor="#2c1a0f" />
        </radialGradient>
        <radialGradient id="rt-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffc46b" stopOpacity="0.85" />
          <stop offset="0.4" stopColor="#ffc46b" stopOpacity="0.25" />
          <stop offset="1" stopColor="#ffc46b" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle r={R + 14} fill="#1a0f08" />
      <circle r={R} fill="url(#rt-wood)" />
      {[0.35, 0.6, 0.85].map((k) => (
        <circle key={k} r={R * k} fill="none" stroke="#24150c" strokeWidth="1.5" opacity="0.6" />
      ))}
      {seats.map((s, i) => {
        const a = (i / n) * Math.PI * 2 - Math.PI / 2;
        const x = Math.cos(a) * rc;
        const y = Math.sin(a) * rc;
        // Names sit just beyond the chairs: further out at the top and bottom, where the text is centred.
        const vert = Math.abs(Math.cos(a)) < 0.3;
        const nx = Math.cos(a) * (vert ? rn : rn + 16);
        const ny = Math.sin(a) * rn + (vert ? Math.sign(Math.sin(a)) * 36 : 0);
        return (
          <g key={i} className={`rt-seat${s.lit ? " lit" : ""}${s.me ? " me" : ""}`}>
            {/* the chair */}
            <circle cx={Math.cos(a) * (R + 40)} cy={Math.sin(a) * (R + 40)} r="22" fill="#1c120b" stroke="#2c1d12" strokeWidth="3" />
            <g transform={`translate(${x} ${y})`}>
              {s.lit ? <circle key={`g${s.flare ?? 0}`} r="60" fill="url(#rt-glow)" className="rt-glow" /> : null}
              <circle r="13" fill="#b8893a" />
              <circle r="8" fill={s.lit ? "#f3e6c8" : "#8c8476"} />
              {s.lit ? <path key={`f${s.flare ?? 0}`} className="rt-flame" d="M0 -20 c5 7 5 13 0 16 c-5 -3 -5 -9 0 -16 z" fill="#ffd27a" /> : <line x1="0" y1="-8" x2="0" y2="-13" stroke="#3a332b" strokeWidth="2" />}
            </g>
            {names && s.name ? (
              <text x={nx} y={ny} textAnchor={vert ? "middle" : nx > 0 ? "start" : "end"} dominantBaseline="middle" className="rt-name">
                {s.name.length > 22 ? s.name.slice(0, 21) + "\u2026" : s.name}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}
