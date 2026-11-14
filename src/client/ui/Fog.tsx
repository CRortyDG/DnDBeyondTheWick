"use client";

// Fog of war over a map: covered cells drawn dark on a small canvas, stretched
// over the image and softened. The TV and phones also get the map as tiles,
// only those that touch a clear cell (see shared/fog.ts).

import { useEffect, useRef } from "react";
import { decodeBits, getBit, type FogLayout, type PublicFog } from "@/shared/fog";

/** Each cell is drawn this many pixels across, so the blur has room to soften edges. */
const PX = 6;

export function FogLayer({ fog, bits, dm = false }: { fog: FogLayout; bits: string | Uint8Array; dm?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const b = typeof bits === "string" ? decodeBits(bits, fog.cols, fog.rows) : bits;
    cv.width = fog.cols * PX;
    cv.height = fog.rows * PX;
    const ctx = cv.getContext("2d")!;
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.fillStyle = dm ? "rgba(8, 6, 5, 0.62)" : "#0d0a08";
    for (let r = 0; r < fog.rows; r++) {
      // Runs of covered cells, one rectangle each.
      let start = -1;
      for (let c = 0; c <= fog.cols; c++) {
        const covered = c < fog.cols && !getBit(b, r * fog.cols + c);
        if (covered && start < 0) start = c;
        if (!covered && start >= 0) {
          ctx.fillRect(start * PX, r * PX, (c - start) * PX, PX);
          start = -1;
        }
      }
    }
  }, [fog.cols, fog.rows, bits, dm]);
  return (
    <canvas
      ref={ref}
      className={`map-fog${dm ? " dm" : ""}`}
      aria-hidden="true"
      style={{ left: `${fog.x0 * 100}%`, top: `${fog.y0 * 100}%`, width: `${fog.cols * fog.cw * 100}%`, height: `${fog.rows * fog.ch * 100}%` }}
    />
  );
}

/** The map as the tiles the room may see. */
export function FogTiles({ fog }: { fog: PublicFog }) {
  const { cols, rows, shown } = fog.tiles;
  return (
    <>
      {shown.map((t) => (
        <img
          key={t.url}
          className="map-tile"
          src={t.url}
          alt=""
          draggable={false}
          style={{ left: `${(t.c / cols) * 100}%`, top: `${(t.r / rows) * 100}%`, width: `calc(${100 / cols}% + 1px)`, height: `calc(${100 / rows}% + 1px)` }}
        />
      ))}
    </>
  );
}
