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

/** World news for every party ("Winterfest begins."), when the DM posts it or the date reaches an event. */
export function WorldNewsCard({ news }: { news?: { n: number; text: string } }) {
  const [sound] = useTvSound();
  const soundRef = useRef(sound);
  soundRef.current = sound;
  const [shown] = useTvMoment(news, news?.n ?? null, () => 12000, {
    clearOnNull: true,
    onShow: () => soundRef.current && chime("reveal"),
  });
  if (!shown) return null;
  return (
    <div className="disc-moment recap-card world-news-card" role="status" key={shown.n}>
      <div className="disc-card">
        <div className="disc-text">
          <div className="disc-kicker">News from around the world</div>
          <div className="disc-fact">{shown.text}</div>
        </div>
      </div>
    </div>
  );
}

/** The world's date and what's on, in the corner of the notice board. */
export function WorldCorner({ world }: { world: NonNullable<TvView["world"]> }) {
  if (!world.date) return null;
  const [y, m, d] = world.date.split("-").map(Number);
  const day = new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(undefined, { month: "long", day: "numeric", timeZone: "UTC" });
  const what = world.now.length ? world.now.map((e) => e.name).join(", ") : world.next ? (world.next.inDays === 1 ? `${world.next.name} tomorrow` : `${world.next.name} in ${world.next.inDays} days`) : "";
  return (
    <div className="tv-world" role="note">
      <span className="tv-world-day">{day}</span>
      {what ? <span className="tv-world-what">{what}</span> : null}
    </div>
  );
}
