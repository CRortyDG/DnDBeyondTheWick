// Run sheets: Markdown import/export, Next/Back/jump, sessions, spoiler safety.
import fs from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { execute, viewFor } from "@/server/game";
import { JUST_DESSERTS_MD, seedEpisodes } from "@/server/seed-episodes";
import { createFileStore, type Store } from "@/server/store";
import type { DmCommand } from "@/shared/commands";
import { projectPlayer, projectTv } from "@/shared/projection";
import { apply, previousRecap } from "@/shared/reducer";
import { episodeMarkdown, parseEpisode, sceneResolver } from "@/shared/runsheet";
import { SEED_SCENES, seedGame } from "@/shared/seed";
import type { GameState } from "@/shared/types";

const DM = { role: "dm" as const };
const run = (g: GameState, cmd: DmCommand, now = 1000) => apply(g, cmd, { now, actor: DM }).state;
const game = () => {
  const g = seedGame("t");
  g.episodes = seedEpisodes(g.scenes);
  return g;
};

describe("importing the seed episode", () => {
  const p = parseEpisode(JUST_DESSERTS_MD, sceneResolver(SEED_SCENES));
  const beat = (title: string) => p.beats.find((b) => b.title === title)!;

  it("finds 15 beats in order", () => {
    expect(p.title).toBe("Just Desserts");
    expect(p.beats).toHaveLength(15);
    expect(p.beats[0].title).toBe("Locals at the Flickering Candle");
    expect(p.beats[14].title).toBe("The stinger");
  });

  it("reads checks: skill, DC, what, fail and success", () => {
    expect(beat("Hang the fir garlands").checks).toEqual([
      { skill: "Strength (Athletics) or Dexterity (Acrobatics)", dc: 12, what: "climb and keep balance", fail: "fall (1d6 bludgeoning) or drop the garland on something breakable" },
      { skill: "Dexterity (Sleight of Hand)", dc: 10, what: "hang it so it looks good", fail: "it's crooked and Artum notices" },
    ]);
    expect(beat("The scullery china").checks[1]).toEqual({ skill: "Strength (Athletics)", dc: 12, what: "push the heavy cart" });
    const horses = beat("The horses").checks;
    expect(horses).toHaveLength(4);
    expect(horses[2]).toEqual({ skill: "Dexterity saving throw", dc: 12, what: "stay clear of a kick", fail: "knocked prone in the snow, not hurt" });
    expect(horses[3]).toEqual({ skill: "Wisdom (Animal Handling)", dc: 10, what: "settle the dog", success: "automatic if someone offers it food" });
    const all = p.beats.flatMap((b) => b.checks);
    expect(all).toHaveLength(9);
  });

  it("reads branches", () => {
    expect(beat("Artum bursts in").branches).toEqual([
      { when: "they still refuse", then: "\"Fine. Then at least come to the feast as guests. Free food.\" Either way they're in the banquet hall when the trouble starts." },
    ]);
    expect(p.beats.flatMap((b) => b.branches)).toHaveLength(1);
  });

  it("maps actions to the existing scenes and leaves initiative off", () => {
    const acts = Object.fromEntries(p.beats.map((b) => [b.title, b.actions]));
    expect(acts["Locals at the Flickering Candle"]).toEqual([{ type: "scene", sceneId: "s-board" }]);
    expect(acts["Newcomers at the docks"]).toEqual([{ type: "scene", sceneId: "s-map" }]);
    expect(acts["Artum bursts in"]).toEqual([{ type: "scene", sceneId: "s-artum" }]);
    expect(acts["Artum's toast and dessert"]).toEqual([{ type: "scene", sceneId: "s-chef" }]);
    expect(acts["The pudding fight"]).toEqual([]);
    expect(acts["Celebration and payday"]).toEqual([{ type: "bank" }]);
    expect(acts["The chef's confession"]).toEqual([{ type: "scene", sceneId: "s-chef" }]);
    expect(acts["The recipes won't burn"]).toEqual([{ type: "scene", sceneId: "s-symbol" }]);
    expect(acts["The stinger"]).toEqual([{ type: "black" }]);
    expect(acts["Hang the fir garlands"]).toEqual([]);
    expect(p.warnings).toEqual([expect.stringContaining("initiative")]);
  });

  it("keeps read-aloud paragraphs and where they sit among the notes", () => {
    expect(beat("Artum bursts in").readAloud).toEqual(["\"Where is everyone?!\""]);
    const toast = beat("Artum's toast and dessert");
    expect(toast.readAloud).toEqual(["\"My new recipes, never served before!\""]);
    expect(toast.readAloudAt).toBe(1);
    expect(toast.notes).toHaveLength(2);
    const stinger = beat("The stinger");
    expect(stinger.readAloud).toHaveLength(9);
    expect(stinger.readAloud![0]).toBe("Close your eyes.");
    expect(stinger.readAloud![8]).toBe("Open your eyes. End of episode one.");
    expect(stinger.readAloudAt).toBe(2);
    expect(beat("The horses").notes.at(-1)).toBe("The first six guests arrive and enter the banquet.");
  });

  it("is forgiving about pasted whitespace, bullets and arrows", () => {
    const messy = "\r\n\r\n   ##   Artum bursts in  \r\n  >  “Where is everyone?!”\r\n• A bullet from a doc\r\n* Another\r\n  CHECK:  Strength (Athletics)   DC13 |  grab the bridle  |  Fail:  dragged into the snow\r\nIf: they refuse -> \"Free food.\"\r\nAction:  scene   ARTUM’S NOTICE \r\n \r\n##Next one\r\n- note";
    const q = parseEpisode(messy, sceneResolver(SEED_SCENES));
    expect(q.beats.map((b) => b.title)).toEqual(["Artum bursts in", "Next one"]);
    const b = q.beats[0];
    expect(b.readAloud).toEqual(["“Where is everyone?!”"]);
    expect(b.notes).toEqual(["A bullet from a doc", "Another"]);
    expect(b.checks).toEqual([{ skill: "Strength (Athletics)", dc: 13, what: "grab the bridle", fail: "dragged into the snow" }]);
    expect(b.branches).toEqual([{ when: "they refuse", then: "\"Free food.\"" }]);
    expect(b.actions).toEqual([{ type: "scene", sceneId: "s-notice" }]);
  });

  it("warns about scenes that don't exist and leaves the action off", () => {
    const q = parseEpisode("## A\naction: scene the moon", sceneResolver(SEED_SCENES));
    expect(q.beats[0].actions).toEqual([]);
    expect(q.warnings[0]).toMatch(/the moon/);
  });

  it("exports back to Markdown that imports to the same beats", () => {
    const md = episodeMarkdown({ title: p.title, beats: p.beats.map((b, i) => ({ id: String(i), ...b })) }, SEED_SCENES);
    const again = parseEpisode(md, sceneResolver(SEED_SCENES));
    expect(again.title).toBe("Just Desserts");
    expect(again.beats).toEqual(p.beats);
  });
});

describe("running an episode", () => {
  const start = () => run(run(game(), { type: "session.start" }), { type: "run.start", episodeId: "ep1" });
  const runOf = (g: GameState) => g.sessions.find((x) => x.id === g.currentSessionId)!.run!;

  it("starts on the check-in screen", () => {
    const g = start();
    expect(runOf(g)).toMatchObject({ episodeId: "ep1", stage: "start", beat: 0 });
  });

  it("fires actions on Next", () => {
    let g = start();
    g = run(g, { type: "scene.show", sceneId: "s-mags" });
    g = run(g, { type: "run.next" }); // beat 1: notice board
    expect(runOf(g)).toMatchObject({ stage: "beat", beat: 0 });
    expect(g.live.sceneId).toBe("s-board");
    g = run(g, { type: "run.next" }); // beat 2: town map
    expect(g.live.sceneId).toBe("s-map");
    g = run(g, { type: "run.next" }); // beat 3: Artum
    expect(g.live.sceneId).toBe("s-artum");
  });

  it("skips actions you skipped on the next-beat preview", () => {
    let g = run(start(), { type: "scene.show", sceneId: "s-mags" });
    g = run(g, { type: "run.next", skip: [0] });
    expect(runOf(g).beat).toBe(0);
    expect(g.live.sceneId).toBe("s-mags");
  });

  it("fires actions on a jump", () => {
    let g = start();
    g = run(g, { type: "run.jump", stage: "beat", beat: 12 }); // The recipes won't burn
    expect(runOf(g)).toMatchObject({ stage: "beat", beat: 12 });
    expect(g.live.sceneId).toBe("s-symbol");
    g = run(g, { type: "run.jump", stage: "beat", beat: 14 });
    expect(g.live.sceneId).toBe("s-black");
    g = run(g, { type: "run.jump", stage: "beat", beat: 10 }); // payday: the purse comes up
    g = run(g, { type: "live.purse", visible: false });
    g = run(g, { type: "run.jump", stage: "beat", beat: 10 });
    expect(g.live.purseVisible).toBe(true);
  });

  it("does not fire actions on Back", () => {
    let g = start();
    g = run(g, { type: "run.jump", stage: "beat", beat: 3 }); // after Artum: no action
    g = run(g, { type: "scene.show", sceneId: "s-mags" });
    g = run(g, { type: "run.back" });
    expect(runOf(g)).toMatchObject({ stage: "beat", beat: 2 });
    g = run(g, { type: "run.back" });
    g = run(g, { type: "run.back" });
    expect(runOf(g)).toMatchObject({ stage: "beat", beat: 0 });
    expect(g.live.sceneId).toBe("s-mags");
    g = run(g, { type: "run.back" });
    expect(runOf(g).stage).toBe("start");
  });

  it("goes to the end screen after the last beat and back again", () => {
    let g = run(start(), { type: "run.jump", stage: "beat", beat: 14 });
    g = run(g, { type: "run.next" });
    expect(runOf(g).stage).toBe("end");
    g = run(g, { type: "run.next" });
    expect(runOf(g).stage).toBe("end");
    g = run(g, { type: "scene.show", sceneId: "s-board" });
    g = run(g, { type: "run.back" });
    expect(runOf(g)).toMatchObject({ stage: "beat", beat: 14 });
    expect(g.live.sceneId).toBe("s-board");
  });

  it("fires one action again on request", () => {
    let g = run(start(), { type: "run.jump", stage: "beat", beat: 2 });
    g = run(g, { type: "scene.show", sceneId: "s-mags" });
    g = run(g, { type: "run.fire", beatId: "ep1-b3", index: 0 });
    expect(g.live.sceneId).toBe("s-artum");
  });

  it("keeps quick notes per beat and attendance", () => {
    let g = start();
    g = run(g, { type: "run.note", beatId: "ep1-b4", text: "Sam fell off the ladder" });
    expect(runOf(g).notes).toEqual({ "ep1-b4": "Sam fell off the ladder" });
    g = run(g, { type: "run.attend", playerId: "p2", here: false });
    const sess = g.sessions.find((x) => x.id === g.currentSessionId)!;
    expect(sess.attendeeIds).not.toContain("p2");
    expect(g.players.find((p) => p.id === "p2")!.away).toBe(true);
    g = run(g, { type: "run.attend", playerId: "p2", here: true });
    expect(g.sessions.find((x) => x.id === g.currentSessionId)!.attendeeIds).toContain("p2");
  });

  it("keeps pointing at the same beat when beats are reordered", () => {
    let g = run(start(), { type: "run.jump", stage: "beat", beat: 2 });
    g = run(g, { type: "beat.move", episodeId: "ep1", beatId: "ep1-b3", to: 0 });
    expect(runOf(g).beat).toBe(0);
    expect(g.episodes![0].beats[0].id).toBe("ep1-b3");
  });

  it("starts a new session at the beat an unfinished one stopped on, and offers its recap", () => {
    let g = run(start(), { type: "run.jump", stage: "beat", beat: 6 }, 1000);
    const first = g.currentSessionId!;
    g = run(g, { type: "run.recap", sessionId: first, text: "They hung garlands. Badly." });
    g = run(g, { type: "session.end" }, 2000);
    g = run(g, { type: "run.start", episodeId: "ep1" }, 3000);
    expect(g.currentSessionId).not.toBe(first);
    expect(runOf(g)).toMatchObject({ stage: "start", beat: 6 });
    expect(previousRecap(g)?.id).toBe(first);
    g = run(g, { type: "run.next" });
    expect(runOf(g)).toMatchObject({ stage: "beat", beat: 6 });
  });
});

describe("resuming after a reload", () => {
  let store: Store;
  beforeEach(async () => {
    store = createFileStore(null);
    await store.overwrite("t", seedGame("t"), []);
  });

  it("gives older games the seed episode", async () => {
    const { state } = await store.read("t");
    expect(state!.episodes).toHaveLength(1);
    expect(state!.episodes![0].beats).toHaveLength(15);
  });

  it("lands back on the current beat", async () => {
    await execute(store, "t", DM, { type: "run.start", episodeId: "ep1" });
    for (let i = 0; i < 7; i++) await execute(store, "t", DM, { type: "run.next" });
    // A reload (or another device) is a fresh read of the DM view.
    const dm = await viewFor(store, "t", DM);
    if (dm.role !== "dm") throw new Error();
    const sess = dm.state.sessions.find((x) => x.id === dm.state.currentSessionId)!;
    expect(sess.run).toMatchObject({ episodeId: "ep1", stage: "beat", beat: 6 });
    expect(dm.state.episodes![0].beats[sess.run!.beat].title).toBe("Seats or serving duty");
    // Starting run-game again resumes rather than restarting.
    await execute(store, "t", DM, { type: "run.start", episodeId: "ep1" });
    const again = await viewFor(store, "t", DM);
    if (again.role !== "dm") throw new Error();
    expect(again.state.sessions.find((x) => x.id === again.state.currentSessionId)!.run!.beat).toBe(6);
  });
});

describe("spoiler safety", () => {
  const CANARY = "CANARY_RUNSHEET_9b1c";

  /** A running session with a canary in every run-sheet field. */
  function canaryGame(): GameState {
    let g = run(run(game(), { type: "session.start" }), { type: "run.start", episodeId: "ep1" });
    g = run(g, {
      type: "beat.add",
      episodeId: "ep1",
      beat: {
        title: `${CANARY} title`,
        readAloud: [`${CANARY} read`],
        notes: [`${CANARY} note`],
        checks: [{ skill: `${CANARY} skill`, dc: 77, what: `${CANARY} what`, fail: `${CANARY} fail`, success: `${CANARY} success` }],
        branches: [{ when: `${CANARY} when`, then: `${CANARY} then` }],
        actions: [{ type: "scene", sceneId: "s-artum" }],
      },
    });
    g = run(g, { type: "episode.add", title: `${CANARY} episode` });
    const beatId = g.episodes![0].beats.at(-1)!.id;
    g = run(g, { type: "run.jump", stage: "beat", beat: 15 });
    g = run(g, { type: "run.note", beatId, text: `${CANARY} quick note` });
    g = run(g, { type: "run.recap", sessionId: g.currentSessionId!, text: `${CANARY} unshown recap` });
    return g;
  }
  const leaks = (json: string) =>
    [CANARY, "Just Desserts", "Pudding Gremlin", "Where is everyone", "episodes", "beats", "readAloud", "checks", "branches", "recap\":{", "run\"", "ep1"].filter((x) => json.includes(x));

  it("keeps episodes, beats and session notes out of the TV and player data", () => {
    const g = canaryGame();
    expect(g.live.sceneId).toBe("s-artum"); // the action's effect did reach the TV
    const tv = projectTv(g, 1);
    expect(tv.live.sceneId).toBe("s-artum");
    expect(leaks(JSON.stringify(tv))).toEqual([]);
    expect(tv.recap).toBeNull();
    for (const p of g.players) expect(leaks(JSON.stringify(projectPlayer(g, 1, p.id, [])))).toEqual([]);
  });

  it("keeps them out of the server's TV and player views", async () => {
    const store = createFileStore(null);
    await store.overwrite("t", canaryGame(), []);
    const tv = await viewFor(store, "t", { role: "tv" });
    expect(leaks(JSON.stringify(tv))).toEqual([]);
    const player = await viewFor(store, "t", { role: "player", playerId: "p1" });
    expect(leaks(JSON.stringify(player))).toEqual([]);
    // The DM does get them.
    expect(JSON.stringify(await viewFor(store, "t", DM))).toContain(CANARY);
  });

  it("shows only the recap on the TV, and only while the DM shows it", () => {
    let g = canaryGame();
    const first = g.currentSessionId!;
    g = run(g, { type: "run.recap", sessionId: first, text: "They saved the feast." });
    g = run(g, { type: "session.end" });
    g = run(g, { type: "run.start", episodeId: "ep1" });
    g = run(g, { type: "live.recap", sessionId: first });
    const tv = projectTv(g, 1);
    expect(tv.recap).toEqual({ number: 1, title: "Session 1", text: "They saved the feast." });
    expect(leaks(JSON.stringify(tv)).filter((x) => x !== "recap\":{")).toEqual([]);
    expect(JSON.stringify(projectPlayer(g, 1, "p1", []))).not.toContain("saved the feast");
    g = run(g, { type: "scene.show", sceneId: "s-board" });
    expect(projectTv(g, 2).recap).toBeNull();
  });

  it("keeps the seed episode out of browser code", () => {
    const src = path.resolve(import.meta.dirname, "../src");
    const seed = fs.readFileSync(path.join(src, "server/seed-episodes.ts"), "utf8");
    expect(seed).toMatch(/^import "server-only";/m);
    const files = [...walk(path.join(src, "client")), ...walk(path.join(src, "shared"))];
    for (const f of files) {
      const text = fs.readFileSync(f, "utf8");
      expect(text, f).not.toContain("seed-episodes");
      for (const line of ["Pudding Gremlin", "Where is everyone", "Just Desserts", "one more tiny lantern"]) expect(text, f).not.toContain(line);
    }
  });
});

function* walk(dir: string): Generator<string> {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (/\.tsx?$/.test(e.name)) yield p;
  }
}
