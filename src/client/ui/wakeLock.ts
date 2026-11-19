"use client";

// The Screen Wake Lock: keeps a device awake while something needs watching.
// Where the browser has no wake lock (or says no), the screen just sleeps as usual.

import { useEffect } from "react";

/** Keeps the screen from going to sleep while `active` (a session in tablet mode, a fight on a player's phone). */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    const wl = (navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> } }).wakeLock;
    if (!active || !wl) return;
    let lock: { release: () => Promise<void> } | null = null;
    let gone = false;
    const grab = () => {
      if (document.visibilityState !== "visible") return;
      wl.request("screen")
        .then((l) => {
          if (gone) void l.release().catch(() => {});
          else lock = l;
        })
        .catch(() => {
          // Low battery or not allowed: the screen just sleeps as usual.
        });
    };
    grab();
    // The browser drops the lock when the tab is hidden; take it again on return.
    document.addEventListener("visibilitychange", grab);
    return () => {
      gone = true;
      document.removeEventListener("visibilitychange", grab);
      void lock?.release().catch(() => {});
    };
  }, [active]);
}
