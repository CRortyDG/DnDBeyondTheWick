// The party stash: loot nobody has claimed yet, from the fight's loot step to a character's sheet.
import { beforeEach, describe, expect, it } from "vitest";
import { dmCommand, playerCommand, type Command } from "@/shared/commands";
import { projectPlayer, projectTv } from "@/shared/projection";
import { apply, CommandError, type Ctx } from "@/shared/reducer";
import { freshStart, seedGame } from "@/shared/seed";
import { hydrate } from "@/server/store";
import type { GameState } from "@/shared/types";

type Actor = Ctx["actor"];
const DM: Actor = { role: "dm" };
const as = (id: string): Actor => ({ role: "player", playerId: id });
let g: GameState;
let now = 1000;
let info: string | undefined;
function run(actor: Actor, cmd: Command) {
  const r = apply(g, cmd, { now: ++now, actor, rand: () => 0.5 } as Ctx);
  g = r.state;
  info = r.info;
  return r;
}
const dm = (cmd: Command) => run(DM, cmd);
function fails(actor: Actor, cmd: Command): string {
  try {
    run(actor, cmd);
  } catch (e) {
    if (e instanceof CommandError) return e.message;
    throw e;
  }
  throw new Error("expected the command to fail");
}
const phone = (pid: string) => projectPlayer(g, 1, pid, []);
const stashId = (name: string) => g.stash!.find((x) => x.name === name)!.id;

beforeEach(() => {
  g = hydrate(seedGame("t"))!;
  now = 1000;
  g.players[0].character = "Brin";
  g.players[1].character = "Ash";
  g.players[2].away = true;
  g.players[3].away = true;
});

/** A fight that's over, ready for its loot step. */
function overFight() {
  dm({
    type: "fight.start",
    groups: [{ templateId: "m-pudding-gremlin", count: 2 }],
  });
  dm({ type: "fight.settings", where: "in the cellar" });
  dm({ type: "fight.rollInit" });
  dm({ type: "fight.begin" });
  dm({ type: "fight.end" });
}

describe("loot from a fight", () => {
  it("lines without a name on them wait in the stash; named ones go onto that sheet", () => {
    run(as("p1"), { type: "me.sheet", patch: {} });
    overFight();
    dm({
      type: "fight.close",
      items: "a longsword, 3 potions, a silver ladle",
      loot: [
        { name: "Longsword", qty: 1, to: "p1" },
        { name: "Potion of Healing", qty: 3 },
        { name: "Silver ladle", qty: 1, note: "Engraved with a gull." },
      ],
      note: null,
    });
    expect(g.players[0].sheet!.items).toMatchObject([
      { name: "Longsword", kind: "weapon", count: 1, sides: 8, qty: 1 },
    ]);
    expect(g.stash!.map((x) => [x.name, x.qty, x.source])).toEqual([
      ["Potion of Healing", 3, "2 Pudding Gremlins (in the cellar)"],
      ["Silver ladle", 1, "2 Pudding Gremlins (in the cellar)"],
    ]);
    expect(g.stash![0].fightId).toBe(g.fights!.at(-1)!.id);
    expect(info).toMatch(/2 things in the party stash/);
    // The summary keeps the words the DM wrote.
    expect(g.fights!.at(-1)!.items).toBe(
      "a longsword, 3 potions, a silver ladle",
    );
  });

  it("a player who keeps no sheet gets their line at the table, and the log says so", () => {
    overFight();
    dm({
      type: "fight.close",
      loot: [{ name: "Old map", qty: 1, to: "p2" }],
      note: null,
    });
    expect(g.stash).toBeUndefined();
    expect(g.stashLog).toMatchObject([
      { name: "Old map", playerId: "p2", how: "table" },
    ]);
    expect(info).toMatch(/Hand over at the table: Old map to Ash/);
  });

  it("with the stash switched off, unclaimed lines are only words in the Chronicle", () => {
    dm({ type: "features.set", off: ["stash"] });
    overFight();
    dm({
      type: "fight.close",
      items: "a ladle",
      loot: [{ name: "Ladle", qty: 1 }],
      note: null,
    });
    expect(g.stash).toBeUndefined();
    expect(phone("p1").stash).toBeUndefined();
  });
});

describe("handing out", () => {
  beforeEach(() => {
    run(as("p1"), { type: "me.sheet", patch: {} });
    dm({
      type: "stash.add",
      items: [
        { name: "Potion of Healing", qty: 5 },
        { name: "Ring of Protection", qty: 1, kind: "magic", attune: true },
      ],
    });
  });

  it("gives some of a stack to one sheet, and it stacks with what they have", () => {
    dm({
      type: "stash.give",
      stashId: stashId("Potion of Healing"),
      playerId: "p1",
      qty: 2,
    });
    dm({
      type: "stash.give",
      stashId: stashId("Potion of Healing"),
      playerId: "p1",
      qty: 1,
    });
    expect(g.players[0].sheet!.items).toMatchObject([
      { name: "Potion of Healing", qty: 3 },
    ]);
    expect(g.stash!.find((x) => x.name === "Potion of Healing")!.qty).toBe(2);
    expect(
      fails(DM, {
        type: "stash.give",
        stashId: stashId("Potion of Healing"),
        playerId: "p1",
        qty: 3,
      }),
    ).toMatch(/only 2/);
    // A magic item keeps needing attunement on the sheet, and isn't attuned yet.
    dm({
      type: "stash.give",
      stashId: stashId("Ring of Protection"),
      playerId: "p1",
      qty: 1,
    });
    const ring = g.players[0].sheet!.items!.find(
      (x) => x.name === "Ring of Protection",
    )!;
    expect(ring).toMatchObject({ kind: "magic", attune: true });
    expect(ring.attuned).toBeUndefined();
    expect(g.stash!.some((x) => x.name === "Ring of Protection")).toBe(false);
  });

  it("splits a stack evenly; what doesn't divide stays", () => {
    run(as("p2"), { type: "me.sheet", patch: {} });
    dm({
      type: "stash.split",
      stashId: stashId("Potion of Healing"),
      playerIds: ["p1", "p2"],
    });
    expect(g.players[0].sheet!.items![0].qty).toBe(2);
    expect(g.players[1].sheet!.items![0].qty).toBe(2);
    expect(g.stash!.find((x) => x.name === "Potion of Healing")!.qty).toBe(1);
    expect(info).toMatch(/2 Potion of Healing each, 1 left/);
    expect(
      fails(DM, {
        type: "stash.split",
        stashId: stashId("Ring of Protection"),
        playerIds: ["p1", "p2"],
      }),
    ).toMatch(/not enough/);
  });

  it("edits, removes and logs", () => {
    dm({
      type: "stash.edit",
      stashId: stashId("Potion of Healing"),
      patch: { name: "Dagger", qty: 2 },
    });
    expect(g.stash![0]).toMatchObject({
      name: "Dagger",
      kind: "weapon",
      count: 1,
      sides: 4,
      qty: 2,
    });
    dm({ type: "stash.remove", stashId: stashId("Dagger") });
    expect(g.stashLog!.at(-1)).toMatchObject({
      name: "Dagger",
      how: "removed",
    });
    dm({ type: "stash.clearLog" });
    expect(g.stashLog).toBeUndefined();
  });

  it("won't give to someone who left the table", () => {
    g.players[1].archived = true;
    expect(
      fails(DM, {
        type: "stash.give",
        stashId: stashId("Potion of Healing"),
        playerId: "p2",
        qty: 1,
      }),
    ).toMatch(/left the table/);
  });
});

describe("players and the stash", () => {
  beforeEach(() => {
    run(as("p1"), { type: "me.sheet", patch: {} });
    dm({ type: "stash.add", items: [{ name: "Potion of Healing", qty: 2 }] });
  });

  it("see it on their phones, say what they'd like, and the DM sees who asked", () => {
    run(as("p1"), {
      type: "me.stashWant",
      stashId: stashId("Potion of Healing"),
      on: true,
    });
    run(as("p2"), {
      type: "me.stashWant",
      stashId: stashId("Potion of Healing"),
      on: true,
    });
    expect(g.stash![0].wants).toEqual(["p1", "p2"]);
    expect(phone("p2").stash!.items[0]).toMatchObject({
      name: "Potion of Healing",
      qty: 2,
      wants: ["Brin"],
      mine: true,
    });
    run(as("p2"), {
      type: "me.stashWant",
      stashId: stashId("Potion of Healing"),
      on: false,
    });
    expect(g.stash![0].wants).toEqual(["p1"]);
    // Giving the last one clears the asks.
    dm({
      type: "stash.give",
      stashId: stashId("Potion of Healing"),
      playerId: "p1",
      qty: 2,
    });
    expect(g.stash).toBeUndefined();
    expect(phone("p2").stash!.log[0].text).toBe(
      "Brin got 2 × Potion of Healing",
    );
  });

  it("take things themselves only when the DM allows it, and only onto their own sheet", () => {
    expect(
      fails(as("p1"), {
        type: "me.stashTake",
        stashId: stashId("Potion of Healing"),
        qty: 1,
      }),
    ).toMatch(/Ask the DM/);
    dm({ type: "stash.settings", take: true });
    run(as("p1"), {
      type: "me.stashTake",
      stashId: stashId("Potion of Healing"),
      qty: 1,
    });
    expect(g.players[0].sheet!.items).toMatchObject([
      { name: "Potion of Healing", qty: 1 },
    ]);
    expect(g.stashLog!.at(-1)).toMatchObject({ how: "took", playerId: "p1" });
    expect(
      fails(as("p2"), {
        type: "me.stashTake",
        stashId: stashId("Potion of Healing"),
        qty: 1,
      }),
    ).toMatch(/don't keep a sheet/);
    expect(phone("p1").stash!.take).toBe(true);
  });

  it("phones can't send the DM's stash commands, and the TV never gets the stash", () => {
    expect(
      playerCommand.safeParse({
        type: "stash.give",
        stashId: "x",
        playerId: "p1",
        qty: 1,
      }).success,
    ).toBe(false);
    expect(
      dmCommand.safeParse({ type: "stash.add", items: [{ name: "", qty: 1 }] })
        .success,
    ).toBe(false);
    expect(JSON.stringify(projectTv(g, 1))).not.toContain("Potion of Healing");
  });

  it("Start fresh empties it", () => {
    g = freshStart(g);
    expect(g.stash).toBeUndefined();
  });
});

describe("a shared world", () => {
  it("each party keeps its own stash", () => {
    dm({ type: "party.add", name: "The Sons", firstName: "The Friends" });
    const A = g.parties![0].id;
    const B = g.parties![1].id;
    dm({ type: "party.member", partyId: A, playerId: "p3", member: false });
    dm({
      type: "party.member",
      partyId: B,
      playerId: "p3",
      member: true,
      catchUp: false,
    });
    // Found by the party at the table (A), or put in B's by hand.
    dm({ type: "stash.add", items: [{ name: "Gold idol", qty: 1 }] });
    dm({ type: "stash.add", items: [{ name: "Rope", qty: 1 }], partyId: B });
    expect(g.stash!.map((x) => x.partyId)).toEqual([A, B]);
    expect(phone("p1").stash!.items.map((x) => x.name)).toEqual(["Gold idol"]);
    expect(phone("p3").stash!.items.map((x) => x.name)).toEqual(["Rope"]);
    expect(
      fails(as("p3"), {
        type: "me.stashWant",
        stashId: stashId("Gold idol"),
        on: true,
      }),
    ).toMatch(/not in your party/);
    // Moving an item to the other party drops asks from people who can't see it.
    run(as("p1"), {
      type: "me.stashWant",
      stashId: stashId("Gold idol"),
      on: true,
    });
    dm({
      type: "stash.edit",
      stashId: stashId("Gold idol"),
      patch: { partyId: B },
    });
    expect(g.stash![0].wants).toBeUndefined();
  });
});
