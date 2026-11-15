// The storyboard: story beats on threads, laid out over the year from
// Winterfest 2026 to Winterfest 2027. All of it is DM-ONLY: GameState.story is
// never copied into a TV or player view (see projection.ts and the canary
// tests), and seed text lives on the server (src/server/seed-story.ts).

import type { GameState, Player, Story, StoryBeat, StoryBeatType, StoryDate, StoryLink, StoryRange, StoryStatus, StoryThread, StoryThreadKind } from "./types";
import { entriesOf, kindInfo } from "./discovery";

export const THREADS_MAX = 60;
export const BEATS_MAX = 400;
export const DATES_MAX = 80;
export const LINKS_MAX = 30;
export const AFTER_MAX = 20;
export const OUTCOME_MAX = 300;

export const BEAT_TYPES: { id: StoryBeatType; label: string; hint: string }[] = [
  { id: "clue", label: "Clue", hint: "Something they can find" },
  { id: "reveal", label: "Reveal", hint: "The truth comes out" },
  { id: "choice", label: "Choice", hint: "They decide" },
  { id: "consequence", label: "Consequence", hint: "The world reacts" },
  { id: "background", label: "Background", hint: "A small detail, no spotlight" },
  { id: "spotlight", label: "Spotlight", hint: "A player's moment" },
];
export const BEAT_TYPE_IDS = BEAT_TYPES.map((t) => t.id) as [StoryBeatType, ...StoryBeatType[]];
export const typeLabel = (t: StoryBeatType) => BEAT_TYPES.find((x) => x.id === t)?.label ?? t;

export const STATUSES: { id: StoryStatus; label: string }[] = [
  { id: "planned", label: "Planned" },
  { id: "placed", label: "Placed" },
  { id: "played", label: "Played" },
  { id: "dropped", label: "Dropped" },
];
export const statusLabel = (s: StoryStatus) => STATUSES.find((x) => x.id === s)?.label ?? s;

export const THREAD_KINDS: { id: StoryThreadKind; label: string }[] = [
  { id: "main", label: "Main story" },
  { id: "side", label: "Side story" },
  { id: "place", label: "Place" },
  { id: "backstory", label: "Backstory" },
];
export const THREAD_KIND_IDS = THREAD_KINDS.map((k) => k.id) as [StoryThreadKind, ...StoryThreadKind[]];

export const THREAD_COLORS = ["#b0473a", "#c99a3a", "#4f7a9a", "#5d8a5a", "#8a5a9a", "#a86a3a", "#3f8a86", "#9a4f6a", "#6a7a3a", "#5a5f9a"];

export function emptyStory(): Story {
  return { threads: [], beats: [], dates: [], zoom: "month", festivals: true };
}

export function storyOf(g: Pick<GameState, "story">): Story {
  return g.story ?? emptyStory();
}

// ---------------------------------------------------------------------------
// The calendar. Months are "YYYY-MM"; days are "YYYY-MM-DD".

export const FIRST_MONTH = "2026-12";
export const LAST_MONTH = "2027-12";
export const LAST_DAY = "2027-12-31";

export const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
export const DAY_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

export function isDay(d: string): boolean {
  if (!DAY_RE.test(d)) return false;
  const t = new Date(`${d}T00:00:00Z`);
  return !Number.isNaN(t.getTime()) && t.toISOString().slice(0, 10) === d;
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function addMonths(m: string, n: number): string {
  const [y, mo] = m.split("-").map(Number);
  const t = y * 12 + (mo - 1) + n;
  return `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, "0")}`;
}

export function monthsBetween(from: string, to: string): string[] {
  const out: string[] = [];
  for (let m = from; m <= to && out.length < 240; m = addMonths(m, 1)) out.push(m);
  return out;
}

export const BOARD_MONTHS = monthsBetween(FIRST_MONTH, LAST_MONTH);

export function monthLabel(m: string, long = false): string {
  const [y, mo] = m.split("-").map(Number);
  return `${(long ? MONTH_LONG : MONTH_NAMES)[mo - 1]} ${y}`;
}

export function dayLabel(d: string): string {
  const [y, mo, da] = d.split("-").map(Number);
  return `${MONTH_NAMES[mo - 1]} ${da}, ${y}`;
}

export const monthOf = (day: string) => day.slice(0, 7);

/** The real season a month falls in (northern hemisphere: December is winter). */
export function seasonOf(m: string): "Winter" | "Spring" | "Summer" | "Fall" {
  const mo = Number(m.slice(5, 7));
  if (mo === 12 || mo <= 2) return "Winter";
  if (mo <= 5) return "Spring";
  if (mo <= 8) return "Summer";
  return "Fall";
}

export interface BoardColumn {
  id: string;
  label: string;
  /** Smaller line under the label ("Winterfest Y1"). */
  sub?: string;
  months: string[];
}

/** The board's columns: one per month, or one per season (Winterfest Y2 is its own). */
export function boardColumns(zoom: Story["zoom"]): BoardColumn[] {
  const winterfest = (m: string) => (m === "2026-12" ? "Winterfest Y1" : m === "2027-12" ? "Winterfest Y2" : undefined);
  if (zoom === "month") return BOARD_MONTHS.map((m) => ({ id: m, label: monthLabel(m), sub: winterfest(m), months: [m] }));
  return [
    { id: "winter-y1", label: "Winter", sub: "Winterfest Y1 · Dec–Feb", months: monthsBetween("2026-12", "2027-02") },
    { id: "spring", label: "Spring", sub: "Mar–May 2027", months: monthsBetween("2027-03", "2027-05") },
    { id: "summer", label: "Summer", sub: "Jun–Aug 2027", months: monthsBetween("2027-06", "2027-08") },
    { id: "fall", label: "Fall", sub: "Sep–Nov 2027", months: monthsBetween("2027-09", "2027-11") },
    { id: "winter-y2", label: "Winter", sub: "Winterfest Y2 · Dec 2027", months: ["2027-12"] },
  ];
}

/** Faerûn's festivals near their real-world season. Labels only, not exact dates. */
export const FESTIVALS: { name: string; month: string; note: string }[] = [
  { name: "Midwinter", month: "2026-12", note: "Midwinter, the turn of the year" },
  { name: "Greengrass", month: "2027-03", note: "Greengrass, the first day of spring" },
  { name: "Midsummer", month: "2027-06", note: "Midsummer, the height of summer" },
  { name: "Highharvestide", month: "2027-09", note: "Highharvestide, the harvest feast" },
  { name: "Feast of the Moon", month: "2027-11", note: "Feast of the Moon, for the dead, late fall" },
  { name: "Midwinter", month: "2027-12", note: "Midwinter again" },
];

/** Named windows, for the editor's quick picks and the seed beats. */
export const WINDOW_PRESETS: { id: string; label: string; range: StoryRange }[] = [
  { id: "winterfest-y1", label: "Winterfest Y1", range: { from: "2026-12", to: "2026-12" } },
  { id: "end-winterfest-y1", label: "End of Winterfest Y1", range: { from: "2026-12", to: "2027-01" } },
  { id: "winter-y1", label: "Winter Y1", range: { from: "2026-12", to: "2027-02" } },
  { id: "after-winterfest-y1", label: "After Winterfest Y1", range: { from: "2027-01", to: "2027-12" } },
  { id: "spring", label: "Spring", range: { from: "2027-03", to: "2027-05" } },
  { id: "summer", label: "Summer", range: { from: "2027-06", to: "2027-08" } },
  { id: "fall", label: "Fall", range: { from: "2027-09", to: "2027-11" } },
  { id: "fall-or-winterfest-y2", label: "Fall or Winterfest Y2", range: { from: "2027-09", to: "2027-12" } },
  { id: "winterfest-y2", label: "Winterfest Y2", range: { from: "2027-12", to: "2027-12" } },
];

export function presetRange(id: string): StoryRange {
  const p = WINDOW_PRESETS.find((x) => x.id === id);
  if (!p) throw new Error(`No window preset ${id}`);
  return { ...p.range };
}

export function windowLabel(w: StoryBeat["window"]): string {
  if (!w) return "Floating";
  if (w === "anytime") return "Anytime";
  const p = WINDOW_PRESETS.find((x) => x.range.from === w.from && x.range.to === w.to);
  if (p) return p.label;
  if (w.from === w.to) return monthLabel(w.from);
  const [fy] = w.from.split("-");
  const [ty] = w.to.split("-");
  return fy === ty ? `${monthLabel(w.from).split(" ")[0]}–${monthLabel(w.to)}` : `${monthLabel(w.from)} – ${monthLabel(w.to)}`;
}

/** Move a window so it starts in this month, keeping its length. */
export function shiftWindow(w: StoryRange, from: string): StoryRange {
  const len = monthsBetween(w.from, w.to).length - 1;
  return { from, to: addMonths(from, Math.max(0, len)) };
}

/** Which board column a beat's card sits in: "anytime", "floating", or a column id. */
export function columnOf(b: Pick<StoryBeat, "window">, cols: BoardColumn[]): string {
  if (!b.window) return "floating";
  if (b.window === "anytime") return "anytime";
  const m = b.window.from < cols[0].months[0] ? cols[0].months[0] : b.window.from;
  return (cols.find((c) => c.months.includes(m)) ?? cols[cols.length - 1]).id;
}

/** Session dates every `every` days from `start`, up to the end of the board. */
export function datesFrom(start: string, every: number, until = LAST_DAY): string[] {
  const out: string[] = [];
  const t = new Date(`${start}T12:00:00Z`);
  while (out.length < DATES_MAX) {
    const d = t.toISOString().slice(0, 10);
    if (d > until) break;
    out.push(d);
    t.setUTCDate(t.getUTCDate() + every);
  }
  return out;
}

export function liveDates(st: Story): StoryDate[] {
  return [...st.dates].filter((d) => !d.cancelled).sort((a, b) => a.date.localeCompare(b.date));
}

/** "Today" as the DM's device sees it. */
export function todayOf(now: number): string {
  const d = new Date(now);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// Threads

export const backstoryThreadId = (playerId: string) => `th-bs-${playerId}`;

/** Players who get a Backstory lane: everyone at the table who hasn't left (drop-ins don't). */
export function backstoryPlayers(players: Player[]): Player[] {
  return players.filter((p) => !p.archived && !p.dropIn);
}

export function threadLabel(t: StoryThread, players: Pick<Player, "id" | "name" | "character">[]): string {
  if (t.kind === "backstory" && t.playerId) {
    const p = players.find((x) => x.id === t.playerId);
    const who = p ? p.character?.trim() || p.name : t.name || "a player who left";
    return `Backstory: ${who}`;
  }
  return t.name || "Untitled thread";
}

/** One Backstory lane per player at the table, made the first time they're seen. Returns true if it added any. Drops empty lanes of deleted players. */
export function ensureBackstory(st: Story, players: Player[]): boolean {
  let added = false;
  // A lane for someone no longer in the game, with nothing planned on it, goes.
  st.threads = st.threads.filter((t) => t.kind !== "backstory" || !t.playerId || players.some((p) => p.id === t.playerId) || st.beats.some((b) => b.threadId === t.id));
  for (const p of backstoryPlayers(players)) {
    const id = backstoryThreadId(p.id);
    if (st.threads.some((t) => t.id === id)) continue;
    if (st.threads.length >= THREADS_MAX) break;
    st.threads.push({
      id,
      name: "",
      color: THREAD_COLORS[st.threads.length % THREAD_COLORS.length],
      description: `${p.character?.trim() || p.name}'s own story: why they came, what they want, who they left behind.`,
      goal: "",
      kind: "backstory",
      playerId: p.id,
    });
    added = true;
  }
  return added;
}

// ---------------------------------------------------------------------------
// Links

export function linkKey(l: StoryLink): string {
  return l.kind === "fact" ? `fact:${l.entryId}/${l.factId}` : `${l.kind}:${l.id}`;
}

export interface LinkInfo {
  key: string;
  /** "Person", "Fact", "Job flyer" */
  kind: string;
  label: string;
  missing: boolean;
  /** For filters: the entry it's about. */
  entryId?: string;
}

export function linkInfo(g: GameState, l: StoryLink): LinkInfo {
  const key = linkKey(l);
  const entries = entriesOf(g);
  switch (l.kind) {
    case "entry": {
      const e = entries.find((x) => x.id === l.id);
      return { key, kind: e ? kindInfo(e.kind).label : "Entry", label: e?.name ?? "A deleted entry", missing: !e, entryId: l.id };
    }
    case "fact": {
      const e = entries.find((x) => x.id === l.entryId);
      const f = e?.facts.find((x) => x.id === l.factId);
      return { key, kind: "Fact", label: e && f ? `${e.name}: ${f.text}` : "A deleted fact", missing: !f, entryId: l.entryId };
    }
    case "job": {
      const j = (g.jobs ?? []).find((x) => x.id === l.id);
      return { key, kind: "Job flyer", label: j?.title ?? "A deleted job", missing: !j };
    }
    case "flyer": {
      const f = g.flyers.find((x) => x.id === l.id);
      return { key, kind: "Flyer", label: f?.title ?? "A deleted flyer", missing: !f };
    }
    case "lead": {
      const x = (g.leads ?? []).find((y) => y.id === l.id);
      return { key, kind: "Lead", label: x?.text ?? "A deleted lead", missing: !x };
    }
    case "item": {
      const it = g.items.find((x) => x.id === l.id);
      return { key, kind: it?.kind === "project" ? "Project" : "Item", label: it?.name ?? "A deleted item", missing: !it };
    }
    case "monster": {
      const m = (g.monsters ?? []).find((x) => x.id === l.id);
      return { key, kind: "Monster template", label: m?.name ?? "A deleted template", missing: !m };
    }
  }
}

/** Every entry a beat is about (directly or through a fact), for the person/place filter. */
export function beatEntryIds(b: Pick<StoryBeat, "links">): string[] {
  return b.links.flatMap((l) => (l.kind === "entry" ? [l.id] : l.kind === "fact" ? [l.entryId] : []));
}

// ---------------------------------------------------------------------------
// Warnings

export interface BeatWarning {
  kind: "overdue" | "after" | "window";
  text: string;
}

function startMonth(b: Pick<StoryBeat, "window">): string | null {
  return b.window && b.window !== "anytime" ? b.window.from : null;
}

/** What's wrong with a beat right now. `today` is "YYYY-MM-DD" on the DM's device. */
export function beatWarnings(st: Story, b: StoryBeat, today: string): BeatWarning[] {
  const out: BeatWarning[] = [];
  const done = b.status === "played" || b.status === "dropped";
  if (b.by && !done) {
    if (today > b.by) out.push({ kind: "overdue", text: `Overdue: it had to happen by ${dayLabel(b.by)}.` });
    else {
      const from = startMonth(b);
      if (from && from > monthOf(b.by)) out.push({ kind: "overdue", text: `Its window starts after its must-happen-by date (${dayLabel(b.by)}).` });
      else if (b.status === "planned" && st.dates.length && !liveDates(st).some((d) => d.date >= today && d.date <= b.by!))
        out.push({ kind: "overdue", text: `No session left before ${dayLabel(b.by)}.` });
    }
  }
  for (const id of b.after) {
    const dep = st.beats.find((x) => x.id === id);
    if (!dep || dep.status === "dropped") continue;
    const depPlayed = dep.plays.length > 0;
    if (b.plays.length && !depPlayed) out.push({ kind: "after", text: `Played before “${dep.title}”, which has to come first.` });
    else if (!depPlayed && !done) {
      const mine = startMonth(b);
      const theirs = startMonth(dep);
      if (mine && theirs && mine < theirs) out.push({ kind: "after", text: `Sits before “${dep.title}” on the board, but has to come after it.` });
      else if (b.status === "placed") out.push({ kind: "after", text: `Placed, but “${dep.title}” isn't played yet.` });
    }
  }
  if (!done && b.status === "planned" && b.window && b.window !== "anytime" && b.window.to < monthOf(today)) {
    out.push({ kind: "window", text: `Its window (${windowLabel(b.window)}) has passed.` });
  }
  return out;
}

/** Would making `beatId` come after `depId` make a loop? */
export function makesLoop(st: Pick<Story, "beats">, beatId: string, depId: string): boolean {
  const seen = new Set<string>();
  const walk = (id: string): boolean => {
    if (id === beatId) return true;
    if (seen.has(id)) return false;
    seen.add(id);
    return (st.beats.find((x) => x.id === id)?.after ?? []).some(walk);
  };
  return walk(depId);
}

export interface BeatFilter {
  threadIds?: string[];
  types?: StoryBeatType[];
  statuses?: StoryStatus[];
  entryId?: string;
}

export function beatMatches(b: StoryBeat, f: BeatFilter): boolean {
  if (f.threadIds?.length && !f.threadIds.includes(b.threadId)) return false;
  if (f.types?.length && !f.types.includes(b.type)) return false;
  if (f.statuses?.length && !f.statuses.includes(b.status)) return false;
  if (f.entryId && !beatEntryIds(b).includes(f.entryId)) return false;
  return true;
}
