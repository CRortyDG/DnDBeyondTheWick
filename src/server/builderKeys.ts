import { randomBytes, randomInt } from "node:crypto";
import { sameHash, sha256 } from "./auth";
import type { BuilderRow, BuilderStore } from "./builderStore";
import type { Draft } from "@/shared/builderInput";

/**
 * Worldbuilder keys: cfb_<campaign code>_<key id>_<64 hex>. The secret is 32
 * random bytes and only its SHA-256 is stored. The campaign code and key id in
 * front let the Worker find the right room and row without anything in the URL.
 */
export const BUILDER_KEY_RE = /^cfb_([a-z0-9][a-z0-9-]{0,39})_([a-z0-9]{8})_([0-9a-f]{64})$/;
export const BEARER_PREFIX = "Bearer cfb_";

export interface ParsedBuilderKey {
  game: string;
  keyId: string;
  secret: string;
}

/** The key from an Authorization header, or null. */
export function parseBuilderAuth(header: string | null): ParsedBuilderKey | null {
  if (!header || !header.startsWith("Bearer ")) return null;
  const m = BUILDER_KEY_RE.exec(header.slice(7).trim());
  return m ? { game: m[1], keyId: m[2], secret: m[0] } : null;
}

/** Does this request carry a builder key (well formed or not)? DM and player routes refuse it. */
export function carriesBuilderKey(req: Request): boolean {
  return (req.headers.get("Authorization") ?? "").trim().startsWith(BEARER_PREFIX);
}

const ID_CHARS = "abcdefghijkmnpqrstuvwxyz23456789";

export function newBuilderKey(game: string): { key: string; keyId: string; hash: string } {
  let keyId = "";
  for (let i = 0; i < 8; i++) keyId += ID_CHARS[randomInt(ID_CHARS.length)];
  const key = `cfb_${game}_${keyId}_${randomBytes(32).toString("hex")}`;
  return { key, keyId, hash: sha256(key) };
}

export function builderKeyMatches(key: string, hash: string): boolean {
  return sameHash(sha256(key), hash);
}

export function newDraftId(): string {
  let t = "bd_";
  for (let i = 0; i < 12; i++) t += "abcdefghijklmnopqrstuvwxyz0123456789"[randomInt(36)];
  return t;
}

// ---------------------------------------------------------------- rows

export interface BuilderKeyInfo {
  id: string;
  label: string;
  hash: string;
  createdAt: number;
  expiresAt: number | null;
  lastUsedAt: number | null;
  revokedAt: number | null;
  /** Reads leave out secrets and DM notes. */
  noSecrets: boolean;
}

export interface AuditEntry {
  id: string;
  at: number;
  keyId: string;
  label: string;
  op: string;
  ok: boolean;
  code?: string;
  entityType?: string;
  entityId?: string;
  country?: string;
}

export const KEY_TBL = "key";
export const SET_TBL = "set";
export const DRAFT_TBL = "draft";
export const AUDIT_TBL = "audit";
export const USE_TBL = "use";

/** Activity kept: the newest this many rows, none older than AUDIT_DAYS. */
export const AUDIT_KEEP = 5000;
export const AUDIT_DAYS = 90;

export async function loadKey(b: BuilderStore, id: string): Promise<BuilderKeyInfo | null> {
  const r = await b.get(KEY_TBL, id);
  return r ? ({ ...(JSON.parse(r.body) as Omit<BuilderKeyInfo, "id">), id } as BuilderKeyInfo) : null;
}
export async function saveKey(b: BuilderStore, k: BuilderKeyInfo) {
  const { id, ...rest } = k;
  await b.put(KEY_TBL, { id, at: k.createdAt, tag: "", body: JSON.stringify(rest) });
}
export async function listKeys(b: BuilderStore): Promise<BuilderKeyInfo[]> {
  return (await b.list(KEY_TBL)).map((r) => ({ ...(JSON.parse(r.body) as Omit<BuilderKeyInfo, "id">), id: r.id }));
}

/** Builder access (the kill switch). Off until the DM turns it on. */
export async function builderEnabled(b: BuilderStore): Promise<boolean> {
  const r = await b.get(SET_TBL, "on");
  return !!r && (JSON.parse(r.body) as { enabled?: boolean }).enabled === true;
}
export async function setBuilderEnabled(b: BuilderStore, enabled: boolean, now: number) {
  await b.put(SET_TBL, { id: "on", at: now, tag: "", body: JSON.stringify({ enabled }) });
}

export function rowToDraft(r: BuilderRow): Draft {
  return JSON.parse(r.body) as Draft;
}
export async function saveDraft(b: BuilderStore, d: Draft) {
  await b.put(DRAFT_TBL, { id: d.id, at: d.createdAt, tag: d.status, body: JSON.stringify(d) });
}
export async function loadDraft(b: BuilderStore, id: string): Promise<Draft | null> {
  const r = await b.get(DRAFT_TBL, id);
  return r ? rowToDraft(r) : null;
}

let auditSeq = 0;
/** One line of Activity. Never the key, never a body. Old lines are trimmed now and then. */
export async function audit(b: BuilderStore, e: Omit<AuditEntry, "id">) {
  const id = `${e.at.toString(36).padStart(9, "0")}${(auditSeq++ % 1296).toString(36).padStart(2, "0")}${randomInt(1296).toString(36).padStart(2, "0")}`;
  await b.put(AUDIT_TBL, { id, at: e.at, tag: e.keyId, body: JSON.stringify(e) });
  if (randomInt(50) === 0) await b.prune(AUDIT_TBL, AUDIT_KEEP, e.at - AUDIT_DAYS * 86_400_000);
}
export async function listAudit(b: BuilderStore, opts: { keyId?: string; from?: number; to?: number; limit?: number }): Promise<AuditEntry[]> {
  const rows = await b.list(AUDIT_TBL, { ...(opts.keyId ? { tag: opts.keyId } : {}), limit: 2000 });
  return rows
    .map((r) => ({ ...(JSON.parse(r.body) as Omit<AuditEntry, "id">), id: r.id }))
    .filter((e) => (opts.from === undefined || e.at >= opts.from) && (opts.to === undefined || e.at <= opts.to))
    .slice(0, opts.limit ?? 500);
}
