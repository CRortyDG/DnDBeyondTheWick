// Renown (one party rank the DM sets) and the bounty board of job flyers.
import { beforeEach, describe, expect, it } from "vitest";
import type { Command } from "@/shared/commands";
import { GP } from "@/shared/money";
import { upgrade } from "@/shared/migrate";
import { projectPlayer, projectTv } from "@/shared/projection";
import { apply, CommandError, type Ctx } from "@/shared/reducer";
import { BOARD_SLOTS, defaultPayout, FAMOUS, HEROES, KNOWN, payoutPlayers, TRUSTED } from "@/shared/renown";
import { SEED_ITEMS, SEED_JOBS, seedGame } from "@/shared/seed";
import type { Actor, GameState, LedgerEntry } from "@/shared/types";
import { hydrate } from "@/server/store";

const DM: Actor = { role: "dm" };
const P = (n: number): Actor => ({ role: "player", playerId: `p${n}` });

let g: GameState;
let ledger: LedgerEntry[];
let now = 1000;

function as(actor: Actor, cmd: Command) {
  const r = apply(g, cmd, { now: ++now, actor } as Ctx);
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
const open = (...shopIds: string[]) => shopIds.forEach((shopId) => dm({ type: "shop.visibility", shopId, visibility: "all", quiet: true }));
const tvItem = (id: string) => projectTv(g, 1).items.find((i) => i.id === id);
const pin = (jobId: string) => dm({ type: "job.pin", jobId, pinned: true });
const job = (id: string) => g.jobs!.find((j) => j.id === id)!;
const lastPending = () => g.requests.filter((r) => r.status === "pending").at(-1)!;

beforeEach(() => {
  g = seedGame("t");
  ledger = [];
});

describe("Renown", () => {
  it("starts as Strangers and shows on phones and the TV", () => {
    expect(projectTv(g, 1).renown).toEqual({ rank: 0, name: "Strangers", meaning: "Fresh off the boat" });
    expect(projectPlayer(g, 1, "p1", []).renown.name).toBe("Strangers");
  });

  it("converts the seed locks to Renown locks", () => {
    const need = (id: string) => SEED_ITEMS.find((i) => i.id === id)!.renown;
    expect(need("c-tab")).toBe(KNOWN);
    expect(need("c-backroom")).toBe(KNOWN);
    expect(need("g-house")).toBe(TRUSTED);
    expect(need("g-hall")).toBe(HEROES);
    expect(need("g-citizens")).toBe(HEROES);
    expect(need("i41")).toBe(HEROES);
    expect(need("d-ship")).toBe(FAMOUS);
    // The house's level text is gone: the rank says it now.
    expect(SEED_ITEMS.find((i) => i.id === "g-house")!.reason).toBe("");
  });

  it("unlocks an item the moment the party reaches its rank, and not before", () => {
    open("general", "candle");
    dm({ type: "money.adjust", playerId: "p1", amountCp: 2000 * GP, note: "" });
    expect(tvItem("c-backroom")).toMatchObject({ tier: "locked", needs: "Known in town", reason: "Mags only rents it to people she trusts." });
    expect(fails(P(1), { type: "me.requestBuy", itemId: "c-backroom", qty: 1, note: "" })).toMatch(/Known in town/);
    expect(fails(DM, { type: "money.buy", playerId: "p1", itemId: "c-backroom" })).toMatch(/Known in town/);

    dm({ type: "renown.set", rank: KNOWN });
    expect(tvItem("c-backroom")).toMatchObject({ tier: "sale" });
    expect(tvItem("c-backroom")!.needs).toBeUndefined();
    as(P(1), { type: "me.requestBuy", itemId: "c-backroom", qty: 1, note: "" });
    // One rank isn't enough for the house.
    expect(tvItem("g-house")).toMatchObject({ tier: "locked", needs: "Trusted" });
    expect(fails(P(1), { type: "me.requestBuy", itemId: "g-house", qty: 1, note: "" })).toMatch(/Trusted/);
    dm({ type: "renown.set", rank: TRUSTED });
    as(P(1), { type: "me.requestBuy", itemId: "g-house", qty: 1, note: "" });
  });

  it("re-checks the rank when the DM approves", () => {
    open("candle");
    dm({ type: "money.adjust", playerId: "p1", amountCp: 50 * GP, note: "" });
    dm({ type: "renown.set", rank: KNOWN });
    as(P(1), { type: "me.requestBuy", itemId: "c-backroom", qty: 1, note: "" });
    dm({ type: "renown.set", rank: 0 });
    expect(fails(DM, { type: "request.approve", requestId: lastPending().id })).toMatch(/Known in town/);
  });

  it("is a moment when it goes up: TV banner, the Chronicle, and what opened", () => {
    open("candle");
    const r = dm({ type: "renown.set", rank: KNOWN });
    expect(g.banner?.text).toContain("Candlefair knows your names");
    expect(g.banner?.text).toContain("Open a tab");
    expect(projectTv(g, 1).renownMoment).toMatchObject({ rank: KNOWN, name: "Known in town" });
    expect(g.notes!.at(-1)!.text).toMatch(/Known in town/);
    expect(r.ledger).toEqual([]);
  });

  it("goes down quietly, and things lock again", () => {
    open("candle");
    dm({ type: "renown.set", rank: KNOWN });
    const banner = g.banner;
    const notes = g.notes!.length;
    dm({ type: "renown.set", rank: 0 });
    expect(g.banner).toEqual(banner);
    expect(g.notes!.length).toBe(notes);
    expect(tvItem("c-tab")).toMatchObject({ tier: "locked", needs: "Known in town" });
  });

  it("can lock a storefront: name and rank only, no goods", () => {
    open("docks");
    dm({ type: "shop.update", shopId: "docks", patch: { renown: TRUSTED } });
    const tv = projectTv(g, 1);
    expect(tv.shops.find((s) => s.id === "docks")).toMatchObject({ name: "The Docks", needs: "Trusted" });
    expect(tv.items.some((i) => i.shopId === "docks")).toBe(false);
    dm({ type: "money.adjust", playerId: "p1", amountCp: 100 * GP, note: "" });
    expect(fails(P(1), { type: "me.requestBuy", itemId: "i34", qty: 1, note: "" })).toMatch(/isn't open/);
    dm({ type: "renown.set", rank: TRUSTED });
    expect(g.banner?.text).toContain("Now open: The Docks");
    expect(projectTv(g, 1).items.some((i) => i.shopId === "docks")).toBe(true);
  });
});

describe("the bounty board", () => {
  it("starts with the three seed flyers, none pinned", () => {
    expect(g.jobs!.map((j) => j.id)).toEqual(SEED_JOBS.map((j) => j.id));
    expect(g.jobs!.every((j) => !j.pinned && j.status === "open")).toBe(true);
    expect(projectTv(g, 1).jobs).toEqual([]);
    expect(projectPlayer(g, 1, "p1", []).jobs).toEqual([]);
  });

  it("shows flyers above the party's renown, but they can't be taken", () => {
    pin("j-sheep");
    const tv = projectTv(g, 1).jobs[0];
    expect(tv).toMatchObject({ title: "Wanted: whatever’s taking sheep on the Trollbark road", needs: "Known in town", reward: { kind: "total", cp: 500 * GP } });
    const mine = projectPlayer(g, 1, "p1", []).jobs[0];
    expect(mine).toMatchObject({ canTake: false, needs: "Known in town" });
    expect(fails(P(1), { type: "me.takeJob", jobId: "j-sheep", note: "" })).toMatch(/experienced parties only/);
    dm({ type: "renown.set", rank: KNOWN });
    expect(projectPlayer(g, 1, "p1", []).jobs[0]).toMatchObject({ canTake: true });
    expect(projectPlayer(g, 1, "p1", []).jobs[0].needs).toBeUndefined();
    as(P(1), { type: "me.takeJob", jobId: "j-sheep", note: "" });
  });

  it("only offers jobs that are pinned", () => {
    expect(fails(P(1), { type: "me.takeJob", jobId: "j-ransom", note: "" })).toMatch(/isn't on the board/);
  });

  it("takes a job through the DM's inbox; the first approved wins", () => {
    pin("j-ransom");
    as(P(1), { type: "me.takeJob", jobId: "j-ransom", note: "We'll go" });
    expect(fails(P(1), { type: "me.takeJob", jobId: "j-ransom", note: "" })).toMatch(/already asked/);
    as(P(2), { type: "me.takeJob", jobId: "j-ransom", note: "" });
    expect(projectPlayer(g, 1, "p1", []).jobs[0]).toMatchObject({ asked: true });
    // Taking a job holds no gold.
    expect(g.requests.every((r) => r.totalCp === 0)).toBe(true);
    dm({ type: "request.approveAll" });
    expect(job("j-ransom").status).toBe("open"); // jobs need a decision
    const first = g.requests.find((r) => r.playerId === "p1")!;
    dm({ type: "request.approve", requestId: first.id });
    expect(job("j-ransom")).toMatchObject({ status: "taken", takenBy: ["p1"] });
    expect(g.requests.find((r) => r.playerId === "p2")).toMatchObject({ status: "declined" });
    expect(projectTv(g, 1).jobs[0].status).toBe("taken");
    expect(projectPlayer(g, 1, "p2", []).jobs[0]).toMatchObject({ canTake: false, takenBy: "Player 1" });
    expect(g.banner?.text).toContain("Player 1 took the job");
  });

  it("pays out once, through the ledger, per player by default", () => {
    pin("j-ransom");
    dm({ type: "session.start" });
    const ids = payoutPlayers(g);
    expect(ids).toEqual(["p1", "p2", "p3", "p4"]);
    const payouts = defaultPayout(job("j-ransom"), ids);
    expect(payouts.every((x) => x.cp === 50 * GP)).toBe(true);
    dm({ type: "job.done", jobId: "j-ransom", payouts });
    expect(ids.map(bal)).toEqual([50 * GP, 50 * GP, 50 * GP, 50 * GP]);
    expect(ledger.filter((l) => l.kind === "bounty")).toHaveLength(4);
    expect(job("j-ransom")).toMatchObject({ status: "done", paidCp: 200 * GP });
    expect(fails(DM, { type: "job.done", jobId: "j-ransom", payouts })).toMatch(/already done/);
    expect(ledger.filter((l) => l.kind === "bounty")).toHaveLength(4);
    expect(fails(DM, { type: "job.update", jobId: "j-ransom", patch: { status: "open" } })).toMatch(/done and paid/);
    expect(g.notes!.at(-1)!.text).toBe("Job done: My brother is being held for ransom. Paid 50 gp each.");
    expect(projectTv(g, 1).jobs[0].status).toBe("done");
  });

  it("splits a party total evenly, and a hidden reward pays what the DM types", () => {
    expect(defaultPayout({ reward: { kind: "total", cp: 500 * GP } }, ["a", "b", "c"]).map((x) => x.cp)).toEqual([16667, 16667, 16666]);
    expect(defaultPayout({ reward: { kind: "hidden", cp: 0 } }, ["a", "b"]).map((x) => x.cp)).toEqual([0, 0]);
    pin("j-envelope");
    dm({ type: "job.done", jobId: "j-envelope", payouts: [{ playerId: "p2", cp: 300 * GP }, { playerId: "p3", cp: 0 }] });
    expect([bal("p2"), bal("p3")]).toEqual([300 * GP, 0]);
  });

  it("keeps a done flyer up through the next session, then takes it down", () => {
    pin("j-ransom");
    dm({ type: "session.start" });
    dm({ type: "job.done", jobId: "j-ransom", payouts: [] });
    dm({ type: "session.end" });
    expect(job("j-ransom").pinned).toBe(true);
    dm({ type: "session.start" });
    expect(job("j-ransom").pinned).toBe(true);
    dm({ type: "session.end" });
    expect(job("j-ransom").pinned).toBe(false);
  });

  it("pulls a flyer, and a follow-up takes its place on the board", () => {
    pin("j-sheep");
    const r = dm({ type: "job.add", followUpOf: "j-sheep", job: { title: "Still missing: sheep", postedBy: "The council", body: "Now it's cows too.", reward: { kind: "total", cp: 800 * GP }, renown: KNOWN, style: "official" } });
    expect(job("j-sheep")).toMatchObject({ status: "expired", pinned: false });
    expect(job(r.jobId!)).toMatchObject({ pinned: true, followUpOf: "j-sheep" });
    expect(projectTv(g, 1).jobs.map((j) => j.title)).toEqual(["Still missing: sheep"]);
    dm({ type: "job.expire", jobId: r.jobId! });
    expect(projectTv(g, 1).jobs).toEqual([]);
    expect(fails(DM, { type: "job.pin", jobId: r.jobId!, pinned: true })).toMatch(/pulled/);
  });

  it("holds at most eight flyers, jobs and player flyers together", () => {
    for (let i = 0; i < BOARD_SLOTS - 1; i++) dm({ type: "job.add", job: { title: `Job ${i}` }, pin: true });
    // A player flyer takes the last slot.
    open("candle");
    dm({ type: "money.adjust", playerId: "p1", amountCp: 1 * GP, note: "" });
    as(P(1), { type: "me.requestBuy", itemId: "c-flyer", qty: 1, note: "", flyer: { title: "Lost cat", body: "", signedBy: "" } });
    dm({ type: "request.approve", requestId: lastPending().id });
    expect(g.flyers[0].up).toBe(true);
    expect(fails(DM, { type: "job.pin", jobId: "j-ransom", pinned: true })).toMatch(/board is full/);
    // The next flyer is approved, but waits unpinned.
    as(P(1), { type: "me.requestBuy", itemId: "c-flyer", qty: 1, note: "", flyer: { title: "Found: a hat", body: "", signedBy: "" } });
    const r = dm({ type: "request.approve", requestId: lastPending().id });
    expect(g.flyers[1].up).toBe(false);
    expect(r.info).toMatch(/not pinned/);
    expect(fails(DM, { type: "flyer.update", flyerId: g.flyers[1].id, patch: { up: true } })).toMatch(/board is full/);
    const tv = projectTv(g, 1);
    expect(tv.jobs.length + tv.flyers.length).toBe(BOARD_SLOTS);
  });

  it("never sends a flyer's DM-only fields to any player or the TV", () => {
    g = hydrate(g)!; // the server fills in the starter jobs' notes
    expect(job("j-ransom").dm.twists).toContain("Mardon Rueh");
    for (const j of SEED_JOBS) pin(j.id);
    dm({ type: "renown.set", rank: FAMOUS });
    dm({ type: "job.update", jobId: "j-envelope", patch: { title: "SECRET-TITLE", postedBy: "SECRET-PATRON", body: "SECRET-BODY", dm: { notes: "SECRET-NOTES" } } });
    dm({ type: "job.update", jobId: "j-sheep", patch: { dm: { adventure: "SECRET-ADVENTURE", loot: "SECRET-LOOT", twists: "SECRET-TWIST" } } });
    as(P(1), { type: "me.takeJob", jobId: "j-envelope", note: "" });
    const out = JSON.stringify([projectTv(g, 1), projectPlayer(g, 1, "p1", ledger), projectPlayer(g, 1, "p2", ledger)]);
    for (const secret of ["SECRET-", "Robber Baron", "Mardon Rueh", "Spell Scroll", "patron", "Placeholder"]) expect(out).not.toContain(secret);
    // The sealed envelope shows only its seal.
    expect(projectTv(g, 1).jobs.find((j) => j.id === "j-envelope")).toMatchObject({ style: "sealed", title: "", postedBy: "", body: "", reward: null });
    expect(projectTv(g, 1).jobs.every((j) => !("dm" in j))).toBe(true);
  });

  it("reaches games saved before the board, once", () => {
    const old = structuredClone(g) as Partial<GameState>;
    delete old.jobs;
    delete old.renown;
    old.upgrades = ["stinger"];
    const up = upgrade(old);
    expect(up.jobs!.map((j) => j.id).sort()).toEqual(SEED_JOBS.map((j) => j.id).sort());
    up.jobs = [];
    expect(upgrade(up).jobs).toEqual([]);
  });

  it("fills in the starter jobs' DM notes on the server, once", () => {
    const h = hydrate(structuredClone(g))!;
    expect(h.jobs!.find((j) => j.id === "j-artum")!.dm.adventure).toMatch(/Just Desserts/);
    h.jobs!.find((j) => j.id === "j-ransom")!.dm.loot = "";
    expect(hydrate(h)!.jobs!.find((j) => j.id === "j-ransom")!.dm.loot).toBe("");
  });

  it("gives games that already had the board Artum's flyer, once", () => {
    const old = structuredClone(g);
    old.jobs = old.jobs!.filter((j) => j.id !== "j-artum");
    old.upgrades = ["stinger", "jobs"];
    const up = upgrade(old);
    expect(up.jobs!.filter((j) => j.id === "j-artum")).toHaveLength(1);
    expect(up.jobs!.find((j) => j.id === "j-artum")).toMatchObject({ pinned: false, reward: { kind: "each", cp: 25 * GP }, renown: 0 });
  });

  it("lets the party take Artum's job and pays 25 gp each", () => {
    pin("j-artum");
    expect(projectPlayer(g, 1, "p1", []).jobs[0]).toMatchObject({ title: "Winterfest Needs Hands!", canTake: true, reward: { kind: "each", cp: 25 * GP } });
    as(P(1), { type: "me.takeJob", jobId: "j-artum", note: "" });
    dm({ type: "request.approve", requestId: lastPending().id });
    dm({ type: "session.start" });
    dm({ type: "job.done", jobId: "j-artum", payouts: defaultPayout(job("j-artum"), payoutPlayers(g)) });
    expect(["p1", "p2", "p3", "p4"].map(bal)).toEqual([25 * GP, 25 * GP, 25 * GP, 25 * GP]);
  });
});
