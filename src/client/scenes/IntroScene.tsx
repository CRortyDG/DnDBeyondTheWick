"use client";

// The Arrival intro on the TV. The phone intro is portrait and tapped through;
// here it is laid out for a landscape screen and plays by itself, with the DM
// stepping it on from the console. The boat's pictures sit in a tall frame
// with the words beside them; a DM's own slides fill the screen with their
// wide picture when they have one, and frame the phone picture when not.

import { useEffect, useMemo, useRef, useState } from "react";
import type { TvIntroView } from "@/shared/arrival";
import { SceneArt } from "../arrival/Scenes";
import { Snow } from "../arrival/Snow";
import { Soundscape } from "../arrival/sound";
import { introPos, shownChars, stepLines, tvSteps, bare, type TvStep } from "../arrival/tvIntro";
import { Stage } from "../ui/Stage";
import { useTvSound } from "../ui/tvSound";
import "./intro-scene.css";

const onTv = () => typeof document !== "undefined" && document.documentElement.dataset.view === "tv";

/** The server's "now", ticking. */
function useServerNow(clock: number, paused: boolean): number {
  const offset = useMemo(() => clock - Date.now(), [clock]);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), paused ? 500 : 40);
    return () => clearInterval(id);
  }, [paused]);
  return now + offset;
}

export function IntroScene({ intro }: { intro?: TvIntroView }) {
  const steps = useMemo(() => (intro ? tvSteps(intro.look) : []), [intro]);
  const now = useServerNow(intro?.clock ?? 0, !!intro?.paused);
  if (!intro || !steps.length) {
    return (
      <div className="scene-fill scene-black">
        <div className="scene-empty">This campaign has no Arrival intro yet. Set one up in the Arrival tab.</div>
      </div>
    );
  }
  const pos = introPos(steps, intro, now);
  const st = steps[pos.i];
  return (
    <div className="scene-fill tvi">
      <Stage w={1920} h={1080}>
        <StepView key={`${intro.n}:${pos.i}`} step={st} t={pos.t} />
        <div className="tvi-progress" aria-hidden="true">
          {steps.map((_, i) => (
            <span key={i} className={i < pos.i ? "done" : i === pos.i ? "now" : ""} />
          ))}
        </div>
        {intro.paused ? <div className="tvi-paused">Paused</div> : null}
      </Stage>
      <IntroSound step={st} n={`${intro.n}:${pos.i}`} />
    </div>
  );
}

function StepView({ step, t }: { step: TvStep; t: number }) {
  if (step.kind === "clip") return <Clip step={step} />;
  const lines = stepLines(step);
  if (step.kind === "panel") {
    const snowing = step.scene === "docking" || step.scene === "uphill" || (step.scene === "door" && step.shot === 0);
    const indoors = step.scene === "mags" || (step.scene === "door" && step.shot >= 1);
    return (
      <div className={`tvi-step tvi-book${indoors ? " indoors" : ""}`}>
        <div className="tvi-backdrop" aria-hidden="true">
          <SceneArt scene={step.scene} shot={step.shot} />
        </div>
        <div className="tvi-frame">
          <SceneArt scene={step.scene} shot={step.shot} />
          {snowing ? <Snow count={50} /> : null}
        </div>
        <Words lines={lines} t={t} />
      </div>
    );
  }
  const sl = step.slide;
  if (sl.wide) {
    return (
      <div className="tvi-step tvi-wide">
        <img className="tvi-wide-img" src={sl.wide} alt="" />
        {lines.length ? <Words lines={lines} t={t} /> : null}
      </div>
    );
  }
  if (sl.image) {
    return (
      <div className="tvi-step tvi-book">
        <img className="tvi-backdrop tvi-blur-img" src={sl.image} alt="" aria-hidden="true" />
        <div className="tvi-frame tvi-frame-img">
          <img src={sl.image} alt="" />
        </div>
        <Words lines={lines} t={t} />
      </div>
    );
  }
  return (
    <div className="tvi-step tvi-text">
      <Words lines={lines} t={t} />
    </div>
  );
}

/** The words, typed out at the room's pace (the rest laid out unseen, so nothing jumps). */
function Words({ lines, t }: { lines: string[]; t: number }) {
  const shown = shownChars(lines, t);
  return (
    <div className="tvi-words">
      <div aria-hidden="true">
        {lines.map((l, i) => {
          const narr = /^\*(.*)\*$/.test(l);
          const body = bare(l);
          return (
            <p key={i} className={`tvi-line ${narr ? "narr" : "speech"}`}>
              <span>{body.slice(0, shown[i])}</span>
              <span className="tvi-unrevealed">{body.slice(shown[i])}</span>
            </p>
          );
        })}
      </div>
      <p className="sr-only" aria-live="polite">
        {lines.map(bare).join(" ")}
      </p>
    </div>
  );
}

/** The DM's clip, filling the screen. With sound on the TV itself if its browser allows; the DM's preview stays quiet. */
function Clip({ step }: { step: Extract<TvStep, { kind: "clip" }> }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = !onTv();
    v.play().catch(() => {
      v.muted = true;
      v.play().catch(() => setFailed(true));
    });
  }, []);
  return (
    <div className="tvi-step tvi-clip">
      {step.clip.kind === "gif" ? <img src={step.clip.url} alt="" /> : <video ref={ref} src={step.clip.url} poster={step.clip.poster} playsInline preload="auto" onError={() => setFailed(true)} />}
      {failed ? <div className="scene-empty">This video won&rsquo;t play on this screen. MP4 plays everywhere.</div> : null}
    </div>
  );
}

/** The boat's sea, wind and hearth, when the TV's sound is on. Only on the TV itself. */
function IntroSound({ step, n }: { step: TvStep; n: string }) {
  const [on] = useTvSound();
  const sc = useRef<Soundscape | null>(null);
  const tv = onTv();
  useEffect(() => {
    if (!tv || !on) return;
    const s = (sc.current ??= new Soundscape());
    s.start();
    return () => s.stopAll();
  }, [tv, on]);
  useEffect(() => {
    const s = sc.current;
    if (!tv || !on || !s) return;
    s.play(step.kind === "panel" ? step.sound : null);
    if (step.kind === "panel" && step.cue) s.cue(step.cue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n, on, tv]);
  return null;
}
