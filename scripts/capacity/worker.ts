/**
 * Measurement wrapper for `wrangler dev` only. It does not change the app:
 * it imports the real front-door Worker and the real GameRoom, and counts what
 * Cloudflare would bill.
 *
 * - Worker: one count per request that reaches the Worker (static assets excluded).
 * - Durable Object: one count per fetch (HTTP request or WebSocket upgrade),
 *   per incoming WebSocket message that reaches the room (ping auto-responses
 *   never do), and per alarm.
 * - SQLite: rowsRead / rowsWritten from every cursor the room's code opens.
 * - Wall time of each room event, as an upper bound for billable duration
 *   when the room hibernates between events.
 *
 * GET /__metrics?game=CODE returns the room's counters plus the Worker's.
 * POST /__metrics/reset?game=CODE zeroes them.
 * GET /__ddl?game=CODE runs the constructor's CREATE TABLE IF NOT EXISTS again and
 * reports its row counts (what every wake-up from hibernation pays).
 * POST /__evict?game=CODE drops the room's in-memory caches, to mimic the
 * room being evicted from memory while hibernating (the next event re-reads
 * the document and the ledger from SQLite, as it does in production).
 */
import front from "../../worker/index";
import { GameRoom as RealRoom } from "../../worker/room";
import type { Env } from "../../worker/env";

type Counters = {
  doRequests: Record<string, number>;
  wsMessagesIn: number;
  alarms: number;
  rowsRead: number;
  rowsWritten: number;
  sqlStatements: number;
  eventWallMs: number[];
  coldLoads: number;
};

const blank = (): Counters => ({ doRequests: {}, wsMessagesIn: 0, alarms: 0, rowsRead: 0, rowsWritten: 0, sqlStatements: 0, eventWallMs: [], coldLoads: 0 });

const workerCounts: Record<string, number> = {};
const bump = (o: Record<string, number>, k: string) => (o[k] = (o[k] ?? 0) + 1);

/** Wrap ctx.storage.sql so every cursor's row counts are recorded. */
function meter(ctx: DurableObjectState, c: () => Counters): DurableObjectState {
  const sql = ctx.storage.sql;
  const exec = sql.exec.bind(sql);
  const open: SqlStorageCursor<Record<string, SqlStorageValue>>[] = [];
  (sql as { exec: unknown }).exec = (q: string, ...args: SqlStorageValue[]) => {
    const cur = exec(q, ...args);
    c().sqlStatements++;
    if (/^\s*SELECT\s+game,\s*version/i.test(q)) c().coldLoads++;
    open.push(cur);
    return cur;
  };
  // Row counts are final once a cursor is consumed; collect them lazily.
  (ctx as unknown as { __flush: () => void }).__flush = () => {
    for (const cur of open.splice(0)) {
      c().rowsRead += cur.rowsRead;
      c().rowsWritten += cur.rowsWritten;
    }
  };
  return ctx;
}

export class GameRoom extends RealRoom {
  private m: Counters;
  private mctx: DurableObjectState;
  constructor(ctx: DurableObjectState, env: Env) {
    let counters = blank();
    super(meter(ctx, () => counters), env);
    this.m = counters;
    this.mctx = ctx;
    // keep the closure and the field in step
    Object.defineProperty(this, "m", { get: () => counters, set: (v: Counters) => (counters = v) });
  }
  private flush() {
    (this.mctx as unknown as { __flush: () => void }).__flush();
  }
  private async timed<T>(fn: () => Promise<T>): Promise<T> {
    const t0 = performance.now();
    try {
      return await fn();
    } finally {
      this.m.eventWallMs.push(performance.now() - t0);
      this.flush();
    }
  }
  override async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname === "/__metrics") {
      this.flush();
      const size = this.mctx.storage.sql.databaseSize;
      const row = this.mctx.storage.sql.exec<{ s: number; l: number }>("SELECT length(state) AS s, (SELECT count(*) FROM ledger) AS l FROM doc WHERE id = 1").toArray()[0];
      return Response.json({ ...this.m, databaseSize: size, stateBytes: row?.s ?? 0, ledgerRows: row?.l ?? 0, sockets: this.mctx.getWebSockets().length });
    }
    if (url.pathname === "/__metrics/reset") {
      this.flush();
      this.m = blank();
      return Response.json({ ok: true });
    }
    if (url.pathname === "/__ddl") {
      // The constructor's schema statement, run again on its own: what each wake-up costs in rows.
      this.flush();
      const cur = this.mctx.storage.sql.exec(
        `CREATE TABLE IF NOT EXISTS doc (id INTEGER PRIMARY KEY CHECK (id = 1), game TEXT, version INTEGER NOT NULL, state TEXT, dm_key_hash TEXT, touched_at INTEGER NOT NULL);
         CREATE TABLE IF NOT EXISTS ledger (seq INTEGER PRIMARY KEY AUTOINCREMENT, entry TEXT NOT NULL);`,
      );
      cur.toArray();
      const one = this.mctx.storage.sql.exec("SELECT game, version, state, dm_key_hash FROM doc WHERE id = 1");
      one.toArray();
      return Response.json({ ddl: { rowsRead: cur.rowsRead, rowsWritten: cur.rowsWritten }, loadDoc: { rowsRead: one.rowsRead, rowsWritten: one.rowsWritten } });
    }
    if (url.pathname === "/__evict") {
      const self = this as unknown as { doc: unknown; ledgerCache: unknown };
      self.doc = null;
      self.ledgerCache = null;
      return Response.json({ ok: true });
    }
    bump(this.m.doRequests, url.pathname === "/api/live" ? "ws-upgrade" : url.pathname);
    return this.timed(() => super.fetch(req));
  }
  override async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    this.m.wsMessagesIn++;
    return this.timed(() => super.webSocketMessage(ws, message));
  }
  override async alarm() {
    this.m.alarms++;
    return this.timed(() => super.alarm());
  }
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname.startsWith("/__")) {
      if (url.pathname === "/__worker") return Response.json(workerCounts);
      if (url.pathname === "/__worker/reset") {
        for (const k of Object.keys(workerCounts)) delete workerCounts[k];
        return Response.json({ ok: true });
      }
      const game = url.searchParams.get("game") ?? "";
      return env.ROOMS.get(env.ROOMS.idFromName(game)).fetch(req);
    }
    bump(workerCounts, url.pathname === "/api/live" ? "ws-upgrade" : url.pathname);
    return front.fetch(req, env);
  },
} satisfies ExportedHandler<Env>;
