import type { ReactNode } from "react";
import { CandleIcon } from "./icons";

/** A single parchment notice pinned to the board: used for "who are you?", errors and waiting screens. */
export function Notice({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <main className="notice-page">
      <section className="notice-sheet">
        <div className="card-pin" aria-hidden="true" />
        <CandleIcon size={40} className="notice-candle" />
        <h1>{title}</h1>
        {children}
      </section>
    </main>
  );
}
