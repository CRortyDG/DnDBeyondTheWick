// The NPC attitude tracker: a dial per person, bands that keep the old trust
// locks working, per-character standing, reasons, and what phones may see.
import { beforeEach, describe, expect, it } from "vitest";
import type { Command } from "@/shared/commands";
import { bandOf, jobPerson, partyScore, relationOf, scoreFor } from "@/shared/attitude";
import { projectPlayer, projectTv } from "@/shared/projection";
import { apply, CommandError, type Ctx } from "@/shared/reducer";
import { seedGame } from "@/shared/seed";
import { assetResolver, parseEpisode, episodeMarkdown } from "@/shared/runsheet";
import type { Actor, GameState } from "@/shared/types";
import { hydrate } from "@/server/store";

const DM: Actor = { role: "dm" };
let g: GameState;
let now = 1000;

function as(actor: Actor, cmd: Command) {
  const r = apply(g, cmd, { now: ++now, actor } as Ctx);
  g = r.state;
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
const ent = (id: string) => g.entries!.find((n) => n.id === id)!;
const pub = (id: string, pid = "p1") => projectPlayer(g, 1, pid, []).entries.find((e) => e.id === id);
const mags = () => ent("e-mags");

beforeEach(() => {
  g = hydrate(seedGame("t"))!;
});

describe("the dial", () => {
  it("falls into five bands", () => {
    expect([-10, -6, -5, -2, -1, 0, 1, 2, 5, 6, 10].map(bandOf)).toEqual(["hostile", "hostile", "wary", "wary", "stranger", "stranger", "stranger", "friendly", "friendly", "ally", "ally"]);
  });

  it("moves with a reason, and the band follows", () => {
    expect(partyScore(mags())).toBe(0);
    dm({ type: "entry.attitude", entryId: "e-mags", delta: 3, reason: "Paid off her debt" });
    expect(mags().attitude).toBe(3);
    expect(mags().relation).toBe("friendly");
    expect(mags().attitudeLog!.at(-1)).toMatchObject({ delta: 3, reason: "Paid off her debt", from: "stranger", to: "friendly", source: "dm" });
    dm({ type: "entry.attitude", entryId: "e-mags", delta: -6, reason: "Broke her stool" });
    expect(mags().relation).toBe("wary");
    expect(pub("e-mags")!.relation).toBe("wary");
  });

  it("stops at the ends and logs what actually moved", () => {
    dm({ type: "entry.attitude", entryId: "e-mags", delta: 20, reason: "" });
    expect(mags().attitude).toBe(10);
    dm({ type: "entry.attitude", entryId: "e-mags", delta: 5, reason: "More" });
    expect(mags().attitudeLog!.at(-1)!.delta).toBe(0);
  });

  it("only moves people", () => {
    expect(fails(DM, { type: "entry.attitude", entryId: "e-lantern", delta: 1, reason: "" })).toMatch(/Only people/);
  });

  it("undo puts it back and takes the line out", () => {
    dm({ type: "entry.attitude", entryId: "e-mags", delta: 4, reason: "Saved her cat" });
    const id = mags().attitudeLog!.at(-1)!.id;
    dm({ type: "entry.attitudeUndo", entryId: "e-mags", shiftId: id });
    expect(partyScore(mags())).toBe(0);
    expect(mags().relation).toBeUndefined();
    expect(mags().attitudeLog).toBeUndefined();
  });
});

describe("picking a band directly", () => {
  it("puts the dial in the middle of it, and keeps old locks working", () => {
    dm({ type: "entry.update", entryId: "e-mags", patch: { relation: "ally" } });
    expect(mags().attitude).toBe(6);
    expect(mags().attitudeLog!.at(-1)).toMatchObject({ source: "set", to: "ally" });
    // Already in the band: nothing moves.
    dm({ type: "entry.attitude", entryId: "e-mags", delta: 2, reason: "" });
    dm({ type: "entry.update", entryId: "e-mags", patch: { relation: "ally" } });
    expect(mags().attitude).toBe(8);
  });

  it("a job lock opens when the dial crosses into Friendly", () => {
    const j = g.jobs!.find((x) => !x.renown)!;
    dm({ type: "job.update", jobId: j.id, patch: { trust: { entryId: "e-orsa", relation: "friendly" } } });
    dm({ type: "job.pin", jobId: j.id, pinned: true } as Command);
    const mine = () => projectPlayer(g, 1, "p1", []).jobs.find((x) => x.id === j.id)!;
    expect(mine().canTake).toBe(false);
    dm({ type: "entry.attitude", entryId: "e-orsa", delta: 1, reason: "" });
    expect(mine().canTake).toBe(false);
    dm({ type: "entry.attitude", entryId: "e-orsa", delta: 1, reason: "Fixed her net" });
    expect(mine().canTake).toBe(true);
  });
});

describe("each character", () => {
  it("can stand apart from the party, and follows the party's moves", () => {
    dm({ type: "entry.attitude", entryId: "e-mags", delta: -4, reason: "Stole a pie", playerIds: ["p1"] });
    expect(relationOf(mags(), "p1")).toBe("wary");
    expect(relationOf(mags())).toBe("stranger");
    expect(mags().relationBy).toEqual({ p1: "wary" });
    expect(pub("e-mags", "p1")!.relation).toBe("wary");
    expect(pub("e-mags", "p2")!.relation).toBe("stranger");
    dm({ type: "entry.attitude", entryId: "e-mags", delta: 4, reason: "Fixed the roof" });
    expect(scoreFor(mags(), "p1")).toBe(0);
    expect(scoreFor(mags(), "p2")).toBe(4);
  });

  it("older per-player bands become offsets", () => {
    const e = mags();
    e.relation = "friendly";
    e.relationBy = { p1: "ally" };
    expect(scoreFor(e, "p1")).toBe(6);
    dm({ type: "entry.attitude", entryId: "e-mags", delta: 1, reason: "" });
    expect(mags().attitudeBy).toEqual({ p1: 3 });
    expect(scoreFor(mags(), "p1")).toBe(7);
  });

  it("'same as the party' clears their own standing", () => {
    dm({ type: "entry.relationFor", entryId: "e-mags", playerId: "p1", relation: "hostile" });
    expect(relationOf(mags(), "p1")).toBe("hostile");
    dm({ type: "entry.relationFor", entryId: "e-mags", playerId: "p1", relation: null });
    expect(mags().attitudeBy).toBeUndefined();
    expect(relationOf(mags(), "p1")).toBe("stranger");
  });
});

describe("what players see", () => {
  it("is the band by default, with no dial and no reasons", () => {
    dm({ type: "entry.attitude", entryId: "e-mags", delta: 3, reason: "Paid off her debt" });
    expect(pub("e-mags")!.relation).toBe("friendly");
    expect(pub("e-mags")!.attitude).toBeUndefined();
    expect(JSON.stringify(projectPlayer(g, 1, "p1", []))).not.toContain("Paid off her debt");
  });

  it("can be nothing at all, or switched off with the feature", () => {
    dm({ type: "attitudes.set", patch: { show: "none" } });
    expect(pub("e-mags")!.relation).toBeUndefined();
    dm({ type: "attitudes.set", patch: { show: "band" } });
    dm({ type: "features.set", off: ["attitudes"] } as Command);
    expect(pub("e-mags")!.relation).toBeUndefined();
  });

  it("with reasons: only their own, never secret ones or band picks", () => {
    dm({ type: "attitudes.set", patch: { show: "reasons" } });
    dm({ type: "entry.attitude", entryId: "e-mags", delta: 2, reason: "Paid off her debt" });
    dm({ type: "entry.attitude", entryId: "e-mags", delta: -1, reason: "Tracked mud in", playerIds: ["p2"] });
    dm({ type: "entry.attitude", entryId: "e-mags", delta: 1, reason: "Knows they're spies", secret: true });
    dm({ type: "entry.update", entryId: "e-mags", patch: { relation: "ally" } });
    const a = pub("e-mags")!.attitude!;
    expect(a.score).toBe(6);
    expect(a.reasons!.map((r) => r.text)).toEqual(["Paid off her debt"]);
    expect(pub("e-mags", "p2")!.attitude!.reasons!.map((r) => r.text)).toEqual(["Tracked mud in", "Paid off her debt"]);
    expect(JSON.stringify(projectPlayer(g, 1, "p1", []))).not.toContain("spies");
    // The DM can hide one after the fact.
    const id = mags().attitudeLog!.find((x) => x.reason === "Paid off her debt")!.id;
    dm({ type: "entry.attitudeSecret", entryId: "e-mags", shiftId: id, secret: true });
    expect(pub("e-mags")!.attitude!.reasons).toEqual([]);
  });

  it("never for rumors, and the log never reaches the TV", () => {
    dm({ type: "entry.attitude", entryId: "e-artum", delta: 3, reason: "Heard good things" });
    expect(pub("e-artum")!.relation).toBeUndefined();
    expect(JSON.stringify(projectTv(g, 1))).not.toContain("Heard good things");
  });
});

describe("the TV", () => {
  it("banners a band change when asked, for people the party has met", () => {
    dm({ type: "entry.attitude", entryId: "e-mags", delta: 1, reason: "", tv: true });
    expect(g.banner?.text ?? "").not.toMatch(/Mags/);
    dm({ type: "entry.attitude", entryId: "e-mags", delta: 1, reason: "", tv: true });
    expect(g.banner!.text).toBe("Mags Wick warms to you. Now Friendly.");
    dm({ type: "entry.attitude", entryId: "e-artum", delta: 5, reason: "", tv: true });
    expect(g.banner!.text).not.toMatch(/Artum/);
  });
});

describe("jobs", () => {
  it("a job done for someone moves their dial", () => {
    dm({ type: "job.add", job: { title: "Find the cat", postedBy: "Mags Wick" } });
    const j = g.jobs!.at(-1)!;
    expect(jobPerson(g, j)!.id).toBe("e-mags");
    dm({ type: "job.done", jobId: j.id, payouts: [] });
    expect(mags().attitude).toBe(1);
    expect(mags().attitudeLog!.at(-1)).toMatchObject({ source: "job", reason: "Did the job: Find the cat" });
  });

  it("can be turned off", () => {
    dm({ type: "attitudes.set", patch: { jobs: 0 } });
    dm({ type: "job.add", job: { title: "Find the cat", postedBy: "Mags Wick" } });
    dm({ type: "job.done", jobId: g.jobs!.at(-1)!.id, payouts: [] });
    expect(mags().attitude).toBeUndefined();
  });
});

describe("run sheets", () => {
  it("read and write mood: lines", () => {
    const p = parseEpisode("## Cat\nmood: person/mags +2 Saved her cat\nmood: person/mags x\nmood: place/x -1", assetResolver({ scenes: [], entries: [] }));
    expect(p.beats[0].actions).toEqual([{ type: "mood", ref: "person/mags", delta: 2, reason: "Saved her cat" }]);
    expect(p.warnings).toHaveLength(2);
    const md = episodeMarkdown({ title: "T", beats: p.beats.map((b, i) => ({ id: String(i), ...b })) }, { scenes: [], entries: [] });
    expect(md).toContain("mood: person/mags +2 Saved her cat");
  });

  it("is a button: landing on the beat doesn't move anyone, tapping it does", () => {
    const beat = { title: "Cat", notes: [], checks: [], branches: [], actions: [{ type: "mood" as const, ref: "person/mags", delta: 2, reason: "Saved her cat" }] };
    dm({ type: "episode.add", title: "Ep", beats: [beat, { ...beat, title: "Two", actions: [] }] });
    const ep = g.episodes!.at(-1)!;
    dm({ type: "session.start" });
    dm({ type: "run.start", episodeId: ep.id });
    dm({ type: "run.next" });
    expect(mags().attitude).toBeUndefined();
    dm({ type: "run.fire", beatId: ep.beats[0].id, index: 0 });
    expect(mags().attitude).toBe(2);
    expect(mags().attitudeLog!.at(-1)).toMatchObject({ source: "beat", reason: "Saved her cat" });
  });
});
