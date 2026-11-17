// Feature switches: presets, the campaign / per-player / player's own levels, what reaches phones and the TV, and the server's refusals.
import { describe, expect, it } from "vitest";
import { projectPlayer, projectTv } from "@/shared/projection";
import { apply, type Ctx } from "@/shared/reducer";
import { seedGame } from "@/shared/seed";
import { hydrate } from "@/server/store";
import { dmCommand, playerCommand, type Command } from "@/shared/commands";
import { effectiveOff, featureOn, featureOnFor, FEATURES, presetOf, presetOff } from "@/shared/features";
import type { GameState } from "@/shared/types";

const DM: Ctx = { now: 1000, actor: { role: "dm" } };
const as = (pid: string): Ctx => ({ now: 2000, actor: { role: "player", playerId: pid } });
const run = (g: GameState, cmd: Command, ctx: Ctx = DM) => apply(g, cmd, { ...ctx, rand: () => 0.5 }).state;
const tryRun = (g: GameState, cmd: Command, ctx: Ctx = DM) => {
  try {
    run(g, cmd, ctx);
    return null;
  } catch (e) {
    return (e as Error).message;
  }
};
const table = () => hydrate(seedGame("t"))!;

describe("presets", () => {
  it("Everything is every feature on; Standard and Minimal turn more off", () => {
    expect(presetOff("everything")).toEqual([]);
    const std = presetOff("standard");
    const min = presetOff("minimal");
    expect(std).toEqual(expect.arrayContaining(["renown", "jobs", "board", "companions", "invites"]));
    expect(std).not.toContain("gold");
    expect(min).toEqual(expect.arrayContaining([...std, "gold", "shops", "maps", "discover", "sound"]));
    for (const id of ["dice", "combat", "sheets", "chronicle"] as const) expect(min).not.toContain(id);
  });

  it("recognises a preset, keeps DM tools out of it, and calls anything else custom", () => {
    expect(presetOf([])).toBe("everything");
    expect(presetOf(presetOff("minimal"))).toBe("minimal");
    expect(presetOf([...presetOff("standard"), "storyboard"])).toBe("standard");
    expect(presetOf(["renown"])).toBe("custom");
    // A preset leaves the DM's own tools as they were.
    expect(presetOff("everything", ["storyboard", "renown"])).toEqual(["storyboard"]);
  });

  it("an existing game has every feature on", () => {
    const g = table();
    expect(effectiveOff(g)).toEqual([]);
    for (const f of FEATURES) expect(featureOn(g, f.id)).toBe(true);
  });
});

describe("switches", () => {
  it("a feature that needs another goes off with it", () => {
    const g = run(table(), { type: "features.set", off: ["gold"] });
    expect(featureOn(g, "gold")).toBe(false);
    expect(featureOn(g, "shops")).toBe(false);
    expect(effectiveOff(g)).toEqual(["gold", "shops"]);
    const back = run(g, { type: "features.set", off: [] });
    expect(back.featuresOff).toBeUndefined();
  });

  it("only the DM sets the table's switches; players only hide their own tabs", () => {
    expect(playerCommand.safeParse({ type: "features.set", off: [] }).success).toBe(false);
    expect(dmCommand.safeParse({ type: "features.set", off: ["nope"] }).success).toBe(false);
    let g = run(table(), { type: "me.tabs", hidden: ["jobs", "discover", "gold"] }, as("p1"));
    // Gold can't be hidden by a player; the others can.
    expect(g.players[0].tabsHidden).toEqual(["discover", "jobs"]);
    g = run(g, { type: "me.tabs", hidden: [] }, as("p1"));
    expect(g.players[0].tabsHidden).toBeUndefined();
  });

  it("per player: only per-player features, and sheets share the old sheet switch", () => {
    let g = table();
    expect(tryRun(g, { type: "features.player", playerId: "p1", feature: "renown", on: false })).toMatch(/one player at a time/);
    g = run(g, { type: "features.player", playerId: "p1", feature: "dice", on: false });
    g = run(g, { type: "features.player", playerId: "p1", feature: "sheets", on: false });
    expect(g.players[0].featuresOff).toEqual(["dice"]);
    expect(g.players[0].sheetOff).toBe(true);
    expect(featureOnFor(g, g.players[0], "dice")).toBe(false);
    expect(featureOnFor(g, g.players[1], "dice")).toBe(true);
    g = run(g, { type: "features.player", playerId: "p1", feature: "dice", on: true });
    expect(g.players[0].featuresOff).toBeUndefined();
  });

  it("Combat can't be switched off mid-fight, and a fight can't start with it off", () => {
    let g = table();
    g = run(g, { type: "fight.start" });
    expect(tryRun(g, { type: "features.set", off: ["combat"] })).toMatch(/End the fight first/);
    g = run(table(), { type: "features.set", off: ["combat"] });
    expect(tryRun(g, { type: "fight.start" })).toMatch(/Combat is turned off/);
  });
});

describe("refusals", () => {
  it("refuses a phone's command for a switched-off feature", () => {
    let g = run(table(), { type: "features.set", off: ["chronicle", "dice"] });
    expect(tryRun(g, { type: "me.noteAdd", text: "hi" }, as("p1"))).toMatch(/Chronicle is turned off/);
    expect(tryRun(g, { type: "me.diceRoll", dice: [{ sides: 20, count: 1 }], plus: 0, tv: true }, as("p1"))).toMatch(/Phone dice is turned off/);
    g = run(table(), { type: "features.player", playerId: "p1", feature: "dice", on: false });
    expect(tryRun(g, { type: "me.diceRoll", dice: [{ sides: 20, count: 1 }], plus: 0, tv: true }, as("p1"))).toMatch(/turned off for you/);
    expect(tryRun(g, { type: "me.diceRoll", dice: [{ sides: 20, count: 1 }], plus: 0, tv: true }, as("p2"))).toBeNull();
  });

  it("a hidden tab is only tidying: the player can still use it", () => {
    const g = run(table(), { type: "me.tabs", hidden: ["chronicle"] }, as("p1"));
    expect(tryRun(g, { type: "me.noteAdd", text: "still mine" }, as("p1"))).toBeNull();
  });
});

describe("views", () => {
  it("phones get what's off, and a switched-off feature's things stay home", () => {
    let g = run(table(), { type: "features.set", off: ["jobs", "discover", "sheets", "levels"] });
    g = run(g, { type: "me.tabs", hidden: ["maps"] }, as("p1"));
    const v = projectPlayer(g, 1, "p1", []);
    expect(v.off).toEqual(expect.arrayContaining(["jobs", "discover", "leads", "sheets", "levels"]));
    expect(v.me.off).toEqual(expect.arrayContaining(["jobs", "discover", "sheets"]));
    expect(v.me.hidden).toEqual(["maps"]);
    expect(v.me.sheetOff).toBe(true);
    expect(v.jobs).toEqual([]);
    expect(v.entries).toEqual([]);
  });

  it("a player who hides their sheet gets the Gold tab, as if it were off", () => {
    const g = run(table(), { type: "me.tabs", hidden: ["sheets"] }, as("p1"));
    expect(projectPlayer(g, 1, "p1", []).me.sheetOff).toBe(true);
    expect(projectPlayer(g, 1, "p2", []).me.sheetOff).toBeUndefined();
  });

  it("the TV drops Renown, jobs, notes and sound when they're off", () => {
    let g = run(table(), { type: "features.set", off: ["renown", "jobs", "board", "sound"] });
    g = run(g, { type: "sound.set", volume: 0.5 });
    const tv = projectTv(g, 1);
    expect(tv.plaqueHidden).toBe(true);
    expect(tv.renownMoment).toBeUndefined();
    expect(tv.jobs).toEqual([]);
    expect(tv.notices).toEqual([]);
    expect(tv.sound.muted).toBe(true);
    expect(tv.off).toEqual(expect.arrayContaining(["renown", "jobs", "board", "sound"]));
    // Nothing was deleted: back on, it's all there.
    const back = projectTv(run(g, { type: "features.set", off: [] }), 2);
    expect(back.plaqueHidden).toBeUndefined();
    expect(back.sound.muted).toBe(false);
  });
});
