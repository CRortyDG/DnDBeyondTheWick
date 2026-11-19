// A character's pixel-art look: which part goes in each layer and which colour
// each slot uses. Stored as a tiny recipe (numbers), never as an image, so it
// costs nothing to keep and draws crisp at any size (see lookArt.ts).

export interface LookLayer {
  key: LookPartKey;
  label: string;
  options: readonly string[];
  /** The colour slot the layer's swatches change, if any. */
  color?: LookColorKey;
  /** Which editor tab it sits on. */
  group: LookGroup;
}

export type LookGroup = "body" | "face" | "hair" | "outfit" | "gear" | "extras" | "scene";

export const LOOK_GROUPS: { id: LookGroup; label: string }[] = [
  { id: "body", label: "Body" },
  { id: "face", label: "Face" },
  { id: "hair", label: "Hair" },
  { id: "outfit", label: "Outfit" },
  { id: "gear", label: "Gear" },
  { id: "extras", label: "Species" },
  { id: "scene", label: "Scene" },
];

export const LOOK_PARTS = [
  "body",
  "ears",
  "eyes",
  "mouth",
  "mark",
  "hair",
  "beard",
  "outfit",
  "cloak",
  "hat",
  "hand",
  "offhand",
  "horns",
  "tail",
  "wings",
  "pet",
  "platform",
  "background",
] as const;
export type LookPartKey = (typeof LOOK_PARTS)[number];

export const LOOK_COLORS = ["skin", "eye", "hairColor", "main", "trim", "cloakColor", "hatColor", "metal", "petColor", "sky"] as const;
export type LookColorKey = (typeof LOOK_COLORS)[number];

export type Look = Partial<Record<LookPartKey | LookColorKey, number>>;

export interface Swatch {
  name: string;
  hex: string;
}

const sw = (list: [string, string][]): Swatch[] => list.map(([name, hex]) => ({ name, hex }));

export const SKIN: Swatch[] = sw([
  ["Porcelain", "#f6dccb"],
  ["Fair", "#efc7a6"],
  ["Peach", "#e5b089"],
  ["Tan", "#cf9a6c"],
  ["Olive", "#b8895a"],
  ["Bronze", "#a06b43"],
  ["Brown", "#7f5134"],
  ["Deep brown", "#5c3824"],
  ["Ebony", "#3f271b"],
  ["Orc green", "#7fa25a"],
  ["Moss", "#5f7f45"],
  ["Ash grey", "#9a9a9e"],
  ["Slate", "#5d6178"],
  ["Tiefling red", "#c0503f"],
  ["Crimson", "#8e2f36"],
  ["Lilac", "#a68ac4"],
  ["Sea blue", "#5f9ac2"],
  ["Frost", "#bfe0ec"],
  ["Gold", "#e2bf62"],
  ["Bone", "#e8e2cf"],
]);

export const HAIR: Swatch[] = sw([
  ["Black", "#2a2230"],
  ["Dark brown", "#4a3022"],
  ["Brown", "#7a4e2c"],
  ["Chestnut", "#94512b"],
  ["Ginger", "#c8682e"],
  ["Copper", "#a8452c"],
  ["Blonde", "#e2c069"],
  ["Platinum", "#efe6c4"],
  ["White", "#f2f1ee"],
  ["Grey", "#9d9aa2"],
  ["Blue", "#4a78c8"],
  ["Teal", "#3aa39a"],
  ["Green", "#5d9a45"],
  ["Pink", "#e283b3"],
  ["Purple", "#8a58c4"],
  ["Red", "#c8343b"],
]);

export const EYES: Swatch[] = sw([
  ["Brown", "#6b3f22"],
  ["Hazel", "#8a7a3a"],
  ["Green", "#3f8f4a"],
  ["Blue", "#3f78c8"],
  ["Grey", "#7c8794"],
  ["Amber", "#d99a2b"],
  ["Violet", "#8f55c9"],
  ["Red", "#c8343b"],
  ["Gold", "#f0cd4a"],
  ["Ice", "#9fe2f2"],
  ["Black", "#241c28"],
]);

/** Cloth and leather. */
export const CLOTH: Swatch[] = sw([
  ["Crimson", "#b8343b"],
  ["Rust", "#b5582f"],
  ["Orange", "#e0863a"],
  ["Mustard", "#d4a83a"],
  ["Forest", "#3f6d3a"],
  ["Leaf", "#6aa244"],
  ["Teal", "#2f8a86"],
  ["Sky", "#5f9fd8"],
  ["Royal", "#3a56b0"],
  ["Navy", "#2b335e"],
  ["Purple", "#6c3fa0"],
  ["Plum", "#7a2f5f"],
  ["Pink", "#d6739f"],
  ["Leather", "#7a4b2b"],
  ["Tan", "#b58a5c"],
  ["Charcoal", "#3a3640"],
  ["Grey", "#85848c"],
  ["White", "#e9e4d8"],
  ["Black", "#25212b"],
]);

export const METAL: Swatch[] = sw([
  ["Steel", "#a6aebb"],
  ["Iron", "#6b7080"],
  ["Gold", "#e0b23f"],
  ["Bronze", "#b5793a"],
  ["Silver", "#d9dde4"],
  ["Black iron", "#3f3f4c"],
  ["Mithral", "#8fd0e0"],
  ["Wood", "#8a5a33"],
]);

export const PET: Swatch[] = sw([
  ["Ginger", "#d0823f"],
  ["Black", "#3a3440"],
  ["White", "#ece8e0"],
  ["Grey", "#8f8d96"],
  ["Brown", "#7a5233"],
  ["Cream", "#e6cf9e"],
  ["Green", "#5fa24a"],
  ["Blue", "#4f86d0"],
  ["Red", "#c8433b"],
  ["Purple", "#8a5fc4"],
  ["Gold", "#e0b23f"],
  ["Pink", "#e28fb3"],
]);

/** For the Plain background. */
export const SKY: Swatch[] = sw([
  ["Dusk", "#4a3f6b"],
  ["Midnight", "#232846"],
  ["Sky", "#7fb2dc"],
  ["Meadow", "#7fae6a"],
  ["Rose", "#d68a9a"],
  ["Sand", "#e0c48f"],
  ["Ember", "#b8573a"],
  ["Slate", "#5a6270"],
  ["Mint", "#8fd0b8"],
  ["Parchment", "#eadcb8"],
]);

export const SWATCHES: Record<LookColorKey, Swatch[]> = {
  skin: SKIN,
  eye: EYES,
  hairColor: HAIR,
  main: CLOTH,
  trim: CLOTH,
  cloakColor: CLOTH,
  hatColor: CLOTH,
  metal: METAL,
  petColor: PET,
  sky: SKY,
};

export const COLOR_LABELS: Record<LookColorKey, string> = {
  skin: "Skin",
  eye: "Eyes",
  hairColor: "Hair colour",
  main: "Main colour",
  trim: "Second colour",
  cloakColor: "Cloak colour",
  hatColor: "Hat colour",
  metal: "Metal",
  petColor: "Pet colour",
  sky: "Backdrop colour",
};

export const LAYERS: LookLayer[] = [
  { key: "body", label: "Build", group: "body", color: "skin", options: ["Average", "Broad", "Tall", "Small", "Stout"] },
  { key: "ears", label: "Ears", group: "body", options: ["Round", "Pointed", "Long elf", "Fins", "Cat ears", "Rabbit ears", "Floppy"] },
  { key: "eyes", label: "Eyes", group: "face", color: "eye", options: ["Calm", "Happy", "Wide", "Sleepy", "Fierce", "Glowing", "Closed", "Eyepatch"] },
  { key: "mouth", label: "Mouth", group: "face", options: ["Smile", "Neutral", "Frown", "Grin", "Open", "Smirk", "Fangs"] },
  { key: "mark", label: "Marks", group: "face", options: ["None", "Freckles", "Blush", "Scar", "War paint", "Scales", "Whiskers", "Tusks", "Tattoo"] },
  { key: "hair", label: "Hair", group: "hair", color: "hairColor", options: ["Bald", "Short", "Spiky", "Swept", "Long", "Ponytail", "Bun", "Mohawk", "Braids", "Curly", "Bob", "Wild", "Topknot"] },
  { key: "beard", label: "Beard", group: "hair", options: ["None", "Stubble", "Moustache", "Goatee", "Full", "Long", "Braided", "Wizard"] },
  { key: "outfit", label: "Outfit", group: "outfit", color: "main", options: ["Tunic", "Robe", "Plate armour", "Leather", "Chainmail", "Noble coat", "Peasant", "Monk", "Vestments", "Hunter", "Swashbuckler", "Samurai armour"] },
  { key: "cloak", label: "Cloak", group: "outfit", color: "cloakColor", options: ["None", "Cape", "Long cloak", "Scarf", "Fur mantle", "Hooded cloak"] },
  { key: "hat", label: "Headgear", group: "outfit", color: "hatColor", options: ["None", "Wizard hat", "Hood", "Helm", "Horned helm", "Crown", "Circlet", "Bandana", "Feathered cap", "Tricorn", "Flower crown", "Witch hat", "Headband", "Kabuto"] },
  { key: "hand", label: "In hand", group: "gear", color: "metal", options: ["Nothing", "Sword", "Axe", "Staff", "Wand", "Bow", "Dagger", "Mace", "Spear", "Lute", "Torch", "Hammer", "Crystal staff"] },
  { key: "offhand", label: "Other hand", group: "gear", options: ["Nothing", "Round shield", "Kite shield", "Spellbook", "Orb", "Lantern", "Potion", "Holy symbol"] },
  { key: "horns", label: "Horns", group: "extras", options: ["None", "Small horns", "Ram horns", "Swept horns", "Antlers", "Unicorn"] },
  { key: "tail", label: "Tail", group: "extras", options: ["None", "Devil tail", "Cat tail", "Lizard tail", "Fox tail"] },
  { key: "wings", label: "Wings", group: "extras", options: ["None", "Feathered", "Bat", "Fairy"] },
  { key: "pet", label: "Pet", group: "scene", color: "petColor", options: ["None", "Cat", "Dog", "Owl", "Raven", "Frog", "Dragonling", "Slime", "Rat", "Fox", "Bunny"] },
  { key: "platform", label: "Stand", group: "scene", options: ["None", "Grass", "Stone", "Wood", "Cloud", "Rune circle", "Snow", "Crate"] },
  { key: "background", label: "Backdrop", group: "scene", color: "sky", options: ["None", "Plain", "Forest", "Tavern", "Dungeon", "Night sky", "Sunset", "Castle", "Seaside", "Snowfield", "Desert", "Crystal cave", "Library"] },
];

/** Colour slots with no layer of their own: shown on these tabs. */
export const LOOSE_COLORS: { key: LookColorKey; group: LookGroup }[] = [{ key: "trim", group: "outfit" }];

const layerOf = (k: LookPartKey) => LAYERS.find((l) => l.key === k)!;

/** The default for anything unset. */
export const LOOK_DEFAULTS: Required<Look> = {
  body: 0,
  ears: 0,
  eyes: 0,
  mouth: 0,
  mark: 0,
  hair: 1,
  beard: 0,
  outfit: 0,
  cloak: 0,
  hat: 0,
  hand: 0,
  offhand: 0,
  horns: 0,
  tail: 0,
  wings: 0,
  pet: 0,
  platform: 0,
  background: 0,
  skin: 2,
  eye: 0,
  hairColor: 2,
  main: 0,
  trim: 13,
  cloakColor: 4,
  hatColor: 10,
  metal: 0,
  petColor: 0,
  sky: 0,
};

export function lookCount(key: LookPartKey | LookColorKey): number {
  return (LOOK_PARTS as readonly string[]).includes(key) ? layerOf(key as LookPartKey).options.length : SWATCHES[key as LookColorKey].length;
}

/** Keeps known keys with in-range whole numbers; drops anything else. Null when nothing is left. */
export function cleanCharLook(raw: unknown): Look | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const out: Look = {};
  for (const k of [...LOOK_PARTS, ...LOOK_COLORS]) {
    const v = (raw as Record<string, unknown>)[k];
    if (typeof v !== "number" || !Number.isInteger(v) || v < 0 || v >= lookCount(k)) continue;
    out[k] = v;
  }
  return Object.keys(out).length ? out : null;
}

export function lookValue(look: Look, k: LookPartKey | LookColorKey): number {
  return look[k] ?? LOOK_DEFAULTS[k];
}

/** A whole random character. Rarer bits (horns, wings, pets) show up now and then. */
export function randomLook(rand: () => number = Math.random): Look {
  const pick = (n: number) => Math.floor(rand() * n);
  const often = (k: LookPartKey, p: number) => (rand() < p ? 1 + pick(lookCount(k) - 1) : 0);
  const look: Look = {};
  for (const k of LOOK_COLORS) look[k] = pick(lookCount(k));
  // Mostly natural skin, sometimes fantasy.
  look.skin = rand() < 0.7 ? pick(9) : pick(lookCount("skin"));
  look.body = pick(lookCount("body"));
  look.ears = rand() < 0.55 ? 0 : pick(lookCount("ears"));
  look.eyes = rand() < 0.1 ? 7 : pick(7);
  look.mouth = pick(lookCount("mouth"));
  look.mark = often("mark", 0.4);
  look.hair = pick(lookCount("hair"));
  look.beard = often("beard", 0.35);
  look.outfit = pick(lookCount("outfit"));
  look.cloak = often("cloak", 0.5);
  look.hat = often("hat", 0.5);
  look.hand = often("hand", 0.85);
  look.offhand = often("offhand", 0.4);
  look.horns = often("horns", 0.2);
  look.tail = often("tail", 0.15);
  look.wings = often("wings", 0.1);
  look.pet = often("pet", 0.45);
  look.platform = often("platform", 0.8);
  look.background = often("background", 0.9);
  // Trim different from the main colour.
  if (look.trim === look.main) look.trim = (look.trim! + 5) % lookCount("trim");
  return look;
}

/** Random only within one tab. */
export function randomizeGroup(look: Look, group: LookGroup, rand: () => number = Math.random): Look {
  const fresh = randomLook(rand);
  const out: Look = { ...look };
  for (const l of LAYERS) {
    if (l.group !== group) continue;
    out[l.key] = fresh[l.key];
    if (l.color) out[l.color] = fresh[l.color];
  }
  for (const c of LOOSE_COLORS) if (c.group === group) out[c.key] = fresh[c.key];
  return out;
}

/** Same look, same string: a cache key. */
export function lookKey(look: Look): string {
  return [...LOOK_PARTS, ...LOOK_COLORS].map((k) => lookValue(look, k)).join(".");
}
