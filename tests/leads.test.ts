// Leads and votes: what players see, one vote each, ties to the DM, lazy closing.
import { beforeEach, describe, expect, it } from "vitest";
import type { Command } from "@/shared/commands";
import { projectPlayer, projectTv } from "@/shared/projection";
import { apply, CommandError, type Ctx } from "@/shared/reducer";
import { freshStart, seedGame } from "@/shared/seed";
import type { Actor, GameState } from "@/shared/types";
import { hydrate } from "@/server/store";

const DM: Actor = { role: "dm" };
const P = (id: string): Actor => ({ role: "player", playerId: id });

let g: GameState;
let now = 1000;
function as(actor: Actor, cmd: Command, at = ++now) {
  const r = apply(g, cmd, { now: at, actor } as Ctx);
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
const phone = (pid = "p1") => projectPlayer(g, 1, pid, []);
const phoneJson = () => JSON.stringify(phone());
const add = (text: string, extra: Partial<Extract<Command, { type: "lead.add" }>> = {}) => dm({ type: "lead.add", text, shown: true, ...extra }).leadId!;

beforeEach(() => {
  now = 1000;
  g = hydrate(seedGame("t"))!;
});

describe("leads", () => {
  it("drafts, DM notes and leads about hidden entries never reach players or the TV", () => {
    const draft = add("Draft lead about the cellar", { shown: false });
    const secret = add("Who is the merchant really?", { entryId: "e-merchant" });
    const ok = add("Ask the fisherman about the boat", { entryId: "e-fennick", placeId: "e-docks" });
    dm({ type: "lead.update", leadId: ok, patch: { dmNote: "SECRET-NOTE" } });
    const p = JSON.stringify(phone());
    const tv = JSON.stringify(projectTv(g, 1));
    for (const j of [p, tv]) {
      expect(j).not.toContain("Draft lead");
      expect(j).not.toContain("merchant really");
      expect(j).not.toContain("SECRET-NOTE");
      expect(j).toContain("Ask the fisherman");
    }
    // Rumored entries are named by their rumor name only.
    expect(phone().leads.leads.find((l) => l.id === ok)!.about!.name).toBe("A fisherman losing an argument with a rope.");
    expect(phoneJson()).not.toContain("Fennick");
    expect(phone().leads.leads.find((l) => l.id === ok)!.place!.name).toBe("Candlefair Docks");
    void draft;
    void secret;
  });

  it("show a flyer only once it's on the board", () => {
    const job = g.jobs![0];
    const id = add("The sheep thing", { jobId: job.id });
    const flyer = () => phone().leads.leads.find((l) => l.id === id)!.flyer;
    if (!job.pinned) expect(flyer()).toBeUndefined();
    dm({ type: "job.pin", jobId: job.id, pinned: true } as Command);
    expect(flyer()?.title).toBe(job.title);
  });

  it("go open, followed, closed, and open again on a fresh start", () => {
    const id = add("Follow the lantern cart");
    dm({ type: "lead.status", leadId: id, status: "closed" });
    expect(phone().leads.leads.find((l) => l.id === id)!.status).toBe("closed");
    g = freshStart(g);
    expect(g.leads!.find((l) => l.id === id)!.status).toBe("open");
  });

  it("only point at places", () => {
    expect(fails(DM, { type: "lead.add", text: "x", placeId: "e-mags" })).toMatch(/place/);
  });
});

describe("votes", () => {
  let a: string, b: string;
  beforeEach(() => {
    a = add("The lighthouse", { placeId: "e-lantern" });
    b = add("The forest", { placeId: "e-trollbark" });
  });

  it("one per player, changeable until it closes", () => {
    dm({ type: "vote.open", leadIds: [a, b] });
    as(P("p1"), { type: "me.vote", leadId: a });
    as(P("p1"), { type: "me.vote", leadId: b });
    as(P("p2"), { type: "me.vote", leadId: b });
    expect(phone().leads.vote!.counts).toEqual({ [a]: 0, [b]: 2 });
    expect(phone().leads.vote!.mine).toBe(b);
    dm({ type: "vote.close" });
    expect(g.vote!.winnerId).toBe(b);
    expect(g.leads!.find((l) => l.id === b)!.status).toBe("followed");
    expect(fails(P("p1"), { type: "me.vote", leadId: a })).toMatch(/closed/);
  });

  it("is visible live on the TV", () => {
    dm({ type: "vote.open", leadIds: [a, b] });
    as(P("p1"), { type: "me.vote", leadId: a });
    const v = projectTv(g, 1).leads.vote!;
    expect(v.counts[a]).toBe(1);
    expect(v.voters[a]).toHaveLength(1);
    expect(v.closed).toBe(false);
  });

  it("a tie goes to the DM", () => {
    dm({ type: "vote.open", leadIds: [a, b] });
    as(P("p1"), { type: "me.vote", leadId: a });
    as(P("p2"), { type: "me.vote", leadId: b });
    dm({ type: "vote.close" });
    expect(g.vote!.winnerId).toBeUndefined();
    expect(g.vote!.tied).toEqual([a, b]);
    expect(phone().leads.vote!.tied).toEqual([a, b]);
    dm({ type: "vote.pick", leadId: a });
    expect(g.vote!.winnerId).toBe(a);
    expect(g.leads!.find((l) => l.id === a)!.status).toBe("followed");
  });

  it("closes by itself when its time is up, on the next command", () => {
    dm({ type: "vote.open", leadIds: [a, b], minutes: 1 });
    as(P("p1"), { type: "me.vote", leadId: a });
    // A minute later, any command closes it, and a late ballot is refused.
    as(DM, { type: "lead.add", text: "Something else", shown: false }, now + 61_000);
    expect(g.vote!.closedAt).toBe(g.vote!.closesAt);
    expect(g.vote!.winnerId).toBe(a);
    now += 61_000;
    expect(fails(P("p2"), { type: "me.vote", leadId: b })).toMatch(/closed/);
  });

  it("only takes shown leads, and only players vote", () => {
    const draft = add("Draft", { shown: false });
    expect(fails(DM, { type: "vote.open", leadIds: [a, draft] })).toMatch(/Show/);
    dm({ type: "vote.open", leadIds: [a, b] });
    expect(fails(DM, { type: "me.vote", leadId: a })).toMatch(/player/);
    expect(fails(P("p1"), { type: "me.vote", leadId: draft })).toMatch(/choices/);
  });

  it("plays \"You chose\" on the TV at the next session start, once", () => {
    dm({ type: "vote.open", leadIds: [a, b] });
    as(P("p1"), { type: "me.vote", leadId: a });
    dm({ type: "vote.close" });
    dm({ type: "session.start" });
    const c = projectTv(g, 1).leads.chosen!;
    expect(c.lead.text).toBe("The lighthouse");
    expect(c.lead.place!.name).toBe("The old lighthouse across the river. Dark."); // still a rumor: its hint, not its name
    dm({ type: "session.end" });
    dm({ type: "session.start" });
    expect(g.chosen!.n).toBe(c.n);
  });
});
