import "server-only";
import { EventEmitter } from "node:events";
import fs from "node:fs";
import path from "node:path";
import { Redis } from "@upstash/redis";
import type { GameState, LedgerEntry } from "@/shared/types";

/**
 * Where a game lives. One JSON document (state), a version number, and an
 * append-only ledger. commit() is all-or-nothing: it only writes if nobody
 * else committed since we read, so gold can't be spent twice.
 */
export interface Store {
  readonly kind: "upstash" | "file";
  read(game: string): Promise<{ state: GameState | null; version: number }>;
  version(game: string): Promise<number>;
  /** Returns the new version, or null if someone else committed first. */
  commit(game: string, expected: number, state: GameState, ledger: LedgerEntry[]): Promise<number | null>;
  ledger(game: string): Promise<LedgerEntry[]>;
  /** Replace a game wholesale (seed / import). */
  overwrite(game: string, state: GameState, ledger: LedgerEntry[]): Promise<number>;
  publish(game: string, version: number): Promise<void>;
  /** Calls onVersion when the game changes. Returns an unsubscribe function. */
  subscribe(game: string, onVersion: (v: number) => void): () => void;
}

const k = (game: string) => ({
  state: `cf:${game}:state`,
  ver: `cf:${game}:ver`,
  ledger: `cf:${game}:ledger`,
  channel: `cf:${game}:changes`,
});

// ---------------------------------------------------------------------------
// Upstash Redis (production)

const COMMIT_LUA = `
local v = tonumber(redis.call('GET', KEYS[1]) or '0')
if v ~= tonumber(ARGV[1]) then return -1 end
redis.call('SET', KEYS[2], ARGV[2])
for i = 3, #ARGV do redis.call('RPUSH', KEYS[3], ARGV[i]) end
return redis.call('INCR', KEYS[1])
`;

const OVERWRITE_LUA = `
redis.call('SET', KEYS[2], ARGV[1])
redis.call('DEL', KEYS[3])
for i = 2, #ARGV do redis.call('RPUSH', KEYS[3], ARGV[i]) end
return redis.call('INCR', KEYS[1])
`;

class UpstashStore implements Store {
  readonly kind = "upstash" as const;
  constructor(private redis: Redis) {}

  async read(game: string) {
    const key = k(game);
    const [ver, state] = await this.redis.mget<[string | null, string | null]>(key.ver, key.state);
    return { state: state ? (JSON.parse(state) as GameState) : null, version: Number(ver ?? 0) };
  }
  async version(game: string) {
    return Number((await this.redis.get<string>(k(game).ver)) ?? 0);
  }
  async commit(game: string, expected: number, state: GameState, ledger: LedgerEntry[]) {
    const key = k(game);
    const args = [String(expected), JSON.stringify(state), ...ledger.map((l) => JSON.stringify(l))];
    const r = Number(await this.redis.eval(COMMIT_LUA, [key.ver, key.state, key.ledger], args));
    return r < 0 ? null : r;
  }
  async ledger(game: string) {
    const rows = await this.redis.lrange<string>(k(game).ledger, 0, -1);
    return rows.map((r) => JSON.parse(r) as LedgerEntry);
  }
  async overwrite(game: string, state: GameState, ledger: LedgerEntry[]) {
    const key = k(game);
    return Number(await this.redis.eval(OVERWRITE_LUA, [key.ver, key.state, key.ledger], [JSON.stringify(state), ...ledger.map((l) => JSON.stringify(l))]));
  }
  async publish(game: string, version: number) {
    await this.redis.publish(k(game).channel, String(version));
  }
  subscribe(game: string, onVersion: (v: number) => void) {
    const sub = this.redis.subscribe<string>([k(game).channel]);
    sub.on("message", ({ message }) => {
      const v = Number(message);
      if (Number.isFinite(v)) onVersion(v);
    });
    sub.on("error", () => {
      /* the SSE route will time out and the client reconnects */
    });
    return () => {
      sub.unsubscribe().catch(() => {});
    };
  }
}

// ---------------------------------------------------------------------------
// File store (local development and tests). One process only.

interface FileGame {
  state: GameState | null;
  version: number;
  ledger: LedgerEntry[];
}

class FileStore implements Store {
  readonly kind = "file" as const;
  private games = new Map<string, FileGame>();
  private bus = new EventEmitter();
  constructor(private dir: string | null) {
    this.bus.setMaxListeners(200);
  }

  private file(game: string) {
    return this.dir ? path.join(this.dir, `${game}.json`) : null;
  }
  private load(game: string): FileGame {
    let g = this.games.get(game);
    if (g) return g;
    g = { state: null, version: 0, ledger: [] };
    const f = this.file(game);
    if (f && fs.existsSync(f)) g = JSON.parse(fs.readFileSync(f, "utf8")) as FileGame;
    this.games.set(game, g);
    return g;
  }
  private save(game: string, g: FileGame) {
    const f = this.file(game);
    if (!f) return;
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f + ".tmp", JSON.stringify(g));
    fs.renameSync(f + ".tmp", f);
  }

  async read(game: string) {
    const g = this.load(game);
    return { state: g.state ? structuredClone(g.state) : null, version: g.version };
  }
  async version(game: string) {
    return this.load(game).version;
  }
  async commit(game: string, expected: number, state: GameState, ledger: LedgerEntry[]) {
    const g = this.load(game);
    if (g.version !== expected) return null;
    g.state = structuredClone(state);
    g.ledger.push(...structuredClone(ledger));
    g.version += 1;
    this.save(game, g);
    return g.version;
  }
  async ledger(game: string) {
    return structuredClone(this.load(game).ledger);
  }
  async overwrite(game: string, state: GameState, ledger: LedgerEntry[]) {
    const g = this.load(game);
    g.state = structuredClone(state);
    g.ledger = structuredClone(ledger);
    g.version += 1;
    this.save(game, g);
    return g.version;
  }
  async publish(game: string, version: number) {
    this.bus.emit(game, version);
  }
  subscribe(game: string, onVersion: (v: number) => void) {
    this.bus.on(game, onVersion);
    return () => {
      this.bus.off(game, onVersion);
    };
  }
}

// ---------------------------------------------------------------------------

export function createFileStore(dir: string | null): Store {
  return new FileStore(dir);
}

const g = globalThis as unknown as { __candlefairStore?: Store };

export function getStore(): Store {
  if (g.__candlefairStore) return g.__candlefairStore;
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    g.__candlefairStore = new UpstashStore(new Redis({ url, token, automaticDeserialization: false }));
  } else {
    if (process.env.VERCEL) throw new Error("Upstash Redis isn't configured. Connect it in the Vercel project's Storage tab.");
    g.__candlefairStore = new FileStore(path.join(process.cwd(), ".data", "games"));
  }
  return g.__candlefairStore;
}
