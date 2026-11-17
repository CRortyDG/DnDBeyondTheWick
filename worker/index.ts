import { TILES_MAX } from "@/shared/fog";
import { KEY_HEADER, makeCampaignCode, newDmKey, sha256 } from "@/server/auth";
import { handlePresetApi, isPresetPath, json, MISS_HEADER } from "@/server/api";
import { handlePracticeAdmin, isPracticeAdminPath } from "@/server/practice";
import type { Store } from "@/server/store";
import { normaliseGameId } from "@/shared/handles";
import { pickedCodeProblem, screenKey } from "@/server/limits";
import { parseRange, rangeBounds } from "@/server/range";
import { CLIP_VIDEO_MAX } from "@/shared/arrival";
import { whenText, type InviteView } from "@/shared/invites";
import type { Env } from "./env";
import { R2Presets } from "./presets";
import { GameRoom } from "./room";
import { BATCH_HEADER, COUNTRY_HEADER, PICTURE_ALT_HEADER, PICTURE_ENTRY_HEADER } from "@/server/builder";
import { carriesBuilderKey, parseBuilderAuth } from "@/server/builderKeys";

export { GameRoom };

/**
 * The front door. Serves the built app, sends each campaign's API calls and
 * live connection to that campaign's room, and handles images in R2.
 */

const SECURITY_HEADERS: Record<string, string> = {
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow",
  "X-Content-Type-Options": "nosniff",
};

const IMAGE_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "image/avif": "avif",
};
/** Video clips (the Arrival intro, Video scenes on the TV). Capped lower than images: phones download them. */
const VIDEO_EXT: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};
const EXT_TYPE: Record<string, string> = Object.fromEntries([...Object.entries(IMAGE_EXT), ...Object.entries(VIDEO_EXT)].map(([t, e]) => [e, t]));
const MAX_UPLOAD = 25 * 1024 * 1024;

function withHeaders(res: Response): Response {
  if (res.status === 101) return res;
  const out = new Response(res.body, res);
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) out.headers.set(k, v);
  return out;
}

function room(env: Env, game: string) {
  return env.ROOMS.get(env.ROOMS.idFromName(game));
}

/** A campaign's practice copy: "practice:<code>". Codes are letters, digits and dashes, so no code is ever this name. */
function practiceRoom(env: Env, game: string) {
  return env.ROOMS.get(env.ROOMS.idFromName(`practice:${game}`));
}

/** A room, called directly (its Store methods over RPC) rather than over HTTP. */
function asStore(stub: DurableObjectStub<GameRoom>): Store {
  return stub as unknown as Store;
}

// ---------------------------------------------------------------- abuse limits
//
// Per address: a ceiling on all API calls, a lower one on uploads, and a
// guessing counter. An address that keeps missing (codes that don't exist,
// wrong DM keys or name locks, dead Arrival links) is shut out of the API for
// LOCKOUT_SECONDS. The shut-out flag lives in this data centre's cache, which is
// free and needs no storage; the rate limits themselves are Cloudflare's.

const LOCKOUT_SECONDS = 15 * 60;

function ipOf(req: Request): string {
  return req.headers.get("CF-Connecting-IP") ?? "local";
}

function lockoutKey(ip: string): Request {
  return new Request(`https://lockout.candlefair.invalid/${encodeURIComponent(ip)}`);
}

function edgeCache(): Cache | null {
  return typeof caches !== "undefined" ? (caches as unknown as { default: Cache }).default : null;
}

async function lockedOut(ip: string): Promise<boolean> {
  return !!(await edgeCache()?.match(lockoutKey(ip)));
}

async function over(limit: RateLimit | undefined, ip: string): Promise<boolean> {
  return !!limit && !(await limit.limit({ key: ip })).success;
}

/** One more miss from this address. Too many and it is shut out for a while. */
async function noteMiss(env: Env, ctx: ExecutionContext, ip: string) {
  if (!(await over(env.GUESS_LIMIT, ip))) return;
  const cache = edgeCache();
  if (cache) ctx.waitUntil(cache.put(lockoutKey(ip), new Response("1", { headers: { "Cache-Control": `max-age=${LOCKOUT_SECONDS}` } })));
}

/** Count a room's miss, if it reported one, and take the marker off before the browser sees it. */
async function settle(res: Response, env: Env, ctx: ExecutionContext, ip: string): Promise<Response> {
  if (!res.headers.has(MISS_HEADER)) return res;
  await noteMiss(env, ctx, ip);
  if (res.status === 101) return new Response(null, { status: 101, webSocket: res.webSocket });
  const out = new Response(res.body, res);
  out.headers.delete(MISS_HEADER);
  return out;
}

/**
 * The everyday ceiling. Each screen (campaign + name) gets its own allowance, so a
 * busy phone or a stuck tab can't use up the DM's: a whole table shares one Wi-Fi
 * address. The address as a whole still has a higher ceiling, so making up names
 * doesn't buy a flood more room. Guessing is limited separately (GUESS_LIMIT).
 */
async function overApi(env: Env, ip: string, url: URL): Promise<boolean> {
  if (await over(env.ADDRESS_LIMIT, ip)) return true;
  return !!env.API_LIMIT && !(await env.API_LIMIT.limit({ key: screenKey(ip, url) })).success;
}

const slowDown = (msg: string) => json({ error: msg, code: "rate-limited" }, 429);

/**
 * The Worldbuilder's door: POST /api/builder/<op> with a cfb_ key in the
 * Authorization header. Not for browsers (no CORS; a page's request is
 * refused). The campaign comes from the key, so no code is in the URL. Only the
 * headers the builder needs go through; the country is Cloudflare's, never the
 * caller's.
 */
async function builderDoor(req: Request, env: Env, ctx: ExecutionContext, ip: string): Promise<Response> {
  // Browsers always send Origin or Sec-Fetch-Site on these; Node's fetch (the MCP server) sends neither.
  if (req.method === "OPTIONS" || req.headers.has("Origin") || req.headers.has("Sec-Fetch-Site")) {
    return json({ ok: false, error: "The Worldbuilder API can't be called from a browser.", code: "browser" }, 403);
  }
  const url = new URL(req.url);
  if (req.headers.has(KEY_HEADER) || url.searchParams.has("player")) {
    return json({ ok: false, error: "This is the Worldbuilder API. DM and player keys don't work here.", code: "wrong-door" }, 403);
  }
  if (req.method !== "POST") return json({ ok: false, error: "Use POST.", code: "bad-request" }, 405);
  const parsed = parseBuilderAuth(req.headers.get("Authorization"));
  if (!parsed) {
    await noteMiss(env, ctx, ip);
    return json({ ok: false, error: "Send a Worldbuilder key (cfb_...) in the Authorization header.", code: "bad-key" }, 401);
  }
  const headers = new Headers();
  for (const h of ["Authorization", "Content-Type", "Content-Length", BATCH_HEADER, PICTURE_ENTRY_HEADER, PICTURE_ALT_HEADER]) {
    const v = req.headers.get(h);
    if (v) headers.set(h, v);
  }
  const country = (req as Request & { cf?: { country?: unknown } }).cf?.country;
  if (typeof country === "string") headers.set(COUNTRY_HEADER, country);
  const res = await room(env, parsed.game).fetch(new Request(`https://room${url.pathname}?game=${encodeURIComponent(parsed.game)}`, { method: "POST", headers, body: req.body }));
  return settle(res, env, ctx, ip);
}

/** Start a campaign: a new room, a new DM key. The key is returned once and only its hash is kept. */
async function createCampaign(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const ip = ipOf(req);
  if (env.CREATE_LIMIT && !(await env.CREATE_LIMIT.limit({ key: ip })).success) {
    return json({ error: "Too many new campaigns from here. Try again in a minute." }, 429);
  }
  const body = (await req.json().catch(() => ({}))) as { name?: unknown; code?: unknown; from?: unknown; features?: unknown };
  const features = body.features === "minimal" || body.features === "standard" || body.features === "everything" ? body.features : undefined;
  const from = typeof body.from === "string" && /^(blank|candlefair|marrowmere|preset:[a-z0-9]{10})$/.test(body.from) ? body.from : "blank";
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 80) : "";
  const wanted = typeof body.code === "string" && body.code.trim() ? normaliseGameId(body.code) : null;
  const problem = wanted !== null ? pickedCodeProblem(wanted) : null;
  if (problem) return json({ error: problem }, 400);
  const key = newDmKey();
  for (let attempt = 0; attempt < 6; attempt++) {
    const game = wanted ?? makeCampaignCode();
    const res = await room(env, game).fetch(
      new Request(`https://room/internal/create?game=${encodeURIComponent(game)}`, {
        method: "POST",
        body: JSON.stringify({ dmKeyHash: sha256(key), from, ...(name ? { name } : {}), ...(features ? { features } : {}) }),
      }),
    );
    if (res.ok) return json({ game, key });
    if (res.status !== 409) {
      // A preset code that doesn't exist is a guess like any other.
      if (res.status === 404) await noteMiss(env, ctx, ip);
      return new Response(res.body, { status: res.status, headers: { "Content-Type": "application/json; charset=utf-8" } });
    }
    // A taken code tells a guesser it exists, so it counts as a miss.
    if (wanted) await noteMiss(env, ctx, ip);
    if (wanted) return json({ error: "That campaign code is taken. Try another, or leave it blank for a random one." }, 409);
  }
  return json({ error: "Couldn't find a free campaign code. Try again." }, 503);
}

/** DM only: store an image in R2 under the campaign's code. */
async function upload(req: Request, env: Env, ctx: ExecutionContext, ip: string): Promise<Response> {
  if (await over(env.UPLOAD_LIMIT, ip)) return slowDown("Too many uploads at once. Wait a minute and try again.");
  const url = new URL(req.url);
  const game = normaliseGameId(url.searchParams.get("game"));
  const key = req.headers.get(KEY_HEADER) ?? "";
  // Before reading the body: is this the DM? (A cheap check, so strangers can't make us parse 25 MB.)
  const check = await room(env, game).fetch(new Request(`https://room/internal/dm-check?game=${encodeURIComponent(game)}`, { headers: { [KEY_HEADER]: key } }));
  if (!check.ok) {
    await noteMiss(env, ctx, ip);
    return json({ error: "Only the DM can upload.", code: "bad-key" }, 401);
  }
  const len = Number(req.headers.get("Content-Length") ?? 0);
  if (!len) return json({ error: "Upload one image at a time." }, 411);
  if (len > MAX_UPLOAD + 64 * 1024) return json({ error: "That file is over 25 MB." }, 413);
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || typeof file === "string") return json({ error: "No file." }, 400);
  const ext = IMAGE_EXT[file.type] ?? VIDEO_EXT[file.type];
  if (!ext) return json({ error: "That isn't an image or a video (MP4, WebM or MOV)." }, 400);
  if (file.size > MAX_UPLOAD) return json({ error: "That image is over 25 MB." }, 413);
  if (VIDEO_EXT[file.type] && file.size > CLIP_VIDEO_MAX) return json({ error: `That video is over ${CLIP_VIDEO_MAX / 1024 / 1024} MB. A minute of 720p fits.` }, 413);
  // Count it against the campaign's image space (and check the key again, in the room that holds it).
  const reserve = await room(env, game).fetch(
    new Request(`https://room/internal/upload-reserve?game=${encodeURIComponent(game)}&size=${file.size}`, { method: "POST", headers: { [KEY_HEADER]: key } }),
  );
  if (!reserve.ok) return new Response(reserve.body, { status: reserve.status, headers: { "Content-Type": "application/json; charset=utf-8" } });
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  const name = `${game}/${[...bytes].map((b) => b.toString(16).padStart(2, "0")).join("")}.${ext}`;
  await env.FILES.put(name, file.stream(), { httpMetadata: { contentType: file.type } });
  return json({ url: `/api/files/${name}` });
}

/**
 * DM only: a map cut into tiles for fog of war (in the DM's browser), stored in
 * one go. Each tile gets its own random name, so a tile's link says nothing
 * about the tiles next to it.
 */
async function uploadTiles(req: Request, env: Env, ctx: ExecutionContext, ip: string): Promise<Response> {
  if (await over(env.UPLOAD_LIMIT, ip)) return slowDown("Too many uploads at once. Wait a minute and try again.");
  const url = new URL(req.url);
  const game = normaliseGameId(url.searchParams.get("game"));
  const key = req.headers.get(KEY_HEADER) ?? "";
  const check = await room(env, game).fetch(new Request(`https://room/internal/dm-check?game=${encodeURIComponent(game)}`, { headers: { [KEY_HEADER]: key } }));
  if (!check.ok) {
    await noteMiss(env, ctx, ip);
    return json({ error: "Only the DM can upload.", code: "bad-key" }, 401);
  }
  const len = Number(req.headers.get("Content-Length") ?? 0);
  if (!len) return json({ error: "No map pieces." }, 411);
  if (len > MAX_UPLOAD + 256 * 1024) return json({ error: "That map is too big to cut up (over 25 MB of pieces). Try a smaller image." }, 413);
  const form = await req.formData().catch(() => null);
  const files = (form?.getAll("tile") ?? []).filter((f): f is File => typeof f !== "string");
  if (!files.length || files.length > TILES_MAX) return json({ error: `Send 1 to ${TILES_MAX} map pieces.` }, 400);
  let total = 0;
  for (const f of files) {
    if (!TILE_EXT[f.type]) return json({ error: "A map piece isn't an image." }, 400);
    total += f.size;
  }
  if (total > MAX_UPLOAD) return json({ error: "That map is too big to cut up (over 25 MB of pieces). Try a smaller image." }, 413);
  const reserve = await room(env, game).fetch(
    new Request(`https://room/internal/upload-reserve?game=${encodeURIComponent(game)}&size=${total}&count=${files.length}`, { method: "POST", headers: { [KEY_HEADER]: key } }),
  );
  if (!reserve.ok) return new Response(reserve.body, { status: reserve.status, headers: { "Content-Type": "application/json; charset=utf-8" } });
  const urls = await Promise.all(
    files.map(async (f) => {
      const bytes = new Uint8Array(12);
      crypto.getRandomValues(bytes);
      const name = `${game}/${[...bytes].map((b) => b.toString(16).padStart(2, "0")).join("")}.${TILE_EXT[f.type]}`;
      await env.FILES.put(name, f.stream(), { httpMetadata: { contentType: f.type } });
      return `/api/files/${name}`;
    }),
  );
  return json({ urls });
}

const TILE_EXT: Record<string, string> = { "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png" };

/** Uploaded images and clips. The names are random, so the link is the permission. */
async function serveFile(req: Request, env: Env, path: string): Promise<Response> {
  // A campaign's files are <code>/<random>; a preset's own copies are p/<preset code>/<random>.
  const m = /^\/api\/files\/((?:p\/[a-z0-9]{10}|[a-z0-9-]{1,40})\/[0-9a-f]{24}\.(png|jpg|webp|gif|svg|avif|mp4|webm|mov))$/.exec(path);
  if (!m) return new Response("Not found", { status: 404 });
  const headers: Record<string, string> = {
    "Content-Type": EXT_TYPE[m[2]],
    "Cache-Control": "public, max-age=31536000, immutable",
    "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'",
    "Accept-Ranges": "bytes",
  };
  // Phones play a video in pieces (iPhones won't play one at all without this).
  const range = parseRange(req.headers.get("Range"));
  if (range && req.method === "GET") {
    // R2 refuses a range that starts past the end; answer that the way a browser expects.
    const obj = await env.FILES.get(m[1], { range }).catch(() => undefined);
    if (obj === undefined) {
      const head = await env.FILES.head(m[1]);
      if (!head) return new Response("Not found", { status: 404 });
      return new Response(null, { status: 416, headers: { ...headers, "Content-Range": `bytes */${head.size}` } });
    }
    if (!obj) return new Response("Not found", { status: 404 });
    const size = obj.size;
    const b = rangeBounds(range, size);
    if (!b) return new Response(null, { status: 416, headers: { ...headers, "Content-Range": `bytes */${size}` } });
    const { start, end } = b;
    return new Response(obj.body, {
      status: 206,
      headers: { ...headers, ETag: obj.httpEtag, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(end - start + 1) },
    });
  }
  const obj = req.method === "HEAD" ? await env.FILES.head(m[1]) : await env.FILES.get(m[1]);
  if (!obj) return new Response("Not found", { status: 404 });
  return new Response(req.method === "HEAD" ? null : (obj as R2ObjectBody).body, { headers: { ...headers, ETag: obj.httpEtag, "Content-Length": String(obj.size) } });
}

/** The link preview for a campaign that isn't Candlefair: its own name, and its own picture if it has one. */
interface PreviewLook {
  title: string;
  description: string;
  image: string;
  alt: string;
  /** The built-in card's size; an uploaded picture's isn't known. */
  sized: boolean;
}

const NEUTRAL_PREVIEW: PreviewLook = { title: "Take your seat", description: "Your seat at the table is waiting.", image: "/arrival/og-table.jpg", alt: "A candle on a round table", sized: true };

async function previewLook(req: Request, env: Env, ctx: ExecutionContext, game: string): Promise<PreviewLook> {
  const ip = ipOf(req);
  if (await lockedOut(ip)) return NEUTRAL_PREVIEW;
  const res = await room(env, game).fetch(new Request(`https://room/api/arrival?game=${encodeURIComponent(game)}`));
  // A made-up campaign code is a guess like any other.
  if (res.headers.has(MISS_HEADER)) {
    await noteMiss(env, ctx, ip);
    return NEUTRAL_PREVIEW;
  }
  const view = (await res.json().catch(() => null)) as { look?: { title?: string; welcome?: string; clip?: { poster?: string }; slides?: { image?: string }[] } } | null;
  const look = view?.look;
  if (!look?.title) return NEUTRAL_PREVIEW;
  const picture = look.clip?.poster ?? look.slides?.find((x) => x.image?.startsWith("/api/files/"))?.image;
  return {
    title: `Tales from ${look.title.replace(/^The /, "the ")}`,
    description: look.welcome || "Your seat at the table is waiting.",
    image: picture ?? NEUTRAL_PREVIEW.image,
    alt: picture ? `The opening of ${look.title}` : NEUTRAL_PREVIEW.alt,
    sized: !picture,
  };
}

/** The Arrival page: its own small bundle. Link previews need an absolute image URL, so we fill in this site's address. */
async function arrivalPage(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const url = new URL(req.url);
  const page = await env.ASSETS.fetch(new Request(new URL("/arrive", url), { headers: req.headers }));
  const abs = (attr: string | null) => (attr && attr.startsWith("/") ? url.origin + attr : attr ?? "");
  const game = normaliseGameId(url.searchParams.get("game"));
  // Candlefair's preview is the one in arrive.html; any other campaign gets its own.
  const look = game === "candlefair" ? null : await previewLook(req, env, ctx, game);
  const rewriter = new HTMLRewriter().on('meta[property="og:image"], meta[name="twitter:image"], meta[property="og:url"]', {
    element(el) {
      const prop = el.getAttribute("property");
      if (prop === "og:url") el.setAttribute("content", url.origin + "/arrive");
      else el.setAttribute("content", abs(look ? look.image : el.getAttribute("content")));
    },
  });
  if (!look) return rewriter.transform(page);
  return rewriter
    .on("title", {
      element(el) {
        el.setInnerContent(look.title);
      },
    })
    .on('meta[property="og:title"], meta[name="twitter:title"], meta[property="og:site_name"]', {
      element(el) {
        el.setAttribute("content", look.title);
      },
    })
    .on('meta[name="description"], meta[property="og:description"], meta[name="twitter:description"]', {
      element(el) {
        el.setAttribute("content", look.description);
      },
    })
    .on('meta[property="og:image:alt"]', {
      element(el) {
        el.setAttribute("content", look.alt);
      },
    })
    .on('meta[property="og:image:width"], meta[property="og:image:height"]', {
      element(el) {
        if (!look.sized) el.remove();
      },
    })
    .transform(page);
}

/**
 * A session invite (/i/<code>): its own small page. The link preview shows the invite's
 * title, date, seats and picture, never the place or the address.
 */
async function invitePage(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const url = new URL(req.url);
  const page = await env.ASSETS.fetch(new Request(new URL("/invite", url), { headers: req.headers }));
  const game = normaliseGameId(url.searchParams.get("game"));
  const code = /^\/i\/([A-Za-z0-9]{8,32})\/?$/.exec(url.pathname)?.[1] ?? null;
  const abs = (p: string) => (p.startsWith("/") ? url.origin + p : p);
  let look: { title: string; description: string; image: string | null } | null = null;
  const ip = ipOf(req);
  if (code && !(await lockedOut(ip))) {
    const res = await room(env, game).fetch(new Request(`https://room/api/invite?game=${encodeURIComponent(game)}&i=${code}`));
    if (res.headers.has(MISS_HEADER)) await noteMiss(env, ctx, ip);
    else {
      const v = (await res.json().catch(() => null)) as InviteView | null;
      if (v?.invite) {
        const i = v.invite;
        const left = Math.max(0, i.seats - i.taken);
        const seats = i.status === "cancelled" ? "Cancelled" : i.status === "full" ? "Table full, waitlist open" : i.status === "open" ? `${left} of ${i.seats} seats left` : "Seats closed";
        look = { title: i.title, description: `${whenText(i)} · ${seats}`, image: i.art ?? null };
      }
    }
  }
  const rewriter = new HTMLRewriter().on('meta[property="og:image"], meta[name="twitter:image"], meta[property="og:url"]', {
    element(el) {
      const prop = el.getAttribute("property");
      if (prop === "og:url") el.setAttribute("content", url.origin + url.pathname + url.search);
      else el.setAttribute("content", abs(look?.image ?? el.getAttribute("content") ?? ""));
    },
  });
  if (!look) return rewriter.transform(page);
  const l = look;
  return rewriter
    .on("title", {
      element(el) {
        el.setInnerContent(l.title);
      },
    })
    .on('meta[property="og:title"], meta[name="twitter:title"]', {
      element(el) {
        el.setAttribute("content", l.title);
      },
    })
    .on('meta[name="description"], meta[property="og:description"], meta[name="twitter:description"]', {
      element(el) {
        el.setAttribute("content", l.description);
      },
    })
    .on('meta[property="og:image:alt"]', {
      element(el) {
        if (l.image) el.setAttribute("content", `The picture for ${l.title}`);
      },
    })
    .on('meta[property="og:image:width"], meta[property="og:image:height"]', {
      element(el) {
        if (l.image) el.remove();
      },
    })
    .transform(page);
}

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(req.url);
    const path = url.pathname;
    try {
      // Images have random names and are cached by browsers; everything else in /api/ is limited per address.
      if (path.startsWith("/api/files/") && (req.method === "GET" || req.method === "HEAD")) return withHeaders(await serveFile(req, env, path));
      if (path.startsWith("/api/")) {
        const ip = ipOf(req);
        if (await lockedOut(ip)) return withHeaders(slowDown("Too many wrong codes or links from here. Try again in 15 minutes."));
        if (await overApi(env, ip, url)) return withHeaders(slowDown("Too many requests from here. Slow down a little."));
        if (path.startsWith("/api/builder/")) return withHeaders(await builderDoor(req, env, ctx, ip));
        // A Worldbuilder key opens nothing else (the room says the same for its own routes).
        if (carriesBuilderKey(req)) return withHeaders(json({ error: "A Worldbuilder key only works on the Worldbuilder API.", code: "wrong-door" }, 403));
        if (path === "/api/create" && req.method === "POST") return withHeaders(await createCampaign(req, env, ctx));
        if (path === "/api/upload" && req.method === "POST") return withHeaders(await upload(req, env, ctx, ip));
        if (path === "/api/upload-tiles" && req.method === "POST") return withHeaders(await uploadTiles(req, env, ctx, ip));
        if (isPresetPath(path)) return withHeaders(await settle(await handlePresetApi(req, new R2Presets(env.FILES)), env, ctx, ip));
        const game = normaliseGameId(url.searchParams.get("game"));
        // Practice mode: start, finish and the edit list need both rooms (src/server/practice.ts).
        if (isPracticeAdminPath(path)) return withHeaders(await settle(await handlePracticeAdmin(req, asStore(room(env, game)), asStore(practiceRoom(env, game))), env, ctx, ip));
        // A practice screen talks to the practice copy, never the live room. Its name can't be typed as a code.
        const res = await (url.searchParams.get("practice") === "1" ? practiceRoom(env, game) : room(env, game)).fetch(req);
        return withHeaders(await settle(res, env, ctx, ip));
      }
      if (path === "/arrive" || path.startsWith("/arrive/")) return withHeaders(await arrivalPage(req, env, ctx));
      if (path.startsWith("/i/")) return withHeaders(await invitePage(req, env, ctx));
      return withHeaders(await env.ASSETS.fetch(req));
    } catch (e) {
      console.error(e);
      return withHeaders(json({ error: "Something went wrong on the server." }, 500));
    }
  },
} satisfies ExportedHandler<Env>;

