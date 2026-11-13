
import { useCallback, useEffect, useRef, useState } from "react";
import type { View } from "@/shared/projection";
import { api, ApiError, liveUrl, type Ident } from "./api";

/** "removed": this player was on the page, then the DM deleted or renamed them. */
export type Phase = "loading" | "ok" | "taken" | "knocking" | "full" | "invalid" | "no-game" | "removed" | "error";

export interface GameHook<V extends View = View> {
  phase: Phase;
  view: V | null;
  /** False while the live connection is down (the last view stays on screen). */
  online: boolean;
  error: string | null;
  send: (cmd: object) => Promise<string | null>;
  /** Like send, with the error code and any note from the server. */
  call: (cmd: object) => Promise<CallResult>;
  refresh: () => void;
  retryHello: () => void;
}

export interface CallResult {
  error: string | null;
  code?: string;
  info?: string;
}

type HelloResult = { status: "ok"; view: View } | { status: Exclude<Phase, "ok" | "loading" | "error"> };

/**
 * Keeps a live, filtered copy of the game for this page.
 * - hello once on load (creates ?player= names)
 * - a WebSocket to the campaign's room pushes our filtered view on every change
 * - coming back to the tab or back online refetches, in case we missed something
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

  const accept = useCallback((v: View) => {
    if (v.version < versionRef.current) return;
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
          // Deleted or renamed by the DM: stop here, or hello would add us straight back.
          if (e.code === "unknown" && phaseRef.current === "ok") setPhase("removed");
          // Locked out: go back through hello.
          else setHelloTick((t) => t + 1);
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

  // live connection
  useEffect(() => {
    if (!ident) return;
    let ws: WebSocket | null = null;
    let closed = false;
    let attempt = 0;
    let lastHeard = Date.now();
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let downTimer: ReturnType<typeof setTimeout> | null = null;

    // One WebSocket to the campaign's room. The room pushes this screen its own
    // filtered view whenever the game changes, so there is nothing to refetch.
    // A sleeping campaign costs nothing with the socket open, so it stays open.
    const open = () => {
      if (closed || ws) return;
      const sock = new WebSocket(liveUrl(ident.game, ident.player ? { player: ident.player } : {}));
      ws = sock;
      sock.onopen = () => {
        attempt = 0;
        lastHeard = Date.now();
        sock.send(JSON.stringify({ t: "auth", key: ident.key }));
      };
      sock.onmessage = (ev) => {
        lastHeard = Date.now();
        if (downTimer) clearTimeout(downTimer);
        downTimer = null;
        setOnline(true);
        if (ev.data === "pong") return;
        if (phaseRef.current === "removed") return;
        let msg: { t?: string; view?: View; status?: number; code?: string | null };
        try {
          msg = JSON.parse(String(ev.data)) as typeof msg;
        } catch {
          return;
        }
        if (msg.t === "view" && msg.view) {
          if (phaseRef.current === "ok") accept(msg.view);
          else if (phaseRef.current !== "loading") setHelloTick((t) => t + 1);
        } else if (msg.t === "error" && (msg.status ?? 500) < 500) {
          // Deleted or renamed by the DM: stop here, or hello would add us straight back.
          if (msg.code === "unknown" && phaseRef.current === "ok") setPhase("removed");
          // Locked out, or we're knocking and the table changed: go back through hello.
          else if (phaseRef.current !== "loading") setHelloTick((t) => t + 1);
        }
      };
      sock.onclose = () => {
        if (ws === sock) ws = null;
        if (closed) return;
        if (!downTimer) downTimer = setTimeout(() => setOnline(false), 3000);
        const wait = Math.min(15_000, 1000 * 2 ** attempt++) + Math.random() * 500;
        retryTimer = setTimeout(open, wait);
      };
    };
    open();

    // Keep-alive: the room answers "ping" without waking up. A socket that
    // stops answering (a phone that slept, a dropped Wi-Fi) is replaced.
    const tick = setInterval(() => {
      if (!ws) return;
      if (ws.readyState === WebSocket.OPEN) {
        if (Date.now() - lastHeard > 75_000) {
          ws.close();
          ws = null;
          open();
          return;
        }
        try {
          ws.send("ping");
        } catch {}
      }
    }, 25_000);

    const wake = () => {
      if (document.visibilityState !== "visible") return;
      if (!ws || ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING) {
        if (retryTimer) clearTimeout(retryTimer);
        ws = null;
        attempt = 0;
        open();
      }
      refresh();
    };
    window.addEventListener("online", wake);
    document.addEventListener("visibilitychange", wake);

    return () => {
      closed = true;
      ws?.close();
      clearInterval(tick);
      if (retryTimer) clearTimeout(retryTimer);
      if (downTimer) clearTimeout(downTimer);
      window.removeEventListener("online", wake);
      document.removeEventListener("visibilitychange", wake);
    };
  }, [ident, accept, refresh]);

  const call = useCallback(
    async (cmd: object): Promise<CallResult> => {
      if (!ident) return { error: "Not ready." };
      try {
        const r = await api<{ version: number; info?: string }>("/api/command", ident, { method: "POST", body: JSON.stringify(cmd) });
        // The room pushes the new view over the live connection; fetch it ourselves only if it doesn't arrive.
        if (r.version > versionRef.current) setTimeout(() => r.version > versionRef.current && refresh(), 1500);
        return { error: null, ...(r.info ? { info: r.info } : {}) };
      } catch (e) {
        return { error: e instanceof Error ? e.message : String(e), ...(e instanceof ApiError && e.code ? { code: e.code } : {}) };
      }
    },
    [ident, refresh],
  );
  const send = useCallback(async (cmd: object) => (await call(cmd)).error, [call]);

  const retryHello = useCallback(() => setHelloTick((t) => t + 1), []);

  return { phase, view, online, error, send, call, refresh, retryHello };
}
