# Security audit: bots, abuse and guessing (2026-11-14)

Scope: the Cloudflare Worker (`worker/`), the room API (`src/server/`), how
campaign codes, DM links, player names and Arrival links work, and uploads.
Builds on the capacity audit (draft PR #27, `CAPACITY_REPORT.md`), which found
that nothing rate-limited requests.

## What can be guessed, and how hard it is

| Secret | What it unlocks | Strength | Verdict |
| --- | --- | --- | --- |
| DM key (in the DM link after `#key=`) | Everything | 192 random bits, only the hash is stored, compared in constant time | Strong. Can't be guessed. |
| Random campaign code (7 characters) | Join as a new player while the door is open, watch the TV view, act as any player who hasn't locked their name | ~35 bits (27.5 billion codes) | Fine **now that guessing is limited** (see below). Before this PR it was unlimited, and every answer said whether the code existed. |
| A campaign code the DM typed in (3 to 40 characters) | Same as above | As weak as the word: `friday`, `wick`, and the default `candlefair` are the first things a bot tries | **Weak.** See recommendation R2. |
| Arrival link code (10 characters) | That player's Arrival page and seat | ~58 bits, and you also need the campaign code | Strong. |
| Player name lock (a password the player picks) | Acting as that player | Minimum 4 characters | Weak on its own; now counted as guesses, so a bot gets shut out quickly. |
| Player name with no lock | Acting as that player | **Nothing.** The name shows on the TV, which anyone with the code can open | **The biggest real hole.** See recommendation R1. |

With the new guess limit an address gets about 20 wrong guesses, then 15
minutes shut out: roughly 1,900 guesses a day. If 1,000 campaigns were live, a
bot would need about 14,000 address-days on average to land on one random
code. Typed-in codes and unlocked names are a different story, which is why R1
and R2 matter.

## Findings and what this PR does

**1. Nothing rate-limited the API or the live connection (high). Fixed.**
Every `/api/` call and every WebSocket connect now counts against
`API_LIMIT` (300 a minute per address). A whole table usually shares one
Wi-Fi address, and a busy table uses well under a tenth of that. Over the limit
you get a 429 with a friendly message.

**2. Guessing campaign codes, DM keys, name locks and Arrival links was
unlimited (high). Fixed.** The room now marks every answer that tells a guesser
something: no game with that code, a wrong DM key, a wrong name lock, a dead
Arrival link, or "that campaign code is taken" when creating. The Worker counts
those per address (`GUESS_LIMIT`, 20 a minute). Go over and the address is shut
out of the whole API for 15 minutes. The shut-out flag lives in Cloudflare's
free edge cache, so it needs no storage. The browser never sees the marker.

**3. A bot hitting random codes left a permanent room behind for each one
(medium). Fixed.** A room now creates its tables only when a campaign is
actually created. Checked locally: three made-up codes added no storage files.

**4. Uploads had no total cap (medium). Fixed.** Anyone can create a campaign
and so be its DM, and each upload could be 25 MB with no limit on how many.
Now: 10 uploads a minute per address, and 500 MB or 1,000 images per campaign
(counted inside the campaign's room, so it can't be raced). The per-image cap
stays at 25 MB for big battle maps.

**5. One person could make a game too big to save (medium). Fixed.** The
Chronicle allowed 5,000 notes of 2,000 characters (about 10 MB), but a room's
saved game tops out at 2 MB. Anyone acting as a player could fill it and every
later save would fail. Now a change that would grow a game past 1.5 MB is
refused with "This campaign is too full to save more" (deleting things still
works), request bodies over 64 KB are refused before parsing (4 MB for a backup
import), and an import over the cap is refused.

**6. Live connections could be flooded (medium). Fixed.** A screen only ever
sends its key once (pings are answered for free without waking the room). A
socket that sends anything else, a message over 1 KB, or more than 5 keys is
hung up on. One room holds at most 100 open screens.

**7. The free tier's daily request allowance can still be used up by a flood
(high, needs a dashboard change).** The limits in code stop a bot from doing
damage, but every blocked request still reaches the Worker and still counts
toward the free plan's 100,000 requests a day. A determined flood can take the
site offline for the day. The fix lives in the Cloudflare dashboard, in front
of the Worker, where blocked requests don't count. See "Dashboard steps" below.

**Already good:** no unsafe HTML in the app; player and VTT links must be
`https://`; uploaded SVGs are served with a script-blocking Content-Security-
Policy and `nosniff`; the DM key travels after the `#`, so it never reaches
server logs; pages send `no-referrer` and `noindex`; campaign creation was
already limited to 5 a minute per address.

## Recommendations that need c's OK

**R1. Tie each player's name to their phone (changes how players join).**
Today anyone with the code who types `?player=sam` *is* Sam unless Sam set a
name lock. They could request purchases, give Sam's gold away (the DM still
approves) or write notes as Sam. Suggested fix: the first phone to join under a
name gets a random key saved automatically, so the name is locked to that
phone with no password to pick. The player's private Arrival link also works as
their key, so opening it on a new phone gets them back in, and the DM's
existing "Reset name lock" button covers anything else. Catch: a player who
joined by typing the code (no Arrival link) and switches phones needs the DM to
reset their lock. Already-sent Arrival links keep working.

**R2. Make typed-in campaign codes harder to guess.** Require at least 8
characters for a code the DM picks, or add a short random tail
(`friday-k7m2`). Only affects new campaigns; existing codes keep working. If
your own campaign lives at the default `candlefair` code, it is the easiest
one on the site to find.

**R3. Later, before a public launch:** a Cloudflare Turnstile check (free, no
puzzles for real people) on "Start a campaign", so a bot can't mint campaigns to
get DM powers and image space.

## Dashboard steps (c, about 5 minutes)

1. **Security → WAF → Rate limiting rules → Create rule** on the
   site's domain. Free plans get one rule. Suggested: requests whose URI
   path starts with `/api/`, more than 100 per 10 seconds from the same IP,
   block for 10 seconds. This is what protects the daily allowance.
2. **Security → Bots → Bot Fight Mode: On.** Free, and it challenges known bad
   bots before they reach the Worker.
3. **Workers & Pages → candlefair → Settings → Domains & Routes:** turn off the
   `workers.dev` address and preview URLs, so the only way in is through the
   domain that has the rules above.

## How it was checked

- `tests/abuse.test.ts`: what counts as a miss (and what doesn't), the body
  cap, and the game-size cap. Full suite: 240 tests pass; typecheck passes.
- The real Worker run locally (`vite dev`, which runs workerd with the rate
  limit bindings): 20 made-up codes then a 15-minute shut-out; made-up codes
  leave no storage; garbage on a live socket and a 6th key both hang up; a
  non-DM upload is refused and the 11th upload in a minute gets a 429; 320
  rapid calls from one address get 38 refusals.
