/**
 * Who gets a live connection when a room is busy (worker/room.ts).
 *
 * A connection is counted the moment it opens, before it says who it is, so
 * without this a script that only knows the campaign code could open the
 * room's every slot and leave them idle, and the DM and the players would be
 * turned away. So:
 *
 * - A connection that hasn't sent its key within SIGN_IN_MS is closed.
 * - "Guests" (not yet signed in, the TV, the Arrival page, a wrong key) share
 *   at most GUEST_SOCKETS slots; past that the oldest guest makes room.
 * - When the room is full, the oldest guest makes room for the newcomer.
 *   Only a room full of signed-in DM and player screens turns anyone away.
 * - One address may hold at most PER_ADDRESS_SOCKETS connections to one room;
 *   past that its own oldest guest makes room.
 */

/** Open screens one room will hold. A table needs about ten. */
export const MAX_SOCKETS = 100;
/** Connections from anyone who isn't a signed-in DM or player. */
export const GUEST_SOCKETS = 30;
/** One address (a whole table on one Wi-Fi is about ten screens, plus reconnects). */
export const PER_ADDRESS_SOCKETS = 25;
/** A screen sends its key straight after connecting; one that hasn't by now is closed. */
export const SIGN_IN_MS = 10_000;

/** pending: hasn't sent its key yet. guest: TV, Arrival, or a key that didn't work. member: the DM or a player. */
export type SocketKind = "pending" | "guest" | "member";

export interface SocketInfo {
  kind: SocketKind;
  /** When it connected (ms). Missing on connections made before this was added. */
  at?: number;
  ip?: string;
}

export type Admission = { ok: true; close: number[] } | { ok: false; close: number[]; error: string };

const isGuest = (s: SocketInfo) => s.kind !== "member";

/**
 * A new connection from `ip`: which open ones to close (by index), and whether
 * to let it in. Stale sign-ins are always closed.
 */
export function admit(open: SocketInfo[], ip: string, now: number): Admission {
  const close = new Set<number>();
  open.forEach((s, i) => {
    if (s.kind === "pending" && s.at !== undefined && now - s.at > SIGN_IN_MS) close.add(i);
  });
  const left = () => open.map((s, i) => ({ s, i })).filter((x) => !close.has(x.i));
  // Oldest guests first (a connection with no time is treated as oldest).
  const guests = () =>
    left()
      .filter((x) => isGuest(x.s))
      .sort((a, b) => (a.s.at ?? 0) - (b.s.at ?? 0));
  // This address's own oldest guest makes way first; only an address full of signed-in screens is turned away.
  while (ip && left().filter((x) => x.s.ip === ip).length >= PER_ADDRESS_SOCKETS) {
    const mine = guests().find((x) => x.s.ip === ip);
    if (!mine) return { ok: false, close: [...close], error: "Too many screens from here are connected to this table." };
    close.add(mine.i);
  }
  // The newcomer starts as a guest, so keep the guests under their share.
  while (guests().length >= GUEST_SOCKETS) close.add(guests()[0].i);
  while (left().length >= MAX_SOCKETS) {
    const g = guests()[0];
    if (!g) return { ok: false, close: [...close], error: "This table has too many screens open." };
    close.add(g.i);
  }
  return { ok: true, close: [...close] };
}
