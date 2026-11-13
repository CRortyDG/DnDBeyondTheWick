"use client";

import { useEffect, useState } from "react";
import { InspirationIcon } from "../ui/icons";
import { useDm } from "./context";

/** One tap gives or spends Heroic Inspiration. Flips instantly; the server catches up. */
export function InspireToggle({ playerId, name, on, compact }: { playerId: string; name: string; on: boolean; compact?: boolean }) {
  const { run } = useDm();
  const [pending, setPending] = useState<boolean | null>(null);
  useEffect(() => {
    if (pending !== null && pending === on) setPending(null);
  }, [on, pending]);
  const shown = pending ?? on;
  return (
    <button
      type="button"
      className={`btn small insp-btn${shown ? " on" : ""}`}
      aria-pressed={shown}
      aria-label={`Heroic Inspiration for ${name}`}
      title={shown ? `${name} has Heroic Inspiration. Tap when it's spent.` : `Give ${name} Heroic Inspiration`}
      onClick={async () => {
        const next = !shown;
        setPending(next);
        if (!(await run({ type: "player.inspire", playerId, on: next }))) setPending(null);
      }}
    >
      <InspirationIcon size={20} />
      {compact ? null : <span>{shown ? "Inspired" : "Inspiration"}</span>}
    </button>
  );
}
