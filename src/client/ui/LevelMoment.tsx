"use client";

import { useTvMoment } from "./useTvMoment";
import type { TvView } from "@/shared/projection";

/** "Level 3!" on the TV for a few seconds, in the Renown moment's style. Never on first load. */
export function LevelMoment({ moment }: { moment: TvView["levelMoment"] }) {
  const [shown] = useTvMoment(moment, moment?.n ?? null, () => 8000);
  if (!shown) return null;
  const names = shown.who.map((w) => w.name);
  return (
    <div className="renown-moment level-moment" role="status" key={shown.n}>
      <div className="renown-moment-card">
        <div className="renown-moment-kicker">Level up</div>
        <div className="renown-moment-line">{shown.level !== null ? `Level ${shown.level}!` : "Level up!"}</div>
        {shown.level !== null ? (
          <div className="renown-moment-rank">{names.join(" · ")}</div>
        ) : (
          <div className="level-moment-list">
            {shown.who.map((w, i) => (
              <div key={i} className="renown-moment-rank">
                {w.name} <span className="level-moment-n">level {w.level}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
