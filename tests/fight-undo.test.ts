// Undo in the fight tracker: HP and condition changes go back exactly, newest first.
import { describe, expect, it } from "vitest";
import { dmCommand, playerCommand, type Command } from "@/shared/commands";
import { projectPlayer, projectTv } from "@/shared/projection";
import { apply, type Ctx } from "@/shared/reducer";
import { seedGame } from "@/shared/seed";
import { hydrate } from "@/server/store";
import type { GameState } from "@/shared/types";
import { UNDO_KEPT } from "@/shared/combatReducer";

const DM: Ctx = { now: 1000, actor: { role: "dm" } };
const as = (playerId: string): Ctx => ({ now: 1000, actor: { role: "player", playerId } });
const GREMLIN = "m-pudding-gremlin";

function run(g: GameState, cmds: (Command | [Command, Ctx])[]): GameState {
  let state = g;
  for (const c of cmds) {
    const [cmd, ctx] = Array.isArray(c) ? c : [c, DM];
    state = apply(state, cmd, { ...ctx, rand: () => 0.5 }).state;
  }
  return state;
}

function begun(): GameState {
  const g = hydrate(seedGame("t"))!;
  g.players[2].away = true;
  g.players[3].away = true;
  g.players[0].character = "Brin";
  g.players[1].character = "Ash";
  let s = run(g, [{ type: "fight.start", groups: [{ templateId: GREMLIN, count: 2 }] }]);
  s = run(s, [
    [{ type: "me.hp", max: 20, cur: 20 }, as("p1")],
    [{ type: "me.hp", max: 12, cur: 12 }, as("p2")],
    [{ type: "me.initiative", init: 15 }, as("p1")],
    [{ type: "me.initiative", init: 12 }, as("p2")],
    { type: "fight.rollInit" },
    { type: "fight.begin" },
  ]);
  return s;
}
const foe = (s: GameState, n = 0) => s.fight!.order.filter((c) => c.kind === "monster")[n];
const pc = (s: GameState, pid: string) => s.fight!.order.find((c) => c.playerId === pid)!;

describe("fight undo", () => {
  it("brings a downed monster back up with its exact HP", () => {
    let s = begun();
    const g = foe(s);
    const before = structuredClone(g);
    s = run(s, [{ type: "fight.hp", combatantIds: [g.id], mode: "damage", amount: 999 }]);
    expect(foe(s).down).toBe(true);
    expect(s.fight!.downed).toContain(g.id);
    expect(s.fight!.history!.at(-1)!.label).toMatch(/took 999 damage/);
    s = run(s, [{ type: "fight.undo" }]);
    expect(foe(s).down).toBe(false);
    expect(foe(s).hp).toBe(before.hp);
    expect(s.fight!.downed).not.toContain(g.id);
    expect(s.fight!.history!.some((u) => u.label.includes("999"))).toBe(false);
    // The TV strip is back to normal.
    const tv = projectTv(s, 1).fight!.order.find((c) => c.id === g.id)!;
    expect(JSON.stringify(tv)).not.toMatch(/"down":true/);
  });

  it("puts a player back on their feet, death saves gone, phone updated", () => {
    let s = begun();
    const brin = pc(s, "p1");
    s = run(s, [{ type: "fight.hp", combatantIds: [brin.id], mode: "temp", amount: 5 }]);
    s = run(s, [{ type: "fight.hp", combatantIds: [brin.id], mode: "damage", amount: 30 }]);
    expect(s.players[0].hp).toMatchObject({ cur: 0, temp: 0 });
    expect(pc(s, "p1").deathSaves).toBeTruthy();
    s = run(s, [{ type: "fight.undo" }]);
    expect(s.players[0].hp).toMatchObject({ cur: 20, temp: 5, max: 20 });
    expect(pc(s, "p1").deathSaves).toBeUndefined();
    expect(projectPlayer(s, 1, "p1", []).fight).toBeTruthy();
    s = run(s, [{ type: "fight.undo" }]);
    expect(s.players[0].hp).toMatchObject({ cur: 20, temp: 0 });
  });

  it("undoes conditions both ways", () => {
    let s = begun();
    const g = foe(s);
    s = run(s, [{ type: "fight.condition", combatantIds: [g.id], name: "poisoned" }]);
    expect(foe(s).conditions.map((c) => c.name)).toEqual(["Poisoned"]);
    const cid = foe(s).conditions[0].id;
    s = run(s, [{ type: "fight.uncondition", combatantId: g.id, conditionId: cid }]);
    expect(s.fight!.history!.at(-1)!.label).toMatch(/Poisoned removed/);
    s = run(s, [{ type: "fight.undo" }]);
    expect(foe(s).conditions.map((c) => c.id)).toEqual([cid]);
    s = run(s, [{ type: "fight.undo" }]);
    expect(foe(s).conditions).toEqual([]);
  });

  it("undoes back to an older change, newest first", () => {
    let s = begun();
    const a = foe(s, 0);
    const start = a.hp;
    s = run(s, [
      { type: "fight.hp", combatantIds: [a.id], mode: "damage", amount: 2 },
      { type: "fight.hp", combatantIds: [a.id], mode: "damage", amount: 3 },
      { type: "fight.hp", combatantIds: [a.id], mode: "heal", amount: 1 },
    ]);
    const kept = s.fight!.history!.length - 3;
    const first = s.fight!.history![kept].id;
    s = run(s, [{ type: "fight.undo", undoId: first }]);
    expect(foe(s, 0).hp).toBe(start);
    expect(s.fight!.history!.length).toBe(kept);
  });

  it("records phone changes, skips no-ops, keeps only the last few, removes added reminders", () => {
    let s = begun();
    s = run(s, [[{ type: "me.hp", mode: "damage", amount: 4 }, as("p1")]]);
    expect(s.fight!.history!.at(-1)!.label).toBe("Brin (phone) took 4 damage");
    expect(s.fight!.history!.at(-1)!.by).toEqual({ playerId: "p1" });
    const n = s.fight!.history!.length;
    s = run(s, [[{ type: "me.hp", tv: false }, as("p1")]]);
    expect(s.fight!.history!.length).toBe(n);
    const brin = pc(s, "p1");
    s = run(s, [{ type: "fight.patch", combatantIds: [brin.id], patch: { concentrating: true } }]);
    const r = s.fight!.reminders.length;
    s = run(s, [{ type: "fight.hp", combatantIds: [brin.id], mode: "damage", amount: 2 }]);
    expect(s.fight!.reminders.length).toBe(r + 1);
    s = run(s, [{ type: "fight.undo" }]);
    expect(s.fight!.reminders.length).toBe(r);
    for (let i = 0; i < UNDO_KEPT + 5; i++) s = run(s, [{ type: "fight.hp", combatantIds: [foe(s, 1).id], mode: "temp", amount: i + 1 }]);
    expect(s.fight!.history!.length).toBe(UNDO_KEPT);
  });

  it("never sends the history to the TV or phones, and players can't undo", () => {
    let s = begun();
    s = run(s, [{ type: "fight.hp", combatantIds: [foe(s).id], mode: "damage", amount: 1 }]);
    expect(JSON.stringify(projectTv(s, 1))).not.toContain("took 1 damage");
    expect(JSON.stringify(projectPlayer(s, 1, "p1", []))).not.toContain("took 1 damage");
    expect(playerCommand.safeParse({ type: "fight.undo" }).success).toBe(false);
    expect(dmCommand.safeParse({ type: "fight.undo" }).success).toBe(true);
    const all = run(s, [{ type: "fight.undo", undoId: s.fight!.history![0].id }]);
    expect(() => run(all, [{ type: "fight.undo" }])).toThrow(/Nothing to undo/);
  });
});
