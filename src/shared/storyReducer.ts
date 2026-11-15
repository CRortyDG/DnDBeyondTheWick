// The storyboard's commands. All DM-only (none start with "me."), and they
// only ever touch GameState.story, which no TV or player view copies.

import type { Command } from "./commands";
import type { GameState, Story, StoryBeat, StoryLink, StoryThread } from "./types";
import { entriesOf } from "./discovery";
import { BEATS_MAX, DATES_MAX, THREAD_COLORS, THREADS_MAX, datesFrom, emptyStory, ensureBackstory, isDay, makesLoop } from "./story";

export type StoryCommand = Extract<Command, { type: `story.${string}` }>;

export function isStoryCommand(cmd: Command): cmd is StoryCommand {
  return cmd.type.startsWith("story.");
}

export interface StoryHelpers {
  now: number;
  nextId: (prefix: string) => string;
  fail: (msg: string, code?: string) => never;
}

const line = (t: string) => t.replace(/\s+/g, " ").trim();

/** Returns the id of anything it made (a thread or a beat). */
export function applyStory(s: GameState, cmd: StoryCommand, h: StoryHelpers): string | undefined {
  const { fail } = h;
  const st: Story = (s.story ??= emptyStory());
  ensureBackstory(st, s.players);

  const thread = (id: string): StoryThread => st.threads.find((t) => t.id === id) ?? fail("That thread isn't there any more.");
  const beat = (id: string): StoryBeat => st.beats.find((b) => b.id === id) ?? fail("That story beat isn't there any more.");
  const checkLinks = (links: StoryLink[]): StoryLink[] => {
    const seen = new Set<string>();
    const out: StoryLink[] = [];
    for (const l of links) {
      const key = l.kind === "fact" ? `fact:${l.entryId}/${l.factId}` : `${l.kind}:${l.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const ok =
        l.kind === "entry"
          ? entriesOf(s).some((e) => e.id === l.id)
          : l.kind === "fact"
            ? entriesOf(s).some((e) => e.id === l.entryId && e.facts.some((f) => f.id === l.factId))
            : l.kind === "job"
              ? (s.jobs ?? []).some((j) => j.id === l.id)
              : l.kind === "flyer"
                ? s.flyers.some((f) => f.id === l.id)
                : l.kind === "lead"
                  ? (s.leads ?? []).some((x) => x.id === l.id)
                  : l.kind === "item"
                    ? s.items.some((i) => i.id === l.id)
                    : (s.monsters ?? []).some((m) => m.id === l.id);
      if (!ok) fail("One of those links isn't there any more.");
      out.push(l);
    }
    return out;
  };
  const checkAfter = (b: Pick<StoryBeat, "id">, after: string[]): string[] => {
    const out = [...new Set(after)];
    for (const id of out) {
      if (id === b.id) fail("A beat can't come after itself.");
      beat(id);
      if (makesLoop(st, b.id, id)) fail("That would make a loop: each beat would have to come after the other.");
    }
    return out;
  };
  const checkBy = (by: string | null | undefined) => {
    if (by && !isDay(by)) fail("That date doesn't exist.");
  };

  switch (cmd.type) {
    case "story.threadAdd": {
      if (st.threads.length >= THREADS_MAX) fail("That's a lot of threads. Remove one first.");
      const t: StoryThread = {
        id: h.nextId("th"),
        name: line(cmd.thread.name),
        color: cmd.thread.color ?? THREAD_COLORS[st.threads.length % THREAD_COLORS.length],
        description: cmd.thread.description?.trim() ?? "",
        goal: cmd.thread.goal?.trim() ?? "",
        kind: cmd.thread.kind === "backstory" ? "side" : (cmd.thread.kind ?? "side"),
      };
      if (!t.name) fail("Name the thread.");
      st.threads.push(t);
      return t.id;
    }
    case "story.threadUpdate": {
      const t = thread(cmd.threadId);
      const p = cmd.patch;
      if (p.name !== undefined) t.name = line(p.name) || t.name;
      if (p.color !== undefined) t.color = p.color;
      if (p.description !== undefined) t.description = p.description.trim();
      if (p.goal !== undefined) t.goal = p.goal.trim();
      if (p.kind !== undefined) {
        if ((p.kind === "backstory") !== (t.kind === "backstory")) fail("Backstory lanes come from the player list.");
        t.kind = p.kind;
      }
      return;
    }
    case "story.threadRemove": {
      const t = thread(cmd.threadId);
      if (t.kind === "backstory" && s.players.some((p) => p.id === t.playerId && !p.archived)) fail("Backstory lanes stay while the player is at the table.");
      const mine = st.beats.filter((b) => b.threadId === t.id);
      if (mine.length) {
        if (!cmd.moveTo) fail("Move or remove its beats first.");
        if (cmd.moveTo === t.id) fail("Pick another thread for its beats.");
        const to = thread(cmd.moveTo!);
        for (const b of mine) b.threadId = to.id;
      }
      st.threads = st.threads.filter((x) => x.id !== t.id);
      return;
    }
    case "story.threadMove": {
      const i = st.threads.findIndex((x) => x.id === cmd.threadId);
      if (i < 0) fail("That thread isn't there any more.");
      const j = i + cmd.dir;
      if (j >= 0 && j < st.threads.length) [st.threads[i], st.threads[j]] = [st.threads[j], st.threads[i]];
      return;
    }

    case "story.beatAdd": {
      if (st.beats.length >= BEATS_MAX) fail("That's a lot of beats. Remove some first.");
      const f = cmd.beat;
      thread(f.threadId);
      checkBy(f.by);
      const b: StoryBeat = {
        id: h.nextId("sb"),
        threadId: f.threadId,
        title: line(f.title),
        summary: f.summary?.trim() ?? "",
        dmNotes: f.dmNotes?.trim() ?? "",
        type: f.type ?? "clue",
        links: [],
        after: [],
        status: "planned",
        plays: [],
        createdAt: h.now,
      };
      if (!b.title) fail("Name the beat.");
      if (f.window) b.window = f.window;
      if (f.by) b.by = f.by;
      if (f.repeat) b.repeat = true;
      if (f.anywhere) b.anywhere = true;
      b.links = checkLinks(f.links ?? []);
      b.after = checkAfter(b, f.after ?? []);
      st.beats.push(b);
      return b.id;
    }
    case "story.beatUpdate": {
      const b = beat(cmd.beatId);
      const p = cmd.patch;
      if (p.threadId !== undefined) b.threadId = thread(p.threadId).id;
      if (p.title !== undefined) b.title = line(p.title) || b.title;
      if (p.summary !== undefined) b.summary = p.summary.trim();
      if (p.dmNotes !== undefined) b.dmNotes = p.dmNotes.trim();
      if (p.type !== undefined) b.type = p.type;
      if (p.window !== undefined) {
        if (p.window) b.window = p.window;
        else delete b.window;
      }
      if (p.by !== undefined) {
        checkBy(p.by);
        if (p.by) b.by = p.by;
        else delete b.by;
      }
      if (p.links !== undefined) b.links = checkLinks(p.links);
      if (p.anywhere !== undefined) {
        if (p.anywhere) b.anywhere = true;
        else delete b.anywhere;
      }
      if (p.after !== undefined) b.after = checkAfter(b, p.after);
      if (p.repeat !== undefined) {
        if (p.repeat) b.repeat = true;
        else delete b.repeat;
        if (p.repeat && b.status === "played") b.status = "planned";
        if (!p.repeat && b.status === "planned" && b.plays.length) b.status = "played";
      }
      return;
    }
    case "story.beatDuplicate": {
      if (st.beats.length >= BEATS_MAX) fail("That's a lot of beats. Remove some first.");
      const src = beat(cmd.beatId);
      const copy: StoryBeat = {
        ...structuredClone(src),
        id: h.nextId("sb"),
        title: `${src.title} (version 2)`.slice(0, 160),
        status: "planned",
        plays: [],
        variantOf: src.variantOf ?? src.id,
        createdAt: h.now,
      };
      st.beats.splice(st.beats.indexOf(src) + 1, 0, copy);
      return copy.id;
    }
    case "story.beatRemove": {
      const b = beat(cmd.beatId);
      st.beats = st.beats.filter((x) => x.id !== b.id);
      // Out of every run sheet too.
      for (const ep of s.episodes ?? [])
        for (const rb of ep.beats) {
          if (!rb.stories) continue;
          rb.stories = rb.stories.filter((x) => x.storyBeatId !== b.id);
          if (!rb.stories.length) delete rb.stories;
        }
      for (const x of st.beats) {
        x.after = x.after.filter((id) => id !== b.id);
        if (x.variantOf === b.id) delete x.variantOf;
      }
      return;
    }
    case "story.beatStatus": {
      const b = beat(cmd.beatId);
      if (cmd.status === "played") {
        b.plays.push({ at: h.now, sessionId: s.currentSessionId, outcome: line(cmd.outcome ?? "") });
        b.status = b.repeat ? "planned" : "played";
      } else if (cmd.status === "planned") {
        // Un-ticking a played beat takes back its last play.
        if (b.status === "played") b.plays.pop();
        b.status = "planned";
      } else b.status = "dropped";
      return;
    }
    case "story.playOutcome": {
      const b = beat(cmd.beatId);
      const p = b.plays[cmd.index] ?? fail("That play isn't there any more.");
      p.outcome = line(cmd.outcome);
      return;
    }

    case "story.dateAdd": {
      if (!isDay(cmd.date)) fail("That date doesn't exist.");
      if (st.dates.length >= DATES_MAX) fail("That's a lot of session dates. Remove some first.");
      if (st.dates.some((d) => d.date === cmd.date && !d.cancelled)) fail("There's already a session that day.");
      const d = { id: h.nextId("sd"), date: cmd.date };
      st.dates.push(d);
      st.dates.sort((a, b) => a.date.localeCompare(b.date));
      return d.id;
    }
    case "story.dateUpdate": {
      const d = st.dates.find((x) => x.id === cmd.dateId) ?? fail("That session date isn't there any more.");
      if (cmd.date !== undefined) {
        if (!isDay(cmd.date)) fail("That date doesn't exist.");
        if (st.dates.some((x) => x !== d && x.date === cmd.date && !x.cancelled)) fail("There's already a session that day.");
        d.date = cmd.date;
        st.dates.sort((a, b) => a.date.localeCompare(b.date));
      }
      if (cmd.cancelled !== undefined) {
        if (cmd.cancelled) d.cancelled = true;
        else delete d.cancelled;
      }
      if (cmd.episodeId !== undefined) {
        if (cmd.episodeId) d.episodeId = ((s.episodes ?? []).find((e) => e.id === cmd.episodeId) ?? fail("That episode doesn't exist.")).id;
        else delete d.episodeId;
      }
      return;
    }
    case "story.dateRemove": {
      st.dates = st.dates.filter((x) => x.id !== cmd.dateId);
      return;
    }
    case "story.datesGenerate": {
      if (!isDay(cmd.start)) fail("That date doesn't exist.");
      const have = new Set(st.dates.map((d) => d.date));
      let n = 0;
      for (const date of datesFrom(cmd.start, cmd.every)) {
        if (have.has(date)) continue;
        if (st.dates.length >= DATES_MAX) break;
        st.dates.push({ id: h.nextId("sd"), date });
        n++;
      }
      if (!n) fail("Those dates are all there already.");
      st.dates.sort((a, b) => a.date.localeCompare(b.date));
      return;
    }
    case "story.board": {
      if (cmd.zoom) st.zoom = cmd.zoom;
      if (cmd.festivals !== undefined) st.festivals = cmd.festivals;
      return;
    }
  }
}
