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

const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

/** Send one file to the campaign's store, with progress (videos take a while on home Wi-Fi). */
function send(ident: Ident, file: File, onProgress?: (frac: number) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("file", file);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/api/upload?game=${encodeURIComponent(ident.game)}`);
    for (const [k, v] of Object.entries(authHeaders(ident))) xhr.setRequestHeader(k, v);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(e.loaded / e.total);
    xhr.onload = () => {
      let data: { url?: string; error?: string } = {};
      try {
        data = JSON.parse(xhr.responseText);
      } catch {}
      if (xhr.status >= 200 && xhr.status < 300 && data.url) resolve(data.url);
      else reject(new Error(data.error ?? "Upload failed."));
    };
    xhr.onerror = () => reject(new Error("Upload failed. Check the connection and try again."));
    xhr.send(form);
  });
}

/** Upload a video clip (MP4, WebM or MOV) and return its URL. */
export async function uploadVideo(ident: Ident, file: File, max: number, onProgress?: (frac: number) => void): Promise<string> {
  if (!VIDEO_TYPES.includes(file.type)) throw new Error("That isn't a video this site can play. MP4 plays everywhere.");
  if (file.size > max) throw new Error(`That video is ${mb(file.size)}. The limit is ${mb(max)}: about a minute of 720p.`);
  return send(ident, file, onProgress);
}

export const mb = (n: number) => `${(n / 1024 / 1024).toFixed(n < 10 * 1024 * 1024 ? 1 : 0)} MB`;

/** A still of a clip's first frame (or a GIF's), as a JPEG, for link previews and while the clip loads. */
export async function firstFrame(file: File): Promise<File | null> {
  const url = URL.createObjectURL(file);
  try {
    let src: CanvasImageSource;
    let w: number;
    let h: number;
    if (file.type === "image/gif") {
      const img = new Image();
      img.src = url;
      await img.decode();
      [src, w, h] = [img, img.naturalWidth, img.naturalHeight];
    } else {
      const v = document.createElement("video");
      v.muted = true;
      v.playsInline = true;
      v.preload = "auto";
      v.src = url;
      await new Promise<void>((res, rej) => {
        v.onloadeddata = () => res();
        v.onerror = () => rej(new Error("no frame"));
        setTimeout(() => rej(new Error("timeout")), 8000);
      });
      // A moment in, past any black first frame.
      v.currentTime = Math.min(0.5, (v.duration || 1) / 4);
      await new Promise<void>((res) => {
        v.onseeked = () => res();
        setTimeout(res, 2000);
      });
      [src, w, h] = [v, v.videoWidth, v.videoHeight];
    }
    if (!w || !h) return null;
    const k = Math.min(1, 1200 / w);
    const c = document.createElement("canvas");
    c.width = Math.round(w * k);
    c.height = Math.round(h * k);
    c.getContext("2d")!.drawImage(src, 0, 0, c.width, c.height);
    const blob = await new Promise<Blob | null>((res) => c.toBlob(res, "image/jpeg", 0.82));
    return blob ? new File([blob], "poster.jpg", { type: "image/jpeg" }) : null;
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** How long a video is, in seconds (0 when the browser can't tell). */
export function clipSeconds(file: File): Promise<number> {
  if (!file.type.startsWith("video/")) return Promise.resolve(0);
  const url = URL.createObjectURL(file);
  const v = document.createElement("video");
  v.preload = "metadata";
  v.src = url;
  return new Promise((res) => {
    const done = (n: number) => {
      URL.revokeObjectURL(url);
      res(Number.isFinite(n) ? n : 0);
    };
    v.onloadedmetadata = () => done(v.duration);
    v.onerror = () => done(0);
    setTimeout(() => done(0), 5000);
  });
}

/** Phones don't need more than 1600 px across: shrink big photos before they go up. GIFs and SVGs go as they are. */
export async function shrinkImage(file: File, maxW = 1600): Promise<File> {
  if (!/^image\/(png|jpeg|webp)$/.test(file.type)) return file;
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    if (img.naturalWidth <= maxW && file.size < 1024 * 1024) return file;
    const k = Math.min(1, maxW / img.naturalWidth);
    const c = document.createElement("canvas");
    c.width = Math.round(img.naturalWidth * k);
    c.height = Math.round(img.naturalHeight * k);
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    const blob = await new Promise<Blob | null>((res) => c.toBlob(res, "image/webp", 0.85));
    const out = blob && blob.type === "image/webp" ? blob : await new Promise<Blob | null>((res) => c.toBlob(res, "image/jpeg", 0.85));
    return out && out.size < file.size ? new File([out], file.name.replace(/\.\w+$/, out.type === "image/webp" ? ".webp" : ".jpg"), { type: out.type }) : file;
  } catch {
    return file;
  } finally {
    URL.revokeObjectURL(url);
  }
}
