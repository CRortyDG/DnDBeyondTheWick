"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { opensOnSeat, type ArrivalView } from "@/shared/arrival";
import { PANELS } from "./content";
import { Intro, type Pos } from "./Intro";
import { SeatPage } from "./SeatPage";
import { setSoundPref, soundPref, Soundscape } from "./sound";

function get(k: string): string | null {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
}
function set(k: string, v: string | null) {
  try {
    if (v === null) localStorage.removeItem(k);
    else localStorage.setItem(k, v);
  } catch {}
}

function readPos(k: string): Pos | null {
  try {
    const p = JSON.parse(get(k) ?? "null") as Pos | null;
    if (p && PANELS[p.panel] && PANELS[p.panel].steps[p.step]) return p;
  } catch {}
  return null;
}

function useReducedMotion() {
  const [r, setR] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    setR(m.matches);
    const on = () => setR(m.matches);
    m.addEventListener?.("change", on);
    return () => m.removeEventListener?.("change", on);
  }, []);
  return r;
}

/**
 * The Arrival page. code: the player's private link code, or null on the generic link.
 * The intro starts straight away; the seat data loads alongside it.
 */
export function ArrivalApp({ code, game }: { code: string | null; game: string }) {
  const q = `game=${encodeURIComponent(game)}${code ? `&t=${encodeURIComponent(code)}` : ""}`;
  const posKey = `arrival:pos:${game}:${code ?? "guest"}`;
  const doneKey = `arrival:done:${game}:${code ?? "guest"}`;

  const [view, setView] = useState<ArrivalView | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"intro" | "seat" | null>(null);
  const [start, setStart] = useState<Pos>({ panel: 0, step: 0 });
  const [introKey, setIntroKey] = useState(0);
  const touched = useRef(false);
  const reduced = useReducedMotion();

  // ---- sound
  const sound = useRef<Soundscape | null>(null);
  const [soundOn, setSoundOn] = useState(false);
  const bed = useRef<(typeof PANELS)[number]["sound"]>(null);
  useEffect(() => {
    sound.current = new Soundscape();
    setSoundOn(soundPref());
    return () => sound.current?.stopAll();
  }, []);
  // Browsers only allow sound after a tap: start on the first one if it's switched on.
  useEffect(() => {
    if (!soundOn) return;
    const first = () => sound.current?.start();
    window.addEventListener("pointerdown", first, { once: true });
    return () => window.removeEventListener("pointerdown", first);
  }, [soundOn]);
  const playBed = (b: (typeof PANELS)[number]["sound"]) => {
    bed.current = b;
    sound.current?.play(b);
  };
  const toggleSound = () => {
    const on = !soundOn;
    setSoundOn(on);
    setSoundPref(on);
    if (on) {
      sound.current?.start();
      sound.current?.play(bed.current);
    } else sound.current?.stopAll();
  };

  // ---- data
  const versionRef = useRef(-1);
  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/arrival?${q}`, { cache: "no-store" });
      const v = (await r.json()) as ArrivalView;
      if (v.version >= versionRef.current) {
        versionRef.current = v.version;
        setView(v);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => {
    void load();
    // Live seats: the stream only says "version N"; we fetch our own copy when it changes.
    let es: EventSource | null = null;
    try {
      es = new EventSource(`/api/stream?game=${encodeURIComponent(game)}`);
      es.addEventListener("v", (e) => {
        if (Number((e as MessageEvent).data) > versionRef.current) void load();
      });
    } catch {}
    const poll = setInterval(() => void load(), 30_000);
    const vis = () => document.visibilityState === "visible" && void load();
    document.addEventListener("visibilitychange", vis);
    return () => {
      es?.close();
      clearInterval(poll);
      document.removeEventListener("visibilitychange", vis);
    };
  }, [load, game]);

  const post = useCallback(
    async (body: object): Promise<string | null> => {
      if (!code) return "Open the link the DM sent you to take your seat.";
      try {
        const r = await fetch(`/api/arrival?${q}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), cache: "no-store" });
        const data = (await r.json().catch(() => ({}))) as ArrivalView & { error?: string };
        if (!r.ok) return data.error ?? "That didn’t work. Try again.";
        if (data.version >= versionRef.current) {
          versionRef.current = data.version;
          setView(data);
        }
        return null;
      } catch {
        return "No connection. Try again in a moment.";
      }
    },
    [code, q],
  );

  // ---- where to start: a first visit plays the intro; after that, the seat page.
  useEffect(() => {
    const saved = readPos(posKey);
    if (opensOnSeat(null, get(doneKey) === "1")) setMode("seat");
    else {
      if (saved) setStart(saved);
      setMode("intro");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Finished on another device (or before a Reset): once we know, skip to the seat page
  // unless they've already started tapping through.
  const opened = useRef(false);
  useEffect(() => {
    if (!view?.me) return;
    if (opensOnSeat(view.me, false) && mode === "intro" && !touched.current && !readPos(posKey)) setMode("seat");
    // A Reset from the DM: play it again as new.
    if (!view.me.finished && !view.me.claimed && get(doneKey) === "1") {
      set(doneKey, null);
      set(posKey, null);
      setStart({ panel: 0, step: 0 });
      setIntroKey((k) => k + 1);
      setMode("intro");
      opened.current = false;
    }
    if (!view.me.finished && !opened.current) {
      opened.current = true;
      void post({ type: "open" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view?.me?.finished, view?.me?.claimed]);

  useEffect(() => {
    if (mode === "seat") playBed("hearth");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const finish = () => {
    set(doneKey, "1");
    set(posKey, null);
    setMode("seat");
    if (view?.me && !view.me.finished) void post({ type: "finish" });
  };

  const replay = () => {
    set(posKey, null);
    setStart({ panel: 0, step: 0 });
    setIntroKey((k) => k + 1);
    touched.current = true;
    setMode("intro");
  };

  if (!mode) return <div className="arrival-blank" />;

  if (mode === "intro") {
    return (
      <Intro
        key={introKey}
        start={start}
        reduced={reduced}
        onPos={(p) => {
          if (p.panel || p.step) touched.current = true;
          set(posKey, JSON.stringify(p));
          playBed(PANELS[p.panel].sound);
        }}
        onCue={(c) => sound.current?.cue(c)}
        onDone={finish}
        soundOn={soundOn}
        onToggleSound={toggleSound}
      />
    );
  }

  return (
    <div className="seat-fade">
      <SeatPage view={view} loading={loading} onClaim={(character, why) => post({ type: "claim", character, why })} onReplay={replay} soundOn={soundOn} onToggleSound={toggleSound} />
    </div>
  );
}
