// Fog of war: cells, tiles, and what never leaves the server while it's on.
import { describe, expect, it } from "vitest";
import { dmCommand, type Command } from "@/shared/commands";
import { decodeBits, encodeBits, fogLayout, fullBits, getBit, setBit, visibleTiles } from "@/shared/fog";
import { projectPlayer, projectTv } from "@/shared/projection";
import { apply, type Ctx } from "@/shared/reducer";
import { seedGame } from "@/shared/seed";
import { hydrate } from "@/server/store";
import type { GameState, MapFog } from "@/shared/types";

const DM: Ctx = { now: 1000, actor: { role: "dm" } };
const MAP = "s-map";
const ART = "/api/files/t/aaaaaaaaaaaaaaaaaaaaaaaa.png";
const tile = (i: number) => `/api/files/t/${i.toString(16).padStart(24, "0")}.webp`;
const CANARY = "CANARY_FOG_51ab";

function run(g: GameState, cmds: Command[]): GameState {
  for (const c of cmds) g = apply(g, c, DM).state;
  return g;
}

/** A 10x10-cell map (square), cut into 4x4 tiles, fog on and all covered. */
function fogged(): GameState {
  let g = hydrate(seedGame("t"))!;
  g = run(g, [
    { type: "scene.update", sceneId: MAP, patch: { art: { url: ART } } },
    { type: "scene.show", sceneId: MAP },
    { type: "map.grid", sceneId: MAP, grid: { snap: true, lines: false, cell: 0.1, ox: 0, oy: 0, aspect: 1 } },
    { type: "fog.setup", sceneId: MAP, layout: fogLayout({ snap: true, lines: false, cell: 0.1, ox: 0, oy: 0, aspect: 1 }, 1), tiles: { cols: 4, rows: 4, urls: Array.from({ length: 16 }, (_, i) => tile(i)), src: ART } },
  ]);
  return g;
}
const fogOf = (g: GameState): MapFog => g.scenes.find((s) => s.id === MAP)!.map!.fog!;
const tvMap = (g: GameState) => projectTv(g, 1).scenes.find((s) => s.id === MAP)!;

/** Clear cells (c, r) on the map. */
function clear(g: GameState, cells: [number, number][]): GameState {
  const f = fogOf(g);
  const b = decodeBits(f.bits, f.cols, f.rows);
  for (const [c, r] of cells) setBit(b, r * f.cols + c, true);
  return run(g, [{ type: "fog.bits", sceneId: MAP, bits: encodeBits(b) }]);
}

describe("fog layout", () => {
  it("lines cells up with the grid, starting at or before the image's edge", () => {
    const f = fogLayout({ snap: true, lines: true, cell: 0.1, ox: 0.03, oy: 0.05, aspect: 0.5 }, 0.5);
    expect(f.cw).toBeCloseTo(0.1);
    expect(f.ch).toBeCloseTo(0.2);
    expect(f.x0).toBeCloseTo(-0.07);
    expect(f.y0).toBeCloseTo(-0.15);
    expect(f.x0 + f.cols * f.cw).toBeGreaterThanOrEqual(1 - 1e-9);
    expect(f.y0 + f.rows * f.ch).toBeGreaterThanOrEqual(1 - 1e-9);
  });

  it("round-trips bits", () => {
    const b = new Uint8Array(13);
    setBit(b, 0, true);
    setBit(b, 99, true);
    const back = decodeBits(encodeBits(b), 10, 10);
    expect(getBit(back, 0)).toBe(1);
    expect(getBit(back, 99)).toBe(1);
    expect(getBit(back, 50)).toBe(0);
  });
});

describe("while fog is on", () => {
  it("sends no image and no tiles while everything is covered", () => {
    const sc = tvMap(fogged());
    expect(sc.art.url).toBeUndefined();
    expect(sc.map!.fog!.tiles.shown).toEqual([]);
    expect(JSON.stringify(projectTv(fogged(), 1))).not.toContain(ART);
  });

  it("sends only the tiles that touch a clear cell", () => {
    // Cell (0,0) is in tile (0,0); cell (5,5) spans x 0.5-0.6, which is tile column 2, row 2.
    const g = clear(fogged(), [
      [0, 0],
      [5, 5],
    ]);
    const shown = tvMap(g).map!.fog!.tiles.shown.map((t) => `${t.c},${t.r}`);
    expect(shown.sort()).toEqual(["0,0", "2,2"]);
    expect(JSON.stringify(projectTv(g, 1))).not.toContain(tile(15));
  });

  it("a cell across a tile edge sends both tiles", () => {
    // Cell 2 spans x 0.2-0.3; tiles are 0.25 wide.
    const f = { ...fogOf(clear(fogged(), [[2, 0]])) };
    expect(visibleTiles(f).map((t) => t.c)).toEqual([0, 1]);
  });

  it("keeps pins and monsters under fog on the server, but the party always shows", () => {
    let g = fogged();
    const m = g.scenes.find((s) => s.id === MAP)!.map!;
    for (const p of m.pins) {
      p.discovered = true;
      p.name = `${CANARY} ${p.id}`;
    }
    g = run(g, [
      { type: "map.legend", sceneId: MAP, style: "names" },
      { type: "token.add", sceneId: MAP, kind: "monster", name: `${CANARY} ogre`, x: 0.95, y: 0.95, hidden: false },
      { type: "token.party", sceneId: MAP, x: 0.05, y: 0.05 },
    ]);
    const json = JSON.stringify(projectTv(g, 1));
    expect(json).not.toContain(CANARY);
    expect(tvMap(g).map!.tokens.filter((t) => t.playerId).length).toBeGreaterThan(0);
    // Reveal everything: they come back.
    g = run(g, [{ type: "fog.all", sceneId: MAP, clear: true }]);
    expect(JSON.stringify(projectTv(g, 1))).toContain(`${CANARY} ogre`);
  });

  it("stops sending tiles when the image changes until the DM re-cuts", () => {
    let g = run(fogged(), [{ type: "fog.all", sceneId: MAP, clear: true }]);
    expect(tvMap(g).map!.fog!.tiles.shown).toHaveLength(16);
    g = run(g, [{ type: "scene.update", sceneId: MAP, patch: { art: { url: "/api/files/t/bbbbbbbbbbbbbbbbbbbbbbbb.png" } } }]);
    expect(tvMap(g).map!.fog!.tiles.shown).toHaveLength(0);
    expect(tvMap(g).art.url).toBeUndefined();
  });

  it("turning fog off sends the whole image again", () => {
    const g = run(fogged(), [{ type: "fog.on", sceneId: MAP, on: false }]);
    expect(tvMap(g).art.url).toBe(ART);
    expect(tvMap(g).map!.fog).toBeUndefined();
  });

  it("keeps the phones' copy of the map just as fogged", () => {
    const g = fogged();
    expect(JSON.stringify(projectPlayer(g, 1, "p1", []))).not.toContain(ART);
  });

  it("only takes tiles that are this app's uploads", () => {
    const bad = { type: "fog.setup", sceneId: MAP, layout: fogLayout(undefined, 1), tiles: { cols: 1, rows: 1, urls: ["https://evil.example/x.png"], src: ART } };
    expect(dmCommand.safeParse(bad).success).toBe(false);
  });

  it("all clear encodes the same however it got there", () => {
    const f = fogOf(fogged());
    expect(fogOf(run(fogged(), [{ type: "fog.all", sceneId: MAP, clear: true }])).bits).toBe(fullBits(f.cols, f.rows));
  });
});
