"use client";

// The DM's quick access to everything the TV can show: a bar of 10 slots on
// the number keys, the "/" finder, and the Show + key controls that sit next
// to each person, place, map and prop. See src/shared/assets.ts for refs.

import { useEffect, useMemo, useRef, useState } from "react";
import { findAssets, freeQuickKey, liveRef, QUICK_KEYS, quickKeyOf, quickOf, resolveRef, type Asset } from "@/shared/assets";
import { useDm } from "./context";

const keyName = (k: number) => String(k);

/** Is the DM typing somewhere (so single keys aren't shortcuts)? */
export function typing(e: KeyboardEvent): boolean {
  const t = e.target as HTMLElement | null;
  return !!t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable);
}

/** The bar: keys 1-9 and 0, what's on each, what's live, and Recently shown. */
export function QuickBar({ onFind }: { onFind: (pinTo?: number) => void }) {
  const { view, run } = useDm();
  const s = view.state;
  const q = quickOf(s);
  const now = liveRef(s);
  const base = now?.replace(/^(map\/[^/]+)\/.*$/, "$1");
  const recent = (s.recent ?? []).filter((r) => resolveRef(s, r)).slice(0, 5);
  return (
    <div className="quick">
      <div className="quick-bar" role="group" aria-label="Quick bar: press a number key">
        {QUICK_KEYS.map((k) => {
          const ref = q[k];
          const a = resolveRef(s, ref);
          if (!a) {
            return (
              <button key={k} type="button" className="btn quick-slot empty" onClick={() => onFind(k)} aria-label={`Key ${k} is free: pin something`}>
                <span className="key">{keyName(k)}</span>
                <span className="note">+ pin</span>
              </button>
            );
          }
          const on = a.ref === now || a.ref === base;
          return (
            <span key={k} className={`quick-slot-wrap${on ? " on" : ""}`}>
              <button type="button" className={`btn quick-slot${on ? " on" : ""}${a.scene?.reveal ? " reveal-btn" : ""}`} aria-pressed={on} onClick={() => run({ type: "show", ref: a.ref })} title={a.ref}>
                <span className="key">{keyName(k)}</span>
                <span className="quick-text">
                  <span className="quick-label">{a.label}</span>
                  <span className="quick-sub">{a.sub ?? a.group}</span>
                </span>
              </button>
              <button type="button" className="chip-x quick-x" aria-label={`Take ${a.label} off key ${k}`} onClick={() => run({ type: "quick.set", key: k, ref: null })}>
                ×
              </button>
            </span>
          );
        })}
      </div>
      <div className="quick-row">
        <button type="button" className="btn small" onClick={() => onFind()}>
          <span className="key">/</span> Find anything to show
        </button>
        {recent.length ? <span className="note">Recently:</span> : null}
        {recent.map((r) => {
          const a = resolveRef(s, r)!;
          return (
            <button key={r} type="button" className="btn small quick-recent" onClick={() => run({ type: "show", ref: r })} title={r}>
              {a.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * The finder. Type a few letters, ↑ ↓ to pick, Enter shows it. Shift+Enter pins it
 * to the first free key (or to pinTo, when it was opened from an empty slot).
 */
export function Finder({ pinTo, onClose }: { pinTo?: number; onClose: () => void }) {
  const { view, run } = useDm();
  const s = view.state;
  const [qs, setQs] = useState("");
  const [at, setAt] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const hits = useMemo(() => findAssets(s, qs, 12), [s, qs]);
  useEffect(() => input.current?.focus(), []);
  useEffect(() => setAt(0), [qs]);

  const pin = (a: Asset) => {
    const k = pinTo ?? freeQuickKey(s);
    if (k === null) return void run({ type: "show", ref: a.ref }, "Every key is taken, so it's just on the TV.");
    void run({ type: "quick.set", key: k, ref: a.ref }, `${a.label} is on key ${k}.`);
  };
  const pick = (a: Asset | undefined, pinIt: boolean) => {
    if (!a) return;
    onClose();
    if (pinIt) pin(a);
    else void run({ type: "show", ref: a.ref });
  };

  return (
    <div className="finder-scrim" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="finder" role="dialog" aria-modal="true" aria-label={pinTo !== undefined ? `Pin something to key ${pinTo}` : "Find anything to show"}>
        <input
          ref={input}
          className="fld finder-input"
          value={qs}
          placeholder={pinTo !== undefined ? `Pin to key ${pinTo}: a person, place, map, prop…` : "Show a person, place, map, pin, prop…"}
          aria-label="Search"
          aria-controls="finder-list"
          aria-activedescendant={hits[at] ? `finder-${at}` : undefined}
          onChange={(e) => setQs(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") setAt((i) => Math.min(hits.length - 1, i + 1));
            else if (e.key === "ArrowUp") setAt((i) => Math.max(0, i - 1));
            else if (e.key === "Enter") pick(hits[at], e.shiftKey || pinTo !== undefined);
            else if (e.key === "Escape") onClose();
            else return;
            e.preventDefault();
            e.stopPropagation();
          }}
        />
        <ul id="finder-list" className="finder-list" role="listbox" aria-label="Matches">
          {hits.map((a, i) => {
            const k = quickKeyOf(s, a.ref);
            return (
              <li key={a.ref} id={`finder-${i}`} role="option" aria-selected={i === at} className={i === at ? "on" : ""} onMouseEnter={() => setAt(i)} onMouseDown={(e) => (e.preventDefault(), pick(a, pinTo !== undefined || e.shiftKey))}>
                <span className="finder-label">{a.label}</span>
                <span className="note">
                  {a.sub ?? a.group}
                  {k !== null ? ` · key ${k}` : ""}
                </span>
                <code className="finder-ref">{a.ref}</code>
              </li>
            );
          })}
          {!hits.length ? <li className="note">Nothing called that. People, places and the rest live in Discovery; maps and props under Maps &amp; props.</li> : null}
        </ul>
        <p className="note hint">Enter shows it · Shift+Enter pins it to {pinTo !== undefined ? `key ${pinTo}` : "the first free key"} · Esc closes</p>
      </div>
    </div>
  );
}

/** Show it on the TV, and which number key it's on. Sits beside people, places, maps and props. */
export function ShowControls({ refName, label, disabled, title }: { refName: string; label: string; disabled?: boolean; title?: string }) {
  const { view, run } = useDm();
  const s = view.state;
  const q = quickOf(s);
  const mine = quickKeyOf(s, refName);
  return (
    <>
      <select
        className="fld small-select quick-key-select"
        aria-label={`Number key for ${label}`}
        title="Pin to a number key"
        value={mine === null ? "" : String(mine)}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "") {
            if (mine !== null) void run({ type: "quick.set", key: mine, ref: null });
          } else void run({ type: "quick.set", key: Number(v), ref: refName });
        }}
      >
        <option value="">No key</option>
        {QUICK_KEYS.map((k) => {
          const other = q[k] && q[k] !== refName ? resolveRef(s, q[k])?.label : undefined;
          return (
            <option key={k} value={k}>
              Key {k}
              {other ? ` (now ${other})` : ""}
            </option>
          );
        })}
      </select>
      <button className="btn small" type="button" disabled={disabled} title={title} onClick={() => run({ type: "show", ref: refName })}>
        Show
      </button>
    </>
  );
}

/** Number keys for the quick bar, "/" for the finder. Returns true if it handled the key. */
export function quickKey(e: KeyboardEvent, ctx: { show: (ref: string) => void; find: () => void; quick: (string | null)[] }): boolean {
  if (e.key === "/") {
    ctx.find();
    return true;
  }
  if (/^[0-9]$/.test(e.key) && !e.shiftKey) {
    const ref = ctx.quick[Number(e.key)];
    if (ref) ctx.show(ref);
    return true;
  }
  return false;
}
