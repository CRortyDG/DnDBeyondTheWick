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
