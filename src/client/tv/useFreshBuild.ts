"use client";

import { useEffect } from "react";

const CHECK_MS = 5 * 60_000;

/** The app's entry script in an HTML page ("/assets/index-abc123.js"), or null. */
export function entryScript(html: string): string | null {
  const m = /<script[^>]+type="module"[^>]+src="([^"]*\/assets\/[^"]+\.js)"/.exec(html) ?? /<script[^>]+src="([^"]*\/assets\/[^"]+\.js)"[^>]*type="module"/.exec(html);
  return m ? new URL(m[1], "http://x").pathname : null;
}

/**
 * The TV tab stays open for whole sessions, so it would keep running an old build after a
 * deploy (and miss its fixes). Every few minutes it checks the page's entry script, and reloads
 * when a new one is out, between moments. Nothing replays on reload, and the scene comes back as it was.
 */
export function useFreshBuild() {
  useEffect(() => {
    if (!import.meta.env.PROD) return;
    const mine = entryScript(document.documentElement.outerHTML);
    if (!mine) return;
    let stale = false;
    const busy = () => !!document.querySelector(".dice-roll, .disc-moment, .renown-moment");
    const check = async () => {
      try {
        if (!stale) {
          const r = await fetch(`/?fresh=${Date.now()}`, { cache: "no-store" });
          if (!r.ok) return;
          const now = entryScript(await r.text());
          stale = !!now && now !== mine;
        }
        if (stale && !busy()) window.location.reload();
      } catch {
        // offline: try again next time
      }
    };
    const t = setInterval(check, CHECK_MS);
    const onVis = () => document.visibilityState === "visible" && void check();
    document.addEventListener("visibilitychange", onVis);
    return () => (clearInterval(t), document.removeEventListener("visibilitychange", onVis));
  }, []);
}
