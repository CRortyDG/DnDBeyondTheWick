"use client";

import { useEffect, useRef, useState } from "react";
import type { PublicScene, TvView } from "@/shared/projection";
import type { Ident } from "../api";
import { useGame } from "../useGame";
import { FullscreenIcon, EyeOffIcon } from "../ui/icons";
import { Purse } from "../ui/Purse";
import { artSrc, SceneView } from "../ui/SceneView";
import { ShopBoard } from "../ui/ShopBoard";
import { Notice } from "../ui/Notice";
import { BannerToast } from "../ui/BannerToast";

const FADE_MS = 600;

export function TvApp({ ident }: { ident: Ident }) {
  const g = useGame<TvView>(ident);
  const view = g.view;

  if (!view) {
    if (g.phase === "no-game") return <Notice title="No table here yet">Ask the DM to set up this game, then reload.</Notice>;
    return <div className="tv-root tv-blank" aria-busy="true" />;
  }
  return <TvScreen view={view} online={g.online} />;
}

function TvScreen({ view, online }: { view: TvView; online: boolean }) {
  const live = view.scenes.find((s) => s.id === view.live.sceneId) ?? view.scenes[0];
  const layers = useCrossfade(live);
  usePreload(view.scenes);
  const { barVisible, idle, togglePinned } = useIdleBar();
  const [showOffline, setShowOffline] = useState(false);

  // Only mention a lost connection if it lasts; the scene stays on screen regardless.
  useEffect(() => {
    if (online) return setShowOffline(false);
    const t = setTimeout(() => setShowOffline(true), 4000);
    return () => clearTimeout(t);
  }, [online]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "f" || e.key === "F") toggleFullscreen();
      if (e.key === "h" || e.key === "H") togglePinned();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePinned]);

  const shop = view.shops.find((s) => s.id === view.live.shopId) ?? view.shops[0];

  return (
    <div className={`tv-root${idle ? " idle" : ""}`}>
      {layers.map((l) => (
        <div key={l.key} className={`tv-layer${l.entering ? " entering" : ""}`} aria-hidden={l.leaving}>
          <SceneView scene={l.scene} table={view.table} flyers={view.flyers} />
        </div>
      ))}

      {view.live.shopOpen && shop ? (
        <div className="tv-shop" role="region" aria-label={view.live.shopCategory ? "The market, open on the TV" : `${shop.name}, open on the TV`}>
          <ShopBoard shops={view.shops} items={view.items} shopId={shop.id} size="tv" mode={view.live.shopCategory ? "category" : "shop"} category={view.live.shopCategory} />
        </div>
      ) : null}

      {view.recap ? (
        <div className="tv-recap" role="region" aria-label="Previously on">
          <div className="tv-recap-sheet">
            <div className="tv-recap-kicker">Previously on&hellip;</div>
            <h2 className="tv-recap-title">{view.recap.title}</h2>
            {view.recap.text
              .split(/\n\s*\n/)
              .filter((p) => p.trim())
              .map((p, i) => (
                <p key={i}>{p.trim()}</p>
              ))}
            {view.recap.notes?.length ? (
              <ul className="tv-recap-notes" aria-label="From the Chronicle">
                {view.recap.notes.map((n, i) => (
                  <li key={i}>
                    <span className="tv-recap-note">{n.text}</span>
                    <span className="tv-recap-by">{n.author}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      ) : null}

      <Purse players={view.purse} visible={view.live.purseVisible} size="tv" />

      <BannerToast banner={view.banner} className="tv-banner" />

      {showOffline ? (
        <div className="tv-offline" role="status">
          Reconnecting<span className="dots" aria-hidden="true" />
        </div>
      ) : null}

      <nav className={`tv-bar${barVisible ? "" : " hidden"}`} aria-label="TV controls">
        <span className="tv-bar-title">{view.game.name}</span>
        {view.session ? <span className="tv-bar-session">{view.session.title}</span> : null}
        <span className="spacer" />
        <span className="tv-bar-hint">F fullscreen · H hide this bar · scenes are switched from the DM view</span>
        <button type="button" className="btn" onClick={toggleFullscreen}>
          <FullscreenIcon /> Fullscreen
        </button>
        <button type="button" className="btn" onClick={togglePinned}>
          <EyeOffIcon /> Hide bar
        </button>
      </nav>
    </div>
  );
}

function toggleFullscreen() {
  try {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen().catch(() => {});
  } catch {}
}

interface Layer {
  key: string;
  scene: PublicScene;
  entering: boolean;
  leaving: boolean;
}

/** Keep the old scene underneath while the new one fades in on top. */
function useCrossfade(scene: PublicScene | undefined): Layer[] {
  const [layers, setLayers] = useState<Layer[]>(() => (scene ? [{ key: scene.id + ":0", scene, entering: false, leaving: false }] : []));
  const n = useRef(0);
  const sig = scene ? JSON.stringify(scene) : "";
  const lastSig = useRef(sig);

  useEffect(() => {
    if (!scene || sig === lastSig.current) return;
    const sameScene = layers.length && layers[layers.length - 1].scene.id === scene.id;
    lastSig.current = sig;
    if (sameScene) {
      // Same scene, new details (a caption edit or new image): swap in place.
      setLayers((ls) => ls.map((l, i) => (i === ls.length - 1 ? { ...l, scene } : l)));
      return;
    }
    const key = `${scene.id}:${++n.current}`;
    setLayers((ls) => [...ls.slice(-1).map((l) => ({ ...l, leaving: true })), { key, scene, entering: true, leaving: false }]);
    const t = setTimeout(() => setLayers((ls) => ls.filter((l) => !l.leaving).map((l) => ({ ...l, entering: false }))), FADE_MS + 80);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);

  return layers;
}

/** Warm the browser cache so switching scenes is instant (and survives a network blip). */
function usePreload(scenes: PublicScene[]) {
  const urls = scenes.map((s) => artSrc(s.art)).filter((u): u is string => !!u && !u.startsWith("/api/art/"));
  const key = urls.join("|");
  useEffect(() => {
    const imgs = urls.map((u) => {
      const i = new Image();
      i.decoding = "async";
      i.src = u;
      return i;
    });
    return () => void imgs;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}

/** The control bar shows when the mouse moves and hides after 3 seconds, like the prototype. */
function useIdleBar() {
  const [idle, setIdle] = useState(false);
  const [pinnedHidden, setPinnedHidden] = useState(false);
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const wake = () => {
      setIdle(false);
      clearTimeout(t);
      t = setTimeout(() => setIdle(true), 3000);
    };
    wake();
    window.addEventListener("mousemove", wake);
    window.addEventListener("touchstart", wake, { passive: true });
    return () => {
      clearTimeout(t);
      window.removeEventListener("mousemove", wake);
      window.removeEventListener("touchstart", wake);
    };
  }, []);
  return { idle, barVisible: !idle && !pinnedHidden, togglePinned: () => setPinnedHidden((v) => !v) };
}
