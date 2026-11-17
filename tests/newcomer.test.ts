import { describe, expect, it } from "vitest";
import { apply, type Ctx } from "@/shared/reducer";
import { seedGame } from "@/shared/seed";
import { readiness } from "@/shared/readiness";

let n = 0;
const SYS: Ctx = { now: 1_700_000_000_000, actor: { role: "system" }, token: () => `tok${String(++n).padStart(8, "0")}` };
const DM: Ctx = { now: 1_700_000_000_000, actor: { role: "dm" }, token: SYS.token };

describe("joining with the code takes a seat", () => {
  it("a code joiner counts as seated on the Arrival page and in the Ready check", () => {
    const r = apply(seedGame("t"), { type: "system.join", handle: "robin", name: "Robin" }, SYS);
    const robin = r.state.players.find((p) => p.id === r.playerId)!;
    expect(robin.arrival?.claimedAt).toBe(SYS.now);
    const unclaimed = readiness(r.state).find((x) => x.text.startsWith("No seat claimed"));
    expect(unclaimed?.text ?? "").not.toContain("Robin");
    // It doesn't close the door: the rest of the table may not be here yet.
    expect(r.state.doorClosed).toBeFalsy();
  });

  it("opening your own page takes your seat too, once", () => {
    let s = apply(seedGame("t"), { type: "arrival.issueLinks" }, DM).state;
    const p1 = s.players[0];
    s = apply(s, { type: "system.hello", playerId: p1.id }, SYS).state;
    expect(s.players[0].arrival?.claimedAt).toBe(SYS.now);
    s = apply(s, { type: "system.hello", playerId: p1.id }, { ...SYS, now: SYS.now + 5 }).state;
    expect(s.players[0].arrival?.claimedAt).toBe(SYS.now);
  });

  it("a code joiner can still pick a character from their Arrival link after seats are locked", () => {
    let s = apply(seedGame("t"), { type: "system.join", handle: "robin", name: "Robin" }, SYS).state;
    const robin = s.players.find((p) => p.handle === "robin")!;
    s = { ...s, arrival: { ...(s.arrival ?? {}), seatsLocked: true } } as typeof s;
    s = apply(s, { type: "system.arrivalClaim", playerId: robin.id, character: "Wren", why: "" }, SYS).state;
    expect(s.players.find((p) => p.id === robin.id)!.character).toBe("Wren");
    expect(() => apply(s, { type: "system.arrivalClaim", playerId: robin.id, character: "Other", why: "" }, SYS)).toThrow(/locked/);
  });
});

describe("knocks", () => {
  it("keep the name as typed", () => {
    let s = apply(seedGame("t"), { type: "system.knock", handle: "sam", name: "Sam" }, SYS).state;
    expect(s.knocks[0]).toMatchObject({ handle: "sam", name: "Sam" });
    s = apply(s, { type: "knock.admit", knockId: s.knocks[0].id }, DM).state;
    expect(s.players.find((p) => p.handle === "sam")!.name).toBe("Sam");
  });
});
