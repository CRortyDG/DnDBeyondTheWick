// Secret whispers: a private note from the DM to one player (or a few) during
// play. "You notice the baker's hands are shaking." Only the players it was sent
// to ever get it: never the TV, never anyone else's phone. Each one is "sealed"
// on the phone until its player taps to read it, so the DM can see who has read
// what, and a player can answer quietly with one line.
//
// A player can also start one: a private note to the DM ("Can I pocket the
// ring without anyone seeing?"). It's kept as a whisper with `from` set, so it
// lives in the same list on both sides; the DM answers with an ordinary whisper.

import { z } from "zod";
import type { GameState, Player } from "./types";

export const WHISPER_MAX = 1000;
export const WHISPER_REPLY_MAX = 300;
/** A note a player starts. */
export const PLAYER_NOTE_MAX = 500;
/** Unread notes one player can have waiting on the DM before they're asked to wait. */
export const PLAYER_NOTES_WAITING = 5;
/** At most this many players on one whisper. */
export const WHISPER_TO_MAX = 20;
/** The game keeps the newest this many. */
export const WHISPERS_KEPT = 200;
/** A phone gets its newest this many. */
export const WHISPERS_PHONE = 30;

export interface WhisperReply {
  playerId: string;
  text: string;
  at: number;
}

export interface Whisper {
  id: string;
  at: number;
  text: string;
  /** Player ids, in the order the DM picked them. A player's own note: just them. */
  to: string[];
  /** A note a player wrote to the DM (their id). Missing: the DM's whisper. */
  from?: string;
  /** The session it was sent in (missing: between sessions). */
  sessionId?: string;
  /** When each player opened it, by player id. */
  seen?: Record<string, number>;
  /** One quiet answer per player (the newest replaces the last). */
  replies?: WhisperReply[];
}

/** What a phone gets: its own copy, with nobody else's name, read mark or reply. */
export interface MyWhisper {
  id: string;
  at: number;
  text: string;
  seen: boolean;
  reply?: string;
  /** Sent during the session that's running now. */
  tonight: boolean;
  /** I wrote this one to the DM. */
  mine?: true;
}

const id = z.string().min(1).max(64);

export const whisperDmCommands = [
  /** Whisper to one or more players. Only they see it. */
  z.object({ type: z.literal("whisper.send"), to: z.array(id).min(1).max(WHISPER_TO_MAX), text: z.string().max(WHISPER_MAX) }),
  /** Take one back: it leaves every phone it went to. */
  z.object({ type: z.literal("whisper.remove"), whisperId: id }),
  /** The DM has read the replies so far. */
  z.object({ type: z.literal("whisper.read") }),
] as const;

export const whisperPlayerCommands = [
  /** I opened it. */
  z.object({ type: z.literal("me.whisperSeen"), whisperId: id }),
  /** My quiet answer (empty: take my answer back). */
  z.object({ type: z.literal("me.whisperReply"), whisperId: id, text: z.string().max(WHISPER_REPLY_MAX) }),
  /** A private note to the DM, started by me. */
  z.object({ type: z.literal("me.whisperStart"), text: z.string().max(PLAYER_NOTE_MAX) }),
] as const;

export type WhisperDmCommand = z.infer<(typeof whisperDmCommands)[number]>;
export type WhisperPlayerCommand = z.infer<(typeof whisperPlayerCommands)[number]>;
export type WhisperCommand = WhisperDmCommand | WhisperPlayerCommand;

export function isWhisperCommand(cmd: { type: string }): cmd is WhisperCommand {
  return cmd.type.startsWith("whisper.") || cmd.type === "me.whisperSeen" || cmd.type === "me.whisperReply" || cmd.type === "me.whisperStart";
}

export function whispersOf(g: Pick<GameState, "whispers">): Whisper[] {
  return g.whispers ?? [];
}

/** Replies (and notes players started) the DM hasn't looked at yet. */
export function unreadReplies(g: Pick<GameState, "whispers" | "whispersReadAt">): WhisperReply[] {
  const since = g.whispersReadAt ?? 0;
  return whispersOf(g).flatMap((w) => (w.from ? (w.at > since ? [{ playerId: w.from, text: w.text, at: w.at }] : []) : (w.replies ?? []).filter((r) => r.at > since)));
}

export interface WhisperHelpers {
  now: number;
  actor: { role: string; playerId?: string };
  nextId: (prefix: string) => string;
  fail: (m: string) => never;
}

export function applyWhisper(s: GameState, cmd: WhisperCommand, h: WhisperHelpers): void {
  const find = (wid: string) => whispersOf(s).find((w) => w.id === wid) ?? h.fail("That whisper is gone.");
  /** The player sending a me. command, who must be on the whisper. */
  const mine = (wid: string): [Whisper, Player] => {
    const p = s.players.find((x) => x.id === h.actor.playerId) ?? h.fail("That player isn't here.");
    const w = whispersOf(s).find((x) => x.id === wid && x.to.includes(p.id));
    if (!w) h.fail("That whisper is gone.");
    return [w, p];
  };
  switch (cmd.type) {
    case "whisper.send": {
      const text = cmd.text.trim();
      if (!text) h.fail("Write the whisper first.");
      const to: string[] = [];
      for (const pid of cmd.to) {
        if (to.includes(pid)) continue;
        const p = s.players.find((x) => x.id === pid) ?? h.fail("That player isn't here.");
        if (p.archived) h.fail(`${p.character?.trim() || p.name} has left the table.`);
        to.push(p.id);
      }
      const w: Whisper = { id: h.nextId("w"), at: h.now, text, to, ...(s.currentSessionId ? { sessionId: s.currentSessionId } : {}) };
      s.whispers = [...whispersOf(s), w].slice(-WHISPERS_KEPT);
      return;
    }
    case "whisper.remove": {
      const w = find(cmd.whisperId);
      s.whispers = whispersOf(s).filter((x) => x !== w);
      if (!s.whispers.length) delete s.whispers;
      return;
    }
    case "whisper.read": {
      s.whispersReadAt = h.now;
      return;
    }
    case "me.whisperStart": {
      const p = s.players.find((x) => x.id === h.actor.playerId) ?? h.fail("That player isn't here.");
      if (p.archived) h.fail("You've left the table.");
      const text = cmd.text.trim();
      if (!text) h.fail("Write your note first.");
      const since = s.whispersReadAt ?? 0;
      if (whispersOf(s).filter((w) => w.from === p.id && w.at > since).length >= PLAYER_NOTES_WAITING) h.fail("The DM hasn't read your last few notes yet. Give them a moment.");
      const w: Whisper = { id: h.nextId("w"), at: h.now, text, to: [p.id], from: p.id, seen: { [p.id]: h.now }, ...(s.currentSessionId ? { sessionId: s.currentSessionId } : {}) };
      s.whispers = [...whispersOf(s), w].slice(-WHISPERS_KEPT);
      return;
    }
    case "me.whisperSeen": {
      const [w, p] = mine(cmd.whisperId);
      if (w.seen?.[p.id]) return;
      w.seen = { ...w.seen, [p.id]: h.now };
      return;
    }
    case "me.whisperReply": {
      const [w, p] = mine(cmd.whisperId);
      if (w.from) h.fail("That's your own note.");
      const text = cmd.text.trim();
      const rest = (w.replies ?? []).filter((r) => r.playerId !== p.id);
      if (text) w.replies = [...rest, { playerId: p.id, text, at: h.now }];
      else if (rest.length) w.replies = rest;
      else delete w.replies;
      // Answering means you read it.
      w.seen = { ...w.seen, [p.id]: w.seen?.[p.id] ?? h.now };
      return;
    }
  }
}

/** A phone's whispers: only ones sent to this player, newest first, with only their own mark and answer. */
export function myWhispers(g: Pick<GameState, "whispers" | "currentSessionId">, playerId: string): MyWhisper[] {
  return whispersOf(g)
    .filter((w) => w.to.includes(playerId))
    .slice(-WHISPERS_PHONE)
    .reverse()
    .map((w) => {
      const reply = w.replies?.find((r) => r.playerId === playerId)?.text;
      return { id: w.id, at: w.at, text: w.text, seen: !!w.seen?.[playerId], ...(reply ? { reply } : {}), tonight: !!g.currentSessionId && w.sessionId === g.currentSessionId, ...(w.from === playerId ? { mine: true as const } : {}) };
    });
}
