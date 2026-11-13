"use client";

import { authHeaders, type Ident } from "../api";

type Mode = "blob" | "local" | "missing";
let modePromise: Promise<Mode> | null = null;
function uploadMode() {
  modePromise ??= fetch("/api/upload", { cache: "no-store" })
    .then((r) => r.json())
    .then((d: { mode: Mode }) => d.mode)
    .catch(() => {
      modePromise = null; // ask again next time instead of guessing
      return "local" as const;
    });
  return modePromise;
}

/** Upload an image and return its URL. Vercel Blob in production, .data/uploads locally. */
export async function uploadImage(ident: Ident, file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("That isn't an image.");
  if (file.size > 25 * 1024 * 1024) throw new Error("That image is over 25 MB.");
  const mode = await uploadMode();
  if (mode === "missing") {
    modePromise = null; // pick up a Blob store connected since
    throw new Error("Image uploads aren't set up on this server yet. In Vercel: Storage → connect a Blob store (public access) to this project, then redeploy.");
  }
  if (mode === "blob") {
    const { upload } = await import("@vercel/blob/client");
    const safe = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(-80) || "image";
    const blob = await upload(`${ident.game}/${safe}`, file, {
      access: "public",
      handleUploadUrl: `/api/upload?game=${encodeURIComponent(ident.game)}`,
      headers: authHeaders(ident),
      contentType: file.type,
    });
    return blob.url;
  }
  const form = new FormData();
  form.append("file", file);
  const r = await fetch(`/api/upload-local?game=${encodeURIComponent(ident.game)}`, { method: "POST", body: form, headers: authHeaders(ident) });
  const data = (await r.json()) as { url?: string; error?: string };
  if (!r.ok || !data.url) throw new Error(data.error ?? "Upload failed.");
  return data.url;
}
