// The storyboard: DM-only story beats, threads and session dates.
import { beforeEach, describe, expect, it } from "vitest";
import type { Command } from "@/shared/commands";
import { projectDm, projectPlayer, projectTv } from "@/shared/projection";
import { apply, CommandError, type Ctx } from "@/shared/reducer";
import { seedGame } from "@/shared/seed";
import { backstoryThreadId, beatWarnings, boardColumns, columnOf, datesFrom, storyOf, threadLabel, windowLabel } from "@/shared/story";
import type { Actor, GameState, StoryBeat } from "@/shared/types";
import { hydrate } from "@/server/store";

const DM: Actor = { role: "dm" };
const CANARY = "CANARY_STORY_ONLY_4e1b";

let g: GameState;
let now = 1000;
function as(actor: Actor, cmd: Command) {
  const r = apply(g, cmd, { now: ++now, actor } as Ctx);
  g = r.state;
  return r;
}
const dm = (cmd: Command) => as(DM, cmd);
function fails(cmd: Command, actor: Actor = DM): string {
  try {
    as(actor, cmd);
  } catch (e) {
    if (e instanceof CommandError) return e.message;
    throw e;
  }
  throw new Error("expected the command to fail");
}
const beat = (id: string): StoryBeat => storyOf(g).beats.find((b) => b.id === id)!;

beforeEach(() => {
  g = hydrate(seedGame("t"))!;
});

describe("seed", () => {
  it("adds the four threads, a Backstory lane per player, and every seed beat", () => {
    const st = storyOf(g);
    const names = st.threads.map((t) => threadLabel(t, g.players));
    expect(names.slice(0, 4)).toEqual(["The Merchant", "Mags's Candle", "Baldur's Gate", "Candlefair"]);
    const lanes = st.threads.filter((t) => t.kind === "backstory");
    expect(lanes.length).toBe(g.players.filter((p) => !p.archived && !p.dropIn).length);
    expect(st.beats.filter((b) => b.threadId === "th-merchant")).toHaveLength(11);
    expect(st.beats.filter((b) => b.threadId === "th-candle")).toHaveLength(5);
    expect(st.beats.filter((b) => b.threadId === "th-baldurs-gate")).toHaveLength(3);
    expect(st.beats.filter((b) => b.threadId === "th-candlefair")).toHaveLength(4);
    expect(st.beats.every((b) => b.status === "planned")).toBe(true);
  });

  it("links existing entries, the ransom flyer and the shop projects, and makes hidden stubs for the rest", () => {
    expect(beat("sb-rolf").links).toEqual(
      expect.arrayContaining([
        { kind: "job", id: "j-ransom" },
        { kind: "entry", id: "e-rolf" },
        { kind: "entry", id: "e-mardon" },
      ]),
    );
    expect(beat("sb-temple-roof").links).toEqual([{ kind: "item", id: "i40" }]);
    expect(beat("sb-wax").links).toEqual([
      { kind: "entry", id: "e-mags" },
      { kind: "entry", id: "e-candle" },
    ]);
    for (const id of ["e-mardon", "e-rolf", "e-adon", "e-eomane", "e-warlocks-crypt"]) expect(g.entries!.find((e) => e.id === id)?.stage).toBe("hidden");
  });

  it("uses the named windows", () => {
    expect(windowLabel(beat("sb-symbol").window)).toBe("Winterfest Y1");
    expect(windowLabel(beat("sb-frozen").window)).toBe("End of Winterfest Y1");
    expect(windowLabel(beat("sb-rolf").window)).toBe("After Winterfest Y1");
    expect(windowLabel(beat("sb-mags-page").window)).toBe("Fall or Winterfest Y2");
    expect(beat("sb-wax").window).toBe("anytime");
    expect(beat("sb-wax").repeat).toBe(true);
  });

  it("runs once, so a deleted beat stays deleted", () => {
    dm({ type: "story.beatRemove", beatId: "sb-cold" });
    g = hydrate(g)!;
    expect(beat("sb-cold")).toBeUndefined();
  });

  it("doesn't duplicate an entry the DM already made", () => {
    const fresh = seedGame("t");
    fresh.entries = [{ id: "mine", kind: "person", slug: "mardon", name: "Mardon", title: "", summary: "", nickname: "", hint: "", stage: "hidden", areas: [], links: [], facts: [], dmNote: "", secrets: "" }];
    g = hydrate(fresh)!;
    expect(g.entries!.filter((e) => e.slug === "mardon")).toHaveLength(1);
    expect(beat("sb-mardon").links).toContainEqual({ kind: "entry", id: "mine" });
  });

  it("adds a Backstory lane for a new player, named after their character", () => {
    dm({ type: "player.add", name: "Wren" } as Command);
    const p = g.players.find((x) => x.name === "Wren")!;
    g = hydrate(g)!;
    const lane = storyOf(g).threads.find((t) => t.id === backstoryThreadId(p.id))!;
    expect(threadLabel(lane, g.players)).toBe("Backstory: Wren");
    g.players.find((x) => x.id === p.id)!.character = "Brin Ashcombe";
    expect(threadLabel(lane, g.players)).toBe("Backstory: Brin Ashcombe");
  });
});

describe("spoiler safety", () => {
  it("nothing from beats, threads, dates or outcomes reaches the TV, a phone or the Chronicle", () => {
    dm({ type: "session.start" });
    dm({ type: "story.threadAdd", thread: { name: `${CANARY} thread`, description: `${CANARY} desc`, goal: `${CANARY} goal` } });
    const th = storyOf(g).threads.at(-1)!.id;
    dm({ type: "story.beatAdd", beat: { threadId: th, title: `${CANARY} title`, summary: `${CANARY} summary`, dmNotes: `${CANARY} notes`, window: "anytime" } });
    const b = storyOf(g).beats.at(-1)!.id;
    dm({ type: "story.beatStatus", beatId: b, status: "played", outcome: `${CANARY} outcome` });
    dm({ type: "story.beatStatus", beatId: "sb-symbol", status: "played", outcome: `${CANARY} they let it go` });
    dm({ type: "story.datesGenerate", start: "2026-12-05", every: 14 });
    dm({ type: "session.end" });

    const tv = JSON.stringify(projectTv(g, 1));
    const phones = g.players.map((p) => JSON.stringify(projectPlayer(g, 1, p.id, [])));
    for (const json of [tv, ...phones]) {
      expect(json).not.toContain(CANARY);
      expect(json).not.toContain("story");
      expect(json).not.toContain("The symbol on the baker");
      expect(json).not.toContain("Mardon Rueh");
      expect(json).not.toContain("Warlock");
    }
    // The DM sees all of it.
    expect(JSON.stringify(projectDm(g, 1, []))).toContain(`${CANARY} outcome`);
  });

  it("players can't send story commands", () => {
    const pid = g.players[0].id;
    expect(fails({ type: "story.board", zoom: "season" }, { role: "player", playerId: pid })).toMatch(/Only the DM/);
  });
});

describe("threads", () => {
  it("adds, renames, reorders and removes, moving its beats", () => {
    dm({ type: "story.threadAdd", thread: { name: "  The   Wolves " } });
    const t = storyOf(g).threads.at(-1)!;
    expect(t.name).toBe("The Wolves");
    dm({ type: "story.beatAdd", beat: { threadId: t.id, title: "Howling" } });
    expect(fails({ type: "story.threadRemove", threadId: t.id })).toMatch(/Move or remove its beats/);
    dm({ type: "story.threadRemove", threadId: t.id, moveTo: "th-merchant" });
    expect(storyOf(g).threads.some((x) => x.id === t.id)).toBe(false);
    expect(storyOf(g).beats.at(-1)!.threadId).toBe("th-merchant");
    dm({ type: "story.threadMove", threadId: "th-candle", dir: -1 });
    expect(storyOf(g).threads[0].id).toBe("th-candle");
  });

  it("keeps a Backstory lane while its player is at the table", () => {
    const lane = storyOf(g).threads.find((t) => t.kind === "backstory")!;
    expect(fails({ type: "story.threadRemove", threadId: lane.id })).toMatch(/Backstory/);
  });
});

describe("beats", () => {
  it("duplicates as a second version in the same place", () => {
    dm({ type: "story.beatDuplicate", beatId: "sb-lucky" });
    const st = storyOf(g);
    const i = st.beats.findIndex((b) => b.id === "sb-lucky");
    const copy = st.beats[i + 1];
    expect(copy.title).toBe("Someone suddenly lucky (version 2)");
    expect(copy.variantOf).toBe("sb-lucky");
    expect(copy.window).toEqual(beat("sb-lucky").window);
    expect(copy.links).toEqual(beat("sb-lucky").links);
  });

  it("marks played with the session and an outcome, and un-ticking takes the play back", () => {
    dm({ type: "session.start" });
    const sid = g.currentSessionId;
    dm({ type: "story.beatStatus", beatId: "sb-symbol", status: "played", outcome: "They kept the recipe." });
    expect(beat("sb-symbol").status).toBe("played");
    expect(beat("sb-symbol").plays).toEqual([{ at: now, sessionId: sid, outcome: "They kept the recipe." }]);
    dm({ type: "story.beatStatus", beatId: "sb-symbol", status: "planned" });
    expect(beat("sb-symbol").plays).toEqual([]);
  });

  it("a repeat beat stays Planned and logs every play", () => {
    dm({ type: "story.beatStatus", beatId: "sb-wax", status: "played" });
    dm({ type: "story.beatStatus", beatId: "sb-wax", status: "played" });
    expect(beat("sb-wax").status).toBe("planned");
    expect(beat("sb-wax").plays).toHaveLength(2);
  });

  it("refuses an After loop and a missing link", () => {
    expect(fails({ type: "story.beatUpdate", beatId: "sb-symbol", patch: { after: ["sb-finale"] } })).toMatch(/loop/);
    expect(fails({ type: "story.beatUpdate", beatId: "sb-symbol", patch: { after: ["sb-symbol"] } })).toMatch(/itself/);
    expect(fails({ type: "story.beatUpdate", beatId: "sb-symbol", patch: { links: [{ kind: "entry", id: "nope" }] } })).toMatch(/isn't there/);
  });

  it("removing a beat drops it from others' After", () => {
    dm({ type: "story.beatRemove", beatId: "sb-symbol" });
    expect(beat("sb-stinger").after).toEqual([]);
  });

  it("drags between columns and threads", () => {
    dm({ type: "story.beatUpdate", beatId: "sb-cold", patch: { window: { from: "2027-10", to: "2027-10" }, threadId: "th-candlefair" } });
    expect(beat("sb-cold").threadId).toBe("th-candlefair");
    expect(columnOf(beat("sb-cold"), boardColumns("month"))).toBe("2027-10");
    expect(columnOf(beat("sb-cold"), boardColumns("season"))).toBe("fall");
    dm({ type: "story.beatUpdate", beatId: "sb-cold", patch: { window: null } });
    expect(columnOf(beat("sb-cold"), boardColumns("month"))).toBe("floating");
  });
});

describe("warnings", () => {
  const warn = (id: string, today: string) => beatWarnings(storyOf(g), beat(id), today).map((w) => w.kind);

  it("After: placed on the board before the beat it waits for, or played before it", () => {
    expect(warn("sb-noticed", "2026-11-14")).toEqual([]);
    dm({ type: "story.beatUpdate", beatId: "sb-noticed", patch: { window: { from: "2027-03", to: "2027-03" } } });
    dm({ type: "story.beatUpdate", beatId: "sb-lucky", patch: { window: { from: "2027-05", to: "2027-05" } } });
    expect(warn("sb-noticed", "2026-11-14")).toEqual(["after"]);
    dm({ type: "story.beatStatus", beatId: "sb-noticed", status: "played" });
    expect(beatWarnings(storyOf(g), beat("sb-noticed"), "2026-11-14")[0].text).toMatch(/Played before “Someone suddenly lucky”/);
    dm({ type: "story.beatStatus", beatId: "sb-lucky", status: "played" });
    expect(warn("sb-noticed", "2026-11-14")).toEqual([]);
  });

  it("must happen by: overdue after the date, and when no session is left before it", () => {
    dm({ type: "story.beatUpdate", beatId: "sb-frozen", patch: { by: "2027-01-10" } });
    expect(warn("sb-frozen", "2026-12-01")).toEqual([]);
    expect(warn("sb-frozen", "2027-01-11")).toContain("overdue");
    dm({ type: "story.dateAdd", date: "2027-02-01" });
    expect(warn("sb-frozen", "2026-12-01")).toEqual(["overdue"]);
    dm({ type: "story.dateAdd", date: "2027-01-02" });
    expect(warn("sb-frozen", "2026-12-01")).toEqual([]);
    dm({ type: "story.beatStatus", beatId: "sb-frozen", status: "played" });
    // Played, so never overdue; but it went ahead of the stinger it waits for.
    expect(warn("sb-frozen", "2027-03-01")).toEqual(["after"]);
    dm({ type: "story.beatStatus", beatId: "sb-stinger", status: "played" });
    expect(warn("sb-frozen", "2027-03-01")).toEqual([]);
  });

  it("a passed window warns once the month is over", () => {
    expect(warn("sb-lucky", "2027-06-01")).toEqual(["window"]);
    dm({ type: "story.beatStatus", beatId: "sb-lucky", status: "dropped" });
    expect(warn("sb-lucky", "2027-06-01")).toEqual([]);
  });
});

describe("session dates", () => {
  it("every two weeks from a start through December 2027, then add, move, cancel", () => {
    expect(datesFrom("2026-12-05", 14).slice(0, 3)).toEqual(["2026-12-05", "2026-12-19", "2027-01-02"]);
    dm({ type: "story.datesGenerate", start: "2026-12-05", every: 14 });
    const d = storyOf(g).dates;
    expect(d.length).toBe(datesFrom("2026-12-05", 14).length);
    expect(d.at(-1)!.date <= "2027-12-31").toBe(true);
    expect(fails({ type: "story.datesGenerate", start: "2026-12-05", every: 14 })).toMatch(/already/);
    dm({ type: "story.dateUpdate", dateId: d[1].id, date: "2026-12-20" });
    dm({ type: "story.dateUpdate", dateId: d[2].id, cancelled: true });
    expect(storyOf(g).dates[1].date).toBe("2026-12-20");
    expect(storyOf(g).dates[2].cancelled).toBe(true);
    expect(fails({ type: "story.dateAdd", date: "2026-12-20" })).toMatch(/already/);
    expect(fails({ type: "story.dateAdd", date: "2027-02-30" })).toMatch(/doesn't exist/);
  });
});
