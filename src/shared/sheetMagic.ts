// Character sheets, phase 3: spells, spell slots and features with uses per rest.
//
// Slots, spell save DC and spell attack come from the class and level; the
// class tables are the free SRD 5.2 ones (CC-BY-4.0, Wizards of the Coast), in
// srdTables.ts. The spells' full text is only on the phone (client/srd), loaded
// when someone opens the spell picker, so the server and the TV never carry it.
//
// This file imports only types from ./sheet, so the two can't load in a loop.

import { z } from "zod";
import type { Ability, CharacterSheet } from "./sheet";
import { applyGearAct, gearActs } from "./sheetGear";
import { CLASS_COUNTS, SPELLCASTING } from "./srdTables";

const ABIL = ["str", "dex", "con", "int", "wis", "cha"] as const;
const modOf = (score: number) => Math.floor((score - 10) / 2);
const profOf = (level: number | undefined) => 2 + Math.floor((Math.min(20, Math.max(1, level ?? 1)) - 1) / 4);
const lvl = (level: number | undefined) => Math.min(20, Math.max(1, level ?? 1));

export const SPELLS_MAX = 60;
export const FEATURES_MAX = 30;
export const SPELL_NOTE_MAX = 300;
export const FEATURE_NOTE_MAX = 300;
export const USES_MAX = 99;
export const SPELL_DICE = [4, 6, 8, 10, 12] as const;
export type SpellDie = (typeof SPELL_DICE)[number];
export const SPELL_LEVEL_NAME = ["Cantrips", "1st level", "2nd level", "3rd level", "4th level", "5th level", "6th level", "7th level", "8th level", "9th level"];

/** A spell on the sheet. srd: the SRD spell it came from (for its full text), missing for homebrew. */
export interface SheetSpell {
  id: string;
  name: string;
  /** 0: cantrip. */
  level: number;
  srd?: string;
  prepared?: boolean;
  conc?: boolean;
  ritual?: boolean;
  /** Makes a spell attack roll. */
  attack?: boolean;
  /** Targets make this saving throw against the spell save DC. */
  save?: Ability;
  /** Damage or healing dice at its own level: count d sides. */
  count?: number;
  sides?: SpellDie;
  /** Adds the spellcasting modifier (Cure Wounds, some cantrips at higher levels). */
  addMod?: boolean;
  /** A cantrip whose dice grow at levels 5, 11 and 17. */
  scale?: boolean;
  type?: string;
  note?: string;
  /** From a feat or species (Magic Initiate, an Elven Lineage): doesn't count toward the class's cantrips and prepared spells. */
  bonus?: boolean;
}

/** Counts toward the class's cantrips and prepared spells. Sheets built before the bonus flag: Magic Initiate spells said so in their note. */
export const classSpell = (s: Pick<SheetSpell, "bonus" | "note">) => !s.bonus && !/^Magic Initiate\b/.test(s.note ?? "");

/** Class resources the app counts for you, from the SRD class tables. */
export const RESOURCES = {
  rage: { name: "Rage", cls: "Barbarian", from: 1 },
  bardic: { name: "Bardic Inspiration", cls: "Bard", from: 1 },
  "channel-cleric": { name: "Channel Divinity", cls: "Cleric", from: 2 },
  wildshape: { name: "Wild Shape", cls: "Druid", from: 2 },
  secondwind: { name: "Second Wind", cls: "Fighter", from: 1 },
  actionsurge: { name: "Action Surge", cls: "Fighter", from: 2 },
  indomitable: { name: "Indomitable", cls: "Fighter", from: 9 },
  focus: { name: "Focus Points", cls: "Monk", from: 2 },
  metabolism: { name: "Uncanny Metabolism", cls: "Monk", from: 2 },
  layonhands: { name: "Lay on Hands (HP pool)", cls: "Paladin", from: 1 },
  "channel-paladin": { name: "Channel Divinity", cls: "Paladin", from: 3 },
  favored: { name: "Favored Enemy (free Hunter's Mark)", cls: "Ranger", from: 1 },
  innate: { name: "Innate Sorcery", cls: "Sorcerer", from: 1 },
  sorcery: { name: "Sorcery Points", cls: "Sorcerer", from: 2 },
  cunning: { name: "Magical Cunning", cls: "Warlock", from: 2 },
  arcane: { name: "Arcane Recovery", cls: "Wizard", from: 1 },
  // Species traits with uses (cls "": they come from the species instead).
  breath: { name: "Breath Weapon", cls: "", species: "Dragonborn", from: 1 },
  adrenaline: { name: "Adrenaline Rush", cls: "", species: "Orc", from: 1 },
  relentless: { name: "Relentless Endurance", cls: "", species: "Orc", from: 1 },
  giant: { name: "Giant Ancestry", cls: "", species: "Goliath", from: 1 },
  largeform: { name: "Large Form", cls: "", species: "Goliath", from: 5 },
} as const;
export type ResourceKey = keyof typeof RESOURCES;
export const RESOURCE_KEYS = Object.keys(RESOURCES) as [ResourceKey, ...ResourceKey[]];

/** short: all back on a short rest. short1: one back on a short rest, all on a long one. long: all back on a long rest. none: by hand. */
export const RESETS = ["short", "short1", "long", "none"] as const;
export type Reset = (typeof RESETS)[number];
export const RESET_NAME: Record<Reset, string> = { short: "Short rest", short1: "1 per short rest", long: "Long rest", none: "By hand" };

/** A feature with uses: Rage, Second Wind, a magic item's charges. auto: the app keeps max and reset in step with the level. */
export interface SheetFeature {
  id: string;
  name: string;
  max: number;
  used: number;
  reset: Reset;
  auto?: ResourceKey;
  note?: string;
}

/** The magic parts of a sheet (in CharacterSheet). */
export interface SheetMagic {
  /** Missing: from the class. */
  castAbility?: Ability;
  /** Slots per spell level 1-9, typed (multiclass, a feat). Missing: from the class and level. */
  slotsMax?: number[];
  /** Slots used per spell level 1-9. */
  slotsUsed?: number[];
  /** Warlock Pact Magic slots used. */
  pactUsed?: number;
  spells?: SheetSpell[];
  features?: SheetFeature[];
  /** The spell they're concentrating on. */
  conc?: string;
}

const CAST_ABILITY: Record<string, Ability> = { Bard: "cha", Cleric: "wis", Druid: "wis", Paladin: "cha", Ranger: "wis", Sorcerer: "cha", Warlock: "cha", Wizard: "int" };

const className = (sheet: Pick<CharacterSheet, "cls">) => {
  const c = sheet.cls?.trim().toLowerCase();
  return c ? Object.keys(CAST_ABILITY).concat(["Barbarian", "Fighter", "Monk", "Rogue"]).find((x) => x.toLowerCase() === c) : undefined;
};

/** The class's spellcasting row at this level: [cantrips, prepared, slots]. */
export function castingRow(sheet: Pick<CharacterSheet, "cls">, level: number | undefined) {
  const c = className(sheet);
  return c && SPELLCASTING[c] ? SPELLCASTING[c][lvl(level) - 1] : undefined;
}

export function castAbilityOf(sheet: CharacterSheet): Ability | undefined {
  if (sheet.castAbility) return sheet.castAbility;
  const c = className(sheet);
  return c ? CAST_ABILITY[c] : undefined;
}

export function spellAttackBonus(sheet: CharacterSheet, level: number | undefined): number {
  const a = castAbilityOf(sheet);
  return (a ? modOf(sheet.scores[a]) : 0) + profOf(level) + (sheet.extra?.spellAtk ?? 0);
}

export function spellSaveDc(sheet: CharacterSheet, level: number | undefined): number {
  const a = castAbilityOf(sheet);
  return 8 + (a ? modOf(sheet.scores[a]) : 0) + profOf(level) + (sheet.extra?.spellDc ?? 0);
}

const isWarlock = (sheet: CharacterSheet) => className(sheet) === "Warlock";

/** Slots per spell level 1-9 (not Pact Magic). */
export function slotsMaxOf(sheet: CharacterSheet, level: number | undefined): number[] {
  if (sheet.slotsMax) return Array.from({ length: 9 }, (_, i) => sheet.slotsMax![i] ?? 0);
  const row = castingRow(sheet, level);
  if (!row || isWarlock(sheet)) return Array(9).fill(0);
  return Array.from({ length: 9 }, (_, i) => row[2][i] ?? 0);
}

/** Warlock Pact Magic: how many slots, all at one level. Refreshes on a short rest. */
export function pactOf(sheet: CharacterSheet, level: number | undefined): { count: number; level: number } | null {
  if (!isWarlock(sheet)) return null;
  const row = castingRow(sheet, level);
  if (!row) return null;
  const at = row[2].findIndex((x) => x > 0);
  return at < 0 ? null : { count: row[2][at], level: at + 1 };
}

/** Slots left per spell level 1-9. */
export function slotsLeft(sheet: CharacterSheet, level: number | undefined): number[] {
  const max = slotsMaxOf(sheet, level);
  return max.map((m, i) => Math.max(0, m - (sheet.slotsUsed?.[i] ?? 0)));
}

export function pactLeft(sheet: CharacterSheet, level: number | undefined): number {
  const p = pactOf(sheet, level);
  return p ? Math.max(0, p.count - (sheet.pactUsed ?? 0)) : 0;
}

/** A cantrip's dice multiplier: ×2 at level 5, ×3 at 11, ×4 at 17. */
export function cantripTier(level: number | undefined): number {
  const l = lvl(level);
  return 1 + (l >= 5 ? 1 : 0) + (l >= 11 ? 1 : 0) + (l >= 17 ? 1 : 0);
}

export function spellDice(sheet: CharacterSheet, sp: SheetSpell, level: number | undefined): { count: number; sides: SpellDie; plus: number } | null {
  if (!sp.count || !sp.sides) return null;
  const count = sp.level === 0 && sp.scale ? sp.count * cantripTier(level) : sp.count;
  const a = castAbilityOf(sheet);
  return { count, sides: sp.sides, plus: sp.addMod && a ? modOf(sheet.scores[a]) : 0 };
}

/** "2d10 fire". */
export function spellDiceText(sheet: CharacterSheet, sp: SheetSpell, level: number | undefined): string {
  const d = spellDice(sheet, sp, level);
  if (!d) return "";
  return `${d.count}d${d.sides}${d.plus ? ` ${d.plus > 0 ? "+" : "−"} ${Math.abs(d.plus)}` : ""}${sp.type ? ` ${sp.type}` : ""}`;
}

/** What a resource counts to at this level. */
function resourceMax(sheet: CharacterSheet, key: ResourceKey, level: number | undefined): number {
  const l = lvl(level);
  const at = (k: string) => CLASS_COUNTS[k]?.[l - 1] ?? 0;
  switch (key) {
    case "rage":
      return at("barbarian.rage_count");
    case "bardic":
      return Math.max(1, modOf(sheet.scores.cha));
    case "channel-cleric":
      return at("cleric.channel_divinity_charges");
    case "channel-paladin":
      return at("paladin.channel_divinity_charges");
    case "wildshape":
      return at("druid.wild_shape_uses");
    case "secondwind":
      return at("fighter.second_wind_uses");
    case "actionsurge":
      return l >= 17 ? 2 : l >= 2 ? 1 : 0;
    case "indomitable":
      return l >= 17 ? 3 : l >= 13 ? 2 : l >= 9 ? 1 : 0;
    case "focus":
      return at("monk.focus_points");
    case "metabolism":
    case "cunning":
    case "arcane":
    case "relentless":
    case "largeform":
      return l >= RESOURCES[key].from ? 1 : 0;
    case "breath":
    case "adrenaline":
    case "giant":
      return profOf(level);
    case "layonhands":
      return 5 * l;
    case "favored":
      return at("ranger.favored_enemies");
    case "innate":
      return 2;
    case "sorcery":
      return at("sorcerer.sorcery_points");
  }
}

function resourceReset(key: ResourceKey, level: number | undefined): Reset {
  switch (key) {
    case "rage":
    case "channel-cleric":
    case "channel-paladin":
    case "wildshape":
    case "secondwind":
      return "short1";
    case "bardic":
      return lvl(level) >= 5 ? "short" : "long";
    case "actionsurge":
    case "focus":
    case "adrenaline":
      return "short";
    default:
      return "long";
  }
}

/** A feature's max and reset as they stand now (auto ones follow the level). */
export function featureNow(sheet: CharacterSheet, f: SheetFeature, level: number | undefined): { max: number; reset: Reset; left: number } {
  const max = f.auto ? resourceMax(sheet, f.auto, level) : f.max;
  const reset = f.auto ? resourceReset(f.auto, level) : f.reset;
  return { max, reset, left: Math.max(0, max - f.used) };
}

const speciesOf = (r: (typeof RESOURCES)[ResourceKey]) => ("species" in r ? r.species : undefined);

/** The class and species resources this sheet could add, for its class, species and level, that it doesn't have yet. */
export function suggestedFeatures(sheet: CharacterSheet, level: number | undefined): ResourceKey[] {
  const c = className(sheet);
  const sp = sheet.species?.trim().toLowerCase();
  const have = new Set((sheet.features ?? []).map((f) => f.auto).filter(Boolean));
  return RESOURCE_KEYS.filter((k) => {
    const r = RESOURCES[k];
    const mine = r.cls ? r.cls === c : !!sp && speciesOf(r)?.toLowerCase() === sp;
    return mine && lvl(level) >= r.from && !have.has(k);
  });
}

export function featureFrom(key: ResourceKey, id: string): SheetFeature {
  return { id, name: RESOURCES[key].name, max: 0, used: 0, reset: "long", auto: key };
}

// ---------------------------------------------------------------------------
// Rests

/** A short rest: Pact Magic slots back, short-rest features back (one use for the "1 per short rest" ones). */
export function shortRestMagic(sheet: CharacterSheet, level: number | undefined) {
  delete sheet.pactUsed;
  for (const f of sheet.features ?? []) {
    const { reset } = featureNow(sheet, f, level);
    if (reset === "short") f.used = 0;
    else if (reset === "short1" && f.used > 0) f.used -= 1;
  }
}

/** A long rest: every slot and every rest feature back, and concentration ends. */
export function longRestMagic(sheet: CharacterSheet, level: number | undefined) {
  delete sheet.slotsUsed;
  delete sheet.pactUsed;
  delete sheet.conc;
  for (const f of sheet.features ?? []) if (featureNow(sheet, f, level).reset !== "none") f.used = 0;
}

// ---------------------------------------------------------------------------
// Commands

const shortId = z.string().regex(/^[A-Za-z0-9_-]{1,24}$/);
const abilityEnum = z.enum(ABIL);
const name = z.string().max(40);

export const spellBody = z.object({
  id: shortId,
  name,
  level: z.number().int().min(0).max(9),
  srd: z
    .string()
    .regex(/^[a-z0-9-]{1,48}$/)
    .optional(),
  prepared: z.boolean().optional(),
  conc: z.boolean().optional(),
  ritual: z.boolean().optional(),
  attack: z.boolean().optional(),
  save: abilityEnum.optional(),
  count: z.number().int().min(0).max(20).optional(),
  sides: z.union([z.literal(4), z.literal(6), z.literal(8), z.literal(10), z.literal(12)]).optional(),
  addMod: z.boolean().optional(),
  scale: z.boolean().optional(),
  type: z.string().max(20).optional(),
  note: z.string().max(SPELL_NOTE_MAX).optional(),
  bonus: z.boolean().optional(),
});

export const featureBody = z.object({
  id: shortId,
  name,
  max: z.number().int().min(0).max(USES_MAX),
  used: z.number().int().min(0).max(USES_MAX),
  reset: z.enum(RESETS),
  auto: z.enum(RESOURCE_KEYS).optional(),
  note: z.string().max(FEATURE_NOTE_MAX).optional(),
});

const nine = z.array(z.number().int().min(0).max(9)).length(9);

/** The magic part of a sheet patch (merged into sheetPatch). */
export const magicPatchShape = {
  /** null: back to the class's ability. */
  castAbility: abilityEnum.nullable(),
  /** null: back to the class table. */
  slotsMax: nine.nullable(),
  slotsUsed: nine,
  pactUsed: z.number().int().min(0).max(9),
  /** The whole list, in order. */
  spells: z.array(spellBody).max(SPELLS_MAX),
  features: z.array(featureBody).max(FEATURES_MAX),
};

type MagicPatch = { [K in keyof typeof magicPatchShape]?: z.infer<(typeof magicPatchShape)[K]> };

const clean = (v: string) => v.replace(/\s+/g, " ").trim();

export function patchMagic(sheet: CharacterSheet, patch: MagicPatch) {
  if (patch.castAbility !== undefined) {
    if (patch.castAbility) sheet.castAbility = patch.castAbility;
    else delete sheet.castAbility;
  }
  if (patch.slotsMax !== undefined) {
    if (patch.slotsMax) sheet.slotsMax = patch.slotsMax;
    else delete sheet.slotsMax;
  }
  if (patch.slotsUsed) {
    if (patch.slotsUsed.some((x) => x > 0)) sheet.slotsUsed = patch.slotsUsed;
    else delete sheet.slotsUsed;
  }
  if (patch.pactUsed !== undefined) {
    if (patch.pactUsed) sheet.pactUsed = patch.pactUsed;
    else delete sheet.pactUsed;
  }
  if (patch.spells) {
    const seen = new Set<string>();
    const list: SheetSpell[] = [];
    for (const s of patch.spells) {
      if (seen.has(s.id)) continue;
      seen.add(s.id);
      const out: SheetSpell = { id: s.id, name: clean(s.name) || "Spell", level: s.level };
      if (s.srd) out.srd = s.srd;
      for (const k of ["prepared", "conc", "ritual", "attack", "addMod", "scale", "bonus"] as const) if (s[k]) out[k] = true;
      if (s.save) out.save = s.save;
      if (s.count && s.sides) {
        out.count = s.count;
        out.sides = s.sides;
      }
      const t = clean(s.type ?? "");
      if (t) out.type = t;
      const n = (s.note ?? "").trim();
      if (n) out.note = n;
      list.push(out);
    }
    if (list.length) sheet.spells = list;
    else delete sheet.spells;
    if (sheet.conc && !list.some((x) => x.name === sheet.conc)) delete sheet.conc;
  }
  if (patch.features) {
    const seen = new Set<string>();
    const list: SheetFeature[] = [];
    for (const f of patch.features) {
      if (seen.has(f.id)) continue;
      seen.add(f.id);
      const out: SheetFeature = { id: f.id, name: clean(f.name) || "Feature", max: f.max, used: Math.min(f.used, USES_MAX), reset: f.reset };
      if (f.auto) out.auto = f.auto;
      const n = (f.note ?? "").trim();
      if (n) out.note = n;
      list.push(out);
    }
    if (list.length) sheet.features = list;
    else delete sheet.features;
  }
}

/** Something done at the table: use or get back a slot or a feature use, cast a spell, drop concentration. */
export const sheetAct = z.discriminatedUnion("k", [
  z.object({ k: z.literal("slot"), level: z.number().int().min(1).max(9), delta: z.union([z.literal(1), z.literal(-1)]) }),
  z.object({ k: z.literal("pact"), delta: z.union([z.literal(1), z.literal(-1)]) }),
  z.object({ k: z.literal("feature"), featureId: shortId, delta: z.number().int().min(-USES_MAX).max(USES_MAX) }),
  /** use: a slot of this level, a Pact Magic slot, or free (a cantrip, a ritual, a feature that casts it). */
  z.object({ k: z.literal("cast"), spellId: shortId, use: z.enum(["slot", "pact", "free"]), slot: z.number().int().min(1).max(9).optional() }),
  z.object({ k: z.literal("endConc") }),
  ...gearActs,
]);
export type SheetAct = z.infer<typeof sheetAct>;

/**
 * Do it on the sheet. Returns what concentration did (so a fight can follow),
 * and a short line for the phone. Refuses with fail() if there's nothing to use.
 */
export function applyAct(sheet: CharacterSheet, level: number | undefined, act: SheetAct, fail: (m: string) => never): { conc?: "start" | "end"; info?: string } {
  const useSlot = (i: number, delta: 1 | -1) => {
    const max = slotsMaxOf(sheet, level)[i];
    const used = [...(sheet.slotsUsed ?? Array(9).fill(0))];
    while (used.length < 9) used.push(0);
    if (delta > 0 && used[i] >= max) fail(max ? `No ${SPELL_LEVEL_NAME[i + 1]} slots left.` : `You have no ${SPELL_LEVEL_NAME[i + 1]} slots.`);
    used[i] = Math.max(0, Math.min(max, used[i] + delta));
    if (used.some((x) => x > 0)) sheet.slotsUsed = used;
    else delete sheet.slotsUsed;
  };
  const usePact = (delta: 1 | -1) => {
    const p = pactOf(sheet, level) ?? fail("You have no Pact Magic slots.");
    const used = sheet.pactUsed ?? 0;
    if (delta > 0 && used >= p.count) fail("No Pact Magic slots left. They come back on a short rest.");
    const next = Math.max(0, Math.min(p.count, used + delta));
    if (next) sheet.pactUsed = next;
    else delete sheet.pactUsed;
  };
  switch (act.k) {
    case "slot":
      useSlot(act.level - 1, act.delta);
      return {};
    case "pact":
      usePact(act.delta);
      return {};
    case "feature": {
      const f = sheet.features?.find((x) => x.id === act.featureId) ?? fail("That feature isn't on your sheet any more.");
      const { max } = featureNow(sheet, f, level);
      const next = f.used + act.delta;
      if (act.delta > 0 && next > max) fail(`No ${f.name} left.`);
      f.used = Math.max(0, Math.min(max, next));
      return {};
    }
    case "cast": {
      const sp = sheet.spells?.find((x) => x.id === act.spellId) ?? fail("That spell isn't on your sheet any more.");
      if (act.use === "slot") {
        const at = act.slot ?? sp.level;
        if (sp.level === 0) fail("Cantrips don't use a slot.");
        if (at < sp.level) fail(`${sp.name} needs a slot of ${SPELL_LEVEL_NAME[sp.level]} or higher.`);
        useSlot(at - 1, 1);
      } else if (act.use === "pact") {
        const p = pactOf(sheet, level);
        if (p && sp.level > p.level) fail(`${sp.name} is higher than your Pact Magic slots.`);
        usePact(1);
      }
      if (!sp.conc) return { info: `Cast ${sp.name}.` };
      const was = sheet.conc;
      sheet.conc = sp.name;
      return { conc: "start", info: was && was !== sp.name ? `Cast ${sp.name}. ${was} ends: you can only concentrate on one spell.` : `Cast ${sp.name}. You're concentrating on it.` };
    }
    case "endConc":
      if (!sheet.conc) return {};
      delete sheet.conc;
      return { conc: "end" };
    case "equip":
    case "attune":
    case "qty":
      return applyGearAct(sheet, act, fail);
  }
}
