# Candlefair

A table companion for **Tales from the Flickering Candle**. It runs next to D&D Beyond and covers what D&D Beyond doesn't: a TV display for the table, a party bank and shop, and session tools for the DM. Every screen stays in sync live.

| Who | Open | What it does |
| --- | --- | --- |
| The TV | `https://dnd.calebs.garden/?player=TV` | Full-screen scenes, the party purse, the shop when it's open. Controls only appear when the mouse moves. |
| The DM | `https://dnd.calebs.garden/?player=DM&key=YOUR_DM_KEY` | Switch scenes, run the bank, edit shops and scenes, manage players. |
| A player | `https://dnd.calebs.garden/?player=Sam` | Their gold, the party purse, the shop, their history. |
| Anyone | `https://dnd.calebs.garden/` | "Who's at the table?": type a name and you're in. |

Add `&game=<id>` to any link to use a different campaign (the default is `candlefair`).

## How access works

- **The DM** needs the secret `DM_KEY`. The server checks it on every request. After the first visit the key is saved on that device and removed from the address bar, so `?player=DM` alone works afterwards.
- **Players** need no account. A new `?player=<name>` creates that player on the spot, and they show up in the DM view straight away. `Player1`, `player 1` and `PLAYER-1` are the same person.
- **Locking a name:** add `&key=anything` the first time (or press "Lock my name" on the player page). After that, that name only opens with that key. The DM can reset a lock.
- **Seats:** the table seats 6 by default; change it under Players. Once every seat is taken, a new name knocks instead of joining, and you can still let them in. Players marked "left the table" don't hold a seat.
- **Griefing:** players can't move money themselves; only the DM can. If silly names start appearing, tick **Close the door** in the DM view: new names then knock, and you choose who to let in.
- **The TV** is read-only.

### Spoiler safety

DM-only data never leaves the server for the TV or a phone. The server builds each screen's data from an allow-list (`src/shared/projection.ts`); the UI doesn't just hide things.

- **Reveal scenes** aren't sent to the TV at all until the DM shows them.
- **The merchant's sigil** isn't in the browser code at all. `/api/art/merchant-sigil` serves it only while its scene is live, or to the DM.
- **Never sent to the TV or players:** hidden prices (they see `??? gp`), DM notes, name-lock hashes and last-seen times.

Tests in `tests/projection.test.ts` put a marker string in every DM-only field and check it never appears in the TV or player data.

## Run it locally

```bash
npm install
npm run seed      # creates the "candlefair" game in .data/ (local file store)
npm run dev
```

Then open:

- DM: http://localhost:3000/?player=DM&key=dev (with no `DM_KEY` set, the local key is `dev`)
- TV: http://localhost:3000/?player=TV
- A player: http://localhost:3000/?player=Sam

With no Upstash or Blob credentials, data lives in `.data/games/*.json` and uploads in `.data/uploads/`. Delete `.data/` to start over.

To use your real Upstash and Blob locally, run `vercel env pull .env.local`.

```bash
npm test          # money, ledger, permissions, spoiler filtering, atomic saves
npm run typecheck
```

## Deploy (Vercel + Upstash Redis + Vercel Blob)

1. **Import the repo.** In Vercel: Add New → Project → import `DnDBeyondTheWick`. Framework: Next.js. Leave the build settings as they are.
2. **Add Redis.** In the project: Storage → Create → **Upstash** (Redis, from the Marketplace) → connect it to the project. This sets `KV_REST_API_URL` and `KV_REST_API_TOKEN`.
3. **Add Blob.** Storage → Create → **Blob** → connect it. This sets `BLOB_READ_WRITE_TOKEN`.
4. **Set the DM key.** Settings → Environment Variables → add `DM_KEY` with a long random value. You can make one with `npm run dm-key`. Keep it somewhere safe; it's the only way into the DM view.
5. **Redeploy** so the new variables take effect (Deployments → … → Redeploy).
6. **Domain.** Settings → Domains → add `dnd.calebs.garden`. In Cloudflare DNS, add a `CNAME` record for `dnd` pointing at the target Vercel shows (usually `cname.vercel-dns.com`), set to **DNS only** (grey cloud).
7. **Create the game.** Open `https://dnd.calebs.garden/?player=DM&key=YOUR_DM_KEY` and press **Create the game**. That seeds Candlefair's scenes, Players 1–4, the seven shops and every item.

Fluid compute is on by default for new Vercel projects. The live connection relies on it, so leave it on.

### Running costs

Everything is pay-per-use with no always-on server.

- **Live screens:** each open screen keeps a light connection to Vercel. It reconnects every ~4.5 minutes and is mostly idle.
- **Quiet spells:** after 15 quiet minutes, a screen drops that connection and just checks for changes every 15 seconds. So a TV left on all week is cheap, and the first change after a quiet spell can take up to 15 seconds to appear.
- **Redis:** a few commands per change.
- **Images:** stored once in Blob.

Check Vercel's Usage tab after your first session to confirm.

## The TV on a Roku

Roku has no usable web browser, so the TV page runs on a laptop and shows on the TV:

- **HDMI (most reliable):** plug the laptop into the TV and set the TV as a second screen.
- **Screen mirroring:** Roku supports Miracast. On Windows press Win+K and choose **Extend**. On Linux, GNOME Network Displays can work, but it's hit-or-miss.
- **No laptop:** a streaming stick with a browser (e.g. a Fire TV Stick with Silk) can open `?player=TV` by itself.

In the DM view, **Open TV window** pops the TV page out. Drag it onto the TV and press **F** for fullscreen.

## Keys

| Where | Keys |
| --- | --- |
| DM view | `0`–`9` scenes · `←` `→` step · `S` shop on the TV · `P` purse · `B` bank · `Esc` closes the shop |
| TV | `F` fullscreen · `H` hide the control bar |

## How it's built

- **Next.js 16 (App Router), TypeScript, React 19.** One page reads `?player=` and shows the TV, DM or player view.
- **One JSON document per game** plus an append-only ledger in Upstash Redis.
- **Every write goes the same way:** the server checks who's asking, then runs a pure rules function (`src/shared/reducer.ts`). It then saves with a check-and-set Lua script, so two purchases can't spend the same gold.
- **Live updates:** after each save the server publishes the new version number. Each screen holds a server-sent-event stream (`/api/stream`) that carries only version numbers, and fetches its own filtered view when the number changes. If the stream drops, the screen keeps showing what it has and reconnects quietly. A slow poll covers anything missed.
- **Money is integer copper** everywhere (`src/shared/money.ts`) and displays as `12 gp 5 sp 3 cp`. Gold "+25 gp" floats on the TV come from comparing balances, so they still show after a reconnect.
- **Seed data** is in `src/shared/seed.ts`, copied from the prototype.
- **The prototype's art** was ported to `src/client/scenes/` (notice board and Artum's handbill) and `public/art/` (portraits). The sigil is in `src/server/art/`.

```
app/                Next.js page and API routes
src/shared/         rules, money, seed data, per-screen views (used by server and tests)
src/server/         store (Upstash / local file), auth, game service
src/client/         TV, DM and player screens
tests/              vitest
scripts/seed.ts     create or reset a game from the command line
```

## Sessions and starting over

- **Start or end a session** with the button at the top of the DM view. Ledger lines are tagged with the running session.
- **DM view → Game → Sessions:** rename or renumber a session, reopen one you ended by mistake, or delete one. Deleted sessions' ledger lines read as "between sessions". The next session is always one higher than the highest left, so deleting every test session starts you at Session 1 again.
- **DM view → Game → Start fresh** offers two resets:
  - **Clear gold, ledger and sessions:** zeroes every purse and keeps players, scenes, shops and items. Use it after a test run.
  - **Reset everything to the original Candlefair:** returns the whole game to the original seed.

## Backups

DM view → Game → **Download backup** saves the whole game and ledger as JSON. **Restore from a backup** puts it back.
