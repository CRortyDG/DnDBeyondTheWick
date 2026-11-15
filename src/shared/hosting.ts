/**
 * What running the app costs on Cloudflare, for the DM's Hosting costs box.
 *
 * Each campaign's room counts its own usage (worker/room.ts) by UTC day and
 * month. This file turns those counts into money at Cloudflare's published
 * Workers Paid prices. Nothing here bills anyone: it's so the DM can see where
 * the cost of hosting would go if the free tier ever ran out.
 *
 * Prices and limits checked on developers.cloudflare.com on 2026-11-15:
 *   https://developers.cloudflare.com/workers/platform/pricing/
 *   https://developers.cloudflare.com/durable-objects/platform/pricing/
 *   https://developers.cloudflare.com/r2/pricing/
 * Update PRICES_CHECKED when you check them again.
 */

export const PRICES_CHECKED = "2026-11-15";

/** One period's counts (a UTC day or month). Every field is a running total. */
export interface UsageCounts {
  /** Requests that ran the Worker for this campaign (API calls, live connections, uploads). */
  workerRequests: number;
  /** HTTP requests and live connections that reached the campaign's room. */
  roomRequests: number;
  /** Messages a screen sent that woke the room (its key, once per connection). Billed 20:1. */
  socketMessages: number;
  /** Keep-alive "ping" messages, answered without waking the room. Whether these are billed isn't documented. */
  pings: number;
  /** Times the room did any work: a request, a message, a closed screen, the monthly cleanup check. */
  events: number;
  /** SQLite rows read and written, as Cloudflare counts them. */
  rowsRead: number;
  rowsWritten: number;
  /** Images and clips stored in R2 (each is one Class A write). */
  uploads: number;
  uploadBytes: number;
}

export const ZERO_USAGE: UsageCounts = {
  workerRequests: 0,
  roomRequests: 0,
  socketMessages: 0,
  pings: 0,
  events: 0,
  rowsRead: 0,
  rowsWritten: 0,
  uploads: 0,
  uploadBytes: 0,
};

export const USAGE_FIELDS = Object.keys(ZERO_USAGE) as (keyof UsageCounts)[];

export function addUsage(a: UsageCounts, b: Partial<UsageCounts>): UsageCounts {
  const out = { ...a };
  for (const k of USAGE_FIELDS) out[k] += b[k] ?? 0;
  return out;
}

/** What /api/usage returns. */
export interface UsageReport {
  /** UTC month ("2026-11") and its counts. */
  month: string;
  thisMonth: UsageCounts;
  /** UTC day ("2026-11-15") and its counts. */
  today: string;
  todayCounts: UsageCounts;
  /** The busiest day this month, for the free-tier check. */
  busiestDay: { day: string; counts: UsageCounts } | null;
  /** Every month counted so far, oldest first. */
  months: { month: string; counts: UsageCounts }[];
  /** Held right now: the campaign's SQLite database and its images in R2. */
  storageBytes: number;
  imageBytes: number;
  imageFiles: number;
  /** The first UTC day counted for this campaign. */
  since: string | null;
}

export const utcDay = (t: number) => new Date(t).toISOString().slice(0, 10);
export const utcMonth = (t: number) => new Date(t).toISOString().slice(0, 7);

// ---------------------------------------------------------------- prices

/** Billed duration: an event in production takes about 30 ms (CAPACITY_REPORT.md), at 128 MB. */
export const MS_PER_EVENT = 30;
const GB_PER_ROOM = 0.125;
/** The Worker's own CPU per request: about 1 ms (scripts/capacity/cpu-bench.ts). */
export const CPU_MS_PER_REQUEST = 1;
const GB = 1024 ** 3;

export const PAID = {
  base: 5,
  workerRequests: { included: 10_000_000, perMillion: 0.3 },
  cpuMs: { included: 30_000_000, perMillion: 0.02 },
  doRequests: { included: 1_000_000, perMillion: 0.15 },
  doGbSeconds: { included: 400_000, perMillion: 12.5 },
  rowsRead: { included: 25_000_000_000, perMillion: 0.001 },
  rowsWritten: { included: 50_000_000, perMillion: 1 },
  /** GB-month. */
  sqliteStorage: { included: 5, perGb: 0.2 },
  r2Storage: { included: 10, perGb: 0.015 },
  r2ClassA: { included: 1_000_000, perMillion: 4.5 },
} as const;

/** Workers Free, per UTC day (storage is a total). Going over fails requests until midnight UTC. */
export const FREE_DAILY = {
  workerRequests: 100_000,
  doRequests: 100_000,
  doGbSeconds: 13_000,
  rowsRead: 5_000_000,
  rowsWritten: 100_000,
} as const;
export const FREE_SQLITE_GB = 5;

/** The billed amounts behind a period's counts. */
export function billable(u: UsageCounts, pingsBilled = false) {
  return {
    workerRequests: u.workerRequests,
    cpuMs: u.workerRequests * CPU_MS_PER_REQUEST,
    doRequests: u.roomRequests + (u.socketMessages + (pingsBilled ? u.pings : 0)) / 20,
    doGbSeconds: (u.events * MS_PER_EVENT * GB_PER_ROOM) / 1000,
    rowsRead: u.rowsRead,
    rowsWritten: u.rowsWritten,
    r2ClassA: u.uploads,
  };
}

export interface CostLine {
  id: string;
  label: string;
  /** Plain-words amount ("12,300 requests"). */
  amount: string;
  /** This usage at the overage rate, with nothing included: its honest share of a bill. */
  share: number;
  /** Fraction of what Workers Paid includes each month. */
  ofIncluded: number;
}

const per = (n: number, million: number) => (n / 1_000_000) * million;
const n0 = (n: number) => Math.round(n).toLocaleString("en-US");

export function mb(bytes: number): string {
  if (bytes >= GB) return `${(bytes / GB).toFixed(2)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(0, Math.round(bytes / 1024))} KB`;
}

/** One campaign's month, line by line, priced with nothing included. */
export function costLines(u: UsageCounts, storageBytes: number, imageBytes: number, pingsBilled = false): CostLine[] {
  const b = billable(u, pingsBilled);
  const sqlGb = storageBytes / GB;
  const r2Gb = imageBytes / GB;
  return [
    { id: "worker", label: "Worker requests", amount: `${n0(b.workerRequests)} requests`, share: per(b.workerRequests, PAID.workerRequests.perMillion), ofIncluded: b.workerRequests / PAID.workerRequests.included },
    { id: "cpu", label: "Worker CPU time", amount: `~${n0(b.cpuMs)} ms`, share: per(b.cpuMs, PAID.cpuMs.perMillion), ofIncluded: b.cpuMs / PAID.cpuMs.included },
    { id: "do", label: "Room requests", amount: `${n0(b.doRequests)} billed`, share: per(b.doRequests, PAID.doRequests.perMillion), ofIncluded: b.doRequests / PAID.doRequests.included },
    { id: "duration", label: "Room awake time", amount: `~${b.doGbSeconds.toFixed(1)} GB-s`, share: per(b.doGbSeconds, PAID.doGbSeconds.perMillion), ofIncluded: b.doGbSeconds / PAID.doGbSeconds.included },
    { id: "read", label: "Rows read", amount: `${n0(b.rowsRead)} rows`, share: per(b.rowsRead, PAID.rowsRead.perMillion), ofIncluded: b.rowsRead / PAID.rowsRead.included },
    { id: "written", label: "Rows written", amount: `${n0(b.rowsWritten)} rows`, share: per(b.rowsWritten, PAID.rowsWritten.perMillion), ofIncluded: b.rowsWritten / PAID.rowsWritten.included },
    { id: "sqlite", label: "Saved game data", amount: mb(storageBytes), share: sqlGb * PAID.sqliteStorage.perGb, ofIncluded: sqlGb / PAID.sqliteStorage.included },
    { id: "r2", label: "Images and clips", amount: mb(imageBytes), share: r2Gb * PAID.r2Storage.perGb, ofIncluded: r2Gb / PAID.r2Storage.included },
    { id: "r2a", label: "Image uploads", amount: `${n0(b.r2ClassA)} files`, share: per(b.r2ClassA, PAID.r2ClassA.perMillion), ofIncluded: b.r2ClassA / PAID.r2ClassA.included },
  ];
}

/** Overage past an allowance, rounded up to the next whole unit as Cloudflare bills it. */
const over = (used: number, included: number, unit: number, price: number) => Math.ceil(Math.max(0, used - included) / unit) * price;

export interface Projection {
  total: number;
  /** Lines over $0, largest first. */
  lines: { id: string; label: string; cost: number }[];
}

/**
 * The whole account's monthly bill on Workers Paid if `campaigns` campaigns all
 * used what this one did: the $5 base plus anything past the included amounts.
 */
export function projectMonthly(u: UsageCounts, storageBytes: number, imageBytes: number, campaigns: number, pingsBilled = false): Projection {
  const b = billable(u, pingsBilled);
  const n = Math.max(0, campaigns);
  const lines = [
    { id: "worker", label: "Worker requests", cost: over(b.workerRequests * n, PAID.workerRequests.included, 1_000_000, PAID.workerRequests.perMillion) },
    { id: "cpu", label: "Worker CPU time", cost: over(b.cpuMs * n, PAID.cpuMs.included, 1_000_000, PAID.cpuMs.perMillion) },
    { id: "do", label: "Room requests", cost: over(b.doRequests * n, PAID.doRequests.included, 1_000_000, PAID.doRequests.perMillion) },
    { id: "duration", label: "Room awake time", cost: over(b.doGbSeconds * n, PAID.doGbSeconds.included, 1_000_000, PAID.doGbSeconds.perMillion) },
    { id: "read", label: "Rows read", cost: over(b.rowsRead * n, PAID.rowsRead.included, 1_000_000, PAID.rowsRead.perMillion) },
    { id: "written", label: "Rows written", cost: over(b.rowsWritten * n, PAID.rowsWritten.included, 1_000_000, PAID.rowsWritten.perMillion) },
    { id: "sqlite", label: "Saved game data", cost: Math.max(0, (storageBytes * n) / GB - PAID.sqliteStorage.included) * PAID.sqliteStorage.perGb },
    { id: "r2", label: "Images and clips", cost: Math.max(0, (imageBytes * n) / GB - PAID.r2Storage.included) * PAID.r2Storage.perGb },
    { id: "r2a", label: "Image uploads", cost: over(b.r2ClassA * n, PAID.r2ClassA.included, 1_000_000, PAID.r2ClassA.perMillion) },
  ]
    .filter((l) => l.cost > 0)
    .sort((a, b) => b.cost - a.cost);
  return { total: PAID.base + lines.reduce((s, l) => s + l.cost, 0), lines };
}

/**
 * How many campaigns as busy as this one's busiest day would fit in one day on
 * Workers Free, and which limit runs out first. Infinity when nothing was used.
 */
export function freeDayFit(day: UsageCounts, storageBytes: number): { campaigns: number; limit: string } {
  const b = billable(day);
  const fits: [string, number][] = [
    ["Worker requests", FREE_DAILY.workerRequests / b.workerRequests],
    ["Room requests", FREE_DAILY.doRequests / b.doRequests],
    ["Room awake time", FREE_DAILY.doGbSeconds / b.doGbSeconds],
    ["Rows read", FREE_DAILY.rowsRead / b.rowsRead],
    ["Rows written", FREE_DAILY.rowsWritten / b.rowsWritten],
    ["Saved game data (5 GB total)", (FREE_SQLITE_GB * GB) / storageBytes],
  ];
  const [limit, campaigns] = fits.filter(([, v]) => Number.isFinite(v)).sort((a, b) => a[1] - b[1])[0] ?? ["", Infinity];
  return { campaigns: Math.floor(campaigns), limit };
}

export function dollars(n: number): string {
  if (n === 0) return "$0";
  if (n < 0.01) return "<$0.01";
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
