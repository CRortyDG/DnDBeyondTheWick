"use client";

// The soundboard's looping layers: ambience beds and music, all generated as
// they play. The music is composed on the fly from a few rules (a key, a chord
// pattern, a rhythm), so it never repeats exactly and owes nothing to anyone.

import { bell, envGain, lfo, midi, noise, noiseBed, panTo, pick, pluck, rnd, tone, type Kit, type LayerKit, type LayerMaker } from "./engine";
import { SFX_MAKERS } from "./sfx";
import { clickBuffer, laugh, makeVoice, phrase, rasp, resonate, shape, utter, type Voice } from "./voice";
import { anvil, caw, creak, hullModes, jingle, ropeModes, splash, tink, woodHit } from "./sfxPlaces";

// ---------------------------------------------------------------------------
// Ambience

/** People talking: buzzing voices through moving vowel filters, in bursts of syllables. */
function crowd(k: LayerKit, o: { voices: number; room: number; clinks: boolean; laughs: boolean }) {
  const { ctx } = k;
  const bus = ctx.createGain();
  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 120;
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 3400;
  bus.connect(hp).connect(lp).connect(k.out);
  const wet = ctx.createGain();
  wet.gain.value = o.room;
  lp.connect(wet).connect(k.wet);

  // Far side of the room: noise shaped like speech, its level fluttering at
  // the pace of syllables, blurred so no one voice stands out.
  const babble = ctx.createGain();
  babble.gain.value = 0;
  const far = ctx.createBiquadFilter();
  far.type = "lowpass";
  far.frequency.value = 1800;
  babble.connect(far).connect(bus);
  const fw = ctx.createGain();
  fw.gain.value = 0.6;
  far.connect(fw).connect(k.wet);
  const beds = [
    [520, 1.4, 1],
    [1250, 2, 0.6],
    [2400, 2.5, 0.25],
  ].map(([f, q, lv]) => {
    const b = noiseBed(k, "pink", "bandpass", f, q, lv, babble);
    const flutter = ctx.createGain();
    flutter.gain.value = 0;
    // Reconnect through a fluttering gain.
    b.g.disconnect();
    b.g.connect(flutter).connect(babble);
    const base = ctx.createConstantSource();
    base.offset.value = 0.55;
    base.connect(flutter.gain);
    base.start();
    const r = rasp(k, flutter.gain, rnd(3.5, 5.5), 0.3, ctx.currentTime);
    return () => (b.stop(), r.stop(), base.stop());
  });
  k.onStop(() => beds.forEach((x) => x()));

  // Nearer voices, each one a person who talks now and then.
  const voices: { v: Voice; base: number; busy: boolean; scale: number }[] = [];
  for (let i = 0; i < o.voices; i++) {
    const woman = Math.random() < 0.4;
    const base = (woman ? rnd(175, 245) : rnd(95, 140)) * rnd(0.95, 1.05);
    const v = makeVoice(k, bus, ctx.currentTime, { pitch: base, jitter: 0.03, pan: rnd(-0.9, 0.9) });
    k.onStop(() => v.stop());
    voices.push({ v, base, busy: false, scale: woman ? rnd(1.08, 1.16) : rnd(0.94, 1.02) });
  }
  const active = () => Math.round(2 + k.level() * (o.voices - 2));
  /** One person says something: a phrase of syllables with consonants, the pitch falling to the end. */
  const speak = (vi: number) => {
    const p = voices[vi];
    if (!p || p.busy || !k.alive()) return;
    p.busy = true;
    const { v, base } = p;
    let t = ctx.currentTime + 0.05;
    // Some people are near, most are a table or two away.
    const loud = rnd(0.012, 0.04);
    const words = phrase(Math.floor(rnd(3, 11)));
    for (const s of words) {
      if (s.onset === "s" || s.onset === "t") {
        v.hiss.gain.setTargetAtTime(0.1, t, 0.006);
        v.hiss.gain.setTargetAtTime(0, t + (s.onset === "s" ? 0.06 : 0.015), 0.01);
      }
      v.breath.gain.setTargetAtTime(s.onset === "h" ? 1.4 : (s.breathy ?? 0.15) * 1.4, t, 0.015);
      v.breath.gain.setTargetAtTime((s.breathy ?? 0.15) * 1.4, t + 0.05, 0.02);
      shape(v, s.vowel, t, 0.03, p.scale);
      v.osc.frequency.setTargetAtTime(base * (s.from ?? 1), t, 0.03);
      v.out.gain.setTargetAtTime(loud * (s.amp ?? 1), t + (s.onset ? 0.03 : 0), 0.02);
      v.out.gain.setTargetAtTime(loud * 0.1, t + s.len * 0.8, 0.03);
      t += s.len + rnd(0.01, 0.05);
      // A pause between words now and then.
      if (Math.random() < 0.2) t += rnd(0.08, 0.25);
    }
    v.out.gain.setTargetAtTime(0, t, 0.05);
    setTimeout(() => (p.busy = false), (t - ctx.currentTime) * 1000 + rnd(200, 1200));
  };
  k.every(90, 260, () => {
    const n = active();
    const i = Math.floor(Math.random() * n);
    if (Math.random() < 0.55) speak(i);
  }, 50);
  const setLevel = (lv: number) => {
    babble.gain.setTargetAtTime(0.015 + lv * 0.07, ctx.currentTime, 1);
  };
  setLevel(k.level());
  if (o.clinks)
    k.every(1200, 5000, () => {
      if (Math.random() > 0.3 + k.level() * 0.6) return;
      const t = ctx.currentTime + 0.02;
      // A mug or a glass.
      bell(k, rnd(2200, 3600), t, rnd(0.03, 0.07), [
        [1, 1, 0.18],
        [2.4, 0.4, 0.1],
      ], { pan: rnd(-0.8, 0.8), wet: 0.4 });
      if (Math.random() < 0.4) bell(k, rnd(2200, 3600), t + rnd(0.03, 0.08), 0.04, [[1, 1, 0.15]], { pan: rnd(-0.8, 0.8) });
    });
  if (o.laughs)
    k.every(5000, 16000, () => {
      if (Math.random() > 0.2 + k.level() * 0.7) return;
      const woman = Math.random() < 0.4;
      const kind = pick(["chuckle", "laugh", "laugh", "cackle"] as const);
      laugh(k, bus, ctx.currentTime + 0.05, { pitch: woman ? rnd(220, 300) : rnd(120, 170), vol: rnd(0.03, 0.06), pan: rnd(-0.8, 0.8), kind });
      // Laughter catches.
      if (Math.random() < 0.35 * k.level()) laugh(k, bus, ctx.currentTime + rnd(0.2, 0.5), { pitch: rnd(120, 280), vol: rnd(0.02, 0.04), pan: rnd(-0.8, 0.8), kind: "chuckle" });
    });
  return { setLevel };
}

function fire(k: LayerKit, roar = 0.25) {
  const r = noiseBed(k, "brown", "lowpass", 260, 0.5, roar);
  const l = lfo(k, r.g.gain, 0.17, roar * 0.3);
  k.onStop(() => (r.stop(), l.stop()));
  const crackle = () => {
    const t = k.ctx.currentTime + 0.01;
    noise(k, t, { vol: rnd(0.12, 0.45), decay: rnd(0.008, 0.03), filter: "highpass", freq: rnd(1500, 3800), pan: rnd(-0.5, 0.5) });
    if (Math.random() < 0.06) noise(k, t, { kind: "brown", vol: 0.3, decay: 0.08, filter: "lowpass", freq: 700 }); // a log pops
  };
  k.every(25, 220, crackle, 10);
  k.every(800, 2600, () => {
    // A little burst of crackles.
    for (let i = 0; i < Math.floor(rnd(3, 9)); i++) setTimeout(crackle, i * rnd(15, 40));
  });
}

function rain(k: LayerKit, heavy: number) {
  const a = noiseBed(k, "pink", "highpass", 500, 0.5, 0.55 * heavy);
  const b = noiseBed(k, "white", "bandpass", 4200, 0.6, 0.12 * heavy);
  const lp = k.ctx.createBiquadFilter();
  const l = lfo(k, a.g.gain, 0.05, 0.1 * heavy);
  k.onStop(() => (a.stop(), b.stop(), l.stop(), lp.disconnect()));
  // Drops: a fine patter on leaves and stone, the odd fat drop on wood, and
  // now and then a drip off the eaves into a puddle.
  k.every(8, 45, () => {
    const t = k.ctx.currentTime + 0.01;
    noise(k, t, { vol: rnd(0.015, 0.07) * heavy, decay: rnd(0.003, 0.008), filter: "bandpass", freq: rnd(2500, 7000), q: rnd(1, 2.5), pan: rnd(-0.9, 0.9) });
  });
  k.every(60, 260, () => {
    const t = k.ctx.currentTime + 0.01;
    noise(k, t, { vol: rnd(0.04, 0.1) * heavy, decay: rnd(0.012, 0.03), filter: "bandpass", freq: rnd(500, 1400), q: rnd(3, 6), pan: rnd(-0.9, 0.9) });
  });
  k.every(900, 3200, () => {
    const t = k.ctx.currentTime + 0.01;
    const f = rnd(1400, 2600);
    noise(k, t, { vol: 0.05 * heavy, decay: 0.006, filter: "bandpass", freq: 3000, q: 1.5, pan: rnd(-0.6, 0.6) });
    tone(k, f, t + 0.004, { vol: 0.012 * heavy, attack: 0.002, decay: 0.025, to: f * 1.25, glide: 0.02, pan: rnd(-0.6, 0.6), wet: 0.3 });
  });
}

function wind(k: LayerKit, level = 0.55, freq = 600) {
  const w = noiseBed(k, "pink", "bandpass", freq, 1.1, level);
  const l1 = lfo(k, w.f.frequency, 0.06, freq * 0.4);
  const l2 = lfo(k, w.g.gain, 0.11, level * 0.4);
  const low = noiseBed(k, "brown", "lowpass", 200, 0.7, level * 0.5);
  k.onStop(() => (w.stop(), l1.stop(), l2.stop(), low.stop()));
  // Gusts.
  k.every(6000, 14000, () => {
    const t = k.ctx.currentTime;
    w.f.frequency.setTargetAtTime(freq * rnd(1.4, 2.2), t, 1.2);
    w.f.frequency.setTargetAtTime(freq, t + rnd(2.5, 4), 1.5);
    w.g.gain.setTargetAtTime(level * 1.7, t, 1);
    w.g.gain.setTargetAtTime(level, t + 3, 1.5);
  });
}

function birds(k: LayerKit, minMs: number, maxMs: number) {
  const song = () => {
    const t = k.ctx.currentTime + 0.02;
    const pan = rnd(-0.9, 0.9);
    const kind = Math.floor(Math.random() * 4);
    if (kind === 0) {
      // Chirp chirp chirp.
      const n = Math.floor(rnd(3, 7));
      const f = rnd(2800, 4200);
      for (let i = 0; i < n; i++) tone(k, f, t + i * 0.11, { vol: 0.05, attack: 0.005, decay: 0.05, to: f * 1.35, glide: 0.05, pan, wet: 0.3 });
    } else if (kind === 1) {
      // A warble.
      tone(k, rnd(2400, 3400), t, { vol: 0.045, attack: 0.03, decay: 0.5, hold: 0.2, vibrato: { rate: rnd(14, 24), depth: rnd(200, 500) }, pan, wet: 0.3 });
    } else if (kind === 2) {
      // Dee-dee-doo.
      const f = rnd(2200, 3000);
      tone(k, f, t, { vol: 0.05, attack: 0.01, decay: 0.15, pan, wet: 0.3 });
      tone(k, f, t + 0.22, { vol: 0.05, attack: 0.01, decay: 0.15, pan, wet: 0.3 });
      tone(k, f * 0.8, t + 0.44, { vol: 0.05, attack: 0.01, decay: 0.3, pan, wet: 0.3 });
    } else {
      // A quick trill down.
      for (let i = 0; i < 8; i++) tone(k, rnd(4000, 4600) - i * 120, t + i * 0.045, { vol: 0.03, attack: 0.003, decay: 0.03, pan, wet: 0.3 });
    }
  };
  k.every(minMs, maxMs, song, 400);
}

function crickets(k: LayerKit) {
  for (let c = 0; c < 3; c++) {
    const f = rnd(4200, 5200);
    const pan = rnd(-0.9, 0.9);
    const rate = rnd(0.5, 1.1);
    k.every(rate * 800, rate * 1300, () => {
      const t = k.ctx.currentTime + 0.01;
      for (let i = 0; i < 3; i++) tone(k, f, t + i * 0.045, { vol: 0.03, attack: 0.004, decay: 0.025, pan });
    }, rnd(0, 800));
  }
}

function waves(k: LayerKit) {
  const base = noiseBed(k, "brown", "lowpass", 380, 0.7, 0.25);
  k.onStop(base.stop);
  const swell = () => {
    const t = k.ctx.currentTime + 0.05;
    const up = rnd(2, 3.2);
    const down = rnd(3, 4.5);
    const n = noise(k, t, { kind: "pink", vol: rnd(0.25, 0.45), attack: up, decay: down, filter: "lowpass", freq: 300, pan: rnd(-0.5, 0.5) });
    n.filter.frequency.setValueAtTime(300, t);
    n.filter.frequency.exponentialRampToValueAtTime(rnd(1400, 2400), t + up);
    n.filter.frequency.exponentialRampToValueAtTime(350, t + up + down);
  };
  swell();
  k.every(4500, 8000, swell);
}

function gulls(k: LayerKit) {
  // A herring gull: a harsh, nasal "kee-ow", then a string of "kyow-kyow-kyow".
  const call = (t: number, base: number, pan: number, vol: number, len: number) => {
    const { ctx } = k;
    const o = ctx.createOscillator();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(base * 0.8, t);
    o.frequency.exponentialRampToValueAtTime(base * 1.25, t + len * 0.18);
    o.frequency.exponentialRampToValueAtTime(base * 0.62, t + len);
    const am = ctx.createGain();
    am.gain.value = 0.7;
    rasp(k, am.gain, rnd(60, 110), 0.35, t, t + len + 0.1);
    const g = envGain(ctx, panTo(ctx, k.out, pan), t, vol, 0.015, len * 0.6, len * 0.35);
    const w = ctx.createGain();
    w.gain.value = 0.5;
    g.connect(w).connect(k.wet);
    for (const [f, q, lv] of [
      [base * 1.6, 4, 1],
      [base * 2.6, 6, 0.5],
      [base * 0.9, 3, 0.4],
    ] as const) {
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = f;
      bp.Q.value = q;
      const lg = ctx.createGain();
      lg.gain.value = lv;
      o.connect(am).connect(bp).connect(lg).connect(g);
    }
    o.start(t);
    o.stop(t + len + 0.1);
  };
  k.every(7000, 20000, () => {
    const t = k.ctx.currentTime + 0.02;
    const birds = Math.random() < 0.4 ? 2 : 1;
    for (let b = 0; b < birds; b++) {
      const pan = rnd(-0.9, 0.9);
      const base = rnd(1050, 1400);
      const far = b ? 0.5 : 1;
      let at = t + b * rnd(0.6, 1.4);
      call(at, base, pan, 0.05 * far, rnd(0.45, 0.6));
      at += rnd(0.65, 0.85);
      const n = Math.floor(rnd(2, 6));
      for (let i = 0; i < n; i++) {
        call(at, base * rnd(0.95, 1.05), pan, 0.04 * far * (1 - i / (n + 2)), rnd(0.14, 0.2));
        at += rnd(0.2, 0.26);
      }
    }
  });
}

function drips(k: LayerKit, minMs: number, maxMs: number) {
  k.every(minMs, maxMs, () => {
    const t = k.ctx.currentTime + 0.01;
    const f = rnd(700, 1800);
    tone(k, f, t, { vol: rnd(0.06, 0.12), attack: 0.002, decay: 0.08, to: f * 1.8, glide: 0.04, pan: rnd(-0.8, 0.8), wet: 1 });
  });
}

function drone(k: LayerKit, freqs: number[], vol: number, cutoff = 300) {
  const lp = k.ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = cutoff;
  lp.connect(k.out);
  const stops: (() => void)[] = [];
  for (const f of freqs) {
    const o = k.ctx.createOscillator();
    o.type = "sawtooth";
    o.frequency.value = f;
    o.detune.value = rnd(-8, 8);
    const g = k.ctx.createGain();
    g.gain.value = vol;
    o.connect(g).connect(lp);
    o.start();
    stops.push(() => o.stop());
  }
  const l = lfo(k, lp.frequency, 0.05, cutoff * 0.3);
  k.onStop(() => (stops.forEach((s) => s()), l.stop()));
  return lp;
}

const sfx = (k: Kit, id: string, o = {}) => SFX_MAKERS[id]?.(k, k.ctx.currentTime + 0.02, o);

// ---------------------------------------------------------------------------
// Music

/** One chord: a root (midi) and the notes above it. */
type Chord = { root: number; notes: number[] };
const ch = (root: number, kind: "maj" | "min" | "dom" | "sus"): Chord => ({
  root,
  notes: kind === "maj" ? [0, 4, 7] : kind === "min" ? [0, 3, 7] : kind === "dom" ? [0, 4, 7, 10] : [0, 5, 7],
});

/** A tune: a melody (midi per step, or null for a rest/held note) over a chord per bar. */
function compose(scale: number[], chords: Chord[], steps: number, lo: number, hi: number, rhythm: number[][]) {
  const out: { note: number | null; len: number }[][] = [];
  let cur = lo + Math.floor((hi - lo) / 2);
  const inScale = (m: number) => scale.includes(((m % 12) + 12) % 12);
  const near = (target: number, pool: number[]) => pool.reduce((a, b) => (Math.abs(b - target) < Math.abs(a - target) ? b : a));
  for (const c of chords) {
    const r = pick(rhythm);
    const bar: { note: number | null; len: number }[] = [];
    let pos = 0;
    for (const len of r) {
      const strong = pos === 0 || pos === steps / 2;
      let next: number;
      if (strong) {
        // Land on a chord tone near where the tune is.
        const pool: number[] = [];
        for (let m = lo; m <= hi; m++) if (c.notes.some((n) => (m - c.root - n) % 12 === 0)) pool.push(m);
        next = near(cur + Math.round(rnd(-3, 3)), pool);
      } else {
        // Step to a neighbour in the scale, now and then a leap.
        const dir = cur > hi - 3 ? -1 : cur < lo + 3 ? 1 : Math.random() < 0.5 ? -1 : 1;
        let m = cur + dir * (Math.random() < 0.8 ? 1 : 3);
        while (!inScale(m)) m += dir;
        next = Math.max(lo, Math.min(hi, m));
      }
      bar.push({ note: next, len });
      cur = next;
      pos += len;
    }
    out.push(bar);
  }
  return out;
}

const D_MIXO = [2, 4, 6, 7, 9, 11, 0];
const A_MINOR = [9, 11, 0, 2, 4, 5, 7];
const D_MINOR = [2, 4, 5, 7, 9, 10, 0];
const G_MAJOR = [7, 9, 11, 0, 2, 4, 6];

/** A tin whistle: a sine with breath and a little vibrato. */
function whistle(k: Kit, f: number, t: number, len: number, vol: number) {
  tone(k, f, t, { type: "triangle", vol, attack: 0.02, decay: 0.12, hold: Math.max(0, len - 0.1), vibrato: { rate: 5.5, depth: f * 0.006 }, wet: 0.3 });
  tone(k, f * 2, t, { vol: vol * 0.15, attack: 0.02, decay: 0.1, hold: Math.max(0, len - 0.1) });
  noise(k, t, { vol: vol * 0.25, attack: 0.01, decay: 0.06, filter: "bandpass", freq: f * 2, q: 2 });
}

/** A fiddle: sawtooth, bowed in, with vibrato. */
function fiddle(k: Kit, f: number, t: number, len: number, vol: number) {
  tone(k, f, t, { type: "sawtooth", vol, attack: 0.04, decay: 0.12, hold: Math.max(0, len - 0.1), vibrato: { rate: 5.8, depth: f * 0.008 }, filter: { type: "lowpass", freq: Math.min(5000, f * 5), q: 1 }, wet: 0.3 });
}

function bodhran(k: Kit, t: number, vol: number, high = false) {
  tone(k, high ? 180 : 95, t, { vol, attack: 0.003, decay: high ? 0.12 : 0.28, to: high ? 120 : 60, glide: 0.15 });
  noise(k, t, { kind: "brown", vol: vol * 0.5, decay: 0.06, filter: "lowpass", freq: high ? 1500 : 700 });
}

function strum(k: Kit, c: Chord, t: number, vol: number, base: number, spread = 0.018) {
  c.notes.forEach((n, i) => pluck(k, midi(base + ((c.root + n - base + 120) % 12)), t + i * spread, vol, { bright: 0.55, wet: 0.25, pan: -0.25 + i * 0.15 }));
}

const tavernJig: LayerMaker = (k) => {
  // 6/8, a dotted-quarter pulse around 112. The tune is new every two times through.
  const step = 60 / 112 / 3;
  const A = [ch(62, "maj"), ch(62, "maj"), ch(60, "maj"), ch(62, "maj"), ch(62, "maj"), ch(67, "maj"), ch(69, "maj"), ch(62, "maj")];
  const B = [ch(67, "maj"), ch(62, "maj"), ch(67, "maj"), ch(69, "maj"), ch(67, "maj"), ch(62, "maj"), ch(69, "dom"), ch(62, "maj")];
  const rhythms = [[1, 1, 1, 1, 1, 1], [2, 1, 2, 1], [1, 1, 1, 3], [3, 1, 1, 1], [2, 1, 1, 1, 1], [1, 1, 1, 2, 1]];
  let tune: { chords: Chord[]; melody: ReturnType<typeof compose> } | null = null;
  const newTune = () => {
    const a = compose(D_MIXO, A, 6, 66, 81, rhythms);
    const b = compose(D_MIXO, B, 6, 69, 83, rhythms);
    // AABB, with the A ending on the tonic.
    a[7] = [{ note: 74, len: 3 }, { note: null, len: 3 }];
    b[7] = [{ note: 74, len: 3 }, { note: null, len: 3 }];
    tune = { chords: [...A, ...A, ...B, ...B], melody: [...a, ...a, ...b, ...b] };
  };
  k.steps(
    () => step,
    (i, t) => {
      const bar = Math.floor(i / 6) % 32;
      const pos = i % 6;
      if (i % (6 * 64) === 0 || !tune) newTune();
      const tn = tune!;
      const c = tn.chords[bar];
      // Lute: bass on one, chord on the off-beats.
      if (pos === 0) pluck(k, midi(c.root - 24), t, 0.45, { bright: 0.4, wet: 0.2 });
      if (pos === 3) pluck(k, midi(c.root - 17), t, 0.3, { bright: 0.4, wet: 0.2 });
      if (pos === 1 || pos === 4) strum(k, c, t, 0.12, 57);
      if (pos === 2 || pos === 5) strum(k, c, t, 0.08, 57);
      // Bodhrán.
      if (pos === 0) bodhran(k, t, 0.35);
      else if (pos === 3) bodhran(k, t, 0.22);
      else if (Math.random() < 0.3) bodhran(k, t, 0.08, true);
      // The tune: whistle the first time through each half, fiddle the second.
      let p = 0;
      for (const n of tn.melody[bar]) {
        if (p === pos && n.note !== null) {
          const second = Math.floor(bar / 8) % 2 === 1;
          if (second) fiddle(k, midi(n.note), t, n.len * step * 0.95, 0.05);
          else whistle(k, midi(n.note + 12), t, n.len * step * 0.9, 0.06);
        }
        p += n.len;
      }
    },
  );
};

const quietLute: LayerMaker = (k) => {
  // 3/4 arpeggios, slow, in A minor, with a tune drifting on top now and then.
  const step = 60 / 70 / 2;
  const prog = [ch(57, "min"), ch(53, "maj"), ch(60, "maj"), ch(55, "maj"), ch(57, "min"), ch(53, "maj"), ch(52, "maj"), ch(57, "min")];
  const shape = [0, 2, 4, 5, 4, 2];
  let tune = compose(A_MINOR, prog, 6, 69, 81, [[2, 2, 2], [3, 1, 2], [4, 2], [6]]);
  k.steps(
    () => step,
    (i, t) => {
      const bar = Math.floor(i / 6) % prog.length;
      const pos = i % 6;
      if (i > 0 && i % (6 * prog.length * 2) === 0) tune = compose(A_MINOR, prog, 6, 69, 81, [[2, 2, 2], [3, 1, 2], [4, 2], [6]]);
      const c = prog[bar];
      const notes = [c.root - 12, c.root - 12 + c.notes[1], c.root - 12 + c.notes[2], c.root, c.root + c.notes[1], c.root + c.notes[2]];
      pluck(k, midi(notes[shape[pos]]), t, pos === 0 ? 0.32 : 0.2, { bright: 0.35, wet: 0.45 });
      const secondHalf = Math.floor(i / (6 * prog.length)) % 2 === 1;
      if (secondHalf) {
        let p = 0;
        for (const n of tune[bar]) {
          if (p === pos && n.note !== null) pluck(k, midi(n.note), t, 0.22, { bright: 0.6, wet: 0.5 });
          p += n.len;
        }
      }
    },
  );
};

const travel: LayerMaker = (k) => {
  // A walking tune in G: plucked bass, strummed chords, whistle on top, gentle drum.
  const step = 60 / 96 / 2;
  const prog = [ch(67, "maj"), ch(64, "min"), ch(60, "maj"), ch(62, "maj"), ch(67, "maj"), ch(60, "maj"), ch(62, "maj"), ch(67, "maj")];
  const rh = [[2, 2, 2, 2], [1, 1, 2, 2, 2], [3, 1, 2, 2], [4, 2, 2], [2, 1, 1, 4]];
  let tune = compose(G_MAJOR, prog, 8, 67, 81, rh);
  k.steps(
    () => step,
    (i, t) => {
      const bar = Math.floor(i / 8) % prog.length;
      const pos = i % 8;
      if (i > 0 && i % (8 * prog.length * 2) === 0) tune = compose(G_MAJOR, prog, 8, 67, 81, rh);
      const c = prog[bar];
      if (pos === 0) pluck(k, midi(c.root - 24), t, 0.4, { bright: 0.4 });
      if (pos === 4) pluck(k, midi(c.root - 17), t, 0.3, { bright: 0.4 });
      if (pos === 2 || pos === 6) strum(k, c, t, 0.1, 55, 0.025);
      if (pos === 0 || pos === 4) bodhran(k, t, 0.15);
      if (Math.floor(i / (8 * prog.length)) % 2 === 1) {
        let p = 0;
        for (const n of tune[bar]) {
          if (p === pos && n.note !== null) whistle(k, midi(n.note + 12), t, n.len * step * 0.9, 0.045);
          p += n.len;
        }
      }
    },
  );
};

const battle: LayerMaker = (k) => {
  // Driving eighths in D minor: war drums, low strings, brass stabs, a cymbal at each turn.
  const step = 60 / 138 / 2;
  const roots = [50, 50, 46, 46, 48, 48, 45, 45];
  k.steps(
    () => step,
    (i, t) => {
      const bar = Math.floor(i / 8) % roots.length;
      const pos = i % 8;
      const r = roots[bar];
      const phrase = Math.floor(i / 64);
      // Low strings: an ostinato that climbs on the last two eighths.
      const n = pos < 6 ? r - 12 : r - 12 + (pos === 6 ? 3 : 5);
      tone(k, midi(n), t, { type: "sawtooth", vol: 0.07, attack: 0.008, decay: step * 0.9, filter: { type: "lowpass", freq: 900, q: 2 } });
      tone(k, midi(n - 12), t, { type: "sawtooth", vol: 0.05, attack: 0.008, decay: step * 0.9, filter: { type: "lowpass", freq: 400 } });
      // War drums.
      if (pos === 0 || pos === 3 || pos === 6) {
        tone(k, 70, t, { vol: pos === 0 ? 0.7 : 0.45, attack: 0.003, decay: 0.45, to: 38, glide: 0.3, wet: 0.25 });
        noise(k, t, { kind: "brown", vol: 0.35, decay: 0.1, filter: "lowpass", freq: 800 });
      }
      if (pos === 2 || pos === 6) noise(k, t, { vol: 0.12, decay: 0.08, filter: "bandpass", freq: 1800, q: 1.5 });
      if (bar % 4 === 3 && pos >= 4) noise(k, t, { vol: 0.08 + (pos - 4) * 0.03, decay: 0.07, filter: "bandpass", freq: 2200, q: 1.5 });
      // Brass every other bar.
      if (pos === 0 && bar % 2 === 0) {
        const chord = r === 46 ? [0, 4, 7] : r === 45 ? [0, 4, 7] : [0, 3, 7];
        for (const x of chord) tone(k, midi(r + x), t, { type: "sawtooth", vol: 0.04, attack: 0.05, decay: 0.5, hold: step * 4, filter: { type: "lowpass", freq: 600, to: 2400, over: 0.15 }, wet: 0.35 });
      }
      // A high string line on alternate phrases.
      if (phrase % 2 === 1 && pos % 2 === 0) {
        const line = [62, 65, 69, 67, 65, 64, 62, 61];
        tone(k, midi(line[(bar * 4 + pos / 2) % line.length] + 12), t, { type: "sawtooth", vol: 0.025, attack: 0.03, decay: 0.2, hold: step * 1.6, vibrato: { rate: 6, depth: 5 }, filter: { type: "lowpass", freq: 3000 }, wet: 0.4 });
      }
      if (i % 64 === 0) noise(k, t, { vol: 0.16, attack: 0.005, decay: 2, filter: "highpass", freq: 5000, wet: 0.4 });
    },
  );
};

const tension: LayerMaker = (k) => {
  drone(k, [55, 55 * 1.003, 82.4], 0.06, 260);
  // A heartbeat-slow pulse.
  k.steps(
    () => 1.15,
    (_i, t) => {
      tone(k, 55, t, { vol: 0.35, attack: 0.005, decay: 0.3, to: 40 });
      tone(k, 50, t + 0.24, { vol: 0.22, attack: 0.005, decay: 0.3, to: 38 });
    },
  );
  // High strings rubbing against each other.
  k.every(6000, 11000, () => {
    const t = k.ctx.currentTime + 0.05;
    const f = pick([880, 932, 988, 1046]);
    for (const x of [1, 1.059]) tone(k, f * x, t, { type: "sawtooth", vol: 0.012, attack: 2.5, decay: 2.5, hold: 1, filter: { type: "lowpass", freq: 2500 }, vibrato: { rate: 4, depth: 3 }, wet: 0.6 });
  }, 2500);
};

/** Slow pad chords. */
function pads(k: LayerKit, prog: number[][], chordSec: number, vol: number, type: OscillatorType = "triangle") {
  k.steps(
    () => chordSec,
    (i, t) => {
      const c = prog[i % prog.length];
      for (const m of c) for (const det of [-7, 7]) tone(k, midi(m), t, { type, vol: vol / c.length, attack: chordSec * 0.35, decay: chordSec * 0.6, hold: chordSec * 0.3, detune: det, filter: { type: "lowpass", freq: 1800 }, wet: 0.7 });
    },
  );
}

const wonder: LayerMaker = (k) => {
  pads(k, [[48, 55, 64, 71], [45, 52, 60, 67, 71], [41, 48, 57, 64], [43, 50, 59, 64]], 5, 0.12);
  const penta = [72, 74, 76, 79, 81, 84, 86, 88];
  k.every(700, 2600, () => {
    const t = k.ctx.currentTime + 0.02;
    bell(k, midi(pick(penta)), t, 0.05, [
      [1, 1, 2.2],
      [2, 0.2, 1],
      [3.01, 0.08, 0.6],
    ], { wet: 0.8, pan: rnd(-0.7, 0.7) });
  });
};

const sorrow: LayerMaker = (k) => {
  pads(k, [[38, 50, 53, 57], [34, 50, 53, 58], [31, 50, 55, 58], [33, 49, 52, 57]], 5.5, 0.1);
  // A cello, slow and alone.
  let cur = 50;
  k.steps(
    () => 2.75,
    (_i, t) => {
      if (Math.random() < 0.25) return;
      const dir = Math.random() < 0.5 ? -1 : 1;
      let m = cur + dir * pick([1, 2, 3]);
      while (!D_MINOR.includes(((m % 12) + 12) % 12)) m += dir;
      cur = Math.max(45, Math.min(62, m));
      tone(k, midi(cur), t, { type: "sawtooth", vol: 0.05, attack: 0.6, decay: 1, hold: 1.3, vibrato: { rate: 5, depth: 3 }, filter: { type: "lowpass", freq: 1100 }, wet: 0.6 });
    },
  );
};

// ---------------------------------------------------------------------------
// Places: the docks, a ship, a kitchen, a feast hall, a smithy, a temple, city
// streets, a snowy town, deep woods and a marsh. Each is a bed of its own plus
// the small things that happen there now and then.

/** The same layer kit, playing through its own gain (to set a part's level inside a layer). */
function sub(k: LayerKit, level: number, dest: AudioNode = k.out): LayerKit {
  const g = k.ctx.createGain();
  g.gain.value = level;
  g.connect(dest);
  return { ...k, out: g };
}

/** Water slapping at pilings or a hull, and sucking back with a gurgle. */
function lapping(k: LayerKit, vol = 1) {
  const bed = noiseBed(k, "brown", "lowpass", 320, 0.6, 0.16 * vol);
  const l = lfo(k, bed.g.gain, 0.13, 0.06 * vol);
  k.onStop(() => (bed.stop(), l.stop()));
  k.every(600, 2000, () => {
    const t = k.ctx.currentTime + 0.02;
    const pan = rnd(-0.8, 0.8);
    noise(k, t, { kind: "pink", vol: rnd(0.08, 0.18) * vol, attack: rnd(0.02, 0.06), decay: rnd(0.25, 0.5), filter: "bandpass", freq: rnd(500, 900), q: 1.2, to: rnd(250, 400), pan, wet: 0.15 });
    for (let i = 0; i < Math.floor(rnd(2, 6)); i++) {
      const f = rnd(300, 900);
      tone(k, f, t + rnd(0.1, 0.5), { vol: rnd(0.008, 0.02) * vol, attack: 0.002, decay: rnd(0.03, 0.07), to: f * rnd(1.2, 1.6), glide: 0.05, pan });
    }
  }, 200);
}

/** A call across the docks or a kitchen: "heave!", "ho!", "order!". */
function shout(k: LayerKit, dest: AudioNode, t: number, o: { pitch: number; vol: number; pan: number; wet?: number }) {
  const two = Math.random() < 0.6;
  utter(k, dest, t, {
    pitch: o.pitch,
    vol: o.vol,
    pan: o.pan,
    wet: o.wet ?? 0.5,
    jitter: 0.04,
    rough: { rate: 40, depth: 0.12 },
    syllables: two
      ? [
          { vowel: pick(["e", "ae"] as const), len: rnd(0.14, 0.2), from: 1, to: 1.1, onset: "h", breathy: 0.2 },
          { vowel: pick(["o", "a", "u"] as const), len: rnd(0.35, 0.55), from: 1.15, to: 0.85, breathy: 0.2 },
        ]
      : [{ vowel: pick(["o", "a"] as const), len: rnd(0.3, 0.45), from: 1.1, to: 0.8, onset: "h", breathy: 0.2 }],
  });
}

/** A far-off voice at a distance: muffled through a lowpass. */
function far(k: LayerKit, cutoff: number): LayerKit {
  const lp = k.ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = cutoff;
  lp.connect(k.out);
  return { ...k, out: lp };
}

/** Rope creaks, halyards tapping the mast, a sail luffing, wind in the lines. */
function rigging(k: LayerKit) {
  const whistle = noiseBed(k, "pink", "bandpass", 1900, 7, 0.035);
  const l1 = lfo(k, whistle.f.frequency, 0.07, 300);
  const l2 = lfo(k, whistle.g.gain, 0.05, 0.025);
  k.onStop(() => (whistle.stop(), l1.stop(), l2.stop()));
  k.every(1200, 4200, () => {
    creak(k, k.ctx.currentTime + 0.02, { len: rnd(0.3, 0.9), rate: [40, 240], modes: ropeModes(), vol: rnd(0.12, 0.25), pan: rnd(-0.8, 0.8), wet: 0.25 });
  }, 500);
  // A halyard tapping the mast in the wind: tink, tink-tink.
  k.every(2500, 8000, () => {
    const t = k.ctx.currentTime + 0.02;
    const f = rnd(1700, 2500);
    const pan = rnd(-0.7, 0.7);
    for (let i = 0; i < Math.floor(rnd(1, 4)); i++) bell(k, f * rnd(0.98, 1.02), t + i * rnd(0.35, 0.7), rnd(0.02, 0.04), [
      [1, 1, 0.35],
      [2.6, 0.4, 0.2],
      [5.1, 0.15, 0.1],
    ], { pan, wet: 0.35 });
  });
  // A sail luffs: a flutter of canvas.
  k.every(6000, 16000, () => {
    const t = k.ctx.currentTime + 0.02;
    const len = rnd(0.5, 1.2);
    const n = noise(k, t, { kind: "pink", vol: 0.12, attack: 0.08, decay: len * 0.6, hold: len * 0.4, filter: "lowpass", freq: 900, pan: rnd(-0.5, 0.5) });
    rasp(k, n.gain.gain, rnd(9, 16), 0.08, t, t + len + 0.2);
  }, 3000);
}

/** A ship's timbers: the hull groaning on the swell, water along the side, knocks and steps on deck. */
function hull(k: LayerKit) {
  const rush = noiseBed(k, "pink", "bandpass", 650, 0.7, 0.07);
  const roll = lfo(k, rush.g.gain, 0.11, 0.05);
  const sw = lfo(k, rush.f.frequency, 0.11, 250);
  k.onStop(() => (rush.stop(), roll.stop(), sw.stop()));
  lapping(sub(k, 0.6));
  k.every(2000, 6000, () => {
    creak(k, k.ctx.currentTime + 0.02, { len: rnd(0.9, 2.4), rate: [10, rnd(70, 130)], modes: hullModes(), vol: rnd(0.25, 0.45), pan: rnd(-0.7, 0.7), wet: 0.3 });
  }, 800);
  // Something loose knocks as she rolls.
  k.every(5000, 12000, () => {
    const t = k.ctx.currentTime + 0.02;
    const pan = rnd(-0.6, 0.6);
    woodHit(k, t, 0.12, pan, 0.8);
    if (Math.random() < 0.5) woodHit(k, t + rnd(0.15, 0.3), 0.07, pan, 0.8);
  });
  // A sailor crosses the deck overhead.
  k.every(15000, 35000, () => {
    const t = k.ctx.currentTime + 0.02;
    for (let i = 0; i < 5; i++) woodHit(k, t + i * rnd(0.45, 0.55), 0.06 + i * 0.01, -0.6 + i * 0.3, 1.2);
  }, 9000);
  // The bell, once in a while.
  k.every(45000, 90000, () => sfx(sub(k, 0.12), "ship-bell"), 20000);
}

function harbor(k: LayerKit) {
  lapping(k);
  gulls(k);
  // Dockhands, a way off.
  const c = crowd(sub(far(k, 2400), 2.4), { voices: 7, room: 0.05, clinks: false, laughs: true });
  // A buoy bell out past the harbour mouth.
  k.every(7000, 16000, () => {
    const t = k.ctx.currentTime + 0.02;
    const f = rnd(560, 600);
    const at = [0, rnd(0.9, 1.4)];
    for (const x of at.slice(0, Math.random() < 0.5 ? 2 : 1)) bell(k, f, t + x, 0.035, [
      [1, 1, 2.6],
      [2.02, 0.35, 1.5],
      [2.93, 0.22, 0.9],
    ], { pan: -0.75, wet: 0.9 });
  }, 4000);
  // Crates and barrels being loaded.
  k.every(3500, 10000, () => {
    const t = k.ctx.currentTime + 0.02;
    const pan = rnd(-0.8, 0.8);
    woodHit(k, t, rnd(0.1, 0.2), pan, rnd(1, 1.4));
    if (Math.random() < 0.4) woodHit(k, t + rnd(0.3, 0.6), rnd(0.06, 0.12), pan, 1.2);
  }, 1500);
  // "Heave!" and "ho!" across the water.
  const voices = far(k, 2000);
  k.every(8000, 20000, () => {
    const t = k.ctx.currentTime + 0.02;
    shout(k, voices.out, t, { pitch: rnd(105, 145), vol: 0.035, pan: rnd(-0.8, 0.8), wet: 0.6 });
  }, 5000);
  // A rope creaking on a bollard, and now and then a chain paying out.
  k.every(4000, 9000, () => creak(k, k.ctx.currentTime + 0.02, { len: rnd(0.4, 0.9), rate: [40, 200], modes: ropeModes(), vol: rnd(0.08, 0.16), pan: rnd(-0.8, 0.8) }));
  k.every(25000, 60000, () => {
    const t = k.ctx.currentTime + 0.02;
    for (let i = 0; i < 14; i++) tink(k, t + i * 0.06 * rnd(0.8, 1.2), rnd(0.008, 0.02), 0.6, rnd(1500, 3000));
  }, 12000);
  return c;
}

function kitchen(k: LayerKit) {
  // Fat spitting in a pan.
  const sizzle = noiseBed(k, "pink", "bandpass", 4500, 0.7, 0.012);
  const sl = lfo(k, sizzle.g.gain, 0.08, 0.006);
  k.onStop(() => (sizzle.stop(), sl.stop()));
  k.every(15, 90, () => noise(k, k.ctx.currentTime + 0.01, { vol: rnd(0.02, 0.09), decay: rnd(0.003, 0.01), filter: "highpass", freq: rnd(3000, 6000), pan: rnd(-0.6, -0.1) }), 10);
  // A pot bubbling on the hearth.
  k.every(70, 320, () => {
    const f = rnd(140, 420);
    tone(k, f, k.ctx.currentTime + 0.01, { vol: rnd(0.02, 0.05), attack: 0.003, decay: rnd(0.04, 0.09), to: f * rnd(1.3, 1.8), glide: 0.06, pan: 0.45 });
  }, 50);
  // Chopping on a board.
  k.every(3000, 8000, () => {
    const t = k.ctx.currentTime + 0.02;
    const n = Math.floor(rnd(4, 12));
    const gap = rnd(0.17, 0.26);
    const pan = rnd(-0.3, 0.3);
    for (let i = 0; i < n; i++) {
      const at = t + i * gap * rnd(0.9, 1.1);
      resonate(k, clickBuffer(k.ctx, 0.03, [[0, 1], [0.002, 0.5]], 0.002), at, [
        [rnd(330, 380), 6, 1.4],
        [rnd(850, 950), 7, 0.9],
        [rnd(1800, 2100), 6, 0.4],
      ], { vol: 0.3, pan, wet: 0.15, dry: 0.15, lowpass: 5000 });
    }
  }, 1500);
  // Pots and lids.
  k.every(4500, 11000, () => {
    const t = k.ctx.currentTime + 0.02;
    const f = rnd(500, 1100);
    const pan = rnd(-0.8, 0.8);
    bell(k, f, t, 0.035, [
      [1, 1, 0.4],
      [2.32, 0.6, 0.3],
      [3.87, 0.4, 0.2],
    ], { pan, wet: 0.3 });
    if (Math.random() < 0.4) bell(k, f * 1.4, t + rnd(0.1, 0.2), 0.025, [[1, 1, 0.3], [2.4, 0.5, 0.2]], { pan, wet: 0.3 });
  }, 2500);
  // Plates being stacked.
  k.every(6000, 14000, () => {
    const t = k.ctx.currentTime + 0.02;
    const pan = rnd(-0.8, 0.8);
    for (let i = 0; i < Math.floor(rnd(2, 5)); i++) tink(k, t + i * rnd(0.12, 0.22), rnd(0.02, 0.035), pan, rnd(2200, 3000));
  }, 4000);
  // The cook calling out.
  k.every(9000, 22000, () => shout(k, k.out, k.ctx.currentTime + 0.02, { pitch: rnd(110, 160), vol: 0.035, pan: rnd(-0.6, 0.6), wet: 0.35 }), 6000);
}

function banquet(k: LayerKit) {
  const c = crowd(sub(k, 2.2), { voices: 16, room: 0.6, clinks: true, laughs: true });
  // Knives and forks on plates, all round the long tables.
  k.every(250, 1100, () => {
    const t = k.ctx.currentTime + 0.01;
    if (Math.random() < 0.7) tink(k, t, rnd(0.006, 0.018), rnd(-0.9, 0.9), rnd(3800, 6500));
    else noise(k, t, { vol: rnd(0.006, 0.014), attack: 0.03, decay: 0.08, filter: "bandpass", freq: rnd(3000, 4500), q: 5, pan: rnd(-0.9, 0.9) });
  }, 100);
  // A chair scrapes back.
  k.every(12000, 30000, () => {
    const t = k.ctx.currentTime + 0.02;
    creak(k, t, { len: rnd(0.25, 0.45), rate: [60, 200], modes: [[rnd(250, 320), 6, 3], [rnd(700, 850), 8, 2]], vol: 0.08, pan: rnd(-0.8, 0.8), wet: 0.5 });
  }, 8000);
  return c;
}

function forge(k: LayerKit) {
  // The smith's rhythm: blows on the hot iron (dull), the hammer bouncing on the anvil (bright).
  k.every(2500, 6000, () => {
    const t = k.ctx.currentTime + 0.02;
    const n = Math.floor(rnd(3, 8));
    const beat = rnd(0.38, 0.5);
    const f = rnd(1150, 1250);
    for (let i = 0; i < n; i++) {
      const at = t + i * beat;
      // On the iron: a duller, heavier ring.
      anvil(k, at, 0.06, { ring: 0.35, f: f * 0.92, pan: 0.15 });
      // A light tap on the bare anvil between blows.
      if (Math.random() < 0.55) anvil(k, at + beat / 2, 0.025, { ring: 0.9, f, pan: 0.15 });
    }
  }, 1000);
  // The bellows breathing into the fire.
  k.every(3500, 7000, () => {
    const t = k.ctx.currentTime + 0.02;
    noise(k, t, { kind: "pink", vol: 0.1, attack: 0.5, decay: 0.7, filter: "lowpass", freq: 450, pan: -0.4 });
    noise(k, t + 0.2, { kind: "brown", vol: 0.12, attack: 0.4, decay: 1.2, filter: "lowpass", freq: 300, pan: -0.4 });
  }, 2000);
  // Now and then the work goes into the quench tub.
  k.every(25000, 55000, () => sfx(sub(k, 0.12), "quench"), 15000);
}

function temple(k: LayerKit) {
  // Stone and quiet.
  drone(k, [73.4, 110], 0.012, 260);
  const air = noiseBed(k, "pink", "lowpass", 500, 0.5, 0.025);
  k.onStop(air.stop);
  // Voices humming a slow chant, a chord at a time, mostly echo.
  const chords = [
    [50, 57, 62, 65],
    [48, 55, 60, 64],
    [46, 53, 58, 62],
    [45, 52, 57, 61],
    [50, 57, 62, 65],
    [53, 57, 60, 65],
    [48, 55, 60, 67],
    [50, 57, 62, 66],
  ];
  let ci = 0;
  const hum = () => {
    const t = k.ctx.currentTime + 0.05;
    const c = chords[ci++ % chords.length];
    const len = rnd(4.5, 6);
    c.forEach((m, i) => {
      const vowel = pick(["o", "u", "a"] as const);
      utter(k, k.out, t + i * rnd(0.05, 0.3), {
        pitch: midi(m),
        vol: 0.022,
        pan: -0.6 + i * 0.4,
        wet: 1.6,
        jitter: 0.012,
        formantScale: m > 60 ? 1.08 : 1,
        syllables: [{ vowel, len, from: 1, to: 1, onset: "h", breathy: 0.35 }],
      });
    });
  };
  hum();
  k.every(5500, 7000, hum);
  // A small bell, far up the nave.
  k.every(20000, 45000, () => bell(k, rnd(880, 940), k.ctx.currentTime + 0.02, 0.03, [
    [1, 1, 3],
    [2.4, 0.4, 1.8],
    [3.7, 0.2, 1.1],
  ], { pan: 0.5, wet: 1.2 }), 10000);
  // Slow steps on stone, echoing.
  k.every(18000, 40000, () => {
    const t = k.ctx.currentTime + 0.02;
    const pan = rnd(-0.8, 0.8);
    for (let i = 0; i < 5; i++) {
      noise(k, t + i * 0.7, { vol: 0.05, decay: 0.03, filter: "bandpass", freq: 1500, q: 1.5, pan, wet: 1 });
      noise(k, t + i * 0.7, { kind: "brown", vol: 0.06, decay: 0.05, filter: "lowpass", freq: 500, pan, wet: 0.8 });
    }
  }, 9000);
}

function city(k: LayerKit) {
  const c = crowd(sub(k, 2.6), { voices: 16, room: 0.03, clinks: false, laughs: true });
  // A cart on cobbles: the wheels rumble and rattle as it goes by.
  k.every(9000, 20000, () => {
    const t = k.ctx.currentTime + 0.02;
    const dir = Math.random() < 0.5 ? -1 : 1;
    const len = rnd(3, 4.5);
    noise(k, t, { kind: "brown", vol: 0.25, attack: len * 0.45, decay: len * 0.55, filter: "lowpass", freq: 280, pan: -0.8 * dir, panTo: 0.8 * dir });
    for (let x = 0; x < len; x += rnd(0.02, 0.06)) {
      const p = x / len;
      const env = Math.sin(Math.PI * p);
      noise(k, t + x, { vol: 0.05 * env, decay: 0.012, filter: "bandpass", freq: rnd(900, 2200), q: 2, pan: (-0.8 + 1.6 * p) * dir });
    }
    // And the horse pulling it: clip-clop.
    for (let i = 0; i < Math.floor(len / 0.26); i++) {
      const at = i * 0.26 + (i % 2) * 0.05;
      const p = at / len;
      const env = Math.sin(Math.PI * Math.min(1, p));
      noise(k, t + at, { vol: 0.1 * env, decay: 0.025, filter: "bandpass", freq: rnd(1000, 1500), q: 3, pan: (-0.8 + 1.6 * p) * dir });
      tone(k, rnd(450, 600), t + at, { vol: 0.03 * env, attack: 0.001, decay: 0.03, pan: (-0.8 + 1.6 * p) * dir });
    }
  }, 4000);
  // A street seller's sung call: "fresh fiiish!"
  k.every(9000, 20000, () => {
    const t = k.ctx.currentTime + 0.02;
    const woman = Math.random() < 0.4;
    const sung = (pick([
      [1, 1.335, 1.12],
      [1, 1.5, 1.335],
      [1.12, 1.335, 1],
    ]) as number[]);
    utter(k, k.out, t, {
      pitch: woman ? rnd(220, 280) : rnd(130, 170),
      vol: 0.04,
      pan: rnd(-0.8, 0.8),
      wet: 0.5,
      jitter: 0.015,
      syllables: [
        { vowel: pick(["e", "a"] as const), len: 0.22, from: sung[0], to: sung[0], onset: "s" },
        { vowel: pick(["i", "o", "a"] as const), len: rnd(0.5, 0.7), from: sung[1], to: sung[1] * 0.99 },
        { vowel: pick(["i", "u"] as const), len: 0.35, from: sung[2], to: sung[2] * 0.9, onset: Math.random() < 0.5 ? "s" : undefined },
      ],
      gap: 0.03,
    });
  }, 6000);
  // A church bell across the rooftops.
  k.every(30000, 70000, () => bell(k, 233, k.ctx.currentTime + 0.02, 0.05, [
    [0.5, 0.5, 4],
    [1, 1, 3],
    [1.19, 0.4, 2.2],
    [2, 0.25, 1.5],
  ], { pan: 0.7, wet: 1 }), 15000);
  return c;
}

function winter(k: LayerKit) {
  // A thin, cold wind, and the snow hissing as it blows.
  wind(k, 0.32, 900);
  const icy = noiseBed(k, "pink", "bandpass", 2600, 9, 0.025);
  const l1 = lfo(k, icy.f.frequency, 0.05, 500);
  const l2 = lfo(k, icy.g.gain, 0.08, 0.02);
  const snow = noiseBed(k, "pink", "highpass", 5000, 0.5, 0.004);
  k.onStop(() => (icy.stop(), l1.stop(), l2.stop(), snow.stop()));
  // Someone walks past, boots crunching in the snow.
  k.every(9000, 22000, () => {
    const t = k.ctx.currentTime + 0.02;
    const dir = Math.random() < 0.5 ? -1 : 1;
    const n = Math.floor(rnd(7, 12));
    for (let i = 0; i < n; i++) {
      const p = i / (n - 1);
      const env = 0.3 + 0.7 * Math.sin(Math.PI * p);
      const at = t + i * rnd(0.5, 0.58);
      const c = noise(k, at, { vol: 0.12 * env, attack: 0.02, decay: 0.16, filter: "bandpass", freq: rnd(1400, 2200), q: 0.9, pan: (-0.8 + 1.6 * p) * dir });
      rasp(k, c.gain.gain, rnd(60, 110), 0.06 * env, at, at + 0.2);
    }
  }, 4000);
  // Ice tinkling off the eaves.
  k.every(6000, 15000, () => {
    const t = k.ctx.currentTime + 0.02;
    for (let i = 0; i < Math.floor(rnd(2, 5)); i++) tone(k, rnd(3500, 6500), t + i * rnd(0.08, 0.2), { vol: rnd(0.006, 0.014), attack: 0.001, decay: rnd(0.1, 0.3), pan: rnd(-0.8, 0.8), wet: 0.6 });
  }, 3000);
  // A sleigh, a long way off.
  k.every(35000, 80000, () => {
    const t = k.ctx.currentTime + 0.02;
    for (let i = 0; i < 10; i++) jingle(k, t + i * 0.26, 0.008 + 0.006 * Math.sin((Math.PI * i) / 9), { pan: 0.7 - i * 0.12, wet: 0.6, n: 6 });
  }, 15000);
}

function darkWoods(k: LayerKit) {
  // Low wind high in the branches, and leaves moving.
  wind(k, 0.38, 340);
  const leaves = noiseBed(k, "pink", "bandpass", 1800, 0.6, 0.03);
  const l = lfo(k, leaves.g.gain, 0.07, 0.02);
  k.onStop(() => (leaves.stop(), l.stop()));
  drone(k, [49], 0.012, 120);
  // Big trees groaning.
  k.every(5000, 12000, () => {
    creak(k, k.ctx.currentTime + 0.02, { len: rnd(1.2, 2.6), rate: [8, rnd(40, 70)], modes: [[rnd(220, 300), 10, 7], [rnd(500, 650), 13, 4], [rnd(1100, 1300), 14, 1.5]], vol: rnd(0.15, 0.3), pan: rnd(-0.9, 0.9), wet: 0.6 });
  }, 2500);
  // Something snaps a twig out there.
  k.every(12000, 28000, () => sfx(sub(k, 0.08), "branch-snap"), 6000);
  // Ravens.
  const ravens = far(k, 3000);
  k.every(14000, 32000, () => {
    const t = k.ctx.currentTime + 0.02;
    const pan = rnd(-0.9, 0.9);
    const n = Math.floor(rnd(1, 4));
    for (let i = 0; i < n; i++) caw(k, ravens.out, t + i * rnd(0.5, 0.7), { vol: 0.035, pan, wet: 0.8 });
  }, 5000);
  k.every(30000, 60000, () => sfx(sub(k, 0.3), "owl"), 20000);
}

function marsh(k: LayerKit) {
  lapping(sub(k, 0.5));
  // Reeds and rushes moving in the air.
  const reeds = noiseBed(k, "pink", "bandpass", 3200, 0.8, 0.03);
  const rl = lfo(k, reeds.g.gain, 0.07, 0.02);
  k.onStop(() => (reeds.stop(), rl.stop()));
  crickets(k);
  // Frogs: each one has its own voice and croaks in short trains.
  for (let f = 0; f < 4; f++) {
    const base = f === 0 ? rnd(85, 110) : rnd(180, 320);
    const pan = rnd(-0.9, 0.9);
    const pulses = f === 0 ? 14 : 5;
    const rate = f === 0 ? 0.045 : rnd(0.022, 0.03);
    k.every(f === 0 ? 5000 : 1500, f === 0 ? 12000 : 5000, () => {
      const t = k.ctx.currentTime + 0.02;
      const croaks = f === 0 ? 1 : Math.floor(rnd(1, 4));
      for (let c = 0; c < croaks; c++) {
        const at = t + c * rnd(0.3, 0.45);
        for (let i = 0; i < pulses; i++) tone(k, base * (1 + i * 0.004), at + i * rate, {
          type: "sawtooth",
          vol: f === 0 ? 0.05 : 0.03,
          attack: 0.002,
          decay: rate * 0.8,
          filter: { type: "bandpass", freq: base * (f === 0 ? 3 : 2.5), q: 3 },
          pan,
          wet: 0.25,
        });
      }
    }, rnd(200, 3000));
  }
  // A water bird calling across the lake.
  k.every(25000, 55000, () => {
    const t = k.ctx.currentTime + 0.02;
    const f = rnd(560, 640);
    tone(k, f, t, { vol: 0.025, attack: 0.15, decay: 0.6, hold: 0.6, to: f * 1.5, glide: 0.5, vibrato: { rate: 6, depth: 8 }, pan: -0.7, wet: 1.2 });
    tone(k, f * 1.5, t + 1.5, { vol: 0.02, attack: 0.1, decay: 0.9, hold: 0.4, to: f * 1.33, glide: 1, vibrato: { rate: 6, depth: 10 }, pan: -0.7, wet: 1.2 });
  }, 9000);
  // A fish jumps.
  k.every(15000, 40000, () => splash(k, k.ctx.currentTime + 0.02, 0.06, { pan: rnd(-0.8, 0.8) }), 7000);
}

// ---------------------------------------------------------------------------
// More music: a winter festival, music for a feast, and a sea shanty.

const F_MAJOR = [5, 7, 9, 10, 0, 2, 4];
const D_DORIAN = [2, 4, 5, 7, 9, 11, 0];

/** A glockenspiel: bright and bell-like. */
function glock(k: Kit, f: number, t: number, vol: number) {
  bell(k, f, t, vol, [
    [1, 1, 0.9],
    [3, 0.22, 0.35],
    [6.2, 0.08, 0.15],
  ], { wet: 0.35 });
}

/** A harpsichord: a bright pluck with a second string an octave up. */
function harpsi(k: Kit, f: number, t: number, vol: number, pan = 0) {
  pluck(k, f, t, vol, { bright: 0.92, wet: 0.35, pan });
  pluck(k, f * 2, t + 0.004, vol * 0.35, { bright: 0.95, wet: 0.35, pan });
}

/** A concertina reed: two square waves a hair apart, through a soft filter. */
function reed(k: Kit, f: number, t: number, len: number, vol: number, pan = 0) {
  for (const det of [-7, 6]) tone(k, f, t, { type: "square", vol: vol / 2, attack: 0.03, decay: 0.08, hold: Math.max(0, len - 0.06), detune: det, filter: { type: "lowpass", freq: Math.min(4000, f * 4), q: 0.7 }, pan, wet: 0.25 });
}

const festival: LayerMaker = (k) => {
  // A Winterfest polka: 2/4, bells on the tune, oom-pah strings, sleigh bells on every beat.
  const step = 60 / 116 / 2;
  const A = [ch(67, "maj"), ch(67, "maj"), ch(62, "dom"), ch(62, "dom"), ch(62, "dom"), ch(62, "dom"), ch(67, "maj"), ch(67, "maj")];
  const B = [ch(60, "maj"), ch(60, "maj"), ch(67, "maj"), ch(67, "maj"), ch(62, "dom"), ch(62, "dom"), ch(67, "maj"), ch(67, "maj")];
  const rhythms = [[1, 1, 1, 1], [2, 1, 1], [1, 1, 2], [2, 2], [1, 1, 1, 1]];
  let tune: ReturnType<typeof compose> = [];
  const newTune = () => {
    const a = compose(G_MAJOR, A, 4, 67, 83, rhythms);
    const b = compose(G_MAJOR, B, 4, 69, 84, rhythms);
    a[7] = [{ note: 79, len: 2 }, { note: null, len: 2 }];
    b[7] = [{ note: 79, len: 2 }, { note: null, len: 2 }];
    tune = [...a, ...a, ...b, ...b];
  };
  const chords = [...A, ...A, ...B, ...B];
  k.steps(
    () => step,
    (i, t) => {
      const bar = Math.floor(i / 4) % 32;
      const pos = i % 4;
      if (i % (4 * 64) === 0 || !tune.length) newTune();
      const c = chords[bar];
      // Oom-pah.
      if (pos === 0) pluck(k, midi(c.root - 24), t, 0.42, { bright: 0.45, wet: 0.2 });
      if (pos === 2) pluck(k, midi(c.root - 17), t, 0.32, { bright: 0.45, wet: 0.2 });
      if (pos === 1 || pos === 3) strum(k, c, t, 0.1, 59, 0.01);
      // Sleigh bells and a soft drum.
      jingle(k, t, pos % 2 ? 0.012 : 0.02, { n: 5, pan: 0.4 });
      if (pos === 0) bodhran(k, t, 0.25);
      // The tune on bells, the fiddle joining for the B part.
      let p = 0;
      for (const n of tune[bar]) {
        if (p === pos && n.note !== null) {
          glock(k, midi(n.note + 12), t, 0.05);
          if (bar >= 16) fiddle(k, midi(n.note), t, n.len * step * 0.9, 0.035);
        }
        p += n.len;
      }
    },
  );
};

const courtly: LayerMaker = (k) => {
  // A stately dance for the high table: 3/4 in F, harpsichord, a recorder on the tune.
  const step = 60 / 84 / 2;
  const A = [ch(65, "maj"), ch(60, "maj"), ch(62, "min"), ch(58, "maj"), ch(65, "maj"), ch(55, "min"), ch(60, "dom"), ch(65, "maj")];
  const B = [ch(62, "min"), ch(57, "min"), ch(58, "maj"), ch(65, "maj"), ch(55, "min"), ch(60, "maj"), ch(60, "dom"), ch(65, "maj")];
  const rhythms = [[2, 2, 2], [3, 1, 2], [2, 1, 1, 2], [4, 2], [1, 1, 2, 2]];
  let tune: ReturnType<typeof compose> = [];
  const newTune = () => {
    const a = compose(F_MAJOR, A, 6, 69, 84, rhythms);
    const b = compose(F_MAJOR, B, 6, 69, 86, rhythms);
    a[7] = [{ note: 77, len: 6 }];
    b[7] = [{ note: 77, len: 6 }];
    tune = [...a, ...a, ...b, ...b];
  };
  const chords = [...A, ...A, ...B, ...B];
  k.steps(
    () => step,
    (i, t) => {
      const bar = Math.floor(i / 6) % 32;
      const pos = i % 6;
      if (i % (6 * 64) === 0 || !tune.length) newTune();
      const c = chords[bar];
      // Left hand: the bass, then the chord on two and three.
      if (pos === 0) harpsi(k, midi(c.root - 24), t, 0.22, -0.2);
      if (pos === 2 || pos === 4) c.notes.forEach((n, j) => harpsi(k, midi(c.root - 12 + n), t + j * 0.008, 0.07, -0.1));
      let p = 0;
      const second = Math.floor(bar / 8) % 2 === 1;
      for (const n of tune[bar]) {
        if (p === pos && n.note !== null) {
          if (second) tone(k, midi(n.note), t, { type: "triangle", vol: 0.045, attack: 0.03, decay: 0.12, hold: Math.max(0, n.len * step - 0.12), vibrato: { rate: 5, depth: 2 }, wet: 0.4, pan: 0.2 });
          else harpsi(k, midi(n.note), t, 0.14, 0.2);
        }
        p += n.len;
      }
    },
  );
};

const shanty: LayerMaker = (k) => {
  // A sailors' song in D dorian: concertina, stamping feet and claps.
  const step = 60 / 100 / 2;
  const A = [ch(62, "min"), ch(62, "min"), ch(60, "maj"), ch(60, "maj"), ch(62, "min"), ch(62, "min"), ch(57, "min"), ch(62, "min")];
  const B = [ch(65, "maj"), ch(60, "maj"), ch(62, "min"), ch(57, "min"), ch(65, "maj"), ch(60, "maj"), ch(57, "min"), ch(62, "min")];
  const rhythms = [[2, 2, 2, 2], [3, 1, 2, 2], [2, 1, 1, 4], [4, 2, 2], [1, 1, 2, 2, 2]];
  let tune: ReturnType<typeof compose> = [];
  const newTune = () => {
    const a = compose(D_DORIAN, A, 8, 62, 76, rhythms);
    const b = compose(D_DORIAN, B, 8, 65, 79, rhythms);
    a[7] = [{ note: 74, len: 6 }, { note: null, len: 2 }];
    b[7] = [{ note: 74, len: 6 }, { note: null, len: 2 }];
    tune = [...a, ...a, ...b, ...b];
  };
  const chords = [...A, ...A, ...B, ...B];
  k.steps(
    () => step,
    (i, t) => {
      const bar = Math.floor(i / 8) % 32;
      const pos = i % 8;
      if (i % (8 * 64) === 0 || !tune.length) newTune();
      const c = chords[bar];
      // Concertina: bass on one and three, the chord pumped on two and four.
      if (pos === 0) reed(k, midi(c.root - 24), t, step * 1.6, 0.06, -0.15);
      if (pos === 4) reed(k, midi(c.root - 17), t, step * 1.6, 0.05, -0.15);
      if (pos === 2 || pos === 6) c.notes.forEach((n) => reed(k, midi(c.root - 12 + n), t, step * 1.2, 0.025, -0.15));
      // Feet on the boards, hands on the off-beat.
      if (pos === 0 || pos === 4) woodHit(k, t, 0.28, 0, 1.15);
      if (pos === 2 || pos === 6) {
        for (let j = 0; j < 4; j++) noise(k, t + j * 0.006 + Math.random() * 0.01, { vol: 0.06, decay: 0.035, filter: "bandpass", freq: rnd(1000, 1600), q: 1.6, pan: rnd(-0.6, 0.6), wet: 0.3 });
      }
      // The tune: concertina, then a whistle over it the second time.
      let p = 0;
      const second = Math.floor(bar / 8) % 2 === 1;
      for (const n of tune[bar]) {
        if (p === pos && n.note !== null) {
          if (second) whistle(k, midi(n.note + 12), t, n.len * step * 0.9, 0.05);
          else reed(k, midi(n.note), t, n.len * step * 0.92, 0.07, 0.2);
        }
        p += n.len;
      }
    },
  );
};

/** A layer at its own loudness (measured like LAYER_TRIM in engine.ts: each one rendered and matched to the others). */
const level = (gain: number, make: LayerMaker): LayerMaker => (k) => make(sub(k, gain));

export const LAYER_MAKERS: Record<string, LayerMaker> = {
  "tavern-jig": tavernJig,
  "quiet-lute": quietLute,
  travel,
  battle,
  tension,
  wonder,
  sorrow,
  crowd: (k) => crowd(k, { voices: 12, room: 0.35, clinks: true, laughs: true }),
  fire: (k) => fire(k),
  rain: (k) => rain(k, 1),
  wind: (k) => wind(k),
  storm: (k) => {
    rain(k, 1.4);
    wind(k, 0.4, 500);
    k.every(9000, 24000, () => sfx(k, "thunder", { distant: Math.random() < 0.6 }), 3000);
  },
  forest: (k) => {
    const leaves = noiseBed(k, "pink", "bandpass", 2600, 0.5, 0.06);
    const l = lfo(k, leaves.g.gain, 0.09, 0.04);
    k.onStop(() => (leaves.stop(), l.stop()));
    birds(k, 900, 4500);
  },
  night: (k) => {
    crickets(k);
    wind(k, 0.12, 400);
    k.every(14000, 38000, () => sfx(k, "owl"), 6000);
  },
  sea: (k) => {
    waves(k);
    gulls(k);
  },
  river: (k) => {
    // Moving water: noise that swells and eases smoothly, not in steps.
    const bands = [
      [450, 0.8, 0.09],
      [1100, 1.1, 0.06],
      [2600, 1.3, 0.03],
    ].map(([f, q, lv]) => {
      const b = noiseBed(k, "pink", "bandpass", f, q, lv);
      const m = lfo(k, b.g.gain, rnd(0.11, 0.37), lv * 0.35);
      const w = rasp(k, b.g.gain, rnd(2, 4), lv * 0.3, k.ctx.currentTime);
      return () => (b.stop(), m.stop(), w.stop());
    });
    k.onStop(() => bands.forEach((x) => x()));
    // Bubbles: each one rings and rises in pitch as it shrinks. Lots of small
    // high ones, a few big low ones, in clumps.
    const bubble = (t: number) => {
      const big = Math.random() < 0.15;
      const f = big ? rnd(280, 650) : rnd(800, 2600);
      tone(k, f, t, { vol: (big ? 0.03 : rnd(0.006, 0.018)), attack: 0.001, decay: big ? rnd(0.04, 0.08) : rnd(0.015, 0.04), to: f * rnd(1.15, 1.5), glide: big ? 0.06 : 0.03, pan: rnd(-0.8, 0.8), wet: 0.15 });
    };
    k.every(25, 120, () => {
      const t = k.ctx.currentTime + 0.01;
      const n = Math.random() < 0.3 ? Math.floor(rnd(2, 5)) : 1;
      for (let i = 0; i < n; i++) bubble(t + i * rnd(0.01, 0.05));
    });
  },
  market: (k) => {
    const c = crowd(k, { voices: 14, room: 0.08, clinks: false, laughs: true });
    birds(k, 4000, 12000);
    // A smith at work somewhere.
    k.every(7000, 16000, () => {
      const t = k.ctx.currentTime + 0.02;
      const n = Math.floor(rnd(2, 5));
      for (let i = 0; i < n; i++) bell(k, 1250, t + i * 0.55, 0.05, [
        [1, 1, 0.6],
        [2.7, 0.5, 0.35],
        [5.2, 0.3, 0.2],
      ], { pan: 0.6, wet: 0.2 });
    });
    // Hooves and a cart.
    k.every(10000, 22000, () => {
      const t = k.ctx.currentTime + 0.02;
      for (let i = 0; i < 12; i++) {
        const at = t + i * 0.24 + (i % 2) * 0.05;
        noise(k, at, { vol: 0.1 * (1 - Math.abs(i - 6) / 8), decay: 0.03, filter: "bandpass", freq: rnd(900, 1400), q: 2, pan: -0.8 + i * 0.13 });
      }
    });
    return c;
  },
  cave: (k) => {
    const d = noiseBed(k, "brown", "lowpass", 150, 0.7, 0.3);
    k.onStop(d.stop);
    drone(k, [41.2], 0.04, 140);
    drips(k, 600, 3500);
  },
  crypt: (k) => {
    drone(k, [55, 58.3], 0.05, 220);
    wind(k, 0.15, 320);
    drips(k, 2500, 8000);
    // Chains, and something moaning far off.
    k.every(9000, 20000, () => {
      const t = k.ctx.currentTime + 0.02;
      for (let i = 0; i < 6; i++) bell(k, rnd(2500, 4200), t + i * rnd(0.05, 0.12), 0.03, [
        [1, 1, 0.12],
        [1.6, 0.5, 0.08],
      ], { pan: 0.5, wet: 0.6 });
    }, 4000);
    // Something moaning far off: a breathy "ooh", sliding down, mostly echo.
    k.every(14000, 30000, () => {
      const t = k.ctx.currentTime + 0.02;
      const far = k.ctx.createBiquadFilter();
      far.type = "lowpass";
      far.frequency.value = 1400;
      far.connect(k.out);
      utter({ ...k, out: far }, far, t, {
        pitch: rnd(130, 170),
        vol: 0.05,
        pan: rnd(-0.8, 0.8),
        wet: 1.4,
        jitter: 0.04,
        rough: { rate: 28, depth: 0.25 },
        syllables: [
          { vowel: "o", len: 1.1, from: 1, to: 1.06, onset: "h", breathy: 0.5 },
          { vowel: "u", len: 1.4, from: 1.04, to: 0.72, breathy: 0.6, amp: 0.8 },
        ],
        gap: 0,
      });
      setTimeout(() => far.disconnect(), 6000);
    }, 8000);
  },
  clock: (k) => {
    k.steps(
      () => 0.5,
      (i, t) => {
        noise(k, t, { vol: 0.18, decay: 0.008, filter: "bandpass", freq: i % 2 ? 2600 : 3200, q: 4, pan: 0.3 });
        tone(k, i % 2 ? 1100 : 1300, t, { vol: 0.04, attack: 0.001, decay: 0.03, pan: 0.3 });
      },
    );
  },
  // Places (and the music that goes with them).
  festival: level(0.94, festival),
  courtly: level(2.8, courtly),
  shanty: level(1.45, shanty),
  harbor: level(1.3, harbor),
  rigging: level(4, rigging),
  ship: level(2.2, hull),
  kitchen: level(6.2, kitchen),
  banquet: level(2.65, banquet),
  forge: level(2.6, forge),
  temple: level(2.45, temple),
  city: level(2.25, city),
  winter: level(0.97, winter),
  "dark-woods": level(0.93, darkWoods),
  marsh: level(2.6, marsh),
};
