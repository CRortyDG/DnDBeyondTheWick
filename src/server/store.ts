import { withSeedEntries } from "./seed-entries";
import { upgrade, withAssets } from "@/shared/migrate";
import { syncShopEntries } from "@/shared/discovery";
import type { GameState, LedgerEntry } from "@/shared/types";
import { withSeedEpisodes } from "./seed-episodes";
import { withSeedJobNotes } from "./seed-jobs";
import { withSeedMonsters } from "./seed-monsters";
import { withSeedCompanions } from "./seed-companions";
import { withSeedStory } from "./seed-story";
import { withSeedOffscript } from "./seed-offscript";
import type { PresetStore } from "./presets";
import type { UsageReport } from "@/shared/hosting";
import { MemoryBuilderStore, type BuilderStore } from "./builderStore";

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
  /** Saved presets (shared by every campaign). Missing: presets are off (some tests). */
  presets?: PresetStore;
  /** Safety snapshots: the whole game and ledger, kept in the campaign (the newest SNAPSHOTS_KEPT). */
  saveSnapshot?(game: string, reason: string, at: number, data: SnapshotData): Promise<void>;
  listSnapshots?(game: string): Promise<SnapshotInfo[]>;
  loadSnapshot?(game: string, id: number): Promise<SnapshotData | null>;
  /** What this campaign has used of its host (Cloudflare only). Missing: not counted here. */
  usage?(game: string): Promise<UsageReport>;

  // Practice mode (see practice.ts). A practice room is its own store, reachable only with the DM key.
  /** True in a practice room. Read synchronously, before anything else. */
  practiceMode?: boolean;
  /** Make this store the practice copy: game, ledger, the DM key hash, and the live game as it was (to compare at the end). */
  beginPractice?(game: string, state: GameState, ledger: LedgerEntry[], dmKeyHash: string, base: GameState): Promise<number>;
  /** The live game as it was when practice began. */
  practiceBase?(game: string): Promise<GameState | null>;
  /** Delete the practice copy and hang up its screens. */
  endPractice?(game: string): Promise<void>;
  /** Worldbuilder keys, drafts and Activity, kept beside the game (never in it). Missing: no Worldbuilder. */
  builder?: BuilderStore;
}

/** How many safety snapshots a campaign keeps. */
export const SNAPSHOTS_KEPT = 10;

export interface SnapshotInfo {
  id: number;
  at: number;
  reason: string;
}
export interface SnapshotData {
  state: GameState;
  ledger: LedgerEntry[];
}

/** What a stored document looks like once read: migrated, with the seed run sheets and monsters added. */
export function hydrate(state: GameState | null): GameState | null {
  const out = withAssets(withSeedCompanions(withSeedOffscript(withSeedStory(withSeedEntries(withSeedMonsters(withSeedJobNotes(withSeedEpisodes(state ? upgrade(state) : null))))))));
  // Every shop gets its Discover entry (older games had none).
  return out ? syncShopEntries(out) : out;
}

interface MemoryGame {
  state: GameState | null;
  version: number;
  ledger: LedgerEntry[];
  dmKeyHash: string | null;
  snapshots?: (SnapshotInfo & { json: string })[];
  nextSnap?: number;
}

/** Tests only. One process, nothing saved. */
export class MemoryStore implements Store {
  private games = new Map<string, MemoryGame>();
  readonly published: { game: string; version: number }[] = [];
  presets?: PresetStore;
  practiceMode?: boolean;
  private bases = new Map<string, string>();

  constructor(opts: { practice?: boolean } = {}) {
    if (opts.practice) this.practiceMode = true;
  }

  async beginPractice(game: string, state: GameState, ledger: LedgerEntry[], dmKeyHash: string, base: GameState) {
    if (!this.practiceMode) throw new Error("Not a practice store");
    this.load(game).dmKeyHash = dmKeyHash;
    this.bases.set(game, JSON.stringify(base));
    return this.overwrite(game, state, ledger);
  }
  async practiceBase(game: string) {
    const b = this.bases.get(game);
    return b ? (JSON.parse(b) as GameState) : null;
  }
  async endPractice(game: string) {
    this.games.delete(game);
    this.bases.delete(game);
  }
  /** One campaign per test store is enough for the Worldbuilder tests. */
  builder: MemoryBuilderStore = new MemoryBuilderStore();

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
  async saveSnapshot(game: string, reason: string, at: number, data: SnapshotData) {
    const g = this.load(game);
    g.snapshots ??= [];
    g.nextSnap = (g.nextSnap ?? 0) + 1;
    g.snapshots.push({ id: g.nextSnap, at, reason, json: JSON.stringify(data) });
    g.snapshots = g.snapshots.slice(-SNAPSHOTS_KEPT);
  }
  async listSnapshots(game: string) {
    return [...(this.load(game).snapshots ?? [])].reverse().map(({ id, at, reason }) => ({ id, at, reason }));
  }
  async loadSnapshot(game: string, id: number) {
    const x = this.load(game).snapshots?.find((s) => s.id === id);
    return x ? (JSON.parse(x.json) as SnapshotData) : null;
  }
}

export function createMemoryStore(): MemoryStore {
  return new MemoryStore();
}
