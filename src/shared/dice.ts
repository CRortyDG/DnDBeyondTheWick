// The DM's dice tray: pick how many of each die, roll on the TV (or secretly).

export const DIE_SIDES = [4, 6, 8, 10, 12, 20, 100] as const;
export type DieSides = (typeof DIE_SIDES)[number];

/** Most of one die in a roll, and most dice in all (so the TV can still show them). */
export const MAX_OF_ONE = 20;
export const MAX_DICE = 30;
export const MAX_PLUS = 50;

export interface DiceAsk {
  sides: DieSides;
  count: number;
}

export interface DiceGroup {
  sides: DieSides;
  rolls: number[];
}

export interface DiceResult {
  groups: DiceGroup[];
  plus: number;
  total: number;
}

/** Roll a handful of dice. Groups keep the d4 → d100 order, whatever order they were picked in. */
export function rollPool(ask: DiceAsk[], plus: number, rand: () => number): DiceResult {
  const groups: DiceGroup[] = [];
  for (const sides of DIE_SIDES) {
    const count = ask.filter((a) => a.sides === sides).reduce((n, a) => n + a.count, 0);
    if (count < 1) continue;
    const rolls: number[] = [];
    for (let i = 0; i < count; i++) rolls.push(1 + Math.floor(rand() * sides));
    groups.push({ sides, rolls });
  }
  const total = groups.reduce((t, g) => t + g.rolls.reduce((a, b) => a + b, 0), 0) + plus;
  return { groups, plus, total };
}

export function diceCount(ask: Pick<DiceAsk, "count">[]): number {
  return ask.reduce((n, a) => n + a.count, 0);
}

/** "2d6 + 1d20 + 3". */
export function describeDice(groups: { sides: number; count: number }[], plus: number): string {
  const parts = groups.filter((g) => g.count > 0).map((g) => `${g.count}d${g.sides}`);
  let out = parts.join(" + ");
  if (plus) out += `${out ? " " : ""}${plus > 0 ? "+" : "−"} ${Math.abs(plus)}`;
  return out;
}

export function describeResult(r: Pick<DiceResult, "groups" | "plus">): string {
  return describeDice(
    r.groups.map((g) => ({ sides: g.sides, count: g.rolls.length })),
    r.plus,
  );
}

/** A lone d20: a natural 20 or natural 1 gets called out on the TV. */
export function natural(r: Pick<DiceResult, "groups">): 20 | 1 | null {
  if (r.groups.length !== 1 || r.groups[0].sides !== 20 || r.groups[0].rolls.length !== 1) return null;
  const v = r.groups[0].rolls[0];
  return v === 20 ? 20 : v === 1 ? 1 : null;
}
