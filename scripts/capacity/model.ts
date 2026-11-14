/**
 * Turns per-session numbers (from sim.ts) into free-tier capacity and
 * Workers Paid cost. Prices and limits checked on developers.cloudflare.com
 * on 2026-11-14; see CAPACITY_REPORT.md for the pages.
 *
 *   npx tsx scripts/capacity/model.ts [path/to/sim-output.json]
 *
 * With no file it uses the numbers recorded in CAPACITY_REPORT.md.
 */
import { readFileSync } from "node:fs";

type Session = {
  label: string;
  workerRequests: number;
  workerCpuMs: number; // per request, front door only
  doRequests: number; // billed: HTTP + upgrades + incoming WS messages / 20
  doGbSeconds: number;
  rowsRead: number;
  rowsWritten: number;
  r2ClassA: number;
  r2ClassB: number;
  r2Bytes: number; // new image bytes per session
};

// Extra per night the simulation leaves out: the 7 first page loads (hello + socket)
// and a few reloads. Small, but real.
const PAGE_LOADS = { worker: 20, doRequests: 20, rowsWritten: 7 };
// Billed duration: local wall time understates production (cold starts, real disks).
// Assume 30 ms per room event, about 6x what wrangler dev measured.
const MS_PER_EVENT = 30;
// Keep-alive pings: 7 screens x 144 an hour x 4 h. Answered by setWebSocketAutoResponse,
// so they never reach the room. Cloudflare documents them as free of duration; whether they
// count as billed incoming messages (20:1) isn't stated. Worst case adds this many DO requests:
const PING_WORST_CASE_DO = Math.ceil((7 * 144 * 4) / 20);

function fromSim(file: string, label: string): Session {
  const o = JSON.parse(readFileSync(file, "utf8"));
  const events = o.durableObject.httpAndUpgradeRequests + o.durableObject.wsMessagesThatReachedRoom;
  return {
    label,
    workerRequests: o.worker.requests + PAGE_LOADS.worker,
    workerCpuMs: 1,
    doRequests: o.durableObject.billedRequests + PAGE_LOADS.doRequests,
    doGbSeconds: (events * MS_PER_EVENT) / 1000 * 0.125,
    rowsRead: o.durableObject.rowsRead,
    rowsWritten: o.durableObject.rowsWritten + PAGE_LOADS.rowsWritten,
    r2ClassA: o.r2.classA_puts,
    r2ClassB: o.r2.classB_gets,
    r2Bytes: o.r2.storedBytes,
  };
}

// Recorded from `sim.ts --hours 4` (cold) and `sim.ts --hours 4 --ledger 1300` on 2026-11-14.
const RECORDED: Session[] = [
  { label: "New campaign", workerRequests: 412, workerCpuMs: 1, doRequests: 387, doGbSeconds: 1.59, rowsRead: 11_073, rowsWritten: 312, r2ClassA: 4, r2ClassB: 28, r2Bytes: 3_276_800 },
  { label: "~20 nights in (1,300 ledger rows)", workerRequests: 412, workerCpuMs: 1, doRequests: 387, doGbSeconds: 1.59, rowsRead: 394_571, rowsWritten: 312, r2ClassA: 4, r2ClassB: 28, r2Bytes: 3_276_800 },
];

const FREE_DAILY = { workerRequests: 100_000, doRequests: 100_000, doGbSeconds: 13_000, rowsRead: 5_000_000, rowsWritten: 100_000 };
const FREE_MONTHLY_R2 = { classA: 1_000_000, classB: 10_000_000, gbMonth: 10 };

function freeCapacity(s: Session) {
  const per = {
    "Worker requests": FREE_DAILY.workerRequests / s.workerRequests,
    "DO requests": FREE_DAILY.doRequests / s.doRequests,
    "DO requests (pings billed, worst case)": FREE_DAILY.doRequests / (s.doRequests + PING_WORST_CASE_DO),
    "DO duration": FREE_DAILY.doGbSeconds / s.doGbSeconds,
    "SQLite rows read": FREE_DAILY.rowsRead / s.rowsRead,
    "SQLite rows written": FREE_DAILY.rowsWritten / s.rowsWritten,
  };
  return Object.entries(per).sort((a, b) => a[1] - b[1]);
}

/** Round billable overage up to the next whole unit, as Cloudflare does. */
const over = (used: number, included: number, unit: number, price: number) => Math.ceil(Math.max(0, used - included) / unit) * price;

function paidMonthly(s: Session, perDay: number, retainMonths = 6, pingsBilled = false) {
  const n = perDay * 30;
  const workerReq = s.workerRequests * n;
  const cpu = workerReq * s.workerCpuMs;
  const doReq = (s.doRequests + (pingsBilled ? PING_WORST_CASE_DO : 0)) * n;
  const gbs = s.doGbSeconds * n;
  const rr = s.rowsRead * n;
  const rw = s.rowsWritten * n;
  // R2: images stay until their campaign sits idle for 180 days, so storage builds up for about six months.
  const r2Gb = (s.r2Bytes * n * retainMonths) / 1e9;
  const lines = {
    base: 5,
    workerRequests: over(workerReq, 10e6, 1e6, 0.3),
    workerCpu: over(cpu, 30e6, 1e6, 0.02),
    doRequests: over(doReq, 1e6, 1e6, 0.15),
    doDuration: over(gbs, 400_000, 1e6, 12.5),
    rowsRead: over(rr, 25e9, 1e6, 0.001),
    rowsWritten: over(rw, 50e6, 1e6, 1),
    r2Storage: Math.max(0, r2Gb - FREE_MONTHLY_R2.gbMonth) * 0.015,
    r2ClassA: over(s.r2ClassA * n, FREE_MONTHLY_R2.classA, 1e6, 4.5),
    r2ClassB: over(s.r2ClassB * n, FREE_MONTHLY_R2.classB, 1e6, 0.36),
  };
  const total = Object.values(lines).reduce((a, b) => a + b, 0);
  return { total, lines, r2Gb };
}

const sessions = process.argv[2] ? [fromSim(process.argv[2], process.argv[2])] : RECORDED;
for (const s of sessions) {
  console.log(`\n== ${s.label}`);
  console.log("Free tier sessions per UTC day, by limit (lowest first):");
  for (const [k, v] of freeCapacity(s)) console.log(`  ${k.padEnd(42)} ${Math.floor(v).toLocaleString()}`);
  console.log(`R2 free storage (10 GB) holds about ${Math.floor(10e9 / s.r2Bytes).toLocaleString()} nights of images; Class A allows ${Math.floor(1e6 / s.r2ClassA).toLocaleString()} nights a month.`);
  console.log("Workers Paid, per month (images kept ~6 months):");
  for (const d of [10, 100, 1000, 2400]) {
    const p = paidMonthly(s, d);
    const worst = paidMonthly(s, d, 6, true);
    const big = Object.entries(p.lines).filter(([k, v]) => v > 0 && k !== "base").map(([k, v]) => `${k} $${v.toFixed(2)}`).join(", ");
    console.log(`  ${String(d).padStart(5)}/day: $${p.total.toFixed(2)} (pings billed: $${worst.total.toFixed(2)})  [${big || "all within included usage"}]  R2 held ${p.r2Gb.toFixed(0)} GB`);
  }
}
