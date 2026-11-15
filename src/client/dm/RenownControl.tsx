"use client";

// Changing the party's Renown by hand: one step up or down, or straight to a rank,
// awarding (or taking) Renown points, with an optional reason for the Chronicle
// and a choice to skip the TV moment. Also the progress bar and the history.

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { progressOf, ranksOf, renownOf } from "@/shared/renown";
import type { RenownChange } from "@/shared/types";
import { useDm } from "./context";

/** "Known in town: 4 / 8 points to Trusted" and a small bar. */
export function RenownProgress() {
  const { view } = useDm();
  const p = progressOf(view.state);
  const name = ranksOf(view.state)[p.rank].name;
  return (
    <div className="renown-progress">
      <div className="renown-progress-line">
        <b>{name}</b>: {p.next === null ? `${p.points} points, the top rank` : `${p.points} / ${p.next} points to ${p.nextName}`}
      </div>
      <div className="renown-bar" role="progressbar" aria-label="Renown points toward the next rank" aria-valuemin={p.floor} aria-valuemax={p.next ?? p.points} aria-valuenow={p.points}>
        <div className="renown-fill" style={{ width: `${Math.round(p.frac * 100)}%` }} />
      </div>
      {p.short ? (
        <p className="note renown-short">
          {p.short} {p.short === 1 ? "point" : "points"} short of {name} ({p.floor}). The rank stays until you lower it with −.
        </p>
      ) : null}
    </div>
  );
}

export function RenownControl({ onDone }: { onDone?: () => void }) {
  const { view, run } = useDm();
  const rank = renownOf(view.state);
  const ranks = ranksOf(view.state);
  const [reason, setReason] = useState("");
  const [tv, setTv] = useState(true);
  const [amount, setAmount] = useState("1");
  const n = /^[+\-−]?\d{1,2}$/.test(amount.trim()) ? Number(amount.trim().replace("−", "-")) : NaN;
  const okAmount = Number.isInteger(n) && n !== 0 && Math.abs(n) <= 50;

  const award = async () => {
    if (!okAmount) return;
    const why = reason.trim();
    const ok = await run({ type: "renown.points", amount: n, ...(why ? { reason: why } : {}), ...(tv ? {} : { tv: false }) }, n > 0 ? `+${n} Renown.` : `${n} Renown.`);
    if (ok) {
      setReason("");
      setAmount("1");
      onDone?.();
    }
  };

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
      <RenownProgress />
      <div className="renown-step renown-award">
        <input className="fld amt" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} aria-label="Renown points to award (use - to take away)" placeholder="1" />
        <button type="button" className="btn primary" disabled={!okAmount} onClick={() => void award()}>
          {okAmount && n < 0 ? `Take away ${-n} ${n === -1 ? "point" : "points"}` : `Award ${okAmount ? n : ""} ${n === 1 ? "point" : "points"}`.replace("  ", " ")}
        </button>
      </div>
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
        <input className="fld" value={reason} maxLength={200} placeholder="e.g. Saved Winterfest from the pudding" onChange={(e) => setReason(e.target.value)} />
      </label>
      <label className="check">
        <input type="checkbox" checked={tv} onChange={(e) => setTv(e.target.checked)} /> Play the Renown moment on the TV when it goes up
      </label>
    </div>
  );
}

const SOURCE: Record<RenownChange["source"], string> = { job: "Job", award: "Award", set: "Set by hand" };

/** Every change to the Renown points, newest first, like the Bank ledger. */
export function RenownHistory() {
  const { view } = useDm();
  const log = view.state.renownLog ?? [];
  const ranks = ranksOf(view.state);
  const rows = useMemo(() => [...log].reverse(), [log]);
  return (
    <details className="renown-history">
      <summary>Renown history ({log.length})</summary>
      {!rows.length ? <p className="note">Nothing yet. Finished jobs and your awards show up here.</p> : null}
      {rows.length ? (
        <table className="renown-history-table">
          <thead>
            <tr>
              <th>Chapter</th>
              <th>From</th>
              <th className="num">Points</th>
              <th>Reason</th>
              <th className="num">Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => (
              <tr key={e.id}>
                <td>{e.chapter !== undefined ? e.chapter : <span className="note">before play</span>}</td>
                <td>
                  {SOURCE[e.source]}
                  {e.label ? `: ${e.label}` : ""}
                </td>
                <td className={`num ${e.amount < 0 ? "neg" : "pos"}`}>{e.amount > 0 ? `+${e.amount}` : e.amount < 0 ? `−${-e.amount}` : "0"}</td>
                <td>
                  {e.reason}
                  {e.rankTo !== e.rankFrom ? <span className="note">{e.reason ? " · " : ""}now {ranks[e.rankTo]?.name}</span> : null}
                </td>
                <td className="num">{e.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </details>
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
