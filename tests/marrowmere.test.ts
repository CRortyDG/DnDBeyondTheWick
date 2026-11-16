// The premade starter: The Bell under Marrowmere. Its own content only, nothing from Candlefair, and no spoilers on the TV.
import { readFileSync, existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { handleApi } from "@/server/api";
import { newDmKey, sha256 } from "@/server/auth";
import { execute } from "@/server/game";
import { createMemoryStore } from "@/server/store";
import { projectTv } from "@/shared/projection";

const DM = { role: "dm" as const };

async function create(store: ReturnType<typeof createMemoryStore>, game: string) {
  const key = newDmKey();
  const req = new Request(`http://room/internal/create?game=${game}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ dmKeyHash: sha256(key), from: "marrowmere" }) });
  return { res: await handleApi(req, store), key };
}

describe("the Marrowmere starter", () => {
  it("creates a campaign with its own town, people, shops, monsters and episode", async () => {
    const store = createMemoryStore();
    const { res } = await create(store, "marrow01");
    expect(res.status).toBe(200);
    const g = (await store.read("marrow01")).state!;
    expect(g.origin).toEqual({ kind: "marrowmere" });
    expect(g.name).toBe("The Bell under Marrowmere");
    expect(g.town).toBe("Marrowmere");
    expect(g.shops.map((s) => s.name)).toContain("Reedwater Market");
    expect(g.entries!.map((e) => e.name)).toEqual(expect.arrayContaining(["Bettany Crane", "Reeve Tobias Marsh", "Pell", "The Drowned Belfry"]));
    expect(g.monsters!.map((m) => m.name)).toEqual(["Reedlurk", "Fog Moth"]);
    expect(g.episodes![0].title).toBe("The Bell That Rang Twice");
    // Nothing from the Candlefair seed sneaks in when the game is read.
    expect(JSON.stringify(g)).not.toMatch(/Candlefair|Flickering Candle|Artum|Mags Wick|Pudding/);
  });

  it("points every picture at a file that ships with the app", async () => {
    const store = createMemoryStore();
    await create(store, "marrow02");
    const g = (await store.read("marrow02")).state!;
    const urls = [...g.scenes.map((s) => s.art?.url), ...(g.arrival?.slides ?? []).map((s) => s.image)].filter(Boolean) as string[];
    expect(urls.length).toBeGreaterThan(8);
    for (const u of urls) expect(existsSync(`public${u}`), u).toBe(true);
  });

  it("runs its episode: every beat's action resolves", async () => {
    const store = createMemoryStore();
    await create(store, "marrow03");
    await execute(store, "marrow03", DM, { type: "run.start", episodeId: "ep1" } as never).catch(() => undefined);
    const g = (await store.read("marrow03")).state!;
    const refs = g.episodes![0].beats.flatMap((b) => b.actions).filter((a) => a.type === "show" || a.type === "reveal" || a.type === "fact").map((a) => (a as { ref: string }).ref);
    const kinds: Record<string, string> = { person: "person", place: "place" };
    for (const r of refs) {
      const [k, slug] = r.split("/");
      if (k === "prop" || k === "map") expect(g.scenes.some((s) => s.slug === slug), r).toBe(true);
      else expect(g.entries!.some((e) => e.kind === kinds[k] && e.slug === slug), r).toBe(true);
    }
  });

  it("keeps hidden people and reveal scenes off the TV", async () => {
    const store = createMemoryStore();
    await create(store, "marrow04");
    const { state, version } = await store.read("marrow04");
    const tv = JSON.stringify(projectTv(state!, version));
    expect(tv).not.toContain("s-pell");
    expect(tv).not.toContain("/art/marrowmere/pell.jpg");
    expect(tv).not.toContain("sealed the old village");
  });
});
