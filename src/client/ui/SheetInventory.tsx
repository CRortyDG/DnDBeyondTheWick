"use client";

import { useEffect, useMemo, useState } from "react";
import type { CharacterSheet, SheetPatch } from "@/shared/sheet";
import { ARMOR_DEX, ATTUNE_MAX, attunedCount, ITEM_KIND_NAME, ITEM_KINDS, ITEM_NAME_MAX, ITEM_NOTE_MAX, ITEMS_MAX, itemActive, QTY_MAX, totalWeight, type SheetItem } from "@/shared/sheetGear";
import type { SheetAct } from "@/shared/sheetMagic";

/** One SRD 5.2 equipment or magic item, as client/srd/equipment.json keeps it. */
export interface SrdGear {
  i: string;
  n: string;
  g: "weapon" | "armor" | "shield" | "gear" | "tool" | "magic";
  c?: string;
  w?: number;
  x?: string;
  wd?: { n?: number; s?: 4 | 6 | 8 | 10 | 12; t?: string; f?: 1; r?: 1 };
  p?: string[];
  ms?: string;
  ac?: { b: number; d: "full" | "max2" | "none" };
  sd?: 1;
  sm?: number;
  ry?: string;
  at?: 1;
  cat?: string;
}

let gearCache: SrdGear[] | null = null;
let gearLoading: Promise<SrdGear[]> | null = null;
/** The SRD equipment and magic items with their text: loaded the first time someone needs it. */
function useSrdGear(want = true): SrdGear[] | null {
  const [list, setList] = useState<SrdGear[] | null>(gearCache);
  useEffect(() => {
    if (!want || gearCache) return;
    gearLoading ??= import("../srd/equipment.json").then((m) => (gearCache = m.default as SrdGear[]));
    let live = true;
    void gearLoading.then((l) => live && setList(l));
    return () => {
      live = false;
    };
  }, [want]);
  return list;
}

const newId = () => Math.random().toString(36).slice(2, 10);

export function itemFromSrd(o: SrdGear): SheetItem {
  const it: SheetItem = { id: newId(), name: o.n.slice(0, ITEM_NAME_MAX), qty: 1, kind: "gear", srd: o.i };
  if (o.w) it.weight = o.w;
  if (o.g === "weapon") {
    it.kind = "weapon";
    if (o.wd?.n && o.wd.s) {
      it.count = o.wd.n;
      it.sides = o.wd.s;
    }
    if (o.wd?.t) it.dtype = o.wd.t;
    if (o.wd?.f) it.finesse = true;
    if (o.wd?.r) it.ranged = true;
  } else if (o.g === "armor" || o.g === "shield") {
    it.kind = o.g;
    it.armorBase = o.ac?.b ?? (o.g === "shield" ? 2 : 10);
    if (o.g === "armor") it.armorDex = o.ac?.d ?? "full";
  } else if (o.g === "magic") {
    it.kind = "magic";
    if (o.at) it.attune = true;
  }
  return it;
}

const DEX_NAME = { full: "+ Dex", max2: "+ Dex (max 2)", none: "" } as const;

function itemLine(it: SheetItem): string {
  const bits: string[] = [];
  if (it.kind === "weapon" && it.count && it.sides) bits.push(`${it.count}d${it.sides}${it.bonus ? ` +${it.bonus}` : ""}${it.dtype ? ` ${it.dtype}` : ""}`);
  if (it.kind === "armor" && it.armorBase) bits.push(`AC ${it.armorBase}${it.armorDex ? ` ${DEX_NAME[it.armorDex]}` : ""}`.trim());
  if (it.kind === "shield") bits.push(`+${it.armorBase ?? 2} AC`);
  if (it.acPlus) bits.push(`+${it.acPlus} AC`);
  if (it.attune) bits.push(it.attuned ? "attuned" : "needs attuning");
  return bits.join(" · ");
}

/**
 * The inventory: worn and wielded first, then everything carried. Equip armor or
 * a shield and AC follows; equip a weapon and it's an attack.
 */
export function InventoryBlock({
  sheet,
  editing,
  send,
  act,
  giveTo,
  onGive,
}: {
  sheet: CharacterSheet;
  editing: boolean;
  send: (p: SheetPatch) => Promise<boolean>;
  act: (a: SheetAct) => Promise<boolean>;
  /** Players who can receive (the phone). */
  giveTo?: { id: string; name: string }[];
  onGive?: (itemId: string, toPlayerId: string, qty: number) => Promise<boolean>;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const list = sheet.items ?? [];
  const save = (next: SheetItem[]) => send({ items: next });
  const worn = list.filter((x) => x.equipped);
  const carried = list.filter((x) => !x.equipped);
  const att = attunedCount(sheet);
  const wt = totalWeight(sheet);
  const row = (it: SheetItem) =>
    editing ? (
      <li key={it.id} className="cs-spell-edit">
        <ItemCard it={it} onSave={(x) => save(list.map((y) => (y.id === it.id ? x : y)))} onRemove={() => save(list.filter((y) => y.id !== it.id))} />
      </li>
    ) : (
      <ItemRow key={it.id} it={it} open={open === it.id} onOpen={() => setOpen(open === it.id ? null : it.id)} act={act} canAttune={att < ATTUNE_MAX} giveTo={giveTo} onGive={onGive} />
    );
  return (
    <section className="cs-block cs-inv" aria-label="Inventory">
      <h3 className="cs-h">Inventory</h3>
      {list.length ? (
        <p className="note cs-prep-count">
          {list.length} {list.length === 1 ? "thing" : "things"}
          {wt ? ` · ${wt} lb` : ""}
          {list.some((x) => x.attune) ? ` · attuned ${att} of ${ATTUNE_MAX}` : ""}
        </p>
      ) : (
        <p className="note">Nothing yet. What you buy in the shops lands here, or add things from the SRD list.</p>
      )}
      {worn.length ? (
        <div className="cs-spell-group">
          <div className="cs-spell-lv">Worn and wielded</div>
          <ul className="cs-list">{worn.map(row)}</ul>
        </div>
      ) : null}
      {carried.length ? (
        <div className="cs-spell-group">
          <div className="cs-spell-lv">{worn.length ? "Carried" : "Carried (tap Equip to wear or wield)"}</div>
          <ul className="cs-list">{carried.map(row)}</ul>
        </div>
      ) : null}
      <div className="cs-spell-adds">
        {list.length < ITEMS_MAX ? (
          <button type="button" className="btn small" onClick={() => setPicking(true)}>
            + Add items
          </button>
        ) : null}
        {editing && list.length < ITEMS_MAX ? (
          <button type="button" className="btn small" onClick={() => void save([...list, { id: newId(), name: "New item", qty: 1, kind: "gear" }])}>
            + Type in my own
          </button>
        ) : null}
      </div>
      {picking ? <GearPicker sheet={sheet} onClose={() => setPicking(false)} onAdd={(it) => save([...(sheet.items ?? []), it])} /> : null}
    </section>
  );
}

function ItemRow({
  it,
  open,
  onOpen,
  act,
  canAttune,
  giveTo,
  onGive,
}: {
  it: SheetItem;
  open: boolean;
  onOpen: () => void;
  act: (a: SheetAct) => Promise<boolean>;
  canAttune: boolean;
  giveTo?: { id: string; name: string }[];
  onGive?: (itemId: string, toPlayerId: string, qty: number) => Promise<boolean>;
}) {
  const all = useSrdGear(open && !!it.srd);
  const o = it.srd ? all?.find((x) => x.i === it.srd) : undefined;
  const wearable = it.kind !== "gear";
  const line = itemLine(it);
  const [to, setTo] = useState("");
  const [n, setN] = useState(1);
  return (
    <li className={`cs-spell cs-item${open ? " open" : ""}${it.equipped && !itemActive(it) ? " unprep" : ""}`}>
      <button type="button" className="cs-row-tap" aria-expanded={open} onClick={onOpen}>
        <span className="cs-name">
          {it.name}
          {it.qty > 1 ? <span className="cs-qty"> ×{it.qty}</span> : null}
        </span>
        <span className="cs-spell-sum">{line}</span>
      </button>
      {open ? (
        <div className="cs-spell-detail">
          {o ? (
            <p className="cs-spell-meta">
              {[o.cat ?? ITEM_KIND_NAME[it.kind], o.ry, o.c, o.w ? `${o.w} lb` : "", o.p?.join(", "), o.ms ? `Mastery: ${o.ms}` : "", o.sd ? "Stealth disadvantage" : "", o.sm ? `Str ${o.sm} needed` : ""].filter(Boolean).join(" · ")}
            </p>
          ) : it.srd && !all ? (
            <p className="note">Loading&hellip;</p>
          ) : null}
          {o?.x ? <div className="cs-prose cs-spell-text">{o.x.replace(/\*\*/g, "")}</div> : null}
          {it.note ? <div className="cs-prose cs-spell-text">{it.note}</div> : null}
          <div className="cs-spell-acts">
            {wearable ? (
              <button type="button" className={`btn small${it.equipped ? " on" : " primary"}`} onClick={() => void act({ k: "equip", itemId: it.id, on: !it.equipped })}>
                {it.equipped ? (it.kind === "weapon" ? "Put away" : "Take off") : it.kind === "weapon" ? "Wield" : it.kind === "magic" ? "Equip" : "Wear"}
              </button>
            ) : null}
            {it.attune ? (
              <button type="button" className={`btn small${it.attuned ? " on" : ""}`} disabled={!it.attuned && !canAttune} title={!it.attuned && !canAttune ? `Attuned to ${ATTUNE_MAX} already` : undefined} onClick={() => void act({ k: "attune", itemId: it.id, on: !it.attuned })}>
                {it.attuned ? "End attunement" : "Attune"}
              </button>
            ) : null}
            <button type="button" className="btn small" onClick={() => void act({ k: "qty", itemId: it.id, delta: -1 })}>
              {it.qty > 1 ? "Use one" : "Used up"}
            </button>
            <button type="button" className="btn small" aria-label={`One more ${it.name}`} onClick={() => void act({ k: "qty", itemId: it.id, delta: 1 })}>
              +1
            </button>
          </div>
          {giveTo?.length && onGive ? (
            <div className="cs-give">
              <select className="fld" value={to} onChange={(e) => setTo(e.target.value)} aria-label="Give to">
                <option value="">Give to&hellip;</option>
                {giveTo.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              {it.qty > 1 ? <input className="fld cs-give-n" inputMode="numeric" aria-label="How many" value={String(n)} onChange={(e) => setN(Math.min(it.qty, Math.max(1, Math.round(Number(e.target.value)) || 1)))} /> : null}
              <button type="button" className="btn small" disabled={!to} onClick={() => void onGive(it.id, to, Math.min(n, it.qty)).then((ok) => ok && setTo(""))}>
                Give
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

function ItemCard({ it, onSave, onRemove }: { it: SheetItem; onSave: (x: SheetItem) => Promise<boolean>; onRemove: () => void }) {
  const [d, setD] = useState(it);
  useEffect(() => setD(it), [it]);
  const commit = (next: SheetItem) => {
    setD(next);
    if (JSON.stringify(next) !== JSON.stringify(it)) void onSave(next);
  };
  const int = (v: string, lo: number, hi: number) => {
    const n = Math.round(Number(v.replace("−", "-")));
    return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : 0;
  };
  const setKind = (kind: SheetItem["kind"]) => {
    const next: SheetItem = { ...d, kind };
    if (kind === "armor") {
      next.armorBase ??= 11;
      next.armorDex ??= "full";
    }
    if (kind === "shield") next.armorBase ??= 2;
    if (kind === "weapon" && !next.count) {
      next.count = 1;
      next.sides = 6;
    }
    commit(next);
  };
  return (
    <div className="cs-atk-card">
      <div className="cs-atk-row">
        <label className="cs-field cs-grow">
          <span>Name</span>
          <input className="fld" value={d.name} maxLength={ITEM_NAME_MAX} onChange={(e) => setD({ ...d, name: e.target.value })} onBlur={() => commit(d)} />
        </label>
        <label className="cs-field cs-small">
          <span>How many</span>
          <input className="fld" inputMode="numeric" value={String(d.qty)} onChange={(e) => setD({ ...d, qty: int(e.target.value, 1, QTY_MAX) })} onBlur={() => commit(d)} />
        </label>
      </div>
      <div className="cs-atk-row">
        <label className="cs-field">
          <span>Kind</span>
          <select className="fld" value={d.kind} onChange={(e) => setKind(e.target.value as SheetItem["kind"])}>
            {ITEM_KINDS.map((k) => (
              <option key={k} value={k}>
                {ITEM_KIND_NAME[k]}
              </option>
            ))}
          </select>
        </label>
        <label className="cs-field cs-small">
          <span>Weight (lb)</span>
          <input className="fld" inputMode="decimal" value={d.weight ? String(d.weight) : ""} placeholder="0" onChange={(e) => setD({ ...d, weight: Math.min(2000, Math.max(0, Number(e.target.value) || 0)) || undefined })} onBlur={() => commit(d)} />
        </label>
        {d.kind === "armor" || d.kind === "shield" ? (
          <label className="cs-field cs-small">
            <span>{d.kind === "shield" ? "AC bonus" : "Base AC"}</span>
            <input className="fld" inputMode="numeric" value={String(d.armorBase ?? "")} onChange={(e) => setD({ ...d, armorBase: int(e.target.value, 0, 30) })} onBlur={() => commit(d)} />
          </label>
        ) : null}
        {d.kind === "armor" ? (
          <label className="cs-field">
            <span>Dexterity</span>
            <select className="fld" value={d.armorDex ?? "full"} onChange={(e) => commit({ ...d, armorDex: e.target.value as SheetItem["armorDex"] })}>
              {ARMOR_DEX.map((x) => (
                <option key={x} value={x}>
                  {x === "full" ? "Adds Dex (light)" : x === "max2" ? "Dex, max 2 (medium)" : "No Dex (heavy)"}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>
      {d.kind === "weapon" ? (
        <div className="cs-atk-row">
          <label className="cs-field cs-small">
            <span>Dice</span>
            <input className="fld" inputMode="numeric" value={d.count ? String(d.count) : ""} placeholder="0" onChange={(e) => setD({ ...d, count: int(e.target.value, 0, 10) || undefined, sides: d.sides ?? 6 })} onBlur={() => commit(d)} />
          </label>
          <label className="cs-field cs-small">
            <span>Die</span>
            <select className="fld" value={d.sides ?? 6} onChange={(e) => commit({ ...d, sides: Number(e.target.value) as SheetItem["sides"] })}>
              {[4, 6, 8, 10, 12].map((x) => (
                <option key={x} value={x}>
                  d{x}
                </option>
              ))}
            </select>
          </label>
          <label className="cs-field cs-grow">
            <span>Damage type</span>
            <input className="fld" value={d.dtype ?? ""} maxLength={20} placeholder="slashing" onChange={(e) => setD({ ...d, dtype: e.target.value })} onBlur={() => commit(d)} />
          </label>
          <label className="cs-field cs-small">
            <span>Magic +</span>
            <input className="fld" inputMode="numeric" value={d.bonus ? String(d.bonus) : ""} placeholder="0" onChange={(e) => setD({ ...d, bonus: int(e.target.value, -5, 5) || undefined })} onBlur={() => commit(d)} />
          </label>
        </div>
      ) : null}
      <div className="cs-atk-row cs-atk-checks">
        {d.kind === "weapon" ? (
          <>
            <label className="check">
              <input type="checkbox" checked={!!d.finesse} onChange={(e) => commit({ ...d, finesse: e.target.checked || undefined })} /> Finesse
            </label>
            <label className="check">
              <input type="checkbox" checked={!!d.ranged} onChange={(e) => commit({ ...d, ranged: e.target.checked || undefined })} /> Ranged
            </label>
            <label className="check">
              <input type="checkbox" checked={!d.noProf} onChange={(e) => commit({ ...d, noProf: !e.target.checked || undefined })} /> Proficient
            </label>
          </>
        ) : null}
        <label className="check">
          <input type="checkbox" checked={!!d.attune} onChange={(e) => commit({ ...d, attune: e.target.checked || undefined, attuned: e.target.checked ? d.attuned : undefined })} /> Needs attuning
        </label>
        <label className="cs-field cs-small cs-inline">
          <span>+AC worn</span>
          <input className="fld" inputMode="numeric" value={d.acPlus ? String(d.acPlus) : ""} placeholder="0" onChange={(e) => setD({ ...d, acPlus: int(e.target.value, -5, 10) || undefined })} onBlur={() => commit(d)} />
        </label>
      </div>
      <label className="cs-field">
        <span>Note</span>
        <textarea className="fld" rows={2} maxLength={ITEM_NOTE_MAX} value={d.note ?? ""} placeholder="Where it came from, charges, what it does" onChange={(e) => setD({ ...d, note: e.target.value })} onBlur={() => commit(d)} />
      </label>
      <div className="cs-atk-row">
        <span className="cs-atk-sum">{d.from ? "Bought in a shop" : d.srd ? "From the SRD" : "Your own"}</span>
        <button type="button" className="btn small" onClick={onRemove}>
          Remove
        </button>
      </div>
    </div>
  );
}

const GROUPS = [
  { id: "", name: "All" },
  { id: "weapon", name: "Weapons" },
  { id: "armor", name: "Armor" },
  { id: "gear", name: "Gear" },
  { id: "tool", name: "Tools" },
  { id: "magic", name: "Magic items" },
] as const;

/** The SRD equipment and magic items: search, filter, Add. */
function GearPicker({ sheet, onClose, onAdd }: { sheet: CharacterSheet; onClose: () => void; onAdd: (it: SheetItem) => Promise<boolean> }) {
  const all = useSrdGear();
  const [q, setQ] = useState("");
  const [g, setG] = useState<string>("");
  const [open, setOpen] = useState<string | null>(null);
  const [added, setAdded] = useState<Record<string, number>>({});
  const full = (sheet.items ?? []).length >= ITEMS_MAX;
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  const shown = useMemo(() => {
    if (!all) return [];
    const t = q.trim().toLowerCase();
    return all.filter((o) => (!g || o.g === g || (g === "armor" && o.g === "shield")) && (!t || o.n.toLowerCase().includes(t))).slice(0, 200);
  }, [all, q, g]);
  return (
    <div className="cs-picker" role="dialog" aria-modal="true" aria-label="Add items">
      <div className="cs-picker-in">
        <div className="cs-picker-head">
          <h3>Add items</h3>
          <button type="button" className="btn small primary" onClick={onClose}>
            Done
          </button>
        </div>
        <input className="fld" type="search" placeholder="Search weapons, armor, gear, magic items" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search items" autoFocus />
        <div className="cs-lv-chips" role="group" aria-label="Kind">
          {GROUPS.map((x) => (
            <button key={x.id || "all"} type="button" className={`cs-chip${g === x.id ? " sel" : ""}`} aria-pressed={g === x.id} onClick={() => setG(x.id)}>
              {x.name}
            </button>
          ))}
        </div>
        {!all ? <p className="note">Loading the list&hellip;</p> : null}
        <ul className="cs-list cs-picker-list">
          {shown.map((o) => (
            <li key={o.i} className={open === o.i ? "open" : undefined}>
              <button type="button" className="cs-row-tap" aria-expanded={open === o.i} onClick={() => setOpen(open === o.i ? null : o.i)}>
                <span className="cs-name">
                  {o.n}
                  {o.at ? <span className="cs-tag">A</span> : null}
                </span>
                <span className="cs-spell-sum">{o.g === "magic" ? o.ry : o.wd?.n ? `${o.wd.n}d${o.wd.s}` : o.ac ? (o.g === "shield" ? `+${o.ac.b} AC` : `AC ${o.ac.b}`) : o.c}</span>
              </button>
              <button
                type="button"
                className={`btn small${added[o.i] ? " on" : ""}`}
                disabled={full}
                onClick={() => void onAdd(itemFromSrd(o)).then((ok) => ok && setAdded((a) => ({ ...a, [o.i]: (a[o.i] ?? 0) + 1 })))}
                aria-label={`Add ${o.n}`}
              >
                {added[o.i] ? `Added ×${added[o.i]}` : "Add"}
              </button>
              {open === o.i ? (
                <div className="cs-spell-detail">
                  <p className="cs-spell-meta">{[o.cat ?? o.g, o.ry, o.c, o.w ? `${o.w} lb` : "", o.p?.join(", "), o.at ? "Requires attunement" : ""].filter(Boolean).join(" · ")}</p>
                  {o.x ? <div className="cs-prose cs-spell-text">{o.x.replace(/\*\*/g, "")}</div> : null}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
        {all && !shown.length ? <p className="note">Nothing matches. Close this and use &ldquo;Type in my own&rdquo;.</p> : null}
        <p className="note cs-credit">Equipment and magic items from the free D&amp;D System Reference Document 5.2 by Wizards of the Coast (CC-BY-4.0).</p>
      </div>
    </div>
  );
}
