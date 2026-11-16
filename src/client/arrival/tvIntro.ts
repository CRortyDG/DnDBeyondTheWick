// The Arrival intro as the TV plays it: every step in one list, how long each
// one stays up, and where the intro is "now". The TV and the DM's console both
// work it out from the same numbers (the step the DM last picked, and when), so
// the DM's Back / Next always act on what the room is looking at.

import type { ArrivalLook, TvIntroView } from "@/shared/arrival";
import type { IntroClip, IntroSlide } from "@/shared/types";
import { fill, PANELS, type SceneId, type SoundBed } from "./content";

export type TvStep =
  | { kind: "panel"; panel: number; scene: SceneId; shot: number; sound: SoundBed; lines: string[]; cue?: "door" }
  | { kind: "clip"; clip: IntroClip }
  | { kind: "slide"; slide: IntroSlide };

/** A little slower than the phone: the room reads together, from across it. */
export const TV_CHAR_MS = 42;
export const TV_LINE_GAP_MS = 600;
export const TV_FIRST_MS = 900;
/** How long a step stays up after its words are all out. */
const HOLD_MIN_MS = 3200;
const HOLD_PER_CHAR_MS = 28;
const GIF_MS = 9000;

export function tvSteps(look: ArrivalLook): TvStep[] {
  if (!look.intro) return [];
  if (look.kind === "custom") {
    return [...(look.clip ? [{ kind: "clip" as const, clip: look.clip }] : []), ...(look.slides ?? []).map((slide) => ({ kind: "slide" as const, slide: withWide(slide) }))];
  }
  return PANELS.flatMap((p, panel) => p.steps.map((st) => ({ kind: "panel" as const, panel, scene: p.scene, shot: st.shot ?? 0, sound: p.sound, lines: st.lines.map((l) => fill(l, undefined, look.captain)), ...(st.cue ? { cue: st.cue } : {}) })));
}

/** The site's own tall pictures (the premade campaign's) have a wide twin: campaigns made before the TV intro get it too. */
function withWide(sl: IntroSlide): IntroSlide {
  const m = !sl.wide && sl.image ? /^(\/art\/[a-z0-9/-]+)-tall\.jpg$/.exec(sl.image) : null;
  return m ? { ...sl, wide: `${m[1]}.jpg` } : sl;
}

/** Narration without its *asterisks*. */
export const bare = (l: string) => /^\*(.*)\*$/.exec(l)?.[1] ?? l;

export function stepLines(st: TvStep | undefined): string[] {
  if (!st) return [];
  if (st.kind === "panel") return st.lines;
  if (st.kind === "slide") return st.slide.text.split(/\n+/).filter((l) => l.trim()).map((l) => `*${l.trim()}*`);
  return [];
}

/** How long the words take to come out. */
export function typingMs(lines: string[]): number {
  if (!lines.length) return 0;
  const chars = lines.reduce((n, l) => n + bare(l).length, 0);
  return TV_FIRST_MS + chars * TV_CHAR_MS + (lines.length - 1) * TV_LINE_GAP_MS;
}

/** How long a step stays up before the next, or null: it waits for the DM (a video of unknown length). */
export function stepMs(st: TvStep): number | null {
  if (st.kind === "clip") {
    if (st.clip.kind === "gif") return GIF_MS;
    return st.clip.seconds ? Math.round(st.clip.seconds * 1000) + 800 : null;
  }
  const lines = stepLines(st);
  const chars = lines.reduce((n, l) => n + bare(l).length, 0);
  if (!lines.length) return 6000;
  return typingMs(lines) + Math.max(HOLD_MIN_MS, chars * HOLD_PER_CHAR_MS);
}

/** How much of each line is showing, t ms into the step. */
export function shownChars(lines: string[], t: number): number[] {
  let left = t - TV_FIRST_MS;
  return lines.map((l) => {
    const n = bare(l).length;
    const shown = Math.max(0, Math.min(n, Math.floor(left / TV_CHAR_MS)));
    left -= n * TV_CHAR_MS + TV_LINE_GAP_MS;
    return shown;
  });
}

export interface IntroPos {
  /** The step showing now. */
  i: number;
  /** How long it has been up, in ms. */
  t: number;
  /** Past the last step's time: the intro is over and holds there. */
  ended: boolean;
}

/** Where the intro is at `now` (server time): from the DM's last pick, moving on by itself unless paused. */
export function introPos(steps: TvStep[], v: Pick<TvIntroView, "step" | "at" | "paused">, now: number): IntroPos {
  const last = Math.max(0, steps.length - 1);
  let i = Math.min(Math.max(0, v.step), last);
  let t = Math.max(0, now - v.at);
  if (v.paused) return { i, t, ended: false };
  for (;;) {
    const d = steps[i] ? stepMs(steps[i]) : null;
    if (d === null || t < d) return { i, t, ended: false };
    if (i >= last) return { i, t, ended: true };
    t -= d;
    i++;
  }
}
