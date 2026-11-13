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
- **Run sheets** (episodes, beats, quick notes, recaps) never reach the TV or a phone. Only what a beat's actions do (a scene switch, the purse) does. The one exception is a recap you choose to show as "Previously on…", and only while it's showing. The seed episode lives in `src/server/` so its text isn't even in the browser code.
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
| DM view | `0`–`9` scenes · `←` `→` step (while the shop is open: flip shops) · `S` shop on the TV · `P` purse · `B` bank · `I` requests from phones · `Esc` closes the shop (or the requests drawer first) |
| Run-game mode | `Space` or `→` next beat · `Shift+Space` or `←` back · `0`–`9` `S` `P` as above · `B` opens the bank on top · `I` requests · `Esc` closes whatever is on top |
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

## At the table

- **Gold lives here, not on D&D Beyond.** Players keep D&D Beyond's coins at 0. Anything bought here, they add to their D&D Beyond inventory themselves; the ledger keeps the purchase history.
- **Heroic Inspiration:** tap the d20 beside a player's name in the Bank (or "Inspiration" on their card under Players). A gold d20 then shows beside their name in the TV purse; tap again when it's spent.
- **Launch VTT:** paste the campaign's D&D Beyond game link under Game. It shows as a Launch VTT button at the top of your view and on every player's phone.

## Shops

- **Every shop starts hidden.** In DM view → Shop, each shop has **Hidden / Everyone / Selected players**.
  - **Hidden:** nobody but the DM sees it.
  - **Everyone:** the whole party gets it, and it can go on the TV.
  - **Selected players:** a secret offer (the Peddler). It's never shown on the TV.
- **Server-side filtering:** hidden shops, hidden items, rumored names and item DM notes never leave the server for anyone who can't see them.
- **Item tiers** (Edit on a card → "Shown as"):
  - **For sale:** players can buy it.
  - **Locked:** visible with its price (or ??? gp) and a reason.
  - **Rumored:** shows "???" and a one-line hint.
  - **Hidden:** not shown at all.
- **Stock** is optional ("1 in stock"); buying takes one, and "When sold out" says what happens next.
- **Special orders:** set "arrives after N sessions". The buyer pays now, and the order arrives by itself when that session starts.
- **Price labels and fine print:** "Free*" with fine print, for the Peddler.
- **Banners:** opening a shop to everyone, or revealing or unlocking an item in an open shop, shows a short banner on the TV and on phones. Tick **Quietly** to skip it.
- **Closed shops** (the Peddler) show only their name and tagline until you untick Closed.
- **Starter catalog:** DM view → Game → **Load the starter catalog** swaps in the latest one, with all shops hidden. Gold and history aren't touched.

## Buying from phones

- **Players ask, you decide.** On their phone a player sees their gold, their *available* gold (gold minus anything waiting), and the shops you've opened to them. They tap an item, pick a quantity if it stacks, add an optional note ("for the bard"), and ask. They can cancel while it's waiting.
- **Holds.** A waiting request holds the gold and the stock, so nobody can ask for more than they have, and two players can't both claim the last lute.
- **The Requests drawer** (`I`, or the Requests button with its badge and a soft chime you can mute): Approve, Decline with a reason they'll see, or **Different price** to type a new total after haggling (the ledger keeps both prices). **Approve all** handles payday. If something no longer works when you approve (they spent the gold, it sold out), it tells you and offers *Approve anyway*.
- **On the TV:** "Mira bought a Shield." (tick *Show purchases on the TV* in the drawer to turn it off). Never for secret shops.
- **Secret sales:** tick it on a shop (the Peddler has it on). Shops shown only to selected players are always secret. Those purchases never reach the TV or other phones.
- **Sending gold:** a player can ask to send gold to another player from the party purse. It goes through the same drawer and shows in both ledgers.
- **One at a time:** untick *Players can ask for several at once* on gear like armor.
- Phones get no push notifications; a banner appears on the page when you decide. Anyone who opens an unlocked name can ask to spend that player's gold, so players are nudged to lock their name; your approval is the safeguard either way.

## Running a session (run-game mode)

- **DM view → Run game** starts (or resumes) a session for an episode and opens the presenter view: the current beat big, the next one underneath, every beat in a side list (a drawer on phones).
- **Next** and **jumping** to a beat fire its actions (switch the TV scene, black screen, or the bank: purse on the TV and the bank on your screen). **Back** never fires anything. Tap "↻ Again" to re-fire, or "Skip" on the next beat's action before you press Next.
- The first screen is check-in (untick anyone who isn't here; they're marked away) and the last session's recap, which you can show on the TV as "Previously on…". The last screen is payday, the recap box and all your quick notes.
- Your place is saved on the server, so a reload or another device lands on the same beat. If a session ends mid-episode, the next run picks up where it stopped.
- **DM view → Episodes:** add episodes, edit beats (each beat is edited as Markdown), reorder by dragging or with the arrows, import an episode pasted as Markdown, and export it back out. One beat per `##`; lines start with `>` read-aloud, `-` note, `check:`, `if:` or `action:` (`scene <name>`, `black`, `bank`). There's no initiative tracker yet, so `action: initiative` is skipped.
- Existing games get the seed episode "Just Desserts" automatically. "Start fresh" keeps episodes; "Reset everything" restores the seed episode.

## Sessions and starting over

- **Start or end a session** with the button at the top of the DM view. Ledger lines are tagged with the running session.
- **DM view → Game → Sessions:** rename or renumber a session, reopen one you ended by mistake, or delete one. Deleted sessions' ledger lines read as "between sessions". The next session is always one higher than the highest left, so deleting every test session starts you at Session 1 again.
- **DM view → Game → Start fresh** offers two resets:
  - **Clear gold, ledger and sessions:** zeroes every purse and keeps players, scenes, shops and items. Use it after a test run.
  - **Reset everything to the original Candlefair:** returns the whole game to the original seed.

## Backups

DM view → Game → **Download backup** saves the whole game and ledger as JSON. **Restore from a backup** puts it back.
