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

/** Where a typed "extra" can go: on a save, a skill, initiative or passive Perception. */
export type ExtraKey = `save.${Ability}` | `skill.${SkillId}` | "init" | "passive";
export const EXTRA_KEY_RE = new RegExp(`^(save\\.(${ABILITIES.join("|")})|skill\\.(${SKILL_IDS.join("|")})|init|passive)$`);

export interface CharacterSheet {
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

export function armorClass(sheet: CharacterSheet): number {
  return sheet.ac ?? 10 + mod(sheet.scores.dex);
}

export function speedOf(sheet: CharacterSheet): number {
  return sheet.speed ?? 30;
}

/** Everything the sheet works out, in one place (the phone, the DM's drawer and the fight screen read this). */
export function sheetNumbers(sheet: CharacterSheet, level: number | undefined) {
  return {
    prof: proficiency(level),
    ac: armorClass(sheet),
    acWorkedOut: sheet.ac === undefined,
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
  })
  .partial();
export type SheetPatch = z.infer<typeof sheetPatch>;

/** Fields a locked sheet keeps (the DM locks them after session 0). HP, conditions, hit dice and notes stay open. */
export const LOCKED_FIELDS = ["cls", "subclass", "species", "background", "scores", "saves", "skills", "extra", "hitDie"] as const satisfies readonly (keyof SheetPatch)[];

export const sheetDmCommands = [
  /** Change any part of a player's sheet (starts one if they have none). */
  z.object({ type: z.literal("sheet.update"), playerId: id, patch: sheetPatch }),
  /** Take a player's sheet away (they're back on D&D Beyond, or it was started by mistake). */
  z.object({ type: z.literal("sheet.remove"), playerId: id }),
  /** Lock class, scores and proficiencies on one sheet, or (no playerId) on every sheet there is now. */
  z.object({ type: z.literal("sheet.lock"), playerId: id.optional(), on: z.boolean() }),
] as const;

export const sheetPlayerCommands = [
  /** Change my sheet. starter: start it from my Arrival starting point (only when I have none). */
  z.object({ type: z.literal("me.sheet"), patch: sheetPatch, starter: z.boolean().optional() }),
] as const;

export type SheetDmCommand = z.infer<(typeof sheetDmCommands)[number]>;
export type SheetPlayerCommand = z.infer<(typeof sheetPlayerCommands)[number]>;
export type SheetCommand = SheetDmCommand | SheetPlayerCommand;

export function isSheetCommand(cmd: { type: string }): cmd is SheetCommand {
  return cmd.type.startsWith("sheet.") || cmd.type === "me.sheet";
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

export function applySheet(s: GameState, cmd: SheetCommand, h: { actor: { role: string; playerId?: string }; now: number; fail: (m: string) => never }) {
  const find = (pid: string) => s.players.find((p) => p.id === pid) ?? h.fail("That player isn't here.");
  switch (cmd.type) {
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
    case "me.sheet": {
      const p = find(h.actor.role === "player" ? (h.actor.playerId ?? "") : "");
      p.sheet ??= cmd.starter ? sheetFromStarter(p.arrival?.pick, h.now) : blankSheet(h.now);
      patchSheet(p.sheet, cmd.patch, { locked: !!p.sheet.locked, now: h.now, fail: h.fail });
      syncInitiative(s, p);
      return;
    }
  }
}

/** A long rest (2024 rules): every spent hit die back, and one level of exhaustion off. */
export function restSheet(p: Player) {
  const sh = p.sheet;
  if (!sh) return;
  delete sh.hitDiceSpent;
  if (sh.exhaustion) {
    if (sh.exhaustion > 1) sh.exhaustion -= 1;
    else delete sh.exhaustion;
  }
}
