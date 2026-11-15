import { useCallback, useEffect, useRef, useState } from "react";

/**
 * A text box that saves a while after you stop typing, and when you leave it.
 * It follows the server (another device) while nothing here is unsaved. If
 * another screen saved different words while you were typing here, neither
 * is lost: theirs go under yours.
 */
export function useAutosave(value: string, save: (v: string) => Promise<unknown>, delay = 800) {
  const [text, setText] = useState(value);
  const [state, setState] = useState<"saved" | "typing" | "saving">("saved");
  const latest = useRef({ text, value, save });
  latest.current = { text, value, save };
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirty = useRef(false);
  /** What the server had when typing here started. */
  const base = useRef(value);

  const flush = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    if (!dirty.current) return;
    dirty.current = false;
    setState("saving");
    let out = latest.current.text;
    const theirs = latest.current.value;
    if (theirs !== base.current && theirs.trim() && !out.includes(theirs.trim())) {
      out = mergeTexts(out, theirs, base.current);
      setText(out);
    }
    base.current = out;
    await latest.current.save(out);
    setState(dirty.current ? "typing" : "saved");
  }, []);

  // Follow the server (another device) while we have nothing unsaved.
  useEffect(() => {
    if (!dirty.current) {
      setText(value);
      base.current = value;
    }
  }, [value]);
  useEffect(() => () => void flush(), [flush]);

  const onChange = (v: string) => {
    setText(v);
    dirty.current = true;
    setState("typing");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void flush(), delay);
  };
  return { text, onChange, flush, state };
}

/** Ours, then whatever the other screen added that we don't already have. */
export function mergeTexts(ours: string, theirs: string, base: string): string {
  const have = new Set(ours.split("\n").map((l) => l.trim()).filter(Boolean));
  const was = new Set(base.split("\n").map((l) => l.trim()).filter(Boolean));
  const added = theirs.split("\n").filter((l) => l.trim() && !have.has(l.trim()) && !was.has(l.trim()));
  return added.length ? `${ours.trimEnd()}\n\n${added.join("\n")}` : ours;
}
