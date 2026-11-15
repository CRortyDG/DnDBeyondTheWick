"use client";

import { useEffect, useRef, useState } from "react";
import { describeResult, natural, type DieSides } from "@/shared/dice";
import type { TvView } from "@/shared/projection";
import { Die } from "./Die";
import "./dice.css";

type Roll = NonNullable<TvView["diceRoll"]>;
type Dice3D = typeof import("./dice3d");

// three.js only loads on the TV, and early (when the TV page opens), so the first roll is instant.
let three: Dice3D | null = null;
let loading: Promise<void> | null = null;
function load3D() {
  loading ??= import("./dice3d")
    .then((m) => {
      if (m.canDraw3D()) three = m;
    })
    .catch(() => {});
  return loading;
}

const TUMBLE_MS = 1400;
const STAGGER_MS = 90;
const HOLD_MS = 4500;

/**
 * The DM rolled on the TV: the dice tumble in over whatever is showing (fights too),
 * land one by one, then the total. Never on first load, so a reload doesn't replay it.
 */
export function DiceRoll({ roll }: { roll: TvView["diceRoll"] }) {
  const seen = useRef<number | null | undefined>(undefined);
  const [shown, setShown] = useState<Roll | null>(null);
  const [leaving, setLeaving] = useState(false);
  useEffect(() => void load3D(), []);
  // Watch only the roll's number: the TV gets a fresh view object on every state update,
  // so keying on `roll` itself would cancel the dismiss timers mid-roll and leave it up forever.
  const n = roll?.n ?? null;
  useEffect(() => {
    if (seen.current === undefined) {
      seen.current = n;
      return;
    }
    if (n === seen.current) return;
    seen.current = n;
    // The DM cleared it: off the TV at once, even mid-tumble.
    if (!roll) return setShown(null);
    setShown(roll);
    setLeaving(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n]);
  // The dismiss belongs to the roll on screen, so nothing but a newer roll can cancel it.
  const shownN = shown?.n;
  useEffect(() => {
    if (!shown) return;
    const end = settleAt(count(shown)) + HOLD_MS;
    const t1 = setTimeout(() => setLeaving(true), end - 600);
    const t2 = setTimeout(() => setShown(null), end);
    return () => (clearTimeout(t1), clearTimeout(t2));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shownN]);
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
  // 3D when three.js is ready and the browser can draw it; otherwise the flat dice.
  const [use3d] = useState(() => !!three);
  const host = useRef<HTMLDivElement>(null);
  const place = useRef<HTMLDivElement>(null);
  const size = n === 1 ? 300 : n <= 3 ? 230 : n <= 6 ? 180 : n <= 12 ? 140 : n <= 20 ? 110 : 90;
  const cols = n <= 6 ? n : n <= 12 ? 6 : n <= 20 ? 8 : 10;

  // Count the dice landing (and, flat, flicker random faces while they tumble).
  useEffect(() => {
    if (reduce) return setLanded(n);
    const start = performance.now();
    const tick = setInterval(() => {
      const t = performance.now() - start;
      const done = dice.filter((_, i) => t >= TUMBLE_MS + Math.min(i, 12) * STAGGER_MS).length;
      setLanded(done);
      if (!use3d) setFaces(dice.map((d, i) => (i < done ? d.v : 1 + Math.floor(Math.random() * d.sides))));
      if (done >= n) clearInterval(tick);
    }, 70);
    return () => clearInterval(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce]);

  useEffect(() => {
    if (!use3d || !three || !host.current || !place.current) return;
    const el = place.current;
    try {
      return three.mountDice3D(
        host.current,
        dice.map((d) => ({ sides: d.sides, value: d.v })),
        { tumbleMs: TUMBLE_MS, staggerMs: STAGGER_MS, still: reduce, cols, place: () => el.getBoundingClientRect() },
      );
    } catch {
      return undefined;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [use3d]);

  const all = landed >= n;
  const nat = natural(roll);
  const lone = n === 1 && !roll.plus;

  return (
    <div
      className={`dice-roll${reduce ? " still" : ""}${leaving ? " leaving" : ""}`}
      role="status"
      aria-label={`${roll.name ? `${roll.name} rolled` : "Dice"}: ${describeResult(roll)}, total ${roll.total}`}
    >
      <div className="dice-roll-card">
        <div className="dice-roll-kicker">
          {roll.name ? <span className="dice-roll-who">{roll.name} rolls </span> : null}
          {describeResult(roll)}
        </div>
        {use3d ? (
          <div ref={place} className="dice-roll-place" style={{ width: `calc(${cols * size * 1.18} * var(--u))`, height: `calc(${Math.ceil(n / cols) * size * 1.18} * var(--u))` }} />
        ) : (
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
        )}
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
      {use3d ? <div ref={host} className="dice-roll-3d" /> : null}
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
