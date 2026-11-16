"use client";

// Changing the party's Renown by hand: one step up or down, or straight to a rank,
// awarding (or taking) Renown points, with an optional reason for the Chronicle
// and a choice to skip the TV moment. Also the progress bar and the history.

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { pointsOf, progressOf, rankForPoints, ranksOf, renownOf, thresholdsOf } from "@/shared/renown";
import type { GameState, RenownChange } from "@/shared/types";
import { characterPoints, partyName } from "@/shared/world";
import { useDm } from "./context";
import { Drawer } from "./Drawer";
import { MenuItem, RowMenu } from "./RowMenu";

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

const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : "0");

/** Every change to the Renown points, newest first, like the Bank ledger. Each line can be fixed or undone. */
export function RenownHistory() {
  const { view } = useDm();
  const log = view.state.renownLog ?? [];
  const ranks = ranksOf(view.state);
  const rows = useMemo(() => [...log].reverse(), [log]);
  const [open, setOpen] = useState<{ id: string; mode: "edit" | "undo" } | null>(null);
  const editing = open ? log.find((x) => x.id === open.id) : undefined;
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
              <th>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => (
              <tr key={e.id} className={open?.id === e.id ? "on" : undefined}>
                <td>{e.chapter !== undefined ? e.chapter : <span className="note">before play</span>}</td>
                <td>
                  {SOURCE[e.source]}
                  {e.label ? `: ${e.label}` : ""}
                  {e.partyId ? <span className="note"> · {partyName(view.state, e.partyId) ?? "a past party"}</span> : null}
                </td>
                <td className={`num ${e.amount < 0 ? "neg" : "pos"}`}>{signed(e.amount)}</td>
                <td>
                  {e.reason}
                  {e.rankTo !== e.rankFrom ? <span className="note">{e.reason ? " · " : ""}now {ranks[e.rankTo]?.name}</span> : null}
                  {e.edited ? <span className="note"> · edited</span> : null}
                </td>
                <td className="num">{e.total}</td>
                <td className="renown-history-menu">
                  <RowMenu label={`Renown ${signed(e.amount)}${e.reason ? `: ${e.reason}` : ""}`}>
                    <MenuItem onClick={() => setOpen({ id: e.id, mode: "edit" })}>{e.source === "set" ? "Edit reason" : "Edit"}</MenuItem>
                    <MenuItem danger onClick={() => setOpen({ id: e.id, mode: "undo" })}>
                      {e.source === "set" ? "Remove from history" : "Undo"}
                    </MenuItem>
                  </RowMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
      {editing && open ? <RenownChangeDrawer key={`${editing.id}-${open.mode}`} e={editing} mode={open.mode} onClose={() => setOpen(null)} /> : null}
    </details>
  );
}

/**
 * What putting delta points on change e's people would do to the rank: reach a new one,
 * or fall short of the one they hold (which only lowers it if the DM says so).
 */
function rankEffect(s: GameState, e: RenownChange, delta: number): { up: number | null; down: number | null; points: number } {
  const who = s.world && e.playerIds?.length ? s.players.filter((p) => e.playerIds!.includes(p.id)) : null;
  const people = who?.length ? who.map((p) => ({ rank: p.renown ?? renownOf(s), points: characterPoints(s, p) })) : [{ rank: renownOf(s), points: pointsOf(s) }];
  let up: number | null = null;
  let down: number | null = null;
  for (const p of people) {
    const reach = rankForPoints(s, Math.max(0, p.points + delta));
    if (reach > p.rank) up = Math.max(up ?? 0, reach);
    if (reach < p.rank) down = Math.min(down ?? 99, reach);
  }
  return { up, down, points: Math.max(0, people[0].points + delta) };
}

/** Fix a line's points and reason, or undo it, with the rank decision spelled out. */
function RenownChangeDrawer({ e, mode, onClose }: { e: RenownChange; mode: "edit" | "undo"; onClose: () => void }) {
  const { view, run } = useDm();
  const s = view.state;
  const ranks = ranksOf(s);
  const isSet = e.source === "set";
  const [amount, setAmount] = useState(String(e.amount));
  const [reason, setReason] = useState(e.reason);
  // An accident that also raised the rank: lowering it back is the likely fix.
  const [lower, setLower] = useState(e.rankTo > e.rankFrom);
  const [tv, setTv] = useState(true);
  const raw = amount.trim().replace("−", "-");
  const n = /^[+-]?\d{1,2}$/.test(raw) ? Number(raw) : NaN;
  const okAmount = isSet || (Number.isInteger(n) && Math.abs(n) <= 50 && (e.source === "job" ? n >= 0 : n !== 0));
  const delta = mode === "undo" ? (isSet ? 0 : -e.amount) : isSet || !okAmount ? 0 : n - e.amount;
  const fx = rankEffect(s, e, delta);
  const many = !!(s.world && e.playerIds && e.playerIds.length > 0);
  const changed = mode === "undo" || delta !== 0 || reason.trim() !== e.reason;
  const from = `${SOURCE[e.source]}${e.label ? `: ${e.label}` : ""}${e.chapter !== undefined ? ` · Chapter ${e.chapter}` : ""}`;

  const save = async () => {
    if (!okAmount || !changed) return;
    const lowerIt = fx.down !== null && lower;
    const ok =
      mode === "undo"
        ? await run({ type: "renown.undo", changeId: e.id, ...(lowerIt ? { lower: true } : {}) }, isSet ? "Removed from the history." : `Undone. That ${signed(e.amount)} is gone.`)
        : await run(
            { type: "renown.edit", changeId: e.id, ...(isSet ? {} : { amount: n }), reason: reason.trim(), ...(lowerIt ? { lower: true } : {}), ...(fx.up !== null && !tv ? { tv: false } : {}) },
            "Renown history fixed.",
          );
    if (ok) onClose();
  };

  return (
    <Drawer title={mode === "undo" ? (isSet ? "Remove from history" : "Undo Renown change") : "Edit Renown change"} subtitle={from} onClose={onClose} closeLabel="Cancel">
      <div className="box renown-fix">
        {mode === "edit" ? (
          <>
            {isSet ? (
              <p className="note">A rank you set by hand. Its points follow the rank, so only the reason changes here. To change the rank itself, use − and + above.</p>
            ) : (
              <label>
                Points {e.source === "job" ? "(0 or more)" : "(use - to take away)"}
                <input className="fld amt" inputMode="numeric" value={amount} onChange={(ev) => setAmount(ev.target.value)} aria-invalid={!okAmount} />
              </label>
            )}
            <label>
              Reason {e.source === "award" || isSet ? "(also fixed in the Chronicle)" : ""}
              <input className="fld" value={reason} maxLength={200} onChange={(ev) => setReason(ev.target.value)} />
            </label>
          </>
        ) : isSet ? (
          <p className="note">This only takes the line out of the history. The rank and points stay; change them with − and + above.</p>
        ) : (
          <p>
            Takes {signed(e.amount)} back off {many ? "everyone who got it" : "the party"} and removes the line{e.source === "award" ? " and its Chronicle entry" : ""}.
          </p>
        )}

        {delta !== 0 ? (
          <p className="note">
            {many ? `Their points move by ${signed(delta)}.` : `Points go from ${pointsOf(s)} to ${fx.points}.`} Later totals in the history move with it.
          </p>
        ) : null}

        {fx.down !== null ? (
          <div className="renown-fix-rank">
            <p>
              That's below what {many ? "their rank needs" : `${ranks[renownOf(s)].name} needs (${thresholdsOf(s)[renownOf(s)]})`}. Falling short never lowers the rank on its own.
            </p>
            <label className="check">
              <input type="checkbox" checked={lower} onChange={(ev) => setLower(ev.target.checked)} /> Also lower the rank to {ranks[fx.down].name}
            </label>
            {lower ? <p className="note">Quiet: no TV moment, and the rank-up's Chronicle line goes if this change caused it.</p> : null}
          </div>
        ) : null}

        {fx.up !== null ? (
          <div className="renown-fix-rank">
            <p>This reaches {ranks[fx.up].name}.</p>
            <label className="check">
              <input type="checkbox" checked={tv} onChange={(ev) => setTv(ev.target.checked)} /> Play the Renown moment on the TV
            </label>
          </div>
        ) : null}

        <div className="fx-add-row">
          <button className={`btn ${mode === "undo" ? "danger" : "primary"}`} type="button" disabled={!okAmount || !changed} onClick={() => void save()}>
            {mode === "undo" ? (isSet ? "Remove" : "Undo it") : "Save"}
          </button>
        </div>
      </div>
    </Drawer>
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
