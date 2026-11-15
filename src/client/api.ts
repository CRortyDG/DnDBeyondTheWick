import { normaliseGameId } from "@/shared/handles";

export const KEY_HEADER = "x-candlefair-key";

export interface Ident {
  game: string;
  /** Raw ?player= value ("DM", "TV", "Sam"), or null on the landing page. */
  player: string | null;
  key: string | null;
  /** A practice screen (?practice=1): it talks to the campaign's practice copy, with the DM key, whatever ?player= says. */
  practice?: boolean;
}

function keySlot(game: string, player: string) {
  return `cf-key:${game}:${player.trim().toLowerCase()}`;
}

function safeGet(k: string): string | null {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
}
function safeSet(k: string, v: string | null) {
  try {
    if (v === null) localStorage.removeItem(k);
    else localStorage.setItem(k, v);
  } catch {}
}

/** Is there a ?game= in the address bar? Without one, the home page offers to start or join a campaign. */
export function hasGameInUrl(): boolean {
  return !!new URL(window.location.href).searchParams.get("game");
}

/**
 * Read ?game= ?player= and the key from the address bar. The key can be in
 * ?key= or after the # (#key=..., what the DM's private link uses, so the key
 * never reaches a server log). Either way it is saved on this device and then
 * removed from the address bar, so it isn't left on screen, in history, or
 * shared by accident.
 */
export function readIdent(): Ident {
  const url = new URL(window.location.href);
  const game = normaliseGameId(url.searchParams.get("game"));
  const player = url.searchParams.get("player");
  const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
  const urlKey = url.searchParams.get("key") || hash.get("key");
  let key: string | null = null;
  // Practice screens (the DM's practice console, its TV and stand-in phones) all use the DM key saved on this device.
  if (player && url.searchParams.get("practice") === "1") {
    if (urlKey) safeSet(keySlot(game, "dm"), urlKey);
    return { game, player, key: urlKey ?? safeGet(keySlot(game, "dm")), practice: true };
  }
  if (player) {
    if (urlKey) {
      safeSet(keySlot(game, player), urlKey);
      url.searchParams.delete("key");
      hash.delete("key");
      const rest = hash.toString();
      window.history.replaceState(null, "", url.pathname + (url.search ? url.search : "") + (rest ? "#" + rest : ""));
    }
    key = urlKey ?? safeGet(keySlot(game, player));
    // A player with no key yet gets one made up on this device and saved, with nothing to pick.
    // The server ties an unlocked name to the first key it sees, so someone who only knows the
    // code and the name can't act as this player. Their other devices sign in with signInLink().
    if (!key && isPlayerName(player)) {
      key = newPlayerKey();
      if (key) safeSet(keySlot(game, player), key);
    }
  }
  return { game, player, key };
}

/** Not the DM or TV screen. */
function isPlayerName(player: string): boolean {
  const p = player.trim().toLowerCase();
  return !!p && p !== "dm" && p !== "tv";
}

function newPlayerKey(): string | null {
  try {
    const b = new Uint8Array(18);
    crypto.getRandomValues(b);
    return btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  } catch {
    return null;
  }
}

/** This player's personal sign-in link: opening it on another phone or computer signs in as them. The key rides after the #, so it never reaches a server log. */
export function signInLink(ident: Ident): string | null {
  if (!ident.player || !ident.key) return null;
  return `${absoluteHref(ident.game, ident.player)}#key=${encodeURIComponent(ident.key)}`;
}

export function rememberKey(ident: Ident, key: string | null) {
  if (ident.player) safeSet(keySlot(ident.game, ident.practice ? "dm" : ident.player), key);
}

/** A practice screen of this campaign: the DM console ("DM"), the TV ("TV") or a stand-in's phone (their handle). */
export function practiceHref(game: string, player: string) {
  return hrefFor(game, player, { practice: "1" });
}

export function hrefFor(game: string, player?: string | null, extra: Record<string, string> = {}) {
  const q = new URLSearchParams();
  q.set("game", game);
  if (player) q.set("player", player);
  for (const [k, v] of Object.entries(extra)) q.set(k, v);
  const s = q.toString();
  return "/" + (s ? "?" + s : "");
}

export function absoluteHref(game: string, player?: string | null, extra: Record<string, string> = {}) {
  return window.location.origin + hrefFor(game, player, extra);
}

function apiUrl(path: string, ident: Ident) {
  const q = new URLSearchParams({ game: ident.game });
  if (ident.player) q.set("player", ident.player);
  if (ident.practice) q.set("practice", "1");
  return `${path}?${q}`;
}

export function authHeaders(ident: Ident): Record<string, string> {
  return ident.key ? { [KEY_HEADER]: ident.key } : {};
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
  }
}

export async function api<T>(path: string, ident: Ident, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(apiUrl(path, ident), {
      ...init,
      cache: "no-store",
      headers: { ...(init.body && typeof init.body === "string" ? { "Content-Type": "application/json" } : {}), ...authHeaders(ident), ...(init.headers ?? {}) },
    });
  } catch {
    // The browser's own words here are "Failed to fetch" or "Load failed".
    throw new Error("No connection right now. Check the Wi-Fi and try again.");
  }
  const data = (await res.json().catch(() => ({}))) as T & { error?: string; code?: string };
  if (!res.ok) throw new ApiError(data.error || `Request failed (${res.status})`, res.status, data.code);
  return data;
}

/** The live connection to the campaign's room. */
export function liveUrl(game: string, extra: Record<string, string> = {}) {
  const q = new URLSearchParams({ game, ...extra });
  return `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/api/live?${q}`;
}

/** The DM's private link: the key sits after the #, so it is never sent to the server. */
export function dmLink(game: string, key: string) {
  return `${window.location.origin}${hrefFor(game, "DM")}#key=${encodeURIComponent(key)}`;
}
