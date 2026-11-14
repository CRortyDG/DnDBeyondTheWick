"use client";

// The map that's on the TV, on a phone: pinch or the buttons to zoom, drag to
// look around, drag your own token to move it (the TV follows when you let
// go). Fog, hidden pins and hidden foes are already left out by the server.

import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { PlayerCommand } from "@/shared/commands";
import { pixelsToPin } from "@/shared/mapGeometry";
import type { PhoneMap as PhoneMapView, PlayerView } from "@/shared/projection";
import { snapToGrid } from "@/shared/tokens";
import { FogLayer, FogTiles } from "../ui/Fog";
import { Seal, sealSizePx, useMapBox } from "../ui/MapView";
import { artSrc } from "../ui/SceneView";
import { GridLines, Token } from "../ui/Tokens";

const ZMIN = 1;
const ZMAX = 5;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/** live: this map is on the TV, so my token can move. Other known maps are for looking at. */
export function PhoneMap({ pm, meId, send, live = true }: { pm: PhoneMapView; meId: string; send: (cmd: PlayerCommand) => Promise<string | null>; live?: boolean }) {
  const map = pm.map;
  const fog = map.fog;
  const src = fog ? undefined : artSrc(pm.art) ?? undefined;
  const outer = useRef<HTMLDivElement>(null);
  const boxEl = useRef<HTMLDivElement>(null);
  const { size, box, unit, onLoad } = useMapBox(outer, src, fog?.aspect);
  const [view, setView] = useState({ z: 1, tx: 0, ty: 0 });
  const [err, setErr] = useState<string | null>(null);
  const mine = map.tokens.find((t) => t.playerId === meId);
  const canMove = live && !!mine && !mine.locked;
  const [pinId, setPinId] = useState<string | null>(null);
  const pin = map.pins.find((p) => p.id === pinId);

  // Keep the map on screen: at zoom 1 it's centred; zoomed in, its edges never come inside the frame.
  const fit = (v: { z: number; tx: number; ty: number }) => {
    const z = clamp(v.z, ZMIN, ZMAX);
    const w = box.width * z;
    const h = box.height * z;
    const lim = (t: number, inner: number, outerSize: number, start: number) => {
      const lead = start * z + t;
      if (inner <= outerSize) return (outerSize - inner) / 2 - start * z;
      return clamp(lead, outerSize - inner, 0) - start * z;
    };
    return { z, tx: lim(v.tx, w, size.w, box.left), ty: lim(v.ty, h, size.h, box.top) };
  };

  // ---------- pointers: one finger pans (or drags my token), two pinch ----------
  const pts = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ kind: "pan"; x: number; y: number; v: typeof view; sx?: number; sy?: number; pin?: string | null } | { kind: "pinch"; d: number; cx: number; cy: number; v: typeof view } | { kind: "token"; moved: boolean; sx: number; sy: number } | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const [pending, setPending] = useState<{ x: number; y: number } | null>(null);
  useEffect(() => setPending(null), [mine?.x, mine?.y]);

  const fracAt = (cx: number, cy: number) => {
    const r = boxEl.current!.getBoundingClientRect();
    return pixelsToPin(cx - r.left, cy - r.top, r.width, r.height);
  };
  const local = (e: { clientX: number; clientY: number }) => {
    const r = outer.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const onDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pts.current.set(e.pointerId, local(e));
    const onMine = canMove && (e.target as HTMLElement).closest(".tok-mine");
    const tapPin = (e.target as HTMLElement).closest<HTMLElement>("[data-pin]")?.dataset.pin ?? null;
    if (pts.current.size === 1) gesture.current = onMine ? { kind: "token", moved: false, sx: e.clientX, sy: e.clientY } : { kind: "pan", ...local(e), v: view, sx: e.clientX, sy: e.clientY, pin: tapPin };
    else if (pts.current.size === 2) {
      const [a, b] = [...pts.current.values()];
      setDragPos(null);
      gesture.current = { kind: "pinch", d: Math.hypot(a.x - b.x, a.y - b.y) || 1, cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2, v: view };
    }
  };
  const onMove = (e: React.PointerEvent) => {
    if (!pts.current.has(e.pointerId)) return;
    pts.current.set(e.pointerId, local(e));
    const g = gesture.current;
    if (!g) return;
    if (g.kind === "token") {
      if (!g.moved && Math.hypot(e.clientX - g.sx, e.clientY - g.sy) < 6) return;
      g.moved = true;
      setDragPos(fracAt(e.clientX, e.clientY));
    } else if (g.kind === "pan") {
      const p = local(e);
      setView(fit({ z: g.v.z, tx: g.v.tx + p.x - g.x, ty: g.v.ty + p.y - g.y }));
    } else if (g.kind === "pinch" && pts.current.size >= 2) {
      const [a, b] = [...pts.current.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y) || 1;
      const z = clamp(g.v.z * (d / g.d), ZMIN, ZMAX);
      const cx = (a.x + b.x) / 2;
      const cy = (a.y + b.y) / 2;
      // Keep the point between the fingers under the fingers.
      const k = z / g.v.z;
      setView(fit({ z, tx: cx - (g.cx - g.v.tx) * k, ty: cy - (g.cy - g.v.ty) * k }));
    }
  };
  const onUp = async (e: React.PointerEvent) => {
    pts.current.delete(e.pointerId);
    const g = gesture.current;
    if (pts.current.size === 0) gesture.current = null;
    else if (pts.current.size === 1 && g?.kind === "pinch") {
      const p = [...pts.current.values()][0];
      gesture.current = { kind: "pan", ...p, v: view };
    }
    // A tap (not a drag) on a location opens its card; a tap elsewhere closes it.
    if (g?.kind === "pan" && g.sx !== undefined && Math.hypot(e.clientX - g.sx, e.clientY - (g.sy ?? 0)) < 8) setPinId(g.pin ?? null);
    if (g?.kind === "token" && g.moved && mine) {
      const raw = fracAt(e.clientX, e.clientY);
      const pos = snapToGrid(map.grid, raw.x, raw.y, 1);
      setDragPos(null);
      setPending(pos);
      const res = await send({ type: "me.tokenMove", x: pos.x, y: pos.y });
      if (res) {
        setPending(null);
        setErr(res);
      } else setErr(null);
    }
  };

  const zoomBy = (f: number) => {
    const cx = size.w / 2;
    const cy = size.h / 2;
    const z = clamp(view.z * f, ZMIN, ZMAX);
    const k = z / view.z;
    setView(fit({ z, tx: cx - (cx - view.tx) * k, ty: cy - (cy - view.ty) * k }));
  };
  const findMe = () => {
    if (!mine) return;
    const z = Math.max(view.z, 2.5);
    const px = box.left + mine.x * box.width;
    const py = box.top + mine.y * box.height;
    setView(fit({ z, tx: size.w / 2 - px * z, ty: size.h / 2 - py * z }));
  };
  // A new map (or a resize) starts zoomed out.
  useEffect(() => setView({ z: 1, tx: 0, ty: 0 }), [pm.sceneId, size.w, size.h]);

  const sealPx = sealSizePx(unit, map.sealScale);
  const shown = (t: (typeof map.tokens)[number]) => (t.playerId === meId ? (dragPos ?? pending ?? t) : t);

  return (
    <section className="phone-map" aria-label={`Map: ${pm.label}`}>
      <div className="phone-map-head">
        <h2>{pm.label}</h2>
        <span className="spacer" />
        {mine ? (
          <button type="button" className="btn small" onClick={findMe}>
            Find me
          </button>
        ) : null}
        <button type="button" className="btn small" onClick={() => zoomBy(1 / 1.5)} aria-label="Zoom out" disabled={view.z <= ZMIN}>
          −
        </button>
        <button type="button" className="btn small" onClick={() => zoomBy(1.5)} aria-label="Zoom in" disabled={view.z >= ZMAX}>
          +
        </button>
      </div>
      <div
        ref={outer}
        className="phone-map-frame"
        style={{ "--mu": `${unit}px`, "--seal": `${sealPx}px` } as CSSProperties}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={(e) => {
          pts.current.delete(e.pointerId);
          gesture.current = null;
          setDragPos(null);
        }}
      >
        <div className="phone-map-pan" style={{ transform: `translate(${view.tx}px, ${view.ty}px) scale(${view.z})`, "--z": view.z } as CSSProperties}>
          <div ref={boxEl} className="map-box" style={{ left: box.left, top: box.top, width: box.width, height: box.height }}>
            {fog ? <FogTiles fog={fog} /> : src ? <img className="map-img" src={src} alt={pm.alt ?? ""} onLoad={onLoad} draggable={false} /> : <div className="map-empty" />}
            {fog ? <FogLayer fog={fog} bits={fog.bits} /> : null}
            {map.grid?.lines ? <GridLines grid={map.grid} width={box.width} height={box.height} /> : null}
            {map.pins.map((p) => (
              <Seal key={p.id} data-pin={p.id} className={p.id === pinId ? "pulse" : ""} label={p.label} style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%`, transform: `translate(-50%, -50%) scale(${1 / view.z})` }} aria-label={p.name ? `${p.label}: ${p.name}` : `Location ${p.label}`} />
            ))}
            {map.tokens.map((t) => {
              const pos = shown(t);
              const isMine = t.playerId === meId;
              return <Token key={t.id} t={t} x={pos.x} y={pos.y} boxWidth={box.width} className={`${isMine ? "tok-mine" : ""}${isMine && dragPos ? " dragging" : ""}${isMine && !canMove ? " locked" : ""}`} />;
            })}
          </div>
        </div>
      </div>
      {pin ? (
        <div className="phone-pin-card" role="status">
          <Seal label={pin.label} />
          <div>
            <b>{pin.name || `Location ${pin.label}`}</b>
            {pin.type ? <span className="note"> · {pin.type}</span> : null}
            {pin.description ? <p>{pin.description}</p> : null}
            {!pin.name ? <p className="note">The DM hasn&rsquo;t named it for the table yet.</p> : null}
          </div>
        </div>
      ) : null}
      {map.pins.some((p) => p.name) ? (
        <ol className="phone-legend" aria-label="Locations">
          {map.pins
            .filter((p) => p.name)
            .map((p) => (
              <li key={p.id}>
                <button type="button" className={`phone-legend-row${p.id === pinId ? " on" : ""}`} onClick={() => setPinId(p.id === pinId ? null : p.id)}>
                  <Seal label={p.label} />
                  <span>{p.name}</span>
                  {p.type ? <small className="note">{p.type}</small> : null}
                </button>
              </li>
            ))}
        </ol>
      ) : null}
      {err ? (
        <p className="note warn" role="status">
          {err}
        </p>
      ) : null}
      <p className="note">
        {!live
          ? "Tap a location to read about it. Pinch or use + and − to zoom."
          : mine
            ? mine.locked
              ? "The DM has locked your token for now. Tap a location to read about it."
              : "Drag your token to move it; the TV follows when you let go. Tap a location to read about it."
            : "Tap a location to read about it. You're not on this map yet; the DM adds the party's tokens."}
      </p>
    </section>
  );
}

/** The Maps tab: the map on the TV first, then every map the party knows. */
export function Maps({ view, send }: { view: PlayerView; send: (cmd: PlayerCommand) => Promise<string | null> }) {
  const all = [...(view.map ? [view.map] : []), ...view.maps];
  const [pick, setPick] = useState<string | null>(null);
  // Follow the TV: a new map on it is what you see, until you pick another.
  const liveId = view.map?.sceneId ?? null;
  useEffect(() => setPick(null), [liveId]);
  const shown = all.find((m) => m.sceneId === pick) ?? all[0];
  if (!shown) return null;
  return (
    <>
      {all.length > 1 ? (
        <div className="phone-map-pick" role="tablist" aria-label="Maps">
          {all.map((m) => (
            <button key={m.sceneId} type="button" role="tab" aria-selected={m.sceneId === shown.sceneId} className={`btn small${m.sceneId === shown.sceneId ? " on" : ""}`} onClick={() => setPick(m.sceneId)}>
              {m.label}
              {m.sceneId === liveId ? <span className="phone-map-live"> · on the TV</span> : null}
            </button>
          ))}
        </div>
      ) : null}
      <PhoneMap key={shown.sceneId} pm={shown} meId={view.me.id} send={send} live={shown.sceneId === liveId} />
    </>
  );
}
