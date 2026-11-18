// Pixel-art looks: the recipe is cleaned, every part draws, and the look reaches tokens, the purse and the turn order.
import { describe, expect, it } from "vitest";
import { dmCommand, playerCommand, type Command } from "@/shared/commands";
import { cleanCharLook, LAYERS, LOOK_COLORS, LOOK_PARTS, lookCount, randomizeGroup, randomLook, type Look } from "@/shared/look";
import { drawLook, drawLookFace, LOOK_H, LOOK_W } from "@/shared/lookArt";
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
});
