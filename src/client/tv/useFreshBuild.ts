"use client";

import { useEffect } from "react";

const CHECK_MS = 5 * 60_000;

/** The app's entry script in an HTML page ("/assets/index-abc123.js"), or null. */
export function entryScript(html: string): string | null {
  const m = /<script[^>]+type="module"[^>]+src="([^"]*\/assets\/[^"]+\.js)"/.exec(html) ?? /<script[^>]+src="([^"]*\/assets\/[^"]+\.js)"[^>]*type="module"/.exec(html);
  return m ? new URL(m[1], "http://x").pathname : null;
}

let mine: string | null | undefined;
let stale = false;
let checking = false;
const busy = () => !!document.querySelector(".dice-roll, .disc-moment, .renown-moment");

/**
 * Is a newer build out? Reload onto it (between moments). Safe to call often: it only
 * reloads when the server's entry script differs from the one this page started with.
 */
export async function checkFreshBuild() {
  if (!import.meta.env.PROD || checking) return;
  if (mine === undefined) mine = entryScript(document.documentElement.outerHTML);
  if (!mine) return;
  checking = true;
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
  } finally {
    checking = false;
  }
}

/**
 * The TV tab stays open for whole sessions, so it would keep running an old build after a
 * deploy (and miss its fixes). Every few minutes it checks the page's entry script, and reloads
 * when a new one is out, between moments. Nothing replays on reload, and the scene comes back as it was.
 * (TableSound also checks straight away when the DM plays a sound this build doesn't have.)
 */
export function useFreshBuild() {
  useEffect(() => {
    if (!import.meta.env.PROD) return;
    mine = entryScript(document.documentElement.outerHTML);
    if (!mine) return;
    const t = setInterval(() => void checkFreshBuild(), CHECK_MS);
    const onVis = () => document.visibilityState === "visible" && void checkFreshBuild();
    document.addEventListener("visibilitychange", onVis);
    return () => (clearInterval(t), document.removeEventListener("visibilitychange", onVis));
  }, []);
}
