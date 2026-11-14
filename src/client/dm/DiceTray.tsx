"use client";

import { useEffect, useRef, useState } from "react";
import { DIE_SIDES, describeDice, describeResult, diceCount, MAX_DICE, MAX_OF_ONE, MAX_PLUS, rollPool, type DiceResult, type DieSides } from "@/shared/dice";
import { Die } from "../ui/Die";
import { InspirationIcon as DiceIcon } from "../ui/icons";
import { useDm } from "./context";
import "../ui/dice.css";

type Counts = Record<DieSides, number>;
const NONE: Counts = { 4: 0, 6: 0, 8: 0, 10: 0, 12: 0, 20: 0, 100: 0 };

interface Logged extends DiceResult {
  key: string;
  secret: boolean;
}

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
 * or secretly (rolled here, never sent anywhere). Floats over the console, the
 * fight screen and run-game mode alike; the picks stay so a repeat roll is one tap.
 */
export function DiceTray() {
  const { view, run, toast, diceOpen: open, toggleDice } = useDm();
  const setOpen = (v: boolean) => v !== open && toggleDice();
  const [counts, setCounts] = useState<Counts>(NONE);
  const [plus, setPlus] = useState(0);
  const [log, setLog] = useState<Logged[]>([]);
  const [busy, setBusy] = useState(false);
  const panel = useRef<HTMLDivElement>(null);

  const ask = DIE_SIDES.filter((d) => counts[d] > 0).map((sides) => ({ sides, count: counts[sides] }));
  const total = diceCount(ask);
  const formula = describeDice(ask, plus);

  // TV rolls come back from the server (so every DM screen agrees with the TV).
  const lastRoll = view.state.diceRoll;
  const seen = useRef(lastRoll?.n);
  useEffect(() => {
    if (!lastRoll || lastRoll.n === seen.current) return;
    seen.current = lastRoll.n;
    setLog((l) => [{ ...lastRoll, key: `tv${lastRoll.n}`, secret: false }, ...l].slice(0, 6));
  }, [lastRoll]);

  const add = (d: DieSides, by: number) => {
    setCounts((c) => {
      const next = Math.max(0, Math.min(MAX_OF_ONE, c[d] + by));
      if (by > 0 && diceCount(Object.values({ ...c, [d]: next }).map((count) => ({ count }))) > MAX_DICE) {
        toast(`At most ${MAX_DICE} dice at once.`);
        return c;
      }
      return { ...c, [d]: next };
    });
  };

  const rollTv = async () => {
    if (!total || busy) return;
    setBusy(true);
    await run({ type: "dice.roll", dice: ask, plus });
    setBusy(false);
  };
  const rollSecret = () => {
    if (!total) return;
    const r = rollPool(ask, plus, Math.random);
    setLog((l) => [{ ...r, key: `s${Date.now()}`, secret: true }, ...l].slice(0, 6));
  };
  const clear = () => {
    setCounts(NONE);
    setPlus(0);
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
        <button type="button" className="btn small" onClick={clear} disabled={!total && !plus}>
          Clear
        </button>
        <button type="button" className="btn small" onClick={() => setOpen(false)} aria-label="Close the dice">
          ×
        </button>
      </div>

      <div className="dt-dice" role="group" aria-label="How many of each die">
        {DIE_SIDES.map((d) => (
          <div key={d} className="dt-die">
            <button type="button" className={`btn dt-add${counts[d] ? " on" : ""}`} onClick={() => add(d, 1)} aria-label={`Add a d${d}${counts[d] ? ` (${counts[d]} now)` : ""}`}>
              <Die sides={d} />
              <span className="dt-name">d{d}</span>
            </button>
            {counts[d] ? (
              <span className="dt-count" aria-hidden="true">
                {counts[d]}
              </span>
            ) : null}
            <button type="button" className="btn small dt-minus" onClick={() => add(d, -1)} disabled={!counts[d]} aria-label={`One less d${d}`}>
              −
            </button>
          </div>
        ))}
      </div>

      <div className="dt-plus" role="group" aria-label="Modifier">
        <span>Modifier</span>
        <button type="button" className="btn small" onClick={() => setPlus((p) => Math.max(-MAX_PLUS, p - 1))} aria-label="Modifier down">
          −
        </button>
        <span className="dt-plus-val" aria-live="polite">
          {plus > 0 ? `+${plus}` : plus < 0 ? `−${-plus}` : "0"}
        </span>
        <button type="button" className="btn small" onClick={() => setPlus((p) => Math.min(MAX_PLUS, p + 1))} aria-label="Modifier up">
          +
        </button>
      </div>

      <div className="dt-formula" aria-live="polite">
        {total ? formula : <span className="note">Tap a die to add it.</span>}
      </div>

      <div className="dt-actions">
        <button type="button" className="btn primary" onClick={rollTv} disabled={!total || busy}>
          Roll on the TV
        </button>
        <button type="button" className="btn" onClick={rollSecret} disabled={!total} title="Only you see it: nothing goes to the TV or phones">
          Roll secretly
        </button>
      </div>

      {log.length ? (
        <ul className="dt-log" aria-label="Recent rolls" aria-live="polite">
          {log.map((r) => (
            <li key={r.key}>
              <span className="dt-total">{r.total}</span>
              <span>
                {describeResult(r)}{" "}
                <span className="dt-rolls">
                  ({r.groups.flatMap((g) => g.rolls).join(", ")}
                  {r.plus ? `, ${r.plus > 0 ? "+" : "−"}${Math.abs(r.plus)}` : ""})
                </span>
              </span>
              <span className="spacer" />
              <span className={`dt-tag${r.secret ? " secret" : ""}`}>{r.secret ? "secret" : "on TV"}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
