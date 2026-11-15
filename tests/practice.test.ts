// Practice mode: a private copy to rehearse on. Nothing in it reaches a real screen,
// state changes are thrown away, and only the content edits the DM ticks are kept.
import { beforeEach, describe, expect, it } from "vitest";
import { handleApi } from "@/server/api";
import { sha256 } from "@/server/auth";
import { execute, hello } from "@/server/game";
import { handlePracticeAdmin } from "@/server/practice";
import { MemoryStore } from "@/server/store";
import { projectPlayer, projectTv } from "@/shared/projection";
import { practiceTimes } from "@/shared/practice";
import { seedGame } from "@/shared/seed";
import type { GameState } from "@/shared/types";

const GAME = "candlefair";
const KEY = "the-real-dm-key";
const DM = { role: "dm" as const };
let live: MemoryStore;
let prac: MemoryStore;
let now = 1_800_000_000_000;

const url = (path: string, q: Record<string, string> = {}) => `https://x${path}?${new URLSearchParams({ game: GAME, ...q })}`;
const admin = (path: string, body?: unknown, key: string | null = KEY) =>
  handlePracticeAdmin(
    new Request(url(path), {
      method: body === undefined ? "GET" : "POST",
      headers: key ? { "x-candlefair-key": key } : {},
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    }),
    live,
    prac,
    now,
  );
/** A request to the practice room, as a practice screen sends it. */
const inPractice = (path: string, player: string, body?: unknown, key: string | null = KEY) =>
  handleApi(
    new Request(url(path, { player, practice: "1" }), {
      method: body === undefined ? "GET" : "POST",
      headers: key ? { "x-candlefair-key": key } : {},
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    }),
    prac,
  );
const pState = async () => (await prac.read(GAME)).state!;
const lState = async () => (await live.read(GAME)).state!;
const pcmd = async (cmd: unknown) => {
  const res = await inPractice("/api/command", "DM", cmd);
  if (!res.ok) throw new Error(((await res.json()) as { error: string }).error);
};

beforeEach(async () => {
  live = new MemoryStore();
  prac = new MemoryStore({ practice: true });
  const g = seedGame(GAME);
  g.players[0].keyHash = sha256("ana-secret");
  await live.overwrite(GAME, g, []);
  await live.setDmKeyHash(GAME, sha256(KEY));
  // A real phone is signed in.
  expect((await hello(GAME, "player1", "ana-secret", live)).status).toBe("ok");
});

describe("starting practice", () => {
  it("needs the DM key", async () => {
    expect((await admin("/api/practice/start", {}, "wrong")).status).toBe(401);
    expect((await admin("/api/practice/start", {}, null)).status).toBe(401);
    expect(await prac.read(GAME)).toMatchObject({ state: null });
  });

  it("copies the live game without anyone's name lock or Arrival link, and writes nothing to the live game", async () => {
    const before = await live.version(GAME);
    expect((await admin("/api/practice/start", {})).status).toBe(200);
    const s = await pState();
    expect(s.practice).toBeTruthy();
    expect(s.players.every((p) => !p.keyHash)).toBe(true);
    expect(s.players.every((p) => !p.arrival || p.arrival.token.startsWith("practice-"))).toBe(true);
    expect(s.doorClosed).toBe(true);
    expect(await live.version(GAME)).toBe(before);
    expect((await lState()).practice).toBeUndefined();
  });

  it("Practice this episode puts its run sheet up", async () => {
    const ep = (await lState()).episodes![0];
    await admin("/api/practice/start", { episodeId: ep.id });
    const s = await pState();
    expect(s.practice!.episodeId).toBe(ep.id);
    const sess = s.sessions.find((x) => x.id === s.currentSessionId);
    expect(sess?.run?.episodeId).toBe(ep.id);
    expect((await lState()).currentSessionId).toBeNull();
  });
});

describe("isolation", () => {
  beforeEach(async () => {
    await admin("/api/practice/start", {});
  });

  it("refuses every practice screen without the DM key, even with a real player's own key", async () => {
    for (const player of ["TV", "player1", "DM"]) {
      expect((await inPractice("/api/view", player, undefined, null)).status).toBe(401);
      expect((await inPractice("/api/view", player, undefined, "ana-secret")).status).toBe(401);
    }
    expect((await inPractice("/api/hello", "player1", {}, "ana-secret")).headers.get("x-candlefair-miss")).toBe("1");
  });

  it("a live room never answers a practice request, and a practice room never answers a live one", async () => {
    expect(
      (
        await handleApi(
          new Request(url("/api/view", { player: "DM", practice: "1" }), {
            headers: { "x-candlefair-key": KEY },
          }),
          live,
        )
      ).status,
    ).toBe(404);
    expect((await handleApi(new Request(url("/api/view", { player: "TV" })), prac)).status).toBe(404);
    expect(
      (
        await handleApi(
          new Request(url("/api/view", { player: "player1" }), {
            headers: { "x-candlefair-key": "ana-secret" },
          }),
          prac,
        )
      ).status,
    ).toBe(404);
  });

  it("nothing done in practice reaches the live game or its screens", async () => {
    const before = JSON.stringify(await lState());
    const ledger = (await live.ledger(GAME)).length;
    const published = live.published.length;
    await pcmd({
      type: "money.adjust",
      playerId: "p1",
      amountCp: 5000,
      note: "practice gold",
    });
    await pcmd({ type: "scene.show", sceneId: (await pState()).scenes[1].id });
    await pcmd({ type: "renown.set", rank: 3 });
    expect(JSON.stringify(await lState())).toBe(before);
    expect((await live.ledger(GAME)).length).toBe(ledger);
    expect(live.published.length).toBe(published);
    expect(prac.published.length).toBeGreaterThan(0);
  });

  it("lets the DM key see the TV and a stand-in's phone, built by the same filters as real devices", async () => {
    const tv = (await (await inPractice("/api/view", "TV")).json()) as {
      role: string;
    };
    const s = await pState();
    const { version } = await prac.read(GAME);
    expect(JSON.parse(JSON.stringify(tv))).toEqual(JSON.parse(JSON.stringify({ ...projectTv(s, version) })));
    const phone = (await (await inPractice("/api/view", "player1")).json()) as {
      role: string;
    };
    expect(phone.role).toBe("player");
    expect(JSON.parse(JSON.stringify(phone))).toEqual(JSON.parse(JSON.stringify(projectPlayer(s, version, "p1", await prac.ledger(GAME)))));
  });

  it("never creates a player and refuses name locks", async () => {
    expect(
      (await (await inPractice("/api/hello", "Stranger", {})).json()) as {
        status: string;
      },
    ).toMatchObject({ status: "invalid" });
    expect((await pState()).players.some((p) => p.handle === "stranger")).toBe(false);
    expect(
      (
        await inPractice("/api/command", "player1", {
          type: "me.lock",
          key: "abcd1234",
        })
      ).status,
    ).toBe(400);
  });

  it("turns off backups, resets, presets, keys and Arrival links", async () => {
    for (const path of ["/api/import", "/api/reset", "/api/rekey", "/api/preset/save", "/api/ledger/remove", "/api/snapshots/restore", "/api/arrival"]) {
      expect((await inPractice(path, "DM", {})).status).toBe(404);
    }
  });

  it("works with nothing else connected: a stand-in acts from the DM key", async () => {
    await pcmd({ type: "fight.start", where: "the kitchen" });
    const res = await inPractice("/api/command", "player1", {
      type: "me.initiative",
      init: 14,
    });
    expect(res.status).toBe(200);
    expect((await pState()).fight!.order.find((c) => c.playerId === "p1")!.init).toBe(14);
  });
});

describe("stand-ins", () => {
  beforeEach(async () => {
    await admin("/api/practice/start", {});
  });
  it("adds, sets and removes stand-ins, and rolls their initiative in one go", async () => {
    await pcmd({ type: "practice.standinAdd", name: "Extra", maxHp: 12 });
    const extra = (await pState()).players.at(-1)!;
    expect(extra.standIn).toEqual({});
    await pcmd({
      type: "practice.standinSet",
      playerId: extra.id,
      ac: 15,
      initBonus: 3,
    });
    expect((await pState()).players.at(-1)!.standIn).toEqual({
      ac: 15,
      initBonus: 3,
    });
    await pcmd({ type: "fight.start" });
    await pcmd({ type: "practice.rollStandIns" });
    const f = (await pState()).fight!;
    expect(f.order.filter((c) => c.kind === "player").every((c) => c.init !== null)).toBe(true);
    const mine = f.order.find((c) => c.playerId === extra.id)!;
    expect(mine.init! - 3).toBeGreaterThanOrEqual(1);
    await pcmd({ type: "practice.standinRemove", playerId: extra.id });
    expect((await pState()).players.some((p) => p.id === extra.id)).toBe(false);
  });
  it("practice commands are refused in a live game", async () => {
    await expect(execute(live, GAME, DM, { type: "practice.standinAdd", name: "X" })).rejects.toThrow(/practice/);
  });
});

describe("timing", () => {
  it("times each beat and fight", async () => {
    const ep = (await lState()).episodes![0];
    await admin("/api/practice/start", { episodeId: ep.id });
    // Commands run at real time; work with what they record.
    await pcmd({ type: "run.next" });
    const s = await pState();
    expect(s.practice!.open?.key).toMatch(/^beat:/);
    const t = practiceTimes(s.practice!, Date.now() + 60_000);
    expect(t.segments.some((x) => x.key.startsWith("beat:"))).toBe(true);
    expect(t.estimateMs).toBe(t.totalMs * 2);
  });
});

describe("ending practice", () => {
  let base: GameState;
  beforeEach(async () => {
    base = await lState();
    await admin("/api/practice/start", { episodeId: base.episodes![0].id });
  });

  it("lists content edits, keeps only the ticked ones, throws away all game state, and adds the notes to prep", async () => {
    const m = (await pState()).monsters![0];
    const ep = (await pState()).episodes![0];
    const b = ep.beats[0];
    const entry = (await pState()).entries![0];
    // Content
    await pcmd({
      type: "monster.update",
      monsterId: m.id,
      monster: { ...m, ac: m.ac + 2, sceneId: m.sceneId ?? null },
    });
    await pcmd({
      type: "beat.update",
      episodeId: ep.id,
      beatId: b.id,
      beat: {
        title: b.title,
        notes: ["Fixed the typo"],
        readAloud: b.readAloud ?? [],
        checks: b.checks,
        branches: b.branches,
        actions: b.actions,
      },
    });
    await pcmd({
      type: "entry.update",
      entryId: entry.id,
      patch: { dmNote: "Owes the baker" },
    });
    // State
    await pcmd({
      type: "money.adjust",
      playerId: "p1",
      amountCp: 5000,
      note: "",
    });
    await pcmd({
      type: "entry.stage",
      entryId: entry.id,
      stage: "known",
      announce: false,
    });
    await pcmd({
      type: "practice.notes",
      text: "Need a name for the guard\n- Check the map pins",
    });

    const edits = (await (await admin("/api/practice/edits")).json()) as {
      edits: { id: string; what: string; detail: string; conflict: boolean }[];
    };
    expect(edits.edits.map((e) => e.what).sort()).toEqual(["Discover", "Monster", "Run sheet"]);
    expect(edits.edits.find((e) => e.what === "Monster")!.detail).toBe("AC");
    expect(edits.edits.every((e) => !e.conflict)).toBe(true);

    const keep = edits.edits.filter((e) => e.what !== "Discover").map((e) => e.id);
    const res = await admin("/api/practice/end", { keep });
    expect(await res.json()).toMatchObject({ ok: true, applied: 2, notes: 2 });

    const after = await lState();
    expect(after.monsters!.find((x) => x.id === m.id)!.ac).toBe(m.ac + 2);
    expect(after.episodes![0].beats[0].notes).toEqual(["Fixed the typo"]);
    expect(after.entries!.find((x) => x.id === entry.id)!.dmNote).toBe(entry.dmNote);
    expect(after.entries!.find((x) => x.id === entry.id)!.stage).toBe(entry.stage);
    expect(after.players.find((p) => p.id === "p1")!.balanceCp).toBe(base.players.find((p) => p.id === "p1")!.balanceCp);
    expect(after.players.find((p) => p.id === "p1")!.keyHash).toBe(sha256("ana-secret"));
    expect(after.practice).toBeUndefined();
    expect(after.episodes![0].prepNotes!.map((n) => n.text)).toEqual(["Need a name for the guard", "Check the map pins"]);
    expect(await prac.read(GAME)).toMatchObject({ state: null });
  });

  it("an edit to something the live game also changed is flagged, and left alone unless ticked", async () => {
    const m = (await pState()).monsters![0];
    await pcmd({
      type: "monster.update",
      monsterId: m.id,
      monster: { ...m, ac: 20, sceneId: m.sceneId ?? null },
    });
    await execute(live, GAME, DM, {
      type: "monster.update",
      monsterId: m.id,
      monster: { ...m, ac: 5, sceneId: m.sceneId ?? null },
    });
    const edits = (await (await admin("/api/practice/edits")).json()) as {
      edits: { conflict: boolean }[];
    };
    expect(edits.edits).toHaveLength(1);
    expect(edits.edits[0].conflict).toBe(true);
    await admin("/api/practice/end", { keep: [] });
    expect((await lState()).monsters!.find((x) => x.id === m.id)!.ac).toBe(5);
  });

  it("new things made in practice come over fresh (no reveal from practice)", async () => {
    await pcmd({
      type: "entry.add",
      entry: { kind: "person", name: "The guard", summary: "Grumpy" },
    });
    const made = (await pState()).entries!.at(-1)!;
    await pcmd({
      type: "entry.stage",
      entryId: made.id,
      stage: "found",
      announce: false,
    });
    const edits = (await (await admin("/api/practice/edits")).json()) as {
      edits: { id: string; change: string }[];
    };
    const add = edits.edits.find((e) => e.change === "added")!;
    await admin("/api/practice/end", { keep: [add.id] });
    const kept = (await lState()).entries!.find((x) => x.id === made.id)!;
    expect(kept.name).toBe("The guard");
    expect(kept.stage).toBe("hidden");
  });

  it("Throw everything away keeps nothing", async () => {
    const before = JSON.stringify(await lState());
    await pcmd({ type: "practice.notes", text: "a note" });
    await admin("/api/practice/end", { discard: true });
    expect(JSON.stringify(await lState())).toBe(before);
    expect(await prac.read(GAME)).toMatchObject({ state: null });
  });

  it("Reset practice goes back to the live state and keeps the notes", async () => {
    await pcmd({
      type: "money.adjust",
      playerId: "p1",
      amountCp: 5000,
      note: "",
    });
    await pcmd({ type: "practice.notes", text: "keep me" });
    await admin("/api/practice/start", { fresh: true });
    const s = await pState();
    expect(s.players.find((p) => p.id === "p1")!.balanceCp).toBe(base.players.find((p) => p.id === "p1")!.balanceCp);
    expect(s.practice!.notes).toBe("keep me");
    expect(s.practice!.episodeId).toBe(base.episodes![0].id);
  });
});

describe("what practice screens are sent", () => {
  it("the TV and phones never get the practice info, stand-in numbers or the notes", async () => {
    await admin("/api/practice/start", {});
    await pcmd({ type: "practice.notes", text: "SECRET-PRACTICE-NOTE" });
    await pcmd({ type: "practice.standinSet", playerId: "p1", ac: 47, initBonus: 19 });
    for (const player of ["TV", "player1"]) {
      const body = await (await inPractice("/api/view", player)).text();
      expect(body).not.toContain("SECRET-PRACTICE-NOTE");
      expect(body).not.toContain("standIn");
      expect(body).not.toContain('"practice"');
    }
  });
});
