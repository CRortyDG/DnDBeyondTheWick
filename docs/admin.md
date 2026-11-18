# Admin console

A private, read-only page for the site owner: every campaign, whether anyone is
using it, and each one's story (players, sessions and recaps, the Chronicle,
what the party discovered). Nothing on it changes a game. The only things it
writes are your own labels (Mine / Test / Real and a note), kept in the
campaign list, never in the game.

## Turn it on

1. Make a long random key (32 characters or more). For example, in a terminal:
   `openssl rand -base64 36`
2. Cloudflare dashboard → Workers & Pages → **candlefair** → Settings →
   Variables and Secrets → **Add** → type *Secret*, name `ADMIN_KEY`, value the
   key → Deploy. (Or `npx wrangler secret put ADMIN_KEY`.)
3. Open **https://<your site>/admin** and paste the key. Tick "Remember on this
   device" only on your own devices.

Without `ADMIN_KEY` (or with one under 32 characters) the console is off and
`/api/admin/*` answers "Not found". A wrong key counts as a miss, like a wrong
campaign code, so guessing gets the address shut out for 15 minutes.

## Where the list comes from

Durable Objects can't be listed by name, so there is now a small registry (its
own Durable Object, `Registry`). Every campaign made after this change adds
itself when it's created, with the country and a salted hash of the address it
came from ("made from the network you're on now").

Campaigns made **before** this change aren't in the list until you find them:

- **This browser's campaigns**: the console sees the DM keys this browser holds
  and offers "Add them and mark all as mine". Do this once on each device you
  DM from.
- **Scan uploaded images** (no setup): finds every campaign that uploaded at
  least one image or map.
- **Scan everything (Cloudflare)** (optional, finds every campaign): add two
  more secrets, `CF_ACCOUNT_ID` (on the dashboard's account home page) and
  `CF_API_TOKEN` (My Profile → API Tokens → Create → custom token with
  *Account · Workers Scripts · Read*). The console then lists every room the
  Worker has and asks each one its code. You can delete the token afterwards;
  new campaigns don't need it.

## Yours, tests, real

Each campaign gets a label you set (Mine / Test / Real) or, until you do, a
guess with its reasons: this browser DMs it or it came from your network
(yours); a test-sounding name, an unplayed premade or nobody joining (test);
players opening their phones, sessions run, several active days, Chronicle
notes (real). "Other people's" hides yours and tests, so its numbers are the
ones to watch.

"Active days" come from the per-campaign usage counter, which started on
2026-11-15, so older activity shows only in "last change" and "last seen".

## Cost

Opening the console asks each campaign once (in batches of 40). Rooms that are
asleep wake briefly; asking doesn't count as use, so it never holds off the
six-month cleanup of idle campaigns.

## Troubleshooting

`/admin` showing the homepage means the deploy running on Cloudflare predates
the console (the page file isn't there, so the site falls back to the home
page). Check Workers & Pages → candlefair → Deployments: the top row should be
a build of the latest main commit, not only an "Add secret" row.
