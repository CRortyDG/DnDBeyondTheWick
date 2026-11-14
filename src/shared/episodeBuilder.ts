// The episode builder: story beats placed into run sheets, @mentions, the
// cast and props of an episode, and its prep checklist. All DM-ONLY: none of
// it is in a TV or player view.
//
//   @person/mags   @place/the-docks   @monster/pudding-gremlin   @flyer/rolf
//   @mags          (a short name works when only one thing has that slug)

import { entriesOf, entryScene, findRef, isStub, kindInfo, slugify } from "./discovery";
import { dayLabel, storyOf } from "./story";
import type { Beat, Entry, Episode, Flyer, GameState, Job, MonsterTemplate, Story, StoryBeat, StoryBlock } from "./types";

type G = Pick<GameState, "entries" | "scenes" | "flyers" | "items" | "sessions"> & Partial<Pick<GameState, "jobs" | "monsters" | "story" | "episodes" | "leads">>;

// ---------------------------------------------------------------------------
// Placements and status

export interface Placement {
  episode: Episode;
  beat: Beat;
  block: StoryBlock;
}

export function placementsOf(g: Pick<GameState, "episodes">, storyBeatId: string): Placement[] {
  const out: Placement[] = [];
  for (const episode of g.episodes ?? []) for (const beat of episode.beats) for (const block of beat.stories ?? []) if (block.storyBeatId === storyBeatId) out.push({ episode, beat, block });
  return out;
}

/** Where a beat is waiting to be played (placed, not ticked yet). */
export function pendingPlacement(g: Pick<GameState, "episodes">, storyBeatId: string): Placement | undefined {
  return placementsOf(g, storyBeatId).find((p) => !p.block.done);
}

/**
 * Planned / Placed / Played follow from the run sheets and the plays; only
 * Dropped is set by hand. Run after anything that changes episodes or beats.
 */
export function syncStoryStatus(g: Pick<GameState, "episodes" | "story">): void {
  const st = g.story;
  if (!st) return;
  const pending = new Set<string>();
  for (const ep of g.episodes ?? []) for (const b of ep.beats) for (const x of b.stories ?? []) if (!x.done) pending.add(x.storyBeatId);
  for (const b of st.beats) {
    if (b.status === "dropped") continue;
    b.status = !b.repeat && b.plays.length ? "played" : pending.has(b.id) ? "placed" : "planned";
  }
}

/** The planned session date an episode sits on, if any. */
export function episodeDate(st: Story, episodeId: string): string | undefined {
  return st.dates.filter((d) => !d.cancelled && d.episodeId === episodeId).sort((a, b) => a.date.localeCompare(b.date))[0]?.date;
}

/** The run-sheet beat "Story beats" at the end of an episode, where beats go when you don't pick one. */
export const STORY_SECTION = "Story beats";

// ---------------------------------------------------------------------------
// @mentions

/** "@person/mags", "@flyer/rolf", "@mags". Not inside an email address. */
export const MENTION_RE = /(?<![\w@./])@([a-z][a-z-]{1,23}\/[a-z0-9][a-z0-9-]{0,39}|[a-z0-9][a-z0-9-]{1,39})(?![\w/-])/g;

export type MentionKind = "entry" | "job" | "flyer" | "template";

export interface Mention {
  /** The full form: "person/mags", "flyer/rolf", "monster/pudding-gremlin". */
  ref: string;
  kind: MentionKind;
  label: string;
  /** "People", "Flyers", "Monsters"... */
  group: string;
  entry?: Entry;
  job?: Job;
  flyer?: Flyer;
  template?: MonsterTemplate;
}

const firstName = (t: string) => slugify(t.split(/[,(]/)[0].trim().split(/\s+/)[0] ?? "");

/** A short name for every job and player flyer: the poster's first name, else the title. */
export function flyerSlugs(g: Pick<GameState, "flyers"> & Partial<Pick<GameState, "jobs">>): Map<string, string> {
  const out = new Map<string, string>();
  const taken = new Set<string>();
  const add = (id: string, wants: string[]) => {
    for (const w of wants) {
      if (w && w !== "x" && !taken.has(w)) {
        taken.add(w);
        out.set(id, w);
        return;
      }
    }
    const base = wants.find((w) => w && w !== "x") ?? "flyer";
    let n = 2;
    while (taken.has(`${base}-${n}`)) n++;
    taken.add(`${base}-${n}`);
    out.set(id, `${base}-${n}`);
  };
  for (const j of g.jobs ?? []) add(j.id, [firstName(j.postedBy), slugify(j.title)]);
  for (const f of g.flyers) add(f.id, [firstName(f.signedBy), slugify(f.title)]);
  return out;
}

const templateSlug = (m: Pick<MonsterTemplate, "name">) => slugify(m.name);

function entryMention(e: Entry): Mention {
  return { ref: `${e.kind}/${e.slug}`, kind: "entry", label: e.name, group: kindInfo(e.kind).plural, entry: e };
}

/** What "@token" means, or null. */
export function resolveMention(g: G, token: string): Mention | null {
  const t = token.trim().toLowerCase().replace(/^@/, "");
  const slugs = flyerSlugs(g);
  const [head, slug] = t.includes("/") ? t.split("/") : [null, t];
  if (head === "flyer") {
    const id = [...slugs].find(([, s]) => s === slug)?.[0];
    const job = (g.jobs ?? []).find((j) => j.id === id);
    if (job) return { ref: `flyer/${slug}`, kind: "job", label: job.title, group: "Flyers", job };
    const flyer = g.flyers.find((f) => f.id === id);
    return flyer ? { ref: `flyer/${slug}`, kind: "flyer", label: flyer.title, group: "Flyers", flyer } : null;
  }
  if (head) {
    const hit = findRef(g, `${head}/${slug}`);
    if (hit) return entryMention(hit.entry);
    if (head === "monster") {
      const template = (g.monsters ?? []).find((m) => templateSlug(m) === slug);
      if (template) return { ref: `monster/${slug}`, kind: "template", label: template.name, group: "Monsters", template };
    }
    return null;
  }
  // A short name: only when exactly one thing has it.
  const all: Mention[] = [
    ...entriesOf(g).filter((e) => e.slug === slug).map(entryMention),
    ...(g.monsters ?? []).filter((m) => templateSlug(m) === slug && !entriesOf(g).some((e) => e.kind === "monster" && e.slug === slug)).map((template): Mention => ({ ref: `monster/${slug}`, kind: "template", label: template.name, group: "Monsters", template })),
  ];
  for (const s of slugs.values()) {
    const m = s === slug ? resolveMention(g, `flyer/${s}`) : null;
    if (m) all.push(m);
  }
  return all.length === 1 ? all[0] : null;
}

/** Everything @mentioned in some text, in order (each once). Unknown names come back as { ref, missing }. */
export function mentionsIn(g: G, text: string): { token: string; mention: Mention | null }[] {
  const out: { token: string; mention: Mention | null }[] = [];
  const seen = new Set<string>();
  for (const m of text.matchAll(MENTION_RE)) {
    const token = m[1];
    const mention = resolveMention(g, token);
    const key = mention?.ref ?? token;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ token, mention });
  }
  return out;
}

/** The finder for "@": what matches what the DM typed, best first. */
export function findMentions(g: G, query: string, limit = 8): Mention[] {
  const q = query.toLowerCase().replace(/^@/, "");
  const slugs = flyerSlugs(g);
  const all: Mention[] = [
    ...entriesOf(g).map(entryMention),
    ...(g.monsters ?? []).filter((m) => !entriesOf(g).some((e) => e.kind === "monster" && e.templateId === m.id)).map((template): Mention => ({ ref: `monster/${templateSlug(template)}`, kind: "template", label: template.name, group: "Monster templates", template })),
    ...(g.jobs ?? []).map((job): Mention => ({ ref: `flyer/${slugs.get(job.id)}`, kind: "job", label: job.title, group: "Flyers", job })),
    ...g.flyers.map((flyer): Mention => ({ ref: `flyer/${slugs.get(flyer.id)}`, kind: "flyer", label: flyer.title, group: "Flyers", flyer })),
  ];
  if (!q) return all.slice(0, limit);
  const score = (m: Mention) => {
    const label = m.label.toLowerCase();
    const slug = m.ref.split("/").pop()!;
    if (slug.startsWith(q) || m.ref.startsWith(q)) return 0;
    if (label.startsWith(q)) return 1;
    if (label.split(/\s+/).some((w) => w.startsWith(q))) return 2;
    if (label.includes(q) || m.ref.includes(q)) return 3;
    if (m.job && m.job.postedBy.toLowerCase().includes(q)) return 3;
    return 9;
  };
  return all
    .map((m) => ({ m, s: score(m) }))
    .filter((x) => x.s < 9)
    .sort((a, b) => a.s - b.s)
    .slice(0, limit)
    .map((x) => x.m);
}

/** All of a beat's words. */
export function beatWords(b: Pick<Beat, "title" | "readAloud" | "notes" | "checks" | "branches">): string {
  return [b.title, ...(b.readAloud ?? []), ...b.notes, ...b.checks.flatMap((c) => [c.what, c.fail ?? "", c.success ?? ""]), ...b.branches.flatMap((x) => [x.when, x.then])].join("\n");
}

/** Text with its mentions split out, for drawing chips. */
export function splitMentions(text: string): ({ text: string } | { token: string })[] {
  const out: ({ text: string } | { token: string })[] = [];
  let at = 0;
  for (const m of text.matchAll(MENTION_RE)) {
    if (m.index! > at) out.push({ text: text.slice(at, m.index) });
    out.push({ token: m[1] });
    at = m.index! + m[0].length;
  }
  if (at < text.length) out.push({ text: text.slice(at) });
  return out;
}

// ---------------------------------------------------------------------------
// Cast and props

export interface CastItem {
  key: string;
  group: string;
  label: string;
  /** Where it comes from: "@mention", "show", "fight", "story beat". */
  from: string[];
  entry?: Entry;
  job?: Job;
  flyer?: Flyer;
  template?: MonsterTemplate;
  /** A fight: line with no template of that name. */
  missingTemplate?: boolean;
}

export const CAST_GROUPS = ["People", "Places", "Shops", "Monsters", "Flyers", "Mysteries", "Factions", "Items", "Maps & props"];

export function castOf(g: G, ep: Episode): CastItem[] {
  const st = storyOf(g);
  const items = new Map<string, CastItem>();
  const add = (key: string, base: Omit<CastItem, "key" | "from">, from: string) => {
    const it = items.get(key) ?? { key, from: [], ...base };
    if (!it.from.includes(from)) it.from.push(from);
    items.set(key, it);
  };
  const addEntry = (e: Entry, from: string) => add(`entry:${e.id}`, { group: kindInfo(e.kind).plural, label: e.name, entry: e }, from);
  const addMention = (m: Mention, from: string) => {
    if (m.entry) addEntry(m.entry, from);
    else if (m.job) add(`job:${m.job.id}`, { group: "Flyers", label: m.job.title, job: m.job }, from);
    else if (m.flyer) add(`flyer:${m.flyer.id}`, { group: "Flyers", label: m.flyer.title, flyer: m.flyer }, from);
    else if (m.template) add(`template:${m.template.id}`, { group: "Monsters", label: m.template.name, template: m.template }, from);
  };
  for (const b of ep.beats) {
    for (const { mention } of mentionsIn(g, beatWords(b))) if (mention) addMention(mention, "@mention");
    for (const a of b.actions) {
      if (a.type === "show" || a.type === "reveal" || a.type === "fact") {
        const hit = findRef(g, a.type === "fact" ? a.ref : a.ref.split("/").slice(0, 2).join("/"));
        if (hit) addEntry(hit.entry, a.type === "show" ? "show" : "reveal");
        else if (a.type === "show" && (a.ref.startsWith("map/") || a.ref.startsWith("prop/"))) add(`ref:${a.ref.split("/").slice(0, 2).join("/")}`, { group: "Maps & props", label: a.ref }, "show");
      } else if (a.type === "fight") {
        for (const m of a.monsters) {
          const t = (g.monsters ?? []).find((x) => x.name.trim().toLowerCase() === m.name.trim().toLowerCase());
          if (t) add(`template:${t.id}`, { group: "Monsters", label: t.name, template: t }, "fight");
          else add(`fight:${slugify(m.name)}`, { group: "Monsters", label: m.name, missingTemplate: true }, "fight");
        }
      }
    }
    for (const block of b.stories ?? []) {
      const sb = st.beats.find((x) => x.id === block.storyBeatId);
      for (const l of sb?.links ?? []) {
        const from = "story beat";
        if (l.kind === "entry" || l.kind === "fact") {
          const e = entriesOf(g).find((x) => x.id === (l.kind === "entry" ? l.id : l.entryId));
          if (e) addEntry(e, from);
        } else if (l.kind === "job") {
          const j = (g.jobs ?? []).find((x) => x.id === l.id);
          if (j) add(`job:${j.id}`, { group: "Flyers", label: j.title, job: j }, from);
        } else if (l.kind === "flyer") {
          const f = g.flyers.find((x) => x.id === l.id);
          if (f) add(`flyer:${f.id}`, { group: "Flyers", label: f.title, flyer: f }, from);
        } else if (l.kind === "monster") {
          const t = (g.monsters ?? []).find((x) => x.id === l.id);
          if (t) add(`template:${t.id}`, { group: "Monsters", label: t.name, template: t }, from);
        } else if (l.kind === "item") {
          const it = g.items.find((x) => x.id === l.id);
          if (it) add(`item:${it.id}`, { group: "Items", label: it.name }, from);
        }
      }
    }
  }
  // A monster entry and its template are one thing.
  for (const it of [...items.values()]) {
    if (it.entry?.kind === "monster" && it.entry.templateId) {
      const tk = `template:${it.entry.templateId}`;
      const t = items.get(tk);
      if (t) {
        it.from.push(...t.from.filter((f) => !it.from.includes(f)));
        items.delete(tk);
      }
    }
  }
  const order = (x: CastItem) => (CAST_GROUPS.indexOf(x.group) + 1 || 99);
  return [...items.values()].sort((a, b) => order(a) - order(b) || a.label.localeCompare(b.label));
}

// ---------------------------------------------------------------------------
// The prep checklist

export interface PrepItem {
  /** Stable, so ticks and dismissals stick. */
  key: string;
  text: string;
}

const jobLabel = (j: Job) => {
  const who = j.postedBy.split(/[,(]/)[0].trim().split(/\s+/)[0];
  return who ? `${who}'s flyer` : `“${j.title}”`;
};

/** What still needs doing before this episode is run. Ticks and dismissals are in ep.prep. */
export function prepOf(g: G, ep: Episode): PrepItem[] {
  const st = storyOf(g);
  const out: PrepItem[] = [];
  const push = (key: string, text: string) => {
    if (!out.some((x) => x.key === key)) out.push({ key, text });
  };
  const cast = castOf(g, ep);
  for (const c of cast) {
    const e = c.entry;
    if (e) {
      if (isStub(e)) push(`stub:${e.id}`, `${e.name} is a stub. Fill in their ${kindInfo(e.kind).label.toLowerCase()} entry.`);
      if (!isStub(e) && (e.kind === "person" || e.kind === "monster") && !entryScene(g, e)?.art?.url && !entryScene(g, e)?.art?.builtin) push(`portrait:${e.id}`, `${e.name} has no ${e.kind === "person" ? "portrait" : "picture"}.`);
      if (e.kind === "monster" && !(e.templateId && (g.monsters ?? []).some((m) => m.id === e.templateId))) push(`template:${e.id}`, `${e.name} is mentioned but has no monster template.`);
    }
    if (c.missingTemplate) push(`template:${c.key}`, `${c.label} is in a fight but has no monster template.`);
    if (c.job && !c.job.pinned) push(`pin:${c.job.id}`, `${jobLabel(c.job)} isn't pinned.`);
    if (c.flyer && !c.flyer.up) push(`pin:${c.flyer.id}`, `The flyer “${c.flyer.title}” isn't up on the board.`);
  }
  for (const b of ep.beats) {
    for (const { token, mention } of mentionsIn(g, beatWords(b))) if (!mention) push(`unknown:${token}`, `“@${token}” in “${b.title}” doesn't match anything. Make it, or fix the name.`);
  }
  const date = episodeDate(st, ep.id);
  const placedHere: string[] = [];
  for (const b of ep.beats) {
    for (const block of b.stories ?? []) {
      const sb = st.beats.find((x) => x.id === block.storyBeatId);
      if (!sb) continue;
      if (!block.done) {
        for (const depId of sb.after) {
          const dep = st.beats.find((x) => x.id === depId);
          if (!dep || dep.status === "dropped" || dep.plays.length || placedHere.includes(dep.id)) continue;
          push(`after:${sb.id}:${dep.id}`, `Beat “${sb.title}” must come after “${dep.title}” (not played yet).`);
        }
        if (sb.by && date && date > sb.by) push(`by:${sb.id}`, `“${sb.title}” must happen by ${dayLabel(sb.by)}, but this episode is on ${dayLabel(date)}.`);
      }
      placedHere.push(sb.id);
      if (sb.type === "reveal" && !sb.links.some((l) => l.kind === "fact")) push(`fact:${sb.id}`, `“${sb.title}” is a reveal, but the fact it reveals isn't written yet.`);
      if (/\bTBD\b/.test(`${sb.summary} ${sb.dmNotes}`)) push(`tbd:${sb.id}`, `“${sb.title}” still has a TBD. Decide it before the session.`);
    }
  }
  return out;
}

export function storyBeatOf(st: Story, id: string): StoryBeat | undefined {
  return st.beats.find((b) => b.id === id);
}
