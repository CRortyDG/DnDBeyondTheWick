"use client";

// The TV's sound setting: off by default, remembered on this device.
import { useCallback, useEffect, useState } from "react";

const KEY = "candlefair-tv-sound";
const listeners = new Set<(on: boolean) => void>();

function read(): boolean {
  try {
    return localStorage.getItem(KEY) === "on";
  } catch {
    return false;
  }
}

export function useTvSound(): [boolean, (on: boolean) => void] {
  const [on, setOn] = useState(false);
  useEffect(() => {
    setOn(read());
    listeners.add(setOn);
    return () => void listeners.delete(setOn);
  }, []);
  const set = useCallback((v: boolean) => {
    try {
      localStorage.setItem(KEY, v ? "on" : "off");
    } catch {}
    listeners.forEach((l) => l(v));
    if (v) chime("fact");
  }, []);
  return [on, set];
}

let ctx: AudioContext | null = null;

/** A soft bell, made in the browser (no files). */
export function chime(kind: "reveal" | "fact" | "rumor") {
  try {
    ctx ??= new AudioContext();
    const t0 = ctx.currentTime + 0.02;
    const notes = kind === "reveal" ? [523.25, 659.25, 783.99, 1046.5] : kind === "fact" ? [783.99, 1046.5] : [392, 311.13];
    notes.forEach((f, i) => {
      const at = t0 + i * 0.12;
      for (const [mult, vol] of [
        [1, 0.16],
        [2.76, 0.04],
      ] as const) {
        const o = ctx!.createOscillator();
        const g = ctx!.createGain();
        o.type = "sine";
        o.frequency.value = f * mult;
        g.gain.setValueAtTime(0, at);
        g.gain.linearRampToValueAtTime(vol, at + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, at + 1.6);
        o.connect(g).connect(ctx!.destination);
        o.start(at);
        o.stop(at + 1.7);
      }
    });
  } catch {}
}
