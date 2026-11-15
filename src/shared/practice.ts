// Practice mode: rehearsing an episode on a private copy of the campaign.
//
// The copy lives in its own room on the server (see src/server/practice.ts),
// which no player link, TV link or Arrival link can reach. This file is the
// part both sides share: making the copy, timing the rehearsal, the practice
// commands, and telling content edits (worth keeping) from game state (always
// thrown away) when practice ends.

import { z } from "zod";
import { reslotCombatant, rollInitiative } from "./combat";
import type { Episode, GameState, Player, PracticeInfo, PracticeSegment } from "./types";

// ---------------------------------------------------------------------------
// Commands (DM only, practice copies only)

const id = z.string().min(1).max(64);

export const practiceDmCommands = [
  /** The practice notes box, one note per line. */
  z.object({ type: z.literal("practice.notes"), text: z.string().max(4000) }),
  /** Real session estimate = practice time x factor. */
  z.object({
    type: z.literal("practice.factor"),
    factor: z.number().min(1).max(4),
  }),
  /** The screen was away (tab hidden) this long: not counted. */
  z.object({
    type: z.literal("practice.away"),
    ms: z
      .number()
      .int()
      .min(0)
      .max(24 * 60 * 60 * 1000),
  }),
  z.object({
    type: z.literal("practice.standinAdd"),
    name: z.string().trim().min(1).max(32),
    character: z.string().max(80).optional(),
    maxHp: z.number().int().min(0).max(999).optional(),
  }),
  z.object({ type: z.literal("practice.standinRemove"), playerId: id }),
  z.object({
    type: z.literal("practice.standinSet"),
    playerId: id,
    ac: z.number().int().min(0).max(50).nullable().optional(),
    initBonus: z.number().int().min(-10).max(20).nullable().optional(),
    maxHp: z.number().int().min(0).max(999).nullable().optional(),
  }),
  /** d20 + each stand-in's bonus for every stand-in in the fight without an initiative. */
  z.object({ type: z.literal("practice.rollStandIns") }),
] as const;

export type PracticeCommand = z.infer<(typeof practiceDmCommands)[number]>;

export function isPracticeCommand(cmd: { type: string }): cmd is PracticeCommand {
  return cmd.type.startsWith("practice.");
}

export interface PracticeHelpers {
  now: number;
  rand: () => number;
  nextId: (prefix: string) => string;
  fail: (msg: string) => never;
}

export function applyPractice(s: GameState, cmd: PracticeCommand, h: PracticeHelpers) {
  const p = s.practice ?? h.fail("That only works in practice mode.");
  const standIn = (pid: string): Player => s.players.find((x) => x.id === pid) ?? h.fail("That stand-in isn't here.");
  switch (cmd.type) {
    case "practice.notes":
      p.notes = cmd.text;
      break;
    case "practice.factor":
      p.factor = Math.round(cmd.factor * 4) / 4;
      break;
    case "practice.away": {
      // Never more than the stretch being timed has run.
      const ms = p.open ? Math.min(cmd.ms, Math.max(0, h.now - p.open.since)) : Math.min(cmd.ms, Math.max(0, h.now - p.startedAt - p.awayMs));
      p.awayMs += ms;
      if (p.open) p.open.since += ms;
      break;
    }
    case "practice.standinAdd": {
      const pid = h.nextId("p");
      const handle = `stand-in-${pid}`;
      s.players.push({
        id: pid,
        handle,
        name: cmd.name,
        away: false,
        archived: false,
        dropIn: false,
        balanceCp: 0,
        createdAt: h.now,
        createdVia: "dm",
        ...(cmd.character?.trim() ? { character: cmd.character.trim() } : {}),
        ...(cmd.maxHp ? { hp: { cur: cmd.maxHp, max: cmd.maxHp, temp: 0 } } : {}),
        standIn: {},
      });
      // Joins a running session like anyone at the table.
      const sess = s.sessions.find((x) => x.id === s.currentSessionId);
      if (sess && !sess.attendeeIds.includes(pid)) sess.attendeeIds.push(pid);
      break;
    }
    case "practice.standinRemove": {
      const pl = standIn(cmd.playerId);
      if (s.fight?.order.some((c) => c.playerId === pl.id)) s.fight.order = s.fight.order.filter((c) => c.playerId !== pl.id);
      s.players = s.players.filter((x) => x.id !== pl.id);
      for (const sess of s.sessions) sess.attendeeIds = sess.attendeeIds.filter((x) => x !== pl.id);
      break;
    }
    case "practice.standinSet": {
      const pl = standIn(cmd.playerId);
      const si = (pl.standIn ??= {});
      if (cmd.ac !== undefined) {
        if (cmd.ac === null) delete si.ac;
        else si.ac = cmd.ac;
      }
      if (cmd.initBonus !== undefined) {
        if (cmd.initBonus === null) delete si.initBonus;
        else si.initBonus = cmd.initBonus;
      }
      if (cmd.maxHp !== undefined) {
        if (cmd.maxHp === null || cmd.maxHp === 0) delete pl.hp;
        else
          pl.hp = {
            cur: pl.hp ? Math.min(pl.hp.cur, cmd.maxHp) || cmd.maxHp : cmd.maxHp,
            max: cmd.maxHp,
            temp: pl.hp?.temp ?? 0,
            ...(pl.hp?.tv === false ? { tv: false } : {}),
          };
      }
      break;
    }
    case "practice.rollStandIns": {
      const f = s.fight ?? h.fail("There's no fight going.");
      let rolled = 0;
      for (const c of f.order) {
        if (c.kind !== "player" || c.init !== null) continue;
        const pl = s.players.find((x) => x.id === c.playerId);
        const bonus = pl?.standIn?.initBonus ?? 0;
        c.initBonus = bonus;
        c.init = rollInitiative(bonus, h.rand);
        reslotCombatant(f, c);
        rolled++;
      }
      if (!rolled) h.fail("Every stand-in already has an initiative.");
      break;
    }
  }
}

// ---------------------------------------------------------------------------
// Making the copy

/**
 * The live game, made safe to rehearse on: nobody's name lock or Arrival link
 * comes along (so the copy can't sign anyone in), nobody can knock, and every
 * player becomes a stand-in.
 */
export function practiceCopy(live: GameState, now: number, episodeId?: string, keep?: Pick<PracticeInfo, "notes" | "factor">): GameState {
  const s = structuredClone(live);
  for (const p of s.players) {
    delete p.keyHash;
    if (p.arrival) p.arrival.token = `practice-${p.id}`;
    p.standIn ??= {};
  }
  s.knocks = [];
  s.doorClosed = true;
  s.practice = {
    startedAt: now,
    ...(episodeId ? { episodeId } : {}),
    notes: keep?.notes ?? "",
    factor: keep?.factor ?? 2,
    awayMs: 0,
    segments: [],
    open: null,
  };
  return s;
}

// ---------------------------------------------------------------------------
// Timing

/** What's being rehearsed right now: a fight, a beat of the run sheet, or nothing. */
export function activityOf(s: GameState): { key: string; label: string } | null {
  const f = s.fight;
  if (f && f.status !== "over") return { key: `fight:${f.id}`, label: `Fight: ${f.title}` };
  const sess = s.sessions.find((x) => x.id === s.currentSessionId);
  const run = sess?.run;
  if (!run) return null;
  const ep = (s.episodes ?? []).find((e) => e.id === run.episodeId);
  if (!ep) return null;
  if (run.stage === "start") return { key: "start", label: "Session start" };
  if (run.stage === "end") return { key: "end", label: "Session end" };
  const b = ep.beats[run.beat];
  return b ? { key: `beat:${b.id}`, label: `${run.beat + 1}. ${b.title}` } : null;
}

function addTime(p: PracticeInfo, key: string, label: string, ms: number) {
  if (ms <= 0) return;
  const seg = p.segments.find((x) => x.key === key);
  if (seg) {
    seg.ms += ms;
    seg.label = label;
  } else p.segments.push({ key, label, ms });
}

/** After any command in a practice copy: close the stretch that ended and start timing the new one. */
export function trackPractice(s: GameState, now: number) {
  const p = s.practice;
  if (!p) return;
  const act = activityOf(s);
  if (p.open && p.open.key === act?.key) {
    p.open.label = act.label;
    return;
  }
  if (p.open) addTime(p, p.open.key, p.open.label, now - p.open.since);
  p.open = act ? { ...act, since: now } : null;
}

export interface PracticeTimes {
  totalMs: number;
  segments: PracticeSegment[];
  estimateMs: number;
}

/** The time summary, counting the stretch still open. */
export function practiceTimes(p: PracticeInfo, now: number): PracticeTimes {
  const segments = p.segments.map((x) => ({ ...x }));
  if (p.open) {
    const seg = segments.find((x) => x.key === p.open!.key);
    const ms = Math.max(0, now - p.open.since);
    if (seg) seg.ms += ms;
    else segments.push({ key: p.open.key, label: p.open.label, ms });
  }
  const totalMs = Math.max(0, now - p.startedAt - p.awayMs);
  return { totalMs, segments, estimateMs: Math.round(totalMs * p.factor) };
}

export function formatDuration(ms: number): string {
  const min = Math.round(ms / 60000);
  if (min < 1) return ms > 0 ? "under a minute" : "0 min";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? (m ? `${h} h ${m} min` : `${h} h`) : `${m} min`;
}

/** "about 1 h 10 min", or "under a minute". */
export function aboutDuration(ms: number): string {
  return ms < 30_000 ? "under a minute" : `about ${formatDuration(ms)}`;
}

/** The practice notes, one per line. */
export function practiceNoteLines(text: string): string[] {
  return text
    .split("\n")
    .map((x) => x.replace(/^\s*[-*•]\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 50)
    .map((x) => x.slice(0, 300));
}

// ---------------------------------------------------------------------------
// Content edits vs game state

/**
 * One content edit made in practice. Only content (run sheet text, monster
 * templates, Discovery text, shop items, board text, storyboard text) is ever
 * kept; everything that happens in play is thrown away.
 */
export interface PracticeEdit {
  /** "<collection>:<item id>" */
  id: string;
  change: "added" | "changed" | "removed";
  /** "Monster", "Run sheet", ... */
  what: string;
  name: string;
  /** "AC, HP" or "beat 3 “The kitchen”". */
  detail: string;
  /** The live game changed the same thing since practice began. */
  conflict: boolean;
}

type Obj = Record<string, unknown>;

interface Collection {
  key: string;
  what: string;
  get: (g: GameState) => Obj[];
  set: (g: GameState, items: Obj[]) => void;
  name: (x: Obj) => string;
  /** The content of an item: what's compared and what's kept. */
  content: (x: Obj) => Obj;
  /** The practice item's content with the live item's play state. */
  combine: (practice: Obj, live: Obj) => Obj;
  /** A new item, as it would be before any play (no reveals carried over from practice). */
  fresh: (x: Obj) => Obj;
  detail?: (base: Obj | undefined, now: Obj) => string;
  /** Never take this one away from the live game (it's on the TV now). */
  keepLive?: (live: GameState, id: string) => boolean;
}

const omit = (x: Obj, keys: string[]) => {
  const out: Obj = { ...x };
  for (const k of keys) delete out[k];
  return out;
};
const pick = (x: Obj, keys: string[]) => {
  const out: Obj = {};
  for (const k of keys) if (k in x) out[k] = x[k];
  return out;
};

/** Plain items whose play state is a few top-level fields. */
function simple(
  key: string,
  what: string,
  get: (g: GameState) => unknown[] | undefined,
  set: (g: GameState, items: Obj[]) => void,
  name: (x: Obj) => string,
  state: string[],
  fresh: (x: Obj) => Obj = (x) => x,
): Collection {
  return {
    key,
    what,
    get: (g) => (get(g) ?? []) as Obj[],
    set,
    name,
    content: (x) => omit(x, state),
    combine: (p, l) => ({ ...omit(p, state), ...pick(l, state) }),
    fresh: (x) => fresh(omit(x, [])),
  };
}

const FIELD_LABEL: Record<string, string> = {
  ac: "AC",
  hp: "HP",
  initBonus: "initiative",
  dmNote: "DM note",
  dmNotes: "DM notes",
  priceCp: "price",
  readAloud: "read-aloud",
  displayName: "TV name",
  sceneId: "picture",
  art: "picture",
  dm: "DM notes",
};
const label = (k: string) => FIELD_LABEL[k] ?? k.replace(/([A-Z])/g, " $1").toLowerCase();

function fieldDetail(base: Obj | undefined, now: Obj): string {
  if (!base) return "";
  const keys = new Set([...Object.keys(base), ...Object.keys(now)]);
  const changed = [...keys].filter((k) => JSON.stringify(base[k]) !== JSON.stringify(now[k])).map(label);
  return changed.slice(0, 4).join(", ") + (changed.length > 4 ? ` and ${changed.length - 4} more` : "");
}

function stripStories(ep: Obj): Obj {
  const e = omit(ep, ["prep", "prepNotes"]) as unknown as Episode;
  return {
    ...e,
    beats: e.beats.map((b) => (b.stories ? { ...b, stories: b.stories.map(({ done: _d, ...x }) => x) } : b)),
  } as unknown as Obj;
}

const COLLECTIONS: Collection[] = [
  {
    key: "episodes",
    what: "Run sheet",
    get: (g) => (g.episodes ?? []) as unknown as Obj[],
    set: (g, items) => (g.episodes = items as unknown as Episode[]),
    name: (x) => String(x.title ?? ""),
    content: stripStories,
    combine: (p, l) => {
      const live = l as unknown as Episode;
      const done = new Map<string, NonNullable<Episode["beats"][number]["stories"]>[number]["done"]>();
      for (const b of live.beats) for (const st of b.stories ?? []) if (st.done) done.set(`${b.id}:${st.storyBeatId}`, st.done);
      const ep = stripStories(p) as unknown as Episode;
      return {
        ...ep,
        beats: ep.beats.map((b) =>
          b.stories
            ? {
                ...b,
                stories: b.stories.map((st) => (done.has(`${b.id}:${st.storyBeatId}`) ? { ...st, done: done.get(`${b.id}:${st.storyBeatId}`) } : st)),
              }
            : b,
        ),
        ...(live.prep ? { prep: live.prep } : {}),
        ...(live.prepNotes ? { prepNotes: live.prepNotes } : {}),
      } as unknown as Obj;
    },
    fresh: (x) => stripStories(x),
    detail: (base, now) => {
      if (!base) return "";
      const b = base as unknown as Episode;
      const n = now as unknown as Episode;
      if (JSON.stringify(b.title) !== JSON.stringify(n.title)) return "title";
      const was = new Map(b.beats.map((x) => [x.id, JSON.stringify(x)]));
      const out: string[] = [];
      n.beats.forEach((x, i) => {
        if (was.get(x.id) !== JSON.stringify(x)) out.push(was.has(x.id) ? `beat ${i + 1} “${x.title}”` : `new beat “${x.title}”`);
      });
      const gone = b.beats.filter((x) => !n.beats.some((y) => y.id === x.id)).length;
      if (gone) out.push(`${gone} ${gone === 1 ? "beat" : "beats"} removed`);
      if (!out.length) return "beat order";
      return out.slice(0, 3).join(", ") + (out.length > 3 ? ` and ${out.length - 3} more` : "");
    },
  },
  simple(
    "monsters",
    "Monster",
    (g) => g.monsters,
    (g, v) => (g.monsters = v as never),
    (x) => String(x.name ?? ""),
    [],
  ),
  {
    key: "entries",
    what: "Discover",
    get: (g) => (g.entries ?? []) as unknown as Obj[],
    set: (g, v) => (g.entries = v as never),
    name: (x) => String(x.name ?? ""),
    content: (x) => ({
      ...omit(x, ["stage", "knownBy", "relation", "relationBy", "stagedAt", "foundAt", "foundIn"]),
      facts: ((x.facts ?? []) as Obj[]).map((f) => omit(f, ["revealedAt", "learnedIn", "knownBy"])),
    }),
    combine: (p, l) => {
      const liveFacts = new Map(((l.facts ?? []) as Obj[]).map((f) => [f.id, f]));
      return {
        ...omit(p, ["stage", "knownBy", "relation", "relationBy", "stagedAt", "foundAt", "foundIn"]),
        ...pick(l, ["stage", "knownBy", "relation", "relationBy", "stagedAt", "foundAt", "foundIn"]),
        facts: ((p.facts ?? []) as Obj[]).map((f) => {
          const lf = liveFacts.get(f.id);
          return {
            ...omit(f, ["revealedAt", "learnedIn", "knownBy"]),
            ...(lf ? pick(lf, ["revealedAt", "learnedIn", "knownBy"]) : {}),
          };
        }),
      };
    },
    fresh: (x) => ({
      ...omit(x, ["knownBy", "relation", "relationBy", "stagedAt", "foundAt", "foundIn"]),
      stage: x.start ?? "hidden",
      facts: ((x.facts ?? []) as Obj[]).map((f) => omit(f, ["revealedAt", "learnedIn", "knownBy"])),
    }),
  },
  {
    key: "scenes",
    what: "Scene",
    get: (g) => g.scenes as unknown as Obj[],
    set: (g, v) => (g.scenes = v as never),
    name: (x) => String(x.label ?? ""),
    content: (x) => sceneContent(x),
    combine: (p, l) => {
      const out = {
        ...sceneContent(p),
        ...pick(l, ["known", "shownAt", "knownBy"]),
      } as Obj;
      const pm = p.map as Obj | undefined;
      const lm = l.map as Obj | undefined;
      if (pm) {
        const livePins = new Map(((lm?.pins ?? []) as Obj[]).map((x) => [x.id, x]));
        out.map = {
          ...(out.map as Obj),
          ...(lm ? pick(lm, ["tokens", "fog", "fogBy"]) : {}),
          pins: ((pm.pins ?? []) as Obj[]).map((pin) => {
            const lp = livePins.get(pin.id);
            return {
              ...omit(pin, ["discovered", "knownBy"]),
              discovered: lp ? lp.discovered : false,
              ...(lp?.knownBy ? { knownBy: lp.knownBy } : {}),
            };
          }),
        };
      }
      return out;
    },
    fresh: (x) => {
      const out = sceneContent(x);
      const m = out.map as Obj | undefined;
      if (m)
        out.map = {
          ...m,
          pins: ((m.pins ?? []) as Obj[]).map((pin) => ({
            ...pin,
            discovered: false,
          })),
        };
      return out;
    },
    keepLive: (live, sid) => live.live.sceneId === sid,
  },
  simple(
    "shops",
    "Shop",
    (g) => g.shops,
    (g, v) => (g.shops = v as never),
    (x) => String(x.name ?? ""),
    ["visibility", "playerIds", "closed"],
  ),
  simple(
    "items",
    "Shop item",
    (g) => g.items,
    (g, v) => (g.items = v as never),
    (x) => String(x.name ?? ""),
    ["stock", "tier"],
  ),
  simple(
    "notices",
    "Board note",
    (g) => g.notices,
    (g, v) => (g.notices = v as never),
    (x) => String(x.title || x.body || "").slice(0, 60),
    ["up", "place"],
    (x) => ({ ...x, up: false }),
  ),
  simple(
    "jobs",
    "Job flyer",
    (g) => g.jobs,
    (g, v) => (g.jobs = v as never),
    (x) => String(x.title ?? ""),
    ["status", "pinned", "pinnedAt", "takenBy", "takenAt", "doneAt", "paidCp", "partyId", "place"],
    (x) => ({ ...x, status: "open", pinned: false }),
  ),
  simple(
    "storyThreads",
    "Story thread",
    (g) => g.story?.threads,
    (g, v) => g.story && (g.story.threads = v as never),
    (x) => String(x.name || "Backstory"),
    [],
  ),
  simple(
    "storyBeats",
    "Story beat",
    (g) => g.story?.beats,
    (g, v) => g.story && (g.story.beats = v as never),
    (x) => String(x.title ?? ""),
    ["status", "plays"],
    (x) => ({ ...x, status: "planned", plays: [] }),
  ),
];

function sceneContent(x: Obj): Obj {
  const out = omit(x, ["known", "shownAt", "knownBy"]);
  const m = x.map as Obj | undefined;
  if (m)
    out.map = {
      ...omit(m, ["tokens", "fog", "fogBy"]),
      pins: ((m.pins ?? []) as Obj[]).map((pin) => omit(pin, ["discovered", "knownBy"])),
    };
  return out;
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const byId = (items: Obj[]) => new Map(items.map((x) => [String(x.id), x]));

/**
 * What changed in practice that's content, compared with the copy as it was
 * when practice began (base) and the live game now.
 */
export function practiceEdits(base: GameState, practice: GameState, live: GameState): PracticeEdit[] {
  const out: PracticeEdit[] = [];
  for (const c of COLLECTIONS) {
    const b = byId(c.get(base));
    const p = byId(c.get(practice));
    const l = byId(c.get(live));
    const ids = [...new Set([...b.keys(), ...p.keys()])];
    for (const itemId of ids) {
      const bi = b.get(itemId);
      const pi = p.get(itemId);
      const li = l.get(itemId);
      const bc = bi ? c.content(bi) : undefined;
      const pc = pi ? c.content(pi) : undefined;
      if (same(bc, pc)) continue;
      if (bi && !pi && !li) continue; // removed in both
      const change = !bi ? "added" : !pi ? "removed" : "changed";
      const conflict = change === "added" ? false : !same(li ? c.content(li) : undefined, bc);
      const shown = (pi ?? bi)!;
      out.push({
        id: `${c.key}:${itemId}`,
        change,
        what: c.what,
        name: c.name(shown) || "(no name)",
        detail: change === "changed" ? (c.detail ?? fieldDetail)(bc, pc!) : "",
        conflict,
      });
    }
  }
  return out;
}

/**
 * The live game with the chosen practice edits applied. Only content moves;
 * the live game's play state (stages, stock, who's pinned) stays its own.
 */
export function applyPracticeEdits(live: GameState, base: GameState, practice: GameState, keep: string[]): { state: GameState; applied: number } {
  const s = structuredClone(live);
  delete s.practice;
  const want = new Set(keep);
  let applied = 0;
  // New things made in practice keep their ids; make sure the live game won't hand those out again.
  s.seq = Math.max(s.seq, practice.seq);
  for (const c of COLLECTIONS) {
    const b = byId(c.get(base));
    const p = byId(c.get(practice));
    let items = c.get(s).map((x) => x);
    for (const [itemId, pi] of p) {
      if (!want.has(`${c.key}:${itemId}`)) continue;
      const li = items.find((x) => String(x.id) === itemId);
      if (!b.has(itemId)) {
        if (li) continue; // the live game has its own thing with that id
        items.push(structuredClone(c.fresh(pi)));
      } else if (li) {
        items = items.map((x) => (String(x.id) === itemId ? structuredClone(c.combine(pi, li)) : x));
      } else continue; // deleted from the live game since
      applied++;
    }
    for (const itemId of b.keys()) {
      if (p.has(itemId) || !want.has(`${c.key}:${itemId}`)) continue;
      if (c.keepLive?.(s, itemId)) continue;
      const before = items.length;
      items = items.filter((x) => String(x.id) !== itemId);
      if (items.length < before) applied++;
    }
    if (c.key.startsWith("story") && !s.story) continue;
    c.set(s, items);
  }
  return { state: s, applied };
}

/** Practice notes onto the episode's prep checklist (or the DM's to-do list when no episode was rehearsed). */
export function addPrepNotes(s: GameState, episodeId: string | undefined, lines: string[], now: number) {
  if (!lines.length) return;
  const ep = episodeId ? (s.episodes ?? []).find((e) => e.id === episodeId) : undefined;
  for (const text of lines) {
    const nid = `pn${(++s.seq).toString(36)}`;
    if (ep) (ep.prepNotes ??= []).push({ id: nid, text, at: now });
    else
      s.tasks.push({
        id: nid,
        at: now,
        text: `Practice note: ${text}`,
        done: false,
      });
  }
  if (ep?.prepNotes && ep.prepNotes.length > 100) ep.prepNotes = ep.prepNotes.slice(-100);
}
