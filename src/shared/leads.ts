// Leads: threads the party can pull on, grouped by the place they point to, and
// the party's vote on which to follow next. Players see a lead only once the DM
// shows it and whatever it's about isn't hidden.
import type { GameState, Lead, Vote } from "./types";
import { entriesOf, publicName } from "./discovery";
import { penName } from "./chronicle";

export const leadsOf = (g: GameState): Lead[] => g.leads ?? [];

/** Whether the TV and phones may see this lead. */
export function leadVisible(g: GameState, l: Lead): boolean {
  if (!l.shown) return false;
  if (!l.entryId) return true;
  const e = entriesOf(g).find((x) => x.id === l.entryId);
  return !!e && e.stage !== "hidden";
}

/** Has the vote closed, by the DM or by the clock? */
export function voteClosed(v: Vote, now: number): boolean {
  return v.closedAt !== undefined || (v.closesAt !== undefined && now >= v.closesAt);
}

/** Count the ballots: the winner, or the tied leads for the DM to break. No ballots at all is a tie of everything. */
export function tally(v: Vote): { counts: Record<string, number>; winnerId?: string; tied?: string[] } {
  const counts: Record<string, number> = Object.fromEntries(v.leadIds.map((id) => [id, 0]));
  for (const id of Object.values(v.ballots)) if (id in counts) counts[id] += 1;
  const top = Math.max(...Object.values(counts));
  const best = v.leadIds.filter((id) => counts[id] === top);
  return best.length === 1 ? { counts, winnerId: best[0] } : { counts, tied: best };
}

export interface PublicLead {
  id: string;
  text: string;
  status: Lead["status"];
  about?: { id: string; name: string };
  place?: { id: string; name: string };
  flyer?: { id: string; title: string };
}

export interface PublicVote {
  id: string;
  leadIds: string[];
  closesAt?: number;
  closed: boolean;
  /** Votes are visible live: how many for each, and who. */
  counts: Record<string, number>;
  voters: Record<string, string[]>;
  winnerId?: string;
  tied?: string[];
  /** Phones only: this player's ballot. */
  mine?: string;
}

export interface LeadsView {
  leads: PublicLead[];
  vote: PublicVote | null;
  chosen?: { n: number; at: number; lead: PublicLead };
}

function publicLead(g: GameState, l: Lead): PublicLead {
  const out: PublicLead = { id: l.id, text: l.text, status: l.status };
  // A rumor reads as its nickname, or its hint when it has no nickname ("???" says nothing).
  const named = (id?: string) => {
    const e = id ? entriesOf(g).find((x) => x.id === id) : undefined;
    const name = e ? publicName(e) : null;
    if (!e || !name) return undefined;
    return { id: e.id, name: e.stage === "rumored" && !e.nickname.trim() && e.hint.trim() ? e.hint.trim() : name };
  };
  const about = named(l.entryId);
  if (about) out.about = about;
  const place = named(l.placeId);
  if (place) out.place = place;
  const job = l.jobId ? (g.jobs ?? []).find((j) => j.id === l.jobId && j.pinned) : undefined;
  if (job) out.flyer = { id: job.id, title: job.title };
  return out;
}

/** What the TV (no playerId) or a phone sees. Drafts, DM notes and hidden entries never. */
export function leadsView(g: GameState, now: number, playerId?: string): LeadsView {
  const leads = leadsOf(g).filter((l) => leadVisible(g, l)).map((l) => publicLead(g, l));
  const v = g.vote;
  let vote: PublicVote | null = null;
  if (v && v.leadIds.every((id) => leads.some((l) => l.id === id))) {
    const t = tally(v);
    const names = new Map(g.players.map((p) => [p.id, penName(p)]));
    const voters: Record<string, string[]> = Object.fromEntries(v.leadIds.map((id) => [id, []]));
    for (const [pid, id] of Object.entries(v.ballots)) if (voters[id]) voters[id].push(names.get(pid) ?? "Someone");
    const closed = voteClosed(v, now);
    vote = { id: v.id, leadIds: [...v.leadIds], closed, counts: t.counts, voters };
    if (v.closesAt !== undefined) vote.closesAt = v.closesAt;
    if (closed) {
      if (v.winnerId) vote.winnerId = v.winnerId;
      else if (v.tied) vote.tied = [...v.tied];
      else if (t.winnerId) vote.winnerId = t.winnerId;
      else vote.tied = t.tied;
    }
    if (playerId && v.ballots[playerId]) vote.mine = v.ballots[playerId];
  }
  const out: LeadsView = { leads, vote };
  const c = g.chosen;
  const lead = c && leadsOf(g).find((l) => l.id === c.leadId);
  if (c && lead && leadVisible(g, lead)) out.chosen = { n: c.n, at: c.at, lead: publicLead(g, lead) };
  return out;
}
