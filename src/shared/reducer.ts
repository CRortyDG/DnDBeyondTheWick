// Pure game rules. Every write goes: validate actor -> apply() -> atomic save.
// apply() never mutates its input and never does I/O, so it's easy to test.

import type { Command } from "./commands";
import { displayNameFrom, isReservedHandle, normaliseHandle } from "./handles";
import { canAfford, formatCp } from "./money";
import { beatBody } from "./commands";
import { availableCp, availableStock, boughtPhrase, heldStock, isSecretShop } from "./requests";
import { candlefairMap, emptyProgress, SEED_ITEMS, SEED_SHOPS, swordCoastMap } from "./seed";
import { creditCp, duesFor, firstChargeCp, installmentCp, keepsStake, liveEffects, priceOf, raisedCp, rollDice, sharesOf, splitByShare } from "./progress";
import { shopVisibleTo } from "./projection";
import type { Actor, Beat, BeatAction, Episode, FlyerText, GameState, Item, ItemTier, LedgerEntry, LedgerKind, MapData, Pin, PinLink, Player, Scene, Session, SessionRun, Shop, TradeRequest } from "./types";
import type { z } from "zod";

export class CommandError extends Error {
  /** "recheck": a phone request no longer works at approval time; the DM may override or decline. */
  constructor(
    message: string,
    public code?: string,
  ) {
    super(message);
  }
}

export interface Ctx {
  now: number;
  actor: Actor;
  /** Dice for income rolls. Defaults to Math.random; tests pass their own. */
  rand?: () => number;
}

export interface Result {
  state: GameState;
  ledger: LedgerEntry[];
  /** Created player id for system.join / player.add / knock.admit. */
  playerId?: string;
  /** Created episode / beat ids. */
  episodeId?: string;
  beatId?: string;
  /** A note for whoever sent the command ("2 approved, 1 still needs you"). */
  info?: string;
}

function fail(msg: string, code?: string): never {
  throw new CommandError(msg, code);
}

export function isDmCommand(type: string): boolean {
  return !type.startsWith("me.") && !type.startsWith("system.");
}

export function apply(input: GameState, cmd: Command, ctx: Ctx): Result {
  // Authorisation is checked again here so a wiring mistake can't let a player run DM commands.
  if (isDmCommand(cmd.type) && ctx.actor.role !== "dm") fail("Only the DM can do that.");
  if (cmd.type.startsWith("me.") && ctx.actor.role !== "player") fail("Only a player can do that.");
  if (cmd.type.startsWith("system.") && ctx.actor.role !== "system") fail("Not allowed.");

  const s: GameState = structuredClone(input);
  // The server fills in the seed episode when it reads an older game (see withSeedEpisodes on the server).
  const episodes = (s.episodes ??= []);
  const ledger: LedgerEntry[] = [];
  const out: Result = { state: s, ledger };

  const nextId = (prefix: string) => prefix + (++s.seq).toString(36);
  const player = (id: string): Player => s.players.find((p) => p.id === id) ?? fail("That player isn't here.");
  const scene = (id: string): Scene => s.scenes.find((x) => x.id === id) ?? fail("That scene doesn't exist.");
  const shop = (id: string): Shop => s.shops.find((x) => x.id === id) ?? fail("That shop doesn't exist.");

  /** A short TV banner. Several in one command (an order arrives and income pays out) share it. */
  const said: string[] = [];
  const announce = (text: string) => {
    said.push(text);
    s.banner = { id: s.banner && said.length > 1 ? s.banner.id : nextId("bn"), text: said.join(" · "), at: ctx.now };
  };
  /** Announce only what the whole room may see: storefronts open to everyone, never secret ones. */
  const announcePublic = (shopId: string, text: string) => {
    const sh = s.shops.find((x) => x.id === shopId);
    if (sh && sh.visibility === "all" && !isSecretShop(sh)) announce(text);
  };
  const rand = ctx.rand ?? Math.random;
  const item = (id: string): Item => s.items.find((x) => x.id === id) ?? fail("That item doesn't exist.");
  /** The session a payment made now covers: the running one, or the next one between sessions. */
  const coversSession = () => s.sessions.find((x) => x.id === s.currentSessionId)?.number ?? nextSessionNumber(s);
  const task = (text: string, extra: { playerId?: string; itemId?: string } = {}) => {
    s.tasks.push({ id: nextId("t"), at: ctx.now, text, done: false, ...extra });
    // Keep every open task and the latest 100 done ones.
    const done = s.tasks.filter((t) => t.done);
    if (done.length > 100) {
      const drop = new Set(done.slice(0, done.length - 100).map((t) => t.id));
      s.tasks = s.tasks.filter((t) => !drop.has(t.id));
    }
  };
  const RANK: Record<ItemTier, number> = { hidden: 0, rumored: 1, locked: 2, sale: 3 };
  /** Banner when an item becomes more visible in a shop the whole party can see. */
  const announceItem = (it: Item, was: ItemTier) => {
    const sh = shop(it.shopId);
    if (sh.visibility !== "all" || sh.closed || RANK[it.tier] <= RANK[was]) return;
    if (it.tier === "rumored") announce(`A new rumor at ${sh.name}`);
    else announce(`New at ${sh.name}: ${it.name}`);
  };

  const move = (p: Player, amountCp: number, note: string, kind: LedgerKind, extra: Partial<LedgerEntry> = {}) => {
    p.balanceCp += amountCp;
    ledger.push({
      id: nextId("l"),
      at: ctx.now,
      playerId: p.id,
      playerName: p.name,
      amountCp,
      note,
      kind,
      sessionId: s.currentSessionId,
      ...extra,
    });
  };

  /** Effects apply once per item: unlocks and discounts the first time, credit and income for every stake. */
  const turnOn = (it: Item) => {
    if (s.effectsOn[it.id]) return;
    s.effectsOn[it.id] = ctx.now;
    for (const e of it.effects ?? []) {
      if (e.type !== "unlock") continue;
      const target = e.itemId ? s.items.find((x) => x.id === e.itemId) : undefined;
      if (target && target.tier !== "sale") {
        const was = target.tier;
        target.tier = "sale";
        announceItem(target, was);
      }
      const sh = e.shopId ? s.shops.find((x) => x.id === e.shopId) : undefined;
      if (sh && sh.visibility !== "all") {
        sh.visibility = "all";
        sh.playerIds = [];
        if (!isSecretShop(sh)) announce(sh.closed ? `${sh.name} has come to town` : `Now open: ${sh.name}`);
      }
    }
  };

  const addStake = (it: Item, p: Player, cp: number) => {
    const k = s.stakes.find((x) => x.itemId === it.id && x.playerId === p.id);
    if (k) k.cp += cp;
    else s.stakes.push({ itemId: it.id, playerId: p.id, cp, at: ctx.now });
  };

  /** Money toward a project. Funding it applies its effects, once. */
  const contribute = (p: Player, it: Item, cp: number, extra: Partial<LedgerEntry> = {}) => {
    move(p, -cp, `Put ${formatCp(cp)} toward ${it.name}`, "contribution", { itemId: it.id, ...extra });
    addStake(it, p, cp);
    if (!s.effectsOn[it.id] && raisedCp(s, it.id) >= it.priceCp) {
      announcePublic(it.shopId, `Funded: ${it.name}!`);
      turnOn(it);
      const who = [...sharesOf(s, it.id).keys()].map((id) => s.players.find((x) => x.id === id)?.name ?? "someone").join(", ");
      task(`Funded: ${it.name} (by ${who}).${it.dmNote ? ` Your note: ${it.dmNote}` : ""}`, { itemId: it.id });
    }
  };

  /** Fails unless a project can still take money; returns what's left to raise. */
  const projectLeft = (it: Item, recheck = false): number => {
    if (it.kind !== "project") fail(`${it.name} isn't a project.`);
    if (s.effectsOn[it.id]) fail(`${it.name} is already funded.`, recheck ? "recheck" : undefined);
    return Math.max(0, it.priceCp - raisedCp(s, it.id));
  };

  /** Can p pay this here? Credit (Mags's tab) only counts at its own storefront. */
  const canPay = (p: Player, cp: number, shopId: string) => p.balanceCp - cp >= -creditCp(s, p.id, shopId);

  /**
   * Take stock, write the ledger, and do whatever this kind of item does:
   * place an order, start a rental or lessons, post a flyer. Checks are the caller's job.
   */
  const fulfil = (p: Player, it: Item, qty: number, chargeCp: number, extra: Partial<LedgerEntry> = {}, more: { question?: string; flyer?: FlyerText } = {}) => {
    if (it.kind === "earned") fail(`${it.name} can't be bought. You grant it.`);
    if (it.kind === "project") fail(`${it.name} is a project: contribute to it instead.`);
    if (it.stock !== null) it.stock = Math.max(0, it.stock - qty);
    const listCp = firstChargeCp(s, it) * qty;
    const haggled = chargeCp !== listCp ? ` (${formatCp(listCp)}, settled at ${formatCp(chargeCp)})` : "";
    const what = qty > 1 ? `${qty} × ${it.name}` : it.name;
    const ledgerExtra: Partial<LedgerEntry> = { itemId: it.id, ...(chargeCp !== listCp ? { listCp } : {}), ...extra };
    const question = more.question?.trim();
    if (it.kind === "recurring") {
      move(p, -chargeCp, `Rented ${it.name} (first month)${haggled}`, "rent", ledgerExtra);
      s.rentals.push({ id: nextId("rn"), itemId: it.id, itemName: it.name, playerId: p.id, monthlyCp: priceOf(s, it), startedAt: ctx.now, paidThrough: coversSession(), active: true });
    } else if (it.kind === "training") {
      const of = it.installments ?? 1;
      const totalCp = priceOf(s, it) - listCp + chargeCp;
      const t = { id: nextId("tr"), itemId: it.id, itemName: it.name, playerId: p.id, what: question ?? "", totalCp, of, paid: 1, paidCp: chargeCp, paidThrough: coversSession(), done: of <= 1 };
      s.trainings.push(t);
      move(p, -chargeCp, `${it.name}${t.what ? ` (${t.what})` : ""}: lesson 1 of ${of}${haggled}`, "purchase", ledgerExtra);
      if (t.done) task(`Record a new proficiency: ${p.name} finished ${it.name}${t.what ? `: ${t.what}` : ""}.`, { playerId: p.id, itemId: it.id });
    } else if (it.arrivesInSessions) {
      const now = s.sessions.find((x) => x.id === s.currentSessionId)?.number ?? nextSessionNumber(s) - 1;
      const arrivesAtSession = now + it.arrivesInSessions;
      for (let i = 0; i < qty; i++) {
        s.orders.push({ id: nextId("o"), playerId: p.id, itemId: it.id, itemName: it.name, priceCp: Math.round(chargeCp / qty), orderedAt: ctx.now, arrivesAtSession, arrived: false });
      }
      move(p, -chargeCp, `Ordered ${what} (arrives session ${arrivesAtSession})${haggled}`, "purchase", ledgerExtra);
    } else if (it.kind === "service") {
      move(p, -chargeCp, `${it.name}${question ? `: ${question}` : ""}${haggled}`, "purchase", ledgerExtra);
      if (more.flyer) s.flyers.push({ id: nextId("fl"), playerId: p.id, ...cleanFlyer(more.flyer, p.name), postedAt: ctx.now, up: true });
    } else {
      move(p, -chargeCp, `Bought ${what}${haggled}`, "purchase", ledgerExtra);
    }
    if (keepsStake(it)) addStake(it, p, chargeCp);
    if (it.effects?.length) turnOn(it);
  };

  const request = (id: string): TradeRequest => s.requests.find((r) => r.id === id) ?? fail("That request doesn't exist.");

  /** Keep every pending request and the latest 150 decided ones. */
  const pruneRequests = () => {
    const decided = s.requests.filter((r) => r.status !== "pending");
    if (decided.length <= 150) return;
    const drop = new Set(decided.slice(0, decided.length - 150).map((r) => r.id));
    s.requests = s.requests.filter((r) => !drop.has(r.id));
  };

  /**
   * Approve one request. Every check runs before anything changes, so a
   * failed check leaves the state untouched (Approve all relies on that).
   */
  const approve = (r: TradeRequest, totalCp: number | undefined, override: boolean, more: { answer?: string; flyer?: FlyerText } = {}) => {
    if (r.status !== "pending") fail(`That request was already ${r.status}.`);
    const p = player(r.playerId);
    if (r.kind === "contribute") {
      const it = s.items.find((x) => x.id === r.itemId) ?? fail(`${r.itemName ?? "That project"} is no longer in the shop. Decline it instead.`);
      const left = projectLeft(it, true);
      // Never take more than the project still needs.
      const charge = Math.min(totalCp ?? r.totalCp, left);
      if (!override) {
        if (p.archived) fail(`${p.name} has left the table.`, "recheck");
        if (p.balanceCp < charge) fail(`${p.name} only has ${formatCp(p.balanceCp)} now, not ${formatCp(charge)}.`, "recheck");
      }
      contribute(p, it, charge, { requestId: r.id });
      r.chargedCp = charge;
      r.status = "approved";
      r.decidedAt = ctx.now;
      return;
    }
    if (r.kind === "give") {
      const to = player(r.toPlayerId ?? "");
      if (!override && p.balanceCp < r.totalCp) fail(`${p.name} only has ${formatCp(p.balanceCp)} now, not ${formatCp(r.totalCp)}.`, "recheck");
      if (!override && to.archived) fail(`${to.name} has left the table.`, "recheck");
      const batchId = nextId("b");
      const note = r.note ? `: ${r.note}` : "";
      move(p, -r.totalCp, `Sent ${formatCp(r.totalCp)} to ${to.name}${note}`, "transfer", { batchId, requestId: r.id });
      move(to, r.totalCp, `From ${p.name}${note}`, "transfer", { batchId, requestId: r.id });
      r.chargedCp = r.totalCp;
    } else {
      const item = s.items.find((x) => x.id === r.itemId) ?? fail(`${r.itemName ?? "That item"} is no longer in the shop. Decline it instead.`);
      const charge = totalCp ?? r.totalCp;
      if (!override) {
        if (p.archived) fail(`${p.name} has left the table.`, "recheck");
        if (!canPay(p, charge, item.shopId)) fail(`${p.name} only has ${formatCp(p.balanceCp)} now, not ${formatCp(charge)}.`, "recheck");
        if (item.kind === "recurring" && s.rentals.some((x) => x.active && x.itemId === item.id && x.playerId === p.id)) fail(`${p.name} already rents ${item.name}.`, "recheck");
        if (item.stock !== null && item.stock - heldStock(s, item.id, r.id) < r.qty) {
          fail(item.stock === 0 ? `${item.name} is sold out now.` : `Only ${item.stock} ${item.name} left now.`, "recheck");
        }
        if (item.tier !== "sale") fail(`${item.name} isn't for sale any more.`, "recheck");
      }
      const flyer = more.flyer ?? r.flyer;
      if (flyer) r.flyer = cleanFlyer(flyer, p.name);
      fulfil(p, item, r.qty, charge, { requestId: r.id }, { question: r.question, flyer: r.flyer });
      r.chargedCp = charge;
      const answer = more.answer?.trim();
      if (answer) r.answer = answer;
      if (s.tvPurchases !== false && !r.secret && !isSecretShop(s.shops.find((x) => x.id === item.shopId)) && (item.kind === "purchase" || item.kind === "order")) {
        announce(`${p.name} bought ${boughtPhrase(item.name, r.qty)}`);
      }
    }
    r.status = "approved";
    r.decidedAt = ctx.now;
  };

  /** The player sending a me.* command. */
  const me = (): Player => {
    const p = player(ctx.actor.role === "player" ? ctx.actor.playerId : "");
    if (p.archived) fail("You've left the table. Ask the DM to bring you back.");
    return p;
  };

  const uniqueHandle = (base: string, exceptId?: string) => {
    let h = base || "player";
    let n = 2;
    while (isReservedHandle(h) || s.players.some((p) => p.handle === h && p.id !== exceptId)) h = `${base}${n++}`;
    return h;
  };

  const createPlayer = (handle: string, name: string, via: Player["createdVia"], keyHash?: string): Player => {
    const p: Player = {
      id: nextId("p"),
      handle: uniqueHandle(handle),
      name: name.trim().slice(0, 32) || displayNameFrom(handle),
      away: false,
      archived: false,
      dropIn: via === "url",
      balanceCp: 0,
      createdAt: ctx.now,
      createdVia: via,
      ...(keyHash ? { keyHash } : {}),
    };
    s.players.push(p);
    out.playerId = p.id;
    markAttending(p.id);
    return p;
  };

  const markAttending = (playerId: string) => {
    const cur = s.sessions.find((x) => x.id === s.currentSessionId);
    if (cur && !cur.attendeeIds.includes(playerId)) cur.attendeeIds.push(playerId);
  };

  const homeScene = () => (s.scenes.find((x) => x.kind === "notice" && !x.reveal) ?? s.scenes.find((x) => !x.reveal) ?? s.scenes[0]).id;

  const showScene = (id: string) => {
    s.live.sceneId = id;
    s.live.shopOpen = false;
    delete s.live.recapSessionId;
    delete s.live.focus;
    delete s.live.banner;
  };

  const startSession = (title?: string): Session => {
    const number = nextSessionNumber(s);
    const sess: Session = {
      id: nextId("sess"),
      number,
      title: title?.trim() || `Session ${number}`,
      startedAt: ctx.now,
      endedAt: null,
      attendeeIds: s.players.filter((p) => !p.archived && !p.away).map((p) => p.id),
    };
    s.sessions.push(sess);
    s.currentSessionId = sess.id;
    showScene(homeScene());
    // Special orders due by this session arrive (whether started here or by run-game).
    const due = s.orders.filter((o) => !o.arrived && o.arrivesAtSession <= number);
    for (const o of due) o.arrived = true;
    const log: string[] = due.map((o) => `Arrived: ${o.itemName} for ${s.players.find((p) => p.id === o.playerId)?.name ?? "someone"}`);
    if (due.length === 1) announce(`Arrived from Baldur\u2019s Gate: ${due[0].itemName} for ${s.players.find((p) => p.id === due[0].playerId)?.name ?? "someone"}`);
    else if (due.length > 1) announce(`${due.length} special orders have arrived from Baldur\u2019s Gate`);
    // Income: roll for each live income effect and pay the owners by share.
    for (const { item: it, effect } of liveEffects(s, "income")) {
      const owners = [...sharesOf(s, it.id)].filter(([pid]) => s.players.some((p) => p.id === pid && !p.archived));
      if (!owners.length) continue;
      const roll = rollDice(effect.dice, rand);
      const total = roll * effect.unitCp;
      for (const [pid, cp] of splitByShare(total, owners)) {
        if (cp > 0) move(player(pid), cp, `${it.name}: your share (rolled ${roll} on ${effect.dice})`, "income", { itemId: it.id });
      }
      log.push(`${it.name}: rolled ${roll} on ${effect.dice}, paid ${formatCp(total)}`);
      if (total > 0) announcePublic(it.shopId, `${it.name} paid ${formatCp(total)}`);
    }
    if (log.length) sess.startLog = log;
    return sess;
  };

  // ---------- run-game helpers ----------
  const episode = (id: string): Episode => episodes.find((e) => e.id === id) ?? fail("That episode doesn't exist.");
  const session = (id: string): Session => s.sessions.find((x) => x.id === id) ?? fail("That session doesn't exist.");
  const curSession = (): Session => s.sessions.find((x) => x.id === s.currentSessionId) ?? fail("No session is running.");
  const curRun = () => {
    const sess = curSession();
    const run = sess.run ?? fail("This session isn't running an episode. Start run-game mode first.");
    return { sess, run, ep: episode(run.episodeId) };
  };
  const makeBeat = (b: z.infer<typeof beatBody>): Beat => {
    const beat: Beat = { id: nextId("b"), title: b.title.trim() || "New beat", notes: b.notes, checks: b.checks, branches: b.branches, actions: b.actions };
    if (b.readAloud?.length) {
      beat.readAloud = b.readAloud;
      beat.readAloudAt = Math.min(b.readAloudAt ?? 0, b.notes.length);
    }
    return beat;
  };
  const fireAction = (a: BeatAction) => {
    if (a.type === "scene") {
      if (s.scenes.some((x) => x.id === a.sceneId)) showScene(a.sceneId);
    } else if (a.type === "black") {
      const black = s.scenes.find((x) => x.kind === "black");
      if (black) showScene(black.id);
    } else if (a.type === "bank") {
      // The bank is the DM's screen; the TV shows the purse.
      s.live.purseVisible = true;
      s.live.shopOpen = false;
      delete s.live.recapSessionId;
    }
  };
  const land = (run: SessionRun, ep: Episode, i: number, skip: number[] = []) => {
    run.stage = "beat";
    run.beat = i;
    ep.beats[i].actions.forEach((a, k) => {
      if (!skip.includes(k)) fireAction(a);
    });
  };
  /** Runs of this episode in the current session, so edits keep pointing at the same beat. */
  const keepCurrentBeat = (ep: Episode, edit: () => void) => {
    const run = s.sessions.find((x) => x.id === s.currentSessionId)?.run;
    const mine = run && run.episodeId === ep.id ? run : null;
    const beatId = mine ? ep.beats[mine.beat]?.id : undefined;
    edit();
    if (!mine) return;
    const i = beatId ? ep.beats.findIndex((b) => b.id === beatId) : -1;
    mine.beat = i >= 0 ? i : Math.max(0, Math.min(mine.beat, ep.beats.length - 1));
    if (!ep.beats.length && mine.stage === "beat") mine.stage = "start";
  };
  /** Where a new session of this episode picks up: the beat the last unfinished run stopped on. */
  const resumeBeat = (episodeId: string): number => {
    const last = s.sessions
      .filter((x) => x.endedAt !== null && x.run?.episodeId === episodeId)
      .sort((a, b) => (b.endedAt ?? 0) - (a.endedAt ?? 0))[0];
    if (!last?.run || last.run.stage === "end") return 0;
    return last.run.beat;
  };

  const mapOf = (sceneId: string): MapData => {
    const sc = scene(sceneId);
    if (sc.kind !== "map") fail("That scene isn't a map.");
    return (sc.map ??= emptyMap());
  };
  const pinOf = (m: MapData, pinId: string): Pin => m.pins.find((p) => p.id === pinId) ?? fail("That location isn't on this map.");
  const checkLink = (link: PinLink) => {
    if (link.kind === "shop" && !s.shops.some((x) => x.id === link.shopId)) fail("That shop doesn't exist.");
    if (link.kind === "scene" && !s.scenes.some((x) => x.id === link.sceneId)) fail("That scene doesn't exist.");
  };
  /** Stop zooming the TV toward a pin that's gone or hidden. */
  const dropFocus = (pinId: string) => {
    if (s.live.focus?.pinId === pinId) delete s.live.focus;
    if (s.live.banner?.pinId === pinId) delete s.live.banner;
  };

  switch (cmd.type) {
    // ---------- scenes ----------
    case "scene.show":
      showScene(scene(cmd.sceneId).id);
      break;
    case "scene.step": {
      const i = s.scenes.findIndex((x) => x.id === s.live.sceneId);
      const n = s.scenes.length;
      showScene(s.scenes[(((i < 0 ? 0 : i) + cmd.dir) % n + n) % n].id);
      break;
    }
    case "scene.hotkey": {
      const sc = s.scenes.find((x) => x.hotkey === cmd.key) ?? fail(`No scene on key ${cmd.key}.`);
      showScene(sc.id);
      break;
    }
    case "scene.add": {
      const used = new Set(s.scenes.map((x) => x.hotkey));
      const free = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0].find((k) => !used.has(k)) ?? null;
      const sc: Scene = { id: nextId("s"), label: cmd.label.trim() || "New scene", kind: cmd.kind, hotkey: free, reveal: false, art: {} };
      if (cmd.kind === "portrait") Object.assign(sc, { name: sc.label, title: "" });
      if (cmd.kind === "map") sc.map = emptyMap();
      s.scenes.push(sc);
      break;
    }
    case "scene.update": {
      const sc = scene(cmd.sceneId);
      const { patch } = cmd;
      if (patch.hotkey !== undefined && patch.hotkey !== null) {
        for (const other of s.scenes) if (other.id !== sc.id && other.hotkey === patch.hotkey) other.hotkey = null;
      }
      if (patch.art?.url && !/^(https:\/\/|\/api\/files\/)/.test(patch.art.url)) fail("Images must be uploaded first.");
      Object.assign(sc, patch);
      if (patch.label !== undefined) sc.label = patch.label.trim() || sc.label;
      // Pins survive a kind change, so switching to Image and back loses nothing.
      if (sc.kind === "map") sc.map ??= emptyMap();
      break;
    }
    case "scene.remove": {
      if (s.scenes.length <= 1) fail("Keep at least one scene.");
      scene(cmd.sceneId);
      s.scenes = s.scenes.filter((x) => x.id !== cmd.sceneId);
      if (s.live.sceneId === cmd.sceneId) {
        s.live.sceneId = homeScene();
        delete s.live.focus;
        delete s.live.banner;
      }
      for (const sc of s.scenes) for (const p of sc.map?.pins ?? []) if (p.link?.kind === "scene" && p.link.sceneId === cmd.sceneId) delete p.link;
      break;
    }
    case "scene.move": {
      const i = s.scenes.findIndex((x) => x.id === cmd.sceneId);
      if (i < 0) fail("That scene doesn't exist.");
      const j = i + cmd.dir;
      if (j >= 0 && j < s.scenes.length) [s.scenes[i], s.scenes[j]] = [s.scenes[j], s.scenes[i]];
      break;
    }

    // ---------- maps ----------
    case "pin.add": {
      const m = mapOf(cmd.sceneId);
      if (m.pins.some((p) => p.id === cmd.pinId)) fail("That location already exists.");
      m.pins.push({ id: cmd.pinId, number: lowestFreeNumber(m.pins), showsAs: "", name: "", type: "", description: "", dmNotes: "", discovered: false, x: cmd.x, y: cmd.y });
      m.pins.sort((a, b) => a.number - b.number);
      break;
    }
    case "pin.update": {
      const m = mapOf(cmd.sceneId);
      const p = pinOf(m, cmd.pinId);
      const { link, ...rest } = cmd.patch;
      Object.assign(p, rest);
      if (rest.showsAs !== undefined) p.showsAs = rest.showsAs.trim();
      if (rest.name !== undefined) p.name = rest.name.trim();
      if (rest.type !== undefined) p.type = rest.type.trim();
      if (link === null) delete p.link;
      else if (link) {
        checkLink(link);
        p.link = link;
      }
      break;
    }
    case "pin.remove": {
      const m = mapOf(cmd.sceneId);
      pinOf(m, cmd.pinId);
      m.pins = m.pins.filter((p) => p.id !== cmd.pinId);
      dropFocus(cmd.pinId);
      break;
    }
    case "pin.restore": {
      const m = mapOf(cmd.sceneId);
      if (m.pins.some((p) => p.id === cmd.pin.id)) fail("That location is already back.");
      const { link, ...rest } = cmd.pin;
      const number = m.pins.some((p) => p.number === rest.number) ? lowestFreeNumber(m.pins) : rest.number;
      const pin: Pin = { ...rest, number };
      if (link && (link.kind === "shop" ? s.shops.some((x) => x.id === link.shopId) : s.scenes.some((x) => x.id === link.sceneId))) pin.link = link;
      m.pins.push(pin);
      m.pins.sort((a, b) => a.number - b.number);
      break;
    }
    case "pin.discover": {
      const m = mapOf(cmd.sceneId);
      const p = pinOf(m, cmd.pinId);
      const was = p.discovered;
      p.discovered = cmd.discovered;
      if (!cmd.discovered) dropFocus(p.id);
      else if (!was && cmd.announce && s.live.sceneId === cmd.sceneId) s.live.banner = { pinId: p.id, n: ++s.seq };
      break;
    }
    case "map.legend": {
      const m = mapOf(cmd.sceneId);
      if (cmd.on !== undefined) m.legendOn = cmd.on;
      if (cmd.style !== undefined) m.legendStyle = cmd.style;
      break;
    }
    case "live.focus": {
      if (cmd.pinId === null) {
        delete s.live.focus;
        break;
      }
      const m = mapOf(s.live.sceneId);
      const p = pinOf(m, cmd.pinId);
      if (!p.discovered) fail("Discover that location first; the TV can't see it yet.");
      s.live.focus = { pinId: p.id, n: ++s.seq };
      break;
    }
    case "map.addSeedMaps": {
      // Turn the old empty "Town map" image scene into the Candlefair map (keeping any image), then add the Sword Coast.
      let cf = s.scenes.find((x) => x.id === "s-map");
      if (cf && cf.kind === "image") {
        cf.kind = "map";
        if (cf.label === "Town map") cf.label = "Candlefair map";
        cf.map = candlefairMap();
      } else if (!s.scenes.some((x) => x.kind === "map" && x.label === "Candlefair map")) {
        cf = { id: nextId("s"), label: "Candlefair map", kind: "map", hotkey: null, reveal: false, art: {}, alt: "Map of Candlefair", map: candlefairMap() };
        s.scenes.push(cf);
      } else cf = s.scenes.find((x) => x.kind === "map" && x.label === "Candlefair map");
      if (!s.scenes.some((x) => x.kind === "map" && x.label === "Sword Coast map")) {
        const used = new Set(s.scenes.map((x) => x.hotkey));
        s.scenes.push({ id: s.scenes.some((x) => x.id === "s-swordcoast") ? nextId("s") : "s-swordcoast", label: "Sword Coast map", kind: "map", hotkey: used.has(9) ? null : 9, reveal: false, art: {}, alt: "Map of the Sword Coast", map: swordCoastMap(cf!.id) });
      }
      // Drop shop links to shops this game no longer has.
      for (const sc of s.scenes) {
        for (const p of sc.map?.pins ?? []) {
          const l = p.link;
          if (l?.kind === "shop" && !s.shops.some((x) => x.id === l.shopId)) delete p.link;
        }
      }
      break;
    }

    // ---------- what the TV shows ----------
    case "live.shop": {
      if (cmd.category !== undefined) {
        if (cmd.category) s.live.shopCategory = cmd.category;
        else delete s.live.shopCategory;
      } else if (cmd.shopId) delete s.live.shopCategory;
      const target = shop(cmd.shopId ?? s.live.shopId);
      if (cmd.open && !s.live.shopCategory && target.visibility !== "all") fail(`${target.name} is hidden from the party. Open it to everyone first.`);
      if (cmd.open && s.live.shopCategory && !s.shops.some((x) => x.visibility === "all" && !x.closed)) fail("No storefront is open to everyone yet.");
      s.live.shopId = target.id;
      s.live.shopOpen = cmd.open;
      if (cmd.open) delete s.live.recapSessionId;
      break;
    }
    case "live.purse":
      s.live.purseVisible = cmd.visible;
      break;

    // ---------- money ----------
    case "money.adjust": {
      const p = player(cmd.playerId);
      if (cmd.amountCp === 0) fail("Enter an amount.");
      if (cmd.amountCp < 0 && p.balanceCp + cmd.amountCp < 0 && !cmd.allowDebt) {
        fail(`${p.name} only has ${formatCp(p.balanceCp)}. Tick “allow debt” to take more.`);
      }
      move(p, cmd.amountCp, cmd.note.trim() || (cmd.amountCp > 0 ? "Reward" : "Spent"), cmd.amountCp > 0 ? "grant" : "charge");
      break;
    }
    case "money.payAll": {
      if (cmd.amountCp <= 0) fail("Enter an amount.");
      const ids = [...new Set(cmd.playerIds)];
      if (!ids.length) fail("Pick at least one player.");
      const batchId = nextId("b");
      const note = cmd.note.trim() || "Party pay";
      for (const pid of ids) {
        const p = player(pid);
        if (p.archived) fail(`${p.name} has left the table.`);
        move(p, cmd.amountCp, note, "payAll", { batchId });
      }
      break;
    }
    case "money.buy": {
      const p = player(cmd.playerId);
      if (p.archived) fail(`${p.name} has left the table.`);
      const item = s.items.find((x) => x.id === cmd.itemId) ?? fail("That item isn't for sale.");
      const where = shop(item.shopId);
      if (where.closed) fail(`${where.name} isn't open yet.`);
      if (item.tier === "locked") fail(`${item.name} is locked: ${item.reason || "not for sale yet"}.`);
      if (item.tier !== "sale") fail(`${item.name} isn't for sale.`);
      if (item.stock === 0) fail(`${item.name} is sold out.${item.restockNote ? " " + item.restockNote : ""}`);
      const cost = firstChargeCp(s, item);
      if (!canPay(p, cost, item.shopId)) fail(`${p.name} can't afford ${item.name}.`);
      if (item.kind === "recurring" && s.rentals.some((x) => x.active && x.itemId === item.id && x.playerId === p.id)) fail(`${p.name} already rents ${item.name}.`);
      fulfil(p, item, 1, cost, {}, { question: cmd.question });
      break;
    }
    case "project.contribute": {
      const p = player(cmd.playerId);
      if (p.archived) fail(`${p.name} has left the table.`);
      const it = item(cmd.itemId);
      const left = projectLeft(it);
      const cp = Math.min(cmd.amountCp, left);
      if (p.balanceCp < cp) fail(`${p.name} only has ${formatCp(p.balanceCp)}.`);
      contribute(p, it, cp);
      if (cp < cmd.amountCp) out.info = `${it.name} only needed ${formatCp(cp)}, so that's all ${p.name} paid.`;
      break;
    }

    // ---------- rent and lessons ----------
    case "dues.charge": {
      const sess = curSession();
      const want = new Set(cmd.ids);
      const due = duesFor(s, sess.number).filter((d) => want.has(d.id));
      for (const d of due) {
        const p = player(d.playerId);
        if (d.kind === "rent") {
          const r = s.rentals.find((x) => x.id === d.id)!;
          move(p, -d.cp, `Rent: ${r.itemName}`, "rent", { itemId: r.itemId });
          r.paidThrough = sess.number;
        } else {
          const t = s.trainings.find((x) => x.id === d.id)!;
          move(p, -d.cp, `${t.itemName}${t.what ? ` (${t.what})` : ""}: lesson ${t.paid + 1} of ${t.of}`, "purchase", { itemId: t.itemId });
          t.paid++;
          t.paidCp += d.cp;
          t.paidThrough = sess.number;
          if (t.paid >= t.of) {
            t.done = true;
            task(`Record a new proficiency: ${p.name} finished ${t.itemName}${t.what ? `: ${t.what}` : ""}.`, { playerId: p.id, itemId: t.itemId });
          }
        }
      }
      sess.duesCharged = true;
      out.info = due.length ? `Charged ${due.length} ${due.length === 1 ? "payment" : "payments"}.` : "Nothing was due.";
      break;
    }
    case "rental.cancel": {
      const r = s.rentals.find((x) => x.id === cmd.rentalId) ?? fail("That rental doesn't exist.");
      r.active = false;
      r.endedAt = ctx.now;
      break;
    }
    case "training.cancel": {
      const t = s.trainings.find((x) => x.id === cmd.trainingId) ?? fail("That training doesn't exist.");
      if (t.done) fail("That training is already finished.");
      t.cancelled = true;
      break;
    }

    // ---------- earned ----------
    case "award.grant": {
      const it = item(cmd.itemId);
      if (it.kind !== "earned") fail(`${it.name} isn't an Earned item.`);
      const ps = [...new Set(cmd.playerIds)].map(player);
      s.awards.push({ id: nextId("aw"), itemId: it.id, itemName: it.name, playerIds: ps.map((p) => p.id), at: ctx.now, note: cmd.note.trim() });
      announcePublic(it.shopId, `Earned: ${it.name} (${ps.map((p) => p.name).join(", ")})`);
      break;
    }
    case "award.revoke":
      if (!s.awards.some((a) => a.id === cmd.awardId)) fail("That award doesn't exist.");
      s.awards = s.awards.filter((a) => a.id !== cmd.awardId);
      break;

    // ---------- the DM's to-do list and the flyers ----------
    case "task.done": {
      const t = s.tasks.find((x) => x.id === cmd.taskId) ?? fail("That task doesn't exist.");
      t.done = cmd.done;
      break;
    }
    case "flyer.update": {
      const f = s.flyers.find((x) => x.id === cmd.flyerId) ?? fail("That flyer doesn't exist.");
      const { up, ...text } = cmd.patch;
      Object.assign(f, cleanFlyer({ ...f, ...text }, f.signedBy));
      if (up !== undefined) f.up = up;
      break;
    }
    case "flyer.remove":
      s.flyers = s.flyers.filter((x) => x.id !== cmd.flyerId);
      break;

    // ---------- players ----------
    case "player.add": {
      const name = cmd.name.trim() || `Player ${s.players.length + 1}`;
      createPlayer(normaliseHandle(name), name, "dm");
      break;
    }
    case "player.update": {
      const p = player(cmd.playerId);
      const { patch } = cmd;
      if (patch.name !== undefined) p.name = patch.name.trim() || p.name;
      if (patch.dndbUrl !== undefined) p.dndbUrl = checkUrl(patch.dndbUrl);
      if (patch.away !== undefined) p.away = patch.away;
      if (patch.dropIn !== undefined) p.dropIn = patch.dropIn;
      if (patch.handle !== undefined) {
        const h = normaliseHandle(patch.handle);
        if (!h) fail("A URL name needs at least one letter or number.");
        if (isReservedHandle(h)) fail(`“${h}” is reserved.`);
        if (s.players.some((x) => x.handle === h && x.id !== p.id)) fail(`Someone already uses “${h}”.`);
        p.handle = h;
      }
      break;
    }
    case "player.archive":
      player(cmd.playerId).archived = cmd.archived;
      break;
    case "player.remove": {
      const p = player(cmd.playerId);
      if (p.balanceCp !== 0) fail(`${p.name} still has ${formatCp(p.balanceCp)}. Archive them instead, or zero their purse first.`);
      s.players = s.players.filter((x) => x.id !== p.id);
      break;
    }
    case "player.clearKey":
      delete player(cmd.playerId).keyHash;
      break;
    case "player.inspire":
      player(cmd.playerId).inspired = cmd.on;
      break;

    // ---------- shops ----------
    case "shop.add":
      s.shops.push({ id: nextId("shop"), name: cmd.name.trim() || "New shop", subtitle: cmd.subtitle.trim(), visibility: "hidden", playerIds: [] });
      break;
    case "shop.update": {
      const sh = shop(cmd.shopId);
      if (cmd.patch.name !== undefined) sh.name = cmd.patch.name.trim() || sh.name;
      if (cmd.patch.subtitle !== undefined) sh.subtitle = cmd.patch.subtitle.trim();
      if (cmd.patch.secretSales !== undefined) sh.secretSales = cmd.patch.secretSales || undefined;
      if (cmd.patch.closed !== undefined) {
        const opening = sh.closed && !cmd.patch.closed;
        sh.closed = cmd.patch.closed || undefined;
        if (opening && sh.visibility === "all") announce(`${sh.name} is open for business`);
      }
      break;
    }
    case "shop.visibility": {
      const sh = shop(cmd.shopId);
      const ids = [...new Set(cmd.playerIds ?? sh.playerIds)];
      for (const pid of ids) player(pid);
      if (cmd.visibility === "some" && !ids.length) fail("Pick at least one player.");
      const wasPublic = sh.visibility === "all";
      sh.visibility = cmd.visibility;
      sh.playerIds = cmd.visibility === "some" ? ids : [];
      if (cmd.visibility !== "all" && s.live.shopId === sh.id) s.live.shopOpen = false;
      if (cmd.visibility === "all" && !wasPublic && !cmd.quiet) announce(sh.closed ? `${sh.name} has come to town` : `Now open: ${sh.name}`);
      break;
    }
    case "shop.remove": {
      if (s.shops.length <= 1) fail("Keep at least one shop.");
      if (!s.shops.some((x) => x.id === cmd.shopId)) fail("That shop doesn't exist.");
      s.shops = s.shops.filter((x) => x.id !== cmd.shopId);
      s.items = s.items.filter((x) => x.shopId !== cmd.shopId);
      for (const sc of s.scenes) for (const p of sc.map?.pins ?? []) if (p.link?.kind === "shop" && p.link.shopId === cmd.shopId) delete p.link;
      if (s.live.shopId === cmd.shopId) s.live.shopId = s.shops[0].id;
      break;
    }
    case "item.add": {
      shop(cmd.item.shopId);
      const it = tidyItem({
        id: nextId("i"),
        description: "",
        tier: "sale",
        reason: "",
        hint: "",
        hidePrice: false,
        stock: null,
        restockNote: "",
        category: "gear",
        kind: "purchase",
        ...cmd.item,
      });
      s.items.push(it);
      if (!cmd.quiet) announceItem(it, "hidden");
      break;
    }
    case "item.update": {
      const it = s.items.find((x) => x.id === cmd.itemId) ?? fail("That item doesn't exist.");
      if (cmd.patch.shopId) shop(cmd.patch.shopId);
      const before = { tier: it.tier, stock: it.stock, name: it.name };
      Object.assign(it, cmd.patch);
      if (cmd.patch.name !== undefined) it.name = cmd.patch.name.trim() || before.name;
      tidyItem(it);
      if (!cmd.quiet) {
        announceItem(it, before.tier);
        if (before.stock === 0 && it.stock !== null && it.stock > 0 && it.tier === "sale" && shop(it.shopId).visibility === "all") {
          announce(`Back in stock at ${shop(it.shopId).name}: ${it.name}`);
        }
      }
      break;
    }
    case "order.arrive": {
      const o = s.orders.find((x) => x.id === cmd.orderId) ?? fail("That order doesn't exist.");
      if (!o.arrived) {
        o.arrived = true;
        announce(`Arrived from Baldur\u2019s Gate: ${o.itemName} for ${player(o.playerId).name}`);
      }
      break;
    }
    case "order.cancel": {
      const o = s.orders.find((x) => x.id === cmd.orderId) ?? fail("That order doesn't exist.");
      if (o.arrived) fail("That order already arrived.");
      s.orders = s.orders.filter((x) => x.id !== o.id);
      if (cmd.refund && o.priceCp > 0) move(player(o.playerId), o.priceCp, `Refund: ${o.itemName}`, "grant", { itemId: o.itemId });
      break;
    }
    case "catalog.reset":
      s.shops = structuredClone(SEED_SHOPS);
      s.items = structuredClone(SEED_ITEMS);
      s.live.shopOpen = false;
      s.live.shopId = s.shops[0].id;
      delete s.live.shopCategory;
      // Shares, rentals and awards point at the old items. Flyers and your to-do list stay.
      Object.assign(s, { ...emptyProgress(), flyers: s.flyers, tasks: s.tasks });
      for (const sc of s.scenes) for (const p of sc.map?.pins ?? []) if (p.link?.kind === "shop" && !s.shops.some((x) => x.id === (p.link as { shopId: string }).shopId)) delete p.link;
      break;
    case "item.remove":
      s.items = s.items.filter((x) => x.id !== cmd.itemId);
      break;

    // ---------- sessions ----------
    case "session.start": {
      if (s.currentSessionId) fail("A session is already running. End it first.");
      startSession(cmd.title);
      break;
    }
    case "session.end": {
      const cur = s.sessions.find((x) => x.id === s.currentSessionId) ?? fail("No session is running.");
      cur.endedAt = ctx.now;
      s.currentSessionId = null;
      showScene(homeScene());
      break;
    }
    case "session.update": {
      const sess = s.sessions.find((x) => x.id === cmd.sessionId) ?? fail("That session doesn't exist.");
      if (cmd.patch.number !== undefined) {
        const clash = s.sessions.find((x) => x.number === cmd.patch.number && x.id !== sess.id);
        if (clash) fail(`\u201c${clash.title}\u201d is already number ${clash.number}.`);
        // Keep a default title in step with its number.
        if (sess.title === `Session ${sess.number}`) sess.title = `Session ${cmd.patch.number}`;
        sess.number = cmd.patch.number;
      }
      if (cmd.patch.title !== undefined) sess.title = cmd.patch.title.trim() || `Session ${sess.number}`;
      s.sessions.sort((a, b) => a.number - b.number);
      break;
    }
    case "session.reopen": {
      if (s.currentSessionId) fail("Another session is running. End it first.");
      const sess = s.sessions.find((x) => x.id === cmd.sessionId) ?? fail("That session doesn't exist.");
      sess.endedAt = null;
      s.currentSessionId = sess.id;
      break;
    }
    case "session.remove": {
      if (!s.sessions.some((x) => x.id === cmd.sessionId)) fail("That session doesn't exist.");
      // Ledger lines keep their (now unknown) session id and read as "between sessions".
      s.sessions = s.sessions.filter((x) => x.id !== cmd.sessionId);
      if (s.currentSessionId === cmd.sessionId) s.currentSessionId = null;
      if (s.live.recapSessionId === cmd.sessionId) delete s.live.recapSessionId;
      break;
    }

    // ---------- run sheets ----------
    case "episode.add": {
      const ep: Episode = { id: nextId("ep"), title: cmd.title.trim() || "New episode", beats: (cmd.beats ?? []).map(makeBeat) };
      episodes.push(ep);
      out.episodeId = ep.id;
      break;
    }
    case "episode.update":
      episode(cmd.episodeId).title = cmd.title.trim() || episode(cmd.episodeId).title;
      break;
    case "episode.replaceBeats": {
      const ep = episode(cmd.episodeId);
      keepCurrentBeat(ep, () => (ep.beats = cmd.beats.map(makeBeat)));
      break;
    }
    case "episode.remove": {
      episode(cmd.episodeId);
      if (curRunEpisode(s) === cmd.episodeId) fail("That episode is running in this session. End the session first.");
      s.episodes = episodes.filter((e) => e.id !== cmd.episodeId);
      break;
    }
    case "beat.add": {
      const ep = episode(cmd.episodeId);
      const b = makeBeat(cmd.beat ?? { title: "New beat", notes: [], checks: [], branches: [], actions: [] });
      keepCurrentBeat(ep, () => ep.beats.splice(Math.min(cmd.at ?? ep.beats.length, ep.beats.length), 0, b));
      out.beatId = b.id;
      break;
    }
    case "beat.update": {
      const ep = episode(cmd.episodeId);
      const i = ep.beats.findIndex((b) => b.id === cmd.beatId);
      if (i < 0) fail("That beat doesn't exist.");
      ep.beats[i] = { ...makeBeat(cmd.beat), id: cmd.beatId };
      break;
    }
    case "beat.move": {
      const ep = episode(cmd.episodeId);
      const i = ep.beats.findIndex((b) => b.id === cmd.beatId);
      if (i < 0) fail("That beat doesn't exist.");
      keepCurrentBeat(ep, () => {
        const [b] = ep.beats.splice(i, 1);
        ep.beats.splice(Math.min(cmd.to, ep.beats.length), 0, b);
      });
      break;
    }
    case "beat.remove": {
      const ep = episode(cmd.episodeId);
      if (!ep.beats.some((b) => b.id === cmd.beatId)) fail("That beat doesn't exist.");
      keepCurrentBeat(ep, () => (ep.beats = ep.beats.filter((b) => b.id !== cmd.beatId)));
      break;
    }

    // ---------- running a session from an episode ----------
    case "run.start": {
      const ep = episode(cmd.episodeId);
      const cur = s.sessions.find((x) => x.id === s.currentSessionId);
      if (cur?.run) {
        if (cur.run.episodeId === ep.id) break; // resume where we are
        fail(`${cur.title} is running “${episode(cur.run.episodeId).title}”. End it first.`);
      }
      const sess = cur ?? startSession();
      sess.run = { episodeId: ep.id, stage: "start", beat: Math.min(resumeBeat(ep.id), Math.max(0, ep.beats.length - 1)), notes: {} };
      break;
    }
    case "run.next": {
      const { run, ep } = curRun();
      if (run.stage === "end") break;
      const i = run.stage === "start" ? run.beat : run.beat + 1;
      if (i < ep.beats.length) land(run, ep, i, cmd.skip);
      else run.stage = "end";
      break;
    }
    case "run.back": {
      // Never fires actions, so stepping back doesn't flash the TV.
      const { run, ep } = curRun();
      if (run.stage === "end") {
        if (ep.beats.length) {
          run.stage = "beat";
          run.beat = ep.beats.length - 1;
        } else run.stage = "start";
      } else if (run.stage === "beat") {
        if (run.beat > 0) run.beat--;
        else run.stage = "start";
      }
      break;
    }
    case "run.jump": {
      const { run, ep } = curRun();
      if (cmd.stage === "beat") {
        const i = cmd.beat ?? fail("Which beat?");
        if (i >= ep.beats.length) fail("That beat doesn't exist.");
        land(run, ep, i);
      } else run.stage = cmd.stage;
      break;
    }
    case "run.fire": {
      const { ep } = curRun();
      const b = ep.beats.find((x) => x.id === cmd.beatId) ?? fail("That beat doesn't exist.");
      fireAction(b.actions[cmd.index] ?? fail("That action doesn't exist."));
      break;
    }
    case "run.note": {
      const { run, ep } = curRun();
      if (!ep.beats.some((b) => b.id === cmd.beatId)) fail("That beat doesn't exist.");
      if (cmd.text.trim()) run.notes[cmd.beatId] = cmd.text;
      else delete run.notes[cmd.beatId];
      break;
    }
    case "run.recap": {
      const sess = session(cmd.sessionId);
      if (cmd.text.trim()) sess.recap = cmd.text;
      else {
        delete sess.recap;
        if (s.live.recapSessionId === sess.id) delete s.live.recapSessionId;
      }
      break;
    }
    case "run.attend": {
      const sess = curSession();
      const p = player(cmd.playerId);
      // Ticked: here tonight. Unticked: away (off the TV purse and out of "pay everyone").
      p.away = !cmd.here;
      if (cmd.here) markAttending(p.id);
      else sess.attendeeIds = sess.attendeeIds.filter((x) => x !== p.id);
      break;
    }
    case "live.recap": {
      if (cmd.sessionId === null) {
        delete s.live.recapSessionId;
        break;
      }
      const sess = session(cmd.sessionId);
      if (!sess.recap?.trim()) fail("That session has no recap yet.");
      s.live.recapSessionId = sess.id;
      s.live.shopOpen = false;
      break;
    }

    // ---------- the door ----------
    case "door.set":
      s.doorClosed = cmd.closed;
      break;
    case "table.seats":
      s.maxPlayers = cmd.max;
      break;
    case "knock.admit": {
      const k = s.knocks.find((x) => x.id === cmd.knockId) ?? fail("Nobody's knocking.");
      s.knocks = s.knocks.filter((x) => x.id !== k.id);
      if (!s.players.some((p) => p.handle === k.handle)) createPlayer(k.handle, displayNameFrom(k.handle), "url");
      break;
    }
    case "knock.dismiss":
      s.knocks = s.knocks.filter((x) => x.id !== cmd.knockId);
      break;

    case "game.rename":
      s.name = cmd.name.trim();
      break;
    case "game.vtt": {
      const url = checkUrl(cmd.url);
      if (url) s.vttUrl = url;
      else delete s.vttUrl;
      break;
    }

    // ---------- phone requests: the DM decides ----------
    case "request.approve":
      approve(request(cmd.requestId), cmd.totalCp, !!cmd.override, { answer: cmd.answer, flyer: cmd.flyer });
      pruneRequests();
      break;
    case "request.decline": {
      const r = request(cmd.requestId);
      if (r.status !== "pending") fail(`That request was already ${r.status}.`);
      r.status = "declined";
      r.decidedAt = ctx.now;
      const reason = cmd.reason.trim();
      if (reason) r.reason = reason;
      pruneRequests();
      break;
    }
    case "request.approveAll": {
      const pending = s.requests.filter((r) => r.status === "pending");
      if (!pending.length) fail("Nothing is waiting.");
      let ok = 0;
      const stuck: string[] = [];
      let waiting = 0;
      for (const r of pending) {
        // Services (and flyers) need you to read and answer them.
        if (r.kind === "buy" && s.items.find((x) => x.id === r.itemId)?.kind === "service") {
          waiting++;
          continue;
        }
        try {
          approve(r, undefined, false);
          ok++;
        } catch (e) {
          if (!(e instanceof CommandError)) throw e;
          stuck.push(`${r.playerName}: ${e.message}`);
        }
      }
      const answer = waiting ? ` ${waiting} ${waiting === 1 ? "service needs" : "services need"} your answer.` : "";
      out.info = (stuck.length ? `Approved ${ok}. Still waiting on you: ${stuck.join(" ")}` : `Approved ${ok}.`) + answer;
      pruneRequests();
      break;
    }
    case "game.tvPurchases":
      if (cmd.on) delete s.tvPurchases;
      else s.tvPurchases = false;
      break;

    // ---------- phone requests: the player asks ----------
    case "me.requestBuy": {
      const p = me();
      // Anything this player can't see gets the same answer, so the API can't be used to probe for hidden goods.
      const unseen = "That item isn't available.";
      const item = s.items.find((x) => x.id === cmd.itemId) ?? fail(unseen);
      const where = s.shops.find((x) => x.id === item.shopId);
      if (!where || !shopVisibleTo(where, { tv: false, playerId: p.id }) || item.tier === "hidden" || item.tier === "rumored") fail(unseen);
      if (where.closed) fail(`${where.name} isn't open yet.`);
      if (item.tier === "locked") fail(`${item.name} is locked: ${item.reason || "not for sale yet"}.`);
      if (item.kind === "earned") fail(`${item.name} can't be bought. It has to be earned.`);
      if (item.kind === "project") fail(`${item.name} is a project: put gold toward it instead.`);
      const unitCp = firstChargeCp(s, item);
      if (cmd.expectedUnitCp !== undefined && cmd.expectedUnitCp !== unitCp) fail(`The price of ${item.name} just changed to ${formatCp(unitCp)}. Have another look.`);
      if (cmd.qty > 1 && (item.oneAtATime || item.arrivesInSessions || item.kind !== "purchase")) fail(`${item.name} is sold one at a time.`);
      const question = cmd.question?.trim() ?? "";
      if (item.prompt && !question) fail(`${item.prompt} Tell the DM first.`);
      if (item.flyer && !cmd.flyer?.title.trim()) fail("Give your flyer a title.");
      const mine = (r: TradeRequest) => r.status === "pending" && r.playerId === p.id && r.itemId === item.id;
      if (item.kind === "recurring" && (s.rentals.some((x) => x.active && x.itemId === item.id && x.playerId === p.id) || s.requests.some(mine))) fail(`You already rent ${item.name}.`);
      if (item.kind === "training" && (s.trainings.some((x) => !x.done && !x.cancelled && x.itemId === item.id && x.playerId === p.id) || s.requests.some(mine))) fail(`You're already taking ${item.name}.`);
      const left = availableStock(s, item);
      if (left !== null && left < cmd.qty) {
        if (item.stock === 0) fail(`${item.name} is sold out.${item.restockNote ? " " + item.restockNote : ""}`);
        fail(left === 0 ? `Someone has already asked for the last ${item.name}.` : `Only ${left} ${item.name} left.`);
      }
      const totalCp = unitCp * cmd.qty;
      const credit = creditCp(s, p.id, where.id);
      const avail = availableCp(s, p.id) + credit;
      if (totalCp > avail) fail(`That costs ${formatCp(totalCp)} and you have ${formatCp(Math.max(0, avail))} available${credit ? " (with your tab)" : ""}.`);
      if (s.requests.filter((r) => r.status === "pending" && r.playerId === p.id).length >= 20) fail("You have 20 requests waiting. Let the DM catch up.");
      s.requests.push({
        id: nextId("rq"),
        kind: "buy",
        playerId: p.id,
        playerName: p.name,
        at: ctx.now,
        status: "pending",
        totalCp,
        note: cmd.note.trim(),
        secret: isSecretShop(where),
        itemId: item.id,
        itemName: item.name,
        shopId: where.id,
        qty: cmd.qty,
        unitCp,
        ...(question ? { question } : {}),
        ...(item.flyer && cmd.flyer ? { flyer: cleanFlyer(cmd.flyer, p.name) } : {}),
      });
      break;
    }
    case "me.contribute": {
      const p = me();
      const unseen = "That item isn't available.";
      const it = s.items.find((x) => x.id === cmd.itemId) ?? fail(unseen);
      const where = s.shops.find((x) => x.id === it.shopId);
      if (!where || !shopVisibleTo(where, { tv: false, playerId: p.id }) || it.tier === "hidden" || it.tier === "rumored") fail(unseen);
      if (where.closed) fail(`${where.name} isn't open yet.`);
      if (it.tier === "locked") fail(`${it.name} is locked: ${it.reason || "not open yet"}.`);
      const pledged = s.requests.reduce((a, r) => (r.status === "pending" && r.kind === "contribute" && r.itemId === it.id ? a + r.totalCp : a), 0);
      const left = projectLeft(it) - pledged;
      if (left <= 0) fail(`${it.name} has all the gold it needs waiting on the DM.`);
      if (cmd.amountCp > left) fail(`${it.name} only needs ${formatCp(left)} more.`);
      const avail = availableCp(s, p.id);
      if (cmd.amountCp > avail) fail(`You have ${formatCp(Math.max(0, avail))} available.`);
      if (s.requests.filter((r) => r.status === "pending" && r.playerId === p.id).length >= 20) fail("You have 20 requests waiting. Let the DM catch up.");
      s.requests.push({
        id: nextId("rq"),
        kind: "contribute",
        playerId: p.id,
        playerName: p.name,
        at: ctx.now,
        status: "pending",
        totalCp: cmd.amountCp,
        note: cmd.note.trim(),
        secret: isSecretShop(where),
        itemId: it.id,
        itemName: it.name,
        shopId: where.id,
        qty: 1,
        unitCp: cmd.amountCp,
      });
      break;
    }
    case "me.cancelRental": {
      const p = player(ctx.actor.role === "player" ? ctx.actor.playerId : "");
      const r = s.rentals.find((x) => x.id === cmd.rentalId && x.playerId === p.id) ?? fail("That rental doesn't exist.");
      if (!r.active) fail("You already gave that up.");
      r.active = false;
      r.endedAt = ctx.now;
      break;
    }
    case "me.requestGive": {
      const p = me();
      const to = s.players.find((x) => x.id === cmd.toPlayerId && !x.archived) ?? fail("That player isn't at the table.");
      if (to.id === p.id) fail("You can't send gold to yourself.");
      const avail = availableCp(s, p.id);
      if (cmd.amountCp > avail) fail(`You have ${formatCp(Math.max(0, avail))} available.`);
      if (s.requests.filter((r) => r.status === "pending" && r.playerId === p.id).length >= 20) fail("You have 20 requests waiting. Let the DM catch up.");
      s.requests.push({
        id: nextId("rq"),
        kind: "give",
        playerId: p.id,
        playerName: p.name,
        at: ctx.now,
        status: "pending",
        totalCp: cmd.amountCp,
        note: cmd.note.trim(),
        secret: false,
        qty: 1,
        unitCp: cmd.amountCp,
        toPlayerId: to.id,
        toPlayerName: to.name,
      });
      break;
    }
    case "me.cancelRequest": {
      const p = player(ctx.actor.role === "player" ? ctx.actor.playerId : "");
      const r = s.requests.find((x) => x.id === cmd.requestId && x.playerId === p.id) ?? fail("That request doesn't exist.");
      if (r.status !== "pending") fail(`That request was already ${r.status}.`);
      r.status = "cancelled";
      r.decidedAt = ctx.now;
      pruneRequests();
      break;
    }

    // ---------- players acting on themselves ----------
    case "me.update": {
      const p = player(ctx.actor.role === "player" ? ctx.actor.playerId : "");
      if (cmd.patch.name !== undefined) p.name = cmd.patch.name.trim() || p.name;
      if (cmd.patch.dndbUrl !== undefined) p.dndbUrl = checkUrl(cmd.patch.dndbUrl);
      break;
    }
    case "me.lockHashed": {
      const p = player(ctx.actor.role === "player" ? ctx.actor.playerId : "");
      if (p.keyHash) fail("Your name is already locked. Ask the DM to reset it.");
      p.keyHash = cmd.keyHash;
      break;
    }

    // ---------- issued by the server ----------
    case "system.join": {
      const h = normaliseHandle(cmd.handle);
      if (!h || isReservedHandle(h)) fail("Pick a different name.");
      if (s.players.some((p) => p.handle === h)) fail("That name is taken.");
      const p = createPlayer(h, cmd.name, "url", cmd.keyHash);
      p.lastSeenAt = ctx.now;
      s.knocks = s.knocks.filter((k) => k.handle !== h);
      break;
    }
    case "system.hello": {
      const p = player(cmd.playerId);
      p.lastSeenAt = ctx.now;
      if (!p.archived) markAttending(p.id);
      break;
    }
    case "system.knock": {
      const h = normaliseHandle(cmd.handle);
      if (!h || isReservedHandle(h)) fail("Pick a different name.");
      if (!s.knocks.some((k) => k.handle === h)) s.knocks.push({ id: nextId("k"), handle: h, at: ctx.now });
      s.knocks = s.knocks.slice(-20);
      break;
    }

    default: {
      const never: never = cmd;
      fail(`Unknown command ${(never as { type: string }).type}`);
    }
  }

  return out;
}

/** The episode the current session is running, if any. */
export function curRunEpisode(s: Pick<GameState, "sessions" | "currentSessionId">): string | null {
  return s.sessions.find((x) => x.id === s.currentSessionId)?.run?.episodeId ?? null;
}

/** "Previously on…": the most recently ended session with a recap. */
export function previousRecap(s: Pick<GameState, "sessions" | "currentSessionId">): Session | null {
  return (
    s.sessions
      .filter((x) => x.id !== s.currentSessionId && x.endedAt !== null && x.recap?.trim())
      .sort((a, b) => (b.endedAt ?? 0) - (a.endedAt ?? 0))[0] ?? null
  );
}

export function emptyMap(): MapData {
  return { pins: [], legendOn: false, legendStyle: "names" };
}

/** The lowest number from 1 up that no pin on the map uses. */
export function lowestFreeNumber(pins: Pick<Pin, "number">[]): number {
  const used = new Set(pins.map((p) => p.number));
  let n = 1;
  while (used.has(n)) n++;
  return n;
}

/** One more than the highest session number, so deleting old sessions never causes a clash. */
export function nextSessionNumber(s: Pick<GameState, "sessions">): number {
  return s.sessions.reduce((m, x) => Math.max(m, x.number), 0) + 1;
}

function tidyItem(it: Item): Item {
  it.name = it.name.trim();
  it.description = it.description.trim();
  it.reason = it.reason.trim();
  it.hint = it.hint.trim();
  it.restockNote = it.restockNote.trim();
  for (const k of ["priceLabel", "finePrint", "dmNote"] as const) {
    const v = it[k]?.trim();
    if (v) it[k] = v;
    else delete it[k];
  }
  // A special-order delay makes it an order; an order always has one.
  if (it.arrivesInSessions && (it.kind === "purchase" || !it.kind)) it.kind = "order";
  if (it.kind === "order" && !it.arrivesInSessions) it.arrivesInSessions = 2;
  if (it.kind !== "order") delete it.arrivesInSessions;
  if (!it.arrivesInSessions) delete it.arrivesInSessions;
  if (!it.oneAtATime) delete it.oneAtATime;
  if (it.kind !== "training") delete it.installments;
  const prompt = it.prompt?.trim();
  if (prompt && (it.kind === "service" || it.kind === "training")) it.prompt = prompt;
  else delete it.prompt;
  if (!it.flyer || it.kind !== "service") delete it.flyer;
  if (!it.keep) delete it.keep;
  const tags = (it.tags ?? []).map((t) => t.trim()).filter(Boolean);
  if (tags.length) it.tags = tags;
  else delete it.tags;
  if (!it.effects?.length) delete it.effects;
  return it;
}

/** Trim a flyer, and sign it with the player's name if they left it blank. */
function cleanFlyer(f: FlyerText, fallbackName: string): FlyerText {
  return { title: f.title.trim().slice(0, 60) || "Notice", body: f.body.trim().slice(0, 400), signedBy: f.signedBy.trim().slice(0, 60) || fallbackName };
}

function checkUrl(url: string): string | undefined {
  const u = url.trim();
  if (!u) return undefined;
  if (!/^https:\/\/[^\s]+$/i.test(u)) fail("Links must start with https://");
  return u;
}
