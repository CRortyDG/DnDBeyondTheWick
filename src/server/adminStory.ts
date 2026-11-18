import { notesOf } from "@/shared/chronicle";
import { entriesOf } from "@/shared/discovery";
import { originOf } from "@/shared/presets";
import { jobsOf } from "@/shared/renown";
import { invitesOf } from "@/shared/invites";
import type { GameState } from "@/shared/types";
import type { CampaignStory, CampaignSummary, RoomFacts } from "@/shared/admin";

// What a room tells the admin console about itself (worker/room.ts): counts,
// dates and the story, cut down for reading. Never keys or key hashes.

function originLabel(g: GameState): string {
  const o = originOf(g);
  return o.kind === "preset" ? `preset:${o.code}${o.name ? ` (${o.name})` : ""}` : o.kind;
}

const clip = (s: unknown, n: number) => (typeof s === "string" ? (s.length > n ? s.slice(0, n - 1) + "…" : s) : "");


export function summarise(code: string, g: GameState | null, facts: RoomFacts): CampaignSummary {
  if (!g) {
    return {
      code, exists: false, name: "", town: "", origin: "", createdAt: 0, touchedAt: null, players: 0, playersSeen: 0, playerNames: [], lastSeenAt: null,
      sessions: 0, sessionsEnded: 0, notes: 0, found: 0, entries: 0, fights: 0, rolls: 0, jobs: 0, invites: 0,
      activeDays: [], activeDayCount: 0, openScreens: facts.openScreens, imageFiles: 0, storageBytes: 0,
    };
  }
  // Premade campaigns start with placeholder seats ("Player 1"): they count once someone opens them.
  const players = (g.players ?? []).filter((p) => !p.archived && !p.standIn && (p.createdVia !== "seed" || p.lastSeenAt));
  const seen = players.filter((p) => p.lastSeenAt);
  const lastSeen = Math.max(0, ...seen.map((p) => p.lastSeenAt ?? 0));
  const entries = entriesOf(g);
  return {
    code,
    exists: true,
    name: clip(g.name, 80),
    town: clip(g.town ?? "", 60),
    origin: originLabel(g),
    createdAt: g.createdAt ?? 0,
    touchedAt: facts.touchedAt,
    players: players.length,
    playersSeen: seen.length,
    playerNames: players.slice(0, 8).map((p) => clip(p.character || p.name, 40)),
    lastSeenAt: lastSeen || null,
    sessions: (g.sessions ?? []).length,
    sessionsEnded: (g.sessions ?? []).filter((s) => s.endedAt).length,
    notes: notesOf(g).length,
    found: entries.filter((e) => e.stage === "found" || e.stage === "known").length,
    entries: entries.length,
    fights: (g.fights ?? []).length,
    rolls: (g.rolls ?? []).length,
    jobs: jobsOf(g).length,
    invites: invitesOf(g).length,
    activeDays: facts.activeDays.slice(-60),
    activeDayCount: facts.activeDays.length,
    openScreens: facts.openScreens,
    imageFiles: facts.imageFiles,
    storageBytes: facts.storageBytes,
  };
}

/** The story, cut down for reading. Never keys, key hashes, invite places or the DM's private notes. */
export function storyFor(code: string, g: GameState | null, facts: RoomFacts): CampaignStory {
  const summary = summarise(code, g, facts);
  if (!g) return { summary, players: [], sessions: [], notes: [], entries: [], jobs: [], episodes: [], threads: [] };
  const names = new Map((g.players ?? []).map((p) => [p.id, p.character || p.name]));
  const chapter = new Map((g.sessions ?? []).map((s) => [s.id, s.number]));
  return {
    summary,
    players: (g.players ?? [])
      .filter((p) => !p.standIn && (p.createdVia !== "seed" || p.lastSeenAt))
      .map((p) => ({
        name: clip(p.name, 40),
        character: clip(p.character ?? "", 60),
        level: p.level ?? null,
        className: clip([p.sheet?.species, p.sheet?.cls].filter(Boolean).join(" "), 60),
        joinedAt: p.createdAt,
        lastSeenAt: p.lastSeenAt ?? null,
        archived: p.archived,
        via: p.createdVia,
      })),
    sessions: (g.sessions ?? []).map((s) => ({
      number: s.number,
      title: clip(s.title, 120),
      startedAt: s.startedAt,
      endedAt: s.endedAt,
      attendees: s.attendeeIds.map((id) => names.get(id) ?? "?"),
      recap: clip(s.recap ?? "", 4000),
    })),
    notes: notesOf(g)
      .slice(-500)
      .map((n) => ({
        chapter: n.sessionId ? (chapter.get(n.sessionId) ?? null) : null,
        author: clip(n.authorName, 60),
        text: clip(n.text, 2000),
        tags: n.tags.slice(0, 10),
        createdAt: n.createdAt,
        hidden: !!n.hidden,
        starred: !!n.starred,
      })),
    entries: entriesOf(g)
      .slice(0, 400)
      .map((e) => ({ kind: e.kind, name: clip(e.name, 80), stage: e.stage, title: clip(e.title, 120), summary: clip(e.summary, 400) })),
    jobs: jobsOf(g)
      .slice(0, 100)
      .map((j) => ({ title: clip(j.title, 120), status: j.status })),
    episodes: (g.episodes ?? []).slice(0, 100).map((e) => clip(e.title, 120)),
    threads: (g.story?.threads ?? []).slice(0, 100).map((t) => clip(t.name || "Backstory", 120)),
  };
}

