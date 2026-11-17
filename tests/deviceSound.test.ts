import { describe, expect, it } from "vitest";
import { cuesFor, type Snapshot } from "../src/client/player/deviceSound";
import { SFX_MAKERS } from "../src/client/sound/sfx";
import { featureOn, presetOff } from "../src/shared/features";

const base: Snapshot = { hp: 20, temp: 0, maxHp: 30, hitDiceSpent: 0, balanceCp: 1000, levelUp: 0, myTurn: null, decided: {}, awards: 0, lastRoll: 0, lastRollSecret: false, lastRollDice: 0 };
const ids = (a: Partial<Snapshot>, b: Partial<Snapshot>) => cuesFor({ ...base, ...a }, { ...base, ...b }).map((c) => c.id);

describe("sounds on a player's device", () => {
  it("plays nothing when nothing of mine changed", () => {
    expect(ids({}, {})).toEqual([]);
  });
  it("hurt, heal and hit dice", () => {
    expect(ids({}, { hp: 12 })).toEqual(["hurt"]);
    expect(ids({ temp: 5 }, { temp: 0 })).toEqual(["hurt"]);
    expect(ids({}, { hp: 26 })).toEqual(["heal"]);
    expect(ids({}, { hp: 26, hitDiceSpent: 1 })).toEqual(["hit-die"]);
    expect(ids({}, { hitDiceSpent: 1 })).toEqual(["hit-die"]);
  });
  it("a new max HP at full HP is not a heal", () => {
    expect(ids({ hp: 30, maxHp: 30 }, { hp: 36, maxHp: 36 })).toEqual([]);
  });
  it("my turn once per turn", () => {
    expect(ids({}, { myTurn: "f:1:a" })).toEqual(["your-turn"]);
    expect(ids({ myTurn: "f:1:a" }, { myTurn: "f:1:a" })).toEqual([]);
  });
  it("gold, and the DM answering a request instead of plain coins", () => {
    expect(ids({}, { balanceCp: 1500 })).toEqual(["coins"]);
    expect(ids({}, { balanceCp: 500, decided: { r1: "approved" } })).toEqual(["approved"]);
    expect(ids({}, { decided: { r1: "declined" } })).toEqual(["declined"]);
  });
  it("secret rolls only: the TV handles the rest", () => {
    expect(ids({}, { lastRoll: 1, lastRollSecret: true, lastRollDice: 2 })).toEqual(["dice"]);
    expect(ids({}, { lastRoll: 1, lastRollSecret: false, lastRollDice: 2 })).toEqual([]);
  });
  it("never more than two at once, the second a little later", () => {
    const c = cuesFor(base, { ...base, levelUp: 1, myTurn: "x", hp: 5, balanceCp: 1 });
    expect(c.map((x) => x.id)).toEqual(["level-up", "your-turn"]);
    expect(c[1].delay).toBeGreaterThan(0);
  });
  it("every cue has a sound", () => {
    for (const id of ["level-up", "your-turn", "hurt", "heal", "hit-die", "approved", "declined", "coins", "gift", "dice"]) expect(SFX_MAKERS[id], id).toBeTypeOf("function");
  });
  it("a table-wide switch that follows Sound", () => {
    expect(featureOn({ featuresOff: [] }, "deviceSound")).toBe(true);
    expect(featureOn({ featuresOff: ["sound"] }, "deviceSound")).toBe(false);
    expect(featureOn({ featuresOff: ["deviceSound"] }, "deviceSound")).toBe(false);
    expect(presetOff("minimal")).toContain("deviceSound");
    expect(presetOff("standard")).not.toContain("deviceSound");
  });
});
