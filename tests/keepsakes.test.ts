// Keepsakes: DM-given mementos from real moments. The app only suggests; nothing
// is ever handed out by itself, and suggestions stay DM-only.
import { describe, expect, it } from "vitest";
import type { Command } from "@/shared/commands";
import { keepsakeSuggestions } from "@/shared/keepsakes";
import { projectPlayer, projectTv } from "@/shared/projection";
import { apply, CommandError, type Ctx } from "@/shared/reducer";
import { seedGame } from "@/shared/seed";
import { hydrate } from "@/server/store";
import type { GameState } from "@/shared/types";

let now = 1_000_000;
const DM = () => ({ now: (now += 60_000), actor: { role: "dm" as const } });
const as = (playerId: string): Ctx => ({ now: (now += 60_000), actor: { role: "player", playerId } });

function game(): GameState {
  now = 1_000_000;
  const g = hydrate(seedGame("t"))!;
  g.players[2].away = true;
  g.players[3].away = true;
  g.players[0].character = "Brin";
  g.players[1].character = "Ash";
  return g;
}
function run(g: GameState, cmds: (Command | [Command, Ctx])[], rand = () => 0.5): GameState {
  for (const c of cmds) g = apply(g, ...(Array.isArray(c) ? [c[0], { ...c[1], rand }] as const : [c, { ...DM(), rand }] as const)).state;
  return g;
}
const sid = (g: GameState) => g.currentSessionId!;
const ids = (g: GameState, kind: "player" | "monster") => g.fight!.order.filter((c) => c.kind === kind).map((c) => c.id);
const ash = (g: GameState) => g.fight!.order.find((c) => c.playerId === "p2")!.id;

/** A session with a fight: Ash drops, rolls a natural 20 death save, and the party wins. */
function nightWithFight(): GameState {
  let g = run(game(), [{ type: "session.start", title: "Night one" }, { type: "fight.start", groups: [{ templateId: "m-pudding-gremlin", count: 2 }], where: "in the feast hall" }]);
  g = run(g, [
    [{ type: "me.initiative", init: 15 }, as("p1")],
    [{ type: "me.initiative", init: 12 }, as("p2")],
    { type: "fight.rollInit" },
    { type: "fight.begin" },
    [{ type: "me.hp", max: 20, cur: 20 }, as("p1")],
    [{ type: "me.hp", max: 20, cur: 20 }, as("p2")],
  ]);
  g = run(g, [{ type: "fight.hp", combatantIds: [ash(g)], mode: "damage", amount: 25 }]);
  g = run(g, [[{ type: "me.deathSave", mark: "nat20" }, as("p2")]]);
  g = run(g, [{ type: "fight.hp", combatantIds: ids(g, "monster"), mode: "damage", amount: 99 }, { type: "fight.end" }, { type: "fight.close", note: null }]);
  return g;
}

describe("suggestions", () => {
  it("notice the death save, and never give anything by themselves", () => {
    const g = nightWithFight();
    const s = keepsakeSuggestions(g, sid(g), now);
    const save = s.find((x) => x.key.startsWith("save20:"))!;
    expect(save.playerIds).toEqual(["p2"]);
    expect(save.name).toBe("A borrowed breath");
    expect(save.line).toContain("in the feast hall");
    // Already marked for the death save, so not suggested twice for going down.
    expect(s.some((x) => x.key.startsWith("downed:") && x.playerIds[0] === "p2")).toBe(false);
    expect(g.keepsakes).toBeUndefined();
    expect(s.length).toBeLessThanOrEqual(4);
  });

  it("stop showing once given or skipped", () => {
    let g = nightWithFight();
    const [first] = keepsakeSuggestions(g, sid(g), now);
    g = run(g, [{ type: "keepsake.give", playerIds: first.playerIds, name: first.name, line: first.line, source: first.key }]);
    expect(keepsakeSuggestions(g, sid(g), now).some((x) => x.key === first.key)).toBe(false);
    expect(() => apply(g, { type: "keepsake.give", playerIds: ["p1"], name: "Again", line: "", source: first.key }, DM())).toThrow(CommandError);
    g = run(g, [{ type: "note.add", text: "Brin talked the guard into lending us his boat", tags: [] }]);
    const noteId = g.notes!.at(-1)!.id;
    g = run(g, [{ type: "note.update", noteId, patch: { starred: true } }]);
    const note = keepsakeSuggestions(g, sid(g), now).find((x) => x.key === `note:${noteId}`)!;
    // The note is about Brin, so it's Brin's.
    expect(note.playerIds).toEqual(["p1"]);
    g = run(g, [{ type: "keepsake.skip", sessionId: sid(g), source: note.key }]);
    expect(keepsakeSuggestions(g, sid(g), now).some((x) => x.key === note.key)).toBe(false);
  });

  it("pick up a player's natural 20, but not on initiative", () => {
    let g = run(game(), [{ type: "session.start", title: "Night one" }]);
    g = run(g, [[{ type: "me.diceRoll", dice: [{ sides: 20, count: 1 }], plus: 0, tv: true }, as("p1")]], () => 0.99);
    const s = keepsakeSuggestions(g, sid(g), now);
    expect(s.map((x) => x.key)).toContain(`crit:${sid(g)}:p1`);
  });
});

describe("giving", () => {
  it("lands on the shelf, writes a Chronicle line, and can bring Heroic Inspiration", () => {
    let g = run(game(), [{ type: "session.start", title: "Night one" }]);
    g = run(g, [{ type: "keepsake.give", playerIds: ["p1"], name: "Ogre's tooth, cracked", line: "Felled the marsh ogre with one swing.", inspire: true }]);
    const k = g.keepsakes![0];
    expect(k.sessionId).toBe(sid(g));
    expect(g.players[0].inspired).toBe(true);
    expect(g.notes!.find((n) => n.id === k.noteId)!.text).toBe("Brin kept a keepsake: Ogre's tooth, cracked. Felled the marsh ogre with one swing.");
    const mine = projectPlayer(g, 1, "p1", []).keepsakes;
    expect(mine).toEqual([expect.objectContaining({ name: "Ogre's tooth, cracked", who: ["Brin"], mine: true, chapter: 1 })]);
    // The party sees it too, as someone else's.
    expect(projectPlayer(g, 1, "p2", []).keepsakes[0].mine).toBe(false);
    // Removing it takes its Chronicle line with it.
    g = run(g, [{ type: "keepsake.remove", keepsakeId: k.id }]);
    expect(g.keepsakes).toBeUndefined();
    expect(g.notes!.some((n) => n.id === k.noteId)).toBe(false);
  });

  it("can be shared by the party, and edits keep the Chronicle line in step", () => {
    let g = run(game(), [{ type: "session.start", title: "Night one" }]);
    g = run(g, [{ type: "keepsake.give", playerIds: ["p1", "p2"], name: "The bell clapper", line: "The night the town knew their names." }]);
    const k = g.keepsakes![0];
    expect(g.notes!.find((n) => n.id === k.noteId)!.text).toMatch(/^Brin and Ash keep a keepsake: The bell clapper\./);
    g = run(g, [{ type: "keepsake.edit", keepsakeId: k.id, name: "The old bell's clapper" }]);
    expect(g.notes!.find((n) => n.id === k.noteId)!.text).toContain("The old bell's clapper");
  });

  it("is DM-only, needs a name, and stays off the TV and phones when switched off", () => {
    let g = run(game(), [{ type: "session.start", title: "Night one" }]);
    expect(() => apply(g, { type: "keepsake.give", playerIds: ["p1"], name: "x", line: "" } as never, as("p1"))).toThrow();
    expect(() => apply(g, { type: "keepsake.give", playerIds: ["p1"], name: "   ", line: "" }, DM())).toThrow(CommandError);
    g = run(g, [{ type: "keepsake.give", playerIds: ["p1"], name: "A lucky button", line: "Found it in a goblin's pocket." }]);
    expect(JSON.stringify(projectTv(g, 1))).not.toContain("A lucky button");
    g = run(g, [{ type: "features.set", off: ["keepsakes"] }]);
    expect(projectPlayer(g, 1, "p1", []).keepsakes).toEqual([]);
    expect(() => apply(g, { type: "keepsake.give", playerIds: ["p1"], name: "Another", line: "" }, DM())).toThrow(/turned off/);
  });

  it("never sends suggestions or skips to a phone", () => {
    let g = nightWithFight();
    const [first] = keepsakeSuggestions(g, sid(g), now);
    g = run(g, [{ type: "keepsake.skip", sessionId: sid(g), source: first.key }]);
    const json = JSON.stringify(projectPlayer(g, 1, "p1", []));
    expect(json).not.toContain(first.key);
    expect(json).not.toContain("A borrowed breath");
  });
});
