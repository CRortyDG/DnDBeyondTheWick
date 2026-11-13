// Shop visibility, tiers, stock, special orders and banners.
import { describe, expect, it } from "vitest";
import type { Command } from "@/shared/commands";
import { upgrade } from "@/shared/migrate";
import { GP } from "@/shared/money";
import { projectPlayer, projectTv } from "@/shared/projection";
import { apply, type Ctx } from "@/shared/reducer";
import { SEED_ITEMS, SEED_SHOPS, seedGame } from "@/shared/seed";
import type { GameState, LedgerEntry } from "@/shared/types";

const DM: Ctx = { now: 1000, actor: { role: "dm" } };
function run(state: GameState, cmds: Command[]) {
  const ledger: LedgerEntry[] = [];
  for (const c of cmds) {
    const r = apply(state, c, DM);
    state = r.state;
    ledger.push(...r.ledger);
  }
  return { state, ledger };
}
const tvJson = (g: GameState) => JSON.stringify(projectTv(g, 1));
const phoneJson = (g: GameState, pid: string) => JSON.stringify(projectPlayer(g, 1, pid, []));
const rich = (g: GameState) => run(g, g.players.map((p) => ({ type: "money.adjust" as const, playerId: p.id, amountCp: 5000 * GP, note: "" }))).state;

describe("the starter catalog", () => {
  it("starts with every shop hidden, so nothing reaches the TV or phones", () => {
    const g = seedGame("t");
    expect(g.shops.every((s) => s.visibility === "hidden")).toBe(true);
    const tv = projectTv(g, 1);
    expect(tv.shops).toEqual([]);
    expect(tv.items).toEqual([]);
    for (const name of ["Temple Tonic", "Smithy", "Peddler", "Lucky Coin", "Bag of Holding", "Moonshae"]) {
      expect(tvJson(g)).not.toContain(name);
      expect(phoneJson(g, "p1")).not.toContain(name);
    }
  });

  it("keeps about a third of the goods under 25 gp", () => {
    const forSale = SEED_ITEMS.filter((i) => i.tier === "sale" && i.shopId !== "peddler");
    const cheap = forSale.filter((i) => i.priceCp < 25 * GP);
    expect(cheap.length / forSale.length).toBeGreaterThanOrEqual(1 / 3);
  });

  it("has the Phase 2 teases", () => {
    const by = (name: string) => SEED_ITEMS.find((i) => i.name.includes(name))!;
    expect(by("Splint")).toMatchObject({ tier: "locked", reason: "The smith needs iron from Orlumbor" });
    expect(by("Greater Healing")).toMatchObject({ tier: "locked", reason: "The priestess needs moonpetal from the Trollbark" });
    expect(by("Moonshae")).toMatchObject({ tier: "rumored", hint: "No captain will sail there. Yet." });
    expect(by("Back Room")).toMatchObject({ tier: "locked", reason: "Mags only rents it to people she trusts." });
    expect(by("Sorcerous Sundries")).toMatchObject({ tier: "rumored", hint: "Wands, scrolls, and things that hum" });
    expect(SEED_SHOPS.find((s) => s.id === "peddler")).toMatchObject({ closed: true, subtitle: "Comes once a year. Sells exactly what you need." });
    expect(SEED_ITEMS.filter((i) => i.shopId === "peddler").every((i) => i.priceLabel === "Free*" && i.finePrint)).toBe(true);
  });
});

describe("visibility", () => {
  it("a shop opened to everyone reaches the TV and every phone", () => {
    const { state } = run(seedGame("t"), [{ type: "shop.visibility", shopId: "apoth", visibility: "all" }]);
    expect(projectTv(state, 1).shops.map((s) => s.id)).toEqual(["apoth"]);
    expect(tvJson(state)).toContain("Temple Tonic");
    expect(phoneJson(state, "p3")).toContain("Temple Tonic");
    expect(tvJson(state)).not.toContain("Javelin"); // the Smithy is still hidden
  });

  it("a secret offer reaches only the chosen players, and never the TV", () => {
    const { state } = run(seedGame("t"), [
      { type: "shop.visibility", shopId: "peddler", visibility: "some", playerIds: ["p2"] },
      { type: "shop.update", shopId: "peddler", patch: { closed: false } },
    ]);
    expect(phoneJson(state, "p2")).toContain("Lucky Coin");
    expect(phoneJson(state, "p2")).toContain("*Must be returned");
    expect(phoneJson(state, "p1")).not.toContain("Peddler");
    expect(tvJson(state)).not.toContain("Peddler");
    expect(tvJson(state)).not.toContain("Lucky Coin");
  });

  it("a closed shop shows its name and tagline but none of its goods", () => {
    const { state } = run(seedGame("t"), [{ type: "shop.visibility", shopId: "peddler", visibility: "all" }]);
    const tv = projectTv(state, 1);
    expect(tv.shops).toEqual([{ id: "peddler", name: "A Traveling Peddler", subtitle: "Comes once a year. Sells exactly what you need.", closed: true }]);
    expect(tv.items).toEqual([]);
  });

  it("hidden items in a visible shop are never sent", () => {
    const { state } = run(seedGame("t"), [
      { type: "shop.visibility", shopId: "smith", visibility: "all" },
      { type: "item.update", itemId: "i21", patch: { tier: "hidden" } },
    ]);
    expect(tvJson(state)).not.toContain("Plate Armor");
    expect(tvJson(state)).toContain("Splint Armor");
  });

  it("rumored items send only the hint: no name, price or description", () => {
    const { state } = run(seedGame("t"), [{ type: "shop.visibility", shopId: "bg", visibility: "all" }]);
    const tv = projectTv(state, 1);
    const rumor = tv.items.find((i) => i.id === "bg-flametongue")!;
    expect(rumor).toEqual({ id: "bg-flametongue", shopId: "bg", name: "???", priceCp: null, description: "", tier: "rumored", hint: "Only in the city itself", stock: null, category: "magic", kind: "order" });
    expect(tvJson(state)).not.toContain("Flame Tongue");
  });

  it("DM notes on items never leave the server", () => {
    const g = seedGame("t");
    for (const i of g.items) i.dmNote = "SECRET_LEDGER_PAGE";
    for (const s of g.shops) s.visibility = "all";
    expect(tvJson(g)).not.toContain("SECRET_LEDGER_PAGE");
    expect(phoneJson(g, "p1")).not.toContain("SECRET_LEDGER_PAGE");
  });

  it("the TV can't show a hidden shop, and hiding a live shop closes it", () => {
    let g = seedGame("t");
    expect(() => apply(g, { type: "live.shop", open: true, shopId: "smith" }, DM)).toThrow(/hidden/);
    g = run(g, [{ type: "shop.visibility", shopId: "smith", visibility: "all" }, { type: "live.shop", open: true, shopId: "smith" }]).state;
    expect(projectTv(g, 1).live).toMatchObject({ shopOpen: true, shopId: "smith" });
    g = run(g, [{ type: "shop.visibility", shopId: "smith", visibility: "hidden" }]).state;
    expect(projectTv(g, 1).live).toMatchObject({ shopOpen: false, shopId: "" });
  });
});

describe("buying with tiers and stock", () => {
  it("only sells items that are for sale", () => {
    const g = rich(seedGame("t"));
    expect(() => apply(g, { type: "money.buy", playerId: "p1", itemId: "i21" }, DM)).toThrow(/locked/); // Plate
    expect(() => apply(g, { type: "money.buy", playerId: "p1", itemId: "d-moonshae" }, DM)).toThrow(/isn't for sale/); // rumored
    expect(() => apply(g, { type: "money.buy", playerId: "p1", itemId: "p-coin" }, DM)).toThrow(/isn't open/); // closed Peddler
  });

  it("stock goes down with each sale and then it's sold out", () => {
    let { state } = run(rich(seedGame("t")), [{ type: "money.buy", playerId: "p1", itemId: "i35" }]); // Fennick's Boat, 1 in stock
    expect(state.items.find((i) => i.id === "i35")!.stock).toBe(0);
    expect(() => apply(state, { type: "money.buy", playerId: "p2", itemId: "i35" }, DM)).toThrow(/sold out\. Sold\. Fennick is already building another\./i);
    const tv = projectTv({ ...state, shops: state.shops.map((s) => ({ ...s, visibility: "all" as const })) }, 1);
    expect(tv.items.find((i) => i.id === "i35")).toMatchObject({ stock: 0, restockNote: "Sold. Fennick is already building another." });
  });

  it("Peddler goods cost nothing and still go to the ledger", () => {
    const { ledger } = run(seedGame("t"), [
      { type: "shop.update", shopId: "peddler", patch: { closed: false } },
      { type: "money.buy", playerId: "p4", itemId: "p-wind" },
    ]);
    expect(ledger).toHaveLength(1);
    expect(ledger[0]).toMatchObject({ playerId: "p4", amountCp: -0, kind: "purchase", itemId: "p-wind" });
  });
});

describe("special orders", () => {
  it("pay now, arrive two sessions later, with a TV banner", () => {
    let { state, ledger } = run(rich(seedGame("t")), [{ type: "session.start" }, { type: "money.buy", playerId: "p2", itemId: "bg-climbing" }]);
    expect(ledger.at(-1)).toMatchObject({ amountCp: -100 * GP, note: "Ordered Potion of Climbing (arrives session 3)" });
    expect(state.orders).toMatchObject([{ playerId: "p2", arrivesAtSession: 3, arrived: false }]);
    expect(projectPlayer(state, 1, "p2", []).myOrders).toEqual([{ id: state.orders[0].id, itemName: "Potion of Climbing", arrivesAtSession: 3, arrived: false }]);
    expect(projectPlayer(state, 1, "p1", []).myOrders).toEqual([]);
    state = run(state, [{ type: "session.end" }, { type: "session.start" }]).state; // session 2
    expect(state.orders[0].arrived).toBe(false);
    state = run(state, [{ type: "session.end" }, { type: "session.start" }]).state; // session 3
    expect(state.orders[0].arrived).toBe(true);
    expect(state.banner?.text).toBe("Arrived from Baldur’s Gate: Potion of Climbing for Player 2");
  });

  it("can be cancelled with a refund", () => {
    let { state } = run(rich(seedGame("t")), [{ type: "money.buy", playerId: "p2", itemId: "bg-climbing" }]);
    const before = state.players.find((p) => p.id === "p2")!.balanceCp;
    const r = apply(state, { type: "order.cancel", orderId: state.orders[0].id, refund: true }, DM);
    expect(r.state.orders).toEqual([]);
    expect(r.state.players.find((p) => p.id === "p2")!.balanceCp).toBe(before + 100 * GP);
    expect(r.ledger[0]).toMatchObject({ amountCp: 100 * GP, note: "Refund: Potion of Climbing" });
  });
});

describe("banners", () => {
  it("announce a shop opening to everyone, unless quiet", () => {
    let s = apply(seedGame("t"), { type: "shop.visibility", shopId: "smith", visibility: "all" }, DM).state;
    expect(s.banner?.text).toBe("Now open: The Smithy");
    s = apply(seedGame("t"), { type: "shop.visibility", shopId: "smith", visibility: "all", quiet: true }, DM).state;
    expect(s.banner).toBeNull();
  });

  it("never announce a secret offer", () => {
    const s = apply(seedGame("t"), { type: "shop.visibility", shopId: "peddler", visibility: "some", playerIds: ["p1"] }, DM).state;
    expect(s.banner).toBeNull();
  });

  it("announce an item that becomes more visible in an open shop", () => {
    let s = run(seedGame("t"), [{ type: "shop.visibility", shopId: "smith", visibility: "all", quiet: true }]).state;
    s = apply(s, { type: "item.update", itemId: "i20", patch: { tier: "sale" } }, DM).state;
    expect(s.banner?.text).toBe("New at The Smithy: Splint Armor");
    const quiet = apply(s, { type: "item.update", itemId: "i21", patch: { tier: "sale" }, quiet: true }, DM).state;
    expect(quiet.banner?.id).toBe(s.banner?.id);
  });

  it("stay silent about changes in hidden shops", () => {
    const s = apply(seedGame("t"), { type: "item.update", itemId: "i20", patch: { tier: "sale" } }, DM).state;
    expect(s.banner).toBeNull();
  });
});

describe("loading the starter catalog and upgrading old games", () => {
  it("catalog.reset swaps shops and items but leaves gold alone", () => {
    let { state } = run(seedGame("t"), [{ type: "money.adjust", playerId: "p1", amountCp: 100, note: "" }, { type: "item.remove", itemId: "i0" }]);
    state = apply(state, { type: "catalog.reset" }, DM).state;
    expect(state.items).toEqual(SEED_ITEMS);
    expect(state.players.find((p) => p.id === "p1")!.balanceCp).toBe(100);
  });

  it("upgrades a first-build game: shops hidden, lock reasons become tiers", () => {
    const old = {
      schema: 1,
      id: "candlefair",
      name: "Tales",
      live: { sceneId: "s-board", shopOpen: true, shopId: "smith", purseVisible: true },
      shops: [{ id: "smith", name: "The Smithy", subtitle: "Steel" }],
      items: [
        { id: "a", shopId: "smith", name: "Dagger", priceCp: 200, description: "", lockReason: "", hidePrice: false },
        { id: "b", shopId: "smith", name: "Plate", priceCp: 150000, description: "", lockReason: "Arrives at level 5", hidePrice: false },
        { id: "c", shopId: "smith", name: "Bag", priceCp: 0, description: "", lockReason: "After Baldur's Gate", hidePrice: true },
      ],
      players: [],
      scenes: [],
      sessions: [],
      currentSessionId: null,
      knocks: [],
      doorClosed: false,
      createdAt: 0,
      seq: 1,
    };
    const g = upgrade(old);
    expect(g.schema).toBe(2);
    expect(g.shops[0]).toMatchObject({ visibility: "hidden", playerIds: [] });
    expect(g.items.map((i) => [i.tier, i.reason, i.hidePrice])).toEqual([
      ["sale", "", false],
      ["locked", "Arrives at level 5", false],
      ["locked", "After Baldur's Gate", true],
    ]);
    expect(g.live.shopOpen).toBe(false);
    expect(g.orders).toEqual([]);
    expect(upgrade(g)).toBe(g); // already current: untouched
  });
});
