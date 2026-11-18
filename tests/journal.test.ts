// Personal journals: goals, backstory and private notes on a player's phone. Theirs and the DM's only.
import { describe, expect, it } from "vitest";
import { projectDm, projectPlayer, projectTv } from "@/shared/projection";
import { apply, type Ctx } from "@/shared/reducer";
import { seedGame } from "@/shared/seed";
import { hydrate } from "@/server/store";
import { playerCommand, dmCommand, type Command } from "@/shared/commands";
import { JOURNAL_GOALS_MAX, noteWhen } from "@/shared/journal";
import { presetOff } from "@/shared/features";
import type { GameState } from "@/shared/types";

const DM: Ctx = { now: 1000, actor: { role: "dm" } };
const as = (pid: string, now = 2000): Ctx => ({ now, actor: { role: "player", playerId: pid } });
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
const j = (act: object): Command => ({ type: "me.journal", act }) as Command;

describe("writing in the journal", () => {
  it("keeps goals, a backstory and notes on the player, tidied", () => {
    let g = table();
    g = run(g, j({ op: "backstory", text: "  Raised by gulls.\r\n\r\n\r\n\r\nLeft at sixteen.  " }), as("p1"));
    g = run(g, j({ op: "goalAdd", text: "  Find   my brother  " }), as("p1"));
    g = run(g, j({ op: "noteAdd", text: "The baker lied about the flour." }), as("p1", 3000));
    const jr = g.players.find((p) => p.id === "p1")!.journal!;
    expect(jr.backstory).toBe("Raised by gulls.\n\nLeft at sixteen.");
    expect(jr.goals).toEqual([{ id: expect.any(String), text: "Find my brother", at: 2000 }]);
    expect(jr.notes?.[0]).toMatchObject({ text: "The baker lied about the flour.", at: 3000 });
    expect(jr.updatedAt).toBe(3000);
  });

  it("ticks a goal off and back, edits and removes, and an emptied journal goes away", () => {
    let g = run(table(), j({ op: "goalAdd", text: "Pay off the debt" }), as("p1"));
    const gid = g.players[0].journal!.goals![0].id;
    g = run(g, j({ op: "goal", id: gid, done: true }), as("p1", 5000));
    expect(g.players[0].journal!.goals![0].doneAt).toBe(5000);
    g = run(g, j({ op: "goal", id: gid, done: false, text: "Pay off half the debt" }), as("p1"));
    expect(g.players[0].journal!.goals![0]).toMatchObject({ text: "Pay off half the debt" });
    expect(g.players[0].journal!.goals![0].doneAt).toBeUndefined();
    expect(tryRun(g, j({ op: "goal", id: gid, text: "   " }), as("p1"))).toMatch(/Remove it instead/);
    g = run(g, j({ op: "goalRemove", id: gid }), as("p1"));
    expect(g.players[0].journal).toBeUndefined();
  });

  it("refuses empty writing and too many goals", () => {
    let g = table();
    expect(tryRun(g, j({ op: "goalAdd", text: "  " }), as("p1"))).toMatch(/Write the goal/);
    expect(tryRun(g, j({ op: "noteAdd", text: "\n" }), as("p1"))).toMatch(/Write something/);
    for (let i = 0; i < JOURNAL_GOALS_MAX; i++) g = run(g, j({ op: "goalAdd", text: `Goal ${i}` }), as("p1"));
    expect(tryRun(g, j({ op: "goalAdd", text: "One more" }), as("p1"))).toMatch(/goals already/);
  });

  it("stamps notes with the chapter, or after it between sessions", () => {
    let g = run(table(), j({ op: "noteAdd", text: "Before it all" }), as("p1"));
    g = run(g, { type: "session.start" });
    g = run(g, j({ op: "noteAdd", text: "During" }), as("p1"));
    g = run(g, { type: "session.end" } as Command);
    g = run(g, j({ op: "noteAdd", text: "After" }), as("p1"));
    const notes = g.players[0].journal!.notes!;
    expect(notes.map(noteWhen)).toEqual(["", "Chapter 1", "After chapter 1"]);
  });

  it("a player only writes in their own journal; the DM can't write in it", () => {
    const g = table();
    expect(tryRun(g, j({ op: "noteAdd", text: "hi" }))).toMatch(/Only a player|Only the player/);
    const after = run(g, j({ op: "noteAdd", text: "mine" }), as("p2"));
    expect(after.players.find((p) => p.id === "p1")!.journal).toBeUndefined();
    expect(after.players.find((p) => p.id === "p2")!.journal?.notes).toHaveLength(1);
  });

  it("validates sizes at the door", () => {
    expect(playerCommand.safeParse({ type: "me.journal", act: { op: "noteAdd", text: "x".repeat(1001) } }).success).toBe(false);
    expect(playerCommand.safeParse({ type: "me.journal", act: { op: "backstory", text: "x".repeat(4000) } }).success).toBe(true);
    expect(dmCommand.safeParse({ type: "journal.hook", playerId: "p1", goalId: "g", text: "x".repeat(301) }).success).toBe(false);
  });
});

describe("who sees it", () => {
  const MARK = "SECRET-HOOK-7731";
  const setup = () => {
    let g = run(table(), j({ op: "goalAdd", text: "Find the lighthouse keeper" }), as("p1"));
    g = run(g, j({ op: "backstory", text: "Grew up on the Gull's Promise" }), as("p1"));
    g = run(g, j({ op: "noteAdd", text: "PRIVATE-NOTE-9" }), as("p1"));
    const gid = g.players[0].journal!.goals![0].id;
    g = run(g, { type: "journal.hook", playerId: "p1", goalId: gid, text: MARK });
    return { g, gid };
  };

  it("the DM sees all of it, hook ideas too", () => {
    const { g } = setup();
    const p = projectDm(g, 1, []).state.players.find((x) => x.id === "p1")!;
    expect(p.journal?.goals?.[0].hook).toBe(MARK);
    expect(p.journal?.notes?.[0].text).toBe("PRIVATE-NOTE-9");
  });

  it("the player sees their own journal without the DM's hook ideas", () => {
    const { g } = setup();
    const v = projectPlayer(g, 1, "p1", []);
    expect(v.me.journal?.goals?.[0].text).toBe("Find the lighthouse keeper");
    expect(v.me.journal?.backstory).toBe("Grew up on the Gull's Promise");
    expect(JSON.stringify(v)).not.toContain(MARK);
  });

  it("no other phone and never the TV", () => {
    const { g } = setup();
    for (const view of [projectPlayer(g, 1, "p2", []), projectTv(g, 1)]) {
      const s = JSON.stringify(view);
      expect(s).not.toContain("PRIVATE-NOTE-9");
      expect(s).not.toContain("lighthouse keeper");
      expect(s).not.toContain(MARK);
    }
  });

  it("a hook can be cleared, and points at a real goal", () => {
    const { g, gid } = setup();
    const cleared = run(g, { type: "journal.hook", playerId: "p1", goalId: gid, text: "  " });
    expect(cleared.players[0].journal!.goals![0].hook).toBeUndefined();
    expect(tryRun(g, { type: "journal.hook", playerId: "p1", goalId: "nope", text: "x" })).toMatch(/isn't in their journal/);
  });
});

describe("the switch", () => {
  it("is on in existing games and Standard, off in Minimal", () => {
    expect(presetOff("standard")).not.toContain("journal");
    expect(presetOff("minimal")).toContain("journal");
  });

  it("off: the phone gets no journal and can't write, but nothing is deleted", () => {
    let g = run(table(), j({ op: "noteAdd", text: "kept" }), as("p1"));
    g = run(g, { type: "features.set", off: ["journal"] });
    expect(projectPlayer(g, 1, "p1", []).me.journal).toBeUndefined();
    expect(tryRun(g, j({ op: "noteAdd", text: "more" }), as("p1"))).toMatch(/turned off/);
    g = run(g, { type: "features.set", off: [] });
    expect(projectPlayer(g, 1, "p1", []).me.journal?.notes?.[0].text).toBe("kept");
  });
});
