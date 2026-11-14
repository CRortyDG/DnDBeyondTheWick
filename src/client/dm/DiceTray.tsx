"use client";

import { useEffect, useRef, useState } from "react";
import type { RollEntry } from "@/shared/dice";
import { describeResult } from "@/shared/dice";
import { DicePicker, RollLine, useDicePicks } from "../ui/DicePicker";
import { InspirationIcon as DiceIcon } from "../ui/icons";
import { useDm } from "./context";
import "../ui/dice.css";

const TAG: Record<RollEntry["to"], string> = { tv: "on TV", dm: "to you", secret: "secret" };

/** The header button (and the D key) that opens the tray, on the console, the fight screen and run-game mode. */
export function DiceButton({ small }: { small?: boolean }) {
  const { diceOpen, toggleDice } = useDm();
  return (
    <button type="button" className={`btn${small ? " small" : ""}${diceOpen ? " on" : ""}`} aria-expanded={diceOpen} onClick={toggleDice} title="Roll dice on the TV, or secretly (D)">
      <DiceIcon /> Dice
    </button>
  );
}

/**
 * The DM's dice: tap a die to add one, then roll on the TV for the room to see,
 * or secretly (only the DM sees it). Floats over the console, the fight screen and
 * run-game mode alike. The log below holds every roll, the DM's and the players'
 * (from their phones), and Clear empties it.
 */
export function DiceTray() {
  const { view, run, toast, diceOpen: open, toggleDice } = useDm();
  const setOpen = (v: boolean) => v !== open && toggleDice();
  const picks = useDicePicks(toast);
  const [busy, setBusy] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const log = [...(view.state.rolls ?? [])].reverse();

  // A player rolled from their phone: say so, even with the tray closed.
  const newest = view.state.rolls?.at(-1);
  const seen = useRef(newest?.n);
  useEffect(() => {
    if (!newest || newest.n === seen.current) return;
    seen.current = newest.n;
    if (newest.by) toast(`${newest.name} rolled ${newest.total} (${describeResult(newest)})${newest.to === "dm" ? ", just for you" : " on the TV"}.`);
  }, [newest, toast]);

  const roll = async (secret: boolean) => {
    if (!picks.total || busy) return;
    setBusy(true);
    await run({ type: "dice.roll", dice: picks.ask, plus: picks.plus, ...(secret ? { secret: true } : {}) });
    setBusy(false);
  };

  useEffect(() => {
    if (open) panel.current?.querySelector<HTMLButtonElement>(".dt-add")?.focus();
  }, [open]);

  // D opens and closes the tray anywhere in the DM view (but not while typing).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key !== "d" && e.key !== "D") return;
      e.preventDefault();
      toggleDice();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleDice]);

  if (!open) return null;

  return (
    <div
      ref={panel}
      className="box dt-panel"
      role="dialog"
      aria-label="Dice"
      onKeyDown={(e) => {
        // Keep the fight screen's and run-game's keys (Space, digits, Esc) out of the tray.
        e.stopPropagation();
        if (e.key === "Escape" || e.key === "d" || e.key === "D") setOpen(false);
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
      </div>

      {log.length ? (
        <div className="dt-history">
          <div className="dt-history-head">
            <span className="note">Rolls, yours and the players&rsquo;</span>
            <span className="spacer" />
            <button type="button" className="btn small" onClick={() => run({ type: "dice.clearLog" })}>
              Clear history
            </button>
          </div>
          <ul className="dt-log" aria-label="Recent rolls" aria-live="polite">
            {log.map((r) => (
              <RollLine key={r.n} r={r} who={r.by ? r.name : undefined} tag={TAG[r.to]} secret={r.to !== "tv"} />
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
