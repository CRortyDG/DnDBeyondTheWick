"use client";

import { useEffect, useRef, useState } from "react";
import type { TvView } from "@/shared/projection";
import { Portrait } from "./Portrait";

/**
 * Someone new in the story, or something learned about them: a card on the TV
 * for a few seconds. Never on first load, so a reload doesn't replay it.
 */
export function NpcMoment({ moment }: { moment: TvView["npcMoment"] }) {
  const seen = useRef<number | null | undefined>(undefined);
  const [shown, setShown] = useState<NonNullable<TvView["npcMoment"]> | null>(null);
  useEffect(() => {
    const n = moment?.n ?? null;
    if (seen.current === undefined) {
      seen.current = n;
      return;
    }
    if (n === seen.current) return;
    seen.current = n;
    if (!moment) return setShown(null);
    setShown(moment);
    const t = setTimeout(() => setShown(null), moment.fact ? 10000 : 8000);
    return () => clearTimeout(t);
  }, [moment]);
  // Taken back (a fact hidden again): off the TV at once.
  useEffect(() => {
    if (shown && !moment) setShown(null);
  }, [moment, shown]);
  if (!shown) return null;
  return (
    <div className={`npc-moment${shown.fact ? " fact" : ""}`} role="status" key={shown.n}>
      <div className="npc-moment-card">
        <Portrait art={shown.art} name={shown.name} className="npc-moment-face" />
        <div className="npc-moment-text">
          <div className="npc-moment-kicker">{shown.fact ? `About ${shown.name}` : "A new face"}</div>
          {shown.fact ? (
            <div className="npc-moment-fact">{shown.fact}</div>
          ) : (
            <>
              <div className="npc-moment-name">{shown.name}</div>
              {shown.title ? <div className="npc-moment-title">{shown.title}</div> : null}
            </>
          )}
          <div className="npc-moment-foot">Added to People on your phones</div>
        </div>
      </div>
    </div>
  );
}
