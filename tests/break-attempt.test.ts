// Fixes from the 2026-11-15 adversarial audit (SECURITY_AUDIT.md, "Adversarial pass").
import { beforeEach, describe, expect, it } from "vitest";
import { sha256 } from "@/server/auth";
import { execute, hello } from "@/server/game";
import { pickedCodeProblem } from "@/server/limits";
import { createMemoryStore, type MemoryStore } from "@/server/store";
import { projectTv } from "@/shared/projection";
import { seedGame } from "@/shared/seed";
import type { GameState } from "@/shared/types";

const DM = { role: "dm" as const };
const G = "testtable";
let store: MemoryStore;

beforeEach(async () => {
  store = createMemoryStore();
  await store.overwrite(G, seedGame(G), []);
  await store.setDmKeyHash(G, sha256("dm-key"));
});

async function state(): Promise<GameState> {
  return (await store.read(G)).state!;
}

describe("P1: a name locks to the first key that signs in with it", () => {
  it("a new player joining with a device key is locked to it", async () => {
    expect((await hello(G, "zed", "zeds-phone-key", store)).status).toBe("ok");
    const z = (await state()).players.find((p) => p.handle === "zed")!;
    expect(z.keyHash).toBe(sha256("zeds-phone-key"));
    // Someone who only knows the code and the name is shut out...
    expect((await hello(G, "zed", null, store)).status).toBe("taken");
    expect((await hello(G, "zed", "a-guess", store)).status).toBe("taken");
    // ...but the same key (the sign-in link, on a laptop) gets in.
    expect((await hello(G, "zed", "zeds-phone-key", store)).status).toBe("ok");
  });

  it("an existing unlocked player is locked the next time they sign in with a key", async () => {
    const p = (await state()).players[0];
    expect(p.keyHash).toBeUndefined();
    expect((await hello(G, p.handle, "their-key", store)).status).toBe("ok");
    expect((await state()).players[0].keyHash).toBe(sha256("their-key"));
    expect((await hello(G, p.handle, null, store)).status).toBe("taken");
  });

  it("never replaces a lock that's already there", async () => {
    const p = (await state()).players[0];
    await execute(store, G, { role: "player", playerId: p.id }, { type: "me.lockHashed", keyHash: sha256("original") });
    expect((await hello(G, p.handle, "intruder", store)).status).toBe("taken");
    await execute(store, G, { role: "system" }, { type: "system.autoLock", playerId: p.id, keyHash: sha256("intruder") });
    expect((await state()).players[0].keyHash).toBe(sha256("original"));
  });

  it("the DM's reset lets the player's next device claim it again", async () => {
    await hello(G, "zed", "old-phone", store);
    const z = (await state()).players.find((p) => p.handle === "zed")!;
    await execute(store, G, DM, { type: "player.clearKey", playerId: z.id });
    expect((await hello(G, "zed", "new-phone", store)).status).toBe("ok");
    expect((await state()).players.find((p) => p.id === z.id)!.keyHash).toBe(sha256("new-phone"));
  });
});

describe("P2: players can't rename onto someone else", () => {
  it("refuses another player's name, handle or character", async () => {
    const [a, b] = (await state()).players;
    await execute(store, G, DM, { type: "player.update", playerId: b.id, patch: { character: "Thorn Ashby" } });
    const asA = { role: "player" as const, playerId: a.id };
    for (const name of [b.name, b.handle, "thorn ashby", `  ${b.name.toUpperCase()} `]) {
      await expect(execute(store, G, asA, { type: "me.update", patch: { name } })).rejects.toThrow(/already goes by that name/);
    }
    expect((await state()).players[0].name).toBe(a.name);
  });

  it("still allows a fresh name, or your own", async () => {
    const a = (await state()).players[0];
    const asA = { role: "player" as const, playerId: a.id };
    await execute(store, G, asA, { type: "me.update", patch: { name: a.name } });
    await execute(store, G, asA, { type: "me.update", patch: { name: "Brand New Name" } });
    expect((await state()).players[0].name).toBe("Brand New Name");
  });

  it("an archived player's old name is free", async () => {
    const [a, b] = (await state()).players;
    await execute(store, G, DM, { type: "player.archive", playerId: b.id, archived: true });
    await execute(store, G, { role: "player", playerId: a.id }, { type: "me.update", patch: { name: b.name } });
    expect((await state()).players[0].name).toBe(b.name);
  });
});

describe("P3: a staged picture isn't sent out before it's shown", () => {
  async function stageImage(): Promise<string> {
    await execute(store, G, DM, { type: "scene.add", kind: "image", label: "Upcoming handout" });
    const sc = (await state()).scenes.find((x) => x.label === "Upcoming handout")!;
    await execute(store, G, DM, { type: "scene.update", sceneId: sc.id, patch: { reveal: false, art: { url: "/api/files/testtable/0123456789abcdef01234567.jpg" } } });
    return sc.id;
  }

  it("the TV gets no URL for an upcoming scene, then gets it once shown", async () => {
    const id = await stageImage();
    const before = projectTv(await state(), 1).scenes.find((x) => x.id === id);
    expect(before?.art.url).toBeUndefined();
    await execute(store, G, DM, { type: "scene.show", sceneId: id });
    expect(projectTv(await state(), 2).scenes.find((x) => x.id === id)?.art.url).toMatch(/^\/api\/files\//);
    // Switched away again: it has been seen, so it can stay preloaded.
    const other = (await state()).scenes.find((x) => x.id !== id && !x.reveal)!;
    await execute(store, G, DM, { type: "scene.show", sceneId: other.id });
    expect(projectTv(await state(), 3).scenes.find((x) => x.id === id)?.art.url).toMatch(/^\/api\/files\//);
  });
});

describe("P4: a campaign code the DM picks must be hard to guess", () => {
  it("refuses short or simple codes", () => {
    for (const c of ["abc", "friday", "dnd-club", "a-b-c-d-e-f-g"]) expect(pickedCodeProblem(c)).toMatch(/at least 8/);
    expect(pickedCodeProblem("no")).toMatch(/3 to 40/);
  });
  it("accepts 8+ letters or numbers", () => {
    for (const c of ["candlefair", "friday-k7m2x9", "wintermarch2026"]) expect(pickedCodeProblem(c)).toBeNull();
  });
});

describe("P5: once a session is running, a brand-new name knocks", () => {
  it("joins before the session, knocks during it", async () => {
    expect((await hello(G, "early", "k1", store)).status).toBe("ok");
    await execute(store, G, DM, { type: "session.start" });
    expect((await hello(G, "latecomer", "k2", store)).status).toBe("knocking");
    const g = await state();
    expect(g.players.some((p) => p.handle === "latecomer")).toBe(false);
    expect(g.knocks.some((k) => k.handle === "latecomer")).toBe(true);
    // Players already at the table still get straight in.
    expect((await hello(G, "early", "k1", store)).status).toBe("ok");
  });
});

