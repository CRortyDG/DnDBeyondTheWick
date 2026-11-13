"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fill, PANELS, type Panel } from "./content";
import { SceneArt } from "./Scenes";
import { Snow } from "./Snow";

export interface Pos {
  panel: number;
  step: number;
}

/** Panels in the intro, counting the seat page at the end. */
export const TOTAL_PANELS = PANELS.length + 1;

const CHAR_MS = 32;
const LINE_GAP_MS = 450;

/** "*narration*" or a spoken line. */
function Line({ text, shown }: { text: string; shown: number }) {
  const narr = /^\*(.*)\*$/.exec(text);
  const body = narr ? narr[1] : text;
  return (
    <p className={narr ? "line narr" : "line speech"}>
      <span>{body.slice(0, shown)}</span>
      {/* the rest is laid out invisibly so the text never jumps */}
      <span className="unrevealed">{body.slice(shown)}</span>
    </p>
  );
}

function lineBodies(panel: Panel, step: number, character?: string) {
  return (panel.steps[step]?.lines ?? []).map((l) => fill(l, character));
}

export function Intro({
  start,
  reduced,
  onPos,
  onDone,
  onCue,
  soundOn,
  onToggleSound,
}: {
  start: Pos;
  reduced: boolean;
  onPos: (p: Pos) => void;
  onDone: () => void;
  onCue: (cue: "door") => void;
  soundOn: boolean;
  onToggleSound: () => void;
}) {
  const [pos, setPos] = useState<Pos>(start);
  const panel = PANELS[pos.panel];
  const step = panel.steps[pos.step];
  const lines = lineBodies(panel, pos.step).map((l) => (/^\*(.*)\*$/.exec(l)?.[1] ?? l));
  const raw = lineBodies(panel, pos.step);
  const total = lines.reduce((n, l) => n + l.length, 0);

  // How much of this step's text is showing, in characters (all lines together).
  const [shown, setShown] = useState(0);
  const done = shown >= total;

  useEffect(() => {
    setShown(0);
    onPos(pos);
    if (step?.cue) onCue(step.cue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pos.panel, pos.step]);

  useEffect(() => {
    if (done) return;
    // Where does the next line start? Pause between lines.
    let acc = 0;
    let atLineStart = false;
    for (const l of lines) {
      if (shown === acc && acc > 0) atLineStart = true;
      acc += l.length;
    }
    if (reduced) {
      // Whole lines fade in, one after another.
      let end = 0;
      for (const l of lines) {
        end += l.length;
        if (end > shown) break;
      }
      const t = setTimeout(() => setShown(end), shown === 0 ? 350 : 700);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setShown((n) => n + 1), shown === 0 ? 500 : atLineStart ? LINE_GAP_MS : CHAR_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown, done, reduced, lines.join("\n")]);

  const next = useCallback(() => {
    if (!done) return setShown(total);
    if (pos.step + 1 < panel.steps.length) return setPos({ panel: pos.panel, step: pos.step + 1 });
    if (pos.panel + 1 < PANELS.length) return setPos({ panel: pos.panel + 1, step: 0 });
    onDone();
  }, [done, total, pos, panel, onDone]);

  const back = useCallback(() => {
    if (pos.step > 0) return setPos({ panel: pos.panel, step: pos.step - 1 });
    if (pos.panel > 0) {
      const prev = PANELS[pos.panel - 1];
      setPos({ panel: pos.panel - 1, step: prev.steps.length - 1 });
    }
  }, [pos]);

  // Tap anywhere or swipe left: next. Swipe right: back.
  const down = useRef<{ x: number; y: number } | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button, a")) return;
    down.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const d = down.current;
    down.current = null;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) next();
      else back();
    } else if (Math.abs(dx) < 12 && Math.abs(dy) < 12) next();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "Enter") next();
      else if (e.key === "ArrowLeft") back();
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, back]);

  // Progress: whole panels, plus how far through this one.
  const progress = (pos.panel + (pos.step + (done ? 1 : 0.5)) / panel.steps.length) / TOTAL_PANELS;
  const snowing = panel.scene === "docking" || panel.scene === "uphill" || (panel.scene === "door" && pos.step === 0);

  let used = 0;
  const lineShown = lines.map((l) => {
    const n = Math.max(0, Math.min(l.length, shown - used));
    used += l.length;
    return n;
  });

  const hint = done ? (panel.scene === "door" && pos.step === 0 ? "Tap to open" : pos.panel === 0 ? "Tap to continue" : null) : null;

  return (
    <div className="intro" onPointerDown={onPointerDown} onPointerUp={onPointerUp} role="main" aria-label="The intro: tap or swipe left to continue, swipe right to go back">
      <div key={pos.panel} className={`scene scene-${panel.scene}`}>
        <SceneArt scene={panel.scene} shot={step?.shot ?? 0} />
      </div>
      {snowing && !reduced ? <Snow /> : null}

      <div className="progress" aria-hidden="true">
        <div style={{ transform: `scaleX(${Math.min(1, progress)})` }} />
      </div>
      <div className="top-buttons">
        <button type="button" className="icon-btn" onClick={onToggleSound} aria-pressed={soundOn} aria-label={soundOn ? "Sound on. Tap to turn it off." : "Sound off. Tap to turn it on."}>
          <SoundIcon on={soundOn} />
        </button>
        {pos.panel > 0 ? (
          <button type="button" className="skip" onClick={onDone}>
            Skip
          </button>
        ) : null}
      </div>

      {lines.length ? (
        <div className="narration">
          <div aria-hidden="true">
            {raw.map((l, i) => (
              <Line key={`${pos.panel}.${pos.step}.${i}`} text={l} shown={lineShown[i]} />
            ))}
          </div>
          <p className="sr-only" aria-live="polite">
            {lines.join(" ")}
          </p>
        </div>
      ) : null}
      {hint ? <div className="hint">{hint}</div> : null}
    </div>
  );
}

export function SoundIcon({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 10v4h4l5 4V6L8 10H4z" fill="currentColor" />
      {on ? (
        <>
          <path d="M16 9a4 4 0 0 1 0 6" />
          <path d="M18.5 6.5a7.5 7.5 0 0 1 0 11" />
        </>
      ) : (
        <path d="M16 9l5 6M21 9l-5 6" />
      )}
    </svg>
  );
}
