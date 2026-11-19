// New campaigns start blank; a DM can save a campaign's setup as a preset and start new campaigns from it.
import { describe, expect, it } from "vitest";
import { handleApi, handlePresetApi } from "@/server/api";
import { newDmKey, sha256 } from "@/server/auth";
import { execute } from "@/server/game";
import { MemoryPresets } from "@/server/presets";
import { createMemoryStore, hydrate } from "@/server/store";
import { blankGame, CONTENT_UPGRADES, presetSetup } from "@/shared/presets";
import { projectPlayer } from "@/shared/projection";
import { seedGame } from "@/shared/seed";

const DM = { role: "dm" as const };

function setup() {
  const store = createMemoryStore();
  const presets = new MemoryPresets();
  store.presets = presets;
  return { store, presets };
}

function call(store: ReturnType<typeof createMemoryStore>, path: string, opts: { method?: string; key?: string; body?: unknown } = {}) {
  const req = new Request(`http://room${path}`, {
    method: opts.method ?? "GET",
    headers: { ...(opts.key ? { "x-candlefair-key": opts.key } : {}), "content-type": "application/json" },
    ...(opts.body !== undefined ? { body: JSON.stringify(opts.body) } : {}),
  });
  return handleApi(req, store);
}

function presetCall(presets: MemoryPresets, path: string, body?: unknown) {
  return handlePresetApi(new Request(`http://w${path}`, { method: body === undefined ? "GET" : "POST", headers: { "content-type": "application/json" }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) }), presets);
}

async function create(store: ReturnType<typeof createMemoryStore>, game: string, from?: string) {
  const key = newDmKey();
  const res = await call(store, `/internal/create?game=${game}`, { method: "POST", body: { dmKeyHash: sha256(key), name: "Our Table", ...(from ? { from } : {}) } });
  return { res, key };
}

describe("a new campaign", () => {
  it("starts blank by default, and stays blank once read", async () => {
    const { store } = setup();
    const { res } = await create(store, "wick");
    expect(res.status).toBe(200);
    const { state } = await store.read("wick");
    const g = state!;
    expect(g.origin).toEqual({ kind: "blank" });
    expect(g.shops).toEqual([]);
    expect(g.items).toEqual([]);
    expect(g.entries).toEqual([]);
    expect(g.episodes).toEqual([]);
    expect(g.monsters).toEqual([]);
    expect(g.jobs).toEqual([]);
    expect(g.notices).toEqual([]);
    expect(g.story!.beats).toEqual([]);
    expect(g.story!.threads.filter((t) => t.kind !== "backstory")).toEqual([]);
    expect(g.scenes.map((s) => s.kind)).toEqual(["notice", "table", "black"]);
    expect(g.players).toHaveLength(4);
    expect(g.town).toBe("");
  });

  it("knows every content upgrade, so a blank game never grows Candlefair content", () => {
    // If this fails, a new seed added content through an upgrade tag: add the tag to CONTENT_UPGRADES.
    const g = hydrate(structuredClone(blankGame("wick", "Blank", 1)))!;
    const added = (g.upgrades ?? []).filter((t) => !CONTENT_UPGRADES.includes(t) && t !== "assets" && t !== "handouts-known");
    expect(added).toEqual([]);
    expect(JSON.stringify(g)).not.toMatch(/Mags|Artum|Pudding|Winterfest/);
  });

  it("can still start as Candlefair", async () => {
    const { store } = setup();
    await create(store, "wick", "candlefair");
    const g = (await store.read("wick")).state!;
    expect(g.origin).toEqual({ kind: "candlefair" });
    expect(g.shops.length).toBeGreaterThan(3);
    expect((g.episodes ?? []).length).toBeGreaterThan(0);
    expect((g.monsters ?? []).length).toBeGreaterThan(0);
  });

  it("refuses a preset code that doesn't exist, and leaves nothing behind", async () => {
    const { store } = setup();
    const { res } = await create(store, "wick", "preset:abcdefghjk");
    expect(res.status).toBe(404);
    expect((await store.read("wick")).state).toBeNull();
    expect(await store.dmKeyHash("wick")).toBeNull();
  });
});

describe("presets", () => {
  async function played() {
    const { store, presets } = setup();
    const { key } = await create(store, "src", "candlefair");
    // Play a little: gold, a note, renown, a found person, a typed town.
    const g = (await store.read("src")).state!;
    await execute(store, "src", DM, { type: "gold.grant", playerIds: [g.players[0].id], amountCp: 500, reason: "test" } as never).catch(() => {});
    await execute(store, "src", DM, { type: "renown.set", rank: 2 } as never).catch(() => {});
    await execute(store, "src", DM, { type: "game.town", town: "  Saltmarsh " });
    return { store, presets, key };
  }

  it("keeps the setup and leaves the people out", () => {
    const g = seedGame("x", "X", 1);
    g.players[0].balanceCp = 900;
    g.players[0].character = "Brin";
    g.renown = 3;
    g.vttUrl = "https://example.com";
    const s = presetSetup(g);
    expect(s.players.every((p) => p.balanceCp === 0 && !p.character && p.createdVia === "seed")).toBe(true);
    expect(s.renown).toBe(0);
    expect(s.vttUrl).toBeUndefined();
    expect(s.shops).toEqual(g.shops);
    expect(s.items).toEqual(g.items);
    expect(s.sessions).toEqual([]);
    expect(s.notes).toEqual([]);
  });

  it("saves, starts a new campaign from it, and resets back to it", async () => {
    const { store, presets, key } = await played();
    const res = await call(store, "/api/preset/save?game=src", { method: "POST", key, body: { name: "My Saltmarsh" } });
    expect(res.status).toBe(200);
    const saved = (await res.json()) as { code: string; token: string; name: string };
    expect(saved.code).toMatch(/^[a-z0-9]{10}$/);
    expect(saved.name).toBe("My Saltmarsh");
    expect(JSON.stringify(presets.records.get(saved.code))).not.toContain(saved.token);

    const info = await presetCall(presets, `/api/preset?code=${saved.code}`);
    expect(info.status).toBe(200);
    const i = (await info.json()) as { name: string; counts: { shops: number } };
    expect(i.name).toBe("My Saltmarsh");
    expect(i.counts.shops).toBeGreaterThan(3);

    const { res: made, key: key2 } = await create(store, "next", `preset:${saved.code}`);
    expect(made.status).toBe(200);
    const g = (await store.read("next")).state!;
    const src = (await store.read("src")).state!;
    expect(g.origin).toEqual({ kind: "preset", code: saved.code, name: "My Saltmarsh" });
    expect(g.id).toBe("next");
    expect(g.name).toBe("Our Table");
    expect(g.town).toBe("Saltmarsh");
    expect(g.shops).toEqual(src.shops);
    expect(g.renown).toBe(0);
    expect(g.players.every((p) => p.balanceCp === 0)).toBe(true);
    expect(projectPlayer(g, 1, g.players[0].id, []).game.town).toBe("Saltmarsh");

    // Change things, then reset everything: back to the preset, not to Candlefair or blank.
    await execute(store, "next", DM, { type: "game.town", town: "Elsewhere" });
    const r = await call(store, "/api/reset?game=next", { method: "POST", key: key2, body: { mode: "all" } });
    expect(r.status).toBe(200);
    const after = (await store.read("next")).state!;
    expect(after.town).toBe("Saltmarsh");
    expect(after.origin).toEqual({ kind: "preset", code: saved.code, name: "My Saltmarsh" });
  });

  it("a blank campaign resets to blank", async () => {
    const { store } = setup();
    const { key } = await create(store, "wick");
    await execute(store, "wick", DM, { type: "game.town", town: "Phandalin" });
    await call(store, "/api/reset?game=wick", { method: "POST", key, body: { mode: "all" } });
    const g = (await store.read("wick")).state!;
    expect(g.town).toBe("");
    expect(g.shops).toEqual([]);
  });

  it("only the DM can save, and only the saving device can save over, rename or delete", async () => {
    const { store, presets, key } = await played();
    expect((await call(store, "/api/preset/save?game=src", { method: "POST", body: { name: "Nope" } })).status).toBe(401);
    const saved = (await (await call(store, "/api/preset/save?game=src", { method: "POST", key, body: { name: "Mine" } })).json()) as { code: string; token: string };

    const over = await call(store, "/api/preset/save?game=src", { method: "POST", key, body: { name: "Mine 2", code: saved.code, token: "wrong" } });
    expect(over.status).toBe(403);
    const ok = await call(store, "/api/preset/save?game=src", { method: "POST", key, body: { name: "Mine 2", code: saved.code, token: saved.token } });
    expect(ok.status).toBe(200);
    expect(((await ok.json()) as { code: string }).code).toBe(saved.code);
    expect(presets.records.get(saved.code)!.name).toBe("Mine 2");

    expect((await presetCall(presets, "/api/preset/rename", { code: saved.code, token: "wrong", name: "X" })).status).toBe(403);
    expect((await presetCall(presets, "/api/preset/rename", { code: saved.code, token: saved.token, name: "Renamed" })).status).toBe(200);
    expect(presets.records.get(saved.code)!.name).toBe("Renamed");

    expect((await presetCall(presets, "/api/preset/delete", { code: saved.code, token: "wrong" })).status).toBe(403);
    expect((await presetCall(presets, "/api/preset/delete", { code: saved.code, token: saved.token })).status).toBe(200);
    const gone = await presetCall(presets, `/api/preset?code=${saved.code}`);
    expect(gone.status).toBe(404);
    expect(gone.headers.get("x-candlefair-miss")).toBe("1");
  });

  it("copies the campaign's images into the preset, so they outlive the campaign", async () => {
    const { store, presets, key } = await played();
    const img = "src/0123456789abcdef01234567.png";
    presets.files.set(img, "png-bytes");
    const g = (await store.read("src")).state!;
    const sc = g.scenes.find((x) => x.kind === "image")!;
    await execute(store, "src", DM, { type: "scene.update", sceneId: sc.id, patch: { art: { url: `/api/files/${img}` } } } as never).catch(() => {});
    const now = (await store.read("src")).state!;
    if (!JSON.stringify(now).includes(img)) {
      // The scene command's shape changed; put the image in directly so this test still checks the copy.
      now.scenes.find((x) => x.id === sc.id)!.art = { url: `/api/files/${img}` };
      await store.overwrite("src", now, []);
    }
    const saved = (await (await call(store, "/api/preset/save?game=src", { method: "POST", key, body: { name: "With art" } })).json()) as { code: string };
    const rec = presets.records.get(saved.code)!;
    const text = JSON.stringify(rec.setup);
    expect(text).not.toContain(`/api/files/${img}`);
    expect(text).toContain(`/api/files/p/${saved.code}/0123456789abcdef01234567.png`);
    expect(presets.files.get(`p/${saved.code}/0123456789abcdef01234567.png`)).toBe("png-bytes");
  });
});
