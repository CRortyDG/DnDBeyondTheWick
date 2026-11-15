"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ArrivalLook } from "@/shared/arrival";
import type { IntroClip, IntroSlide } from "@/shared/types";

type Step = { kind: "clip"; clip: IntroClip } | { kind: "slide"; slide: IntroSlide };

/**
 * A DM's own intro: their video or GIF, then their slides, then the seat page.
 * Anything that won't load is skipped rather than left on a black screen.
 */
export function CustomIntro({ look, onDone }: { look: ArrivalLook; onDone: () => void }) {
  const steps: Step[] = [...(look.clip ? [{ kind: "clip" as const, clip: look.clip }] : []), ...(look.slides ?? []).map((slide) => ({ kind: "slide" as const, slide }))];
  const [i, setI] = useState(0);
  const step = steps[i];

  const next = useCallback(() => {
    if (i + 1 < steps.length) setI(i + 1);
    else onDone();
  }, [i, steps.length, onDone]);
  const back = useCallback(() => setI((n) => Math.max(0, n - 1)), []);

  useEffect(() => {
    if (!step) onDone();
  }, [step, onDone]);

  // Tap anywhere or swipe left: next. Swipe right: back. (A playing video only moves on by itself or with Skip.)
  const down = useRef<{ x: number; y: number } | null>(null);
  const tappable = step?.kind === "slide" || step?.clip.kind === "gif";
  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button, a")) return;
    down.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const d = down.current;
    down.current = null;
    if (!d || !tappable) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) next();
      else back();
    } else if (Math.abs(dx) < 12 && Math.abs(dy) < 12) next();
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!tappable) return;
      if (e.key === "ArrowRight" || e.key === " " || e.key === "Enter") next();
      else if (e.key === "ArrowLeft") back();
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, back, tappable]);

  // Skip shows after a moment, so a first tap doesn't land on it by accident.
  const [skippable, setSkippable] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setSkippable(true), 3000);
    return () => clearTimeout(t);
  }, []);

  if (!step) return <div className="intro" />;

  return (
    <div className={`intro custom-intro${tappable ? "" : " no-tap"}`} onPointerDown={onPointerDown} onPointerUp={onPointerUp} role="main" aria-label="The intro">
      {step.kind === "clip" ? (
        step.clip.kind === "gif" ? (
          <Gif key={i} clip={step.clip} onFail={next} />
        ) : (
          <Video key={i} clip={step.clip} onEnd={next} />
        )
      ) : (
        <Slide key={i} slide={step.slide} />
      )}

      {steps.length > 1 ? (
        <div className="progress" aria-hidden="true">
          <div style={{ transform: `scaleX(${(i + 1) / steps.length})` }} />
        </div>
      ) : null}
      <div className="top-buttons custom-top">
        {skippable ? (
          <button type="button" className="skip" onClick={onDone}>
            Skip
          </button>
        ) : null}
      </div>
      {tappable ? <TapHint last={i === steps.length - 1} /> : null}
    </div>
  );
}

function TapHint({ last }: { last: boolean }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setOn(true), 1800);
    return () => clearTimeout(t);
  }, []);
  return on ? <div className="hint">{last ? "Tap to take your seat" : "Tap to continue"}</div> : null;
}

/** Full-screen video. It starts on a tap, so phones let it play with sound. */
function Video({ clip, onEnd }: { clip: IntroClip; onEnd: () => void }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);
  const [failed, setFailed] = useState(false);
  const [muted, setMuted] = useState(false);

  const start = async () => {
    const v = ref.current;
    if (!v) return;
    setStarted(true);
    try {
      v.muted = false;
      await v.play();
    } catch {
      // Some browsers still won't play sound: play silently rather than not at all.
      try {
        v.muted = true;
        setMuted(true);
        await v.play();
      } catch {
        setFailed(true);
      }
    }
  };

  // Nothing after a while: the phone can't play this file. Move on.
  useEffect(() => {
    if (!started) return;
    const v = ref.current;
    const t = setTimeout(() => v && v.currentTime === 0 && v.paused && setFailed(true), 10000);
    return () => clearTimeout(t);
  }, [started]);
  useEffect(() => {
    if (!failed) return;
    const t = setTimeout(onEnd, 1500);
    return () => clearTimeout(t);
  }, [failed, onEnd]);

  return (
    <div className="custom-clip">
      <video ref={ref} src={clip.url} poster={clip.poster} playsInline preload="auto" onEnded={onEnd} onError={() => setFailed(true)} />
      {!started ? (
        <button type="button" className="custom-start" onClick={() => void start()}>
          <span className="custom-play" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="34" height="34">
              <path d="M8 5v14l11-7z" fill="currentColor" />
            </svg>
          </span>
          Tap to start
        </button>
      ) : null}
      {started && muted ? (
        <button
          type="button"
          className="custom-unmute"
          onClick={() => {
            const v = ref.current;
            if (v) v.muted = false;
            setMuted(false);
          }}
        >
          Tap for sound
        </button>
      ) : null}
      {failed ? <p className="custom-note">This video won&rsquo;t play here. Moving on&hellip;</p> : null}
    </div>
  );
}

function Gif({ clip, onFail }: { clip: IntroClip; onFail: () => void }) {
  return (
    <div className="custom-clip">
      <img src={clip.url} alt="" onError={onFail} />
    </div>
  );
}

function Slide({ slide }: { slide: IntroSlide }) {
  const [broken, setBroken] = useState(false);
  const pic = slide.image && !broken;
  return (
    <div className={`custom-slide${pic ? "" : " text-only"}`}>
      {pic ? (
        <>
          <img className="custom-slide-blur" src={slide.image} alt="" aria-hidden="true" />
          <img className="custom-slide-img" src={slide.image} alt="" onError={() => setBroken(true)} />
        </>
      ) : null}
      {slide.text ? (
        <div className="narration custom-narration">
          {slide.text.split(/\n+/).map((l, k) => (
            <p key={k} className="line narr">
              {l}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}
