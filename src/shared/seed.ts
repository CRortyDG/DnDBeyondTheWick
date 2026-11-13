import { GP, SP } from "./money";
import type { GameState, Item, Scene, Shop } from "./types";

// Copied from the prototype (candlefair-tv-prototype.html). Spoiler-free.

export const SEED_SHOPS: Shop[] = [
  { id: "general", name: "General Store", subtitle: "Odds and ends for the road" },
  { id: "smith", name: "The Smithy", subtitle: "Steel, leather, and things that shoot" },
  { id: "apoth", name: "Apothecary & Temple", subtitle: "Healing, holy water, and things in jars" },
  { id: "candle", name: "The Flickering Candle", subtitle: "Mags will put it on your tab" },
  { id: "docks", name: "The Docks", subtitle: "Passage, boats, and hired help" },
  { id: "town", name: "Invest in Candlefair", subtitle: "Put your gold into the town" },
  { id: "bg", name: "Baldur’s Gate Catalog", subtitle: "Big-city goods. Ask around once you’ve been." },
];

type Raw = [shop: string, name: string, cp: number, desc: string, lock?: string, hidePrice?: boolean];

// prettier-ignore
const DEFAULT_ITEMS: Raw[] = [
  ["general", "Torch", 1, "Burns for an hour. Smells like it."],
  ["general", "Rations (1 day)", 5 * SP, "Hard bread, dried fish, a wedge of cheese."],
  ["general", "Rope, 50 ft", 1 * GP, "Hempen. Mostly unfrayed."],
  ["general", "Bedroll", 1 * GP, "For nights when the Candle is full."],
  ["general", "Backpack", 2 * GP, "Holds more than you think."],
  ["general", "Traveler’s Clothes", 2 * GP, "Wool, warm, and winter-ready."],
  ["general", "Hooded Lantern", 5 * GP, "Light you can hide in a hurry."],
  ["general", "Healer’s Kit", 5 * GP, "Bandages and salves. Ten uses."],
  ["general", "Climber’s Kit", 25 * GP, "Pitons, harness, boot tips. Better than Artum’s ladders."],
  ["general", "Fine Clothes", 15 * GP, "For when you’re invited to sit at the banquet, not serve it."],

  ["smith", "Dagger", 2 * GP, "Every adventurer’s first friend."],
  ["smith", "Shortsword", 10 * GP, "Quick and light."],
  ["smith", "Longsword", 15 * GP, "The classic."],
  ["smith", "Warhammer", 15 * GP, "For problems that need flattening."],
  ["smith", "Shield", 10 * GP, "Wood and iron. +2 AC."],
  ["smith", "Shortbow", 25 * GP, "Easy to carry, quick to draw."],
  ["smith", "Longbow", 50 * GP, "Reaches farther than trouble does."],
  ["smith", "Arrows (20)", 1 * GP, "Fletched with gull feathers. Locally sourced."],
  ["smith", "Chain Shirt", 50 * GP, "Medium armor, quiet enough."],
  ["smith", "Chain Mail", 75 * GP, "Heavy armor. You’ll hear yourself coming."],
  ["smith", "Splint Armor", 200 * GP, "Heavy plates on leather.", "The smith needs a bigger forge first"],
  ["smith", "Plate Armor", 1500 * GP, "The dream. Every fighter in Candlefair stops to stare.", "Made to order: arrives at level 5"],

  ["apoth", "Potion of Healing", 50 * GP, "Red, warm, and tastes like cinnamon. Heals 2d4 + 2."],
  ["apoth", "Antitoxin", 50 * GP, "For bites from things in the Trollbark."],
  ["apoth", "Holy Water", 25 * GP, "Blessed at the temple. Hurts the restless dead."],
  ["apoth", "Component Pouch", 25 * GP, "Bits and pieces for spellcasters."],
  ["apoth", "Arcane Focus (Crystal)", 10 * GP, "Hums faintly in cold weather."],
  ["apoth", "Potion of Greater Healing", 150 * GP, "Deep crimson. Heals 4d4 + 4.", "The priestess will brew it at level 5"],

  ["candle", "Mug of Ale", 4, "Mags pours it before you ask."],
  ["candle", "Hot Meal", 3 * SP, "Whatever’s in the pot. It’s always good."],
  ["candle", "Room for the Night", 5 * SP, "Warm bed, roof that never leaks."],
  ["candle", "Bottle of Wine", 2 * GP, "Something red from up the coast."],
  ["candle", "Round for the House", 5 * GP, "Everyone drinks. Everyone remembers who paid."],

  ["docks", "Guide into the Trollbark (1 day)", 2 * GP, "A local who knows which paths come back out."],
  ["docks", "Rowboat", 50 * GP, "Two oars, one bucket for bailing."],
  ["docks", "Fennick’s Boat", 120 * GP, "Good fishing boat. Barely sank."],
  ["docks", "Passage to Baldur’s Gate (each)", 20 * GP, "About four days by sea, weather permitting."],
  ["docks", "Riding Horse", 75 * GP, "For the long road south."],

  ["town", "Sponsor a Winterfest Stall", 25 * GP, "Your name on a banner in the square."],
  ["town", "Fund the Town Watch", 100 * GP, "More lanterns on the streets at night."],
  ["town", "Repair the Temple Roof", 250 * GP, "The priestess will remember this."],
  ["town", "A Statue of the Party", 1000 * GP, "In the square. Pigeons included.", "Candlefair needs to know who you are first"],

  ["bg", "Bag of Holding", 0, "Bigger on the inside.", "Unlocks after you visit Baldur’s Gate", true],
  ["bg", "+1 Weapon", 0, "Finer steel than any smith in Candlefair can make.", "Unlocks after you visit Baldur’s Gate", true],
  ["bg", "Cloak of Protection", 0, "Turns blows that should have landed.", "Unlocks after you visit Baldur’s Gate", true],
  ["bg", "Spell Scrolls", 0, "Magic, written down and for sale.", "Unlocks after you visit Baldur’s Gate", true],
];

export const SEED_ITEMS: Item[] = DEFAULT_ITEMS.map(([shopId, name, priceCp, description, lock, hide], i) => ({
  id: "i" + i,
  shopId,
  name,
  priceCp,
  description,
  lockReason: lock ?? "",
  hidePrice: !!hide,
}));

export const SEED_SCENES: Scene[] = [
  { id: "s-board", label: "Notice board", kind: "notice", hotkey: 1, reveal: false, art: { builtin: "candlefair-board" } },
  { id: "s-artum", label: "Artum", kind: "portrait", hotkey: 2, reveal: false, art: { builtin: "artum" }, name: "Artum", title: "Planner of Winterfest", alt: "Portrait of Artum, Winterfest’s harried planner: balding, spectacles, worried brows, a quill behind his ear and a scarf" },
  { id: "s-mags", label: "Mags Wick", kind: "portrait", hotkey: 3, reveal: false, art: { builtin: "mags-wick" }, name: "Mags Wick", title: "Keeper of the Flickering Candle", alt: "Portrait of Mags Wick, the halfling who runs the Flickering Candle: gray hair in a bun, rosy cheeks, a wide smile and an apron" },
  { id: "s-chef", label: "The chef", kind: "portrait", hotkey: 4, reveal: false, art: { builtin: "chef" }, name: "The Chef", title: "Head cook of the Winterfest feast", alt: "Portrait of the chef: a tall puffy chef’s hat, a big ginger beard, a proud smile, a flour smudge and a wooden spoon" },
  { id: "s-notice", label: "Artum’s notice", kind: "handout", hotkey: 5, reveal: false, art: { builtin: "artum-notice" }, alt: "Artum’s handbill: Winterfest Needs Hands!" },
  { id: "s-map", label: "Town map", kind: "image", hotkey: 6, reveal: false, art: {}, alt: "Map of Candlefair" },
  { id: "s-extra", label: "Extra image", kind: "image", hotkey: 7, reveal: false, art: {}, alt: "Scene image" },
  { id: "s-symbol", label: "The symbol", kind: "handout", hotkey: 8, reveal: true, art: { builtin: "merchant-sigil" }, alt: "A symbol drawn on paper" },
  { id: "s-black", label: "Black screen", kind: "black", hotkey: 0, reveal: false },
];

export function seedGame(id: string, name = "Tales from the Flickering Candle", now = Date.now()): GameState {
  return {
    schema: 1,
    id,
    name,
    createdAt: now,
    live: { sceneId: "s-board", shopOpen: false, shopId: "general", purseVisible: true },
    doorClosed: false,
    players: [1, 2, 3, 4].map((n) => ({
      id: "p" + n,
      handle: "player" + n,
      name: "Player " + n,
      away: false,
      archived: false,
      dropIn: false,
      balanceCp: 0,
      createdAt: now,
      createdVia: "seed" as const,
    })),
    scenes: structuredClone(SEED_SCENES),
    shops: structuredClone(SEED_SHOPS),
    items: structuredClone(SEED_ITEMS),
    sessions: [],
    currentSessionId: null,
    knocks: [],
    seq: 100,
  };
}
