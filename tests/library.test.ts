// The shared preset library: opt-in listings, a preview, reports that never hide
// anything by themselves, the site owner's hide and take-down, and a versioned
// preset format so codes saved before it keep working.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ADMIN_HEADER, handleLibraryApi, REPORTER_HEADER } from "@/server/api";
import { Library, LIBRARY_MAX, MemoryKv, previewOf, publicListing, type Listing } from "@/server/library";
import { loadPreset, MemoryPresets, migratePreset, PRESET_FORMAT, savePreset, type PresetRecord } from "@/server/presets";
import { presetSetup } from "@/shared/presets";
import { seedGame } from "@/shared/seed";

const ADMIN = "an-admin-key-long-enough";

async function world() {
  const presets = new MemoryPresets();
  const kv = new MemoryKv();
  const wiped: string[] = [];
  const lib = new Library(kv, presets, async (prefix) => {
    wiped.push(prefix);
    for (const k of [...presets.files.keys()]) if (k.startsWith(prefix)) presets.files.delete(k);
  }, ADMIN);
  const setup = presetSetup(seedGame("src", "Src", 1));
  setup.episodes = [{ id: "e1", title: "The Lamplighter", beats: Array.from({ length: 15 }, (_, i) => ({ id: `b${i}`, title: `Beat ${i + 1}`, notes: "SECRET NOTES" }) as never) }];
  const saved = await savePreset(presets, setup, { name: "Candle night" });
  return { presets, kv, lib, saved, wiped };
}

const fields = { title: "The Flickering Candle", description: "A town fair, a missing lamplighter.", kind: "one-shot", levels: "1–3", length: "1 session" };

describe("publishing", () => {
  it("lists a preset with a preview of what's inside, and nothing private", async () => {
    const { lib, saved } = await world();
    const l = await lib.publish({ code: saved.code, token: saved.token, ...fields });
    expect(l.title).toBe("The Flickering Candle");
    expect(l.kind).toBe("one-shot");
    expect(l.counts.shops).toBeGreaterThan(0);
    expect(l.firstEpisode).toEqual({ title: "The Lamplighter", beats: Array.from({ length: 12 }, (_, i) => `Beat ${i + 1}`) });
    const text = JSON.stringify(await lib.browse());
    expect(text).not.toContain(saved.token);
    expect(text).not.toContain("ownerHash");
    expect(text).not.toContain("reporters");
    expect(text).not.toContain("SECRET NOTES");
    expect(await lib.browse()).toHaveLength(1);
  });

  it("only the device that saved the preset can list, refresh or unpublish it", async () => {
    const { lib, saved, presets } = await world();
    await expect(lib.publish({ code: saved.code, token: "nope", ...fields })).rejects.toMatchObject({ status: 403 });
    await expect(lib.publish({ code: "abcdefghjk", token: saved.token, ...fields })).rejects.toMatchObject({ status: 404 });
    await lib.publish({ code: saved.code, token: saved.token, ...fields });
    await expect(lib.unpublish(saved.code, "nope")).rejects.toMatchObject({ status: 403 });
    await expect(lib.refresh(saved.code, "nope")).rejects.toMatchObject({ status: 403 });
    await lib.unpublish(saved.code, saved.token);
    expect(await lib.browse()).toEqual([]);
    // The code still starts campaigns.
    expect((await loadPreset(presets, saved.code)).name).toBe("Candle night");
  });

  it("needs a title, and keeps a cover only if it's an uploaded picture (copied into the preset)", async () => {
    const { lib, saved, presets } = await world();
    await expect(lib.publish({ code: saved.code, token: saved.token, ...fields, title: "  " })).rejects.toMatchObject({ status: 400 });
    await expect(lib.publish({ code: saved.code, token: saved.token, ...fields, cover: "https://evil.example/x.png" })).rejects.toMatchObject({ status: 400 });
    presets.files.set("src/0123456789abcdef01234567.png", "png");
    const l = await lib.publish({ code: saved.code, token: saved.token, ...fields, cover: "/api/files/src/0123456789abcdef01234567.png" });
    expect(l.cover).toBe(`/api/files/p/${saved.code}/0123456789abcdef01234567.png`);
    expect(presets.files.has(`p/${saved.code}/0123456789abcdef01234567.png`)).toBe(true);
    // Updating without a cover field keeps it; null removes it.
    expect((await lib.publish({ code: saved.code, token: saved.token, ...fields })).cover).toBe(l.cover);
    expect((await lib.publish({ code: saved.code, token: saved.token, ...fields, cover: null })).cover).toBeUndefined();
  });

  it("Save over refreshes the listing's preview", async () => {
    const { lib, saved, presets } = await world();
    await lib.publish({ code: saved.code, token: saved.token, ...fields });
    const empty = presetSetup(seedGame("src", "Src", 1));
    empty.shops = [];
    empty.items = [];
    await savePreset(presets, empty, { name: "Candle night", code: saved.code, token: saved.token });
    expect((await lib.one(saved.code)).counts.shops).toBeGreaterThan(0);
    await lib.refresh(saved.code, saved.token);
    expect((await lib.one(saved.code)).counts.shops).toBe(0);
  });

  it("stops at the library's size limit", async () => {
    const { lib, kv, saved } = await world();
    for (let i = 0; i < LIBRARY_MAX; i++) await kv.put(`l:x${String(i).padStart(9, "0")}`, { code: "x" } as unknown as Listing);
    await expect(lib.publish({ code: saved.code, token: saved.token, ...fields })).rejects.toMatchObject({ status: 503 });
  });
});

describe("reports and the site owner", () => {
  it("records reports once per connection, and never hides a listing by itself", async () => {
    const { lib, saved } = await world();
    await lib.publish({ code: saved.code, token: saved.token, ...fields });
    for (let i = 0; i < 30; i++) await lib.report(saved.code, "spam", `10.0.0.${i % 3}`);
    const [l] = await lib.adminList(ADMIN);
    expect(l.reports).toHaveLength(3);
    expect(l.reporters).toEqual([]);
    expect(await lib.browse()).toHaveLength(1);
  });

  it("needs the admin key, and is switched off without one", async () => {
    const { presets, kv } = await world();
    const { lib } = await world();
    await expect(lib.adminList("wrong")).rejects.toMatchObject({ status: 403, code: "bad-key" });
    await expect(lib.adminList(null)).rejects.toMatchObject({ status: 403 });
    const off = new Library(kv, presets, async () => {}, undefined);
    await expect(off.adminList(ADMIN)).rejects.toMatchObject({ status: 404 });
    const short = new Library(kv, presets, async () => {}, "short");
    await expect(short.adminList("short")).rejects.toMatchObject({ status: 404 });
  });

  it("hide takes it off the library and it stays hidden through the author's updates; show brings it back", async () => {
    const { lib, saved } = await world();
    await lib.publish({ code: saved.code, token: saved.token, ...fields });
    await lib.adminAct(ADMIN, saved.code, "hide");
    expect(await lib.browse()).toEqual([]);
    await expect(lib.one(saved.code)).rejects.toMatchObject({ status: 404 });
    await lib.publish({ code: saved.code, token: saved.token, ...fields, title: "Try again" });
    expect(await lib.browse()).toEqual([]);
    expect((await lib.status(saved.code, saved.token)).hidden).toBe(true);
    // Unpublishing doesn't erase the owner's decision either.
    await lib.unpublish(saved.code, saved.token);
    await lib.publish({ code: saved.code, token: saved.token, ...fields });
    expect(await lib.browse()).toEqual([]);
    await lib.adminAct(ADMIN, saved.code, "show");
    expect(await lib.browse()).toHaveLength(1);
  });

  it("take down deletes the preset and its pictures, and it can't be listed again", async () => {
    const { lib, saved, presets, wiped } = await world();
    presets.files.set(`p/${saved.code}/0123456789abcdef01234567.png`, "png");
    await lib.publish({ code: saved.code, token: saved.token, ...fields });
    await lib.adminAct(ADMIN, saved.code, "takedown");
    expect(presets.records.has(saved.code)).toBe(false);
    expect(wiped).toEqual([`p/${saved.code}/`]);
    expect(presets.files.size).toBe(0);
    expect(await lib.browse()).toEqual([]);
    await expect(lib.adminAct(ADMIN, saved.code, "show")).rejects.toMatchObject({ status: 400 });
    const [l] = await lib.adminList(ADMIN);
    expect(l.takenDown).toBe(true);
  });

  it("the routes: admin key and reporter come from headers, unknown routes 404", async () => {
    const { lib, saved } = await world();
    const post = (path: string, body: unknown, headers: Record<string, string> = {}) =>
      handleLibraryApi(new Request(`http://w${path}`, { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body) }), lib);
    expect((await post("/api/library/publish", { code: saved.code, token: saved.token, ...fields })).status).toBe(200);
    expect((await post("/api/library/report", { code: saved.code, reason: "x" }, { [REPORTER_HEADER]: "1.2.3.4" })).status).toBe(200);
    const res = await handleLibraryApi(new Request("http://w/api/library"), lib);
    expect(((await res.json()) as { listings: unknown[] }).listings).toHaveLength(1);
    const bad = await handleLibraryApi(new Request("http://w/api/library/admin", { headers: { [ADMIN_HEADER]: "wrong" } }), lib);
    expect(bad.status).toBe(403);
    expect(bad.headers.get("x-candlefair-miss")).toBe("1");
    const good = await handleLibraryApi(new Request("http://w/api/library/admin", { headers: { [ADMIN_HEADER]: ADMIN } }), lib);
    expect(good.status).toBe(200);
    expect((await handleLibraryApi(new Request("http://w/api/library/nope"), lib)).status).toBe(404);
  });

  it("the public view drops moderation fields", () => {
    const setup = presetSetup(seedGame("a", "A", 1));
    const l: Listing = { code: "abcdefghjk", title: "t", description: "", kind: "campaign", levels: "", length: "", ...previewOf(setup), publishedAt: 1, updatedAt: 1, hidden: true, reports: [{ at: 1, reason: "x" }], reporters: ["h"] };
    expect(Object.keys(publicListing(l))).not.toEqual(expect.arrayContaining(["hidden"]));
    expect(publicListing(l)).not.toHaveProperty("reports");
  });
});

describe("the preset format", () => {
  it("new presets are saved with the current format number", async () => {
    const { presets, saved } = await world();
    expect(presets.records.get(saved.code)!.format).toBe(PRESET_FORMAT);
  });

  it("a preset saved before formats existed (format 1) still loads", async () => {
    const old = JSON.parse(readFileSync(new URL("./fixtures/preset-v1.json", import.meta.url), "utf8")) as PresetRecord;
    expect(old.format).toBeUndefined();
    const presets = new MemoryPresets();
    await presets.put("oldpreset1", old);
    const { setup, name } = await loadPreset(presets, "oldpreset1");
    expect(name).toBe("Old Candlefair preset");
    expect(setup.shops.length).toBeGreaterThan(0);
    expect(setup.players.every((p) => p.balanceCp === 0)).toBe(true);
    expect(migratePreset(old).format).toBe(PRESET_FORMAT);
  });

  it("refuses a preset from a newer version instead of guessing", () => {
    const old = JSON.parse(readFileSync(new URL("./fixtures/preset-v1.json", import.meta.url), "utf8")) as PresetRecord;
    expect(() => migratePreset({ ...old, format: PRESET_FORMAT + 1 })).toThrow();
  });
});
