// The shop as progression: browsing by purpose, rent, orders, training,
// projects, income, credit, and DM-only effects.
import { beforeEach, describe, expect, it } from "vitest";
import type { Command } from "@/shared/commands";
import { GP, SP } from "@/shared/money";
import { CATEGORIES, duesFor, splitByShare } from "@/shared/progress";
import { projectPlayer, projectTv } from "@/shared/projection";
import { apply, CommandError, type Ctx } from "@/shared/reducer";
import { availableCp } from "@/shared/requests";
import { SEED_ITEMS, SEED_SHOPS, seedGame } from "@/shared/seed";
import type { Actor, GameState, LedgerEntry } from "@/shared/types";

const DM: Actor = { role: "dm" };
const P = (n: number): Actor => ({ role: "player", playerId: `p${n}` });

let g: GameState;
let ledger: LedgerEntry[];
let now = 1000;
let dice = 0.5;

function as(actor: Actor, cmd: Command) {
  const r = apply(g, cmd, { now: ++now, actor, rand: () => dice } as Ctx);
  g = r.state;
  ledger.push(...r.ledger);
  return r;
}
const dm = (cmd: Command) => as(DM, cmd);
function fails(actor: Actor, cmd: Command): string {
  try {
    as(actor, cmd);
  } catch (e) {
    if (e instanceof CommandError) return e.message;
    throw e;
  }
  throw new Error("expected the command to fail");
}
const bal = (pid: string) => g.players.find((p) => p.id === pid)!.balanceCp;
const pay = (pid: string, gp: number) => dm({ type: "money.adjust", playerId: pid, amountCp: gp * GP, note: "" });
const open = (...shopIds: string[]) => shopIds.forEach((shopId) => dm({ type: "shop.visibility", shopId, visibility: "all", quiet: true }));
const lastPending = () => g.requests.filter((r) => r.status === "pending").at(-1)!;
const approveLast = (extra: Partial<Extract<Command, { type: "request.approve" }>> = {}) => dm({ type: "request.approve", requestId: lastPending().id, ...extra });
const start = () => dm({ type: "session.start" });
const end = () => dm({ type: "session.end" });
const curNumber = () => g.sessions.find((s) => s.id === g.currentSessionId)!.number;
const chargeAllDue = () => dm({ type: "dues.charge", ids: duesFor(g, curNumber()).map((d) => d.id) });

beforeEach(() => {
  g = seedGame("t");
  ledger = [];
  dice = 0.5;
});

describe("the seed catalog", () => {
  it("gives every item one category and one storefront, and every storefront starts hidden", () => {
    const shopIds = new Set(SEED_SHOPS.map((s) => s.id));
    const cats = new Set(CATEGORIES.map((c) => c.id));
    for (const it of SEED_ITEMS) {
      expect(shopIds.has(it.shopId), it.name).toBe(true);
      expect(cats.has(it.category), it.name).toBe(true);
    }
    expect(SEED_SHOPS.every((s) => s.visibility === "hidden")).toBe(true);
    // Map pins link to these.
    expect(shopIds.has("docks") && shopIds.has("smith")).toBe(true);
    expect(SEED_SHOPS.map((s) => s.name)).toEqual(["General Store", "The Smithy", "Apothecary & Temple", "The Flickering Candle", "The Docks", "Training", "Baldur’s Gate", "A Traveling Peddler"]);
  });
});

describe("browsing by purpose", () => {
  it("category and storefront views show the same items, filtered by what the player can see", () => {
    open("smith", "candle");
    dm({ type: "shop.visibility", shopId: "apoth", visibility: "some", playerIds: ["p2"] });
    for (const pid of ["p1", "p2"]) {
      const v = projectPlayer(g, 1, pid, []);
      const shops = new Set(v.shops.map((s) => s.id));
      const byShop = v.shops.flatMap((s) => v.items.filter((i) => i.shopId === s.id)).map((i) => i.id).sort();
      const byCategory = CATEGORIES.flatMap((c) => v.items.filter((i) => i.category === c.id)).map((i) => i.id).sort();
      expect(byCategory).toEqual(byShop);
      expect(v.items.every((i) => shops.has(i.shopId))).toBe(true);
    }
    const p1 = projectPlayer(g, 1, "p1", []);
    const p2 = projectPlayer(g, 1, "p2", []);
    expect(p1.items.some((i) => i.shopId === "apoth")).toBe(false);
    expect(p2.items.find((i) => i.id === "a-tonic")).toMatchObject({ category: "healing" });
    // The Smithy's armour shows under Gear, the Candle's trophies under Trophies.
    expect(p1.items.filter((i) => i.category === "trophies").map((i) => i.shopId)).toEqual(expect.arrayContaining(["candle"]));
  });
});

describe("rent", () => {
  it("is charged once per session-end confirmation, never twice", () => {
    open("candle");
    pay("p1", 20);
    start();
    as(P(1), { type: "me.requestBuy", itemId: "c-room", qty: 1, note: "" });
    approveLast();
    expect(bal("p1")).toBe(17 * GP); // first month
    // Bought this session: already paid through it.
    expect(duesFor(g, curNumber())).toEqual([]);
    end();
    start(); // session 2
    expect(duesFor(g, curNumber())).toMatchObject([{ kind: "rent", playerId: "p1", cp: 3 * GP }]);
    chargeAllDue();
    expect(bal("p1")).toBe(14 * GP);
    const ids = g.rentals.map((r) => r.id);
    dm({ type: "dues.charge", ids }); // pressed again
    expect(bal("p1")).toBe(14 * GP);
    expect(ledger.filter((l) => l.kind === "rent")).toHaveLength(2);
  });

  it("stops when the player cancels", () => {
    open("candle");
    pay("p1", 20);
    start();
    as(P(1), { type: "me.requestBuy", itemId: "c-safe", qty: 1, note: "" });
    approveLast();
    as(P(1), { type: "me.cancelRental", rentalId: g.rentals[0].id });
    end();
    start();
    expect(duesFor(g, curNumber())).toEqual([]);
    expect(projectPlayer(g, 1, "p1", []).mine.rentals).toEqual([]);
  });

  it("can't be asked for twice", () => {
    open("candle");
    pay("p1", 20);
    as(P(1), { type: "me.requestBuy", itemId: "c-room", qty: 1, note: "" });
    expect(fails(P(1), { type: "me.requestBuy", itemId: "c-room", qty: 1, note: "" })).toMatch(/already rent/);
  });
});

describe("special orders", () => {
  it("arrive after exactly N sessions, announced on the TV", () => {
    open("bg");
    pay("p1", 200);
    start(); // session 1
    as(P(1), { type: "me.requestBuy", itemId: "bg-climbing", qty: 1, note: "" });
    approveLast();
    expect(g.orders[0]).toMatchObject({ arrivesAtSession: 3, arrived: false });
    end();
    start(); // 2
    expect(g.orders[0].arrived).toBe(false);
    end();
    start(); // 3
    expect(g.orders[0].arrived).toBe(true);
    expect(g.banner?.text).toContain("Arrived from Baldur’s Gate: Potion of Climbing for Player 1");
  });
});

describe("training", () => {
  it("completes after N installments, not before, then asks the DM to record the proficiency", () => {
    open("training");
    pay("p1", 300);
    start();
    expect(fails(P(1), { type: "me.requestBuy", itemId: "tr-lang", qty: 1, note: "" })).toMatch(/Which language or tool/);
    as(P(1), { type: "me.requestBuy", itemId: "tr-lang", qty: 1, note: "", question: "Elvish" });
    expect(lastPending().totalCp).toBe(50 * GP); // only the first lesson is held
    approveLast();
    expect(g.trainings[0]).toMatchObject({ paid: 1, of: 5, done: false, what: "Elvish" });
    for (let n = 2; n <= 4; n++) {
      end();
      start();
      chargeAllDue();
      chargeAllDue(); // one per session, even if pressed twice
      expect(g.trainings[0]).toMatchObject({ paid: n, done: false });
    }
    expect(g.tasks.filter((t) => !t.done)).toEqual([]);
    end();
    start();
    chargeAllDue();
    expect(g.trainings[0]).toMatchObject({ paid: 5, done: true, paidCp: 250 * GP });
    expect(bal("p1")).toBe(50 * GP);
    expect(g.tasks.at(-1)!.text).toMatch(/Record a new proficiency: Player 1 finished Learn a language or tool: Elvish/);
    end();
    start();
    expect(duesFor(g, curNumber())).toEqual([]);
    expect(projectPlayer(g, 1, "p1", []).mine.trainings).toMatchObject([{ paid: 5, of: 5, done: true }]);
  });
});

describe("projects", () => {
  it("add up contributions across players and apply their effects once", () => {
    open("smith");
    pay("p1", 200);
    pay("p2", 200);
    expect(projectTv(g, 1).items.find((i) => i.id === "i20")).toMatchObject({ tier: "locked" });
    as(P(1), { type: "me.contribute", itemId: "s-forge", amountCp: 120 * GP, note: "" });
    approveLast();
    as(P(2), { type: "me.contribute", itemId: "s-forge", amountCp: 100 * GP, note: "" });
    approveLast();
    const forge = projectTv(g, 1).items.find((i) => i.id === "s-forge")!;
    expect(forge.raisedCp).toBe(220 * GP);
    expect(forge.funded).toBeUndefined();
    expect(fails(P(1), { type: "me.contribute", itemId: "s-forge", amountCp: 81 * GP, note: "" })).toMatch(/only needs 80 gp/);
    as(P(1), { type: "me.contribute", itemId: "s-forge", amountCp: 80 * GP, note: "" });
    approveLast();
    expect(g.effectsOn["s-forge"]).toBeTruthy();
    expect(g.items.find((i) => i.id === "i20")!.tier).toBe("sale"); // Splint Armor unlocked
    expect(g.banner?.text).toContain("Funded: A new forge!");
    expect(g.banner?.text).toContain("New at The Smithy: Splint Armor");
    expect(ledger.filter((l) => l.kind === "contribution").map((l) => l.amountCp)).toEqual([-120 * GP, -100 * GP, -80 * GP]);
    expect(g.tasks.filter((t) => t.text.startsWith("Funded"))).toHaveLength(1);
    // Funded is final: no more money, no second unlock.
    expect(fails(P(2), { type: "me.contribute", itemId: "s-forge", amountCp: GP, note: "" })).toMatch(/already funded/);
    expect(projectPlayer(g, 1, "p1", []).mine.stakes).toMatchObject([{ itemId: "s-forge", cp: 200 * GP, funded: true }]);
  });

  it("a funded discount applies to the category", () => {
    open("apoth");
    pay("p1", 300);
    dm({ type: "project.contribute", playerId: "p1", itemId: "i40", amountCp: 250 * GP });
    const tonic = projectPlayer(g, 1, "p1", []).items.find((i) => i.id === "a-tonic")!;
    expect(tonic).toMatchObject({ priceCp: 1350, listCp: 15 * GP, discountPct: 10 });
    as(P(1), { type: "me.requestBuy", itemId: "a-tonic", qty: 1, note: "", expectedUnitCp: 1350 });
    approveLast();
    expect(bal("p1")).toBe(50 * GP - 1350);
  });
});

describe("income", () => {
  it("is rolled at session start and split by contribution share", () => {
    open("docks");
    pay("p1", 200);
    pay("p2", 200);
    dm({ type: "project.contribute", playerId: "p1", itemId: "d-fishing", amountCp: 100 * GP });
    dm({ type: "project.contribute", playerId: "p2", itemId: "d-fishing", amountCp: 50 * GP });
    const before = [bal("p1"), bal("p2")];
    dice = 0.99; // rolls a 6: 6 gp
    start();
    expect(bal("p1") - before[0]).toBe(400);
    expect(bal("p2") - before[1]).toBe(200);
    expect(g.banner?.text).toContain("A share in Fennick’s fishing paid 6 gp");
    expect(g.sessions[0].startLog).toEqual(["A share in Fennick’s fishing: rolled 6 on 1d6, paid 6 gp"]);
  });

  it("splits whole copper so the parts add up", () => {
    expect(splitByShare(100, [["a", 1], ["b", 1], ["c", 1]])).toEqual([["a", 34], ["b", 33], ["c", 33]]);
    expect(splitByShare(500, [["a", 2], ["b", 1]])).toEqual([["a", 333], ["b", 167]]);
  });
});

describe("Mags's tab", () => {
  beforeEach(() => {
    open("candle");
    dm({ type: "item.update", itemId: "c-tab", patch: { tier: "sale" }, quiet: true });
    as(P(1), { type: "me.requestBuy", itemId: "c-tab", qty: 1, note: "" });
    approveLast();
  });

  it("lets a player go negative up to the limit, at the Candle only", () => {
    as(P(1), { type: "me.requestBuy", itemId: "i32", qty: 1, note: "" }); // Round for the House, 5 gp
    approveLast();
    expect(bal("p1")).toBe(-5 * GP);
    as(P(1), { type: "me.requestBuy", itemId: "i32", qty: 1, note: "" });
    approveLast();
    expect(bal("p1")).toBe(-10 * GP);
    expect(fails(P(1), { type: "me.requestBuy", itemId: "c-drink", qty: 1, note: "" })).toMatch(/available/);
    // Not at other storefronts.
    open("general");
    expect(fails(P(1), { type: "me.requestBuy", itemId: "i2", qty: 1, note: "" })).toMatch(/available/);
    expect(projectPlayer(g, 1, "p1", []).mine.credit).toEqual([{ shopId: "candle", shopName: "The Flickering Candle", limitCp: 10 * GP }]);
  });

  it("can't be pushed past the limit at approval either", () => {
    as(P(1), { type: "me.requestBuy", itemId: "i32", qty: 1, note: "" });
    dm({ type: "money.adjust", playerId: "p1", amountCp: -6 * GP, note: "fine", allowDebt: true });
    const r = g.requests.at(-1)!;
    expect(() => apply(g, { type: "request.approve", requestId: r.id }, { now, actor: DM })).toThrow(/only has/);
  });

  it("is only for the player who opened it", () => {
    expect(fails(P(2), { type: "me.requestBuy", itemId: "i32", qty: 1, note: "" })).toMatch(/available/);
    expect(availableCp(g, "p2")).toBe(0);
  });
});

describe("services and flyers", () => {
  it("hold the gold until the DM answers, and the player sees the answer", () => {
    open("candle");
    pay("p1", 10);
    as(P(1), { type: "me.requestBuy", itemId: "c-ask", qty: 1, note: "", question: "The chef" });
    expect(availableCp(g, "p1")).toBe(5 * GP);
    expect(bal("p1")).toBe(10 * GP);
    dm({ type: "request.approveAll" }); // services need an answer
    expect(lastPending().itemId).toBe("c-ask");
    approveLast({ answer: "He bought the recipes from a traveling merchant." });
    expect(bal("p1")).toBe(5 * GP);
    expect(projectPlayer(g, 1, "p1", []).myRequests[0]).toMatchObject({ status: "approved", question: "The chef", answer: "He bought the recipes from a traveling merchant." });
  });

  it("flyers reach the TV notice board only once approved, as edited, until taken down", () => {
    open("candle");
    pay("p1", 1);
    as(P(1), { type: "me.requestBuy", itemId: "c-flyer", qty: 1, note: "", flyer: { title: "Lost: one ham", body: "Not again.", signedBy: "" } });
    expect(projectTv(g, 1).flyers).toEqual([]);
    approveLast({ flyer: { title: "LOST: one ham", body: "Again.", signedBy: "" } });
    expect(bal("p1")).toBe(1 * GP - 1 * SP);
    const flyers = projectTv(g, 1).flyers;
    expect(flyers).toEqual([{ id: g.flyers[0].id, title: "LOST: one ham", body: "Again.", signedBy: "Player 1" }]);
    dm({ type: "flyer.update", flyerId: g.flyers[0].id, patch: { up: false } });
    expect(projectTv(g, 1).flyers).toEqual([]);
  });

  it("declining a flyer posts nothing and charges nothing", () => {
    open("candle");
    pay("p1", 1);
    as(P(1), { type: "me.requestBuy", itemId: "c-flyer", qty: 1, note: "", flyer: { title: "Rude", body: "", signedBy: "" } });
    dm({ type: "request.decline", requestId: lastPending().id, reason: "Mags won't pin that up" });
    expect(bal("p1")).toBe(GP);
    expect(g.flyers).toEqual([]);
  });
});

describe("earned", () => {
  it("can't be bought; the DM grants it and it shows in the shop and on the player's page", () => {
    open("candle");
    pay("p1", 10);
    expect(fails(P(1), { type: "me.requestBuy", itemId: "c-pudding", qty: 1, note: "" })).toMatch(/earned/);
    dm({ type: "award.grant", itemId: "c-pudding", playerIds: ["p1", "p2"], note: "After Episode 1" });
    expect(projectTv(g, 1).items.find((i) => i.id === "c-pudding")).toMatchObject({ kind: "earned", earnedBy: ["Player 1", "Player 2"] });
    expect(projectPlayer(g, 1, "p2", []).mine.awards).toMatchObject([{ itemName: "The Pudding Slayer", note: "After Episode 1" }]);
  });
});

describe("spoiler safety", () => {
  it("DM notes and effects on items and projects never reach the TV or players", () => {
    for (const s of g.shops) s.visibility = "all";
    for (const s of g.shops) s.closed = false;
    for (const i of g.items) {
      i.dmNote = "SECRET_ALLY_NOTE";
      i.effects = [...(i.effects ?? []), { type: "unlock", itemId: "SECRET_UNLOCK_TARGET" }];
      if (i.tier === "hidden") i.tier = "sale";
    }
    pay("p1", 300);
    dm({ type: "project.contribute", playerId: "p1", itemId: "s-forge", amountCp: 300 * GP });
    const views = [JSON.stringify(projectTv(g, 1)), JSON.stringify(projectPlayer(g, 1, "p1", ledger))];
    for (const v of views) {
      expect(v).not.toContain("SECRET_ALLY_NOTE");
      expect(v).not.toContain("SECRET_UNLOCK_TARGET");
      expect(v).not.toContain("effects");
      expect(v).not.toContain("Your note");
    }
  });
});
