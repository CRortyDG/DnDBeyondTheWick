// Morality and oaths: the DM logs deeds, the dials drift, paladins keep (or break) their oath,
// and each player sees only their own, as much as the DM allows.
import { beforeEach, describe, expect, it } from "vitest";
import type { Command } from "@/shared/commands";
import { dmCommand, playerCommand } from "@/shared/commands";
import { projectPlayer, projectTv } from "@/shared/projection";
import { apply, CommandError } from "@/shared/reducer";
import { freshStart, seedGame } from "@/shared/seed";
import { hydrate } from "@/server/store";
import { alignmentOf, drift, OATH_PRESETS, oathPresetFor, oathState, strainOf } from "@/shared/morality";
import type { Actor, GameState } from "@/shared/types";

const DM: Actor = { role: "dm" };
const SECRET = "pocketed the reliquary coin";

let g: GameState;
let now = 1_000_000;
const run = (actor: Actor, cmd: Command) => (g = apply(g, cmd, { now: (now += 1000), actor }).state);
const dm = (cmd: Command) => run(DM, cmd);
const fails = (cmd: Command, msg?: RegExp) => expect(() => apply(g, cmd, { now, actor: DM })).toThrow(msg ?? CommandError);
const me = (pid: string) => projectPlayer(g, 1, pid, []).me;
const p1 = () => g.players.find((p) => p.id === "p1")!;
const devotion = OATH_PRESETS[0];

beforeEach(() => {
  g = hydrate(seedGame("t"))!;
  now = 1_000_000;
});

describe("alignment", () => {
  it("reads the nine alignments off the two dials", () => {
    expect(alignmentOf(0, 0).label).toBe("Neutral");
    expect(alignmentOf(6, 6).label).toBe("Lawful Good");
    expect(alignmentOf(-4, 3).label).toBe("Chaotic Neutral");
    expect(alignmentOf(3, -10).label).toBe("Neutral Evil");
    expect(drift({ law: 3, good: 0 })).toBe("Leaning lawful");
    expect(drift({ law: -4, good: 4 })).toBe("Barely chaotic, barely good");
    expect(drift({ law: 0, good: 0 })).toBeUndefined();
  });

  it("only the DM can send the commands", () => {
    expect(dmCommand.safeParse({ type: "conduct.deed", playerId: "p1", reason: "x", law: 1, good: 0 }).success).toBe(true);
    expect(playerCommand.safeParse({ type: "conduct.deed", playerId: "p1", reason: "x", law: 1, good: 0 }).success).toBe(false);
    expect(dmCommand.safeParse({ type: "conduct.deed", playerId: "p1", reason: "x", law: 4, good: 0 }).success).toBe(false);
  });
});

describe("deeds", () => {
  it("moves the dials, logs the deed, and undo puts them back", () => {
    dm({ type: "conduct.set", playerId: "p1", alignment: "lg" });
    expect(p1().conduct).toMatchObject({ law: 6, good: 6, placed: true });
    dm({ type: "conduct.deed", playerId: "p1", reason: "Lied to the magistrate", law: -3, good: 0 });
    dm({ type: "conduct.deed", playerId: "p1", reason: "Robbed the shrine", law: -2, good: -3 });
    expect(alignmentOf(p1().conduct!.law, p1().conduct!.good).label).toBe("Neutral");
    const last = p1().conduct!.log!.at(-1)!;
    dm({ type: "conduct.undo", playerId: "p1", deedId: last.id });
    expect(p1().conduct).toMatchObject({ law: 3, good: 6 });
    expect(p1().conduct!.log).toHaveLength(2);
  });

  it("stops at the ends and logs how far it really moved", () => {
    dm({ type: "conduct.set", playerId: "p1", alignment: "ce" });
    for (let i = 0; i < 3; i++) dm({ type: "conduct.deed", playerId: "p1", reason: "Burned the village", law: -3, good: -3 });
    expect(p1().conduct).toMatchObject({ law: -10, good: -10 });
    const log = p1().conduct!.log!;
    expect(log.at(-2)).toMatchObject({ law: -1, good: -1 });
    expect(log.at(-1)).toMatchObject({ law: 0, good: 0 });
    for (const d of [...log].reverse()) dm({ type: "conduct.undo", playerId: "p1", deedId: d.id });
    expect(p1().conduct).toBeUndefined();
  });

  it("refuses a deed that says nothing or goes nowhere", () => {
    fails({ type: "conduct.deed", playerId: "p1", reason: "  ", law: 1, good: 0 }, /what they did/);
    fails({ type: "conduct.deed", playerId: "p1", reason: "Napped", law: 0, good: 0 }, /Pick/);
    fails({ type: "conduct.deed", playerId: "p1", reason: "Lied", law: 0, good: 0, oath: "broke" }, /oath/);
    fails({ type: "conduct.deed", playerId: "nobody", reason: "Lied", law: -1, good: 0 });
  });
});

describe("what phones see", () => {
  it("each player sees only their own, never the TV", () => {
    dm({ type: "conduct.set", playerId: "p1", alignment: "ng" });
    dm({ type: "conduct.deed", playerId: "p1", reason: "Shared their bread", law: 0, good: 1 });
    dm({ type: "conduct.deed", playerId: "p1", reason: SECRET, law: -1, good: -1, secret: true });
    const m = me("p1").morality!;
    expect(m.label).toBe("Neutral Good");
    expect(m.law).toBe(-1);
    expect(m.reasons!.map((r) => r.text)).toEqual(["Shared their bread"]);
    expect(JSON.stringify(projectPlayer(g, 1, "p1", []))).not.toContain(SECRET);
    expect(me("p2").morality).toBeUndefined();
    expect(JSON.stringify(projectPlayer(g, 1, "p2", []))).not.toContain("Shared their bread");
    expect(JSON.stringify(projectTv(g, 1))).not.toContain("Shared their bread");
  });

  it("shows nothing before the DM places them, and follows the setting", () => {
    expect(me("p1").morality).toBeUndefined();
    dm({ type: "conduct.set", playerId: "p1", alignment: "cn" });
    dm({ type: "conduct.deed", playerId: "p1", reason: "Freed the prisoners", law: -1, good: 1 });
    dm({ type: "morality.set", patch: { show: "label" } });
    expect(me("p1").morality).toEqual({ label: "Chaotic Neutral" });
    dm({ type: "morality.set", patch: { show: "chart" } });
    expect(me("p1").morality).toMatchObject({ label: "Chaotic Neutral", law: -7, good: 1 });
    expect(me("p1").morality!.reasons).toBeUndefined();
    dm({ type: "morality.set", patch: { show: "none" } });
    expect(me("p1").morality).toBeUndefined();
  });

  it("is hidden when the feature is off, for the table or one player", () => {
    dm({ type: "conduct.set", playerId: "p1", alignment: "n" });
    expect(me("p1").morality).toBeDefined();
    dm({ type: "features.set", off: ["morality"] });
    expect(me("p1").morality).toBeUndefined();
  });
});

describe("oaths", () => {
  beforeEach(() => {
    p1().sheet = { cls: "Paladin", subclass: "Oath of Devotion", scores: { str: 15, dex: 10, con: 13, int: 8, wis: 12, cha: 14 }, saves: [], skills: {}, updatedAt: 0 } as never;
  });

  it("fills a paladin's oath from their subclass", () => {
    expect(oathPresetFor(p1())?.name).toBe("Oath of Devotion");
    expect(oathPresetFor({ sheet: undefined })).toBeUndefined();
  });

  it("counts transgressions until they atone, warns, and only the DM breaks it", () => {
    dm({ type: "conduct.oath", playerId: "p1", oath: devotion });
    expect(oathState(p1().conduct, 3)).toBe("kept");
    const honesty = devotion.tenets[0];
    dm({ type: "conduct.deed", playerId: "p1", reason: "Lied to the abbess", law: -1, good: 0, oath: "broke", tenet: honesty });
    expect(oathState(p1().conduct, 3)).toBe("strained");
    expect(me("p1").morality!.oath).toMatchObject({ name: "Oath of Devotion", state: "strained" });
    dm({ type: "conduct.deed", playerId: "p1", reason: "", law: 0, good: 0, oath: "broke", tenet: honesty });
    dm({ type: "conduct.deed", playerId: "p1", reason: "Fled the fight", law: 0, good: 0, oath: "broke" });
    expect(strainOf(p1().conduct)).toBe(3);
    expect(oathState(p1().conduct, 3)).toBe("atRisk");
    // The phone never says "at risk": that's the DM's warning.
    expect(me("p1").morality!.oath!.state).toBe("strained");
    dm({ type: "conduct.oathMark", playerId: "p1", mark: "atoned", reason: "All-night vigil" });
    expect(oathState(p1().conduct, 3)).toBe("kept");
    fails({ type: "conduct.oathMark", playerId: "p1", mark: "atoned", reason: "" }, /Nothing to atone/);
    dm({ type: "conduct.oathMark", playerId: "p1", mark: "broken", reason: "" });
    expect(oathState(p1().conduct, 3)).toBe("broken");
    expect(me("p1").morality!.oath!.state).toBe("broken");
    fails({ type: "conduct.oathMark", playerId: "p1", mark: "broken", reason: "" }, /already/);
    // Undo the break: back to kept.
    const mark = p1().conduct!.log!.at(-1)!;
    dm({ type: "conduct.undo", playerId: "p1", deedId: mark.id });
    expect(oathState(p1().conduct, 3)).toBe("kept");
  });

  it("can hide the oath from the paladin, and keeps it through Start fresh", () => {
    dm({ type: "conduct.oath", playerId: "p1", oath: { name: "  Vow of the Gull ", tenets: ["Never abandon a sailor", "", "Never abandon a sailor"] } });
    expect(p1().conduct!.oath).toEqual({ name: "Vow of the Gull", tenets: ["Never abandon a sailor"] });
    dm({ type: "morality.set", patch: { oathShow: false } });
    expect(me("p1").morality).toBeUndefined();
    dm({ type: "conduct.deed", playerId: "p1", reason: "Left a sailor behind", law: 0, good: -1, oath: "broke" });
    g = freshStart(g);
    expect(p1().conduct).toEqual({ law: 0, good: 0, oath: { name: "Vow of the Gull", tenets: ["Never abandon a sailor"] } });
  });
});

describe("presets", () => {
  it("every preset oath fits the command limits", () => {
    for (const o of OATH_PRESETS) {
      expect(dmCommand.safeParse({ type: "conduct.oath", playerId: "p1", oath: o }).success).toBe(true);
      for (const t of o.tenets) expect(dmCommand.safeParse({ type: "conduct.deed", playerId: "p1", reason: "", law: 0, good: 0, oath: "broke", tenet: t }).success).toBe(true);
    }
  });
});
