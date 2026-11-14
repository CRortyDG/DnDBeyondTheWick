"use client";

import type { DieSides } from "@/shared/dice";

/** Each die gets its own silhouette and colour, so a d8 never reads as a d10 across the room. */
const SHAPES: Record<DieSides, { outline: string; facets?: string; ty: number; fill: string; ink: string }> = {
  4: { outline: "50,6 95,88 5,88", facets: "50,6 50,62 M5,88 50,62 95,88", ty: 70, fill: "#2f6b4c", ink: "#f3e7c9" },
  6: { outline: "14,14 86,14 86,86 14,86", ty: 52, fill: "#e8dcc0", ink: "#2b2118" },
  8: { outline: "50,4 95,50 50,96 5,50", facets: "5,50 95,50", ty: 50, fill: "#2f4f7a", ink: "#f3e7c9" },
  10: { outline: "50,4 95,44 50,96 5,44", facets: "5,44 50,58 95,44 M50,58 50,96", ty: 44, fill: "#5b3a7c", ink: "#f3e7c9" },
  12: { outline: "50,4 94,36 77,90 23,90 6,36", facets: "50,22 74,42 65,72 35,72 26,42 50,22", ty: 52, fill: "#28686a", ink: "#f3e7c9" },
  20: {
    outline: "50,4 91,27 91,73 50,96 9,73 9,27",
    facets: "50,18 79,66 21,66 50,18 M50,4 50,18 M91,27 79,66 M9,27 21,66 M50,96 21,66 M50,96 79,66 M91,73 79,66 M9,73 21,66",
    ty: 50,
    fill: "#8a2a1f",
    ink: "#f3e7c9",
  },
  100: { outline: "50,4 95,44 50,96 5,44", facets: "50,18 80,46 50,82 20,46 50,18", ty: 46, fill: "#a07a2a", ink: "#1c140d" },
};

/** One die face-on with a number on it. The number is optional (an empty die for buttons). */
export function Die({ sides, value, className, title }: { sides: DieSides; value?: number | string; className?: string; title?: string }) {
  const sh = SHAPES[sides];
  const text = value === undefined ? "" : String(value);
  // Long numbers (100, "d100") shrink to fit.
  const size = text.length >= 4 ? 22 : text.length === 3 ? 28 : sides === 4 ? 32 : 38;
  return (
    <svg className={`die die-d${sides}${className ? ` ${className}` : ""}`} viewBox="0 0 100 100" role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <polygon points={sh.outline} fill={sh.fill} stroke="rgba(0,0,0,0.45)" strokeWidth="3" strokeLinejoin="round" />
      {sh.facets ? <path d={toPath(sh.facets)} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="2" strokeLinejoin="round" /> : null}
      <polygon points={sh.outline} fill="url(#die-shine)" opacity="0.35" />
      {text ? (
        <text x="50" y={sh.ty} textAnchor="middle" dominantBaseline="central" fill={sh.ink} fontSize={size} fontFamily="var(--font-num)" fontWeight="700">
          {text}
        </text>
      ) : null}
      <defs>
        <linearGradient id="die-shine" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.9" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** "50,6 50,62 M5,88 50,62" → an SVG path of connected points. */
function toPath(s: string): string {
  return s
    .split("M")
    .map((run) => {
      const pts = run.trim().split(/\s+/);
      return pts.length ? `M${pts.join(" L")}` : "";
    })
    .join(" ");
}
