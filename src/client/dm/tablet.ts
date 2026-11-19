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

/** True while touch mode is in effect on this screen: tablet mode, or phone mode (which builds on it). */
export function useTablet(): boolean {
  const m = useTabletMode();
  const touch = useSyncExternalStore(subscribe, () => touchNow, () => false);
  const phone = usePhone();
  return phone || m === "on" || (m === "auto" && touch);
}

/**
 * Phone layout: a one-row top bar, a bottom tab bar, and sheets instead of the
 * sidebar and TV panel. "auto" (the default) follows the screen width, so a
 * phone gets it and a laptop never does.
 */
export type LayoutMode = "auto" | "phone" | "desktop";
const LAYOUT_KEY = "dm-layout";
const NARROW_QUERY = "(max-width: 700px)";

function readLayout(): LayoutMode {
  try {
    const v = localStorage.getItem(LAYOUT_KEY);
    return v === "phone" || v === "desktop" ? v : "auto";
  } catch {
    return "auto";
  }
}

let layout: LayoutMode = typeof window === "undefined" ? "auto" : readLayout();
let narrowNow = typeof window !== "undefined" && !!window.matchMedia?.(NARROW_QUERY).matches;

if (typeof window !== "undefined") {
  window.matchMedia?.(NARROW_QUERY).addEventListener?.("change", (e) => {
    narrowNow = e.matches;
    emit();
  });
  window.addEventListener("storage", (e) => {
    if (e.key === LAYOUT_KEY) {
      layout = readLayout();
      emit();
    }
  });
}

export function setLayoutMode(m: LayoutMode) {
  layout = m;
  try {
    localStorage.setItem(LAYOUT_KEY, m);
  } catch {
    // Private window: the choice lasts until the tab closes.
  }
  emit();
}

export function useLayoutMode(): LayoutMode {
  return useSyncExternalStore(subscribe, () => layout, () => "auto");
}

/** True while the phone layout is in effect on this screen. */
export function usePhone(): boolean {
  const m = useLayoutMode();
  const narrow = useSyncExternalStore(subscribe, () => narrowNow, () => false);
  return m === "phone" || (m === "auto" && narrow);
}

/** Puts data-phone on <html> so the phone styles in dm-theme.css apply. */
export function usePhoneAttr(on: boolean) {
  useEffect(() => {
    const el = document.documentElement;
    if (on) el.dataset.phone = "";
    else delete el.dataset.phone;
    return () => {
      delete el.dataset.phone;
    };
  }, [on]);
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
  if (layout === "phone" || (layout === "auto" && narrowNow)) return false;
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

export { useWakeLock } from "../ui/wakeLock";

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
