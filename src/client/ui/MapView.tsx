"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import { fitBox, zoomToward, type Box } from "@/shared/mapGeometry";
import type { PublicMap } from "@/shared/projection";

const ZOOM = 2;
const BANNER_MS = 5000;
/** Until the image loads (or with no image yet), lay pins out on a 16:9 sheet. */
const PLACEHOLDER = { w: 1600, h: 900 };

/** Measure the screen and the image, and work out where the letterboxed image sits. */
export function useMapBox(outer: RefObject<HTMLDivElement | null>, src: string | undefined) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [nat, setNat] = useState<{ w: number; h: number; src: string } | null>(null);

  useLayoutEffect(() => {
    const el = outer.current;
    if (!el) return;
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [outer]);

  const img = nat && nat.src === src ? nat : PLACEHOLDER;
  const box: Box = fitBox(size.w, size.h, img.w, img.h);
  /** One TV "pixel" at 1920x1080, for this screen (the DM's preview is smaller). */
  const unit = Math.min(size.w / 1920, size.h / 1080) || 0;
  const onLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const i = e.currentTarget;
    if (i.naturalWidth && i.naturalHeight) setNat({ w: i.naturalWidth, h: i.naturalHeight, src: src ?? "" });
  };
  return { size, box, unit, onLoad };
}

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

/** A wax-seal number dot. */
export function Seal({ label, className = "", style, children, ...rest }: { label: string; className?: string; style?: CSSProperties; children?: ReactNode } & React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={`seal${label.length > 2 ? " seal-long" : ""}${className ? " " + className : ""}`} style={style} {...rest}>
      <span className="seal-text">{label}</span>
      {children}
    </span>
  );
}

/** A map scene as the TV shows it: discovered pins only, plus the legend, focus zoom and discovery banner. */
export function MapView({ src, alt, map, emptyHint }: { src?: string; alt?: string; map: PublicMap; emptyHint?: string }) {
  const outer = useRef<HTMLDivElement>(null);
  const { size, box, unit, onLoad } = useMapBox(outer, src);
  const reduced = usePrefersReducedMotion();
  const banner = useBanner(map.banner);

  const focusPin = map.focus ? map.pins.find((p) => p.id === map.focus!.pinId) : undefined;
  const zoom = focusPin && !reduced ? zoomToward(focusPin, box, size.w, size.h, ZOOM) : { tx: 0, ty: 0, scale: 1 };
  const sealPx = Math.max(16, 64 * unit);

  return (
    <div ref={outer} className={`scene-fill scene-backdrop map-scene${reduced ? " still" : ""}`} style={{ "--mu": `${unit}px`, "--seal": `${sealPx}px` } as CSSProperties}>
      <div
        className="map-box"
        style={{ left: box.left, top: box.top, width: box.width, height: box.height, transform: `translate(${zoom.tx}px, ${zoom.ty}px) scale(${zoom.scale})` }}
      >
        {src ? <img className="map-img" src={src} alt={alt ?? ""} onLoad={onLoad} draggable={false} /> : <div className="map-empty">{emptyHint ? <span>{emptyHint}</span> : null}</div>}
        {map.pins.map((p) => {
          const focused = focusPin?.id === p.id;
          return (
            <Seal
              key={p.id + (focused ? `:${map.focus!.n}` : "")}
              label={p.label}
              className={focused ? "pulse" : ""}
              style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%`, transform: `translate(-50%, -50%) scale(${1 / zoom.scale})` }}
              aria-label={p.name ? `${p.label}: ${p.name}` : `Location ${p.label}`}
            />
          );
        })}
      </div>

      {map.legend.on && map.pins.length ? (
        <aside className="map-legend" aria-label="Locations">
          <h2>Locations</h2>
          <ol>
            {map.pins.map((p) => (
              <li key={p.id}>
                <Seal label={p.label} />
                {map.legend.style === "names" && p.name ? (
                  <span className="map-legend-text">
                    <span className="map-legend-name">{p.name}</span>
                    {p.type ? <span className="map-legend-type">{p.type}</span> : null}
                  </span>
                ) : null}
              </li>
            ))}
          </ol>
        </aside>
      ) : null}

      {focusPin?.name ? (
        <div className="map-caption" key={map.focus!.n} role="status">
          <Seal label={focusPin.label} />
          <div>
            <div className="map-caption-name">
              {focusPin.name}
              {focusPin.type ? <span className="map-caption-type">{focusPin.type}</span> : null}
            </div>
            {focusPin.description ? <div className="map-caption-desc">{focusPin.description}</div> : null}
          </div>
        </div>
      ) : null}

      {banner ? (
        <div className="map-banner" key={banner.n} role="status">
          Discovered: <b>{banner.name}</b>
        </div>
      ) : null}
    </div>
  );
}

/** Show a discovery banner for a few seconds when a new one arrives (not on page load). */
function useBanner(b: PublicMap["banner"]) {
  const seen = useRef(b?.n ?? 0);
  const [shown, setShown] = useState<{ n: number; name: string } | null>(null);
  const n = b?.n ?? 0;
  const name = b?.name ?? "";
  useEffect(() => {
    if (!n || n === seen.current) return;
    seen.current = n;
    setShown({ n, name });
    const t = setTimeout(() => setShown(null), BANNER_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n]);
  return shown;
}
