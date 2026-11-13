// Phone purchase and gold requests: holds, approval, haggling, privacy.
import { beforeEach, describe, expect, it } from "vitest";
import { execute, HttpError, parseClientCommand, viewFor } from "@/server/game";
import { createMemoryStore, type Store } from "@/server/store";
import type { Command } from "@/shared/commands";
import { upgrade } from "@/shared/migrate";
import { GP } from "@/shared/money";
import { projectPlayer, projectTv } from "@/shared/projection";
import { apply, CommandError, type Ctx } from "@/shared/reducer";
import { availableCp, boughtPhrase } from "@/shared/requests";
import { seedGame } from "@/shared/seed";
import type { Actor, GameState, LedgerEntry } from "@/shared/types";

const DM: Actor = { role: "dm" };
const P1: Actor = { role: "player", playerId: "p1" };
const P2: Actor = { role: "player", playerId: "p2" };

let g: GameState;
let ledger: LedgerEntry[];
let now = 1000;

function as(actor: Actor, cmd: Command) {
  const r = apply(g, cmd, { now: ++now, actor } as Ctx);
  g = r.state;
  ledger.push(...r.ledger);
  return r;
}
function fails(actor: Actor, cmd: Command): CommandError {
  try {
    as(actor, cmd);
  } catch (e) {
    if (e instanceof CommandError) return e;
    throw e;
  }
  throw new Error("expected the command to fail");
}
const item = (name: string) => g.items.find((i) => i.name === name)!;
const bal = (pid: string) => g.players.find((p) => p.id === pid)!.balanceCp;
const pending = () => g.requests.filter((r) => r.status === "pending");
const buy = (name: string, qty = 1, note = ""): Command => ({ type: "me.requestBuy", itemId: item(name).id, qty, note });

beforeEach(() => {
  g = seedGame("t");
  ledger = [];
  as(DM, { type: "shop.visibility", shopId: "smith", visibility: "all", quiet: true });
  as(DM, { type: "shop.visibility", shopId: "general", visibility: "all", quiet: true });
  as(DM, { type: "money.adjust", playerId: "p1", amountCp: 30 * GP, note: "" });
  as(DM, { type: "money.adjust", playerId: "p2", amountCp: 30 * GP, note: "" });
  as(DM, { type: "item.update", itemId: item("Hooded Lantern").id, patch: { stock: 1 }, quiet: true });
});

describe("available gold", () => {
  it("is gold minus pending holds, and a request over it is rejected", () => {
    as(P1, buy("Shield")); // 10 gp
    as(P1, buy("Longsword")); // 15 gp
    expect(bal("p1")).toBe(30 * GP); // nothing charged yet
    expect(availableCp(g, "p1")).toBe(5 * GP);
    expect(projectPlayer(g, 1, "p1", []).me.heldCp).toBe(25 * GP);
    expect(fails(P1, buy("Longsword")).message).toMatch(/costs 15 gp and you have 5 gp available/);
    expect(fails(P1, { type: "me.requestGive", toPlayerId: "p2", amountCp: 6 * GP, note: "" }).message).toMatch(/5 gp available/);
  });

  it("counts quantity, and refuses quantity for one-at-a-time goods", () => {
    as(P1, buy("Javelin", 4, "for the fighter")); // 4 × 5 sp
    expect(pending()[0]).toMatchObject({ qty: 4, totalCp: 2 * GP, note: "for the fighter" });
    expect(fails(P1, buy("Shield", 2)).message).toMatch(/one at a time/);
  });
});

describe("holding stock", () => {
  it("two players can't both claim the last one", () => {
    as(DM, { type: "money.adjust", playerId: "p1", amountCp: 10 * GP, note: "" });
    as(DM, { type: "money.adjust", playerId: "p2", amountCp: 10 * GP, note: "" });
    as(P1, buy("Hooded Lantern"));
    expect(fails(P2, buy("Hooded Lantern")).message).toMatch(/already asked for the last/);
    // The TV and phones see it as on hold, not sold out.
    expect(projectTv(g, 1).items.find((i) => i.name === "Hooded Lantern")).toMatchObject({ stock: 1, held: 1 });
  });

  it("two simultaneous requests for the last item through the server: only one is held", async () => {
    const store: Store = createMemoryStore();
    as(DM, { type: "money.adjust", playerId: "p1", amountCp: 10 * GP, note: "" });
    as(DM, { type: "money.adjust", playerId: "p2", amountCp: 10 * GP, note: "" });
    await store.overwrite("t", g, []);
    const lute = item("Hooded Lantern").id;
    const results = await Promise.allSettled([
      execute(store, "t", P1, { type: "me.requestBuy", itemId: lute, qty: 1, note: "" }),
      execute(store, "t", P2, { type: "me.requestBuy", itemId: lute, qty: 1, note: "" }),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect((results.find((r) => r.status === "rejected") as PromiseRejectedResult).reason).toBeInstanceOf(HttpError);
    const { state } = await store.read("t");
    expect(state!.requests.filter((r) => r.status === "pending")).toHaveLength(1);
  });
});

describe("approving", () => {
  it("charges the player, writes the ledger, takes stock, and announces it on the TV", () => {
    as(DM, { type: "item.update", itemId: item("Shield").id, patch: { stock: 3 }, quiet: true });
    as(P1, buy("Shield"));
    as(DM, { type: "request.approve", requestId: pending()[0].id });
    expect(bal("p1")).toBe(20 * GP);
    expect(item("Shield").stock).toBe(2);
    expect(ledger.at(-1)).toMatchObject({ playerId: "p1", amountCp: -10 * GP, note: "Bought Shield", kind: "purchase" });
    expect(g.banner?.text).toBe("Player 1 bought a Shield");
    expect(g.requests[0]).toMatchObject({ status: "approved", chargedCp: 10 * GP });
  });

  it("can stay off the TV", () => {
    as(DM, { type: "game.tvPurchases", on: false });
    as(P1, buy("Shield"));
    as(DM, { type: "request.approve", requestId: pending()[0].id });
    expect(g.banner).toBeNull();
  });

  it("approve at a different price charges the new amount and records both prices", () => {
    as(P1, buy("Shield", 1, "I'll haggle"));
    as(DM, { type: "request.approve", requestId: pending()[0].id, totalCp: 8 * GP });
    expect(bal("p1")).toBe(22 * GP);
    expect(ledger.at(-1)).toMatchObject({ amountCp: -8 * GP, listCp: 10 * GP, note: "Bought Shield (10 gp, settled at 8 gp)" });
    expect(g.requests[0].chargedCp).toBe(8 * GP);
  });

  it("re-checks at approval time and lets the DM override", () => {
    as(P1, buy("Shield"));
    as(DM, { type: "money.adjust", playerId: "p1", amountCp: -25 * GP, note: "" }); // DM spent their gold meanwhile
    const e = fails(DM, { type: "request.approve", requestId: pending()[0].id });
    expect(e.code).toBe("recheck");
    expect(e.message).toMatch(/only has 5 gp now/);
    expect(pending()).toHaveLength(1); // untouched
    as(DM, { type: "request.approve", requestId: pending()[0].id, override: true });
    expect(bal("p1")).toBe(-5 * GP);
  });

  it("approve all approves what still works and leaves the rest waiting", () => {
    as(P1, buy("Shield"));
    as(P2, buy("Longsword"));
    as(P2, { type: "me.requestGive", toPlayerId: "p1", amountCp: 5 * GP, note: "paying back the potion" });
    // The DM takes 11 gp from player 2: the sword still works (19 gp), then the 5 gp gift doesn't (4 gp left).
    as(DM, { type: "money.adjust", playerId: "p2", amountCp: -11 * GP, note: "" });
    const r = as(DM, { type: "request.approveAll" });
    expect(r.info).toMatch(/Approved 2\. Still waiting on you: Player 2: Player 2 only has 4 gp now/);
    expect(pending()).toHaveLength(1);
    expect(pending()[0].kind).toBe("give");
  });

  it("a gold transfer shows in both players' ledgers", () => {
    as(P2, { type: "me.requestGive", toPlayerId: "p1", amountCp: 5 * GP, note: "paying back the potion" });
    as(DM, { type: "request.approve", requestId: pending()[0].id });
    expect(bal("p1")).toBe(35 * GP);
    expect(bal("p2")).toBe(25 * GP);
    const lines = ledger.filter((l) => l.kind === "transfer");
    expect(lines.map((l) => [l.playerId, l.amountCp, l.note])).toEqual([
      ["p2", -5 * GP, "Sent 5 gp to Player 1: paying back the potion"],
      ["p1", 5 * GP, "From Player 2: paying back the potion"],
    ]);
    expect(projectPlayer(g, 1, "p1", ledger).myLedger[0].note).toBe("From Player 2: paying back the potion");
  });
});

describe("declining and cancelling", () => {
  it("decline releases the gold and stock, and the player sees the reason", () => {
    as(DM, { type: "money.adjust", playerId: "p1", amountCp: 10 * GP, note: "" });
    as(P1, buy("Hooded Lantern"));
    as(DM, { type: "request.decline", requestId: pending()[0].id, reason: "The shopkeeper doesn't trust you yet" });
    expect(availableCp(g, "p1")).toBe(40 * GP);
    expect(projectPlayer(g, 1, "p1", []).myRequests[0]).toMatchObject({ status: "declined", reason: "The shopkeeper doesn't trust you yet" });
    as(DM, { type: "money.adjust", playerId: "p2", amountCp: 10 * GP, note: "" });
    as(P2, buy("Hooded Lantern")); // free again
    expect(pending()).toHaveLength(1);
  });

  it("cancel releases the hold, and only the requester can cancel", () => {
    as(P1, buy("Longsword"));
    const id = pending()[0].id;
    expect(fails(P2, { type: "me.cancelRequest", requestId: id }).message).toMatch(/doesn't exist/);
    as(P1, { type: "me.cancelRequest", requestId: id });
    expect(availableCp(g, "p1")).toBe(30 * GP);
    expect(fails(DM, { type: "request.approve", requestId: id }).message).toMatch(/already cancelled/);
  });
});

describe("what a player can request", () => {
  it("a player token can't request an item from a shop not visible to them", () => {
    const tonic = g.items.find((i) => i.name === "Temple Tonic")!; // the Apothecary is hidden
    expect(fails(P1, { type: "me.requestBuy", itemId: tonic.id, qty: 1, note: "" }).message).toBe("That item isn't available.");
    // A secret offer for player 2 only.
    as(DM, { type: "shop.visibility", shopId: "apoth", visibility: "some", playerIds: ["p2"] });
    expect(fails(P1, { type: "me.requestBuy", itemId: tonic.id, qty: 1, note: "" }).message).toBe("That item isn't available.");
    as(P2, { type: "me.requestBuy", itemId: tonic.id, qty: 1, note: "" });
  });

  it("hidden and rumored items get the same answer as items that don't exist", () => {
    as(DM, { type: "item.update", itemId: item("Shield").id, patch: { tier: "hidden" }, quiet: true });
    expect(fails(P1, buy("Shield")).message).toBe("That item isn't available.");
    as(DM, { type: "item.update", itemId: item("Shield").id, patch: { tier: "rumored", hint: "shiny" }, quiet: true });
    expect(fails(P1, buy("Shield")).message).toBe("That item isn't available.");
    expect(fails(P1, { type: "me.requestBuy", itemId: "nope", qty: 1, note: "" }).message).toBe("That item isn't available.");
  });

  it("refuses locked, sold out, and a stale price", () => {
    as(DM, { type: "item.update", itemId: item("Shield").id, patch: { tier: "locked", reason: "Needs iron" }, quiet: true });
    expect(fails(P1, buy("Shield")).message).toMatch(/locked: Needs iron/);
    as(DM, { type: "item.update", itemId: item("Longsword").id, patch: { stock: 0, restockNote: "Next tenday" }, quiet: true });
    expect(fails(P1, buy("Longsword")).message).toMatch(/sold out\. Next tenday/);
    expect(fails(P1, { type: "me.requestBuy", itemId: item("Dagger").id, qty: 1, note: "", expectedUnitCp: 1 }).message).toMatch(/price of Dagger just changed/);
  });

  it("a player can't act as someone else: requests carry no player id, and DM commands are refused", () => {
    expect(() => parseClientCommand(P1, { type: "request.approve", requestId: "x" })).toThrow(HttpError);
    expect(() => parseClientCommand(P1, { type: "money.buy", playerId: "p2", itemId: "i0" })).toThrow(HttpError);
    const cmd = parseClientCommand(P1, { type: "me.requestBuy", itemId: item("Dagger").id, qty: 1, note: "", playerId: "p2" });
    expect(cmd).not.toHaveProperty("playerId");
    as(P1, cmd as Command);
    expect(pending()[0].playerId).toBe("p1");
  });

  it("the TV can't send requests", () => {
    expect(() => parseClientCommand({ role: "tv" }, buy("Dagger"))).toThrow(HttpError);
  });
});

describe("the Traveling Peddler", () => {
  beforeEach(() => {
    as(DM, { type: "shop.visibility", shopId: "peddler", visibility: "some", playerIds: ["p1"] });
    as(DM, { type: "shop.update", shopId: "peddler", patch: { closed: false } });
  });

  it("purchases never appear on the TV or in other players' views", () => {
    const coin = g.items.find((i) => i.name === "A Lucky Coin")!;
    as(P1, { type: "me.requestBuy", itemId: coin.id, qty: 1, note: "whisper" });
    as(DM, { type: "request.approve", requestId: pending()[0].id, totalCp: 1 * GP });
    expect(g.banner?.text ?? "").not.toMatch(/Coin/);
    const tv = JSON.stringify(projectTv(g, 1));
    const other = JSON.stringify(projectPlayer(g, 1, "p2", ledger));
    for (const s of [tv, other]) {
      expect(s).not.toContain("Lucky Coin");
      expect(s).not.toContain("whisper");
      expect(s).not.toContain("Must be returned");
      expect(s).not.toContain("Peddler");
    }
    const mine = JSON.stringify(projectPlayer(g, 1, "p1", ledger));
    expect(mine).toContain("Lucky Coin");
    expect(mine).toContain("Must be returned"); // the fine print, on the buyer's phone
  });

  it("stays secret even if the DM later opens the shop to everyone", () => {
    as(DM, { type: "shop.visibility", shopId: "peddler", visibility: "all", quiet: true });
    const coin = g.items.find((i) => i.name === "A Lucky Coin")!;
    as(P1, { type: "me.requestBuy", itemId: coin.id, qty: 1, note: "" });
    as(DM, { type: "request.approve", requestId: pending()[0].id });
    expect(g.banner).toBeNull();
  });
});

describe("privacy of requests", () => {
  it("a player only ever sees their own requests; the TV sees none", async () => {
    as(P1, buy("Shield", 1, "secret-note-xyz"));
    expect(JSON.stringify(projectTv(g, 1))).not.toContain("secret-note-xyz");
    expect(JSON.stringify(projectPlayer(g, 1, "p2", []))).not.toContain("secret-note-xyz");
    expect(projectPlayer(g, 1, "p1", []).myRequests[0].note).toBe("secret-note-xyz");
    const store = createMemoryStore();
    await store.overwrite("t", g, []);
    const dm = await viewFor(store, "t", DM);
    expect(JSON.stringify(dm)).toContain("secret-note-xyz");
  });
});

describe("odds and ends", () => {
  it("reads naturally", () => {
    expect(boughtPhrase("Shield", 1)).toBe("a Shield");
    expect(boughtPhrase("Oil Flask", 1)).toBe("an Oil Flask");
    expect(boughtPhrase("A Masterwork Lute", 1)).toBe("a Masterwork Lute");
    expect(boughtPhrase("Torch", 3)).toBe("3 × Torch");
  });

  it("older saves get an empty request list", () => {
    const old = structuredClone(seedGame("t")) as Partial<GameState>;
    delete old.requests;
    expect(upgrade(old).requests).toEqual([]);
  });
});
