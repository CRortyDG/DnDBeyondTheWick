"use client";

// Random tables (DM-only): rumors, encounters, names, weather. Roll one on
// this screen; nothing here goes to the TV or a phone.

import { useState } from "react";
import { useDm } from "./context";
import { PageHead } from "./PageHead";
import { PlusIcon } from "./navIcons";
import { fillRanges, kindLabel, rangeLabel, rollTable, rowsFromText, rowsToText, TABLE_DICE, TABLE_KINDS, tablesOf } from "@/shared/tables";
import type { RandomTable, TableDie, TableKind } from "@/shared/types";

interface Edit {
  id?: string;
  name: string;
  die: TableDie;
  kind: TableKind;
  rows: string;
  areas: string;
  dmNote: string;
}

const blank = (): Edit => ({ name: "", die: 6, kind: "rumor", rows: "", areas: "", dmNote: "" });
const fromTable = (t: RandomTable): Edit => ({ id: t.id, name: t.name, die: t.die, kind: t.kind, rows: rowsToText(t.rows), areas: t.areas.join(", "), dmNote: t.dmNote });

export function TablesPanel() {
  const { view, run } = useDm();
  const tables = tablesOf(view.state);
  const [edit, setEdit] = useState<Edit | null>(null);
  const [rolled, setRolled] = useState<Record<string, { roll: number; text: string }>>({});

  const rows = edit ? rowsFromText(edit.rows) : [];
  const check = edit ? (rows.length ? fillRanges(edit.die, rows) : { error: "Add a row per line." }) : null;

  const save = async () => {
    if (!edit || !check || "error" in check) return;
    const table = { name: edit.name, die: edit.die, kind: edit.kind, rows, areas: edit.areas.split(",").map((a) => a.trim()).filter(Boolean), dmNote: edit.dmNote };
    const ok = await run(edit.id ? { type: "table.update", tableId: edit.id, table } : { type: "table.add", table }, edit.id ? "Table saved." : "Table added.");
    if (ok) setEdit(null);
  };

  const roll = (t: RandomTable) => {
    const r = rollTable(t);
    setRolled((x) => ({ ...x, [t.id]: { roll: r.roll, text: r.row?.text ?? "" } }));
  };

  return (
    <div className="pg tables-panel">
      <PageHead
        title="Random tables"
        sub="Rumors, encounters, names and weather to roll on. Only you see these."
        help={<p>Write one row per line. Start a line with a range (&ldquo;1-3: A wolf pack&rdquo;) or leave ranges off and the rows are spread evenly over the die. Every number on the die needs exactly one row.</p>}
        actions={
          <button className="btn primary" type="button" onClick={() => setEdit(blank())}>
            <PlusIcon size={16} /> Table
          </button>
        }
        stats={[{ label: "Tables", value: tables.length, tone: "muted" }]}
      />

      {edit ? (
        <section className="box form">
          <h3>{edit.id ? "Edit table" : "New table"}</h3>
          <div className="inline">
            <input className="fld" placeholder="Name" maxLength={80} value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} aria-label="Name" />
            <select className="fld" value={edit.die} onChange={(e) => setEdit({ ...edit, die: Number(e.target.value) as TableDie })} aria-label="Die">
              {TABLE_DICE.map((d) => (
                <option key={d} value={d}>
                  d{d}
                </option>
              ))}
            </select>
            <select className="fld" value={edit.kind} onChange={(e) => setEdit({ ...edit, kind: e.target.value as TableKind })} aria-label="Kind">
              {TABLE_KINDS.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.label}
                </option>
              ))}
            </select>
          </div>
          <label className="fld-row">
            <span>Rows, one per line</span>
            <textarea className="fld" rows={8} value={edit.rows} onChange={(e) => setEdit({ ...edit, rows: e.target.value })} placeholder={"1-2: A wolf pack, hungry\n3-5: A peddler with a lame mule\n6: Nothing. Too quiet."} />
          </label>
          {check && "error" in check ? <p className="warn">{check.error}</p> : null}
          <input className="fld" placeholder="Areas, comma separated" value={edit.areas} onChange={(e) => setEdit({ ...edit, areas: e.target.value })} aria-label="Areas" />
          <textarea className="fld" rows={2} placeholder="DM note" value={edit.dmNote} onChange={(e) => setEdit({ ...edit, dmNote: e.target.value })} aria-label="DM note" />
          <div className="inline">
            <button className="btn primary" type="button" disabled={!edit.name.trim() || !check || "error" in check} onClick={() => void save()}>
              Save
            </button>
            <button className="btn" type="button" onClick={() => setEdit(null)}>
              Cancel
            </button>
          </div>
        </section>
      ) : null}

      {tables.length === 0 && !edit ? <p className="note">No tables yet. Make one here, or let a Worldbuilder session draft some.</p> : null}
      {tables.map((t) => (
        <section key={t.id} className="box rtable">
          <div className="inline">
            <h3>
              {t.name} <span className="tag">d{t.die}</span> <span className="tag">{kindLabel(t.kind)}</span>
              {t.madeBy ? <span className="note"> by {t.madeBy.label}</span> : null}
            </h3>
            <span className="spacer" />
            <button className="btn small primary" type="button" onClick={() => roll(t)}>
              Roll
            </button>
            <button className="btn small" type="button" onClick={() => setEdit(fromTable(t))}>
              Edit
            </button>
            <button
              className="btn small"
              type="button"
              onClick={() => {
                if (confirm(`Delete "${t.name}"?`)) void run({ type: "table.remove", tableId: t.id });
              }}
            >
              Delete
            </button>
          </div>
          {rolled[t.id] ? (
            <p className="rtable-roll" role="status">
              <b>{rolled[t.id].roll}</b>: {rolled[t.id].text}
            </p>
          ) : null}
          <ol className="rtable-rows">
            {t.rows.map((r) => (
              <li key={r.from} className={rolled[t.id] && rolled[t.id].roll >= r.from && rolled[t.id].roll <= r.to ? "on" : undefined}>
                <span className="rtable-range">{rangeLabel(r)}</span> {r.text}
              </li>
            ))}
          </ol>
          {t.areas.length ? <p className="note">{t.areas.join(", ")}</p> : null}
          {t.dmNote ? <p className="note">{t.dmNote}</p> : null}
        </section>
      ))}
    </div>
  );
}
