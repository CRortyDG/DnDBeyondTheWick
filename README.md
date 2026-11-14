# Candlefair

A table companion for **Tales from the Flickering Candle**. It runs next to D&D Beyond and covers what D&D Beyond doesn't: a TV display for the table, a party bank and shop, and session tools for the DM. Every screen stays in sync live.

Anyone can start a campaign from the front page. Each campaign has a short code (like `wick7kq`) and its own DM key.

| Who | Open | What it does |
| --- | --- | --- |
| Anyone | `https://dnd.calebs.garden/` | Join a table with its campaign code, or start a new campaign. |
| The DM | the private DM link shown when the campaign was made (`/?game=CODE&player=DM#key=…`) | Switch scenes, run the bank, edit shops and scenes, manage players. |
| The TV | `/?game=CODE&player=TV` | Full-screen scenes, the party purse, the shop when it's open. Controls only appear when the mouse moves. |
| A player | `/?game=CODE&player=Sam` (or `/?game=CODE` to type a name) | Their gold, the party purse, the shop, their history. |

## How access works

- **Starting a campaign** (front page → *I'm a DM: start a new campaign*) makes a new campaign and a random DM key, and shows the DM's private link once. Only a hash of the key is stored. There are no accounts and no reset: if the DM loses every copy of the link, the campaign can't be run again. You can pick your own campaign code or get a random one.
- **The DM** opens that link. The key sits after the `#`, so it's never sent to the server or logged. It's saved on the device and removed from the address bar, so `?game=CODE&player=DM` alone works afterwards. **DM view → Game → Links** copies the link again or makes a new key (old links stop working everywhere).
- **Players** need no account. A new `?player=<name>` creates that player on the spot, and they show up in the DM view straight away. `Player1`, `player 1` and `PLAYER-1` are the same person.
- **Locking a name:** add `&key=anything` the first time (or press "Lock my name" on the player page). After that, that name only opens with that key. The DM can reset a lock.
- **Seats:** the table seats 6 by default; change it under Players. Once every seat is taken, a new name knocks instead of joining, and you can still let them in. Players marked "left the table" don't hold a seat.
- **Griefing:** players can't move money themselves; only the DM can. If silly names start appearing, tick **Close the door** in the DM view: new names then knock, and you choose who to let in.
- **The TV** is read-only.

### Spoiler safety

DM-only data never leaves the campaign's room for the TV or a phone. The room builds each screen's data from an allow-list (`src/shared/projection.ts`); the UI doesn't just hide things.

- **Reveal scenes** aren't sent to the TV at all until the DM shows them.
- **The merchant's sigil** isn't in the browser code at all. `/api/art/merchant-sigil` serves it only while its scene is live, or to the DM.
- **Run sheets** (episodes, beats, quick notes, recaps) never reach the TV or a phone. Only what a beat's actions do (a scene switch, the purse) does. The one exception is a recap you choose to show as "Previously on…", and only while it's showing. The seed episode lives in `src/server/` so its text isn't even in the browser code.
- **Never sent to the TV or players:** hidden prices (they see `??? gp`), DM notes, name-lock hashes, last-seen times, hidden map locations and map DM notes and links.

Tests in `tests/projection.test.ts` put a marker string in every DM-only field and check it never appears in the TV or player data.

## Arrival: the intro texted before session 0

Each player gets a private link, `/arrive/<code>`, from the DM view's **Arrival** tab (**Copy text** copies a ready-to-send message; edit the message there). On a phone it plays a short tap-through intro (their arrival in Candlefair by ship), then lands on their seat: a character name, an optional "Why did you get on that boat?" line, and **Take a seat**. After that the link opens straight on the seat page, with **Replay intro**.

For first-time players, the seat page has **Pick a starting point**: six kinds of hero in plain words (The Protector, The Sneak, The Spellcaster, The Healer, The Wild One, The Charmer), each with what you do on your turn and the D&D Beyond recipe (2024 rules: class, species, background, best ability). **Help me choose** asks three questions and suggests one. Picking fills in a sample name and line they can change; the pick shows on their row in the Arrival tab. Edit the cards in `src/shared/starters.ts`.

- **The DM's Arrival tab** shows, per player: link copied, intro opened, finished, seat claimed, character name. **Reset** puts a player back to new (same link). **Lock seats** stops name changes.
- **The Table** on the TV (press `T`, or the button in the Arrival tab) shows one candle per player. Seats light live as players claim them; a QR code in the corner cycles through whoever hasn't claimed yet. When the last seat lights, every candle flares and the title fades in.
- **The generic link** `/arrive` plays the intro and then asks for the link the DM sent. It can't claim a seat.
- **Link previews** (iMessage, Android Messages) show *Tales from the Flickering Candle*, *Four days out of Baldur's Gate…* and `public/arrival/og.jpg`. They're identical for every player; the words are the `<meta>` tags at the top of `arrive.html`.
- **Editing the words:** everything the intro says is in `src/client/arrival/content.ts` (`{SHIP}`, `{CAPTAIN}`, `{CHARACTER}` placeholders; the ship and captain names are at the top).
- **Sound** is off by default, with a toggle that's remembered per device. The waves, creaking, wind, door and hearth are made in the browser, so there are no files to download. To use recordings instead, put them in `public/arrival/sounds/` and list them in `SOUND_FILES` in the content file.
- **Spoiler safety:** the Arrival page is its own part of the site with its own small bundle; it loads none of the main app's code or styles. `/api/arrival` sends only the seat names and the player's own progress.

## Run it locally

```bash
npm install
npm run dev       # http://localhost:5173, with the Worker, rooms and image storage running locally
```

Open http://localhost:5173/, start a campaign, and open the DM link it shows. Local data (campaigns and uploaded images) lives in `.wrangler/state/`; delete that folder to start over.

```bash
npm test          # money, ledger, permissions, spoiler filtering, saves, campaigns
npm run typecheck
npm run build     # what gets deployed: dist/client (the pages) and dist/candlefair (the Worker)
```

## Deploy (Cloudflare Workers + Durable Objects + R2)

One-time setup, in the Cloudflare dashboard of the account that already holds `calebs.garden`:

1. **Turn on R2.** R2 Object Storage → Purchase/Enable. The free tier covers 10 GB, but Cloudflare asks for a payment method. Create a bucket named `candlefair-files`.
2. **Connect the repo.** Workers & Pages → Create → Import a repository → `DnDBeyondTheWick`. Build command `npm run build`, deploy command `npx wrangler deploy`. Every push to `main` then deploys by itself. (Or deploy by hand with `npx wrangler login` then `npm run deploy`.)
3. **Domain.** The Worker → Settings → Domains & Routes → Add → Custom domain → `dnd.calebs.garden`. Remove the old `dnd` CNAME that pointed at Vercel first.
4. **Plan.** On the free plan, hitting a daily limit makes changes fail until midnight UTC. Before inviting the public, switch to Workers Paid ($5 a month): Workers & Pages → Plans.
5. Turn off the Vercel project, Upstash and Blob once the new site works.

Everything the Worker needs is in `wrangler.jsonc`: the `ROOMS` Durable Object (one per campaign), the `FILES` R2 bucket and a limit of 5 new campaigns a minute per address. There are no secrets to set.

### Running costs

- **Each campaign is one Durable Object** that holds its game in memory and saves to its own SQLite. A click is one saved row (plus a row per ledger line) and no reads. Screens get their new view pushed over a WebSocket, and pushes are free.
- **Idle campaigns hibernate** and cost nothing, even with a TV connected all week. A campaign untouched for six months is deleted, with its images.
- **Rough capacity:** the free plan allows about 30 busy game nights a day; the $5 plan about 6,000 a month, then roughly $3 per 1,000 more. Images: 10 GB free, downloads free.
- Check Workers & Pages → the Worker → Metrics after your first session.

## The TV on a Roku

Roku has no usable web browser, so the TV page runs on a laptop and shows on the TV:

- **HDMI (most reliable):** plug the laptop into the TV and set the TV as a second screen.
- **Screen mirroring:** Roku supports Miracast. On Windows press Win+K and choose **Extend**. On Linux, GNOME Network Displays can work, but it's hit-or-miss.
- **No laptop:** a streaming stick with a browser (e.g. a Fire TV Stick with Silk) can open `?player=TV` by itself.

In the DM view, **Open TV window** pops the TV page out. Drag it onto the TV and press **F** for fullscreen.

## Keys

| Where | Keys |
| --- | --- |
| DM view | `0`–`9` scenes · `←` `→` step (while the shop is open: flip shops) · `S` shop on the TV · `P` purse · `B` bank · `T` The Table (Arrival) · `I` requests from phones · `L` map legend · `Esc` closes the requests drawer, then the shop, then zooms a map back out |
| Map editor | click the map to drop a pin · drag to move · `←` `↑` `→` `↓` nudge (Shift: bigger steps) · `Delete` removes · `Ctrl+Z` undo · `Esc` deselects, then closes |
| Fight screen | `Space` next turn · `Shift+Space` previous · digits type an amount · `Enter` damages the picked rows · `Shift+Enter` heals them · `Esc` clears the amount, then the picks |
| Run-game mode | `Space` or `→` next beat · `Shift+Space` or `←` back · `0`–`9` `S` `P` `T` as above · `B` opens the bank on top · `I` requests · `Esc` closes whatever is on top |
| TV | `F` fullscreen · `H` hide the control bar |

## How it's built

- **Vite, React 19, TypeScript** for the pages: `index.html` (the TV, DM, player and front page, picked by `?player=`) and `arrive.html` (the Arrival intro, its own small bundle).
- **A Cloudflare Worker** (`worker/index.ts`) is the front door: it serves the pages, starts campaigns, stores images in R2 and passes every other `/api/` call to the campaign's room.
- **One Durable Object per campaign** (`worker/room.ts`) holds the game document, the ledger and the DM key's hash in SQLite. Requests to a room run one at a time, so two purchases can't spend the same gold.
- **Every write goes the same way:** the room checks who's asking, then runs a pure rules function (`src/shared/reducer.ts`) and saves. The HTTP API itself is plain `Request → Response` code in `src/server/api.ts`, so tests run it against an in-memory store.
- **Live updates:** each screen keeps one WebSocket to its room. After each save the room builds every connected screen's own filtered view and pushes it. If the connection drops, the screen keeps showing what it has and reconnects quietly.
- **Money is integer copper** everywhere (`src/shared/money.ts`) and displays as `12 gp 5 sp 3 cp`. Gold "+25 gp" floats on the TV come from comparing balances, so they still show after a reconnect.
- **Seed data** is in `src/shared/seed.ts`. The sigil is in `src/server/art/`.

```
index.html, arrive.html   the two pages
worker/                   the Worker (front door) and the campaign room
src/shared/               rules, money, seed data, per-screen views (used by the room, the pages and tests)
src/server/               the API, auth, game service (runs inside the room; never in the browser)
src/client/               TV, DM, player and Arrival screens
tests/                    vitest
```

## At the table

- **Gold lives here, not on D&D Beyond.** Players keep D&D Beyond's coins at 0. Anything bought here, they add to their D&D Beyond inventory themselves; the ledger keeps the purchase history.
- **Heroic Inspiration:** tap the d20 beside a player's name in the Bank (or "Inspiration" on their card under Players). A gold d20 then shows beside their name in the TV purse; tap again when it's spent.
- **Maps:** a Map scene shows an uploaded image letterboxed on the TV, with numbered wax-seal locations you place yourself (Scenes → Pins, or Edit map under the preview). Each location has a seal label (up to 4 characters), name, type, description, private DM notes, and an optional link (a shop, an NPC portrait or another map). Only **discovered** locations reach the TV; hidden ones and every DM note stay on the server. While a map is on the TV, tap a location to zoom the TV to it (tap again or Esc to zoom out), reveal it with a "Discovered: …" banner or quietly, and toggle the legend with L. **Dot size** (a slider in the map editor and under the preview) shrinks or grows that map's dots, from 25% to 200%. With the "numbers only" legend, names aren't sent to the TV until you focus a location. Games created before maps existed get an **Add the Candlefair and Sword Coast maps** button under Scenes.
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

## Renown and the bounty board

- **Renown** is one rank for the whole party: Strangers → Known in town → Trusted → Heroes of Candlefair → Famous on the Coast. Set it in DM view → **Board**. Raising it plays a moment on the TV ("Candlefair knows your names"), adds a line to the Chronicle, and opens anything that was waiting on it. Lowering it is quiet, and those things lock again.
- **Renown locks:** any item or storefront can need a rank (Edit → *Needs Renown*). Until the party has it, players see it locked with the rank ("Needs Known in town") and your line underneath. Storefronts show their name and the rank, but no goods.
- **Job flyers** live on the same notice board as player flyers, and the board holds 8 pins in all. Each has a title, who posted it, a few lines, a reward (per person, for the party, or hidden), the Renown it needs, and a paper: scrawled note, merchant's bill, official notice, or sealed envelope (no text at all). Your notes on it (adventure, loot, twists) never leave the DM view.
- **Statuses:** Open → Taken → Done, or Pulled. Players tap **Take this job** on their phone (Jobs tab) and it comes to your Requests drawer. Jobs above the party's Renown stay readable, stamped "Experienced parties only", with no take button. **Done…** pays the reward to each player at the table by default (a party total is split evenly; type any amount you like); it goes through the ledger once, is written in the Chronicle, and the DONE flyer comes down after the next full session. **Pull and follow up…** replaces a flyer with a new one in the same spot.
- New campaigns start with four job flyers (Artum’s Winterfest job among them), all unpinned. Older campaigns get them once.

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
- **DM view → Episodes:** add episodes, edit beats (each beat is edited as Markdown), reorder by dragging or with the arrows, import an episode pasted as Markdown, and export it back out. One beat per `##`; lines start with `>` read-aloud, `-` note, `check:`, `if:`, `action:` (`scene <name>`, `black`, `bank`) or `fight:` (`fight: Pudding Gremlin x2, Goblin`: landing on the beat sets up that fight from the Monsters tab).
- Existing games get the seed episode "Just Desserts" automatically. "Start fresh" keeps episodes; "Reset everything" restores the seed episode.

## Combat mode

For in-person fights: no grid, no tokens. The point is faster turns: everyone always knows who's up and who's next.

- **Start fight** (DM header, the Monsters tab, or a run sheet `fight:` line) puts **Roll initiative!** on the TV and a number pad on every phone. Entries arrive live on the full-screen **fight screen**; type or fix any of them, add monsters from templates (lettered A, B, …) or quick one-offs, roll their initiative in one click, drag to reorder, then **Begin**. Ties go to the higher initiative bonus when both are known, otherwise they stay as entered.
- **The TV:** the scene dimmed behind a turn-order strip, a big "now" panel with conditions and turns left, "up next", the round, and an optional hourglass (off by default; it just glows when it runs out). Monsters show a state (Unhurt, Hurt, Bloodied, Barely standing, Down), never numbers or AC, and their TV name ("Something in the pudding") until you reveal the real one. Hidden combatants never reach the TV or phones; their turn shows as "…". Crits, a monster falling, a player going down and the end get a short animation. While a fight runs, the shop, "Previously on…" and the purse step aside; **Pause** shows the scene again with a small banner.
- **Phones:** "You're up next" (short buzz) and "Your turn!" (longer buzz, red screen), the order, your conditions and round, **End my turn**, your HP (optional, "Show my HP on the TV" on by default; D&D Beyond stays the real sheet) and death saves at 0 HP.
- **Your controls:** damage, heal and temp HP on any picked rows; the 2024 conditions (Exhaustion with levels) or a custom one, with rounds counting down at the start or end of that combatant's turn and a reminder when they end; concentration (the save DC pops up on a hit); recharge abilities (a reminder at the start of its turn once used, with Roll d6); 1/day ticks; on-death reminders (Death Burst); add mid-fight right after another combatant; delay; hide; per-fight DM notes. Previous turn undoes the countdowns exactly.
- **End fight** shows "The fight is over" on the TV (rounds and who went down). Then the loot step pays coins into purses through the ledger (evenly or by player), notes any items, writes an editable Chronicle line, keeps a summary under Monsters → Past fights, and puts the TV back on the scene from before.
- **Monsters tab:** templates with AC, HP (`21` or `6d6`, rolled per monster), initiative bonus, speed, attacks, abilities (recharge, uses per day, on-death reminder), resistances, immunities, notes, a DM note (shown when a fight with it starts) and an optional portrait. The Pudding Gremlin is seeded on the server, like the seed run sheet, so its stat block never ships to the TV or phones.
- Everything lives in the campaign's room, so a refresh on any screen comes back to the same turn. Player HP stays with the player between fights.

## Sessions and starting over

- **Start or end a session** with the button at the top of the DM view. Ledger lines are tagged with the running session.
- **DM view → Game → Sessions:** rename or renumber a session, reopen one you ended by mistake, or delete one. Deleted sessions' ledger lines read as "between sessions". The next session is always one higher than the highest left, so deleting every test session starts you at Session 1 again.
- **DM view → Game → Start fresh** offers two resets:
  - **Clear gold, ledger and sessions:** zeroes every purse and keeps players, scenes, shops and items. Use it after a test run.
  - **Reset everything to the original Candlefair:** returns the whole game to the original seed.

## Backups

DM view → Game → **Download backup** saves the whole game and ledger as JSON. **Restore from a backup** puts it back.
