import { GP, SP } from "./money";
import type { GameState, Item, ItemCategory, MapData, Pin, PinLink, Scene, Shop } from "./types";

export const DEFAULT_SEATS = 6;

/** Seats at the table, for games created before the setting existed too. */
export function seatsOf(g: Pick<GameState, "maxPlayers">): number {
  return g.maxPlayers ?? DEFAULT_SEATS;
}

/** Players who hold a seat: everyone except those who left the table. */
export function seatedCount(g: Pick<GameState, "players">): number {
  return g.players.filter((p) => !p.archived).length;
}

// Spoiler-free starter catalog, organised by what things do. Every shop starts hidden.

const shop = (id: string, name: string, subtitle: string, extra: Partial<Shop> = {}): Shop => ({ id, name, subtitle, visibility: "hidden", playerIds: [], ...extra });

// Ids "docks" and "smith" are linked from map pins; keep them.
export const SEED_SHOPS: Shop[] = [
  shop("general", "General Store", "Odds and ends for the road"),
  shop("smith", "The Smithy", "Steel, leather, and things that shoot"),
  shop("apoth", "Apothecary & Temple", "Healing, holy water, and prayers"),
  shop("candle", "The Flickering Candle", "Mags hears everything"),
  shop("docks", "The Docks", "Boats, horses, and passage down the coast"),
  shop("training", "Training", "Learn something new"),
  shop("bg", "Baldur’s Gate", "Special orders from the city. Pay now; it arrives in 2 sessions."),
  shop("peddler", "A Traveling Peddler", "Comes once a year. Sells exactly what you need.", { closed: true, secretSales: true }),
];

type Opts = Partial<Omit<Item, "id" | "shopId" | "name" | "priceCp" | "description" | "category">>;
const it = (id: string, category: ItemCategory, shopId: string, name: string, priceCp: number, description: string, o: Opts = {}): Item => ({
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
  category,
  kind: "purchase",
  ...o,
});
const locked = (reason: string, o: Opts = {}): Opts => ({ tier: "locked", reason, ...o });
const rumored = (hint: string, o: Opts = {}): Opts => ({ tier: "rumored", hint, ...o });
/** Gear you buy one of, not a stack. */
const ONE: Opts = { oneAtATime: true };
const order = (o: Opts = {}): Opts => ({ kind: "order", arrivesInSessions: 2, ...o });
const service = (o: Opts = {}): Opts => ({ kind: "service", oneAtATime: true, ...o });
const rent = (o: Opts = {}): Opts => ({ kind: "recurring", oneAtATime: true, ...o });
const project = (o: Opts = {}): Opts => ({ kind: "project", ...o });
const earned = (o: Opts = {}): Opts => ({ kind: "earned", ...o });
const FREE: Opts = { priceLabel: "Free*", oneAtATime: true };
const LEVEL3 = "Orders open at level 3";

// prettier-ignore
export const SEED_ITEMS: Item[] = [
  // ---------- Gear ----------
  it("i2", "gear", "general", "Rope, 50 ft", 1 * GP, "Hempen. Mostly unfrayed."),
  it("g-caltrops", "gear", "general", "Caltrops (bag)", 1 * GP, "For whatever is chasing you."),
  it("g-oil", "gear", "general", "Oil Flask", 1 * SP, "Thrown and lit: fire damage."),
  it("i6", "gear", "general", "Hooded Lantern", 5 * GP, "Light you can hide in a hurry."),
  it("i8", "gear", "general", "Climber’s Kit", 25 * GP, "Pitons, harness, boot tips. Better than Artum’s ladders."),
  it("s-javelin", "gear", "smith", "Javelin", 5 * SP, "A thrown spear anyone can use."),
  it("i10", "gear", "smith", "Dagger", 2 * GP, "Every adventurer’s first friend."),
  it("i14", "gear", "smith", "Shield", 10 * GP, "Wood and iron. +2 AC.", ONE),
  it("i11", "gear", "smith", "Shortsword", 10 * GP, "Quick and light.", ONE),
  it("i12", "gear", "smith", "Longsword", 15 * GP, "The classic.", ONE),
  it("i15", "gear", "smith", "Shortbow", 25 * GP, "Easy to carry, quick to draw.", ONE),
  it("i17", "gear", "smith", "Arrows (20)", 1 * GP, "Fletched with gull feathers. Locally sourced."),
  it("i16", "gear", "smith", "Longbow", 50 * GP, "Reaches farther than trouble does.", ONE),
  it("i18", "gear", "smith", "Chain Shirt", 50 * GP, "Medium armor, quiet enough. Your first armor upgrade.", ONE),
  it("i19", "gear", "smith", "Chain Mail", 75 * GP, "Heavy armor. You’ll hear yourself coming.", ONE),
  it("i20", "gear", "smith", "Splint Armor", 200 * GP, "Heavy plates on leather.", locked("The smith needs iron from Orlumbor", ONE)),
  it("i21", "gear", "smith", "Plate Armor", 1500 * GP, "The dream. Every fighter in Candlefair stops to stare.", locked("Made to order, arrives at level 5", ONE)),

  // ---------- Healing ----------
  it("i7", "healing", "general", "Healer’s Kit", 5 * GP, "Stabilize a dying friend without a roll. Ten uses."),
  it("a-tonic", "healing", "apoth", "Temple Tonic", 15 * GP, "Heals 1d4 + 1. The poor adventurer’s healing potion."),
  it("i24", "healing", "apoth", "Holy Water", 25 * GP, "Blessed at the temple. Hurts the restless dead."),
  it("i22", "healing", "apoth", "Potion of Healing", 50 * GP, "Red, warm, and tastes like cinnamon. Heals 2d4 + 2."),
  it("i27", "healing", "apoth", "Potion of Greater Healing", 150 * GP, "Deep crimson. Heals 4d4 + 4.", locked("The priestess needs moonpetal from the Trollbark")),
  it("a-revivify", "healing", "apoth", "Revivify", 300 * GP, "The temple’s diamond and prayers for a fallen friend.", service({ prompt: "Who has fallen?" })),

  // ---------- Magic (special orders from Baldur's Gate) ----------
  it("bg-climbing", "magic", "bg", "Potion of Climbing", 100 * GP, "Climb like a spider for an hour. Tastes of tar.", order()),
  it("i42", "magic", "bg", "Bag of Holding", 400 * GP, "Bigger on the inside.", locked(LEVEL3, order({ oneAtATime: true }))),
  it("i44", "magic", "bg", "Cloak of Protection", 400 * GP, "Turns blows that should have landed. +1 AC and saves.", locked(LEVEL3, order({ oneAtATime: true }))),
  it("i43", "magic", "bg", "+1 Weapon", 400 * GP, "Finer steel than any smith in Candlefair can make.", locked(LEVEL3, order({ oneAtATime: true }))),
  it("bg-flametongue", "magic", "bg", "Flame Tongue", 4000 * GP, "A sword that bursts into flame on a word.", rumored("Only in the city itself", order({ oneAtATime: true }))),
  it("bg-wand", "magic", "bg", "Sorcerous Sundries", 0, "The city’s famous magic shop.", rumored("Wands, scrolls, and things that hum")),

  // ---------- Travel ----------
  it("i37", "travel", "docks", "Riding Horse", 75 * GP, "Freedom to travel. For the long road south.", ONE),
  it("i34", "travel", "docks", "Rowboat", 50 * GP, "Two oars, one bucket for bailing.", ONE),
  it("i35", "travel", "docks", "Fennick’s Boat", 120 * GP, "Good fishing boat. Barely sank.", { ...ONE, stock: 1, restockNote: "Sold. Fennick is already building another." }),
  it("i36", "travel", "docks", "Passage to Baldur’s Gate (each)", 20 * GP, "About four days by sea, weather permitting."),
  it("d-moonshae", "travel", "docks", "Passage to the Moonshae Isles", 0, "", rumored("No captain will sail there. Yet.")),
  it("d-keelboat", "travel", "docks", "Keelboat", 3000 * GP, "River and coast, with room for a crew.", locked("Ask the shipwrights on Orlumbor", ONE)),
  it("d-ship", "travel", "docks", "A Sailing Ship", 10000 * GP, "Your own ship. Your own flag.", locked("Every captain on the coast would know your name", ONE)),

  // ---------- Services ----------
  it("c-drink", "services", "candle", "Buy Mags a drink", 4, "She tells you a rumor.", service()),
  it("c-ask", "services", "candle", "Ask Mags about…", 5 * GP, "Name a person or place. She’ll tell you one thing that’s true.", service({ prompt: "Who or what do you want to ask about?" })),
  it("c-intro", "services", "candle", "An introduction", 2 * GP, "Mags introduces you to someone useful.", service()),
  it("c-flyer", "services", "candle", "Post on the notice board", 1 * SP, "Write a flyer. Mags pins it up if it’s decent.", service({ flyer: true })),
  it("c-porter", "services", "candle", "Hire a porter (per day)", 2 * SP, "Carries what you can’t."),
  it("i33", "services", "candle", "Hire a guide into the Trollbark (per day)", 2 * GP, "A local who knows which paths come back out."),
  it("c-sellsword", "services", "candle", "Hire a sellsword (per day)", 2 * GP, "Fights for coin. Mostly on your side."),
  it("c-safe", "services", "candle", "Safekeeping behind the bar", 1 * GP, "Mags keeps your valuables under the counter.", rent()),
  it("a-identify", "services", "apoth", "Identify an item", 20 * GP, "The priestess tells you what it is, and what it does.", service({ prompt: "Which item?" })),
  it("tr-lang", "services", "training", "Learn a language or tool", 250 * GP, "Five lessons, paid one per session. Proficiency when you finish.", { kind: "training", installments: 5, oneAtATime: true, prompt: "Which language or tool?" }),
  it("tr-watcher", "services", "training", "Lessons with ???", 0, "", rumored("Someone in town has been watching you.", { kind: "training", installments: 5, oneAtATime: true })),

  // ---------- Building Candlefair ----------
  it("i30", "building", "candle", "Room for the Night", 5 * SP, "Warm bed, roof that never leaks."),
  it("c-room", "building", "candle", "Rent a room", 3 * GP, "A room upstairs, and a stash for your gear.", rent()),
  it("c-tab", "building", "candle", "Open a tab", 0, "Mags lets you drink now and pay later, up to 10 gp.", locked("Once Mags thinks of you as regulars.", { priceLabel: "No charge", oneAtATime: true, effects: [{ type: "credit", limitCp: 10 * GP }] })),
  it("c-backroom", "building", "candle", "The Back Room", 10 * GP, "A private room behind the kitchen. Thick walls, one key. The party’s first headquarters.", locked("Mags only rents it to people she trusts.", rent({ keep: true }))),
  it("g-house", "building", "general", "A house in town", 1000 * GP, "A door with your name on it.", locked("Available at level 4", { ...ONE, keep: true })),
  it("g-hall", "building", "general", "An adventurers’ hall", 2000 * GP, "A hall, a sign, and a reputation.", locked("Candlefair needs to know who you are first", { ...ONE, keep: true })),
  it("d-ferry", "building", "docks", "New rope and lantern for the ferry", 15 * GP, "The ferry runs after dark again.", project()),
  it("d-fishing", "building", "docks", "A share in Fennick’s fishing", 150 * GP, "1d6 gp every session, split by share.", project({ effects: [{ type: "income", dice: "1d6", unitCp: GP }] })),
  it("i39", "building", "general", "Lanterns for the watch", 100 * GP, "Safer streets at night.", project()),
  it("i40", "building", "apoth", "Repair the temple roof", 250 * GP, "The priestess will remember this: 10% off Healing.", project({ effects: [{ type: "discount", pct: 10, category: "healing" }] })),
  it("s-forge", "building", "smith", "A new forge", 300 * GP, "Hot enough for real armor. Unlocks Splint Armor.", project({ effects: [{ type: "unlock", itemId: "i20" }] })),
  it("t-lighthouse", "building", "docks", "Rebuild the Lantern’s lighthouse", 500 * GP, "Ships return, and new stock comes to the Docks.", rumored("The old lamp across the river hasn’t been lit in years.", project())),

  // ---------- Trophies ----------
  it("i32", "trophies", "candle", "Round for the House", 5 * GP, "Everyone drinks. Advantage on your next Charisma check at the Candle."),
  it("c-trophy", "trophies", "candle", "Mount a trophy at the Candle", 50 * GP, "A keepsake from a fight goes on the wall, with a little plaque.", { keep: true }),
  it("g-citizens", "trophies", "general", "Free Citizens of Candlefair", 500 * GP, "A title on your page.", locked("The council must vote.", { ...ONE, keep: true })),
  it("i41", "trophies", "general", "A Statue of the Party", 1000 * GP, "In the square.", locked("Pigeons included", { ...ONE, keep: true })),
  it("c-tale", "trophies", "candle", "A candle on the tale shelf", 0, "For the best tale on Tale Night.", earned()),
  it("c-pudding", "trophies", "candle", "The Pudding Slayer", 0, "A drink named after the party.", earned()),

  // ---------- A Traveling Peddler (closed until the DM opens it, usually for one player) ----------
  it("p-coin", "magic", "peddler", "A Lucky Coin", 0, "Warm to the touch. Lands the way you need it to, once.", { ...FREE, finePrint: "*Must be returned to the Peddler before Winterfest ends." }),
  it("p-key", "magic", "peddler", "Exactly the Right Key", 0, "Opens one door you will very much need opened.", { ...FREE, finePrint: "*The Peddler chooses which door." }),
  it("p-wind", "magic", "peddler", "A Second Wind, Bottled", 0, "Uncork it when you’re down. You’ll get back up.", { ...FREE, finePrint: "*Payment will be collected later." }),
];


// ---------- maps ----------

type RawPin = [name: string, type: string, description: string, discovered?: boolean, link?: PinLink];

/** Seed pins start in a loose grid so they're easy to grab and drag into place once the image is up. */
function pins(raw: RawPin[], prefix: string): Pin[] {
  return raw.map(([name, type, description, discovered, link], i) => ({
    id: `${prefix}${i + 1}`,
    number: i + 1,
    showsAs: "",
    name,
    type,
    description,
    dmNotes: "",
    discovered: !!discovered,
    x: 0.2 + (i % 4) * 0.2,
    y: 0.3 + Math.floor(i / 4) * 0.4,
    ...(link ? { link } : {}),
  }));
}

function mapData(p: Pin[]): MapData {
  return { pins: p, legendOn: false, legendStyle: "names" };
}

export function candlefairMap(): MapData {
  return mapData(
    pins(
      [
        ["The Flickering Candle", "tavern", "The finest tavern this side of the Winding Water.", true],
        ["The Banquet Hall", "hall", "Where the Winterfest feast is held.", true],
        ["The Docks", "docks", "Fishing boats, the ferry, and the odd ship up from Baldur’s Gate.", true, { kind: "shop", shopId: "docks" }],
        ["The Temple", "temple", "Quiet, cold, and always a candle lit."],
        ["The Smithy", "shop", "Hammering from dawn to dusk.", false, { kind: "shop", shopId: "smith" }],
        ["The Market Square", "square", "Winterfest’s heart."],
        ["Lathtarl’s Lantern", "village", "The little fishing village across the river."],
        ["Warlock’s Crypt", "danger", "The old crypt on the hill above town."],
      ],
      "cf",
    ),
  );
}

export function swordCoastMap(candlefairSceneId = "s-map"): MapData {
  return mapData(
    pins(
      [
        ["Candlefair", "home", "Home.", true, { kind: "scene", sceneId: candlefairSceneId }],
        ["Baldur’s Gate", "city", "A week south."],
        ["Daggerford", "town", "A small river town up the road."],
        ["Orlumbor", "island", "Shipwrights’ island offshore."],
        ["The Trollbark Forest", "danger", "Locals don’t go in after dark."],
      ],
      "sc",
    ),
  );
}

export const SEED_SCENES: Scene[] = [
  { id: "s-board", label: "Notice board", kind: "notice", hotkey: 1, reveal: false, art: { builtin: "candlefair-board" } },
  { id: "s-artum", label: "Artum", kind: "portrait", hotkey: 2, reveal: false, art: { builtin: "artum" }, name: "Artum", title: "Planner of Winterfest", alt: "Portrait of Artum, Winterfest’s harried planner: balding, spectacles, worried brows, a quill behind his ear and a scarf" },
  { id: "s-mags", label: "Mags Wick", kind: "portrait", hotkey: 3, reveal: false, art: { builtin: "mags-wick" }, name: "Mags Wick", title: "Keeper of the Flickering Candle", alt: "Portrait of Mags Wick, the halfling who runs the Flickering Candle: gray hair in a bun, rosy cheeks, a wide smile and an apron" },
  { id: "s-chef", label: "The chef", kind: "portrait", hotkey: 4, reveal: false, art: { builtin: "chef" }, name: "The Chef", title: "Head cook of the Winterfest feast", alt: "Portrait of the chef: a tall puffy chef’s hat, a big ginger beard, a proud smile, a flour smudge and a wooden spoon" },
  { id: "s-notice", label: "Artum’s notice", kind: "handout", hotkey: 5, reveal: false, art: { builtin: "artum-notice" }, alt: "Artum’s handbill: Winterfest Needs Hands!" },
  { id: "s-map", label: "Candlefair map", kind: "map", hotkey: 6, reveal: false, art: {}, alt: "Map of Candlefair", map: candlefairMap() },
  { id: "s-swordcoast", label: "Sword Coast map", kind: "map", hotkey: 9, reveal: false, art: {}, alt: "Map of the Sword Coast", map: swordCoastMap() },
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
    ...emptyProgress(),
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
  Object.assign(s, emptyProgress());
  const home = s.scenes.find((x) => x.kind === "notice" && !x.reveal) ?? s.scenes.find((x) => !x.reveal) ?? s.scenes[0];
  if (home) s.live.sceneId = home.id;
  s.live.shopOpen = false;
  delete s.live.recapSessionId;
  return s;
}

/** Rentals, training, shares, awards, inbox tasks and flyers: none yet. */
export function emptyProgress(): Pick<GameState, "rentals" | "trainings" | "stakes" | "effectsOn" | "awards" | "tasks" | "flyers"> {
  return { rentals: [], trainings: [], stakes: [], effectsOn: {}, awards: [], tasks: [], flyers: [] };
}
