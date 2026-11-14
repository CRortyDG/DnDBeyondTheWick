import { upgrade } from "@/shared/migrate";
import type { GameState, LedgerEntry } from "@/shared/types";
import { withSeedEpisodes } from "./seed-episodes";
import { withSeedJobNotes } from "./seed-jobs";

/**
 * Where a game lives. One JSON document (state), a version number, an
 * append-only ledger and the hash of the campaign's DM key. commit() is
 * all-or-nothing: it only writes if nobody else committed since we read, so
 * gold can't be spent twice.
 *
 * In production each campaign is its own Cloudflare Durable Object
 * (worker/room.ts), which implements this interface over its SQLite storage.
 * The in-memory store below is for tests.
 */
export interface Store {
  read(game: string): Promise<{ state: GameState | null; version: number }>;
  version(game: string): Promise<number>;
  /** Returns the new version, or null if someone else committed first. */
  commit(game: string, expected: number, state: GameState, ledger: LedgerEntry[]): Promise<number | null>;
  ledger(game: string): Promise<LedgerEntry[]>;
  /** Replace a game wholesale (create / import / reset). */
  overwrite(game: string, state: GameState, ledger: LedgerEntry[]): Promise<number>;
  /** Tell every open screen that the game changed. */
  publish(game: string, version: number): Promise<void>;
  /** sha256 of the campaign's DM key, or null if none is set. */
  dmKeyHash(game: string): Promise<string | null>;
  setDmKeyHash(game: string, hash: string): Promise<void>;
}

/** What a stored document looks like once read: migrated, with the seed run sheets added. */
export function hydrate(state: GameState | null): GameState | null {
  return withSeedJobNotes(withSeedEpisodes(state ? upgrade(state) : null));
}

interface MemoryGame {
  state: GameState | null;
  version: number;
  ledger: LedgerEntry[];
  dmKeyHash: string | null;
}

/** Tests only. One process, nothing saved. */
export class MemoryStore implements Store {
  private games = new Map<string, MemoryGame>();
  readonly published: { game: string; version: number }[] = [];

  private load(game: string): MemoryGame {
    let g = this.games.get(game);
    if (!g) {
      g = { state: null, version: 0, ledger: [], dmKeyHash: null };
      this.games.set(game, g);
    }
    return g;
  }

  async read(game: string) {
    const g = this.load(game);
    return { state: hydrate(g.state ? structuredClone(g.state) : null), version: g.version };
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
    return g.version;
  }
  async publish(game: string, version: number) {
    this.published.push({ game, version });
  }
  async dmKeyHash(game: string) {
    return this.load(game).dmKeyHash;
  }
  async setDmKeyHash(game: string, hash: string) {
    this.load(game).dmKeyHash = hash;
  }
}

export function createMemoryStore(): MemoryStore {
  return new MemoryStore();
}
