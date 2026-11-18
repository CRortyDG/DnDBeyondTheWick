// "Last time on…": the players' recap card. The DM reviews it, it goes out only
// after the session ends, and nothing DM-only can ride along with it.
import { beforeEach, describe, expect, it } from "vitest";
import type { Command } from "@/shared/commands";
import { projectChronicle } from "@/shared/chronicle";
import { lastTimeDraft } from "@/shared/lastTime";
import { projectPlayer, projectTv } from "@/shared/projection";
import { apply, CommandError } from "@/shared/reducer";
import { seedGame } from "@/shared/seed";
import { hydrate } from "@/server/store";
import { DM_AUTHOR, type Actor, type GameState } from "@/shared/types";

const DM: Actor = { role: "dm" };
const P1: Actor = { role: "player", playerId: "p1" };

let g: GameState;
let now = 1_000_000;
const run = (actor: Actor, cmd: Command) => (g = apply(g, cmd, { now: (now += 60_000), actor }).state);
const dm = (cmd: Command) => run(DM, cmd);
const fails = (actor: Actor, cmd: Command) => expect(() => apply(g, cmd, { now, actor })).toThrow(CommandError);
const phone = (pid = "p1") => projectPlayer(g, 1, pid, []);
const cur = () => g.sessions.find((x) => x.id === g.currentSessionId)!;
const noteId = (text: string) => g.notes!.find((n) => n.text === text)!.id;

beforeEach(() => {
  g = hydrate(seedGame("t"))!;
  now = 1_000_000;
  g.players[0].character = "Brin Ashcombe";
});

/** A session with a recap, a starred note, a hidden note and a DM-only quick note. */
function playNight() {
  dm({ type: "session.start", title: "The Secret Episode Name" });
  const sid = cur().id;
  run(P1, { type: "me.noteAdd", text: "Mags owes us a pie" });
  dm({ type: "note.update", noteId: noteId("Mags owes us a pie"), patch: { starred: true } });
  dm({ type: "note.add", text: "The baker is the cultist", tags: [] });
  dm({ type: "note.update", noteId: noteId("The baker is the cultist"), patch: { hidden: true } });
  dm({ type: "run.recap", sessionId: sid, text: "You reached Candlefair and found the bakery shut." });
  return sid;
}

describe("the draft", () => {
  it("starts from the recap and starred visible notes only", () => {
    const sid = playNight();
    const d = lastTimeDraft(g, sid);
    expect(d.text).toBe("You reached Candlefair and found the bakery shut.");
    expect(d.noteIds).toEqual([noteId("Mags owes us a pie")]);
  });
});

describe("sending", () => {
  it("never reaches players while the session is running", () => {
    const sid = playNight();
    dm({ type: "lastTime.save", sessionId: sid, text: "Last time…", noteIds: [], onEnd: false });
    fails(DM, { type: "lastTime.send", sessionId: sid });
    expect(phone().lastTime).toBeUndefined();
    expect(JSON.stringify(phone())).not.toContain("Last time…");
    // And the DM's draft never shows up on the TV either.
    expect(JSON.stringify(projectTv(g, 1))).not.toContain("Last time…");
  });

  it("goes out at End session when the DM ticked it, with the DM's edits", () => {
    const sid = playNight();
    dm({ type: "lastTime.save", sessionId: sid, text: "Last time on: the bakery was shut.", noteIds: [noteId("Mags owes us a pie")], onEnd: true });
    dm({ type: "session.end" });
    const card = phone().lastTime!;
    expect(card).toMatchObject({ chapter: 1, text: "Last time on: the bakery was shut.", notes: [{ text: "Mags owes us a pie", author: "Brin Ashcombe" }] });
    expect(g.sessions.find((x) => x.id === sid)!.playerRecap!.onEnd).toBeUndefined();
    // Episode titles stay DM-only.
    expect(JSON.stringify(card)).not.toContain("Secret Episode");
    // It's also on that chapter in the player's Chronicle.
    expect(phone().chronicle.chapters.find((c) => c.id === sid)!.card?.text).toBe("Last time on: the bakery was shut.");
  });

  it("doesn't go out at the end when unticked, and can be sent later", () => {
    const sid = playNight();
    dm({ type: "lastTime.save", sessionId: sid, text: "Draft", noteIds: [], onEnd: false });
    dm({ type: "session.end" });
    expect(phone().lastTime).toBeUndefined();
    dm({ type: "lastTime.send", sessionId: sid, text: "Final words", noteIds: [] });
    const first = phone().lastTime!;
    expect(first.text).toBe("Final words");
    // Editing the draft doesn't change what players have until it's sent again.
    dm({ type: "lastTime.save", sessionId: sid, text: "Better words", noteIds: [], onEnd: false });
    expect(phone().lastTime!.text).toBe("Final words");
    dm({ type: "lastTime.send", sessionId: sid });
    expect(phone().lastTime!.text).toBe("Better words");
    expect(phone().lastTime!.n).not.toBe(first.n);
    dm({ type: "lastTime.unsend", sessionId: sid });
    expect(phone().lastTime).toBeUndefined();
    expect(g.sessions.find((x) => x.id === sid)!.playerRecap!.text).toBe("Better words");
  });

  it("can't carry a hidden note, and drops a note the DM hides after sending", () => {
    const sid = playNight();
    const hidden = noteId("The baker is the cultist");
    const pie = noteId("Mags owes us a pie");
    dm({ type: "session.end" });
    dm({ type: "lastTime.send", sessionId: sid, text: "Recap", noteIds: [hidden, pie] });
    expect(g.sessions.find((x) => x.id === sid)!.playerRecap!.sent!.noteIds).toEqual([pie]);
    expect(JSON.stringify(phone())).not.toContain("cultist");
    dm({ type: "note.update", noteId: pie, patch: { hidden: true } });
    expect(phone().lastTime!.notes).toEqual([]);
  });

  it("is a DM command only", () => {
    const sid = playNight();
    dm({ type: "session.end" });
    expect(() => apply(g, { type: "lastTime.send", sessionId: sid, text: "Hacked" } as Command, { now, actor: P1 })).toThrow();
  });

  it("needs words to send", () => {
    const sid = playNight();
    dm({ type: "session.end" });
    fails(DM, { type: "lastTime.send", sessionId: sid, text: "   " });
  });

  it("shows the newest card, and the DM's Chronicle carries no player card field", () => {
    const s1 = playNight();
    dm({ type: "session.end" });
    dm({ type: "lastTime.send", sessionId: s1, text: "One" });
    dm({ type: "session.start" });
    const s2 = cur().id;
    dm({ type: "lastTime.save", sessionId: s2, text: "Two", noteIds: [], onEnd: true });
    // While session 2 runs, players still have session 1's card.
    expect(phone().lastTime!.text).toBe("One");
    dm({ type: "session.end" });
    expect(phone().lastTime).toMatchObject({ text: "Two", chapter: 2 });
    expect(projectChronicle(g, { dm: true }).chapters.every((c) => c.card === undefined)).toBe(true);
  });

  it("stays off phones with the Chronicle switched off", () => {
    const sid = playNight();
    dm({ type: "session.end" });
    dm({ type: "lastTime.send", sessionId: sid, text: "Recap" });
    dm({ type: "features.set", off: ["chronicle"] });
    expect(phone().lastTime).toBeUndefined();
  });
});

describe("a shared world", () => {
  it("only reaches the party that played", () => {
    dm({ type: "party.add", name: "The Sons", firstName: "The Friends" });
    const A = g.parties![0].id;
    const B = g.parties![1].id;
    dm({ type: "party.member", partyId: A, playerId: "p3", member: false });
    dm({ type: "party.member", partyId: B, playerId: "p3", member: true, catchUp: false });
    dm({ type: "session.start", partyId: A });
    const sid = cur().id;
    dm({ type: "session.end" });
    dm({ type: "lastTime.send", sessionId: sid, text: "Party A's night" });
    expect(phone("p1").lastTime?.text).toBe("Party A's night");
    expect(phone("p3").lastTime).toBeUndefined();
    expect(JSON.stringify(phone("p3"))).not.toContain("Party A's night");
  });
});

it("uses the DM author name for DM notes", () => {
  const sid = playNight();
  dm({ type: "note.add", text: "A DM aside", tags: [] });
  dm({ type: "session.end" });
  dm({ type: "lastTime.send", sessionId: sid, text: "Recap", noteIds: [noteId("A DM aside")] });
  expect(g.notes!.find((n) => n.text === "A DM aside")!.authorId).toBe(DM_AUTHOR);
  expect(phone().lastTime!.notes).toEqual([{ text: "A DM aside", author: "The DM" }]);
});
