// Tokens on maps: the party, monsters from the fight, the grid, and what never reaches the TV.
import { describe, expect, it } from "vitest";
import { dmCommand, type Command } from "@/shared/commands";
import { projectTv } from "@/shared/projection";
import { apply, type Ctx } from "@/shared/reducer";
import { seedGame } from "@/shared/seed";
import { initials, snapToGrid } from "@/shared/tokens";
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
