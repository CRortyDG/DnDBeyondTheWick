// The notice board: every note (plain notes, jobs, player flyers) placed by the DM.
import { beforeEach, describe, expect, it } from "vitest";
import type { Command } from "@/shared/commands";
import { dmCommand } from "@/shared/commands";
import { BOARD_H, BOARD_MAX, BOARD_W, boardNotes, findBoardNote, LEGACY_SLOTS, upCount } from "@/shared/board";
import { GP } from "@/shared/money";
import { upgrade } from "@/shared/migrate";
import { projectPlayer, projectTv } from "@/shared/projection";
import { apply, CommandError, type Ctx } from "@/shared/reducer";
import { OLD_ARTUM, SEED_NOTICES, seedGame } from "@/shared/seed";
import type { Actor, GameState } from "@/shared/types";

const DM: Actor = { role: "dm" };
let g: GameState;
let now = 1000;
function dm(cmd: Command) {
  const r = apply(g, cmd, { now: ++now, actor: DM } as Ctx);
  g = r.state;
  return r;
}
function fails(cmd: Command): string {
  try {
    dm(cmd);
  } catch (e) {
    if (e instanceof CommandError) return e.message;
    throw e;
  }
  throw new Error("expected the command to fail");
}
const notice = (slug: string) => g.notices!.find((n) => n.slug === slug)!;
const newest = () => g.notices!.at(-1)!;
const job = (id: string) => g.jobs!.find((j) => j.id === id)!;
const everyone = () => JSON.stringify([projectTv(g, 1), projectPlayer(g, 1, "p1", [])]);

/** A game saved before free placement: no notices, Artum's job in the drawer as a merchant's bill. */
function oldGame(): GameState {
  const old = structuredClone(seedGame("t"));
  delete old.notices;
  old.upgrades = ["stinger", "jobs", "jobs-artum"];
  for (const j of old.jobs!) {
    delete j.place;
    delete j.look;
    j.pinned = false;
    delete j.pinnedAt;
  }
  const a = old.jobs!.find((j) => j.id === "j-artum")!;
  Object.assign(a, { style: "bill", postedBy: OLD_ARTUM.postedBy, body: OLD_ARTUM.body });
  return old;
}

beforeEach(() => {
  g = seedGame("t");
});

describe("a new game's board", () => {
  it("hangs the printed notices as notes, where they always were", () => {
    expect(g.notices!.map((n) => n.slug)).toEqual(SEED_NOTICES.map((n) => n.slug));
    expect(notice("tale-night")).toMatchObject({ style: "dark", up: true, place: { x: 1250, y: 50, w: 330, rot: 2 } });
    const tv = projectTv(g, 1);
    expect(tv.notices).toHaveLength(SEED_NOTICES.length);
    // Artum's handbill is the Artum job: one note, with the reward.
    expect(tv.jobs.map((j) => j.id)).toEqual(["j-artum"]);
    expect(tv.jobs[0]).toMatchObject({ style: "handbill", reward: { kind: "each", cp: 25 * GP }, place: { x: 690, y: 70, w: 520 } });
    expect(tv.jobs[0].look?.list).toHaveLength(4);
  });

  it("never sends a note's DM note, or anything in the drawer", () => {
    dm({ type: "notice.update", noticeId: notice("ferry-closed").id, patch: { dmNote: "SECRET-FERRY" } });
    dm({ type: "notice.add", notice: { title: "SECRET-DRAWER", up: false } });
    expect(everyone()).not.toContain("SECRET-");
    // Phones get jobs, never plain notes.
    expect(JSON.stringify(projectPlayer(g, 1, "p1", []))).not.toContain("Tale Night");
  });
});

describe("placing notes", () => {
  it("adds a note in the emptiest spot, on top, with a short name of its own", () => {
    const top = Math.max(...boardNotes(g).map((n) => n.place?.z ?? 0));
    dm({ type: "notice.add", notice: { title: "Tale Night", body: "Again!" } });
    const n = newest();
    expect(n.up).toBe(true);
    expect(n.slug).toBe("tale-night-2");
    expect(n.place.z).toBe(top + 1);
    expect(n.place.x).toBeGreaterThanOrEqual(0);
    expect(n.place.x + n.place.w).toBeLessThanOrEqual(BOARD_W);
    expect(n.place.y).toBeLessThan(BOARD_H);
    expect(projectTv(g, 1).notices.some((x) => x.id === n.id)).toBe(true);
  });

  it("moves, tilts, widens and restacks any kind of note, within sane numbers", () => {
    const id = notice("lost-ham").id;
    dm({ type: "board.place", note: { kind: "notice", id }, place: { x: 900, y: 400, rot: 12.34, w: 400, z: 99 } });
    expect(notice("lost-ham").place).toEqual({ x: 900, y: 400, rot: 12.3, w: 400, z: 99 });
    dm({ type: "board.place", note: { kind: "notice", id }, place: { x: 3000, y: -900, rot: 90, w: 640, z: 1 } });
    expect(notice("lost-ham").place).toMatchObject({ x: BOARD_W - 60, y: -20, rot: 30 });
    dm({ type: "board.place", note: { kind: "job", id: "j-artum" }, place: { x: 10, y: 10, rot: 0, w: 500, z: 5 } });
    expect(job("j-artum").place).toEqual({ x: 10, y: 10, rot: 0, w: 500, z: 5 });
    expect(fails({ type: "board.place", note: { kind: "notice", id: "nope" }, place: { x: 0, y: 0, rot: 0, w: 300, z: 0 } })).toMatch(/isn't on the board/);
  });

  it("takes a note down into the drawer and puts it back where it hung", () => {
    const id = notice("boat-for-sale").id;
    const at = notice("boat-for-sale").place;
    dm({ type: "notice.update", noticeId: id, patch: { up: false } });
    expect(projectTv(g, 1).notices.some((x) => x.id === id)).toBe(false);
    dm({ type: "notice.update", noticeId: id, patch: { up: true } });
    expect(notice("boat-for-sale").place).toMatchObject({ x: at.x, y: at.y, w: at.w });
    // Dropped somewhere else from the drawer: it hangs there.
    dm({ type: "notice.update", noticeId: id, patch: { up: false } });
    dm({ type: "notice.update", noticeId: id, patch: { up: true, place: { x: 500, y: 500, rot: 0, w: 280, z: 400 } } });
    expect(notice("boat-for-sale").place).toEqual({ x: 500, y: 500, rot: 0, w: 280, z: 400 });
  });

  it("pins a job at the spot it was dropped, or the emptiest one", () => {
    dm({ type: "job.pin", jobId: "j-ransom", pinned: true, place: { x: 100, y: 600, rot: -2, w: 330, z: 77 } });
    expect(job("j-ransom").place).toEqual({ x: 100, y: 600, rot: -2, w: 330, z: 77 });
    dm({ type: "job.pin", jobId: "j-sheep", pinned: true });
    expect(job("j-sheep").place).toBeDefined();
    expect(projectTv(g, 1).jobs.find((j) => j.id === "j-sheep")!.place).toEqual(job("j-sheep").place);
  });

  it("throws a note away", () => {
    const id = notice("festival-bunting").id;
    dm({ type: "notice.remove", noticeId: id });
    expect(g.notices!.some((n) => n.id === id)).toBe(false);
    expect(fails({ type: "notice.remove", noticeId: id })).toMatch(/isn't on the board/);
  });

  it("hides and shows the Renown plaque", () => {
    dm({ type: "board.plaque", shown: false });
    expect(projectTv(g, 1).plaqueHidden).toBe(true);
    dm({ type: "board.plaque", shown: true });
    expect(projectTv(g, 1).plaqueHidden).toBeUndefined();
  });

  it("counts every kind of note against the board's room", () => {
    expect(upCount(g)).toBe(SEED_NOTICES.length + 1);
    while (upCount(g) < BOARD_MAX) dm({ type: "notice.add", notice: { title: `Note ${upCount(g)}` } });
    expect(fails({ type: "job.pin", jobId: "j-ransom", pinned: true })).toMatch(/board is full/);
  });
});

describe("what a note says and looks like", () => {
  it("keeps the words and looks, trimmed, and drops empty extras", () => {
    dm({ type: "notice.add", notice: { style: "dark", title: "  Tale Night  ", body: "x", sign: "Mags", look: { pin: "gold", kicker: " The Candle ", sub: "", list: [{ head: "", text: "" }, { head: "Ale", text: "2 cp" }], titleSize: 40 } } });
    expect(newest()).toMatchObject({ style: "dark", title: "Tale Night", sign: "Mags", look: { pin: "gold", kicker: "The Candle", list: [{ head: "Ale", text: "2 cp" }], titleSize: 40 } });
    expect(newest().look.sub).toBeUndefined();
  });

  it("a sealed note shows nothing but its seal", () => {
    dm({ type: "notice.add", notice: { style: "sealed", title: "SECRET-SEALED", body: "SECRET-BODY", sign: "SECRET-SIGN", look: { kicker: "SECRET-KICK", pin: "black" } } });
    const tv = projectTv(g, 1).notices.find((n) => n.id === newest().id)!;
    expect(tv).toMatchObject({ title: "", body: "", sign: "", look: { pin: "black" } });
    expect(JSON.stringify(projectTv(g, 1))).not.toContain("SECRET-");
  });

  it("only takes pictures that were uploaded", () => {
    expect(dmCommand.safeParse({ type: "notice.add", notice: { look: { image: "http://example.com/x.png" } } }).success).toBe(false);
    expect(dmCommand.safeParse({ type: "notice.add", notice: { look: { image: "/api/files/abc.png" } } }).success).toBe(true);
  });

  it("lets the DM restyle a player's flyer", () => {
    g.flyers.push({ id: "fl1", playerId: "p1", title: "Lost cat", body: "", signedBy: "Pip", postedAt: 1, up: true, place: { x: 10, y: 10, rot: 0, w: 290, z: 1 } });
    dm({ type: "flyer.update", flyerId: "fl1", patch: { style: "parchment", look: { pin: "blue" } } });
    expect(projectTv(g, 1).flyers[0]).toMatchObject({ style: "parchment", look: { pin: "blue" } });
  });

  it("finds any note by its @flyer/ short name", () => {
    expect(findBoardNote(g, "@flyer/tale-night")).toMatchObject({ kind: "notice", up: true });
    expect(findBoardNote(g, "flyer/winterfest-needs-hands")).toMatchObject({ kind: "job", id: "j-artum", up: true });
    expect(findBoardNote(g, "my-brother-is-being-held-for-ransom")).toMatchObject({ kind: "job", id: "j-ransom", up: false });
  });
});

describe("games saved before free placement", () => {
  it("get the printed notices, once", () => {
    const up = upgrade(oldGame());
    expect(up.notices!.map((n) => n.slug)).toEqual(SEED_NOTICES.map((n) => n.slug));
    up.notices = up.notices!.slice(1);
    expect(upgrade(up).notices).toHaveLength(SEED_NOTICES.length - 1);
  });

  it("merge Artum's printed handbill into his job, kept up", () => {
    const a = upgrade(oldGame()).jobs!.find((j) => j.id === "j-artum")!;
    expect(a).toMatchObject({ pinned: true, style: "handbill", postedBy: "Artum", place: { x: 690, y: 70, w: 520 } });
    expect(a.body).not.toContain("Wanted:");
    expect(a.look?.list).toHaveLength(4);
  });

  it("keep the DM's own words on Artum's job", () => {
    const old = oldGame();
    old.jobs!.find((j) => j.id === "j-artum")!.body = "My own words";
    expect(upgrade(old).jobs!.find((j) => j.id === "j-artum")!.body).toBe("My own words");
  });

  it("keep the handbill as a plain note when Artum's job is gone", () => {
    const old = oldGame();
    old.jobs = old.jobs!.filter((j) => j.id !== "j-artum");
    old.upgrades!.push("jobs-artum");
    const up = upgrade(old);
    expect(up.notices!.find((n) => n.slug === "winterfest-needs-hands")).toMatchObject({ style: "handbill", up: true, sign: "Artum" });
  });

  it("leave pinned cards in the spots they showed in", () => {
    const old = oldGame();
    old.jobs!.find((j) => j.id === "j-ransom")!.pinned = true;
    old.jobs!.find((j) => j.id === "j-ransom")!.pinnedAt = 5;
    old.flyers.push({ id: "fl1", playerId: "p1", title: "Lost cat", body: "", signedBy: "Pip", postedAt: 9, up: true });
    const up = upgrade(old);
    const [x0, y0, r0] = LEGACY_SLOTS[0];
    const [x1, y1, r1] = LEGACY_SLOTS[1];
    expect(up.jobs!.find((j) => j.id === "j-ransom")!.place).toMatchObject({ x: x0, y: y0, rot: r0, w: 330 });
    expect(up.flyers[0].place).toMatchObject({ x: x1, y: y1, rot: r1, w: 290 });
  });
});
