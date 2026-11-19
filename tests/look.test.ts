// Pixel-art looks: the recipe is cleaned, every part draws, and the look reaches tokens, the purse and the turn order.
import { describe, expect, it } from "vitest";
import { dmCommand, playerCommand, type Command } from "@/shared/commands";
import { cleanCharLook, LAYERS, LOOK_COLORS, LOOK_PARTS, lookCount, randomizeGroup, randomLook, type Look } from "@/shared/look";
import { drawLook, drawLookFace, frameOf, LOOK_H, LOOK_W, MOUTH } from "@/shared/lookArt";
import { projectPlayer, projectTv } from "@/shared/projection";
import { apply, type Ctx } from "@/shared/reducer";
import { seedGame } from "@/shared/seed";
import { hydrate } from "@/server/store";
import type { GameState } from "@/shared/types";

const DM: Ctx = { now: 1000, actor: { role: "dm" } };
const as = (playerId: string): Ctx => ({ now: 1000, actor: { role: "player", playerId } });
const MAP = "s-map";

function game(): GameState {
  const g = hydrate(seedGame("t"))!;
  g.players[2].away = true;
  g.players[3].away = true;
  return g;
}
const go = (g: GameState, cmd: Command, ctx: Ctx = DM) => apply(g, cmd, { ...ctx, rand: () => 0.5 }).state;
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}
const painted = (look: Look) => drawLook(look).d.filter(Boolean).length;

describe("the recipe", () => {
  it("keeps known parts with whole numbers in range and drops the rest", () => {
    expect(cleanCharLook({ hair: 3, skin: 1, bogus: 2, hat: 999, eyes: -1, mouth: 1.5 })).toEqual({ hair: 3, skin: 1 });
    expect(cleanCharLook({ nope: 1 })).toBeNull();
    expect(cleanCharLook("hair")).toBeNull();
    expect(cleanCharLook([1, 2])).toBeNull();
  });

  it("random looks are always valid, and a tab's dice only change that tab", () => {
    const r = seeded(4);
    for (let i = 0; i < 200; i++) {
      const l = randomLook(r);
      expect(cleanCharLook(l)).toEqual(l);
    }
    const base = randomLook(seeded(9));
    const next = randomizeGroup(base, "hair", seeded(10));
    for (const k of [...LOOK_PARTS, ...LOOK_COLORS]) if (!["hair", "beard", "hairColor"].includes(k)) expect(next[k]).toBe(base[k]);
  });
});

describe("drawing", () => {
  it("draws every option of every layer and every colour without throwing", () => {
    for (const l of LAYERS)
      for (let i = 0; i < l.options.length; i++) {
        const p = drawLook({ [l.key]: i, background: 0 });
        expect(p.w).toBe(LOOK_W);
        expect(p.h).toBe(LOOK_H);
        expect(p.d.filter(Boolean).length).toBeGreaterThan(150);
      }
    for (const k of LOOK_COLORS) for (let i = 0; i < lookCount(k); i++) expect(painted({ [k]: i })).toBeGreaterThan(150);
    for (let i = 0; i < 300; i++) drawLook(randomLook(seeded(i)));
  });

  it("each option looks different from the default (no part is a no-op)", () => {
    const key = (l: Look) => drawLook({ background: 1, ...l }).d.join();
    const plain = key({});
    for (const l of LAYERS)
      for (let i = 0; i < l.options.length; i++) {
        const def = ({ hair: 1, background: 1 } as Record<string, number>)[l.key] ?? 0;
        if (i === def) continue;
        expect(key({ [l.key]: i }), `${l.label}: ${l.options[i]}`).not.toBe(plain);
      }
  });

  it("the face crop is a square around the head", () => {
    const f = drawLookFace({ background: 1 });
    expect([f.w, f.h]).toEqual([22, 22]);
    expect(f.d.every(Boolean)).toBe(true);
  });
});

describe("saving a look", () => {
  it("a player saves and removes their own; the DM can set anyone's", () => {
    const look = { hair: 4, outfit: 2, pet: 1 };
    expect(playerCommand.safeParse({ type: "me.look", look }).success).toBe(true);
    let g = go(game(), { type: "me.look", look: { ...look, junk: 3 } as Look }, as("p1"));
    expect(g.players.find((p) => p.id === "p1")!.look).toEqual(look);
    expect(projectPlayer(g, 1, "p1", []).me.look).toEqual(look);
    g = go(g, { type: "me.look", look: null }, as("p1"));
    expect(g.players.find((p) => p.id === "p1")!.look).toBeUndefined();

    expect(dmCommand.safeParse({ type: "player.look", playerId: "p2", look }).success).toBe(true);
    g = go(g, { type: "player.look", playerId: "p2", look });
    expect(g.players.find((p) => p.id === "p2")!.look).toEqual(look);
  });

  it("refuses silly input", () => {
    expect(playerCommand.safeParse({ type: "me.look", look: { hair: 500 } }).success).toBe(false);
    expect(playerCommand.safeParse({ type: "me.look", look: { hair: "x" } }).success).toBe(false);
  });
});

describe("where it shows", () => {
  it("rides along on the purse, party tokens and the turn order", () => {
    const look = { hair: 2, hat: 1 };
    let g = go(game(), { type: "me.look", look }, as("p1"));
    const tv = projectTv(g, 1);
    expect(tv.purse.find((p) => p.id === "p1")!.look).toEqual(look);
    expect(tv.purse.find((p) => p.id === "p2")!.look).toBeUndefined();

    g = go(g, { type: "token.party", sceneId: MAP, x: 0.5, y: 0.5 });
    const toks = projectTv(g, 1).scenes.find((s) => s.id === MAP)!.map!.tokens;
    expect(toks.find((t) => t.playerId === "p1")!.look).toEqual(look);
    expect(toks.find((t) => t.playerId === "p2")!.look).toBeUndefined();

    g = go(g, { type: "fight.start", groups: [{ templateId: "m-pudding-gremlin", count: 1 }] });
    const order = projectTv(g, 1).fight!.order;
    expect(order.find((c) => c.playerId === "p1")!.look).toEqual(look);
    expect(order.find((c) => c.kind === "monster")!.look).toBeUndefined();
  });

  it("an NPC picture made in the maker keeps its recipe for the DM only, and a plain upload drops it", () => {
    let g = game();
    const e = g.entries!.find((x) => x.kind === "person")!;
    const look = { beard: 5, hat: 1 };
    g = go(g, { type: "entry.picture", entryId: e.id, art: { url: "/api/files/t/a.png" }, look });
    expect(g.entries!.find((x) => x.id === e.id)!.pixelLook).toEqual(look);
    expect(JSON.stringify(projectTv(g, 1))).not.toContain('"beard"');
    g = go(g, { type: "entry.picture", entryId: e.id, art: { url: "/api/files/t/b.png" } });
    expect(g.entries!.find((x) => x.id === e.id)!.pixelLook).toBeUndefined();
  });
});

describe("the detailed (double size) version", () => {
  it("draws every option at 96×112, fully covered with a backdrop, and a 44px face", async () => {
    const { drawLookHd, drawLookHdFace, HD_W, HD_H } = await import("@/shared/lookArtHd");
    for (const l of LAYERS)
      for (let i = 0; i < l.options.length; i++) {
        const p = drawLookHd({ [l.key]: i, background: l.key === "background" ? i : 1 });
        expect([p.w, p.h]).toEqual([HD_W, HD_H]);
        if (l.key !== "background" || i > 0) expect(p.d.every(Boolean)).toBe(true);
      }
    const f = drawLookHdFace({ background: 1 });
    expect([f.w, f.h]).toEqual([44, 44]);
  });

  it("a face is just the character, framed tall enough for a hat", async () => {
    const { drawLookHdFace } = await import("@/shared/lookArtHd");
    // No backdrop, pet or stand: the corners are see-through, so a token ring's colour shows.
    const f = drawLookHdFace({ background: 6, pet: 3, platform: 2 });
    expect(f.get(0, 0)).toBeFalsy();
    expect(f.get(f.w - 1, 0)).toBeFalsy();
    // A wizard hat makes the square taller than a bare head, and its top row still has the hat in it.
    const bare = drawLookHdFace({ hat: 0, hair: 1 });
    const hat = drawLookHdFace({ hat: 1, hair: 1 });
    expect(hat.h).toBeGreaterThan(bare.h);
    expect(hat.w).toBe(hat.h);
  });

  it("drawn styles keep outlines in picture units, so small thumbnails don't go black", async () => {
    const { lookSvg } = await import("@/shared/lookVector");
    for (const st of ["ink", "paint", "cel"] as const) expect(lookSvg({ outfit: 11, hat: 13 }, st)).not.toContain("non-scaling-stroke");
  });

  it("drawn styles frame a face around what's on the head, without the backdrop", async () => {
    const { lookSvg } = await import("@/shared/lookVector");
    const vb = (svg: string) => svg.match(/viewBox="([^"]+)"/)![1].split(" ").map(Number);
    for (const st of ["ink", "paint", "cel"] as const) {
      const bare = vb(lookSvg({ hat: 0, hair: 1 }, st, true));
      const wiz = vb(lookSvg({ hat: 1, hair: 1 }, st, true));
      expect(wiz[1]).toBeLessThan(bare[1]);
      expect(wiz[2]).toBe(wiz[3]);
      // The ground shadow goes with the backdrop and stand: in the whole picture, not in a face.
      expect(lookSvg({ background: 1 }, st, false)).toContain('cy="205"');
      expect(lookSvg({ background: 1 }, st, true)).not.toContain('cy="205"');
    }
  });

  it("every beard leaves the whole mouth showing, on every build", async () => {
    const { drawLookHd } = await import("@/shared/lookArtHd");
    const mouthPixels = (look: Look) => {
      const f = frameOf(look.body ?? 0);
      const p = drawLookHd({ hair: 0, background: 0, ...look });
      let n = 0;
      for (let y = f.hy * 2 + 18; y <= f.hy * 2 + 21; y++) for (let x = f.hx * 2 + 8; x <= f.hx * 2 + 15; x++) if (p.get(x, y) === MOUTH) n++;
      return n;
    };
    for (let body = 0; body < lookCount("body"); body++)
      for (let mouth = 0; mouth < lookCount("mouth"); mouth++) {
        const bare = mouthPixels({ body, mouth });
        expect(bare).toBeGreaterThan(0);
        for (let beard = 1; beard < lookCount("beard"); beard++) expect(mouthPixels({ body, mouth, beard })).toBe(bare);
      }
  });

  it("eyes and mouths stay under hair and hats instead of showing through", async () => {
    const { drawLookHd } = await import("@/shared/lookArtHd");
    // A helm's brow line crosses where wide eyes' brows would be: no eye-white or outline may land on the helm.
    const f = frameOf(0);
    const helm = drawLookHd({ hat: 3, eyes: 2, background: 0 });
    const plain = drawLookHd({ hat: 3, eyes: 6, background: 0 });
    for (let x = f.hx * 2; x < f.hx * 2 + 24; x++) for (let y = f.hy * 2; y < f.hy * 2 + 10; y++) expect(helm.get(x, y)).toBe(plain.get(x, y));
  });
});

describe("hair under hats", () => {
  it("a hood, helm or hat tucks the hair in: nothing pokes out above the brim", () => {
    const f = frameOf(0);
    // One row short of the brim: the outline of hair showing below it sits there.
    const above = (look: Look, rows: number) => drawLook({ background: 0, ...look }).crop(0, 0, LOOK_W, f.hy + rows - 1).d.join();
    // Every style except the ponytail, whose tail hangs out the back on purpose.
    for (const [hat, rows] of [[1, 3], [2, 10], [3, 5], [4, 5], [9, 2], [11, 3], [13, 3]] as const)
      for (let hair = 1; hair < lookCount("hair"); hair++) if (hair !== 5) expect(above({ hat, hair }, rows), `hat ${hat} hair ${hair}`).toBe(above({ hat, hair: 0 }, rows));
  });
});

describe("pixel detail levels", () => {
  it("draws the same recipe at 8, 16 and 32-bit sizes, and 32-bit is what a look without a level gets", async () => {
    const { drawLookDetail, drawLookDetailFace } = await import("@/shared/lookDetail");
    const { drawLookHd } = await import("@/shared/lookArtHd");
    const look: Look = { ...randomLook(seeded(4)), background: 1 };
    const sizes = [0, 1, 2].map((detail) => {
      const p = drawLookDetail({ ...look, detail });
      expect(p.d.every(Boolean)).toBe(true);
      const f = drawLookDetailFace({ ...look, detail });
      return [p.w, p.h, f.w, f.h];
    });
    expect(sizes).toEqual([
      [48, 56, 22, 22],
      [48, 56, 22, 22],
      [96, 112, 44, 44],
    ]);
    expect(drawLookDetail(look).d.join()).toBe(drawLookHd(look).d.join());
    // A look saved at the removed 64-bit level draws as 32-bit.
    expect(drawLookDetail({ ...look, detail: 3 }).d.join()).toBe(drawLookHd(look).d.join());
    // 8-bit keeps to a small console palette; 16-bit at the same size uses more colours.
    const colours = (detail: number) => new Set(drawLookDetail({ ...look, detail }).d).size;
    expect(colours(0)).toBeLessThan(colours(1));
    expect(colours(0)).toBeLessThanOrEqual(54);
  });

  it("the level is saved with the look, and the default is left out", () => {
    expect(cleanCharLook({ hair: 2, detail: 0 })).toEqual({ hair: 2, detail: 0 });
    expect(cleanCharLook({ hair: 2, detail: 1 })).toEqual({ hair: 2, detail: 1 });
    // The removed 64-bit level: a look saved with it goes back to the default.
    expect(cleanCharLook({ hair: 2, detail: 3 })).toEqual({ hair: 2 });
    expect(cleanCharLook({ hair: 2, detail: 2 })).toEqual({ hair: 2 });
    expect(cleanCharLook({ hair: 2, detail: 9 })).toEqual({ hair: 2 });
    expect(cleanCharLook({ hair: 2, detail: "8" })).toEqual({ hair: 2 });
  });

  it("the cape, long cloak and hooded cloak flare out from the shoulders instead of hanging as a box", async () => {
    const { drawLookHd } = await import("@/shared/lookArtHd");
    const f = frameOf(0);
    for (const cloak of [1, 2, 5]) {
      const p = drawLookHd({ cloak, background: 0, hair: 0 });
      const width = (y: number) => {
        let x0 = 0;
        while (x0 < p.w && !p.get(x0, y)) x0++;
        let x1 = p.w - 1;
        while (x1 > x0 && !p.get(x1, y)) x1--;
        return x1 - x0;
      };
      expect(width(f.ly * 2 + 8), `cloak ${cloak}`).toBeGreaterThan(width(f.ty * 2 + 6) + 3);
    }
  });
});
