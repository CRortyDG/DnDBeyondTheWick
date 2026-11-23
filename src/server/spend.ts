/**
 * Site-wide spending guards. Cloudflare has no hard spend cap on R2, so the app
 * keeps its own: a storage ceiling for the whole bucket (under the free 10 GB),
 * a daily cap on writes (under the free million a month), and a switch that
 * turns uploads off. The registry Durable Object holds the counts
 * (worker/registry.ts); the decisions are here so they can be tested.
 *
 * Also here: a per-address daily budget for calls that reach a campaign's room,
 * and the daily caps on new campaigns.
 */

const GB = 1024 * 1024 * 1024;

/** R2's free storage is 10 GB-month. Stop well short of it. */
export const DEFAULT_CEILING_BYTES = 8 * GB;
/** R2's free writes are 1,000,000 a month (about 33,000 a day). Stop short of that too. */
export const DEFAULT_WRITES_PER_DAY = 25_000;
/** Re-count the bucket this often, so failed uploads and deletions don't drift the total. */
export const RECOUNT_EVERY_MS = 24 * 60 * 60 * 1000;

export interface SpendLimits {
  ceilingBytes: number;
  writesPerDay: number;
}

/** Limits from the Worker's vars (R2_CEILING_GB, R2_WRITES_PER_DAY), falling back to the defaults. Never above the free tier. */
export function spendLimits(vars: { R2_CEILING_GB?: string; R2_WRITES_PER_DAY?: string }): SpendLimits {
  const gb = Number(vars.R2_CEILING_GB);
  const writes = Number(vars.R2_WRITES_PER_DAY);
  return {
    ceilingBytes: Number.isFinite(gb) && gb > 0 ? Math.floor(Math.min(gb, 10) * GB) : DEFAULT_CEILING_BYTES,
    writesPerDay: Number.isFinite(writes) && writes > 0 ? Math.min(Math.floor(writes), 33_000) : DEFAULT_WRITES_PER_DAY,
  };
}

/** What the registry knows about the bucket. */
export interface StorageTally {
  bytes: number;
  files: number;
  /** Writes (stored files) on `day`. */
  writes: number;
  /** UTC day, YYYY-MM-DD. */
  day: string;
  /** The site owner turned uploads off in the admin console. */
  off: boolean;
}

export interface StorageAsk {
  bytes: number;
  /** Files to store (each one an R2 write). */
  files: number;
  /** The address asking, when known: each address gets its own share of the day (ADDRESS_* below). */
  ip?: string;
}

export type StorageAnswer = { ok: true } | { ok: false; code: "uploads-off" | "storage-full" | "writes-today" | "address-today"; error: string };

/**
 * One address's share of a day's uploads. The site-wide caps above protect the
 * bill, but whoever fills them pauses uploads for every DM, so no one address
 * may use more than a slice: a busy prep day is a few hundred files.
 */
export const ADDRESS_FILES_PER_DAY = 2_500;
export const ADDRESS_BYTES_PER_DAY = 1.5 * GB;

/** What this address has stored today. */
export interface AddressUse {
  files: number;
  bytes: number;
}

/** May this address store this much more today? Null if so. */
export function addressProblem(used: AddressUse, ask: StorageAsk): Exclude<StorageAnswer, { ok: true }> | null {
  if (used.files + ask.files > ADDRESS_FILES_PER_DAY || used.bytes + ask.bytes > ADDRESS_BYTES_PER_DAY) {
    return { ok: false, code: "address-today", error: "That's a lot of uploading from here today. Try again tomorrow, or ask on another connection." };
  }
  return null;
}

/** An answer that means "not today" rather than "not at all": a 429. */
export const isDailyRefusal = (code: string) => code === "writes-today" || code === "address-today";

export const utcDayOf = (now: number) => new Date(now).toISOString().slice(0, 10);

/** May this upload go ahead? Pure: the registry adds it to the tally when it does. */
export function decideStorage(t: StorageTally, ask: StorageAsk, limits: SpendLimits, now: number): StorageAnswer {
  if (t.off) return { ok: false, code: "uploads-off", error: "Uploads are paused on this site for now. Everything already uploaded still works." };
  if (t.bytes + ask.bytes > limits.ceilingBytes) {
    return { ok: false, code: "storage-full", error: "This site's image space is full, so uploads are paused. Everything already uploaded still works." };
  }
  const writes = t.day === utcDayOf(now) ? t.writes : 0;
  if (writes + ask.files > limits.writesPerDay) {
    return { ok: false, code: "writes-today", error: "This site has stored as many files as it can today. Try again tomorrow." };
  }
  return { ok: true };
}

/** The tally after an upload is allowed. */
export function addToTally(t: StorageTally, ask: StorageAsk, now: number): StorageTally {
  const day = utcDayOf(now);
  return { ...t, bytes: t.bytes + ask.bytes, files: t.files + ask.files, writes: (t.day === day ? t.writes : 0) + ask.files, day };
}

// ---------------------------------------------------------------- new campaigns

/** New campaigns a day from the whole site. A busy day is a handful; this stops a script filling storage with rooms. */
export const CREATES_PER_DAY = 300;
/** New campaigns a day from one address. */
export const CREATES_PER_ADDRESS_PER_DAY = 20;

export function createProblem(siteToday: number, addressToday: number): string | null {
  if (addressToday >= CREATES_PER_ADDRESS_PER_DAY) return "That's a lot of new campaigns from here today. Try again tomorrow.";
  if (siteToday >= CREATES_PER_DAY) return "This site has started as many new campaigns as it can today. Try again tomorrow.";
  return null;
}

// ---------------------------------------------------------------- daily budget per address

/**
 * Calls that reach a campaign's room, per address per UTC day. A whole table on
 * one Wi-Fi used about 3,000 on its first night, and a DM prepping all day
 * might add a couple of thousand more. Over this, the address gets a polite
 * "slow down" until midnight UTC and costs the rooms nothing more.
 */
export const DEFAULT_ROOM_CALLS_PER_DAY = 20_000;

/**
 * Counts per address per day in this Worker instance's memory, so the count is
 * right however many calls arrive at once. Instances don't share memory, so the
 * Worker also saves the count to the data centre's cache now and then
 * (`shouldSave`) and starts a new instance's count from there (`seed`). Rough on
 * purpose: it only has to tell a script from a table.
 */
export class DailyCounter {
  private counts = new Map<string, { day: string; n: number; saved: number }>();
  constructor(
    readonly limit: number,
    private readonly maxKeys = 5000,
    readonly saveEvery = 50,
  ) {}

  /** True if this key needs its saved count loaded before counting. */
  needsSeed(key: string, now: number): boolean {
    const c = this.counts.get(key);
    return !c || c.day !== utcDayOf(now);
  }

  seed(key: string, n: number, now: number) {
    if (this.counts.size >= this.maxKeys) this.counts.clear();
    const prev = this.counts.get(key);
    const day = utcDayOf(now);
    const base = prev && prev.day === day ? prev.n : 0;
    this.counts.set(key, { day, n: Math.max(base, n), saved: Math.max(base, n) });
  }

  /** One more call. Returns the count so far today. */
  add(key: string, now: number): number {
    const day = utcDayOf(now);
    let c = this.counts.get(key);
    if (!c || c.day !== day) {
      if (this.counts.size >= this.maxKeys) this.counts.clear();
      c = { day, n: 0, saved: 0 };
      this.counts.set(key, c);
    }
    c.n++;
    return c.n;
  }

  over(key: string, now: number): boolean {
    const c = this.counts.get(key);
    return !!c && c.day === utcDayOf(now) && c.n > this.limit;
  }

  /** Time to write this key's count to the cache (and remember that it was). */
  shouldSave(key: string): number | null {
    const c = this.counts.get(key);
    if (!c || c.n - c.saved < this.saveEvery) return null;
    c.saved = c.n;
    return c.n;
  }
}

/** Seconds until the next midnight UTC: how long a day's count is kept. */
export function secondsToUtcMidnight(now: number): number {
  const d = new Date(now);
  const next = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1);
  return Math.max(60, Math.ceil((next - now) / 1000));
}
