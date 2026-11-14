"use client";

import { useEffect, useRef, useState } from "react";
import { describeResult, natural, type DieSides } from "@/shared/dice";
import type { TvView } from "@/shared/projection";
import { Die } from "./Die";
import "./dice.css";

type Roll = NonNullable<TvView["diceRoll"]>;

const TUMBLE_MS = 1100;
const STAGGER_MS = 90;
const HOLD_MS = 6500;

/**
 * The DM rolled on the TV: the dice tumble in over whatever is showing (fights too),
 * land one by one, then the total. Never on first load, so a reload doesn't replay it.
 */
export function DiceRoll({ roll }: { roll: TvView["diceRoll"] }) {
  const seen = useRef<number | null | undefined>(undefined);
  const [shown, setShown] = useState<Roll | null>(null);
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    const n = roll?.n ?? null;
    if (seen.current === undefined) {
      seen.current = n;
      return;
    }
    if (n === seen.current) return;
    seen.current = n;
    if (!roll) return;
    setShown(roll);
    setLeaving(false);
    const end = settleAt(count(roll)) + HOLD_MS;
    const t1 = setTimeout(() => setLeaving(true), end - 600);
    const t2 = setTimeout(() => setShown(null), end);
    return () => (clearTimeout(t1), clearTimeout(t2));
  }, [roll]);
  if (!shown) return null;
  return <DiceRollCard key={shown.n} roll={shown} leaving={leaving} />;
}

const count = (r: Roll) => r.groups.reduce((n, g) => n + g.rolls.length, 0);
/** When the last die lands. */
const settleAt = (dice: number) => TUMBLE_MS + Math.min(dice - 1, 12) * STAGGER_MS;

export function DiceRollCard({ roll, still, leaving }: { roll: Roll; still?: boolean; leaving?: boolean }) {
  const dice = roll.groups.flatMap((g) => g.rolls.map((v) => ({ sides: g.sides, v })));
  const n = dice.length;
  const reduce = useReducedMotion() || !!still;
  const [landed, setLanded] = useState(reduce ? n : 0);
  const [faces, setFaces] = useState<number[]>(() => dice.map((d) => d.v));

  // Flicker random faces while tumbling; each die settles on its real number in turn.
  useEffect(() => {
    if (reduce) return setLanded(n);
    const start = performance.now();
    const tick = setInterval(() => {
      const t = performance.now() - start;
      const done = dice.filter((_, i) => t >= TUMBLE_MS + Math.min(i, 12) * STAGGER_MS).length;
      setLanded(done);
      setFaces(dice.map((d, i) => (i < done ? d.v : 1 + Math.floor(Math.random() * d.sides))));
      if (done >= n) clearInterval(tick);
    }, 70);
    return () => clearInterval(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce]);

  const all = landed >= n;
  const nat = natural(roll);
  const lone = n === 1 && !roll.plus;
  const size = n <= 3 ? 230 : n <= 6 ? 180 : n <= 12 ? 140 : n <= 20 ? 110 : 90;

  return (
    <div className={`dice-roll${reduce ? " still" : ""}${leaving ? " leaving" : ""}`} role="status" aria-label={`Dice: ${describeResult(roll)}, total ${roll.total}`}>
      <div className="dice-roll-card">
        <div className="dice-roll-kicker">{describeResult(roll)}</div>
        <div className="dice-roll-dice" style={{ ["--die" as string]: `calc(${size} * var(--u))` }}>
          {dice.map((d, i) => (
            <span
              key={i}
              className={`dice-roll-die${i < landed ? " landed" : ""}${d.sides === 20 && d.v === 20 && i < landed ? " crit" : ""}${d.sides === 20 && d.v === 1 && i < landed ? " fumble" : ""}`}
              style={{ ["--i" as string]: i, ["--dx" as string]: `${((i * 37) % 9) - 4}`, ["--spin" as string]: `${(i % 2 ? -1 : 1) * (540 + ((i * 53) % 180))}deg` }}
            >
              <Die sides={d.sides as DieSides} value={faces[i] ?? d.v} />
            </span>
          ))}
        </div>
        <div className={`dice-roll-total${all ? " show" : ""}${nat === 20 ? " crit" : nat === 1 ? " fumble" : ""}`} aria-hidden={!all}>
          {nat === 20 ? (
            <span className="dice-roll-nat">Natural 20!</span>
          ) : nat === 1 ? (
            <span className="dice-roll-nat">Natural 1</span>
          ) : lone ? null : (
            <>
              <span className="dice-roll-total-label">Total</span>
              <span className="dice-roll-total-num">{roll.total}</span>
            </>
          )}
          {nat && roll.plus ? <span className="dice-roll-total-num small">{roll.total}</span> : null}
        </div>
      </div>
    </div>
  );
}

function useReducedMotion(): boolean {
  const [r] = useState(() => {
    try {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
      return false;
    }
  });
  return r;
}
