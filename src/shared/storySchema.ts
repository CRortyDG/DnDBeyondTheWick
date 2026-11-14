// Storyboard commands (all DM-only). Spread into the DM command list in commands.ts.
import { z } from "zod";
import { AFTER_MAX, BEAT_TYPE_IDS, DAY_RE, LINKS_MAX, MONTH_RE, OUTCOME_MAX, THREAD_KIND_IDS } from "./story";

const id = z.string().min(1).max(64);
const text = (max: number) => z.string().max(max);
const month = z.string().regex(MONTH_RE, "Months look like 2027-03.");
const day = z.string().regex(DAY_RE, "Dates look like 2027-03-14.");
const color = z.string().regex(/^#[0-9a-fA-F]{6}$/);

const range = z.object({ from: month, to: month }).refine((r) => r.from <= r.to, "The window ends before it starts.");
/** null: floating (no window). */
const window = z.union([range, z.literal("anytime")]).nullable();

const link = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("entry"), id }),
  z.object({ kind: z.literal("fact"), entryId: id, factId: id }),
  z.object({ kind: z.literal("job"), id }),
  z.object({ kind: z.literal("flyer"), id }),
  z.object({ kind: z.literal("lead"), id }),
  z.object({ kind: z.literal("item"), id }),
  z.object({ kind: z.literal("monster"), id }),
]);

const beatFields = z.object({
  threadId: id,
  title: text(160).min(1),
  summary: text(2000),
  dmNotes: text(4000),
  type: z.enum(BEAT_TYPE_IDS),
  window,
  by: day.nullable(),
  links: z.array(link).max(LINKS_MAX),
  after: z.array(id).max(AFTER_MAX),
  repeat: z.boolean(),
});

const threadFields = z.object({
  name: text(80),
  color,
  description: text(600),
  goal: text(300),
  kind: z.enum(THREAD_KIND_IDS),
});

export const storyDmCommands = [
  z.object({ type: z.literal("story.threadAdd"), thread: threadFields.partial().extend({ name: text(80).min(1) }) }),
  z.object({ type: z.literal("story.threadUpdate"), threadId: id, patch: threadFields.partial() }),
  /** Its beats move to moveTo, or the remove is refused while it has any. */
  z.object({ type: z.literal("story.threadRemove"), threadId: id, moveTo: id.optional() }),
  z.object({ type: z.literal("story.threadMove"), threadId: id, dir: z.union([z.literal(-1), z.literal(1)]) }),

  z.object({ type: z.literal("story.beatAdd"), beat: beatFields.partial().extend({ threadId: id, title: text(160).min(1) }) }),
  z.object({ type: z.literal("story.beatUpdate"), beatId: id, patch: beatFields.partial() }),
  /** A reworded copy, right after the original, in the same place on the board. */
  z.object({ type: z.literal("story.beatDuplicate"), beatId: id }),
  z.object({ type: z.literal("story.beatRemove"), beatId: id }),
  /** By hand: Planned, Played (with an outcome) or Dropped. Placed comes from putting it in an episode. */
  z.object({ type: z.literal("story.beatStatus"), beatId: id, status: z.enum(["planned", "played", "dropped"]), outcome: text(OUTCOME_MAX).optional() }),
  z.object({ type: z.literal("story.playOutcome"), beatId: id, index: z.number().int().min(0).max(200), outcome: text(OUTCOME_MAX) }),

  z.object({ type: z.literal("story.dateAdd"), date: day }),
  /** episodeId: the episode that sits on this date (null: none). */
  z.object({ type: z.literal("story.dateUpdate"), dateId: id, date: day.optional(), cancelled: z.boolean().optional(), episodeId: id.nullable().optional() }),
  z.object({ type: z.literal("story.dateRemove"), dateId: id }),
  /** Every `every` days from start through December 2027. Dates already there are kept. */
  z.object({ type: z.literal("story.datesGenerate"), start: day, every: z.number().int().min(7).max(56).default(14) }),

  z.object({ type: z.literal("story.board"), zoom: z.enum(["month", "season"]).optional(), festivals: z.boolean().optional() }),
];
