// Rolling initiative from the phone: "Roll on TV" and a lone d20 from the Dice tab fill in and lock the player's initiative.
import { describe, expect, it } from "vitest";
import { playerCommand, type Command } from "@/shared/commands";
import { projectPlayer, projectTv } from "@/shared/projection";
import { apply, type Ctx } from "@/shared/reducer";
import { seedGame } from "@/shared/seed";
import { hydrate } from "@/server/store";
import type { GameState } from "@/shared/types";

let clock = 1000;
const DM = (): Ctx => ({ now: (clock += 5000), actor: { role: "dm" } });
const as = (playerId: string): Ctx => ({ now: (clock += 5000), actor: { role: "player", playerId } });

function game(): GameState {
  const g = hydrate(seedGame("t"))!;
  g.players[2].away = true;
  g.players[3].away = true;
  return g;
}
/** Dice always roll this fraction: 0.5 -> d20 = 11. */
const go = (g: GameState, cmd: Command, ctx: Ctx = DM(), rand = () => 0.5) => apply(g, cmd, { ...ctx, rand }).state;
const d20 = (plus = 0, tv = true): Command => ({ type: "me.diceRoll", dice: [{ sides: 20, count: 1 }], plus, tv });
const mineOf = (g: GameState, pid: string) => g.fight!.order.find((c) => c.playerId === pid)!;
const started = () => go(game(), { type: "fight.start", groups: [{ templateId: "m-pudding-gremlin", count: 1 }] });

describe("initiative from a phone roll", () => {
  it("a lone d20 during Roll initiative fills in the total, locks it, and tags the TV roll", () => {
    let g = started();
    g = go(g, d20(3), as("p1"));
    expect(mineOf(g, "p1").init).toBe(14);
    expect(mineOf(g, "p1").initRolled).toBe(true);
    const me = projectPlayer(g, 1, "p1", []);
    expect(me.myFight).toMatchObject({ init: 14, rolled: true });
    expect(me.myRolls[0]!.for).toBe("initiative");
    expect(projectTv(g, 1).diceRoll).toMatchObject({ total: 14, for: "initiative" });
    // Locked: typing a number is refused, and another d20 doesn't change it.
    expect(() => go(g, { type: "me.initiative", init: 20 }, as("p1"))).toThrow(/locked/);
    g = go(g, d20(0), as("p1"), () => 0.99);
    expect(mineOf(g, "p1").init).toBe(14);
    expect(g.rolls!.at(-1)!.for).toBeUndefined();
  });

  it("counts a DM-only d20 too, and replaces a typed number", () => {
    let g = started();
    g = go(g, { type: "me.initiative", init: 5 }, as("p2"));
    g = go(g, d20(0, false), as("p2"));
    expect(mineOf(g, "p2")).toMatchObject({ init: 11, initRolled: true });
    expect(g.diceRoll).toBeUndefined();
  });

  it("ignores other dice and rolls outside Roll initiative", () => {
    let g = started();
    g = go(g, { type: "me.diceRoll", dice: [{ sides: 20, count: 2 }], plus: 0, tv: true }, as("p1"));
    g = go(g, { type: "me.diceRoll", dice: [{ sides: 6, count: 1 }], plus: 0, tv: true }, as("p1"));
    expect(mineOf(g, "p1").init).toBeNull();
    // Running fight: a d20 is just a d20.
    g = go(g, { type: "me.initiative", init: 9 }, as("p1"));
    g = go(g, { type: "me.initiative", init: 8 }, as("p2"));
    g = go(g, { type: "fight.rollInit" });
    g = go(g, { type: "fight.begin" });
    g = go(g, d20(0), as("p1"), () => 0.99);
    expect(mineOf(g, "p1").init).toBe(9);
  });

  it("the DM can still override, and clearing it lets the player roll again", () => {
    let g = started();
    g = go(g, d20(0), as("p1"));
    const id = mineOf(g, "p1").id;
    g = go(g, { type: "fight.init", combatantId: id, init: 18 });
    expect(mineOf(g, "p1")).toMatchObject({ init: 18, initRolled: true });
    g = go(g, { type: "fight.init", combatantId: id, init: null });
    expect(mineOf(g, "p1").initRolled).toBeUndefined();
    g = go(g, d20(0), as("p1"), () => 0.0);
    expect(mineOf(g, "p1").init).toBe(1);
  });

  it("the initiative bonus is kept on the player and carried into fights", () => {
    let g = started();
    g = go(g, { type: "me.update", patch: { initBonus: 2 } }, as("p1"));
    expect(g.players.find((p) => p.id === "p1")!.initBonus).toBe(2);
    expect(mineOf(g, "p1").initBonus).toBe(2);
    expect(projectPlayer(g, 1, "p1", []).myFight!.bonus).toBe(2);
    g = go(g, { type: "fight.cancel" });
    let g2 = go(g, { type: "fight.start", groups: [] });
    expect(mineOf(g2, "p1").initBonus).toBe(2);
    g2 = go(g2, { type: "me.update", patch: { initBonus: 0 } }, as("p1"));
    expect(g2.players.find((p) => p.id === "p1")!.initBonus).toBeUndefined();
    expect(playerCommand.safeParse({ type: "me.update", patch: { initBonus: 99 } }).success).toBe(false);
    expect(playerCommand.safeParse({ type: "me.update", patch: { initBonus: -3 } }).success).toBe(true);
  });
});
