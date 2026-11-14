"use client";

import { useRef } from "react";
import { useTvMoment } from "./useTvMoment";
import type { TvView } from "@/shared/projection";
import { chime, useTvSound } from "./tvSound";

/** "Tonight you met…" when the DM ends a session. Never on first load. */
export function RecapCard({ card }: { card: TvView["recapCard"] }) {
  const [sound] = useTvSound();
  const soundRef = useRef(sound);
  soundRef.current = sound;
  const [shown] = useTvMoment(card, card?.n ?? null, () => 15000, {
    clearOnNull: true,
    onShow: () => soundRef.current && chime("reveal"),
  });
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
