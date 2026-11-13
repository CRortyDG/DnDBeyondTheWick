// The Chronicle: who can change which notes, chapters, tag suggestions, export, spoiler safety.
import { beforeEach, describe, expect, it } from "vitest";
import { execute, viewFor } from "@/server/game";
import { seedEpisodes } from "@/server/seed-episodes";
import { createMemoryStore, type Store } from "@/server/store";
import { chronicleMarkdown, NEXT_CHAPTER, projectChronicle, tagSuggestions } from "@/shared/chronicle";
import type { Command } from "@/shared/commands";
import { projectDm, projectPlayer, projectTv, type PlayerView } from "@/shared/projection";
import { apply, CommandError } from "@/shared/reducer";
import { freshStart, seedGame } from "@/shared/seed";
import type { Actor, GameState } from "@/shared/types";

const DM: Actor = { role: "dm" };
const P1: Actor = { role: "player", playerId: "p1" };
const P2: Actor = { role: "player", playerId: "p2" };

let clock = 1_000_000;
const act = (g: GameState, actor: Actor, cmd: Command) => apply(g, cmd, { now: (clock += 60_000), actor }).state;
const fails = (g: GameState, actor: Actor, cmd: Command) => expect(() => apply(g, cmd, { now: clock, actor })).toThrow(CommandError);
const notes = (g: GameState) => g.notes ?? [];
const last = (g: GameState) => notes(g)[notes(g).length - 1];

function game(): GameState {
  const g = seedGame("t");
  g.episodes = seedEpisodes(g.scenes);
  g.players[0].character = "Brin Ashcombe";
  return g;
}

describe("the seed", () => {
  it("opens on an empty Chapter 1 for Episode 1", () => {
    const v = projectChronicle(game(), { dm: false, playerId: "p1" });
    expect(v.chapters).toHaveLength(1);
    expect(v.chapters[0]).toMatchObject({ id: NEXT_CHAPTER, number: 1 });
    // Episode titles are run-sheet data: the DM sees which episode, players don't.
    expect(v.chapters[0].episode).toBeUndefined();
    expect(projectChronicle(game(), { dm: true }).chapters[0].episode).toBe("Just Desserts");
    expect(v.notes).toEqual([]);
    expect(v.defaultChapterId).toBe(NEXT_CHAPTER);
  });

  it("hands notes written ahead to Session 1 when it starts", () => {
    let g = act(game(), P1, { type: "me.noteAdd", text: "Can't wait" });
    expect(last(g).sessionId).toBeNull();
    g = act(g, DM, { type: "session.start" });
    expect(last(g).sessionId).toBe(g.currentSessionId);
    const v = projectChronicle(g, { dm: false, playerId: "p1" });
    expect(v.chapters.map((c) => c.id)).toEqual([g.currentSessionId]);
  });
});

describe("who can change which notes", () => {
  let g: GameState;
  beforeEach(() => {
    g = act(game(), DM, { type: "session.start" });
    g = act(g, P1, { type: "me.noteAdd", text: "Chef says he bought the recipes from a traveling merchant", tags: ["the chef"] });
  });

  it("signs a note with the character name", () => {
    expect(last(g)).toMatchObject({ authorId: "p1", authorName: "Brin Ashcombe", tags: ["the chef"] });
    const n = projectChronicle(g, { dm: false, playerId: "p2" }).notes[0];
    expect(n).toMatchObject({ author: "Brin Ashcombe", player: "Player 1", editable: false });
  });

  it("lets a player edit and delete their own note", () => {
    const id = last(g).id;
    g = act(g, P1, { type: "me.noteUpdate", noteId: id, patch: { text: "He bought them from a peddler" } });
    expect(last(g).text).toBe("He bought them from a peddler");
    expect(last(g).editedAt).toBeDefined();
    g = act(g, P1, { type: "me.noteRemove", noteId: id });
    expect(notes(g)).toHaveLength(0);
  });

  it("refuses another player's edits and deletes", () => {
    const id = last(g).id;
    fails(g, P2, { type: "me.noteUpdate", noteId: id, patch: { text: "Mine now" } });
    fails(g, P2, { type: "me.noteRemove", noteId: id });
  });

  it("keeps players off the DM's commands", () => {
    const id = last(g).id;
    fails(g, P1, { type: "note.update", noteId: id, patch: { starred: true } } as Command);
    fails(g, P2, { type: "note.remove", noteId: id } as Command);
  });

  it("lets the DM edit, star, hide and delete any note", () => {
    const id = last(g).id;
    g = act(g, DM, { type: "note.update", noteId: id, patch: { text: "Edited by the DM", starred: true } });
    expect(last(g)).toMatchObject({ text: "Edited by the DM", starred: true });
    g = act(g, DM, { type: "note.update", noteId: id, patch: { hidden: true } });
    expect(last(g).hidden).toBe(true);
    g = act(g, DM, { type: "note.remove", noteId: id });
    expect(notes(g)).toHaveLength(0);
  });

  it("removes hidden notes for players (author included), and they can't touch them", () => {
    const id = last(g).id;
    g = act(g, DM, { type: "note.update", noteId: id, patch: { hidden: true } });
    for (const pid of ["p1", "p2"]) {
      const v = projectPlayer(g, 1, pid, []);
      expect(v.chronicle.notes).toEqual([]);
      expect(JSON.stringify(v)).not.toContain("traveling merchant");
    }
    expect(JSON.stringify(projectTv(g, 1))).not.toContain("traveling merchant");
    fails(g, P1, { type: "me.noteUpdate", noteId: id, patch: { text: "back" } });
    // The DM still sees it, marked hidden.
    expect(projectDm(g, 1, []).chronicle.notes[0].hidden).toBe(true);
  });

  it("refuses empty notes", () => {
    fails(g, P1, { type: "me.noteAdd", text: "   \n  " });
  });
});

describe("chapters", () => {
  it("defaults a note to the running session", () => {
    let g = act(game(), DM, { type: "session.start" });
    g = act(g, DM, { type: "session.end" });
    g = act(g, DM, { type: "session.start" });
    const [s1, s2] = g.sessions;
    g = act(g, P1, { type: "me.noteAdd", text: "Tonight" });
    expect(last(g).sessionId).toBe(s2.id);
    // Between sessions, notes go to the latest one.
    g = act(g, DM, { type: "session.end" });
    g = act(g, P1, { type: "me.noteAdd", text: "Afterwards" });
    expect(last(g).sessionId).toBe(s2.id);
    expect(s1.id).not.toBe(s2.id);
  });

  it("moves a note to another chapter", () => {
    let g = act(game(), DM, { type: "session.start" });
    g = act(g, DM, { type: "session.end" });
    g = act(g, DM, { type: "session.start" });
    const [s1, s2] = g.sessions;
    g = act(g, P1, { type: "me.noteAdd", text: "Wrong night" });
    const id = last(g).id;
    g = act(g, P1, { type: "me.noteUpdate", noteId: id, patch: { chapterId: s1.id } });
    const v = projectChronicle(g, { dm: false, playerId: "p1" });
    expect(v.notes.find((n) => n.id === id)!.chapterId).toBe(s1.id);
    fails(g, P1, { type: "me.noteUpdate", noteId: id, patch: { chapterId: "nope" } });
    expect(s2.id).toBeTruthy();
  });

  it("marks the note-taker's notes with a quill", () => {
    let g = act(game(), DM, { type: "session.start" });
    g = act(g, DM, { type: "session.noteTaker", sessionId: g.currentSessionId!, playerId: "p1" });
    g = act(g, P1, { type: "me.noteAdd", text: "Quill" });
    g = act(g, P2, { type: "me.noteAdd", text: "No quill" });
    const v = projectChronicle(g, { dm: false, playerId: "p2" });
    expect(v.notes.map((n) => n.quill)).toEqual([true, false]);
    expect(v.chapters[0].noteTaker).toEqual({ id: "p1", name: "Brin Ashcombe" });
  });

  it("shows players the recap only once the session has ended", () => {
    let g = act(game(), DM, { type: "session.start" });
    const sid = g.currentSessionId!;
    g = act(g, DM, { type: "run.recap", sessionId: sid, text: "The pudding attacked." });
    expect(projectChronicle(g, { dm: false, playerId: "p1" }).chapters[0].recap).toBeUndefined();
    expect(projectChronicle(g, { dm: true }).chapters[0].recap).toBe("The pudding attacked.");
    g = act(g, DM, { type: "session.end" });
    expect(projectChronicle(g, { dm: false, playerId: "p1" }).chapters[0].recap).toBe("The pudding attacked.");
  });

  it("keeps a deleted session's notes on the next chapter's page", () => {
    let g = act(game(), DM, { type: "session.start" });
    g = act(g, P1, { type: "me.noteAdd", text: "Keep me" });
    g = act(g, DM, { type: "session.remove", sessionId: g.currentSessionId! });
    expect(last(g).sessionId).toBeNull();
  });

  it("starts the Chronicle again on Start fresh", () => {
    let g = act(game(), DM, { type: "session.start" });
    g = act(g, P1, { type: "me.noteAdd", text: "Test run" });
    g = act(g, DM, { type: "scene.show", sceneId: "s-chef" });
    g = freshStart(g);
    expect(notes(g)).toEqual([]);
    expect(tagSuggestions(g)).not.toContain("The Chef");
  });
});

describe("managing a deleted player's notes", () => {
  it("lists them for the DM and hides or deletes them all at once", () => {
    let g = act(game(), DM, { type: "session.start" });
    g = act(g, P2, { type: "me.noteAdd", text: "one" });
    g = act(g, P2, { type: "me.noteAdd", text: "two" });
    g = act(g, P1, { type: "me.noteAdd", text: "stays" });
    g = act(g, DM, { type: "player.remove", playerId: "p2" });
    const author = projectChronicle(g, { dm: true }).authors!.find((a) => a.id === "p2")!;
    expect(author).toMatchObject({ name: "Player 2", status: "deleted", notes: 2, hidden: 0 });
    // Players never get the list.
    expect(projectChronicle(g, { dm: false, playerId: "p1" }).authors).toBeUndefined();

    g = act(g, DM, { type: "note.hideAuthor", authorId: "p2", hidden: true });
    expect(projectChronicle(g, { dm: false, playerId: "p1" }).notes.map((n) => n.text)).toEqual(["stays"]);
    g = act(g, DM, { type: "note.hideAuthor", authorId: "p2", hidden: false });
    expect(projectChronicle(g, { dm: false, playerId: "p1" }).notes).toHaveLength(3);

    g = act(g, DM, { type: "note.removeAuthor", authorId: "p2" });
    expect(notes(g).map((n) => n.text)).toEqual(["stays"]);
    expect(projectChronicle(g, { dm: true }).authors!.map((a) => a.id)).toEqual(["p1"]);
    fails(g, DM, { type: "note.removeAuthor", authorId: "p2" });
  });

  it("is DM only", () => {
    let g = act(game(), DM, { type: "session.start" });
    g = act(g, P2, { type: "me.noteAdd", text: "mine" });
    fails(g, P1, { type: "note.removeAuthor", authorId: "p2" } as Command);
    fails(g, P1, { type: "note.hideAuthor", authorId: "p2", hidden: true } as Command);
  });
});

describe("tag suggestions", () => {
  /** A game where everything secret is named with a canary. */
  function secretGame(): GameState {
    const g = game();
    const map = g.scenes.find((s) => s.id === "s-map")!.map!;
    for (const p of map.pins) if (!p.discovered) p.name = `SECRET_PIN_${p.id}`;
    const chef = g.scenes.find((s) => s.id === "s-chef")!;
    chef.name = "SECRET_NPC_CHEF";
    for (const sh of g.shops) sh.visibility = "all";
    g.shops[1].visibility = "hidden";
    g.shops[2].visibility = "some";
    g.shops[2].playerIds = ["p1"];
    g.shops[3].closed = true;
    for (const it of g.items) {
      if (it.tier === "hidden" || it.tier === "rumored") it.name = `SECRET_ITEM_${it.id}`;
      if ([g.shops[1].id, g.shops[2].id, g.shops[3].id].includes(it.shopId)) it.name = `SECRET_SHOP_ITEM_${it.id}`;
    }
    g.items.push({ ...g.items[0], id: "x-hidden", tier: "hidden", name: "SECRET_ITEM_x" });
    return g;
  }

  it("never include hidden pins, unshown NPCs or hidden shop items", () => {
    let g = secretGame();
    g = act(g, DM, { type: "session.start" });
    g = act(g, DM, { type: "note.add", text: "secret", tags: ["SECRET_HIDDEN_NOTE_TAG"] });
    g = act(g, DM, { type: "note.update", noteId: last(g).id, patch: { hidden: true } });
    const tags = tagSuggestions(g);
    expect(tags.filter((t) => t.startsWith("SECRET"))).toEqual([]);
    // ... and the same holds for the whole player payload, not just the list.
    const json = JSON.stringify(projectPlayer(g, 1, "p2", []).chronicle);
    expect(json).not.toContain("SECRET");
    // Known things are there.
    expect(tags).toContain("The Flickering Candle");
    expect(tags.length).toBeGreaterThan(3);
  });

  it("include an NPC once their portrait has been on the TV, or the DM marks them met", () => {
    let g = game();
    expect(tagSuggestions(g)).not.toContain("The Chef");
    g = act(g, DM, { type: "scene.show", sceneId: "s-chef" });
    expect(tagSuggestions(g)).toContain("The Chef");
    g = act(g, DM, { type: "scene.known", sceneId: "s-mags", known: true });
    expect(tagSuggestions(g)).toContain("Mags Wick");
    g = act(g, DM, { type: "scene.known", sceneId: "s-mags", known: false });
    expect(tagSuggestions(g)).not.toContain("Mags Wick");
  });

  it("suggest only loot a player can hold: no rent, services or projects, and honours once granted", () => {
    const g = game();
    for (const sh of g.shops) sh.visibility = "all";
    const tags = tagSuggestions(g);
    expect(tags).toContain("Rope, 50 ft");
    for (const name of ["Rent a room", "Buy Mags a drink", "A new forge", "The Pudding Slayer"]) expect(tags).not.toContain(name);
    g.awards.push({ id: "aw1", itemId: "c-pudding", itemName: "The Pudding Slayer", playerIds: ["p1"], at: 1, note: "" });
    expect(tagSuggestions(g)).toContain("The Pudding Slayer");
  });

  it("leave out pin names when the map shows numbers only", () => {
    const g = game();
    g.scenes.find((s) => s.id === "s-map")!.map!.legendStyle = "numbers";
    expect(tagSuggestions(g)).not.toContain("The Flickering Candle");
  });

  it("include earlier tags, in the table's spelling, once", () => {
    let g = act(game(), DM, { type: "session.start" });
    g = act(g, P1, { type: "me.noteAdd", text: "a", tags: ["the chef", "Recipes"] });
    g = act(g, DM, { type: "scene.show", sceneId: "s-chef" });
    const tags = tagSuggestions(g);
    expect(tags.filter((t) => t.toLowerCase() === "the chef")).toEqual(["the chef"]);
    expect(tags).toContain("Recipes");
  });
});

describe("Previously on…", () => {
  it("shows only starred notes from that chapter, picked by the DM", () => {
    let g = act(game(), DM, { type: "session.start" });
    const sid = g.currentSessionId!;
    g = act(g, P1, { type: "me.noteAdd", text: "Starred" });
    const a = last(g).id;
    g = act(g, P1, { type: "me.noteAdd", text: "Not starred" });
    const b = last(g).id;
    g = act(g, DM, { type: "note.update", noteId: a, patch: { starred: true } });
    g = act(g, DM, { type: "run.recap", sessionId: sid, text: "Recap" });
    g = act(g, DM, { type: "session.end" });
    g = act(g, DM, { type: "live.recap", sessionId: sid, noteIds: [a, b] });
    expect(projectTv(g, 1).recap!.notes).toEqual([{ text: "Starred", author: "Brin Ashcombe" }]);
    // Hiding it takes it straight off the TV.
    g = act(g, DM, { type: "note.update", noteId: a, patch: { hidden: true } });
    expect(projectTv(g, 1).recap!.notes).toBeUndefined();
    // Not sent at all without a recap on the TV.
    g = act(g, DM, { type: "live.recap", sessionId: null });
    expect(JSON.stringify(projectTv(g, 1))).not.toContain("Starred");
  });
});

describe("export", () => {
  it("lists chapters in order with authors and dates", () => {
    let g = act(game(), DM, { type: "session.start", title: "Just Desserts" });
    g = act(g, P1, { type: "me.noteAdd", text: "First night\nsecond line", tags: ["the chef"] });
    g = act(g, DM, { type: "note.update", noteId: last(g).id, patch: { starred: true } });
    g = act(g, DM, { type: "run.recap", sessionId: g.currentSessionId!, text: "They ate well." });
    g = act(g, DM, { type: "session.end" });
    g = act(g, DM, { type: "session.start" });
    g = act(g, P2, { type: "me.noteAdd", text: "Second night" });
    g = act(g, DM, { type: "note.add", text: "Hidden one" });
    g = act(g, DM, { type: "note.update", noteId: last(g).id, patch: { hidden: true } });
    const view = projectChronicle(g, { dm: true });
    const md = chronicleMarkdown(view, { gameName: "Tales" });

    const c1 = md.indexOf("## Chapter 1 \u00b7 Just Desserts");
    const c2 = md.indexOf("## Chapter 2");
    expect(c1).toBeGreaterThan(-1);
    expect(c2).toBeGreaterThan(c1);
    expect(md.indexOf("First night")).toBeGreaterThan(c1);
    expect(md.indexOf("First night")).toBeLessThan(c2);
    expect(md.indexOf("Second night")).toBeGreaterThan(c2);
    expect(md).toMatch(/- \u2605 \*\*Brin Ashcombe\*\*, \d{1,2} \w{3} \d{4}, \d\d:\d\d: First night\n {2}second line\n {2}_Tags: the chef_/);
    expect(md).toContain("**Player 2**");
    expect(md).toContain("> They ate well.");
    expect(md).toMatch(/_\d{1,2} \w{3} \d{4} \u00b7 At the table: /);
    expect(md).not.toContain("Hidden one");

    const one = chronicleMarkdown(view, { chapterId: g.sessions[1].id });
    expect(one).not.toContain("First night");
    expect(one).toContain("Second night");
  });
});

describe("through the real server", () => {
  let store: Store;
  beforeEach(async () => {
    store = createMemoryStore();
    await store.overwrite("t", game(), []);
  });

  it("serves players only safe Chronicle data", async () => {
    await execute(store, "t", DM, { type: "session.start" });
    await execute(store, "t", P1, { type: "me.noteAdd", text: "visible note" });
    await execute(store, "t", DM, { type: "note.add", text: "CANARY_HIDDEN_NOTE" });
    const { state } = await store.read("t");
    await execute(store, "t", DM, { type: "note.update", noteId: last(state!).id, patch: { hidden: true } });
    const v = (await viewFor(store, "t", P2)) as PlayerView;
    expect(v.chronicle.notes.map((n) => n.text)).toEqual(["visible note"]);
    expect(JSON.stringify(v)).not.toContain("CANARY_HIDDEN_NOTE");
    expect(JSON.stringify(await viewFor(store, "t", { role: "tv" }))).not.toContain("visible note");
  });
});
