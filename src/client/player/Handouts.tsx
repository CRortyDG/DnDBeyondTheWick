"use client";

// Handouts in Discover: every letter, notice or drawing the party has been shown
// on the TV, to reread any time. The list is small cards; one opens full width,
// drawn on the same paper as the TV's.

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { PhoneHandout } from "@/shared/projection";
import { HandoutPaper } from "../scenes/HandoutSheet";
import { ArtumNotice } from "../scenes/ArtumNotice";
import { Stage } from "../ui/Stage";
import { artSrc } from "../ui/SceneView";

/** The first words of a handout, for its card. */
function firstWords(h: PhoneHandout): string {
  const body = h.sheet?.body.replace(/[*_]/g, "").replace(/\s+/g, " ").trim() ?? "";
  return body.length > 90 ? `${body.slice(0, 88).trimEnd()}…` : body;
}

export function handoutMatches(h: PhoneHandout, needle: string): boolean {
  if (!needle) return true;
  return [h.label, h.alt, h.sheet?.title, h.sheet?.body, h.sheet?.sign].some((t) => t?.toLowerCase().includes(needle));
}

export function HandoutList({ list, isNew, onOpen }: { list: PhoneHandout[]; isNew: (h: PhoneHandout) => boolean; onOpen: (id: string) => void }) {
  if (!list.length) return null;
  return (
    <section className="discovery pl-discovery" aria-label="Handouts">
      <div className="pl-sec-head">
        <h2>Handouts</h2>
        <span>{list.length === 1 ? "1 to reread" : `${list.length} to reread`}</span>
      </div>
      <ul className="people-grid">
        {list.map((h) => {
          const src = artSrc(h.art);
          const words = firstWords(h);
          const fresh = isNew(h);
          return (
            <li key={h.sceneId}>
              <button type="button" className="person-card handout-card" onClick={() => onOpen(h.sceneId)} aria-label={`${h.label}${fresh ? ", new" : ""}`}>
                <span className={`handout-thumb paper-${h.sheet?.paper ?? "parchment"}`} aria-hidden="true">
                  {src ? <img src={src} alt="" loading="lazy" /> : <span className="handout-thumb-lines" />}
                </span>
                <span className="person-card-text">
                  <span className="person-name">
                    {h.label}
                    {fresh ? <span className="badge person-new">new</span> : null}
                  </span>
                  {words ? <span className="person-title">{words}</span> : h.alt ? <span className="person-title">{h.alt}</span> : null}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** The paper, scaled down to the phone's width (it's drawn 560 wide). */
function FitPaper({ h }: { h: PhoneHandout }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState<{ scale: number; height: number } | null>(null);
  useLayoutEffect(() => {
    const o = outer.current;
    const i = inner.current;
    if (!o || !i) return;
    const measure = () => {
      const scale = Math.min(1.4, o.clientWidth / 560);
      setFit({ scale, height: i.offsetHeight * scale });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(o);
    ro.observe(i);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={outer} className="handout-read-fit" style={{ height: fit?.height }}>
      <div ref={inner} style={{ width: 560, transform: `scale(${fit?.scale ?? 1})`, transformOrigin: "top left", visibility: fit ? "visible" : "hidden" }}>
        <HandoutPaper sheet={h.sheet!} image={artSrc(h.art)} alt={h.alt} />
      </div>
    </div>
  );
}

export function HandoutPage({ h, onBack }: { h: PhoneHandout; onBack: () => void }) {
  useEffect(() => {
    window.scrollTo?.({ top: 0 });
  }, [h.sceneId]);
  const src = artSrc(h.art);
  return (
    <section className="box person-page handout-read" aria-label={h.label}>
      <button type="button" className="pl-back" onClick={onBack}>
        &larr; Everything
      </button>
      {/* The paper carries its own title; a picture gets one above it. */}
      {h.sheet?.title.trim() ? null : <h2 className="person-page-name">{h.label}</h2>}
      {h.sheet ? (
        <FitPaper h={h} />
      ) : h.art.builtin === "artum-notice" ? (
        <div className="handout-read-notice">
          <Stage w={816} h={1056}>
            <ArtumNotice />
          </Stage>
        </div>
      ) : src ? (
        <a href={src} target="_blank" rel="noreferrer" className="handout-read-img">
          <img src={src} alt={h.alt ?? h.label} />
        </a>
      ) : (
        <p className="note">This handout has nothing on it yet.</p>
      )}
      {!h.sheet && src ? <p className="note">Tap the picture to open it full size.</p> : null}
    </section>
  );
}
