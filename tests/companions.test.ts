// Companions and hirelings: controllers, fights, payload safety, hiring, loot and practice.
import { describe, expect, it } from "vitest";
import type { Command } from "@/shared/commands";
import { dmCommand, playerCommand } from "@/shared/commands";
import { projectPlayer, projectTv } from "@/shared/projection";
import { apply, type Ctx } from "@/shared/reducer";
import { seedGame } from "@/shared/seed";
import { blankGame } from "@/shared/presets";
import { hydrate } from "@/server/store";
import { practiceCopy, practiceEdits } from "@/shared/practice";
import type { Combatant, GameState, LedgerEntry } from "@/shared/types";

const DM: Ctx = { now: 1000, actor: { role: "dm" } };
const as = (playerId: string): Ctx => ({ now: 1000, actor: { role: "player", playerId } });

function game(): GameState {
  const g = hydrate(seedGame("t"))!;
  g.players[2].away = true;
  g.players[3].away = true;
  g.players[0].character = "Brin";
  g.players[1].character = "Ash";
  // The Flickering Candle's storefront is open to everyone.
  for (const sh of g.shops) sh.visibility = "all";
  return g;
}

function run(g: GameState, cmds: (Command | [Command, Ctx])[], rand = () => 0.5): { state: GameState; ledger: LedgerEntry[] } {
  let state = g;
  const ledger: LedgerEntry[] = [];
  for (const c of cmds) {
    const [cmd, ctx] = Array.isArray(c) ? c : [c, DM];
    // Every command goes through the same schema the server checks.
    if (ctx.actor.role === "dm") dmCommand.parse(cmd);
    else playerCommand.parse(cmd);
    const r = apply(state, cmd, { ...ctx, rand });
    state = r.state;
    ledger.push(...r.ledger);
  }
  return { state, ledger };
}
const tryRun = (g: GameState, cmd: Command, ctx: Ctx = DM) => {
  try {
    run(g, [[cmd, ctx]]);
    return null;
  } catch (e) {
    return (e as Error).message;
  }
};

const comp = (g: GameState, name: string) => g.companions!.find((c) => c.name === name && c.status === "with")!;
const inFight = (g: GameState, name: string): Combatant => g.fight!.order.find((c) => c.name === name)!;
const attach = (templateId: string, controllerId = "p1", extra: Partial<{ stay: "session" | "until"; follow: boolean }> = {}): Command => ({
  type: "companion.attach",
  templateId,
  controllerId,
  stay: extra.stay ?? "until",
  ...(extra.follow ? { follow: true } : {}),
});

describe("seeded companions", () => {
  it("Candlefair gets the four, and the hire items hire them", () => {
    const g = game();
    expect(g.companionTemplates!.map((t) => t.id)).toEqual(["ct-sellsword", "ct-trollbark-guide", "ct-porter", "ct-fennick"]);
    const fen = g.companionTemplates!.find((t) => t.id === "ct-fennick")!;
    expect(fen).toMatchObject({ ac: 11, hp: 9, initBonus: 0, entryId: "e-fennick", needs: "friendly", takesShare: true });
    expect(g.companionTemplates!.find((t) => t.id === "ct-porter")!.combat).toBe(false);
    const sell = g.items.find((i) => i.id === "c-sellsword")!;
    expect(sell).toMatchObject({ kind: "recurring", companionTemplateId: "ct-sellsword", priceCp: 200 });
    expect(g.items.find((i) => i.id === "c-porter")!.priceCp).toBe(20);
  });
  it("a blank campaign stays empty", () => {
    const g = hydrate(structuredClone(blankGame("wick", "Blank", 1)))!;
    expect(g.companionTemplates ?? []).toEqual([]);
  });
});

describe("controllers", () => {
  it("only the controller's phone can run a companion, and the DM can switch it any time", () => {
    let { state } = run(game(), [attach("ct-sellsword", "p1")]);
    const id = comp(state, "Sellsword").id;
    expect(tryRun(state, { type: "me.companionHp", companionId: id, mode: "damage", amount: 2 }, as("p2"))).toMatch(/not running/);
    ({ state } = run(state, [[{ type: "me.companionHp", companionId: id, mode: "damage", amount: 2 }, as("p1")]]));
    expect(comp(state, "Sellsword").hp.cur).toBe(9);
    ({ state } = run(state, [{ type: "companion.update", companionId: id, controllerId: "p2" }]));
    expect(tryRun(state, { type: "me.companionHp", companionId: id, mode: "heal", amount: 1 }, as("p1"))).toMatch(/not running/);
    expect(tryRun(state, { type: "me.companionHp", companionId: id, mode: "heal", amount: 1 }, as("p2"))).toBeNull();
    // Run by the DM: no phone can.
    ({ state } = run(state, [{ type: "companion.update", companionId: id, controllerId: "dm" }]));
    expect(tryRun(state, { type: "me.companionHp", companionId: id, mode: "heal", amount: 1 }, as("p2"))).toMatch(/not running/);
    expect(projectPlayer(state, 1, "p2", []).myCompanions).toEqual([]);
  });

  it("the controller's phone gets the turn: their prompt, and End turn works only for them", () => {
    let { state } = run(game(), [attach("ct-sellsword", "p1"), attach("ct-porter", "p2"), { type: "fight.start" }]);
    // The porter doesn't fight.
    expect(state.fight!.order.map((c) => c.name)).toEqual(["Brin", "Ash", "Sellsword"]);
    const sw = comp(state, "Sellsword").id;
    ({ state } = run(state, [
      [{ type: "me.initiative", init: 5 }, as("p1")],
      [{ type: "me.initiative", init: 3 }, as("p2")],
      [{ type: "me.companionInit", companionId: sw, init: 20 }, as("p1")],
      { type: "fight.begin" },
    ]));
    expect(state.fight!.currentId).toBe(inFight(state, "Sellsword").id);
    const p1 = projectPlayer(state, 1, "p1", []);
    expect(p1.myCompanions[0]).toMatchObject({ name: "Sellsword", combatantId: inFight(state, "Sellsword").id, ac: 14, attacks: [{ name: "Spear", bonus: 3, damage: "1d6 + 1" }] });
    expect(p1.fight!.currentId).toBe(p1.myCompanions[0].combatantId);
    // Ash's phone sees whose turn it is, but has no controls for it (Ash only runs the porter).
    expect(projectPlayer(state, 1, "p2", []).myCompanions.map((c) => c.name)).toEqual(["Porter"]);
    expect(tryRun(state, { type: "me.companionEndTurn", companionId: sw }, as("p2"))).toMatch(/not running/);
    ({ state } = run(state, [[{ type: "me.companionEndTurn", companionId: sw }, as("p1")]]));
    expect(state.fight!.currentId).toBe(inFight(state, "Brin").id);
    expect(tryRun(state, { type: "me.companionEndTurn", companionId: sw }, as("p1"))).toMatch(/not Sellsword's turn/);
  });

  it("acts right after their controller", () => {
    let { state } = run(game(), [attach("ct-sellsword", "p2", { follow: true }), { type: "fight.start" }]);
    ({ state } = run(state, [[{ type: "me.initiative", init: 18 }, as("p1")], [{ type: "me.initiative", init: 9 }, as("p2")], { type: "fight.rollInit" }, { type: "fight.begin" }]));
    expect(state.fight!.order.map((c) => c.name)).toEqual(["Brin", "Ash", "Sellsword"]);
    expect(inFight(state, "Sellsword").init).toBe(9);
  });

  it("abilities: marked used from the phone, and the DM's recharge rolls see them", () => {
    let { state } = run(game(), [
      {
        type: "companion.templateAdd",
        template: {
          name: "Guard",
          combat: true,
          ac: 15,
          hp: 12,
          initBonus: 1,
          speed: "",
          attacks: [],
          abilities: [{ name: "Second Wind", text: "Heal 1d10.", uses: 1 }],
          resist: "",
          offers: "",
          dmNote: "",
          hidden: [],
          tvHealth: "state",
          atZero: "saves",
          takesShare: false,
        },
      },
    ]);
    const t = state.companionTemplates!.at(-1)!;
    ({ state } = run(state, [attach(t.id, "p1")]));
    const id = comp(state, "Guard").id;
    ({ state } = run(state, [[{ type: "me.companionAbility", companionId: id, abilityId: t.abilities[0].id, act: "use" }, as("p1")]]));
    expect(comp(state, "Guard").spent).toEqual({ [t.abilities[0].id]: 1 });
    expect(tryRun(state, { type: "me.companionAbility", companionId: id, abilityId: t.abilities[0].id, act: "use" }, as("p1"))).toMatch(/used up/);
    expect(projectPlayer(state, 1, "p1", []).myCompanions[0].abilities![0]).toMatchObject({ name: "Second Wind", uses: 1, spent: 1 });
    // It carries into a fight, and a long rest clears it.
    ({ state } = run(state, [{ type: "fight.start" }]));
    expect(inFight(state, "Guard").spent).toEqual({ [t.abilities[0].id]: 1 });
    ({ state } = run(state, [{ type: "fight.cancel" }, { type: "companion.rest", companionId: id }]));
    expect(comp(state, "Guard").spent).toEqual({});
  });
});

describe("what reaches the TV and phones", () => {
  it("never the DM note, the linked person, or the fields the DM hid", () => {
    let { state } = run(game(), [attach("ct-fennick", "p1"), { type: "fight.start" }]);
    const t = state.companionTemplates!.find((x) => x.id === "ct-fennick")!;
    expect(t.dmNote).toMatch(/boat/);
    const views = [projectTv(state, 1), projectPlayer(state, 1, "p1", []), projectPlayer(state, 1, "p2", [])];
    for (const v of views) {
      const json = JSON.stringify([v.fight, v.companions, "myCompanions" in v ? v.myCompanions : null, v.items]);
      expect(json).not.toContain(t.dmNote);
      expect(json).not.toContain("e-fennick");
      expect(json).not.toContain("ct-fennick");
      expect(json).not.toContain("companionTemplateId");
    }
    // Everyone gets the small card; only p1 gets the stat block.
    expect(projectPlayer(state, 1, "p2", []).companions[0]).toMatchObject({ name: "Fennick", controller: "Brin", health: "unhurt" });
    expect(projectPlayer(state, 1, "p2", []).companions[0]).not.toHaveProperty("ac");
    // The DM hides AC and attacks from the controller.
    const body = { ...t, hidden: ["ac", "attacks"] } as Record<string, unknown>;
    delete body.id;
    ({ state } = run(state, [{ type: "companion.templateUpdate", templateId: t.id, template: body as never }]));
    const mine = projectPlayer(state, 1, "p1", []).myCompanions[0];
    expect(mine).not.toHaveProperty("ac");
    expect(mine).not.toHaveProperty("attacks");
    expect(mine.hp).toEqual({ cur: 9, max: 9, temp: 0 });
  });

  it("the TV shows a health state by default, an HP bar when the DM chooses it", () => {
    let { state } = run(game(), [attach("ct-sellsword", "p1"), { type: "fight.start" }]);
    const c = inFight(state, "Sellsword");
    ({ state } = run(state, [{ type: "fight.hp", combatantIds: [c.id], mode: "damage", amount: 6 }]));
    let tv = projectTv(state, 1).fight!.order.find((x) => x.id === c.id)!;
    expect(tv).toMatchObject({ kind: "companion", health: "bloodied" });
    expect(tv).not.toHaveProperty("hp");
    const t = state.companionTemplates!.find((x) => x.id === "ct-sellsword")!;
    const { id: _id, ...body } = t;
    ({ state } = run(state, [{ type: "companion.templateUpdate", templateId: t.id, template: { ...body, tvHealth: "hp" } as never }]));
    tv = projectTv(state, 1).fight!.order.find((x) => x.id === c.id)!;
    expect(tv.hp).toEqual({ cur: 5, max: 11, temp: 0 });
  });
});

describe("at 0 HP", () => {
  it("death saves: the controller marks them; three failures and they die, and the DM gets a nudge", () => {
    let { state } = run(game(), [attach("ct-fennick", "p1"), { type: "fight.start" }]);
    const c = inFight(state, "Fennick");
    ({ state } = run(state, [{ type: "fight.hp", combatantIds: [c.id], mode: "damage", amount: 20 }]));
    expect(inFight(state, "Fennick")).toMatchObject({ down: true, deathSaves: { ok: 0, fail: 0 } });
    const id = comp(state, "Fennick").id;
    expect(projectPlayer(state, 1, "p1", []).myCompanions[0].deathSaves).toEqual({ ok: 0, fail: 0 });
    expect(tryRun(state, { type: "me.companionDeathSave", companionId: id, mark: "fail" }, as("p2"))).toMatch(/not running/);
    ({ state } = run(state, [
      [{ type: "me.companionDeathSave", companionId: id, mark: "fail" }, as("p1")],
      [{ type: "me.companionDeathSave", companionId: id, mark: "fail" }, as("p1")],
      [{ type: "me.companionDeathSave", companionId: id, mark: "fail" }, as("p1")],
    ]));
    expect(state.companions!.find((x) => x.id === id)!.status).toBe("dead");
    expect(state.tasks.at(-1)!.text).toMatch(/Fennick died.*Fennick's relationships/);
  });

  it("the DM can choose Dies instead, and a hireling's hire ends with them", () => {
    let g = game();
    g.players[0].balanceCp = 10_000;
    let { state } = run(g, [[{ type: "me.requestBuy", itemId: "c-sellsword", qty: 1, note: "" }, as("p1")]]);
    ({ state } = run(state, [{ type: "request.approve", requestId: state.requests.at(-1)!.id }, { type: "fight.start" }]));
    const c = inFight(state, "Sellsword");
    ({ state } = run(state, [
      { type: "fight.hp", combatantIds: [c.id], mode: "damage", amount: 11 },
      { type: "fight.companionFate", combatantId: c.id, fate: "dies" },
    ]));
    expect(state.companions!.find((x) => x.name === "Sellsword")!.status).toBe("dead");
    expect(state.rentals.find((r) => r.itemId === "c-sellsword")!.active).toBe(false);
    void g;
  });
});

describe("hirelings", () => {
  function hired() {
    const g = game();
    g.players[0].balanceCp = 10_000;
    let { state } = run(g, [{ type: "session.start" }, [{ type: "me.requestBuy", itemId: "c-sellsword", qty: 1, note: "" }, as("p1")]]);
    const r = run(state, [{ type: "request.approve", requestId: state.requests.at(-1)!.id }]);
    state = r.state;
    return { state, ledger: r.ledger };
  }

  it("buying the hire item brings them along, run by the buyer, who pays", () => {
    const { state, ledger } = hired();
    expect(comp(state, "Sellsword")).toMatchObject({ controllerId: "p1", stay: "until", hire: { buyerId: "p1" } });
    expect(ledger.find((l) => l.playerId === "p1")!.amountCp).toBe(-200);
    expect(state.players[0].balanceCp).toBe(9_800);
  });

  it("Keep charges the buyer once per session; Let go ends it", () => {
    let { state } = hired();
    const id = comp(state, "Sellsword").id;
    // Not part of the ordinary rent list (it has its own Keep or Let go).
    expect(apply(state, { type: "session.end" }, DM).state.companions!.find((c) => c.id === id)!.status).toBe("with");
    ({ state } = run(state, [{ type: "companion.keep", companionId: id }]));
    expect(state.players[0].balanceCp).toBe(9_600);
    expect(tryRun(state, { type: "companion.keep", companionId: id })).toMatch(/already paid/);
    ({ state } = run(state, [{ type: "session.end" }, { type: "session.start" }]));
    // Session 2 is paid for. At its end: Let go (nothing more is charged).
    ({ state } = run(state, [{ type: "companion.dismiss", companionId: id }]));
    expect(state.companions!.find((c) => c.id === id)!.status).toBe("gone");
    expect(state.rentals.find((r) => r.itemId === "c-sellsword")!.active).toBe(false);
    expect(projectPlayer(state, 1, "p1", []).companions).toEqual([]);
    expect(state.players[0].balanceCp).toBe(9_600);
  });

  it("a player giving up the hire on their phone lets them go too", () => {
    let { state } = hired();
    const rental = state.rentals.find((r) => r.itemId === "c-sellsword")!;
    ({ state } = run(state, [[{ type: "me.cancelRental", rentalId: rental.id }, as("p1")]]));
    expect(state.companions!.find((c) => c.name === "Sellsword")!.status).toBe("gone");
  });
});

describe("loot and sessions", () => {
  it("companions only get a share if they take one; hirelings never", () => {
    const g = game();
    g.players[0].balanceCp = 10_000;
    let { state } = run(g, [[{ type: "me.requestBuy", itemId: "c-sellsword", qty: 1, note: "" }, as("p1")]]);
    ({ state } = run(state, [
      { type: "request.approve", requestId: state.requests.at(-1)!.id },
      attach("ct-fennick", "p2"),
      attach("ct-trollbark-guide", "dm"),
      { type: "fight.start" },
      { type: "fight.begin" },
      { type: "fight.end" },
    ]));
    const fen = comp(state, "Fennick").id;
    expect(tryRun(state, { type: "fight.close", companionPayouts: [{ companionId: comp(state, "Sellsword").id, cp: 100 }] })).toMatch(/hireling/);
    expect(tryRun(state, { type: "fight.close", companionPayouts: [{ companionId: comp(state, "Trollbark guide").id, cp: 100 }] })).toMatch(/doesn't take a share/);
    ({ state } = run(state, [{ type: "fight.close", payouts: [{ playerId: "p1", cp: 300 }], companionPayouts: [{ companionId: fen, cp: 1400 }] }]));
    expect(state.companions!.find((c) => c.id === fen)!.purseCp).toBe(1400);
    expect(projectPlayer(state, 1, "p1", []).companions.find((c) => c.name === "Fennick")!.purseCp).toBe(1400);
    expect(state.fights!.at(-1)!.lootCp).toBe(1700);
  });

  it("companions along for the session go home when it ends", () => {
    let { state } = run(game(), [{ type: "session.start" }, attach("ct-sellsword", "p1", { stay: "session" }), attach("ct-fennick", "p1", { stay: "until" }), { type: "session.end" }]);
    expect(state.companions!.filter((c) => c.status === "with").map((c) => c.name)).toEqual(["Fennick"]);
  });
});

describe("practice", () => {
  it("companions attached and hurt in practice never reach the live game; stat block edits can be kept", () => {
    const live = game();
    const base = practiceCopy(live, 1000);
    let { state } = run(base, [attach("ct-sellsword", "p1"), { type: "fight.start" }]);
    const c = inFight(state, "Sellsword");
    const t = state.companionTemplates!.find((x) => x.id === "ct-sellsword")!;
    const { id: _id, ...body } = t;
    ({ state } = run(state, [
      { type: "fight.hp", combatantIds: [c.id], mode: "damage", amount: 4 },
      { type: "companion.templateUpdate", templateId: t.id, template: { ...body, ac: 15 } as never },
    ]));
    const edits = practiceEdits(base, state, live);
    expect(edits.map((e) => e.id)).toEqual(["companionTemplates:ct-sellsword"]);
    expect(live.companions ?? []).toEqual([]);
  });
});
