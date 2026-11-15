import type { GameRoom } from "./room";
import type { LibraryRoom } from "./library";

export interface Env {
  /** One Durable Object per campaign, named by its code. */
  ROOMS: DurableObjectNamespace<GameRoom>;
  /** The shared preset library: one instance, named "library". */
  LIBRARY: DurableObjectNamespace<LibraryRoom>;
  /** The site owner's key for /library/admin (a dashboard secret, 16+ characters). Missing: no admin page. */
  LIBRARY_ADMIN_KEY?: string;
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
