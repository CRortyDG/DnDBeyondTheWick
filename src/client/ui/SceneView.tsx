"use client";

import type { PublicMap } from "@/shared/projection";
import type { Art, SceneKind } from "@/shared/types";
import { MapView } from "./MapView";
import { ArtumNotice } from "../scenes/ArtumNotice";
import { NoticeBoard } from "../scenes/NoticeBoard";
import { Pinned, type BoardView } from "../scenes/Board";
import { Stage } from "./Stage";
import { TableScene } from "./TableScene";
import { Stinger } from "../scenes/Stinger";
import type { TableView } from "@/shared/arrival";

export interface RenderableScene {
  id: string;
  kind: SceneKind;
  art?: Art;
  name?: string;
  title?: string;
  alt?: string;
  /** Map scenes: what the TV sees (discovered pins only). */
  map?: PublicMap;
}

const PUBLIC_ART = new Set(["artum", "mags-wick", "chef"]);

/** Where to load a scene's picture from. Gated art arrives as a ready URL (or, for the DM, a blob URL). */
export function artSrc(art: Art | undefined, gated?: Record<string, string>): string | null {
  if (!art) return null;
  if (art.url) return art.url;
  if (art.builtin && PUBLIC_ART.has(art.builtin)) return `/art/${art.builtin}.svg`;
  if (art.builtin && gated?.[art.builtin]) return gated[art.builtin];
  return null;
}

/** One scene, filling its parent. */
export function SceneView({ scene, gated, emptyHint, table, board }: { scene: RenderableScene; gated?: Record<string, string>; emptyHint?: string; table?: TableView; board?: BoardView }) {
  const src = artSrc(scene.art, gated);

  if (scene.kind === "black") return <div className="scene-fill scene-black" />;

  if (scene.kind === "stinger") return <Stinger />;

  if (scene.kind === "table") return <TableScene table={table} />;

  if (scene.kind === "map") {
    return <MapView src={src ?? undefined} alt={scene.alt} map={scene.map ?? { pins: [], legend: { on: false, style: "names" }, sealScale: 1 }} emptyHint={emptyHint} />;
  }

  if (scene.kind === "notice") {
    return (
      <div className="scene-fill scene-backdrop">
        <Stage w={1920} h={1080}>
          {scene.art?.builtin === "candlefair-board" || !src ? (
            <NoticeBoard board={board} />
          ) : (
            <>
              <img className="scene-img" src={src} alt={scene.alt ?? ""} />
              <div style={{ position: "absolute", inset: 0 }}>
                <Pinned board={board} />
              </div>
            </>
          )}
        </Stage>
      </div>
    );
  }

  if (scene.kind === "portrait") {
    return (
      <div className="scene-fill scene-backdrop">
        <Stage w={1920} h={1080}>
          <div className="portrait">
            {src ? <img className="portrait-art" src={src} alt={scene.alt ?? `Portrait of ${scene.name ?? ""}`} /> : <div className="portrait-art portrait-blank" />}
            <div className="caption">
              <div className="caption-name">{scene.name}</div>
              {scene.title ? <div className="caption-title">{scene.title}</div> : null}
            </div>
          </div>
        </Stage>
      </div>
    );
  }

  if (scene.kind === "handout") {
    if (scene.art?.builtin === "artum-notice") {
      return (
        <div className="scene-fill scene-backdrop">
          <Stage w={816} h={1056}>
            <ArtumNotice />
          </Stage>
        </div>
      );
    }
    return (
      <div className="scene-fill scene-backdrop">
        <Stage w={1920} h={1080}>
          <div className="handout">
            <div className="handout-paper">{src ? <img src={src} alt={scene.alt ?? ""} /> : null}</div>
          </div>
        </Stage>
      </div>
    );
  }

  // image
  return (
    <div className="scene-fill scene-backdrop">
      <Stage w={1920} h={1080}>
        <div className="slot">
          {src ? (
            <img className="scene-img" src={src} alt={scene.alt ?? ""} />
          ) : (
            <div className="slot-empty">
              <b>Candlefair</b>
              {emptyHint ? <span>{emptyHint}</span> : null}
            </div>
          )}
        </div>
      </Stage>
    </div>
  );
}
