import { presetFolder, type PresetRecord, type PresetStore } from "@/server/presets";

/** Presets in R2, next to the images: p/<code>/preset.json, and the preset's own images in p/<code>/. */
export class R2Presets implements PresetStore {
  constructor(private bucket: R2Bucket) {}

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

  async put(code: string, rec: PresetRecord) {
    await this.bucket.put(this.key(code), JSON.stringify(rec), { httpMetadata: { contentType: "application/json" }, customMetadata: { name: rec.name } });
  }

  async delete(code: string) {
    await this.bucket.delete(this.key(code));
  }

  async copyFile(key: string, code: string): Promise<string | null> {
    const obj = await this.bucket.get(key);
    if (!obj) return null;
    const to = presetFolder(code) + key.split("/").pop();
    // One image at a time, as bytes: R2 wants a body of known length.
    await this.bucket.put(to, await obj.arrayBuffer(), { httpMetadata: obj.httpMetadata });
    return to;
  }
}
