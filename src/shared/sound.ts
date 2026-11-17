// Sound for the table: what the DM's soundboard can play on the TV.
//
// Every sound is made in the TV's browser with Web Audio (src/client/sound/),
// so there are no audio files to download, host or license. This file is just
// the catalog: ids and names for the looping layers (music and ambience), the
// one-shots, the ready-made mixes, and which mix each ambient scene brings
// with it. Nothing here is a secret.

export const LAYERS = [
  // Music
  { id: "tavern-jig", label: "Tavern jig", group: "music" },
  { id: "quiet-lute", label: "Quiet lute", group: "music" },
  { id: "travel", label: "On the road", group: "music" },
  { id: "battle", label: "Battle drums", group: "music" },
  { id: "tension", label: "Tension", group: "music" },
  { id: "wonder", label: "Wonder", group: "music" },
  { id: "sorrow", label: "Sorrow", group: "music" },
  { id: "festival", label: "Winter festival", group: "music" },
  { id: "courtly", label: "Feast music", group: "music" },
  { id: "shanty", label: "Sea shanty", group: "music" },
  // Ambience
  { id: "crowd", label: "Tavern crowd", group: "ambience" },
  { id: "fire", label: "Hearth fire", group: "ambience" },
  { id: "rain", label: "Rain", group: "ambience" },
  { id: "wind", label: "Wind", group: "ambience" },
  { id: "storm", label: "Thunderstorm", group: "ambience" },
  { id: "forest", label: "Forest birds", group: "ambience" },
  { id: "night", label: "Night crickets", group: "ambience" },
  { id: "sea", label: "Ocean waves", group: "ambience" },
  { id: "river", label: "River", group: "ambience" },
  { id: "market", label: "Market bustle", group: "ambience" },
  { id: "cave", label: "Cave drips", group: "ambience" },
  { id: "crypt", label: "Crypt", group: "ambience" },
  { id: "clock", label: "Ticking clock", group: "ambience" },
  // Places: a whole room or street in one layer
  { id: "harbor", label: "Harbor & docks", group: "places" },
  { id: "rigging", label: "Ropes & rigging", group: "places" },
  { id: "ship", label: "Creaking ship", group: "places" },
  { id: "kitchen", label: "Busy kitchen", group: "places" },
  { id: "banquet", label: "Feast hall", group: "places" },
  { id: "forge", label: "Smithy", group: "places" },
  { id: "temple", label: "Temple", group: "places" },
  { id: "city", label: "City streets", group: "places" },
  { id: "winter", label: "Snowy streets", group: "places" },
  { id: "dark-woods", label: "Dark woods", group: "places" },
  { id: "marsh", label: "Marsh & lake", group: "places" },
] as const;

export type LayerId = (typeof LAYERS)[number]["id"];
export const LAYER_IDS = LAYERS.map((l) => l.id) as [LayerId, ...LayerId[]];
export const isLayerId = (x: string): x is LayerId => (LAYER_IDS as string[]).includes(x);
export const layerById = (id: string) => LAYERS.find((l) => l.id === id);
export const isMusic = (id: string) => layerById(id)?.group === "music";

export const SFX = [
  // Combat
  { id: "sword-clash", label: "Swords clash", group: "combat" },
  { id: "sword-hit", label: "Sword hit", group: "combat" },
  { id: "swing", label: "Swing", group: "combat" },
  { id: "arrow", label: "Arrow", group: "combat" },
  { id: "punch", label: "Punch", group: "combat" },
  { id: "shield", label: "Shield block", group: "combat" },
  { id: "roar", label: "Monster roar", group: "combat" },
  { id: "growl", label: "Growl", group: "combat" },
  { id: "death", label: "Death", group: "combat" },
  { id: "explosion", label: "Explosion", group: "combat" },
  // Magic
  { id: "fireball", label: "Fireball", group: "magic" },
  { id: "lightning", label: "Lightning", group: "magic" },
  { id: "heal", label: "Healing", group: "magic" },
  { id: "arcane", label: "Arcane sparkle", group: "magic" },
  { id: "dark-magic", label: "Dark magic", group: "magic" },
  { id: "teleport", label: "Teleport", group: "magic" },
  // At the table
  { id: "dice", label: "Dice roll", group: "table" },
  { id: "coins", label: "Coins", group: "table" },
  { id: "crit", label: "Critical hit", group: "table" },
  { id: "fumble", label: "Fumble", group: "table" },
  { id: "fanfare", label: "Fanfare", group: "table" },
  { id: "level-up", label: "Level up", group: "table" },
  { id: "victory", label: "Victory", group: "table" },
  { id: "defeat", label: "Defeat", group: "table" },
  { id: "cheer", label: "Crowd cheer", group: "table" },
  { id: "gasp", label: "Crowd gasp", group: "table" },
  { id: "chime", label: "Reveal chime", group: "table" },
  // The world
  { id: "door", label: "Creaky door", group: "world" },
  { id: "knock", label: "Knock", group: "world" },
  { id: "bell", label: "Town bell", group: "world" },
  { id: "gong", label: "Gong", group: "world" },
  { id: "thunder", label: "Thunder", group: "world" },
  { id: "horn", label: "War horn", group: "world" },
  { id: "howl", label: "Wolf howl", group: "world" },
  { id: "owl", label: "Owl", group: "world" },
  { id: "heartbeat", label: "Heartbeat", group: "world" },
  { id: "page", label: "Page turn", group: "world" },
  { id: "whoosh", label: "Whoosh", group: "world" },
  { id: "footsteps", label: "Footsteps", group: "world" },
  { id: "branch-snap", label: "Branch snaps", group: "world" },
  { id: "raven", label: "Raven", group: "world" },
  // Ship & shore
  { id: "ship-bell", label: "Ship's bell", group: "shore" },
  { id: "foghorn", label: "Foghorn", group: "shore" },
  { id: "splash", label: "Splash", group: "shore" },
  { id: "anchor", label: "Drop anchor", group: "shore" },
  { id: "creak", label: "Timber creak", group: "shore" },
  // Town & trade
  { id: "shop-bell", label: "Shop door bell", group: "town" },
  { id: "anvil", label: "Anvil", group: "town" },
  { id: "quench", label: "Quench hiss", group: "town" },
  { id: "pots", label: "Pots & pans crash", group: "town" },
  { id: "smash", label: "Glass smash", group: "town" },
  { id: "toast", label: "Raise a toast", group: "town" },
  { id: "crate", label: "Crate drop", group: "town" },
  { id: "sleigh-bells", label: "Sleigh bells", group: "town" },
] as const;

export type SfxId = (typeof SFX)[number]["id"];
export const SFX_IDS = SFX.map((x) => x.id) as [SfxId, ...SfxId[]];
export const isSfxId = (x: string): x is SfxId => (SFX_IDS as string[]).includes(x);
export const sfxById = (id: string) => SFX.find((x) => x.id === id);

export const SFX_GROUPS = [
  { id: "combat", label: "Combat" },
  { id: "magic", label: "Magic" },
  { id: "table", label: "At the table" },
  { id: "world", label: "The world" },
  { id: "shore", label: "Ship & shore" },
  { id: "town", label: "Town & trade" },
] as const;

/** Layer id -> volume 0..1. A layer that isn't listed is off. */
export type LayerMix = Partial<Record<LayerId, number>>;

export const MIX_GROUPS = [
  { id: "inside", label: "Taverns & feasts" },
  { id: "town", label: "Town & city" },
  { id: "sea", label: "Sea & shore" },
  { id: "wild", label: "The wilds" },
  { id: "dark", label: "Dark places" },
  { id: "fight", label: "Fights" },
  { id: "mood", label: "Moods" },
] as const;

export const MIXES: { id: string; label: string; group: (typeof MIX_GROUPS)[number]["id"]; layers: LayerMix }[] = [
  // Taverns & feasts
  { id: "tavern", label: "Busy tavern", group: "inside", layers: { "tavern-jig": 0.55, crowd: 0.7, fire: 0.3 } },
  { id: "quiet-inn", label: "Quiet inn", group: "inside", layers: { "quiet-lute": 0.5, fire: 0.5, crowd: 0.2 } },
  { id: "sailors-tavern", label: "Sailors' tavern", group: "inside", layers: { shanty: 0.55, crowd: 0.65, fire: 0.25 } },
  { id: "feast", label: "Feast hall", group: "inside", layers: { courtly: 0.45, banquet: 0.7, fire: 0.25 } },
  { id: "kitchen", label: "Busy kitchen", group: "inside", layers: { kitchen: 0.75, fire: 0.35 } },
  { id: "study", label: "Wizard's study", group: "inside", layers: { clock: 0.45, fire: 0.4, wonder: 0.25 } },
  // Town & city
  { id: "market", label: "Market day", group: "town", layers: { market: 0.75 } },
  { id: "winterfest", label: "Winterfest", group: "town", layers: { festival: 0.5, city: 0.45, winter: 0.25 } },
  { id: "snowy-town", label: "Snowy town", group: "town", layers: { winter: 0.7, "quiet-lute": 0.2 } },
  { id: "city", label: "City streets", group: "town", layers: { city: 0.75 } },
  { id: "smithy", label: "Smithy", group: "town", layers: { forge: 0.75, fire: 0.35 } },
  { id: "shop", label: "Quiet shop", group: "town", layers: { clock: 0.35, fire: 0.45, "quiet-lute": 0.35 } },
  { id: "temple", label: "Temple", group: "town", layers: { temple: 0.75 } },
  // Sea & shore
  { id: "docks", label: "The docks", group: "sea", layers: { harbor: 0.75, rigging: 0.3, wind: 0.2 } },
  { id: "aboard", label: "Aboard ship", group: "sea", layers: { ship: 0.7, sea: 0.5, rigging: 0.45, wind: 0.3 } },
  { id: "below-decks", label: "Below decks", group: "sea", layers: { ship: 0.8, sea: 0.2, tension: 0.15 } },
  { id: "ship-storm", label: "Ship in a storm", group: "sea", layers: { ship: 0.8, storm: 0.42, rigging: 0.5, tension: 0.3 } },
  { id: "sea", label: "At sea", group: "sea", layers: { sea: 0.8, wind: 0.35 } },
  { id: "lighthouse", label: "Lighthouse", group: "sea", layers: { sea: 0.6, wind: 0.45, fire: 0.15 } },
  { id: "marsh", label: "Marsh & lake", group: "sea", layers: { marsh: 0.75, night: 0.15 } },
  // The wilds
  { id: "road", label: "The open road", group: "wild", layers: { travel: 0.5, wind: 0.25, forest: 0.3 } },
  { id: "forest", label: "Forest", group: "wild", layers: { forest: 0.7, wind: 0.2 } },
  { id: "dark-woods", label: "Dark woods", group: "wild", layers: { "dark-woods": 0.75, tension: 0.2 } },
  { id: "camp", label: "Night camp", group: "wild", layers: { fire: 0.6, night: 0.6 } },
  { id: "rain", label: "Rainy road", group: "wild", layers: { rain: 0.7, wind: 0.3 } },
  { id: "storm", label: "Storm", group: "wild", layers: { storm: 0.8, wind: 0.4 } },
  { id: "blizzard", label: "Blizzard", group: "wild", layers: { winter: 0.8, wind: 0.45 } },
  // Dark places
  { id: "dungeon", label: "Dungeon", group: "dark", layers: { cave: 0.7, tension: 0.35 } },
  { id: "crypt", label: "Crypt", group: "dark", layers: { crypt: 0.75, tension: 0.4 } },
  { id: "hideout", label: "Bandit hideout", group: "dark", layers: { fire: 0.45, wind: 0.3, crowd: 0.2, tension: 0.3 } },
  // Fights
  { id: "battle", label: "Battle", group: "fight", layers: { battle: 0.8 } },
  { id: "storm-battle", label: "Battle in a storm", group: "fight", layers: { battle: 0.7, storm: 0.55 } },
  { id: "sea-battle", label: "Battle at sea", group: "fight", layers: { battle: 0.7, ship: 0.6, sea: 0.5 } },
  { id: "kitchen-brawl", label: "Brawl in the kitchen", group: "fight", layers: { battle: 0.6, kitchen: 0.55, fire: 0.3 } },
  // Moods
  { id: "mystery", label: "Mystery", group: "mood", layers: { wonder: 0.55, clock: 0.25 } },
  { id: "sorrow", label: "Sorrow", group: "mood", layers: { sorrow: 0.6, rain: 0.25 } },
];

export const mixById = (id: string) => MIXES.find((m) => m.id === id);

/** What each built-in ambient scene sounds like when the soundboard is quiet (see ambient.ts). */
export const AMBIENT_SOUND: Record<string, LayerMix> = {
  "forest-road": { forest: 0.65, wind: 0.2 },
  "rainy-night": { rain: 0.7, wind: 0.25 },
  "snowy-street": { winter: 0.6, "quiet-lute": 0.2 },
  "tavern-crowd": { "tavern-jig": 0.5, crowd: 0.7, fire: 0.3 },
  campfire: { fire: 0.65, night: 0.5 },
  coastline: { sea: 0.75, wind: 0.3 },
  "river-dusk": { river: 0.65, night: 0.3 },
  "cave-mouth": { cave: 0.5, wind: 0.3 },
  "dungeon-corridor": { cave: 0.6, tension: 0.3 },
  "market-day": { market: 0.7 },
  "ship-deck": { ship: 0.55, sea: 0.6, rigging: 0.35, wind: 0.3 },
  fireside: { fire: 0.7, night: 0.2, wonder: 0.15 },
  "flickering-candle": { wonder: 0.3, wind: 0.12 },
  "wizard-study": { clock: 0.45, fire: 0.4, wonder: 0.25 },
  storybook: { wonder: 0.45, fire: 0.3 },
  embers: { fire: 0.35, night: 0.3 },
};

/** The default volume a layer starts at when the DM switches it on by itself. */
export const LAYER_DEFAULT = 0.6;
export const FADES = [1, 3, 8] as const;
export const FADE_DEFAULT = 3;
export const VOLUME_DEFAULT = 0.8;

/** "Busy tavern", "busy-tavern", "tavern" -> the mix; "off"/"silence"/"stop" -> "off". Run sheets use this. */
export function findMix(name: string): string | null {
  let k = name.trim().toLowerCase().replace(/['’]/g, "").replace(/\s+/g, "-");
  // "layer/rain" or "layer rain": just that one layer (a mix can share its name).
  const only = /^layer[/-]/.test(k);
  if (only) k = k.slice(6);
  if (["off", "silence", "stop", "none", "quiet"].includes(k)) return "off";
  const m = only ? undefined : MIXES.find((x) => x.id === k || x.label.toLowerCase().replace(/['’]/g, "").replace(/\s+/g, "-") === k);
  if (m) return m.id;
  // A single layer works too ("sound: rain").
  const l = LAYERS.find((x) => x.id === k || x.label.toLowerCase().replace(/\s+/g, "-") === k);
  return l ? `layer/${l.id}` : null;
}

/** The layers a run sheet's "sound:" line plays. */
export function mixLayers(mix: string): LayerMix {
  if (mix === "off") return {};
  if (mix.startsWith("layer/")) {
    const id = mix.slice(6);
    return isLayerId(id) ? { [id]: LAYER_DEFAULT } : {};
  }
  return { ...(mixById(mix)?.layers ?? {}) };
}

export function mixLabel(mix: string): string {
  if (mix === "off") return "silence";
  if (mix.startsWith("layer/")) return layerById(mix.slice(6))?.label ?? mix;
  return mixById(mix)?.label ?? mix;
}

/** "sword hit", "Sword-hit" -> "sword-hit"; "ship's bell", "ships bell" -> "ship-bell". */
export function findSfx(name: string): SfxId | null {
  const k = name.trim().toLowerCase().replace(/['’]/g, "").replace(/\s+/g, "-");
  const x = SFX.find((s) => s.id === k || s.label.toLowerCase().replace(/['’]/g, "").replace(/\s+/g, "-") === k);
  return x ? x.id : null;
}
