import { z } from "zod";
import type { GameState, Player } from "./types";

/**
 * Feature switches. Three levels, each narrower than the last:
 *   1. the campaign (the DM turns a feature off for the whole table),
 *   2. one player (the DM turns a per-player feature off for one person),
 *   3. the player's own choice (they hide a tab they don't use).
 * Off is a hide, never a delete: turning a feature back on brings everything back.
 * A game with no switches set has every feature on, as it always did.
 */
export const FEATURE_IDS = [
  "dice",
  "combat",
  "sheets",
  "chronicle",
  "gold",
  "shops",
  "maps",
  "discover",
  "leads",
  "arrival",
  "sound",
  "deviceSound",
  "levels",
  "renown",
  "jobs",
  "board",
  "companions",
  "invites",
  "storyboard",
  "tables",
  "offscript",
  "builder",
  "practice",
  "hosting",
] as const;
export type FeatureId = (typeof FEATURE_IDS)[number];

export type FeatureGroup = "table" | "world" | "story" | "dm";
export type PresetId = "minimal" | "standard" | "everything";
export type Shows = "dm" | "tv" | "phone";

export interface FeatureDef {
  id: FeatureId;
  name: string;
  /** One plain sentence for the Features page. */
  blurb: string;
  group: FeatureGroup;
  shows: Shows[];
  /** The DM can turn it off for one player. */
  perPlayer?: boolean;
  /** A player can hide it on their own phone. */
  playerHide?: boolean;
  /** Only works while this one is on. */
  needs?: FeatureId;
  /** The smallest preset that has it on. DM-only tools are on in every preset. */
  from: PresetId;
}

export const FEATURES: FeatureDef[] = [
  // At the table
  { id: "dice", name: "Phone dice", blurb: "Players roll from their phones, on the TV or just for you.", group: "table", shows: ["phone", "tv"], perPlayer: true, from: "minimal" },
  { id: "combat", name: "Combat", blurb: "Fights with initiative, turns, HP and death saves on the TV and phones.", group: "table", shows: ["dm", "tv", "phone"], from: "minimal" },
  { id: "sheets", name: "Character sheets", blurb: "Each player keeps their sheet in the app. Players can keep D&D Beyond instead.", group: "table", shows: ["dm", "phone"], perPlayer: true, playerHide: true, from: "minimal" },
  { id: "gold", name: "Gold and the bank", blurb: "Each player's purse, the party purse and the bank ledger.", group: "table", shows: ["dm", "phone"], from: "standard" },
  { id: "shops", name: "Shops and requests", blurb: "Shops on phones; players ask to buy and you approve.", group: "table", shows: ["dm", "tv", "phone"], perPlayer: true, needs: "gold", from: "standard" },
  { id: "levels", name: "Level ups", blurb: "A moment on the TV and each phone when the party levels up.", group: "table", shows: ["tv", "phone"], from: "standard" },
  { id: "sound", name: "Sound", blurb: "Music, ambience and effects from the TV, and the soundboard.", group: "table", shows: ["dm", "tv"], from: "standard" },
  { id: "deviceSound", name: "Sounds on players' devices", blurb: "Small, quiet sounds on each player's own device for their own things: a heal, a hit, gold, their turn. Each player turns it on for themselves.", group: "table", shows: ["phone"], needs: "sound", from: "standard" },
  { id: "companions", name: "Companions and hirelings", blurb: "NPCs who travel and fight with the party.", group: "table", shows: ["dm", "tv", "phone"], from: "everything" },
  // World
  { id: "maps", name: "Map on phones", blurb: "The Map tab: the map on the TV on each phone, with their own token.", group: "world", shows: ["phone"], playerHide: true, from: "standard" },
  { id: "discover", name: "Discover", blurb: "The people, places, shops and monsters the party has found.", group: "world", shows: ["dm", "tv", "phone"], playerHide: true, from: "standard" },
  { id: "leads", name: "Leads and votes", blurb: "Threads to follow, and the party's vote on what's next.", group: "world", shows: ["dm", "tv", "phone"], needs: "discover", from: "standard" },
  { id: "renown", name: "Renown", blurb: "The party's standing in town: rank, points and the plaque.", group: "world", shows: ["dm", "tv", "phone"], playerHide: true, from: "everything" },
  { id: "jobs", name: "Jobs and bounties", blurb: "Job flyers on the board that players can take.", group: "world", shows: ["dm", "tv", "phone"], playerHide: true, from: "everything" },
  { id: "board", name: "Notice board notes", blurb: "Your own free notes pinned on the TV notice board.", group: "world", shows: ["dm", "tv"], from: "everything" },
  // Story
  { id: "chronicle", name: "Chronicle", blurb: "The shared story notes: the phone's Story tab.", group: "story", shows: ["dm", "phone"], playerHide: true, from: "minimal" },
  { id: "arrival", name: "Arrival intro", blurb: "The intro link players open before the first session, and seat claiming.", group: "story", shows: ["dm", "tv", "phone"], from: "standard" },
  { id: "invites", name: "Session invites", blurb: "One link for a session; the first players to claim it get a seat.", group: "story", shows: ["dm"], from: "everything" },
  // DM-only tools: they only tidy your sidebar.
  { id: "storyboard", name: "Storyboard", blurb: "Threads, beats and planned dates.", group: "dm", shows: ["dm"], from: "minimal" },
  { id: "tables", name: "Random tables", blurb: "Rumors, encounters, names and weather.", group: "dm", shows: ["dm"], from: "minimal" },
  { id: "offscript", name: "Off-script kit", blurb: "Generators, clues and quick notes for when the party wanders.", group: "dm", shows: ["dm"], from: "minimal" },
  { id: "builder", name: "Worldbuilder", blurb: "Drafts from Claude waiting for your review.", group: "dm", shows: ["dm"], from: "minimal" },
  { id: "practice", name: "Practice mode", blurb: "Rehearse an episode in a copy of the game.", group: "dm", shows: ["dm"], from: "minimal" },
  { id: "hosting", name: "Hosting costs", blurb: "What this campaign would cost on a paid plan.", group: "dm", shows: ["dm"], from: "minimal" },
];

export const FEATURE: Record<FeatureId, FeatureDef> = Object.fromEntries(FEATURES.map((f) => [f.id, f])) as Record<FeatureId, FeatureDef>;
export const GROUP_LABEL: Record<FeatureGroup, string> = { table: "At the table", world: "World", story: "Story", dm: "Your tools" };
export const PRESETS: { id: PresetId; name: string; blurb: string }[] = [
  { id: "minimal", name: "Minimal", blurb: "Just play: dice, combat, sheets and the story." },
  { id: "standard", name: "Standard", blurb: "A normal campaign: adds gold, shops, maps and Discover." },
  { id: "everything", name: "Everything", blurb: "Every feature on." },
];
const RANK: Record<PresetId, number> = { minimal: 0, standard: 1, everything: 2 };

export function isFeatureId(x: string): x is FeatureId {
  return (FEATURE_IDS as readonly string[]).includes(x);
}

/** What a preset turns off. DM-only tools stay as they are (pass the current list to keep them). */
export function presetOff(preset: PresetId, current: readonly FeatureId[] = []): FeatureId[] {
  const keep = current.filter((id) => FEATURE[id].group === "dm");
  const off = FEATURES.filter((f) => f.group !== "dm" && RANK[f.from] > RANK[preset]).map((f) => f.id);
  return [...off, ...keep];
}

/** Which preset the switches match, or "custom". DM-only tools don't count. */
export function presetOf(off: readonly FeatureId[]): PresetId | "custom" {
  const mine = new Set(off.filter((id) => FEATURE[id].group !== "dm"));
  for (const p of PRESETS) {
    const want = presetOff(p.id);
    if (want.length === mine.size && want.every((id) => mine.has(id))) return p.id;
  }
  return "custom";
}

/** The switches the DM set (missing: every feature on). */
export function featuresOffOf(g: Pick<GameState, "featuresOff">): FeatureId[] {
  return (g.featuresOff ?? []).filter(isFeatureId);
}

/** On for the whole table (and the feature it needs is on too). */
export function featureOn(g: Pick<GameState, "featuresOff">, id: FeatureId): boolean {
  const off = g.featuresOff;
  if (!off?.length) return true;
  for (let f: FeatureId | undefined = id; f; f = FEATURE[f].needs) if (off.includes(f)) return false;
  return true;
}

/** Every feature that is off for the table, the ones switched off with a feature they need included. */
export function effectiveOff(g: Pick<GameState, "featuresOff">): FeatureId[] {
  if (!g.featuresOff?.length) return [];
  return FEATURE_IDS.filter((id) => !featureOn(g, id));
}

/** The DM turned this per-player feature off for one player. Sheets keep their own older flag. */
export function playerOff(p: Pick<Player, "featuresOff" | "sheetOff">, id: FeatureId): boolean {
  if (id === "sheets") return !!p.sheetOff;
  return !!p.featuresOff?.includes(id);
}

/** On for this player: on for the table and not turned off for them by the DM. Their own hidden tabs don't count (they only tidy the phone). */
export function featureOnFor(g: Pick<GameState, "featuresOff">, p: Pick<Player, "featuresOff" | "sheetOff">, id: FeatureId): boolean {
  return featureOn(g, id) && !playerOff(p, id);
}

/** Tabs a player has hidden on their own phone. */
export function hiddenOf(p: Pick<Player, "tabsHidden">): FeatureId[] {
  return (p.tabsHidden ?? []).filter((id): id is FeatureId => isFeatureId(id) && !!FEATURE[id].playerHide);
}

const featureId = z.enum(FEATURE_IDS);

export const featureDmCommands = [
  /** The campaign's switches: every feature in off is off for the whole table. */
  z.object({ type: z.literal("features.set"), off: z.array(featureId).max(FEATURE_IDS.length) }),
  /** One per-player feature on or off for one player. */
  z.object({ type: z.literal("features.player"), playerId: z.string().min(1).max(64), feature: featureId, on: z.boolean() }),
] as const;

export const featurePlayerCommands = [
  /** The tabs I hide on my own phone. */
  z.object({ type: z.literal("me.tabs"), hidden: z.array(featureId).max(FEATURE_IDS.length) }),
] as const;

export type FeatureDmCommand = z.infer<(typeof featureDmCommands)[number]>;
export type FeaturePlayerCommand = z.infer<(typeof featurePlayerCommands)[number]>;
export type FeatureCommand = FeatureDmCommand | FeaturePlayerCommand;

export function isFeatureCommand(cmd: { type: string }): cmd is FeatureCommand {
  return cmd.type.startsWith("features.") || cmd.type === "me.tabs";
}

export function applyFeatures(s: GameState, cmd: FeatureCommand, h: { actor: { role: string; playerId?: string }; fail: (m: string) => never }) {
  switch (cmd.type) {
    case "features.set": {
      if (cmd.off.includes("combat") && s.fight && s.fight.status !== "over") h.fail("End the fight first, then turn Combat off.");
      const off = FEATURE_IDS.filter((id) => cmd.off.includes(id));
      if (off.length) s.featuresOff = off;
      else delete s.featuresOff;
      return;
    }
    case "features.player": {
      const def = FEATURE[cmd.feature];
      if (!def.perPlayer) h.fail(`${def.name} can't be set one player at a time.`);
      const p = s.players.find((x) => x.id === cmd.playerId) ?? h.fail("That player isn't here.");
      if (cmd.feature === "sheets") {
        if (cmd.on) delete p.sheetOff;
        else p.sheetOff = true;
        return;
      }
      const set = new Set(p.featuresOff ?? []);
      if (cmd.on) set.delete(cmd.feature);
      else set.add(cmd.feature);
      if (set.size) p.featuresOff = FEATURE_IDS.filter((id) => set.has(id));
      else delete p.featuresOff;
      return;
    }
    case "me.tabs": {
      const p = s.players.find((x) => x.id === (h.actor.role === "player" ? h.actor.playerId : "")) ?? h.fail("That player isn't here.");
      const hidden = FEATURE_IDS.filter((id) => cmd.hidden.includes(id) && FEATURE[id].playerHide);
      if (hidden.length) p.tabsHidden = hidden;
      else delete p.tabsHidden;
      return;
    }
  }
}

/** Phone commands that need a feature. A switched-off feature refuses them, so an old screen can't sneak one in. */
const PLAYER_NEEDS: Record<string, FeatureId> = {
  "me.diceRoll": "dice",
  "me.requestBuy": "shops",
  "me.contribute": "shops",
  "me.requestGive": "gold",
  "me.takeJob": "jobs",
  "me.vote": "leads",
  "me.noteAdd": "chronicle",
  "me.noteUpdate": "chronicle",
  "me.noteRemove": "chronicle",
  "me.tokenMove": "maps",
  "me.sheet": "sheets",
  "me.sheetRoll": "sheets",
  "me.sheetAct": "sheets",
  "me.hitDie": "sheets",
  "me.companionHp": "companions",
  "me.companionAbility": "companions",
  "me.companionInit": "companions",
  "me.companionDeathSave": "companions",
  "me.companionEndTurn": "companions",
};
/** DM commands that start something a switched-off feature would show to the table. */
const DM_NEEDS: Record<string, FeatureId> = {
  "fight.start": "combat",
  "vote.open": "leads",
};

/** Throws (through fail) when a command needs a feature that is off for this actor. */
export function checkFeature(s: GameState, cmd: { type: string }, actor: { role: string; playerId?: string }, fail: (m: string) => never) {
  if (actor.role === "player") {
    const need = PLAYER_NEEDS[cmd.type];
    if (!need) return;
    if (!featureOn(s, need)) fail(`${FEATURE[need].name} is turned off in this campaign.`);
    const p = s.players.find((x) => x.id === actor.playerId);
    if (p && playerOff(p, need)) fail(`${FEATURE[need].name} is turned off for you. Ask the DM if you'd like it.`);
    return;
  }
  if (actor.role === "dm") {
    const need = DM_NEEDS[cmd.type];
    if (need && !featureOn(s, need)) fail(`${FEATURE[need].name} is turned off. Turn it on in Features first.`);
  }
}
