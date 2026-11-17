"use client";

import { useEffect, useMemo, useState } from "react";
import { ABILITIES, ABILITY_NAME, ABILITY_SHORT, classOf, EXTRA_MAX, NAME_FIELD_MAX, signed, type CharacterSheet, type SheetPatch, type SheetRoll } from "@/shared/sheet";
import {
  castAbilityOf,
  castingRow,
  pactLeft,
  pactOf,
  slotsLeft,
  slotsMaxOf,
  SPELL_DICE,
  SPELL_LEVEL_NAME,
  SPELL_NOTE_MAX,
  SPELLS_MAX,
  spellAttackBonus,
  spellDiceText,
  spellSaveDc,
  type SheetAct,
  type SheetSpell,
} from "@/shared/sheetMagic";

/** One SRD 5.2 spell, as client/srd/spells.json keeps it (short keys, to keep the file small). */
export interface SrdSpell {
  i: string;
  n: string;
  l: number;
  s: string;
  c: string[];
  t: string;
  r: string;
  k: string;
  d: string;
  x: string;
  h?: string;
  conc?: 1;
  rit?: 1;
  a?: 1;
  sv?: SheetSpell["save"];
  dc?: number;
  ds?: SheetSpell["sides"];
  dm?: 1;
  dt?: string;
}

let srdCache: SrdSpell[] | null = null;
let srdLoading: Promise<SrdSpell[]> | null = null;
/** The SRD spells' full text: about 300 KB, so it loads the first time someone needs it. */
export function useSrdSpells(want = true): SrdSpell[] | null {
  const [list, setList] = useState<SrdSpell[] | null>(srdCache);
  useEffect(() => {
    if (!want || srdCache) return;
    srdLoading ??= import("../srd/spells.json").then((m) => (srdCache = m.default as SrdSpell[]));
    let live = true;
    void srdLoading.then((l) => live && setList(l));
    return () => {
      live = false;
    };
  }, [want]);
  return list;
}

const newId = () => Math.random().toString(36).slice(2, 10);
const ord = (n: number) => (n === 1 ? "1st" : n === 2 ? "2nd" : n === 3 ? "3rd" : `${n}th`);

export function spellFromSrd(o: SrdSpell): SheetSpell {
  const sp: SheetSpell = { id: newId(), name: o.n, level: o.l, srd: o.i };
  if (o.l > 0) sp.prepared = true;
  if (o.conc) sp.conc = true;
  if (o.rit) sp.ritual = true;
  if (o.a) sp.attack = true;
  if (o.sv) sp.save = o.sv;
  if (o.dc && o.ds) {
    sp.count = o.dc;
    sp.sides = o.ds;
    if (o.dm) sp.addMod = true;
    // Eldritch Blast gets more beams instead of bigger dice.
    if (o.l === 0 && o.i !== "eldritch-blast") sp.scale = true;
  }
  if (o.dt) sp.type = o.dt;
  return sp;
}

/** Does this sheet cast spells at all (so the Spells part shows)? */
export function castsSpells(sheet: CharacterSheet, level: number | undefined) {
  return !!(sheet.spells?.length || sheet.slotsMax || castingRow(sheet, level) || sheet.castAbility);
}

/**
 * Spells: casting numbers, slots to tick off, concentration, and the spell list
 * (tap one for its text, to cast it, or to roll it).
 */
export function SpellsBlock({
  sheet,
  level,
  editing,
  fixed,
  send,
  act,
  onRoll,
}: {
  sheet: CharacterSheet;
  level: number | undefined;
  editing: boolean;
  fixed: boolean;
  send: (p: SheetPatch) => Promise<boolean>;
  act: (a: SheetAct) => Promise<boolean>;
  onRoll?: (r: SheetRoll) => void;
}) {
  const [picking, setPicking] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  if (!editing && !castsSpells(sheet, level)) return null;
  const ab = castAbilityOf(sheet);
  const max = slotsMaxOf(sheet, level);
  const left = slotsLeft(sheet, level);
  const pact = pactOf(sheet, level);
  const row = castingRow(sheet, level);
  const list = sheet.spells ?? [];
  const prepared = list.filter((s) => s.level > 0 && s.prepared).length;
  const cantrips = list.filter((s) => s.level === 0).length;
  const hidden = list.filter((s) => s.level > 0 && !s.prepared).length;
  const shown = editing || showAll ? list : list.filter((s) => s.level === 0 || s.prepared);
  const levels = [...new Set(shown.map((s) => s.level))].sort((a, b) => a - b);
  const save = (next: SheetSpell[]) => send({ spells: next });

  return (
    <section className="cs-block cs-spells" aria-label="Spells">
      <h3 className="cs-h">Spells</h3>
      <div className="cs-castline">
        <span className="cs-cast-chip">
          <small>Spell attack</small>
          <b>{signed(spellAttackBonus(sheet, level))}</b>
        </span>
        <span className="cs-cast-chip">
          <small>Save DC</small>
          <b>{spellSaveDc(sheet, level)}</b>
        </span>
        <span className="cs-cast-chip">
          <small>Ability</small>
          <b>{ab ? ABILITY_SHORT[ab] : "?"}</b>
        </span>
      </div>
      {editing ? <CastingEditor sheet={sheet} level={level} fixed={fixed} send={send} /> : null}

      {sheet.conc ? (
        <div className="cs-conc" role="status">
          <span>
            Concentrating on <b>{sheet.conc}</b>
          </span>
          <button type="button" className="btn small" onClick={() => void act({ k: "endConc" })}>
            End
          </button>
        </div>
      ) : null}

      {max.some((m) => m > 0) || pact ? (
        <div className="cs-slots" role="group" aria-label="Spell slots: tap to use one or get it back">
          {max.map((m, i) =>
            m > 0 ? (
              <div className="cs-slot-row" key={i}>
                <span className="cs-slot-k">{ord(i + 1)}</span>
                <div className="cs-hd-pips">
                  {Array.from({ length: m }, (_, j) => {
                    const used = j >= left[i];
                    return (
                      <button
                        key={j}
                        type="button"
                        className={`cs-pip${used ? " used" : ""}`}
                        aria-label={used ? `Used ${ord(i + 1)} level slot: tap to get it back` : `${ord(i + 1)} level slot: tap to use it`}
                        onClick={() => void act({ k: "slot", level: i + 1, delta: used ? -1 : 1 })}
                      />
                    );
                  })}
                </div>
                <span className="cs-slot-left">{left[i]} left</span>
              </div>
            ) : null,
          )}
          {pact ? (
            <div className="cs-slot-row">
              <span className="cs-slot-k">Pact</span>
              <div className="cs-hd-pips">
                {Array.from({ length: pact.count }, (_, j) => {
                  const used = j >= pactLeft(sheet, level);
                  return <button key={j} type="button" className={`cs-pip${used ? " used" : ""}`} aria-label={used ? "Used Pact Magic slot: tap to get it back" : "Pact Magic slot: tap to use it"} onClick={() => void act({ k: "pact", delta: used ? -1 : 1 })} />;
                })}
              </div>
              <span className="cs-slot-left">{ord(pact.level)} level, back on a short rest</span>
            </div>
          ) : null}
        </div>
      ) : null}

      {row && (row[0] || row[1]) ? (
        <p className="note cs-prep-count">
          {row[0] ? `Cantrips ${cantrips} of ${row[0]}` : ""}
          {row[0] && row[1] ? " · " : ""}
          {row[1] ? `Prepared ${prepared} of ${row[1]}` : ""}
        </p>
      ) : null}

      {levels.map((l) => (
        <div key={l} className="cs-spell-group">
          <div className="cs-spell-lv">{SPELL_LEVEL_NAME[l]}</div>
          <ul className="cs-list">
            {shown
              .filter((s) => s.level === l)
              .map((sp) =>
                editing ? (
                  <li key={sp.id} className="cs-spell-edit">
                    <SpellCard sp={sp} onSave={(x) => save(list.map((y) => (y.id === sp.id ? x : y)))} onRemove={() => save(list.filter((y) => y.id !== sp.id))} />
                  </li>
                ) : (
                  <li key={sp.id} className={`cs-spell${open === sp.id ? " open" : ""}${sp.level > 0 && !sp.prepared ? " unprep" : ""}`}>
                    <button type="button" className="cs-row-tap" aria-expanded={open === sp.id} onClick={() => setOpen(open === sp.id ? null : sp.id)}>
                      <span className="cs-name">
                        {sp.name}
                        {sp.conc ? <span className="cs-tag" title="Concentration">C</span> : null}
                        {sp.ritual ? <span className="cs-tag" title="Ritual">R</span> : null}
                      </span>
                      <span className="cs-spell-sum">{spellSummary(sheet, sp, level)}</span>
                    </button>
                    {open === sp.id ? <SpellDetail sheet={sheet} level={level} sp={sp} act={act} onRoll={onRoll} onPrepared={(on) => save(list.map((y) => (y.id === sp.id ? { ...y, prepared: on } : y)))} /> : null}
                  </li>
                ),
              )}
          </ul>
        </div>
      ))}
      {!editing && hidden ? (
        <button type="button" className="btn small cs-add" onClick={() => setShowAll((v) => !v)}>
          {showAll ? "Only prepared spells" : `Show ${hidden} unprepared`}
        </button>
      ) : null}
      {!list.length ? <p className="note">No spells yet. Add them from the SRD list, or type in your own.</p> : null}
      <div className="cs-spell-adds">
        {list.length < SPELLS_MAX ? (
          <button type="button" className="btn small" onClick={() => setPicking(true)}>
            + Add spells
          </button>
        ) : null}
        {editing && list.length < SPELLS_MAX ? (
          <button type="button" className="btn small" onClick={() => void save([...list, { id: newId(), name: "New spell", level: 1, prepared: true }])}>
            + Type in my own
          </button>
        ) : null}
      </div>
      {picking ? <SpellPicker sheet={sheet} onClose={() => setPicking(false)} onAdd={(sp) => save([...(sheet.spells ?? []), sp])} onRemove={(srd) => save(list.filter((y) => y.srd !== srd))} /> : null}
    </section>
  );
}

function spellSummary(sheet: CharacterSheet, sp: SheetSpell, level: number | undefined): string {
  const bits: string[] = [];
  if (sp.attack) bits.push(`${signed(spellAttackBonus(sheet, level))} to hit`);
  if (sp.save) bits.push(`${ABILITY_SHORT[sp.save]} DC ${spellSaveDc(sheet, level)}`);
  const d = spellDiceText(sheet, sp, level);
  if (d) bits.push(d);
  return bits.join(" · ");
}

function SpellDetail({ sheet, level, sp, act, onRoll, onPrepared }: { sheet: CharacterSheet; level: number | undefined; sp: SheetSpell; act: (a: SheetAct) => Promise<boolean>; onRoll?: (r: SheetRoll) => void; onPrepared: (on: boolean) => void }) {
  const srd = useSrdSpells(!!sp.srd);
  const o = sp.srd ? srd?.find((x) => x.i === sp.srd) : undefined;
  const left = slotsLeft(sheet, level);
  const max = slotsMaxOf(sheet, level);
  const pact = pactOf(sheet, level);
  const pl = pactLeft(sheet, level);
  const dice = spellDiceText(sheet, sp, level);
  const slotLevels = sp.level > 0 ? max.map((m, i) => i + 1).filter((l) => l >= sp.level && max[l - 1] > 0) : [];
  return (
    <div className="cs-spell-detail">
      {o ? (
        <p className="cs-spell-meta">
          {o.l ? `${ord(o.l)} level ${o.s.toLowerCase()}` : `${o.s} cantrip`} · {o.t} · {o.r} · {o.k} · {o.d}
        </p>
      ) : sp.srd && !srd ? (
        <p className="note">Loading the spell&hellip;</p>
      ) : null}
      {o ? <div className="cs-prose cs-spell-text">{o.x}</div> : null}
      {o?.h ? (
        <div className="cs-prose cs-spell-text">
          <b>{sp.level ? "Using a higher-level spell slot. " : "Cantrip upgrade. "}</b>
          {o.h}
        </div>
      ) : null}
      {sp.note ? <div className="cs-prose cs-spell-text">{sp.note}</div> : null}
      {sp.save ? (
        <p className="cs-spell-meta">
          Targets make a {ABILITY_NAME[sp.save]} save against DC {spellSaveDc(sheet, level)}.
        </p>
      ) : null}
      {onRoll && (sp.attack || dice) ? (
        <div className="cs-spell-acts">
          {sp.attack ? (
            <button type="button" className="cs-atk-b" onClick={() => onRoll({ kind: "spell", spellId: sp.id, part: "hit" })}>
              <b>{signed(spellAttackBonus(sheet, level))}</b>
              <small>spell attack</small>
            </button>
          ) : null}
          {dice ? (
            <button type="button" className="cs-atk-b" onClick={() => onRoll({ kind: "spell", spellId: sp.id, part: "damage" })}>
              <b>{dice}</b>
              <small>roll</small>
            </button>
          ) : null}
          {dice && sp.attack ? (
            <button type="button" className="cs-atk-b crit" onClick={() => onRoll({ kind: "spell", spellId: sp.id, part: "damage", crit: true })}>
              <b>Crit</b>
              <small>×2 dice</small>
            </button>
          ) : null}
        </div>
      ) : null}
      <div className="cs-spell-acts">
        {sp.level === 0 ? (
          sp.conc ? (
            <button type="button" className="btn small primary" onClick={() => void act({ k: "cast", spellId: sp.id, use: "free" })}>
              Cast (concentrate)
            </button>
          ) : null
        ) : (
          <>
            {slotLevels.map((l) => (
              <button key={l} type="button" className="btn small primary" disabled={!left[l - 1]} onClick={() => void act({ k: "cast", spellId: sp.id, use: "slot", slot: l })}>
                Cast {ord(l)} <small>({left[l - 1]} left)</small>
              </button>
            ))}
            {pact && sp.level <= pact.level ? (
              <button type="button" className="btn small primary" disabled={!pl} onClick={() => void act({ k: "cast", spellId: sp.id, use: "pact" })}>
                Cast with Pact slot <small>({pl} left)</small>
              </button>
            ) : null}
            <button type="button" className="btn small" onClick={() => void act({ k: "cast", spellId: sp.id, use: "free" })} title="A ritual, or a feature that casts it without a slot">
              {sp.ritual ? "Cast as ritual" : "Cast without a slot"}
            </button>
          </>
        )}
      </div>
      {sp.level > 0 ? (
        <label className="check cs-prep">
          <input type="checkbox" checked={!!sp.prepared} onChange={(e) => onPrepared(e.target.checked)} /> Prepared
        </label>
      ) : null}
    </div>
  );
}

/** Casting ability, typed extras and slots by hand (multiclass, a feat). */
function CastingEditor({ sheet, level, fixed, send }: { sheet: CharacterSheet; level: number | undefined; fixed: boolean; send: (p: SheetPatch) => Promise<boolean> }) {
  const auto = slotsMaxOf({ ...sheet, slotsMax: undefined }, level);
  const byHand = !!sheet.slotsMax;
  const num = (v: string, lo: number, hi: number) => {
    const n = Math.round(Number(v.replace("−", "-")));
    return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : 0;
  };
  const cls = classOf(sheet);
  return (
    <div className="cs-cast-edit">
      <div className="cs-atk-row">
        <label className="cs-field">
          <span>Spellcasting ability</span>
          <select className="fld" value={sheet.castAbility ?? ""} disabled={fixed} onChange={(e) => void send({ castAbility: (e.target.value || null) as SheetPatch["castAbility"] })}>
            <option value="">{cls ? `From class${castAbilityOf({ ...sheet, castAbility: undefined }) ? ` (${ABILITY_SHORT[castAbilityOf({ ...sheet, castAbility: undefined })!]})` : ""}` : "None"}</option>
            {ABILITIES.map((a) => (
              <option key={a} value={a}>
                {ABILITY_NAME[a]}
              </option>
            ))}
          </select>
        </label>
        <label className="cs-field cs-small">
          <span>Attack extra</span>
          <input className="fld" defaultValue={sheet.extra?.spellAtk ? String(sheet.extra.spellAtk) : ""} placeholder="+0" disabled={fixed} onBlur={(e) => void send({ extra: { spellAtk: num(e.target.value, -EXTRA_MAX, EXTRA_MAX) } })} />
        </label>
        <label className="cs-field cs-small">
          <span>DC extra</span>
          <input className="fld" defaultValue={sheet.extra?.spellDc ? String(sheet.extra.spellDc) : ""} placeholder="+0" disabled={fixed} onBlur={(e) => void send({ extra: { spellDc: num(e.target.value, -EXTRA_MAX, EXTRA_MAX) } })} />
        </label>
      </div>
      <label className="check">
        <input type="checkbox" checked={byHand} disabled={fixed} onChange={(e) => void send({ slotsMax: e.target.checked ? auto : null })} /> Set spell slots by hand (multiclass, a feat)
      </label>
      {byHand ? (
        <div className="cs-slot-edit">
          {sheet.slotsMax!.map((m, i) => (
            <label key={i} className="cs-field">
              <span>{ord(i + 1)}</span>
              <input
                className="fld"
                inputMode="numeric"
                defaultValue={String(m)}
                disabled={fixed}
                onBlur={(e) => {
                  const next = [...sheet.slotsMax!];
                  next[i] = num(e.target.value, 0, 9);
                  if (next[i] !== m) void send({ slotsMax: next });
                }}
              />
            </label>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SpellCard({ sp, onSave, onRemove }: { sp: SheetSpell; onSave: (s: SheetSpell) => Promise<boolean>; onRemove: () => void }) {
  const [d, setD] = useState(sp);
  useEffect(() => setD(sp), [sp]);
  const commit = (next: SheetSpell) => {
    setD(next);
    if (JSON.stringify(next) !== JSON.stringify(sp)) void onSave(next);
  };
  const flag = (k: "prepared" | "conc" | "ritual" | "attack" | "addMod" | "scale", label: string) => (
    <label className="check">
      <input type="checkbox" checked={!!d[k]} onChange={(e) => commit({ ...d, [k]: e.target.checked || undefined })} /> {label}
    </label>
  );
  return (
    <div className="cs-atk-card cs-spell-card">
      <div className="cs-atk-row">
        <label className="cs-field cs-grow">
          <span>Name</span>
          <input className="fld" value={d.name} maxLength={NAME_FIELD_MAX} onChange={(e) => setD({ ...d, name: e.target.value })} onBlur={() => commit(d)} />
        </label>
        <label className="cs-field cs-mid">
          <span>Level</span>
          <select className="fld" value={d.level} onChange={(e) => commit({ ...d, level: Number(e.target.value) })}>
            {SPELL_LEVEL_NAME.map((n, i) => (
              <option key={i} value={i}>
                {i ? ord(i) : "Cantrip"}
              </option>
            ))}
          </select>
        </label>
        <label className="cs-field cs-small">
          <span>Save</span>
          <select className="fld" value={d.save ?? ""} onChange={(e) => commit({ ...d, save: (e.target.value || undefined) as SheetSpell["save"] })}>
            <option value="">None</option>
            {ABILITIES.map((a) => (
              <option key={a} value={a}>
                {ABILITY_SHORT[a]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="cs-atk-row">
        <label className="cs-field cs-small">
          <span>Dice</span>
          <input
            className="fld"
            inputMode="numeric"
            value={d.count ? String(d.count) : ""}
            placeholder="0"
            onChange={(e) => {
              const n = Math.min(20, Math.max(0, Math.round(Number(e.target.value)) || 0));
              setD({ ...d, count: n || undefined, sides: n ? (d.sides ?? 6) : d.sides });
            }}
            onBlur={() => commit(d)}
          />
        </label>
        <label className="cs-field cs-small">
          <span>Die</span>
          <select className="fld" value={d.sides ?? 6} onChange={(e) => commit({ ...d, sides: Number(e.target.value) as SheetSpell["sides"] })}>
            {SPELL_DICE.map((x) => (
              <option key={x} value={x}>
                d{x}
              </option>
            ))}
          </select>
        </label>
        <label className="cs-field cs-grow">
          <span>Damage type</span>
          <input className="fld" value={d.type ?? ""} maxLength={20} placeholder="fire, healing" onChange={(e) => setD({ ...d, type: e.target.value })} onBlur={() => commit(d)} />
        </label>
      </div>
      <div className="cs-atk-row cs-atk-checks">
        {d.level > 0 ? flag("prepared", "Prepared") : null}
        {flag("conc", "Concentration")}
        {flag("ritual", "Ritual")}
        {flag("attack", "Spell attack")}
        {flag("addMod", "Add ability to the roll")}
        {d.level === 0 ? flag("scale", "Dice grow at 5, 11, 17") : null}
      </div>
      {!sp.srd ? (
        <label className="cs-field">
          <span>What it does</span>
          <textarea className="fld" rows={2} maxLength={SPELL_NOTE_MAX} value={d.note ?? ""} onChange={(e) => setD({ ...d, note: e.target.value })} onBlur={() => commit(d)} />
        </label>
      ) : null}
      <div className="cs-atk-row">
        <span className="cs-atk-sum">{sp.srd ? "From the SRD" : "Your own"}</span>
        <button type="button" className="btn small" onClick={onRemove}>
          Remove
        </button>
      </div>
    </div>
  );
}

/** The SRD spell list: search, filter by class and level, tap Add. */
function SpellPicker({ sheet, onClose, onAdd, onRemove }: { sheet: CharacterSheet; onClose: () => void; onAdd: (sp: SheetSpell) => Promise<boolean>; onRemove: (srd: string) => Promise<boolean> }) {
  const all = useSrdSpells();
  const myClass = classOf(sheet)?.name;
  const [q, setQ] = useState("");
  const [cls, setCls] = useState<string>(myClass && ["Bard", "Cleric", "Druid", "Paladin", "Ranger", "Sorcerer", "Warlock", "Wizard"].includes(myClass) ? myClass : "");
  const [lv, setLv] = useState<number | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const have = new Set((sheet.spells ?? []).map((s) => s.srd).filter(Boolean));
  const full = (sheet.spells ?? []).length >= SPELLS_MAX;
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  const shown = useMemo(() => {
    if (!all) return [];
    const t = q.trim().toLowerCase();
    return all.filter((o) => (!cls || o.c.includes(cls)) && (lv === null || o.l === lv) && (!t || o.n.toLowerCase().includes(t)));
  }, [all, q, cls, lv]);
  return (
    <div className="cs-picker" role="dialog" aria-modal="true" aria-label="Add spells">
      <div className="cs-picker-in">
        <div className="cs-picker-head">
          <h3>Add spells</h3>
          <button type="button" className="btn small primary" onClick={onClose}>
            Done
          </button>
        </div>
        <input className="fld" type="search" placeholder="Search spells" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search spells" autoFocus />
        <div className="cs-picker-filters">
          <select className="fld" value={cls} onChange={(e) => setCls(e.target.value)} aria-label="Class">
            <option value="">All classes</option>
            {["Bard", "Cleric", "Druid", "Paladin", "Ranger", "Sorcerer", "Warlock", "Wizard"].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <div className="cs-lv-chips" role="group" aria-label="Spell level">
            <button type="button" className={`cs-chip${lv === null ? " sel" : ""}`} aria-pressed={lv === null} onClick={() => setLv(null)}>
              All
            </button>
            {SPELL_LEVEL_NAME.map((_, i) => (
              <button key={i} type="button" className={`cs-chip${lv === i ? " sel" : ""}`} aria-pressed={lv === i} onClick={() => setLv(lv === i ? null : i)}>
                {i ? i : "C"}
              </button>
            ))}
          </div>
        </div>
        {!all ? <p className="note">Loading the spell list&hellip;</p> : null}
        <ul className="cs-list cs-picker-list">
          {shown.map((o) => (
            <li key={o.i} className={open === o.i ? "open" : undefined}>
              <button type="button" className="cs-row-tap" aria-expanded={open === o.i} onClick={() => setOpen(open === o.i ? null : o.i)}>
                <span className="cs-name">
                  {o.n}
                  {o.conc ? <span className="cs-tag">C</span> : null}
                  {o.rit ? <span className="cs-tag">R</span> : null}
                </span>
                <span className="cs-spell-sum">{o.l ? ord(o.l) : "Cantrip"}</span>
              </button>
              {have.has(o.i) ? (
                <button type="button" className="btn small on" onClick={() => void onRemove(o.i)} aria-label={`Remove ${o.n}`}>
                  Added
                </button>
              ) : (
                <button type="button" className="btn small" disabled={full} onClick={() => void onAdd(spellFromSrd(o))} aria-label={`Add ${o.n}`}>
                  Add
                </button>
              )}
              {open === o.i ? (
                <div className="cs-spell-detail">
                  <p className="cs-spell-meta">
                    {o.l ? `${ord(o.l)} level ${o.s.toLowerCase()}` : `${o.s} cantrip`} · {o.t} · {o.r} · {o.k} · {o.d} · {o.c.join(", ")}
                  </p>
                  <div className="cs-prose cs-spell-text">{o.x}</div>
                  {o.h ? <div className="cs-prose cs-spell-text">{o.h}</div> : null}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
        {all && !shown.length ? <p className="note">No spells match.</p> : null}
        <p className="note cs-credit">Spells from the free D&amp;D System Reference Document 5.2 by Wizards of the Coast (CC-BY-4.0).</p>
      </div>
    </div>
  );
}
