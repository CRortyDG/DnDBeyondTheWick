"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A DM's own clip on the TV: plays once from the start each time it's shown,
 * then holds on its last frame. With sound if the TV's browser allows it,
 * silently if not.
 */
export function VideoScene({ src, emptyHint }: { src: string | null; emptyHint?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const v = ref.current;
    if (!v || !src) return;
    setFailed(false);
    // Sound only on the TV itself: the DM's previews of it stay quiet.
    v.muted = document.documentElement.dataset.view !== "tv";
    v.play().catch(() => {
      v.muted = true;
      v.play().catch(() => setFailed(true));
    });
  }, [src]);
  if (!src) return <div className="scene-fill scene-black">{emptyHint ? <div className="scene-empty">{emptyHint}</div> : null}</div>;
  return (
    <div className="scene-fill scene-black scene-video">
      <video ref={ref} src={src} playsInline preload="auto" onError={() => setFailed(true)} />
      {failed ? <div className="scene-empty">This video won&rsquo;t play on this screen. MP4 plays everywhere.</div> : null}
    </div>
  );
}
