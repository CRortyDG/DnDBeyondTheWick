// Renown: one shared party rank the DM sets (no automatic points), and the
// bounty board it gates. Items, storefronts and job flyers can need a rank.

import type { GameState, Item, ItemTier, Job, Shop } from "./types";

export interface RenownRank {
  name: string;
  meaning: string;
  /** Typical job pay, each. */
  pay: string;
  /** The TV line when the party reaches this rank. */
  raised: string;
}

export const RENOWN: RenownRank[] = [
  { name: "Strangers", meaning: "Fresh off the boat", pay: "15–50 gp", raised: "Strangers in Candlefair" },
  { name: "Known in town", meaning: "Locals nod at you", pay: "50–150 gp", raised: "Candlefair knows your names" },
  { name: "Trusted", meaning: "The council and merchants come to you", pay: "300–1,000 gp", raised: "Candlefair trusts you" },
  { name: "Heroes of Candlefair", meaning: "Your names are on things", pay: "1,000–5,000 gp", raised: "Heroes of Candlefair!" },
  { name: "Famous on the Coast", meaning: "People in Baldur’s Gate have heard of you", pay: "Whatever you negotiate", raised: "Your names have reached Baldur’s Gate" },
];
export const RENOWN_MAX = RENOWN.length - 1;

export const STRANGERS = 0;
export const KNOWN = 1;
export const TRUSTED = 2;
export const HEROES = 3;
export const FAMOUS = 4;

/** The party's rank right now. */
export function renownOf(g: Pick<GameState, "renown">): number {
  return Math.max(0, Math.min(RENOWN_MAX, g.renown ?? 0));
}

export function rankName(rank: number): string {
  return RENOWN[Math.max(0, Math.min(RENOWN_MAX, rank))].name;
}

/** Has the party reached this rank? No requirement is always met. */
export function renownMet(g: Pick<GameState, "renown">, need: number | undefined): boolean {
  return !need || need <= renownOf(g);
}

/** The tier players see: an item for sale stays locked until the party has the Renown it needs. */
export function tierOf(g: Pick<GameState, "renown">, it: Pick<Item, "tier" | "renown">): ItemTier {
  return it.tier === "sale" && !renownMet(g, it.renown) ? "locked" : it.tier;
}

/** The rank an item still waits on (only while that is what keeps it locked). */
export function renownNeeded(g: Pick<GameState, "renown">, it: Pick<Item, "tier" | "renown">): number | null {
  return (it.tier === "sale" || it.tier === "locked") && !renownMet(g, it.renown) ? (it.renown ?? 0) : null;
}

/** Open for business: not closed, and the party has the Renown this storefront needs. */
export function shopOpenNow(g: Pick<GameState, "renown">, sh: Pick<Shop, "closed" | "renown">): boolean {
  return !sh.closed && renownMet(g, sh.renown);
}

// ---------- the bounty board ----------

/** How many flyers (jobs and player flyers together) the notice board shows at once. */
export const BOARD_SLOTS = 8;

export function jobsOf(g: Pick<GameState, "jobs">): Job[] {
  return g.jobs ?? [];
}

/** Flyers on the board right now: pinned jobs and player flyers that are up. */
export function pinnedCount(g: Pick<GameState, "jobs" | "flyers">): number {
  return jobsOf(g).filter((j) => j.pinned).length + g.flyers.filter((f) => f.up).length;
}

/** "50 gp each", "500 gp total", or null when the reward is hidden. */
export function rewardText(r: Job["reward"], fmt: (cp: number) => string): string | null {
  if (r.kind === "hidden") return null;
  return `${fmt(r.cp)} ${r.kind === "each" ? "each" : "total"}`;
}

/** A sealed envelope's title as the room sees it. */
export function jobTitle(j: Pick<Job, "style" | "title">): string {
  return j.style === "sealed" ? "A sealed envelope" : j.title || "A job";
}

/**
 * What finishing a job pays by default: the reward to each player in the session
 * (or split evenly for a party total). Nothing for a hidden reward: the DM types it.
 */
export function defaultPayout(j: Pick<Job, "reward">, playerIds: string[]): { playerId: string; cp: number }[] {
  if (!playerIds.length || j.reward.kind === "hidden") return playerIds.map((playerId) => ({ playerId, cp: 0 }));
  if (j.reward.kind === "each") return playerIds.map((playerId) => ({ playerId, cp: j.reward.cp }));
  const base = Math.floor(j.reward.cp / playerIds.length);
  let extra = j.reward.cp - base * playerIds.length;
  return playerIds.map((playerId) => ({ playerId, cp: base + (extra-- > 0 ? 1 : 0) }));
}

/** Who a job pays by default: tonight's table, or the last session's, or everyone seated. */
export function payoutPlayers(g: Pick<GameState, "sessions" | "currentSessionId" | "players">): string[] {
  const seated = new Set(g.players.filter((p) => !p.archived).map((p) => p.id));
  const cur = g.sessions.find((x) => x.id === g.currentSessionId);
  const last = cur ?? [...g.sessions].filter((x) => x.endedAt !== null).sort((a, b) => (b.endedAt ?? 0) - (a.endedAt ?? 0))[0];
  const ids = (last?.attendeeIds ?? []).filter((id) => seated.has(id));
  return ids.length ? ids : [...seated];
}
