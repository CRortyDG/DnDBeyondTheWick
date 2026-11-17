// Attendance is the DM's call: opening the app never marks someone away as here, but they can ask.
import { beforeEach, describe, expect, it } from "vitest";
import { execute, hello, viewFor } from "@/server/game";
import { createMemoryStore, type MemoryStore } from "@/server/store";
import { apply, type Ctx } from "@/shared/reducer";
import { projectPlayer } from "@/shared/projection";
import { playerCommand, type Command } from "@/shared/commands";
import { HERE_ASK_COOLDOWN_MS } from "@/shared/attendance";
import { seedGame } from "@/shared/seed";
import type { GameState } from "@/shared/types";

const DM: Ctx = { now: 1000, actor: { role: "dm" } };
const as = (pid: string, now = 2000): Ctx => ({ now, actor: { role: "player", playerId: pid } });
const run = (g: GameState, cmd: Command, ctx: Ctx = DM) => apply(g, cmd, { ...ctx, rand: () => 0.5 }).state;
const err = (g: GameState, cmd: Command, ctx: Ctx) => {
  try {
    run(g, cmd, ctx);
    return null;
  } catch (e) {
    return (e as Error).message;
  }
};
const p2 = (g: GameState) => g.players.find((p) => p.id === "p2")!;
const cur = (g: GameState) => g.sessions.find((x) => x.id === g.currentSessionId)!;
/** A session running with p2 marked away. */
const awayTonight = () => {
  let g = run(seedGame("t"), { type: "session.start" });
  g = run(g, { type: "run.attend", playerId: "p2", here: false });
  return g;
};

describe("asking to be marked here", () => {
  it("is a player command", () => {
    expect(playerCommand.safeParse({ type: "me.askHere" }).success).toBe(true);
    expect(playerCommand.safeParse({ type: "me.askHere", cancel: true }).success).toBe(true);
  });

  it("asks, and leaves them away until the DM answers", () => {
    let g = awayTonight();
    expect(projectPlayer(g, 1, "p2", []).me.away).toBe(true);
    expect(projectPlayer(g, 1, "p2", []).me.hereAsk).toBeUndefined();
    g = run(g, { type: "me.askHere" }, as("p2"));
    expect(p2(g).hereAsk).toBe(2000);
    expect(p2(g).away).toBe(true);
    expect(cur(g).attendeeIds).not.toContain("p2");
    expect(projectPlayer(g, 1, "p2", []).me.hereAsk).toEqual({ status: "waiting" });
    // Asking twice keeps the first time.
    g = run(g, { type: "me.askHere" }, as("p2", 3000));
    expect(p2(g).hereAsk).toBe(2000);
  });

  it("DM marks them here: present, counted, ask cleared", () => {
    let g = run(awayTonight(), { type: "me.askHere" }, as("p2"));
    g = run(g, { type: "run.attend", playerId: "p2", here: true });
    expect(p2(g).away).toBe(false);
    expect(p2(g).hereAsk).toBeUndefined();
    expect(cur(g).attendeeIds).toContain("p2");
    const me = projectPlayer(g, 1, "p2", []).me;
    expect(me.away).toBeUndefined();
    expect(me.hereAsk).toBeUndefined();
  });

  it("DM keeps them away: not yet, then they can ask again after a minute", () => {
    let g = run(awayTonight(), { type: "me.askHere" }, as("p2"));
    g = run(g, { type: "run.hereDismiss", playerId: "p2" }, { ...DM, now: 5000 });
    expect(p2(g).away).toBe(true);
    expect(p2(g).hereAsk).toBeUndefined();
    expect(projectPlayer(g, 1, "p2", []).me.hereAsk).toEqual({ status: "notYet", at: 5000 });
    expect(err(g, { type: "me.askHere" }, as("p2", 5000 + 10_000))).toMatch(/again in a minute/);
    g = run(g, { type: "me.askHere" }, as("p2", 5000 + HERE_ASK_COOLDOWN_MS));
    expect(projectPlayer(g, 1, "p2", []).me.hereAsk).toEqual({ status: "waiting" });
  });

  it("can be taken back", () => {
    let g = run(awayTonight(), { type: "me.askHere" }, as("p2"));
    g = run(g, { type: "me.askHere", cancel: true }, as("p2"));
    expect(p2(g).hereAsk).toBeUndefined();
  });

  it("only while a session runs, and never for someone who is already here", () => {
    const g = seedGame("t");
    g.players[1].away = true;
    expect(err(g, { type: "me.askHere" }, as("p2"))).toMatch(/no session/);
    expect(projectPlayer(g, 1, "p2", []).me.away).toBeUndefined();
    const here = run(run(seedGame("t"), { type: "session.start" }), { type: "me.askHere" }, as("p2"));
    expect(p2(here).hereAsk).toBeUndefined();
  });

  it("goes when the session ends", () => {
    let g = run(awayTonight(), { type: "me.askHere" }, as("p2"));
    g = run(g, { type: "session.end" });
    expect(p2(g).hereAsk).toBeUndefined();
    expect(p2(g).hereNo).toBeUndefined();
  });

  it("ticking them here from the Players page clears the ask too", () => {
    let g = run(awayTonight(), { type: "me.askHere" }, as("p2"));
    g = run(g, { type: "player.update", playerId: "p2", patch: { away: false } });
    expect(p2(g).hereAsk).toBeUndefined();
  });
});

describe("opening the app (audit C1)", () => {
  let store: MemoryStore;
  beforeEach(async () => {
    store = createMemoryStore();
    await store.overwrite("t", seedGame("t"), []);
    await execute(store, "t", { role: "dm" }, { type: "session.start" });
    await execute(store, "t", { role: "dm" }, { type: "run.attend", playerId: "p2", here: false });
  });

  it("doesn't count someone marked away as attending", async () => {
    const handle = (await store.read("t")).state!.players.find((p) => p.id === "p2")!.handle;
    expect((await hello("t", handle, null, store)).status).toBe("ok");
    const { state } = await store.read("t");
    const p = state!.players.find((x) => x.id === "p2")!;
    expect(p.away).toBe(true);
    expect(p.lastSeenAt).toBeDefined();
    expect(state!.sessions.find((x) => x.id === state!.currentSessionId)!.attendeeIds).not.toContain("p2");
    const v = await viewFor(store, "t", { role: "player", playerId: "p2" });
    if (v.role !== "player") throw new Error();
    expect(v.me.away).toBe(true);
  });
});
