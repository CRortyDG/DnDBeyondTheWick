import { sha256 } from "./auth";
import { HttpError, MAX_STATE_CHARS } from "./game";
import { upgrade } from "@/shared/migrate";
import { presetCounts, PRESET_CODE, PRESET_NAME_MAX } from "@/shared/presets";
import type { GameState } from "@/shared/types";

/**
 * Saved presets. There are no DM accounts, so a preset is one stored file named
 * by a random code. Anyone with the code can start a campaign from it; only the
 * device that saved it (it holds the owner token) can save over, rename or
 * delete it. In production the files live in R2 (worker/presets.ts).
 */

export interface PresetRecord {
  v: 1;
  name: string;
  savedAt: number;
  /** sha256 of the owner token. */
  ownerHash: string;
  setup: GameState;
}

export interface PresetStore {
  get(code: string): Promise<PresetRecord | null>;
  put(code: string, rec: PresetRecord): Promise<void>;
  delete(code: string): Promise<void>;
  /**
   * Copy an uploaded image into the preset's own folder, so it outlives the
   * campaign it came from. Returns the new file key, or null if the image is gone.
   */
  copyFile(key: string, code: string): Promise<string | null>;
}

/** Where a preset's images live. Campaign folders are 3+ characters, so "p/" is never one. */
export const presetFolder = (code: string) => `p/${code}/`;

/** At most this many images per preset (a copy is two storage operations each). */
export const MAX_PRESET_FILES = 300;

const FILE_URL = /\/api\/files\/((?:p\/[a-z0-9]{10}|[a-z0-9-]{1,40})\/[0-9a-f]{24}\.(?:png|jpg|webp|gif|svg|avif|mp4|webm|mov))/g;

function randomCode(n: number, alphabet: string): string {
  const bytes = new Uint8Array(n);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => alphabet[b % alphabet.length]).join("");
}
export const newPresetCode = () => randomCode(10, "abcdefghjkmnpqrstuvwxyz23456789");
export const newOwnerToken = () => randomCode(32, "abcdefghijklmnopqrstuvwxyz0123456789");

export function cleanPresetName(raw: unknown): string {
  const name = typeof raw === "string" ? raw.replace(/\s+/g, " ").trim().slice(0, PRESET_NAME_MAX) : "";
  if (!name) throw new HttpError(400, "Give the preset a name.");
  return name;
}

export function checkCode(raw: unknown): string {
  const code = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  if (!PRESET_CODE.test(code)) throw new HttpError(404, "There's no preset with that code.", "no-preset");
  return code;
}

/** Copy every image the setup uses into the preset's folder, and point the setup at the copies. */
async function withOwnFiles(setup: GameState, code: string, presets: PresetStore): Promise<GameState> {
  let text = JSON.stringify(setup);
  const keys = [...new Set([...text.matchAll(FILE_URL)].map((m) => m[1]))].filter((k) => !k.startsWith(presetFolder(code)));
  if (keys.length > MAX_PRESET_FILES) throw new HttpError(413, `That campaign uses ${keys.length} images; a preset can hold ${MAX_PRESET_FILES}.`);
  const moved = new Map<string, string>();
  for (const k of keys) {
    const to = await presets.copyFile(k, code);
    if (to) moved.set(k, to);
  }
  if (moved.size) text = text.replace(FILE_URL, (all, k: string) => (moved.has(k) ? `/api/files/${moved.get(k)}` : all));
  return JSON.parse(text) as GameState;
}

export interface SavedPreset {
  code: string;
  token: string;
  name: string;
  savedAt: number;
}

/**
 * Save a setup as a preset. With the code and owner token of an existing
 * preset, saves over it; otherwise makes a new one with a new code and token.
 */
export async function savePreset(presets: PresetStore, setup: GameState, opts: { name?: unknown; code?: unknown; token?: unknown }, now = Date.now()): Promise<SavedPreset> {
  const name = cleanPresetName(opts.name);
  let code: string | null = null;
  let token: string | null = null;
  if (opts.code !== undefined && opts.code !== null) {
    const c = checkCode(opts.code);
    const old = await presets.get(c);
    if (!old || typeof opts.token !== "string" || sha256(opts.token) !== old.ownerHash) throw new HttpError(403, "This device didn't save that preset, so it can't save over it. Save a new one instead.");
    code = c;
    token = opts.token;
  } else {
    for (let i = 0; i < 5 && !code; i++) {
      const c = newPresetCode();
      if (!(await presets.get(c))) code = c;
    }
    if (!code) throw new HttpError(503, "Couldn't find a free preset code. Try again.");
    token = newOwnerToken();
  }
  const own = await withOwnFiles(setup, code, presets);
  if (JSON.stringify(own).length > MAX_STATE_CHARS) throw new HttpError(413, "That campaign is too big to save as a preset.");
  await presets.put(code, { v: 1, name, savedAt: now, ownerHash: sha256(token), setup: own });
  return { code, token, name, savedAt: now };
}

/** A preset's setup, ready to start a campaign from. */
export async function loadPreset(presets: PresetStore, rawCode: unknown): Promise<{ code: string; name: string; setup: GameState }> {
  const code = checkCode(rawCode);
  const rec = await presets.get(code);
  if (!rec) throw new HttpError(404, "There's no preset with that code. It may have been deleted.", "no-preset");
  return { code, name: rec.name, setup: upgrade(rec.setup) };
}

function owned(rec: PresetRecord | null, token: unknown): rec is PresetRecord {
  return !!rec && typeof token === "string" && sha256(token) === rec.ownerHash;
}

/** What the create screen shows for a code. Nothing secret: no DM notes, just counts. */
export async function presetInfo(presets: PresetStore, rawCode: unknown) {
  const { code, name, setup } = await loadPreset(presets, rawCode);
  const rec = (await presets.get(code))!;
  return { code, name, savedAt: rec.savedAt, counts: presetCounts(setup) };
}

export async function renamePreset(presets: PresetStore, rawCode: unknown, token: unknown, rawName: unknown) {
  const code = checkCode(rawCode);
  const name = cleanPresetName(rawName);
  const rec = await presets.get(code);
  if (!owned(rec, token)) throw new HttpError(403, "Only the device that saved this preset can rename it.");
  await presets.put(code, { ...rec, name });
  return { code, name };
}

/**
 * Deletes the preset itself. Its images stay: campaigns already started from
 * it still show them.
 */
export async function deletePreset(presets: PresetStore, rawCode: unknown, token: unknown) {
  const code = checkCode(rawCode);
  const rec = await presets.get(code);
  if (!rec) return { ok: true };
  if (!owned(rec, token)) throw new HttpError(403, "Only the device that saved this preset can delete it.");
  await presets.delete(code);
  return { ok: true };
}

/** Tests only. */
export class MemoryPresets implements PresetStore {
  readonly records = new Map<string, PresetRecord>();
  readonly files = new Map<string, string>();
  async get(code: string) {
    const r = this.records.get(code);
    return r ? structuredClone(r) : null;
  }
  async put(code: string, rec: PresetRecord) {
    this.records.set(code, structuredClone(rec));
  }
  async delete(code: string) {
    this.records.delete(code);
  }
  async copyFile(key: string, code: string) {
    const body = this.files.get(key);
    if (body === undefined) return null;
    const to = presetFolder(code) + key.split("/").pop();
    this.files.set(to, body);
    return to;
  }
}
