/**
 * Replays one game night against `wrangler dev` (scripts/capacity/wrangler.jsonc)
 * and prints what Cloudflare would bill for it.
 *
 *   npx wrangler dev -c scripts/capacity/wrangler.jsonc --port 8799
 *   npx tsx scripts/capacity/sim.ts --base http://localhost:8799 --hours 4 [--warm] [--ledger 1200] [--wakes 6]
 *
 * The table: 1 DM laptop, 1 TV, 5 player phones. Each simulated hour:
 * 15 scene changes, 10 purse updates, 5 purchase requests (each approved by
 * the DM), 5 Chronicle notes, 2 map pin reveals, 1 image upload (shown on the
 * TV and loaded by all 7 screens), plus the background traffic the client
 * code makes: a "ping" every 25 s per screen, and each phone waking from
 * sleep `--wakes` times an hour (refetch the view; every other wake the
 * socket had died and reconnects).
 *
 * By default the room is evicted from memory before every event, as it is in
 * production when events are more than a few seconds apart and the room has
 * hibernated. --warm keeps it in memory (best case).
 *
 * It ends with a reconnect storm: all 7 sockets drop and come back at once.
 *
 * Talks only to the local dev server. Never point it at production.
 */

const arg = (name: string, d: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : d;
};
const has = (name: string) => process.argv.includes(`--${name}`);

const BASE = arg("base", "http://localhost:8799");
const HOURS = Number(arg("hours", "4"));
const WARM = has("warm");
const PRELOAD_LEDGER = Number(arg("ledger", "0"));
const WAKES = Number(arg("wakes", "6"));
const PINGS_PER_HOUR = 3600 / 25;
const PING_SAMPLE = Number(arg("ping-sample", "20")); // pings actually sent per screen, to show they never reach the room
const IMAGE_KB = Number(arg("image-kb", "800"));

if (!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(BASE)) {
  console.error("Refusing: --base must be a local wrangler dev address.");
  process.exit(1);
}

const KEY_HEADER = "x-candlefair-key";
type Who = { name: string; player: string; key: string | null };
type Client = Who & { ws: WebSocket | null; got: number; bytes: number; lastView: any };

const client = { workerRequests: 0, staticOrFiles: 0, imageGets: 0 };

async function api(path: string, who: Who | null, game: string, init: RequestInit = {}) {
  const q = new URLSearchParams({ game, ...(who ? { player: who.player } : {}) });
  client.workerRequests++;
  const r = await fetch(`${BASE}${path}?${q}`, {
    ...init,
    headers: { ...(typeof init.body === "string" ? { "Content-Type": "application/json" } : {}), ...(who?.key ? { [KEY_HEADER]: who.key } : {}), ...(init.headers as object) },
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`${path} ${r.status} ${JSON.stringify(data)}`);
  return data as any;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function connect(c: Client, game: string): Promise<void> {
  return new Promise((resolve, reject) => {
    client.workerRequests++;
    const ws = new WebSocket(`${BASE.replace("http", "ws")}/api/live?${new URLSearchParams({ game, player: c.player })}`);
    c.ws = ws;
    ws.onopen = () => {
      ws.send(JSON.stringify({ t: "auth", key: c.key }));
    };
    ws.onmessage = (ev) => {
      const s = String(ev.data);
      c.got++;
      c.bytes += s.length;
      if (s === "pong") return;
      const m = JSON.parse(s);
      if (m.t === "view") {
        c.lastView = m.view;
        resolve();
      } else if (m.t === "error") reject(new Error(m.error));
    };
    ws.onerror = () => reject(new Error("ws error"));
  });
}

async function metrics(game: string) {
  const [room, worker] = await Promise.all([fetch(`${BASE}/__metrics?game=${game}`).then((r) => r.json()), fetch(`${BASE}/__worker`).then((r) => r.json())]);
  return { room: room as any, worker: worker as Record<string, number> };
}
const evict = (game: string) => (WARM ? Promise.resolve() : fetch(`${BASE}/__evict?game=${game}`, { method: "POST" }).then(() => undefined));

/** A plausible PNG-sized blob (content is random; the server only checks the type). */
function fakeImage(kb: number) {
  const b = new Uint8Array(kb * 1024);
  for (let i = 0; i < b.length; i += 65536) crypto.getRandomValues(b.subarray(i, Math.min(b.length, i + 65536)));
  b.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return new Blob([b], { type: "image/png" });
}

async function main() {
  await fetch(`${BASE}/__worker/reset`, { method: "POST" });
  const created = await api("/api/create", null, "", { method: "POST", body: JSON.stringify({ name: "Capacity test" }) });
  const game: string = created.game;
  const dm: Client = { name: "DM", player: "DM", key: created.key, ws: null, got: 0, bytes: 0, lastView: null };
  const tv: Client = { name: "TV", player: "TV", key: null, ws: null, got: 0, bytes: 0, lastView: null };
  const players: Client[] = ["player1", "player2", "player3", "player4", "Ed"].map((n) => ({ name: n, player: n, key: null, ws: null, got: 0, bytes: 0, lastView: null }));
  const all = [dm, tv, ...players];

  // Page loads: hello for everyone (the seed has 4 players; the 5th joins by name), then sockets.
  for (const c of all) await api("/api/hello", c, game, { method: "POST" });

  if (PRELOAD_LEDGER > 0) {
    // A long-running campaign: restore a backup with this many ledger entries.
    const exp = await api("/api/export", dm, game);
    const pid = exp.state.players[0].id;
    exp.ledger = Array.from({ length: PRELOAD_LEDGER }, (_, i) => ({ id: `L${i}`, at: Date.now() - i * 1000, playerId: pid, playerName: "Ana", amountCp: 100, kind: "grant", note: "Old session loot, a line of typical length", sessionId: null }));
    await api("/api/import", dm, game, { method: "POST", body: JSON.stringify(exp) });
  }

  for (const c of all) await connect(c, game);
  await sleep(200);

  const dmView = () => dm.lastView.state;
  const pids = () => (dmView().players as any[]).filter((p) => !p.archived).map((p) => p.id as string);

  // Start counting from here: setup above is a one-off per campaign.
  await fetch(`${BASE}/__metrics/reset?game=${game}`, { method: "POST" });
  await fetch(`${BASE}/__worker/reset`, { method: "POST" });
  client.workerRequests = 0;
  const gotBefore = all.reduce((n, c) => n + c.got, 0);
  const bytesBefore = all.reduce((n, c) => n + c.bytes, 0);

  const counts: Record<string, number> = {};
  const cmd = async (who: Client, body: object) => {
    await evict(game);
    counts[(body as any).type] = (counts[(body as any).type] ?? 0) + 1;
    return api("/api/command", who, game, { method: "POST", body: JSON.stringify(body) });
  };

  await cmd(dm, { type: "session.start", title: "Capacity night" });
  // Give everyone some gold so purchases go through.
  await cmd(dm, { type: "money.payAll", amountCp: 50_000, note: "Starting purse", playerIds: pids() });
  await cmd(dm, { type: "shop.visibility", shopId: "general", visibility: "all", quiet: true });

  const sceneIds = (dmView().scenes as any[]).filter((s) => s.kind !== "stinger").map((s) => s.id as string);
  const mapScene = (dmView().scenes as any[]).find((s) => s.id === "s-map");
  const pinIds: string[] = (mapScene?.map?.pins ?? []).map((p: any) => p.id);
  let sceneI = 0;
  let pinI = 0;
  let uploads = 0;
  let imageBytes = 0;
  const imageUrls: string[] = [];

  for (let h = 0; h < HOURS; h++) {
    // Build this hour's events, then shuffle them into a plausible order.
    const ev: (() => Promise<unknown>)[] = [];
    for (let i = 0; i < 15; i++) ev.push(() => cmd(dm, { type: "scene.show", sceneId: sceneIds[sceneI++ % sceneIds.length] }));
    for (let i = 0; i < 10; i++) ev.push(() => cmd(dm, { type: "money.adjust", playerId: pids()[i % 5], amountCp: (i % 2 ? -1 : 1) * 250, note: "Purse update" }));
    for (let i = 0; i < 5; i++)
      ev.push(async () => {
        const p = players[i % 5];
        await cmd(p, { type: "me.requestBuy", itemId: "g-oil", qty: 1, note: "" });
        await sleep(30);
        const req = (dmView().requests as any[]).filter((r) => r.status === "pending" || !r.status).at(-1);
        if (req) await cmd(dm, { type: "request.approve", requestId: req.id });
      });
    for (let i = 0; i < 5; i++) ev.push(() => cmd(players[i % 5], { type: "me.noteAdd", text: "Mags let slip that the chef was at the docks the night of the fire. Ask Artum.", tags: ["Mags Wick"] }));
    for (let i = 0; i < 2; i++) ev.push(() => cmd(dm, { type: "pin.discover", sceneId: "s-map", pinId: pinIds[pinI++ % pinIds.length], discovered: true, announce: true }));
    ev.push(async () => {
      await evict(game);
      const form = new FormData();
      const img = fakeImage(IMAGE_KB);
      imageBytes += img.size;
      form.append("file", img, "map.png");
      client.workerRequests++;
      const r = await fetch(`${BASE}/api/upload?game=${game}`, { method: "POST", body: form, headers: { [KEY_HEADER]: dm.key! } });
      const { url } = (await r.json()) as { url: string };
      uploads++;
      imageUrls.push(url);
      await cmd(dm, { type: "scene.update", sceneId: "s-extra", patch: { art: { url } } });
      await cmd(dm, { type: "scene.show", sceneId: "s-extra" });
      // Every screen loads the new image once (browsers cache it after that).
      for (let i = 0; i < all.length; i++) {
        client.workerRequests++;
        client.imageGets++;
        await fetch(`${BASE}${url}`).then((x) => x.arrayBuffer());
      }
    });
    // Phones waking from sleep: refetch the view; every other wake the socket had died.
    for (const p of players)
      for (let i = 0; i < WAKES; i++)
        ev.push(async () => {
          await evict(game);
          if (i % 2 === 0) {
            p.ws?.close();
            await connect(p, game);
          }
          await api("/api/view", p, game);
        });
    // Fisher-Yates with a fixed seed so runs are comparable.
    let seed = 42 + h;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
    for (let i = ev.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [ev[i], ev[j]] = [ev[j], ev[i]];
    }
    for (const e of ev) {
      await e();
      await sleep(15);
    }
    // A sample of keep-alive pings per screen (the real client sends 144 an hour).
    for (const c of all) for (let i = 0; i < Math.min(PING_SAMPLE, PINGS_PER_HOUR); i++) c.ws?.send("ping");
    await sleep(200);
    process.stderr.write(`hour ${h + 1} done\n`);
  }
  await cmd(dm, { type: "session.end" });
  await sleep(300);

  const night = await metrics(game);
  const pongs = all.reduce((n, c) => n + c.got, 0) - gotBefore;

  // Reconnect storm: all 7 screens lose Wi-Fi, then come back together.
  await fetch(`${BASE}/__metrics/reset?game=${game}`, { method: "POST" });
  await fetch(`${BASE}/__worker/reset`, { method: "POST" });
  await evict(game);
  for (const c of all) c.ws?.close();
  await sleep(100);
  const t0 = performance.now();
  // What useGame does on "online": reopen the socket and refetch the view.
  await Promise.all(all.map(async (c) => Promise.all([connect(c, game), api("/api/view", c, game)])));
  const stormMs = performance.now() - t0;
  const storm = await metrics(game);

  for (const c of all) c.ws?.close();

  const wall: number[] = night.room.eventWallMs;
  const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
  const doReq = sum(Object.values(night.room.doRequests as Record<string, number>));
  const out = {
    game,
    mode: WARM ? "warm (room stays in memory)" : "cold (room evicted before every event, as after hibernation)",
    hours: HOURS,
    preloadedLedgerRows: PRELOAD_LEDGER,
    commands: counts,
    worker: { requests: sum(Object.values(night.worker)), byPath: night.worker },
    durableObject: {
      httpAndUpgradeRequests: doReq,
      byPath: night.room.doRequests,
      wsMessagesThatReachedRoom: night.room.wsMessagesIn,
      billedRequests: doReq + Math.ceil(night.room.wsMessagesIn / 20),
      eventWallMsTotal: Math.round(sum(wall)),
      eventWallMsAvg: +(sum(wall) / wall.length).toFixed(2),
      eventWallMsMax: Math.round(Math.max(...wall)),
      rowsRead: night.room.rowsRead,
      rowsWritten: night.room.rowsWritten,
      coldLoads: night.room.coldLoads,
      databaseBytes: night.room.databaseSize,
      stateJsonBytes: night.room.stateBytes,
      ledgerRows: night.room.ledgerRows,
    },
    r2: { classA_puts: uploads, classB_gets: client.imageGets, storedBytes: imageBytes },
    websocket: {
      pingsSentSample: all.length * HOURS * Math.min(PING_SAMPLE, PINGS_PER_HOUR),
      pingsRealClientWouldSend: all.length * HOURS * PINGS_PER_HOUR,
      messagesPushedToScreens: pongs,
      bytesPushedToScreens: all.reduce((n, c) => n + c.bytes, 0) - bytesBefore,
    },
    reconnectStorm: {
      ms: Math.round(stormMs),
      workerRequests: sum(Object.values(storm.worker)),
      doRequests: storm.room.doRequests,
      wsMessagesIn: storm.room.wsMessagesIn,
      rowsRead: storm.room.rowsRead,
      rowsWritten: storm.room.rowsWritten,
      coldLoads: storm.room.coldLoads,
    },
  };
  console.log(JSON.stringify(out, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
