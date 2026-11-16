import { useEffect, useSyncExternalStore } from "react";

/**
 * Tablet mode: an optional, per-device layout for running the game by touch
 * (a touch laptop folded into a tablet, an iPad). It only changes this screen:
 * the TV and the players' phones never see it.
 *
 * "on" and "off" are the dependable settings. "auto" follows the browser's
 * idea of the main pointer, which on Windows 2-in-1s doesn't always notice the fold.
 */
export type TabletMode = "off" | "on" | "auto";

const MODE_KEY = "dm-tablet-mode";
const ASKED_KEY = "dm-tablet-asked";
const TOUCH_QUERY = "(hover: none) and (pointer: coarse)";

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function readMode(): TabletMode {
  try {
    const v = localStorage.getItem(MODE_KEY);
    return v === "on" || v === "auto" ? v : "off";
  } catch {
    return "off";
  }
}

let mode: TabletMode = typeof window === "undefined" ? "off" : readMode();
let touchNow = typeof window !== "undefined" && !!window.matchMedia?.(TOUCH_QUERY).matches;

if (typeof window !== "undefined") {
  window.matchMedia?.(TOUCH_QUERY).addEventListener?.("change", (e) => {
    touchNow = e.matches;
    emit();
  });
  // Another tab of the DM view changed it.
  window.addEventListener("storage", (e) => {
    if (e.key === MODE_KEY) {
      mode = readMode();
      emit();
    }
  });
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function setTabletMode(m: TabletMode) {
  mode = m;
  try {
    localStorage.setItem(MODE_KEY, m);
    localStorage.setItem(ASKED_KEY, "1");
  } catch {
    // Private window: the choice lasts until the tab closes.
  }
  emit();
}

export function useTabletMode(): TabletMode {
  return useSyncExternalStore(subscribe, () => mode, () => "off");
}

/** True while tablet mode is in effect on this screen. */
export function useTablet(): boolean {
  const m = useTabletMode();
  const touch = useSyncExternalStore(subscribe, () => touchNow, () => false);
  return m === "on" || (m === "auto" && touch);
}

/** Puts data-tablet on <html> so the tablet styles in dm-theme.css apply. */
export function useTabletAttr(on: boolean) {
  useEffect(() => {
    const el = document.documentElement;
    if (on) el.dataset.tablet = "";
    else delete el.dataset.tablet;
    return () => {
      delete el.dataset.tablet;
    };
  }, [on]);
}

/** Whether to offer tablet mode after the first touch: only once per device, and only while it's off. */
export function shouldOfferTablet(): boolean {
  if (mode !== "off") return false;
  try {
    return localStorage.getItem(ASKED_KEY) !== "1";
  } catch {
    return false;
  }
}

export function markTabletOffered() {
  try {
    localStorage.setItem(ASKED_KEY, "1");
  } catch {
    // Nothing to keep.
  }
}

/** Keeps the screen from going to sleep while `active` (a session is running in tablet mode). */
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

export function isFullScreen() {
  return !!document.fullscreenElement;
}

export function toggleFullScreen() {
  if (document.fullscreenElement) void document.exitFullscreen?.().catch(() => {});
  else void document.documentElement.requestFullscreen?.().catch(() => {});
}

export function useFullScreen(): boolean {
  return useSyncExternalStore(
    (l) => {
      document.addEventListener("fullscreenchange", l);
      return () => document.removeEventListener("fullscreenchange", l);
    },
    isFullScreen,
    () => false,
  );
}
