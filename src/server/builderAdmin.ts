/**
 * The DM's side of the Worldbuilder (DM key only; api.ts checks it before
 * calling in): builder keys, the on/off switch, the review queue and Activity.
 * Approve is the only way a draft reaches the game, through the reducer's
 * system.builderApply (same commands as making it by hand).
 */
import { z } from "zod";
import { execute, HttpError } from "./game";
import type { Store } from "./store";
import {
  builderEnabled,
  DRAFT_TBL,
  listAudit,
  listKeys,
  loadDraft,
  loadKey,
  newBuilderKey,
  rowToDraft,
  saveDraft,
  saveKey,
  setBuilderEnabled,
  type BuilderKeyInfo,
} from "./builderKeys";
import { DRAFT_ID_RE, DRAFT_SCHEMAS, draftRefs, draftTitle, draftToOp, cleanDeep, issueText, type CreatableKind, type Draft, type SuggestionBody } from "@/shared/builderInput";
import { currentValue, madeIndex, sameValue } from "@/shared/builderOps";
import { STAGE_IDS, entriesOf } from "@/shared/discovery";
import { storyOf } from "@/shared/story";
import type { GameState } from "@/shared/types";

/** Keys one campaign can hold (revoked ones count until removed). */
export const KEYS_MAX = 20;
/** Reviewed drafts kept for the "Recently reviewed" list. */
const REVIEWED_KEEP = 300;

const keyCreate = z.object({ label: z.string().trim().min(1).max(60), days: z.union([z.literal(7), z.literal(30), z.literal(90)]).nullable(), noSecrets: z.boolean().optional() });
const idList = z.object({ ids: z.array(z.string().regex(DRAFT_ID_RE)).min(1).max(200) });
const approveBody = idList.extend({ stage: z.enum(STAGE_IDS).default("hidden") });

/** A key as the DM sees it: never the hash. */
function publicKey(k: BuilderKeyInfo) {
  const { hash: _h, ...rest } = k;
  return rest;
}

/** A draft as the review queue shows it: names for what it points at, and the diff for a suggestion. */
function reviewView(g: GameState, d: Draft, drafts: Map<string, Draft>) {
  const nameOf = (id: string) => {
    if (DRAFT_ID_RE.test(id)) {
      const x = drafts.get(id);
      return x ? `${draftTitle(x)} (draft)` : "a draft that's gone";
    }
    return entriesOf(g).find((e) => e.id === id)?.name ?? storyOf(g).threads.find((t) => t.id === id)?.name ?? id;
  };
  const out: Record<string, unknown> = { ...d, title: draftTitle(d), refs: draftRefs(d).map((id) => ({ id, name: nameOf(id), draft: DRAFT_ID_RE.test(id) })) };
  if (d.kind === "suggestion") {
    const s = d.body as unknown as SuggestionBody;
    const now = currentValue(g, s.target, s.field);
    out.diff = { field: s.field, before: s.before, now: now ?? null, after: s.value, gone: now === undefined, stale: now !== undefined && !sameValue(now, s.before) };
  }
  return out;
}

/** Ids to approve plus every pending draft they hang off, parents first. */
function withParents(ids: string[], pending: Map<string, Draft>): Draft[] {
  const chosen = new Map<string, Draft>();
  const add = (id: string) => {
    if (chosen.has(id)) return;
    const d = pending.get(id);
    if (!d) throw new HttpError(409, "One of those drafts was already reviewed or withdrawn. Reload the list.");
    for (const r of draftRefs(d)) {
      if (!DRAFT_ID_RE.test(r)) continue;
      if (!pending.has(r)) throw new HttpError(409, `"${draftTitle(d)}" belongs to a draft that was rejected or withdrawn. Reject it too.`);
      add(r);
    }
    chosen.set(id, d);
  };
  ids.forEach(add);
  const rank: Record<string, number> = { entry: 0, thread: 0, fact: 1, link: 1, beat: 1, flyer: 2, monster: 2, table: 2, suggestion: 3 };
  return [...chosen.values()].sort((a, b) => rank[a.kind] - rank[b.kind] || a.createdAt - b.createdAt);
}

async function pendingMap(store: Store): Promise<Map<string, Draft>> {
  return new Map((await store.builder!.list(DRAFT_TBL, { tag: "pending" })).map(rowToDraft).map((d) => [d.id, d]));
}

/** Drafts already in the game (an approve that saved the game but not the drafts) are marked approved. */
async function settle(store: Store, g: GameState, now: number) {
  const made = madeIndex(g);
  for (const d of (await pendingMap(store)).values()) {
    const m = made.get(d.id);
    if (!m) continue;
    await saveDraft(store.builder!, { ...d, status: "approved", reviewedAt: now, resultId: m.id });
  }
}

async function parse<T>(schema: z.ZodType<T>, req: Request): Promise<T> {
  const text = await req.text().catch(() => "");
  if (text.length > 64 * 1024) throw new HttpError(413, "That request is too big.");
  let raw: unknown = null;
  try {
    raw = JSON.parse(text);
  } catch {
    /* falls through to the schema */
  }
  const r = schema.safeParse(raw);
  if (!r.success) throw new HttpError(400, issueText(r.error));
  return r.data;
}

export async function handleBuilderAdmin(req: Request, store: Store, game: string, now = Date.now()): Promise<Response> {
  const b = store.builder;
  if (!b) throw new HttpError(503, "The Worldbuilder isn't available here.");
  const path = new URL(req.url).pathname.replace(/^\/api\/builder-admin\//, "");
  const method = req.method;
  const json = (data: unknown) => new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });

  if (path === "status" && method === "GET") {
    return json({ enabled: await builderEnabled(b), keys: (await listKeys(b)).map(publicKey), pending: await b.count(DRAFT_TBL, "pending") });
  }
  if (path === "enabled" && method === "POST") {
    const { on } = await parse(z.object({ on: z.boolean() }), req);
    await setBuilderEnabled(b, on, now);
    return json({ ok: true, enabled: on });
  }
  if (path === "key-create" && method === "POST") {
    const body = await parse(keyCreate, req);
    if ((await listKeys(b)).length >= KEYS_MAX) throw new HttpError(400, `That's ${KEYS_MAX} keys. Remove a revoked one first.`);
    const { key, keyId, hash } = newBuilderKey(game);
    await saveKey(b, { id: keyId, label: body.label, hash, createdAt: now, expiresAt: body.days ? now + body.days * 86_400_000 : null, lastUsedAt: null, revokedAt: null, noSecrets: !!body.noSecrets });
    // Shown once. Only the hash is kept.
    return json({ ok: true, id: keyId, key });
  }
  if (path === "key-revoke" && method === "POST") {
    const { id } = await parse(z.object({ id: z.string().regex(/^[a-z0-9]{8}$/) }), req);
    const k = await loadKey(b, id);
    if (!k) throw new HttpError(404, "That key is gone.");
    if (!k.revokedAt) await saveKey(b, { ...k, revokedAt: now });
    return json({ ok: true });
  }
  if (path === "key-remove" && method === "POST") {
    const { id } = await parse(z.object({ id: z.string().regex(/^[a-z0-9]{8}$/) }), req);
    const k = await loadKey(b, id);
    if (k && !k.revokedAt) throw new HttpError(400, "Revoke the key before removing it.");
    await b.del("key", id);
    return json({ ok: true });
  }
  if (path === "activity" && method === "GET") {
    const u = new URL(req.url);
    const num = (k: string) => (u.searchParams.get(k) ? Number(u.searchParams.get(k)) : undefined);
    const keyId = u.searchParams.get("key") ?? undefined;
    return json({ rows: await listAudit(b, { keyId: keyId && /^[a-z0-9]{8}$/.test(keyId) ? keyId : undefined, from: num("from"), to: num("to") }) });
  }
  if (path === "review" && method === "GET") {
    const { state } = await store.read(game);
    if (!state) throw new HttpError(404, "No game here yet.", "no-game");
    await settle(store, state, now);
    const all = (await b.list(DRAFT_TBL, { limit: 1000 })).map(rowToDraft);
    const byId = new Map(all.map((d) => [d.id, d]));
    const pending = all.filter((d) => d.status === "pending").sort((a, c) => a.createdAt - c.createdAt);
    const reviewed = all.filter((d) => d.status !== "pending").sort((a, c) => (c.reviewedAt ?? 0) - (a.reviewedAt ?? 0));
    for (const d of reviewed.slice(REVIEWED_KEEP)) await b.del(DRAFT_TBL, d.id);
    return json({ pending: pending.map((d) => reviewView(state, d, byId)), reviewed: reviewed.slice(0, 40).map((d) => ({ id: d.id, kind: d.kind, title: draftTitle(d), label: d.label, status: d.status, reviewedAt: d.reviewedAt, resultId: d.resultId })) });
  }
  if (path === "review-edit" && method === "POST") {
    const { id, body } = await parse(z.object({ id: z.string().regex(DRAFT_ID_RE), body: z.record(z.string(), z.unknown()) }), req);
    const d = await loadDraft(b, id);
    if (!d || d.status !== "pending") throw new HttpError(404, "That draft was already reviewed.");
    if (d.kind === "suggestion") {
      const s = d.body as unknown as SuggestionBody;
      if (typeof body.value !== "string" && !Array.isArray(body.value)) throw new HttpError(400, "Change the suggested text.");
      s.value = cleanDeep(body.value);
    } else {
      const r = (DRAFT_SCHEMAS[d.kind as CreatableKind] as z.ZodType<Record<string, unknown>>).safeParse(cleanDeep(body));
      if (!r.success) throw new HttpError(400, issueText(r.error));
      // What it points at can't be changed here (that's what the builder sent).
      for (const k of ["entry", "a", "b", "thread"]) if (k in d.body) r.data[k] = d.body[k];
      d.body = r.data;
    }
    d.updatedAt = now;
    await saveDraft(b, d);
    return json({ ok: true });
  }
  if (path === "approve" && method === "POST") {
    const body = await parse(approveBody, req);
    const list = withParents(body.ids, await pendingMap(store));
    const ops = list.map((d) => draftToOp(d, body.stage));
    const r = await execute(store, game, { role: "system" }, { type: "system.builderApply", ops }, now);
    const made = madeIndex(r.state);
    for (const d of list) await saveDraft(b, { ...d, status: "approved", reviewedAt: now, ...(made.get(d.id) ? { resultId: made.get(d.id)!.id } : {}) });
    return json({ ok: true, approved: list.length, version: r.version });
  }
  if (path === "reject" && method === "POST") {
    const { ids } = await parse(idList, req);
    const pending = await pendingMap(store);
    const gone = new Set<string>();
    for (const id of ids) {
      const d = pending.get(id);
      if (!d) continue;
      gone.add(id);
    }
    // Drafts hanging off a rejected one go with it.
    let grew = true;
    while (grew) {
      grew = false;
      for (const d of pending.values()) if (!gone.has(d.id) && draftRefs(d).some((x) => gone.has(x))) gone.add(d.id), (grew = true);
    }
    for (const id of gone) await saveDraft(b, { ...pending.get(id)!, status: "rejected", reviewedAt: now });
    return json({ ok: true, rejected: gone.size });
  }
  throw new HttpError(404, "Not found.");
}

/** Reset everything: pending drafts are dropped with the game they were written for. Keys stay. */
export async function clearDrafts(store: Store) {
  await store.builder?.clear(DRAFT_TBL);
}
