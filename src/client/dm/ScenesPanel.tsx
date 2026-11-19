"use client";

import { ask } from "./ask";
import { originOf } from "@/shared/presets";
import { useEffect, useRef, useState } from "react";
import type { Scene, SceneKind } from "@/shared/types";
import { SceneView } from "../ui/SceneView";
import { DownIcon, UpIcon } from "../ui/icons";
import { useDm } from "./context";
import { Drawer } from "./Drawer";
import { MenuItem, RowMenu } from "./RowMenu";
import { Field } from "./Field";
import { Check } from "./Check";
import { mb, uploadImage, uploadVideo } from "./upload";
import { CLIP_VIDEO_MAX } from "@/shared/arrival";
import { ShowControls } from "./QuickBar";
import { PageHead } from "./PageHead";
import { PlusIcon } from "./navIcons";
import { isProp, pictureOwner, refForScene, sceneSlug } from "@/shared/assets";
import { DEFAULT_SHEET, emptyHandout, HANDOUT_BODY_MAX, HANDOUT_LONG, type HandoutSheet } from "@/shared/handout";
import { FONT_IDS, FONT_LABELS, isFlyerHandout, PAPERS } from "@/shared/board";

const KINDS: [SceneKind, string][] = [
  ["map", "Map with numbered locations"],
  ["image", "Image"],
  ["handout", "Handout on paper"],
  ["notice", "Notice board"],
  ["black", "Black screen"],
  ["table", "The Table (Arrival seats)"],
  ["video", "Video clip (plays once, holds the last frame)"],
  ["stinger", "Episode one stinger (animated)"],
];
const PORTRAIT: [SceneKind, string] = ["portrait", "Picture card (name and title)"];

/** Maps & props: the pictures the TV shows that aren't someone's (people's pictures live with them in Discovery). */
export function ScenesPanel() {
  const { view, run, openMap, openTable } = useDm();
  const s = view.state;
  // Only a Candlefair campaign is offered Candlefair's maps.
  const hasSeedMaps = originOf(s).kind !== "candlefair" || s.scenes.some((x) => x.kind === "map" && x.label === "Candlefair map") && s.scenes.some((x) => x.kind === "map" && x.label === "Sword Coast map");
  const [openId, setOpenId] = useState<string | null>(null);
  const [newKind, setNewKind] = useState<SceneKind>("image");
  const [newLabel, setNewLabel] = useState("");
  const [adding, setAdding] = useState(false);
  const pictures = s.scenes.filter((x) => pictureOwner(s, x)).length;
  const sections: [string, Scene[]][] = [
    ["Maps", s.scenes.filter((x) => x.kind === "map")],
    ["Props", s.scenes.filter((x) => isProp(s, x))],
    ["Screens", s.scenes.filter((x) => x.kind !== "map" && !isProp(s, x) && !pictureOwner(s, x))],
  ];

  const liveScene = s.scenes.find((x) => x.id === s.live.sceneId);

  return (
    <div className="scenes-panel pg">
      <PageHead
        title="Maps & props"
        sub="Maps, handouts, images and screens the TV can show."
        help={
          <p>
            Everything here has a <b>Show</b> button and can sit on a number key. People, places, shops and monsters are shown from Discovery
            {pictures ? ` (${pictures} picture${pictures === 1 ? "" : "s"} live there with their people)` : ""}. Reveal props never reach the TV until you show them. Images you upload are stored online, so they show on every screen.
          </p>
        }
        actions={
          <button className="btn primary" type="button" onClick={() => setAdding((a) => !a)} aria-expanded={adding}>
            <PlusIcon size={16} /> Map or prop
          </button>
        }
        stats={[
          { label: "On the TV", value: liveScene?.label ?? "Something else", tone: "gold" },
          { label: "Maps", value: sections[0][1].length },
          { label: "Props", value: sections[1][1].length },
          { label: "Screens", value: sections[2][1].length, tone: "muted" },
        ]}
      />
      {adding ? (
        <form
          className="pg-inline-form wide"
          onSubmit={async (e) => {
            e.preventDefault();
            if (await run({ type: "scene.add", kind: newKind, label: newLabel || KINDS.find((k) => k[0] === newKind)![1] }, "Added, on the first free number key.")) {
              setNewLabel("");
              setAdding(false);
            }
          }}
        >
          <select className="fld" value={newKind} onChange={(e) => setNewKind(e.target.value as SceneKind)} aria-label="Kind">
            {KINDS.map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </select>
          <input className="fld" autoFocus value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Name in your list, e.g. The docks at dusk" aria-label="Name in your list" onKeyDown={(e) => e.key === "Escape" && setAdding(false)} />
          <button className="btn primary" type="submit">
            Add
          </button>
          <button className="btn ghost" type="button" onClick={() => setAdding(false)}>
            Cancel
          </button>
        </form>
      ) : null}
      {sections.map(([title, list]) =>
        list.length ? (
          <section key={title} className="assets-section">
            <h3 className="pg-section">
              {title} <span className="pg-count">{list.length}</span>
            </h3>
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
                        {emptyHandout(sc) ? (
                          <span className="tag warn" title="No words or picture yet: the TV would show a blank sheet.">
                            Empty sheet
                          </span>
                        ) : null}
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

    </div>
  );
}

function SceneEditor({ scene }: { scene: Scene }) {
  const { view, run, ident, toast, gated, openMap, openTable } = useDm();
  const [busy, setBusy] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const patch = (p: Partial<Scene>) => run({ type: "scene.update", sceneId: scene.id, patch: p });
  const takesImage = scene.kind !== "black" && scene.kind !== "table" && scene.kind !== "stinger" && !(scene.art?.builtin === "candlefair-board" || scene.art?.builtin === "artum-notice");

  const video = scene.kind === "video";
  const onFile = async (f: File | undefined) => {
    if (!f) return;
    setBusy(true);
    try {
      const url = video ? await uploadVideo(ident, f, CLIP_VIDEO_MAX) : await uploadImage(ident, f);
      if (await patch({ art: { url } })) toast(video ? "Video saved." : "Image saved.");
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

        {scene.kind === "handout" && isFlyerHandout(scene) ? (
          <p className="note">This is a job flyer up close, so players find it on their Jobs tab, not in Discover.</p>
        ) : scene.kind === "handout" ? (
          <Check checked={!!scene.known} onChange={(v) => run({ type: "scene.known", sceneId: scene.id, known: v })}>
            Players keep it in Discover <span className="note">(ticks itself once shown on the TV; untick to take it off their phones)</span>
          </Check>
        ) : null}

        {scene.kind === "handout" && scene.art?.builtin !== "artum-notice" ? <HandoutWords scene={scene} /> : null}

        {takesImage ? (
          <div className="inline">
            <button className="btn" type="button" disabled={busy} onClick={() => file.current?.click()}>
              {busy ? "Uploading…" : scene.art?.url || scene.art?.builtin ? (video ? "Replace video" : "Replace image") : video ? "Upload video" : "Upload image"}
            </button>
            {scene.art?.url || scene.art?.builtin ? (
              <button className="btn small" type="button" onClick={() => patch({ art: {} })}>
                {video ? "Remove video" : "Remove image"}
              </button>
            ) : null}
            {video ? (
              <span className="note">or drop one here. MP4 plays on every TV browser. Up to {mb(CLIP_VIDEO_MAX)}. Put it on a beat with show: and it plays from the start each time.</span>
            ) : (
              <span className="note">or drop an image here. Maps from the settlement generator work too (download the .jpg).{scene.kind === "map" ? " Pins keep their spot on a new image." : ""}</span>
            )}
            <input ref={file} type="file" accept={video ? "video/mp4,video/webm,video/quicktime" : "image/*"} hidden onChange={(e) => void onFile(e.target.files?.[0])} />
          </div>
        ) : null}

        <Field label="Describe the picture (for screen readers)" value={scene.alt ?? ""} onCommit={(v) => patch({ alt: v })} />
        <Field label="DM note (only you see this)" value={scene.dmNote ?? ""} multiline onCommit={(v) => patch({ dmNote: v })} />
        <button
          className="btn small danger"
          type="button"
          onClick={() => {
            void ask(`Delete the scene “${scene.label}”?`).then((ok) => {
              if (ok) void run({ type: "scene.remove", sceneId: scene.id }, "Scene deleted.");
            });
          }}
        >
          Delete scene
        </button>
      </div>
    </div>
  );
}

/** Paper for handouts: the plain papers from the notice board (the four job papers draw their own bounty layout). */
const HANDOUT_PAPERS = PAPERS.filter((p) => !p.job);

/** A handout's words: title, text with light formatting, signature, paper and writing. */
function HandoutWords({ scene }: { scene: Scene }) {
  const { run } = useDm();
  const w: HandoutSheet = scene.sheet ?? DEFAULT_SHEET;
  const save = (p: Partial<HandoutSheet>) => run({ type: "scene.update", sceneId: scene.id, patch: { sheet: { ...w, ...p } } });
  const [body, setBody] = useState(w.body);
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    if (!editing) setBody(w.body);
  }, [w.body, editing]);
  const empty = emptyHandout(scene);
  return (
    <fieldset className="handout-words">
      <legend>Words on the paper</legend>
      {empty ? <p className="note warn-note">This handout has no words or picture yet, so the TV would show a blank sheet. Write something below or upload an image.</p> : null}
      <Field label="Title" value={w.title} placeholder="A letter, sealed in green wax" onCommit={(v) => save({ title: v })} />
      <label>
        Text
        <textarea
          className="fld handout-text"
          rows={8}
          maxLength={HANDOUT_BODY_MAX}
          value={body}
          placeholder={"Friends,\n\nCome to the lighthouse at **midnight**. Tell *no one*.\n\n-- A friend"}
          onFocus={() => setEditing(true)}
          onChange={(e) => setBody(e.target.value)}
          onBlur={() => {
            setEditing(false);
            if (body !== w.body) void save({ body });
          }}
        />
      </label>
      <p className="note">
        A blank line starts a new paragraph · <code>**bold**</code> · <code>*italic*</code> · a line starting with <code>--</code> is signed on the right.
        {body.length > HANDOUT_LONG ? <b> This is long: it will come out small on the TV. Two handouts may read better.</b> : null}
      </p>
      <Field label="Signed" value={w.sign} placeholder="Lady Vess" onCommit={(v) => save({ sign: v })} />
      <div className="inline">
        <label>
          Paper
          <select className="fld" value={w.paper} onChange={(e) => save({ paper: e.target.value as HandoutSheet["paper"] })}>
            {HANDOUT_PAPERS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Writing
          <select className="fld" value={w.font} onChange={(e) => save({ font: e.target.value as HandoutSheet["font"] })}>
            {FONT_IDS.map((f) => (
              <option key={f} value={f}>
                {FONT_LABELS[f]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Title ink
          <select className="fld" value={w.ink ?? ""} onChange={(e) => save({ ink: (e.target.value || undefined) as HandoutSheet["ink"] })}>
            <option value="">The paper&rsquo;s ink</option>
            <option value="red">Red</option>
            <option value="blue">Blue</option>
            <option value="gold">Gold</option>
          </select>
        </label>
      </div>
    </fieldset>
  );
}
