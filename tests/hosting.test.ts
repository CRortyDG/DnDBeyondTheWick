// Hosting costs: Cloudflare usage priced at Workers Paid rates.
import { describe, expect, it } from "vitest";
import { addUsage, billable, busiest, costLines, freeDayFit, freeDayLines, nextUtcMidnight, nextUtcMonth, projectMonthly, ZERO_USAGE, type UsageCounts } from "@/shared/hosting";

// About one 4-hour night for a table of 7 (docs/capacity-report.md).
const NIGHT: UsageCounts = { ...ZERO_USAGE, workerRequests: 412, roomRequests: 380, socketMessages: 140, pings: 4032, events: 424, rowsRead: 11_073, rowsWritten: 312, uploads: 4, uploadBytes: 3_276_800 };
const MB = 1024 * 1024;

describe("hosting costs", () => {
  it("bills incoming socket messages 20:1, and pings only in the worst case", () => {
    expect(billable(NIGHT).doRequests).toBe(380 + 140 / 20);
    expect(billable(NIGHT, true).doRequests).toBe(380 + (140 + 4032) / 20);
  });

  it("prices one campaign's month with nothing included", () => {
    const month = addUsage(addUsage(addUsage(addUsage(ZERO_USAGE, NIGHT), NIGHT), NIGHT), NIGHT);
    const lines = Object.fromEntries(costLines(month, 2 * MB, 13 * MB).map((l) => [l.id, l]));
    expect(lines.worker.share).toBeCloseTo((1648 / 1e6) * 0.3, 8);
    expect(lines.written.share).toBeCloseTo((1248 / 1e6) * 1, 8);
    expect(lines.r2.share).toBeCloseTo((13 / 1024) * 0.015, 8);
    expect(lines.worker.ofIncluded).toBeCloseTo(1648 / 10_000_000, 10);
  });

  it("projects the $5 base when everything fits, and overage past it", () => {
    const month = { ...NIGHT };
    expect(projectMonthly(month, 2 * MB, 13 * MB, 10).total).toBe(5);
    const big = projectMonthly(month, 2 * MB, 13 * MB, 100_000);
    // 41.2M worker requests: 32M over, at $0.30 a million.
    expect(big.lines.find((l) => l.id === "worker")!.cost).toBeCloseTo(32 * 0.3, 6);
    expect(big.total).toBeGreaterThan(5);
    expect(big.lines[0].cost).toBeGreaterThanOrEqual(big.lines.at(-1)!.cost);
  });

  it("says how many busy days fit on the free tier, and which limit is first", () => {
    const fit = freeDayFit(NIGHT, 2 * MB);
    expect(fit.limit).toBe("Worker requests");
    expect(fit.campaigns).toBe(Math.floor(100_000 / 412));
    expect(freeDayFit(ZERO_USAGE, 0).campaigns).toBe(Infinity);
  });
});

describe("hosting costs: daily limits start over each day", () => {
  it("checks one day against the free tier's daily limits, not a month's total", () => {
    const lines = Object.fromEntries(freeDayLines(NIGHT, 2 * MB).map((l) => [l.id, l]));
    expect(lines.worker.used).toBeCloseTo(412 / 100_000, 10);
    expect(lines.written.used).toBeCloseTo(312 / 100_000, 10);
    expect(lines.sqlite.used).toBeCloseTo(2 / (5 * 1024), 10);
    // A month of nights is still compared day by day: the busiest one.
    const days = [
      { day: "2026-11-01", counts: NIGHT },
      { day: "2026-11-08", counts: addUsage(NIGHT, NIGHT) },
      { day: "2026-11-15", counts: NIGHT },
    ];
    expect(busiest(days)!.day).toBe("2026-11-08");
    expect(busiest([])).toBeNull();
  });

  it("knows when the day and the month start over (UTC)", () => {
    const t = Date.UTC(2026, 10, 30, 23, 59);
    expect(new Date(nextUtcMidnight(t)).toISOString()).toBe("2026-12-01T00:00:00.000Z");
    expect(new Date(nextUtcMonth(t)).toISOString()).toBe("2026-12-01T00:00:00.000Z");
    expect(new Date(nextUtcMidnight(Date.UTC(2026, 10, 18, 0, 0))).toISOString()).toBe("2026-11-19T00:00:00.000Z");
  });
});
