// Session invites: one link, first come first served, a waitlist that moves up,
// and the seats becoming the night's table.
import { beforeEach, describe, expect, it } from "vitest";
import { handleApi, SEAT_HEADER } from "@/server/api";
import { execute } from "@/server/game";
import { createMemoryStore, type MemoryStore } from "@/server/store";
import { calendarFile, type InviteView } from "@/shared/invites";
import { projectDm, projectPlayer, projectTv } from "@/shared/projection";
import { seedGame } from "@/shared/seed";
import type { GameState, Invite } from "@/shared/types";

const DM = { role: "dm" as const };
const G = "candlefair";
const HOUR = 3600_000;
let store: MemoryStore;

beforeEach(async () => {
  store = createMemoryStore();
  await store.overwrite(G, seedGame(G), []);
});

async function state(): Promise<GameState> {
  return (await store.read(G)).state!;
}

async function makeInvite(extra: Record<string, unknown> = {}, holdIds?: string[]): Promise<Invite> {
  const r = await execute(store, G, DM, {
    type: "invite.add",
    invite: { title: "One-shot", date: "2030-01-05", time: "18:30", startsAt: Date.now() + 72 * HOUR, place: "Sam's place", address: "14 Larch St", blurb: "Level 1", seats: 3, ...extra },
    ...(holdIds ? { holdIds } : {}),
  } as never);
  void r;
  const s = await state();
  return s.invites![s.invites!.length - 1];
}

const key = (n: number) => `seat-key-for-phone-${String(n).padStart(4, "0")}`;

async function phone(method: "GET" | "POST", code: string, seat: string | null, body?: object, extra: { player?: string; pkey?: string } = {}) {
  const q = new URLSearchParams({ game: G, i: code, ...(extra.player ? { player: extra.player } : {}) });
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (seat) headers[SEAT_HEADER] = seat;
  if (extra.pkey) headers["x-candlefair-key"] = extra.pkey;
  const res = await handleApi(new Request(`http://x/api/invite?${q}`, { method, headers, ...(body ? { body: JSON.stringify(body) } : {}) }), store);
  const text = await res.text();
  return { status: res.status, body: JSON.parse(text) as InviteView & { error?: string; code?: string }, text, miss: res.headers.has("x-candlefair-miss") };
}

const claim = (code: string, n: number, name: string, character = "") => phone("POST", code, key(n), { type: "claim", name, character });

describe("claiming seats", () => {
  it("first come first served, then a waitlist in order", async () => {
    const inv = await makeInvite();
    expect((await claim(inv.code, 1, "Priya")).body.me?.state).toBe("in");
    expect((await claim(inv.code, 2, "Jules", "Wren Hallow")).body.me?.state).toBe("in");
    expect((await claim(inv.code, 3, "Marco")).body.me?.state).toBe("in");
    const four = await claim(inv.code, 4, "Dana");
    expect(four.body.me).toMatchObject({ state: "wait", place: 1 });
    expect(four.body.invite).toMatchObject({ status: "full", taken: 3, waiting: 1, who: ["Priya", "Jules", "Marco"] });
    expect((await claim(inv.code, 5, "Eli")).body.me).toMatchObject({ state: "wait", place: 2 });
  });

  it("a claim makes a player whose phone is signed in by the seat key; waitlisted people aren't players", async () => {
    const inv = await makeInvite({ seats: 1 });
    const before = (await state()).players.length;
    const r = await claim(inv.code, 1, "Priya", "Brin");
    expect(r.body.me?.tableHref).toMatch(/^\/\?game=candlefair&player=priya$/);
    expect(r.body.me?.arrivalHref).toMatch(/^\/arrive\/[A-Za-z0-9]{10}$/);
    expect(r.body.me?.address).toBe("14 Larch St");
    await claim(inv.code, 2, "Dana");
    const s = await state();
    expect(s.players.length).toBe(before + 1);
    const p = s.players.find((x) => x.name === "Priya")!;
    expect(p.character).toBe("Brin");
    expect(p.createdVia).toBe("invite");
    // The seat key is the player's key: the main app signs in with it.
    const signedIn = await handleApi(new Request(`http://x/api/view?game=${G}&player=priya`, { headers: { "x-candlefair-key": key(1) } }), store);
    expect(signedIn.status).toBe(200);
    const stranger = await handleApi(new Request(`http://x/api/view?game=${G}&player=priya`, { headers: { "x-candlefair-key": key(9) } }), store);
    expect(stranger.status).toBe(403);
  });

  it("the same phone claiming twice keeps one seat", async () => {
    const inv = await makeInvite();
    await claim(inv.code, 1, "Priya");
    const again = await claim(inv.code, 1, "Priya");
    expect(again.body.invite.taken).toBe(1);
  });

  it("refuses a name someone at the table already goes by", async () => {
    const inv = await makeInvite();
    const taken = (await state()).players.find((p) => !p.archived)!.name;
    const r = await claim(inv.code, 1, taken);
    expect(r.status).toBe(400);
    expect(r.body.code).toBe("name");
    await claim(inv.code, 2, "Priya");
    expect((await claim(inv.code, 3, "priya")).body.code).toBe("name");
  });

  it("no waitlist: a full table says so", async () => {
    const inv = await makeInvite({ seats: 1, waitlist: false });
    await claim(inv.code, 1, "Priya");
    const r = await claim(inv.code, 2, "Dana");
    expect(r.status).toBe(400);
    expect(r.body.code).toBe("full");
  });

  it("closed, past the closing time, or cancelled: no new claims", async () => {
    const inv = await makeInvite();
    await execute(store, G, DM, { type: "invite.status", inviteId: inv.id, status: "closed" });
    expect((await claim(inv.code, 1, "Priya")).body.code).toBe("closed");
    await execute(store, G, DM, { type: "invite.status", inviteId: inv.id, status: "cancelled" });
    expect((await phone("GET", inv.code, null)).body.invite.status).toBe("cancelled");
    const late = await makeInvite({ startsAt: Date.now() - 1000 });
    expect((await claim(late.code, 1, "Priya")).body.code).toBe("closed");
  });

  it("approve mode: claims wait for the DM", async () => {
    const inv = await makeInvite({ approve: true });
    const r = await claim(inv.code, 1, "Priya");
    expect(r.body.me?.state).toBe("ask");
    const e = (await state()).invites![0].entries[0];
    expect(e.playerId).toBeUndefined();
    await execute(store, G, DM, { type: "invite.entry", inviteId: inv.id, entryId: e.id, action: "ok" });
    expect((await phone("GET", inv.code, key(1))).body.me?.state).toBe("in");
  });
});

describe("giving a seat back", () => {
  it("moves the first in line up, and tidies away a player who never played", async () => {
    const inv = await makeInvite({ seats: 1 });
    await claim(inv.code, 1, "Priya");
    await claim(inv.code, 2, "Dana");
    await claim(inv.code, 3, "Eli");
    const out = await phone("POST", inv.code, key(1), { type: "drop" });
    expect(out.body.me?.state).toBe("out");
    const dana = await phone("GET", inv.code, key(2));
    expect(dana.body.me).toMatchObject({ state: "in", movedUp: true });
    expect((await phone("GET", inv.code, key(3))).body.me).toMatchObject({ state: "wait", place: 1 });
    const s = await state();
    expect(s.players.find((p) => p.name === "Priya")!.archived).toBe(true);
    expect(s.players.find((p) => p.name === "Dana")!.archived).toBe(false);
  });

  it("stops moving up by itself two hours before the start", async () => {
    const inv = await makeInvite({ seats: 1, startsAt: Date.now() + HOUR });
    await claim(inv.code, 1, "Priya");
    await claim(inv.code, 2, "Dana");
    await phone("POST", inv.code, key(1), { type: "drop" });
    expect((await phone("GET", inv.code, key(2))).body.me?.state).toBe("wait");
    const e = (await state()).invites![0].entries.find((x) => x.name === "Dana")!;
    await execute(store, G, DM, { type: "invite.entry", inviteId: inv.id, entryId: e.id, action: "in" });
    expect((await phone("GET", inv.code, key(2))).body.me).toMatchObject({ state: "in", movedUp: true });
  });

  it("the DM taking someone off moves the line up, and that phone can't claim again", async () => {
    const inv = await makeInvite({ seats: 1 });
    await claim(inv.code, 1, "Priya");
    await claim(inv.code, 2, "Dana");
    const e = (await state()).invites![0].entries[0];
    await execute(store, G, DM, { type: "invite.entry", inviteId: inv.id, entryId: e.id, action: "remove" });
    expect((await phone("GET", inv.code, key(2))).body.me?.state).toBe("in");
    expect((await claim(inv.code, 1, "Priya again")).body.code).toBe("removed");
  });

  it("more seats: the line moves up into them", async () => {
    const inv = await makeInvite({ seats: 1 });
    await claim(inv.code, 1, "Priya");
    await claim(inv.code, 2, "Dana");
    await execute(store, G, DM, { type: "invite.update", inviteId: inv.id, patch: { seats: 2 } });
    expect((await phone("GET", inv.code, key(2))).body.me?.state).toBe("in");
  });
});

describe("players who already play here", () => {
  it("claim in one tap with their saved sign-in, and a held seat is theirs", async () => {
    const s0 = await state();
    const p = s0.players.find((x) => !x.archived)!;
    // Lock the name the way a phone does.
    await execute(store, G, { role: "player", playerId: p.id }, { type: "me.lockHashed", keyHash: (await import("@/server/auth")).sha256("their-own-key") });
    const inv = await makeInvite({}, [p.id]);
    const look = await phone("GET", inv.code, key(1), undefined, { player: p.handle, pkey: "their-own-key" });
    expect(look.body.me).toMatchObject({ state: "in", held: true });
    const r = await phone("POST", inv.code, key(1), { type: "claim", name: "", character: "" }, { player: p.handle, pkey: "their-own-key" });
    expect(r.body.me?.state).toBe("in");
    expect((await state()).invites![0].entries.filter((e) => e.playerId === p.id)).toHaveLength(1);
    // A wrong key isn't them.
    const fake = await phone("GET", inv.code, key(2), undefined, { player: p.handle, pkey: "nope-nope" });
    expect(fake.body.me).toBeNull();
    expect(fake.body.known).toBeUndefined();
  });
});

describe("game night", () => {
  it("starting the session from the invite seats exactly the people with a seat", async () => {
    const inv = await makeInvite({ seats: 2 });
    await claim(inv.code, 1, "Priya");
    await claim(inv.code, 2, "Dana");
    await claim(inv.code, 3, "Eli");
    await execute(store, G, DM, { type: "session.start", inviteId: inv.id });
    const s = await state();
    const sess = s.sessions.find((x) => x.id === s.currentSessionId)!;
    const names = sess.attendeeIds.map((id) => s.players.find((p) => p.id === id)!.name).sort();
    expect(names).toEqual(["Dana", "Priya"]);
    expect(sess.title).toBe("One-shot");
    expect(s.invites![0]).toMatchObject({ sessionId: sess.id, status: "closed" });
    expect((await phone("GET", inv.code, key(3))).body.invite.status).toBe("started");
  });

  it("in a shared world, open calls are played by one standing Open table party", async () => {
    await execute(store, G, DM, { type: "party.add", name: "Second table" });
    const inv = await makeInvite({ seats: 2, title: "Friday pick-up" });
    await claim(inv.code, 1, "Priya");
    await claim(inv.code, 2, "Dana");
    // Not dropped into whoever is seated now.
    const before = await state();
    const priya = before.players.find((p) => p.name === "Priya")!.id;
    expect(before.parties!.some((x) => x.memberIds.includes(priya))).toBe(false);
    await execute(store, G, DM, { type: "session.start", inviteId: inv.id });
    const s = await state();
    const party = s.parties!.find((x) => x.id === s.partyId)!;
    expect(party).toMatchObject({ name: "Open table", openTable: true });
    expect(party.memberIds.map((id) => s.players.find((p) => p.id === id)!.name).sort()).toEqual(["Dana", "Priya"]);
    // The next open call is played by the same party, not a new one.
    await execute(store, G, DM, { type: "session.end" });
    const count = s.parties!.length;
    const inv2 = await makeInvite({ seats: 2, title: "Saturday pick-up" });
    await claim(inv2.code, 3, "Sam");
    await execute(store, G, DM, { type: "session.start", inviteId: inv2.id });
    const s2 = await state();
    expect(s2.parties!.length).toBe(count);
    expect(s2.partyId).toBe(party.id);
  });

  it("a party invite only takes that party's characters", async () => {
    const r = await execute(store, G, DM, { type: "party.add", name: "Second table" });
    const inv = await makeInvite({ partyId: r.state.parties!.find((x) => x.name === "Second table")!.id });
    const out = await claim(inv.code, 1, "Stranger");
    expect(out.body.code).toBe("party");
  });
});

describe("what goes where", () => {
  it("a wrong link is a miss and says nothing", async () => {
    const r = await phone("GET", "zzzzzzzzzz", null);
    expect(r.status).toBe(404);
    expect(r.miss).toBe(true);
  });

  it("the address only reaches seat holders, and keys reach nobody", async () => {
    const inv = await makeInvite({ seats: 1 });
    await claim(inv.code, 1, "Priya");
    await claim(inv.code, 2, "Dana");
    const anon = await phone("GET", inv.code, null);
    expect(anon.text).not.toContain("Larch");
    expect((await phone("GET", inv.code, key(2))).text).not.toContain("Larch");
    expect((await phone("GET", inv.code, key(1))).text).toContain("Larch");
    const s = await state();
    const hash = s.invites![0].entries[0].keyHash!;
    expect(JSON.stringify(projectDm(s, 1, []))).not.toContain(hash);
    expect(JSON.stringify(projectTv(s, 1))).not.toContain(inv.code);
    const p = s.players.find((x) => x.name === "Priya")!;
    const pv = JSON.stringify(projectPlayer(s, 1, p.id, []));
    expect(pv).not.toContain(inv.code);
    expect(pv).not.toContain("Larch");
  });

  it("the calendar file has the start, the place and a reminder the day before", async () => {
    const inv = await makeInvite();
    const v = (await phone("GET", inv.code, null)).body.invite;
    const ics = calendarFile(v, "https://x/i/abc", "Sam's place", 0);
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("TRIGGER:-P1D");
    expect(ics).toContain("LOCATION:Sam's place");
  });
});

describe("the DM's tools", () => {
  it("duplicate for next week keeps held seats only", async () => {
    const p = (await state()).players.find((x) => !x.archived)!;
    const inv = await makeInvite({}, [p.id]);
    await claim(inv.code, 1, "Priya");
    await execute(store, G, DM, { type: "invite.duplicate", inviteId: inv.id, date: "2030-01-12", time: "18:30", startsAt: Date.now() + 200 * HOUR });
    const s = await state();
    const copy = s.invites![1];
    expect(copy.code).not.toBe(inv.code);
    expect(copy.entries.map((e) => e.playerId)).toEqual([p.id]);
    expect(copy.date).toBe("2030-01-12");
  });

  it("deleting an invite tidies away the players it made who never played", async () => {
    const inv = await makeInvite();
    await claim(inv.code, 1, "Priya");
    await execute(store, G, DM, { type: "invite.remove", inviteId: inv.id });
    const s = await state();
    expect(s.invites).toHaveLength(0);
    expect(s.players.find((p) => p.name === "Priya")!.archived).toBe(true);
  });
});
