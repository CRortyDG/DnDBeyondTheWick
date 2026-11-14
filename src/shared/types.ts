// The whole campaign ("game") lives in one JSON document, plus an append-only ledger.
// Anything marked DM-ONLY must never reach the TV or a player: see projection.ts.

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
  hotkey: number | null; // 0-9
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
}

// ---------- the bounty board ----------

/** Paper on the notice board. A sealed envelope shows no text at all. */
export type JobStyle = "scrawl" | "bill" | "official" | "sealed";
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

// ---------- run-game (all DM-ONLY) ----------

export type BeatAction =
  | { type: "scene"; sceneId: string }
  | { type: "black" }
  | { type: "bank" }
  | { type: "stinger" }
  /** "fight: Goblin x2": set up a fight with these monster templates, matched by name when it fires. */
  | { type: "fight"; monsters: FightGroup[] };

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
  /** The party's Renown rank, 0 = Strangers. Missing: 0. */
  renown?: number;
  /** The last time Renown went up: the TV plays the moment when n changes. */
  renownMoment?: { rank: number; n: number; at: number };
  /** The Arrival intro's settings. Missing on games made before it. */
  arrival?: ArrivalSettings;
  /** The Chronicle's notes, oldest first. Missing on games made before it; read with notesOf(). */
  notes?: Note[];
  /** DM-ONLY: monster templates for combat mode. Missing on games made before it; read with monstersOf(). */
  monsters?: MonsterTemplate[];
  /** The fight in progress, if any. Only fightView() projections of it ever leave the server for the TV or a phone. */
  fight?: Fight;
  /** DM-ONLY: past fights, newest last (summaries only). */
  fights?: FightSummary[];
  /** One-time content upgrades already applied to this game (see migrate.ts), so a later delete sticks. */
  upgrades?: string[];
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
}

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
