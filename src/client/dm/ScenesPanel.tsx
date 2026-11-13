"use client";

import { useRef, useState } from "react";
import type { Scene, SceneKind } from "@/shared/types";
import { SceneView } from "../ui/SceneView";
import { DownIcon, UpIcon } from "../ui/icons";
import { useDm } from "./context";
import { Field } from "./Field";
import { Check } from "./Check";
import { uploadImage } from "./upload";

const KINDS: [SceneKind, string][] = [
  ["map", "Map with numbered locations"],
  ["image", "Image"],
  ["portrait", "NPC portrait"],
  ["handout", "Handout on paper"],
  ["notice", "Notice board"],
  ["black", "Black screen"],
  ["table", "The Table (Arrival seats)"],
];

export function ScenesPanel() {
  const { view, run, openMap } = useDm();
  const s = view.state;
  const hasSeedMaps = s.scenes.some((x) => x.kind === "map" && x.label === "Candlefair map") && s.scenes.some((x) => x.kind === "map" && x.label === "Sword Coast map");
  const [openId, setOpenId] = useState<string | null>(null);
  const [newKind, setNewKind] = useState<SceneKind>("image");
  const [newLabel, setNewLabel] = useState("");

  return (
    <div className="scenes-panel">
      <p className="note">
        Reveal scenes never reach the TV until you show them. Images you upload are stored online, so they show on every screen.
      </p>
      <ol className="scene-list">
        {s.scenes.map((sc, i) => (
          <li key={sc.id} className={`scene-item${sc.id === s.live.sceneId ? " live" : ""}`}>
            <div className="scene-row">
              <span className="key">{sc.hotkey ?? "–"}</span>
              <span className="scene-label">
                {sc.label}
                {sc.reveal ? <span className="tag wax">reveal</span> : null}
                {sc.kind === "map" ? <span className="tag">map · {sc.map?.pins.length ?? 0}</span> : null}
                {sc.id === s.live.sceneId ? <span className="tag">on the TV</span> : null}
              </span>
              <span className="spacer" />
              <button className="btn small icon" type="button" aria-label={`Move ${sc.label} up`} disabled={i === 0} onClick={() => run({ type: "scene.move", sceneId: sc.id, dir: -1 })}>
                <UpIcon />
              </button>
              <button className="btn small icon" type="button" aria-label={`Move ${sc.label} down`} disabled={i === s.scenes.length - 1} onClick={() => run({ type: "scene.move", sceneId: sc.id, dir: 1 })}>
                <DownIcon />
              </button>
              <button className="btn small" type="button" onClick={() => run({ type: "scene.show", sceneId: sc.id })}>
                Show
              </button>
              {sc.kind === "map" ? (
                <button className="btn small" type="button" onClick={() => openMap(sc.id)}>
                  Pins
                </button>
              ) : null}
              <button className="btn small" type="button" aria-expanded={openId === sc.id} onClick={() => setOpenId(openId === sc.id ? null : sc.id)}>
                {openId === sc.id ? "Done" : "Edit"}
              </button>
            </div>
            {openId === sc.id ? <SceneEditor scene={sc} /> : null}
          </li>
        ))}
      </ol>

      {!hasSeedMaps ? (
        <div className="box form">
          <h3>Maps</h3>
          <p className="note">
            Add the Candlefair map (8 locations, the first three discovered) and the Sword Coast map (5 locations). Your Town map scene becomes the Candlefair map and keeps its image and hotkey.
          </p>
          <button className="btn" type="button" onClick={() => run({ type: "map.addSeedMaps" }, "Maps added. Upload their images and drag the pins into place.")}>
            Add the Candlefair and Sword Coast maps
          </button>
        </div>
      ) : null}

      <form
        className="box form add-scene"
        onSubmit={async (e) => {
          e.preventDefault();
          if (await run({ type: "scene.add", kind: newKind, label: newLabel || KINDS.find((k) => k[0] === newKind)![1] }, "Scene added.")) setNewLabel("");
        }}
      >
        <h3>Add a scene</h3>
        <div className="inline">
          <label>
            Kind
            <select className="fld" value={newKind} onChange={(e) => setNewKind(e.target.value as SceneKind)}>
              {KINDS.map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label className="grow">
            Name in your list
            <input className="fld" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="e.g. The docks at dusk" />
          </label>
          <button className="btn primary" type="submit">
            Add
          </button>
        </div>
      </form>
    </div>
  );
}

function SceneEditor({ scene }: { scene: Scene }) {
  const { view, run, ident, toast, gated, openMap } = useDm();
  const [busy, setBusy] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const usedKeys = new Map(view.state.scenes.filter((x) => x.id !== scene.id && x.hotkey !== null).map((x) => [x.hotkey, x.label]));
  const patch = (p: Partial<Scene>) => run({ type: "scene.update", sceneId: scene.id, patch: p });
  const takesImage = scene.kind !== "black" && scene.kind !== "table" && !(scene.art?.builtin === "candlefair-board" || scene.art?.builtin === "artum-notice");

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    setBusy(true);
    try {
      const url = await uploadImage(ident, f);
      if (await patch({ art: { url } })) toast("Image saved.");
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="scene-editor"
      onDragOver={(e) => takesImage && e.preventDefault()}
      onDrop={(e) => {
        if (!takesImage) return;
        e.preventDefault();
        void onFile(e.dataTransfer.files[0]);
      }}
    >
      <div className="scene-editor-preview" aria-hidden={scene.kind !== "map"}>
        {scene.kind === "map" ? (
          <div className="map-editor-cta">
            <p className="note">{scene.map?.pins.length ?? 0} locations.</p>
            <button className="btn primary" type="button" onClick={() => openMap(scene.id)}>
              Open the map editor
            </button>
          </div>
        ) : (
          <SceneView scene={{ ...scene, map: undefined }} gated={gated} emptyHint="No image yet" />
        )}
      </div>
      <div className="form">
        <Field label="Name in your list" value={scene.label} onCommit={(v) => patch({ label: v })} />
        <div className="inline">
          <label>
            Kind
            <select className="fld" value={scene.kind} onChange={(e) => patch({ kind: e.target.value as SceneKind })}>
              {KINDS.map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label>
            Hotkey
            <select className="fld" value={scene.hotkey ?? ""} onChange={(e) => patch({ hotkey: e.target.value === "" ? null : Number(e.target.value) })}>
              <option value="">None</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((k) => (
                <option key={k} value={k}>
                  {k}
                  {usedKeys.has(k) ? ` (now ${usedKeys.get(k)})` : ""}
                </option>
              ))}
            </select>
          </label>
          <Check checked={scene.reveal} onChange={(v) => patch({ reveal: v })}>
            Reveal (hidden from the TV until shown)
          </Check>
        </div>

        {scene.kind === "portrait" ? (
          <div className="inline">
            <Field label="Name on the TV" value={scene.name ?? ""} onCommit={(v) => patch({ name: v })} />
            <Field label="Title under it" value={scene.title ?? ""} onCommit={(v) => patch({ title: v })} />
            <Check checked={!!scene.known} onChange={(v) => run({ type: "scene.known", sceneId: scene.id, known: v })}>
              Players have met them <span className="note">(suggested as a Chronicle tag; ticks itself once shown on the TV)</span>
            </Check>
          </div>
        ) : null}

        {takesImage ? (
          <div className="inline">
            <button className="btn" type="button" disabled={busy} onClick={() => file.current?.click()}>
              {busy ? "Uploading…" : scene.art?.url || scene.art?.builtin ? "Replace image" : "Upload image"}
            </button>
            {scene.art?.url || scene.art?.builtin ? (
              <button className="btn small" type="button" onClick={() => patch({ art: {} })}>
                Remove image
              </button>
            ) : null}
            <span className="note">or drop an image here. Maps from the settlement generator work too (download the .jpg).{scene.kind === "map" ? " Pins keep their spot on a new image." : ""}</span>
            <input ref={file} type="file" accept="image/*" hidden onChange={(e) => void onFile(e.target.files?.[0])} />
          </div>
        ) : null}

        <Field label="Describe the picture (for screen readers)" value={scene.alt ?? ""} onCommit={(v) => patch({ alt: v })} />
        <Field label="DM note (only you see this)" value={scene.dmNote ?? ""} multiline onCommit={(v) => patch({ dmNote: v })} />
        <button
          className="btn small danger"
          type="button"
          onClick={() => {
            if (confirm(`Delete the scene “${scene.label}”?`)) void run({ type: "scene.remove", sceneId: scene.id }, "Scene deleted.");
          }}
        >
          Delete scene
        </button>
      </div>
    </div>
  );
}
