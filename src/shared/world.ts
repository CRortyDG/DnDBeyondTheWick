// The shared world: one campaign, several parties, one calendar.
//
// What a character knows (people, places, facts, pins, maps) is kept per
// character in knownBy. The game's own fields (entry.stage, fact.revealedAt,
// pin.discovered, scene.known, the shop's visibility, renown) always show the
// TABLE: what everyone present knows, the table's lowest. So every rule that
// reads them (the TV, gates, run sheets) keeps working unchanged.
//
// After each command, recordKnowledge() writes what changed at the table into
// knownBy for the characters present, and when who's present changes it works
// the table's view out again from knownBy. A phone gets materialize() with just
// its own character, so it shows what that character knows.

import { isFound, stageRank } from "./discovery";
import { pointsOf, RENOWN_MAX, thresholdsOf } from "./renown";
import type { Entry, GameState, Party, Scene, Stage, WorldEvent } from "./types";

export const PARTIES_MAX = 12;
export const PARTY_COLORS = ["#c99a3a", "#4f7a9a", "#b0473a", "#5d8a5a", "#8a5a9a", "#3f8a86", "#a86a3a", "#9a4f6a"];
export const WORLD_EVENTS_MAX = 40;

export function worldOn(g: Pick<GameState, "world">): boolean {
  return !!g.world;
}

export function partiesOf(g: Pick<GameState, "parties">): Party[] {
  return g.parties ?? [];
}

export function partyById(g: Pick<GameState, "parties">, id: string | null | undefined): Party | undefined {
  return id ? partiesOf(g).find((p) => p.id === id) : undefined;
}

/** The party at the table right now. */
export function tableParty(g: Pick<GameState, "parties" | "partyId">): Party | undefined {
  return partyById(g, g.partyId);
}

/** Parties a character plays in. */
export function partiesFor(g: Pick<GameState, "parties">, playerId: string): Party[] {
  return partiesOf(g).filter((p) => p.memberIds.includes(playerId));
}

/** Who is at the table: everyone not away and not gone. */
export function presentIds(g: Pick<GameState, "players">): string[] {
  return g.players.filter((p) => !p.archived && !p.away).map((p) => p.id);
}

const maxStage = (a: Stage, b: Stage): Stage => (stageRank(a) >= stageRank(b) ? a : b);
const minStage = (a: Stage, b: Stage): Stage => (stageRank(a) <= stageRank(b) ? a : b);

/** A character's own stage with an entry. */
export function stageFor(e: Pick<Entry, "knownBy">, playerId: string): Stage {
  return e.knownBy?.[playerId] ?? "hidden";
}

/** The lowest stage among these characters (nobody: hidden). */
export function lowestStage(e: Pick<Entry, "knownBy">, ids: string[]): Stage {
  if (!ids.length) return "hidden";
  return ids.reduce<Stage>((m, id) => minStage(m, stageFor(e, id)), "known");
}

const allIn = (list: string[] | undefined, ids: string[]) => ids.length > 0 && ids.every((id) => list?.includes(id));

/** Portraits: someone linked is found for everyone here. Maps: everyone here has seen it. */
function sceneKnown(g: GameState, sc: Scene, ids: string[]): boolean {
  if (allIn(sc.knownBy, ids)) return true;
  if (sc.kind !== "portrait") return false;
  return (g.entries ?? []).some((e) => e.sceneId === sc.id && isFound(lowestStage(e, ids)));
}

/**
 * Set the game's own fields to what these characters all know. Mutates g.
 * Used for the table (everyone present) and, on a copy, for one phone.
 */
export function materialize(g: GameState, ids: string[]): GameState {
  const placeOf = new Map<string, Entry>();
  for (const e of g.entries ?? []) {
    e.stage = lowestStage(e, ids);
    for (const f of e.facts) {
      if (allIn(Object.keys(f.knownBy ?? {}), ids)) f.revealedAt = Math.max(...ids.map((id) => f.knownBy![id]));
      else {
        delete f.revealedAt;
        delete f.learnedIn;
      }
    }
    if (e.pin) placeOf.set(`${e.pin.sceneId}/${e.pin.pinId}`, e);
  }
  for (const sc of g.scenes) {
    for (const p of sc.map?.pins ?? []) {
      const place = placeOf.get(`${sc.id}/${p.id}`);
      p.discovered = place ? place.stage !== "hidden" : allIn(p.knownBy, ids);
    }
    if (sc.kind === "portrait" || sc.kind === "map") {
      if (sceneKnown(g, sc, ids)) sc.known = true;
      else delete sc.known;
    }
  }
  for (const sh of g.shops) {
    const e = (g.entries ?? []).find((x) => x.shopId === sh.id);
    if (!e || sh.visibility === "some") continue;
    sh.visibility = isFound(e.stage) ? "all" : "hidden";
    if (sh.visibility === "hidden") sh.playerIds = [];
  }
  const points = tablePoints(g, ids);
  g.renown = tableRenown(g, ids);
  g.renownPoints = points;
  return g;
}

/** Take a pin, reveal or shop off the TV once the table can't see it any more. */
export function tidyLive(g: GameState): void {
  // A pin or reveal the table can't see any more.
  const live = g.scenes.find((x) => x.id === g.live.sceneId);
  const visible = (pinId?: string) => !!pinId && !!live?.map?.pins.some((p) => p.id === pinId && p.discovered);
  if (g.live.focus && !visible(g.live.focus.pinId)) delete g.live.focus;
  if (g.live.banner && !visible(g.live.banner.pinId)) delete g.live.banner;
  if (g.discovery) {
    const e = (g.entries ?? []).find((x) => x.id === g.discovery!.entryId);
    if (!e || e.stage === "hidden") delete g.discovery;
  }
  const shop = g.shops.find((x) => x.id === g.live.shopId);
  if (shop && shop.visibility !== "all") g.live.shopOpen = false;
}

/** Best Renown among these characters (each character's own, else the campaign's old one). */
export function tableRenown(g: Pick<GameState, "players" | "renown">, ids: string[]): number {
  let best = -1;
  for (const id of ids) {
    const p = g.players.find((x) => x.id === id);
    if (p) best = Math.max(best, p.renown ?? g.renown ?? 0);
  }
  return best < 0 ? (g.renown ?? 0) : best;
}

/** A character's own Renown points (from before points: their rank's threshold). */
export function characterPoints(g: Pick<GameState, "renown" | "renownPoints" | "renownRanks">, p: { renown?: number; renownPoints?: number }): number {
  if (p.renownPoints !== undefined) return p.renownPoints;
  if (p.renown === undefined) return pointsOf(g);
  return thresholdsOf(g)[Math.max(0, Math.min(RENOWN_MAX, p.renown))];
}

/** The table's Renown points: the best of the characters with the table's (best) rank. */
export function tablePoints(g: Pick<GameState, "players" | "renown" | "renownPoints" | "renownRanks">, ids: string[]): number {
  const rank = tableRenown(g, ids);
  let best = -1;
  for (const id of ids) {
    const p = g.players.find((x) => x.id === id);
    if (p && (p.renown ?? g.renown ?? 0) === rank) best = Math.max(best, characterPoints(g, p));
  }
  return best < 0 ? pointsOf(g) : best;
}

/** The moment the campaign becomes a shared world: everyone knows what the table knows now. */
export function seedKnowledge(g: GameState, now: number): void {
  const ids = g.players.map((p) => p.id);
  for (const e of g.entries ?? []) {
    e.knownBy = e.stage === "hidden" ? {} : Object.fromEntries(ids.map((id) => [id, e.stage]));
    for (const f of e.facts) if (f.revealedAt !== undefined) f.knownBy = Object.fromEntries(ids.map((id) => [id, f.revealedAt!]));
  }
  for (const sc of g.scenes) {
    if (sc.known) sc.knownBy = [...ids];
    for (const p of sc.map?.pins ?? []) if (p.discovered) p.knownBy = [...ids];
  }
  const points = pointsOf(g);
  for (const p of g.players) {
    p.renown = g.renown ?? 0;
    p.renownPoints = points;
  }
  g.world = { since: now };
}

const sameSet = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x));

/**
 * After a command: what changed at the table goes into each present character's
 * memory. If who's present changed instead, the table is worked out again.
 */
export function recordKnowledge(before: GameState, after: GameState): void {
  if (!before.world || !after.world) return;
  const was = presentIds(before);
  const now = presentIds(after);
  if (!sameSet(was, now) || before.partyId !== after.partyId) {
    materialize(after, now);
    tidyLive(after);
    return;
  }
  const ids = now;
  const old = new Map((before.entries ?? []).map((e) => [e.id, e]));
  for (const e of after.entries ?? []) {
    const o = old.get(e.id);
    const from: Stage = o ? o.stage : "hidden";
    if (e.stage !== from) {
      const k = (e.knownBy ??= {});
      const up = stageRank(e.stage) > stageRank(from);
      for (const id of ids) k[id] = up ? maxStage(k[id] ?? "hidden", e.stage) : minStage(k[id] ?? "hidden", e.stage);
      for (const id of Object.keys(k)) if (k[id] === "hidden") delete k[id];
    }
    const oldFacts = new Map((o?.facts ?? []).map((f) => [f.id, f]));
    for (const f of e.facts) {
      const wasOn = oldFacts.get(f.id)?.revealedAt !== undefined;
      const isOn = f.revealedAt !== undefined;
      if (wasOn === isOn) continue;
      const k = (f.knownBy ??= {});
      for (const id of ids) {
        if (isOn) k[id] ??= f.revealedAt!;
        else delete k[id];
      }
    }
  }
  const oldScenes = new Map(before.scenes.map((x) => [x.id, x]));
  for (const sc of after.scenes) {
    const o = oldScenes.get(sc.id);
    if (!!o?.known !== !!sc.known) sc.knownBy = edit(sc.knownBy, ids, !!sc.known);
    const oldPins = new Map((o?.map?.pins ?? []).map((p) => [p.id, p]));
    for (const p of sc.map?.pins ?? []) {
      const op = oldPins.get(p.id);
      if (!!op?.discovered !== p.discovered) p.knownBy = edit(p.knownBy, ids, p.discovered);
    }
  }
  if ((before.renown ?? 0) !== (after.renown ?? 0)) {
    for (const p of after.players) if (ids.includes(p.id)) p.renown = after.renown ?? 0;
  }
  // Renown points the table earned (or lost) are every present character's.
  if (pointsOf(before) !== pointsOf(after) || (before.renown ?? 0) !== (after.renown ?? 0)) {
    for (const p of after.players) if (ids.includes(p.id)) p.renownPoints = pointsOf(after);
  }
}

function edit(list: string[] | undefined, ids: string[], add: boolean): string[] {
  const set = new Set(list ?? []);
  for (const id of ids) {
    if (add) set.add(id);
    else set.delete(id);
  }
  return [...set];
}

/** A character joins a party: they catch up on what everyone already in it knows. */
export function catchUp(g: GameState, playerId: string, party: Party): void {
  const others = party.memberIds.filter((id) => id !== playerId && g.players.some((p) => p.id === id && !p.archived));
  if (!others.length) return;
  for (const e of g.entries ?? []) {
    const low = lowestStage(e, others);
    if (low !== "hidden") {
      const k = (e.knownBy ??= {});
      k[playerId] = maxStage(k[playerId] ?? "hidden", low);
    }
    for (const f of e.facts) {
      if (!allIn(Object.keys(f.knownBy ?? {}), others)) continue;
      f.knownBy![playerId] ??= Math.max(...others.map((id) => f.knownBy![id]));
    }
  }
  for (const sc of g.scenes) {
    if (allIn(sc.knownBy, others)) sc.knownBy = edit(sc.knownBy, [playerId], true);
    for (const p of sc.map?.pins ?? []) if (allIn(p.knownBy, others)) p.knownBy = edit(p.knownBy, [playerId], true);
  }
}

/** Someone at the table tells the others about an entry: they hear of it (or meet it) and learn the facts picked. */
export function tellTable(g: GameState, e: Entry, fromId: string, to: Stage, factIds: string[], now: number): string[] {
  const k = (e.knownBy ??= {});
  const teller = stageFor(e, fromId);
  if (teller === "hidden") return [];
  const give = minStage(to, teller);
  const told: string[] = [];
  for (const id of presentIds(g)) {
    if (id === fromId) continue;
    if (stageRank(k[id] ?? "hidden") < stageRank(give)) {
      k[id] = give;
      told.push(id);
    }
    for (const f of e.facts) {
      if (!factIds.includes(f.id) || f.knownBy?.[fromId] === undefined) continue;
      if ((f.knownBy ??= {})[id] === undefined) {
        f.knownBy[id] = now;
        if (!told.includes(id)) told.push(id);
      }
    }
  }
  return told;
}

/** Who knows an entry, for the DM: name and stage, furthest first. */
export function whoKnows(g: Pick<GameState, "players">, e: Pick<Entry, "knownBy">): { id: string; stage: Stage }[] {
  return Object.entries(e.knownBy ?? {})
    .filter(([id, st]) => st !== "hidden" && g.players.some((p) => p.id === id))
    .map(([id, stage]) => ({ id, stage }))
    .sort((a, b) => stageRank(b.stage) - stageRank(a.stage));
}

/**
 * Party-scoped things the viewer shouldn't see: other parties' leads, votes,
 * chapters and jobs. partyIds: the viewer's parties (the TV: the table's party).
 */
export function scopeToParties(g: GameState, partyIds: string[], playerId?: string): GameState {
  const mine = (pid: string | undefined) => !pid || partyIds.includes(pid);
  if (g.leads) g.leads = g.leads.filter((l) => mine(l.partyId));
  if (g.vote && !mine(g.vote.partyId)) delete g.vote;
  if (g.chosen && !(g.leads ?? []).some((l) => l.id === g.chosen!.leadId)) delete g.chosen;
  // Chapters: of the viewer's parties, or ones they played in as a guest.
  const keep = new Set(g.sessions.filter((x) => mine(x.partyId) || (!!playerId && x.attendeeIds.includes(playerId))).map((x) => x.id));
  g.sessions = g.sessions.filter((x) => keep.has(x.id));
  if (g.currentSessionId && !keep.has(g.currentSessionId)) g.currentSessionId = null;
  if (g.notes) g.notes = g.notes.filter((n) => n.world || (n.sessionId ? keep.has(n.sessionId) : mine(n.partyId)));
  if (g.jobs) g.jobs = g.jobs.filter((j) => !j.parties?.length || j.parties.some((p) => partyIds.includes(p)) || (!!j.partyId && partyIds.includes(j.partyId)));
  return g;
}

/** The TV's view of the game: the table (already materialized) and only the playing party's things. */
export function tvLens(g: GameState): GameState {
  if (!g.world) return g;
  const out = structuredClone(g);
  return scopeToParties(out, g.partyId ? [g.partyId] : []);
}

/** One phone's view of the game: what that character knows, and their parties' things. */
export function playerLens(g: GameState, playerId: string): GameState {
  if (!g.world) return g;
  const out = structuredClone(g);
  const here = presentIds(g).includes(playerId);
  materialize(out, [playerId]);
  tidyLive(out);
  // At the table, jobs and shops open to the table's Renown; away, to their own.
  out.renown = here ? (g.renown ?? 0) : tableRenown(g, [playerId]);
  out.renownPoints = here ? pointsOf(g) : tablePoints(g, [playerId]);
  // The map on the TV is the table's: a phone at the table sees what the room sees there.
  if (here) {
    const live = out.scenes.find((x) => x.id === g.live.sceneId);
    const real = g.scenes.find((x) => x.id === g.live.sceneId);
    if (live?.map && real?.map) {
      for (const p of live.map.pins) p.discovered = p.discovered || !!real.map.pins.find((x) => x.id === p.id)?.discovered;
    }
    out.live = structuredClone(g.live);
  } else {
    // Not at the table: the TV's live scene, fight and moments aren't theirs.
    delete out.fight;
    delete out.discovery;
    delete out.recapCard;
    delete out.diceRoll;
    delete out.tvRolls;
    delete out.renownMoment;
    delete out.levelMoment;
    out.live = { ...out.live, focus: undefined, banner: undefined, leads: false, shopOpen: false };
  }
  return scopeToParties(out, partiesFor(g, playerId).map((p) => p.id), playerId);
}

/** Today's events, and the next one coming. */
export function worldCalendar(g: Pick<GameState, "world">): { date?: string; now: WorldEvent[]; next?: WorldEvent & { inDays: number } } {
  const date = g.world?.date;
  const events = [...(g.world?.events ?? [])].sort((a, b) => a.from.localeCompare(b.from));
  if (!date) return { now: [] };
  const now = events.filter((e) => e.from <= date && date <= e.to);
  const nx = events.find((e) => e.from > date);
  return { date, now, ...(nx ? { next: { ...nx, inDays: daysBetween(date, nx.from) } } : {}) };
}

export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
}

export function addDays(d: string, n: number): string {
  return new Date(Date.parse(`${d}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
}

/** "December 3, 2026". */
export function longDay(d: string): string {
  const [y, m, day] = d.split("-").map(Number);
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return `${months[m - 1]} ${day}, ${y}`;
}

/** What a phone or the TV may know of the world: the date, events, the party at the table and the latest news. */
export interface WorldView {
  date?: string;
  now: { name: string; note: string; to: string }[];
  next?: { name: string; note: string; from: string; inDays: number };
  news?: { n: number; text: string };
  /** The party at the table (the TV), or the viewer's parties (a phone). */
  parties: { id: string; name: string; color: string }[];
}

export function worldView(g: GameState, parties: Party[]): WorldView | undefined {
  if (!g.world) return undefined;
  const cal = worldCalendar(g);
  return {
    ...(cal.date ? { date: cal.date } : {}),
    now: cal.now.map((e) => ({ name: e.name, note: e.note, to: e.to })),
    ...(cal.next ? { next: { name: cal.next.name, note: cal.next.note, from: cal.next.from, inDays: cal.next.inDays } } : {}),
    ...(g.world.news ? { news: { n: g.world.news.n, text: g.world.news.text } } : {}),
    parties: parties.map((p) => ({ id: p.id, name: p.name, color: p.color })),
  };
}

export function partyName(g: Pick<GameState, "parties">, id: string | undefined): string | undefined {
  return partyById(g, id)?.name;
}

export const STAGE_NAMES: Record<Stage, string> = { hidden: "hidden", rumored: "heard of", found: "met", known: "knows well" };
