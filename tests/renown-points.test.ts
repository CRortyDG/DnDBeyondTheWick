// Renown points: a hidden running total that raises the rank at each threshold.
import { beforeEach, describe, expect, it } from "vitest";
import type { Command } from "@/shared/commands";
import { upgrade } from "@/shared/migrate";
import { presetSetup } from "@/shared/presets";
import { projectPlayer, projectTv } from "@/shared/projection";
import { apply, CommandError, type Ctx } from "@/shared/reducer";
import { KNOWN, pointsOf, progressOf, RENOWN_POINTS, thresholdsOf, TRUSTED, HEROES } from "@/shared/renown";
import { freshStart, seedGame } from "@/shared/seed";
import type { Actor, GameState } from "@/shared/types";

const DM: Actor = { role: "dm" };
let g: GameState;
let now = 1000;
const dm = (cmd: Command) => {
  g = apply(g, cmd, { now: ++now, actor: DM } as Ctx).state;
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
const award = (amount: number, reason?: string, tv?: boolean) => dm({ type: "renown.points", amount, ...(reason ? { reason } : {}), ...(tv === false ? { tv } : {}) });
const done = (jobId: string, renown?: number) => dm({ type: "job.done", jobId, payouts: [], ...(renown !== undefined ? { renown } : {}) });

beforeEach(() => {
  g = seedGame("t");
});

describe("Renown points", () => {
  it("uses running totals 0 / 3 / 8 / 16 / 28 by default", () => {
    expect(thresholdsOf(g)).toEqual(RENOWN_POINTS);
    expect(RENOWN_POINTS).toEqual([0, 3, 8, 16, 28]);
    expect(progressOf(g)).toMatchObject({ points: 0, rank: 0, floor: 0, next: 3, nextName: "Known in town", short: 0 });
  });

  it("starts an old campaign at its rank's threshold", () => {
    const old = structuredClone(g);
    old.renown = TRUSTED;
    delete old.renownPoints;
    const up = upgrade(old);
    expect(pointsOf(up)).toBe(8);
    expect(progressOf(up)).toMatchObject({ points: 8, floor: 8, next: 16, nextName: "Heroes of Candlefair" });
  });

  it("awards points with a reason in the Chronicle and the history", () => {
    dm({ type: "session.start" });
    award(2, "Saved Winterfest from the pudding");
    expect(pointsOf(g)).toBe(2);
    expect(g.renown ?? 0).toBe(0);
    expect(g.notes!.at(-1)!.text).toBe("Renown +2: Saved Winterfest from the pudding.");
    expect(g.renownLog!.at(-1)).toMatchObject({ source: "award", amount: 2, reason: "Saved Winterfest from the pudding", total: 2, rankFrom: 0, rankTo: 0, chapter: 1 });
    award(-1, "Smashed the mayor's china in public");
    expect(g.notes!.at(-1)!.text).toBe("Renown −1: Smashed the mayor's china in public.");
    expect(pointsOf(g)).toBe(1);
  });

  it("raises the rank like Raise Renown when the total crosses a threshold", () => {
    award(2);
    const banner = g.banner;
    award(1, "Caught the cutpurse");
    expect(g.renown).toBe(KNOWN);
    expect(g.banner).not.toEqual(banner);
    expect(g.banner!.text).toContain("Candlefair knows your names");
    expect(projectTv(g, 1).renownMoment).toMatchObject({ rank: KNOWN });
    const texts = g.notes!.slice(-2).map((n) => n.text);
    expect(texts[0]).toBe("Renown +1: Caught the cutpurse.");
    expect(texts[1]).toMatch(/^Renown: the party is now Known in town\./);
    expect(g.renownLog!.at(-1)).toMatchObject({ rankFrom: 0, rankTo: KNOWN, total: 3 });
  });

  it("jumps straight past several thresholds with one moment", () => {
    award(20);
    expect(g.renown).toBe(HEROES);
    expect(g.notes!.filter((n) => n.text.startsWith("Renown: the party is now")).length).toBe(1);
  });

  it("can raise the rank without the TV moment", () => {
    award(3, "", false);
    expect(g.renown).toBe(KNOWN);
    expect(projectTv(g, 1).renownMoment).toBeFalsy();
  });

  it("never lowers the rank on its own, and shows the deficit", () => {
    award(8);
    expect(g.renown).toBe(TRUSTED);
    award(-3, "Smashed the mayor's china");
    expect(g.renown).toBe(TRUSTED);
    expect(progressOf(g)).toMatchObject({ points: 5, floor: 8, short: 3 });
    award(-50);
    expect(pointsOf(g)).toBe(0);
  });

  it("sets the points to the threshold when the DM sets the rank by hand", () => {
    award(2);
    dm({ type: "renown.set", rank: TRUSTED });
    expect(pointsOf(g)).toBe(8);
    expect(g.renownLog!.at(-1)).toMatchObject({ source: "set", amount: 6, rankFrom: 0, rankTo: TRUSTED, total: 8 });
    dm({ type: "renown.set", rank: KNOWN });
    expect(pointsOf(g)).toBe(3);
    award(4);
    expect(g.renown).toBe(KNOWN); // 7 < 8
    award(1);
    expect(g.renown).toBe(TRUSTED);
  });

  it("gives a job's Renown when done: 1 by default, or what the DM types", () => {
    dm({ type: "job.pin", jobId: "j-ransom", pinned: true });
    done("j-ransom");
    expect(pointsOf(g)).toBe(1);
    expect(g.notes!.at(-1)!.text).toMatch(/\+1 Renown\.$/);
    expect(g.renownLog!.at(-1)).toMatchObject({ source: "job", jobId: "j-ransom", amount: 1, label: expect.any(String) });

    dm({ type: "job.add", job: { title: "Outstanding", renownPoints: 2 } });
    const id = g.jobs!.at(-1)!.id;
    expect(g.jobs!.at(-1)!.renownPoints).toBe(2);
    done(id);
    expect(pointsOf(g)).toBe(3);
    expect(g.renown).toBe(KNOWN);

    dm({ type: "job.add", job: { title: "Botched" } });
    const bad = g.jobs!.at(-1)!.id;
    const n = g.renownLog!.length;
    done(bad, 0);
    expect(pointsOf(g)).toBe(3);
    expect(g.renownLog!.length).toBe(n);
    expect(g.notes!.at(-1)!.text).not.toMatch(/Renown/);
  });

  it("lets the DM change the thresholds with the rank words, always rising", () => {
    dm({ type: "game.renownRanks", ranks: [{}, { points: 2 }, { points: 6 }, {}, {}] });
    expect(thresholdsOf(g)).toEqual([0, 2, 6, 16, 28]);
    award(2);
    expect(g.renown).toBe(KNOWN);
    expect(fails({ type: "game.renownRanks", ranks: [{}, { points: 9 }, { points: 6 }, {}, {}] })).toMatch(/Trusted needs more points than Known in town/);
    // Back to the defaults stores nothing.
    dm({ type: "game.renownRanks", ranks: [{}, { points: 3 }, {}, {}, {}] });
    expect(g.renownRanks).toBeUndefined();
  });

  it("shows progress on phones only when the DM turns it on, and never the history", () => {
    award(4);
    expect(projectPlayer(g, 1, "p1", []).renown.progress).toBeUndefined();
    dm({ type: "renown.progress", on: true });
    expect(projectPlayer(g, 1, "p1", []).renown.progress).toMatchObject({ points: 4, floor: 3, next: 8, nextName: "Trusted" });
    const json = JSON.stringify(projectPlayer(g, 1, "p1", [])) + JSON.stringify(projectTv(g, 1));
    expect(json).not.toContain("renownLog");
    expect(json).not.toContain("renownPoints");
  });

  it("starts over with Start fresh and presets, keeping the thresholds", () => {
    dm({ type: "game.renownRanks", ranks: [{}, { points: 2 }, {}, {}, {}] });
    award(5);
    for (const s of [freshStart(g), presetSetup(g)]) {
      expect(pointsOf(s)).toBe(0);
      expect(s.renownLog).toBeUndefined();
      expect(thresholdsOf(s)[1]).toBe(2);
    }
  });
});
