"use client";

import { useEffect, useRef, useState } from "react";
import type { Banner } from "@/shared/types";

/**
 * "New at the Smithy": shows for a few seconds when the banner changes.
 * Never on first load, so a reload doesn't replay an old announcement.
 */
export function BannerToast({ banner, className }: { banner: Banner | null; className: string }) {
  const seen = useRef<string | null | undefined>(undefined);
  const [shown, setShown] = useState<Banner | null>(null);
  useEffect(() => {
    const id = banner?.id ?? null;
    if (seen.current === undefined) {
      seen.current = id;
      return;
    }
    if (id === seen.current) return;
    seen.current = id;
    if (!banner) return;
    setShown(banner);
    const t = setTimeout(() => setShown(null), 7000);
    return () => clearTimeout(t);
  }, [banner]);
  if (!shown) return null;
  return (
    <div className={className} role="status" key={shown.id}>
      <span className="banner-seal" aria-hidden="true" />
      {shown.text}
    </div>
  );
}
