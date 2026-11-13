// The server's identity rules and atomic saves, against the in-memory store.
import { beforeEach, describe, expect, it } from "vitest";
import { sha256 } from "@/server/auth";
import { execute, hello, HttpError, identify, viewFor } from "@/server/game";
import { createFileStore, type Store } from "@/server/store";
import { seedGame } from "@/shared/seed";

let store: Store;
const DM = { role: "dm" as const };

beforeEach(async () => {
  process.env.DM_KEY = "the-real-dm-key";
  store = createFileStore(null);
  await store.overwrite("candlefair", seedGame("candlefair"), []);
});

describe("who's asking", () => {
  it("only accepts the real DM key", async () => {
    const { state } = await store.read("candlefair");
    expect(identify(state, "DM", "the-real-dm-key").kind).toBe("dm");
    expect(identify(state, "dm", "wrong").kind).toBe("invalid");
    expect(identify(state, "DM", null).kind).toBe("invalid");
  });
  it("treats ?player=Player-1 and ?player=player1 as the same player", async () => {
    const { state } = await store.read("candlefair");
    expect(identify(state, "Player-1", null)).toEqual({ kind: "player", playerId: "p1" });
    expect(identify(state, "player 1", null)).toEqual({ kind: "player", playerId: "p1" });
  });
});

describe("hello", () => {
  it("creates a new player from an unknown name and shows them in the DM view", async () => {
    const r = await hello("candlefair", "Sam", null, store);
    expect(r.status).toBe("ok");
    const dm = await viewFor(store, "candlefair", DM);
    if (dm.role !== "dm") throw new Error();
    expect(dm.state.players.map((p) => p.handle)).toContain("sam");
  });

  it("locks a name created with a key", async () => {
    await hello("candlefair", "elias", "secret1", store);
    expect((await hello("candlefair", "elias", null, store)).status).toBe("taken");
    expect((await hello("candlefair", "elias", "nope", store)).status).toBe("taken");
    expect((await hello("candlefair", "elias", "secret1", store)).status).toBe("ok");
  });

  it("knocks instead of joining when the door is closed", async () => {
    await execute(store, "candlefair", DM, { type: "door.set", closed: true });
    expect((await hello("candlefair", "griefer", null, store)).status).toBe("knocking");
    const { state } = await store.read("candlefair");
    expect(state!.players.some((p) => p.handle === "griefer")).toBe(false);
    expect(state!.knocks.map((k) => k.handle)).toEqual(["griefer"]);
  });

  it("never lets ?player=DM in without the key, and can't create a player called DM", async () => {
    expect((await hello("candlefair", "DM", "guess", store)).status).toBe("invalid");
    const { state } = await store.read("candlefair");
    expect(state!.players.some((p) => p.handle === "dm")).toBe(false);
  });

  it("reports a missing game", async () => {
    expect((await hello("nowhere", "TV", null, store)).status).toBe("no-game");
  });
});

describe("atomic saves", () => {
  it("two purchases racing for the same gold: only one wins", async () => {
    await execute(store, "candlefair", DM, { type: "money.adjust", playerId: "p1", amountCp: 200, note: "" });
    const dagger = (await store.read("candlefair")).state!.items.find((i) => i.name === "Dagger")!; // 2 gp
    const results = await Promise.allSettled([
      execute(store, "candlefair", DM, { type: "money.buy", playerId: "p1", itemId: dagger.id }),
      execute(store, "candlefair", DM, { type: "money.buy", playerId: "p1", itemId: dagger.id }),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const rejected = results.find((r) => r.status === "rejected") as PromiseRejectedResult;
    expect(rejected.reason).toBeInstanceOf(HttpError);
    const { state } = await store.read("candlefair");
    expect(state!.players.find((p) => p.id === "p1")!.balanceCp).toBe(0);
    expect((await store.ledger("candlefair")).filter((l) => l.kind === "purchase")).toHaveLength(1);
  });

  it("publishes the new version after each change", async () => {
    const seen: number[] = [];
    const off = store.subscribe("candlefair", (v) => seen.push(v));
    const r = await execute(store, "candlefair", DM, { type: "live.purse", visible: false });
    off();
    expect(seen).toEqual([r.version]);
  });

  it("player key hashes are stored, never the key", async () => {
    await hello("candlefair", "bolla", "hunter22", store);
    const raw = JSON.stringify(await store.read("candlefair"));
    expect(raw).not.toContain("hunter22");
    expect(raw).toContain(sha256("hunter22"));
  });
});

describe("seats at the table", () => {
  it("lets names join until six seats are taken, then they knock", async () => {
    expect((await hello("candlefair", "Ysolde", null, store)).status).toBe("ok"); // 5th
    expect((await hello("candlefair", "Kip", null, store)).status).toBe("ok"); // 6th
    expect((await hello("candlefair", "Seventh", null, store)).status).toBe("full");
    const { state } = await store.read("candlefair");
    expect(state!.players).toHaveLength(6);
    expect(state!.knocks.map((k) => k.handle)).toEqual(["seventh"]);
    // The DM can still let them in.
    await execute(store, "candlefair", DM, { type: "knock.admit", knockId: state!.knocks[0].id });
    expect((await hello("candlefair", "Seventh", null, store)).status).toBe("ok");
  });

  it("players who left don't hold a seat, and existing players always get back in", async () => {
    await hello("candlefair", "Ysolde", null, store);
    await hello("candlefair", "Kip", null, store);
    expect((await hello("candlefair", "Player 3", null, store)).status).toBe("ok");
    await execute(store, "candlefair", DM, { type: "player.archive", playerId: "p4", archived: true });
    expect((await hello("candlefair", "Newcomer", null, store)).status).toBe("ok");
  });
});
