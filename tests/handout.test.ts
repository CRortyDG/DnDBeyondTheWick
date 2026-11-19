// Text handouts: light formatting, kept off the TV until shown, flagged when empty.
import { describe, expect, it } from "vitest";
import { blocks, emptyHandout, spans } from "@/shared/handout";
import { gatedArtIsLive, projectPlayer, projectTv } from "@/shared/projection";
import { withAssets } from "@/shared/migrate";
import { apply, type Ctx } from "@/shared/reducer";
import { readiness } from "@/shared/readiness";
import { seedGame } from "@/shared/seed";
import { hydrate } from "@/server/store";
import type { Command } from "@/shared/commands";
import type { GameState } from "@/shared/types";

const DM: Ctx = { now: 1000, actor: { role: "dm" } };
const run = (g: GameState, cmd: Command) => apply(g, cmd, { ...DM, rand: () => 0.5 }).state;
const sheet = { title: "A letter", body: "Come at **midnight**.\n\nTell *no one*.\n-- A friend", sign: "", paper: "parchment" as const, font: "hand" as const };

function withHandout(): { g: GameState; id: string } {
  let g = hydrate(seedGame("t"))!;
  g = run(g, { type: "scene.add", kind: "handout", label: "The letter" });
  const id = g.scenes.at(-1)!.id;
  return { g, id };
}

describe("handout formatting", () => {
  it("reads bold, italic, paragraphs and signature lines", () => {
    expect(spans("a **b** *c* d")).toEqual([{ text: "a " }, { text: "b", b: true }, { text: " " }, { text: "c", i: true }, { text: " d" }]);
    expect(spans("2 * 3 * 4")).toEqual([{ text: "2 * 3 * 4" }]);
    expect(spans("**unclosed")).toEqual([{ text: "**unclosed" }]);
    const b = blocks(sheet.body);
    expect(b.map((x) => x.kind)).toEqual(["p", "p", "sign"]);
    expect(b[2]).toEqual({ kind: "sign", spans: [{ text: "A friend" }] });
    expect(blocks("one\ntwo")).toEqual([{ kind: "p", lines: [[{ text: "one" }], [{ text: "two" }]] }]);
  });
  it("never produces markup, just text", () => {
    expect(JSON.stringify(blocks("<script>alert(1)</script>"))).toContain("<script>");
    expect(blocks("<b>x</b>")[0]).toEqual({ kind: "p", lines: [[{ text: "<b>x</b>" }]] });
  });
});

describe("handout words", () => {
  it("are saved, and only reach the TV while the handout is live", () => {
    let { g, id } = withHandout();
    g = run(g, { type: "scene.update", sceneId: id, patch: { sheet } });
    expect(g.scenes.find((x) => x.id === id)!.sheet!.title).toBe("A letter");
    expect(JSON.stringify(projectTv(g, 1))).not.toContain("midnight");
    g = run(g, { type: "scene.show", sceneId: id });
    const tv = projectTv(g, 1);
    expect(tv.scenes.find((x) => x.id === id)!.sheet!.body).toContain("midnight");
    g = run(g, { type: "scene.show", sceneId: g.scenes[0].id });
    expect(JSON.stringify(projectTv(g, 1))).not.toContain("midnight");
  });

  it("an empty handout is flagged in the pre-session check, and words clear it", () => {
    let { g, id } = withHandout();
    expect(emptyHandout(g.scenes.find((x) => x.id === id)!)).toBe(true);
    expect(readiness(g).some((r) => r.text.startsWith("The letter has no words or picture"))).toBe(true);
    g = run(g, { type: "scene.update", sceneId: id, patch: { sheet } });
    expect(readiness(g).some((r) => r.text.startsWith("The letter"))).toBe(false);
    g = run(g, { type: "scene.update", sceneId: id, patch: { sheet: null } });
    expect(g.scenes.find((x) => x.id === id)!.sheet).toBeUndefined();
  });
});

describe("handouts in Discover", () => {
  const phone = (g: GameState) => projectPlayer(g, 1, "p1", []);

  it("reach phones once shown on the TV, words and all, and stay after it leaves", () => {
    let { g, id } = withHandout();
    g = run(g, { type: "scene.update", sceneId: id, patch: { sheet, reveal: true } });
    expect(phone(g).handouts.some((h) => h.sceneId === id)).toBe(false);
    expect(JSON.stringify(phone(g))).not.toContain("midnight");
    g = run(g, { type: "scene.show", sceneId: id });
    g = run(g, { type: "scene.show", sceneId: g.scenes[0].id });
    const h = phone(g).handouts.find((x) => x.sceneId === id)!;
    expect(h.label).toBe("A letter");
    expect(h.sheet!.body).toContain("midnight");
    expect(h.shownAt).toBe(1000);
    // The TV still only gets the words while it's live.
    expect(JSON.stringify(projectTv(g, 1))).not.toContain("midnight");
  });

  it("the DM can take one off phones, or hand one out without showing it", () => {
    let { g, id } = withHandout();
    g = run(g, { type: "scene.update", sceneId: id, patch: { sheet } });
    g = run(g, { type: "scene.known", sceneId: id, known: true });
    expect(phone(g).handouts.map((h) => h.sceneId)).toContain(id);
    g = run(g, { type: "scene.known", sceneId: id, known: false });
    expect(phone(g).handouts.map((h) => h.sceneId)).not.toContain(id);
    expect(JSON.stringify(phone(g))).not.toContain("midnight");
  });

  it("an empty handout isn't listed, and built-in art stays reachable once known", () => {
    let { g, id } = withHandout();
    g = run(g, { type: "scene.known", sceneId: id, known: true });
    expect(phone(g).handouts.map((h) => h.sceneId)).not.toContain(id);
    expect(gatedArtIsLive(g, "merchant-sigil")).toBe(false);
    g = run(g, { type: "scene.show", sceneId: "s-symbol" });
    g = run(g, { type: "scene.show", sceneId: g.scenes[0].id });
    expect(gatedArtIsLive(g, "merchant-sigil")).toBe(true);
    expect(phone(g).handouts.find((h) => h.sceneId === "s-symbol")!.art.url).toContain("/api/art/merchant-sigil");
  });

  it("handouts shown before this change become known once", () => {
    let { g, id } = withHandout();
    g = run(g, { type: "scene.update", sceneId: id, patch: { sheet } });
    const sc = g.scenes.find((x) => x.id === id)!;
    sc.shownAt = 5;
    g.upgrades = (g.upgrades ?? []).filter((t) => t !== "handouts-known");
    g = withAssets(g)!;
    expect(g.scenes.find((x) => x.id === id)!.known).toBe(true);
    // Once only: the DM can untick it afterwards.
    g = run(g, { type: "scene.known", sceneId: id, known: false });
    g = withAssets(g)!;
    expect(g.scenes.find((x) => x.id === id)!.known).toBeUndefined();
  });

  it("Artum's notice is a job flyer, so it never lands in Discover", () => {
    let g = hydrate(seedGame("t"))!;
    expect(g.scenes.some((x) => x.id === "s-notice")).toBe(true);
    g = run(g, { type: "scene.show", sceneId: "s-notice" });
    g = run(g, { type: "scene.show", sceneId: g.scenes[0].id });
    expect(g.scenes.find((x) => x.id === "s-notice")!.known).toBeUndefined();
    expect(phone(g).handouts.map((h) => h.sceneId)).not.toContain("s-notice");
    // Campaigns where the older rule already kept it get it taken back off phones.
    const sc = g.scenes.find((x) => x.id === "s-notice")!;
    sc.known = true;
    g.upgrades = (g.upgrades ?? []).filter((t) => t !== "flyer-handouts");
    expect(phone(g).handouts.map((h) => h.sceneId)).not.toContain("s-notice");
    g = withAssets(g)!;
    expect(g.scenes.find((x) => x.id === "s-notice")!.known).toBeUndefined();
  });
});
