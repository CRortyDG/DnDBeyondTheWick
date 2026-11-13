import { GP, SP } from "./money";
import type { GameState, Item, Scene, Shop } from "./types";

export const DEFAULT_SEATS = 6;

/** Seats at the table, for games created before the setting existed too. */
export function seatsOf(g: Pick<GameState, "maxPlayers">): number {
  return g.maxPlayers ?? DEFAULT_SEATS;
}

/** Players who hold a seat: everyone except those who left the table. */
export function seatedCount(g: Pick<GameState, "players">): number {
  return g.players.filter((p) => !p.archived).length;
}

// Copied from the prototype (candlefair-tv-prototype.html). Spoiler-free.

// Spoiler-free starter catalog. Every shop starts hidden; the DM opens them in play.
//
// Budget: about a third of the goods are under 25 gp (they leave Episode 1 with
// something); 25-100 gp is where the party pools money; 100+ gp are goals and teases.

const shop = (id: string, name: string, subtitle: string, extra: Partial<Shop> = {}): Shop => ({ id, name, subtitle, visibility: "hidden", playerIds: [], ...extra });

export const SEED_SHOPS: Shop[] = [
  shop("general", "General Store", "Odds and ends for the road"),
  shop("smith", "The Smithy", "Steel, leather, and things that shoot"),
  shop("apoth", "Apothecary & Temple", "Healing, holy water, and things in jars"),
  shop("candle", "The Flickering Candle", "Mags will put it on your tab"),
  shop("docks", "The Docks", "Passage, boats, hired help, and special orders from the Gate"),
  shop("town", "Invest in Candlefair", "Put your gold into the town"),
  shop("bg", "Baldur’s Gate Catalog", "Big-city goods. Ask around once you’ve been."),
  shop("training", "Training", "Learn something new"),
  shop("peddler", "A Traveling Peddler", "Comes once a year. Sells exactly what you need.", { closed: true, secretSales: true }),
];

type Opts = Partial<Pick<Item, "tier" | "reason" | "hint" | "hidePrice" | "stock" | "restockNote" | "priceLabel" | "finePrint" | "arrivesInSessions" | "oneAtATime">>;
const it = (id: string, shopId: string, name: string, priceCp: number, description: string, o: Opts = {}): Item => ({
  id,
  shopId,
  name,
  priceCp,
  description,
  tier: "sale",
  reason: "",
  hint: "",
  hidePrice: false,
  stock: null,
  restockNote: "",
  ...o,
});
const locked = (reason: string, o: Opts = {}): Opts => ({ tier: "locked", reason, ...o });
const rumored = (hint: string): Opts => ({ tier: "rumored", hint });
const BG = "Ships once you’ve been to Baldur’s Gate";
const ORDER = "Ships up the coast. Pay now; it arrives in 2 sessions.";
const order: Opts = { arrivesInSessions: 2 };
const FREE: Opts = { priceLabel: "Free*", oneAtATime: true };
/** Gear you buy one of, not a stack. */
const ONE: Opts = { oneAtATime: true };

// prettier-ignore
export const SEED_ITEMS: Item[] = [
  // General Store
  it("i0", "general", "Torch", 1, "Burns for an hour. Smells like it."),
  it("i1", "general", "Rations (1 day)", 5 * SP, "Hard bread, dried fish, a wedge of cheese."),
  it("i2", "general", "Rope, 50 ft", 1 * GP, "Hempen. Mostly unfrayed."),
  it("g-oil", "general", "Oil Flask", 1 * SP, "Throw it, light it. Cheap fire."),
  it("g-caltrops", "general", "Caltrops (bag)", 1 * GP, "For whatever is chasing you."),
  it("i3", "general", "Bedroll", 1 * GP, "For nights when the Candle is full."),
  it("i4", "general", "Backpack", 2 * GP, "Holds more than you think."),
  it("i5", "general", "Traveler’s Clothes", 2 * GP, "Wool, warm, and winter-ready."),
  it("i6", "general", "Hooded Lantern", 5 * GP, "Light you can hide in a hurry."),
  it("i7", "general", "Healer’s Kit", 5 * GP, "Bandages and salves. Stabilize a dying friend without a roll. Ten uses."),
  it("i9", "general", "Fine Clothes", 15 * GP, "For when you’re invited to sit at the banquet, not serve it."),
  it("i8", "general", "Climber’s Kit", 25 * GP, "Pitons, harness, boot tips. Better than Artum’s ladders."),
  it("g-lute", "general", "A Masterwork Lute", 35 * GP, "Spruce and maple, strung in Waterdeep. The shopkeeper won’t let you touch it until you can pay.", { ...ONE, stock: 1, restockNote: "Sold. Another may come up the coast someday." }),

  // The Smithy
  it("s-javelin", "smith", "Javelin", 5 * SP, "A thrown spear anyone can use."),
  it("i10", "smith", "Dagger", 2 * GP, "Every adventurer’s first friend."),
  it("i17", "smith", "Arrows (20)", 1 * GP, "Fletched with gull feathers. Locally sourced."),
  it("i11", "smith", "Shortsword", 10 * GP, "Quick and light.", ONE),
  it("i14", "smith", "Shield", 10 * GP, "Wood and iron. +2 AC.", ONE),
  it("i12", "smith", "Longsword", 15 * GP, "The classic.", ONE),
  it("i13", "smith", "Warhammer", 15 * GP, "For problems that need flattening.", ONE),
  it("i15", "smith", "Shortbow", 25 * GP, "Easy to carry, quick to draw.", ONE),
  it("i16", "smith", "Longbow", 50 * GP, "Reaches farther than trouble does.", ONE),
  it("i18", "smith", "Chain Shirt", 50 * GP, "Medium armor, quiet enough. Your first armor upgrade.", ONE),
  it("i19", "smith", "Chain Mail", 75 * GP, "Heavy armor. You’ll hear yourself coming.", ONE),
  it("i20", "smith", "Splint Armor", 200 * GP, "Heavy plates on leather.", locked("The smith needs iron from Orlumbor", ONE)),
  it("i21", "smith", "Plate Armor", 1500 * GP, "The dream. Every fighter in Candlefair stops to stare.", locked("Made to order, arrives at level 5", ONE)),

  // Apothecary & Temple
  it("a-salts", "apoth", "Smelling Salts", 2 * GP, "Wake an unconscious ally: they’re stable and wake up."),
  it("i26", "apoth", "Arcane Focus (Crystal)", 10 * GP, "Hums faintly in cold weather."),
  it("a-tonic", "apoth", "Temple Tonic", 15 * GP, "Heals 1d4 + 1. The poor adventurer’s healing potion."),
  it("i24", "apoth", "Holy Water", 25 * GP, "Blessed at the temple. Hurts the restless dead."),
  it("i25", "apoth", "Component Pouch", 25 * GP, "Bits and pieces for spellcasters."),
  it("i22", "apoth", "Potion of Healing", 50 * GP, "Red, warm, and tastes like cinnamon. Heals 2d4 + 2."),
  it("i23", "apoth", "Antitoxin", 50 * GP, "For bites from things in the Trollbark."),
  it("a-fire", "apoth", "Alchemist’s Fire", 50 * GP, "A thrown bottle of fire. Handle with care."),
  it("i27", "apoth", "Potion of Greater Healing", 150 * GP, "Deep crimson. Heals 4d4 + 4.", locked("The priestess needs moonpetal from the Trollbark")),

  // The Flickering Candle
  it("i28", "candle", "Mug of Ale", 4, "Mags pours it before you ask."),
  it("c-pie", "candle", "Mags’s Meat Pie", 1 * SP, "Tastes like home."),
  it("i29", "candle", "Hot Meal", 3 * SP, "Whatever’s in the pot. It’s always good."),
  it("c-cider", "candle", "Hot Cider Flask", 5 * SP, "Advantage on one saving throw against cold."),
  it("i30", "candle", "Room for the Night", 5 * SP, "Warm bed, roof that never leaks."),
  it("i31", "candle", "Bottle of Wine", 2 * GP, "Something red from up the coast."),
  it("i32", "candle", "Round for the House", 5 * GP, "Everyone drinks. Everyone remembers who paid."),
  it("c-backroom", "candle", "The Back Room", 2 * GP, "A private room behind the kitchen. Thick walls, one key.", locked("Mags only rents it to people she trusts")),

  // The Docks
  it("d-charm", "docks", "Lantern-Village Charm", 5 * SP, "“Brings luck at sea.” Does nothing. Or does it?"),
  it("i33", "docks", "Guide into the Trollbark (1 day)", 2 * GP, "A local who knows which paths come back out."),
  it("i36", "docks", "Passage to Baldur’s Gate (each)", 20 * GP, "About four days by sea, weather permitting."),
  it("i34", "docks", "Rowboat", 50 * GP, "Two oars, one bucket for bailing.", ONE),
  it("i37", "docks", "Riding Horse", 75 * GP, "Freedom to travel. For the long road south.", ONE),
  it("i35", "docks", "Fennick’s Boat", 120 * GP, "Good fishing boat. Barely sank.", { ...ONE, stock: 1, restockNote: "Sold. Fennick is already building another." }),
  it("d-pastry", "docks", "Special Order: Lower City Pastry Box", 2 * GP, `Sweets from a Baldur’s Gate bakery. Probably stale by the time they arrive. ${ORDER}`, order),
  it("d-spellbook", "docks", "Special Order: Blank Spellbook", 50 * GP, `Vellum, a lock, and room for a career. ${ORDER}`, order),
  it("d-silver", "docks", "Special Order: Silvered Dagger", 110 * GP, `For the things plain steel won’t hurt. ${ORDER}`, order),
  it("d-moonshae", "docks", "Passage to the Moonshae Isles", 100 * GP, "", rumored("No captain will sail there. Yet.")),

  // Invest in Candlefair
  it("i38", "town", "Sponsor a Winterfest Stall", 25 * GP, "Your name on a banner in the square."),
  it("i39", "town", "Fund the Town Watch", 100 * GP, "More lanterns on the streets at night."),
  it("i40", "town", "Repair the Temple Roof", 250 * GP, "The priestess will remember this."),
  it("t-lighthouse", "town", "Restore the Lantern’s Old Lighthouse", 750 * GP, "", rumored("The old lamp across the river hasn’t been lit in years.")),
  it("i41", "town", "A Statue of the Party", 1000 * GP, "In the square. Pigeons included.", locked("Candlefair needs to know who you are first")),

  // Baldur's Gate Catalog: famous names the players will recognize
  it("bg-wand", "bg", "A Wand from Sorcerous Sundries", 0, "The city’s famous magic shop. Wands, scrolls, and things that hum.", locked(BG, { hidePrice: true })),
  it("i45", "bg", "Spell Scrolls (Sorcerous Sundries)", 0, "Magic, written down and for sale.", locked(BG, { hidePrice: true })),
  it("i42", "bg", "Bag of Holding", 500 * GP, "Sorcerous Sundries keeps a few behind the counter. Bigger on the inside.", locked(BG)),
  it("i44", "bg", "Cloak of Protection", 500 * GP, "From the stalls of the Wide, the city’s great market. Turns blows that should have landed.", locked(BG)),
  it("i43", "bg", "+1 Weapon", 500 * GP, "From the Wide. Finer steel than any smith in Candlefair can make.", locked(BG)),
  it("bg-elfsong", "bg", "A Drink at the Elfsong Tavern", 1 * GP, "", rumored("They say you can still hear her singing.")),

  // Training (hidden shop)
  it("tr-watcher", "training", "A Teacher", 0, "", rumored("Someone in town has been watching you.")),

  // A Traveling Peddler (hidden, closed until the DM opens it, usually for one player)
  it("p-coin", "peddler", "A Lucky Coin", 0, "Warm to the touch. Lands the way you need it to, once.", { ...FREE, finePrint: "*Must be returned to the Peddler before Winterfest ends." }),
  it("p-key", "peddler", "Exactly the Right Key", 0, "Opens one door you will very much need opened.", { ...FREE, finePrint: "*The Peddler chooses which door." }),
  it("p-wind", "peddler", "A Second Wind, Bottled", 0, "Uncork it when you’re down. You’ll get back up.", { ...FREE, finePrint: "*Payment will be collected later." }),
];

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
    schema: 2,
    id,
    name,
    createdAt: now,
    live: { sceneId: "s-board", shopOpen: false, shopId: "general", purseVisible: true },
    doorClosed: false,
    maxPlayers: DEFAULT_SEATS,
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
    orders: [],
    banner: null,
    requests: [],
    seq: 100,
  };
}

/**
 * "Start fresh" after testing: keeps players, scenes, shops and items, but
 * zeroes every purse and clears sessions (and their recaps) and knocks. Episodes stay. The ledger is wiped
 * separately by the caller. Everything else is untouched.
 */
export function freshStart(g: GameState): GameState {
  const s = structuredClone(g);
  for (const p of s.players) p.balanceCp = 0;
  s.sessions = [];
  s.currentSessionId = null;
  s.knocks = [];
  s.orders = [];
  s.banner = null;
  s.requests = [];
  const home = s.scenes.find((x) => x.kind === "notice" && !x.reveal) ?? s.scenes.find((x) => !x.reveal) ?? s.scenes[0];
  if (home) s.live.sceneId = home.id;
  s.live.shopOpen = false;
  delete s.live.recapSessionId;
  return s;
}
