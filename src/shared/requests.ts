// Holds for phone requests. A pending request holds the player's gold and the
// item's stock until the DM approves or declines it, or the player cancels.

import type { GameState, Item, Shop, TradeRequest } from "./types";

/** Gold held by this player's pending requests (purchases and gold they're sending). */
export function heldCp(s: Pick<GameState, "requests">, playerId: string): number {
  return s.requests.reduce((a, r) => (r.status === "pending" && r.playerId === playerId ? a + r.totalCp : a), 0);
}

/** Units of this item held by pending requests. */
export function heldStock(s: Pick<GameState, "requests">, itemId: string, exceptRequestId?: string): number {
  return s.requests.reduce((a, r) => (r.status === "pending" && r.kind === "buy" && r.itemId === itemId && r.id !== exceptRequestId ? a + r.qty : a), 0);
}

/** Gold minus anything pending. */
export function availableCp(s: Pick<GameState, "requests" | "players">, playerId: string): number {
  const p = s.players.find((x) => x.id === playerId);
  return (p?.balanceCp ?? 0) - heldCp(s, playerId);
}

/** Stock nobody is waiting on. null = no limit. */
export function availableStock(s: Pick<GameState, "requests">, item: Pick<Item, "id" | "stock">): number | null {
  return item.stock === null ? null : Math.max(0, item.stock - heldStock(s, item.id));
}

/** Purchases from this shop never reach the TV or other players (the Peddler, secret offers). */
export function isSecretShop(shop: Shop | undefined): boolean {
  return !!shop && (!!shop.secretSales || shop.visibility === "some");
}

export function pendingRequests(s: Pick<GameState, "requests">): TradeRequest[] {
  return s.requests.filter((r) => r.status === "pending");
}

/** "a Shield", "an Oil Flask", "A Lucky Coin", "3 × Torch". */
export function boughtPhrase(name: string, qty: number): string {
  if (qty > 1) return `${qty} × ${name}`;
  if (/^(a|an|the|some)\s/i.test(name)) return name.charAt(0).toLowerCase() + name.slice(1);
  if (/^\d/.test(name)) return name;
  return (/^[aeiou]/i.test(name) ? "an " : "a ") + name;
}
