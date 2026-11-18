// Secret whispers: only the players a whisper went to ever get it.
import { beforeEach, describe, expect, it } from "vitest";
import type { Command } from "@/shared/commands";
import { dmCommand, playerCommand } from "@/shared/commands";
import { projectPlayer, projectTv } from "@/shared/projection";
import { apply, CommandError } from "@/shared/reducer";
import { seedGame } from "@/shared/seed";
import { hydrate } from "@/server/store";
import { unreadReplies, WHISPERS_KEPT } from "@/shared/whispers";
import type { Actor, GameState } from "@/shared/types";

const DM: Actor = { role: "dm" };
const P1: Actor = { role: "player", playerId: "p1" };
const P2: Actor = { role: "player", playerId: "p2" };
const SECRET = "the baker's hands are shaking";

let g: GameState;
let now = 1_000_000;
const run = (actor: Actor, cmd: Command) => (g = apply(g, cmd, { now: (now += 1000), actor }).state);
const dm = (cmd: Command) => run(DM, cmd);
const fails = (actor: Actor, cmd: Command, msg?: RegExp) => expect(() => apply(g, cmd, { now, actor })).toThrow(msg ?? CommandError);
const phone = (pid: string) => {
  const v = projectPlayer(g, 1, pid, []);
  return { ...v, whispers: v.whispers ?? [] };
};

beforeEach(() => {
  g = hydrate(seedGame("t"))!;
  now = 1_000_000;
  expect(g.players.length).toBeGreaterThanOrEqual(3);
});

describe("whisper.send", () => {
  it("reaches only the players it went to", () => {
    dm({ type: "session.start" });
    dm({ type: "whisper.send", to: ["p1"], text: `  You notice ${SECRET}.  ` });
    const mine = phone("p1").whispers;
    expect(mine).toHaveLength(1);
    expect(mine[0]).toMatchObject({ text: `You notice ${SECRET}.`, seen: false, tonight: true });
    expect(JSON.stringify(phone("p2"))).not.toContain(SECRET);
    expect(phone("p2").whispers).toEqual([]);
    expect(JSON.stringify(projectTv(g, 1))).not.toContain(SECRET);
  });

  it("can go to several players without telling them who else got it", () => {
    dm({ type: "whisper.send", to: ["p1", "p2", "p1"], text: SECRET });
    expect(g.whispers![0].to).toEqual(["p1", "p2"]);
    const p1 = phone("p1");
    expect(p1.whispers).toHaveLength(1);
    expect(phone("p2").whispers).toHaveLength(1);
    expect(phone("p3").whispers).toHaveLength(0);
    // Nothing on the phone's copy names the other recipients.
    expect(Object.keys(p1.whispers[0]).sort()).toEqual(["at", "id", "seen", "text", "tonight"]);
    expect(p1.whispers[0].tonight).toBe(false);
  });

  it("refuses empty words, unknown or departed players, and players", () => {
    fails(DM, { type: "whisper.send", to: ["p1"], text: "   " }, /Write/);
    fails(DM, { type: "whisper.send", to: ["nobody"], text: SECRET });
    g.players.find((p) => p.id === "p2")!.archived = true;
    fails(DM, { type: "whisper.send", to: ["p1", "p2"], text: SECRET }, /left the table/);
    expect(() => apply(g, { type: "whisper.send", to: ["p1"], text: SECRET } as Command, { now, actor: P1 })).toThrow(/Only the DM/);
    expect(playerCommand.safeParse({ type: "whisper.send", to: ["p1"], text: "x" }).success).toBe(false);
    expect(dmCommand.safeParse({ type: "whisper.send", to: [], text: "x" }).success).toBe(false);
  });

  it("keeps the newest few hundred", () => {
    for (let i = 0; i < WHISPERS_KEPT + 5; i++) dm({ type: "whisper.send", to: ["p1"], text: `w${i}` });
    expect(g.whispers).toHaveLength(WHISPERS_KEPT);
    expect(g.whispers!.at(-1)!.text).toBe(`w${WHISPERS_KEPT + 4}`);
    expect(phone("p1").whispers[0].text).toBe(`w${WHISPERS_KEPT + 4}`);
    expect(phone("p1").whispers.length).toBeLessThanOrEqual(30);
  });

  it("is refused while the feature is off, and phones get none", () => {
    dm({ type: "whisper.send", to: ["p1"], text: SECRET });
    dm({ type: "features.set", off: ["whispers"] });
    fails(DM, { type: "whisper.send", to: ["p1"], text: "again" }, /turned off/);
    expect(phone("p1").whispers).toEqual([]);
    fails(P1, { type: "me.whisperSeen", whisperId: g.whispers![0].id }, /turned off/);
  });
});

describe("reading and answering", () => {
  beforeEach(() => dm({ type: "whisper.send", to: ["p1", "p2"], text: SECRET }));
  const wid = () => g.whispers![0].id;

  it("marks it read for that player only", () => {
    run(P1, { type: "me.whisperSeen", whisperId: wid() });
    expect(phone("p1").whispers[0].seen).toBe(true);
    expect(phone("p2").whispers[0].seen).toBe(false);
    const at = g.whispers![0].seen!.p1;
    run(P1, { type: "me.whisperSeen", whisperId: wid() });
    expect(g.whispers![0].seen!.p1).toBe(at);
  });

  it("a player can't touch a whisper that wasn't sent to them", () => {
    expect(() => apply(g, { type: "me.whisperSeen", whisperId: wid() }, { now, actor: { role: "player", playerId: "p3" } })).toThrow(/gone/);
    expect(() => apply(g, { type: "me.whisperReply", whisperId: wid(), text: "hi" }, { now, actor: { role: "player", playerId: "p3" } })).toThrow(/gone/);
  });

  it("answers stay between that player and the DM", () => {
    run(P2, { type: "me.whisperReply", whisperId: wid(), text: "I pocket the coin." });
    expect(phone("p2").whispers[0]).toMatchObject({ reply: "I pocket the coin.", seen: true });
    expect(JSON.stringify(phone("p1"))).not.toContain("pocket");
    expect(JSON.stringify(projectTv(g, 1))).not.toContain("pocket");
    expect(unreadReplies(g)).toHaveLength(1);
    // A new answer replaces the old one.
    run(P2, { type: "me.whisperReply", whisperId: wid(), text: "Actually I leave it." });
    expect(g.whispers![0].replies).toHaveLength(1);
    expect(g.whispers![0].replies![0].text).toBe("Actually I leave it.");
    dm({ type: "whisper.read" });
    expect(unreadReplies(g)).toHaveLength(0);
    // Empty takes it back.
    run(P2, { type: "me.whisperReply", whisperId: wid(), text: "  " });
    expect(g.whispers![0].replies).toBeUndefined();
  });

  it("taking it back removes it from every phone", () => {
    dm({ type: "whisper.remove", whisperId: wid() });
    expect(phone("p1").whispers).toEqual([]);
    expect(phone("p2").whispers).toEqual([]);
    expect(g.whispers).toBeUndefined();
    fails(P1, { type: "me.whisperSeen", whisperId: "w1" }, /gone/);
  });
});
