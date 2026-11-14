"use client";

import { useTvMoment } from "./useTvMoment";
import { RENOWN } from "@/shared/renown";
import type { TvView } from "@/shared/projection";

/**
 * The party's Renown went up: a big moment on the TV for a few seconds.
 * Never on first load, so a reload doesn't replay it.
 */
export function RenownMoment({ moment }: { moment: TvView["renownMoment"] }) {
  const [shown] = useTvMoment(moment, moment?.n ?? null, () => 8000);
  if (!shown) return null;
  const r = RENOWN[shown.rank];
  return (
    <div className="renown-moment" role="status" key={shown.n}>
      <div className="renown-moment-card">
        <div className="renown-moment-kicker">Renown</div>
        <div className="renown-moment-line">{r?.raised ?? shown.name}</div>
        <div className="renown-moment-rank">{shown.name}</div>
        {r ? <div className="renown-moment-meaning">{r.meaning}</div> : null}
      </div>
    </div>
  );
}
