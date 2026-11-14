// Discovery: everything in the world (people, places, shops, monsters,
// mysteries, factions) goes hidden -> rumored -> found -> known.
//
// Spoiler safety: a hidden entry never leaves the server for the TV or a phone,
// not even as a count. A rumored one goes out as its nickname (or "???"), its
// hint and a silhouette: never its real name, image, facts, links or notes.
// Found and known entries go out with their real fields and only the facts the
// DM has revealed. Links show only when both ends are visible. DM notes and
// secrets never leave. Notes about an entry are ordinary Chronicle notes tagged
// with its name, so they come along with the Chronicle and cost nothing extra.

import type { Art, Entry, EntryFact, EntryKind, GameState, Relation, Scene, Stage } from "./types";

/** Same as the Chronicle's tagKey (kept here so the two modules don't import each other). */
const tagKey = (t: string) => t.replace(/\s+/g, " ").trim().toLowerCase();

export const ENTRIES_MAX = 400;
export const FACTS_MAX = 40;
export const NAME_MAX = 80;
export const TITLE_MAX = 160;
export const SUMMARY_MAX = 1000;
export const HINT_MAX = 300;
export const FACT_MAX = 600;
export const DM_TEXT_MAX = 4000;
export const AREAS_MAX = 8;
export const LINKS_MAX = 20;

export const STAGES: Stage[] = ["hidden", "rumored", "found", "known"];
export const STAGE_IDS = STAGES as [Stage, ...Stage[]];
export const stageRank = (s: Stage) => STAGES.indexOf(s);
export const isFound = (s: Stage) => s === "found" || s === "known";

export const KINDS: { id: EntryKind; label: string; plural: string; found: string }[] = [
  { id: "person", label: "Person", plural: "People", found: "Met" },
  { id: "place", label: "Place", plural: "Places", found: "Visited" },
  { id: "shop", label: "Shop", plural: "Shops", found: "Open" },
  { id: "monster", label: "Monster", plural: "Monsters", found: "Encountered" },
  { id: "mystery", label: "Mystery", plural: "Mysteries", found: "Found" },
  { id: "faction", label: "Faction", plural: "Factions", found: "Found" },
];

export function kindInfo(kind: EntryKind) {
  return KINDS.find((k) => k.id === kind) ?? { id: kind, label: kind, plural: kind, found: "Found" };
}

/** "Met", "Rumored", "Known"... as players and the DM read a stage. */
export function stageLabel(kind: EntryKind, stage: Stage): string {
  if (stage === "hidden") return "Hidden";
  if (stage === "rumored") return "Rumored";
  if (stage === "known") return "Known";
  return kindInfo(kind).found;
}

export const RELATIONS: { id: Relation; label: string }[] = [
  { id: "stranger", label: "Stranger" },
  { id: "friendly", label: "Friendly" },
  { id: "ally", label: "Ally" },
  { id: "hostile", label: "Hostile" },
];
export const RELATION_IDS = RELATIONS.map((r) => r.id) as [Relation, ...Relation[]];
export const relationLabel = (r: Relation | undefined) => RELATIONS.find((x) => x.id === (r ?? "stranger"))!.label;

export function entriesOf(g: Pick<GameState, "entries">): Entry[] {
  return g.entries ?? [];
}

export function slugify(t: string): string {
  return (
    t
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/['’]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40)
      .replace(/-+$/, "") || "x"
  );
}

/** A slug for an entry, unique among entries of its kind. */
export function uniqueSlug(list: Entry[], kind: EntryKind, want: string, exceptId?: string): string {
  const base = slugify(want);
  const taken = new Set(list.filter((e) => e.kind === kind && e.id !== exceptId).map((e) => e.slug));
  let slug = base;
  for (let i = 2; taken.has(slug); i++) slug = `${base}-${i}`;
  return slug;
}

/** A slug for a fact: its first few words, unique within the entry. */
export function factSlug(facts: EntryFact[], text: string, exceptId?: string): string {
  const base = slugify(text.split(/\s+/).slice(0, 5).join(" "));
  const taken = new Set(facts.filter((f) => f.id !== exceptId).map((f) => f.slug));
  let slug = base;
  for (let i = 2; taken.has(slug); i++) slug = `${base}-${i}`;
  return slug;
}

/** "person/mags" or "person/mags/owes-the-baker". */
export function findRef(g: Pick<GameState, "entries">, ref: string): { entry: Entry; fact?: EntryFact } | null {
  const [kind, slug, fact] = ref.trim().toLowerCase().split("/");
  const entry = entriesOf(g).find((e) => e.kind === kind && e.slug === slug);
  if (!entry) return null;
  if (fact === undefined) return { entry };
  const f = entry.facts.find((x) => x.slug === fact);
  return f ? { entry, fact: f } : null;
}

/** The entry's portrait scene, if it's still a portrait. */
export function entryScene(g: Pick<GameState, "scenes">, e: Pick<Entry, "sceneId">): Scene | undefined {
  const sc = e.sceneId ? g.scenes.find((x) => x.id === e.sceneId) : undefined;
  return sc?.kind === "portrait" ? sc : undefined;
}

/** Built-in portraits: served only through /api/art, and only once someone may see them. */
export const PORTRAIT_ART = new Set(["artum", "mags-wick", "chef"]);

/** The real picture, as a screen that may see it loads it. */
export function entryArt(g: Pick<GameState, "scenes" | "id">, e: Pick<Entry, "sceneId">): Art | undefined {
  const art = entryScene(g, e)?.art;
  if (art?.url) return { url: art.url };
  if (art?.builtin && PORTRAIT_ART.has(art.builtin)) return { url: `/api/art/${art.builtin}?game=${encodeURIComponent(g.id)}` };
  return undefined;
}

/** Entries that use this scene as their picture. */
export function entriesForScene(g: Pick<GameState, "entries">, sceneId: string): Entry[] {
  return entriesOf(g).filter((e) => e.sceneId === sceneId);
}

/**
 * Would sending this scene to the TV give someone away? A portrait whose
 * entries are all still hidden or rumored stays on the server until it's shown.
 */
export function sceneSpoils(g: Pick<GameState, "entries">, sc: Scene): boolean {
  if (sc.kind !== "portrait") return false;
  const linked = entriesForScene(g, sc.id);
  return linked.length > 0 && !linked.some((e) => isFound(e.stage));
}

/** May anyone who isn't the DM load this built-in portrait right now? */
export function portraitArtAllowed(g: GameState, builtin: string): boolean {
  const live = g.scenes.find((sc) => sc.id === g.live.sceneId);
  if (live?.art?.builtin === builtin) return true;
  return g.scenes.some((sc) => sc.kind === "portrait" && sc.art?.builtin === builtin && !sceneSpoils(g, sc));
}

/** The tags that file a Chronicle note under this entry: its name, and its portrait's caption if it differs. */
export function entryTags(g: Pick<GameState, "scenes">, e: Pick<Entry, "name" | "sceneId">): string[] {
  const out: string[] = [];
  const add = (t: string | undefined) => {
    const v = t?.replace(/\s+/g, " ").trim();
    if (v && !out.some((x) => tagKey(x) === tagKey(v))) out.push(v);
  };
  add(e.name);
  const sc = entryScene(g, e);
  if (sc) add(sc.name || sc.label);
  return out;
}

/** A new person for a portrait scene, named from its caption. */
export function entryFromScene(list: Entry[], sc: Scene, id: string): Entry {
  const name = (sc.name?.trim() || sc.label).slice(0, NAME_MAX);
  return blankEntry(list, id, "person", name, { title: (sc.title ?? "").slice(0, TITLE_MAX), sceneId: sc.id });
}

export function blankEntry(list: Entry[], id: string, kind: EntryKind, name: string, extra: Partial<Entry> = {}): Entry {
  return { id, kind, slug: uniqueSlug(list, kind, name), stage: "hidden", name, title: "", summary: "", nickname: "", hint: "", areas: [], links: [], facts: [], dmNote: "", secrets: "", ...extra };
}

export function revealedFacts(e: Entry): EntryFact[] {
  return e.facts.filter((f) => f.revealedAt !== undefined);
}

// ---------------------------------------------------------------------------
// What the TV and phones get

export interface PublicFact {
  id: string;
  text: string;
  at: number;
}

export interface PublicTie {
  id: string;
  kind: EntryKind;
  name: string;
}

export interface PublicEntry {
  id: string;
  kind: EntryKind;
  stage: "rumored" | "found" | "known";
  /** The real name once found; while rumored, the nickname or "???". */
  name: string;
  /** Rumored only. */
  hint?: string;
  /** Rumored only: an uploaded silhouette (otherwise the screen draws the kind's own). */
  silhouette?: string;
  /** Found and known only. */
  title?: string;
  summary?: string;
  art?: Art;
  /** People, found: how they feel about the party (or about this player). */
  relation?: Relation;
  /** Revealed facts only, in the DM's order. */
  facts: PublicFact[];
  /** When it was found, and the chapter (session number) it was in. */
  found?: { at: number; chapter: number | null };
  /** Chronicle notes with any of these tags are about it (found only). */
  tags: string[];
  /** Other visible entries it's tied to. ("ties", not "links": map spoiler tests watch for that word.) */
  ties: PublicTie[];
  areas: string[];
  /** Newest thing to know about it, for "new" marks. */
  updatedAt: number;
}

/** The name players may see for an entry, or null if they may see nothing. */
export function publicName(e: Entry): string | null {
  if (e.stage === "hidden") return null;
  if (e.stage === "rumored") return e.nickname.trim() || "???";
  return e.name;
}

export function publicEntry(g: GameState, e: Entry, playerId?: string): PublicEntry | null {
  if (e.stage === "hidden") return null;
  const byId = new Map(entriesOf(g).map((x) => [x.id, x]));
  const ties: PublicTie[] = [];
  if (isFound(e.stage)) {
    for (const id of e.links) {
      const o = byId.get(id);
      const name = o ? publicName(o) : null;
      if (o && name) ties.push({ id: o.id, kind: o.kind, name });
    }
  }
  const at = e.stagedAt ?? e.foundAt ?? 0;
  if (e.stage === "rumored") {
    const out: PublicEntry = { id: e.id, kind: e.kind, stage: "rumored", name: publicName(e)!, facts: [], tags: [], ties, areas: [...e.areas], updatedAt: at };
    if (e.hint.trim()) out.hint = e.hint;
    if (e.silhouette) out.silhouette = e.silhouette;
    return out;
  }
  const facts = revealedFacts(e).map((f) => ({ id: f.id, text: f.text, at: f.revealedAt! }));
  const sess = e.foundIn ? g.sessions.find((x) => x.id === e.foundIn) : undefined;
  const out: PublicEntry = {
    id: e.id,
    kind: e.kind,
    stage: e.stage as "found" | "known",
    name: e.name,
    title: e.title,
    summary: e.summary,
    facts,
    found: { at: e.foundAt ?? 0, chapter: sess?.number ?? null },
    tags: entryTags(g, e),
    ties,
    areas: [...e.areas],
    updatedAt: Math.max(at, ...facts.map((f) => f.at)),
  };
  const art = entryArt(g, e);
  if (art) out.art = art;
  if (e.kind === "person") out.relation = (playerId && e.relationBy?.[playerId]) || e.relation || "stranger";
  return out;
}

/** Everything the party knows of, in the DM's order. */
export function publicEntries(g: GameState, playerId?: string): PublicEntry[] {
  return entriesOf(g)
    .map((e) => publicEntry(g, e, playerId))
    .filter((x): x is PublicEntry => x !== null);
}

/** The TV's reveal: a rumor appearing, someone found, or a new fact. Only what the room may see. */
export interface DiscoveryView {
  n: number;
  kind: EntryKind;
  stage: "rumored" | "found" | "known";
  /** Moving out of hidden or rumored: the TV fills the silhouette in. */
  reveal: boolean;
  name: string;
  title?: string;
  hint?: string;
  art?: Art;
  silhouette?: string;
  /** A fact just revealed. */
  fact?: string;
}

export function discoveryView(g: GameState): DiscoveryView | undefined {
  const m = g.discovery;
  const e = m && entriesOf(g).find((x) => x.id === m.entryId);
  if (!m || !e || e.stage === "hidden") return undefined;
  const out: DiscoveryView = { n: m.n, kind: e.kind, stage: e.stage, reveal: !!m.from && !isFound(m.from) && isFound(e.stage), name: publicName(e)! };
  if (e.stage === "rumored") {
    if (e.hint.trim()) out.hint = e.hint;
    if (e.silhouette) out.silhouette = e.silhouette;
    return out;
  }
  if (e.title) out.title = e.title;
  const art = entryArt(g, e);
  if (art) out.art = art;
  if (m.factId) {
    const f = e.facts.find((x) => x.id === m.factId);
    if (!f || f.revealedAt === undefined) return undefined;
    out.fact = f.text;
  }
  return out;
}
