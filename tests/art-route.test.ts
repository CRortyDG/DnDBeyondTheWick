// Reveal-only art over the web: the route itself must refuse it until the DM shows it.
import { describe, expect, it } from "vitest";
import { handleApi } from "@/server/api";
import { sha256 } from "@/server/auth";
import { execute } from "@/server/game";
import { createMemoryStore } from "@/server/store";
import { seedGame } from "@/shared/seed";

const G = "candlefair";
const DM_KEY = "the-real-dm-key";

async function table() {
  const store = createMemoryStore();
  await store.overwrite(G, seedGame(G), []);
  await store.setDmKeyHash(G, sha256(DM_KEY));
  const get = (path: string, key?: string) => handleApi(new Request(`http://room${path}`, { headers: key ? { "x-candlefair-key": key } : {} }), store);
  return { store, get };
}

describe("/api/art", () => {
  it("refuses a hidden picture to phones, the TV and wrong keys, and doesn't let it be cached", async () => {
    const { get } = await table();
    for (const r of [await get(`/api/art/merchant-sigil?game=${G}`), await get(`/api/art/merchant-sigil?game=${G}&player=tv`), await get(`/api/art/merchant-sigil?game=${G}&player=player-1`), await get(`/api/art/merchant-sigil?game=${G}`, "a-guess")]) {
      expect(r.status).toBe(404);
      expect(r.headers.get("Cache-Control")).toBe("no-store");
      expect(await r.text()).not.toContain("<svg");
    }
  });

  it("serves it to the DM any time", async () => {
    const { get } = await table();
    const r = await get(`/api/art/merchant-sigil?game=${G}`, DM_KEY);
    expect(r.status).toBe(200);
    expect(r.headers.get("Content-Type")).toBe("image/svg+xml");
    expect(await r.text()).toContain("<svg");
  });

  it("serves it to everyone once its handout is on the TV, keeps it for rereading, and stops when the DM takes it back", async () => {
    const { store, get } = await table();
    await execute(store, G, { role: "dm" }, { type: "scene.show", sceneId: "s-symbol" });
    const shown = await get(`/api/art/merchant-sigil?game=${G}`);
    expect(shown.status).toBe(200);
    expect(await shown.text()).toContain("<svg");
    await execute(store, G, { role: "dm" }, { type: "scene.show", sceneId: "s-board" });
    // A shown handout stays in the party's Discover, picture and all.
    expect((await get(`/api/art/merchant-sigil?game=${G}`)).status).toBe(200);
    await execute(store, G, { role: "dm" }, { type: "scene.known", sceneId: "s-symbol", known: false });
    expect((await get(`/api/art/merchant-sigil?game=${G}`)).status).toBe(404);
  });

  it("refuses art that doesn't exist, and a campaign that doesn't exist", async () => {
    const { get } = await table();
    expect((await get(`/api/art/nope?game=${G}`)).status).toBe(404);
    expect((await get("/api/art/merchant-sigil?game=nowhere")).status).toBe(404);
  });
});
