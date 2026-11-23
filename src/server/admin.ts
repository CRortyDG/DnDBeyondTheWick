import { z } from "zod";
import { sameHash, sha256 } from "./auth";
import { json, miss } from "./api";
import { ADMIN_BATCH, ADMIN_HEADER, ADMIN_KEY_MIN, type AdminTag, type CampaignStory, type CampaignSummary, type FoundBy, type ListedRow, type RegistryRow } from "@/shared/admin";
import { normaliseGameId } from "@/shared/handles";
import type { StorageStatus } from "@/shared/admin";

/**
 * The site owner's admin console, on the server: /api/admin/*. Only the admin
 * key (a Worker secret, ADMIN_KEY) gets in; with no key set, the routes don't
 * exist. Read-only for games: the only writes are the registry's own labels
 * (mine / test / real, a note) and adding codes it didn't know about.
 */

/** The registry of campaign codes (worker/registry.ts in production). */
export interface Registry {
  list(ip: string): Promise<ListedRow[]>;
  add(rows: Omit<RegistryRow, "addedAt">[], at: number): Promise<number>;
  label(code: string, tag: AdminTag | null, note: string | undefined): Promise<boolean>;
  /** The site's R2 storage tally and limits (src/server/spend.ts). Missing: not tracked here. */
  storageStatus?(): Promise<StorageStatus>;
  storageSetOff?(off: boolean): Promise<StorageStatus>;
  storageRecount?(): Promise<StorageStatus>;
}

/** What a room tells the console (worker/room.ts). */
export interface AdminRoom {
  adminSummary(): Promise<CampaignSummary & { practice: boolean; game: string | null }>;
  adminStory(): Promise<CampaignStory | null>;
}

export interface AdminDeps {
  /** The ADMIN_KEY secret. Missing or short: the console is off. */
  secret: string | undefined;
  registry: Registry;
  room(code: string): AdminRoom;
  /** A room by its Durable Object id (the Cloudflare scan finds ids, not names). */
  roomById?(id: string): AdminRoom;
  /** Campaign codes that have images in R2, a page at a time. */
  imageCodes?(cursor: string | undefined): Promise<{ codes: string[]; cursor?: string }>;
  /** Every room's id, from the Cloudflare API (needs CF_API_TOKEN and CF_ACCOUNT_ID). Missing: not set up. */
  cloudflareIds?(cursor: string | undefined): Promise<{ ids: string[]; cursor?: string }>;
  ip: string;
  now?: number;
}

export function isAdminPath(path: string): boolean {
  return path === "/api/admin" || path.startsWith("/api/admin/");
}

export function adminOn(secret: string | undefined): secret is string {
  return typeof secret === "string" && secret.length >= ADMIN_KEY_MIN;
}

/** Constant time, whatever the lengths. */
export function isAdminKey(given: string | null, secret: string | undefined): boolean {
  if (!adminOn(secret) || !given) return false;
  return sameHash(sha256(given.slice(0, 500)), sha256(secret));
}

const CODE = z.string().min(1).max(40);
const codesBody = z.object({ codes: z.array(CODE).min(1).max(ADMIN_BATCH) });
const labelBody = z.object({ code: CODE, tag: z.enum(["mine", "test", "real"]).nullable(), note: z.string().max(500).optional() });
const scanBody = z.object({ source: z.enum(["images", "cloudflare"]), cursor: z.string().max(2000).optional() });
const storageBody = z.object({ uploads: z.enum(["on", "off"]).optional(), recount: z.literal(true).optional() });
const addBody = z.object({ codes: z.array(CODE).min(1).max(ADMIN_BATCH), foundBy: z.enum(["device", "images"]).optional() });

async function body<T>(req: Request, schema: z.ZodType<T>): Promise<T | null> {
  const text = await req.text().catch(() => "");
  if (text.length > 32 * 1024) return null;
  try {
    const r = schema.safeParse(text ? JSON.parse(text) : {});
    return r.success ? r.data : null;
  } catch {
    return null;
  }
}

const bad = (error: string, status = 400) => json({ error }, status);

/** Ask several rooms at once, each on its own (one broken room doesn't spoil the rest). */
async function summaries(rooms: AdminRoom[]) {
  return Promise.all(rooms.map((r) => r.adminSummary().catch(() => null)));
}

/** Add the codes that are real live campaigns (not empty rooms, not practice copies). Returns how many were added. */
async function probeAndAdd(deps: AdminDeps, found: { room: AdminRoom; code?: string }[], foundBy: FoundBy, now: number) {
  const sums = await summaries(found.map((f) => f.room));
  const rows: Omit<RegistryRow, "addedAt">[] = [];
  for (const s of sums) {
    if (!s || !s.exists || s.practice) continue;
    const code = s.game ?? s.code;
    if (code) rows.push({ code, foundBy });
  }
  const added = rows.length ? await deps.registry.add(rows, now) : 0;
  return { checked: found.length, campaigns: rows.length, added };
}

export async function handleAdmin(req: Request, deps: AdminDeps): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname.replace(/\/+$/, "");
  const now = deps.now ?? Date.now();
  if (!adminOn(deps.secret)) return miss(json({ error: "Not found." }, 404));
  if (!isAdminKey(req.headers.get(ADMIN_HEADER), deps.secret)) return miss(json({ error: "That admin key isn't right.", code: "bad-key" }, 401));
  // Only the console's own page: no other site can drive these, even with the key.
  if (req.headers.get("Sec-Fetch-Site") === "cross-site") return bad("Not from another site.", 403);

  if (path === "/api/admin/campaigns" && req.method === "GET") {
    const rows = await deps.registry.list(deps.ip);
    return json({ rows, scan: { images: !!deps.imageCodes, cloudflare: !!deps.cloudflareIds } });
  }
  if (path === "/api/admin/summaries" && req.method === "POST") {
    const b = await body(req, codesBody);
    if (!b) return bad(`Send up to ${ADMIN_BATCH} codes.`);
    const codes = [...new Set(b.codes.map(normaliseGameId))];
    const sums = await summaries(codes.map((c) => deps.room(c)));
    return json({
      summaries: sums.map((s, i) => {
        if (!s) return { code: codes[i], error: "That room didn't answer." };
        const { practice: _p, game: _g, ...rest } = s;
        return { ...rest, code: codes[i] };
      }),
    });
  }
  if (path === "/api/admin/story" && req.method === "GET") {
    const code = normaliseGameId(url.searchParams.get("code"));
    const story = await deps.room(code).adminStory();
    if (!story) return bad("Nothing saved under that code.", 404);
    return json({ story });
  }
  if (path === "/api/admin/label" && req.method === "POST") {
    const b = await body(req, labelBody);
    if (!b) return bad("Send a code and a tag (mine, test, real or null).");
    const ok = await deps.registry.label(normaliseGameId(b.code), b.tag, b.note);
    return ok ? json({ ok: true }) : bad("That code isn't in the list.", 404);
  }
  if (path === "/api/admin/add" && req.method === "POST") {
    const b = await body(req, addBody);
    if (!b) return bad(`Send up to ${ADMIN_BATCH} codes.`);
    const codes = [...new Set(b.codes.map(normaliseGameId))];
    return json(await probeAndAdd(deps, codes.map((c) => ({ room: deps.room(c), code: c })), b.foundBy ?? "device", now));
  }
  if (path === "/api/admin/scan" && req.method === "POST") {
    const b = await body(req, scanBody);
    if (!b) return bad("Say which scan (images or cloudflare).");
    if (b.source === "images") {
      if (!deps.imageCodes) return bad("Image scan isn't available here.", 501);
      const page = await deps.imageCodes(b.cursor);
      const res = await probeAndAdd(deps, page.codes.slice(0, ADMIN_BATCH).map((c) => ({ room: deps.room(c), code: c })), "images", now);
      return json({ ...res, cursor: page.cursor ?? null });
    }
    if (!deps.cloudflareIds || !deps.roomById) {
      return bad("The full scan needs two more Worker secrets, CF_API_TOKEN and CF_ACCOUNT_ID (see docs/admin.md).", 501);
    }
    const page = await deps.cloudflareIds(b.cursor);
    const res = await probeAndAdd(deps, page.ids.slice(0, ADMIN_BATCH).map((id) => ({ room: deps.roomById!(id) })), "cloudflare", now);
    return json({ ...res, cursor: page.cursor ?? null });
  }
  // The site's image storage: how full it is, a re-count, and the switch that turns uploads off everywhere.
  if (path === "/api/admin/storage") {
    const r = deps.registry;
    if (!r.storageStatus || !r.storageSetOff || !r.storageRecount) return bad("Storage isn't tracked here.", 501);
    if (req.method === "GET") return json({ storage: await r.storageStatus() });
    if (req.method === "POST") {
      const b = await body(req, storageBody);
      if (!b || (!b.uploads && !b.recount)) return bad('Send {"uploads": "on" | "off"} or {"recount": true}.');
      let storage = b.uploads ? await r.storageSetOff(b.uploads === "off") : await r.storageStatus();
      if (b.recount) storage = await r.storageRecount();
      return json({ storage });
    }
  }
  return bad("Not found.", 404);
}
