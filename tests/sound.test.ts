// Sound on the TV: the soundboard's state, what the TV and phones get, run sheet lines, and the TV's mix rules.
import { beforeEach, describe, expect, it } from "vitest";
import { dmCommand, playerCommand, type Command } from "@/shared/commands";
import { projectPlayer, projectTv } from "@/shared/projection";
import { apply, type Ctx } from "@/shared/reducer";
import { seedGame } from "@/shared/seed";
import { parseEpisode, beatMarkdown } from "@/shared/runsheet";
import { AMBIENT_SOUND, findMix, findSfx, LAYER_IDS, MIX_GROUPS, MIXES, SFX, SFX_GROUPS, SFX_IDS } from "@/shared/sound";
import { AMBIENT_IDS } from "@/shared/ambient";
import { BATTLE_LEVEL, duckFor, stingerBed, tableBed, tableMix } from "@/client/sound/tableMix";
import { LAYER_MAKERS } from "@/client/sound/layers";
import { SFX_MAKERS } from "@/client/sound/sfx";
import type { Actor, GameState } from "@/shared/types";
import type { TvSound } from "@/shared/projection";

const DM: Actor = { role: "dm" };
let g: GameState;
let now = 1000;
const dm = (cmd: Command) => {
  g = apply(g, dmCommand.parse(cmd) as Command, { now: ++now, actor: DM } as Ctx).state;
};

beforeEach(() => {
  g = seedGame("test");
});

describe("the soundboard", () => {
  it("starts quiet with moments on, and the TV gets that", () => {
    const s = projectTv(g, 1).sound;
    expect(s).toEqual({ volume: 0.8, muted: false, auto: true, layers: {}, fade: 3 });
  });

  it("plays a mix, changes one layer, and stops everything", () => {
    dm({ type: "sound.mix", layers: { "tavern-jig": 0.55, crowd: 0.7 }, fade: 8, mix: "tavern" });
    expect(g.sound).toMatchObject({ layers: { "tavern-jig": 0.55, crowd: 0.7 }, fade: 8, mix: "tavern" });
    dm({ type: "sound.layer", id: "rain", volume: 0.4, fade: 1 });
    expect(g.sound!.layers).toEqual({ "tavern-jig": 0.55, crowd: 0.7, rain: 0.4 });
    expect(g.sound!.mix).toBeUndefined(); // changed by hand
    dm({ type: "sound.layer", id: "crowd", volume: 0 });
    expect(g.sound!.layers).toEqual({ "tavern-jig": 0.55, rain: 0.4 });
    dm({ type: "sound.mix", layers: {} });
    expect(projectTv(g, 1).sound.layers).toEqual({});
  });

  it("sets volume, mute and moments", () => {
    dm({ type: "sound.set", volume: 0.333, muted: true, auto: false });
    expect(projectTv(g, 1).sound).toMatchObject({ volume: 0.33, muted: true, auto: false });
    dm({ type: "sound.set", muted: false, auto: true });
    expect(g.sound!.muted).toBeUndefined();
    expect(g.sound!.autoOff).toBeUndefined();
  });

  it("numbers each one-shot so the TV plays it once", () => {
    dm({ type: "sound.cue", id: "sword-clash" });
    const a = projectTv(g, 1).sound.cue!;
    dm({ type: "sound.cue", id: "sword-clash" });
    const b = projectTv(g, 1).sound.cue!;
    expect(a.id).toBe("sword-clash");
    expect(b.n).toBeGreaterThan(a.n);
  });

  it("refuses unknown sounds, bad volumes, and players", () => {
    expect(dmCommand.safeParse({ type: "sound.cue", id: "airhorn" }).success).toBe(false);
    expect(dmCommand.safeParse({ type: "sound.layer", id: "rain", volume: 2 }).success).toBe(false);
    expect(dmCommand.safeParse({ type: "sound.mix", layers: { nope: 0.5 } }).success).toBe(false);
    expect(playerCommand.safeParse({ type: "sound.cue", id: "dice" }).success).toBe(false);
  });

  it("is the TV's business only: phones get none of it", () => {
    dm({ type: "sound.mix", layers: { battle: 0.8 } });
    const p = g.players[0];
    if (p) expect(projectPlayer(g, 1, p.id, [])).not.toHaveProperty("sound");
  });
});

describe("run sheets", () => {
  it("reads sound: and sfx: lines and writes them back", () => {
    const p = parseEpisode("## The inn\nsound: Busy tavern\nsfx: war horn\nsound: thunderstorm\nsound: off", () => null);
    expect(p.beats[0].actions).toEqual([
      { type: "sound", mix: "tavern" },
      { type: "sfx", id: "horn" },
      { type: "sound", mix: "layer/storm" },
      { type: "sound", mix: "off" },
    ]);
    const md = beatMarkdown(p.beats[0], { scenes: [], entries: [] } as never);
    expect(md).toContain("sound: tavern");
    expect(md).toContain("sfx: horn");
    expect(md).toContain("sound: layer/storm");
    // And it reads back the same.
    expect(parseEpisode(md, () => null).beats[0].actions).toEqual(p.beats[0].actions);
    expect(md).toContain("sound: off");
  });

  it("keeps a sound line it doesn't know as a note", () => {
    const p = parseEpisode("## A\nsound: kazoo orchestra", () => null);
    expect(p.beats[0].actions).toEqual([]);
    expect(p.beats[0].notes).toContain("sound: kazoo orchestra");
    expect(p.warnings.join()).toMatch(/no sound called/);
  });

  it("plays them on the TV when the beat comes up", () => {
    const p = parseEpisode("## Start\n> Hello.\n## The fight\nsound: battle\nsfx: roar\n## After\nsound: off", () => null);
    dm({ type: "episode.add", title: "Sound test", beats: p.beats } as Command);
    const ep = g.episodes!.at(-1)!;
    dm({ type: "session.start" });
    dm({ type: "run.start", episodeId: ep.id });
    dm({ type: "run.next" });
    dm({ type: "run.next" });
    expect(g.sound!.layers).toEqual({ battle: 0.8 });
    expect(g.sound!.cue!.id).toBe("roar");
    dm({ type: "run.next" });
    expect(g.sound!.layers).toEqual({});
  });

  it("keeps tap sounds as buttons on the beat until the DM plays them", () => {
    const p = parseEpisode("## Start\n> Hello.\n## The cave\nsound: dungeon\nsfx: roar (tap)\nsound: storm (tap)", () => null);
    expect(p.beats[1].actions).toEqual([
      { type: "sound", mix: "dungeon" },
      { type: "sfx", id: "roar", tap: true },
      { type: "sound", mix: "storm", tap: true },
    ]);
    expect(beatMarkdown(p.beats[1], { scenes: [], entries: [] } as never)).toContain("sfx: roar (tap)");
    dm({ type: "episode.add", title: "Tap test", beats: p.beats } as Command);
    const ep = g.episodes!.at(-1)!;
    dm({ type: "session.start" });
    dm({ type: "run.start", episodeId: ep.id });
    dm({ type: "run.next" });
    const before = g.sound?.cue?.n;
    dm({ type: "run.next" });
    expect(g.sound!.mix).toBe("dungeon"); // the landing sound played
    expect(g.sound!.cue?.n).toBe(before); // the tap ones didn't
    dm({ type: "run.fire", beatId: ep.beats[1].id, index: 1 });
    expect(g.sound!.cue!.id).toBe("roar");
    dm({ type: "run.fire", beatId: ep.beats[1].id, index: 2 });
    expect(g.sound!.mix).toBe("storm");
  });

  it("finds mixes and effects by name", () => {
    expect(findMix("Wizard's study")).toBe("study");
    expect(findMix("silence")).toBe("off");
    expect(findMix("Night crickets")).toBe("layer/night");
    expect(findMix("rain")).toBe("rain");
    expect(findMix("layer/rain")).toBe("layer/rain");
    expect(findMix("layer rain")).toBe("layer/rain");
    expect(findSfx("Swords clash")).toBe("sword-clash");
    expect(findSfx("nope")).toBeNull();
  });
});

describe("what the TV plays", () => {
  const base = (over: Partial<TvSound> = {}): TvSound => ({ volume: 0.8, muted: false, auto: true, layers: {}, fade: 3, ...over });

  it("plays the scene's bed when the soundboard is quiet", () => {
    expect(tableMix({ sound: base(), kind: "ambient", ambientId: "rainy-night", fighting: false })).toEqual(AMBIENT_SOUND["rainy-night"]);
    expect(tableMix({ sound: base(), kind: "notice", fighting: false })).toEqual({});
  });

  it("lets the DM's layers win, and adds battle drums to a fight with no music", () => {
    expect(tableMix({ sound: base({ layers: { rain: 0.5 } }), kind: "ambient", ambientId: "tavern-crowd", fighting: false })).toEqual({ rain: 0.5 });
    expect(tableMix({ sound: base({ layers: { rain: 0.5 } }), kind: "map", fighting: true })).toEqual({ rain: 0.5, battle: BATTLE_LEVEL });
    expect(tableMix({ sound: base({ layers: { tension: 0.5 } }), kind: "map", fighting: true })).toEqual({ tension: 0.5 });
  });

  it("swaps a scene's music for battle drums in a fight, keeping its ambience quieter", () => {
    const m = tableMix({ sound: base(), kind: "ambient", ambientId: "tavern-crowd", fighting: true });
    expect(m.battle).toBe(BATTLE_LEVEL);
    expect(m["tavern-jig"]).toBeUndefined();
    expect(m.crowd).toBeCloseTo(0.42);
  });

  it("plays only the DM's layers with moments off", () => {
    expect(tableMix({ sound: base({ auto: false }), kind: "ambient", ambientId: "campfire", fighting: true })).toEqual({});
  });

  it("fills the tavern as seats are claimed on the Table", () => {
    const empty = tableBed(0, 5);
    const half = tableBed(3, 5);
    const full = tableBed(5, 5);
    expect(empty.crowd!).toBeLessThan(half.crowd!);
    expect(half.crowd!).toBeLessThan(full.crowd!);
    expect(full["tavern-jig"]!).toBeGreaterThan(empty["tavern-jig"]!);
    expect(tableMix({ sound: base(), kind: "table", seats: { lit: 5, total: 5 }, fighting: false })).toEqual(full);
  });

  it("scores the stinger and turns down under a clip", () => {
    expect(stingerBed(1).crowd).toBeGreaterThan(0);
    expect(stingerBed(7)).toEqual({});
    expect(stingerBed(12).night).toBeGreaterThan(0);
    expect(duckFor("video")).toBeLessThan(1);
    expect(duckFor("map")).toBe(1);
  });
});

describe("the catalog", () => {
  it("has a maker for every layer and one-shot, and every mix and scene bed uses real layers", () => {
    for (const id of LAYER_IDS) expect(LAYER_MAKERS[id], id).toBeTypeOf("function");
    for (const id of SFX_IDS) expect(SFX_MAKERS[id], id).toBeTypeOf("function");
    for (const m of MIXES) for (const id of Object.keys(m.layers)) expect(LAYER_IDS as string[]).toContain(id);
    for (const id of AMBIENT_IDS) expect(AMBIENT_SOUND[id], id).toBeDefined();
    for (const bed of Object.values(AMBIENT_SOUND)) for (const id of Object.keys(bed)) expect(LAYER_IDS as string[]).toContain(id);
  });

  it("keeps ids unique and every mix and effect in a group the soundboard shows", () => {
    expect(new Set(MIXES.map((m) => m.id)).size).toBe(MIXES.length);
    expect(new Set(LAYER_IDS).size).toBe(LAYER_IDS.length);
    expect(new Set(SFX_IDS).size).toBe(SFX_IDS.length);
    const mg = MIX_GROUPS.map((x) => x.id) as string[];
    for (const m of MIXES) expect(mg, m.id).toContain(m.group);
    const sg = SFX_GROUPS.map((x) => x.id) as string[];
    for (const x of SFX) expect(sg, x.id).toContain(x.group);
  });

  it("finds the place mixes from run sheet lines", () => {
    expect(findMix("The docks")).toBe("docks");
    expect(findMix("docks")).toBe("docks");
    expect(findMix("Aboard ship")).toBe("aboard");
    expect(findMix("Feast hall")).toBe("feast");
    expect(findMix("Winterfest")).toBe("winterfest");
    expect(findMix("Dark woods")).toBe("dark-woods");
    expect(findMix("layer/ship")).toBe("layer/ship");
    expect(findMix("sea shanty")).toBe("layer/shanty");
    expect(findSfx("Ship's bell")).toBe("ship-bell");
    expect(findSfx("ships bell")).toBe("ship-bell");
    expect(findSfx("ship-bell")).toBe("ship-bell");
    expect(findSfx("shop door bell")).toBe("shop-bell");
  });
});
