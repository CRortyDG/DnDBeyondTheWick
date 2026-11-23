import { DurableObject } from "cloudflare:workers";
import { sha256 } from "@/server/auth";
import type { Registry as RegistryApi } from "@/server/admin";
import type { AdminTag, FoundBy, ListedRow, RegistryRow, StorageStatus } from "@/shared/admin";
import type { Env } from "./env";
import { addToTally, createProblem, decideStorage, RECOUNT_EVERY_MS, spendLimits, utcDayOf, type StorageAnswer, type StorageAsk, type StorageTally } from "@/server/spend";


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
       CREATE TABLE IF NOT EXISTS meta (k TEXT PRIMARY KEY, v TEXT NOT NULL);
       CREATE TABLE IF NOT EXISTS storage (id INTEGER PRIMARY KEY CHECK (id = 1), bytes INTEGER NOT NULL, files INTEGER NOT NULL, writes INTEGER NOT NULL, day TEXT NOT NULL, off INTEGER NOT NULL, counted_at INTEGER);
       CREATE TABLE IF NOT EXISTS creates (day TEXT NOT NULL, net TEXT NOT NULL, n INTEGER NOT NULL, PRIMARY KEY (day, net));`,
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

  // ---------------------------------------------------------------- spending guards (src/server/spend.ts)

  private tally(): StorageTally & { countedAt: number | null } {
    const r = this.sql
      .exec<{ bytes: number; files: number; writes: number; day: string; off: number; counted_at: number | null }>("SELECT * FROM storage WHERE id = 1")
      .toArray()[0];
    if (!r) return { bytes: 0, files: 0, writes: 0, day: "", off: false, countedAt: null };
    return { bytes: r.bytes, files: r.files, writes: r.writes, day: r.day, off: !!r.off, countedAt: r.counted_at };
  }

  private save(t: StorageTally, countedAt: number | null) {
    this.sql.exec(
      "INSERT INTO storage (id, bytes, files, writes, day, off, counted_at) VALUES (1, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET bytes = excluded.bytes, files = excluded.files, writes = excluded.writes, day = excluded.day, off = excluded.off, counted_at = excluded.counted_at",
      Math.max(0, t.bytes),
      Math.max(0, t.files),
      t.writes,
      t.day,
      t.off ? 1 : 0,
      countedAt,
    );
  }

  /** Count what's really in the bucket (about one list call per 1,000 files). Others wait until it's done. */
  async storageRecount(now = Date.now()): Promise<StorageStatus> {
    await this.ctx.blockConcurrencyWhile(async () => {
      let bytes = 0;
      let files = 0;
      let cursor: string | undefined;
      do {
        const list = await this.env.FILES.list({ cursor, limit: 1000 });
        for (const o of list.objects) {
          bytes += o.size;
          files++;
        }
        cursor = list.truncated ? list.cursor : undefined;
      } while (cursor);
      const t = this.tally();
      this.save({ ...t, bytes, files }, now);
    });
    return this.storageStatus();
  }

  /** Before storing files in R2: is there room on the site today? Counts them if so. */
  async storageReserve(ask: StorageAsk, now = Date.now()): Promise<StorageAnswer> {
    const before = this.tally();
    if (before.countedAt === null || now - before.countedAt > RECOUNT_EVERY_MS) await this.storageRecount(now).catch((e) => console.error("storage recount failed", e));
    const t = this.tally();
    const clean = { bytes: Math.max(0, Math.floor(ask.bytes) || 0), files: Math.max(1, Math.floor(ask.files) || 1) };
    const answer = decideStorage(t, clean, spendLimits(this.env), now);
    if (answer.ok) this.save(addToTally(t, clean, now), t.countedAt);
    return answer;
  }

  /** Files that were counted but not stored after all, or that were deleted. */
  async storageRelease(bytes: number, files: number) {
    const t = this.tally();
    this.save({ ...t, bytes: t.bytes - Math.max(0, bytes), files: t.files - Math.max(0, files) }, t.countedAt);
  }

  async storageStatus(now = Date.now()): Promise<StorageStatus> {
    const t = this.tally();
    const limits = spendLimits(this.env);
    return { ...t, writes: t.day === utcDayOf(now) ? t.writes : 0, day: utcDayOf(now), ...limits };
  }

  /** The admin console's switch: uploads on or off for the whole site. */
  async storageSetOff(off: boolean): Promise<StorageStatus> {
    const t = this.tally();
    this.save({ ...t, off }, t.countedAt);
    return this.storageStatus();
  }

  /** Before starting a campaign: has the site, or this address, started too many today? Counts it if not. */
  async createAllowed(ip: string, now = Date.now()): Promise<string | null> {
    const day = utcDayOf(now);
    const net = ip === "local" ? "local" : this.net(ip);
    this.sql.exec("DELETE FROM creates WHERE day < ?", day);
    const site = this.sql.exec<{ n: number }>("SELECT COALESCE(SUM(n), 0) AS n FROM creates WHERE day = ?", day).one().n;
    const here = this.sql.exec<{ n: number }>("SELECT n FROM creates WHERE day = ? AND net = ?", day, net).toArray()[0]?.n ?? 0;
    const problem = createProblem(site, here);
    if (problem) return problem;
    this.sql.exec("INSERT INTO creates (day, net, n) VALUES (?, ?, 1) ON CONFLICT(day, net) DO UPDATE SET n = n + 1", day, net);
    return null;
  }
}
