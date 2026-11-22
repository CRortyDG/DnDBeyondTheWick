"use client";

// Tokens and grid lines on a map, for the TV, the DM's table map and phones.
// Everything sits inside the map's image box, so it zooms with the map.

import type { CSSProperties, HTMLAttributes } from "react";
import type { PublicGrid } from "@/shared/tokens";
import type { Art, TokenColor } from "@/shared/types";
import { artSrc } from "./SceneView";
import type { Look } from "@/shared/look";
import { PixelLook } from "./PixelLook";
import { conditionGlyph } from "@/shared/conditionRules";

export interface TokenLook {
  label: string;
  name: string;
  color: TokenColor;
  /** Width as a fraction of the image's width. */
  w: number;
  art?: Art;
  /** A player's pixel-art look: drawn inside the ring. */
  look?: Look;
  down?: boolean;
  current?: boolean;
  /** Fight conditions: up to two marks on the ring's edge, then "+N". */
  conds?: string[];
}

/** One token: a coloured ring with initials (or a picture), the name under it. */
export function Token({
  t,
  x,
  y,
  boxWidth,
  className = "",
  showName = true,
  style,
  ...rest
}: { t: TokenLook; x: number; y: number; boxWidth: number; className?: string; showName?: boolean; style?: CSSProperties } & HTMLAttributes<HTMLDivElement>) {
  const px = Math.max(14, t.w * boxWidth);
  const src = t.art ? artSrc(t.art) : null;
  return (
    <div
      className={`tok tok-${t.color}${t.down ? " down" : ""}${t.current ? " current" : ""}${className ? " " + className : ""}`}
      style={{ left: `${x * 100}%`, top: `${y * 100}%`, width: px, height: px, "--tok": `${px}px`, ...style } as CSSProperties}
      aria-label={(t.name || t.label) + (t.conds?.length ? ` (${t.conds.join(", ")})` : "")}
      {...rest}
    >
      <span className="tok-disc">{src ? <img src={src} alt="" draggable={false} /> : t.look ? <PixelLook look={t.look} face /> : <span className="tok-label">{t.label}</span>}</span>
      {t.down ? <span className="tok-x" aria-hidden="true" /> : null}
      {t.conds?.length ? (
        <span className="tok-conds" title={t.conds.join(", ")} aria-hidden="true">
          {t.conds.slice(0, 2).map((n, i) => (
            <span key={i} className="tok-cond">
              {conditionGlyph(n)}
            </span>
          ))}
          {t.conds.length > 2 ? <span className="tok-cond more">+{t.conds.length - 2}</span> : null}
        </span>
      ) : null}
      {showName && t.name ? (
        <span className="tok-name" title={t.name}>
          {shortName(t.name)}
        </span>
      ) : null}
    </div>
  );
}

/** The grid's lines over the image box (width and height in pixels). */
export function GridLines({ grid, width, height }: { grid: Pick<PublicGrid, "cell" | "ox" | "oy" | "aspect">; width: number; height: number }) {
  const cw = grid.cell * width;
  const ch = (grid.cell / (grid.aspect || 1)) * height;
  if (cw < 4 || ch < 4 || !width || !height) return null;
  return (
    <div
      className="map-grid"
      aria-hidden="true"
      style={{
        backgroundSize: `${cw}px ${ch}px`,
        backgroundPosition: `${grid.ox * width}px ${grid.oy * height}px`,
      }}
    />
  );
}

/** Under a token there's room for a first name: "Brin Ashcombe" -> "Brin". Monsters keep their letter: "Goblin A". */
export function shortName(name: string): string {
  // "Sister Cass, Keeper of the Beacon" -> "Sister Cass": the part before a title.
  const head = name.split(",")[0].trim();
  if (head && head !== name.trim() && head.length <= 16) return head;
  const words = name.trim().split(/\s+/);
  if (words.length > 1 && /^[A-Z0-9]$/.test(words[words.length - 1])) return words.length === 2 ? name.trim() : `${words[0]} ${words[words.length - 1]}`;
  return words[0] ?? "";
}
