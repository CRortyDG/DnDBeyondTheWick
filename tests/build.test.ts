// Character sheets, phase 5: the builder makes a sheet the rules allow, and level up takes one level at a time.
import { describe, expect, it } from "vitest";
import { apply, type Ctx } from "@/shared/reducer";
import { seedGame } from "@/shared/seed";
import { hydrate } from "@/server/store";
import { playerCommand, type Command } from "@/shared/commands";
import { sheetNumbers, skillBonus } from "@/shared/sheet";
import { buildSheet, maxHpFor, nextLevel, pointBuyCost, STARTER_BUILDS, type BuildChoices } from "@/shared/sheetBuild";
import { featureNow } from "@/shared/sheetMagic";
import { STARTER_IDS } from "@/shared/starters";
import type { GameState } from "@/shared/types";

const as = (pid: string, now = 2000): Ctx => ({ now, actor: { role: "player", playerId: pid } });
const DM: Ctx = { now: 1000, actor: { role: "dm" } };
const run = (g: GameState, cmd: Command, ctx: Ctx = as("p1")) => apply(g, cmd, { ...ctx, rand: () => 0.5 });
const table = () => hydrate(seedGame("t"))!;
let n = 0;
const h = { now: 0, newId: () => `x${++n}`, fail: (m: string): never => { throw new Error(m); } };

const monk: BuildChoices = {
  cls: "Monk",
  species: "Elf",
  lineage: "High Elf",
  background: "Sage",
  method: "pointbuy",
  base: { str: 8, dex: 15, con: 14, int: 10, wis: 15, cha: 8 },
  bonus: { wis: 2, con: 1 },
  skills: ["acrobatics", "stealth"],
  extraSkills: ["perception"],
  kit: 0,
  bgKit: true,
  spells: [{ id: "s1", name: "Prestidigitation", level: 0, srd: "prestidigitation", note: "High Elf" }],
};

describe("character builder", () => {
  it("a High Elf Monk gets the numbers the rules give", () => {
    expect(pointBuyCost(monk.base)).toBe(27);
    const { sheet, maxHp, gp } = buildSheet(monk, 1, h);
    expect(sheet).toMatchObject({ cls: "Monk", species: "High Elf", background: "Sage", saves: ["str", "dex"], build: { level: 1, species: "Elf", lineage: "High Elf", feats: ["Magic Initiate"] } });
    expect(sheet.scores).toEqual({ str: 8, dex: 15, con: 15, int: 10, wis: 17, cha: 8 });
    // Class picks, background skills and Keen Senses.
    expect(Object.keys(sheet.skills).sort()).toEqual(["acrobatics", "arcana", "history", "perception", "stealth"]);
    // Unarmored Defense: 10 + Dex 2 + Wis 3, no armor in the Monk kit.
    expect(sheetNumbers(sheet, 1)).toMatchObject({ ac: 15, acFrom: "Unarmored Defense", hitDie: 8 });
    expect(maxHp).toBe(8 + 2);
    expect(sheet.items!.map((x) => x.name)).toContain("Spear");
    expect(sheet.items!.find((x) => x.name === "Spear")!.equipped).toBe(true);
    expect(gp).toBe(11 + 8);
    expect(sheet.spells![0]).toMatchObject({ name: "Prestidigitation", level: 0 });
  });

  it("refuses scores and skills the rules don't allow", () => {
    expect(() => buildSheet({ ...monk, base: { ...monk.base, str: 15 } }, 1, h)).toThrow(/Point buy has 27/);
    expect(() => buildSheet({ ...monk, method: "standard" }, 1, h)).toThrow(/standard array/);
    expect(() => buildSheet({ ...monk, bonus: { str: 2, con: 1 } }, 1, h)).toThrow(/raises CON, INT, WIS only/);
    expect(() => buildSheet({ ...monk, bonus: { wis: 2, con: 2 } }, 1, h)).toThrow(/\+2 to one/);
    expect(() => buildSheet({ ...monk, skills: ["arcana", "stealth"] }, 1, h)).toThrow(/can't pick that skill/);
    expect(() => buildSheet({ ...monk, skills: ["acrobatics"] }, 1, h)).toThrow(/picks 2 skills/);
    expect(() => buildSheet({ ...monk, extraSkills: ["athletics"] }, 1, h)).toThrow(/Keen Senses/);
    expect(() => buildSheet({ ...monk, lineage: "Rock Gnome" }, 1, h)).toThrow(/Elven Lineage/);
    expect(() => buildSheet({ ...monk, expertise: ["stealth"] }, 1, h)).toThrow(/doesn't get Expertise/);
  });

  it("builds above level 1 with average HP, a subclass and Ability Score Improvements", () => {
    const { sheet, maxHp } = buildSheet({ ...monk, asi: { wis: 2 } }, 5, h);
    expect(sheet.subclass).toBe("Warrior of the Open Hand");
    expect(sheet.scores.wis).toBe(19);
    expect(maxHp).toBe(10 + 4 * (5 + 2));
    expect(() => buildSheet({ ...monk, asi: { wis: 2, dex: 2 } }, 5, h)).toThrow(/2 Ability Score Improvement points/);
    expect(sheet.features!.map((f) => f.auto)).toEqual(expect.arrayContaining(["focus", "metabolism"]));
  });

  it("Dwarven Toughness, Alert and species resources", () => {
    const healer = buildSheet({ ...STARTER_BUILDS.healer.choices, spells: [] }, 1, h);
    expect(healer.maxHp).toBe(8 + 2 + 1);
    // Chain Shirt (13 + Dex 0) and a shield.
    expect(sheetNumbers(healer.sheet, 1).ac).toBe(15);
    const protector = buildSheet({ ...STARTER_BUILDS.protector.choices, spells: [] }, 1, h);
    expect(protector.sheet.build!.feats).toEqual(["Savage Attacker", "Alert"]);
    expect(sheetNumbers(protector.sheet, 1).init).toBe(1 + 2);
    const orc = buildSheet({ ...STARTER_BUILDS.protector.choices, species: "Orc", extraSkills: [], feat: undefined, spells: [] }, 1, h);
    expect(orc.sheet.features!.map((f) => f.auto).sort()).toEqual(["adrenaline", "relentless", "secondwind"]);
    expect(featureNow(orc.sheet, orc.sheet.features!.find((f) => f.auto === "adrenaline")!, 5).max).toBe(3);
  });

  it("every starter is a legal build", () => {
    for (const id of STARTER_IDS) {
      const b = STARTER_BUILDS[id];
      expect(() => buildSheet({ ...b.choices, spells: [] }, 1, h), id).not.toThrow();
    }
    expect(skillBonus(buildSheet({ ...STARTER_BUILDS.sneak.choices, spells: [] }, 1, h).sheet, "stealth", 1)).toBe(3 + 4);
  });

  it("me.build makes the sheet and sets HP; a locked sheet refuses", () => {
    let g = table();
    expect(playerCommand.safeParse({ type: "me.build", choices: monk }).success).toBe(true);
    const r = run(g, { type: "me.build", choices: monk });
    g = r.state;
    expect(g.players[0].hp).toMatchObject({ cur: 10, max: 10 });
    expect(g.players[0].sheet!.notes).toMatch(/19 GP/);
    expect(r.info).toMatch(/10 HP, AC 15/);
    g = apply(g, { type: "sheet.lock", on: true }, { ...DM, rand: () => 0.5 }).state;
    expect(() => run(g, { type: "me.build", choices: monk })).toThrow(/locked/);
  });

  it("levels up one level at a time after the DM raises it", () => {
    let g = table();
    g = run(g, { type: "me.build", choices: monk }).state;
    expect(() => run(g, { type: "me.levelUp", hp: "avg" })).toThrow(/up to date/);
    g = apply(g, { type: "party.levelUp", levels: [{ playerId: "p1", level: 4 }] }, { ...DM, rand: () => 0.5 }).state;
    expect(nextLevel(g.players[0].sheet!, 4)).toMatchObject({ to: 2, avg: 5 + 2, asi: false, subclass: null });
    g = run(g, { type: "me.levelUp", hp: "avg" }).state;
    expect(g.players[0].hp).toMatchObject({ max: 17, cur: 17 });
    // Focus Points arrive at level 2.
    expect(g.players[0].sheet!.features!.some((f) => f.auto === "focus")).toBe(true);
    // A roll is logged; rand 0.5 on a d8 is 5.
    const r = run(g, { type: "me.levelUp", hp: "roll", subclass: "" });
    g = r.state;
    expect(r.info).toMatch(/Level 3: \+7 HP \(rolled 5\)/);
    expect(g.players[0].sheet!.subclass).toBe("Warrior of the Open Hand");
    expect(g.rolls!.at(-1)).toMatchObject({ label: "Level 3 hit points" });
    // Level 4: an Ability Score Improvement, up to 20, and even on a locked sheet.
    g = apply(g, { type: "sheet.lock", on: true }, { ...DM, rand: () => 0.5 }).state;
    expect(() => run(g, { type: "me.levelUp", hp: "avg", asi: { wis: 2, dex: 1 } })).toThrow(/\+2 to one score/);
    g = run(g, { type: "me.levelUp", hp: "avg", asi: { wis: 2 } }).state;
    expect(g.players[0].sheet!.scores.wis).toBe(19);
    expect(g.players[0].sheet!.build!.level).toBe(4);
    expect(() => run(g, { type: "me.levelUp", hp: "avg" })).toThrow(/up to date/);
  });

  it("works out max HP", () => {
    expect(maxHpFor("Wizard", "Human", 8, 1)).toBe(5);
    expect(maxHpFor("Barbarian", "Dwarf", 16, 3)).toBe(12 + 3 + 2 * (7 + 3) + 3);
  });
});
