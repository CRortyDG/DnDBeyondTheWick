import { DurableObject } from "cloudflare:workers";
import { sha256 } from "@/server/auth";
import type { Registry as RegistryApi } from "@/server/admin";
import type { AdminTag, FoundBy, ListedRow, RegistryRow } from "@/shared/admin";
import type { Env } from "./env";

/**
 * The list of campaign codes, for the admin console. Durable Objects can't be
 * listed by name, so each new campaign adds itself here (one small write when
 * it's created). Older campaigns are added by the console's scans. One object
 * for the whole site, named "admin:registry" (no campaign code has a colon).
 */
export class Registry extends DurableObject<Env> implements RegistryApi {
  private sql: SqlStorage;
  private salt: string;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.sql.exec(
      `CREATE TABLE IF NOT EXISTS campaigns (code TEXT PRIMARY KEY, added_at INTEGER NOT NULL, found_by TEXT NOT NULL, origin TEXT, country TEXT, net TEXT, tag TEXT, note TEXT);
       CREATE TABLE IF NOT EXISTS meta (k TEXT PRIMARY KEY, v TEXT NOT NULL);`,
    );
    const row = this.sql.exec<{ v: string }>("SELECT v FROM meta WHERE k = 'salt'").toArray()[0];
    if (row) this.salt = row.v;
    else {
      const b = new Uint8Array(24);
      crypto.getRandomValues(b);
      this.salt = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
      this.sql.exec("INSERT INTO meta (k, v) VALUES ('salt', ?)", this.salt);
    }
  }

  /** The address, hashed with this registry's own salt: it can be compared here and nowhere else. */
  private net(ip: string): string {
    return sha256(`${this.salt}:${ip}`).slice(0, 20);
  }

  /** A new campaign. */
  async created(code: string, from: string, country: string | undefined, ip: string, at: number) {
    this.sql.exec(
      "INSERT OR IGNORE INTO campaigns (code, added_at, found_by, origin, country, net) VALUES (?, ?, 'create', ?, ?, ?)",
      code,
      at,
      from.slice(0, 40),
      country?.slice(0, 4) ?? null,
      ip === "local" ? null : this.net(ip),
    );
  }

  async add(rows: Omit<RegistryRow, "addedAt">[], at: number): Promise<number> {
    let n = 0;
    for (const r of rows) {
      const c = this.sql.exec("INSERT OR IGNORE INTO campaigns (code, added_at, found_by) VALUES (?, ?, ?)", r.code.slice(0, 40), at, r.foundBy);
      n += c.rowsWritten > 0 ? 1 : 0;
    }
    return n;
  }

  async list(ip: string): Promise<ListedRow[]> {
    const here = ip === "local" ? null : this.net(ip);
    type Row = { code: string; added_at: number; found_by: string; origin: string | null; country: string | null; net: string | null; tag: string | null; note: string | null };
    return this.sql
      .exec<Row>("SELECT * FROM campaigns ORDER BY added_at DESC LIMIT 5000")
      .toArray()
      .map((r) => ({
        code: r.code,
        addedAt: r.added_at,
        foundBy: r.found_by as FoundBy,
        ...(r.origin ? { from: r.origin } : {}),
        ...(r.country ? { country: r.country } : {}),
        tag: (r.tag as AdminTag | null) ?? null,
        ...(r.note ? { note: r.note } : {}),
        sameNetwork: !!here && r.net === here,
      }));
  }

  async label(code: string, tag: AdminTag | null, note: string | undefined): Promise<boolean> {
    const c =
      note === undefined
        ? this.sql.exec("UPDATE campaigns SET tag = ? WHERE code = ?", tag, code)
        : this.sql.exec("UPDATE campaigns SET tag = ?, note = ? WHERE code = ?", tag, note.trim() || null, code);
    return c.rowsWritten > 0;
  }
}
