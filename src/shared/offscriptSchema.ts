import { z } from "zod";
import { AMBIENT_IDS, CAPTION_MAX } from "./ambient";
import { SHOW_REF_RE } from "./assets";
import { NAME_MAX, PERSON_NOTE_MAX, SUMMARY_MAX, TITLE_MAX } from "./discovery";
import { CAPTURE_MAX, CLUE_MAX, CLUE_TAGS_MAX } from "./offscript";

const id = z.string().min(1).max(64);
const showRef = z.string().max(120).regex(SHOW_REF_RE);

const clueFields = z.object({
  text: z.string().max(CLUE_MAX),
  /** null: the campaign's clue pool. */
  episodeId: id.nullable(),
  fact: z.object({ entryId: id, factId: id }).nullable(),
  entryId: id.nullable(),
  tags: z.array(id).max(CLUE_TAGS_MAX),
  storyBeatId: id.nullable(),
});

const note = z.string().max(PERSON_NOTE_MAX).optional();
const improvDraft = z.object({
  name: z.string().min(1).max(NAME_MAX),
  title: z.string().max(TITLE_MAX).optional(),
  summary: z.string().max(SUMMARY_MAX).optional(),
  look: note,
  quirk: note,
  wants: note,
  knows: note,
  voice: note,
});

/** The off-script kit (all DM-only). */
export const offscriptDmCommands = [
  /** Where the party is now. null: nowhere in particular. */
  z.object({ type: z.literal("here.set"), placeId: id.nullable() }),
  /** An ambient scene on the TV, with an optional caption. */
  z.object({ type: z.literal("ambient.show"), id: z.enum(AMBIENT_IDS), caption: z.string().max(CAPTION_MAX).optional() }),
  /** A place's off-script settings: its default TV scene and caption. */
  z.object({
    type: z.literal("place.setup"),
    entryId: id,
    scene: showRef.nullable().optional(),
    caption: z.string().max(CAPTION_MAX).nullable().optional(),
    /** Its random tables to roll encounters and rumors on (null: the town's, or the built-in lists). */
    encounters: id.nullable().optional(),
    rumors: id.nullable().optional(),
  }),
  /**
   * Save a generator result: a Hidden person, place or shop (a shop also gets
   * its storefront, hidden, and its owner as a linked person), made up at the
   * table, tied to where the party is, and flagged for review. met: they've
   * met (Found); tv: with a name card on the TV.
   */
  z.object({
    type: z.literal("improv.save"),
    as: z.enum(["person", "place", "shop"]),
    draft: improvDraft.extend({ owner: improvDraft.optional() }),
    met: z.boolean(),
    tv: z.boolean(),
  }),
  /** Done reviewing an improvised, seeded or captured entry or table: it stops being flagged. */
  z.object({ type: z.literal("review.done"), entryId: id.optional(), tableId: id.optional() }),

  z.object({ type: z.literal("clue.add"), clue: clueFields.partial().extend({ text: z.string().max(CLUE_MAX).min(1) }) }),
  z.object({ type: z.literal("clue.update"), clueId: id, patch: clueFields.partial() }),
  z.object({ type: z.literal("clue.remove"), clueId: id }),
  /** Deliver it: where (default: here), through whom, and whether its fact goes up on the TV. */
  z.object({ type: z.literal("clue.deliver"), clueId: id, placeId: id.nullable().optional(), viaId: id.nullable().optional(), tv: z.boolean() }),
  /** After an episode, or by hand: keep it on its episode, move it to the pool, drop it, or make it ready again. */
  z.object({ type: z.literal("clue.settle"), clueId: id, to: z.enum(["keep", "pool", "drop", "ready"]) }),

  z.object({ type: z.literal("capture.add"), text: z.string().max(CAPTURE_MAX) }),
  z.object({ type: z.literal("capture.update"), captureId: id, text: z.string().max(CAPTURE_MAX).optional(), status: z.enum(["open", "dismissed"]).optional() }),
  z.object({ type: z.literal("capture.remove"), captureId: id }),
  /** Turn a note into a draft: a Hidden person or place, a fact on an entry, an unposted flyer, or a story beat. */
  z.object({
    type: z.literal("capture.make"),
    captureId: id,
    as: z.enum(["person", "place", "fact", "job", "beat"]),
    /** The name / title (person, place, flyer, beat), or the fact's words. */
    title: z.string().max(160).min(1),
    /** The rest of the note (a summary, the flyer's words, the beat's summary). */
    body: z.string().max(2000).optional(),
    /** For a fact: whose. */
    entryId: id.optional(),
  }),
] as const;
