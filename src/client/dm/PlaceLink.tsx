"use client";

// Ties a map pin to a place in Discover, so the two move together: showing
// the pin finds the place, finding the place shows the pin, and hiding either
// hides the other (a Known place stays in Discover).

import { entriesOf, isFound, stageLabel } from "@/shared/discovery";
import type { Pin } from "@/shared/types";
import { useDm } from "./context";

const NEW = "__new";

export function PlaceLink({ sceneId, pin }: { sceneId: string; pin: Pin }) {
  const { view, run } = useDm();
  const places = entriesOf(view.state).filter((e) => e.kind === "place");
  const linked = places.find((e) => e.pin?.sceneId === sceneId && e.pin.pinId === pin.id);
  return (
    <label>
      Place in Discover
      <select
        className="fld"
        value={linked?.id ?? ""}
        onChange={async (ev) => {
          const v = ev.target.value;
          const at = { sceneId, pinId: pin.id };
          if (v === NEW) {
            await run({ type: "entry.add", entry: { kind: "place", name: pin.name.trim() || `Location ${pin.number}`, pin: at } }, "Added to Discover and tied to this pin.");
          } else if (v) {
            await run({ type: "entry.update", entryId: v, patch: { pin: at } }, "Tied to this pin.");
          } else if (linked) {
            await run({ type: "entry.update", entryId: linked.id, patch: { pin: null } }, "Untied.");
          }
        }}
      >
        <option value="">Not tied to a place</option>
        {places.map((e) => {
          const other = e.pin && !(e.pin.sceneId === sceneId && e.pin.pinId === pin.id);
          return (
            <option key={e.id} value={e.id}>
              {e.name} ({stageLabel(e.kind, e.stage)}){other ? ", moves from another pin" : ""}
            </option>
          );
        })}
        <option value={NEW}>+ New place from this pin</option>
      </select>
      <span className="note">
        {linked
          ? linked.stage === "known"
            ? `${linked.name} is Known, so hiding this pin leaves it in Discover.`
            : isFound(linked.stage) || linked.stage === "rumored"
              ? `Hiding this pin hides ${linked.name} in Discover too.`
              : `Showing this pin, or finding ${linked.name} in Discover, shows both.`
          : "Tie it to a place and the pin and the place show and hide together."}
      </span>
    </label>
  );
}
