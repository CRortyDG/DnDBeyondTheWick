import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";

/** The "⋯" button at the end of a list row: the row's less-used actions. */
export function RowMenu({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const pop = useRef<HTMLDivElement>(null);
  // Where the menu sits: it opens below the button, lined up with its right edge,
  // but slides sideways or flips above when that would put it off the screen
  // (on a phone the ⋯ often sits at the left, and the tab bar covers the bottom).
  const [place, setPlace] = useState<{ dx: number; up: boolean } | null>(null);
  useLayoutEffect(() => {
    if (!open) {
      setPlace(null);
      return;
    }
    const el = pop.current;
    const btn = button.current;
    if (!el || !btn) return;
    const margin = 8;
    const r = el.getBoundingClientRect();
    const b = btn.getBoundingClientRect();
    const right = b.right; // the menu's own right edge before any nudge
    const left = right - r.width;
    let dx = 0;
    if (left < margin) dx = margin - left;
    else if (right > window.innerWidth - margin) dx = window.innerWidth - margin - right;
    // The phone tab bar (and any other fixed bar at the bottom) isn't room.
    const bar = document.querySelector(".pm-bar");
    const floor = bar ? Math.min(window.innerHeight, bar.getBoundingClientRect().top) : window.innerHeight;
    const roomBelow = floor - b.bottom - margin;
    const roomAbove = b.top - margin - topBarBottom();
    const up = r.height > roomBelow && roomAbove > roomBelow;
    setPlace({ dx: Math.round(dx), up });
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      setOpen(false);
      button.current?.focus();
    };
    document.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey, true);
    };
  }, [open]);
  return (
    <div className="row-menu" ref={box}>
      <button ref={button} type="button" className={`btn small icon-only${open ? " on" : ""}`} aria-haspopup="menu" aria-expanded={open} aria-label={`More for ${label}`} title="More" onClick={() => setOpen((o) => !o)}>
        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <circle cx="5" cy="12" r="1.8" fill="currentColor" />
          <circle cx="12" cy="12" r="1.8" fill="currentColor" />
          <circle cx="19" cy="12" r="1.8" fill="currentColor" />
        </svg>
      </button>
      {open ? (
        <div
          ref={pop}
          className={`row-menu-pop${place?.up ? " up" : ""}`}
          style={place?.dx ? { transform: `translateX(${place.dx}px)` } : undefined}
          role="menu"
          aria-label={label}
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("button")) setOpen(false);
          }}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

/** The bottom of a fixed top bar, if one covers the top of the screen. */
function topBarBottom(): number {
  const top = document.querySelector(".pm-top, .dm-top");
  if (!top) return 0;
  const pos = getComputedStyle(top).position;
  return pos === "fixed" || pos === "sticky" ? Math.max(0, top.getBoundingClientRect().bottom) : 0;
}

export function MenuItem({ onClick, disabled, danger, title, children }: { onClick: () => unknown; disabled?: boolean; danger?: boolean; title?: string; children: ReactNode }) {
  return (
    <button type="button" role="menuitem" className={`row-menu-item${danger ? " danger" : ""}`} disabled={disabled} title={title} onClick={() => void onClick()}>
      {children}
    </button>
  );
}
