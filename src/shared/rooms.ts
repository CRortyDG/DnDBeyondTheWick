// Rooms at an inn: each room is a Discover place with a room block (its hook
// on the key rack, its key, its perk). Who lives where is the shop's own rent:
// a Rental with a roomId. Moving ends one rental and starts the next, so the
// rentals are the room's history (the register). Story hooks are the entry's
// secrets and the innkeeper's lines its DM note: both DM-ONLY, never projected.

import { z } from "zod";
import { formatCp } from "./money";
import { entriesOf } from "./discovery";
import { rankName, renownOf } from "./renown";
import { tableRenown } from "./world";
import { lastEndedClock } from "./progress";
import type { Entry, GameState, Item, LedgerEntry, LedgerKind, Player, Rental, RoomInfo, RoomMoment, RoomSettings, RoomType, Shop } from "./types";

export const HOOKS = 12;
export const BEDS = 2;
export const ROOM_TYPES: { id: RoomType; label: string }[] = [
  { id: "guest", label: "Guest room" },
  { id: "good", label: "The Good Room" },
  { id: "staff", label: "Staff room (not rented)" },
];
export const KEY_MAX = 80;
export const PERK_MAX = 300;
export const TAG_MAX = 120;
export const REGISTER_MAX = 40;
export const REGISTER_LINE_MAX = 300;
export const MOMENTS_MAX = 300;
const GP = 100;

export const DEFAULT_ROOMS: RoomSettings = { rentCp: 3 * GP, firstFree: true, good: { mode: "renown", rank: 1, rentCp: 10 * GP }, register: [] };

export function roomSettings(g: Pick<GameState, "rooms">): RoomSettings {
  const r = g.rooms;
  return { ...DEFAULT_ROOMS, ...r, good: { ...DEFAULT_ROOMS.good, ...r?.good }, register: r?.register ?? [] };
}

export type RoomEntry = Entry & { room: RoomInfo };

export function isRoom(e: Entry): e is RoomEntry {
  return !!e.room;
}

/** Every room, by hook. */
export function roomsOf(g: Pick<GameState, "entries">): RoomEntry[] {
  return entriesOf(g)
    .filter(isRoom)
    .sort((a, b) => a.room.hook - b.room.hook);
}

export function bedsOf(r: RoomInfo): number {
  return r.type === "staff" ? 0 : Math.max(1, r.beds ?? BEDS);
}

/** Who lives here now: their active rentals. */
export function tenancies(g: Pick<GameState, "rentals">, roomId: string): Rental[] {
  return g.rentals.filter((r) => r.active && r.roomId === roomId);
}

/** A character's room now, if any. */
export function roomRentalOf(g: Pick<GameState, "rentals">, playerId: string): Rental | undefined {
  return g.rentals.find((r) => r.active && r.roomId && r.playerId === playerId);
}

/** What the room costs a month. The Good Room in rent mode costs the higher rent. */
export function rentFor(g: Pick<GameState, "rooms">, r: RoomInfo): number {
  const set = roomSettings(g);
  if (r.type === "good" && set.good.mode === "rent") return set.good.rentCp;
  return r.rentCp ?? set.rentCp;
}

/** A character's own Renown: their own in a shared world, the party's otherwise. */
export function characterRank(g: Pick<GameState, "players" | "renown" | "world">, playerId: string): number {
  return g.world ? tableRenown(g, [playerId]) : renownOf(g);
}

/** Why this character can't have the Good Room yet, or null. */
export function goodRoomLock(g: Pick<GameState, "players" | "renown" | "world" | "rooms" | "town" | "renownRanks">, playerId: string): string | null {
  const set = roomSettings(g);
  if (set.good.mode !== "renown") return null;
  if (characterRank(g, playerId) >= set.good.rank) return null;
  return `The Good Room is earned: it needs ${rankName(set.good.rank, g)}.`;
}

/** The last session that ended (its number), or 0. Rent paid through it is up to date. */
export function lastEnded(g: Pick<GameState, "sessions">): number {
  let n = 0;
  for (const x of g.sessions) if (x.endedAt != null) n = Math.max(n, x.number);
  return n;
}

/** Room rentals behind on rent: a payment was missed at the last session end. */
export function behindOnRent(g: Pick<GameState, "rentals" | "sessions"> & Partial<Pick<GameState, "world">>): Rental[] {
  return g.rentals.filter((r) => r.active && r.roomId && r.paidThrough < lastEndedClock(g, r.playerId));
}

/** A character has had a room here before (the first month is only free once). */
export function hadRoom(g: Pick<GameState, "rentals">, playerId: string): boolean {
  return g.rentals.some((r) => r.roomId && r.playerId === playerId);
}

/**
 * The present player to suggest for a room moment: someone with a room who
 * has gone longest without one (never first), then by hook. skip: passed over.
 */
export function suggestMoment(g: Pick<GameState, "players" | "rentals" | "entries" | "roomMoments">, skip: string[] = []): { player: Player; room: RoomEntry } | null {
  const rooms = new Map(roomsOf(g).map((e) => [e.id, e]));
  const last = new Map<string, number>();
  for (const m of g.roomMoments ?? []) last.set(m.playerId, Math.max(last.get(m.playerId) ?? 0, m.at));
  const cands: { player: Player; room: RoomEntry; last: number }[] = [];
  for (const p of g.players) {
    if (p.archived || p.away || skip.includes(p.id)) continue;
    const r = roomRentalOf(g, p.id);
    const room = r && rooms.get(r.roomId!);
    if (room) cands.push({ player: p, room, last: last.get(p.id) ?? -1 });
  }
  cands.sort((a, b) => a.last - b.last || a.room.room.hook - b.room.room.hook);
  return cands[0] ? { player: cands[0].player, room: cands[0].room } : null;
}

/** Session start: who gets Inspiration or a rumor because of their room. Present players only. */
export function startPerks(g: Pick<GameState, "players" | "rentals" | "entries">): { kind: "inspiration" | "rumor"; player: Player; room: RoomEntry }[] {
  const out: { kind: "inspiration" | "rumor"; player: Player; room: RoomEntry }[] = [];
  for (const room of roomsOf(g)) {
    const kind = room.room.startPerk ?? (room.room.type === "good" ? "inspiration" : undefined);
    if (!kind) continue;
    for (const r of tenancies(g, room.id)) {
      const p = g.players.find((x) => x.id === r.playerId);
      if (p && !p.archived && !p.away) out.push({ kind, player: p, room });
    }
  }
  return out;
}

/** The register: every check-in, newest first. DM-ONLY. */
export interface RegisterLine {
  rentalId: string;
  playerId: string;
  roomId: string;
  at: number;
  endedAt?: number;
  who: string;
  room: string;
  active: boolean;
}

export function registerOf(g: Pick<GameState, "rentals" | "players" | "entries">): RegisterLine[] {
  const names = new Map(roomsOf(g).map((e) => [e.id, e.name]));
  return g.rentals
    .filter((r) => r.roomId)
    .map((r) => {
      const p = g.players.find((x) => x.id === r.playerId);
      return { rentalId: r.id, playerId: r.playerId, roomId: r.roomId!, at: r.startedAt, ...(r.endedAt ? { endedAt: r.endedAt } : {}), who: p ? p.character?.trim() || p.name : "someone", room: names.get(r.roomId!) ?? r.itemName, active: r.active };
    })
    .sort((a, b) => b.at - a.at);
}

const charName = (p: Player | undefined) => (p ? p.character?.trim() || p.name : "someone");

// ---------------------------------------------------------------------------
// What players and the TV may see

/** A room as players see it on a found place. Nothing DM-only. */
export interface PublicRoom {
  hook: number;
  type: RoomType;
  key: string;
  perk: string;
  tag?: string;
}

export function publicRoom(r: RoomInfo): PublicRoom | undefined {
  if (r.type === "staff") return undefined;
  return { hook: r.hook, type: r.type, key: r.key, perk: r.perk, ...(r.tag ? { tag: r.tag } : {}) };
}

/** My room card on the phone. */
export interface MyRoom {
  name: string;
  key: string;
  perk: string;
  tag?: string;
  type: RoomType;
  /** The character names of whoever shares it. */
  roommates: string[];
  monthlyCp: number;
  /** Rent is paid up to the end of this session. */
  paidThrough: number;
  behind: boolean;
}

export function myRoom(g: Pick<GameState, "rentals" | "players" | "entries" | "sessions">, playerId: string): MyRoom | undefined {
  const r = roomRentalOf(g, playerId);
  const room = r && roomsOf(g).find((e) => e.id === r.roomId);
  if (!r || !room) return undefined;
  const roommates = tenancies(g, room.id)
    .filter((x) => x.playerId !== playerId)
    .map((x) => charName(g.players.find((p) => p.id === x.playerId)));
  return {
    name: room.name,
    key: room.room.key,
    perk: room.room.perk,
    ...(room.room.tag ? { tag: room.room.tag } : {}),
    type: room.room.type,
    roommates,
    monthlyCp: r.monthlyCp,
    paidThrough: r.paidThrough,
    behind: r.paidThrough < lastEndedClock(g, r.playerId),
  };
}

/** One hook on the TV's key rack. */
export interface RackHook {
  hook: number;
  /** guest and good rooms: the room's name. Staff and missing keys: none. */
  name?: string;
  type?: RoomType;
  /** An empty hook: the key is gone, or no room hangs here. */
  empty: boolean;
  /** Character names of whoever lives there. */
  taken: string[];
  /** Beds left (guest and good rooms). */
  free?: number;
}

export interface KeyRackView {
  /** The inn: the rooms' first area ("The Flickering Candle"). */
  inn: string;
  hooks: RackHook[];
}

export function keyRack(g: Pick<GameState, "rentals" | "players" | "entries">): KeyRackView {
  const rooms = roomsOf(g);
  return { inn: rooms[0]?.areas[0]?.trim() || "The inn", hooks: rackHooks(g) };
}

function rackHooks(g: Pick<GameState, "rentals" | "players" | "entries">): RackHook[] {
  const byHook = new Map(roomsOf(g).map((e) => [e.room.hook, e]));
  const out: RackHook[] = [];
  for (let h = 1; h <= HOOKS; h++) {
    const e = byHook.get(h);
    if (!e || e.room.keyMissing) {
      out.push({ hook: h, empty: true, taken: [] });
      continue;
    }
    if (e.room.type === "staff") {
      out.push({ hook: h, type: "staff", empty: false, taken: [] });
      continue;
    }
    const taken = tenancies(g, e.id).map((r) => charName(g.players.find((p) => p.id === r.playerId)));
    out.push({ hook: h, name: e.name, type: e.room.type, empty: false, taken, free: Math.max(0, bedsOf(e.room) - taken.length) });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Commands

const id = z.string().min(1).max(64);
const cpSchema = z.number().int().min(0).max(100_000_00);

export const roomInfoSchema = z.object({
  hook: z.number().int().min(1).max(HOOKS),
  type: z.enum(["guest", "good", "staff"]),
  key: z.string().max(KEY_MAX),
  keyMissing: z.boolean().optional(),
  perk: z.string().max(PERK_MAX),
  tag: z.string().max(TAG_MAX).optional(),
  rentCp: cpSchema.nullable().optional(),
  beds: z.number().int().min(1).max(6).nullable().optional(),
  startPerk: z.enum(["inspiration", "rumor"]).nullable().optional(),
});

export const roomDmCommands = [
  /** Give a character a room (roomId null: they check out). Moving keeps what they've paid. free: no rent for this month. */
  z.object({ type: z.literal("room.assign"), playerId: id, roomId: id.nullable(), free: z.boolean().optional() }),
  /** Forgive a missed payment: their rent counts as paid up to now. */
  z.object({ type: z.literal("room.waive"), rentalId: id }),
  z.object({
    type: z.literal("rooms.settings"),
    patch: z
      .object({
        rentCp: cpSchema,
        firstFree: z.boolean(),
        good: z.object({ mode: z.enum(["renown", "rent"]), rank: z.number().int().min(0).max(4), rentCp: cpSchema }).partial(),
        register: z.array(z.string().max(REGISTER_LINE_MAX)).max(REGISTER_MAX),
      })
      .partial(),
  }),
  /**
   * Fix a line in the register: which room a past stay was in, and when it
   * started and ended. A current stay's room is changed with room.assign.
   */
  z.object({
    type: z.literal("room.stay.edit"),
    rentalId: id,
    patch: z.object({ roomId: id, startedAt: z.number().int().positive(), endedAt: z.number().int().positive() }).partial(),
  }),
  /** Strike a line from the register. A current stay is undone (they no longer have the room); gold already paid stays paid. */
  z.object({ type: z.literal("room.stay.delete"), rentalId: id }),
  /** A "because of your room" moment happened (logs it for the rotation). */
  z.object({ type: z.literal("room.moment"), playerId: id, note: z.string().max(300).optional() }),
] as const;

export type RoomCommand = z.infer<(typeof roomDmCommands)[number]>;

export function isRoomCommand(cmd: { type: string }): cmd is RoomCommand {
  return cmd.type.startsWith("room.") || cmd.type === "rooms.settings";
}

export interface RoomHelpers {
  now: number;
  nextId: (prefix: string) => string;
  fail: (m: string) => never;
  info: (m: string) => void;
  move: (p: Player, amountCp: number, note: string, kind: LedgerKind, extra?: Partial<LedgerEntry>) => void;
  /** The session a payment made now covers. */
  coversSession: () => number;
}

/** The hidden rent item every room rental points at: one per inn, made the first time it's needed. */
function rentItem(s: GameState, room: RoomEntry, nextId: (p: string) => string): Item {
  const inn = room.areas[0]?.trim() || "The inn";
  let shop: Shop | undefined = s.shops.find((x) => x.name.trim().toLowerCase() === inn.toLowerCase());
  if (!shop) {
    shop = { id: nextId("inn-"), name: inn, subtitle: "", visibility: "hidden", playerIds: [] };
    s.shops.push(shop);
  }
  const have = s.items.find((x) => x.shopId === shop!.id && x.tags?.includes("room-rent"));
  if (have) return have;
  const it: Item = {
    id: nextId("room-rent-"),
    shopId: shop.id,
    name: `A room at ${inn.replace(/^the /i, "the ")}`,
    priceCp: roomSettings(s).rentCp,
    description: "Given out at check-in: pick a key off the rack.",
    tier: "hidden",
    reason: "",
    hint: "",
    hidePrice: false,
    stock: null,
    restockNote: "",
    category: "building",
    kind: "recurring",
    tags: ["room-rent"],
    dmNote: "Rooms are assigned from the key rack (Session start or Players). Each room's rent is set on the room.",
  };
  s.items.push(it);
  return it;
}

export function applyRooms(s: GameState, cmd: RoomCommand, h: RoomHelpers): void {
  const player = (pid: string) => s.players.find((p) => p.id === pid) ?? h.fail("That player isn't here.");
  switch (cmd.type) {
    case "room.assign": {
      const p = player(cmd.playerId);
      const old = roomRentalOf(s, p.id);
      if (cmd.roomId === null) {
        if (!old) h.fail(`${charName(p)} doesn't have a room.`);
        old.active = false;
        old.endedAt = h.now;
        h.info(`${charName(p)} checked out of ${old.itemName}.`);
        return;
      }
      const room = roomsOf(s).find((e) => e.id === cmd.roomId) ?? h.fail("That room isn't there any more.");
      if (old?.roomId === room.id) h.fail(`${charName(p)} already has ${room.name}.`);
      if (room.room.type === "staff") h.fail(`${room.name} isn't for guests.`);
      if (room.room.keyMissing) h.fail(`${room.name}'s key is missing.`);
      if (tenancies(s, room.id).length >= bedsOf(room.room)) h.fail(`${room.name} is full.`);
      if (room.room.type === "good") {
        const lock = goodRoomLock(s, p.id);
        if (lock) h.fail(lock);
      }
      const it = rentItem(s, room, h.nextId);
      const monthlyCp = rentFor(s, room.room);
      const rental: Rental = { id: h.nextId("rn"), itemId: it.id, itemName: room.name, playerId: p.id, monthlyCp, startedAt: h.now, paidThrough: 0, active: true, roomId: room.id };
      if (old) {
        // Moving: what they paid carries over. No second free month, no second charge.
        old.active = false;
        old.endedAt = h.now;
        rental.paidThrough = old.paidThrough;
        h.info(`${charName(p)} moved from ${old.itemName} to ${room.name}.`);
      } else if (cmd.free || (roomSettings(s).firstFree && !hadRoom(s, p.id))) {
        rental.paidThrough = h.coversSession();
        h.info(`${charName(p)} has ${room.name}. First month free.`);
      } else if (monthlyCp > 0 && p.balanceCp >= monthlyCp) {
        h.move(p, -monthlyCp, `Rent: ${room.name} (first month)`, "rent", { itemId: it.id });
        rental.paidThrough = h.coversSession();
        h.info(`${charName(p)} has ${room.name}. Paid ${formatCp(monthlyCp)}.`);
      } else if (monthlyCp > 0) {
        // Can't pay yet: it comes due with the rest of the rent at session end.
        rental.paidThrough = h.coversSession() - 1;
        h.info(`${charName(p)} has ${room.name}, but can't pay ${formatCp(monthlyCp)} yet. It's due at session end.`);
      } else rental.paidThrough = h.coversSession();
      s.rentals.push(rental);
      return;
    }
    case "room.waive": {
      const r = s.rentals.find((x) => x.id === cmd.rentalId && x.roomId) ?? h.fail("That room rental isn't there any more.");
      r.paidThrough = Math.max(r.paidThrough, lastEndedClock(s, r.playerId));
      h.info(`Waived: ${r.itemName} is paid up.`);
      return;
    }
    case "rooms.settings": {
      const cur = roomSettings(s);
      const p = cmd.patch;
      const next: RoomSettings = {
        rentCp: p.rentCp ?? cur.rentCp,
        firstFree: p.firstFree ?? cur.firstFree,
        good: { ...cur.good, ...p.good },
        register: p.register ? p.register.map((x) => x.trim()).filter(Boolean) : cur.register,
      };
      s.rooms = next;
      return;
    }
    case "room.stay.edit": {
      const r = s.rentals.find((x) => x.id === cmd.rentalId && x.roomId) ?? h.fail("That stay isn't in the register any more.");
      const p = cmd.patch;
      if (p.roomId !== undefined && p.roomId !== r.roomId) {
        if (r.active) h.fail("They're still in that room. Move them with the key rack instead.");
        const room = roomsOf(s).find((e) => e.id === p.roomId) ?? h.fail("That room isn't there any more.");
        r.roomId = room.id;
        r.itemName = room.name;
      }
      const start = p.startedAt ?? r.startedAt;
      if (p.endedAt !== undefined && r.active) h.fail("They haven't left yet. Check them out first.");
      const end = p.endedAt ?? r.endedAt;
      if (end !== undefined && end < start) h.fail("They can't leave before they arrived.");
      r.startedAt = start;
      if (end !== undefined) r.endedAt = end;
      return;
    }
    case "room.stay.delete": {
      const r = s.rentals.find((x) => x.id === cmd.rentalId && x.roomId) ?? h.fail("That stay isn't in the register any more.");
      s.rentals = s.rentals.filter((x) => x !== r);
      const p = s.players.find((x) => x.id === r.playerId);
      h.info(r.active ? `${charName(p)} no longer has ${r.itemName}. Gold already paid stays paid.` : `Struck from the register: ${charName(p)}, ${r.itemName}.`);
      return;
    }
    case "room.moment": {
      const p = player(cmd.playerId);
      const r = roomRentalOf(s, p.id) ?? h.fail(`${charName(p)} doesn't have a room.`);
      const m: RoomMoment = { id: h.nextId("rm"), playerId: p.id, roomId: r.roomId!, sessionId: s.currentSessionId, at: h.now, ...(cmd.note?.trim() ? { note: cmd.note.trim() } : {}) };
      s.roomMoments = [...(s.roomMoments ?? []), m].slice(-MOMENTS_MAX);
      return;
    }
  }
}

/** A room block from the editor or an import, tidied. Fails on a hook another room has. */
export function cleanRoom(s: GameState, entryId: string | null, r: z.infer<typeof roomInfoSchema>, fail: (m: string) => never): RoomInfo {
  const other = roomsOf(s).find((e) => e.id !== entryId && e.room.hook === r.hook);
  if (other) fail(`Hook ${r.hook} already has ${other.name}.`);
  const out: RoomInfo = { hook: r.hook, type: r.type, key: r.key.trim(), perk: r.perk.trim() };
  if (r.keyMissing) out.keyMissing = true;
  if (r.tag?.trim()) out.tag = r.tag.trim();
  if (r.rentCp != null) out.rentCp = r.rentCp;
  if (r.beds != null) out.beds = r.beds;
  if (r.startPerk) out.startPerk = r.startPerk;
  return out;
}
