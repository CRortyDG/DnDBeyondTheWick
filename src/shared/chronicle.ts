// The Chronicle: the story so far, written by the whole table. Each session is a
// chapter, and everyone's notes sit under it in the order they were written.
//
// Spoiler safety: players get notes the DM hasn't hidden, and recaps only once
// a session has ended. The tag picker's suggestions are built here on the
// server from things the players already know about, so a hidden map pin, an
// NPC they haven't met or a hidden shop item can't leak through it.

import type { GameState, Note, Player, Session } from "./types";
import { DM_AUTHOR } from "./types";

export const NOTE_MAX = 2000;
export const TAG_MAX = 40;
export const TAGS_PER_NOTE = 12;
/** A runaway phone can't fill the game document. */
export const NOTES_MAX = 5000;
/** The chapter id for notes written before the next session starts. */
export const NEXT_CHAPTER = "next";

export function notesOf(g: Pick<GameState, "notes">): Note[] {
  return g.notes ?? [];
}

/** Trim, collapse spaces, drop empties and case-insensitive duplicates. */
export function cleanTags(tags: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of tags) {
    const t = raw.replace(/\s+/g, " ").trim().slice(0, TAG_MAX);
    const k = tagKey(t);
    if (!t || seen.has(k)) continue;
    seen.add(k);
    out.push(t);
    if (out.length >= TAGS_PER_NOTE) break;
  }
  return out;
}

export function tagKey(t: string): string {
  return t.replace(/\s+/g, " ").trim().toLowerCase();
}

/** Keep line breaks; trim trailing spaces and blank lines at either end. */
export function cleanText(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((l) => l.replace(/\s+$/, ""))
    .join("\n")
    .replace(/^\n+|\n+$/g, "")
    .slice(0, NOTE_MAX);
}

/** How a player signs a note: their character, or their player name until they've picked one. */
export function penName(p: Pick<Player, "name" | "character">): string {
  return p.character?.trim() || p.name;
}

/** Where a new note goes: the running session, else the latest one, else the next chapter. */
export function defaultChapterId(g: Pick<GameState, "sessions" | "currentSessionId">): string {
  if (g.currentSessionId && g.sessions.some((x) => x.id === g.currentSessionId)) return g.currentSessionId;
  const latest = [...g.sessions].sort((a, b) => b.number - a.number)[0];
  return latest?.id ?? NEXT_CHAPTER;
}

/** A chapter id from a client: an existing session, or the next chapter. */
export function chapterSessionId(g: Pick<GameState, "sessions">, chapterId: string): string | null | undefined {
  if (chapterId === NEXT_CHAPTER) return null;
  return g.sessions.some((x) => x.id === chapterId) ? chapterId : undefined;
}

// ---------------------------------------------------------------------------
// What each screen gets

export interface ChronicleChapter {
  /** A session id, or NEXT_CHAPTER for the page waiting for the next session. */
  id: string;
  number: number;
  title: string;
  /** DM only (run sheets are DM-only): the episode it ran. */
  episode?: string;
  startedAt: number | null;
  endedAt: number | null;
  running: boolean;
  /** Who was there, as they sign their notes. */
  attendees: string[];
  noteTaker?: { id: string; name: string };
  /** Players: only once the session has ended. */
  recap?: string;
}

export interface ChronicleNote {
  id: string;
  chapterId: string;
  authorId: string;
  /** Character name (or player name). */
  author: string;
  /** The player's own name, when it differs from the author line. */
  player?: string;
  text: string;
  tags: string[];
  starred: boolean;
  /** Written by that chapter's note-taker. */
  quill: boolean;
  /** The viewer may edit, move and delete it. */
  editable: boolean;
  /** DM only: hidden from everyone else. */
  hidden?: boolean;
  at: number;
  editedAt?: number;
}

export interface ChronicleView {
  /** Oldest first. */
  chapters: ChronicleChapter[];
  /** Oldest first. */
  notes: ChronicleNote[];
  /** For the tag picker: only things the players already know about. */
  tags: string[];
  defaultChapterId: string;
  /** The DM: can star, hide and edit anything, and pick note-takers. */
  dm: boolean;
  /** DM only: who can be the note-taker. */
  noteTakers?: { id: string; name: string }[];
}

type Viewer = { dm: true } | { dm: false; playerId: string };

export function projectChronicle(g: GameState, viewer: Viewer): ChronicleView {
  const names = new Map(g.players.map((p) => [p.id, p]));
  const sessions = [...g.sessions].sort((a, b) => a.number - b.number);
  const episodes = g.episodes ?? [];
  const all = notesOf(g);
  const visible = viewer.dm ? all : all.filter((n) => !n.hidden);

  const chapter = (x: Session): ChronicleChapter => {
    const ended = x.endedAt !== null;
    const c: ChronicleChapter = {
      id: x.id,
      number: x.number,
      title: x.title,
      startedAt: x.startedAt,
      endedAt: x.endedAt,
      running: x.id === g.currentSessionId,
      attendees: x.attendeeIds.map((id) => names.get(id)).filter((p): p is Player => !!p).map(penName),
    };
    const ep = x.run ? episodes.find((e) => e.id === x.run!.episodeId) : undefined;
    if (ep && viewer.dm) c.episode = ep.title;
    const nt = x.noteTakerId ? names.get(x.noteTakerId) : undefined;
    if (nt) c.noteTaker = { id: nt.id, name: penName(nt) };
    if (x.recap?.trim() && (viewer.dm || ended)) c.recap = x.recap;
    return c;
  };
  const chapters = sessions.map(chapter);
  // The next chapter's empty page: before the first session (Chapter 1 of Episode 1),
  // or whenever someone has written ahead.
  if (!sessions.length || visible.some((n) => n.sessionId === null)) {
    const number = sessions.reduce((m, x) => Math.max(m, x.number), 0) + 1;
    const next: ChronicleChapter = { id: NEXT_CHAPTER, number, title: `Chapter ${number}`, startedAt: null, endedAt: null, running: false, attendees: [] };
    if (viewer.dm && !sessions.length && episodes[0]) next.episode = episodes[0].title;
    chapters.push(next);
  }

  const takers = new Map(sessions.map((x) => [x.id, x.noteTakerId]));
  const notes = visible.map((n): ChronicleNote => {
    const p = n.authorId === DM_AUTHOR ? undefined : names.get(n.authorId);
    const author = n.authorId === DM_AUTHOR ? "The DM" : p ? penName(p) : n.authorName;
    const out: ChronicleNote = {
      id: n.id,
      chapterId: n.sessionId ?? NEXT_CHAPTER,
      authorId: n.authorId,
      author,
      text: n.text,
      tags: [...n.tags],
      starred: !!n.starred,
      quill: !!n.sessionId && n.authorId !== DM_AUTHOR && takers.get(n.sessionId) === n.authorId,
      editable: viewer.dm || n.authorId === viewer.playerId,
      at: n.createdAt,
    };
    if (p && p.name !== author) out.player = p.name;
    if (n.editedAt) out.editedAt = n.editedAt;
    if (viewer.dm && n.hidden) out.hidden = true;
    return out;
  });

  const view: ChronicleView = { chapters, notes, tags: tagSuggestions(g), defaultChapterId: defaultChapterId(g), dm: viewer.dm };
  if (viewer.dm) view.noteTakers = g.players.filter((p) => !p.archived).map((p) => ({ id: p.id, name: penName(p) }));
  return view;
}

/**
 * The tag picker's suggestions, built only from what the players already know:
 * tags on notes they can see, NPCs they've met, map locations the TV names, and
 * shop goods on open shelves. Everyone gets the same list, the DM included.
 */
export function tagSuggestions(g: GameState): string[] {
  const out = new Map<string, string>();
  const add = (t: string | undefined) => {
    const v = t?.replace(/\s+/g, " ").trim().slice(0, TAG_MAX);
    if (v && !out.has(tagKey(v))) out.set(tagKey(v), v);
  };
  // Earlier tags first, so the table's own spelling wins.
  for (const n of notesOf(g)) if (!n.hidden) n.tags.forEach(add);
  for (const sc of g.scenes) {
    // NPCs: portraits that have been on the TV (or that the DM marked as met).
    if (sc.kind === "portrait" && sc.known) add(sc.name?.trim() || sc.label);
    // Map locations: discovered pins, only where the TV prints their names
    // (a "numbers only" legend keeps names off the TV, so here too).
    if (sc.kind === "map" && sc.map && sc.map.legendStyle === "names" && !sc.reveal) {
      for (const p of sc.map.pins) if (p.discovered) add(p.name);
    }
  }
  // Loot: things a player can hold that everyone can see on a shelf (for sale or
  // locked). Never rumored or hidden items, closed shops, or shops shown only to
  // some players; never rent, services or building projects; earned honours only
  // once someone has been granted one.
  const open = new Set(g.shops.filter((sh) => sh.visibility === "all" && !sh.closed).map((sh) => sh.id));
  const granted = new Set((g.awards ?? []).map((a) => a.itemId));
  for (const it of g.items) {
    if (!open.has(it.shopId) || (it.tier !== "sale" && it.tier !== "locked")) continue;
    if (it.kind === "recurring" || it.kind === "service" || it.kind === "project") continue;
    if (it.kind === "earned" && !granted.has(it.id)) continue;
    add(it.name);
  }
  return [...out.values()].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
}

// ---------------------------------------------------------------------------
// Markdown export (works on any screen's view, so a phone exports what it can see)

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatDay(ms: number): string {
  const d = new Date(ms);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatTime(ms: number): string {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function chapterHeading(c: Pick<ChronicleChapter, "number" | "title" | "episode">): string {
  const named = c.title && c.title !== `Session ${c.number}` && c.title !== `Chapter ${c.number}` ? c.title : "";
  const sub = c.episode && c.episode !== named ? [named, c.episode].filter(Boolean).join(": ") : named;
  return sub ? `Chapter ${c.number} · ${sub}` : `Chapter ${c.number}`;
}

/** The whole Chronicle (or one chapter) as Markdown, chapters in story order. Hidden notes never go in. */
export function chronicleMarkdown(view: Pick<ChronicleView, "chapters" | "notes">, opts: { gameName?: string; chapterId?: string } = {}): string {
  const chapters = view.chapters.filter((c) => !opts.chapterId || c.id === opts.chapterId);
  const lines: string[] = [];
  if (!opts.chapterId) lines.push(`# The Chronicle${opts.gameName ? `: ${opts.gameName}` : ""}`, "");
  for (const c of chapters) {
    const notes = view.notes.filter((n) => n.chapterId === c.id && !n.hidden).sort((a, b) => a.at - b.at);
    lines.push(`## ${chapterHeading(c)}`, "");
    const meta: string[] = [];
    if (c.startedAt !== null) meta.push(formatDay(c.startedAt));
    if (c.attendees.length) meta.push(`At the table: ${c.attendees.join(", ")}`);
    if (c.noteTaker) meta.push(`Note-taker: ${c.noteTaker.name}`);
    if (meta.length) lines.push(`_${meta.join(" · ")}_`, "");
    if (c.recap?.trim()) {
      for (const para of c.recap.trim().split(/\n\s*\n/)) lines.push(...para.split("\n").map((l) => `> ${l.trim()}`), ">");
      lines.pop();
      lines.push("");
    }
    if (!notes.length) lines.push("_No notes yet._", "");
    for (const n of notes) {
      const star = n.starred ? "★ " : "";
      const when = `${formatDay(n.at)}, ${formatTime(n.at)}`;
      const [first, ...rest] = n.text.split("\n");
      lines.push(`- ${star}**${n.author}**${n.quill ? " (note-taker)" : ""}, ${when}: ${first}`);
      for (const l of rest) lines.push(l.trim() ? `  ${l}` : "");
      if (n.tags.length) lines.push(`  _Tags: ${n.tags.join(", ")}_`);
    }
    if (notes.length) lines.push("");
  }
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
}
