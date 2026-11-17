// What the TV should be playing right now: the DM's soundboard layers, plus
// the beds that scenes and fights bring with them when "moments bring their own
// sounds" is on. Pure, so it's tested without a browser (tests/sound.test.ts).

import type { TvSound } from "@/shared/projection";
import { AMBIENT_SOUND, isMusic, type LayerMix } from "@/shared/sound";

export interface MixInput {
  sound: TvSound;
  /** The live scene's kind, or "ambient" for a built-in ambient scene. */
  kind: string | undefined;
  ambientId?: string;
  /** The Table's seats: how many are lit, of how many. */
  seats?: { lit: number; total: number };
  /** A fight that's rolling initiative or running (not paused, not over). */
  fighting: boolean;
  /** While the stinger plays: its bed for the moment it's up to. */
  stinger?: LayerMix;
}

export const BATTLE_LEVEL = 0.7;

/** The Table fills up: the crowd and the music grow with every seat claimed. */
export function tableBed(lit: number, total: number): LayerMix {
  const frac = total > 0 ? Math.min(1, lit / total) : 0;
  return { "tavern-jig": round(0.22 + 0.33 * frac), crowd: round(0.08 + 0.82 * frac), fire: 0.3 };
}

/** The bed a scene brings when the soundboard is quiet. */
export function sceneBed(m: Pick<MixInput, "kind" | "ambientId" | "seats" | "stinger">): LayerMix {
  if (m.kind === "ambient" && m.ambientId) return { ...(AMBIENT_SOUND[m.ambientId] ?? {}) };
  if (m.kind === "table" && m.seats) return tableBed(m.seats.lit, m.seats.total);
  if (m.kind === "stinger" && m.stinger) return { ...m.stinger };
  return {};
}

export function tableMix(m: MixInput): Record<string, number> {
  const dm = clean(m.sound.layers);
  if (!m.sound.auto) return dm;
  const dmOn = Object.keys(dm).length > 0;
  if (dmOn) {
    // The DM's mix wins; a fight adds battle music only if the DM isn't playing music already.
    if (m.fighting && !Object.keys(dm).some(isMusic)) return { ...dm, battle: BATTLE_LEVEL };
    return dm;
  }
  const bed = clean(sceneBed(m));
  if (!m.fighting) return bed;
  // A fight over a scene: its ambience stays, quieter, and the battle drums take over the music.
  const out: Record<string, number> = { battle: BATTLE_LEVEL };
  for (const [id, v] of Object.entries(bed)) if (!isMusic(id)) out[id] = round(v * 0.6);
  return out;
}

/** How loud everything is under a scene that makes its own sound (a clip, the Arrival intro). */
export function duckFor(kind: string | undefined): number {
  return kind === "video" ? 0.25 : kind === "intro" ? 0.3 : 1;
}

/** The stinger's score: what plays how many seconds in (see Stinger.tsx for the picture). */
export const STINGER_BEDS: [number, LayerMix][] = [
  [0, { "tavern-jig": 0.3, crowd: 0.45, fire: 0.2 }],
  [6.5, {}],
  [9, { night: 0.5, wind: 0.2 }],
  [11, { night: 0.45, wind: 0.2, wonder: 0.3 }],
  [25, { night: 0.3, wonder: 0.25 }],
];
export const STINGER_CUES: [number, string][] = [
  [6.6, "door"],
  [16.2, "steps"],
  [23.4, "lantern"],
  [25.2, "gong"],
];

export function stingerBed(sec: number): LayerMix {
  let out: LayerMix = {};
  for (const [at, bed] of STINGER_BEDS) if (sec >= at) out = bed;
  return out;
}

function clean(m: LayerMix | Record<string, number>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(m)) if (typeof v === "number" && v > 0) out[k] = v;
  return out;
}

const round = (v: number) => Math.round(v * 100) / 100;
