import { KEY_HEADER, makeCampaignCode, newDmKey, sha256 } from "@/server/auth";
import { json } from "@/server/api";
import { normaliseGameId } from "@/shared/handles";
import type { Env } from "./env";
import { GameRoom } from "./room";

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
const EXT_TYPE: Record<string, string> = Object.fromEntries(Object.entries(IMAGE_EXT).map(([t, e]) => [e, t]));
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

/** Start a campaign: a new room, a new DM key. The key is returned once and only its hash is kept. */
async function createCampaign(req: Request, env: Env): Promise<Response> {
  const ip = req.headers.get("CF-Connecting-IP") ?? "local";
  if (env.CREATE_LIMIT && !(await env.CREATE_LIMIT.limit({ key: ip })).success) {
    return json({ error: "Too many new campaigns from here. Try again in a minute." }, 429);
  }
  const body = (await req.json().catch(() => ({}))) as { name?: unknown; code?: unknown };
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 80) : "";
  const wanted = typeof body.code === "string" && body.code.trim() ? normaliseGameId(body.code) : null;
  if (wanted !== null && !/^[a-z0-9][a-z0-9-]{2,39}$/.test(wanted)) {
    return json({ error: "A campaign code needs 3 to 40 letters, numbers or dashes." }, 400);
  }
  const key = newDmKey();
  for (let attempt = 0; attempt < 6; attempt++) {
    const game = wanted ?? makeCampaignCode();
    const res = await room(env, game).fetch(
      new Request(`https://room/internal/create?game=${encodeURIComponent(game)}`, {
        method: "POST",
        body: JSON.stringify({ dmKeyHash: sha256(key), ...(name ? { name } : {}) }),
      }),
    );
    if (res.ok) return json({ game, key });
    if (res.status !== 409) return res;
    if (wanted) return json({ error: "That campaign code is taken. Try another, or leave it blank for a random one." }, 409);
  }
  return json({ error: "Couldn't find a free campaign code. Try again." }, 503);
}

/** DM only: store an image in R2 under the campaign's code. */
async function upload(req: Request, env: Env): Promise<Response> {
  const url = new URL(req.url);
  const game = normaliseGameId(url.searchParams.get("game"));
  const check = await room(env, game).fetch(
    new Request(`https://room/internal/dm-check?game=${encodeURIComponent(game)}`, { headers: { [KEY_HEADER]: req.headers.get(KEY_HEADER) ?? "" } }),
  );
  if (!check.ok) return json({ error: "Only the DM can upload.", code: "bad-key" }, 401);
  const len = Number(req.headers.get("Content-Length") ?? 0);
  if (len > MAX_UPLOAD + 64 * 1024) return json({ error: "That image is over 25 MB." }, 413);
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || typeof file === "string") return json({ error: "No file." }, 400);
  const ext = IMAGE_EXT[file.type];
  if (!ext) return json({ error: "That isn't an image." }, 400);
  if (file.size > MAX_UPLOAD) return json({ error: "That image is over 25 MB." }, 413);
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  const name = `${game}/${[...bytes].map((b) => b.toString(16).padStart(2, "0")).join("")}.${ext}`;
  await env.FILES.put(name, file.stream(), { httpMetadata: { contentType: file.type } });
  return json({ url: `/api/files/${name}` });
}

/** Uploaded images. The names are random, so the link is the permission. */
async function serveFile(req: Request, env: Env, path: string): Promise<Response> {
  const m = /^\/api\/files\/([a-z0-9-]{1,40}\/[0-9a-f]{24}\.(png|jpg|webp|gif|svg|avif))$/.exec(path);
  if (!m) return new Response("Not found", { status: 404 });
  const obj = await env.FILES.get(m[1]);
  if (!obj) return new Response("Not found", { status: 404 });
  return new Response(obj.body, {
    headers: {
      "Content-Type": EXT_TYPE[m[2]],
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'",
      ETag: obj.httpEtag,
    },
  });
}

/** The Arrival page: its own small bundle. Link previews need an absolute image URL, so we fill in this site's address. */
async function arrivalPage(req: Request, env: Env): Promise<Response> {
  const url = new URL(req.url);
  const page = await env.ASSETS.fetch(new Request(new URL("/arrive", url), { headers: req.headers }));
  const abs = (attr: string | null) => (attr && attr.startsWith("/") ? url.origin + attr : attr ?? "");
  return new HTMLRewriter()
    .on('meta[property="og:image"], meta[name="twitter:image"], meta[property="og:url"]', {
      element(el) {
        const prop = el.getAttribute("property");
        el.setAttribute("content", prop === "og:url" ? url.origin + "/arrive" : abs(el.getAttribute("content")));
      },
    })
    .transform(page);
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    const path = url.pathname;
    try {
      if (path === "/api/create" && req.method === "POST") return withHeaders(await createCampaign(req, env));
      if (path === "/api/upload" && req.method === "POST") return withHeaders(await upload(req, env));
      if (path.startsWith("/api/files/") && req.method === "GET") return withHeaders(await serveFile(req, env, path));
      if (path.startsWith("/api/")) return withHeaders(await room(env, normaliseGameId(url.searchParams.get("game"))).fetch(req));
      if (path === "/arrive" || path.startsWith("/arrive/")) return withHeaders(await arrivalPage(req, env));
      return withHeaders(await env.ASSETS.fetch(req));
    } catch (e) {
      console.error(e);
      return withHeaders(json({ error: "Something went wrong on the server." }, 500));
    }
  },
} satisfies ExportedHandler<Env>;

