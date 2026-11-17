"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  ABILITIES,
  ABILITY_NAME,
  ABILITY_SHORT,
  BACKGROUNDS,
  CLASSES,
  CONDITIONS,
  EXHAUSTION_MAX,
  EXTRA_MAX,
  HIT_DICE,
  mod,
  NAME_FIELD_MAX,
  PROFS_MAX,
  saveBonus,
  SCORE_MAX,
  SCORE_MIN,
  SHEET_NOTES_MAX,
  sheetNumbers,
  signed,
  skillBonus,
  SKILLS,
  SPECIES,
  TRAITS_MAX,
  type Ability,
  type CharacterSheet,
  type ConditionId,
  type ExtraKey,
  type SheetPatch,
  type SkillId,
  type SheetRoll,
} from "@/shared/sheet";
import type { SheetAct } from "@/shared/sheetMagic";
import { gearAc } from "@/shared/sheetGear";
import { AttackEditor, AttackList } from "./SheetAttacks";
import { FeaturesBlock } from "./SheetFeatures";
import { InventoryBlock } from "./SheetInventory";
import { SpellsBlock } from "./SheetSpells";
import "./sheet.css";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** One line: "Level 3 Rogue (Thief) · Halfling · Criminal". */
export function sheetLine(sheet: CharacterSheet, level: number | undefined): string {
  const cls = sheet.cls ? `${sheet.cls}${sheet.subclass ? ` (${sheet.subclass})` : ""}` : "";
  return [[level ? `Level ${level}` : "", cls].filter(Boolean).join(" "), sheet.species, sheet.background].filter(Boolean).join(" · ");
}

/**
 * The character sheet, for a player's phone and the DM's drawer. Reading is
 * the default; Edit opens the fields. onPatch sends a change and returns an
 * error, or null ("" fails without showing one here, when the caller already did). lockedOut: the DM locked class, scores and proficiencies.
 */
export function CharacterSheetView({
  sheet,
  level,
  inspired,
  hp,
  onPatch,
  lockedOut,
  canLock,
  onLock,
  editLabel = "Edit sheet",
  onRoll,
  rollBar,
  onAct,
  onHitDie,
  giveTo,
  onGive,
}: {
  sheet: CharacterSheet;
  level: number | undefined;
  inspired?: boolean;
  /** The HP block: the phone's own controls, or the DM's read-only line. */
  hp?: ReactNode;
  onPatch: (p: SheetPatch) => Promise<string | null>;
  lockedOut: boolean;
  /** The DM: lock or unlock this sheet. */
  canLock?: boolean;
  onLock?: (on: boolean) => void;
  editLabel?: string;
  /** Tap a check, save, skill, initiative or attack to roll it (the player's phone). */
  onRoll?: (r: SheetRoll) => void;
  /** Advantage and where the roll goes, shown above the rollable parts. */
  rollBar?: ReactNode;
  /** Use a slot or a feature, cast a spell, end concentration. Returns an error or null. */
  onAct: (a: SheetAct) => Promise<string | null>;
  /** The player's phone: spend a hit die (roll it and heal). */
  onHitDie?: () => Promise<string | null>;
  /** The phone: hand an item to one of these players. */
  giveTo?: { id: string; name: string }[];
  onGive?: (itemId: string, toPlayerId: string, qty: number) => Promise<string | null>;
}) {
  const [editing, setEditing] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const n = sheetNumbers(sheet, level);
  const send = async (p: SheetPatch) => {
    const e = await onPatch(p);
    setErr(e || null);
    return e === null;
  };
  const act = async (a: SheetAct) => {
    const e = await onAct(a);
    setErr(e || null);
    return e === null;
  };
  const give = onGive
    ? async (itemId: string, to: string, qty: number) => {
        const e = await onGive(itemId, to, qty);
        setErr(e || null);
        return e === null;
      }
    : undefined;
  const hitDie = onHitDie
    ? async () => {
        const e = await onHitDie();
        setErr(e || null);
      }
    : undefined;
  const line = sheetLine(sheet, level);
  const fixed = editing && lockedOut;
  const roll = !editing && onRoll ? onRoll : undefined;

  return (
    <div className={`cs${editing ? " editing" : ""}`}>
      <div className="cs-head">
        <div className="cs-head-line">{line || (editing ? "" : "Tap Edit sheet to fill in your class and scores.")}</div>
        <div className="cs-head-acts">
          {canLock ? (
            <button
              type="button"
              className={`btn small${sheet.locked ? " on" : ""}`}
              aria-pressed={!!sheet.locked}
              onClick={() => onLock?.(!sheet.locked)}
              title="Locks class, scores and proficiencies on their phone. HP, conditions and notes stay open."
            >
              {sheet.locked ? "Locked" : "Lock"}
            </button>
          ) : null}
          <button type="button" className={`btn small${editing ? " primary" : ""}`} onClick={() => setEditing((e) => !e)} aria-pressed={editing}>
            {editing ? "Done" : editLabel}
          </button>
        </div>
      </div>
      {err ? (
        <p className="cs-err" role="alert">
          {err}
        </p>
      ) : null}
      {fixed ? <p className="note cs-lock-note">The DM has locked your class, scores and proficiencies. HP, conditions, hit dice and notes are still yours to change.</p> : null}

      {editing ? (
        <div className="cs-ident">
          <TextField label="Class" value={sheet.cls ?? ""} list="cs-classes" disabled={fixed} max={NAME_FIELD_MAX} onCommit={(v) => send({ cls: v })} />
          <TextField label="Subclass" value={sheet.subclass ?? ""} disabled={fixed} max={NAME_FIELD_MAX} onCommit={(v) => send({ subclass: v })} />
          <TextField label="Species" value={sheet.species ?? ""} list="cs-species" disabled={fixed} max={NAME_FIELD_MAX} onCommit={(v) => send({ species: v })} />
          <TextField label="Background" value={sheet.background ?? ""} list="cs-backgrounds" disabled={fixed} max={NAME_FIELD_MAX} onCommit={(v) => send({ background: v })} />
          <datalist id="cs-classes">
            {CLASSES.map((c) => (
              <option key={c.name} value={c.name} />
            ))}
          </datalist>
          <datalist id="cs-species">
            {SPECIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          <datalist id="cs-backgrounds">
            {BACKGROUNDS.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          <p className="note cs-span">Level is set by the DM{level ? ` (now ${level})` : ""}.</p>
        </div>
      ) : null}

      <div className="cs-stats" role="list" aria-label="Combat numbers">
        <Stat label="AC" value={String(n.ac)} sub={n.acWorkedOut ? n.acFrom : undefined} />
        <Stat label="Initiative" value={signed(n.init)} onTap={roll ? () => roll({ kind: "init" }) : undefined} />
        <Stat label="Speed" value={`${n.speed} ft`} />
        <Stat label="Proficiency" value={signed(n.prof)} />
        <Stat label="Passive Perception" short="Passive Perc." value={String(n.passive)} />
      </div>
      {editing ? (
        <div className="cs-ident">
          <NumField label="AC" value={sheet.ac} placeholder={`${gearAc(sheet).ac} (${gearAc(sheet).from})`} min={0} max={50} hint="Blank: worked out from what you wear in your inventory." onCommit={(v) => send({ ac: v })} />
          <NumField label="Speed (ft)" value={sheet.speed} placeholder="30" min={0} max={300} onCommit={(v) => send({ speed: v })} />
          <NumField label="Initiative extra" value={sheet.extra?.init} placeholder="0" min={-EXTRA_MAX} max={EXTRA_MAX} hint="On top of Dex (a feat, an item)." disabled={fixed} onCommit={(v) => send({ extra: { init: v ?? 0 } })} />
          <NumField label="Passive Perception extra" value={sheet.extra?.passive} placeholder="0" min={-EXTRA_MAX} max={EXTRA_MAX} disabled={fixed} onCommit={(v) => send({ extra: { passive: v ?? 0 } })} />
        </div>
      ) : null}

      {hp ? <div className="cs-hp">{hp}</div> : null}

      <div className="cs-row2">
        <HitDice sheet={sheet} n={n} editing={editing} fixed={fixed} send={send} onSpend={editing ? undefined : hitDie} />
        {inspired ? <div className="cs-insp">Heroic Inspiration</div> : null}
      </div>

      <Conditions sheet={sheet} send={send} />

      {roll && rollBar ? rollBar : null}

      {editing ? <AttackEditor sheet={sheet} level={level} send={send} /> : <AttackList sheet={sheet} level={level} onRoll={roll} />}

      <FeaturesBlock sheet={sheet} level={level} editing={editing} send={send} act={act} />

      <SpellsBlock sheet={sheet} level={level} editing={editing} fixed={fixed} send={send} act={act} onRoll={roll} />

      <InventoryBlock sheet={sheet} editing={editing} send={send} act={act} giveTo={giveTo} onGive={give} />

      <h3 className="cs-h">Abilities</h3>
      <div className="cs-abilities">
        {ABILITIES.map((a) =>
          roll ? (
            <button key={a} type="button" className="cs-ab cs-tap" aria-label={`Roll a ${ABILITY_NAME[a]} check, ${signed(mod(sheet.scores[a]))}`} onClick={() => roll({ kind: "check", ability: a })}>
              <span className="cs-ab-k">{ABILITY_SHORT[a]}</span>
              <span className="cs-ab-mod">{signed(mod(sheet.scores[a]))}</span>
              <span className="cs-ab-score">{sheet.scores[a]}</span>
            </button>
          ) : (
            <div key={a} className="cs-ab">
              <div className="cs-ab-k" title={ABILITY_NAME[a]}>
                {ABILITY_SHORT[a]}
              </div>
              <div className="cs-ab-mod">{signed(mod(sheet.scores[a]))}</div>
              {editing ? (
                <NumField label={ABILITY_NAME[a]} hideLabel value={sheet.scores[a]} min={SCORE_MIN} max={SCORE_MAX} required disabled={fixed} onCommit={(v) => (v === undefined ? Promise.resolve(false) : send({ scores: { [a]: v } }))} />
              ) : (
                <div className="cs-ab-score">{sheet.scores[a]}</div>
              )}
            </div>
          ),
        )}
      </div>

      <h3 className="cs-h">Saving throws</h3>
      <ul className="cs-list cs-saves">
        {ABILITIES.map((a) => {
          const on = sheet.saves.includes(a);
          if (roll)
            return (
              <li key={a}>
                <button type="button" className="cs-row-tap" aria-label={`Roll a ${ABILITY_NAME[a]} save, ${signed(saveBonus(sheet, a, level))}`} onClick={() => roll({ kind: "save", ability: a })}>
                  <span className={`cs-dot${on ? " on" : ""}`} />
                  <span className="cs-name">{ABILITY_NAME[a]}</span>
                  <span className="cs-bonus">{signed(saveBonus(sheet, a, level))}</span>
                </button>
              </li>
            );
          return (
            <li key={a}>
              {editing ? (
                <button
                  type="button"
                  className={`cs-dot${on ? " on" : ""}`}
                  aria-pressed={on}
                  aria-label={`${ABILITY_NAME[a]} save: ${on ? "proficient" : "not proficient"}`}
                  disabled={fixed}
                  onClick={() =>
                    send({
                      saves: on ? sheet.saves.filter((x) => x !== a) : [...sheet.saves, a],
                    })
                  }
                />
              ) : (
                <span className={`cs-dot${on ? " on" : ""}`} aria-label={on ? "proficient" : undefined} />
              )}
              <span className="cs-name">{ABILITY_NAME[a]}</span>
              {editing ? <ExtraField k={`save.${a}`} sheet={sheet} fixed={fixed} send={send} /> : null}
              <span className="cs-bonus">{signed(saveBonus(sheet, a, level))}</span>
            </li>
          );
        })}
      </ul>

      <h3 className="cs-h">Skills</h3>
      {editing ? <p className="note">Tap the dot: proficient, then expertise, then neither.</p> : null}
      <ul className="cs-list cs-skills">
        {SKILLS.map((s) => {
          const r = sheet.skills[s.id as SkillId] ?? 0;
          const label = r === 2 ? "expertise" : r === 1 ? "proficient" : "not proficient";
          if (roll)
            return (
              <li key={s.id}>
                <button type="button" className="cs-row-tap" aria-label={`Roll ${s.name}, ${signed(skillBonus(sheet, s.id as SkillId, level))}`} onClick={() => roll({ kind: "skill", skill: s.id as SkillId })}>
                  <span className={`cs-dot${r ? " on" : ""}${r === 2 ? " ex" : ""}`} />
                  <span className="cs-name">
                    {s.name} <span className="cs-ab-tag">{ABILITY_SHORT[s.ability as Ability]}</span>
                  </span>
                  <span className="cs-bonus">{signed(skillBonus(sheet, s.id as SkillId, level))}</span>
                </button>
              </li>
            );
          return (
            <li key={s.id}>
              {editing ? (
                <button type="button" className={`cs-dot${r ? " on" : ""}${r === 2 ? " ex" : ""}`} aria-label={`${s.name}: ${label}`} disabled={fixed} onClick={() => send({ skills: { [s.id]: ((r + 1) % 3) as 0 | 1 | 2 } })} />
              ) : (
                <span className={`cs-dot${r ? " on" : ""}${r === 2 ? " ex" : ""}`} aria-label={r ? label : undefined} />
              )}
              <span className="cs-name">
                {s.name} <span className="cs-ab-tag">{ABILITY_SHORT[s.ability as Ability]}</span>
              </span>
              {editing ? <ExtraField k={`skill.${s.id}` as ExtraKey} sheet={sheet} fixed={fixed} send={send} /> : null}
              <span className="cs-bonus">{signed(skillBonus(sheet, s.id as SkillId, level))}</span>
            </li>
          );
        })}
      </ul>

      <TextBlock title="Features and traits" value={sheet.traits} editing={editing} max={TRAITS_MAX} placeholder="Second Wind: once per short rest, regain 1d10 + level HP…" onCommit={(v) => send({ traits: v })} />
      <TextBlock title="Proficiencies and languages" value={sheet.profs} editing={editing} max={PROFS_MAX} placeholder="Light armor, simple weapons, thieves' tools. Common, Halfling." onCommit={(v) => send({ profs: v })} />
      <TextBlock title="Notes" value={sheet.notes} editing={editing} max={SHEET_NOTES_MAX} placeholder="Backstory, allies, what you owe and to whom." onCommit={(v) => send({ notes: v })} />
      <p className="note cs-credit">Class, species, background, spell and class feature names and text come from the free D&amp;D System Reference Document 5.2 by Wizards of the Coast (CC-BY-4.0). Anything else, type in yourself.</p>
    </div>
  );
}

function Stat({ label, short, value, sub, onTap }: { label: string; short?: string; value: string; sub?: string; onTap?: () => void }) {
  if (onTap)
    return (
      <button type="button" className="cs-stat cs-tap" role="listitem" aria-label={`Roll ${label.toLowerCase()}, ${value}`} onClick={onTap}>
        <div className="cs-stat-v">{value}</div>
        <div className="cs-stat-k" aria-hidden="true">
          {short ?? label}
        </div>
      </button>
    );
  return (
    <div className="cs-stat" role="listitem" aria-label={`${label} ${value}${sub ? `, ${sub}` : ""}`}>
      <div className="cs-stat-v">{value}</div>
      <div className="cs-stat-k" aria-hidden="true">
        {short ?? label}
      </div>
      {sub ? (
        <div className="cs-stat-sub" aria-hidden="true">
          {sub}
        </div>
      ) : null}
    </div>
  );
}

function HitDice({ sheet, n, editing, fixed, send, onSpend }: { sheet: CharacterSheet; n: ReturnType<typeof sheetNumbers>; editing: boolean; fixed: boolean; send: (p: SheetPatch) => Promise<boolean>; onSpend?: () => Promise<void> }) {
  const spent = Math.min(n.hitDice, sheet.hitDiceSpent ?? 0);
  return (
    <div className="cs-hd">
      <div className="cs-hd-k">
        Hit dice{n.hitDie ? ` (d${n.hitDie})` : ""}{" "}
        <span className="cs-hd-left">
          {n.hitDiceLeft} of {n.hitDice} left
        </span>
      </div>
      <div className="cs-hd-pips" role="group" aria-label="Hit dice: tap to spend or get one back">
        {Array.from({ length: n.hitDice }, (_, i) => {
          const used = i >= n.hitDice - spent;
          return <button key={i} type="button" className={`cs-pip${used ? " used" : ""}`} aria-label={used ? "Spent hit die: tap to get it back" : "Hit die: tap to mark it spent"} onClick={() => send({ hitDiceSpent: used ? spent - 1 : spent + 1 })} />;
        })}
      </div>
      {onSpend && n.hitDie && n.hitDiceLeft > 0 ? (
        <button type="button" className="btn small cs-hd-spend" onClick={() => void onSpend()} title="Short rest: roll a hit die plus Constitution and heal that much">
          Spend one to heal (d{n.hitDie} {signed(mod(sheet.scores.con))})
        </button>
      ) : null}
      {editing ? (
        <label className="cs-field cs-inline">
          <span>Hit die</span>
          <select
            className="fld"
            value={sheet.hitDie ?? ""}
            disabled={fixed}
            onChange={(e) =>
              void send({
                hitDie: e.target.value ? (Number(e.target.value) as 6 | 8 | 10 | 12) : null,
              })
            }
          >
            <option value="">{n.hitDie && !sheet.hitDie ? `From class (d${n.hitDie})` : "From class"}</option>
            {HIT_DICE.map((d) => (
              <option key={d} value={d}>
                d{d}
              </option>
            ))}
          </select>
        </label>
      ) : null}
    </div>
  );
}

function Conditions({ sheet, send }: { sheet: CharacterSheet; send: (p: SheetPatch) => Promise<boolean> }) {
  const [open, setOpen] = useState(false);
  const on = sheet.conditions ?? [];
  const ex = sheet.exhaustion ?? 0;
  const toggle = (c: ConditionId) =>
    send({
      conditions: on.includes(c) ? on.filter((x) => x !== c) : [...on, c],
    });
  return (
    <div className="cs-conds">
      <div className="cs-conds-row">
        {on.map((c) => (
          <button key={c} type="button" className="cs-chip on" onClick={() => toggle(c)} aria-label={`${cap(c)}: tap to remove`}>
            {cap(c)} <span aria-hidden="true">×</span>
          </button>
        ))}
        {ex ? <span className="cs-chip on">Exhaustion {ex}</span> : null}
        <button type="button" className="cs-chip add" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          {open ? "Close" : on.length || ex ? "Conditions" : "+ Condition"}
        </button>
      </div>
      {open ? (
        <div className="cs-conds-pick">
          {CONDITIONS.map((c) => (
            <button key={c} type="button" className={`cs-chip${on.includes(c) ? " on" : ""}`} aria-pressed={on.includes(c)} onClick={() => toggle(c)}>
              {cap(c)}
            </button>
          ))}
          <div className="cs-ex">
            <span>Exhaustion</span>
            <button type="button" className="btn small" aria-label="One less level of exhaustion" disabled={ex <= 0} onClick={() => send({ exhaustion: ex - 1 })}>
              &minus;
            </button>
            <b aria-live="polite">{ex}</b>
            <button type="button" className="btn small" aria-label="One more level of exhaustion" disabled={ex >= EXHAUSTION_MAX} onClick={() => send({ exhaustion: ex + 1 })}>
              +
            </button>
          </div>
          {ex ? (
            <p className="note">
              Each level: &minus;{2 * ex} on d20 rolls and &minus;{5 * ex} ft speed in all (2024 rules). A long rest takes one level off.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function ExtraField({ k, sheet, fixed, send }: { k: ExtraKey; sheet: CharacterSheet; fixed: boolean; send: (p: SheetPatch) => Promise<boolean> }) {
  return <NumField label="Extra" hideLabel className="cs-extra" value={sheet.extra?.[k]} placeholder="+0" min={-EXTRA_MAX} max={EXTRA_MAX} disabled={fixed} onCommit={(v) => send({ extra: { [k]: v ?? 0 } })} />;
}

function TextBlock({ title, value, editing, max, placeholder, onCommit }: { title: string; value?: string; editing: boolean; max: number; placeholder: string; onCommit: (v: string) => Promise<boolean> }) {
  const [v, setV] = useState(value ?? "");
  useEffect(() => setV(value ?? ""), [value]);
  if (!editing && !value) return null;
  return (
    <section className="cs-block">
      <h3 className="cs-h">{title}</h3>
      {editing ? (
        <textarea className="fld cs-text" aria-label={title} rows={4} maxLength={max} value={v} placeholder={placeholder} onChange={(e) => setV(e.target.value)} onBlur={() => v !== (value ?? "") && void onCommit(v)} />
      ) : (
        <div className="cs-prose">{value}</div>
      )}
    </section>
  );
}

function TextField({ label, value, list, disabled, max, onCommit }: { label: string; value: string; list?: string; disabled?: boolean; max: number; onCommit: (v: string) => Promise<boolean> }) {
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  const commit = () => v.trim() !== value && void onCommit(v);
  return (
    <label className="cs-field">
      <span>{label}</span>
      <input className="fld" value={v} list={list} maxLength={max} disabled={disabled} onChange={(e) => setV(e.target.value)} onBlur={commit} onKeyDown={(e) => e.key === "Enter" && (e.currentTarget as HTMLInputElement).blur()} />
    </label>
  );
}

/** A number that saves when you leave it. Blank sends undefined (back to the worked-out value) unless required. */
function NumField({
  label,
  hideLabel,
  value,
  placeholder,
  min,
  max,
  hint,
  disabled,
  required,
  className,
  onCommit,
}: {
  label: string;
  hideLabel?: boolean;
  value: number | undefined;
  placeholder?: string;
  min: number;
  max: number;
  hint?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  onCommit: (v: number | null | undefined) => Promise<boolean>;
}) {
  const shown = value === undefined ? "" : String(value);
  const [v, setV] = useState(shown);
  useEffect(() => setV(shown), [shown]);
  const commit = async () => {
    const t = v.trim().replace("−", "-");
    if (t === shown) return;
    if (!t) {
      if (required) return setV(shown);
      if (!(await onCommit(null))) setV(shown);
      return;
    }
    const n = Math.round(Number(t));
    if (!Number.isFinite(n) || n < min || n > max) return setV(shown);
    if (!(await onCommit(n))) setV(shown);
  };
  return (
    <label className={`cs-field${className ? ` ${className}` : ""}`}>
      <span className={hideLabel ? "sr-only" : undefined}>{label}</span>
      <input
        className="fld"
        inputMode={min < 0 ? "text" : "numeric"}
        value={v}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => setV(e.target.value.replace(/[^\d\-+−]/g, "").slice(0, 4))}
        onBlur={() => void commit()}
        onKeyDown={(e) => e.key === "Enter" && (e.currentTarget as HTMLInputElement).blur()}
      />
      {hint ? <small className="cs-hint">{hint}</small> : null}
    </label>
  );
}
