// The off-script kit: party location, portable clues, quick notes and ambient
// scenes. Everything here is DM-only until the DM shows or reveals it.
import { beforeEach, describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { readFileSync } from "node:fs";
import type { Command } from "@/shared/commands";
import { dmCommand } from "@/shared/commands";
import { projectPlayer, projectTv } from "@/shared/projection";
import { apply, CommandError, LOOSE_ENDS, type Ctx } from "@/shared/reducer";
import { freshStart, seedGame } from "@/shared/seed";
import { prepOf } from "@/shared/episodeBuilder";
import { AMBIENT } from "@/shared/ambient";
import { hereOf, hereView, needsReview, readyClues } from "@/shared/offscript";
import { fightFrom, generate, RUMORS } from "@/shared/generators";
import { blankGame } from "@/shared/presets";
import { liveRef, listAssets } from "@/shared/assets";
import { AmbientScene } from "@/client/scenes/Ambient";
import type { Actor, GameState } from "@/shared/types";
import { hydrate } from "@/server/store";

const DM: Actor = { role: "dm" };

let g: GameState;
let now = 1000;
function dm(cmd: Command) {
  const r = apply(g, dmCommand.parse(cmd) as Command, { now: ++now, actor: DM } as Ctx);
  g = r.state;
  return r;
}
function fails(cmd: Command): string {
  try {
    dm(cmd);
  } catch (e) {
    if (e instanceof CommandError) return e.message;
    throw e;
  }
  throw new Error("expected the command to fail");
}
/** Every payload that leaves the server for someone other than the DM. */
const outside = () => [JSON.stringify(projectTv(g, 1)), ...g.players.map((p) => JSON.stringify(projectPlayer(g, 1, p.id, [])))].join("\n");
const entry = (id: string) => g.entries!.find((e) => e.id === id)!;

beforeEach(() => {
  now = 1000;
  g = hydrate(seedGame("t"))!;
  dm({ type: "run.start", episodeId: "ep1" });
});

describe("where the party is", () => {
  it("is set by hand, by showing a place, or by showing its pin, and logs a hidden Chronicle line", () => {
    dm({ type: "here.set", placeId: "e-docks" });
    expect(hereOf(g)?.id).toBe("e-docks");
    const log = g.notes!.at(-1)!;
    expect(log.text).toBe("The party went to Candlefair Docks.");
    expect(log.hidden).toBe(true);
    expect(outside()).not.toContain("The party went to");

    dm({ type: "show", ref: "place/flickering-candle" });
    expect(hereOf(g)?.id).toBe("e-candle");

    // A people entry or a prop doesn't move anyone.
    dm({ type: "show", ref: "person/mags" });
    expect(hereOf(g)?.id).toBe("e-candle");

    // Same place again: no second line.
    const lines = g.notes!.length;
    dm({ type: "here.set", placeId: "e-candle" });
    expect(g.notes!.length).toBe(lines);
    expect(fails({ type: "here.set", placeId: "e-mags" })).toMatch(/Pick a place/);
  });

  it("follows a map pin tied to a place", () => {
    const docks = entry("e-docks");
    expect(docks.pin).toBeTruthy();
    const map = g.scenes.find((x) => x.id === docks.pin!.sceneId)!;
    const pin = map.map!.pins.find((p) => p.id === docks.pin!.pinId)!;
    dm({ type: "show", ref: `map/${map.slug}/${pin.number}` });
    expect(hereOf(g)?.id).toBe("e-docks");
  });

  it("is per party in a shared world", () => {
    dm({ type: "session.end" });
    dm({ type: "party.add", name: "The Sons", firstName: "The Friends" });
    const [A, B] = g.parties!.map((p) => p.id);
    dm({ type: "party.play", partyId: A });
    dm({ type: "here.set", placeId: "e-docks" });
    dm({ type: "party.play", partyId: B });
    expect(hereOf(g)).toBeUndefined();
    dm({ type: "here.set", placeId: "e-candle" });
    dm({ type: "party.play", partyId: A });
    expect(hereOf(g)?.id).toBe("e-docks");
  });

  it("the Here section shows only what's tied to the place", () => {
    dm({ type: "here.set", placeId: "e-docks" });
    // Tied: Orsa and Fennick list "The Docks" as an area. Not tied: Mags (Candlefair).
    let v = hereView(g)!;
    expect(v.people.map((e) => e.id).sort()).toEqual(["e-fennick", "e-orsa"]);
    expect(v.people.some((e) => e.id === "e-mags")).toBe(false);
    // A lead pointing here, and one pointing elsewhere.
    dm({ type: "lead.add", text: "Ask about the night cart", shown: true, placeId: "e-docks" });
    dm({ type: "lead.add", text: "Check the inn's cellar", shown: true, placeId: "e-candle" });
    // Clues tagged for the place or its people, and one that isn't.
    dm({ type: "clue.add", clue: { text: "The cart had no lantern", episodeId: "ep1", tags: ["e-orsa"] } });
    dm({ type: "clue.add", clue: { text: "Mags is behind on rent", episodeId: "ep1", tags: ["e-mags"] } });
    // A story beat marked anywhere, and one tied to the inn.
    const th = g.story!.threads[0].id;
    dm({ type: "story.beatAdd", beat: { threadId: th, title: "A stranger asks for directions", anywhere: true } });
    dm({ type: "story.beatAdd", beat: { threadId: th, title: "The inn's cellar floods", links: [{ kind: "entry", id: "e-candle" }] } });
    v = hereView(g)!;
    expect(v.leads.map((l) => l.text)).toEqual(["Ask about the night cart"]);
    expect(v.clues.map((c) => c.text)).toEqual(["The cart had no lantern"]);
    expect(v.beats.map((b) => b.title)).toContain("A stranger asks for directions");
    expect(v.beats.map((b) => b.title)).not.toContain("The inn's cellar floods");
  });
});

describe("portable clues", () => {
  const mags = () => entry("e-mags");
  it("delivering reveals its fact once, logs where and through whom, and plays its story beat", () => {
    const fact = mags().facts.find((f) => f.revealedAt === undefined)!;
    const th = g.story!.threads[0].id;
    const sb = dm({ type: "story.beatAdd", beat: { threadId: th, title: "Mags's secret slips out" } }).storyId!;
    const id = dm({ type: "clue.add", clue: { text: "Mags owes the baker", episodeId: "ep1", fact: { entryId: "e-mags", factId: fact.id }, storyBeatId: sb, tags: ["e-mags"] } }).clueId!;
    expect(outside()).not.toContain("Mags owes the baker");
    expect(outside()).not.toContain(fact.text);

    dm({ type: "here.set", placeId: "e-candle" });
    dm({ type: "clue.deliver", clueId: id, viaId: "e-orsa", tv: true });
    const c = g.clues!.find((x) => x.id === id)!;
    expect(c.status).toBe("delivered");
    expect(c.delivered).toMatchObject({ placeId: "e-candle", viaId: "e-orsa", sessionId: g.currentSessionId });
    expect(mags().facts.find((f) => f.id === fact.id)!.revealedAt).toBeDefined();
    expect(g.discovery?.factId).toBe(fact.id);
    expect(g.story!.beats.find((b) => b.id === sb)!.status).toBe("played");
    const log = g.notes!.at(-1)!;
    expect(log.text).toBe("Clue delivered at The Flickering Candle, through Captain Orsa Dell: Mags owes the baker");
    expect(log.hidden).toBe(true);
    // The fact is the players' now; the clue's own words and the log are not.
    expect(outside()).toContain(fact.text);
    expect(outside()).not.toContain("Mags owes the baker");

    // Delivered once: a second delivery is refused, and its TV moment doesn't replay.
    const n = g.discovery!.n;
    expect(fails({ type: "clue.deliver", clueId: id, tv: true })).toMatch(/already delivered/);
    expect(g.discovery!.n).toBe(n);
  });

  it("a fact the table already knows doesn't play again; quiet delivery doesn't touch the TV", () => {
    const fact = mags().facts[0];
    dm({ type: "entry.factReveal", entryId: "e-mags", factId: fact.id, revealed: true });
    const a = dm({ type: "clue.add", clue: { text: "Again", fact: { entryId: "e-mags", factId: fact.id } } }).clueId!;
    const before = g.discovery?.n;
    dm({ type: "clue.deliver", clueId: a, tv: true });
    expect(g.discovery?.n).toBe(before);
    const other = mags().facts.find((f) => f.revealedAt === undefined)!;
    const b = dm({ type: "clue.add", clue: { text: "Quiet", fact: { entryId: "e-mags", factId: other.id } } }).clueId!;
    dm({ type: "clue.deliver", clueId: b, tv: false });
    expect(mags().facts.find((f) => f.id === other.id)!.revealedAt).toBeDefined();
    expect(g.discovery?.n).toBe(before);
  });

  it("a clue about a mystery moves it one stage forward", () => {
    expect(entry("e-broken-ring").stage).toBe("hidden");
    const id = dm({ type: "clue.add", clue: { text: "A ring, snapped clean", entryId: "e-broken-ring" } }).clueId!;
    dm({ type: "clue.deliver", clueId: id, tv: false });
    expect(entry("e-broken-ring").stage).toBe("rumored");
  });

  it("episode clues come first, then the pool; wrap-up keeps, pools or drops them; prep asks for 5", () => {
    const ep = g.episodes![0];
    expect(prepOf(g, ep).some((p) => p.key === "clues")).toBe(true);
    const ids = ["One", "Two", "Three", "Four", "Five"].map((t) => dm({ type: "clue.add", clue: { text: t, episodeId: "ep1" } }).clueId!);
    const pool = dm({ type: "clue.add", clue: { text: "From the pool" } }).clueId!;
    expect(prepOf(g, ep).some((p) => p.key === "clues")).toBe(false);
    expect(readyClues(g, "ep1").map((c) => c.id)).toEqual([...ids, pool]);
    dm({ type: "clue.settle", clueId: ids[0], to: "pool" });
    dm({ type: "clue.settle", clueId: ids[1], to: "drop" });
    dm({ type: "clue.settle", clueId: ids[2], to: "keep" });
    const by = (id: string) => g.clues!.find((c) => c.id === id)!;
    expect(by(ids[0])).toMatchObject({ episodeId: null, status: "ready" });
    expect(by(ids[1]).status).toBe("dropped");
    expect(by(ids[2])).toMatchObject({ episodeId: "ep1", status: "ready" });
    // Undo a delivery: ready again, and the beat's play comes off.
    dm({ type: "clue.deliver", clueId: ids[3], tv: false });
    dm({ type: "clue.settle", clueId: ids[3], to: "ready" });
    expect(by(ids[3]).status).toBe("ready");
    expect(by(ids[3]).delivered).toBeUndefined();
  });

  it("deleting an entry or episode leaves no dangling links, and Start fresh makes every clue ready", () => {
    const id = dm({ type: "clue.add", clue: { text: "About Bolla", episodeId: "ep1", tags: ["e-bolla", "e-docks"], entryId: "e-bolla" } }).clueId!;
    dm({ type: "entry.remove", entryId: "e-bolla" });
    const c = g.clues!.find((x) => x.id === id)!;
    expect(c.tags).toEqual(["e-docks"]);
    expect(c.entryId).toBeUndefined();
    dm({ type: "clue.deliver", clueId: id, tv: false });
    const fresh = freshStart(g);
    expect(fresh.clues!.find((x) => x.id === id)!.status).toBe("ready");
    expect(fresh.captures).toBeUndefined();
    expect(fresh.here).toBeUndefined();
  });
});

describe("quick notes", () => {
  it("never reach players; turning one into a person makes a Hidden draft tied to the place", () => {
    dm({ type: "here.set", placeId: "e-docks" });
    const id = dm({ type: "capture.add", text: "Met Old Tam the ferryman, wants his oar back" }).captureId!;
    expect(outside()).not.toContain("Old Tam");
    const cap = g.captures!.find((c) => c.id === id)!;
    expect(cap).toMatchObject({ placeId: "e-docks", sessionId: g.currentSessionId, status: "open" });

    dm({ type: "capture.make", captureId: id, as: "person", title: "Old Tam", body: cap.text });
    const tam = g.entries!.find((e) => e.name === "Old Tam")!;
    expect(tam.stage).toBe("hidden");
    expect(tam.origin).toBe("capture");
    expect(tam.review).toMatchObject({ sessionId: g.currentSessionId, placeId: "e-docks" });
    expect(tam.links).toContain("e-docks");
    expect(g.captures!.find((c) => c.id === id)).toMatchObject({ status: "made", made: "person/old-tam" });
    expect(outside()).not.toContain("Old Tam");
    expect(fails({ type: "capture.make", captureId: id, as: "place", title: "Again" })).toMatch(/already/);
  });

  it("turns into a fact, an unposted flyer, or a story beat on Loose ends", () => {
    const a = dm({ type: "capture.add", text: "Fennick is scared of horses" }).captureId!;
    const b = dm({ type: "capture.add", text: "Someone wants the mill rats gone" }).captureId!;
    const c = dm({ type: "capture.add", text: "The ferryman's oar turns up later" }).captureId!;
    dm({ type: "capture.make", captureId: a, as: "fact", title: "Scared of horses", entryId: "e-fennick" });
    expect(entry("e-fennick").facts.some((f) => f.text === "Scared of horses" && f.revealedAt === undefined)).toBe(true);
    dm({ type: "capture.make", captureId: b, as: "job", title: "Rats in the mill", body: "Someone wants the mill rats gone" });
    const job = g.jobs!.find((j) => j.title === "Rats in the mill")!;
    expect(job.pinned).toBe(false);
    dm({ type: "capture.make", captureId: c, as: "beat", title: "The oar turns up" });
    const th = g.story!.threads.find((t) => t.name === LOOSE_ENDS)!;
    expect(g.story!.beats.find((x) => x.title === "The oar turns up")!.threadId).toBe(th.id);
    expect(outside()).not.toContain("Scared of horses");
    expect(outside()).not.toContain("Rats in the mill");
    expect(fails({ type: "capture.make", captureId: dm({ type: "capture.add", text: "x" }).captureId!, as: "fact", title: "x" })).toMatch(/whose/);
  });
});

describe("ambient scenes", () => {
  it("show on the TV with a caption, only while they're up, and any other show takes them down", () => {
    dm({ type: "ambient.show", id: "rainy-night", caption: "Rain on the river road." });
    const tv = projectTv(g, 1);
    expect(tv.live.ambient).toEqual({ id: "rainy-night", caption: "Rain on the river road." });
    expect(liveRef(g)).toBe("ambient/rainy-night");
    expect(g.recent![0]).toBe("ambient/rainy-night");
    dm({ type: "show", ref: "board" });
    expect(projectTv(g, 1).live.ambient).toBeUndefined();
    // Through a plain show ref, with the place's caption when it's that place's scene.
    dm({ type: "here.set", placeId: "e-docks" });
    dm({ type: "place.setup", entryId: "e-docks", scene: "ambient/river-dusk", caption: "The docks at dusk." });
    dm({ type: "show", ref: "ambient/river-dusk" });
    expect(projectTv(g, 1).live.ambient).toEqual({ id: "river-dusk", caption: "The docks at dusk." });
    // A place's setup is DM-only.
    dm({ type: "show", ref: "board" });
    expect(outside()).not.toContain("The docks at dusk.");
    expect(listAssets(g).filter((a) => a.group === "Ambient")).toHaveLength(AMBIENT.length);
  });

  it("each scene is small, loads nothing from outside, and holds still with reduce-motion on", () => {
    for (const a of AMBIENT) {
      const html = renderToStaticMarkup(createElement(AmbientScene, { id: a.id, caption: "A caption" }));
      expect(html.length, a.id).toBeLessThan(12_000);
      expect(html, a.id).not.toMatch(/https?:|<image|<img|url\((?!#)/);
      // At most 40 moving parts (elements with an animation class).
      const moving = html.match(/class="[^"]*\bamb-[a-z-]+/g) ?? [];
      expect(moving.length, a.id).toBeLessThanOrEqual(40);
    }
    const css = readFileSync("src/client/globals.css", "utf8");
    const block = css.slice(css.indexOf("ambient scenes (src/client/scenes/Ambient.tsx)"));
    expect(block).toMatch(/@media \(prefers-reduced-motion: reduce\)\s*\{\s*\.ambient \*,\s*\.ambient-caption\s*\{\s*animation: none !important;/);
    // Only transform and opacity are animated.
    const frames = [...block.matchAll(/@keyframes [a-z-]+ \{([\s\S]*?)\n\}/g)].map((m) => m[1]);
    for (const f of frames) for (const prop of f.matchAll(/([a-z-]+):/g)) expect(["transform", "opacity"]).toContain(prop[1]);
  });
});

describe("the generators", () => {
  // A fixed sequence, so rolls are repeatable.
  const seq = (...xs: number[]) => {
    let i = 0;
    return () => xs[i++ % xs.length];
  };

  it("rolls from the campaign's tables for the place, else the built-in lists, all offline", () => {
    const docks = entry("e-docks");
    // Candlefair campaigns get the two starter tables, flagged for review.
    const starters = g.tables!.filter((t) => t.origin === "seed");
    expect(starters.map((t) => t.name).sort()).toEqual(["Candlefair rumors", "Candlefair street encounters"]);
    expect(starters.every((t) => t.review && t.rows.length === 20 && t.die === 20)).toBe(true);
    const rumor = generate("rumor", g, docks, seq(0));
    expect(rumor.rolled).toBe("d20 Candlefair rumors: 1");
    expect(rumor.title).toBe(g.tables!.find((t) => t.name === "Candlefair rumors")!.rows[0].text);

    // A place's own table wins.
    dm({ type: "table.add", table: { name: "Dock rumors", die: 4, kind: "rumor", rows: [{ text: "Eels are restless." }], areas: [], dmNote: "" } });
    const own = g.tables!.find((t) => t.name === "Dock rumors")!;
    dm({ type: "place.setup", entryId: "e-docks", encounters: null, rumors: own.id });
    expect(generate("rumor", g, entry("e-docks"), seq(0.9)).title).toBe("Eels are restless.");
    // Removing the table sends the place back to the default.
    dm({ type: "table.remove", tableId: own.id });
    expect(entry("e-docks").place?.rumors).toBeUndefined();

    // No tables at all: the built-in list.
    for (const t of [...g.tables!]) dm({ type: "table.remove", tableId: t.id });
    const r = generate("rumor", g, docks, seq(0));
    expect(r.rolled).toBeUndefined();
    expect(RUMORS).toContain(r.title);
    expect(generate("complication", g, docks).title.length).toBeGreaterThan(5);
    const n = generate("npc", g, undefined, seq(0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8));
    expect(n.title).toMatch(/^\S+ \S+$/);
    expect(n.look && n.quirk && n.wants && n.knows && n.voice).toBeTruthy();
    const shop = generate("shop", g, undefined);
    expect(shop.title).toMatch(/^The /);
    expect(shop.owner?.subtitle).toBeTruthy();
  });

  it("turns 'fight:' rows and monster rolls into a fight with real templates", () => {
    const pud = g.monsters!.find((m) => m.name === "Pudding Gremlin")!;
    const f = fightFrom(g, "A pudding twitches. fight: Pudding Gremlin x2, Owlbear");
    expect(f.text).toBe("A pudding twitches.");
    expect(f.fight).toEqual({ groups: [{ templateId: pud.id, count: 2 }], names: ["Pudding Gremlin x2"], missing: ["Owlbear"] });
    const m = generate("monster", g, undefined, seq(0), 4);
    expect(m.fight?.groups[0].count).toBeGreaterThan(0);
    dm({ type: "fight.start", groups: m.fight!.groups, where: "Candlefair Docks" });
    expect(g.fight).toBeTruthy();
  });

  it("saves a result as a hidden draft for review, tied to where the party is", () => {
    dm({ type: "here.set", placeId: "e-docks" });
    const r = dm({ type: "improv.save", as: "person", draft: { name: "Tamsin Reedwhistle", title: "net mender", look: "flour to the elbows", quirk: "counts things", wants: "to see the sea", voice: "slow" }, met: false, tv: false });
    const e = entry(r.entryId!);
    expect(e).toMatchObject({ stage: "hidden", origin: "improvised", look: "flour to the elbows", quirk: "counts things", wants: "to see the sea", voice: "slow" });
    expect(e.review).toEqual({ at: now, sessionId: g.currentSessionId, placeId: "e-docks" });
    expect(e.links).toContain("e-docks");
    expect(hereView(g)!.people.map((p) => p.id)).toContain(e.id);
    expect(needsReview(g).entries[0].id).toBe(e.id);
    // DM-only notes never leave.
    expect(outside()).not.toContain("Tamsin");
    expect(outside()).not.toContain("flour to the elbows");

    dm({ type: "review.done", entryId: e.id });
    expect(entry(e.id).review).toBeUndefined();
    expect(entry(e.id).origin).toBe("improvised");
  });

  it("Met now makes it Found, with a name card only when asked; a shop gets its storefront and owner", () => {
    const quiet = dm({ type: "improv.save", as: "person", draft: { name: "Odo Marsh" }, met: true, tv: false });
    expect(entry(quiet.entryId!).stage).toBe("found");
    expect(JSON.stringify(projectTv(g, 1).live)).not.toContain("Odo Marsh");

    const shown = dm({ type: "improv.save", as: "shop", draft: { name: "The Sleepy Heron", title: "tavern", summary: "a parrot takes the orders", owner: { name: "Wenna Crane", title: "innkeeper", quirk: "hums" } }, met: true, tv: true });
    const shop = entry(shown.entryId!);
    expect(shop.stage).toBe("found");
    expect(shop.shopId && g.shops.find((x) => x.id === shop.shopId)).toBeTruthy();
    const owner = g.entries!.find((e) => e.name === "Wenna Crane")!;
    expect(owner).toMatchObject({ kind: "person", origin: "improvised", stage: "found", quirk: "hums" });
    expect(owner.links).toContain(shop.id);
    expect(JSON.stringify(projectTv(g, 1))).toContain("The Sleepy Heron");
    expect(JSON.stringify(projectTv(g, 1))).not.toContain("hums");
  });

  it("a blank campaign gets no starter tables, and seeded tables can be reviewed", () => {
    const blank = hydrate(blankGame("b", "Saltmarsh Nights"))!;
    expect(blank.tables ?? []).toEqual([]);
    const t = g.tables!.find((x) => x.origin === "seed")!;
    dm({ type: "review.done", tableId: t.id });
    expect(g.tables!.find((x) => x.id === t.id)!.review).toBeUndefined();
    expect(outside()).not.toContain(t.rows[0].text);
  });
});
