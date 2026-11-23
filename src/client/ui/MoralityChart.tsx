"use client";

import { ALIGNMENTS, alignmentOf, MORAL_MAX, MORAL_MIN, signedMoral } from "@/shared/morality";

/** Lawful on the left, good on top: the classic chart. */
const x = (law: number) => ((MORAL_MAX - law + 0.5) / (MORAL_MAX - MORAL_MIN + 1)) * 100;
const y = (good: number) => ((MORAL_MAX - good + 0.5) / (MORAL_MAX - MORAL_MIN + 1)) * 100;

/** The nine alignments as a 3x3 chart, a dot where they stand, and (for the DM) faint dots where they were. */
export function MoralityChart({ law, good, trail = [], compact }: { law: number; good: number; trail?: { law: number; good: number }[]; compact?: boolean }) {
  const here = alignmentOf(law, good);
  return (
    <div className={`mor-chart${compact ? " compact" : ""}`} role="img" aria-label={`${here.label}. Lawful to chaotic ${signedMoral(law)}, good to evil ${signedMoral(good)}.`}>
      <div className="mor-grid" aria-hidden>
        {ALIGNMENTS.map((a) => (
          <span key={a.id} className={`mor-cell mor-${a.id}${a.id === here.id ? " on" : ""}`}>
            <span className="mor-cell-label">{a.label}</span>
          </span>
        ))}
        {trail.map((t, i) => (
          <span key={i} className="mor-dot was" style={{ left: `${x(t.law)}%`, top: `${y(t.good)}%`, opacity: 0.15 + (0.45 * (i + 1)) / (trail.length + 1) }} />
        ))}
        <span className="mor-dot" style={{ left: `${x(law)}%`, top: `${y(good)}%` }} />
      </div>
    </div>
  );
}
