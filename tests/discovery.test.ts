// Discovery: entries go hidden -> rumored -> found -> known, and nothing a player
// hasn't unlocked ever reaches their payload.
import { beforeEach, describe, expect, it } from "vitest";
import type { Command } from "@/shared/commands";
import { findRef, publicEntries } from "@/shared/discovery";
import { gatedArtIsLive, projectDm, projectPlayer, projectTv } from "@/shared/projection";
import { apply, CommandError, type Ctx } from "@/shared/reducer";
import { freshStart, seedGame } from "@/shared/seed";
import type { Actor, GameState } from "@/shared/types";
import { hydrate } from "@/server/store";
import { episodeMarkdown, parseEpisode } from "@/shared/runsheet";
import { SEED_ENTRIES } from "@/server/seed-entries";

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
const ent = (id: string) => g.entries!.find((n) => n.id === id)!;
const phone = () => projectPlayer(g, 1, "p1", []);
const pub = (id: string) => phone().entries.find((e) => e.id === id);
const tvJson = () => JSON.stringify(projectTv(g, 1));
const phoneJson = () => JSON.stringify(phone());

beforeEach(() => {
  g = hydrate(seedGame("t"))!;
});

describe("the starter entries", () => {
  it("come from the server at their seed stages", () => {
    expect(g.entries!.map((n) => n.id)).toEqual(SEED_ENTRIES.map((n) => n.id));
    expect(ent("e-mags").stage).toBe("found");
    expect(ent("e-orsa").stage).toBe("found");
    expect(ent("e-artum").stage).toBe("rumored");
    expect(ent("e-merchant").stage).toBe("hidden");
    expect(g.entries!.every((e) => e.facts.every((f) => f.revealedAt === undefined))).toBe(true);
    // Met at the start means the portrait counts as known.
    expect(g.scenes.find((x) => x.id === "s-mags")!.known).toBe(true);
  });

  it("are added once, so a deleted entry stays deleted", () => {
    dm({ type: "entry.remove", entryId: "e-bolla" });
    g = hydrate(g)!;
    expect(g.entries!.some((n) => n.id === "e-bolla")).toBe(false);
  });

  it("count portraits the table had already seen as found, quietly", () => {
    const old = seedGame("old");
    old.scenes.find((x) => x.id === "s-chef")!.known = true;
    const h = hydrate(old)!;
    expect(h.entries!.find((n) => n.id === "e-chef")!.stage).toBe("found");
    expect(h.discovery).toBeUndefined();
  });

  it("keep hidden entries, locked facts and DM notes out of the browser seed", () => {
    const seed = JSON.stringify(seedGame("x"));
    expect(seed).not.toContain("won’t burn");
    expect(seed).not.toContain("villain");
  });
});

describe("what players get", () => {
  it("never a hidden entry, not even a count", () => {
    const ids = phone().entries.map((e) => e.id);
    expect(ids).toContain("e-mags");
    expect(ids).toContain("e-artum");
    expect(ids).not.toContain("e-merchant");
    expect(ids).not.toContain("e-chef");
    expect(phoneJson()).not.toContain("The merchant");
    expect(phoneJson()).not.toContain("villain");
    expect(tvJson()).not.toContain("villain");
  });

  it("a rumor as its nickname or ???, the hint and a silhouette only", () => {
    const a = pub("e-artum")!;
    expect(a).toMatchObject({ stage: "rumored", name: "???", hint: "Whoever nailed up the Help Wanted poster." });
    expect(a.art).toBeUndefined();
    expect(a.title).toBeUndefined();
    expect(a.facts).toEqual([]);
    // The real name, picture and title appear nowhere.
    expect(phoneJson()).not.toContain("Artum");
    expect(phoneJson()).not.toContain("Planner of Winterfest");
    expect(phoneJson()).not.toContain("/api/art/artum");
    dm({ type: "entry.update", entryId: "e-artum", patch: { nickname: "The man with the poster" } });
    expect(pub("e-artum")!.name).toBe("The man with the poster");
    expect(phoneJson()).not.toContain("Artum");
  });

  it("no real picture on the TV before it's found", () => {
    expect(tvJson()).not.toContain("/api/art/artum");
    expect(projectTv(g, 1).scenes.some((x) => x.id === "s-artum")).toBe(false);
    expect(gatedArtIsLive(g, "artum")).toBe(false);
    expect(gatedArtIsLive(g, "mags-wick")).toBe(true);
    dm({ type: "scene.show", sceneId: "s-artum" });
    expect(gatedArtIsLive(g, "artum")).toBe(true);
    expect(pub("e-artum")!.art).toEqual({ url: "/api/art/artum?game=t" });
  });

  it("DM notes and secrets never", () => {
    dm({ type: "entry.update", entryId: "e-mags", patch: { secrets: "She was a smuggler" } });
    expect(phoneJson()).not.toContain("smuggler");
    expect(phoneJson()).not.toContain("Twenty-five gold");
    expect(tvJson()).not.toContain("smuggler");
    expect(JSON.stringify(projectDm(g, 1, []))).toContain("smuggler");
  });

  it("links only when both ends are visible", () => {
    dm({ type: "entry.update", entryId: "e-mags", patch: { links: ["e-merchant", "e-artum", "e-orsa"] } });
    expect(pub("e-mags")!.ties.map((l) => l.id)).toEqual(["e-artum", "e-orsa"]);
    // A rumored end shows under its rumor name.
    expect(pub("e-mags")!.ties.find((l) => l.id === "e-artum")!.name).toBe("???");
    // A rumor shows no links of its own.
    dm({ type: "entry.update", entryId: "e-artum", patch: { links: ["e-mags"] } });
    expect(pub("e-artum")!.ties).toEqual([]);
    expect(phoneJson()).not.toContain("e-merchant");
  });
});

describe("stages", () => {
  it("move a rumor to found and play the reveal", () => {
    dm({ type: "entry.stage", entryId: "e-artum", stage: "found", announce: true });
    expect(pub("e-artum")).toMatchObject({ stage: "found", name: "Artum", title: "Planner of Winterfest" });
    expect(projectTv(g, 1).discovery).toMatchObject({ name: "Artum", reveal: true, stage: "found" });
    expect(g.notes!.at(-1)!.text).toBe("The party met Artum, planner of Winterfest.");
  });

  it("are idempotent", () => {
    dm({ type: "entry.stage", entryId: "e-artum", stage: "found", announce: true });
    const n = g.discovery!.n;
    const notes = g.notes!.length;
    dm({ type: "entry.stage", entryId: "e-artum", stage: "found", announce: true });
    dm({ type: "scene.show", sceneId: "s-artum" });
    expect(g.discovery!.n).toBe(n);
    expect(g.notes!.length).toBe(notes);
  });

  it("can be quiet", () => {
    dm({ type: "entry.stage", entryId: "e-fennick", stage: "found", announce: false });
    expect(g.discovery).toBeUndefined();
    expect(pub("e-fennick")!.name).toBe("Fennick");
  });

  it("a rumor on the TV shows no real name", () => {
    dm({ type: "entry.stage", entryId: "e-merchant", stage: "rumored", announce: true });
    const d = projectTv(g, 1).discovery!;
    expect(d).toMatchObject({ stage: "rumored", name: "???" });
    expect(tvJson()).not.toContain("The merchant");
  });

  it("finds a person the first time their portrait is on the TV", () => {
    dm({ type: "scene.show", sceneId: "s-chef" });
    expect(ent("e-chef").stage).toBe("found");
    expect(projectTv(g, 1).discovery?.name).toBe("The Chef");
  });

  it("makes an entry for a new portrait the first time it's shown", () => {
    g.scenes.push({ id: "s-new", label: "Smith", kind: "portrait", hotkey: null, reveal: false, name: "Old Hannet", title: "Smith" });
    dm({ type: "scene.show", sceneId: "s-new" });
    expect(g.entries!.find((n) => n.sceneId === "s-new")).toMatchObject({ name: "Old Hannet", kind: "person", stage: "found", slug: "old-hannet" });
  });

  it("back to hidden takes it off the phones and the TV", () => {
    dm({ type: "entry.stage", entryId: "e-artum", stage: "found", announce: true });
    dm({ type: "entry.stage", entryId: "e-artum", stage: "hidden", announce: true });
    expect(pub("e-artum")).toBeUndefined();
    expect(projectTv(g, 1).discovery).toBeUndefined();
    expect(g.scenes.find((x) => x.id === "s-artum")!.known).toBeUndefined();
  });

  it("knows which chapter it was found in", () => {
    dm({ type: "session.start" });
    dm({ type: "entry.stage", entryId: "e-baker", stage: "found", announce: false });
    expect(pub("e-baker")!.found!.chapter).toBe(1);
  });

  it("only the DM can move them", () => {
    expect(fails(P1, { type: "entry.stage", entryId: "e-artum", stage: "found", announce: true } as Command)).toMatch(/Only the DM/);
  });
});

describe("facts", () => {
  it("revealing one makes the entry Known, even from a rumor", () => {
    dm({ type: "entry.factReveal", entryId: "e-artum", factId: "e-artum-f1", revealed: true });
    expect(ent("e-artum").stage).toBe("known");
    expect(pub("e-artum")!.facts.map((f) => f.text)).toEqual(["His hired helpers quit the morning of the feast, after someone fell off a ladder."]);
    expect(phoneJson()).not.toContain("Docks wages");
  });

  it("can be shown on the TV, and taken back", () => {
    dm({ type: "entry.factReveal", entryId: "e-mags", factId: "e-mags-f2", revealed: true, tv: true });
    expect(projectTv(g, 1).discovery).toMatchObject({ name: "Mags Wick", fact: "Asks every newcomer what they’d do with a fortune, and remembers the answer." });
    dm({ type: "entry.factReveal", entryId: "e-mags", factId: "e-mags-f2", revealed: false });
    expect(projectTv(g, 1).discovery).toBeUndefined();
    expect(pub("e-mags")!.facts).toEqual([]);
  });

  it("are tagged with the session they were learned in", () => {
    dm({ type: "session.start" });
    dm({ type: "entry.factReveal", entryId: "e-mags", factId: "e-mags-f1", revealed: true });
    expect(ent("e-mags").facts[0].learnedIn).toBe(g.currentSessionId);
  });

  it("have slugs for the run sheet", () => {
    expect(findRef(g, "person/mags")?.entry.id).toBe("e-mags");
    const id = dm({ type: "entry.factAdd", entryId: "e-mags", text: "Owes the baker three silver" }).factId!;
    expect(findRef(g, "person/mags/owes-the-baker-three-silver")?.fact?.id).toBe(id);
    dm({ type: "entry.factUpdate", entryId: "e-mags", factId: id, slug: "owes-the-baker" });
    expect(findRef(g, "person/mags/owes-the-baker")?.fact?.id).toBe(id);
    expect(findRef(g, "person/nobody")).toBeNull();
  });

  it("can be added, edited, moved and removed", () => {
    const id = dm({ type: "entry.factAdd", entryId: "e-bolla", text: "  Owes Mags  money. " }).factId!;
    expect(ent("e-bolla").facts.at(-1)).toMatchObject({ id, text: "Owes Mags money." });
    dm({ type: "entry.factMove", entryId: "e-bolla", factId: id, dir: -1 });
    expect(ent("e-bolla").facts[0].id).toBe(id);
    dm({ type: "entry.factRemove", entryId: "e-bolla", factId: id });
    expect(ent("e-bolla").facts.some((f) => f.id === id)).toBe(false);
  });
});

describe("relationships", () => {
  it("show as the party's, or a player's own", () => {
    expect(pub("e-mags")!.relation).toBe("stranger");
    dm({ type: "entry.update", entryId: "e-mags", patch: { relation: "friendly" } });
    expect(pub("e-mags")!.relation).toBe("friendly");
    dm({ type: "entry.relationFor", entryId: "e-mags", playerId: "p1", relation: "ally" });
    expect(pub("e-mags")!.relation).toBe("ally");
    expect(projectPlayer(g, 1, "p2", []).entries.find((e) => e.id === "e-mags")!.relation).toBe("friendly");
    // Rumors don't give feelings away.
    expect(pub("e-artum")!.relation).toBeUndefined();
  });
});

describe("entries", () => {
  it("are added hidden, with a unique slug", () => {
    const a = dm({ type: "entry.add", entry: { name: "Mags Wick", kind: "person" } }).entryId!;
    expect(ent(a)).toMatchObject({ stage: "hidden", slug: "mags-wick" });
    const b = dm({ type: "entry.add", entry: { name: "Mags Wick", kind: "person" } }).entryId!;
    expect(ent(b).slug).toBe("mags-wick-2");
    expect(fails(DM, { type: "entry.add", entry: { name: "x", sceneId: "s-board" } })).toMatch(/portrait/);
    expect(fails(DM, { type: "entry.add", entry: {} })).toMatch(/name/);
  });

  it("file Chronicle notes by name, once found", () => {
    expect(phone().chronicle.tags).toContain("Mags Wick");
    expect(phone().chronicle.tags).not.toContain("Artum");
    expect(pub("e-mags")!.tags).toEqual(["Mags Wick"]);
  });

  it("go back to their starting stage on a fresh start, keeping what the DM wrote", () => {
    dm({ type: "entry.stage", entryId: "e-chef", stage: "found", announce: true });
    dm({ type: "entry.factReveal", entryId: "e-mags", factId: "e-mags-f1", revealed: true, tv: true });
    dm({ type: "entry.stage", entryId: "e-artum", stage: "found", announce: false });
    g = freshStart(g);
    expect(ent("e-chef").stage).toBe("hidden");
    expect(ent("e-mags").stage).toBe("found");
    expect(ent("e-artum").stage).toBe("rumored");
    expect(ent("e-mags").facts[0].revealedAt).toBeUndefined();
    expect(ent("e-mags").facts).toHaveLength(3);
    expect(g.discovery).toBeUndefined();
    expect(publicEntries(g).map((e) => e.id)).toEqual(["e-orsa", "e-mags", "e-artum", "e-fennick", "e-baker", "e-candle", "e-docks", "e-baldurs-gate", "e-lantern", "e-trollbark"]);
  });
});

describe("places, shops and monsters", () => {
  const pinOf = (sceneId: string, name: string) => g.scenes.find((x) => x.id === sceneId)!.map!.pins.find((p) => p.name === name)!;
  const tvMap = (sceneId: string) => projectTv(g, 1).scenes.find((x) => x.id === sceneId)!.map!;
  const tvPins = (sceneId: string) => {
    dm({ type: "scene.show", sceneId });
    dm({ type: "map.legend", sceneId, on: true, style: "names" });
    return tvMap(sceneId).pins;
  };

  it("seed places tied to their pins, at their stages", () => {
    expect(ent("e-candle").stage).toBe("found");
    expect(ent("e-baldurs-gate").stage).toBe("found");
    expect(ent("e-lantern").stage).toBe("rumored");
    expect(ent("e-trollbark").pin).toEqual({ sceneId: "s-swordcoast", pinId: pinOf("s-swordcoast", "The Trollbark Forest").id });
    expect(ent("e-broken-ring").stage).toBe("hidden");
    expect(pinOf("s-map", "Lathtarl’s Lantern").description).toBe("The old lighthouse across the river. Dark.");
  });

  it("a rumored place is a ? seal with its hint, never its real name", () => {
    const lantern = pinOf("s-map", "Lathtarl’s Lantern");
    const pin = tvPins("s-map").find((p) => p.id === lantern.id)!;
    expect(pin.label).toBe("?");
    expect(pin.name).toBe("???");
    expect(pin.description).toBe("The old lighthouse across the river. Dark.");
    expect(tvJson()).not.toContain("Lathtarl");
    expect(phoneJson()).not.toContain("Lathtarl");
  });

  it("the hint only goes with the names legend", () => {
    const lantern = pinOf("s-map", "Lathtarl’s Lantern");
    dm({ type: "scene.show", sceneId: "s-map" });
    dm({ type: "map.legend", sceneId: "s-map", on: true, style: "numbers" });
    const pin = tvMap("s-map").pins.find((p) => p.id === lantern.id)!;
    expect(pin.label).toBe("?");
    expect(pin.description).toBeUndefined();
  });

  it("finding a place shows its pin as it is; hiding it hides the pin", () => {
    const lantern = pinOf("s-map", "Lathtarl’s Lantern");
    dm({ type: "entry.stage", entryId: "e-lantern", stage: "found", announce: false });
    let pin = tvPins("s-map").find((p) => p.id === lantern.id)!;
    expect(pin.name).toBe("Lathtarl’s Lantern");
    expect(pin.label).not.toBe("?");
    dm({ type: "entry.stage", entryId: "e-lantern", stage: "hidden", announce: false });
    expect(pinOf("s-map", "Lathtarl’s Lantern").discovered).toBe(false);
    pin = tvPins("s-map").find((p) => p.id === lantern.id)!;
    expect(pin).toBeUndefined();
  });

  it("showing a pin finds its place; hiding the pin hides it unless it's Known", () => {
    const lantern = pinOf("s-map", "Lathtarl’s Lantern");
    dm({ type: "pin.discover", sceneId: "s-map", pinId: lantern.id, discovered: false, announce: false });
    expect(ent("e-lantern").stage).toBe("hidden");
    dm({ type: "pin.discover", sceneId: "s-map", pinId: lantern.id, discovered: true, announce: false });
    expect(ent("e-lantern").stage).toBe("found");
    dm({ type: "pin.discover", sceneId: "s-map", pinId: lantern.id, discovered: false, announce: false });
    expect(ent("e-lantern").stage).toBe("hidden");
    dm({ type: "entry.stage", entryId: "e-lantern", stage: "known", announce: false });
    expect(pinOf("s-map", "Lathtarl’s Lantern").discovered).toBe(true);
    dm({ type: "pin.discover", sceneId: "s-map", pinId: lantern.id, discovered: false, announce: false });
    expect(ent("e-lantern").stage).toBe("known");
  });

  it("links an existing pin to a place, one place per pin", () => {
    const lantern = pinOf("s-map", "Lathtarl’s Lantern");
    const candle = pinOf("s-map", "The Flickering Candle");
    // A hidden place tied to a pin the table can see: the place is found.
    dm({ type: "entry.add", entry: { kind: "place", name: "Somewhere" } });
    const id = g.entries!.at(-1)!.id;
    expect(ent(id).stage).toBe("hidden");
    dm({ type: "entry.update", entryId: id, patch: { pin: { sceneId: "s-map", pinId: candle.id } } });
    expect(ent(id).stage).toBe("found");
    expect(ent("e-candle").pin).toBeUndefined();
    // A hidden pin tied to a hidden place stays hidden; finding the place shows it.
    dm({ type: "pin.discover", sceneId: "s-map", pinId: lantern.id, discovered: false, announce: false });
    dm({ type: "entry.add", entry: { kind: "place", name: "The Lantern again", pin: { sceneId: "s-map", pinId: lantern.id } } });
    const id2 = g.entries!.at(-1)!.id;
    expect(ent(id2).stage).toBe("hidden");
    expect(ent("e-lantern").pin).toBeUndefined();
    expect(pinOf("s-map", "Lathtarl’s Lantern").discovered).toBe(false);
    dm({ type: "entry.stage", entryId: id2, stage: "found", announce: false });
    expect(pinOf("s-map", "Lathtarl’s Lantern").discovered).toBe(true);
    // Deleting the pin unties it.
    dm({ type: "pin.remove", sceneId: "s-map", pinId: lantern.id });
    expect(ent(id2).pin).toBeUndefined();
  });

  it("go back to their starting stage, pins too, on a fresh start", () => {
    dm({ type: "entry.stage", entryId: "e-lantern", stage: "found", announce: false });
    dm({ type: "entry.stage", entryId: "e-trollbark", stage: "hidden", announce: false });
    g = freshStart(g);
    expect(ent("e-lantern").stage).toBe("rumored");
    expect(pinOf("s-swordcoast", "The Trollbark Forest").discovered).toBe(true);
  });

  it("a shop's storefront opens when it's found, and opening the storefront finds it", () => {
    const shopId = g.shops.find((x) => x.visibility === "hidden")!.id;
    const id = dm({ type: "entry.add", entry: { kind: "shop", name: "The Smithy" } }).entryId!;
    dm({ type: "entry.update", entryId: id, patch: { shopId } });
    dm({ type: "entry.stage", entryId: id, stage: "rumored", announce: false });
    expect(g.shops.find((x) => x.id === shopId)!.visibility).toBe("hidden");
    dm({ type: "entry.stage", entryId: id, stage: "found", announce: false });
    expect(g.shops.find((x) => x.id === shopId)!.visibility).toBe("all");
    dm({ type: "entry.stage", entryId: id, stage: "hidden", announce: false });
    expect(g.shops.find((x) => x.id === shopId)!.visibility).toBe("hidden");
    dm({ type: "shop.visibility", shopId, visibility: "all" });
    expect(ent(id).stage).toBe("found");
  });

  it("a monster becomes a rumor under its TV name when a fight ends, then encountered once revealed", () => {
    const tpl = g.monsters![0];
    dm({ type: "fight.start", groups: [{ templateId: tpl.id, count: 2 }] });
    for (const c of g.fight!.order) dm({ type: "fight.init", combatantId: c.id, init: 10, bonus: 0 });
    dm({ type: "fight.begin" });
    dm({ type: "fight.end" });
    const e = g.entries!.find((x) => x.templateId === tpl.id)!;
    expect(e.kind).toBe("monster");
    expect(e.stage).toBe("rumored");
    expect(phoneJson()).not.toContain(tpl.name);
    expect(pub(e.id)!.name).toBe(tpl.displayName);
    dm({ type: "fight.close" });
    // The next fight, revealed: encountered.
    dm({ type: "fight.start", groups: [{ templateId: tpl.id, count: 1 }] });
    for (const c of g.fight!.order) dm({ type: "fight.init", combatantId: c.id, init: 10, bonus: 0 });
    dm({ type: "fight.begin" });
    const m = g.fight!.order.find((c) => c.kind === "monster")!;
    dm({ type: "fight.patch", combatantIds: [m.id], patch: { revealed: true } });
    expect(ent(e.id).stage).toBe("found");
    expect(g.entries!.filter((x) => x.templateId === tpl.id)).toHaveLength(1);
  });
});

describe("run sheet lines and the dice tray", () => {
  const sheet = `## The docks
reveal: person/fennick
## Mags talks
fact: person/mags/${"PLACEHOLDER"}
rumor: place/the-trollbark
reveal: person/artum known
reveal: person/nobody`;

  it("parse and export reveal:, rumor: and fact: lines", () => {
    const md = sheet.replace("PLACEHOLDER", "owes-the-baker");
    const p = parseEpisode(md, () => null);
    expect(p.beats[0].actions).toEqual([{ type: "reveal", ref: "person/fennick", stage: "found" }]);
    expect(p.beats[1].actions).toEqual([
      { type: "fact", ref: "person/mags/owes-the-baker" },
      { type: "reveal", ref: "place/the-trollbark", stage: "rumored" },
      { type: "reveal", ref: "person/artum", stage: "known" },
      { type: "reveal", ref: "person/nobody", stage: "found" },
    ]);
    const out = episodeMarkdown({ title: "T", beats: p.beats.map((b, i) => ({ ...b, id: `b${i}` })) }, { scenes: [], entries: [] });
    expect(out).toContain("reveal: person/fennick\n");
    expect(out).toContain("fact: person/mags/owes-the-baker");
    expect(out).toContain("rumor: place/the-trollbark");
    expect(out).toContain("reveal: person/artum known");
    expect(parseEpisode("## A\nreveal: fennick", () => null).warnings.join()).toMatch(/kind and a name/);
  });

  it("fire forward only, on the TV, and skip what isn't there", () => {
    const fact = ent("e-mags").facts[0];
    const md = sheet.replace("PLACEHOLDER", fact.slug);
    const p = parseEpisode(md, () => null);
    dm({ type: "entry.stage", entryId: "e-trollbark", stage: "found", announce: false });
    dm({ type: "episode.add", title: "Test", beats: p.beats } as Command);
    const ep = g.episodes!.at(-1)!;
    dm({ type: "session.start" });
    dm({ type: "run.start", episodeId: ep.id });
    dm({ type: "run.next" });
    expect(ent("e-fennick").stage).toBe("found");
    expect(g.discovery!.entryId).toBe("e-fennick");
    dm({ type: "run.next" });
    expect(ent("e-mags").facts[0].revealedAt).toBeDefined();
    expect(ent("e-mags").stage).toBe("known");
    expect(ent("e-trollbark").stage).toBe("found"); // a rumor line never takes it back
    expect(ent("e-artum").stage).toBe("known");
  });
});

describe("counters, goodwill locks and the session recap", () => {
  it("count per area, and only show what's left in totals mode", () => {
    const candle = () => phone().areas.find((a) => a.name === "Candlefair")!;
    expect(candle().total).toBeUndefined();
    const before = candle();
    dm({ type: "discovery.totals", on: true });
    const hidden = g.entries!.filter((e) => e.stage === "hidden" && e.areas.includes("Candlefair")).length;
    expect(candle().total).toBe(before.found + before.rumored + hidden);
    dm({ type: "entry.stage", entryId: "e-chef", stage: "found", announce: false });
    expect(candle().found).toBe(before.found + 1);
    expect(candle().total).toBe(before.found + before.rumored + hidden);
  });

  it("an item, storefront or flyer opens when someone's goodwill is high enough", () => {
    const it = g.items.find((x) => x.tier === "sale" && !x.renown)!;
    const shopId = it.shopId;
    dm({ type: "shop.visibility", shopId, visibility: "all" });
    dm({ type: "item.update", itemId: it.id, patch: { trust: { entryId: "e-mags", relation: "friendly" } } });
    const card = () => phone().items.find((x) => x.id === it.id)!;
    expect(card().tier).toBe("locked");
    expect(card().goodwill).toBe("Mags Wick’s friendship");
    expect(fails(P1, { type: "me.requestBuy", itemId: it.id, qty: 1, note: "" })).toMatch(/friendship/);
    dm({ type: "entry.update", entryId: "e-mags", patch: { relation: "friendly" } });
    expect(card().tier).toBe("sale");
    expect(card().goodwill).toBeUndefined();
    expect(g.banner?.text ?? "").toMatch(/Now for sale/);
    // Hostile locks it again; ally needs more than friendly.
    dm({ type: "item.update", itemId: it.id, patch: { trust: { entryId: "e-mags", relation: "ally" } } });
    expect(card().tier).toBe("locked");
    dm({ type: "shop.update", shopId, patch: { trust: { entryId: "e-artum", relation: "friendly" } } });
    const shop = () => phone().shops.find((x) => x.id === shopId)!;
    expect(shop().goodwill).toBe("someone’s friendship"); // Artum is still only a rumor
    expect(phone().items.some((x) => x.shopId === shopId)).toBe(false);
    dm({ type: "entry.update", entryId: "e-artum", patch: { relation: "ally" } });
    expect(shop().goodwill).toBeUndefined();
  });

  it("a job flyer can't be taken without that goodwill", () => {
    const j = g.jobs!.find((x) => !x.renown)!;
    dm({ type: "job.update", jobId: j.id, patch: { trust: { entryId: "e-orsa", relation: "friendly" } } });
    dm({ type: "job.pin", jobId: j.id, pinned: true } as Command);
    const mine = () => phone().jobs.find((x) => x.id === j.id)!;
    expect(mine().canTake).toBe(false);
    expect(mine().goodwill).toBe("Captain Orsa Dell’s friendship");
    expect(fails(P1, { type: "me.takeJob", jobId: j.id, note: "" })).toMatch(/friendship/);
    dm({ type: "entry.update", entryId: "e-orsa", patch: { relation: "friendly" } });
    expect(mine().canTake).toBe(true);
  });

  it("sums up the night at session end, on the TV and in the Chronicle", () => {
    dm({ type: "session.start" });
    dm({ type: "entry.stage", entryId: "e-fennick", stage: "found", announce: false });
    dm({ type: "entry.stage", entryId: "e-artum", stage: "found", announce: false });
    dm({ type: "entry.stage", entryId: "e-lantern", stage: "found", announce: false });
    dm({ type: "entry.factReveal", entryId: "e-mags", factId: "e-mags-f1", revealed: true });
    dm({ type: "session.end" });
    const text = "Tonight you met Artum and Fennick, visited Lathtarl’s Lantern and learned 1 new thing.";
    const tv = projectTv(g, 1).recapCard!;
    expect(tv.text.replace("Fennick and Artum", "Artum and Fennick")).toBe(text);
    expect(g.notes!.at(-1)!.text).toBe(tv.text);
  });

  it("a quiet night has no card", () => {
    dm({ type: "session.start" });
    dm({ type: "session.end" });
    expect(g.recapCard).toBeUndefined();
  });
});
