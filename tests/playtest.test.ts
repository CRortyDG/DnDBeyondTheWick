// Fixes from the first playtest's bug list.
import { beforeEach, describe, expect, it } from "vitest";
import type { Command } from "@/shared/commands";
import { apply, CommandError, type Ctx } from "@/shared/reducer";
import { seedGame } from "@/shared/seed";
import { blankGame } from "@/shared/presets";
import { ranksOf } from "@/shared/renown";
import { categoriesFor, categoryLabel, raisedCp } from "@/shared/progress";
import { slugInput } from "@/shared/discovery";
import { ensureBackstory, emptyStory } from "@/shared/story";
import type { Actor, GameState } from "@/shared/types";
import { hydrate } from "@/server/store";
import { nameLines } from "@/client/arrival/RoundTable";

const DM: Actor = { role: "dm" };
let g: GameState;
let now = 1000;
function as(actor: Actor, cmd: Command) {
  const r = apply(g, cmd, { now: ++now, actor } as Ctx);
  g = r.state;
  return r;
}
const dm = (cmd: Command) => as(DM, cmd);
function fails(cmd: Command): string {
  try {
    dm(cmd);
  } catch (e) {
    if (e instanceof CommandError) return e.message;
    throw e;
  }
  throw new Error("expected the command to fail");
}

beforeEach(() => {
  g = hydrate(seedGame("t", "Test", 1))!;
});

describe("the leads board on the TV", () => {
  it("comes down with a new scene, the shop, a recap, Clear TV and the end of a session", () => {
    const other = g.scenes.find((x) => x.id !== g.live.sceneId && x.kind !== "black")!;
    dm({ type: "live.leads", on: true });
    dm({ type: "scene.show", sceneId: other.id });
    expect(g.live.leads).toBeUndefined();

    dm({ type: "live.leads", on: true });
    const shop = g.shops[0];
    shop.visibility = "all";
    delete shop.closed;
    dm({ type: "live.shop", open: true, shopId: shop.id });
    expect(g.live.leads).toBeUndefined();

    dm({ type: "live.leads", on: true });
    dm({ type: "dice.clearTv" });
    expect(g.live.leads).toBeUndefined();

    dm({ type: "session.start", title: "One" });
    dm({ type: "live.leads", on: true });
    dm({ type: "session.end" });
    expect(g.live.leads).toBeUndefined();
  });
});

describe("a long rest", () => {
  it("puts every player with HP back to full and clears temporary HP", () => {
    g.players[0].hp = { cur: 2, max: 18, temp: 4 };
    g.players[1].hp = { cur: 0, max: 0, temp: 0 };
    dm({ type: "party.longRest" });
    expect(g.players[0].hp).toMatchObject({ cur: 18, max: 18, temp: 0 });
    expect(g.players[1].hp).toMatchObject({ cur: 0, max: 0 });
  });
  it("waits for an open fight to end", () => {
    dm({ type: "fight.start" });
    expect(fails({ type: "party.longRest" })).toMatch(/fight/);
  });
});

describe("a blank campaign has no Candlefair in it", () => {
  it("words Renown and the shop for its own town, or none", () => {
    const blank = blankGame("b", "Blank", 1);
    const words = JSON.stringify(ranksOf(blank));
    expect(words).not.toMatch(/Baldur|Coast|Candlefair|boat/);
    expect(ranksOf(blank)[1].raised).toBe("The town knows your names");
    expect(ranksOf({ town: "Emberlee" })[4].raised).toMatch(/Emberlee/);
    expect(categoryLabel("building", "")).toBe("Town projects");
    expect(categoriesFor("Emberlee").find((c) => c.id === "building")!.label).toBe("Building Emberlee");
    // Candlefair keeps its own wording.
    expect(ranksOf(g)[4].name).toBe("Famous on the Coast");
    expect(categoryLabel("building", "Candlefair")).toBe("Building Candlefair");
  });
  it("isn't offered Candlefair's maps", () => {
    g = hydrate(structuredClone(blankGame("b", "Blank", 1)))!;
    expect(fails({ type: "map.addSeedMaps" })).toMatch(/Candlefair/);
  });
});

describe("run sheet names", () => {
  it("take the kind off a typed ref instead of doubling it", () => {
    expect(slugInput("place/emberlee")).toBe("emberlee");
    expect(slugInput(" emberlee ")).toBe("emberlee");
    const e = g.entries!.find((x) => x.kind === "place")!;
    dm({ type: "entry.update", entryId: e.id, patch: { slug: "place/emberlee" } });
    expect(g.entries!.find((x) => x.id === e.id)!.slug).toBe("emberlee");
  });
});

describe("seat names on the TV", () => {
  it("break after a comma instead of being cut", () => {
    expect(nameLines("Sister Cass, Keeper of the Beacon", 30)).toEqual(["Sister Cass,", "Keeper of the Beacon"]);
    expect(nameLines("Wren", 30)).toEqual(["Wren"]);
  });
});

describe("deleting a player", () => {
  it("takes their empty Backstory lane with them", () => {
    g.story ??= emptyStory();
    ensureBackstory(g.story, g.players);
    const p = g.players[0];
    expect(g.story.threads.some((t) => t.playerId === p.id)).toBe(true);
    dm({ type: "player.remove", playerId: p.id });
    expect(g.story!.threads.some((t) => t.playerId === p.id)).toBe(false);
  });
});

describe("NPC money toward a project", () => {
  it("counts toward the goal without touching anyone's purse", () => {
    const it = g.items.find((x) => x.kind === "project")!;
    const before = g.players.map((p) => p.balanceCp);
    dm({ type: "project.npcContribute", itemId: it.id, amountCp: 500, from: "The town council" });
    expect(raisedCp(g, it.id)).toBe(500);
    expect(g.players.map((p) => p.balanceCp)).toEqual(before);
    expect(g.stakes.some((k) => k.itemId === it.id)).toBe(false);
    dm({ type: "project.npcContribute", itemId: it.id, amountCp: it.priceCp, from: "A patron" });
    expect(g.effectsOn[it.id]).toBeDefined();
  });
});

describe("a long rest in the Chronicle", () => {
  const rests = () => (g.notes ?? []).filter((n) => /long rest/.test(n.text));
  it("logs one visible DM line, once per rest", () => {
    dm({ type: "party.longRest" });
    expect(rests()).toHaveLength(1);
    expect(rests()[0]).toMatchObject({ text: "The party took a long rest.", authorId: "dm" });
    expect(rests()[0].hidden).toBeFalsy();
    // A double press doesn't log it twice.
    dm({ type: "party.longRest" });
    expect(rests()).toHaveLength(1);
    // Much later, it's a new rest.
    now += 31 * 60_000;
    dm({ type: "party.longRest" });
    expect(rests()).toHaveLength(2);
  });
  it("names who rested when only some did, and the DM can remove it", () => {
    const [a, b] = g.players;
    dm({ type: "party.longRest", playerIds: [a.id, b.id] });
    const n = rests()[0];
    expect(n.text).toBe(`${a.character?.trim() || a.name} and ${b.character?.trim() || b.name} took a long rest.`);
    dm({ type: "note.remove", noteId: n.id });
    expect(rests()).toHaveLength(0);
  });
});
