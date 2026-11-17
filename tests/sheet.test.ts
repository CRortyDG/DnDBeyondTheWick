// Character sheets: the math, starting a sheet, the DM lock, privacy, and links to combat and rests.
import { describe, expect, it } from "vitest";
import { projectPlayer, projectTv, projectDm } from "@/shared/projection";
import { apply, type Ctx } from "@/shared/reducer";
import { seedGame } from "@/shared/seed";
import { hydrate } from "@/server/store";
import { dmCommand, playerCommand, type Command } from "@/shared/commands";
import { blankSheet, mod, proficiency, saveBonus, sheetFromStarter, sheetNumbers, skillBonus } from "@/shared/sheet";
import { featureFrom, featureNow, pactOf, slotsMaxOf, spellAttackBonus, spellSaveDc, suggestedFeatures } from "@/shared/sheetMagic";
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

describe("sheet on or off per player", () => {
  it("the DM turns it off for one player or everyone; the sheet is kept but hidden", () => {
    let g = table();
    g = run(g, { type: "me.sheet", patch: { cls: "Cleric" } }, as("p1"));
    g = run(g, { type: "sheet.enable", playerId: "p1", on: false });
    expect(g.players[0].sheetOff).toBe(true);
    expect(g.players[0].sheet?.cls).toBe("Cleric");
    const ph = projectPlayer(g, 1, "p1", []);
    expect(ph.me.sheetOff).toBe(true);
    expect(ph.me.sheet).toBeUndefined();
    expect(() => run(g, { type: "me.sheet", patch: { notes: "x" } }, as("p1"))).toThrow(/turned off/);
    g = run(g, { type: "sheet.enable", on: false });
    expect(g.players.filter((p) => !p.archived).every((p) => p.sheetOff)).toBe(true);
    g = run(g, { type: "sheet.enable", playerId: "p1", on: true });
    expect(g.players[0].sheetOff).toBeUndefined();
    expect(projectPlayer(g, 1, "p1", []).me.sheet?.cls).toBe("Cleric");
  });
});

describe("tap to roll", () => {
  const sword = { id: "a1", name: "Longsword", ability: "str" as const, prof: true, count: 1, sides: 8 as const, dmgMod: true, type: "slashing" };
  const setup = () => {
    let g = table();
    g.players[0].level = 5;
    g = run(g, { type: "me.sheet", patch: { cls: "Fighter", scores: { str: 16, dex: 14 }, skills: { athletics: 1 }, attacks: [sword] } }, as("p1"));
    return g;
  };
  const roll = (g: GameState, cmd: Omit<Extract<Command, { type: "me.sheetRoll" }>, "type">, r = 0.5, now = 5000) => apply(g, { type: "me.sheetRoll", ...cmd } as Command, { now, actor: { role: "player", playerId: "p1" }, rand: () => r }).state;

  it("rolls a skill on the TV with the sheet's bonus and its name", () => {
    const g = roll(setup(), { roll: { kind: "skill", skill: "athletics" }, tv: true });
    // d20 rolls 11 at rand 0.5; Athletics = +3 Str + 3 proficiency.
    expect(g.diceRoll).toMatchObject({ total: 17, plus: 6, label: "Athletics" });
    expect(g.rolls!.at(-1)).toMatchObject({ label: "Athletics", to: "tv", by: "p1" });
    expect(projectTv(g, 1).diceRoll).toMatchObject({ label: "Athletics", total: 17 });
  });

  it("advantage keeps the higher d20, disadvantage the lower", () => {
    let i = 0;
    const seq = [0.1, 0.9];
    const g = apply(setup(), { type: "me.sheetRoll", roll: { kind: "save", ability: "str" }, adv: "adv", tv: false }, { now: 5000, actor: { role: "player", playerId: "p1" }, rand: () => seq[i++ % 2] }).state;
    const r = g.rolls!.at(-1)!;
    expect(r.groups[0].rolls).toEqual([3, 19]);
    expect(r).toMatchObject({ keep: "high", total: 19 + 6, to: "dm" });
    i = 0;
    const g2 = apply(setup(), { type: "me.sheetRoll", roll: { kind: "save", ability: "str" }, adv: "dis", tv: false }, { now: 5000, actor: { role: "player", playerId: "p1" }, rand: () => seq[i++ % 2] }).state;
    expect(g2.rolls!.at(-1)).toMatchObject({ keep: "low", total: 3 + 6 });
    expect(g2.diceRoll).toBeUndefined();
  });

  it("attacks roll to hit, then damage; a critical doubles the dice", () => {
    let g = roll(setup(), { roll: { kind: "attack", attackId: "a1", part: "hit" }, tv: true });
    expect(g.diceRoll).toMatchObject({ label: "Longsword to hit", total: 11 + 6 });
    g = roll(g, { roll: { kind: "attack", attackId: "a1", part: "damage", crit: true }, tv: true }, 0.5, 9000);
    expect(g.diceRoll).toMatchObject({ label: "Longsword damage (critical)", plus: 3 });
    expect(g.diceRoll!.groups).toEqual([{ sides: 8, rolls: [5, 5] }]);
  });

  it("exhaustion comes off d20 tests, and the label says so", () => {
    let g = setup();
    g = run(g, { type: "me.sheet", patch: { exhaustion: 1 } }, as("p1"));
    g = roll(g, { roll: { kind: "check", ability: "dex" }, tv: true });
    expect(g.diceRoll).toMatchObject({ label: "Dexterity check (exhaustion −2)", total: 11 + 2 - 2 });
  });

  it("initiative from the sheet fills it in during Roll initiative", () => {
    let g = setup();
    g = run(g, { type: "fight.start" });
    expect(g.fight?.status).toBe("setup");
    g = roll(g, { roll: { kind: "init" }, tv: true });
    const c = g.fight!.order.find((x) => x.playerId === "p1")!;
    expect(c).toMatchObject({ init: 11 + 2, initRolled: true });
  });

  it("refuses without a sheet, too fast, or a missing attack", () => {
    const g = table();
    expect(() => roll(g, { roll: { kind: "init" }, tv: true })).toThrow(/sheet/);
    const g2 = roll(setup(), { roll: { kind: "init" }, tv: true });
    expect(() => roll(g2, { roll: { kind: "init" }, tv: true }, 0.5, 5500)).toThrow(/One roll/);
    expect(() => roll(setup(), { roll: { kind: "attack", attackId: "zz", part: "hit" }, tv: true })).toThrow(/isn't on your sheet/);
    expect(playerCommand.safeParse({ type: "me.sheetRoll", roll: { kind: "skill", skill: "flying" }, tv: true }).success).toBe(false);
  });
});

describe("spells and features", () => {
  const bless = { id: "s1", name: "Bless", level: 1, srd: "bless", prepared: true, conc: true };
  const bolt = { id: "s2", name: "Fire Bolt", level: 0, srd: "fire-bolt", attack: true, count: 1, sides: 10 as const, scale: true, type: "fire" };
  const cure = { id: "s3", name: "Cure Wounds", level: 1, prepared: true, count: 2, sides: 8 as const, addMod: true, type: "healing" };
  const cleric = (level = 5) => {
    let g = table();
    g.players[0].level = level;
    g = run(g, { type: "me.sheet", patch: { cls: "Cleric", scores: { wis: 16 }, spells: [bless, bolt, cure] } }, as("p1"));
    return g;
  };
  const act = (g: GameState, a: Extract<Command, { type: "me.sheetAct" }>["act"], pid = "p1") => run(g, { type: "me.sheetAct", act: a }, as(pid));

  it("works out slots, spell attack and save DC from the class and level", () => {
    const sh = cleric(5).players[0].sheet!;
    expect(slotsMaxOf(sh, 5)).toEqual([4, 3, 2, 0, 0, 0, 0, 0, 0]);
    // +3 Wis, +3 proficiency.
    expect(spellAttackBonus(sh, 5)).toBe(6);
    expect(spellSaveDc(sh, 5)).toBe(14);
    // Half casters get slots from level 1 (2024); a Warlock's are Pact Magic.
    expect(slotsMaxOf({ ...blankSheet(0), cls: "Paladin" }, 1)).toEqual([2, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(slotsMaxOf({ ...blankSheet(0), cls: "Warlock" }, 5)).toEqual(Array(9).fill(0));
    expect(pactOf({ ...blankSheet(0), cls: "Warlock" }, 5)).toEqual({ count: 2, level: 3 });
    expect(slotsMaxOf({ ...blankSheet(0), cls: "Fighter" }, 5)).toEqual(Array(9).fill(0));
  });

  it("casting uses a slot, and refuses with none left", () => {
    let g = cleric(1);
    g = act(g, { k: "cast", spellId: "s3", use: "slot", slot: 1 });
    g = act(g, { k: "cast", spellId: "s3", use: "slot", slot: 1 });
    expect(g.players[0].sheet!.slotsUsed).toEqual([2, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(() => act(g, { k: "cast", spellId: "s3", use: "slot", slot: 1 })).toThrow(/No 1st level slots left/);
    expect(() => act(g, { k: "cast", spellId: "s3", use: "slot", slot: 2 })).toThrow(/no 2nd level slots/);
    // Tapping a pip gives one back.
    g = act(g, { k: "slot", level: 1, delta: -1 });
    expect(g.players[0].sheet!.slotsUsed![0]).toBe(1);
  });

  it("concentration shows in an open fight, and the fight ending it clears the sheet", () => {
    let g = cleric();
    g = run(g, { type: "fight.start" });
    g = act(g, { k: "cast", spellId: "s1", use: "slot", slot: 2 });
    const c = () => g.fight!.order.find((x) => x.playerId === "p1")!;
    expect(g.players[0].sheet!.conc).toBe("Bless");
    expect(c().concentrating).toBe(true);
    g = run(g, { type: "fight.patch", combatantIds: [c().id], patch: { concentrating: false } });
    expect(g.players[0].sheet!.conc).toBeUndefined();
    // Concentrating before a fight carries into it.
    let h = cleric();
    h = act(h, { k: "cast", spellId: "s1", use: "slot", slot: 1 });
    h = run(h, { type: "fight.start" });
    expect(h.fight!.order.find((x) => x.playerId === "p1")!.concentrating).toBe(true);
    h = act(h, { k: "endConc" });
    expect(h.fight!.order.find((x) => x.playerId === "p1")!.concentrating).toBe(false);
  });

  it("spell rolls: attack with the casting bonus, cantrip dice grow with level, healing adds the modifier", () => {
    const r = (g: GameState, roll: Extract<Command, { type: "me.sheetRoll" }>["roll"]) => apply(g, { type: "me.sheetRoll", roll, tv: true }, { now: 5000, actor: { role: "player", playerId: "p1" }, rand: () => 0.5 }).state.diceRoll;
    expect(r(cleric(5), { kind: "spell", spellId: "s2", part: "hit" })).toMatchObject({ label: "Fire Bolt spell attack", total: 11 + 6 });
    expect(r(cleric(5), { kind: "spell", spellId: "s2", part: "damage" })!.groups).toEqual([{ sides: 10, rolls: [6, 6] }]);
    expect(r(cleric(4), { kind: "spell", spellId: "s2", part: "damage" })!.groups).toEqual([{ sides: 10, rolls: [6] }]);
    expect(r(cleric(5), { kind: "spell", spellId: "s3", part: "damage" })).toMatchObject({ label: "Cure Wounds", plus: 3, total: 5 + 5 + 3 });
  });

  it("class features count uses by level; rests bring them back", () => {
    let g = table();
    g.players[0].level = 4;
    g = run(g, { type: "me.sheet", patch: { cls: "Fighter", features: [featureFrom("secondwind", "f1"), featureFrom("actionsurge", "f2"), { id: "f3", name: "Wand", max: 7, used: 0, reset: "none" }] } }, as("p1"));
    const sh = () => g.players[0].sheet!;
    expect(featureNow(sh(), sh().features![0], 4)).toMatchObject({ max: 3, reset: "short1" });
    expect(suggestedFeatures(sh(), 9)).toEqual(["indomitable"]);
    for (const id of ["f1", "f1", "f2", "f3"]) g = act(g, { k: "feature", featureId: id, delta: 1 });
    expect(() => act(g, { k: "feature", featureId: "f2", delta: 1 })).toThrow(/No Action Surge left/);
    g = run(g, { type: "party.shortRest" });
    expect(sh().features!.map((f) => f.used)).toEqual([1, 0, 1]);
    expect(g.notes!.at(-1)!.text).toBe("The party took a short rest.");
    g = run(g, { type: "party.longRest" });
    expect(sh().features!.map((f) => f.used)).toEqual([0, 0, 1]);
  });

  it("a short rest gives back Pact slots; a long rest every slot and ends concentration", () => {
    let g = table();
    g.players[0].level = 5;
    g = run(g, { type: "me.sheet", patch: { cls: "Warlock", spells: [{ ...bless, id: "s1" }] } }, as("p1"));
    g = act(g, { k: "cast", spellId: "s1", use: "pact" });
    expect(g.players[0].sheet).toMatchObject({ pactUsed: 1, conc: "Bless" });
    g = run(g, { type: "party.shortRest" });
    expect(g.players[0].sheet!.pactUsed).toBeUndefined();
    expect(g.players[0].sheet!.conc).toBe("Bless");
    g = run(g, { type: "party.longRest" });
    expect(g.players[0].sheet!.conc).toBeUndefined();
  });

  it("spending a hit die rolls it plus Con and heals", () => {
    let g = table();
    g.players[0].level = 3;
    g = run(g, { type: "me.sheet", patch: { cls: "Fighter", scores: { con: 14 } } }, as("p1"));
    g = run(g, { type: "me.hp", max: 30, cur: 10 }, as("p1"));
    g = apply(g, { type: "me.hitDie", tv: true }, { now: 5000, actor: { role: "player", playerId: "p1" }, rand: () => 0.5 }).state;
    // d10 rolls 6, +2 Con.
    expect(g.players[0].hp).toMatchObject({ cur: 18 });
    expect(g.players[0].sheet!.hitDiceSpent).toBe(1);
    expect(g.diceRoll).toMatchObject({ label: "Hit die", total: 8 });
    g = run(g, { type: "fight.start" });
    expect(() => apply(g, { type: "me.hitDie", tv: true }, { now: 9000, actor: { role: "player", playerId: "p1" }, rand: () => 0.5 })).toThrow(/after the fight/);
  });

  it("the DM can use a slot on a player's sheet; the lock keeps slots by hand but not spells", () => {
    let g = cleric(3);
    g = run(g, { type: "sheet.act", playerId: "p1", act: { k: "slot", level: 2, delta: 1 } });
    expect(g.players[0].sheet!.slotsUsed![1]).toBe(1);
    g = run(g, { type: "sheet.lock", playerId: "p1", on: true });
    expect(() => run(g, { type: "me.sheet", patch: { slotsMax: [9, 0, 0, 0, 0, 0, 0, 0, 0] } }, as("p1"))).toThrow(/locked/);
    g = run(g, { type: "me.sheet", patch: { spells: [bless] } }, as("p1"));
    expect(g.players[0].sheet!.spells).toHaveLength(1);
    expect(playerCommand.safeParse({ type: "sheet.act", playerId: "p1", act: { k: "endConc" } }).success).toBe(false);
  });
});

describe("inventory", () => {
  const chain = { id: "i1", name: "Chain Mail", qty: 1, kind: "armor" as const, armorBase: 16, armorDex: "none" as const, weight: 55 };
  const leather = { id: "i2", name: "Leather Armor", qty: 1, kind: "armor" as const, armorBase: 11, armorDex: "full" as const };
  const shield = { id: "i3", name: "Shield", qty: 1, kind: "shield" as const, armorBase: 2, weight: 6 };
  const rapier = { id: "i4", name: "Rapier +1", qty: 1, kind: "weapon" as const, count: 1, sides: 8 as const, dtype: "piercing", finesse: true, bonus: 1 };
  const ring = { id: "i5", name: "Ring of Protection", qty: 1, kind: "magic" as const, attune: true, acPlus: 1 };
  const potion = { id: "i6", name: "Potion of Healing", qty: 2, kind: "gear" as const, weight: 0.5 };
  const act = (g: GameState, a: Extract<Command, { type: "me.sheetAct" }>["act"]) => run(g, { type: "me.sheetAct", act: a }, as("p1"));
  const setup = () => {
    let g = table();
    g.players[0].level = 5;
    g = run(g, { type: "me.sheet", patch: { cls: "Fighter", scores: { str: 12, dex: 16 }, items: [chain, leather, shield, rapier, ring, potion] } }, as("p1"));
    return g;
  };

  it("worn armor and shield set AC; one suit at a time; attuned items count", () => {
    let g = setup();
    const ac = () => sheetNumbers(g.players[0].sheet!, 5);
    expect(ac()).toMatchObject({ ac: 13, acFrom: "no armor" });
    g = act(g, { k: "equip", itemId: "i1", on: true });
    g = act(g, { k: "equip", itemId: "i3", on: true });
    expect(ac()).toMatchObject({ ac: 18, acFrom: "Chain Mail + shield" });
    g = act(g, { k: "equip", itemId: "i2", on: true });
    expect(g.players[0].sheet!.items!.find((x) => x.id === "i1")!.equipped).toBeUndefined();
    expect(ac().ac).toBe(11 + 3 + 2);
    g = act(g, { k: "equip", itemId: "i5", on: true });
    expect(ac().ac).toBe(16);
    g = act(g, { k: "attune", itemId: "i5", on: true });
    expect(ac().ac).toBe(17);
    // A typed AC still wins.
    g = run(g, { type: "me.sheet", patch: { ac: 20 } }, as("p1"));
    expect(ac().ac).toBe(20);
    // Unarmored Defense.
    expect(sheetNumbers({ ...blankSheet(0), cls: "Barbarian", scores: { str: 10, dex: 14, con: 16, int: 10, wis: 10, cha: 10 } }, 1)).toMatchObject({ ac: 15, acFrom: "Unarmored Defense" });
  });

  it("a wielded weapon is an attack with finesse and its magic bonus", () => {
    let g = act(setup(), { k: "equip", itemId: "i4", on: true });
    g = apply(g, { type: "me.sheetRoll", roll: { kind: "attack", attackId: "i4", part: "hit" }, tv: true }, { now: 5000, actor: { role: "player", playerId: "p1" }, rand: () => 0.5 }).state;
    // d20 11, Dex +3 (finesse beats Str +1), proficiency +3, +1 weapon.
    expect(g.diceRoll).toMatchObject({ label: "Rapier +1 to hit", total: 11 + 7 });
  });

  it("attunement stops at three; using the last one removes it", () => {
    let g = setup();
    const more = [1, 2, 3].map((n) => ({ id: `m${n}`, name: `Charm ${n}`, qty: 1, kind: "magic" as const, attune: true }));
    g = run(g, { type: "me.sheet", patch: { items: [...g.players[0].sheet!.items!, ...more] } }, as("p1"));
    for (const id of ["m1", "m2", "m3"]) g = act(g, { k: "attune", itemId: id, on: true });
    expect(() => act(g, { k: "attune", itemId: "i5", on: true })).toThrow(/attuned to 3/);
    g = act(g, { k: "qty", itemId: "i6", delta: -1 });
    g = act(g, { k: "qty", itemId: "i6", delta: -1 });
    expect(g.players[0].sheet!.items!.some((x) => x.id === "i6")).toBe(false);
  });

  it("gives items to another player's sheet, and refuses one without a sheet", () => {
    let g = setup();
    expect(() => run(g, { type: "me.giveItem", itemId: "i6", toPlayerId: "p2", qty: 1 }, as("p1"))).toThrow(/doesn't keep a sheet/);
    g = run(g, { type: "me.sheet", patch: {} }, as("p2"));
    g = run(g, { type: "me.giveItem", itemId: "i6", toPlayerId: "p2", qty: 1 }, as("p1"));
    expect(g.players[0].sheet!.items!.find((x) => x.id === "i6")!.qty).toBe(1);
    expect(g.players[1].sheet!.items).toMatchObject([{ name: "Potion of Healing", qty: 1 }]);
    expect(() => run(g, { type: "me.giveItem", itemId: "i6", toPlayerId: "p2", qty: 5 }, as("p1"))).toThrow(/only have 1/);
    expect(projectPlayer(g, 1, "p1", []).purse.find((x) => x.id === "p2")).toMatchObject({ sheet: true });
  });

  it("a shop purchase lands in the inventory with SRD weapon numbers, and stacks", () => {
    let g = table();
    g = run(g, { type: "me.sheet", patch: {} }, as("p1"));
    const base = g.items.find((x) => x.tier === "sale" && x.kind === "purchase" && x.stock === null && !x.renown && !x.trust)!;
    const item = { ...structuredClone(base), id: "sword", name: "Longsword", category: "gear" as const, priceCp: 100, effects: undefined, keep: undefined };
    g.items.push(item);
    g.players[0].balanceCp = 100000;
    for (let i = 0; i < 2; i++) g = run(g, { type: "money.buy", playerId: "p1", itemId: "sword" } as Command);
    expect(g.players[0].sheet!.items).toMatchObject([{ name: "Longsword", qty: 2, kind: "weapon", count: 1, sides: 8, dtype: "slashing", from: item.id }]);
  });
});
