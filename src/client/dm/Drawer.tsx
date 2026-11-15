import { useEffect, useRef, type ReactNode } from "react";

/**
 * An editor that slides in from the right, so the list behind it stays put.
 * It isn't modal: you can click another row to switch to it. Esc or the close
 * button closes it; a field you were typing in saves first (fields save on blur).
 */
export function Drawer({ title, subtitle, onClose, children, wide, closeLabel = "Done" }: { title: ReactNode; subtitle?: ReactNode; onClose: () => void; children: ReactNode; wide?: boolean; closeLabel?: string }) {
  const panel = useRef<HTMLElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const t = e.target as HTMLElement | null;
      // Esc inside a field undoes the typing (see Field); a second Esc closes.
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) {
        t.blur();
        return;
      }
      if (document.querySelector(".finder, .inbox-drawer, .map-editor-overlay")) return;
      e.stopPropagation();
      close.current();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, []);
  // Move focus into the drawer when it opens.
  useEffect(() => {
    panel.current?.focus({ preventScroll: true });
  }, []);
  const done = () => {
    const a = document.activeElement as HTMLElement | null;
    if (a && panel.current?.contains(a)) a.blur();
    onClose();
  };
  return (
    <aside ref={panel} className={`dm-drawer${wide ? " wide" : ""}`} role="dialog" aria-modal="false" aria-label={typeof title === "string" ? title : "Editor"} tabIndex={-1}>
      <header className="dm-drawer-head">
        <div className="dm-drawer-title">
          <h2>{title}</h2>
          {subtitle ? <div className="note">{subtitle}</div> : null}
        </div>
        <button type="button" className={`btn small${closeLabel === "Done" ? " primary" : ""}`} onClick={done}>
          {closeLabel}
        </button>
      </header>
      <div className="dm-drawer-body">{children}</div>
    </aside>
  );
}
