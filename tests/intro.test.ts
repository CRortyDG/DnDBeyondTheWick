// Arrival for any campaign: the DM's own intro (clip and slides), the choice of
// intro, presets carrying it, partial downloads for video, neutral starter lines.
import { describe, expect, it } from "vitest";
import { execute } from "@/server/game";
import { parseClientCommand } from "@/server/game";
import { parseRange, rangeBounds } from "@/server/range";
import { createMemoryStore } from "@/server/store";
import { arrivalLook, CLIP_GIF_MAX, introKind, projectArrival } from "@/shared/arrival";
import { blankGame, presetSetup } from "@/shared/presets";
import { seedGame } from "@/shared/seed";
import { STARTERS } from "@/shared/starters";

const DM = { role: "dm" as const };
const CLIP = "/api/files/my-game/0123456789abcdef01234567.mp4";
const PIC = "/api/files/my-game/abcdef0123456789abcdef01.webp";

async function game(kind: "blank" | "candlefair" = "blank") {
  const store = createMemoryStore();
  const id = kind === "blank" ? "my-game" : "candlefair";
  await store.overwrite(id, kind === "blank" ? blankGame(id, "Saltmarsh Nights") : seedGame(id), []);
  const run = (cmd: Parameters<typeof execute>[3]) => execute(store, id, DM, cmd);
  const state = async () => (await store.read(id)).state!;
  return { store, run, state };
}

describe("which intro plays", () => {
  it("Candlefair keeps the boat; a blank campaign has none", async () => {
    expect(introKind(await (await game("candlefair")).state())).toBe("builtin");
    const { state } = await game();
    const s = await state();
    expect(introKind(s)).toBe("none");
    expect(arrivalLook(s)).toMatchObject({ intro: false, title: "Saltmarsh Nights" });
    expect(arrivalLook(s).kind).toBeUndefined();
  });

  it("the old on/off switch still reads as the boat or nothing", async () => {
    const { run, state } = await game("candlefair");
    await run({ type: "arrival.settings", intro: false });
    expect(introKind(await state())).toBe("none");
    await run({ type: "arrival.settings", intro: true });
    expect(arrivalLook(await state()).kind).toBe("builtin");
  });

  it("a custom intro with nothing in it opens straight on the seat page", async () => {
    const { run, state } = await game();
    await run({ type: "arrival.settings", introKind: "custom" });
    expect(arrivalLook(await state()).intro).toBe(false);
    await run({ type: "arrival.slides", slides: [{ id: "a", text: "   " }] });
    expect(arrivalLook(await state()).intro).toBe(false);
  });

  it("a clip and slides make a custom intro the phone is sent", async () => {
    const { run, state } = await game();
    await run({ type: "arrival.clip", clip: { url: CLIP, kind: "video", bytes: 5_000_000, poster: PIC } });
    await run({ type: "arrival.slides", slides: [{ id: "a", text: " The fog lifts. ", image: PIC }, { id: "b", text: "" }, { id: "a", text: "dupe" }] });
    await run({ type: "arrival.settings", welcome: "  Welcome to   Saltmarsh. " });
    const s = await state();
    expect(s.arrival?.slides).toEqual([{ id: "a", text: "The fog lifts.", image: PIC }, { id: "b", text: "" }]);
    const look = projectArrival(s, 1, null).look;
    expect(look).toMatchObject({ intro: true, kind: "custom", clip: { url: CLIP, kind: "video" }, welcome: "Welcome to Saltmarsh." });
    // The empty slide isn't sent.
    expect(look.slides).toHaveLength(1);
  });

  it("uploading a clip switches the intro to your own; choosing none keeps the clip for later", async () => {
    const { run, state } = await game();
    await run({ type: "arrival.clip", clip: { url: CLIP, kind: "video", bytes: 1 } });
    expect(introKind(await state())).toBe("custom");
    await run({ type: "arrival.settings", introKind: "none" });
    const s = await state();
    expect(arrivalLook(s).intro).toBe(false);
    expect(arrivalLook(s).clip).toBeUndefined();
    expect(s.arrival?.clip?.url).toBe(CLIP);
  });

  it("refuses clips from anywhere else, and GIFs over the limit", async () => {
    const { run } = await game();
    expect(() => parseClientCommand(DM, { type: "arrival.clip", clip: { url: "https://evil.example/x.mp4", kind: "video", bytes: 1 } })).toThrow();
    expect(parseClientCommand(DM, { type: "arrival.clip", clip: { url: CLIP, kind: "video", bytes: 1 } })).toMatchObject({ type: "arrival.clip" });
    await expect(run({ type: "arrival.clip", clip: { url: CLIP.replace(".mp4", ".gif"), kind: "gif", bytes: CLIP_GIF_MAX + 1 } })).rejects.toThrow(/too big/);
  });
});

describe("presets", () => {
  it("carry the intro and welcome line, but not the seat lock", async () => {
    const { run, state } = await game();
    await run({ type: "arrival.clip", clip: { url: CLIP, kind: "video", bytes: 1 } });
    await run({ type: "arrival.settings", welcome: "Hello", seatsLocked: true });
    const p = presetSetup(await state());
    expect(p.arrival).toMatchObject({ clip: { url: CLIP }, welcome: "Hello", introKind: "custom" });
    expect(p.arrival?.seatsLocked).toBeUndefined();
  });
});

describe("video comes in pieces", () => {
  it("reads the ranges phones ask for", () => {
    expect(parseRange(null)).toBeNull();
    expect(parseRange("bytes=0-1")).toEqual({ offset: 0, length: 2 });
    expect(parseRange("bytes=100-")).toEqual({ offset: 100 });
    expect(parseRange("bytes=-500")).toEqual({ suffix: 500 });
    expect(parseRange("bytes=-")).toBeNull();
    expect(parseRange("bytes=0-1,5-6")).toBeNull();
  });
  it("works out the bytes sent, and misses past the end", () => {
    expect(rangeBounds({ offset: 0, length: 2 }, 1000)).toEqual({ start: 0, end: 1 });
    expect(rangeBounds({ offset: 900 }, 1000)).toEqual({ start: 900, end: 999 });
    expect(rangeBounds({ suffix: 500 }, 1000)).toEqual({ start: 500, end: 999 });
    expect(rangeBounds({ suffix: 5000 }, 1000)).toEqual({ start: 0, end: 999 });
    expect(rangeBounds({ offset: 990, length: 100 }, 1000)).toEqual({ start: 990, end: 999 });
    expect(rangeBounds({ offset: 1000 }, 1000)).toBeNull();
  });
});

describe("starter suggestions", () => {
  it("have a version without Candlefair's story in it", () => {
    for (const s of STARTERS) {
      expect(s.sampleWhyAnywhere).not.toMatch(/Baldur|Winterfest|north|boat|Candlefair/i);
      expect(s.sampleWhyAnywhere.length).toBeLessThanOrEqual(120);
    }
  });
});
