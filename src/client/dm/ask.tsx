"use client";

import { useEffect, useRef, useState } from "react";

/**
 * In-app replacements for window.confirm() and window.prompt() on the DM's
 * screens. A browser popup looks like an error, freezes the page (and the TV
 * preview with it) and can't be styled; this is a small dialog in the
 * console's own look. `ask()` resolves true or false, `askText()` the typed
 * text or null. <AskHost /> must be mounted once (DmApp does it); without it
 * they fall back to the browser's own popups.
 */
export interface AskOptions {
  /** The confirm button. Default: the question's first word when it's a verb ("Delete", "Cancel"...), else "OK". */
  yes?: string;
  no?: string;
  /** Red confirm button. Default: true for deleting, throwing away, revoking and the like. */
  danger?: boolean;
  /** One more line under the question. */
  detail?: string;
}

interface TextOptions extends AskOptions {
  value?: string;
  placeholder?: string;
  /** The typed text must be exactly this to confirm (a "type RESET" guard). */
  mustBe?: string;
}

type Pending = { text: string; o: TextOptions; input: boolean; done: (v: string | null) => void };

let open: ((p: Pending) => void) | null = null;

const VERBS = ["Delete", "Cancel", "Throw", "Take", "Stop", "Revoke", "Approve", "Reject", "Replace", "Make", "Put", "Save", "Start", "Begin", "Undo", "Dismiss", "Let", "Remove", "Clear", "Reset", "Restore", "End"];
const DANGER = new Set(["Delete", "Throw", "Revoke", "Reject", "Replace", "Remove", "Clear", "Reset", "Put", "Restore", "Make"]);

function firstVerb(text: string): string | null {
  const w = text.trim().split(/\s+/)[0]?.replace(/[^A-Za-z]/g, "") ?? "";
  return VERBS.includes(w) ? w : null;
}

export function ask(text: string, o: AskOptions = {}): Promise<boolean> {
  if (!open) return Promise.resolve(window.confirm(text));
  return new Promise((res) => open!({ text, o, input: false, done: (v) => res(v !== null) }));
}

export function askText(text: string, o: TextOptions = {}): Promise<string | null> {
  if (!open) {
    const v = window.prompt(text, o.value ?? "");
    return Promise.resolve(o.mustBe !== undefined && v !== o.mustBe ? null : v);
  }
  return new Promise((res) => open!({ text, o, input: true, done: res }));
}

export function AskHost() {
  const [queue, setQueue] = useState<Pending[]>([]);
  const cur = queue[0];
  const [value, setValue] = useState("");
  const yesRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    open = (p) => setQueue((q) => [...q, p]);
    return () => {
      open = null;
    };
  }, []);
  useEffect(() => {
    if (!cur) return;
    setValue(cur.o.value ?? "");
    const prev = document.activeElement as HTMLElement | null;
    const t = setTimeout(() => (cur.input ? inputRef.current?.select() : yesRef.current?.focus()), 0);
    return () => {
      clearTimeout(t);
      prev?.focus?.();
    };
  }, [cur]);
  if (!cur) return null;

  const verb = firstVerb(cur.text);
  const yes = cur.o.yes ?? (verb ? (verb === "Throw" ? "Throw away" : verb === "Take" ? "Take back" : verb === "Let" ? "Yes" : verb) : "OK");
  const danger = cur.o.danger ?? (verb ? DANGER.has(verb) : false);
  const blocked = cur.input && cur.o.mustBe !== undefined && value.trim() !== cur.o.mustBe;
  const finish = (ok: boolean) => {
    if (ok && blocked) return;
    cur.done(ok ? (cur.input ? value : "") : null);
    setQueue((q) => q.slice(1));
  };

  return (
    <div
      className="ask-scrim"
      role="presentation"
      onPointerDown={(e) => e.target === e.currentTarget && finish(false)}
      onKeyDownCapture={(e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          finish(false);
        } else if (e.key === "Enter" && cur.input) {
          e.preventDefault();
          e.stopPropagation();
          finish(true);
        }
        // Keep the console's own shortcuts (Space, digits, letters) out of the dialog.
        e.stopPropagation();
      }}
    >
      <div className="ask-box" role="alertdialog" aria-modal="true" aria-labelledby="ask-text">
        <p id="ask-text" className="ask-text">
          {cur.text}
        </p>
        {cur.o.detail ? <p className="note">{cur.o.detail}</p> : null}
        {cur.input ? (
          <input ref={inputRef} className="fld" value={value} placeholder={cur.o.placeholder} aria-label={cur.text} onChange={(e) => setValue(e.target.value)} />
        ) : null}
        <div className="ask-actions">
          <button type="button" className="btn" onClick={() => finish(false)}>
            {cur.o.no ?? "Cancel"}
          </button>
          <button ref={yesRef} type="button" className={`btn ${danger ? "danger" : "primary"}`} disabled={blocked} onClick={() => finish(true)}>
            {yes}
          </button>
        </div>
      </div>
    </div>
  );
}
