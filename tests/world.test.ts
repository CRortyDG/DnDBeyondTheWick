// The shared world: several parties in one campaign. What a character learns
// stays with that character in every party; the TV shows only what everyone
// at the table knows; phones show their own character's knowledge.
import { beforeEach, describe, expect, it } from "vitest";
import type { Command } from "@/shared/commands";
import { projectPlayer, projectTv } from "@/shared/projection";
import { apply, CommandError, nextSessionNumber, type Ctx } from "@/shared/reducer";
import { seedGame } from "@/shared/seed";
import type { Actor, GameState } from "@/shared/types";
import { hydrate } from "@/server/store";
import { presentIds } from "@/shared/world";
import { projectChronicle } from "@/shared/chronicle";
import { fogLayout } from "@/shared/fog";
import { projectArrival, projectTable } from "@/shared/arrival";

const DM: Actor = { role: "dm" };
const as = (id: string): Actor => ({ role: "player", playerId: id });

let g: GameState;
let now = 1000;

let tokens = 0;
function run(actor: Actor, cmd: Command) {
  const r = apply(g, cmd, { now: ++now, actor, token: () => `token${String(++tokens).padStart(4, "0")}` } as Ctx);
  g = r.state;
  return r;
}
const dm = (cmd: Command) => run(DM, cmd);
function fails(actor: Actor, cmd: Command): string {
  try {
    run(actor, cmd);
  } catch (e) {
    if (e instanceof CommandError) return e.message;
    throw e;
  }
  throw new Error("expected the command to fail");
}
const ent = (id: string) => g.entries!.find((n) => n.id === id)!;
const phone = (pid: string) => projectPlayer(g, 1, pid, []);
const onPhone = (pid: string, entryId: string) => phone(pid).entries.find((e) => e.id === entryId);
const tv = () => projectTv(g, 1);

/** p1 (Brin) plays in both; A = p1, p2; B = p1, p3, p4. */
let A = "";
let B = "";
function twoParties() {
  dm({ type: "party.add", name: "The Sons", firstName: "The Friends" });
  A = g.parties![0].id;
  B = g.parties![1].id;
  // Everyone started in A; move p3 and p4 to B, and Brin (p1) into B as well.
  dm({ type: "party.member", partyId: A, playerId: "p3", member: false });
  dm({ type: "party.member", partyId: A, playerId: "p4", member: false });
  for (const p of ["p1", "p3", "p4"]) dm({ type: "party.member", partyId: B, playerId: p, member: true, catchUp: false });
}

beforeEach(() => {
  g = hydrate(seedGame("t"))!;
  now = 1000;
});

describe("making parties", () => {
  it("is invisible with one table: nothing changes until a second party exists", () => {
    expect(g.world).toBeUndefined();
    expect(tv().world).toBeUndefined();
    expect(phone("p1").world).toBeUndefined();
  });

  it("the first new party turns the campaign into a world, with everyone so far in the first party", () => {
    dm({ type: "party.add", name: "The Sons", firstName: "The Friends" });
    expect(g.world).toBeDefined();
    expect(g.parties!.map((p) => p.name)).toEqual(["The Friends", "The Sons"]);
    expect(g.parties![0].memberIds).toEqual(["p1", "p2", "p3", "p4"]);
    expect(g.partyId).toBe(g.parties![0].id);
    // Everything found so far is known to every character.
    expect(ent("e-mags").knownBy).toEqual({ p1: "found", p2: "found", p3: "found", p4: "found" });
    expect(tv().world!.parties.map((p) => p.name)).toEqual(["The Friends"]);
  });

  it("seating a party puts its members at the table and everyone else away", () => {
    twoParties();
    dm({ type: "party.play", partyId: B });
    expect(presentIds(g).sort()).toEqual(["p1", "p3", "p4"]);
    expect(fails(DM, { type: "party.add", name: "the sons" })).toMatch(/already a party/);
  });

  it("counts chapters per party", () => {
    twoParties();
    dm({ type: "session.start", partyId: A });
    dm({ type: "session.end" });
    dm({ type: "session.start", partyId: A });
    dm({ type: "session.end" });
    dm({ type: "session.start", partyId: B });
    expect(g.sessions.at(-1)!.number).toBe(1);
    expect(g.sessions.at(-1)!.partyId).toBe(B);
    dm({ type: "session.end" });
    dm({ type: "party.play", partyId: A });
    expect(nextSessionNumber(g)).toBe(3);
  });
});

describe("what a character knows follows them", () => {
  it("someone met with party B stays known to Brin back in party A, and only to him", () => {
    twoParties();
    dm({ type: "party.play", partyId: B });
    dm({ type: "session.start" });
    dm({ type: "entry.stage", entryId: "e-bolla", stage: "found", announce: true });
    dm({ type: "session.end" });
    expect(ent("e-bolla").knownBy).toEqual({ p1: "found", p3: "found", p4: "found" });

    dm({ type: "party.play", partyId: A });
    // The table (Brin + p2) doesn't all know her: hidden for the TV and the DM's table view.
    expect(ent("e-bolla").stage).toBe("hidden");
    expect(JSON.stringify(tv())).not.toContain("Bolla");
    // Brin's phone has her; p2's doesn't.
    expect(onPhone("p1", "e-bolla")?.name).toBe("Bolla");
    expect(onPhone("p2", "e-bolla")).toBeUndefined();
    expect(JSON.stringify(phone("p2"))).not.toContain("Bolla");
  });

  it("meeting her again with party A plays the reveal for the table, and Brin keeps his own", () => {
    twoParties();
    dm({ type: "party.play", partyId: B });
    dm({ type: "entry.stage", entryId: "e-bolla", stage: "known", announce: false });
    dm({ type: "party.play", partyId: A });
    dm({ type: "entry.stage", entryId: "e-bolla", stage: "found", announce: true });
    expect(ent("e-bolla").stage).toBe("found");
    expect(ent("e-bolla").knownBy!.p1).toBe("known");
    expect(ent("e-bolla").knownBy!.p2).toBe("found");
    expect(tv().discovery?.name).toBe("Bolla");
  });

  it("facts stay with whoever learned them", () => {
    twoParties();
    dm({ type: "party.play", partyId: B });
    const f = ent("e-mags").facts[0];
    dm({ type: "entry.factReveal", entryId: "e-mags", factId: f.id, revealed: true });
    dm({ type: "party.play", partyId: A });
    expect(ent("e-mags").facts[0].revealedAt).toBeUndefined();
    expect(onPhone("p1", "e-mags")!.facts.map((x) => x.text)).toContain(f.text);
    expect(onPhone("p2", "e-mags")!.facts.map((x) => x.text)).not.toContain(f.text);
    expect(JSON.stringify(tv())).not.toContain(f.text);
  });

  it("map pins: the TV shows only what everyone present has found; each phone its own", () => {
    twoParties();
    const map = g.scenes.find((x) => x.id === "s-map")!;
    const hidden = map.map!.pins.find((p) => !p.discovered)!;
    dm({ type: "party.play", partyId: B });
    dm({ type: "pin.discover", sceneId: "s-map", pinId: hidden.id, discovered: true, announce: false });
    dm({ type: "party.play", partyId: A });
    dm({ type: "scene.show", sceneId: "s-map" });
    const tvPins = () => tv().scenes.find((x) => x.id === "s-map")!.map!.pins.map((p) => p.id);
    expect(tvPins()).not.toContain(hidden.id);
    // Brin's phone shows the pin on his own maps; p2's doesn't.
    const known = (pid: string) => [...(phone(pid).map ? [phone(pid).map!] : []), ...phone(pid).maps].find((m) => m.sceneId === "s-map")!.map.pins.map((p) => p.id);
    expect(known("p1")).toContain(hidden.id);
    expect(known("p2")).not.toContain(hidden.id);
  });

  it("Brin can tell the table: the others hear of it, and the TV follows once everyone knows", () => {
    twoParties();
    dm({ type: "party.play", partyId: B });
    dm({ type: "entry.stage", entryId: "e-bolla", stage: "found", announce: false });
    dm({ type: "party.play", partyId: A });
    const r = dm({ type: "entry.tell", entryId: "e-bolla", playerId: "p1", stage: "rumored" });
    expect(r.info).toMatch(/Told 1 person/);
    expect(ent("e-bolla").knownBy!.p2).toBe("rumored");
    expect(ent("e-bolla").knownBy!.p1).toBe("found");
    expect(ent("e-bolla").stage).toBe("rumored");
    expect(onPhone("p2", "e-bolla")?.stage).toBe("rumored");
    // Nobody can tell what they don't know.
    expect(dm({ type: "entry.tell", entryId: "e-merchant", playerId: "p1", stage: "found" }).info).toMatch(/doesn't know/);
  });

  it("a new member catches up on what everyone in the party already knows", () => {
    twoParties();
    dm({ type: "party.play", partyId: B });
    dm({ type: "entry.stage", entryId: "e-bolla", stage: "found", announce: false });
    dm({ type: "party.member", partyId: B, playerId: "p2", member: true });
    expect(ent("e-bolla").knownBy!.p2).toBe("found");
  });

  it("a new player joining a running table joins that party and doesn't blank the TV", () => {
    twoParties();
    dm({ type: "party.play", partyId: A });
    const before = ent("e-mags").stage;
    dm({ type: "player.add", name: "Newcomer" });
    const id = g.players.at(-1)!.id;
    expect(g.parties![0].memberIds).toContain(id);
    expect(ent("e-mags").stage).toBe(before);
  });

  it("a phone's own request uses what that character knows (a shop only they found)", () => {
    twoParties();
    const sh = g.shops.find((x) => x.visibility === "hidden");
    if (!sh) return;
    const it = g.items.find((x) => x.shopId === sh.id && x.tier === "sale" && x.kind === "purchase");
    if (!it) return;
    dm({ type: "party.play", partyId: B });
    dm({ type: "shop.visibility", shopId: sh.id, visibility: "all" });
    dm({ type: "money.adjust", playerId: "p1", amountCp: 1_000_000, note: "test" } as Command);
    dm({ type: "party.play", partyId: A });
    expect(g.shops.find((x) => x.id === sh.id)!.visibility).toBe("hidden");
    expect(fails(as("p2"), { type: "me.requestBuy", itemId: it.id, qty: 1, note: "" })).toMatch(/isn't available/);
    run(as("p1"), { type: "me.requestBuy", itemId: it.id, qty: 1, note: "" });
    expect(g.requests.at(-1)!.itemId).toBe(it.id);
    // The table is put back afterwards.
    expect(g.shops.find((x) => x.id === sh.id)!.visibility).toBe("hidden");
  });
});

describe("party things", () => {
  it("Renown is each character's; the table uses the best present", () => {
    twoParties();
    dm({ type: "party.play", partyId: B });
    dm({ type: "renown.set", rank: 2, tv: false });
    expect(g.players.find((p) => p.id === "p3")!.renown).toBe(2);
    dm({ type: "party.play", partyId: A });
    // Brin (p1) earned it with B, so party A's table has it too; p2 alone wouldn't.
    expect(g.renown).toBe(2);
    expect(phone("p2").renown.rank).toBe(2);
    dm({ type: "player.update", playerId: "p1", patch: { away: true } });
    expect(g.renown).toBe(0);
  });

  it("Renown points are each character's too, and follow the table's best rank", () => {
    twoParties();
    dm({ type: "party.play", partyId: B });
    dm({ type: "renown.points", amount: 5, reason: "Saved the sons", tv: false });
    expect(g.renown).toBe(1);
    expect(g.renownPoints).toBe(5);
    expect(g.players.find((p) => p.id === "p3")!.renownPoints).toBe(5);
    expect(g.renownLog!.at(-1)).toMatchObject({ partyId: B, amount: 5 });
    dm({ type: "party.play", partyId: A });
    // Brin (p1) is in both parties, so party A's table starts from Brin's points.
    expect(g.renownPoints).toBe(5);
    dm({ type: "player.update", playerId: "p1", patch: { away: true } });
    expect(g.renown).toBe(0);
    expect(g.renownPoints).toBe(0);
    dm({ type: "renown.points", amount: 2, tv: false });
    expect(g.players.find((p) => p.id === "p2")!.renownPoints).toBe(2);
    expect(g.players.find((p) => p.id === "p1")!.renownPoints).toBe(5); // away: unchanged
    dm({ type: "renown.progress", on: true });
    expect(phone("p1").renown.progress).toMatchObject({ points: 5 });
    expect(phone("p2").renown.progress).toMatchObject({ points: 2 });
  });

  it("leads and votes belong to the party at the table", () => {
    twoParties();
    dm({ type: "party.play", partyId: A });
    dm({ type: "lead.add", text: "Who stole the bell?" });
    dm({ type: "party.play", partyId: B });
    dm({ type: "lead.add", text: "The sons' secret" });
    expect(tv().leads.leads.map((l) => l.text)).toEqual(["The sons' secret"]);
    expect(phone("p2").leads.leads.map((l) => l.text)).toEqual(["Who stole the bell?"]);
    expect(phone("p1").leads.leads.map((l) => l.text).sort()).toEqual(["The sons' secret", "Who stole the bell?"]);
  });

  it("each party keeps its own Chronicle; Brin reads both", () => {
    twoParties();
    dm({ type: "session.start", partyId: A });
    dm({ type: "note.add", text: "Friends night" });
    dm({ type: "session.end" });
    dm({ type: "session.start", partyId: B });
    dm({ type: "note.add", text: "Sons night" });
    const texts = (pid: string) => phone(pid).chronicle.notes.map((n) => n.text).join("|");
    expect(texts("p2")).toContain("Friends night");
    expect(texts("p2")).not.toContain("Sons night");
    expect(texts("p1")).toContain("Friends night");
    expect(texts("p1")).toContain("Sons night");
    // The DM sees every chapter, labelled with its party.
    expect(projectChronicle(g, { dm: true }).chapters.map((c) => c.party)).toContain("The Sons");
  });

  it("each party keeps its own fog on a map", () => {
    twoParties();
    dm({ type: "party.play", partyId: A });
    const ART = "/api/files/t/aaaaaaaaaaaaaaaaaaaaaaaa.png";
    dm({ type: "scene.update", sceneId: "s-map", patch: { art: { url: ART } } });
    dm({ type: "map.grid", sceneId: "s-map", grid: { snap: true, lines: false, cell: 0.1, ox: 0, oy: 0, aspect: 1 } });
    const tile = (i: number) => `/api/files/t/${i.toString(16).padStart(24, "0")}.webp`;
    dm({ type: "fog.setup", sceneId: "s-map", layout: fogLayout({ snap: true, lines: false, cell: 0.1, ox: 0, oy: 0, aspect: 1 }, 1), tiles: { cols: 4, rows: 4, urls: Array.from({ length: 16 }, (_, i) => tile(i)), src: ART } });
    dm({ type: "fog.all", sceneId: "s-map", clear: true } as Command);
    const clearA = g.scenes.find((x) => x.id === "s-map")!.map!.fog!.bits;
    dm({ type: "party.play", partyId: B });
    expect(g.scenes.find((x) => x.id === "s-map")!.map!.fog!.bits).not.toBe(clearA);
    dm({ type: "party.play", partyId: A });
    expect(g.scenes.find((x) => x.id === "s-map")!.map!.fog!.bits).toBe(clearA);
  });
});

describe("the shared board", () => {
  const GP = 100;
  it("a job a party takes says so for every party", () => {
    twoParties();
    dm({ type: "party.play", partyId: B });
    dm({ type: "job.add", job: { title: "Clear the well", postedBy: "Artum", body: "", reward: { kind: "total", cp: 10 * GP }, renown: 0, style: "bill" }, pin: true });
    const j = g.jobs!.at(-1)!;
    dm({ type: "job.update", jobId: j.id, patch: { status: "taken" } });
    dm({ type: "party.play", partyId: A });
    const seen = phone("p2").jobs.find((x) => x.id === j.id)!;
    expect(seen.status).toBe("taken");
    expect(seen.party).toBe("The Sons");
    expect(seen.canTake).toBe(false);
  });

  it("a job for some parties only stays off the others' boards", () => {
    twoParties();
    dm({ type: "job.add", job: { title: "Sons only", postedBy: "", body: "", reward: { kind: "hidden", cp: 0 }, renown: 0, style: "bill", parties: [B] }, pin: true });
    const j = g.jobs!.at(-1)!;
    dm({ type: "party.play", partyId: A });
    expect(tv().jobs.map((x) => x.id)).not.toContain(j.id);
    expect(phone("p2").jobs.map((x) => x.id)).not.toContain(j.id);
    expect(phone("p1").jobs.map((x) => x.id)).toContain(j.id);
  });

  it("a player's flyer can carry their own gold as the reward, paid to whoever answers it", () => {
    twoParties();
    dm({ type: "party.play", partyId: B });
    // Only those at the table find a shop opened now: party B.
    dm({ type: "shop.visibility", shopId: "candle", visibility: "all", quiet: true });
    dm({ type: "money.adjust", playerId: "p3", amountCp: 30 * GP, note: "" });
    run(as("p3"), { type: "me.requestBuy", itemId: "c-flyer", qty: 1, note: "", flyer: { title: "Find my dog", body: "", signedBy: "" }, rewardCp: 20 * GP });
    expect(phone("p3").me.heldCp).toBeGreaterThanOrEqual(20 * GP);
    dm({ type: "request.approve", requestId: g.requests.at(-1)!.id });
    const f = g.flyers.at(-1)!;
    expect(f.rewardCp).toBe(20 * GP);
    expect(f.partyId).toBe(B);
    dm({ type: "party.play", partyId: A });
    expect(tv().flyers.find((x) => x.id === f.id)).toMatchObject({ rewardCp: 20 * GP, party: "The Sons" });
    const before = g.players.find((p) => p.id === "p2")!.balanceCp;
    dm({ type: "flyer.reward", flyerId: f.id, to: "players", playerIds: ["p1", "p2"] });
    expect(g.players.find((p) => p.id === "p2")!.balanceCp).toBe(before + 10 * GP);
    expect(fails(DM, { type: "flyer.reward", flyerId: f.id, to: "poster" })).toMatch(/no reward/);
    expect(g.notes!.some((n) => n.world && n.text.includes("answered"))).toBe(true);
  });

  it("taking down a flyer with gold still held gives it back", () => {
    dm({ type: "shop.visibility", shopId: "candle", visibility: "all", quiet: true });
    dm({ type: "money.adjust", playerId: "p1", amountCp: 30 * GP, note: "" });
    run(as("p1"), { type: "me.requestBuy", itemId: "c-flyer", qty: 1, note: "", flyer: { title: "Help", body: "", signedBy: "" }, rewardCp: 5 * GP });
    dm({ type: "request.approve", requestId: g.requests.at(-1)!.id });
    const after = g.players.find((p) => p.id === "p1")!.balanceCp;
    dm({ type: "flyer.remove", flyerId: g.flyers.at(-1)!.id });
    expect(g.players.find((p) => p.id === "p1")!.balanceCp).toBe(after + 5 * GP);
  });
});

describe("the world clock", () => {
  it("events begin for every party as the DM moves the date on", () => {
    twoParties();
    dm({ type: "world.date", date: "2026-11-20" });
    dm({ type: "world.eventAdd", event: { name: "Winterfest", from: "2026-12-01", to: "2026-12-21", note: "The whole town lights candles." } });
    expect(tv().world).toMatchObject({ date: "2026-11-20", next: { name: "Winterfest", inDays: 11 } });
    dm({ type: "world.date", date: "2026-12-02" });
    expect(tv().world!.now.map((e) => e.name)).toEqual(["Winterfest"]);
    expect(tv().world!.news?.text).toMatch(/Winterfest begins/);
    // Both parties' Chronicles carry the news.
    expect(phone("p2").chronicle.notes.some((n) => n.text.includes("Winterfest begins"))).toBe(true);
    expect(phone("p3").chronicle.notes.some((n) => n.text.includes("Winterfest begins"))).toBe(true);
    expect(fails(DM, { type: "world.eventAdd", event: { name: "Bad", from: "2026-12-05", to: "2026-12-01", note: "" } })).toMatch(/ends before/);
  });
});

describe("the Table on the TV", () => {
  it("shows tonight's party (and its guests), following the seated party", () => {
    twoParties();
    dm({ type: "arrival.issueLinks" });
    const ids = (seats: { name: string | null }[]) => seats.length;
    dm({ type: "party.play", partyId: A });
    expect(ids(projectTable(g).seats)).toBe(2);
    expect(projectTable(g).qr.map((q) => q.name).sort()).toEqual(["p1", "p2"].map((id) => g.players.find((p) => p.id === id)!.name).sort());
    dm({ type: "party.play", partyId: B });
    expect(ids(projectTable(g).seats)).toBe(3);
    expect(projectTable(g).qr.map((q) => q.name)).not.toContain(g.players.find((p) => p.id === "p2")!.name);
  });

  it("a phone's seat page shows its own table: tonight's if here, its party's if not", () => {
    twoParties();
    dm({ type: "arrival.issueLinks" });
    dm({ type: "party.play", partyId: B });
    const tok = (id: string) => g.players.find((p) => p.id === id)!.arrival!.token;
    expect(projectArrival(g, 1, tok("p3")).seats).toHaveLength(3);
    // p2 is in A only and away tonight: sees A's two seats, with their own.
    const away = projectArrival(g, 1, tok("p2")).seats;
    expect(away).toHaveLength(2);
    expect(away.some((x) => x.me)).toBe(true);
  });

  it("without parties, every seat shows", () => {
    dm({ type: "arrival.issueLinks" });
    expect(projectTable(g).seats).toHaveLength(g.players.filter((p) => !p.archived).length);
  });
});
