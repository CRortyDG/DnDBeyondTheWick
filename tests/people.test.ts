// The People compendium: NPCs unlock when the party meets them; facts reveal over time.
import { beforeEach, describe, expect, it } from "vitest";
import type { Command } from "@/shared/commands";
import { projectDm, projectPlayer, projectTv } from "@/shared/projection";
import { apply, CommandError, type Ctx } from "@/shared/reducer";
import { freshStart, seedGame } from "@/shared/seed";
import type { Actor, GameState } from "@/shared/types";
import { hydrate } from "@/server/store";
import { SEED_NPCS } from "@/server/seed-npcs";

const DM: Actor = { role: "dm" };
const P1: Actor = { role: "player", playerId: "p1" };

let g: GameState;
let now = 1000;

function as(actor: Actor, cmd: Command) {
  const r = apply(g, cmd, { now: ++now, actor } as Ctx);
  g = r.state;
  return r;
}
const dm = (cmd: Command) => as(DM, cmd);
function fails(actor: Actor, cmd: Command): string {
  try {
    as(actor, cmd);
  } catch (e) {
    if (e instanceof CommandError) return e.message;
    throw e;
  }
  throw new Error("expected the command to fail");
}
const npc = (id: string) => g.npcs!.find((n) => n.id === id)!;
const phone = () => projectPlayer(g, 1, "p1", []);
const tvJson = () => JSON.stringify(projectTv(g, 1));
const phoneJson = () => JSON.stringify(phone());

beforeEach(() => {
  g = hydrate(seedGame("t"))!;
});

describe("the starter compendium", () => {
  it("comes from the server with every fact locked and nobody met", () => {
    expect(g.npcs!.map((n) => n.id)).toEqual(SEED_NPCS.map((n) => n.id));
    expect(npc("npc-mags").sceneId).toBe("s-mags");
    expect(g.npcs!.every((n) => !n.met && n.facts.every((f) => f.revealedAt === undefined))).toBe(true);
    expect(phone().people).toEqual([]);
  });

  it("is added once, so a deleted entry stays deleted", () => {
    dm({ type: "npc.remove", npcId: "npc-bolla" });
    g = hydrate(g)!;
    expect(g.npcs!.some((n) => n.id === "npc-bolla")).toBe(false);
  });

  it("counts portraits the table had already seen as met, quietly", () => {
    const old = seedGame("old");
    old.scenes.find((x) => x.id === "s-mags")!.known = true;
    const h = hydrate(old)!;
    expect(h.npcs!.find((n) => n.id === "npc-mags")!.met).toBeTruthy();
    expect(h.npcMoment).toBeUndefined();
  });

  it("keeps locked facts and DM notes out of the browser seed", () => {
    expect(JSON.stringify(seedGame("x"))).not.toContain("won’t burn");
  });
});

describe("meeting people", () => {
  it("unlocks an NPC the first time their portrait is on the TV", () => {
    dm({ type: "scene.show", sceneId: "s-mags" });
    const m = npc("npc-mags");
    expect(m.met).toBeTruthy();
    const p = phone().people;
    expect(p.map((x) => x.name)).toEqual(["Mags Wick"]);
    expect(p[0].art).toEqual({ builtin: "mags-wick" });
    expect(p[0].facts).toEqual([]);
    expect(projectTv(g, 1).npcMoment).toMatchObject({ name: "Mags Wick", title: "Keeper of the Flickering Candle" });
    // A line in the Chronicle, filed under her name.
    const note = g.notes!.at(-1)!;
    expect(note.text).toBe("The party met Mags Wick, keeper of the Flickering Candle.");
    expect(note.tags).toContain("Mags Wick");
  });

  it("only plays the moment once", () => {
    dm({ type: "scene.show", sceneId: "s-mags" });
    const n = g.npcMoment!.n;
    const notes = g.notes!.length;
    dm({ type: "scene.show", sceneId: "s-board" });
    dm({ type: "scene.show", sceneId: "s-mags" });
    expect(g.npcMoment!.n).toBe(n);
    expect(g.notes!.length).toBe(notes);
  });

  it("introduces someone without a portrait, loudly or quietly", () => {
    dm({ type: "npc.meet", npcId: "npc-bolla", met: true, announce: true });
    expect(projectTv(g, 1).npcMoment?.name).toBe("Bolla");
    expect(projectTv(g, 1).npcMoment?.art).toBeUndefined();
    const n = g.npcMoment!.n;
    dm({ type: "npc.meet", npcId: "npc-captain", met: true, announce: false });
    expect(g.npcMoment!.n).toBe(n);
    expect(phone().people.map((x) => x.name)).toEqual(["Bolla", "The captain"]);
    expect(fails(DM, { type: "npc.meet", npcId: "npc-bolla", met: true, announce: true })).toMatch(/already met/);
  });

  it("makes an entry for a new portrait the first time it's shown", () => {
    const sceneId = "s-new";
    g.scenes.push({ id: sceneId, label: "Smith", kind: "portrait", hotkey: null, reveal: false, name: "Old Hannet", title: "Smith" });
    dm({ type: "scene.show", sceneId });
    expect(g.npcs!.find((n) => n.sceneId === sceneId)).toMatchObject({ name: "Old Hannet", title: "Smith" });
    expect(phone().people.map((x) => x.name)).toContain("Old Hannet");
  });

  it("follows the Scenes tab's 'met' checkbox, and back to a stranger leaves the phones", () => {
    dm({ type: "scene.known", sceneId: "s-artum", known: true });
    expect(npc("npc-artum").met).toBeTruthy();
    expect(g.npcMoment).toBeUndefined();
    dm({ type: "npc.meet", npcId: "npc-artum", met: false, announce: false });
    expect(g.scenes.find((x) => x.id === "s-artum")!.known).toBeUndefined();
    expect(phone().people).toEqual([]);
  });

  it("knows which chapter they met in", () => {
    dm({ type: "session.start" });
    dm({ type: "scene.show", sceneId: "s-chef" });
    expect(phone().people[0].met.chapter).toBe(1);
  });

  it("only the DM can introduce or edit people", () => {
    expect(fails(P1, { type: "npc.meet", npcId: "npc-mags", met: true, announce: true } as Command)).toMatch(/Only the DM/);
  });
});

describe("facts", () => {
  it("stay off the TV and phones until revealed, and DM notes never leave", () => {
    dm({ type: "scene.show", sceneId: "s-chef" });
    expect(phoneJson()).not.toContain("won’t burn");
    expect(phoneJson()).not.toContain("Mortified");
    expect(tvJson()).not.toContain("Mortified");
    dm({ type: "npc.factReveal", npcId: "npc-chef", factId: "npc-chef-f3", revealed: true });
    expect(phone().people[0].facts.map((f) => f.text)).toEqual(["The pages won’t burn. They come out of the fire cold."]);
    expect(phoneJson()).not.toContain("traveling merchant");
    expect(phoneJson()).not.toContain("Mortified");
    expect(projectTv(g, 1).npcMoment?.fact).toBeUndefined();
  });

  it("can be shown on the TV once they've met", () => {
    expect(fails(DM, { type: "npc.factReveal", npcId: "npc-chef", factId: "npc-chef-f1", revealed: true, tv: true })).toMatch(/hasn't met/);
    dm({ type: "npc.meet", npcId: "npc-chef", met: true, announce: false });
    dm({ type: "npc.factReveal", npcId: "npc-chef", factId: "npc-chef-f1", revealed: true, tv: true });
    expect(projectTv(g, 1).npcMoment).toMatchObject({ name: "The Chef", fact: "Bought his new recipes from a traveling merchant." });
    // Hiding it again takes it back off the TV and the phones.
    dm({ type: "npc.factReveal", npcId: "npc-chef", factId: "npc-chef-f1", revealed: false });
    expect(projectTv(g, 1).npcMoment).toBeUndefined();
    expect(phone().people[0].facts).toEqual([]);
  });

  it("revealed before meeting shows up once they meet", () => {
    dm({ type: "npc.factReveal", npcId: "npc-mags", factId: "npc-mags-f2", revealed: true });
    expect(phone().people).toEqual([]);
    dm({ type: "scene.show", sceneId: "s-mags" });
    expect(phone().people[0].facts).toHaveLength(1);
  });

  it("can be added, edited, moved and removed", () => {
    const id = dm({ type: "npc.factAdd", npcId: "npc-bolla", text: "  Owes Mags  money. " }).factId!;
    expect(npc("npc-bolla").facts.at(-1)).toEqual({ id, text: "Owes Mags money." });
    dm({ type: "npc.factMove", npcId: "npc-bolla", factId: id, dir: -1 });
    expect(npc("npc-bolla").facts[0].id).toBe(id);
    dm({ type: "npc.factUpdate", npcId: "npc-bolla", factId: id, text: "Owes Mags 3 gp." });
    expect(npc("npc-bolla").facts[0].text).toBe("Owes Mags 3 gp.");
    dm({ type: "npc.factRemove", npcId: "npc-bolla", factId: id });
    expect(npc("npc-bolla").facts.some((f) => f.id === id)).toBe(false);
  });
});

describe("entries", () => {
  it("are added from a portrait, with its caption as the default name", () => {
    g.scenes.push({ id: "s-x", label: "Guard", kind: "portrait", hotkey: null, reveal: false, title: "Gate guard" });
    const id = dm({ type: "npc.add", npc: { sceneId: "s-x" }, facts: ["Takes bribes"] }).npcId!;
    expect(npc(id)).toMatchObject({ name: "Guard", title: "Gate guard", sceneId: "s-x", facts: [{ text: "Takes bribes" }] });
    expect(fails(DM, { type: "npc.add", npc: { name: "x", sceneId: "s-board" } })).toMatch(/portrait/);
    expect(fails(DM, { type: "npc.add", npc: {} })).toMatch(/name/);
  });

  it("show their mood to players when set", () => {
    dm({ type: "npc.update", npcId: "npc-artum", patch: { mood: "wary", blurb: "Grumpy." } });
    dm({ type: "scene.show", sceneId: "s-artum" });
    expect(phone().people[0]).toMatchObject({ mood: "wary", blurb: "Grumpy." });
    dm({ type: "npc.update", npcId: "npc-artum", patch: { mood: null } });
    expect(phone().people[0].mood).toBeUndefined();
  });

  it("file Chronicle notes by name, so players' notes about them come along", () => {
    dm({ type: "scene.show", sceneId: "s-mags" });
    expect(phone().chronicle.tags).toContain("Mags Wick");
    expect(phone().chronicle.tags).not.toContain("Bolla");
    expect(phone().people[0].tags).toEqual(["Mags Wick"]);
  });

  it("go back to strangers on a fresh start, keeping what the DM wrote", () => {
    dm({ type: "scene.show", sceneId: "s-mags" });
    dm({ type: "npc.factReveal", npcId: "npc-mags", factId: "npc-mags-f1", revealed: true, tv: true });
    g = freshStart(g);
    expect(npc("npc-mags").met).toBeUndefined();
    expect(npc("npc-mags").facts[0].revealedAt).toBeUndefined();
    expect(npc("npc-mags").facts).toHaveLength(3);
    expect(g.npcMoment).toBeUndefined();
  });

  it("are all there for the DM", () => {
    expect(projectDm(g, 1, []).state.npcs!.length).toBe(SEED_NPCS.length);
  });
});
