"use client";

import { ATTITUDE_MAX, ATTITUDE_MIN, BANDS, bandInfo, bandOf, signed } from "@/shared/attitude";

/** The middle of the score's step on the track. */
const pct = (n: number) => ((n - ATTITUDE_MIN + 0.5) / (ATTITUDE_MAX - ATTITUDE_MIN + 1)) * 100;

/** A band's share of the track. */
const width = (i: number) => {
  const hi = i + 1 < BANDS.length ? BANDS[i + 1].min : ATTITUDE_MAX + 1;
  return `${((hi - BANDS[i].min) / (ATTITUDE_MAX - ATTITUDE_MIN + 1)) * 100}%`;
};

/** The dial: five bands, the party's marker, and a small one per character who stands apart. */
export function AttitudeDial({ score, others = [], compact }: { score: number; others?: { id: string; name: string; score: number }[]; compact?: boolean }) {
  const band = bandInfo(bandOf(score));
  return (
    <div className={`att-dial${compact ? " compact" : ""}${others.length ? " with-others" : ""}`} role="meter" aria-valuemin={ATTITUDE_MIN} aria-valuemax={ATTITUDE_MAX} aria-valuenow={score} aria-valuetext={`${band.label}, ${signed(score)}`}>
      <div className="att-track">
        {BANDS.map((b, i) => {
          return <span key={b.id} className={`att-seg att-${b.id}${b.id === band.id ? " on" : ""}`} style={{ width: width(i) }} title={b.label} />;
        })}
        {others.map((o) => (
          <span key={o.id} className="att-pip other" style={{ left: `${pct(o.score)}%` }} title={`${o.name}: ${signed(o.score)}`}>
            <span className="att-pip-label">{o.name.slice(0, 1)}</span>
          </span>
        ))}
        <span className="att-pip" style={{ left: `${pct(score)}%` }} />
      </div>
      {compact ? null : (
        <div className="att-labels" aria-hidden>
          {BANDS.map((b, i) => (
            <span key={b.id} className={b.id === band.id ? "on" : ""} style={{ width: width(i) }}>
              {b.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

