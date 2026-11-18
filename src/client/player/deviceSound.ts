"use client";

// Small, quiet sounds on a player's own device, for things that are theirs
// alone: healing, taking a hit, spending a hit die, gold coming or going, a
// level up, "it's your turn", a whisper from the DM, the DM answering a request or giving you
// something, and a secret roll. The TV keeps the big shared sounds (fights,
// dice on the TV, music), so a table of devices never doubles them.
//
// Off until the player turns it on, per device (it's remembered here, not on
// the server). The DM can turn it off for the whole table on the Features page.

import { useCallback, useEffect, useRef, useState } from "react";
import type { PlayerView } from "@/shared/projection";
import { SoundEngine } from "../sound/engine";

const KEY = "candlefair-device-sound";
export interface DeviceSoundPref {
  on: boolean;
  /** 0..1 */
  volume: number;
}
const DEFAULT: DeviceSoundPref = { on: false, volume: 0.6 };
const listeners = new Set<(p: DeviceSoundPref) => void>();

export function readDeviceSound(): DeviceSoundPref {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT;
    const p = JSON.parse(raw) as Partial<DeviceSoundPref>;
    return { on: p.on === true, volume: typeof p.volume === "number" ? Math.max(0, Math.min(1, p.volume)) : DEFAULT.volume };
  } catch {
    return DEFAULT;
  }
}

function writeDeviceSound(p: DeviceSoundPref) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* private mode: it just won't be remembered */
  }
  listeners.forEach((l) => l(p));
}

let engine: SoundEngine | null = null;
function deviceEngine(): SoundEngine | null {
  if (typeof window === "undefined") return null;
  engine ??= SoundEngine.create();
  // For local testing: the engine from the console.
  if (import.meta.env?.DEV && engine) (window as unknown as { __deviceEngine?: SoundEngine }).__deviceEngine = engine;
  return engine;
}

/** The setting, and a setter that wakes the sound from the tap that changed it. */
export function useDeviceSound(): [DeviceSoundPref, (p: Partial<DeviceSoundPref>) => void] {
  const [p, setP] = useState<DeviceSoundPref>(DEFAULT);
  useEffect(() => {
    setP(readDeviceSound());
    listeners.add(setP);
    return () => void listeners.delete(setP);
  }, []);
  const set = useCallback((patch: Partial<DeviceSoundPref>) => {
    const next = { ...readDeviceSound(), ...patch };
    writeDeviceSound(next);
    const e = deviceEngine();
    if (!e) return;
    e.setMaster(next.volume, !next.on);
    // A sample, so you know what you set. Woken here, inside the tap: phones insist.
    if (next.on) void e.unlock().then(() => e.play("chime-fact", { vol: 0.8 }));
  }, []);
  return [p, set];
}

/** What a view says about me, boiled down to what makes a sound when it changes. */
export interface Snapshot {
  hp: number;
  temp: number;
  maxHp: number;
  hitDiceSpent: number;
  balanceCp: number;
  levelUp: number;
  myTurn: string | null;
  decided: Record<string, string>;
  awards: number;
  lastRoll: number;
  lastRollSecret: boolean;
  lastRollDice: number;
  /** Whispers from the DM not opened yet. */
  whispers?: number;
}

export function snapshot(v: PlayerView): Snapshot {
  const f = v.fight;
  const mine = new Set([v.myFight?.combatantId, ...v.myCompanions.map((c) => c.combatantId)].filter(Boolean));
  const turn = f && f.status === "running" && f.currentId && mine.has(f.currentId) ? `${f.id}:${f.round}:${f.currentId}` : null;
  const decided: Record<string, string> = {};
  for (const r of v.myRequests) if (r.status === "approved" || r.status === "declined") decided[r.id] = r.status;
  const roll = v.myRolls[0];
  return {
    hp: v.me.hp.cur,
    temp: v.me.hp.temp,
    maxHp: v.me.hp.max,
    hitDiceSpent: v.me.sheet?.hitDiceSpent ?? 0,
    balanceCp: v.me.balanceCp,
    levelUp: v.levelUp?.n ?? 0,
    myTurn: turn,
    decided,
    awards: v.mine.awards.length,
    lastRoll: roll?.n ?? 0,
    lastRollSecret: roll?.to === "secret",
    lastRollDice: roll ? roll.groups.reduce((s, g) => s + g.rolls.length, 0) : 0,
    whispers: (v.whispers ?? []).filter((w) => !w.seen).length,
  };
}

export interface Cue {
  id: string;
  vol: number;
  delay?: number;
  count?: number;
}

/**
 * What to play for the change from a to b: at most a couple of cues, quiet
 * ones, the most important first. Pure, so it's easy to test.
 */
export function cuesFor(a: Snapshot, b: Snapshot): Cue[] {
  const out: Cue[] = [];
  if (b.levelUp > a.levelUp) out.push({ id: "level-up", vol: 0.5 });
  // A whisper from the DM: a soft chime only you hear.
  if ((b.whispers ?? 0) > (a.whispers ?? 0)) out.push({ id: "chime-fact", vol: 0.35 });
  if (b.myTurn && b.myTurn !== a.myTurn) out.push({ id: "your-turn", vol: 0.8 });
  // HP: a max change alone (a level up, a new sheet) is not a heal.
  const lost = a.hp + a.temp - (b.hp + b.temp);
  if (lost > 0) out.push({ id: "hurt", vol: Math.min(1, 0.55 + lost / 40) });
  else if (b.hp > a.hp && !(b.maxHp !== a.maxHp && b.hp === b.maxHp && a.hp === a.maxHp)) out.push({ id: b.hitDiceSpent > a.hitDiceSpent ? "hit-die" : "heal", vol: 0.45 });
  else if (b.hitDiceSpent > a.hitDiceSpent) out.push({ id: "hit-die", vol: 0.45 });
  // The DM answered a request.
  const answers = Object.entries(b.decided).filter(([id]) => !a.decided[id]);
  if (answers.some(([, s]) => s === "approved")) out.push({ id: "approved", vol: 0.6 });
  else if (answers.length) out.push({ id: "declined", vol: 0.5 });
  // Gold, when nothing above already covers it.
  if (b.balanceCp !== a.balanceCp && !answers.length) out.push({ id: "coins", vol: b.balanceCp > a.balanceCp ? 0.4 : 0.3 });
  if (b.awards > a.awards) out.push({ id: "gift", vol: 0.5 });
  // A secret roll: only you and the DM know, so the TV says nothing. Hear your own dice.
  if (b.lastRoll > a.lastRoll && b.lastRollSecret) out.push({ id: "dice", vol: 0.35, count: Math.max(1, Math.min(4, b.lastRollDice)), delay: 0 });
  return out.slice(0, 2).map((c, i) => (i ? { ...c, delay: (c.delay ?? 0) + 0.35 } : c));
}

/** Plays the cues for this player while sound is on here and the table allows it. */
export function usePlayerSounds(view: PlayerView, allowed: boolean) {
  const [pref] = useDeviceSound();
  const prev = useRef<Snapshot | null>(null);
  const on = allowed && pref.on;

  // Keep the engine awake: any tap or key on the page (phones only allow sound after one).
  useEffect(() => {
    if (!on) return;
    const e = deviceEngine();
    if (!e) return;
    e.setMaster(pref.volume, false);
    const wake = () => void e.unlock();
    const back = () => document.visibilityState === "visible" && void e.unlock();
    const evs = ["pointerdown", "touchend", "click", "keydown"] as const;
    for (const ev of evs) window.addEventListener(ev, wake);
    document.addEventListener("visibilitychange", back);
    void e.unlock();
    return () => {
      for (const ev of evs) window.removeEventListener(ev, wake);
      document.removeEventListener("visibilitychange", back);
    };
  }, [on, pref.volume]);

  useEffect(() => {
    const now = snapshot(view);
    const was = prev.current;
    prev.current = now;
    if (!was || !on) return;
    const e = deviceEngine();
    if (!e?.running) return;
    for (const c of cuesFor(was, now)) e.play(c.id, { vol: c.vol, delay: c.delay, count: c.count, dur: c.id === "dice" ? 0.9 : undefined });
  }, [view, on]);
}
