// The off-script kit: where the party is, portable clues, quick notes, and the
// "Here" section that gathers everything tied to the current place.
//
// All DM-ONLY. Nothing here is copied into a TV or player view (projection.ts
// builds those from allow-lists); the only things players ever see come from
// the actions the DM takes with it (a reveal, a fact, a show).

import { entriesOf } from "./discovery";
import { leadsOf } from "./leads";
import { storyOf } from "./story";
import { partyById, tableParty, worldOn } from "./world";
import type { Capture, Clue, Entry, GameState, Here, Lead, StoryBeat } from "./types";

export const CLUES_MAX = 400;
export const CLUE_MAX = 400;
export const CLUE_TAGS_MAX = 12;
export const CAPTURES_MAX = 300;
export const CAPTURE_MAX = 500;
/** The prep checklist asks for at least this many clues per episode. */
export const CLUES_WANTED = 5;
export const PLACE_KINDS = new Set(["place"]);

export function cluesOf(g: Pick<GameState, "clues">): Clue[] {
  return g.clues ?? [];
}

export function capturesOf(g: Pick<GameState, "captures">): Capture[] {
  return g.captures ?? [];
}

/** Where the party at the table is now. A shared world keeps one per party. */
export function hereOf(g: Pick<GameState, "here" | "parties" | "partyId" | "world" | "entries">): Entry | undefined {
  const h = hereRecord(g);
  return h ? entriesOf(g).find((e) => e.id === h.placeId) : undefined;
}

export function hereRecord(g: Pick<GameState, "here" | "parties" | "partyId" | "world">): Here | undefined {
  if (worldOn(g)) return tableParty(g)?.here;
  return g.here;
}

/** Set (or clear) where the party at the table is. Returns true if it changed. */
export function writeHere(g: GameState, placeId: string | null, now: number): boolean {
  const before = hereRecord(g)?.placeId ?? null;
  if (before === placeId) return false;
  const rec: Here | undefined = placeId ? { placeId, since: now } : undefined;
  if (worldOn(g)) {
    const p = partyById(g, g.partyId);
    if (!p) return false;
    if (rec) p.here = rec;
    else delete p.here;
  } else if (rec) g.here = rec;
  else delete g.here;
  return true;
}

const lower = (t: string) => t.trim().toLowerCase();

/** Entries that are in a place: linked either way, or listing it (by name) as an area. */
function inPlace(place: Entry, e: Entry): boolean {
  if (e.id === place.id) return false;
  if (e.links.includes(place.id) || place.links.includes(e.id)) return true;
  const name = lower(place.name);
  return e.areas.some((a) => lower(a) === name);
}

export interface HereView {
  place: Entry;
  people: Entry[];
  /** Places inside it (and shops). */
  sites: Entry[];
  leads: Lead[];
  beats: StoryBeat[];
  clues: Clue[];
}

/** Is this lead the playing party's (or everyone's)? */
function partyLead(g: Pick<GameState, "partyId" | "world">, l: Lead): boolean {
  return !worldOn(g) || !l.partyId || l.partyId === g.partyId;
}

/** Everything tied to the current place, for the off-script panel's Here section. */
export function hereView(g: GameState, place: Entry | undefined = hereOf(g)): HereView | null {
  if (!place) return null;
  const all = entriesOf(g);
  const people = all.filter((e) => e.kind === "person" && inPlace(place, e));
  const sites = all.filter((e) => (e.kind === "place" || e.kind === "shop") && inPlace(place, e));
  const leads = leadsOf(g).filter((l) => l.status === "open" && l.placeId === place.id && partyLead(g, l));
  const tied = new Set([place.id, ...people.map((p) => p.id)]);
  const beats = storyOf(g).beats.filter(
    (b) => (b.status === "planned" || b.status === "placed") && (b.anywhere || b.links.some((l) => l.kind === "entry" && l.id === place.id)),
  );
  const clues = cluesOf(g).filter((c) => c.status === "ready" && c.tags.some((t) => tied.has(t)));
  return { place, people, sites, leads, beats, clues };
}

/** The clues to show in run-game mode: this episode's ready ones first, then the pool's. */
export function readyClues(g: Pick<GameState, "clues">, episodeId: string | null | undefined): Clue[] {
  const ready = cluesOf(g).filter((c) => c.status === "ready");
  return [...ready.filter((c) => episodeId && c.episodeId === episodeId), ...ready.filter((c) => c.episodeId === null)];
}

/** How many clues an episode has written for it (any status but dropped). */
export function episodeClueCount(g: Pick<GameState, "clues">, episodeId: string): number {
  return cluesOf(g).filter((c) => c.episodeId === episodeId && c.status !== "dropped").length;
}

/** Undelivered clues of an episode, for its wrap-up. */
export function leftoverClues(g: Pick<GameState, "clues">, episodeId: string): Clue[] {
  return cluesOf(g).filter((c) => c.episodeId === episodeId && c.status === "ready");
}
