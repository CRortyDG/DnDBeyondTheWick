// Character sheets, phase 5: the character builder and levelling up.
//
// The phone walks a player through class, species, background, scores, skills,
// kit and spells, and sends the choices (not a finished sheet): the server
// checks them against the SRD 5.2 rules and makes the sheet, so the numbers
// are always ones the rules allow. Levelling up works the same way, one level
// at a time, after the DM raises the character's level.
//
// Everything built in is from the free SRD 5.2 (CC-BY-4.0, Wizards of the
// Coast). The rules text players read is on the phone only (client/srd/builder.json).

import { z } from "zod";
import { ABILITIES, CLASSES, classOf, mod, proficiency, SKILL_IDS, STANDARD_ARRAY, type Ability, type CharacterSheet, type HitDie, type SkillId } from "./sheet";
import { itemFromName, type SheetItem } from "./sheetGear";
import { castingRow, featureFrom, patchMagic, spellBody, SPELLS_MAX, suggestedFeatures } from "./sheetMagic";
import { BUILD_BACKGROUND_DATA, BUILD_CLASS_DATA } from "./srdBuildData";
import type { StarterId } from "./starters";

export const SCORE_BASE_MIN = 3;
export const SCORE_BASE_MAX = 18;
export const SCORE_CAP = 20;
export const POINT_BUY = 27;
/** What each score costs in point buy (8-15). */
export const POINT_COST: Record<number, number> = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };
export const BUILD_TRAITS_MAX = 4000;
export const BUILD_PROFS_MAX = 1500;

export const BUILD_CLASSES = CLASSES.map((c) => c.name);
export const BUILD_BACKGROUNDS = Object.keys(BUILD_BACKGROUND_DATA);

/** The SRD's origin feats (a background gives one; a Human picks one more). */
export const ORIGIN_FEATS = ["Alert", "Magic Initiate", "Savage Attacker", "Skilled"] as const;
export type OriginFeat = (typeof ORIGIN_FEATS)[number];

export const LANGUAGES = ["Common Sign Language", "Draconic", "Dwarvish", "Elvish", "Giant", "Gnomish", "Goblin", "Halfling", "Orc"];

export interface SpeciesBuild {
  speed: number;
  /** Darkvision range in feet. */
  dark?: number;
  /** The choice the species makes (Elven Lineage, Draconic Ancestry). */
  lineage?: { label: string; options: string[] };
  /** Keen Senses: one of these skills. */
  pickSkillFrom?: SkillId[];
  /** Human: Skillful (any one skill) and Versatile (an origin feat). */
  human?: true;
  /** Dwarven Toughness: +1 HP per level. */
  toughness?: true;
}

export const SPECIES_BUILD: Record<string, SpeciesBuild> = {
  Dragonborn: { speed: 30, dark: 60, lineage: { label: "Draconic Ancestry", options: ["Black", "Blue", "Brass", "Bronze", "Copper", "Gold", "Green", "Red", "Silver", "White"] } },
  Dwarf: { speed: 30, dark: 120, toughness: true },
  Elf: { speed: 30, dark: 60, lineage: { label: "Elven Lineage", options: ["Drow", "High Elf", "Wood Elf"] }, pickSkillFrom: ["insight", "perception", "survival"] },
  Gnome: { speed: 30, dark: 60, lineage: { label: "Gnomish Lineage", options: ["Forest Gnome", "Rock Gnome"] } },
  Goliath: { speed: 35, lineage: { label: "Giant Ancestry", options: ["Cloud's Jaunt", "Fire's Burn", "Frost's Chill", "Hill's Tumble", "Stone's Endurance", "Storm's Thunder"] } },
  Halfling: { speed: 30 },
  Human: { speed: 30, human: true },
  Orc: { speed: 30, dark: 120 },
  Tiefling: { speed: 30, dark: 60, lineage: { label: "Fiendish Legacy", options: ["Abyssal", "Chthonic", "Infernal"] } },
};

/** Dragonborn ancestry: its damage type. */
export const DRACONIC_TYPE: Record<string, string> = { Black: "acid", Blue: "lightning", Brass: "fire", Bronze: "lightning", Copper: "acid", Gold: "fire", Green: "poison", Red: "fire", Silver: "cold", White: "cold" };

/** Spells a species or lineage gives, at a character level: SRD spell index. */
export const LINEAGE_SPELLS: Record<string, [number, string][]> = {
  Drow: [
    [1, "dancing-lights"],
    [3, "faerie-fire"],
    [5, "darkness"],
  ],
  "High Elf": [
    [1, "prestidigitation"],
    [3, "detect-magic"],
    [5, "misty-step"],
  ],
  "Wood Elf": [
    [1, "druidcraft"],
    [3, "longstrider"],
    [5, "pass-without-trace"],
  ],
  "Forest Gnome": [
    [1, "minor-illusion"],
    [1, "speak-with-animals"],
  ],
  "Rock Gnome": [
    [1, "mending"],
    [1, "prestidigitation"],
  ],
  Abyssal: [
    [1, "thaumaturgy"],
    [1, "poison-spray"],
    [3, "ray-of-sickness"],
    [5, "hold-person"],
  ],
  Chthonic: [
    [1, "thaumaturgy"],
    [1, "chill-touch"],
    [3, "false-life"],
    [5, "ray-of-enfeeblement"],
  ],
  Infernal: [
    [1, "thaumaturgy"],
    [1, "fire-bolt"],
    [3, "hellish-rebuke"],
    [5, "darkness"],
  ],
};

/** The lineage spells that arrive at exactly this level. */
export const lineageSpellsAt = (lineage: string | undefined, level: number) => (lineage ? (LINEAGE_SPELLS[lineage] ?? []).filter(([l]) => l === level).map(([, s]) => s) : []);
/** The lineage spells known at this level. */
export const lineageSpellsBy = (lineage: string | undefined, level: number) => (lineage ? (LINEAGE_SPELLS[lineage] ?? []).filter(([l]) => l <= level).map(([, s]) => s) : []);

/** Expertise: how many skills a class gets it in, at a class level. */
const EXPERTISE: Record<string, Record<number, number>> = { Rogue: { 1: 2, 6: 2 }, Bard: { 2: 2, 9: 2 }, Ranger: { 2: 1, 9: 2 } };
export const expertiseAt = (cls: string | undefined, level: number) => (cls ? (EXPERTISE[cls]?.[level] ?? 0) : 0);
export const expertiseBy = (cls: string | undefined, level: number) =>
  cls
    ? Object.entries(EXPERTISE[cls] ?? {})
        .filter(([l]) => Number(l) <= level)
        .reduce((n, [, v]) => n + v, 0)
    : 0;

/** Levels with an Ability Score Improvement (or a feat instead). */
export const asiLevels = (cls: string | undefined) => (cls ? (BUILD_CLASS_DATA[cls]?.asi ?? []) : []);
export const asiCountBy = (cls: string | undefined, level: number) => asiLevels(cls).filter((l) => l <= level).length;

export const hitDieFor = (cls: string): HitDie => CLASSES.find((c) => c.name === cls)?.hitDie ?? 8;
/** The fixed hit points per level after the first: half the die, plus one. */
export const avgHp = (die: HitDie) => die / 2 + 1;

/** Max HP for a level: the full die at level 1, the average after, Constitution each level (at least 1), and Dwarven Toughness. */
export function maxHpFor(cls: string, species: string | undefined, con: number, level: number): number {
  const die = hitDieFor(cls);
  const m = mod(con);
  let hp = Math.max(1, die + m);
  for (let l = 2; l <= level; l++) hp += Math.max(1, avgHp(die) + m);
  if (species && SPECIES_BUILD[species]?.toughness) hp += level;
  return hp;
}

export function pointBuyCost(base: Record<Ability, number>): number | null {
  let n = 0;
  for (const a of ABILITIES) {
    const c = POINT_COST[base[a]];
    if (c === undefined) return null;
    n += c;
  }
  return n;
}

/** The spells a class can have at a level: cantrips and prepared, and the highest spell level it can cast. */
export function spellCounts(cls: string, level: number): { cantrips: number; prepared: number; maxLevel: number } {
  const row = castingRow({ cls }, level);
  if (!row) return { cantrips: 0, prepared: 0, maxLevel: 0 };
  let maxLevel = 0;
  row[2].forEach((x, i) => {
    if (x > 0) maxLevel = i + 1;
  });
  return { cantrips: row[0], prepared: row[1], maxLevel };
}

/** What the builder's first pages decide, with the numbers they lead to. */
export interface BuildRecord {
  /** The level the sheet was built or last levelled up to. */
  level: number;
  /** The species as the rules know it ("Elf" for a High Elf). */
  species: string;
  lineage?: string;
  /** Origin feats: the background's, and a Human's second one. */
  feats: string[];
}

// ---------------------------------------------------------------------------
// Commands

const ability = z.enum(ABILITIES);
const skill = z.enum(SKILL_IDS);
const base = z.number().int().min(SCORE_BASE_MIN).max(SCORE_BASE_MAX);

export const buildChoices = z.object({
  cls: z.enum(BUILD_CLASSES as [string, ...string[]]),
  subclass: z.string().max(40).optional(),
  species: z.enum(Object.keys(SPECIES_BUILD) as [string, ...string[]]),
  lineage: z.string().max(40).optional(),
  background: z.enum(BUILD_BACKGROUNDS as [string, ...string[]]),
  method: z.enum(["standard", "pointbuy", "rolled"]),
  /** Scores before the background's bonus. */
  base: z.object({ str: base, dex: base, con: base, int: base, wis: base, cha: base }),
  /** The background's bonus: +2 and +1, or +1 to all three, among its three abilities. */
  bonus: z.partialRecord(ability, z.union([z.literal(1), z.literal(2)])),
  /** Ability Score Improvements for a character made above level 1: 2 points per one reached. */
  asi: z.partialRecord(ability, z.number().int().min(1).max(4)).optional(),
  /** The class's skill picks. */
  skills: z.array(skill).max(6),
  /** Skills from the species (Keen Senses, Skillful) and the Skilled feat. */
  extraSkills: z.array(skill).max(6).optional(),
  expertise: z.array(skill).max(6).optional(),
  /** A Human's second origin feat. */
  feat: z.enum(ORIGIN_FEATS).optional(),
  /** Which of the class's kits (the last one is all gold), and the background's kit or its 50 GP. */
  kit: z.number().int().min(0).max(3),
  bgKit: z.boolean(),
  spells: z.array(spellBody).max(SPELLS_MAX),
  traits: z.string().max(BUILD_TRAITS_MAX).optional(),
  profs: z.string().max(BUILD_PROFS_MAX).optional(),
});
export type BuildChoices = z.infer<typeof buildChoices>;

export const buildCommands = [
  /** Make my sheet from the builder (replaces one I have, unless the DM locked it). */
  z.object({ type: z.literal("me.build"), choices: buildChoices }),
  /** Take my next level, after the DM raised it: hit points (the average or a roll), and what the level asks for. */
  z.object({
    type: z.literal("me.levelUp"),
    hp: z.enum(["avg", "roll"]),
    asi: z.partialRecord(ability, z.union([z.literal(1), z.literal(2)])).optional(),
    subclass: z.string().max(40).optional(),
    expertise: z.array(skill).max(2).optional(),
    /** New spells (a lineage spell, more prepared spells). */
    addSpells: z.array(spellBody).max(8).optional(),
    /** A line for Features & traits ("Level 5: Extra Attack"). */
    note: z.string().max(600).optional(),
    tv: z.boolean().optional(),
  }),
] as const;
export type BuildCommand = z.infer<(typeof buildCommands)[number]>;

/** Check the choices against the rules and make the sheet. The caller sets HP and keeps what it wants from an old sheet. */
export function buildSheet(c: BuildChoices, level: number | undefined, h: { now: number; newId: () => string; fail: (m: string) => never }): { sheet: CharacterSheet; maxHp: number; gp: number } {
  const L = Math.min(20, Math.max(1, level ?? 1));
  const { fail } = h;
  const cd = BUILD_CLASS_DATA[c.cls] ?? fail("Pick a class from the list.");
  const sp = SPECIES_BUILD[c.species] ?? fail("Pick a species from the list.");
  const bg = BUILD_BACKGROUND_DATA[c.background] ?? fail("Pick a background from the list.");
  if (sp.lineage && !sp.lineage.options.includes(c.lineage ?? "")) fail(`Pick a ${sp.lineage.label}.`);
  const lineage = sp.lineage ? c.lineage : undefined;

  // Scores
  const b = c.base;
  if (c.method === "standard") {
    const got = ABILITIES.map((a) => b[a]).sort((x, y) => y - x);
    if (got.join() !== STANDARD_ARRAY.join()) fail("The standard array is 15, 14, 13, 12, 10 and 8, once each.");
  } else if (c.method === "pointbuy") {
    const cost = pointBuyCost(b);
    if (cost === null) fail("Point buy scores go from 8 to 15.");
    else if (cost > POINT_BUY) fail(`That's ${cost} points. Point buy has ${POINT_BUY}.`);
  }
  const bonus = Object.entries(c.bonus) as [Ability, 1 | 2][];
  if (bonus.some(([a]) => !bg.ab.includes(a))) fail(`${c.background} raises ${bg.ab.map((a) => a.toUpperCase()).join(", ")} only.`);
  const vals = bonus.map(([, v]) => v).sort();
  if (!(vals.join() === "1,2" || vals.join() === "1,1,1")) fail("Background bonus: +2 to one and +1 to another, or +1 to all three.");
  const scores = { ...b };
  for (const [a, v] of bonus) scores[a] += v;
  const asiPts = Object.values(c.asi ?? {}).reduce((n, v) => n + (v ?? 0), 0);
  const asiMax = 2 * asiCountBy(c.cls, L);
  if (asiPts > asiMax) fail(asiMax ? `You have ${asiMax} Ability Score Improvement points at level ${L}.` : "Ability Score Improvements start at level 4.");
  for (const [a, v] of Object.entries(c.asi ?? {}) as [Ability, number][]) scores[a] += v;
  if (ABILITIES.some((a) => scores[a] > SCORE_CAP)) fail(`A score can't go above ${SCORE_CAP}.`);

  // Skills
  const feats = [bg.feat, ...(sp.human && c.feat ? [c.feat] : [])];
  const have = new Set<SkillId>(bg.skills as SkillId[]);
  const pick = [...new Set(c.skills)];
  if (pick.length !== cd.skills.n) fail(`${c.cls} picks ${cd.skills.n} skills.`);
  for (const s of pick) {
    if (cd.skills.from !== "any" && !cd.skills.from.includes(s)) fail(`${c.cls} can't pick that skill.`);
    if (have.has(s)) fail(`${c.background} already gives you that skill. Pick another.`);
    have.add(s);
  }
  const extra = [...new Set(c.extraSkills ?? [])];
  const extraMax = (sp.pickSkillFrom ? 1 : 0) + (sp.human ? 1 : 0) + (feats.filter((f) => f === "Skilled").length ? 3 : 0);
  if (extra.length > extraMax) fail(`You get ${extraMax} more skill${extraMax === 1 ? "" : "s"} from your species and feats.`);
  if (sp.pickSkillFrom && extra.length && !extra.some((s) => sp.pickSkillFrom!.includes(s))) fail("Keen Senses is Insight, Perception or Survival.");
  for (const s of extra) {
    if (have.has(s)) fail("You already have that skill. Pick another.");
    have.add(s);
  }
  const exp = [...new Set(c.expertise ?? [])];
  const expMax = expertiseBy(c.cls, L);
  if (exp.length > expMax) fail(expMax ? `${c.cls} gets Expertise in ${expMax} skills at level ${L}.` : `${c.cls} doesn't get Expertise at level ${L}.`);
  if (exp.some((s) => !have.has(s))) fail("Expertise goes on a skill you're proficient in.");
  const skills: CharacterSheet["skills"] = {};
  for (const s of have) skills[s] = exp.includes(s) ? 2 : 1;

  // Kit
  const items: SheetItem[] = [];
  const kit = cd.kits[c.kit] ?? fail("Pick one of the class's kits.");
  let gp = kit.gp;
  const add = (name: string, qty: number) => {
    // The class and background kits can both have a Quarterstaff or a Robe: one line, more of them.
    const same = items.find((x) => x.name.toLowerCase() === name.toLowerCase());
    if (same) same.qty += qty;
    else items.push(itemFromName(name, h.newId(), qty));
  };
  for (const [n, q] of kit.items) add(n, q);
  if (c.bgKit) {
    for (const [n, q] of bg.kit) add(n, q);
    gp += bg.gp;
  } else gp += 50;
  // Wear the armor and shield, and wield the first melee and ranged weapon.
  const armor = items.find((x) => x.kind === "armor");
  if (armor) armor.equipped = true;
  const shield = items.find((x) => x.kind === "shield");
  if (shield && c.cls !== "Monk") shield.equipped = true;
  const melee = items.find((x) => x.kind === "weapon" && !x.ranged && x.count);
  if (melee) melee.equipped = true;
  const ranged = items.find((x) => x.kind === "weapon" && x.ranged && x.count);
  if (ranged) ranged.equipped = true;

  const cls = classOf({ cls: c.cls })!;
  const sheet: CharacterSheet = {
    cls: c.cls,
    // "High Elf" and "Forest Gnome" read better than "Elf"; the record keeps the species for the rules.
    species: lineage && (c.species === "Elf" || c.species === "Gnome") ? lineage : c.species,
    background: c.background,
    scores,
    saves: [...cls.saves],
    skills,
    updatedAt: h.now,
  };
  if (L >= cd.subAt) sheet.subclass = (c.subclass?.replace(/\s+/g, " ").trim() || cd.sub).slice(0, 40);
  if (sp.speed !== 30) sheet.speed = sp.speed;
  if (items.length) sheet.items = items;
  if (feats.includes("Alert")) sheet.extra = { init: proficiency(L) };
  patchMagic(sheet, { spells: c.spells });
  // Class and species resources with uses.
  const withSpecies: CharacterSheet = { ...sheet, species: c.species };
  const feat = suggestedFeatures(withSpecies, L).map((k) => featureFrom(k, h.newId()));
  if (feat.length) sheet.features = feat;
  const traits = c.traits?.replace(/\r\n?/g, "\n").trim();
  if (traits) sheet.traits = traits;
  const profs = c.profs?.replace(/\r\n?/g, "\n").trim();
  if (profs) sheet.profs = profs;
  sheet.build = { level: L, species: c.species, ...(lineage ? { lineage } : {}), feats };
  return { sheet, maxHp: maxHpFor(c.cls, c.species, scores.con, L), gp };
}

/** What the next level asks for, from a built sheet. null: nothing to take (not built here, or already at the DM's level). */
export function nextLevel(sheet: CharacterSheet, level: number | undefined): { to: number; die: HitDie; avg: number; asi: boolean; subclass: string | null; expertise: number; lineageSpells: string[] } | null {
  const b = sheet.build;
  const cls = sheet.cls && BUILD_CLASS_DATA[sheet.cls] ? sheet.cls : undefined;
  if (!b || !cls || !level || b.level >= level || b.level >= 20) return null;
  const to = b.level + 1;
  const die = hitDieFor(cls);
  const cd = BUILD_CLASS_DATA[cls];
  return {
    to,
    die,
    avg: Math.max(1, avgHp(die) + mod(sheet.scores.con)) + (SPECIES_BUILD[b.species]?.toughness ? 1 : 0),
    asi: cd.asi.includes(to),
    subclass: to === cd.subAt ? cd.sub : null,
    expertise: expertiseAt(cls, to),
    lineageSpells: lineageSpellsAt(b.lineage, to),
  };
}

/** Apply one level. roll: the hit die the server rolled (for "roll"). Returns the HP gained. */
export function levelUpSheet(sheet: CharacterSheet, level: number | undefined, cmd: Extract<BuildCommand, { type: "me.levelUp" }>, h: { roll: (sides: HitDie) => number; newId: () => string; fail: (m: string) => never }): { gain: number; to: number; rolled?: number } {
  const { fail } = h;
  const nx = nextLevel(sheet, level) ?? fail(sheet.build ? "You're up to date. The DM raises your level when it's time." : "Level up works on sheets made with the builder.");
  const rolled = cmd.hp === "roll" ? h.roll(nx.die) : undefined;
  const tough = SPECIES_BUILD[sheet.build!.species]?.toughness ? 1 : 0;
  const gain = rolled !== undefined ? Math.max(1, rolled + mod(sheet.scores.con)) + tough : nx.avg;
  // Ability Score Improvement: +2 to one or +1 to two, up to 20. Empty: they took a feat (typed in Features & traits).
  const asi = Object.entries(cmd.asi ?? {}) as [Ability, 1 | 2][];
  if (asi.length) {
    if (!nx.asi) fail(`Level ${nx.to} has no Ability Score Improvement.`);
    if (asi.reduce((n, [, v]) => n + v, 0) > 2) fail("An Ability Score Improvement is +2 to one score or +1 to two.");
    for (const [a, v] of asi) if (sheet.scores[a] + v > SCORE_CAP) fail(`A score can't go above ${SCORE_CAP}.`);
    for (const [a, v] of asi) sheet.scores[a] += v;
  }
  if (nx.subclass) sheet.subclass = (cmd.subclass?.replace(/\s+/g, " ").trim() || nx.subclass).slice(0, 40);
  const exp = [...new Set(cmd.expertise ?? [])];
  if (exp.length > nx.expertise) fail(nx.expertise ? `Pick ${nx.expertise} skill${nx.expertise === 1 ? "" : "s"} for Expertise.` : `Level ${nx.to} has no Expertise.`);
  for (const s of exp) {
    if (sheet.skills[s] !== 1) fail("Expertise goes on a skill you're proficient in (and don't have Expertise in yet).");
    sheet.skills[s] = 2;
  }
  if (cmd.addSpells?.length) {
    const list = [...(sheet.spells ?? [])];
    for (const s of cmd.addSpells) {
      if (list.length >= SPELLS_MAX) break;
      if ((s.srd && list.some((x) => x.srd === s.srd)) || list.some((x) => x.id === s.id)) continue;
      list.push(s);
    }
    patchMagic(sheet, { spells: list });
  }
  sheet.build!.level = nx.to;
  if (sheet.build!.feats.includes("Alert")) sheet.extra = { ...(sheet.extra ?? {}), init: proficiency(nx.to) };
  // New class and species resources arrive on their own.
  const fresh = suggestedFeatures({ ...sheet, species: sheet.build!.species }, nx.to).map((k) => featureFrom(k, h.newId()));
  if (fresh.length) sheet.features = [...(sheet.features ?? []), ...fresh].slice(0, 30);
  const note = cmd.note?.replace(/\s+/g, " ").trim();
  if (note) {
    const t = sheet.traits ? `${sheet.traits}\n${note}` : note;
    if (t.length <= BUILD_TRAITS_MAX) sheet.traits = t;
  }
  return { gain, to: nx.to, ...(rolled !== undefined ? { rolled } : {}) };
}

// ---------------------------------------------------------------------------
// The six starting points, as ready-made builds (our own suggestions, all SRD).

export interface StarterBuild {
  choices: Omit<BuildChoices, "spells" | "traits" | "profs">;
  /** SRD spell indexes: the class's, then Magic Initiate's. */
  spells: string[];
  /** Spells from Magic Initiate (noted on the sheet). */
  initiate: string[];
}

const std = (order: Ability[]) => Object.fromEntries(order.map((a, i) => [a, STANDARD_ARRAY[i]])) as Record<Ability, number>;

export const STARTER_BUILDS: Record<StarterId, StarterBuild> = {
  protector: {
    choices: { cls: "Fighter", species: "Human", background: "Soldier", method: "standard", base: std(["str", "con", "dex", "wis", "cha", "int"]), bonus: { str: 2, con: 1 }, skills: ["perception", "survival"], extraSkills: ["insight"], feat: "Alert", kit: 0, bgKit: true },
    spells: [],
    initiate: [],
  },
  sneak: {
    choices: { cls: "Rogue", species: "Halfling", background: "Criminal", method: "standard", base: std(["dex", "con", "wis", "int", "cha", "str"]), bonus: { dex: 2, con: 1 }, skills: ["acrobatics", "perception", "deception", "investigation"], expertise: ["stealth", "sleight"], kit: 0, bgKit: true },
    spells: [],
    initiate: [],
  },
  spellcaster: {
    choices: { cls: "Wizard", species: "Elf", lineage: "High Elf", background: "Sage", method: "standard", base: std(["int", "con", "dex", "wis", "cha", "str"]), bonus: { int: 2, con: 1 }, skills: ["investigation", "insight"], extraSkills: ["perception"], kit: 0, bgKit: true },
    spells: ["fire-bolt", "mage-hand", "light", "magic-missile", "shield", "sleep", "thunderwave"],
    initiate: ["minor-illusion", "ray-of-frost", "find-familiar"],
  },
  healer: {
    choices: { cls: "Cleric", species: "Dwarf", background: "Acolyte", method: "standard", base: std(["wis", "con", "str", "cha", "dex", "int"]), bonus: { wis: 2, cha: 1 }, skills: ["medicine", "persuasion"], kit: 0, bgKit: true },
    spells: ["sacred-flame", "guidance", "light", "cure-wounds", "bless", "guiding-bolt", "healing-word"],
    initiate: ["spare-the-dying", "thaumaturgy", "shield-of-faith"],
  },
  wild: {
    choices: { cls: "Druid", species: "Gnome", lineage: "Forest Gnome", background: "Sage", method: "standard", base: std(["wis", "con", "dex", "int", "cha", "str"]), bonus: { wis: 2, con: 1 }, skills: ["animal", "perception"], kit: 0, bgKit: true },
    spells: ["produce-flame", "shillelagh", "cure-wounds", "entangle", "faerie-fire", "thunderwave"],
    initiate: ["mage-hand", "light", "detect-magic"],
  },
  charmer: {
    choices: { cls: "Bard", species: "Tiefling", lineage: "Infernal", background: "Acolyte", method: "standard", base: std(["cha", "dex", "con", "wis", "int", "str"]), bonus: { cha: 2, wis: 1 }, skills: ["performance", "persuasion", "deception"], kit: 0, bgKit: true },
    spells: ["vicious-mockery", "minor-illusion", "healing-word", "dissonant-whispers", "charm-person", "faerie-fire"],
    initiate: ["guidance", "light", "bless"],
  },
};
