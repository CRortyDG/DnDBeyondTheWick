// Keepsakes: small in-world objects a character carries away from a real moment
// at the table, each with one line about what happened. The DM always gives them.
// The app only notices moments it already records (death saves, natural 20s,
// fights won after someone went down, discoveries, Renown, starred notes) and
// suggests a few at the end of the night. No counters, points or tiers.

import { z } from "zod";
import { natural } from "./dice";
import { notesOf, penName } from "./chronicle";
import { entriesOf } from "./discovery";
import { ranksOf } from "./renown";
import { partiesFor } from "./world";
import type { FightSummary, GameState, Keepsake, Player, Session } from "./types";
import { DM_AUTHOR } from "./types";

export const KEEPSAKE_NAME_MAX = 60;
export const KEEPSAKE_LINE_MAX = 240;
export const KEEPSAKES_MAX = 500;
/** One to three a night is plenty; the End session step never shows more than this. */
export const SUGGESTIONS_MAX = 4;
const KEY_MAX = 120;

export function keepsakesOf(g: Pick<GameState, "keepsakes">): Keepsake[] {
  return g.keepsakes ?? [];
}

const id = z.string().min(1).max(64);
const name = z.string().max(KEEPSAKE_NAME_MAX);
const line = z.string().max(KEEPSAKE_LINE_MAX);

export const keepsakeDmCommands = [
  /** Give a keepsake to one character, or to several (a party keepsake). source: the suggestion it came from. inspire: Heroic Inspiration too. */
  z.object({
    type: z.literal("keepsake.give"),
    playerIds: z.array(id).min(1).max(24),
    name,
    line,
    sessionId: id.optional(),
    source: z.string().min(1).max(KEY_MAX).optional(),
    inspire: z.boolean().optional(),
  }),
  z.object({ type: z.literal("keepsake.edit"), keepsakeId: id, name: name.optional(), line: line.optional(), playerIds: z.array(id).min(1).max(24).optional() }),
  z.object({ type: z.literal("keepsake.remove"), keepsakeId: id }),
  /** Not this one: the suggestion stops showing for that session. */
  z.object({ type: z.literal("keepsake.skip"), sessionId: id, source: z.string().min(1).max(KEY_MAX) }),
] as const;

export type KeepsakeCommand = z.infer<(typeof keepsakeDmCommands)[number]>;

export function isKeepsakeCommand(cmd: { type: string }): cmd is KeepsakeCommand {
  return cmd.type.startsWith("keepsake.");
}

/** "Brin", "Brin and Mira", "Brin, Mira and Tov". */
export function namesList(names: string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
}

/** The Chronicle line a keepsake adds. */
export function keepsakeNoteText(k: Pick<Keepsake, "name" | "line">, who: string[]): string {
  const l = k.line.trim();
  return `${namesList(who)} ${who.length === 1 ? "kept" : "keep"} a keepsake: ${k.name.trim()}.${l ? ` ${l}` : ""}`;
}

// ---------------------------------------------------------------------------
// Suggestions

export interface KeepsakeSuggestion {
  /** Stable, so a skip or a give sticks: "save20:<fight>:<player>". */
  key: string;
  playerIds: string[];
  name: string;
  line: string;
  /** For the DM only: why the app thinks it's worth one ("Natural 20 on a death save"). */
  why: string;
}

const lower1 = (t: string) => t.charAt(0).toLowerCase() + t.slice(1);
/** "the fight with 2 goblins on the bog road", "the fight with the Reedlurk". */
const fightPhrase = (f: Pick<FightSummary, "title" | "where">) => {
  const t = f.title.trim();
  const foe = !t ? "the enemy" : /^\d/.test(t) ? t.replace(/^(\d+\s+)(\S)/, (_, n: string, c: string) => n + c.toLowerCase()) : /^(the|a|an)\s/i.test(t) ? lower1(t) : `the ${t}`;
  return `the fight with ${foe}${f.where ? ` ${f.where}` : ""}`;
};
const firstName = (n: string) => n.split(/\s+/)[0] || n;

/** Who was at the table that night (still with the campaign). */
export function attendeesOf(g: Pick<GameState, "players">, sess: Pick<Session, "attendeeIds">): Player[] {
  const ids = new Set(sess.attendeeIds);
  return g.players.filter((p) => ids.has(p.id) && !p.archived);
}

/**
 * A few moments from one session that might be worth a keepsake, best first.
 * Leaves out ones the DM skipped or already gave. Never more than SUGGESTIONS_MAX.
 */
export function keepsakeSuggestions(
  g: Pick<GameState, "players" | "sessions" | "fights" | "rolls" | "entries" | "notes" | "renownLog" | "renownRanks" | "town" | "keepsakes">,
  sessionId: string,
  now: number = Date.now(),
): KeepsakeSuggestion[] {
  const sess = g.sessions.find((x) => x.id === sessionId);
  if (!sess) return [];
  const end = sess.endedAt ?? now;
  const inSession = (at: number) => at >= sess.startedAt && at <= end;
  const people = new Map(g.players.filter((p) => !p.archived).map((p) => [p.id, p]));
  const pen = (pid: string) => {
    const p = people.get(pid);
    return p ? penName(p) : "";
  };
  const party = attendeesOf(g, sess).map((p) => p.id);
  const out: KeepsakeSuggestion[] = [];
  const add = (x: KeepsakeSuggestion) => {
    if (x.playerIds.length && x.playerIds.every((pid) => people.has(pid))) out.push(x);
  };

  const fights = (g.fights ?? []).filter((f) => f.sessionId === sessionId);
  // A natural 20 on a death save, and hanging on through three saves.
  for (const f of fights) {
    const done = new Set<string>();
    for (const m of f.marks ?? []) {
      if (done.has(m.playerId)) continue;
      if (m.kind === "save20") {
        done.add(m.playerId);
        add({ key: `save20:${f.id}:${m.playerId}`, playerIds: [m.playerId], name: "A borrowed breath", line: `Came back on a natural 20 in ${fightPhrase(f)}, when the table thought ${firstName(pen(m.playerId))} was gone.`, why: `${pen(m.playerId)} rolled a natural 20 on a death save` });
      }
    }
    for (const m of f.marks ?? []) {
      if (done.has(m.playerId) || m.kind !== "stable") continue;
      done.add(m.playerId);
      add({ key: `stable:${f.id}:${m.playerId}`, playerIds: [m.playerId], name: "A stubborn heartbeat", line: `Held on through three death saves in ${fightPhrase(f)}.`, why: `${pen(m.playerId)} made three death saves` });
    }
    // Went down, and the party still won.
    if (f.outcome === "won") {
      for (const m of f.marks ?? []) {
        if (done.has(m.playerId) || m.kind !== "downed") continue;
        done.add(m.playerId);
        add({ key: `downed:${f.id}:${m.playerId}`, playerIds: [m.playerId], name: `A scar from ${f.where ? lower1(f.where.replace(/^(in|at|on|by|under|near)\s+/i, "")) : fightPhrase({ title: f.title, where: "" }).replace(/^the fight with /, "")}`, line: `Went down in ${fightPhrase(f)}, and the party still won.`, why: `${pen(m.playerId)} dropped to 0 HP and the party won` });
      }
    }
  }

  // A player's natural 20 that counted (from the sheet or the dice; not initiative). One each.
  const critBy = new Set<string>();
  const rolls = (g.rolls ?? []).filter((r) => r.by && inSession(r.at) && r.for !== "initiative" && natural(r) === 20);
  // Labelled attacks and checks first: "Longsword attack" tells a better story than a bare d20.
  rolls.sort((a, b) => Number(!!b.label) - Number(!!a.label) || a.at - b.at);
  for (const r of rolls) {
    const pid = r.by!;
    if (critBy.has(pid) || !people.has(pid)) continue;
    critBy.add(pid);
    const during = fights.find((f) => r.at >= f.startedAt && r.at <= f.endedAt);
    const what = r.label ? ` on ${r.label}` : "";
    add({ key: `crit:${sessionId}:${pid}`, playerIds: [pid], name: "The lucky die", line: `Rolled a natural 20${what}${during ? ` in ${fightPhrase(during)}` : ""}, right when it counted.`, why: `${pen(pid)} rolled a natural 20${what}` });
  }

  // Secrets and factions the party uncovered (people, places and shops are just met, not earned).
  if (party.length) {
    for (const e of entriesOf(g)) {
      if (e.foundIn !== sessionId || ["person", "place", "shop", "monster"].includes(e.kind)) continue;
      if (e.stage !== "found" && e.stage !== "known") continue;
      add({ key: `found:${e.id}`, playerIds: party, name: `A clue to ${e.name}`, line: `The night the party uncovered ${e.name}.`, why: `The party uncovered ${e.name}` });
    }
  }

  // The town started calling the party something new.
  if (party.length) {
    const ranks = ranksOf(g);
    const ups = (g.renownLog ?? []).filter((c) => inSession(c.at) && c.rankTo > c.rankFrom);
    const top = ups.at(-1);
    if (top) {
      const rank = ranks[top.rankTo]?.name ?? "something new";
      const ids = top.playerIds?.length ? top.playerIds.filter((pid) => people.has(pid)) : party;
      add({ key: `renown:${top.id}`, playerIds: ids, name: `A token of ${rank}`, line: `The night the town started calling the party ${rank}.`, why: `Renown went up to ${rank}` });
    }
  }

  // Starred notes from the table: for whoever the note is about, else whoever wrote it.
  for (const n of notesOf(g)) {
    if (n.sessionId !== sessionId || !n.starred || n.hidden || n.world) continue;
    const text = n.text.trim();
    const about = [...people.values()].filter((p) => party.includes(p.id) && new RegExp(`\\b${escapeRe(penName(p).split(/\s+/)[0])}\\b`, "i").test(text)).map((p) => p.id);
    const ids = about.length ? about : n.authorId !== DM_AUTHOR && people.has(n.authorId) ? [n.authorId] : party;
    if (!ids.length) continue;
    add({ key: `note:${n.id}`, playerIds: ids, name: "Something to remember it by", line: text.length > KEEPSAKE_LINE_MAX ? `${text.slice(0, KEEPSAKE_LINE_MAX - 1)}…` : text, why: "A starred note from the Chronicle" });
  }

  const given = new Set(keepsakesOf(g).map((k) => k.source).filter(Boolean));
  const skipped = new Set(sess.keepsakeSkips ?? []);
  return out.filter((x) => !given.has(x.key) && !skipped.has(x.key)).slice(0, SUGGESTIONS_MAX);
}

function escapeRe(t: string): string {
  return t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ---------------------------------------------------------------------------
// What a phone gets

export interface PublicKeepsake {
  id: string;
  name: string;
  line: string;
  /** Chapter number, if it came from a session. */
  chapter?: number;
  at: number;
  /** Their character names. */
  who: string[];
  /** One of the viewer's own. */
  mine: boolean;
}

/**
 * The keepsakes a phone shows: the player's own, and their party's (everyone at
 * the table in a one-table game; their parties' characters in a shared world).
 */
export function publicKeepsakes(g: Pick<GameState, "keepsakes" | "players" | "sessions" | "world" | "parties">, playerId: string): PublicKeepsake[] {
  const people = new Map(g.players.map((p) => [p.id, p]));
  const party = g.world ? new Set([playerId, ...partiesFor(g, playerId).flatMap((p) => p.memberIds)]) : null;
  const seen = (pid: string) => (party ? party.has(pid) : !people.get(pid)?.archived);
  const chapters = new Map(g.sessions.map((x) => [x.id, x.number]));
  return keepsakesOf(g)
    .filter((k) => k.playerIds.some(seen))
    .map((k) => {
      const ch = k.sessionId ? chapters.get(k.sessionId) : undefined;
      return {
        id: k.id,
        name: k.name,
        line: k.line,
        ...(ch !== undefined ? { chapter: ch } : {}),
        at: k.at,
        who: k.playerIds.map((pid) => people.get(pid)).filter((p): p is Player => !!p).map(penName),
        mine: k.playerIds.includes(playerId),
      };
    })
    .sort((a, b) => b.at - a.at);
}
