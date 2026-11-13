// Spoiler safety: DM-only data must never appear in the TV or player payloads.
import { describe, expect, it } from "vitest";
import { gatedArtIsLive, projectDm, projectPlayer, projectTv } from "@/shared/projection";
import { apply } from "@/shared/reducer";
import { seedGame } from "@/shared/seed";
import type { GameState, LedgerEntry } from "@/shared/types";

const CANARY = "CANARY_DM_ONLY_7f3a";
const KEYHASH = "c".repeat(64);

/** A game with a canary string in every DM-only field. */
function spoilerGame(): GameState {
  const g = seedGame("t");
  for (const sc of g.scenes) sc.dmNote = `${CANARY} note for ${sc.id}`;
  const symbol = g.scenes.find((s) => s.id === "s-symbol")!;
  symbol.label = `${CANARY} label`;
  symbol.alt = `${CANARY} alt`;
  symbol.name = `${CANARY} name`;
  g.players[0].keyHash = KEYHASH;
  g.players[0].lastSeenAt = 123456789;
  g.items.find((i) => i.id === "bg-wand")!.priceCp = 987654321; // locked, price hidden
  for (const i of g.items) i.dmNote = `${CANARY} item note`;
  g.sessions.push({ id: "sess1", number: 1, title: "One", startedAt: 1, endedAt: null, attendeeIds: [], dmNotes: CANARY });
  g.currentSessionId = "sess1";
  return g;
}

const ledger: LedgerEntry[] = [
  { id: "l1", at: 1, playerId: "p1", playerName: "Player 1", amountCp: 100, note: "mine", kind: "grant", sessionId: null },
  { id: "l2", at: 2, playerId: "p2", playerName: "Player 2", amountCp: 200, note: "someone else's", kind: "grant", sessionId: null },
];

function leaks(json: string) {
  return [CANARY, KEYHASH, "987654321", "123456789", "merchant-sigil\"", "dmNote", "keyHash", "lastSeenAt", "dmNotes"].filter((x) => json.includes(x));
}

describe("TV payload", () => {
  it("contains no DM-only data while a normal scene is live", () => {
    const json = JSON.stringify(projectTv(spoilerGame(), 1));
    expect(leaks(json)).toEqual([]);
    expect(json).not.toContain("s-symbol");
  });

  it("includes the reveal scene only once it's live, still without DM notes", () => {
    let g = spoilerGame();
    g = apply(g, { type: "scene.show", sceneId: "s-symbol" }, { now: 0, actor: { role: "dm" } }).state;
    const tv = projectTv(g, 2);
    const sym = tv.scenes.find((s) => s.id === "s-symbol")!;
    expect(sym).toBeTruthy();
    expect(sym.art.url).toMatch(/^\/api\/art\/merchant-sigil/);
    const json = JSON.stringify(tv);
    expect(json).not.toContain("dmNote");
    expect(json).not.toContain(`${CANARY} label`);
    expect(json).not.toContain("keyHash");
  });

  it("hides locked prices only when asked to", () => {
    const g = spoilerGame();
    for (const sh of g.shops) sh.visibility = "all";
    const tv = projectTv(g, 1);
    expect(tv.items.find((i) => i.id === "bg-wand")!.priceCp).toBeNull(); // locked, ??? gp
    expect(tv.items.find((i) => i.name === "Plate Armor")!.priceCp).toBe(150000); // locked, price visible
    expect(JSON.stringify(tv)).not.toContain("987654321");
  });
});

describe("player payload", () => {
  it("contains no DM-only data and no scenes", () => {
    const view = projectPlayer(spoilerGame(), 1, "p1", ledger);
    const json = JSON.stringify(view);
    expect(leaks(json)).toEqual([]);
    expect(json).not.toContain("s-symbol");
    expect(json).not.toContain("scenes");
    expect(view.me.locked).toBe(true);
  });
  it("only shows the player's own history", () => {
    const view = projectPlayer(spoilerGame(), 1, "p1", ledger);
    expect(view.myLedger.map((l) => l.note)).toEqual(["mine"]);
  });
});

describe("DM payload", () => {
  it("has everything except key hashes", () => {
    const dm = projectDm(spoilerGame(), 1, ledger);
    const json = JSON.stringify(dm);
    expect(json).toContain(CANARY);
    expect(json).not.toContain(KEYHASH);
    expect(dm.state.players[0].hasKey).toBe(true);
  });
});

describe("gated art", () => {
  it("is only served while its scene is live", () => {
    let g = seedGame("t");
    expect(gatedArtIsLive(g, "merchant-sigil")).toBe(false);
    g = apply(g, { type: "scene.show", sceneId: "s-symbol" }, { now: 0, actor: { role: "dm" } }).state;
    expect(gatedArtIsLive(g, "merchant-sigil")).toBe(true);
  });
});

describe("Heroic Inspiration in the purse", () => {
  it("shows on the TV and phones as a plain flag", () => {
    const g = spoilerGame();
    g.players[1].inspired = true;
    const tv = projectTv(g, 1);
    expect(tv.purse.find((p) => p.id === "p2")!.inspired).toBe(true);
    expect(tv.purse.find((p) => p.id === "p1")!.inspired).toBe(false);
    expect(projectPlayer(g, 1, "p1", ledger).purse.find((p) => p.id === "p2")!.inspired).toBe(true);
    // Each purse entry carries exactly these fields and nothing else.
    expect(Object.keys(tv.purse[0]).sort()).toEqual(["balanceCp", "id", "inspired", "name"]);
  });
});

describe("the VTT link", () => {
  it("reaches players but not the TV", () => {
    const g = spoilerGame();
    g.vttUrl = "https://www.dndbeyond.com/games/1";
    expect(projectPlayer(g, 1, "p1", ledger).vttUrl).toBe("https://www.dndbeyond.com/games/1");
    expect(JSON.stringify(projectTv(g, 1))).not.toContain("dndbeyond.com/games");
  });
});
