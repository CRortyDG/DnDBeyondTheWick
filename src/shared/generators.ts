// The off-script kit's generators: names, quick NPCs, taverns and shops,
// encounters, rumors, monsters and complications for when the party goes
// somewhere the DM didn't plan.
//
// DM-ONLY, and offline: every roll happens in the DM's browser from the
// campaign's random tables (tables.ts) when it has them, else from the
// built-in lists below. Nothing here reaches the TV or a phone until the DM
// saves a result and shows or reveals it.
//
// The built-in lists are original, written for a cozy Sword Coast river town.

import { monstersOf, parseFightLine, templateByName } from "./combat";
import { placeTable } from "./offscript";
import { rollTable, tablesOf } from "./tables";
import type { Entry, GameState, MonsterTemplate, RandomTable } from "./types";

export type GenKind = "name" | "npc" | "shop" | "encounter" | "rumor" | "monster" | "complication";

export const GENERATORS: { id: GenKind; label: string; key: string }[] = [
  { id: "name", label: "Name", key: "1" },
  { id: "npc", label: "Quick NPC", key: "2" },
  { id: "shop", label: "Tavern or shop", key: "3" },
  { id: "encounter", label: "Encounter", key: "4" },
  { id: "rumor", label: "Rumor", key: "5" },
  { id: "monster", label: "Monster", key: "6" },
  { id: "complication", label: "Complication", key: "7" },
];

type Rand = () => number;

const pick = <T>(list: readonly T[], rand: Rand): T => list[Math.floor(rand() * list.length) % list.length];

// ---------- the built-in lists ----------

export const FIRST_NAMES = [
  "Tamsin", "Odo", "Brill", "Wenna", "Corwin", "Ysolde", "Pell", "Marrow", "Edda", "Fen",
  "Hobb", "Liesl", "Rook", "Sabeth", "Tully", "Ansel", "Greer", "Nim", "Orla", "Quill",
  "Bram", "Delphine", "Gus", "Hester", "Ivo", "Juniper", "Kestrel", "Lark", "Merrit", "Nessa",
] as const;

export const FAMILY_NAMES = [
  "Reedwhistle", "Copperkettle", "Marsh", "Underbough", "Ferrow", "Saltmarsh", "Tallowby", "Brindle", "Oakhollow", "Pennywise",
  "Ashgrove", "Mudlark", "Fairwater", "Thistledown", "Crane", "Hollin", "Bellwether", "Duckett", "Greenhay", "Riverson",
] as const;

export const ROLES = [
  "ferry hand", "net mender", "lamplighter", "baker's apprentice", "retired caravan guard", "eel seller", "lock keeper",
  "travelling tinker", "town crier", "herb woman", "boat builder", "dockside fortune teller", "night watch", "candle dipper",
  "goatherd", "tollhouse clerk", "temple acolyte", "fishmonger", "rope maker", "storyteller",
] as const;

export const LOOKS = [
  "flour to the elbows", "a coat two sizes too big", "one ear pierced with a fishhook", "freckles and a sunburnt nose",
  "a sling holding a sleeping cat", "ink-stained fingers", "a scarf knitted in six colours", "a wooden leg carved with fish",
  "spectacles mended with twine", "boots caked in river mud", "a crown of dried flowers", "a pipe that is never lit",
  "a ledger tucked under one arm", "a smile missing two teeth", "a lantern even at noon", "a heron feather in their hat",
  "a patched sail for a cloak", "hands that smell of tallow", "a tiny brass bell on a cord", "a very serious goose on a lead",
] as const;

export const QUIRKS = [
  "counts things under their breath", "answers questions with questions", "hums sea shanties badly", "calls everyone 'duck'",
  "taps the table twice before speaking", "won't sit with their back to water", "collects buttons", "laughs at their own jokes first",
  "names every animal they meet", "quotes a grandmother no one has met", "forgets names, never faces", "offers food constantly",
  "speaks to the river as if it listens", "insists it will rain", "keeps a tally of favours owed", "whistles when nervous",
  "corrects everyone's knots", "is suspicious of anyone in boots", "bets on everything", "never finishes a story",
] as const;

export const WANTS = [
  "to see the sea just once", "their boat back from the bailiff", "a recipe their mother took to the grave", "someone to mind the shop for an hour",
  "news of a brother who went downriver", "to win the Winterfest pie contest", "a quiet word with the harbourmaster", "to pay off a debt before anyone finds out",
  "a cure for the cough going round", "an apprentice who listens", "the old bridge mended", "to know who's been leaving flowers on the step",
  "a letter read aloud to them", "to get out of a betrothal politely", "their lucky coin back", "the goats to stop eating the washing",
  "a fair price for their eels", "proof the ghost in the mill is real", "a map of the old smugglers' tunnels", "to be invited to something, anything",
] as const;

export const KNOWS = [
  "the ferry runs late when the ferryman's courting", "which cellar floods first", "someone has been buying a lot of lamp oil", "the old well isn't dry",
  "a stranger asked about the temple bells", "the mill wheel stops at midnight", "where the otters keep their stash of shiny things", "the baker's new partner pays in old coin",
  "the lighthouse keeper writes letters to no one", "a boat came in without its crew", "the reeds whisper on still nights", "who really won last year's pie contest",
  "the toll clerk can be bribed with jam", "a door in the riverbank that wasn't there last spring", "the night watch sleeps behind the chandlery", "a song that opens a lock",
  "someone's been fishing the forbidden pool", "the herb woman has a sister in Baldur's Gate", "how to get onto the island when the river's low", "nothing, and is proud of it",
] as const;

export const VOICES = [
  "slow and kind, never finishes a sentence", "fast, bright, everything's a secret", "gravelly, like a rope over stone", "sing-song, ends on a question",
  "whispers, then laughs too loud", "formal, as if reading a proclamation", "short words, long pauses", "warm, grandmotherly, calls you pet",
  "nasal and fussy", "booming, built for across the water", "dry as old bread", "excited, trips over words",
  "low and careful, checks the door", "cheerful, a bit too cheerful", "a sailor's drawl", "polite to the point of rudeness",
  "breathy, always just run here", "musical, Elvish lilt", "flat, unimpressed by anything", "creaky, like the stairs",
] as const;

export const SHOP_KINDS = [
  { kind: "tavern", owner: "innkeeper" }, { kind: "tavern", owner: "innkeeper" }, { kind: "tavern", owner: "landlady" },
  { kind: "chandlery", owner: "chandler" }, { kind: "bakery", owner: "baker" }, { kind: "tea house", owner: "tea master" },
  { kind: "bait and tackle shop", owner: "angler" }, { kind: "bookbinder's", owner: "bookbinder" }, { kind: "herbalist's", owner: "herbalist" },
  { kind: "tinker's stall", owner: "tinker" }, { kind: "boat yard", owner: "shipwright" }, { kind: "pie stall", owner: "pie seller" },
  { kind: "curiosity shop", owner: "collector" }, { kind: "weaver's", owner: "weaver" }, { kind: "smokehouse", owner: "smoker" },
  { kind: "map maker's", owner: "cartographer" }, { kind: "cobbler's", owner: "cobbler" }, { kind: "potter's", owner: "potter" },
  { kind: "lantern shop", owner: "glassblower" }, { kind: "bathhouse", owner: "attendant" },
] as const;

export const SHOP_ADJ = [
  "Sleepy", "Drowned", "Golden", "Crooked", "Merry", "Lantern", "Muddy", "Patient", "Lucky", "Second",
  "Singing", "Wandering", "Tipsy", "Copper", "Quiet", "Wet", "Brave", "Hungry", "Last", "Warm",
] as const;

export const SHOP_NOUN = [
  "Heron", "Eel", "Kettle", "Otter", "Oar", "Lamp", "Mill", "Goose", "Barrel", "Anchor",
  "Willow", "Ferry", "Trout", "Teapot", "Reed", "Candle", "Crab", "Lock", "Bell", "Duck",
] as const;

export const SHOP_DETAILS = [
  "the floor slopes so much a dropped coin rolls to the door", "a parrot takes the orders", "everything smells faintly of cinnamon",
  "the owner's children run the till", "half the stock is in a rowing boat out back", "the sign was painted by a child and nobody minds",
  "there's a fire going whatever the weather", "a notice says NO DWARVES, crossed out, with SORRY written under it", "the cat is the real owner",
  "a mural of the river covers one wall, with a door painted shut", "every chair is different", "it closes when the tide turns, whatever the hour",
  "a bell rings when anyone lies, or so they say", "the back room is always booked", "a regular snores in the corner, paid in stew",
  "the counter is an old boat hull", "they'll trade for stories", "something good is always just out of the oven",
  "a ledger of debts hangs on the wall for all to see", "a dog sleeps across the doorway and must be stepped over",
] as const;

/** "fight: X x2" lines get a Start fight button when the campaign has that monster. */
export const ENCOUNTERS = [
  "A goat has wandered onto the ferry and won't get off.", "Two fishermen argue over whose net caught a talking trout.",
  "A child runs past clutching a stolen pie, the baker in pursuit.", "Fog rolls in off the water; something splashes nearby.",
  "A peddler offers 'genuine dragon scales' (painted fish scales).", "The bridge toll has doubled; the clerk looks nervous.",
  "A rowing boat drifts past, empty, its lantern still lit.", "Street musicians need one more voice for the chorus.",
  "Rats pour out of a cellar door. fight: Giant Rat x3", "A pair of travellers with too much luggage asks for directions.",
  "A heron steals someone's lunch; they want help getting it back.", "An old soldier challenges the strongest-looking hero to arm wrestling.",
  "Wolves howl on the road out of town as dusk falls. fight: Wolf x2", "A festival-crier announces a contest with a strange prize.",
  "A cart has lost a wheel and is blocking the lane.", "Someone has painted a warning on the warehouse door in the night.",
  "A hooded figure watches from the rooftops, then is gone.", "A lost dog with a fine collar and a note tied to it.",
  "Bandits ask politely for a 'river tax'. fight: Bandit x3", "The bells ring out of time; townsfolk look to the temple.",
] as const;

export const RUMORS = [
  "The miller's wheel turns by itself on moonless nights.", "There's a smugglers' tunnel under the old customs house.",
  "The new tea house pays its staff in silver no one recognises.", "A pike as long as a boat lives under the bridge.",
  "The lighthouse keeper hasn't been seen in town for a month.", "Someone dug up the herb garden behind the temple and filled it back in.",
  "A caravan is late from Baldur's Gate, and no one will say why.", "The council is selling the common meadow.",
  "A traveller paid for a room with a pearl and left before dawn.", "The ferryman knows a way across when the river's in flood.",
  "Strange lights were seen on the marsh three nights running.", "The baker's prize recipe was stolen and sold in another town.",
  "A noble from upriver is looking for someone who fell out of favour.", "The old shrine in the woods has fresh candles every morning.",
  "Otters have been leaving coins on the jetty.", "The watch captain owes money to the wrong people.",
  "A song has been going round that no one admits to teaching.", "Someone is buying every lantern in town.",
  "A sunken barge downriver still has its cargo.", "The pie contest judge can be swayed by honey cakes.",
] as const;

export const COMPLICATIONS = [
  "It starts to pour; everyone crowds indoors.", "Someone recognises one of the heroes, and not kindly.",
  "A rival adventuring party wants the same job.", "The person they need has just left town on the ferry.",
  "A purse goes missing, and a hero is blamed.", "The bridge is closed for repairs.",
  "A festival procession blocks the street for an hour.", "A child decides to follow the party everywhere.",
  "The innkeeper has double-booked their rooms.", "A guard insists on seeing papers nobody has.",
  "The tide comes in faster than expected.", "Their contact is drunk and can't remember the password.",
  "A loose animal causes chaos at the worst moment.", "A rumour about the party is already going round town.",
  "The shop they need is shut for a funeral.", "Someone offers a better deal, but it's a trap.",
  "The lamp oil runs out at the worst moment.", "An old friend turns up needing a favour, right now.",
  "The weather turns: fog, and they lose the road.", "The town crier announces something that changes everything.",
] as const;

// ---------- results ----------

/** A rolled result: what the panel shows, edits and saves. */
export interface GenResult {
  kind: GenKind;
  /** The headline: a name, a shop's name, the encounter itself. */
  title: string;
  /** "baker's apprentice", "tavern". */
  subtitle?: string;
  /** Person details (DM-only notes when saved). */
  look?: string;
  quirk?: string;
  wants?: string;
  knows?: string;
  voice?: string;
  /** A shop's odd detail; an encounter's or rumor's extra line. */
  detail?: string;
  /** A shop's owner, saved as a linked person. */
  owner?: GenResult;
  /** Which die and table rolled it, when one did ("d20 Candlefair rumors: 14"). */
  rolled?: string;
  /** A fight to start (monster templates by id). */
  fight?: { groups: { templateId: string; count: number }[]; names: string[]; missing: string[] };
}

function nameOf(g: Pick<GameState, "tables">, rand: Rand): { name: string; rolled?: string } {
  const t = tablesOf(g).find((x) => x.kind === "name" && x.rows.length);
  if (t) {
    const r = rollTable(t, rand);
    if (r.row) return { name: r.row.text, rolled: rolledLine(t, r.roll) };
  }
  return { name: `${pick(FIRST_NAMES, rand)} ${pick(FAMILY_NAMES, rand)}` };
}

function rolledLine(t: RandomTable, roll: number): string {
  return `d${t.die} ${t.name}: ${roll}`;
}

function npc(g: Pick<GameState, "tables">, rand: Rand, role?: string): GenResult {
  const n = nameOf(g, rand);
  return {
    kind: "npc",
    title: n.name,
    subtitle: role ?? pick(ROLES, rand),
    look: pick(LOOKS, rand),
    quirk: pick(QUIRKS, rand),
    wants: pick(WANTS, rand),
    knows: pick(KNOWS, rand),
    voice: pick(VOICES, rand),
    ...(n.rolled ? { rolled: n.rolled } : {}),
  };
}

/** A fight from a "fight: X x2" line, by the campaign's monster templates. */
export function fightFrom(g: Pick<GameState, "monsters">, text: string): { text: string; fight?: GenResult["fight"] } {
  const m = /\s*\bfight:\s*(.+)$/i.exec(text);
  if (!m) return { text };
  const list = monstersOf(g);
  const groups: { templateId: string; count: number }[] = [];
  const names: string[] = [];
  const missing: string[] = [];
  for (const grp of parseFightLine(m[1])) {
    const t = templateByName(list, grp.name);
    if (t) {
      groups.push({ templateId: t.id, count: grp.count });
      names.push(`${t.name}${grp.count > 1 ? ` x${grp.count}` : ""}`);
    } else missing.push(grp.name);
  }
  return { text: text.slice(0, m.index).trim() || m[1].trim(), fight: { groups, names, missing } };
}

function fromTable(g: Pick<GameState, "monsters">, kind: GenKind, t: RandomTable | undefined, builtIn: readonly string[], rand: Rand): GenResult {
  if (t) {
    const r = rollTable(t, rand);
    if (r.row) {
      const f = fightFrom(g, r.row.text);
      return { kind, title: f.text, rolled: rolledLine(t, r.roll), ...(f.fight ? { fight: f.fight } : {}) };
    }
  }
  const f = fightFrom(g, pick(builtIn, rand));
  return { kind, title: f.text, ...(f.fight ? { fight: f.fight } : {}) };
}

/** How many of a monster for this many heroes: 1 for a boss-ish one, else around the party's size. */
function countFor(t: MonsterTemplate, heroes: number, rand: Rand): number {
  const hp = Number.parseInt(t.hp, 10);
  const dice = /(\d+)d(\d+)/.exec(t.hp);
  const avg = dice ? Number(dice[1]) * ((Number(dice[2]) + 1) / 2) : Number.isFinite(hp) ? hp : 10;
  if (avg >= 60) return 1;
  const base = avg >= 25 ? Math.ceil(heroes / 2) : heroes;
  return Math.max(1, Math.min(20, base + Math.floor(rand() * 2)));
}

/** Roll one. `place` is where the party is (for its encounter and rumor tables). */
export function generate(kind: GenKind, g: GameState, place: Entry | undefined, rand: Rand = Math.random, heroes = 4): GenResult {
  switch (kind) {
    case "name": {
      const n = nameOf(g, rand);
      return { kind, title: n.name, ...(n.rolled ? { rolled: n.rolled } : {}) };
    }
    case "npc":
      return npc(g, rand);
    case "shop": {
      const s = pick(SHOP_KINDS, rand);
      const title = `The ${pick(SHOP_ADJ, rand)} ${pick(SHOP_NOUN, rand)}`;
      return { kind, title, subtitle: s.kind, detail: pick(SHOP_DETAILS, rand), owner: npc(g, rand, s.owner) };
    }
    case "encounter":
      return fromTable(g, kind, placeTable(g, place, "encounter"), ENCOUNTERS, rand);
    case "rumor":
      return fromTable(g, kind, placeTable(g, place, "rumor"), RUMORS, rand);
    case "complication":
      return { kind, title: pick(COMPLICATIONS, rand) };
    case "monster": {
      const list = monstersOf(g);
      if (!list.length) return { kind, title: "No monsters yet", detail: "Add monster templates on the Monsters page to roll one here." };
      const t = pick(list, rand);
      const count = countFor(t, heroes, rand);
      const name = `${t.name}${count > 1 ? ` x${count}` : ""}`;
      return { kind, title: name, subtitle: `AC ${t.ac}, HP ${t.hp}`, fight: { groups: [{ templateId: t.id, count }], names: [name], missing: [] } };
    }
  }
}

/** The result as plain text, for Copy. */
export function genText(r: GenResult): string {
  const lines = [r.subtitle ? `${r.title} (${r.subtitle})` : r.title];
  if (r.look) lines.push(`Look: ${r.look}`);
  if (r.quirk) lines.push(`Quirk: ${r.quirk}`);
  if (r.wants) lines.push(`Wants: ${r.wants}`);
  if (r.knows) lines.push(`Knows: ${r.knows}`);
  if (r.voice) lines.push(`Voice: ${r.voice}`);
  if (r.detail) lines.push(r.detail);
  if (r.owner) lines.push(`Run by ${r.owner.title}, ${r.owner.subtitle}. ${r.owner.look}; ${r.owner.quirk}.`);
  if (r.fight?.missing.length) lines.push(`Not in your monsters: ${r.fight.missing.join(", ")}`);
  return lines.join("\n");
}

/** The built-in list for a table kind, to copy into the campaign's own tables. */
export function builtInRows(kind: "rumor" | "encounter" | "name"): readonly string[] {
  if (kind === "rumor") return RUMORS;
  if (kind === "encounter") return ENCOUNTERS;
  return FIRST_NAMES.map((f, i) => `${f} ${FAMILY_NAMES[i % FAMILY_NAMES.length]}`).slice(0, 20);
}
