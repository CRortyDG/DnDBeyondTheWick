// Pure game rules. Every write goes: validate actor -> apply() -> atomic save.
// apply() never mutates its input and never does I/O, so it's easy to test.

import type { Command } from "./commands";
import { displayNameFrom, isReservedHandle, normaliseHandle } from "./handles";
import { canAfford, formatCp } from "./money";
import { beatBody } from "./commands";
import { availableCp, availableStock, boughtPhrase, heldStock, isSecretShop } from "./requests";
import { candlefairMap, emptyProgress, SEED_ITEMS, SEED_SHOPS, STINGER_SCENE, swordCoastMap } from "./seed";
import { creditCp, duesFor, firstChargeCp, installmentCp, keepsStake, liveEffects, priceOf, raisedCp, rollDice, sharesOf, splitByShare } from "./progress";
import { chapterAt, shopVisibleTo } from "./projection";
import { CHARACTER_MAX, CLIP_GIF_MAX, CLIP_VIDEO_MAX, STINGER_SCENE_ID, TABLE_SCENE_ID, WHY_MAX } from "./arrival";
import { starterById } from "./starters";
import { chapterSessionId, cleanTags, cleanText, defaultChapterId, NEXT_CHAPTER, NOTES_MAX, penName } from "./chronicle";
import { BOARD_SLOTS, jobPoints, jobsOf, jobTitle, pinnedCount, pointsOf, rankForPoints, rankName, ranksOf, RENOWN_POINTS, RENOWN_POINTS_MAX, renownMet, renownNeeded, renownOf, shopOpenNow, thresholdsOf, tierOf, trustMet, trustText } from "./renown";
import { LOG_MAX, PLAYER_ROLL_GAP_MS, rollPool, type RollTo } from "./dice";
import { leadsOf, leadVisible, tally, voteClosed } from "./leads";
import { findRef, sessionRecap, slugInput, stageRank, blankEntry, ENTRIES_MAX, LEADS_MAX, entriesForScene, entriesOf, entryFromScene, entryScene, entryTags, factSlug, FACTS_MAX, isFound, shopEntry, slugify, syncShopEntries, uniqueSlug } from "./discovery";
import { DM_AUTHOR } from "./types";
import { originOf } from "./presets";
import { boardNotes, cleanLook, cleanPlace, defaultWidth, NOTICES_MAX, placeFor, slugify as noteSlug, topZ } from "./board";
import { decodeBits, emptyBits, encodeBits, fullBits } from "./fog";
import { addPartyTokens, freeSpot, snapToGrid, syncFightTokens, tokensOf, TOKENS_MAX } from "./tokens";
import { levelLine } from "./levels";
import { applyPractice, isPracticeCommand, trackPractice } from "./practice";
import { applyCompanion, attachCompanion, companionsWith, companionTemplatesOf, endSessionCompanions, isCompanionCommand, rentalEnded } from "./companions";
import { applyFight, isFightCommand, startFightFromBeat, type FightHelpers } from "./combatReducer";
import type { Notice, NotePlace } from "./types";
import { beatSuggestions, entryRef, freeQuickKey, liveRef, QUICK_KEYS, quickOf, RECENT_MAX, refForScene, renameRefs, resolveRef, sceneSlug, uniqueSceneSlug } from "./assets";
import { applyStory, isStoryCommand } from "./storyReducer";
import { ambientById } from "./ambient";
import { capturesOf, CAPTURES_MAX, cluesOf, CLUES_MAX, hereRecord, writeHere } from "./offscript";
import type { Capture, Clue } from "./types";
import { catchUp, materialize, partiesFor, partiesOf, PARTIES_MAX, PARTY_COLORS, partyById, presentIds, recordKnowledge, seedKnowledge, tableParty, tellTable, tidyLive, WORLD_EVENTS_MAX } from "./world";
import { pendingPlacement, STORY_SECTION, syncStoryStatus } from "./episodeBuilder";
import type { Flyer, Party, WorldEvent } from "./types";
import type { Actor, Beat, BeatAction, Entry, EntryFact, Episode, FlyerText, Stage, GameState, Item, ItemTier, Job, Lead, LedgerEntry, LedgerKind, MapData, MapToken, Note, Pin, PinLink, Player, Rental, RenownChange, Scene, Session, SessionRun, Shop, StoryBlock, TradeRequest, Vote } from "./types";
import type { z } from "zod";
import { currentValue, madeIndex, sameValue, SUGGEST_FIELDS, type BuilderOp, type BuilderRef } from "./builderOps";
import { storyOf } from "./story";
import { monstersOf, reslotCombatant } from "./combat";
import { noticesOf } from "./board";
import { fillRanges, TABLES_MAX, tablesOf } from "./tables";
import type { MadeBy, RandomTable } from "./types";

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
  /** Makes a random private link code. The server passes one; without it, new players get their link from the Arrival tab. */
  token?: () => string;
}

export interface Result {
  state: GameState;
  ledger: LedgerEntry[];
  /** Created player id for system.join / player.add / knock.admit. */
  playerId?: string;
  /** Created job flyer id. */
  jobId?: string;
  /** Created board note id. */
  noticeId?: string;
  /** Created discovery entry / fact id. */
  entryId?: string;
  factId?: string;
  leadId?: string;
  /** Created story thread / story beat / session date id. */
  storyId?: string;
  /** Created clue / quick note id. */
  clueId?: string;
  captureId?: string;
  /** Created episode / beat ids. */
  episodeId?: string;
  beatId?: string;
  /** Created scene id. */
  sceneId?: string;
  /** Created token id. */
  tokenId?: string;
  /** Created party / world event id. */
  partyId?: string;
  eventId?: string;
  /** A note for whoever sent the command ("2 approved, 1 still needs you"). */
  info?: string;
}

function fail(msg: string, code?: string): never {
  throw new CommandError(msg, code);
}

export function isDmCommand(type: string): boolean {
  return !type.startsWith("me.") && !type.startsWith("system.");
}

/**
 * In a shared world the game shows the table (see world.ts). A phone's own
 * command runs against what that character knows, then the table is put back,
 * and whatever the table learned goes into the memories of those present.
 */
export function apply(input: GameState, cmd: Command, ctx: Ctx): Result {
  const out = applyWorld(input, cmd, ctx);
  // A rehearsal times each beat and fight as it goes.
  if (out.state.practice) trackPractice(out.state, ctx.now);
  return out;
}

function applyWorld(input: GameState, cmd: Command, ctx: Ctx): Result {
  if (!input.world) return applyOne(input, cmd, ctx);
  let base = input;
  if (ctx.actor.role === "player" && cmd.type.startsWith("me.")) {
    const pid = ctx.actor.playerId;
    base = materialize(structuredClone(input), [pid]);
    if (presentIds(input).includes(pid)) {
      base.renown = input.renown;
      base.renownPoints = input.renownPoints;
    }
  }
  const out = applyOne(base, cmd, ctx);
  if (base !== input) materialize(out.state, presentIds(out.state));
  recordKnowledge(input, out.state);
  return out;
}

/**
 * Bulk import: each row runs as the same command the DM would use by hand
 * (so slugs, limits and tidying match), one after another. Any failure throws,
 * so nothing is half imported. The error says which one.
 */
function importBulk(input: GameState, cmd: Extract<Command, { type: "import.bulk" }>, ctx: Ctx): Result {
  let state = input;
  const ledger: LedgerEntry[] = [];
  const step = (c: Command, what: string) => {
    try {
      const r = applyOne(state, c, ctx);
      state = r.state;
      ledger.push(...r.ledger);
    } catch (e) {
      if (e instanceof CommandError) fail(`${what}: ${e.message}`, e.code);
      throw e;
    }
  };
  const key = (x: string) => x.trim().toLowerCase().replace(/\s+/g, " ");
  for (const m of cmd.monsters ?? []) step({ type: "monster.add", monster: m }, m.name);
  for (const e of cmd.entries ?? []) {
    step({ type: "entry.add", entry: e.entry, facts: e.facts }, e.entry.name ?? "An entry");
    // A fresh campaign starts where its first fresh start would: rumored entries are rumors now. Quietly, no TV moment.
    const made = state.entries?.at(-1);
    if (made && made.start && made.start !== "hidden" && made.stage === "hidden") made.stage = made.start;
  }
  for (const it of cmd.items ?? []) {
    let shop = state.shops.find((x) => key(x.name) === key(it.shop));
    if (!shop) {
      step({ type: "shop.add", name: it.shop.trim(), subtitle: "" }, it.shop);
      shop = state.shops.at(-1)!;
    }
    step({ type: "item.add", item: { ...it.item, shopId: shop.id }, quiet: true }, it.item.name);
  }
  return { state, ledger };
}

/** A person's DM-only notes (the Worldbuilder writes these too). */
const PERSON_NOTES = ["wants", "knows", "voice", "look", "quirk"] as const;

/**
 * Approved Worldbuilder drafts. Each op runs as the DM command that makes the
 * same thing by hand, so slugs, limits and tidying match, and the result is
 * tagged with madeBy (DM-only). All or nothing: any failure throws. An op whose
 * draft is already in the game is skipped, so a retry can't make it twice.
 * Nothing here pins, reveals or announces, except an entry the DM chose to
 * approve at a stage past Hidden.
 */
function builderApply(input: GameState, ops: BuilderOp[], ctx: Ctx): Result {
  const dm: Ctx = { ...ctx, actor: { role: "dm" } };
  let state = input;
  const ledger: LedgerEntry[] = [];
  const made = madeIndex(input);
  const ids = new Map<string, string>([...made].map(([d, x]) => [d, x.id]));
  const step = (c: Command, what: string): Result => {
    try {
      const r = applyOne(state, c, dm);
      state = r.state;
      ledger.push(...r.ledger);
      return r;
    } catch (e) {
      if (e instanceof CommandError) fail(`${what}: ${e.message}`, e.code);
      throw e;
    }
  };
  const resolve = (r: BuilderRef, what: string): string => {
    if ("id" in r) return r.id;
    return ids.get(r.draft) ?? fail(`${what}: approve the draft it belongs to first.`);
  };
  const tag = (op: BuilderOp): MadeBy => ({ label: op.label, at: ctx.now, draft: op.draft });
  for (const op of ops) {
    if (made.has(op.draft)) continue;
    switch (op.kind) {
      case "entry": {
        const b = op.entry;
        const r = step(
          {
            type: "entry.add",
            entry: { kind: b.kind, name: b.name, title: b.title, summary: b.summary, nickname: b.nickname, hint: b.hint, areas: b.areas, dmNote: b.dmNote, secrets: b.secrets, wants: b.wants, knows: b.knows, voice: b.voice },
            facts: b.facts,
          },
          b.name,
        );
        const e = entriesOf(state).find((x) => x.id === r.entryId)!;
        e.madeBy = tag(op);
        for (const f of e.facts) f.madeBy = tag(op);
        ids.set(op.draft, e.id);
        if (op.stage !== "hidden") step({ type: "entry.stage", entryId: e.id, stage: op.stage, announce: false }, b.name);
        break;
      }
      case "fact": {
        const entryId = resolve(op.entry, "A fact");
        const r = step({ type: "entry.factAdd", entryId, text: op.text }, "A fact");
        const f = entriesOf(state).find((x) => x.id === entryId)?.facts.find((x) => x.id === r.factId);
        if (f) f.madeBy = tag(op);
        if (r.factId) ids.set(op.draft, r.factId);
        break;
      }
      case "link": {
        const a = resolve(op.a, "A link");
        const b = resolve(op.b, "A link");
        const e = entriesOf(state).find((x) => x.id === a) ?? fail("A link: that entry isn't in the compendium any more.");
        if (!entriesOf(state).some((x) => x.id === b)) fail("A link: that entry isn't in the compendium any more.");
        if (!e.links.includes(b)) step({ type: "entry.update", entryId: a, patch: { links: [...e.links, b] } }, "A link");
        break;
      }
      case "thread": {
        const t = op.thread;
        const r = step({ type: "story.threadAdd", thread: { name: t.name, description: t.description ?? "", goal: t.goal ?? "", kind: t.kind ?? "side" } }, t.name);
        const th = storyOf(state).threads.find((x) => x.id === r.storyId);
        if (th) th.madeBy = tag(op);
        if (r.storyId) ids.set(op.draft, r.storyId);
        break;
      }
      case "beat": {
        const threadId = resolve(op.thread, op.beat.title);
        const b = op.beat;
        const r = step({ type: "story.beatAdd", beat: { threadId, title: b.title, summary: b.summary ?? "", dmNotes: b.dmNotes ?? "", type: b.type ?? "clue", window: b.window ?? null } }, b.title);
        const sb = storyOf(state).beats.find((x) => x.id === r.storyId);
        if (sb) sb.madeBy = tag(op);
        if (r.storyId) ids.set(op.draft, r.storyId);
        break;
      }
      case "flyer": {
        const f = op.flyer;
        if (f.board === "job") {
          const r = step(
            {
              type: "job.add",
              job: {
                title: f.title,
                postedBy: f.postedBy ?? "",
                body: f.body ?? "",
                reward: { kind: f.rewardKind ?? "each", cp: Math.round((f.rewardGp ?? 0) * 100) },
                renown: f.renown ?? 0,
                ...(f.renownPoints !== undefined ? { renownPoints: f.renownPoints } : {}),
                dm: { adventure: f.dm?.adventure ?? "", loot: f.dm?.loot ?? "", twists: f.dm?.twists ?? "", notes: f.dm?.notes ?? "" },
              },
              pin: false,
            },
            f.title,
          );
          const j = jobsOf(state).find((x) => x.id === r.jobId);
          if (j) j.madeBy = tag(op);
          if (r.jobId) ids.set(op.draft, r.jobId);
        } else {
          const r = step({ type: "notice.add", notice: { title: f.title, body: f.body ?? "", sign: f.postedBy ?? "", dmNote: f.dmNote ?? "", up: false } }, f.title);
          const n = noticesOf(state).find((x) => x.id === r.noticeId);
          if (n) n.madeBy = tag(op);
          if (r.noticeId) ids.set(op.draft, r.noticeId);
        }
        break;
      }
      case "monster": {
        step({ type: "monster.add", monster: op.monster }, op.monster.name);
        const m = state.monsters!.at(-1)!;
        m.madeBy = tag(op);
        ids.set(op.draft, m.id);
        break;
      }
      case "table": {
        const t = op.table;
        step({ type: "table.add", table: { name: t.name, die: t.die, kind: t.kind, rows: t.rows, areas: t.areas ?? [], dmNote: t.dmNote ?? "" } }, t.name);
        const made2 = state.tables!.at(-1)!;
        made2.madeBy = tag(op);
        ids.set(op.draft, made2.id);
        break;
      }
      case "suggestion":
        applySuggestion(op, state, step);
        break;
    }
  }
  return { state, ledger };
}

/** A suggested change, only if the field still holds what the suggestion was based on. */
function applySuggestion(op: Extract<BuilderOp, { kind: "suggestion" }>, state: GameState, step: (c: Command, what: string) => Result) {
  const t = op.target;
  if (!SUGGEST_FIELDS[t.type].includes(op.field)) fail("That field can't be changed by a suggestion.");
  const now = currentValue(state, t, op.field);
  if (now === undefined) fail("A suggestion: what it changes isn't there any more.");
  if (sameValue(now, op.value)) return;
  if (!sameValue(now, op.before)) fail(`A suggestion: ${op.field} was changed after it was made. Reject it, or edit by hand.`);
  const v = op.value as never;
  const label = "A suggestion";
  switch (t.type) {
    case "entry":
      step({ type: "entry.update", entryId: t.id, patch: { [op.field]: v } }, label);
      break;
    case "fact":
      step({ type: "entry.factUpdate", entryId: t.entryId ?? "", factId: t.id, text: v }, label);
      break;
    case "beat":
      step({ type: "story.beatUpdate", beatId: t.id, patch: { [op.field]: v } }, label);
      break;
    case "thread":
      step({ type: "story.threadUpdate", threadId: t.id, patch: { [op.field]: v } }, label);
      break;
    case "monster": {
      const m = monstersOf(state).find((x) => x.id === t.id)!;
      const { id: _id, madeBy: _m, ...body } = m;
      step({ type: "monster.update", monsterId: t.id, monster: { ...body, sceneId: m.sceneId ?? null, [op.field]: v } as never }, label);
      break;
    }
    case "job": {
      const [a, b] = op.field.split(".");
      step({ type: "job.update", jobId: t.id, patch: b ? { dm: { [b]: v } } : { [a]: v } }, label);
      break;
    }
    case "notice":
      step({ type: "notice.update", noticeId: t.id, patch: { [op.field]: v } }, label);
      break;
    case "table": {
      const tb = tablesOf(state).find((x) => x.id === t.id)!;
      step({ type: "table.update", tableId: t.id, table: { name: tb.name, die: tb.die, kind: tb.kind, rows: v, areas: tb.areas, dmNote: tb.dmNote } }, label);
      break;
    }
  }
}

/** The thread that improvised story beats go to, made the first time it's needed. */
export const LOOSE_ENDS = "Loose ends";

/**
 * "Turn notes into…": a quick note becomes a draft through the same command
 * the DM would use by hand, then gets marked as needing review, tied to the
 * place and session it was jotted in, and the note is marked made.
 */
function makeFromCapture(input: GameState, cmd: Extract<Command, { type: "capture.make" }>, ctx: Ctx): Result {
  const cap = (input.captures ?? []).find((c) => c.id === cmd.captureId) ?? fail("That note isn't there any more.");
  if (cap.status === "made") fail("That note was already turned into something.");
  let state = input;
  const ledger: LedgerEntry[] = [];
  const step = (c: Command): Result => {
    const r = applyOne(state, c, ctx);
    state = r.state;
    ledger.push(...r.ledger);
    return r;
  };
  const title = cmd.title.replace(/\s+/g, " ").trim();
  const body = (cmd.body ?? "").trim();
  const review = { at: ctx.now, sessionId: cap.sessionId, ...(cap.placeId ? { placeId: cap.placeId } : {}) };
  let made: string;
  if (cmd.as === "person" || cmd.as === "place") {
    const r = step({ type: "entry.add", entry: { kind: cmd.as, name: title, summary: body } });
    const e = state.entries!.find((x) => x.id === r.entryId)!;
    e.origin = "capture";
    e.review = review;
    // A person met somewhere is tied to that place.
    const pl = cap.placeId ? state.entries!.find((x) => x.id === cap.placeId) : undefined;
    if (pl && pl.id !== e.id && !e.links.includes(pl.id)) e.links.push(pl.id);
    made = `${e.kind}/${e.slug}`;
  } else if (cmd.as === "fact") {
    if (!cmd.entryId) fail("Pick whose fact it is.");
    const r = step({ type: "entry.factAdd", entryId: cmd.entryId, text: title });
    made = `fact:${cmd.entryId}/${r.factId}`;
  } else if (cmd.as === "job") {
    const r = step({ type: "job.add", job: { title, body } });
    made = `job:${r.jobId}`;
  } else {
    let thread = (state.story?.threads ?? []).find((t) => t.name === LOOSE_ENDS);
    if (!thread) {
      const r = step({ type: "story.threadAdd", thread: { name: LOOSE_ENDS, kind: "side", description: "Things made up at the table, to weave in later." } });
      thread = state.story!.threads.find((t) => t.id === r.storyId)!;
    }
    const r = step({ type: "story.beatAdd", beat: { threadId: thread.id, title, summary: body, ...(cap.placeId ? { links: [{ kind: "entry" as const, id: cap.placeId }] } : {}) } });
    made = `beat:${r.storyId}`;
  }
  const c = state.captures!.find((x) => x.id === cap.id)!;
  c.status = "made";
  c.made = made;
  return { state, ledger };
}

/**
 * A generator result saved from the off-script panel. Made through entry.add
 * (a shop there also gets its hidden storefront), marked improvised and for
 * review, tied to where the party is; a shop's owner becomes a linked person.
 * Met: Found, with a name card on the TV only when asked.
 */
function improvSave(input: GameState, cmd: Extract<Command, { type: "improv.save" }>, ctx: Ctx): Result {
  let state = input;
  const ledger: LedgerEntry[] = [];
  const step = (c: Command): Result => {
    const r = applyOne(state, c, ctx);
    state = r.state;
    ledger.push(...r.ledger);
    return r;
  };
  const here = hereRecord(input);
  const review = { at: ctx.now, sessionId: input.currentSessionId, ...(here ? { placeId: here.placeId } : {}) };
  const add = (kind: "person" | "place" | "shop", d: Omit<Extract<Command, { type: "improv.save" }>["draft"], "owner">): Entry => {
    const { name, title, summary, ...notes } = d;
    const r = step({ type: "entry.add", entry: { kind, name, title, summary, ...(kind === "person" ? notes : {}) } });
    const e = state.entries!.find((x) => x.id === r.entryId)!;
    e.origin = "improvised";
    e.review = review;
    if (here && here.placeId !== e.id && !e.links.includes(here.placeId) && state.entries!.some((x) => x.id === here.placeId)) e.links.push(here.placeId);
    return e;
  };
  const main = add(cmd.as, cmd.draft);
  let owner: Entry | undefined;
  if (cmd.as === "shop" && cmd.draft.owner) {
    owner = add("person", { ...cmd.draft.owner, title: cmd.draft.owner.title || `Runs ${main.name}` });
    if (!owner.links.includes(main.id)) owner.links.push(main.id);
  }
  if (cmd.met) {
    step({ type: "entry.stage", entryId: main.id, stage: "found", announce: cmd.tv });
    if (owner) step({ type: "entry.stage", entryId: owner.id, stage: "found", announce: false });
  }
  return { state, ledger, entryId: main.id };
}

function applyOne(input: GameState, cmd: Command, ctx: Ctx): Result {
  // Authorisation is checked again here so a wiring mistake can't let a player run DM commands.
  if (isDmCommand(cmd.type) && ctx.actor.role !== "dm") fail("Only the DM can do that.");
  if (cmd.type.startsWith("me.") && ctx.actor.role !== "player") fail("Only a player can do that.");
  if (cmd.type.startsWith("system.") && ctx.actor.role !== "system") fail("Not allowed.");
  if (cmd.type === "import.bulk") return importBulk(input, cmd, ctx);
  if (cmd.type === "system.builderApply") return builderApply(input, cmd.ops, ctx);
  if (cmd.type === "capture.make") return makeFromCapture(input, cmd, ctx);
  if (cmd.type === "improv.save") return improvSave(input, cmd, ctx);

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
  const logRoll = (e: NonNullable<GameState["rolls"]>[number]) => {
    s.rolls = [...(s.rolls ?? []), e].slice(-LOG_MAX);
  };
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
    const now = tierOf(s, it);
    if (sh.visibility !== "all" || !shopOpenNow(s, sh) || RANK[now] <= RANK[was]) return;
    if (now === "rumored") announce(`A new rumor at ${sh.name}`);
    else announce(`New at ${sh.name}: ${it.name}`);
  };

  /** Which items and storefronts are locked right now (by Renown or someone's goodwill). */
  const gateSnapshot = () => ({
    tiers: new Map(s.items.map((it) => [it.id, tierOf(s, it)])),
    shut: s.shops.filter((sh) => !shopOpenNow(s, sh)).map((sh) => sh.id),
  });
  /** Banners for what opened since the snapshot: storefronts, then items (named, or counted when it's a lot). */
  const announceOpened = (before: ReturnType<typeof gateSnapshot>) => {
    for (const id of before.shut) {
      const sh = shop(id);
      if (shopOpenNow(s, sh) && sh.visibility === "all" && !isSecretShop(sh)) announce(`Now open: ${sh.name}`);
    }
    const opened = s.items.filter((it) => {
      const sh = s.shops.find((x) => x.id === it.shopId);
      return before.tiers.get(it.id) === "locked" && tierOf(s, it) === "sale" && sh?.visibility === "all" && shopOpenNow(s, sh) && !isSecretShop(sh);
    });
    if (opened.length > 3) announce(`${opened.length} new things in the shops`);
    else if (opened.length) announce(`Now for sale: ${opened.map((it) => it.name).join(", ")}`);
  };

  /**
   * Set the party's rank. Raising it writes the Chronicle, plays the TV moment
   * (unless tv is false) and banners what opened; lowering it is quiet (only a
   * reason goes in the Chronicle). Used by the DM's +/− and by points crossing a threshold.
   */
  const setRank = (to: number, why: string | undefined, tv: boolean | undefined) => {
    const was = renownOf(s);
    if (to === was) return;
    // What the room could see before, so the rank-up can say what opened.
    const before = gateSnapshot();
    s.renown = to;
    const r = ranksOf(s)[to];
    if (to < was) {
      // Quiet: things just lock again. Only a reason goes in the Chronicle.
      if (why) chronicle(`Renown: the party is now ${r.name}. ${why}`);
      return;
    }
    chronicle(`Renown: the party is now ${r.name}. ${why || `${r.meaning}.`}`);
    if (tv === false) return;
    announce(r.raised);
    s.renownMoment = { rank: to, n: ++s.seq, at: ctx.now };
    announceOpened(before);
  };
  /** Note a change to the Renown points in the DM's history (the newest 300). */
  const logRenown = (c: Omit<RenownChange, "id" | "at" | "total" | "chapter">) => {
    const chapter = chapterAt(s, ctx.now);
    const e: RenownChange = { id: nextId("rn"), at: ctx.now, ...c, total: pointsOf(s), ...(chapter !== undefined ? { chapter } : {}), ...(s.world ? { playerIds: presentIds(s), ...(s.partyId ? { partyId: s.partyId } : {}) } : {}) };
    s.renownLog = [...(s.renownLog ?? []), e].slice(-300);
  };
  /** Add (or take) Renown points; crossing the next threshold raises the rank. Never lowers it. */
  const addRenown = (amount: number, c: Pick<RenownChange, "source" | "reason" | "label" | "jobId">, tv?: boolean) => {
    const was = renownOf(s);
    s.renownPoints = Math.max(0, Math.min(RENOWN_POINTS_MAX * 2, pointsOf(s) + amount));
    const reach = rankForPoints(s, s.renownPoints);
    if (reach > was) setRank(reach, undefined, tv);
    logRenown({ ...c, amount, rankFrom: was, rankTo: renownOf(s) });
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
        const was = tierOf(s, target);
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
    checkFunded(it);
  };
  const checkFunded = (it: Item) => {
    if (!s.effectsOn[it.id] && raisedCp(s, it.id) >= it.priceCp) {
      announcePublic(it.shopId, `Funded: ${it.name}!`);
      turnOn(it);
      const npcs = [...new Set((s.npcStakes ?? []).filter((k) => k.itemId === it.id).map((k) => k.from))];
      const who = [...[...sharesOf(s, it.id).keys()].map((id) => s.players.find((x) => x.id === id)?.name ?? "someone"), ...npcs].join(", ");
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
  /** A rental stops (a hireling let go or dead). */
  const endRental = (rid: string) => {
    const r = s.rentals.find((x) => x.id === rid);
    if (r && r.active) {
      r.active = false;
      r.endedAt = ctx.now;
    }
  };
  const fulfil = (p: Player, it: Item, qty: number, chargeCp: number, extra: Partial<LedgerEntry> = {}, more: { question?: string; flyer?: FlyerText; rewardCp?: number } = {}) => {
    if (it.kind === "earned") fail(`${it.name} can't be bought. You grant it.`);
    if (it.kind === "project") fail(`${it.name} is a project: contribute to it instead.`);
    if (it.stock !== null) it.stock = Math.max(0, it.stock - qty);
    const listCp = firstChargeCp(s, it) * qty;
    const haggled = chargeCp !== listCp ? ` (${formatCp(listCp)}, settled at ${formatCp(chargeCp)})` : "";
    const what = qty > 1 ? `${qty} × ${it.name}` : it.name;
    const ledgerExtra: Partial<LedgerEntry> = { itemId: it.id, ...(chargeCp !== listCp ? { listCp } : {}), ...extra };
    const question = more.question?.trim();
    if (it.kind === "recurring") {
      const hireling = it.companionTemplateId ? companionTemplatesOf(s).find((t) => t.id === it.companionTemplateId) : undefined;
      move(p, -chargeCp, hireling ? `Hired ${hireling.name} (this session)${haggled}` : `Rented ${it.name} (first month)${haggled}`, "rent", ledgerExtra);
      const rental: Rental = { id: nextId("rn"), itemId: it.id, itemName: it.name, playerId: p.id, monthlyCp: priceOf(s, it), startedAt: ctx.now, paidThrough: coversSession(), active: true };
      s.rentals.push(rental);
      // A hireling: they join the party, run by whoever hired them, until let go.
      if (hireling) {
        rental.hire = true;
        attachCompanion(s, hireling, p.id, "until", { now: ctx.now, nextId }, { hire: { rentalId: rental.id, buyerId: p.id } });
      }
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
      if (more.flyer) {
        const up = boardHasRoom();
        const text = cleanFlyer(more.flyer, penName(p));
        const fl: Flyer = { id: nextId("fl"), playerId: p.id, ...text, postedAt: ctx.now, up, ...(up ? { pinnedAt: ctx.now, place: placeFor(s, { ...text }) } : {}) };
        // A shared world: signed with the poster's party, so other parties know who's asking.
        const party = s.world ? (tableParty(s)?.memberIds.includes(p.id) ? tableParty(s) : partiesOf(s).find((x) => x.memberIds.includes(p.id))) : undefined;
        if (party) fl.partyId = party.id;
        // Their own gold as the reward: taken now and held until the DM pays it out or gives it back.
        if (more.rewardCp) {
          move(p, -more.rewardCp, `Reward held for your flyer: ${text.title}`, "charge", extra);
          fl.rewardCp = more.rewardCp;
        }
        s.flyers.push(fl);
        if (!up) out.info = `The board is full (${BOARD_SLOTS} up), so the flyer is approved and waiting in the drawer. Put it up from the Board tab.`;
      }
    } else {
      move(p, -chargeCp, `Bought ${what}${haggled}`, "purchase", ledgerExtra);
    }
    if (keepsStake(it)) addStake(it, p, chargeCp);
    if (it.effects?.length) turnOn(it);
  };

  const request = (id: string): TradeRequest => s.requests.find((r) => r.id === id) ?? fail("That request doesn't exist.");

  // ---------- the notice board ----------
  const jobs = (s.jobs ??= []);
  const job = (id: string): Job => jobs.find((j) => j.id === id) ?? fail("That job flyer doesn't exist.");
  /** Shared world: a job someone takes is the playing party's. */
  const takeForParty = (j: Job) => {
    if (s.world && s.partyId) j.partyId = s.partyId;
  };
  const boardHasRoom = () => pinnedCount(s) < BOARD_SLOTS;
  const needRoom = () => {
    if (!boardHasRoom()) fail(`The board is full (${BOARD_SLOTS} up). Take something down first.`);
  };
  const notices = (s.notices ??= []);
  const notice = (id: string): Notice => notices.find((n) => n.id === id) ?? fail("That note isn't on the board any more.");
  /** A short name no other note has. */
  const freeSlug = (want: string, self?: string) => {
    const taken = new Set(boardNotes(s).filter((n) => n.id !== self).map((n) => n.slug));
    let slug = noteSlug(want);
    for (let i = 2; taken.has(slug); i++) slug = `${noteSlug(want).slice(0, 36)}-${i}`;
    return slug;
  };
  /** Where something goes up: its old spot, or the emptiest one, on top. */
  const goingUp = (n: Parameters<typeof placeFor>[1], at?: NotePlace) => cleanPlace(at ?? (n.place ? { ...n.place, z: topZ(s) + 1 } : placeFor(s, n)));
  /** A Chronicle line from the DM. Never blocks the command if the Chronicle is full. */
  const chronicle = (text: string) => {
    if ((s.notes ?? []).length >= NOTES_MAX) return;
    addNote(DM_AUTHOR, "The DM", text, [], undefined);
  };
  /** Why an item can't be bought because of the party's Renown, or null. */
  const renownLock = (it: Item): string | null => {
    const need = renownNeeded(s, it);
    if (need !== null && it.tier === "sale") return `${it.name} opens when the party is ${rankName(need, s)}.`;
    const trust = it.tier === "sale" ? trustText(s, it.trust) : null;
    return trust ? `${it.name} needs ${trust}.` : null;
  };

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
    if (r.kind === "job") {
      const j = jobs.find((x) => x.id === r.jobId) ?? fail(`${r.jobTitle ?? "That job"} has come down. Decline it instead.`);
      if (j.status !== "open") fail(`${jobTitle(j)} is already ${j.status}.`, "recheck");
      if (!override && p.archived) fail(`${p.name} has left the table.`, "recheck");
      // A job belongs to the whole party, whoever tapped the button (in a shared world, the party at the table).
      j.status = "taken";
      delete j.takenBy;
      j.takenAt = ctx.now;
      takeForParty(j);
      if (j.pinned) announce(`${s.world && tableParty(s) ? tableParty(s)!.name : "The party"} took the job: ${jobTitle(j)}`);
      // Nobody else needs to ask for it now.
      for (const o of s.requests) {
        if (o.id !== r.id && o.status === "pending" && o.kind === "job" && o.jobId === j.id) {
          o.status = "declined";
          o.decidedAt = ctx.now;
          o.reason = "The party already took it.";
        }
      }
      r.status = "approved";
      r.decidedAt = ctx.now;
      return;
    }
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
      move(p, -r.totalCp, `Sent ${formatCp(r.totalCp)} to ${penName(to)}${note}`, "transfer", { batchId, requestId: r.id });
      move(to, r.totalCp, `From ${penName(p)}${note}`, "transfer", { batchId, requestId: r.id });
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
        if (tierOf(s, item) !== "sale") fail(renownLock(item) ?? `${item.name} isn't for sale any more.`, "recheck");
      }
      const flyer = more.flyer ?? r.flyer;
      if (flyer) r.flyer = cleanFlyer(flyer, penName(p));
      const reward = r.flyer ? (r.rewardCp ?? 0) : 0;
      if (reward && !override && p.balanceCp - charge < reward) fail(`${p.name} only has ${formatCp(p.balanceCp)} now, not ${formatCp(charge + reward)} with the reward.`, "recheck");
      fulfil(p, item, r.qty, charge, { requestId: r.id }, { question: r.question, flyer: r.flyer, rewardCp: reward });
      r.chargedCp = charge;
      const answer = more.answer?.trim();
      if (answer) r.answer = answer;
      if (s.tvPurchases !== false && !r.secret && !isSecretShop(s.shops.find((x) => x.id === item.shopId)) && (item.kind === "purchase" || item.kind === "order")) {
        announce(`${penName(p)} bought ${boughtPhrase(item.name, r.qty)}`);
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
    giveLink(p);
    s.players.push(p);
    out.playerId = p.id;
    markAttending(p.id);
    // A shared world: a new character joins the party at the table and catches up on what it knows.
    const party = s.world ? tableParty(s) : undefined;
    if (party && party.memberIds.length < 50) {
      catchUp(s, p.id, party);
      party.memberIds.push(p.id);
      p.renown = s.renown ?? 0;
    }
    return p;
  };

  /** A private Arrival link, unique in this game. */
  const giveLink = (p: Player) => {
    if (p.arrival?.token || !ctx.token) return;
    let t = ctx.token();
    while (s.players.some((x) => x.arrival?.token === t)) t = ctx.token();
    p.arrival = { ...p.arrival, token: t };
  };
  /** The player a /api/arrival call is for (already matched to the link code by the server). */
  const arriving = (playerId: string): Player => {
    const p = player(playerId);
    if (p.archived || !p.arrival) fail("That link doesn't work any more. Ask the DM for a new one.");
    return p;
  };

  const markAttending = (playerId: string) => {
    const cur = s.sessions.find((x) => x.id === s.currentSessionId);
    if (cur && !cur.attendeeIds.includes(playerId)) cur.attendeeIds.push(playerId);
  };

  // Special orders come up from Baldur's Gate in Candlefair; anywhere else they just arrive.
  const fromAfar = () => (originOf(s).kind === "candlefair" ? " from Baldur\u2019s Gate" : "");
  const homeScene = () => (s.scenes.find((x) => x.kind === "notice" && !x.reveal) ?? s.scenes.find((x) => !x.reveal) ?? s.scenes[0]).id;

  const showScene = (id: string) => {
    const shown = s.scenes.find((x) => x.id === id);
    // Once an NPC's portrait has been on the TV, the table has met them.
    if (shown?.kind === "portrait") meetPortrait(shown);
    // Once a map has been on the TV, players can open it on their phones.
    if (shown?.kind === "map") shown.known = true;
    // Mark it shown, so from now on its uploaded picture may reach players/TV (but not before its first reveal).
    if (shown) shown.shownAt ??= ctx.now;
    s.live.sceneId = id;
    s.live.shopOpen = false;
    delete s.live.recapSessionId;
    delete s.live.focus;
    delete s.live.banner;
    delete s.live.note;
    delete s.live.ambient;
    // The leads board sits over the scene; a new scene takes it down.
    delete s.live.leads;
    if (shown) noteShown(refForScene(s, shown));
  };
  /** An ambient scene over the black screen, with its caption (or the current place's, when it's that place's scene). */
  const showAmbient = (id: string, caption?: string) => {
    const a = ambientById(id) ?? fail("That scene isn't in the library.");
    const black = s.scenes.find((x) => x.kind === "black");
    if (black) {
      s.live.sceneId = black.id;
      delete s.live.focus;
      delete s.live.banner;
      delete s.live.note;
    }
    s.live.shopOpen = false;
    delete s.live.recapSessionId;
    delete s.live.leads;
    const here = hereRecord(s);
    const place = here ? entriesOf(s).find((e) => e.id === here.placeId) : undefined;
    const words = caption !== undefined ? caption.trim() : place?.place?.scene === `ambient/${a.id}` ? (place.place.caption ?? "") : "";
    s.live.ambient = { id: a.id, ...(words ? { caption: cleanLine(words) } : {}) };
    noteShown(`ambient/${a.id}`);
  };
  /** The party is somewhere new: remember it, and log it in the Chronicle (hidden, so it's the DM's until shared). */
  const moveHere = (placeId: string | null) => {
    if (!writeHere(s, placeId, ctx.now) || !placeId) return;
    const pl = entriesOf(s).find((e) => e.id === placeId);
    if (!pl || (s.notes ?? []).length >= NOTES_MAX) return;
    const n = addNote(DM_AUTHOR, "The DM", `The party went to ${pl.name}.`, [pl.name], undefined);
    n.hidden = true;
  };
  /** Showing a place, or its pin on a map, means the party is there. */
  const followShown = (a: { entry?: Entry; pin?: Pin; scene?: Scene }) => {
    if (a.entry?.kind === "place") return moveHere(a.entry.id);
    if (a.pin && a.scene) {
      const pl = entriesOf(s).find((e) => e.kind === "place" && e.pin?.sceneId === a.scene!.id && e.pin.pinId === a.pin!.id);
      if (pl) moveHere(pl.id);
    }
  };
  /** "Recently shown" on the DM's console. */
  const noteShown = (ref: string) => {
    s.recent = [ref, ...(s.recent ?? []).filter((r) => r !== ref)].slice(0, RECENT_MAX);
  };
  /** Just before the black screen, so ← from the first scene still wraps to black. */
  const insertScene = (sc: Scene) => {
    const black = s.scenes.findIndex((x) => x.kind === "black");
    s.scenes.splice(black < 0 ? s.scenes.length : black, 0, sc);
  };
  const showStinger = () => {
    // Games made before the stinger get its scene the first time it plays.
    let sc = s.scenes.find((x) => x.kind === "stinger");
    if (!sc) {
      sc = { ...STINGER_SCENE, id: s.scenes.some((x) => x.id === STINGER_SCENE_ID) ? nextId("s") : STINGER_SCENE_ID };
      insertScene(sc);
    }
    showScene(sc.id);
  };
  const showTable = () => {
    let sc = s.scenes.find((x) => x.kind === "table");
    if (!sc) {
      sc = { id: s.scenes.some((x) => x.id === TABLE_SCENE_ID) ? nextId("s") : TABLE_SCENE_ID, label: "The Table", kind: "table", reveal: false, alt: "The round table from above, one candle per player" };
      insertScene(sc);
    }
    showScene(sc.id);
  };
  /** A map, zoomed to one of its pins. A hidden pin is discovered (and its place found), with the banner. */
  const showPin = (sc: Scene, p: Pin) => {
    showScene(sc.id);
    if (!p.discovered) {
      p.discovered = true;
      s.live.banner = { pinId: p.id, n: ++s.seq };
      for (const e of entriesOf(s).filter((x) => x.pin?.sceneId === sc.id && x.pin.pinId === p.id)) if (!isFound(e.stage)) setStage(e, "found", false);
    }
    s.live.focus = { pinId: p.id, n: ++s.seq };
    noteShown(liveRef(s) ?? refForScene(s, sc));
  };
  /** An entry's picture scene: a portrait card with its name and title. Made (blank) the first time it's needed. */
  const ensurePicture = (e: Entry): Scene => {
    const have = entryScene(s, e);
    if (have) return have;
    // A monster borrows its template's picture to start with.
    const tpl = e.templateId ? (s.monsters ?? []).find((x) => x.id === e.templateId) : undefined;
    const from = tpl?.sceneId ? s.scenes.find((x) => x.id === tpl.sceneId && x.kind === "portrait") : undefined;
    const sc: Scene = { id: nextId("s"), label: e.name, kind: "portrait", reveal: false, art: from?.art ? { ...from.art } : {}, name: e.name, title: e.title, alt: `Picture of ${e.name}` };
    sc.slug = uniqueSceneSlug(s.scenes, `${e.slug}-picture`);
    insertScene(sc);
    e.sceneId = sc.id;
    return sc;
  };
  /**
   * Show anything by its ref. People (and anything else with a picture) show
   * their picture; a place with no picture shows its map zoomed to its pin; a
   * shop opens its storefront. Showing something the party hasn't found finds
   * it, the way showing a portrait always has.
   */
  const showRef = (ref: string) => {
    const a = resolveRef(s, ref) ?? fail("That isn't there any more.");
    if (a.ambient) return showAmbient(a.ambient);
    followShown(a);
    if (a.screen === "leads") {
      s.live.leads = true;
      noteShown("leads");
      return;
    }
    if (a.screen === "table") return showTable();
    if (a.note) {
      // Up close, over the notice board. A note in the drawer can be shown without hanging it.
      const board = s.scenes.find((x) => x.kind === "notice") ?? fail("There's no notice board in this game.");
      showScene(board.id);
      s.live.note = { kind: a.note.kind, id: a.note.id };
      noteShown(a.ref);
      return;
    }
    if (a.screen === "stinger") return showStinger();
    if (a.screen) return showScene((a.scene ?? fail(`There's no ${a.label.toLowerCase()} in this game.`)).id);
    if (a.pin && a.scene) return showPin(a.scene, a.pin);
    if (!a.entry) return showScene(a.scene!.id);
    const e = a.entry;
    const pic = entryScene(s, e);
    if (pic) return showScene(pic.id);
    const pinScene = e.pin && s.scenes.find((x) => x.id === e.pin!.sceneId);
    const pin = pinScene?.map?.pins.find((p) => p.id === e.pin!.pinId);
    if (pinScene && pin) {
      if (!isFound(e.stage)) setStage(e, "found", true);
      return showPin(pinScene, pin);
    }
    const sh = e.shopId ? s.shops.find((x) => x.id === e.shopId) : undefined;
    if (sh) {
      if (!isFound(e.stage)) setStage(e, "found", true);
      if (sh.visibility !== "all") fail(`${sh.name} is hidden from the party. Open it to everyone first.`);
      delete s.live.shopCategory;
      s.live.shopId = sh.id;
      s.live.shopOpen = true;
      delete s.live.recapSessionId;
      delete s.live.leads;
      noteShown(entryRef(e));
      return;
    }
    if (s.scenes.length >= 400) fail("There are too many pictures already.");
    showScene(ensurePicture(e).id);
  };
  const removeEntry = (id: string) => {
    s.entries = entriesOf(s).filter((x) => x.id !== id);
    for (const e of s.entries) if (e.links.includes(id)) e.links = e.links.filter((x) => x !== id);
    if (s.discovery?.entryId === id) delete s.discovery;
    // The off-script kit forgets it too.
    for (const c of cluesOf(s)) {
      if (c.fact?.entryId === id) delete c.fact;
      if (c.entryId === id) delete c.entryId;
      c.tags = c.tags.filter((t) => t !== id);
      if (c.delivered?.placeId === id) delete c.delivered.placeId;
      if (c.delivered?.viaId === id) delete c.delivered.viaId;
    }
    for (const c of capturesOf(s)) if (c.placeId === id) delete c.placeId;
    if (s.here?.placeId === id) delete s.here;
    for (const p of s.parties ?? []) if (p.here?.placeId === id) delete p.here;
    pruneRefs();
  };
  const removeShop = (id: string) => {
    if (!s.shops.some((x) => x.id === id)) fail("That shop doesn't exist.");
    if (s.shops.length <= 1) fail("Keep at least one shop.");
    s.shops = s.shops.filter((x) => x.id !== id);
    s.items = s.items.filter((x) => x.shopId !== id);
    for (const sc of s.scenes) for (const p of sc.map?.pins ?? []) if (p.link?.kind === "shop" && p.link.shopId === id) delete p.link;
    if (s.live.shopId === id) s.live.shopId = s.shops[0].id;
  };
  /** Forget quick slots and recents that point at something deleted. */
  const pruneRefs = () => {
    if (s.quick) s.quick = s.quick.map((r) => (r && resolveRef(s, r) ? r : null));
    if (s.recent) s.recent = s.recent.filter((r) => resolveRef(s, r));
  };
  /** Quick slots, written out (games not yet upgraded start from their hotkeys). */
  const quickSlots = (): (string | null)[] => (s.quick = quickOf(s));

  const startSession = (title?: string): Session => {
    const number = nextSessionNumber(s);
    const sess: Session = {
      id: nextId("sess"),
      number,
      title: title?.trim() || `Session ${number}`,
      startedAt: ctx.now,
      endedAt: null,
      attendeeIds: s.players.filter((p) => !p.archived && !p.away).map((p) => p.id),
      ...(s.world && s.partyId ? { partyId: s.partyId } : {}),
    };
    s.sessions.push(sess);
    s.currentSessionId = sess.id;
    // Notes written ahead on the next chapter's page belong to this session now (in a shared world, this party's).
    for (const n of s.notes ?? []) {
      if (n.sessionId !== null || n.world || (s.world && n.partyId && n.partyId !== s.partyId)) continue;
      n.sessionId = sess.id;
      delete n.partyId;
    }
    showScene(homeScene());
    // Special orders due by this session arrive (whether started here or by run-game).
    // In a shared world chapters count per party: only orders for someone at this table arrive.
    const here = new Set(sess.attendeeIds);
    const due = s.orders.filter((o) => !o.arrived && o.arrivesAtSession <= number && (!s.world || here.has(o.playerId)));
    for (const o of due) o.arrived = true;
    const log: string[] = due.map((o) => `Arrived: ${o.itemName} for ${s.players.find((p) => p.id === o.playerId)?.name ?? "someone"}`);
    if (due.length === 1) {
      const who = s.players.find((p) => p.id === due[0].playerId);
      announce(`Arrived${fromAfar()}: ${due[0].itemName} for ${who ? penName(who) : "someone"}`);
    }
    else if (due.length > 1) announce(`${due.length} special orders have arrived${fromAfar()}`);
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
  const storyBeat = (id: string) => (s.story?.beats ?? []).find((b) => b.id === id) ?? fail("That story beat isn't there any more.");
  // ---------- the off-script kit ----------
  const clue = (id: string): Clue => cluesOf(s).find((c) => c.id === id) ?? fail("That clue isn't there any more.");
  const capture = (id: string): Capture => capturesOf(s).find((c) => c.id === id) ?? fail("That note isn't there any more.");
  const patchClue = (c: Clue, p: Extract<Command, { type: "clue.update" }>["patch"]) => {
    if (p.text !== undefined) c.text = p.text.replace(/\s+/g, " ").trim();
    if (p.episodeId !== undefined) c.episodeId = p.episodeId === null ? null : episode(p.episodeId).id;
    if (p.fact !== undefined) {
      if (p.fact) {
        const e = entriesOf(s).find((x) => x.id === p.fact!.entryId) ?? fail("That isn't in the compendium any more.");
        if (!e.facts.some((f) => f.id === p.fact!.factId)) fail("That fact isn't there any more.");
        c.fact = { entryId: p.fact.entryId, factId: p.fact.factId };
      } else delete c.fact;
    }
    if (p.entryId !== undefined) {
      if (p.entryId) c.entryId = (entriesOf(s).find((x) => x.id === p.entryId) ?? fail("That isn't in the compendium any more.")).id;
      else delete c.entryId;
    }
    if (p.storyBeatId !== undefined) {
      if (p.storyBeatId) c.storyBeatId = storyBeat(p.storyBeatId).id;
      else delete c.storyBeatId;
    }
    if (p.tags !== undefined) {
      const known = new Set([...entriesOf(s).map((e) => e.id), ...(s.story?.threads ?? []).map((t) => t.id)]);
      c.tags = [...new Set(p.tags)].filter((t) => known.has(t));
    }
  };
  /** A beat rewritten from Markdown keeps the ticks its story blocks had. */
  const keepTicks = (b: Beat, old: StoryBlock[] | undefined): Beat => {
    for (const x of b.stories ?? []) {
      const was = old?.find((o) => o.storyBeatId === x.storyBeatId && o.done);
      if (was?.done) x.done = was.done;
    }
    return b;
  };
  const session = (id: string): Session => s.sessions.find((x) => x.id === id) ?? fail("That session doesn't exist.");
  const curSession = (): Session => s.sessions.find((x) => x.id === s.currentSessionId) ?? fail("No session is running.");
  const curRun = () => {
    const sess = curSession();
    const run = sess.run ?? fail("This session isn't running an episode. Start run-game mode first.");
    return { sess, run, ep: episode(run.episodeId) };
  };
  const makeBeat = (b: z.infer<typeof beatBody>): Beat => {
    const beat: Beat = { id: nextId("b"), title: b.title.trim() || "New beat", notes: b.notes, checks: b.checks, branches: b.branches, actions: b.actions };
    if (b.dismissed?.length) beat.dismissed = [...new Set(b.dismissed)];
    if (b.stories?.length) {
      const known = new Set((s.story?.beats ?? []).map((x) => x.id));
      const ids = [...new Set(b.stories.map((x) => x.storyBeatId))].filter((x) => known.has(x));
      if (ids.length) beat.stories = ids.map((storyBeatId) => ({ storyBeatId }));
    }
    if (b.readAloud?.length) {
      beat.readAloud = b.readAloud;
      beat.readAloudAt = Math.min(b.readAloudAt ?? 0, b.notes.length);
    }
    return beat;
  };
  // Combat mode (combatReducer.ts) gets the same ids, ledger, Chronicle and TV as everything else.
  const fightHelpers: FightHelpers = {
    now: ctx.now,
    actorPlayerId: ctx.actor.role === "player" ? ctx.actor.playerId : null,
    rand,
    nextId,
    fail,
    player,
    move,
    addNote: (authorId, authorName, text) => {
      addNote(authorId, authorName, text, undefined, undefined);
      return s.notes![s.notes!.length - 1].id;
    },
    showScene: (id) => showScene(id),
    task: (text) => task(text),
    endRental: (rid) => endRental(rid),
  };
  const fireAction = (a: BeatAction) => {
    if (a.type === "scene") {
      if (s.scenes.some((x) => x.id === a.sceneId)) showScene(a.sceneId);
    } else if (a.type === "show") {
      // Something deleted since the beat was written just does nothing.
      if (resolveRef(s, a.ref)) showRef(a.ref);
    } else if (a.type === "black") {
      const black = s.scenes.find((x) => x.kind === "black");
      if (black) showScene(black.id);
    } else if (a.type === "stinger") {
      showStinger();
    } else if (a.type === "bank") {
      // The bank is the DM's screen; the TV shows the purse.
      s.live.purseVisible = true;
      s.live.shopOpen = false;
      delete s.live.recapSessionId;
    } else if (a.type === "fight") {
      // "Roll initiative!" on the TV and the phones. A fight already going is left alone.
      startFightFromBeat(s, a.monsters, "", fightHelpers);
    } else if (a.type === "reveal") {
      // Forward only: a run sheet never takes back what the table already knows.
      const hit = findRef(s, a.ref);
      if (hit && stageRank(a.stage) > stageRank(hit.entry.stage)) setStage(hit.entry, a.stage, true);
    } else if (a.type === "fact") {
      const hit = findRef(s, a.ref);
      if (hit?.fact && hit.fact.revealedAt === undefined) revealFact(hit.entry, hit.fact, true);
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

  // ---------- Discovery ----------
  const entry = (id: string): Entry => entriesOf(s).find((x) => x.id === id) ?? fail("That isn't in the compendium any more.");
  const factOf = (e: Entry, id: string): EntryFact => e.facts.find((f) => f.id === id) ?? fail("That fact isn't there any more.");
  const playMoment = (e: Entry, from?: Stage, factId?: string) => {
    s.discovery = { entryId: e.id, n: ++s.seq, at: ctx.now, ...(from ? { from } : {}), ...(factId ? { factId } : {}) };
  };
  const foundLine = (e: Entry) => {
    const title = e.title.trim() ? `, ${e.title.trim().replace(/^[A-Z](?=[a-z])/, (c) => c.toLowerCase())}` : "";
    switch (e.kind) {
      case "person":
        return `The party met ${e.name}${title}.`;
      case "place":
        return `The party visited ${e.name}.`;
      case "shop":
        return `Now open to the party: ${e.name}.`;
      case "monster":
        return `The party encountered ${e.name}.`;
      default:
        return `The party found ${e.name}.`;
    }
  };
  /** Move an entry to a stage. Already there: nothing happens. Returns whether it moved. */
  const setStage = (e: Entry, to: Stage, announce: boolean): boolean => {
    const from = e.stage;
    if (from === to) return false;
    e.stage = to;
    e.stagedAt = ctx.now;
    const sc = entryScene(s, e);
    if (isFound(to) && !isFound(from)) {
      e.foundAt = ctx.now;
      e.foundIn = s.currentSessionId;
      if (sc) sc.known = true;
      if ((s.notes ?? []).length < NOTES_MAX) addNote(DM_AUTHOR, "The DM", foundLine(e), entryTags(s, e), undefined);
    } else if (!isFound(to) && isFound(from)) {
      delete e.foundAt;
      delete e.foundIn;
      if (sc && !entriesForScene(s, sc.id).some((x) => isFound(x.stage))) delete sc.known;
    }
    syncOut(e, from);
    if (to === "hidden") {
      if (s.discovery?.entryId === e.id) delete s.discovery;
    } else if (announce) playMoment(e, from);
    return true;
  };
  /** Players learn a fact: the entry becomes Known. tv: the TV shows it. */
  const revealFact = (e: Entry, f: EntryFact, tv: boolean) => {
    if (f.revealedAt === undefined) {
      f.revealedAt = ctx.now;
      f.learnedIn = s.currentSessionId;
    }
    const from = e.stage;
    setStage(e, "known", false);
    if (tv) playMoment(e, from, f.id);
  };
  /** A place's pin and a shop's storefront follow the entry's stage. */
  const syncOut = (e: Entry, from: Stage) => {
    const pin = e.pin && s.scenes.find((x) => x.id === e.pin!.sceneId)?.map?.pins.find((p) => p.id === e.pin!.pinId);
    if (pin) {
      pin.discovered = e.stage !== "hidden";
      if (!pin.discovered) dropFocus(pin.id);
    }
    const sh = e.shopId ? s.shops.find((x) => x.id === e.shopId) : undefined;
    if (sh) {
      if (isFound(e.stage) && sh.visibility === "hidden") {
        sh.visibility = "all";
        sh.playerIds = [];
      } else if (!isFound(e.stage) && isFound(from) && sh.visibility !== "hidden") {
        sh.visibility = "hidden";
        sh.playerIds = [];
        if (s.live.shopId === sh.id) s.live.shopOpen = false;
      }
    }
  };
  /** Tie a place to a map pin (one place per pin). A pin the table can already
   * see makes the place Found; otherwise the pin follows the place. */
  const linkPin = (e: Entry, at: { sceneId: string; pinId: string }) => {
    const pin = pinOf(mapOf(at.sceneId), at.pinId);
    for (const x of entriesOf(s)) if (x !== e && x.pin?.sceneId === at.sceneId && x.pin.pinId === at.pinId) delete x.pin;
    e.pin = { sceneId: at.sceneId, pinId: at.pinId };
    if (pin.discovered && !isFound(e.stage)) setStage(e, "found", false);
    else syncOut(e, e.stage);
  };
  /** Monsters the party fought: a rumor under the TV name, or encountered once revealed. create: make entries for new ones (at the end of a fight). */
  const noteMonsters = (create: boolean) => {
    const f = s.fight;
    if (!f) return;
    const seen = new Map<string, boolean>();
    for (const c of f.order) {
      if (c.kind !== "monster" || c.hidden || !c.templateId) continue;
      seen.set(c.templateId, (seen.get(c.templateId) ?? false) || c.revealed || !c.displayName.trim());
    }
    for (const [tid, revealed] of seen) {
      const t = (s.monsters ?? []).find((x) => x.id === tid);
      if (!t) continue;
      let e = entriesOf(s).find((x) => x.templateId === tid);
      if (!e) {
        if (!create || entriesOf(s).length >= ENTRIES_MAX) continue;
        const list = (s.entries ??= []);
        e = blankEntry(list, nextId("e"), "monster", t.name, { nickname: t.displayName.trim(), templateId: tid });
        list.push(e);
      }
      if (revealed) setStage(e, isFound(e.stage) ? e.stage : "found", false);
      else if (create && e.stage === "hidden") setStage(e, "rumored", false);
    }
  };
  /** A portrait on the TV for the first time: find whoever it is, making an entry if they don't have one. */
  const meetPortrait = (sc: Scene) => {
    const linked = entriesForScene(s, sc.id);
    if (!linked.length && !sc.known && entriesOf(s).length < ENTRIES_MAX) {
      const list = (s.entries ??= []);
      const e = entryFromScene(list, sc, nextId("e"));
      list.push(e);
      linked.push(e);
    }
    sc.known = true;
    for (const e of linked) if (!isFound(e.stage)) setStage(e, "found", true);
  };
  const cleanLine = (t: string) => t.replace(/\s+/g, " ").trim();
  const checkPortrait = (sceneId: string | null | undefined) => {
    if (!sceneId) return;
    if (scene(sceneId).kind !== "portrait") fail("Pick a portrait scene.");
  };
  const cleanAreas = (areas: string[]) => [...new Map(areas.map(cleanLine).filter(Boolean).map((a) => [a.toLowerCase(), a])).values()];

  // ---------- the Chronicle ----------
  const noteById = (noteId: string): Note => (s.notes ?? []).find((n) => n.id === noteId) ?? fail("That note isn't here any more.");
  /** A player's own note. Hidden notes are gone as far as players are concerned. */
  const ownNote = (noteId: string): Note => {
    const n = noteById(noteId);
    if (ctx.actor.role !== "player" || n.authorId !== ctx.actor.playerId || n.hidden) fail("You can only change your own notes.");
    return n;
  };
  const chapterOf = (chapterId: string | undefined): string | null => {
    const id = chapterId ?? defaultChapterId(s);
    const sid = chapterSessionId(s, id);
    if (sid === undefined) fail("That chapter doesn't exist.");
    return sid;
  };
  const addNote = (authorId: string, authorName: string, text: string, tags: string[] | undefined, chapterId: string | undefined) => {
    const t = cleanText(text);
    if (!t.trim()) fail("Write something first.");
    const notes = (s.notes ??= []);
    if (notes.length >= NOTES_MAX) fail("The Chronicle is full. Ask the DM to tidy up old notes.");
    const sessionId = chapterOf(chapterId);
    const n: Note = { id: nextId("n"), sessionId, authorId, authorName, text: t, tags: cleanTags(tags ?? []), createdAt: ctx.now };
    if (sessionId === null && s.world && s.partyId) n.partyId = s.partyId;
    notes.push(n);
    return n;
  };
  const editNote = (n: Note, patch: { text?: string; tags?: string[]; chapterId?: string }) => {
    let changed = false;
    if (patch.text !== undefined) {
      const t = cleanText(patch.text);
      if (!t.trim()) fail("A note can't be empty. Delete it instead.");
      changed ||= t !== n.text;
      n.text = t;
    }
    if (patch.tags !== undefined) {
      n.tags = cleanTags(patch.tags);
      changed = true;
    }
    if (patch.chapterId !== undefined) n.sessionId = chapterOf(patch.chapterId);
    if (changed) n.editedAt = ctx.now;
  };
  const mapOf = (sceneId: string): MapData => {
    const sc = scene(sceneId);
    if (sc.kind !== "map") fail("That scene isn't a map.");
    return (sc.map ??= emptyMap());
  };
  const tokenOf = (m: MapData, tokenId: string): MapToken => tokensOf(m).find((t) => t.id === tokenId) ?? fail("That token isn't on this map.");
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

  // ---------- the shared world ----------
  const partyOf = (id: string): Party => partyById(s, id) ?? fail("That party isn't in this world.");
  /** Seat a party: its members are at the table, everyone else is away. Each party keeps its own fog. */
  const playParty = (id: string) => {
    const party = partyOf(id);
    const was = s.partyId;
    if (was !== party.id) {
      for (const sc of s.scenes) {
        const m = sc.map;
        if (!m) continue;
        const fogBy = (m.fogBy ??= {});
        if (was && m.fog) fogBy[was] = m.fog;
        const mine = fogBy[party.id];
        // A party that hasn't been here starts under full fog where the map has fog set up.
        if (mine) m.fog = mine;
        else if (m.fog) m.fog = { ...m.fog, bits: emptyBits(m.fog.cols, m.fog.rows) };
        delete fogBy[party.id];
        if (!Object.keys(fogBy).length) delete m.fogBy;
      }
    }
    s.partyId = party.id;
    for (const p of s.players) if (!p.archived) p.away = !party.memberIds.includes(p.id);
    if (was !== party.id) {
      // The last table's moments aren't this table's.
      delete s.recapCard;
      delete s.discovery;
      delete s.diceRoll;
      delete s.renownMoment;
      delete s.levelMoment;
      delete s.chosen;
      s.banner = null;
      delete s.live.recapSessionId;
      s.live.leads = false;
    }
  };
  /** News for every party: a line in every Chronicle and a moment on the TV. */
  const worldNews = (text: string, tv: boolean) => {
    if ((s.notes ?? []).length < NOTES_MAX) {
      const n = addNote(DM_AUTHOR, "The DM", text, ["World news"], NEXT_CHAPTER);
      n.world = true;
      n.sessionId = null;
      delete n.partyId;
    }
    if (s.world && tv) s.world.news = { n: ++s.seq, at: ctx.now, text };
  };
  const cleanEvent = (ev: { name: string; from: string; to: string; note: string }) => {
    const name = cleanLine(ev.name);
    if (!name) fail("Name the event.");
    if (ev.to < ev.from) fail("The event ends before it starts.");
    return { name, from: ev.from, to: ev.to, note: cleanLine(ev.note) };
  };

  // ---------- leads and votes ----------
  const lead = (id: string): Lead => leadsOf(s).find((l) => l.id === id) ?? fail("That lead isn't there any more.");
  const checkEntry = (id: string | null | undefined, kind?: string) => {
    if (!id) return;
    const e = entriesOf(s).find((x) => x.id === id) ?? fail("That isn't in the compendium.");
    if (kind && e.kind !== kind) fail("Pick a place.");
  };
  /** Close the vote: one winner is followed; a tie waits for the DM. */
  const closeVote = (v: Vote, at: number) => {
    if (v.closedAt !== undefined) return;
    v.closedAt = at;
    const t = tally(v);
    if (t.winnerId) {
      v.winnerId = t.winnerId;
      const l = leadsOf(s).find((x) => x.id === t.winnerId);
      if (l && l.status === "open") l.status = "followed";
    } else v.tied = t.tied;
  };
  // A vote whose time is up closes on the next thing anyone does.
  if (s.vote && s.vote.closedAt === undefined && s.vote.closesAt !== undefined && ctx.now >= s.vote.closesAt) closeVote(s.vote, s.vote.closesAt);

  if (isFightCommand(cmd)) {
    const wasOver = s.fight?.status === "over";
    applyFight(s, cmd, fightHelpers);
    syncFightTokens(s, nextId);
    if (cmd.type === "fight.end" && !wasOver) noteMonsters(true);
    else if (cmd.type === "fight.patch") noteMonsters(false);
    return out;
  }

  if (isCompanionCommand(cmd)) {
    const c = cmd;
    if (c.type === "companion.keep") {
      // Session end: keep a hireling for the next session. The buyer pays now, once per session.
      const comp = companionsWith(s).find((x) => x.id === c.companionId) ?? fail("That companion isn't with the party.");
      const r = (comp.hire && s.rentals.find((x) => x.id === comp.hire!.rentalId && x.active)) || fail(`${comp.name} isn't a hireling.`);
      const through = (s.sessions.find((x) => x.id === s.currentSessionId) ?? s.sessions.at(-1))?.number ?? 0;
      if (r.paidThrough > through) fail(`${comp.name} is already paid for the next session.`);
      const p = player(r.playerId);
      move(p, -r.monthlyCp, `Kept ${comp.name} on (${r.itemName})`, "rent", { itemId: r.itemId });
      r.paidThrough = through + 1;
      out.info = `${comp.name} stays on. ${p.name} paid ${formatCp(r.monthlyCp)}.`;
    } else {
      applyCompanion(s, c, { now: ctx.now, nextId, fail, task: (t) => task(t), endRental });
    }
    syncFightTokens(s, nextId);
    return out;
  }

  if (isPracticeCommand(cmd)) {
    applyPractice(s, cmd, { now: ctx.now, rand, nextId, fail });
    return out;
  }

  if (isStoryCommand(cmd)) {
    const made = applyStory(s, cmd, { now: ctx.now, nextId, fail });
    if (made) out.storyId = made;
    syncStoryStatus(s);
    return out;
  }

  switch (cmd.type) {
    // ---------- scenes ----------
    case "scene.show":
      showScene(scene(cmd.sceneId).id);
      break;
    case "show":
      showRef(cmd.ref);
      break;
    case "quick.set": {
      const q = quickSlots();
      if (cmd.ref !== null) {
        const a = resolveRef(s, cmd.ref) ?? fail("That isn't there any more.");
        // One key per thing: pinning it here takes it off its old key.
        for (let k = 0; k < q.length; k++) if (q[k] === a.ref) q[k] = null;
        q[cmd.key] = a.ref;
      } else q[cmd.key] = null;
      break;
    }
    case "recent.clear":
      delete s.recent;
      break;
    case "scene.step": {
      // Through the quick bar, in key order (1..9, then 0).
      const bar = QUICK_KEYS.map((k) => quickOf(s)[k]).filter((r): r is string => !!r && !!resolveRef(s, r));
      if (!bar.length) fail("The quick bar is empty. Pin something to a number key first.");
      const now = liveRef(s);
      const base = now?.replace(/^(map\/[^/]+)\/.*$/, "$1");
      const i = bar.findIndex((r) => r === now || r === base);
      const n = bar.length;
      showRef(bar[i < 0 ? (cmd.dir === 1 ? 0 : n - 1) : (((i + cmd.dir) % n) + n) % n]);
      break;
    }
    case "scene.hotkey": {
      const ref = quickOf(s)[cmd.key] ?? fail(`Nothing on key ${cmd.key}.`);
      showRef(ref);
      break;
    }
    case "scene.add": {
      const sc: Scene = { id: nextId("s"), label: cmd.label.trim() || "New scene", kind: cmd.kind, reveal: false, art: {} };
      if (cmd.kind === "portrait") Object.assign(sc, { name: sc.label, title: "" });
      if (cmd.kind === "map") sc.map = emptyMap();
      sc.slug = uniqueSceneSlug(s.scenes, sceneSlug(sc));
      s.scenes.push(sc);
      out.sceneId = sc.id;
      // On the first free number key, as new scenes always were.
      const free = freeQuickKey(s);
      if (free !== null) quickSlots()[free] = refForScene(s, sc);
      break;
    }
    case "scene.update": {
      const sc = scene(cmd.sceneId);
      const { hotkey, slug, sheet, ...patch } = cmd.patch;
      const before = refForScene(s, sc);
      if (sheet === null) delete sc.sheet;
      else if (sheet) {
        const { ink, ...rest } = sheet;
        sc.sheet = { ...rest, title: rest.title.trim(), sign: rest.sign.trim(), body: rest.body.replace(/\s+$/, ""), ...(ink ? { ink } : {}) };
      }
      if (patch.art?.url && !/^(https:\/\/|\/api\/files\/)/.test(patch.art.url)) fail("Images must be uploaded first.");
      Object.assign(sc, patch);
      if (patch.label !== undefined) sc.label = patch.label.trim() || sc.label;
      if (slug !== undefined) sc.slug = uniqueSceneSlug(s.scenes, slugInput(slug) || sceneSlug({ ...sc, slug: undefined }), sc.id);
      else if (!sc.slug) sc.slug = uniqueSceneSlug(s.scenes, sceneSlug(sc), sc.id);
      // Pins survive a kind change, so switching to Image and back loses nothing.
      if (sc.kind === "map") sc.map ??= emptyMap();
      renameRefs(s, before, refForScene(s, sc));
      // The old hotkey field, from older screens: pin it to that key.
      if (hotkey !== undefined) {
        const q = quickSlots();
        const ref = refForScene(s, sc);
        for (let k = 0; k < q.length; k++) if (q[k] === ref) q[k] = null;
        if (hotkey !== null) q[hotkey] = ref;
      }
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
      for (const e of entriesOf(s)) if (e.sceneId === cmd.sceneId) delete e.sceneId;
      pruneRefs();
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
      for (const e of entriesOf(s)) if (e.pin?.sceneId === cmd.sceneId && e.pin.pinId === cmd.pinId) delete e.pin;
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
      // The place it marks follows: shown means found, hidden means hidden. A Known
      // place (the party has learned facts about it) stays in Discover.
      for (const e of entriesOf(s).filter((x) => x.pin?.sceneId === cmd.sceneId && x.pin.pinId === p.id)) {
        if (cmd.discovered && !isFound(e.stage)) setStage(e, "found", false);
        else if (!cmd.discovered && e.stage !== "known") setStage(e, "hidden", false);
      }
      break;
    }
    case "map.legend": {
      const m = mapOf(cmd.sceneId);
      if (cmd.on !== undefined) m.legendOn = cmd.on;
      if (cmd.style !== undefined) m.legendStyle = cmd.style;
      break;
    }
    case "map.sealScale":
      mapOf(cmd.sceneId).sealScale = Math.round(cmd.scale * 100) / 100;
      break;

    // ---------- tokens and the grid ----------
    case "token.add": {
      const m = mapOf(cmd.sceneId);
      const tokens = tokensOf(m);
      if (tokens.length >= TOKENS_MAX) fail(`A map holds at most ${TOKENS_MAX} tokens.`);
      const name = cmd.name.trim() || (cmd.kind === "monster" ? "Monster" : "Someone");
      const t: MapToken = { id: nextId("tk"), kind: cmd.kind, label: "", name, color: cmd.color ?? (cmd.kind === "monster" ? "red" : "grey"), ...freeSpot(m, cmd.x, cmd.y), size: 1, hidden: cmd.hidden ?? false, locked: cmd.kind === "monster" };
      tokens.push(t);
      out.tokenId = t.id;
      break;
    }
    case "token.party": {
      const sc = scene(cmd.sceneId);
      mapOf(sc.id);
      const n = addPartyTokens(s, sc, cmd.x, cmd.y, nextId);
      out.info = n ? `Added ${n} ${n === 1 ? "token" : "tokens"}.` : "Everyone at the table already has a token here.";
      break;
    }
    case "token.move": {
      const m = mapOf(cmd.sceneId);
      const t = tokenOf(m, cmd.tokenId);
      Object.assign(t, snapToGrid(m.grid, cmd.x, cmd.y, t.size));
      break;
    }
    case "token.update": {
      const m = mapOf(cmd.sceneId);
      const t = tokenOf(m, cmd.tokenId);
      const { art, ...rest } = cmd.patch;
      Object.assign(t, rest);
      if (rest.label !== undefined) t.label = rest.label.trim().toUpperCase();
      if (rest.name !== undefined) t.name = rest.name.trim();
      if (art !== undefined) {
        if (art.url) t.art = { url: art.url };
        else delete t.art;
      }
      if (rest.size !== undefined) Object.assign(t, snapToGrid(m.grid, t.x, t.y, t.size));
      break;
    }
    case "token.remove": {
      const m = mapOf(cmd.sceneId);
      tokenOf(m, cmd.tokenId);
      m.tokens = tokensOf(m).filter((t) => t.id !== cmd.tokenId);
      break;
    }
    // ---------- fog of war ----------
    case "fog.setup": {
      const m = mapOf(cmd.sceneId);
      const L = cmd.layout;
      if (cmd.tiles.urls.length !== cmd.tiles.cols * cmd.tiles.rows) fail("Those map pieces don't add up. Try again.");
      const old = m.fog;
      const same = !!old && old.cols === L.cols && old.rows === L.rows;
      m.fog = { on: true, ...L, bits: cmd.keep && same ? old!.bits : emptyBits(L.cols, L.rows), tiles: { ...cmd.tiles } };
      break;
    }
    case "fog.on": {
      const m = mapOf(cmd.sceneId);
      if (!m.fog) fail("Set up fog on this map first.");
      m.fog.on = cmd.on;
      break;
    }
    case "fog.bits": {
      const m = mapOf(cmd.sceneId);
      const f = m.fog ?? fail("Set up fog on this map first.");
      const bits = decodeBits(cmd.bits, f.cols, f.rows);
      // Normalise: drop bits past the last cell.
      const n = f.cols * f.rows;
      if (n % 8) bits[bits.length - 1] &= (1 << (n % 8)) - 1;
      f.bits = encodeBits(bits);
      break;
    }
    case "fog.all": {
      const f = mapOf(cmd.sceneId).fog ?? fail("Set up fog on this map first.");
      f.bits = cmd.clear ? fullBits(f.cols, f.rows) : emptyBits(f.cols, f.rows);
      break;
    }
    case "map.grid": {
      const m = mapOf(cmd.sceneId);
      if (!cmd.grid) delete m.grid;
      else {
        const g = cmd.grid;
        // Keep the corner inside the first square, so the numbers stay small.
        const ch = g.cell / g.aspect;
        m.grid = { snap: g.snap, lines: g.lines, cell: Math.round(g.cell * 100000) / 100000, ox: Math.round((((g.ox % g.cell) + g.cell) % g.cell) * 100000) / 100000, oy: Math.round((((g.oy % ch) + ch) % ch) * 100000) / 100000, aspect: g.aspect };
        if (g.snap) for (const t of tokensOf(m)) Object.assign(t, snapToGrid(m.grid, t.x, t.y, t.size));
      }
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
      if (originOf(s).kind !== "candlefair") fail("Those maps belong to the Candlefair campaign.");
      // Turn the old empty "Town map" image scene into the Candlefair map (keeping any image), then add the Sword Coast.
      let cf = s.scenes.find((x) => x.id === "s-map");
      if (cf && cf.kind === "image") {
        const before = refForScene(s, cf);
        cf.kind = "map";
        if (cf.label === "Town map") cf.label = "Candlefair map";
        cf.map = candlefairMap();
        cf.slug = uniqueSceneSlug(s.scenes, "candlefair", cf.id);
        // Its number key and beats now point at the map.
        renameRefs(s, before, refForScene(s, cf));
      } else if (!s.scenes.some((x) => x.kind === "map" && x.label === "Candlefair map")) {
        cf = { id: nextId("s"), label: "Candlefair map", slug: uniqueSceneSlug(s.scenes, "candlefair"), kind: "map", reveal: false, art: {}, alt: "Map of Candlefair", map: candlefairMap() };
        s.scenes.push(cf);
      } else cf = s.scenes.find((x) => x.kind === "map" && x.label === "Candlefair map");
      if (!s.scenes.some((x) => x.kind === "map" && x.label === "Sword Coast map")) {
        const sw: Scene = { id: s.scenes.some((x) => x.id === "s-swordcoast") ? nextId("s") : "s-swordcoast", label: "Sword Coast map", slug: uniqueSceneSlug(s.scenes, "sword-coast"), kind: "map", reveal: false, art: {}, alt: "Map of the Sword Coast", map: swordCoastMap(cf!.id) };
        s.scenes.push(sw);
        const q = quickSlots();
        if (q[9] === null) q[9] = refForScene(s, sw);
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
      if (cmd.open) {
        delete s.live.recapSessionId;
        delete s.live.leads;
      }
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
      if (!shopOpenNow(s, where)) fail(`${where.name} isn't open yet.`);
      if (renownLock(item)) fail(renownLock(item)!);
      if (item.tier === "locked") fail(`${item.name} is locked: ${item.reason || "not for sale yet"}.`);
      if (item.tier !== "sale") fail(`${item.name} isn't for sale.`);
      if (item.stock === 0) fail(`${item.name} is sold out.${item.restockNote ? " " + item.restockNote : ""}`);
      const cost = firstChargeCp(s, item);
      if (!canPay(p, cost, item.shopId)) fail(`${p.name} can't afford ${item.name}.`);
      if (item.kind === "recurring" && s.rentals.some((x) => x.active && x.itemId === item.id && x.playerId === p.id)) fail(`${p.name} already rents ${item.name}.`);
      fulfil(p, item, 1, cost, {}, { question: cmd.question });
      break;
    }
    case "project.npcContribute": {
      const it = item(cmd.itemId);
      const left = projectLeft(it);
      const cp = Math.min(cmd.amountCp, left);
      const from = cleanLine(cmd.from) || "Someone in town";
      (s.npcStakes ??= []).push({ itemId: it.id, from, cp, at: ctx.now });
      checkFunded(it);
      if (cp < cmd.amountCp) out.info = `${it.name} only needed ${formatCp(cp)}, so that's all ${from} put in.`;
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
      rentalEnded(s, r.id, ctx.now);
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
      const { up, style, look, place, ...text } = cmd.patch;
      Object.assign(f, cleanFlyer({ ...f, ...text }, f.signedBy));
      if (style) f.style = style;
      if (look) f.look = cleanLook(look);
      if (place) f.place = cleanPlace(place);
      if (up && !f.up) {
        needRoom();
        f.pinnedAt = ctx.now;
        f.place = goingUp(f, place);
      }
      if (up !== undefined) f.up = up;
      break;
    }
    case "flyer.reward": {
      const f = s.flyers.find((x) => x.id === cmd.flyerId) ?? fail("That flyer doesn't exist.");
      const held = f.rewardCp ?? 0;
      if (!held || f.rewardDone) fail("That flyer has no reward waiting.");
      const poster = player(f.playerId);
      if (cmd.to === "poster") {
        move(poster, held, `Reward back from your flyer: ${f.title}`, "grant");
        f.rewardDone = { at: ctx.now, to: "poster", paidCp: held };
        break;
      }
      const ids = [...new Set(cmd.playerIds ?? [])];
      if (!ids.length) fail("Pick who gets the reward.");
      const each = Math.floor(held / ids.length);
      const batchId = nextId("b");
      ids.forEach((pid, i) => {
        const cp = each + (i === 0 ? held - each * ids.length : 0);
        if (cp > 0) move(player(pid), cp, `Reward from ${penName(poster)}'s flyer: ${f.title}`, "bounty", { batchId });
      });
      const party = s.world ? tableParty(s) : undefined;
      f.rewardDone = { at: ctx.now, to: "party", paidCp: held, ...(party ? { partyId: party.id } : {}) };
      chronicle(`${party ? party.name : "The party"} answered ${penName(poster)}'s flyer "${f.title}" and earned ${formatCp(held)}.`);
      if (s.world && party && !partiesFor(s, poster.id).some((x) => x.id === party.id)) worldNews(`${party.name} answered ${penName(poster)}'s flyer: ${f.title}.`, false);
      break;
    }
    case "flyer.remove": {
      const f = s.flyers.find((x) => x.id === cmd.flyerId);
      // Gold still held goes back to whoever put it up.
      if (f?.rewardCp && !f.rewardDone && s.players.some((p) => p.id === f.playerId)) move(player(f.playerId), f.rewardCp, `Reward back from your flyer: ${f.title}`, "grant");
      s.flyers = s.flyers.filter((x) => x.id !== cmd.flyerId);
      break;
    }

    // ---------- The dice tray ----------
    case "dice.roll": {
      const r = rollPool(cmd.dice, cmd.plus, rand);
      const n = ++s.seq;
      if (!cmd.secret) s.diceRoll = { n, at: ctx.now, ...r };
      logRoll({ ...r, n, at: ctx.now, by: null, name: "DM", to: cmd.secret ? "secret" : "tv" });
      break;
    }
    case "dice.clearLog":
      delete s.rolls;
      break;
    case "dice.clearTv":
      // "Clear TV" takes down anything sitting over the scene.
      delete s.diceRoll;
      delete s.live.leads;
      delete s.live.note;
      break;

    // ---------- Renown and the bounty board ----------
    case "renown.set": {
      const was = renownOf(s);
      if (cmd.rank === was) break;
      const from = pointsOf(s);
      setRank(cmd.rank, cmd.reason?.trim(), cmd.tv);
      // Keep the bar honest: a rank set by hand starts at that rank's threshold.
      s.renownPoints = thresholdsOf(s)[cmd.rank];
      logRenown({ source: "set", amount: s.renownPoints - from, reason: cmd.reason?.trim() ?? "", rankFrom: was, rankTo: cmd.rank });
      break;
    }
    case "renown.points": {
      const why = cmd.reason?.trim() ?? "";
      const sign = cmd.amount > 0 ? `+${cmd.amount}` : `−${-cmd.amount}`;
      chronicle(`Renown ${sign}${why ? `: ${why}` : ""}.`.replace(/([.!?])\.$/, "$1"));
      addRenown(cmd.amount, { source: "award", reason: why }, cmd.tv);
      break;
    }
    case "renown.progress":
      if (cmd.on) s.renownProgress = true;
      else delete s.renownProgress;
      break;
    case "job.add": {
      const old = cmd.followUpOf ? job(cmd.followUpOf) : undefined;
      const j: Job = cleanJob({
        id: nextId("j"),
        title: "",
        postedBy: "",
        body: "",
        reward: { kind: "each", cp: 0 },
        renown: 0,
        style: "scrawl",
        status: "open",
        pinned: false,
        createdAt: ctx.now,
        ...cmd.job,
        dm: { adventure: "", loot: "", twists: "", notes: "", ...cmd.job.dm },
      });
      let pin = !!cmd.pin;
      if (old) {
        j.followUpOf = old.id;
        // The follow-up takes the old flyer's place on the board.
        if (old.status !== "done") {
          pin ||= old.pinned;
          if (old.pinned && old.place && !j.place) j.place = { ...old.place };
          old.status = "expired";
          old.pinned = false;
        }
      }
      if (pin) {
        needRoom();
        j.pinned = true;
        j.pinnedAt = ctx.now;
        j.place = goingUp(j, j.place);
      }
      jobs.push(j);
      out.jobId = j.id;
      break;
    }
    case "job.update": {
      const j = job(cmd.jobId);
      const { status, dm, look, place, ...rest } = cmd.patch;
      Object.assign(j, rest);
      if (dm) j.dm = { ...j.dm, ...dm };
      if (look) j.look = look;
      if (place) j.place = cleanPlace(place);
      if (status !== undefined && status !== j.status) {
        if (j.status === "done") fail(`${jobTitle(j)} is done and paid. Add a new flyer instead.`);
        j.status = status;
        if (status === "open") {
          delete j.takenBy;
          delete j.takenAt;
          delete j.partyId;
        } else {
          j.takenAt ??= ctx.now;
          takeForParty(j);
        }
      }
      cleanJob(j);
      break;
    }
    case "job.pin": {
      const j = job(cmd.jobId);
      if (cmd.pinned && !j.pinned) {
        if (j.status === "expired") fail(`${jobTitle(j)} was pulled. Set it back to open first.`);
        needRoom();
        j.pinnedAt = ctx.now;
        j.place = goingUp(j, cmd.place);
      } else if (cmd.place) j.place = cleanPlace(cmd.place);
      j.pinned = cmd.pinned;
      break;
    }

    // ---------- plain notes on the notice board ----------
    case "notice.add": {
      if (notices.length >= NOTICES_MAX) fail(`That's ${NOTICES_MAX} notes. Throw some away first.`);
      const { up, place, slug, look, ...rest } = cmd.notice;
      const n: Notice = {
        id: nextId("n"),
        slug: "",
        style: "cream",
        title: "",
        body: "",
        sign: "",
        dmNote: "",
        ...rest,
        look: cleanLook(look ?? {}),
        up: up !== false,
        place: { x: 0, y: 0, rot: 0, w: defaultWidth(rest.style ?? "cream"), z: 0 },
        createdAt: ctx.now,
      };
      cleanNotice(n);
      n.slug = freeSlug((slug && slugInput(slug)) || n.title || n.body.slice(0, 30));
      if (n.up) {
        needRoom();
        n.place = goingUp({ ...n, place: undefined }, place);
      } else if (place) n.place = cleanPlace(place);
      notices.push(n);
      out.noticeId = n.id;
      break;
    }
    case "notice.update": {
      const n = notice(cmd.noticeId);
      const { up, place, slug, look, ...rest } = cmd.patch;
      Object.assign(n, rest);
      if (look) n.look = cleanLook(look);
      cleanNotice(n);
      if (slug !== undefined) {
        const before = n.slug;
        n.slug = freeSlug((slug && slugInput(slug)) || n.title, n.id);
        if (before && before !== n.slug) renameRefs(s, `note/${before}`, `note/${n.slug}`);
      }
      if (up && !n.up) {
        needRoom();
        n.place = goingUp(n, place);
      } else if (place) n.place = cleanPlace(place);
      if (up !== undefined) n.up = up;
      break;
    }
    case "notice.remove":
      notice(cmd.noticeId);
      s.notices = notices.filter((n) => n.id !== cmd.noticeId);
      break;
    case "board.place": {
      const { kind, id } = cmd.note;
      const it = kind === "notice" ? notice(id) : kind === "job" ? job(id) : (s.flyers.find((f) => f.id === id) ?? fail("That flyer doesn't exist."));
      it.place = cleanPlace(cmd.place);
      break;
    }
    case "board.plaque":
      if (cmd.shown) delete s.plaqueHidden;
      else s.plaqueHidden = true;
      break;
    case "job.done": {
      const j = job(cmd.jobId);
      if (j.status === "done") fail(`${jobTitle(j)} is already done and paid.`);
      if (j.status === "expired") fail(`${jobTitle(j)} was pulled. Set it back to open first.`);
      const pay = new Map<string, number>();
      for (const x of cmd.payouts) pay.set(x.playerId, (pay.get(x.playerId) ?? 0) + x.cp);
      const batchId = nextId("b");
      let total = 0;
      const paid: string[] = [];
      for (const [pid, cp] of pay) {
        const p = player(pid);
        if (cp <= 0) continue;
        move(p, cp, `Job done: ${jobTitle(j)}`, "bounty", { batchId });
        total += cp;
        paid.push(`${p.name} ${formatCp(cp)}`);
      }
      j.status = "done";
      j.doneAt = ctx.now;
      j.paidCp = total;
      if (!j.partyId) takeForParty(j);
      if (j.pinned) announce(`Job done: ${jobTitle(j)}`);
      const amounts = new Set([...pay.values()].filter((cp) => cp > 0));
      const how = !total ? "" : amounts.size === 1 && paid.length > 1 ? ` Paid ${formatCp([...amounts][0])} each.` : ` Paid ${paid.join(", ")}.`;
      const pts = cmd.renown ?? jobPoints(j);
      chronicle(`Job done: ${jobTitle(j)}.${how}${pts ? ` +${pts} Renown.` : ""}`);
      if (pts) addRenown(pts, { source: "job", reason: "", label: jobTitle(j), jobId: j.id });
      break;
    }
    case "job.expire": {
      const j = job(cmd.jobId);
      if (j.status === "done") fail(`${jobTitle(j)} is done. Take it down instead.`);
      j.status = "expired";
      j.pinned = false;
      break;
    }
    case "job.remove": {
      const j = job(cmd.jobId);
      s.jobs = jobs.filter((x) => x.id !== j.id);
      for (const r of s.requests) {
        if (r.status === "pending" && r.kind === "job" && r.jobId === j.id) {
          r.status = "declined";
          r.decidedAt = ctx.now;
          r.reason = "That job came down.";
        }
      }
      break;
    }

    // ---------- players ----------
    case "player.add": {
      const name = cmd.name.trim() || `Player ${s.players.length + 1}`;
      createPlayer(normaliseHandle(name), name, "dm");
      break;
    }
    case "player.level": {
      const p = player(cmd.playerId);
      if (cmd.level === null) delete p.level;
      else p.level = cmd.level;
      break;
    }
    case "party.levelUp": {
      const seen = new Set<string>();
      const levels: { playerId: string; level: number }[] = [];
      for (const l of cmd.levels) {
        if (seen.has(l.playerId)) continue;
        seen.add(l.playerId);
        const p = player(l.playerId);
        p.level = l.level;
        levels.push({ playerId: p.id, level: l.level });
      }
      chronicle(levelLine(s, levels));
      if (cmd.tv !== false) s.levelMoment = { n: ++s.seq, at: ctx.now, levels };
      break;
    }
    case "player.update": {
      const p = player(cmd.playerId);
      const { patch } = cmd;
      if (patch.name !== undefined) p.name = patch.name.trim() || p.name;
      if (patch.dndbUrl !== undefined) p.dndbUrl = checkUrl(patch.dndbUrl);
      if (patch.away !== undefined) p.away = patch.away;
      if (patch.dropIn !== undefined) p.dropIn = patch.dropIn;
      if (patch.character !== undefined) {
        const c = patch.character.replace(/\s+/g, " ").trim().slice(0, CHARACTER_MAX);
        if (c) p.character = c;
        else delete p.character;
      }
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
      // Their Backstory lane goes with them, unless something was planned on it: then it keeps their name.
      if (s.story) {
        const lane = s.story.threads.find((t) => t.kind === "backstory" && t.playerId === p.id);
        if (lane && !s.story.beats.some((b) => b.threadId === lane.id)) s.story.threads = s.story.threads.filter((t) => t !== lane);
        else if (lane && !lane.name) lane.name = penName(p);
      }
      break;
    }
    case "player.clearKey": {
      const p = player(cmd.playerId);
      delete p.keyHash;
      if (p.arrival) delete p.arrival.keyed;
      break;
    }
    case "player.inspire":
      player(cmd.playerId).inspired = cmd.on;
      break;
    case "party.longRest": {
      if (s.fight && s.fight.status !== "over") fail("A fight is still open. End it first.");
      const who = cmd.playerIds ? cmd.playerIds.map(player) : s.players.filter((p) => !p.archived);
      for (const p of who) {
        // Nobody has set HP yet: nothing to fill.
        if (!p.hp || p.hp.max <= 0) continue;
        p.hp.cur = p.hp.max;
        p.hp.temp = 0;
      }
      break;
    }

    // ---------- shops ----------
    case "shop.add":
      s.shops.push({ id: nextId("shop"), name: cmd.name.trim() || "New shop", subtitle: cmd.subtitle.trim(), visibility: "hidden", playerIds: [] });
      break;
    case "shop.update": {
      const sh = shop(cmd.shopId);
      if (cmd.patch.name !== undefined) sh.name = cmd.patch.name.trim() || sh.name;
      if (cmd.patch.subtitle !== undefined) sh.subtitle = cmd.patch.subtitle.trim();
      // Its Discover entry reads the same name and tagline.
      const se = shopEntry(s, sh.id);
      if (se && cmd.patch.name !== undefined) se.name = cleanLine(sh.name) || se.name;
      if (se && cmd.patch.subtitle !== undefined) se.title = cleanLine(sh.subtitle);
      if (cmd.patch.secretSales !== undefined) sh.secretSales = cmd.patch.secretSales || undefined;
      if (cmd.patch.renown !== undefined) {
        if (cmd.patch.renown) sh.renown = cmd.patch.renown;
        else delete sh.renown;
      }
      if (cmd.patch.trust !== undefined) {
        if (cmd.patch.trust) sh.trust = { entryId: entry(cmd.patch.trust.entryId).id, relation: cmd.patch.trust.relation };
        else delete sh.trust;
      }
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
      // Its Discover entry follows: open to everyone means found, hidden means hidden
      // (a Known shop stays in Discover). Shown to some players stays secret: no change.
      for (const e of entriesOf(s).filter((x) => x.shopId === sh.id)) {
        if (cmd.visibility === "all" && !isFound(e.stage)) setStage(e, "found", false);
        else if (cmd.visibility === "hidden" && e.stage !== "known") setStage(e, "hidden", false);
      }
      break;
    }
    case "shop.remove":
      removeShop(cmd.shopId);
      for (const e of entriesOf(s).filter((x) => x.shopId === cmd.shopId)) removeEntry(e.id);
      break;
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
      const before = { tier: tierOf(s, it), stock: it.stock, name: it.name };
      Object.assign(it, cmd.patch);
      if (cmd.patch.name !== undefined) it.name = cmd.patch.name.trim() || before.name;
      tidyItem(it);
      if (!cmd.quiet) {
        announceItem(it, before.tier);
        if (before.stock === 0 && it.stock !== null && it.stock > 0 && tierOf(s, it) === "sale" && shop(it.shopId).visibility === "all") {
          announce(`Back in stock at ${shop(it.shopId).name}: ${it.name}`);
        }
      }
      break;
    }
    case "order.arrive": {
      const o = s.orders.find((x) => x.id === cmd.orderId) ?? fail("That order doesn't exist.");
      if (!o.arrived) {
        o.arrived = true;
        announce(`Arrived${fromAfar()}: ${o.itemName} for ${penName(player(o.playerId))}`);
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
      // Shop entries that survive take the fresh shop's name and go back into hiding (a Known one stays).
      for (const e of entriesOf(s)) {
        const sh = e.shopId ? s.shops.find((x) => x.id === e.shopId) : undefined;
        if (!sh) continue;
        e.name = sh.name;
        e.title = sh.subtitle;
        if (e.stage !== "known") setStage(e, "hidden", false);
      }
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
      if (cmd.partyId) playParty(cmd.partyId);
      startSession(cmd.title);
      // "You chose: …" for the lead the party voted to follow, once.
      const v = s.vote;
      if (v?.winnerId && !v.played) {
        v.played = true;
        s.chosen = { leadId: v.winnerId, n: ++s.seq, at: ctx.now };
      }
      break;
    }
    case "session.end": {
      const cur = s.sessions.find((x) => x.id === s.currentSessionId) ?? fail("No session is running.");
      // A fight left open would keep every phone asking for initiative after everyone has gone home.
      if (s.fight && s.fight.status !== "over") fail("A fight is still open. End it or cancel it first.");
      delete s.fight;
      // What the party discovered tonight: a card on the TV and a line in the Chronicle.
      const recap = sessionRecap(s, cur.id);
      if (recap) {
        if ((s.notes ?? []).length < NOTES_MAX) addNote(DM_AUTHOR, "The DM", recap, [], cur.id);
        s.recapCard = { n: ++s.seq, at: ctx.now, text: recap };
      }
      cur.endedAt = ctx.now;
      s.currentSessionId = null;
      // Companions who came along for the night go home.
      endSessionCompanions(s, ctx.now);
      // Done jobs stay up (stamped DONE) for one whole session, then come down.
      for (const j of jobs) if (j.status === "done" && j.pinned && (j.doneAt ?? 0) < cur.startedAt) j.pinned = false;
      showScene(homeScene());
      break;
    }
    case "session.update": {
      const sess = s.sessions.find((x) => x.id === cmd.sessionId) ?? fail("That session doesn't exist.");
      if (cmd.patch.number !== undefined) {
        const clash = s.sessions.find((x) => x.number === cmd.patch.number && x.id !== sess.id && x.partyId === sess.partyId);
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
      // Its Chronicle notes aren't lost: they go to the next chapter's page.
      for (const n of s.notes ?? []) if (n.sessionId === cmd.sessionId) n.sessionId = null;
      break;
    }
    case "session.noteTaker": {
      const sess = session(cmd.sessionId);
      if (cmd.playerId === null) delete sess.noteTakerId;
      else {
        const p = player(cmd.playerId);
        if (p.archived) fail(`${p.name} has left the table.`);
        sess.noteTakerId = p.id;
      }
      break;
    }

    // ---------- the shared world: parties ----------
    case "party.add": {
      const list = (s.parties ??= []);
      if (list.length >= PARTIES_MAX) fail(`A world holds up to ${PARTIES_MAX} parties.`);
      // The first new party turns the campaign into a shared world: everyone so far becomes the first party, and keeps what they know.
      if (!s.world) {
        seedKnowledge(s, ctx.now);
        const first: Party = { id: nextId("pty"), name: cmd.firstName?.trim() || "The first party", color: PARTY_COLORS[0], memberIds: s.players.filter((p) => !p.archived).map((p) => p.id), createdAt: ctx.now };
        list.push(first);
        s.partyId = first.id;
        for (const sess of s.sessions) sess.partyId = first.id;
        for (const n of s.notes ?? []) if (n.sessionId === null) n.partyId = first.id;
        for (const l of s.leads ?? []) l.partyId = first.id;
        if (s.vote) s.vote.partyId = first.id;
      }
      const name = cmd.name.trim() || `Party ${list.length + 1}`;
      if (list.some((x) => x.name.toLowerCase() === name.toLowerCase())) fail(`There's already a party called ${name}.`);
      const party: Party = { id: nextId("pty"), name, color: PARTY_COLORS[list.length % PARTY_COLORS.length], memberIds: [], createdAt: ctx.now };
      list.push(party);
      out.partyId = party.id;
      break;
    }
    case "party.update": {
      const party = partyOf(cmd.partyId);
      if (cmd.patch.name !== undefined) {
        const name = cmd.patch.name.trim();
        if (!name) fail("Give the party a name.");
        if (partiesOf(s).some((x) => x.id !== party.id && x.name.toLowerCase() === name.toLowerCase())) fail(`There's already a party called ${name}.`);
        party.name = name;
      }
      if (cmd.patch.color !== undefined) party.color = cmd.patch.color;
      break;
    }
    case "party.remove": {
      const party = partyOf(cmd.partyId);
      if (s.partyId === party.id) fail("That party is at the table. Seat another party first.");
      if (partiesOf(s).length <= 1) fail("Keep at least one party.");
      s.parties = partiesOf(s).filter((x) => x.id !== party.id);
      // Its chapters stay in the history; its open leads go with it.
      s.leads = (s.leads ?? []).filter((l) => l.partyId !== party.id);
      if (s.vote?.partyId === party.id) delete s.vote;
      for (const sc of s.scenes) if (sc.map?.fogBy?.[party.id]) delete sc.map.fogBy[party.id];
      break;
    }
    case "party.member": {
      const party = partyOf(cmd.partyId);
      const p = player(cmd.playerId);
      const isIn = party.memberIds.includes(p.id);
      if (cmd.member && !isIn) {
        if (cmd.catchUp !== false) catchUp(s, p.id, party);
        party.memberIds.push(p.id);
        p.renown ??= s.renown ?? 0;
        // Joining the party at the table seats them.
        if (s.partyId === party.id && !s.currentSessionId) p.away = false;
      } else if (!cmd.member && isIn) {
        party.memberIds = party.memberIds.filter((x) => x !== p.id);
        if (s.partyId === party.id && !s.currentSessionId) p.away = true;
      }
      break;
    }
    case "party.play":
      if (s.currentSessionId) fail("End the session first, then seat the next party.");
      playParty(cmd.partyId);
      break;
    case "entry.tell": {
      if (!s.world) fail("Telling the table is for a shared world.");
      const e = entry(cmd.entryId);
      const from = player(cmd.playerId);
      if (from.away || from.archived) fail(`${penName(from)} isn't at the table.`);
      const told = tellTable(s, e, from.id, cmd.stage, cmd.factIds ?? [], ctx.now);
      if (!told.length) {
        out.info = (e.knownBy?.[from.id] ?? "hidden") === "hidden" ? `${penName(from)} doesn't know ${e.name}.` : "Everyone at the table already knows that.";
        break;
      }
      // The table's view follows (the TV shows it once everyone present knows).
      const before = e.stage;
      materialize(s, presentIds(s));
      if (isFound(e.stage) && !isFound(before) && (s.notes ?? []).length < NOTES_MAX) addNote(DM_AUTHOR, "The DM", `${penName(from)} told the party about ${e.name}.`, entryTags(s, e), undefined);
      if (e.stage !== before && cmd.tv !== false) playMoment(e, before);
      out.info = `Told ${told.length === 1 ? "1 person" : `${told.length} people`}.`;
      break;
    }

    // ---------- the shared world: the calendar and news ----------
    case "world.date": {
      if (!s.world) fail("Make a second party first: the world clock is for a shared world.");
      const was = s.world.date;
      if (cmd.date === null) delete s.world.date;
      else s.world.date = cmd.date;
      if (!cmd.date || !was || cmd.date <= was) break;
      // Events that begin between the old date and the new one: a moment for the TV and a line for every party.
      const started = (s.world.events ?? []).filter((ev) => ev.from > was && ev.from <= cmd.date!);
      for (const ev of started) worldNews(`${ev.name} begins.${ev.note.trim() ? " " + ev.note.trim() : ""}`, cmd.tv !== false);
      break;
    }
    case "world.eventAdd": {
      if (!s.world) fail("Make a second party first: world events are for a shared world.");
      const events = (s.world.events ??= []);
      if (events.length >= WORLD_EVENTS_MAX) fail("The calendar is full.");
      const ev: WorldEvent = { id: nextId("we"), ...cleanEvent(cmd.event) };
      events.push(ev);
      out.eventId = ev.id;
      break;
    }
    case "world.eventUpdate": {
      const ev = (s.world?.events ?? []).find((x) => x.id === cmd.eventId) ?? fail("That event isn't on the calendar.");
      Object.assign(ev, cleanEvent({ ...ev, ...cmd.patch }));
      break;
    }
    case "world.eventRemove":
      if (s.world?.events) s.world.events = s.world.events.filter((x) => x.id !== cmd.eventId);
      break;
    case "world.news": {
      if (!s.world) fail("World news is for a shared world.");
      const text = cleanLine(cmd.text);
      if (!text) fail("Write the news first.");
      worldNews(text, cmd.tv !== false);
      break;
    }

    // ---------- the Chronicle ----------
    case "note.add":
      addNote(DM_AUTHOR, "The DM", cmd.text, cmd.tags, cmd.chapterId);
      break;
    case "note.update": {
      const n = noteById(cmd.noteId);
      editNote(n, cmd.patch);
      if (cmd.patch.starred !== undefined) {
        if (cmd.patch.starred) n.starred = true;
        else delete n.starred;
      }
      if (cmd.patch.hidden !== undefined) {
        if (cmd.patch.hidden) n.hidden = true;
        else delete n.hidden;
      }
      break;
    }
    case "note.remove":
      noteById(cmd.noteId);
      s.notes = (s.notes ?? []).filter((n) => n.id !== cmd.noteId);
      break;
    case "scene.known": {
      const sc = scene(cmd.sceneId);
      if (sc.kind !== "portrait" && sc.kind !== "map") fail("Only portraits and maps can be known.");
      if (cmd.known) sc.known = true;
      else delete sc.known;
      // Their compendium entries follow, quietly.
      for (const e of entriesForScene(s, sc.id)) {
        if (cmd.known && !isFound(e.stage)) setStage(e, "found", false);
        if (!cmd.known && isFound(e.stage)) setStage(e, "hidden", false);
      }
      break;
    }
    case "entry.add": {
      const list = (s.entries ??= []);
      if (list.length >= ENTRIES_MAX) fail("The compendium is full.");
      const f = cmd.entry;
      checkPortrait(f.sceneId);
      const sc = f.sceneId ? scene(f.sceneId) : undefined;
      const name = cleanLine(f.name ?? "") || (sc ? sc.name?.trim() || sc.label : "");
      if (!name) fail("Give it a name.");
      const kind = f.kind ?? "person";
      const e = blankEntry(list, nextId("e"), kind, name, {
        title: cleanLine(f.title ?? "") || (sc?.title ?? ""),
        summary: (f.summary ?? "").trim(),
        nickname: cleanLine(f.nickname ?? ""),
        hint: cleanLine(f.hint ?? ""),
        areas: cleanAreas(f.areas ?? []),
        dmNote: (f.dmNote ?? "").trim(),
        secrets: (f.secrets ?? "").trim(),
      });
      for (const k of PERSON_NOTES) {
        const v = (f[k] ?? "").trim();
        if (v) e[k] = v;
      }
      if (f.slug && slugInput(f.slug)) e.slug = uniqueSlug(list, kind, slugInput(f.slug));
      for (const t of (cmd.facts ?? []).map(cleanLine).filter(Boolean).slice(0, FACTS_MAX)) e.facts.push({ id: nextId("f"), slug: factSlug(e.facts, t), text: t });
      if (sc) e.sceneId = sc.id;
      if (f.relation) e.relation = f.relation;
      if (f.start && f.start !== "hidden") e.start = f.start;
      list.push(e);
      // A portrait the table has already seen: they've met.
      if (sc?.known) setStage(e, "found", false);
      if (f.pin) linkPin(e, f.pin);
      // A shop in Discover is a shop in Shops: a new, hidden storefront.
      if (kind === "shop") {
        const sh: Shop = { id: nextId("shop"), name: e.name, subtitle: e.title, visibility: "hidden", playerIds: [] };
        s.shops.push(sh);
        e.shopId = sh.id;
        syncOut(e, e.stage);
      }
      out.entryId = e.id;
      break;
    }
    case "entry.update": {
      const e = entry(cmd.entryId);
      const p = cmd.patch;
      const refBefore = entryRef(e);
      if (p.name !== undefined) {
        const name = cleanLine(p.name);
        if (!name) fail("Give it a name.");
        e.name = name;
      }
      if (p.kind !== undefined && p.kind !== e.kind) {
        if (e.shopId) fail(`${e.name} is a shop in Shops, so it stays a shop here.`);
        e.kind = p.kind;
        e.slug = uniqueSlug(entriesOf(s), e.kind, e.slug, e.id);
      }
      if (p.slug !== undefined) e.slug = uniqueSlug(entriesOf(s), e.kind, slugInput(p.slug) || e.name, e.id);
      if (p.title !== undefined) e.title = cleanLine(p.title);
      if (p.summary !== undefined) e.summary = p.summary.trim();
      if (p.nickname !== undefined) e.nickname = cleanLine(p.nickname);
      if (p.hint !== undefined) e.hint = cleanLine(p.hint);
      if (p.dmNote !== undefined) e.dmNote = p.dmNote.trim();
      if (p.secrets !== undefined) e.secrets = p.secrets.trim();
      for (const k of PERSON_NOTES) {
        const v = p[k];
        if (v === undefined) continue;
        if (v.trim()) e[k] = v.trim();
        else delete e[k];
      }
      if (p.areas !== undefined) e.areas = cleanAreas(p.areas);
      if (p.links !== undefined) {
        const ids = new Set(entriesOf(s).map((x) => x.id));
        e.links = [...new Set(p.links)].filter((id) => id !== e.id && ids.has(id));
      }
      if (p.relation !== undefined) {
        const before = gateSnapshot();
        if (p.relation && p.relation !== "stranger") e.relation = p.relation;
        else delete e.relation;
        // Their goodwill may open a storefront or put something on sale.
        announceOpened(before);
      }
      if (p.start !== undefined) {
        if (p.start === "hidden") delete e.start;
        else e.start = p.start;
      }
      if (p.silhouette !== undefined) {
        if (p.silhouette) e.silhouette = p.silhouette;
        else delete e.silhouette;
      }
      if (p.sceneId !== undefined) {
        checkPortrait(p.sceneId);
        if (p.sceneId) e.sceneId = p.sceneId;
        else delete e.sceneId;
      }
      if (p.pin === null) delete e.pin;
      else if (p.pin) linkPin(e, p.pin);
      if (p.shopId !== undefined && p.shopId !== (e.shopId ?? null)) {
        if (!p.shopId) fail("Every shop keeps its entry here. Delete the shop to remove it.");
        // One entry per shop: the one that had this storefront takes this entry's old one.
        const to = shop(p.shopId).id;
        const other = shopEntry(s, to);
        if (other && e.shopId) other.shopId = e.shopId;
        else if (other) delete other.shopId;
        e.shopId = to;
      }
      // Its storefront reads the same name and tagline.
      const tiedShop = e.shopId ? s.shops.find((x) => x.id === e.shopId) : undefined;
      if (tiedShop && !p.shopId && p.name !== undefined) tiedShop.name = e.name;
      if (tiedShop && !p.shopId && p.title !== undefined) tiedShop.subtitle = e.title;
      if (p.templateId !== undefined) {
        if (p.templateId) e.templateId = ((s.monsters ?? []).find((x) => x.id === p.templateId) ?? fail("That monster isn't in the library.")).id;
        else delete e.templateId;
      }
      // A newly tied storefront takes the entry's stage.
      if (p.shopId) syncOut(e, e.stage);
      // Its picture card reads its name and title.
      const pic = entryScene(s, e);
      if (pic && (p.name !== undefined || p.title !== undefined) && entriesForScene(s, pic.id).length === 1) {
        pic.label = e.name;
        pic.name = e.name;
        pic.title = e.title;
      }
      renameRefs(s, refBefore, entryRef(e));
      break;
    }
    case "entry.picture": {
      const e = entry(cmd.entryId);
      if (cmd.art.url && !/^(https:\/\/|\/api\/files\/)/.test(cmd.art.url)) fail("Images must be uploaded first.");
      const sc = ensurePicture(e);
      sc.art = cmd.art;
      if (cmd.alt !== undefined) sc.alt = cmd.alt.trim();
      break;
    }
    case "entry.relationFor": {
      const e = entry(cmd.entryId);
      if (e.kind !== "person") fail("Only people have feelings about the party.");
      player(cmd.playerId);
      const by = (e.relationBy ??= {});
      if (cmd.relation && cmd.relation !== (e.relation ?? "stranger")) by[cmd.playerId] = cmd.relation;
      else delete by[cmd.playerId];
      if (!Object.keys(by).length) delete e.relationBy;
      break;
    }
    case "entry.remove": {
      const e = entry(cmd.entryId);
      // A shop's entry goes with its shop, both ways.
      if (e.shopId && s.shops.some((x) => x.id === e.shopId)) removeShop(e.shopId);
      removeEntry(e.id);
      break;
    }
    case "entry.move": {
      const list = entriesOf(s);
      const i = list.findIndex((x) => x.id === cmd.entryId);
      if (i < 0) fail("That isn't in the compendium any more.");
      const j = i + cmd.dir;
      if (j >= 0 && j < list.length) [list[i], list[j]] = [list[j], list[i]];
      break;
    }
    case "entry.stage":
      setStage(entry(cmd.entryId), cmd.stage, cmd.announce);
      break;
    case "entry.show": {
      const e = entry(cmd.entryId);
      if (e.stage === "hidden") fail(`The party doesn't know of ${e.name} yet.`);
      if (cmd.factId && factOf(e, cmd.factId).revealedAt === undefined) fail("Reveal that fact first.");
      playMoment(e, undefined, cmd.factId);
      break;
    }
    case "entry.factAdd": {
      const e = entry(cmd.entryId);
      const text = cleanLine(cmd.text);
      if (!text) fail("Write the fact first.");
      if (e.facts.length >= FACTS_MAX) fail(`${e.name} has as many facts as fit.`);
      const f: EntryFact = { id: nextId("f"), slug: factSlug(e.facts, text), text };
      e.facts.push(f);
      out.factId = f.id;
      break;
    }
    case "entry.factUpdate": {
      const e = entry(cmd.entryId);
      const f = factOf(e, cmd.factId);
      if (cmd.text !== undefined) {
        const text = cleanLine(cmd.text);
        if (!text) fail("A fact can't be empty. Delete it instead.");
        f.text = text;
      }
      if (cmd.slug !== undefined) f.slug = factSlug(e.facts, slugify(cmd.slug.trim() || f.text), f.id);
      break;
    }
    case "entry.factRemove": {
      const e = entry(cmd.entryId);
      factOf(e, cmd.factId);
      e.facts = e.facts.filter((f) => f.id !== cmd.factId);
      if (s.discovery?.factId === cmd.factId) delete s.discovery;
      for (const c of cluesOf(s)) if (c.fact?.factId === cmd.factId) delete c.fact;
      break;
    }
    case "entry.factMove": {
      const e = entry(cmd.entryId);
      const i = e.facts.findIndex((f) => f.id === cmd.factId);
      if (i < 0) fail("That fact isn't there any more.");
      const j = i + cmd.dir;
      if (j >= 0 && j < e.facts.length) [e.facts[i], e.facts[j]] = [e.facts[j], e.facts[i]];
      break;
    }
    case "entry.factReveal": {
      const e = entry(cmd.entryId);
      const f = factOf(e, cmd.factId);
      if (cmd.revealed) revealFact(e, f, !!cmd.tv);
      else {
        delete f.revealedAt;
        delete f.learnedIn;
        if (s.discovery?.factId === f.id) delete s.discovery;
      }
      break;
    }
    case "lead.add": {
      const list = (s.leads ??= []);
      if (list.length >= LEADS_MAX) fail("That's a lot of leads. Close some first.");
      checkEntry(cmd.entryId);
      checkEntry(cmd.placeId, "place");
      if (cmd.jobId) (s.jobs ?? []).find((j) => j.id === cmd.jobId) ?? fail("That flyer isn't there any more.");
      const l: Lead = { id: nextId("l"), text: cleanLine(cmd.text), shown: cmd.shown ?? true, status: "open", createdAt: ctx.now, dmNote: "" };
      if (!l.text) fail("Write the lead.");
      if (cmd.entryId) l.entryId = cmd.entryId;
      if (cmd.placeId) l.placeId = cmd.placeId;
      if (cmd.jobId) l.jobId = cmd.jobId;
      // A shared world: the lead is the party's at the table unless the DM gives it to every party (null) or another one.
      if (s.world) {
        const pid = cmd.partyId === undefined ? s.partyId : cmd.partyId;
        if (pid) l.partyId = partyOf(pid).id;
      }
      list.push(l);
      out.leadId = l.id;
      break;
    }
    case "lead.update": {
      const l = lead(cmd.leadId);
      const p = cmd.patch;
      if (p.text !== undefined) l.text = cleanLine(p.text) || l.text;
      if (p.shown !== undefined) l.shown = p.shown;
      if (p.dmNote !== undefined) l.dmNote = p.dmNote.trim();
      if (p.entryId !== undefined) {
        checkEntry(p.entryId);
        if (p.entryId) l.entryId = p.entryId;
        else delete l.entryId;
      }
      if (p.placeId !== undefined) {
        checkEntry(p.placeId, "place");
        if (p.placeId) l.placeId = p.placeId;
        else delete l.placeId;
      }
      if (p.jobId !== undefined) {
        if (p.jobId) l.jobId = ((s.jobs ?? []).find((j) => j.id === p.jobId) ?? fail("That flyer isn't there any more.")).id;
        else delete l.jobId;
      }
      if (p.partyId !== undefined && s.world) {
        if (p.partyId) l.partyId = partyOf(p.partyId).id;
        else delete l.partyId;
      }
      break;
    }
    case "lead.status":
      lead(cmd.leadId).status = cmd.status;
      break;
    case "lead.remove": {
      lead(cmd.leadId);
      if (s.vote && s.vote.closedAt === undefined && s.vote.leadIds.includes(cmd.leadId)) fail("It's in the vote. Clear the vote first.");
      s.leads = leadsOf(s).filter((l) => l.id !== cmd.leadId);
      if (s.chosen?.leadId === cmd.leadId) delete s.chosen;
      break;
    }
    case "lead.move": {
      const list = leadsOf(s);
      const i = list.findIndex((x) => x.id === cmd.leadId);
      if (i < 0) fail("That lead isn't there any more.");
      const j = i + cmd.dir;
      if (j >= 0 && j < list.length) [list[i], list[j]] = [list[j], list[i]];
      break;
    }
    case "vote.open": {
      if (s.vote && s.vote.closedAt === undefined) fail("A vote is already open. Close it first.");
      const ids = [...new Set(cmd.leadIds)];
      if (ids.length < 2) fail("Pick two or three leads.");
      for (const id of ids) {
        const l = lead(id);
        if (!leadVisible(s, l)) fail(`Show "${l.text}" to the party first.`);
        if (l.status === "closed") fail(`"${l.text}" is closed.`);
      }
      s.vote = { id: nextId("v"), leadIds: ids, openedAt: ctx.now, ballots: {}, ...(cmd.minutes ? { closesAt: ctx.now + cmd.minutes * 60_000 } : {}), ...(s.world && s.partyId ? { partyId: s.partyId } : {}) };
      break;
    }
    case "vote.close": {
      const v = s.vote ?? fail("There's no vote.");
      closeVote(v, ctx.now);
      break;
    }
    case "vote.pick": {
      const v = s.vote ?? fail("There's no vote.");
      if (!v.leadIds.includes(cmd.leadId)) fail("That lead isn't in the vote.");
      closeVote(v, ctx.now);
      const was = v.winnerId && leadsOf(s).find((l) => l.id === v.winnerId);
      if (was && was.id !== cmd.leadId && was.status === "followed") was.status = "open";
      v.winnerId = cmd.leadId;
      delete v.tied;
      const l = lead(cmd.leadId);
      if (l.status === "open") l.status = "followed";
      break;
    }
    case "vote.clear":
      delete s.vote;
      break;
    case "live.leads":
      s.live.leads = cmd.on || undefined;
      break;
    case "discovery.totals":
      s.discoveryTotals = cmd.on || undefined;
      break;
    case "me.vote": {
      const p = me();
      const v = s.vote ?? fail("There's no vote right now.");
      if (v.partyId && !partyOf(v.partyId).memberIds.includes(p.id)) fail("There's no vote right now.");
      if (voteClosed(v, ctx.now)) fail("The vote has closed.");
      if (!v.leadIds.includes(cmd.leadId)) fail("That isn't one of the choices.");
      v.ballots[p.id] = cmd.leadId;
      break;
    }

    case "me.noteAdd": {
      const p = me();
      addNote(p.id, penName(p), cmd.text, cmd.tags, cmd.chapterId);
      break;
    }
    case "me.noteUpdate":
      editNote(ownNote(cmd.noteId), cmd.patch);
      break;
    case "me.noteRemove":
      ownNote(cmd.noteId);
      s.notes = (s.notes ?? []).filter((n) => n.id !== cmd.noteId);
      break;

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
      const old = ep.beats.flatMap((b) => b.stories ?? []);
      keepCurrentBeat(ep, () => (ep.beats = cmd.beats.map((b) => keepTicks(makeBeat(b), old))));
      break;
    }
    case "episode.remove": {
      episode(cmd.episodeId);
      if (curRunEpisode(s) === cmd.episodeId) fail("That episode is running in this session. End the session first.");
      s.episodes = episodes.filter((e) => e.id !== cmd.episodeId);
      // Its clues go to the pool rather than vanishing.
      for (const c of cluesOf(s)) if (c.episodeId === cmd.episodeId) c.episodeId = null;
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
      const old = ep.beats[i];
      ep.beats[i] = keepTicks({ ...makeBeat(cmd.beat), id: cmd.beatId }, old.stories);
      break;
    }
    case "episode.placeStory": {
      const ep = episode(cmd.episodeId);
      const sb = storyBeat(cmd.storyBeatId);
      if (!sb.repeat) {
        const at = pendingPlacement(s, sb.id);
        if (at) fail(`“${sb.title}” is already placed in “${at.episode.title}”. Remove it there first.`);
        if (sb.plays.length) fail(`“${sb.title}” has been played. Mark it not played first, or tick “Can happen again”.`);
      }
      let b: Beat | undefined;
      if (cmd.beatId) b = ep.beats.find((x) => x.id === cmd.beatId) ?? fail("That beat doesn't exist.");
      else {
        b = ep.beats.find((x) => x.title === STORY_SECTION);
        if (!b) {
          const made: Beat = { id: nextId("b"), title: STORY_SECTION, notes: [], checks: [], branches: [], actions: [] };
          keepCurrentBeat(ep, () => ep.beats.push(made));
          b = made;
        }
      }
      const list = (b.stories ??= []);
      if (list.some((x) => x.storyBeatId === sb.id && !x.done)) fail("It's already in that beat.");
      if (list.length >= 20) fail("That beat has a lot of story beats already.");
      // A ticked copy from an earlier run makes way for the new one.
      b.stories = [...list.filter((x) => x.storyBeatId !== sb.id), { storyBeatId: sb.id }];
      if (sb.status === "dropped") sb.status = "planned";
      out.beatId = b.id;
      break;
    }
    case "episode.unplaceStory": {
      const ep = episode(cmd.episodeId);
      const b = ep.beats.find((x) => x.id === cmd.beatId) ?? fail("That beat doesn't exist.");
      b.stories = (b.stories ?? []).filter((x) => x.storyBeatId !== cmd.storyBeatId);
      if (!b.stories.length) delete b.stories;
      break;
    }
    case "episode.leftover": {
      const ep = episode(cmd.episodeId);
      const sb = storyBeat(cmd.storyBeatId);
      if (cmd.choice === "keep") break;
      for (const b of ep.beats) {
        if (!b.stories) continue;
        b.stories = b.stories.filter((x) => x.storyBeatId !== sb.id || x.done);
        if (!b.stories.length) delete b.stories;
      }
      if (cmd.choice === "drop") sb.status = "dropped";
      break;
    }
    case "episode.prep": {
      const ep = episode(cmd.episodeId);
      const prep = (ep.prep ??= {});
      if (cmd.state) prep[cmd.key] = cmd.state;
      else delete prep[cmd.key];
      // Keep the record small.
      const keys = Object.keys(prep);
      if (keys.length > 300) for (const k of keys.slice(0, keys.length - 300)) delete prep[k];
      break;
    }
    case "episode.prepNote": {
      const ep = episode(cmd.episodeId);
      const notes = (ep.prepNotes ??= []);
      if (cmd.noteId) {
        ep.prepNotes = notes.filter((n) => n.id !== cmd.noteId);
        if (ep.prep) delete ep.prep[`note:${cmd.noteId}`];
      } else if (cmd.text) {
        if (notes.length >= 100) fail("This checklist is full. Tick off or remove a few first.");
        notes.push({ id: nextId("pn"), text: cmd.text, at: ctx.now });
      } else fail("Write the item first.");
      if (!ep.prepNotes?.length) delete ep.prepNotes;
      break;
    }
    case "run.story": {
      const ep = episode(cmd.episodeId);
      const b = ep.beats.find((x) => x.id === cmd.beatId) ?? fail("That beat doesn't exist.");
      const block = (b.stories ?? []).find((x) => x.storyBeatId === cmd.storyBeatId) ?? fail("That story beat isn't in this beat any more.");
      const sb = storyBeat(cmd.storyBeatId);
      if (cmd.done) {
        if (block.done) break;
        const sessionId = s.currentSessionId;
        block.done = { at: ctx.now, sessionId };
        sb.plays.push({ at: ctx.now, sessionId, episodeId: ep.id, outcome: cleanLine(cmd.outcome ?? "") });
        // The facts it reveals go up on the TV, as "fact:" lines do.
        for (const l of sb.links) {
          if (l.kind !== "fact") continue;
          const e = entriesOf(s).find((x) => x.id === l.entryId);
          const f = e?.facts.find((x) => x.id === l.factId);
          if (e && f) revealFact(e, f, true);
        }
        // The planned date this episode sat on became this session.
        const date = s.story?.dates.filter((d) => d.episodeId === ep.id && !d.cancelled && !d.sessionId).sort((x, y) => x.date.localeCompare(y.date))[0];
        if (date && sessionId) date.sessionId = sessionId;
      } else if (block.done) {
        const i = sb.plays.findLastIndex((p) => p.episodeId === ep.id && p.sessionId === block.done!.sessionId);
        if (i >= 0) sb.plays.splice(i, 1);
        delete block.done;
      }
      break;
    }
    case "beat.dismiss": {
      const ep = episode(cmd.episodeId);
      const b = ep.beats.find((x) => x.id === cmd.beatId) ?? fail("That beat doesn't exist.");
      if (!b.dismissed?.includes(cmd.ref)) b.dismissed = [...(b.dismissed ?? []), cmd.ref].slice(-40);
      break;
    }
    case "episode.acceptSuggestions": {
      const ep = episode(cmd.episodeId);
      let n = 0;
      for (const b of ep.beats) {
        const { suggested } = beatSuggestions(s, b);
        if (suggested && b.actions.length < 10) {
          b.actions.push({ type: "show", ref: suggested });
          n++;
        }
      }
      out.info = n ? `${n} beat${n === 1 ? "" : "s"} now show what they mention.` : "No suggestions to accept.";
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

    // ---------- the off-script kit ----------
    case "here.set": {
      if (cmd.placeId) {
        const pl = entry(cmd.placeId);
        if (pl.kind !== "place") fail("Pick a place.");
      }
      if (s.world && !s.partyId) fail("Pick the party at the table first.");
      moveHere(cmd.placeId);
      break;
    }
    case "ambient.show":
      showAmbient(cmd.id, cmd.caption);
      break;
    case "place.setup": {
      const pl = entry(cmd.entryId);
      if (pl.kind !== "place") fail("Only places have a default scene.");
      const setup = { ...(pl.place ?? {}) };
      if (cmd.scene !== undefined) {
        if (cmd.scene) setup.scene = (resolveRef(s, cmd.scene) ?? fail("That isn't there any more.")).ref;
        else delete setup.scene;
      }
      if (cmd.caption !== undefined) {
        const c = cleanLine(cmd.caption ?? "");
        if (c) setup.caption = c;
        else delete setup.caption;
      }
      for (const k of ["encounters", "rumors"] as const) {
        const v = cmd[k];
        if (v === undefined) continue;
        if (v) setup[k] = (tablesOf(s).find((t) => t.id === v) ?? fail("That table is gone.")).id;
        else delete setup[k];
      }
      if (Object.keys(setup).length) pl.place = setup;
      else delete pl.place;
      break;
    }
    case "review.done": {
      if (cmd.entryId) delete entry(cmd.entryId).review;
      if (cmd.tableId) delete (tablesOf(s).find((t) => t.id === cmd.tableId) ?? fail("That table is gone.")).review;
      break;
    }
    case "clue.add": {
      const list = (s.clues ??= []);
      if (list.length >= CLUES_MAX) fail("That's a lot of clues. Remove some old ones first.");
      const c: Clue = { id: nextId("cl"), text: "", episodeId: null, tags: [], status: "ready", createdAt: ctx.now };
      patchClue(c, cmd.clue);
      if (!c.text) fail("Write the clue first.");
      list.push(c);
      out.clueId = c.id;
      break;
    }
    case "clue.update": {
      const c = clue(cmd.clueId);
      patchClue(c, cmd.patch);
      if (!c.text) fail("A clue can't be empty. Remove it instead.");
      break;
    }
    case "clue.remove":
      clue(cmd.clueId);
      s.clues = cluesOf(s).filter((c) => c.id !== cmd.clueId);
      break;
    case "clue.deliver": {
      const c = clue(cmd.clueId);
      if (c.status !== "ready") fail(c.status === "delivered" ? "That clue is already delivered." : "That clue was dropped. Make it ready first.");
      const placeId = cmd.placeId === undefined ? hereRecord(s)?.placeId : (cmd.placeId ?? undefined);
      const place = placeId ? entry(placeId) : undefined;
      const via = cmd.viaId ? entry(cmd.viaId) : undefined;
      c.status = "delivered";
      c.delivered = {
        at: ctx.now,
        sessionId: s.currentSessionId,
        ...(place ? { placeId: place.id } : {}),
        ...(via ? { viaId: via.id } : {}),
        ...(s.world && s.partyId ? { partyId: s.partyId } : {}),
      };
      // Its fact: revealed once (a fact the table already knows doesn't play again).
      if (c.fact) {
        const e = entriesOf(s).find((x) => x.id === c.fact!.entryId);
        const f = e?.facts.find((x) => x.id === c.fact!.factId);
        if (e && f && f.revealedAt === undefined) revealFact(e, f, cmd.tv);
      }
      // Its mystery (or anything else): one stage forward, Found at most.
      if (c.entryId) {
        const e = entriesOf(s).find((x) => x.id === c.entryId);
        const next: Partial<Record<Stage, Stage>> = { hidden: "rumored", rumored: "found" };
        if (e && next[e.stage]) setStage(e, next[e.stage]!, cmd.tv);
      }
      const where = place ? ` at ${place.name}` : "";
      const who = via ? `, through ${via.name}` : "";
      const sb = c.storyBeatId ? (s.story?.beats ?? []).find((b) => b.id === c.storyBeatId) : undefined;
      if (sb && sb.status !== "dropped") {
        const run = s.sessions.find((x) => x.id === s.currentSessionId)?.run;
        sb.plays.push({ at: ctx.now, sessionId: s.currentSessionId, ...(run ? { episodeId: run.episodeId } : {}), outcome: `Clue delivered${where}${who}.` });
        syncStoryStatus(s);
      }
      if ((s.notes ?? []).length < NOTES_MAX) {
        const tags = [place?.name, via?.name].filter((x): x is string => !!x);
        addNote(DM_AUTHOR, "The DM", `Clue delivered${where}${who}: ${c.text}`, tags, undefined).hidden = true;
      }
      break;
    }
    case "clue.settle": {
      const c = clue(cmd.clueId);
      if (cmd.to === "keep") break;
      if (cmd.to === "drop") c.status = "dropped";
      else {
        if (cmd.to === "pool") c.episodeId = null;
        if (c.status === "delivered" && c.storyBeatId) {
          // Taking a delivery back takes its play back too.
          const sb = (s.story?.beats ?? []).find((b) => b.id === c.storyBeatId);
          const i = sb ? sb.plays.findLastIndex((p) => p.at === c.delivered?.at) : -1;
          if (sb && i >= 0) sb.plays.splice(i, 1);
          syncStoryStatus(s);
        }
        c.status = "ready";
        delete c.delivered;
      }
      break;
    }
    case "capture.add": {
      const text = cmd.text.trim();
      if (!text) fail("Write something first.");
      const list = (s.captures ??= []);
      if (list.length >= CAPTURES_MAX) {
        // Old notes that were already turned into something (or dismissed) make room.
        const i = list.findIndex((x) => x.status !== "open");
        if (i < 0) fail("That's a lot of notes. Turn some into something first.");
        list.splice(i, 1);
      }
      const here = hereRecord(s);
      const cap: Capture = { id: nextId("qn"), text, at: ctx.now, sessionId: s.currentSessionId, status: "open", ...(here ? { placeId: here.placeId } : {}), ...(s.world && s.partyId ? { partyId: s.partyId } : {}) };
      list.push(cap);
      out.captureId = cap.id;
      break;
    }
    case "capture.update": {
      const cap = capture(cmd.captureId);
      if (cmd.text !== undefined) {
        const t = cmd.text.trim();
        if (!t) fail("A note can't be empty. Dismiss it instead.");
        cap.text = t;
      }
      if (cmd.status) {
        cap.status = cmd.status;
        if (cmd.status === "open") delete cap.made;
      }
      break;
    }
    case "capture.remove":
      capture(cmd.captureId);
      s.captures = capturesOf(s).filter((x) => x.id !== cmd.captureId);
      break;

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
      delete s.live.recapNoteIds;
      if (cmd.sessionId === null) {
        delete s.live.recapSessionId;
        break;
      }
      const sess = session(cmd.sessionId);
      if (!sess.recap?.trim()) fail("That session has no recap yet.");
      s.live.recapSessionId = sess.id;
      delete s.live.leads;
      // Only starred, visible notes from that chapter can go up with it.
      const picked = (cmd.noteIds ?? []).filter((nid) => (s.notes ?? []).some((n) => n.id === nid && n.sessionId === sess.id && n.starred && !n.hidden));
      if (picked.length) s.live.recapNoteIds = [...new Set(picked)];
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

    // ---------- the Arrival intro ----------
    case "arrival.issueLinks":
      if (!ctx.token) fail("Links can only be made on the server.");
      for (const p of s.players) if (!p.archived) giveLink(p);
      break;
    case "arrival.copied": {
      const p = player(cmd.playerId);
      if (!p.arrival) fail("That player has no link yet.");
      p.arrival.copiedAt = ctx.now;
      break;
    }
    case "arrival.reset": {
      const p = player(cmd.playerId);
      if (p.arrival) p.arrival = { token: p.arrival.token, ...(p.arrival.copiedAt ? { copiedAt: p.arrival.copiedAt } : {}) };
      delete p.character;
      break;
    }
    case "arrival.settings": {
      const a = (s.arrival ??= {});
      if (cmd.template !== undefined) {
        const t = cmd.template.trim();
        if (t) a.template = t;
        else delete a.template;
      }
      if (cmd.seatsLocked !== undefined) a.seatsLocked = cmd.seatsLocked;
      for (const k of ["title", "captain"] as const) {
        const v = cmd[k]?.replace(/\s+/g, " ").trim();
        if (v === undefined) continue;
        if (v) a[k] = v;
        else delete a[k];
      }
      if (cmd.intro !== undefined) {
        a.intro = cmd.intro;
        a.introKind = cmd.intro ? "builtin" : "none";
      }
      if (cmd.introKind !== undefined) {
        a.introKind = cmd.introKind;
        a.intro = cmd.introKind === "builtin";
      }
      if (cmd.welcome !== undefined) {
        const w = cmd.welcome.replace(/\s+/g, " ").trim();
        if (w) a.welcome = w;
        else delete a.welcome;
      }
      // Locking the seats closes the door too: new names knock instead of walking in.
      if (cmd.seatsLocked) s.doorClosed = true;
      break;
    }
    case "arrival.clip": {
      const a = (s.arrival ??= {});
      if (cmd.clip) {
        if (cmd.clip.kind === "gif" ? cmd.clip.bytes > CLIP_GIF_MAX : cmd.clip.bytes > CLIP_VIDEO_MAX) fail("That clip is too big for phones.");
        a.clip = { url: cmd.clip.url, kind: cmd.clip.kind, bytes: cmd.clip.bytes, ...(cmd.clip.poster ? { poster: cmd.clip.poster } : {}) };
        a.introKind = "custom";
        a.intro = false;
      } else delete a.clip;
      break;
    }
    case "arrival.slides": {
      const a = (s.arrival ??= {});
      const seen = new Set<string>();
      a.slides = cmd.slides
        .filter((x) => !seen.has(x.id) && seen.add(x.id))
        .map((x) => ({ id: x.id, text: x.text.trim(), ...(x.image ? { image: x.image } : {}) }));
      if (!a.slides.length) delete a.slides;
      break;
    }
    case "arrival.showTable":
      showTable();
      break;

    case "game.rename":
      s.name = cmd.name.trim();
      break;
    case "game.renownRanks":
      s.renownRanks = cmd.ranks.map((r, i) => {
        const o: NonNullable<GameState["renownRanks"]>[number] = {};
        for (const k of ["name", "meaning", "pay", "raised"] as const) {
          const v = (r[k] ?? "").replace(/\s+/g, " ").trim();
          if (v) o[k] = v;
        }
        if (i > 0 && r.points !== undefined && r.points !== RENOWN_POINTS[i]) o.points = r.points;
        return o;
      });
      {
        // Each rank must need more points than the one before it.
        const want = RENOWN_POINTS.map((d, i) => (i === 0 ? 0 : (s.renownRanks?.[i]?.points ?? d)));
        const bad = want.findIndex((n, i) => i > 0 && n <= want[i - 1]);
        if (bad > 0) fail(`${ranksOf(s)[bad].name} needs more points than ${ranksOf(s)[bad - 1].name}.`);
      }
      if (s.renownRanks.every((o) => !Object.keys(o).length)) delete s.renownRanks;
      break;
    case "game.town":
      s.town = cmd.town.replace(/\s+/g, " ").trim();
      break;
    case "game.builderNotes": {
      const t = cmd.text.replace(/\r\n?/g, "\n").trim();
      if (t) s.builderNotes = t;
      else delete s.builderNotes;
      break;
    }
    case "table.add":
    case "table.update": {
      const list = (s.tables ??= []);
      const b = cmd.table;
      const name = cleanLine(b.name);
      if (!name) fail("Name the table.");
      const filled = fillRanges(b.die, b.rows.map((r) => ({ ...r, text: cleanLine(r.text) })).filter((r) => r.text));
      if ("error" in filled) fail(filled.error);
      const fields = { name, die: b.die, kind: b.kind, rows: filled.rows, areas: cleanAreas(b.areas ?? []), dmNote: (b.dmNote ?? "").trim() };
      if (cmd.type === "table.add") {
        if (list.length >= TABLES_MAX) fail(`That's ${TABLES_MAX} tables. Remove some first.`);
        const t: RandomTable = { id: nextId("rt"), ...fields, createdAt: ctx.now };
        list.push(t);
      } else {
        const t = list.find((x) => x.id === cmd.tableId) ?? fail("That table is gone.");
        Object.assign(t, fields);
      }
      break;
    }
    case "table.remove":
      s.tables = tablesOf(s).filter((t) => t.id !== cmd.tableId);
      // Places that rolled on it go back to the town's table.
      for (const e of entriesOf(s)) {
        if (!e.place) continue;
        if (e.place.encounters === cmd.tableId) delete e.place.encounters;
        if (e.place.rumors === cmd.tableId) delete e.place.rumors;
        if (!Object.keys(e.place).length) delete e.place;
      }
      if (!s.tables.length) delete s.tables;
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
        if (r.kind === "job" || (r.kind === "buy" && s.items.find((x) => x.id === r.itemId)?.kind === "service")) {
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
      const answer = waiting ? ` ${waiting} ${waiting === 1 ? "needs" : "need"} your answer (services and jobs).` : "";
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
      if (!shopOpenNow(s, where)) fail(`${where.name} isn't open yet.`);
      if (renownLock(item)) fail(renownLock(item)!);
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
      // A reward comes out of their own gold (never the tab).
      const rewardCp = item.flyer && cmd.flyer ? (cmd.rewardCp ?? 0) : 0;
      if (rewardCp && totalCp + rewardCp > availableCp(s, p.id)) fail(`With a ${formatCp(rewardCp)} reward that's ${formatCp(totalCp + rewardCp)}, and you have ${formatCp(Math.max(0, availableCp(s, p.id)))}.`);
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
        ...(item.flyer && cmd.flyer ? { flyer: cleanFlyer(cmd.flyer, penName(p)) } : {}),
        ...(rewardCp ? { rewardCp } : {}),
      });
      break;
    }
    case "me.contribute": {
      const p = me();
      const unseen = "That item isn't available.";
      const it = s.items.find((x) => x.id === cmd.itemId) ?? fail(unseen);
      const where = s.shops.find((x) => x.id === it.shopId);
      if (!where || !shopVisibleTo(where, { tv: false, playerId: p.id }) || it.tier === "hidden" || it.tier === "rumored") fail(unseen);
      if (!shopOpenNow(s, where)) fail(`${where.name} isn't open yet.`);
      if (renownLock(it)) fail(renownLock(it)!);
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
      rentalEnded(s, r.id, ctx.now);
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

    case "me.takeJob": {
      const p = me();
      const j = jobs.find((x) => x.id === cmd.jobId && x.pinned && x.status !== "expired") ?? fail("That job isn't on the board.");
      if (j.status !== "open") fail(`The party already took ${jobTitle(j)}.`);
      if (!renownMet(s, j.renown)) fail(`That job is for experienced parties only (${rankName(j.renown, s)}).`);
      if (!trustMet(s, j.trust)) fail(`That job needs ${trustText(s, j.trust)}.`);
      // One ask per job for the whole table.
      if (s.requests.some((r) => r.status === "pending" && r.kind === "job" && r.jobId === j.id)) fail("The party already asked the DM for this job.");
      if (s.requests.filter((r) => r.status === "pending" && r.playerId === p.id).length >= 20) fail("You have 20 requests waiting. Let the DM catch up.");
      s.requests.push({
        id: nextId("rq"),
        kind: "job",
        playerId: p.id,
        playerName: p.name,
        at: ctx.now,
        status: "pending",
        totalCp: 0,
        note: cmd.note.trim(),
        secret: false,
        qty: 1,
        unitCp: 0,
        jobId: j.id,
        jobTitle: jobTitle(j),
      });
      break;
    }

    // ---------- players acting on themselves ----------
    case "me.tokenMove": {
      if (ctx.actor.role !== "player") fail("Only a player can do that.");
      const pid = ctx.actor.playerId;
      const live = s.scenes.find((x) => x.id === s.live.sceneId);
      if (!live || live.kind !== "map" || !live.map) fail("There's no map on the TV right now.");
      const m = live.map;
      const t = tokensOf(m).find((x) => x.playerId === pid) ?? fail("You don't have a token on this map yet. Ask the DM.");
      if (t.locked) fail("The DM has locked your token.");
      Object.assign(t, snapToGrid(m.grid, cmd.x, cmd.y, t.size));
      break;
    }
    case "me.diceRoll": {
      const p = me();
      const last = (s.rolls ?? []).findLast((x) => x.by === p.id);
      if (last && ctx.now - last.at < PLAYER_ROLL_GAP_MS) fail("One roll at a time. Try again in a moment.");
      const r = rollPool(cmd.dice, cmd.plus, rand);
      const n = ++s.seq;
      const to: RollTo = cmd.tv ? "tv" : "dm";
      // While "Roll initiative" is up, a player's lone d20 (plus any bonus) is their initiative, locked in.
      const f = s.fight;
      const c = f?.status === "setup" ? f.order.find((x) => x.kind === "player" && x.playerId === p.id) : undefined;
      const lone = r.groups.length === 1 && r.groups[0]!.sides === 20 && r.groups[0]!.rolls.length === 1;
      const forInit = !!(f && c && lone && !(c.initRolled && c.init !== null));
      if (forInit) {
        c!.init = r.total;
        c!.initRolled = true;
        reslotCombatant(f!, c!);
      }
      const tag = forInit ? { for: "initiative" as const } : {};
      if (cmd.tv) s.diceRoll = { n, at: ctx.now, ...r, name: penName(p), ...tag };
      logRoll({ ...r, n, at: ctx.now, by: p.id, name: p.name, to, ...tag });
      break;
    }
    case "me.update": {
      const p = player(ctx.actor.role === "player" ? ctx.actor.playerId : "");
      if (cmd.patch.name !== undefined) {
        const next = cmd.patch.name.trim();
        if (next) {
          // Don't let a player rename themselves onto another player's name (impersonation).
          // Mirrors the byName() match used when a player signs in by typing their name.
          const h = normaliseHandle(next);
          const clash =
            !!h &&
            s.players.some(
              (x) => x.id !== p.id && !x.archived && (x.handle === h || normaliseHandle(x.name) === h || (!!x.character && normaliseHandle(x.character) === h)),
            );
          if (clash) fail("Another player at the table already goes by that name.");
          p.name = next;
        }
      }
      if (cmd.patch.dndbUrl !== undefined) p.dndbUrl = checkUrl(cmd.patch.dndbUrl);
      if (cmd.patch.initBonus !== undefined) {
        if (cmd.patch.initBonus) p.initBonus = cmd.patch.initBonus;
        else delete p.initBonus;
        const c = s.fight?.order.find((x) => x.kind === "player" && x.playerId === p.id);
        if (c && s.fight!.status !== "over") c.initBonus = p.initBonus ?? null;
      }
      break;
    }
    case "me.lockHashed": {
      const p = player(ctx.actor.role === "player" ? ctx.actor.playerId : "");
      if (p.keyHash) fail("Your name is already locked. Ask the DM to reset it.");
      p.keyHash = cmd.keyHash;
      break;
    }

    // ---------- issued by the server ----------
    case "system.arrivalStep": {
      const a = arriving(cmd.playerId).arrival!;
      if (cmd.step === "open") a.openedAt ??= ctx.now;
      else a.finishedAt ??= ctx.now;
      break;
    }
    case "system.arrivalKey": {
      const p = arriving(cmd.playerId);
      if (!p.keyHash) {
        p.keyHash = cmd.keyHash;
        p.arrival!.keyed = true;
      }
      break;
    }
    case "system.arrivalClaim": {
      const p = arriving(cmd.playerId);
      const a = p.arrival!;
      // Once seats are locked, a first claim still works (a late arrival at the table), but nobody can change theirs.
      if (a.claimedAt && s.arrival?.seatsLocked) fail("Seats are locked. Ask the DM if you need to change yours.", "locked");
      const character = cmd.character.replace(/\s+/g, " ").trim().slice(0, CHARACTER_MAX);
      const why = cmd.why.replace(/\s+/g, " ").trim().slice(0, WHY_MAX);
      if (character) p.character = character;
      else delete p.character;
      if (why) a.why = why;
      else delete a.why;
      if (cmd.pick !== undefined) {
        if (cmd.pick && starterById(cmd.pick)) a.pick = cmd.pick;
        else delete a.pick;
      }
      const first = !a.claimedAt;
      a.claimedAt ??= ctx.now;
      a.finishedAt ??= ctx.now;
      a.openedAt ??= ctx.now;
      // The last seat claimed: everyone's here, so close the door (the DM can open it again).
      if (first && s.players.filter((x) => !x.archived).every((x) => x.arrival?.claimedAt)) s.doorClosed = true;
      break;
    }
    case "system.join": {
      const h = normaliseHandle(cmd.handle);
      if (!h || isReservedHandle(h)) fail("Pick a different name.");
      if (s.players.some((p) => p.handle === h)) fail("That name is taken.");
      const p = createPlayer(h, cmd.name, "url", cmd.keyHash);
      p.lastSeenAt = ctx.now;
      s.knocks = s.knocks.filter((k) => k.handle !== h);
      break;
    }
    case "system.autoLock": {
      const p = player(cmd.playerId);
      // Only ever claims an unlocked name; never replaces someone's lock.
      if (!p.keyHash) p.keyHash = cmd.keyHash;
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

  if (/^(episode|beat|run)\./.test(cmd.type)) syncStoryStatus(s);
  // A fight a beat started, a map shown mid-fight, a player who left: tokens follow.
  syncFightTokens(s, nextId);
  // Every shop has its entry in Discover (a new shop, a reset catalog).
  syncShopEntries(s, ctx.now);
  return out;
}

/** The episode the current session is running, if any. */
export function curRunEpisode(s: Pick<GameState, "sessions" | "currentSessionId">): string | null {
  return s.sessions.find((x) => x.id === s.currentSessionId)?.run?.episodeId ?? null;
}

/** "Previously on…": the most recently ended session with a recap. */
export function previousRecap(s: Pick<GameState, "sessions" | "currentSessionId"> & Partial<Pick<GameState, "world" | "partyId">>): Session | null {
  return (
    s.sessions
      .filter((x) => x.id !== s.currentSessionId && x.endedAt !== null && x.recap?.trim() && (!s.world || x.partyId === s.partyId))
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
export function nextSessionNumber(s: Pick<GameState, "sessions"> & Partial<Pick<GameState, "world" | "partyId">>): number {
  // A shared world counts chapters per party.
  const mine = s.world ? s.sessions.filter((x) => x.partyId === s.partyId) : s.sessions;
  return mine.reduce((m, x) => Math.max(m, x.number), 0) + 1;
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
  if (!it.renown) delete it.renown;
  if (!it.trust) delete it.trust;
  return it;
}

/** Trim a plain note. One with no words at all says so. */
function cleanNotice(n: Notice): Notice {
  n.title = n.title.trim().slice(0, 120);
  n.body = n.body.trim().slice(0, 800);
  n.sign = n.sign.trim().slice(0, 80);
  n.dmNote = n.dmNote.trim();
  if (!n.title && !n.body && n.style !== "sealed" && !n.look.image) n.title = "Notice";
  return n;
}

/** Trim a job flyer. A sealed envelope carries no text. */
function cleanJob(j: Job): Job {
  if (!j.trust) delete j.trust;
  if (j.parties) j.parties = [...new Set(j.parties)];
  if (!j.parties?.length) delete j.parties;
  if (j.look) {
    j.look = cleanLook(j.look);
    if (!Object.keys(j.look).length) delete j.look;
  }
  j.title = j.title.trim().slice(0, 80);
  j.postedBy = j.postedBy.trim().slice(0, 80);
  j.body = j.body.trim().slice(0, 600);
  if (j.style !== "sealed" && !j.title) j.title = "Help wanted";
  if (j.reward.kind === "hidden") j.reward = { kind: "hidden", cp: 0 };
  for (const k of ["adventure", "loot", "twists", "notes"] as const) j.dm[k] = (j.dm[k] ?? "").trim();
  return j;
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
