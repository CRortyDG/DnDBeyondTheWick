// Pure game rules. Every write goes: validate actor -> apply() -> atomic save.
// apply() never mutates its input and never does I/O, so it's easy to test.

import type { Command } from "./commands";
import { displayNameFrom, isReservedHandle, normaliseHandle } from "./handles";
import { canAfford, formatCp } from "./money";
import { SEED_ITEMS, SEED_SHOPS } from "./seed";
import type { Actor, GameState, Item, ItemTier, LedgerEntry, LedgerKind, Player, Scene, Shop } from "./types";

export class CommandError extends Error {}

export interface Ctx {
  now: number;
  actor: Actor;
}

export interface Result {
  state: GameState;
  ledger: LedgerEntry[];
  /** Created player id for system.join / player.add / knock.admit. */
  playerId?: string;
}

function fail(msg: string): never {
  throw new CommandError(msg);
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
  const ledger: LedgerEntry[] = [];
  const out: Result = { state: s, ledger };

  const nextId = (prefix: string) => prefix + (++s.seq).toString(36);
  const player = (id: string): Player => s.players.find((p) => p.id === id) ?? fail("That player isn't here.");
  const scene = (id: string): Scene => s.scenes.find((x) => x.id === id) ?? fail("That scene doesn't exist.");
  const shop = (id: string): Shop => s.shops.find((x) => x.id === id) ?? fail("That shop doesn't exist.");

  /** A short TV banner. */
  const announce = (text: string) => {
    s.banner = { id: nextId("bn"), text, at: ctx.now };
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
      break;
    }
    case "scene.remove": {
      if (s.scenes.length <= 1) fail("Keep at least one scene.");
      scene(cmd.sceneId);
      s.scenes = s.scenes.filter((x) => x.id !== cmd.sceneId);
      if (s.live.sceneId === cmd.sceneId) s.live.sceneId = homeScene();
      break;
    }
    case "scene.move": {
      const i = s.scenes.findIndex((x) => x.id === cmd.sceneId);
      if (i < 0) fail("That scene doesn't exist.");
      const j = i + cmd.dir;
      if (j >= 0 && j < s.scenes.length) [s.scenes[i], s.scenes[j]] = [s.scenes[j], s.scenes[i]];
      break;
    }

    // ---------- what the TV shows ----------
    case "live.shop": {
      const target = shop(cmd.shopId ?? s.live.shopId);
      if (cmd.open && target.visibility !== "all") fail(`${target.name} is hidden from the party. Open it to everyone first.`);
      s.live.shopId = target.id;
      s.live.shopOpen = cmd.open;
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
      if (!canAfford(p.balanceCp, item.priceCp)) fail(`${p.name} can't afford ${item.name}.`);
      if (item.stock !== null) item.stock -= 1;
      if (item.arrivesInSessions) {
        const now = s.sessions.find((x) => x.id === s.currentSessionId)?.number ?? nextSessionNumber(s) - 1;
        const arrivesAtSession = now + item.arrivesInSessions;
        s.orders.push({ id: nextId("o"), playerId: p.id, itemId: item.id, itemName: item.name, priceCp: item.priceCp, orderedAt: ctx.now, arrivesAtSession, arrived: false });
        move(p, -item.priceCp, `Ordered ${item.name} (arrives session ${arrivesAtSession})`, "purchase", { itemId: item.id });
      } else {
        move(p, -item.priceCp, `Bought ${item.name}`, "purchase", { itemId: item.id });
      }
      break;
    }

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
      break;
    case "item.remove":
      s.items = s.items.filter((x) => x.id !== cmd.itemId);
      break;

    // ---------- sessions ----------
    case "session.start": {
      if (s.currentSessionId) fail("A session is already running. End it first.");
      const number = nextSessionNumber(s);
      const sess = {
        id: nextId("sess"),
        number,
        title: cmd.title?.trim() || `Session ${number}`,
        startedAt: ctx.now,
        endedAt: null,
        attendeeIds: s.players.filter((p) => !p.archived && !p.away).map((p) => p.id),
      };
      s.sessions.push(sess);
      s.currentSessionId = sess.id;
      showScene(homeScene());
      const due = s.orders.filter((o) => !o.arrived && o.arrivesAtSession <= number);
      for (const o of due) o.arrived = true;
      if (due.length === 1) announce(`Arrived from Baldur\u2019s Gate: ${due[0].itemName} for ${s.players.find((p) => p.id === due[0].playerId)?.name ?? "someone"}`);
      else if (due.length > 1) announce(`${due.length} special orders have arrived from Baldur\u2019s Gate`);
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
  if (!it.arrivesInSessions) delete it.arrivesInSessions;
  return it;
}

function checkUrl(url: string): string | undefined {
  const u = url.trim();
  if (!u) return undefined;
  if (!/^https:\/\/[^\s]+$/i.test(u)) fail("Links must start with https://");
  return u;
}
