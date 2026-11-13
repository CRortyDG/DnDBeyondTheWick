"use client";

import { useState } from "react";

/** Text that turns into an input when you click it. Enter or leaving saves; Esc cancels. */
export function InlineText({
  value,
  placeholder,
  onCommit,
  className = "",
  maxLength,
  label,
}: {
  value: string;
  placeholder: string;
  onCommit: (v: string) => unknown;
  className?: string;
  maxLength?: number;
  label: string;
}) {
  const [editing, setEditing] = useState(false);
  const [v, setV] = useState(value);
  const start = () => {
    setV(value);
    setEditing(true);
  };

  if (editing) {
    return (
      <input
        className="fld inline-input"
        aria-label={label}
        value={v}
        maxLength={maxLength}
        autoFocus
        onChange={(e) => setV(e.target.value)}
        onBlur={() => {
          setEditing(false);
          if (v.trim() !== value.trim()) onCommit(v.trim());
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") {
            setV(value);
            setEditing(false);
          }
        }}
      />
    );
  }
  return (
    <span
      role="button"
      tabIndex={0}
      aria-label={`${label}: ${value || "empty"}. Click to edit.`}
      className={`inline-text ${className}${value ? "" : " empty"}`}
      onClick={start}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          start();
        }
      }}
    >
      {value || placeholder}
    </span>
  );
}
