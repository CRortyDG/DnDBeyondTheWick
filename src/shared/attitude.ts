// The NPC attitude tracker: how each person in Discover feels about the party.
//
// Under the hood it's a dial from -10 (hates you) to 10 (would die for you).
// The dial falls into five bands, and the bands are the old Relation values
// (plus Wary), so every lock that asks for "Friendly" or "Ally" keeps working.
//
//   hostile  -10..-6     wary  -5..-2     stranger  -1..1     friendly  2..5     ally  6..10
//
// The party has one place on the dial. Each character can sit a little above
// or below it (attitudeBy holds the difference), so the baker can like the
// party and still glare at the one who stole her pies. Every move is logged
// with its reason; players see as much of it as the DM picks.

import type { AttitudeSettings, AttitudeShift, Entry, GameState, Job, Relation } from "./types";

export const ATTITUDE_MIN = -10;
export const ATTITUDE_MAX = 10;
export const ATTITUDE_LOG_MAX = 40;
export const ATTITUDE_REASON_MAX = 160;
/** What players see of the reasons: the newest few. */
export const PUBLIC_REASONS = 8;

export interface Band {
  id: Relation;
  label: string;
  /** The lowest score in the band. */
  min: number;
  /** Where picking the band puts the dial. */
  base: number;
  /** For the DM: what it means at the table. */
  blurb: string;
}

/** Lowest first. */
export const BANDS: Band[] = [
  { id: "hostile", label: "Hostile", min: ATTITUDE_MIN, base: -6, blurb: "Works against you. Won't deal." },
  { id: "wary", label: "Wary", min: -5, base: -3, blurb: "Doesn't trust you. Short answers, higher prices." },
  { id: "stranger", label: "Stranger", min: -1, base: 0, blurb: "Doesn't know you yet." },
  { id: "friendly", label: "Friendly", min: 2, base: 3, blurb: "Likes you. Small favours, fair prices." },
  { id: "ally", label: "Ally", min: 6, base: 6, blurb: "On your side. Takes risks for you." },
];
export const BAND_IDS = BANDS.map((b) => b.id) as [Relation, ...Relation[]];

export const bandInfo = (r: Relation | undefined): Band => BANDS.find((b) => b.id === (r ?? "stranger")) ?? BANDS[2];
/** -2 hostile ... 2 ally: for "at least Friendly" checks. */
export const bandRank = (r: Relation | undefined): number => BANDS.indexOf(bandInfo(r)) - 2;

export const clampScore = (n: number) => Math.max(ATTITUDE_MIN, Math.min(ATTITUDE_MAX, Math.round(n)));

export function bandOf(score: number): Relation {
  const n = clampScore(score);
  let out: Relation = "hostile";
  for (const b of BANDS) if (n >= b.min) out = b.id;
  return out;
}

/** The party's place on the dial. */
export function partyScore(e: Pick<Entry, "attitude" | "relation">): number {
  return clampScore(e.attitude ?? bandInfo(e.relation).base);
}

/** How much more (or less) they like this character than the party. Older games only had a band per player. */
export function offsetOf(e: Pick<Entry, "attitude" | "relation" | "attitudeBy" | "relationBy">, playerId: string): number {
  const by = e.attitudeBy?.[playerId];
  if (by !== undefined) return by;
  const r = e.relationBy?.[playerId];
  return r ? bandInfo(r).base - partyScore(e) : 0;
}

/** This character's place on the dial. */
export function scoreFor(e: Pick<Entry, "attitude" | "relation" | "attitudeBy" | "relationBy">, playerId?: string | null): number {
  return clampScore(partyScore(e) + (playerId ? offsetOf(e, playerId) : 0));
}

/** The band for this character (or the party). */
export function relationOf(e: Pick<Entry, "attitude" | "relation" | "attitudeBy" | "relationBy">, playerId?: string | null): Relation {
  return bandOf(scoreFor(e, playerId));
}

/**
 * Write the dial down and keep the bands in step with it: relation is the
 * party's band, relationBy holds the characters whose band differs. Older
 * per-player bands turn into offsets the first time anything moves.
 */
export function syncBands(e: Entry): void {
  const party = partyScore(e);
  const by: Record<string, number> = {};
  for (const id of new Set([...Object.keys(e.relationBy ?? {}), ...Object.keys(e.attitudeBy ?? {})])) {
    // Never past the ends of the dial, so a big offset doesn't hide a party move.
    const off = clampScore(party + offsetOf(e, id)) - party;
    if (off) by[id] = off;
  }
  e.attitude = party;
  if (Object.keys(by).length) e.attitudeBy = by;
  else delete e.attitudeBy;
  const band = bandOf(party);
  if (band === "stranger") delete e.relation;
  else e.relation = band;
  const rel: Record<string, Relation> = {};
  for (const [id, off] of Object.entries(by)) {
    const r = bandOf(party + off);
    if (r !== band) rel[id] = r;
  }
  if (Object.keys(rel).length) e.relationBy = rel;
  else delete e.relationBy;
}

export const ATTITUDE_DEFAULTS: AttitudeSettings = { show: "band", tv: false, jobs: 1 };

export function attitudeSettings(g: Pick<GameState, "attitudes">): AttitudeSettings {
  return { ...ATTITUDE_DEFAULTS, ...(g.attitudes ?? {}) };
}

/** Does this move touch this character (a party move touches everyone)? */
export const shiftTouches = (x: Pick<AttitudeShift, "playerIds">, playerId?: string | null) => !x.playerIds?.length || (!!playerId && x.playerIds.includes(playerId));

/** "+2", "−1". */
export const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : "±0");

/** What a phone gets beyond the band: the dial, and the reasons the DM lets them see. */
export interface PublicAttitude {
  score: number;
  reasons?: { at: number; up: boolean; text: string }[];
}

export function publicAttitude(g: Pick<GameState, "attitudes">, e: Entry, playerId?: string): PublicAttitude | undefined {
  const { show } = attitudeSettings(g);
  if (show !== "dial" && show !== "reasons") return undefined;
  const out: PublicAttitude = { score: scoreFor(e, playerId) };
  if (show === "reasons") {
    out.reasons = (e.attitudeLog ?? [])
      .filter((x) => !x.secret && x.source !== "set" && x.delta !== 0 && x.reason.trim() && shiftTouches(x, playerId))
      .slice(-PUBLIC_REASONS)
      .reverse()
      .map((x) => ({ at: x.at, up: x.delta > 0, text: x.reason }));
  }
  return out;
}

const norm = (t: string) => t.replace(/\s+/g, " ").trim().toLowerCase();

/** The person a job was for: whoever's goodwill it needs, or the person it's signed by. */
export function jobPerson(g: Pick<GameState, "entries">, j: Pick<Job, "trust" | "postedBy">): Entry | undefined {
  const people = (g.entries ?? []).filter((e) => e.kind === "person");
  if (j.trust?.entryId) {
    const e = people.find((x) => x.id === j.trust!.entryId);
    if (e) return e;
  }
  const by = norm(j.postedBy ?? "");
  if (!by) return undefined;
  return people.find((e) => norm(e.name) === by) ?? people.find((e) => by.includes(norm(e.name)) && norm(e.name).length >= 4);
}

/** "Mags warms to you. Now Friendly." for the TV banner. */
export function bandLine(name: string, to: Relation, up: boolean, toWhom = "you"): string {
  const b = bandInfo(to).label;
  return up ? `${name} warms to ${toWhom}. Now ${b}.` : `${name} cools toward ${toWhom}. Now ${b}.`;
}
