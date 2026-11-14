# Capacity measurement (local only)

These scripts back `CAPACITY_REPORT.md`. They never talk to production: `sim.ts` refuses any `--base` that isn't localhost, and `wrangler.jsonc` here is a separate config (`candlefair-capacity-local`) meant only for `wrangler dev`. **Never deploy it.**

| File | What it does |
| --- | --- |
| `wrangler.jsonc` | Local config. It has the same bindings as the app, with the room class swapped for a metered subclass. |
| `worker.ts` | Imports the real front-door Worker and the real `GameRoom`, and counts Worker requests, room requests, incoming socket messages, alarms, SQLite rows read and written, and event wall time. It adds `/__metrics`, `/__metrics/reset`, `/__evict` (mimics hibernation eviction) and `/__ddl`. |
| `sim.ts` | Replays one 4-hour night with 7 WebSocket clients and prints the bill-relevant counts as JSON. |
| `cpu-bench.ts` | Room CPU per command, push and view, at growing document sizes. It runs in Node against the in-memory store. |
| `model.ts` | Turns per-session numbers into free-tier sessions per day and Workers Paid cost per month. |
| `results/` | The outputs quoted in the report. |

```sh
npm ci
npx wrangler dev -c scripts/capacity/wrangler.jsonc --port 8799
# in another shell
npx tsx scripts/capacity/sim.ts --hours 4                 # rooms evicted before every event (realistic)
npx tsx scripts/capacity/sim.ts --hours 4 --warm          # rooms stay in memory (best case)
npx tsx scripts/capacity/sim.ts --hours 4 --ledger 1300   # a campaign ~20 nights in
npx tsx scripts/capacity/sim.ts --hours 4 --wakes 12      # phones that sleep more often
npx tsx scripts/capacity/cpu-bench.ts
npx tsx scripts/capacity/model.ts [results/sim-cold.json]
```

Campaign creation is rate-limited to 5 a minute, and each `sim.ts` run creates one campaign.
