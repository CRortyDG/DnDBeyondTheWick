"use client";

// The soundboard's one-shots, each made from scratch with Web Audio.
// Every one is original synthesis: no samples, no recordings, nothing to license.

import { bell, envGain, midi, noise, pick, pluck, rnd, tone, type Kit, type SfxMaker } from "./engine";

export interface SfxOpts {
  vol?: number;
  /** Seconds from now. */
  delay?: number;
  /** Dice: how long the tumble lasts, and how many dice. */
  dur?: number;
  count?: number;
  /** Quieter and further away (thunder in a storm). */
  distant?: boolean;
}

const METAL: [number, number, number][] = [
  [1, 1, 0.9],
  [2.76, 0.5, 0.5],
  [5.4, 0.3, 0.3],
  [8.93, 0.18, 0.18],
];
const BELL: [number, number, number][] = [
  [0.5, 0.5, 4.5],
  [1, 1, 3.4],
  [1.19, 0.45, 2.6],
  [1.5, 0.35, 2.2],
  [2, 0.3, 1.8],
  [2.52, 0.22, 1.3],
  [3.01, 0.12, 0.9],
];

/** A brass voice (horns, fanfares): sawtooth through an opening filter. */
function brass(k: Kit, freq: number, t: number, len: number, vol = 0.12, o: { wet?: number; bend?: number } = {}) {
  const { ctx } = k;
  for (const det of [-6, 5]) {
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.detune.value = det;
    osc.frequency.setValueAtTime(freq * (o.bend ?? 0.97), t);
    osc.frequency.exponentialRampToValueAtTime(freq, t + 0.06);
    const f = ctx.createBiquadFilter();
    f.type = "lowpass";
    f.Q.value = 1.5;
    f.frequency.setValueAtTime(freq * 1.2, t);
    f.frequency.exponentialRampToValueAtTime(freq * 6, t + 0.08);
    f.frequency.exponentialRampToValueAtTime(freq * 3, t + Math.max(0.2, len));
    const g = envGain(ctx, k.out, t, vol, 0.04, 0.35, Math.max(0, len - 0.1));
    if (o.wet) {
      const w = ctx.createGain();
      w.gain.value = o.wet;
      g.connect(w).connect(k.wet);
    }
    osc.connect(f).connect(g);
    osc.start(t);
    osc.stop(t + len + 0.6);
  }
}

/** A deep drum: a falling sine and a thump of noise. */
function drum(k: Kit, t: number, vol = 0.6, f0 = 110, f1 = 45, len = 0.5) {
  tone(k, f0, t, { vol, attack: 0.003, decay: len, to: f1, glide: len * 0.6, wet: 0.15 });
  noise(k, t, { kind: "brown", vol: vol * 0.6, decay: 0.12, filter: "lowpass", freq: 900 });
}

/** A short voiced sound ("hey!", "ha", "oh") from a buzzing source through two vowel filters. */
function voice(k: Kit, t: number, pitch: number, len: number, vol: number, vowel: [number, number], o: { to?: number; pan?: number; wet?: number } = {}) {
  const { ctx } = k;
  const osc = ctx.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(pitch, t);
  if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + len);
  const g = envGain(ctx, k.out, t, vol, 0.04, len * 0.7, len * 0.2);
  if (o.wet) {
    const w = ctx.createGain();
    w.gain.value = o.wet;
    g.connect(w).connect(k.wet);
  }
  for (const [f, q, lv] of [
    [vowel[0], 6, 1],
    [vowel[1], 9, 0.6],
  ] as const) {
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = f;
    bp.Q.value = q;
    const lg = ctx.createGain();
    lg.gain.value = lv;
    osc.connect(bp).connect(lg).connect(g);
  }
  osc.start(t);
  osc.stop(t + len + 0.1);
}

function swoosh(k: Kit, t: number, vol = 0.35, len = 0.22, from = 500, to = 2600) {
  noise(k, t, { vol, attack: len * 0.6, decay: len * 0.5, filter: "bandpass", freq: from, to, over: len, q: 1.6, pan: rnd(-0.5, 0), panTo: rnd(0, 0.6) });
}

function thud(k: Kit, t: number, vol = 0.5) {
  tone(k, 140, t, { vol, attack: 0.002, decay: 0.16, to: 50 });
  noise(k, t, { kind: "brown", vol: vol * 0.8, decay: 0.08, filter: "lowpass", freq: 1200 });
}

function clack(k: Kit, t: number, vol: number) {
  noise(k, t, { vol, decay: 0.012 + Math.random() * 0.01, filter: "bandpass", freq: rnd(2200, 4500), q: 2.5, pan: rnd(-0.4, 0.4) });
  tone(k, rnd(1600, 3200), t, { vol: vol * 0.35, attack: 0.001, decay: 0.035 });
}

function rumble(k: Kit, t: number, len: number, vol: number) {
  const n = noise(k, t, { kind: "brown", vol, attack: 0.25, decay: len, filter: "lowpass", freq: 260, to: 90, over: len, wet: 0.4 });
  // Rolls of thunder: the level wanders.
  for (let x = 0.3; x < len; x += rnd(0.2, 0.6)) n.gain.gain.setTargetAtTime(vol * rnd(0.3, 1) * (1 - x / len) + 0.0001, t + x, 0.12);
}

function sparkle(k: Kit, t: number, n: number, len: number, lo = 2000, hi = 6000, vol = 0.07) {
  for (let i = 0; i < n; i++) tone(k, rnd(lo, hi), t + Math.random() * len, { vol, attack: 0.003, decay: rnd(0.15, 0.5), pan: rnd(-0.8, 0.8), wet: 0.5 });
}

export const SFX_MAKERS: Record<string, SfxMaker> = {
  // ---- Combat
  "sword-clash": (k, t) => {
    const f = rnd(1300, 1900);
    noise(k, t, { vol: 0.5, decay: 0.05, filter: "highpass", freq: 2500 });
    bell(k, f, t, 0.22, METAL, { wet: 0.25, pan: rnd(-0.3, 0.3) });
    bell(k, f * 1.13, t + 0.012, 0.14, METAL, { wet: 0.25 });
    // The blades scrape apart.
    noise(k, t + 0.05, { vol: 0.12, attack: 0.02, decay: 0.3, filter: "bandpass", freq: 5000, to: 3000, q: 4 });
  },
  "sword-hit": (k, t) => {
    swoosh(k, t, 0.3, 0.16);
    thud(k, t + 0.15, 0.55);
    noise(k, t + 0.15, { vol: 0.25, decay: 0.12, filter: "bandpass", freq: 600, q: 2 });
    bell(k, rnd(2600, 3200), t + 0.15, 0.05, METAL);
  },
  swing: (k, t) => {
    swoosh(k, t, 0.4, 0.24, 400, 2200);
  },
  arrow: (k, t) => {
    pluck(k, 98, t, 0.4, { bright: 0.8, len: 0.25 });
    noise(k, t + 0.04, { vol: 0.3, attack: 0.05, decay: 0.25, filter: "bandpass", freq: 3200, to: 1400, q: 2, pan: -0.7, panTo: 0.7 });
    tone(k, 220, t + 0.36, { vol: 0.45, attack: 0.002, decay: 0.12, to: 80 });
    noise(k, t + 0.36, { vol: 0.3, decay: 0.06, filter: "lowpass", freq: 1500, pan: 0.6 });
  },
  punch: (k, t) => {
    swoosh(k, t, 0.15, 0.1, 300, 1200);
    thud(k, t + 0.08, 0.75);
  },
  shield: (k, t) => {
    tone(k, 210, t, { vol: 0.6, attack: 0.002, decay: 0.18, to: 120 });
    noise(k, t, { vol: 0.5, decay: 0.07, filter: "bandpass", freq: 900, q: 1.2 });
    bell(k, 820, t, 0.12, METAL, { wet: 0.2 });
  },
  roar: (k, t) => {
    const { ctx } = k;
    const len = 1.7;
    const g = envGain(ctx, k.out, t, 0.5, 0.18, 0.7, len - 0.6);
    const w = ctx.createGain();
    w.gain.value = 0.35;
    g.connect(w).connect(k.wet);
    // A growl: low buzzing voices, roughened at 30 Hz, through a mouth that opens and closes.
    const am = ctx.createGain();
    am.gain.value = 0.6;
    const rough = ctx.createOscillator();
    rough.frequency.value = 32;
    const rg = ctx.createGain();
    rg.gain.value = 0.4;
    rough.connect(rg).connect(am.gain);
    const mouth = ctx.createBiquadFilter();
    mouth.type = "bandpass";
    mouth.Q.value = 2;
    mouth.frequency.setValueAtTime(350, t);
    mouth.frequency.linearRampToValueAtTime(900, t + 0.5);
    mouth.frequency.linearRampToValueAtTime(420, t + len);
    am.connect(mouth).connect(g);
    for (const [f, ty] of [
      [78, "sawtooth"],
      [117, "sawtooth"],
      [52, "square"],
    ] as const) {
      const o = ctx.createOscillator();
      o.type = ty;
      o.frequency.setValueAtTime(f, t);
      o.frequency.linearRampToValueAtTime(f * 1.15, t + 0.5);
      o.frequency.linearRampToValueAtTime(f * 0.8, t + len);
      o.connect(am);
      o.start(t);
      o.stop(t + len + 0.8);
    }
    rough.start(t);
    rough.stop(t + len + 0.8);
    noise(k, t, { kind: "pink", vol: 0.25, attack: 0.2, decay: 0.8, hold: len - 0.7, filter: "bandpass", freq: 700, q: 1 });
  },
  growl: (k, t) => {
    const { ctx } = k;
    const len = 1.1;
    const g = envGain(ctx, k.out, t, 0.45, 0.12, 0.4, len - 0.4);
    const am = ctx.createGain();
    am.gain.value = 0.5;
    const rough = ctx.createOscillator();
    rough.frequency.value = 22;
    const rg = ctx.createGain();
    rg.gain.value = 0.5;
    rough.connect(rg).connect(am.gain);
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 500;
    am.connect(lp).connect(g);
    const o = ctx.createOscillator();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(62, t);
    o.frequency.linearRampToValueAtTime(70, t + len);
    o.connect(am);
    o.start(t);
    o.stop(t + len + 0.5);
    rough.start(t);
    rough.stop(t + len + 0.5);
  },
  death: (k, t) => {
    // A last breath, a body falling, and a low toll.
    noise(k, t, { kind: "pink", vol: 0.22, attack: 0.1, decay: 0.9, filter: "bandpass", freq: 900, to: 300, q: 2 });
    voice(k, t, 150, 0.9, 0.12, [500, 900], { to: 85, wet: 0.3 });
    thud(k, t + 0.75, 0.7);
    noise(k, t + 0.8, { kind: "brown", vol: 0.3, decay: 0.25, filter: "lowpass", freq: 600 });
    for (const m of [38, 45, 50]) tone(k, midi(m), t + 0.8, { type: "triangle", vol: 0.12, attack: 0.05, decay: 3, wet: 0.6 });
  },
  explosion: (k, t) => {
    noise(k, t, { vol: 0.9, attack: 0.005, decay: 2.2, filter: "lowpass", freq: 6000, to: 160, over: 1.8, wet: 0.5 });
    noise(k, t, { kind: "brown", vol: 0.9, attack: 0.01, decay: 2.8, filter: "lowpass", freq: 400 });
    tone(k, 70, t, { vol: 0.8, attack: 0.005, decay: 1.6, to: 28 });
    // Debris.
    for (let i = 0; i < 14; i++) clack(k, t + 0.3 + Math.random() * 1.4, rnd(0.04, 0.14));
  },
  // ---- Magic
  fireball: (k, t) => {
    noise(k, t, { kind: "pink", vol: 0.5, attack: 0.55, decay: 0.15, filter: "bandpass", freq: 300, to: 2200, over: 0.6, q: 1.4, pan: -0.4, panTo: 0.3 });
    tone(k, 200, t, { type: "sawtooth", vol: 0.05, attack: 0.5, decay: 0.1, to: 600, filter: { type: "lowpass", freq: 900 } });
    const b = t + 0.62;
    noise(k, b, { vol: 0.8, attack: 0.005, decay: 1.6, filter: "lowpass", freq: 5000, to: 200, over: 1.4, wet: 0.5 });
    noise(k, b, { kind: "brown", vol: 0.8, attack: 0.01, decay: 2, filter: "lowpass", freq: 500 });
    tone(k, 60, b, { vol: 0.7, decay: 1.2, to: 30 });
    // Fire licking at what's left.
    for (let i = 0; i < 20; i++) noise(k, b + 0.3 + Math.random() * 1.5, { vol: rnd(0.05, 0.2), decay: 0.02, filter: "highpass", freq: rnd(2000, 4000) });
  },
  lightning: (k, t) => {
    for (let i = 0; i < 4; i++) noise(k, t + i * rnd(0.025, 0.06), { vol: 0.8 - i * 0.15, decay: 0.07, filter: "highpass", freq: 1500 });
    tone(k, 3000, t, { type: "sawtooth", vol: 0.12, attack: 0.002, decay: 0.25, to: 80, filter: { type: "bandpass", freq: 2000, q: 1 } });
    rumble(k, t + 0.15, 2.6, 0.7);
  },
  heal: (k, t) => {
    [72, 76, 79, 84, 88, 91].forEach((m, i) => tone(k, midi(m), t + i * 0.09, { vol: 0.1, attack: 0.02, decay: 1.6, vibrato: { rate: 6, depth: 4 }, wet: 0.7 }));
    for (const m of [60, 64, 67]) tone(k, midi(m), t, { type: "triangle", vol: 0.05, attack: 0.4, decay: 1.8, hold: 0.4, wet: 0.6 });
    sparkle(k, t + 0.3, 10, 1.2, 3000, 7000, 0.04);
  },
  arcane: (k, t) => {
    tone(k, 500, t, { type: "triangle", vol: 0.1, attack: 0.1, decay: 1, to: 1400, glide: 0.8, vibrato: { rate: 9, depth: 20 }, wet: 0.6 });
    sparkle(k, t, 18, 1, 1800, 6500, 0.06);
  },
  "dark-magic": (k, t) => {
    for (const f of [65.4, 69.3, 98, 103.8]) tone(k, f, t, { type: "sawtooth", vol: 0.06, attack: 0.7, decay: 1.4, hold: 0.3, filter: { type: "lowpass", freq: 300, to: 900, over: 1 }, wet: 0.5 });
    noise(k, t, { kind: "pink", vol: 0.25, attack: 0.9, decay: 0.05, filter: "bandpass", freq: 400, to: 3000, over: 0.95, q: 2 });
    // Whispers.
    for (let i = 0; i < 5; i++) noise(k, t + 0.2 + i * rnd(0.2, 0.35), { kind: "pink", vol: 0.08, attack: 0.06, decay: 0.2, filter: "bandpass", freq: rnd(1800, 3200), q: 5, pan: rnd(-0.9, 0.9), wet: 0.6 });
  },
  teleport: (k, t) => {
    tone(k, 300, t, { type: "sine", vol: 0.15, attack: 0.02, decay: 0.45, to: 2400, glide: 0.4, wet: 0.5 });
    tone(k, 2400, t + 0.42, { type: "sine", vol: 0.1, attack: 0.005, decay: 0.5, to: 200, glide: 0.35, wet: 0.5 });
    noise(k, t + 0.4, { vol: 0.25, decay: 0.15, filter: "bandpass", freq: 2000, q: 1 });
    sparkle(k, t + 0.4, 8, 0.4);
  },
  // ---- At the table
  dice: (k, t, o) => {
    // A rattle in the hand, then the dice hit the table and bounce to a stop.
    const dur = Math.max(0.6, o.dur ?? 1.3);
    const dice = Math.max(1, Math.min(8, o.count ?? 2));
    for (let i = 0; i < 6; i++) clack(k, t + i * rnd(0.04, 0.07), 0.08);
    const land = t + 0.3;
    for (let d = 0; d < dice; d++) {
      let x = land + d * 0.05 + Math.random() * 0.04;
      let gap = rnd(0.09, 0.14);
      let v = 0.42;
      while (x < land + dur - 0.3 && v > 0.03) {
        clack(k, x, v);
        x += gap;
        gap *= rnd(0.72, 0.86);
        v *= 0.8;
      }
      // The last little settle as it lands, timed to the screen.
      clack(k, t + dur + d * 0.05, 0.22);
    }
    noise(k, land, { kind: "brown", vol: 0.12, decay: 0.08, filter: "lowpass", freq: 600 });
  },
  coins: (k, t) => {
    for (let i = 0; i < 12; i++) {
      const at = t + Math.pow(Math.random(), 1.6) * 0.7;
      bell(k, rnd(3500, 6200), at, rnd(0.03, 0.08), [
        [1, 1, 0.25],
        [1.48, 0.5, 0.15],
        [2.3, 0.3, 0.1],
      ]);
    }
  },
  crit: (k, t) => {
    // Hits hard, then rings out: a brass chord over a cymbal.
    drum(k, t, 0.7, 120, 40, 0.6);
    noise(k, t, { vol: 0.25, attack: 0.005, decay: 1.8, filter: "highpass", freq: 5000, wet: 0.4 });
    for (const m of [62, 66, 69, 74]) brass(k, midi(m), t + 0.05, 0.9, 0.06, { wet: 0.4 });
    sparkle(k, t + 0.1, 8, 0.6, 3000, 7000, 0.05);
  },
  fumble: (k, t) => {
    // The sad trombone, more or less.
    [55, 54, 53].forEach((m, i) => brass(k, midi(m), t + i * 0.42, 0.34, 0.08, { bend: 1.03 }));
    const { ctx } = k;
    const last = t + 1.26;
    const o = ctx.createOscillator();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(midi(52), last);
    const vib = ctx.createOscillator();
    vib.frequency.value = 5;
    const vg = ctx.createGain();
    vg.gain.value = 6;
    vib.connect(vg).connect(o.frequency);
    o.frequency.linearRampToValueAtTime(midi(50.5), last + 1.1);
    const f = ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = 900;
    const g = envGain(ctx, k.out, last, 0.11, 0.05, 0.4, 0.8);
    o.connect(f).connect(g);
    o.start(last);
    vib.start(last);
    o.stop(last + 1.4);
    vib.stop(last + 1.4);
  },
  fanfare: (k, t) => {
    const n = [60, 64, 67, 72];
    n.forEach((m, i) => brass(k, midi(m), t + i * 0.13, i === 3 ? 1.1 : 0.11, 0.08, { wet: 0.3 }));
    for (const m of [64, 67]) brass(k, midi(m), t + 0.39, 1.1, 0.05, { wet: 0.3 });
    drum(k, t + 0.39, 0.4, 100, 50, 0.5);
  },
  "level-up": (k, t) => {
    [67, 71, 74, 79, 83, 86, 91].forEach((m, i) => {
      pluck(k, midi(m), t + i * 0.07, 0.25, { bright: 0.8, wet: 0.4 });
      tone(k, midi(m) * 2, t + i * 0.07, { vol: 0.04, decay: 0.8, wet: 0.5 });
    });
    for (const m of [67, 71, 74]) brass(k, midi(m), t + 0.5, 0.8, 0.05, { wet: 0.4 });
    sparkle(k, t + 0.5, 10, 0.8, 3000, 7000, 0.05);
  },
  victory: (k, t) => {
    // An original little fanfare: rising, a turn, and home.
    const line: [number, number, number][] = [
      [67, 0, 0.14],
      [67, 0.16, 0.14],
      [67, 0.32, 0.14],
      [72, 0.5, 0.5],
      [71, 1.05, 0.2],
      [72, 1.3, 0.2],
      [76, 1.55, 1.4],
    ];
    for (const [m, at, len] of line) brass(k, midi(m), t + at, len, 0.08, { wet: 0.3 });
    for (const m of [60, 64, 67]) brass(k, midi(m - 12), t + 1.55, 1.4, 0.05, { wet: 0.3 });
    drum(k, t + 0.5, 0.45, 100, 45, 0.6);
    drum(k, t + 1.55, 0.6, 100, 40, 0.9);
    noise(k, t + 1.55, { vol: 0.15, decay: 2, filter: "highpass", freq: 5000, wet: 0.3 });
  },
  defeat: (k, t) => {
    const line: [number, number][] = [
      [62, 0],
      [60, 0.7],
      [58, 1.4],
      [57, 2.1],
    ];
    for (const [m, at] of line) tone(k, midi(m), t + at, { type: "sawtooth", vol: 0.07, attack: 0.15, decay: 0.8, hold: 0.4, vibrato: { rate: 5, depth: 3 }, filter: { type: "lowpass", freq: 1100 }, wet: 0.5 });
    for (const m of [38, 45, 50, 53]) tone(k, midi(m), t + 2.1, { type: "triangle", vol: 0.08, attack: 0.3, decay: 3, hold: 0.5, wet: 0.6 });
    drum(k, t + 2.1, 0.5, 80, 35, 1.5);
  },
  cheer: (k, t) => {
    // A room of voices going "hey!", then clapping.
    for (let i = 0; i < 16; i++) {
      const at = t + Math.random() * 0.35;
      voice(k, at, rnd(130, 320), rnd(0.5, 1.1), rnd(0.025, 0.05), [rnd(600, 900), rnd(1200, 1900)], { to: rnd(160, 380), pan: rnd(-0.9, 0.9), wet: 0.35 });
    }
    for (let i = 0; i < 70; i++) {
      const at = t + 0.3 + Math.pow(Math.random(), 1.3) * 2.6;
      noise(k, at, { vol: rnd(0.05, 0.14) * (1 - (at - t) / 3.2), decay: 0.03, filter: "bandpass", freq: rnd(900, 2200), q: 1.4, pan: rnd(-0.9, 0.9), wet: 0.2 });
    }
  },
  gasp: (k, t) => {
    for (let i = 0; i < 12; i++) noise(k, t + Math.random() * 0.15, { kind: "pink", vol: rnd(0.04, 0.08), attack: 0.08, decay: 0.35, filter: "bandpass", freq: rnd(1200, 2600), q: 3, pan: rnd(-0.9, 0.9), wet: 0.3 });
    for (let i = 0; i < 8; i++) voice(k, t + 0.1 + Math.random() * 0.2, rnd(180, 300), 0.5, 0.02, [rnd(450, 600), rnd(800, 1000)], { to: rnd(140, 220), pan: rnd(-0.9, 0.9), wet: 0.3 });
  },
  chime: (k, t) => {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => bell(k, f, t + i * 0.12, 0.14, [
      [1, 1, 1.6],
      [2.76, 0.25, 0.8],
    ], { wet: 0.4 }));
  },
  "chime-fact": (k, t) => {
    [783.99, 1046.5].forEach((f, i) => bell(k, f, t + i * 0.12, 0.14, [
      [1, 1, 1.6],
      [2.76, 0.25, 0.8],
    ], { wet: 0.4 }));
  },
  "chime-rumor": (k, t) => {
    [392, 311.13].forEach((f, i) => bell(k, f, t + i * 0.12, 0.16, [
      [1, 1, 1.6],
      [2.76, 0.25, 0.8],
    ], { wet: 0.4 }));
  },
  // ---- The world
  door: (k, t) => {
    const { ctx } = k;
    const o = ctx.createOscillator();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(180, t);
    o.frequency.linearRampToValueAtTime(120, t + 0.4);
    o.frequency.linearRampToValueAtTime(150, t + 0.7);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 700;
    bp.Q.value = 8;
    const g = envGain(ctx, k.out, t, 0.25, 0.1, 0.2, 0.55);
    o.connect(bp).connect(g);
    o.start(t);
    o.stop(t + 1);
    thud(k, t + 0.85, 0.7);
    noise(k, t + 0.85, { kind: "brown", vol: 0.2, decay: 0.4, filter: "lowpass", freq: 300, wet: 0.4 });
  },
  knock: (k, t) => {
    for (const at of [0, 0.22, 0.44]) {
      tone(k, 150, t + at, { vol: 0.55, attack: 0.002, decay: 0.12, to: 90 });
      noise(k, t + at, { vol: 0.3, decay: 0.04, filter: "bandpass", freq: 700, q: 1.5, wet: 0.2 });
    }
  },
  bell: (k, t) => {
    for (let i = 0; i < 3; i++) bell(k, 196, t + i * 1.9, 0.16, BELL, { wet: 0.5 });
  },
  gong: (k, t) => {
    noise(k, t, { vol: 0.2, decay: 0.15, filter: "lowpass", freq: 1500 });
    bell(k, 82, t, 0.22, [
      [1, 1, 6],
      [1.47, 0.6, 5],
      [2.09, 0.5, 4],
      [2.56, 0.35, 3.5],
      [3.1, 0.3, 3],
      [4.2, 0.15, 2.4],
    ], { wet: 0.6 });
  },
  thunder: (k, t, o) => {
    const v = o.distant ? 0.45 : 0.85;
    if (!o.distant) for (let i = 0; i < 3; i++) noise(k, t + i * rnd(0.03, 0.07), { vol: 0.6, decay: 0.1, filter: "highpass", freq: 1000 });
    rumble(k, t + (o.distant ? 0 : 0.08), o.distant ? 4.5 : 3.6, v);
    noise(k, t, { kind: "brown", vol: v * 0.7, attack: 0.05, decay: 1.5, filter: "lowpass", freq: 120 });
  },
  horn: (k, t) => {
    // A war horn: one long low note, then up a fifth.
    brass(k, 110, t, 1.3, 0.16, { wet: 0.5, bend: 0.94 });
    brass(k, 55, t, 1.3, 0.08, { wet: 0.5 });
    brass(k, 164.8, t + 1.45, 1.8, 0.16, { wet: 0.5, bend: 0.95 });
    brass(k, 82.4, t + 1.45, 1.8, 0.08, { wet: 0.5 });
  },
  howl: (k, t) => {
    const howl = (at: number, base: number, pan: number, vol: number) => {
      const { ctx } = k;
      const o = ctx.createOscillator();
      o.type = "triangle";
      o.frequency.setValueAtTime(base, at);
      o.frequency.exponentialRampToValueAtTime(base * 1.7, at + 0.6);
      o.frequency.setValueAtTime(base * 1.7, at + 1.5);
      o.frequency.exponentialRampToValueAtTime(base * 1.15, at + 2.6);
      const vib = ctx.createOscillator();
      vib.frequency.value = 5;
      const vg = ctx.createGain();
      vg.gain.value = 7;
      vib.connect(vg).connect(o.frequency);
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 900;
      bp.Q.value = 0.8;
      const g = envGain(ctx, pan ? k.out : k.out, at, vol, 0.3, 1, 1.4);
      const w = ctx.createGain();
      w.gain.value = 0.8;
      g.connect(w).connect(k.wet);
      o.connect(bp).connect(g);
      o.start(at);
      vib.start(at);
      o.stop(at + 2.9);
      vib.stop(at + 2.9);
    };
    howl(t, 380, -0.3, 0.2);
    howl(t + 1.1, 430, 0.4, 0.1);
  },
  owl: (k, t) => {
    for (const [at, len] of [
      [0, 0.35],
      [0.6, 0.18],
      [0.85, 0.5],
    ] as const)
      tone(k, 400, t + at, { vol: 0.16, attack: 0.06, decay: len, to: 360, filter: { type: "lowpass", freq: 900 }, wet: 0.6 });
  },
  heartbeat: (k, t) => {
    for (let i = 0; i < 4; i++) {
      const at = t + i * 0.85;
      tone(k, 62, at, { vol: 0.75, attack: 0.005, decay: 0.16, to: 40 });
      tone(k, 55, at + 0.2, { vol: 0.5, attack: 0.005, decay: 0.16, to: 38 });
    }
  },
  page: (k, t) => {
    noise(k, t, { vol: 0.16, attack: 0.08, decay: 0.25, filter: "bandpass", freq: 3200, q: 0.7, pan: 0.3, panTo: -0.3 });
    noise(k, t + 0.08, { vol: 0.08, attack: 0.02, decay: 0.12, filter: "highpass", freq: 5000 });
  },
  whoosh: (k, t) => {
    noise(k, t, { kind: "pink", vol: 0.3, attack: 0.35, decay: 0.45, filter: "bandpass", freq: 250, to: 1800, over: 0.6, q: 1, pan: -0.6, panTo: 0.6, wet: 0.3 });
  },

  // ---- Cues the TV plays by itself (not on the soundboard)
  "turn": (k, t) => {
    drum(k, t, 0.35, 160, 80, 0.3);
  },
  "round": (k, t) => {
    drum(k, t, 0.45, 120, 50, 0.4);
    drum(k, t + 0.22, 0.55, 110, 45, 0.6);
  },
  "seat": (k, t) => {
    // A candle catching, and a small warm chord.
    noise(k, t, { vol: 0.25, attack: 0.02, decay: 0.3, filter: "bandpass", freq: 900, to: 300, q: 1 });
    [62, 69, 74].forEach((m, i) => pluck(k, midi(m + pick([0, 0, 12])), t + 0.05 + i * 0.06, 0.22, { wet: 0.5, bright: 0.6 }));
  },
  "lantern": (k, t) => {
    noise(k, t, { vol: 0.2, attack: 0.03, decay: 0.5, filter: "bandpass", freq: 700, to: 250, q: 1 });
    for (const m of [69, 76, 81]) tone(k, midi(m), t + 0.1, { vol: 0.06, attack: 0.3, decay: 2.5, wet: 0.8 });
  },
  "fallen": (k, t) => {
    SFX_MAKERS.heartbeat(k, t, {});
    for (const f of [73.4, 77.8, 110]) tone(k, f, t, { type: "sawtooth", vol: 0.05, attack: 0.6, decay: 2.4, hold: 0.6, filter: { type: "lowpass", freq: 500 }, wet: 0.5 });
  },
  "steps": (k, t) => {
    for (let i = 0; i < 6; i++) {
      const at = t + i * 0.55;
      noise(k, at, { kind: "brown", vol: 0.25, decay: 0.08, filter: "lowpass", freq: 700, pan: -0.3 + i * 0.1 });
      noise(k, at + 0.02, { vol: 0.05, decay: 0.05, filter: "bandpass", freq: 2500, q: 1 });
    }
  },
};
