// The DM can take single lines out of the ledger (say, test entries), with or without undoing their gold.
import { describe, expect, it } from "vitest";
import { handleApi } from "@/server/api";
import { newDmKey, sha256 } from "@/server/auth";
import { execute } from "@/server/game";
import { createMemoryStore } from "@/server/store";

const DM = { role: "dm" as const };

function call(store: ReturnType<typeof createMemoryStore>, path: string, opts: { method?: string; key?: string; body?: unknown } = {}) {
  return handleApi(
    new Request(`http://room${path}`, {
      method: opts.method ?? "GET",
      headers: { ...(opts.key ? { "x-candlefair-key": opts.key } : {}), "content-type": "application/json" },
      ...(opts.body !== undefined ? { body: JSON.stringify(opts.body) } : {}),
    }),
    store,
  );
}

async function campaign() {
  const store = createMemoryStore();
  const key = newDmKey();
  await call(store, "/internal/create?game=wick", { method: "POST", body: { dmKeyHash: sha256(key) } });
  const { state } = await store.read("wick");
  const [a, b] = state!.players;
  await execute(store, "wick", DM, { type: "money.adjust", playerId: a.id, amountCp: 2500, note: "test" });
  await execute(store, "wick", DM, { type: "money.adjust", playerId: b.id, amountCp: 700, note: "keep" });
  await execute(store, "wick", DM, { type: "money.payAll", amountCp: 100, note: "round", playerIds: [a.id, b.id] });
  return { store, key, a: a.id, b: b.id };
}

const balance = async (store: ReturnType<typeof createMemoryStore>, id: string) => (await store.read("wick")).state!.players.find((p) => p.id === id)!.balanceCp;

describe("removing ledger lines", () => {
  it("removes a line and leaves purses alone", async () => {
    const { store, key, a } = await campaign();
    const line = (await store.ledger("wick")).find((l) => l.note === "test")!;
    const r = await call(store, "/api/ledger/remove?game=wick", { method: "POST", key, body: { ids: [line.id] } });
    expect(r.status).toBe(200);
    const left = await store.ledger("wick");
    expect(left.map((l) => l.note)).toEqual(["keep", "round", "round"]);
    expect(await balance(store, a)).toBe(2600);
    expect(store.published.length).toBeGreaterThan(0);
  });

  it("can undo the gold too, for a whole Pay-everyone batch", async () => {
    const { store, key, a, b } = await campaign();
    const ids = (await store.ledger("wick")).filter((l) => l.note === "round").map((l) => l.id);
    expect(ids).toHaveLength(2);
    const r = await call(store, "/api/ledger/remove?game=wick", { method: "POST", key, body: { ids, undo: true } });
    expect(r.status).toBe(200);
    expect(await balance(store, a)).toBe(2500);
    expect(await balance(store, b)).toBe(700);
    expect((await store.ledger("wick")).map((l) => l.note)).toEqual(["test", "keep"]);
  });

  it("undoing one player's line takes the gold from that player only", async () => {
    const { store, key, a, b } = await campaign();
    const line = (await store.ledger("wick")).find((l) => l.note === "test")!;
    const r = await call(store, "/api/ledger/remove?game=wick", { method: "POST", key, body: { ids: [line.id], undo: true } });
    expect(r.status).toBe(200);
    expect(await balance(store, a)).toBe(100);
    expect(await balance(store, b)).toBe(800);
  });

  it("is DM only, and says so when the lines are already gone", async () => {
    const { store, key } = await campaign();
    const id = (await store.ledger("wick"))[0].id;
    expect((await call(store, "/api/ledger/remove?game=wick", { method: "POST", body: { ids: [id] } })).status).toBe(401);
    expect((await call(store, "/api/ledger/remove?game=wick", { method: "POST", key, body: { ids: ["nope"] } })).status).toBe(404);
    expect((await call(store, "/api/ledger/remove?game=wick", { method: "POST", key, body: { ids: [] } })).status).toBe(400);
    expect(await store.ledger("wick")).toHaveLength(4);
  });
});
