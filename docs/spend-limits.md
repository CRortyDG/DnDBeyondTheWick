# Spend limits and abuse guards

Cloudflare has no hard spend cap on R2, and Workers Free has a shared daily allowance (100,000 Worker requests and 100,000 Durable Object requests). This page says what the app enforces itself and what has to be set in the Cloudflare dashboard.

## What can cost money, and what can only cause an outage

| Thing | Free allowance | Past it | Guard |
| --- | --- | --- | --- |
| R2 storage | 10 GB-month | **Billed** ($0.015 per GB-month) | App ceiling: 8 GB site-wide, then uploads stop |
| R2 writes (Class A) | 1M a month | **Billed** ($4.50 per million) | App cap: 25,000 files stored a day (about 750k a month) |
| R2 reads (Class B) | 10M a month | **Billed** ($0.36 per million) | Every read goes through the Worker, and Workers Free stops at 100k a day (about 3M a month). Edge cache plus 600 R2 reads a minute per address on top |
| R2 egress | Free | Free | none needed |
| Worker requests | 100k a day | On Free: requests fail until 00:00 UTC (no bill) | Only the dashboard WAF rule below. Code can't help, because a request is counted before any code runs |
| Durable Object requests and storage | 100k a day, 5 GB | On Free: fail (no bill) | Per-screen and per-address limits, daily budget per address, daily caps on new campaigns |

If the account ever moves to Workers Paid, the Worker and Durable Object rows start billing too. The app's limits still hold, but there is no hard stop on Worker requests. Set the billing alerts below before that.

## What the app enforces (src/server/spend.ts)

- **Per file:** 25 MB per image, smaller for video (`CLIP_VIDEO_MAX`), 100 map tiles per batch (unchanged).
- **Per campaign:** 500 MB or 1,000 files (unchanged, `UPLOAD_QUOTA_*` in worker/room.ts). New: 20 new presets per campaign, because each new preset copies every image the campaign uses. Saving over one of its own presets doesn't count.
- **Whole site:** the registry Durable Object counts every file stored in R2 (DM uploads, map tiles, Worldbuilder pictures, preset copies) against an 8 GB ceiling and 25,000 writes a day. It counts the bucket file by file once a day so the total can't drift. Over either limit, uploads stop with a clear message. Everything already uploaded keeps working.
- **Off switch:** the admin console (/admin) shows storage used and has "Turn uploads off". It takes effect at once, with no redeploy.
- **Reads:** files are only served through the Worker at /api/files/ (the bucket is never public). Whole-file reads are cached in Cloudflare's cache for a week, so a table loading the same map reads R2 once. A cache key ignores the query string, so a bot can't force fresh reads with `?x=1`.
- **API:** the existing per-screen limit (300 a minute) and per-address limit (900 a minute) stay. New: a **daily budget of 20,000 calls per address** to campaign rooms. A whole table on one Wi-Fi used about 3,000 on its first night. Over the budget, that address gets "slow down" until 00:00 UTC and costs the rooms nothing more. New campaigns: 20 a day per address, 300 a day site-wide.

Tune with the Worker vars in wrangler.jsonc: `R2_CEILING_GB` (never above 10), `R2_WRITES_PER_DAY` (never above 33,000), `ROOM_CALLS_PER_DAY`.

## Dashboard steps (only the site owner can do these)

1. **Check the bucket isn't public.** R2 → `candlefair-files` → Settings → Public access. "R2.dev subdomain" should say **Disabled**, and no custom domain should be connected. The app never needs either.
2. **Billing alerts.** Account → Notifications → Add → **Usage Based Billing**. Add one for R2 storage (for example 9 GB) and one for R2 Class A operations (for example 900,000). If Billing shows **Budget alerts**, also set one at $1. An alert is the backstop if a limit in code is ever wrong.
3. **WAF rate limiting rule** (on the dnd.calebs.garden zone: Security → WAF → Rate limiting rules. The Free plan includes one rule). Requests it blocks never reach the Worker, so they don't use the daily allowance.
   - Name: `api flood`
   - If incoming requests match (Edit expression): `(starts_with(http.request.uri.path, "/api/") and not starts_with(http.request.uri.path, "/api/files/"))`
   - Counting characteristic: IP
   - When rate exceeds: **100 requests per 10 seconds**
   - Then: **Block**, for 10 seconds
   - A real table peaks at about 15 calls in 10 seconds (all screens reconnecting at once), so this never touches play.
4. **Turn off the workers.dev address and preview URLs.** Workers & Pages → `candlefair` → Settings → Domains & Routes: disable **workers.dev** and **Preview URLs**. Traffic there skips the WAF rule and the cache, so a bot would use it to get around step 3. Before you do it, make sure no TV or bookmark uses the `*.workers.dev` link.
5. **Leave Bot Fight Mode off.** On the Free plan it can't be skipped for some paths, so it would block the Worldbuilder MCP (it calls from Node, not a browser).

## What this can't stop

A bot that keeps under the WAF rule's 10 requests a second can still use up the day's 100,000 Worker requests on Free in a few hours. That is an outage until 00:00 UTC, not a bill. The app's guards make sure it can't also fill storage, wake every room or run up R2. If that ever happens, the next steps are Cloudflare's "Under Attack" mode for the day, or Workers Paid ($5 a month, 10 million requests).
