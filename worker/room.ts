import { DurableObject } from "cloudflare:workers";
import { handleApi } from "@/server/api";
import { actorOf, HttpError, identify, projectFor } from "@/server/game";
import { hydrate, type Store } from "@/server/store";
import { isToken, projectArrival } from "@/shared/arrival";
import type { GameState, LedgerEntry } from "@/shared/types";
import type { Env } from "./env";

/** A campaign idle this long is deleted, with its images. */
const IDLE_DELETE_MS = 180 * 24 * 60 * 60 * 1000;
const CHECK_EVERY_MS = 30 * 24 * 60 * 60 * 1000;

interface Doc {
  game: string | null;
  version: number;
  state: GameState | null;
  dmKeyHash: string | null;
}

/** What each open connection is, kept on the socket so it survives hibernation. */
type Attachment =
  | { mode: "pending"; player: string }
  | { mode: "view"; player: string; key: string | null }
  | { mode: "arrival"; token: string | null };

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

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.sql.exec(
      `CREATE TABLE IF NOT EXISTS doc (id INTEGER PRIMARY KEY CHECK (id = 1), game TEXT, version INTEGER NOT NULL, state TEXT, dm_key_hash TEXT, touched_at INTEGER NOT NULL);
       CREATE TABLE IF NOT EXISTS ledger (seq INTEGER PRIMARY KEY AUTOINCREMENT, entry TEXT NOT NULL);`,
    );
    // Keep-alive pings from the browser are answered without waking the room.
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair("ping", "pong"));
  }

  // ---------------------------------------------------------------- storage

  private load(): Doc {
    if (this.doc) return this.doc;
    const row = this.sql.exec<{ game: string | null; version: number; state: string | null; dm_key_hash: string | null }>("SELECT game, version, state, dm_key_hash FROM doc WHERE id = 1").toArray()[0];
    this.doc = row
      ? { game: row.game, version: row.version, state: row.state ? (JSON.parse(row.state) as GameState) : null, dmKeyHash: row.dm_key_hash }
      : { game: null, version: 0, state: null, dmKeyHash: null };
    return this.doc;
  }

  private loadLedger(): LedgerEntry[] {
    this.ledgerCache ??= this.sql.exec<{ entry: string }>("SELECT entry FROM ledger ORDER BY seq").toArray().map((r) => JSON.parse(r.entry) as LedgerEntry);
    return this.ledgerCache;
  }

  private save(game: string, d: Doc) {
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

  /** The game changed: push every open screen its own view. Outgoing messages are free. */
  async publish(_game: string, _version: number) {
    for (const ws of this.ctx.getWebSockets()) await this.push(ws);
  }

  // ---------------------------------------------------------------- HTTP and sockets

  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname === "/api/live") {
      if (req.headers.get("Upgrade") !== "websocket") return new Response("Expected a WebSocket", { status: 426 });
      const pair = new WebSocketPair();
      const [client, server] = [pair[0], pair[1]];
      this.ctx.acceptWebSocket(server);
      const t = url.searchParams.get("t");
      const att: Attachment = url.searchParams.has("arrival")
        ? { mode: "arrival", token: isToken(t) ? t : null }
        : { mode: "pending", player: url.searchParams.get("player") ?? "" };
      server.serializeAttachment(att);
      if (att.mode === "arrival") await this.push(server);
      return new Response(null, { status: 101, webSocket: client });
    }
    return handleApi(req, this);
  }

  /** The browser's first message carries its key (a WebSocket can't send headers). */
  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    if (typeof message !== "string") return;
    let msg: { t?: string; key?: unknown };
    try {
      msg = JSON.parse(message) as typeof msg;
    } catch {
      return;
    }
    const att = ws.deserializeAttachment() as Attachment;
    if (msg.t === "auth" && att.mode !== "arrival") {
      const key = typeof msg.key === "string" && msg.key ? msg.key.slice(0, 200) : null;
      ws.serializeAttachment({ mode: "view", player: att.player, key } satisfies Attachment);
      await this.push(ws);
    }
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string) {
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
      const who = identify(state, att.player, att.key, this.load().dmKeyHash);
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

  // ---------------------------------------------------------------- cleanup

  /** Monthly: delete a campaign nobody has touched for six months, with its images. */
  async alarm() {
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
      this.doc = null;
      this.ledgerCache = null;
      return;
    }
    await this.ctx.storage.setAlarm(Date.now() + CHECK_EVERY_MS);
  }
}
