// Character sheets, phase 4: inventory.
//
// What a character carries, wears and wields. Wearing armor or a shield sets
// AC; an equipped weapon is an attack; an item that needs attunement only
// counts once attuned (three at most). Shop purchases and special orders land
// here on their own. Weapon and armor numbers are from the free SRD 5.2
// (CC-BY-4.0, Wizards of the Coast): the server keeps just those (srdTables.ts),
// the full list with text is on the phone (client/srd/equipment.json).
//
// This file imports only types from ./sheet, so the two can't load in a loop.

import { z } from "zod";
import type { Ability, CharacterSheet, SheetAttack } from "./sheet";
import { SRD_ARMOR, SRD_WEAPONS } from "./srdTables";

const modOf = (score: number) => Math.floor((score - 10) / 2);

export const ITEMS_MAX = 100;
export const ITEM_NAME_MAX = 60;
export const ITEM_NOTE_MAX = 600;
export const QTY_MAX = 999;
export const ATTUNE_MAX = 3;
export const ITEM_KINDS = ["gear", "weapon", "armor", "shield", "magic"] as const;
export type ItemKindSheet = (typeof ITEM_KINDS)[number];
export const ITEM_KIND_NAME: Record<ItemKindSheet, string> = { gear: "Gear", weapon: "Weapon", armor: "Armor", shield: "Shield", magic: "Magic item" };
export const ARMOR_DEX = ["full", "max2", "none"] as const;
export type ArmorDex = (typeof ARMOR_DEX)[number];

export interface SheetItem {
  id: string;
  name: string;
  qty: number;
  kind: ItemKindSheet;
  equipped?: boolean;
  /** Needs attunement to work. */
  attune?: boolean;
  attuned?: boolean;
  /** The SRD entry it came from (its text is on the phone). "m-…" for magic items. */
  srd?: string;
  /** The shop item it was bought as. */
  from?: string;
  /** Pounds, each. */
  weight?: number;
  /** Armor: base AC and how Dexterity counts. Shield: its AC (2). */
  armorBase?: number;
  armorDex?: ArmorDex;
  /** Weapon damage: count d sides, and its type. */
  count?: number;
  sides?: 4 | 6 | 8 | 10 | 12;
  dtype?: string;
  /** Uses the better of Strength and Dexterity. */
  finesse?: boolean;
  /** Ranged: uses Dexterity. */
  ranged?: boolean;
  /** Not proficient: no proficiency bonus to hit. */
  noProf?: boolean;
  /** A +1 weapon: to hit and damage. */
  bonus?: number;
  /** Adds to AC while worn (a +1 shield, a Ring of Protection). */
  acPlus?: number;
  note?: string;
}

/** Does this item count now (equipped, and attuned if it needs to be)? */
export const itemActive = (it: SheetItem) => !!it.equipped && (!it.attune || !!it.attuned);

/** AC from worn armor and shields, or the class's unarmored defense. undefined: nothing to work out from. */
export function gearAc(sheet: CharacterSheet): { ac: number; from: string } {
  const dex = modOf(sheet.scores.dex);
  const on = (sheet.items ?? []).filter(itemActive);
  const armor = on.find((x) => x.kind === "armor" && x.armorBase);
  const shields = on.filter((x) => x.kind === "shield");
  const extras = on.reduce((n, x) => n + (x.acPlus ?? 0), 0);
  let base: number;
  let from: string;
  if (armor) {
    const d = armor.armorDex === "none" ? 0 : armor.armorDex === "max2" ? Math.min(2, dex) : dex;
    base = armor.armorBase! + d;
    from = armor.name;
  } else {
    const cls = sheet.cls?.trim().toLowerCase();
    if (cls === "barbarian") {
      base = 10 + dex + modOf(sheet.scores.con);
      from = "Unarmored Defense";
    } else if (cls === "monk" && !shields.length) {
      base = 10 + dex + modOf(sheet.scores.wis);
      from = "Unarmored Defense";
    } else {
      base = 10 + dex;
      from = "no armor";
    }
  }
  const sh = shields.reduce((n, x) => n + (x.armorBase ?? 2), 0);
  if (shields.length) from += " + shield";
  return { ac: base + sh + extras, from };
}

/** Equipped weapons, as attacks. */
export function weaponAttacks(sheet: CharacterSheet): SheetAttack[] {
  const out: SheetAttack[] = [];
  for (const it of sheet.items ?? []) {
    if (it.kind !== "weapon" || !itemActive(it)) continue;
    const ability: Ability = it.ranged ? "dex" : it.finesse && modOf(sheet.scores.dex) > modOf(sheet.scores.str) ? "dex" : "str";
    const a: SheetAttack = { id: it.id, name: it.name, ability, prof: !it.noProf, count: it.count && it.sides ? it.count : 0, sides: it.sides ?? 6, dmgMod: true };
    if (it.bonus) {
      a.hit = it.bonus;
      a.dmg = it.bonus;
    }
    if (it.dtype) a.type = it.dtype;
    out.push(a);
  }
  return out;
}

export function totalWeight(sheet: CharacterSheet): number {
  return Math.round((sheet.items ?? []).reduce((n, x) => n + (x.weight ?? 0) * x.qty, 0) * 10) / 10;
}

export const attunedCount = (sheet: CharacterSheet) => (sheet.items ?? []).filter((x) => x.attuned).length;

/** A new item from a plain name: weapons and armor from the SRD get their numbers. */
export function itemFromName(name: string, id: string, qty: number): SheetItem {
  const k = name.trim().toLowerCase();
  const w = SRD_WEAPONS[k];
  const a = SRD_ARMOR[k] ?? SRD_ARMOR[`${k} armor`];
  const it: SheetItem = { id, name: name.trim().slice(0, ITEM_NAME_MAX) || "Item", qty, kind: "gear" };
  if (w) {
    it.kind = "weapon";
    if (w.n && w.s) {
      it.count = w.n;
      it.sides = w.s as SheetItem["sides"];
    }
    if (w.t) it.dtype = w.t;
    if (w.f) it.finesse = true;
    if (w.r) it.ranged = true;
  } else if (a) {
    it.kind = a.k;
    it.armorBase = a.b;
    if (a.k === "armor") it.armorDex = a.d;
  }
  return it;
}

// ---------------------------------------------------------------------------
// Commands

const shortId = z.string().regex(/^[A-Za-z0-9_-]{1,24}$/);

export const itemBody = z.object({
  id: shortId,
  name: z.string().max(ITEM_NAME_MAX),
  qty: z.number().int().min(0).max(QTY_MAX),
  kind: z.enum(ITEM_KINDS),
  equipped: z.boolean().optional(),
  attune: z.boolean().optional(),
  attuned: z.boolean().optional(),
  srd: z
    .string()
    .regex(/^[a-z0-9-]{1,60}$/)
    .optional(),
  from: z.string().max(64).optional(),
  weight: z.number().min(0).max(2000).optional(),
  armorBase: z.number().int().min(0).max(30).optional(),
  armorDex: z.enum(ARMOR_DEX).optional(),
  count: z.number().int().min(0).max(10).optional(),
  sides: z.union([z.literal(4), z.literal(6), z.literal(8), z.literal(10), z.literal(12)]).optional(),
  dtype: z.string().max(20).optional(),
  finesse: z.boolean().optional(),
  ranged: z.boolean().optional(),
  noProf: z.boolean().optional(),
  bonus: z.number().int().min(-5).max(5).optional(),
  acPlus: z.number().int().min(-5).max(10).optional(),
  note: z.string().max(ITEM_NOTE_MAX).optional(),
});

export const gearPatchShape = {
  /** The whole list, in order. */
  items: z.array(itemBody).max(ITEMS_MAX),
};

const clean = (v: string) => v.replace(/\s+/g, " ").trim();

export function patchGear(sheet: CharacterSheet, patch: { items?: z.infer<typeof itemBody>[] }, fail: (m: string) => never) {
  if (!patch.items) return;
  const seen = new Set<string>();
  const list: SheetItem[] = [];
  for (const x of patch.items) {
    if (seen.has(x.id) || x.qty <= 0) continue;
    seen.add(x.id);
    const it: SheetItem = { id: x.id, name: clean(x.name) || "Item", qty: x.qty, kind: x.kind };
    for (const k of ["equipped", "attune", "finesse", "ranged", "noProf"] as const) if (x[k]) it[k] = true;
    if (x.attuned && x.attune) it.attuned = true;
    if (x.srd) it.srd = x.srd;
    if (x.from) it.from = x.from;
    if (x.weight) it.weight = Math.round(x.weight * 100) / 100;
    if (x.kind === "armor" || x.kind === "shield") {
      if (x.armorBase !== undefined) it.armorBase = x.armorBase;
      if (x.kind === "armor") it.armorDex = x.armorDex ?? "full";
    }
    if (x.kind === "weapon" && x.count && x.sides) {
      it.count = x.count;
      it.sides = x.sides;
    }
    const t = clean(x.dtype ?? "");
    if (t && x.kind === "weapon") it.dtype = t;
    if (x.bonus) it.bonus = x.bonus;
    if (x.acPlus) it.acPlus = x.acPlus;
    const n = (x.note ?? "").trim();
    if (n) it.note = n;
    list.push(it);
  }
  if (list.filter((x) => x.attuned).length > ATTUNE_MAX) fail(`You can be attuned to ${ATTUNE_MAX} items at most.`);
  if (list.length) sheet.items = list;
  else delete sheet.items;
}

export const gearActs = [
  z.object({ k: z.literal("equip"), itemId: shortId, on: z.boolean() }),
  z.object({ k: z.literal("attune"), itemId: shortId, on: z.boolean() }),
  /** Use one up (a potion, an arrow), or get one back. */
  z.object({ k: z.literal("qty"), itemId: shortId, delta: z.number().int().min(-QTY_MAX).max(QTY_MAX) }),
] as const;
export type GearAct = z.infer<(typeof gearActs)[number]>;

export function applyGearAct(sheet: CharacterSheet, act: GearAct, fail: (m: string) => never): { info?: string } {
  const it = sheet.items?.find((x) => x.id === act.itemId) ?? fail("That item isn't in your inventory any more.");
  switch (act.k) {
    case "equip":
      if (act.on) {
        it.equipped = true;
        // One suit of armor at a time.
        if (it.kind === "armor") for (const x of sheet.items!) if (x !== it && x.kind === "armor") delete x.equipped;
      } else delete it.equipped;
      return {};
    case "attune":
      if (act.on) {
        if (!it.attune) fail(`${it.name} doesn't need attuning.`);
        if (!it.attuned && attunedCount(sheet) >= ATTUNE_MAX) fail(`You're attuned to ${ATTUNE_MAX} items already. End one first.`);
        it.attuned = true;
      } else delete it.attuned;
      return {};
    case "qty": {
      const next = it.qty + act.delta;
      if (next < 0) fail(`You have no ${it.name} left.`);
      if (next > QTY_MAX) fail("That's too many.");
      if (next === 0) {
        sheet.items = sheet.items!.filter((x) => x !== it);
        if (!sheet.items.length) delete sheet.items;
        return { info: `Used your last ${it.name}.` };
      }
      it.qty = next;
      return {};
    }
  }
}

/** A purchase lands in the inventory: more of the same shop item stacks. */
export function addBought(sheet: CharacterSheet, shopItem: { id: string; name: string }, qty: number, newId: () => string) {
  const have = sheet.items?.find((x) => x.from === shopItem.id && x.name === shopItem.name);
  if (have) {
    have.qty = Math.min(QTY_MAX, have.qty + qty);
    return;
  }
  if ((sheet.items?.length ?? 0) >= ITEMS_MAX) return;
  const it = itemFromName(shopItem.name, newId(), Math.min(QTY_MAX, qty));
  it.from = shopItem.id;
  (sheet.items ??= []).push(it);
}

/** Hand some of an item to another sheet. Returns the line for the giver. */
export function giveItem(from: CharacterSheet, to: CharacterSheet, itemId: string, qty: number, newId: () => string, fail: (m: string) => never): string {
  const it = from.items?.find((x) => x.id === itemId) ?? fail("That item isn't in your inventory any more.");
  if (qty > it.qty) fail(`You only have ${it.qty}.`);
  if ((to.items?.length ?? 0) >= ITEMS_MAX) fail("Their inventory is full.");
  const moved: SheetItem = { ...it, id: newId(), qty };
  delete moved.equipped;
  delete moved.attuned;
  const stack = to.items?.find((x) => x.name === it.name && x.kind === it.kind && !x.equipped && (x.srd ?? "") === (it.srd ?? "") && (x.from ?? "") === (it.from ?? ""));
  if (stack) stack.qty = Math.min(QTY_MAX, stack.qty + qty);
  else (to.items ??= []).push(moved);
  if (qty === it.qty) {
    from.items = from.items!.filter((x) => x !== it);
    if (!from.items.length) delete from.items;
  } else it.qty -= qty;
  return qty > 1 ? `${qty} × ${it.name}` : it.name;
}
