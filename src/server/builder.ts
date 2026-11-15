/**
 * The Worldbuilder API: what a builder key (cfb_...) may do, and nothing else.
 *
 * POST /api/builder/<op> with "Authorization: Bearer cfb_...". Every op is on
 * the allowlist below; anything else is a 403. Reads are built field by field
 * (shared/builderView.ts). Writes only add or change draft rows in the builder
 * store: this file never runs a game command, never touches the game document
 * and imports nothing that could (a test checks the imports). Only the DM's
 * Approve (builderAdmin.ts) turns a draft into game content.
 */
import type { z } from "zod";
import type { Store } from "./store";
import {
  audit,
  builderEnabled,
  builderKeyMatches,
  DRAFT_TBL,
  loadDraft,
  loadKey,
  newDraftId,
  parseBuilderAuth,
  rowToDraft,
  saveDraft,
  saveKey,
  USE_TBL,
  type BuilderKeyInfo,
} from "./builderKeys";
import { KEY_HEADER } from "./auth";
import { builderBeats, builderCharacters, builderGet, builderOverview, builderSearch, builderThreads, DATA_NOTE } from "@/shared/builderView";
import {
  cleanDeep,
  DRAFT_ID_RE,
  DRAFT_SCHEMAS,
  draftRefs,
  draftTitle,
  issueText,
  suggestInput,
  suggestValue,
  type CreatableKind,
  type Draft,
  type DraftKind,
  type SuggestionBody,
} from "@/shared/builderInput";
import { currentValue, sameValue, SUGGEST_FIELDS, type SuggestTarget, type SuggestType } from "@/shared/builderOps";
import { entriesOf } from "@/shared/discovery";
import { storyOf } from "@/shared/story";
import { monstersOf } from "@/shared/combat";
import { jobsOf } from "@/shared/renown";
import { noticesOf } from "@/shared/board";
import { tablesOf } from "@/shared/tables";
import type { GameState } from "@/shared/types";

// ---------------------------------------------------------------- limits

export const BUILDER_LIMITS = {
  perMinute: 20,
  readsPerHour: 600,
  writesPerHour: 60,
  writesPerDay: 300,
  /** Pending drafts and suggestions in one campaign, from every key. */
  pending: 200,
  /** One draft's stored size. */
  draftBytes: 16 * 1024,
  /** One request's body. */
  bodyBytes: 64 * 1024,
};

/** Set by the Worker from Cloudflare's own data; a value sent by the caller is stripped there. */
export const COUNTRY_HEADER = "x-builder-country";
/** A random id the MCP server picks once per run, so the review queue can group one chat's drafts. */
export const BATCH_HEADER = "x-builder-batch";

const READ_OPS = ["get_overview", "search", "get_entry", "list_characters", "list_threads", "list_beats", "list_my_drafts"] as const;
const WRITE_OPS = [
  "create_entry",
  "add_fact",
  "link_entries",
  "create_thread",
  "create_beat",
  "create_flyer",
  "create_monster_template",
  "create_random_table",
  "suggest_change",
  "update_my_draft",
  "withdraw_my_draft",
] as const;
export const BUILDER_OPS: readonly string[] = [...READ_OPS, ...WRITE_OPS];
const isWrite = (op: string) => (WRITE_OPS as readonly string[]).includes(op);

const CREATE: Record<string, CreatableKind> = {
  create_entry: "entry",
  add_fact: "fact",
  link_entries: "link",
  create_thread: "thread",
  create_beat: "beat",
  create_flyer: "flyer",
  create_monster_template: "monster",
  create_random_table: "table",
};

class Refuse extends Error {
  constructor(
    public status: number,
    message: string,
    public code: string,
    /** Counts toward the address's guessing lockout. */
    public miss = false,
  ) {
    super(message);
  }
}

function reply(data: unknown, status = 200, miss = false): Response {
  const res = new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
  if (miss) res.headers.set("x-candlefair-miss", "1");
  return res;
}

/** Reads carry campaign text, always under campaign_text with the note that it's data. */
function readReply(campaign_text: unknown, extra: Record<string, unknown> = {}): Response {
  return reply({ ok: true, ...extra, note: DATA_NOTE, campaign_text });
}

/** A key marked "no secrets" reads without secrets or DM notes. */
function withoutSecrets<T>(v: T): T {
  const drop = new Set(["secrets", "dm_note", "dm_notes", "dm", "knows"]);
  if (Array.isArray(v)) return v.map(withoutSecrets) as T;
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).filter(([k]) => !drop.has(k)).map(([k, x]) => [k, withoutSecrets(x)])) as T;
  return v;
}

// ---------------------------------------------------------------- usage

interface Usage {
  m: number;
  mc: number;
  h: number;
  hr: number;
  hw: number;
  d: number;
  dw: number;
}

async function spend(store: Store, keyId: string, write: boolean, now: number): Promise<Usage> {
  const b = store.builder!;
  const row = await b.get(USE_TBL, keyId);
  const u: Usage = row ? JSON.parse(row.body) : { m: 0, mc: 0, h: 0, hr: 0, hw: 0, d: 0, dw: 0 };
  const minute = Math.floor(now / 60_000);
  const hour = Math.floor(now / 3_600_000);
  const day = Math.floor(now / 86_400_000);
  if (u.m !== minute) Object.assign(u, { m: minute, mc: 0 });
  if (u.h !== hour) Object.assign(u, { h: hour, hr: 0, hw: 0 });
  if (u.d !== day) Object.assign(u, { d: day, dw: 0 });
  const L = BUILDER_LIMITS;
  if (u.mc >= L.perMinute) throw new Refuse(429, `Slow down: at most ${L.perMinute} builder calls a minute. Wait a minute, then carry on.`, "limit");
  if (write && u.hw >= L.writesPerHour) throw new Refuse(429, `This key has made ${L.writesPerHour} drafts or changes this hour, the most allowed. Stop and ask the DM to review what's there.`, "limit");
  if (write && u.dw >= L.writesPerDay) throw new Refuse(429, `This key has made ${L.writesPerDay} drafts or changes today, the most allowed. Stop and ask the DM to review what's there.`, "limit");
  if (!write && u.hr >= L.readsPerHour) throw new Refuse(429, `This key has read ${L.readsPerHour} times this hour, the most allowed. Wait a while before reading more.`, "limit");
  u.mc += 1;
  if (write) {
    u.hw += 1;
    u.dw += 1;
  } else u.hr += 1;
  await b.put(USE_TBL, { id: keyId, at: now, tag: "", body: JSON.stringify(u) });
  return u;
}

function limitsLeft(u: Usage) {
  return { writes_left_this_hour: Math.max(0, BUILDER_LIMITS.writesPerHour - u.hw), writes_left_today: Math.max(0, BUILDER_LIMITS.writesPerDay - u.dw) };
}

// ---------------------------------------------------------------- the door

async function readBody(req: Request): Promise<unknown> {
  const len = Number(req.headers.get("Content-Length") ?? 0);
  if (len > BUILDER_LIMITS.bodyBytes) throw new Refuse(413, `That request is over ${BUILDER_LIMITS.bodyBytes / 1024} KB. Send less at once.`, "too-big");
  const text = await req.text().catch(() => "");
  if (text.length > BUILDER_LIMITS.bodyBytes) throw new Refuse(413, `That request is over ${BUILDER_LIMITS.bodyBytes / 1024} KB. Send less at once.`, "too-big");
  if (!text.trim()) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new Refuse(400, "The request body isn't JSON.", "bad-request");
  }
}

/** Everything about the call that isn't the op itself. Throws Refuse. */
async function admit(req: Request, store: Store, now: number): Promise<{ key: BuilderKeyInfo; game: string; op: string }> {
  // Wrong door: the DM key and player names are never accepted here, even alongside a builder key.
  const url = new URL(req.url);
  if (req.headers.has(KEY_HEADER) || url.searchParams.has("player")) throw new Refuse(403, "This is the Worldbuilder API. DM and player keys don't work here.", "wrong-door");
  // Not for browsers: no CORS, and a page's own request is refused outright.
  // Browsers always send Origin or Sec-Fetch-Site on these; Node's fetch (the MCP server) sends neither.
  if (req.method === "OPTIONS" || req.headers.has("Origin") || req.headers.has("Sec-Fetch-Site")) {
    throw new Refuse(403, "The Worldbuilder API can't be called from a browser.", "browser");
  }
  if (req.method !== "POST") throw new Refuse(405, "Use POST.", "bad-request");
  const parsed = parseBuilderAuth(req.headers.get("Authorization"));
  if (!parsed) throw new Refuse(401, "Send a Worldbuilder key (cfb_...) in the Authorization header.", "bad-key", true);
  const b = store.builder;
  if (!b) throw new Refuse(503, "The Worldbuilder isn't available here.", "unavailable");
  const game = url.searchParams.get("game");
  if (game !== null && game !== parsed.game) throw new Refuse(401, "That key isn't right.", "bad-key", true);
  const op = url.pathname.replace(/^\/api\/builder\//, "");
  // A code with no campaign behind it is a guess. Nothing is written for it (not even Activity).
  if ((await store.version(parsed.game)) === 0) throw new Refuse(401, "That key isn't right.", "bad-key", true);
  const key = await loadKey(b, parsed.keyId);
  const country = req.headers.get(COUNTRY_HEADER)?.slice(0, 2) || undefined;
  const fail = async (status: number, msg: string, code: string, miss: boolean) => {
    await audit(b, { at: now, keyId: parsed.keyId, label: key?.label ?? "(unknown key)", op: op.slice(0, 40), ok: false, code, ...(country ? { country } : {}) });
    return new Refuse(status, msg, code, miss);
  };
  if (!key || !builderKeyMatches(parsed.secret, key.hash)) throw await fail(401, "That key isn't right.", "bad-key", true);
  if (key.revokedAt) throw await fail(401, "That key was revoked. Ask the DM for a new one.", "revoked", true);
  if (key.expiresAt !== null && now >= key.expiresAt) throw await fail(401, "That key has expired. Ask the DM for a new one.", "expired", true);
  if (!(await builderEnabled(b))) throw await fail(403, "Builder access is off for this campaign. The DM can turn it on in Settings.", "off", false);
  if (!BUILDER_OPS.includes(op)) throw await fail(403, "The Worldbuilder can't do that. It can only read campaign notes and write drafts for the DM to review.", "forbidden", false);
  return { key, game: parsed.game, op };
}

export async function handleBuilder(req: Request, store: Store, now = Date.now()): Promise<Response> {
  let who: { key: BuilderKeyInfo; game: string; op: string } | null = null;
  const country = req.headers.get(COUNTRY_HEADER)?.slice(0, 2) || undefined;
  try {
    who = await admit(req, store, now);
    const { key, game, op } = who;
    const b = store.builder!;
    const usage = await spend(store, key.id, isWrite(op), now);
    const body = cleanDeep(await readBody(req));
    const batch = /^[a-z0-9]{8,32}$/.test(req.headers.get(BATCH_HEADER) ?? "") ? req.headers.get(BATCH_HEADER)! : "unbatched";
    const { state } = await store.read(game);
    if (!state) throw new Refuse(404, "No game here.", "no-game");
    const out = await run(op, body, { store, state, key, batch, now, usage });
    // Last used, no more than once a minute (saves a write per call).
    if (!key.lastUsedAt || now - key.lastUsedAt > 60_000) await saveKey(b, { ...key, lastUsedAt: now });
    await audit(b, { at: now, keyId: key.id, label: key.label, op, ok: true, ...(out.entity ? { entityType: out.entity.type, entityId: out.entity.id } : {}), ...(country ? { country } : {}) });
    return out.res;
  } catch (e) {
    if (e instanceof Refuse) {
      // Failures after the key was checked are logged here; earlier ones were logged by admit().
      if (who && store.builder) await audit(store.builder, { at: now, keyId: who.key.id, label: who.key.label, op: who.op, ok: false, code: e.code, ...(country ? { country } : {}) });
      return reply({ ok: false, error: e.message, code: e.code }, e.status, e.miss);
    }
    console.error("builder error", e instanceof Error ? e.name : "unknown");
    return reply({ ok: false, error: "Something went wrong on the server.", code: "server" }, 500);
  }
}

// ---------------------------------------------------------------- ops

interface Ctx {
  store: Store;
  state: GameState;
  key: BuilderKeyInfo;
  batch: string;
  now: number;
  usage: Usage;
}
interface Out {
  res: Response;
  entity?: { type: string; id: string };
}

function check<T>(schema: z.ZodType<T>, body: unknown): T {
  const r = schema.safeParse(body);
  if (!r.success) throw new Refuse(400, issueText(r.error), "invalid");
  return r.data;
}

const str = (x: unknown, max: number) => (typeof x === "string" ? x.slice(0, max) : undefined);

async function run(op: string, body: unknown, c: Ctx): Promise<Out> {
  const { state: g } = c;
  const b = c.store.builder!;
  const o = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const view = <T>(v: T) => (c.key.noSecrets ? withoutSecrets(v) : v);
  switch (op) {
    case "get_overview": {
      const mine = (await b.list(DRAFT_TBL, { limit: 400 })).map(rowToDraft).filter((d) => d.keyId === c.key.id).slice(0, 10);
      return {
        res: readReply(
          { ...view(builderOverview(g)), recent_drafts: mine.map((d) => ({ id: d.id, kind: d.kind, title: draftTitle(d), status: d.status })) },
          { limits: { ...limitsLeft(c.usage), pending_drafts: await b.count(DRAFT_TBL, "pending"), pending_cap: BUILDER_LIMITS.pending } },
        ),
      };
    }
    case "search": {
      const r = builderSearch(g, { type: str(o.type, 40), area: str(o.area, 40), text: str(o.text, 200) });
      return { res: readReply(r.hits, { more: r.more }) };
    }
    case "get_entry": {
      const id = str(o.id, 64) ?? "";
      const x = builderGet(g, id);
      if (!x) throw new Refuse(404, "Nothing in this campaign has that id. Use search to find one.", "not-found");
      return { res: readReply(view(x)), entity: { type: String(x.type), id } };
    }
    case "list_characters":
      return { res: readReply(view(builderCharacters(g))) };
    case "list_threads":
      return { res: readReply(view(builderThreads(g))) };
    case "list_beats":
      return { res: readReply(view(builderBeats(g, str(o.thread, 64)))) };
    case "list_my_drafts": {
      const status = str(o.status, 20);
      const mine = (await b.list(DRAFT_TBL, { limit: 1000 }))
        .map(rowToDraft)
        .filter((d) => d.keyId === c.key.id && (!status || d.status === status))
        .slice(0, 100);
      return { res: readReply(mine.map((d) => ({ id: d.id, kind: d.kind, status: d.status, title: draftTitle(d), created_at: new Date(d.createdAt).toISOString(), fields: d.body }))) };
    }
    case "suggest_change":
      return suggest(o, c);
    case "update_my_draft":
      return updateMine(o, c);
    case "withdraw_my_draft":
      return withdrawMine(o, c);
    default: {
      const kind = CREATE[op];
      if (!kind) throw new Refuse(403, "The Worldbuilder can't do that.", "forbidden");
      const input = check(DRAFT_SCHEMAS[kind] as z.ZodType<Record<string, unknown>>, body);
      await checkRefs(kind, input, c);
      const d = await addDraft(kind, input, c);
      return { res: savedReply(d, c), entity: { type: kind, id: d.id } };
    }
  }
}

function savedReply(d: Draft, c: Ctx): Response {
  return reply({ ok: true, draft_id: d.id, status: d.status, title: draftTitle(d), note: "Saved as a draft for the DM to review. Nothing changes in the game until they approve it.", limits: limitsLeft(c.usage) });
}

async function addDraft(kind: DraftKind, body: Record<string, unknown>, c: Ctx): Promise<Draft> {
  const b = c.store.builder!;
  if ((await b.count(DRAFT_TBL, "pending")) >= BUILDER_LIMITS.pending) {
    throw new Refuse(429, `There are ${BUILDER_LIMITS.pending} drafts waiting for review, the most allowed. Stop and ask the DM to review them.`, "pending-cap");
  }
  const d: Draft = { id: newDraftId(), keyId: c.key.id, label: c.key.label, batch: c.batch, kind, status: "pending", body, createdAt: c.now, updatedAt: c.now };
  if (JSON.stringify(d).length > BUILDER_LIMITS.draftBytes) throw new Refuse(413, `That draft is over ${BUILDER_LIMITS.draftBytes / 1024} KB. Split it up.`, "too-big");
  await saveDraft(b, d);
  return d;
}

/** Ids in a new draft must be real things of the right kind, or pending drafts of the right kind. */
async function checkRefs(kind: DraftKind, body: Record<string, unknown>, c: Ctx) {
  const want: { id: string; kind: "entry" | "thread" }[] = [];
  if (kind === "fact") want.push({ id: body.entry as string, kind: "entry" });
  if (kind === "link") want.push({ id: body.a as string, kind: "entry" }, { id: body.b as string, kind: "entry" });
  if (kind === "beat") want.push({ id: body.thread as string, kind: "thread" });
  for (const w of want) {
    if (DRAFT_ID_RE.test(w.id)) {
      const d = await loadDraft(c.store.builder!, w.id);
      if (!d || d.status !== "pending" || d.kind !== w.kind) throw new Refuse(400, `${w.id} isn't a pending ${w.kind} draft.`, "bad-ref");
      continue;
    }
    const ok = w.kind === "entry" ? entriesOf(c.state).some((e) => e.id === w.id) : storyOf(c.state).threads.some((t) => t.id === w.id);
    if (!ok) throw new Refuse(400, `No ${w.kind === "entry" ? "entry" : "thread"} has the id ${w.id}. Use search or list_threads.`, "bad-ref");
  }
}

/** What an id points at, for a suggestion. Only approved content; drafts are changed with update_my_draft. */
function findTarget(g: GameState, id: string): (SuggestTarget & { name: string; die?: number }) | null {
  for (const e of entriesOf(g)) {
    if (e.id === id) return { type: "entry", id, name: e.name };
    const f = e.facts.find((x) => x.id === id);
    if (f) return { type: "fact", id, entryId: e.id, name: `${e.name} (fact)` };
  }
  const st = storyOf(g);
  const b = st.beats.find((x) => x.id === id);
  if (b) return { type: "beat", id, name: b.title };
  const t = st.threads.find((x) => x.id === id);
  if (t) return { type: "thread", id, name: t.name || "A thread" };
  const m = monstersOf(g).find((x) => x.id === id);
  if (m) return { type: "monster", id, name: m.name };
  const j = jobsOf(g).find((x) => x.id === id);
  if (j) return { type: "job", id, name: j.title || "A flyer" };
  const n = noticesOf(g).find((x) => x.id === id);
  if (n) return { type: "notice", id, name: n.title || "A note" };
  const tb = tablesOf(g).find((x) => x.id === id);
  if (tb) return { type: "table", id, name: tb.name, die: tb.die };
  return null;
}

/** Fields as the builder names them (snake_case) to fields as stored. */
const FIELD_ALIAS: Record<string, string> = { dm_note: "dmNote", dm_notes: "dmNotes", secret: "secrets", posted_by: "postedBy", dm_adventure: "dm.adventure", dm_loot: "dm.loot", dm_twists: "dm.twists" };

async function suggest(o: Record<string, unknown>, c: Ctx): Promise<Out> {
  const input = check(suggestInput, o);
  if (DRAFT_ID_RE.test(input.target_id)) throw new Refuse(400, "That's a draft. Change your own drafts with update_my_draft.", "bad-ref");
  const t = findTarget(c.state, input.target_id);
  if (!t) throw new Refuse(404, "Nothing in this campaign has that id. Use search to find one.", "not-found");
  const type: SuggestType = t.type;
  let field = FIELD_ALIAS[input.field] ?? input.field;
  if (type === "job" && input.field === "dm_notes") field = "dm.notes";
  if (!SUGGEST_FIELDS[type].includes(field)) {
    throw new Refuse(403, `A suggestion can't change ${input.field} on a ${type}. It can change: ${SUGGEST_FIELDS[type].join(", ")}.`, "forbidden");
  }
  const v = suggestValue(t, field, input.value);
  if ("error" in v) throw new Refuse(400, v.error, "invalid");
  const target: SuggestTarget = { type: t.type, id: t.id, ...(t.entryId ? { entryId: t.entryId } : {}) };
  const before = currentValue(c.state, target, field);
  if (sameValue(before, v.value)) throw new Refuse(400, "That's what it already says.", "no-change");
  const body: SuggestionBody = { target, target_name: t.name, field, before, value: v.value, reason: input.reason };
  const d = await addDraft("suggestion", body as unknown as Record<string, unknown>, c);
  return { res: savedReply(d, c), entity: { type: `suggestion:${type}`, id: t.id } };
}

async function mine(o: Record<string, unknown>, c: Ctx): Promise<Draft> {
  const id = str(o.draft_id, 40) ?? "";
  const d = DRAFT_ID_RE.test(id) ? await loadDraft(c.store.builder!, id) : null;
  // Someone else's draft looks the same as no draft: a key learns nothing about other keys.
  if (!d || d.keyId !== c.key.id) throw new Refuse(404, "You have no draft with that id.", "not-yours");
  if (d.status !== "pending") throw new Refuse(409, `That draft was already ${d.status}, so it can't be changed.`, "not-yours");
  return d;
}

async function updateMine(o: Record<string, unknown>, c: Ctx): Promise<Out> {
  const d = await mine(o, c);
  const changes = o.changes;
  if (!changes || typeof changes !== "object" || Array.isArray(changes)) throw new Refuse(400, "Send the fields to change as changes: { ... }.", "invalid");
  if (d.kind === "suggestion") {
    const s = d.body as unknown as SuggestionBody;
    const ch = changes as Record<string, unknown>;
    const extra = Object.keys(ch).filter((k) => k !== "value" && k !== "reason");
    if (extra.length) throw new Refuse(400, "A suggestion's value and reason can change, nothing else.", "invalid");
    if (ch.value !== undefined) {
      const v = suggestValue({ ...s.target, die: tablesOf(c.state).find((x) => x.id === s.target.id)?.die }, s.field, ch.value);
      if ("error" in v) throw new Refuse(400, v.error, "invalid");
      s.value = v.value;
    }
    if (ch.reason !== undefined) s.reason = typeof ch.reason === "string" ? ch.reason.slice(0, 600) : s.reason;
  } else {
    const merged = { ...d.body, ...(changes as Record<string, unknown>) };
    for (const [k, v] of Object.entries(merged)) if (v === null) delete merged[k];
    d.body = check(DRAFT_SCHEMAS[d.kind as CreatableKind] as z.ZodType<Record<string, unknown>>, merged);
    await checkRefs(d.kind, d.body, c);
  }
  d.updatedAt = c.now;
  if (JSON.stringify(d).length > BUILDER_LIMITS.draftBytes) throw new Refuse(413, `That draft is over ${BUILDER_LIMITS.draftBytes / 1024} KB.`, "too-big");
  await saveDraft(c.store.builder!, d);
  return { res: savedReply(d, c), entity: { type: d.kind, id: d.id } };
}

async function withdrawMine(o: Record<string, unknown>, c: Ctx): Promise<Out> {
  const d = await mine(o, c);
  const b = c.store.builder!;
  d.status = "withdrawn";
  d.reviewedAt = c.now;
  await saveDraft(b, d);
  // Drafts that hang off it (a fact on a withdrawn person) go with it.
  const gone = new Set([d.id]);
  for (const r of (await b.list(DRAFT_TBL, { tag: "pending" })).map(rowToDraft)) {
    if (draftRefs(r).some((x) => gone.has(x))) {
      r.status = "withdrawn";
      r.reviewedAt = c.now;
      await saveDraft(b, r);
      gone.add(r.id);
    }
  }
  return { res: reply({ ok: true, withdrawn: [...gone] }), entity: { type: d.kind, id: d.id } };
}
