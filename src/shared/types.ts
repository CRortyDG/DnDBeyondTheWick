// The whole campaign ("game") lives in one JSON document, plus an append-only ledger.
// Anything marked DM-ONLY must never reach the TV or a player: see projection.ts.

import type { DiceGroup, RollEntry } from "./dice";

export type SceneKind = "notice" | "portrait" | "handout" | "image" | "black" | "map" | "table" | "stinger";

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
  /** Portraits: the players have met this NPC (set when first shown on the TV, or by the DM). Feeds the Chronicle's tag picker. */
  known?: boolean;
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
}

export type LegendStyle = "numbers" | "names";

export interface MapData {
  pins: Pin[];
  legendOn: boolean;
  /** "numbers": seals only, players ask what's what (names aren't sent). "names": seal, name and type. */
  legendStyle: LegendStyle;
  /** Size of the dots on the map, 1 = standard (about 64px on a 1080p TV). Missing on maps made before it existed. */
  sealScale?: number;
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
  archived: boolean;
  dropIn: boolean;
  balanceCp: number;
  /** Has Heroic Inspiration right now (shown on the TV purse). */
  inspired?: boolean;
  createdAt: number;
  createdVia: "url" | "dm" | "seed";
  /** DM-ONLY */
  lastSeenAt?: number;
  /** Their character's name ("Brin Ashcombe"). Empty or missing: not chosen yet. Shared with the Chronicle. */
  character?: string;
  /** The Arrival intro: their private link and how far they've got. */
  arrival?: PlayerArrival;
  /** Hit points for the table in combat mode (D&D Beyond stays the real sheet). Missing: not set yet. */
  hp?: PlayerHp;
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
}

/** Game-wide Arrival settings. */
export interface ArrivalSettings {
  /** The text the DM copies per player. {link} is replaced with their link, {name} with their player name. */
  template?: string;
  /** Once locked, players can no longer change their character name or line. */
  seatsLocked?: boolean;
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
  trust?: TrustNeed | null;
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
  /** What was actually charged (differs from totalCp after haggling). */
  chargedCp?: number;
  /** Service or training: the player's answer to the item's prompt. */
  question?: string;
  /** Service: the DM's answer the player sees. */
  answer?: string;
  /** "Post on the notice board": the flyer as written (or as the DM edited it). */
  flyer?: FlyerText;
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

/** How a person feels about the party. */
export type Relation = "stranger" | "friendly" | "ally" | "hostile";

export interface EntryFact {
  id: string;
  /** For the run sheet: "fact: person/mags/owes-the-baker". */
  slug: string;
  text: string;
  /** Players know it. Unrevealed facts are DM-ONLY. */
  revealedAt?: number;
  /** The session it was learned in. */
  learnedIn?: string | null;
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
  /** People: how they feel about the party. Missing: stranger. */
  relation?: Relation;
  /** People: how they feel about one player, where it differs. */
  relationBy?: Record<string, Relation>;
  /** When its stage last changed. */
  stagedAt?: number;
  /** When it was found, and in which session. */
  foundAt?: number;
  foundIn?: string | null;
  /** DM-ONLY */
  dmNote: string;
  /** DM-ONLY */
  secrets: string;
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
}

export interface Vote {
  id: string;
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
  | { type: "show"; ref: string };

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
}

export interface Episode {
  id: string;
  title: string;
  beats: Beat[];
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
}

export interface GameState {
  schema: 2;
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
  /** Items whose effects have applied (bought, or funded for projects), with when. */
  effectsOn: Record<string, number>;
  awards: Award[];
  tasks: DmTask[];
  flyers: Flyer[];
  /** The bounty board's job flyers. Missing on games made before it; read with jobsOf(). */
  jobs?: Job[];
  /** Plain notes on the notice board. Missing on games made before free placement; read with noticesOf(). */
  notices?: Notice[];
  /** The Renown plaque on the board's frame. Missing: shown. */
  plaqueHidden?: boolean;
  /** The party's Renown rank, 0 = Strangers. Missing: 0. */
  renown?: number;
  /** The last time Renown went up: the TV plays the moment when n changes. */
  renownMoment?: { rank: number; n: number; at: number };
  /** The last dice roll on the TV (the DM's or a player's): the TV plays it when n changes. Secret and DM-only rolls never get here. */
  diceRoll?: { n: number; at: number; groups: DiceGroup[]; plus: number; total: number; /** Set when a player rolled. */ name?: string };
  /** DM-ONLY: every roll, the DM's and the players', newest last (capped). Players see only their own. */
  rolls?: RollEntry[];
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
  /** One-time content upgrades already applied to this game (see migrate.ts), so a later delete sticks. */
  upgrades?: string[];
  /** DM-ONLY: the storyboard (threads, story beats, planned session dates). Never copied into a TV or player view. Read with storyOf(). */
  story?: Story;
  seq: number;
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
  kind: "player" | "monster";
  playerId?: string;
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
  createdAt: number;
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
