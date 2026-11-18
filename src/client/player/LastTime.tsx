"use client";

// The players' "Last time on…" card: it pops up once when the DM sends it, and a
// small strip keeps it a tap away until the next session gets going.

import { useEffect, useState } from "react";
import type { PlayerView } from "@/shared/projection";
import { LastTimeBody } from "../ui/LastTimeCard";
import { Sheet } from "./Sheet";

const SEEN_KEY = "candlefair-lasttime-seen";

function seenOf(): Record<string, number> {
  try {
    const v = JSON.parse(localStorage.getItem(SEEN_KEY) ?? "{}");
    return v && typeof v === "object" ? v : {};
  } catch {
    return {};
  }
}

function markSeen(gameId: string, n: number) {
  try {
    const all = seenOf();
    all[gameId] = n;
    localStorage.setItem(SEEN_KEY, JSON.stringify(all));
  } catch {}
}

export function LastTime({ view }: { view: PlayerView }) {
  const card = view.lastTime;
  const gameId = view.game.id;
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState<number | null>(null);
  useEffect(() => setSeen(seenOf()[gameId] ?? 0), [gameId]);
  const fresh = !!card && seen !== null && seen !== card.n;
  // A new card opens by itself once, but never over a fight.
  useEffect(() => {
    if (fresh && !view.fight) setOpen(true);
  }, [fresh, view.fight]);
  if (!card) return null;
  const close = () => {
    setOpen(false);
    markSeen(gameId, card.n);
    setSeen(card.n);
  };
  // Between sessions the strip stays. Once the next session is on, only until they've read it.
  const strip = !view.fight && (!view.session || fresh);
  return (
    <>
      {strip ? (
        <button type="button" className="pl-lasttime" onClick={() => setOpen(true)}>
          <span className="pl-lasttime-k">Last time on&hellip;</span>
          <span className="pl-lasttime-v">Chapter {card.chapter}: the story so far</span>
          <span className="pl-lasttime-go" aria-hidden="true">
            Read
          </span>
        </button>
      ) : null}
      {open ? (
        <Sheet label={`Last time on ${view.game.name}`} onClose={close} className="pl-lasttime-sheet">
          <LastTimeBody card={card} gameName={view.game.name} />
          <button type="button" className="btn primary big" onClick={close}>
            Got it
          </button>
        </Sheet>
      ) : null}
    </>
  );
}
