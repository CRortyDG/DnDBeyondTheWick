// Fixing the Renown history: edit a line's points or reason, or undo it.
import { beforeEach, describe, expect, it } from "vitest";
import type { Command } from "@/shared/commands";
import { projectTv } from "@/shared/projection";
import { apply, CommandError, type Ctx } from "@/shared/reducer";
import { KNOWN, pointsOf, TRUSTED } from "@/shared/renown";
import { seedGame } from "@/shared/seed";
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
const award = (amount: number, reason?: string) => dm({ type: "renown.points", amount, ...(reason ? { reason } : {}) });
const last = () => g.renownLog!.at(-1)!;
const texts = () => (g.notes ?? []).map((n) => n.text);

beforeEach(() => {
  g = seedGame("t");
});

describe("editing Renown history", () => {
  it("fixes a typo in the reason, in the history and the Chronicle", () => {
    award(2, "Saved Winterfset");
    dm({ type: "renown.edit", changeId: last().id, reason: "Saved Winterfest" });
    expect(last()).toMatchObject({ amount: 2, reason: "Saved Winterfest", total: 2 });
    expect(last().edited).toBeDefined();
    expect(texts()).toContain("Renown +2: Saved Winterfest.");
    expect(texts()).not.toContain("Renown +2: Saved Winterfset.");
  });

  it("changes the points and moves every later total", () => {
    award(1, "a");
    const first = last().id;
    award(1, "b");
    award(-1, "c");
    dm({ type: "renown.edit", changeId: first, amount: 2 });
    expect(pointsOf(g)).toBe(2);
    expect(g.renownLog!.map((x) => x.total)).toEqual([2, 3, 2]);
    expect(texts()).toContain("Renown +2: a.");
  });

  it("raises the rank when a fixed amount reaches it, without replaying the old moment", () => {
    award(2, "Caught a thief");
    const moment = projectTv(g, 1).renownMoment;
    expect(moment).toBeFalsy();
    dm({ type: "renown.edit", changeId: last().id, amount: 3 });
    expect(g.renown).toBe(KNOWN);
    expect(last().rankTo).toBe(KNOWN);
    expect(projectTv(g, 1).renownMoment).toMatchObject({ rank: KNOWN });
  });

  it("keeps the rank when an edit falls short, unless asked to lower it", () => {
    award(3, "Oops, meant 1");
    expect(g.renown).toBe(KNOWN);
    const moment = g.renownMoment;
    const n = g.notes!.length;
    dm({ type: "renown.edit", changeId: last().id, amount: 1 });
    expect(pointsOf(g)).toBe(1);
    expect(g.renown).toBe(KNOWN);
    // The rank-up's line and TV moment stay; nothing replays.
    expect(g.renownMoment).toEqual(moment);
    expect(g.notes!.length).toBe(n);

    dm({ type: "renown.edit", changeId: last().id, amount: 2, lower: true });
    expect(g.renown ?? 0).toBe(0);
    expect(pointsOf(g)).toBe(2);
    expect(last().rankTo).toBe(0);
    // The wrong rank-up is gone from the Chronicle, quietly.
    expect(texts().some((t) => t.startsWith("Renown: the party is now Known in town"))).toBe(false);
    expect(g.renownMoment).toEqual(moment);
  });

  it("undoes an award: points off, line and Chronicle gone", () => {
    award(1, "keep");
    award(8, "Wrong campaign!");
    expect(g.renown).toBe(TRUSTED);
    dm({ type: "renown.undo", changeId: last().id, lower: true });
    expect(pointsOf(g)).toBe(1);
    expect(g.renown ?? 0).toBe(0);
    expect(g.renownLog!.map((x) => x.reason)).toEqual(["keep"]);
    expect(texts().some((t) => t.includes("Wrong campaign"))).toBe(false);
    expect(texts().some((t) => t.startsWith("Renown: the party is now"))).toBe(false);
  });

  it("undo without lower keeps the rank", () => {
    award(3);
    dm({ type: "renown.undo", changeId: last().id });
    expect(pointsOf(g)).toBe(0);
    expect(g.renown).toBe(KNOWN);
  });

  it("fixes a job's points in its Job done line", () => {
    dm({ type: "job.pin", jobId: "j-ransom", pinned: true });
    dm({ type: "job.done", jobId: "j-ransom", payouts: [] });
    dm({ type: "renown.edit", changeId: last().id, amount: 2 });
    expect(pointsOf(g)).toBe(2);
    expect(g.notes!.at(-1)!.text).toMatch(/\+2 Renown\.$/);
    dm({ type: "renown.undo", changeId: last().id });
    expect(pointsOf(g)).toBe(0);
    expect(g.notes!.at(-1)!.text).toMatch(/^Job done:/);
    expect(g.notes!.at(-1)!.text).not.toMatch(/Renown/);
    expect(fails({ type: "renown.edit", changeId: "nope", amount: 1 })).toMatch(/isn't in the history/);
  });

  it("only changes the reason of a rank set by hand", () => {
    dm({ type: "renown.set", rank: KNOWN, reason: "Becuase" });
    dm({ type: "renown.edit", changeId: last().id, amount: 40, reason: "Because" });
    expect(pointsOf(g)).toBe(3);
    expect(last()).toMatchObject({ amount: 3, reason: "Because" });
    expect(texts()).toContain("Renown: the party is now Known in town. Because");
  });

  it("leaves a Chronicle line the DM already edited alone", () => {
    award(2, "x");
    const note = g.notes!.at(-1)!;
    dm({ type: "note.update", noteId: note.id, patch: { text: "My own words" } } as Command);
    dm({ type: "renown.edit", changeId: last().id, reason: "y" });
    expect(g.notes!.find((n) => n.id === note.id)!.text).toBe("My own words");
  });

  it("refuses an award edited to zero", () => {
    award(2);
    expect(fails({ type: "renown.edit", changeId: last().id, amount: 0 })).toMatch(/undo/);
  });
});
