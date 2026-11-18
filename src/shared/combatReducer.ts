// Combat mode commands, called from apply() in reducer.ts with its helpers.
// Pure: mutates the cloned state it's given, never does I/O.

import type { Command } from "./commands";
import {
  beginFight,
  canAct,
  changeHp,
  condLabel,
  CONDITIONS,
  currentOf,
  FIGHTS_KEPT,
  fightOutcome,
  groupTitle,
  insertSorted,
  reslotCombatant,
  markDeathSave,
  MAX_COMBATANTS,
  monstersFrom,
  MONSTERS_MAX,
  monstersOf,
  nextTurn,
  playerCombatant,
  playerHp,
  prevTurn,
  REMINDERS_KEPT,
  rollInitiative,
  templateByName,
  tvName,
  type HpHooks,
  type TurnHooks,
} from "./combat";
import { formatCp } from "./money";
import { companionCombatant, companionFate, companionsOf, companionsWith, companionTemplatesOf, placeFollowers, syncCompanions, templateAsMonster } from "./companions";
import { rollDice } from "./progress";
import { lootFromFight } from "./stash";
import { worldOn } from "./world";
import { featureOn } from "./features";
import type { Combatant, Fight, FightGroup, FightSummary, FoeSetup, FightMoment, FightReminder, FightReminderKind, FightUndo, GameState, LedgerEntry, LedgerKind, MonsterAbility, MonsterTemplate, Player } from "./types";
import { DM_AUTHOR } from "./types";
import type { z } from "zod";
import type { monsterBody } from "./combatSchema";

export type FightCommand = Extract<Command, { type: `fight.${string}` | `monster.${string}` | "me.initiative" | "me.hp" | "me.deathSave" | "me.endTurn" | `me.companion${string}` }>;

const FIGHT_TYPES = new Set(["me.initiative", "me.hp", "me.deathSave", "me.endTurn"]);

export function isFightCommand(cmd: Command): cmd is FightCommand {
  return cmd.type.startsWith("fight.") || cmd.type.startsWith("monster.") || cmd.type.startsWith("me.companion") || FIGHT_TYPES.has(cmd.type);
}

export interface FightHelpers {
  now: number;
  actorPlayerId: string | null;
  rand: () => number;
  nextId: (prefix: string) => string;
  fail: (msg: string, code?: string) => never;
  player: (id: string) => Player;
  move: (p: Player, amountCp: number, note: string, kind: LedgerKind, extra?: Partial<LedgerEntry>) => void;
  addNote: (authorId: string, authorName: string, text: string) => string;
  showScene: (id: string) => void;
  /** A line on the DM's to-do list. */
  task: (text: string) => void;
  /** End a rental (a hireling who died). */
  endRental: (rentalId: string) => void;
  /** A line back to the DM's screen. */
  info?: (m: string) => void;
}

/** Set up a new fight: everyone at the table, plus monsters. Fails if one is already going. */
export function startFight(s: GameState, groups: { template: MonsterTemplate; count: number }[], where: string, h: FightHelpers, missing: string[] = []): Fight {
  if (s.fight) h.fail("A fight is already going. End it first.");
  const f: Fight = {
    id: h.nextId("f"),
    status: "setup",
    title: groupTitle(groups.map((g) => ({ name: g.template.name, count: g.count }))) || "A fight",
    where: where.trim(),
    round: 0,
    currentId: null,
    order: [],
    returnSceneId: s.live.sceneId,
    timerSec: null,
    turnStartedAt: h.now,
    startedAt: h.now,
    sessionId: s.currentSessionId,
    dmNotes: "",
    reminders: [],
    steps: [],
    downed: [],
  };
  for (const p of s.players) if (!p.archived && !p.away) f.order.push(playerCombatant(h.nextId("c"), p));
  // Companions who fight come along (not porters and the like).
  for (const c of companionsWith(s)) {
    const t = companionTemplatesOf(s).find((x) => x.id === c.templateId);
    if (t?.combat) f.order.push(companionCombatant(h.nextId("c"), c, t));
  }
  for (const g of groups) f.order.push(...monstersFrom(f, g.template, g.count, () => h.nextId("c"), h.rand));
  for (const name of missing) remind(f, h, "info", `No monster template called “${name}”. Add it under Monsters, then add it here.`);
  // The DM's note on each template, once, as a reminder.
  for (const g of groups) if (g.template.dmNote.trim()) remind(f, h, "info", `${g.template.name}: ${g.template.dmNote.trim()}`);
  s.live.shopOpen = false;
  delete s.live.recapSessionId;
  s.fight = f;
  return f;
}

/** The run sheet's "fight:" line, matched against the templates by name. Does nothing if a fight is already going. */
export function startFightFromBeat(s: GameState, groups: FightGroup[], where: string, h: FightHelpers) {
  if (s.fight) return;
  const list = monstersOf(s);
  const found: { template: MonsterTemplate; count: number }[] = [];
  const missing: string[] = [];
  for (const g of groups) {
    const t = templateByName(list, g.name);
    if (t) found.push({ template: t, count: g.count });
    else missing.push(g.name);
  }
  startFight(s, found, where, h, missing);
}

function remind(f: Fight, h: Pick<FightHelpers, "nextId" | "now">, kind: FightReminderKind, text: string, extra: Partial<FightReminder> = {}) {
  // The same nudge twice (two hits on a concentrating caster) replaces the old one.
  f.reminders = f.reminders.filter((r) => !(r.kind === kind && r.combatantId === extra.combatantId && r.abilityId === extra.abilityId && kind !== "info"));
  f.reminders.push({ id: h.nextId("r"), kind, text, at: h.now, ...extra });
  if (f.reminders.length > REMINDERS_KEPT) f.reminders = f.reminders.slice(-REMINDERS_KEPT);
}

function cleanMonster(m: z.infer<typeof monsterBody>, id: string, old?: MonsterTemplate): MonsterTemplate {
  const used = new Set<string>();
  const abilities: MonsterAbility[] = m.abilities.map((a, i) => {
    let aid = (a.id ?? "").trim() || `a${i + 1}`;
    while (used.has(aid)) aid += "x";
    used.add(aid);
    const out: MonsterAbility = { id: aid, name: a.name.trim(), text: a.text.trim() };
    if (a.recharge) out.recharge = a.recharge;
    if (a.uses) out.uses = a.uses;
    if (a.onDeath) out.onDeath = true;
    return out;
  });
  const t: MonsterTemplate = {
    id,
    name: m.name.trim(),
    displayName: m.displayName.trim(),
    ac: m.ac,
    hp: m.hp.trim().replace(/\s+/g, ""),
    initBonus: m.initBonus,
    speed: m.speed.trim(),
    attacks: m.attacks.filter((a) => a.name.trim()).map((a) => ({ name: a.name.trim(), bonus: a.bonus, damage: a.damage.trim() })),
    abilities,
    resist: m.resist.trim(),
    immune: m.immune.trim(),
    notes: m.notes.trim(),
    dmNote: m.dmNote.trim(),
  };
  const scene = m.sceneId === undefined ? old?.sceneId : m.sceneId;
  if (scene) t.sceneId = scene;
  if (old?.madeBy) t.madeBy = old.madeBy;
  return t;
}

/** How many HP and condition changes Undo remembers per fight. */
export const UNDO_KEPT = 10;

type Undoable = Extract<FightCommand, { type: "fight.hp" | "fight.setHp" | "fight.condition" | "fight.uncondition" | "me.hp" | "me.companionHp" }>;

function isUndoable(cmd: FightCommand): cmd is Undoable {
  return cmd.type === "fight.hp" || cmd.type === "fight.setHp" || cmd.type === "fight.condition" || cmd.type === "fight.uncondition" || cmd.type === "me.hp" || cmd.type === "me.companionHp";
}

/** "Goblin A", "Goblin A and Brin", "Goblin A, Goblin B and 2 more". */
function namesOf(list: string[]): string {
  if (list.length <= 1) return list[0] ?? "Nobody";
  if (list.length <= 3) return `${list.slice(0, -1).join(", ")} and ${list[list.length - 1]}`;
  return `${list.slice(0, 2).join(", ")} and ${list.length - 2} more`;
}

function undoLabel(f: Fight, cmd: Undoable, touched: Combatant[]): string {
  const names = namesOf(touched.map((c) => c.name));
  const hpWords = (mode: "damage" | "heal" | "temp", amount: number, crit?: boolean) =>
    mode === "damage" ? `took ${amount} damage${crit ? " (crit)" : ""}` : mode === "heal" ? `healed ${amount}` : `got ${amount} temp HP`;
  switch (cmd.type) {
    case "fight.hp":
      return `${names} ${hpWords(cmd.mode, cmd.amount, cmd.crit)}`;
    case "fight.setHp":
      return `${names}: HP set`;
    case "fight.condition":
      return `${names}: ${cmd.name.trim()}`;
    case "fight.uncondition": {
      const cond = touched[0]?.conditions.find((x) => x.id === cmd.conditionId);
      return `${names}: ${cond?.name ?? "condition"} removed`;
    }
    case "me.hp":
      return cmd.mode && cmd.amount ? `${names} (phone) ${hpWords(cmd.mode, cmd.amount)}` : `${names} (phone) set HP`;
    case "me.companionHp":
      return `${names} (phone) ${hpWords(cmd.mode, cmd.amount)}`;
  }
  void f;
}

function snapCombatant(c: Combatant): FightUndo["combatants"][number] {
  return structuredClone({ id: c.id, hp: c.hp, maxHp: c.maxHp, tempHp: c.tempHp, down: c.down, gone: c.gone, deathSaves: c.deathSaves, concDc: c.concDc, concentrating: c.concentrating, conditions: c.conditions });
}

/** Put one change back: the combatants, players' HP and the downed list as they were, minus the reminders it added. */
function restore(s: GameState, f: Fight, u: FightUndo) {
  for (const snap of u.combatants) {
    const c = f.order.find((x) => x.id === snap.id);
    if (!c) continue;
    const { gone, deathSaves, concDc, ...rest } = structuredClone(snap);
    Object.assign(c, rest);
    if (gone) c.gone = gone;
    else delete c.gone;
    if (deathSaves) c.deathSaves = deathSaves;
    else delete c.deathSaves;
    if (concDc !== undefined) c.concDc = concDc;
    else delete c.concDc;
  }
  for (const ps of u.players) {
    const p = s.players.find((x) => x.id === ps.id);
    if (!p) continue;
    const tv = p.hp?.tv;
    if (ps.hp) {
      const { tv: _tv, ...hp } = ps.hp;
      p.hp = tv === false ? { ...hp, tv } : hp;
    } else delete p.hp;
  }
  f.downed = [...u.downed];
  const added = new Set(u.reminders);
  f.reminders = f.reminders.filter((r) => !added.has(r.id));
}

export function applyFight(s: GameState, cmd: FightCommand, h: FightHelpers): void {
  applyFightUndoable(s, cmd, h);
  // What happened to companions in the fight sticks to them (HP, abilities used).
  syncCompanions(s);
}

function applyFightUndoable(s: GameState, cmd: FightCommand, h: FightHelpers): void {
  if (cmd.type === "fight.undo") {
    const f = s.fight ?? h.fail("There's no fight going.");
    const list = f.history ?? [];
    if (!list.length) h.fail("Nothing to undo.");
    const at = cmd.undoId ? list.findIndex((u) => u.id === cmd.undoId) : list.length - 1;
    if (at < 0) h.fail("That change can't be undone any more.");
    // Newest first, so an older change never overwrites a newer one.
    for (let i = list.length - 1; i >= at; i--) restore(s, f, list[i]);
    f.history = list.slice(0, at);
    return;
  }
  if (!isUndoable(cmd) || !s.fight) {
    applyFightCore(s, cmd, h);
    return;
  }
  const f = s.fight;
  // Who this change could touch.
  const ids = new Set<string>();
  if (cmd.type === "fight.hp" || cmd.type === "fight.condition") cmd.combatantIds.forEach((x) => ids.add(x));
  else if (cmd.type === "fight.setHp" || cmd.type === "fight.uncondition") ids.add(cmd.combatantId);
  else if (cmd.type === "me.companionHp") {
    const c = f.order.find((x) => x.companionId === cmd.companionId);
    if (c) ids.add(c.id);
  } else {
    const c = f.order.find((x) => x.kind === "player" && x.playerId === h.actorPlayerId);
    if (c) ids.add(c.id);
  }
  const touched = f.order.filter((c) => ids.has(c.id));
  const playerIds = new Set(touched.map((c) => c.playerId).filter((x): x is string => !!x));
  if (cmd.type === "me.hp" && h.actorPlayerId) playerIds.add(h.actorPlayerId);
  if (cmd.type === "me.companionHp" && !touched.length) {
    applyFightCore(s, cmd, h);
    return;
  }
  const before: FightUndo = {
    id: h.nextId("u"),
    label: undoLabel(f, cmd, touched),
    at: h.now,
    by: cmd.type === "me.hp" || cmd.type === "me.companionHp" ? { playerId: h.actorPlayerId ?? "" } : "dm",
    combatants: touched.map(snapCombatant),
    players: [...playerIds].map((id) => {
      const p = s.players.find((x) => x.id === id);
      return p?.hp ? { id, hp: { ...p.hp } } : { id };
    }),
    downed: [...f.downed],
    reminders: [],
  };
  const reminderIds = new Set(f.reminders.map((r) => r.id));
  // The "show my HP on the TV" toggle isn't an HP change.
  const hpOf = (id: string) => {
    const hp = s.players.find((x) => x.id === id)?.hp;
    return hp ? [hp.cur, hp.max, hp.temp] : null;
  };
  const shape = () => JSON.stringify([touched.map(snapCombatant), [...playerIds].map(hpOf), f.downed]);
  const was = shape();
  applyFightCore(s, cmd, h);
  // Nothing changed (a player tweaking the TV toggle, a heal at full HP): nothing to undo.
  if (!s.fight || shape() === was) return;
  before.reminders = s.fight.reminders.filter((r) => !reminderIds.has(r.id)).map((r) => r.id);
  const hist = (s.fight.history ??= []);
  hist.push(before);
  if (hist.length > UNDO_KEPT) s.fight.history = hist.slice(-UNDO_KEPT);
}

function applyFightCore(s: GameState, cmd: FightCommand, h: FightHelpers): void {
  const { fail } = h;
  const tpl = (id?: string): MonsterTemplate | undefined => {
    if (!id) return undefined;
    const m = monstersOf(s).find((t) => t.id === id);
    if (m) return m;
    const ct = companionTemplatesOf(s).find((t) => t.id === id);
    return ct ? templateAsMonster(ct) : undefined;
  };
  const fight = (): Fight => s.fight ?? fail("There's no fight going.");
  const running = (): Fight => {
    const f = fight();
    if (f.status === "setup") fail("Press Begin first.");
    if (f.status === "over") fail("The fight is over.");
    return f;
  };
  const who = (f: Fight, id: string): Combatant => f.order.find((c) => c.id === id) ?? fail("They're not in this fight.");
  const playerOf = (c: Combatant): Player | undefined => (c.playerId ? s.players.find((p) => p.id === c.playerId) : undefined);
  const turnHooks = (f: Fight): TurnHooks => ({ now: h.now, remind: (k, t, e) => remind(f, h, k, t, e) });
  const hpHooks = (f: Fight): HpHooks => ({
    remind: (k, t, e) => remind(f, h, k, t, e),
    moment: (kind: FightMoment["kind"], name: string) => {
      f.moment = { kind, name, n: (f.moment?.n ?? 0) + 1 };
    },
    tpl,
  });
  /** Slot new combatants in: right after someone, at their initiative, or (setup) wherever their roll puts them. */
  const slot = (f: Fight, list: Combatant[], init: number | null | undefined, after: string | undefined) => {
    if (f.order.length + list.length > MAX_COMBATANTS) fail(`A fight can have at most ${MAX_COMBATANTS} combatants.`);
    if (after) {
      const a = who(f, after);
      let at = f.order.indexOf(a) + 1;
      for (const c of list) {
        c.init = a.init;
        f.order.splice(at++, 0, c);
      }
      return;
    }
    for (const c of list) {
      if (init !== undefined && init !== null) c.init = init;
      else if (f.status !== "setup") c.init = rollInitiative(c.initBonus ?? 0, h.rand);
      if (c.init === null) f.order.push(c);
      else insertSorted(f.order, c);
    }
  };
  /** A companion this player controls, and their place in the fight if there is one. */
  const myCompanion = (cid: string) => {
    const comp = companionsWith(s).find((x) => x.id === cid) ?? fail("That companion isn't with the party.");
    if (!h.actorPlayerId || comp.controllerId !== h.actorPlayerId) fail(`You're not running ${comp.name} right now.`);
    const c = s.fight?.order.find((x) => x.companionId === comp.id);
    return { comp, c };
  };
  const fate = (c: Combatant, which: "saves" | "dies") => companionFate(s, c, which, { now: h.now, fail, task: h.task, endRental: h.endRental });
  const myCombatant = (): { f: Fight; c: Combatant } => {
    const f = fight();
    const c = f.order.find((x) => x.kind === "player" && x.playerId === h.actorPlayerId) ?? fail("You're not in this fight.");
    return { f, c };
  };

  switch (cmd.type) {
    // ---------- templates ----------
    case "monster.add": {
      const list = (s.monsters ??= []);
      if (list.length >= MONSTERS_MAX) fail("The monster library is full.");
      list.push(cleanMonster(cmd.monster, h.nextId("m")));
      break;
    }
    case "monster.update": {
      const list = monstersOf(s);
      const i = list.findIndex((t) => t.id === cmd.monsterId);
      if (i < 0) fail("That monster isn't in the library.");
      list[i] = cleanMonster(cmd.monster, list[i].id, list[i]);
      break;
    }
    case "monster.remove":
      s.monsters = monstersOf(s).filter((t) => t.id !== cmd.monsterId);
      break;

    // ---------- setting up ----------
    case "fight.start": {
      const groups = (cmd.groups ?? []).map((g) => ({ template: tpl(g.templateId) ?? fail("That monster isn't in the library."), count: g.count }));
      startFight(s, groups, cmd.where ?? "", h);
      break;
    }
    case "fight.add": {
      const f = fight();
      if (f.status === "over") fail("The fight is over.");
      const t = tpl(cmd.templateId) ?? fail("That monster isn't in the library.");
      slot(f, monstersFrom(f, t, cmd.count, () => h.nextId("c"), h.rand), cmd.init, cmd.after);
      break;
    }
    case "fight.addQuick": {
      const f = fight();
      if (f.status === "over") fail("The fight is over.");
      const name = cmd.name.trim();
      const c: Combatant = {
        id: h.nextId("c"),
        kind: "monster",
        name,
        displayName: name,
        revealed: true,
        hidden: false,
        init: null,
        initBonus: null,
        hp: cmd.hp,
        maxHp: cmd.hp,
        tempHp: 0,
        ac: cmd.ac,
        conditions: [],
        concentrating: false,
        spent: {},
        down: false,
      };
      slot(f, [c], cmd.init, cmd.after);
      break;
    }
    case "fight.addPlayer": {
      const f = fight();
      const p = h.player(cmd.playerId);
      if (f.order.some((c) => c.playerId === p.id)) fail(`${p.name} is already in the fight.`);
      slot(f, [playerCombatant(h.nextId("c"), p)], null, undefined);
      break;
    }
    case "fight.remove": {
      const f = fight();
      const c = who(f, cmd.combatantId);
      if (f.currentId === c.id && f.status !== "setup") {
        const nx = f.order.filter(canAct).find((x) => x.id !== c.id && f.order.indexOf(x) > f.order.indexOf(c)) ?? f.order.filter(canAct).find((x) => x.id !== c.id);
        f.currentId = nx?.id ?? null;
        f.turnStartedAt = h.now;
      }
      f.order = f.order.filter((x) => x.id !== c.id);
      f.reminders = f.reminders.filter((r) => r.combatantId !== c.id);
      f.steps = [];
      break;
    }
    case "fight.init": {
      const f = fight();
      const c = who(f, cmd.combatantId);
      c.init = cmd.init;
      // The DM's number wins. Clearing it lets the player roll again.
      if (cmd.init === null) delete c.initRolled;
      if (cmd.bonus !== undefined) c.initBonus = cmd.bonus;
      // Re-slot by the new number; everyone else keeps their place (manual drags survive).
      reslotCombatant(f, c);
      placeFollowers(s, f);
      break;
    }
    case "fight.rollInit": {
      const f = fight();
      // By default: monsters, and companions who roll their own (not those who act right after their controller).
      const follows = (c: Combatant) => !!companionsOf(s).find((x) => x.id === c.companionId)?.follow;
      const targets = cmd.combatantIds?.length ? cmd.combatantIds.map((id) => who(f, id)) : f.order.filter((c) => (c.kind === "monster" || (c.kind === "companion" && !follows(c))) && c.init === null);
      for (const c of targets) {
        c.init = rollInitiative(c.initBonus ?? 0, h.rand);
        reslotCombatant(f, c);
      }
      placeFollowers(s, f);
      break;
    }
    case "fight.move": {
      const f = fight();
      const c = who(f, cmd.combatantId);
      const rest = f.order.filter((x) => x.id !== c.id);
      rest.splice(Math.min(cmd.to, rest.length), 0, c);
      f.order = rest;
      f.steps = [];
      break;
    }
    case "fight.delay": {
      const f = fight();
      const c = who(f, cmd.combatantId);
      const a = who(f, cmd.afterId);
      if (a.id === c.id) fail("Pick someone else to go after.");
      // Delaying on your own turn hands it to whoever is next.
      if (f.currentId === c.id && f.status !== "setup") {
        const i = f.order.indexOf(c);
        const nx = [...f.order.slice(i + 1), ...f.order.slice(0, i)].find(canAct);
        f.currentId = nx?.id ?? c.id;
        f.turnStartedAt = h.now;
      }
      const rest = f.order.filter((x) => x.id !== c.id);
      rest.splice(rest.indexOf(a) + 1, 0, c);
      c.init = a.init;
      f.order = rest;
      f.steps = [];
      break;
    }
    case "fight.begin": {
      const f = fight();
      if (f.status !== "setup") fail("The fight has already begun.");
      if (!f.order.length) fail("Add someone to the fight first.");
      placeFollowers(s, f);
      beginFight(f, turnHooks(f), tpl);
      break;
    }

    // ---------- turns ----------
    case "fight.next": {
      const f = running();
      if (!nextTurn(f, turnHooks(f), tpl)) fail("Nobody is left standing to take a turn.");
      break;
    }
    case "fight.back": {
      const f = running();
      if (!prevTurn(f, h.now)) fail("That's as far back as it goes.");
      break;
    }
    case "me.endTurn": {
      const { f, c } = myCombatant();
      if (f.status !== "running" || f.currentId !== c.id) fail("It's not your turn.");
      nextTurn(f, turnHooks(f), tpl);
      break;
    }

    // ---------- hit points ----------
    case "fight.hp": {
      const f = fight();
      if (f.status === "over") fail("The fight is over.");
      const skipped: string[] = [];
      for (const id of new Set(cmd.combatantIds)) {
        const c = who(f, id);
        if (!changeHp(f, c, playerOf(c), cmd.mode, cmd.amount, !!cmd.crit, hpHooks(f))) skipped.push(c.name);
      }
      if (skipped.length) remind(f, h, "info", `${skipped.join(", ")} ${skipped.length === 1 ? "hasn't" : "haven't"} set HP yet. Set it on their row, or ask them to on their phone.`);
      break;
    }
    case "fight.setHp": {
      const f = fight();
      const c = who(f, cmd.combatantId);
      if (c.kind === "player") {
        const p = playerOf(c) ?? fail("That player isn't here.");
        const hp = playerHp(p);
        if (cmd.maxHp !== undefined) hp.max = cmd.maxHp;
        if (cmd.hp !== undefined) hp.cur = cmd.hp;
        if (cmd.tempHp !== undefined) hp.temp = cmd.tempHp;
        hp.cur = Math.min(hp.cur, hp.max);
        if (hp.cur > 0) delete c.deathSaves;
      } else {
        if (cmd.maxHp !== undefined) c.maxHp = Math.max(1, cmd.maxHp);
        if (cmd.hp !== undefined) c.hp = cmd.hp;
        if (cmd.tempHp !== undefined) c.tempHp = cmd.tempHp;
        c.hp = Math.min(c.hp, c.maxHp);
        c.down = c.hp <= 0;
        if (!c.down) delete c.gone;
      }
      break;
    }
    case "me.hp": {
      const p = h.player(h.actorPlayerId ?? fail("Only a player can do that."));
      const hp = playerHp(p);
      if (cmd.max !== undefined) hp.max = cmd.max;
      if (cmd.cur !== undefined) hp.cur = cmd.cur;
      if (cmd.temp !== undefined) hp.temp = cmd.temp;
      if (cmd.tv !== undefined) {
        if (cmd.tv) delete hp.tv;
        else hp.tv = false;
      }
      hp.cur = Math.min(hp.cur, hp.max);
      const f = s.fight;
      const c = f?.order.find((x) => x.kind === "player" && x.playerId === p.id);
      if (cmd.mode && cmd.amount) {
        if (hp.max <= 0) fail("Set your max HP first.");
        if (f && c) changeHp(f, c, p, cmd.mode, cmd.amount, false, hpHooks(f));
        else {
          const left = cmd.mode === "damage" ? Math.max(0, hp.cur - Math.max(0, cmd.amount - hp.temp)) : cmd.mode === "heal" ? Math.min(hp.max, hp.cur + cmd.amount) : hp.cur;
          if (cmd.mode === "damage") hp.temp = Math.max(0, hp.temp - cmd.amount);
          if (cmd.mode === "temp") hp.temp = Math.max(hp.temp, cmd.amount);
          hp.cur = left;
        }
      } else if (c && hp.cur > 0) delete c.deathSaves;
      else if (f && c && hp.max > 0 && hp.cur <= 0 && !c.deathSaves) c.deathSaves = { ok: 0, fail: 0 };
      break;
    }
    case "fight.deathSave": {
      const f = fight();
      const c = who(f, cmd.combatantId);
      if (c.kind === "monster") fail("Only players and companions make death saves.");
      markDeathSave(c, playerOf(c), cmd.mark);
      if (c.kind === "companion" && c.deathSaves && c.deathSaves.fail >= 3) fate(c, "dies");
      break;
    }
    case "me.deathSave": {
      const { c } = myCombatant();
      const p = h.player(h.actorPlayerId!);
      if (playerHp(p).cur > 0) fail("You're not at 0 HP.");
      markDeathSave(c, p, cmd.mark);
      break;
    }
    case "me.initiative": {
      const { f, c } = myCombatant();
      if (f.status === "over") fail("The fight is over.");
      if (c.initRolled && c.init !== null) fail("Your initiative is locked in from your roll. Ask the DM to change it.");
      c.init = cmd.init;
      reslotCombatant(f, c);
      placeFollowers(s, f);
      break;
    }

    // ---------- companions, from their controller's phone ----------
    case "me.companionHp": {
      const { comp, c } = myCompanion(cmd.companionId);
      const f = s.fight;
      if (f && c && f.status !== "over") {
        changeHp(f, c, undefined, cmd.mode, cmd.amount, false, hpHooks(f));
      } else {
        // Between fights: straight onto the companion.
        if (cmd.mode === "temp") comp.hp.temp = Math.max(comp.hp.temp, cmd.amount);
        else if (cmd.mode === "heal") comp.hp.cur = Math.min(comp.hp.max, comp.hp.cur + cmd.amount);
        else {
          const soak = Math.min(comp.hp.temp, cmd.amount);
          comp.hp.temp -= soak;
          comp.hp.cur = Math.max(0, comp.hp.cur - (cmd.amount - soak));
        }
      }
      break;
    }
    case "me.companionAbility": {
      const { comp, c } = myCompanion(cmd.companionId);
      const t = companionTemplatesOf(s).find((x) => x.id === comp.templateId);
      if (t?.hidden.includes("abilities")) fail("The DM keeps track of those.");
      const a = t?.abilities.find((x) => x.id === cmd.abilityId) ?? fail(`That isn't one of ${comp.name}'s abilities.`);
      const spent = c ? c.spent : comp.spent;
      const n = spent[a.id] ?? 0;
      if (cmd.act === "use") {
        if (n >= (a.uses ?? 1)) fail(`${a.name} is used up.`);
        spent[a.id] = n + 1;
      } else if (n <= 1) {
        delete spent[a.id];
        if (s.fight && c) s.fight.reminders = s.fight.reminders.filter((r) => !(r.kind === "recharge" && r.combatantId === c.id && r.abilityId === a.id));
      } else spent[a.id] = n - 1;
      break;
    }
    case "me.companionInit": {
      const { comp, c: maybe } = myCompanion(cmd.companionId);
      const f = s.fight ?? fail("There's no fight going.");
      const c = maybe ?? fail(`${comp.name} isn't in this fight.`);
      if (f.status === "over") fail("The fight is over.");
      c.init = cmd.init;
      reslotCombatant(f, c);
      break;
    }
    case "me.companionDeathSave": {
      const { comp, c: maybe } = myCompanion(cmd.companionId);
      const f = s.fight ?? fail("There's no fight going.");
      const c = (maybe?.deathSaves ? maybe : undefined) ?? fail(`${comp.name} isn't making death saves.`);
      markDeathSave(c, undefined, cmd.mark);
      if (c.deathSaves && c.deathSaves.fail >= 3) {
        fate(c, "dies");
        remind(f, h, "death", `${c.name} failed three death saves and died.`, { combatantId: c.id });
      } else if (c.deathSaves && c.deathSaves.ok >= 3) {
        remind(f, h, "death", `${c.name} is stable at 0 HP.`, { combatantId: c.id });
      }
      break;
    }
    case "me.companionEndTurn": {
      const { comp, c } = myCompanion(cmd.companionId);
      const f = s.fight ?? fail("There's no fight going.");
      if (!c || f.status !== "running" || f.currentId !== c.id) return fail(`It's not ${comp.name}'s turn.`);
      nextTurn(f, turnHooks(f), tpl);
      break;
    }
    case "fight.companionFate": {
      const f = fight();
      fate(who(f, cmd.combatantId), cmd.fate);
      break;
    }

    // ---------- conditions and flags ----------
    case "fight.condition": {
      const f = fight();
      const name = cmd.name.trim();
      const known = CONDITIONS.find((x) => x.toLowerCase() === name.toLowerCase());
      for (const id of new Set(cmd.combatantIds)) {
        const c = who(f, id);
        const label = known ?? name;
        // Same condition again: replace it (new duration or exhaustion level).
        c.conditions = c.conditions.filter((x) => x.name.toLowerCase() !== label.toLowerCase());
        c.conditions.push({
          id: h.nextId("k"),
          name: label,
          ...(label === "Exhaustion" ? { level: cmd.level ?? 1 } : cmd.level ? { level: cmd.level } : {}),
          ...(cmd.rounds ? { rounds: cmd.rounds } : {}),
          tick: cmd.tick ?? "end",
        });
      }
      break;
    }
    case "fight.uncondition": {
      const f = fight();
      const c = who(f, cmd.combatantId);
      c.conditions = c.conditions.filter((x) => x.id !== cmd.conditionId);
      break;
    }
    case "fight.patch": {
      const f = fight();
      for (const id of new Set(cmd.combatantIds)) {
        const c = who(f, id);
        const p = cmd.patch;
        if (p.hidden !== undefined) c.hidden = p.hidden;
        if (p.revealed !== undefined) c.revealed = p.revealed;
        if (p.concentrating !== undefined) {
          c.concentrating = p.concentrating;
          if (!p.concentrating) delete c.concDc;
        }
        if (p.note !== undefined) {
          const n = p.note.trim();
          if (n) c.note = n;
          else delete c.note;
        }
        if (p.name !== undefined) c.name = p.name.trim();
        if (p.displayName !== undefined) c.displayName = p.displayName.trim();
      }
      break;
    }
    case "fight.ability": {
      const f = fight();
      const c = who(f, cmd.combatantId);
      const a = tpl(c.templateId)?.abilities.find((x) => x.id === cmd.abilityId) ?? fail("That ability isn't on this monster.");
      const spent = c.spent[a.id] ?? 0;
      const clear = () => {
        delete c.spent[a.id];
        f.reminders = f.reminders.filter((r) => !(r.kind === "recharge" && r.combatantId === c.id && r.abilityId === a.id));
      };
      if (cmd.act === "use") c.spent[a.id] = Math.min(a.uses ?? 1, spent + 1);
      else if (cmd.act === "unuse") {
        if (spent <= 1) clear();
        else c.spent[a.id] = spent - 1;
      } else if (cmd.act === "recharged") clear();
      else {
        const on = a.recharge ?? fail(`${a.name} doesn't recharge.`);
        const roll = rollDice("1d6", h.rand);
        if (roll >= on) {
          clear();
          remind(f, h, "info", `${c.name}: rolled ${roll}. ${a.name} is ready again.`, { combatantId: c.id });
        } else {
          f.reminders = f.reminders.filter((r) => !(r.kind === "recharge" && r.combatantId === c.id && r.abilityId === a.id));
          remind(f, h, "info", `${c.name}: rolled ${roll}. ${a.name} isn't ready yet.`, { combatantId: c.id });
        }
      }
      break;
    }

    // ---------- the fight itself ----------
    case "fight.pause": {
      const f = fight();
      if (f.status === "setup" || f.status === "over") fail("Only a running fight can pause.");
      if (cmd.paused && f.status === "running") {
        f.status = "paused";
        f.pausedAt = h.now;
      } else if (!cmd.paused && f.status === "paused") {
        f.status = "running";
        // The turn timer picks up where it stopped.
        if (f.pausedAt) f.turnStartedAt += h.now - f.pausedAt;
        delete f.pausedAt;
      }
      break;
    }
    case "fight.settings": {
      const f = fight();
      if (cmd.timerSec !== undefined) {
        f.timerSec = cmd.timerSec;
        f.turnStartedAt = h.now;
        if (f.pausedAt) f.pausedAt = h.now;
      }
      if (cmd.where !== undefined) f.where = cmd.where.trim();
      if (cmd.dmNotes !== undefined) f.dmNotes = cmd.dmNotes;
      break;
    }
    case "fight.dismiss": {
      const f = fight();
      f.reminders = cmd.reminderId ? f.reminders.filter((r) => r.id !== cmd.reminderId) : [];
      break;
    }
    case "fight.end": {
      const f = fight();
      if (f.status === "setup") fail("The fight hasn't begun. Cancel it instead.");
      if (f.status === "over") break;
      f.status = "over";
      f.endedAt = h.now;
      delete f.pausedAt;
      f.outcome = fightOutcome(f, (id) => s.players.find((p) => p.id === id)?.hp);
      f.moment = { kind: "end", name: "", n: (f.moment?.n ?? 0) + 1 };
      break;
    }
    case "fight.reopen": {
      const f = fight();
      if (f.status !== "over") fail("The fight isn't over.");
      f.status = "running";
      delete f.endedAt;
      delete f.outcome;
      f.turnStartedAt = h.now;
      break;
    }
    case "fight.close": {
      const f = fight();
      if (f.status !== "over") fail("End the fight first.");
      const batchId = h.nextId("b");
      let lootCp = 0;
      const note = `Loot: ${f.title}${f.where ? ` (${f.where})` : ""}`;
      for (const pay of cmd.payouts ?? []) {
        if (pay.cp <= 0) continue;
        const p = h.player(pay.playerId);
        if (p.archived) fail(`${p.name} has left the table.`);
        h.move(p, pay.cp, note, "loot", { batchId });
        lootCp += pay.cp;
      }
      // Companions who take a share keep it themselves. Hirelings are paid by the day, not in loot.
      for (const pay of cmd.companionPayouts ?? []) {
        if (pay.cp <= 0) continue;
        const comp = companionsOf(s).find((x) => x.id === pay.companionId) ?? fail("That companion isn't with the party.");
        const t = companionTemplatesOf(s).find((x) => x.id === comp.templateId);
        if (comp.hire) fail(`${comp.name} is a hireling: they're paid by the day, not from the loot.`);
        if (!t?.takesShare) fail(`${comp.name} doesn't take a share.`);
        comp.purseCp = (comp.purseCp ?? 0) + pay.cp;
        lootCp += pay.cp;
      }
      // A companion left at 0 HP with no death saves (the DM chose "dies", or never chose) died.
      for (const c of f.order) if (c.kind === "companion" && c.hp <= 0 && !c.deathSaves && companionsOf(s).find((x) => x.id === c.companionId)?.status === "with") fate(c, "dies");
      const items = (cmd.items ?? "").trim();
      // Things found: straight to a character, or into the party stash.
      if (cmd.loot?.length) {
        const r = lootFromFight(
          s,
          cmd.loot,
          { source: `${f.title}${f.where ? ` (${f.where})` : ""}`, fightId: f.id, ...(worldOn(s) && s.partyId ? { partyId: s.partyId } : {}) },
          { now: h.now, fail, stashId: () => h.nextId("st"), itemId: () => h.nextId("it") },
          featureOn(s, "stash"),
        );
        const bits = [r.stashed ? `${r.stashed === 1 ? "1 thing" : `${r.stashed} things`} in the party stash` : "", r.atTable.length ? `Hand over at the table: ${r.atTable.join(", ")}` : ""].filter(Boolean);
        if (bits.length) h.info?.(`${bits.join(". ")}.`);
      }
      let noteId: string | undefined;
      const text = cmd.note?.trim();
      if (text) noteId = h.addNote(DM_AUTHOR, "DM", text);
      const hist = (s.fights ??= []);
      hist.push({
        id: f.id,
        title: f.title,
        where: f.where,
        startedAt: f.startedAt,
        endedAt: f.endedAt ?? h.now,
        rounds: f.round,
        sessionId: f.sessionId,
        combatants: f.order.map((c) => c.name),
        downed: f.downed.map((id) => f.order.find((c) => c.id === id)?.name).filter((x): x is string => !!x),
        lootCp,
        items,
        ...(noteId ? { noteId } : {}),
        foes: f.order.filter((c) => c.kind === "monster").map(foeSetup),
        ...(s.scenes.find((x) => x.id === s.live.sceneId)?.kind === "map" ? { mapSceneId: s.live.sceneId } : {}),
      });
      if (hist.length > FIGHTS_KEPT) s.fights = hist.slice(-FIGHTS_KEPT);
      // Hit points stay with the players; death saves and conditions end with the fight.
      const back = f.returnSceneId;
      delete s.fight;
      if (s.scenes.some((x) => x.id === back)) h.showScene(back);
      break;
    }
    case "fight.cancel": {
      fight();
      const back = s.fight!.returnSceneId;
      delete s.fight;
      if (s.scenes.some((x) => x.id === back) && s.live.sceneId !== back) h.showScene(back);
      break;
    }
    case "fight.rerun": {
      const past = (s.fights ?? []).find((x) => x.id === cmd.fightId) ?? fail("That fight isn't in the history.");
      rerunFight(s, past, h);
      break;
    }
    case "fight.forget": {
      if (!cmd.fightId) delete s.fights;
      else {
        const hist = s.fights ?? [];
        if (!hist.some((x) => x.id === cmd.fightId)) fail("That fight isn't in the history.");
        s.fights = hist.filter((x) => x.id !== cmd.fightId);
      }
      break;
    }
    case "fight.undo":
      break; // handled in applyFight
    default: {
      const never: never = cmd;
      fail(`Unknown command ${(never as { type: string }).type}`);
    }
  }
}

function foeSetup(c: Combatant): FoeSetup {
  return {
    ...(c.templateId ? { templateId: c.templateId } : {}),
    name: c.name,
    displayName: c.displayName,
    maxHp: c.maxHp,
    ...(c.ac !== undefined ? { ac: c.ac } : {}),
    initBonus: c.initBonus,
    hidden: c.hidden,
  };
}

/** "Goblin B" -> "Goblin": the letter a fight gives each of several of the same monster. */
const unlettered = (name: string) => name.replace(/ (?:[A-Z]|\d+)$/, "");

/** Fights kept before Run again only have names: match the monsters back to the library, leaving the players out. */
function legacyFoes(s: GameState, past: FightSummary): FoeSetup[] {
  const people = new Set([...s.players.flatMap((p) => [p.name, p.character ?? ""]), ...companionsOf(s).map((c) => c.name)].filter(Boolean).map((x) => x.toLowerCase()));
  const list = monstersOf(s);
  const out: FoeSetup[] = [];
  for (const name of past.combatants) {
    if (people.has(name.toLowerCase())) continue;
    const t = templateByName(list, unlettered(name)) ?? templateByName(list, name);
    out.push(t ? { templateId: t.id, name: t.name, displayName: t.displayName, maxHp: 0, initBonus: t.initBonus, hidden: false } : { name, displayName: name, maxHp: 0, initBonus: null, hidden: false });
  }
  return out;
}

/**
 * Run a past fight again, fresh: everyone at the table now, the same foes at
 * full HP (rolled again from their templates), no initiative yet, and the map
 * it was fought on back on the TV. Nothing of the old fight is touched: its
 * loot, Chronicle note and summary stay, and this one pays out only when it closes.
 */
export function rerunFight(s: GameState, past: FightSummary, h: FightHelpers): Fight {
  if (s.fight) h.fail("A fight is already going. End it first.");
  const before = s.live.sceneId;
  const map = past.mapSceneId ? s.scenes.find((x) => x.id === past.mapSceneId && x.kind === "map") : undefined;
  if (map && before !== map.id) h.showScene(map.id);
  const f = startFight(s, [], past.where, h);
  f.title = past.title;
  f.returnSceneId = before;
  const list = monstersOf(s);
  const missing: string[] = [];
  const noted = new Set<string>();
  for (const foe of past.foes ?? legacyFoes(s, past)) {
    if (f.order.length >= MAX_COMBATANTS) break;
    const t = foe.templateId ? list.find((x) => x.id === foe.templateId) : undefined;
    let c: Combatant;
    if (t) {
      [c] = monstersFrom(f, t, 1, () => h.nextId("c"), h.rand);
      if (t.dmNote.trim() && !noted.has(t.id)) {
        noted.add(t.id);
        remind(f, h, "info", `${t.name}: ${t.dmNote.trim()}`);
      }
    } else if (foe.maxHp > 0) {
      c = {
        id: h.nextId("c"),
        kind: "monster",
        name: foe.name,
        displayName: foe.displayName || foe.name,
        revealed: !foe.displayName.trim() || foe.displayName === foe.name,
        hidden: false,
        init: null,
        initBonus: foe.initBonus,
        hp: foe.maxHp,
        maxHp: foe.maxHp,
        tempHp: 0,
        ...(foe.ac !== undefined ? { ac: foe.ac } : {}),
        conditions: [],
        concentrating: false,
        spent: {},
        down: false,
      };
    } else {
      const n = unlettered(foe.name);
      if (!missing.includes(n)) missing.push(n);
      continue;
    }
    c.hidden = foe.hidden;
    f.order.push(c);
  }
  for (const name of missing) remind(f, h, "info", `No monster template called “${name}” any more. Add it under Monsters, then add it here.`);
  return f;
}

/** "Fought 2 Goblins in the old mill. 4 rounds." Uses the names the table knows. */
export function chronicleLine(f: Fight, items = "", lootCp = 0): string {
  const foes = f.order.filter((c) => c.kind === "monster" && !c.hidden);
  // Revealed names read as plurals ("2 Goblins"); a TV name that hides the truth stays as it is ("Something in the shadows (×2)").
  const byName = new Map<string, { count: number; revealed: boolean }>();
  for (const c of foes) {
    const base = tvName(c).replace(/ (?:[A-Z]|\d+)$/, "");
    const g = byName.get(base) ?? { count: 0, revealed: c.revealed };
    g.count += 1;
    byName.set(base, g);
  }
  const who =
    [...byName]
      .map(([name, g]) => (g.revealed || g.count === 1 ? groupTitle([{ name, count: g.count }]) : `${name} (×${g.count})`))
      .join(", ") || "a fight";
  const where = f.where.trim() ? ` ${/^(in|at|on|by|near|inside|outside|under)\b/i.test(f.where.trim()) ? "" : "in "}${f.where.trim()}` : "";
  const rounds = `${f.round} round${f.round === 1 ? "" : "s"}`;
  const parts = [`Fought ${who}${where}. ${rounds}.`];
  const down = f.downed
    .map((id) => f.order.find((c) => c.id === id))
    .filter((c): c is Combatant => !!c && c.kind === "player")
    .map(tvName);
  if (f.outcome === "fallen") parts.push("The whole party fell.");
  else if (down.length) parts.push(`${down.join(" and ")} went down.`);
  const found = [lootCp > 0 ? formatCp(lootCp) : "", items.trim()].filter(Boolean);
  if (found.length) parts.push(`Found: ${found.join(", ")}.`);
  return parts.join(" ");
}

export { currentOf, condLabel };
