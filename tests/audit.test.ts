// Fixes from the pre-session audit: seat links lock the name, renamed players are
// found by name, and the after-test reset leaves nothing from the test behind.
import { beforeEach, describe, expect, it } from "vitest";
import { handleApi } from "@/server/api";
import { sha256 } from "@/server/auth";
import { execute, hello } from "@/server/game";
import { createMemoryStore, type MemoryStore } from "@/server/store";
import { freshStart, seedGame } from "@/shared/seed";
import type { GameState } from "@/shared/types";

const DM = { role: "dm" as const };
const G = "candlefair";
let store: MemoryStore;

beforeEach(async () => {
  store = createMemoryStore();
  await store.overwrite(G, seedGame(G), []);
  await store.setDmKeyHash(G, sha256("dm-key"));
  await execute(store, G, DM, { type: "arrival.issueLinks" });
});

async function state(): Promise<GameState> {
  return (await store.read(G)).state!;
}
async function phone(method: "GET" | "POST", token: string, body?: object) {
  const req = new Request(`http://x/api/arrival?game=${G}&t=${token}`, method === "POST" ? { method, body: JSON.stringify(body) } : undefined);
  return (await (await handleApi(req, store)).json()) as { me: { tableHref: string } | null };
}

describe("seat links", () => {
  it("lock the name with the link, and Go to your table carries the key", async () => {
    const token = (await state()).players[0].arrival!.token;
    const v = await phone("GET", token);
    expect(v.me!.tableHref).toContain(`#key=${token}`);
    const p = (await state()).players[0];
    expect(p.keyHash).toBe(sha256(token));
    // Nobody else can open that player's phone any more; the link's key can.
    expect((await hello(G, p.handle, null, store)).status).toBe("taken");
    expect((await hello(G, p.handle, token, store)).status).toBe("ok");
  });

  it("leave a name the player locked themselves alone", async () => {
    await execute(store, G, { role: "player", playerId: "p1" }, { type: "me.lockHashed", keyHash: sha256("mine") });
    const token = (await state()).players[0].arrival!.token;
    const v = await phone("GET", token);
    expect(v.me!.tableHref).not.toContain("#key=");
    expect((await state()).players[0].keyHash).toBe(sha256("mine"));
  });

  it("lock again after the DM resets a lock", async () => {
    const token = (await state()).players[0].arrival!.token;
    await phone("GET", token);
    await execute(store, G, DM, { type: "player.clearKey", playerId: "p1" });
    expect((await state()).players[0].arrival!.keyed).toBeUndefined();
    await phone("POST", token, { type: "finish" });
    expect((await state()).players[0].keyHash).toBe(sha256(token));
  });
});

describe("renamed players", () => {
  it("are found by their new name or character, not made twice", async () => {
    await execute(store, G, DM, { type: "player.update", playerId: "p1", patch: { name: "Ana", character: "Thorn" } });
    expect((await hello(G, "Ana", null, store)).status).toBe("ok");
    expect((await hello(G, "thorn", null, store)).status).toBe("ok");
    const s = await state();
    expect(s.players.filter((p) => p.name === "Ana")).toHaveLength(1);
    expect(s.players.find((p) => p.name === "Ana")!.handle).toBe("player1");
  });

  it("still asks for the key when that name is locked", async () => {
    await execute(store, G, DM, { type: "player.update", playerId: "p1", patch: { name: "Ana" } });
    await execute(store, G, { role: "player", playerId: "p1" }, { type: "me.lockHashed", keyHash: sha256("k") });
    expect((await hello(G, "Ana", null, store)).status).toBe("taken");
  });
});

describe("Clear gold, ledger and sessions", () => {
  it("leaves nothing from a test run behind", async () => {
    let s = await state();
    s.players[1].hp = { cur: 0, max: 21, temp: 0 };
    s.players[0].inspired = true;
    s.fights = [{ id: "f1" } as never];
    s.fight = { id: "f2" } as never;
    const map = s.scenes.find((x) => x.kind === "map")!;
    map.map!.tokens = [
      { id: "t1", kind: "player", playerId: "p1", label: "", x: 0.5, y: 0.5 } as never,
      { id: "t2", kind: "monster", label: "W", x: 0.2, y: 0.2 } as never,
    ];
    map.map!.fog = { on: true, x0: 0, y0: 0, cw: 0.5, ch: 0.5, cols: 2, rows: 2, aspect: 1, bits: "8A==" } as never;
    s.shops[0].visibility = "all";
    s = freshStart(s);
    expect(s.players[1].hp).toBeUndefined();
    expect(s.players[0].inspired).toBe(false);
    expect(s.fight).toBeUndefined();
    expect(s.fights).toEqual([]);
    const m = s.scenes.find((x) => x.kind === "map")!.map!;
    expect(m.tokens!.map((t) => t.id)).toEqual(["t2"]);
    expect(m.fog!.bits).toBe("AA==");
    expect(s.shops[0].visibility).toBe("hidden");
  });
});

describe("late initiative", () => {
  it("never skips anyone's turn when initiatives come in after Begin", async () => {
    const s0 = await state();
    const tpl = s0.monsters![0].id;
    await execute(store, G, DM, { type: "fight.start", groups: [{ templateId: tpl, count: 2 }] });
    await execute(store, G, DM, { type: "fight.begin" });
    let f = (await state()).fight!;
    const first = f.currentId;
    // Everyone else answers late, all higher than the one acting.
    for (const c of f.order.filter((x) => x.id !== first)) await execute(store, G, DM, { type: "fight.init", combatantId: c.id, init: 15 });
    await execute(store, G, DM, { type: "fight.init", combatantId: first!, init: 10 });
    const seen = new Set<string>([first!]);
    f = (await state()).fight!;
    while (f.round === 1) {
      await execute(store, G, DM, { type: "fight.next" });
      f = (await state()).fight!;
      if (f.round === 1) seen.add(f.currentId!);
    }
    expect(seen.size).toBe(f.order.length);
    // From round 2 the order follows the numbers.
    expect(f.order.map((c) => c.init)).toEqual([...f.order.map((c) => c.init)].sort((a, b) => (b ?? -99) - (a ?? -99)));
    expect(f.order.some((c) => c.reslot)).toBe(false);
  });
});

describe("ending a session", () => {
  it("won't leave a fight open on everyone's phones", async () => {
    await execute(store, G, DM, { type: "session.start" });
    await execute(store, G, DM, { type: "fight.start", groups: [{ templateId: (await state()).monsters![0].id, count: 1 }] });
    await expect(execute(store, G, DM, { type: "session.end" })).rejects.toThrow(/fight is still open/);
    await execute(store, G, DM, { type: "fight.cancel" });
    await execute(store, G, DM, { type: "session.end" });
    expect((await state()).currentSessionId).toBeNull();
  });
});

describe("safety snapshots", () => {
  const dmReq = (path: string, method = "GET", body?: object) =>
    handleApi(new Request(`http://x${path}?game=${G}&player=DM`, { method, headers: { "x-candlefair-key": "dm-key" }, ...(body ? { body: JSON.stringify(body) } : {}) }), store);

  it("are taken before a reset and can put the game back", async () => {
    await execute(store, G, DM, { type: "money.adjust", playerId: "p1", amountCp: 500, note: "test" });
    expect((await dmReq("/api/reset", "POST", { mode: "play" })).status).toBe(200);
    expect((await state()).players[0].balanceCp).toBe(0);
    const { snapshots } = (await (await dmReq("/api/snapshots")).json()) as { snapshots: { id: number; reason: string }[] };
    expect(snapshots[0].reason).toMatch(/Before clearing/);
    expect((await dmReq("/api/snapshots/restore", "POST", { id: snapshots[0].id })).status).toBe(200);
    expect((await state()).players[0].balanceCp).toBe(500);
    expect(await store.ledger(G)).toHaveLength(1);
    // Going back kept a snapshot of the reset game too.
    const after = (await (await dmReq("/api/snapshots")).json()) as { snapshots: { reason: string }[] };
    expect(after.snapshots[0].reason).toMatch(/Before going back/);
  });

  it("are DM only", async () => {
    const res = await handleApi(new Request(`http://x/api/snapshots?game=${G}&player=DM`), store);
    expect(res.status).toBe(401);
  });

  it("keep only the newest 10", async () => {
    for (let i = 0; i < 12; i++) await dmReq("/api/reset", "POST", { mode: "play" });
    const { snapshots } = (await (await dmReq("/api/snapshots")).json()) as { snapshots: unknown[] };
    expect(snapshots).toHaveLength(10);
  });
});

describe("backup zip", () => {
  it("round-trips the game and its images", async () => {
    const { readZip, writeZip, crc32 } = await import("@/shared/zip");
    expect(crc32(new TextEncoder().encode("123456789"))).toBe(0xcbf43926);
    const img = new Uint8Array([137, 80, 78, 71, 1, 2, 3]);
    const z = writeZip([
      { name: "backup.json", data: new TextEncoder().encode('{"a":"/api/files/g/abc.png"}') },
      { name: "images/g/abc.png", data: img },
    ]);
    const out = readZip(z);
    expect(out.map((e) => e.name)).toEqual(["backup.json", "images/g/abc.png"]);
    expect(new TextDecoder().decode(out[0].data)).toContain("abc.png");
    expect([...out[1].data]).toEqual([...img]);
  });
});
