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
}
