// The episode builder: story beats in run sheets, @mentions, cast, prep, and ticking them off in run-game mode.
import { beforeEach, describe, expect, it } from "vitest";
import type { Command } from "@/shared/commands";
import { STUB_NOTE, isStub } from "@/shared/discovery";
import { castOf, findMentions, mentionsIn, placementsOf, prepOf, resolveMention } from "@/shared/episodeBuilder";
import { projectPlayer, projectTv } from "@/shared/projection";
import { apply, CommandError, type Ctx } from "@/shared/reducer";
import { assetResolver, episodeMarkdown, parseEpisode, storyResolver } from "@/shared/runsheet";
import { seedGame } from "@/shared/seed";
import { storyOf } from "@/shared/story";
import type { Actor, Episode, GameState, StoryBeat } from "@/shared/types";
import { hydrate } from "@/server/store";

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
const sb = (id: string): StoryBeat => storyOf(g).beats.find((b) => b.id === id)!;
const ep = (): Episode => g.episodes![0];
const blocks = (id: string) => placementsOf(g, id);

beforeEach(() => {
  g = hydrate(seedGame("t"))!;
});

describe("placing story beats", () => {
  it("inserts once into the chosen beat, and taking it out returns it to Planned", () => {
    const target = ep().beats[1];
    dm({ type: "episode.placeStory", episodeId: ep().id, storyBeatId: "sb-symbol", beatId: target.id });
    expect(blocks("sb-symbol")).toHaveLength(1);
    expect(blocks("sb-symbol")[0].beat.id).toBe(target.id);
    expect(sb("sb-symbol").status).toBe("placed");
    expect(fails({ type: "episode.placeStory", episodeId: ep().id, storyBeatId: "sb-symbol" })).toMatch(/already placed/);
    expect(blocks("sb-symbol")).toHaveLength(1);
    dm({ type: "episode.unplaceStory", episodeId: ep().id, beatId: target.id, storyBeatId: "sb-symbol" });
    expect(blocks("sb-symbol")).toHaveLength(0);
    expect(sb("sb-symbol").status).toBe("planned");
  });

  it("with no beat picked, goes into a “Story beats” beat at the end (made once)", () => {
    const n = ep().beats.length;
    dm({ type: "episode.placeStory", episodeId: ep().id, storyBeatId: "sb-cold" });
    dm({ type: "episode.placeStory", episodeId: ep().id, storyBeatId: "sb-crypt" });
    expect(ep().beats).toHaveLength(n + 1);
    expect(ep().beats.at(-1)!.title).toBe("Story beats");
    expect(ep().beats.at(-1)!.stories!.map((x) => x.storyBeatId)).toEqual(["sb-cold", "sb-crypt"]);
  });

  it("a repeat beat can sit in more than one place; deleting an episode or a story beat clears its blocks", () => {
    dm({ type: "episode.placeStory", episodeId: ep().id, storyBeatId: "sb-wax", beatId: ep().beats[0].id });
    dm({ type: "episode.placeStory", episodeId: ep().id, storyBeatId: "sb-wax", beatId: ep().beats[2].id });
    expect(blocks("sb-wax")).toHaveLength(2);
    dm({ type: "story.beatRemove", beatId: "sb-wax" });
    expect(blocks("sb-wax")).toHaveLength(0);
    dm({ type: "episode.placeStory", episodeId: ep().id, storyBeatId: "sb-cold" });
    dm({ type: "episode.add", title: "Two" });
    dm({ type: "episode.remove", episodeId: ep().id });
    expect(sb("sb-cold").status).toBe("planned");
  });

  it("round-trips through Markdown: one story: line per block, its facts indented under it", () => {
    dm({ type: "entry.factAdd", entryId: "e-broken-ring", text: "It's a ledger mark." });
    const fact = g.entries!.find((e) => e.id === "e-broken-ring")!.facts.at(-1)!;
    dm({ type: "story.beatUpdate", beatId: "sb-symbol", patch: { links: [...sb("sb-symbol").links, { kind: "fact", entryId: "e-broken-ring", factId: fact.id }] } });
    dm({ type: "episode.placeStory", episodeId: ep().id, storyBeatId: "sb-symbol", beatId: ep().beats[0].id });
    const md = episodeMarkdown(ep(), g);
    expect(md).toContain("story: sb-symbol — The symbol on the baker's recipes\n  fact: mystery/the-broken-ring/");
    const parsed = parseEpisode(md, assetResolver(g), "x", storyResolver(g));
    expect(parsed.warnings).toEqual([]);
    expect(parsed.beats[0].stories).toEqual([{ storyBeatId: "sb-symbol" }]);
    // The indented fact belongs to the story beat: it isn't a beat action that fires on landing.
    expect(parsed.beats[0].actions.some((a) => a.type === "fact")).toBe(false);
    expect(parsed.beats.flatMap((b) => b.stories ?? [])).toHaveLength(1);
    // A title works too.
    expect(parseEpisode("## A\nstory: Someone suddenly lucky", assetResolver(g), "x", storyResolver(g)).beats[0].stories).toEqual([{ storyBeatId: "sb-lucky" }]);
  });
});

describe("running", () => {
  beforeEach(() => {
    dm({ type: "entry.factAdd", entryId: "e-broken-ring", text: "It's a ledger mark." });
    const fact = g.entries!.find((e) => e.id === "e-broken-ring")!.facts.at(-1)!;
    dm({ type: "story.beatUpdate", beatId: "sb-symbol", patch: { links: [{ kind: "fact", entryId: "e-broken-ring", factId: fact.id }] } });
    dm({ type: "episode.placeStory", episodeId: ep().id, storyBeatId: "sb-symbol", beatId: ep().beats[0].id });
    dm({ type: "run.start", episodeId: ep().id });
  });

  it("ticking marks it Played in this session with the outcome, and reveals its facts on the TV", () => {
    const sid = g.currentSessionId!;
    dm({ type: "run.story", episodeId: ep().id, beatId: ep().beats[0].id, storyBeatId: "sb-symbol", done: true, outcome: "They copied the mark." });
    expect(sb("sb-symbol").status).toBe("played");
    expect(sb("sb-symbol").plays).toEqual([{ at: now, sessionId: sid, episodeId: ep().id, outcome: "They copied the mark." }]);
    expect(ep().beats[0].stories![0].done).toEqual({ at: now, sessionId: sid });
    const fact = g.entries!.find((e) => e.id === "e-broken-ring")!.facts.at(-1)!;
    expect(fact.revealedAt).toBe(now);
    expect(g.discovery?.factId).toBe(fact.id);
    // Un-ticking takes the play back (the fact stays revealed).
    dm({ type: "run.story", episodeId: ep().id, beatId: ep().beats[0].id, storyBeatId: "sb-symbol", done: false });
    expect(sb("sb-symbol").plays).toEqual([]);
    expect(sb("sb-symbol").status).toBe("placed");
  });

  it("a beat edited from Markdown keeps its tick", () => {
    dm({ type: "run.story", episodeId: ep().id, beatId: ep().beats[0].id, storyBeatId: "sb-symbol", done: true });
    const b = ep().beats[0];
    const one = parseEpisode(episodeMarkdown({ title: "x", beats: [b] }, g), assetResolver(g), "x", storyResolver(g)).beats[0];
    dm({ type: "beat.update", episodeId: ep().id, beatId: b.id, beat: { ...one, title: "Renamed" } });
    expect(ep().beats[0].stories![0].done).toBeDefined();
    expect(sb("sb-symbol").status).toBe("played");
  });

  it("leftovers at the end: back to Planned, keep for next time, or drop", () => {
    dm({ type: "episode.placeStory", episodeId: ep().id, storyBeatId: "sb-cold" });
    dm({ type: "episode.placeStory", episodeId: ep().id, storyBeatId: "sb-crypt" });
    dm({ type: "episode.leftover", episodeId: ep().id, storyBeatId: "sb-symbol", choice: "planned" });
    dm({ type: "episode.leftover", episodeId: ep().id, storyBeatId: "sb-cold", choice: "keep" });
    dm({ type: "episode.leftover", episodeId: ep().id, storyBeatId: "sb-crypt", choice: "drop" });
    expect(sb("sb-symbol").status).toBe("planned");
    expect(blocks("sb-symbol")).toHaveLength(0);
    expect(sb("sb-cold").status).toBe("placed");
    expect(sb("sb-crypt").status).toBe("dropped");
    expect(blocks("sb-crypt")).toHaveLength(0);
  });

  it("none of it reaches the TV or a phone", () => {
    dm({ type: "run.story", episodeId: ep().id, beatId: ep().beats[0].id, storyBeatId: "sb-symbol", done: true, outcome: "SECRET_OUTCOME_91" });
    dm({ type: "episode.prep", episodeId: ep().id, key: "SECRET_PREP_KEY", state: "done" });
    for (const json of [JSON.stringify(projectTv(g, 1)), ...g.players.map((p) => JSON.stringify(projectPlayer(g, 1, p.id, [])))]) {
      expect(json).not.toContain("SECRET_OUTCOME_91");
      expect(json).not.toContain("SECRET_PREP_KEY");
      expect(json).not.toContain("sb-symbol");
      expect(json).not.toContain("The symbol on the baker");
    }
  });
});

describe("@mentions", () => {
  it("resolve full and short names, flyers by the poster's first name, and monster templates", () => {
    expect(resolveMention(g, "person/mags")?.entry?.id).toBe("e-mags");
    expect(resolveMention(g, "mags")?.entry?.id).toBe("e-mags");
    expect(resolveMention(g, "fennick")?.entry?.id).toBe("e-fennick");
    expect(resolveMention(g, "flyer/rolf")?.job?.id).toBe("j-ransom");
    expect(resolveMention(g, "monster/pudding-gremlin")?.template?.name).toBe("Pudding Gremlin");
    expect(resolveMention(g, "nobody-here")).toBeNull();
    expect(findMentions(g, "fen")[0].ref).toBe("person/fennick");
    expect(mentionsIn(g, "Ask @mags, mail me at a@b.com, see @flyer/rolf").map((m) => m.mention?.ref)).toEqual(["person/mags", "flyer/rolf"]);
  });

  it("“Create as new” makes a hidden stub the mention then finds", () => {
    dm({ type: "entry.add", entry: { kind: "person", name: "Bandit Leader", dmNote: STUB_NOTE } });
    const e = g.entries!.find((x) => x.name === "Bandit Leader")!;
    expect(e.stage).toBe("hidden");
    expect(isStub(e)).toBe(true);
    expect(resolveMention(g, "person/bandit-leader")?.entry?.id).toBe(e.id);
    dm({ type: "entry.add", entry: { kind: "item", name: "Ledger page", dmNote: STUB_NOTE } });
    expect(resolveMention(g, "item/ledger-page")?.entry?.kind).toBe("item");
  });

  it("feed the cast panel and the beat's one-key list", () => {
    const b = ep().beats[0];
    dm({ type: "beat.update", episodeId: ep().id, beatId: b.id, beat: { ...b, notes: [...b.notes, "Watch @person/fennick and @flyer/rolf."] } });
    const cast = castOf(g, ep());
    expect(cast.find((c) => c.entry?.id === "e-fennick")?.from).toContain("@mention");
    expect(cast.find((c) => c.job?.id === "j-ransom")).toBeDefined();
  });
});

describe("the prep checklist", () => {
  const keys = () => prepOf(g, ep()).map((p) => p.key);
  const texts = () => prepOf(g, ep()).map((p) => p.text);

  it("asks for a portrait, a monster template and a pinned flyer, and each goes away once it's there", () => {
    const b = ep().beats[0];
    dm({ type: "entry.add", entry: { kind: "monster", name: "Bandit leader", dmNote: STUB_NOTE } });
    dm({ type: "beat.update", episodeId: ep().id, beatId: b.id, beat: { ...b, notes: [...b.notes, "@person/fennick waves. @monster/bandit-leader sneers. @flyer/rolf flaps."] } });
    expect(texts()).toEqual(expect.arrayContaining(["Fennick has no portrait.", "Bandit leader is mentioned but has no monster template.", "Rolf's flyer isn't pinned.", "Bandit leader is a stub. Fill in their monster entry."]));
    dm({ type: "job.pin", jobId: "j-ransom", pinned: true });
    expect(texts()).not.toContain("Rolf's flyer isn't pinned.");
    const pudding = g.monsters!.find((m) => m.name === "Pudding Gremlin")!;
    const bandit = g.entries!.find((e) => e.name === "Bandit leader")!;
    dm({ type: "entry.update", entryId: bandit.id, patch: { dmNote: "Leads the twin-tower gang." } } as Command);
    g.entries!.find((e) => e.id === bandit.id)!.templateId = pudding.id;
    expect(texts()).not.toContain("Bandit leader is mentioned but has no monster template.");
    expect(texts()).not.toContain("Bandit leader is a stub. Fill in their monster entry.");
  });

  it("warns about After and a missing fact, and the warning goes once the beat is played", () => {
    dm({ type: "episode.placeStory", episodeId: ep().id, storyBeatId: "sb-lucky" });
    expect(texts()).toContain("Beat “Someone suddenly lucky” must come after “The symbol on the baker's recipes” (not played yet).");
    dm({ type: "episode.placeStory", episodeId: ep().id, storyBeatId: "sb-symbol", beatId: ep().beats[0].id });
    // Placed earlier in the same episode is fine.
    expect(keys()).not.toContain("after:sb-lucky:sb-symbol");
    dm({ type: "episode.placeStory", episodeId: ep().id, storyBeatId: "sb-rule" });
    expect(texts()).toContain("“The rule: a page only burns in a fire lit for someone else” is a reveal, but the fact it reveals isn't written yet.");
    dm({ type: "entry.factAdd", entryId: "e-broken-ring", text: "Only a fire lit for someone else burns a page." });
    const f = g.entries!.find((e) => e.id === "e-broken-ring")!.facts.at(-1)!;
    dm({ type: "story.beatUpdate", beatId: "sb-rule", patch: { links: [{ kind: "fact", entryId: "e-broken-ring", factId: f.id }] } });
    expect(keys()).not.toContain("fact:sb-rule");
  });

  it("warns when the episode's date is after a must-happen-by date, and flags a TBD", () => {
    dm({ type: "story.dateAdd", date: "2027-01-20" });
    dm({ type: "story.dateUpdate", dateId: storyOf(g).dates[0].id, episodeId: ep().id });
    dm({ type: "story.beatUpdate", beatId: "sb-frozen", patch: { by: "2027-01-10" } });
    dm({ type: "episode.placeStory", episodeId: ep().id, storyBeatId: "sb-frozen" });
    expect(keys()).toEqual(expect.arrayContaining(["by:sb-frozen", "tbd:sb-frozen"]));
  });

  it("ticks and dismissals stick, and can be undone", () => {
    dm({ type: "episode.prep", episodeId: ep().id, key: "portrait:e-fennick", state: "dismissed" });
    expect(ep().prep).toEqual({ "portrait:e-fennick": "dismissed" });
    dm({ type: "episode.prep", episodeId: ep().id, key: "portrait:e-fennick", state: null });
    expect(ep().prep).toEqual({});
  });
});
