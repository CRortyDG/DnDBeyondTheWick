"use client";

// Changing the party's Renown by hand: one step up or down, or straight to a rank,
// with an optional reason for the Chronicle and a choice to skip the TV moment.

import { useEffect, useRef, useState, useLayoutEffect } from "react";
import { ranksOf, renownOf } from "@/shared/renown";
import { useDm } from "./context";

export function RenownControl({ onDone }: { onDone?: () => void }) {
  const { view, run } = useDm();
  const rank = renownOf(view.state);
  const ranks = ranksOf(view.state);
  const [reason, setReason] = useState("");
  const [tv, setTv] = useState(true);

  const go = async (to: number) => {
    if (to === rank || to < 0 || to >= ranks.length) return;
    const why = reason.trim();
    const ok = await run({ type: "renown.set", rank: to, ...(why ? { reason: why } : {}), ...(tv ? {} : { tv: false }) }, `The party is now ${ranks[to].name}.`);
    if (ok) {
      setReason("");
      onDone?.();
    }
  };

  return (
    <div className="renown-ctl">
      <div className="renown-step">
        <button type="button" className="btn" disabled={rank <= 0} onClick={() => go(rank - 1)} aria-label="Lower Renown one rank" title={rank > 0 ? `Lower to ${ranks[rank - 1].name}` : undefined}>
          −
        </button>
        <select className="fld" aria-label="Set Renown" value={rank} onChange={(e) => go(Number(e.target.value))}>
          {ranks.map((r, i) => (
            <option key={i} value={i}>
              {i + 1}. {r.name}
            </option>
          ))}
        </select>
        <button type="button" className="btn primary" disabled={rank >= ranks.length - 1} onClick={() => go(rank + 1)} aria-label="Raise Renown one rank" title={rank < ranks.length - 1 ? `Raise to ${ranks[rank + 1].name}` : undefined}>
          +
        </button>
      </div>
      <label className="renown-reason">
        Reason (optional, goes in the Chronicle)
        <input className="fld" value={reason} maxLength={200} placeholder="e.g. Saved the harbour from the fire" onChange={(e) => setReason(e.target.value)} />
      </label>
      <label className="check">
        <input type="checkbox" checked={tv} onChange={(e) => setTv(e.target.checked)} /> Play the Renown moment on the TV when it goes up
      </label>
    </div>
  );
}

/** The party's rank in the DM's top bar; click to change it from any page. */
export function RenownChip() {
  const { view } = useDm();
  const rank = renownOf(view.state);
  const name = ranksOf(view.state)[rank].name;
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const pop = useRef<HTMLDivElement>(null);
  const [shift, setShift] = useState(0);
  // The pop-up hangs from the chip's right edge; on a narrow window that can push it off the left. Slide it back in.
  useLayoutEffect(() => {
    if (!open || !pop.current) return setShift(0);
    const place = () => {
      const el = pop.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setShift((cur) => {
        const left = r.left - cur;
        const right = r.right - cur;
        if (left < 8) return 8 - left;
        if (right > window.innerWidth - 8) return window.innerWidth - 8 - right;
        return 0;
      });
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return (
    <div className="renown-chip-wrap" ref={box}>
      <button type="button" className={`btn renown-chip${open ? " on" : ""}`} aria-expanded={open} onClick={() => setOpen((o) => !o)} title="Party Renown: click to change it">
        <span aria-hidden="true">❦</span> <span className="renown-chip-name">{name}</span>
      </button>
      {open ? (
        <div className="renown-pop" role="dialog" aria-label="Party Renown" ref={pop} style={shift ? { transform: `translateX(${shift}px)` } : undefined}>
          <h4>Party Renown</h4>
          <RenownControl />
        </div>
      ) : null}
    </div>
  );
}
