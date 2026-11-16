"use client";

import { useEffect, useMemo, useState } from "react";
import type { TvIntroView } from "@/shared/arrival";
import { introPos, stepLines, tvSteps, bare } from "../arrival/tvIntro";
import { useDm } from "./context";

/**
 * Under the TV preview while the Arrival intro plays there: where it's up to,
 * and Back / Pause / Next. It moves on by itself; these step it along by hand.
 */
export function IntroRemote({ intro }: { intro?: TvIntroView }) {
  const { run } = useDm();
  const steps = useMemo(() => (intro ? tvSteps(intro.look) : []), [intro]);
  const offset = useMemo(() => (intro ? intro.clock - Date.now() : 0), [intro]);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);
  if (!intro) return null;
  if (!steps.length) return <p className="note live-intro">This campaign has no intro yet. Set one up in the Arrival tab.</p>;

  const pos = introPos(steps, intro, now + offset);
  const st = steps[pos.i];
  const go = (step: number, paused: boolean) => run({ type: "arrival.introGo", step: Math.max(0, Math.min(steps.length - 1, step)), paused });
  const last = pos.i >= steps.length - 1;
  const waits = st.kind === "clip" && st.clip.kind === "video" && !st.clip.seconds;
  const what = st.kind === "clip" ? (st.clip.kind === "gif" ? "The GIF" : "The video") : bare(stepLines(st)[0] ?? "") || "A picture";

  return (
    <div className="live-intro" role="group" aria-label="The intro on the TV">
      <div className="live-intro-head">
        <strong>
          Intro {pos.i + 1} of {steps.length}
        </strong>
        <span className="note">{intro.paused ? "Paused" : pos.ended ? "Finished" : waits ? "Next when the video ends" : "Plays by itself"}</span>
      </div>
      <p className="live-intro-line">{what}</p>
      <div className="live-intro-btns">
        <button type="button" className="btn small" disabled={pos.i === 0} onClick={() => go(pos.i - 1, !!intro.paused)}>
          Back
        </button>
        <button type="button" className={`btn small${intro.paused ? " on" : ""}`} aria-pressed={!!intro.paused} onClick={() => go(pos.i, !intro.paused)}>
          {intro.paused ? "Resume" : "Pause"}
        </button>
        <button type="button" className="btn small" disabled={last} onClick={() => go(pos.i + 1, !!intro.paused)}>
          Next
        </button>
        <span className="spacer" />
        <button type="button" className="btn small" onClick={() => run({ type: "arrival.showIntro" })}>
          From the top
        </button>
        <button type="button" className={`btn small${pos.ended ? " primary" : ""}`} onClick={() => run({ type: "arrival.showTable" }, "The Table is on the TV.")}>
          The Table <span className="key">T</span>
        </button>
      </div>
    </div>
  );
}
