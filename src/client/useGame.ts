"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { View } from "@/shared/projection";
import { api, ApiError, streamUrl, type Ident } from "./api";

export type Phase = "loading" | "ok" | "taken" | "knocking" | "full" | "invalid" | "no-game" | "error";

export interface GameHook<V extends View = View> {
  phase: Phase;
  view: V | null;
  /** False while the live connection is down (the last view stays on screen). */
  online: boolean;
  error: string | null;
  send: (cmd: object) => Promise<string | null>;
  refresh: () => void;
  retryHello: () => void;
}

const IDLE_AFTER_MS = 15 * 60_000;

type HelloResult = { status: "ok"; view: View } | { status: Exclude<Phase, "ok" | "loading" | "error"> };

/**
 * Keeps a live, filtered copy of the game for this page.
 * - hello once on load (creates ?player= names)
 * - a server-sent-event stream says "version N"; if N is newer we refetch our view
 * - a slow poll and online/visibility events cover anything the stream misses
 * - if the network drops, the last view stays on screen and we reconnect quietly
 */
export function useGame<V extends View = View>(ident: Ident | null): GameHook<V> {
  const [phase, setPhase] = useState<Phase>("loading");
  const [view, setView] = useState<V | null>(null);
  const [online, setOnline] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const versionRef = useRef(-1);
  const phaseRef = useRef<Phase>("loading");
  const inflight = useRef<Promise<void> | null>(null);
  const again = useRef(false);
  const [helloTick, setHelloTick] = useState(0);

  phaseRef.current = phase;

  /** Set by the stream effect: marks activity and leaves idle mode. */
  const activity = useRef<() => void>(() => {});
  /** True while a session is running: never go idle then. */
  const inSession = useRef(false);

  const accept = useCallback((v: View) => {
    if (v.version < versionRef.current) return;
    if (v.version > versionRef.current) activity.current();
    inSession.current = v.role === "dm" ? !!v.state.currentSessionId : !!v.session;
    versionRef.current = v.version;
    setView(v as V);
  }, []);

  const refresh = useCallback(() => {
    if (!ident) return;
    if (inflight.current) {
      again.current = true;
      return;
    }
    inflight.current = (async () => {
      try {
        accept(await api<View>("/api/view", ident));
        setOnline(true);
      } catch (e) {
        if (e instanceof ApiError && e.status < 500) {
          // We were removed, renamed or locked out: go back through hello.
          setHelloTick((t) => t + 1);
        } else {
          setOnline(false);
        }
      } finally {
        inflight.current = null;
        if (again.current) {
          again.current = false;
          refresh();
        }
      }
    })();
  }, [ident, accept]);

  // hello
  useEffect(() => {
    if (!ident) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await api<HelloResult>("/api/hello", ident, { method: "POST" });
        if (cancelled) return;
        if (r.status === "ok") {
          accept(r.view);
          setPhase("ok");
        } else setPhase(r.status);
        setOnline(true);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
        setOnline(false);
        // Keep the old view if we had one; otherwise show an error and retry.
        if (phaseRef.current === "loading") setPhase("error");
        setTimeout(() => !cancelled && setHelloTick((t) => t + 1), 4000);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ident, accept, helloTick]);

  // live stream
  useEffect(() => {
    if (!ident) return;
    let es: EventSource | null = null;
    let downTimer: ReturnType<typeof setTimeout> | null = null;
    let closed = false;

    // Live mode: an open event stream. Idle mode (after a long quiet spell): no
    // stream, just a cheap version check every 15 s, so a TV left on all week
    // doesn't hold a server connection open. Any change switches back to live.
    let lastChange = Date.now();
    let idle = false;

    const markActive = () => {
      lastChange = Date.now();
      if (idle) {
        idle = false;
        open();
      }
    };
    activity.current = markActive;

    const seen = (v: number) => {
      if (v > versionRef.current) markActive();
      if (phaseRef.current !== "ok") {
        // Knocking or waiting for the game: something changed, try again.
        if (phaseRef.current !== "loading") setHelloTick((t) => t + 1);
        return;
      }
      if (v > versionRef.current) refresh();
    };

    const open = () => {
      if (es || closed) return;
      es = new EventSource(streamUrl(ident));
      es.addEventListener("v", (ev) => {
        if (downTimer) clearTimeout(downTimer);
        downTimer = null;
        setOnline(true);
        seen(Number((ev as MessageEvent).data));
      });
      es.onerror = () => {
        // EventSource retries on its own; only show "reconnecting" if it stays down.
        if (!downTimer) downTimer = setTimeout(() => setOnline(false), 3000);
        if (es && es.readyState === EventSource.CLOSED && !closed) {
          es = null;
          setTimeout(() => !closed && !idle && open(), 2000);
        }
      };
    };
    open();

    let polledAt = 0;
    const tick = setInterval(async () => {
      const now = Date.now();
      if (inSession.current) lastChange = now; // game night: stay live
      if (!idle && now - lastChange > IDLE_AFTER_MS) {
        idle = true;
        es?.close();
        es = null;
        if (downTimer) clearTimeout(downTimer);
        downTimer = null;
      }
      if (now - polledAt < (idle ? 15_000 : 30_000)) return;
      polledAt = now;
      try {
        const { version } = await api<{ version: number }>("/api/version", ident);
        setOnline(true);
        seen(version);
      } catch {
        setOnline(false);
      }
    }, 5_000);

    const wake = () => {
      if (document.visibilityState !== "visible") return;
      markActive();
      refresh();
    };
    window.addEventListener("online", wake);
    document.addEventListener("visibilitychange", wake);

    return () => {
      closed = true;
      activity.current = () => {};
      es?.close();
      clearInterval(tick);
      if (downTimer) clearTimeout(downTimer);
      window.removeEventListener("online", wake);
      document.removeEventListener("visibilitychange", wake);
    };
  }, [ident, refresh]);

  const send = useCallback(
    async (cmd: object): Promise<string | null> => {
      if (!ident) return "Not ready.";
      try {
        const r = await api<{ version: number }>("/api/command", ident, { method: "POST", body: JSON.stringify(cmd) });
        if (r.version > versionRef.current) refresh();
        return null;
      } catch (e) {
        return e instanceof Error ? e.message : String(e);
      }
    },
    [ident, refresh],
  );

  const retryHello = useCallback(() => setHelloTick((t) => t + 1), []);

  return { phase, view, online, error, send, refresh, retryHello };
}
