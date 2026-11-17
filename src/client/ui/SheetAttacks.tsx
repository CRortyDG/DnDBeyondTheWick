"use client";

import { useEffect, useState } from "react";
import { ABILITIES, ABILITY_SHORT, ATTACKS_MAX, attackBonus, DAMAGE_DICE, damageText, EXTRA_MAX, NAME_FIELD_MAX, signed, type CharacterSheet, type SheetAttack, type SheetPatch, type SheetRoll } from "@/shared/sheet";

const newId = () => Math.random().toString(36).slice(2, 10);

/** Attacks on the sheet: tap to-hit, then damage (or Crit for double dice). */
export function AttackList({ sheet, level, onRoll }: { sheet: CharacterSheet; level: number | undefined; onRoll?: (r: SheetRoll) => void }) {
  const list = sheet.attacks ?? [];
  if (!list.length) return null;
  return (
    <section className="cs-block">
      <h3 className="cs-h">Attacks</h3>
      <ul className="cs-list cs-attacks">
        {list.map((a) => {
          const hit = signed(attackBonus(sheet, a, level));
          const dmg = damageText(sheet, a);
          return (
            <li key={a.id}>
              <span className="cs-name">{a.name}</span>
              {onRoll ? (
                <>
                  <button type="button" className="cs-atk-b" aria-label={`Roll ${a.name} to hit, ${hit}`} onClick={() => onRoll({ kind: "attack", attackId: a.id, part: "hit" })}>
                    <b>{hit}</b>
                    <small>to hit</small>
                  </button>
                  {dmg ? (
                    <>
                      <button
                        type="button"
                        className="cs-atk-b"
                        aria-label={`Roll ${a.name} damage, ${dmg}`}
                        onClick={() =>
                          onRoll({
                            kind: "attack",
                            attackId: a.id,
                            part: "damage",
                          })
                        }
                      >
                        <b>{dmg}</b>
                        <small>damage</small>
                      </button>
                      <button
                        type="button"
                        className="cs-atk-b crit"
                        aria-label={`Roll ${a.name} critical damage, double dice`}
                        onClick={() =>
                          onRoll({
                            kind: "attack",
                            attackId: a.id,
                            part: "damage",
                            crit: true,
                          })
                        }
                      >
                        <b>Crit</b>
                        <small>×2 dice</small>
                      </button>
                    </>
                  ) : null}
                </>
              ) : (
                <span className="cs-atk-static">
                  <b>{hit}</b> to hit{dmg ? ` · ${dmg}` : ""}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Editing the attacks: one card each, saved when you leave a field. */
export function AttackEditor({ sheet, level, send }: { sheet: CharacterSheet; level: number | undefined; send: (p: SheetPatch) => Promise<boolean> }) {
  const list = sheet.attacks ?? [];
  const save = (next: SheetAttack[]) => send({ attacks: next });
  const add = () =>
    save([
      ...list,
      {
        id: newId(),
        name: "New attack",
        ability: "str",
        prof: true,
        count: 1,
        sides: 8,
        dmgMod: true,
      },
    ]);
  return (
    <section className="cs-block">
      <h3 className="cs-h">Attacks</h3>
      {list.map((a) => (
        <AttackCard key={a.id} a={a} sheet={sheet} level={level} onSave={(x) => save(list.map((y) => (y.id === a.id ? x : y)))} onRemove={() => save(list.filter((y) => y.id !== a.id))} />
      ))}
      {list.length < ATTACKS_MAX ? (
        <button type="button" className="btn small cs-add" onClick={() => void add()}>
          + Add an attack
        </button>
      ) : null}
      <p className="note">Weapons add your proficiency and the ability to hit and to damage. For a cantrip like Fire Bolt, pick its ability and untick &ldquo;add to damage&rdquo;.</p>
    </section>
  );
}

function AttackCard({ a, sheet, level, onSave, onRemove }: { a: SheetAttack; sheet: CharacterSheet; level: number | undefined; onSave: (a: SheetAttack) => Promise<boolean>; onRemove: () => void }) {
  const [d, setD] = useState(a);
  useEffect(() => setD(a), [a]);
  const commit = (next: SheetAttack) => {
    setD(next);
    if (JSON.stringify(next) !== JSON.stringify(a)) void onSave(next);
  };
  const num = (v: string, min: number, max: number) => {
    const n = Math.round(Number(v.replace("−", "-")));
    return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : 0;
  };
  return (
    <div className="cs-atk-card">
      <div className="cs-atk-row">
        <label className="cs-field cs-grow">
          <span>Name</span>
          <input className="fld" value={d.name} maxLength={NAME_FIELD_MAX} onChange={(e) => setD({ ...d, name: e.target.value })} onBlur={() => commit(d)} />
        </label>
        <label className="cs-field">
          <span>Ability</span>
          <select
            className="fld"
            value={d.ability}
            onChange={(e) =>
              commit({
                ...d,
                ability: e.target.value as SheetAttack["ability"],
              })
            }
          >
            {ABILITIES.map((x) => (
              <option key={x} value={x}>
                {ABILITY_SHORT[x]}
              </option>
            ))}
            <option value="none">None</option>
          </select>
        </label>
      </div>
      <div className="cs-atk-row">
        <label className="cs-field cs-small">
          <span>Dice</span>
          <input className="fld" inputMode="numeric" value={String(d.count)} onChange={(e) => setD({ ...d, count: num(e.target.value, 0, 10) })} onBlur={() => commit(d)} />
        </label>
        <label className="cs-field cs-small">
          <span>Die</span>
          <select
            className="fld"
            value={d.sides}
            onChange={(e) =>
              commit({
                ...d,
                sides: Number(e.target.value) as SheetAttack["sides"],
              })
            }
          >
            {DAMAGE_DICE.map((x) => (
              <option key={x} value={x}>
                d{x}
              </option>
            ))}
          </select>
        </label>
        <label className="cs-field cs-grow">
          <span>Damage type</span>
          <input className="fld" value={d.type ?? ""} maxLength={20} placeholder="slashing" onChange={(e) => setD({ ...d, type: e.target.value })} onBlur={() => commit(d)} />
        </label>
      </div>
      <div className="cs-atk-row">
        <label className="cs-field cs-small">
          <span>Extra to hit</span>
          <input
            className="fld"
            value={d.hit ? String(d.hit) : ""}
            placeholder="+0"
            onChange={(e) =>
              setD({
                ...d,
                hit: num(e.target.value, -EXTRA_MAX, EXTRA_MAX) || undefined,
              })
            }
            onBlur={() => commit(d)}
          />
        </label>
        <label className="cs-field cs-small">
          <span>Extra damage</span>
          <input
            className="fld"
            value={d.dmg ? String(d.dmg) : ""}
            placeholder="+0"
            onChange={(e) =>
              setD({
                ...d,
                dmg: num(e.target.value, -EXTRA_MAX, EXTRA_MAX) || undefined,
              })
            }
            onBlur={() => commit(d)}
          />
        </label>
      </div>
      <div className="cs-atk-row cs-atk-checks">
        <label className="check">
          <input type="checkbox" checked={d.prof} onChange={(e) => commit({ ...d, prof: e.target.checked })} /> Proficient
        </label>
        <label className="check">
          <input type="checkbox" checked={d.dmgMod} onChange={(e) => commit({ ...d, dmgMod: e.target.checked })} /> Add ability to damage
        </label>
        <span className="cs-atk-sum">
          {signed(attackBonus(sheet, d, level))} to hit
          {damageText(sheet, d) ? ` · ${damageText(sheet, d)}` : ""}
        </span>
        <button type="button" className="btn small" onClick={onRemove}>
          Remove
        </button>
      </div>
    </div>
  );
}
