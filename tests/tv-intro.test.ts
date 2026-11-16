// The Arrival intro on the TV: the DM plays it, steps it along, and the TV gets
// only the intro's own look (what every phone with a link already gets).
import { describe, expect, it } from "vitest";
import { execute, parseClientCommand } from "@/server/game";
import { createMemoryStore } from "@/server/store";
import { arrivalLook } from "@/shared/arrival";
import { resolveRef } from "@/shared/assets";
import { blankGame } from "@/shared/presets";
import { projectTv } from "@/shared/projection";
import { seedGame } from "@/shared/seed";
import { introPos, stepMs, tvSteps, shownChars } from "@/client/arrival/tvIntro";
import { PANELS } from "@/client/arrival/content";

const DM = { role: "dm" as const };
const CLIP = "/api/files/my-game/0123456789abcdef01234567.mp4";
const PIC = "/api/files/my-game/abcdef0123456789abcdef01.webp";
const WIDE = "/api/files/my-game/abcdef0123456789abcdef02.webp";

async function game(kind: "blank" | "candlefair" = "blank") {
  const store = createMemoryStore();
  const id = kind === "blank" ? "my-game" : "candlefair";
  await store.overwrite(id, kind === "blank" ? blankGame(id, "Saltmarsh Nights") : seedGame(id), []);
  const run = (cmd: Parameters<typeof execute>[3]) => execute(store, id, DM, cmd);
  const state = async () => (await store.read(id)).state!;
  return { run, state };
}

describe("the intro on the TV", () => {
  it("Play adds the intro scene once, puts it on the TV and starts from the top", async () => {
    const { run, state } = await game("candlefair");
    await run({ type: "arrival.showIntro" });
    const s = await state();
    const sc = s.scenes.filter((x) => x.kind === "intro");
    expect(sc).toHaveLength(1);
    expect(s.live.sceneId).toBe(sc[0].id);
    expect(s.live.intro).toMatchObject({ step: 0 });
    await run({ type: "arrival.introGo", step: 4, paused: true });
    expect((await state()).live.intro).toMatchObject({ step: 4, paused: true });
    await run({ type: "arrival.showIntro" });
    const again = await state();
    expect(again.scenes.filter((x) => x.kind === "intro")).toHaveLength(1);
    expect(again.live.intro?.step).toBe(0);
    expect(again.live.intro?.paused).toBeUndefined();
  });

  it("stepping only works while the intro is on the TV", async () => {
    const { run } = await game("candlefair");
    await expect(run({ type: "arrival.introGo", step: 1, paused: false })).rejects.toThrow();
  });

  it("the TV gets the intro's look only while it's live", async () => {
    const { run, state } = await game("candlefair");
    expect(projectTv(await state(), 1).intro).toBeUndefined();
    await run({ type: "arrival.showIntro" });
    const s = await state();
    const tv = projectTv(s, 1);
    expect(tv.intro?.look).toEqual(arrivalLook(s));
    expect(tv.intro?.step).toBe(0);
    await run({ type: "arrival.showTable" });
    expect(projectTv(await state(), 1).intro).toBeUndefined();
  });

  it("is a screen on the quick bar and in run sheets", async () => {
    const { state } = await game("candlefair");
    expect(resolveRef(await state(), "intro")).toMatchObject({ label: "The Arrival intro", group: "Screens" });
  });

  it("slides keep their wide TV picture, and a clip its length", async () => {
    const { run, state } = await game();
    await run({ type: "arrival.slides", slides: [{ id: "a", image: PIC, wide: WIDE, text: "Fog." }] });
    await run({ type: "arrival.clip", clip: { url: CLIP, kind: "video", bytes: 1000, seconds: 12.5 } });
    const a = (await state()).arrival!;
    expect(a.slides?.[0]).toEqual({ id: "a", image: PIC, wide: WIDE, text: "Fog." });
    expect(a.clip?.seconds).toBe(12.5);
  });
});

describe("where the TV intro is up to", () => {
  const boat = tvSteps({ title: "", captain: "Orsa Dell", intro: true, kind: "builtin" });

  it("the boat is every step of every panel, captain filled in", () => {
    expect(boat).toHaveLength(PANELS.reduce((n, p) => n + p.steps.length, 0));
    expect(boat[1].kind === "panel" && boat[1].lines[0]).toContain("Orsa Dell");
  });

  it("moves on by itself, holds on the last step, and stays put when paused", () => {
    const d0 = stepMs(boat[0])!;
    expect(introPos(boat, { step: 0, at: 0, paused: false }, d0 - 1)).toMatchObject({ i: 0 });
    expect(introPos(boat, { step: 0, at: 0, paused: false }, d0 + 5)).toMatchObject({ i: 1, t: 5 });
    expect(introPos(boat, { step: 0, at: 0, paused: false }, 10 * 60_000)).toMatchObject({ i: boat.length - 1, ended: true });
    expect(introPos(boat, { step: 3, at: 0, paused: true }, 10 * 60_000)).toMatchObject({ i: 3, ended: false });
  });

  it("a video of unknown length waits for the DM; one with a length moves on after it", () => {
    const look = { title: "", captain: "", intro: true, kind: "custom" as const, slides: [{ id: "a", text: "Then lights." }] };
    const unknown = tvSteps({ ...look, clip: { url: CLIP, kind: "video", bytes: 1 } });
    expect(introPos(unknown, { step: 0, at: 0, paused: false }, 10 * 60_000).i).toBe(0);
    const known = tvSteps({ ...look, clip: { url: CLIP, kind: "video", bytes: 1, seconds: 10 } });
    expect(introPos(known, { step: 0, at: 0, paused: false }, 11_000).i).toBe(1);
  });

  it("types the words out, line after line", () => {
    expect(shownChars(["*Ab*", "Cd"], 0)).toEqual([0, 0]);
    expect(shownChars(["*Ab*", "Cd"], 60_000)).toEqual([2, 2]);
  });
});

describe("the premade campaign's slides", () => {
  it("can be saved again with their built-in pictures (editing a line used to be refused)", async () => {
    const ok = { type: "arrival.slides", slides: [{ id: "a", image: "/art/marrowmere/intro-town-tall.jpg", wide: "/art/marrowmere/intro-town.jpg", text: "Then lights." }] };
    expect(parseClientCommand(DM, ok)).toMatchObject({ type: "arrival.slides" });
    expect(() => parseClientCommand(DM, { type: "arrival.slides", slides: [{ id: "a", image: "/art/../api/x.jpg", text: "x" }] })).toThrow();
    expect(() => parseClientCommand(DM, { type: "arrival.slides", slides: [{ id: "a", wide: "/elsewhere/x.jpg", text: "x" }] })).toThrow();
  });
});
