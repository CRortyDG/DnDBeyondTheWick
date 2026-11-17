"use client";

// The TV's sound setting, remembered on this device: "on", "off", or not chosen
// yet (null). Sound itself comes from the table's sound engine (src/client/sound/).
import { useCallback, useEffect, useState } from "react";
import { SoundEngine } from "../sound/engine";

const KEY = "candlefair-tv-sound";
export type SoundPref = "on" | "off" | null;
const listeners = new Set<(p: SoundPref) => void>();

export function readSoundPref(): SoundPref {
  try {
    const v = localStorage.getItem(KEY);
    return v === "on" || v === "off" ? v : null;
  } catch {
    return null;
  }
}

export function writeSoundPref(v: "on" | "off") {
  try {
    localStorage.setItem(KEY, v);
  } catch {}
  listeners.forEach((l) => l(v));
}

export function useSoundPref(): SoundPref {
  const [p, setP] = useState<SoundPref>(null);
  useEffect(() => {
    setP(readSoundPref());
    listeners.add(setP);
    return () => void listeners.delete(setP);
  }, []);
  return p;
}

/** On or off (not chosen yet counts as off). Turning it on from a click unlocks sound. */
export function useTvSound(): [boolean, (on: boolean) => void] {
  const p = useSoundPref();
  const set = useCallback((v: boolean) => {
    writeSoundPref(v ? "on" : "off");
    if (v) {
      const e = tableEngine();
      void e?.unlock().then(() => e.play("chime-fact"));
    }
  }, []);
  return [p === "on", set];
}

let engine: SoundEngine | null = null;
/** Moments bring their own sounds (the DM can turn that off on the soundboard). */
let autoCues = true;

/** The one sound engine on this page, made on first use. */
export function tableEngine(): SoundEngine | null {
  if (typeof window === "undefined") return null;
  engine ??= SoundEngine.create();
  // For local testing: the engine from the console.
  if (import.meta.env?.DEV && engine) (window as unknown as { __tableEngine?: SoundEngine }).__tableEngine = engine;
  return engine;
}

export function setAutoCues(on: boolean) {
  autoCues = on;
}

/** A soft bell for reveals, through the table's engine (so the DM's volume applies). */
export function chime(kind: "reveal" | "fact" | "rumor") {
  if (!autoCues || !engine?.running) return;
  engine.play(kind === "reveal" ? "chime" : `chime-${kind}`);
}

// ---- Dice on the TV
// The rattle starts as a roll's dice start tumbling on screen (DiceRoll.tsx calls this), so a
// roll that waits its turn rattles when it shows, not when it arrived. When a few start together
// (everyone rolling initiative) the rattles are staggered and softened rather than stacked, and
// past a handful the table is already loud enough.
const BURST_GAP_MS = 150;
const BURST_RATTLES = 4;
let burst = { at: -Infinity, k: 0, crit: false, fumble: false };

/** dur: seconds until the last die lands. nat: a lone d20's natural 20 or 1, for its sting. */
export function diceSound(o: { dice: number; dur: number; nat: 20 | 1 | null }) {
  if (!autoCues || !engine?.running) return;
  const now = performance.now();
  if (now - burst.at > BURST_GAP_MS) burst = { at: now, k: 0, crit: false, fumble: false };
  else burst.at = now;
  const k = burst.k++;
  if (k < BURST_RATTLES) {
    engine.play("dice", { dur: Math.max(0.6, o.dur - 0.3), count: o.dice, delay: k * 0.09, vol: k ? 0.85 ** k : 1 });
  }
  // One fanfare (and one groan) per burst is plenty.
  if (o.nat === 20 && !burst.crit) {
    burst.crit = true;
    engine.play("crit", { delay: o.dur });
  } else if (o.nat === 1 && !burst.fumble) {
    burst.fumble = true;
    engine.play("fumble", { delay: o.dur });
  }
}
