"use client";

// "Reveal…" next to the last dice roll: a good Insight check turns straight into
// a fact on the TV, or someone found, without leaving the tray.

import { useState } from "react";
import { entriesOf, isFound, kindInfo } from "@/shared/discovery";
import { useDm } from "./context";

export function RevealPicker({ total }: { total: number }) {
  const { view, run } = useDm();
  const [open, setOpen] = useState(false);
  const entries = entriesOf(view.state);
  const facts = entries.flatMap((e) => (e.stage === "hidden" ? [] : e.facts.filter((f) => f.revealedAt === undefined).map((f) => ({ e, f }))));
  const unfound = entries.filter((e) => !isFound(e.stage));
  if (!open) {
    return (
      <button type="button" className="btn small" onClick={() => setOpen(true)} disabled={!facts.length && !unfound.length} title="Reveal a fact or find someone, on the TV">
        Reveal&hellip;
      </button>
    );
  }
  return (
    <select
      className="fld small-select"
      autoFocus
      aria-label={`Rolled ${total}: reveal`}
      value=""
      onBlur={() => setOpen(false)}
      onChange={async (ev) => {
        const v = ev.target.value;
        if (!v) return;
        setOpen(false);
        const [what, entryId, factId] = v.split("|");
        const e = entries.find((x) => x.id === entryId);
        if (what === "fact" && e) {
          const f = e.facts.find((x) => x.id === factId);
          await run({ type: "entry.factReveal", entryId, factId, revealed: true, tv: true }, `${total}: revealed “${f?.text.slice(0, 60) ?? "a fact"}” on the TV.`);
        } else if (e) {
          await run({ type: "entry.stage", entryId, stage: "found", announce: true }, `${total}: ${e.name} is ${kindInfo(e.kind).found.toLowerCase()}.`);
        }
      }}
    >
      <option value="">Rolled {total}: reveal…</option>
      {facts.length ? (
        <optgroup label="A locked fact">
          {facts.map(({ e, f }) => (
            <option key={f.id} value={`fact|${e.id}|${f.id}`}>
              {e.name}: {f.text.length > 70 ? `${f.text.slice(0, 70)}…` : f.text}
            </option>
          ))}
        </optgroup>
      ) : null}
      {unfound.length ? (
        <optgroup label="Find">
          {unfound.map((e) => (
            <option key={e.id} value={`stage|${e.id}`}>
              {kindInfo(e.kind).label}: {e.name}
              {e.stage === "rumored" ? " (rumored)" : ""}
            </option>
          ))}
        </optgroup>
      ) : null}
    </select>
  );
}
