import { z } from "zod";
import { practiceDmCommands } from "./practice";
import { LAST_TIME_NOTES_MAX, LAST_TIME_TEXT_MAX } from "./lastTime";
import { companionDmCommands, companionPlayerCommands } from "./companions";
import { CATEGORY_IDS, KIND_IDS } from "./progress";
import { RENOWN_MAX, RENOWN_POINTS_MAX } from "./renown";
import { FONT_IDS, LIST_MAX, NOTE_W_MAX, NOTE_W_MIN, PAPER_IDS, PIN_IDS, TITLE_SIZE_MAX, TITLE_SIZE_MIN } from "./board";
import { DIE_SIDES, diceCount, MAX_DICE, MAX_OF_ONE, MAX_PLUS } from "./dice";
import { fightDmCommands, fightPlayerCommands, monsterBody } from "./combatSchema";
import { IMPORT_MAX } from "./bulkImport";
import { ATTITUDE_REASON_MAX } from "./attitude";
import { SHOW_REF_RE } from "./assets";
import { isLayerId, isSfxId, LAYER_IDS, mixById, SFX_IDS } from "./sound";
import { HANDOUT_BODY_MAX, HANDOUT_SIGN_MAX, HANDOUT_TITLE_MAX } from "./handout";
import { storyDmCommands } from "./storySchema";
import { inviteDmCommands } from "./inviteSchema";
import { sheetDmCommands, sheetPlayerCommands } from "./sheet";
import { buildCommands } from "./sheetBuild";
import { featureDmCommands, featurePlayerCommands } from "./features";
import { offscriptDmCommands } from "./offscriptSchema";
import { roomDmCommands, roomInfoSchema } from "./rooms";
import { whisperDmCommands, whisperPlayerCommands } from "./whispers";
import { CLIP_URL_RE, CLIP_VIDEO_MAX, INTRO_STEPS_MAX, SLIDE_TEXT_MAX, SLIDES_MAX, WELCOME_MAX } from "./arrival";
import type { TokenColor } from "./types";
import { FOG_MAX_CELLS, TILE_URL_RE, TILES_MAX } from "./fog";
import { GRID_CELL_MAX, GRID_CELL_MIN, TOKEN_COLORS, TOKEN_SIZES } from "./tokens";
import { TABLE_DICE, TABLE_KIND_IDS, TABLE_NAME_MAX, TABLE_ROW_MAX, TABLE_ROWS_MAX } from "./tables";
import type { BuilderOp } from "./builderOps";
import { AREAS_MAX, PERSON_NOTE_MAX, DM_TEXT_MAX, FACT_REF_RE, LEAD_MAX, REF_RE, FACT_MAX, HINT_MAX, LINKS_MAX, NAME_MAX, RELATION_IDS, STAGE_IDS, SUMMARY_MAX, TITLE_MAX } from "./discovery";

const id = z.string().min(1).max(64);
/** A pixel-art look: small whole numbers by part (cleaned again by cleanLook). */
const lookInput = z.record(z.string().max(16), z.number().int().min(0).max(99)).refine((o) => Object.keys(o).length <= 40, "Too many parts.");
/** How many of which dice: d4 to d100, at most 20 of one and 30 in all. */
const diceAsk = z
  .array(z.object({ sides: z.literal(DIE_SIDES), count: z.number().int().min(1).max(MAX_OF_ONE) }))
  .min(1)
  .max(DIE_SIDES.length)
  .refine((d) => diceCount(d) <= MAX_DICE, `At most ${MAX_DICE} dice at once.`);
const dicePlus = z.number().int().min(-MAX_PLUS).max(MAX_PLUS).default(0);
const text = (max: number) => z.string().max(max);
const cp = z.number().int().min(0).max(1_000_000_000);
const hotkey = z.number().int().min(0).max(9).nullable();

// The Chronicle. A chapter id is a session id, or "next" for the page waiting for the next session.
const noteText = z.string().max(2000);
const noteTags = z.array(z.string().max(40)).max(12);
const notePatch = z.object({ text: noteText, tags: noteTags, chapterId: id }).partial();

const artSchema = z.object({
  builtin: z.enum(["candlefair-board", "artum-notice", "artum", "mags-wick", "chef", "merchant-sigil"]).optional(),
  url: z.string().max(2048).optional(),
});

const SCENE_KINDS = ["notice", "portrait", "handout", "image", "black", "map", "table", "stinger", "video", "intro", "keys"] as const;
const frac = z.number().min(0).max(1);
export const SEAL_SCALE_MIN = 0.25;
export const SEAL_SCALE_MAX = 2;
const pinId = z.string().regex(/^[A-Za-z0-9_-]{1,40}$/);
const pinLink = z.discriminatedUnion("kind", [z.object({ kind: z.literal("shop"), shopId: id }), z.object({ kind: z.literal("scene"), sceneId: id })]);
const pinFields = {
  showsAs: text(4),
  name: text(120),
  type: text(40),
  description: text(600),
  dmNotes: text(4000),
  x: frac,
  y: frac,
};
const pinPatch = z.object({ ...pinFields, link: pinLink.nullable() }).partial();
/** A whole pin, for undoing a delete. */
const fullPin = z.object({ id: pinId, number: z.number().int().min(1).max(999), discovered: z.boolean(), ...pinFields, link: pinLink.optional() });

const tokenColor = z.enum(TOKEN_COLORS as [TokenColor, ...TokenColor[]]);
const tokenPatch = z
  .object({
    label: text(3),
    name: text(60),
    color: tokenColor,
    size: z.number().refine((n) => (TOKEN_SIZES as readonly number[]).includes(n), "Pick a token size."),
    hidden: z.boolean(),
    locked: z.boolean(),
    art: artSchema,
  })
  .partial();
const gridSchema = z.object({
  snap: z.boolean(),
  lines: z.boolean(),
  cell: z.number().min(GRID_CELL_MIN).max(GRID_CELL_MAX),
  ox: frac,
  oy: frac,
  aspect: z.number().min(0.05).max(20),
});

const fogLayoutSchema = z.object({
  x0: z.number().min(-0.5).max(0),
  y0: z.number().min(-0.5).max(0),
  cw: z.number().min(0.002).max(1),
  ch: z.number().min(0.002).max(1),
  cols: z.number().int().min(1).max(FOG_MAX_CELLS),
  rows: z.number().int().min(1).max(FOG_MAX_CELLS),
  aspect: z.number().min(0.05).max(20),
});
const fogTilesSchema = z.object({
  cols: z.number().int().min(1).max(20),
  rows: z.number().int().min(1).max(20),
  urls: z.array(z.string().regex(TILE_URL_RE)).min(1).max(TILES_MAX),
  src: z.string().max(2048),
});

const scenePatch = z
  .object({
    label: text(80),
    kind: z.enum(SCENE_KINDS),
    hotkey,
    reveal: z.boolean(),
    art: artSchema,
    name: text(80),
    title: text(160),
    alt: text(300),
    dmNote: text(4000),
    slug: text(40),
    sheet: z
      .object({
        title: text(HANDOUT_TITLE_MAX),
        body: text(HANDOUT_BODY_MAX),
        sign: text(HANDOUT_SIGN_MAX),
        paper: z.enum(PAPER_IDS),
        font: z.enum(FONT_IDS),
        ink: z.enum(["red", "blue", "gold"]).optional(),
      })
      .nullable(),
  })
  .partial();

// Discovery entries.
const relation = z.enum(RELATION_IDS);
const stage = z.enum(STAGE_IDS);
/** Someone's goodwill a storefront, item or job needs. */
const trustNeed = z.object({ entryId: id, relation: z.enum(["friendly", "ally"]) });
const entryFields = {
  kind: z.string().regex(/^[a-z][a-z-]{1,23}$/),
  slug: z.string().max(40),
  name: text(NAME_MAX),
  title: text(TITLE_MAX),
  summary: text(SUMMARY_MAX),
  nickname: text(NAME_MAX),
  hint: text(HINT_MAX),
  sceneId: id.nullable(),
  pin: z.object({ sceneId: id, pinId: id }).nullable(),
  shopId: id.nullable(),
  templateId: id.nullable(),
  silhouette: z.string().max(2048).nullable(),
  areas: z.array(text(40)).max(AREAS_MAX),
  links: z.array(id).max(LINKS_MAX),
  relation: relation.nullable(),
  start: stage,
  dmNote: text(DM_TEXT_MAX),
  secrets: text(DM_TEXT_MAX),
  wants: text(PERSON_NOTE_MAX),
  knows: text(PERSON_NOTE_MAX),
  voice: text(PERSON_NOTE_MAX),
  look: text(PERSON_NOTE_MAX),
  quirk: text(PERSON_NOTE_MAX),
  /** Places: a room at an inn (null: not a room). */
  room: roomInfoSchema.nullable(),
};
const factText = text(FACT_MAX);

/** The Worldbuilder style guide's length. */
export const BUILDER_NOTES_MAX = 8000;
/** A random table. Rows without ranges are spread over the die (see tables.ts). */
export const tableBody = z.object({
  name: text(TABLE_NAME_MAX).min(1),
  die: z.literal(TABLE_DICE),
  kind: z.enum(TABLE_KIND_IDS),
  rows: z
    .array(z.object({ from: z.number().int().min(1).max(100).optional(), to: z.number().int().min(1).max(100).optional(), text: text(TABLE_ROW_MAX).min(1) }))
    .min(1)
    .max(TABLE_ROWS_MAX),
  areas: z.array(text(40)).max(AREAS_MAX).default([]),
  dmNote: text(DM_TEXT_MAX).default(""),
});
const updown = z.union([z.literal(1), z.literal(-1)]);

const category = z.enum(CATEGORY_IDS);
const effect = z.discriminatedUnion("type", [
  z.object({ type: z.literal("unlock"), itemId: id.optional(), shopId: id.optional() }),
  z.object({ type: z.literal("discount"), pct: z.number().int().min(1).max(50), category: category.optional(), tag: text(40).optional() }),
  z.object({ type: z.literal("income"), dice: z.string().regex(/^\s*(\d*d\d+([+-]\d+)?|\d+)\s*$/i), unitCp: cp }),
  z.object({ type: z.literal("credit"), limitCp: cp }),
]);
const rank = z.number().int().min(0).max(RENOWN_MAX);
/** Renown points a job gives when done. */
const jobRenown = z.number().int().min(0).max(10);
const flyerText = z.object({ title: text(60).min(1), body: text(400), signedBy: text(60) });

const itemFields = {
  shopId: id,
  name: text(120).min(1),
  priceCp: cp,
  description: text(600),
  tier: z.enum(["sale", "locked", "rumored", "hidden"]),
  reason: text(160),
  hint: text(200),
  hidePrice: z.boolean(),
  stock: z.number().int().min(0).max(9999).nullable(),
  restockNote: text(160),
  priceLabel: text(24),
  finePrint: text(300),
  arrivesInSessions: z.number().int().min(0).max(20),
  oneAtATime: z.boolean(),
  dmNote: text(2000),
  category,
  kind: z.enum(KIND_IDS),
  installments: z.number().int().min(1).max(20),
  prompt: text(120),
  flyer: z.boolean(),
  tags: z.array(text(40)).max(10),
  keep: z.boolean(),
  effects: z.array(effect).max(6),
  renown: rank,
  trust: trustNeed.nullable(),
};

// The notice board: how a note looks and where it hangs.
const imageUrl = z.string().max(2048).regex(/^(https:\/\/|\/api\/files\/)/, "Images must be uploaded first.");
/** An intro slide's picture: an upload, or one of the site's own (the premade campaign's slides use these). */
const slideImage = z.union([imageUrl, z.string().max(200).regex(/^\/art\/[a-z0-9-]+(?:\/[a-z0-9-]+)*\.(?:jpg|png|webp|svg)$/)]);
const noteLook = z.object({
  pin: z.enum(PIN_IDS),
  font: z.enum(FONT_IDS),
  align: z.enum(["left", "center"]),
  band: z.boolean(),
  ink: z.enum(["red", "blue", "gold"]),
  kicker: text(80),
  titleSize: z.number().min(TITLE_SIZE_MIN).max(TITLE_SIZE_MAX),
  sub: text(80),
  list: z.array(z.object({ head: text(40), text: text(160) })).max(LIST_MAX),
  listLabel: text(30),
  footer: text(400),
  signNote: text(80),
  image: imageUrl,
}).partial();
const notePlace = z.object({ x: z.number().min(-2000).max(4000), y: z.number().min(-2000).max(4000), rot: z.number().min(-180).max(180), w: z.number().min(NOTE_W_MIN).max(NOTE_W_MAX), z: z.number().int().min(0).max(1_000_000) });
const paper = z.enum(PAPER_IDS);
const noticeFields = {
  slug: z.string().max(40).regex(/^[a-z0-9-]*$/, "Short names use a-z, 0-9 and dashes."),
  style: paper,
  title: text(120),
  body: text(800),
  sign: text(80),
  look: noteLook,
  up: z.boolean(),
  place: notePlace,
  dmNote: text(DM_TEXT_MAX),
};
const noteRef = z.object({ kind: z.enum(["notice", "job", "flyer"]), id });

// The bounty board. dm: DM-ONLY notes, never sent to the TV or a phone.
const worldDay = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/);
const worldEvent = z.object({ name: text(60), from: worldDay, to: worldDay, note: text(200) });
const jobFields = {
  /** Shared world: the parties that see it (empty: every party). */
  parties: z.array(id).max(12),
  look: noteLook,
  place: notePlace,
  trust: trustNeed.nullable(),
  title: text(80),
  postedBy: text(80),
  body: text(600),
  reward: z.object({ kind: z.enum(["each", "total", "hidden"]), cp }),
  renown: rank,
  renownPoints: jobRenown,
  style: paper,
  dm: z.object({ adventure: text(300), loot: text(1000), twists: text(1000), notes: text(2000) }).partial(),
};
const itemPatch = z.object(itemFields).partial();

const soundVol = z.number().min(0).max(1);
const soundFade = z.number().min(0).max(20);

/** One move on a person's attitude dial. */
const attitudeDelta = z.number().int().min(-20).max(20).refine((n) => n !== 0, "Move it at least one step.");

// Run sheets (DM-only).
const showRef = z.string().max(120).regex(SHOW_REF_RE);
const beatAction = z.discriminatedUnion("type", [
  z.object({ type: z.literal("scene"), sceneId: id }),
  z.object({ type: z.literal("sound"), mix: z.string().max(40).refine((m) => m === "off" || !!mixById(m) || (m.startsWith("layer/") && isLayerId(m.slice(6))), "Unknown sound mix."), tap: z.boolean().optional() }),
  z.object({ type: z.literal("sfx"), id: z.string().max(40).refine((x): boolean => isSfxId(x), "Unknown sound effect."), tap: z.boolean().optional() }),
  z.object({ type: z.literal("black") }),
  z.object({ type: z.literal("stinger") }),
  z.object({ type: z.literal("bank") }),
  z.object({ type: z.literal("fight"), monsters: z.array(z.object({ name: text(80).min(1), count: z.number().int().min(1).max(20) })).min(1).max(10) }),
  z.object({ type: z.literal("reveal"), ref: z.string().regex(REF_RE), stage }),
  z.object({ type: z.literal("fact"), ref: z.string().regex(FACT_REF_RE) }),
  z.object({ type: z.literal("show"), ref: showRef }),
  z.object({ type: z.literal("mood"), ref: z.string().regex(REF_RE), delta: attitudeDelta, reason: text(ATTITUDE_REASON_MAX) }),
]);
export const beatBody = z.object({
  title: text(160).min(1),
  readAloud: z.array(text(6000)).max(40).optional(),
  readAloudAt: z.number().int().min(0).max(200).optional(),
  notes: z.array(text(4000)).max(200),
  checks: z.array(z.object({ skill: text(200).min(1), dc: z.number().int().min(0).max(99), what: text(400), fail: text(1000).optional(), success: text(1000).optional() })).max(40),
  branches: z.array(z.object({ when: text(1000), then: text(2000) })).max(40),
  actions: z.array(beatAction).max(10),
  dismissed: z.array(showRef).max(40).optional(),
  /** Story beats placed here ("story: sb-id"). Ticks are kept by the server. */
  stories: z.array(z.object({ storyBeatId: id })).max(20).optional(),
});

/** Commands only the DM may send. */
export const dmCommand = z.discriminatedUnion("type", [
  z.object({ type: z.literal("show"), ref: showRef }),
  z.object({ type: z.literal("quick.set"), key: z.number().int().min(0).max(9), ref: showRef.nullable() }),
  z.object({ type: z.literal("recent.clear") }),
  z.object({ type: z.literal("entry.picture"), entryId: id, art: artSchema, alt: text(300).optional(), look: lookInput.optional() }),
  z.object({ type: z.literal("episode.acceptSuggestions"), episodeId: id }),
  z.object({ type: z.literal("beat.dismiss"), episodeId: id, beatId: id, ref: showRef }),
  // The episode builder: story beats in run sheets, and the prep checklist.
  /** Into a run-sheet beat, or (no beatId) the "Story beats" beat at the end. */
  z.object({ type: z.literal("episode.placeStory"), episodeId: id, storyBeatId: id, beatId: id.optional() }),
  z.object({ type: z.literal("episode.unplaceStory"), episodeId: id, beatId: id, storyBeatId: id }),
  /** An episode ended with this story beat unplayed: back to Planned, keep it here for next time, or drop it. */
  z.object({ type: z.literal("episode.leftover"), episodeId: id, storyBeatId: id, choice: z.enum(["planned", "keep", "drop"]) }),
  z.object({ type: z.literal("episode.prep"), episodeId: id, key: z.string().min(1).max(200), state: z.enum(["done", "dismissed"]).nullable() }),
  /** The DM's own prep checklist item: add one (text), or remove one (noteId). */
  z.object({ type: z.literal("episode.prepNote"), episodeId: id, text: z.string().trim().min(1).max(300).optional(), noteId: id.optional() }),
  /** Tick a story block in run-game mode: the story beat is Played in this session, its facts reveal on the TV. */
  z.object({ type: z.literal("run.story"), episodeId: id, beatId: id, storyBeatId: id, done: z.boolean(), outcome: text(300).optional() }),
  z.object({ type: z.literal("scene.show"), sceneId: id }),
  z.object({ type: z.literal("scene.step"), dir: z.union([z.literal(1), z.literal(-1)]) }),
  z.object({ type: z.literal("scene.hotkey"), key: z.number().int().min(0).max(9) }),
  z.object({ type: z.literal("scene.add"), kind: z.enum(SCENE_KINDS), label: text(80) }),
  z.object({ type: z.literal("scene.update"), sceneId: id, patch: scenePatch }),
  z.object({ type: z.literal("scene.remove"), sceneId: id }),
  z.object({ type: z.literal("scene.move"), sceneId: id, dir: z.union([z.literal(1), z.literal(-1)]) }),

  z.object({ type: z.literal("pin.add"), sceneId: id, pinId, x: frac, y: frac }),
  z.object({ type: z.literal("pin.update"), sceneId: id, pinId: id, patch: pinPatch }),
  z.object({ type: z.literal("pin.remove"), sceneId: id, pinId: id }),
  z.object({ type: z.literal("pin.restore"), sceneId: id, pin: fullPin }),
  /** announce: show "Discovered: …" on the TV. */
  z.object({ type: z.literal("pin.discover"), sceneId: id, pinId: id, discovered: z.boolean(), announce: z.boolean() }),
  z.object({ type: z.literal("map.legend"), sceneId: id, on: z.boolean().optional(), style: z.enum(["numbers", "names"]).optional() }),
  /** How big the dots are on this map. */
  z.object({ type: z.literal("map.sealScale"), sceneId: id, scale: z.number().min(SEAL_SCALE_MIN).max(SEAL_SCALE_MAX) }),
  // Tokens and the grid (see tokens.ts).
  z.object({ type: z.literal("token.add"), sceneId: id, kind: z.enum(["monster", "npc"]), name: text(60), x: frac, y: frac, color: tokenColor.optional(), hidden: z.boolean().optional() }),
  /** A token for every player at the table who hasn't one on this map yet, near (x, y). */
  z.object({ type: z.literal("token.party"), sceneId: id, x: frac, y: frac }),
  z.object({ type: z.literal("token.move"), sceneId: id, tokenId: id, x: frac, y: frac }),
  z.object({ type: z.literal("token.update"), sceneId: id, tokenId: id, patch: tokenPatch }),
  z.object({ type: z.literal("token.remove"), sceneId: id, tokenId: id }),
  /** null: no grid. */
  z.object({ type: z.literal("map.grid"), sceneId: id, grid: gridSchema.nullable() }),
  // Fog of war (see fog.ts).
  /** Lay out the cells and the image's tiles, and turn fog on. keep: keep what's clear if the cells are the same. */
  z.object({ type: z.literal("fog.setup"), sceneId: id, layout: fogLayoutSchema, tiles: fogTilesSchema, keep: z.boolean().optional() }),
  z.object({ type: z.literal("fog.on"), sceneId: id, on: z.boolean() }),
  /** Every cell at once (base64 bits, 1 = clear). */
  z.object({ type: z.literal("fog.bits"), sceneId: id, bits: z.string().max(8000).regex(/^[A-Za-z0-9+/]*={0,2}$/) }),
  z.object({ type: z.literal("fog.all"), sceneId: id, clear: z.boolean() }),
  /** Zoom the TV toward a pin on the live map, or back out with null. */
  z.object({ type: z.literal("live.focus"), pinId: id.nullable() }),
  /** Add the Candlefair and Sword Coast maps to a game created before maps existed. */
  z.object({ type: z.literal("map.addSeedMaps") }),

  /** category: show a category on the TV instead of a storefront (null = back to storefronts). */
  z.object({ type: z.literal("live.shop"), open: z.boolean(), shopId: id.optional(), category: category.nullable().optional() }),
  z.object({ type: z.literal("live.purse"), visible: z.boolean() }),

  z.object({ type: z.literal("money.adjust"), playerId: id, amountCp: z.number().int().min(-1_000_000_000).max(1_000_000_000), note: text(200), allowDebt: z.boolean().optional() }),
  z.object({ type: z.literal("money.payAll"), amountCp: cp, note: text(200), playerIds: z.array(id).max(50) }),
  /** question: what a training is for ("Elvish"). */
  z.object({ type: z.literal("money.buy"), playerId: id, itemId: id, question: text(300).optional() }),
  z.object({ type: z.literal("project.contribute"), playerId: id, itemId: id, amountCp: cp.min(1) }),
  /** NPC money straight into a project: no player's purse involved. */
  z.object({ type: z.literal("project.npcContribute"), itemId: id, amountCp: cp.min(1), from: text(60) }),
  /** Charge the rent and lessons due at the end of the running session (the ids the DM ticked). */
  z.object({ type: z.literal("dues.charge"), ids: z.array(id).max(200) }),
  z.object({ type: z.literal("rental.cancel"), rentalId: id }),
  z.object({ type: z.literal("training.cancel"), trainingId: id }),
  z.object({ type: z.literal("award.grant"), itemId: id, playerIds: z.array(id).min(1).max(50), note: text(200) }),
  z.object({ type: z.literal("award.revoke"), awardId: id }),
  z.object({ type: z.literal("task.done"), taskId: id, done: z.boolean() }),
  z.object({ type: z.literal("flyer.update"), flyerId: id, patch: flyerText.partial().extend({ up: z.boolean().optional(), style: paper.optional(), look: noteLook.optional(), place: notePlace.optional() }) }),
  z.object({ type: z.literal("flyer.remove"), flyerId: id }),
  /** The gold a player put up for their flyer: to whoever did the job (split evenly), or back to the poster. */
  z.object({ type: z.literal("flyer.reward"), flyerId: id, to: z.enum(["players", "poster"]), playerIds: z.array(id).max(50).optional() }),

  /**
   * The party's Renown. Raising it plays the TV moment (unless tv is false) and goes in the Chronicle;
   * lowering it is quiet. A reason is written in the Chronicle either way.
   */
  z.object({ type: z.literal("renown.set"), rank, reason: text(200).optional(), tv: z.boolean().optional() }),
  /**
   * Award (or take away) Renown points, with a reason for the Chronicle. Crossing the next
   * rank's threshold raises the rank like renown.set (tv as there); falling short never lowers it.
   */
  z.object({ type: z.literal("renown.points"), amount: z.number().int().min(-50).max(50).refine((n) => n !== 0, "Give or take at least one point."), reason: text(200).optional(), tv: z.boolean().optional() }),
  /** Show the party's progress toward the next rank on phones. */
  z.object({ type: z.literal("renown.progress"), on: z.boolean() }),
  // Jobs wait until the party finds this entry (null: always show). make: a new hidden "Notice board" place.
  z.object({ type: z.literal("jobs.gate"), entryId: id.nullable().optional(), make: z.literal(true).optional() }),
  /**
   * Fix a line in the Renown history: its points and reason. The difference goes on (or comes
   * off) the points of everyone who got it, later totals move with it, and its Chronicle line is
   * corrected. Reaching a new rank raises it (tv as renown.set); falling short only lowers the
   * rank when lower is true. A rank set by hand (source set) only takes a new reason.
   */
  z.object({ type: z.literal("renown.edit"), changeId: id, amount: z.number().int().min(-50).max(50).optional(), reason: text(200).optional(), lower: z.boolean().optional(), tv: z.boolean().optional() }),
  /** Undo a line in the Renown history: its points come off, it leaves the history and its Chronicle lines go. */
  z.object({ type: z.literal("renown.undo"), changeId: id, lower: z.boolean().optional() }),
  /** secret: only the DM sees it (in the roll log); otherwise it plays on the TV. */
  z.object({ type: z.literal("dice.roll"), dice: diceAsk, plus: dicePlus, secret: z.boolean().optional() }),
  /** Empty the roll log (the DM's and the players' rolls). */
  z.object({ type: z.literal("dice.clearLog") }),
  /** Take the roll off the TV right away. */
  z.object({ type: z.literal("dice.clearTv") }),
  /** The soundboard's master volume, mute, and whether moments (dice, fights, scenes) bring their own sounds. */
  z.object({ type: z.literal("sound.set"), volume: soundVol.optional(), muted: z.boolean().optional(), auto: z.boolean().optional() }),
  /** One looping layer's volume; 0 turns it off. */
  z.object({ type: z.literal("sound.layer"), id: z.enum(LAYER_IDS), volume: soundVol, fade: soundFade.optional() }),
  /** Every layer at once (a ready-made mix, or {} for silence), crossfading over fade seconds. */
  z.object({ type: z.literal("sound.mix"), layers: z.partialRecord(z.enum(LAYER_IDS), soundVol), fade: soundFade.optional(), mix: z.string().max(40).optional() }),
  /** Play a one-shot on the TV. */
  z.object({ type: z.literal("sound.cue"), id: z.enum(SFX_IDS) }),
  /** A new job flyer (unpinned unless pin). followUpOf: the flyer it replaces, which is pulled. */
  z.object({ type: z.literal("job.add"), job: z.object(jobFields).partial(), followUpOf: id.optional(), pin: z.boolean().optional() }),
  /** status: back to open, or taken by hand. Done goes through job.done (it pays); expired through job.expire. */
  z.object({ type: z.literal("job.update"), jobId: id, patch: z.object({ ...jobFields, status: z.enum(["open", "taken"]) }).partial() }),
  z.object({ type: z.literal("job.pin"), jobId: id, pinned: z.boolean(), place: notePlace.optional() }),
  /** A plain note for the board: up (at place, or the emptiest spot) unless up is false. */
  z.object({ type: z.literal("notice.add"), notice: z.object(noticeFields).partial() }),
  z.object({ type: z.literal("notice.update"), noticeId: id, patch: z.object(noticeFields).partial() }),
  z.object({ type: z.literal("notice.remove"), noticeId: id }),
  /** Move, tilt, resize or restack any note on the board. */
  z.object({ type: z.literal("board.place"), note: noteRef, place: notePlace }),
  /** Show or hide the Renown plaque on the board's frame. */
  z.object({ type: z.literal("board.plaque"), shown: z.boolean() }),
  /** Mark it done and pay these amounts into purses, once. */
  /** renown: points the party gets for it (missing: the job's own "Renown when done"). */
  z.object({ type: z.literal("job.done"), jobId: id, payouts: z.array(z.object({ playerId: id, cp })).max(50), renown: jobRenown.optional() }),
  z.object({ type: z.literal("job.expire"), jobId: id }),
  z.object({ type: z.literal("job.remove"), jobId: id }),

  z.object({ type: z.literal("player.add"), name: text(32) }),
  z.object({ type: z.literal("player.update"), playerId: id, patch: z.object({ name: text(32), dndbUrl: text(300), away: z.boolean(), dropIn: z.boolean(), handle: text(40), character: text(40) }).partial() }),
  z.object({ type: z.literal("player.archive"), playerId: id, archived: z.boolean() }),
  z.object({ type: z.literal("player.look"), playerId: id, look: lookInput.nullable() }),
  /** Set one character's level quietly (no moment), or clear it. */
  z.object({ type: z.literal("player.level"), playerId: id, level: z.number().int().min(1).max(20).nullable() }),
  /** Level up the party: each character's new level, then the TV moment, the Chronicle line and the phones. */
  z.object({ type: z.literal("party.levelUp"), levels: z.array(z.object({ playerId: id, level: z.number().int().min(1).max(20) })).min(1).max(40), tv: z.boolean().optional() }),
  z.object({ type: z.literal("player.remove"), playerId: id }),
  z.object({ type: z.literal("player.clearKey"), playerId: id }),
  z.object({ type: z.literal("player.inspire"), playerId: id, on: z.boolean() }),

  z.object({ type: z.literal("shop.add"), name: text(80), subtitle: text(160) }),
  z.object({ type: z.literal("shop.update"), shopId: id, patch: z.object({ name: text(80), subtitle: text(160), closed: z.boolean(), secretSales: z.boolean(), renown: rank, trust: trustNeed.nullable() }).partial() }),
  /** Who can see a shop. quiet: no "Now open" banner on the TV. */
  z.object({
    type: z.literal("shop.visibility"),
    shopId: id,
    visibility: z.enum(["hidden", "all", "some"]),
    playerIds: z.array(id).max(50).optional(),
    quiet: z.boolean().optional(),
  }),
  z.object({ type: z.literal("shop.remove"), shopId: id }),
  z.object({ type: z.literal("item.add"), item: z.object(itemFields).partial().required({ shopId: true, name: true, priceCp: true }), quiet: z.boolean().optional() }),
  /** quiet: no "New at …" banner when this reveals or unlocks the item. */
  z.object({ type: z.literal("item.update"), itemId: id, patch: itemPatch, quiet: z.boolean().optional() }),
  z.object({ type: z.literal("order.arrive"), orderId: id }),
  z.object({ type: z.literal("order.cancel"), orderId: id, refund: z.boolean() }),
  /** Replace every shop and item with the starter catalog (all hidden). Ledger untouched. */
  z.object({ type: z.literal("catalog.reset") }),
  z.object({ type: z.literal("item.remove"), itemId: id }),

  z.object({ type: z.literal("session.start"), title: text(120).optional(), partyId: id.optional(), inviteId: id.optional() }),
  // The shared world: parties, telling the table, the calendar and world news.
  /** The first one turns the campaign into a shared world (everyone so far becomes firstName's party). */
  z.object({ type: z.literal("party.add"), name: text(40), firstName: text(40).optional() }),
  z.object({ type: z.literal("party.update"), partyId: id, patch: z.object({ name: text(40), color: z.string().regex(/^#[0-9a-fA-F]{6}$/) }).partial() }),
  z.object({ type: z.literal("party.remove"), partyId: id }),
  /** catchUp (default on): a new member learns what everyone already in the party knows. */
  z.object({ type: z.literal("party.member"), partyId: id, playerId: id, member: z.boolean(), catchUp: z.boolean().optional() }),
  /** Seat a party at the table (between sessions): its members are here, everyone else away. */
  z.object({ type: z.literal("party.play"), partyId: id }),
  /** A character at the table tells the others: they hear of it (rumored) or meet it (found), and learn the facts picked. */
  z.object({ type: z.literal("entry.tell"), entryId: id, playerId: id, stage: z.enum(["rumored", "found", "known"]), factIds: z.array(id).max(40).optional(), tv: z.boolean().optional() }),
  z.object({ type: z.literal("world.date"), date: worldDay.nullable(), tv: z.boolean().optional() }),
  z.object({ type: z.literal("world.eventAdd"), event: worldEvent }),
  z.object({ type: z.literal("world.eventUpdate"), eventId: id, patch: worldEvent.partial() }),
  z.object({ type: z.literal("world.eventRemove"), eventId: id }),
  z.object({ type: z.literal("world.news"), text: text(200), tv: z.boolean().optional() }),
  z.object({ type: z.literal("session.end") }),
  z.object({ type: z.literal("session.update"), sessionId: id, patch: z.object({ title: text(120), number: z.number().int().min(1).max(9999) }).partial() }),
  z.object({ type: z.literal("session.reopen"), sessionId: id }),
  z.object({ type: z.literal("session.remove"), sessionId: id }),
  z.object({ type: z.literal("session.noteTaker"), sessionId: id, playerId: id.nullable() }),

  // The Chronicle: the DM can write, edit, move, star, hide and delete any note.
  z.object({ type: z.literal("note.add"), text: noteText, tags: noteTags.optional(), chapterId: id.optional() }),
  z.object({ type: z.literal("note.update"), noteId: id, patch: notePatch.extend({ starred: z.boolean(), hidden: z.boolean() }).partial() }),
  z.object({ type: z.literal("note.remove"), noteId: id }),
  /** A portrait's NPC: the players have met them (feeds the Chronicle's tag picker). */
  z.object({ type: z.literal("scene.known"), sceneId: id, known: z.boolean() }),

  // Discovery. announce: play the reveal on the TV.
  z.object({ type: z.literal("entry.add"), entry: z.object(entryFields).partial(), facts: z.array(factText).max(40).optional() }),
  /** Bulk import (see bulkImport.ts): every row goes through the same command as adding it by hand, all or nothing. Items name their shop; a shop that doesn't exist is made. */
  z
    .object({
      type: z.literal("import.bulk"),
      monsters: z.array(monsterBody).max(IMPORT_MAX).optional(),
      entries: z.array(z.object({ entry: z.object(entryFields).partial(), facts: z.array(factText).max(40).optional() })).max(IMPORT_MAX).optional(),
      items: z.array(z.object({ shop: text(80).min(1), item: z.object(itemFields).omit({ shopId: true }).partial().required({ name: true, priceCp: true }) })).max(IMPORT_MAX).optional(),
    })
    .refine((c) => (c.monsters?.length ?? 0) + (c.entries?.length ?? 0) + (c.items?.length ?? 0) <= IMPORT_MAX, `One import can add ${IMPORT_MAX} things.`),
  z.object({ type: z.literal("entry.update"), entryId: id, patch: z.object(entryFields).partial() }),
  /** A person's feelings about one player (null: same as the party). */
  z.object({ type: z.literal("entry.relationFor"), entryId: id, playerId: id, relation: relation.nullable() }),
  z.object({ type: z.literal("entry.remove"), entryId: id }),
  z.object({ type: z.literal("entry.move"), entryId: id, dir: updown }),
  z.object({ type: z.literal("entry.stage"), entryId: id, stage, announce: z.boolean() }),
  /** Play it on the TV again (visible entries only); factId: a revealed fact instead. */
  z.object({ type: z.literal("entry.show"), entryId: id, factId: id.optional() }),
  z.object({ type: z.literal("entry.factAdd"), entryId: id, text: factText }),
  z.object({ type: z.literal("entry.factUpdate"), entryId: id, factId: id, text: factText.optional(), slug: z.string().max(40).optional() }),
  z.object({ type: z.literal("entry.factRemove"), entryId: id, factId: id }),
  z.object({ type: z.literal("entry.factMove"), entryId: id, factId: id, dir: updown }),
  /** Revealing a fact makes the entry Known. tv: also show it on the TV. */
  z.object({ type: z.literal("entry.factReveal"), entryId: id, factId: id, revealed: z.boolean(), tv: z.boolean().optional() }),

  z.object({ type: z.literal("lead.add"), text: text(LEAD_MAX).min(1), entryId: id.optional(), placeId: id.optional(), jobId: id.optional(), shown: z.boolean().optional(), partyId: id.nullable().optional() }),
  z.object({
    type: z.literal("lead.update"),
    leadId: id,
    patch: z.object({ text: text(LEAD_MAX).min(1), entryId: id.nullable(), placeId: id.nullable(), jobId: id.nullable(), shown: z.boolean(), dmNote: text(DM_TEXT_MAX), partyId: id.nullable() }).partial(),
  }),
  z.object({ type: z.literal("lead.status"), leadId: id, status: z.enum(["open", "followed", "closed"]) }),
  z.object({ type: z.literal("lead.remove"), leadId: id }),
  z.object({ type: z.literal("lead.move"), leadId: id, dir: updown }),
  /** Minutes: closes by itself that long from now. */
  z.object({ type: z.literal("vote.open"), leadIds: z.array(id).min(2).max(3), minutes: z.number().int().min(1).max(10080).optional() }),
  z.object({ type: z.literal("vote.close") }),
  /** The DM's pick: breaks a tie, or overrides. */
  z.object({ type: z.literal("vote.pick"), leadId: id }),
  z.object({ type: z.literal("vote.clear") }),
  z.object({ type: z.literal("live.leads"), on: z.boolean() }),
  /** Show how much is left to find per area, as empty slots. */
  z.object({ type: z.literal("discovery.totals"), on: z.boolean() }),
  /** Move a person's attitude dial. playerIds: only these characters (missing: the whole party). tv: banner it if their band changes. */
  z.object({ type: z.literal("entry.attitude"), entryId: id, delta: attitudeDelta, reason: text(ATTITUDE_REASON_MAX), playerIds: z.array(id).min(1).max(20).optional(), secret: z.boolean().optional(), tv: z.boolean().optional() }),
  /** Take a move back (the dial goes back by what it moved), or just hide its reason from players. */
  z.object({ type: z.literal("entry.attitudeUndo"), entryId: id, shiftId: id }),
  z.object({ type: z.literal("entry.attitudeSecret"), entryId: id, shiftId: id, secret: z.boolean() }),
  /** How the tracker works in this campaign. */
  z.object({ type: z.literal("attitudes.set"), patch: z.object({ show: z.enum(["none", "band", "dial", "reasons"]), tv: z.boolean(), jobs: z.number().int().min(0).max(5) }).partial() }),

  z.object({ type: z.literal("episode.add"), title: text(160), beats: z.array(beatBody).max(200).optional() }),
  z.object({ type: z.literal("episode.update"), episodeId: id, title: text(160).min(1) }),
  z.object({ type: z.literal("episode.replaceBeats"), episodeId: id, beats: z.array(beatBody).max(200) }),
  z.object({ type: z.literal("episode.remove"), episodeId: id }),
  z.object({ type: z.literal("beat.add"), episodeId: id, at: z.number().int().min(0).max(200).optional(), beat: beatBody.optional() }),
  z.object({ type: z.literal("beat.update"), episodeId: id, beatId: id, beat: beatBody }),
  z.object({ type: z.literal("beat.move"), episodeId: id, beatId: id, to: z.number().int().min(0).max(200) }),
  z.object({ type: z.literal("beat.remove"), episodeId: id, beatId: id }),

  z.object({ type: z.literal("run.start"), episodeId: id }),
  /** Next and jump fire the landing beat's actions (minus any skipped); Back never fires. */
  z.object({ type: z.literal("run.next"), skip: z.array(z.number().int().min(0).max(9)).max(10).optional() }),
  z.object({ type: z.literal("run.back") }),
  z.object({ type: z.literal("run.jump"), stage: z.enum(["start", "beat", "end"]), beat: z.number().int().min(0).max(200).optional() }),
  z.object({ type: z.literal("run.fire"), beatId: id, index: z.number().int().min(0).max(9) }),
  z.object({ type: z.literal("run.note"), beatId: id, text: text(4000) }),
  z.object({ type: z.literal("run.recap"), sessionId: id, text: text(8000) }),
  /** The players' "Last time on…" card: save the draft (and whether it goes out when the session ends). */
  z.object({ type: z.literal("lastTime.save"), sessionId: id, text: text(LAST_TIME_TEXT_MAX), noteIds: z.array(id).max(LAST_TIME_NOTES_MAX), onEnd: z.boolean() }),
  /** Send it now (the session must have ended). With text/noteIds, saves them first. */
  z.object({ type: z.literal("lastTime.send"), sessionId: id, text: text(LAST_TIME_TEXT_MAX).optional(), noteIds: z.array(id).max(LAST_TIME_NOTES_MAX).optional() }),
  /** Take it back off players' devices. The draft stays. */
  z.object({ type: z.literal("lastTime.unsend"), sessionId: id }),
  z.object({ type: z.literal("run.attend"), playerId: id, here: z.boolean() }),
  /** Keep a player who asked to be marked here as away for now. */
  z.object({ type: z.literal("run.hereDismiss"), playerId: id }),
  /** noteIds: starred Chronicle notes from that session to show under the recap. */
  z.object({ type: z.literal("live.recap"), sessionId: id.nullable(), noteIds: z.array(id).max(20).optional() }),

  /** A long rest: every player (or these) back to full HP, temporary HP gone. */
  z.object({ type: z.literal("party.longRest"), playerIds: z.array(id).min(1).max(40).optional() }),
  /** A short rest: Pact Magic slots and short-rest features back on every sheet. Players spend their own hit dice. */
  z.object({ type: z.literal("party.shortRest"), playerIds: z.array(id).min(1).max(40).optional() }),

  z.object({ type: z.literal("door.set"), closed: z.boolean() }),
  z.object({ type: z.literal("table.seats"), max: z.number().int().min(1).max(12) }),
  z.object({ type: z.literal("knock.admit"), knockId: id }),
  z.object({ type: z.literal("knock.dismiss"), knockId: id }),

  // Phone requests (buy / send gold). totalCp: approve at a different price (haggling).
  // override: approve even though the player can no longer afford it (allows debt) or it's out of stock.
  // answer: a service's reply the player sees. flyer: the flyer as the DM edited it.
  z.object({ type: z.literal("request.approve"), requestId: id, totalCp: cp.optional(), override: z.boolean().optional(), answer: text(600).optional(), flyer: flyerText.optional() }),
  z.object({ type: z.literal("request.decline"), requestId: id, reason: text(120) }),
  /** Approve every pending request that still works; the rest stay pending. */
  z.object({ type: z.literal("request.approveAll") }),
  // Shop history: fix a decision after the fact. reopen: a declined request goes back to waiting
  // (holding the gold again) so it can be approved after all. hide: off the player's phone, kept for the DM.
  z.object({ type: z.literal("request.reopen"), requestId: id }),
  z.object({ type: z.literal("request.reason"), requestId: id, reason: text(120) }),
  z.object({ type: z.literal("request.hide"), requestId: id, hidden: z.boolean() }),
  z.object({ type: z.literal("request.remove"), requestId: id }),
  z.object({ type: z.literal("game.tvPurchases"), on: z.boolean() }),

  // The Arrival intro (the link texted before session 0).
  /** Give every seated player without one a private link. */
  z.object({ type: z.literal("arrival.issueLinks") }),
  z.object({ type: z.literal("arrival.copied"), playerId: id }),
  /** Back to new: the intro plays again, the seat is unclaimed, the character name and line are cleared. The link stays the same. */
  z.object({ type: z.literal("arrival.reset"), playerId: id }),
  z.object({
    type: z.literal("arrival.settings"),
    template: text(300).optional(),
    seatsLocked: z.boolean().optional(),
    title: text(60).optional(),
    captain: text(40).optional(),
    intro: z.boolean().optional(),
    introKind: z.enum(["none", "builtin", "custom"]).optional(),
    welcome: text(WELCOME_MAX).optional(),
  }),
  /** The DM's own intro clip, or null to remove it. */
  z.object({
    type: z.literal("arrival.clip"),
    clip: z.object({ url: z.string().max(300).regex(CLIP_URL_RE, "Upload the video first."), kind: z.enum(["video", "gif"]), bytes: z.number().int().min(0).max(CLIP_VIDEO_MAX), seconds: z.number().min(0).max(3600).optional(), poster: imageUrl.optional() }).nullable(),
  }),
  /** The DM's own intro slides, the whole list in order. */
  z.object({
    type: z.literal("arrival.slides"),
    slides: z.array(z.object({ id, image: slideImage.optional(), wide: slideImage.optional(), text: text(SLIDE_TEXT_MAX) })).max(SLIDES_MAX),
  }),
  /** Show The Table on the TV, adding the scene first if this game doesn't have it. */
  z.object({ type: z.literal("arrival.showTable") }),
  /** Play the Arrival intro on the TV from the start, adding its scene first if this game doesn't have it. */
  z.object({ type: z.literal("arrival.showIntro") }),
  /** Move the TV intro to a step (Back, Next), or pause it there. */
  z.object({ type: z.literal("arrival.introGo"), step: z.number().int().min(0).max(INTRO_STEPS_MAX), paused: z.boolean() }),

  z.object({ type: z.literal("game.rename"), name: text(120).min(1) }),
  z.object({ type: z.literal("game.vtt"), url: text(300) }),
  z.object({ type: z.literal("game.town"), town: text(60) }),
  z.object({
    type: z.literal("game.renownRanks"),
    ranks: z.array(z.object({ name: text(40).optional(), meaning: text(120).optional(), pay: text(40).optional(), raised: text(80).optional(), points: z.number().int().min(0).max(RENOWN_POINTS_MAX).optional() })).max(RENOWN_MAX + 1),
  }),

  // Random tables (DM-only).
  z.object({ type: z.literal("table.add"), table: tableBody }),
  z.object({ type: z.literal("table.update"), tableId: id, table: tableBody }),
  z.object({ type: z.literal("table.remove"), tableId: id }),
  /** The Worldbuilder style guide. */
  z.object({ type: z.literal("game.builderNotes"), text: text(BUILDER_NOTES_MAX) }),

  // Combat mode.
  ...fightDmCommands,

  // The storyboard (DM-only planning).
  ...storyDmCommands,

  // Practice mode (practice copies only).
  ...practiceDmCommands,

  // Companions and hirelings.
  ...companionDmCommands,

  // The off-script kit.
  ...offscriptDmCommands,

  // Session invites.
  ...inviteDmCommands,

  // Character sheets.
  ...sheetDmCommands,

  // Feature switches.
  ...featureDmCommands,

  // Rooms at the inn.
  ...roomDmCommands,

  // Secret whispers.
  ...whisperDmCommands,
]);

/** Commands a player may send about themselves. */
export const playerCommand = z.discriminatedUnion("type", [
  z.object({ type: z.literal("me.update"), patch: z.object({ name: text(32), dndbUrl: text(300), initBonus: z.number().int().min(-10).max(20) }).partial() }),
  z.object({ type: z.literal("me.lock"), key: z.string().min(4).max(128) }),
  z.object({ type: z.literal("me.look"), look: lookInput.nullable() }),
  /** Marked away but at the table: ask the DM to mark me here (cancel: never mind). Only the DM marks anyone present. */
  z.object({ type: z.literal("me.askHere"), cancel: z.boolean().optional() }),
  /** expectedUnitCp: the price the phone showed; refused if it has changed since. */
  // question: the answer to the item's prompt. flyer: "Post on the notice board".
  z.object({ type: z.literal("me.requestBuy"), itemId: id, qty: z.number().int().min(1).max(99), note: text(120), expectedUnitCp: cp.optional(), question: text(300).optional(), flyer: flyerText.optional(), rewardCp: cp.max(10_000_000).optional() }),
  z.object({ type: z.literal("me.contribute"), itemId: id, amountCp: cp.min(1), note: text(120) }),
  z.object({ type: z.literal("me.cancelRental"), rentalId: id }),
  z.object({ type: z.literal("me.requestGive"), toPlayerId: id, amountCp: cp.min(1), note: text(120) }),
  z.object({ type: z.literal("me.cancelRequest"), requestId: id }),
  /** "Take this job": asks the DM. */
  z.object({ type: z.literal("me.takeJob"), jobId: id, note: text(120) }),
  // The Chronicle: players write notes and edit, move or delete their own.
  z.object({ type: z.literal("me.vote"), leadId: id }),
  z.object({ type: z.literal("me.noteAdd"), text: noteText, tags: noteTags.optional(), chapterId: id.optional() }),
  z.object({ type: z.literal("me.noteUpdate"), noteId: id, patch: notePatch }),
  z.object({ type: z.literal("me.noteRemove"), noteId: id }),
  /** Move my token on the map that's on the TV (not if the DM locked it). */
  z.object({ type: z.literal("me.tokenMove"), x: frac, y: frac }),
  /** Roll dice from the phone: on the TV for the table, or for the DM only. The DM sees every roll. */
  z.object({ type: z.literal("me.diceRoll"), dice: diceAsk, plus: dicePlus, tv: z.boolean() }),
  // Combat mode: initiative, my HP, death saves, end my turn.
  ...fightPlayerCommands,
  // Companions I control.
  ...companionPlayerCommands,
  // My character sheet.
  ...sheetPlayerCommands,
  ...buildCommands,
  // The tabs I hide.
  ...featurePlayerCommands,
  // Whispers the DM sent me.
  ...whisperPlayerCommands,
]);

/** Commands the server issues itself; never accepted from a client. */
export type SystemCommand =
  | { type: "system.join"; handle: string; name: string; keyHash?: string }
  | { type: "system.hello"; playerId: string }
  | { type: "system.knock"; handle: string; name?: string }
  | { type: "me.lockHashed"; keyHash: string }
  /** From /api/arrival: the server has already matched the link code to playerId. */
  | { type: "system.arrivalStep"; playerId: string; step: "open" | "finish" }
  | { type: "system.arrivalClaim"; playerId: string; character: string; why: string; pick?: string | null }
  /** Lock an unlocked player's name with their Arrival link, so the link signs their phone in. */
  | { type: "system.arrivalKey"; playerId: string; keyHash: string }
  /** First sign-in with a key on a name nobody has locked yet: the name is now tied to that key (trust on first use). */
  | { type: "system.autoLock"; playerId: string; keyHash: string }
  /** From /api/invite: a phone claims a seat. keyHash: sha-256 of the key that phone keeps. playerId: a player whose saved sign-in on that phone the server checked. */
  | { type: "system.inviteClaim"; inviteId: string; keyHash: string; name: string; character: string; playerId?: string }
  /** From /api/invite: the phone holding entryId's key gives the seat back, or leaves the waitlist. */
  | { type: "system.inviteDrop"; inviteId: string; entryId: string }
  /** The DM approved Worldbuilder drafts (see builderOps.ts). Built by the server from stored drafts, never sent by a client. */
  | { type: "system.builderApply"; ops: BuilderOp[] };

export type DmCommand = z.infer<typeof dmCommand>;
export type PlayerCommand = z.infer<typeof playerCommand>;
export type Command = DmCommand | Exclude<PlayerCommand, { type: "me.lock" }> | SystemCommand;
