// The shared preset library: presets their authors chose to list, so any DM can
// browse them and start a campaign from one. A listing is a small card (title,
// description, tags, cover, what's inside); the preset itself stays where
// presets live (R2, p/<code>/). Listings, reports and hides are kept by one
// Durable Object (worker/library.ts), so two publishes can't overwrite each other.
//
// There are no accounts: the device that saved a preset (its owner token) can
// publish, refresh and unpublish it. The site owner hides or takes down listings
// from /library/admin with LIBRARY_ADMIN_KEY, a secret set in the dashboard.

import { sha256 } from "./auth";
import { HttpError } from "./game";
import { loadPreset, owned, presetFolder, type PresetStore } from "./presets";
import { presetCounts, type PresetCounts } from "@/shared/presets";
import { checkCode } from "./presets";
import type { GameState } from "@/shared/types";

/** At most this many listings (shown or hidden) at once. */
export const LIBRARY_MAX = 500;
export const TITLE_MAX = 60;
export const DESCRIPTION_MAX = 400;
export const REASON_MAX = 300;
export const REPORTS_KEPT = 20;
export const BEATS_SHOWN = 12;

export type PresetKind = "one-shot" | "campaign";

export interface Listing {
  code: string;
  title: string;
  description: string;
  kind: PresetKind;
  /** "1–4", "3". Free text, short. */
  levels: string;
  /** "1 session", "6–10 sessions". */
  length: string;
  /** An image in the preset's own folder. */
  cover?: string;
  counts: PresetCounts;
  /** The first episode's title and beat titles (never its notes or read-aloud). */
  firstEpisode?: { title: string; beats: string[] };
  publishedAt: number;
  updatedAt: number;
  /** Hidden by the site owner: off the library, the code still works. */
  hidden?: boolean;
  /** Taken down by the site owner: hidden, the preset and its images deleted. */
  takenDown?: boolean;
  reports: { at: number; reason: string }[];
  /** sha256 of reporters' addresses, so one connection reports a listing once. */
  reporters: string[];
}

/** What anyone browsing sees. */
export type PublicListing = Omit<Listing, "hidden" | "takenDown" | "reports" | "reporters">;

/** What Durable Object storage gives us (and the tests' Map). */
export interface LibraryKv {
  get<T>(key: string): Promise<T | undefined>;
  put<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<boolean>;
  list<T>(opts: { prefix: string }): Promise<Map<string, T>>;
}

/** Deletes a preset's whole folder (images included). */
export type FolderWiper = (prefix: string) => Promise<void>;

const key = (code: string) => `l:${code}`;
const COVER_URL = /^\/api\/files\/((?:p\/[a-z0-9]{10}|[a-z0-9-]{1,40})\/[0-9a-f]{24}\.(?:png|jpg|webp|gif|avif))$/;

export function publicListing(l: Listing): PublicListing {
  const { hidden: _h, takenDown: _t, reports: _r, reporters: _p, ...pub } = l;
  return pub;
}

/** What the preview shows: counts, and the first episode's beat titles. */
export function previewOf(setup: GameState): Pick<Listing, "counts" | "firstEpisode"> {
  const ep = (setup.episodes ?? [])[0];
  return {
    counts: presetCounts(setup),
    ...(ep ? { firstEpisode: { title: ep.title, beats: ep.beats.slice(0, BEATS_SHOWN).map((b) => b.title) } } : {}),
  };
}

function line(raw: unknown, max: number): string {
  return typeof raw === "string" ? raw.replace(/\s+/g, " ").trim().slice(0, max) : "";
}

export interface PublishInput {
  code?: unknown;
  token?: unknown;
  title?: unknown;
  description?: unknown;
  kind?: unknown;
  levels?: unknown;
  length?: unknown;
  cover?: unknown;
}

export class Library {
  constructor(
    private kv: LibraryKv,
    private presets: PresetStore,
    private wipe: FolderWiper,
    private adminKey: string | undefined,
    private now: () => number = Date.now,
  ) {}

  private async all(): Promise<Listing[]> {
    return [...(await this.kv.list<Listing>({ prefix: "l:" })).values()];
  }

  /** Every listing that's up, newest first. */
  async browse(): Promise<PublicListing[]> {
    return (await this.all())
      .filter((l) => !l.hidden)
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .map(publicListing);
  }

  async one(rawCode: unknown): Promise<PublicListing> {
    const l = await this.kv.get<Listing>(key(checkCode(rawCode)));
    if (!l || l.hidden) throw new HttpError(404, "That preset isn't in the library.");
    return publicListing(l);
  }

  /** The owner checks how their preset stands: not listed, listed, or hidden by the site owner. */
  async status(rawCode: unknown, token: unknown): Promise<{ listed: boolean; hidden: boolean; listing?: PublicListing }> {
    const code = checkCode(rawCode);
    await this.owner(code, token);
    const l = await this.kv.get<Listing>(key(code));
    return l ? { listed: true, hidden: !!l.hidden, listing: publicListing(l) } : { listed: false, hidden: false };
  }

  private async owner(code: string, token: unknown) {
    const rec = await this.presets.get(code);
    if (!rec) throw new HttpError(404, "There's no preset with that code. It may have been deleted.", "no-preset");
    if (!owned(rec, token)) throw new HttpError(403, "Only the device that saved this preset can list it.");
  }

  /** List a preset, or update its listing. A listing the site owner hid stays hidden. */
  async publish(input: PublishInput): Promise<PublicListing> {
    const code = checkCode(input.code);
    await this.owner(code, input.token);
    const title = line(input.title, TITLE_MAX);
    if (!title) throw new HttpError(400, "Give it a title.");
    const kind: PresetKind = input.kind === "one-shot" ? "one-shot" : "campaign";
    const old = await this.kv.get<Listing>(key(code));
    if (old?.takenDown) throw new HttpError(403, "This preset was taken down and can't be listed again.");
    if (!old && (await this.all()).length >= LIBRARY_MAX) throw new HttpError(503, "The library is full right now. Try again later.");
    const { setup } = await loadPreset(this.presets, code);
    const t = this.now();
    const listing: Listing = {
      code,
      title,
      description: typeof input.description === "string" ? input.description.trim().slice(0, DESCRIPTION_MAX) : "",
      kind,
      levels: line(input.levels, 12),
      length: line(input.length, 30),
      ...previewOf(setup),
      publishedAt: old?.publishedAt ?? t,
      updatedAt: t,
      reports: old?.reports ?? [],
      reporters: old?.reporters ?? [],
      ...(old?.hidden ? { hidden: true } : {}),
    };
    const cover = await this.coverFor(code, input.cover === undefined ? old?.cover : input.cover);
    if (cover) listing.cover = cover;
    await this.kv.put(key(code), listing);
    return publicListing(listing);
  }

  /** A cover must be an uploaded picture. It's copied into the preset's own folder, so it outlives the campaign. */
  private async coverFor(code: string, raw: unknown): Promise<string | undefined> {
    if (raw === null || raw === "" || raw === undefined) return undefined;
    const m = typeof raw === "string" ? COVER_URL.exec(raw) : null;
    if (!m) throw new HttpError(400, "The cover must be a picture you uploaded.");
    if (m[1].startsWith(presetFolder(code))) return raw as string;
    const to = await this.presets.copyFile(m[1], code);
    if (!to) throw new HttpError(400, "That cover picture is gone. Upload it again.");
    return `/api/files/${to}`;
  }

  /** After "Save over": the listing's counts and first episode follow the new setup. */
  async refresh(rawCode: unknown, token: unknown): Promise<{ listed: boolean }> {
    const code = checkCode(rawCode);
    await this.owner(code, token);
    const l = await this.kv.get<Listing>(key(code));
    if (!l) return { listed: false };
    const { setup } = await loadPreset(this.presets, code);
    await this.kv.put(key(code), { ...l, ...previewOf(setup), updatedAt: this.now() });
    return { listed: true };
  }

  /** Take it out of the library. Its code keeps working. */
  async unpublish(rawCode: unknown, token: unknown): Promise<{ ok: true }> {
    const code = checkCode(rawCode);
    const l = await this.kv.get<Listing>(key(code));
    if (!l) return { ok: true };
    await this.owner(code, token);
    // A hidden listing stays on record (so the site owner's decision sticks); the author just stops seeing it as listed.
    if (l.hidden) return { ok: true };
    await this.kv.delete(key(code));
    return { ok: true };
  }

  /** Anyone can report a listing, once per connection. Reports never hide anything by themselves. */
  async report(rawCode: unknown, rawReason: unknown, reporterIp: string): Promise<{ ok: true }> {
    const code = checkCode(rawCode);
    const l = await this.kv.get<Listing>(key(code));
    if (!l || l.hidden) throw new HttpError(404, "That preset isn't in the library.");
    const who = sha256(`report:${reporterIp}`);
    if (l.reporters.includes(who)) return { ok: true };
    const reason = typeof rawReason === "string" ? rawReason.trim().slice(0, REASON_MAX) : "";
    await this.kv.put(key(code), { ...l, reports: [...l.reports, { at: this.now(), reason: reason || "(no reason given)" }].slice(-REPORTS_KEPT), reporters: [...l.reporters, who].slice(-200) });
    return { ok: true };
  }

  // ---------- the site owner ----------

  private admin(given: string | null) {
    if (!this.adminKey || this.adminKey.length < 16) throw new HttpError(404, "Not found.");
    if (!given || sha256(given) !== sha256(this.adminKey)) throw new HttpError(403, "That admin key didn't work.", "bad-key");
  }

  /** Everything, reported first, with reports. */
  async adminList(given: string | null): Promise<Listing[]> {
    this.admin(given);
    return (await this.all()).map((l) => ({ ...l, reporters: [] })).sort((a, b) => b.reports.length - a.reports.length || b.updatedAt - a.updatedAt);
  }

  async adminAct(given: string | null, rawCode: unknown, action: unknown): Promise<{ ok: true }> {
    this.admin(given);
    const code = checkCode(rawCode);
    const l = await this.kv.get<Listing>(key(code));
    if (!l) throw new HttpError(404, "No listing with that code.");
    if (action === "hide") await this.kv.put(key(code), { ...l, hidden: true });
    else if (action === "show") {
      if (l.takenDown) throw new HttpError(400, "A taken-down preset can't come back.");
      const { hidden: _h, ...rest } = l;
      await this.kv.put(key(code), rest);
    } else if (action === "clear-reports") await this.kv.put(key(code), { ...l, reports: [], reporters: [] });
    else if (action === "takedown") {
      // The preset file and every image in its folder go. Campaigns already started from it keep their text but lose those images.
      await this.presets.delete(code);
      await this.wipe(presetFolder(code));
      const { cover: _c, ...rest } = l;
      await this.kv.put(key(code), { ...rest, hidden: true, takenDown: true });
    } else throw new HttpError(400, "Unknown action.");
    return { ok: true };
  }
}

/** Tests only: Durable Object storage as a Map. */
export class MemoryKv implements LibraryKv {
  readonly map = new Map<string, unknown>();
  async get<T>(k: string) {
    const v = this.map.get(k);
    return v === undefined ? undefined : (structuredClone(v) as T);
  }
  async put<T>(k: string, v: T) {
    this.map.set(k, structuredClone(v));
  }
  async delete(k: string) {
    return this.map.delete(k);
  }
  async list<T>({ prefix }: { prefix: string }) {
    return new Map([...this.map].filter(([k]) => k.startsWith(prefix)).map(([k, v]) => [k, structuredClone(v) as T]));
  }
}
