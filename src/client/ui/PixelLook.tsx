"use client";

import type { Look } from "@/shared/look";
import { lookDetailOf, lookKey, lookStyleOf } from "@/shared/look";
import { type Pix, toRgba } from "@/shared/lookArt";
import { DETAIL_SCALE, drawLookDetail, drawLookDetailFace } from "@/shared/lookDetail";
import { lookSvg, VEC_H, VEC_W } from "@/shared/lookVector";
import "./look.css";

const cache = new Map<string, string>();

/** The DM's table-wide art style (index into LOOK_STYLES), set from each screen's latest view. */
let forcedStyle: number | null = null;
export function setForcedLookStyle(style: number | null | undefined) {
  forcedStyle = style ?? null;
}
export function forcedLookStyle(): number | null {
  return forcedStyle;
}

/** A pixel grid as a PNG data URL, scale × its size (1 = one pixel per pixel; CSS scales it crisply). */
export function pixUrl(p: Pix, scale = 1): string {
  const c = document.createElement("canvas");
  c.width = p.w * scale;
  c.height = p.h * scale;
  const ctx = c.getContext("2d");
  if (!ctx) return "";
  const img = new ImageData(toRgba(p) as unknown as Uint8ClampedArray<ArrayBuffer>, p.w, p.h);
  if (scale === 1) ctx.putImageData(img, 0, 0);
  else {
    const t = document.createElement("canvas");
    t.width = p.w;
    t.height = p.h;
    t.getContext("2d")!.putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(t, 0, 0, c.width, c.height);
  }
  return c.toDataURL("image/png");
}

/**
 * Save a picture to the device. Phones (and an iPhone home-screen app, where a
 * plain download link does nothing) get the share sheet with "Save Image";
 * everything else gets an ordinary file download. Runs synchronously inside
 * the tap so Safari still counts it as the user's own action.
 */
export function savePicture(url: string, filename: string): Promise<void> {
  const bin = atob(url.slice(url.indexOf(",") + 1));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const file = new File([bytes], filename, { type: "image/png" });
  const touch = typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches;
  if (touch && typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
    return navigator.share({ files: [file] }).catch((e: unknown) => {
      if ((e as Error)?.name !== "AbortError") download(file);
    });
  }
  download(file);
  return Promise.resolve();
}

function download(file: File) {
  const href = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = href;
  a.download = file.name;
  a.rel = "noopener";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 60_000);
}

/**
 * The look's picture (whole, or just the head and shoulders), cached. Drawn in
 * the look's own style, or the DM's table-wide one; own: ignore the table's.
 */
export function lookUrl(look: Look, face = false, own = false): string {
  const style = lookStyleOf(look, own ? null : forcedStyle);
  const key = (face ? "f" : "w") + style + lookKey(look);
  let url = cache.get(key);
  if (url === undefined) {
    url = style === "pixel" ? pixUrl(face ? drawLookDetailFace(look) : drawLookDetail(look)) : "data:image/svg+xml;charset=utf-8," + encodeURIComponent(lookSvg(look, style, face));
    if (cache.size > 300) cache.clear();
    cache.set(key, url);
  }
  return url;
}

/**
 * The whole picture as a PNG data URL, for saving or uploading: pixel art at
 * pixelScale × its size; a drawn style at the same width.
 */
export async function lookPng(look: Look, pixelScale: number, own = true): Promise<string> {
  const style = lookStyleOf(look, own ? null : forcedStyle);
  // The same size picture at every detail level: pixelScale is for the 96-wide detailed look.
  const k = DETAIL_SCALE[lookDetailOf(look)] ?? 2;
  if (style === "pixel") return pixUrl(drawLookDetail(look), Math.max(1, Math.round((pixelScale * 2) / k)));
  const w = 96 * pixelScale;
  const h = Math.round((w * VEC_H) / VEC_W);
  const img = new Image();
  img.decoding = "async";
  img.src = lookUrl(look, false, own);
  await img.decode();
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  if (!ctx) return "";
  ctx.drawImage(img, 0, 0, w, h);
  return c.toDataURL("image/png");
}

/** Smooth pictures (the drawn styles, and pixel art at its finest level) are scaled softly, the rest crisply. */
export function isSmooth(look: Look, own = false): boolean {
  return lookStyleOf(look, own ? null : forcedStyle) !== "pixel" || lookDetailOf(look) === 3;
}

/** A picture of a character, in its art style. face: head and shoulders, square. */
export function PixelLook({ look, face = false, className = "", alt = "", own = false }: { look: Look; face?: boolean; className?: string; alt?: string; own?: boolean }) {
  const drawn = isSmooth(look, own);
  return <img className={`pixel-look${drawn ? " drawn" : ""}${face ? " face" : ""}${className ? " " + className : ""}`} src={lookUrl(look, face, own)} alt={alt} draggable={false} />;
}
