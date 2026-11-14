"use client";

import type { Art } from "@/shared/types";
import { artSrc } from "./SceneView";

/** An NPC's face: their portrait, or a wax-seal initial when they don't have one. */
export function Portrait({ art, name, className = "" }: { art?: Art; name: string; className?: string }) {
  const src = artSrc(art);
  if (src) return <img className={`portrait-thumb ${className}`} src={src} alt="" />;
  const initial = name.replace(/^the\s+/i, "").trim().charAt(0).toUpperCase() || "?";
  return (
    <span className={`portrait-thumb portrait-initial ${className}`} aria-hidden="true">
      {initial}
    </span>
  );
}
