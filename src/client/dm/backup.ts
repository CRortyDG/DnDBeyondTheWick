import { readZip, writeZip, type ZipEntry } from "@/shared/zip";
import { api, authHeaders, type Ident } from "../api";

const FILE_URL = /\/api\/files\/[A-Za-z0-9/_.-]+\.(?:png|jpg|webp|gif|svg|avif|mp4|webm|mov)/g;
const TILE_TYPES: Record<string, string> = { webp: "image/webp", jpg: "image/jpeg", png: "image/png" };
const OTHER_TYPES: Record<string, string> = { gif: "image/gif", svg: "image/svg+xml", avif: "image/avif", mp4: "video/mp4", webm: "video/webm", mov: "video/quicktime" };

/**
 * Save the whole campaign to this computer: a zip with backup.json (the game
 * and the ledger) and every uploaded image it uses, so a restore works even if
 * the images are gone from the site. True when it worked.
 */
export async function downloadBackup(ident: Ident, toast: (m: string) => void): Promise<boolean> {
  try {
    const r = await fetch(`/api/export?game=${encodeURIComponent(ident.game)}`, { headers: authHeaders(ident), cache: "no-store" });
    if (!r.ok) throw new Error("Couldn't make a backup.");
    const text = await r.text();
    const urls = [...new Set(text.match(FILE_URL) ?? [])];
    const entries: ZipEntry[] = [{ name: "backup.json", data: new TextEncoder().encode(text) }];
    let missing = 0;
    for (let i = 0; i < urls.length; i++) {
      if (urls.length > 10 && i % 10 === 0) toast(`Saving images ${i + 1}–${Math.min(i + 10, urls.length)} of ${urls.length}…`);
      const img = await fetch(urls[i]).catch(() => null);
      if (!img?.ok) {
        missing++;
        continue;
      }
      entries.push({ name: "images" + urls[i].slice("/api/files".length), data: new Uint8Array(await img.arrayBuffer()) });
    }
    const blob = new Blob([writeZip(entries) as BlobPart], { type: "application/zip" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${ident.game}-backup-${new Date().toISOString().slice(0, 10)}.zip`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    toast(missing ? `Backup downloaded. ${missing} image${missing === 1 ? " was" : "s were"} already missing.` : `Backup downloaded with ${urls.length} image${urls.length === 1 ? "" : "s"}. Keep it somewhere safe.`);
    return true;
  } catch (e) {
    toast(e instanceof Error ? e.message : String(e));
    return false;
  }
}

/**
 * Restore a backup: the .zip from Download backup (images put back if the site
 * lost them), or an older .json backup on its own.
 */
export async function restoreBackup(ident: Ident, file: File, toast: (m: string) => void): Promise<void> {
  let text: string;
  if (/\.zip$/i.test(file.name) || file.type === "application/zip") {
    const entries = readZip(new Uint8Array(await file.arrayBuffer()));
    const json = entries.find((e) => e.name === "backup.json");
    if (!json) throw new Error("That zip has no backup.json in it.");
    text = new TextDecoder().decode(json.data);
    const images = new Map(entries.filter((e) => e.name.startsWith("images/")).map((e) => ["/api/files/" + e.name.slice(7), e.data]));
    text = await putImagesBack(ident, text, images, toast);
  } else {
    text = await file.text();
  }
  await api("/api/import", ident, { method: "POST", body: text });
}

/** Upload the images the site no longer has, and point the backup at their new addresses. */
async function putImagesBack(ident: Ident, text: string, images: Map<string, Uint8Array>, toast: (m: string) => void): Promise<string> {
  const gone: string[] = [];
  for (const url of new Set(text.match(FILE_URL) ?? [])) {
    if (!images.has(url)) continue;
    const r = await fetch(url, { method: "HEAD" }).catch(() => null);
    if (!r?.ok) gone.push(url);
  }
  if (!gone.length) return text;
  const moved = new Map<string, string>();
  const ext = (u: string) => u.slice(u.lastIndexOf(".") + 1);
  // Map pieces and photos go up in batches; anything else one at a time.
  const batchable = gone.filter((u) => TILE_TYPES[ext(u)]);
  const single = gone.filter((u) => !TILE_TYPES[ext(u)]);
  const send = async (path: string, form: FormData) => {
    for (;;) {
      const r = await fetch(`${path}?game=${encodeURIComponent(ident.game)}`, { method: "POST", body: form, headers: authHeaders(ident) });
      if (r.status === 429) {
        toast("Putting images back: waiting a minute for the upload limit…");
        await new Promise((res) => setTimeout(res, 61_000));
        continue;
      }
      const data = (await r.json().catch(() => ({}))) as { url?: string; urls?: string[]; error?: string };
      if (!r.ok) throw new Error(data.error ?? "Couldn't put the images back.");
      return data;
    }
  };
  let done = 0;
  for (let i = 0; i < batchable.length; ) {
    const form = new FormData();
    const batch: string[] = [];
    let bytes = 0;
    while (i < batchable.length && batch.length < 100 && bytes + images.get(batchable[i])!.length < 24 * 1024 * 1024) {
      const u = batchable[i++];
      const data = images.get(u)!;
      bytes += data.length;
      batch.push(u);
      form.append("tile", new File([data as BlobPart], u.slice(u.lastIndexOf("/") + 1), { type: TILE_TYPES[ext(u)] }));
    }
    if (!batch.length) {
      // One image over the batch size: send it on its own.
      const u = batchable[i++];
      single.push(u);
      continue;
    }
    const { urls } = await send("/api/upload-tiles", form);
    batch.forEach((u, k) => urls?.[k] && moved.set(u, urls[k]));
    done += batch.length;
    toast(`Putting images back: ${done} of ${gone.length}`);
  }
  for (const u of single) {
    const form = new FormData();
    form.append("file", new File([images.get(u)! as BlobPart], u.slice(u.lastIndexOf("/") + 1), { type: TILE_TYPES[ext(u)] ?? OTHER_TYPES[ext(u)] }));
    const { url } = await send("/api/upload", form);
    if (url) moved.set(u, url);
    done++;
    toast(`Putting images back: ${done} of ${gone.length}`);
  }
  for (const [from, to] of moved) text = text.split(from).join(to);
  return text;
}
