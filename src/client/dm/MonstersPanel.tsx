"use client";

// The DM's monster library (templates for combat mode) and the fight history.
// DM-only: none of this reaches the TV or the phones.

import { useState } from "react";
import { monstersOf, rechargeText, isDice } from "@/shared/combat";
import { formatCp } from "@/shared/money";
import type { MonsterAbility, MonsterTemplate } from "@/shared/types";
import { useDm } from "./context";

type Draft = Omit<MonsterTemplate, "id" | "abilities"> & { abilities: (Omit<MonsterAbility, "id"> & { id?: string })[] };

const EMPTY: Draft = { name: "", displayName: "", ac: 10, hp: "10", initBonus: 0, speed: "30 ft.", attacks: [], abilities: [], resist: "", immune: "", notes: "", dmNote: "" };

export function MonstersPanel({ onFight }: { onFight: () => void }) {
  const { view, run } = useDm();
  const s = view.state;
  const list = monstersOf(s);
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [counts, setCounts] = useState<Record<string, string>>({});
  const hist = [...(s.fights ?? [])].reverse();

  const start = async (t?: MonsterTemplate) => {
    const n = t ? Math.max(1, Math.min(20, Number(counts[t.id] ?? "1") || 1)) : 0;
    if (await run({ type: "fight.start", ...(t ? { groups: [{ templateId: t.id, count: n }] } : {}) }, "Roll initiative! The TV and phones are asking.")) onFight();
  };

  return (
    <div className="fx-lib">
      <p className="note">Monster templates for combat mode: the numbers from a stat block, typed in by hand. Only you see these. The TV shows a monster&rsquo;s TV name and how hurt it looks, never its numbers.</p>
      <div className="fx-add-row">
        <button className="btn primary" type="button" onClick={() => setEditing("new")}>
          + New monster
        </button>
        {s.fight ? (
          <button className="btn" type="button" onClick={onFight}>
            Back to the fight
          </button>
        ) : (
          <button className="btn" type="button" onClick={() => start()}>
            Start a fight (add monsters there)
          </button>
        )}
      </div>
      {editing === "new" ? <MonsterEditor draft={EMPTY} onDone={() => setEditing(null)} /> : null}
      <ul className="fx-lib-list">
        {list.map((t) =>
          editing === t.id ? (
            <li key={t.id}>
              <MonsterEditor id={t.id} draft={t} onDone={() => setEditing(null)} />
            </li>
          ) : (
            <li key={t.id} className="box fx-lib-item">
              <div className="fx-lib-head">
                <div>
                  <b>{t.name}</b>
                  {t.displayName && t.displayName !== t.name ? <span className="note"> · TV: “{t.displayName}”</span> : null}
                  <div className="note">
                    AC {t.ac} · HP {t.hp} · Init {t.initBonus >= 0 ? "+" : ""}
                    {t.initBonus}
                    {t.speed ? ` · ${t.speed}` : ""}
                    {t.attacks.length ? ` · ${t.attacks.map((a) => `${a.name} ${a.bonus >= 0 ? "+" : ""}${a.bonus} (${a.damage})`).join(", ")}` : ""}
                  </div>
                  {t.abilities.length ? <div className="note">{t.abilities.map((a) => `${a.name}${a.recharge ? ` (Recharge ${rechargeText(a.recharge)})` : a.uses ? ` (${a.uses}/day)` : a.onDeath ? " (on death)" : ""}`).join(" · ")}</div> : null}
                  {t.dmNote ? <div className="note">Note: {t.dmNote}</div> : null}
                </div>
                <span className="spacer" />
                {!s.fight ? (
                  <span className="fx-add-row">
                    <input className="fld fx-rounds" inputMode="numeric" aria-label={`How many ${t.name}`} value={counts[t.id] ?? "1"} onChange={(e) => setCounts({ ...counts, [t.id]: e.target.value.replace(/\D/g, "").slice(0, 2) })} />
                    <button className="btn small primary" type="button" onClick={() => start(t)}>
                      Fight
                    </button>
                  </span>
                ) : null}
                <button className="btn small" type="button" onClick={() => setEditing(t.id)}>
                  Edit
                </button>
                <button className="btn small danger" type="button" onClick={() => window.confirm(`Delete ${t.name} from the library?`) && run({ type: "monster.remove", monsterId: t.id }, `${t.name} deleted.`)}>
                  Delete
                </button>
              </div>
            </li>
          ),
        )}
      </ul>
      {!list.length && editing !== "new" ? <p className="note">No monsters yet.</p> : null}

      <h3 className="fx-hist-h">Past fights</h3>
      {hist.length ? (
        <ul className="fx-hist">
          {hist.map((h) => {
            const sess = s.sessions.find((x) => x.id === h.sessionId);
            return (
              <li key={h.id}>
                <b>{h.title}</b>
                {h.where ? ` · ${h.where}` : ""} · {h.rounds} round{h.rounds === 1 ? "" : "s"}
                {sess ? ` · ${sess.title}` : ""} · {new Date(h.endedAt).toLocaleDateString()}
                <div className="note">
                  {h.downed.length ? `Went down: ${h.downed.join(", ")}.` : "Nobody went down."}
                  {h.lootCp ? ` Loot: ${formatCp(h.lootCp)}.` : ""}
                  {h.items ? ` Items: ${h.items}.` : ""}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="note">None yet. Each finished fight is kept here.</p>
      )}
    </div>
  );
}

function MonsterEditor({ id, draft, onDone }: { id?: string; draft: Draft; onDone: () => void }) {
  const { view, run, toast } = useDm();
  const [d, setD] = useState<Draft>(() => structuredClone(draft));
  const portraits = view.state.scenes.filter((x) => x.kind === "portrait");
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));
  const num = (v: string, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.round(Number(v) || 0)));

  const save = async () => {
    if (!d.name.trim()) return toast("Give it a name.");
    if (!isDice(d.hp)) return toast("HP must be a number like 21 or dice like 6d6.");
    const monster = {
      name: d.name,
      displayName: d.displayName,
      ac: d.ac,
      hp: d.hp,
      initBonus: d.initBonus,
      speed: d.speed,
      attacks: d.attacks.filter((a) => a.name.trim()),
      abilities: d.abilities.filter((a) => a.name.trim()),
      resist: d.resist,
      immune: d.immune,
      notes: d.notes,
      dmNote: d.dmNote,
      sceneId: d.sceneId ?? null,
    };
    const ok = id ? await run({ type: "monster.update", monsterId: id, monster }, "Saved.") : await run({ type: "monster.add", monster }, `${d.name.trim()} added.`);
    if (ok) onDone();
  };

  return (
    <div className="box fx-editor">
      <div className="fx-detail-grid">
        <label>
          Name
          <input className="fld" value={d.name} maxLength={80} onChange={(e) => set("name", e.target.value)} />
        </label>
        <label>
          TV name until revealed
          <input className="fld" value={d.displayName} maxLength={80} placeholder="Same as the name" onChange={(e) => set("displayName", e.target.value)} />
        </label>
        <label>
          AC
          <input className="fld fx-num" inputMode="numeric" value={d.ac} onChange={(e) => set("ac", num(e.target.value, 0, 50))} />
        </label>
        <label>
          HP (21 or 6d6)
          <input className="fld" value={d.hp} maxLength={40} onChange={(e) => set("hp", e.target.value)} />
        </label>
        <label>
          Initiative bonus
          <input className="fld fx-num" value={d.initBonus} onChange={(e) => set("initBonus", num(e.target.value, -10, 20))} />
        </label>
        <label>
          Speed
          <input className="fld" value={d.speed} maxLength={80} onChange={(e) => set("speed", e.target.value)} />
        </label>
      </div>

      <h4>Attacks</h4>
      {d.attacks.map((a, i) => (
        <div key={i} className="fx-add-row">
          <input className="fld" aria-label="Attack name" placeholder="Claw" value={a.name} maxLength={80} onChange={(e) => set("attacks", d.attacks.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
          <input className="fld fx-rounds" aria-label="To hit" placeholder="+5" value={a.bonus} onChange={(e) => set("attacks", d.attacks.map((x, j) => (j === i ? { ...x, bonus: num(e.target.value, -10, 30) } : x)))} />
          <input className="fld" aria-label="Damage" placeholder="1d4 + 3" value={a.damage} maxLength={80} onChange={(e) => set("attacks", d.attacks.map((x, j) => (j === i ? { ...x, damage: e.target.value } : x)))} />
          <button className="btn small" type="button" aria-label="Remove attack" onClick={() => set("attacks", d.attacks.filter((_, j) => j !== i))}>
            ×
          </button>
        </div>
      ))}
      <button className="btn small" type="button" onClick={() => set("attacks", [...d.attacks, { name: "", bonus: 0, damage: "" }])}>
        + Attack
      </button>

      <h4>Abilities</h4>
      {d.abilities.map((a, i) => {
        const kind = a.recharge ? "recharge" : a.uses ? "uses" : a.onDeath ? "death" : "plain";
        const patch = (p: Partial<Draft["abilities"][number]>) => set("abilities", d.abilities.map((x, j) => (j === i ? { ...x, ...p } : x)));
        return (
          <div key={i} className="fx-ability-edit">
            <div className="fx-add-row">
              <input className="fld" aria-label="Ability name" placeholder="Fire Breath" value={a.name} maxLength={80} onChange={(e) => patch({ name: e.target.value })} />
              <select
                className="fld"
                aria-label="Kind"
                value={kind}
                onChange={(e) => {
                  const k = e.target.value;
                  patch({ recharge: k === "recharge" ? 6 : undefined, uses: k === "uses" ? 1 : undefined, onDeath: k === "death" ? true : undefined });
                }}
              >
                <option value="plain">Always on</option>
                <option value="recharge">Recharge</option>
                <option value="uses">Uses per day</option>
                <option value="death">When it dies (reminder)</option>
              </select>
              {kind === "recharge" ? (
                <select className="fld" aria-label="Recharges on" value={a.recharge} onChange={(e) => patch({ recharge: Number(e.target.value) })}>
                  {[6, 5, 4, 3, 2].map((n) => (
                    <option key={n} value={n}>
                      Recharge {rechargeText(n)}
                    </option>
                  ))}
                </select>
              ) : null}
              {kind === "uses" ? (
                <select className="fld" aria-label="Uses per day" value={a.uses} onChange={(e) => patch({ uses: Number(e.target.value) })}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n}/day
                    </option>
                  ))}
                </select>
              ) : null}
              <button className="btn small" type="button" aria-label="Remove ability" onClick={() => set("abilities", d.abilities.filter((_, j) => j !== i))}>
                ×
              </button>
            </div>
            <textarea className="fld" rows={2} aria-label="What it does" placeholder={kind === "death" ? "The reminder: DC 11 Dex, 2d6, 5 ft." : "15-ft cone, DC 11 Dex, 2d6 fire, half on a save."} value={a.text} maxLength={600} onChange={(e) => patch({ text: e.target.value })} />
          </div>
        );
      })}
      <button className="btn small" type="button" onClick={() => set("abilities", [...d.abilities, { name: "", text: "" }])}>
        + Ability
      </button>

      <div className="fx-detail-grid">
        <label>
          Resistances
          <input className="fld" value={d.resist} maxLength={200} onChange={(e) => set("resist", e.target.value)} />
        </label>
        <label>
          Immunities
          <input className="fld" value={d.immune} maxLength={200} onChange={(e) => set("immune", e.target.value)} />
        </label>
        <label>
          Portrait on the TV
          <select className="fld" value={d.sceneId ?? ""} onChange={(e) => set("sceneId", e.target.value || undefined)}>
            <option value="">An icon</option>
            {portraits.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label>
        Notes
        <textarea className="fld" rows={2} value={d.notes} maxLength={2000} onChange={(e) => set("notes", e.target.value)} />
      </label>
      <label>
        DM note (shown as a reminder when a fight with it starts)
        <textarea className="fld" rows={2} value={d.dmNote} maxLength={2000} onChange={(e) => set("dmNote", e.target.value)} />
      </label>
      <div className="fx-add-row">
        <button className="btn primary" type="button" onClick={save}>
          Save
        </button>
        <button className="btn" type="button" onClick={onDone}>
          Cancel
        </button>
      </div>
    </div>
  );
}
