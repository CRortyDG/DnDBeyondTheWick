"use client";

import { useRef, useState } from "react";
import type { Scene, SceneKind } from "@/shared/types";
import { SceneView } from "../ui/SceneView";
import { DownIcon, UpIcon } from "../ui/icons";
import { useDm } from "./context";
import { Drawer } from "./Drawer";
import { MenuItem, RowMenu } from "./RowMenu";
import { Field } from "./Field";
import { Check } from "./Check";
import { uploadImage } from "./upload";
import { ShowControls } from "./QuickBar";
import { isProp, pictureOwner, refForScene, sceneSlug } from "@/shared/assets";

const KINDS: [SceneKind, string][] = [
  ["map", "Map with numbered locations"],
  ["image", "Image"],
  ["handout", "Handout on paper"],
  ["notice", "Notice board"],
  ["black", "Black screen"],
  ["table", "The Table (Arrival seats)"],
  ["stinger", "Episode one stinger (animated)"],
];
const PORTRAIT: [SceneKind, string] = ["portrait", "Picture card (name and title)"];

/** Maps & props: the pictures the TV shows that aren't someone's (people's pictures live with them in Discovery). */
export function ScenesPanel() {
  const { view, run, openMap, openTable } = useDm();
  const s = view.state;
  const hasSeedMaps = s.scenes.some((x) => x.kind === "map" && x.label === "Candlefair map") && s.scenes.some((x) => x.kind === "map" && x.label === "Sword Coast map");
  const [openId, setOpenId] = useState<string | null>(null);
  const [newKind, setNewKind] = useState<SceneKind>("image");
  const [newLabel, setNewLabel] = useState("");
  const pictures = s.scenes.filter((x) => pictureOwner(s, x)).length;
  const sections: [string, Scene[]][] = [
    ["Maps", s.scenes.filter((x) => x.kind === "map")],
    ["Props", s.scenes.filter((x) => isProp(s, x))],
    ["Screens", s.scenes.filter((x) => x.kind !== "map" && !isProp(s, x) && !pictureOwner(s, x))],
  ];

  return (
    <div className="scenes-panel">
      <p className="note">
        Everything here has a <b>Show</b> button and can sit on a number key. People, places, shops and monsters are shown from Discovery
        {pictures ? ` (${pictures} picture${pictures === 1 ? "" : "s"} live there with their people)` : ""}. Reveal props never reach the TV until you show them. Images you upload are stored online, so they show on every screen.
      </p>
      {sections.map(([title, list]) =>
        list.length ? (
          <section key={title} className="assets-section">
            <h3>{title}</h3>
            <ol className="scene-list">
              {list.map((sc) => {
                const i = s.scenes.indexOf(sc);
                const ref = refForScene(s, sc);
                return (
                  <li key={sc.id} className={`scene-item list-row${sc.id === s.live.sceneId ? " live" : ""}${openId === sc.id ? " selected" : ""}`}>
                    <div className="scene-row">
                      <button type="button" className="row-main" aria-expanded={openId === sc.id} onClick={() => setOpenId(openId === sc.id ? null : sc.id)} title={`Edit ${sc.label}`}>
                        <span className="row-title">{sc.label}</span>
                        <span className="row-sub">
                          <code className="ref-code">{ref}</code>
                        </span>
                      </button>
                      <span className="row-meta">
                        {sc.id === s.live.sceneId ? <span className="tag live">On the TV</span> : null}
                        {sc.reveal ? <span className="tag wax">reveal</span> : null}
                        {sc.kind === "map" ? <span className="tag">{sc.map?.pins.length ?? 0} locations</span> : null}
                      </span>
                      {sc.kind === "map" ? (
                        <>
                          <button className="btn small" type="button" onClick={() => openMap(sc.id)}>
                            Pins
                          </button>
                          <button className="btn small" type="button" onClick={() => openTable(sc.id)} title="Tokens, grid and fog. Set them up ahead of time; nothing shows until you put the map on the TV.">
                            Tokens &amp; fog
                          </button>
                        </>
                      ) : null}
                      <ShowControls refName={ref} label={sc.label} />
                      <RowMenu label={sc.label}>
                        <MenuItem onClick={() => setOpenId(openId === sc.id ? null : sc.id)}>{openId === sc.id ? "Close the editor" : "Edit"}</MenuItem>
                        <MenuItem disabled={i === 0} onClick={() => run({ type: "scene.move", sceneId: sc.id, dir: -1 })}>
                          Move up
                        </MenuItem>
                        <MenuItem disabled={i === s.scenes.length - 1} onClick={() => run({ type: "scene.move", sceneId: sc.id, dir: 1 })}>
                          Move down
                        </MenuItem>
                      </RowMenu>
                    </div>
                    {openId === sc.id ? (
                      <Drawer title={sc.label} subtitle={ref} onClose={() => setOpenId(null)}>
                        <SceneEditor scene={sc} />
                      </Drawer>
                    ) : null}
                  </li>
                );
              })}
            </ol>
          </section>
        ) : null,
      )}

      {!hasSeedMaps ? (
        <div className="box form">
          <h3>Maps</h3>
          <p className="note">
            Add the Candlefair map (8 locations, the first three discovered) and the Sword Coast map (5 locations). Your Town map scene becomes the Candlefair map and keeps its image and number key.
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
          if (await run({ type: "scene.add", kind: newKind, label: newLabel || KINDS.find((k) => k[0] === newKind)![1] }, "Added, on the first free number key.")) setNewLabel("");
        }}
      >
        <h3>Add a map or prop</h3>
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
  const { view, run, ident, toast, gated, openMap, openTable } = useDm();
  const [busy, setBusy] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const patch = (p: Partial<Scene>) => run({ type: "scene.update", sceneId: scene.id, patch: p });
  const takesImage = scene.kind !== "black" && scene.kind !== "table" && scene.kind !== "stinger" && !(scene.art?.builtin === "candlefair-board" || scene.art?.builtin === "artum-notice");

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
            <button className="btn" type="button" onClick={() => openTable(scene.id)}>
              Tokens, grid &amp; fog
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
              {(scene.kind === "portrait" ? [...KINDS, PORTRAIT] : KINDS).map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <Field label="Run sheet name" value={sceneSlug(scene)} hint={refForScene(view.state, scene)} onCommit={(v) => patch({ slug: v })} />
          <Check checked={scene.reveal} onChange={(v) => patch({ reveal: v })}>
            Reveal (hidden from the TV until shown)
          </Check>
        </div>

        {scene.kind === "portrait" ? (
          <div className="inline">
            <Field label="Name on the TV" value={scene.name ?? ""} onCommit={(v) => patch({ name: v })} />
            <Field label="Title under it" value={scene.title ?? ""} onCommit={(v) => patch({ title: v })} />
            <Check checked={!!scene.known} onChange={(v) => run({ type: "scene.known", sceneId: scene.id, known: v })}>
              Players have met them <span className="note">(finds them in Discovery; ticks itself once shown on the TV)</span>
            </Check>
          </div>
        ) : null}

        {scene.kind === "map" ? (
          <Check checked={!!scene.known} onChange={(v) => run({ type: "scene.known", sceneId: scene.id, known: v })}>
            Players can open it on their phones <span className="note">(ticks itself once shown on the TV; hidden pins, hidden tokens and fog still apply)</span>
          </Check>
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
