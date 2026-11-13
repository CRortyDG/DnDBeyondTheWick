"use client";

import { normaliseGameId } from "@/shared/handles";

export const KEY_HEADER = "x-candlefair-key";

export interface Ident {
  game: string;
  /** Raw ?player= value ("DM", "TV", "Sam"), or null on the landing page. */
  player: string | null;
  key: string | null;
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

/**
 * Read ?game= ?player= ?key= from the address bar. A key in the URL is saved
 * on this device and then removed from the address bar, so it isn't left on
 * screen, in history, or shared by accident.
 */
export function readIdent(): Ident {
  const url = new URL(window.location.href);
  const game = normaliseGameId(url.searchParams.get("game"));
  const player = url.searchParams.get("player");
  const urlKey = url.searchParams.get("key");
  let key: string | null = null;
  if (player) {
    if (urlKey) {
      safeSet(keySlot(game, player), urlKey);
      url.searchParams.delete("key");
      window.history.replaceState(null, "", url.pathname + (url.search ? url.search : "") + url.hash);
    }
    key = urlKey ?? safeGet(keySlot(game, player));
  }
  return { game, player, key };
}

export function rememberKey(ident: Ident, key: string | null) {
  if (ident.player) safeSet(keySlot(ident.game, ident.player), key);
}

export function hrefFor(game: string, player?: string | null, extra: Record<string, string> = {}) {
  const q = new URLSearchParams();
  if (game !== "candlefair") q.set("game", game);
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
  const res = await fetch(apiUrl(path, ident), {
    ...init,
    cache: "no-store",
    headers: { ...(init.body && typeof init.body === "string" ? { "Content-Type": "application/json" } : {}), ...authHeaders(ident), ...(init.headers ?? {}) },
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string; code?: string };
  if (!res.ok) throw new ApiError(data.error || `Request failed (${res.status})`, res.status, data.code);
  return data;
}

export function streamUrl(ident: Ident) {
  return `/api/stream?game=${encodeURIComponent(ident.game)}`;
}
