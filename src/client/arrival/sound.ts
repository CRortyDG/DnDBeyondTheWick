"use client";

// The intro's sound, made in the browser with Web Audio so there are no files
// to download (or license). Off by default; the choice is remembered per device.
// Recorded files can replace any bed: see SOUND_FILES in content.ts.

import { SOUND_FILES, type SoundBed } from "./content";

const PREF = "arrival:sound";

export function soundPref(): boolean {
  try {
    return localStorage.getItem(PREF) === "on";
  } catch {
    return false;
  }
}

export function setSoundPref(on: boolean) {
  try {
    localStorage.setItem(PREF, on ? "on" : "off");
  } catch {}
}

type Bed = Exclude<SoundBed, null>;

interface Running {
  out: GainNode;
  stop: () => void;
}

export class Soundscape {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private bed: Bed | null = null;
  private running: Running | null = null;

  /** Must be called from a tap (browsers only allow sound after one). */
  start() {
    if (this.ctx) {
      void this.ctx.resume();
      return;
    }
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.7;
    this.master.connect(this.ctx.destination);
    const len = this.ctx.sampleRate * 2;
    this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    let brown = 0;
    for (let i = 0; i < len; i++) {
      // Brown-ish noise: softer than white, closer to water and wind.
      brown = (brown + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      d[i] = brown * 3.5;
    }
    const want = this.bed;
    this.bed = null;
    if (want) this.play(want);
  }

  stopAll() {
    this.fadeOut();
    this.bed = null;
    if (this.ctx) void this.ctx.suspend();
  }

  /** Cross-fade to a new bed (or silence). */
  play(bed: SoundBed) {
    if (bed === this.bed) return;
    this.bed = bed;
    if (!this.ctx || this.ctx.state === "closed") return;
    void this.ctx.resume();
    this.fadeOut();
    if (!bed) return;
    this.running = SOUND_FILES[bed] ? this.file(SOUND_FILES[bed]!, true) : this.synth(bed);
    this.running.out.gain.setTargetAtTime(1, this.ctx.currentTime, 0.8);
  }

  /** A one-off: the tavern door. */
  cue(name: "door") {
    if (!this.ctx || !this.master) return;
    if (SOUND_FILES[name]) {
      const r = this.file(SOUND_FILES[name]!, false);
      r.out.gain.value = 1;
      return;
    }
    const c = this.ctx;
    const t = c.currentTime;
    // A creaking hinge, then the thud of a heavy door.
    const o = c.createOscillator();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(180, t);
    o.frequency.linearRampToValueAtTime(120, t + 0.7);
    const bp = c.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 700;
    bp.Q.value = 8;
    const g = c.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.25, t + 0.1);
    g.gain.linearRampToValueAtTime(0, t + 0.8);
    o.connect(bp).connect(g).connect(this.master);
    o.start(t);
    o.stop(t + 0.9);
    const th = c.createOscillator();
    th.frequency.setValueAtTime(90, t + 0.75);
    th.frequency.exponentialRampToValueAtTime(40, t + 1.2);
    const tg = c.createGain();
    tg.gain.setValueAtTime(0, t + 0.74);
    tg.gain.linearRampToValueAtTime(0.6, t + 0.76);
    tg.gain.exponentialRampToValueAtTime(0.001, t + 1.3);
    th.connect(tg).connect(this.master);
    th.start(t + 0.7);
    th.stop(t + 1.4);
  }

  private fadeOut() {
    const r = this.running;
    this.running = null;
    if (!r || !this.ctx) return;
    r.out.gain.setTargetAtTime(0, this.ctx.currentTime, 0.4);
    setTimeout(r.stop, 2000);
  }

  private file(src: string, loop: boolean): Running {
    const c = this.ctx!;
    const el = new Audio(src);
    el.loop = loop;
    el.crossOrigin = "anonymous";
    const out = c.createGain();
    out.gain.value = 0;
    c.createMediaElementSource(el).connect(out).connect(this.master!);
    void el.play().catch(() => {});
    return { out, stop: () => (el.pause(), out.disconnect()) };
  }

  private noiseSource(): AudioBufferSourceNode {
    const src = this.ctx!.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    src.loopStart = Math.random();
    return src;
  }

  private lfo(target: AudioParam, rate: number, depth: number) {
    const c = this.ctx!;
    const o = c.createOscillator();
    o.frequency.value = rate;
    const g = c.createGain();
    g.gain.value = depth;
    o.connect(g).connect(target);
    o.start();
    return o;
  }

  private synth(bed: Bed): Running {
    const c = this.ctx!;
    const out = c.createGain();
    out.gain.value = 0;
    out.connect(this.master!);
    const stops: (() => void)[] = [];
    let alive = true;
    const later = (fn: () => void, ms: number) => setTimeout(() => alive && fn(), ms);

    const noiseThrough = (type: BiquadFilterType, freq: number, q: number, level: number) => {
      const src = this.noiseSource();
      const f = c.createBiquadFilter();
      f.type = type;
      f.frequency.value = freq;
      f.Q.value = q;
      const g = c.createGain();
      g.gain.value = level;
      src.connect(f).connect(g).connect(out);
      src.start();
      stops.push(() => src.stop());
      return { f, g };
    };

    if (bed === "ship") {
      // Waves: low noise swelling slowly. Creaks: a strained timber now and then.
      const w = noiseThrough("lowpass", 420, 0.7, 0.35);
      const l = this.lfo(w.g.gain, 0.11, 0.25);
      stops.push(() => l.stop());
      const creak = () => {
        const t = c.currentTime;
        const o = c.createOscillator();
        o.type = "sawtooth";
        o.frequency.setValueAtTime(70 + Math.random() * 40, t);
        o.frequency.linearRampToValueAtTime(110 + Math.random() * 50, t + 0.5);
        const bp = c.createBiquadFilter();
        bp.type = "bandpass";
        bp.frequency.value = 500 + Math.random() * 300;
        bp.Q.value = 12;
        const g = c.createGain();
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.12, t + 0.15);
        g.gain.linearRampToValueAtTime(0, t + 0.6);
        o.connect(bp).connect(g).connect(out);
        o.start(t);
        o.stop(t + 0.7);
        later(creak, 3500 + Math.random() * 5000);
      };
      later(creak, 1500);
    } else if (bed === "wind") {
      const w = noiseThrough("bandpass", 600, 1.2, 0.5);
      const l1 = this.lfo(w.f.frequency, 0.07, 260);
      const l2 = this.lfo(w.g.gain, 0.13, 0.3);
      stops.push(() => l1.stop(), () => l2.stop());
    } else {
      // The hearth: a low roar and random crackles.
      noiseThrough("lowpass", 260, 0.5, 0.25);
      const crackle = () => {
        const t = c.currentTime;
        const src = this.noiseSource();
        const hp = c.createBiquadFilter();
        hp.type = "highpass";
        hp.frequency.value = 1800 + Math.random() * 2000;
        const g = c.createGain();
        g.gain.setValueAtTime(0.25 + Math.random() * 0.35, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.02 + Math.random() * 0.04);
        src.connect(hp).connect(g).connect(out);
        src.start(t);
        src.stop(t + 0.08);
        later(crackle, 40 + Math.random() * (Math.random() < 0.2 ? 600 : 180));
      };
      crackle();
    }

    return {
      out,
      stop: () => {
        alive = false;
        stops.forEach((s) => {
          try {
            s();
          } catch {}
        });
        out.disconnect();
      },
    };
  }
}
