// The Arrival intro: private links, seat claiming, the DM's tab, The Table on the TV,
// and what a phone is (and isn't) sent.
import fs from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { execute } from "@/server/game";
import { createFileStore, type Store } from "@/server/store";
import { arrivalStatus, opensOnSeat, playerByToken, projectArrival } from "@/shared/arrival";
import { projectDm, projectPlayer, projectTv } from "@/shared/projection";
import { seedGame } from "@/shared/seed";
import type { GameState } from "@/shared/types";

vi.mock("next/headers", () => ({ headers: async () => new Headers({ host: "dnd.example.test" }) }));

const DM = { role: "dm" as const };
const G = "candlefair";
let store: Store;

beforeEach(async () => {
  process.env.DM_KEY = "the-real-dm-key";
  store = createFileStore(null);
  (globalThis as unknown as { __candlefairStore?: Store }).__candlefairStore = store;
  await store.overwrite(G, seedGame(G), []);
  await execute(store, G, DM, { type: "arrival.issueLinks" });
});

async function state(): Promise<GameState> {
  return (await store.read(G)).state!;
}
async function tokenOf(playerId: string) {
  return (await state()).players.find((p) => p.id === playerId)!.arrival!.token;
}

/** Call the /api/arrival route the way a phone does. */
async function phone(method: "GET" | "POST", token: string | null, body?: object) {
  const { GET, POST } = await import("../app/api/arrival/route");
  const url = `http://x/api/arrival?game=${G}${token ? `&t=${token}` : ""}`;
  const req = new Request(url, method === "POST" ? { method, body: JSON.stringify(body), headers: { "content-type": "application/json" } } : undefined);
  const res = await (method === "GET" ? GET(req) : POST(req));
  const text = await res.text();
  return { status: res.status, body: JSON.parse(text) as Record<string, unknown>, text };
}

describe("private links", () => {
  it("gives every seated player a unique link, and new players get one too", async () => {
    const s = await state();
    const tokens = s.players.map((p) => p.arrival?.token);
    expect(tokens.every((t) => t && /^[A-Za-z0-9]{10}$/.test(t))).toBe(true);
    expect(new Set(tokens).size).toBe(tokens.length);
    const r = await execute(store, G, DM, { type: "player.add", name: "Late Larkin" });
    expect((await state()).players.find((p) => p.id === r.playerId)!.arrival?.token).toBeTruthy();
  });

  it("a player's link stops working once they've left the table", async () => {
    const t = await tokenOf("p1");
    await execute(store, G, DM, { type: "player.archive", playerId: "p1", archived: true });
    expect(playerByToken(await state(), t)).toBeNull();
  });
});

describe("the personal link", () => {
  it("plays the intro on first open, then lands on the seat page once finished", async () => {
    const t = await tokenOf("p1");
    let v = (await phone("GET", t)).body as unknown as ReturnType<typeof projectArrival>;
    expect(v.me?.finished).toBe(false);
    expect(opensOnSeat(v.me, false)).toBe(false);

    await phone("POST", t, { type: "open" });
    expect(arrivalStatus((await state()).players[0])).toBe("opened");
    await phone("POST", t, { type: "finish" });
    v = (await phone("GET", t)).body as unknown as ReturnType<typeof projectArrival>;
    expect(v.me?.finished).toBe(true);
    // A new phone with nothing saved still opens on the seat.
    expect(opensOnSeat(v.me, false)).toBe(true);
  });

  it("claims a seat with a name and a line, and can change them until seats are locked", async () => {
    const t = await tokenOf("p2");
    const r = await phone("POST", t, { type: "claim", character: "  Brin   Ashcombe ", why: "Owed a man money." });
    expect(r.status).toBe(200);
    const p = (await state()).players.find((x) => x.id === "p2")!;
    expect(p.character).toBe("Brin Ashcombe");
    expect(p.arrival?.why).toBe("Owed a man money.");
    expect(arrivalStatus(p)).toBe("claimed");

    await phone("POST", t, { type: "claim", character: "Brin the Bold", why: "" });
    expect((await state()).players.find((x) => x.id === "p2")!.character).toBe("Brin the Bold");

    await execute(store, G, DM, { type: "arrival.settings", seatsLocked: true });
    const locked = await phone("POST", t, { type: "claim", character: "Someone else", why: "" });
    expect(locked.status).toBe(400);
    expect((await state()).players.find((x) => x.id === "p2")!.character).toBe("Brin the Bold");
  });

  it("'Decide later' claims the seat with no name; the seat shows their player name", async () => {
    const t = await tokenOf("p3");
    await phone("POST", t, { type: "claim", character: "", why: "" });
    const v = projectArrival(await state(), 1, t);
    expect(v.me?.claimed).toBe(true);
    expect(v.seats.find((s) => s.me)).toEqual({ name: "Player 3", lit: true, me: true });
  });

  it("Replay plays from panel 1 without unclaiming the seat", async () => {
    const t = await tokenOf("p1");
    await phone("POST", t, { type: "claim", character: "Wren", why: "" });
    // Replay is local to the phone. Going through the intro again only re-sends open and finish.
    await phone("POST", t, { type: "open" });
    await phone("POST", t, { type: "finish" });
    const p = (await state()).players[0];
    expect(arrivalStatus(p)).toBe("claimed");
    expect(p.character).toBe("Wren");
    // The intro always starts at panel 1 on Replay (nothing about position is stored on the server).
    expect(JSON.stringify(p.arrival)).not.toMatch(/panel|step/);
  });

  it("other seats show names only once claimed", async () => {
    await phone("POST", await tokenOf("p2"), { type: "claim", character: "Tobble", why: "secret reasons" });
    const v = projectArrival(await state(), 1, await tokenOf("p1"));
    expect(v.seats.map((s) => s.name)).toEqual([null, "Tobble", null, null]);
    // Nobody else's line, link or player name is sent.
    const json = JSON.stringify(v);
    expect(json).not.toContain("secret reasons");
    expect(json).not.toContain(await tokenOf("p2"));
    expect(json).not.toContain("Player 3");
  });
});

describe("the generic link", () => {
  it("can't claim a seat", async () => {
    const r = await phone("POST", null, { type: "claim", character: "Sneaky", why: "" });
    expect(r.status).toBe(403);
    const bad = await phone("POST", "notARealCode1", { type: "claim", character: "Sneaky", why: "" });
    expect(bad.status).toBe(403);
    expect((await state()).players.some((p) => p.character === "Sneaky" || p.arrival?.claimedAt)).toBe(false);
  });

  it("gets no seats and no player data", async () => {
    const r = await phone("GET", null);
    expect(r.body).toEqual({ version: expect.any(Number), me: null, seats: [], locked: false });
  });
});

describe("live updates", () => {
  it("a claim publishes a new version, and the DM view and the TV both show it", async () => {
    await execute(store, G, DM, { type: "arrival.showTable" });
    const seen: number[] = [];
    const off = store.subscribe(G, (v) => seen.push(v));
    await phone("POST", await tokenOf("p4"), { type: "claim", character: "Sister Wren", why: "" });
    off();
    const { state: s, version } = await store.read(G);
    expect(seen).toContain(version);

    const dm = projectDm(s!, version, []);
    expect(dm.state.players.find((p) => p.id === "p4")!.character).toBe("Sister Wren");
    expect(dm.state.players.find((p) => p.id === "p4")!.arrival?.claimedAt).toBeTruthy();

    const tv = projectTv(s!, version);
    expect(tv.table?.seats[3]).toEqual({ name: "Sister Wren", lit: true });
    // The corner QR codes are for everyone else.
    expect(tv.table?.qr.map((q) => q.name)).toEqual(["Player 1", "Player 2", "Player 3"]);
  });

  it("the TV only gets seats and links while The Table is on", async () => {
    const tv = projectTv(await state(), 1);
    expect(tv.table).toBeUndefined();
    expect(JSON.stringify(tv)).not.toContain(await tokenOf("p1"));
  });

  it("T (arrival.showTable) adds The Table to an older game that doesn't have it", async () => {
    const s = await state();
    s.scenes = s.scenes.filter((x) => x.kind !== "table");
    await store.overwrite(G, s, []);
    await execute(store, G, DM, { type: "arrival.showTable" });
    const after = await state();
    const table = after.scenes.find((x) => x.kind === "table")!;
    expect(after.live.sceneId).toBe(table.id);
  });
});

describe("reset", () => {
  it("returns a player to new: intro again, seat unclaimed, name and line cleared, same link", async () => {
    const t = await tokenOf("p1");
    await phone("POST", t, { type: "open" });
    await phone("POST", t, { type: "claim", character: "Wren", why: "Why not" });
    await execute(store, G, DM, { type: "arrival.reset", playerId: "p1" });
    const p = (await state()).players[0];
    expect(arrivalStatus(p)).toBe("new");
    expect(p.character).toBeUndefined();
    expect(p.arrival).toEqual({ token: t });
    const v = projectArrival(await state(), 1, t);
    expect(v.me).toMatchObject({ claimed: false, finished: false, character: "", why: "" });
    expect(opensOnSeat(v.me, false)).toBe(false);
  });
});

describe("players' other screens", () => {
  it("never get anyone's Arrival link", async () => {
    const s = await state();
    const json = JSON.stringify(projectPlayer(s, 1, "p1", []));
    for (const p of s.players) expect(json).not.toContain(p.arrival!.token);
  });
});

describe("link previews", () => {
  it("are the same for everyone and carry no player data", async () => {
    const { generateMetadata } = await import("../app/(arrival)/layout");
    const md = await generateMetadata();
    const json = JSON.stringify(md);
    expect(md.title).toBe("Tales from the Flickering Candle");
    expect(md.description).toBe("Four days out of Baldur’s Gate…");
    expect(json).toContain("/arrival/og.jpg");
    const s = await state();
    for (const p of s.players) {
      expect(json).not.toContain(p.name);
      expect(json).not.toContain(p.arrival!.token);
    }
    // The layout takes no route params, so it can't vary by player.
    expect(generateMetadata.length).toBe(0);
    expect(fs.existsSync(path.join(process.cwd(), "public/arrival/og.jpg"))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Words that must never reach a player's phone from this feature.

const FORBIDDEN = [/merchant/i, /sigil/i, /ledger/i, /\bsymbol\b/i];

/** Every source file the Arrival page pulls in, following imports from its route. */
function arrivalSources(): string[] {
  const root = process.cwd();
  const seen = new Set<string>();
  const resolve = (from: string, spec: string): string | null => {
    let base: string;
    if (spec.startsWith("@/")) base = path.join(root, "src", spec.slice(2));
    else if (spec.startsWith(".")) base = path.resolve(path.dirname(from), spec);
    else return null; // packages (React, Next) aren't ours
    for (const ext of ["", ".ts", ".tsx", "/index.ts", "/index.tsx"]) if (fs.existsSync(base + ext) && fs.statSync(base + ext).isFile()) return base + ext;
    return null;
  };
  const walk = (f: string) => {
    if (seen.has(f)) return;
    seen.add(f);
    const src = fs.readFileSync(f, "utf8");
    for (const m of src.matchAll(/(?:import|export)[^"']*?from\s*["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)|import\s+["']([^"']+)["']/g)) {
      if (/^(import|export)\s+type\b/.test(m[0])) continue; // erased at build time: never sent
      const r = resolve(f, m[1] ?? m[2] ?? m[3]);
      if (r && !/\.css$/.test(r)) walk(r);
      else if (r) seen.add(r);
    }
  };
  for (const f of ["app/(arrival)/layout.tsx", "app/(arrival)/arrive/page.tsx", "app/(arrival)/arrive/[code]/page.tsx"]) walk(path.join(root, f));
  return [...seen];
}

describe("nothing secret reaches a player's phone", () => {
  it("the Arrival page's own code and styles never mention them", () => {
    const files = arrivalSources();
    // Sanity: the walk found the intro itself.
    expect(files.some((f) => f.endsWith("arrival/content.ts"))).toBe(true);
    expect(files.some((f) => f.endsWith("arrival/Scenes.tsx"))).toBe(true);
    // The page must not pull in the main app (or its styles, which mention the ledger).
    expect(files.some((f) => /client\/(App|dm|tv|player)\b/.test(f) || f.endsWith("globals.css"))).toBe(false);
    for (const f of files) {
      const text = fs.readFileSync(f, "utf8");
      for (const re of FORBIDDEN) expect(re.test(text), `${path.relative(process.cwd(), f)} mentions ${re}`).toBe(false);
    }
  });

  it("the art it shows never mentions them", () => {
    const svg = fs.readFileSync(path.join(process.cwd(), "public/art/mags-wick.svg"), "utf8");
    for (const re of FORBIDDEN) expect(re.test(svg)).toBe(false);
  });

  it("nor does anything /api/arrival sends", async () => {
    const s = await state();
    // Put the forbidden words somewhere a sloppy projection might pick them up.
    s.players[1].name = "the merchant's ledger";
    s.players[1].dropIn = true;
    s.scenes.find((x) => x.id === "s-symbol")!.dmNote = "sigil";
    await store.overwrite(G, s, []);
    const t = await tokenOf("p1");
    for (const r of [await phone("GET", t), await phone("GET", null), await phone("POST", t, { type: "open" }), await phone("POST", t, { type: "claim", character: "Wren", why: "" })]) {
      for (const re of FORBIDDEN) expect(re.test(r.text), `${r.text} matches ${re}`).toBe(false);
    }
  });
});
