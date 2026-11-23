"use client";

import { useEffect, useRef, useState } from "react";
import { describeResult, keptIndex, maxTotal, natural, type DieSides } from "@/shared/dice";
import type { TvView } from "@/shared/projection";
import { Die } from "./Die";
import { OutOf } from "./OutOf";
import { diceSound } from "./tvSound";
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
/** Rolls side by side stay a little longer: there's more to read. */
const HOLD_TOGETHER_MS = 6500;
/** Side by side, the longest a roll waits past its own time so the cards can go together. */
const WAIT_FOR_OTHERS_MS = 4000;
/** The most rolls on the TV at once (two rows of four); any more wait their turn. */
export const MAX_ON_TV = 8;

type Slot = { roll: Roll; start: number };
type Board = { live: Slot[]; queue: Roll[]; leaving: number[]; together: boolean };
const EMPTY: Board = { live: [], queue: [], leaving: [], together: false };

/** Queued rolls take free places on the TV. */
function fill(b: Board, now: number): Board {
  if (!b.queue.length || b.live.length >= MAX_ON_TV) return b;
  const room = MAX_ON_TV - b.live.length;
  const live = [...b.live, ...b.queue.slice(0, room).map((roll) => ({ roll, start: now }))];
  return { ...b, live, queue: b.queue.slice(room), together: b.together || live.length > 1 };
}

/**
 * Rolls on the TV: the dice tumble in over whatever is showing (fights too), land one by one,
 * then the total. Rolls that come in together (everyone rolling initiative) share the screen
 * side by side, up to MAX_ON_TV; any more wait for a place. Never on first load, so a reload
 * doesn't replay them.
 */
export function DiceRoll({ roll, rolls }: { roll: TvView["diceRoll"]; rolls?: TvView["diceRolls"] }) {
  // The recent list when the server sends it; an older server sends just the newest roll.
  const list = rolls?.length ? rolls : roll ? [roll] : [];
  const seen = useRef<number | undefined>(undefined);
  const [board, setBoard] = useState<Board>(EMPTY);
  useEffect(() => void load3D(), []);
  // Watch only the rolls' numbers: the TV gets a fresh view object on every state update,
  // so keying on the objects would cancel the dismiss timers mid-roll and leave them up forever.
  const ns = list.map((r) => r.n).join(",");
  useEffect(() => {
    const top = list.reduce((m, r) => Math.max(m, r.n), 0);
    if (seen.current === undefined) {
      seen.current = top;
      return;
    }
    const fresh = list.filter((r) => r.n > seen.current!).sort((a, b) => a.n - b.n);
    seen.current = Math.max(seen.current, top);
    // A roll that's gone from the list was cleared by the DM ("Clear TV"): off the TV at once, even mid-tumble.
    const kept = new Set(list.map((r) => r.n));
    setBoard((b) => {
      const live = b.live.filter((x) => kept.has(x.roll.n));
      const queue = [...b.queue.filter((r) => kept.has(r.n)), ...fresh];
      const next = { ...b, live, queue, leaving: b.leaving.filter((n) => kept.has(n)) };
      return fill(live.length ? next : { ...next, together: false }, performance.now());
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ns]);

  const together = board.together;
  const onLeaving = (n: number) => setBoard((b) => ({ ...b, leaving: [...b.leaving, n] }));
  const onDone = (n: number) =>
    setBoard((b) => {
      const live = b.live.filter((x) => x.roll.n !== n);
      const next = { ...b, live, leaving: b.leaving.filter((x) => x !== n) };
      // Once the TV is clear, the next roll gets the big card again.
      return fill(live.length ? next : { ...next, together: false }, performance.now());
    });

  if (!board.live.length) return null;
  const crowd = board.live.length;
  const allLeaving = board.live.every((x) => board.leaving.includes(x.roll.n)) && !board.queue.length;
  // Side by side, the cards go together (when the last one's time is up), so the row doesn't
  // reshuffle as each leaves; but one never waits more than a few seconds past its own time.
  const ownEnd = (x: Slot) => x.start + settleAt(count(x.roll)) + (together ? HOLD_TOGETHER_MS : HOLD_MS);
  const last = Math.max(...board.live.map(ownEnd));
  const endOf = (x: Slot) => (together ? Math.min(last, ownEnd(x) + WAIT_FOR_OTHERS_MS) : ownEnd(x));
  // Two rows at most: 2, 3 or 4 across.
  const cols = crowd <= 4 ? crowd : Math.ceil(crowd / 2);
  return (
    <div
      className={`dice-roll${together ? " together" : ""}${allLeaving ? " leaving" : ""}`}
      style={together ? { ["--cols" as string]: Math.max(cols, 1) } : undefined}
    >
      {board.live.map((x) => (
        <RollSlot
          key={x.roll.n}
          roll={x.roll}
          end={endOf(x)}
          together={together}
          crowd={crowd}
          leaving={together && board.leaving.includes(x.roll.n)}
          onLeaving={onLeaving}
          onDone={onDone}
        />
      ))}
    </div>
  );
}

const rattled = new Set<number>();

/** One roll on the TV: rattles as it starts, and takes itself down when its time is up. */
function RollSlot({ roll, end, together, crowd, leaving, onLeaving, onDone }: { roll: Roll; end: number; together: boolean; crowd: number; leaving: boolean; onLeaving: (n: number) => void; onDone: (n: number) => void }) {
  const dice = count(roll);
  useEffect(() => {
    // Once per roll, even if the card mounts twice.
    if (rattled.has(roll.n)) return;
    rattled.add(roll.n);
    if (rattled.size > 64) rattled.delete(rattled.values().next().value!);
    diceSound({ dice, dur: settleAt(dice) / 1000, nat: natural(roll) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roll.n]);
  const done = useRef(onDone);
  done.current = onDone;
  const goingOut = useRef(onLeaving);
  goingOut.current = onLeaving;
  useEffect(() => {
    const left = end - performance.now();
    const t1 = setTimeout(() => goingOut.current(roll.n), Math.max(0, left - 600));
    const t2 = setTimeout(() => done.current(roll.n), Math.max(0, left));
    return () => (clearTimeout(t1), clearTimeout(t2));
  }, [end, roll.n]);
  return <DiceRollCard roll={roll} together={together} crowd={crowd} leaving={leaving} />;
}

const count = (r: Roll) => r.groups.reduce((n, g) => n + g.rolls.length, 0);
/** When the last die lands. */
const settleAt = (dice: number) => TUMBLE_MS + Math.min(dice - 1, 12) * STAGGER_MS;

export function DiceRollCard({ roll, still, leaving, together, crowd = 1 }: { roll: Roll; still?: boolean; leaving?: boolean; together?: boolean; crowd?: number }) {
  const dice = roll.groups.flatMap((g) => g.rolls.map((v) => ({ sides: g.sides, v })));
  const n = dice.length;
  const reduce = useReducedMotion() || !!still;
  const [landed, setLanded] = useState(reduce ? n : 0);
  const [faces, setFaces] = useState<number[]>(() => dice.map((d) => d.v));
  // 3D when three.js is ready and the browser can draw it; otherwise the flat dice.
  const [use3d] = useState(() => !!three);
  const host = useRef<HTMLDivElement>(null);
  const place = useRef<HTMLDivElement>(null);
  const big = n === 1 ? 300 : n <= 3 ? 230 : n <= 6 ? 180 : n <= 12 ? 140 : n <= 20 ? 110 : 90;
  // Side by side, each card gets a share of the screen, and its dice shrink to fit.
  const share = !together ? 1 : crowd <= 2 ? 0.75 : crowd <= 4 ? 0.6 : 0.5;
  const size = Math.round(big * share);
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
        { tumbleMs: TUMBLE_MS, staggerMs: STAGGER_MS, still: reduce, cols, place: () => el.getBoundingClientRect(), watch: [el] },
      );
    } catch {
      return undefined;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [use3d]);

  const all = landed >= n;
  // Advantage or disadvantage: the die that doesn't count fades once they've landed.
  const kept = keptIndex(roll);
  const nat = natural(roll);
  // A lone d20 with nothing added reads off the die; side by side, every card shows its number.
  const lone = n === 1 && !roll.plus && !together;

  return (
    <div
      className={`dice-roll-slot${reduce ? " still" : ""}${leaving ? " leaving" : ""}`}
      role="status"
      aria-label={`${roll.name ? `${roll.name} rolled` : "Dice"}: ${describeResult(roll)}, total ${roll.total}${maxTotal(roll) !== null ? ` out of ${maxTotal(roll)}` : ""}`}
    >
      <div className="dice-roll-card">
        {together ? (
          // Side by side, the name leads (it's how each player finds their roll), then what it was.
          <div className="dice-roll-kicker">
            <span className="dice-roll-who">{roll.name ?? "DM"}</span>
            {roll.label ? `${roll.label} · ` : roll.for === "initiative" ? "Initiative · " : ""}
            {describeResult(roll)}
          </div>
        ) : (
          <div className="dice-roll-kicker">
            {roll.name ? <span className="dice-roll-who">{roll.name} rolls {roll.label ? `${roll.label}: ` : roll.for === "initiative" ? "initiative: " : ""}</span> : null}
            {describeResult(roll)}
          </div>
        )}
        {use3d ? (
          <div ref={place} className="dice-roll-place" style={{ width: `calc(${cols * size * 1.18} * var(--u))`, height: `calc(${Math.ceil(n / cols) * size * 1.18} * var(--u))` }} />
        ) : (
          <div className="dice-roll-dice" style={{ ["--die" as string]: `calc(${size} * var(--u))` }}>
            {dice.map((d, i) => (
              <span
                key={i}
                className={`dice-roll-die${i < landed ? " landed" : ""}${kept !== null && kept !== i && all ? " dropped" : ""}${d.sides === 20 && d.v === 20 && i < landed ? " crit" : ""}${d.sides === 20 && d.v === 1 && i < landed ? " fumble" : ""}`}
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
              <span className="dice-roll-total-num">
                {roll.total}
                <OutOf r={roll} />
              </span>
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
