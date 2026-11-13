import { z } from "zod";

const id = z.string().min(1).max(64);
const text = (max: number) => z.string().max(max);
const cp = z.number().int().min(0).max(1_000_000_000);
const hotkey = z.number().int().min(0).max(9).nullable();

const artSchema = z.object({
  builtin: z.enum(["candlefair-board", "artum-notice", "artum", "mags-wick", "chef", "merchant-sigil"]).optional(),
  url: z.string().max(2048).optional(),
});

const SCENE_KINDS = ["notice", "portrait", "handout", "image", "black", "map"] as const;
const frac = z.number().min(0).max(1);
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
  })
  .partial();

const itemPatch = z
  .object({
    shopId: id,
    name: text(120),
    priceCp: cp,
    description: text(600),
    lockReason: text(160),
    hidePrice: z.boolean(),
  })
  .partial();

/** Commands only the DM may send. */
export const dmCommand = z.discriminatedUnion("type", [
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
  /** Zoom the TV toward a pin on the live map, or back out with null. */
  z.object({ type: z.literal("live.focus"), pinId: id.nullable() }),
  /** Add the Candlefair and Sword Coast maps to a game created before maps existed. */
  z.object({ type: z.literal("map.addSeedMaps") }),

  z.object({ type: z.literal("live.shop"), open: z.boolean(), shopId: id.optional() }),
  z.object({ type: z.literal("live.purse"), visible: z.boolean() }),

  z.object({ type: z.literal("money.adjust"), playerId: id, amountCp: z.number().int().min(-1_000_000_000).max(1_000_000_000), note: text(200), allowDebt: z.boolean().optional() }),
  z.object({ type: z.literal("money.payAll"), amountCp: cp, note: text(200), playerIds: z.array(id).max(50) }),
  z.object({ type: z.literal("money.buy"), playerId: id, itemId: id }),

  z.object({ type: z.literal("player.add"), name: text(32) }),
  z.object({ type: z.literal("player.update"), playerId: id, patch: z.object({ name: text(32), dndbUrl: text(300), away: z.boolean(), dropIn: z.boolean(), handle: text(40) }).partial() }),
  z.object({ type: z.literal("player.archive"), playerId: id, archived: z.boolean() }),
  z.object({ type: z.literal("player.remove"), playerId: id }),
  z.object({ type: z.literal("player.clearKey"), playerId: id }),
  z.object({ type: z.literal("player.inspire"), playerId: id, on: z.boolean() }),

  z.object({ type: z.literal("shop.add"), name: text(80), subtitle: text(160) }),
  z.object({ type: z.literal("shop.update"), shopId: id, patch: z.object({ name: text(80), subtitle: text(160) }).partial() }),
  z.object({ type: z.literal("shop.remove"), shopId: id }),
  z.object({ type: z.literal("item.add"), item: z.object({ shopId: id, name: text(120).min(1), priceCp: cp, description: text(600), lockReason: text(160), hidePrice: z.boolean() }) }),
  z.object({ type: z.literal("item.update"), itemId: id, patch: itemPatch }),
  z.object({ type: z.literal("item.remove"), itemId: id }),

  z.object({ type: z.literal("session.start"), title: text(120).optional() }),
  z.object({ type: z.literal("session.end") }),
  z.object({ type: z.literal("session.update"), sessionId: id, patch: z.object({ title: text(120), number: z.number().int().min(1).max(9999) }).partial() }),
  z.object({ type: z.literal("session.reopen"), sessionId: id }),
  z.object({ type: z.literal("session.remove"), sessionId: id }),

  z.object({ type: z.literal("door.set"), closed: z.boolean() }),
  z.object({ type: z.literal("table.seats"), max: z.number().int().min(1).max(12) }),
  z.object({ type: z.literal("knock.admit"), knockId: id }),
  z.object({ type: z.literal("knock.dismiss"), knockId: id }),

  z.object({ type: z.literal("game.rename"), name: text(120).min(1) }),
  z.object({ type: z.literal("game.vtt"), url: text(300) }),
]);

/** Commands a player may send about themselves. */
export const playerCommand = z.discriminatedUnion("type", [
  z.object({ type: z.literal("me.update"), patch: z.object({ name: text(32), dndbUrl: text(300) }).partial() }),
  z.object({ type: z.literal("me.lock"), key: z.string().min(4).max(128) }),
]);

/** Commands the server issues itself; never accepted from a client. */
export type SystemCommand =
  | { type: "system.join"; handle: string; name: string; keyHash?: string }
  | { type: "system.hello"; playerId: string }
  | { type: "system.knock"; handle: string }
  | { type: "me.lockHashed"; keyHash: string };

export type DmCommand = z.infer<typeof dmCommand>;
export type PlayerCommand = z.infer<typeof playerCommand>;
export type Command = DmCommand | Exclude<PlayerCommand, { type: "me.lock" }> | SystemCommand;
