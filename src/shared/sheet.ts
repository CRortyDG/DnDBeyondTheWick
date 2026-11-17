// Character sheets: the app's own sheet, for players who'd rather not use D&D Beyond.
//
// The common math is worked out here (modifiers, proficiency, saves, skills,
// initiative, passive Perception, AC without armor). Anything a feat or a magic
// item changes is a typed "extra" on top, so nothing has to know every rule.
//
// Built-in names and numbers come only from the free System Reference Document
// 5.2 (2024 rules), which is licensed CC-BY-4.0 by Wizards of the Coast:
// https://www.dndbeyond.com/srd. Anything from other books, players type in.

import { z } from "zod";
import type { GameState, Player } from "./types";
import { STARTERS, type StarterId } from "./starters";
import { gearAc, gearPatchShape, giveItem, patchGear, weaponAttacks, type SheetItem } from "./sheetGear";
import { applyAct, castAbilityOf, longRestMagic, magicPatchShape, patchMagic, sheetAct, shortRestMagic, spellAttackBonus, spellDice, type SheetMagic } from "./sheetMagic";

export const ABILITIES = ["str", "dex", "con", "int", "wis", "cha"] as const;
export type Ability = (typeof ABILITIES)[number];
export const ABILITY_NAME: Record<Ability, string> = { str: "Strength", dex: "Dexterity", con: "Constitution", int: "Intelligence", wis: "Wisdom", cha: "Charisma" };
export const ABILITY_SHORT: Record<Ability, string> = { str: "STR", dex: "DEX", con: "CON", int: "INT", wis: "WIS", cha: "CHA" };

export const SKILLS = [
  { id: "acrobatics", name: "Acrobatics", ability: "dex" },
  { id: "animal", name: "Animal Handling", ability: "wis" },
  { id: "arcana", name: "Arcana", ability: "int" },
  { id: "athletics", name: "Athletics", ability: "str" },
  { id: "deception", name: "Deception", ability: "cha" },
  { id: "history", name: "History", ability: "int" },
  { id: "insight", name: "Insight", ability: "wis" },
  { id: "intimidation", name: "Intimidation", ability: "cha" },
  { id: "investigation", name: "Investigation", ability: "int" },
  { id: "medicine", name: "Medicine", ability: "wis" },
  { id: "nature", name: "Nature", ability: "int" },
  { id: "perception", name: "Perception", ability: "wis" },
  { id: "performance", name: "Performance", ability: "cha" },
  { id: "persuasion", name: "Persuasion", ability: "cha" },
  { id: "religion", name: "Religion", ability: "int" },
  { id: "sleight", name: "Sleight of Hand", ability: "dex" },
  { id: "stealth", name: "Stealth", ability: "dex" },
  { id: "survival", name: "Survival", ability: "wis" },
] as const satisfies readonly { id: string; name: string; ability: Ability }[];
export type SkillId = (typeof SKILLS)[number]["id"];
export const SKILL_IDS = SKILLS.map((s) => s.id) as [SkillId, ...SkillId[]];

export type HitDie = 6 | 8 | 10 | 12;
export const HIT_DICE: HitDie[] = [6, 8, 10, 12];

/** The SRD 5.2 classes: hit die and saving throw proficiencies. */
export const CLASSES: { name: string; hitDie: HitDie; saves: [Ability, Ability] }[] = [
  { name: "Barbarian", hitDie: 12, saves: ["str", "con"] },
  { name: "Bard", hitDie: 8, saves: ["dex", "cha"] },
  { name: "Cleric", hitDie: 8, saves: ["wis", "cha"] },
  { name: "Druid", hitDie: 8, saves: ["int", "wis"] },
  { name: "Fighter", hitDie: 10, saves: ["str", "con"] },
  { name: "Monk", hitDie: 8, saves: ["str", "dex"] },
  { name: "Paladin", hitDie: 10, saves: ["wis", "cha"] },
  { name: "Ranger", hitDie: 10, saves: ["str", "dex"] },
  { name: "Rogue", hitDie: 8, saves: ["dex", "int"] },
  { name: "Sorcerer", hitDie: 6, saves: ["con", "cha"] },
  { name: "Warlock", hitDie: 8, saves: ["wis", "cha"] },
  { name: "Wizard", hitDie: 6, saves: ["int", "wis"] },
];
/** The SRD 5.2 species and backgrounds: suggestions only, anything can be typed. */
export const SPECIES = ["Dragonborn", "Dwarf", "Elf", "Gnome", "Goliath", "Halfling", "Human", "Orc", "Tiefling"];
export const BACKGROUNDS = ["Acolyte", "Criminal", "Sage", "Soldier"];

export const CONDITIONS = [
  "blinded",
  "charmed",
  "deafened",
  "frightened",
  "grappled",
  "incapacitated",
  "invisible",
  "paralyzed",
  "petrified",
  "poisoned",
  "prone",
  "restrained",
  "stunned",
  "unconscious",
] as const;
export type ConditionId = (typeof CONDITIONS)[number];
export const EXHAUSTION_MAX = 6;

export const SCORE_MIN = 1;
export const SCORE_MAX = 30;
export const EXTRA_MAX = 20;
export const TRAITS_MAX = 4000;
export const PROFS_MAX = 1500;
export const SHEET_NOTES_MAX = 4000;
export const NAME_FIELD_MAX = 40;

export const ATTACKS_MAX = 12;
export const DAMAGE_DICE = [4, 6, 8, 10, 12] as const;
export type DamageDie = (typeof DAMAGE_DICE)[number];

/** A weapon or spell attack: to-hit from an ability and proficiency, damage dice plus the same ability. */
export interface SheetAttack {
  id: string;
  name: string;
  /** "none": no ability (a flat bonus only). */
  ability: Ability | "none";
  /** Adds proficiency to hit. */
  prof: boolean;
  /** Typed on top of the to-hit (a +1 weapon). */
  hit?: number;
  /** Damage dice: count d sides. count 0: no damage roll. */
  count: number;
  sides: DamageDie;
  /** Adds the ability modifier to damage (weapons yes, most cantrips no). */
  dmgMod: boolean;
  /** Typed on top of the damage. */
  dmg?: number;
  /** "slashing", "fire". */
  type?: string;
}

/** Where a typed "extra" can go: on a save, a skill, initiative, passive Perception, spell attack or spell save DC. */
export type ExtraKey = `save.${Ability}` | `skill.${SkillId}` | "init" | "passive" | "spellAtk" | "spellDc";
export const EXTRA_KEY_RE = new RegExp(`^(save\\.(${ABILITIES.join("|")})|skill\\.(${SKILL_IDS.join("|")})|init|passive|spellAtk|spellDc)$`);

export interface CharacterSheet extends SheetMagic {
  cls?: string;
  subclass?: string;
  species?: string;
  background?: string;
  scores: Record<Ability, number>;
  /** Saving throws they're proficient in. */
  saves: Ability[];
  /** 1: proficient, 2: expertise. Missing: neither. */
  skills: Partial<Record<SkillId, 1 | 2>>;
  /** Typed on top of the worked-out number (a feat, a magic item). */
  extra?: Partial<Record<ExtraKey, number>>;
  /** Armor Class as they wear it now. Missing: 10 + Dexterity (no armor). */
  ac?: number;
  /** Feet. Missing: 30. */
  speed?: number;
  /** Missing: from the class. */
  hitDie?: HitDie;
  /** Hit dice used since the last long rest. They have one per level. */
  hitDiceSpent?: number;
  conditions?: ConditionId[];
  /** 0-6. */
  exhaustion?: number;
  /** Features and traits, as they want them written. */
  traits?: string;
  /** Armor, weapons, tools and languages. */
  profs?: string;
  notes?: string;
  attacks?: SheetAttack[];
  /** Inventory (phase 4). */
  items?: SheetItem[];
  /** The DM locked class, scores and proficiencies (after session 0). */
  locked?: boolean;
  updatedAt: number;
}

// ---------------------------------------------------------------------------
// The math

export function mod(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function signed(n: number): string {
  return n >= 0 ? `+${n}` : `−${-n}`;
}

/** Level 1-4 +2, 5-8 +3, 9-12 +4, 13-16 +5, 17-20 +6. No level yet counts as 1. */
export function proficiency(level: number | undefined): number {
  const l = Math.min(20, Math.max(1, level ?? 1));
  return 2 + Math.floor((l - 1) / 4);
}

export function classOf(sheet: Pick<CharacterSheet, "cls">) {
  const c = sheet.cls?.trim().toLowerCase();
  return c ? CLASSES.find((x) => x.name.toLowerCase() === c) : undefined;
}

export function hitDieOf(sheet: Pick<CharacterSheet, "cls" | "hitDie">): HitDie | undefined {
  return sheet.hitDie ?? classOf(sheet)?.hitDie;
}

const extraOf = (sheet: CharacterSheet, k: ExtraKey) => sheet.extra?.[k] ?? 0;

export function saveBonus(sheet: CharacterSheet, a: Ability, level: number | undefined): number {
  return mod(sheet.scores[a]) + (sheet.saves.includes(a) ? proficiency(level) : 0) + extraOf(sheet, `save.${a}`);
}

export function skillBonus(sheet: CharacterSheet, id: SkillId, level: number | undefined): number {
  const sk = SKILLS.find((s) => s.id === id)!;
  return mod(sheet.scores[sk.ability]) + (sheet.skills[id] ?? 0) * proficiency(level) + extraOf(sheet, `skill.${id}`);
}

export function initiativeOf(sheet: CharacterSheet): number {
  return mod(sheet.scores.dex) + extraOf(sheet, "init");
}

export function passivePerception(sheet: CharacterSheet, level: number | undefined): number {
  return 10 + skillBonus(sheet, "perception", level) + extraOf(sheet, "passive");
}

/** Typed AC wins; otherwise worn armor and shields, or unarmored. */
export function armorClass(sheet: CharacterSheet): number {
  return sheet.ac ?? gearAc(sheet).ac;
}

/** Weapons from the inventory, then typed attacks. */
export function allAttacks(sheet: CharacterSheet): SheetAttack[] {
  return [...weaponAttacks(sheet), ...(sheet.attacks ?? [])];
}

export function speedOf(sheet: CharacterSheet): number {
  return sheet.speed ?? 30;
}

export function attackBonus(sheet: CharacterSheet, a: SheetAttack, level: number | undefined): number {
  return (a.ability === "none" ? 0 : mod(sheet.scores[a.ability])) + (a.prof ? proficiency(level) : 0) + (a.hit ?? 0);
}

export function damagePlus(sheet: CharacterSheet, a: SheetAttack): number {
  return (a.dmgMod && a.ability !== "none" ? mod(sheet.scores[a.ability]) : 0) + (a.dmg ?? 0);
}

/** "1d8 + 3 slashing". */
export function damageText(sheet: CharacterSheet, a: SheetAttack): string {
  if (!a.count) return "";
  const p = damagePlus(sheet, a);
  return `${a.count}d${a.sides}${p ? ` ${p > 0 ? "+" : "\u2212"} ${Math.abs(p)}` : ""}${a.type ? ` ${a.type}` : ""}`;
}

/** Each level of exhaustion takes 2 off every d20 test (2024 rules). */
export function exhaustionPenalty(sheet: CharacterSheet): number {
  return 2 * (sheet.exhaustion ?? 0);
}

export type SheetRoll =
  | { kind: "check"; ability: Ability }
  | { kind: "save"; ability: Ability }
  | { kind: "skill"; skill: SkillId }
  | { kind: "init" }
  | { kind: "attack"; attackId: string; part: "hit" | "damage"; crit?: boolean }
  | { kind: "spell"; spellId: string; part: "hit" | "damage"; crit?: boolean };

/** What a tap on the sheet rolls: a d20 test (with its bonus) or damage dice, and its name. */
export function rollSpec(sheet: CharacterSheet, level: number | undefined, r: SheetRoll): { label: string; d20: true; plus: number } | { label: string; d20: false; count: number; sides: DamageDie; plus: number } | null {
  const ex = exhaustionPenalty(sheet);
  const d20 = (label: string, bonus: number) => ({ label: ex ? `${label} (exhaustion \u2212${ex})` : label, d20: true as const, plus: bonus - ex });
  switch (r.kind) {
    case "check":
      return d20(`${ABILITY_NAME[r.ability]} check`, mod(sheet.scores[r.ability]));
    case "save":
      return d20(`${ABILITY_NAME[r.ability]} save`, saveBonus(sheet, r.ability, level));
    case "skill":
      return d20(SKILLS.find((s) => s.id === r.skill)!.name, skillBonus(sheet, r.skill, level));
    case "init":
      return d20("Initiative", initiativeOf(sheet));
    case "attack": {
      const a = allAttacks(sheet).find((x) => x.id === r.attackId);
      if (!a) return null;
      if (r.part === "hit") return d20(`${a.name} to hit`, attackBonus(sheet, a, level));
      if (!a.count) return null;
      return { label: `${a.name} damage${r.crit ? " (critical)" : ""}`, d20: false, count: a.count * (r.crit ? 2 : 1), sides: a.sides, plus: damagePlus(sheet, a) };
    }
    case "spell": {
      const sp = sheet.spells?.find((x) => x.id === r.spellId);
      if (!sp) return null;
      if (r.part === "hit") return d20(`${sp.name} spell attack`, spellAttackBonus(sheet, level));
      const d = spellDice(sheet, sp, level);
      if (!d) return null;
      return { label: `${sp.name}${r.crit ? " (critical)" : ""}`, d20: false, count: d.count * (r.crit ? 2 : 1), sides: d.sides, plus: d.plus };
    }
  }
}

/** Everything the sheet works out, in one place (the phone, the DM's drawer and the fight screen read this). */
export function sheetNumbers(sheet: CharacterSheet, level: number | undefined) {
  return {
    prof: proficiency(level),
    ac: armorClass(sheet),
    acWorkedOut: sheet.ac === undefined,
    acFrom: sheet.ac === undefined ? gearAc(sheet).from : "typed",
    init: initiativeOf(sheet),
    speed: speedOf(sheet),
    passive: passivePerception(sheet, level),
    hitDie: hitDieOf(sheet),
    hitDice: Math.max(1, level ?? 1),
    hitDiceLeft: Math.max(0, Math.max(1, level ?? 1) - (sheet.hitDiceSpent ?? 0)),
  };
}

// ---------------------------------------------------------------------------
// Starting a sheet

const BLANK_SCORES: Record<Ability, number> = { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };

export function blankSheet(now: number): CharacterSheet {
  return { scores: { ...BLANK_SCORES }, saves: [], skills: {}, updatedAt: now };
}

/** Which ability each starter's "best" names. */
const BEST: Record<string, Ability> = { Strength: "str", Dexterity: "dex", Constitution: "con", Intelligence: "int", Wisdom: "wis", Charisma: "cha" };
/** After the best one, where the rest of the standard array goes (our own suggestion, changeable). */
const ORDER: Record<string, Ability[]> = {
  Fighter: ["str", "con", "dex", "wis", "cha", "int"],
  Rogue: ["dex", "con", "wis", "int", "cha", "str"],
  Wizard: ["int", "con", "dex", "wis", "cha", "str"],
  Cleric: ["wis", "con", "str", "cha", "dex", "int"],
  Druid: ["wis", "con", "dex", "int", "cha", "str"],
  Bard: ["cha", "dex", "con", "wis", "int", "str"],
};
export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];

/** A first sheet from a starting point on the Arrival seat page: class, species, background, scores and saves filled in. */
export function sheetFromStarter(id: StarterId | string | undefined, now: number): CharacterSheet {
  const st = STARTERS.find((x) => x.id === id);
  if (!st) return blankSheet(now);
  const best = BEST[st.best] ?? "str";
  const order = ORDER[st.dnd.cls] ?? [best, "con", "dex", "wis", "cha", "int"];
  const ranked = [best, ...order.filter((a) => a !== best)];
  const scores = { ...BLANK_SCORES };
  ranked.forEach((a, i) => (scores[a] = STANDARD_ARRAY[i]));
  const cls = CLASSES.find((c) => c.name === st.dnd.cls);
  return { cls: st.dnd.cls, species: st.dnd.species, background: st.dnd.background, scores, saves: cls ? [...cls.saves] : [], skills: {}, updatedAt: now };
}

// ---------------------------------------------------------------------------
// Commands

const id = z.string().min(1).max(64);
const line = z.string().max(NAME_FIELD_MAX);
const score = z.number().int().min(SCORE_MIN).max(SCORE_MAX);
const ability = z.enum(ABILITIES);

const attackBody = z.object({
  id: z.string().regex(/^[A-Za-z0-9_-]{1,24}$/),
  name: z.string().max(NAME_FIELD_MAX),
  ability: z.enum([...ABILITIES, "none"]),
  prof: z.boolean(),
  hit: z.number().int().min(-EXTRA_MAX).max(EXTRA_MAX).optional(),
  count: z.number().int().min(0).max(10),
  sides: z.union([z.literal(4), z.literal(6), z.literal(8), z.literal(10), z.literal(12)]),
  dmgMod: z.boolean(),
  dmg: z.number().int().min(-EXTRA_MAX).max(EXTRA_MAX).optional(),
  type: z.string().max(20).optional(),
});

export const sheetPatch = z
  .object({
    cls: line,
    subclass: line,
    species: line,
    background: line,
    scores: z.object({ str: score, dex: score, con: score, int: score, wis: score, cha: score }).partial(),
    saves: z.array(ability).max(6),
    /** 0 takes it away. */
    skills: z.partialRecord(z.enum(SKILL_IDS), z.union([z.literal(0), z.literal(1), z.literal(2)])),
    /** 0 takes it away. */
    extra: z.record(z.string().regex(EXTRA_KEY_RE), z.number().int().min(-EXTRA_MAX).max(EXTRA_MAX)),
    /** null: back to 10 + Dexterity. */
    ac: z.number().int().min(0).max(50).nullable(),
    speed: z.number().int().min(0).max(300).nullable(),
    hitDie: z.union([z.literal(6), z.literal(8), z.literal(10), z.literal(12)]).nullable(),
    hitDiceSpent: z.number().int().min(0).max(20),
    conditions: z.array(z.enum(CONDITIONS)).max(CONDITIONS.length),
    exhaustion: z.number().int().min(0).max(EXHAUSTION_MAX),
    traits: z.string().max(TRAITS_MAX),
    profs: z.string().max(PROFS_MAX),
    notes: z.string().max(SHEET_NOTES_MAX),
    /** The whole list, in order. */
    attacks: z.array(attackBody).max(ATTACKS_MAX),
    ...magicPatchShape,
    ...gearPatchShape,
  })
  .partial();
export type SheetPatch = z.infer<typeof sheetPatch>;

/** Fields a locked sheet keeps (the DM locks them after session 0). HP, conditions, hit dice and notes stay open. */
export const LOCKED_FIELDS = ["cls", "subclass", "species", "background", "scores", "saves", "skills", "extra", "hitDie", "castAbility", "slotsMax"] as const satisfies readonly (keyof SheetPatch)[];

export const sheetDmCommands = [
  /** Change any part of a player's sheet (starts one if they have none). */
  z.object({ type: z.literal("sheet.update"), playerId: id, patch: sheetPatch }),
  /** Take a player's sheet away (they're back on D&D Beyond, or it was started by mistake). */
  z.object({ type: z.literal("sheet.remove"), playerId: id }),
  /** Turn the app's sheet on or off for one player, or (no playerId) for everyone. Off keeps any sheet, hidden. */
  z.object({ type: z.literal("sheet.enable"), playerId: id.optional(), on: z.boolean() }),
  /** Lock class, scores and proficiencies on one sheet, or (no playerId) on every sheet there is now. */
  z.object({ type: z.literal("sheet.lock"), playerId: id.optional(), on: z.boolean() }),
  /** Use a slot or a feature, cast a spell, end concentration, on a player's sheet. */
  z.object({ type: z.literal("sheet.act"), playerId: id, act: sheetAct }),
] as const;

const sheetRoll = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("check"), ability }),
  z.object({ kind: z.literal("save"), ability }),
  z.object({ kind: z.literal("skill"), skill: z.enum(SKILL_IDS) }),
  z.object({ kind: z.literal("init") }),
  z.object({ kind: z.literal("attack"), attackId: z.string().min(1).max(24), part: z.enum(["hit", "damage"]), crit: z.boolean().optional() }),
  z.object({ kind: z.literal("spell"), spellId: z.string().min(1).max(24), part: z.enum(["hit", "damage"]), crit: z.boolean().optional() }),
]);

export const sheetPlayerCommands = [
  /** Change my sheet. starter: start it from my Arrival starting point (only when I have none). */
  z.object({ type: z.literal("me.sheet"), patch: sheetPatch, starter: z.boolean().optional() }),
  /** Roll from my sheet: the server works out the bonus. tv: on the TV, or for the DM only. */
  z.object({ type: z.literal("me.sheetRoll"), roll: sheetRoll, adv: z.enum(["adv", "dis"]).optional(), tv: z.boolean() }),
  /** Use a slot or a feature, cast a spell, end concentration. */
  z.object({ type: z.literal("me.sheetAct"), act: sheetAct }),
  /** Spend a hit die: roll it plus Constitution and heal that much (a short rest). */
  z.object({ type: z.literal("me.hitDie"), tv: z.boolean() }),
  /** Hand an item to another player's sheet. */
  z.object({ type: z.literal("me.giveItem"), itemId: z.string().min(1).max(24), toPlayerId: id, qty: z.number().int().min(1).max(999) }),
] as const;

export type SheetDmCommand = z.infer<(typeof sheetDmCommands)[number]>;
export type SheetPlayerCommand = z.infer<(typeof sheetPlayerCommands)[number]>;
export type SheetCommand = SheetDmCommand | Extract<SheetPlayerCommand, { type: "me.sheet" | "me.sheetAct" | "me.giveItem" }>;

export function isSheetCommand(cmd: { type: string }): cmd is SheetCommand {
  return cmd.type.startsWith("sheet.") || cmd.type === "me.sheet" || cmd.type === "me.sheetAct" || cmd.type === "me.giveItem";
}

const clean = (v: string) => v.replace(/\s+/g, " ").trim();
const cleanBlock = (v: string) => v.replace(/\r\n?/g, "\n").replace(/[ \t]+\n/g, "\n").trim();

/** Apply a patch. locked: from a phone on a locked sheet, so the locked fields refuse. */
export function patchSheet(sheet: CharacterSheet, patch: SheetPatch, opts: { locked: boolean; now: number; fail: (m: string) => never }) {
  if (opts.locked && LOCKED_FIELDS.some((k) => patch[k] !== undefined)) opts.fail("The DM has locked class, scores and proficiencies. Ask them to change it.");
  const text = (k: "cls" | "subclass" | "species" | "background") => {
    const v = patch[k];
    if (v === undefined) return;
    const c = clean(v);
    if (c) sheet[k] = c;
    else delete sheet[k];
  };
  const hadClass = classOf(sheet);
  text("cls");
  text("subclass");
  text("species");
  text("background");
  // A first class choice brings its saving throws, unless they've picked their own.
  const nowClass = classOf(sheet);
  if (patch.saves === undefined && nowClass && !hadClass && sheet.saves.length === 0) sheet.saves = [...nowClass.saves];
  if (patch.scores) for (const a of ABILITIES) if (patch.scores[a] !== undefined) sheet.scores[a] = patch.scores[a]!;
  if (patch.saves) sheet.saves = ABILITIES.filter((a) => patch.saves!.includes(a));
  if (patch.skills) {
    for (const [k, v] of Object.entries(patch.skills) as [SkillId, 0 | 1 | 2][]) {
      if (v) sheet.skills[k] = v;
      else delete sheet.skills[k];
    }
  }
  if (patch.extra) {
    const extra = { ...(sheet.extra ?? {}) } as Record<string, number>;
    for (const [k, v] of Object.entries(patch.extra)) {
      if (v) extra[k] = v;
      else delete extra[k];
    }
    if (Object.keys(extra).length) sheet.extra = extra;
    else delete sheet.extra;
  }
  const num = (k: "ac" | "speed" | "hitDie") => {
    const v = patch[k];
    if (v === undefined) return;
    if (v === null) delete sheet[k];
    else (sheet as unknown as Record<string, number>)[k] = v;
  };
  num("ac");
  num("speed");
  num("hitDie");
  if (patch.hitDiceSpent !== undefined) {
    if (patch.hitDiceSpent) sheet.hitDiceSpent = patch.hitDiceSpent;
    else delete sheet.hitDiceSpent;
  }
  if (patch.conditions) {
    const c = CONDITIONS.filter((x) => patch.conditions!.includes(x));
    if (c.length) sheet.conditions = c;
    else delete sheet.conditions;
  }
  if (patch.exhaustion !== undefined) {
    if (patch.exhaustion) sheet.exhaustion = patch.exhaustion;
    else delete sheet.exhaustion;
  }
  if (patch.attacks) {
    const seen = new Set<string>();
    const list: SheetAttack[] = [];
    for (const a of patch.attacks) {
      if (seen.has(a.id)) continue;
      seen.add(a.id);
      const out: SheetAttack = { id: a.id, name: clean(a.name) || "Attack", ability: a.ability, prof: a.prof, count: a.count, sides: a.sides, dmgMod: a.dmgMod };
      if (a.hit) out.hit = a.hit;
      if (a.dmg) out.dmg = a.dmg;
      const t = clean(a.type ?? "");
      if (t) out.type = t;
      list.push(out);
    }
    if (list.length) sheet.attacks = list;
    else delete sheet.attacks;
  }
  patchMagic(sheet, patch);
  patchGear(sheet, patch, opts.fail);
  for (const k of ["traits", "profs", "notes"] as const) {
    const v = patch[k];
    if (v === undefined) continue;
    const c = cleanBlock(v);
    if (c) sheet[k] = c;
    else delete sheet[k];
  }
  sheet.updatedAt = opts.now;
}

/** Initiative in combat mode follows the sheet. */
export function syncInitiative(s: GameState, p: Player) {
  if (!p.sheet) return;
  const v = initiativeOf(p.sheet);
  if (v) p.initBonus = v;
  else delete p.initBonus;
  const c = s.fight?.order.find((x) => x.kind === "player" && x.playerId === p.id);
  if (c && s.fight!.status !== "over") c.initBonus = p.initBonus ?? null;
}

/** Concentration on the sheet shows in an open fight, so a hit reminds them to save. */
function followConc(s: GameState, p: Player, conc: "start" | "end" | undefined) {
  if (!conc) return;
  const f = s.fight;
  const c = f && f.status !== "over" ? f.order.find((x) => x.kind === "player" && x.playerId === p.id) : undefined;
  if (!c) return;
  c.concentrating = conc === "start";
  delete c.concDc;
}

/** After the fight changes: a player whose concentration the fight ended (dropped to 0, the DM untoggled it) loses it on the sheet too. */
export function syncConcFromFight(s: GameState) {
  const f = s.fight;
  if (!f || f.status === "over") return;
  for (const c of f.order) {
    if (c.kind !== "player" || c.concentrating || !c.playerId) continue;
    const p = s.players.find((x) => x.id === c.playerId);
    if (p?.sheet?.conc) delete p.sheet.conc;
  }
}

export function applySheet(s: GameState, cmd: SheetCommand, h: { actor: { role: string; playerId?: string }; now: number; fail: (m: string) => never; info?: (m: string) => void; newId: () => string }) {
  const find = (pid: string) => s.players.find((p) => p.id === pid) ?? h.fail("That player isn't here.");
  switch (cmd.type) {
    case "sheet.enable": {
      const who = cmd.playerId ? [find(cmd.playerId)] : s.players.filter((p) => !p.archived);
      for (const p of who) {
        if (cmd.on) delete p.sheetOff;
        else p.sheetOff = true;
      }
      return;
    }
    case "sheet.lock": {
      const who = cmd.playerId ? [find(cmd.playerId)] : s.players.filter((p) => !p.archived);
      for (const p of who) {
        if (!p.sheet) continue;
        if (cmd.on) p.sheet.locked = true;
        else delete p.sheet.locked;
      }
      return;
    }
    case "sheet.remove": {
      const p = find(cmd.playerId);
      delete p.sheet;
      return;
    }
    case "sheet.update": {
      const p = find(cmd.playerId);
      p.sheet ??= blankSheet(h.now);
      patchSheet(p.sheet, cmd.patch, { locked: false, now: h.now, fail: h.fail });
      syncInitiative(s, p);
      return;
    }
    case "sheet.act": {
      const p = find(cmd.playerId);
      if (!p.sheet) h.fail(`${p.name} has no sheet.`);
      const r = applyAct(p.sheet, p.level, cmd.act, h.fail);
      p.sheet.updatedAt = h.now;
      followConc(s, p, r.conc);
      if (r.info) h.info?.(r.info);
      return;
    }
    case "me.sheetAct": {
      const p = find(h.actor.role === "player" ? (h.actor.playerId ?? "") : "");
      if (!p.sheet || p.sheetOff) h.fail("You don't have a character sheet here.");
      const r = applyAct(p.sheet, p.level, cmd.act, h.fail);
      p.sheet.updatedAt = h.now;
      followConc(s, p, r.conc);
      if (r.info) h.info?.(r.info);
      return;
    }
    case "me.giveItem": {
      const p = find(h.actor.role === "player" ? (h.actor.playerId ?? "") : "");
      if (!p.sheet || p.sheetOff) h.fail("You don't have a character sheet here.");
      const to = s.players.find((x) => x.id === cmd.toPlayerId && !x.archived) ?? h.fail("That player isn't here.");
      if (to.id === p.id) h.fail("That's you.");
      if (!to.sheet || to.sheetOff) h.fail(`${to.character?.trim() || to.name} doesn't keep a sheet in the app. Hand it over at the table instead.`);
      const what = giveItem(p.sheet, to.sheet, cmd.itemId, cmd.qty, h.newId, h.fail);
      p.sheet.updatedAt = to.sheet.updatedAt = h.now;
      h.info?.(`Gave ${what} to ${to.character?.trim() || to.name}.`);
      return;
    }
    case "me.sheet": {
      const p = find(h.actor.role === "player" ? (h.actor.playerId ?? "") : "");
      if (p.sheetOff) h.fail("Character sheets are turned off for you. Ask the DM if you'd like one.");
      p.sheet ??= cmd.starter ? sheetFromStarter(p.arrival?.pick, h.now) : blankSheet(h.now);
      patchSheet(p.sheet, cmd.patch, { locked: !!p.sheet.locked, now: h.now, fail: h.fail });
      syncInitiative(s, p);
      return;
    }
  }
}

/** A long rest (2024 rules): every spent hit die, slot and feature use back, and one level of exhaustion off. */
export function restSheet(p: Player) {
  const sh = p.sheet;
  if (!sh) return;
  longRestMagic(sh, p.level);
  delete sh.hitDiceSpent;
  if (sh.exhaustion) {
    if (sh.exhaustion > 1) sh.exhaustion -= 1;
    else delete sh.exhaustion;
  }
}

/** A short rest: Pact Magic and short-rest features back. Hit dice they spend themselves, from the sheet. */
export function shortRestSheet(p: Player) {
  if (p.sheet) shortRestMagic(p.sheet, p.level);
}

/** Spending a hit die heals its roll plus Constitution (at least 1). */
export function hitDieSpec(sheet: CharacterSheet, level: number | undefined): { sides: HitDie; plus: number } | null {
  const n = sheetNumbers(sheet, level);
  if (!n.hitDie || n.hitDiceLeft <= 0) return null;
  return { sides: n.hitDie, plus: mod(sheet.scores.con) };
}

export { castAbilityOf };
