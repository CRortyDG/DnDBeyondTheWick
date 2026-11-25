// Morality and oaths: how each character is living, as the DM sees it.
//
// Two parts:
//
// 1. Morality, for every character. Two dials, the classic alignment axes:
//    lawful (+) to chaotic (-), and good (+) to evil (-), each -10..10. Each
//    dial falls into three bands (Lawful / Neutral / Chaotic, Good / Neutral /
//    Evil), so a character always reads as one of the nine alignments, and the
//    dot drifts as the DM logs what they do. The player sees their own place
//    (as much as the DM picks), never anyone else's.
//
// 2. An oath, for paladins (or anyone the DM gives a vow). The oath has tenets.
//    The DM logs a deed as upholding or breaking a tenet. Following the 5.1 SRD's
//    "Breaking Your Oath": a paladin who transgresses usually seeks absolution
//    (a vigil, a fast, a rite with a cleric or paladin of their order) and then
//    starts fresh; one who willfully breaks it and won't repent may, at the DM's
//    discretion, have to leave the class. So the app counts transgressions since
//    the last atonement and warns the DM, but only the DM declares an oath broken.

import { z } from "zod";
import type { GameState, Player } from "./types";

export const MORAL_MIN = -10;
export const MORAL_MAX = 10;
/** From here out (either way) a dial leaves Neutral. */
export const MORAL_EDGE = 4;
export const DEED_REASON_MAX = 160;
export const DEEDS_KEPT = 80;
/** A phone gets the newest this many reasons. */
export const DEEDS_PHONE = 8;
export const OATH_NAME_MAX = 60;
export const TENET_MAX = 200;
export const TENETS_MAX = 8;
/** The biggest step one deed moves a dial. */
export const DEED_STEP_MAX = 3;

export type Axis = "law" | "good";
export type OathMark = "upheld" | "broke" | "atoned" | "broken" | "restored";

/** DM-ONLY on the server side: one thing a character did, and how it moved them. */
export interface Deed {
  id: string;
  at: number;
  /** "Spared the bandit leader". Players may see it (see MoralitySettings.show) unless secret. */
  reason: string;
  /** How far each dial actually moved (after the ends). */
  law: number;
  good: number;
  /** set: the DM picked an alignment; dm: a logged deed. */
  source: "dm" | "set";
  sessionId?: string;
  /** The oath, for this deed: a tenet upheld or broken, or atonement / a broken or restored oath. */
  oath?: OathMark;
  /** Which tenet (its words), for upheld/broke. */
  tenet?: string;
  /** Players never see the reason. */
  secret?: true;
}

export interface Oath {
  /** "Oath of Devotion". */
  name: string;
  tenets: string[];
  /** The DM declared it broken (willful, unrepentant). Cleared by restoring it. */
  broken?: true;
}

/** A character's morality and oath. Missing: the DM hasn't set or logged anything. */
export interface Conduct {
  /** Lawful (+) to chaotic (-). */
  law: number;
  /** Good (+) to evil (-). */
  good: number;
  /** The DM has placed them (picked an alignment or logged a deed). Before that, phones show nothing. */
  placed?: true;
  log?: Deed[];
  oath?: Oath;
}

/** How morality works in this campaign. Missing: the defaults below. */
export interface MoralitySettings {
  /** What a player sees of their own: nothing, the alignment word, the chart too, or the chart and the reasons. */
  show: "none" | "label" | "chart" | "reasons";
  /** A paladin sees their oath's tenets and whether it's kept, strained or broken. */
  oathShow: boolean;
  /** Transgressions since the last atonement before the DM gets the "at risk" warning. */
  warnAt: number;
}

export const MORALITY_DEFAULTS: MoralitySettings = { show: "reasons", oathShow: true, warnAt: 3 };

export function moralitySettings(g: Pick<GameState, "morality">): MoralitySettings {
  return { ...MORALITY_DEFAULTS, ...(g.morality ?? {}) };
}

export const clampMoral = (n: number) => Math.max(MORAL_MIN, Math.min(MORAL_MAX, Math.round(n)));

// ---------- Alignment ----------

export type LawBand = "lawful" | "neutral" | "chaotic";
export type GoodBand = "good" | "neutral" | "evil";

export const lawBand = (n: number): LawBand => (n >= MORAL_EDGE ? "lawful" : n <= -MORAL_EDGE ? "chaotic" : "neutral");
export const goodBand = (n: number): GoodBand => (n >= MORAL_EDGE ? "good" : n <= -MORAL_EDGE ? "evil" : "neutral");

export const ALIGNMENTS = [
  { id: "lg", label: "Lawful Good", law: 6, good: 6 },
  { id: "ng", label: "Neutral Good", law: 0, good: 6 },
  { id: "cg", label: "Chaotic Good", law: -6, good: 6 },
  { id: "ln", label: "Lawful Neutral", law: 6, good: 0 },
  { id: "n", label: "Neutral", law: 0, good: 0 },
  { id: "cn", label: "Chaotic Neutral", law: -6, good: 0 },
  { id: "le", label: "Lawful Evil", law: 6, good: -6 },
  { id: "ne", label: "Neutral Evil", law: 0, good: -6 },
  { id: "ce", label: "Chaotic Evil", law: -6, good: -6 },
] as const;
export type AlignmentId = (typeof ALIGNMENTS)[number]["id"];
export const ALIGNMENT_IDS = ALIGNMENTS.map((a) => a.id) as [AlignmentId, ...AlignmentId[]];

export function alignmentOf(law: number, good: number): (typeof ALIGNMENTS)[number] {
  const l = lawBand(law);
  const g = goodBand(good);
  const id = (l === "lawful" ? "l" : l === "chaotic" ? "c" : "n") + (g === "good" ? "g" : g === "evil" ? "e" : "n");
  return ALIGNMENTS.find((a) => a.id === (id === "nn" ? "n" : id))!;
}

/** Close to a line on either dial: "Leaning chaotic", "Barely good". */
export function drift(c: Pick<Conduct, "law" | "good">): string | undefined {
  const one = (n: number, plus: string, minus: string) => {
    const word = n > 0 ? plus : minus;
    if (Math.abs(n) === MORAL_EDGE - 1) return `leaning ${word}`;
    if (Math.abs(n) === MORAL_EDGE) return `barely ${word}`;
    return "";
  };
  const parts = [one(c.law, "lawful", "chaotic"), one(c.good, "good", "evil")].filter(Boolean);
  if (!parts.length) return undefined;
  const t = parts.join(", ");
  return t[0].toUpperCase() + t.slice(1);
}

export const signedMoral = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : "±0");

/** "Lawful +2, Evil +1" for a deed. */
export function deedMoves(d: Pick<Deed, "law" | "good">): string {
  const out: string[] = [];
  if (d.law) out.push(`${d.law > 0 ? "Lawful" : "Chaotic"} +${Math.abs(d.law)}`);
  if (d.good) out.push(`${d.good > 0 ? "Good" : "Evil"} +${Math.abs(d.good)}`);
  return out.join(", ");
}

// ---------- Oaths ----------

/**
 * Oaths with tenets ready to fill in. Only Devotion is in the free rules (SRD);
 * the tenets are summed up in a line each. Anything else, the DM types.
 */
export const OATH_PRESETS: { name: string; tenets: string[] }[] = [
  {
    name: "Oath of Devotion",
    tenets: [
      "Honesty: don't lie or cheat. Let your word be your promise.",
      "Courage: never fear to act, though caution is wise.",
      "Compassion: aid others, protect the weak, punish those who threaten them. Show mercy to foes, tempered by wisdom.",
      "Honor: treat others with fairness, and let your honorable deeds be an example to them.",
      "Duty: be responsible for your actions and their consequences, protect those in your care, and obey those with just authority over you.",
    ],
  },
];

/** The words of the 5.1 SRD's guidance, in short, for the DM. */
export const OATH_RULES =
  "Free rules (SRD 5.1, Breaking Your Oath): a paladin who transgresses usually seeks absolution from a cleric or paladin of their order, an all-night vigil, or a fast, and then starts fresh. One who willfully breaks their oath and shows no sign of repentance may, at your discretion, have to give up the paladin class.";

export const isPaladin = (p: Pick<Player, "sheet">) => /paladin/i.test(p.sheet?.cls ?? "");

/** The preset that fits their sheet's subclass ("Oath of Devotion"), if any. */
export function oathPresetFor(p: Pick<Player, "sheet">): { name: string; tenets: string[] } | undefined {
  const sub = (p.sheet?.subclass ?? "").toLowerCase();
  return OATH_PRESETS.find((o) => sub && (sub.includes(o.name.toLowerCase()) || o.name.toLowerCase().includes(sub.replace(/^oath of (the )?/, "").trim()))) ?? (isPaladin(p) ? OATH_PRESETS[0] : undefined);
}

export type OathState = "kept" | "strained" | "atRisk" | "broken";

/** Transgressions logged since the last atonement (or since it was restored or declared broken). */
export function strainOf(c: Pick<Conduct, "log"> | undefined): number {
  let n = 0;
  for (const d of c?.log ?? []) {
    if (d.oath === "broke") n++;
    else if (d.oath === "atoned" || d.oath === "restored" || d.oath === "broken") n = 0;
  }
  return n;
}

export function oathState(c: Conduct | undefined, warnAt: number): OathState | undefined {
  if (!c?.oath) return undefined;
  if (c.oath.broken) return "broken";
  const n = strainOf(c);
  if (n === 0) return "kept";
  return n >= warnAt ? "atRisk" : "strained";
}

export const OATH_STATE_LABEL: Record<OathState, string> = { kept: "Kept", strained: "Strained", atRisk: "At risk", broken: "Broken" };

// ---------- Commands ----------

const id = z.string().min(1).max(64);
const step = z.number().int().min(-DEED_STEP_MAX).max(DEED_STEP_MAX);
const oathBody = z.object({ name: z.string().max(OATH_NAME_MAX), tenets: z.array(z.string().max(TENET_MAX)).max(TENETS_MAX) });

export const moralityDmCommands = [
  /** Log a deed: how it moved them, and (optionally) a tenet upheld or broken. */
  z.object({ type: z.literal("conduct.deed"), playerId: id, reason: z.string().max(DEED_REASON_MAX), law: step, good: step, oath: z.enum(["upheld", "broke"]).optional(), tenet: z.string().max(TENET_MAX).optional(), secret: z.boolean().optional() }),
  /** Place them at an alignment (null: clear their morality entirely, the oath stays). */
  z.object({ type: z.literal("conduct.set"), playerId: id, alignment: z.enum(ALIGNMENT_IDS).nullable() }),
  /** Take a deed back: the dials move back and it leaves the history. */
  z.object({ type: z.literal("conduct.undo"), playerId: id, deedId: id }),
  /** Hide a deed's reason from the player, or show it. */
  z.object({ type: z.literal("conduct.secret"), playerId: id, deedId: id, secret: z.boolean() }),
  /** Give them an oath (or change it), or take it away (null). */
  z.object({ type: z.literal("conduct.oath"), playerId: id, oath: oathBody.nullable() }),
  /** Atonement done, the oath declared broken, or restored. */
  z.object({ type: z.literal("conduct.oathMark"), playerId: id, mark: z.enum(["atoned", "broken", "restored"]), reason: z.string().max(DEED_REASON_MAX) }),
  /** The campaign's settings. */
  z.object({ type: z.literal("morality.set"), patch: z.object({ show: z.enum(["none", "label", "chart", "reasons"]), oathShow: z.boolean(), warnAt: z.number().int().min(1).max(10) }).partial() }),
] as const;

export type MoralityCommand = z.infer<(typeof moralityDmCommands)[number]>;

export function isMoralityCommand(cmd: { type: string }): cmd is MoralityCommand {
  return cmd.type.startsWith("conduct.") || cmd.type === "morality.set";
}

export interface MoralityHelpers {
  now: number;
  sessionId: string | null | undefined;
  nextId: (prefix: string) => string;
  fail: (m: string) => never;
}

const clean = (t: string) => t.replace(/\s+/g, " ").trim();

export function applyMorality(s: GameState, cmd: MoralityCommand, h: MoralityHelpers): void {
  if (cmd.type === "morality.set") {
    s.morality = { ...moralitySettings(s), ...cmd.patch };
    return;
  }
  const p = s.players.find((x) => x.id === cmd.playerId) ?? h.fail("That player isn't here.");
  const c = (): Conduct => (p.conduct ??= { law: 0, good: 0 });
  const log = (d: Omit<Deed, "id" | "at">) => {
    const x: Deed = { id: h.nextId("dd"), at: h.now, ...d, ...(h.sessionId ? { sessionId: h.sessionId } : {}) };
    const k = c();
    k.log = [...(k.log ?? []), x].slice(-DEEDS_KEPT);
    return x;
  };
  const move = (law: number, good: number) => {
    const k = c();
    const was = { law: k.law, good: k.good };
    k.law = clampMoral(k.law + law);
    k.good = clampMoral(k.good + good);
    k.placed = true;
    return { law: k.law - was.law, good: k.good - was.good };
  };
  const tidy = () => {
    const k = p.conduct;
    if (!k) return;
    if (!k.log?.length) delete k.log;
    if (!k.placed && !k.log && !k.oath) delete p.conduct;
  };
  switch (cmd.type) {
    case "conduct.deed": {
      const reason = clean(cmd.reason);
      const tenet = cmd.tenet ? clean(cmd.tenet) : "";
      if (!cmd.law && !cmd.good && !cmd.oath) h.fail("Pick which way it moves them, or a tenet upheld or broken.");
      if (cmd.oath && !p.conduct?.oath) h.fail("They haven't sworn an oath.");
      if (!reason && !tenet) h.fail("Say what they did.");
      const moved = move(cmd.law, cmd.good);
      log({ reason, ...moved, source: "dm", ...(cmd.oath ? { oath: cmd.oath } : {}), ...(cmd.oath && tenet ? { tenet } : {}), ...(cmd.secret ? { secret: true as const } : {}) });
      return;
    }
    case "conduct.set": {
      if (cmd.alignment === null) {
        if (!p.conduct) return;
        const oath = p.conduct.oath;
        if (oath) p.conduct = { law: 0, good: 0, oath, ...(p.conduct.log?.some((d) => d.oath) ? { log: p.conduct.log.filter((d) => d.oath && !d.law && !d.good) } : {}) };
        else delete p.conduct;
        tidy();
        return;
      }
      const a = ALIGNMENTS.find((x) => x.id === cmd.alignment)!;
      const k = c();
      const already = k.placed && alignmentOf(k.law, k.good).id === a.id;
      if (already) return;
      const moved = move(a.law - k.law, a.good - k.good);
      log({ reason: `Set to ${a.label}`, ...moved, source: "set" });
      return;
    }
    case "conduct.undo": {
      const k = p.conduct;
      const d = k?.log?.find((x) => x.id === cmd.deedId) ?? h.fail("That isn't in their history any more.");
      k!.law = clampMoral(k!.law - d.law);
      k!.good = clampMoral(k!.good - d.good);
      k!.log = k!.log!.filter((x) => x !== d);
      // Nothing left in the history: they're unplaced again.
      if (!k!.log.length) delete k!.placed;
      if (k!.oath && (d.oath === "broken" || d.oath === "restored")) {
        // Back to whatever the newest remaining mark said.
        const last = [...(k!.log ?? [])].reverse().find((x) => x.oath === "broken" || x.oath === "restored");
        if (last?.oath === "broken") k!.oath.broken = true;
        else delete k!.oath.broken;
      }
      tidy();
      return;
    }
    case "conduct.secret": {
      const d = p.conduct?.log?.find((x) => x.id === cmd.deedId) ?? h.fail("That isn't in their history any more.");
      if (cmd.secret) d.secret = true;
      else delete d.secret;
      return;
    }
    case "conduct.oath": {
      if (cmd.oath === null) {
        if (!p.conduct?.oath) return;
        delete p.conduct.oath;
        tidy();
        return;
      }
      const name = clean(cmd.oath.name);
      if (!name) h.fail("Name the oath.");
      const tenets = [...new Set(cmd.oath.tenets.map(clean).filter(Boolean))];
      const k = c();
      k.oath = { name, tenets, ...(k.oath?.broken ? { broken: true as const } : {}) };
      return;
    }
    case "conduct.oathMark": {
      const k = p.conduct;
      if (!k?.oath) h.fail("They haven't sworn an oath.");
      if (cmd.mark === "broken" && k.oath.broken) h.fail("Their oath is already broken.");
      if (cmd.mark === "restored" && !k.oath.broken) h.fail("Their oath isn't broken.");
      if (cmd.mark === "atoned" && k.oath.broken) h.fail("Their oath is broken. Restore it instead.");
      if (cmd.mark === "atoned" && strainOf(k) === 0) h.fail("Nothing to atone for.");
      if (cmd.mark === "broken") k.oath.broken = true;
      if (cmd.mark === "restored") delete k.oath.broken;
      const fallback = cmd.mark === "atoned" ? "Atoned" : cmd.mark === "broken" ? "Oath broken" : "Oath restored";
      log({ reason: clean(cmd.reason) || fallback, law: 0, good: 0, source: "dm", oath: cmd.mark });
      return;
    }
  }
}

// ---------- What a phone gets ----------

export interface MyMorality {
  /** "Neutral Good". */
  label: string;
  /** The chart: where they are. Missing: the DM shows the word only. */
  law?: number;
  good?: number;
  drift?: string;
  reasons?: { at: number; text: string; moves: string; tenet?: string; oath?: OathMark }[];
  oath?: { name: string; tenets: string[]; state: "kept" | "strained" | "broken" };
}

export function myMorality(g: Pick<GameState, "morality">, p: Pick<Player, "conduct">): MyMorality | undefined {
  const c = p.conduct;
  if (!c) return undefined;
  const set = moralitySettings(g);
  const out: Partial<MyMorality> = {};
  if (c.placed && set.show !== "none") {
    out.label = alignmentOf(c.law, c.good).label;
    if (set.show === "chart" || set.show === "reasons") {
      out.law = c.law;
      out.good = c.good;
      const d = drift(c);
      if (d) out.drift = d;
    }
  }
  if (c.oath && set.oathShow) {
    const st = oathState(c, set.warnAt)!;
    // "At risk" is the DM's warning: the paladin just feels the strain.
    out.oath = { name: c.oath.name, tenets: [...c.oath.tenets], state: st === "atRisk" ? "strained" : st };
  }
  if (set.show === "reasons") {
    const reasons = (c.log ?? [])
      // Oath deeds only when the oath is shown; never the DM's "Set to ..." moves.
      .filter((d) => !d.secret && d.source !== "set" && (d.reason || d.tenet) && (!d.oath || !!out.oath))
      .slice(-DEEDS_PHONE)
      .reverse()
      .map((d) => ({ at: d.at, text: d.reason, moves: deedMoves(d), ...(d.tenet ? { tenet: d.tenet } : {}), ...(d.oath ? { oath: d.oath } : {}) }));
    if (reasons.length) out.reasons = reasons;
  }
  if (!out.label && !out.oath) return undefined;
  return { label: out.label ?? "", ...out } as MyMorality;
}
