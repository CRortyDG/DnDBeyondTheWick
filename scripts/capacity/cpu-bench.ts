/**
 * CPU cost of one command inside a campaign's room, measured in Node (same V8
 * engine as Workers). wrangler dev doesn't report CPU time, so this runs the
 * real API code (src/server/api.ts) against the in-memory store and times:
 *
 *   - one /api/command (read + hydrate, reducer, change check, save)
 *   - the push that follows: one filtered view per open screen (DM, TV, 5 phones),
 *     which is what GameRoom.publish() does after every change
 *   - one /api/view
 *
 * at today's typical document size and at bigger ones (a long campaign with
 * many Chronicle notes and a long ledger), to show where the cost grows.
 *
 *   npx tsx scripts/capacity/cpu-bench.ts
 */
import { handleApi } from "@/server/api";
import { actorOf, identify, projectFor } from "@/server/game";
import { createMemoryStore } from "@/server/store";
import { sha256 } from "@/server/auth";
import type { LedgerEntry } from "@/shared/types";

const KEY = "bench-dm-key";
const H = { "x-candlefair-key": KEY, "Content-Type": "application/json" };

function cpuMs<T>(fn: () => Promise<T>): Promise<[number, T]> {
  const t = process.cpuUsage();
  return fn().then((r) => {
    const d = process.cpuUsage(t);
    return [(d.user + d.system) / 1000, r];
  });
}

async function scenario(label: string, notes: number, ledgerRows: number) {
  const store = createMemoryStore();
  const game = "bench";
  const call = (path: string, player: string, body?: object) =>
    handleApi(new Request(`https://x${path}?game=${game}&player=${player}`, { method: body ? "POST" : "GET", headers: H, body: body ? JSON.stringify(body) : undefined }), store);
  await handleApi(new Request(`https://x/internal/create?game=${game}`, { method: "POST", body: JSON.stringify({ dmKeyHash: sha256(KEY) }) }), store);
  await call("/api/command", "DM", { type: "session.start", title: "Bench" });

  // Grow the document: Chronicle notes of typical length, and a long ledger.
  const { state } = await store.read(game);
  const now = Date.now();
  for (let i = 0; i < notes; i++)
    (state!.notes ??= []).push({ id: `n${i}`, sessionId: null, authorId: "dm", authorName: "DM", text: "Mags let slip that the chef was at the docks the night of the fire. Ask Artum about the ledger and the missing crates. ".repeat(2), tags: ["Mags Wick", "docks"], starred: false, hidden: false, createdAt: now });
  const ledger: LedgerEntry[] = Array.from({ length: ledgerRows }, (_, i) => ({ id: `L${i}`, at: now - i, playerId: "p1", playerName: "Player 1", amountCp: 100, note: "Old session loot, a line of typical length", kind: "grant", sessionId: null }));
  await store.overwrite(game, state!, ledger);
  const docBytes = JSON.stringify((await store.read(game)).state).length;

  const screens = ["DM", "TV", "player1", "player2", "player3", "player4", "player1"];
  const pushAll = async () => {
    for (const s of screens) {
      const { state: st, version } = await store.read(game);
      const who = identify(st, s, s === "DM" ? KEY : null, await store.dmKeyHash(game));
      JSON.stringify(await projectFor(st!, version, actorOf(who), () => store.ledger(game)));
    }
  };

  // warm up the JIT
  for (let i = 0; i < 20; i++) {
    await call("/api/command", "DM", { type: "scene.show", sceneId: i % 2 ? "s-map" : "s-board" });
    await pushAll();
  }
  const N = 40;
  let cmd = 0, push = 0, view = 0;
  for (let i = 0; i < N; i++) {
    const [a] = await cpuMs(() => call("/api/command", "DM", { type: "money.adjust", playerId: "p1", amountCp: i % 2 ? 250 : -250, note: "Purse update" }));
    const [b] = await cpuMs(pushAll);
    const [c] = await cpuMs(() => call("/api/view", "player1").then((r) => r.text()));
    cmd += a; push += b; view += c;
  }
  console.log(
    [label.padEnd(34), `${(docBytes / 1024).toFixed(0).padStart(6)} KB doc`, `${String(ledgerRows).padStart(6)} ledger`, `command ${(cmd / N).toFixed(2).padStart(6)} ms`, `push x7 ${(push / N).toFixed(2).padStart(6)} ms`, `view ${(view / N).toFixed(2).padStart(6)} ms`].join("  "),
  );
}

console.log("CPU per event inside the room (Node, this machine). Durable Objects allow 30 s per event; the 10 ms Worker limit doesn't apply here.\n");
await scenario("New campaign (seed)", 0, 0);
await scenario("One night in (typical, from sim)", 20, 65);
await scenario("~20 nights in", 400, 1300);
await scenario("~100 nights in", 2000, 6500);
await scenario("Notes at the 5,000 cap", 5000, 6500);
