// Character sheets: the math, starting a sheet, the DM lock, privacy, and links to combat and rests.
import { describe, expect, it } from "vitest";
import { projectPlayer, projectTv, projectDm } from "@/shared/projection";
import { apply, type Ctx } from "@/shared/reducer";
import { seedGame } from "@/shared/seed";
import { hydrate } from "@/server/store";
import { dmCommand, playerCommand, type Command } from "@/shared/commands";
import { blankSheet, mod, proficiency, saveBonus, sheetFromStarter, sheetNumbers, skillBonus } from "@/shared/sheet";
import type { GameState } from "@/shared/types";

const DM: Ctx = { now: 1000, actor: { role: "dm" } };
const as = (pid: string): Ctx => ({ now: 2000, actor: { role: "player", playerId: pid } });
const run = (g: GameState, cmd: Command, ctx: Ctx = DM) => apply(g, cmd, { ...ctx, rand: () => 0.5 }).state;
const table = () => hydrate(seedGame("t"))!;

describe("sheet math", () => {
  it("works out modifiers and proficiency", () => {
    expect([1, 8, 9, 10, 11, 15, 20, 30].map(mod)).toEqual([-5, -1, -1, 0, 0, 2, 5, 10]);
    expect([undefined, 1, 4, 5, 9, 13, 17, 20].map(proficiency)).toEqual([2, 2, 2, 3, 4, 5, 6, 6]);
  });

  it("adds proficiency, expertise and extras to saves and skills", () => {
    const sh = blankSheet(0);
    sh.scores.dex = 16;
    sh.scores.wis = 13;
    sh.saves = ["dex"];
    sh.skills = { stealth: 2, perception: 1 };
    sh.extra = { "skill.stealth": 1, init: 2 };
    expect(saveBonus(sh, "dex", 5)).toBe(6);
    expect(saveBonus(sh, "str", 5)).toBe(0);
    expect(skillBonus(sh, "stealth", 5)).toBe(3 + 6 + 1);
    const n = sheetNumbers(sh, 5);
    expect(n).toMatchObject({ prof: 3, ac: 13, acWorkedOut: true, init: 5, speed: 30, passive: 10 + 1 + 3, hitDice: 5 });
  });

  it("starts from an Arrival starting point", () => {
    const sh = sheetFromStarter("sneak", 0);
    expect(sh).toMatchObject({ cls: "Rogue", species: "Halfling", background: "Criminal", saves: ["dex", "int"] });
    expect(sh.scores.dex).toBe(15);
    expect(Object.values(sh.scores).sort((a, b) => a - b)).toEqual([8, 10, 12, 13, 14, 15]);
  });
});

describe("sheet commands", () => {
  it("validates patches", () => {
    expect(playerCommand.safeParse({ type: "me.sheet", patch: { scores: { str: 31 } } }).success).toBe(false);
    expect(playerCommand.safeParse({ type: "me.sheet", patch: { extra: { "skill.flying": 2 } } }).success).toBe(false);
    expect(playerCommand.safeParse({ type: "me.sheet", patch: { skills: { stealth: 2 }, extra: { init: 3 } } }).success).toBe(true);
    expect(dmCommand.safeParse({ type: "sheet.update", playerId: "p1", patch: { ac: 18 } }).success).toBe(true);
    // A player can't send the DM's commands.
    expect(playerCommand.safeParse({ type: "sheet.lock", on: false }).success).toBe(false);
  });

  it("lets a player start and fill their sheet; a class brings its saves", () => {
    let g = table();
    g = run(g, { type: "me.sheet", patch: { cls: "Fighter", scores: { str: 16, dex: 14 } } }, as("p1"));
    const sh = g.players[0].sheet!;
    expect(sh).toMatchObject({ cls: "Fighter", saves: ["str", "con"], updatedAt: 2000 });
    expect(sh.scores).toMatchObject({ str: 16, dex: 14, con: 10 });
    // Initiative follows Dexterity for combat mode.
    expect(g.players[0].initBonus).toBe(2);
    g = run(g, { type: "me.sheet", patch: { skills: { athletics: 1, stealth: 0 }, conditions: ["prone"], traits: "  Second Wind \n" } }, as("p1"));
    expect(g.players[0].sheet).toMatchObject({ skills: { athletics: 1 }, conditions: ["prone"], traits: "Second Wind" });
  });

  it("starts from the player's starting point when asked", () => {
    let g = table();
    g.players[0].arrival = { token: "x", pick: "spellcaster" };
    g = run(g, { type: "me.sheet", patch: {}, starter: true }, as("p1"));
    expect(g.players[0].sheet).toMatchObject({ cls: "Wizard", species: "Elf", saves: ["int", "wis"] });
    expect(g.players[0].sheet!.scores.int).toBe(15);
  });

  it("typing an initiative bonus on a sheet sets the extra", () => {
    let g = table();
    g = run(g, { type: "me.sheet", patch: { scores: { dex: 14 } } }, as("p1"));
    g = run(g, { type: "me.update", patch: { initBonus: 5 } }, as("p1"));
    expect(g.players[0].sheet!.extra).toEqual({ init: 3 });
    expect(g.players[0].initBonus).toBe(5);
  });

  it("the DM lock keeps class and scores but not HP, conditions or notes", () => {
    let g = table();
    g = run(g, { type: "me.sheet", patch: { cls: "Rogue" } }, as("p1"));
    g = run(g, { type: "sheet.lock", on: true });
    expect(g.players[0].sheet!.locked).toBe(true);
    expect(() => run(g, { type: "me.sheet", patch: { scores: { dex: 20 } } }, as("p1"))).toThrow(/locked/);
    g = run(g, { type: "me.sheet", patch: { conditions: ["poisoned"], notes: "Owes Mags 5 gp", hitDiceSpent: 1 } }, as("p1"));
    expect(g.players[0].sheet).toMatchObject({ conditions: ["poisoned"], hitDiceSpent: 1 });
    // The DM can still change anything.
    g = run(g, { type: "sheet.update", playerId: "p1", patch: { scores: { dex: 18 } } });
    expect(g.players[0].sheet!.scores.dex).toBe(18);
    // A player who starts later isn't locked until the DM locks again.
    g = run(g, { type: "me.sheet", patch: { scores: { str: 15 } } }, as("p2"));
    expect(g.players[1].sheet!.locked).toBeUndefined();
    g = run(g, { type: "sheet.lock", playerId: "p1", on: false });
    expect(g.players[0].sheet!.locked).toBeUndefined();
  });

  it("a long rest gives back hit dice and one level of exhaustion", () => {
    let g = table();
    g = run(g, { type: "me.sheet", patch: { hitDiceSpent: 2, exhaustion: 2 } }, as("p1"));
    g = run(g, { type: "party.longRest" });
    expect(g.players[0].sheet!.hitDiceSpent).toBeUndefined();
    expect(g.players[0].sheet!.exhaustion).toBe(1);
  });

  it("the DM can remove a sheet", () => {
    let g = table();
    g = run(g, { type: "sheet.update", playerId: "p2", patch: { cls: "Bard" } });
    expect(g.players[1].sheet!.saves).toEqual(["dex", "cha"]);
    g = run(g, { type: "sheet.remove", playerId: "p2" });
    expect(g.players[1].sheet).toBeUndefined();
  });
});

describe("sheet privacy", () => {
  it("only the player and the DM see a sheet", () => {
    let g = table();
    g = run(g, { type: "me.sheet", patch: { cls: "Wizard", notes: "Secret: I'm the duke's niece" } }, as("p1"));
    expect(projectPlayer(g, 1, "p1", []).me.sheet?.notes).toContain("niece");
    expect(JSON.stringify(projectPlayer(g, 1, "p2", []))).not.toContain("niece");
    expect(JSON.stringify(projectTv(g, 1))).not.toContain("niece");
    expect(JSON.stringify(projectDm(g, 1, []))).toContain("niece");
  });
});
