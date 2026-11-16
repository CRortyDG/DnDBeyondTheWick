// Session invites: one link per game night. People open it, type a name and
// claim a seat; the first N get in and the rest wait in line. Giving a seat
// back moves the first person in line up, until a little before the start.
//
// The invite's page (/i/<code>) gets projectInvite(): the invite's public
// parts, and the caller's own seat only when their phone holds its key.

import type { GameState, Invite, InviteEntry, Player } from "./types";
import { partiesOf } from "./world";

export const INVITES_MAX = 60;
export const SEATS_MAX = 8;
export const WAITLIST_MAX = 20;
/** Everyone ever on one invite, those who gave their seat back included. */
export const ENTRIES_MAX = 60;
export const NAME_MAX = 32;
export const CHARACTER_MAX = 40;
export const TITLE_MAX = 80;
export const PLACE_MAX = 80;
export const ADDRESS_MAX = 160;
export const BLURB_MAX = 400;
/** The waitlist stops moving up by itself this long before the start; then the DM decides. */
export const AUTO_MOVE_STOP_MS = 2 * 60 * 60 * 1000;
/** Ended invites older than this are trimmed down to their history line. */
export const INVITE_KEEP_MS = 60 * 24 * 60 * 60 * 1000;

export function invitesOf(g: Pick<GameState, "invites">): Invite[] {
  return g.invites ?? [];
}

/** Valid invite link codes: what makeToken produces. */
export function isInviteCode(s: string | null | undefined): s is string {
  return !!s && /^[A-Za-z0-9]{8,32}$/.test(s);
}

/** Valid keys a phone keeps for its seat. */
export function isSeatKey(s: string | null | undefined): s is string {
  return !!s && /^[A-Za-z0-9_-]{16,128}$/.test(s);
}

export function inviteByCode(g: GameState, code: string): Invite | null {
  if (!isInviteCode(code)) return null;
  return invitesOf(g).find((x) => x.code === code) ?? null;
}

export function invitePath(gameId: string, code: string): string {
  return `/i/${code}` + (gameId === "candlefair" ? "" : `?game=${encodeURIComponent(gameId)}`);
}

export const seated = (inv: Invite) => inv.entries.filter((e) => e.state === "in");
export const waiting = (inv: Invite) => inv.entries.filter((e) => e.state === "wait").sort((a, b) => a.at - b.at);
export const asking = (inv: Invite) => inv.entries.filter((e) => e.state === "ask").sort((a, b) => a.at - b.at);
export const openSeats = (inv: Invite) => Math.max(0, inv.seats - seated(inv).length);

/** Claims are no longer taken: closed, cancelled, or past the closing time. */
export function claimsClosed(inv: Invite, now: number): boolean {
  return inv.status !== "open" || now >= (inv.closesAt ?? inv.startsAt);
}

/** The waitlist moves up by itself until a little before the start. */
export function autoMoves(inv: Invite, now: number): boolean {
  return inv.status === "open" && now < inv.startsAt - AUTO_MOVE_STOP_MS;
}

/** Over: the session it became has started, or it's long past. */
export function inviteOver(inv: Invite, now: number): boolean {
  return !!inv.sessionId || inv.status === "cancelled" || now > (inv.endsAt ?? inv.startsAt + 6 * 3600_000);
}

/** Tonight's invite: one not yet played or cancelled that starts within 12 hours either side of now. The DM's "Start session" offers it. */
export function tonightsInvite(g: Pick<GameState, "invites">, now: number): Invite | null {
  const near = invitesOf(g).filter((x) => !x.sessionId && x.status !== "cancelled" && Math.abs(x.startsAt - now) <= 12 * 3600_000);
  return near.sort((a, b) => Math.abs(a.startsAt - now) - Math.abs(b.startsAt - now))[0] ?? null;
}

/** "Priya" from "Priya Sharma". */
export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? "";
}

/** The person a seat is, shown to the DM: their player's current name if they have one. */
export function entryName(g: Pick<GameState, "players">, e: InviteEntry): string {
  const p = e.playerId ? g.players.find((x) => x.id === e.playerId) : undefined;
  return p?.name ?? e.name;
}

/** Text for the DM to send. */
export const DEFAULT_INVITE_TEXT = "{title} on {when}. {seats} seats, first come first served. Grab one here: {link}";

export function whenText(inv: Pick<Invite, "date" | "time">): string {
  const d = new Date(`${inv.date}T00:00:00Z`);
  const day = isNaN(+d) ? inv.date : d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", timeZone: "UTC" });
  return `${day} at ${timeText(inv.time)}`;
}

/** "18:30" → "6:30 PM". */
export function timeText(t: string | undefined): string {
  const m = /^(\d{1,2}):(\d{2})$/.exec(t ?? "");
  if (!m) return t ?? "";
  const h = Number(m[1]);
  return `${h % 12 || 12}:${m[2]} ${h < 12 ? "AM" : "PM"}`;
}

export function inviteText(inv: Invite, link: string): string {
  return DEFAULT_INVITE_TEXT.replace("{title}", inv.title)
    .replace("{when}", whenText(inv))
    .replace("{seats}", String(inv.seats))
    .replace("{link}", link);
}

/** The message for someone who moved up off the waitlist. */
export function movedUpText(inv: Invite, name: string, link: string): string {
  return `Good news ${firstName(name)}, a seat opened up for ${inv.title} on ${whenText(inv)} and it's yours! Details: ${link}`;
}

/** A reminder for the group chat the day before. */
export function reminderText(inv: Invite, link: string): string {
  return `Reminder: ${inv.title} is ${whenText(inv)}${inv.place ? ` at ${inv.place}` : ""}. If you can't make it, tap "Can't make it" so the next person gets your seat: ${link}`;
}

// ---------------------------------------------------------------------------
// The invite page's view.

export type InviteStatus = "open" | "full" | "closed" | "cancelled" | "started";

export interface InviteView {
  version: number;
  invite: {
    code: string;
    title: string;
    date: string;
    time: string;
    endTime?: string;
    startsAt: number;
    endsAt?: number;
    place: string;
    blurb: string;
    art?: string;
    seats: number;
    taken: number;
    waiting: number;
    waitlist: boolean;
    approve: boolean;
    status: InviteStatus;
    /** First names of who's coming, when the DM shows them. */
    who?: string[];
    /** A party invite: its name. Only its characters can claim. */
    party?: string;
    /** The campaign's name, for the page's small print. */
    campaign: string;
  };
  /** The caller's own seat, when their phone holds its key. */
  me: InviteMe | null;
  /** A player who already plays in this campaign on this phone (from a saved sign-in): claim in one tap. */
  known?: { name: string; character?: string };
}

export interface InviteMe {
  state: InviteEntry["state"];
  name: string;
  character?: string;
  /** Place in line, from 1. */
  place?: number;
  /** Seat holders only. */
  address?: string;
  /** Seat holders only: their player page. */
  tableHref?: string;
  /** The key this phone keeps for its seat also signs it in as that player: the page adds it to tableHref (after the #). */
  seatSignsIn?: boolean;
  /** Seat holders only: their Arrival intro and seat page. */
  arrivalHref?: string;
  /** Moved up off the waitlist (shows "You're in! A seat opened up."). */
  movedUp?: boolean;
  /** The DM saved this seat for them. */
  held?: boolean;
}

function inviteStatus(inv: Invite, now: number): InviteStatus {
  if (inv.status === "cancelled") return "cancelled";
  if (inv.sessionId) return "started";
  if (claimsClosed(inv, now)) return "closed";
  return openSeats(inv) > 0 ? "open" : "full";
}

/**
 * What /api/invite sends: the invite's public parts. The private address,
 * other people's keys and seats, and anything else in the game never go out;
 * the caller's own seat comes back only with its key (entry) or as the
 * player whose saved sign-in matched (player).
 */
export function projectInvite(g: GameState, version: number, inv: Invite, opts: { entry?: InviteEntry | null; player?: Player | null; now?: number }): InviteView {
  const now = opts.now ?? Date.now();
  const party = inv.partyId ? partiesOf(g).find((x) => x.id === inv.partyId) : undefined;
  const ins = seated(inv);
  const e = opts.entry ?? (opts.player ? (inv.entries.find((x) => x.playerId === opts.player!.id && x.state !== "removed") ?? null) : null);
  let me: InviteMe | null = null;
  if (e) {
    const p = e.playerId ? g.players.find((x) => x.id === e.playerId && !x.archived) : undefined;
    me = { state: e.state, name: p?.name ?? e.name, ...(e.character || p?.character ? { character: p?.character || e.character } : {}) };
    if (e.state === "wait") me.place = waiting(inv).findIndex((x) => x.id === e.id) + 1;
    if (e.state === "ask") me.place = asking(inv).findIndex((x) => x.id === e.id) + 1;
    if (e.state === "in") {
      if (inv.address) me.address = inv.address;
      if (e.movedUpAt) me.movedUp = true;
      if (e.held) me.held = true;
      if (p) {
        const q = new URLSearchParams({ game: g.id, player: p.handle }).toString();
        const token = p.arrival?.token;
        // The player's key is their Arrival link code (as on the Arrival page), after the # so it never reaches a log.
        me.tableHref = `/?${q}` + (token && p.arrival?.keyed ? `#key=${encodeURIComponent(token)}` : "");
        if (e.keyHash && p.keyHash === e.keyHash) me.seatSignsIn = true;
        if (token) me.arrivalHref = `/arrive/${token}` + (g.id === "candlefair" ? "" : `?game=${encodeURIComponent(g.id)}`);
      }
    }
  }
  const known = !e && opts.player && !opts.player.archived ? { name: opts.player.name, ...(opts.player.character ? { character: opts.player.character } : {}) } : undefined;
  return {
    version,
    invite: {
      code: inv.code,
      title: inv.title,
      date: inv.date,
      time: inv.time,
      ...(inv.endTime ? { endTime: inv.endTime } : {}),
      startsAt: inv.startsAt,
      ...(inv.endsAt ? { endsAt: inv.endsAt } : {}),
      place: inv.place,
      blurb: inv.blurb,
      ...(inv.art ? { art: inv.art } : {}),
      seats: inv.seats,
      taken: ins.length,
      waiting: waiting(inv).length + asking(inv).length,
      waitlist: inv.waitlist,
      approve: inv.approve,
      status: inviteStatus(inv, now),
      ...(inv.showWho ? { who: ins.map((x) => firstName(entryName(g, x))).filter(Boolean) } : {}),
      ...(party ? { party: party.name } : {}),
      campaign: g.name,
    },
    me,
    ...(known ? { known } : {}),
  };
}

// ---------------------------------------------------------------------------
// Calendar: a file the phone's calendar opens, with its own reminder the day before.

function icsTime(ms: number): string {
  return new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function icsText(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

export function calendarFile(v: InviteView["invite"], url: string, where: string, now = Date.now()): string {
  const end = v.endsAt ?? v.startsAt + 4 * 3600_000;
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Candlefair//Invite//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${v.code}@candlefair`,
    `DTSTAMP:${icsTime(now)}`,
    `DTSTART:${icsTime(v.startsAt)}`,
    `DTEND:${icsTime(end)}`,
    `SUMMARY:${icsText(v.title)}`,
    ...(where ? [`LOCATION:${icsText(where)}`] : []),
    `DESCRIPTION:${icsText(`${v.blurb ? v.blurb + "\n\n" : ""}Your seat: ${url}`)}`,
    `URL:${url}`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${icsText(`${v.title} is tomorrow`)}`,
    "TRIGGER:-P1D",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

/** Add to Google Calendar, no sign-in needed on our side. */
export function googleCalendarLink(v: InviteView["invite"], url: string, where: string): string {
  const end = v.endsAt ?? v.startsAt + 4 * 3600_000;
  const q = new URLSearchParams({
    action: "TEMPLATE",
    text: v.title,
    dates: `${icsTime(v.startsAt)}/${icsTime(end)}`,
    details: `${v.blurb ? v.blurb + "\n\n" : ""}Your seat: ${url}`,
    ...(where ? { location: where } : {}),
  });
  return `https://calendar.google.com/calendar/render?${q}`;
}
