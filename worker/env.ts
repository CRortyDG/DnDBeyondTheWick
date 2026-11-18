import type { GameRoom } from "./room";
import type { Registry } from "./registry";

export interface Env {
  /** One Durable Object per campaign, named by its code. */
  ROOMS: DurableObjectNamespace<GameRoom>;
  /** The list of campaign codes, for the admin console (one object, "admin:registry"). */
  REGISTRY: DurableObjectNamespace<Registry>;
  /** The admin console's key (a Worker secret, 32+ characters). Missing: the console is off. */
  ADMIN_KEY?: string;
  /** Optional, for the console's full scan of older campaigns: a Cloudflare API token that can read Durable Objects, and the account id. */
  CF_API_TOKEN?: string;
  CF_ACCOUNT_ID?: string;
  /** Images the DM uploads, stored as <campaign code>/<random>.<ext>. */
  FILES: R2Bucket;
  /** The built app (Vite output). */
  ASSETS: Fetcher;
  /** Limits how fast one address can create campaigns. Optional: absent in some local setups. */
  CREATE_LIMIT?: RateLimit;
  /** Every /api/ call and live connection, per screen (address + campaign + name). */
  API_LIMIT?: RateLimit;
  /** Every /api/ call and live connection, per address: the ceiling for a whole table on one Wi-Fi. */
  ADDRESS_LIMIT?: RateLimit;
  /** Misses per address (unknown code, wrong key or name lock, dead Arrival link). Going over shuts the address out for a while. */
  GUESS_LIMIT?: RateLimit;
  /** Image uploads per address. */
  UPLOAD_LIMIT?: RateLimit;
}
