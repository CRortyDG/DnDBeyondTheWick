// Random tables: DM-only lists to roll on (rumors, encounters, names, weather).
// Never sent to the TV or a phone. The DM rolls them on the Tables page.

import type { GameState, RandomTable, TableDie, TableKind, TableRow } from "./types";

export const TABLE_DICE = [4, 6, 8, 10, 12, 20, 100] as const satisfies readonly TableDie[];
export const TABLE_KINDS: { id: TableKind; label: string }[] = [
  { id: "rumor", label: "Rumors" },
  { id: "encounter", label: "Encounters" },
  { id: "name", label: "Names" },
  { id: "weather", label: "Weather" },
  { id: "other", label: "Other" },
];
export const TABLE_KIND_IDS = TABLE_KINDS.map((k) => k.id) as [TableKind, ...TableKind[]];

export const TABLES_MAX = 100;
export const TABLE_ROWS_MAX = 100;
export const TABLE_NAME_MAX = 80;
export const TABLE_ROW_MAX = 300;

export function tablesOf(g: Pick<GameState, "tables">): RandomTable[] {
  return g.tables ?? [];
}

export function kindLabel(k: TableKind): string {
  return TABLE_KINDS.find((x) => x.id === k)?.label ?? "Other";
}

/**
 * Rows as given, or (when none has a range) one row per number when there are
 * exactly as many rows as faces, or spread as evenly as the die allows.
 * Returns the rows with from/to set, or an error.
 */
export function fillRanges(die: TableDie, rows: { from?: number; to?: number; text: string }[]): { rows: TableRow[] } | { error: string } {
  if (rows.length === 0) return { error: "A table needs at least one row." };
  if (rows.length > Math.min(die, TABLE_ROWS_MAX)) return { error: `A d${die} table has at most ${Math.min(die, TABLE_ROWS_MAX)} rows.` };
  const ranged = rows.filter((r) => r.from !== undefined || r.to !== undefined);
  if (ranged.length === 0) {
    // Spread n rows over the die: the first rows get the extra numbers.
    const n = rows.length;
    const base = Math.floor(die / n);
    let extra = die % n;
    let at = 1;
    return {
      rows: rows.map((r) => {
        const w = base + (extra-- > 0 ? 1 : 0);
        const row = { from: at, to: at + w - 1, text: r.text };
        at += w;
        return row;
      }),
    };
  }
  if (ranged.length !== rows.length) return { error: "Give every row a range, or none of them." };
  const out = rows.map((r) => ({ from: r.from ?? r.to!, to: r.to ?? r.from!, text: r.text }));
  const problem = coverageProblem(die, out);
  return problem ? { error: problem } : { rows: [...out].sort((a, b) => a.from - b.from) };
}

/** Every number from 1 to the die in exactly one row, or what's wrong. */
export function coverageProblem(die: TableDie, rows: TableRow[]): string | null {
  const seen = new Array<number>(die + 1).fill(0);
  for (const r of rows) {
    if (!Number.isInteger(r.from) || !Number.isInteger(r.to) || r.from < 1 || r.to > die || r.from > r.to) return `Row "${short(r.text)}" needs a range inside 1-${die}.`;
    for (let i = r.from; i <= r.to; i++) seen[i] += 1;
  }
  const twice = seen.findIndex((c, i) => i > 0 && c > 1);
  if (twice > 0) return `${twice} is in more than one row.`;
  const missing = seen.findIndex((c, i) => i > 0 && c === 0);
  if (missing > 0) return `No row covers ${missing}.`;
  return null;
}

const short = (t: string) => (t.length > 30 ? t.slice(0, 29) + "\u2026" : t);

/** "1-3" or "7". */
export function rangeLabel(r: Pick<TableRow, "from" | "to">): string {
  return r.from === r.to ? String(r.from) : `${r.from}\u2013${r.to}`;
}

export function rollTable(t: RandomTable, rand: () => number = Math.random): { roll: number; row: TableRow | undefined } {
  const roll = 1 + Math.floor(rand() * t.die);
  return { roll, row: t.rows.find((r) => roll >= r.from && roll <= r.to) };
}

/** Edit text: one row per line, "1-3: text" or just "text". */
export function rowsToText(rows: TableRow[]): string {
  return rows.map((r) => `${rangeLabel(r).replace("\u2013", "-")}: ${r.text}`).join("\n");
}

export function rowsFromText(text: string): { from?: number; to?: number; text: string }[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const m = /^(\d{1,3})(?:\s*[-\u2013]\s*(\d{1,3}))?\s*[:.)]\s*(.*)$/.exec(l);
      if (!m) return { text: l };
      return { from: Number(m[1]), to: Number(m[2] ?? m[1]), text: m[3].trim() };
    });
}
