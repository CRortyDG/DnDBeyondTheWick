// Drawn art styles: the same look recipe drawn as Storybook, Painted or Cartoon,
// a player's own pick, and the DM's one-style-for-the-table switch.
import { describe, expect, it } from "vitest";
import { dmCommand, playerCommand, type Command } from "@/shared/commands";
import { cleanCharLook, LAYERS, LOOK_STYLES, lookKey, lookStyleOf, randomLook, type Look } from "@/shared/look";
import { lookSvg, type VectorStyle } from "@/shared/lookVector";
import { projectDm, projectPlayer, projectTv } from "@/shared/projection";
import { apply, type Ctx } from "@/shared/reducer";
import { seedGame } from "@/shared/seed";
import { hydrate } from "@/server/store";
import type { GameState } from "@/shared/types";

const DM: Ctx = { now: 1000, actor: { role: "dm" } };
const as = (playerId: string): Ctx => ({ now: 1000, actor: { role: "player", playerId } });
const game = (): GameState => hydrate(seedGame("t"))!;
const go = (g: GameState, cmd: Command, ctx: Ctx = DM) => apply(g, cmd, { ...ctx, rand: () => 0.5 }).state;
const DRAWN: VectorStyle[] = ["ink", "paint", "cel"];
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}
const sane = (svg: string) => {
  expect(svg.startsWith("<svg")).toBe(true);
  expect(svg.endsWith("</svg>")).toBe(true);
  expect(svg).not.toMatch(/undefined|NaN|Infinity|\[object/);
};

describe("art style in the recipe", () => {
  it("keeps a real style, drops a bad one, and the style changes the cache key", () => {
    expect(cleanCharLook({ hair: 2, style: 2 })).toEqual({ hair: 2, style: 2 });
    expect(cleanCharLook({ hair: 2, style: 0 })).toEqual({ hair: 2 });
    expect(cleanCharLook({ hair: 2, style: 99 })).toEqual({ hair: 2 });
    expect(cleanCharLook({ hair: 2, style: 1.5 })).toEqual({ hair: 2 });
    expect(lookKey({ hair: 2 })).not.toBe(lookKey({ hair: 2, style: 3 }));
  });

  it("the table's style wins over a player's own pick", () => {
    expect(lookStyleOf({})).toBe("pixel");
    expect(lookStyleOf({ style: 2 })).toBe("paint");
    expect(lookStyleOf({ style: 2 }, 3)).toBe("cel");
    expect(lookStyleOf({ style: 2 }, 0)).toBe("pixel");
    expect(LOOK_STYLES.map((s) => s.id)).toEqual(["pixel", "ink", "paint", "cel"]);
  });
});

describe("drawing the drawn styles", () => {
  it("draws every option of every layer in every style", () => {
    for (const st of DRAWN)
      for (const l of LAYERS)
        for (let i = 0; i < l.options.length; i++) {
          sane(lookSvg({ [l.key]: i, background: 1, platform: 2 }, st));
          sane(lookSvg({ [l.key]: i }, st, true));
        }
  });

  it("each option draws differently from the default (no part is a no-op)", () => {
    for (const st of DRAWN) {
      const plain = lookSvg({ background: 1 }, st);
      for (const l of LAYERS)
        for (let i = 0; i < l.options.length; i++) {
          const def = ({ hair: 1, background: 1 } as Record<string, number>)[l.key] ?? 0;
          if (i === def) continue;
          expect(lookSvg({ background: 1, [l.key]: i }, st), `${st} ${l.label}: ${l.options[i]}`).not.toBe(plain);
        }
    }
  });

  it("random characters always draw, and the styles really differ", () => {
    for (let i = 0; i < 100; i++) {
      const l = randomLook(seeded(i));
      const out = DRAWN.map((st) => lookSvg(l, st));
      out.forEach(sane);
      expect(new Set(out).size).toBe(3);
    }
  });

  it("the face is a square crop", () => {
    const vb = /viewBox="([^"]+)"/.exec(lookSvg({ background: 1 }, "paint", true))![1].split(" ").map(Number);
    expect(vb[2]).toBeCloseTo(vb[3]);
  });
});

describe("saving a style", () => {
  it("a player's own style is saved with their look and reaches the TV", () => {
    const look: Look = { hair: 4, style: 3 };
    expect(playerCommand.safeParse({ type: "me.look", look }).success).toBe(true);
    const g = go(game(), { type: "me.look", look }, as("p1"));
    expect(g.players.find((p) => p.id === "p1")!.look).toEqual(look);
    expect(projectTv(g, 1).purse.find((p) => p.id === "p1")?.look).toEqual(look);
  });

  it("only the DM sets one style for the table, every screen hears it, and it clears", () => {
    expect(dmCommand.safeParse({ type: "game.lookStyle", style: 2 }).success).toBe(true);
    expect(playerCommand.safeParse({ type: "game.lookStyle", style: 2 }).success).toBe(false);
    let g = go(game(), { type: "game.lookStyle", style: 2 });
    expect(g.lookStyle).toBe(2);
    expect(projectTv(g, 1).lookStyle).toBe(2);
    expect(projectPlayer(g, 1, "p1", []).lookStyle).toBe(2);
    expect(projectDm(g, 1, []).state.lookStyle).toBe(2);
    g = go(g, { type: "game.lookStyle", style: 99 });
    expect(g.lookStyle).toBeUndefined();
    expect(projectTv(g, 1).lookStyle).toBeUndefined();
  });
});
