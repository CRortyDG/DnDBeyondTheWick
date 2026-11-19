"use client";

// Your turn, said loudly enough to notice. iPhones ignore the vibration a phone
// would normally buzz with, and a phone left face up on the table goes dark
// between turns, so:
//   - the screen stays awake while a fight is on (where the browser allows it),
//   - a big "Your turn!" card fills the screen for a moment when the turn comes round,
//   - and if this device's sounds are off, a one-tap offer to turn them on, so the
//     phone chimes on your turn (the tap is what lets a phone play sound at all).

import { useEffect, useRef, useState } from "react";
import { useDeviceSound } from "./deviceSound";

/** A full-screen card for a moment when it becomes my turn (or a companion's I run). Tap to close. */
export function TurnFlash({ turnKey, who }: { turnKey: string | null; who?: string }) {
  const [shown, setShown] = useState<string | null>(null);
  const last = useRef<string | null>(null);
  useEffect(() => {
    if (!turnKey || turnKey === last.current) return;
    last.current = turnKey;
    setShown(turnKey);
    const t = setTimeout(() => setShown((s) => (s === turnKey ? null : s)), 2600);
    return () => clearTimeout(t);
  }, [turnKey]);
  if (!shown || shown !== turnKey) return null;
  return (
    <button type="button" className="pl-turn-flash" onClick={() => setShown(null)} aria-label="Your turn. Tap to close.">
      <span className="pl-turn-flash-k" role="status">
        {who ? `${who}’s turn!` : "Your turn!"}
      </span>
      <span className="pl-turn-flash-v">Everyone’s looking at you</span>
    </button>
  );
}

const NUDGE_KEY = "candlefair-turn-sound-nudge";

/** In a fight with sounds off: offer the chime once (per device), since a buzz alone often isn't felt. */
export function TurnSoundNudge() {
  const [pref, set] = useDeviceSound();
  const [gone, setGone] = useState(true);
  useEffect(() => {
    try {
      setGone(localStorage.getItem(NUDGE_KEY) === "1");
    } catch {
      setGone(false);
    }
  }, []);
  if (pref.on || gone) return null;
  const hide = () => {
    setGone(true);
    try {
      localStorage.setItem(NUDGE_KEY, "1");
    } catch {
      /* it just asks again next time */
    }
  };
  return (
    <div className="pl-turn-nudge" role="note">
      <p>
        <b>Want a chime on your turn?</b> Some phones (iPhones) can&rsquo;t buzz, so a sound is the surest way to notice.
      </p>
      <div className="pl-turn-nudge-acts">
        <button type="button" className="btn small" onClick={hide}>
          No thanks
        </button>
        <button type="button" className="btn primary small" onClick={() => (set({ on: true }), hide())}>
          Turn sound on
        </button>
      </div>
    </div>
  );
}
