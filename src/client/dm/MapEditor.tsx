"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { DmCommand } from "@/shared/commands";
import { pixelsToPin } from "@/shared/mapGeometry";
import { sealText } from "@/shared/projection";
import { lowestFreeNumber } from "@/shared/reducer";
import type { Pin, PinLink, Scene } from "@/shared/types";
import { Seal, sealSizePx, useMapBox } from "../ui/MapView";
import { artSrc } from "../ui/SceneView";
import { Check } from "./Check";
import { useDm } from "./context";
import { Field } from "./Field";
import { InlineText } from "./InlineText";
import { DotSize } from "./LiveMapControls";
import { uploadImage } from "./upload";

type PinPatch = Partial<Pick<Pin, "showsAs" | "name" | "type" | "description" | "dmNotes" | "x" | "y">> & { link?: PinLink | null };
interface UndoStep {
  cmd: DmCommand;
  what: string;
}

const NUDGE = 0.002;
const NUDGE_BIG = 0.01;

/** The full-screen map editor. Renders nothing if the scene isn't a map (any more). */
export function MapEditor({ sceneId, onClose }: { sceneId: string; onClose: () => void }) {
  const { view } = useDm();
  const scene = view.state.scenes.find((x) => x.id === sceneId);
  useEffect(() => {
    if (!scene || scene.kind !== "map") onClose();
  }, [scene, onClose]);
  if (!scene || scene.kind !== "map") return null;
  return <Editor scene={scene} onClose={onClose} />;
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const newPinId = () => "pin" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

function fullPin(p: Pin) {
  return {
    id: p.id,
    number: p.number,
    discovered: p.discovered,
    showsAs: p.showsAs,
    name: p.name,
    type: p.type,
    description: p.description,
    dmNotes: p.dmNotes,
    x: p.x,
    y: p.y,
    ...(p.link ? { link: p.link } : {}),
  };
}

function Editor({ scene, onClose }: { scene: Scene; onClose: () => void }) {
  const { run, ident, toast } = useDm();
  const pins = useMemo(() => [...(scene.map?.pins ?? [])].sort((a, b) => a.number - b.number), [scene.map]);
  const [editing, setEditing] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  /** Where pins are on this screen while a drag or nudge is on its way to the server. */
  const [moves, setMoves] = useState<Record<string, { x: number; y: number }>>({});
  const undo = useRef<UndoStep[]>([]);
  const [undoCount, setUndoCount] = useState(0);
  const outer = useRef<HTMLDivElement>(null);
  const boxEl = useRef<HTMLDivElement>(null);
  const file = useRef<HTMLInputElement>(null);
  const src = artSrc(scene.art) ?? undefined;
  const { size, box, onLoad } = useMapBox(outer, src);
  // Same size rule as the TV, as if this canvas were the TV screen.
  const sealPx = Math.round(sealSizePx(Math.min(size.w / 1920, size.h / 1080) || 0, scene.map?.sealScale));
  const selected = pins.find((p) => p.id === selectedId) ?? null;
  const sceneId = scene.id;

  // Forget a local position once the server agrees (or the pin is gone).
  useEffect(() => {
    setMoves((m) => {
      let changed = false;
      const out = { ...m };
      for (const id of Object.keys(m)) {
        const p = pins.find((x) => x.id === id);
        if (!p || (Math.abs(p.x - m[id].x) < 1e-6 && Math.abs(p.y - m[id].y) < 1e-6)) {
          delete out[id];
          changed = true;
        }
      }
      return changed ? out : m;
    });
  }, [pins]);

  const pushUndo = (cmd: DmCommand, what: string) => {
    undo.current.push({ cmd, what });
    if (undo.current.length > 100) undo.current.shift();
    setUndoCount(undo.current.length);
  };
  const doUndo = async () => {
    flushNudge();
    const step = undo.current.pop();
    setUndoCount(undo.current.length);
    if (!step) return;
    if (step.cmd.type === "pin.update" && step.cmd.patch.x !== undefined && step.cmd.patch.y !== undefined) {
      const { pinId, patch } = step.cmd;
      setMoves((m) => ({ ...m, [pinId]: { x: patch.x!, y: patch.y! } }));
    }
    if (await run(step.cmd)) toast(`Undone: ${step.what}.`);
  };

  const posOf = (p: Pin) => moves[p.id] ?? p;

  const edit = (p: Pin, patch: PinPatch, what: string) => {
    const old: PinPatch = {};
    for (const k of Object.keys(patch) as (keyof PinPatch)[]) {
      if (k === "link") old.link = p.link ?? null;
      else (old as Record<string, unknown>)[k] = p[k];
    }
    pushUndo({ type: "pin.update", sceneId, pinId: p.id, patch: old }, what);
    return run({ type: "pin.update", sceneId, pinId: p.id, patch });
  };

  const addAt = async (x: number, y: number) => {
    const pinId = newPinId();
    const n = lowestFreeNumber(pins);
    if (await run({ type: "pin.add", sceneId, pinId, x, y })) {
      pushUndo({ type: "pin.remove", sceneId, pinId }, `add ${n}`);
      setSelectedId(pinId);
    }
  };

  const remove = async (p: Pin) => {
    if (await run({ type: "pin.remove", sceneId, pinId: p.id })) {
      pushUndo({ type: "pin.restore", sceneId, pin: fullPin(p) }, `delete ${sealText(p)}`);
      setSelectedId(null);
      toast(`Removed ${sealText(p)}${p.name ? ` (${p.name})` : ""}. Ctrl+Z brings it back.`);
    }
  };

  const setDiscovered = (p: Pin, v: boolean) => {
    pushUndo({ type: "pin.discover", sceneId, pinId: p.id, discovered: !v, announce: false }, v ? "discover" : "hide");
    return run({ type: "pin.discover", sceneId, pinId: p.id, discovered: v, announce: false });
  };

  // ---------- pointer ----------
  const fracAt = (clientX: number, clientY: number) => {
    const r = boxEl.current!.getBoundingClientRect();
    return pixelsToPin(clientX - r.left, clientY - r.top, r.width, r.height);
  };
  const drag = useRef<{ id: string; sx: number; sy: number; moved: boolean; orig: { x: number; y: number } } | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const onSealDown = (e: React.PointerEvent, p: Pin) => {
    e.stopPropagation();
    if (!editing || e.button !== 0) {
      setSelectedId(p.id);
      return;
    }
    flushNudge();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { id: p.id, sx: e.clientX, sy: e.clientY, moved: false, orig: { x: p.x, y: p.y } };
  };
  const onSealMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    if (!d.moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < 4) return;
    if (!d.moved) setDraggingId(d.id);
    d.moved = true;
    const pos = fracAt(e.clientX, e.clientY);
    setMoves((m) => ({ ...m, [d.id]: pos }));
  };
  const onSealUp = (e: React.PointerEvent, p: Pin) => {
    const d = drag.current;
    drag.current = null;
    setDraggingId(null);
    if (!d) return;
    setSelectedId(d.id);
    if (!d.moved) return;
    const pos = fracAt(e.clientX, e.clientY);
    setMoves((m) => ({ ...m, [d.id]: pos }));
    pushUndo({ type: "pin.update", sceneId, pinId: d.id, patch: d.orig }, `move ${sealText(p)}`);
    void run({ type: "pin.update", sceneId, pinId: d.id, patch: pos });
  };

  // ---------- nudging with the arrow keys ----------
  const nudging = useRef<{ id: string; orig: { x: number; y: number }; pos: { x: number; y: number }; timer: ReturnType<typeof setTimeout> } | null>(null);
  function flushNudge() {
    const n = nudging.current;
    if (!n) return;
    clearTimeout(n.timer);
    nudging.current = null;
    const p = pins.find((x) => x.id === n.id);
    pushUndo({ type: "pin.update", sceneId, pinId: n.id, patch: n.orig }, `nudge ${p ? sealText(p) : "pin"}`);
    void run({ type: "pin.update", sceneId, pinId: n.id, patch: n.pos });
  }
  const nudge = (p: Pin, dx: number, dy: number, big: boolean) => {
    if (nudging.current && nudging.current.id !== p.id) flushNudge();
    const step = big ? NUDGE_BIG : NUDGE;
    const cur = nudging.current?.pos ?? posOf(p);
    const pos = { x: Math.round(clamp01(cur.x + dx * step) * 10000) / 10000, y: Math.round(clamp01(cur.y + dy * step) * 10000) / 10000 };
    setMoves((m) => ({ ...m, [p.id]: pos }));
    if (nudging.current) clearTimeout(nudging.current.timer);
    nudging.current = { id: p.id, orig: nudging.current?.orig ?? { x: p.x, y: p.y }, pos, timer: setTimeout(flushNudge, 450) };
  };

  // ---------- keys (captured, so the DM view's own arrows and Esc don't also fire) ----------
  const keyHandler = useRef<(e: KeyboardEvent) => void>(() => {});
  keyHandler.current = (e: KeyboardEvent) => {
    const t = e.target as HTMLElement | null;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
    const stop = () => {
      e.preventDefault();
      e.stopImmediatePropagation();
    };
    if ((e.metaKey || e.ctrlKey) && !e.shiftKey && (e.key === "z" || e.key === "Z")) {
      stop();
      void doUndo();
      return;
    }
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const dirs: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    if (dirs[e.key]) {
      // Arrows never switch scenes while the editor is open.
      stop();
      if (editing && selected) nudge(selected, dirs[e.key][0], dirs[e.key][1], e.shiftKey);
      return;
    }
    if ((e.key === "Delete" || e.key === "Backspace") && editing && selected) {
      stop();
      void remove(selected);
      return;
    }
    if (e.key === "Escape") {
      stop();
      if (selected) setSelectedId(null);
      else close();
    }
  };
  useEffect(() => {
    const on = (e: KeyboardEvent) => keyHandler.current(e);
    window.addEventListener("keydown", on, true);
    return () => window.removeEventListener("keydown", on, true);
  }, []);

  const close = () => {
    flushNudge();
    onClose();
  };

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    setBusy(true);
    try {
      const url = await uploadImage(ident, f);
      if (await run({ type: "scene.update", sceneId, patch: { art: { url } } })) toast("Map image saved. Your pins stay where they were on it.");
    } catch (err) {
      toast(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="map-editor-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`Edit map: ${scene.label}`}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        void onFile(e.dataTransfer.files[0]);
      }}
    >
      <div className="map-editor-head">
        <h2>{scene.label}</h2>
        <button type="button" className={`btn${editing ? " on" : ""}`} aria-pressed={editing} onClick={() => setEditing(!editing)}>
          Edit mode {editing ? "on" : "off"}
        </button>
        <button type="button" className="btn" onClick={() => void addAt(0.5, 0.5)} title="Puts the next free number in the middle; drag it into place">
          Add number
        </button>
        <button type="button" className="btn" disabled={!undoCount} onClick={() => void doUndo()} title="Ctrl+Z">
          Undo
        </button>
        <button type="button" className="btn" disabled={busy} onClick={() => file.current?.click()}>
          {busy ? "Uploading…" : src ? "Replace image" : "Upload image"}
        </button>
        <input ref={file} type="file" accept="image/*" hidden onChange={(e) => void onFile(e.target.files?.[0])} />
        <DotSize scene={scene} />
        <span className="spacer" />
        <button type="button" className="btn" onClick={() => run({ type: "scene.show", sceneId }, "On the TV.")}>
          Show on TV
        </button>
        <button type="button" className="btn primary" onClick={close}>
          Done
        </button>
      </div>
      <p className="note">
        {editing
          ? "Click the map to drop a pin. Drag pins to move them; arrows nudge the selected pin (Shift for bigger steps); Delete removes it; Ctrl+Z undoes."
          : "Edit mode is off: clicking a pin selects it without moving anything."}{" "}
        Hidden pins are faded and dashed; only discovered ones reach the TV.
      </p>

      <div className="map-editor-body">
        <div ref={outer} className={`map-canvas${editing ? " map-edit" : ""}`} style={{ "--seal": `${sealPx}px` } as CSSProperties}>
          <div
            ref={boxEl}
            className="map-box"
            style={{ left: box.left, top: box.top, width: box.width, height: box.height }}
            onClick={(e) => {
              if (!editing || (e.target as HTMLElement).closest(".seal")) return;
              const pos = fracAt(e.clientX, e.clientY);
              void addAt(pos.x, pos.y);
            }}
          >
            {src ? (
              <img className="map-img" src={src} alt={scene.alt ?? ""} onLoad={onLoad} draggable={false} />
            ) : (
              <div className="map-empty">
                <span>
                  No image yet. Upload the map (or drop it here).
                  <br />
                  Pins keep their spot as a fraction of the image.
                </span>
              </div>
            )}
            {pins.map((p) => {
              const pos = posOf(p);
              return (
                <Seal
                  key={p.id}
                  label={sealText(p)}
                  className={`${p.discovered ? "" : "hidden-pin"}${p.id === selectedId ? " selected" : ""}${p.id === draggingId ? " dragging" : ""}`}
                  style={{ left: `${pos.x * 100}%`, top: `${pos.y * 100}%`, transform: "translate(-50%, -50%)" }}
                  role="button"
                  tabIndex={0}
                  aria-label={`${sealText(p)}: ${p.name || "unnamed"}${p.discovered ? "" : " (hidden)"}`}
                  aria-pressed={p.id === selectedId}
                  onPointerDown={(e) => onSealDown(e, p)}
                  onPointerMove={onSealMove}
                  onPointerUp={(e) => onSealUp(e, p)}
                  onPointerCancel={() => {
                    drag.current = null;
                    setDraggingId(null);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedId(p.id);
                    }
                  }}
                />
              );
            })}
          </div>
        </div>

        <aside className="pin-side box" aria-label="Selected location">
          {selected ? (
            <PinFields key={selected.id} scene={scene} pin={selected} edit={edit} setDiscovered={setDiscovered} remove={remove} />
          ) : (
            <p className="note">{editing ? "Select a pin to edit it, or click the map to drop a new one." : "Select a pin to edit it."}</p>
          )}
        </aside>
      </div>

      <ol className="pin-list" aria-label="Locations">
        {pins.map((p) => (
          <li key={p.id} className={`${p.id === selectedId ? "selected" : ""}${p.discovered ? "" : " hidden-row"}`}>
            <Seal label={sealText(p)} className={p.discovered ? "" : "hidden-pin"} onClick={() => setSelectedId(p.id)} role="button" aria-label={`Select ${sealText(p)}`} />
            <InlineText label="Type" className="type" value={p.type} placeholder="type" maxLength={40} onCommit={(v) => edit(p, { type: v }, `type of ${sealText(p)}`)} />
            <InlineText label="Name" className="name" value={p.name} placeholder="Name this place" maxLength={120} onCommit={(v) => edit(p, { name: v }, `name of ${sealText(p)}`)} />
            <InlineText label="Description" value={p.description} placeholder="A line players can read" maxLength={600} onCommit={(v) => edit(p, { description: v }, `description of ${sealText(p)}`)} />
            <Check checked={p.discovered} onChange={(v) => setDiscovered(p, v)}>
              {p.discovered ? "Discovered" : "Hidden"}
            </Check>
          </li>
        ))}
      </ol>
      {!pins.length ? <p className="note">No locations yet. Click the map or press Add number.</p> : null}
    </div>
  );
}

function PinFields({
  scene,
  pin,
  edit,
  setDiscovered,
  remove,
}: {
  scene: Scene;
  pin: Pin;
  edit: (p: Pin, patch: PinPatch, what: string) => Promise<boolean>;
  setDiscovered: (p: Pin, v: boolean) => Promise<boolean>;
  remove: (p: Pin) => Promise<void>;
}) {
  const { view } = useDm();
  const s = view.state;
  const label = sealText(pin);
  const linkValue = pin.link ? (pin.link.kind === "shop" ? `shop:${pin.link.shopId}` : `scene:${pin.link.sceneId}`) : "";
  const portraits = s.scenes.filter((x) => x.kind === "portrait");
  const maps = s.scenes.filter((x) => x.kind === "map" && x.id !== scene.id);

  return (
    <div className="form">
      <div className="pin-side-head">
        <Seal label={label} className={pin.discovered ? "" : "hidden-pin"} />
        <h3>{pin.name || `Location ${pin.number}`}</h3>
      </div>
      <div className="inline">
        <Field label="Shows as" value={pin.showsAs} placeholder={String(pin.number)} hint="Up to 4 characters" onCommit={(v) => (v.length > 4 ? false : edit(pin, { showsAs: v }, `seal of ${label}`))} />
        <Field label="Type" value={pin.type} placeholder="tavern, temple, danger…" onCommit={(v) => edit(pin, { type: v }, `type of ${label}`)} />
      </div>
      <Field label="Name" value={pin.name} placeholder="The Flickering Candle" onCommit={(v) => edit(pin, { name: v }, `name of ${label}`)} />
      <Field label="Description (players can read this on the TV)" value={pin.description} multiline onCommit={(v) => edit(pin, { description: v }, `description of ${label}`)} />
      <Field label="DM notes (only you see these)" value={pin.dmNotes} multiline onCommit={(v) => edit(pin, { dmNotes: v }, `notes of ${label}`)} />
      <Check checked={pin.discovered} onChange={(v) => setDiscovered(pin, v)}>
        Discovered (shown on the TV)
      </Check>
      <label>
        Link
        <select
          className="fld"
          value={linkValue}
          onChange={(e) => {
            const v = e.target.value;
            const link: PinLink | null = !v ? null : v.startsWith("shop:") ? { kind: "shop", shopId: v.slice(5) } : { kind: "scene", sceneId: v.slice(6) };
            void edit(pin, { link }, `link of ${label}`);
          }}
        >
          <option value="">None</option>
          <optgroup label="Open a shop on the TV">
            {s.shops.map((sh) => (
              <option key={sh.id} value={`shop:${sh.id}`}>
                {sh.name}
              </option>
            ))}
          </optgroup>
          {portraits.length ? (
            <optgroup label="Show an NPC portrait">
              {portraits.map((sc) => (
                <option key={sc.id} value={`scene:${sc.id}`}>
                  {sc.name || sc.label}
                </option>
              ))}
            </optgroup>
          ) : null}
          {maps.length ? (
            <optgroup label="Open another map">
              {maps.map((sc) => (
                <option key={sc.id} value={`scene:${sc.id}`}>
                  {sc.label}
                </option>
              ))}
            </optgroup>
          ) : null}
        </select>
      </label>
      <button type="button" className="btn small danger" onClick={() => void remove(pin)}>
        Delete {label}
      </button>
    </div>
  );
}
