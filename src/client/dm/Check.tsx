"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * A checkbox whose truth lives on the server. It flips the moment you tap it
 * and holds that until the server agrees (or 4 s pass), so it never flicks back.
 */
export function Check({ checked, onChange, children, className }: { checked: boolean; onChange: (v: boolean) => unknown; children: ReactNode; className?: string }) {
  const [pending, setPending] = useState<boolean | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (pending !== null && checked === pending) setPending(null);
  }, [checked, pending]);
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  return (
    <label className={`check${className ? " " + className : ""}`}>
      <input
        type="checkbox"
        checked={pending ?? checked}
        onChange={(e) => {
          const v = e.target.checked;
          setPending(v);
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(() => setPending(null), 4000);
          void Promise.resolve(onChange(v)).then((ok) => {
            if (ok === false) setPending(null);
          });
        }}
      />
      {children}
    </label>
  );
}
