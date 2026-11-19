// Selling loot to shops from the phone: the sheet item is held, the DM sets the price, gold and inventory move on approval.
import { beforeEach, describe, expect, it } from "vitest";
import type { Command } from "@/shared/commands";
import { GP } from "@/shared/money";
import { projectPlayer } from "@/shared/projection";
import { apply, CommandError, type Ctx } from "@/shared/reducer";
import { availableCp } from "@/shared/requests";
import { seedGame } from "@/shared/seed";
import type { Actor, GameState } from "@/shared/types";

const DM: Actor = { role: "dm" };
const P1: Actor = { role: "player", playerId: "p1" };
const P2: Actor = { role: "player", playerId: "p2" };

let g: GameState;
let now = 1000;
function as(actor: Actor, cmd: Command) {
  const r = apply(g, cmd, { now: ++now, actor } as Ctx);
  g = r.state;
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
const p1 = () => g.players.find((p) => p.id === "p1")!;
const line = (name: string) => p1().sheet?.items?.find((x) => x.name === name);
const item = (name: string) => g.items.find((i) => i.name === name)!;
const sell = (sheetItemId: string, qty = 1, askCp = 0, shopId = "smith"): Command => ({ type: "me.requestSell", sheetItemId, shopId, qty, askCp, note: "" });
const req = () => g.requests[g.requests.length - 1];

beforeEach(() => {
  g = seedGame("t");
  as(DM, { type: "shop.visibility", shopId: "smith", visibility: "all", quiet: true });
  as(DM, { type: "money.adjust", playerId: "p1", amountCp: 30 * GP, note: "" });
  as(P1, { type: "me.sheet", patch: { items: [{ id: "gem", name: "Garnet", qty: 3, kind: "gear" }] } } as Command);
});

describe("selling loot", () => {
  it("offers an item, holds it (not gold), and pays the asking price on approval", () => {
    as(P1, sell("gem", 2, 20 * GP));
    expect(req()).toMatchObject({ kind: "sell", status: "pending", qty: 2, totalCp: 20 * GP, itemName: "Garnet", shopId: "smith", sheetItemId: "gem" });
    // A sale never holds gold.
    expect(availableCp(g, "p1")).toBe(30 * GP);
    // Only the unoffered one can go elsewhere.
    expect(fails(P1, sell("gem", 2)).message).toMatch(/1 Garnet you haven't offered/);
    const mine = projectPlayer(g, 1, "p1", []).myRequests[0];
    expect(mine).toMatchObject({ kind: "sell", shopName: g.shops.find((s) => s.id === "smith")!.name, sheetItemId: "gem" });
    const done = as(DM, { type: "request.approve", requestId: req().id });
    expect(p1().balanceCp).toBe(50 * GP);
    expect(line("Garnet")!.qty).toBe(1);
    expect(req()).toMatchObject({ status: "approved", chargedCp: 20 * GP });
    expect(done.ledger[0]).toMatchObject({ kind: "sale", amountCp: 20 * GP });
    expect(done.ledger[0].note).toMatch(/^Sold 2 × Garnet to /);
  });

  it("the DM can pay a different price, and must name one when the player left it blank", () => {
    as(P1, sell("gem", 3));
    expect(fails(DM, { type: "request.approve", requestId: req().id }).message).toMatch(/left the price to you/);
    as(DM, { type: "request.approve", requestId: req().id, totalCp: 7 * GP });
    expect(p1().balanceCp).toBe(37 * GP);
    expect(line("Garnet")).toBeUndefined();
  });

  it("Approve all skips sales", () => {
    as(P1, sell("gem", 1, 5 * GP));
    const r = as(DM, { type: "request.approveAll" });
    expect(r.info).toMatch(/sales/);
    expect(req().status).toBe("pending");
  });

  it("rechecks the sheet at approval time; Approve anyway sells what's left", () => {
    as(P1, sell("gem", 3, 9 * GP));
    as(P1, { type: "me.sheetAct", act: { k: "qty", itemId: "gem", delta: -1 } } as Command);
    const e = fails(DM, { type: "request.approve", requestId: req().id });
    expect(e.code).toBe("recheck");
    as(DM, { type: "request.approve", requestId: req().id, override: true });
    expect(line("Garnet")).toBeUndefined();
    expect(p1().balanceCp).toBe(39 * GP);
  });

  it("an item bought here goes back on the shelf", () => {
    const shield = item("Shield");
    as(DM, { type: "item.update", itemId: shield.id, patch: { stock: 2 }, quiet: true });
    as(P1, { type: "me.requestBuy", itemId: shield.id, qty: 1, note: "" });
    as(DM, { type: "request.approve", requestId: req().id });
    expect(item("Shield").stock).toBe(1);
    const mine = p1().sheet!.items!.find((x) => x.from === shield.id)!;
    as(P1, sell(mine.id, 1, 5 * GP));
    as(DM, { type: "request.approve", requestId: req().id });
    expect(item("Shield").stock).toBe(2);
    expect(p1().sheet!.items!.some((x) => x.from === shield.id)).toBe(false);
  });

  it("decline and cancel leave the item where it was; only open shops and own sheets", () => {
    as(P1, sell("gem", 1, 5 * GP));
    as(P1, { type: "me.cancelRequest", requestId: req().id });
    as(P1, sell("gem", 3, 5 * GP));
    as(DM, { type: "request.decline", requestId: req().id, reason: "Not a jeweller" });
    expect(line("Garnet")!.qty).toBe(3);
    expect(p1().balanceCp).toBe(30 * GP);
    // Reopening works while it's still on the sheet.
    as(DM, { type: "request.reopen", requestId: req().id });
    expect(req().status).toBe("pending");
    as(DM, { type: "shop.visibility", shopId: "general", visibility: "hidden", quiet: true });
    expect(fails(P1, sell("gem", 1, 0, "general")).message).toMatch(/isn't open to you/);
    expect(fails(P2, sell("gem", 1)).message).toMatch(/character sheet/);
  });
});
