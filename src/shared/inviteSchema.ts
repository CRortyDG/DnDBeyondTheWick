// Session invite commands (all DM-only). Spread into the DM command list in commands.ts.
import { z } from "zod";
import { ADDRESS_MAX, BLURB_MAX, PLACE_MAX, SEATS_MAX, TITLE_MAX } from "./invites";

const id = z.string().min(1).max(64);
const text = (max: number) => z.string().max(max);
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Dates look like 2026-11-22.");
const clock = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Times look like 18:30.");
const moment = z.number().int().min(0).max(8_640_000_000_000);
/** An uploaded picture or one of the site's own: never another site's address. */
const art = z.union([z.literal(""), z.string().max(300).regex(/^\/(api\/files|arrival|art)\/[A-Za-z0-9/_.-]+$/)]);

const inviteFields = z.object({
  title: text(TITLE_MAX),
  date: day,
  time: clock,
  endTime: z.union([z.literal(""), clock]),
  startsAt: moment,
  endsAt: moment.nullable(),
  place: text(PLACE_MAX),
  address: text(ADDRESS_MAX),
  blurb: text(BLURB_MAX),
  art,
  seats: z.number().int().min(1).max(SEATS_MAX),
  waitlist: z.boolean(),
  partyId: id.nullable(),
  showWho: z.boolean(),
  approve: z.boolean(),
  closesAt: moment.nullable(),
  storyDateId: id.nullable(),
});

export type InviteFields = z.infer<typeof inviteFields>;

export const inviteDmCommands = [
  z.object({ type: z.literal("invite.add"), invite: inviteFields.partial().extend({ title: text(TITLE_MAX), date: day, time: clock, startsAt: moment }), holdIds: z.array(id).max(SEATS_MAX).optional() }),
  z.object({ type: z.literal("invite.update"), inviteId: id, patch: inviteFields.partial() }),
  z.object({ type: z.literal("invite.remove"), inviteId: id }),
  /** Close claims, open them again, or cancel the night (everyone's page says so). */
  z.object({ type: z.literal("invite.status"), inviteId: id, status: z.enum(["open", "closed", "cancelled"]) }),
  /** in: give them a seat · wait: back to the waitlist · remove: take them off · up/down: move in the waitlist · told: the DM sent the "you're in" message · ok/no: approve or turn down a claim. */
  z.object({ type: z.literal("invite.entry"), inviteId: id, entryId: id, action: z.enum(["in", "wait", "remove", "up", "down", "told", "ok", "no"]) }),
  /** Save a seat for one of the DM's players, or let it go. */
  z.object({ type: z.literal("invite.hold"), inviteId: id, playerId: id, held: z.boolean() }),
  /** The same invite on another night. Held seats come along; everyone else claims again. */
  z.object({ type: z.literal("invite.duplicate"), inviteId: id, date: day, time: clock, endTime: z.union([z.literal(""), clock]).optional(), startsAt: moment, endsAt: moment.nullable().optional() }),
];
