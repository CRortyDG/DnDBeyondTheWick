// The DM's dice tray: rolls on the TV.
import { beforeEach, describe, expect, it } from "vitest";
import { dmCommand, type Command } from "@/shared/commands";
import { describeDice, describeResult, natural, rollPool } from "@/shared/dice";
import { projectPlayer, projectTv } from "@/shared/projection";
import { apply, CommandError, type Ctx } from "@/shared/reducer";
import { freshStart, seedGame } from "@/shared/seed";
import type { Actor, GameState } from "@/shared/types";

const DM: Actor = { role: "dm" };
let g: GameState;
let now = 1000;

/** A fixed sequence of rand() values, repeating. */
const seq = (...xs: number[]) => {
  let i = 0;
  return () => xs[i++ % xs.length];
};

function as(actor: Actor, cmd: Command, rand?: () => number) {
  g = apply(g, cmd, { now: ++now, actor, rand } as Ctx).state;
}

beforeEach(() => {
  g = seedGame("test");
});

describe("rollPool", () => {
  it("rolls every die in d4 → d100 order and adds the modifier", () => {
    // rand 0 → 1, rand 0.999 → max.
    const r = rollPool(
      [
        { sides: 20, count: 1 },
        { sides: 6, count: 2 },
      ],
      3,
      seq(0, 0.999, 0.5),
    );
    expect(r.groups).toEqual([
      { sides: 6, rolls: [1, 6] },
      { sides: 20, rolls: [11] },
    ]);
    expect(r.total).toBe(1 + 6 + 11 + 3);
    expect(describeResult(r)).toBe("2d6 + 1d20 + 3");
  });

  it("stays in range for a d100", () => {
    for (let i = 0; i < 200; i++) {
      const v = rollPool([{ sides: 100, count: 1 }], 0, Math.random).groups[0].rolls[0];
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(100);
    }
  });

  it("describes a negative modifier and spots naturals on a lone d20", () => {
    expect(describeDice([{ sides: 8, count: 1 }], -2)).toBe("1d8 − 2");
    expect(natural({ groups: [{ sides: 20, rolls: [20] }] })).toBe(20);
    expect(natural({ groups: [{ sides: 20, rolls: [1] }] })).toBe(1);
    expect(natural({ groups: [{ sides: 20, rolls: [20, 3] }] })).toBeNull();
    expect(natural({ groups: [{ sides: 12, rolls: [1] }] })).toBeNull();
  });
});

describe("dice.roll", () => {
  it("puts the roll on the TV, and a new roll gets a new number", () => {
    as(DM, { type: "dice.roll", dice: [{ sides: 20, count: 1 }], plus: 5 }, seq(0.5));
    const tv = projectTv(g, 1).diceRoll!;
    expect(tv).toMatchObject({ groups: [{ sides: 20, rolls: [11] }], plus: 5, total: 16 });
    as(DM, { type: "dice.roll", dice: [{ sides: 20, count: 1 }], plus: 5 }, seq(0.5));
    expect(projectTv(g, 1).diceRoll!.n).toBeGreaterThan(tv.n);
  });

  it("works in the middle of a fight", () => {
    as(DM, { type: "fight.start" });
    as(DM, { type: "dice.roll", dice: [{ sides: 6, count: 8 }], plus: 0 });
    const tv = projectTv(g, 1);
    expect(tv.fight).not.toBeNull();
    expect(tv.diceRoll!.groups[0].rolls).toHaveLength(8);
  });

  it("is the DM's alone, and doesn't go to phones", () => {
    const pid = g.players[0]?.id;
    expect(() => as({ role: "player", playerId: pid ?? "p1" }, { type: "dice.roll", dice: [{ sides: 6, count: 1 }], plus: 0 })).toThrow(CommandError);
    as(DM, { type: "dice.roll", dice: [{ sides: 6, count: 1 }], plus: 0 });
    if (pid) expect(projectPlayer(g, 1, pid, [])).not.toHaveProperty("diceRoll");
  });

  it("refuses odd dice and too many", () => {
    const ok = (c: unknown) => dmCommand.safeParse(c).success;
    expect(ok({ type: "dice.roll", dice: [{ sides: 6, count: 2 }] })).toBe(true);
    expect(ok({ type: "dice.roll", dice: [{ sides: 7, count: 1 }], plus: 0 })).toBe(false);
    expect(ok({ type: "dice.roll", dice: [{ sides: 6, count: 0 }], plus: 0 })).toBe(false);
    expect(ok({ type: "dice.roll", dice: [{ sides: 6, count: 21 }], plus: 0 })).toBe(false);
    expect(
      ok({
        type: "dice.roll",
        dice: [
          { sides: 6, count: 20 },
          { sides: 8, count: 11 },
        ],
        plus: 0,
      }),
    ).toBe(false);
    expect(ok({ type: "dice.roll", dice: [], plus: 0 })).toBe(false);
    expect(ok({ type: "dice.roll", dice: [{ sides: 20, count: 1 }], plus: 51 })).toBe(false);
  });

  it("is forgotten on a fresh start", () => {
    as(DM, { type: "dice.roll", dice: [{ sides: 4, count: 1 }], plus: 0 });
    expect(projectTv(freshStart(g), 1).diceRoll).toBeUndefined();
  });
});
