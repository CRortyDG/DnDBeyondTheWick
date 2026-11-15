import type { PresetCounts } from "@/shared/presets";

/**
 * Presets this device saved. There are no accounts, so the list (with each
 * preset's owner token, which lets this device save over, rename or delete it)
 * lives in this browser only. The code alone is enough to start a campaign.
 */
export interface DevicePreset {
  code: string;
  token: string;
  name: string;
  savedAt: number;
}

const SLOT = "cf-presets";

export function devicePresets(): DevicePreset[] {
  try {
    const raw = JSON.parse(localStorage.getItem(SLOT) ?? "[]") as unknown;
    if (!Array.isArray(raw)) return [];
    return raw.filter((p): p is DevicePreset => !!p && typeof p.code === "string" && typeof p.token === "string" && typeof p.name === "string");
  } catch {
    return [];
  }
}

function store(list: DevicePreset[]) {
  try {
    localStorage.setItem(SLOT, JSON.stringify(list));
  } catch {}
}

/** Add or update one, newest first. */
export function rememberPreset(p: DevicePreset) {
  store([p, ...devicePresets().filter((x) => x.code !== p.code)]);
}

export function forgetPreset(code: string) {
  store(devicePresets().filter((x) => x.code !== code));
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(path, { ...init, cache: "no-store", headers: init.body ? { "Content-Type": "application/json" } : {} });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export interface PresetInfo {
  code: string;
  name: string;
  savedAt: number;
  counts: PresetCounts;
}

export const presetInfo = (code: string) => call<PresetInfo>(`/api/preset?code=${encodeURIComponent(code.trim().toLowerCase())}`);
export const renamePresetOnline = (p: DevicePreset, name: string) => call<{ name: string }>("/api/preset/rename", { method: "POST", body: JSON.stringify({ code: p.code, token: p.token, name }) });
export const deletePresetOnline = (p: DevicePreset) => call<{ ok: true }>("/api/preset/delete", { method: "POST", body: JSON.stringify({ code: p.code, token: p.token }) });

// ---------- the shared library ----------

export type PresetKind = "one-shot" | "campaign";

/** A listed preset, as anyone browsing sees it. */
export interface LibraryListing {
  code: string;
  title: string;
  description: string;
  kind: PresetKind;
  levels: string;
  length: string;
  cover?: string;
  counts: PresetCounts;
  firstEpisode?: { title: string; beats: string[] };
  publishedAt: number;
  updatedAt: number;
}

/** The site owner's view of a listing. */
export interface AdminListing extends LibraryListing {
  hidden?: boolean;
  takenDown?: boolean;
  reports: { at: number; reason: string }[];
}

export interface PublishFields {
  title: string;
  description: string;
  kind: PresetKind;
  levels: string;
  length: string;
  /** An uploaded picture's URL; null removes the cover. */
  cover: string | null;
}

const post = <T,>(path: string, body: unknown, headers: Record<string, string> = {}) =>
  fetch(path, { method: "POST", cache: "no-store", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body) }).then(async (res) => {
    const data = (await res.json().catch(() => ({}))) as T & { error?: string };
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data;
  });

export const browseLibrary = () => call<{ listings: LibraryListing[] }>("/api/library").then((r) => r.listings);
export const libraryItem = (code: string) => call<LibraryListing>(`/api/library/item?code=${encodeURIComponent(code)}`);
export const libraryStatus = (p: DevicePreset) => post<{ listed: boolean; hidden: boolean; listing?: LibraryListing }>("/api/library/status", { code: p.code, token: p.token });
export const publishPreset = (p: DevicePreset, f: PublishFields) => post<LibraryListing>("/api/library/publish", { code: p.code, token: p.token, ...f });
export const refreshListing = (p: DevicePreset) => post<{ listed: boolean }>("/api/library/refresh", { code: p.code, token: p.token });
export const unpublishPreset = (p: DevicePreset) => post<{ ok: true }>("/api/library/unpublish", { code: p.code, token: p.token });
export const reportListing = (code: string, reason: string) => post<{ ok: true }>("/api/library/report", { code, reason });
export const adminListings = (key: string) =>
  fetch("/api/library/admin", { cache: "no-store", headers: { "x-library-admin": key } }).then(async (res) => {
    const data = (await res.json().catch(() => ({}))) as { listings?: AdminListing[]; error?: string };
    if (res.status === 404) throw new Error("The admin page isn't switched on. Set the LIBRARY_ADMIN_KEY secret (16+ characters) in the Cloudflare dashboard.");
    if (!res.ok || !data.listings) throw new Error(data.error || `Request failed (${res.status})`);
    return data.listings;
  });
export const adminAct = (key: string, code: string, action: "hide" | "show" | "clear-reports" | "takedown") => post<{ ok: true }>("/api/library/admin", { code, action }, { "x-library-admin": key });
