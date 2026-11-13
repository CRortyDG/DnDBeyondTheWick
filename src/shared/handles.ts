// URL names: ?player=Player1, ?player=player 1 and ?player=PLAYER-1 are the same person.

export const RESERVED_HANDLES = new Set(["dm", "tv", "admin", "display", "everyone", "party"]);

export function normaliseHandle(raw: string): string {
  return raw
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 24);
}

export function isReservedHandle(handle: string): boolean {
  return RESERVED_HANDLES.has(handle);
}

/** A friendly display name from what someone typed: "sam" -> "Sam", "player1" -> "Player 1". */
export function displayNameFrom(raw: string): string {
  const cleaned = raw.trim().replace(/[_-]+/g, " ").replace(/\s+/g, " ").slice(0, 32);
  const spaced = cleaned.replace(/([a-zA-Z])(\d)/g, "$1 $2");
  return spaced.replace(/\b\p{L}/gu, (c) => c.toUpperCase()) || "Traveller";
}

export function normaliseGameId(raw: string | null | undefined): string {
  const id = (raw ?? "").toLowerCase().replace(/[^a-z0-9-]+/g, "").slice(0, 40);
  return id || "candlefair";
}
