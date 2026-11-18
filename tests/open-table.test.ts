// Open tables in a shared world: groups mix, one character plays in several,
// and rent, orders, jobs, seats and attendance follow the character.
import { beforeEach, describe, expect, it } from "vitest";
import type { Command } from "@/shared/commands";
import { GP } from "@/shared/money";
import { duesFor } from "@/shared/progress";
import { apply, type Ctx } from "@/shared/reducer";
import { seatedCount, seedGame } from "@/shared/seed";
import type { Actor, GameState } from "@/shared/types";

const DM: Actor = { role: "dm" };
const P = (n: number): Actor => ({ role: "player", playerId: `p${n}` });

let g: GameState;
let now = 1000;

function as(actor: Actor, cmd: Command) {
  const r = apply(g, cmd, { now: ++now, actor, rand: () => 0.5 } as Ctx);
  g = r.state;
  return r;
}
const dm = (cmd: Command) => as(DM, cmd);
const bal = (pid: string) => g.players.find((p) => p.id === pid)!.balanceCp;
const party = (name: string) => g.parties!.find((x) => x.name === name)!;
const cur = () => g.sessions.find((s) => s.id === g.currentSessionId)!;
const lastPending = () => g.requests.filter((r) => r.status === "pending").at(-1)!;
const buy = (pid: string, itemId: string) => {
  as(P(Number(pid.slice(1))), { type: "me.requestBuy", itemId, qty: 1, note: "" });
  dm({ type: "request.approve", requestId: lastPending().id });
};
const night = (partyName: string) => {
  dm({ type: "party.play", partyId: party(partyName).id });
  dm({ type: "session.start" });
};

beforeEach(() => {
  g = seedGame("t");
  now = 1000;
  // Core: everyone so far. Kids: the uncle (p1) and his kid (p4).
  dm({ type: "party.add", name: "Kids", firstName: "Core" });
  dm({ type: "party.member", partyId: party("Kids").id, playerId: "p1", member: true });
  dm({ type: "party.member", partyId: party("Kids").id, playerId: "p4", member: true });
  for (const pid of ["p1", "p2", "p4"]) dm({ type: "money.adjust", playerId: pid, amountCp: 300 * GP, note: "" });
  for (const shopId of ["candle", "bg"]) dm({ type: "shop.visibility", shopId, visibility: "all", quiet: true });
});

describe("rent and lessons in a shared world", () => {
  it("count every group's nights, and only charge the characters at the table", () => {
    night("Core");
    buy("p1", "c-room");
    buy("p2", "c-room");
    dm({ type: "session.end" });

    // The kids' table: the uncle pays for his room, the Core-only character isn't charged.
    night("Kids");
    expect(duesFor(g, cur()).map((d) => d.playerId)).toEqual(["p1"]);
    dm({ type: "dues.charge", ids: duesFor(g, cur()).map((d) => d.id) });
    dm({ type: "session.end" });

    // Back at Core: each pays once, though Core's own session number is only 2.
    night("Core");
    expect(cur().number).toBe(2);
    const due = duesFor(g, cur());
    expect(due.map((d) => d.playerId).sort()).toEqual(["p1", "p2"]);
    const before = { p1: bal("p1"), p2: bal("p2") };
    dm({ type: "dues.charge", ids: due.map((d) => d.id) });
    expect(bal("p1")).toBe(before.p1 - 3 * GP);
    expect(bal("p2")).toBe(before.p2 - 3 * GP);
    // Charged: nothing more due this night.
    expect(duesFor(g, cur())).toEqual([]);
  });

  it("special orders arrive after that many nights, at the next table their owner sits at", () => {
    night("Core");
    buy("p1", "bg-climbing"); // arrives in 2 nights
    dm({ type: "session.end" });
    night("Kids");
    expect(g.orders[0].arrived).toBe(false);
    dm({ type: "session.end" });
    night("Core"); // Core's session 2, the campaign's night 3
    expect(g.orders[0].arrived).toBe(true);
  });

  it("number the nights from the old session numbers when the world begins", () => {
    g = seedGame("t2");
    dm({ type: "session.start" });
    dm({ type: "session.end" });
    dm({ type: "session.start" });
    dm({ type: "session.end" });
    dm({ type: "party.add", name: "Second" });
    expect(g.sessions.map((s) => s.night)).toEqual([1, 2]);
    dm({ type: "session.start" });
    expect(cur().night).toBe(3);
  });
});

describe("jobs in a shared world", () => {
  it("go to the asker's party, not whoever is at the table when the DM approves", () => {
    night("Kids");
    // p2 plays only with Core, and asks from home while the kids play.
    as(P(2), { type: "me.takeJob", jobId: "j-artum", note: "" });
    dm({ type: "request.approve", requestId: lastPending().id });
    expect(g.jobs!.find((j) => j.id === "j-artum")!.partyId).toBe(party("Core").id);
  });

  it("go to the party at the table when the asker plays in it", () => {
    night("Kids");
    as(P(1), { type: "me.takeJob", jobId: "j-artum", note: "" });
    dm({ type: "request.approve", requestId: lastPending().id });
    expect(g.jobs!.find((j) => j.id === "j-artum")!.partyId).toBe(party("Kids").id);
  });
});

describe("seats and attendance", () => {
  it("count only the characters at the table in a shared world", () => {
    dm({ type: "party.play", partyId: party("Kids").id });
    expect(seatedCount(g)).toBe(2);
  });

  it("seat someone added to the party at the table mid-session", () => {
    night("Kids");
    expect(cur().attendeeIds).not.toContain("p3");
    dm({ type: "party.member", partyId: party("Kids").id, playerId: "p3", member: true });
    expect(g.players.find((p) => p.id === "p3")!.away).toBe(false);
    expect(cur().attendeeIds).toContain("p3");
  });

  it("can be fixed after a session ends", () => {
    night("Kids");
    const id = cur().id;
    dm({ type: "session.end" });
    dm({ type: "session.attend", sessionId: id, playerId: "p2", here: true });
    dm({ type: "session.attend", sessionId: id, playerId: "p4", here: false });
    expect(g.sessions.find((s) => s.id === id)!.attendeeIds.sort()).toEqual(["p1", "p2"]);
    // An ended session doesn't move anyone at the table now.
    expect(g.players.find((p) => p.id === "p2")!.away).toBe(true);
  });
});
