// Campaign creation, per-campaign DM keys and the API wrapper the room runs.
import { describe, expect, it } from "vitest";
import { handleApi } from "@/server/api";
import { isDmKey, makeCampaignCode, newDmKey, sha256 } from "@/server/auth";
import { execute } from "@/server/game";
import { createMemoryStore } from "@/server/store";

const KEY = "header-key";

function call(store: ReturnType<typeof createMemoryStore>, path: string, opts: { method?: string; key?: string; body?: unknown } = {}) {
  const req = new Request(`http://room${path}`, {
    method: opts.method ?? "GET",
    headers: { ...(opts.key ? { "x-candlefair-key": opts.key } : {}), "content-type": "application/json" },
    ...(opts.body !== undefined ? { body: JSON.stringify(opts.body) } : {}),
  });
  return handleApi(req, store);
}

async function newCampaign(game = "wick") {
  const store = createMemoryStore();
  const key = newDmKey();
  const res = await call(store, `/internal/create?game=${game}`, { method: "POST", body: { dmKeyHash: sha256(key), name: "Our Table" } });
  expect(res.status).toBe(200);
  return { store, key, game };
}

describe("starting a campaign", () => {
  it("seeds the campaign, names it, and stores only the key's hash", async () => {
    const { store, key, game } = await newCampaign();
    const { state } = await store.read(game);
    expect(state!.name).toBe("Our Table");
    expect(await store.dmKeyHash(game)).toBe(sha256(key));
    expect(JSON.stringify(state)).not.toContain(key);
  });

  it("refuses to create over an existing campaign", async () => {
    const { store, game } = await newCampaign();
    const again = await call(store, `/internal/create?game=${game}`, { method: "POST", body: { dmKeyHash: sha256("someone-else") } });
    expect(again.status).toBe(409);
    expect(await store.dmKeyHash(game)).not.toBe(sha256("someone-else"));
  });

  it("makes readable codes and long random keys", () => {
    expect(makeCampaignCode()).toMatch(/^[a-z2-9]{7}$/);
    expect(newDmKey().length).toBeGreaterThanOrEqual(32);
    expect(newDmKey()).not.toBe(newDmKey());
  });
});

describe("the DM key belongs to one campaign", () => {
  it("opens its own campaign and nobody else's", async () => {
    const a = await newCampaign("aaa");
    const b = await newCampaign("bbb");
    expect((await call(a.store, `/api/export?game=aaa`, { key: a.key })).status).toBe(200);
    expect((await call(a.store, `/api/export?game=aaa`, { key: b.key })).status).toBe(401);
    expect((await call(a.store, `/api/export?game=aaa`)).status).toBe(401);
    expect(isDmKey(a.key, null)).toBe(false);
  });

  it("changing the key locks out the old one", async () => {
    const { store, key, game } = await newCampaign();
    const r = await call(store, `/api/rekey?game=${game}`, { method: "POST", key });
    const { key: fresh } = (await r.json()) as { key: string };
    expect((await call(store, `/api/export?game=${game}`, { key })).status).toBe(401);
    expect((await call(store, `/api/export?game=${game}`, { key: fresh })).status).toBe(200);
    expect((await call(store, `/api/rekey?game=${game}`, { method: "POST", key: KEY })).status).toBe(401);
  });

  it("only the DM can run DM commands", async () => {
    const { store, key, game } = await newCampaign();
    const body = { type: "door.set", closed: true };
    expect((await call(store, `/api/command?game=${game}&player=DM`, { method: "POST", body })).status).toBe(401);
    expect((await call(store, `/api/command?game=${game}&player=DM`, { method: "POST", key, body })).status).toBe(200);
  });
});

describe("saves", () => {
  it("a command that changes nothing doesn't save or wake the screens", async () => {
    const { store, game } = await newCampaign();
    const dm = { role: "dm" as const };
    await execute(store, game, dm, { type: "door.set", closed: true });
    const v = await store.version(game);
    const published = store.published.length;
    await execute(store, game, dm, { type: "door.set", closed: true });
    expect(await store.version(game)).toBe(v);
    expect(store.published.length).toBe(published);
  });
});
