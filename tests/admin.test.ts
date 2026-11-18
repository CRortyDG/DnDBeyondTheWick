// The site owner's admin console: the key, read-only rooms, the registry, the guesses.
import { describe, expect, it } from "vitest";
import { handleAdmin, isAdminKey, type AdminDeps, type AdminRoom, type Registry } from "@/server/admin";
import { storyFor, summarise } from "@/server/adminStory";
import { MISS_HEADER } from "@/server/api";
import { ADMIN_HEADER, guess, type AdminTag, type ListedRow, type RegistryRow, type RoomFacts } from "@/shared/admin";
import { seedGame } from "@/shared/seed";
import type { GameState } from "@/shared/types";

const SECRET = "s".repeat(40);
const FACTS: RoomFacts = { touchedAt: 5_000, activeDays: ["2026-11-15", "2026-11-16"], openScreens: 2, imageFiles: 3, storageBytes: 100 };

class MemRegistry implements Registry {
  rows = new Map<string, RegistryRow & { net?: string }>();
  async list(ip: string): Promise<ListedRow[]> {
    return [...this.rows.values()].map(({ net, ...r }) => ({ ...r, sameNetwork: net === ip }));
  }
  async add(rows: Omit<RegistryRow, "addedAt">[], at: number) {
    let n = 0;
    for (const r of rows)
      if (!this.rows.has(r.code)) {
        this.rows.set(r.code, { ...r, addedAt: at });
        n++;
      }
    return n;
  }
  async label(code: string, tag: AdminTag | null, note?: string) {
    const r = this.rows.get(code);
    if (!r) return false;
    r.tag = tag;
    if (note !== undefined) r.note = note;
    return true;
  }
}

function game(name = "The Bell"): GameState {
  const g = seedGame("t");
  g.name = name;
  g.players[0].character = "Brin Ashcombe";
  g.players[0].lastSeenAt = 4_000;
  g.notes = [{ id: "n1", sessionId: null, authorId: "dm", authorName: "DM", text: "The bell rang twice.", tags: [], createdAt: 3_000 }];
  return g;
}

function roomOf(code: string, g: GameState | null, practice = false): AdminRoom {
  return {
    adminSummary: async () => ({ ...summarise(code, g, FACTS), practice, game: g ? code : null }),
    adminStory: async () => (g && !practice ? storyFor(code, g, FACTS) : null),
  };
}

function deps(games: Record<string, GameState | null>, extra: Partial<AdminDeps> = {}): AdminDeps & { registry: MemRegistry } {
  return { secret: SECRET, registry: new MemRegistry(), room: (c) => roomOf(c, games[c] ?? null), ip: "1.2.3.4", now: 10_000, ...extra } as AdminDeps & { registry: MemRegistry };
}

const req = (path: string, body?: unknown, key: string | null = SECRET) =>
  new Request(`https://x${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: key === null ? {} : { [ADMIN_HEADER]: key },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

describe("the admin key", () => {
  it("is off without a long enough secret, and says nothing then", async () => {
    for (const secret of [undefined, "short"]) {
      const res = await handleAdmin(req("/api/admin/campaigns"), deps({}, { secret }));
      expect(res.status).toBe(404);
      expect(res.headers.has(MISS_HEADER)).toBe(true);
    }
  });
  it("turns away a wrong or missing key and counts it as a miss", async () => {
    for (const key of [null, "", "s".repeat(39), SECRET + "x"]) {
      const res = await handleAdmin(req("/api/admin/campaigns", undefined, key), deps({}));
      expect(res.status).toBe(401);
      expect(res.headers.has(MISS_HEADER)).toBe(true);
    }
    expect(isAdminKey(SECRET, SECRET)).toBe(true);
  });
  it("refuses another site's page even with the key", async () => {
    const r = req("/api/admin/campaigns");
    r.headers.set("Sec-Fetch-Site", "cross-site");
    expect((await handleAdmin(r, deps({}))).status).toBe(403);
  });
});

describe("the console", () => {
  it("lists the registry and summarises each room", async () => {
    const d = deps({ abc: game() });
    await d.registry.add([{ code: "abc", foundBy: "create" }], 1);
    const list = (await (await handleAdmin(req("/api/admin/campaigns"), d)).json()) as { rows: ListedRow[] };
    expect(list.rows.map((r) => r.code)).toEqual(["abc"]);
    const res = (await (await handleAdmin(req("/api/admin/summaries", { codes: ["abc", "gone"] }), d)).json()) as { summaries: Record<string, unknown>[] };
    expect(res.summaries[0]).toMatchObject({ code: "abc", exists: true, name: "The Bell", notes: 1, openScreens: 2, activeDayCount: 2 });
    expect(res.summaries[0]).not.toHaveProperty("practice");
    expect(res.summaries[1]).toMatchObject({ code: "gone", exists: false });
  });

  it("reads a story without keys or key hashes", async () => {
    const g = game();
    g.players[0].keyHash = "deadbeef".repeat(8);
    const res = await handleAdmin(req("/api/admin/story?code=abc"), deps({ abc: g }));
    const text = await res.text();
    expect(res.status).toBe(200);
    expect(text).toContain("The bell rang twice.");
    expect(text).toContain("Brin Ashcombe");
    expect(text).not.toContain("deadbeef");
    expect(text).not.toMatch(/keyHash|dmKey/i);
    expect((await handleAdmin(req("/api/admin/story?code=nope"), deps({}))).status).toBe(404);
  });

  it("never changes a game: there is no route that writes one", async () => {
    const g = game();
    const before = JSON.stringify(g);
    const d = deps({ abc: g });
    for (const p of ["/api/admin/summaries", "/api/admin/story?code=abc", "/api/admin/command", "/api/admin/delete"]) await handleAdmin(req(p, { codes: ["abc"] }), d);
    expect(JSON.stringify(g)).toBe(before);
  });

  it("labels only codes in the list", async () => {
    const d = deps({ abc: game() });
    await d.registry.add([{ code: "abc", foundBy: "create" }], 1);
    expect((await handleAdmin(req("/api/admin/label", { code: "abc", tag: "mine", note: "my demo" }), d)).status).toBe(200);
    expect(d.registry.rows.get("abc")).toMatchObject({ tag: "mine", note: "my demo" });
    expect((await handleAdmin(req("/api/admin/label", { code: "zzz", tag: "test" }), d)).status).toBe(404);
    expect((await handleAdmin(req("/api/admin/label", { code: "abc", tag: "bogus" }), d)).status).toBe(400);
  });

  it("adds codes only for real live campaigns (not empty rooms, not practice copies)", async () => {
    const games = { real: game(), empty: null };
    const d = deps(games, { room: (c) => (c === "prac" ? roomOf(c, game(), true) : roomOf(c, games[c as keyof typeof games] ?? null)) });
    const r = (await (await handleAdmin(req("/api/admin/add", { codes: ["real", "empty", "prac"] }), d)).json()) as { added: number };
    expect(r.added).toBe(1);
    expect([...d.registry.rows.keys()]).toEqual(["real"]);
  });

  it("scans image folders and the Cloudflare list a page at a time", async () => {
    const d = deps(
      { a: game(), b: game() },
      {
        imageCodes: async (cursor) => (cursor ? { codes: ["b"] } : { codes: ["a", "nope"], cursor: "next" }),
        cloudflareIds: async () => ({ ids: ["id-b"] }),
        roomById: () => roomOf("b", game()),
      },
    );
    const p1 = (await (await handleAdmin(req("/api/admin/scan", { source: "images" }), d)).json()) as { added: number; cursor: string | null };
    expect(p1).toMatchObject({ added: 1, cursor: "next" });
    const p2 = (await (await handleAdmin(req("/api/admin/scan", { source: "images", cursor: "next" }), d)).json()) as { added: number; cursor: string | null };
    expect(p2).toMatchObject({ added: 1, cursor: null });
    const p3 = (await (await handleAdmin(req("/api/admin/scan", { source: "cloudflare" }), d)).json()) as { added: number };
    expect(p3.added).toBe(0);
    expect((await handleAdmin(req("/api/admin/scan", { source: "cloudflare" }), deps({}))).status).toBe(501);
  });

  it("caps a batch", async () => {
    const codes = Array.from({ length: 41 }, (_, i) => `c${i}`);
    expect((await handleAdmin(req("/api/admin/summaries", { codes }), deps({}))).status).toBe(400);
  });
});

describe("telling yours from theirs", () => {
  const DAY = 86_400_000;
  const now = 100 * DAY;
  const base = (g: GameState, facts: Partial<RoomFacts> = {}) => summarise("x", g, { ...FACTS, activeDays: [], ...facts });

  it("a campaign this browser DMs, or made from this network, is yours", () => {
    expect(guess(base(game()), { onDevice: true, now }).guess).toBe("yours");
    expect(guess(base(game()), { sameNetwork: true, now }).guess).toBe("yours");
  });
  it("a test-sounding name with nobody playing is a test", () => {
    const g = game("Preset check (safe to ignore)");
    g.players = [];
    expect(guess(base(g), { now }).guess).toBe("test");
  });
  it("players on their phones over several days looks real", () => {
    const g = game("Curse of the Drowned King");
    g.createdAt = now - 20 * DAY;
    for (const p of g.players) p.lastSeenAt = now - DAY;
    g.sessions = [{ id: "s1", number: 1, title: "One", startedAt: now - 10 * DAY, endedAt: now - 10 * DAY + 3600_000, attendeeIds: g.players.map((p) => p.id) }];
    const s = base(g, { activeDays: ["a", "b", "c"], touchedAt: now - DAY });
    expect(s.playersSeen).toBeGreaterThanOrEqual(2);
    expect(guess(s, { now }).guess).toBe("real");
  });
  it("an empty room is idle", () => {
    expect(guess(summarise("x", null, FACTS)).guess).toBe("idle");
  });
});
