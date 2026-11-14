"use client";

import { useEffect, useRef, useState } from "react";
import { useTvMoment } from "./useTvMoment";
import type { TvView } from "@/shared/projection";
import { kindInfo } from "@/shared/discovery";
import { Portrait } from "./Portrait";
import { chime, useTvSound } from "./tvSound";

type Moment = NonNullable<TvView["discovery"]>;

/**
 * The same reveal for everything in the world, so the table learns what it means:
 * a rumor (a silhouette and a hint), someone or something found (the silhouette
 * fills with colour while the name types out, with a chime), or one new fact.
 * Never on first load, so a reload doesn't replay it.
 */
export function DiscoveryMoment({ moment }: { moment: TvView["discovery"] }) {
  const [sound] = useTvSound();
  const soundRef = useRef(sound);
  soundRef.current = sound;
  const [shown, setShown] = useTvMoment(moment, moment?.n ?? null, (m) => (m.fact ? 10000 : 9000), {
    clearOnNull: true,
    onShow: (m) => soundRef.current && chime(m.reveal ? "reveal" : m.fact ? "fact" : "rumor"),
  });
  // Taken back (hidden again, or a fact locked again): off the TV at once.
  useEffect(() => {
    if (shown && !moment) setShown();
  }, [moment, shown]);
  if (!shown) return null;

  if (shown.fact) {
    return (
      <div className="disc-moment fact" role="status" key={shown.n}>
        <div className="disc-card">
          <Portrait art={shown.art} name={shown.name} kind={shown.kind} className="disc-face small" />
          <div className="disc-text">
            <div className="disc-kicker">New: about {shown.name}</div>
            <div className="disc-fact">{shown.fact}</div>
          </div>
        </div>
      </div>
    );
  }

  const rumored = shown.stage === "rumored";
  const kicker = rumored ? "A rumor" : shown.reveal ? `${kindInfo(shown.kind).found}` : kindInfo(shown.kind).label;
  return (
    <div className={`disc-moment${shown.reveal ? " reveal" : ""}${rumored ? " rumor" : ""}`} role="status" key={shown.n} aria-label={`${kicker}: ${shown.name}`}>
      <div className="disc-card">
        <div className="disc-face-wrap">
          <Portrait art={shown.art} name={shown.name} kind={shown.kind} silhouette={shown.silhouette} rumored={rumored} className="disc-face" />
        </div>
        <div className="disc-text">
          <div className="disc-kicker">{kicker}</div>
          <div className="disc-name" aria-hidden="true">
            {shown.reveal ? <TypeOut text={shown.name} /> : shown.name}
          </div>
          {!rumored && shown.title ? <div className="disc-title">{shown.title}</div> : null}
          {rumored && shown.hint ? <div className="disc-hint">{shown.hint}</div> : null}
        </div>
      </div>
    </div>
  );
}

/** Letters appear one by one, after the picture has started to fill in. */
function TypeOut({ text }: { text: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const reduce = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return setN(text.length);
    let i = 0;
    let timer: ReturnType<typeof setInterval> | undefined;
    const start = setTimeout(() => {
      timer = setInterval(() => {
        i += 1;
        setN(i);
        if (i >= text.length && timer) clearInterval(timer);
      }, 70);
    }, 900);
    return () => {
      clearTimeout(start);
      if (timer) clearInterval(timer);
    };
  }, [text]);
  return (
    <>
      {text.slice(0, n)}
      <span className="disc-ghost">{text.slice(n)}</span>
    </>
  );
}
