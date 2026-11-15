import { useEffect, useRef, useState, type ReactNode } from "react";

/** The "⋯" button at the end of a list row: the row's less-used actions. */
export function RowMenu({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
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
          className="row-menu-pop"
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

export function MenuItem({ onClick, disabled, danger, title, children }: { onClick: () => unknown; disabled?: boolean; danger?: boolean; title?: string; children: ReactNode }) {
  return (
    <button type="button" role="menuitem" className={`row-menu-item${danger ? " danger" : ""}`} disabled={disabled} title={title} onClick={() => void onClick()}>
      {children}
    </button>
  );
}
