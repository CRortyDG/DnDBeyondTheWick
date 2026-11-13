"use client";

import { useEffect, useId, useState } from "react";

/**
 * A text field that saves when you leave it or press Enter, and follows the
 * server's value when someone else changes it. onCommit may return false to
 * reject the input (it snaps back).
 */
export function Field({
  label,
  value,
  onCommit,
  multiline,
  placeholder,
  hint,
  type = "text",
}: {
  label: string;
  value: string;
  onCommit: (v: string) => unknown;
  multiline?: boolean;
  placeholder?: string;
  hint?: string;
  type?: string;
}) {
  const [v, setV] = useState(value);
  const [focused, setFocused] = useState(false);
  const id = useId();
  useEffect(() => {
    if (!focused) setV(value);
  }, [value, focused]);

  const commit = () => {
    setFocused(false);
    if (v === value) return;
    const r = onCommit(v);
    if (r === false) setV(value);
  };
  const common = {
    id,
    className: "fld",
    value: v,
    placeholder,
    "aria-describedby": hint ? id + "-hint" : undefined,
    onFocus: () => setFocused(true),
    onBlur: commit,
  };
  return (
    <label htmlFor={id}>
      {label}
      {multiline ? (
        <textarea {...common} rows={2} onChange={(e) => setV(e.target.value)} />
      ) : (
        <input
          {...common}
          type={type}
          onChange={(e) => setV(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            if (e.key === "Escape") {
              setV(value);
              setTimeout(() => (e.target as HTMLInputElement).blur());
            }
          }}
        />
      )}
      {hint ? (
        <span id={id + "-hint"} className="note">
          {hint}
        </span>
      ) : null}
    </label>
  );
}
