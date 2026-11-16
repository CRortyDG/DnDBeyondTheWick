"use client";

import { useEffect, useRef, useState } from "react";
import type { RollEntry } from "@/shared/dice";
import { describeResult } from "@/shared/dice";
import { DicePicker, RollLine, useDicePicks } from "../ui/DicePicker";
import { InspirationIcon as DiceIcon } from "../ui/icons";
import { useDm } from "./context";
import { RevealPicker } from "./RevealPicker";
import { useTablet } from "./tablet";
import "../ui/dice.css";

const TAG: Record<RollEntry["to"], string> = { tv: "on TV", dm: "to you", secret: "secret" };

/** The header button (and the D key) that opens the tray, on the console, the fight screen and run-game mode. */
export function DiceButton({ small }: { small?: boolean }) {
  const { view, diceOpen, toggleDice, diceSeen, diceGone } = useDm();
  // Players' rolls the DM hasn't looked at yet.
  const unseen = (view.state.rolls ?? []).filter((r) => r.by && r.n > diceSeen && !diceGone.includes(r.n)).length;
  return (
    <button
      type="button"
      className={`btn${small ? " small" : ""}${diceOpen ? " on" : ""}`}
      aria-expanded={diceOpen}
      onClick={toggleDice}
      title="Roll dice on the TV, or secretly (D)"
      aria-label={unseen ? `Dice: ${unseen} new ${unseen === 1 ? "roll" : "rolls"} from players` : undefined}
    >
      <DiceIcon /> Dice
      {unseen ? <span className="badge">{unseen}</span> : null}
    </button>
  );
}

/**
 * A roll is up on the TV: a small bar for a few seconds with Clear (or Shift+D),
 * so the DM can take it off the TV at once. The tray has the same button for as long as it's there.
 */
export function TvDiceBar() {
  const { view, run } = useDm();
  const roll = view.state.diceRoll;
  const [fresh, setFresh] = useState<number | null>(null);
  const seen = useRef(roll?.n);
  useEffect(() => {
    if (!roll || roll.n === seen.current) return;
    seen.current = roll.n;
    setFresh(roll.n);
    const t = setTimeout(() => setFresh(null), 9000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roll?.n]);
  if (!roll || fresh !== roll.n) return null;
  return (
    <div className="dt-tvbar" role="status">
      <span>
        On the TV: {roll.name ? `${roll.name} rolled ` : ""}
        <b>{roll.total}</b>
      </span>
      <button type="button" className="btn small" onClick={() => run({ type: "dice.clearTv" })} title="Take the dice off the TV now (Shift+D)">
        Clear TV
      </button>
    </div>
  );
}

/**
 * A player rolled "for the DM only": a card that stays until the DM dismisses it
 * (or opens the dice tray), so it can't be missed the way a toast can.
 */
export function PlayerRollCards() {
  const { view, diceOpen, diceSeen, seeDice, diceGone: gone, dismissRoll } = useDm();
  if (diceOpen) return null;
  const waiting = (view.state.rolls ?? []).filter((r) => r.by && r.to === "dm" && r.n > diceSeen && !gone.includes(r.n)).reverse();
  if (!waiting.length) return null;
  const shown = waiting.slice(0, 3);
  return (
    <div className="dt-cards" role="region" aria-label="Rolls for you">
      {shown.map((r) => (
        <div key={r.n} className="dt-card" role="status">
          <div className="dt-card-head">
            <b>{r.name}</b> rolled, just for you
          </div>
          <div className="dt-card-body">
            <span className="dt-card-total">{r.total}</span>
            <span>
              {describeResult(r)}
              <span className="dt-rolls">
                {" "}
                ({r.groups.flatMap((g) => g.rolls).join(", ")}
                {r.plus ? `, ${r.plus > 0 ? "+" : "−"}${Math.abs(r.plus)}` : ""})
              </span>
            </span>
          </div>
          <button type="button" className="btn small" onClick={() => dismissRoll(r.n)}>
            Got it
          </button>
        </div>
      ))}
      {waiting.length > shown.length ? <p className="note dt-cards-more">{waiting.length - shown.length} more in Dice</p> : null}
      {waiting.length > 1 ? (
        <button type="button" className="btn small dt-cards-all" onClick={() => seeDice(waiting[0].n)}>
          Dismiss all
        </button>
      ) : null}
    </div>
  );
}

/**
 * The DM's dice: tap a die to add one, then roll on the TV for the room to see,
 * or secretly (only the DM sees it). Floats over the console, the fight screen and
 * run-game mode alike. The log below holds every roll, the DM's and the players'
 * (from their phones), and Clear empties it.
 */
export function DiceTray() {
  const { view, run, toast, diceOpen: open, toggleDice, seeDice } = useDm();
  const onTv = !!view.state.diceRoll;
  const clearTv = () => void run({ type: "dice.clearTv" });
  const setOpen = (v: boolean) => v !== open && toggleDice();
  const picks = useDicePicks(toast);
  const [busy, setBusy] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const log = [...(view.state.rolls ?? [])].reverse();

  // A player rolled on the TV: a toast (the TV shows it too). "For the DM only" rolls get a card instead.
  const newest = view.state.rolls?.at(-1);
  const seen = useRef(newest?.n);
  useEffect(() => {
    if (!newest || newest.n === seen.current) return;
    seen.current = newest.n;
    if (newest.by && newest.to === "tv" && !open) toast(`${newest.name} rolled ${newest.total} (${describeResult(newest)}) on the TV.`);
  }, [newest, toast, open]);
  // With the tray open, everything in the log counts as seen.
  useEffect(() => {
    if (open && newest) seeDice(newest.n);
  }, [open, newest, seeDice]);

  const roll = async (secret: boolean) => {
    if (!picks.total || busy) return;
    setBusy(true);
    await run({ type: "dice.roll", dice: picks.ask, plus: picks.plus, ...(secret ? { secret: true } : {}) });
    setBusy(false);
  };

  useEffect(() => {
    if (open) panel.current?.querySelector<HTMLButtonElement>(".dt-add")?.focus();
  }, [open]);

  // D opens and closes the tray anywhere in the DM view (but not while typing); Shift+D clears the TV.
  const clearRef = useRef(clearTv);
  clearRef.current = clearTv;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key !== "d" && e.key !== "D") return;
      e.preventDefault();
      if (e.shiftKey) clearRef.current();
      else toggleDice();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleDice]);

  const tablet = useTablet();
  if (!open) return null;

  return (
    <>
    {/* In tablet mode the tray is a tall side panel; tapping outside closes it. */}
    {tablet ? <div className="dt-scrim" role="presentation" onClick={() => setOpen(false)} /> : null}
    <div
      ref={panel}
      className="box dt-panel"
      role="dialog"
      aria-label="Dice"
      onKeyDown={(e) => {
        // Keep the fight screen's and run-game's keys (Space, digits, Esc) out of the tray.
        e.stopPropagation();
        if ((e.key === "d" || e.key === "D") && e.shiftKey) clearTv();
        else if (e.key === "Escape" || e.key === "d" || e.key === "D") setOpen(false);
      }}
    >
      <div className="dt-head">
        <h2>Dice</h2>
        <span className="spacer" />
        <button type="button" className="btn small" onClick={picks.reset} disabled={!picks.total && !picks.plus}>
          Clear dice
        </button>
        <button type="button" className="btn small" onClick={() => setOpen(false)} aria-label="Close the dice">
          ×
        </button>
      </div>

      <DicePicker picks={picks} />

      <div className="dt-actions">
        <button type="button" className="btn primary" onClick={() => roll(false)} disabled={!picks.total || busy}>
          Roll on the TV
        </button>
        <button type="button" className="btn" onClick={() => roll(true)} disabled={!picks.total || busy} title="Only you see it: nothing goes to the TV or phones">
          Roll secretly
        </button>
        <button type="button" className="btn" onClick={clearTv} disabled={!onTv} title="Take the dice off the TV now (Shift+D)">
          Clear TV
        </button>
      </div>

      {log.length ? (
        <div className="dt-history">
          <div className="dt-history-head">
            <span className="note">Rolls, yours and the players&rsquo;</span>
            <span className="spacer" />
            {log[0] ? <RevealPicker total={log[0].total} /> : null}
            <button type="button" className="btn small" onClick={() => run({ type: "dice.clearLog" })}>
              Clear history
            </button>
          </div>
          <ul className="dt-log" aria-label="Recent rolls" aria-live="polite">
            {log.map((r) => (
              <RollLine key={r.n} r={r} who={r.by ? r.name : undefined} tag={r.for === "initiative" ? `${TAG[r.to]} · initiative` : TAG[r.to]} secret={r.to !== "tv"} />
            ))}
          </ul>
        </div>
      ) : null}
    </div>
    </>
  );
}
