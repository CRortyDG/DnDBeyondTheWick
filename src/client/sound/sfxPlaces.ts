"use client";

// One-shots for the places a story goes: the docks and the ship, the smithy,
// the kitchen and the feast hall, the shop door, the snow and the deep woods.
// Original synthesis like the rest (sfx.ts): no samples, nothing to license.
// Each maker sets its own level, so the engine's trims don't need to know them.

import { bell, envGain, noise, rnd, tone, type Kit, type SfxMaker } from "./engine";
import { clickBuffer, laugh, rasp, resonate, utter } from "./voice";

// ---------------------------------------------------------------------------
// Shared pieces (the place layers use these too)

type Modes = [number, number, number][];

/** A ship's hull or a big beam under strain. */
export const hullModes = (): Modes => [
  [rnd(130, 180), 9, 8],
  [rnd(300, 400), 13, 6],
  [rnd(650, 850), 15, 3],
  [rnd(1300, 1600), 14, 1.2],
];
/** A rope tightening round a spar, or a branch in the wind. */
export const ropeModes = (): Modes => [
  [rnd(480, 650), 15, 6],
  [rnd(1050, 1400), 17, 4],
  [rnd(2100, 2700), 16, 1.6],
];

/**
 * Wood under strain: stick-slip ticks that bunch into a groan and spread out
 * again, ringing in the timber. rate is ticks a second at the ends and middle.
 */
export function creak(k: Kit, t: number, o: { len: number; rate: [number, number]; modes: Modes; vol: number; pan?: number; wet?: number }) {
  const clicks: [number, number][] = [];
  let x = 0.01;
  const wob = rnd(7, 15);
  while (x < o.len) {
    const p = x / o.len;
    const env = Math.sin(Math.PI * p);
    const rate = o.rate[0] + (o.rate[1] - o.rate[0]) * env * (0.78 + 0.22 * Math.sin(p * wob));
    clicks.push([x, rnd(0.5, 1) * (0.3 + 0.7 * env)]);
    x += (1 / rate) * rnd(0.8, 1.25);
  }
  resonate(k, clickBuffer(k.ctx, o.len, clicks, 0.0012), t, o.modes, { vol: o.vol, pan: o.pan, wet: o.wet ?? 0.3, lowpass: 3500 });
}

/** Something wooden and heavy lands: a crate, a barrel, a boot on boards. */
export function woodHit(k: Kit, t: number, vol: number, pan = 0, size = 1) {
  tone(k, 115 / size, t, { vol: vol * 0.6, attack: 0.002, decay: 0.16 * size, to: 55 / size, pan });
  resonate(k, clickBuffer(k.ctx, 0.04, [[0, 1], [0.004, 0.6]], 0.004), t, [
    [rnd(160, 220) / size, 6, 2],
    [rnd(420, 520) / size, 8, 1.2],
    [rnd(900, 1100) / size, 7, 0.5],
  ], { vol, pan, wet: 0.3, lowpass: 3000 });
}

/** A handful of little bells shaken once (sleigh bells, a harness, a tambourine). */
export function jingle(k: Kit, t: number, vol: number, o: { pan?: number; wet?: number; n?: number } = {}) {
  const n = o.n ?? 10;
  for (let i = 0; i < n; i++) {
    const f = rnd(3800, 8500);
    tone(k, f, t + Math.random() * 0.07, { vol: vol * rnd(0.4, 1), attack: 0.001, decay: rnd(0.06, 0.22), pan: o.pan, wet: o.wet ?? 0.25 });
  }
  noise(k, t, { vol: vol * 1.2, decay: 0.05, filter: "highpass", freq: 6500, pan: o.pan });
}

/** Something drops into water: the hit, the plunge, bubbles, and drops falling back. */
export function splash(k: Kit, t: number, vol: number, o: { pan?: number; big?: boolean } = {}) {
  const pan = o.pan ?? 0;
  const big = o.big ? 1.6 : 1;
  noise(k, t, { vol: vol * 0.8, attack: 0.003, decay: 0.22 * big, filter: "bandpass", freq: 1300, q: 0.6, pan, wet: 0.25 });
  tone(k, 130 / big, t, { vol: vol * 0.5, attack: 0.003, decay: 0.18 * big, to: 55, pan });
  noise(k, t + 0.02, { kind: "pink", vol: vol * 0.6, attack: 0.04, decay: 0.7 * big, filter: "lowpass", freq: 3200, to: 700, pan, wet: 0.3 });
  for (let i = 0; i < 16 * big; i++) {
    const f = rnd(350, 1500);
    tone(k, f, t + 0.05 + Math.pow(Math.random(), 1.6) * 0.7 * big, { vol: vol * rnd(0.03, 0.09), attack: 0.002, decay: rnd(0.03, 0.07), to: f * rnd(1.3, 1.9), glide: 0.05, pan: pan + rnd(-0.3, 0.3) });
  }
  for (let i = 0; i < 9 * big; i++) {
    const f = rnd(1400, 3200);
    tone(k, f, t + rnd(0.3, 1.1) * big, { vol: vol * rnd(0.02, 0.05), attack: 0.001, decay: 0.03, to: f * 1.3, glide: 0.02, pan: pan + rnd(-0.5, 0.5), wet: 0.2 });
  }
}

/** A bell rung a few times quickly, ringing on (a ship's bell, a buoy). */
function shipBell(k: Kit, t: number, f: number, vol: number, o: { pan?: number; wet?: number } = {}) {
  noise(k, t, { vol: vol * 0.6, decay: 0.01, filter: "bandpass", freq: f * 3, q: 2, pan: o.pan });
  bell(k, f, t, vol, [
    [1, 1, 1.8],
    [2.02, 0.4, 1.1],
    [2.93, 0.28, 0.75],
    [4.12, 0.14, 0.45],
    [5.4, 0.08, 0.3],
  ], { pan: o.pan, wet: o.wet ?? 0.45 });
}

/** A struck anvil: the hammer's dull knock and the steel ringing. */
export function anvil(k: Kit, t: number, vol: number, o: { pan?: number; ring?: number; f?: number } = {}) {
  const f = o.f ?? rnd(1150, 1250);
  const ring = o.ring ?? 1;
  noise(k, t, { vol: vol * 1.4, decay: 0.012, filter: "highpass", freq: 3500, pan: o.pan });
  noise(k, t, { kind: "brown", vol: vol * 1.2, decay: 0.05, filter: "lowpass", freq: 1800, pan: o.pan });
  bell(k, f, t, vol, [
    [1, 1, 1.3 * ring],
    [2.71, 0.5, 0.85 * ring],
    [4.93, 0.32, 0.5 * ring],
    [7.62, 0.15, 0.3 * ring],
  ], { pan: o.pan, wet: 0.3 });
}

/** A metal pot or pan clanging. */
function clang(k: Kit, t: number, f: number, vol: number, pan = 0, ring = 1) {
  noise(k, t, { vol: vol * 0.8, decay: 0.015, filter: "bandpass", freq: f * 4, q: 1.5, pan });
  bell(k, f, t, vol, [
    [1, 1, 0.45 * ring],
    [2.32, 0.6, 0.35 * ring],
    [3.87, 0.42, 0.25 * ring],
    [5.71, 0.25, 0.15 * ring],
  ], { pan, wet: 0.3 });
}

/** Porcelain or glass: a quick bright tink. */
export function tink(k: Kit, t: number, vol: number, pan = 0, f = rnd(2300, 3600)) {
  bell(k, f, t, vol, [
    [1, 1, 0.22],
    [2.43, 0.4, 0.11],
  ], { pan, wet: 0.35 });
}

/** A raven or crow: a harsh, falling "kraa". */
export function caw(k: Kit, dest: AudioNode, t: number, o: { vol: number; pan?: number; wet?: number; pitch?: number }) {
  utter(k, dest, t, {
    pitch: o.pitch ?? rnd(380, 460),
    vol: o.vol,
    pan: o.pan,
    wet: o.wet ?? 0.4,
    jitter: 0.03,
    formantScale: 1.45,
    rough: { rate: rnd(70, 95), depth: 0.55 },
    syllables: [{ vowel: "a", len: rnd(0.22, 0.3), from: 1.06, to: 0.84, breathy: 0.25 }],
  });
}

// ---------------------------------------------------------------------------
// The one-shots

const MAKERS: Record<string, SfxMaker> = {
  // ---- Ship & shore
  "ship-bell": (k, t) => {
    // Two bells, twice: ding-ding ... ding-ding.
    const f = rnd(820, 880);
    [0, 0.36, 1.25, 1.61].forEach((at) => shipBell(k, t + at, f, 0.11));
  },
  foghorn: (k, t) => {
    // A lighthouse horn: two long, low blasts with a grunt at the end of each.
    const { ctx } = k;
    for (const [at, len] of [
      [0, 2.4],
      [3.4, 2.4],
    ] as const) {
      const s = t + at;
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.Q.value = 2;
      lp.frequency.setValueAtTime(150, s);
      lp.frequency.exponentialRampToValueAtTime(700, s + 0.35);
      lp.frequency.setValueAtTime(700, s + len - 0.3);
      lp.frequency.exponentialRampToValueAtTime(200, s + len + 0.3);
      const g = envGain(ctx, k.out, s, 0.2, 0.3, 0.6, len - 0.3);
      const w = ctx.createGain();
      w.gain.value = 0.9;
      g.connect(w).connect(k.wet);
      lp.connect(g);
      for (const [mul, type, lv] of [
        [1, "sawtooth", 1],
        [0.5, "square", 0.5],
        [1.005, "sawtooth", 0.6],
      ] as const) {
        const o = ctx.createOscillator();
        o.type = type;
        const f = 98 * mul;
        o.frequency.setValueAtTime(f, s);
        o.frequency.setValueAtTime(f, s + len - 0.25);
        o.frequency.exponentialRampToValueAtTime(f * 0.78, s + len + 0.3);
        const og = ctx.createGain();
        og.gain.value = lv;
        o.connect(og).connect(lp);
        o.start(s);
        o.stop(s + len + 1);
      }
    }
  },
  splash: (k, t) => splash(k, t, 0.5),
  anchor: (k, t) => {
    // The chain runs out through the hawse, faster and faster, then the anchor hits the water.
    const run = 2;
    let x = 0;
    let gap = 0.11;
    while (x < run) {
      const at = t + x;
      for (let j = 0; j < 2; j++) tink(k, at + j * 0.008, rnd(0.03, 0.07), rnd(-0.2, 0.2), rnd(1400, 3200));
      noise(k, at, { vol: 0.12, decay: 0.02, filter: "bandpass", freq: rnd(2000, 4000), q: 2 });
      x += gap * rnd(0.8, 1.2);
      gap = Math.max(0.028, gap * 0.95);
    }
    noise(k, t, { kind: "brown", vol: 0.25, attack: 0.3, decay: 0.6, hold: run - 0.6, filter: "lowpass", freq: 220 });
    splash(k, t + run + 0.1, 0.6, { big: true, pan: 0.2 });
  },
  creak: (k, t) => creak(k, t, { len: rnd(1.6, 2.1), rate: [12, 110], modes: hullModes(), vol: 0.55, wet: 0.35 }),
  // ---- Town & trade
  anvil: (k, t) => {
    // Three blows, the last one left to ring.
    [0, 0.42, 0.84].forEach((at, i) => anvil(k, t + at, i === 2 ? 0.16 : 0.12, { ring: i === 2 ? 1.8 : 0.8, f: 1200 }));
  },
  quench: (k, t) => {
    // Hot iron into the water tub: a fierce hiss that boils down, bubbling, and steam.
    const h = noise(k, t, { vol: 0.35, attack: 0.01, decay: 1.9, filter: "highpass", freq: 2600, wet: 0.2 });
    rasp(k, h.gain.gain, 35, 0.12, t, t + 2);
    noise(k, t + 0.05, { vol: 0.12, attack: 0.3, decay: 2.2, filter: "bandpass", freq: 5200, q: 0.8, wet: 0.4 });
    for (let i = 0; i < 40; i++) {
      const f = rnd(180, 700);
      tone(k, f, t + Math.pow(Math.random(), 1.4) * 1.6, { vol: rnd(0.02, 0.05), attack: 0.002, decay: rnd(0.02, 0.05), to: f * 1.5, glide: 0.04, pan: rnd(-0.3, 0.3) });
    }
  },
  pots: (k, t) => {
    // Pots and pans hit the floor, bounce, and a lid spins to a stop.
    [
      [0, 420],
      [0.07, 760],
      [0.16, 310],
      [0.27, 980],
      [0.41, 540],
    ].forEach(([at, f], i) => clang(k, t + at, f * rnd(0.95, 1.05), 0.09 * (1 - i * 0.1), rnd(-0.6, 0.6)));
    let at = t + 0.6;
    let gap = 0.16;
    const lid = rnd(1050, 1250);
    for (let i = 0; i < 14; i++) {
      clang(k, at, lid, 0.05 * (1 - i / 16), 0.3, 0.4);
      at += gap;
      gap *= 0.84;
    }
  },
  smash: (k, t) => {
    // A jug or a glass shatters: a crack, a thud, shards skittering away.
    noise(k, t, { vol: 0.6, decay: 0.06, filter: "highpass", freq: 2000, wet: 0.3 });
    noise(k, t, { kind: "brown", vol: 0.35, decay: 0.08, filter: "lowpass", freq: 900 });
    for (let i = 0; i < 28; i++) tink(k, t + Math.pow(Math.random(), 2) * 0.7, rnd(0.03, 0.09), rnd(-0.8, 0.8), rnd(2500, 8000));
  },
  toast: (k, t) => {
    // "Cheers!" round a table, then the glasses meet and someone chuckles.
    for (let i = 0; i < 9; i++) {
      const woman = Math.random() < 0.4;
      utter(k, k.out, t + rnd(0, 0.18), {
        pitch: woman ? rnd(220, 300) : rnd(115, 170),
        vol: rnd(0.035, 0.06),
        pan: rnd(-0.85, 0.85),
        wet: 0.35,
        jitter: 0.04,
        syllables: [
          { vowel: "i", len: rnd(0.26, 0.36), from: 1.12, to: 1.0, onset: "t", breathy: 0.15 },
          { vowel: "er", len: 0.1, from: 0.95, to: 0.9, onset: "s", amp: 0.5, breathy: 0.3 },
        ],
        gap: 0,
      });
    }
    for (let i = 0; i < 9; i++) tink(k, t + rnd(0.65, 1.2), rnd(0.04, 0.08), rnd(-0.8, 0.8));
    laugh(k, k.out, t + rnd(1.3, 1.6), { pitch: rnd(120, 170), vol: 0.04, pan: rnd(-0.6, 0.6), wet: 0.3, kind: "chuckle" });
  },
  "shop-bell": (k, t) => {
    // The little bell on a spring over a shop door.
    const f = rnd(2000, 2300);
    let at = t;
    for (let i = 0; i < 7; i++) {
      bell(k, f * rnd(0.98, 1.02), at, 0.08 * (1 - i / 9), [
        [1, 1, 0.6],
        [2.4, 0.3, 0.3],
        [4.1, 0.15, 0.15],
      ], { wet: 0.3, pan: 0.2 });
      at += rnd(0.07, 0.12);
    }
  },
  crate: (k, t) => {
    // A heavy crate is set down hard and settles.
    woodHit(k, t, 0.7, 0, 1.3);
    woodHit(k, t + 0.14, 0.25, 0.05, 1.1);
    for (let i = 0; i < 3; i++) noise(k, t + 0.05 + i * rnd(0.03, 0.06), { vol: 0.08, decay: 0.02, filter: "bandpass", freq: rnd(1500, 3000), q: 2 });
  },
  "sleigh-bells": (k, t) => {
    // A harness of bells shaken in time, as a sleigh goes by.
    for (let i = 0; i < 8; i++) jingle(k, t + i * 0.25, i % 2 ? 0.035 : 0.055, { pan: -0.6 + i * 0.15 });
  },
  // ---- The world
  raven: (k, t) => {
    let at = t;
    for (let i = 0; i < 3; i++) {
      caw(k, k.out, at, { vol: 0.09 * (i === 2 ? 0.8 : 1), pan: -0.3 });
      at += rnd(0.5, 0.65);
    }
  },
  "branch-snap": (k, t) => {
    // A dry branch breaks underfoot, splinters, and the leaves stir.
    const clicks: [number, number][] = [
      [0, 1],
      [0.004, 0.7],
      [0.011, 0.5],
    ];
    for (let x = 0.02; x < 0.14; x += rnd(0.006, 0.02)) clicks.push([x, rnd(0.1, 0.35)]);
    resonate(k, clickBuffer(k.ctx, 0.16, clicks, 0.0015), t, [
      [rnd(800, 1000), 6, 1.6],
      [rnd(2000, 2400), 8, 1],
      [rnd(3800, 4400), 6, 0.5],
    ], { vol: 0.55, wet: 0.4, dry: 0.4, lowpass: 7000 });
    noise(k, t + 0.05, { kind: "pink", vol: 0.06, attack: 0.05, decay: 0.5, filter: "bandpass", freq: 2600, q: 0.8, pan: 0.3 });
  },
  footsteps: (k, t) => {
    // Someone crosses the boards towards you, the floor complaining now and then.
    for (let i = 0; i < 7; i++) {
      const at = t + i * rnd(0.5, 0.58);
      const v = 0.3 + (0.7 * i) / 6;
      const pan = -0.5 + i * 0.12;
      tone(k, 95, at, { vol: 0.35 * v, attack: 0.002, decay: 0.09, to: 60, pan });
      noise(k, at, { kind: "brown", vol: 0.3 * v, decay: 0.05, filter: "lowpass", freq: 700, pan });
      resonate(k, clickBuffer(k.ctx, 0.03, [[0, 1]], 0.003), at + 0.07, [
        [rnd(300, 380), 7, 1.2],
        [rnd(800, 950), 8, 0.6],
      ], { vol: 0.25 * v, pan, wet: 0.2, lowpass: 2500 });
      if (Math.random() < 0.35) creak(k, at + 0.05, { len: rnd(0.25, 0.4), rate: [40, 160], modes: ropeModes(), vol: 0.12 * v, pan });
    }
  },
};

/** Loudness, measured by rendering each one and matching it to the others (like SFX_TRIM in engine.ts). */
const LEVEL: Record<string, number> = {
  anchor: 1.2,
  "branch-snap": 5.2,
  crate: 1.6,
  creak: 4.4,
  foghorn: 0.8,
  footsteps: 2.85,
  pots: 2.95,
  quench: 0.85,
  raven: 2.9,
  "ship-bell": 1.45,
  "shop-bell": 1.7,
  "sleigh-bells": 2.1,
  smash: 1.33,
  splash: 2.4,
  toast: 2.3,
};

export const PLACE_SFX: Record<string, SfxMaker> = Object.fromEntries(
  Object.entries(MAKERS).map(([id, make]) => {
    const lv = LEVEL[id] ?? 1;
    if (lv === 1) return [id, make];
    const wrapped: SfxMaker = (k, t, o) => {
      const g = k.ctx.createGain();
      g.gain.value = lv;
      g.connect(k.out);
      make({ ...k, out: g }, t, o);
    };
    return [id, wrapped];
  }),
);
