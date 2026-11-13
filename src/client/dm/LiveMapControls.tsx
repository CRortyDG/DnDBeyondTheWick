"use client";

import { useEffect, useRef, useState } from "react";
import { SEAL_SCALE_MAX, SEAL_SCALE_MIN, type DmCommand } from "@/shared/commands";
import { sealText } from "@/shared/projection";
import type { GameState, PinLink, Scene } from "@/shared/types";
import { Seal } from "../ui/MapView";
import { useDm } from "./context";

/** "Open the Smithy", "Show Mags Wick", "Open Candlefair map": what a pin's link does, or null if its target is gone. */
export function describeLink(link: PinLink, s: Pick<GameState, "shops" | "scenes">): { label: string; cmd: DmCommand } | null {
  if (link.kind === "shop") {
    const sh = s.shops.find((x) => x.id === link.shopId);
    return sh ? { label: `Open ${sh.name}`, cmd: { type: "live.shop", open: true, shopId: sh.id } } : null;
  }
  const sc = s.scenes.find((x) => x.id === link.sceneId);
  if (!sc) return null;
  return { label: sc.kind === "portrait" ? `Show ${sc.name || sc.label}` : `Open ${sc.label}`, cmd: { type: "scene.show", sceneId: sc.id } };
}

/** Under the DM's preview while a map is on the TV: tap a location to zoom the TV to it, reveal or hide it. */
export function LiveMapControls({ scene }: { scene: Scene }) {
  const { view, run, openMap } = useDm();
  const s = view.state;
  const m = scene.map!;
  const pins = [...m.pins].sort((a, b) => a.number - b.number);
  const focusId = s.live.focus?.pinId;
  const focused = pins.find((p) => p.id === focusId);
  const link = focused?.link ? describeLink(focused.link, s) : null;

  return (
    <div className="live-map" aria-label="Locations on this map">
      <div className="live-map-head">
        <button type="button" className={`btn small${m.legendOn ? " on" : ""}`} aria-pressed={m.legendOn} onClick={() => run({ type: "map.legend", sceneId: scene.id, on: !m.legendOn })}>
          <span className="key">L</span> Legend
        </button>
        <label className="inline-label">
          <span className="sr-only">Legend style</span>
          <select className="fld" value={m.legendStyle} onChange={(e) => run({ type: "map.legend", sceneId: scene.id, style: e.target.value as "numbers" | "names" })}>
            <option value="names">Numbers and names</option>
            <option value="numbers">Numbers only</option>
          </select>
        </label>
        {focused ? (
          <button type="button" className="btn small" onClick={() => run({ type: "live.focus", pinId: null })}>
            <span className="key">Esc</span> Zoom out
          </button>
        ) : null}
        <DotSize scene={scene} />
        <span className="spacer" />
        <button type="button" className="btn small" onClick={() => openMap(scene.id)}>
          Edit map
        </button>
      </div>
      {link ? (
        <button type="button" className="btn primary live-map-link" onClick={() => run(link.cmd)}>
          {link.label}
        </button>
      ) : null}
      {pins.length ? (
        <ol>
          {pins.map((p) => (
            <li key={p.id} className={`${p.id === focusId ? "focused" : ""}${p.discovered ? "" : " hidden-row"}`}>
              <Seal label={sealText(p)} className={p.discovered ? "" : "hidden-pin"} />
              <button
                type="button"
                className="live-map-name"
                disabled={!p.discovered}
                aria-pressed={p.id === focusId}
                title={p.discovered ? (p.id === focusId ? "Tap again to zoom back out" : "Zoom the TV to this location") : "Hidden: reveal it first"}
                onClick={() => run({ type: "live.focus", pinId: p.id === focusId ? null : p.id })}
              >
                {p.name || "Unnamed"}
                {p.type ? <small>{p.type}</small> : null}
              </button>
              {p.discovered ? (
                <button type="button" className="btn small" onClick={() => run({ type: "pin.discover", sceneId: scene.id, pinId: p.id, discovered: false, announce: false }, `${p.name || "It"} is hidden again.`)}>
                  Hide
                </button>
              ) : (
                <>
                  <button type="button" className="btn small primary" title="Shows “Discovered: …” on the TV" onClick={() => run({ type: "pin.discover", sceneId: scene.id, pinId: p.id, discovered: true, announce: true })}>
                    Reveal
                  </button>
                  <button type="button" className="btn small" title="Appears on the map without a banner" onClick={() => run({ type: "pin.discover", sceneId: scene.id, pinId: p.id, discovered: true, announce: false })}>
                    Quietly
                  </button>
                </>
              )}
            </li>
          ))}
        </ol>
      ) : (
        <p className="note">No locations yet. Press Edit map to place some.</p>
      )}
    </div>
  );
}

/** A slider for how big this map's dots are. Saves a moment after you stop moving it. */
export function DotSize({ scene }: { scene: Scene }) {
  const { run } = useDm();
  const saved = scene.map?.sealScale ?? 1;
  const [v, setV] = useState(saved);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef(false);
  useEffect(() => {
    if (!pending.current) setV(saved);
  }, [saved]);
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);
  const change = (n: number) => {
    setV(n);
    pending.current = true;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      await run({ type: "map.sealScale", sceneId: scene.id, scale: n });
      pending.current = false;
    }, 250);
  };
  return (
    <label className="dot-size">
      <span>Dot size</span>
      <input
        type="range"
        min={SEAL_SCALE_MIN}
        max={SEAL_SCALE_MAX}
        step={0.05}
        value={v}
        onChange={(e) => change(Number(e.target.value))}
        aria-valuetext={`${Math.round(v * 100)}%`}
      />
      <span className="dot-size-val">{Math.round(v * 100)}%</span>
    </label>
  );
}
