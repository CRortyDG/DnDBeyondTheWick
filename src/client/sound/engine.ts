"use client";

// The table's sound engine: one AudioContext on the TV, a master volume, three
// buses (music, ambience, effects), a shared reverb, and the looping layers and
// one-shots of the soundboard. Everything is synthesised here with Web Audio
// (oscillators, filtered noise, plucked strings), so there are no files to
// download, host or license.
//
// Browsers only let a page make sound after a tap or key press on it, so the
// engine starts suspended and unlock() (from a gesture) wakes it.

import { isMusic } from "@/shared/sound";
import { LAYER_MAKERS } from "./layers";
import { SFX_MAKERS, type SfxOpts } from "./sfx";

export type NoiseKind = "white" | "pink" | "brown";

/** What a layer or one-shot gets to make its sound with. */
export interface Kit {
  ctx: AudioContext;
  /** Where to connect the sound (the layer's own gain, or the effects bus). */
  out: AudioNode;
  /** The shared reverb's input: connect a little of anything that should sound like it's in a room. */
  wet: AudioNode;
  noise: (kind: NoiseKind) => AudioBuffer;
  /** A cached plucked-string sample (Karplus-Strong) for this pitch. */
  pluck: (freq: number, bright?: number) => AudioBuffer;
}

/** A running layer. level is the layer's volume, 0..1 (the crowd grows denser with it). */
export interface LayerInst {
  setLevel?: (v: number) => void;
  stop?: () => void;
}

/** Layers get timers that stop with them. */
export interface LayerKit extends Kit {
  level: () => number;
  /** Call fn every few ms (randomised between min and max) until the layer stops. */
  every: (minMs: number, maxMs: number, fn: () => void, firstMs?: number) => void;
  /** A step sequencer: fn(step, time) for each step, scheduled a little ahead on the audio clock. */
  steps: (stepSec: () => number, fn: (i: number, t: number) => void) => void;
  onStop: (fn: () => void) => void;
  alive: () => boolean;
}

export type LayerMaker = (k: LayerKit) => LayerInst | void;
export type SfxMaker = (k: Kit, t: number, o: SfxOpts) => void;

const BUS_GAIN = { music: 0.55, ambience: 0.7, sfx: 0.9 };

/** Loudness trims so every sound sits at about the same level (measured by rendering each one). */
const LAYER_TRIM: Record<string, number> = { crowd: 4.5, forest: 2.2, river: 3, market: 3.2, clock: 5, "quiet-lute": 2, travel: 1.6, wonder: 1.4, sorrow: 1.4, rain: 0.85, storm: 0.8 };
const SFX_TRIM: Record<string, number> = { "sword-clash": 3, swing: 8, page: 5, whoosh: 3, gasp: 5, cheer: 4.5, shield: 3, arcane: 2, teleport: 2, dice: 1.7, coins: 2, "sword-hit": 1.5, punch: 1.4 };

export class SoundEngine {
  readonly ctx: AudioContext;
  private master: GainNode;
  private buses: Record<"music" | "ambience" | "sfx", GainNode>;
  private wetIn: GainNode;
  private noises = new Map<NoiseKind, AudioBuffer>();
  private plucks = new Map<string, AudioBuffer>();
  private layers = new Map<string, { gain: GainNode; inst: LayerInst; level: number; kill?: ReturnType<typeof setTimeout>; stops: (() => void)[]; alive: boolean }>();
  private vol = 0.8;
  private muted = false;
  private duck = 1;
  private closed = false;

  static create(): SoundEngine | null {
    try {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      return AC ? new SoundEngine(new AC()) : null;
    } catch {
      return null;
    }
  }

  private comp: DynamicsCompressorNode;

  private constructor(ctx: AudioContext) {
    this.ctx = ctx;
    const comp = (this.comp = ctx.createDynamicsCompressor());
    comp.threshold.value = -14;
    comp.knee.value = 10;
    comp.ratio.value = 4;
    comp.attack.value = 0.005;
    comp.release.value = 0.25;
    comp.connect(ctx.destination);
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(comp);
    const bus = (v: number) => {
      const g = ctx.createGain();
      g.gain.value = v;
      g.connect(this.master);
      return g;
    };
    this.buses = { music: bus(BUS_GAIN.music), ambience: bus(BUS_GAIN.ambience), sfx: bus(BUS_GAIN.sfx) };
    // One reverb for everything: a stereo impulse of decaying noise.
    const rev = ctx.createConvolver();
    rev.buffer = impulse(ctx, 2.8, 2.6);
    const ret = ctx.createGain();
    ret.gain.value = 0.32;
    rev.connect(ret).connect(this.master);
    this.wetIn = ctx.createGain();
    this.wetIn.connect(rev);
    this.applyMaster(0);
  }

  /** Everything this engine plays, as a stream (for recording previews). */
  stream(): MediaStream {
    const d = this.ctx.createMediaStreamDestination();
    this.comp.connect(d);
    return d.stream;
  }

  get running() {
    return !this.closed && this.ctx.state === "running";
  }

  /** From a tap or key press: let the page make sound. */
  /**
   * Call it straight from the tap's handler, not later in an effect: iPhones
   * only let a page start sound inside the gesture itself.
   */
  unlock(): Promise<void> {
    if (this.closed) return Promise.resolve();
    playThroughSilentSwitch();
    // An iPhone wants a sound started inside the gesture: a blank one will do.
    try {
      const src = this.ctx.createBufferSource();
      src.buffer = this.ctx.createBuffer(1, 1, this.ctx.sampleRate);
      src.connect(this.ctx.destination);
      src.start(0);
    } catch {
      /* fine without */
    }
    return this.ctx.resume().catch(() => {});
  }

  setMaster(volume: number, muted: boolean) {
    this.vol = Math.max(0, Math.min(1, volume));
    this.muted = muted;
    this.applyMaster(0.3);
  }

  /** Turn everything down (a clip with its own sound is playing), or back up. */
  setDuck(v: number) {
    if (v === this.duck) return;
    this.duck = v;
    this.applyMaster(1.2);
  }

  private applyMaster(fade: number) {
    const v = this.muted ? 0 : this.vol * this.vol * this.duck;
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setValueAtTime(this.master.gain.value, t);
    if (fade <= 0) this.master.gain.setValueAtTime(v, t);
    else this.master.gain.linearRampToValueAtTime(v, t + fade);
  }

  /** Crossfade to exactly these layers (id -> volume 0..1) over fade seconds. */
  setMix(target: Record<string, number>, fade = 3) {
    if (this.closed) return;
    const t = this.ctx.currentTime;
    const f = Math.max(0.05, fade);
    for (const [id, level] of Object.entries(target)) {
      if (!(level > 0) || !LAYER_MAKERS[id]) continue;
      let l = this.layers.get(id);
      if (!l) l = this.startLayer(id);
      if (!l) continue;
      if (l.kill) {
        clearTimeout(l.kill);
        l.kill = undefined;
      }
      l.level = level;
      l.inst.setLevel?.(level);
      l.gain.gain.cancelScheduledValues(t);
      l.gain.gain.setValueAtTime(l.gain.gain.value, t);
      l.gain.gain.linearRampToValueAtTime(curve(level) * (LAYER_TRIM[id] ?? 1), t + f);
    }
    for (const [id, l] of this.layers) {
      if (target[id] && target[id] > 0) continue;
      if (l.kill) continue;
      l.gain.gain.cancelScheduledValues(t);
      l.gain.gain.setValueAtTime(l.gain.gain.value, t);
      l.gain.gain.linearRampToValueAtTime(0, t + f);
      l.kill = setTimeout(() => this.killLayer(id), f * 1000 + 300);
    }
  }

  /** The layers playing now, for tests and the DM's preview. */
  playing(): string[] {
    return [...this.layers].filter(([, l]) => !l.kill).map(([id]) => id);
  }

  private startLayer(id: string) {
    const make = LAYER_MAKERS[id];
    if (!make) return undefined;
    const ctx = this.ctx;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(isMusic(id) ? this.buses.music : this.buses.ambience);
    const entry = { gain, inst: {} as LayerInst, level: 0, stops: [] as (() => void)[], alive: true };
    const kit: LayerKit = {
      ...this.kit(gain),
      level: () => entry.level,
      alive: () => entry.alive,
      onStop: (fn) => entry.stops.push(fn),
      every: (min, max, fn, first) => {
        let h: ReturnType<typeof setTimeout>;
        const go = () => {
          if (!entry.alive) return;
          try {
            fn();
          } catch {}
          h = setTimeout(go, min + Math.random() * (max - min));
        };
        h = setTimeout(go, first ?? min + Math.random() * (max - min));
        entry.stops.push(() => clearTimeout(h));
      },
      steps: (stepSec, fn) => {
        let next = ctx.currentTime + 0.15;
        let i = 0;
        const tick = () => {
          if (!entry.alive) return;
          // A throttled timer (a hidden tab) fell behind: skip ahead rather than play a burst.
          if (next < ctx.currentTime - 0.25) next = ctx.currentTime + 0.05;
          while (next < ctx.currentTime + 0.6) {
            try {
              fn(i, next);
            } catch {}
            i++;
            next += stepSec();
          }
        };
        tick();
        const h = setInterval(tick, 120);
        entry.stops.push(() => clearInterval(h));
      },
    };
    try {
      entry.inst = make(kit) ?? entry.inst;
    } catch {
      gain.disconnect();
      return undefined;
    }
    this.layers.set(id, entry);
    return entry;
  }

  private killLayer(id: string) {
    const l = this.layers.get(id);
    if (!l) return;
    l.alive = false;
    this.layers.delete(id);
    for (const s of l.stops) {
      try {
        s();
      } catch {}
    }
    try {
      l.inst.stop?.();
    } catch {}
    setTimeout(() => l.gain.disconnect(), 3000);
  }

  /** Play a one-shot now (or delay seconds from now). */
  play(id: string, o: SfxOpts = {}) {
    if (this.closed) return;
    const make = SFX_MAKERS[id];
    if (!make) return;
    const out = this.ctx.createGain();
    out.gain.value = (o.vol ?? 1) * (SFX_TRIM[id] ?? 1);
    out.connect(this.buses.sfx);
    try {
      make(this.kit(out), this.ctx.currentTime + 0.02 + (o.delay ?? 0), o);
    } catch {}
    setTimeout(() => out.disconnect(), ((o.delay ?? 0) + 14) * 1000);
  }

  private kit(out: AudioNode): Kit {
    return { ctx: this.ctx, out, wet: this.wetIn, noise: (k) => this.noise(k), pluck: (f, b) => this.pluck(f, b) };
  }

  private noise(kind: NoiseKind): AudioBuffer {
    const have = this.noises.get(kind);
    if (have) return have;
    const ctx = this.ctx;
    const len = ctx.sampleRate * 4;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, brown = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (kind === "white") d[i] = w * 0.5;
      else if (kind === "pink") {
        b0 = 0.99765 * b0 + w * 0.099046;
        b1 = 0.963 * b1 + w * 0.2965164;
        b2 = 0.57 * b2 + w * 1.0526913;
        d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.12;
      } else {
        brown = (brown + 0.02 * w) / 1.02;
        d[i] = brown * 3.5;
      }
    }
    // Fade the loop point so it doesn't click.
    for (let i = 0; i < 256; i++) {
      const k = i / 256;
      d[i] *= k;
      d[len - 1 - i] *= k;
    }
    this.noises.set(kind, buf);
    return buf;
  }

  private pluck(freq: number, bright = 0.5): AudioBuffer {
    const key = `${Math.round(freq * 10)}:${bright}`;
    const have = this.plucks.get(key);
    if (have) return have;
    const ctx = this.ctx;
    const sr = ctx.sampleRate;
    const len = Math.floor(sr * 2.2);
    const buf = ctx.createBuffer(1, len, sr);
    const d = buf.getChannelData(0);
    const period = Math.max(2, Math.round(sr / freq));
    const ring = new Float32Array(period);
    for (let i = 0; i < period; i++) ring[i] = Math.random() * 2 - 1;
    // Soften the attack's noise a little (a finger, not a pick).
    for (let p = 0; p < 2; p++) for (let i = 1; i < period; i++) ring[i] = ring[i] * bright + ring[i - 1] * (1 - bright);
    const damp = 0.996 - Math.min(0.01, freq / 200000);
    let idx = 0;
    for (let i = 0; i < len; i++) {
      const next = (idx + 1) % period;
      const v = ring[idx];
      d[i] = v * 0.5;
      ring[idx] = (v + ring[next]) * 0.5 * damp;
      idx = next;
    }
    this.plucks.set(key, buf);
    if (this.plucks.size > 160) this.plucks.delete(this.plucks.keys().next().value!);
    return buf;
  }

  dispose() {
    if (this.closed) return;
    for (const id of [...this.layers.keys()]) this.killLayer(id);
    this.closed = true;
    void this.ctx.close().catch(() => {});
  }
}

/** A layer's slider is linear to the ear, more or less. */
const curve = (v: number) => Math.max(0, Math.min(1, v)) ** 1.6;

function impulse(ctx: AudioContext, sec: number, decay: number): AudioBuffer {
  const len = Math.floor(ctx.sampleRate * sec);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** decay;
  }
  return buf;
}

// ---------------------------------------------------------------------------
// Small building blocks shared by the layers and one-shots.

export const midi = (m: number) => 440 * 2 ** ((m - 69) / 12);
export const rnd = (a: number, b: number) => a + Math.random() * (b - a);
export const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(Math.random() * xs.length)];

/** A gain node with an attack/decay envelope, connected to dest. */
export function envGain(ctx: AudioContext, dest: AudioNode, t: number, peak: number, attack: number, decay: number, hold = 0): GainNode {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(peak, t + Math.max(0.002, attack));
  if (hold) g.gain.setValueAtTime(peak, t + attack + hold);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + hold + Math.max(0.01, decay));
  g.connect(dest);
  return g;
}

/** A panner (or the destination itself where there isn't one). */
export function panTo(ctx: AudioContext, dest: AudioNode, pan: number): AudioNode {
  if (!ctx.createStereoPanner) return dest;
  const p = ctx.createStereoPanner();
  p.pan.value = Math.max(-1, Math.min(1, pan));
  p.connect(dest);
  return p;
}

export interface ToneOpts {
  type?: OscillatorType;
  vol?: number;
  attack?: number;
  decay?: number;
  hold?: number;
  /** Glide to this frequency over the note. */
  to?: number;
  glide?: number;
  detune?: number;
  vibrato?: { rate: number; depth: number };
  filter?: { type: BiquadFilterType; freq: number; q?: number; to?: number; over?: number };
  wet?: number;
  pan?: number;
}

/** One oscillator note with an envelope. */
export function tone(k: Kit, freq: number, t: number, o: ToneOpts = {}) {
  const { ctx } = k;
  const osc = ctx.createOscillator();
  osc.type = o.type ?? "sine";
  osc.frequency.setValueAtTime(freq, t);
  if (o.detune) osc.detune.value = o.detune;
  const total = (o.attack ?? 0.01) + (o.hold ?? 0) + (o.decay ?? 0.4);
  if (o.to) osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.to), t + (o.glide ?? total));
  let vib: OscillatorNode | undefined;
  if (o.vibrato) {
    vib = ctx.createOscillator();
    vib.frequency.value = o.vibrato.rate;
    const vg = ctx.createGain();
    vg.gain.value = o.vibrato.depth;
    vib.connect(vg).connect(osc.frequency);
    vib.start(t);
    vib.stop(t + total + 0.1);
  }
  const dest: AudioNode = o.pan !== undefined ? panTo(ctx, k.out, o.pan) : k.out;
  const g = envGain(ctx, dest, t, o.vol ?? 0.2, o.attack ?? 0.01, o.decay ?? 0.4, o.hold ?? 0);
  if (o.wet) {
    const w = ctx.createGain();
    w.gain.value = o.wet;
    g.connect(w).connect(k.wet);
  }
  let head: AudioNode = g;
  if (o.filter) {
    const f = ctx.createBiquadFilter();
    f.type = o.filter.type;
    f.frequency.setValueAtTime(o.filter.freq, t);
    if (o.filter.q) f.Q.value = o.filter.q;
    if (o.filter.to) f.frequency.exponentialRampToValueAtTime(o.filter.to, t + (o.filter.over ?? total));
    f.connect(g);
    head = f;
  }
  osc.connect(head);
  osc.start(t);
  osc.stop(t + total + 0.05);
  return { osc, gain: g };
}

export interface NoiseOpts {
  kind?: NoiseKind;
  vol?: number;
  attack?: number;
  decay?: number;
  hold?: number;
  filter?: BiquadFilterType;
  freq?: number;
  q?: number;
  to?: number;
  over?: number;
  wet?: number;
  pan?: number;
  panTo?: number;
}

/** A burst of filtered noise with an envelope. */
export function noise(k: Kit, t: number, o: NoiseOpts = {}) {
  const { ctx } = k;
  const src = ctx.createBufferSource();
  src.buffer = k.noise(o.kind ?? "white");
  const total = (o.attack ?? 0.005) + (o.hold ?? 0) + (o.decay ?? 0.2);
  let dest: AudioNode = k.out;
  if (o.pan !== undefined && ctx.createStereoPanner) {
    const p = ctx.createStereoPanner();
    p.pan.setValueAtTime(o.pan, t);
    if (o.panTo !== undefined) p.pan.linearRampToValueAtTime(o.panTo, t + total);
    p.connect(k.out);
    dest = p;
  }
  const g = envGain(ctx, dest, t, o.vol ?? 0.3, o.attack ?? 0.005, o.decay ?? 0.2, o.hold ?? 0);
  if (o.wet) {
    const w = ctx.createGain();
    w.gain.value = o.wet;
    g.connect(w).connect(k.wet);
  }
  const f = ctx.createBiquadFilter();
  f.type = o.filter ?? "lowpass";
  f.frequency.setValueAtTime(o.freq ?? 8000, t);
  if (o.q) f.Q.value = o.q;
  if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t + (o.over ?? total));
  src.connect(f).connect(g);
  src.start(t, Math.random() * 3);
  src.stop(t + total + 0.05);
  return { src, gain: g, filter: f };
}

/** A plucked string (lute, harp) note. */
export function pluck(k: Kit, freq: number, t: number, vol = 0.3, o: { bright?: number; wet?: number; pan?: number; len?: number } = {}) {
  const { ctx } = k;
  const src = ctx.createBufferSource();
  src.buffer = k.pluck(freq, o.bright ?? 0.5);
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t);
  if (o.len) {
    g.gain.setValueAtTime(vol, t + o.len);
    g.gain.exponentialRampToValueAtTime(0.0001, t + o.len + 0.15);
  }
  const dest = o.pan !== undefined ? panTo(ctx, k.out, o.pan) : k.out;
  src.connect(g).connect(dest);
  if (o.wet) {
    const w = ctx.createGain();
    w.gain.value = o.wet;
    g.connect(w).connect(k.wet);
  }
  src.start(t);
  src.stop(t + (o.len ? o.len + 0.2 : 2.2));
}

/** A struck metal or bell: inharmonic partials, each decaying at its own rate. */
export function bell(k: Kit, freq: number, t: number, vol: number, partials: [number, number, number][], o: { wet?: number; pan?: number } = {}) {
  for (const [ratio, level, decay] of partials) tone(k, freq * ratio, t, { vol: vol * level, attack: 0.002, decay, wet: o.wet, pan: o.pan });
}

/** A continuous looping noise through a filter, for beds. Returns its gain and filter to modulate. */
export function noiseBed(k: Kit, kind: NoiseKind, type: BiquadFilterType, freq: number, q: number, level: number, dest: AudioNode = k.out) {
  const { ctx } = k;
  const src = ctx.createBufferSource();
  src.buffer = k.noise(kind);
  src.loop = true;
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  const g = ctx.createGain();
  g.gain.value = level;
  src.connect(f).connect(g).connect(dest);
  src.start(ctx.currentTime, Math.random() * 3);
  return { src, f, g, stop: () => src.stop() };
}

/** A slow wobble on a parameter. */
export function lfo(k: Kit, target: AudioParam, rate: number, depth: number, type: OscillatorType = "sine") {
  const o = k.ctx.createOscillator();
  o.type = type;
  o.frequency.value = rate;
  const g = k.ctx.createGain();
  g.gain.value = depth;
  o.connect(g).connect(target);
  o.start();
  return { stop: () => o.stop() };
}

/**
 * iPhones treat Web Audio as "ambient" sound by default, which the ring/silent
 * switch mutes, so a phone on silent hears nothing. Newer Safari (16.4+) lets a
 * page say it plays media; older ones only route Web Audio as media while an
 * <audio> element is playing, so we loop a silent one there.
 */
let silentEl: HTMLAudioElement | null = null;
export function playThroughSilentSwitch() {
  if (typeof navigator === "undefined") return;
  const session = (navigator as unknown as { audioSession?: { type: string } }).audioSession;
  if (session) {
    try {
      if (session.type !== "playback") session.type = "playback";
    } catch {
      /* ignore */
    }
    return;
  }
  if (!/iPad|iPhone|iPod/.test(navigator.userAgent) && !(navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent))) return;
  try {
    silentEl ??= Object.assign(document.createElement("audio"), { src: silentWav(), loop: true, preload: "auto" });
    silentEl.setAttribute("playsinline", "");
    silentEl.setAttribute("x-webkit-airplay", "deny");
    if (silentEl.paused) void silentEl.play().catch(() => {});
  } catch {
    /* ignore */
  }
}

/** A half-second of silence as a WAV data URL. */
function silentWav(): string {
  const rate = 8000;
  const n = rate / 2;
  const b = new DataView(new ArrayBuffer(44 + n));
  const str = (o: number, t: string) => [...t].forEach((c, i) => b.setUint8(o + i, c.charCodeAt(0)));
  str(0, "RIFF");
  b.setUint32(4, 36 + n, true);
  str(8, "WAVEfmt ");
  b.setUint32(16, 16, true);
  b.setUint16(20, 1, true);
  b.setUint16(22, 1, true);
  b.setUint32(24, rate, true);
  b.setUint32(28, rate, true);
  b.setUint16(32, 1, true);
  b.setUint16(34, 8, true);
  str(36, "data");
  b.setUint32(40, n, true);
  for (let i = 0; i < n; i++) b.setUint8(44 + i, 128);
  let bin = "";
  const u = new Uint8Array(b.buffer);
  for (let i = 0; i < u.length; i++) bin += String.fromCharCode(u[i]);
  return `data:audio/wav;base64,${btoa(bin)}`;
}
