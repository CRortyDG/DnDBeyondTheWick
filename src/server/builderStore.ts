/**
 * Where a campaign's Worldbuilder data lives: keys, the on/off switch, drafts,
 * the audit log and per-key usage. Rows in the campaign's room, NOT in the game
 * document, so nothing here can reach a TV or phone view, a backup or a preset,
 * and builder writes never wake the table's screens.
 *
 * tbl: "key" | "set" | "draft" | "audit" | "use". tag is an indexed label
 * (a draft's status, an audit row's key id).
 */
export interface BuilderRow {
  id: string;
  at: number;
  tag: string;
  body: string;
}

export interface BuilderStore {
  get(tbl: string, id: string): Promise<BuilderRow | null>;
  put(tbl: string, row: BuilderRow): Promise<void>;
  del(tbl: string, id: string): Promise<void>;
  /** Newest first. */
  list(tbl: string, opts?: { tag?: string; limit?: number }): Promise<BuilderRow[]>;
  count(tbl: string, tag?: string): Promise<number>;
  /** Keep the newest keep rows of a table, and none older than before. */
  prune(tbl: string, keep: number, before: number): Promise<void>;
  /** Drop every row of a table. */
  clear(tbl: string): Promise<void>;
}

/** Tests only. */
export class MemoryBuilderStore implements BuilderStore {
  private rows = new Map<string, Map<string, BuilderRow>>();
  private t(tbl: string) {
    let m = this.rows.get(tbl);
    if (!m) this.rows.set(tbl, (m = new Map()));
    return m;
  }
  async get(tbl: string, id: string) {
    const r = this.t(tbl).get(id);
    return r ? { ...r } : null;
  }
  async put(tbl: string, row: BuilderRow) {
    this.t(tbl).set(row.id, { ...row });
  }
  async del(tbl: string, id: string) {
    this.t(tbl).delete(id);
  }
  async list(tbl: string, opts: { tag?: string; limit?: number } = {}) {
    const all = [...this.t(tbl).values()].filter((r) => opts.tag === undefined || r.tag === opts.tag).sort((a, b) => b.at - a.at || (a.id < b.id ? 1 : -1));
    return all.slice(0, opts.limit ?? all.length).map((r) => ({ ...r }));
  }
  async count(tbl: string, tag?: string) {
    return [...this.t(tbl).values()].filter((r) => tag === undefined || r.tag === tag).length;
  }
  async prune(tbl: string, keep: number, before: number) {
    const sorted = await this.list(tbl);
    for (const [i, r] of sorted.entries()) if (i >= keep || r.at < before) this.t(tbl).delete(r.id);
  }
  async clear(tbl: string) {
    this.t(tbl).clear();
  }
  /** Tests: every row, to look for secrets. */
  dump(): string {
    return JSON.stringify([...this.rows.entries()].map(([k, m]) => [k, [...m.values()]]));
  }
}
