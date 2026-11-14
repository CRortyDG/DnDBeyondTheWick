// Assets: everything the TV shows is reached by a short ref from where it lives
// (Discovery, maps, props, screens), through the quick bar, the finder and run
// sheets. Old campaigns move over without changing what their keys and beats do.
import { beforeEach, describe, expect, it } from "vitest";
import type { Command } from "@/shared/commands";
import { beatSuggestions, findAssets, liveRef, mentions, quickOf, resolveRef } from "@/shared/assets";
import { projectPlayer, projectTv } from "@/shared/projection";
import { apply, CommandError, type Ctx } from "@/shared/reducer";
import { assetResolver, episodeMarkdown, parseEpisode } from "@/shared/runsheet";
import { seedGame } from "@/shared/seed";
import type { Actor, GameState, Scene } from "@/shared/types";
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
const ent = (id: string) => g.entries!.find((n) => n.id === id)!;
const scene = (id: string) => g.scenes.find((x) => x.id === id)!;
const beat = (i: number) => g.episodes![0].beats[i];

beforeEach(() => {
  g = hydrate(seedGame("t"))!;
});

describe("moving an existing campaign over", () => {
  it("puts the old hotkeys on the quick bar, on the same keys", () => {
    const q = quickOf(g);
    expect(q[1]).toBe("board");
    expect(q[2]).toBe("person/artum");
    expect(q[3]).toBe("person/mags");
    expect(q[4]).toBe("person/the-chef");
    expect(q[5]).toBe("prop/artums-notice");
    expect(q[6]).toBe("map/candlefair");
    expect(q[7]).toBe("prop/extra-image");
    expect(q[8]).toBe("prop/symbol");
    expect(q[9]).toBe("map/sword-coast");
    expect(q[0]).toBe("black");
    expect(g.scenes.every((x) => x.hotkey === undefined && !!x.slug)).toBe(true);
    // Every slot resolves to the scene its key used to show.
    for (const [k, id] of [[2, "s-artum"], [6, "s-map"], [8, "s-symbol"], [0, "s-black"]] as const) expect(resolveRef(g, q[k])!.scene!.id).toBe(id);
  });

  it("turns run-sheet scene actions into show refs (people by name, not by scene)", () => {
    const all = g.episodes![0].beats.flatMap((b) => b.actions);
    expect(all.some((a) => a.type === "scene")).toBe(false);
    expect(all).toContainEqual({ type: "show", ref: "map/candlefair" });
    expect(all).toContainEqual({ type: "show", ref: "person/artum" });
    expect(all).toContainEqual({ type: "show", ref: "person/the-chef" });
    expect(all).toContainEqual({ type: "show", ref: "prop/symbol" });
  });

  it("is safe to run again", () => {
    const once = structuredClone(g);
    expect(hydrate(structuredClone(g))).toEqual(once);
  });

  it("makes a person of a portrait nobody owns, and keeps a run on its beat", () => {
    // An older save: the assets upgrade hasn't run, a portrait was added after Discovery, and a session is mid-episode.
    const old = structuredClone(g) as GameState;
    old.upgrades = old.upgrades!.filter((u) => u !== "assets");
    delete old.quick;
    const extra: Scene = { id: "s-hannet", label: "Hannet", kind: "portrait", hotkey: 7, reveal: false, art: {}, name: "Old Hannet", title: "The smith", known: true };
    old.scenes = old.scenes.map((x) => (x.id === "s-extra" ? { ...x, hotkey: null } : x));
    old.scenes.push(extra);
    old.sessions.push({ id: "sx", number: 1, title: "Session 1", startedAt: 1, endedAt: null, attendeeIds: [], run: { episodeId: "ep1", stage: "beat", beat: 2, notes: {} } });
    old.currentSessionId = "sx";
    old.episodes![0].beats[0].actions = [{ type: "scene", sceneId: "s-hannet" }];
    for (const sc of old.scenes) delete sc.slug;
    g = hydrate(old)!;
    const hannet = g.entries!.find((e) => e.sceneId === "s-hannet")!;
    expect(hannet).toMatchObject({ kind: "person", name: "Old Hannet", title: "The smith", stage: "found" });
    expect(quickOf(g)[7]).toBe(`person/${hannet.slug}`);
    expect(beat(0).actions).toEqual([{ type: "show", ref: `person/${hannet.slug}` }]);
    expect(g.sessions.find((x) => x.id === "sx")!.run!.beat).toBe(2);
  });
});

describe("Show", () => {
  it("shows a person's picture, and finds them like a portrait always did", () => {
    expect(ent("e-artum").stage).toBe("rumored");
    dm({ type: "show", ref: "person/artum" });
    expect(g.live.sceneId).toBe("s-artum");
    expect(ent("e-artum").stage).toBe("found");
    // The TV's caption is the person's name and title.
    const tvScene = projectTv(g, 1).scenes.find((x) => x.id === "s-artum")!;
    expect(tvScene).toMatchObject({ name: "Artum", title: "Planner of Winterfest" });
    expect(g.recent![0]).toBe("person/artum");
  });

  it("shows a place with no picture as its map, zoomed to its pin", () => {
    dm({ type: "show", ref: "place/flickering-candle" });
    expect(g.live.sceneId).toBe("s-map");
    const pin = scene("s-map").map!.pins.find((p) => p.id === g.live.focus!.pinId)!;
    expect(pin.name).toBe("The Flickering Candle");
    expect(liveRef(g)).toBe(`map/candlefair/${pin.number}`);
  });

  it("a rumored place shown is found, and its pin shown", () => {
    dm({ type: "show", ref: "place/lathtarls-lantern" });
    expect(ent("e-lantern").stage).toBe("found");
    const pin = scene("s-map").map!.pins.find((p) => p.id === g.live.focus!.pinId)!;
    expect(pin.discovered).toBe(true);
    expect(projectTv(g, 1).scenes.find((x) => x.id === "s-map")!.map!.pins.some((p) => p.id === pin.id && p.label !== "?")).toBe(true);
  });

  it("a hidden pin shown by its number is discovered, with the banner", () => {
    const hidden = scene("s-map").map!.pins.find((p) => !p.discovered && !g.entries!.some((e) => e.pin?.pinId === p.id))!;
    dm({ type: "show", ref: `map/candlefair/${hidden.number}` });
    expect(scene("s-map").map!.pins.find((p) => p.id === hidden.id)!.discovered).toBe(true);
    expect(g.live.banner?.pinId).toBe(hidden.id);
    expect(g.live.focus?.pinId).toBe(hidden.id);
  });

  it("opens a shop's storefront", () => {
    const { entryId } = dm({ type: "entry.add", entry: { name: "Hannet's Forge", kind: "shop" } });
    dm({ type: "entry.update", entryId: entryId!, patch: { shopId: g.shops[0].id } });
    dm({ type: "show", ref: "shop/hannets-forge" });
    expect(g.live.shopOpen).toBe(true);
    expect(g.live.shopId).toBe(g.shops[0].id);
    expect(ent(entryId!).stage).toBe("found");
  });

  it("gives something with no picture a picture card the first time", () => {
    dm({ type: "show", ref: "mystery/the-broken-ring" });
    const e = ent("e-broken-ring");
    expect(e.sceneId).toBeDefined();
    expect(g.live.sceneId).toBe(e.sceneId);
    expect(scene(e.sceneId!)).toMatchObject({ kind: "portrait", name: "The broken ring" });
    // Showing it again reuses the card.
    const n = g.scenes.length;
    dm({ type: "show", ref: "mystery/the-broken-ring" });
    expect(g.scenes.length).toBe(n);
  });

  it("uploads a picture onto an entry", () => {
    dm({ type: "entry.picture", entryId: "e-fennick", art: { url: "https://example.com/fennick.png" } });
    const sc = scene(ent("e-fennick").sceneId!);
    expect(sc.art).toEqual({ url: "https://example.com/fennick.png" });
    expect(fails({ type: "entry.picture", entryId: "e-fennick", art: { url: "javascript:alert(1)" } })).toMatch(/uploaded/);
    // A rumored person's picture stays off the TV.
    expect(JSON.stringify(projectTv(g, 1))).not.toContain("fennick.png");
  });

  it("shows props and the built-in screens", () => {
    dm({ type: "show", ref: "prop/symbol" });
    expect(g.live.sceneId).toBe("s-symbol");
    dm({ type: "show", ref: "black" });
    expect(g.live.sceneId).toBe("s-black");
    dm({ type: "show", ref: "table" });
    expect(scene(g.live.sceneId).kind).toBe("table");
    dm({ type: "show", ref: "stinger" });
    expect(scene(g.live.sceneId).kind).toBe("stinger");
    dm({ type: "show", ref: "board" });
    expect(g.live.sceneId).toBe("s-board");
    dm({ type: "show", ref: "leads" });
    expect(g.live.leads).toBe(true);
    expect(fails({ type: "show", ref: "person/nobody" })).toMatch(/isn't there/);
  });
});

describe("the quick bar", () => {
  it("pins to a key (one key per thing), shows by key, and steps in key order", () => {
    dm({ type: "quick.set", key: 4, ref: "person/mags" });
    expect(quickOf(g)[4]).toBe("person/mags");
    expect(quickOf(g)[3]).toBeNull();
    dm({ type: "scene.hotkey", key: 4 });
    expect(g.live.sceneId).toBe("s-mags");
    dm({ type: "show", ref: "board" }); // key 1
    dm({ type: "scene.step", dir: 1 });
    expect(g.live.sceneId).toBe("s-artum"); // key 2
    dm({ type: "scene.step", dir: -1 });
    dm({ type: "scene.step", dir: -1 });
    expect(g.live.sceneId).toBe("s-black"); // wraps to key 0
    dm({ type: "quick.set", key: 4, ref: null });
    expect(quickOf(g)[4]).toBeNull();
    expect(fails({ type: "scene.hotkey", key: 4 })).toMatch(/Nothing on key 4/);
  });

  it("follows renames, and forgets deleted things", () => {
    dm({ type: "entry.update", entryId: "e-mags", patch: { slug: "margaret" } });
    expect(quickOf(g)[3]).toBe("person/margaret");
    dm({ type: "scene.update", sceneId: "s-map", patch: { slug: "town" } });
    expect(quickOf(g)[6]).toBe("map/town");
    expect(g.episodes![0].beats.flatMap((b) => b.actions)).toContainEqual({ type: "show", ref: "map/town" });
    dm({ type: "scene.remove", sceneId: "s-extra" });
    expect(quickOf(g)[7]).toBeNull();
  });

  it("puts a new map or prop on the first free key", () => {
    dm({ type: "quick.set", key: 7, ref: null });
    const { sceneId } = dm({ type: "scene.add", kind: "handout", label: "The ransom note" });
    expect(quickOf(g)[7]).toBe("prop/ransom-note");
    expect(resolveRef(g, "prop/ransom-note")!.scene!.id).toBe(sceneId);
  });

  it("never reaches the TV or a phone", () => {
    dm({ type: "quick.set", key: 4, ref: "person/the-merchant" });
    dm({ type: "show", ref: "prop/extra-image" });
    for (const json of [JSON.stringify(projectTv(g, 1)), JSON.stringify(projectPlayer(g, 1, "p1", []))]) {
      expect(json).not.toContain("the-merchant");
      expect(json).not.toContain('"quick"');
      expect(json).not.toContain('"recent"');
    }
  });
});

describe("the finder", () => {
  it("finds by first letters, nickname or ref", () => {
    expect(findAssets(g, "mag")[0].ref).toBe("person/mags");
    expect(findAssets(g, "sym")[0].ref).toBe("prop/symbol");
    expect(findAssets(g, "candlefair").map((a) => a.ref)).toContain("map/candlefair");
    expect(findAssets(g, "zzzz")).toEqual([]);
  });
});

describe("run sheets", () => {
  it("reads show: lines by ref or by name, and the old action: scene", () => {
    const p = parseEpisode("## A\nshow: person/mags\nshow: The symbol\naction: scene Artum\nshow: candlefair map\nshow: the moon", assetResolver(g));
    expect(p.beats[0].actions).toEqual([
      { type: "show", ref: "person/mags" },
      { type: "show", ref: "prop/symbol" },
      { type: "show", ref: "person/artum" },
      { type: "show", ref: "map/candlefair" },
    ]);
    expect(p.warnings[0]).toMatch(/the moon/);
    expect(episodeMarkdown({ title: "T", beats: p.beats.map((b, i) => ({ ...b, id: `b${i}` })) }, g)).toContain("show: prop/symbol");
  });

  it("a show action fires on landing, and one for something deleted does nothing", () => {
    dm({ type: "beat.update", episodeId: "ep1", beatId: beat(0).id, beat: { ...beat(0), actions: [{ type: "show", ref: "person/mags" }] } });
    dm({ type: "run.start", episodeId: "ep1" });
    dm({ type: "run.next" });
    expect(g.live.sceneId).toBe("s-mags");
    dm({ type: "beat.update", episodeId: "ep1", beatId: beat(1).id, beat: { ...beat(1), actions: [{ type: "show", ref: "prop/gone" }] } });
    dm({ type: "run.next" });
    expect(g.live.sceneId).toBe("s-mags");
  });
});

describe("suggestions", () => {
  it("finds what a beat's words mention, in order, longest name first", () => {
    expect(mentions(g, "Mags pours. Artum's notice is on the wall; the Candlefair map too.")).toEqual(["person/mags", "prop/artums-notice", "map/candlefair"]);
    expect(mentions(g, "Captain Orsa Dell waves. Dell again.")).toEqual(["person/orsa"]);
    expect(mentions(g, "Nothing here, magsy.")).toEqual([]);
    // Hidden people are never suggested (one key would spoil them).
    expect(mentions(g, "The merchant smiles at Bolla.")).toEqual([]);
  });

  it("suggests the first mention for a beat with no TV action, and stops after a no", () => {
    const b = { title: "Mags pours", notes: ["The Flickering Candle is warm."], checks: [], branches: [], actions: [] };
    expect(beatSuggestions(g, b)).toEqual({ suggested: "person/mags", also: ["place/flickering-candle"] });
    expect(beatSuggestions(g, { ...b, dismissed: ["person/mags"] }).suggested).toBe("place/flickering-candle");
    expect(beatSuggestions(g, { ...b, actions: [{ type: "show", ref: "board" }] }).suggested).toBeNull();
  });

  it("Accept all adds each suggestion once; dismiss is remembered across edits", () => {
    dm({ type: "beat.update", episodeId: "ep1", beatId: beat(0).id, beat: { ...beat(0), title: "Mags pours", notes: [], readAloud: undefined, actions: [] } });
    dm({ type: "beat.dismiss", episodeId: "ep1", beatId: beat(0).id, ref: "person/mags" });
    expect(beat(0).dismissed).toEqual(["person/mags"]);
    dm({ type: "beat.update", episodeId: "ep1", beatId: beat(0).id, beat: { ...beat(0), title: "Mags pours at the Flickering Candle" } });
    expect(beat(0).dismissed).toEqual(["person/mags"]);
    dm({ type: "episode.acceptSuggestions", episodeId: "ep1" });
    expect(beat(0).actions).toEqual([{ type: "show", ref: "place/flickering-candle" }]);
    const again = structuredClone(g.episodes);
    dm({ type: "episode.acceptSuggestions", episodeId: "ep1" });
    expect(g.episodes).toEqual(again);
  });
});
