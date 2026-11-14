// Combat mode: turn order, hit points, conditions and reminders for in-person
// fights. Pure rules (no I/O), shared by the server reducer, the screens and tests.
//
// Spoiler safety: monster HP, AC, real names (until revealed), hidden
// combatants, templates and DM notes stay on the server. The TV and phones
// only ever get fightView(), built field by field below.

import { parseDice, rollDice } from "./progress";
import { penName } from "./chronicle";
import type { Art, Combatant, ConditionTick, Fight, FightCondition, FightGroup, FightMoment, FightReminder, FightReminderKind, FightStep, GameState, MonsterTemplate, Player, PlayerHp } from "./types";

/** The 2024 conditions, in the order the DM picks from. */
export const CONDITIONS = [
  "Blinded",
  "Charmed",
  "Deafened",
  "Exhaustion",
  "Frightened",
  "Grappled",
  "Incapacitated",
  "Invisible",
  "Paralyzed",
  "Petrified",
  "Poisoned",
  "Prone",
  "Restrained",
  "Stunned",
  "Unconscious",
] as const;

export const FIGHTS_KEPT = 50;
export const REMINDERS_KEPT = 12;
export const STEPS_KEPT = 20;
export const MAX_COMBATANTS = 40;
export const MONSTERS_MAX = 200;
export const TIMER_DEFAULT = 60;

export function monstersOf(s: Pick<GameState, "monsters">): MonsterTemplate[] {
  return s.monsters ?? [];
}

// ---------------------------------------------------------------------------
// Numbers

export type HealthState = "unhurt" | "hurt" | "bloodied" | "barely" | "down";

export const HEALTH_LABEL: Record<HealthState, string> = {
  unhurt: "Unhurt",
  hurt: "Hurt",
  bloodied: "Bloodied",
  barely: "Barely standing",
  down: "Down",
};

/** Unhurt (full), Hurt (under full), Bloodied (at or under half), Barely standing (at or under a quarter), Down (0). */
export function healthState(hp: number, max: number): HealthState {
  if (hp <= 0) return "down";
  if (max <= 0 || hp >= max) return "unhurt";
  if (hp * 4 <= max) return "barely";
  if (hp * 2 <= max) return "bloodied";
  return "hurt";
}

/** Concentration save DC: 10 or half the damage, whichever is higher, at most 30. */
export function concentrationDc(damage: number): number {
  return Math.min(30, Math.max(10, Math.floor(damage / 2)));
}

/** Temporary hit points soak damage first. Returns what's left. */
export function takeDamage(hp: { cur: number; temp: number }, amount: number): { cur: number; temp: number } {
  const soak = Math.min(hp.temp, amount);
  return { temp: hp.temp - soak, cur: Math.max(0, hp.cur - (amount - soak)) };
}

// ---------------------------------------------------------------------------
// Initiative

/** a before b? Higher initiative first; ties go to the higher bonus when both are known. */
function before(a: Pick<Combatant, "init" | "initBonus">, b: Pick<Combatant, "init" | "initBonus">): boolean {
  if (a.init === null) return false;
  if (b.init === null) return true;
  if (a.init !== b.init) return a.init > b.init;
  if (a.initBonus !== null && b.initBonus !== null) return a.initBonus > b.initBonus;
  return false; // a real tie stays as entered
}

/** A stable sort by initiative: ties stay in the order they were entered unless both bonuses are known. */
export function sortByInitiative<T extends Pick<Combatant, "init" | "initBonus">>(list: T[]): T[] {
  const out: T[] = [];
  for (const c of list) insertSorted(out, c);
  return out;
}

/**
 * Put one combatant where its initiative belongs, after everyone it ties with.
 * The others keep their places, so a manual reorder survives new entries.
 */
export function insertSorted<T extends Pick<Combatant, "init" | "initBonus">>(order: T[], c: T): T[] {
  let at = order.length;
  for (let i = 0; i < order.length; i++) {
    if (before(c, order[i])) {
      at = i;
      break;
    }
  }
  order.splice(at, 0, c);
  return order;
}

// ---------------------------------------------------------------------------
// Turns

/** Whose turn can come up: everyone but monsters that are down. Players at 0 still roll death saves. */
export function canAct(c: Combatant): boolean {
  return !(c.kind === "monster" && (c.down || c.gone));
}

/** The next combatant after index i who can act, and whether we went past the end of the round. */
function nextIndex(order: Combatant[], i: number): { index: number; wrapped: boolean } | null {
  const n = order.length;
  for (let k = 1; k <= n; k++) {
    const j = i + k;
    if (canAct(order[j % n])) return { index: j % n, wrapped: j >= n };
  }
  return null;
}

export function currentOf(f: Pick<Fight, "order" | "currentId">): Combatant | null {
  return f.order.find((c) => c.id === f.currentId) ?? null;
}

/** Who's up after the current combatant (skipping the defeated). */
export function upNext(f: Pick<Fight, "order" | "currentId">, visible: (c: Combatant) => boolean = () => true): Combatant | null {
  const i = f.order.findIndex((c) => c.id === f.currentId);
  if (i < 0) return null;
  const n = f.order.length;
  for (let k = 1; k < n; k++) {
    const c = f.order[(i + k) % n];
    if (canAct(c) && visible(c)) return c;
  }
  return null;
}

export interface TurnHooks {
  now: number;
  remind: (kind: FightReminderKind, text: string, extra?: Partial<FightReminder>) => void;
}

/** Count down a combatant's conditions that tick at this point of its turn. */
function tick(f: Fight, c: Combatant, when: ConditionTick, step: FightStep, h: TurnHooks) {
  const keep: FightCondition[] = [];
  for (const cond of c.conditions) {
    if (cond.tick !== when || cond.rounds === undefined) {
      keep.push(cond);
      continue;
    }
    const was = { ...cond };
    cond.rounds -= 1;
    if (cond.rounds <= 0) {
      step.ticks.push({ combatantId: c.id, condition: was, expired: true });
      h.remind("expired", `${c.name} is no longer ${condLabel(was)}.`, { combatantId: c.id });
    } else {
      step.ticks.push({ combatantId: c.id, condition: was, expired: false });
      keep.push(cond);
    }
  }
  c.conditions = keep;
}

export function condLabel(c: Pick<FightCondition, "name" | "level">): string {
  return c.level ? `${c.name} ${c.level}` : c.name;
}

/** The start of someone's turn: their start-of-turn countdowns and recharge rolls. */
function startTurn(f: Fight, c: Combatant, step: FightStep, h: TurnHooks, tpl: (id?: string) => MonsterTemplate | undefined) {
  tick(f, c, "start", step, h);
  delete c.concDc;
  const t = tpl(c.templateId);
  if (c.kind === "monster" && t) {
    for (const a of t.abilities) {
      if (a.recharge && (c.spent[a.id] ?? 0) > 0) {
        h.remind("recharge", `${c.name}: roll d6 for ${a.name}: recharges on ${rechargeText(a.recharge)}.`, { combatantId: c.id, abilityId: a.id });
      }
    }
  }
  f.turnStartedAt = h.now;
}

export function rechargeText(n: number): string {
  return n >= 6 ? "6" : `${n}–6`;
}

/** Begin round 1 at the top of the order. */
export function beginFight(f: Fight, h: TurnHooks, tpl: (id?: string) => MonsterTemplate | undefined) {
  if (!f.order.length) throw new Error("Add someone to the fight first.");
  f.order = sortUnrolledLast(f.order);
  const first = f.order.find(canAct) ?? f.order[0];
  f.status = "running";
  f.round = 1;
  f.currentId = first.id;
  f.steps = [];
  startTurn(f, first, { round: 1, currentId: null, ticks: [], gone: [] }, h, tpl);
}

/** Nobody without an initiative goes before someone with one. */
function sortUnrolledLast(order: Combatant[]): Combatant[] {
  return [...order.filter((c) => c.init !== null), ...order.filter((c) => c.init === null)];
}

/** Next turn: end-of-turn countdowns, wrap the round (clearing the defeated), start-of-turn countdowns. */
export function nextTurn(f: Fight, h: TurnHooks, tpl: (id?: string) => MonsterTemplate | undefined): boolean {
  const i = f.order.findIndex((c) => c.id === f.currentId);
  const step: FightStep = { round: f.round, currentId: f.currentId, ticks: [], gone: [] };
  if (i >= 0) tick(f, f.order[i], "end", step, h);
  const nx = nextIndex(f.order, i < 0 ? -1 : i);
  if (!nx) return false;
  if (nx.wrapped) {
    f.round += 1;
    for (const c of f.order) {
      if (c.kind === "monster" && c.down && !c.gone) {
        c.gone = true;
        step.gone.push(c.id);
      }
    }
  }
  const c = f.order[nx.index];
  f.currentId = c.id;
  startTurn(f, c, step, h, tpl);
  f.steps.push(step);
  if (f.steps.length > STEPS_KEPT) f.steps = f.steps.slice(-STEPS_KEPT);
  return true;
}

/** Previous turn: put the last Next back exactly (countdowns, expiries, the defeated). */
export function prevTurn(f: Fight, now: number): boolean {
  const step = f.steps.pop();
  if (!step || step.currentId === null) return false;
  for (const t of [...step.ticks].reverse()) {
    const c = f.order.find((x) => x.id === t.combatantId);
    if (!c) continue;
    const have = c.conditions.find((x) => x.id === t.condition.id);
    if (have) have.rounds = t.condition.rounds;
    else if (t.expired) c.conditions.push({ ...t.condition });
  }
  for (const id of step.gone) {
    const c = f.order.find((x) => x.id === id);
    if (c) delete c.gone;
  }
  f.round = step.round;
  f.currentId = step.currentId;
  // Reminders for the turn we left no longer apply.
  f.reminders = f.reminders.filter((r) => r.kind !== "recharge" && r.kind !== "expired");
  f.turnStartedAt = now;
  return true;
}

// ---------------------------------------------------------------------------
// The run sheet's "fight:" line

/** "Goblin x2, Orc, 3 Wolves" -> groups. */
export function parseFightLine(body: string): FightGroup[] {
  const out: FightGroup[] = [];
  for (const raw of body.split(",")) {
    const t = raw.trim();
    if (!t) continue;
    let m = /^(.*?)\s*[x×]\s*(\d+)$/i.exec(t);
    if (m && m[1]) {
      out.push({ name: m[1].trim(), count: clampCount(Number(m[2])) });
      continue;
    }
    m = /^(\d+)\s*[x×]?\s+(.+)$/i.exec(t);
    if (m) {
      out.push({ name: m[2].trim(), count: clampCount(Number(m[1])) });
      continue;
    }
    out.push({ name: t, count: 1 });
  }
  return out;
}

function clampCount(n: number): number {
  return Math.max(1, Math.min(20, Math.floor(n) || 1));
}

export function fightLineMarkdown(groups: FightGroup[]): string {
  return `fight: ${groups.map((g) => (g.count > 1 ? `${g.name} x${g.count}` : g.name)).join(", ")}`;
}

/** Match a template by name, ignoring case, spacing and a trailing plural "s". */
export function templateByName(list: MonsterTemplate[], name: string): MonsterTemplate | undefined {
  const k = nameKey(name);
  return list.find((t) => nameKey(t.name) === k) ?? list.find((t) => nameKey(t.name) === k.replace(/s$/, "")) ?? list.find((t) => nameKey(t.displayName) === k);
}

function nameKey(s: string): string {
  return s.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

/** "2 Goblins". */
export function groupTitle(groups: { name: string; count: number }[]): string {
  return groups.map((g) => (g.count > 1 ? `${g.count} ${plural(g.name)}` : g.name)).join(", ");
}

function plural(name: string): string {
  if (/s$/i.test(name)) return name;
  if (/[^aeiou]y$/i.test(name)) return name.slice(0, -1) + "ies";
  return name + "s";
}

// ---------------------------------------------------------------------------
// Making combatants

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/** The TV's name for a combatant. */
export function tvName(c: Pick<Combatant, "name" | "displayName" | "revealed">): string {
  return c.revealed ? c.name : c.displayName || c.name;
}

export function playerCombatant(id: string, p: Player): Combatant {
  const name = penName(p);
  return {
    id,
    kind: "player",
    playerId: p.id,
    name,
    displayName: name,
    revealed: true,
    hidden: false,
    init: null,
    initBonus: null,
    hp: 0,
    maxHp: 0,
    tempHp: 0,
    conditions: [],
    concentrating: false,
    spent: {},
    down: false,
  };
}

/**
 * New monsters from a template, lettered after any of the same kind already in
 * the fight (a lone one that's joined gets "A"). HP is rolled per monster.
 */
export function monstersFrom(f: Pick<Fight, "order">, t: MonsterTemplate, count: number, newId: () => string, rand: () => number): Combatant[] {
  const same = f.order.filter((c) => c.templateId === t.id);
  const used = new Set(same.map((c) => letterOf(c, t)).filter(Boolean));
  const lettered = count > 1 || same.length > 0;
  if (lettered) {
    for (const c of same) {
      if (!letterOf(c, t)) {
        const l = [...LETTERS].find((x) => !used.has(x)) ?? "";
        used.add(l);
        c.name = `${c.name} ${l}`.trim();
        c.displayName = `${c.displayName} ${l}`.trim();
      }
    }
  }
  const out: Combatant[] = [];
  for (let i = 0; i < count; i++) {
    const l = lettered ? ([...LETTERS].find((x) => !used.has(x)) ?? String(same.length + i + 1)) : "";
    used.add(l);
    const hp = Math.max(1, rollDice(t.hp, rand) || 1);
    const shown = (t.displayName || t.name).trim();
    out.push({
      id: newId(),
      kind: "monster",
      templateId: t.id,
      name: l ? `${t.name} ${l}` : t.name,
      displayName: l ? `${shown} ${l}` : shown,
      revealed: !t.displayName.trim() || t.displayName.trim() === t.name.trim(),
      hidden: false,
      init: null,
      initBonus: t.initBonus,
      hp,
      maxHp: hp,
      tempHp: 0,
      ac: t.ac,
      conditions: [],
      concentrating: false,
      spent: {},
      down: false,
      ...(t.sceneId ? { sceneId: t.sceneId } : {}),
    });
  }
  return out;
}

function letterOf(c: Combatant, t: MonsterTemplate): string {
  const m = new RegExp(`^${escapeRe(t.name)} ([A-Z]|\\d+)$`).exec(c.name);
  return m ? m[1] : "";
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** d20 + bonus. */
export function rollInitiative(bonus: number, rand: () => number): number {
  return 1 + Math.floor(rand() * 20) + bonus;
}

export function isDice(text: string): boolean {
  return parseDice(text) !== null;
}

// ---------------------------------------------------------------------------
// What the TV and phones see

export interface PublicCondition {
  name: string;
  level?: number;
  rounds?: number;
}

export interface PublicCombatant {
  id: string;
  kind: "player" | "monster";
  /** The TV name: the display name until revealed. */
  name: string;
  /** Players only: whose seat this is (lets a phone find itself). */
  playerId?: string;
  /** Monsters: a state, never numbers. */
  health?: HealthState;
  /** Players who show their HP on the TV and have set it. */
  hp?: { cur: number; max: number; temp: number };
  down: boolean;
  conditions: PublicCondition[];
  concentrating: boolean;
  deathSaves?: { ok: number; fail: number };
  /** While rolling initiative: has an initiative yet. */
  ready: boolean;
  art?: Art;
}

export interface FightView {
  id: string;
  status: Fight["status"];
  round: number;
  /** Visible combatants in turn order. Monsters gone in an earlier round and hidden ones are left out. */
  order: PublicCombatant[];
  /** null while it's a hidden combatant's turn (the TV shows "…"). */
  currentId: string | null;
  nextId: string | null;
  /** Turn timer: seconds and when the turn started, by the server's clock (clock = the server's now when sent). */
  timer: { sec: number; startedAt: number; pausedAt?: number; clock: number } | null;
  moment?: FightMoment;
  /** The end card: rounds and who went down (names only). */
  over?: { rounds: number; downed: string[] };
}

/** Field by field, for the TV and phones. art: resolves a portrait scene to public art, or nothing. */
export function fightView(game: GameState, now: number, art: (sceneId: string) => Art | undefined): FightView | null {
  const f = game.fight;
  if (!f) return null;
  const shown = (c: Combatant) => !c.hidden && !c.gone;
  const visible = f.order.filter(shown);
  const cur = currentOf(f);
  const nx = f.status === "running" || f.status === "paused" ? upNext(f, shown) : null;
  const out: FightView = {
    id: f.id,
    status: f.status,
    round: f.round,
    order: visible.map((c) => publicCombatant(game, c, art)),
    currentId: cur && shown(cur) && f.status !== "setup" ? cur.id : null,
    nextId: nx ? nx.id : null,
    timer: f.timerSec && f.status !== "setup" && f.status !== "over" ? { sec: f.timerSec, startedAt: f.turnStartedAt, ...(f.pausedAt ? { pausedAt: f.pausedAt } : {}), clock: now } : null,
  };
  if (f.moment) out.moment = { ...f.moment };
  if (f.status === "over") {
    out.over = {
      rounds: f.round,
      downed: f.downed
        .map((id) => f.order.find((c) => c.id === id))
        .filter((c): c is Combatant => !!c && !c.hidden)
        .map(tvName),
    };
  }
  return out;
}

function publicCombatant(game: GameState, c: Combatant, art: (sceneId: string) => Art | undefined): PublicCombatant {
  const out: PublicCombatant = {
    id: c.id,
    kind: c.kind,
    name: tvName(c),
    down: false,
    conditions: c.conditions.map((x) => {
      const pc: PublicCondition = { name: x.name };
      if (x.level) pc.level = x.level;
      if (x.rounds !== undefined) pc.rounds = x.rounds;
      return pc;
    }),
    concentrating: c.concentrating,
    ready: c.init !== null,
  };
  if (c.kind === "monster") {
    const h = healthState(c.hp, c.maxHp);
    out.health = c.down ? "down" : h;
    out.down = c.down;
  } else {
    const p = game.players.find((x) => x.id === c.playerId);
    if (p) out.playerId = p.id;
    const hp = p?.hp;
    if (hp && hp.max > 0 && hp.tv !== false) out.hp = { cur: hp.cur, max: hp.max, temp: hp.temp };
    out.down = !!hp && hp.max > 0 && hp.cur <= 0;
    if (out.down && c.deathSaves) out.deathSaves = { ...c.deathSaves };
  }
  const a = c.sceneId ? art(c.sceneId) : undefined;
  if (a) out.art = a;
  return out;
}

/** A player's own part of the fight, on their phone. */
export interface MyFight {
  combatantId: string;
  init: number | null;
  deathSaves: { ok: number; fail: number } | null;
  /** The concentration save they owe after the last hit. */
  concDc?: number;
}

export function myFight(game: GameState, playerId: string): MyFight | null {
  const c = game.fight?.order.find((x) => x.kind === "player" && x.playerId === playerId);
  if (!c) return null;
  const out: MyFight = { combatantId: c.id, init: c.init, deathSaves: c.deathSaves ? { ...c.deathSaves } : null };
  if (c.concDc) out.concDc = c.concDc;
  return out;
}

// ---------------------------------------------------------------------------
// Hit points (shared by the DM's damage box and the players' own phones)

export interface HpHooks {
  remind: (kind: FightReminderKind, text: string, extra?: Partial<FightReminder>) => void;
  moment: (kind: FightMoment["kind"], name: string) => void;
  tpl: (id?: string) => MonsterTemplate | undefined;
}

/** A player's hit points (new players start at 0/0, "not set"). */
export function playerHp(p: Player): PlayerHp {
  return (p.hp ??= { cur: 0, max: 0, temp: 0 });
}

/**
 * Damage, healing or temporary hit points on one combatant.
 * Returns false if a player hasn't set their HP yet (nothing to change).
 */
export function changeHp(f: Fight, c: Combatant, p: Player | undefined, mode: "damage" | "heal" | "temp", amount: number, crit: boolean, h: HpHooks): boolean {
  if (amount <= 0) return true;
  const isPlayer = c.kind === "player";
  const hp = isPlayer ? (p ? playerHp(p) : null) : { cur: c.hp, max: c.maxHp, temp: c.tempHp };
  if (!hp) return false;
  if (isPlayer && hp.max <= 0) return false;
  const wasDown = hp.cur <= 0;
  if (mode === "temp") {
    hp.temp = Math.max(hp.temp, amount); // temporary hit points don't stack
  } else if (mode === "heal") {
    hp.cur = Math.min(hp.max, hp.cur + amount);
  } else {
    const left = takeDamage(hp, amount);
    hp.cur = left.cur;
    hp.temp = left.temp;
  }
  if (!isPlayer) {
    c.hp = hp.cur;
    c.tempHp = hp.temp;
  }
  const name = tvName(c);
  if (mode === "damage") {
    if (crit) h.moment("crit", name);
    if (isPlayer && wasDown) {
      // Damage at 0 HP is a failed death save (two on a crit).
      const ds = (c.deathSaves ??= { ok: 0, fail: 0 });
      ds.fail = Math.min(3, ds.fail + (crit ? 2 : 1));
      h.remind("death", `${c.name} took damage at 0 HP: ${crit ? "two failed death saves" : "a failed death save"} (${ds.fail} of 3).`, { combatantId: c.id });
    } else if (hp.cur <= 0) {
      if (c.concentrating) {
        c.concentrating = false;
        h.remind("concentration", `${c.name} dropped to 0 and lost concentration.`, { combatantId: c.id });
      }
      if (isPlayer) {
        c.deathSaves = { ok: 0, fail: 0 };
        h.moment("playerDown", name);
      } else {
        c.down = true;
        h.moment("monsterDown", name);
        const t = h.tpl(c.templateId);
        for (const a of t?.abilities ?? []) if (a.onDeath) h.remind("death", `${a.name}! ${a.text}`.trim(), { combatantId: c.id, abilityId: a.id });
      }
      if (!f.downed.includes(c.id)) f.downed.push(c.id);
    } else if (c.concentrating) {
      const dc = concentrationDc(amount);
      if (isPlayer) c.concDc = dc;
      h.remind("concentration", `${c.name} is concentrating: Constitution save DC ${dc}.`, { combatantId: c.id });
    }
  } else if (mode === "heal" && wasDown && hp.cur > 0) {
    // Back on their feet.
    delete c.deathSaves;
    if (!isPlayer) {
      c.down = false;
      delete c.gone;
    }
  }
  return true;
}

/** Tap a death save. A natural 20 regains 1 HP. */
export function markDeathSave(c: Combatant, p: Player | undefined, mark: "ok" | "fail" | "nat20" | "unok" | "unfail"): void {
  const ds = (c.deathSaves ??= { ok: 0, fail: 0 });
  if (mark === "ok") ds.ok = Math.min(3, ds.ok + 1);
  else if (mark === "fail") ds.fail = Math.min(3, ds.fail + 1);
  else if (mark === "unok") ds.ok = Math.max(0, ds.ok - 1);
  else if (mark === "unfail") ds.fail = Math.max(0, ds.fail - 1);
  else if (mark === "nat20" && p) {
    const hp = playerHp(p);
    hp.cur = Math.max(1, hp.cur);
    delete c.deathSaves;
  }
}
