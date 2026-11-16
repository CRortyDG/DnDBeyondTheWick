// Spoiler safety lives here. Each role gets a view built field-by-field from
// an explicit allow-list, so a new DM-only field can't leak by accident.

import { decodeBits, fogged, publicFog, type PublicFog } from "./fog";
import { publicGrid, publicTokens, type PublicGrid, type PublicToken } from "./tokens";
import { leadsView, type LeadsView } from "./leads";
import { areaCounts, type AreaCount } from "./discovery";
import { townOf } from "./presets";
import { creditLines, discountPct, firstChargeCp, priceOf, raisedCp, stakeTotals } from "./progress";
import type { DiceGroup, RollTo } from "./dice";
import { heldCp, heldStock } from "./requests";
import { projectIntro, projectTable, type TableView, type TvIntroView } from "./arrival";
import { notesOf, penName, projectChronicle, type ChronicleView } from "./chronicle";
import { discoveryView, PORTRAIT_ART, portraitArtAllowed, publicEntries, sceneSpoils, type DiscoveryView, type PublicEntry } from "./discovery";
import { jobsOf, jobTitle, progressOf, rankName, ranksOf, renownMet, renownNeeded, renownOf, shopOpenNow, tierOf, trustText } from "./renown";
import { fightView, myFight, type FightView, type MyFight } from "./combat";
import { controlledBy, publicCompanions, type ControlledCompanion, type PublicCompanion } from "./companions";
import type { Art, Banner, Flyer, FlyerText, GameState, Job, JobStyle, Item, ItemCategory, ItemKind, LedgerEntry, LegendStyle, LiveState, NoteLook, NotePlace, Notice, Player, RequestStatus, Scene, Shop } from "./types";
import { noticesOf } from "./board";
import { hasWords, type HandoutSheet } from "./handout";
import { characterName, sharedLevel } from "./levels";
import { partiesFor, partyName, playerLens, tableParty, tvLens, worldView, type WorldView } from "./world";

export const GATED_ART = new Set(["merchant-sigil", ...PORTRAIT_ART]);

export interface PublicScene {
  id: string;
  kind: Scene["kind"];
  art: Art;
  name?: string;
  title?: string;
  alt?: string;
  map?: PublicMap;
  /** Handouts: the words, only while the handout is live. */
  sheet?: HandoutSheet;
}

/** A discovered pin, as the TV sees it. Hidden pins, DM notes and links are never sent. */
export interface PublicPin {
  id: string;
  /** What's printed in the seal. */
  label: string;
  x: number;
  y: number;
  /** Only sent with the "numbers and names" legend, or while the DM is focusing this pin. */
  name?: string;
  type?: string;
  description?: string;
}

export interface PublicMap {
  pins: PublicPin[];
  legend: { on: boolean; style: LegendStyle };
  /** Dot size, 1 = standard. */
  sealScale: number;
  /** Tokens the room may see (never hidden ones or hidden foes). */
  tokens: PublicToken[];
  grid?: PublicGrid;
  /** Fog is on: the clear cells and the tiles that touch them. The scene's art has no URL then. */
  fog?: PublicFog;
  /** Only on the live map. */
  focus?: { pinId: string; n: number };
  banner?: { n: number; name: string };
}

/** The live map on a phone. */
export interface PhoneMap {
  sceneId: string;
  label: string;
  art: Art;
  alt?: string;
  map: PublicMap;
}

function phoneMapOf(game: GameState, sc: Scene): PhoneMap {
  const pub = publicScene(game, sc);
  return { sceneId: sc.id, label: sc.label, art: pub.art, ...(sc.alt ? { alt: sc.alt } : {}), map: pub.map! };
}

function phoneMap(game: GameState): PhoneMap | undefined {
  const sc = game.scenes.find((x) => x.id === game.live.sceneId);
  if (!sc || sc.kind !== "map" || !sc.map) return undefined;
  return phoneMapOf(game, sc);
}

/** Maps the players can open any time: those shown on the TV before (or marked known by the DM). Never a reveal map that isn't live. */
function knownMaps(game: GameState): PhoneMap[] {
  return game.scenes.filter((sc) => sc.kind === "map" && sc.map && sc.known && sc.id !== game.live.sceneId && !sc.reveal).map((sc) => phoneMapOf(game, sc));
}

export interface PublicPlayer {
  id: string;
  name: string;
  balanceCp: number;
  /** Heroic Inspiration. */
  inspired: boolean;
}

/** A shop as the party sees it. */
export interface PublicShop {
  id: string;
  name: string;
  subtitle: string;
  /** Visible but not selling yet: no goods are sent. */
  closed: boolean;
  /** Waiting on the party's Renown: the rank it needs ("Known in town"). No goods are sent. */
  needs?: string;
  /** Someone's goodwill it waits on ("Mags Wick’s friendship"). */
  goodwill?: string;
}

/**
 * An item as the party sees it. Rumored items arrive with name "???", no price
 * and no description. Hidden items, and every item in a shop the viewer can't
 * see, are never sent at all.
 */
export interface PublicItem {
  id: string;
  shopId: string;
  name: string;
  /** null = "???" (rumored, or locked with the price hidden). */
  priceCp: number | null;
  /** Shown instead of the price ("Free*"). */
  priceLabel?: string;
  description: string;
  tier: "sale" | "locked" | "rumored";
  /** Locked: why. */
  reason?: string;
  /** Locked until the party has this Renown ("Known in town"). */
  needs?: string;
  /** Someone's goodwill it waits on ("Mags Wick’s friendship"). */
  goodwill?: string;
  /** Rumored: the one-line hint. */
  hint?: string;
  /** null = no limit. */
  stock: number | null;
  restockNote?: string;
  finePrint?: string;
  /** Special order: arrives this many sessions after buying. */
  arrivesInSessions?: number;
  /** Units waiting on someone's pending request (only when stock is limited). */
  held?: number;
  /** Sold one at a time: no quantity picker. */
  oneAtATime?: boolean;
  category: ItemCategory;
  kind: ItemKind;
  /** The price before a discount (priceCp is after it). */
  listCp?: number;
  discountPct?: number;
  /** Training: what the first lesson costs. */
  dueNowCp?: number;
  installments?: number;
  /** Asked when buying ("Which language or tool?"). */
  prompt?: string;
  /** "Post on the notice board": the player writes a flyer. */
  flyer?: boolean;
  /** Projects: gold raised so far (priceCp is the goal). */
  raisedCp?: number;
  funded?: boolean;
  /** Earned items: who has it. */
  earnedBy?: string[];
}

/** A player flyer on the notice board. */
export interface PublicFlyer extends FlyerText {
  id: string;
  /** Gold the poster put up, while it's held. */
  rewardCp?: number;
  /** Shared world: the poster's party. */
  party?: string;
  /** When it went up (orders the pins with the jobs). */
  at: number;
  style?: JobStyle;
  look?: NoteLook;
  place?: NotePlace;
}

/** The note the DM is showing up close. */
export type CloseUp = { kind: "notice"; notice: PublicNotice } | { kind: "job"; job: PublicJob } | { kind: "flyer"; flyer: PublicFlyer };

/** A plain note on the board, as the room sees it (never the DM's note, never one in the drawer). */
export interface PublicNotice {
  id: string;
  style: JobStyle;
  title: string;
  body: string;
  sign: string;
  look: NoteLook;
  place: NotePlace;
}

/**
 * A job flyer as the room sees it: only pinned ones, never the DM's notes.
 * A sealed envelope comes with no title, poster or text.
 */
export interface PublicJob {
  id: string;
  style: JobStyle;
  status: "open" | "taken" | "done";
  title: string;
  postedBy: string;
  body: string;
  /** null: the reward is hidden. */
  reward: { kind: "each" | "total"; cp: number } | null;
  /** The party isn't there yet: stamped "Experienced parties only", with the rank it needs. */
  needs?: string;
  /** Someone's goodwill it waits on ("Mags Wick’s friendship"). */
  goodwill?: string;
  at: number;
  /** When the party took it (status taken) or finished it (status done). */
  when?: JobWhen;
  /** Shared world: the party that took it or did it. */
  party?: string;
  look?: NoteLook;
  place?: NotePlace;
}

/** The chapter (session number) it happened in, else just the time. */
export interface JobWhen {
  at: number;
  chapter?: number;
}

/** A job on my phone. */
export interface MyJob extends PublicJob {
  /** Open, and the party has the Renown for it. */
  canTake: boolean;
  /** Someone at the table has asked the DM for it, for the party. */
  asked: boolean;
}

export interface PublicRenown {
  rank: number;
  name: string;
  meaning: string;
  /** Every rank, for the phone's ladder. */
  ladder: { name: string; pay: string }[];
  /** Only when the DM shows Renown progress to players: points toward the next rank. */
  progress?: { points: number; floor: number; next: number | null; nextName: string | null; frac: number };
}

/** One of my phone requests, as I see it. */
export interface MyRequest {
  id: string;
  kind: "buy" | "give" | "contribute" | "job";
  at: number;
  status: RequestStatus;
  totalCp: number;
  note: string;
  itemName?: string;
  qty: number;
  toPlayerName?: string;
  decidedAt?: number;
  reason?: string;
  chargedCp?: number;
  question?: string;
  /** The DM's answer to a service. */
  answer?: string;
  flyerTitle?: string;
  jobTitle?: string;
}

/** What I have going: rentals, lessons, shares, titles, honours. */
export interface MyThings {
  rentals: { id: string; itemName: string; monthlyCp: number }[];
  trainings: { id: string; itemName: string; what: string; paid: number; of: number; done: boolean }[];
  /** Project shares and things I keep (a trophy, a title, a house). */
  stakes: { itemId: string; itemName: string; cp: number; project: boolean; goalCp?: number; raisedCp?: number; funded?: boolean }[];
  awards: { id: string; itemName: string; at: number; note: string }[];
  /** Mags's tab: how far below zero I may go, and where. */
  credit: { shopId: string; shopName: string; limitCp: number }[];
}

export interface MyOrder {
  id: string;
  itemName: string;
  arrivesAtSession: number;
  arrived: boolean;
}

export interface PublicSession {
  number: number;
  title: string;
}

interface Common {
  version: number;
  game: { id: string; name: string; /** The town's name ("" if the DM hasn't named it). */ town: string };
  purse: PublicPlayer[];
  shops: PublicShop[];
  items: PublicItem[];
  session: PublicSession | null;
  /** The latest "New at the Smithy" banner (only ever about things this viewer can see). */
  banner: Banner | null;
  /** The party's Renown. */
  renown: PublicRenown;
  /** A shared world: the date, events, news and parties. Missing: one table, as before. */
  world?: WorldView;
}

export interface TvView extends Common {
  role: "tv";
  live: Pick<LiveState, "sceneId" | "shopOpen" | "shopId" | "purseVisible" | "shopCategory" | "leads" | "ambient">;
  /** Leads the party can see, the vote, and "You chose". */
  leads: LeadsView;
  /** "Tonight you met…" at the end of a session: the TV plays it when n changes. */
  recapCard?: { n: number; text: string };
  /** Approved player flyers, while they're up. */
  flyers: PublicFlyer[];
  /** Pinned job flyers. */
  jobs: PublicJob[];
  /** Plain notes that are up. */
  notices: PublicNotice[];
  /** One note up close over the board (it may be one from the drawer). */
  closeUp?: CloseUp;
  /** The Renown plaque is off the board's frame. */
  plaqueHidden?: boolean;
  /** The last rank-up: the TV plays the moment when n changes. */
  renownMoment?: { rank: number; name: string; raised: string; meaning: string; n: number };
  /** The party levelled up: the TV plays it when n changes. level: everyone's, when they're all the same. */
  levelMoment?: { n: number; level: number | null; who: { name: string; level: number }[] };
  /** A reveal (a rumor, someone found, a fact): the TV plays it when n changes. */
  discovery?: DiscoveryView;
  /** The last roll on the TV: the TV plays it when n changes. name: the player who rolled (none: the DM). */
  diceRoll?: { n: number; groups: DiceGroup[]; plus: number; total: number; name?: string; for?: "initiative" };
  /** Every non-reveal scene (for instant switching), plus the live scene even if it's a reveal. */
  scenes: PublicScene[];
  /** "Previously on…": only while the DM is showing it. The only session text the TV ever gets. */
  recap: { number: number; title: string; text: string; notes?: { text: string; author: string }[] } | null;
  /** The Table's seats and the QR links of unclaimed players: only while The Table is live. */
  table?: TableView;
  /** While the Arrival intro is live on the TV: what plays and where it's up to. */
  intro?: TvIntroView;
  /** Combat mode: the fight going on, as the room may see it. */
  fight: FightView | null;
  /** Companions and hirelings with the party (a small card each). */
  companions: PublicCompanion[];
}

export interface MyLedgerLine {
  id: string;
  at: number;
  amountCp: number;
  note: string;
}

export interface PlayerView extends Common {
  role: "player";
  live: Pick<LiveState, "shopOpen" | "shopId" | "purseVisible">;
  me: {
    id: string;
    handle: string;
    name: string;
    /** Their character's name, once they've picked one. Shown instead of `name` on the phone. */
    character?: string;
    balanceCp: number;
    dndbUrl?: string;
    locked: boolean;
    archived: boolean;
    /** Gold held by my pending requests. */
    heldCp: number;
    /** My hit points for combat mode (not set: max 0). */
    hp: { cur: number; max: number; temp: number; tv: boolean };
    /** My character's level, once the DM has set it. */
    level?: number;
  };
  /** I just levelled up: the phone says so when n changes. */
  levelUp?: { n: number; level: number };
  /** The map that's on the TV, as the room sees it (fog, tokens and all). Missing: no map on the TV. */
  map?: PhoneMap;
  /** Other maps the party knows, to look at any time (same view as the TV would get). */
  maps: PhoneMap[];
  /** Combat mode: the fight going on, as the room sees it, and my part in it. */
  fight: FightView | null;
  myFight: MyFight | null;
  /** Companions and hirelings with the party (a small card each). */
  companions: PublicCompanion[];
  /** The ones I run: their stat block (what the DM lets me see) and their part in the fight. */
  myCompanions: ControlledCompanion[];
  myLedger: MyLedgerLine[];
  myOrders: MyOrder[];
  /** My purchase and gold requests, newest first. Never anyone else's. */
  myRequests: MyRequest[];
  mine: MyThings;
  /** Everyone I could send gold to (names only). */
  table: { id: string; name: string }[];
  /** The campaign's D&D Beyond game link, if the DM set one. */
  vttUrl?: string;
  /** The table's story notes. Hidden notes are left out entirely. */
  chronicle: ChronicleView;
  /** The bounty board: pinned jobs. */
  jobs: MyJob[];
  /** Discovery: rumored, found and known entries only; revealed facts only. */
  entries: PublicEntry[];
  /** Leads the party can see, the vote (with this player's ballot), and "You chose". */
  leads: LeadsView;
  /** Per area, how much the party has found (and, in totals mode, how much there is). */
  areas: AreaCount[];
  /** My own last few dice rolls, newest first. Never anyone else's. */
  myRolls: { n: number; at: number; groups: DiceGroup[]; plus: number; total: number; to: RollTo; for?: "initiative" }[];
}

export type DmPlayer = Omit<Player, "keyHash"> & { hasKey: boolean };

export interface DmView {
  role: "dm";
  version: number;
  state: Omit<GameState, "players"> & { players: DmPlayer[] };
  ledger: LedgerEntry[];
  chronicle: ChronicleView;
}

export type View = TvView | PlayerView | DmView;

// ---------------------------------------------------------------------------

/**
 * mayShowUpload: whether an uploaded picture (sc.art.url) may go to this non-DM
 * viewer. A scene the DM has staged but never shown is held back, so a spectator
 * can't pre-fetch an upcoming handout or map from its URL. Built-in art is safe
 * (bundled, or gated art served through a route that re-checks on each fetch).
 */
export function artForPublic(game: GameState, sc: Scene, mayShowUpload = true): Art {
  const builtin = sc.art?.builtin;
  if (builtin && GATED_ART.has(builtin)) {
    // Gated art is only described to the TV while live, via a route that re-checks.
    return { url: `/api/art/${builtin}?game=${encodeURIComponent(game.id)}` };
  }
  const art: Art = {};
  if (builtin) art.builtin = builtin;
  if (sc.art?.url && mayShowUpload) art.url = sc.art.url;
  return art;
}

/** An uploaded picture is sent out only once the scene is live, already shown, or marked known. */
export function sceneArtPublic(game: GameState, sc: Scene): boolean {
  return game.live.sceneId === sc.id || !!sc.known || sc.shownAt !== undefined;
}

function publicScene(game: GameState, sc: Scene): PublicScene {
  // A fogged map goes out as tiles (in its map), never as the whole image.
  const out: PublicScene = { id: sc.id, kind: sc.kind, art: sc.kind === "map" && sc.map?.fog?.on ? {} : artForPublic(game, sc, sceneArtPublic(game, sc)) };
  // A person's picture reads their name and title (once the room may see them; a portrait still hidden is only sent while it's live, and showing it finds them).
  const owner = sc.kind === "portrait" ? (game.entries ?? []).find((e) => e.sceneId === sc.id && (e.stage === "found" || e.stage === "known")) : undefined;
  const name = owner ? owner.name : sc.name;
  const title = owner ? owner.title : sc.title;
  if (name !== undefined) out.name = name;
  if (title !== undefined) out.title = title;
  if (sc.alt !== undefined) out.alt = sc.alt;
  // A handout's words are a spoiler like its picture: only once it's live (the TV list below drops them for scenes that aren't).
  if (sc.kind === "handout" && sc.sheet && hasWords(sc) && game.live.sceneId === sc.id) out.sheet = { ...sc.sheet };
  if (sc.kind === "map" && sc.map) out.map = publicMap(game, sc);
  return out;
}

/** Only discovered pins, field by field. With the "numbers only" legend, names stay on the server. */
export function publicMap(game: GameState, sc: Scene): PublicMap {
  const m = sc.map!;
  const isLive = game.live.sceneId === sc.id;
  const fogBits = m.fog?.on ? decodeBits(m.fog.bits, m.fog.cols, m.fog.rows) : undefined;
  const underFog = (x: number, y: number) => !!fogBits && fogged(m, x, y, fogBits);
  const shown = m.pins.filter((p) => p.discovered && !underFog(p.x, p.y));
  const focus = isLive && game.live.focus && shown.some((p) => p.id === game.live.focus!.pinId) ? game.live.focus : undefined;
  // A place that's only a rumor: a "?" seal, its nickname and hint, never the pin's own name or text.
  const rumors = new Map((game.entries ?? []).filter((e) => e.stage === "rumored" && e.pin?.sceneId === sc.id).map((e) => [e.pin!.pinId, e]));
  const out: PublicMap = {
    pins: shown.map((p) => {
      const rumor = rumors.get(p.id);
      const pin: PublicPin = { id: p.id, label: rumor ? "?" : sealText(p), x: p.x, y: p.y };
      if (m.legendStyle === "names" || focus?.pinId === p.id) {
        pin.name = rumor ? rumor.nickname || "???" : p.name;
        pin.type = rumor ? "rumor" : p.type;
        pin.description = rumor ? rumor.hint : p.description;
      }
      return pin;
    }),
    legend: { on: m.legendOn, style: m.legendStyle },
    sealScale: m.sealScale ?? 1,
    // The party always shows; anyone else under fog stays on the server.
    tokens: publicTokens(game, m).filter((t) => t.playerId || !underFog(t.x, t.y)),
  };
  if (m.fog?.on) out.fog = publicFog(m.fog, sc.art?.url);
  const grid = publicGrid(m);
  if (grid) out.grid = grid;
  if (focus) out.focus = { pinId: focus.pinId, n: focus.n };
  const b = isLive ? game.live.banner : undefined;
  const bannerPin = b && shown.find((p) => p.id === b.pinId);
  if (b && bannerPin) out.banner = { n: b.n, name: rumors.has(bannerPin.id) ? rumors.get(bannerPin.id)!.nickname || "???" : bannerPin.name };
  return out;
}

/** What's printed in a pin's seal: its "shows as" text, or its number. */
export function sealText(p: { number: number; showsAs: string }): string {
  return p.showsAs.trim() || String(p.number);
}

/** Who's looking: the TV (the whole room) or one player. */
type Viewer = { tv: true } | { tv: false; playerId: string };

/** Can this viewer see the shop at all? The TV only ever sees shops open to everyone. */
export function shopVisibleTo(shop: Shop, viewer: Viewer): boolean {
  if (shop.visibility === "all") return true;
  if (shop.visibility === "some" && !viewer.tv) return shop.playerIds.includes(viewer.playerId);
  return false;
}

function publicItem(game: GameState, it: Item): PublicItem | null {
  if (it.tier === "hidden") return null;
  if (it.tier === "rumored") {
    // Name, price and description stay on the server; only the hint goes out.
    return { id: it.id, shopId: it.shopId, name: "???", priceCp: null, description: "", tier: "rumored", hint: it.hint, stock: null, category: it.category, kind: it.kind };
  }
  const tier = tierOf(game, it);
  const hide = it.tier === "locked" && it.hidePrice;
  const out: PublicItem = {
    id: it.id,
    shopId: it.shopId,
    name: it.name,
    priceCp: hide ? null : priceOf(game, it),
    description: it.description,
    tier: tier as PublicItem["tier"],
    stock: it.stock,
    category: it.category,
    kind: it.kind,
  };
  const pct = discountPct(game, it);
  if (pct && !hide) {
    out.listCp = it.priceCp;
    out.discountPct = pct;
  }
  if (it.kind === "training") {
    out.installments = it.installments ?? 1;
    if (!hide) out.dueNowCp = firstChargeCp(game, it);
  }
  if (it.prompt) out.prompt = it.prompt;
  if (it.flyer) out.flyer = true;
  if (it.kind === "project") {
    out.raisedCp = raisedCp(game, it.id);
    if (game.effectsOn[it.id]) out.funded = true;
  }
  if (it.kind === "earned") {
    const ids = new Set(game.awards.filter((a) => a.itemId === it.id).flatMap((a) => a.playerIds));
    out.earnedBy = game.players.filter((p) => ids.has(p.id)).map(penName);
  }
  if (tier === "locked") out.reason = it.reason;
  const need = renownNeeded(game, it);
  if (need !== null) out.needs = rankName(need, game);
  const trust = it.tier === "sale" || it.tier === "locked" ? trustText(game, it.trust) : null;
  if (trust) out.goodwill = trust;
  if (it.priceLabel) out.priceLabel = it.priceLabel;
  if (it.finePrint) out.finePrint = it.finePrint;
  if (it.arrivesInSessions) out.arrivesInSessions = it.arrivesInSessions;
  if (it.stock === 0 && it.restockNote) out.restockNote = it.restockNote;
  if (it.oneAtATime || it.arrivesInSessions || it.kind !== "purchase") out.oneAtATime = true;
  if (it.stock !== null) {
    const held = Math.min(it.stock, heldStock(game, it.id));
    if (held > 0) out.held = held;
  }
  return out;
}

function common(game: GameState, version: number, viewer: Viewer): Common {
  const cur = game.sessions.find((x) => x.id === game.currentSessionId);
  const shops = game.shops.filter((sh) => shopVisibleTo(sh, viewer));
  const open = new Set(shops.filter((sh) => shopOpenNow(game, sh)).map((sh) => sh.id));
  const rank = renownOf(game);
  const ladder = ranksOf(game);
  return {
    version,
    game: { id: game.id, name: game.name, town: townOf(game) },
    purse: game.players.filter((p) => !p.archived && !p.away).map((p) => ({ id: p.id, name: penName(p), balanceCp: p.balanceCp, inspired: !!p.inspired })),
    shops: shops.map((x) => ({ id: x.id, name: x.name, subtitle: x.subtitle, closed: !!x.closed, ...(renownMet(game, x.renown) ? {} : { needs: rankName(x.renown ?? 0, game) }), ...(trustText(game, x.trust) ? { goodwill: trustText(game, x.trust)! } : {}) })),
    items: game.items.filter((it) => open.has(it.shopId)).map((it) => publicItem(game, it)).filter((x): x is PublicItem => x !== null),
    session: cur ? { number: cur.number, title: cur.title } : null,
    banner: game.banner ? { ...game.banner } : null,
    renown: { rank, name: ladder[rank].name, meaning: ladder[rank].meaning, ladder: ladder.map((r) => ({ name: r.name, pay: r.pay })), ...(game.renownProgress ? { progress: publicProgress(game) } : {}) },
  };
}

function publicProgress(game: GameState): NonNullable<PublicRenown["progress"]> {
  const p = progressOf(game);
  return { points: p.points, floor: p.floor, next: p.next, nextName: p.nextName, frac: p.frac };
}

/** The shop on the TV, but only if the viewer can see it (never leak a hidden shop's id). */
function liveShop(game: GameState, viewer: Viewer) {
  const sh = game.shops.find((x) => x.id === game.live.shopId);
  const ok = !!sh && shopVisibleTo(sh, { tv: true }) && shopVisibleTo(sh, viewer);
  return { shopOpen: ok && game.live.shopOpen, shopId: ok ? game.live.shopId : "" };
}

export function projectTv(table: GameState, version: number): TvView {
  // A shared world: the TV shows the table, and only the playing party's leads, chapters and jobs.
  const game = tvLens(table);
  const party = tableParty(game);
  return {
    ...(game.world ? { world: worldView(game, party ? [party] : []) } : {}),
    ...common(game, version, { tv: true }),
    role: "tv",
    live: { sceneId: game.live.sceneId, ...liveShop(game, { tv: true }), purseVisible: game.live.purseVisible, ...(game.live.shopCategory ? { shopCategory: game.live.shopCategory } : {}), ...(game.live.leads ? { leads: true } : {}), ...(game.live.ambient ? { ambient: { id: game.live.ambient.id, ...(game.live.ambient.caption ? { caption: game.live.ambient.caption } : {}) } } : {}) },
    leads: leadsView(game, Date.now()),
    ...(game.recapCard ? { recapCard: { n: game.recapCard.n, text: game.recapCard.text } } : {}),
    flyers: game.flyers.filter((f) => f.up).map((f) => publicFlyer(f, game)),
    jobs: pinnedJobs(game).map((j) => publicJob(game, j)),
    notices: noticesOf(game).filter((n) => n.up).map(publicNotice),
    ...(closeUpOf(game) ? { closeUp: closeUpOf(game) } : {}),
    ...(game.plaqueHidden ? { plaqueHidden: true } : {}),
    ...(game.levelMoment ? { levelMoment: tvLevelMoment(game, game.levelMoment) } : {}),
    ...(game.renownMoment ? { renownMoment: { rank: game.renownMoment.rank, name: rankName(game.renownMoment.rank, game), raised: ranksOf(game)[game.renownMoment.rank]?.raised ?? "", meaning: ranksOf(game)[game.renownMoment.rank]?.meaning ?? "", n: game.renownMoment.n } } : {}),
    ...(discoveryView(game) ? { discovery: discoveryView(game) } : {}),
    ...(game.diceRoll
      ? { diceRoll: { n: game.diceRoll.n, groups: game.diceRoll.groups, plus: game.diceRoll.plus, total: game.diceRoll.total, ...(game.diceRoll.name ? { name: game.diceRoll.name } : {}), ...(game.diceRoll.for ? { for: game.diceRoll.for } : {}) } }
      : {}),
    // Reveal scenes, and portraits of people the party hasn't found, only while they're live.
    // Scenes that aren't up yet go out without their words (so the TV can preload the pictures): names, titles and descriptions wait until they're shown.
    scenes: game.scenes
      .filter((sc) => sc.id === game.live.sceneId || (!sc.reveal && !sceneSpoils(game, sc)))
      .map((sc) => {
        const out = publicScene(game, sc);
        if (sc.id !== game.live.sceneId) {
          delete out.name;
          delete out.title;
          delete out.alt;
          delete out.sheet;
        }
        return out;
      }),
    recap: publicRecap(game),
    ...(game.scenes.find((sc) => sc.id === game.live.sceneId)?.kind === "table" ? { table: projectTable(game) } : {}),
    ...(game.scenes.find((sc) => sc.id === game.live.sceneId)?.kind === "intro" ? { intro: projectIntro(game, Date.now()) } : {}),
    fight: publicFight(game),
    companions: publicCompanions(game),
  };
}

function tvLevelMoment(game: GameState, m: NonNullable<GameState["levelMoment"]>): NonNullable<TvView["levelMoment"]> {
  const who = m.levels.flatMap((l) => {
    const p = game.players.find((x) => x.id === l.playerId);
    return p ? [{ name: characterName(p), level: l.level }] : [];
  });
  return { n: m.n, level: sharedLevel(m.levels), who };
}

/** The fight, for the TV and phones. Portrait art only from scenes the room may see. */
function publicFight(game: GameState): FightView | null {
  return fightView(game, Date.now(), (sceneId) => {
    const sc = game.scenes.find((x) => x.id === sceneId);
    if (!sc || sc.reveal || sc.kind !== "portrait" || sceneSpoils(game, sc)) return undefined;
    return artForPublic(game, sc);
  });
}

function publicRecap(game: GameState): TvView["recap"] {
  const sess = game.live.recapSessionId ? game.sessions.find((x) => x.id === game.live.recapSessionId) : undefined;
  if (!sess?.recap?.trim()) return null;
  const out: NonNullable<TvView["recap"]> = { number: sess.number, title: sess.title, text: sess.recap };
  // Starred notes the DM picked, re-checked here: still starred, not hidden, from that chapter.
  const ids = game.live.recapNoteIds ?? [];
  const notes = notesOf(game).filter((n) => ids.includes(n.id) && n.sessionId === sess.id && n.starred && !n.hidden);
  if (notes.length) {
    out.notes = notes.map((n) => {
      const p = game.players.find((x) => x.id === n.authorId);
      return { text: n.text, author: p ? penName(p) : n.authorName };
    });
  }
  return out;
}

export function projectPlayer(table: GameState, version: number, playerId: string, ledger: LedgerEntry[]): PlayerView {
  if (!table.players.some((x) => x.id === playerId)) throw new Error("No such player");
  // A shared world: the phone shows what this character knows, and their parties' leads, chapters and jobs.
  const game = playerLens(table, playerId);
  const p = game.players.find((x) => x.id === playerId)!;
  return {
    ...(game.world ? { world: worldView(game, partiesFor(game, playerId)) } : {}),
    ...common(game, version, { tv: false, playerId }),
    role: "player",
    ...(game.vttUrl ? { vttUrl: game.vttUrl } : {}),
    ...(phoneMap(game) ? { map: phoneMap(game) } : {}),
    maps: knownMaps(game),
    live: { ...liveShop(game, { tv: false, playerId }), purseVisible: game.live.purseVisible },
    myOrders: game.orders
      .filter((o) => o.playerId === p.id)
      .map((o) => ({ id: o.id, itemName: o.itemName, arrivesAtSession: o.arrivesAtSession, arrived: o.arrived })),
    me: {
      id: p.id,
      handle: p.handle,
      name: p.name,
      ...(p.character?.trim() ? { character: p.character.trim() } : {}),
      balanceCp: p.balanceCp,
      ...(p.dndbUrl ? { dndbUrl: p.dndbUrl } : {}),
      locked: !!p.keyHash,
      archived: p.archived,
      heldCp: heldCp(game, p.id),
      hp: { cur: p.hp?.cur ?? 0, max: p.hp?.max ?? 0, temp: p.hp?.temp ?? 0, tv: p.hp?.tv !== false },
      ...(p.level ? { level: p.level } : {}),
    },
    ...(() => {
      const mine = game.levelMoment?.levels.find((l) => l.playerId === p.id);
      return mine ? { levelUp: { n: game.levelMoment!.n, level: mine.level } } : {};
    })(),
    fight: publicFight(game),
    myFight: myFight(game, p.id),
    companions: publicCompanions(game),
    myCompanions: controlledBy(game, p.id),
    myRolls: (game.rolls ?? [])
      .filter((r) => r.by === p.id)
      .slice(-5)
      .reverse()
      .map((r) => ({ n: r.n, at: r.at, groups: r.groups, plus: r.plus, total: r.total, to: r.to, ...(r.for ? { for: r.for } : {}) })),
    myRequests: game.requests
      .filter((r) => r.playerId === p.id && !r.hidden)
      .slice(-50)
      .reverse()
      .map((r) => {
        const out: MyRequest = { id: r.id, kind: r.kind, at: r.at, status: r.status, totalCp: r.totalCp, note: r.note, qty: r.qty };
        if (r.itemName !== undefined) out.itemName = r.itemName;
        if (r.toPlayerName !== undefined) {
          const to = r.toPlayerId ? game.players.find((x) => x.id === r.toPlayerId) : undefined;
          out.toPlayerName = to ? penName(to) : r.toPlayerName;
        }
        if (r.decidedAt !== undefined) out.decidedAt = r.decidedAt;
        if (r.reason !== undefined) out.reason = r.reason;
        if (r.chargedCp !== undefined) out.chargedCp = r.chargedCp;
        if (r.question) out.question = r.question;
        if (r.answer) out.answer = r.answer;
        if (r.flyer) out.flyerTitle = r.flyer.title;
        if (r.jobTitle) out.jobTitle = r.jobTitle;
        return out;
      }),
    mine: myThings(game, p.id),
    table: game.players.filter((x) => !x.archived && x.id !== p.id).map((x) => ({ id: x.id, name: penName(x) })),
    myLedger: ledger
      .filter((l) => l.playerId === p.id)
      .slice(-100)
      .reverse()
      .map((l) => ({ id: l.id, at: l.at, amountCp: l.amountCp, note: l.note })),
    chronicle: projectChronicle(game, { dm: false, playerId: p.id }),
    jobs: pinnedJobs(game).map((j) => {
      const pub = publicJob(game, j);
      const asked = game.requests.some((r) => r.status === "pending" && r.kind === "job" && r.jobId === j.id);
      return { ...pub, canTake: pub.status === "open" && !pub.needs && !pub.goodwill && !p.archived, asked } satisfies MyJob;
    }),
    entries: publicEntries(game, p.id),
    leads: leadsView(game, Date.now(), p.id),
    areas: areaCounts(game),
  };
}

/** Jobs on the board, in the order they went up. Pulled jobs never leave the server. */
function pinnedJobs(game: GameState): Job[] {
  return jobsOf(game)
    .filter((j) => j.pinned && j.status !== "expired")
    .sort((a, b) => (a.pinnedAt ?? a.createdAt) - (b.pinnedAt ?? b.createdAt));
}

/** The note on the TV up close, only while the board is the live scene. */
function closeUpOf(game: GameState): CloseUp | undefined {
  const want = game.live.note;
  if (!want || game.scenes.find((x) => x.id === game.live.sceneId)?.kind !== "notice") return undefined;
  if (want.kind === "notice") {
    const n = noticesOf(game).find((x) => x.id === want.id);
    return n ? { kind: "notice", notice: publicNotice(n) } : undefined;
  }
  if (want.kind === "job") {
    const j = jobsOf(game).find((x) => x.id === want.id);
    return j ? { kind: "job", job: publicJob(game, j) } : undefined;
  }
  const f = game.flyers.find((x) => x.id === want.id);
  return f ? { kind: "flyer", flyer: publicFlyer(f, game) } : undefined;
}

/** Field by field. */
export function publicFlyer(f: Flyer, game?: Pick<GameState, "parties">): PublicFlyer {
  const party = game ? partyName(game, f.partyId) : undefined;
  return {
    id: f.id,
    title: f.title,
    body: f.body,
    signedBy: f.signedBy,
    at: f.pinnedAt ?? f.postedAt,
    ...(f.style ? { style: f.style } : {}),
    ...(f.look ? { look: { ...f.look } } : {}),
    ...(f.place ? { place: { ...f.place } } : {}),
    ...(f.rewardCp && !f.rewardDone ? { rewardCp: f.rewardCp } : {}),
    ...(party ? { party } : {}),
  };
}

/** Field by field: the DM's note never goes out. */
export function publicNotice(n: Notice): PublicNotice {
  const sealed = n.style === "sealed";
  return { id: n.id, style: n.style, title: sealed ? "" : n.title, body: sealed ? "" : n.body, sign: sealed ? "" : n.sign, look: sealed ? (n.look.pin ? { pin: n.look.pin } : {}) : structuredClone(n.look), place: { ...n.place } };
}

/** Field by field: the DM's notes (adventure, loot, twists) never go out. */
export function publicJob(game: GameState, j: Job): PublicJob {
  const sealed = j.style === "sealed";
  const out: PublicJob = {
    id: j.id,
    style: j.style,
    status: j.status === "expired" ? "open" : j.status,
    title: sealed ? "" : jobTitle(j),
    postedBy: sealed ? "" : j.postedBy,
    body: sealed ? "" : j.body,
    reward: j.reward.kind === "hidden" || j.reward.cp <= 0 ? null : { kind: j.reward.kind, cp: j.reward.cp },
    at: j.pinnedAt ?? j.createdAt,
  };
  if (j.look && !sealed) out.look = structuredClone(j.look);
  else if (j.look?.pin) out.look = { pin: j.look.pin };
  if (j.place) out.place = { ...j.place };
  if (!renownMet(game, j.renown)) out.needs = rankName(j.renown, game);
  const trust = trustText(game, j.trust);
  if (trust) out.goodwill = trust;
  // A shared world counts chapters per party: the one that did it.
  const when = jobWhen(game.world && j.partyId ? { sessions: game.sessions.filter((x) => x.partyId === j.partyId) } : game, j);
  if (when) out.when = when;
  const party = j.status !== "open" && j.status !== "expired" ? partyName(game, j.partyId) : undefined;
  if (party) out.party = party;
  return out;
}

/** When a job was taken or done, and the chapter that was. */
export function jobWhen(game: Pick<GameState, "sessions">, j: Pick<Job, "status" | "takenAt" | "doneAt">): JobWhen | undefined {
  const at = j.status === "done" ? j.doneAt : j.status === "taken" ? j.takenAt : undefined;
  if (at === undefined) return undefined;
  const chapter = chapterAt(game, at);
  return chapter === undefined ? { at } : { at, chapter };
}

/** The chapter running at a time: the latest session started by then (between sessions, the one just played). */
export function chapterAt(game: Pick<GameState, "sessions">, at: number): number | undefined {
  let best: { number: number; startedAt: number } | undefined;
  for (const x of game.sessions) if (x.startedAt <= at && (!best || x.startedAt > best.startedAt)) best = x;
  return best?.number;
}

function myThings(game: GameState, playerId: string): MyThings {
  const items = new Map(game.items.map((i) => [i.id, i]));
  return {
    rentals: game.rentals.filter((r) => r.playerId === playerId && r.active).map((r) => ({ id: r.id, itemName: r.itemName, monthlyCp: r.monthlyCp })),
    trainings: game.trainings.filter((t) => t.playerId === playerId && !t.cancelled).map((t) => ({ id: t.id, itemName: t.itemName, what: t.what, paid: t.paid, of: t.of, done: t.done })),
    stakes: [...stakeTotals(game.stakes, playerId)].flatMap(([itemId, cp]) => {
      const it = items.get(itemId);
      if (!it) return [];
      const project = it.kind === "project";
      return [{ itemId, itemName: it.name, cp, project, ...(project ? { goalCp: it.priceCp, raisedCp: raisedCp(game, itemId), funded: !!game.effectsOn[itemId] } : {}) }];
    }),
    awards: game.awards.filter((a) => a.playerIds.includes(playerId)).map((a) => ({ id: a.id, itemName: a.itemName, at: a.at, note: a.note })),
    credit: creditLines(game, playerId).map((c) => ({ shopId: c.shopId, shopName: game.shops.find((x) => x.id === c.shopId)?.name ?? "the shop", limitCp: c.limitCp })),
  };
}

export function projectDm(game: GameState, version: number, ledger: LedgerEntry[]): DmView {
  const { players, ...rest } = structuredClone(game);
  // The keys phones keep for their invite seats stay on the server, even from the DM.
  for (const inv of rest.invites ?? []) for (const e of inv.entries) delete e.keyHash;
  return {
    role: "dm",
    version,
    state: { ...rest, players: players.map(({ keyHash, ...p }) => ({ ...p, hasKey: !!keyHash })) },
    ledger: [...ledger].reverse(),
    chronicle: projectChronicle(game, { dm: true }),
  };
}

/** Is a gated built-in allowed for a non-DM right now? */
export function gatedArtIsLive(game: GameState, builtin: string): boolean {
  const live = game.scenes.find((sc) => sc.id === game.live.sceneId);
  if (live?.art?.builtin === builtin) return true;
  // Built-in portraits: once the party has found whoever they show.
  return PORTRAIT_ART.has(builtin) && portraitArtAllowed(game, builtin);
}
