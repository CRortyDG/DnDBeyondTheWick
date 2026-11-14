"use client";

import { useEffect, useRef, useState } from "react";
import { RENOWN } from "@/shared/renown";
import type { TvView } from "@/shared/projection";

/**
 * The party's Renown went up: a big moment on the TV for a few seconds.
 * Never on first load, so a reload doesn't replay it.
 */
export function RenownMoment({ moment }: { moment: TvView["renownMoment"] }) {
  const seen = useRef<number | null | undefined>(undefined);
  const [shown, setShown] = useState<NonNullable<TvView["renownMoment"]> | null>(null);
  useEffect(() => {
    const n = moment?.n ?? null;
    if (seen.current === undefined) {
      seen.current = n;
      return;
    }
    if (n === seen.current) return;
    seen.current = n;
    if (!moment) return;
    setShown(moment);
    const t = setTimeout(() => setShown(null), 8000);
    return () => clearTimeout(t);
  }, [moment]);
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
