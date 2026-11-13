"use client";

import { useEffect, useRef } from "react";

/** Light snow on a canvas: a few dozen flakes, paused when the tab is hidden. */
export function Snow({ count = 60 }: { count?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    const g = cv?.getContext("2d");
    if (!cv || !g) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let w = 0;
    let h = 0;
    const size = () => {
      w = cv.clientWidth;
      h = cv.clientHeight;
      cv.width = w * dpr;
      cv.height = h * dpr;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size();
    window.addEventListener("resize", size);
    const flakes = Array.from({ length: count }, () => ({ x: Math.random() * w, y: Math.random() * h - h, r: 0.6 + Math.random() * 1.8, v: 18 + Math.random() * 30, s: Math.random() * 6 }));
    let raf = 0;
    let last = performance.now();
    const born = last;
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      g.clearRect(0, 0, w, h);
      // Starts as a few flakes and builds over a few seconds.
      const live = Math.ceil(count * Math.min(1, (now - born) / 4000));
      g.fillStyle = "rgba(225,233,242,0.75)";
      for (let i = 0; i < live; i++) {
        const f = flakes[i];
        f.y += f.v * f.r * 0.5 * dt;
        f.x += Math.sin((now / 1000 + f.s) * 0.8) * 8 * dt;
        if (f.y > h + 4) {
          f.y = -4;
          f.x = Math.random() * w;
        }
        g.beginPath();
        g.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        g.fill();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", size);
    };
  }, [count]);
  return <canvas ref={ref} className="snow" aria-hidden="true" />;
}
