import { authHeaders, type Ident } from "./api";

// Practice screens and gated art. A built-in portrait is served only to someone
// allowed to see it, and an <img> can't send the DM key. Every practice screen
// holds the DM key, so it fetches those pictures itself and shows them as blobs.

const ready = new Map<string, string>();
const loading = new Set<string>();
const ART = /\/api\/art\/([a-z0-9-]+)\?game=[a-z0-9-]+/g;

export function swapGatedArt<V>(view: V, ident: Ident, onLoaded: () => void): V {
  const text = JSON.stringify(view);
  let changed = false;
  const out = text.replace(ART, (m, name: string) => {
    const u = ready.get(name);
    if (u) {
      changed = true;
      return u;
    }
    if (!loading.has(name)) {
      loading.add(name);
      void fetch(`/api/art/${name}?game=${encodeURIComponent(ident.game)}&practice=1`, { headers: authHeaders(ident), cache: "no-store" })
        .then(async (r) => {
          if (r.ok) {
            ready.set(name, URL.createObjectURL(await r.blob()));
            onLoaded();
          }
        })
        .catch(() => {})
        .finally(() => loading.delete(name));
    }
    return m;
  });
  return changed ? (JSON.parse(out) as V) : view;
}
