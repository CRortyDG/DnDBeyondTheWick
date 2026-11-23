// Spending guards: R2 has no spend cap, so the app keeps one (src/server/spend.ts).
import { describe, expect, it } from "vitest";
import { handleAdmin, type AdminDeps, type Registry } from "@/server/admin";
import { handleApi } from "@/server/api";
import { newDmKey, sha256 } from "@/server/auth";
import { MemoryPresets } from "@/server/presets";
import {
  addToTally,
  createProblem,
  CREATES_PER_ADDRESS_PER_DAY,
  CREATES_PER_DAY,
  DailyCounter,
  decideStorage,
  DEFAULT_CEILING_BYTES,
  DEFAULT_WRITES_PER_DAY,
  secondsToUtcMidnight,
  spendLimits,
  type StorageTally,
} from "@/server/spend";
import { createMemoryStore } from "@/server/store";
import { ADMIN_HEADER, type StorageStatus } from "@/shared/admin";

const GB = 1024 ** 3;
const NOON = Date.UTC(2026, 10, 23, 12);
const limits = spendLimits({});
const empty: StorageTally = { bytes: 0, files: 0, writes: 0, day: "2026-11-23", off: false };

describe("site-wide R2 limits", () => {
  it("defaults to 8 GB and 25,000 writes a day, and never goes past the free tier", () => {
    expect(limits).toEqual({ ceilingBytes: DEFAULT_CEILING_BYTES, writesPerDay: DEFAULT_WRITES_PER_DAY });
    expect(DEFAULT_CEILING_BYTES).toBe(8 * GB);
    expect(spendLimits({ R2_CEILING_GB: "50", R2_WRITES_PER_DAY: "999999" })).toEqual({ ceilingBytes: 10 * GB, writesPerDay: 33_000 });
    expect(spendLimits({ R2_CEILING_GB: "2", R2_WRITES_PER_DAY: "500" })).toEqual({ ceilingBytes: 2 * GB, writesPerDay: 500 });
    expect(spendLimits({ R2_CEILING_GB: "nope", R2_WRITES_PER_DAY: "-3" })).toEqual(limits);
  });

  it("lets uploads through until the ceiling, then stops them", () => {
    expect(decideStorage(empty, { bytes: 5 * 1024 * 1024, files: 1 }, limits, NOON).ok).toBe(true);
    const nearly = { ...empty, bytes: 8 * GB - 1024 };
    expect(decideStorage(nearly, { bytes: 1024, files: 1 }, limits, NOON).ok).toBe(true);
    const full = decideStorage(nearly, { bytes: 1025, files: 1 }, limits, NOON);
    expect(full).toMatchObject({ ok: false, code: "storage-full" });
  });

  it("caps files stored a day, and the count starts again at midnight UTC", () => {
    const busy = { ...empty, writes: DEFAULT_WRITES_PER_DAY - 10 };
    expect(decideStorage(busy, { bytes: 1, files: 10 }, limits, NOON).ok).toBe(true);
    expect(decideStorage(busy, { bytes: 1, files: 11 }, limits, NOON)).toMatchObject({ ok: false, code: "writes-today" });
    const tomorrow = NOON + 24 * 3600 * 1000;
    expect(decideStorage(busy, { bytes: 1, files: 100 }, limits, tomorrow).ok).toBe(true);
    expect(addToTally(busy, { bytes: 1, files: 3 }, tomorrow)).toMatchObject({ writes: 3, day: "2026-11-24", files: 3 });
  });

  it("the off switch stops every upload, even a small one", () => {
    expect(decideStorage({ ...empty, off: true }, { bytes: 1, files: 1 }, limits, NOON)).toMatchObject({ ok: false, code: "uploads-off" });
  });

  it("adds what it allows", () => {
    expect(addToTally(empty, { bytes: 100, files: 4 }, NOON)).toEqual({ bytes: 100, files: 4, writes: 4, day: "2026-11-23", off: false });
  });
});

describe("new campaigns a day", () => {
  it("caps one address and the whole site", () => {
    expect(createProblem(0, 0)).toBeNull();
    expect(createProblem(0, CREATES_PER_ADDRESS_PER_DAY - 1)).toBeNull();
    expect(createProblem(0, CREATES_PER_ADDRESS_PER_DAY)).toMatch(/from here today/);
    expect(createProblem(CREATES_PER_DAY, 0)).toMatch(/this site/i);
  });
});

describe("daily budget per address", () => {
  it("counts every call, however many arrive at once, and says when one address is over", () => {
    const c = new DailyCounter(100);
    for (let i = 0; i < 100; i++) c.add("1.1.1.1", NOON);
    expect(c.over("1.1.1.1", NOON)).toBe(false);
    c.add("1.1.1.1", NOON);
    expect(c.over("1.1.1.1", NOON)).toBe(true);
    expect(c.over("2.2.2.2", NOON)).toBe(false);
  });

  it("a whole table's night (about 3,000 calls on one Wi-Fi) is nowhere near the default", () => {
    const c = new DailyCounter(20_000);
    for (let i = 0; i < 6_000; i++) c.add("home", NOON);
    expect(c.over("home", NOON)).toBe(false);
  });

  it("starts from a saved count, and forgets it the next day", () => {
    const c = new DailyCounter(100);
    expect(c.needsSeed("x", NOON)).toBe(true);
    c.seed("x", 100, NOON);
    expect(c.needsSeed("x", NOON)).toBe(false);
    c.add("x", NOON);
    expect(c.over("x", NOON)).toBe(true);
    const tomorrow = NOON + 24 * 3600 * 1000;
    expect(c.needsSeed("x", tomorrow)).toBe(true);
    c.add("x", tomorrow);
    expect(c.over("x", tomorrow)).toBe(false);
  });

  it("saves every 50 calls, not every call", () => {
    const c = new DailyCounter(1000);
    const saves: number[] = [];
    for (let i = 0; i < 120; i++) {
      c.add("x", NOON);
      const s = c.shouldSave("x");
      if (s !== null) saves.push(s);
    }
    expect(saves).toEqual([50, 100]);
  });

  it("keeps the count until midnight UTC", () => {
    expect(secondsToUtcMidnight(NOON)).toBe(12 * 3600);
    expect(secondsToUtcMidnight(Date.UTC(2026, 10, 23, 23, 59, 50))).toBe(60);
  });
});

describe("new presets per campaign", () => {
  function call(store: ReturnType<typeof createMemoryStore>, path: string, key: string, body: unknown) {
    return handleApi(new Request(`http://room${path}`, { method: "POST", headers: { "x-candlefair-key": key, "content-type": "application/json" }, body: JSON.stringify(body) }), store);
  }

  it("stops new ones at the campaign's share, but saving over its own still works", async () => {
    const store = createMemoryStore();
    store.presets = new MemoryPresets();
    let left = 2;
    (store as { takePresetSlot?: () => Promise<boolean> }).takePresetSlot = async () => left-- > 0;
    const key = newDmKey();
    await call(store, "/internal/create?game=src", key, { dmKeyHash: sha256(key), name: "Ours" });
    const a = (await (await call(store, "/api/preset/save?game=src", key, { name: "One" })).json()) as { code: string; token: string };
    expect((await call(store, "/api/preset/save?game=src", key, { name: "Two" })).status).toBe(200);
    const third = await call(store, "/api/preset/save?game=src", key, { name: "Three" });
    expect(third.status).toBe(429);
    expect(((await third.json()) as { code: string }).code).toBe("preset-limit");
    expect((await call(store, "/api/preset/save?game=src", key, { name: "One again", code: a.code, token: a.token })).status).toBe(200);
  });
});

describe("admin console storage switch", () => {
  const SECRET = "s".repeat(40);
  function deps() {
    const status: StorageStatus = { bytes: 3 * GB, files: 40, writes: 7, day: "2026-11-23", off: false, ceilingBytes: 8 * GB, writesPerDay: 25_000, countedAt: null };
    const registry: Registry = {
      list: async () => [],
      add: async () => 0,
      label: async () => true,
      storageStatus: async () => ({ ...status }),
      storageSetOff: async (off) => ((status.off = off), { ...status }),
      storageRecount: async () => ((status.countedAt = 1), { ...status }),
    };
    return { secret: SECRET, registry, room: () => ({}) as never, ip: "1.2.3.4" } satisfies AdminDeps;
  }
  const req = (body?: unknown, key = SECRET) =>
    new Request("https://x/api/admin/storage", { method: body === undefined ? "GET" : "POST", headers: { [ADMIN_HEADER]: key }, body: body === undefined ? undefined : JSON.stringify(body) });

  it("shows the tally, turns uploads off and on, and re-counts", async () => {
    const d = deps();
    const get = (await (await handleAdmin(req(), d)).json()) as { storage: StorageStatus };
    expect(get.storage.bytes).toBe(3 * GB);
    const off = (await (await handleAdmin(req({ uploads: "off" }), d)).json()) as { storage: StorageStatus };
    expect(off.storage.off).toBe(true);
    const on = (await (await handleAdmin(req({ uploads: "on", recount: true }), d)).json()) as { storage: StorageStatus };
    expect(on.storage).toMatchObject({ off: false, countedAt: 1 });
    expect((await handleAdmin(req({}), d)).status).toBe(400);
  });

  it("needs the admin key", async () => {
    expect((await handleAdmin(req({ uploads: "off" }, "wrong".repeat(10)), deps())).status).toBe(401);
  });
});
