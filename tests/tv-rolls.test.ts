// Rolls that land together on the TV (everyone rolling initiative at once): the TV is sent all of
// them, not just the newest, so none are lost when its updates arrive batched.
import { describe, expect, it } from "vitest";
import type { Command } from "@/shared/commands";
import { projectPlayer, projectTv } from "@/shared/projection";
import { apply, TV_ROLL_FRESH_MS, TV_ROLLS_MAX, type Ctx } from "@/shared/reducer";
import { seedGame } from "@/shared/seed";
import { hydrate } from "@/server/store";
import type { GameState } from "@/shared/types";

let clock = 1_000_000;
const DM = (): Ctx => ({ now: (clock += 10), actor: { role: "dm" } });
const as = (playerId: string): Ctx => ({ now: (clock += 10), actor: { role: "player", playerId } });
const go = (g: GameState, cmd: Command, ctx: Ctx = DM()) => apply(g, cmd, { ...ctx, rand: () => 0.5 }).state;
const d20 = (plus = 0, tv = true): Command => ({ type: "me.diceRoll", dice: [{ sides: 20, count: 1 }], plus, tv });

function game(): GameState {
  const g = hydrate(seedGame("t"))!;
  for (const p of g.players) p.away = false;
  return go(g, { type: "fight.start", groups: [{ templateId: "m-pudding-gremlin", count: 1 }] });
}

describe("rolls landing together on the TV", () => {
  it("sends the TV every roll of a burst, oldest first, with the newest still as diceRoll", () => {
    let g = game();
    const ids = g.players.map((p) => p.id);
    ids.forEach((id, i) => (g = go(g, d20(i), as(id))));
    g = go(g, { type: "dice.roll", dice: [{ sides: 6, count: 2 }], plus: 0 });
    const tv = projectTv(g, 1);
    expect(tv.diceRolls!.at(-1)!.name).toBeUndefined();
    expect(tv.diceRolls!.slice(0, ids.length).every((r) => !!r.name)).toBe(true);
    expect(tv.diceRolls!.length).toBe(ids.length + 1);
    expect(tv.diceRolls!.slice(0, ids.length).every((r) => r.for === "initiative")).toBe(true);
    expect(tv.diceRoll!.n).toBe(tv.diceRolls!.at(-1)!.n);
    // Numbers only go up, so the TV can tell which are new.
    const ns = tv.diceRolls!.map((r) => r.n);
    expect([...ns].sort((a, b) => a - b)).toEqual(ns);
  });

  it("leaves out secret and DM-only rolls, and phones never get the list", () => {
    let g = game();
    g = go(g, d20(0, false), as(g.players[0]!.id));
    g = go(g, { type: "dice.roll", dice: [{ sides: 20, count: 1 }], plus: 0, secret: true });
    expect(projectTv(g, 1).diceRolls).toBeUndefined();
    g = go(g, d20(0), as(g.players[1]!.id));
    expect(projectTv(g, 1).diceRolls).toHaveLength(1);
    expect((projectPlayer(g, 1, g.players[1]!.id, []) as unknown as Record<string, unknown>).tvRolls).toBeUndefined();
  });

  it("keeps only the last few, and only recent ones", () => {
    let g = game();
    for (let i = 0; i < TV_ROLLS_MAX + 5; i++) g = go(g, { type: "dice.roll", dice: [{ sides: 4, count: 1 }], plus: i });
    expect(g.tvRolls).toHaveLength(TV_ROLLS_MAX);
    expect(g.tvRolls!.at(-1)!.plus).toBe(TV_ROLLS_MAX + 4);
    clock += TV_ROLL_FRESH_MS + 1;
    g = go(g, { type: "dice.roll", dice: [{ sides: 4, count: 1 }], plus: 0 });
    expect(g.tvRolls).toHaveLength(1);
  });

  it("Clear TV takes them all down", () => {
    let g = game();
    g = go(g, d20(0), as(g.players[0]!.id));
    g = go(g, d20(0), as(g.players[1]!.id));
    g = go(g, { type: "dice.clearTv" });
    expect(g.diceRoll).toBeUndefined();
    expect(g.tvRolls).toBeUndefined();
    expect(projectTv(g, 1).diceRolls).toBeUndefined();
  });
});
