// The People compendium: the NPCs the party has met.
//
// Spoiler safety: an NPC the party hasn't met never leaves the server for the TV
// or a phone, not even as a count. Once met, players get the name, title, blurb,
// portrait, mood and the facts the DM has revealed; never the DM's notes or the
// facts still locked. Interaction notes are ordinary Chronicle notes tagged with
// the NPC's name, so they come along with the Chronicle and cost nothing extra.

import type { Art, GameState, Npc, NpcFact, NpcMood, Scene } from "./types";

/** Same as the Chronicle's tagKey (kept here so the two modules don't import each other). */
const tagKey = (t: string) => t.replace(/\s+/g, " ").trim().toLowerCase();

export const NPCS_MAX = 200;
export const FACTS_MAX = 40;
export const NPC_NAME_MAX = 80;
export const NPC_TITLE_MAX = 160;
export const NPC_BLURB_MAX = 1000;
export const FACT_MAX = 600;
export const NPC_DM_NOTE_MAX = 4000;

export const MOODS: { id: NpcMood; label: string }[] = [
  { id: "ally", label: "On your side" },
  { id: "friendly", label: "Friendly" },
  { id: "neutral", label: "Neutral" },
  { id: "wary", label: "Wary of you" },
  { id: "hostile", label: "Hostile" },
];
export const MOOD_IDS = MOODS.map((m) => m.id) as [NpcMood, ...NpcMood[]];

export function moodLabel(m: NpcMood | undefined): string {
  return MOODS.find((x) => x.id === m)?.label ?? "";
}

export function npcsOf(g: Pick<GameState, "npcs">): Npc[] {
  return g.npcs ?? [];
}

/** Built-in portraits anyone may load. (Gated art is never an NPC's face.) */
const PUBLIC_PORTRAITS = new Set(["artum", "mags-wick", "chef"]);

/** The NPC's portrait scene, if it's still a portrait. */
export function npcScene(g: Pick<GameState, "scenes">, npc: Pick<Npc, "sceneId">): Scene | undefined {
  const sc = npc.sceneId ? g.scenes.find((x) => x.id === npc.sceneId) : undefined;
  return sc?.kind === "portrait" ? sc : undefined;
}

/** Their face, as the room may load it. */
export function npcArt(g: Pick<GameState, "scenes">, npc: Pick<Npc, "sceneId">): Art | undefined {
  const art = npcScene(g, npc)?.art;
  if (art?.url) return { url: art.url };
  if (art?.builtin && PUBLIC_PORTRAITS.has(art.builtin)) return { builtin: art.builtin };
  return undefined;
}

/** The tags that file a Chronicle note under this NPC: their name, and their portrait's caption if it differs. */
export function npcTags(g: Pick<GameState, "scenes">, npc: Pick<Npc, "name" | "sceneId">): string[] {
  const out: string[] = [];
  const add = (t: string | undefined) => {
    const v = t?.replace(/\s+/g, " ").trim();
    if (v && !out.some((x) => tagKey(x) === tagKey(v))) out.push(v);
  };
  add(npc.name);
  const sc = npcScene(g, npc);
  if (sc) add(sc.name || sc.label);
  return out;
}

/** A new entry for a portrait scene, named from its caption. */
export function npcFromScene(sc: Scene, id: string): Npc {
  return { id, name: (sc.name?.trim() || sc.label).slice(0, NPC_NAME_MAX), title: (sc.title ?? "").slice(0, NPC_TITLE_MAX), blurb: "", sceneId: sc.id, facts: [], dmNote: "" };
}

// ---------------------------------------------------------------------------
// What the TV and phones get

export interface PublicFact {
  id: string;
  text: string;
  at: number;
}

export interface PublicNpc {
  id: string;
  name: string;
  title: string;
  blurb: string;
  art?: Art;
  mood?: NpcMood;
  /** Revealed facts only, in the DM's order. */
  facts: PublicFact[];
  /** When they met, and the chapter (session number) it was in. */
  met: { at: number; chapter: number | null };
  /** Chronicle notes with any of these tags are about them. */
  tags: string[];
  /** Newest thing to know: meeting them, or a fact revealed. For "new" marks. */
  updatedAt: number;
}

export function revealedFacts(npc: Npc): NpcFact[] {
  return npc.facts.filter((f) => f.revealedAt !== undefined);
}

export function publicNpc(g: GameState, npc: Npc): PublicNpc | null {
  if (!npc.met) return null;
  const facts = revealedFacts(npc).map((f) => ({ id: f.id, text: f.text, at: f.revealedAt! }));
  const sess = npc.met.sessionId ? g.sessions.find((x) => x.id === npc.met!.sessionId) : undefined;
  const out: PublicNpc = {
    id: npc.id,
    name: npc.name,
    title: npc.title,
    blurb: npc.blurb,
    facts,
    met: { at: npc.met.at, chapter: sess?.number ?? null },
    tags: npcTags(g, npc),
    updatedAt: Math.max(npc.met.at, ...facts.map((f) => f.at)),
  };
  const art = npcArt(g, npc);
  if (art) out.art = art;
  if (npc.mood) out.mood = npc.mood;
  return out;
}

/** Everyone the party has met, in the DM's order. */
export function publicPeople(g: GameState): PublicNpc[] {
  return npcsOf(g)
    .map((n) => publicNpc(g, n))
    .filter((x): x is PublicNpc => x !== null);
}

/** The TV's "new face" (or "now you know") moment. Only for met NPCs and revealed facts. */
export interface NpcMomentView {
  n: number;
  name: string;
  title: string;
  art?: Art;
  /** A fact just revealed; without it, they've just met. */
  fact?: string;
}

export function npcMomentView(g: GameState): NpcMomentView | undefined {
  const m = g.npcMoment;
  const npc = m && npcsOf(g).find((x) => x.id === m.npcId);
  if (!m || !npc?.met) return undefined;
  const out: NpcMomentView = { n: m.n, name: npc.name, title: npc.title };
  const art = npcArt(g, npc);
  if (art) out.art = art;
  if (m.factId) {
    const f = npc.facts.find((x) => x.id === m.factId);
    if (!f || f.revealedAt === undefined) return undefined;
    out.fact = f.text;
  }
  return out;
}
