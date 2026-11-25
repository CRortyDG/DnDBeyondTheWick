import { presetFolder, type PresetRecord, type PresetStore } from "@/server/presets";
import { HttpError } from "@/server/game";
import { isDailyRefusal, type StorageAnswer, type StorageAsk } from "@/server/spend";

/** Asks the site's storage ceiling before each write (see src/server/spend.ts). */
export type StorageGuard = (ask: StorageAsk) => Promise<StorageAnswer>;

/** Presets in R2, next to the images: p/<code>/preset.json, and the preset's own images in p/<code>/. */
export class R2Presets implements PresetStore {
  constructor(
    private bucket: R2Bucket,
    private guard?: StorageGuard,
  ) {}

  private async room(bytes: number, ip?: string) {
    if (!this.guard) return;
    const a = await this.guard({ bytes, files: 1, ...(ip ? { ip } : {}) });
    if (!a.ok) throw new HttpError(isDailyRefusal(a.code) ? 429 : 507, a.error, a.code);
  }

  private key(code: string) {
    return `${presetFolder(code)}preset.json`;
  }

  async get(code: string): Promise<PresetRecord | null> {
    const obj = await this.bucket.get(this.key(code));
    if (!obj) return null;
    try {
      return (await obj.json()) as PresetRecord;
    } catch {
      return null;
    }
  }

  async put(code: string, rec: PresetRecord, ip?: string) {
    const body = JSON.stringify(rec);
    await this.room(body.length, ip);
    await this.bucket.put(this.key(code), body, { httpMetadata: { contentType: "application/json" }, customMetadata: { name: rec.name } });
  }

  async delete(code: string) {
    await this.bucket.delete(this.key(code));
  }

  async copyFile(key: string, code: string, ip?: string): Promise<string | null> {
    const obj = await this.bucket.get(key);
    if (!obj) return null;
    const to = presetFolder(code) + key.split("/").pop();
    await this.room(obj.size, ip);
    // One image at a time, as bytes: R2 wants a body of known length.
    await this.bucket.put(to, await obj.arrayBuffer(), { httpMetadata: obj.httpMetadata });
    return to;
  }
}
