// The whole campaign ("game") lives in one JSON document, plus an append-only ledger.
// Anything marked DM-ONLY must never reach the TV or a player: see projection.ts.

import type { DiceGroup, RollEntry } from "./dice";

import type { HandoutSheet } from "./handout";

export type SceneKind = "notice" | "portrait" | "handout" | "image" | "black" | "map" | "table" | "stinger" | "video" | "intro" | "keys";

/** Built-in art. "merchant-sigil" is DM-only and served through a gated route. */
export type BuiltinArt = "candlefair-board" | "artum-notice" | "artum" | "mags-wick" | "chef" | "merchant-sigil";

export interface Art {
  builtin?: BuiltinArt;
  /** An uploaded image (Vercel Blob or the local dev upload store). */
  url?: string;
}

export interface Scene {
  id: string;
  label: string;
  kind: SceneKind;
  /** For the quick bar and run sheets: map/<slug>, prop/<slug>. Missing on games made before assets (read with sceneSlug()). */
  slug?: string;
  /** Old fixed hotkey (0-9). Only read once, by the assets upgrade, which moves it to the quick bar. */
  hotkey?: number | null;
  /** Reveal scenes are only sent to the TV while they are live. */
  reveal: boolean;
  art?: Art;
  /** Portrait caption. */
  name?: string;
  title?: string;
  alt?: string;
  /** DM-ONLY */
  dmNote?: string;
  /** Map scenes only: the numbered locations and the TV legend. */
  map?: MapData;
  /** Portraits: the players have met this NPC (set when first shown on the TV, or by the DM). Feeds the Chronicle's tag picker.
   *  Maps: players can open it on their phones (set when first shown on the TV, or by the DM). */
  known?: boolean;
  /** When this scene was first shown on the TV. Until then its uploaded picture isn't sent to players or the TV (no pre-reveal peeking). */
  shownAt?: number;
  /** Shared world: the characters who know this portrait or map. The table sees it only if everyone present does. */
  knownBy?: string[];
  /** Handouts: words on the paper (see handout.ts). Sent out only once the handout is live. */
  sheet?: HandoutSheet;
}

/** What a pin can open from the DM view: a shop on the TV, or another scene (a portrait or a map). DM-ONLY. */
export type PinLink = { kind: "shop"; shopId: string } | { kind: "scene"; sceneId: string };

/** A numbered location on a map. */
export interface Pin {
  id: string;
  /** Lowest free number on the map when it was placed. */
  number: number;
  /** Printed in the seal, up to 4 characters. Empty means the number. */
  showsAs: string;
  name: string;
  /** Short, e.g. tavern, temple, docks, danger. */
  type: string;
  /** One or two lines players can read. */
  description: string;
  /** DM-ONLY */
  dmNotes: string;
  /** Hidden pins are DM-ONLY: they never leave the server for the TV. */
  discovered: boolean;
  /** Position as fractions (0-1) of the image's width and height. */
  x: number;
  y: number;
  /** DM-ONLY */
  link?: PinLink;
  /** Shared world: the characters who have found this pin (for pins with no Discover place). */
  knownBy?: string[];
}

export type LegendStyle = "numbers" | "names";

export interface MapData {
  pins: Pin[];
  legendOn: boolean;
  /** "numbers": seals only, players ask what's what (names aren't sent). "names": seal, name and type. */
  legendStyle: LegendStyle;
  /** Size of the dots on the map, 1 = standard (about 64px on a 1080p TV). Missing on maps made before it existed. */
  sealScale?: number;
  /** Tokens on the table: the party, monsters, anyone. Missing: none yet. */
  tokens?: MapToken[];
  /** The square grid tokens snap to. Missing: no grid. */
  grid?: MapGrid;
  /** Fog of war. Missing: never set up. */
  fog?: MapFog;
  /** Shared world: each other party's fog, kept while another party is at the table (fog is the playing party's). */
  fogBy?: Record<string, MapFog>;
}

/**
 * Fog of war: a grid of cells over the image, each covered or clear. While it's
 * on, the TV and phones never get the whole image: only the tiles that touch a
 * clear cell (see fog.ts).
 */
export interface MapFog {
  on: boolean;
  /** The first cell's top-left corner (fractions of the image; 0 or a little less, so cells line up with the grid). */
  x0: number;
  y0: number;
  /** One cell's width and height, as fractions of the image's width and height. */
  cw: number;
  ch: number;
  cols: number;
  rows: number;
  /** The image's height over its width. */
  aspect: number;
  /** Clear cells, one bit each, row by row, base64. */
  bits: string;
  /** The image cut into pieces in the DM's browser, row by row. Missing or stale (the image changed): nothing of the map is sent while fog is on. */
  tiles?: { cols: number; rows: number; urls: string[]; /** The image they were cut from. */ src: string };
}

export type TokenColor = "red" | "blue" | "green" | "gold" | "purple" | "teal" | "orange" | "grey";

/** A token on a map. Positions are the token's centre, as fractions of the image. */
export interface MapToken {
  id: string;
  kind: "player" | "monster" | "npc";
  /** Player tokens: whose. One per player per map. */
  playerId?: string;
  /** Fight tokens: the monster in the running fight. Its name and hidden state follow the fight. */
  combatantId?: string;
  /** Printed in the ring, up to 3 characters. Empty: worked out from the name. */
  label: string;
  /** What the TV calls it (monsters not from a fight, NPCs). Players use their character name. */
  name: string;
  color: TokenColor;
  x: number;
  y: number;
  /** Across, in grid squares (or standard token widths with no grid). 1 = Medium. */
  size: number;
  /** DM-ONLY while true: the token never leaves the server for the TV or phones. */
  hidden: boolean;
  /** Players can't move it from their phones. */
  locked: boolean;
  art?: Art;
}

/** A square grid laid over the map image. */
export interface MapGrid {
  /** Tokens snap to the squares' centres. */
  snap: boolean;
  /** Draw the lines on the TV and phones. */
  lines: boolean;
  /** One square's width, as a fraction of the image's width. */
  cell: number;
  /** Where a square's corner sits: fractions of the image's width (x) and height (y). */
  ox: number;
  oy: number;
  /** The image's height over its width, so squares stay square. */
  aspect: number;
}

export interface Player {
  id: string;
  /** Normalised URL name: ?player=<handle>. */
  handle: string;
  name: string;
  /** DM-ONLY: sha-256 of the player's optional key. */
  keyHash?: string;
  dndbUrl?: string;
  /** Not at the table tonight: hidden from the TV purse and skipped by "pay everyone". */
  away: boolean;
  /** Marked away, they asked the DM to mark them here (when). Cleared once the DM answers or the session ends. */
  hereAsk?: number;
  /** The DM said "not yet" to their ask (when): they can ask again a minute later. Cleared when the session ends. */
  hereNo?: number;
  archived: boolean;
  dropIn: boolean;
  balanceCp: number;
  /** Has Heroic Inspiration right now (shown on the TV purse). */
  inspired?: boolean;
  createdAt: number;
  createdVia: "url" | "dm" | "seed" | "invite";
  /** DM-ONLY */
  lastSeenAt?: number;
  /** Their character's name ("Brin Ashcombe"). Empty or missing: not chosen yet. Shared with the Chronicle. */
  character?: string;
  /** The Arrival intro: their private link and how far they've got. */
  arrival?: PlayerArrival;
  /** Hit points for the table in combat mode (D&D Beyond stays the real sheet). Missing: not set yet. */
  hp?: PlayerHp;
  /** The player's initiative bonus, typed on their phone. Added to "Roll on TV" for initiative and used to break ties. */
  initBonus?: number;
  /** Shared world: this character's own Renown rank. The table's is the best of those present. */
  renown?: number;
  /** Shared world: this character's own Renown points. Missing: their rank's threshold. */
  renownPoints?: number;
  /** Their character's level, 1-20. Missing: not set yet. */
  level?: number;
  /** The app's own character sheet (see sheet.ts). Missing: none yet (they may use D&D Beyond). Only this player and the DM see it. */
  sheet?: import("./sheet").CharacterSheet;
  /** The DM turned the app's sheet off for this player (they'd rather use D&D Beyond). Their sheet, if any, is kept but hidden. */
  sheetOff?: boolean;
  /** Per-player features the DM turned off for this player (see features.ts). Sheets use sheetOff. */
  featuresOff?: import("./features").FeatureId[];
  /** Tabs this player hid on their own phone (see features.ts). Only tidies their phone. */
  tabsHidden?: import("./features").FeatureId[];
  /** DM-ONLY, practice copies only: a stand-in for rehearsing (see practice.ts). Never in a live game. */
  standIn?: StandIn;
}

/** Numbers a practice stand-in uses that real players don't store. */
export interface StandIn {
  ac?: number;
  initBonus?: number;
}

/** A player's hit points, as they (or the DM) typed them. */
export interface PlayerHp {
  cur: number;
  max: number;
  temp: number;
  /** "Show my HP on the TV". Missing: on. */
  tv?: boolean;
}

/** A player's progress through the Arrival intro (the link texted before session 0). */
export interface PlayerArrival {
  /** The private link code: /arrive/<token>. Only the DM and the player themselves see it. */
  token: string;
  /** DM-ONLY: when the DM last copied the text with this link. */
  copiedAt?: number;
  /** DM-ONLY */
  openedAt?: number;
  /** DM-ONLY */
  finishedAt?: number;
  /** Claimed a seat at the table (possibly with no character name yet). */
  claimedAt?: number;
  /** "Why did you get on that boat?" Up to 120 characters. */
  why?: string;
  /** The starting point they picked for a first character (see starters.ts), if any. */
  pick?: string;
  /** The player's name is locked with this link: "Go to your table" signs the phone in. */
  keyed?: boolean;
}

/** Game-wide Arrival settings. */
export interface ArrivalSettings {
  /** The text the DM copies per player. {link} is replaced with their link, {name} with their player name. */
  template?: string;
  /** Once locked, players can no longer change their character name or line. */
  seatsLocked?: boolean;
  /** The place on the seat page and the TV Table ("The Flickering Candle"). Read with arrivalLook(). */
  title?: string;
  /** The ship's captain in the intro. */
  captain?: string;
  /** Play the Candlefair boat intro. Missing: on for a Candlefair campaign, off for any other. Superseded by introKind once set. */
  intro?: boolean;
  /** Which intro the link plays: none (straight to the seat page), the built-in boat, or the DM's own clip and/or slides. Read with arrivalLook(). */
  introKind?: "none" | "builtin" | "custom";
  /** The DM's own intro video or GIF. */
  clip?: IntroClip;
  /** The DM's own intro slides: a picture and a line or two each, after the clip if there is one. */
  slides?: IntroSlide[];
  /** A line at the top of the seat page ("Welcome to Saltmarsh. Take a seat."). */
  welcome?: string;
}

export interface IntroClip {
  /** /api/files/... (.mp4, .webm, .mov or .gif) */
  url: string;
  kind: "video" | "gif";
  bytes: number;
  /** How long a video runs, measured on upload. The TV intro moves on after it. */
  seconds?: number;
  /** A still of the first frame, for the link preview and while the clip loads. */
  poster?: string;
}

export interface IntroSlide {
  id: string;
  /** An uploaded picture. Missing: the line on its own. */
  image?: string;
  /** A landscape version of the picture for the TV. Missing: the TV frames the phone picture. */
  wide?: string;
  text: string;
}

/**
 * Who can see a shop. "hidden" (the default) is never sent to the TV or any
 * phone. "some" is for secret offers: only the listed players see it, and it
 * never appears on the TV.
 */
export type ShopVisibility = "hidden" | "all" | "some";

export interface Shop {
  id: string;
  name: string;
  subtitle: string;
  visibility: ShopVisibility;
  /** For visibility "some". */
  playerIds: string[];
  /** A visible but closed shop: name and tagline only, no goods ("Comes once a year."). */
  closed?: boolean;
  /** Purchases here are secret (the Peddler): never on the TV or other players' screens. */
  secretSales?: boolean;
  /** The party's Renown this storefront needs (see renown.ts). Below it: name and rank only, no goods. */
  renown?: number;
  /** Someone's goodwill it also needs (see renown.ts). */
  trust?: TrustNeed;
}

/** A lock on someone's goodwill: how that person feels about the party must be at least this. */
export interface TrustNeed {
  entryId: string;
  relation: "friendly" | "ally";
}

/**
 * - sale: buyable
 * - locked: visible with price (or ??? if hidePrice) and a reason
 * - rumored: name and price show as ???, with a one-line hint
 * - hidden: never sent to anyone but the DM
 */
export type ItemTier = "sale" | "locked" | "rumored" | "hidden";

/** What an item is for: the default shop view groups by this. */
export type ItemCategory = "gear" | "healing" | "magic" | "travel" | "services" | "building" | "trophies";

/**
 * How buying it works.
 * - purchase: pay, done
 * - recurring: priceCp per month (one month per session), charged at session end
 * - service: paid, then the DM answers (or posts the flyer)
 * - order: pay now, arrives after arrivesInSessions sessions
 * - training: priceCp in total, paid in `installments` parts, one per session
 * - project: priceCp is the goal; anyone contributes any amount
 * - earned: can't be bought; the DM grants it
 */
export type ItemKind = "purchase" | "recurring" | "service" | "order" | "training" | "project" | "earned";

/** DM-ONLY: what buying it (or funding it) does. Players only see the description. */
export type Effect =
  | { type: "unlock"; itemId?: string; shopId?: string }
  /** pct off a category or tagged items (not projects). Stacks, up to 50%. */
  | { type: "discount"; pct: number; category?: ItemCategory; tag?: string }
  /** At each session start, roll `dice` (e.g. "1d6") × unitCp and split it among the owners by share. */
  | { type: "income"; dice: string; unitCp: number }
  /** Owners may buy on credit at this item's storefront, down to −limitCp. */
  | { type: "credit"; limitCp: number };

export interface Item {
  id: string;
  shopId: string;
  name: string;
  priceCp: number;
  description: string;
  tier: ItemTier;
  /** Why it's locked ("The smith needs iron from Orlumbor"). */
  reason: string;
  /** The rumor ("They say you can still hear her singing."). */
  hint: string;
  /** Locked items only: show "??? gp". The real price is DM-ONLY. */
  hidePrice: boolean;
  /** null = no limit. Buying takes one; 0 = sold out. */
  stock: number | null;
  /** Shown when sold out ("Restocks next tenday"). */
  restockNote: string;
  /** Shown instead of the price, e.g. "Free*". */
  priceLabel?: string;
  /** Shown on the item, e.g. the Peddler's "*See fine print". */
  finePrint?: string;
  /** Pay now, arrives this many sessions later (special orders from Baldur's Gate). */
  arrivesInSessions?: number;
  /** Sold one at a time: a phone request can't ask for more than 1. */
  oneAtATime?: boolean;
  /** DM-ONLY */
  dmNote?: string;
  category: ItemCategory;
  kind: ItemKind;
  /** Training: how many parts the price is paid in. */
  installments?: number;
  /** Service or training: what the player is asked ("Name a person or place"). Required when set. */
  prompt?: string;
  /** Service: the player writes a flyer for the notice board. */
  flyer?: boolean;
  /** For discounts that target tags. */
  tags?: string[];
  /** Shows on the buyer's page once bought (trophies, titles, a house). */
  keep?: boolean;
  /** DM-ONLY */
  effects?: Effect[];
  /** The party's Renown this needs (see renown.ts). Below it, a "sale" item shows as locked with the rank. */
  renown?: number;
  /** Someone's goodwill it also needs. Without it, a "sale" item shows as locked. (null only in a patch: cleared.) */
  trust?: TrustNeed | null;  /** DM-ONLY: buying it hires this companion (Rent items: paid per session, Keep or Let go at session end). */
  companionTemplateId?: string;
}

// ---------- companions and hirelings ----------

/** Stat block fields the DM can hide from the controlling player. DM notes are never sent. */
export type CompanionField = "ac" | "hp" | "initBonus" | "speed" | "attacks" | "abilities" | "resist";

/** DM-ONLY: a companion's stat block, like a monster template. */
export interface CompanionTemplate {
  id: string;
  name: string;
  /** A portrait scene for its art. */
  sceneId?: string;
  /** A Discover person it is (Fennick). */
  entryId?: string;
  /** false: a porter or guide: no initiative, just a card with what they offer. */
  combat: boolean;
  ac: number;
  /** Max HP. */
  hp: number;
  initBonus: number;
  speed: string;
  attacks: MonsterAttack[];
  abilities: MonsterAbility[];
  resist: string;
  /** What they offer, shown to everyone ("Survival +5. Knows the safe paths."). */
  offers: string;
  /** DM-ONLY, never sent. */
  dmNote: string;
  /** Fields the controller may not see. Default: none hidden. */
  hidden: CompanionField[];
  /** The TV shows an HP bar, or only a health state (like monsters). */
  tvHealth: "hp" | "state";
  /** What 0 HP means by default. */
  atZero: "saves" | "dies";
  /** Takes a share of fight loot (friends only; hirelings never do). */
  takesShare: boolean;
  /** Only joins once this person (entryId) feels this way about the party. A warning, not a lock. */
  needs?: "friendly" | "ally";
}

/** A companion with the party (or who was). */
export interface Companion {
  id: string;
  templateId: string;
  name: string;
  hp: { cur: number; max: number; temp: number };
  /** Ability id -> uses spent, kept between fights until the DM resets them. */
  spent: Record<string, number>;
  /** Who runs them in fights: a player id, or "dm". */
  controllerId: string;
  /** In a fight, acts right after the controller instead of rolling. */
  follow?: boolean;
  /** "session": leaves when the session ends. "until": until the DM dismisses them (hirelings: until let go). */
  stay: "session" | "until";
  /** Shared world: the party they travel with. */
  partyId?: string;
  /** Hirelings: the rental that pays them, and who hired them. */
  hire?: { rentalId: string; buyerId: string };
  status: "with" | "dead" | "gone";
  /** Their loot shares, if they take one. */
  purseCp?: number;
  joinedAt: number;
  endedAt?: number;
}

/** A rented room, safekeeping, the Back Room. */
export interface Rental {
  id: string;
  itemId: string;
  itemName: string;
  playerId: string;
  monthlyCp: number;
  startedAt: number;
  /** Paid up to the end of this session number. Session end charges rentals behind it, once. */
  paidThrough: number;
  active: boolean;
  endedAt?: number;
  /** A hireling: renewed with Keep or Let go at session end, not with the other rent. */
  hire?: boolean;
  /** A room at an inn (a place entry with a room). Its history is its rentals. */
  roomId?: string;
}

/** Lessons paid for in parts, one per session. */
export interface Training {
  id: string;
  itemId: string;
  itemName: string;
  playerId: string;
  /** What they're learning (the player's answer to the prompt). */
  what: string;
  totalCp: number;
  of: number;
  paid: number;
  paidCp: number;
  /** Paid up to the end of this session number. */
  paidThrough: number;
  done: boolean;
  cancelled?: boolean;
}

/** A player's share of something: project contributions, or buying an item that has effects or is kept. */
export interface Stake {
  itemId: string;
  playerId: string;
  cp: number;
  at: number;
}

/** NPC money toward a project. */
export interface NpcStake {
  itemId: string;
  /** Who put it in, as the DM wrote it ("The town council"). */
  from: string;
  cp: number;
  at: number;
}

/** An Earned item the DM granted. */
export interface Award {
  id: string;
  itemId: string;
  itemName: string;
  playerIds: string[];
  at: number;
  note: string;
}

/** A job for the DM: record a proficiency, a project funded. DM-ONLY. */
export interface DmTask {
  id: string;
  at: number;
  text: string;
  playerId?: string;
  itemId?: string;
  done: boolean;
}

/** A player's flyer on the TV notice board. */
export interface Flyer {
  id: string;
  playerId: string;
  title: string;
  body: string;
  signedBy: string;
  postedAt: number;
  up: boolean;
  /** When it last went up on the board (orders the pins). Missing: postedAt. */
  pinnedAt?: number;
  /** The DM's choice of paper. Missing: handwriting on cream. */
  style?: Paper;
  look?: NoteLook;
  /** Where it hangs. Missing: the next free spot when it goes up. */
  place?: NotePlace;
  /** Shared world: the poster's party, when it went up. */
  partyId?: string;
  /** Gold the poster put up as the reward, taken from their purse and held until the DM pays it out or returns it. */
  rewardCp?: number;
  /** The reward went to this party (paid) or back to the poster (returned). */
  rewardDone?: { at: number; to: "party" | "poster"; partyId?: string; paidCp: number };
}

// ---------- the notice board: everything on it is a note the DM places ----------

/** Paper for any note. The first four are the job papers; a sealed envelope shows no text at all. */
export type JobStyle = "scrawl" | "bill" | "official" | "sealed" | NoticePaper;
export type NoticePaper = "cream" | "parchment" | "aged" | "white" | "ash" | "slate" | "ice" | "dark" | "red" | "handbill";
export type Paper = JobStyle;
export type PinColor = "red" | "blue" | "green" | "black" | "gold" | "cream" | "none";
/** The title's typeface. hand: the whole note is handwritten. */
export type NoteFont = "caps" | "poster" | "hand" | "plain";

/** How a note looks beyond its paper. Every field is optional: the paper has defaults. */
export interface NoteLook {
  pin?: PinColor;
  font?: NoteFont;
  align?: "left" | "center";
  /** A coloured band across the top, in the pin's colour. */
  band?: boolean;
  /** The small line above the title ("By order of the council"). */
  kicker?: string;
  /** Title size in board pixels (the board is 1920 wide). */
  titleSize?: number;
  /** The title (and kicker) in a colour instead of the paper's ink. */
  ink?: "red" | "blue" | "gold";
  /** A second line under the title ("after dark"). */
  sub?: string;
  /** "Wanted" lines, like Artum's handbill: a heading and a line each. */
  list?: { head: string; text: string }[];
  /** The word on the rule above the list. Missing: "Wanted". */
  listLabel?: string;
  /** Small print after the list ("Inquire at The Flickering Candle"). */
  footer?: string;
  /** Under the signature ("Planner of Winterfest"). */
  signNote?: string;
  /** An uploaded picture, at the top of the note. */
  image?: string;
}

/** Where a note hangs on the 1920x1080 board: its top-left corner, tilt, width and stacking. */
export interface NotePlace {
  x: number;
  y: number;
  /** Degrees. */
  rot: number;
  w: number;
  /** Higher sits on top. */
  z: number;
}

/** A plain note on the board: the DM's to write, place, take down or throw away. */
export interface Notice {
  id: string;
  /** For run sheets and the storyboard: @flyer/<slug>. */
  slug: string;
  style: Paper;
  title: string;
  body: string;
  sign: string;
  look: NoteLook;
  /** On the board. false: in the drawer, which never leaves the DM's screen. */
  up: boolean;
  place: NotePlace;
  createdAt: number;
  /** DM-ONLY */
  dmNote: string;
  /** DM-ONLY: drafted by a Worldbuilder key. */
  madeBy?: MadeBy;
}

// ---------- the bounty board ----------
export type JobStatus = "open" | "taken" | "done" | "expired";

export interface JobReward {
  /** each: per player; total: for the party; hidden: not shown. */
  kind: "each" | "total" | "hidden";
  cp: number;
}

/** A job flyer on the bounty board. */
export interface Job {
  id: string;
  title: string;
  postedBy: string;
  body: string;
  reward: JobReward;
  /** The party's Renown needed to take it (0 = Strangers). */
  renown: number;
  /** Renown points the party gets when it's done (the DM can change it on the Done screen). Missing: 1. */
  renownPoints?: number;
  style: JobStyle;
  status: JobStatus;
  /** On the TV's notice board (and so on phones). */
  pinned: boolean;
  pinnedAt?: number;
  createdAt: number;
  /** Who asked to take it. */
  takenBy?: string[];
  takenAt?: number;
  doneAt?: number;
  /** What was paid out in all. */
  paidCp?: number;
  /** The flyer this one follows up. */
  followUpOf?: string;
  /** DM-ONLY: never sent to the TV or a phone. */
  dm: JobDmNotes;
  /** Someone's goodwill it also needs before the party can take it. (null only in a patch: cleared.) */
  trust?: TrustNeed | null;
  look?: NoteLook;
  /** Where it hangs. Missing: the next free spot when it goes up. */
  place?: NotePlace;
  /** Shared world: only these parties see it. Missing or empty: every party. */
  parties?: string[];
  /** Shared world: the party that took (and did) it. */
  partyId?: string;
  /** DM-ONLY: drafted by a Worldbuilder key. */
  madeBy?: MadeBy;
}

/** DM-ONLY */
export interface JobDmNotes {
  adventure: string;
  loot: string;
  twists: string;
  notes: string;
}

export interface FlyerText {
  title: string;
  body: string;
  signedBy: string;
}

export type RequestStatus = "pending" | "approved" | "declined" | "cancelled";

/**
 * A player's request from their phone: buy something, or send gold to another
 * player. While pending it holds the gold (and the stock), so nobody can
 * request more than they have or claim an item someone else is waiting on.
 */
export interface TradeRequest {
  id: string;
  kind: "buy" | "give" | "contribute" | "job";
  playerId: string;
  playerName: string;
  at: number;
  status: RequestStatus;
  /** What it holds while pending: price × quantity, or the gold being sent. */
  totalCp: number;
  /** The player's note to the DM ("for the bard"). */
  note: string;
  /** Bought from a secret shop (the Peddler): never shown on the TV or to other players. */
  secret: boolean;
  // buy
  itemId?: string;
  itemName?: string;
  shopId?: string;
  qty: number;
  unitCp: number;
  // give
  toPlayerId?: string;
  toPlayerName?: string;
  // decided
  decidedAt?: number;
  /** Decline reason the player sees. */
  reason?: string;
  /** The DM took it off the player's shop history (it stays in the DM's). */
  hidden?: boolean;
  /** The DM reopened it after declining it by mistake. */
  reopenedAt?: number;
  /** What was actually charged (differs from totalCp after haggling). */
  chargedCp?: number;
  /** Service or training: the player's answer to the item's prompt. */
  question?: string;
  /** Service: the DM's answer the player sees. */
  answer?: string;
  /** "Post on the notice board": the flyer as written (or as the DM edited it). */
  flyer?: FlyerText;
  /** Gold the player puts up as the flyer's reward (held with the request, then taken when it's approved). */
  rewardCp?: number;
  // job: "Take this job"
  jobId?: string;
  jobTitle?: string;
}

/** A special order: paid for, on its way. */
export interface Order {
  id: string;
  playerId: string;
  itemId: string;
  itemName: string;
  priceCp: number;
  orderedAt: number;
  /** Arrives when a session with this number (or higher) starts. */
  arrivesAtSession: number;
  arrived: boolean;
}

/** A short TV banner: "New at the Smithy." */
export interface Banner {
  id: string;
  text: string;
  at: number;
}

export interface Session {
  id: string;
  number: number;
  title: string;
  startedAt: number;
  endedAt: number | null;
  attendeeIds: string[];
  /** DM-ONLY (milestone 5) */
  dmNotes?: string;
  /** DM-ONLY: the run-game run sheet for this session, if it was run from an episode. */
  run?: SessionRun;
  /** Written at the end of the session. Reaches the TV while shown as "Previously on…", and players in the Chronicle once the session has ended. */
  recap?: string;
  /** The Chronicle's note-taker for this session: their notes get a quill. */
  noteTakerId?: string;
  /** DM-ONLY: what happened when it started (orders arrived, income paid). */
  startLog?: string[];
  /** Rent and lessons were charged at this session's end. */
  duesCharged?: boolean;
  /** Shared world: the party that played it. */
  partyId?: string;
  /** The "Last time on…" card for players' devices: the DM's draft, and what was sent. */
  playerRecap?: PlayerRecap;
}

/** Players only ever get `sent`, and only once the session has ended. The draft is DM-only. */
export interface PlayerRecap {
  text: string;
  /** Chronicle notes from that chapter to show under it (only while they stay visible). */
  noteIds: string[];
  /** Send it by itself when the session ends. */
  onEnd?: boolean;
  /** What players got. n changes on every send, so their devices pop it up again. */
  sent?: { text: string; noteIds: string[]; at: number; n: number };
}

// ---------- the Chronicle (the table's shared story notes) ----------

/** The author id the DM writes notes under. */
export const DM_AUTHOR = "dm";

export interface Note {
  id: string;
  /** The chapter (session) it belongs to. null: the next chapter, which takes it in when that session starts. */
  sessionId: string | null;
  /** A player id, or DM_AUTHOR. */
  authorId: string;
  /** Their character (or player) name when they wrote it, for after they've left. */
  authorName: string;
  text: string;
  tags: string[];
  starred?: boolean;
  /** Hidden by the DM: never sent to the TV or any phone, including the author's. */
  hidden?: boolean;
  createdAt: number;
  editedAt?: number;
  /** Shared world: the party whose next chapter it waits for (sessionId null). */
  partyId?: string;
  /** Shared world: news for every party (shown in every party's Chronicle). */
  world?: boolean;
}

// ---------- Discovery: people, places, shops, monsters, mysteries ----------

/** What an entry is. Plain text, so a new kind needs no schema change. */
export type EntryKind = "person" | "place" | "shop" | "monster" | "mystery" | "faction" | (string & {});

/**
 * - hidden: DM-ONLY, never sent or counted (unless an area shows totals)
 * - rumored: a silhouette, the nickname or "???", and the hint
 * - found: met / visited / open / encountered / found: name, image, summary
 * - known: found, plus the facts the DM has revealed
 */
export type Stage = "hidden" | "rumored" | "found" | "known";

/** How a person feels about the party: a band on the attitude dial (see attitude.ts). */
export type Relation = "hostile" | "wary" | "stranger" | "friendly" | "ally";

/** DM-ONLY: one move on a person's attitude dial, and why. */
export interface AttitudeShift {
  id: string;
  at: number;
  /** How far the dial actually moved (after the ends of the dial). */
  delta: number;
  /** "Paid off her debt". Players may see it (see AttitudeSettings.show) unless secret. */
  reason: string;
  /** Only these characters' standing moved. Missing: the whole party's. */
  playerIds?: string[];
  sessionId?: string | null;
  /** dm: the DM's +/-; set: the DM picked a band; job: a job done for them; beat: a run sheet button. */
  source: "dm" | "set" | "job" | "beat";
  /** The band before and after (the party's, or the first character's). */
  from: Relation;
  to: Relation;
  /** Players never see the reason. */
  secret?: true;
}

/** How the attitude tracker works in this campaign. Missing: the defaults in attitude.ts. */
export interface AttitudeSettings {
  /** What phones show: nothing, the band ("Friendly"), the dial too, or the dial and the reasons. */
  show: "none" | "band" | "dial" | "reasons";
  /** A move that changes someone's band banners on the TV (the DM can still pick per move). */
  tv: boolean;
  /** Points a job done for someone moves their dial (0: off). */
  jobs: number;
}

export interface EntryFact {
  id: string;
  /** For the run sheet: "fact: person/mags/owes-the-baker". */
  slug: string;
  text: string;
  /** Players know it. Unrevealed facts are DM-ONLY. */
  revealedAt?: number;
  /** The session it was learned in. */
  learnedIn?: string | null;
  /** Shared world: who knows it, and when they learned it. */
  knownBy?: Record<string, number>;
  /** DM-ONLY: drafted by a Worldbuilder key. */
  madeBy?: MadeBy;
}

export interface Entry {
  id: string;
  kind: EntryKind;
  /** Unique per kind; run sheet refs are kind/slug ("person/fennick"). */
  slug: string;
  stage: Stage;
  /** The stage a fresh start goes back to. Missing: hidden. */
  start?: Stage;
  /** The real name. DM-ONLY until the entry is found. */
  name: string;
  /** "Keeper of the Flickering Candle". Players see it once found. */
  title: string;
  /** A line or two. Players see it once found. */
  summary: string;
  /** What players call it while it's a rumor ("The man with the lantern"). Empty: "???". */
  nickname: string;
  /** The one line players get while it's a rumor. */
  hint: string;
  /** A portrait scene: its art is theirs, and showing it on the TV finds them. */
  sceneId?: string;
  /** An uploaded silhouette for the rumor stage. Missing: the kind's generic one. */
  silhouette?: string;
  /** Places: its pin on a map. Hidden: the pin is hidden; rumored: a "?" seal with the hint; found: the pin as it is. DM-ONLY. */
  pin?: { sceneId: string; pinId: string };
  /** Shops: its storefront. Found opens it to everyone; back to hidden or rumored hides it. DM-ONLY. */
  shopId?: string;
  /** Monsters: the template it came from. DM-ONLY. */
  templateId?: string;
  /** Areas it belongs to ("Candlefair", "The Docks"). */
  areas: string[];
  /** Other entries it's tied to. Players see a link only when both ends are visible to them. */
  links: string[];
  /** Key facts, in the DM's order. */
  facts: EntryFact[];
  /** People: how they feel about the party, as a band. Kept in step with attitude. Missing: stranger. */
  relation?: Relation;
  /** People: how they feel about one player, where it differs. Kept in step with attitudeBy. */
  relationBy?: Record<string, Relation>;
  /** People: the party's place on the attitude dial, -10 to 10. Missing: the middle of relation's band. */
  attitude?: number;
  /** People: each character's own standing, on top of the party's (+2: likes them a little more). */
  attitudeBy?: Record<string, number>;
  /** People, DM-ONLY: every move on the dial, oldest first (capped). */
  attitudeLog?: AttitudeShift[];
  /** Shared world: how far each character has got with it. Missing: hidden. stage is the table's (everyone present). */
  knownBy?: Record<string, Stage>;
  /** When its stage last changed. */
  stagedAt?: number;
  /** When it was found, and in which session. */
  foundAt?: number;
  foundIn?: string | null;
  /** DM-ONLY */
  dmNote: string;
  /** DM-ONLY */
  secrets: string;
  /** People, DM-ONLY: what they want. */
  wants?: string;
  /** People, DM-ONLY: what they know. */
  knows?: string;
  /** People, DM-ONLY: how they sound ("slow, kind, never finishes a sentence"). */
  voice?: string;
  /** People, DM-ONLY: what you notice first. */
  look?: string;
  /** People, DM-ONLY: a habit or tic to play. */
  quirk?: string;
  /** DM-ONLY: drafted by a Worldbuilder key. */
  madeBy?: MadeBy;
  /** Places: what the off-script kit uses while the party is here. DM-ONLY. */
  place?: PlaceSetup;
  /** DM-ONLY: made up during play (the off-script kit), from a quick note, or seeded. */
  origin?: "improvised" | "capture" | "seed";
  /** DM-ONLY: needs the DM's review. When and where it was made. */
  review?: { at: number; sessionId: string | null; placeId?: string };
  /** Places: a room at an inn, with its key on the rack (see rooms.ts). Players see it once the room is found. */
  room?: RoomInfo;
}

/** guest: rentable, two beds. good: the Good Room, earned. staff: on the rack but never rented. */
export type RoomType = "guest" | "good" | "staff";

/** A room's own fields. Its story hook is the entry's secrets and the innkeeper's line its dmNote, both DM-ONLY. */
export interface RoomInfo {
  /** Its hook on the key rack, 1-12. */
  hook: number;
  type: RoomType;
  /** The physical key ("the seahorse key"). */
  key: string;
  /** The key is gone: an empty hook with no label. */
  keyMissing?: boolean;
  /** What living here gets you. */
  perk: string;
  /** The line on its paper tag ("Bucket provided."). */
  tag?: string;
  /** Rent per month (one session) in cp. Missing: the inn's rent. */
  rentCp?: number;
  /** Beds. Missing: 2. */
  beds?: number;
  /** A reminder at each session start for whoever lives here. */
  startPerk?: "inspiration" | "rumor";
}

/** DM-ONLY: how rooms are rented in this campaign. */
export interface RoomSettings {
  /** Rent per month (one session), in cp. Default 3 gp. */
  rentCp: number;
  /** A character's first room is free for its first month. */
  firstFree: boolean;
  /** The Good Room: earned with Renown (rank, at the normal rent) or open to anyone at a higher rent. */
  good: { mode: "renown" | "rent"; rank: number; rentCp: number };
  /** Old register lines, written by hand (the nameless guest). Newest first. */
  register: string[];
}

/** DM-ONLY: a "because of your room" moment that happened. */
export interface RoomMoment {
  id: string;
  playerId: string;
  roomId: string;
  sessionId: string | null;
  at: number;
  note?: string;
}

/** DM-ONLY: a place's off-script settings. */
export interface PlaceSetup {
  /** The TV scene to suggest when the party gets here: a show ref ("ambient/river-dusk", "map/candlefair/3"). */
  scene?: string;
  /** Its caption on the TV, for an ambient scene ("The coast road, dusk."). */
  caption?: string;
  /** The random table to roll encounters on here (a RandomTable id). */
  encounters?: string;
  /** The random table to roll rumors on here. */
  rumors?: string;
}

// ---------- off-script: where the party is, clues, quick notes (all DM-ONLY) ----------

/** Where the party is now: a place entry. */
export interface Here {
  placeId: string;
  since: number;
}

export type ClueStatus = "ready" | "delivered" | "dropped";

/** A secret or clue not tied to a scene, delivered wherever the party ends up. */
export interface Clue {
  id: string;
  text: string;
  /** The episode it's written for. null: the campaign's clue pool. */
  episodeId: string | null;
  /** Delivering it reveals this fact. */
  fact?: { entryId: string; factId: string };
  /** Or moves this mystery (or any entry) one stage forward. */
  entryId?: string;
  /** What it's about: entry ids (people, places) and story thread ids. */
  tags: string[];
  /** Delivering it marks this story beat Played. */
  storyBeatId?: string;
  status: ClueStatus;
  delivered?: { at: number; sessionId: string | null; placeId?: string; viaId?: string; partyId?: string };
  createdAt: number;
}

export type CaptureStatus = "open" | "made" | "dismissed";

/** A quick note the DM jotted during play, to turn into something after. */
export interface Capture {
  id: string;
  text: string;
  at: number;
  sessionId: string | null;
  placeId?: string;
  partyId?: string;
  status: CaptureStatus;
  /** What it became: "person/old-tam", "fact:<entryId>/<factId>", "beat:<id>", "job:<id>". */
  made?: string;
}

// ---------- leads and votes ----------

export type LeadStatus = "open" | "followed" | "closed";

export interface Lead {
  id: string;
  /** "Who's buying all the lantern oil?" */
  text: string;
  /** Players see it. Unshown leads are the DM's drafts. */
  shown: boolean;
  status: LeadStatus;
  /** What it's about (any entry). Players see the lead only once that entry isn't hidden. */
  entryId?: string;
  /** Where it points (a place entry). The TV and phones group leads by it. */
  placeId?: string;
  /** Its job flyer, shown once the flyer is on the board. */
  jobId?: string;
  createdAt: number;
  /** DM-ONLY */
  dmNote: string;
  /** Shared world: the party it belongs to. Missing: every party. */
  partyId?: string;
}

export interface Vote {
  id: string;
  /** Shared world: the party voting. */
  partyId?: string;
  /** 2 or 3 leads. */
  leadIds: string[];
  openedAt: number;
  /** Closes by itself at this time (checked on the next command). */
  closesAt?: number;
  /** One per player, by player id. Changeable until it closes. */
  ballots: Record<string, string>;
  closedAt?: number;
  winnerId?: string;
  /** A tie, for the DM to break. */
  tied?: string[];
  /** The "You chose" card has played at a session start. */
  played?: boolean;
}

// ---------- run-game (all DM-ONLY) ----------

export type BeatAction =
  | { type: "scene"; sceneId: string }
  /** "sound: tavern": crossfade the TV's soundboard to that mix (a mix id, "layer/<id>", or "off"). tap: only when the DM taps it ("sound: storm (tap)"). */
  | { type: "sound"; mix: string; tap?: boolean }
  /** "sfx: sword-clash": play that one-shot on the TV. tap: a button on the beat instead of playing on landing ("sfx: roar (tap)"). */
  | { type: "sfx"; id: string; tap?: boolean }
  | { type: "black" }
  | { type: "bank" }
  | { type: "stinger" }
  /** "fight: Goblin x2": set up a fight with these monster templates, matched by name when it fires. */
  | { type: "fight"; monsters: FightGroup[] }
  /** "reveal: person/fennick [known]" or "rumor: place/lathtarls-lantern": move a Discovery entry forward (never back), on the TV. */
  | { type: "reveal"; ref: string; stage: Stage }
  /** "fact: person/mags/owes-the-baker": reveal that fact, on the TV. */
  | { type: "fact"; ref: string }
  /** "show: person/mags", "show: map/candlefair/3", "show: prop/the-symbol": put that on the TV (see assets.ts). */
  | { type: "show"; ref: string }
  /** "mood: person/mags +2 Saved her cat": a button on the beat that moves their attitude dial (never on its own). */
  | { type: "mood"; ref: string; delta: number; reason: string };

/** Some monsters from one template: "Goblin x2". */
export interface FightGroup {
  name: string;
  count: number;
}

export interface BeatCheck {
  /** "Strength (Athletics)", "Dexterity saving throw", "... or ...". */
  skill: string;
  dc: number;
  /** Who/what the check is for. */
  what: string;
  fail?: string;
  success?: string;
}

export interface BeatBranch {
  when: string;
  then: string;
}

export interface Beat {
  id: string;
  title: string;
  /** Paragraphs to read aloud. */
  readAloud?: string[];
  /** Where the read-aloud box sits among the notes (0 = before the first note). */
  readAloudAt?: number;
  notes: string[];
  checks: BeatCheck[];
  branches: BeatBranch[];
  /** Fired on landing by Next or a jump, never by Back. */
  actions: BeatAction[];
  /** Suggested shows the DM said no to, so they don't come back. */
  dismissed?: string[];
  /** DM-ONLY: story beats placed here (see story.ts). Written "story: sb-id — Title" in the run sheet. */
  stories?: StoryBlock[];
}

/** A story beat placed in a run-sheet beat. Ticking it in run-game mode marks the story beat Played. */
export interface StoryBlock {
  storyBeatId: string;
  /** Ticked: when, and in which session. */
  done?: { at: number; sessionId: string | null };
}

export interface Episode {
  id: string;
  title: string;
  beats: Beat[];
  /** DM-ONLY: prep checklist items ticked off or dismissed, by item key. */
  prep?: Record<string, "done" | "dismissed">;
  /** DM-ONLY: the DM's own prep checklist items (practice notes land here), keyed "note:<id>" in prep. */
  prepNotes?: PrepNote[];
}

export interface PrepNote {
  id: string;
  text: string;
  at: number;
}

export interface SessionRun {
  episodeId: string;
  /** "start": attendance and "Previously on…"; "beat": beats[beat]; "end": payday and recap. */
  stage: "start" | "beat" | "end";
  /** The current beat, or on the start screen, the beat Next goes to. */
  beat: number;
  /** Quick notes by beat id. */
  notes: Record<string, string>;
}

export interface Knock {
  id: string;
  handle: string;
  /** The name as they typed it ("Sam", not "sam"). Older knocks have none. */
  name?: string;
  at: number;
}

export interface LiveState {
  sceneId: string;
  shopOpen: boolean;
  shopId: string;
  purseVisible: boolean;
  /** The session whose recap is on the TV as "Previously on…". Cleared by any scene or shop change. */
  recapSessionId?: string;
  /** Starred Chronicle notes shown under that recap. Only read while recapSessionId is set. */
  recapNoteIds?: string[];
  /** The pin the TV is zoomed toward on the live map. n changes each time, so the TV restarts the pulse. */
  focus?: { pinId: string; n: number };
  /** The last "Discovered: …" banner on the live map. The TV shows it when n changes. */
  banner?: { pinId: string; n: number };
  /** The TV shop shows this category instead of a storefront. */
  shopCategory?: ItemCategory;
  /** The leads board is up on the TV, over the scene. */
  leads?: boolean;
  /** One note from the notice board, up close over the board. Cleared by any scene change. */
  note?: { kind: "notice" | "job" | "flyer"; id: string };
  /** An ambient scene over the stage (see ambient.ts), with an optional caption. Cleared by any scene change. */
  ambient?: { id: string; caption?: string };
  /** The Arrival intro on the TV: which step it's on, since when (it moves on by itself unless paused). Read while the intro scene is live. */
  intro?: { step: number; at: number; paused?: boolean; n: number };
}

export type TvDiceRoll = { n: number; at: number; groups: DiceGroup[]; plus: number; total: number; /** Set when a player rolled. */ name?: string; /** What the roll was for. */ for?: "initiative"; keep?: "high" | "low"; label?: string };

export interface GameState {
  schema: 2;
  /** DM-ONLY: room rent and the Good Room's lock (missing: the defaults, see rooms.ts). */
  rooms?: RoomSettings;
  /** DM-ONLY: room moments, oldest first. */
  roomMoments?: RoomMoment[];
  id: string;
  name: string;
  createdAt: number;
  live: LiveState;
  /** When true, unknown ?player= names knock instead of being created. */
  doorClosed: boolean;
  /** The campaign's D&D Beyond game link (the "Launch VTT" button). */
  vttUrl?: string;
  /** Seats at the table. Once this many players (not counting those who left) exist, new names knock. Default 6. */
  maxPlayers?: number;
  players: Player[];
  scenes: Scene[];
  shops: Shop[];
  items: Item[];
  sessions: Session[];
  /** DM-ONLY: run sheets. Missing on games made before run-game mode; read with episodesOf(). */
  episodes?: Episode[];
  currentSessionId: string | null;
  knocks: Knock[];
  /** Special orders, newest last. */
  orders: Order[];
  /** The latest TV banner; the TV shows it briefly when it changes. */
  banner: Banner | null;
  /** Purchase and gold-transfer requests from phones, oldest first. */
  requests: TradeRequest[];
  /** "Mira bought a Shield." on the TV when a request is approved. undefined = on. */
  tvPurchases?: boolean;
  rentals: Rental[];
  trainings: Training[];
  stakes: Stake[];
  /** Money the DM put toward projects from NPCs (a patron, the town council). Counts toward the goal; earns no share. */
  npcStakes?: NpcStake[];
  /** Items whose effects have applied (bought, or funded for projects), with when. */
  effectsOn: Record<string, number>;
  awards: Award[];
  tasks: DmTask[];
  flyers: Flyer[];
  /** The bounty board's job flyers. Missing on games made before it; read with jobsOf(). */
  jobs?: Job[];
  /** The Discover entry (usually a place, "Notice board") the party must find before jobs show on phones and the TV. Missing: jobs always show. */
  jobsGate?: string;
  /** How the NPC attitude tracker works. Missing: the defaults. */
  attitudes?: AttitudeSettings;
  /** Plain notes on the notice board. Missing on games made before free placement; read with noticesOf(). */
  notices?: Notice[];
  /** The Renown plaque on the board's frame. Missing: shown. */
  plaqueHidden?: boolean;
  /** The party's Renown rank, 0 = Strangers. Missing: 0. */
  renown?: number;
  /** DM-ONLY: the party's hidden running total of Renown points. Missing: the current rank's threshold. Read with pointsOf(). */
  renownPoints?: number;
  /** DM-ONLY: every change to the Renown points, oldest first (capped). */
  renownLog?: RenownChange[];
  /** Phones show the party's progress toward the next rank. Missing: off. */
  renownProgress?: boolean;
  /** The last time Renown went up: the TV plays the moment when n changes. */
  renownMoment?: { rank: number; n: number; at: number };
  /** The party levelled up: the TV moment, and each phone's "You're level 3!". */
  levelMoment?: { n: number; at: number; levels: { playerId: string; level: number }[] };
  /** The last dice roll on the TV (the DM's or a player's): the TV plays it when n changes. Secret and DM-only rolls never get here. */
  diceRoll?: TvDiceRoll;
  /**
   * The last few rolls on the TV, oldest first (diceRoll is the newest of them). When several land
   * at once (everyone rolling initiative), the TV gets them all, even if its updates arrive batched.
   */
  tvRolls?: TvDiceRoll[];
  /** DM-ONLY: every roll, the DM's and the players', newest last (capped). Players see only their own. */
  rolls?: RollEntry[];
  /** The soundboard: what the TV plays (see sound.ts). Missing: nothing chosen, auto cues on. */
  sound?: SoundState;
  /** The Arrival intro's settings. Missing on games made before it. */
  arrival?: ArrivalSettings;
  /** The Chronicle's notes, oldest first. Missing on games made before it; read with notesOf(). */
  notes?: Note[];
  /** Discovery entries (people, places, ...), in the DM's order. Missing on games made before it; read with entriesOf(). */
  entries?: Entry[];
  /** The last reveal the TV should play. n changes each time. from: the stage it moved from. */
  discovery?: { entryId: string; n: number; factId?: string; from?: Stage; at: number };
  /** Discovery counters show how much is left to find per area (empty slots), hidden entries included. */
  discoveryTotals?: boolean;
  /** The end-of-session recap card on the TV ("Tonight you met…"). n changes each time. */
  recapCard?: { n: number; at: number; text: string };
  /** Threads the party can pull on. */
  leads?: Lead[];
  /** The party's vote on what to follow next. One at a time. */
  vote?: Vote;
  /** "You chose: …" on the TV at the start of a session. n changes each time. */
  chosen?: { leadId: string; n: number; at: number };
  /** DM-ONLY: monster templates for combat mode. Missing on games made before it; read with monstersOf(). */
  monsters?: MonsterTemplate[];
  /** The fight in progress, if any. Only fightView() projections of it ever leave the server for the TV or a phone. */
  fight?: Fight;
  /** DM-ONLY: past fights, newest last (summaries only). */
  fights?: FightSummary[];
  /** DM-ONLY: the quick bar. Index = number key (quick[1] is key 1, quick[0] key 0). Missing: read with quickOf(). */
  quick?: (string | null)[];
  /** DM-ONLY: the last few things shown on the TV, newest first. */
  recent?: string[];
  /** DM-ONLY: where this campaign started (blank, Candlefair or a saved preset). Missing: Candlefair. Read with originOf(). */
  origin?: import("./presets").Origin;
  /** The town the shop and the players' phones name. Missing: Candlefair. "" on a blank campaign until the DM names it. Read with townOf(). */
  town?: string;
  /** The DM's own wording for the five Renown ranks (blank fields keep the default). Read with ranksOf(). */
  renownRanks?: Partial<{ name: string; meaning: string; pay: string; raised: string; points: number }>[];
  /** One-time content upgrades already applied to this game (see migrate.ts), so a later delete sticks. */
  upgrades?: string[];
  /** DM-ONLY: the storyboard (threads, story beats, planned session dates). Never copied into a TV or player view. Read with storyOf(). */
  story?: Story;
  /** The shared world: several parties in one campaign. Missing: one table, as before. Read with worldOn(). */
  world?: WorldSettings;
  /** Shared world: the parties playing in it. */
  parties?: Party[];
  /** Shared world: the party at the table now (whose session runs, whose fog the maps show). */
  partyId?: string;
  /** DM-ONLY: companion and hireling stat blocks (see companions.ts). */
  companionTemplates?: CompanionTemplate[];
  /** Companions travelling with the party (and those who left or died, for the record). Players see only the allowed parts. */
  companions?: Companion[];
  /** DM-ONLY: set only in a practice copy (see practice.ts). A live game never has it. */
  practice?: PracticeInfo;
  /** DM-ONLY: random tables (rumors, encounters, names, weather). Read with tablesOf(). */
  tables?: RandomTable[];
  /** DM-ONLY: the Worldbuilder style guide (tone and rules Claude must follow). Read-only to builder keys. */
  builderNotes?: string;
  /** Features the DM turned off for the whole table (see features.ts). Missing: every feature on. */
  featuresOff?: import("./features").FeatureId[];
  /** Tabs that wait on phones until there's something in them (see UNLOCKABLE in features.ts). Missing: all show from the start. */
  unlockAsFound?: import("./features").UnlockId[];
  /** DM-ONLY: where the party is now (one table). In a shared world each Party has its own. Read with hereOf(). */
  here?: Here;
  /** DM-ONLY: portable clues, per episode and in the campaign pool. Read with cluesOf(). */
  clues?: Clue[];
  /** DM-ONLY: quick notes from play. Read with capturesOf(). */
  captures?: Capture[];
  /** Session invites: one link per game night, seats claimed first come first served. Read with invitesOf(). Players and the TV never get these; an invite's own page gets a cut-down copy (see invites.ts). */
  invites?: Invite[];
  seq: number;
}

/** One timed stretch of a rehearsal: a run-sheet beat or a fight. */
export interface PracticeSegment {
  /** "beat:<id>", "fight:<id>", "start", "end". */
  key: string;
  label: string;
  ms: number;
}

/** DM-ONLY: what a practice copy knows about the rehearsal. */
export interface PracticeInfo {
  startedAt: number;
  /** The episode being rehearsed, if any. */
  episodeId?: string;
  /** Practice notes, one per line. They go to the episode's prep checklist at the end. */
  notes: string;
  /** Real session estimate = practice time x this. */
  factor: number;
  /** Time away from the screen (tab hidden for a while), not counted. */
  awayMs: number;
  /** Time per beat and fight, in the order first reached. */
  segments: PracticeSegment[];
  /** What's being timed right now. */
  open: { key: string; label: string; since: number } | null;
}

/** DM-ONLY: content a Worldbuilder key drafted and the DM approved. Never sent to the TV or a phone. */
export interface MadeBy {
  /** The key's label ("Claude Desktop laptop"). */
  label: string;
  /** When it was approved. */
  at: number;
  /** The draft it came from (so an approve can't run twice). */
  draft: string;
}

// ---------- random tables (DM-only) ----------

export type TableDie = 4 | 6 | 8 | 10 | 12 | 20 | 100;
export type TableKind = "rumor" | "encounter" | "name" | "weather" | "other";

export interface TableRow {
  /** The lowest roll for this row, 1-based. */
  from: number;
  /** The highest roll, inclusive. */
  to: number;
  text: string;
}

export interface RandomTable {
  id: string;
  name: string;
  die: TableDie;
  kind: TableKind;
  /** Every number 1..die is in exactly one row. */
  rows: TableRow[];
  areas: string[];
  dmNote: string;
  createdAt: number;
  madeBy?: MadeBy;
  /** DM-ONLY: came with the campaign (the off-script kit's starter tables). */
  origin?: "seed";
  /** DM-ONLY: needs the DM's review. */
  review?: { at: number; sessionId: string | null; placeId?: string };
}

// ---------- the shared world (several parties in one campaign) ----------

export interface Party {
  id: string;
  name: string;
  color: string;
  /** Its characters (player ids). A character can be in several parties. */
  memberIds: string[];
  createdAt: number;
  /** DM-ONLY: where this party is now. */
  here?: Here;
}

/** A dated event everyone in the world lives through ("Winterfest"). Days are YYYY-MM-DD. */
export interface WorldEvent {
  id: string;
  name: string;
  from: string;
  to: string;
  /** One line players read. */
  note: string;
}

export interface WorldSettings {
  /** When the campaign became a shared world (the second party was made). */
  since: number;
  /** Today in the world. Missing: no clock. */
  date?: string;
  events?: WorldEvent[];
  /** The last world news or event moment on the TV and phones: plays when n changes. */
  news?: { n: number; at: number; text: string };
}

/** DM-ONLY: one change to the party's Renown points. */
export interface RenownChange {
  id: string;
  at: number;
  /** job: a job flyer marked done; award: the DM's award; set: the DM set the rank by hand. */
  source: "job" | "award" | "set";
  /** The job's title (for source job). */
  label?: string;
  jobId?: string;
  /** Signed. */
  amount: number;
  reason: string;
  /** The chapter (session number) running then, if any. */
  chapter?: number;
  /** The points after it. */
  total: number;
  rankFrom: number;
  rankTo: number;
  /** When the DM last fixed its points or reason. */
  edited?: number;
  /** Shared world: the party at the table, and who was there (they all got it). */
  partyId?: string;
  playerIds?: string[];
}

export type LedgerKind = "grant" | "charge" | "purchase" | "payAll" | "transfer" | "rent" | "contribution" | "income" | "bounty" | "loot";

export interface LedgerEntry {
  id: string;
  at: number;
  playerId: string;
  /** Player name at the time, so history reads well after renames. */
  playerName: string;
  amountCp: number; // signed
  note: string;
  kind: LedgerKind;
  sessionId: string | null;
  itemId?: string;
  batchId?: string;
  /** Approved at a different price: the price before haggling. */
  listCp?: number;
  /** The phone request this came from. */
  requestId?: string;
}

export type Role = "dm" | "tv" | "player";

export type Actor =
  | { role: "dm" }
  | { role: "tv" }
  | { role: "player"; playerId: string }
  /** The server itself (joins, hellos, knocks). Never derived from a request. */
  | { role: "system" };

// ---------- combat mode ----------

export interface MonsterAttack {
  name: string;
  /** To-hit bonus. */
  bonus: number;
  /** "1d4 + 3". */
  damage: string;
}

export interface MonsterAbility {
  id: string;
  name: string;
  /** Rules text, short. For an on-death ability this is the reminder ("DC 11 Dex, 2d6, 5 ft."). */
  text: string;
  /** Recharges on a d6 roll of this or higher: 6 = "Recharge 6", 5 = "Recharge 5–6". */
  recharge?: number;
  /** Uses per day (1 = "1/day"). The box stays ticked for the fight. */
  uses?: number;
  /** Remind the DM when it drops to 0 HP. */
  onDeath?: boolean;
}

/** DM-ONLY: a monster's key numbers, typed in from a stat block. */
export interface MonsterTemplate {
  id: string;
  name: string;
  /** What the TV calls it until the DM reveals it ("Something in the shadows"). Empty: the real name. */
  displayName: string;
  ac: number;
  /** "21" (fixed) or "6d6" (rolled per monster). */
  hp: string;
  initBonus: number;
  speed: string;
  attacks: MonsterAttack[];
  abilities: MonsterAbility[];
  resist: string;
  immune: string;
  notes: string;
  dmNote: string;
  /** A portrait scene whose art the TV shows for it. */
  sceneId?: string;
  /** DM-ONLY: drafted by a Worldbuilder key. */
  madeBy?: MadeBy;
}

export type ConditionTick = "start" | "end";

export interface FightCondition {
  id: string;
  name: string;
  /** Exhaustion level, 1-6. */
  level?: number;
  /** Rounds left. Missing: until removed. */
  rounds?: number;
  /** When it counts down: at the start or the end of its owner's turn. */
  tick: ConditionTick;
}

export interface Combatant {
  id: string;
  /** companion: a player-controlled companion or hireling (see companions.ts). Its HP lives here during the fight, like a monster's. */
  kind: "player" | "monster" | "companion";
  playerId?: string;
  /** Companions: which one. */
  companionId?: string;
  /** Companions: what 0 HP means (death saves, or dead). The DM can change it at the moment. */
  atZero?: "saves" | "dies";
  templateId?: string;
  /** DM-ONLY until revealed: the real name ("Goblin A"). Players: their character name. */
  name: string;
  /** What the TV shows until revealed ("Something in the shadows A"). */
  displayName: string;
  revealed: boolean;
  /** DM-ONLY: kept off the TV and phones until the DM shows it (ambushes, invisible enemies). */
  hidden: boolean;
  init: number | null;
  initBonus: number | null;
  /** Players: initiative came from a d20 rolled in the app, so the phone keypad is locked. The DM can still change it (clearing it unlocks). */
  initRolled?: boolean;
  /** Monsters only (DM-ONLY numbers). Players' hit points live on Player.hp. */
  hp: number;
  maxHp: number;
  tempHp: number;
  /** DM-ONLY */
  ac?: number;
  conditions: FightCondition[];
  concentrating: boolean;
  /** Ability id -> uses spent this fight. A recharge ability at 1 is waiting to recharge. */
  spent: Record<string, number>;
  /** Monsters: at 0 HP. Greyed on the TV until the round ends. */
  down: boolean;
  /** Monsters: off the TV strip and skipped (went down in an earlier round). The DM can still revive them. */
  gone?: boolean;
  /** Players at 0 HP. */
  deathSaves?: { ok: number; fail: number };
  /** Portrait scene for its art. */
  sceneId?: string;
  /** DM-ONLY */
  note?: string;
  /** Players: the concentration save they owe after the last hit, until the turn moves on. */
  concDc?: number;
  /** A new initiative that came in after their turn this round: they move to it when the round ends. */
  reslot?: boolean;
}

export type FightReminderKind = "info" | "recharge" | "death" | "concentration" | "expired";

/** DM-ONLY: a nudge on the DM's fight screen until dismissed. */
export interface FightReminder {
  id: string;
  kind: FightReminderKind;
  text: string;
  combatantId?: string;
  abilityId?: string;
  at: number;
}

/** A big moment for the TV to animate. n changes each time. */
export interface FightMoment {
  kind: "crit" | "monsterDown" | "playerDown" | "end";
  /** The combatant's TV name. */
  name: string;
  n: number;
}

/** One Next, so Previous can put it back exactly. */
export interface FightStep {
  round: number;
  currentId: string | null;
  /** Conditions that counted down (expired ones are kept whole to restore). */
  ticks: { combatantId: string; condition: FightCondition; expired: boolean }[];
  /** Monsters taken off the strip at the end of the round. */
  gone: string[];
}

/** DM-ONLY: what one HP or condition change touched, so Undo can put it back exactly. */
export interface FightUndo {
  id: string;
  /** "Goblin A took 7 damage". */
  label: string;
  at: number;
  /** Who did it: the DM, or the player on their phone. */
  by: "dm" | { playerId: string };
  combatants: Pick<Combatant, "id" | "hp" | "maxHp" | "tempHp" | "down" | "gone" | "deathSaves" | "concDc" | "concentrating" | "conditions">[];
  /** Players' own hit points (they live on Player.hp). Missing hp: not set before. */
  players: { id: string; hp?: PlayerHp }[];
  downed: string[];
  /** Reminders the change added, taken away again on Undo. */
  reminders: string[];
}

export interface Fight {
  id: string;
  /** setup: rolling initiative. over: the end card, then loot. */
  status: "setup" | "running" | "paused" | "over";
  /** "2 Goblins". */
  title: string;
  /** Where it happens, for the Chronicle ("in the feast hall"). */
  where: string;
  round: number;
  currentId: string | null;
  order: Combatant[];
  /** The TV scene to go back to afterwards. */
  returnSceneId: string;
  /** Turn timer in seconds, or null for off. */
  timerSec: number | null;
  turnStartedAt: number;
  pausedAt?: number;
  startedAt: number;
  endedAt?: number;
  sessionId: string | null;
  /** DM-ONLY */
  dmNotes: string;
  /** DM-ONLY */
  reminders: FightReminder[];
  moment?: FightMoment;
  /** DM-ONLY: undo for Previous turn, newest last. */
  steps: FightStep[];
  /** DM-ONLY: the last HP and condition changes, newest last, for Undo. Missing on fights from before it. */
  history?: FightUndo[];
  /** Combatant ids of everyone who went down, in order (once each). */
  downed: string[];
  /** Set when the fight ends: won (every foe down), fallen (every player at 0 HP), or ended (stopped with both sides standing). */
  outcome?: FightOutcome;
}

export type FightOutcome = "won" | "fallen" | "ended";

/** DM-ONLY: a finished fight, for looking back. */
export interface FightSummary {
  id: string;
  title: string;
  where: string;
  startedAt: number;
  endedAt: number;
  rounds: number;
  sessionId: string | null;
  /** Real names, as the DM knows them. */
  combatants: string[];
  downed: string[];
  lootCp: number;
  items: string;
  noteId?: string;
  /** Every foe who was in the fight (reinforcements too), for Run again. Missing on fights kept before it existed. */
  foes?: FoeSetup[];
  /** The map it was fought on, if it ended on one. Run again puts it back on the TV. */
  mapSceneId?: string;
}

/** DM-ONLY: one foe of a past fight, enough to set the fight up again fresh. */
export interface FoeSetup {
  /** From the monster library: Run again rolls it fresh from the template. */
  templateId?: string;
  name: string;
  displayName: string;
  /** Used when there's no template (a quick add, or the template was deleted). */
  maxHp: number;
  ac?: number;
  initBonus: number | null;
  hidden: boolean;
}

// ---------- the storyboard (all DM-ONLY) ----------

export type StoryBeatType = "clue" | "reveal" | "choice" | "consequence" | "background" | "spotlight";
export type StoryStatus = "planned" | "placed" | "played" | "dropped";
export type StoryThreadKind = "main" | "side" | "place" | "backstory";

/** When a beat should happen: "YYYY-MM" months, both ends included. */
export interface StoryRange {
  from: string;
  to: string;
}

/** What a story beat is tied to. Entries and facts by id, so renaming a slug never breaks a link. */
export type StoryLink =
  | { kind: "entry"; id: string }
  | { kind: "fact"; entryId: string; factId: string }
  | { kind: "job"; id: string }
  | { kind: "flyer"; id: string }
  | { kind: "lead"; id: string }
  | { kind: "item"; id: string }
  | { kind: "monster"; id: string };

export interface StoryThread {
  id: string;
  /** Backstory lanes leave it empty and read "Backstory: {character}". */
  name: string;
  /** "#7a2a1f" */
  color: string;
  description: string;
  goal: string;
  kind: StoryThreadKind;
  /** Backstory lanes: whose. */
  playerId?: string;
  /** Drafted by a Worldbuilder key. */
  madeBy?: MadeBy;
}

export interface StoryPlay {
  at: number;
  /** The session it was played in (null: marked by hand between sessions). */
  sessionId: string | null;
  episodeId?: string;
  outcome: string;
}

export interface StoryBeat {
  id: string;
  threadId: string;
  title: string;
  summary: string;
  dmNotes: string;
  type: StoryBeatType;
  /** Missing: floating (no window yet). "anytime": any time at all. */
  window?: StoryRange | "anytime";
  /** "YYYY-MM-DD": warn if it isn't placed (or played) by then. */
  by?: string;
  links: StoryLink[];
  /** Beats that must be played first. */
  after: string[];
  status: StoryStatus;
  /** Can be played again and again ("The candle never needs new wax"): stays Planned after a play. */
  repeat?: boolean;
  /** Each time it was played, oldest first. */
  plays: StoryPlay[];
  /** A reworded copy of this beat. */
  variantOf?: string;
  /** Can happen anywhere: the off-script kit offers it wherever the party is. */
  anywhere?: boolean;
  createdAt: number;
  /** Drafted by a Worldbuilder key. */
  madeBy?: MadeBy;
}

/** A planned game night. Episodes sit on their dates. */
export interface StoryDate {
  id: string;
  /** "YYYY-MM-DD" */
  date: string;
  cancelled?: boolean;
  episodeId?: string;
  /** The real session it became. */
  sessionId?: string;
}

export interface Story {
  threads: StoryThread[];
  beats: StoryBeat[];
  dates: StoryDate[];
  /** Board view: columns by month or by season. */
  zoom: "month" | "season";
  /** Festival labels along the top. */
  festivals: boolean;
}

// ---------- session invites ----------

/** One game night's invite: a link people open to claim a seat, first come first served. */
export interface Invite {
  id: string;
  /** The link code: /i/<code>. Like an Arrival link code. */
  code: string;
  title: string;
  /** "YYYY-MM-DD" and "HH:MM", as the DM typed them (their own time zone). */
  date: string;
  time: string;
  /** Rough end time, "HH:MM". */
  endTime?: string;
  /** The start as a moment, worked out on the DM's device (their time zone). Drives closing and the waitlist cut-off. */
  startsAt: number;
  endsAt?: number;
  /** Shown to everyone with the link ("Sam's place, Northside"). */
  place: string;
  /** Shown only to people with a seat (the street address). */
  address?: string;
  blurb: string;
  /** A picture: /api/files/… or a built-in path. */
  art?: string;
  /** Seats at the table, 1-8. */
  seats: number;
  /** Once full, later people join a waitlist. */
  waitlist: boolean;
  /** Shared world: only this party's characters may claim (plus held seats). Missing: an open call. */
  partyId?: string;
  /** First names of who's coming, on the invite page. */
  showWho: boolean;
  /** Every claim waits for the DM's OK. */
  approve: boolean;
  /** Claims close at this moment. Missing: at the start. */
  closesAt?: number;
  /** The storyboard date it sits on. */
  storyDateId?: string;
  status: "open" | "closed" | "cancelled";
  createdAt: number;
  /** The session it became. */
  sessionId?: string;
  entries: InviteEntry[];
}

/** One person on an invite. */
export interface InviteEntry {
  id: string;
  name: string;
  character?: string;
  /** in: has a seat · wait: on the waitlist · ask: waiting for the DM's OK · out: gave it back · removed: the DM took them off. */
  state: "in" | "wait" | "ask" | "out" | "removed";
  /** The DM saved this seat for one of their players. */
  held?: boolean;
  /** The player this seat is (made when they got in, or a player who already plays here). */
  playerId?: string;
  /** This invite made that player, so giving the seat back before ever playing tidies them away. */
  made?: boolean;
  /** DM-ONLY, never sent anywhere: sha-256 of the key the claiming phone keeps. */
  keyHash?: string;
  /** When they claimed (first come, first served). */
  at: number;
  /** Moved up from the waitlist. */
  movedUpAt?: number;
  /** The DM has copied the "you're in" message for them. */
  told?: boolean;
  outAt?: number;
}

/** The soundboard. Sound is made on the TV itself; this is only what to play. */
export interface SoundState {
  /** Master volume, 0..1. Missing: VOLUME_DEFAULT. */
  volume?: number;
  muted?: boolean;
  /** Cues tied to moments (dice, fights, scenes, rank-ups) are off. Missing: on. */
  autoOff?: boolean;
  /** Looping layers playing: layer id -> volume 0..1. */
  layers: Record<string, number>;
  /** Seconds the last change of layers fades over. */
  fade?: number;
  /** The mix the layers came from, until a layer is changed by hand. */
  mix?: string;
  /** The last one-shot: the TV plays it when n changes. */
  cue?: { id: string; n: number; at: number };
}
