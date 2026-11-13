// Map scenes: numbered pins, their positions, and spoiler safety.
import { beforeEach, describe, expect, it } from "vitest";
import type { Command } from "@/shared/commands";
import { dmCommand } from "@/shared/commands";
import { fitBox, pinToPixels, pixelsToPin, zoomToward } from "@/shared/mapGeometry";
import { projectTv } from "@/shared/projection";
import { apply, type Ctx } from "@/shared/reducer";
import { seedGame } from "@/shared/seed";
import type { GameState, Pin } from "@/shared/types";
import { execute, viewFor } from "@/server/game";
import { createMemoryStore, type Store } from "@/server/store";

const DM: Ctx = { now: 1_700_000_000_000, actor: { role: "dm" } };
const CANARY = "CANARY_MAP_SECRET_91c2";

function run(state: GameState, cmds: Command[]) {
  for (const c of cmds) state = apply(state, c, DM).state;
  return state;
}
const pinsOf = (g: GameState, sceneId = "s-map"): Pin[] => g.scenes.find((s) => s.id === sceneId)!.map!.pins;

/** Seed Candlefair with a canary in every hidden pin and every pin's DM notes. */
function spoilerGame(): GameState {
  const g = seedGame("t");
  for (const sc of g.scenes) {
    for (const p of sc.map?.pins ?? []) {
      p.dmNotes = `${CANARY} notes ${p.id}`;
      if (!p.discovered) {
        p.name = `${CANARY} hidden ${p.id}`;
        p.description = `${CANARY} hidden desc`;
        p.type = `${CANARY}type`;
      }
    }
  }
  return g;
}

function leaks(json: string) {
  return [CANARY, "dmNotes", "discovered", "link", "Warlock"].filter((x) => json.includes(x));
}

describe("pin positions", () => {
  it("are fractions of the image, so they land on the same spot of the map at any screen size", () => {
    const pin = { x: 0.3, y: 0.7 };
    const img = { w: 3000, h: 2000 };
    for (const [w, h] of [
      [1920, 1080],
      [1280, 720],
      [800, 1200],
      [3840, 2160],
    ]) {
      const box = fitBox(w, h, img.w, img.h);
      // Letterboxed: the whole image fits and keeps its shape.
      expect(box.width).toBeLessThanOrEqual(w + 1e-9);
      expect(box.height).toBeLessThanOrEqual(h + 1e-9);
      expect(box.width / box.height).toBeCloseTo(img.w / img.h, 9);
      const px = pinToPixels(pin, box);
      // Same fraction of the image every time.
      expect((px.x - box.left) / box.width).toBeCloseTo(0.3, 9);
      expect((px.y - box.top) / box.height).toBeCloseTo(0.7, 9);
    }
  });

  it("a pin dragged at one size stays put after a resize", () => {
    const small = fitBox(1280, 720, 1600, 1200);
    const dropped = pixelsToPin(400, 300, small.width, small.height);
    const big = fitBox(3840, 2160, 1600, 1200);
    const px = pinToPixels(dropped, big);
    expect((px.x - big.left) / big.width).toBeCloseTo(400 / small.width, 3);
    expect((px.y - big.top) / big.height).toBeCloseTo(300 / small.height, 3);
  });

  it("keeps a dragged pin on the map", () => {
    expect(pixelsToPin(-50, 2000, 100, 100)).toEqual({ x: 0, y: 1 });
  });

  it("zooming toward a pin brings it toward the centre without showing past the map's edge", () => {
    const box = fitBox(1920, 1080, 1920, 1080);
    const mid = zoomToward({ x: 0.5, y: 0.5 }, box, 1920, 1080, 2);
    expect(box.left + mid.tx + 0.5 * box.width * 2).toBeCloseTo(960);
    const corner = zoomToward({ x: 0, y: 0 }, box, 1920, 1080, 2);
    expect(box.left + corner.tx).toBe(0); // clamped: the map's edge stays at the screen's edge
  });
});

describe("numbering", () => {
  it("Add number picks the lowest free number, and deleting 2 then adding gives 2 again", () => {
    let g = seedGame("t");
    expect(pinsOf(g).map((p) => p.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    g = run(g, [{ type: "pin.add", sceneId: "s-map", pinId: "new1", x: 0.5, y: 0.5 }]);
    expect(pinsOf(g).find((p) => p.id === "new1")!.number).toBe(9);
    g = run(g, [
      { type: "pin.remove", sceneId: "s-map", pinId: "cf2" },
      { type: "pin.add", sceneId: "s-map", pinId: "new2", x: 0.5, y: 0.5 },
    ]);
    expect(pinsOf(g).find((p) => p.id === "new2")!.number).toBe(2);
    g = run(g, [
      { type: "pin.remove", sceneId: "s-map", pinId: "cf1" },
      { type: "pin.remove", sceneId: "s-map", pinId: "cf5" },
      { type: "pin.add", sceneId: "s-map", pinId: "new3", x: 0.1, y: 0.1 },
      { type: "pin.add", sceneId: "s-map", pinId: "new4", x: 0.1, y: 0.1 },
      { type: "pin.add", sceneId: "s-map", pinId: "new5", x: 0.1, y: 0.1 },
    ]);
    expect(["new3", "new4", "new5"].map((id) => pinsOf(g).find((p) => p.id === id)!.number)).toEqual([1, 5, 10]);
  });

  it("starts a fresh map at 1", () => {
    let g = run(seedGame("t"), [{ type: "scene.add", kind: "map", label: "Dungeon" }]);
    const id = g.scenes.at(-1)!.id;
    g = run(g, [{ type: "pin.add", sceneId: id, pinId: "d1", x: 0.5, y: 0.5 }]);
    expect(pinsOf(g, id)[0].number).toBe(1);
  });

  it("undoing a delete puts the pin back with its number, unless that number was taken since", () => {
    let g = seedGame("t");
    const pin = structuredClone(pinsOf(g).find((p) => p.id === "cf4")!);
    g = run(g, [{ type: "pin.remove", sceneId: "s-map", pinId: "cf4" }, { type: "pin.restore", sceneId: "s-map", pin }]);
    expect(pinsOf(g).find((p) => p.id === "cf4")!.number).toBe(4);
    g = run(g, [
      { type: "pin.remove", sceneId: "s-map", pinId: "cf4" },
      { type: "pin.add", sceneId: "s-map", pinId: "x", x: 0, y: 0 },
      { type: "pin.restore", sceneId: "s-map", pin },
    ]);
    expect(pinsOf(g).find((p) => p.id === "cf4")!.number).toBe(9);
  });

  it("limits 'shows as' to 4 characters", () => {
    expect(dmCommand.safeParse({ type: "pin.update", sceneId: "s-map", pinId: "cf1", patch: { showsAs: "1a" } }).success).toBe(true);
    expect(dmCommand.safeParse({ type: "pin.update", sceneId: "s-map", pinId: "cf1", patch: { showsAs: "12345" } }).success).toBe(false);
  });
});

describe("spoiler safety", () => {
  it("the TV gets only discovered pins, and never DM notes or links", () => {
    const g = spoilerGame();
    const tv = projectTv(g, 1);
    expect(leaks(JSON.stringify(tv))).toEqual([]);
    const cf = tv.scenes.find((s) => s.id === "s-map")!.map!;
    expect(cf.pins.map((p) => p.label)).toEqual(["1", "2", "3"]);
    expect(cf.pins.map((p) => p.name)).toEqual(["The Flickering Candle", "The Banquet Hall", "The Docks"]);
    expect(Object.keys(cf.pins[0]).sort()).toEqual(["description", "id", "label", "name", "type", "x", "y"]);
    const sc = tv.scenes.find((s) => s.id === "s-swordcoast")!.map!;
    expect(sc.pins.map((p) => p.name)).toEqual(["Candlefair"]);
  });

  it("with the numbers-only legend, names stay on the server until the DM focuses a pin", () => {
    let g = run(spoilerGame(), [
      { type: "map.legend", sceneId: "s-map", on: true, style: "numbers" },
      { type: "scene.show", sceneId: "s-map" },
    ]);
    let json = JSON.stringify(projectTv(g, 1).scenes.find((s) => s.id === "s-map"));
    expect(json).not.toContain("Flickering");
    expect(json).not.toContain("tavern");
    g = run(g, [{ type: "live.focus", pinId: "cf1" }]);
    const map = projectTv(g, 2).scenes.find((s) => s.id === "s-map")!.map!;
    expect(map.focus?.pinId).toBe("cf1");
    expect(map.pins.find((p) => p.id === "cf1")!.name).toBe("The Flickering Candle");
    expect(map.pins.find((p) => p.id === "cf2")!.name).toBeUndefined();
    json = JSON.stringify(map);
    expect(leaks(json)).toEqual([]);
  });

  it("a hidden pin reaches the TV only once discovered, and can't be focused before", () => {
    let g = run(spoilerGame(), [{ type: "scene.show", sceneId: "s-map" }]);
    expect(() => apply(g, { type: "live.focus", pinId: "cf8" }, DM)).toThrow();
    g = run(g, [
      { type: "pin.update", sceneId: "s-map", pinId: "cf8", patch: { name: "Warlock’s Crypt" } },
      { type: "pin.discover", sceneId: "s-map", pinId: "cf8", discovered: true, announce: true },
    ]);
    const map = projectTv(g, 2).scenes.find((s) => s.id === "s-map")!.map!;
    expect(map.pins.map((p) => p.id)).toContain("cf8");
    expect(map.banner?.name).toBe("Warlock’s Crypt");
    expect(JSON.stringify(map)).not.toContain(CANARY + " notes");
  });

  it("revealing quietly shows no banner, and hiding a focused pin stops the zoom", () => {
    let g = run(seedGame("t"), [
      { type: "scene.show", sceneId: "s-map" },
      { type: "pin.discover", sceneId: "s-map", pinId: "cf4", discovered: true, announce: false },
      { type: "live.focus", pinId: "cf4" },
    ]);
    expect(projectTv(g, 1).scenes.find((s) => s.id === "s-map")!.map!.banner).toBeUndefined();
    g = run(g, [{ type: "pin.discover", sceneId: "s-map", pinId: "cf4", discovered: false, announce: false }]);
    expect(g.live.focus).toBeUndefined();
  });

  it("changing scene drops the focus and the banner", () => {
    const g = run(seedGame("t"), [
      { type: "scene.show", sceneId: "s-map" },
      { type: "live.focus", pinId: "cf1" },
      { type: "scene.show", sceneId: "s-board" },
    ]);
    expect(g.live.focus).toBeUndefined();
  });
});

describe("spoiler safety through the server", () => {
  let store: Store;
  beforeEach(async () => {
    store = createMemoryStore();
    await store.overwrite("candlefair", spoilerGame(), []);
  });

  it("the TV and players never receive hidden pins or DM notes, even after edits", async () => {
    await execute(store, "candlefair", { role: "dm" }, { type: "scene.show", sceneId: "s-map" });
    await execute(store, "candlefair", { role: "dm" }, { type: "pin.update", sceneId: "s-map", pinId: "cf1", patch: { dmNotes: `${CANARY} fresh note` } });
    await execute(store, "candlefair", { role: "dm" }, { type: "live.focus", pinId: "cf1" });
    const tv = JSON.stringify(await viewFor(store, "candlefair", { role: "tv" }));
    const player = JSON.stringify(await viewFor(store, "candlefair", { role: "player", playerId: "p1" }));
    expect(leaks(tv)).toEqual([]);
    expect(leaks(player)).toEqual([]);
    expect(player).not.toContain("Winding Water"); // phones don't get maps at all
    const dm = JSON.stringify(await viewFor(store, "candlefair", { role: "dm" }));
    expect(dm).toContain(`${CANARY} fresh note`);
  });
});

describe("links", () => {
  it("must point at a shop or scene that exists, and go when it's deleted", () => {
    let g = seedGame("t");
    expect(pinsOf(g).find((p) => p.id === "cf5")!.link).toEqual({ kind: "shop", shopId: "smith" });
    expect(() => apply(g, { type: "pin.update", sceneId: "s-map", pinId: "cf1", patch: { link: { kind: "shop", shopId: "nope" } } }, DM)).toThrow();
    g = run(g, [
      { type: "pin.update", sceneId: "s-map", pinId: "cf1", patch: { link: { kind: "scene", sceneId: "s-mags" } } },
      { type: "scene.remove", sceneId: "s-mags" },
      { type: "shop.remove", shopId: "smith" },
    ]);
    expect(pinsOf(g).find((p) => p.id === "cf1")!.link).toBeUndefined();
    expect(pinsOf(g).find((p) => p.id === "cf5")!.link).toBeUndefined();
  });
});

describe("adding the maps to an existing game", () => {
  it("turns the old Town map into the Candlefair map, keeps its image, and adds the Sword Coast once", () => {
    let g = seedGame("t");
    g.scenes = g.scenes.filter((s) => s.id !== "s-swordcoast");
    const old = g.scenes.find((s) => s.id === "s-map")!;
    Object.assign(old, { kind: "image", label: "Town map", art: { url: "https://example.com/candlefair.jpg" } });
    delete old.map;
    g = run(g, [{ type: "map.addSeedMaps" }, { type: "map.addSeedMaps" }]);
    const cf = g.scenes.find((s) => s.id === "s-map")!;
    expect(cf.kind).toBe("map");
    expect(cf.label).toBe("Candlefair map");
    expect(cf.hotkey).toBe(6);
    expect(cf.art?.url).toBe("https://example.com/candlefair.jpg");
    expect(cf.map!.pins).toHaveLength(8);
    const sword = g.scenes.filter((s) => s.label === "Sword Coast map");
    expect(sword).toHaveLength(1);
    expect(sword[0].hotkey).toBe(9);
    expect(sword[0].map!.pins[0].link).toEqual({ kind: "scene", sceneId: "s-map" });
  });
});

describe("dot size", () => {
  it("is saved per map, sent to the TV, and kept within limits", () => {
    let g = seedGame("t");
    expect(projectTv(g, 1).scenes.find((s) => s.id === "s-map")!.map!.sealScale).toBe(1);
    g = run(g, [{ type: "map.sealScale", sceneId: "s-map", scale: 0.45 }]);
    expect(projectTv(g, 2).scenes.find((s) => s.id === "s-map")!.map!.sealScale).toBe(0.45);
    expect(projectTv(g, 2).scenes.find((s) => s.id === "s-swordcoast")!.map!.sealScale).toBe(1);
    expect(dmCommand.safeParse({ type: "map.sealScale", sceneId: "s-map", scale: 0.1 }).success).toBe(false);
    expect(dmCommand.safeParse({ type: "map.sealScale", sceneId: "s-map", scale: 3 }).success).toBe(false);
  });
});
