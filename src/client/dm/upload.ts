import { authHeaders, type Ident } from "../api";

/** Upload an image (DM only) and return its URL. Stored in the campaign's folder in R2. */
export async function uploadImage(ident: Ident, file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("That isn't an image.");
  if (file.size > 25 * 1024 * 1024) throw new Error("That image is over 25 MB.");
  const form = new FormData();
  form.append("file", file);
  const r = await fetch(`/api/upload?game=${encodeURIComponent(ident.game)}`, { method: "POST", body: form, headers: authHeaders(ident) });
  const data = (await r.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!r.ok || !data.url) throw new Error(data.error ?? "Upload failed.");
  return data.url;
}

/**
 * Cut a map image into tiles in this browser and store them, for fog of war:
 * the TV and phones then only ever get the tiles that touch a clear cell.
 */
export async function cutAndUploadTiles(ident: Ident, src: string, grid: { cols: number; rows: number }): Promise<{ cols: number; rows: number; urls: string[]; src: string }> {
  const img = new Image();
  img.decoding = "async";
  img.src = src;
  await img.decode().catch(() => {
    throw new Error("Couldn't read the map image to cut it up.");
  });
  const W = img.naturalWidth;
  const H = img.naturalHeight;
  if (!W || !H) throw new Error("Couldn't read the map image to cut it up.");
  const form = new FormData();
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  for (let r = 0; r < grid.rows; r++) {
    for (let c = 0; c < grid.cols; c++) {
      const x0 = Math.round((c * W) / grid.cols);
      const x1 = Math.round(((c + 1) * W) / grid.cols);
      const y0 = Math.round((r * H) / grid.rows);
      const y1 = Math.round(((r + 1) * H) / grid.rows);
      canvas.width = Math.max(1, x1 - x0);
      canvas.height = Math.max(1, y1 - y0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, x0, y0, x1 - x0, y1 - y0, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/webp", 0.86));
      const out = blob && blob.type === "image/webp" ? blob : await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", 0.88));
      if (!out) throw new Error("Couldn't cut the map up in this browser.");
      form.append("tile", new File([out], `t${r}-${c}.${out.type === "image/webp" ? "webp" : "jpg"}`, { type: out.type }));
    }
  }
  const r = await fetch(`/api/upload-tiles?game=${encodeURIComponent(ident.game)}`, { method: "POST", body: form, headers: authHeaders(ident) });
  const data = (await r.json().catch(() => ({}))) as { urls?: string[]; error?: string };
  if (!r.ok || !data.urls) throw new Error(data.error ?? "Upload failed.");
  return { cols: grid.cols, rows: grid.rows, urls: data.urls, src };
}
