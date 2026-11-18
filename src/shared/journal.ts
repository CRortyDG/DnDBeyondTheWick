import { z } from "zod";
import type { GameState, Player } from "./types";

/**
 * A player's personal journal: their character's goals, backstory and private
 * notes, kept on their phone. It is theirs and the DM's: no other phone and
 * never the TV. The DM reads it to weave hooks in, and can keep a private hook
 * idea against a goal (DM-ONLY: never sent back to the phone).
 *
 * Goals are just what the character wants, ticked off when it happens. There is
 * no progress tracking here on purpose (personal quests are their own thing).
 */
export interface Journal {
  /** Where they came from, as long or short as they like. */
  backstory?: string;
  /** What the character wants. Newest last. */
  goals?: JournalGoal[];
  /** Private notes. Newest last. */
  notes?: JournalNote[];
  /** Last time the player changed anything (the DM sees "updated 2 days ago"). */
  updatedAt?: number;
}

export interface JournalGoal {
  id: string;
  text: string;
  at: number;
  /** They ticked it off (when). */
  doneAt?: number;
  /** DM-ONLY: the DM's own hook idea for this goal. Never on the phone. */
  hook?: string;
}

export interface JournalNote {
  id: string;
  text: string;
  at: number;
  editedAt?: number;
  /** The chapter (session number) it was written in, or after. */
  ch?: number;
  /** Written between sessions, after chapter ch. */
  between?: true;
}

export const JOURNAL_BACKSTORY_MAX = 4000;
export const JOURNAL_GOAL_MAX = 200;
export const JOURNAL_GOALS_MAX = 8;
export const JOURNAL_NOTE_MAX = 1000;
export const JOURNAL_NOTES_MAX = 100;
export const JOURNAL_HOOK_MAX = 300;

const jid = z.string().min(1).max(24);
const journalAct = z.discriminatedUnion("op", [
  z.object({ op: z.literal("backstory"), text: z.string().max(JOURNAL_BACKSTORY_MAX) }),
  z.object({ op: z.literal("goalAdd"), text: z.string().max(JOURNAL_GOAL_MAX) }),
  z.object({ op: z.literal("goal"), id: jid, text: z.string().max(JOURNAL_GOAL_MAX).optional(), done: z.boolean().optional() }),
  z.object({ op: z.literal("goalRemove"), id: jid }),
  z.object({ op: z.literal("noteAdd"), text: z.string().max(JOURNAL_NOTE_MAX) }),
  z.object({ op: z.literal("note"), id: jid, text: z.string().max(JOURNAL_NOTE_MAX) }),
  z.object({ op: z.literal("noteRemove"), id: jid }),
]);
export type JournalAct = z.infer<typeof journalAct>;

export const journalPlayerCommands = [
  /** Write in my own journal. */
  z.object({ type: z.literal("me.journal"), act: journalAct }),
] as const;

export const journalDmCommands = [
  /** The DM's private hook idea for one of a player's goals. Empty clears it. */
  z.object({ type: z.literal("journal.hook"), playerId: z.string().min(1).max(64), goalId: jid, text: z.string().max(JOURNAL_HOOK_MAX) }),
] as const;

export type JournalCommand = z.infer<(typeof journalPlayerCommands)[number]> | z.infer<(typeof journalDmCommands)[number]>;

export function isJournalCommand(cmd: { type: string }): cmd is JournalCommand {
  return cmd.type === "me.journal" || cmd.type === "journal.hook";
}

const cleanLine = (v: string) => v.replace(/\s+/g, " ").trim();
const cleanBlock = (v: string) =>
  v
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

/** "Chapter 3", "After chapter 3", or nothing before the first session. */
export function noteWhen(n: Pick<JournalNote, "ch" | "between">): string {
  if (!n.ch) return "";
  return n.between ? `After chapter ${n.ch}` : `Chapter ${n.ch}`;
}

/** Where the table is in the story right now, for a new note. */
function chapterNow(s: GameState): Pick<JournalNote, "ch" | "between"> {
  const cur = s.currentSessionId ? s.sessions.find((x) => x.id === s.currentSessionId) : undefined;
  if (cur) return { ch: cur.number };
  const last = s.sessions.at(-1);
  return last ? { ch: last.number, between: true } : {};
}

/** Is there anything in it? */
export function journalEmpty(j: Journal | undefined): boolean {
  return !j || (!j.backstory && !j.goals?.length && !j.notes?.length);
}

/** The journal as the player's own phone gets it: the DM's hook ideas taken out. */
export function journalForPlayer(j: Journal | undefined): Journal | undefined {
  if (!j || journalEmpty(j)) return undefined;
  const out: Journal = {};
  if (j.backstory) out.backstory = j.backstory;
  if (j.goals?.length) out.goals = j.goals.map(({ hook: _hook, ...g }) => ({ ...g }));
  if (j.notes?.length) out.notes = j.notes.map((n) => ({ ...n }));
  if (j.updatedAt) out.updatedAt = j.updatedAt;
  return out;
}

export function applyJournal(
  s: GameState,
  cmd: JournalCommand,
  h: { actor: { role: string; playerId?: string }; now: number; fail: (m: string) => never; newId: () => string },
) {
  const find = (pid: string | undefined): Player => s.players.find((p) => p.id === pid) ?? h.fail("That player isn't here.");
  if (cmd.type === "journal.hook") {
    const p = find(cmd.playerId);
    const g = p.journal?.goals?.find((x) => x.id === cmd.goalId) ?? h.fail("That goal isn't in their journal any more.");
    const text = cleanBlock(cmd.text);
    if (text) g.hook = text;
    else delete g.hook;
    return;
  }
  if (h.actor.role !== "player") h.fail("Only the player writes in their journal.");
  const p = find(h.actor.playerId);
  const j: Journal = (p.journal ??= {});
  const a = cmd.act;
  const goal = (id: string) => j.goals?.find((x) => x.id === id) ?? h.fail("That goal isn't there any more.");
  const note = (id: string) => j.notes?.find((x) => x.id === id) ?? h.fail("That note isn't there any more.");
  switch (a.op) {
    case "backstory": {
      const text = cleanBlock(a.text);
      if (text) j.backstory = text;
      else delete j.backstory;
      break;
    }
    case "goalAdd": {
      const text = cleanLine(a.text);
      if (!text) h.fail("Write the goal first.");
      j.goals ??= [];
      if (j.goals.length >= JOURNAL_GOALS_MAX) h.fail(`That's ${JOURNAL_GOALS_MAX} goals already. Tick one off or remove one first.`);
      j.goals.push({ id: h.newId(), text, at: h.now });
      break;
    }
    case "goal": {
      const g = goal(a.id);
      if (a.text !== undefined) {
        const text = cleanLine(a.text);
        if (!text) h.fail("A goal needs some words. Remove it instead?");
        g.text = text;
      }
      if (a.done === true && !g.doneAt) g.doneAt = h.now;
      if (a.done === false) delete g.doneAt;
      break;
    }
    case "goalRemove":
      goal(a.id);
      j.goals = j.goals!.filter((x) => x.id !== a.id);
      break;
    case "noteAdd": {
      const text = cleanBlock(a.text);
      if (!text) h.fail("Write something first.");
      j.notes ??= [];
      if (j.notes.length >= JOURNAL_NOTES_MAX) h.fail(`Your journal holds ${JOURNAL_NOTES_MAX} notes. Remove an old one to make room.`);
      j.notes.push({ id: h.newId(), text, at: h.now, ...chapterNow(s) });
      break;
    }
    case "note": {
      const n = note(a.id);
      const text = cleanBlock(a.text);
      if (!text) h.fail("A note needs some words. Remove it instead?");
      if (text !== n.text) {
        n.text = text;
        n.editedAt = h.now;
      }
      break;
    }
    case "noteRemove":
      note(a.id);
      j.notes = j.notes!.filter((x) => x.id !== a.id);
      break;
  }
  if (!j.goals?.length) delete j.goals;
  if (!j.notes?.length) delete j.notes;
  if (journalEmpty(j)) {
    delete p.journal;
    return;
  }
  j.updatedAt = h.now;
}
