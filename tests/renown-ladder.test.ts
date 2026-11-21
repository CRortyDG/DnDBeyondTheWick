// The DM's own Renown ladder: any number of ranks (2 to 10), their words and
// points, added, removed and moved, with every lock following its rank.
import { beforeEach, describe, expect, it } from "vitest";
import type { Command } from "@/shared/commands";
import { dmCommand as commandSchema } from "@/shared/commands";
import { projectPlayer, projectTv } from "@/shared/projection";
import { apply, CommandError, type Ctx } from "@/shared/reducer";
import { HEROES, KNOWN, ladderTemplate, pointsOf, rankForPoints, rankName, ranksOf, renownMet, renownOf, thresholdsOf, topRank, TRUSTED } from "@/shared/renown";
import { goodRoomLock, roomSettings } from "@/shared/rooms";
import { hydrate } from "@/server/store";
import { seedGame } from "@/shared/seed";
import type { Actor, GameState } from "@/shared/types";

const DM: Actor = { role: "dm" };
let g: GameState;
let now = 1000;
const dm = (cmd: Command) => {
  g = apply(g, cmd, { now: ++now, actor: DM, token: () => `tok${now}` } as Ctx).state;
};
function fails(cmd: Command): string {
  try {
    dm(cmd);
  } catch (e) {
    if (e instanceof CommandError) return e.message;
    throw e;
  }
  throw new Error("expected the command to fail");
}
type Rank = { from: number | null; name: string; meaning?: string; pay?: string; raised?: string; points: number };
const ladder = (ranks: Rank[]) => dm({ type: "game.renownLadder", ranks: ranks.map((r) => ({ meaning: "", pay: "", raised: "", ...r })) });
/** The current ladder as rows, each from itself. */
const same = (): Rank[] => ladderTemplate(g).map((r, i) => ({ from: i, ...r }));

beforeEach(() => {
  g = hydrate(seedGame("t"))!;
  now = 1000;
});

describe("the default ladder", () => {
  it("is the five ranks, unchanged for campaigns that never edit it", () => {
    expect(ranksOf(g).map((r) => r.name)).toEqual(["Strangers", "Known in town", "Trusted", "Heroes of Candlefair", "Famous on the Coast"]);
    expect(topRank(g)).toBe(4);
    expect(thresholdsOf(g)).toEqual([0, 3, 8, 16, 28]);
  });

  it("keeps the old rewording when the editor opens", () => {
    dm({ type: "game.renownRanks", ranks: [{}, { name: "Regulars", points: 4 }, {}, {}, {}] });
    expect(ladderTemplate(g)[1]).toMatchObject({ name: "Regulars", points: 4 });
    // Saving it as it stands writes the whole ladder and drops the old rewording.
    ladder(same());
    expect(g.renownRanks).toBeUndefined();
    expect(g.renownLadder).toHaveLength(5);
    expect(ranksOf(g)[1]).toMatchObject({ name: "Regulars", points: 4 });
    // {town} stays a template, so renaming the town still reads right.
    expect(g.renownLadder![3].name).toBe("Heroes of {town}");
    dm({ type: "game.town", town: "Saltmarsh" });
    expect(rankName(HEROES, g)).toBe("Heroes of Saltmarsh");
  });
});

describe("a ladder of the DM's own", () => {
  it("can have three ranks, or ten", () => {
    ladder([
      { from: 0, name: "Nobodies", points: 0 },
      { from: 1, name: "Somebodies", points: 5 },
      { from: 2, name: "Legends of {town}", raised: "{Town} sings of you", points: 12 },
    ]);
    expect(ranksOf(g).map((r) => r.name)).toEqual(["Nobodies", "Somebodies", "Legends of Candlefair"]);
    expect(ranksOf(g)[2].raised).toBe("Candlefair sings of you");
    expect(topRank(g)).toBe(2);
    const ten = Array.from({ length: 10 }, (_, i) => ({ from: i < 3 ? i : null, name: `Rank ${i + 1}`, points: i * 4 }));
    ladder(ten);
    expect(ranksOf(g)).toHaveLength(10);
    expect(thresholdsOf(g)[9]).toBe(36);
  });

  it("refuses one rank, eleven, a blank name, a repeat, or points that don't rise", () => {
    expect(() => commandSchema.parse({ type: "game.renownLadder", ranks: [{ from: 0, name: "Only", meaning: "", pay: "", raised: "", points: 0 }] })).toThrow();
    const eleven = Array.from({ length: 11 }, (_, i) => ({ from: null, name: `R${i}`, meaning: "", pay: "", raised: "", points: i }));
    expect(() => commandSchema.parse({ type: "game.renownLadder", ranks: eleven })).toThrow();
    expect(fails({ type: "game.renownLadder", ranks: [{ from: 0, name: "A", meaning: "", pay: "", raised: "", points: 0 }, { from: null, name: "  ", meaning: "", pay: "", raised: "", points: 3 }] })).toMatch(/Rank 2 needs a name/);
    expect(fails({ type: "game.renownLadder", ranks: [{ from: 0, name: "A", meaning: "", pay: "", raised: "", points: 0 }, { from: null, name: "a", meaning: "", pay: "", raised: "", points: 3 }] })).toMatch(/Two ranks are called/);
    expect(fails({ type: "game.renownLadder", ranks: [{ from: 0, name: "A", meaning: "", pay: "", raised: "", points: 0 }, { from: 1, name: "B", meaning: "", pay: "", raised: "", points: 5 }, { from: 2, name: "C", meaning: "", pay: "", raised: "", points: 5 }] })).toMatch(/C needs more points than B/);
  });

  it("lets a box be truly empty: no pay line on phones, and the TV line falls back to the name", () => {
    ladder([
      { from: 0, name: "Strangers", points: 0 },
      { from: 1, name: "Friends", points: 2 },
    ]);
    const phone = projectPlayer(g, 1, "p1", []);
    expect(phone.renown.ladder).toEqual([
      { name: "Strangers", pay: "" },
      { name: "Friends", pay: "" },
    ]);
    dm({ type: "renown.points", amount: 2 });
    expect(g.renown).toBe(1);
    expect(projectTv(g, 1).renownMoment).toMatchObject({ name: "Friends", raised: "Friends", meaning: "" });
    expect(g.notes!.find((n) => n.text.startsWith("Renown: the party is now Friends"))!.text).toBe("Renown: the party is now Friends.");
  });

  it("raises through the DM's thresholds, and only as far as the ladder goes", () => {
    ladder([
      { from: 0, name: "A", points: 0 },
      { from: 1, name: "B", points: 2 },
      { from: 2, name: "C", points: 4 },
    ]);
    dm({ type: "renown.points", amount: 9, tv: false });
    expect(g.renown).toBe(2);
    expect(fails({ type: "renown.set", rank: 3 })).toMatch(/isn't on the ladder/);
  });
});

describe("moving and removing ranks", () => {
  it("adds a rank in the middle and every lock keeps needing the same rank", () => {
    const house = g.items.find((x) => x.id === "g-house")!;
    expect(house.renown).toBe(TRUSTED);
    g.renown = TRUSTED;
    g.renownPoints = 9;
    const rows = same();
    rows.splice(2, 0, { from: null, name: "Respected", points: 5 });
    ladder(rows);
    expect(ranksOf(g)[2].name).toBe("Respected");
    // Trusted is now rank 4 (index 3), and so is everything that needed it.
    expect(g.items.find((x) => x.id === "g-house")!.renown).toBe(3);
    expect(rankName(g.items.find((x) => x.id === "g-house")!.renown!, g)).toBe("Trusted");
    expect(g.renown).toBe(3);
    expect(rankName(renownOf(g), g)).toBe("Trusted");
    expect(pointsOf(g)).toBe(9);
    // The Good Room needed Known in town (index 1): that didn't move.
    expect(roomSettings(g).good.rank).toBe(KNOWN);
  });

  it("removing a rank moves what needed it to the rank below, party and history included", () => {
    const job = g.jobs!.find((j) => (j.renown ?? 0) === TRUSTED)!;
    g.renown = HEROES;
    g.renownPoints = 17;
    dm({ type: "renown.points", amount: 1, tv: false });
    const before = g.renownLog!.at(-1)!;
    expect(before.rankTo).toBe(HEROES);
    ladder(same().filter((r) => r.from !== TRUSTED && r.from !== HEROES));
    expect(ranksOf(g).map((r) => r.name)).toEqual(["Strangers", "Known in town", "Famous on the Coast"]);
    // Trusted and Heroes went: those locks and the party now need / are Known in town.
    expect(g.items.find((x) => x.id === "g-house")!.renown).toBe(KNOWN);
    expect(g.jobs!.find((j) => j.id === job.id)!.renown).toBe(KNOWN);
    expect(rankName(renownOf(g), g)).toBe("Known in town");
    expect(g.renownLog!.at(-1)!.rankTo).toBe(KNOWN);
    // Their 18 points are well short of Famous (28).
    expect(rankForPoints(g, pointsOf(g))).toBe(KNOWN);
  });

  it("removing the first rank moves its things to the new first rank", () => {
    ladder(same().filter((r) => r.from !== 0));
    expect(ranksOf(g)[0]).toMatchObject({ name: "Known in town", points: 0 });
    expect(renownOf(g)).toBe(0);
    // Things that needed Known in town now need nothing.
    expect(g.items.find((x) => x.id === "c-backroom")!.renown).toBeUndefined();
    expect(roomSettings(g).good.rank).toBe(0);
    expect(goodRoomLock(g, "p1")).toBeNull();
  });

  it("swapping two ranks swaps their locks, and the points stay with each step", () => {
    const rows = same();
    // Trusted and Known in town trade places.
    const swapped = [rows[0], { ...rows[2], points: rows[1].points }, { ...rows[1], points: rows[2].points }, rows[3], rows[4]];
    ladder(swapped);
    expect(ranksOf(g).slice(1, 3).map((r) => r.name)).toEqual(["Trusted", "Known in town"]);
    expect(thresholdsOf(g)).toEqual([0, 3, 8, 16, 28]);
    expect(g.items.find((x) => x.id === "g-house")!.renown).toBe(1);
    expect(g.items.find((x) => x.id === "c-backroom")!.renown).toBe(2);
  });

  it("goes back to the default five, keeping what it can", () => {
    const seven = [...same(), { from: null, name: "Sixth", points: 40 }, { from: null, name: "Seventh", points: 60 }];
    ladder(seven);
    g.shops[0].renown = 6;
    g.renown = 6;
    dm({ type: "game.renownLadder", reset: true });
    expect(g.renownLadder).toBeUndefined();
    expect(ranksOf(g)).toHaveLength(5);
    expect(g.shops[0].renown).toBe(4);
    expect(g.renown).toBe(4);
  });
});

describe("thresholds that come down", () => {
  it("never raise the rank on their own; catch-up does, and the next points do too", () => {
    g.renownPoints = 7;
    g.renown = KNOWN;
    const rows = same();
    rows[2].points = 6;
    ladder(rows);
    expect(g.renown).toBe(KNOWN);
    expect(rankForPoints(g, pointsOf(g))).toBe(TRUSTED);
    dm({ type: "renown.catchUp", tv: false });
    expect(g.renown).toBe(TRUSTED);
    expect(g.renownLog!.at(-1)).toMatchObject({ source: "set", amount: 0, rankFrom: KNOWN, rankTo: TRUSTED });
    expect(fails({ type: "renown.catchUp" })).toMatch(/don't reach/);
  });
});

describe("a shared world", () => {
  it("moves each character's own rank, without levelling the table", () => {
    dm({ type: "party.add", name: "The Sons", firstName: "The Friends" });
    g.players.find((p) => p.id === "p1")!.renown = TRUSTED;
    g.players.find((p) => p.id === "p2")!.renown = KNOWN;
    g.renown = TRUSTED;
    const rows = same();
    rows.splice(1, 0, { from: null, name: "Noticed", points: 1 });
    ladder(rows);
    expect(g.players.find((p) => p.id === "p1")!.renown).toBe(3);
    expect(g.players.find((p) => p.id === "p2")!.renown).toBe(2);
    expect(rankName(g.players.find((p) => p.id === "p2")!.renown!, g)).toBe("Known in town");
    expect(rankName(renownOf(g), g)).toBe("Trusted");
  });
});

describe("stale ranks", () => {
  it("a lock above the top rank counts as the top rank", () => {
    ladder(same().slice(0, 3));
    g.renown = 2;
    expect(renownMet(g, 4)).toBe(true);
    expect(rankName(9, g)).toBe("Trusted");
  });
});
