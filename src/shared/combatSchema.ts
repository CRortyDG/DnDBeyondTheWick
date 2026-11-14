// Combat mode commands. Spread into the DM and player command lists in commands.ts.
import { z } from "zod";

const id = z.string().min(1).max(64);
const text = (max: number) => z.string().max(max);
const cp = z.number().int().min(0).max(1_000_000_000);
const small = z.number().int().min(-99).max(999);
const hpNum = z.number().int().min(0).max(9999);
const dice = z.string().max(40).regex(/^\s*(\d*d\d+\s*([+-]\s*\d+)?|\d+)\s*$/i, "HP must be a number like 21 or dice like 6d6");

export const monsterBody = z.object({
  name: text(80).min(1),
  displayName: text(80),
  ac: z.number().int().min(0).max(50),
  hp: dice,
  initBonus: z.number().int().min(-10).max(20),
  speed: text(80),
  attacks: z.array(z.object({ name: text(80), bonus: z.number().int().min(-10).max(30), damage: text(80) })).max(12),
  abilities: z
    .array(
      z.object({
        id: text(40).optional(),
        name: text(80).min(1),
        text: text(600),
        recharge: z.number().int().min(2).max(6).optional(),
        uses: z.number().int().min(1).max(9).optional(),
        onDeath: z.boolean().optional(),
      }),
    )
    .max(16),
  resist: text(200),
  immune: text(200),
  notes: text(2000),
  dmNote: text(2000),
  sceneId: id.nullable().optional(),
});

const group = z.object({ templateId: id, count: z.number().int().min(1).max(20) });
const mode = z.enum(["damage", "heal", "temp"]);
const ids = z.array(id).min(1).max(40);

export const fightDmCommands = [
  z.object({ type: z.literal("monster.add"), monster: monsterBody }),
  z.object({ type: z.literal("monster.update"), monsterId: id, monster: monsterBody }),
  z.object({ type: z.literal("monster.remove"), monsterId: id }),

  /** Set up a fight: every player at the table, plus these monsters. The TV shows "Roll initiative!". */
  z.object({ type: z.literal("fight.start"), groups: z.array(group).max(10).optional(), where: text(120).optional() }),
  /** Monsters from a template. Mid-fight: at this initiative, or right after another combatant. */
  z.object({ type: z.literal("fight.add"), templateId: id, count: z.number().int().min(1).max(20), init: small.nullable().optional(), after: id.optional() }),
  /** A quick one-off monster. */
  z.object({ type: z.literal("fight.addQuick"), name: text(80).min(1), init: small.nullable(), hp: hpNum.min(1), ac: z.number().int().min(0).max(50), after: id.optional() }),
  z.object({ type: z.literal("fight.addPlayer"), playerId: id }),
  z.object({ type: z.literal("fight.remove"), combatantId: id }),
  z.object({ type: z.literal("fight.init"), combatantId: id, init: small.nullable(), bonus: small.nullable().optional() }),
  /** d20 + bonus for these monsters (default: every monster without one). */
  z.object({ type: z.literal("fight.rollInit"), combatantIds: z.array(id).max(40).optional() }),
  /** Drag to reorder: put a combatant at this position. */
  z.object({ type: z.literal("fight.move"), combatantId: id, to: z.number().int().min(0).max(60) }),
  /** Delay: act right after another combatant from now on. */
  z.object({ type: z.literal("fight.delay"), combatantId: id, afterId: id }),
  z.object({ type: z.literal("fight.begin") }),
  z.object({ type: z.literal("fight.next") }),
  z.object({ type: z.literal("fight.back") }),
  z.object({ type: z.literal("fight.hp"), combatantIds: ids, mode, amount: hpNum.min(1), crit: z.boolean().optional() }),
  z.object({ type: z.literal("fight.setHp"), combatantId: id, hp: hpNum.optional(), maxHp: hpNum.optional(), tempHp: hpNum.optional() }),
  z.object({
    type: z.literal("fight.condition"),
    combatantIds: ids,
    name: text(40).min(1),
    level: z.number().int().min(1).max(6).optional(),
    rounds: z.number().int().min(1).max(100).optional(),
    tick: z.enum(["start", "end"]).optional(),
  }),
  z.object({ type: z.literal("fight.uncondition"), combatantId: id, conditionId: id }),
  z.object({
    type: z.literal("fight.patch"),
    combatantIds: ids,
    patch: z.object({ hidden: z.boolean(), revealed: z.boolean(), concentrating: z.boolean(), note: text(1000), name: text(80).min(1), displayName: text(80) }).partial(),
  }),
  /** use / unuse: tick or untick. roll: d6 for a recharge. recharged: ready again. */
  z.object({ type: z.literal("fight.ability"), combatantId: id, abilityId: id, act: z.enum(["use", "unuse", "roll", "recharged"]) }),
  z.object({ type: z.literal("fight.deathSave"), combatantId: id, mark: z.enum(["ok", "fail", "nat20", "unok", "unfail"]) }),
  z.object({ type: z.literal("fight.pause"), paused: z.boolean() }),
  z.object({ type: z.literal("fight.settings"), timerSec: z.number().int().min(10).max(600).nullable().optional(), where: text(120).optional(), dmNotes: text(4000).optional() }),
  /** Dismiss one reminder, or all of them. */
  z.object({ type: z.literal("fight.dismiss"), reminderId: id.optional() }),
  /** The TV shows "The fight is over". */
  z.object({ type: z.literal("fight.end") }),
  /** Back to the fight from the end card. */
  z.object({ type: z.literal("fight.reopen") }),
  /**
   * Wrap up: pay the loot into purses (once), write the Chronicle note (null: none),
   * keep a summary and put the TV back on the scene from before the fight.
   */
  z.object({
    type: z.literal("fight.close"),
    payouts: z.array(z.object({ playerId: id, cp })).max(50).optional(),
    items: text(600).optional(),
    note: text(2000).nullable().optional(),
  }),
  /** Throw a fight away (set up by mistake): no history, no Chronicle. */
  z.object({ type: z.literal("fight.cancel") }),
] as const;

export const fightPlayerCommands = [
  z.object({ type: z.literal("me.initiative"), init: small.nullable() }),
  /** Damage, healing or temp HP; or set current/max; or the "Show my HP on the TV" toggle. */
  z.object({ type: z.literal("me.hp"), mode: mode.optional(), amount: hpNum.min(1).optional(), cur: hpNum.optional(), max: hpNum.optional(), temp: hpNum.optional(), tv: z.boolean().optional() }),
  z.object({ type: z.literal("me.deathSave"), mark: z.enum(["ok", "fail", "nat20", "unok", "unfail"]) }),
  z.object({ type: z.literal("me.endTurn") }),
] as const;
