"use client";

import { useState } from "react";
import { DIE_SIDES, describeDice, describeResult, diceCount, MAX_DICE, MAX_OF_ONE, MAX_PLUS, type DiceResult, type DieSides } from "@/shared/dice";
import { Die } from "./Die";
import "./dice.css";

type Counts = Record<DieSides, number>;
const NONE: Counts = { 4: 0, 6: 0, 8: 0, 10: 0, 12: 0, 20: 0, 100: 0 };

/** The dice picked so far and the modifier. The picks stay after a roll, so a repeat roll is one tap. */
export function useDicePicks(onTooMany: (msg: string) => void) {
  const [counts, setCounts] = useState<Counts>(NONE);
  const [plus, setPlus] = useState(0);
  const ask = DIE_SIDES.filter((d) => counts[d] > 0).map((sides) => ({ sides, count: counts[sides] }));
  const add = (d: DieSides, by: number) =>
    setCounts((c) => {
      const next = Math.max(0, Math.min(MAX_OF_ONE, c[d] + by));
      if (by > 0 && diceCount(Object.values({ ...c, [d]: next }).map((count) => ({ count }))) > MAX_DICE) {
        onTooMany(`At most ${MAX_DICE} dice at once.`);
        return c;
      }
      return { ...c, [d]: next };
    });
  return {
    counts,
    plus,
    ask,
    total: diceCount(ask),
    add,
    bump: (by: number) => setPlus((p) => Math.max(-MAX_PLUS, Math.min(MAX_PLUS, p + by))),
    reset: () => (setCounts(NONE), setPlus(0)),
  };
}

export type DicePicks = ReturnType<typeof useDicePicks>;

/** Tap a die to add one (the badge counts them), − takes one away, plus a modifier. */
export function DicePicker({ picks }: { picks: DicePicks }) {
  const { counts, plus, ask, total, add, bump } = picks;
  return (
    <>
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
        <button type="button" className="btn small" onClick={() => bump(-1)} aria-label="Modifier down">
          −
        </button>
        <span className="dt-plus-val" aria-live="polite">
          {plus > 0 ? `+${plus}` : plus < 0 ? `−${-plus}` : "0"}
        </span>
        <button type="button" className="btn small" onClick={() => bump(1)} aria-label="Modifier up">
          +
        </button>
      </div>

      <div className="dt-formula" aria-live="polite">
        {total ? describeDice(ask, plus) : <span className="note">Tap a die to add it.</span>}
      </div>
    </>
  );
}

/** One roll in a log: the total, the dice and every die's number, and a tag for where it went. */
export function RollLine({ r, who, tag, secret }: { r: DiceResult; who?: string; tag: string; secret?: boolean }) {
  const label = r.label ? `${r.label}: ` : "";
  return (
    <li>
      <span className="dt-total">{r.total}</span>
      <span>
        {who ? <b className="dt-who">{who} </b> : null}
        {label}
        {describeResult(r)}{" "}
        <span className="dt-rolls">
          ({r.groups.flatMap((g) => g.rolls).join(", ")}
          {r.plus ? `, ${r.plus > 0 ? "+" : "−"}${Math.abs(r.plus)}` : ""})
        </span>
      </span>
      <span className="spacer" />
      <span className={`dt-tag${secret ? " secret" : ""}`}>{tag}</span>
    </li>
  );
}
