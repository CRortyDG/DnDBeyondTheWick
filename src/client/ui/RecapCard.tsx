"use client";

import { useEffect, useRef, useState } from "react";
import type { TvView } from "@/shared/projection";
import { chime, useTvSound } from "./tvSound";

/** "Tonight you met…" when the DM ends a session. Never on first load. */
export function RecapCard({ card }: { card: TvView["recapCard"] }) {
  const seen = useRef<number | null | undefined>(undefined);
  const [shown, setShown] = useState<NonNullable<TvView["recapCard"]> | null>(null);
  const [sound] = useTvSound();
  const soundRef = useRef(sound);
  soundRef.current = sound;
  useEffect(() => {
    const n = card?.n ?? null;
    if (seen.current === undefined) {
      seen.current = n;
      return;
    }
    if (n === seen.current) return;
    seen.current = n;
    if (!card) return setShown(null);
    setShown(card);
    if (soundRef.current) chime("reveal");
    const t = setTimeout(() => setShown(null), 15000);
    return () => clearTimeout(t);
  }, [card]);
  if (!shown) return null;
  return (
    <div className="disc-moment recap-card" role="status" key={shown.n}>
      <div className="disc-card">
        <div className="disc-text">
          <div className="disc-kicker">This session</div>
          <div className="disc-fact">{shown.text}</div>
        </div>
      </div>
    </div>
  );
}
