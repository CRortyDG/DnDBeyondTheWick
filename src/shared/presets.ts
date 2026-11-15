// Where a campaign starts: blank, the built-in Candlefair setup, or a preset a
// DM saved from one of their campaigns. A preset is the campaign's setup only
// (scenes, maps, shops, items, Discovery, episodes, monsters, jobs, the board,
// the storyboard): never its players, gold, ledger, sessions or Chronicle.

import { DEFAULT_SEATS, emptyProgress, freshStart, seedGame } from "./seed";
import { emptyStory } from "./story";
import type { GameState, Player } from "./types";

/** Where a campaign started. Missing on campaigns made before presets: they started as Candlefair. */
export type Origin = { kind: "blank" } | { kind: "candlefair" } | { kind: "preset"; code: string; name: string };

export function originOf(g: Pick<GameState, "origin">): Origin {
  return g.origin ?? { kind: "candlefair" };
}

/** The town the shop, the board and the players' phones name. Missing: Candlefair (every campaign before presets). */
export function townOf(g: Pick<GameState, "town">): string {
  return g.town === undefined ? "Candlefair" : g.town.trim();
}

/**
 * One-time upgrades that add Candlefair content when a game is read (migrate.ts
 * and the server's seed-*.ts). A blank campaign starts with all of them done, so
 * none of that content arrives later. A test checks that a blank campaign stays empty.
 */
export const CONTENT_UPGRADES = ["jobs", "jobs-artum", "board-notes", "stinger", "monsters", "fight-beat", "discovery-seed", "story-seed", "offscript-seed", "companions"];

export const PRESET_CODE = /^[a-z0-9]{10}$/;
export const PRESET_NAME_MAX = 60;

function placeholders(now: number): Player[] {
  return [1, 2, 3, 4].map((n) => ({
    id: "p" + n,
    handle: "player" + n,
    name: "Player " + n,
    away: false,
    archived: false,
    dropIn: false,
    balanceCp: 0,
    createdAt: now,
    createdVia: "seed" as const,
  }));
}

/** A campaign with nothing in it: an empty notice board, the Table, a black screen and four open seats. */
export function blankGame(id: string, name = "A new campaign", now = Date.now()): GameState {
  return {
    schema: 2,
    id,
    name,
    createdAt: now,
    origin: { kind: "blank" },
    town: "",
    live: { sceneId: "s-board", shopOpen: false, shopId: "", purseVisible: true },
    doorClosed: false,
    maxPlayers: DEFAULT_SEATS,
    players: placeholders(now),
    scenes: [
      { id: "s-board", label: "Notice board", kind: "notice", reveal: false, art: {} },
      { id: "s-table", label: "The Table", kind: "table", reveal: false, alt: "The round table from above, one candle per player" },
      { id: "s-black", label: "Black screen", kind: "black", reveal: false },
    ],
    shops: [],
    items: [],
    sessions: [],
    episodes: [],
    currentSessionId: null,
    knocks: [],
    orders: [],
    banner: null,
    requests: [],
    ...emptyProgress(),
    jobs: [],
    notices: [],
    entries: [],
    leads: [],
    monsters: [],
    notes: [],
    story: emptyStory(),
    renown: 0,
    upgrades: [...CONTENT_UPGRADES],
    seq: 100,
  };
}

/** Today's Candlefair setup, as a new campaign would have had it before presets. */
export function candlefairGame(id: string, name?: string, now = Date.now()): GameState {
  return { ...seedGame(id, name, now), origin: { kind: "candlefair" } };
}

/**
 * The setup worth keeping from a campaign: what "Start fresh" keeps, minus the
 * people. Players become four open seats again, and everything they did (fights,
 * backstory lanes, planned game nights, plays of story beats) is dropped.
 */
export function presetSetup(g: GameState): GameState {
  const s = freshStart(g);
  const now = s.createdAt ?? 0;
  s.players = placeholders(now);
  for (const sh of s.shops) sh.playerIds = [];
  // Party and fight tokens belonged to these players and this fight; NPC and monster tokens stay.
  for (const sc of s.scenes) if (sc.map?.tokens) sc.map.tokens = sc.map.tokens.filter((t) => !t.playerId && !t.combatantId);
  delete s.fight;
  delete s.fights;
  delete s.recent;
  delete s.vttUrl;
  // The Arrival's words and intro travel with the preset; whether seats were locked doesn't.
  if (s.arrival) {
    const { seatsLocked: _locked, ...look } = s.arrival;
    s.arrival = look;
  }
  delete s.origin;
  s.doorClosed = false;
  s.notices = (s.notices ?? []).map((n) => ({ ...n }));
  if (s.story) {
    const lanes = new Set(s.story.threads.filter((t) => t.kind === "backstory").map((t) => t.id));
    s.story = {
      ...s.story,
      threads: s.story.threads.filter((t) => !lanes.has(t.id)),
      beats: s.story.beats.filter((b) => !lanes.has(b.threadId)).map((b) => ({ ...b, status: b.status === "played" ? ("planned" as const) : b.status, plays: [] })),
      dates: [],
    };
  }
  // Every content upgrade counts as done: a preset never grows Candlefair content later.
  s.upgrades = [...new Set([...(s.upgrades ?? []), ...CONTENT_UPGRADES])];
  return s;
}

/** A new campaign from a saved preset's setup. */
export function fromPreset(setup: GameState, id: string, name: string | undefined, preset: { code: string; name: string }, now = Date.now()): GameState {
  const s = structuredClone(setup);
  s.id = id;
  s.name = name || setup.name;
  s.createdAt = now;
  s.origin = { kind: "preset", code: preset.code, name: preset.name };
  for (const p of s.players) p.createdAt = now;
  s.upgrades = [...new Set([...(s.upgrades ?? []), ...CONTENT_UPGRADES])];
  return s;
}

/** What's in a preset, for the create screen. */
export function presetCounts(s: GameState) {
  return {
    scenes: s.scenes.filter((x) => x.kind !== "black" && x.kind !== "table").length,
    shops: s.shops.length,
    items: s.items.length,
    entries: (s.entries ?? []).length,
    episodes: (s.episodes ?? []).length,
    monsters: (s.monsters ?? []).length,
    jobs: (s.jobs ?? []).length,
    notices: (s.notices ?? []).length,
    beats: s.story?.beats.length ?? 0,
  };
}
export type PresetCounts = ReturnType<typeof presetCounts>;

/** "12 scenes, 40 items, 18 people and places, 1 episode" (only what's there). */
export function describeCounts(c: PresetCounts): string {
  const parts: [number, string, string][] = [
    [c.scenes, "scene", "scenes"],
    [c.shops, "shop", "shops"],
    [c.items, "item", "items"],
    [c.entries, "Discovery entry", "Discovery entries"],
    [c.episodes, "episode", "episodes"],
    [c.monsters, "monster", "monsters"],
    [c.jobs + c.notices, "board note", "board notes"],
    [c.beats, "story beat", "story beats"],
  ];
  const out = parts.filter(([n]) => n > 0).map(([n, one, many]) => `${n} ${n === 1 ? one : many}`);
  return out.length ? out.join(", ") : "Nothing set up yet";
}
