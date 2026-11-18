// Rooms at the inn: keys on a rack, perks, DM-only story hooks, rent through
// the shop's own recurring rent, the Good Room's lock, and room moments.
import { beforeEach, describe, expect, it } from "vitest";
import type { Command } from "@/shared/commands";
import { GP } from "@/shared/money";
import { duesFor } from "@/shared/progress";
import { projectPlayer, projectTv } from "@/shared/projection";
import { apply, CommandError, type Ctx } from "@/shared/reducer";
import { behindOnRent, keyRack, roomsOf, startPerks, suggestMoment } from "@/shared/rooms";
import { seedGame } from "@/shared/seed";
import { draftToOp, entryInput } from "@/shared/builderInput";
import type { Actor, GameState, LedgerEntry, RoomInfo } from "@/shared/types";

const DM: Actor = { role: "dm" };
const INN = "The Flickering Candle";

let g: GameState;
let ledger: LedgerEntry[];
let now = 1000;

function as(actor: Actor, cmd: Command) {
  const r = apply(g, cmd, { now: ++now, actor, rand: () => 0.5 } as Ctx);
  g = r.state;
  ledger.push(...r.ledger);
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
const bal = (pid: string) => g.players.find((p) => p.id === pid)!.balanceCp;
const pay = (pid: string, gp: number) => dm({ type: "money.adjust", playerId: pid, amountCp: gp * GP, note: "" });
const curNumber = () => g.sessions.find((s) => s.id === g.currentSessionId)!.number;
const curSession = () => g.sessions.find((s) => s.id === g.currentSessionId)!;
const chargeAllDue = () => dm({ type: "dues.charge", ids: duesFor(g, curSession()).map((d) => d.id) });
const roomId = (name: string) => roomsOf(g).find((e) => e.name === name)!.id;
const assign = (pid: string, name: string | null, extra: { free?: boolean } = {}) => dm({ type: "room.assign", playerId: pid, roomId: name === null ? null : roomId(name), ...extra });

const STORY = "SECRET-STORY-HOOK";
const MAGS = "SECRET-MAGS-LINE";

function addRoom(name: string, room: RoomInfo, extra: { secrets?: string; dmNote?: string } = {}) {
  dm({ type: "entry.add", entry: { kind: "place", name, areas: [INN], secrets: extra.secrets ?? `${STORY} ${name}`, dmNote: extra.dmNote ?? `${MAGS} ${name}`, room: { ...room } } });
}

beforeEach(() => {
  g = seedGame("t");
  ledger = [];
  dm({ type: "entry.add", entry: { kind: "place", name: INN } });
  addRoom("The Hearth Room", { hook: 1, type: "guest", key: "round filigree", perk: "Warmest bed in the inn." });
  addRoom("Over the Kitchen", { hook: 3, type: "guest", key: "four-petal flower", perk: "One free rumor each session.", startPerk: "rumor" });
  addRoom("The Leaky One", { hook: 4, type: "guest", key: "seahorse", perk: "Half rent. Bucket provided.", rentCp: 150 });
  addRoom("The Good Room", { hook: 8, type: "good", key: "crown", perk: "Start each session with a Candle's Luck token." });
  addRoom("Upstairs storeroom", { hook: 9, type: "staff", key: "clover with fleur tip", perk: "" });
  addRoom("The cellar", { hook: 12, type: "staff", key: "", keyMissing: true, perk: "" });
});

describe("rooms", () => {
  it("are places with a hook each; two rooms can't share a hook, and only places can be rooms", () => {
    expect(roomsOf(g).map((e) => e.room.hook)).toEqual([1, 3, 4, 8, 9, 12]);
    expect(fails(DM, { type: "entry.add", entry: { kind: "place", name: "Dup", room: { hook: 1, type: "guest", key: "", perk: "" } } })).toMatch(/Hook 1/);
    expect(fails(DM, { type: "entry.add", entry: { kind: "person", name: "Bob", room: { hook: 2, type: "guest", key: "", perk: "" } } })).toMatch(/place/);
  });

  it("are found with their inn, staff rooms excepted, without a Chronicle line each", () => {
    const notes = (g.notes ?? []).length;
    const inn = roomsOf(g)[0] && (g.entries ?? []).find((e) => e.name === INN)!;
    dm({ type: "entry.stage", entryId: inn.id, stage: "found", announce: false });
    const stages = Object.fromEntries(roomsOf(g).map((e) => [e.name, e.stage]));
    expect(stages["The Hearth Room"]).toBe("found");
    expect(stages["The Good Room"]).toBe("found");
    expect(stages["Upstairs storeroom"]).toBe("hidden");
    expect(stages["The cellar"]).toBe("hidden");
    expect((g.notes ?? []).length).toBe(notes + 1);
  });
});

describe("check-in", () => {
  it("guest rooms hold at most 2 characters", () => {
    assign("p1", "The Hearth Room");
    assign("p2", "The Hearth Room");
    expect(fails(DM, { type: "room.assign", playerId: "p3", roomId: roomId("The Hearth Room") })).toMatch(/full/);
  });

  it("staff rooms and a missing key can't be rented", () => {
    expect(fails(DM, { type: "room.assign", playerId: "p1", roomId: roomId("Upstairs storeroom") })).toMatch(/isn't for guests/);
    expect(fails(DM, { type: "room.assign", playerId: "p1", roomId: roomId("The cellar") })).toMatch(/isn't for guests/);
  });

  it("moving keeps history, frees the old bed, and never charges twice or gives a second free month", () => {
    pay("p1", 20);
    assign("p1", "The Hearth Room");
    const first = g.rentals.find((r) => r.roomId && r.active)!;
    assign("p1", "The Leaky One");
    expect(bal("p1")).toBe(20 * GP);
    const rs = g.rentals.filter((r) => r.roomId && r.playerId === "p1");
    expect(rs.map((r) => [r.itemName, r.active])).toEqual([
      ["The Hearth Room", false],
      ["The Leaky One", true],
    ]);
    expect(rs[1].paidThrough).toBe(first.paidThrough);
    // Their old bed is free again.
    assign("p2", "The Hearth Room");
    assign("p3", "The Hearth Room");
  });

  it("checks out, and players can't cancel a room from the shop", () => {
    assign("p1", "The Hearth Room");
    const r = g.rentals.find((x) => x.roomId && x.active)!;
    expect(fails({ role: "player", playerId: "p1" }, { type: "me.cancelRental", rentalId: r.id })).toMatch(/Ask the DM/);
    assign("p1", null);
    expect(g.rentals.some((x) => x.roomId && x.active)).toBe(false);
  });
});

describe("rent", () => {
  it("is 3 gp a month through the shop's recurring rent, charged once per session, first month free", () => {
    pay("p1", 20);
    dm({ type: "session.start" });
    assign("p1", "The Hearth Room");
    expect(bal("p1")).toBe(20 * GP); // the welcome
    expect(duesFor(g, curSession())).toEqual([]); // the first month is paid
    dm({ type: "session.end" });
    dm({ type: "session.start" });
    expect(duesFor(g, curSession()).map((d) => d.cp)).toEqual([3 * GP]);
    chargeAllDue();
    chargeAllDue();
    expect(bal("p1")).toBe(17 * GP);
    expect(ledger.filter((l) => l.kind === "rent").length).toBe(1);
    // The rent item exists in the inn's shop, hidden from phones.
    const it = g.items.find((x) => x.id === g.rentals[0].itemId)!;
    expect(it.kind).toBe("recurring");
    expect(it.tier).toBe("hidden");
  });

  it("the Leaky One charges half", () => {
    pay("p1", 20);
    dm({ type: "session.start" });
    assign("p1", "The Leaky One");
    dm({ type: "session.end" });
    dm({ type: "session.start" });
    chargeAllDue();
    expect(bal("p1")).toBe(20 * GP - 150);
  });

  it("the first month is only free once; a second room after checking out is paid", () => {
    pay("p1", 20);
    assign("p1", "The Hearth Room");
    assign("p1", null);
    assign("p1", "The Hearth Room");
    expect(bal("p1")).toBe(17 * GP);
  });

  it("a missed payment is flagged, nobody moves on their own, and waiving clears it", () => {
    dm({ type: "session.start" });
    assign("p1", "The Hearth Room");
    dm({ type: "session.end" });
    dm({ type: "session.start" });
    // The DM unticks it (they can't pay): nothing is charged.
    dm({ type: "dues.charge", ids: [] });
    dm({ type: "session.end" });
    expect(behindOnRent(g).map((r) => r.playerId)).toEqual(["p1"]);
    expect(g.rentals.find((r) => r.roomId && r.active)!.itemName).toBe("The Hearth Room");
    const p1 = projectPlayer(g, 1, "p1", []);
    expect(p1.myRoom?.behind).toBe(true);
    dm({ type: "room.waive", rentalId: behindOnRent(g)[0].id });
    expect(behindOnRent(g)).toEqual([]);
  });
});

describe("the Good Room", () => {
  it("stays locked until the Renown rank is met", () => {
    expect(fails(DM, { type: "room.assign", playerId: "p1", roomId: roomId("The Good Room") })).toMatch(/earned/i);
    dm({ type: "renown.set", rank: 1 });
    assign("p1", "The Good Room");
    expect(g.rentals.find((r) => r.roomId && r.active)!.itemName).toBe("The Good Room");
  });

  it("in rent mode is open to anyone at the higher rent, and moving in frees their old bed", () => {
    dm({ type: "rooms.settings", patch: { good: { mode: "rent" } } });
    pay("p1", 20);
    assign("p1", "The Hearth Room");
    assign("p1", "The Good Room");
    const r = g.rentals.find((x) => x.roomId && x.active)!;
    expect(r.monthlyCp).toBe(10 * GP);
    expect(keyRack(g).hooks.find((h) => h.hook === 1)!.taken).toEqual([]);
  });

  it("reminds the DM to give its tenants Inspiration, and Over the Kitchen its rumor", () => {
    dm({ type: "renown.set", rank: 1 });
    assign("p1", "The Good Room");
    assign("p2", "Over the Kitchen");
    expect(startPerks(g).map((x) => [x.kind, x.player.id])).toEqual([
      ["rumor", "p2"],
      ["inspiration", "p1"],
    ]);
  });
});

describe("room moments", () => {
  it("only suggest present players, longest without one first", () => {
    assign("p1", "The Hearth Room");
    assign("p2", "Over the Kitchen");
    assign("p3", "The Leaky One");
    dm({ type: "player.update", playerId: "p1", patch: { away: true } });
    expect(suggestMoment(g)!.player.id).toBe("p2");
    dm({ type: "room.moment", playerId: "p2" });
    expect(suggestMoment(g)!.player.id).toBe("p3");
    dm({ type: "room.moment", playerId: "p3", note: "letters" });
    expect(suggestMoment(g)!.player.id).toBe("p2");
    expect(suggestMoment(g, ["p2"])!.player.id).toBe("p3");
    dm({ type: "player.update", playerId: "p2", patch: { away: true } });
    dm({ type: "player.update", playerId: "p3", patch: { away: true } });
    expect(suggestMoment(g)).toBeNull();
  });
});

describe("what players and the TV see", () => {
  it("never get story hooks, the innkeeper's lines or staff rooms", () => {
    dm({ type: "entry.stage", entryId: (g.entries ?? []).find((e) => e.name === INN)!.id, stage: "found", announce: false });
    dm({ type: "entry.stage", entryId: roomId("Upstairs storeroom"), stage: "found", announce: false });
    dm({ type: "renown.set", rank: 1 });
    assign("p1", "The Hearth Room");
    assign("p2", "The Hearth Room");
    assign("p3", "The Good Room");
    dm({ type: "room.moment", playerId: "p1", note: "MOMENT-NOTE" });
    dm({ type: "rooms.settings", patch: { register: ["REGISTER-NAMELESS-GUEST"] } });
    dm({ type: "show", ref: "keys" });
    const tv = JSON.stringify(projectTv(g, 1));
    const phone = JSON.stringify(projectPlayer(g, 1, "p1", []));
    for (const out of [tv, phone]) {
      expect(out).not.toContain(STORY);
      expect(out).not.toContain(MAGS);
      expect(out).not.toContain("MOMENT-NOTE");
      expect(out).not.toContain("REGISTER-NAMELESS-GUEST");
      expect(out).not.toContain("clover with fleur tip");
    }
    const p1 = projectPlayer(g, 1, "p1", []);
    expect(p1.myRoom).toMatchObject({ name: "The Hearth Room", key: "round filigree", perk: "Warmest bed in the inn." });
    expect(p1.myRoom!.roommates.length).toBe(1);
    expect(p1.entries.find((e) => e.name === "The Hearth Room")?.room).toEqual({ hook: 1, type: "guest", key: "round filigree", perk: "Warmest bed in the inn." });
    expect(p1.entries.find((e) => e.name === "Upstairs storeroom")?.room).toBeUndefined();
    const rack = projectTv(g, 1).keyRack!;
    expect(rack.inn).toBe(INN);
    expect(rack.hooks).toHaveLength(12);
    expect(rack.hooks[0].taken).toHaveLength(2);
    expect(rack.hooks[7]).toMatchObject({ type: "good", name: "The Good Room" });
    expect(rack.hooks[8]).toEqual({ hook: 9, type: "staff", empty: false, taken: [] });
    expect(rack.hooks[11]).toEqual({ hook: 12, empty: true, taken: [] });
  });

  it("the key rack only goes to the TV while it's showing, and not when Rooms is off", () => {
    expect(projectTv(g, 1).keyRack).toBeUndefined();
    dm({ type: "show", ref: "keys" });
    expect(projectTv(g, 1).keyRack).toBeDefined();
    dm({ type: "features.set", off: ["rooms"] });
    expect(projectTv(g, 1).keyRack).toBeUndefined();
  });
});

describe("the Worldbuilder", () => {
  it("can draft a room on a place, and only on a place", () => {
    const body = { kind: "place", name: "The Snug", areas: [INN], secret: "The safe room.", dm_note: "Cozy, that one.", room: { hook: 5, type: "guest", key: "heart-in-heart", perk: "Coziest room." } };
    expect(entryInput.safeParse(body).success).toBe(true);
    expect(entryInput.safeParse({ ...body, kind: "person" }).success).toBe(false);
    const op = draftToOp({ id: "bd_x", kind: "entry", label: "k", body } as never, "hidden");
    expect(op.kind === "entry" && op.entry.room).toEqual({ hook: 5, type: "guest", key: "heart-in-heart", perk: "Coziest room." });
    const r = apply(g, { type: "system.builderApply", ops: [op] } as Command, { now: ++now, actor: { role: "system" } } as Ctx);
    const snug = (r.state.entries ?? []).find((e) => e.name === "The Snug")!;
    expect(snug.room?.hook).toBe(5);
    expect(snug.secrets).toBe("The safe room.");
  });
});

describe("the register", () => {
  const stay = (pid: string) => g.rentals.filter((r) => r.roomId && r.playerId === pid);

  it("a past stay's room and dates can be fixed", () => {
    assign("p1", "The Hearth Room");
    assign("p1", null);
    const r = stay("p1")[0];
    dm({ type: "room.stay.edit", rentalId: r.id, patch: { roomId: roomId("The Leaky One"), startedAt: 500, endedAt: 700 } });
    expect(stay("p1")[0]).toMatchObject({ roomId: roomId("The Leaky One"), itemName: "The Leaky One", startedAt: 500, endedAt: 700 });
    expect(fails(DM, { type: "room.stay.edit", rentalId: r.id, patch: { endedAt: 400 } })).toMatch(/before they arrived/);
  });

  it("a current stay's room is changed on the rack, not in the register", () => {
    assign("p1", "The Hearth Room");
    const r = stay("p1")[0];
    expect(fails(DM, { type: "room.stay.edit", rentalId: r.id, patch: { roomId: roomId("The Leaky One") } })).toMatch(/key rack/);
    expect(fails(DM, { type: "room.stay.edit", rentalId: r.id, patch: { endedAt: now + 5 } })).toMatch(/Check them out/);
  });

  it("a line can be deleted; deleting a current stay frees the bed and keeps what was paid", () => {
    assign("p1", "The Hearth Room");
    assign("p1", null);
    dm({ type: "room.stay.delete", rentalId: stay("p1")[0].id });
    expect(stay("p1")).toHaveLength(0);
    pay("p2", 10);
    assign("p2", "The Hearth Room", { free: false });
    const before = bal("p2");
    dm({ type: "room.stay.delete", rentalId: stay("p2")[0].id });
    expect(stay("p2")).toHaveLength(0);
    expect(bal("p2")).toBe(before);
    expect(keyRack(g).hooks[0].taken).toHaveLength(0);
  });

  it("hand-written lines can be edited and deleted", () => {
    dm({ type: "rooms.settings", patch: { register: ["Last Nightal · no name · The Good Room", "Old line"] } });
    dm({ type: "rooms.settings", patch: { register: ["Last Nightal · broken ring · The Good Room"] } });
    expect(g.rooms?.register).toEqual(["Last Nightal · broken ring · The Good Room"]);
  });

  it("stays a player sends don't go through", () => {
    assign("p1", "The Hearth Room");
    expect(() => as({ role: "player", playerId: "p1" } as Actor, { type: "room.stay.delete", rentalId: stay("p1")[0].id } as Command)).toThrow();
  });
});
