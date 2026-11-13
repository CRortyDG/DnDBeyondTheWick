// Create (or reset) a game with Candlefair's scenes, Players 1-4, shops and items.
//
//   npm run seed                      -> creates "candlefair" if it doesn't exist
//   npm run seed -- --game oneshot    -> another game id
//   npm run seed -- --reset           -> wipe and recreate (asks no questions!)
//
// Uses Upstash if KV_REST_API_URL/TOKEN (or UPSTASH_REDIS_REST_URL/TOKEN) are set,
// otherwise the local file store in .data/. Pull production env with `vercel env pull`.
import { normaliseGameId } from "../src/shared/handles";
import { seedGame } from "../src/shared/seed";
import { getStore } from "../src/server/store";

const args = process.argv.slice(2);
const gi = args.indexOf("--game");
const game = normaliseGameId(gi >= 0 ? args[gi + 1] : "candlefair");
const reset = args.includes("--reset");

const store = getStore();
const { state } = await store.read(game);
if (state && !reset) {
  console.log(`"${game}" already exists (${store.kind} store). Use --reset to wipe it and start again.`);
  process.exit(0);
}
const v = await store.overwrite(game, seedGame(game), []);
await store.publish(game, v);
console.log(`${reset && state ? "Reset" : "Created"} "${game}" in the ${store.kind} store.`);
console.log(`DM view: /?${game === "candlefair" ? "" : `game=${game}&`}player=DM&key=<your DM_KEY>`);
