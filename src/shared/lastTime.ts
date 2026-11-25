// "Last time on…": a short recap card the DM sends to players' devices after a
// session ends. The DM always reviews it first: the app drafts it from things
// players can already see (the DM's recap, which reaches the Chronicle once the
// session ends, what the party discovered, and starred visible notes), never from
// run sheets, quick notes, beat titles or the episode name.

import { notesOf, penName } from "./chronicle";
import { sessionRecap } from "./discovery";
import type { GameState, Session } from "./types";
import { DM_AUTHOR } from "./types";

export const LAST_TIME_TEXT_MAX = 4000;
export const LAST_TIME_NOTES_MAX = 8;

/** The draft the DM starts from, before they've changed anything. */
export function lastTimeDraft(g: Pick<GameState, "sessions" | "entries" | "notes"> & Partial<Pick<GameState, "fights" | "players" | "town">>, sessionId: string): { text: string; noteIds: string[] } {
  const sess = g.sessions.find((x) => x.id === sessionId);
  const found = sessionRecap(g, sessionId)?.replace(/^Tonight you /, "Last time you ");
  const parts = [sess?.recap?.trim(), found].filter((x): x is string => !!x);
  return { text: parts.join("\n\n").slice(0, LAST_TIME_TEXT_MAX), noteIds: lastTimeNoteChoices(g, sessionId).filter((n) => n.starred).slice(0, LAST_TIME_NOTES_MAX).map((n) => n.id) };
}

/** Notes the DM can put under the card: that chapter's visible ones, starred first. The discovery line the app wrote is left out (it's in the draft already). */
export function lastTimeNoteChoices(g: Pick<GameState, "notes" | "sessions" | "entries"> & Partial<Pick<GameState, "fights" | "players" | "town">>, sessionId: string) {
  const auto = sessionRecap(g, sessionId);
  return notesOf(g)
    .filter((n) => n.sessionId === sessionId && !n.hidden && !n.world && !(n.authorId === DM_AUTHOR && n.text === auto))
    .sort((a, b) => Number(!!b.starred) - Number(!!a.starred) || a.createdAt - b.createdAt);
}

/** Only notes from that chapter that everyone can still see. */
export function pickableNoteIds(g: Pick<GameState, "notes">, sessionId: string, ids: string[]): string[] {
  const ok = new Set(notesOf(g).filter((n) => n.sessionId === sessionId && !n.hidden && !n.world).map((n) => n.id));
  return [...new Set(ids)].filter((x) => ok.has(x)).slice(0, LAST_TIME_NOTES_MAX);
}

export interface LastTimeCard {
  /** Changes every time the DM sends (or re-sends) it, so devices pop it up again. */
  n: number;
  /** Chapter number (players never get episode or session titles from here). */
  chapter: number;
  at: number;
  text: string;
  notes: { text: string; author: string }[];
}

/** The card as a player gets it. Notes hidden since it was sent drop out. */
export function publicLastTime(g: Pick<GameState, "notes" | "players">, sess: Session): LastTimeCard | null {
  const sent = sess.playerRecap?.sent;
  if (!sent || sess.endedAt === null || !sent.text.trim()) return null;
  const byId = new Map(notesOf(g).map((n) => [n.id, n]));
  const people = new Map(g.players.map((p) => [p.id, p]));
  const notes = sent.noteIds
    .map((id) => byId.get(id))
    .filter((n) => !!n && !n.hidden && n.sessionId === sess.id)
    .map((n) => {
      const p = n!.authorId === DM_AUTHOR ? undefined : people.get(n!.authorId);
      return { text: n!.text, author: n!.authorId === DM_AUTHOR ? "The DM" : p ? penName(p) : n!.authorName };
    });
  return { n: sent.n, chapter: sess.number, at: sent.at, text: sent.text, notes };
}

/** The newest card any of these sessions sent (the viewer's own parties' sessions, in a shared world). */
export function latestLastTime(g: Pick<GameState, "notes" | "players" | "sessions">): LastTimeCard | null {
  const sess = g.sessions.filter((x) => x.endedAt !== null && x.playerRecap?.sent).sort((a, b) => b.playerRecap!.sent!.at - a.playerRecap!.sent!.at)[0];
  return sess ? publicLastTime(g, sess) : null;
}
