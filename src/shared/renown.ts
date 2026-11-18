// Renown: one shared party rank, and the bounty board it gates. Items,
// storefronts and job flyers can need a rank. The party also has a hidden
// running total of Renown points (from jobs and the DM's awards): crossing the
// next rank's threshold raises the rank. Points never lower it on their own.

import { BOARD_MAX, upCount } from "./board";
import type { GameState, Item, ItemTier, Job, Relation, Shop, TrustNeed } from "./types";

export interface RenownRank {
  name: string;
  meaning: string;
  /** Typical job pay, each. */
  pay: string;
  /** The TV line when the party reaches this rank. */
  raised: string;
  /** Renown points (running total) the party needs to reach this rank. Rank 1 is always 0. */
  points: number;
}

/** Default points to reach each rank, as a running total: 3, then 5 more, 8 more, 12 more. */
export const RENOWN_POINTS = [0, 3, 8, 16, 28];
/** Most points any rank can need. */
export const RENOWN_POINTS_MAX = 999;

/** The ladder with {town} for the campaign's town. Every campaign has these five steps; the DM can reword them. */
const LADDER: Omit<RenownRank, "points">[] = [
  { name: "Strangers", meaning: "Nobody knows your names yet", pay: "15–50 gp", raised: "Strangers in {town}" },
  { name: "Known in town", meaning: "Locals nod at you", pay: "50–150 gp", raised: "{Town} knows your names" },
  { name: "Trusted", meaning: "The council and merchants come to you", pay: "300–1,000 gp", raised: "{Town} trusts you" },
  { name: "Heroes of {town}", meaning: "Your names are on things", pay: "1,000–5,000 gp", raised: "Heroes of {town}!" },
  { name: "Famous far and wide", meaning: "People in distant cities have heard of you", pay: "Whatever you negotiate", raised: "Your names have spread far beyond {town}" },
];

/** Candlefair's own wording, where it differs: the party came off a boat, and the big city is Baldur's Gate. */
const CANDLEFAIR: Partial<Omit<RenownRank, "points">>[] = [
  { meaning: "Fresh off the boat" },
  {},
  {},
  {},
  { name: "Famous on the Coast", meaning: "People in Baldur’s Gate have heard of you", raised: "Your names have reached Baldur’s Gate" },
];

function townName(g: Pick<GameState, "town">): string {
  return g.town === undefined ? "Candlefair" : g.town.trim();
}

/** The five ranks as this campaign words them: the DM's own text where set, else the defaults for its town. */
export function ranksOf(g: Pick<GameState, "town" | "renownRanks">): RenownRank[] {
  const town = townName(g);
  const fill = (t: string) =>
    t
      .replace(/\{Town\}/g, town || "The town")
      .replace(/\{town\}/g, town || "the town");
  return LADDER.map((base, i) => {
    const r = town === "Candlefair" ? { ...base, ...CANDLEFAIR[i] } : base;
    const o = g.renownRanks?.[i] ?? {};
    const pick = (k: keyof typeof base) => (o[k]?.trim() ? o[k]!.trim() : fill(r[k]));
    return { name: pick("name"), meaning: pick("meaning"), pay: pick("pay"), raised: pick("raised"), points: thresholdsOf(g)[i] };
  });
}

/**
 * Points (running total) to reach each rank: the DM's own where set, else the
 * defaults. Always 0 for the first rank and always rising, so a bad stored value
 * can never make two ranks share a threshold.
 */
export function thresholdsOf(g: Pick<GameState, "renownRanks">): number[] {
  const out: number[] = [];
  RENOWN_POINTS.forEach((d, i) => {
    const want = i === 0 ? 0 : (g.renownRanks?.[i]?.points ?? d);
    out.push(i === 0 ? 0 : Math.min(RENOWN_POINTS_MAX, Math.max(out[i - 1] + 1, Math.round(want))));
  });
  return out;
}

/** The Candlefair wording (kept for anything that has no campaign at hand). */
export const RENOWN: RenownRank[] = ranksOf({});
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

/** The party's Renown points. Games from before points: the current rank's threshold. */
export function pointsOf(g: Pick<GameState, "renown" | "renownPoints" | "renownRanks">): number {
  return g.renownPoints ?? thresholdsOf(g)[renownOf(g)];
}

/** The highest rank this many points reaches. */
export function rankForPoints(g: Pick<GameState, "renownRanks">, points: number): number {
  const t = thresholdsOf(g);
  let r = 0;
  t.forEach((need, i) => {
    if (points >= need) r = i;
  });
  return r;
}

export interface RenownProgress {
  points: number;
  rank: number;
  /** Points this rank needs. */
  floor: number;
  /** Points the next rank needs, or null at the top. */
  next: number | null;
  nextName: string | null;
  /** How far below this rank's own threshold the party has fallen (0 when not). */
  short: number;
  /** 0..1 along the way from this rank to the next (1 at the top). */
  frac: number;
}

/** Where the party stands on the way to its next rank. */
export function progressOf(g: Pick<GameState, "town" | "renown" | "renownPoints" | "renownRanks">): RenownProgress {
  const rank = renownOf(g);
  const ranks = ranksOf(g);
  const points = pointsOf(g);
  const floor = ranks[rank].points;
  const up = ranks[rank + 1];
  const next = up ? up.points : null;
  const frac = next === null ? 1 : Math.max(0, Math.min(1, (points - floor) / (next - floor)));
  return { points, rank, floor, next, nextName: up ? up.name : null, short: Math.max(0, floor - points), frac };
}

/** Points a job gives when it's done (1 on flyers from before points). */
export function jobPoints(j: Pick<Job, "renownPoints">): number {
  return j.renownPoints ?? 1;
}

export function rankName(rank: number, g?: Pick<GameState, "town" | "renownRanks">): string {
  return (g ? ranksOf(g) : RENOWN)[Math.max(0, Math.min(RENOWN_MAX, rank))].name;
}

/** Has the party reached this rank? No requirement is always met. */
export function renownMet(g: Pick<GameState, "renown">, need: number | undefined): boolean {
  return !need || need <= renownOf(g);
}

const TRUST: Record<Relation, number> = { hostile: -2, wary: -1, stranger: 0, friendly: 1, ally: 2 };

/** Does that person feel this well about the party? No requirement, or a deleted entry, is always met. */
export function trustMet(g: Pick<GameState, "entries">, need: TrustNeed | null | undefined): boolean {
  if (!need) return true;
  const e = (g.entries ?? []).find((x) => x.id === need.entryId);
  if (!e) return true;
  return TRUST[e.relation ?? "stranger"] >= TRUST[need.relation];
}

/** Both locks: the party's Renown and someone's goodwill. */
type Gated = Pick<GameState, "renown" | "entries">;
export function gateMet(g: Gated, x: { renown?: number; trust?: TrustNeed | null }): boolean {
  return renownMet(g, x.renown) && trustMet(g, x.trust);
}

/**
 * What players read while someone's goodwill is what keeps it locked: "Mags Wick’s
 * friendship". Someone they haven't met is just "someone".
 */
export function trustText(g: Pick<GameState, "entries">, need: TrustNeed | null | undefined): string | null {
  if (trustMet(g, need)) return null;
  const e = (g.entries ?? []).find((x) => x.id === need!.entryId)!;
  const who = e.stage === "found" || e.stage === "known" ? e.name : "someone";
  return `${who}’s ${need!.relation === "ally" ? "trust as an ally" : "friendship"}`;
}

/** The tier players see: an item for sale stays locked until the party has the Renown (and goodwill) it needs. */
export function tierOf(g: Gated, it: Pick<Item, "tier" | "renown" | "trust">): ItemTier {
  return it.tier === "sale" && !gateMet(g, it) ? "locked" : it.tier;
}

/** The rank an item still waits on (only while that is what keeps it locked). */
export function renownNeeded(g: Pick<GameState, "renown">, it: Pick<Item, "tier" | "renown">): number | null {
  return (it.tier === "sale" || it.tier === "locked") && !renownMet(g, it.renown) ? (it.renown ?? 0) : null;
}

/** Open for business: not closed, and the party has the Renown this storefront needs. */
export function shopOpenNow(g: Gated, sh: Pick<Shop, "closed" | "renown" | "trust">): boolean {
  return !sh.closed && gateMet(g, sh);
}

// ---------- the bounty board ----------

/** How many notes (plain notes, jobs and player flyers together) the notice board shows at once. */
export const BOARD_SLOTS = BOARD_MAX;

export function jobsOf(g: Pick<GameState, "jobs">): Job[] {
  return g.jobs ?? [];
}

/** Notes on the board right now: plain notes, pinned jobs and player flyers that are up. */
export function pinnedCount(g: Pick<GameState, "jobs" | "flyers" | "notices">): number {
  return upCount(g);
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
