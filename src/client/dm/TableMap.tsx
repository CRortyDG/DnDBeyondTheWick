"use client";

// The DM's table map: the map as the table plays on it. Drag tokens (the TV
// follows when you let go), add the party or a monster, lay a grid to snap to,
// and run the fight's turns without leaving the map.

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { upNext } from "@/shared/combat";
import type { DmCommand } from "@/shared/commands";
import { pixelsToPin } from "@/shared/mapGeometry";
import { sealText } from "@/shared/projection";
import { GRID_CELL_MAX, GRID_CELL_MIN, snapToGrid, TOKEN_COLORS, TOKEN_SIZES, tokenFace, tokenWidth } from "@/shared/tokens";
import type { MapGrid, MapToken, Scene, TokenColor } from "@/shared/types";
import { Seal, sealSizePx, useMapBox } from "../ui/MapView";
import { artSrc } from "../ui/SceneView";
import { GridLines, Token } from "../ui/Tokens";
import { Check } from "./Check";
import { useDm } from "./context";
import { Field } from "./Field";
import { cutAndUploadTiles, uploadImage } from "./upload";
import { cellAt, decodeBits, encodeBits, fogLayout, setBit, tileGrid } from "@/shared/fog";
import { FogLayer } from "../ui/Fog";

type TokenPatch = Extract<DmCommand, { type: "token.update" }>["patch"];

const SIZE_NAMES: Record<number, string> = { 0.5: "Tiny", 1: "Medium", 2: "Large", 3: "Huge", 4: "Gargantuan" };
const COLOR_NAMES: Record<TokenColor, string> = { blue: "Blue", green: "Green", gold: "Gold", purple: "Purple", teal: "Teal", orange: "Orange", red: "Red", grey: "Grey" };

/** Renders nothing if the scene isn't a map (any more). */
export function TableMap({ sceneId, onClose }: { sceneId: string; onClose: () => void }) {
  const { view } = useDm();
  const scene = view.state.scenes.find((x) => x.id === sceneId);
  useEffect(() => {
    if (!scene || scene.kind !== "map") onClose();
  }, [scene, onClose]);
  if (!scene || scene.kind !== "map") return null;
  return <Table scene={scene} onClose={onClose} />;
}

function Table({ scene, onClose }: { scene: Scene; onClose: () => void }) {
  const { view, run, toast, ident } = useDm();
  const s = view.state;
  const m = scene.map!;
  const tokens = useMemo(() => m.tokens ?? [], [m.tokens]);
  const sceneId = scene.id;
  const isLive = s.live.sceneId === sceneId;
  const f = s.fight;

  const outer = useRef<HTMLDivElement>(null);
  const boxEl = useRef<HTMLDivElement>(null);
  const src = artSrc(scene.art) ?? undefined;
  const { size, box, onLoad } = useMapBox(outer, src);
  const sealPx = Math.round(sealSizePx(Math.min(size.w / 1920, size.h / 1080) || 0, m.sealScale));
  const aspect = box.width > 0 ? box.height / box.width : 0.5625;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = tokens.find((t) => t.id === selectedId) ?? null;
  const [gridOpen, setGridOpen] = useState(false);
  /** Measuring one square: drag across it on the map. */
  const [measuring, setMeasuring] = useState(false);
  const [measure, setMeasure] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(null);

  /** Where tokens are on this screen while a move is on its way to the server. */
  const [moves, setMoves] = useState<Record<string, { x: number; y: number }>>({});
  useEffect(() => {
    setMoves((mv) => {
      let changed = false;
      const out = { ...mv };
      for (const id of Object.keys(mv)) {
        const t = tokens.find((x) => x.id === id);
        if (!t || (Math.abs(t.x - mv[id].x) < 1e-4 && Math.abs(t.y - mv[id].y) < 1e-4)) {
          delete out[id];
          changed = true;
        }
      }
      return changed ? out : mv;
    });
  }, [tokens]);
  const posOf = (t: MapToken) => moves[t.id] ?? t;

  const fracAt = (clientX: number, clientY: number) => {
    const r = boxEl.current!.getBoundingClientRect();
    return pixelsToPin(clientX - r.left, clientY - r.top, r.width, r.height);
  };
  const moveTo = (t: MapToken, x: number, y: number) => {
    const pos = snapToGrid(m.grid, x, y, t.size);
    setMoves((mv) => ({ ...mv, [t.id]: pos }));
    void run({ type: "token.move", sceneId, tokenId: t.id, x: pos.x, y: pos.y });
  };

  // ---------- dragging tokens ----------
  const drag = useRef<{ id: string; sx: number; sy: number; moved: boolean } | null>(null);
  const [dragPos, setDragPos] = useState<{ id: string; x: number; y: number } | null>(null);
  const onTokDown = (e: React.PointerEvent, t: MapToken) => {
    e.stopPropagation();
    if (e.button !== 0) return;
    setSelectedId(t.id);
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { id: t.id, sx: e.clientX, sy: e.clientY, moved: false };
  };
  const onTokMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    if (!d.moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < 4) return;
    d.moved = true;
    setDragPos({ id: d.id, ...fracAt(e.clientX, e.clientY) });
  };
  const onTokUp = (e: React.PointerEvent, t: MapToken) => {
    const d = drag.current;
    drag.current = null;
    setDragPos(null);
    if (!d || !d.moved) return;
    const p = fracAt(e.clientX, e.clientY);
    moveTo(t, p.x, p.y);
  };

  // ---------- fog of war ----------
  const fog = m.fog;
  const [fogOpen, setFogOpen] = useState(false);
  const [fogTool, setFogTool] = useState<"reveal" | "cover" | "box" | null>(null);
  const [brush, setBrush] = useState(1);
  const [fogBusy, setFogBusy] = useState(false);
  /** This screen's cells while a stroke is on its way to the server. */
  const [localBits, setLocalBits] = useState<Uint8Array | null>(null);
  const fogBits = fog?.bits;
  useEffect(() => setLocalBits(null), [fogBits]);
  const stroke = useRef<{ bits: Uint8Array; box?: { x0: number; y0: number } } | null>(null);
  const [fogBox, setFogBox] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(null);
  const artUrl = scene.art?.url;
  const tilesStale = !!fog && (!fog.tiles || fog.tiles.src !== artUrl);
  const wantLayout = fogLayout(m.grid, aspect);
  const offGrid = !!fog && !!m.grid && (Math.abs(fog.cw - wantLayout.cw) > 1e-4 || Math.abs(fog.x0 - wantLayout.x0) > 1e-4 || Math.abs(fog.y0 - wantLayout.y0) > 1e-4);

  const setupFog = async (keep: boolean) => {
    if (!artUrl || !src) return toast("Upload the map image first (Edit map).");
    setFogBusy(true);
    try {
      const tiles = await cutAndUploadTiles(ident, src, tileGrid(aspect));
      const layout = fogLayout(m.grid, aspect);
      if (await run({ type: "fog.setup", sceneId, layout, tiles: { ...tiles, src: artUrl }, keep }, keep ? "Fog updated." : "Fog is on: the whole map is covered. Reveal what the party can see.")) setFogTool("reveal");
    } catch (err) {
      toast(err instanceof Error ? err.message : String(err));
    } finally {
      setFogBusy(false);
    }
  };

  const paintAt = (bits: Uint8Array, x: number, y: number, clear: boolean) => {
    if (!fog) return;
    const cell = cellAt(fog, x, y);
    if (!cell) return;
    const rad = brush - 1;
    for (let r = cell.r - rad; r <= cell.r + rad; r++) {
      for (let c = cell.c - rad; c <= cell.c + rad; c++) {
        if (r < 0 || c < 0 || r >= fog.rows || c >= fog.cols) continue;
        if (rad > 0 && (c - cell.c) ** 2 + (r - cell.r) ** 2 > rad * rad + rad) continue;
        setBit(bits, r * fog.cols + c, clear);
      }
    }
  };
  const fillBox = (bits: Uint8Array, b: { x0: number; y0: number; x1: number; y1: number }) => {
    if (!fog) return;
    const a = cellAt(fog, Math.min(b.x0, b.x1), Math.min(b.y0, b.y1)) ?? { c: 0, r: 0 };
    const z = cellAt(fog, Math.max(b.x0, b.x1), Math.max(b.y0, b.y1)) ?? { c: fog.cols - 1, r: fog.rows - 1 };
    for (let r = a.r; r <= z.r; r++) for (let c = a.c; c <= z.c; c++) setBit(bits, r * fog.cols + c, true);
  };
  const fogDown = (e: React.PointerEvent) => {
    if (!fog || !fogTool || e.button !== 0) return false;
    e.currentTarget.setPointerCapture(e.pointerId);
    const bits = new Uint8Array(localBits ?? decodeBits(fog.bits, fog.cols, fog.rows));
    const p = fracAt(e.clientX, e.clientY);
    if (fogTool === "box") {
      stroke.current = { bits, box: { x0: p.x, y0: p.y } };
      setFogBox({ x0: p.x, y0: p.y, x1: p.x, y1: p.y });
    } else {
      stroke.current = { bits };
      paintAt(bits, p.x, p.y, fogTool === "reveal");
      setLocalBits(new Uint8Array(bits));
    }
    return true;
  };
  const fogMove = (e: React.PointerEvent) => {
    const st = stroke.current;
    if (!st) return false;
    const p = fracAt(e.clientX, e.clientY);
    if (st.box) setFogBox({ x0: st.box.x0, y0: st.box.y0, x1: p.x, y1: p.y });
    else {
      paintAt(st.bits, p.x, p.y, fogTool === "reveal");
      setLocalBits(new Uint8Array(st.bits));
    }
    return true;
  };
  const fogUp = (e: React.PointerEvent) => {
    const st = stroke.current;
    if (!st) return false;
    stroke.current = null;
    if (st.box) {
      const p = fracAt(e.clientX, e.clientY);
      fillBox(st.bits, { x0: st.box.x0, y0: st.box.y0, x1: p.x, y1: p.y });
      setFogBox(null);
      setLocalBits(new Uint8Array(st.bits));
    }
    void run({ type: "fog.bits", sceneId, bits: encodeBits(st.bits) });
    return true;
  };

  // ---------- measuring a square ----------
  const onBoxDown = (e: React.PointerEvent) => {
    if (fogDown(e)) return;
    if (!measuring || e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = fracAt(e.clientX, e.clientY);
    setMeasure({ x0: p.x, y0: p.y, x1: p.x, y1: p.y });
  };
  const onBoxMove = (e: React.PointerEvent) => {
    if (fogMove(e)) return;
    if (!measuring || !measure) return;
    const p = fracAt(e.clientX, e.clientY);
    setMeasure({ ...measure, x1: p.x, y1: p.y });
  };
  const onBoxUp = (e: React.PointerEvent) => {
    if (fogUp(e)) return;
    if (!measuring || !measure) return;
    const wFrac = Math.abs(measure.x1 - measure.x0);
    const hFrac = Math.abs(measure.y1 - measure.y0) * aspect; // as a fraction of the width
    const cell = Math.max(wFrac, hFrac);
    setMeasure(null);
    if (cell < GRID_CELL_MIN) return toast("Drag from one corner of a square to the opposite corner.");
    setMeasuring(false);
    void saveGrid({ cell: Math.min(GRID_CELL_MAX, cell), ox: Math.min(measure.x0, measure.x1), oy: Math.min(measure.y0, measure.y1) }, "Grid set. Tokens snap to it.");
  };

  const saveGrid = (patch: Partial<MapGrid>, msg?: string) => {
    const g: MapGrid = { snap: true, lines: true, cell: 0.05, ox: 0, oy: 0, ...m.grid, ...patch, aspect: Number(aspect.toFixed(4)) || 0.5625 };
    return run({ type: "map.grid", sceneId, grid: g }, msg);
  };

  // ---------- adding ----------
  const centre = () => {
    // Near the party if they're on the map, else the middle.
    const party = tokens.filter((t) => t.kind === "player");
    if (!party.length) return { x: 0.5, y: 0.5 };
    return { x: party.reduce((a, t) => a + t.x, 0) / party.length, y: party.reduce((a, t) => a + t.y, 0) / party.length };
  };
  const addParty = async () => {
    const c = centre();
    await run({ type: "token.party", sceneId, x: c.x, y: c.y });
  };
  const addOne = async (kind: "monster" | "npc") => {
    const c = centre();
    await run({ type: "token.add", sceneId, kind, name: kind === "monster" ? "Monster" : "Someone", x: c.x, y: Math.max(0, c.y - 0.08), hidden: kind === "monster" });
  };

  // ---------- keys (captured, so the DM view's and fight screen's own keys don't also fire) ----------
  const keyHandler = useRef<(e: KeyboardEvent) => void>(() => {});
  keyHandler.current = (e: KeyboardEvent) => {
    const t = e.target as HTMLElement | null;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const stop = () => {
      e.preventDefault();
      e.stopImmediatePropagation();
    };
    const dirs: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    if (dirs[e.key]) {
      stop();
      if (!selected) return;
      const p = posOf(selected);
      const stepX = m.grid ? m.grid.cell : e.shiftKey ? 0.02 : 0.005;
      const stepY = m.grid ? m.grid.cell / (m.grid.aspect || 1) : stepX / aspect;
      moveTo(selected, p.x + dirs[e.key][0] * stepX, p.y + dirs[e.key][1] * stepY);
      return;
    }
    if ((e.key === "Delete" || e.key === "Backspace") && selected) {
      stop();
      void run({ type: "token.remove", sceneId, tokenId: selected.id });
      setSelectedId(null);
      return;
    }
    if (e.key === "h" || e.key === "H") {
      if (!selected) return;
      stop();
      void run({ type: "token.update", sceneId, tokenId: selected.id, patch: { hidden: !selected.hidden } });
      return;
    }
    if (e.key === "Escape") {
      stop();
      if (measuring) setMeasuring(false);
      else if (fogTool) setFogTool(null);
      else if (selected) setSelectedId(null);
      else onClose();
    }
  };
  useEffect(() => {
    const on = (e: KeyboardEvent) => keyHandler.current(e);
    window.addEventListener("keydown", on, true);
    return () => window.removeEventListener("keydown", on, true);
  }, []);

  const running = f && (f.status === "running" || f.status === "paused");
  const cur = running ? f.order.find((c) => c.id === f.currentId) : undefined;
  const nx = running && f ? upNext(f) : null;
  const pins = [...m.pins].sort((a, b) => a.number - b.number);
  const g = m.grid;

  return (
    <div className="map-editor-overlay table-map" role="dialog" aria-modal="true" aria-label={`Table map: ${scene.label}`}>
      <div className="map-editor-head">
        <h2>{scene.label}</h2>
        {isLive ? (
          <span className="tm-live">On the TV</span>
        ) : (
          <>
            <span className="tm-prep" title="Players see nothing of this map until you show it">Not on the TV · setting up</span>
            <button type="button" className="btn" onClick={() => run({ type: "scene.show", sceneId }, "On the TV.")}>
              Show on TV
            </button>
          </>
        )}
        <button type="button" className="btn" onClick={() => void addParty()} title="A token for everyone at the table who hasn't one here">
          Add party
        </button>
        <button type="button" className="btn" onClick={() => void addOne("monster")} title="Starts hidden; press H or untick Hidden to show it">
          Add monster
        </button>
        <button type="button" className="btn" onClick={() => void addOne("npc")}>
          Add NPC
        </button>
        <button type="button" className={`btn${gridOpen ? " on" : ""}`} aria-pressed={gridOpen} onClick={() => setGridOpen(!gridOpen)}>
          Grid{g ? (g.snap ? " · snap" : " · free") : " · off"}
        </button>
        <button
          type="button"
          className={`btn${fogOpen ? " on" : ""}`}
          aria-pressed={fogOpen}
          onClick={() => {
            setFogOpen(!fogOpen);
            if (fogOpen) setFogTool(null);
          }}
        >
          Fog{fog?.on ? " · on" : " · off"}
        </button>
        <span className="spacer" />
        {running ? (
          <div className="tm-turn" aria-live="polite">
            <span className="fx-now-label">Now</span> <b>{cur?.name ?? "…"}</b>
            {nx ? (
              <>
                {" "}
                <span className="fx-now-label">Next</span> {nx.name}
              </>
            ) : null}
            <button type="button" className="btn small" onClick={() => run({ type: "fight.back" })} title="Previous turn">
              ‹
            </button>
            <button type="button" className="btn small primary" onClick={() => run({ type: "fight.next" })} title="Next turn (Space on the fight screen)">
              Next turn
            </button>
          </div>
        ) : null}
        <button type="button" className="btn primary" onClick={onClose}>
          Done
        </button>
      </div>

      {gridOpen ? (
        <div className="tm-grid box">
          {g ? (
            <>
              <Check checked={g.snap} onChange={(v) => void saveGrid({ snap: v })}>
                Snap tokens to squares
              </Check>
              <Check checked={g.lines} onChange={(v) => void saveGrid({ lines: v })}>
                Show the lines on the TV
              </Check>
              <GridSize cell={g.cell} onChange={(cell) => void saveGrid({ cell })} />
              <button type="button" className={`btn small${measuring ? " on" : ""}`} onClick={() => setMeasuring(!measuring)}>
                {measuring ? "Drag across one square…" : "Match the map's squares"}
              </button>
              <button type="button" className="btn small danger" onClick={() => run({ type: "map.grid", sceneId, grid: null }, "Grid off.")}>
                Remove grid
              </button>
            </>
          ) : (
            <>
              <span className="note">No grid yet. If the map has squares, match them; otherwise start with a plain grid and size it.</span>
              <button type="button" className={`btn small${measuring ? " on" : ""}`} onClick={() => setMeasuring(!measuring)}>
                {measuring ? "Drag across one square…" : "Match the map's squares"}
              </button>
              <button type="button" className="btn small" onClick={() => void saveGrid({ cell: 0.04, ox: 0, oy: 0 }, "Grid on.")}>
                Plain grid
              </button>
            </>
          )}
        </div>
      ) : null}

      {fogOpen ? (
        <div className="tm-grid box" aria-label="Fog of war">
          {!fog ? (
            <>
              <span className="note">Cover the map and reveal it as the party explores. Only what's revealed is ever sent to the TV and phones.{g ? " Fog lines up with the grid." : " Set a grid first if you want fog to follow the map's squares."}</span>
              <button type="button" className="btn small primary" disabled={fogBusy || !src} onClick={() => void setupFog(false)}>
                {fogBusy ? "Cutting up the map…" : "Cover the map in fog"}
              </button>
            </>
          ) : (
            <>
              <Check checked={fog.on} onChange={(v) => run({ type: "fog.on", sceneId, on: v })}>
                Fog on
              </Check>
              <div className="tm-tools" role="radiogroup" aria-label="Fog tool">
                {(
                  [
                    ["reveal", "Reveal brush"],
                    ["cover", "Cover brush"],
                    ["box", "Reveal a box"],
                  ] as const
                ).map(([k, label]) => (
                  <button key={k} type="button" role="radio" aria-checked={fogTool === k} className={`btn small${fogTool === k ? " on" : ""}`} onClick={() => setFogTool(fogTool === k ? null : k)}>
                    {label}
                  </button>
                ))}
              </div>
              <label className="inline-label">
                Brush
                <select className="fld small" value={brush} onChange={(e) => setBrush(Number(e.target.value))}>
                  <option value={1}>1 square</option>
                  <option value={2}>3 across</option>
                  <option value={3}>5 across</option>
                  <option value={5}>9 across</option>
                </select>
              </label>
              <button type="button" className="btn small" onClick={() => run({ type: "fog.all", sceneId, clear: true }, "All revealed.")}>
                Reveal all
              </button>
              <button type="button" className="btn small" onClick={() => run({ type: "fog.all", sceneId, clear: false }, "All covered.")}>
                Cover all
              </button>
              {tilesStale || offGrid ? (
                <button type="button" className="btn small primary" disabled={fogBusy} onClick={() => void setupFog(!offGrid)} title={tilesStale ? "The map image changed since the fog was set up" : "The grid moved since the fog was set up"}>
                  {fogBusy ? "Cutting up the map…" : tilesStale ? "Update for the new image" : "Line fog up with the grid (covers all)"}
                </button>
              ) : null}
              {tilesStale ? <span className="note warn">The image changed: the TV shows nothing of this map until you update.</span> : null}
            </>
          )}
        </div>
      ) : null}

      <div className="map-editor-body">
        <div ref={outer} className={`map-canvas${measuring || fogTool ? " tm-measuring" : ""}`} style={{ "--seal": `${sealPx}px` } as CSSProperties}>
          <div
            ref={boxEl}
            className="map-box"
            style={{ left: box.left, top: box.top, width: box.width, height: box.height }}
            onPointerDown={onBoxDown}
            onPointerMove={onBoxMove}
            onPointerUp={onBoxUp}
            onClick={(e) => {
              if (!measuring && !fogTool && !(e.target as HTMLElement).closest(".tok")) setSelectedId(null);
            }}
          >
            {src ? (
              <img className="map-img" src={src} alt={scene.alt ?? ""} onLoad={onLoad} draggable={false} />
            ) : (
              <div className="map-empty">
                <span>No image yet. Upload one under Edit map.</span>
              </div>
            )}
            {g ? (
              <div className={g.lines ? "" : "tm-grid-dm-only"}>
                <GridLines grid={g} width={box.width} height={box.height} />
              </div>
            ) : null}
            {fog?.on ? <FogLayer fog={fog} bits={localBits ?? fog.bits} dm /> : null}
            {fogBox ? (
              <div
                className="tm-measure"
                style={{
                  left: `${Math.min(fogBox.x0, fogBox.x1) * 100}%`,
                  top: `${Math.min(fogBox.y0, fogBox.y1) * 100}%`,
                  width: `${Math.abs(fogBox.x1 - fogBox.x0) * 100}%`,
                  height: `${Math.abs(fogBox.y1 - fogBox.y0) * 100}%`,
                }}
              />
            ) : null}
            {pins.map((p) => (
              <Seal key={p.id} label={sealText(p)} className={`tm-pin${p.discovered ? "" : " hidden-pin"}`} style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%`, transform: "translate(-50%, -50%)" }} />
            ))}
            {measure ? (
              <div
                className="tm-measure"
                style={{
                  left: `${Math.min(measure.x0, measure.x1) * 100}%`,
                  top: `${Math.min(measure.y0, measure.y1) * 100}%`,
                  width: `${Math.abs(measure.x1 - measure.x0) * 100}%`,
                  height: `${Math.abs(measure.y1 - measure.y0) * 100}%`,
                }}
              />
            ) : null}
            {tokens.map((t) => {
              const face = tokenFace(s, t);
              const pos = dragPos?.id === t.id ? dragPos : posOf(t);
              return (
                <Token
                  key={t.id}
                  t={{ label: face.label, name: face.name, color: t.color, w: tokenWidth(g, t.size), art: t.art, down: face.down, current: face.current }}
                  x={pos.x}
                  y={pos.y}
                  boxWidth={box.width}
                  className={`tm-tok${face.hidden ? " tok-hidden" : ""}${t.id === selectedId ? " selected" : ""}${dragPos?.id === t.id ? " dragging" : ""}`}
                  role="button"
                  tabIndex={0}
                  aria-pressed={t.id === selectedId}
                  aria-label={`${face.name || face.label}${face.hidden ? " (hidden)" : ""}`}
                  onPointerDown={(e) => onTokDown(e, t)}
                  onPointerMove={onTokMove}
                  onPointerUp={(e) => onTokUp(e, t)}
                  onPointerCancel={() => {
                    drag.current = null;
                    setDragPos(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedId(t.id);
                    }
                  }}
                />
              );
            })}
          </div>
        </div>

        <aside className="pin-side box" aria-label="Selected token">
          {selected ? (
            <TokenFields key={selected.id} scene={scene} token={selected} onRemoved={() => setSelectedId(null)} />
          ) : (
            <div className="note">
              <p>Drag a token to move it; the TV follows when you let go. Arrows move the selected token a square, H hides or shows it, Delete removes it.</p>
              <p>Faded tokens are hidden: only you see them. Monsters you add start hidden. In a fight, everyone fighting gets a token on the map that's on the TV.</p>
              {!tokens.length ? <p>No tokens yet. Press Add party to put everyone on the map.</p> : null}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

/** Square size as a slider: a percentage of the map's width. Saves a moment after you stop. */
function GridSize({ cell, onChange }: { cell: number; onChange: (cell: number) => void }) {
  const [v, setV] = useState(cell);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef(false);
  useEffect(() => {
    if (!pending.current) setV(cell);
  }, [cell]);
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);
  return (
    <label className="dot-size">
      <span>Square size</span>
      <input
        type="range"
        min={0.005}
        max={0.15}
        step={0.0005}
        value={v}
        onChange={(e) => {
          const n = Number(e.target.value);
          setV(n);
          pending.current = true;
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(() => {
            pending.current = false;
            onChange(n);
          }, 250);
        }}
        aria-valuetext={`${Math.round(1 / v)} squares across`}
      />
      <span className="dot-size-val">{Math.round(1 / v)} across</span>
    </label>
  );
}

function TokenFields({ scene, token, onRemoved }: { scene: Scene; token: MapToken; onRemoved: () => void }) {
  const { view, run, ident, toast } = useDm();
  const s = view.state;
  const face = tokenFace(s, token);
  const sceneId = scene.id;
  const file = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const fromFight = !!token.combatantId;
  const player = token.playerId ? s.players.find((p) => p.id === token.playerId) : undefined;
  const patch = (p: TokenPatch) => run({ type: "token.update", sceneId, tokenId: token.id, patch: p });

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    setBusy(true);
    try {
      const url = await uploadImage(ident, f);
      await patch({ art: { url } });
    } catch (err) {
      toast(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="form">
      <div className="pin-side-head">
        <h3>{face.name || face.label}</h3>
        <small className="note">{player ? "Player" : fromFight ? "In the fight" : token.kind === "monster" ? "Monster" : "NPC"}</small>
      </div>
      {fromFight ? <p className="note">Its name and whether the TV sees it follow the fight screen (reveal or hide it there).</p> : null}
      {player ? <p className="note">Shows their character name.</p> : null}
      {!player && !fromFight ? <Field label="Name (the TV shows this)" value={token.name} onCommit={(v) => patch({ name: v })} /> : null}
      <Field label="Letters on the token" value={token.label} placeholder={face.label} hint="Up to 3; empty uses the initials" onCommit={(v) => (v.length > 3 ? false : patch({ label: v }))} />
      <div className="tm-colors" role="radiogroup" aria-label="Colour">
        {TOKEN_COLORS.map((c) => (
          <button key={c} type="button" role="radio" aria-checked={token.color === c} aria-label={COLOR_NAMES[c]} title={COLOR_NAMES[c]} className={`tm-swatch tok-${c}${token.color === c ? " on" : ""}`} onClick={() => patch({ color: c })} />
        ))}
      </div>
      <label>
        Size
        <select className="fld" value={token.size} onChange={(e) => patch({ size: Number(e.target.value) })}>
          {TOKEN_SIZES.map((n) => (
            <option key={n} value={n}>
              {SIZE_NAMES[n]} ({n === 0.5 ? "½" : n}×{n === 0.5 ? "½" : n})
            </option>
          ))}
        </select>
      </label>
      {!fromFight ? (
        <Check checked={token.hidden} onChange={(v) => patch({ hidden: v })}>
          Hidden (only you see it)
        </Check>
      ) : null}
      <Check checked={token.locked} onChange={(v) => patch({ locked: v })}>
        Locked (players can't move it)
      </Check>
      <div className="inline">
        <button type="button" className="btn small" disabled={busy} onClick={() => file.current?.click()}>
          {busy ? "Uploading…" : token.art ? "Change picture" : "Add picture"}
        </button>
        {token.art ? (
          <button type="button" className="btn small" onClick={() => patch({ art: {} })}>
            Remove picture
          </button>
        ) : null}
        <input ref={file} type="file" accept="image/*" hidden onChange={(e) => void onFile(e.target.files?.[0])} />
      </div>
      <button
        type="button"
        className="btn small danger"
        disabled={fromFight || (!!player && !!s.fight && s.fight.status !== "over")}
        title={fromFight ? "It leaves the map when the fight ends" : undefined}
        onClick={async () => {
          if (await run({ type: "token.remove", sceneId, tokenId: token.id })) onRemoved();
        }}
      >
        Remove token
      </button>
    </div>
  );
}
