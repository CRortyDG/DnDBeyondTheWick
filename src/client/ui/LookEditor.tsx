"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  COLOR_LABELS,
  LAYERS,
  LOOK_GROUPS,
  LOOK_DETAILS,
  LOOK_DETAIL_DEFAULT,
  LOOK_STYLES,
  lookDetailOf,
  LOOSE_COLORS,
  type Look,
  type LookColorKey,
  type LookGroup,
  type LookPartKey,
  lookCount,
  lookKey,
  lookStyleOf,
  lookValue,
  randomizeGroup,
  randomLook,
  SWATCHES,
} from "@/shared/look";
import { forcedLookStyle, isSmooth, lookPng, lookUrl, savePicture } from "./PixelLook";

/**
 * The character maker: a big pixel-art preview, a tab per part of the body,
 * arrows to flip through each layer, colour swatches, and dice to randomize
 * everything or one tab.
 */
export function LookEditor({
  initial,
  title = "Your look",
  name,
  onSave,
  onClose,
  onRemove,
  tableStyle = true,
}: {
  initial?: Look | null;
  title?: string;
  /** Used for the downloaded file's name. */
  name?: string;
  /** Resolves to an error message, or null when saved. */
  onSave: (look: Look) => Promise<string | null>;
  onClose: () => void;
  onRemove?: () => Promise<string | null>;
  /** Mention the DM's table-wide style, if one is set (players' own looks; not NPC portraits). */
  tableStyle?: boolean;
}) {
  const [look, setLook] = useState<Look>(() => initial ?? randomLook());
  const [past, setPast] = useState<Look[]>([]);
  const [tab, setTab] = useState<LookGroup>("body");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const change = (next: Look) => {
    setPast((p) => [...p.slice(-30), look]);
    setLook(next);
  };
  const step = (k: LookPartKey, d: number) => {
    const n = lookCount(k);
    change({ ...look, [k]: (lookValue(look, k) + d + n) % n });
  };
  const save = async () => {
    setBusy(true);
    const e = await onSave(look);
    setBusy(false);
    if (e) setErr(e);
    else onClose();
  };
  // The download is made ahead of the tap, so phones still count the save as the tap's own action.
  const [png, setPng] = useState("");
  const key = lookKey(look);
  useEffect(() => {
    let live = true;
    setPng("");
    const t = setTimeout(() => {
      lookPng(look, 4)
        .then((u) => live && setPng(u))
        .catch(() => {});
    }, 250);
    return () => {
      live = false;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const download = () => {
    if (png) void savePicture(png, `${(name || "character").replace(/[^\w-]+/g, "-").toLowerCase()}.png`);
  };
  const style = look.style ?? 0;
  const detail = lookDetailOf(look);
  const forced = tableStyle ? forcedLookStyle() : null;

  const layers = LAYERS.filter((l) => l.group === tab);
  const loose = LOOSE_COLORS.filter((c) => c.group === tab);

  // On the page body, so no card or drawer around the button can restyle it.
  return createPortal(
    <div className="look-ed" role="dialog" aria-modal="true" aria-label={title}>
      <header className="look-ed-top">
        <button type="button" className="look-ed-x" onClick={onClose} aria-label="Close without saving">
          ✕
        </button>
        <h2>{title}</h2>
        <button type="button" className="look-ed-save" onClick={save} disabled={busy}>
          {busy ? "Saving…" : "Save"}
        </button>
      </header>
      <div className="look-ed-body">
        <div className="look-ed-stage">
          <img className={`pixel-look look-ed-preview${isSmooth(look, true) ? " drawn" : ""}`} src={lookUrl(look, false, true)} alt="Your character" />
          <div className="look-ed-styles" role="radiogroup" aria-label="Art style">
            {LOOK_STYLES.map((st, i) => (
              <button key={st.id} type="button" role="radio" aria-checked={style === i} className={style === i ? "on" : ""} title={st.hint} onClick={() => change({ ...look, style: i || undefined })}>
                {st.label}
              </button>
            ))}
          </div>
          {lookStyleOf(look) === "pixel" ? (
            <div className="look-ed-styles look-ed-detail" role="radiogroup" aria-label="Pixel detail">
              {LOOK_DETAILS.map((d, i) => (
                <button
                  key={d.id}
                  type="button"
                  role="radio"
                  aria-checked={detail === i}
                  className={detail === i ? "on" : ""}
                  title={d.hint}
                  onClick={() => {
                    const { detail: _old, ...rest } = look;
                    change(i === LOOK_DETAIL_DEFAULT ? rest : { ...rest, detail: i });
                  }}
                >
                  {d.label}
                </button>
              ))}
            </div>
          ) : null}
          {forced !== null && forced !== style ? <p className="look-ed-note">Your DM shows everyone at the table in {LOOK_STYLES[forced]?.label ?? "one"} style for now. Your pick is kept for when that's off.</p> : null}
          <div className="look-ed-dice">
            <button type="button" className="look-ed-btn" onClick={() => change({ ...randomLook(), ...(look.style ? { style: look.style } : {}), ...(look.detail !== undefined ? { detail: look.detail } : {}) })}>
              🎲 Surprise me
            </button>
            <button type="button" className="look-ed-btn" onClick={() => change(randomizeGroup(look, tab))}>
              🎲 Just {LOOK_GROUPS.find((g) => g.id === tab)!.label.toLowerCase()}
            </button>
            <button
              type="button"
              className="look-ed-btn"
              disabled={!past.length}
              onClick={() => {
                setLook(past[past.length - 1]);
                setPast((p) => p.slice(0, -1));
              }}
            >
              ↶ Undo
            </button>
          </div>
          {err ? (
            <p className="look-ed-err" role="alert">
              {err}
            </p>
          ) : null}
        </div>
        <div className="look-ed-panel">
          <div className="look-ed-tabs" role="tablist">
            {LOOK_GROUPS.map((g) => (
              <button key={g.id} type="button" role="tab" aria-selected={tab === g.id} className={tab === g.id ? "on" : ""} onClick={() => setTab(g.id)}>
                {g.label}
              </button>
            ))}
          </div>
          <div className="look-ed-rows" role="tabpanel">
            {layers.map((l) => (
              <div className="look-ed-row" key={l.key}>
                <div className="look-ed-pick">
                  <span className="look-ed-label">{l.label}</span>
                  <button type="button" className="look-ed-arrow" onClick={() => step(l.key, -1)} aria-label={`Previous ${l.label.toLowerCase()}`}>
                    ‹
                  </button>
                  <span className="look-ed-name" aria-live="polite">
                    {l.options[lookValue(look, l.key)]}
                  </span>
                  <button type="button" className="look-ed-arrow" onClick={() => step(l.key, 1)} aria-label={`Next ${l.label.toLowerCase()}`}>
                    ›
                  </button>
                </div>
                {l.color ? <Swatches k={l.color} look={look} onPick={(i) => change({ ...look, [l.color!]: i })} /> : null}
              </div>
            ))}
            {loose.map((c) => (
              <div className="look-ed-row" key={c.key}>
                <span className="look-ed-label">{COLOR_LABELS[c.key]}</span>
                <Swatches k={c.key} look={look} onPick={(i) => change({ ...look, [c.key]: i })} />
              </div>
            ))}
          </div>
          <div className="look-ed-foot">
            <button type="button" className="look-ed-btn" onClick={download} disabled={!png}>
              Download picture
            </button>
            {onRemove ? (
              <button
                type="button"
                className="look-ed-btn quiet"
                onClick={async () => {
                  const e = await onRemove();
                  if (e) setErr(e);
                  else onClose();
                }}
              >
                Remove look
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function Swatches({ k, look, onPick }: { k: LookColorKey; look: Look; onPick: (i: number) => void }) {
  const cur = lookValue(look, k);
  return (
    <div className="look-ed-swatches" role="group" aria-label={COLOR_LABELS[k]}>
      {SWATCHES[k].map((s, i) => (
        <button key={s.name + i} type="button" className={i === cur ? "on" : ""} style={{ background: s.hex }} title={s.name} aria-label={s.name} aria-pressed={i === cur} onClick={() => onPick(i)} />
      ))}
    </div>
  );
}
