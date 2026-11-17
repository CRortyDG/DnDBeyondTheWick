"use client";

// A more human voice for the crowd, laughs, cheers, groans and moans.
//
// The old voice was one sawtooth through two fixed filters, which buzzes like
// a kazoo. A voice is really a soft buzz (the vocal folds) plus breath, through
// three resonances (the throat and mouth) that glide from vowel to vowel, with
// a pitch that never sits still. That's what this builds.

import { panTo, rnd, type Kit } from "./engine";

export type Vowel = "a" | "e" | "i" | "o" | "u" | "ae" | "uh" | "er";

/** Formant frequencies (F1, F2, F3) of an adult voice, roughly. */
export const VOWELS: Record<Vowel, [number, number, number]> = {
  a: [750, 1150, 2500],
  e: [450, 1900, 2550],
  i: [300, 2250, 3000],
  o: [480, 850, 2450],
  u: [340, 750, 2350],
  ae: [650, 1650, 2450],
  uh: [580, 1150, 2400],
  er: [480, 1350, 1700],
};
const VOWEL_LIST = Object.keys(VOWELS) as Vowel[];
export const anyVowel = (): Vowel => VOWEL_LIST[Math.floor(Math.random() * VOWEL_LIST.length)];

const FORMANT_Q = [7, 11, 14];
const FORMANT_GAIN = [1, 0.55, 0.28];

/**
 * A slow random wobble (about ±depth) to connect to an AudioParam: lowpassed
 * noise, so it drifts instead of the even wobble of a sine LFO.
 */
export function wander(k: Kit, target: AudioParam, rate: number, depth: number, at: number, until?: number) {
  const { ctx } = k;
  const src = ctx.createBufferSource();
  src.buffer = k.noise("brown");
  src.loop = true;
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = rate;
  lp.Q.value = 0.5;
  const g = ctx.createGain();
  // Brown noise lowpassed to a few Hz comes out around ±0.05.
  g.gain.value = depth * 20;
  src.connect(lp).connect(g).connect(target);
  src.start(at, Math.random() * 3);
  if (until !== undefined) src.stop(until);
  return { stop: (when?: number) => src.stop(when) };
}

/** Roughness: the level flutters unevenly at a few tens of Hz (growls, creaky groans, rasp). */
export function rasp(k: Kit, target: AudioParam, rate: number, depth: number, at: number, until?: number) {
  const { ctx } = k;
  const src = ctx.createBufferSource();
  src.buffer = k.noise("white");
  src.loop = true;
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = rate;
  bp.Q.value = 1.2;
  const g = ctx.createGain();
  // White noise through a narrow low band is tiny, and smaller the lower the
  // band; this brings it to about ±depth (measured).
  g.gain.value = (depth * 94) / Math.sqrt(rate / 25);
  src.connect(bp).connect(g).connect(target);
  src.start(at, Math.random() * 3);
  if (until !== undefined) src.stop(until);
  return { stop: (when?: number) => src.stop(when) };
}

export interface Voice {
  osc: OscillatorNode;
  /** The voiced part's level (the buzz). */
  buzz: GainNode;
  /** Breath through the same mouth (whispered, "h"). */
  breath: GainNode;
  /** Hiss for s/sh/t/k, outside the mouth filters. */
  hiss: GainNode;
  formants: BiquadFilterNode[];
  /** The voice's overall level. */
  out: GainNode;
  stop: (at?: number) => void;
}

/** Build one voice, silent until you raise out/buzz/breath. */
export function makeVoice(k: Kit, dest: AudioNode, at: number, o: { pitch: number; jitter?: number; pan?: number; wet?: number; until?: number }): Voice {
  const { ctx } = k;
  const out = ctx.createGain();
  out.gain.value = 0;
  out.connect(o.pan !== undefined ? panTo(ctx, dest, o.pan) : dest);
  if (o.wet) {
    const w = ctx.createGain();
    w.gain.value = o.wet;
    out.connect(w).connect(k.wet);
  }
  // The buzz: a sawtooth softened to fall off like a real voice does.
  const osc = ctx.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(o.pitch, at);
  const soft = ctx.createBiquadFilter();
  soft.type = "lowpass";
  soft.frequency.value = Math.min(3200, o.pitch * 9);
  soft.Q.value = 0.4;
  const buzz = ctx.createGain();
  buzz.gain.value = 1;
  osc.connect(soft).connect(buzz);
  // The breath.
  const air = ctx.createBufferSource();
  air.buffer = k.noise("pink");
  air.loop = true;
  const breath = ctx.createGain();
  breath.gain.value = 0.25;
  air.connect(breath);
  // Throat and mouth.
  const mix = ctx.createGain();
  buzz.connect(mix);
  breath.connect(mix);
  const formants = VOWELS.uh.map((f, i) => {
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.setValueAtTime(f, at);
    bp.Q.value = FORMANT_Q[i];
    const lg = ctx.createGain();
    // A bandpass at high Q is quiet; lift it back up.
    lg.gain.value = FORMANT_GAIN[i] * FORMANT_Q[i] * 0.35;
    mix.connect(bp).connect(lg).connect(out);
    return bp;
  });
  // Consonant hiss, straight out.
  const hissSrc = ctx.createBufferSource();
  hissSrc.buffer = k.noise("white");
  hissSrc.loop = true;
  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 3800;
  const hiss = ctx.createGain();
  hiss.gain.value = 0;
  hissSrc.connect(hp).connect(hiss).connect(out);
  // A pitch that never sits still.
  const jit = wander(k, osc.frequency, 9, o.pitch * (o.jitter ?? 0.025), at, o.until);
  osc.start(at);
  air.start(at, Math.random() * 3);
  hissSrc.start(at, Math.random() * 3);
  const stop = (when = ctx.currentTime) => {
    for (const s of [osc, air, hissSrc]) {
      try {
        s.stop(when);
      } catch {
        /* already stopped */
      }
    }
    try {
      jit.stop(when);
    } catch {
      /* already stopped */
    }
  };
  if (o.until !== undefined) stop(o.until);
  return { osc, buzz, breath, hiss, formants, out, stop };
}

/** Glide the mouth to a vowel. */
export function shape(v: Voice, vowel: Vowel, t: number, glide = 0.035, scale = 1) {
  VOWELS[vowel].forEach((f, i) => v.formants[i].frequency.setTargetAtTime(f * scale, t, glide));
}

export interface Syllable {
  vowel: Vowel;
  len: number;
  /** Pitch at the start and end, as multiples of the voice's pitch. */
  from?: number;
  to?: number;
  /** 0..1 */
  amp?: number;
  /** An onset: "h" (breathy), "s" (hiss), "t" (a click of hiss), or none. */
  onset?: "h" | "s" | "t";
  /** Breathiness through the vowel, 0..1. */
  breathy?: number;
}

/**
 * Say a few syllables on a fresh voice that cleans itself up afterwards.
 * Returns when it ends (audio time).
 */
export function utter(
  k: Kit,
  dest: AudioNode,
  t: number,
  o: { pitch: number; vol: number; syllables: Syllable[]; gap?: number; pan?: number; wet?: number; jitter?: number; rough?: { rate: number; depth: number }; formantScale?: number },
): number {
  const total = o.syllables.reduce((s, x) => s + x.len + (o.gap ?? 0.02), 0) + 0.3;
  const v = makeVoice(k, dest, t, { pitch: o.pitch, jitter: o.jitter, pan: o.pan, wet: o.wet, until: t + total + 0.2 });
  const fs = o.formantScale ?? 1;
  if (o.rough) rasp(k, v.buzz.gain, o.rough.rate, o.rough.depth, t, t + total + 0.2);
  v.out.gain.setValueAtTime(0, t);
  let at = t;
  for (const s of o.syllables) {
    const amp = o.vol * (s.amp ?? 1);
    const breathy = s.breathy ?? 0.15;
    if (s.onset === "h") {
      v.breath.gain.setTargetAtTime(1.6, at, 0.01);
      v.buzz.gain.setTargetAtTime(0.05, at, 0.01);
    } else if (s.onset === "s" || s.onset === "t") {
      const hl = s.onset === "s" ? 0.07 : 0.018;
      v.hiss.gain.setTargetAtTime(amp > 0 ? 0.5 : 0, at, 0.005);
      v.hiss.gain.setTargetAtTime(0, at + hl, 0.01);
    }
    const voicedAt = at + (s.onset === "h" ? 0.06 : s.onset === "s" ? 0.06 : s.onset === "t" ? 0.02 : 0);
    v.buzz.gain.setTargetAtTime(1 - breathy * 0.8, voicedAt, 0.015);
    v.breath.gain.setTargetAtTime(breathy * 1.4, voicedAt, 0.02);
    shape(v, s.vowel, at, 0.03, fs);
    v.osc.frequency.setTargetAtTime(o.pitch * (s.from ?? 1), at, 0.02);
    v.osc.frequency.setTargetAtTime(o.pitch * (s.to ?? s.from ?? 1), at + s.len * 0.3, s.len * 0.4);
    v.out.gain.setTargetAtTime(amp, at, 0.02);
    v.out.gain.setTargetAtTime(amp * 0.08, at + s.len * 0.75, 0.035);
    at += s.len + (o.gap ?? 0.02);
  }
  v.out.gain.setTargetAtTime(0, at, 0.06);
  return at;
}

/** A random bit of speech: syllables with a pitch that falls through the phrase. */
export function phrase(n: number, o: { len?: [number, number] } = {}): Syllable[] {
  const [lo, hi] = o.len ?? [0.08, 0.2];
  const out: Syllable[] = [];
  const stress = Math.floor(Math.random() * n);
  for (let i = 0; i < n; i++) {
    const fall = 1.08 - (0.22 * i) / Math.max(1, n - 1);
    const up = i === stress ? rnd(1.08, 1.2) : 1;
    const r = Math.random();
    out.push({
      vowel: anyVowel(),
      len: rnd(lo, hi) * (i === stress ? 1.3 : 1),
      from: fall * up,
      to: fall * up * rnd(0.94, 1.02),
      amp: i === stress ? 1 : rnd(0.55, 0.85),
      onset: r < 0.18 ? "s" : r < 0.38 ? "t" : r < 0.5 ? "h" : undefined,
      breathy: rnd(0.08, 0.25),
    });
  }
  return out;
}

/** One person laughing: "ha-ha-ha", breathy, the pitch falling. */
export function laugh(k: Kit, dest: AudioNode, t: number, o: { pitch: number; vol: number; pan?: number; wet?: number; kind?: "chuckle" | "laugh" | "cackle" }) {
  const kind = o.kind ?? "laugh";
  const n = kind === "chuckle" ? Math.floor(rnd(2, 4)) : kind === "cackle" ? Math.floor(rnd(5, 9)) : Math.floor(rnd(3, 6));
  const beat = kind === "cackle" ? rnd(0.1, 0.13) : kind === "chuckle" ? rnd(0.15, 0.19) : rnd(0.13, 0.17);
  const vowel: Vowel = kind === "chuckle" ? (Math.random() < 0.5 ? "uh" : "o") : Math.random() < 0.7 ? "a" : "ae";
  const syl: Syllable[] = [];
  for (let i = 0; i < n; i++) {
    const f = 1.12 - (0.3 * i) / n;
    syl.push({ vowel, len: beat * 0.62, from: f, to: f * 0.93, amp: 1 - (0.5 * i) / n, onset: "h", breathy: kind === "chuckle" ? 0.45 : 0.3 });
  }
  utter(k, dest, t, { pitch: o.pitch, vol: o.vol, syllables: syl, gap: beat * 0.38, pan: o.pan, wet: o.wet, jitter: 0.04 });
}

/**
 * A buffer of short clicks at the given times (seconds) and levels: the raw
 * material for creaks, knocks and claps, which then ring through resonances.
 */
export function clickBuffer(ctx: BaseAudioContext, len: number, clicks: [number, number][], width = 0.0015): AudioBuffer {
  const sr = ctx.sampleRate;
  const buf = ctx.createBuffer(1, Math.ceil((len + 0.05) * sr), sr);
  const d = buf.getChannelData(0);
  const w = Math.max(2, Math.round(width * sr));
  for (const [at, amp] of clicks) {
    const i0 = Math.round(at * sr);
    for (let j = 0; j < w && i0 + j < d.length; j++) d[i0 + j] += amp * (Math.random() * 2 - 1) * Math.exp((-4 * j) / w);
  }
  return buf;
}

/** Play a buffer through a bank of resonances [freq, q, gain]. */
export function resonate(k: Kit, buf: AudioBuffer, t: number, modes: [number, number, number][], o: { vol: number; pan?: number; wet?: number; dry?: number; lowpass?: number }) {
  const { ctx } = k;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const out = ctx.createGain();
  out.gain.value = o.vol;
  let dest: AudioNode = o.pan !== undefined ? panTo(ctx, k.out, o.pan) : k.out;
  if (o.lowpass) {
    // Bandpass skirts let a click's hiss through; a lowpass keeps it woody.
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = o.lowpass;
    lp.connect(dest);
    dest = lp;
  }
  out.connect(dest);
  if (o.wet) {
    const w = ctx.createGain();
    w.gain.value = o.wet;
    out.connect(w).connect(k.wet);
  }
  for (const [f, q, g] of modes) {
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = f;
    bp.Q.value = q;
    const lg = ctx.createGain();
    lg.gain.value = g;
    src.connect(bp).connect(lg).connect(out);
  }
  if (o.dry) {
    const dg = ctx.createGain();
    dg.gain.value = o.dry;
    src.connect(dg).connect(out);
  }
  src.start(t);
  src.stop(t + buf.duration + 0.05);
  setTimeout(() => out.disconnect(), (t - ctx.currentTime + buf.duration + 4) * 1000);
}
