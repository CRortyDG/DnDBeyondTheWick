// Conditions in a fight: the sheet and the fight show the same list, players can
// mark themselves, and the TV strip / map tokens get the marks.
import { describe, expect, it } from "vitest";
import type { Command } from "@/shared/commands";
import { playerCommand } from "@/shared/commands";
import { projectPlayer, projectTv } from "@/shared/projection";
import { apply, type Ctx } from "@/shared/reducer";
import { seedGame } from "@/shared/seed";
import { hydrate } from "@/server/store";
import { publicTokens } from "@/shared/tokens";
import { conditionGlyph } from "@/shared/conditionRules";
import type { GameState } from "@/shared/types";

const DM: Ctx = { now: 1000, actor: { role: "dm" } };
const as = (playerId: string): Ctx => ({ now: 1000, actor: { role: "player", playerId } });

function game(): GameState {
  const g = hydrate(seedGame("t"))!;
  g.players[2].away = true;
  g.players[3].away = true;
  g.players[0].character = "Brin";
  g.players[1].character = "Ash";
  return g;
}

function run(g: GameState, cmds: (Command | [Command, Ctx])[]): GameState {
  let state = g;
  for (const c of cmds) {
    const [cmd, ctx] = Array.isArray(c) ? c : [c, DM];
    state = apply(state, cmd, { ...ctx, rand: () => 0.5 }).state;
  }
  return state;
}

const GREMLIN = "m-pudding-gremlin";
const brinIn = (g: GameState) => g.fight!.order.find((c) => c.playerId === "p1")!;
const sheet = (g: GameState) => g.players.find((p) => p.id === "p1")!.sheet!;

describe("sheet and fight conditions", () => {
  it("conditions ticked on the sheet join the fight when it starts", () => {
    let g = run(game(), [[{ type: "me.sheet", patch: { conditions: ["poisoned"], exhaustion: 2 } }, as("p1")]]);
    g = run(g, [{ type: "fight.start", groups: [{ templateId: GREMLIN, count: 1 }] }]);
    expect(brinIn(g).conditions.map((x) => [x.name, x.level])).toEqual([
      ["Poisoned", undefined],
      ["Exhaustion", 2],
    ]);
    expect(sheet(g).conditions).toEqual(["poisoned"]);
  });

  it("the DM's fight conditions show on the sheet; timed ones end with the fight, the rest stay", () => {
    let g = run(game(), [[{ type: "me.sheet", patch: { ac: 12 } }, as("p1")], { type: "fight.start", groups: [{ templateId: GREMLIN, count: 1 }] }]);
    const id = brinIn(g).id;
    g = run(g, [
      { type: "fight.condition", combatantIds: [id], name: "Prone" },
      { type: "fight.condition", combatantIds: [id], name: "Restrained", rounds: 2 },
      { type: "fight.condition", combatantIds: [id], name: "Hexed" },
    ]);
    expect(sheet(g).conditions).toEqual(["prone", "restrained"]);
    g = run(g, [[{ type: "me.initiative", init: 15 }, as("p1")], [{ type: "me.initiative", init: 12 }, as("p2")], { type: "fight.rollInit" }, { type: "fight.begin" }, { type: "fight.end" }]);
    expect(sheet(g).conditions).toEqual(["prone"]);
  });

  it("ticking or unticking on the sheet mid-fight changes the fight; custom ones stay", () => {
    let g = run(game(), [[{ type: "me.sheet", patch: { ac: 12 } }, as("p1")], { type: "fight.start", groups: [{ templateId: GREMLIN, count: 1 }] }]);
    const id = brinIn(g).id;
    g = run(g, [
      { type: "fight.condition", combatantIds: [id], name: "Hexed" },
      [{ type: "me.sheet", patch: { conditions: ["prone"] } }, as("p1")],
    ]);
    expect(brinIn(g).conditions.map((x) => x.name).sort()).toEqual(["Hexed", "Prone"]);
    g = run(g, [[{ type: "me.sheet", patch: { conditions: [] } }, as("p1")]]);
    expect(brinIn(g).conditions.map((x) => x.name)).toEqual(["Hexed"]);
    // The next fight command doesn't bring it back.
    g = run(g, [{ type: "fight.rollInit" }]);
    expect(sheet(g).conditions).toBeUndefined();
  });

  it("a cancelled fight keeps untimed conditions on the sheet", () => {
    let g = run(game(), [[{ type: "me.sheet", patch: { ac: 12 } }, as("p1")], { type: "fight.start", groups: [{ templateId: GREMLIN, count: 1 }] }]);
    const id = brinIn(g).id;
    g = run(g, [
      { type: "fight.condition", combatantIds: [id], name: "Prone" },
      { type: "fight.condition", combatantIds: [id], name: "Stunned", rounds: 1 },
      { type: "fight.cancel" },
    ]);
    expect(sheet(g).conditions).toEqual(["prone"]);
  });

  it("players without a sheet still get fight conditions, and no sheet is made for them", () => {
    let g = run(game(), [{ type: "fight.start", groups: [{ templateId: GREMLIN, count: 1 }] }]);
    g = run(g, [{ type: "fight.condition", combatantIds: [brinIn(g).id], name: "Prone" }]);
    expect(brinIn(g).conditions[0].name).toBe("Prone");
    expect(g.players[0].sheet).toBeUndefined();
  });
});

describe("players mark themselves", () => {
  it("me.condition adds a standard condition to your own combatant, me.uncondition takes it off", () => {
    let g = run(game(), [{ type: "fight.start", groups: [{ templateId: GREMLIN, count: 1 }] }]);
    g = run(g, [[{ type: "me.condition", name: "prone" }, as("p1")]]);
    expect(brinIn(g).conditions.map((x) => x.name)).toEqual(["Prone"]);
    // Twice is still once.
    g = run(g, [[{ type: "me.condition", name: "Prone" }, as("p1")]]);
    expect(brinIn(g).conditions).toHaveLength(1);
    const view = projectPlayer(g, 1, "p1", []);
    const mine = view.fight!.order.find((c) => c.playerId === "p1")!;
    expect(mine.conditions[0].id).toBe(brinIn(g).conditions[0].id);
    g = run(g, [[{ type: "me.uncondition", conditionId: mine.conditions[0].id! }, as("p1")]]);
    expect(brinIn(g).conditions).toEqual([]);
  });

  it("only standard conditions, only in a fight, only on yourself", () => {
    expect(() => run(game(), [[{ type: "me.condition", name: "Prone" }, as("p1")]])).toThrow(/no fight/i);
    const g = run(game(), [{ type: "fight.start", groups: [{ templateId: GREMLIN, count: 1 }] }]);
    expect(() => run(g, [[{ type: "me.condition", name: "Hexed" }, as("p1")]])).toThrow(/from the list/i);
    expect(() => run(g, [[{ type: "me.condition", name: "Prone" }, as("p3")]])).toThrow(/not in this fight/i);
    expect(playerCommand.safeParse({ type: "me.condition", name: "Prone" }).success).toBe(true);
    expect(playerCommand.safeParse({ type: "me.uncondition", conditionId: "k1" }).success).toBe(true);
  });
});

describe("marks on the TV and tokens", () => {
  it("every combatant's conditions reach the TV, and tokens carry them", () => {
    let g = run(game(), [{ type: "fight.start", groups: [{ templateId: GREMLIN, count: 1 }] }]);
    g = run(g, [{ type: "fight.condition", combatantIds: [brinIn(g).id], name: "Poisoned" }]);
    const tv = projectTv(g, 1000);
    expect(tv.fight!.order.find((c) => c.playerId === "p1")!.conditions.map((x) => x.name)).toEqual(["Poisoned"]);
    const map = { tokens: [{ id: "t1", kind: "player", playerId: "p1", label: "", name: "", color: "blue", x: 0.5, y: 0.5, size: 1, hidden: false }] } as never;
    expect(publicTokens(g, map)[0].conds).toEqual(["Poisoned"]);
    expect(conditionGlyph("Poisoned")).toBe("☠");
    expect(conditionGlyph("Hexed")).toBe("H");
  });
});
