import type { GameRoom } from "./room";

export interface Env {
  /** One Durable Object per campaign, named by its code. */
  ROOMS: DurableObjectNamespace<GameRoom>;
  /** Images the DM uploads, stored as <campaign code>/<random>.<ext>. */
  FILES: R2Bucket;
  /** The built app (Vite output). */
  ASSETS: Fetcher;
  /** Limits how fast one address can create campaigns. Optional: absent in some local setups. */
  CREATE_LIMIT?: RateLimit;
  /** Every /api/ call and live connection, per address. Generous: a whole table can share one Wi-Fi. */
  API_LIMIT?: RateLimit;
  /** Misses per address (unknown code, wrong key or name lock, dead Arrival link). Going over shuts the address out for a while. */
  GUESS_LIMIT?: RateLimit;
  /** Image uploads per address. */
  UPLOAD_LIMIT?: RateLimit;
}
