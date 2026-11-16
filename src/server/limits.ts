import { normaliseGameId } from "@/shared/handles";

/**
 * Which screen an /api/ call comes from: address + campaign + name ("DM", "TV",
 * "Sam", or "arrival" for the Arrival page). Each screen gets its own everyday
 * allowance, so one busy phone or a stuck tab on the same Wi-Fi can't use up the
 * DM's.
 */
export function screenKey(ip: string, url: URL): string {
  const game = normaliseGameId(url.searchParams.get("game"));
  const who = (url.searchParams.get("player") ?? (url.searchParams.get("arrival") || url.pathname === "/api/arrival" ? "arrival" : url.pathname === "/api/invite" ? "invite" : "")).trim().toLowerCase().slice(0, 40);
  return `${ip}|${game}|${who}`;
}

/** Shortest code a DM may pick, in letters and numbers (dashes don't count). */
export const PICKED_CODE_MIN = 8;

/**
 * What's wrong with a campaign code the DM typed, or null if it's fine. A picked code is
 * the only lock on the whole campaign, so it must be long enough not to be guessed.
 * (Random codes are made by makeCampaignCode and don't come through here.)
 */
export function pickedCodeProblem(code: string): string | null {
  if (!/^[a-z0-9][a-z0-9-]{2,39}$/.test(code)) return "A campaign code needs 3 to 40 letters, numbers or dashes.";
  if (code.replace(/[^a-z0-9]/g, "").length < PICKED_CODE_MIN) {
    return `A code you pick needs at least ${PICKED_CODE_MIN} letters or numbers, so it can\u2019t be guessed. Leave it blank for a safe random one.`;
  }
  return null;
}
