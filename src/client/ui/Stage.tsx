"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

/**
 * Lays out children at a fixed design size (e.g. 1920x1080) and scales them to
 * fit the parent, centred. Same trick as the prototype's .stage.
 */
export function Stage({ w, h, children }: { w: number; h: number; children: ReactNode }) {
  const outer = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useLayoutEffect(() => {
    const el = outer.current;
    if (!el) return;
    const fit = () => setScale(Math.min(el.clientWidth / w, el.clientHeight / h));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [w, h]);

  return (
    <div ref={outer} className="stage-outer">
      <div className="stage" style={{ width: w, height: h, transform: `translate(-50%, -50%) scale(${scale})`, visibility: scale ? "visible" : "hidden" }}>
        {children}
      </div>
    </div>
  );
}
