"use client";

import { useEffect, useRef, useState } from "react";

type Key = string | number;

/**
 * A one-off TV moment (a roll, a reveal, a banner): shows when `id` changes, then clears
 * itself after `holdMs`. Never on first load, so a reload doesn't replay it.
 *
 * Keyed on the id, not the object: the TV gets a fresh view object on every state update,
 * and keying on the object used to cancel the dismiss timer mid-moment, leaving it up forever.
 */
export function useTvMoment<T>(
  value: T | null | undefined,
  id: Key | null,
  holdMs: (v: T) => number,
  opts: { onShow?: (v: T) => void; clearOnNull?: boolean } = {},
): [T | null, () => void] {
  const seen = useRef<Key | null | undefined>(undefined);
  const [shown, setShown] = useState<{ v: T; id: Key } | null>(null);
  const latest = useRef({ value, holdMs, opts });
  latest.current = { value, holdMs, opts };

  useEffect(() => {
    if (seen.current === undefined) {
      seen.current = id;
      return;
    }
    if (id === seen.current) return;
    seen.current = id;
    const { value: v, opts: o } = latest.current;
    if (v == null || id == null) {
      if (o.clearOnNull) setShown(null);
      return;
    }
    setShown({ v, id });
    o.onShow?.(v);
  }, [id]);

  // The dismiss belongs to the moment on screen, so only a newer moment (or clearing it) cancels it.
  const shownId = shown?.id;
  useEffect(() => {
    if (!shown) return;
    const t = setTimeout(() => setShown(null), latest.current.holdMs(shown.v));
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shownId]);

  return [shown?.v ?? null, () => setShown(null)];
}
