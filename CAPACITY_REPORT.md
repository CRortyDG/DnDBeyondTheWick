# Capacity report: how many games fit on Cloudflare's free tier

_Audit date: 2026-11-14, against `main` at f429be1. Read-only: no app code changed, nothing deployed, no production data touched. Numbers come from a local `wrangler dev` simulation (scripts in [`scripts/capacity/`](scripts/capacity/)) plus Cloudflare's published limits, checked the same day._

## The one-minute version

- **On the free tier this can host about 240 sessions per day, and all of them can run at the same time. The first limit hit is Workers requests (100,000 a day).** A "session" is 1 DM laptop, 1 TV and 5 phones for 4 hours.
- **That drops to about 12 sessions per day once campaigns have played ~20 nights.** Every time a room wakes up it re-reads the campaign's whole money ledger from SQLite, so "rows read" (5 million a day) runs out first for established campaigns. After ~100 nights it's 2 or 3 sessions a day.
- **The bigger near-term risk is abuse, not growth.** There's no rate limit on `/api/*`, so one person looping `curl` for a few minutes can use up the whole day's 100,000 requests and take every table offline until 00:00 UTC (6 pm Central). Uploads have no per-campaign quota, and since R2 bills rather than stops, that's the one cost with no ceiling.
- **To go to 10× (about 2,400 sessions a day), pay for Workers Paid: about $16/month at 1,000 sessions a day and $36–42/month at 2,400.** Most of that is R2 image storage. The free tier can't reach 10×, because one saved row per change caps it at about 320 sessions a day. First, though, do the fixes that cost nothing: a rate limit on `/api/*` (effort S), a per-campaign upload quota (S), and stop re-reading the whole ledger on wake (M). That last one lifts established campaigns from 12 sessions a day back to about 240.

| | Sessions per UTC day (free) | First limit |
| --- | --- | --- |
| New campaign | **~240** | Workers requests |
| ~20 nights in (1,300 ledger rows) | **~12** | Durable Object SQLite rows read |
| ~100 nights in (6,500 ledger rows) | **~2–3** | Durable Object SQLite rows read |

---

## 1. How it actually works

### Cloudflare products in use (from [`wrangler.jsonc`](wrangler.jsonc))

| Product | What for |
| --- | --- |
| **Workers** (`candlefair`, [`worker/index.ts`](worker/index.ts)) | The front door. It routes every `/api/*` call and the live socket to the campaign's room, handles image upload and download, and rewrites the `/arrive` page's link-preview tags. |
| **Static assets** (`ASSETS`, Vite build) | The app itself. It's free and unlimited, except for `/api/*`, `/arrive` and `/arrive/*`, which are `run_worker_first` and so count as Worker requests. |
| **Durable Objects, SQLite backend** (`GameRoom`, [`worker/room.ts`](worker/room.ts)) | One object per campaign, named by the campaign code. It holds the game document and the ledger, runs every command, and pushes live views. |
| **R2** (`FILES`, bucket `candlefair-files`) | Images the DM uploads, stored as `<campaign>/<random>.<ext>`. |
| **Workers Rate Limiting** (`CREATE_LIMIT`) | 5 new campaigns per minute per IP. Only `/api/create` uses it. |
| **Durable Object alarms** | A monthly cleanup check per campaign. |
| **Observability** (Workers Logs) | Enabled. |
| KV, D1, Queues, cron triggers | **Not used.** |

### Real-time sync

- It uses **WebSockets with the Hibernation API.** `GameRoom.fetch` calls `this.ctx.acceptWebSocket(server)`, not `ws.accept()`, so a room with open sockets and no traffic is "eligible for hibernation" and isn't billed for duration.
- **Writes go over HTTP, not the socket.** Each change is a `POST /api/command`, which costs 1 Worker request plus 1 Durable Object request. The room then pushes every open screen its own filtered view over the socket. Outgoing messages are free.
- **There's no polling loop.** The fallbacks:
  - **Keep-alive pings:** each screen sends the text `"ping"` every 25 s. The room answers with `setWebSocketAutoResponse` without waking up. The simulation confirmed that none of the 560 pings reached the room's code.
  - **Coming back:** when a tab becomes visible again or the device comes back online, the client refetches `GET /api/view`, and reopens the socket if it had died.
  - **Missed push:** if a command's push hasn't arrived within 1.5 s, the client fetches `/api/view` once. This never fired in the simulation.
  - **Dead socket:** a socket that's been silent for 75 s is replaced. Reconnects back off from 1 s up to 15 s. The Arrival page retries every 3–5 s with no backoff.
- **Rooms run independently.** Each room is its own Durable Object (`idFromName(game)`), and nothing is shared between campaigns: no global object and no global counter. Campaigns run in parallel. The only shared things are the account's daily allowances.
- **Hard caps:**
  - In the code: seats per table (default 6, at most 12; extra people "knock"), 20 knocks kept, 5,000 Chronicle notes, 25 MB per upload, 5 campaign creations per minute per IP.
  - In the code, there's no cap on connections per room, rooms per account or uploads per room.
  - From Cloudflare: about 1,000 requests a second per object (soft limit), unlimited objects, 10 GB per object, 8 MB per SQLite row, and 5 GB of Durable Object storage per account on Free. The docs give no per-object WebSocket limit ("thousands of clients").

### What's stored where

| Data | Where | Shape |
| --- | --- | --- |
| Game state: scenes, players, shops, items, Chronicle notes, run sheets, jobs, renown | Room SQLite, table `doc` | **One row holding the whole game as JSON**: 37 KB for a new campaign, 45 KB after one night, ~190 KB after ~20 nights. |
| Money ledger | Room SQLite, table `ledger` | One row per entry, append-only. About 65 new rows per night in the model. |
| DM key | Room SQLite, `doc.dm_key_hash` | A sha256 hash. |
| Images | R2 `candlefair-files/<campaign>/…` | Served by the Worker with `Cache-Control: immutable`. |
| Built-in art, app code | Static assets | Free. |

**What's re-read or re-written on every message:**

- **Every change rewrites the whole game document as a single row** (`INSERT … ON CONFLICT DO UPDATE`), plus one row per new ledger entry. That's billed as 1 row however big the JSON is, but it costs CPU in proportion to its size.
- **Every push to every screen re-hydrates the document.** `publish()` calls `push()` for each socket, and each `push()` calls `read()`, which deep-copies and migrates the document again. That's 7 copies per change, which costs CPU but no rows.
- **Every time the room wakes from hibernation, it re-reads the document (1 row) and the *entire* ledger** (`SELECT entry FROM ledger ORDER BY seq`). The ledger is needed for the DM's and players' views. This is the row-read problem behind the "12 sessions a day" figure.
- The DM's view sends the whole state plus the whole ledger on every change. That's free (outgoing), but it was 17 MB of pushes per night after one night and 57 MB at 20 nights. That's a problem for phone data and Wi-Fi, not for the bill.

### Rooms nobody uses

- **Real campaigns are cleaned up.** Creating a campaign sets a monthly alarm, and a campaign nobody has *saved to* for 180 days (with no open sockets) is deleted along with its R2 images.
- **Not every room gets cleaned up.** Any request to `/api/*?game=<anything>` creates a room, because the constructor runs `CREATE TABLE`. That leaves about 20 KB of SQLite (measured locally) that **never gets an alarm and is never deleted.** See risk 4.
- A TV left connected keeps its campaign from being deleted. That's probably fine.

---

## 2. One session, measured

**Method:** I ran a local simulation on `wrangler dev` with a *metered* copy of the real code ([`scripts/capacity/worker.ts`](scripts/capacity/worker.ts) subclasses the real `GameRoom` and counts requests, socket messages and SQLite cursor row counts). [`sim.ts`](scripts/capacity/sim.ts) opens 7 real WebSocket clients (DM, TV, 5 phones) and replays 4 hours at speed.

Each hour it plays 15 scene changes, 10 purse updates, 5 purchase requests (each one also approved by the DM, so 10 commands), 5 Chronicle notes, 2 pin reveals, and 1 image upload (about 800 KB, then shown on the TV, which costs 2 commands plus 7 downloads). On top of that, each phone wakes 6 times an hour: it refetches its view, and on every other wake its socket had died and reconnects.

By default the room is **evicted before every event**, which mimics hibernation, since events in this model are about 47 s apart. Raw outputs are in [`scripts/capacity/results/`](scripts/capacity/results/).

Worker CPU can't be measured in `wrangler dev`, so I measured the room's CPU separately in Node, on the same V8 engine ([`cpu-bench.ts`](scripts/capacity/cpu-bench.ts)).

| Metric | Per session (new campaign) | Notes |
| --- | --- | --- |
| Worker requests (excluding static assets) | **~412** | 180 commands, 120 view refetches, 60 socket (re)connects, 4 uploads, 28 image downloads, plus ~20 first page loads. With 12 phone wakes an hour instead of 6, it's ~590. |
| Worker CPU per request | **≈1 ms or less** (estimated, not measured) | The front door only routes. The exception is `/api/upload`: Node needs 2.5 ms to parse 1 MB of multipart data, 4.7 ms for 5 MB and **29 ms for 25 MB**. workerd's native parser should be faster, but a 25 MB upload could hit the 10 ms Free limit (error 1102). |
| Room CPU per event (Durable Object, 30 s limit) | 1.7 ms per command plus 5 ms to push to 7 screens (new). 5 + 28 ms at ~20 nights. **59 + 252 ms** with notes at their cap. | Not billed by CPU. It feeds into duration. |
| Durable Object requests (as billed) | **~387** | 364 HTTP or upgrade requests plus 60 incoming socket messages ÷ 20, plus page loads. If Cloudflare bills auto-answered pings as incoming messages (the docs don't say), add up to 202, for **~590**. |
| Duration with hibernation | **~0.3–1.6 GB-s** | Measured locally: 424 events, 2.2 s of wall time, which is 0.27 GB-s at 128 MB. 1.6 GB-s assumes a conservative 30 ms per event in production. |
| Duration without hibernation | **~1,800 GB-s** | 4 h × 0.125 GB. That would cap Free at **7 sessions a day**. The app does use hibernation. |
| SQLite rows read | **~11,000** (new), **~395,000** (~20 nights), **~2 million** (~100 nights) | Almost all of it is the ledger being re-read on each of ~300 wake-ups. If the room stayed in memory (`--warm`), it would be 240. |
| SQLite rows written | **~312** | 1 document row per change, plus ledger entries, plus a hello per page load. |
| Durable Object storage per room | **80 KB** after one night, **315 KB** at ~20 nights, **20 KB** for an empty stray room | `ctx.storage.sql.databaseSize`. |
| R2 Class A (writes) | **4** per session | One per upload. The monthly cleanup does one `list` per expired campaign. Deletes are free. |
| R2 Class B (reads) | **~28** per session | Each screen loads each image once. Image responses come from the Worker, so they aren't CDN-cached. |
| R2 storage | **~3–4 MB** per session (at 1 upload an hour of ~1 MB) | It grows for as long as the campaign is active. Images are only deleted 180 days after a campaign goes idle. |
| KV / D1 | Not used | |
| Reconnect storm (7 screens drop and return together) | 14 Worker requests, 14 Durable Object requests, 7 auth messages, 1 cold load (66 rows read new, 1,366 at 20 nights), 0 writes. **79 ms** locally. | A storm is cheap. Retries during an outage never reach Cloudflare, and the client's backoff (1→15 s plus jitter) spreads them out. A reconnect doesn't re-run hello, so it writes nothing. |

**Other heavy actions in the code:**

- A full page reload (Safari often kills background tabs) runs `/api/hello`, which *writes* `lastSeenAt` and pushes to every screen.
- The DM's notes in Run Game autosave 800 ms after typing stops, the map dot-size slider saves after 250 ms, and pin drags save after 450 ms. A DM who types a lot of notes can add dozens of commands a night.
- Reveal-only art (`/api/art/*`) is `no-store`, so every screen fetches it each time it's shown: 1 Worker request plus 1 Durable Object request each.

---

## 3. Capacity

### Current limits (checked 2026-11-14)

- **Workers Free:**
  - 100,000 requests a day, resetting at 00:00 UTC.
  - 10 ms CPU per HTTP request, 50 subrequests and 128 MB of memory.
  - Static assets are free and unlimited.
  - **No general per-second or per-minute limit is listed.** The "1,000 requests a minute" figure you'd seen isn't on the current limits page.
  - Over the daily limit you get error 1027, and `run_worker_first` routes get **429**.
- **Durable Objects Free (SQLite only):**
  - 100,000 requests a day (incoming socket messages count 20:1; outgoing messages and protocol pings are free).
  - 13,000 GB-s of duration a day, 5 million rows read a day, 100,000 rows written a day.
  - 5 GB of storage in total.
  - Over a limit, "further operations of that type will fail with an error". When storage is full, writes fail with `SQLITE_FULL` but reads and deletes still work.
- **R2:**
  - Free each month: 10 GB-month of storage, 1 million Class A and 10 million Class B operations, and free egress.
  - Past that it **bills** at $0.015/GB-month, $4.50 per million Class A and $0.36 per million Class B. It needs an R2 subscription.
- **Workers Paid:**
  - $5/month minimum, with 10 million requests and 30 million CPU-ms included, then $0.30 per million requests and $0.02 per million CPU-ms.
  - Durable Objects include 1 million requests (then $0.15 per million) and 400,000 GB-s (then $12.50 per million).
  - SQLite includes 25 billion rows read (then $0.001 per million), 50 million rows written (then $1.00 per million) and 5 GB-month of storage (then $0.20/GB-month).

### 1. Sessions per day on Free

From [`model.ts`](scripts/capacity/model.ts), each limit divided by one session's usage:

| Limit | New campaign | ~20 nights in |
| --- | --- | --- |
| Workers requests (100k) | **242** | 242 |
| Durable Object requests (100k) | 258 (169 if pings are billed) | 258 (169) |
| SQLite rows written (100k) | 320 | 320 |
| SQLite rows read (5M) | 451 | **12** |
| Durable Object duration (13,000 GB-s) | 8,176 | 8,176 |
| Durable Object storage (5 GB, total not daily) | ~60,000 campaigns at 80 KB | ~16,000 at 315 KB |

**Answer:** about 240 a day, and Workers requests run out first. Real tables are a mix, though. Every established campaign reads about 35 times as many rows as a new one, so a few long-running groups can use up rows read for everyone. If pings turn out to be billed (see risk 8), Durable Object requests run out first, at about 170 a day.

### 2. Sessions at the same time

Nothing limits concurrency at these sizes. Each table is its own object (the per-object soft limit is 1,000 requests a second; a table averages under 0.03), the Workers docs list no burst limit, and nothing in the code funnels traffic through one place. The daily totals are the only ceiling:

- **10 tables at once: fine.** That's 4% of a day's budget.
- **50 at once: fine** for new campaigns (21%). For established ones (~20 nights), 50 tables would read about 20 million rows against a 5 million allowance, so **they'd fail partway through the evening.**
- **200 at once:** that's 82,000 of the day's 100,000 Worker requests. It only works if they're mostly new campaigns *and* nobody else plays that UTC day. With established campaigns it fails about an hour in.
- Creating campaigns is capped at 5 a minute per IP, per Cloudflare location. A game store setting up 20 tables from one Wi-Fi network would need 4 minutes.

### 3. Per month

Only R2 is monthly.

- **Class A:** 1 million a month is ~250,000 sessions.
- **Class B:** 10 million a month is ~350,000 sessions.
- **Storage is the R2 number that matters.** 10 GB holds about **3,000 session-nights of images** (at ~3.3 MB a night). Images stay as long as the campaign is active, plus 180 days. So about 500 sessions a month stays inside free R2 storage indefinitely.
- At the free-tier maximum (240 a day, ~7,200 a month), the 10 GB is full in about two weeks. After that R2 bills about $0.35/month for each month of images kept. It's cheap, but it **doesn't stop**.

### 4. Timing: Friday and Saturday nights against the 00:00 UTC reset

00:00 UTC is **6 pm CST** (November–March) and **7 pm CDT** (March–November). That's 7 pm EST or 4 pm PST in winter.

- **It mostly helps.** A typical 7–11 pm game in Central, Mountain or Pacific time starts *after* the reset, so it gets a fresh day. Friday-night games use Saturday's UTC budget and Saturday-night games use Sunday's, so the two peak nights don't compete.
- **It also hurts.**
  - Friday-night US games share Saturday's UTC day with Saturday-afternoon US games and Saturday-evening games in Europe.
  - If the budget runs out at 10 pm Central, nothing comes back until **6 pm the next day**, so a dead Friday night stays dead.
  - Eastern-time games that start at 6 pm EST cross the reset partway through. That rescues them if the budget was already gone, but they're also the first to start using the new day's budget.

### 5. What breaks at the limit

| Limit hit | What happens | Does a running game die? | What players see |
| --- | --- | --- | --- |
| Workers requests (100k a day) | Every `/api/*` call and `/arrive` returns Cloudflare's 429 / 1027 response. The app's pages still load, because they're static assets. | **Partly.** Open sockets stay up, since they talk to the room directly, but **no change can be saved**: commands are HTTP. Phones that sleep can't reconnect and show "offline". New players can't join. | The DM sees "Request failed (429)". A TV whose socket drops shows its offline badge after 4 s. **No useful explanation is shown.** |
| Durable Object requests | The Worker's call into the room throws, and the app returns 500 "Something went wrong on the server." | Same as above: saves and refetches fail, and existing sockets keep their last view. | "Something went wrong on the server." |
| SQLite rows written | `sql.exec` throws on save, and commands return 500. | Views still load but **nothing saves**: money, purchases and notes all fail. | "Something went wrong on the server." |
| SQLite rows read | Waking a room fails, so pushes send `{t:"error", status:500}`, **which the client ignores**, and `/api/view` returns 500. | Screens freeze on their last view. | Mostly nothing: the screens look live but stop updating. |
| Durable Object storage (5 GB total) | `SQLITE_FULL` on writes, for **every** campaign, until something is deleted. It doesn't reset daily. | Saves fail everywhere. | "Something went wrong on the server." |
| R2 monthly free usage | **It bills.** Nothing stops. | No. | Nothing. Only your invoice changes. |
| Worker CPU 10 ms (one request) | Error 1102 for that request. In practice only a very large upload risks it. | No, only that upload fails. | "Upload failed." |

### 6. Cost on Workers Paid

From `model.ts`, assuming images are kept about 6 months. These are per month:

| Sessions a day | New campaigns | ~20 nights in | Largest items |
| --- | --- | --- | --- |
| 10 | **$5.00** | $5.00 | Everything is within the included usage. |
| 100 | **$5.88** | $5.88 | R2 storage $0.73 (59 GB held), Durable Object requests $0.15 |
| 1,000 | **$16.25** ($17.15 if pings are billed) | $16.25 | R2 storage $8.70 (590 GB), Durable Object requests $1.65, Worker requests $0.90 |
| 2,400 (10× Free) | **$36** | $40 | R2 storage $21 (1.4 TB), Worker requests $6, Durable Object requests $4, rows read $3.41 |

- **Costs with no cap:**
  - **R2 storage and operations**, on both Free and Paid, since R2 bills past its free tier.
  - **On Paid, everything**: Workers, Durable Objects and R2 have no hard spending limit. I found no spending cap in the docs I read, so set a billing notification.
- **Upload abuse is the scary one** (risk 3).
- Workers Paid also removes the 10 ms CPU limit (the default becomes 30 s) and lifts Durable Object storage from 5 GB to unlimited (5 GB-month included).

---

## 4. Risks and fixes (recommendations only)

These are ranked by how much they affect capacity or cost. Effort: **S** is about a day or less, **M** is a few days, **L** is a week or more.

1. **No rate limit on `/api/*`, so one person can take everyone offline. Effort: S.** All campaigns share one daily allowance of 100,000 Worker requests. Anyone, with or without a room code, can loop `GET /api/version?game=x`, and at a few hundred requests a second the day is gone in minutes. *Fix:* rate-limit `/api/*` per IP, for example 120 a minute with the existing Rate Limiting binding (it's approximate and per location). If your Cloudflare plan includes a WAF rate-limiting rule, add one in front of the Worker too, because requests blocked there never reach the Worker (I didn't check the Free plan's allowance for these).
2. **The whole ledger is re-read on every wake-up, so established campaigns use up rows read. Effort: M.** Rows read grow with campaign age: 11,000 a night for a new campaign, 395,000 at ~20 nights, ~2 million at ~100. *Fix:* don't load the full ledger to build views. Read the last N entries with `ORDER BY seq DESC LIMIT`, keep each player's recent entries in a small indexed column, and have the DM's Bank tab fetch older history on demand. That brings it back to about 1–200 rows per wake. The DM view's full-ledger push (57 MB a night at 20 nights) shrinks too.
3. **Uploads have no quota, which is the one uncapped bill. Effort: S.** Anyone can create a campaign (5 a minute per IP), become its DM and upload 25 MB images with no per-campaign limit. On Free, the Worker request cap still allows up to ~2.5 TB a day into R2. Each day of that adds about $37/month of storage, which persists for 180+ days. On Paid there's no ceiling at all. *Fix:* set a per-campaign quota (for example 200 MB or 100 images), cut `MAX_UPLOAD` to about 8 MB, resize in the browser before upload (which also fixes the CPU risk in 10), and add an R2 billing alert.
4. **Stray room codes create permanent storage. Effort: S.** Any `/api/*` request with an unknown `?game=` creates a room and writes its schema (7 rows written, ~20 KB). It never gets a cleanup alarm. 100,000 junk requests a day is 2 GB, so the **5 GB free Durable Object storage fills in under 3 days, after which every campaign's saves fail with `SQLITE_FULL`**. *Fix:* create the tables only on `/internal/create`, and have reads of a missing table return "no game". Alternatively, call `deleteAll()` on any room with no `doc` row.
5. **Commands go over HTTP although a socket is already open. Effort: M.** Commands (180) and wake refetches (120) are three-quarters of Worker requests. Sending commands over the existing WebSocket costs 0 Worker requests and 1/20 of a Durable Object request each. The socket's `auth` step already pushes a fresh view, so the `/api/view` on wake is redundant when the socket reconnects. Doing both takes Worker requests from ~412 to ~90 a session, and billed Durable Object requests from ~387 to ~90. *Effect:* the Free ceiling rises to about **320 a day**, because rows written becomes the limit (one document row per change). That's why 10× on Free isn't realistic.
6. **The game document has no size cap, and it can grow past the 8 MB SQLite row limit. Effort: M.** Notes are capped at 5,000 × 2,000 characters, which is about 10 MB in one row. Past 8 MB every save fails and the campaign is stuck. Long before that, each change costs ~60 ms of room CPU plus ~250 ms to push (measured at 2 MB). *Fix:* cap the total size of notes, or move notes (and possibly scenes and episodes) into their own tables. Reject commands that would push the document past about 1 MB.
7. **The app shows no useful message at the limits. Effort: S.**
   - A 429 shows "Request failed (429)". A 500 from Durable Objects or SQLite shows "Something went wrong on the server". A frozen push (`status 500`) is silently ignored.
   - *Fix:* map 429/1027 and quota errors to "The free server has hit today's limit. It resets at 6 pm Central (00:00 UTC). Your game is saved." Show 5xx push errors as offline.
   - Add a Durable Object analytics check, or a Workers Analytics Engine counter, so you hear about it before players do.
8. **Keep-alive pings might be billed. Effort: S, to verify.**
   - That's 4,032 a session. They're auto-answered, so they don't wake the room and cost no duration (confirmed both in the docs and locally).
   - The docs say *protocol* pings are free, but these are text messages, and the docs don't say whether auto-answered text counts toward the 20:1 incoming-message billing. If it does, that's up to +202 Durable Object requests a session, which would make Durable Object requests the first limit, at ~170 a day.
   - *Verify:* compare Durable Object requests with Worker requests in the dashboard after one real session.
   - *If it is billed:* send pings every 50–60 s instead of 25 s. Check Cloudflare's idle-socket timeout first; it's commonly cited as 100 s, but I didn't confirm that in the docs.
9. **Each push re-hydrates the document once per screen. Effort: S.** `publish()` → `push()` → `read()` deep-copies and migrates the document for each socket: 7 times per change. That costs CPU and duration, not rows, and it's small today (5 ms a change), but it grows with document size. *Fix:* hydrate once per publish and reuse the result.
10. **Large uploads are close to the 10 ms Worker CPU limit. Effort: S.** Parsing multipart data in the Worker scales with size, at ~29 ms per 25 MB in Node. *Fix:* the smaller cap and browser-side resize from risk 3, or stream the raw body to R2 instead of calling `formData()`.
11. **Page reloads write to the database. Effort: S.** Every `/api/hello` saves `lastSeenAt` and pushes to every screen. Phones that reload often add writes and pushes. *Fix:* update `lastSeenAt` at most once every few minutes.

**Already good:**

- It uses the Hibernation API, not `ws.accept()`, which is the difference between 8,000 and 7 sessions a day.
- Pings are auto-answered.
- Each campaign has its own room, with no shared bottleneck.
- Outgoing pushes are free.
- Idle campaigns and their images are cleaned up after 180 days.
- Image URLs are immutable and cacheable.
- Campaign creation is rate-limited.
- A reconnect storm costs 14 requests and no writes.

---

## How to reproduce

See [`scripts/capacity/README.md`](scripts/capacity/README.md). In short:

```sh
npx wrangler dev -c scripts/capacity/wrangler.jsonc --port 8799   # local only
npx tsx scripts/capacity/sim.ts --hours 4                          # cold rooms (default)
npx tsx scripts/capacity/sim.ts --hours 4 --ledger 1300            # an established campaign
npx tsx scripts/capacity/cpu-bench.ts
npx tsx scripts/capacity/model.ts
```

**Limits of this method:**

- `wrangler dev` doesn't report CPU time or billed duration, so duration is an estimate (30 ms per event).
- Eviction timing in production isn't documented ("a short period"). The simulation evicts before every event, which is the pessimistic case; the warm run shows the best case.
- One true cold restart in local dev also recorded 1 row written, from something other than the app's schema statement (which writes 0 rows). If production does the same on every wake-up, rows written per session would roughly double, and the rows-written ceiling would fall to ~160 a day. Worth checking in the dashboard.
- These numbers are for one table shape (7 screens) and one action mix. `--wakes`, `--hours` and `--image-kb` let you vary it.

## Cloudflare docs used (read 2026-11-14)

- Durable Objects pricing (Free/Paid allowances, the 20:1 socket ratio, free outgoing messages, auto-response and hibernation billing, 128 MB duration basis, 00:00 UTC reset): https://developers.cloudflare.com/durable-objects/platform/pricing/
- Durable Objects limits (5 GB Free storage, 10 GB per object, 8 MB rows, 30 s CPU, 1,000 requests a second per object, `SQLITE_FULL`): https://developers.cloudflare.com/durable-objects/platform/limits/
- WebSocket Hibernation best practices (eviction, wake-up, deploys): https://developers.cloudflare.com/durable-objects/best-practices/websockets/
- Durable Object state API (`setWebSocketAutoResponse`): https://developers.cloudflare.com/durable-objects/api/state/
- Workers limits (100k a day, 10 ms CPU, no per-second limit, error 1027): https://developers.cloudflare.com/workers/platform/limits/
- Workers pricing (Paid $5 base and overage rates, free static assets): https://developers.cloudflare.com/workers/platform/pricing/
- Static assets billing (`run_worker_first` gets 429 past the Free limits): https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/
- Workers errors (1027, 1102): https://developers.cloudflare.com/workers/observability/errors/
- R2 pricing (free tier, Class A/B, free deletes, free egress): https://developers.cloudflare.com/r2/pricing/
- R2 get started (subscription required): https://developers.cloudflare.com/r2/get-started/
- Workers Rate Limiting binding (per location, approximate, 10 or 60 s periods): https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/
