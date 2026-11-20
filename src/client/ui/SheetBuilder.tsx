"use client";

// The character builder (phase 5): a ready-made character in one tap, or step
// by step through class, species, background, scores, skills, kit and spells.
// The phone works out a preview with the same code the server checks with
// (shared/sheetBuild.ts), then sends the choices.

import { useEffect, useMemo, useState } from "react";
import { ABILITIES, ABILITY_NAME, ABILITY_SHORT, CLASSES, mod, SKILLS, sheetNumbers, signed, STANDARD_ARRAY, type Ability, type CharacterSheet, type SkillId } from "@/shared/sheet";
import {
  asiCountBy,
  buildSheet,
  DRACONIC_TYPE,
  expertiseBy,
  isSrdSubclass,
  KIT_CHOICES,
  kitChoicesFor,
  kitPick,
  LANGUAGES,
  lineageSpellsAt,
  lineageSpellsBy,
  nextLevel,
  ORIGIN_FEATS,
  POINT_BUY,
  POINT_COST,
  pointBuyCost,
  SCORE_CAP,
  SPECIES_BUILD,
  spellCounts,
  STARTER_BUILDS,
  type BuildChoices,
  type OriginFeat,
} from "@/shared/sheetBuild";
import { BUILD_BACKGROUND_DATA, BUILD_CLASS_DATA } from "@/shared/srdBuildData";
import { classSpell, SPELL_LEVEL_NAME, type SheetSpell } from "@/shared/sheetMagic";
import { STARTERS, type StarterId } from "@/shared/starters";
import { spellFromSrd, useSrdSpells, type SrdSpell } from "./SheetSpells";

/** The rules text (client/srd/builder.json): class features by level, species traits, feats. */
interface BuilderText {
  classes: Record<string, { f: [number, string, string][]; s: [number, string, string][] }>;
  species: Record<string, { t: [string, string][]; sub: Record<string, [string, string][]> }>;
  feats: Record<string, string>;
}
let textCache: BuilderText | null = null;
let textLoading: Promise<BuilderText> | null = null;
function useBuilderText(want = true): BuilderText | null {
  const [t, setT] = useState(textCache);
  useEffect(() => {
    if (!want || textCache) return;
    textLoading ??= import("../srd/builder.json").then((m) => (textCache = m.default as unknown as BuilderText));
    let live = true;
    void textLoading.then((x) => live && setT(x));
    return () => {
      live = false;
    };
  }, [want]);
  return t;
}

/** In plain words (our own). */
const CLASS_BLURB: Record<string, string> = {
  Barbarian: "Hits hard and shrugs off blows in a battle rage.",
  Bard: "Magic through music and words: helps friends, charms foes.",
  Cleric: "Holy magic to heal friends and smite foes.",
  Druid: "Nature magic, and later you turn into animals.",
  Fighter: "A master of weapons and armor. Simple and sturdy.",
  Monk: "Quick unarmed strikes and focus powers. No armor needed.",
  Paladin: "A holy knight: heavy armor, a healing touch, divine smites.",
  Ranger: "A hunter and tracker with bow or blade, and some nature magic.",
  Rogue: "Sneaky and skilled, and deadly striking where they don't look.",
  Sorcerer: "Born with magic, and bends spells to your will.",
  Warlock: "Magic from a pact with a powerful patron.",
  Wizard: "The widest magic there is, learned from a spellbook.",
};
const SPECIES_BLURB: Record<string, string> = {
  Dragonborn: "Dragon blood: a breath weapon, resistance, and later wings.",
  Dwarf: "Tough and steady. Extra hit points, sees far in the dark.",
  Elf: "Graceful, keen-eyed and long-lived, with a touch of magic.",
  Gnome: "Small, clever and hard to fool, with a little magic.",
  Goliath: "Giant blood: big, strong, fast, with a giant's gift.",
  Halfling: "Small, lucky and brave. Good at hiding.",
  Human: "Adaptable: an extra skill and an extra feat.",
  Orc: "Strong and hard to put down. Sees far in the dark.",
  Tiefling: "Fiendish blood, with spells from your legacy.",
};
/** The abilities a class leans on, best first (the SRD's primary abilities). */
const PRIMARY: Record<string, Ability[]> = {
  Barbarian: ["str"],
  Bard: ["cha"],
  Cleric: ["wis"],
  Druid: ["wis"],
  Fighter: ["str", "dex"],
  Monk: ["dex", "wis"],
  Paladin: ["str", "cha"],
  Ranger: ["dex", "wis"],
  Rogue: ["dex"],
  Sorcerer: ["cha"],
  Warlock: ["cha"],
  Wizard: ["int"],
};
const SPECIES_LANG: Record<string, string> = { Dragonborn: "Draconic", Dwarf: "Dwarvish", Elf: "Elvish", Gnome: "Gnomish", Goliath: "Giant", Halfling: "Halfling", Orc: "Orc" };
const skillName = (id: string) => SKILLS.find((s) => s.id === id)?.name ?? id;
const join = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);
const newId = () => Math.random().toString(36).slice(2, 10);

/** Where the standard array goes for a class: its best abilities, then Constitution, then the rest. */
function suggestOrder(cls: string | undefined): Ability[] {
  const p = (cls && PRIMARY[cls]) || ["str"];
  const rest: Ability[] = ["con", "dex", "wis", "cha", "int", "str"];
  return [...p, ...rest.filter((a) => !p.includes(a))];
}
const arrayFor = (cls: string | undefined) => Object.fromEntries(suggestOrder(cls).map((a, i) => [a, STANDARD_ARRAY[i]])) as Record<Ability, number>;
function bonusFor(cls: string | undefined, bg: string | undefined): BuildChoices["bonus"] {
  const ab = (bg && (BUILD_BACKGROUND_DATA[bg]?.ab as Ability[])) || [];
  const order = suggestOrder(cls).filter((a) => ab.includes(a));
  return order.length >= 2 ? { [order[0]]: 2, [order[1]]: 1 } : {};
}
/** Magic Initiate's spell list: the background says, or a Human picks. */
const initiateList = (bg: string | undefined, pick: string) => (bg === "Acolyte" ? "Cleric" : bg === "Sage" ? "Wizard" : pick);

type Step = "start" | "class" | "species" | "background" | "scores" | "skills" | "kit" | "spells" | "review";

interface Draft {
  cls?: string;
  species?: string;
  lineage?: string;
  background?: string;
  method: BuildChoices["method"];
  base: Record<Ability, number>;
  bonus: BuildChoices["bonus"];
  asi: Partial<Record<Ability, number>>;
  skills: SkillId[];
  keen: SkillId[];
  anySkills: SkillId[];
  expertise: SkillId[];
  feat?: OriginFeat;
  kit: number;
  bgKit: boolean;
  /** Kit lines that are a choice ("Gaming Set"): what they picked. */
  kitPicks: Record<string, string>;
  classSpells: string[];
  miSpells: string[];
  miList: string;
  langs: string[];
  subclass: string;
  /** Picked as a ready-made: the review comes straight up. */
  ready?: StarterId;
}

const emptyDraft = (): Draft => ({ method: "standard", base: arrayFor(undefined), bonus: {}, asi: {}, skills: [], keen: [], anySkills: [], expertise: [], kit: 0, bgKit: true, kitPicks: {}, classSpells: [], miSpells: [], miList: "Wizard", langs: [], subclass: "" });

function draftFromStarter(id: StarterId, level: number): Draft {
  const b = STARTER_BUILDS[id];
  const c = b.choices;
  const sp = SPECIES_BUILD[c.species];
  const extra = c.extraSkills ?? [];
  const keen = sp.pickSkillFrom ? extra.filter((s) => sp.pickSkillFrom!.includes(s)).slice(0, 1) : [];
  return {
    ...emptyDraft(),
    cls: c.cls,
    species: c.species,
    lineage: c.lineage,
    background: c.background,
    method: c.method,
    base: { ...c.base },
    bonus: { ...c.bonus },
    skills: [...c.skills],
    keen,
    anySkills: extra.filter((s) => !keen.includes(s)),
    expertise: [...(c.expertise ?? [])],
    feat: c.feat,
    kit: c.kit,
    bgKit: c.bgKit,
    classSpells: [...b.spells],
    miSpells: [...b.initiate],
    miList: initiateList(c.background, "Wizard"),
    asi: readyAsi(c.cls, { ...c.base }, c.bonus, level),
    langs: starterLangs(c.species),
    ready: id,
  };
}

/** A ready-made above level 4: its Ability Score Improvements go into its best abilities, up to 20. */
function readyAsi(cls: string, base: Record<Ability, number>, bonus: BuildChoices["bonus"], level: number): Partial<Record<Ability, number>> {
  let pts = 2 * asiCountBy(cls, level);
  const out: Partial<Record<Ability, number>> = {};
  for (const a of suggestOrder(cls)) {
    const room = SCORE_CAP - base[a] - (bonus[a] ?? 0);
    const n = Math.min(room, pts);
    if (n > 0) {
      out[a] = n;
      pts -= n;
    }
    if (!pts) break;
  }
  return out;
}
/** A ready-made comes with its two languages picked: its species' own, and a common second. */
function starterLangs(species: string): string[] {
  const own = defaultLangs(species);
  const more = ["Elvish", "Dwarvish", "Halfling"].filter((l) => !own.includes(l));
  return [...own, ...more].slice(0, 2);
}
function defaultLangs(species: string | undefined): string[] {
  const own = species ? SPECIES_LANG[species] : undefined;
  return own ? [own] : [];
}

/** The feats a draft has: the background's, and a Human's second. */
function featsOf(d: Draft): string[] {
  const bg = d.background ? BUILD_BACKGROUND_DATA[d.background] : undefined;
  return [...(bg ? [bg.feat] : []), ...(d.species === "Human" && d.feat ? [d.feat] : [])];
}

/** The spells a draft ends with, as sheet spells (needs the SRD list loaded). */
function spellsOf(d: Draft, level: number, srd: SrdSpell[] | null): SheetSpell[] {
  if (!srd) return [];
  const by = new Map(srd.map((s) => [s.i, s]));
  const out: SheetSpell[] = [];
  const seen = new Set<string>();
  const add = (i: string, note?: string) => {
    const o = by.get(i);
    if (!o || seen.has(i)) return;
    seen.add(i);
    const sp = spellFromSrd(o);
    if (note) {
      // From a feat or species: extra, on top of the class's own number.
      sp.note = note;
      sp.bonus = true;
    }
    out.push(sp);
  };
  for (const i of d.classSpells) add(i);
  const once = "Always prepared. Once per long rest without a slot.";
  if (featsOf(d).includes("Magic Initiate")) for (const i of d.miSpells) add(i, `Magic Initiate (${initiateList(d.background, d.miList)}). ${by.get(i)?.l ? once : ""}`.trim());
  for (const i of lineageSpellsBy(d.lineage, level)) add(i, `${d.lineage}. ${by.get(i)?.l ? once : ""}`.trim());
  return out;
}

function choicesOf(d: Draft, level: number, srd: SrdSpell[] | null, text: BuilderText | null): BuildChoices | null {
  if (!d.cls || !d.species || !d.background) return null;
  const cd = BUILD_CLASS_DATA[d.cls];
  const bg = BUILD_BACKGROUND_DATA[d.background];
  const sp = SPECIES_BUILD[d.species];
  const feats = featsOf(d);
  // Features & traits, as names (the full text is a tap away in the builder).
  const lines: string[] = [];
  const ct = text?.classes[d.cls];
  if (ct) {
    const names = ct.f.filter(([l]) => l <= level).map(([l, n]) => (l > 1 ? `${n} (${l})` : n));
    if (names.length) lines.push(`${d.cls}: ${[...new Set(names)].join(", ")}`);
    // Only the free rules' subclass has its features here: another one, they type in.
    const sub = level >= cd.subAt && isSrdSubclass(d.cls, d.subclass) ? ct.s.filter(([l]) => l <= level).map(([l, n]) => `${n} (${l})`) : [];
    if (sub.length) lines.push(`${d.subclass.trim() || cd.sub}: ${sub.join(", ")}`);
    else if (level >= cd.subAt && d.subclass.trim()) lines.push(`${d.subclass.trim()}: (type its features here)`);
  }
  const st = text?.species[d.species];
  if (st) {
    const names = st.t.map(([n]) => n).filter((n) => !/Lineage|Legacy|Ancestry$/.test(n) || d.species === "Goliath");
    const lin = d.lineage ? (st.sub[d.lineage] ?? []).map(([n]) => n) : [];
    lines.push(`${d.lineage && d.species !== "Elf" && d.species !== "Gnome" ? `${d.species} (${d.lineage})` : d.lineage || d.species}: ${[...names, ...lin].join(", ")}`);
  }
  if (d.species === "Dragonborn" && d.lineage) lines.push(`Breath Weapon and resistance: ${DRACONIC_TYPE[d.lineage]}`);
  lines.push(`Feats: ${feats.map((f) => (f === "Magic Initiate" ? `Magic Initiate (${initiateList(d.background, d.miList)})` : f)).join(", ")}`);
  const langs = ["Common", ...d.langs];
  // Tools: the background's (a Gaming Set is the one they picked) and a Monk's tool or instrument.
  const tools = [...(bg.tool ? [kitPick(bg.tool, d.kitPicks)] : []), ...(d.cls === "Monk" ? [kitPick("Artisan’s Tools or Musical Instrument", d.kitPicks)] : [])];
  const profs = [`Armor and weapons: ${cd.profs}`, tools.length ? `Tools: ${[...new Set(tools)].join(", ")}` : "", `Languages: ${langs.join(", ")}`].filter(Boolean).join("\n");
  return {
    cls: d.cls,
    ...(d.subclass.trim() ? { subclass: d.subclass.trim() } : {}),
    species: d.species,
    ...(sp.lineage && d.lineage ? { lineage: d.lineage } : {}),
    background: d.background,
    method: d.method,
    base: d.base,
    bonus: d.bonus,
    ...(Object.keys(d.asi).length ? { asi: d.asi } : {}),
    skills: d.skills,
    extraSkills: [...d.keen, ...d.anySkills],
    expertise: d.expertise,
    ...(d.species === "Human" && d.feat ? { feat: d.feat } : {}),
    kit: d.kit,
    bgKit: d.bgKit,
    ...(Object.keys(d.kitPicks).length ? { kitPicks: d.kitPicks } : {}),
    spells: spellsOf(d, level, srd),
    traits: lines.join("\n"),
    profs,
  };
}

/** A local run of the server's own check: the sheet it would make, or why not. */
function preview(c: BuildChoices | null, level: number): { sheet: CharacterSheet; maxHp: number; gp: number } | string {
  if (!c) return "Pick a class, species and background first.";
  try {
    let n = 0;
    return buildSheet(c, level, {
      now: 0,
      newId: () => `p${++n}`,
      fail: (m) => {
        throw new Error(m);
      },
    });
  } catch (e) {
    return (e as Error).message;
  }
}

/** The builder keeps its place on this phone (per game and player), so a screen lock or a reload loses nothing. */
const draftKey = () => `cb-draft:${typeof location === "undefined" ? "" : location.search}`;
const STEPS: Step[] = ["start", "class", "species", "background", "scores", "skills", "kit", "spells", "review"];
function loadDraft(level: number): { step: Step; d: Draft } | null {
  try {
    const x = JSON.parse(localStorage.getItem(draftKey()) ?? "null") as { step?: Step; d?: Draft; level?: number } | null;
    if (!x?.d || !x.step || !STEPS.includes(x.step) || x.step === "start" || x.level !== level) return null;
    return { step: x.step, d: { ...emptyDraft(), ...x.d } };
  } catch {
    return null;
  }
}
function saveDraft(step: Step, d: Draft, level: number) {
  try {
    localStorage.setItem(draftKey(), JSON.stringify({ step, d, level }));
  } catch {
    // Private browsing: nothing kept, the builder still works.
  }
}
function clearDraft() {
  try {
    localStorage.removeItem(draftKey());
  } catch {
    // Nothing to clear.
  }
}

export function SheetBuilder({
  level: lv,
  starter,
  replacing,
  send,
  onClose,
}: {
  level: number | undefined;
  /** Their pick on the Arrival seat page. */
  starter?: string | null;
  /** They have a sheet already: this replaces it. */
  replacing: boolean;
  send: (c: object) => Promise<string | null>;
  onClose: () => void;
}) {
  const level = Math.min(20, Math.max(1, lv ?? 1));
  const [saved] = useState(() => loadDraft(level));
  const [step, setStep] = useState<Step>(saved?.step ?? "start");
  const [d, setD] = useState<Draft>(saved?.d ?? emptyDraft);
  const [resumed, setResumed] = useState(!!saved);
  const [leaving, setLeaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    if (step !== "start") saveDraft(step, d, level);
  }, [step, d, level]);
  const [busy, setBusy] = useState(false);
  const text = useBuilderText();
  const srd = useSrdSpells(true);
  const set = (p: Partial<Draft>) => setD((x) => ({ ...x, ...p }));
  const choices = useMemo(() => choicesOf(d, level, srd, text), [d, level, srd, text]);
  const pv = useMemo(() => preview(choices, level), [choices, level]);

  const counts = d.cls ? spellCounts(d.cls, level) : { cantrips: 0, prepared: 0, maxLevel: 0 };
  const hasMi = featsOf(d).includes("Magic Initiate");
  const steps: Step[] = ["class", "species", "background", "scores", "skills", "kit", ...(counts.cantrips || counts.prepared || hasMi ? (["spells"] as Step[]) : []), "review"];
  const at = steps.indexOf(step);
  const go = (s: Step) => {
    setErr(null);
    setStep(s);
    window.scrollTo?.({ top: 0 });
  };
  const next = () => go(steps[Math.min(steps.length - 1, at + 1)]);
  const back = () => (at <= 0 ? go("start") : go(steps[at - 1]));
  const ready = stepReady(step, d, level);

  const make = async () => {
    if (!choices || typeof pv === "string") return;
    setBusy(true);
    const e = await send({ type: "me.build", choices });
    setBusy(false);
    if (e) setErr(e);
    else {
      clearDraft();
      onClose();
    }
  };

  if (step === "start") {
    return (
      <section className="box cb cb-make" aria-label="Make a character">
        <div className="cb-top">
          <h2>Make your character</h2>
          <button type="button" className="btn small" onClick={onClose}>
            Cancel
          </button>
        </div>
        <p>Pick a ready-made hero to start playing straight away, or build your own step by step. Everything here is from the free 2024 rules (SRD 5.2){level > 1 ? `, at level ${level}` : ""}.</p>
        {replacing ? <p className="note">This replaces your sheet. Things you bought and your notes stay.</p> : null}
        <h3 className="cs-h">Ready-made</h3>
        <div className="cb-grid">
          {STARTERS.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`cb-card${starter === s.id ? " on" : ""}`}
              onClick={() => {
                setD(draftFromStarter(s.id, level));
                go("review");
              }}
            >
              <b>{s.title}</b>
              <span>{s.feel}</span>
              <small>
                {STARTER_BUILDS[s.id].choices.lineage && (s.dnd.species === "Elf" || s.dnd.species === "Gnome") ? STARTER_BUILDS[s.id].choices.lineage : s.dnd.species} {s.dnd.cls} · {s.dnd.background}
                {starter === s.id ? " · your pick" : ""}
              </small>
            </button>
          ))}
        </div>
        <button
          type="button"
          className="btn primary big"
          onClick={() => {
            setD(emptyDraft());
            go("class");
          }}
        >
          Build my own, step by step
        </button>
      </section>
    );
  }

  return (
    <section className="box cb cb-make" aria-label="Make a character">
      <div className="cb-top">
        <button type="button" className="btn small" onClick={d.ready && step === "review" ? () => go("start") : back}>
          &larr; Back
        </button>
        <span className="cb-step">{d.ready && step === "review" ? STARTERS.find((s) => s.id === d.ready)?.title : `Step ${at + 1} of ${steps.length}`}</span>
        <button type="button" className="btn small" onClick={() => setLeaving(true)}>
          Cancel
        </button>
      </div>
      {leaving ? (
        <div className="cb-leave" role="alertdialog" aria-label="Stop building?">
          <p>Stop building? Your choices stay on this phone for next time.</p>
          <div className="cb-leave-btns">
            <button type="button" className="btn small primary" onClick={() => setLeaving(false)}>
              Keep building
            </button>
            <button type="button" className="btn small" onClick={onClose}>
              Stop for now
            </button>
            <button
              type="button"
              className="btn small danger"
              onClick={() => {
                clearDraft();
                onClose();
              }}
            >
              Throw them away
            </button>
          </div>
        </div>
      ) : null}
      {resumed ? (
        <p className="note cb-resumed">
          Picked up where you left off.{" "}
          <button
            type="button"
            className="cb-more-btn"
            onClick={() => {
              clearDraft();
              setResumed(false);
              setD(emptyDraft());
              go("start");
            }}
          >
            Start over
          </button>
        </p>
      ) : null}
      {step === "class" ? <ClassStep d={d} set={set} level={level} text={text} /> : null}
      {step === "species" ? <SpeciesStep d={d} set={set} text={text} /> : null}
      {step === "background" ? <BackgroundStep d={d} set={set} text={text} /> : null}
      {step === "scores" ? <ScoresStep d={d} set={set} level={level} /> : null}
      {step === "skills" ? <SkillsStep d={d} set={set} level={level} /> : null}
      {step === "kit" ? <KitStep d={d} set={set} /> : null}
      {step === "spells" ? <SpellsStep d={d} set={set} level={level} srd={srd} counts={counts} hasMi={hasMi} /> : null}
      {step === "review" ? <ReviewStep d={d} set={set} level={level} pv={pv} replacing={replacing} edit={d.ready ? () => set({ ready: undefined }) : undefined} goStep={go} /> : null}
      {err ? (
        <p className="cs-err" role="alert">
          {err}
        </p>
      ) : null}
      <div className="cb-foot">
        {step === "review" ? (
          <>
            {d.langs.length < 2 ? <p className="note">Pick your two languages above.</p> : null}
            <button type="button" className="btn primary big" disabled={busy || typeof pv === "string" || !srd || !text || d.langs.length < 2} onClick={() => void make()}>
              {busy ? "Making…" : replacing ? "Replace my sheet with this" : "Make my character"}
            </button>
          </>
        ) : (
          <>
            {!ready.ok ? <p className="note">{ready.why}</p> : null}
            <button type="button" className="btn primary big" disabled={!ready.ok} onClick={next}>
              Next
            </button>
          </>
        )}
      </div>
    </section>
  );
}

function stepReady(step: Step, d: Draft, level: number): { ok: boolean; why?: string } {
  const no = (why: string) => ({ ok: false, why });
  switch (step) {
    case "class":
      return d.cls ? { ok: true } : no("Pick a class.");
    case "species": {
      if (!d.species) return no("Pick a species.");
      const sp = SPECIES_BUILD[d.species];
      if (sp.lineage && !d.lineage) return no(`Pick a ${sp.lineage.label}.`);
      if (sp.human && !d.feat) return no("Pick your extra feat.");
      return { ok: true };
    }
    case "background":
      if (!d.background) return no("Pick a background.");
      if (d.species === "Human" && d.feat === BUILD_BACKGROUND_DATA[d.background]?.feat) return no(`Pick a different Human feat: ${d.background} already gives ${d.feat}.`);
      return { ok: true };
    case "scores": {
      if (d.method === "pointbuy") {
        const c = pointBuyCost(d.base);
        if (c === null || c > POINT_BUY) return no(`Point buy has ${POINT_BUY} points.`);
      }
      const vals = Object.values(d.bonus);
      if (!(vals.length === 2 || vals.length === 3)) return no("Pick where your background's bonus goes.");
      const asiLeft = 2 * asiCountBy(d.cls, level) - Object.values(d.asi).reduce((n, v) => n + (v ?? 0), 0);
      if (asiLeft > 0) return no(`Spend ${asiLeft} more Ability Score Improvement point${asiLeft === 1 ? "" : "s"} (or take a feat: type it in later).`);
      return { ok: true };
    }
    case "skills": {
      const cd = BUILD_CLASS_DATA[d.cls!];
      if (d.skills.length !== cd.skills.n) return no(`Pick ${cd.skills.n} skills from your class.`);
      const sp = SPECIES_BUILD[d.species!];
      if (sp.pickSkillFrom && d.keen.length !== 1) return no("Pick one skill for Keen Senses.");
      const anyN = (sp.human ? 1 : 0) + (featsOf(d).includes("Skilled") ? 3 : 0);
      if (d.anySkills.length !== anyN) return no(`Pick ${anyN} more skill${anyN === 1 ? "" : "s"}.`);
      const ex = expertiseBy(d.cls, level);
      if (d.expertise.length !== ex) return no(`Pick ${ex} skill${ex === 1 ? "" : "s"} for Expertise.`);
      return { ok: true };
    }
    default:
      return { ok: true };
  }
}

type StepProps = { d: Draft; set: (p: Partial<Draft>) => void };

function Rules({ name, text }: { name: string; text?: string }) {
  if (!text) return <li>{name}</li>;
  return (
    <li>
      <details className="cb-rule">
        <summary>{name}</summary>
        <div className="cs-prose cs-spell-text">{text.replace(/\*\*/g, "")}</div>
      </details>
    </li>
  );
}

function ClassStep({ d, set, level, text }: StepProps & { level: number; text: BuilderText | null }) {
  return (
    <>
      <h2>Pick a class</h2>
      <p className="note">Your class is what you do best. Tap one to see what it gets at level {level}.</p>
      <div className="cb-list" role="radiogroup" aria-label="Class">
        {CLASSES.map((c) => {
          const on = d.cls === c.name;
          return (
            <div key={c.name} className={`cb-row${on ? " on" : ""}`}>
              <button
                type="button"
                role="radio"
                aria-checked={on}
                className="cb-row-btn"
                onClick={() => set({ cls: c.name, base: d.method === "standard" ? arrayFor(c.name) : d.base, bonus: bonusFor(c.name, d.background), skills: [], expertise: [], kit: 0, classSpells: [], subclass: "" })}
              >
                <b>{c.name}</b>
                <span>{CLASS_BLURB[c.name]}</span>
                <small>
                  d{c.hitDie} hit die · best: {(PRIMARY[c.name] ?? []).map((a) => ABILITY_NAME[a]).join(" or ")}
                </small>
              </button>
              {on && text ? (
                <ul className="cb-rules">
                  {text.classes[c.name].f
                    .filter(([l]) => l <= level)
                    .map(([l, n, t]) => (
                      <Rules key={`${l}${n}`} name={l > 1 ? `${n} (level ${l})` : n} text={t} />
                    ))}
                </ul>
              ) : null}
            </div>
          );
        })}
      </div>
    </>
  );
}

function SpeciesStep({ d, set, text }: StepProps & { text: BuilderText | null }) {
  return (
    <>
      <h2>Pick a species</h2>
      <p className="note">Where your character comes from, and what they're born with.</p>
      <div className="cb-list" role="radiogroup" aria-label="Species">
        {Object.entries(SPECIES_BUILD).map(([name, sp]) => {
          const on = d.species === name;
          const st = text?.species[name];
          return (
            <div key={name} className={`cb-row${on ? " on" : ""}`}>
              <button
                type="button"
                role="radio"
                aria-checked={on}
                className="cb-row-btn"
                onClick={() => !on && set({ species: name, lineage: undefined, keen: [], anySkills: [], feat: undefined, langs: defaultLangs(name) })}
              >
                <b>{name}</b>
                <span>{SPECIES_BLURB[name]}</span>
                <small>
                  Speed {sp.speed} ft.{sp.dark ? ` · darkvision ${sp.dark} ft.` : ""}
                </small>
              </button>
              {on ? (
                <div className="cb-more">
                  {sp.lineage ? (
                    <div className="cb-chips" role="radiogroup" aria-label={sp.lineage.label}>
                      <span className="note">{sp.lineage.label}:</span>
                      {sp.lineage.options.map((o) => (
                        <button key={o} type="button" role="radio" aria-checked={d.lineage === o} className={`cb-pick${d.lineage === o ? " on" : ""}`} onClick={() => set({ lineage: o })}>
                          {o}
                          {name === "Dragonborn" ? ` (${DRACONIC_TYPE[o]})` : ""}
                        </button>
                      ))}
                    </div>
                  ) : null}
                  {sp.human ? (
                    <div className="cb-chips" role="radiogroup" aria-label="Extra feat">
                      <span className="note">Versatile, your extra feat:</span>
                      {ORIGIN_FEATS.map((f) => {
                        // Not the one their background already gives (an origin feat is taken once).
                        const fromBg = d.background ? BUILD_BACKGROUND_DATA[d.background]?.feat === f : false;
                        return (
                          <button key={f} type="button" role="radio" aria-checked={d.feat === f} disabled={fromBg} className={`cb-pick${d.feat === f ? " on" : ""}`} onClick={() => set({ feat: f, anySkills: [] })}>
                            {f}
                            {fromBg ? ` (from ${d.background})` : ""}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                  {sp.human && d.feat && text ? <div className="cs-prose cs-spell-text">{text.feats[d.feat]?.replace(/\*\*/g, "")}</div> : null}
                  {st ? (
                    <ul className="cb-rules">
                      {st.t.map(([n, t]) => (
                        <Rules key={n} name={n} text={t} />
                      ))}
                      {d.lineage
                        ? (st.sub[d.lineage] ?? []).map(([n, t]) => (
                            <Rules key={`l${n}`} name={n} text={t} />
                          ))
                        : null}
                    </ul>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </>
  );
}

function BackgroundStep({ d, set, text }: StepProps & { text: BuilderText | null }) {
  return (
    <>
      <h2>Pick a background</h2>
      <p className="note">What your character did before adventuring. It raises three ability scores and gives two skills and a feat.</p>
      <div className="cb-list" role="radiogroup" aria-label="Background">
        {Object.entries(BUILD_BACKGROUND_DATA).map(([name, bg]) => {
          const on = d.background === name;
          const feat = bg.feat === "Magic Initiate" ? `Magic Initiate (${initiateList(name, d.miList)})` : bg.feat;
          return (
            <div key={name} className={`cb-row${on ? " on" : ""}`}>
              <button type="button" role="radio" aria-checked={on} className="cb-row-btn" onClick={() => set({ background: name, bonus: bonusFor(d.cls, name), skills: d.skills.filter((s) => !bg.skills.includes(s)), miSpells: [], anySkills: [] })}>
                <b>{name}</b>
                <span>
                  {join(bg.skills.map(skillName))}
                  {bg.tool ? `, ${bg.tool}` : ""} · {feat}
                </span>
                <small>Raises {join(bg.ab.map((a) => ABILITY_NAME[a as Ability]))}</small>
              </button>
              {on && d.species === "Human" && d.feat === bg.feat ? (
                <div className="cb-chips" role="radiogroup" aria-label="Extra feat">
                  <span className="note">{name} already gives you {bg.feat}, so pick a different Human feat:</span>
                  {ORIGIN_FEATS.filter((f) => f !== bg.feat).map((f) => (
                    <button key={f} type="button" role="radio" aria-checked={false} className="cb-pick" onClick={() => set({ feat: f, anySkills: [] })}>
                      {f}
                    </button>
                  ))}
                </div>
              ) : null}
              {on && text ? (
                <ul className="cb-rules">
                  <Rules name={feat} text={text.feats[bg.feat]} />
                </ul>
              ) : null}
            </div>
          );
        })}
      </div>
    </>
  );
}

function ScoresStep({ d, set, level }: StepProps & { level: number }) {
  const bg = d.background ? BUILD_BACKGROUND_DATA[d.background] : undefined;
  const ab = (bg?.ab ?? []) as Ability[];
  const cost = pointBuyCost(d.base);
  const asiMax = 2 * asiCountBy(d.cls, level);
  const asiUsed = Object.values(d.asi).reduce((n, v) => n + (v ?? 0), 0);
  const total = (a: Ability) => d.base[a] + (d.bonus[a] ?? 0) + (d.asi[a] ?? 0);
  const three = Object.keys(d.bonus).length === 3;
  const setMethod = (m: Draft["method"]) => set({ method: m, base: m === "pointbuy" ? { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 } : m === "standard" ? arrayFor(d.cls) : d.base });
  const swapStd = (a: Ability, v: number) => {
    const other = ABILITIES.find((x) => x !== a && d.base[x] === v);
    const base = { ...d.base, [a]: v };
    if (other) base[other] = d.base[a];
    set({ base });
  };
  const roll = () => {
    const one = () => {
      const r = [0, 0, 0, 0].map(() => 1 + Math.floor(Math.random() * 6)).sort((x, y) => x - y);
      return r[1] + r[2] + r[3];
    };
    const vals = ABILITIES.map(one).sort((x, y) => y - x);
    set({ base: Object.fromEntries(suggestOrder(d.cls).map((a, i) => [a, vals[i]])) as Record<Ability, number> });
  };
  return (
    <>
      <h2>Ability scores</h2>
      <p className="note">
        {d.cls}s lean on {join((PRIMARY[d.cls ?? ""] ?? []).map((a) => ABILITY_NAME[a]))}: put your best number there. We&rsquo;ve suggested a spread you can change.
      </p>
      <div className="pl-seg" role="group" aria-label="How to set scores">
        {(
          [
            ["standard", "Standard array"],
            ["pointbuy", "Point buy"],
            ["rolled", "I rolled"],
          ] as const
        ).map(([m, l]) => (
          <button key={m} type="button" className={d.method === m ? "on" : undefined} aria-pressed={d.method === m} onClick={() => d.method !== m && setMethod(m)}>
            {l}
          </button>
        ))}
      </div>
      {d.method === "pointbuy" ? <p className="note">{cost === null ? "Scores go from 8 to 15." : `${POINT_BUY - cost} of ${POINT_BUY} points left.`}</p> : null}
      {d.method === "rolled" ? (
        <button type="button" className="btn small" onClick={roll}>
          Roll 4d6 for me (drop the lowest)
        </button>
      ) : null}
      <div className="cb-scores">
        {ABILITIES.map((a) => {
          const t = total(a);
          return (
            <div key={a} className="cb-score">
              <span className="cb-ab">{ABILITY_SHORT[a]}</span>
              {d.method === "standard" ? (
                <select className="fld" aria-label={ABILITY_NAME[a]} value={d.base[a]} onChange={(e) => swapStd(a, Number(e.target.value))}>
                  {STANDARD_ARRAY.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              ) : d.method === "pointbuy" ? (
                <span className="cb-step-n">
                  <button type="button" className="btn small" aria-label={`Lower ${ABILITY_NAME[a]}`} disabled={d.base[a] <= 8} onClick={() => set({ base: { ...d.base, [a]: d.base[a] - 1 } })}>
                    &minus;
                  </button>
                  <b>{d.base[a]}</b>
                  <button
                    type="button"
                    className="btn small"
                    aria-label={`Raise ${ABILITY_NAME[a]}`}
                    disabled={d.base[a] >= 15 || (cost ?? 99) + (POINT_COST[d.base[a] + 1] ?? 99) - (POINT_COST[d.base[a]] ?? 0) > POINT_BUY}
                    onClick={() => set({ base: { ...d.base, [a]: d.base[a] + 1 } })}
                  >
                    +
                  </button>
                </span>
              ) : (
                <input
                  className="fld"
                  inputMode="numeric"
                  aria-label={ABILITY_NAME[a]}
                  value={d.base[a]}
                  onChange={(e) => {
                    const v = Math.round(Number(e.target.value));
                    if (Number.isFinite(v)) set({ base: { ...d.base, [a]: Math.min(18, Math.max(3, v)) } });
                  }}
                />
              )}
              <span className="cb-plus">
                {d.bonus[a] ? `+${d.bonus[a]}` : ""}
                {d.asi[a] ? ` +${d.asi[a]}` : ""}
              </span>
              <span className={`cb-total${t > SCORE_CAP ? " bad" : ""}`}>
                {t} <small>({signed(mod(t))})</small>
              </span>
            </div>
          );
        })}
      </div>
      {bg ? (
        <div className="cb-block">
          <h3 className="cs-h">{d.background} raises</h3>
          <div className="pl-seg" role="group" aria-label="Background bonus">
            <button type="button" className={!three ? "on" : undefined} aria-pressed={!three} onClick={() => set({ bonus: bonusFor(d.cls, d.background) })}>
              +2 and +1
            </button>
            <button type="button" className={three ? "on" : undefined} aria-pressed={three} onClick={() => set({ bonus: Object.fromEntries(ab.map((x) => [x, 1])) })}>
              +1 to all three
            </button>
          </div>
          {!three ? (
            <div className="cb-chips">
              {ab.map((a) => {
                const v = d.bonus[a];
                return (
                  <button
                    key={a}
                    type="button"
                    className={`cb-pick${v ? " on" : ""}`}
                    onClick={() => {
                      // Tap cycles: the +2, the +1, then the other swaps in.
                      const two = ab.find((x) => d.bonus[x] === 2);
                      const one = ab.find((x) => d.bonus[x] === 1);
                      if (v === 2) set({ bonus: { [a]: 1, ...(one ? { [one]: 2 } : {}) } });
                      else if (v === 1) set({ bonus: { [a]: 2, ...(two ? { [two]: 1 } : {}) } });
                      else set({ bonus: { ...(two ? { [two]: 2 } : {}), [a]: 1 } });
                    }}
                  >
                    {ABILITY_NAME[a]}
                    {v ? ` +${v}` : ""}
                  </button>
                );
              })}
            </div>
          ) : null}
          <p className="note">Tap to choose which gets +2 and which +1.</p>
        </div>
      ) : null}
      {asiMax ? (
        <div className="cb-block">
          <h3 className="cs-h">Ability Score Improvements</h3>
          <p className="note">
            At level {level} you have {asiMax} points to add ({asiMax - asiUsed} left), up to {SCORE_CAP} each. Taking a feat instead? Leave them, and type the feat into Features &amp; traits after.
          </p>
          <div className="cb-chips">
            {ABILITIES.map((a) => (
              <span key={a} className="cb-step-n">
                <span>{ABILITY_SHORT[a]}</span>
                <button type="button" className="btn small" aria-label={`Take a point off ${ABILITY_NAME[a]}`} disabled={!d.asi[a]} onClick={() => set({ asi: { ...d.asi, [a]: (d.asi[a] ?? 0) - 1 || undefined } })}>
                  &minus;
                </button>
                <b>{d.asi[a] ?? 0}</b>
                <button type="button" className="btn small" aria-label={`Add a point to ${ABILITY_NAME[a]}`} disabled={asiUsed >= asiMax || total(a) >= SCORE_CAP} onClick={() => set({ asi: { ...d.asi, [a]: (d.asi[a] ?? 0) + 1 } })}>
                  +
                </button>
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}

function SkillPicker({ label, from, chosen, max, taken, onChange }: { label: string; from: readonly string[]; chosen: SkillId[]; max: number; taken: Set<string>; onChange: (s: SkillId[]) => void }) {
  return (
    <div className="cb-block">
      <h3 className="cs-h">
        {label} ({chosen.length} of {max})
      </h3>
      <div className="cb-chips">
        {from.map((id) => {
          const on = chosen.includes(id as SkillId);
          const off = !on && (taken.has(id) || chosen.length >= max);
          return (
            <button key={id} type="button" className={`cb-pick${on ? " on" : ""}`} aria-pressed={on} disabled={off && !(max === 1 && !taken.has(id))} onClick={() => onChange(on ? chosen.filter((x) => x !== id) : max === 1 ? [id as SkillId] : [...chosen, id as SkillId])}>
              {skillName(id)}
              {taken.has(id) && !on ? " ✓" : ""}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SkillsStep({ d, set, level }: StepProps & { level: number }) {
  const cd = BUILD_CLASS_DATA[d.cls!];
  const bg = BUILD_BACKGROUND_DATA[d.background!];
  const sp = SPECIES_BUILD[d.species!];
  const all = SKILLS.map((s) => s.id);
  const from = cd.skills.from === "any" ? all : cd.skills.from;
  const anyN = (sp.human ? 1 : 0) + (featsOf(d).includes("Skilled") ? 3 : 0);
  const ex = expertiseBy(d.cls, level);
  const prof = [...new Set([...bg.skills, ...d.skills, ...d.keen, ...d.anySkills])] as SkillId[];
  const taken = (except: SkillId[]) => new Set(prof.filter((s) => !except.includes(s)));
  return (
    <>
      <h2>Skills</h2>
      <p className="note">
        From {d.background}: {join(bg.skills.map(skillName))}. Pick the rest.
      </p>
      <SkillPicker label={`From ${d.cls}`} from={from} chosen={d.skills} max={cd.skills.n} taken={taken(d.skills)} onChange={(s) => set({ skills: s, expertise: d.expertise.filter((x) => [...bg.skills, ...s, ...d.keen, ...d.anySkills].includes(x)) })} />
      {sp.pickSkillFrom ? <SkillPicker label="Keen Senses" from={sp.pickSkillFrom} chosen={d.keen} max={1} taken={taken(d.keen)} onChange={(s) => set({ keen: s })} /> : null}
      {anyN ? <SkillPicker label={sp.human && anyN > 1 ? "Skillful and Skilled" : sp.human ? "Skillful" : "Skilled"} from={all} chosen={d.anySkills} max={anyN} taken={taken(d.anySkills)} onChange={(s) => set({ anySkills: s })} /> : null}
      {ex ? <SkillPicker label="Expertise (double proficiency)" from={prof} chosen={d.expertise} max={ex} taken={new Set()} onChange={(s) => set({ expertise: s })} /> : null}
    </>
  );
}

const itemText = (items: [string, number][], gp: number) => [...items.map(([n, q]) => (q > 1 ? `${n} ×${q}` : n)), ...(gp ? [`${gp} GP`] : [])].join(", ");

function KitStep({ d, set }: StepProps) {
  const cd = BUILD_CLASS_DATA[d.cls!];
  const bg = BUILD_BACKGROUND_DATA[d.background!];
  return (
    <>
      <h2>Starting kit</h2>
      <p className="note">Gear goes into your inventory, with armor worn and weapons ready. The gold goes to the DM as a request: once they OK it, it lands in your purse.</p>
      <h3 className="cs-h">From {d.cls}</h3>
      <div className="cb-list" role="radiogroup" aria-label="Class kit">
        {cd.kits.map((k, i) => (
          <button key={i} type="button" role="radio" aria-checked={d.kit === i} className={`cb-row cb-row-btn${d.kit === i ? " on" : ""}`} onClick={() => set({ kit: i })}>
            <b>{k.items.length ? `Kit ${String.fromCharCode(65 + i)}` : "Gold instead"}</b>
            <span>{itemText(k.items, k.gp)}</span>
          </button>
        ))}
      </div>
      <h3 className="cs-h">From {d.background}</h3>
      <div className="cb-list" role="radiogroup" aria-label="Background kit">
        <button type="button" role="radio" aria-checked={d.bgKit} className={`cb-row cb-row-btn${d.bgKit ? " on" : ""}`} onClick={() => set({ bgKit: true })}>
          <b>Kit</b>
          <span>{itemText(bg.kit, bg.gp)}</span>
        </button>
        <button type="button" role="radio" aria-checked={!d.bgKit} className={`cb-row cb-row-btn${!d.bgKit ? " on" : ""}`} onClick={() => set({ bgKit: false })}>
          <b>Gold instead</b>
          <span>50 GP</span>
        </button>
      </div>
      {kitChoicesFor(d.cls, d.kit, d.background, d.bgKit).map((name) => {
        const c = KIT_CHOICES[name];
        const now = kitPick(name, d.kitPicks);
        return (
          <label key={name} className="cs-field">
            <span>Pick your {c.label.toLowerCase()}</span>
            <select className="fld" value={now} onChange={(e) => set({ kitPicks: { ...d.kitPicks, [name]: e.target.value } })}>
              {c.options.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </label>
        );
      })}
    </>
  );
}

function SpellList({ label, list, chosen, max, onChange }: { label: string; list: SrdSpell[]; chosen: string[]; max: number; onChange: (s: string[]) => void }) {
  const [open, setOpen] = useState<string | null>(null);
  const mine = chosen.filter((i) => list.some((s) => s.i === i)).length;
  return (
    <div className="cb-block">
      <h3 className="cs-h">
        {label} ({mine} of {max})
      </h3>
      <ul className="cb-spells">
        {list.map((s) => {
          const on = chosen.includes(s.i);
          return (
            <li key={s.i} className={on ? "on" : undefined}>
              <label className="check">
                <input type="checkbox" checked={on} disabled={!on && mine >= max} onChange={() => onChange(on ? chosen.filter((x) => x !== s.i) : [...chosen, s.i])} />
                <span>
                  {s.n}
                  <small>
                    {" "}
                    {s.l ? `${SPELL_LEVEL_NAME[s.l]} · ` : ""}
                    {s.s}
                    {s.conc ? " · concentration" : ""}
                  </small>
                </span>
              </label>
              <button type="button" className="cb-more-btn" aria-expanded={open === s.i} onClick={() => setOpen(open === s.i ? null : s.i)}>
                {open === s.i ? "Less" : "What it does"}
              </button>
              {open === s.i ? <div className="cs-prose cs-spell-text">{s.x}</div> : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function SpellsStep({ d, set, level, srd, counts, hasMi }: StepProps & { level: number; srd: SrdSpell[] | null; counts: { cantrips: number; prepared: number; maxLevel: number }; hasMi: boolean }) {
  if (!srd) return <p className="note">Loading the spells&hellip;</p>;
  const cls = d.cls!;
  const of = (c: string, lo: number, hi: number) => srd.filter((s) => s.c.includes(c) && s.l >= lo && s.l <= hi);
  const lin = lineageSpellsBy(d.lineage, level);
  const miList = initiateList(d.background, d.miList);
  const mine = (s: SrdSpell) => !d.classSpells.includes(s.i) && !lin.includes(s.i);
  const isLevelled = (i: string) => !!srd.find((s) => s.i === i)?.l;
  return (
    <>
      <h2>Spells</h2>
      <p className="note">Pick now or change them later from your sheet. Tap &ldquo;What it does&rdquo; to read one.</p>
      {lin.length ? (
        <p className="note">
          From {d.lineage}: {join(lin.map((i) => srd.find((s) => s.i === i)?.n ?? i))}. They&rsquo;re added for you.
        </p>
      ) : null}
      {counts.cantrips ? <SpellList label={`${cls} cantrips`} list={of(cls, 0, 0).filter((s) => !lin.includes(s.i))} chosen={d.classSpells} max={counts.cantrips} onChange={(x) => set({ classSpells: x })} /> : null}
      {counts.prepared ? (
        <SpellList label={`${cls} spells to prepare (up to ${SPELL_LEVEL_NAME[counts.maxLevel]})`} list={of(cls, 1, counts.maxLevel).filter((s) => !lin.includes(s.i))} chosen={d.classSpells} max={counts.prepared} onChange={(x) => set({ classSpells: x })} />
      ) : null}
      {hasMi ? (
        <>
          {d.species === "Human" && d.background !== "Acolyte" && d.background !== "Sage" ? (
            <div className="pl-seg" role="group" aria-label="Magic Initiate list">
              {["Cleric", "Druid", "Wizard"].map((l) => (
                <button key={l} type="button" className={d.miList === l ? "on" : undefined} aria-pressed={d.miList === l} onClick={() => set({ miList: l, miSpells: [] })}>
                  {l}
                </button>
              ))}
            </div>
          ) : null}
          <SpellList label={`Magic Initiate: ${miList} cantrips`} list={of(miList, 0, 0).filter(mine)} chosen={d.miSpells.filter((i) => !isLevelled(i))} max={2} onChange={(x) => set({ miSpells: [...x, ...d.miSpells.filter(isLevelled)] })} />
          <SpellList label={`Magic Initiate: one ${miList} 1st-level spell`} list={of(miList, 1, 1).filter(mine)} chosen={d.miSpells.filter(isLevelled)} max={1} onChange={(x) => set({ miSpells: [...d.miSpells.filter((i) => !isLevelled(i)), ...x] })} />
        </>
      ) : null}
    </>
  );
}

function ReviewStep({ d, set, level, pv, replacing, edit, goStep }: StepProps & { level: number; pv: ReturnType<typeof preview>; replacing: boolean; edit?: () => void; goStep: (s: Step) => void }) {
  if (typeof pv === "string") return <p className="cs-err">{pv}</p>;
  const { sheet, maxHp, gp } = pv;
  const n = sheetNumbers(sheet, level);
  const cd = BUILD_CLASS_DATA[d.cls!];
  const langs = LANGUAGES.filter((l) => l !== "Common");
  return (
    <>
      <h2>
        {sheet.species} {sheet.cls}
        {sheet.subclass ? ` (${sheet.subclass})` : ""}
      </h2>
      <p className="note">
        Level {level} · {sheet.background}
        {replacing ? " · replaces your sheet" : ""}
      </p>
      <div className="cb-nums">
        <div>
          <b>{maxHp}</b>
          <span>HP</span>
        </div>
        <div>
          <b>{n.ac}</b>
          <span>AC</span>
        </div>
        <div>
          <b>{signed(n.init)}</b>
          <span>Init</span>
        </div>
        <div>
          <b>{n.speed}</b>
          <span>Speed</span>
        </div>
        <div>
          <b>{signed(n.prof)}</b>
          <span>Prof</span>
        </div>
      </div>
      <div className="cb-scores cb-scores-sum">
        {ABILITIES.map((a) => (
          <div key={a} className="cb-score">
            <span className="cb-ab">{ABILITY_SHORT[a]}</span>
            <span className="cb-total">
              {sheet.scores[a]} <small>({signed(mod(sheet.scores[a]))})</small>
            </span>
          </div>
        ))}
      </div>
      <ul className="cb-sum">
        <li>
          <b>Saves:</b> {sheet.saves.map((a) => ABILITY_NAME[a]).join(", ")}
        </li>
        <li>
          <b>Skills:</b> {join(Object.entries(sheet.skills).map(([k, v]) => `${skillName(k)}${v === 2 ? " (expertise)" : ""}`))}
        </li>
        {sheet.items?.length ? (
          <li>
            <b>Kit:</b> {sheet.items.map((x) => (x.qty > 1 ? `${x.name} ×${x.qty}` : x.name)).join(", ")}
            {gp ? `, and ${gp} GP that the DM OKs into your purse` : ""}
          </li>
        ) : null}
        {sheet.spells?.length ? (
          <li>
            <b>Spells:</b> {sheet.spells.map((x) => x.name).join(", ")}
          </li>
        ) : null}
        {cd && (spellCounts(d.cls!, level).prepared > (sheet.spells ?? []).filter((x) => x.level > 0 && classSpell(x)).length || spellCounts(d.cls!, level).cantrips > (sheet.spells ?? []).filter((x) => x.level === 0 && classSpell(x)).length) ? (
          <li className="note">
            At level {level} you can know {spellCounts(d.cls!, level).cantrips} cantrips and prepare {spellCounts(d.cls!, level).prepared} spells. Add the rest from Spells on your sheet.
          </li>
        ) : null}
        {sheet.features?.length ? (
          <li>
            <b>Uses to track:</b> {sheet.features.map((x) => x.name).join(", ")}
          </li>
        ) : null}
      </ul>
      {level >= cd.subAt ? (
        <label className="cs-field">
          <span>Subclass (the free rules have {cd.sub}; type another if your DM allows it)</span>
          <input className="fld" maxLength={40} value={d.subclass} placeholder={cd.sub} onChange={(e) => set({ subclass: e.target.value })} />
        </label>
      ) : null}
      <div className="cb-block">
        <h3 className="cs-h">Languages: Common and two more ({d.langs.length} of 2)</h3>
        <div className="cb-chips">
          {langs.map((l) => {
            const on = d.langs.includes(l);
            return (
              <button key={l} type="button" className={`cb-pick${on ? " on" : ""}`} aria-pressed={on} disabled={!on && d.langs.length >= 2} onClick={() => set({ langs: on ? d.langs.filter((x) => x !== l) : [...d.langs, l] })}>
                {l}
              </button>
            );
          })}
        </div>
      </div>
      {edit ? (
        <button
          type="button"
          className="btn"
          onClick={() => {
            edit();
            goStep("class");
          }}
        >
          Change something
        </button>
      ) : null}
    </>
  );
}

// ---------------------------------------------------------------------------
// Level up

/** "You're level 5": take the level's hit points, Ability Score Improvement, subclass, Expertise and lineage spells. */
export function LevelUpCard({ sheet, level, send }: { sheet: CharacterSheet; level: number | undefined; send: (c: object) => Promise<string | null> }) {
  const nx = nextLevel(sheet, level);
  const text = useBuilderText(!!nx);
  const srd = useSrdSpells(!!nx?.lineageSpells.length);
  const [hp, setHp] = useState<"avg" | "roll">("avg");
  const [asi, setAsi] = useState<Partial<Record<Ability, 1 | 2>>>({});
  const [feat, setFeat] = useState(false);
  const [sub, setSub] = useState("");
  const [exp, setExp] = useState<SkillId[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  if (!nx || !sheet.cls) return null;
  const cls = sheet.cls;
  const ct = text?.classes[cls];
  const fresh = ct ? ct.f.filter(([l]) => l === nx.to) : [];
  // The free rules' subclass features, only for that subclass (or the one they'll take now, if they leave the name blank).
  const subFresh = ct && ((nx.subclass && isSrdSubclass(cls, sub)) || (!nx.subclass && sheet.subclass && nx.to > BUILD_CLASS_DATA[cls].subAt && isSrdSubclass(cls, sheet.subclass))) ? ct.s.filter(([l]) => l === nx.to) : [];
  const before = spellCounts(cls, nx.to - 1);
  const after = spellCounts(cls, nx.to);
  const asiUsed = Object.values(asi).reduce((n, v) => n + (v ?? 0), 0);
  const prof = (Object.entries(sheet.skills) as [SkillId, number][]).filter(([, v]) => v === 1).map(([k]) => k);
  const ok = (!nx.asi || feat || asiUsed === 2) && exp.length === nx.expertise;
  const take = async () => {
    setBusy(true);
    const names = [...fresh.map(([, n]) => n), ...subFresh.map(([, n]) => n)];
    const addSpells = srd ? lineageSpellsAt(sheet.build?.lineage, nx.to).flatMap((i) => {
      const o = srd.find((s) => s.i === i);
      if (!o) return [];
      const sp = spellFromSrd(o);
      sp.note = `${sheet.build?.lineage}. Always prepared. Once per long rest without a slot.`;
      return [sp];
    }) : [];
    const e = await send({
      type: "me.levelUp",
      hp,
      ...(nx.asi && !feat && asiUsed ? { asi } : {}),
      ...(nx.subclass ? { subclass: sub.trim() } : {}),
      ...(exp.length ? { expertise: exp } : {}),
      ...(addSpells.length ? { addSpells } : {}),
      ...(names.length || (nx.asi && feat) ? { note: `Level ${nx.to}: ${[...names, ...(nx.asi && feat ? ["a feat instead of an Ability Score Improvement (add it here)"] : [])].join(", ")}` } : {}),
      tv: hp === "roll",
    });
    setBusy(false);
    setErr(e);
    if (!e) {
      setAsi({});
      setFeat(false);
      setSub("");
      setExp([]);
    }
  };
  return (
    <section className="box cb cb-level" aria-label={`Level up to ${nx.to}`}>
      <h2>Level up to {nx.to}</h2>
      {(level ?? 1) > nx.to ? <p className="note">The DM has you at level {level}. Take one level at a time.</p> : null}
      {fresh.length || subFresh.length ? (
        <ul className="cb-rules">
          {[...fresh, ...subFresh].map(([l, n, t]) => (
            <Rules key={`${l}${n}`} name={n} text={t} />
          ))}
        </ul>
      ) : null}
      <div className="cb-block">
        <h3 className="cs-h">Hit points</h3>
        <div className="pl-seg" role="group" aria-label="Hit points">
          <button type="button" className={hp === "avg" ? "on" : undefined} aria-pressed={hp === "avg"} onClick={() => setHp("avg")}>
            Take {nx.avg}
          </button>
          <button type="button" className={hp === "roll" ? "on" : undefined} aria-pressed={hp === "roll"} onClick={() => setHp("roll")}>
            Roll a d{nx.die} on the TV
          </button>
        </div>
        <p className="note">
          {hp === "avg" ? `The average for a d${nx.die}, plus Constitution.` : `d${nx.die} plus your Constitution (${signed(mod(sheet.scores.con))}), at least 1.`}
        </p>
      </div>
      {nx.asi ? (
        <div className="cb-block">
          <h3 className="cs-h">Ability Score Improvement</h3>
          <p className="note">+2 to one score or +1 to two, up to {SCORE_CAP}. Or take a feat instead.</p>
          <div className="cb-chips">
            {ABILITIES.map((a) => {
              const v = asi[a] ?? 0;
              return (
                <button
                  key={a}
                  type="button"
                  className={`cb-pick${v ? " on" : ""}`}
                  disabled={feat || (!v && asiUsed >= 2) || sheet.scores[a] + 1 > SCORE_CAP}
                  onClick={() => {
                    const nextV = v === 0 ? (asiUsed === 0 && sheet.scores[a] + 2 <= SCORE_CAP ? 2 : 1) : v === 2 ? 1 : 0;
                    const n2 = { ...asi };
                    if (nextV) n2[a] = nextV as 1 | 2;
                    else delete n2[a];
                    setAsi(n2);
                  }}
                >
                  {ABILITY_SHORT[a]} {sheet.scores[a]}
                  {v ? ` +${v}` : ""}
                </button>
              );
            })}
          </div>
          <label className="check">
            <input type="checkbox" checked={feat} onChange={(e) => setFeat(e.target.checked)} /> I&rsquo;m taking a feat instead (type it in Features &amp; traits after)
          </label>
        </div>
      ) : null}
      {nx.subclass ? (
        <label className="cs-field">
          <span>Subclass (the free rules have {nx.subclass}; type another if your DM allows it)</span>
          <input className="fld" maxLength={40} value={sub} placeholder={nx.subclass} onChange={(e) => setSub(e.target.value)} />
        </label>
      ) : null}
      {nx.expertise ? <SkillPicker label="Expertise" from={prof} chosen={exp} max={nx.expertise} taken={new Set()} onChange={setExp} /> : null}
      {after.cantrips > before.cantrips || after.prepared > before.prepared ? (
        <p className="note">
          {after.cantrips > before.cantrips ? `You learn ${after.cantrips - before.cantrips} more cantrip${after.cantrips - before.cantrips === 1 ? "" : "s"}. ` : ""}
          {after.prepared > before.prepared ? `You can prepare ${after.prepared} spells now (${after.prepared - before.prepared} more)` : ""}
          {after.maxLevel > before.maxLevel ? `, up to ${SPELL_LEVEL_NAME[after.maxLevel]}` : ""}. Add them in Spells after.
        </p>
      ) : null}
      {nx.lineageSpells.length && srd ? <p className="note">From {sheet.build?.lineage}: {join(nx.lineageSpells.map((i) => srd.find((s) => s.i === i)?.n ?? i))}, added for you.</p> : null}
      {err ? (
        <p className="cs-err" role="alert">
          {err}
        </p>
      ) : null}
      <button type="button" className="btn primary big" disabled={!ok || busy} onClick={() => void take()}>
        {busy ? "Levelling up…" : `Take level ${nx.to}`}
      </button>
    </section>
  );
}

