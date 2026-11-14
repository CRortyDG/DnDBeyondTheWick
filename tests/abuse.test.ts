// Guessing and flooding: what the room marks as a miss, and the size caps.
import { describe, expect, it } from "vitest";
import { handleApi, MISS_HEADER } from "@/server/api";
import { newDmKey, sha256 } from "@/server/auth";
import { execute, HttpError, MAX_STATE_CHARS } from "@/server/game";
import { createMemoryStore } from "@/server/store";

function call(store: ReturnType<typeof createMemoryStore>, path: string, opts: { method?: string; key?: string; body?: string } = {}) {
  return handleApi(
    new Request(`http://room${path}`, {
      method: opts.method ?? "GET",
      headers: { ...(opts.key ? { "x-candlefair-key": opts.key } : {}), "content-type": "application/json" },
      ...(opts.body !== undefined ? { body: opts.body } : {}),
    }),
    store,
  );
}

async function campaign() {
  const store = createMemoryStore();
  const key = newDmKey();
  await call(store, "/internal/create?game=wick", { method: "POST", body: JSON.stringify({ dmKeyHash: sha256(key) }) });
  return { store, key };
}

const missed = (r: Response) => r.headers.get(MISS_HEADER) === "1";

describe("marking guesses", () => {
  it("marks every way of asking about a code that doesn't exist", async () => {
    const store = createMemoryStore();
    expect(missed(await call(store, "/api/hello?game=nope&player=sam", { method: "POST" }))).toBe(true);
    expect(missed(await call(store, "/api/version?game=nope"))).toBe(true);
    expect(missed(await call(store, "/api/view?game=nope&player=tv"))).toBe(true);
    expect(missed(await call(store, "/api/arrival?game=nope&t=abcdefghij"))).toBe(true);
    expect(missed(await call(store, "/api/command?game=nope&player=sam", { method: "POST", body: "{}" }))).toBe(true);
  });

  it("marks a wrong DM key, a wrong name lock and a dead Arrival link", async () => {
    const { store, key } = await campaign();
    expect(missed(await call(store, "/api/hello?game=wick&player=DM", { method: "POST", key: "guess" }))).toBe(true);
    expect(missed(await call(store, "/api/export?game=wick", { key: "guess" }))).toBe(true);
    await call(store, "/api/hello?game=wick&player=sam", { method: "POST", key: "sams-secret" });
    expect(missed(await call(store, "/api/hello?game=wick&player=sam", { method: "POST", key: "guess" }))).toBe(true);
    expect(missed(await call(store, "/api/arrival?game=wick&t=abcdefghij"))).toBe(true);
    // The real thing isn't a miss.
    expect(missed(await call(store, "/api/hello?game=wick&player=DM", { method: "POST", key }))).toBe(false);
    expect(missed(await call(store, "/api/hello?game=wick&player=sam", { method: "POST", key: "sams-secret" }))).toBe(false);
    expect(missed(await call(store, "/api/version?game=wick"))).toBe(false);
  });

  it("doesn't mark ordinary refusals", async () => {
    const { store } = await campaign();
    await call(store, "/api/hello?game=wick&player=sam", { method: "POST" });
    const r = await call(store, "/api/command?game=wick&player=sam", { method: "POST", body: JSON.stringify({ type: "nonsense" }) });
    expect(r.status).toBe(403);
    expect(missed(r)).toBe(false);
  });
});

describe("size caps", () => {
  it("refuses a huge command body before parsing it", async () => {
    const { store } = await campaign();
    await call(store, "/api/hello?game=wick&player=sam", { method: "POST" });
    const r = await call(store, "/api/command?game=wick&player=sam", { method: "POST", body: JSON.stringify({ type: "me.noteAdd", text: "x".repeat(200_000) }) });
    expect(r.status).toBe(413);
  });

  it("refuses growth past the cap, but still lets the game shrink", async () => {
    const { store } = await campaign();
    const { state } = await store.read("wick");
    // Pad the saved game to just under the cap.
    const pad = MAX_STATE_CHARS - JSON.stringify(state).length - 10_000;
    state!.notes = [{ id: "n-pad", sessionId: null, authorId: "dm", authorName: "DM", text: "x".repeat(pad), tags: [], createdAt: 0 }];
    await store.overwrite("wick", state!, []);
    const add = () => execute(store, "wick", { role: "dm" }, { type: "note.add", text: "y".repeat(1999) } as never);
    let saved = 0;
    let refused: unknown = null;
    for (let i = 0; i < 20 && !refused; i++) await add().then(() => saved++, (e) => (refused = e));
    expect(saved).toBeGreaterThan(0);
    expect(refused).toBeInstanceOf(HttpError);
    expect((refused as HttpError).status).toBe(413);
    await execute(store, "wick", { role: "dm" }, { type: "note.remove", noteId: "n-pad" });
    await add();
  });
});
