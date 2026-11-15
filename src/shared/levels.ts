// Character levels: set by the DM (no XP), and a "Level up the party" moment.
import type { GameState, Player } from "./types";

export const LEVEL_MAX = 20;

/** "Brin Ashcombe", or the player's name until they pick a character. */
export function characterName(p: Pick<Player, "name" | "character">): string {
  return p.character?.trim() || p.name;
}

/** The characters at the table tonight. */
export function atTable(g: Pick<GameState, "players">): Player[] {
  return g.players.filter((p) => !p.archived && !p.away);
}

/** Everyone the same level: that level. Otherwise null. */
export function sharedLevel(levels: { level: number }[]): number | null {
  return levels.length && levels.every((l) => l.level === levels[0].level) ? levels[0].level : null;
}

/** "The party reached level 3." or "Brin reached level 4, Ash level 3." */
export function levelLine(g: Pick<GameState, "players">, levels: { playerId: string; level: number }[]): string {
  const name = (id: string) => {
    const p = g.players.find((x) => x.id === id);
    return p ? characterName(p) : "Someone";
  };
  const same = sharedLevel(levels);
  if (same !== null && levels.length > 1) return `The party reached level ${same}.`;
  if (levels.length === 1) return `${name(levels[0].playerId)} reached level ${levels[0].level}.`;
  return `${levels.map((l, i) => (i === 0 ? `${name(l.playerId)} reached level ${l.level}` : `${name(l.playerId)} level ${l.level}`)).join(", ")}.`;
}

/** What the Level up dialog starts with: one more than now (or 2 for anyone without a level yet). */
export function suggestedLevels(g: Pick<GameState, "players">): { playerId: string; from: number | null; level: number }[] {
  return atTable(g).map((p) => ({ playerId: p.id, from: p.level ?? null, level: Math.min(LEVEL_MAX, (p.level ?? 1) + 1) }));
}
