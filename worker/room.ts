import { DurableObject } from "cloudflare:workers";
import { handleApi, miss } from "@/server/api";
import { isDmKey, KEY_HEADER } from "@/server/auth";
import { actorOf, HttpError, identify, identifyPractice, projectFor } from "@/server/game";
import { hydrate, SNAPSHOTS_KEPT, type SnapshotData, type SnapshotInfo, type Store } from "@/server/store";
import { isToken, projectArrival } from "@/shared/arrival";
import type { GameState, LedgerEntry } from "@/shared/types";
import type { Env } from "./env";
import { R2Presets } from "./presets";
import type { PresetStore } from "@/server/presets";
import type { BuilderRow, BuilderStore } from "@/server/builderStore";
import { addUsage, USAGE_FIELDS, utcDay, ZERO_USAGE, type UsageCounts, type UsageReport } from "@/shared/hosting";

/** A campaign idle this long is deleted, with its images. */
const IDLE_DELETE_MS = 180 * 24 * 60 * 60 * 1000;
/** A practice copy nobody has touched this long is deleted (never any images: those are the live campaign's). */
const PRACTICE_IDLE_MS = 7 * 24 * 60 * 60 * 1000;
const PRACTICE_CHECK_MS = 24 * 60 * 60 * 1000;
const CHECK_EVERY_MS = 30 * 24 * 60 * 60 * 1000;

/** Open screens one room will hold. A table needs about ten; this stops one code being flooded with sockets. */
const MAX_SOCKETS = 100;
/** A screen sends its key once per connection; a few retries are fine, a stream of messages is not. */
const MAX_AUTHS = 5;
const MAX_MESSAGE = 1024;
/** Each screen sends a keep-alive "ping" this often (src/client/useGame.ts). */
const PING_EVERY_MS = 25_000;
/** Usage counts are saved at most this often (or after a write), so counting adds little of its own. */
const USAGE_FLUSH_MS = 20_000;
const USAGE_AFTER_WRITE_MS = 5_000;

/** Images per campaign, counted as they are uploaded (they're never re-counted when a scene drops one). */
export const UPLOAD_QUOTA_BYTES = 500 * 1024 * 1024;
export const UPLOAD_QUOTA_FILES = 1000;

interface Doc {
  game: string | null;
  version: number;
  state: GameState | null;
  dmKeyHash: string | null;
}

/** What each open connection is, kept on the socket so it survives hibernation. */
type Attachment = (
  | { mode: "pending"; player: string; auths?: number }
  | { mode: "view"; player: string; key: string | null; auths?: number }
  | { mode: "arrival"; token: string | null }
) & { /** When the screen connected (ms), to count its keep-alive pings. */ at?: number };

/**
 * One campaign. Holds the game document and the money ledger in SQLite (one
 * row per save, one row per ledger entry), runs every command through the
 * shared reducer, and pushes each open screen its own filtered view over a
 * WebSocket. Requests to one room run one at a time, so a save can't race
 * another save. Idle rooms hibernate and cost nothing.
 */
export class GameRoom extends DurableObject<Env> implements Store {
  private sql: SqlStorage;
  private doc: Doc | null = null;
  private ledgerCache: LedgerEntry[] | null = null;
  /** Tables exist. A code nobody created (a typo, a bot guessing) never writes any, so it leaves nothing behind. */
  private hasSchema: boolean;

  readonly presets: PresetStore;
  /** This is a practice room ("practice:<code>"): it holds a copy, answers only the DM key, and owns no images. */
  practiceMode: boolean;
  /** Worldbuilder keys, drafts and Activity: their own table, never in the game document. */
  readonly builder: BuilderStore;
  private hasBuilder: boolean | null = null;

  /** Usage since the last save (see the usage section below). Lost if the room sleeps first: the counts run a little low, never high. */
  private meter: UsageCounts = { ...ZERO_USAGE };
  private cursors: SqlStorageCursor<Record<string, SqlStorageValue>>[] = [];
  private lastFlush = 0;
  private prunedOn = "";

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.presets = new R2Presets(env.FILES);
    // Every query goes through here, so the rows it reads and writes are counted.
    const raw = ctx.storage.sql;
    const cursors = this.cursors;
    this.sql = new Proxy(raw, {
      get(target, prop) {
        if (prop === "exec") {
          return (query: string, ...bindings: unknown[]) => {
            const c = target.exec(query, ...bindings);
            cursors.push(c);
            return c;
          };
        }
        const v = Reflect.get(target, prop, target) as unknown;
        return typeof v === "function" ? (v as (...a: unknown[]) => unknown).bind(target) : v;
      },
    });
    this.hasSchema = this.sql.exec("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'doc'").toArray().length > 0;
    this.practiceMode = this.hasSchema && this.sql.exec("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'practice_base'").toArray().length > 0;
    this.builder = this.builderStore();
    // Keep-alive pings from the browser are answered without waking the room.
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair("ping", "pong"));
  }

  // ---------------------------------------------------------------- storage

  private ensureSchema() {
    if (this.hasSchema) return;
    this.sql.exec(
      `CREATE TABLE IF NOT EXISTS doc (id INTEGER PRIMARY KEY CHECK (id = 1), game TEXT, version INTEGER NOT NULL, state TEXT, dm_key_hash TEXT, touched_at INTEGER NOT NULL);
       CREATE TABLE IF NOT EXISTS ledger (seq INTEGER PRIMARY KEY AUTOINCREMENT, entry TEXT NOT NULL);`,
    );
    this.hasSchema = true;
  }

  private load(): Doc {
    if (this.doc) return this.doc;
    if (!this.hasSchema) return { game: null, version: 0, state: null, dmKeyHash: null };
    const row = this.sql.exec<{ game: string | null; version: number; state: string | null; dm_key_hash: string | null }>("SELECT game, version, state, dm_key_hash FROM doc WHERE id = 1").toArray()[0];
    this.doc = row
      ? { game: row.game, version: row.version, state: row.state ? (JSON.parse(row.state) as GameState) : null, dmKeyHash: row.dm_key_hash }
      : { game: null, version: 0, state: null, dmKeyHash: null };
    return this.doc;
  }

  private loadLedger(): LedgerEntry[] {
    if (!this.hasSchema) return [];
    this.ledgerCache ??= this.sql.exec<{ entry: string }>("SELECT entry FROM ledger ORDER BY seq").toArray().map((r) => JSON.parse(r.entry) as LedgerEntry);
    return this.ledgerCache;
  }

  private save(game: string, d: Doc) {
    this.ensureSchema();
    this.sql.exec(
      `INSERT INTO doc (id, game, version, state, dm_key_hash, touched_at) VALUES (1, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET game = excluded.game, version = excluded.version, state = excluded.state, dm_key_hash = excluded.dm_key_hash, touched_at = excluded.touched_at`,
      game,
      d.version,
      d.state ? JSON.stringify(d.state) : null,
      d.dmKeyHash,
      Date.now(),
    );
  }

  async read(_game: string) {
    const d = this.load();
    return { state: hydrate(d.state ? structuredClone(d.state) : null), version: d.version };
  }
  async version(_game: string) {
    return this.load().version;
  }
  async commit(game: string, expected: number, state: GameState, ledger: LedgerEntry[]) {
    const d = this.load();
    if (d.version !== expected) return null;
    const next: Doc = { ...d, game, version: d.version + 1, state: structuredClone(state) };
    const entries = structuredClone(ledger);
    const all = this.loadLedger();
    this.ensureSchema();
    this.ctx.storage.transactionSync(() => {
      this.save(game, next);
      for (const e of entries) this.sql.exec("INSERT INTO ledger (entry) VALUES (?)", JSON.stringify(e));
    });
    this.doc = next;
    all.push(...entries);
    return next.version;
  }
  async ledger(_game: string) {
    return structuredClone(this.loadLedger());
  }
  async overwrite(game: string, state: GameState, ledger: LedgerEntry[]) {
    const d = this.load();
    const next: Doc = { ...d, game, version: d.version + 1, state: structuredClone(state) };
    const entries = structuredClone(ledger);
    this.ensureSchema();
    this.ctx.storage.transactionSync(() => {
      this.save(game, next);
      this.sql.exec("DELETE FROM ledger");
      for (const e of entries) this.sql.exec("INSERT INTO ledger (entry) VALUES (?)", JSON.stringify(e));
    });
    this.doc = next;
    this.ledgerCache = entries;
    return next.version;
  }
  async dmKeyHash(_game: string) {
    return this.load().dmKeyHash;
  }
  async setDmKeyHash(game: string, hash: string) {
    const next: Doc = { ...this.load(), game, dmKeyHash: hash };
    this.save(game, next);
    this.doc = next;
    if ((await this.ctx.storage.getAlarm()) === null) await this.ctx.storage.setAlarm(Date.now() + CHECK_EVERY_MS);
  }

  // ---------------------------------------------------------------- practice copies
  //
  // A practice room is this same class under another name. beginPractice turns it
  // into one; endPractice deletes everything in it.

  async beginPractice(game: string, state: GameState, ledger: LedgerEntry[], dmKeyHash: string, base: GameState) {
    if (this.hasSchema && !this.practiceMode) throw new Error("A live campaign can't become a practice copy.");
    this.ensureSchema();
    this.sql.exec("CREATE TABLE IF NOT EXISTS practice_base (n INTEGER PRIMARY KEY, body TEXT NOT NULL)");
    const json = JSON.stringify(base);
    const PIECE = 900_000;
    this.ctx.storage.transactionSync(() => {
      this.sql.exec("DELETE FROM practice_base");
      for (let i = 0, n = 0; i < json.length; i += PIECE, n++) this.sql.exec("INSERT INTO practice_base (n, body) VALUES (?, ?)", n, json.slice(i, i + PIECE));
    });
    this.practiceMode = true;
    const next: Doc = { ...this.load(), game, dmKeyHash };
    this.save(game, next);
    this.doc = next;
    const v = await this.overwrite(game, state, ledger);
    await this.ctx.storage.setAlarm(Date.now() + PRACTICE_CHECK_MS);
    return v;
  }
  async practiceBase(_game: string): Promise<GameState | null> {
    if (!this.practiceMode) return null;
    const parts = this.sql.exec<{ body: string }>("SELECT body FROM practice_base ORDER BY n").toArray();
    return parts.length ? (JSON.parse(parts.map((p) => p.body).join("")) as GameState) : null;
  }
  async endPractice(_game: string) {
    if (!this.practiceMode) return;
    for (const ws of this.ctx.getWebSockets()) {
      try {
        ws.send(JSON.stringify({ t: "error", status: 404, code: "no-game", error: "Practice has ended.", version: 0 }));
        ws.close(4000, "Practice ended");
      } catch {}
    }
    await this.ctx.storage.deleteAlarm();
    await this.ctx.storage.deleteAll();
    this.hasSchema = false;
    this.practiceMode = false;
    this.doc = null;
    this.ledgerCache = null;
  }

  // ---------------------------------------------------------------- safety snapshots
  //
  // The whole game and ledger, before a reset or restore and at each session's end.
  // A row tops out at 2 MB, so a snapshot is stored in pieces.

  private snapSchema() {
    this.ensureSchema();
    this.sql.exec(
      `CREATE TABLE IF NOT EXISTS snap (id INTEGER PRIMARY KEY AUTOINCREMENT, at INTEGER NOT NULL, reason TEXT NOT NULL);
       CREATE TABLE IF NOT EXISTS snap_part (snap_id INTEGER NOT NULL, n INTEGER NOT NULL, body TEXT NOT NULL, PRIMARY KEY (snap_id, n));`,
    );
  }
  async saveSnapshot(_game: string, reason: string, at: number, data: SnapshotData) {
    this.snapSchema();
    const json = JSON.stringify(data);
    const PIECE = 900_000;
    this.ctx.storage.transactionSync(() => {
      this.sql.exec("INSERT INTO snap (at, reason) VALUES (?, ?)", at, reason.slice(0, 120));
      const id = this.sql.exec<{ id: number }>("SELECT last_insert_rowid() AS id").one().id;
      for (let i = 0, n = 0; i < json.length; i += PIECE, n++) this.sql.exec("INSERT INTO snap_part (snap_id, n, body) VALUES (?, ?, ?)", id, n, json.slice(i, i + PIECE));
      const old = this.sql.exec<{ id: number }>("SELECT id FROM snap ORDER BY id DESC LIMIT -1 OFFSET ?", SNAPSHOTS_KEPT).toArray();
      for (const o of old) {
        this.sql.exec("DELETE FROM snap_part WHERE snap_id = ?", o.id);
        this.sql.exec("DELETE FROM snap WHERE id = ?", o.id);
      }
    });
  }
  async listSnapshots(_game: string): Promise<SnapshotInfo[]> {
    if (!this.hasSchema) return [];
    this.snapSchema();
    return this.sql.exec<{ id: number; at: number; reason: string }>("SELECT id, at, reason FROM snap ORDER BY id DESC").toArray().map((r) => ({ id: r.id, at: r.at, reason: r.reason }));
  }
  async loadSnapshot(_game: string, id: number): Promise<SnapshotData | null> {
    if (!this.hasSchema) return null;
    this.snapSchema();
    const parts = this.sql.exec<{ body: string }>("SELECT body FROM snap_part WHERE snap_id = ? ORDER BY n", id).toArray();
    return parts.length ? (JSON.parse(parts.map((p) => p.body).join("")) as SnapshotData) : null;
  }

  // ---------------------------------------------------------------- Worldbuilder rows

  private builderReady(create: boolean): boolean {
    if (this.hasBuilder === null) this.hasBuilder = this.sql.exec("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'builder'").toArray().length > 0;
    if (this.hasBuilder || !create) return this.hasBuilder;
    // Only a real campaign gets the table: a guessed code never writes anything.
    if (!this.load().state) return false;
    this.sql.exec(
      `CREATE TABLE IF NOT EXISTS builder (tbl TEXT NOT NULL, id TEXT NOT NULL, at INTEGER NOT NULL, tag TEXT NOT NULL, body TEXT NOT NULL, PRIMARY KEY (tbl, id));
       CREATE INDEX IF NOT EXISTS builder_tag ON builder (tbl, tag, at);`,
    );
    this.hasBuilder = true;
    return true;
  }

  private builderStore(): BuilderStore {
    type Row = { id: string; at: number; tag: string; body: string };
    return {
      get: async (tbl, id) => {
        if (!this.builderReady(false)) return null;
        return this.sql.exec<Row>("SELECT id, at, tag, body FROM builder WHERE tbl = ? AND id = ?", tbl, id).toArray()[0] ?? null;
      },
      put: async (tbl, row: BuilderRow) => {
        if (!this.builderReady(true)) return;
        this.sql.exec(
          "INSERT INTO builder (tbl, id, at, tag, body) VALUES (?, ?, ?, ?, ?) ON CONFLICT(tbl, id) DO UPDATE SET at = excluded.at, tag = excluded.tag, body = excluded.body",
          tbl,
          row.id,
          row.at,
          row.tag,
          row.body,
        );
      },
      del: async (tbl, id) => {
        if (this.builderReady(false)) this.sql.exec("DELETE FROM builder WHERE tbl = ? AND id = ?", tbl, id);
      },
      list: async (tbl, opts = {}) => {
        if (!this.builderReady(false)) return [];
        const limit = opts.limit ?? 10_000;
        return opts.tag === undefined
          ? this.sql.exec<Row>("SELECT id, at, tag, body FROM builder WHERE tbl = ? ORDER BY at DESC, id DESC LIMIT ?", tbl, limit).toArray()
          : this.sql.exec<Row>("SELECT id, at, tag, body FROM builder WHERE tbl = ? AND tag = ? ORDER BY at DESC, id DESC LIMIT ?", tbl, opts.tag, limit).toArray();
      },
      count: async (tbl, tag) => {
        if (!this.builderReady(false)) return 0;
        return tag === undefined
          ? this.sql.exec<{ n: number }>("SELECT COUNT(*) AS n FROM builder WHERE tbl = ?", tbl).one().n
          : this.sql.exec<{ n: number }>("SELECT COUNT(*) AS n FROM builder WHERE tbl = ? AND tag = ?", tbl, tag).one().n;
      },
      prune: async (tbl, keep, before) => {
        if (!this.builderReady(false)) return;
        this.sql.exec("DELETE FROM builder WHERE tbl = ? AND (at < ? OR id IN (SELECT id FROM builder WHERE tbl = ? ORDER BY at DESC, id DESC LIMIT -1 OFFSET ?))", tbl, before, tbl, keep);
      },
      clear: async (tbl) => {
        if (this.builderReady(false)) this.sql.exec("DELETE FROM builder WHERE tbl = ?", tbl);
      },
    };
  }

  /** The game changed: push every open screen its own view. Outgoing messages are free. */
  async publish(_game: string, _version: number) {
    for (const ws of this.ctx.getWebSockets()) await this.push(ws);
  }

  // ---------------------------------------------------------------- HTTP and sockets

  async fetch(req: Request): Promise<Response> {
    const path = new URL(req.url).pathname;
    // A front-door request that reached this room. The internal ones are part of one the Worker already got,
    // except the DM check (an upload) and create (a new campaign), which stand for the Worker request itself.
    const worker = path.startsWith("/api/") || path === "/internal/dm-check" || path === "/internal/create" ? 1 : 0;
    this.count({ events: 1, roomRequests: 1, workerRequests: worker });
    try {
      return await this.handle(req);
    } finally {
      this.flushUsage();
    }
  }

  private async handle(req: Request): Promise<Response> {
    const url = new URL(req.url);
    // A practice room answers only practice requests, and a live room never does.
    if ((url.searchParams.get("practice") === "1") !== this.practiceMode && !url.pathname.startsWith("/internal/")) return miss(new Response(JSON.stringify({ error: "No game here yet.", code: "no-game" }), { status: 404, headers: { "Content-Type": "application/json" } }));
    if (this.practiceMode && url.pathname.startsWith("/internal/")) return new Response("Not found", { status: 404 });
    if (url.pathname === "/internal/upload-reserve" && req.method === "POST") return this.reserveUpload(req, url);
    if (url.pathname === "/api/live") {
      if (req.headers.get("Upgrade") !== "websocket") return new Response("Expected a WebSocket", { status: 426 });
      if (this.ctx.getWebSockets().length >= MAX_SOCKETS) return new Response("This table has too many screens open.", { status: 429 });
      const pair = new WebSocketPair();
      const [client, server] = [pair[0], pair[1]];
      this.ctx.acceptWebSocket(server);
      const t = url.searchParams.get("t");
      if (this.practiceMode && url.searchParams.has("arrival")) return new Response("Not in practice", { status: 404 });
      const att: Attachment = url.searchParams.has("arrival")
        ? { mode: "arrival", token: isToken(t) ? t : null }
        : { mode: "pending", player: url.searchParams.get("player") ?? "" };
      att.at = Date.now();
      server.serializeAttachment(att);
      if (att.mode === "arrival") await this.push(server);
      // Still a socket (so an open screen doesn't reconnect in a loop), but a guess at a code
      // or Arrival link that doesn't exist counts against the caller like any other miss.
      const state = this.load().state;
      const guessed = !state || (att.mode === "arrival" && att.token !== null && !projectArrival(state, 0, att.token).me);
      const res = new Response(null, { status: 101, webSocket: client });
      return guessed ? miss(res) : res;
    }
    return handleApi(req, this);
  }

  /** The Worker asks before storing an image: is this the DM, and is there room left? Counts it if so. */
  private reserveUpload(req: Request, url: URL): Response {
    const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
    if (!isDmKey(req.headers.get(KEY_HEADER), this.load().dmKeyHash)) return miss(json({ error: "Only the DM can upload.", code: "bad-key" }, 401));
    const size = Math.max(0, Number(url.searchParams.get("size")) || 0);
    // A map cut into tiles for fog of war comes as one batch.
    const count = Math.min(100, Math.max(1, Math.floor(Number(url.searchParams.get("count")) || 1)));
    this.sql.exec("CREATE TABLE IF NOT EXISTS uploads (id INTEGER PRIMARY KEY CHECK (id = 1), bytes INTEGER NOT NULL, files INTEGER NOT NULL)");
    const used = this.sql.exec<{ bytes: number; files: number }>("SELECT bytes, files FROM uploads WHERE id = 1").toArray()[0] ?? { bytes: 0, files: 0 };
    if (used.files + count > UPLOAD_QUOTA_FILES || used.bytes + size > UPLOAD_QUOTA_BYTES) {
      return json({ error: `This campaign has used its image space (${Math.round(UPLOAD_QUOTA_BYTES / 1024 / 1024)} MB or ${UPLOAD_QUOTA_FILES} images).`, code: "quota" }, 413);
    }
    this.sql.exec(
      "INSERT INTO uploads (id, bytes, files) VALUES (1, ?, ?) ON CONFLICT(id) DO UPDATE SET bytes = bytes + excluded.bytes, files = files + excluded.files",
      size,
      count,
    );
    this.count({ uploads: count, uploadBytes: size });
    return json({ ok: true });
  }

  /** The browser's first message carries its key (a WebSocket can't send headers). */
  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    this.count({ events: 1, socketMessages: 1 });
    try {
      await this.onMessage(ws, message);
    } finally {
      this.flushUsage();
    }
  }

  private async onMessage(ws: WebSocket, message: string | ArrayBuffer) {
    // The only message a screen sends (besides the free "ping") is its key, once. Anything
    // else, or a stream of keys, is someone poking at the room: hang up on them.
    const hangUp = () => {
      try {
        ws.close(1008, "Unexpected message");
      } catch {}
    };
    if (typeof message !== "string" || message.length > MAX_MESSAGE) return hangUp();
    let msg: { t?: string; key?: unknown };
    try {
      msg = JSON.parse(message) as typeof msg;
    } catch {
      return hangUp();
    }
    const att = ws.deserializeAttachment() as Attachment;
    if (msg?.t !== "auth" || att.mode === "arrival") return hangUp();
    const auths = (att.auths ?? 0) + 1;
    if (auths > MAX_AUTHS) return hangUp();
    const key = typeof msg.key === "string" && msg.key ? msg.key.slice(0, 200) : null;
    ws.serializeAttachment({ mode: "view", player: att.player, key, auths, at: att.at } satisfies Attachment);
    await this.push(ws);
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string) {
    const at = (ws.deserializeAttachment() as Attachment | null)?.at;
    this.count({ events: 1, pings: at ? Math.floor(Math.max(0, Date.now() - at) / PING_EVERY_MS) : 0 });
    this.flushUsage(true);
    try {
      ws.close(code, reason);
    } catch {}
  }

  private async push(ws: WebSocket) {
    const att = ws.deserializeAttachment() as Attachment;
    if (att.mode === "pending") return;
    const { state, version } = await this.read("");
    const send = (data: unknown) => {
      try {
        ws.send(JSON.stringify(data));
      } catch {}
    };
    if (att.mode === "arrival") {
      send({ t: "arrival", view: state ? projectArrival(state, version, att.token) : { version: 0, me: null, seats: [], locked: false } });
      return;
    }
    try {
      if (!state) throw new HttpError(404, "No game here yet.", "no-game");
      const who = (this.practiceMode ? identifyPractice : identify)(state, att.player, att.key, this.load().dmKeyHash);
      if (who.kind === "invalid") throw new HttpError(401, "That DM key isn't right.", "bad-key");
      if (who.kind === "taken") throw new HttpError(403, "That name is taken.", "taken");
      if (who.kind === "unknown") throw new HttpError(404, "You're not at this table.", "unknown");
      send({ t: "view", view: await projectFor(state, version, actorOf(who), () => this.loadLedger()) });
    } catch (e) {
      const err = e instanceof HttpError ? e : new HttpError(500, "Something went wrong on the server.");
      // The socket stays open: a knocking player hears when the DM lets them in.
      send({ t: "error", status: err.status, code: err.code ?? null, error: err.message, version });
    }
  }

  // ---------------------------------------------------------------- usage
  //
  // What this campaign uses of Cloudflare, for the DM's Hosting costs box.
  // Counted in memory and saved as one row per UTC day: after a write, or every
  // USAGE_FLUSH_MS. A room that was never created (a guessed code) saves nothing.

  private count(u: Partial<UsageCounts>) {
    this.meter = addUsage(this.meter, u);
  }

  /** Add up the rows the finished queries read and wrote. */
  private tallyRows() {
    let read = 0;
    let written = 0;
    for (const c of this.cursors) {
      read += c.rowsRead;
      written += c.rowsWritten;
    }
    this.cursors.length = 0;
    this.count({ rowsRead: read, rowsWritten: written });
    return written;
  }

  private flushUsage(force = false) {
    const wrote = this.tallyRows();
    if (!this.hasSchema) {
      this.meter = { ...ZERO_USAGE };
      return;
    }
    const since = Date.now() - this.lastFlush;
    if (!force && since < USAGE_FLUSH_MS && !(wrote > 0 && since >= USAGE_AFTER_WRITE_MS)) return;
    const m = this.meter;
    if (USAGE_FIELDS.every((k) => m[k] === 0)) return;
    this.meter = { ...ZERO_USAGE };
    this.lastFlush = Date.now();
    const day = utcDay(this.lastFlush);
    try {
      this.sql.exec(`CREATE TABLE IF NOT EXISTS usage (day TEXT PRIMARY KEY, ${USAGE_FIELDS.map((k) => `${k} INTEGER NOT NULL DEFAULT 0`).join(", ")})`);
      this.sql.exec(
        `INSERT INTO usage (day, ${USAGE_FIELDS.join(", ")}) VALUES (?, ${USAGE_FIELDS.map(() => "?").join(", ")})
         ON CONFLICT(day) DO UPDATE SET ${USAGE_FIELDS.map((k) => `${k} = ${k} + excluded.${k}`).join(", ")}`,
        day,
        ...USAGE_FIELDS.map((k) => Math.round(m[k])),
      );
      // Two years of days is plenty.
      if (this.prunedOn !== day) {
        this.prunedOn = day;
        this.sql.exec("DELETE FROM usage WHERE day < ?", utcDay(this.lastFlush - 730 * 24 * 60 * 60 * 1000));
      }
    } catch (e) {
      // Counting must never break the game.
      console.error("usage flush failed", e);
    }
  }

  async usage(_game: string): Promise<UsageReport> {
    this.flushUsage(true);
    const now = Date.now();
    const today = utcDay(now);
    const month = today.slice(0, 7);
    const rows = this.hasSchema && this.sql.exec("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'usage'").toArray().length
      ? this.sql.exec<Record<string, number | string>>("SELECT * FROM usage ORDER BY day").toArray()
      : [];
    const counts = (r: Record<string, number | string>): UsageCounts => Object.fromEntries(USAGE_FIELDS.map((k) => [k, Number(r[k]) || 0])) as unknown as UsageCounts;
    const days = rows.map((r) => ({ day: String(r.day), counts: counts(r) }));
    const byMonth = new Map<string, UsageCounts>();
    for (const d of days) byMonth.set(d.day.slice(0, 7), addUsage(byMonth.get(d.day.slice(0, 7)) ?? ZERO_USAGE, d.counts));
    const busy = days.filter((d) => d.day.startsWith(month)).sort((a, b) => b.counts.workerRequests + b.counts.roomRequests - (a.counts.workerRequests + a.counts.roomRequests))[0] ?? null;
    const up = this.hasSchema && this.sql.exec("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'uploads'").toArray().length
      ? this.sql.exec<{ bytes: number; files: number }>("SELECT bytes, files FROM uploads WHERE id = 1").toArray()[0]
      : undefined;
    this.tallyRows();
    return {
      month,
      thisMonth: byMonth.get(month) ?? { ...ZERO_USAGE },
      today,
      todayCounts: days.find((d) => d.day === today)?.counts ?? { ...ZERO_USAGE },
      busiestDay: busy,
      months: [...byMonth].map(([m, c]) => ({ month: m, counts: c })),
      storageBytes: this.sql.databaseSize,
      imageBytes: up?.bytes ?? 0,
      imageFiles: up?.files ?? 0,
      since: days[0]?.day ?? null,
    };
  }

  // ---------------------------------------------------------------- cleanup

  /** Monthly: delete a campaign nobody has touched for six months, with its images. */
  async alarm() {
    if (!this.hasSchema) return;
    this.count({ events: 1, roomRequests: 1 });
    this.flushUsage(true);
    if (this.practiceMode) {
      const t = this.sql.exec<{ touched_at: number }>("SELECT touched_at FROM doc WHERE id = 1").toArray()[0];
      if (!t || (Date.now() - t.touched_at > PRACTICE_IDLE_MS && this.ctx.getWebSockets().length === 0)) await this.endPractice("");
      else await this.ctx.storage.setAlarm(Date.now() + PRACTICE_CHECK_MS);
      return;
    }
    const row = this.sql.exec<{ touched_at: number; game: string | null }>("SELECT touched_at, game FROM doc WHERE id = 1").toArray()[0];
    if (row && Date.now() - row.touched_at > IDLE_DELETE_MS && this.ctx.getWebSockets().length === 0) {
      if (row.game) {
        let cursor: string | undefined;
        do {
          const list = await this.env.FILES.list({ prefix: `${row.game}/`, cursor });
          if (list.objects.length) await this.env.FILES.delete(list.objects.map((o) => o.key));
          cursor = list.truncated ? list.cursor : undefined;
        } while (cursor);
      }
      await this.ctx.storage.deleteAll();
      this.hasSchema = false;
      this.doc = null;
      this.ledgerCache = null;
      return;
    }
    await this.ctx.storage.setAlarm(Date.now() + CHECK_EVERY_MS);
  }
}
