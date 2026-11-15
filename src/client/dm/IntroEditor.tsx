"use client";

import { useRef, useState } from "react";
import { CLIP_GIF_MAX, CLIP_VIDEO_MAX, genericArrivalPath, introKind, SLIDE_TEXT_MAX, SLIDES_MAX, WELCOME_MAX, type IntroKind } from "@/shared/arrival";
import type { IntroSlide } from "@/shared/types";
import { DownIcon, UpIcon } from "../ui/icons";
import { useDm } from "./context";
import { Field } from "./Field";
import { clipSeconds, firstFrame, mb, shrinkImage, uploadImage, uploadVideo } from "./upload";

const CHOICES: [IntroKind, string][] = [
  ["none", "No intro"],
  ["custom", "Your own"],
  ["builtin", "The boat (Candlefair)"],
];

/**
 * The Arrival tab's Intro card: what a player's link plays before their seat.
 * Nothing to program: an uploaded video or GIF, a few picture-and-text slides, or both.
 */
export function IntroEditor() {
  const { view, run, ident, toast } = useDm();
  const s = view.state;
  const a = s.arrival ?? {};
  const kind = introKind(s);
  const candlefair = s.town === undefined || s.town.trim() === "Candlefair";
  // The boat is Candlefair's story: only offered where it fits (or where it's already on).
  const choices = CHOICES.filter(([k]) => k !== "builtin" || candlefair || kind === "builtin");
  const slides = a.slides ?? [];
  const [progress, setProgress] = useState<number | null>(null);
  const [seconds, setSeconds] = useState<number | null>(null);
  const clipInput = useRef<HTMLInputElement>(null);

  const setSlides = (next: IntroSlide[], msg?: string) => run({ type: "arrival.slides", slides: next }, msg);

  const onClip = async (f: File | undefined) => {
    if (!f) return;
    const gif = f.type === "image/gif";
    try {
      if (gif && f.size > CLIP_GIF_MAX) throw new Error(`That GIF is ${mb(f.size)}. The limit is ${mb(CLIP_GIF_MAX)}. The same clip as an MP4 is usually a tenth of the size.`);
      setProgress(0);
      const secs = await clipSeconds(f);
      const url = gif ? await uploadImage(ident, f) : await uploadVideo(ident, f, CLIP_VIDEO_MAX, setProgress);
      // A still for the link preview. If this browser can't make one, the clip still works.
      const still = await firstFrame(f);
      const poster = still ? await uploadImage(ident, still).catch(() => undefined) : undefined;
      if (await run({ type: "arrival.clip", clip: { url, kind: gif ? "gif" : "video", bytes: f.size, ...(poster ? { poster } : {}) } }, "Intro clip saved.")) setSeconds(secs || null);
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e));
    } finally {
      setProgress(null);
      if (clipInput.current) clipInput.current.value = "";
    }
  };

  const preview = typeof window === "undefined" ? "" : window.location.origin + genericArrivalPath(s.id) + (genericArrivalPath(s.id).includes("?") ? "&" : "?") + "preview=1";

  return (
    <section className="box pg-card intro-editor" aria-labelledby="intro-h">
      <div className="intro-head">
        <h3 id="intro-h">Intro</h3>
        <div className="seg" role="group" aria-label="What the link plays first">
          {choices.map(([k, label]) => (
            <button
              key={k}
              type="button"
              className={`btn small${kind === k ? " on" : ""}`}
              aria-pressed={kind === k}
              onClick={() => kind !== k && run({ type: "arrival.settings", introKind: k }, k === "none" ? "Links open straight on the seat page." : k === "builtin" ? "The boat intro plays first." : "Your intro plays first.")}
            >
              {label}
            </button>
          ))}
        </div>
        <a className="btn small" href={preview} target="_blank" rel="noreferrer">
          Preview
        </a>
      </div>
      <p className="note">
        {kind === "none"
          ? "Each link opens straight on the seat page: pick a name, take a seat."
          : kind === "builtin"
            ? "The nine-panel boat trip to Candlefair, then the seat page."
            : slides.length || a.clip
              ? "Your clip plays first, then your slides, then the seat page. Players can skip and replay."
              : "Add a video or GIF, some slides, or both. Until then the link opens on the seat page."}
      </p>

      {kind === "custom" ? (
        <>
          <div className="intro-clip">
            {a.clip ? (
              <div className="intro-clip-preview">
                {a.clip.kind === "gif" ? <img src={a.clip.url} alt="" /> : <video src={a.clip.url} poster={a.clip.poster} controls playsInline preload="metadata" />}
              </div>
            ) : null}
            <div className="intro-clip-side">
              <strong>Video or GIF</strong>
              <span className="note">
                {a.clip ? `${a.clip.kind === "gif" ? "GIF" : "Video"}, ${mb(a.clip.bytes)}${seconds ? `, ${Math.round(seconds)} s` : ""}. ` : ""}
                MP4 plays on every phone. Up to {mb(CLIP_VIDEO_MAX)} (about a minute of 720p), GIFs up to {mb(CLIP_GIF_MAX)}.
              </span>
              {progress !== null ? (
                <progress className="intro-progress" value={progress} max={1} aria-label="Uploading" />
              ) : (
                <div className="inline">
                  <button className="btn" type="button" onClick={() => clipInput.current?.click()}>
                    {a.clip ? "Replace" : "Upload video or GIF"}
                  </button>
                  {a.clip ? (
                    <button className="btn small" type="button" onClick={() => run({ type: "arrival.clip", clip: null }, "Clip removed.")}>
                      Remove
                    </button>
                  ) : null}
                </div>
              )}
              <input ref={clipInput} type="file" accept="video/mp4,video/webm,video/quicktime,image/gif" hidden onChange={(e) => void onClip(e.target.files?.[0])} />
            </div>
          </div>

          <div className="intro-slides">
            <strong>Slides</strong>
            <span className="note">A picture and a line or two each. Players tap through them after the clip.</span>
            <ol className="intro-slide-list">
              {slides.map((sl, i) => (
                <SlideRow
                  key={sl.id}
                  slide={sl}
                  n={i + 1}
                  first={i === 0}
                  last={i === slides.length - 1}
                  onChange={(next) => setSlides(slides.map((x) => (x.id === sl.id ? next : x)))}
                  onMove={(d) => {
                    const j = i + d;
                    const out = [...slides];
                    [out[i], out[j]] = [out[j], out[i]];
                    void setSlides(out);
                  }}
                  onDelete={() => setSlides(slides.filter((x) => x.id !== sl.id), "Slide deleted.")}
                />
              ))}
            </ol>
            {slides.length < SLIDES_MAX ? (
              <button className="btn small" type="button" onClick={() => setSlides([...slides, { id: `sl${Date.now().toString(36)}`, text: "" }])}>
                Add a slide
              </button>
            ) : (
              <span className="note">That&rsquo;s the most slides ({SLIDES_MAX}).</span>
            )}
          </div>
        </>
      ) : null}

      <Field label="Welcome line on the seat page (optional)" value={a.welcome ?? ""} placeholder={`Welcome to ${s.town?.trim() || "the table"}. Take a seat.`} onCommit={(v) => (v.length > WELCOME_MAX ? false : run({ type: "arrival.settings", welcome: v }, "Saved."))} />
    </section>
  );
}

function SlideRow({ slide, n, first, last, onChange, onMove, onDelete }: { slide: IntroSlide; n: number; first: boolean; last: boolean; onChange: (s: IntroSlide) => unknown; onMove: (d: 1 | -1) => void; onDelete: () => void }) {
  const { ident, toast } = useDm();
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const onFile = async (f: File | undefined) => {
    if (!f) return;
    setBusy(true);
    try {
      const url = await uploadImage(ident, await shrinkImage(f));
      onChange({ ...slide, image: url });
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };
  return (
    <li
      className="intro-slide"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        void onFile(e.dataTransfer.files[0]);
      }}
    >
      <button type="button" className="intro-slide-thumb" onClick={() => input.current?.click()} disabled={busy} aria-label={slide.image ? `Replace slide ${n}'s picture` : `Add a picture to slide ${n}`}>
        {busy ? <span>Uploading&hellip;</span> : slide.image ? <img src={slide.image} alt="" /> : <span>+ Picture</span>}
      </button>
      <input ref={input} type="file" accept="image/*" hidden onChange={(e) => void onFile(e.target.files?.[0])} />
      <div className="intro-slide-text">
        <Field label={`Slide ${n}`} value={slide.text} multiline placeholder="Four days out of port, the fog lifts…" onCommit={(v) => (v.length > SLIDE_TEXT_MAX ? false : onChange({ ...slide, text: v }))} />
      </div>
      <div className="intro-slide-tools">
        <button className="btn icon small" type="button" disabled={first} onClick={() => onMove(-1)} aria-label={`Move slide ${n} up`}>
          <UpIcon />
        </button>
        <button className="btn icon small" type="button" disabled={last} onClick={() => onMove(1)} aria-label={`Move slide ${n} down`}>
          <DownIcon />
        </button>
        {slide.image ? (
          <button className="btn small" type="button" onClick={() => onChange({ id: slide.id, text: slide.text })}>
            No picture
          </button>
        ) : null}
        <button className="btn small danger" type="button" onClick={onDelete}>
          Delete
        </button>
      </div>
    </li>
  );
}
