import type { AdminDeps, AdminRoom } from "@/server/admin";
import type { Env } from "./env";

/** The one registry object for the whole site. */
export function registry(env: Env) {
  return env.REGISTRY.get(env.REGISTRY.idFromName("admin:registry"));
}

const CF_API = "https://api.cloudflare.com/client/v4";

/** The GameRoom namespace's id, looked up once per Worker instance. */
let namespaceId: Promise<string | null> | null = null;

async function cf<T>(env: Env, path: string): Promise<T> {
  const res = await fetch(`${CF_API}/accounts/${env.CF_ACCOUNT_ID}${path}`, { headers: { Authorization: `Bearer ${env.CF_API_TOKEN}` } });
  const body = (await res.json().catch(() => null)) as { success?: boolean; errors?: { message?: string }[] } | null;
  if (!res.ok || !body?.success) throw new Error(`Cloudflare API: ${body?.errors?.[0]?.message ?? res.status}`);
  return body as T;
}

function gameRoomNamespace(env: Env): Promise<string | null> {
  namespaceId ??= cf<{ result: { id: string; class?: string; script?: string }[] }>(env, "/workers/durable_objects/namespaces?per_page=1000")
    .then((b) => b.result.find((n) => n.class === "GameRoom" && (!n.script || n.script === "candlefair"))?.id ?? null)
    .catch((e) => {
      namespaceId = null;
      throw e;
    });
  return namespaceId;
}

export function adminDeps(env: Env, ip: string): AdminDeps {
  const asAdmin = (stub: unknown) => stub as AdminRoom;
  const deps: AdminDeps = {
    secret: env.ADMIN_KEY,
    registry: registry(env),
    room: (code) => asAdmin(env.ROOMS.get(env.ROOMS.idFromName(code))),
    roomById: (id) => asAdmin(env.ROOMS.get(env.ROOMS.idFromString(id))),
    ip,
    // Each campaign's images sit under <code>/ in R2, so the folders name campaigns that uploaded something.
    imageCodes: async (cursor) => {
      // With a delimiter, each folder counts once toward the limit.
      const list = await env.FILES.list({ delimiter: "/", cursor, limit: 40 });
      const codes = (list.delimitedPrefixes ?? []).map((p) => p.replace(/\/$/, "")).filter((c) => /^[a-z0-9-]{1,40}$/.test(c) && c !== "p");
      return { codes, cursor: list.truncated ? list.cursor : undefined };
    },
  };
  if (env.CF_API_TOKEN && env.CF_ACCOUNT_ID) {
    deps.cloudflareIds = async (cursor) => {
      const ns = await gameRoomNamespace(env);
      if (!ns) throw new Error("Couldn't find the GameRoom namespace for this Worker.");
      const q = new URLSearchParams({ limit: "40" });
      if (cursor) q.set("cursor", cursor);
      const b = await cf<{ result: { id: string; hasStoredData?: boolean }[]; result_info?: { cursor?: string; cursors?: { after?: string } } }>(
        env,
        `/workers/durable_objects/namespaces/${ns}/objects?${q}`,
      );
      const next = b.result_info?.cursors?.after ?? b.result_info?.cursor;
      return { ids: b.result.filter((o) => o.hasStoredData !== false).map((o) => o.id), cursor: b.result.length && next ? next : undefined };
    };
  }
  return deps;
}
