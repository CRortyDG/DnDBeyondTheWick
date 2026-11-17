"use client";

// The DM's soundboard. Everything plays on the TV (the TV's browser makes the
// sound); this panel only says what to play. Mixes crossfade every layer at
// once; each layer has its own volume; one-shots fire straight away.

import { useEffect, useRef, useState } from "react";
import { FADE_DEFAULT, FADES, LAYER_DEFAULT, LAYERS, MIXES, SFX, SFX_GROUPS, VOLUME_DEFAULT, type LayerId, type SfxId } from "@/shared/sound";
import { SpeakerIcon, SpeakerOffIcon } from "../ui/icons";
import { SoundEngine } from "../sound/engine";
import { useDm } from "./context";
import { useTablet } from "./tablet";
import "./soundboard.css";

/** The header button, on the console, the fight screen and run-game mode. A dot shows while layers play. */
export function SoundButton({ small }: { small?: boolean }) {
  const { view, soundOpen, toggleSound } = useDm();
  const snd = view.state.sound;
  const playing = Object.keys(snd?.layers ?? {}).length;
  return (
    <button
      type="button"
      className={`btn${small ? " small" : ""}${soundOpen ? " on" : ""}`}
      aria-expanded={soundOpen}
      onClick={toggleSound}
      title="The soundboard: music, ambience and sound effects on the TV"
      aria-label={playing ? `Sound: ${playing} ${playing === 1 ? "layer" : "layers"} playing` : "Sound"}
    >
      {snd?.muted ? <SpeakerOffIcon /> : <SpeakerIcon />} Sound
      {playing && !snd?.muted ? <span className="sb-live" aria-hidden="true" /> : null}
    </button>
  );
}

export function Soundboard() {
  const { view, run, soundOpen: open, toggleSound } = useDm();
  const snd = view.state.sound;
  const layers = snd?.layers ?? {};
  const [fade, setFade] = useState<number>(FADE_DEFAULT);
  const [tab, setTab] = useState<"mix" | "layers" | "fx">("mix");
  const [hear, setHear] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const tablet = useTablet();

  // "Hear it here too": a copy of the TV's sound on this device, for prep with headphones.
  const local = useRef<SoundEngine | null>(null);
  useEffect(() => {
    if (!hear) return;
    const e = (local.current ??= SoundEngine.create());
    void e?.unlock();
    return () => {
      e?.setMix({}, 0.5);
    };
  }, [hear]);
  useEffect(() => {
    if (!hear) return;
    local.current?.setMaster(snd?.volume ?? VOLUME_DEFAULT, !!snd?.muted);
    local.current?.setMix(layers, snd?.fade ?? FADE_DEFAULT);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hear, JSON.stringify(layers), snd?.volume, snd?.muted]);
  useEffect(() => () => local.current?.dispose(), []);

  const cue = (id: SfxId) => {
    void run({ type: "sound.cue", id });
    if (hear) local.current?.play(id);
  };
  const setLayer = (id: LayerId, volume: number) => void run({ type: "sound.layer", id, volume, fade });
  const playMix = (id: string) => {
    const m = MIXES.find((x) => x.id === id);
    if (m) void run({ type: "sound.mix", layers: m.layers, fade, mix: m.id });
  };
  const stopAll = () => void run({ type: "sound.mix", layers: {}, fade });

  if (!open) return null;
  const volume = snd?.volume ?? VOLUME_DEFAULT;
  const playingCount = Object.keys(layers).length;

  return (
    <>
      {tablet ? <div className="dt-scrim" role="presentation" onClick={toggleSound} /> : null}
      <div
        ref={panel}
        className="box dt-panel sb-panel"
        role="dialog"
        aria-label="Soundboard"
        onKeyDown={(e) => {
          // Keep the fight screen's and run-game's keys out of the panel.
          e.stopPropagation();
          if (e.key === "Escape") toggleSound();
        }}
      >
        <div className="dt-head">
          <h2>Sound</h2>
          <span className="spacer" />
          <button type="button" className="btn small" onClick={stopAll} disabled={!playingCount} title="Fade every layer out">
            Stop all
          </button>
          <button type="button" className="btn small" onClick={toggleSound} aria-label="Close the soundboard">
            ×
          </button>
        </div>

        <div className="sb-master">
          <button
            type="button"
            className={`btn small icon-only${snd?.muted ? " on" : ""}`}
            aria-pressed={!!snd?.muted}
            onClick={() => void run({ type: "sound.set", muted: !snd?.muted })}
            title={snd?.muted ? "Unmute the TV" : "Mute the TV"}
            aria-label={snd?.muted ? "Unmute" : "Mute"}
          >
            {snd?.muted ? <SpeakerOffIcon size={18} /> : <SpeakerIcon size={18} />}
          </button>
          <Slider label="TV volume" value={volume} onCommit={(v) => void run({ type: "sound.set", volume: v })} />
        </div>

        <div className="sb-row">
          <label className="sb-check">
            <input type="checkbox" checked={!snd?.autoOff} onChange={(e) => void run({ type: "sound.set", auto: e.target.checked })} />
            Moments make sounds
          </label>
          <span className="spacer" />
          <span className="sb-fade">
            <span className="note">Fade</span>
            <div className="seg" role="group" aria-label="Crossfade">
              {FADES.map((f) => (
                <button key={f} type="button" className={`btn small${fade === f ? " on" : ""}`} aria-pressed={fade === f} onClick={() => setFade(f)}>
                  {f}s
                </button>
              ))}
            </div>
          </span>
        </div>

        <div className="seg sb-tabs" role="tablist" aria-label="Soundboard">
          {(
            [
              ["mix", "Mixes"],
              ["layers", `Layers${playingCount ? ` · ${playingCount}` : ""}`],
              ["fx", "Effects"],
            ] as const
          ).map(([id, label]) => (
            <button key={id} type="button" role="tab" aria-selected={tab === id} className={`btn small${tab === id ? " on" : ""}`} onClick={() => setTab(id)}>
              {label}
            </button>
          ))}
        </div>

        {tab === "mix" ? (
          <div className="sb-grid" role="group" aria-label="Mixes">
            {MIXES.map((m) => (
              <button key={m.id} type="button" className={`btn sb-pad${snd?.mix === m.id ? " on" : ""}`} aria-pressed={snd?.mix === m.id} onClick={() => playMix(m.id)} title={describeMix(m.layers)}>
                {m.label}
              </button>
            ))}
          </div>
        ) : null}

        {tab === "layers" ? (
          <div className="sb-layers">
            {(["music", "ambience"] as const).map((g) => (
              <section key={g} aria-label={g === "music" ? "Music" : "Ambience"}>
                <h3 className="sb-h">{g === "music" ? "Music" : "Ambience"}</h3>
                {LAYERS.filter((l) => l.group === g).map((l) => {
                  const v = layers[l.id] ?? 0;
                  return (
                    <div key={l.id} className={`sb-layer${v ? " on" : ""}`}>
                      <button type="button" className={`btn small sb-layer-name${v ? " on" : ""}`} aria-pressed={!!v} onClick={() => setLayer(l.id, v ? 0 : LAYER_DEFAULT)}>
                        {l.label}
                      </button>
                      <Slider label={`${l.label} volume`} value={v} onCommit={(nv) => setLayer(l.id, nv)} />
                    </div>
                  );
                })}
              </section>
            ))}
          </div>
        ) : null}

        {tab === "fx" ? (
          <div className="sb-fx">
            {SFX_GROUPS.map((g) => (
              <section key={g.id} aria-label={g.label}>
                <h3 className="sb-h">{g.label}</h3>
                <div className="sb-grid">
                  {SFX.filter((x) => x.group === g.id).map((x) => (
                    <button key={x.id} type="button" className="btn small sb-pad" onClick={() => cue(x.id)}>
                      {x.label}
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : null}

        <div className="sb-foot">
          <label className="sb-check">
            <input type="checkbox" checked={hear} onChange={(e) => setHear(e.target.checked)} />
            Hear it on this device too
          </label>
          <p className="note">
            Sound plays from the TV. If the TV stays quiet, click once anywhere on it: browsers wait for a click before a page can make sound. Run sheets can play these too, with lines like{" "}
            <code>sound: busy tavern</code> or <code>sfx: war horn</code>.
          </p>
        </div>
      </div>
    </>
  );
}

function describeMix(m: Record<string, number | undefined>) {
  return Object.keys(m)
    .map((id) => LAYERS.find((l) => l.id === id)?.label ?? id)
    .join(" + ");
}

/** A volume slider that sends once the hand lets go (and after a pause while dragging). */
function Slider({ label, value, onCommit }: { label: string; value: number; onCommit: (v: number) => void }) {
  const [draft, setDraft] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const commit = useRef(onCommit);
  commit.current = onCommit;
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);
  // Once the server has it, show the server's value again.
  useEffect(() => setDraft(null), [value]);
  const shown = draft ?? value;
  const send = (v: number) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => commit.current(v), 250);
  };
  return (
    <input
      type="range"
      className="sb-slider"
      min={0}
      max={100}
      step={1}
      aria-label={label}
      value={Math.round(shown * 100)}
      style={{ ["--v" as string]: `${Math.round(shown * 100)}%` }}
      onChange={(e) => {
        const v = Number(e.target.value) / 100;
        setDraft(v);
        send(v);
      }}
    />
  );
}
