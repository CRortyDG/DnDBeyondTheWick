// The site owner's admin console: which campaigns exist, whether anyone is
// using them, and each one's story, read-only. Nothing here changes a game.
//
// The Worker keeps a registry of campaign codes (a Durable Object of its own,
// worker/registry.ts), because Durable Objects can't be listed by name. Each
// campaign's room answers for itself: a summary (counts, dates) and its story
// (players, sessions, the Chronicle, Discover). No keys or key hashes ever
// leave a room this way.

export const ADMIN_HEADER = "x-candlefair-admin";
/** The admin key must be at least this long, or the console stays off. */
export const ADMIN_KEY_MIN = 32;
/** Rooms asked in one request (Workers allow a few dozen calls out per request on the free plan). */
export const ADMIN_BATCH = 40;

export type AdminTag = "mine" | "test" | "real";
/** How the registry learned of a campaign. */
export type FoundBy = "create" | "images" | "cloudflare" | "device";

/** One campaign in the registry. */
export interface RegistryRow {
  code: string;
  /** When the registry first heard of it (the creation time, for "create"). */
  addedAt: number;
  foundBy: FoundBy;
  /** What it was started from ("blank", "marrowmere", "preset:..."), when made after the registry existed. */
  from?: string;
  /** Cloudflare's country for the address that made it. */
  country?: string;
  /** A salted hash of the address that made it (only comparable inside the registry). */
  net?: string;
  tag?: AdminTag | null;
  note?: string;
}

/** A registry row as the console gets it: the address hash swapped for "made from the network you're on now". */
export type ListedRow = Omit<RegistryRow, "net"> & { sameNetwork: boolean };

/** What a room says about itself. */
export interface CampaignSummary {
  code: string;
  exists: boolean;
  name: string;
  town: string;
  origin: string;
  createdAt: number;
  /** The last save (any change to the game). */
  touchedAt: number | null;
  players: number;
  /** Players who have opened their phone at least once. */
  playersSeen: number;
  playerNames: string[];
  lastSeenAt: number | null;
  sessions: number;
  sessionsEnded: number;
  notes: number;
  found: number;
  entries: number;
  fights: number;
  rolls: number;
  jobs: number;
  invites: number;
  /** Days the room was used (counted since 2026-11-15, when usage counting began), newest last, at most 60. */
  activeDays: string[];
  activeDayCount: number;
  /** Screens connected right now. */
  openScreens: number;
  imageFiles: number;
  storageBytes: number;
}

export interface StoryPlayer {
  name: string;
  character: string;
  level: number | null;
  className: string;
  joinedAt: number;
  lastSeenAt: number | null;
  archived: boolean;
  via: string;
}
export interface StorySession {
  number: number;
  title: string;
  startedAt: number;
  endedAt: number | null;
  attendees: string[];
  recap: string;
}
export interface StoryNote {
  chapter: number | null;
  author: string;
  text: string;
  tags: string[];
  createdAt: number;
  hidden: boolean;
  starred: boolean;
}
export interface StoryEntry {
  kind: string;
  name: string;
  stage: string;
  title: string;
  summary: string;
}

/** A campaign's story, read-only. */
export interface CampaignStory {
  summary: CampaignSummary;
  players: StoryPlayer[];
  sessions: StorySession[];
  notes: StoryNote[];
  entries: StoryEntry[];
  jobs: { title: string; status: string }[];
  episodes: string[];
  threads: string[];
}

export interface RoomFacts {
  touchedAt: number | null;
  activeDays: string[];
  openScreens: number;
  imageFiles: number;
  storageBytes: number;
}

// ---------------------------------------------------------------- telling yours from theirs

export type Guess = "yours" | "test" | "real" | "idle" | "unsure";

const TESTY = /\b(test|tests|testing|demo|check|ignore|sample|example|scratch|asdf|qwerty|delete ?me|untitled|practice|try|trial|dummy|foo|bar)\b/i;
const DAY = 24 * 60 * 60 * 1000;

/**
 * A guess at what a campaign is, with the reasons, for campaigns not tagged yet.
 * onDevice: this browser holds its DM key. sameNetwork: made from the address the console is on now.
 */
export function guess(s: CampaignSummary, ctx: { onDevice?: boolean; sameNetwork?: boolean; now?: number } = {}): { guess: Guess; reasons: string[] } {
  const now = ctx.now ?? Date.now();
  const reasons: string[] = [];
  if (!s.exists) return { guess: "idle", reasons: ["Nothing saved in this room (deleted after 6 months idle, or never started)"] };
  if (ctx.onDevice) reasons.push("This browser has its DM key");
  if (ctx.sameNetwork) reasons.push("Made from the network you're on now");
  if (ctx.onDevice || ctx.sameNetwork) return { guess: "yours", reasons };

  let test = 0;
  let real = 0;
  if (TESTY.test(s.name)) {
    test += 2;
    reasons.push(`The name "${s.name}" sounds like a test`);
  }
  const premade = s.origin === "marrowmere" || s.origin === "candlefair";
  if (premade && s.sessionsEnded === 0) {
    test += 1;
    reasons.push(`The ${s.origin === "marrowmere" ? "Marrowmere" : "Candlefair"} premade, never played through a session`);
  }
  if (s.players === 0) {
    test += 1;
    reasons.push("No players ever joined");
  }
  const lastActive = Math.max(s.touchedAt ?? 0, s.lastSeenAt ?? 0, s.createdAt);
  if (s.createdAt && lastActive - s.createdAt < 60 * 60 * 1000 && now - lastActive > 2 * DAY) {
    test += 1;
    reasons.push("Used for under an hour, then left");
  }
  if (s.playersSeen >= 2) {
    real += 2;
    reasons.push(`${s.playersSeen} players opened their phones`);
  }
  if (s.sessionsEnded >= 1 && s.playersSeen >= 2) {
    real += 1;
    reasons.push(`${s.sessionsEnded} session${s.sessionsEnded === 1 ? "" : "s"} run with players`);
  }
  if (s.activeDayCount >= 3) {
    real += 1;
    reasons.push(`Used on ${s.activeDayCount} different days`);
  }
  if (s.notes >= 3) {
    real += 1;
    reasons.push(`${s.notes} Chronicle notes`);
  }
  if (real >= 3 && real > test) return { guess: "real", reasons };
  if (test >= 2 && real <= 1) return { guess: "test", reasons };
  if (now - lastActive > 30 * DAY && real < 2) return { guess: "idle", reasons: [...reasons, "Nothing in over a month"] };
  return { guess: "unsure", reasons };
}

/** When anything last happened in it. */
export function lastActiveOf(s: CampaignSummary): number {
  const day = s.activeDays.length ? Date.parse(s.activeDays[s.activeDays.length - 1] + "T12:00:00Z") : 0;
  return Math.max(s.touchedAt ?? 0, s.lastSeenAt ?? 0, s.createdAt, day);
}
