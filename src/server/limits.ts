import { normaliseGameId } from "@/shared/handles";

/**
 * Which screen an /api/ call comes from: address + campaign + name ("DM", "TV",
 * "Sam", or "arrival" for the Arrival page). Each screen gets its own everyday
 * allowance, so one busy phone or a stuck tab on the same Wi-Fi can't use up the
 * DM's.
 */
export function screenKey(ip: string, url: URL): string {
  const game = normaliseGameId(url.searchParams.get("game"));
  const who = (url.searchParams.get("player") ?? (url.searchParams.get("arrival") || url.pathname === "/api/arrival" ? "arrival" : "")).trim().toLowerCase().slice(0, 40);
  return `${ip}|${game}|${who}`;
}
