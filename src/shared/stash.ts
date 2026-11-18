// The party stash: loot nobody has claimed yet.
//
// Things found in a fight (or added by the DM) wait here until the DM hands
// them out, or a player takes one (when the DM allows it). Players can say
// "I'd like this" so the DM sees who wants what. Handing an item out puts it on
// the character's sheet (the same inventory shop purchases land in); a player
// who keeps no sheet here gets it "at the table", and the stash log says so.
//
// In a shared world each item belongs to the party that found it: phones see
// only their own parties' stash.

import { z } from "zod";
import { penName } from "./chronicle";
import { partiesFor, worldOn } from "./world";
import {
  ITEM_KINDS,
  ITEM_NAME_MAX,
  ITEM_NOTE_MAX,
  ITEMS_MAX,
  itemFromName,
  QTY_MAX,
  stackInto,
  type ItemKindSheet,
  type SheetItem,
} from "./sheetGear";
import type { GameState, Player } from "./types";

export const STASH_MAX = 120;
export const STASH_LOG_MAX = 40;
export const SOURCE_MAX = 80;

/** One thing in the stash: an inventory item, plus where it came from and who'd like it. */
export interface StashItem extends Omit<SheetItem, "equipped" | "attuned"> {
  addedAt: number;
  /** "2 Goblins (in the feast hall)", or missing when the DM added it by hand. */
  source?: string;
  fightId?: string;
  /** Shared world: the party it belongs to. Missing: everyone's. */
  partyId?: string;
  /** Players who said "I'd like this", in the order they asked. */
  wants?: string[];
}

/** One line of the stash log: what left it, and to whom. */
export interface StashMove {
  at: number;
  name: string;
  qty: number;
  /** Who got it (missing: the DM took it out). */
  playerId?: string;
  /** given: the DM handed it to a sheet. table: given to someone who keeps no sheet here. took: a player took it. removed: the DM took it out. */
  how: "given" | "table" | "took" | "removed";
  partyId?: string;
}

export function stashOf(g: Pick<GameState, "stash">): StashItem[] {
  return g.stash ?? [];
}

/** Can this player see (and ask for) this stash item? */
export function stashVisibleTo(
  g: Pick<GameState, "world" | "parties">,
  it: Pick<StashItem, "partyId">,
  playerId: string,
): boolean {
  if (!worldOn(g) || !it.partyId) return true;
  return partiesFor(g, playerId).some((p) => p.id === it.partyId);
}

const nameOf = (p: Pick<Player, "name" | "character">) => penName(p);
const what = (name: string, qty: number) =>
  qty > 1 ? `${qty} × ${name}` : name;

/** The sheet item a stash item becomes. */
function asSheetItem(it: StashItem): SheetItem {
  const {
    addedAt: _a,
    source: _s,
    fightId: _f,
    partyId: _p,
    wants: _w,
    ...rest
  } = it;
  return { ...rest };
}

/** Something found: becomes a stash item, with SRD weapon and armor numbers when the name matches. */
export function newStashItem(
  x: LootIn,
  id: string,
  now: number,
  meta: Pick<StashItem, "source" | "fightId" | "partyId">,
): StashItem {
  const base = itemFromName(x.name, id, Math.min(QTY_MAX, x.qty));
  if (x.kind && x.kind !== base.kind) {
    // The DM said what it is: keep the SRD numbers only if they fit.
    base.kind = x.kind;
    if (x.kind !== "weapon")
      for (const k of ["count", "sides", "dtype", "finesse", "ranged"] as const)
        delete base[k];
    if (x.kind !== "armor" && x.kind !== "shield") delete base.armorBase;
    if (x.kind !== "armor") delete base.armorDex;
  }
  if (x.kind === "magic") base.attune = !!x.attune;
  if (x.srd) base.srd = x.srd;
  const note = (x.note ?? "").trim();
  if (note) base.note = note;
  const out: StashItem = { ...base, addedAt: now };
  if (meta.source) out.source = meta.source;
  if (meta.fightId) out.fightId = meta.fightId;
  if (meta.partyId) out.partyId = meta.partyId;
  return out;
}

// ---------------------------------------------------------------------------
// Commands

const id = z.string().min(1).max(64);
const qty = z.number().int().min(1).max(QTY_MAX);

export const lootIn = z.object({
  name: z.string().trim().min(1).max(ITEM_NAME_MAX),
  qty,
  kind: z.enum(ITEM_KINDS).optional(),
  attune: z.boolean().optional(),
  srd: z
    .string()
    .regex(/^[a-z0-9-]{1,60}$/)
    .optional(),
  note: z.string().max(ITEM_NOTE_MAX).optional(),
});
export type LootIn = z.infer<typeof lootIn>;

/** A loot line from the fight's end step: to a player, or (no one) into the stash. */
export const fightLoot = lootIn.extend({ to: id.optional() });

export const stashDmCommands = [
  /** Put things in the stash by hand. partyId: whose (shared world); missing: the party at the table. */
  z.object({
    type: z.literal("stash.add"),
    items: z.array(lootIn).min(1).max(30),
    partyId: id.nullable().optional(),
    source: z.string().max(SOURCE_MAX).optional(),
  }),
  z.object({
    type: z.literal("stash.edit"),
    stashId: id,
    patch: z
      .object({
        name: z.string().trim().min(1).max(ITEM_NAME_MAX),
        qty,
        kind: z.enum(ITEM_KINDS),
        attune: z.boolean(),
        note: z.string().max(ITEM_NOTE_MAX),
        partyId: id.nullable(),
      })
      .partial(),
  }),
  z.object({ type: z.literal("stash.remove"), stashId: id }),
  /** Hand some to one character. */
  z.object({ type: z.literal("stash.give"), stashId: id, playerId: id, qty }),
  /** Share a stack out evenly; what doesn't divide stays in the stash. */
  z.object({
    type: z.literal("stash.split"),
    stashId: id,
    playerIds: z.array(id).min(1).max(20),
  }),
  /** take: players may take things themselves (otherwise they ask, and you hand out). */
  z.object({ type: z.literal("stash.settings"), take: z.boolean() }),
  /** Clear the stash log. */
  z.object({ type: z.literal("stash.clearLog") }),
] as const;

export const stashPlayerCommands = [
  /** "I'd like this" (or never mind). */
  z.object({ type: z.literal("me.stashWant"), stashId: id, on: z.boolean() }),
  /** Take some onto my sheet (only when the DM lets players take). */
  z.object({ type: z.literal("me.stashTake"), stashId: id, qty }),
] as const;

type Dm = z.infer<(typeof stashDmCommands)[number]>;
type Pl = z.infer<(typeof stashPlayerCommands)[number]>;
export type StashCommand = Dm | Pl;

export function isStashCommand(cmd: { type: string }): cmd is StashCommand {
  return (
    cmd.type.startsWith("stash.") ||
    cmd.type === "me.stashWant" ||
    cmd.type === "me.stashTake"
  );
}

export interface StashCtx {
  actor: { role: string; playerId?: string };
  now: number;
  fail: (m: string) => never;
  info?: (m: string) => void;
  /** New ids for stash items. */
  stashId: () => string;
  /** New ids for sheet items. */
  itemId: () => string;
}

/** Add found things to the stash. Returns how many lines went in. */
export function addToStash(
  s: GameState,
  items: LootIn[],
  meta: Pick<StashItem, "source" | "fightId" | "partyId">,
  h: Pick<StashCtx, "now" | "fail" | "stashId">,
): number {
  const list = (s.stash ??= []);
  if (list.length + items.length > STASH_MAX)
    h.fail(`The stash holds ${STASH_MAX} things at most. Hand some out first.`);
  for (const x of items) list.push(newStashItem(x, h.stashId(), h.now, meta));
  return items.length;
}

/**
 * The loot from a fight's end step: lines with a "to" go straight to that
 * character, the rest wait in the stash. Returns who must be handed things at the table.
 */
export function lootFromFight(
  s: GameState,
  loot: z.infer<typeof fightLoot>[],
  meta: Pick<StashItem, "source" | "fightId" | "partyId">,
  h: Pick<StashCtx, "now" | "fail" | "stashId" | "itemId">,
  stashOn = true,
): { stashed: number; atTable: string[] } {
  let stashed = 0;
  const atTable: string[] = [];
  for (const x of loot) {
    if (!x.to && !stashOn) continue;
    addToStash(s, [x], meta, h);
    const it = s.stash!.at(-1)!;
    if (!x.to) {
      stashed++;
      continue;
    }
    const p =
      s.players.find((y) => y.id === x.to) ?? h.fail("That player isn't here.");
    if (handTo(s, it, p, it.qty, h) === "table")
      atTable.push(`${what(it.name, x.qty)} to ${nameOf(p)}`);
  }
  return { stashed, atTable };
}

function log(s: GameState, m: StashMove) {
  const l = (s.stashLog ??= []);
  l.push(m);
  if (l.length > STASH_LOG_MAX) s.stashLog = l.slice(-STASH_LOG_MAX);
}

/** Take qty off a stash item (removing it when none are left). */
function takeOff(s: GameState, it: StashItem, n: number) {
  if (n >= it.qty) s.stash = stashOf(s).filter((x) => x !== it);
  else it.qty -= n;
  if (!s.stash?.length) delete s.stash;
}

/**
 * Put n of a stash item on p's sheet, or "at the table" if p keeps no sheet here.
 * Returns how it went. Fails if their inventory is full.
 */
function handTo(
  s: GameState,
  it: StashItem,
  p: Player,
  n: number,
  h: Pick<StashCtx, "now" | "fail" | "itemId">,
): "given" | "table" {
  if (p.archived) h.fail(`${nameOf(p)} has left the table.`);
  if (n > it.qty)
    h.fail(`There ${it.qty === 1 ? "is" : "are"} only ${it.qty} in the stash.`);
  let how: "given" | "table" = "table";
  if (p.sheet && !p.sheetOff) {
    const stacks = p.sheet.items?.some(
      (x) =>
        x.name === it.name &&
        x.kind === it.kind &&
        !x.equipped &&
        (x.srd ?? "") === (it.srd ?? "") &&
        (x.from ?? "") === (it.from ?? ""),
    );
    if (!stacks && (p.sheet.items?.length ?? 0) >= ITEMS_MAX)
      h.fail(`${nameOf(p)}'s inventory is full.`);
    stackInto(p.sheet, asSheetItem(it), n, h.itemId);
    p.sheet.updatedAt = h.now;
    how = "given";
  }
  log(s, {
    at: h.now,
    name: it.name,
    qty: n,
    playerId: p.id,
    how,
    ...(it.partyId ? { partyId: it.partyId } : {}),
  });
  // Whoever got the last one doesn't need to ask any more.
  if (n >= it.qty) delete it.wants;
  else if (it.wants) {
    it.wants = it.wants.filter((x) => x !== p.id);
    if (!it.wants.length) delete it.wants;
  }
  takeOff(s, it, n);
  return how;
}

export function applyStash(s: GameState, cmd: StashCommand, h: StashCtx) {
  const find = (sid: string) =>
    stashOf(s).find((x) => x.id === sid) ??
    h.fail("That's not in the stash any more.");
  const player = (pid: string) =>
    s.players.find((x) => x.id === pid) ?? h.fail("That player isn't here.");
  const me = () => {
    const p =
      s.players.find(
        (x) => x.id === (h.actor.role === "player" ? h.actor.playerId : ""),
      ) ?? h.fail("That player isn't here.");
    if (p.archived) h.fail("You've left the table.");
    return p;
  };
  const partyOk = (pid: string | null | undefined) => {
    if (pid && !(s.parties ?? []).some((x) => x.id === pid))
      h.fail("That party isn't in this world.");
  };

  switch (cmd.type) {
    case "stash.add": {
      partyOk(cmd.partyId);
      const partyId =
        cmd.partyId === null
          ? undefined
          : (cmd.partyId ?? (worldOn(s) ? s.partyId : undefined));
      const source = cmd.source?.trim();
      const n = addToStash(
        s,
        cmd.items,
        { ...(source ? { source } : {}), ...(partyId ? { partyId } : {}) },
        h,
      );
      h.info?.(
        n === 1
          ? `${what(cmd.items[0].name.trim(), cmd.items[0].qty)} is in the stash.`
          : `${n} things are in the stash.`,
      );
      return;
    }
    case "stash.edit": {
      const it = find(cmd.stashId);
      const pt = cmd.patch;
      if (pt.name !== undefined || pt.kind !== undefined) {
        // A new name or kind: work the SRD numbers out again.
        const next = newStashItem(
          {
            name: pt.name ?? it.name,
            qty: it.qty,
            kind:
              pt.kind ??
              (pt.name !== undefined && it.kind !== "magic"
                ? undefined
                : it.kind),
            attune: pt.attune ?? it.attune,
            ...(it.srd && pt.name === undefined ? { srd: it.srd } : {}),
            note: it.note,
          },
          it.id,
          it.addedAt,
          it,
        );
        if (it.wants) next.wants = it.wants;
        Object.keys(it).forEach(
          (k) => delete (it as unknown as Record<string, unknown>)[k],
        );
        Object.assign(it, next);
      }
      if (pt.qty !== undefined) it.qty = pt.qty;
      if (pt.attune !== undefined) {
        if (pt.attune && it.kind === "magic") it.attune = true;
        else delete it.attune;
      }
      if (pt.note !== undefined) {
        const n = pt.note.trim();
        if (n) it.note = n;
        else delete it.note;
      }
      if (pt.partyId !== undefined) {
        partyOk(pt.partyId);
        if (pt.partyId) it.partyId = pt.partyId;
        else delete it.partyId;
        // Someone who can't see it any more can't want it.
        if (it.wants) {
          it.wants = it.wants.filter((pid) => stashVisibleTo(s, it, pid));
          if (!it.wants.length) delete it.wants;
        }
      }
      return;
    }
    case "stash.remove": {
      const it = find(cmd.stashId);
      log(s, {
        at: h.now,
        name: it.name,
        qty: it.qty,
        how: "removed",
        ...(it.partyId ? { partyId: it.partyId } : {}),
      });
      takeOff(s, it, it.qty);
      return;
    }
    case "stash.give": {
      const it = find(cmd.stashId);
      const p = player(cmd.playerId);
      const name = it.name;
      const how = handTo(s, it, p, cmd.qty, h);
      h.info?.(
        how === "given"
          ? `${what(name, cmd.qty)} is on ${nameOf(p)}'s sheet.`
          : `${nameOf(p)} doesn't keep a sheet here: hand ${what(name, cmd.qty)} over at the table.`,
      );
      return;
    }
    case "stash.split": {
      const it = find(cmd.stashId);
      const ps = [...new Set(cmd.playerIds)].map(player);
      const each = Math.floor(it.qty / ps.length);
      if (each < 1)
        h.fail(
          `There ${it.qty === 1 ? "is" : "are"} only ${it.qty}: not enough for ${ps.length} each.`,
        );
      const name = it.name;
      const left = it.qty - each * ps.length;
      const table: string[] = [];
      for (const p of ps)
        if (handTo(s, it, p, each, h) === "table") table.push(nameOf(p));
      h.info?.(
        `${each} ${name} each${left ? `, ${left} left in the stash` : ""}.${table.length ? ` Hand ${table.join(" and ")}'s over at the table.` : ""}`,
      );
      return;
    }
    case "stash.settings": {
      if (cmd.take) s.stashTake = true;
      else delete s.stashTake;
      return;
    }
    case "stash.clearLog": {
      delete s.stashLog;
      return;
    }
    case "me.stashWant": {
      const p = me();
      const it = find(cmd.stashId);
      if (!stashVisibleTo(s, it, p.id))
        h.fail("That's not in your party's stash.");
      const list = (it.wants ?? []).filter((x) => x !== p.id);
      if (cmd.on) list.push(p.id);
      if (list.length) it.wants = list;
      else delete it.wants;
      return;
    }
    case "me.stashTake": {
      const p = me();
      if (!s.stashTake) h.fail("Ask the DM: they hand out the stash.");
      const it = find(cmd.stashId);
      if (!stashVisibleTo(s, it, p.id))
        h.fail("That's not in your party's stash.");
      if (!p.sheet || p.sheetOff)
        h.fail(
          "You don't keep a sheet here. Ask the DM to hand it to you at the table.",
        );
      const name = it.name;
      handTo(s, it, p, cmd.qty, h);
      const l = s.stashLog!.at(-1)!;
      l.how = "took";
      h.info?.(`${what(name, cmd.qty)} is in your inventory.`);
      return;
    }
  }
}

// ---------------------------------------------------------------------------
// What a phone sees

export interface PublicStashItem {
  id: string;
  name: string;
  qty: number;
  kind: ItemKindSheet;
  attune?: boolean;
  note?: string;
  srd?: string;
  source?: string;
  /** Who else would like it (character names), in the order they asked. */
  wants: string[];
  /** I asked for it. */
  mine: boolean;
}

export interface StashView {
  items: PublicStashItem[];
  /** Players may take things themselves. */
  take: boolean;
  /** The last few things that left it, newest first ("Mira took 2 × Potion of Healing"). */
  log: { at: number; text: string }[];
}

export function moveText(g: Pick<GameState, "players">, m: StashMove): string {
  const p = m.playerId ? g.players.find((x) => x.id === m.playerId) : undefined;
  const who = p ? nameOf(p) : "Someone";
  const w = what(m.name, m.qty);
  switch (m.how) {
    case "took":
      return `${who} took ${w}`;
    case "given":
      return `${who} got ${w}`;
    case "table":
      return `${who} got ${w} (at the table)`;
    case "removed":
      return `${w} left the stash`;
  }
}

export function stashView(g: GameState, playerId: string): StashView {
  const items = stashOf(g)
    .filter((x) => stashVisibleTo(g, x, playerId))
    .map((x) => {
      const out: PublicStashItem = {
        id: x.id,
        name: x.name,
        qty: x.qty,
        kind: x.kind,
        wants: (x.wants ?? [])
          .filter((pid) => pid !== playerId)
          .map((pid) => g.players.find((p) => p.id === pid))
          .filter((p): p is Player => !!p)
          .map(nameOf),
        mine: !!x.wants?.includes(playerId),
      };
      if (x.attune) out.attune = true;
      if (x.note) out.note = x.note;
      if (x.srd) out.srd = x.srd;
      if (x.source) out.source = x.source;
      return out;
    });
  const log = (g.stashLog ?? [])
    .filter((m) => stashVisibleTo(g, m, playerId))
    .slice(-8)
    .reverse()
    .map((m) => ({ at: m.at, text: moveText(g, m) }));
  return { items, take: !!g.stashTake, log };
}
