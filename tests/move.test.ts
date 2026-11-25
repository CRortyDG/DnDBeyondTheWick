// Moving a campaign to a new random code (src/server/move.ts): the old code shows
// no game, except to keys that played there, which are sent on to the new code.
import { beforeEach, describe, expect, it } from "vitest";
import { handleApi } from "@/server/api";
import { newDmKey, sha256 } from "@/server/auth";
import { createGame } from "@/server/game";
import { moveCampaign } from "@/server/move";
import { snapshot } from "@/server/api";
import { createMemoryStore, type MemoryStore } from "@/server/store";

const OLD = "oldcode1";
const NEW = "newcode2";
let store: MemoryStore;
let dmKey: string;

async function call(path: string, game: string, player: string | null, key: string | null, method = "GET") {
  const q = new URLSearchParams({ game, ...(player ? { player } : {}) });
  const res = await handleApi(new Request(`http://x${path}?${q}`, { method, headers: key ? { "x-candlefair-key": key } : {} }), store);
  return { status: res.status, body: (await res.json()) as Record<string, unknown>, miss: res.headers.has("x-candlefair-miss") };
}
const hello = (game: string, player: string, key: string | null) => call("/api/hello", game, player, key, "POST");

beforeEach(async () => {
  store = createMemoryStore();
  dmKey = newDmKey();
  await createGame(store, OLD, sha256(dmKey), "The Old Door");
  // Sam signs in on a phone (the phone makes a key; the server ties the name to it).
  expect((await hello(OLD, "Sam", "sams-phone-key-0001")).body.status).toBe("ok");
  await snapshot(store, OLD, "Before something");
});

describe("moving to a new code", () => {
  it("takes the whole campaign: state, players, locks, snapshots and the DM key", async () => {
    await moveCampaign(store, store, OLD, NEW);
    const { state } = await store.read(NEW);
    expect(state?.id).toBe(NEW);
    expect(state?.name).toBe("The Old Door");
    expect(state?.players.find((p) => p.handle === "sam")?.keyHash).toBe(sha256("sams-phone-key-0001"));
    expect(await store.dmKeyHash(NEW)).toBe(sha256(dmKey));
    expect((await store.listSnapshots(NEW)).map((s) => s.reason)).toContain("Before something");
    expect((await hello(NEW, "DM", dmKey)).body.status).toBe("ok");
    expect((await hello(NEW, "Sam", "sams-phone-key-0001")).body.status).toBe("ok");
  });

  it("sends the DM and signed-in players on to the new code", async () => {
    await moveCampaign(store, store, OLD, NEW);
    expect((await hello(OLD, "DM", dmKey)).body).toEqual({ status: "moved", game: NEW });
    expect((await hello(OLD, "Sam", "sams-phone-key-0001")).body).toEqual({ status: "moved", game: NEW });
  });

  it("shows anyone else no game at all, and doesn't count it as a guess", async () => {
    await moveCampaign(store, store, OLD, NEW);
    for (const r of [await hello(OLD, "TV", null), await hello(OLD, "Mallory", "made-up-key-000001"), await hello(OLD, "DM", "wrong")]) {
      expect(r.body).toEqual({ status: "no-game" });
      expect(r.miss).toBe(false);
    }
    const view = await call("/api/view", OLD, "TV", null);
    expect(view.status).toBe(404);
    expect(JSON.stringify(view.body)).not.toContain(NEW);
    // Nothing of the game is left under the old code.
    expect((await store.read(OLD)).state).toBeNull();
    expect((await call("/api/export", OLD, "DM", dmKey)).status).toBe(404);
  });

  it("won't move onto a code that's in use, or move a code with no campaign", async () => {
    await createGame(store, NEW, sha256(newDmKey()));
    await expect(moveCampaign(store, store, OLD, NEW)).rejects.toThrow(/taken/);
    await expect(moveCampaign(store, store, "nothinghere", "freecode9")).rejects.toThrow(/No game/);
  });
});
