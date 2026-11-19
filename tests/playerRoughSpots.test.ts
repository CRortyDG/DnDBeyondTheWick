// Player phone rough spots: notes players start, the party page, condition rules.
import { beforeEach, describe, expect, it } from "vitest";
import type { Command } from "@/shared/commands";
import { playerCommand } from "@/shared/commands";
import { CONDITIONS as FIGHT_CONDITIONS } from "@/shared/combat";
import { conditionRule } from "@/shared/conditionRules";
import { projectPlayer, projectTv } from "@/shared/projection";
import { apply, CommandError } from "@/shared/reducer";
import { seedGame } from "@/shared/seed";
import { CONDITIONS as SHEET_CONDITIONS } from "@/shared/sheet";
import { hydrate } from "@/server/store";
import { PLAYER_NOTES_WAITING, unreadReplies } from "@/shared/whispers";
import type { Actor, GameState } from "@/shared/types";

const DM: Actor = { role: "dm" };
const P1: Actor = { role: "player", playerId: "p1" };
const NOTE = "can I pocket the ring without anyone seeing";

let g: GameState;
let now = 1_000_000;
const run = (actor: Actor, cmd: Command) => (g = apply(g, cmd, { now: (now += 1000), actor }).state);
const fails = (actor: Actor, cmd: Command, msg?: RegExp) => expect(() => apply(g, cmd, { now, actor })).toThrow(msg ?? CommandError);
const phone = (pid: string) => projectPlayer(g, 1, pid, []);

beforeEach(() => {
  g = hydrate(seedGame("t"))!;
  now = 1_000_000;
});

describe("a player writes to the DM first", () => {
  it("is a player command, reaches the DM, and only the writer's phone", () => {
    expect(playerCommand.safeParse({ type: "me.whisperStart", text: "x" }).success).toBe(true);
    run(P1, { type: "me.whisperStart", text: `  ${NOTE}  ` });
    const w = g.whispers!.at(-1)!;
    expect(w).toMatchObject({ from: "p1", to: ["p1"], text: NOTE });
    // The DM sees it as waiting.
    expect(unreadReplies(g)).toEqual([{ playerId: "p1", text: NOTE, at: w.at }]);
    // It's on my phone as mine, already read; nobody else's, never the TV.
    const mine = phone("p1").whispers!;
    expect(mine[0]).toMatchObject({ text: NOTE, mine: true, seen: true });
    expect(phone("p2").whispers ?? []).toEqual([]);
    expect(JSON.stringify(projectTv(g, 1))).not.toContain(NOTE);
    // Reading clears it for the DM.
    run(DM, { type: "whisper.read" });
    expect(unreadReplies(g)).toEqual([]);
  });

  it("refuses an empty note, an answer to your own note, and a pile-up the DM hasn't read", () => {
    fails(P1, { type: "me.whisperStart", text: "   " }, /Write/);
    run(P1, { type: "me.whisperStart", text: NOTE });
    fails(P1, { type: "me.whisperReply", whisperId: g.whispers!.at(-1)!.id, text: "hi" }, /own note/);
    for (let i = 1; i < PLAYER_NOTES_WAITING; i++) run(P1, { type: "me.whisperStart", text: `${NOTE} ${i}` });
    fails(P1, { type: "me.whisperStart", text: "one more" }, /hasn't read/);
    run(DM, { type: "whisper.read" });
    run(P1, { type: "me.whisperStart", text: "one more" });
  });

  it("is blocked when whispers are switched off", () => {
    run(DM, { type: "features.set", off: ["whispers"] });
    fails(P1, { type: "me.whisperStart", text: NOTE });
  });
});

describe("the party page", () => {
  it("lists everyone still at the table, me first, with class and level but no gold", () => {
    const p2 = g.players.find((p) => p.id === "p2")!;
    run(DM, { type: "sheet.update", playerId: "p2", patch: { cls: "Wizard", subclass: "Evoker", species: "Elf" } });
    run(DM, { type: "player.level", playerId: "p2", level: 3 });
    const party = phone("p1").party;
    expect(party[0]).toMatchObject({ id: "p1", you: true });
    const two = party.find((m) => m.id === "p2")!;
    expect(two).toMatchObject({ cls: "Wizard", subclass: "Evoker", species: "Elf", level: 3 });
    expect(two.name).toBe(p2.character?.trim() || p2.name);
    expect(Object.keys(two)).not.toContain("balanceCp");
    expect(party.every((m) => !g.players.find((p) => p.id === m.id)!.archived)).toBe(true);
  });
});

describe("condition rules", () => {
  it("explain every condition on the fight list and the sheet", () => {
    for (const c of [...FIGHT_CONDITIONS, ...SHEET_CONDITIONS]) expect(conditionRule(c), c).toBeTruthy();
    expect(conditionRule("Glowing with pride")).toBeUndefined();
  });
});
