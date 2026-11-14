"use client";

import { useTvMoment } from "./useTvMoment";
import type { Banner } from "@/shared/types";

/**
 * "New at the Smithy": shows for a few seconds when the banner changes.
 * Never on first load, so a reload doesn't replay an old announcement.
 */
export function BannerToast({ banner, className }: { banner: Banner | null; className: string }) {
  const [shown] = useTvMoment(banner, banner?.id ?? null, () => 7000);
  if (!shown) return null;
  return (
    <div className={className} role="status" key={shown.id}>
      <span className="banner-seal" aria-hidden="true" />
      {shown.text}
    </div>
  );
}
