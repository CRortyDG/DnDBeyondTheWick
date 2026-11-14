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
