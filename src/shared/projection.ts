// Spoiler safety lives here. Each role gets a view built field-by-field from
// an explicit allow-list, so a new DM-only field can't leak by accident.

import { creditLines, discountPct, firstChargeCp, priceOf, raisedCp, stakeTotals } from "./progress";
import { heldCp, heldStock } from "./requests";
import { projectTable, type TableView } from "./arrival";
import { notesOf, penName, projectChronicle, type ChronicleView } from "./chronicle";
import { jobsOf, jobTitle, rankName, RENOWN, renownMet, renownNeeded, renownOf, shopOpenNow, tierOf } from "./renown";
import type { Art, Banner, FlyerText, GameState, Job, JobStyle, Item, ItemCategory, ItemKind, LedgerEntry, LegendStyle, LiveState, Player, RequestStatus, Scene, Shop } from "./types";

export const GATED_ART = new Set(["merchant-sigil"]);

export interface PublicScene {
  id: string;
  kind: Scene["kind"];
  art: Art;
  name?: string;
  title?: string;
  alt?: string;
  map?: PublicMap;
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
  /** Only on the live map. */
  focus?: { pinId: string; n: number };
  banner?: { n: number; name: string };
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
  /** When it went up (orders the pins with the jobs). */
  at: number;
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
  at: number;
}

/** A job on my phone. */
export interface MyJob extends PublicJob {
  /** Open, and the party has the Renown for it. */
  canTake: boolean;
  /** I've asked the DM for it. */
  asked: boolean;
  /** Taken by me (or the player who asked). */
  takenBy?: string;
}

export interface PublicRenown {
  rank: number;
  name: string;
  meaning: string;
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
  game: { id: string; name: string };
  purse: PublicPlayer[];
  shops: PublicShop[];
  items: PublicItem[];
  session: PublicSession | null;
  /** The latest "New at the Smithy" banner (only ever about things this viewer can see). */
  banner: Banner | null;
  /** The party's Renown. */
  renown: PublicRenown;
}

export interface TvView extends Common {
  role: "tv";
  live: Pick<LiveState, "sceneId" | "shopOpen" | "shopId" | "purseVisible" | "shopCategory">;
  /** Approved player flyers, while they're up. */
  flyers: PublicFlyer[];
  /** Pinned job flyers. */
  jobs: PublicJob[];
  /** The last rank-up: the TV plays the moment when n changes. */
  renownMoment?: { rank: number; name: string; n: number };
  /** Every non-reveal scene (for instant switching), plus the live scene even if it's a reveal. */
  scenes: PublicScene[];
  /** "Previously on…": only while the DM is showing it. The only session text the TV ever gets. */
  recap: { number: number; title: string; text: string; notes?: { text: string; author: string }[] } | null;
  /** The Table's seats and the QR links of unclaimed players: only while The Table is live. */
  table?: TableView;
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
    balanceCp: number;
    dndbUrl?: string;
    locked: boolean;
    archived: boolean;
    /** Gold held by my pending requests. */
    heldCp: number;
  };
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

export function artForPublic(game: GameState, sc: Scene): Art {
  const builtin = sc.art?.builtin;
  if (builtin && GATED_ART.has(builtin)) {
    // Gated art is only described to the TV while live, via a route that re-checks.
    return { url: `/api/art/${builtin}?game=${encodeURIComponent(game.id)}` };
  }
  const art: Art = {};
  if (builtin) art.builtin = builtin;
  if (sc.art?.url) art.url = sc.art.url;
  return art;
}

function publicScene(game: GameState, sc: Scene): PublicScene {
  const out: PublicScene = { id: sc.id, kind: sc.kind, art: artForPublic(game, sc) };
  if (sc.name !== undefined) out.name = sc.name;
  if (sc.title !== undefined) out.title = sc.title;
  if (sc.alt !== undefined) out.alt = sc.alt;
  if (sc.kind === "map" && sc.map) out.map = publicMap(game, sc);
  return out;
}

/** Only discovered pins, field by field. With the "numbers only" legend, names stay on the server. */
export function publicMap(game: GameState, sc: Scene): PublicMap {
  const m = sc.map!;
  const isLive = game.live.sceneId === sc.id;
  const shown = m.pins.filter((p) => p.discovered);
  const focus = isLive && game.live.focus && shown.some((p) => p.id === game.live.focus!.pinId) ? game.live.focus : undefined;
  const out: PublicMap = {
    pins: shown.map((p) => {
      const pin: PublicPin = { id: p.id, label: sealText(p), x: p.x, y: p.y };
      if (m.legendStyle === "names" || focus?.pinId === p.id) {
        pin.name = p.name;
        pin.type = p.type;
        pin.description = p.description;
      }
      return pin;
    }),
    legend: { on: m.legendOn, style: m.legendStyle },
    sealScale: m.sealScale ?? 1,
  };
  if (focus) out.focus = { pinId: focus.pinId, n: focus.n };
  const b = isLive ? game.live.banner : undefined;
  const bannerPin = b && shown.find((p) => p.id === b.pinId);
  if (b && bannerPin) out.banner = { n: b.n, name: bannerPin.name };
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
    out.earnedBy = game.players.filter((p) => ids.has(p.id)).map((p) => p.name);
  }
  if (tier === "locked") out.reason = it.reason;
  const need = renownNeeded(game, it);
  if (need !== null) out.needs = rankName(need);
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
  return {
    version,
    game: { id: game.id, name: game.name },
    purse: game.players.filter((p) => !p.archived && !p.away).map((p) => ({ id: p.id, name: p.name, balanceCp: p.balanceCp, inspired: !!p.inspired })),
    shops: shops.map((x) => ({ id: x.id, name: x.name, subtitle: x.subtitle, closed: !!x.closed, ...(renownMet(game, x.renown) ? {} : { needs: rankName(x.renown ?? 0) }) })),
    items: game.items.filter((it) => open.has(it.shopId)).map((it) => publicItem(game, it)).filter((x): x is PublicItem => x !== null),
    session: cur ? { number: cur.number, title: cur.title } : null,
    banner: game.banner ? { ...game.banner } : null,
    renown: { rank, name: RENOWN[rank].name, meaning: RENOWN[rank].meaning },
  };
}

/** The shop on the TV, but only if the viewer can see it (never leak a hidden shop's id). */
function liveShop(game: GameState, viewer: Viewer) {
  const sh = game.shops.find((x) => x.id === game.live.shopId);
  const ok = !!sh && shopVisibleTo(sh, { tv: true }) && shopVisibleTo(sh, viewer);
  return { shopOpen: ok && game.live.shopOpen, shopId: ok ? game.live.shopId : "" };
}

export function projectTv(game: GameState, version: number): TvView {
  return {
    ...common(game, version, { tv: true }),
    role: "tv",
    live: { sceneId: game.live.sceneId, ...liveShop(game, { tv: true }), purseVisible: game.live.purseVisible, ...(game.live.shopCategory ? { shopCategory: game.live.shopCategory } : {}) },
    flyers: game.flyers.filter((f) => f.up).map((f) => ({ id: f.id, title: f.title, body: f.body, signedBy: f.signedBy, at: f.pinnedAt ?? f.postedAt })),
    jobs: pinnedJobs(game).map((j) => publicJob(game, j)),
    ...(game.renownMoment ? { renownMoment: { rank: game.renownMoment.rank, name: rankName(game.renownMoment.rank), n: game.renownMoment.n } } : {}),
    scenes: game.scenes.filter((sc) => !sc.reveal || sc.id === game.live.sceneId).map((sc) => publicScene(game, sc)),
    recap: publicRecap(game),
    ...(game.scenes.find((sc) => sc.id === game.live.sceneId)?.kind === "table" ? { table: projectTable(game) } : {}),
  };
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

export function projectPlayer(game: GameState, version: number, playerId: string, ledger: LedgerEntry[]): PlayerView {
  const p = game.players.find((x) => x.id === playerId);
  if (!p) throw new Error("No such player");
  return {
    ...common(game, version, { tv: false, playerId }),
    role: "player",
    ...(game.vttUrl ? { vttUrl: game.vttUrl } : {}),
    live: { ...liveShop(game, { tv: false, playerId }), purseVisible: game.live.purseVisible },
    myOrders: game.orders
      .filter((o) => o.playerId === p.id)
      .map((o) => ({ id: o.id, itemName: o.itemName, arrivesAtSession: o.arrivesAtSession, arrived: o.arrived })),
    me: {
      id: p.id,
      handle: p.handle,
      name: p.name,
      balanceCp: p.balanceCp,
      ...(p.dndbUrl ? { dndbUrl: p.dndbUrl } : {}),
      locked: !!p.keyHash,
      archived: p.archived,
      heldCp: heldCp(game, p.id),
    },
    myRequests: game.requests
      .filter((r) => r.playerId === p.id)
      .slice(-50)
      .reverse()
      .map((r) => {
        const out: MyRequest = { id: r.id, kind: r.kind, at: r.at, status: r.status, totalCp: r.totalCp, note: r.note, qty: r.qty };
        if (r.itemName !== undefined) out.itemName = r.itemName;
        if (r.toPlayerName !== undefined) out.toPlayerName = r.toPlayerName;
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
    table: game.players.filter((x) => !x.archived && x.id !== p.id).map((x) => ({ id: x.id, name: x.name })),
    myLedger: ledger
      .filter((l) => l.playerId === p.id)
      .slice(-100)
      .reverse()
      .map((l) => ({ id: l.id, at: l.at, amountCp: l.amountCp, note: l.note })),
    chronicle: projectChronicle(game, { dm: false, playerId: p.id }),
    jobs: pinnedJobs(game).map((j) => {
      const pub = publicJob(game, j);
      const asked = game.requests.some((r) => r.status === "pending" && r.kind === "job" && r.jobId === j.id && r.playerId === p.id);
      const out: MyJob = { ...pub, canTake: pub.status === "open" && !pub.needs && !p.archived, asked };
      const by = j.takenBy?.[0] && game.players.find((x) => x.id === j.takenBy![0]);
      if (by && pub.status !== "open") out.takenBy = by.name;
      return out;
    }),
  };
}

/** Jobs on the board, in the order they went up. Pulled jobs never leave the server. */
function pinnedJobs(game: GameState): Job[] {
  return jobsOf(game)
    .filter((j) => j.pinned && j.status !== "expired")
    .sort((a, b) => (a.pinnedAt ?? a.createdAt) - (b.pinnedAt ?? b.createdAt));
}

/** Field by field: the DM's notes (adventure, loot, twists) never go out. */
function publicJob(game: GameState, j: Job): PublicJob {
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
  if (!renownMet(game, j.renown)) out.needs = rankName(j.renown);
  return out;
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
  return !!live && live.art?.builtin === builtin;
}
