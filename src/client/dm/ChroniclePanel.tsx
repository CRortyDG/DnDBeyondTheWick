"use client";

import { Chronicle } from "../ui/Chronicle";
import { useDm } from "./context";

/** The DM's Chronicle: every note, with stars, hiding and the note-taker. */
export function ChroniclePanel() {
  const { view, call } = useDm();
  return (
    <div className="chron-dm">
      <p className="note">
        The table&rsquo;s shared story notes. Players see everything here except notes you hide, and your recap once a session has ended. Star the notes that matter; you can put starred notes on the TV with &ldquo;Previously on&hellip;&rdquo;.
      </p>
      <Chronicle view={view.chronicle} gameName={view.state.name} send={async (c) => (await call(c as never)).error} />
    </div>
  );
}
