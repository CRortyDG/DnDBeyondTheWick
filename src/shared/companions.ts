// Companions and hirelings: NPCs who travel with the party. Players run them in
// fights (the controller's phone gets their turn); the DM voices them otherwise.
//
// A CompanionTemplate is the stat block (DM-only, like a monster template). A
// Companion is one with the party now. In a fight it's a combatant of kind
// "companion" whose HP lives on the combatant (like a monster's) and is copied
// back onto the Companion after every fight command, so it carries between fights.

import { z } from "zod";
import type { Combatant, Companion, CompanionField, CompanionTemplate, Fight, GameState, MonsterTemplate, Player } from "./types";
import { healthState, type HealthState } from "./combat";
import { penName } from "./chronicle";

export const COMPANION_FIELDS: CompanionField[] = ["ac", "hp", "initBonus", "speed", "attacks", "abilities", "resist"];
export const COMPANION_FIELD_LABEL: Record<CompanionField, string> = {
  ac: "AC",
  hp: "HP numbers",
  initBonus: "Initiative bonus",
  speed: "Speed",
  attacks: "Attacks",
  abilities: "Abilities",
  resist: "Resistances",
};
export const TEMPLATES_MAX = 60;
const COMPANIONS_KEPT = 40;

// ---------------------------------------------------------------------------
// Commands

const id = z.string().min(1).max(64);
const text = (max: number) => z.string().max(max);
const mode = z.enum(["damage", "heal", "temp"]);
const hpNum = z.number().int().min(0).max(9999);

export const companionBody = z.object({
  name: text(80).min(1),
  sceneId: id.nullable().optional(),
  entryId: id.nullable().optional(),
  combat: z.boolean(),
  ac: z.number().int().min(0).max(50),
  hp: z.number().int().min(1).max(999),
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
      }),
    )
    .max(16),
  resist: text(200),
  offers: text(600),
  dmNote: text(2000),
  hidden: z.array(z.enum(["ac", "hp", "initBonus", "speed", "attacks", "abilities", "resist"])).max(7),
  tvHealth: z.enum(["hp", "state"]),
  atZero: z.enum(["saves", "dies"]),
  takesShare: z.boolean(),
  needs: z.enum(["friendly", "ally"]).nullable().optional(),
});
export type CompanionBody = z.infer<typeof companionBody>;

export const companionDmCommands = [
  z.object({ type: z.literal("companion.templateAdd"), template: companionBody }),
  z.object({ type: z.literal("companion.templateUpdate"), templateId: id, template: companionBody }),
  z.object({ type: z.literal("companion.templateRemove"), templateId: id }),
  /** Attach one to the party: for this session, or until dismissed. controllerId: a player, or "dm". */
  z.object({ type: z.literal("companion.attach"), templateId: id, controllerId: id, stay: z.enum(["session", "until"]), follow: z.boolean().optional() }),
  z.object({
    type: z.literal("companion.update"),
    companionId: id,
    controllerId: id.optional(),
    follow: z.boolean().optional(),
    stay: z.enum(["session", "until"]).optional(),
    name: text(80).min(1).optional(),
    hp: hpNum.optional(),
    maxHp: hpNum.min(1).optional(),
  }),
  /** They leave the party (a hireling's rental ends too). */
  z.object({ type: z.literal("companion.dismiss"), companionId: id }),
  /** A long rest: full HP, abilities ready, back on their feet. */
  z.object({ type: z.literal("companion.rest"), companionId: id }),
  /** Session end, a hireling: keep them for the next session (the buyer pays now) or let them go (companion.dismiss). */
  z.object({ type: z.literal("companion.keep"), companionId: id }),
  /** A shop item hires this companion (it becomes a per-session hire, like rent), or stops doing so (itemId null: every item). */
  z.object({ type: z.literal("companion.hireItem"), templateId: id, itemId: id.nullable() }),
  /** Take a dead companion's record off the list. */
  z.object({ type: z.literal("companion.forget"), companionId: id }),
  /** At 0 HP in a fight: unconscious with death saves, or dead. */
  z.object({ type: z.literal("fight.companionFate"), combatantId: id, fate: z.enum(["saves", "dies"]) }),
] as const;

/** The controller's phone. Checked against the companion's controller on the server. */
export const companionPlayerCommands = [
  z.object({ type: z.literal("me.companionHp"), companionId: id, mode, amount: hpNum.min(1) }),
  z.object({ type: z.literal("me.companionAbility"), companionId: id, abilityId: id, act: z.enum(["use", "unuse"]) }),
  z.object({ type: z.literal("me.companionInit"), companionId: id, init: z.number().int().min(-99).max(999).nullable() }),
  z.object({ type: z.literal("me.companionDeathSave"), companionId: id, mark: z.enum(["ok", "fail", "nat20", "unok", "unfail"]) }),
  z.object({ type: z.literal("me.companionEndTurn"), companionId: id }),
] as const;

export type CompanionDmCommand = z.infer<(typeof companionDmCommands)[number]>;
export type CompanionCommand = Exclude<CompanionDmCommand, { type: "fight.companionFate" }>;

/** companion.* (fight.companionFate goes with the other fight commands). */
export function isCompanionCommand(cmd: { type: string }): cmd is CompanionCommand {
  return cmd.type.startsWith("companion.");
}
export type CompanionPlayerCommand = z.infer<(typeof companionPlayerCommands)[number]>;

// ---------------------------------------------------------------------------
// Reading

export function companionTemplatesOf(g: Pick<GameState, "companionTemplates">): CompanionTemplate[] {
  return g.companionTemplates ?? [];
}

export function companionsOf(g: Pick<GameState, "companions">): Companion[] {
  return g.companions ?? [];
}

/** With the party now (in a shared world, the party at the table). */
export function companionsWith(g: Pick<GameState, "companions" | "partyId" | "world">): Companion[] {
  return companionsOf(g).filter((c) => c.status === "with" && (!g.world || !c.partyId || c.partyId === g.partyId));
}

/** A companion template, read the way the fight code reads monster templates (abilities, recharge, DM note). */
export function templateAsMonster(t: CompanionTemplate): MonsterTemplate {
  return {
    id: t.id,
    name: t.name,
    displayName: "",
    ac: t.ac,
    hp: String(t.hp),
    initBonus: t.initBonus,
    speed: t.speed,
    attacks: t.attacks,
    abilities: t.abilities,
    resist: t.resist,
    immune: "",
    notes: t.offers,
    dmNote: t.dmNote,
    ...(t.sceneId ? { sceneId: t.sceneId } : {}),
  };
}

export function controllerName(g: Pick<GameState, "players">, c: Companion): string {
  if (c.controllerId === "dm") return "the DM";
  const p = g.players.find((x) => x.id === c.controllerId);
  return p ? penName(p) : "nobody";
}

/** A fight combatant for a companion. Its HP and spent abilities come from the companion. */
export function companionCombatant(cid: string, c: Companion, t: CompanionTemplate | undefined): Combatant {
  return {
    id: cid,
    kind: "companion",
    companionId: c.id,
    ...(t ? { templateId: t.id } : {}),
    name: c.name,
    displayName: c.name,
    revealed: true,
    hidden: false,
    init: null,
    initBonus: t?.initBonus ?? 0,
    hp: c.hp.cur,
    maxHp: c.hp.max,
    tempHp: c.hp.temp,
    ...(t ? { ac: t.ac } : {}),
    conditions: [],
    concentrating: false,
    spent: { ...c.spent },
    down: c.hp.cur <= 0,
    atZero: t?.atZero ?? "saves",
    ...(c.hp.cur <= 0 && (t?.atZero ?? "saves") === "saves" ? { deathSaves: { ok: 0, fail: 0 } } : {}),
    ...(t?.sceneId ? { sceneId: t.sceneId } : {}),
  };
}

/** After any fight command: what happened to each companion in the fight sticks to the companion. */
export function syncCompanions(s: GameState) {
  const f = s.fight;
  if (!f) return;
  for (const c of f.order) {
    if (c.kind !== "companion" || !c.companionId) continue;
    const comp = companionsOf(s).find((x) => x.id === c.companionId);
    if (!comp) continue;
    comp.hp = { cur: c.hp, max: c.maxHp, temp: c.tempHp };
    comp.spent = { ...c.spent };
  }
}

/** Followers ("acts right after their controller") take the controller's initiative and the slot after them. */
export function placeFollowers(s: GameState, f: Fight) {
  if (f.status !== "setup") return;
  for (const c of f.order.filter((x) => x.kind === "companion")) {
    const comp = companionsOf(s).find((x) => x.id === c.companionId);
    if (!comp?.follow || comp.controllerId === "dm") continue;
    const lead = f.order.find((x) => x.kind === "player" && x.playerId === comp.controllerId);
    if (!lead || lead.init === null) continue;
    c.init = lead.init;
    const rest = f.order.filter((x) => x.id !== c.id);
    // After the controller and any followers already behind them.
    let at = rest.indexOf(lead) + 1;
    while (at < rest.length && rest[at].kind === "companion" && companionsOf(s).find((x) => x.id === rest[at].companionId)?.controllerId === comp.controllerId) at++;
    rest.splice(at, 0, c);
    f.order = rest;
  }
}

// ---------------------------------------------------------------------------
// DM commands outside fights

export interface CompanionHelpers {
  now: number;
  nextId: (prefix: string) => string;
  fail: (msg: string) => never;
  task: (text: string) => void;
  /** End a rental (a hireling let go). */
  endRental: (rentalId: string) => void;
}

function cleanTemplate(b: CompanionBody, tid: string): CompanionTemplate {
  const used = new Set<string>();
  const t: CompanionTemplate = {
    id: tid,
    name: b.name.trim(),
    combat: b.combat,
    ac: b.ac,
    hp: b.hp,
    initBonus: b.initBonus,
    speed: b.speed.trim(),
    attacks: b.attacks.filter((a) => a.name.trim()).map((a) => ({ name: a.name.trim(), bonus: a.bonus, damage: a.damage.trim() })),
    abilities: b.abilities.map((a, i) => {
      let aid = (a.id ?? "").trim() || `a${i + 1}`;
      while (used.has(aid)) aid += "x";
      used.add(aid);
      return { id: aid, name: a.name.trim(), text: a.text.trim(), ...(a.recharge ? { recharge: a.recharge } : {}), ...(a.uses ? { uses: a.uses } : {}) };
    }),
    resist: b.resist.trim(),
    offers: b.offers.trim(),
    dmNote: b.dmNote.trim(),
    hidden: [...new Set(b.hidden)],
    tvHealth: b.tvHealth,
    atZero: b.atZero,
    takesShare: b.takesShare,
  };
  if (b.sceneId) t.sceneId = b.sceneId;
  if (b.entryId) t.entryId = b.entryId;
  if (b.needs) t.needs = b.needs;
  return t;
}

/** A new companion with the party, from a template. */
export function attachCompanion(
  s: GameState,
  t: CompanionTemplate,
  controllerId: string,
  stay: Companion["stay"],
  h: Pick<CompanionHelpers, "now" | "nextId">,
  extra: Partial<Companion> = {},
): Companion {
  const list = (s.companions ??= []);
  const same = companionsWith(s).filter((c) => c.templateId === t.id).length;
  const comp: Companion = {
    id: h.nextId("cm"),
    templateId: t.id,
    name: same ? `${t.name} ${same + 1}` : t.name,
    hp: { cur: t.hp, max: t.hp, temp: 0 },
    spent: {},
    controllerId,
    stay,
    status: "with",
    joinedAt: h.now,
    ...(s.world && s.partyId ? { partyId: s.partyId } : {}),
    ...extra,
  };
  list.push(comp);
  // Keep the record short: drop the oldest who left.
  const gone = list.filter((c) => c.status !== "with");
  if (gone.length > COMPANIONS_KEPT) {
    const drop = new Set(gone.slice(0, gone.length - COMPANIONS_KEPT).map((c) => c.id));
    s.companions = list.filter((c) => !drop.has(c.id));
  }
  return comp;
}

/** They leave the party. In a fight they leave the turn order too. */
export function dismissCompanion(s: GameState, comp: Companion, h: Pick<CompanionHelpers, "now" | "endRental">) {
  if (comp.status === "with") comp.status = "gone";
  comp.endedAt = h.now;
  if (comp.hire) h.endRental(comp.hire.rentalId);
  if (s.fight) {
    const c = s.fight.order.find((x) => x.companionId === comp.id);
    if (c && s.fight.currentId !== c.id) s.fight.order = s.fight.order.filter((x) => x.id !== c.id);
  }
}

export function applyCompanion(s: GameState, cmd: Exclude<CompanionDmCommand, { type: "fight.companionFate" | "companion.keep" }>, h: CompanionHelpers) {
  const templates = () => (s.companionTemplates ??= []);
  const template = (tid: string) => templates().find((t) => t.id === tid) ?? h.fail("That companion isn't in your list.");
  const companion = (cid: string) => companionsOf(s).find((c) => c.id === cid) ?? h.fail("That companion isn't with the party.");
  const checkController = (pid: string) => {
    if (pid === "dm") return;
    const p: Player | undefined = s.players.find((x) => x.id === pid);
    if (!p || p.archived) h.fail("Pick a player at the table.");
  };
  switch (cmd.type) {
    case "companion.templateAdd": {
      if (templates().length >= TEMPLATES_MAX) h.fail("The companion list is full.");
      templates().push(cleanTemplate(cmd.template, h.nextId("ct")));
      break;
    }
    case "companion.templateUpdate": {
      const i = templates().findIndex((t) => t.id === cmd.templateId);
      if (i < 0) h.fail("That companion isn't in your list.");
      const t = cleanTemplate(cmd.template, cmd.templateId);
      templates()[i] = t;
      // Their max HP follows the stat block (current HP stays, up to it).
      for (const c of companionsWith(s).filter((x) => x.templateId === t.id)) {
        c.hp.max = t.hp;
        c.hp.cur = Math.min(c.hp.cur, t.hp);
      }
      break;
    }
    case "companion.templateRemove": {
      if (companionsWith(s).some((c) => c.templateId === cmd.templateId)) h.fail("They're with the party. Dismiss them first.");
      s.companionTemplates = templates().filter((t) => t.id !== cmd.templateId);
      for (const it of s.items) if (it.companionTemplateId === cmd.templateId) delete it.companionTemplateId;
      break;
    }
    case "companion.attach": {
      const t = template(cmd.templateId);
      checkController(cmd.controllerId);
      const comp = attachCompanion(s, t, cmd.controllerId, cmd.stay, h, cmd.follow ? { follow: true } : {});
      // Joining mid-fight: they get a place in the order (the DM sets their initiative).
      if (s.fight && s.fight.status !== "over" && t.combat) {
        s.fight.order.push(companionCombatant(h.nextId("c"), comp, t));
      }
      break;
    }
    case "companion.update": {
      const c = companion(cmd.companionId);
      if (cmd.controllerId !== undefined) {
        checkController(cmd.controllerId);
        c.controllerId = cmd.controllerId;
      }
      if (cmd.follow !== undefined) {
        if (cmd.follow) c.follow = true;
        else delete c.follow;
      }
      if (cmd.stay) c.stay = cmd.stay;
      if (cmd.name) c.name = cmd.name.trim();
      if (cmd.maxHp !== undefined) c.hp.max = cmd.maxHp;
      if (cmd.hp !== undefined) c.hp.cur = cmd.hp;
      c.hp.cur = Math.min(c.hp.cur, c.hp.max);
      const fc = s.fight?.order.find((x) => x.companionId === c.id);
      if (fc) {
        if (cmd.name) fc.name = fc.displayName = c.name;
        fc.hp = c.hp.cur;
        fc.maxHp = c.hp.max;
        if (fc.hp > 0) {
          fc.down = false;
          delete fc.deathSaves;
          delete fc.gone;
        }
      }
      break;
    }
    case "companion.dismiss": {
      const c = companion(cmd.companionId);
      dismissCompanion(s, c, h);
      break;
    }
    case "companion.rest": {
      const c = companion(cmd.companionId);
      if (c.status === "dead") h.fail(`${c.name} is dead.`);
      c.hp = { cur: c.hp.max, max: c.hp.max, temp: 0 };
      c.spent = {};
      break;
    }
    case "companion.hireItem": {
      template(cmd.templateId);
      for (const it of s.items) if (it.companionTemplateId === cmd.templateId && it.id !== cmd.itemId) delete it.companionTemplateId;
      if (cmd.itemId) {
        const it = s.items.find((x) => x.id === cmd.itemId) ?? h.fail("That item doesn't exist.");
        if (it.kind !== "recurring" && it.kind !== "purchase" && it.kind !== "service") h.fail(`${it.name} can't be a hire. Pick a plain item, service or rental.`);
        it.kind = "recurring";
        it.oneAtATime = true;
        it.companionTemplateId = cmd.templateId;
      }
      break;
    }
    case "companion.forget": {
      const c = companion(cmd.companionId);
      if (c.status === "with") h.fail("Dismiss them first.");
      s.companions = companionsOf(s).filter((x) => x.id !== c.id);
      break;
    }
  }
}

/** The DM's choice at 0 HP. Dying is final: the companion leaves the party, and the DM gets a nudge about relationships. */
export function companionFate(s: GameState, c: Combatant, fate: "saves" | "dies", h: Pick<CompanionHelpers, "now" | "task" | "fail" | "endRental">) {
  if (c.kind !== "companion") h.fail("That isn't a companion.");
  c.atZero = fate;
  const comp = companionsOf(s).find((x) => x.id === c.companionId);
  if (fate === "saves") {
    if (c.hp > 0) return;
    c.down = true;
    delete c.gone;
    c.deathSaves ??= { ok: 0, fail: 0 };
    if (comp?.status === "dead") comp.status = "with";
    return;
  }
  c.hp = 0;
  c.down = true;
  delete c.deathSaves;
  if (comp && comp.status !== "dead") {
    comp.status = "dead";
    comp.endedAt = h.now;
    if (comp.hire) h.endRental(comp.hire.rentalId);
    const t = companionTemplatesOf(s).find((x) => x.id === comp.templateId);
    const person = t?.entryId ? (s.entries ?? []).find((e) => e.id === t.entryId) : undefined;
    h.task(person ? `${comp.name} died in a fight. Check ${person.name}'s relationships in Discover.` : `${comp.name} died in a fight.`);
  }
}

/** At session end: companions along for the session go home. */
export function endSessionCompanions(s: GameState, now: number) {
  for (const c of companionsWith(s)) {
    if (c.stay === "session" && !c.hire) {
      c.status = "gone";
      c.endedAt = now;
    }
  }
}

/** A hireling's rental ended (let go, or the player gave it up): they leave. */
export function rentalEnded(s: GameState, rentalId: string, now: number) {
  for (const c of companionsOf(s)) {
    if (c.hire?.rentalId === rentalId && c.status === "with") {
      c.status = "gone";
      c.endedAt = now;
      if (s.fight) {
        const fc = s.fight.order.find((x) => x.companionId === c.id);
        if (fc && s.fight.currentId !== fc.id) s.fight.order = s.fight.order.filter((x) => x.id !== fc.id);
      }
    }
  }
}

/** The person this companion is (Fennick) doesn't yet feel the way the template needs. */
export function needsWarning(g: Pick<GameState, "entries">, t: CompanionTemplate): string | null {
  if (!t.needs || !t.entryId) return null;
  const e = (g.entries ?? []).find((x) => x.id === t.entryId);
  if (!e) return null;
  const rank = { hostile: -2, wary: -1, stranger: 0, friendly: 1, ally: 2 } as const;
  const have = rank[e.relation ?? "stranger"];
  if (have >= rank[t.needs]) return null;
  return `${e.name} only joins once ${t.needs === "ally" ? "an ally" : "friendly"}. Right now: ${e.relation ?? "stranger"}.`;
}

// ---------------------------------------------------------------------------
// What the TV and phones get

/** Everyone's small card: who's with the party and how they're doing. Never DM notes, never numbers the DM keeps back. */
export interface PublicCompanion {
  id: string;
  name: string;
  combat: boolean;
  /** "Survival +5. Knows the safe paths." */
  offers: string;
  controller: string;
  health: HealthState | "dead";
  /** Only when the DM shows HP on the TV for this one. */
  hp?: { cur: number; max: number; temp: number };
  hireling: boolean;
  /** Their share of the loot, held by them ("Fennick has 14 gp"). */
  purseCp?: number;
}

/** The controller's own card: the stat block minus what the DM hid. */
export interface ControlledCompanion extends PublicCompanion {
  ac?: number;
  initBonus?: number;
  speed?: string;
  resist?: string;
  attacks?: { name: string; bonus: number; damage: string }[];
  abilities?: { id: string; name: string; text: string; recharge?: number; uses?: number; spent: number }[];
  /** Acts right after me in fights. */
  follow?: boolean;
  /** In the current fight. */
  combatantId?: string;
  init?: number | null;
  deathSaves?: { ok: number; fail: number } | null;
  conditions?: { name: string; level?: number; rounds?: number }[];
  down?: boolean;
}

export function publicCompanions(g: GameState): PublicCompanion[] {
  return companionsWith(g).map((c) => publicCompanion(g, c));
}

function publicCompanion(g: GameState, c: Companion): PublicCompanion {
  const t = companionTemplatesOf(g).find((x) => x.id === c.templateId);
  const fc = g.fight?.order.find((x) => x.companionId === c.id);
  const cur = fc ? fc.hp : c.hp.cur;
  const max = fc ? fc.maxHp : c.hp.max;
  const temp = fc ? fc.tempHp : c.hp.temp;
  const out: PublicCompanion = {
    id: c.id,
    name: c.name,
    combat: t?.combat ?? true,
    offers: t?.offers ?? "",
    controller: controllerName(g, c),
    health: c.status === "dead" ? "dead" : healthState(cur, max),
    hireling: !!c.hire,
  };
  if (c.purseCp) out.purseCp = c.purseCp;
  if (t?.tvHealth === "hp" && !t.hidden.includes("hp")) out.hp = { cur, max, temp };
  return out;
}

/** The companions this player controls, with what they may see. */
export function controlledBy(g: GameState, playerId: string): ControlledCompanion[] {
  return companionsWith(g)
    .filter((c) => c.controllerId === playerId)
    .map((c) => {
      const t = companionTemplatesOf(g).find((x) => x.id === c.templateId);
      const hide = new Set(t?.hidden ?? []);
      const fc = g.fight?.order.find((x) => x.companionId === c.id);
      const out: ControlledCompanion = publicCompanion(g, c);
      if (c.follow) out.follow = true;
      if (t) {
        if (!hide.has("hp")) out.hp = fc ? { cur: fc.hp, max: fc.maxHp, temp: fc.tempHp } : { ...c.hp };
        else delete out.hp;
        if (!hide.has("ac")) out.ac = t.ac;
        if (!hide.has("initBonus")) out.initBonus = t.initBonus;
        if (!hide.has("speed") && t.speed) out.speed = t.speed;
        if (!hide.has("resist") && t.resist) out.resist = t.resist;
        if (!hide.has("attacks")) out.attacks = t.attacks.map((a) => ({ name: a.name, bonus: a.bonus, damage: a.damage }));
        if (!hide.has("abilities")) {
          const spent = fc ? fc.spent : c.spent;
          out.abilities = t.abilities.map((a) => ({
            id: a.id,
            name: a.name,
            text: a.text,
            ...(a.recharge ? { recharge: a.recharge } : {}),
            ...(a.uses ? { uses: a.uses } : {}),
            spent: spent[a.id] ?? 0,
          }));
        }
      }
      if (fc && !fc.hidden) {
        out.combatantId = fc.id;
        out.init = fc.init;
        out.deathSaves = fc.deathSaves ? { ...fc.deathSaves } : null;
        out.down = fc.down;
        out.conditions = fc.conditions.map((x) => ({ name: x.name, ...(x.level ? { level: x.level } : {}), ...(x.rounds !== undefined ? { rounds: x.rounds } : {}) }));
      }
      return out;
    });
}
