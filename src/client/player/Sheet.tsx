"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

/**
 * A bottom sheet for the phone: slides up over the page, closes on the
 * backdrop, Escape or the close button, and keeps focus inside while open.
 */
export function Sheet({
  title,
  onClose,
  children,
  className,
  label,
}: {
  title?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  /** Accessible name when the title isn't plain text. */
  label?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;

  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") close.current();
    };
    window.addEventListener("keydown", key);
    // The page behind shouldn't scroll while a sheet is up.
    const body = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", key);
      document.body.style.overflow = body;
      before?.focus?.();
    };
  }, []);

  return (
    <div className="sheet-backdrop pl-sheet-backdrop" onClick={() => close.current()}>
      <div
        className={`sheet pl-sheet${className ? ` ${className}` : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={label ?? (typeof title === "string" ? title : undefined)}
        tabIndex={-1}
        ref={ref}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pl-sheet-grab" aria-hidden="true" />
        {title ? (
          <div className="pl-sheet-head">
            <h2>{title}</h2>
            <button type="button" className="pl-sheet-x" aria-label="Close" onClick={() => close.current()}>
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        ) : null}
        {children}
      </div>
    </div>
  );
}

type Ask = { title: string; body?: ReactNode; yes: string; no?: string; danger?: boolean };

/**
 * In-page replacement for window.confirm(): `ask()` opens a sheet and
 * resolves true or false. Render `sheet` somewhere in the component.
 */
export function useConfirm(): [ReactNode, (a: Ask) => Promise<boolean>] {
  const [open, setOpen] = useState<(Ask & { done: (ok: boolean) => void }) | null>(null);
  const ask = useCallback((a: Ask) => new Promise<boolean>((done) => setOpen({ ...a, done })), []);
  const finish = (ok: boolean) => {
    open?.done(ok);
    setOpen(null);
  };
  const sheet = open ? (
    <Sheet title={open.title} onClose={() => finish(false)} className="pl-confirm">
      {open.body ? <div className="pl-sheet-body">{open.body}</div> : null}
      <div className="pl-sheet-actions">
        <button type="button" className="btn" onClick={() => finish(false)}>
          {open.no ?? "Not now"}
        </button>
        <button type="button" className={`btn ${open.danger ? "danger" : "primary"}`} onClick={() => finish(true)}>
          {open.yes}
        </button>
      </div>
    </Sheet>
  ) : null;
  return [sheet, ask];
}
