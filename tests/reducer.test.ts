import { describe, expect, it } from "vitest";
import type { Command } from "@/shared/commands";
import { apply, CommandError, type Ctx } from "@/shared/reducer";
import { freshStart, seedGame } from "@/shared/seed";
import type { GameState, LedgerEntry } from "@/shared/types";

const DM: Ctx = { now: 1_700_000_000_000, actor: { role: "dm" } };
const SYS: Ctx = { now: 1_700_000_000_000, actor: { role: "system" } };

/** Apply a list of commands, collecting the ledger like the store does. */
function run(state: GameState, cmds: Command[], ctx: Ctx = DM) {
  const ledger: LedgerEntry[] = [];
  for (const c of cmds) {
    const r = apply(state, c, ctx);
    state = r.state;
    ledger.push(...r.ledger);
  }
  return { state, ledger };
}

const bal = (s: GameState, id: string) => s.players.find((p) => p.id === id)!.balanceCp;

describe("money", () => {
  it("gives and takes, and the ledger always sums to the balance", () => {
    const { state, ledger } = run(seedGame("t"), [
      { type: "money.adjust", playerId: "p1", amountCp: 2500, note: "Artum's pay" },
      { type: "money.adjust", playerId: "p1", amountCp: -100, note: "" },
      { type: "money.adjust", playerId: "p2", amountCp: 37, note: "" },
    ]);
    expect(bal(state, "p1")).toBe(2400);
    expect(bal(state, "p2")).toBe(37);
    for (const p of state.players) {
      expect(ledger.filter((l) => l.playerId === p.id).reduce((a, l) => a + l.amountCp, 0)).toBe(p.balanceCp);
    }
    expect(ledger[1].note).toBe("Spent");
    expect(ledger[0].kind).toBe("grant");
    expect(ledger[1].kind).toBe("charge");
  });

  it("refuses to take more than a player has unless debt is allowed", () => {
    const s = seedGame("t");
    expect(() => apply(s, { type: "money.adjust", playerId: "p1", amountCp: -1, note: "" }, DM)).toThrow(CommandError);
    const r = apply(s, { type: "money.adjust", playerId: "p1", amountCp: -1, note: "", allowDebt: true }, DM);
    expect(bal(r.state, "p1")).toBe(-1);
  });

  it("rejects a zero adjustment", () => {
    expect(() => apply(seedGame("t"), { type: "money.adjust", playerId: "p1", amountCp: 0, note: "" }, DM)).toThrow(/amount/);
  });

  it("pays everyone chosen, once each, in one batch", () => {
    const { state, ledger } = run(seedGame("t"), [{ type: "money.payAll", amountCp: 500, note: "", playerIds: ["p1", "p2", "p2", "p3"] }]);
    expect(ledger).toHaveLength(3);
    expect(new Set(ledger.map((l) => l.batchId)).size).toBe(1);
    expect(ledger[0].note).toBe("Party pay");
    expect(bal(state, "p4")).toBe(0);
    expect(bal(state, "p2")).toBe(500);
  });

  it("buys only what a player can afford, and records the purchase", () => {
    let { state } = run(seedGame("t"), [{ type: "money.adjust", playerId: "p1", amountCp: 1000, note: "" }]);
    const longsword = state.items.find((i) => i.name === "Longsword")!; // 15 gp
    const dagger = state.items.find((i) => i.name === "Dagger")!; // 2 gp
    expect(() => apply(state, { type: "money.buy", playerId: "p1", itemId: longsword.id }, DM)).toThrow(/can't afford/);
    const r = apply(state, { type: "money.buy", playerId: "p1", itemId: dagger.id }, DM);
    expect(bal(r.state, "p1")).toBe(800);
    expect(r.ledger[0]).toMatchObject({ kind: "purchase", amountCp: -200, note: "Bought Dagger", itemId: dagger.id });
  });

  it("won't sell a locked item", () => {
    let { state } = run(seedGame("t"), [{ type: "money.adjust", playerId: "p1", amountCp: 1_000_000, note: "" }]);
    const plate = state.items.find((i) => i.name === "Plate Armor")!;
    expect(() => apply(state, { type: "money.buy", playerId: "p1", itemId: plate.id }, DM)).toThrow(/locked/);
  });

  it("tags ledger lines with the running session", () => {
    const { ledger } = run(seedGame("t"), [
      { type: "money.adjust", playerId: "p1", amountCp: 1, note: "" },
      { type: "session.start" },
      { type: "money.adjust", playerId: "p1", amountCp: 1, note: "" },
    ]);
    expect(ledger[0].sessionId).toBeNull();
    expect(ledger[1].sessionId).toMatch(/^sess/);
  });

  it("does not mutate its input", () => {
    const s = seedGame("t");
    const before = JSON.stringify(s);
    apply(s, { type: "money.adjust", playerId: "p1", amountCp: 5, note: "" }, DM);
    expect(JSON.stringify(s)).toBe(before);
  });
});

describe("permissions", () => {
  it("only the DM can run DM commands", () => {
    const s = seedGame("t");
    const cmd: Command = { type: "money.adjust", playerId: "p1", amountCp: 100, note: "" };
    expect(() => apply(s, cmd, { now: 0, actor: { role: "tv" } })).toThrow(/Only the DM/);
    expect(() => apply(s, cmd, { now: 0, actor: { role: "player", playerId: "p1" } })).toThrow(/Only the DM/);
  });
  it("system commands can't come from a player", () => {
    expect(() => apply(seedGame("t"), { type: "system.join", handle: "x", name: "x" }, { now: 0, actor: { role: "player", playerId: "p1" } })).toThrow();
  });
});

describe("players from the URL", () => {
  it("creates a drop-in from an unknown ?player= name", () => {
    const r = apply(seedGame("t"), { type: "system.join", handle: "Sam", name: "Sam" }, SYS);
    const sam = r.state.players.find((p) => p.id === r.playerId)!;
    expect(sam).toMatchObject({ handle: "sam", name: "Sam", dropIn: true, balanceCp: 0 });
  });
  it("won't create reserved or duplicate names", () => {
    const s = seedGame("t");
    expect(() => apply(s, { type: "system.join", handle: "DM", name: "DM" }, SYS)).toThrow();
    expect(() => apply(s, { type: "system.join", handle: "Player-1", name: "x" }, SYS)).toThrow(/taken/);
  });
  it("adds joiners to the running session's attendance", () => {
    let { state } = run(seedGame("t"), [{ type: "session.start" }]);
    const r = apply(state, { type: "system.join", handle: "sam", name: "Sam" }, SYS);
    expect(r.state.sessions[0].attendeeIds).toContain(r.playerId);
  });
  it("admitting a knock creates the player", () => {
    let s = apply(seedGame("t"), { type: "system.knock", handle: "Bolla" }, SYS).state;
    const k = s.knocks[0];
    s = apply(s, { type: "knock.admit", knockId: k.id }, DM).state;
    expect(s.knocks).toHaveLength(0);
    expect(s.players.some((p) => p.handle === "bolla")).toBe(true);
  });
  it("won't remove a player who still has gold", () => {
    let { state } = run(seedGame("t"), [{ type: "money.adjust", playerId: "p1", amountCp: 1, note: "" }]);
    expect(() => apply(state, { type: "player.remove", playerId: "p1" }, DM)).toThrow(/Archive/);
    expect(apply(state, { type: "player.remove", playerId: "p2" }, DM).state.players).toHaveLength(3);
  });
});

describe("scenes", () => {
  it("hotkeys pick scenes and close the shop", () => {
    let { state } = run(seedGame("t"), [{ type: "live.shop", open: true }, { type: "scene.hotkey", key: 3 }]);
    expect(state.live.sceneId).toBe("s-mags");
    expect(state.live.shopOpen).toBe(false);
  });
  it("steps wrap around", () => {
    const { state } = run(seedGame("t"), [{ type: "scene.step", dir: -1 }]);
    expect(state.live.sceneId).toBe("s-black");
  });
  it("starting or ending a session goes back to the notice board", () => {
    const { state } = run(seedGame("t"), [{ type: "scene.show", sceneId: "s-symbol" }, { type: "session.start" }]);
    expect(state.live.sceneId).toBe("s-board");
  });
  it("giving a scene a taken hotkey frees the old one", () => {
    const { state } = run(seedGame("t"), [{ type: "scene.update", sceneId: "s-black", patch: { hotkey: 1 } }]);
    expect(state.scenes.find((s) => s.id === "s-board")!.hotkey).toBeNull();
  });
  it("refuses image URLs that weren't uploaded", () => {
    expect(() => apply(seedGame("t"), { type: "scene.update", sceneId: "s-map", patch: { art: { url: "javascript:alert(1)" } } }, DM)).toThrow();
  });
});

describe("managing sessions", () => {
  it("renames, renumbers, reopens and deletes", () => {
    let { state } = run(seedGame("t"), [{ type: "session.start" }, { type: "session.end" }, { type: "session.start" }, { type: "session.end" }]);
    const [one, two] = state.sessions;
    expect(two.number).toBe(2);
    expect(() => apply(state, { type: "session.update", sessionId: two.id, patch: { number: 1 } }, DM)).toThrow(/already number 1/);
    state = run(state, [{ type: "session.remove", sessionId: one.id }, { type: "session.update", sessionId: two.id, patch: { number: 1 } }]).state;
    expect(state.sessions).toHaveLength(1);
    expect(state.sessions[0]).toMatchObject({ number: 1, title: "Session 1" });
    state = run(state, [{ type: "session.reopen", sessionId: two.id }]).state;
    expect(state.currentSessionId).toBe(two.id);
    expect(state.sessions[0].endedAt).toBeNull();
    expect(() => apply(state, { type: "session.reopen", sessionId: two.id }, DM)).toThrow(/running/);
  });

  it("numbers the next session after the highest, even after deletions", () => {
    let { state } = run(seedGame("t"), [{ type: "session.start" }, { type: "session.end" }, { type: "session.start" }, { type: "session.end" }]);
    state = run(state, [{ type: "session.remove", sessionId: state.sessions[0].id }, { type: "session.start" }]).state;
    expect(state.sessions.map((x) => x.number)).toEqual([2, 3]);
  });

  it("deleting every session starts again at 1", () => {
    let { state } = run(seedGame("t"), [{ type: "session.start" }, { type: "session.end" }]);
    state = run(state, [{ type: "session.remove", sessionId: state.sessions[0].id }, { type: "session.start" }]).state;
    expect(state.sessions[0].number).toBe(1);
  });

  it("start fresh zeroes purses and clears sessions but keeps the table", () => {
    let { state } = run(seedGame("t"), [{ type: "session.start" }, { type: "money.adjust", playerId: "p1", amountCp: 500, note: "" }, { type: "scene.show", sceneId: "s-mags" }]);
    const fresh = freshStart(state);
    expect(fresh.players.map((p) => p.balanceCp)).toEqual([0, 0, 0, 0]);
    expect(fresh.sessions).toEqual([]);
    expect(fresh.currentSessionId).toBeNull();
    expect(fresh.live.sceneId).toBe("s-board");
    expect(fresh.items).toEqual(state.items);
    expect(fresh.players.map((p) => p.name)).toEqual(state.players.map((p) => p.name));
  });
});

describe("seats", () => {
  it("the DM can change how many seats the table has", () => {
    const s = apply(seedGame("t"), { type: "table.seats", max: 8 }, DM).state;
    expect(s.maxPlayers).toBe(8);
    expect(() => apply(s, { type: "table.seats", max: 8 }, { now: 0, actor: { role: "player", playerId: "p1" } })).toThrow();
  });
});
