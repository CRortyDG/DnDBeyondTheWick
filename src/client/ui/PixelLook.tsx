"use client";

import type { Look } from "@/shared/look";
import { lookKey } from "@/shared/look";
import { type Pix, toRgba } from "@/shared/lookArt";
import { drawLookHd, drawLookHdFace } from "@/shared/lookArtHd";
import "./look.css";

const cache = new Map<string, string>();

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

/** The look's picture (whole, or just the head and shoulders), cached. */
export function lookUrl(look: Look, face = false): string {
  const key = (face ? "f" : "w") + lookKey(look);
  let url = cache.get(key);
  if (url === undefined) {
    url = pixUrl(face ? drawLookHdFace(look) : drawLookHd(look));
    if (cache.size > 300) cache.clear();
    cache.set(key, url);
  }
  return url;
}

/** A crisp pixel-art picture of a character. face: head and shoulders, square. */
export function PixelLook({ look, face = false, className = "", alt = "" }: { look: Look; face?: boolean; className?: string; alt?: string }) {
  return <img className={`pixel-look${face ? " face" : ""}${className ? " " + className : ""}`} src={lookUrl(look, face)} alt={alt} draggable={false} />;
}
