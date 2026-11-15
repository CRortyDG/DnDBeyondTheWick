import { DurableObject } from "cloudflare:workers";
import { handleLibraryApi } from "@/server/api";
import { Library, type LibraryKv } from "@/server/library";
import type { Env } from "./env";
import { R2Presets } from "./presets";

/**
 * The shared preset library: one instance (named "library") keeps every listing,
 * report and hide, so writes never race. Presets and images stay in R2.
 */
export class LibraryRoom extends DurableObject<Env> {
  async fetch(req: Request): Promise<Response> {
    const kv: LibraryKv = {
      get: (k) => this.ctx.storage.get(k),
      put: (k, v) => this.ctx.storage.put(k, v),
      delete: (k) => this.ctx.storage.delete(k),
      list: (o) => this.ctx.storage.list(o),
    };
    const files = this.env.FILES;
    const wipe = async (prefix: string) => {
      let cursor: string | undefined;
      do {
        const page = await files.list({ prefix, cursor });
        if (page.objects.length) await files.delete(page.objects.map((o) => o.key));
        cursor = page.truncated ? page.cursor : undefined;
      } while (cursor);
    };
    return handleLibraryApi(req, new Library(kv, new R2Presets(files), wipe, this.env.LIBRARY_ADMIN_KEY));
  }
}
