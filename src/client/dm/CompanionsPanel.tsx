"use client";

// The DM's companions: stat blocks (DM-only, like monsters), who's with the
// party now, who runs each one, and hirelings from the shop.

import { ask } from "./ask";
import { useState } from "react";
import { rechargeText } from "@/shared/combat";
import { COMPANION_FIELDS, COMPANION_FIELD_LABEL, companionsOf, companionTemplatesOf, controllerName, needsWarning, type CompanionBody } from "@/shared/companions";
import { formatCp } from "@/shared/money";
import { penName } from "@/shared/chronicle";
import type { Companion, CompanionField, CompanionTemplate } from "@/shared/types";
import { useDm } from "./context";
import { PageHead } from "./PageHead";
import { PlusIcon } from "./navIcons";
import { Drawer } from "./Drawer";
import { MenuItem, RowMenu } from "./RowMenu";

const EMPTY: CompanionBody = {
  name: "",
  combat: true,
  ac: 12,
  hp: 10,
  initBonus: 0,
  speed: "30 ft.",
  attacks: [],
  abilities: [],
  resist: "",
  offers: "",
  dmNote: "",
  hidden: [],
  tvHealth: "state",
  atZero: "saves",
  takesShare: false,
  needs: null,
  entryId: null,
  sceneId: null,
};

function bodyOf(t: CompanionTemplate): CompanionBody {
  return {
    name: t.name,
    combat: t.combat,
    ac: t.ac,
    hp: t.hp,
    initBonus: t.initBonus,
    speed: t.speed,
    attacks: t.attacks.map((a) => ({ ...a })),
    abilities: t.abilities.map((a) => ({ id: a.id, name: a.name, text: a.text, ...(a.recharge ? { recharge: a.recharge } : {}), ...(a.uses ? { uses: a.uses } : {}) })),
    resist: t.resist,
    offers: t.offers,
    dmNote: t.dmNote,
    hidden: [...t.hidden],
    tvHealth: t.tvHealth,
    atZero: t.atZero,
    takesShare: t.takesShare,
    needs: t.needs ?? null,
    entryId: t.entryId ?? null,
    sceneId: t.sceneId ?? null,
  };
}

export function CompanionsPanel() {
  const { view, run } = useDm();
  const s = view.state;
  const templates = companionTemplatesOf(s);
  const all = companionsOf(s);
  const withUs = all.filter((c) => c.status === "with" && (!s.world || !c.partyId || c.partyId === s.partyId));
  const left = all
    .filter((c) => c.status !== "with")
    .slice(-10)
    .reverse();
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [attaching, setAttaching] = useState<string | null>(null);

  return (
    <div className="pg cm-page">
      <PageHead
        title="Companions"
        sub="NPCs and hirelings who travel with the party. Players run them in fights."
        help={
          <p>
            A companion is a stat block, like a monster, that travels with the party. Pick who runs them: a player (their phone gets the companion&rsquo;s turn, HP and abilities) or you. Untick what
            the player shouldn&rsquo;t see; your DM note never leaves this screen. Hirelings come from the shop: link a template to an item and buying it hires them, paid each session (Keep or Let go
            when the session ends).
          </p>
        }
        actions={
          <button className="btn primary" type="button" onClick={() => setEditing("new")}>
            <PlusIcon size={16} /> Companion
          </button>
        }
        stats={[
          { label: "With the party", value: withUs.length, tone: withUs.length ? "gold" : "muted" },
          { label: "Stat blocks", value: templates.length, tone: "muted" },
        ]}
      />

      <h3 className="cm-h">With the party</h3>
      {withUs.length ? (
        <ul className="row-list cm-list">
          {withUs.map((c) => (
            <WithRow key={c.id} c={c} />
          ))}
        </ul>
      ) : (
        <p className="note">Nobody yet. Attach one below, or a player hires one from the shop.</p>
      )}

      <h3 className="cm-h">Stat blocks</h3>
      {editing === "new" ? (
        <Drawer title="New companion" onClose={() => setEditing(null)} closeLabel="Cancel">
          <CompanionEditor draft={EMPTY} onDone={() => setEditing(null)} />
        </Drawer>
      ) : null}
      <ul className="row-list cm-list">
        {templates.map((t) => {
          const items = s.items.filter((it) => it.companionTemplateId === t.id);
          return (
            <li key={t.id} className="list-row">
              <div className="scene-row">
                <button type="button" className="row-main" onClick={() => setEditing(t.id)} title={`Edit ${t.name}`}>
                  <span className="row-title">
                    {t.name}
                    {!t.combat ? <span className="row-aside"> · doesn&rsquo;t fight</span> : null}
                    {items.length ? <span className="row-aside"> · hired from {items.map((it) => it.name).join(", ")}</span> : null}
                  </span>
                  <span className="row-sub">
                    {t.combat ? `AC ${t.ac} · HP ${t.hp} · Init ${t.initBonus >= 0 ? "+" : ""}${t.initBonus}` : `HP ${t.hp}`}
                    {t.attacks.length ? ` · ${t.attacks.map((a) => `${a.name} ${a.bonus >= 0 ? "+" : ""}${a.bonus} (${a.damage})`).join(", ")}` : ""}
                  </span>
                  {t.offers ? <span className="row-sub">{t.offers}</span> : null}
                  {t.dmNote ? <span className="row-sub">Note: {t.dmNote}</span> : null}
                </button>
                <button className="btn small primary" type="button" onClick={() => setAttaching(attaching === t.id ? null : t.id)} aria-expanded={attaching === t.id}>
                  Join the party
                </button>
                <RowMenu label={t.name}>
                  <MenuItem onClick={() => setEditing(t.id)}>Edit</MenuItem>
                  <MenuItem danger onClick={() => void ask(`Delete ${t.name}?`).then((ok) => ok && run({ type: "companion.templateRemove", templateId: t.id }, `${t.name} deleted.`))}>
                    Delete
                  </MenuItem>
                </RowMenu>
              </div>
              {attaching === t.id ? <AttachForm t={t} onDone={() => setAttaching(null)} /> : null}
              {editing === t.id ? (
                <Drawer title={t.name} subtitle="Companion" onClose={() => setEditing(null)} closeLabel="Cancel">
                  <CompanionEditor id={t.id} draft={bodyOf(t)} onDone={() => setEditing(null)} />
                </Drawer>
              ) : null}
            </li>
          );
        })}
      </ul>
      {!templates.length ? <p className="pg-empty">No companions yet. Add one with + Companion.</p> : null}

      {left.length ? (
        <>
          <h3 className="cm-h">Left the party</h3>
          <ul className="row-list cm-list">
            {left.map((c) => (
              <li key={c.id} className="list-row">
                <div className="scene-row">
                  <span className="row-main">
                    <span className="row-title">
                      {c.name}
                      <span className="row-aside"> · {c.status === "dead" ? "died" : "went home"}</span>
                    </span>
                    {c.purseCp ? <span className="row-sub">Had {formatCp(c.purseCp)}</span> : null}
                  </span>
                  <button className="btn small" type="button" onClick={() => run({ type: "companion.forget", companionId: c.id })}>
                    Forget
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}

function ControllerSelect({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const { view } = useDm();
  const players = view.state.players.filter((p) => !p.archived);
  return (
    <select className="fld" aria-label={label} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="dm">Me (the DM)</option>
      {players.map((p) => (
        <option key={p.id} value={p.id}>
          {penName(p)}
        </option>
      ))}
    </select>
  );
}

function AttachForm({ t, onDone }: { t: CompanionTemplate; onDone: () => void }) {
  const { view, run } = useDm();
  const [controllerId, setController] = useState("dm");
  const [stay, setStay] = useState<"session" | "until">("session");
  const [follow, setFollow] = useState(false);
  const warn = needsWarning(view.state, t);
  return (
    <div className="box cm-attach">
      {warn ? (
        <p className="note warn-note" role="status">
          {warn} You can still bring them along.
        </p>
      ) : null}
      <div className="fx-add-row">
        <label>
          Run by
          <ControllerSelect value={controllerId} onChange={setController} label="Who runs them" />
        </label>
        <label>
          Stays
          <select className="fld" value={stay} onChange={(e) => setStay(e.target.value as "session" | "until")}>
            <option value="session">For this session</option>
            <option value="until">Until I dismiss them</option>
          </select>
        </label>
        {t.combat ? (
          <label className="check">
            <input type="checkbox" checked={follow} onChange={(e) => setFollow(e.target.checked)} disabled={controllerId === "dm"} /> Acts right after whoever runs them
          </label>
        ) : null}
        <button
          className="btn primary"
          type="button"
          onClick={async () =>
            (await run({ type: "companion.attach", templateId: t.id, controllerId, stay, ...(follow && controllerId !== "dm" ? { follow: true } : {}) }, `${t.name} joins the party.`)) && onDone()
          }
        >
          Join the party
        </button>
      </div>
    </div>
  );
}

function WithRow({ c }: { c: Companion }) {
  const { view, run } = useDm();
  const s = view.state;
  const t = companionTemplatesOf(s).find((x) => x.id === c.templateId);
  const rental = c.hire ? s.rentals.find((r) => r.id === c.hire!.rentalId) : undefined;
  const buyer = c.hire ? s.players.find((p) => p.id === c.hire!.buyerId) : undefined;
  const fc = s.fight?.order.find((x) => x.companionId === c.id);
  const hp = fc ? { cur: fc.hp, max: fc.maxHp } : c.hp;
  return (
    <li className="list-row cm-with">
      <div className="scene-row">
        <span className="row-main">
          <span className="row-title">
            {c.name}
            {c.hire ? <span className="row-aside"> · hireling{buyer ? `, hired by ${penName(buyer)}` : ""}</span> : null}
            {fc ? <span className="row-aside"> · in the fight</span> : null}
          </span>
          <span className="row-sub">
            HP {hp.cur}/{hp.max}
            {c.stay === "session" && !c.hire ? " · for this session" : c.hire ? (rental ? ` · paid through session ${rental.paidThrough}` : "") : " · until dismissed"}
            {c.purseCp ? ` · has ${formatCp(c.purseCp)}` : ""}
            {t?.offers ? ` · ${t.offers}` : ""}
          </span>
        </span>
        <label className="cm-ctl">
          Run by
          <ControllerSelect
            value={c.controllerId}
            label={`Who runs ${c.name}`}
            onChange={(v) => run({ type: "companion.update", companionId: c.id, controllerId: v }, `${controllerName({ players: s.players }, { ...c, controllerId: v })} runs ${c.name} now.`)}
          />
        </label>
        {t?.combat ? (
          <label className="check">
            <input type="checkbox" checked={!!c.follow} disabled={c.controllerId === "dm"} onChange={(e) => run({ type: "companion.update", companionId: c.id, follow: e.target.checked })} /> Right
            after them
          </label>
        ) : null}
        <RowMenu label={c.name}>
          <MenuItem onClick={() => run({ type: "companion.rest", companionId: c.id }, `${c.name} is rested: full HP, abilities back.`)}>Long rest</MenuItem>
          {!c.hire ? (
            <MenuItem onClick={() => run({ type: "companion.update", companionId: c.id, stay: c.stay === "session" ? "until" : "session" })}>
              {c.stay === "session" ? "Keep them until I dismiss them" : "Only for this session"}
            </MenuItem>
          ) : null}
          <MenuItem
            danger
            onClick={() => void ask(`${c.hire ? "Let" : "Dismiss"} ${c.name}${c.hire ? " go" : ""}?`).then((ok) => ok && run({ type: "companion.dismiss", companionId: c.id }, `${c.name} left the party.`))}
          >
            {c.hire ? "Let go" : "Dismiss"}
          </MenuItem>
        </RowMenu>
      </div>
    </li>
  );
}

function CompanionEditor({ id, draft, onDone }: { id?: string; draft: CompanionBody; onDone: () => void }) {
  const { view, run, toast } = useDm();
  const s = view.state;
  const [d, setD] = useState<CompanionBody>(() => structuredClone(draft));
  const set = <K extends keyof CompanionBody>(k: K, v: CompanionBody[K]) => setD((x) => ({ ...x, [k]: v }));
  const num = (v: string, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.round(Number(v) || 0)));
  const people = (s.entries ?? []).filter((e) => e.kind === "person");
  const portraits = s.scenes.filter((x) => x.kind === "portrait");
  const hireable = s.items.filter((it) => it.kind === "recurring" || it.kind === "purchase" || it.kind === "service");
  const linked = id ? s.items.find((it) => it.companionTemplateId === id) : undefined;
  const [itemId, setItemId] = useState(linked?.id ?? "");
  const toggleHidden = (f: CompanionField, on: boolean) => set("hidden", on ? [...d.hidden, f] : d.hidden.filter((x) => x !== f));

  const save = async () => {
    if (!d.name.trim()) return toast("Give them a name.");
    const template = { ...d, attacks: d.attacks.filter((a) => a.name.trim()), abilities: d.abilities.filter((a) => a.name.trim()) };
    const ok = id ? await run({ type: "companion.templateUpdate", templateId: id, template }, "Saved.") : await run({ type: "companion.templateAdd", template }, `${d.name.trim()} added.`);
    if (!ok) return;
    // The shop link (an existing template only: a new one has no id yet).
    if (id && itemId !== (linked?.id ?? "")) await run({ type: "companion.hireItem", templateId: id, itemId: itemId || null }, itemId ? "Buying that item hires them now." : undefined);
    onDone();
  };

  return (
    <div className="box fx-editor cm-editor">
      <div className="fx-detail-grid">
        <label>
          Name
          <input className="fld" value={d.name} maxLength={80} onChange={(e) => set("name", e.target.value)} />
        </label>
        <label className="check">
          <input type="checkbox" checked={d.combat} onChange={(e) => set("combat", e.target.checked)} /> Fights (joins the turn order)
        </label>
        <label>
          AC
          <input className="fld fx-num" inputMode="numeric" value={d.ac} onChange={(e) => set("ac", num(e.target.value, 0, 50))} />
        </label>
        <label>
          Max HP
          <input className="fld fx-num" inputMode="numeric" value={d.hp} onChange={(e) => set("hp", num(e.target.value, 1, 999))} />
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
      <label>
        What they offer (everyone sees this on the phones)
        <input className="fld" value={d.offers} maxLength={600} placeholder="Survival +5. Knows the safe paths." onChange={(e) => set("offers", e.target.value)} />
      </label>

      {d.combat ? (
        <>
          <h4>Attacks</h4>
          {d.attacks.map((a, i) => (
            <div key={i} className="fx-add-row">
              <input
                className="fld"
                aria-label="Attack name"
                placeholder="Spear"
                value={a.name}
                maxLength={80}
                onChange={(e) =>
                  set(
                    "attacks",
                    d.attacks.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)),
                  )
                }
              />
              <input
                className="fld fx-rounds"
                aria-label="To hit"
                placeholder="+3"
                value={a.bonus}
                onChange={(e) =>
                  set(
                    "attacks",
                    d.attacks.map((x, j) => (j === i ? { ...x, bonus: num(e.target.value, -10, 30) } : x)),
                  )
                }
              />
              <input
                className="fld"
                aria-label="Damage"
                placeholder="1d6 + 1"
                value={a.damage}
                maxLength={80}
                onChange={(e) =>
                  set(
                    "attacks",
                    d.attacks.map((x, j) => (j === i ? { ...x, damage: e.target.value } : x)),
                  )
                }
              />
              <button
                className="btn small"
                type="button"
                aria-label="Remove attack"
                onClick={() =>
                  set(
                    "attacks",
                    d.attacks.filter((_, j) => j !== i),
                  )
                }
              >
                ×
              </button>
            </div>
          ))}
          <button className="btn small" type="button" onClick={() => set("attacks", [...d.attacks, { name: "", bonus: 0, damage: "" }])}>
            + Attack
          </button>

          <h4>Abilities</h4>
          {d.abilities.map((a, i) => {
            const kind = a.recharge ? "recharge" : a.uses ? "uses" : "plain";
            const patch = (p: Partial<CompanionBody["abilities"][number]>) =>
              set(
                "abilities",
                d.abilities.map((x, j) => (j === i ? { ...x, ...p } : x)),
              );
            return (
              <div key={i} className="fx-ability-edit">
                <div className="fx-add-row">
                  <input className="fld" aria-label="Ability name" placeholder="Second Wind" value={a.name} maxLength={80} onChange={(e) => patch({ name: e.target.value })} />
                  <select
                    className="fld"
                    aria-label="Kind"
                    value={kind}
                    onChange={(e) => patch({ recharge: e.target.value === "recharge" ? 6 : undefined, uses: e.target.value === "uses" ? 1 : undefined })}
                  >
                    <option value="plain">Always on</option>
                    <option value="recharge">Recharge</option>
                    <option value="uses">Uses per day</option>
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
                  <button
                    className="btn small"
                    type="button"
                    aria-label="Remove ability"
                    onClick={() =>
                      set(
                        "abilities",
                        d.abilities.filter((_, j) => j !== i),
                      )
                    }
                  >
                    ×
                  </button>
                </div>
                <textarea className="fld" rows={2} aria-label="What it does" value={a.text} maxLength={600} onChange={(e) => patch({ text: e.target.value })} />
              </div>
            );
          })}
          <button className="btn small" type="button" onClick={() => set("abilities", [...d.abilities, { name: "", text: "" }])}>
            + Ability
          </button>
          <label>
            Resistances
            <input className="fld" value={d.resist} maxLength={200} onChange={(e) => set("resist", e.target.value)} />
          </label>
        </>
      ) : null}

      {d.combat ? (
        <fieldset className="cm-fields">
          <legend>The player running them sees</legend>
          {COMPANION_FIELDS.filter((f) => f !== "resist" || d.resist).map((f) => (
            <label key={f} className="check">
              <input type="checkbox" checked={!d.hidden.includes(f)} onChange={(e) => toggleHidden(f, !e.target.checked)} /> {COMPANION_FIELD_LABEL[f]}
            </label>
          ))}
          <p className="note">Your DM note and the person they&rsquo;re linked to never reach a phone.</p>
        </fieldset>
      ) : null}

      <div className="fx-detail-grid">
        {d.combat ? (
          <>
            <label>
              On the TV in fights
              <select className="fld" value={d.tvHealth} onChange={(e) => set("tvHealth", e.target.value as "hp" | "state")}>
                <option value="state">How hurt they look</option>
                <option value="hp">An HP bar</option>
              </select>
            </label>
            <label>
              At 0 HP (you can change it in the fight)
              <select className="fld" value={d.atZero} onChange={(e) => set("atZero", e.target.value as "saves" | "dies")}>
                <option value="saves">Unconscious, death saves</option>
                <option value="dies">Dies</option>
              </select>
            </label>
          </>
        ) : null}
        <label className="check">
          <input type="checkbox" checked={d.takesShare} onChange={(e) => set("takesShare", e.target.checked)} /> Takes a share of the loot
        </label>
        <label>
          They are (in Discover)
          <select className="fld" value={d.entryId ?? ""} onChange={(e) => setD((x) => ({ ...x, entryId: e.target.value || null, ...(e.target.value ? {} : { needs: null }) }))}>
            <option value="">Nobody in particular</option>
            {people.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </label>
        {d.entryId ? (
          <label>
            Only joins once
            <select className="fld" value={d.needs ?? ""} onChange={(e) => set("needs", (e.target.value || null) as CompanionBody["needs"])}>
              <option value="">Any time</option>
              <option value="friendly">Friendly</option>
              <option value="ally">An ally</option>
            </select>
          </label>
        ) : null}
        <label>
          Portrait on the TV
          <select className="fld" value={d.sceneId ?? ""} onChange={(e) => set("sceneId", e.target.value || null)}>
            <option value="">An initial</option>
            {portraits.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        {id ? (
          <label>
            Hired from the shop
            <select className="fld" value={itemId} onChange={(e) => setItemId(e.target.value)}>
              <option value="">Not for hire</option>
              {hireable.map((it) => (
                <option key={it.id} value={it.id}>
                  {it.name}
                  {it.priceCp ? ` (${formatCp(it.priceCp)})` : ""}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>
      <label>
        DM note (only you)
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
