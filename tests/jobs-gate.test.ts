// Jobs that wait for the notice board: the DM ties the bounty board to a
// Discover entry, and phones (and the TV's board) get no jobs until the party
// has found it. Campaigns that never set one keep seeing jobs as before.
import { beforeEach, describe, expect, it } from "vitest";
import type { Command } from "@/shared/commands";
import { projectPlayer, projectTv } from "@/shared/projection";
import { apply, CommandError, type Ctx } from "@/shared/reducer";
import { seedGame } from "@/shared/seed";
import type { Actor, GameState } from "@/shared/types";
import { hydrate } from "@/server/store";

const DM: Actor = { role: "dm" };
const P = (id: string): Actor => ({ role: "player", playerId: id });

let g: GameState;
let now = 1000;
function as(actor: Actor, cmd: Command) {
  const r = apply(g, cmd, { now: ++now, actor, token: () => `tok${++now}` } as Ctx);
  g = r.state;
  return r;
}
const dm = (cmd: Command) => as(DM, cmd);
function fails(actor: Actor, cmd: Command): string {
  try {
    as(actor, cmd);
  } catch (e) {
    if (e instanceof CommandError) return e.message;
    throw e;
  }
  throw new Error("expected the command to fail");
}
const phone = (pid: string) => projectPlayer(g, 1, pid, []);
const board = () => g.entries!.find((e) => e.id === g.jobsGate)!;

beforeEach(() => {
  g = hydrate(seedGame("t"))!;
  now = 1000;
});

describe("jobs waiting for the notice board", () => {
  it("changes nothing until the DM turns it on", () => {
    expect(g.jobsGate).toBeUndefined();
    expect(phone("p1").jobs.map((j) => j.id)).toContain("j-artum");
    expect(phone("p1").jobsLocked).toBeUndefined();
    expect(projectTv(g, 1).jobs.length).toBeGreaterThan(0);
  });

  it("makes a hidden Notice board place, and hides jobs from phones and the TV until it's found", () => {
    const r = dm({ type: "jobs.gate", make: true });
    expect(r.entryId).toBe(g.jobsGate);
    expect(board()).toMatchObject({ kind: "place", name: "Notice board", stage: "hidden" });
    const v = phone("p1");
    expect(v.jobsLocked).toBe(true);
    expect(v.jobs).toEqual([]);
    expect(JSON.stringify(v)).not.toContain("Winterfest");
    expect(JSON.stringify(v)).not.toContain(g.jobsGate);
    expect(projectTv(g, 1).jobs).toEqual([]);
    expect(fails(P("p1"), { type: "me.takeJob", jobId: "j-artum", note: "" })).toMatch(/isn't on the board/);

    // A rumor isn't enough.
    dm({ type: "entry.stage", entryId: board().id, stage: "rumored", announce: false });
    expect(phone("p1").jobsLocked).toBe(true);

    dm({ type: "entry.stage", entryId: board().id, stage: "found", announce: true });
    expect(phone("p1").jobsLocked).toBeUndefined();
    expect(phone("p1").jobs.map((j) => j.id)).toContain("j-artum");
    expect(projectTv(g, 1).jobs.length).toBeGreaterThan(0);
    as(P("p1"), { type: "me.takeJob", jobId: "j-artum", note: "" });
    expect(g.requests.at(-1)).toMatchObject({ kind: "job", jobId: "j-artum", status: "pending" });
  });

  it("reuses a place already called Notice board instead of making a second", () => {
    dm({ type: "entry.add", entry: { kind: "place", name: "Notice Board" } });
    const before = g.entries!.length;
    dm({ type: "jobs.gate", make: true });
    expect(g.entries!.length).toBe(before);
    expect(board().name).toBe("Notice Board");
  });

  it("can be tied to any entry, turned off, and lets go when its entry is deleted", () => {
    dm({ type: "jobs.gate", entryId: "e-bolla" });
    const bollaFound = g.entries!.find((e) => e.id === "e-bolla")!.stage;
    expect(!!phone("p1").jobsLocked).toBe(bollaFound === "hidden" || bollaFound === "rumored");
    dm({ type: "jobs.gate", entryId: null });
    expect(g.jobsGate).toBeUndefined();
    expect(phone("p1").jobsLocked).toBeUndefined();

    dm({ type: "jobs.gate", make: true });
    dm({ type: "entry.remove", entryId: board().id });
    expect(g.jobsGate).toBeUndefined();
    expect(phone("p1").jobs.length).toBeGreaterThan(0);
  });

  it("is DM-only", () => {
    expect(fails(P("p1"), { type: "jobs.gate", make: true } as Command)).toBeTruthy();
  });

  it("in a shared world, follows each character's own discovery", () => {
    dm({ type: "jobs.gate", make: true });
    dm({ type: "party.add", name: "The Sons", firstName: "The Friends" });
    const A = g.parties![0].id;
    const B = g.parties![1].id;
    dm({ type: "party.member", partyId: A, playerId: "p3", member: false });
    dm({ type: "party.member", partyId: A, playerId: "p4", member: false });
    for (const p of ["p3", "p4"]) dm({ type: "party.member", partyId: B, playerId: p, member: true, catchUp: false });
    dm({ type: "party.play", partyId: B });
    dm({ type: "session.start" });
    dm({ type: "entry.stage", entryId: board().id, stage: "found", announce: false });
    dm({ type: "session.end" });
    dm({ type: "party.play", partyId: A });
    // p3 found it with party B; p1 (party A) hasn't.
    expect(phone("p3").jobsLocked).toBeUndefined();
    expect(phone("p1").jobsLocked).toBe(true);
    expect(projectTv(g, 1).jobs).toEqual([]);
  });
});
