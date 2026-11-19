// The Worldbuilder: builder keys, drafts, review, suggestions and the audit log.
// Everything goes through the real request handler, as the Worker would send it.
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it } from "vitest";
import { handleApi } from "@/server/api";
import { sha256 } from "@/server/auth";
import { BUILDER_LIMITS, handleBuilder } from "@/server/builder";
import { execute, viewFor } from "@/server/game";
import { createMemoryStore, type MemoryStore } from "@/server/store";
import { seedGame } from "@/shared/seed";
import { draftToOp, type Draft } from "@/shared/builderInput";
import { projectPlayer, projectTv } from "@/shared/projection";
import { entriesOf, areaCounts } from "@/shared/discovery";
import { tablesOf } from "@/shared/tables";
import { Discovery } from "@/client/player/Discovery";
import { Pinned } from "@/client/scenes/Board";
import { DraftCard, DraftDetail, DraftRow, approveSet, foldDrafts, rejectSet, type ReviewDraft } from "@/client/dm/BuilderPanel";
import type { GameState } from "@/shared/types";

const GAME = "testcampaign";
const DM_KEY = "the-real-dm-key";
const DM = { role: "dm" as const };
let store: MemoryStore;

const base = "https://candlefair.test";

async function dm(path: string, body?: unknown) {
  const res = await handleApi(
    new Request(`${base}${path}${path.includes("?") ? "&" : "?"}game=${GAME}&player=DM`, {
      method: body === undefined ? "GET" : "POST",
      headers: { "x-candlefair-key": DM_KEY, "Content-Type": "application/json" },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    }),
    store,
  );
  return { status: res.status, data: (await res.json()) as Record<string, any>, res };
}

async function call(key: string, op: string, body: unknown = {}, extra: Record<string, string> = {}, now?: number) {
  const req = new Request(`${base}/api/builder/${op}?game=${GAME}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...extra },
    body: JSON.stringify(body),
  });
  const res = now === undefined ? await handleApi(req, store) : await handleBuilder(req, store, now);
  return { status: res.status, data: (await res.json()) as Record<string, any>, res };
}

async function newKey(label = "Claude Desktop laptop", days: number | null = 30, noSecrets = false): Promise<string> {
  const r = await dm("/api/builder-admin/key-create", { label, days, noSecrets });
  expect(r.status).toBe(200);
  return r.data.key as string;
}

async function state(): Promise<GameState> {
  return (await store.read(GAME)).state!;
}

const allViews = async () => {
  const g = await state();
  const { version } = await store.read(GAME);
  return JSON.stringify([projectTv(g, version), ...g.players.map((p) => projectPlayer(g, version, p.id, []))]);
};

let KEY: string;

beforeEach(async () => {
  store = createMemoryStore();
  await store.overwrite(GAME, seedGame(GAME), []);
  await store.setDmKeyHash(GAME, sha256(DM_KEY));
  KEY = await newKey();
  await dm("/api/builder-admin/enabled", { on: true });
});

describe("builder keys", () => {
  it("are shown once, recognisable, high-entropy, and stored only as a hash", async () => {
    expect(KEY).toMatch(/^cfb_testcampaign_[a-z0-9]{8}_[0-9a-f]{64}$/);
    const status = await dm("/api/builder-admin/status");
    expect(JSON.stringify(status.data)).not.toContain(KEY);
    expect(JSON.stringify(status.data)).not.toContain(sha256(KEY));
    expect(status.data.keys[0]).toMatchObject({ label: "Claude Desktop laptop", revokedAt: null });
    expect(store.builder.dump()).not.toContain(KEY);
    expect(store.builder.dump()).toContain(sha256(KEY));
  });

  it("start with builder access off in a new campaign", async () => {
    store = createMemoryStore();
    await store.overwrite(GAME, seedGame(GAME), []);
    await store.setDmKeyHash(GAME, sha256(DM_KEY));
    const k = await newKey();
    const r = await call(k, "get_overview");
    expect(r.status).toBe(403);
    expect(r.data.code).toBe("off");
  });

  it("stop working the moment they're revoked, expire, or builder access is turned off", async () => {
    expect((await call(KEY, "get_overview")).status).toBe(200);
    await dm("/api/builder-admin/enabled", { on: false });
    expect((await call(KEY, "get_overview")).data.code).toBe("off");
    await dm("/api/builder-admin/enabled", { on: true });
    expect((await call(KEY, "get_overview")).status).toBe(200);

    const id = (await dm("/api/builder-admin/status")).data.keys[0].id;
    await dm("/api/builder-admin/key-revoke", { id });
    const r = await call(KEY, "get_overview");
    expect(r.status).toBe(401);
    expect(r.data.code).toBe("revoked");

    const week = await newKey("Week key", 7);
    expect((await call(week, "get_overview", {}, {}, Date.now())).status).toBe(200);
    const late = await call(week, "get_overview", {}, {}, Date.now() + 8 * 86_400_000);
    expect(late.status).toBe(401);
    expect(late.data.code).toBe("expired");
  });

  it("refuse a wrong or made-up key, and count it as a guess", async () => {
    const wrong = KEY.slice(0, -4) + (KEY.endsWith("0000") ? "1111" : "0000");
    for (const k of [wrong, "cfb_testcampaign_abcdefgh_" + "0".repeat(64), "not-a-key", "cfb_nocampaign1_abcdefgh_" + "0".repeat(64)]) {
      const r = await call(k, "get_overview");
      expect(r.status).toBe(401);
      expect(r.res.headers.get("x-candlefair-miss")).toBe("1");
      expect(JSON.stringify(r.data)).not.toContain(k);
    }
  });

  it("can't be exchanged for the DM key or a player's, and never work on DM or player routes", async () => {
    for (const path of ["/api/view", "/api/export", "/api/builder-admin/status", "/api/builder-admin/review", "/api/snapshots"]) {
      const res = await handleApi(new Request(`${base}${path}?game=${GAME}&player=DM`, { headers: { Authorization: `Bearer ${KEY}` } }), store);
      expect(res.status, path).toBe(403);
    }
    for (const player of ["DM", "player1"]) {
      const res = await handleApi(
        new Request(`${base}/api/command?game=${GAME}&player=${player}`, { method: "POST", headers: { Authorization: `Bearer ${KEY}` }, body: JSON.stringify({ type: "money.adjust", playerId: "p1", amountCp: 100, note: "" }) }),
        store,
      );
      expect(res.status).toBe(403);
    }
  });

  it("are the only thing the builder door accepts: the DM key and player names are refused there", async () => {
    const asDm = await handleApi(new Request(`${base}/api/builder/get_overview?game=${GAME}`, { method: "POST", headers: { "x-candlefair-key": DM_KEY } }), store);
    expect(asDm.status).toBe(403);
    const both = await call(KEY, "get_overview", {}, { "x-candlefair-key": DM_KEY });
    expect(both.status).toBe(403);
    const player = await handleApi(new Request(`${base}/api/builder/get_overview?game=${GAME}&player=player1`, { method: "POST", headers: { Authorization: `Bearer ${KEY}` } }), store);
    expect(player.status).toBe(403);
  });

  it("aren't callable from a browser", async () => {
    expect((await call(KEY, "get_overview", {}, { Origin: "https://evil.example" })).status).toBe(403);
    expect((await call(KEY, "get_overview", {}, { "Sec-Fetch-Site": "cross-site" })).status).toBe(403);
    const get = await handleApi(new Request(`${base}/api/builder/get_overview?game=${GAME}`, { headers: { Authorization: `Bearer ${KEY}` } }), store);
    expect(get.status).toBe(405);
    expect(get.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });
});

describe("what the builder can never do", () => {
  const forbidden = [
    "entry.stage",
    "entry.factReveal",
    "reveal",
    "publish",
    "pin",
    "job.pin",
    "approve",
    "delete_entry",
    "entry.remove",
    "bank.grant",
    "fight.start",
    "renown",
    "renown.set",
    "session.start",
    "story.beatStatus",
    "vote.start",
    "settings",
    "keys",
    "key-create",
    "players",
    "get_player",
    "audit",
    "upload",
    "../api/command",
  ];
  it("every forbidden operation is a 403 and the game doesn't change", async () => {
    const before = JSON.stringify(await state());
    for (const op of forbidden) {
      const r = await call(KEY, op, { type: "bank.grant", playerId: "p1", amountCp: 100 });
      expect(r.status, op).toBe(403);
    }
    expect(JSON.stringify(await state())).toBe(before);
  });

  it("never reads player tokens, keys, real names, purses, the ledger or combat", async () => {
    await execute(store, GAME, { role: "system" }, { type: "system.autoLock", playerId: "p1", keyHash: sha256("p1-secret") });
    await execute(store, GAME, DM, { type: "money.adjust", playerId: "p2", amountCp: 123456, note: "Loot from the barrow" });
    await execute(store, GAME, DM, { type: "player.update", playerId: "p3", patch: { name: "Dana Realname", character: "Brin Ashcombe" } });
    const g = await state();
    const out: string[] = [];
    for (const op of ["get_overview", "list_characters", "list_threads", "list_beats", "search"]) out.push(JSON.stringify((await call(KEY, op)).data));
    for (const e of entriesOf(g).slice(0, 5)) out.push(JSON.stringify((await call(KEY, "get_entry", { id: e.id })).data));
    const all = out.join("\n");
    expect(all).not.toContain(sha256("p1-secret"));
    expect(all).not.toContain("Dana Realname");
    expect(all).not.toContain("Loot from the barrow");
    expect(all).not.toContain("123456");
    for (const p of g.players) {
      expect(all).not.toContain(`"${p.handle}"`);
      if (p.arrival?.token) expect(all).not.toContain(p.arrival.token);
    }
    expect(all).not.toContain(KEY);
  });

  it("never sees another key's drafts", async () => {
    const other = await newKey("Other laptop");
    const mine = await call(KEY, "create_entry", { kind: "person", name: "Odo Fenwick" });
    const r1 = await call(other, "update_my_draft", { draft_id: mine.data.draft_id, changes: { name: "Hijacked" } });
    expect(r1.status).toBe(404);
    expect(r1.data.code).toBe("not-yours");
    expect((await call(other, "withdraw_my_draft", { draft_id: mine.data.draft_id })).status).toBe(404);
    expect(JSON.stringify((await call(other, "list_my_drafts")).data)).not.toContain("Odo Fenwick");
  });
});

describe("drafts", () => {
  it("are stored outside the game: nothing changes until the DM approves", async () => {
    const before = await store.read(GAME);
    const r = await call(KEY, "create_entry", {
      kind: "person",
      name: "Wenna Thistlecrown",
      summary: "Keeps the lamp oil ledger",
      areas: ["Candlefair"],
      secret: "She is the merchant's niece",
      wants: "To leave town",
      knows: "Where the ferry key is",
      voice: "Whispers, always",
      facts: ["Hates the cold"],
    });
    expect(r.status).toBe(200);
    expect(r.data.draft_id).toMatch(/^bd_[a-z0-9]{12}$/);
    const after = await store.read(GAME);
    expect(after.version).toBe(before.version);
    expect(JSON.stringify(after.state)).not.toContain("Wenna");
    expect(store.published.length).toBe(0);
  });

  it("never appear in TV or player payloads, counters, search or links", async () => {
    const counts = JSON.stringify(areaCounts(await state()));
    await call(KEY, "create_entry", { kind: "place", name: "The Drowned Chapel", areas: ["Candlefair"], hint: "Bells under the water" });
    await call(KEY, "create_beat", { thread: (await state()).story!.threads[0].id, title: "The bells ring at midnight" });
    await call(KEY, "create_flyer", { board: "job", title: "Bell-ringer wanted", body: "Ask at the chapel" });
    const views = await allViews();
    for (const t of ["Drowned Chapel", "Bells under the water", "bells ring at midnight", "Bell-ringer"]) expect(views).not.toContain(t);
    expect(JSON.stringify(areaCounts(await state()))).toBe(counts);
  });

  it("approve as Hidden, DM-only, tagged with the key, and still never reach the TV or phones", async () => {
    const d = await call(KEY, "create_entry", { kind: "person", name: "Wenna Thistlecrown", secret: "Niece", facts: ["Hates the cold"], wants: "To leave town" });
    const ok = await dm("/api/builder-admin/approve", { ids: [d.data.draft_id] });
    expect(ok.status).toBe(200);
    const e = entriesOf(await state()).find((x) => x.name === "Wenna Thistlecrown")!;
    expect(e.stage).toBe("hidden");
    expect(e.wants).toBe("To leave town");
    expect(e.madeBy).toMatchObject({ label: "Claude Desktop laptop", draft: d.data.draft_id });
    expect(e.facts[0].revealedAt).toBeUndefined();
    expect(await allViews()).not.toContain("Wenna");
    // Even once found, the DM-only parts stay home.
    await execute(store, GAME, DM, { type: "entry.stage", entryId: e.id, stage: "found", announce: false });
    const views = await allViews();
    expect(views).toContain("Wenna");
    for (const t of ["To leave town", "Niece", "Claude Desktop laptop", "madeBy", "Hates the cold"]) expect(views).not.toContain(t);
    // The review queue shows it as approved, with what it became.
    const q = await dm("/api/builder-admin/review");
    expect(q.data.pending).toHaveLength(0);
    expect(q.data.reviewed[0]).toMatchObject({ status: "approved", resultId: e.id });
  });

  it("approving a fact or link brings its draft parent along, and approving twice never makes two", async () => {
    const person = await call(KEY, "create_entry", { kind: "person", name: "Odo Fenwick" });
    const place = await call(KEY, "create_entry", { kind: "place", name: "Fenwick Mill" });
    const fact = await call(KEY, "add_fact", { entry: person.data.draft_id, text: "Owns the mill" });
    const link = await call(KEY, "link_entries", { a: person.data.draft_id, b: place.data.draft_id });
    expect([fact.status, link.status]).toEqual([200, 200]);
    await dm("/api/builder-admin/approve", { ids: [fact.data.draft_id, link.data.draft_id] });
    const g = await state();
    const odo = entriesOf(g).find((e) => e.name === "Odo Fenwick")!;
    const mill = entriesOf(g).find((e) => e.name === "Fenwick Mill")!;
    expect(odo.facts.map((f) => f.text)).toEqual(["Owns the mill"]);
    expect(odo.links).toEqual([mill.id]);

    // The same ops again (a retry after a crash) change nothing.
    const drafts = (await store.builder.list("draft")).map((r) => JSON.parse(r.body) as Draft);
    const again = await execute(store, GAME, { role: "system" }, { type: "system.builderApply", ops: drafts.map((x) => draftToOp(x, "hidden")) });
    expect(entriesOf(again.state).filter((e) => e.name === "Odo Fenwick")).toHaveLength(1);
    expect(entriesOf(again.state).find((e) => e.name === "Odo Fenwick")!.facts).toHaveLength(1);
    // And the queue won't approve an already-approved draft.
    expect((await dm("/api/builder-admin/approve", { ids: [person.data.draft_id] })).status).toBe(409);
  });

  it("a link or fact can be approved after the draft it hangs off was approved on its own", async () => {
    const person = await call(KEY, "create_entry", { kind: "person", name: "Osric Pell" });
    const place = await call(KEY, "create_entry", { kind: "place", name: "Pell's Chandlery" });
    const link = await call(KEY, "link_entries", { a: person.data.draft_id, b: place.data.draft_id });
    const fact = await call(KEY, "add_fact", { entry: person.data.draft_id, text: "Counts candles" });
    expect((await dm("/api/builder-admin/approve", { ids: [person.data.draft_id] })).status).toBe(200);
    // The queue now names the approved end as part of the game, not a draft.
    const q = await dm("/api/builder-admin/review");
    const l = q.data.pending.find((d: ReviewDraft) => d.id === link.data.draft_id) as ReviewDraft;
    expect(l.refs.map((r) => [r.name, r.draft])).toEqual([
      ["Osric Pell", false],
      ["Pell's Chandlery (draft)", true],
    ]);
    // The badge counts rows: the place (the link and fact sit on it or on what's approved).
    expect((await dm("/api/builder-admin/status")).data).toMatchObject({ pending: 3, rows: 2 });
    expect((await dm("/api/builder-admin/approve", { ids: [fact.data.draft_id] })).status).toBe(200);
    expect((await dm("/api/builder-admin/approve", { ids: [link.data.draft_id] })).status).toBe(200);
    const g = await state();
    const osric = entriesOf(g).find((e) => e.name === "Osric Pell")!;
    const shop = entriesOf(g).find((e) => e.name === "Pell's Chandlery")!;
    expect(osric.links).toEqual([shop.id]);
    expect(osric.facts.map((f) => f.text)).toEqual(["Counts candles"]);
  });

  it("the review page folds links and facts onto their draft, and approves or rejects them with it", async () => {
    const a = await call(KEY, "create_entry", { kind: "person", name: "Tobin Marsh" });
    const b = await call(KEY, "create_entry", { kind: "place", name: "The Ferry Landing" });
    const ab = await call(KEY, "link_entries", { a: a.data.draft_id, b: b.data.draft_id });
    const old = entriesOf(await state())[0];
    const aOld = await call(KEY, "link_entries", { a: a.data.draft_id, b: old.id });
    const f = await call(KEY, "add_fact", { entry: a.data.draft_id, text: "Won't cross after six bells" });
    const lone = await call(KEY, "add_fact", { entry: old.id, text: "Keeps a spare candle" });
    const pending = (await dm("/api/builder-admin/review")).data.pending as ReviewDraft[];
    const { top, hangers } = foldDrafts(pending);
    expect(top.map((d) => d.id).sort()).toEqual([a.data.draft_id, b.data.draft_id, lone.data.draft_id].sort());
    expect(hangers.get(a.data.draft_id)!.map((d) => d.id).sort()).toEqual([ab.data.draft_id, aOld.data.draft_id, f.data.draft_id].sort());
    expect(hangers.get(b.data.draft_id)!.map((d) => d.id)).toEqual([ab.data.draft_id]);
    // Approving Tobin takes his fact and his link to what's in the game, but not the link to the other draft.
    expect(approveSet(pending, [a.data.draft_id]).sort()).toEqual([a.data.draft_id, aOld.data.draft_id, f.data.draft_id].sort());
    expect(approveSet(pending, [a.data.draft_id, b.data.draft_id])).toContain(ab.data.draft_id);
    // Rejecting the landing takes the link to it.
    expect(rejectSet(pending, [b.data.draft_id]).sort()).toEqual([b.data.draft_id, ab.data.draft_id].sort());
    // Rows and the drawer render as plain text.
    for (const d of top) {
      const html = renderToStaticMarkup(createElement(DraftRow, { draft: d, hangers: hangers.get(d.id), busy: false, onOpen: () => {}, onApprove: () => {}, onReject: () => {} }));
      expect(html).toContain(d.kind === "fact" ? "Keeps a spare candle" : d.title);
    }
    const detail = renderToStaticMarkup(createElement(DraftDetail, { draft: top.find((d) => d.id === a.data.draft_id)!, hangers: hangers.get(a.data.draft_id), busy: false, onApprove: () => {}, onReject: () => {}, onEdit: () => {} }));
    expect(detail).toContain("Won&#x27;t cross after six bells");
    expect(detail).toContain("The Ferry Landing");
    expect(detail).toContain(old.name.replace(/'/g, "&#x27;"));
  });

  it("reject takes the drafts that hang off it along", async () => {
    const person = await call(KEY, "create_entry", { kind: "person", name: "Odo Fenwick" });
    const fact = await call(KEY, "add_fact", { entry: person.data.draft_id, text: "Owns the mill" });
    const r = await dm("/api/builder-admin/reject", { ids: [person.data.draft_id] });
    expect(r.data.rejected).toBe(2);
    expect((await dm("/api/builder-admin/approve", { ids: [fact.data.draft_id] })).status).toBe(409);
    expect(entriesOf(await state()).some((e) => e.name === "Odo Fenwick")).toBe(false);
  });

  it("can be edited or withdrawn by their own key while pending, and edited by the DM before approving", async () => {
    const d = await call(KEY, "create_entry", { kind: "person", name: "Odo Fenwick" });
    expect((await call(KEY, "update_my_draft", { draft_id: d.data.draft_id, changes: { summary: "The miller" } })).status).toBe(200);
    expect((await call(KEY, "update_my_draft", { draft_id: d.data.draft_id, changes: { kind: "dragon" } })).status).toBe(400);
    await dm("/api/builder-admin/review-edit", { id: d.data.draft_id, body: { kind: "person", name: "Odo Fenwick the Elder", summary: "The old miller" } });
    await dm("/api/builder-admin/approve", { ids: [d.data.draft_id] });
    expect(entriesOf(await state()).find((e) => e.name === "Odo Fenwick the Elder")?.summary).toBe("The old miller");
    expect((await call(KEY, "update_my_draft", { draft_id: d.data.draft_id, changes: { summary: "x" } })).status).toBe(409);

    const w = await call(KEY, "create_entry", { kind: "place", name: "Somewhere" });
    expect((await call(KEY, "withdraw_my_draft", { draft_id: w.data.draft_id })).data.withdrawn).toEqual([w.data.draft_id]);
    expect((await dm("/api/builder-admin/review")).data.pending).toHaveLength(0);
  });

  it("make threads, beats, flyers (unpinned), notices (not up), monster templates and random tables", async () => {
    const t = await call(KEY, "create_thread", { name: "The Drowned Bells", goal: "Find who rings them", kind: "side" });
    const b = await call(KEY, "create_beat", { thread: t.data.draft_id, title: "Bells at midnight", type: "clue", window: { from: "2026-12", to: "2027-01" } });
    const j = await call(KEY, "create_flyer", { board: "job", title: "Bell-ringer wanted", reward_gp: 25, renown: 1, dm_twists: "The ringer is a ghost" });
    const n = await call(KEY, "create_flyer", { board: "notice", title: "Chapel closed", body: "By order of the council" });
    const m = await call(KEY, "create_monster_template", { name: "Bell Wraith", ac: 13, hp: "4d8", attacks: [{ name: "Chill touch", bonus: 4, damage: "1d8+2" }], abilities: [{ name: "Toll", text: "DC 12 Wis", recharge: 5 }] });
    const rt = await call(KEY, "create_random_table", { name: "Chapel rumors", die: 6, kind: "rumor", rows: [{ text: "A" }, { text: "B" }, { text: "C" }] });
    const ids = [t, b, j, n, m, rt].map((x) => {
      expect(x.status, JSON.stringify(x.data)).toBe(200);
      return x.data.draft_id as string;
    });
    await dm("/api/builder-admin/approve", { ids });
    const g = await state();
    const thread = g.story!.threads.find((x) => x.name === "The Drowned Bells")!;
    expect(g.story!.beats.find((x) => x.title === "Bells at midnight")).toMatchObject({ threadId: thread.id, status: "planned" });
    expect(g.jobs!.find((x) => x.title === "Bell-ringer wanted")).toMatchObject({ pinned: false, reward: { kind: "each", cp: 2500 }, renown: 1 });
    expect(g.notices!.find((x) => x.title === "Chapel closed")!.up).toBe(false);
    expect(g.monsters!.find((x) => x.name === "Bell Wraith")!.madeBy?.label).toBe("Claude Desktop laptop");
    expect(tablesOf(g).find((x) => x.name === "Chapel rumors")!.rows).toEqual([
      { from: 1, to: 2, text: "A" },
      { from: 3, to: 4, text: "B" },
      { from: 5, to: 6, text: "C" },
    ]);
    const views = await allViews();
    for (const s of ["Drowned Bells", "Bell-ringer", "Chapel closed", "Bell Wraith", "Chapel rumors", "ghost"]) expect(views).not.toContain(s);
  });

  it("refuse ids it made up, and random tables that don't cover the die", async () => {
    expect((await call(KEY, "add_fact", { entry: "e-nobody", text: "x" })).data.code).toBe("bad-ref");
    expect((await call(KEY, "add_fact", { entry: "bd_aaaaaaaaaaaa", text: "x" })).data.code).toBe("bad-ref");
    expect((await call(KEY, "create_entry", { kind: "person", name: "Odo", id: "e1" })).status).toBe(400);
    const bad = await call(KEY, "create_random_table", { name: "Broken", die: 6, kind: "other", rows: [{ from: 1, to: 3, text: "A" }, { from: 3, to: 6, text: "B" }] });
    expect(bad.status).toBe(400);
    expect(bad.data.error).toContain("3 is in more than one row");
  });
});

describe("suggested changes", () => {
  it("never touch approved content until approved, show a diff, and refuse if the field changed since", async () => {
    const g = await state();
    const target = entriesOf(g)[0];
    const r = await call(KEY, "suggest_change", { target_id: target.id, field: "summary", value: "A new summary", reason: "Tighter" });
    expect(r.status).toBe(200);
    expect(entriesOf(await state())[0].summary).toBe(target.summary);
    const q = await dm("/api/builder-admin/review");
    expect(q.data.pending[0].diff).toMatchObject({ field: "summary", before: target.summary, after: "A new summary", stale: false });

    await dm("/api/builder-admin/approve", { ids: [r.data.draft_id] });
    expect(entriesOf(await state())[0].summary).toBe("A new summary");

    // A second suggestion, then the DM edits the same field by hand: approving it is refused.
    const s2 = await call(KEY, "suggest_change", { target_id: target.id, field: "summary", value: "Third version", reason: "Even tighter" });
    await execute(store, GAME, DM, { type: "entry.update", entryId: target.id, patch: { summary: "The DM's own words" } });
    expect((await dm("/api/builder-admin/review")).data.pending[0].diff.stale).toBe(true);
    const no = await dm("/api/builder-admin/approve", { ids: [s2.data.draft_id] });
    expect(no.status).toBe(400);
    expect(entriesOf(await state())[0].summary).toBe("The DM's own words");
  });

  it("can only change plain text fields", async () => {
    const e = entriesOf(await state())[0];
    for (const field of ["stage", "relation", "links", "id", "knownBy", "start"]) {
      const r = await call(KEY, "suggest_change", { target_id: e.id, field, value: "found", reason: "x" });
      expect(r.status, field).toBe(403);
    }
    const j = (await state()).jobs?.[0];
    if (j) for (const field of ["reward", "pinned", "status", "renown"]) expect((await call(KEY, "suggest_change", { target_id: j.id, field, value: 1, reason: "x" })).status).toBe(403);
  });
});

describe("limits", () => {
  it("rejects oversized fields and requests with a clear error", async () => {
    const long = await call(KEY, "create_entry", { kind: "person", name: "x".repeat(81) });
    expect(long.status).toBe(400);
    expect(long.data.error).toMatch(/name: Keep it under 80 characters/);
    const huge = await call(KEY, "create_entry", { kind: "person", name: "Big", summary: "x".repeat(70_000) });
    expect(huge.status).toBe(413);
  });

  it("caps writes per hour and per day for each key", async () => {
    const t0 = Date.UTC(2026, 10, 16, 10, 0, 0);
    for (let i = 0; i < BUILDER_LIMITS.writesPerHour; i++) {
      const r = await call(KEY, "create_entry", { kind: "place", name: `Place ${i}` }, {}, t0 + Math.floor(i / 15) * 61_000);
      expect(r.status, `write ${i}`).toBe(200);
    }
    const over = await call(KEY, "create_entry", { kind: "place", name: "One too many" }, {}, t0 + 5 * 61_000);
    expect(over.status).toBe(429);
    expect(over.data.error).toMatch(/this hour/);
  });

  it("caps pending drafts across the campaign", async () => {
    let made = 0;
    let t = Date.UTC(2026, 10, 16, 0, 0, 0);
    for (let k = 0; made < BUILDER_LIMITS.pending; k++) {
      const key = await newKey(`Key ${k}`, null);
      for (let i = 0; i < 50 && made < BUILDER_LIMITS.pending; i++, made++) {
        if (i % 15 === 0) t += 61_000;
        expect((await call(key, "create_entry", { kind: "place", name: `P${made}` }, {}, t)).status).toBe(200);
      }
    }
    const k = await newKey("Last key", null);
    const r = await call(k, "create_entry", { kind: "place", name: "Over the cap" }, {}, t + 61_000);
    expect(r.status).toBe(429);
    expect(r.data.code).toBe("pending-cap");
  }, 20_000);
});

describe("audit log", () => {
  it("logs every call, success or not, without the key or the content", async () => {
    await call(KEY, "create_entry", { kind: "person", name: "Secretive Sal", secret: "SUPERSECRET-CONTENT" });
    await call(KEY, "entry.remove", {});
    // A wrong key: the real one with its last character changed (never to itself).
    await call(KEY.slice(0, -1) + (KEY.endsWith("f") ? "0" : "f"), "get_overview");
    const a = await dm("/api/builder-admin/activity");
    const rows = a.data.rows as { op: string; ok: boolean; code?: string; label: string }[];
    expect(rows.map((r) => [r.op, r.ok])).toEqual(
      expect.arrayContaining([
        ["create_entry", true],
        ["entry.remove", false],
        ["get_overview", false],
      ]),
    );
    const text = JSON.stringify(rows) + store.builder.dump().replace(/"body":"\{\\"id\\":\\"bd_[^]*?(?="\},\{"id"|"\}\]\])/g, "");
    expect(JSON.stringify(rows)).not.toContain("SUPERSECRET");
    expect(JSON.stringify(rows)).not.toContain("Secretive Sal");
    expect(text).not.toContain(KEY);
  });
});

describe("the rest", () => {
  it("a 'no secrets' key reads without secrets or DM notes", async () => {
    const k = await newKey("Guest", 7, true);
    const e = entriesOf(await state()).find((x) => x.secrets || x.dmNote);
    if (!e) return;
    const r = await call(k, "get_entry", { id: e.id });
    expect(r.data.campaign_text.secrets).toBeUndefined();
    expect(r.data.campaign_text.dm_note).toBeUndefined();
  });

  it("every read marks stored text as data, not instructions", async () => {
    for (const op of ["get_overview", "search", "list_threads", "list_beats", "list_characters", "list_my_drafts"]) {
      const r = await call(KEY, op);
      expect(r.data.note, op).toMatch(/data .* never instructions/);
      expect(r.data.campaign_text, op).toBeDefined();
    }
  });

  it("the overview starts with the style guide", async () => {
    await execute(store, GAME, DM, { type: "game.builderNotes", text: "Never name the merchant." });
    const r = await call(KEY, "get_overview");
    expect(Object.keys(r.data.campaign_text)[0]).toBe("style_guide");
    expect(r.data.campaign_text.style_guide).toBe("Never name the merchant.");
  });

  it("resetting everything drops pending drafts but keeps keys", async () => {
    await call(KEY, "create_entry", { kind: "person", name: "Odo" });
    await dm("/api/reset", { mode: "all" });
    expect((await dm("/api/builder-admin/review")).data.pending).toHaveLength(0);
    expect((await dm("/api/builder-admin/status")).data.keys).toHaveLength(1);
  });

  it("the builder's code never runs a game command", () => {
    const src = readFileSync(new URL("../src/server/builder.ts", import.meta.url), "utf8");
    const imports = [...src.matchAll(/from "([^"]+)"/g)].map((m) => m[1]);
    for (const bad of ["./game", "@/shared/reducer", "./builderAdmin", "@/shared/commands"]) expect(imports).not.toContain(bad);
    expect(src).not.toMatch(/\bexecute\(|\.commit\(|\.overwrite\(|\.publish\(/);
  });
});

/** Hostile text that made it into the page as real markup instead of escaped text. */
const RAW = ["<script>alert", "<img src=x", '<iframe src="https://evil', "<svg onload", 'href="javascript', "<b onmouseover", 'onerror="', 'onload="'];
const unsafe = (html: string) => RAW.filter((r) => html.includes(r));

describe("hostile content", () => {
  const evil = {
    name: '<script>alert("x")</script><img src=x onerror=alert(1)>\u202Eevil',
    summary: '<a href="javascript:alert(1)">click</a> <iframe src="https://evil.example"></iframe>',
    fact: "<svg onload=alert(1)>\u0000\u0007",
  };

  it("is stored as plain text without control or direction-flipping characters", async () => {
    const d = await call(KEY, "create_entry", { kind: "person", name: evil.name, summary: evil.summary, facts: [evil.fact] });
    expect(d.status).toBe(200);
    await dm("/api/builder-admin/approve", { ids: [d.data.draft_id] });
    const e = entriesOf(await state()).find((x) => x.name.startsWith("<script>"))!;
    expect(e.name).not.toMatch(/[\u202E\u0000\u0007]/);
    expect(e.facts[0].text).toBe("<svg onload=alert(1)>");
  });

  it("renders escaped on phones, the TV board and the DM review queue", async () => {
    const d = await call(KEY, "create_entry", { kind: "person", name: evil.name, summary: evil.summary, facts: [evil.fact] });
    const j = await call(KEY, "create_flyer", { board: "job", title: "<b onmouseover=alert(1)>Job</b>", body: evil.summary });
    const q = await dm("/api/builder-admin/review");
    for (const draft of q.data.pending) {
      const html = renderToStaticMarkup(createElement(DraftCard, { draft, busy: false, onApprove: () => {}, onReject: () => {}, onEdit: () => {} }));
      expect(unsafe(html)).toEqual([]);
      const row = renderToStaticMarkup(createElement(DraftRow, { draft, busy: false, onOpen: () => {}, onApprove: () => {}, onReject: () => {} }));
      expect(unsafe(row)).toEqual([]);
    }
    await dm("/api/builder-admin/approve", { ids: [d.data.draft_id, j.data.draft_id] });
    const g = await state();
    const e = entriesOf(g).find((x) => x.name.startsWith("<script>"))!;
    await execute(store, GAME, DM, { type: "entry.stage", entryId: e.id, stage: "found", announce: false });
    await execute(store, GAME, DM, { type: "entry.factReveal", entryId: e.id, factId: e.facts[0].id, revealed: true });
    const job = (await state()).jobs!.find((x) => x.title.includes("Job"))!;
    await execute(store, GAME, DM, { type: "job.pin", jobId: job.id, pinned: true });

    const { version } = await store.read(GAME);
    const phone = projectPlayer(await state(), version, "p1", []);
    const seen = { isNew: () => false, markSeen: () => {}, newCount: 0 };
    const phoneHtml = renderToStaticMarkup(createElement(Discovery, { view: phone, send: async () => ({ ok: true }) as never, seen }));
    expect(phoneHtml).toContain("&lt;script&gt;");
    const tv = projectTv(await state(), version);
    const boardHtml = renderToStaticMarkup(createElement(Pinned, { board: { flyers: tv.flyers, jobs: tv.jobs, notices: tv.notices } }));
    for (const html of [phoneHtml, boardHtml]) expect(unsafe(html)).toEqual([]);
    expect(boardHtml).toContain("&lt;b onmouseover=alert(1)&gt;");
    expect((await viewFor(store, GAME, DM)).role).toBe("dm");
  });
});

describe("shop items for the builder", () => {
  it("are searchable and readable, with kind and price but nobody's purchases", async () => {
    const { builderSearch, builderGet } = await import("@/shared/builderView");
    const { syncShopEntries } = await import("@/shared/discovery");
    const g = syncShopEntries(seedGame("cf", "Candlefair", 0));
    const room = g.items.find((x) => x.kind === "recurring")!;
    g.rentals.push({ id: "r1", itemId: room.id, itemName: room.name, playerId: "p-secret", monthlyCp: room.priceCp, startedAt: 0, paidThrough: 0, active: true });
    const hits = builderSearch(g, { type: "shop_item", text: room.name }).hits;
    expect(hits.some((h) => h.id === room.id && h.snippet.includes("rent"))).toBe(true);
    const full = builderGet(g, room.id)!;
    expect(full).toMatchObject({ type: "shop_item", kind: "recurring", price_gp: room.priceCp / 100 });
    expect(JSON.stringify(full)).not.toContain("p-secret");
    const shop = entriesOf(g).find((e) => e.kind === "shop" && e.shopId === room.shopId)!;
    expect((builderGet(g, shop.id)!.items as { id: string }[]).some((x) => x.id === room.id)).toBe(true);
  });
});

describe("pictures", () => {
  const JPG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 16, 74, 70, 73, 70, 0, 1, 1, 1, 0, 72]);
  const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13]);
  async function upload(key: string, entry: string, bytes: Uint8Array, type = "image/jpeg", alt?: string) {
    const res = await handleApi(
      new Request(`${base}/api/builder/upload_picture?game=${GAME}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": type, "x-builder-entry": entry, ...(alt ? { "x-builder-alt": encodeURIComponent(alt) } : {}) },
        body: new Blob([bytes as Uint8Array<ArrayBuffer>]),
      }),
      store,
    );
    return { status: res.status, data: (await res.json()) as Record<string, any> };
  }

  it("upload to a pending person draft and land on the entry when it's approved, unshown", async () => {
    const person = await call(KEY, "create_entry", { kind: "person", name: "Corwin Fairweather" });
    const pic = await upload(KEY, person.data.draft_id, JPG, "image/jpeg", "A round man in velvet");
    expect(pic.status).toBe(200);
    // Nothing in the game yet, and the file is the campaign's own.
    expect(entriesOf(await state()).some((e) => e.name === "Corwin Fairweather")).toBe(false);
    const q = await dm("/api/builder-admin/review");
    const row = q.data.pending.find((d: ReviewDraft) => d.kind === "picture");
    expect(row.body.url).toMatch(new RegExp(`^/api/files/${GAME}/[0-9a-f]{24}\\.jpg$`));
    expect(store.files.has(row.body.url)).toBe(true);
    // The review page folds it onto the person, and approving the person takes it along.
    const { top, hangers } = foldDrafts(q.data.pending);
    expect(top.map((d) => d.kind)).toEqual(["entry"]);
    expect(hangers.get(person.data.draft_id)!.map((d) => d.kind)).toEqual(["picture"]);
    expect(approveSet(q.data.pending, [person.data.draft_id])).toContain(pic.data.draft_id);
    expect((await dm("/api/builder-admin/approve", { ids: approveSet(q.data.pending, [person.data.draft_id]) })).status).toBe(200);
    const g = await state();
    const e = entriesOf(g).find((x) => x.name === "Corwin Fairweather")!;
    const sc = g.scenes.find((x) => x.id === e.sceneId)!;
    expect(sc.art?.url).toBe(row.body.url);
    expect(sc.alt).toBe("A round man in velvet");
    expect(sc.shownAt).toBeUndefined();
    expect(await allViews()).not.toContain(row.body.url);
  });

  it("can go on an entry that's already in the game, and a new upload replaces the old pending one", async () => {
    const id = entriesOf(await state())[0].id;
    const a = await upload(KEY, id, JPG);
    const b = await upload(KEY, id, PNG, "image/png");
    expect(a.status).toBe(200);
    expect(b.status).toBe(200);
    const q = await dm("/api/builder-admin/review");
    const pics = q.data.pending.filter((d: ReviewDraft) => d.kind === "picture");
    expect(pics.map((d: ReviewDraft) => d.id)).toEqual([b.data.draft_id]);
    await dm("/api/builder-admin/approve", { ids: [b.data.draft_id] });
    const g = await state();
    const e = entriesOf(g).find((x) => x.id === id)!;
    expect(g.scenes.find((x) => x.id === e.sceneId)?.art?.url).toMatch(/\.png$/);
  });

  it("refuse other files, unknown entries, JSON, and edits; reject goes with the person", async () => {
    const person = await call(KEY, "create_entry", { kind: "person", name: "Edric" });
    expect((await upload(KEY, person.data.draft_id, new TextEncoder().encode("<svg onload=alert(1)>"), "image/jpeg")).status).toBe(415);
    expect((await upload(KEY, person.data.draft_id, JPG, "image/svg+xml")).status).toBe(415);
    expect((await upload(KEY, "nobody-here", JPG)).status).toBe(400);
    expect((await call(KEY, "upload_picture", { url: "https://evil.example/x.jpg" })).status).toBe(415);
    const pic = await upload(KEY, person.data.draft_id, JPG);
    expect((await call(KEY, "update_my_draft", { draft_id: pic.data.draft_id, changes: { url: "https://evil.example/x.jpg" } })).status).toBe(400);
    expect((await dm("/api/builder-admin/review-edit", { id: pic.data.draft_id, body: { url: "https://evil.example/x.jpg" } })).status).toBe(400);
    const r = await dm("/api/builder-admin/reject", { ids: [person.data.draft_id] });
    expect(r.data.rejected).toBe(2);
  });

  it("reads say whether an entry has a picture yet, without the picture", async () => {
    const id = entriesOf(await state()).find((e) => !e.sceneId)!.id;
    const before = await call(KEY, "get_entry", { id });
    expect(before.data.campaign_text.has_picture).toBe(false);
    const p = await upload(KEY, id, JPG);
    await dm("/api/builder-admin/approve", { ids: [p.data.draft_id] });
    const after = await call(KEY, "get_entry", { id });
    expect(after.data.campaign_text.has_picture).toBe(true);
    expect(JSON.stringify(after.data)).not.toContain("/api/files/");
    const hit = (await call(KEY, "search", { text: after.data.campaign_text.name })).data.campaign_text.find((h: { id: string }) => h.id === id);
    expect(hit.has_picture).toBe(true);
  });

  it("show in the review row and drawer", () => {
    const d: ReviewDraft = { id: "bd_aaaaaaaaaaaa", kind: "picture", label: "k", batch: "b", status: "pending", createdAt: 0, updatedAt: 0, keyId: "x", title: "Picture", refs: [{ id: "e1", name: "Mags", draft: false }], body: { entry: "e1", url: "/api/files/testcampaign/0123456789abcdef01234567.jpg", alt: "Mags", bytes: 10 } } as unknown as ReviewDraft;
    const row = renderToStaticMarkup(createElement(DraftRow, { draft: d, busy: false, onOpen() {}, onApprove() {}, onReject() {} }));
    expect(row).toContain("Picture of Mags");
    expect(row).toContain('src="/api/files/testcampaign/0123456789abcdef01234567.jpg"');
    const html = renderToStaticMarkup(createElement(DraftDetail, { draft: d, busy: false, onApprove() {}, onReject() {}, onEdit() {} }));
    expect(html).toContain("draft-picture");
    expect(html).not.toContain("Edit then approve");
  });
});
