"use client";

// The soundboard's looping layers: ambience beds and music, all generated as
// they play. The music is composed on the fly from a few rules (a key, a chord
// pattern, a rhythm), so it never repeats exactly and owes nothing to anyone.

import { bell, envGain, lfo, midi, noise, noiseBed, panTo, pick, pluck, rnd, tone, type Kit, type LayerKit, type LayerMaker } from "./engine";
import { SFX_MAKERS } from "./sfx";
import { laugh, makeVoice, phrase, rasp, shape, utter, type Voice } from "./voice";

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
};
