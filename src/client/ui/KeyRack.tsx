"use client";

import { useRef } from "react";
import type { KeyRackView, RackHook } from "@/shared/rooms";
import { Stage } from "./Stage";

/**
 * The inn's key rack on the TV: twelve hooks on a board, a key and a paper
 * tag on each room's hook with who has it, or "Free". The Good Room's key is
 * the crown on a velvet ribbon, marked "Earned". Staff keys hang bare, and a
 * missing key leaves an empty hook with no label.
 */
export function KeyRack({ rack: fresh }: { rack?: KeyRackView }) {
  // The TV only gets the rack while it's live: hold the last one as it fades out.
  const held = useRef(fresh);
  if (fresh) held.current = fresh;
  const inn = held.current?.inn ?? "";
  const rack = held.current?.hooks ?? Array.from({ length: 12 }, (_, i) => ({ hook: i + 1, empty: true, taken: [] }) as RackHook);
  return (
    <div className="scene-fill keyrack-scene">
      <Stage w={1920} h={1080}>
        <div className="keyrack-stage">
          <div className="keyrack-title">{inn}</div>
          <div className="keyrack-board">
            {rack.map((h) => (
              <Hook key={h.hook} h={h} inn={inn} />
            ))}
          </div>
        </div>
      </Stage>
    </div>
  );
}

function Hook({ h, inn }: { h: RackHook; inn: string }) {
  const good = h.type === "good";
  return (
    <div className={`kr-hook${h.empty ? " empty" : ""}${good ? " good" : ""}${h.type === "staff" ? " staff" : ""}${h.taken.length ? " taken" : ""}`}>
      <div className="kr-num">{h.hook}</div>
      <div className="kr-peg" aria-hidden="true" />
      {h.empty ? null : (
        <>
          {good ? <div className="kr-ribbon" aria-hidden="true" /> : null}
          <KeyGlyph crown={good} />
          {h.name ? (
            <div className="kr-tag">
              <div className="kr-tag-inn">{inn}</div>
              <div className="kr-tag-name">{h.name}</div>
              {good ? <div className="kr-tag-earned">Earned</div> : null}
              <div className={`kr-tag-who${h.taken.length ? "" : " free"}`}>{h.taken.length ? h.taken.join(" & ") : "Free"}</div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

/** An old brass key hanging from its bow: a ring, or a crown for the Good Room. */
function KeyGlyph({ crown }: { crown?: boolean }) {
  return (
    <svg className="kr-key" viewBox="0 0 60 170" aria-hidden="true">
      <defs>
        <linearGradient id="kr-brass" x1="0" x2="1">
          <stop offset="0" stopColor="#6b5323" />
          <stop offset="0.45" stopColor="#c9a95a" />
          <stop offset="1" stopColor="#5a4419" />
        </linearGradient>
      </defs>
      {crown ? (
        <g fill="url(#kr-brass)" stroke="#3c2c0e" strokeWidth="1.2">
          <path d="M10 38 L14 14 L22 26 L30 8 L38 26 L46 14 L50 38 Z" />
          <circle cx="30" cy="8" r="3.5" />
          <circle cx="14" cy="14" r="3" />
          <circle cx="46" cy="14" r="3" />
          <rect x="10" y="38" width="40" height="8" rx="2" />
        </g>
      ) : (
        <g fill="none" stroke="url(#kr-brass)" strokeWidth="7">
          <circle cx="30" cy="26" r="16" />
          <circle cx="30" cy="26" r="6" strokeWidth="3" />
        </g>
      )}
      <g fill="url(#kr-brass)" stroke="#3c2c0e" strokeWidth="1">
        <rect x="26" y={crown ? 46 : 42} width="8" height={crown ? 104 : 108} rx="3" />
        <rect x="22" y="58" width="16" height="5" rx="2" />
        <path d="M34 128 h14 v8 h-6 v6 h8 v8 h-16 z" />
      </g>
    </svg>
  );
}
