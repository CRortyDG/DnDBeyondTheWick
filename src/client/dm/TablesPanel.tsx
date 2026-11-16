"use client";

// Random tables (DM-only): rumors, encounters, names, weather. Roll one on
// this screen; nothing here goes to the TV or a phone.

import { useState } from "react";
import { useDm } from "./context";
import { Drawer } from "./Drawer";
import { PageHead } from "./PageHead";
import { MenuItem, RowMenu } from "./RowMenu";
import { PlusIcon } from "./navIcons";
import { entriesOf } from "@/shared/discovery";
import { fightFrom } from "@/shared/generators";
import { fillRanges, kindLabel, rangeLabel, rollTable, rowsFromText, rowsToText, TABLE_DICE, TABLE_KINDS, tablesOf } from "@/shared/tables";
import type { GameState, RandomTable, TableDie, TableKind } from "@/shared/types";

interface Edit {
  id?: string;
  name: string;
  die: TableDie;
  kind: TableKind;
  rows: string;
  areas: string;
  dmNote: string;
}

const blank = (): Edit => ({
  name: "",
  die: 6,
  kind: "rumor",
  rows: "",
  areas: "",
  dmNote: "",
});
const fromTable = (t: RandomTable): Edit => ({
  id: t.id,
  name: t.name,
  die: t.die,
  kind: t.kind,
  rows: rowsToText(t.rows),
  areas: t.areas.join(", "),
  dmNote: t.dmNote,
});

/** Ready-made first tables, so a new DM sees what a table looks like. */
const EXAMPLES: { label: string; edit: Edit }[] = [
  {
    label: "Rumors (d6)",
    edit: {
      name: "Tavern rumors",
      die: 6,
      kind: "rumor",
      areas: "",
      dmNote: "",
      rows: "Someone's been rowing out to the old lighthouse after dark.\nThe miller's daughter swears she saw a wolf walk on two legs.\nA merchant is paying double for anything from the old ruins.\nThe well water tastes of copper since the last storm.\nA stranger keeps asking about a ring with a blue stone.\nThe church bell rang at midnight, and nobody was in the tower.",
    },
  },
  {
    label: "Road encounters (d8)",
    edit: {
      name: "Road encounters",
      die: 8,
      kind: "encounter",
      areas: "",
      dmNote: "Lines ending in fight: get a Start fight button when you have that monster.",
      rows: "1-2: Nothing but birdsong. Too quiet.\n3: A peddler with a lame mule asks for help.\n4: A broken cart blocks the road; its owner is nowhere to be seen.\n5: Pilgrims singing, happy to share news and bread.\n6: Fresh tracks lead off the road into the trees.\n7: Hungry wolves circle at the edge of the light. fight: Wolf x2\n8: Bandits ask politely for a road toll. fight: Bandit x3",
    },
  },
  {
    label: "Names (d10)",
    edit: {
      name: "Townsfolk names",
      die: 10,
      kind: "name",
      areas: "",
      dmNote: "",
      rows: "Brannoc Hale\nMirela Thorn\nOswin Cobb\nTansy Reed\nGarrick Dunmore\nElspeth Vane\nJory Pike\nHilde Ashby\nCorwin Marsh\nPip Tallow",
    },
  },
  {
    label: "Weather (d6)",
    edit: {
      name: "Weather",
      die: 6,
      kind: "weather",
      areas: "",
      dmNote: "",
      rows: "1-2: Clear and crisp.\n3: Grey skies, a cold wind off the water.\n4: Light rain all day.\n5: Thick fog until noon.\n6: A storm rolls in by evening.",
    },
  },
];

/** What decides when the Off-script panel rolls this table, in words. */
function usedFor(g: GameState, t: RandomTable): string | null {
  const places = entriesOf(g)
    .filter((e) => e.place?.encounters === t.id || e.place?.rumors === t.id)
    .map((e) => e.name);
  const where = [...t.areas, ...places.filter((p) => !t.areas.includes(p))];
  if (where.length) return `Rolled for ${where.join(", ")}`;
  if (t.kind === "rumor" || t.kind === "encounter") return "Rolled anywhere";
  return null;
}

export function TablesPanel() {
  const { view, run } = useDm();
  const g = view.state;
  const tables = tablesOf(g);
  const [edit, setEdit] = useState<Edit | null>(null);
  const [rolled, setRolled] = useState<Record<string, { roll: number; text: string; n: number }>>({});
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [kind, setKind] = useState<TableKind | "all">("all");

  const kindsInUse = TABLE_KINDS.filter((k) => tables.some((t) => t.kind === k.id));
  const shown = kind === "all" ? tables : tables.filter((t) => t.kind === kind);
  const reviewing = tables.filter((t) => t.review).length;

  const roll = (t: RandomTable) => {
    const r = rollTable(t);
    setRolled((x) => ({
      ...x,
      [t.id]: {
        roll: r.roll,
        text: r.row?.text ?? "",
        n: (x[t.id]?.n ?? 0) + 1,
      },
    }));
  };

  const duplicate = (t: RandomTable) => {
    const name = `${t.name} (copy)`.slice(0, 80);
    void run(
      {
        type: "table.add",
        table: {
          name,
          die: t.die,
          kind: t.kind,
          rows: t.rows,
          areas: t.areas,
          dmNote: t.dmNote,
        },
      },
      `Made "${name}".`,
    );
  };

  return (
    <div className="pg tables-panel">
      <PageHead
        title="Random tables"
        sub="Rumors, encounters, names and weather to roll on. Only you see these."
        help={
          <>
            <p>Press Roll on a table to roll it here. The Off-script panel (O in run-game mode) also rolls your rumor, encounter and name tables, picking the one for wherever the party is.</p>
            <p>An encounter line ending in &ldquo;fight: Wolf x2&rdquo; gets a Start fight button when you have a Wolf under Monsters.</p>
          </>
        }
        actions={
          <button className="btn primary" type="button" onClick={() => setEdit(blank())}>
            <PlusIcon size={16} /> Table
          </button>
        }
        stats={[
          { label: "Tables", value: tables.length, tone: "muted" },
          ...(reviewing
            ? [
                {
                  label: "Needs review",
                  value: reviewing,
                  tone: "gold" as const,
                },
              ]
            : []),
        ]}
      />

      {edit ? <TableEditor key={edit.id ?? "new"} start={edit} onDone={() => setEdit(null)} /> : null}

      {kindsInUse.length > 1 ? (
        <div className="seg rt-filter" role="group" aria-label="Show tables">
          <button type="button" className={`btn small${kind === "all" ? " on" : ""}`} aria-pressed={kind === "all"} onClick={() => setKind("all")}>
            All
          </button>
          {kindsInUse.map((k) => (
            <button key={k.id} type="button" className={`btn small${kind === k.id ? " on" : ""}`} aria-pressed={kind === k.id} onClick={() => setKind(k.id)}>
              {k.label} ({tables.filter((t) => t.kind === k.id).length})
            </button>
          ))}
        </div>
      ) : null}

      {tables.length === 0 ? (
        <div className="pg-empty rt-empty">
          <p>No tables yet. Make one with + Table, let a Worldbuilder session draft some, or start from an example:</p>
          <div className="inline">
            {EXAMPLES.map((x) => (
              <button key={x.label} className="btn small" type="button" onClick={() => setEdit({ ...x.edit })}>
                {x.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {shown.length ? (
        <ul className="row-list rt-list">
          {shown.map((t) => {
            const r = rolled[t.id];
            const isOpen = !!open[t.id];
            const used = usedFor(g, t);
            const f = r ? fightFrom(g, r.text) : null;
            return (
              <li key={t.id} className={`list-row rt-row${edit?.id === t.id ? " selected" : ""}`}>
                <div className="scene-row">
                  <button type="button" className="row-main" onClick={() => setOpen((o) => ({ ...o, [t.id]: !o[t.id] }))} aria-expanded={isOpen} title={isOpen ? "Hide the rows" : "Show the rows"}>
                    <span className="row-title">
                      <span className={`rt-caret${isOpen ? " open" : ""}`} aria-hidden="true">
                        ▸
                      </span>
                      {t.name}
                      {t.madeBy ? <span className="row-aside"> · by {t.madeBy.label}</span> : null}
                    </span>
                    <span className="row-sub">
                      d{t.die} · {kindLabel(t.kind)} · {t.rows.length} {t.rows.length === 1 ? "row" : "rows"}
                      {used ? ` · ${used}` : ""}
                    </span>
                  </button>
                  {t.review ? (
                    <span className="row-meta">
                      <span className="tag live" title="Made at the table or seeded. Keep it from Worldbuilder → Made at the table.">
                        Needs review
                      </span>
                    </span>
                  ) : null}
                  <button className="btn small" type="button" onClick={() => roll(t)}>
                    {r ? "Roll again" : "Roll"}
                  </button>
                  <RowMenu label={t.name}>
                    <MenuItem onClick={() => setEdit(fromTable(t))}>Edit</MenuItem>
                    <MenuItem onClick={() => duplicate(t)}>Duplicate</MenuItem>
                    {t.review ? <MenuItem onClick={() => run({ type: "review.done", tableId: t.id }, `${t.name} kept.`)}>Mark reviewed</MenuItem> : null}
                    <MenuItem danger onClick={() => window.confirm(`Delete "${t.name}"?`) && run({ type: "table.remove", tableId: t.id }, `${t.name} deleted.`)}>
                      Delete
                    </MenuItem>
                  </RowMenu>
                </div>
                {r ? (
                  <div className="rt-result" role="status" key={r.n}>
                    <span className="rt-result-n">{r.roll}</span>
                    <div className="rt-result-body">
                      <p>{f?.text ?? r.text}</p>
                      {f?.fight ? (
                        <div className="inline rt-fight">
                          {f.fight.groups.length ? <span className="note">Fight: {f.fight.names.join(", ")}</span> : null}
                          {f.fight.missing.length ? <span className="note">Not in your monsters yet: {f.fight.missing.join(", ")}</span> : null}
                          {f.fight.groups.length ? (
                            <button
                              className="btn small primary"
                              type="button"
                              disabled={!!g.fight}
                              title={g.fight ? "A fight is already going on." : undefined}
                              onClick={() =>
                                void run(
                                  {
                                    type: "fight.start",
                                    groups: f.fight!.groups,
                                  },
                                  "Fight set up.",
                                )
                              }
                            >
                              Start fight
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                    <button className="btn small icon-only rt-result-x" type="button" aria-label="Clear the roll" title="Clear" onClick={() => setRolled(({ [t.id]: _, ...rest }) => rest)}>
                      ×
                    </button>
                  </div>
                ) : null}
                {isOpen ? (
                  <div className="rt-body">
                    <ol className="rtable-rows">
                      {t.rows.map((row) => (
                        <li key={row.from} className={r && r.roll >= row.from && r.roll <= row.to ? "on" : undefined}>
                          <span className="rtable-range">{rangeLabel(row)}</span>
                          <span>{row.text}</span>
                        </li>
                      ))}
                    </ol>
                    {t.dmNote ? <p className="note">Note: {t.dmNote}</p> : null}
                    <button className="btn small" type="button" onClick={() => setEdit(fromTable(t))}>
                      Edit table
                    </button>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

function TableEditor({ start, onDone }: { start: Edit; onDone: () => void }) {
  const { run } = useDm();
  const [edit, setEdit] = useState<Edit>(start);
  const rows = rowsFromText(edit.rows);
  const check = rows.length ? fillRanges(edit.die, rows) : null;
  const ok = !!check && !("error" in check) && !!edit.name.trim();

  const save = async () => {
    if (!check || "error" in check) return;
    const table = {
      name: edit.name,
      die: edit.die,
      kind: edit.kind,
      rows,
      areas: edit.areas
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean),
      dmNote: edit.dmNote,
    };
    const done = await run(edit.id ? { type: "table.update", tableId: edit.id, table } : { type: "table.add", table }, edit.id ? "Table saved." : "Table added.");
    if (done) onDone();
  };

  const isBlank = !edit.id && !edit.name && !edit.rows;

  return (
    <Drawer title={edit.id ? "Edit table" : "New table"} subtitle={edit.id ? start.name : "Only you see it"} onClose={onDone} closeLabel="Cancel" wide>
      <div className="rt-editor">
        {isBlank ? (
          <div className="rt-examples">
            <span className="note">Start from an example:</span>
            {EXAMPLES.map((x) => (
              <button key={x.label} className="btn small" type="button" onClick={() => setEdit({ ...x.edit })}>
                {x.label}
              </button>
            ))}
          </div>
        ) : null}
        <label className="fld-row">
          <span>Name</span>
          <input className="fld" placeholder="Tavern rumors" maxLength={80} value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
        </label>
        <div className="rt-two">
          <label className="fld-row">
            <span>Die</span>
            <select className="fld" value={edit.die} onChange={(e) => setEdit({ ...edit, die: Number(e.target.value) as TableDie })}>
              {TABLE_DICE.map((d) => (
                <option key={d} value={d}>
                  d{d}
                </option>
              ))}
            </select>
          </label>
          <label className="fld-row">
            <span>Kind</span>
            <select className="fld" value={edit.kind} onChange={(e) => setEdit({ ...edit, kind: e.target.value as TableKind })}>
              {TABLE_KINDS.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="fld-row">
          <span>Rows, one per line</span>
          <textarea className="fld rt-rows-fld" rows={10} value={edit.rows} onChange={(e) => setEdit({ ...edit, rows: e.target.value })} placeholder={"1-2: A wolf pack, hungry\n3-5: A peddler with a lame mule\n6: Nothing. Too quiet."} />
        </label>
        <p className="note rt-hint">
          Start a line with a range, like &ldquo;1-3: A wolf pack&rdquo;, or leave the numbers off and the lines share the d{edit.die} evenly. Every number from 1 to {edit.die} needs exactly one line.
          {edit.kind === "encounter" ? " End a line with “fight: Wolf x2” to get a Start fight button." : ""}
        </p>
        {check && "error" in check ? <p className="warn">{check.error}</p> : null}
        {check && "rows" in check ? (
          <div className="rt-preview">
            <span className="note">How it rolls</span>
            <ol className="rtable-rows">
              {check.rows.map((r) => (
                <li key={r.from}>
                  <span className="rtable-range">{rangeLabel(r)}</span>
                  <span>{r.text}</span>
                </li>
              ))}
            </ol>
          </div>
        ) : null}
        {edit.kind === "rumor" || edit.kind === "encounter" ? (
          <label className="fld-row">
            <span>Where it&rsquo;s rolled</span>
            <input className="fld" placeholder="Candlefair, The Docks" value={edit.areas} onChange={(e) => setEdit({ ...edit, areas: e.target.value })} />
            <span className="note">The Off-script panel rolls this table when the party is in one of these places or areas. Leave it empty to use it anywhere.</span>
          </label>
        ) : null}
        <label className="fld-row">
          <span>Your note</span>
          <textarea className="fld" rows={2} placeholder="Anything to remember when you roll it" value={edit.dmNote} onChange={(e) => setEdit({ ...edit, dmNote: e.target.value })} />
        </label>
        <div className="inline">
          <button className="btn primary" type="button" disabled={!ok} onClick={() => void save()}>
            {edit.id ? "Save" : "Add table"}
          </button>
          <button className="btn" type="button" onClick={onDone}>
            Cancel
          </button>
          {!edit.name.trim() && rows.length ? <span className="note">Give it a name to save.</span> : null}
        </div>
      </div>
    </Drawer>
  );
}
