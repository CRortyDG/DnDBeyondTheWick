// The shop as progression: categories, discounts, credit, shares, and what's
// due at session end. Pure helpers shared by the reducer, projection and UI.

import type { Effect, GameState, Item, ItemCategory, ItemKind, Rental, Stake, Training } from "./types";

export const CATEGORIES: { id: ItemCategory; label: string }[] = [
  { id: "gear", label: "Gear" },
  { id: "healing", label: "Healing" },
  { id: "magic", label: "Magic" },
  { id: "travel", label: "Travel" },
  { id: "services", label: "Services" },
  { id: "building", label: "Building Candlefair" },
  { id: "trophies", label: "Trophies" },
];
export const CATEGORY_IDS = CATEGORIES.map((c) => c.id) as [ItemCategory, ...ItemCategory[]];
export const KINDS: { id: ItemKind; label: string }[] = [
  { id: "purchase", label: "Purchase (pay, done)" },
  { id: "recurring", label: "Recurring (price per month)" },
  { id: "service", label: "Service (you answer it)" },
  { id: "order", label: "Special order (arrives later)" },
  { id: "training", label: "Training (paid in installments)" },
  { id: "project", label: "Project (pooled; price is the goal)" },
  { id: "earned", label: "Earned (you grant it)" },
];
export const KIND_IDS = KINDS.map((k) => k.id) as [ItemKind, ...ItemKind[]];

export function categoryLabel(c: ItemCategory): string {
  return CATEGORIES.find((x) => x.id === c)?.label ?? c;
}

/** Discounts top out here, however many stack. */
export const MAX_DISCOUNT = 50;

type DiscountState = Pick<GameState, "items" | "effectsOn">;

/** Live effects of one type, with the item they came from. */
export function liveEffects<T extends Effect["type"]>(s: Pick<GameState, "items" | "effectsOn">, type: T): { item: Item; effect: Extract<Effect, { type: T }> }[] {
  const out: { item: Item; effect: Extract<Effect, { type: T }> }[] = [];
  for (const item of s.items) {
    if (!s.effectsOn[item.id]) continue;
    for (const e of item.effects ?? []) if (e.type === type) out.push({ item, effect: e as Extract<Effect, { type: T }> });
  }
  return out;
}

/** Percent off this item from live discounts. Projects and earned items are never discounted. */
export function discountPct(s: DiscountState, item: Pick<Item, "category" | "tags" | "kind">): number {
  if (item.kind === "project" || item.kind === "earned") return 0;
  let pct = 0;
  for (const { effect } of liveEffects(s, "discount")) {
    const hit = (effect.category && effect.category === item.category) || (effect.tag && item.tags?.includes(effect.tag));
    if (hit) pct += effect.pct;
  }
  return Math.max(0, Math.min(MAX_DISCOUNT, pct));
}

/** What one costs right now, after discounts. For training this is the whole course. */
export function priceOf(s: DiscountState, item: Item): number {
  const pct = discountPct(s, item);
  return pct ? Math.round((item.priceCp * (100 - pct)) / 100) : item.priceCp;
}

/** Training: the part due now, given how many are paid. The last part takes the remainder. */
export function installmentCp(totalCp: number, of: number, paid: number): number {
  const n = Math.max(1, of);
  const each = Math.round(totalCp / n);
  return paid >= n - 1 ? totalCp - each * (n - 1) : each;
}

/** What a phone request for this item holds and what approving it charges first. */
export function firstChargeCp(s: DiscountState, item: Item): number {
  const price = priceOf(s, item);
  if (item.kind === "training") return installmentCp(price, item.installments ?? 1, 0);
  return price;
}

/** How far below zero this player may go when buying at this storefront (Mags's tab). */
export function creditCp(s: Pick<GameState, "items" | "effectsOn" | "stakes">, playerId: string, shopId: string | undefined): number {
  if (!shopId) return 0;
  let limit = 0;
  for (const { item, effect } of liveEffects(s, "credit")) {
    if (item.shopId !== shopId) continue;
    if (s.stakes.some((k) => k.itemId === item.id && k.playerId === playerId)) limit += effect.limitCp;
  }
  return limit;
}

/** Every credit line a player has, by storefront. */
export function creditLines(s: Pick<GameState, "items" | "effectsOn" | "stakes">, playerId: string): { shopId: string; limitCp: number }[] {
  const by = new Map<string, number>();
  for (const { item, effect } of liveEffects(s, "credit")) {
    if (s.stakes.some((k) => k.itemId === item.id && k.playerId === playerId)) by.set(item.shopId, (by.get(item.shopId) ?? 0) + effect.limitCp);
  }
  return [...by].map(([shopId, limitCp]) => ({ shopId, limitCp }));
}

/** Total each player has put into an item. */
export function sharesOf(s: Pick<GameState, "stakes">, itemId: string): Map<string, number> {
  const m = new Map<string, number>();
  for (const k of s.stakes) if (k.itemId === itemId) m.set(k.playerId, (m.get(k.playerId) ?? 0) + k.cp);
  return m;
}

export function raisedCp(s: Pick<GameState, "stakes">, itemId: string): number {
  let t = 0;
  for (const k of s.stakes) if (k.itemId === itemId) t += k.cp;
  return t;
}

/**
 * Split an amount by share, in whole copper, so the parts always add up.
 * Largest remainders get the spare copper; ties go to whoever put in first.
 */
export function splitByShare(totalCp: number, shares: [string, number][]): [string, number][] {
  const sum = shares.reduce((a, [, v]) => a + v, 0);
  if (sum <= 0 || totalCp <= 0) return shares.map(([id]) => [id, 0]);
  const raw = shares.map(([id, v], i) => ({ id, i, exact: (totalCp * v) / sum }));
  const out = raw.map((r) => ({ ...r, cp: Math.floor(r.exact) }));
  let left = totalCp - out.reduce((a, r) => a + r.cp, 0);
  const order = [...out].sort((a, b) => b.exact - Math.floor(b.exact) - (a.exact - Math.floor(a.exact)) || a.i - b.i);
  for (const r of order) {
    if (left <= 0) break;
    r.cp++;
    left--;
  }
  return out.map((r) => [r.id, r.cp]);
}

/** "1d6", "2d4+1", "3". null if it isn't dice. */
export function parseDice(text: string): { n: number; sides: number; plus: number } | null {
  const t = text.trim().toLowerCase().replace(/\s+/g, "");
  if (/^\d+$/.test(t)) return { n: 0, sides: 0, plus: Number(t) };
  const m = /^(\d*)d(\d+)([+-]\d+)?$/.exec(t);
  if (!m) return null;
  const n = m[1] ? Number(m[1]) : 1;
  const sides = Number(m[2]);
  if (n < 1 || n > 20 || sides < 2 || sides > 100) return null;
  return { n, sides, plus: m[3] ? Number(m[3]) : 0 };
}

export function rollDice(text: string, rand: () => number): number {
  const d = parseDice(text);
  if (!d) return 0;
  let t = d.plus;
  for (let i = 0; i < d.n; i++) t += 1 + Math.floor(rand() * d.sides);
  return Math.max(0, t);
}

export interface Due {
  /** The rental or training id. */
  id: string;
  kind: "rent" | "lesson";
  playerId: string;
  itemName: string;
  cp: number;
  /** "2 of 5" for lessons. */
  step?: string;
}

/**
 * What's owed at the end of session `number`: active rentals and unfinished
 * training not yet paid through it. Charging moves them past it, so the
 * same session can never charge twice.
 */
export function duesFor(s: Pick<GameState, "rentals" | "trainings">, number: number): Due[] {
  const rent = s.rentals.filter((r: Rental) => r.active && r.paidThrough < number).map((r): Due => ({ id: r.id, kind: "rent", playerId: r.playerId, itemName: r.itemName, cp: r.monthlyCp }));
  const lessons = s.trainings
    .filter((t: Training) => !t.done && !t.cancelled && t.paidThrough < number)
    .map((t): Due => ({ id: t.id, kind: "lesson", playerId: t.playerId, itemName: t.itemName, cp: installmentCp(t.totalCp, t.of, t.paid), step: `${t.paid + 1} of ${t.of}` }));
  return [...rent, ...lessons];
}

/** Is this item's stake worth keeping (a share, a title, something with effects)? */
export function keepsStake(item: Item): boolean {
  return item.kind === "project" || !!item.keep || !!item.effects?.length;
}

export function stakeTotals(stakes: Stake[], playerId: string): Map<string, number> {
  const m = new Map<string, number>();
  for (const k of stakes) if (k.playerId === playerId) m.set(k.itemId, (m.get(k.itemId) ?? 0) + k.cp);
  return m;
}
