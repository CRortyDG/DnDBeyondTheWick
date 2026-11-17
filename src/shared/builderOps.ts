// What an approved Worldbuilder draft becomes. The server builds these from
// stored drafts when the DM presses Approve; the reducer runs each one through
// the same command the DM would use by hand (see builderApply in reducer.ts).
//
// Also: which fields a suggested change may touch, and how to read a field's
// current value (for the before/after diff and the "changed since" check).

import type { MonsterBody } from "./bulkImport";
import type { GameState, MadeBy, Stage, StoryBeatType, StoryThreadKind, TableDie, TableKind } from "./types";
import { entriesOf } from "./discovery";
import { storyOf } from "./story";
import { monstersOf } from "./combat";
import { jobsOf } from "./renown";
import { noticesOf } from "./board";
import { tablesOf } from "./tables";

/** A thing that's already in the game (id) or another draft approved in the same go (draft). */
export type BuilderRef = { id: string } | { draft: string };

export type SuggestType = "entry" | "fact" | "beat" | "thread" | "monster" | "job" | "notice" | "table";

export interface SuggestTarget {
  type: SuggestType;
  id: string;
  /** Facts: the entry it's on. */
  entryId?: string;
}

/** The plain text fields a suggestion may change. Never stage, relation, status, prices, rewards, Renown, links or parties. */
export const SUGGEST_FIELDS: Record<SuggestType, readonly string[]> = {
  entry: ["name", "title", "summary", "nickname", "hint", "dmNote", "secrets", "areas", "wants", "knows", "voice"],
  fact: ["text"],
  beat: ["title", "summary", "dmNotes"],
  thread: ["description", "goal"],
  monster: ["notes", "dmNote"],
  job: ["title", "body", "postedBy", "dm.adventure", "dm.loot", "dm.twists", "dm.notes"],
  notice: ["title", "body", "sign", "dmNote"],
  table: ["rows"],
};

export interface EntryDraftBody {
  kind: string;
  name: string;
  title?: string;
  summary?: string;
  nickname?: string;
  hint?: string;
  areas?: string[];
  dmNote?: string;
  secrets?: string;
  wants?: string;
  knows?: string;
  voice?: string;
  facts?: string[];
  /** Places: a room at an inn. */
  room?: import("./types").RoomInfo;
}
export interface ThreadDraftBody {
  name: string;
  description?: string;
  goal?: string;
  kind?: Exclude<StoryThreadKind, "backstory">;
}
export interface BeatDraftBody {
  thread: string;
  title: string;
  summary?: string;
  dmNotes?: string;
  type?: StoryBeatType;
  window?: { from: string; to: string } | "anytime";
}
export interface FlyerDraftBody {
  /** job: a bounty flyer; notice: a plain note. Both go in unpinned. */
  board: "job" | "notice";
  title: string;
  body?: string;
  postedBy?: string;
  rewardGp?: number;
  rewardKind?: "each" | "total" | "hidden";
  renown?: number;
  renownPoints?: number;
  dm?: { adventure?: string; loot?: string; twists?: string; notes?: string };
  dmNote?: string;
}
export interface TableDraftBody {
  name: string;
  die: TableDie;
  kind: TableKind;
  rows: { from?: number; to?: number; text: string }[];
  areas?: string[];
  dmNote?: string;
}

type OpBody =
  | { kind: "entry"; entry: EntryDraftBody; stage: Stage }
  | { kind: "fact"; entry: BuilderRef; text: string }
  | { kind: "link"; a: BuilderRef; b: BuilderRef }
  | { kind: "thread"; thread: ThreadDraftBody }
  | { kind: "beat"; thread: BuilderRef; beat: Omit<BeatDraftBody, "thread"> }
  | { kind: "flyer"; flyer: FlyerDraftBody }
  | { kind: "monster"; monster: MonsterBody }
  | { kind: "table"; table: TableDraftBody }
  | { kind: "suggestion"; target: SuggestTarget; field: string; before: unknown; value: unknown }
  /** A picture the builder uploaded, for an entry (one in the game or one approved alongside). */
  | { kind: "picture"; entry: BuilderRef; url: string; alt?: string };

export type BuilderOp = { draft: string; label: string } & OpBody;

/** Everything in the game that came from a draft, by draft id. An approve skips what's already here. */
export function madeIndex(g: GameState): Map<string, { type: string; id: string }> {
  const out = new Map<string, { type: string; id: string }>();
  const add = (type: string, id: string, m?: MadeBy) => {
    // An entry and the facts it came with share a draft: the entry wins.
    if (m?.draft && !out.has(m.draft)) out.set(m.draft, { type, id });
  };
  for (const e of entriesOf(g)) {
    add("entry", e.id, e.madeBy);
    for (const f of e.facts) add("fact", f.id, f.madeBy);
  }
  const st = storyOf(g);
  for (const t of st.threads) add("thread", t.id, t.madeBy);
  for (const b of st.beats) add("beat", b.id, b.madeBy);
  for (const j of jobsOf(g)) add("job", j.id, j.madeBy);
  for (const n of noticesOf(g)) add("notice", n.id, n.madeBy);
  for (const m of monstersOf(g)) add("monster", m.id, m.madeBy);
  for (const t of tablesOf(g)) add("table", t.id, t.madeBy);
  return out;
}

/** The thing a suggestion points at, or undefined if it's gone. */
export function suggestTargetOf(g: GameState, t: SuggestTarget): Record<string, unknown> | undefined {
  switch (t.type) {
    case "entry":
      return entriesOf(g).find((e) => e.id === t.id) as unknown as Record<string, unknown> | undefined;
    case "fact": {
      const e = entriesOf(g).find((x) => x.id === t.entryId);
      return e?.facts.find((f) => f.id === t.id) as unknown as Record<string, unknown> | undefined;
    }
    case "beat":
      return storyOf(g).beats.find((b) => b.id === t.id) as unknown as Record<string, unknown> | undefined;
    case "thread":
      return storyOf(g).threads.find((x) => x.id === t.id) as unknown as Record<string, unknown> | undefined;
    case "monster":
      return monstersOf(g).find((m) => m.id === t.id) as unknown as Record<string, unknown> | undefined;
    case "job":
      return jobsOf(g).find((j) => j.id === t.id) as unknown as Record<string, unknown> | undefined;
    case "notice":
      return noticesOf(g).find((n) => n.id === t.id) as unknown as Record<string, unknown> | undefined;
    case "table":
      return tablesOf(g).find((x) => x.id === t.id) as unknown as Record<string, unknown> | undefined;
  }
}

/** A field's value now ("dm.loot" reads job.dm.loot). Missing text reads as "". undefined: the target is gone. */
export function currentValue(g: GameState, t: SuggestTarget, field: string): unknown {
  const obj = suggestTargetOf(g, t);
  if (!obj) return undefined;
  const [a, b] = field.split(".");
  const v = b ? (obj[a] as Record<string, unknown> | undefined)?.[b] : obj[a];
  if (v === undefined) return field === "areas" ? [] : "";
  return structuredClone(v);
}

export function sameValue(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
