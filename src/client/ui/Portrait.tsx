"use client";

import type { Art, EntryKind } from "@/shared/types";
import { artSrc } from "./SceneView";

/** A generic dark shape per kind, for rumors with no silhouette of their own. */
export function GenericSilhouette({ kind, className = "" }: { kind: EntryKind; className?: string }) {
  return (
    <svg className={`generic-silhouette ${className}`} viewBox="0 0 100 100" aria-hidden="true">
      <path d={SHAPES[kind] ?? SHAPES.mystery} />
    </svg>
  );
}

const SHAPES: Record<string, string> = {
  // Head and shoulders.
  person: "M50 14c11 0 19 9 19 21s-8 22-19 22-19-10-19-22 8-21 19-21zM18 96c2-20 15-31 32-31s30 11 32 31z",
  // A horned beast.
  monster: "M22 14l12 22c5-3 10-4 16-4s11 1 16 4l12-22 2 30c3 5 5 11 5 18 0 19-16 32-35 32S15 81 15 62c0-7 2-13 5-18z",
  // A house with a tower.
  place: "M10 92V52l22-18 22 18v40zM58 92V30l10-16 10 16v62zM82 92V60h10v32z",
  // A shopfront with an awning.
  shop: "M12 40l8-20h60l8 20zM16 44h68v48H58V66H42v26H16z",
  // A rolled scroll.
  mystery: "M22 20h50c6 0 10 4 10 10v46c0 7-5 12-12 12H28c-6 0-10-4-10-10V28c0-4 2-8 4-8zm8 14v6h40v-6zm0 14v6h40v-6zm0 14v6h28v-6z",
  // A hanging banner.
  faction: "M24 10h52v72L50 70 24 82z",
  // A key.
  item: "M34 18a20 20 0 1 1 0 40 20 20 0 0 1 0-40zm0 12a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM50 46l36 36-8 8-6-6-6 6-6-6 6-6-22-22z",
};

/**
 * An entry's face: its picture, or (rumors) its silhouette, or the kind's
 * generic shape, or a wax-seal initial for a found entry with no picture.
 */
export function Portrait({ art, name, kind = "person", silhouette, rumored, gated, className = "" }: { art?: Art; name: string; kind?: EntryKind; silhouette?: string; rumored?: boolean; gated?: Record<string, string>; className?: string }) {
  if (rumored) {
    if (silhouette) return <img className={`portrait-thumb portrait-silhouette ${className}`} src={silhouette} alt="" />;
    return (
      <span className={`portrait-thumb portrait-silhouette ${className}`} aria-hidden="true">
        <GenericSilhouette kind={kind} />
      </span>
    );
  }
  const src = artSrc(art, gated);
  if (src) return <img className={`portrait-thumb ${className}`} src={src} alt="" />;
  const initial = name.replace(/^the\s+/i, "").trim().charAt(0).toUpperCase() || "?";
  return (
    <span className={`portrait-thumb portrait-initial ${className}`} aria-hidden="true">
      {initial}
    </span>
  );
}
