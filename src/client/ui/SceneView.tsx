"use client";

import type { Art, SceneKind } from "@/shared/types";
import { ArtumNotice } from "../scenes/ArtumNotice";
import { NoticeBoard } from "../scenes/NoticeBoard";
import { Stage } from "./Stage";

export interface RenderableScene {
  id: string;
  kind: SceneKind;
  art?: Art;
  name?: string;
  title?: string;
  alt?: string;
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
export function SceneView({ scene, gated, emptyHint }: { scene: RenderableScene; gated?: Record<string, string>; emptyHint?: string }) {
  const src = artSrc(scene.art, gated);

  if (scene.kind === "black") return <div className="scene-fill scene-black" />;

  if (scene.kind === "notice") {
    return (
      <div className="scene-fill scene-backdrop">
        <Stage w={1920} h={1080}>
          {scene.art?.builtin === "candlefair-board" || !src ? <NoticeBoard /> : <img className="scene-img" src={src} alt={scene.alt ?? ""} />}
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
