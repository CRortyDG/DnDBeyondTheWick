// Tokens on maps: the party, monsters from the fight, the grid, and what never reaches the TV.
import { describe, expect, it } from "vitest";
import { dmCommand, type Command } from "@/shared/commands";
import { projectPlayer, projectTv } from "@/shared/projection";
import { apply, type Ctx } from "@/shared/reducer";
import { seedGame } from "@/shared/seed";
import { initials, monsterKey, snapToGrid } from "@/shared/tokens";
import { decodeBits, encodeBits, fogLayout, setBit } from "@/shared/fog";
import { hydrate } from "@/server/store";
import type { GameState, MapToken } from "@/shared/types";

const DM: Ctx = { now: 1000, actor: { role: "dm" } };
const as = (playerId: string): Ctx => ({ now: 1000, actor: { role: "player", playerId } });
const CANARY = "CANARY_TOKEN_7f31";
const MAP = "s-map";
const GREMLIN = "m-pudding-gremlin";

function game(): GameState {
  const g = hydrate(seedGame("t"))!;
  g.players[2].away = true;
  g.players[3].away = true;
  g.players[0].character = "Brin Ashcombe";
  g.players[1].character = "Ash";
  return g;
}

function run(g: GameState, cmds: (Command | [Command, Ctx])[]): GameState {
  for (const c of cmds) {
    const [cmd, ctx] = Array.isArray(c) ? c : [c, DM];
    g = apply(g, cmd, { ...ctx, rand: () => 0.5 }).state;
  }
  return g;
}
const tokens = (g: GameState, id = MAP): MapToken[] => g.scenes.find((s) => s.id === id)!.map!.tokens ?? [];
const tvMap = (g: GameState) => projectTv(g, 1).scenes.find((s) => s.id === MAP)!.map!;

describe("party tokens", () => {
  it("one per player at the table, each a different colour, and never twice", () => {
    let g = run(game(), [{ type: "token.party", sceneId: MAP, x: 0.5, y: 0.5 }]);
    const t = tokens(g);
    expect(t.map((x) => x.playerId).sort()).toEqual(["p1", "p2"]);
    expect(new Set(t.map((x) => x.color)).size).toBe(2);
    g = run(g, [{ type: "token.party", sceneId: MAP, x: 0.5, y: 0.5 }]);
    expect(tokens(g)).toHaveLength(2);
  });

  it("shows their character name and initials on the TV", () => {
    const g = run(game(), [{ type: "token.party", sceneId: MAP, x: 0.5, y: 0.5 }]);
    const brin = tvMap(g).tokens.find((t) => t.playerId === "p1")!;
    expect(brin.name).toBe("Brin Ashcombe");
    expect(brin.label).toBe("BA");
  });
});

describe("the grid", () => {
  const grid = { snap: true, lines: true, cell: 0.1, ox: 0, oy: 0, aspect: 0.5 };

  it("snaps medium tokens to a square's middle and large ones to a corner", () => {
    // Squares are 0.1 of the width and 0.2 of the height (the map is twice as wide as tall).
    expect(snapToGrid(grid, 0.13, 0.33, 1)).toEqual({ x: 0.15, y: 0.3 });
    expect(snapToGrid(grid, 0.13, 0.33, 2)).toEqual({ x: 0.1, y: 0.4 });
    expect(snapToGrid({ ...grid, snap: false }, 0.13, 0.33, 1)).toEqual({ x: 0.13, y: 0.33 });
  });

  it("moves snap on the server, and laying a grid snaps the tokens already there", () => {
    let g = run(game(), [{ type: "token.party", sceneId: MAP, x: 0.52, y: 0.52 }]);
    g = run(g, [{ type: "map.grid", sceneId: MAP, grid }]);
    for (const t of tokens(g)) expect(snapToGrid(grid, t.x, t.y, 1)).toEqual({ x: t.x, y: t.y });
    const id = tokens(g)[0].id;
    g = run(g, [{ type: "token.move", sceneId: MAP, tokenId: id, x: 0.71, y: 0.09 }]);
    expect(tokens(g).find((t) => t.id === id)).toMatchObject({ x: 0.75, y: 0.1 });
    expect(tvMap(g).grid).toMatchObject({ cell: 0.1, lines: true });
    g = run(g, [{ type: "map.grid", sceneId: MAP, grid: null }]);
    expect(tvMap(g).grid).toBeUndefined();
  });

  it("only takes the sizes the picker offers", () => {
    expect(dmCommand.safeParse({ type: "token.update", sceneId: MAP, tokenId: "x", patch: { size: 5 } }).success).toBe(false);
    expect(dmCommand.safeParse({ type: "token.update", sceneId: MAP, tokenId: "x", patch: { size: 2 } }).success).toBe(true);
  });
});

describe("hidden tokens", () => {
  it("never leave the server for the TV", () => {
    let g = run(game(), [{ type: "token.add", sceneId: MAP, kind: "monster", name: `${CANARY} ogre`, x: 0.4, y: 0.4, hidden: true }]);
    expect(tokens(g)).toHaveLength(1);
    expect(JSON.stringify(projectTv(g, 1))).not.toContain(CANARY);
    const id = tokens(g)[0].id;
    g = run(g, [{ type: "token.update", sceneId: MAP, tokenId: id, patch: { hidden: false } }]);
    expect(tvMap(g).tokens[0].name).toContain(CANARY);
  });

  it("players can't send token commands", () => {
    const g = game();
    expect(() => apply(g, { type: "token.party", sceneId: MAP, x: 0.5, y: 0.5 } as Command, as("p1"))).toThrow();
  });
});

describe("fights on a map", () => {
  function fightOnMap(): GameState {
    let g = run(game(), [{ type: "scene.show", sceneId: MAP }, { type: "fight.start", groups: [{ templateId: GREMLIN, count: 2 }] }]);
    const ash = g.fight!.order.find((c) => c.playerId === "p2")!.id;
    g = run(g, [
      [{ type: "me.initiative", init: 15 }, as("p1")],
      { type: "fight.init", combatantId: ash, init: 12, bonus: 0 },
      { type: "fight.rollInit" },
      { type: "fight.begin" },
    ]);
    return g;
  }

  it("gives everyone fighting a token, with the TV name for monsters", () => {
    const g = fightOnMap();
    const t = tokens(g);
    expect(t.filter((x) => x.kind === "player")).toHaveLength(2);
    expect(t.filter((x) => x.combatantId)).toHaveLength(2);
    const json = JSON.stringify(projectTv(g, 1).scenes.find((s) => s.id === MAP));
    // Monsters show what the TV calls them until revealed.
    for (const c of g.fight!.order.filter((c) => c.kind === "monster" && !c.revealed && c.displayName)) expect(json).not.toContain(`"${c.name}"`);
  });

  it("glows the token whose turn it is", () => {
    const g = fightOnMap();
    const cur = g.fight!.order.find((c) => c.id === g.fight!.currentId)!;
    const glowing = tvMap(g).tokens.filter((t) => t.current);
    expect(glowing).toHaveLength(1);
    if (cur.kind === "player") expect(glowing[0].playerId).toBe(cur.playerId);
  });

  it("keeps hidden foes' tokens off the TV, and clears monster tokens when the fight closes", () => {
    let g = fightOnMap();
    const foe = g.fight!.order.find((c) => c.kind === "monster")!;
    g = run(g, [{ type: "fight.patch", combatantIds: [foe.id], patch: { hidden: true } }]);
    const foeTok = tokens(g).find((t) => t.combatantId === foe.id)!;
    expect(tvMap(g).tokens.some((t) => t.id === foeTok.id)).toBe(false);
    g = run(g, [{ type: "fight.end" }, { type: "fight.close" }]);
    expect(g.fight).toBeUndefined();
    expect(tokens(g).some((t) => t.combatantId)).toBe(false);
    // The party stays where they stood.
    expect(tokens(g).filter((t) => t.kind === "player")).toHaveLength(2);
  });
});

describe("initials", () => {
  it("uses the first and last word, or the first two letters", () => {
    expect(initials("Brin Ashcombe")).toBe("BA");
    expect(initials("Goblin A")).toBe("GA");
    expect(initials("Mags")).toBe("MA");
    expect(initials("")).toBe("?");
  });
});

describe("the map on phones", () => {
  it("is there only while a map is on the TV", () => {
    let g = game();
    expect(projectPlayer(g, 1, "p1", []).map).toBeUndefined();
    g = run(g, [{ type: "scene.show", sceneId: MAP }]);
    expect(projectPlayer(g, 1, "p1", []).map?.sceneId).toBe(MAP);
  });

  it("lets a player move their own token, snapped, unless it's locked", () => {
    let g = run(game(), [
      { type: "scene.show", sceneId: MAP },
      { type: "map.grid", sceneId: MAP, grid: { snap: true, lines: false, cell: 0.1, ox: 0, oy: 0, aspect: 1 } },
      { type: "token.party", sceneId: MAP, x: 0.5, y: 0.5 },
    ]);
    g = run(g, [[{ type: "me.tokenMove", x: 0.12, y: 0.88 }, as("p1")]]);
    const mine = tokens(g).find((t) => t.playerId === "p1")!;
    expect(mine).toMatchObject({ x: 0.15, y: 0.85 });
    // Ash's token didn't move.
    expect(tokens(g).find((t) => t.playerId === "p2")!.x).not.toBe(0.15);
    g = run(g, [{ type: "token.update", sceneId: MAP, tokenId: mine.id, patch: { locked: true } }]);
    expect(() => run(g, [[{ type: "me.tokenMove", x: 0.5, y: 0.5 }, as("p1")]])).toThrow(/locked/);
  });

  it("refuses a move with no map on the TV or no token", () => {
    const g = game();
    expect(() => run(g, [[{ type: "me.tokenMove", x: 0.5, y: 0.5 }, as("p1")]])).toThrow(/no map/);
    const g2 = run(g, [{ type: "scene.show", sceneId: MAP }]);
    expect(() => run(g2, [[{ type: "me.tokenMove", x: 0.5, y: 0.5 }, as("p1")]])).toThrow(/token/);
  });
});

describe("known maps on phones", () => {
  const known = (g: GameState) => projectPlayer(g, 1, "p1", []).maps;

  it("a map shown on the TV stays on phones after it comes down", () => {
    let g = game();
    expect(known(g)).toEqual([]);
    g = run(g, [{ type: "scene.show", sceneId: MAP }]);
    // While it's on the TV it is the live map, not in the list twice.
    expect(known(g)).toEqual([]);
    g = run(g, [{ type: "scene.show", sceneId: "s-swordcoast" }]);
    expect(known(g).map((m) => m.sceneId)).toEqual([MAP]);
    expect(projectPlayer(g, 1, "p1", []).map?.sceneId).toBe("s-swordcoast");
  });

  it("the DM can share or unshare a map without showing it", () => {
    let g = run(game(), [{ type: "scene.known", sceneId: "s-swordcoast", known: true }]);
    expect(known(g).map((m) => m.sceneId)).toEqual(["s-swordcoast"]);
    g = run(g, [{ type: "scene.known", sceneId: "s-swordcoast", known: false }]);
    expect(known(g)).toEqual([]);
  });

  it("keeps hidden pins, hidden tokens and fogged parts off the phone", () => {
    const g0 = game();
    const sc = g0.scenes.find((s) => s.id === MAP)!;
    sc.map!.pins[0] = { ...sc.map!.pins[0], discovered: false, name: CANARY, description: CANARY };
    let g = run(g0, [
      { type: "token.add", sceneId: MAP, kind: "monster", name: `${CANARY} ogre`, x: 0.4, y: 0.4, hidden: true },
      { type: "scene.known", sceneId: MAP, known: true },
    ]);
    const m = known(g)[0];
    expect(JSON.stringify(m)).not.toContain(CANARY);
    // The phone sees exactly what the TV would.
    expect(m.map).toEqual(tvMap(g));
    // Fog on with nothing cleared: no picture, no pins, no monster tokens.
    g = run(g, [
      { type: "token.add", sceneId: MAP, kind: "monster", name: "Visible ogre", x: 0.6, y: 0.6 },
      { type: "fog.setup", sceneId: MAP, layout: fogLayout(undefined, 1), tiles: { cols: 1, rows: 1, urls: ["/api/files/t/0123456789abcdef01234567.webp"], src: "x" } },
    ]);
    const fogged = known(g)[0];
    expect(fogged.art?.url).toBeUndefined();
    expect(fogged.map.pins).toEqual([]);
    expect(fogged.map.tokens.some((t) => t.kind === "monster")).toBe(false);
  });

  it("only maps: portraits and handouts never show up here", () => {
    const g = run(game(), [{ type: "scene.show", sceneId: "s-symbol" }, { type: "scene.show", sceneId: "s-extra" }]);
    expect(known(g)).toEqual([]);
  });
});

describe("monsters placed before the fight", () => {
  const placed = (g: GameState) => tokens(g).filter((t) => t.kind === "monster");
  const start = (g: GameState, count = 2) => run(g, [{ type: "fight.start", groups: [{ templateId: GREMLIN, count }] }]);

  it("a placed token named like the monster becomes its fight token, in the same spot, with no second copy", () => {
    let g = run(game(), [
      { type: "scene.show", sceneId: MAP },
      { type: "token.add", sceneId: MAP, kind: "monster", name: "Pudding Gremlins", x: 0.2, y: 0.2, hidden: true },
    ]);
    const before = placed(g)[0];
    g = start(g, 1);
    const foe = g.fight!.order.find((c) => c.kind === "monster")!;
    expect(placed(g)).toHaveLength(1);
    const t = placed(g)[0];
    expect(t.id).toBe(before.id);
    expect(t.combatantId).toBe(foe.id);
    expect([t.x, t.y]).toEqual([before.x, before.y]);
    // On the TV now, under the name the TV knows it by.
    expect(tvMap(g).tokens.find((x) => x.id === t.id)?.name).toBe("Something in the pudding");
  });

  it("plain \"Monster\" tokens are taken by any monster; other names stay as they were; extra monsters get new tokens", () => {
    let g = run(game(), [
      { type: "scene.show", sceneId: MAP },
      { type: "token.add", sceneId: MAP, kind: "monster", name: "Monster", x: 0.2, y: 0.2, hidden: true },
      { type: "token.add", sceneId: MAP, kind: "monster", name: "Statue", x: 0.8, y: 0.8, hidden: true },
    ]);
    g = start(g, 2);
    const statue = placed(g).find((t) => t.name === "Statue")!;
    expect(statue.combatantId).toBeUndefined();
    expect(statue.hidden).toBe(true);
    const fight = placed(g).filter((t) => t.combatantId);
    expect(fight).toHaveLength(2);
    expect(new Set(fight.map((t) => t.combatantId)).size).toBe(2);
    expect(fight.some((t) => t.x === 0.2 && t.y === 0.2)).toBe(true);
    // The fight is called off: its tokens go, the statue stays.
    g = run(g, [{ type: "fight.cancel" }]);
    expect(placed(g).map((t) => t.name)).toEqual(["Statue"]);
  });

  it("a monster added during the fight takes a token placed for it", () => {
    let g = run(game(), [{ type: "scene.show", sceneId: MAP }, { type: "fight.start" }]);
    g = run(g, [{ type: "token.add", sceneId: MAP, kind: "monster", name: "Monster", x: 0.3, y: 0.3, hidden: true }]);
    expect(placed(g)[0].combatantId).toBeUndefined();
    g = run(g, [{ type: "fight.add", templateId: GREMLIN, count: 1 }]);
    expect(placed(g)).toHaveLength(1);
    expect(placed(g)[0].combatantId).toBe(g.fight!.order.find((c) => c.kind === "monster")!.id);
  });
});

describe("fight tokens and the fog", () => {
  const ART = "/api/files/t/0123456789abcdef01234567.webp";
  const GRID = { snap: true, lines: false, cell: 0.1, ox: 0, oy: 0, aspect: 1 };
  function foggedMap(clearCells: [number, number][]): GameState {
    let g = run(game(), [
      { type: "scene.update", sceneId: MAP, patch: { art: { url: ART } } },
      { type: "scene.show", sceneId: MAP },
      { type: "map.grid", sceneId: MAP, grid: GRID },
      { type: "fog.setup", sceneId: MAP, layout: fogLayout(GRID, 1), tiles: { cols: 1, rows: 1, urls: [ART], src: ART } },
    ]);
    const f = g.scenes.find((s) => s.id === MAP)!.map!.fog!;
    const b = decodeBits(f.bits, f.cols, f.rows);
    for (const [c, r] of clearCells) setBit(b, r * f.cols + c, true);
    return run(g, [{ type: "fog.bits", sceneId: MAP, bits: encodeBits(b) }]);
  }

  it("puts the fight's monsters where the fog is clear, so the TV shows them", () => {
    // Only the bottom-left corner is clear; the middle is still fogged.
    const cells: [number, number][] = [];
    for (let c = 0; c < 5; c++) for (let r = 6; r < 10; r++) cells.push([c, r]);
    let g = foggedMap(cells);
    g = run(g, [{ type: "fight.start", groups: [{ templateId: GREMLIN, count: 2 }] }]);
    const foes = tokens(g).filter((t) => t.combatantId);
    expect(foes).toHaveLength(2);
    const tv = tvMap(g).tokens;
    for (const t of foes) expect(tv.some((x) => x.id === t.id)).toBe(true);
  });

  it("goes near the party when they're on the map", () => {
    let g = run(game(), [{ type: "scene.show", sceneId: MAP }, { type: "token.party", sceneId: MAP, x: 0.2, y: 0.8 }]);
    g = run(g, [{ type: "fight.start", groups: [{ templateId: GREMLIN, count: 1 }] }]);
    const foe = tokens(g).find((t) => t.combatantId)!;
    expect(foe.x).toBeLessThan(0.45);
    expect(foe.y).toBeLessThan(0.8);
    expect(foe.y).toBeGreaterThan(0.5);
  });
});

describe("monsterKey", () => {
  it("matches a placed token's name to a fight's monster", () => {
    expect(monsterKey("Goblin A")).toBe("goblin");
    expect(monsterKey("Goblins")).toBe("goblin");
    expect(monsterKey("  goblin 3 ")).toBe("goblin");
    expect(monsterKey("Cutlass")).toBe("cutlass");
    expect(monsterKey("Bass")).toBe("bass");
  });
});
