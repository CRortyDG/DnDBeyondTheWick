// Combat mode: turn order, hit points, conditions, reminders, loot and spoiler safety.
import { describe, expect, it } from "vitest";
import { concentrationDc, healthState, insertSorted, parseFightLine, sortByInitiative } from "@/shared/combat";
import type { Command } from "@/shared/commands";
import { projectDm, projectPlayer, projectTv } from "@/shared/projection";
import { apply, type Ctx } from "@/shared/reducer";
import { parseEpisode, sceneResolver } from "@/shared/runsheet";
import { seedGame } from "@/shared/seed";
import { hydrate, createMemoryStore } from "@/server/store";
import { execute, viewFor } from "@/server/game";
import type { Combatant, GameState, LedgerEntry } from "@/shared/types";

const DM: Ctx = { now: 1000, actor: { role: "dm" } };
const as = (playerId: string): Ctx => ({ now: 1000, actor: { role: "player", playerId } });

/** A seeded game, read the way the server reads it (so it has the Pudding Gremlin). */
function game(): GameState {
  const g = hydrate(seedGame("t"))!;
  // Two players at the table tonight, two away.
  g.players[2].away = true;
  g.players[3].away = true;
  g.players[0].character = "Brin";
  g.players[1].character = "Ash";
  return g;
}

/** Run commands in order; dice always roll this fraction (0.5 -> d20 = 11, d6 = 4). */
function run(g: GameState, cmds: (Command | [Command, Ctx])[], rand = () => 0.5): { state: GameState; ledger: LedgerEntry[] } {
  let state = g;
  const ledger: LedgerEntry[] = [];
  for (const c of cmds) {
    const [cmd, ctx] = Array.isArray(c) ? c : [c, DM];
    const r = apply(state, cmd, { ...ctx, rand });
    state = r.state;
    ledger.push(...r.ledger);
  }
  return { state, ledger };
}

const GREMLIN = "m-pudding-gremlin";
const names = (g: GameState) => g.fight!.order.map((c) => c.name);
const byName = (g: GameState, name: string): Combatant => g.fight!.order.find((c) => c.name === name)!;
const cur = (g: GameState) => g.fight!.order.find((c) => c.id === g.fight!.currentId)!.name;

/** Brin 15, Ash 12, gremlins A and B rolled (11 + 1 = 12 each), begun. */
function begun(): GameState {
  let { state } = run(game(), [{ type: "fight.start", groups: [{ templateId: GREMLIN, count: 2 }] }]);
  const f = state.fight!;
  const brin = f.order.find((c) => c.playerId === "p1")!.id;
  const ash = f.order.find((c) => c.playerId === "p2")!.id;
  ({ state } = run(state, [
    [{ type: "me.initiative", init: 15 }, as("p1")],
    [{ type: "me.initiative", init: 12 }, as("p2")],
    { type: "fight.init", combatantId: ash, init: 12, bonus: 0 },
    { type: "fight.rollInit" },
    { type: "fight.begin" },
  ]));
  void brin;
  return state;
}

describe("initiative order", () => {
  it("sorts high to low; ties go to the higher bonus, otherwise stay as entered", () => {
    const list = [
      { id: "a", init: 12, initBonus: null },
      { id: "b", init: 15, initBonus: null },
      { id: "c", init: 12, initBonus: null },
      { id: "d", init: 12, initBonus: 3 },
      { id: "e", init: 12, initBonus: 1 },
      { id: "f", init: null, initBonus: 5 },
    ];
    // a and c have no bonus: they stay as entered. d beats e on bonus.
    expect(sortByInitiative(list).map((x) => x.id)).toEqual(["b", "a", "c", "d", "e", "f"]);
    const two = sortByInitiative([
      { id: "e", init: 12, initBonus: 1 },
      { id: "d", init: 12, initBonus: 3 },
    ]);
    expect(two.map((x) => x.id)).toEqual(["d", "e"]);
  });

  it("keeps a manual reorder when a new entry arrives", () => {
    const order = [
      { id: "x", init: 10, initBonus: null },
      { id: "y", init: 18, initBonus: null },
    ]; // the DM dragged x above y
    insertSorted(order, { id: "z", init: 5, initBonus: null });
    expect(order.map((o) => o.id)).toEqual(["x", "y", "z"]);
  });

  it("letters groups, takes phone entries live, and slots monsters by their roll", () => {
    const g = begun();
    // Gremlins: d20 11 + 1 = 12, ties with Ash (bonus 0) and wins on bonus.
    expect(names(g)).toEqual(["Brin", "Pudding Gremlin A", "Pudding Gremlin B", "Ash"]);
    expect(byName(g, "Pudding Gremlin A").displayName).toBe("Something in the pudding A");
    expect(g.fight!.round).toBe(1);
    expect(cur(g)).toBe("Brin");
  });

  it("drag to reorder moves one combatant", () => {
    let g = begun();
    ({ state: g } = run(g, [{ type: "fight.move", combatantId: byName(g, "Ash").id, to: 0 }]));
    expect(names(g)).toEqual(["Ash", "Brin", "Pudding Gremlin A", "Pudding Gremlin B"]);
  });

  it("adds a mid-fight monster right after its creator", () => {
    let g = begun();
    const a = byName(g, "Pudding Gremlin A");
    ({ state: g } = run(g, [{ type: "fight.add", templateId: GREMLIN, count: 1, after: a.id }]));
    expect(names(g)).toEqual(["Brin", "Pudding Gremlin A", "Pudding Gremlin C", "Pudding Gremlin B", "Ash"]);
    expect(byName(g, "Pudding Gremlin C").init).toBe(a.init);
  });
});

describe("turns", () => {
  it("next and previous wrap rounds and skip the defeated", () => {
    let g = begun();
    const b = byName(g, "Pudding Gremlin B");
    ({ state: g } = run(g, [{ type: "fight.hp", combatantIds: [b.id], mode: "damage", amount: 50 }]));
    expect(byName(g, "Pudding Gremlin B").down).toBe(true);
    const seen: string[] = [];
    for (let i = 0; i < 4; i++) {
      ({ state: g } = run(g, [{ type: "fight.next" }]));
      seen.push(`${g.fight!.round}:${cur(g)}`);
    }
    expect(seen).toEqual(["1:Pudding Gremlin A", "1:Ash", "2:Brin", "2:Pudding Gremlin A"]);
    // B went down in round 1: off the strip from round 2.
    expect(byName(g, "Pudding Gremlin B").gone).toBe(true);
    ({ state: g } = run(g, [{ type: "fight.back" }, { type: "fight.back" }]));
    expect(`${g.fight!.round}:${cur(g)}`).toBe("1:Ash");
    expect(byName(g, "Pudding Gremlin B").gone).toBeUndefined();
  });

  it("players at 0 HP still get their turn (death saves)", () => {
    let g = begun();
    const ash = byName(g, "Ash");
    ({ state: g } = run(g, [
      [{ type: "me.hp", max: 20, cur: 20 }, as("p2")],
      { type: "fight.hp", combatantIds: [ash.id], mode: "damage", amount: 25 },
      { type: "fight.next" },
      { type: "fight.next" },
      { type: "fight.next" },
    ]));
    expect(cur(g)).toBe("Ash");
    expect(byName(g, "Ash").deathSaves).toEqual({ ok: 0, fail: 0 });
  });

  it("only the current player can end their turn from the phone", () => {
    let g = begun();
    expect(() => run(g, [[{ type: "me.endTurn" }, as("p2")]])).toThrow(/not your turn/);
    ({ state: g } = run(g, [[{ type: "me.endTurn" }, as("p1")]]));
    expect(cur(g)).toBe("Pudding Gremlin A");
  });

  it("pause keeps the exact turn and holds the timer", () => {
    let g = begun();
    ({ state: g } = run(g, [{ type: "fight.settings", timerSec: 60 }]));
    const started = g.fight!.turnStartedAt;
    ({ state: g } = run(g, [[{ type: "fight.pause", paused: true }, { ...DM, now: 5000 }]]));
    expect(g.fight!.status).toBe("paused");
    ({ state: g } = run(g, [[{ type: "fight.pause", paused: false }, { ...DM, now: 65000 }]]));
    expect(g.fight!.status).toBe("running");
    expect(cur(g)).toBe("Brin");
    expect(g.fight!.turnStartedAt).toBe(started + 60000);
  });
});

describe("conditions", () => {
  it("count down on the owner's chosen turn edge, expire with a reminder, and come back on Previous", () => {
    let g = begun();
    const brin = byName(g, "Brin");
    const a = byName(g, "Pudding Gremlin A");
    ({ state: g } = run(g, [
      { type: "fight.condition", combatantIds: [brin.id], name: "frightened", rounds: 1, tick: "end" },
      { type: "fight.condition", combatantIds: [a.id], name: "Prone", rounds: 2, tick: "start" },
    ]));
    expect(byName(g, "Brin").conditions[0].name).toBe("Frightened");
    // Brin's turn ends: Frightened (1 round, at the end) expires.
    ({ state: g } = run(g, [{ type: "fight.next" }]));
    expect(byName(g, "Brin").conditions).toEqual([]);
    expect(g.fight!.reminders.some((r) => r.kind === "expired" && r.text === "Brin is no longer Frightened.")).toBe(true);
    // Gremlin A's turn started: Prone 2 -> 1.
    expect(byName(g, "Pudding Gremlin A").conditions[0].rounds).toBe(1);
    // Ash's turn doesn't touch either.
    ({ state: g } = run(g, [{ type: "fight.next" }, { type: "fight.next" }]));
    expect(byName(g, "Pudding Gremlin A").conditions[0].rounds).toBe(1);
    // Round 2, Brin, then A's turn starts: Prone expires.
    ({ state: g } = run(g, [{ type: "fight.next" }, { type: "fight.next" }]));
    expect(cur(g)).toBe("Pudding Gremlin A");
    expect(byName(g, "Pudding Gremlin A").conditions).toEqual([]);
    expect(g.fight!.reminders.some((r) => r.text === "Pudding Gremlin A is no longer Prone.")).toBe(true);
    // Previous puts Prone back at 1.
    ({ state: g } = run(g, [{ type: "fight.back" }]));
    expect(byName(g, "Pudding Gremlin A").conditions.map((c) => [c.name, c.rounds])).toEqual([["Prone", 1]]);
  });

  it("exhaustion has a level", () => {
    let g = begun();
    ({ state: g } = run(g, [{ type: "fight.condition", combatantIds: [byName(g, "Ash").id], name: "Exhaustion", level: 2 }]));
    expect(byName(g, "Ash").conditions[0]).toMatchObject({ name: "Exhaustion", level: 2 });
  });
});

describe("concentration", () => {
  it("DC is max(10, half the damage), capped at 30", () => {
    expect(concentrationDc(1)).toBe(10);
    expect(concentrationDc(21)).toBe(10);
    expect(concentrationDc(22)).toBe(11);
    expect(concentrationDc(45)).toBe(22);
    expect(concentrationDc(61)).toBe(30);
    expect(concentrationDc(200)).toBe(30);
  });

  it("reminds the DM (and the player's phone) when a concentrating combatant is hit", () => {
    let g = begun();
    const brin = byName(g, "Brin");
    ({ state: g } = run(g, [
      [{ type: "me.hp", max: 40, cur: 40 }, as("p1")],
      { type: "fight.patch", combatantIds: [brin.id], patch: { concentrating: true } },
      { type: "fight.hp", combatantIds: [brin.id], mode: "damage", amount: 24 },
    ]));
    expect(g.fight!.reminders.map((r) => r.text)).toContain("Brin is concentrating: Constitution save DC 12.");
    expect(projectPlayer(g, 1, "p1", []).myFight?.concDc).toBe(12);
  });
});

describe("recharge and death burst", () => {
  it("reminds at the start of the monster's turn only once the ability is used", () => {
    let g = begun();
    const a = byName(g, "Pudding Gremlin A");
    ({ state: g } = run(g, [{ type: "fight.next" }]));
    expect(g.fight!.reminders.some((r) => r.kind === "recharge")).toBe(false);
    ({ state: g } = run(g, [{ type: "fight.ability", combatantId: a.id, abilityId: "fire-breath", act: "use" }, { type: "fight.next" }, { type: "fight.next" }, { type: "fight.next" }]));
    // Round 2: Brin's turn, no reminder yet.
    expect(g.fight!.reminders.some((r) => r.kind === "recharge")).toBe(false);
    ({ state: g } = run(g, [{ type: "fight.next" }]));
    expect(cur(g)).toBe("Pudding Gremlin A");
    expect(g.fight!.reminders.find((r) => r.kind === "recharge")?.text).toBe("Pudding Gremlin A: roll d6 for Fire Breath: recharges on 6.");
    // A roll of 4 doesn't recharge it; a 6 does.
    ({ state: g } = run(g, [{ type: "fight.ability", combatantId: a.id, abilityId: "fire-breath", act: "roll" }], () => 0.5));
    expect(byName(g, "Pudding Gremlin A").spent["fire-breath"]).toBe(1);
    ({ state: g } = run(g, [{ type: "fight.ability", combatantId: a.id, abilityId: "fire-breath", act: "roll" }], () => 0.99));
    expect(byName(g, "Pudding Gremlin A").spent["fire-breath"]).toBeUndefined();
    expect(g.fight!.reminders.some((r) => r.kind === "recharge")).toBe(false);
  });

  it("limited-use stays ticked for the fight", () => {
    let g = begun();
    const a = byName(g, "Pudding Gremlin A");
    ({ state: g } = run(g, [{ type: "fight.ability", combatantId: a.id, abilityId: "create-gremlin", act: "use" }, { type: "fight.next" }, { type: "fight.next" }, { type: "fight.next" }, { type: "fight.next" }]));
    expect(byName(g, "Pudding Gremlin A").spent["create-gremlin"]).toBe(1);
  });

  it("Death Burst fires when a gremlin drops to 0, not before", () => {
    let g = begun();
    const a = byName(g, "Pudding Gremlin A");
    ({ state: g } = run(g, [{ type: "fight.hp", combatantIds: [a.id], mode: "damage", amount: 20 }]));
    expect(g.fight!.reminders.some((r) => r.text.startsWith("Death Burst"))).toBe(false);
    ({ state: g } = run(g, [{ type: "fight.hp", combatantIds: [a.id], mode: "damage", amount: 1 }]));
    expect(g.fight!.reminders.map((r) => r.text)).toContain("Death Burst! DC 11 Dex, 2d6, 5 ft.");
    expect(g.fight!.moment).toMatchObject({ kind: "monsterDown", name: "Something in the pudding A" });
  });
});

describe("health states", () => {
  it("change at the right thresholds", () => {
    expect(healthState(21, 21)).toBe("unhurt");
    expect(healthState(20, 21)).toBe("hurt");
    expect(healthState(11, 21)).toBe("hurt");
    expect(healthState(10, 20)).toBe("bloodied");
    expect(healthState(6, 20)).toBe("bloodied");
    expect(healthState(5, 20)).toBe("barely");
    expect(healthState(1, 20)).toBe("barely");
    expect(healthState(0, 20)).toBe("down");
  });

  it("temporary HP soaks damage first and doesn't stack", () => {
    let g = begun();
    const a = byName(g, "Pudding Gremlin A");
    ({ state: g } = run(g, [
      { type: "fight.hp", combatantIds: [a.id], mode: "temp", amount: 5 },
      { type: "fight.hp", combatantIds: [a.id], mode: "temp", amount: 3 },
      { type: "fight.hp", combatantIds: [a.id], mode: "damage", amount: 7 },
    ]));
    expect(byName(g, "Pudding Gremlin A")).toMatchObject({ hp: 19, tempHp: 0 });
  });
});

describe("the run sheet's fight: line", () => {
  it("parses counts and round-trips", () => {
    expect(parseFightLine("Pudding Gremlin x2, Goblin, 3 Wolves")).toEqual([
      { name: "Pudding Gremlin", count: 2 },
      { name: "Goblin", count: 1 },
      { name: "Wolves", count: 3 },
    ]);
    const p = parseEpisode("## Fight!\nfight: Pudding Gremlin x2", sceneResolver([]));
    expect(p.beats[0].actions).toEqual([{ type: "fight", monsters: [{ name: "Pudding Gremlin", count: 2 }] }]);
    expect(p.warnings).toEqual([]);
  });

  it("the seed episode's pudding beat sets up two gremlins when you land on it", () => {
    let g = game();
    const ep = g.episodes![0];
    const at = ep.beats.findIndex((b) => b.title === "The pudding fight");
    expect(ep.beats[at].actions).toEqual([{ type: "fight", monsters: [{ name: "Pudding Gremlin", count: 2 }] }]);
    ({ state: g } = run(g, [{ type: "session.start" }, { type: "run.start", episodeId: ep.id }, { type: "run.jump", stage: "beat", beat: at }]));
    expect(g.fight?.status).toBe("setup");
    expect(names(g)).toEqual(["Brin", "Ash", "Pudding Gremlin A", "Pudding Gremlin B"]);
    expect(g.fight!.reminders.map((r) => r.text)).toContain("Pudding Gremlin: Start with two; only one uses Create Gremlin.");
  });

  it("gives an already-saved pudding beat its fight line once", () => {
    const g = seedGame("t");
    g.episodes = parseEpisode("## The pudding fight\n- old notes\naction: initiative", sceneResolver([])).beats.map((b, i) => ({ id: `e${i}`, title: "Ep", beats: [{ id: "b1", ...b }] }));
    const h = hydrate(g)!;
    expect(h.episodes![0].beats[0].actions).toEqual([{ type: "fight", monsters: [{ name: "Pudding Gremlin", count: 2 }] }]);
    // A DM who then removes it keeps it removed.
    h.episodes![0].beats[0].actions = [];
    expect(hydrate(h)!.episodes![0].beats[0].actions).toEqual([]);
  });
});

describe("spoiler safety", () => {
  const CANARY = "CANARY_FIGHT_9c1";

  function secretFight(): GameState {
    let g = begun();
    const a = byName(g, "Pudding Gremlin A");
    ({ state: g } = run(g, [
      { type: "fight.add", templateId: GREMLIN, count: 1, init: 3 },
      { type: "fight.addQuick", name: `${CANARY} lurker`, init: 2, hp: 77, ac: 19 },
      { type: "fight.settings", dmNotes: `${CANARY} fight notes` },
      { type: "fight.patch", combatantIds: [a.id], patch: { note: `${CANARY} combatant note` } },
      { type: "fight.hp", combatantIds: [a.id], mode: "damage", amount: 4 },
    ]));
    const lurker = g.fight!.order.find((c) => c.name.startsWith(CANARY))!;
    ({ state: g } = run(g, [{ type: "fight.patch", combatantIds: [lurker.id], patch: { hidden: true } }]));
    return g;
  }

  function leaks(json: string): string[] {
    return [CANARY, "Pudding Gremlin", "Fire Breath", "Create Gremlin", "only one uses", '"ac"', '"maxHp"', '"hp":17', "\"hp\":77", "dmNotes", "reminders", "templateId", '"note"', "spent"].filter((x) => json.includes(x));
  }

  it("TV and player payloads never carry monster HP, AC, real names, hidden combatants or DM notes", () => {
    const g = secretFight();
    const tv = JSON.stringify(projectTv(g, 1));
    const phone = JSON.stringify(projectPlayer(g, 1, "p1", []));
    expect(leaks(tv)).toEqual([]);
    expect(leaks(phone)).toEqual([]);
    const tvFight = projectTv(g, 1).fight!;
    expect(tvFight.order.map((c) => c.name)).toEqual(["Brin", "Something in the pudding A", "Something in the pudding B", "Ash", "Something in the pudding C"]);
    expect(tvFight.order[1].health).toBe("hurt");
    // The DM sees everything.
    expect(JSON.stringify(projectDm(g, 1, []))).toContain(CANARY);
  });

  it("a revealed monster shows its real name; a hidden one's turn shows as nobody", () => {
    let g = secretFight();
    const a = byName(g, "Pudding Gremlin A");
    ({ state: g } = run(g, [{ type: "fight.patch", combatantIds: [a.id], patch: { revealed: true } }]));
    expect(projectTv(g, 1).fight!.order[1].name).toBe("Pudding Gremlin A");
    // Walk to the hidden lurker's turn.
    for (let i = 0; i < 5; i++) ({ state: g } = run(g, [{ type: "fight.next" }]));
    expect(cur(g)).toContain("lurker");
    const tvFight = projectTv(g, 1).fight!;
    expect(tvFight.currentId).toBeNull();
    expect(JSON.stringify(tvFight)).not.toContain(CANARY);
  });

  it("a player's HP is on the TV only while they show it", () => {
    let g = begun();
    ({ state: g } = run(g, [[{ type: "me.hp", max: 30, cur: 22 }, as("p1")]]));
    expect(projectTv(g, 1).fight!.order[0].hp).toEqual({ cur: 22, max: 30, temp: 0 });
    ({ state: g } = run(g, [[{ type: "me.hp", tv: false }, as("p1")]]));
    expect(projectTv(g, 1).fight!.order[0].hp).toBeUndefined();
    expect(projectPlayer(g, 1, "p1", []).me.hp).toEqual({ cur: 22, max: 30, temp: 0, tv: false });
  });
});

describe("ending a fight", () => {
  it("loot pays out once through the ledger, writes the Chronicle and puts the TV back", () => {
    let g = begun();
    const sceneBefore = g.fight!.returnSceneId;
    ({ state: g } = run(g, [{ type: "scene.show", sceneId: "s-chef" }, { type: "fight.next" }, { type: "fight.end" }]));
    expect(g.fight!.status).toBe("over");
    expect(projectTv(g, 1).fight!.over).toEqual({ rounds: 1, downed: [] });
    const close: Command = { type: "fight.close", payouts: [{ playerId: "p1", cp: 500 }, { playerId: "p2", cp: 500 }], items: "a silver ladle", note: "Fought 2 gremlins. 1 round." };
    const r = run(g, [close]);
    g = r.state;
    expect(r.ledger.map((l) => [l.playerId, l.amountCp, l.kind])).toEqual([
      ["p1", 500, "loot"],
      ["p2", 500, "loot"],
    ]);
    expect(g.players[0].balanceCp).toBe(500);
    expect(g.fight).toBeUndefined();
    expect(g.live.sceneId).toBe(sceneBefore);
    expect(g.notes!.at(-1)!.text).toBe("Fought 2 gremlins. 1 round.");
    expect(g.fights!.at(-1)).toMatchObject({ rounds: 1, lootCp: 1000, items: "a silver ladle" });
    // A second close (a double tap) can't pay again.
    expect(() => run(g, [close])).toThrow(/no fight/i);
  });
});

describe("reliability", () => {
  it("refreshing the DM view, the TV or a phone mid-fight gets the same fight", async () => {
    const store = createMemoryStore();
    await store.overwrite("c", game(), []);
    await execute(store, "c", { role: "dm" }, { type: "fight.start", groups: [{ templateId: GREMLIN, count: 2 }] });
    await execute(store, "c", { role: "player", playerId: "p1" }, { type: "me.initiative", init: 14 });
    await execute(store, "c", { role: "dm" }, { type: "fight.rollInit" });
    await execute(store, "c", { role: "dm" }, { type: "fight.begin" });
    await execute(store, "c", { role: "dm" }, { type: "fight.next" });
    const first = await viewFor(store, "c", { role: "tv" });
    const again = await viewFor(store, "c", { role: "tv" });
    if (first.role !== "tv" || again.role !== "tv") throw new Error();
    expect({ ...again.fight, timer: null }).toEqual({ ...first.fight, timer: null });
    const phone = await viewFor(store, "c", { role: "player", playerId: "p1" });
    const dm = await viewFor(store, "c", { role: "dm" });
    if (phone.role !== "player" || dm.role !== "dm") throw new Error();
    expect(phone.fight!.currentId).toBe(dm.state.fight!.currentId);
    expect(phone.myFight!.init).toBe(14);
  });
});

describe("the Chronicle line", () => {
  it("uses the names the table knows", async () => {
    const { chronicleLine } = await import("@/shared/combatReducer");
    let g = begun();
    ({ state: g } = run(g, [{ type: "fight.settings", where: "in the feast hall" }, { type: "fight.next" }, { type: "fight.end" }]));
    expect(chronicleLine(g.fight!)).toBe("Fought Something in the pudding (×2) in the feast hall. 1 round.");
    const ids = g.fight!.order.filter((c) => c.kind === "monster").map((c) => c.id);
    ({ state: g } = run(g, [{ type: "fight.patch", combatantIds: ids, patch: { revealed: true } }]));
    expect(chronicleLine(g.fight!, "a ladle", 4000)).toBe("Fought 2 Pudding Gremlins in the feast hall. 1 round. Found: 40 gp, a ladle.");
  });
});
