// The Worldbuilder's inputs: one strict schema per write tool, text cleaning,
// and how a stored draft becomes an approve op (builderOps.ts).
//
// Drafts are stored as the tool input that made them (snake_case), so editing a
// draft (by the builder or the DM) re-checks it against the same schema.

import { z } from "zod";
import { monsterBody } from "./combatSchema";
import { AREAS_MAX, DM_TEXT_MAX, FACT_MAX, HINT_MAX, NAME_MAX, PERSON_NOTE_MAX, SUMMARY_MAX, TITLE_MAX } from "./discovery";
import { BEAT_TYPE_IDS, MONTH_RE } from "./story";
import { fillRanges, TABLE_DICE, TABLE_KIND_IDS, TABLE_NAME_MAX, TABLE_ROW_MAX, TABLE_ROWS_MAX } from "./tables";
import { RENOWN_MAX } from "./renown";
import type { BuilderOp, BuilderRef, SuggestTarget } from "./builderOps";
import type { Stage } from "./types";

/** Everything a builder key can create. */
export const DRAFT_KINDS = ["entry", "fact", "link", "thread", "beat", "flyer", "monster", "table", "suggestion", "picture"] as const;
export type DraftKind = (typeof DRAFT_KINDS)[number];
export type DraftStatus = "pending" | "approved" | "rejected" | "withdrawn";

/** A stored draft or suggestion. body is the (cleaned, checked) tool input. */
export interface Draft {
  id: string;
  keyId: string;
  label: string;
  /** One worldbuilding chat (an MCP server run). */
  batch: string;
  kind: DraftKind;
  status: DraftStatus;
  body: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
  reviewedAt?: number;
  /** What it became, once approved. */
  resultId?: string;
}

/** A draft id: made by the server, never chosen by the builder. */
export const DRAFT_ID_RE = /^bd_[a-z0-9]{12}$/;
/** An id of something in the game. */
const gameId = z.string().regex(/^[A-Za-z0-9_-]{1,64}$/, "That isn't an id from this campaign.");
/** An id of something in the game, or of a pending draft. */
const refId = z.string().regex(/^[A-Za-z0-9_-]{1,64}$/, "Use an id from search, get_entry or a draft id.");

const txt = (max: number) => z.string().max(max, `Keep it under ${max} characters.`);
const line = (max: number) => txt(max).min(1, "This can't be empty.");
const areas = z.array(txt(40)).max(AREAS_MAX, `At most ${AREAS_MAX} areas.`);

/** Kinds of Discovery entry the builder may create. */
export const ENTRY_KINDS = ["person", "place", "shop", "monster", "mystery", "faction"] as const;

export const entryInput = z
  .object({
    kind: z.enum(ENTRY_KINDS),
    name: line(NAME_MAX),
    title: txt(TITLE_MAX).optional(),
    summary: txt(SUMMARY_MAX).optional(),
    nickname: txt(NAME_MAX).optional(),
    hint: txt(HINT_MAX).optional(),
    areas: areas.optional(),
    dm_note: txt(DM_TEXT_MAX).optional(),
    secret: txt(DM_TEXT_MAX).optional(),
    wants: txt(PERSON_NOTE_MAX).optional(),
    knows: txt(PERSON_NOTE_MAX).optional(),
    voice: txt(PERSON_NOTE_MAX).optional(),
    facts: z.array(line(FACT_MAX)).max(20, "At most 20 facts at once.").optional(),
  })
  .strict();

export const factInput = z.object({ entry: refId, text: line(FACT_MAX) }).strict();
export const linkInput = z.object({ a: refId, b: refId }).strict().refine((x) => x.a !== x.b, "Link two different entries.");
export const threadInput = z
  .object({ name: line(80), description: txt(600).optional(), goal: txt(300).optional(), kind: z.enum(["main", "side", "place"]).optional() })
  .strict();
const month = z.string().regex(MONTH_RE, "Months look like 2027-03.");
export const beatInput = z
  .object({
    thread: refId,
    title: line(160),
    summary: txt(2000).optional(),
    dm_notes: txt(4000).optional(),
    type: z.enum(BEAT_TYPE_IDS).optional(),
    window: z.union([z.object({ from: month, to: month }).strict().refine((r) => r.from <= r.to, "The window ends before it starts."), z.literal("anytime")]).optional(),
  })
  .strict();
export const flyerInput = z
  .object({
    board: z.enum(["job", "notice"]),
    title: line(80),
    body: txt(600).optional(),
    posted_by: txt(80).optional(),
    reward_gp: z.number().min(0).max(100_000).optional(),
    reward_kind: z.enum(["each", "total", "hidden"]).optional(),
    renown: z.number().int().min(0).max(RENOWN_MAX).optional(),
    renown_points: z.number().int().min(0).max(10).optional(),
    dm_adventure: txt(300).optional(),
    dm_loot: txt(1000).optional(),
    dm_twists: txt(1000).optional(),
    dm_notes: txt(2000).optional(),
  })
  .strict();
export const monsterInput = z
  .object({
    name: line(80),
    display_name: txt(80).optional(),
    ac: z.number().int().min(0).max(50),
    hp: z.string().regex(/^\s*(\d+|\d*d\d+(\s*[+-]\s*\d+)?)\s*$/i, 'HP is a number ("21") or dice ("6d6+6").'),
    init_bonus: z.number().int().min(-10).max(20).optional(),
    speed: txt(80).optional(),
    attacks: z.array(z.object({ name: line(80), bonus: z.number().int().min(-10).max(30), damage: txt(80) }).strict()).max(12).optional(),
    abilities: z
      .array(z.object({ name: line(80), text: txt(600), recharge: z.number().int().min(2).max(6).optional(), uses: z.number().int().min(1).max(9).optional(), on_death: z.boolean().optional() }).strict())
      .max(16)
      .optional(),
    resist: txt(200).optional(),
    immune: txt(200).optional(),
    notes: txt(2000).optional(),
    dm_note: txt(2000).optional(),
  })
  .strict();
export const tableInput = z
  .object({
    name: line(TABLE_NAME_MAX),
    die: z.literal(TABLE_DICE),
    kind: z.enum(TABLE_KIND_IDS),
    rows: z
      .array(z.object({ from: z.number().int().min(1).max(100).optional(), to: z.number().int().min(1).max(100).optional(), text: line(TABLE_ROW_MAX) }).strict())
      .min(1)
      .max(TABLE_ROWS_MAX, `At most ${TABLE_ROWS_MAX} rows.`),
    areas: areas.optional(),
    dm_note: txt(DM_TEXT_MAX).optional(),
  })
  .strict()
  .superRefine((t, ctx) => {
    const r = fillRanges(t.die, t.rows);
    if ("error" in r) ctx.addIssue({ code: "custom", message: r.error, path: ["rows"] });
  });
/** A suggestion: the value is checked against the field once the target is known (see suggestValue). */
export const suggestInput = z.object({ target_id: gameId, field: z.string().max(40), value: z.unknown(), reason: line(600) }).strict();

/** Stored suggestions also keep what they're based on. */
export interface SuggestionBody {
  target: SuggestTarget;
  target_name: string;
  field: string;
  before: unknown;
  value: unknown;
  reason: string;
}

/**
 * A picture draft's stored body. Built by the server from an upload (never sent
 * as JSON by the builder), so the url is always one of this campaign's own files.
 */
export interface PictureBody {
  entry: string;
  /** /api/files/<campaign>/<random>.<ext> */
  url: string;
  alt?: string;
  /** Stored size, for the review page. */
  bytes: number;
}
export const PICTURE_ALT_MAX = 300;

/** The schema for each kind's stored body (suggestions and pictures are built by the server). */
export const DRAFT_SCHEMAS = {
  entry: entryInput,
  fact: factInput,
  link: linkInput,
  thread: threadInput,
  beat: beatInput,
  flyer: flyerInput,
  monster: monsterInput,
  table: tableInput,
} as const;
export type CreatableKind = keyof typeof DRAFT_SCHEMAS;

/** How long a field's suggested value may be. */
const SUGGEST_MAX: Record<string, number> = {
  name: NAME_MAX,
  title: TITLE_MAX,
  summary: SUMMARY_MAX,
  nickname: NAME_MAX,
  hint: HINT_MAX,
  dmNote: DM_TEXT_MAX,
  secrets: DM_TEXT_MAX,
  wants: PERSON_NOTE_MAX,
  knows: PERSON_NOTE_MAX,
  voice: PERSON_NOTE_MAX,
  text: FACT_MAX,
  dmNotes: 4000,
  description: 600,
  goal: 300,
  notes: 2000,
  body: 800,
  postedBy: 80,
  sign: 80,
  "dm.adventure": 300,
  "dm.loot": 1000,
  "dm.twists": 1000,
  "dm.notes": 2000,
};

/** A suggestion's new value, checked for its field. Returns the value or an error. */
export function suggestValue(t: SuggestTarget & { die?: number }, field: string, value: unknown): { value: unknown } | { error: string } {
  if (field === "areas") {
    const r = areas.safeParse(value);
    return r.success ? { value: r.data } : { error: "areas is a list of up to 8 short names." };
  }
  if (field === "rows") {
    const r = tableInput.shape.rows.safeParse(value);
    if (!r.success) return { error: "rows is a list of { from, to, text }." };
    const f = fillRanges((t.die ?? 20) as never, r.data);
    return "error" in f ? { error: f.error } : { value: f.rows };
  }
  if (typeof value !== "string") return { error: `${field} is text.` };
  const max = (t.type === "job" && field === "body" ? 600 : SUGGEST_MAX[field]) ?? 600;
  if (value.length > max) return { error: `Keep ${field} under ${max} characters.` };
  if (["name", "title", "text"].includes(field) && !value.trim()) return { error: `${field} can't be empty.` };
  return { value };
}

// ---------------------------------------------------------------- cleaning

/** Control characters (but not tab or newline) and bidirectional overrides, which can make text read differently than it is. */
const BAD_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u202A-\u202E\u2066-\u2069\uFEFF]/g;

/** Every string in a value, cleaned. Line separators become newlines. */
export function cleanDeep<T>(v: T): T {
  if (typeof v === "string") return v.replace(/\r\n?|\u2028|\u2029/g, "\n").replace(BAD_CHARS, "") as T;
  if (Array.isArray(v)) return v.map(cleanDeep) as T;
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, cleanDeep(x)])) as T;
  return v;
}

/** zod's complaint in one plain sentence, without echoing what was sent. */
export function issueText(e: z.ZodError): string {
  const i = e.issues[0];
  if (!i) return "That request didn't make sense.";
  const where = i.path.length ? `${i.path.join(".")}: ` : "";
  if (i.code === "unrecognized_keys") return `${where}unknown field${i.keys.length > 1 ? "s" : ""} ${i.keys.join(", ")}.`;
  if (i.code === "invalid_type") return `${where}missing or the wrong type.`;
  return `${where}${i.message}`;
}

// ---------------------------------------------------------------- drafts to ops

/** The title the review queue and list_my_drafts show. */
export function draftTitle(d: Pick<Draft, "kind" | "body">): string {
  const b = d.body as Record<string, unknown>;
  const s = (x: unknown) => (typeof x === "string" ? x : "");
  switch (d.kind) {
    case "fact":
      return s(b.text).slice(0, 80);
    case "link":
      return "Link";
    case "picture":
      return "Picture";
    case "suggestion":
      return `${s(b.target_name)}: ${s(b.field)}`;
    default:
      return s(b.name) || s(b.title) || "Untitled";
  }
}

/** Ids a draft points at that may be other drafts. */
export function draftRefs(d: Pick<Draft, "kind" | "body">): string[] {
  const b = d.body as Record<string, string>;
  if (d.kind === "fact") return [b.entry];
  if (d.kind === "link") return [b.a, b.b];
  if (d.kind === "beat") return [b.thread];
  if (d.kind === "picture") return [b.entry];
  return [];
}

const ref = (id: string): BuilderRef => (DRAFT_ID_RE.test(id) ? { draft: id } : { id });

/** What an approved draft becomes. */
export function draftToOp(d: Draft, stage: Stage): BuilderOp {
  const head = { draft: d.id, label: d.label };
  switch (d.kind) {
    case "entry": {
      const b = d.body as z.infer<typeof entryInput>;
      return {
        ...head,
        kind: "entry",
        stage,
        entry: {
          kind: b.kind,
          name: b.name,
          title: b.title,
          summary: b.summary,
          nickname: b.nickname,
          hint: b.hint,
          areas: b.areas,
          dmNote: b.dm_note,
          secrets: b.secret,
          ...(b.kind === "person" ? { wants: b.wants, knows: b.knows, voice: b.voice } : {}),
          facts: b.facts,
        },
      };
    }
    case "fact": {
      const b = d.body as z.infer<typeof factInput>;
      return { ...head, kind: "fact", entry: ref(b.entry), text: b.text };
    }
    case "link": {
      const b = d.body as { a: string; b: string };
      return { ...head, kind: "link", a: ref(b.a), b: ref(b.b) };
    }
    case "thread": {
      const b = d.body as z.infer<typeof threadInput>;
      return { ...head, kind: "thread", thread: { name: b.name, description: b.description, goal: b.goal, kind: b.kind } };
    }
    case "beat": {
      const b = d.body as z.infer<typeof beatInput>;
      return { ...head, kind: "beat", thread: ref(b.thread), beat: { title: b.title, summary: b.summary, dmNotes: b.dm_notes, type: b.type, window: b.window } };
    }
    case "flyer": {
      const b = d.body as z.infer<typeof flyerInput>;
      return {
        ...head,
        kind: "flyer",
        flyer: {
          board: b.board,
          title: b.title,
          body: b.body,
          postedBy: b.posted_by,
          rewardGp: b.reward_gp,
          rewardKind: b.reward_kind,
          renown: b.renown,
          renownPoints: b.renown_points,
          dm: { adventure: b.dm_adventure, loot: b.dm_loot, twists: b.dm_twists, notes: b.dm_notes },
          dmNote: b.dm_notes,
        },
      };
    }
    case "monster": {
      const b = d.body as z.infer<typeof monsterInput>;
      const monster = monsterBody.parse({
        name: b.name,
        displayName: b.display_name ?? "",
        ac: b.ac,
        hp: b.hp,
        initBonus: b.init_bonus ?? 0,
        speed: b.speed ?? "30 ft.",
        attacks: b.attacks ?? [],
        abilities: (b.abilities ?? []).map((a) => ({ name: a.name, text: a.text, ...(a.recharge ? { recharge: a.recharge } : {}), ...(a.uses ? { uses: a.uses } : {}), ...(a.on_death ? { onDeath: true } : {}) })),
        resist: b.resist ?? "",
        immune: b.immune ?? "",
        notes: b.notes ?? "",
        dmNote: b.dm_note ?? "",
      });
      return { ...head, kind: "monster", monster };
    }
    case "table": {
      const b = d.body as z.infer<typeof tableInput>;
      return { ...head, kind: "table", table: { name: b.name, die: b.die, kind: b.kind, rows: b.rows, areas: b.areas, dmNote: b.dm_note } };
    }
    case "suggestion": {
      const b = d.body as unknown as SuggestionBody;
      return { ...head, kind: "suggestion", target: b.target, field: b.field, before: b.before, value: b.value };
    }
    case "picture": {
      const b = d.body as unknown as PictureBody;
      return { ...head, kind: "picture", entry: ref(b.entry), url: b.url, ...(b.alt ? { alt: b.alt } : {}) };
    }
  }
}
